'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const key = (w, el, k, extra) => {
    const e = new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra));
    el.dispatchEvent(e);
    return e;
};
const down = (w, el) => el.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
const up = (w) => w.document.dispatchEvent(new w.MouseEvent('pointerup', { bubbles: true }));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const type = (w, input, text) => { input.value = text; input.dispatchEvent(new w.Event('input', { bubbles: true })); };

test('chillnumberinput creates spinbutton + buttons with ARIA, destroys', () => {
    const { lib, document } = load('chillnumberinput');
    const n = lib.create({ value: 5, min: 0, max: 10, label: 'Qty', container: document.body });
    const input = document.querySelector('.chillnumberinput-input');
    assert.equal(input.getAttribute('role'), 'spinbutton');
    assert.equal(input.getAttribute('aria-valuenow'), '5');
    assert.equal(input.getAttribute('aria-valuemin'), '0');
    assert.equal(input.getAttribute('aria-valuemax'), '10');
    assert.equal(input.getAttribute('aria-label'), 'Qty');
    assert.equal(document.querySelector('.chillnumberinput-minus').getAttribute('aria-label'), 'Decrease');
    n.destroy();
    assert.equal(document.querySelector('.chillnumberinput'), null);
});

test('chillnumberinput buttons step, clamp, and disable at limits', () => {
    const { lib, document } = load('chillnumberinput');
    const seen = [];
    const n = lib.create({ value: 9, min: 0, max: 10, container: document.body, onChange: v => seen.push(v) });
    const minus = document.querySelector('.chillnumberinput-minus');
    const plus = document.querySelector('.chillnumberinput-plus');
    plus.click();
    assert.equal(n.getValue(), 10);
    assert.ok(plus.disabled);
    plus.click();
    assert.equal(n.getValue(), 10);
    n.setValue(0);
    assert.ok(minus.disabled);
    n.setValue(-50);
    assert.equal(n.getValue(), 0);
    n.setValue(500);
    assert.equal(n.getValue(), 10);
    assert.deepEqual(seen, [10, 0, 10]);
    n.destroy();
});

test('chillnumberinput keyboard: arrows, Shift, PageUp/PageDown', () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 20, step: 2, container: document.body });
    const input = n.input;
    assert.ok(key(window, input, 'ArrowUp').defaultPrevented);
    assert.equal(n.getValue(), 22);
    key(window, input, 'ArrowDown');
    key(window, input, 'ArrowDown');
    assert.equal(n.getValue(), 18);
    key(window, input, 'ArrowUp', { shiftKey: true });
    assert.equal(n.getValue(), 38);
    key(window, input, 'PageDown');
    assert.equal(n.getValue(), 18);
    n.destroy();
});

test('chillnumberinput precision from step and float safety', () => {
    const { lib, document } = load('chillnumberinput');
    const n = lib.create({ value: 0.1, step: 0.1, container: document.body });
    n.increment(); n.increment();
    assert.equal(n.getValue(), 0.3);
    assert.equal(n.input.value, '0.3');
    n.setValue(1.23456);
    assert.equal(n.getValue(), 1.2);
    const p = lib.create({ value: 2, precision: 2, container: document.body });
    assert.equal(p.input.value, '2.00');
    p.destroy(); n.destroy();
});

test('chillnumberinput typing: commits on blur, reverts garbage, empty -> null, onInput', () => {
    const { lib, window, document } = load('chillnumberinput');
    const inputs = [];
    const n = lib.create({ value: 5, min: 0, max: 100, container: document.body, onInput: v => inputs.push(v) });
    type(window, n.input, '42');
    assert.deepEqual(inputs, [42]);
    assert.equal(n.getValue(), 5, 'not committed yet');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 42);
    type(window, n.input, '9999');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 100);
    assert.equal(n.input.value, '100');
    type(window, n.input, 'abc');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 100);
    assert.equal(n.input.value, '100');
    type(window, n.input, '');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), null);
    assert.equal(n.input.getAttribute('aria-valuenow'), null);
    n.destroy();
});

test('chillnumberinput allowEmpty:false restores value on empty', () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 7, allowEmpty: false, container: document.body });
    type(window, n.input, '');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 7);
    assert.equal(n.input.value, '7');
    n.destroy();
});

