'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

function key(window, el, k) {
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}
function ptr(window, target, type, x, y) {
    target.dispatchEvent(new window.MouseEvent(type, { clientX: x, clientY: y || 0, bubbles: true, cancelable: true }));
}
function stubRect(el, r) { el.getBoundingClientRect = () => Object.assign({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 }, r); }

test('chillslider creates DOM with slider role and ARIA', () => {
    const { lib, document } = load('chillslider');
    const s = lib.create({ min: 0, max: 50, value: 10, label: 'Volume' });
    document.body.appendChild(s.element);
    const th = document.querySelector('.chillslider-thumb');
    assert.equal(th.getAttribute('role'), 'slider');
    assert.equal(th.getAttribute('aria-valuenow'), '10');
    assert.equal(th.getAttribute('aria-valuemax'), '50');
    assert.equal(th.getAttribute('aria-label'), 'Volume');
    assert.equal(th.getAttribute('aria-orientation'), 'horizontal');
    s.destroy();
    assert.equal(document.querySelector('.chillslider'), null);
});

test('chillslider keyboard: arrows, Home/End, PageUp/PageDown, clamping', () => {
    const { lib, window, document } = load('chillslider');
    const changes = [];
    const s = lib.create({ min: 0, max: 100, step: 5, value: 50, onChange: v => changes.push(v) });
    document.body.appendChild(s.element);
    const th = document.querySelector('.chillslider-thumb');
    key(window, th, 'ArrowRight'); assert.equal(s.getValue(), 55);
    key(window, th, 'ArrowUp'); assert.equal(s.getValue(), 60);
    key(window, th, 'ArrowLeft'); assert.equal(s.getValue(), 55);
    key(window, th, 'PageUp'); assert.equal(s.getValue(), 100);
    key(window, th, 'Home'); assert.equal(s.getValue(), 0);
    key(window, th, 'ArrowLeft'); assert.equal(s.getValue(), 0);
    key(window, th, 'End'); assert.equal(s.getValue(), 100);
    key(window, th, 'PageDown'); assert.equal(s.getValue(), 50);
    assert.equal(th.getAttribute('aria-valuenow'), '50');
    eq(changes, [55, 60, 55, 100, 0, 100, 50]);
    s.destroy();
});

test('chillslider vertical: ArrowUp increases and orientation is vertical', () => {
    const { lib, window, document } = load('chillslider');
    const s = lib.create({ vertical: true, value: 10, container: document.body });
    const th = document.querySelector('.chillslider-thumb');
    assert.equal(th.getAttribute('aria-orientation'), 'vertical');
    key(window, th, 'ArrowUp');
    assert.equal(s.getValue(), 11);
    s.destroy();
});

test('chillslider snaps to step and respects float precision', () => {
    const { lib } = load('chillslider');
    const s = lib.create({ min: 0, max: 1, step: 0.1, value: 0.3 });
    s.setValue(0.34);
    assert.equal(s.getValue(), 0.3);
    s.setValue(0.36);
    assert.equal(s.getValue(), 0.4);
    s.setValue(99);
    assert.equal(s.getValue(), 1);
    s.destroy();
});

test('chillslider dual handles cannot cross and honour minGap', () => {
    const { lib, window, document } = load('chillslider');
    const s = lib.create({ value: [20, 40], minGap: 5, container: document.body });
    eq(s.getValue(), [20, 40]);
    const [lo, hi] = document.querySelectorAll('.chillslider-thumb');
    for (let i = 0; i < 30; i++) key(window, lo, 'ArrowRight');
    eq(s.getValue(), [35, 40]);
    for (let i = 0; i < 30; i++) key(window, hi, 'ArrowLeft');
    eq(s.getValue(), [35, 40]);
    assert.equal(hi.getAttribute('aria-valuemin'), '35');
    assert.equal(lo.getAttribute('aria-valuemax'), '40');
    s.setValue([80, 10]);
    eq(s.getValue(), [10, 80]);
    s.destroy();
});

