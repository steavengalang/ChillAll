'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const ptr = (w, t, type, x, y) => t.dispatchEvent(new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }));
const key = (w, el, k, extra) => el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));
const stubRect = (el, w, h) => { el.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: h, right: w, bottom: h }); };

test('colour maths: parse / convert round trips', () => {
    const { lib } = load('chillcolorpicker');
    assert.equal(lib.parse('#F00'), '#ff0000');
    assert.equal(lib.parse('3b82f6'), '#3b82f6');
    assert.equal(lib.parse('rgb(0, 128, 255)'), '#0080ff');
    assert.equal(lib.parse('hsl(120, 100%, 50%)'), '#00ff00');
    assert.equal(lib.parse('nope'), null);
    assert.equal(lib.parse('#12'), null);
    const rgb = lib.hexToRgb('#3b82f6');
    const hsv = lib.rgbToHsv(rgb.r, rgb.g, rgb.b);
    assert.equal(lib.toHex(lib.hsvToRgb(hsv.h, hsv.s, hsv.v)), '#3b82f6');
    assert.equal(lib.toHex(lib.hsvToRgb(0, 0, 1)), '#ffffff');
    assert.equal(lib.toHex(lib.hsvToRgb(240, 1, 1)), '#0000ff');
});

test('chillcolorpicker inline creates panel, aria, destroys', () => {
    const { lib, document } = load('chillcolorpicker');
    const cp = lib.create({ value: '#ff0000', container: document.body });
    assert.equal(cp.getValue(), '#ff0000');
    assert.equal(document.querySelector('.chillcolorpicker-area').getAttribute('role'), 'slider');
    assert.equal(document.querySelector('.chillcolorpicker-input').value, '#ff0000');
    assert.equal(document.querySelector('.chillcolorpicker-hue').getAttribute('aria-label'), 'Hue');
    assert.equal(document.querySelectorAll('.chillcolorpicker-swatch').length, 16);
    cp.destroy();
    assert.equal(document.querySelector('.chillcolorpicker'), null);
});

test('chillcolorpicker swatch click sets value and fires onChange once', () => {
    const { lib, document } = load('chillcolorpicker');
    const seen = [];
    const cp = lib.create({ value: '#000000', swatches: ['#ff0000', '#00ff00', 'nope'], container: document.body, onChange: v => seen.push(v) });
    const sw = document.querySelectorAll('.chillcolorpicker-swatch');
    assert.equal(sw.length, 2);
    sw[1].click();
    assert.equal(cp.getValue(), '#00ff00');
    assert.equal(sw[1].getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('.chillcolorpicker-input').value, '#00ff00');
    sw[1].click();
    assert.deepEqual(seen, ['#00ff00']);
    cp.destroy();
});

test('chillcolorpicker area drag changes saturation/value, commit on pointerup, listeners removed', () => {
    const { lib, window, document } = load('chillcolorpicker');
    const inputs = []; const changes = [];
    const cp = lib.create({ value: '#ff0000', container: document.body, onInput: v => inputs.push(v), onChange: v => changes.push(v) });
    const area = document.querySelector('.chillcolorpicker-area');
    stubRect(area, 100, 100);
    ptr(window, area, 'pointerdown', 100, 0);       // s=1,v=1 -> red
    assert.equal(cp.getValue(), '#ff0000');
    ptr(window, document, 'pointermove', 0, 0);     // s=0,v=1 -> white
    assert.equal(cp.getValue(), '#ffffff');
    ptr(window, document, 'pointermove', 0, 100);   // black
    assert.equal(cp.getValue(), '#000000');
    ptr(window, document, 'pointermove', 50, 50);
    assert.equal(cp.getValue(), '#804040');
    assert.equal(changes.length, 0);
    ptr(window, document, 'pointerup', 50, 50);
    assert.deepEqual(changes, ['#804040']);
    ptr(window, document, 'pointermove', 100, 0);
    assert.equal(cp.getValue(), '#804040');
    assert.ok(inputs.length >= 3);
    cp.destroy();
});

test('chillcolorpicker hue slider changes hue; hue survives grey', () => {
    const { lib, window, document } = load('chillcolorpicker');
    const cp = lib.create({ value: '#ff0000', container: document.body });
    const hue = document.querySelector('.chillcolorpicker-hue');
    hue.value = '240';
    hue.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(cp.getValue(), '#0000ff');
    hue.dispatchEvent(new window.Event('change', { bubbles: true }));
    cp.setValue('#808080');
    assert.equal(cp.getHsv().h, 240, 'hue preserved when colour becomes grey');
    cp.destroy();
});

