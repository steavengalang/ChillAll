'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('chillcard creates DOM and destroys cleanly', () => {
    const { lib, document } = load('chillcard');
    const card = lib.create({ title: 'T', subtitle: 'S', body: 'B', footer: 'F', parent: document.body });
    assert.ok(document.querySelector('.chillcard'));
    assert.equal(document.querySelector('.chillcard-title').textContent, 'T');
    assert.equal(document.querySelector('.chillcard-subtitle').textContent, 'S');
    assert.equal(document.querySelector('.chillcard-body').textContent, 'B');
    assert.equal(document.querySelector('.chillcard-footer').textContent, 'F');
    assert.ok(document.getElementById('chillcard-styles'));
    card.destroy();
    assert.equal(document.querySelector('.chillcard'), null);
});

test('chillcard escapes strings unless html is opted in', () => {
    const { lib, document } = load('chillcard');
    const a = lib.create({ body: '<img src=x onerror=alert(1)>', title: '<b>x</b>' });
    document.body.appendChild(a.element);
    assert.equal(a.element.querySelector('img'), null);
    assert.equal(a.element.querySelector('.chillcard-title b'), null);
    assert.ok(a.element.textContent.includes('<img'));
    const b = lib.create({ bodyHtml: '<em>hi</em>' });
    assert.ok(b.element.querySelector('.chillcard-body em'));
    const c = lib.create({ body: '<u>u</u>', html: true });
    assert.ok(c.element.querySelector('.chillcard-body u'));
});

test('chillcard variants, sizes, horizontal, hoverable classes', () => {
    const { lib } = load('chillcard');
    const c = lib.create({ variant: 'elevated', size: 'lg', horizontal: true, hoverable: true, body: 'x' });
    const cl = c.element.classList;
    assert.ok(cl.contains('chillcard-elevated') && cl.contains('chillcard-lg') && cl.contains('chillcard-horizontal') && cl.contains('chillcard-hoverable'));
    c.setVariant('filled');
    assert.ok(c.element.classList.contains('chillcard-filled'));
    assert.ok(!c.element.classList.contains('chillcard-elevated'));
    c.setVariant('bogus');
    assert.ok(c.element.classList.contains('chillcard-filled'));
    const d = lib.create({ variant: 'nope' });
    assert.ok(d.element.classList.contains('chillcard-outlined'));
});

test('chillcard clickable: role button, keyboard Enter/Space, events', () => {
    const { lib, document, window } = load('chillcard');
    let clicks = 0;
    const card = lib.create({ body: 'x', onClick: () => clicks++, parent: document.body });
    const el = card.element;
    assert.equal(el.getAttribute('role'), 'button');
    assert.equal(el.getAttribute('tabindex'), '0');
    const evs = [];
    card.on('click', e => evs.push(e));
    el.click();
    assert.equal(clicks, 1);
    assert.equal(evs.length, 1);
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    assert.equal(clicks, 3);
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    assert.equal(clicks, 3);
    card.destroy();
    el.click();
    assert.equal(clicks, 3);
});

test('chillcard href gives role=link, Space does not activate, bad URLs rejected', () => {
    const { lib, window } = load('chillcard');
    let n = 0;
    const card = lib.create({ body: 'x', href: '/page', onClick: (e) => { n++; e.preventDefault(); } });
    assert.equal(card.element.getAttribute('role'), 'link');
    card.element.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    assert.equal(n, 0);
    card.element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(n, 1);
    const bad = lib.create({ body: 'x', href: 'javascript:alert(1)' });
    assert.equal(bad.element.getAttribute('role'), null);
    assert.ok(!bad.element.classList.contains('chillcard-clickable'));
});

test('chillcard ignores clicks on interactive children', () => {
    const { lib, document } = load('chillcard');
    let clicks = 0;
    const btn = document.createElement('button');
    btn.textContent = 'go';
    const card = lib.create({ body: 'x', footer: btn, onClick: () => clicks++, parent: document.body });
    btn.click();
    assert.equal(clicks, 0);
    card.element.querySelector('.chillcard-body').click();
    assert.equal(clicks, 1);
});