test('chillslider pointer drag updates value, fires input then change once, and cleans up document listeners', () => {
    const { lib, window, document } = load('chillslider');
    const inputs = []; const changes = [];
    const s = lib.create({ min: 0, max: 100, value: 0, container: document.body,
        onInput: v => inputs.push(v), onChange: v => changes.push(v) });
    const track = document.querySelector('.chillslider-track');
    stubRect(track, { width: 200 });
    ptr(window, track, 'pointerdown', 50);
    assert.equal(s.getValue(), 25);
    ptr(window, document, 'pointermove', 100);
    assert.equal(s.getValue(), 50);
    ptr(window, document, 'pointermove', 400); // clamp
    assert.equal(s.getValue(), 100);
    ptr(window, document, 'pointerup', 400);
    eq(changes, [100]);
    assert.ok(inputs.length >= 3);
    ptr(window, document, 'pointermove', 20);
    assert.equal(s.getValue(), 100, 'no listener after pointerup');
    s.destroy();
});

test('chillslider dual: pointerdown picks the nearest thumb', () => {
    const { lib, window, document } = load('chillslider');
    const s = lib.create({ value: [10, 90], container: document.body });
    const track = document.querySelector('.chillslider-track');
    stubRect(track, { width: 100 });
    ptr(window, track, 'pointerdown', 80);
    ptr(window, document, 'pointerup', 80);
    eq(s.getValue(), [10, 80]);
    ptr(window, track, 'pointerdown', 20);
    ptr(window, document, 'pointerup', 20);
    eq(s.getValue(), [20, 80]);
    s.destroy();
});

test('chillslider disabled ignores input; marks and tooltip render', () => {
    const { lib, window, document } = load('chillslider');
    const s = lib.create({ value: 5, disabled: true, marks: [0, { value: 50, label: 'Half' }, 100], formatter: v => v + '%', container: document.body });
    const th = document.querySelector('.chillslider-thumb');
    key(window, th, 'ArrowRight');
    assert.equal(s.getValue(), 5);
    assert.equal(th.tabIndex, -1);
    assert.equal(th.getAttribute('aria-disabled'), 'true');
    assert.equal(document.querySelectorAll('.chillslider-mark').length, 3);
    assert.equal(document.querySelectorAll('.chillslider-mark-label')[1].textContent, 'Half');
    assert.equal(th.querySelector('.chillslider-tooltip').textContent, '5%');
    assert.equal(th.getAttribute('aria-valuetext'), '5%');
    s.setDisabled(false);
    key(window, th, 'ArrowRight');
    assert.equal(s.getValue(), 6);
    s.destroy();
});

test('chillslider setValue silent, on() events and hidden input name', () => {
    const { lib, document } = load('chillslider');
    let n = 0;
    const s = lib.create({ name: 'vol', container: document.body, onChange: () => n++ });
    const events = [];
    const off = s.on('change', v => events.push(v));
    s.setValue(30, true);
    assert.equal(n, 0);
    s.setValue(40);
    assert.equal(n, 1);
    eq(events, [40]);
    assert.equal(document.querySelector('input[name="vol"]').value, '40');
    off();
    s.setValue(41);
    eq(events, [40]);
    s.destroy();
});

test('chillslider.init mounts into a target and injects CSS once', () => {
    const { lib, document } = load('chillslider');
    document.body.innerHTML = '<div id="host"></div>';
    const a = lib.init('#host', { value: 3 });
    const b = lib.init(document.getElementById('host'), {});
    assert.equal(document.querySelectorAll('#host .chillslider').length, 2);
    assert.equal(document.querySelectorAll('#chillslider-styles').length, 1);
    assert.equal(lib.init('#nope', {}), null);
    a.destroy(); b.destroy();
    assert.equal(document.querySelectorAll('#host .chillslider').length, 0);
});
