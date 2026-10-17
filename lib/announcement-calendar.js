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
