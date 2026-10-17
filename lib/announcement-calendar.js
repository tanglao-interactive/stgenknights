// RFC 5545 text escaping and UTF-8 line folding.
export function escapeText(value = '') {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
export function foldLine(line) {
  let result = '', bytes = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character);
    if (bytes + size > 75) { result += '\r\n '; bytes = 1; }
    result += character;
    bytes += size;
  }
  return result;
}
const compact = value => value.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function calendarDate(value) {
  return value.length === 10 ? compact(value) : compact(new Date(value).toISOString());
}
export function createCalendar(announcement, siteUrl, now = new Date()) {
  const url = `${siteUrl}/announcements/${announcement.slug}/`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Council 14772//Announcements//EN', 'CALSCALE:GREGORIAN'];
  announcement.calendar.forEach((session, index) => {
    const allDay = session.start.length === 10;
    const type = allDay ? ';VALUE=DATE' : '';
    lines.push('BEGIN:VEVENT', `UID:${announcement.slug}-${index}@stgenknights.com`,
      `DTSTAMP:${calendarDate(now.toISOString())}`, `DTSTART${type}:${calendarDate(session.start)}`);
    if (session.end) lines.push(`DTEND${type}:${calendarDate(session.end)}`);
    lines.push(`SUMMARY:${escapeText(announcement.title)}`,
      `DESCRIPTION:${escapeText([announcement.description, ...(announcement.schedule || []), url].join('\n\n'))}`,
      `LOCATION:${escapeText(announcement.location)}`, `URL:${url}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function googleCalendarLinks(announcement, siteUrl) {
  return (announcement.calendar || []).map(session => {
    const allDay = session.start.length === 10;
    // Google needs an end value. A start-only timed event has zero duration;
    // visitors can choose its end time in Google's event editor.
    const end = session.end || (allDay
      ? new Date(Date.parse(session.start) + 86400000).toISOString().slice(0, 10)
      : session.start);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: announcement.title,
      dates: `${calendarDate(session.start)}/${calendarDate(end)}`,
      ctz: 'America/Los_Angeles',
      details: [announcement.description, ...(announcement.schedule || []),
        `${siteUrl}/announcements/${announcement.slug}/`].join('\n\n'),
      location: announcement.location || ''
    });
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', timeZone: allDay ? 'UTC' : 'America/Los_Angeles'
    }).format(new Date(session.start));
    return {
      url: `https://calendar.google.com/calendar/render?${params}`,
      label: announcement.calendar.length > 1 ? `Google Calendar (${dateLabel})` : 'Google Calendar'
    };
  });
}

export function outlookCalendarLinks(announcement, siteUrl) {
  return (announcement.calendar || []).map((session, index) => {
    const allDay = session.start.length === 10;
    const end = session.end || (allDay
      ? new Date(Date.parse(session.start) + 86400000).toISOString().slice(0, 10)
      : session.start);
    const params = new URLSearchParams({
      path: '/calendar/action/compose', rru: 'addevent',
      subject: announcement.title,
      startdt: allDay ? session.start : new Date(session.start).toISOString(),
      enddt: allDay ? end : new Date(end).toISOString(),
      allday: String(allDay),
      body: [announcement.description, ...(announcement.schedule || []),
        `${siteUrl}/announcements/${announcement.slug}/`].join('\n\n'),
      location: announcement.location || ''
    });
    return {
      url: `https://outlook.live.com/calendar/0/deeplink/compose?${params}`,
      label: googleCalendarLinks(announcement, siteUrl)[index].label.replace('Google Calendar', 'Outlook Calendar')
    };
  });
}
