'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const key = (w, el, k) => { const e = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const btns = d => [...d.querySelectorAll('.chillsegmented-item')];

test('chillsegmented single: radiogroup, default first selected, roving tabindex, destroy', () => {
    const { lib, document } = load('chillsegmented');
    const s = lib.create({ items: ['Day', 'Week', 'Month'], label: 'Range', container: document.body });
    const g = document.querySelector('.chillsegmented');
    assert.equal(g.getAttribute('role'), 'radiogroup');
    assert.equal(g.getAttribute('aria-label'), 'Range');
    const b = btns(document);
    assert.equal(b.length, 3);
    assert.equal(b[0].getAttribute('role'), 'radio');
    assert.equal(b[0].getAttribute('aria-checked'), 'true');
    assert.equal(b[1].getAttribute('aria-checked'), 'false');
    assert.equal(b[0].tabIndex, 0);
    assert.equal(b[1].tabIndex, -1);
    assert.equal(s.getValue(), 'Day');
    s.destroy();
    assert.equal(document.querySelector('.chillsegmented'), null);
});

test('chillsegmented single: click selects, onChange once, same click no-op, allowEmpty toggles off', () => {
    const { lib, document } = load('chillsegmented');
    const seen = [];
    const s = lib.create({ items: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }], value: 1, container: document.body, onChange: v => seen.push(v) });
    btns(document)[1].click();
    assert.equal(s.getValue(), 2);
    assert.equal(btns(document)[1].tabIndex, 0);
    btns(document)[1].click();
    eq(seen, [2]);
    const t = lib.create({ items: ['a', 'b'], allowEmpty: true, container: document.body });
    assert.equal(t.getValue(), null);
    btns(document).filter(x => x.textContent === 'a')[0].click();
    assert.equal(t.getValue(), 'a');
    btns(document).filter(x => x.textContent === 'a')[0].click();
    assert.equal(t.getValue(), null);
    s.destroy(); t.destroy();
});

test('chillsegmented single keyboard: arrows select and wrap, skip disabled, Home/End', () => {
    const { lib, window, document } = load('chillsegmented');
    const s = lib.create({ items: ['a', { value: 'b', label: 'B', disabled: true }, 'c', 'd'], value: 'a', container: document.body });
    const b = btns(document);
    b[0].focus();
    key(window, b[0], 'ArrowRight');
    assert.equal(s.getValue(), 'c');
    assert.equal(document.activeElement, b[2]);
    key(window, b[2], 'ArrowDown');
    assert.equal(s.getValue(), 'd');
    key(window, b[3], 'ArrowRight');
    assert.equal(s.getValue(), 'a');
    key(window, b[0], 'ArrowLeft');
    assert.equal(s.getValue(), 'd');
    key(window, b[3], 'Home');
    assert.equal(s.getValue(), 'a');
    key(window, b[0], 'End');
    assert.equal(s.getValue(), 'd');
    s.destroy();
});

test('chillsegmented multiple: group + aria-pressed, toggle, order preserved, arrows move focus only', () => {
    const { lib, window, document } = load('chillsegmented');
    const seen = [];
    const s = lib.create({ items: ['b', 'i', 'u'], multiple: true, value: ['u'], container: document.body, onChange: v => seen.push(v) });
    assert.equal(document.querySelector('.chillsegmented').getAttribute('role'), 'group');
    const b = btns(document);
    assert.equal(b[0].getAttribute('role'), null);
    assert.equal(b[2].getAttribute('aria-pressed'), 'true');
    assert.equal(b[0].getAttribute('aria-pressed'), 'false');
    b[0].click();
    eq(s.getValue(), ['b', 'u']);
    b[2].click();
    eq(s.getValue(), ['b']);
    b[0].focus();
    key(window, b[0], 'ArrowRight');
    assert.equal(document.activeElement, b[1]);
    eq(s.getValue(), ['b'], 'arrows do not toggle in multiple mode');
    eq(seen, [['b', 'u'], ['b']]);
    s.destroy();
});

test('chillsegmented disabled: whole group and single item', () => {
    const { lib, document } = load('chillsegmented');
    const s = lib.create({ items: ['a', 'b', 'c'], container: document.body });
    s.setItemDisabled('b', true);
    btns(document)[1].click();
    assert.equal(s.getValue(), 'a');
    assert.ok(btns(document)[1].disabled);
    s.setDisabled(true);
    assert.ok(btns(document).every(x => x.disabled));
    assert.equal(document.querySelector('.chillsegmented').getAttribute('aria-disabled'), 'true');
    btns(document)[2].click();
    assert.equal(s.getValue(), 'a');
    s.setDisabled(false);
    btns(document)[2].click();
    assert.equal(s.getValue(), 'c');
    s.destroy();
});

test('chillsegmented labels are text-safe; icons rendered as text; sizes/fullWidth classes', () => {
    const { lib, document } = load('chillsegmented');
    const s = lib.create({ items: [{ value: 'x', label: '<img src=x onerror=alert(1)>', icon: '<b>*</b>' }], size: 'lg', fullWidth: true, container: document.body });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    assert.ok(document.querySelector('.chillsegmented-lg.chillsegmented-fullwidth'));
    assert.ok(document.querySelector('.chillsegmented-label').textContent.includes('<img'));
    s.destroy();
});

test('chillsegmented setValue (silent), hidden inputs, on(), init', () => {
    const { lib, document } = load('chillsegmented');
    document.body.innerHTML = '<div id="h"></div>';
    let n = 0;
    const s = lib.init('#h', { items: ['a', 'b'], name: 'view', onChange: () => n++ });
    assert.equal(document.querySelector('input[name="view"]').value, 'a');
    const got = [];
    const off = s.on('change', v => got.push(v));
    s.setValue('b', true);
    assert.equal(n, 0);
    s.setValue('a');
    assert.equal(n, 1);
    off();
    s.setValue('nope');
    assert.equal(s.getValue(), 'a');
    eq(got, ['a']);
    const m = lib.create({ items: ['x', 'y', 'z'], multiple: true, name: 'f', container: document.body });
    m.setValue(['z', 'x']);
    eq([...document.querySelectorAll('input[name="f"]')].map(i => i.value), ['x', 'z']);
    s.destroy(); m.destroy();
});
