'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

test('chillradio.create builds a label-wrapped native radio; destroy', () => {
    const { lib, document } = load('chillradio');
    const w = lib.create({ label: 'One', description: 'First', name: 'n', value: '1', checked: true });
    document.body.appendChild(w);
    assert.equal(w.input.type, 'radio');
    assert.ok(w.input.checked);
    assert.equal(w.input.getAttribute('aria-describedby'), w.querySelector('.chillradio-description').id);
    w.destroy();
    assert.equal(document.querySelector('.chillradio-wrapper'), null);
});

test('chillradio XSS-safe', () => {
    const { lib, document } = load('chillradio');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, description: evil, name: '"><i>', value: '"><b>', state: 'x" onclick="y' });
    document.body.appendChild(w);
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    assert.equal(document.querySelector('i'), null);
    assert.equal(w.getAttribute('onclick'), null);
    assert.equal(w.querySelector('.chillradio-label').textContent, evil);
    w.destroy();
});

test('chillradio.createGroup works (previously threw): radiogroup, exclusive selection, onChange value', () => {
    const { lib, document } = load('chillradio');
    const seen = [];
    const g = lib.createGroup({ label: 'Plan', name: 'plan', value: 'a', items: [{ value: 'a', label: 'Free' }, { value: 'b', label: 'Pro' }, { value: 'c', label: 'Ent', disabled: true }], onChange: v => seen.push(v) });
    document.body.appendChild(g);
    assert.equal(g.getAttribute('role'), 'radiogroup');
    assert.equal(g.getAttribute('aria-labelledby'), g.querySelector('.chillradio-group-label').id);
    const inputs = g.querySelectorAll('input');
    assert.equal(inputs.length, 3);
    assert.ok([...inputs].every(i => i.name === 'plan'));
    assert.equal(g.getValue(), 'a');
    inputs[1].click();
    assert.equal(g.getValue(), 'b');
    assert.ok(!inputs[0].checked);
    eq(seen, ['b']);
    g.setValue('a');
    assert.equal(g.getValue(), 'a');
    assert.ok(inputs[2].disabled);
    g.destroy();
    assert.equal(document.querySelector('.chillradio-group'), null);
});

test('chillradio auto-generated group names are unique', () => {
    const { lib } = load('chillradio');
    const a = lib.createGroup({ items: [{ value: 1, label: 'x' }] });
    const b = lib.createGroup({ items: [{ value: 1, label: 'x' }] });
    assert.notEqual(a.querySelector('input').name, b.querySelector('input').name);
});

test('chillradio numeric values keep identity in group', () => {
    const { lib, document } = load('chillradio');
    const seen = [];
    const g = lib.createGroup({ name: 'n', value: 1, items: [{ value: 1, label: 'one' }, { value: 2, label: 'two' }], onChange: v => seen.push(v) });
    document.body.appendChild(g);
    g.querySelectorAll('input')[1].click();
    assert.strictEqual(seen[0], 2);
    assert.strictEqual(g.getValue(), 2);
    g.destroy();
});

test('chillradio.init reuses and restores an existing input, removes listeners', () => {
    const { lib, document } = load('chillradio');
    document.body.innerHTML = '<form><input type="radio" id="r" name="g" value="x" data-q="1"></form>';
    const el = document.getElementById('r');
    const seen = [];
    const inst = lib.init('#r', { label: 'X', onChange: v => seen.push(v) });
    assert.equal(document.getElementById('r'), el);
    assert.equal(el.getAttribute('data-q'), '1');
    assert.equal(inst.getValue(), 'x');
    el.click();
    eq(seen, ['x']);
    inst.destroy();
    assert.equal(document.querySelector('.chillradio-wrapper'), null);
    assert.equal(el.parentNode.tagName, 'FORM');
    assert.ok(!el.classList.contains('chillradio-input'));
    el.checked = false; el.click();
    assert.equal(seen.length, 1);
});

test('chillradio setState error -> aria-invalid; setDisabled', () => {
    const { lib } = load('chillradio');
    const w = lib.create({});
    w.instance.setState('error');
    assert.equal(w.input.getAttribute('aria-invalid'), 'true');
    assert.ok(w.classList.contains('chillradio-error'));
    w.instance.setState('default');
    assert.equal(w.input.getAttribute('aria-invalid'), null);
    w.instance.setDisabled(true);
    assert.ok(w.input.disabled && w.classList.contains('disabled'));
});

test('chillradio CSS: data-theme dark, focus-visible, reduced motion', () => {
    const { lib, document } = load('chillradio');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chillradio-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
});
