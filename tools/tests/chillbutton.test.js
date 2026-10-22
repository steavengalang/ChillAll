'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('chillbutton.create builds a typed button with classes and onClick', () => {
    const { lib, document } = load('chillbutton');
    let clicks = 0;
    const b = lib.create({ text: 'Save', variant: 'danger', size: 'lg', onClick: () => clicks++ });
    document.body.appendChild(b);
    assert.equal(b.tagName, 'BUTTON');
    assert.equal(b.type, 'button');
    assert.ok(b.classList.contains('chillbutton-danger') && b.classList.contains('chillbutton-lg'));
    b.click();
    assert.equal(clicks, 1);
    b.destroy();
    assert.equal(document.querySelector('.chillbutton'), null);
});

test('chillbutton text is XSS-safe by default; html opt-in is sanitised', () => {
    const { lib, document } = load('chillbutton');
    const evil = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const b = lib.create({ text: evil });
    document.body.appendChild(b);
    assert.equal(b.querySelector('img'), null);
    assert.equal(b.textContent, evil);
    const h = lib.create({ text: '<b onclick="x()">Bold</b><script>alert(1)</script><a href="javascript:alert(1)">l</a>', html: true });
    assert.equal(h.querySelector('script'), null);
    assert.ok(h.querySelector('b'));
    assert.equal(h.querySelector('b').getAttribute('onclick'), null);
    assert.equal(h.querySelector('a').getAttribute('href'), null);
    assert.equal(h.textContent.includes('Bold'), true);
});

test('chillbutton icon: text, svg markup (sanitised), Node; position right', () => {
    const { lib, document } = load('chillbutton');
    const a = lib.create({ text: 'T', icon: '<svg onload="x()" viewBox="0 0 1 1"><path d="M0 0"/></svg>', iconPosition: 'right' });
    assert.ok(a.lastChild.classList.contains('chillbutton-icon'));
    assert.ok(a.querySelector('svg'));
    assert.equal(a.querySelector('svg').getAttribute('onload'), null);
    assert.equal(a.lastChild.getAttribute('aria-hidden'), 'true');
    const n = document.createElement('i');
    const b = lib.create({ icon: n, iconOnly: true, ariaLabel: 'Close' });
    assert.equal(b.firstChild.firstChild, n);
    assert.equal(b.getAttribute('aria-label'), 'Close');
    const c = lib.create({ icon: '<b>x</b> text' , text: 'a'});
    assert.ok(c.querySelector('b'));
    const d = lib.create({ icon: '+' });
    assert.equal(d.firstChild.textContent, '+');
});

test('chillbutton loading: content preserved (nodes moved), spinner, aria-busy, disabled, restore', () => {
    const { lib, document } = load('chillbutton');
    const b = lib.create({ text: 'Go', icon: '+' });
    document.body.appendChild(b);
    const label = b.querySelector('span:not(.chillbutton-icon)');
    b.setLoading(true);
    assert.ok(b.classList.contains('chillbutton-loading'));
    assert.ok(b.disabled);
    assert.equal(b.getAttribute('aria-busy'), 'true');
    assert.ok(b.querySelector('.chillbutton-spinner'));
    assert.ok(b.querySelector('.chillbutton-content').contains(label), 'same node, not re-parsed');
    b.setLoading(true); // idempotent
    assert.equal(b.querySelectorAll('.chillbutton-spinner').length, 1);
    b.setLoading(false);
    assert.ok(!b.classList.contains('chillbutton-loading'));
    assert.ok(!b.disabled);
    assert.equal(b.getAttribute('aria-busy'), null);
    assert.equal(b.querySelector('.chillbutton-content'), null);
    assert.equal(b.querySelector('.chillbutton-spinner'), null);
    assert.equal(b.children[1], label);
});

test('chillbutton loadingText shows inline text and hides content', () => {
    const { lib } = load('chillbutton');
    const b = lib.create({ text: 'Save', loadingText: 'Saving...' });
    b.setLoading(true);
    assert.ok(b.classList.contains('chillbutton-loading-inline'));
    assert.equal(b.querySelector('.chillbutton-loading-text').textContent, 'Saving...');
    b.setLoading(false);
    assert.equal(b.querySelector('.chillbutton-loading-text'), null);
    assert.equal(b.textContent, 'Save');
    const c = lib.create({ text: 'X', loading: true, disabled: true });
    assert.ok(c.classList.contains('chillbutton-loading'));
    c.setLoading(false);
    assert.ok(c.disabled, 'originally disabled button stays disabled');
});