test('chillcolorpicker hex input: valid applies, invalid flags aria-invalid, Enter commits', () => {
    const { lib, window, document } = load('chillcolorpicker');
    const changes = [];
    const cp = lib.create({ value: '#000000', container: document.body, onChange: v => changes.push(v) });
    const inp = document.querySelector('.chillcolorpicker-input');
    inp.value = '#12345g';
    inp.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(inp.getAttribute('aria-invalid'), 'true');
    assert.equal(cp.getValue(), '#000000');
    inp.value = 'f80';
    inp.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(cp.getValue(), '#ff8800');
    assert.equal(inp.getAttribute('aria-invalid'), null);
    assert.equal(changes.length, 0);
    key(window, inp, 'Enter');
    assert.deepEqual(changes, ['#ff8800']);
    assert.equal(inp.value, '#ff8800');
    cp.destroy();
});

test('chillcolorpicker area keyboard moves S/V', () => {
    const { lib, window, document } = load('chillcolorpicker');
    const cp = lib.create({ value: '#ff0000', container: document.body });
    const area = document.querySelector('.chillcolorpicker-area');
    key(window, area, 'ArrowLeft', { shiftKey: true });
    assert.ok(Math.abs(cp.getHsv().s - 0.9) < 1e-9);
    key(window, area, 'ArrowDown');
    assert.ok(Math.abs(cp.getHsv().v - 0.99) < 1e-9);
    key(window, area, 'Home');
    assert.equal(cp.getHsv().s, 0);
    assert.match(area.getAttribute('aria-valuetext'), /Saturation 0%/);
    cp.destroy();
});

test('chillcolorpicker formats output rgb/hsl and hidden input', () => {
    const { lib, document } = load('chillcolorpicker');
    const a = lib.create({ value: '#ff0000', format: 'rgb', name: 'c', container: document.body });
    assert.equal(a.getValue(), 'rgb(255, 0, 0)');
    assert.equal(document.querySelector('input[name="c"]').value, '#ff0000');
    const b = lib.create({ value: '#00ff00', format: 'hsl', container: document.body });
    assert.equal(b.getValue(), 'hsl(120, 100%, 50%)');
    a.destroy(); b.destroy();
});

test('chillcolorpicker popover: open/close, Esc, outside click, aria-expanded, cleanup', () => {
    const { lib, window, document } = load('chillcolorpicker');
    const events = [];
    const cp = lib.create({ popover: true, value: '#3b82f6', container: document.body, onOpen: () => events.push('o'), onClose: () => events.push('c') });
    const trig = document.querySelector('.chillcolorpicker-trigger');
    assert.equal(trig.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(trig.getAttribute('aria-expanded'), 'false');
    assert.equal(document.querySelector('.chillcolorpicker-panel'), null, 'panel not in DOM while closed');
    trig.click();
    assert.ok(cp.isOpen());
    const panel = document.querySelector('body > .chillcolorpicker-panel');
    assert.ok(panel);
    assert.equal(panel.getAttribute('role'), 'dialog');
    assert.equal(trig.getAttribute('aria-expanded'), 'true');
    key(window, document.body, 'Escape');
    assert.ok(!cp.isOpen());
    assert.equal(document.querySelector('.chillcolorpicker-panel'), null);
    assert.equal(document.activeElement, trig);
    cp.open();
    ptr(window, document.body, 'pointerdown', 1, 1);
    assert.ok(!cp.isOpen());
    cp.open();
    // clicking inside doesn't close
    ptr(window, document.querySelector('.chillcolorpicker-hue'), 'pointerdown', 1, 1);
    assert.ok(cp.isOpen());
    cp.destroy();
    assert.equal(document.querySelector('.chillcolorpicker-panel'), null);
    assert.equal(document.querySelector('.chillcolorpicker'), null);
    assert.deepEqual(events, ['o', 'c', 'o', 'c', 'o', 'c']);
    // listeners removed: no throw after destroy
    ptr(window, document.body, 'pointerdown', 1, 1);
});

test('chillcolorpicker disabled blocks interaction and popover opening', () => {
    const { lib, document } = load('chillcolorpicker');
    const cp = lib.create({ popover: true, disabled: true, container: document.body });
    document.querySelector('.chillcolorpicker-trigger').click();
    assert.ok(!cp.isOpen());
    cp.setDisabled(false);
    cp.open();
    assert.ok(cp.isOpen());
    cp.setDisabled(true);
    assert.ok(!cp.isOpen());
    cp.destroy();
});
