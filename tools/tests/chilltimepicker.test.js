'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const opt = (document, kind, value) => document.querySelector('.chilltimepicker-col[data-kind="' + kind + '"] [data-value="' + value + '"]');

test('parse/format helpers', () => {
    const { lib } = load('chilltimepicker');
    assert.equal(lib.parse('9:05'), '09:05');
    assert.equal(lib.parse('2:30 PM'), '14:30');
    assert.equal(lib.parse('12:00 AM'), '00:00');
    assert.equal(lib.parse('12:15 pm'), '12:15');
    assert.equal(lib.parse('24:00'), null);
    assert.equal(lib.parse('10:75'), null);
    assert.equal(lib.parse('13:00 PM'), null);
    assert.equal(lib.parse(''), null);
    assert.equal(lib.format('14:30', true), '2:30 PM');
    assert.equal(lib.format('00:05', true), '12:05 AM');
    assert.equal(lib.format('14:30', false), '14:30');
});

test('chilltimepicker 24h inline: columns, ARIA, selection returns HH:mm', () => {
    const { lib, document } = load('chilltimepicker');
    const seen = [];
    const tp = lib.create({ value: '09:30', container: document.body, onChange: v => seen.push(v) });
    const cols = document.querySelectorAll('.chilltimepicker-col');
    assert.equal(cols.length, 2);
    assert.equal(cols[0].getAttribute('role'), 'listbox');
    assert.equal(document.querySelectorAll('.chilltimepicker-col[data-kind="hour"] [role="option"]').length, 24);
    assert.equal(document.querySelectorAll('.chilltimepicker-col[data-kind="minute"] [role="option"]').length, 60);
    assert.equal(opt(document, 'hour', 9).getAttribute('aria-selected'), 'true');
    assert.equal(tp.getValue(), '09:30');
    opt(document, 'hour', 14).click();
    assert.equal(tp.getValue(), '14:30');
    opt(document, 'minute', 5).click();
    assert.equal(tp.getValue(), '14:05');
    assert.deepEqual(seen, ['14:30', '14:05']);
    assert.equal(opt(document, 'minute', 5).getAttribute('aria-selected'), 'true');
    assert.equal(opt(document, 'minute', 30).getAttribute('aria-selected'), 'false');
    tp.destroy();
    assert.equal(document.querySelector('.chilltimepicker'), null);
});

test('chilltimepicker minuteStep snaps values and limits minute options', () => {
    const { lib, document } = load('chilltimepicker');
    const tp = lib.create({ value: '10:07', minuteStep: 15, container: document.body });
    assert.equal(tp.getValue(), '10:00');
    assert.equal(document.querySelectorAll('.chilltimepicker-col[data-kind="minute"] [role="option"]').length, 4);
    tp.setValue('10:53');
    assert.equal(tp.getValue(), '11:00');
    tp.setValue('nonsense');
    assert.equal(tp.getValue(), '11:00');
    tp.destroy();
});

test('chilltimepicker 12h: AM/PM column, conversion to 24h', () => {
    const { lib, document } = load('chilltimepicker');
    const tp = lib.create({ hour12: true, value: '00:15', container: document.body });
    assert.equal(document.querySelectorAll('.chilltimepicker-col').length, 3);
    assert.equal(opt(document, 'hour', 12).getAttribute('aria-selected'), 'true');
    assert.equal(opt(document, 'period', 'AM').getAttribute('aria-selected'), 'true');
    assert.equal(tp.getDisplay(), '12:15 AM');
    opt(document, 'period', 'PM').click();
    assert.equal(tp.getValue(), '12:15');
    opt(document, 'hour', 3).click();
    assert.equal(tp.getValue(), '15:15');
    opt(document, 'period', 'AM').click();
    assert.equal(tp.getValue(), '03:15');
    assert.equal(tp.getDisplay(), '3:15 AM');
    tp.destroy();
});

test('chilltimepicker from empty: first pick creates a value; clear resets', () => {
    const { lib, document } = load('chilltimepicker');
    const tp = lib.create({ container: document.body, name: 't' });
    assert.equal(tp.getValue(), '');
    opt(document, 'hour', 8).click();
    assert.equal(tp.getValue(), '08:00');
    assert.equal(document.querySelector('input[name="t"]').value, '08:00');
    tp.clear();
    assert.equal(tp.getValue(), '');
    assert.equal(document.querySelector('input[name="t"]').value, '');
    tp.destroy();
});

