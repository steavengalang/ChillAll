const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const cellOf = (document, iso) => document.querySelector('[data-date="' + iso + '"]:not([aria-hidden])');
const key = (window, el, k, extra) => el.dispatchEvent(new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));

test('chillcalendar renders a 6x7 grid with ARIA grid semantics', () => {
    const { lib, document } = load('chillcalendar');
    const cal = lib.create({ month: '2025-06-15', locale: 'en-US' });
    document.body.appendChild(cal.element);
    assert.equal(document.querySelector('[role=grid]') !== null, true);
    assert.equal(document.querySelectorAll('[role=columnheader]').length, 7);
    assert.equal(document.querySelectorAll('[role=gridcell]').length, 42);
    assert.equal(document.querySelectorAll('[role=row]').length, 7);
    assert.match(document.querySelector('.chillcalendar-title').textContent, /June 2025/i);
    assert.equal(document.querySelectorAll('[tabindex="0"][role=gridcell]').length, 1);
    cal.destroy();
    assert.equal(document.querySelector('.chillcalendar'), null);
});

test('chillcalendar weekStart shifts the first column', () => {
    const { lib, document } = load('chillcalendar');
    const sun = lib.create({ month: '2025-06-01', locale: 'en-US', weekStart: 0 });
    document.body.appendChild(sun.element);
    assert.equal(document.querySelector('.chillcalendar-row:nth-child(2) .chillcalendar-cell').getAttribute('data-date'), '2025-06-01');
    sun.destroy();
    const mon = lib.create({ month: '2025-06-01', locale: 'en-US', weekStart: 1 });
    document.body.appendChild(mon.element);
    assert.equal(document.querySelector('.chillcalendar-row:nth-child(2) .chillcalendar-cell').getAttribute('data-date'), '2025-05-26');
    assert.match(document.querySelector('.chillcalendar-dow').textContent, /Mon/);
    mon.destroy();
});

test('chillcalendar single selection fires onSelect and sets aria-selected', () => {
    const { lib, document } = load('chillcalendar');
    const got = [];
    const cal = lib.create({ month: '2025-06-01', onSelect: v => got.push(v) });
    document.body.appendChild(cal.element);
    cellOf(document, '2025-06-10').click();
    assert.equal(got.length, 1);
    assert.equal(got[0].getDate(), 10);
    assert.equal(cellOf(document, '2025-06-10').getAttribute('aria-selected'), 'true');
    cellOf(document, '2025-06-11').click();
    assert.equal(cellOf(document, '2025-06-10').getAttribute('aria-selected'), 'false');
    assert.equal(cal.getValue().getDate(), 11);
    cal.clear();
    assert.equal(cal.getValue(), null);
    cal.destroy();
});

test('chillcalendar range selection (incl. reverse order) and in-range paint', () => {
    const { lib, document } = load('chillcalendar');
    const cal = lib.create({ month: '2025-06-01', mode: 'range' });
    document.body.appendChild(cal.element);
    cellOf(document, '2025-06-20').click();
    assert.equal(cal.getValue().end, null);
    cellOf(document, '2025-06-15').click();
    const v = cal.getValue();
    assert.equal(v.start.getDate(), 15);
    assert.equal(v.end.getDate(), 20);
    assert.equal(document.querySelectorAll('.chillcalendar-inrange').length, 6);
    cellOf(document, '2025-06-01').click();   // third click restarts
    assert.equal(cal.getValue().end, null);
    assert.equal(document.querySelectorAll('.chillcalendar-inrange').length, 0);
    cal.destroy();
});

test('chillcalendar min/max/isDisabled block selection and nav', () => {
    const { lib, document } = load('chillcalendar');
    let n = 0;
    const cal = lib.create({ month: '2025-06-01', min: '2025-06-05', max: '2025-06-25', isDisabled: d => d.getDate() === 15, onSelect: () => n++ });
    document.body.appendChild(cal.element);
    cellOf(document, '2025-06-01').click();
    cellOf(document, '2025-06-15').click();
    cellOf(document, '2025-06-28').click();
    assert.equal(n, 0);
    assert.equal(cellOf(document, '2025-06-15').getAttribute('aria-disabled'), 'true');
    cellOf(document, '2025-06-06').click();
    assert.equal(n, 1);
    assert.equal(document.querySelector('.chillcalendar-prev').disabled, true);
    assert.equal(document.querySelector('.chillcalendar-next').disabled, true);
    cal.destroy();
});

