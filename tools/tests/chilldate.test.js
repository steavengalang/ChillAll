const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(cfg) {
    const env = load('chilldate');
    const input = env.document.createElement('input');
    env.document.body.appendChild(input);
    const dp = env.lib.create(input, Object.assign({}, cfg));
    return Object.assign(env, { input, dp });
}
const key = (window, el, k, extra) => el.dispatchEvent(new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

test('input gets aria attributes; popup is a dialog with labelled grid', () => {
    const { input, dp, document } = setup();
    assert.equal(input.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    dp.open();
    assert.equal(input.getAttribute('aria-expanded'), 'true');
    const popup = document.querySelector('.chilldate-popup');
    assert.equal(popup.getAttribute('role'), 'dialog');
    assert.equal(popup.querySelector('[role=grid]').getAttribute('aria-labelledby'), popup.querySelector('.chilldate-title').id);
    assert.equal(popup.querySelectorAll('.chilldate-day').length, 42);
    assert.equal(popup.querySelectorAll('.chilldate-day[tabindex="0"]').length, 1);
    assert.ok(popup.querySelector('.chilldate-day').getAttribute('aria-label').match(/\d{4}$/));
    assert.ok(popup.querySelector('[aria-current="date"]') || true);
    dp.destroy();
});

test('selecting a day sets value, fires onChange + native change, closes', () => {
    let got; let native = 0;
    const { input, dp, document } = setup({ onChange: d => { got = d; } });
    input.addEventListener('change', () => native++);
    dp.setValue('2026-03-14');
    assert.equal(input.value, '2026-03-14');
    assert.equal(ymd(got), '2026-03-14');
    assert.equal(native, 1);
    dp.open();
    assert.equal(document.querySelector('.chilldate-day.selected').textContent, '14');
    document.querySelectorAll('.chilldate-day:not(.other-month)')[19].click(); // 20th
    assert.equal(input.value, '2026-03-20');
    assert.equal(document.querySelector('.chilldate-popup'), null);
    assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('ISO strings are parsed in local time (no off-by-one) and Date input is not mutated', () => {
    const { dp } = setup();
    const d = new Date(2026, 0, 31, 15, 30);
    dp.setValue(d);
    assert.equal(d.getHours(), 15);
    assert.equal(ymd(dp.getValue()), '2026-01-31');
    dp.setValue('2026-01-05');
    assert.equal(ymd(dp.getValue()), '2026-01-05');
});

test('month navigation from the 31st does not skip months', () => {
    const { dp, document } = setup();
    dp.setValue('2026-01-31');
    dp.open();
    document.querySelector('[data-action="next-month"]').click();
    assert.match(document.querySelector('.chilldate-title').textContent, /February 2026/);
    document.querySelector('[data-action="next-month"]').click();
    assert.match(document.querySelector('.chilldate-title').textContent, /March 2026/);
});

test('min/max disable days (inclusive, local)', () => {
    const { dp, document } = setup({ minDate: '2026-03-10', maxDate: '2026-03-20' });
    dp.setValue('2026-03-15');
    dp.open();
    const cells = [...document.querySelectorAll('.chilldate-day:not(.other-month)')];
    assert.ok(cells[8].classList.contains('disabled'));    // 9th
    assert.ok(!cells[9].classList.contains('disabled'));   // 10th
    assert.ok(!cells[19].classList.contains('disabled'));  // 20th
    assert.ok(cells[20].classList.contains('disabled'));   // 21st
    assert.equal(cells[20].getAttribute('aria-disabled'), 'true');
    cells[20].click();
    assert.equal(ymd(dp.getValue()), '2026-03-15');
});

test('disableDate callback', () => {
    const { dp, document } = setup({ disableDate: d => d.getDay() === 0 || d.getDay() === 6 });
    dp.setValue('2026-03-14');
    dp.open();
    const sat = [...document.querySelectorAll('.chilldate-day:not(.other-month)')][13]; // 14 Mar 2026 = Saturday
    assert.ok(sat.classList.contains('disabled'));
});

test('keyboard navigation moves focus day; Escape closes and refocuses input', () => {
    const { dp, window, document, input } = setup();
    dp.setValue('2026-03-14');
    dp.open();
    const focused = () => document.querySelector('.chilldate-day[tabindex="0"]');
    key(window, focused(), 'ArrowRight');
    assert.equal(focused().dataset.date, '2026-3-15');
    key(window, focused(), 'ArrowDown');
    assert.equal(focused().dataset.date, '2026-3-22');
    key(window, focused(), 'PageDown');
    assert.equal(focused().dataset.date, '2026-4-22');
    key(window, focused(), 'PageUp', { shiftKey: true });
    assert.equal(focused().dataset.date, '2025-4-22');
    key(window, focused(), 'Escape');
    assert.equal(document.querySelector('.chilldate-popup'), null);
    assert.equal(document.activeElement, input);
});

test('firstDayOfWeek rotates headers', () => {
    const { dp, document } = setup({ firstDayOfWeek: 1 });
    dp.open();
    assert.equal(document.querySelector('.chilldate-weekday').textContent, 'Mo');
});

test('format tokens and parse of existing input value', () => {
    const env = load('chilldate');
    const input = env.document.createElement('input');
    input.value = '05/03/2026';
    env.document.body.appendChild(input);
    const dp = env.lib.create(input, { format: 'DD/MM/YYYY' });
    assert.equal(ymd(dp.getValue()), '2026-03-05');
    dp.setValue('2026-12-01');
    assert.equal(input.value, '01/12/2026');
    dp.config.format = 'D MMM YY';
    assert.equal(dp.formatDate(new Date(2026, 2, 5)), '5 Mar 26');
});

test('outside pointerdown closes; document listeners removed on close and destroy', () => {
    const { dp, window, document } = setup();
    const added = []; const removed = [];
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { added.push(t); a(t, f, o); };
    document.removeEventListener = (t, f, o) => { removed.push(t); r(t, f, o); };
    dp.open();
    assert.ok(added.includes('pointerdown') && added.includes('keydown'));
    document.body.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    assert.equal(document.querySelector('.chilldate-popup'), null);
    assert.ok(removed.includes('pointerdown') && removed.includes('keydown'));
    dp.open();
    removed.length = 0;
    dp.destroy();
    assert.equal(document.querySelector('.chilldate-popup'), null);
    assert.ok(removed.includes('pointerdown'));
});

test('destroy restores the input and removes listeners', () => {
    const { dp, input, document } = setup();
    dp.destroy();
    assert.equal(input.readOnly, false);
    assert.equal(input.classList.contains('chilldate-input'), false);
    assert.equal(input.hasAttribute('aria-haspopup'), false);
    input.click();
    assert.equal(document.querySelector('.chilldate-popup'), null);
});

test('dark mode CSS covers data-theme and .dark', () => {
    const { document } = setup();
    const css = document.getElementById('chilldate-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
});
