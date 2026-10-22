'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

test('chillcheckbox.create builds label-wrapped native checkbox; destroy', () => {
    const { lib, document } = load('chillcheckbox');
    const w = lib.create({ label: 'Agree', description: 'Read it', name: 'agree', value: 'yes', checked: true, required: true });
    document.body.appendChild(w);
    assert.equal(w.tagName, 'LABEL');
    assert.equal(w.input.type, 'checkbox');
    assert.ok(w.input.checked && w.input.required);
    assert.equal(w.input.name, 'agree');
    assert.equal(w.input.value, 'yes');
    assert.equal(w.input.getAttribute('aria-describedby'), w.querySelector('.chillcheckbox-description').id);
    w.destroy();
    assert.equal(document.querySelector('.chillcheckbox-wrapper'), null);
});

test('chillcheckbox is XSS-safe (label, description, name, value, state class)', () => {
    const { lib, document } = load('chillcheckbox');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, description: evil, name: '"><script>', value: '"><b>', state: 'x" onclick="y' });
    document.body.appendChild(w);
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('script'), null);
    assert.equal(document.querySelector('b'), null);
    assert.equal(w.querySelector('.chillcheckbox-label').textContent, evil);
    assert.equal(w.input.name, '"><script>');
    assert.equal(w.getAttribute('onclick'), null);
    w.destroy();
});

test('chillcheckbox change fires onChange(checked), toggle/setChecked/indeterminate behave', () => {
    const { lib, window, document } = load('chillcheckbox');
    const seen = [];
    const w = lib.create({ label: 'x', onChange: c => seen.push(c) });
    document.body.appendChild(w);
    const inst = w.instance;
    w.input.click();
    eq(seen, [true]);
    assert.ok(inst.isChecked());
    inst.setIndeterminate(true);
    assert.ok(w.input.indeterminate);
    inst.toggle();
    assert.ok(!w.input.indeterminate);
    assert.ok(!inst.isChecked());
    assert.equal(seen.length, 1, 'programmatic toggle is silent');
    inst.setDisabled(true);
    assert.ok(w.input.disabled && w.classList.contains('disabled'));
    w.destroy();
});

test('chillcheckbox.init reuses the existing input and restores it on destroy', () => {
    const { lib, window, document } = load('chillcheckbox');
    document.body.innerHTML = '<form><input type="checkbox" id="c" name="nm" value="7" checked data-z="1"></form>';
    const el = document.getElementById('c');
    const seen = [];
    const inst = lib.init('#c', { label: 'Mine', onChange: c => seen.push(c) });
    assert.equal(document.getElementById('c'), el);
    assert.equal(el.getAttribute('data-z'), '1');
    assert.equal(el.name, 'nm');
    assert.equal(inst.getValue(), '7');
    assert.ok(el.checked);
    assert.ok(el.closest('label.chillcheckbox-wrapper'));
    el.click();
    eq(seen, [false]);
    inst.destroy();
    assert.equal(document.querySelector('.chillcheckbox-wrapper'), null);
    assert.equal(document.getElementById('c'), el);
    assert.equal(el.parentNode.tagName, 'FORM');
    assert.ok(!el.classList.contains('chillcheckbox-input'));
    el.click();
    assert.equal(seen.length, 1, 'listener removed');
});

test('chillcheckbox value 0 is preserved', () => {
    const { lib } = load('chillcheckbox');
    const w = lib.create({ value: 0 });
    assert.strictEqual(w.instance.getValue(), 0);
    assert.equal(w.input.value, '0');
});

test('chillcheckbox.createGroup works (previously threw), role=group, values and onChange', () => {
    const { lib, document } = load('chillcheckbox');
    const seen = [];
    const g = lib.createGroup({ label: 'Toppings', name: 'top', items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C', disabled: true }], value: ['a'], onChange: v => seen.push(v) });
    document.body.appendChild(g);
    assert.equal(g.getAttribute('role'), 'group');
    assert.equal(g.getAttribute('aria-labelledby'), g.querySelector('.chillcheckbox-group-label').id);
    eq(g.getValues(), ['a']);
    g.querySelectorAll('input')[1].click();
    eq(g.getValues(), ['a', 'b']);
    eq(seen, [['a', 'b']]);
    g.setValues(['b']);
    eq(g.getValues(), ['b']);
    assert.ok(g.querySelectorAll('input')[2].disabled);
    assert.equal(g.querySelectorAll('input')[0].name, 'top');
    g.destroy();
    assert.equal(document.querySelector('.chillcheckbox-group'), null);
});

test('chillcheckbox error state sets aria-invalid', () => {
    const { lib } = load('chillcheckbox');
    const w = lib.create({ state: 'error' });
    assert.equal(w.input.getAttribute('aria-invalid'), 'true');
    w.instance.setState('default');
    assert.equal(w.input.getAttribute('aria-invalid'), null);
    assert.ok(!w.classList.contains('chillcheckbox-error'));
});

test('chillcheckbox CSS: data-theme dark, focus-visible, reduced motion, once', () => {
    const { lib, document } = load('chillcheckbox');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chillcheckbox-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /:not\(\[data-theme="light"\]\)/);
});