test('chillbutton href renders a link; disabled link blocks click and is not tabbable; rel for _blank', () => {
    const { lib, document } = load('chillbutton');
    let clicks = 0;
    const a = lib.create({ text: 'Docs', href: '/docs', target: '_blank', onClick: () => clicks++ });
    document.body.appendChild(a);
    assert.equal(a.tagName, 'A');
    assert.equal(a.getAttribute('href'), '/docs');
    assert.equal(a.getAttribute('rel'), 'noopener noreferrer');
    a.click();
    assert.equal(clicks, 1);
    a.setDisabled(true);
    assert.equal(a.getAttribute('aria-disabled'), 'true');
    assert.equal(a.getAttribute('tabindex'), '-1');
    a.click();
    assert.equal(clicks, 1);
    a.setDisabled(false);
    assert.equal(a.getAttribute('aria-disabled'), null);
    a.click();
    assert.equal(clicks, 2);
});

test('chillbutton ripple adds and removes a ripple element; off by default', async () => {
    const { lib, window, document } = load('chillbutton');
    const b = lib.create({ text: 'R', ripple: true });
    document.body.appendChild(b);
    b.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, clientX: 3, clientY: 4 }));
    assert.equal(b.querySelectorAll('.chillbutton-ripple').length, 1);
    await new Promise(r => setTimeout(r, 800));
    assert.equal(b.querySelectorAll('.chillbutton-ripple').length, 0);
    const n = lib.create({ text: 'N' });
    n.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    assert.equal(n.querySelectorAll('.chillbutton-ripple').length, 0);
    b.destroy();
});

test('chillbutton.init decorates, handles loading with nodes intact, destroy removes listeners and classes', () => {
    const { lib, document } = load('chillbutton');
    document.body.innerHTML = '<button id="a">Hello <em>x</em></button><div id="d">Div</div>';
    let clicks = 0;
    const onClick = () => clicks++;
    const inst = lib.init('#a', { variant: 'outline', onClick });
    const a = document.getElementById('a');
    const em = a.querySelector('em');
    assert.ok(a.classList.contains('chillbutton-outline'));
    a.click();
    assert.equal(clicks, 1);
    inst.setLoading(true);
    assert.ok(a.disabled);
    assert.ok(a.querySelector('.chillbutton-content em') === em);
    inst.setLoading(a, false);                      // legacy signature
    assert.ok(!a.disabled);
    assert.equal(a.querySelector('em'), em);
    inst.destroy();
    assert.equal(a.className, '');
    a.click();
    assert.equal(clicks, 1, 'click listener removed');
    // non-button element becomes keyboard accessible
    const d = document.getElementById('d');
    const i2 = lib.init(d, { onClick });
    assert.equal(d.getAttribute('role'), 'button');
    assert.equal(d.getAttribute('tabindex'), '0');
    d.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(clicks, 2);
    i2.destroy();
    d.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(clicks, 2);
});

test('chillbutton init setVariant/setSize/setDisabled and disabled option', () => {
    const { lib, document } = load('chillbutton');
    document.body.innerHTML = '<button class="x">a</button><button class="x">b</button>';
    const inst = lib.init('.x', { disabled: true });
    assert.ok([...document.querySelectorAll('.x')].every(b => b.disabled));
    inst.setDisabled(false);
    inst.setVariant('success');
    inst.setSize('sm');
    assert.ok([...document.querySelectorAll('.x')].every(b => !b.disabled && b.classList.contains('chillbutton-success') && b.classList.contains('chillbutton-sm')));
    assert.equal(lib.init(null).elements.length, 0);
});

test('chillbutton CSS: data-theme dark override, focus-visible, reduced motion, injected once', () => {
    const { lib, document } = load('chillbutton');
    lib.create({ text: 'a' }); lib.create({ text: 'b' });
    const styles = document.querySelectorAll('#chillbutton-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /\.chillbutton:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /:not\(\[data-theme="light"\]\)/);
});
