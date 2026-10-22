const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('badge escapes text by default, html opt-in', () => {
    const { lib, document } = load('chillbadge');
    const b = lib.create({ text: '<img src=x onerror=alert(1)>' });
    document.body.appendChild(b);
    assert.equal(b.querySelector('img'), null);
    assert.equal(b.textContent, '<img src=x onerror=alert(1)>');
    const h = lib.create({ text: '<b>hi</b>', html: true });
    assert.ok(h.querySelector('b'));
});

test('badge count honours max and setCount', () => {
    const { lib } = load('chillbadge');
    assert.equal(lib.create({ count: 150 }).textContent, '99+');
    assert.equal(lib.create({ count: 150, max: 200 }).textContent, '150');
    const b = lib.create({ count: 3, max: 9 });
    b.chillbadge.setCount(12);
    assert.equal(b.textContent, '9+');
    const n = lib.createNotification(120);
    assert.equal(n.textContent, '99+');
    assert.equal(n.getAttribute('aria-label'), '99+ notifications');
    n.chillbadge.setCount(true);
    assert.ok(n.classList.contains('chillbadge-dot-only'));
    assert.equal(n.textContent, '');
});

test('badge dot mode and pulse', () => {
    const { lib } = load('chillbadge');
    const d = lib.createDot({ label: 'Online', pulse: true });
    assert.ok(d.classList.contains('chillbadge-dot-only'));
    assert.ok(d.classList.contains('chillbadge-pulse'));
    assert.equal(d.getAttribute('aria-label'), 'Online');
    assert.equal(d.textContent, '');
});

test('badge remove button is labelled, fires onRemove, destroy removes', () => {
    const { lib, document } = load('chillbadge');
    let removed = 0;
    const b = lib.create({ text: 'x', removable: true, removeLabel: 'Delete tag', onRemove: () => removed++ });
    document.body.appendChild(b);
    const btn = b.querySelector('.chillbadge-close');
    assert.equal(btn.getAttribute('aria-label'), 'Delete tag');
    btn.click();
    assert.equal(removed, 1);
    b.chillbadge.destroy();
    assert.equal(document.querySelector('.chillbadge'), null);
});

test('badge css has explicit dark override and reduced motion', () => {
    const { lib, document } = load('chillbadge');
    lib.create({});
    const css = document.getElementById('chillbadge-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /prefers-reduced-motion/);
    lib.create({});
    assert.equal(document.querySelectorAll('#chillbadge-styles').length, 1);
});
