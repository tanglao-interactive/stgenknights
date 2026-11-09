import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createCalendar, escapeText, foldLine } from '../lib/announcement-calendar.js';
const announcements = JSON.parse(readFileSync('_data/announcements.json'));
const calendar = slug => createCalendar(announcements.find(a => a.slug === slug), 'https://stgenknights.com');
test('Pacific winter and summer times export as the correct UTC instants', () => {
  assert.match(calendar('christmas-with-the-knights-2026'), /DTSTART:20261226T220000Z/);
  assert.match(calendar('living-rosary-october-2026'), /DTSTART:20261031T220000Z/);
  assert.match(calendar('christmas-with-the-knights-2026'), /DTEND:20261227T040000Z/);
});
test('two-day competitions export separate timed events and unknown shifts span the correct dates', () => {
  const competition = calendar('free-throw-championship-january-2027');
  assert.equal((competition.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(competition, /DTSTART:20270121T160000Z/);
  assert.match(competition, /DTEND:20270121T180000Z/);
  const shifts = calendar('special-olympics-fall-games-championship-november-2026');
  assert.match(shifts, /DTSTART;VALUE=DATE:20261114/);
  assert.match(shifts, /DTEND;VALUE=DATE:20261116/);
});
test('calendar text safely escapes separators and folds Unicode within 75 octets', () => {
  assert.equal(escapeText('A, B; C\\D\nE'), 'A\\, B\\; C\\\\D\\nE');
  const original = 'DESCRIPTION:' + 'é🎄'.repeat(50);
  const folded = foldLine(original);
  assert.equal(folded.replace(/\r\n /g, ''), original);
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});
test('every event calendar is built and linked from its announcement; birthday greetings have no calendar', () => {
  for (const item of announcements) {
    const page = readFileSync(`_site/announcements/${item.slug}/index.html`, 'utf8');
    const path = `/calendars/${item.slug}.ics`;
    if (item.calendar) {
      assert.ok(existsSync(`_site${path}`));
      assert.ok(page.includes(path));
      for (const slot of item.calendar) {
        assert.ok(!slot.end || Date.parse(slot.end) > Date.parse(slot.start));
      }
    } else assert.ok(!page.includes('Add to calendar'));
  }
});

test('Google links preserve Pacific times, details, locations and separate daily sessions', async () => {
  const { googleCalendarLinks } = await import('../lib/announcement-calendar.js');
  const find = slug => announcements.find(a => a.slug === slug);
  const christmas = find('christmas-with-the-knights-2026');
  const [link] = googleCalendarLinks(christmas, 'https://stgenknights.com');
  const url = new URL(link.url);
  assert.equal(url.origin, 'https://calendar.google.com');
  assert.equal(url.searchParams.get('dates'), '20261226T220000Z/20261227T040000Z');
  assert.equal(url.searchParams.get('ctz'), 'America/Los_Angeles');
  assert.equal(url.searchParams.get('text'), christmas.title);
  assert.equal(url.searchParams.get('location'), christmas.location);
  assert.ok(url.searchParams.get('details').includes('/announcements/christmas-with-the-knights-2026/'));
  const competition = googleCalendarLinks(find('free-throw-championship-january-2027'), 'https://stgenknights.com');
  assert.equal(competition.length, 2);
  assert.equal(competition[1].label, 'Google Calendar (Jan 21)');
  assert.equal(new URL(competition[1].url).searchParams.get('dates'), '20270121T160000Z/20270121T180000Z');
  const day = googleCalendarLinks(find('planning-meeting-agenda-october-6-2026'), 'https://stgenknights.com')[0];
  assert.equal(new URL(day.url).searchParams.get('dates'), '20261006/20261007');
  for (const item of announcements) {
    const page = readFileSync(`_site/announcements/${item.slug}/index.html`, 'utf8');
    assert.equal(page.includes('calendar.google.com/calendar/render?'), Boolean(item.calendar));
  }
});

test('Outlook links preserve UTC instants, all-day ranges, and event details', async () => {
  const { outlookCalendarLinks } = await import('../lib/announcement-calendar.js');
  const find = slug => announcements.find(a => a.slug === slug);
  const event = find('christmas-with-the-knights-2026');
  const url = new URL(outlookCalendarLinks(event, 'https://stgenknights.com')[0].url);
  assert.equal(url.origin, 'https://outlook.live.com');
  assert.equal(url.searchParams.get('startdt'), '2026-12-26T22:00:00.000Z');
  assert.equal(url.searchParams.get('enddt'), '2026-12-27T04:00:00.000Z');
  assert.equal(url.searchParams.get('allday'), 'false');
  assert.equal(url.searchParams.get('subject'), event.title);
  assert.equal(url.searchParams.get('location'), event.location);
  assert.ok(url.searchParams.get('body').includes(event.description));
  const multi = outlookCalendarLinks(find('free-throw-championship-january-2027'), 'https://stgenknights.com');
  assert.equal(multi.length, 2);
  assert.equal(multi[1].label, 'Outlook Calendar (Jan 21)');
  const allDay = new URL(outlookCalendarLinks(find('special-olympics-fall-games-championship-november-2026'), 'https://stgenknights.com')[0].url);
  assert.equal(allDay.searchParams.get('allday'), 'true');
  assert.equal(allDay.searchParams.get('startdt'), '2026-11-14');
  assert.equal(allDay.searchParams.get('enddt'), '2026-11-16');
});

test('announcement actions are labelled icon-and-text controls without dropdowns', () => {
  const listing = readFileSync('_site/announcements/index.html', 'utf8');
  for (const item of announcements) {
    const page = readFileSync(`_site/announcements/${item.slug}/index.html`, 'utf8');
    assert.ok(!page.includes('data-calendar-dropdown'));
    assert.ok(!page.includes('/js/announcement-calendar.js'));
    const actions = page.split('class="announcement-share-actions"')[1].split('</div>')[0];
    const controls = [...actions.matchAll(/<(a|button)\b([^>]*)>(.*?)<\/\1>/gs)];
    assert.equal(controls.length, item.calendar ? 5 + 2 * item.calendar.length : 4);
    for (const [, , attributes, content] of controls) {
      assert.match(attributes, /title="[^"]+"/);
      assert.match(attributes, /aria-label="[^"]+"/);
      assert.match(content, /aria-hidden="true"/);
      assert.match(content, /<span>[^<]+<\/span>$/);
    }
    if (item.calendar?.length > 1) {
      assert.match(actions, /title="Google Calendar \([^)]+\)"/);
      assert.match(actions, /title="Outlook Calendar \([^)]+\)"/);
    }
  }
  assert.ok(!listing.includes('data-calendar-dropdown'));
  assert.ok(listing.includes('/img/icons/google-calendar.png'));
  assert.ok(listing.includes('/img/icons/outlook-calendar.svg'));
  assert.ok(!listing.includes('fa-google'));
  assert.ok(!listing.includes('fa-windows'));
  assert.ok(existsSync('_site/img/icons/apple-calendar.png'));
  assert.ok(listing.includes('/img/icons/apple-calendar.png'));
  assert.ok(existsSync('_site/img/icons/google-calendar.png'));
  assert.ok(existsSync('_site/img/icons/outlook-calendar.svg'));
});


test('Simbang Gabi preserves the flyer time, location, and open-ended celebration', async () => {
  const event = announcements.find(item => item.slug === 'simbang-gabi-december-2026');
  assert.equal(event.date, '2026-12-15');
  assert.equal(event.image, '/img/announcements/simbang-gabi-december-2026.jpg');
  assert.deepEqual(event.calendar, [{ start: '2026-12-15T17:45:00-08:00' }]);
  assert.equal(event.location, 'Cathedral of Our Lady of the Angels, 555 W. Temple St., Los Angeles, CA 90012');
  const ics = calendar(event.slug);
  assert.match(ics, /DTSTART:20261216T014500Z/);
  assert.doesNotMatch(ics, /DTEND/);
  const page = readFileSync(`_site/announcements/${event.slug}/index.html`, 'utf8').match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
  assert.ok(page.includes(event.image));
  assert.ok(page.includes('Archbishop Jose H. Gomez'));
  assert.ok(!page.includes('Feed the Family'));
  assert.ok(!page.includes('December 21'));
  assert.ok(page.includes('divrod12@gmail.com'));
  assert.ok(page.includes('https://www.filminadla.org/'));
  assert.ok(readFileSync('_site/announcements/index.html', 'utf8').includes(`/announcements/${event.slug}/`));
  assert.ok(existsSync(`_site${event.image}`));
  const { googleCalendarLinks, outlookCalendarLinks } = await import('../lib/announcement-calendar.js');
  assert.equal(new URL(googleCalendarLinks(event, 'https://stgenknights.com')[0].url).searchParams.get('dates'), '20261216T014500Z/20261216T014500Z');
  assert.equal(new URL(outlookCalendarLinks(event, 'https://stgenknights.com')[0].url).searchParams.get('startdt'), '2026-12-16T01:45:00.000Z');
});

test('Simbang Gabi Feed the Family retains its separate December 21 breakfast details', async () => {
  const event = announcements.find(item => item.slug === 'simbang-gabi-feed-the-family-december-2026');
  assert.equal(event.date, '2026-12-21');
  assert.equal(event.image, '/img/announcements/simbang-gabi-feed-the-family-december-2026.jpg');
  assert.deepEqual(event.calendar, [{ start: '2026-12-21T05:30:00-08:00' }]);
  assert.equal(event.location, 'St. Genevieve Madonna Hall, 14061 Roscoe Blvd., Panorama City, CA 91402');
  const ics = calendar(event.slug);
  assert.match(ics, /DTSTART:20261221T133000Z/);
  assert.doesNotMatch(ics, /DTEND/);
  const page = readFileSync(`_site/announcements/${event.slug}/index.html`, 'utf8').match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
  assert.ok(page.includes(event.image));
  assert.ok(page.includes('Feed the Family'));
  assert.ok(page.includes('After Simbang Gabi — 5:30 a.m.'));
  assert.ok(page.includes('Soup or hot porridge and bread'));
  assert.ok(!page.includes('Archbishop Jose H. Gomez'));
  assert.ok(!page.includes('divrod12@gmail.com'));
  assert.ok(!page.includes('https://www.filminadla.org/'));
  assert.ok(!page.includes('December 15'));
  assert.ok(readFileSync('_site/announcements/index.html', 'utf8').includes(`/announcements/${event.slug}/`));
  assert.ok(existsSync(`_site${event.image}`));
  const { googleCalendarLinks, outlookCalendarLinks } = await import('../lib/announcement-calendar.js');
  assert.equal(new URL(googleCalendarLinks(event, 'https://stgenknights.com')[0].url).searchParams.get('dates'), '20261221T133000Z/20261221T133000Z');
  assert.equal(new URL(outlookCalendarLinks(event, 'https://stgenknights.com')[0].url).searchParams.get('startdt'), '2026-12-21T13:30:00.000Z');
});

test('both Simbang Gabi announcements have distinct flyers, pages, and calendar downloads', () => {
  const events = announcements.filter(item => item.slug.startsWith('simbang-gabi-'));
  assert.equal(events.length, 2);
  assert.equal(new Set(events.map(item => item.slug)).size, 2);
  assert.equal(new Set(events.map(item => item.image)).size, 2);
  const listing = readFileSync('_site/announcements/index.html', 'utf8');
  const sitemap = readFileSync('_site/sitemap.xml', 'utf8');
  const uids = [];
  for (const event of events) {
    assert.equal(event.largeFlyer, true);
    const pagePath = `/announcements/${event.slug}/`;
    const calendarPath = `/calendars/${event.slug}.ics`;
    assert.ok(listing.includes(pagePath));
    assert.ok(listing.includes(event.image));
    assert.ok(listing.includes(calendarPath));
    assert.ok(sitemap.includes(pagePath));
    const page = readFileSync(`_site${pagePath}index.html`, 'utf8');
    assert.ok(page.includes(event.image));
    assert.ok(page.includes(calendarPath));
    const ics = readFileSync(`_site${calendarPath}`, 'utf8').replace(/\r\n /g, '');
    assert.ok(ics.includes(`URL:https://stgenknights.com${pagePath}`));
    assert.ok(ics.includes(`SUMMARY:${event.title}`));
    uids.push(ics.match(/^UID:(.+)$/m)[1]);
  }
  assert.equal(new Set(uids).size, 2);
});


test('November 15 team notice is separate from the November 21 Fourth Degree event', () => {
  const event = announcements.find(item => item.slug === 'fourth-degree-exemplification-november-2026');
  assert.equal(event.date, '2026-11-21');
  assert.deepEqual(event.calendar, [{ start: '2026-11-21T09:30:00-08:00' }]);
  assert.equal(event.location, 'St. Lucy Catholic Church, 2301 Santa Fe Avenue, Long Beach, CA 90810');
  const page = readFileSync(`_site/announcements/${event.slug}/index.html`, 'utf8');
  assert.ok(page.includes('<h2 id="announcement-notice-heading">November 15 Exemplification Team Notice</h2>'));
  assert.ok(page.includes(event.notice.text));
  assert.ok(page.includes('Saturday, November 21, 2026'));
  assert.ok(page.includes('9:30 a.m.'));
  assert.match(calendar(event.slug), /DTSTART:20261121T173000Z/);
  assert.doesNotMatch(calendar(event.slug), /DTSTART:20261115/);
  const simbang = readFileSync('_site/announcements/simbang-gabi-december-2026/index.html', 'utf8');
  assert.ok(!simbang.includes('announcement-notice-heading'));
});
