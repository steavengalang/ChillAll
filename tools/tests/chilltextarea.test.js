'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const type = (w, el, text) => { el.value = text; el.dispatchEvent(new w.Event('input', { bubbles: true })); };

test('chilltextarea.create: label bound, helper described-by, attributes', () => {
    const { lib, document } = load('chilltextarea');
    const w = lib.create({ label: 'Bio', helper: 'Tell us', placeholder: 'p', rows: 6, required: true, name: 'bio' });
    document.body.appendChild(w);
    const ta = w.textarea;
    assert.equal(ta.rows, 6);
    assert.equal(ta.name, 'bio');
    assert.ok(ta.required);
    assert.equal(w.querySelector('label').getAttribute('for'), ta.id);
    assert.equal(ta.getAttribute('aria-describedby'), w.querySelector('.chilltextarea-helper').id);
    w.destroy();
    assert.equal(document.querySelector('.chilltextarea-wrapper'), null);
});

test('chilltextarea XSS-safe: label/helper/placeholder never parsed as HTML', () => {
    const { lib, document } = load('chilltextarea');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, helper: evil, placeholder: '"><script>alert(1)</script>' });
    document.body.appendChild(w);
    assert.equal(w.querySelector('img'), null);
    assert.equal(w.querySelector('script'), null);
    assert.equal(w.querySelector('label').textContent, evil);
    assert.equal(w.textarea.placeholder, '"><script>alert(1)</script>');
    w.destroy();
});

test('chilltextarea.init reuses existing textarea and restores it on destroy', () => {
    const { lib, window, document } = load('chilltextarea');
    document.body.innerHTML = '<form><textarea id="t" name="n" data-k="v">hello</textarea></form>';
    const el = document.getElementById('t');
    const seen = [];
    const inst = lib.init('#t', { label: 'Notes', onChange: v => seen.push(v) });
    assert.equal(document.getElementById('t'), el);
    assert.equal(el.getAttribute('data-k'), 'v');
    assert.equal(el.name, 'n');
    assert.equal(inst.getValue(), 'hello');
    assert.equal(document.querySelector('label').getAttribute('for'), 't');
    type(window, el, 'abc');
    assert.deepEqual(seen, ['abc']);
    inst.destroy();
    assert.equal(document.querySelector('.chilltextarea-wrapper'), null);
    assert.equal(el.parentNode.tagName, 'FORM');
    assert.equal(el.value, 'abc');
    assert.ok(!el.classList.contains('chilltextarea'));
    type(window, el, 'zzz');
    assert.equal(seen.length, 1, 'listener removed');
});

test('chilltextarea char counter and exceed flag', () => {
    const { lib, window, document } = load('chilltextarea');
    const w = lib.create({ maxLength: 10, showCharCount: true });
    document.body.appendChild(w);
    const c = w.querySelector('.chilltextarea-char-count');
    assert.equal(c.textContent, '0/10');
    type(window, w.textarea, 'abc');
    assert.equal(c.textContent, '3/10');
    w.instance.setValue('x'.repeat(12));
    assert.ok(c.classList.contains('chilltextarea-char-count-exceeded'));
    w.instance.clear();
    assert.equal(c.textContent, '0/10');
    assert.ok(w.textarea.getAttribute('aria-describedby').includes(c.id));
    w.destroy();
});

test('chilltextarea error state sets aria-invalid; setHelper creates footer', () => {
    const { lib, document } = load('chilltextarea');
    const w = lib.create({});
    document.body.appendChild(w);
    const inst = w.instance;
    inst.setState('error');
    assert.equal(w.textarea.getAttribute('aria-invalid'), 'true');
    assert.ok(w.classList.contains('chilltextarea-error'));
    inst.setHelper('Too short');
    assert.equal(w.querySelector('.chilltextarea-footer .chilltextarea-helper').textContent, 'Too short');
    assert.equal(w.textarea.getAttribute('aria-describedby'), w.querySelector('.chilltextarea-helper').id);
    inst.setState('default');
    assert.equal(w.textarea.getAttribute('aria-invalid'), null);
    w.destroy();
});

test('chilltextarea autoResize sets height from scrollHeight and respects maxRows', () => {
    const { lib, window, document } = load('chilltextarea');
    const w = lib.create({ autoResize: true, maxRows: 3 });
    document.body.appendChild(w);
    const ta = w.textarea;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 500 });
    window.getComputedStyle = () => ({ lineHeight: '20px', fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' });
    type(window, ta, 'a\nb\nc\nd\ne');
    assert.equal(ta.style.height, '80px');
    assert.equal(ta.style.overflowY, 'auto');
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 50 });
    type(window, ta, 'a');
    assert.equal(ta.style.height, '50px');
    assert.ok(w.classList.contains('chilltextarea-autoresize'));
    w.destroy();
});

test('chilltextarea disabled/readonly/noResize', () => {
    const { lib } = load('chilltextarea');
    const w = lib.create({ disabled: true, readonly: true, noResize: true });
    assert.ok(w.textarea.disabled && w.textarea.readOnly);
    assert.ok(w.classList.contains('chilltextarea-noresize'));
    w.instance.setDisabled(false);
    assert.ok(!w.textarea.disabled);
    w.destroy();
});

test('chilltextarea CSS: data-theme dark override, focus-visible, reduced motion', () => {
    const { lib, document } = load('chilltextarea');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chilltextarea-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /:not\(\[data-theme="light"\]\)/);
});
