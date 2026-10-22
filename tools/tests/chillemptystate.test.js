'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

const EVIL = '<img src=x onerror=alert(1)>';

test('SSR load does not throw', () => {
    assert.ok(loadSSR('chillemptystate').version);
});

test('title/description/icon/action label are text (no XSS)', () => {
    const { lib, document } = load('chillemptystate');
    const el = lib.create({ title: EVIL, description: EVIL, icon: EVIL, actions: [{ label: EVIL, icon: EVIL }] });
    document.body.appendChild(el);
    assert.equal(document.querySelector('.chillemptystate img'), null);
    assert.equal(el.querySelector('.chillemptystate-title').textContent, EVIL);
    assert.equal(el.querySelector('.chillemptystate-description').textContent, EVIL);
    assert.equal(el.querySelector('.chillemptystate-btn').textContent.includes(EVIL), true);
});

test('explicit html options render markup', () => {
    const { lib } = load('chillemptystate');
    const a = lib.create({ title: '<b>T</b>', description: '<i>D</i>', html: true, icon: '<svg id="s1"></svg>' });
    assert.ok(a.querySelector('.chillemptystate-title b'));
    assert.ok(a.querySelector('.chillemptystate-description i'));
    assert.ok(a.querySelector('#s1'));
    const b = lib.create({ titleHtml: '<u>t</u>', descriptionHtml: '<em>d</em>', iconHtml: '<svg id="s2"></svg>' });
    assert.ok(b.querySelector('.chillemptystate-title u'));
    assert.ok(b.querySelector('.chillemptystate-description em'));
    assert.ok(b.querySelector('#s2'));
});

test('dangerous hrefs and image URLs are rejected', () => {
    const { lib } = load('chillemptystate');
    const el = lib.create({
        illustration: 'javascript:alert(1)',
        actions: [{ label: 'x', href: 'javascript:alert(1)' }, { label: 'y', href: 'https://example.com', target: '_blank' }, { label: 'z', href: '/docs' }]
    });
    assert.equal(el.querySelector('img'), null);
    const [bad, good, rel] = Array.from(el.querySelectorAll('.chillemptystate-btn'));
    assert.equal(bad.tagName, 'BUTTON');
    assert.equal(bad.getAttribute('href'), null);
    assert.equal(good.tagName, 'A');
    assert.equal(good.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(rel.getAttribute('href'), '/docs');
    const ok = lib.create({ illustration: 'https://example.com/a.png', illustrationAlt: 'pic' });
    assert.equal(ok.querySelector('img').getAttribute('alt'), 'pic');
});

test('role=status by default, overridable; heading level', () => {
    const { lib } = load('chillemptystate');
    const el = lib.create({ title: 'T' });
    assert.equal(el.getAttribute('role'), 'status');
    assert.equal(el.getAttribute('aria-live'), 'polite');
    assert.equal(lib.create({ title: 'T', role: 'alert' }).getAttribute('role'), 'alert');
    assert.equal(el.querySelector('h3.chillemptystate-title').tagName, 'H3');
    const h2 = lib.create({ title: 'T', headingLevel: 2 }).querySelector('.chillemptystate-title');
    assert.equal(h2.getAttribute('role'), 'heading');
    assert.equal(h2.getAttribute('aria-level'), '2');
});

test('icon presets: iconType, preset copy, overrides, illustrations', () => {
    const { lib } = load('chillemptystate');
    for (const t of Object.keys(lib.icons)) {
        const el = lib.create({ iconType: t });
        assert.ok(el.querySelector('.chillemptystate-icon svg'), t);
        assert.equal(el.querySelector('.chillemptystate-icon').getAttribute('aria-hidden'), 'true');
    }
    const p = lib.create({ preset: 'noResults' });
    assert.equal(p.querySelector('.chillemptystate-title').textContent, 'No results found');
    assert.ok(p.querySelector('.chillemptystate-icon svg'));
    const o = lib.create({ preset: 'error', title: 'Boom' });
    assert.equal(o.querySelector('.chillemptystate-title').textContent, 'Boom');
    assert.equal(lib.create({ preset: 'error', description: '' }).querySelector('.chillemptystate-description'), null);
    const ill = lib.create({ illustrationType: 'search' });
    assert.ok(ill.querySelector('.chillemptystate-illustration svg'));
    assert.equal(lib.create({ iconType: 'search', iconWrapper: true }).querySelectorAll('.chillemptystate-icon-wrapper').length, 1);
});

test('actions: onClick, disabled, variants, destroy removes element and listeners', () => {
    const { lib, window, document } = load('chillemptystate');
    let clicks = 0, dis = 0;
    const el = lib.create({ actions: [{ label: 'Go', onClick: () => clicks++ }, { label: 'No', disabled: true, onClick: () => dis++ }, { label: 'D', variant: 'danger' }] });
    document.body.appendChild(el);
    const [a, b, c] = Array.from(el.querySelectorAll('.chillemptystate-btn'));
    assert.ok(a.classList.contains('chillemptystate-btn-primary'));
    assert.ok(b.classList.contains('chillemptystate-btn-secondary'));
    assert.ok(c.classList.contains('chillemptystate-btn-danger'));
    a.click();
    assert.equal(clicks, 1);
    b.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(dis, 0);
    el.destroy();
    assert.equal(document.querySelector('.chillemptystate'), null);
    a.click();
    assert.equal(clicks, 1, 'listener removed');
});

test('mount/update/destroy', () => {
    const { lib, document } = load('chillemptystate');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const h = lib.mount(host, { title: 'One' });
    assert.equal(host.querySelector('.chillemptystate-title').textContent, 'One');
    h.update({ title: 'Two' });
    assert.equal(host.querySelectorAll('.chillemptystate').length, 1);
    assert.equal(host.querySelector('.chillemptystate-title').textContent, 'Two');
    h.destroy();
    assert.equal(host.querySelector('.chillemptystate'), null);
});

test('CSS: dark theme override, focus-visible, reduced motion', () => {
    const { lib, document } = load('chillemptystate');
    lib.create({ title: 'x' });
    const css = document.getElementById('chillemptystate-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
});

test('src declares window.ChillEmptyState', () => {
    assert.match(fs.readFileSync(sourceFile('chillemptystate'), 'utf8'), /window\.ChillEmptyState\s*=/);
});