test('chilltimepicker min/max disable options and block selection', () => {
    const { lib, document } = load('chilltimepicker');
    const tp = lib.create({ value: '10:00', min: '09:00', max: '17:30', minuteStep: 30, container: document.body });
    assert.equal(opt(document, 'hour', 8).getAttribute('aria-disabled'), 'true');
    assert.equal(opt(document, 'hour', 9).getAttribute('aria-disabled'), null);
    assert.equal(opt(document, 'hour', 18).getAttribute('aria-disabled'), 'true');
    opt(document, 'hour', 8).click();
    assert.equal(tp.getValue(), '10:00');
    tp.setValue('17:00');
    assert.equal(opt(document, 'minute', 30).getAttribute('aria-disabled'), null);
    tp.setValue('17:30');
    opt(document, 'hour', 17).click();
    assert.equal(tp.getValue(), '17:30');
    tp.setValue('17:00');
    opt(document, 'hour', 17).click();
    tp.destroy();
});

test('chilltimepicker keyboard: arrows change value in column, left/right switch columns, Home/End', () => {
    const { lib, window, document } = load('chilltimepicker');
    const tp = lib.create({ value: '10:00', minuteStep: 5, container: document.body });
    const h10 = opt(document, 'hour', 10);
    h10.focus();
    assert.equal(h10.tabIndex, 0);
    key(window, h10, 'ArrowDown');
    assert.equal(tp.getValue(), '11:00');
    assert.equal(document.activeElement, opt(document, 'hour', 11));
    key(window, document.activeElement, 'ArrowUp');
    key(window, document.activeElement, 'ArrowUp');
    assert.equal(tp.getValue(), '09:00');
    key(window, document.activeElement, 'End');
    assert.equal(tp.getValue(), '23:00');
    key(window, document.activeElement, 'ArrowDown'); // at end: no wrap
    assert.equal(tp.getValue(), '23:00');
    key(window, document.activeElement, 'Home');
    assert.equal(tp.getValue(), '00:00');
    key(window, document.activeElement, 'ArrowRight');
    assert.equal(document.activeElement.parentNode.dataset.kind, 'minute');
    key(window, document.activeElement, 'ArrowDown');
    assert.equal(tp.getValue(), '00:05');
    key(window, document.activeElement, 'ArrowLeft');
    assert.equal(document.activeElement.parentNode.dataset.kind, 'hour');
    tp.destroy();
});

test('chilltimepicker popover: open/close, Esc, outside click, closeOnSelect, cleanup', () => {
    const { lib, window, document } = load('chilltimepicker');
    const tp = lib.create({ popover: true, value: '10:00', container: document.body });
    const trig = document.querySelector('.chilltimepicker-trigger');
    assert.equal(trig.textContent.trim(), '10:00');
    assert.equal(trig.getAttribute('aria-expanded'), 'false');
    assert.equal(document.querySelector('.chilltimepicker-panel'), null);
    trig.click();
    assert.ok(tp.isOpen());
    assert.equal(trig.getAttribute('aria-expanded'), 'true');
    assert.ok(document.querySelector('body > .chilltimepicker-panel'));
    key(window, document.body, 'Escape');
    assert.ok(!tp.isOpen());
    assert.equal(document.activeElement, trig);
    key(window, trig, 'ArrowDown');
    assert.ok(tp.isOpen());
    window.document.body.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    assert.ok(!tp.isOpen());
    tp.open();
    opt(document, 'minute', 45).click();       // minute is last column in 24h -> closes
    assert.equal(tp.getValue(), '10:45');
    assert.ok(!tp.isOpen());
    assert.equal(trig.textContent.trim(), '10:45');
    tp.open();
    tp.destroy();
    assert.equal(document.querySelector('.chilltimepicker-panel'), null);
    assert.equal(document.querySelector('.chilltimepicker'), null);
});

test('chilltimepicker popover placeholder, Now button, disabled', () => {
    const { lib, document } = load('chilltimepicker');
    const tp = lib.create({ popover: true, placeholder: 'Pick', container: document.body, disabled: true });
    const trig = document.querySelector('.chilltimepicker-trigger');
    assert.equal(trig.textContent.trim(), 'Pick');
    trig.click();
    assert.ok(!tp.isOpen());
    tp.setDisabled(false);
    tp.open();
    const now = [...document.querySelectorAll('.chilltimepicker-action')].find(b => b.textContent === 'Now');
    now.click();
    assert.match(tp.getValue(), /^\d\d:\d\d$/);
    tp.destroy();
});