test('chillcard disabled blocks interaction', () => {
    const { lib } = load('chillcard');
    let clicks = 0;
    const card = lib.create({ body: 'x', onClick: () => clicks++, disabled: true });
    card.element.click();
    assert.equal(clicks, 0);
    assert.equal(card.element.getAttribute('aria-disabled'), 'true');
    assert.equal(card.element.getAttribute('tabindex'), null);
    card.setDisabled(false);
    card.element.click();
    assert.equal(clicks, 1);
});

test('chillcard loading skeleton toggles aria-busy and emits', () => {
    const { lib } = load('chillcard');
    const seen = [];
    const card = lib.create({ title: 'x', body: 'y', onClick: () => {}, onLoadingChange: l => seen.push('cb' + l) });
    card.on('loading', e => seen.push('ev' + e.loading));
    assert.ok(card.element.querySelector('.chillcard-skeleton'));
    assert.equal(card.element.getAttribute('aria-busy'), null);
    card.setLoading(true);
    assert.ok(card.element.classList.contains('chillcard-loading'));
    assert.equal(card.element.getAttribute('aria-busy'), 'true');
    assert.equal(card.element.querySelector('.chillcard-skeleton').getAttribute('aria-hidden'), 'true');
    card.setLoading(true); // no-op
    card.setLoading(false);
    assert.equal(card.element.getAttribute('aria-busy'), null);
    assert.deepEqual(seen, ['evtrue', 'cbtrue', 'evfalse', 'cbfalse']);
    const l = lib.create({ loading: true, body: 'x' });
    assert.ok(l.element.classList.contains('chillcard-loading'));
});

test('chillcard media: image with alt, ratio, unsafe src dropped, Node media', () => {
    const { lib, document } = load('chillcard');
    const c = lib.create({ media: { src: 'a.jpg', alt: 'Alt', ratio: '4/3' }, body: 'x' });
    const img = c.element.querySelector('.chillcard-media img');
    assert.equal(img.getAttribute('src'), 'a.jpg');
    assert.equal(img.getAttribute('alt'), 'Alt');
    assert.equal(c.mediaEl.style.getPropertyValue('--chillcard-ratio'), '4/3');
    const bad = lib.create({ media: { src: 'javascript:alert(1)' } });
    assert.equal(bad.element.querySelector('img').getAttribute('src'), null);
    const node = document.createElement('video');
    const n = lib.create({ media: node });
    assert.equal(n.mediaEl.firstChild, node);
});

test('chillcard setters rebuild content', () => {
    const { lib } = load('chillcard');
    const c = lib.create({ title: 'a', body: 'b' });
    c.setTitle('new').setBody('<i>x</i>').setFooter('f');
    assert.equal(c.element.querySelector('.chillcard-title').textContent, 'new');
    assert.equal(c.element.querySelector('.chillcard-body').textContent, '<i>x</i>');
    assert.equal(c.element.querySelector('.chillcard-footer').textContent, 'f');
    c.setBody('<i>x</i>', true);
    assert.ok(c.element.querySelector('.chillcard-body i'));
});

test('chillcard init enhances existing element and restores on destroy', () => {
    const { lib, document } = load('chillcard');
    document.body.innerHTML = '<div id="c" class="mine"><p>hello</p></div>';
    const el = document.getElementById('c');
    const inst = lib.init(el, { variant: 'filled', hoverable: true, clickable: true });
    assert.ok(el.classList.contains('chillcard-filled'));
    assert.equal(el.getAttribute('role'), 'button');
    assert.ok(el.querySelector('.chillcard-main p'));
    inst.destroy();
    assert.equal(el.getAttribute('class'), 'mine');
    assert.equal(el.getAttribute('role'), null);
    assert.equal(el.querySelector('.chillcard-main'), null);
    assert.equal(el.firstElementChild.tagName, 'P');
    document.body.innerHTML = '<div class="k"></div><div class="k"></div>';
    const arr = lib.init('.k');
    assert.equal(arr.length, 2);
    arr.forEach(a => a.destroy());
});