test('chillcalendar keyboard grid navigation', () => {
    const { lib, document, window } = load('chillcalendar');
    const months = [];
    const cal = lib.create({ month: '2025-06-10', locale: 'en-US', onMonthChange: (y, m) => months.push([y, m]) });
    document.body.appendChild(cal.element);
    let cur = document.querySelector('[tabindex="0"][role=gridcell]');
    cur.focus();
    key(window, cur, 'ArrowRight');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-06-11');
    key(window, document.activeElement, 'ArrowDown');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-06-18');
    key(window, document.activeElement, 'ArrowUp');
    key(window, document.activeElement, 'ArrowLeft');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-06-10');
    key(window, document.activeElement, 'Home');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-06-08');   // Sunday
    key(window, document.activeElement, 'End');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-06-14');   // Saturday
    key(window, document.activeElement, 'PageDown');
    assert.equal(document.activeElement.getAttribute('data-date'), '2025-07-14');
    assert.match(document.querySelector('.chillcalendar-title').textContent, /July 2025/);
    key(window, document.activeElement, 'PageUp', { shiftKey: true });
    assert.equal(document.activeElement.getAttribute('data-date'), '2024-07-14');
    key(window, document.activeElement, 'Enter');
    assert.equal(cal.getValue().getFullYear(), 2024);
    assert.ok(months.length >= 2);
    cal.destroy();
});

test('chillcalendar events: dots/chips, escaping, click callback', () => {
    const { lib, document } = load('chillcalendar');
    const clicked = [];
    const events = [{ date: '2025-06-12', title: '<img src=x onerror=1>', color: '#f00' }, { date: '2025-06-12', title: 'B' }];
    const cal = lib.create({ month: '2025-06-01', events, eventDisplay: 'chips', maxEvents: 1, onEventClick: ev => clicked.push(ev.title) });
    document.body.appendChild(cal.element);
    assert.equal(document.querySelector('.chillcalendar img'), null);
    const chip = document.querySelector('.chillcalendar-event');
    assert.equal(chip.textContent, '<img src=x onerror=1>');
    assert.equal(document.querySelector('.chillcalendar-more').textContent, '+1');
    assert.match(cellOf(document, '2025-06-12').getAttribute('aria-label'), /2 events/);
    chip.click();
    assert.equal(clicked.length, 1);
    cal.destroy();

    const dots = lib.create({ month: '2025-06-01', events });
    document.body.appendChild(dots.element);
    assert.equal(cellOf(document, '2025-06-12').querySelectorAll('.chillcalendar-dot').length, 2);
    dots.addEvent({ date: new Date(2025, 5, 13), title: 'x' });
    assert.equal(cellOf(document, '2025-06-13').querySelectorAll('.chillcalendar-dot').length, 1);
    dots.destroy();
});

test('chillcalendar month navigation buttons and today', () => {
    const { lib, document } = load('chillcalendar');
    const cal = lib.create({ month: '2025-01-15', locale: 'en-US' });
    document.body.appendChild(cal.element);
    document.querySelector('.chillcalendar-prev').click();
    assert.deepEqual({ ...cal.getMonth() }, { year: 2024, month: 11 });
    document.querySelector('.chillcalendar-next').click();
    document.querySelector('.chillcalendar-next').click();
    assert.deepEqual({ ...cal.getMonth() }, { year: 2025, month: 1 });
    document.querySelector('.chillcalendar-today').click();
    const t = new Date();
    assert.deepEqual({ ...cal.getMonth() }, { year: t.getFullYear(), month: t.getMonth() });
    assert.ok(document.querySelector('[aria-current="date"]'));
    cal.destroy();
});