test('chillnumberinput formatting: prefix/suffix/thousands and parsing back', () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 1234567.5, precision: 2, prefix: '$', suffix: ' USD', thousandSeparator: ',', container: document.body });
    assert.equal(n.input.value, '$1,234,567.50 USD');
    assert.equal(n.input.getAttribute('aria-valuetext'), '$1,234,567.50 USD');
    type(window, n.input, '$2,000.25 USD');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 2000.25);
    const eu = lib.create({ value: 1234.5, precision: 1, thousandSeparator: '.', decimalSeparator: ',', container: document.body });
    assert.equal(eu.input.value, '1.234,5');
    type(window, eu.input, '9.876,5');
    eu.input.dispatchEvent(new window.Event('blur'));
    assert.equal(eu.getValue(), 9876.5);
    n.destroy(); eu.destroy();
});

test('chillnumberinput custom formatter/parser', () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 50, formatter: v => v + '%', parser: t => parseFloat(t) || 0, container: document.body });
    assert.equal(n.input.value, '50%');
    type(window, n.input, '75%');
    n.input.dispatchEvent(new window.Event('blur'));
    assert.equal(n.getValue(), 75);
    n.destroy();
});

test('chillnumberinput hold-to-repeat steps repeatedly and stops on pointerup', async () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 0, holdDelay: 10, holdInterval: 10, container: document.body });
    const plus = document.querySelector('.chillnumberinput-plus');
    down(window, plus);
    assert.equal(n.getValue(), 1);
    await sleep(250);
    const mid = n.getValue();
    assert.ok(mid > 3, 'repeated: ' + mid);
    up(window);
    const after = n.getValue();
    await sleep(120);
    assert.equal(n.getValue(), after, 'stopped');
    n.destroy();
});

test('chillnumberinput hold stops at max and destroy clears timers', async () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 8, max: 10, holdDelay: 5, holdInterval: 10, container: document.body });
    down(window, document.querySelector('.chillnumberinput-plus'));
    await sleep(120);
    assert.equal(n.getValue(), 10);
    up(window);
    const m = lib.create({ value: 0, holdDelay: 5, holdInterval: 10, container: document.body });
    down(window, m.element.querySelector('.chillnumberinput-plus'));
    m.destroy();
    await sleep(100);
    assert.equal(m.getValue(), 1);
    n.destroy();
});

test('chillnumberinput holdToRepeat:false does a single step', async () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 0, holdToRepeat: false, holdDelay: 5, container: document.body });
    down(window, document.querySelector('.chillnumberinput-plus'));
    await sleep(80);
    assert.equal(n.getValue(), 1);
    n.destroy();
});

test('chillnumberinput wheel option', () => {
    const { lib, window, document } = load('chillnumberinput');
    const n = lib.create({ value: 5, wheel: true, container: document.body });
    const wheel = dy => n.input.dispatchEvent(new window.WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true }));
    wheel(-1);
    assert.equal(n.getValue(), 5, 'ignored when not focused');
    n.input.focus();
    wheel(-1);
    assert.equal(n.getValue(), 6);
    wheel(1); wheel(1);
    assert.equal(n.getValue(), 4);
    n.destroy();
    const m = lib.create({ value: 5, container: document.body });
    m.input.focus();
    m.input.dispatchEvent(new window.WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));
    assert.equal(m.getValue(), 5, 'wheel is off by default');
    m.destroy();
});

test('chillnumberinput from empty: increment starts at min or step; disabled/readonly block', () => {
    const { lib, window, document } = load('chillnumberinput');
    const a = lib.create({ min: 3, container: document.body });
    a.increment();
    assert.equal(a.getValue(), 3);
    const b = lib.create({ container: document.body });
    b.increment();
    assert.equal(b.getValue(), 1);
    const c = lib.create({ value: 4, disabled: true, container: document.body });
    c.increment();
    assert.equal(c.getValue(), 4);
    assert.ok(c.input.disabled);
    c.setDisabled(false);
    c.setReadonly(true);
    key(window, c.input, 'ArrowUp');
    assert.equal(c.getValue(), 4);
    assert.ok(c.input.readOnly);
    [a, b, c].forEach(x => x.destroy());
});

test('chillnumberinput hidden input, init, on() events', () => {
    const { lib, document } = load('chillnumberinput');
    document.body.innerHTML = '<div id="h"></div>';
    const n = lib.init('#h', { value: 3, name: 'qty', suffix: ' pcs' });
    assert.equal(document.querySelector('input[name="qty"]').value, '3');
    const got = [];
    const off = n.on('change', v => got.push(v));
    n.setValue(8);
    off();
    n.setValue(9);
    assert.deepEqual(got, [8]);
    assert.equal(document.querySelector('input[name="qty"]').value, '9');
    n.destroy();
    assert.equal(document.querySelector('#h .chillnumberinput'), null);
});
