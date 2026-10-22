'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const type = (w, input, text) => { input.value = text; input.dispatchEvent(new w.Event('input', { bubbles: true })); };

test('chillinput.create builds wrapper with label bound to input, helper described-by', () => {
    const { lib, document } = load('chillinput');
    const w = lib.create({ label: 'Email', type: 'email', helper: 'Hint', placeholder: 'you@x.com', required: true });
    document.body.appendChild(w);
    const input = w.input;
    assert.equal(input.type, 'email');
    assert.equal(input.placeholder, 'you@x.com');
    assert.ok(input.required);
    const label = w.querySelector('label');
    assert.equal(label.getAttribute('for'), input.id);
    assert.ok(label.classList.contains('chillinput-label-required'));
    const helper = w.querySelector('.chillinput-helper');
    assert.equal(input.getAttribute('aria-describedby'), helper.id);
    w.destroy();
    assert.equal(document.querySelector('.chillinput-wrapper'), null);
});

test('chillinput is XSS-safe: label, helper, placeholder, prefix are text; slot markup sanitised', () => {
    const { lib, document } = load('chillinput');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, helper: evil, placeholder: '"><script>alert(1)</script>', prefix: '<b>$</b><script>x()</script>' });
    document.body.appendChild(w);
    assert.equal(w.querySelector('img'), null);
    assert.equal(w.querySelector('script'), null);
    assert.equal(w.querySelector('label').textContent, evil);
    assert.equal(w.querySelector('.chillinput-helper').textContent, evil);
    assert.equal(w.input.placeholder, '"><script>alert(1)</script>');
    assert.ok(w.querySelector('.chillinput-prefix b'));
    const t = lib.create({ prefix: '$', suffix: '<svg onload="x()" viewBox="0 0 1 1"/>' });
    assert.equal(t.querySelector('.chillinput-prefix').textContent, '$');
    assert.equal(t.querySelector('.chillinput-suffix svg').getAttribute('onload'), null);
    w.destroy(); t.destroy();
});

test('chillinput.init enhances an existing input in place (same element), destroy restores it', () => {
    const { lib, window, document } = load('chillinput');
    document.body.innerHTML = '<form><input id="name" name="nm" value="abc" data-x="1"></form>';
    const el = document.getElementById('name');
    const seen = [];
    const inst = lib.init('#name', { label: 'Name', onChange: v => seen.push(v) });
    assert.equal(document.getElementById('name'), el, 'same node preserved');
    assert.equal(el.getAttribute('data-x'), '1');
    assert.equal(el.name, 'nm');
    assert.ok(el.closest('.chillinput-wrapper'));
    assert.equal(document.querySelector('label').getAttribute('for'), 'name');
    assert.equal(inst.getValue(), 'abc');
    type(window, el, 'xyz');
    assert.deepEqual(seen, ['xyz']);
    inst.destroy();
    assert.equal(document.querySelector('.chillinput-wrapper'), null);
    assert.equal(document.getElementById('name'), el);
    assert.equal(el.value, 'xyz');
    assert.equal(el.parentNode.tagName, 'FORM');
    assert.ok(!el.classList.contains('chillinput'));
    type(window, el, 'after');
    assert.equal(seen.length, 1, 'listeners removed');
});

test('chillinput.init on a non-input element replaces it with a new input', () => {
    const { lib, document } = load('chillinput');
    document.body.innerHTML = '<div id="host"></div>';
    const inst = lib.init('#host', { placeholder: 'p' });
    assert.equal(document.getElementById('host'), null);
    assert.equal(document.querySelector('.chillinput').placeholder, 'p');
    inst.destroy();
    assert.equal(document.querySelectorAll('input').length, 1);
});

test('chillinput state: error sets aria-invalid, resets on default; setHelper updates describedby', () => {
    const { lib, document } = load('chillinput');
    const w = lib.create({});
    document.body.appendChild(w);
    const inst = w.instance;
    assert.equal(w.input.getAttribute('aria-describedby'), null);
    inst.setHelper('Oops');
    assert.equal(w.input.getAttribute('aria-describedby'), w.querySelector('.chillinput-helper').id);
    inst.setState('error');
    assert.ok(w.classList.contains('chillinput-error'));
    assert.equal(w.input.getAttribute('aria-invalid'), 'true');
    inst.setState('success');
    assert.ok(w.classList.contains('chillinput-success') && !w.classList.contains('chillinput-error'));
    assert.equal(w.input.getAttribute('aria-invalid'), null);
    w.destroy();
});

test('chillinput clearable: button shows only with text, clear fires input/onClear, Escape clears', () => {
    const { lib, window, document } = load('chillinput');
    let cleared = 0; const vals = [];
    const w = lib.create({ clearable: true, onClear: () => cleared++, onChange: v => vals.push(v) });
    document.body.appendChild(w);
    const container = w.querySelector('.chillinput-container');
    const btn = w.querySelector('.chillinput-clear');
    assert.equal(btn.getAttribute('aria-label'), 'Clear');
    assert.ok(!container.classList.contains('chillinput-has-value'));
    type(window, w.input, 'hello');
    assert.ok(container.classList.contains('chillinput-has-value'));
    btn.click();
    assert.equal(w.input.value, '');
    assert.equal(cleared, 1);
    assert.deepEqual(vals, ['hello', '']);
    assert.ok(!container.classList.contains('chillinput-has-value'));
    type(window, w.input, 'again');
    const esc = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    w.input.dispatchEvent(esc);
    assert.equal(w.input.value, '');
    assert.equal(cleared, 2);
    assert.ok(esc.defaultPrevented);
    w.destroy();
});

test('chillinput char counter updates and flags exceed on programmatic overflow', () => {
    const { lib, window, document } = load('chillinput');
    const w = lib.create({ maxLength: 5, showCharCount: true, value: 'ab' });
    document.body.appendChild(w);
    const count = w.querySelector('.chillinput-char-count');
    assert.equal(count.textContent, '2/5');
    assert.equal(w.input.getAttribute('maxlength'), '5');
    type(window, w.input, 'abcde');
    assert.equal(count.textContent, '5/5');
    w.instance.setValue('abcdefg');
    assert.equal(count.textContent, '7/5');
    assert.ok(count.classList.contains('chillinput-char-count-exceeded'));
    assert.ok(w.input.getAttribute('aria-describedby').includes(count.id));
    w.destroy();
});

test('chillinput disabled/readonly options and setDisabled', () => {
    const { lib } = load('chillinput');
    const w = lib.create({ disabled: true, readonly: true });
    assert.ok(w.input.disabled && w.input.readOnly);
    w.instance.setDisabled(false);
    assert.ok(!w.input.disabled);
    w.destroy();
});

test('chillinput CSS: data-theme dark override, focus-visible, reduced motion, injected once', () => {
    const { lib, document } = load('chillinput');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chillinput-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /\.chillinput:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
});
