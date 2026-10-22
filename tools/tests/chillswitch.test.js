'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

test('chillswitch.create: role=switch, aria-checked follows state, onChange, destroy', () => {
    const { lib, document } = load('chillswitch');
    const seen = [];
    const w = lib.create({ label: 'Notify', description: 'Push', onChange: c => seen.push(c) });
    document.body.appendChild(w);
    assert.equal(w.input.getAttribute('role'), 'switch');
    assert.equal(w.input.getAttribute('aria-checked'), 'false');
    assert.equal(w.input.getAttribute('aria-describedby'), w.querySelector('.chillswitch-description').id);
    w.input.click();
    eq(seen, [true]);
    assert.equal(w.input.getAttribute('aria-checked'), 'true');
    w.instance.setChecked(false);
    assert.equal(w.input.getAttribute('aria-checked'), 'false');
    assert.equal(seen.length, 1);
    w.destroy();
    assert.equal(document.querySelector('.chillswitch-wrapper'), null);
});

test('chillswitch Enter toggles (Space is native); disabled ignores', () => {
    const { lib, window, document } = load('chillswitch');
    const seen = [];
    const w = lib.create({ onChange: c => seen.push(c) });
    document.body.appendChild(w);
    const e = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    w.input.dispatchEvent(e);
    assert.ok(e.defaultPrevented);
    eq(seen, [true]);
    w.instance.setDisabled(true);
    w.input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    eq(seen, [true]);
    w.destroy();
});

test('chillswitch toggle() fires onChange; getValue keeps 0', () => {
    const { lib } = load('chillswitch');
    const seen = [];
    const w = lib.create({ value: 0, onChange: c => seen.push(c) });
    w.instance.toggle();
    eq(seen, [true]);
    assert.strictEqual(w.instance.getValue(), 0);
});

test('chillswitch is XSS-safe: label, description, trackLabels, color class, name/value', () => {
    const { lib, document } = load('chillswitch');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, description: evil, trackLabels: { on: evil, off: evil }, color: 'x" onclick="y', name: '"><b>', value: '"><i>', showIcons: true });
    document.body.appendChild(w);
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    assert.equal(document.querySelector('i'), null);
    assert.equal(w.getAttribute('onclick'), null);
    assert.equal(w.querySelector('.chillswitch-label').textContent, evil);
    assert.equal(w.querySelector('.chillswitch-track-label-on').textContent, evil);
    assert.ok(w.querySelector('.chillswitch-thumb-icon.on'));
    w.destroy();
});

test('chillswitch options: labelPosition start, trackLabels defaults, setColor', () => {
    const { lib } = load('chillswitch');
    const w = lib.create({ labelPosition: 'start', trackLabels: {}, color: 'success' });
    assert.ok(w.classList.contains('chillswitch-label-start'));
    assert.equal(w.querySelector('.chillswitch-track-label-on').textContent, 'ON');
    assert.equal(w.querySelector('.chillswitch-track-label-off').textContent, 'OFF');
    assert.ok(w.classList.contains('chillswitch-success'));
    w.instance.setColor('danger');
    assert.ok(!w.classList.contains('chillswitch-success') && w.classList.contains('chillswitch-danger'));
    w.instance.setColor('primary');
    assert.ok(!w.classList.contains('chillswitch-danger'));
});

test('chillswitch.init reuses and restores the checkbox, cleans listeners and ARIA', () => {
    const { lib, document } = load('chillswitch');
    document.body.innerHTML = '<form><input type="checkbox" id="s" name="n" checked data-k="1"></form>';
    const el = document.getElementById('s');
    const seen = [];
    const inst = lib.init('#s', { label: 'Dark', onChange: c => seen.push(c) });
    assert.equal(document.getElementById('s'), el);
    assert.equal(el.getAttribute('role'), 'switch');
    assert.equal(el.getAttribute('aria-checked'), 'true');
    assert.ok(inst.isChecked());
    el.click();
    eq(seen, [false]);
    inst.destroy();
    assert.equal(document.querySelector('.chillswitch-wrapper'), null);
    assert.equal(el.parentNode.tagName, 'FORM');
    assert.equal(el.getAttribute('role'), null);
    assert.equal(el.getAttribute('aria-checked'), null);
    assert.equal(el.getAttribute('data-k'), '1');
    el.click();
    assert.equal(seen.length, 1);
});

test('chillswitch CSS: data-theme dark, focus-visible, reduced motion, once', () => {
    const { lib, document } = load('chillswitch');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chillswitch-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
});
