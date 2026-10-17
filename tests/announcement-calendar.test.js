import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createCalendar, escapeText, foldLine } from '../lib/announcement-calendar.js';
const announcements = JSON.parse(readFileSync('_data/announcements.json'));
const calendar = slug => createCalendar(announcements.find(a => a.slug === slug), 'https://stgenknights.com');
test('Pacific winter and summer times export as the correct UTC instants', () => {
  assert.match(calendar('christmas-with-the-knights-2026'), /DTSTART:20261228T000000Z/);
  assert.match(calendar('living-rosary-october-2026'), /DTSTART:20261031T220000Z/);
  assert.doesNotMatch(calendar('christmas-with-the-knights-2026'), /DTEND/);
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
  assert.equal(url.searchParams.get('dates'), '20261228T000000Z/20261228T000000Z');
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
