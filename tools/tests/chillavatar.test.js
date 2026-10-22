const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('avatar initials are escaped (no XSS) and have accessible name', () => {
    const { lib, document } = load('chillavatar');
    const a = lib.create({ name: '<img src=x onerror=alert(1)> Doe' });
    document.body.appendChild(a);
    assert.equal(a.querySelector('img'), null);
    assert.equal(a.getAttribute('role'), 'img');
    assert.equal(a.getAttribute('aria-label'), '<img src=x onerror=alert(1)> Doe');
});

test('getInitials edge cases', () => {
    const { lib } = load('chillavatar');
    assert.equal(lib.getInitials('Ada Lovelace'), 'AL');
    assert.equal(lib.getInitials('ada'), 'AD');
    assert.equal(lib.getInitials('   '), '?');
    assert.equal(lib.getInitials(null), '?');
});

test('avatar image error falls back to initials, keeping status dot', () => {
    const { lib, document, window } = load('chillavatar');
    const a = lib.create({ name: 'Grace Hopper', src: 'http://x/y.png', status: 'online' });
    document.body.appendChild(a);
    const img = a.querySelector('img');
    img.dispatchEvent(new window.Event('error'));
    assert.equal(a.querySelector('img'), null);
    assert.equal(a.querySelector('.chillavatar-fallback').textContent, 'GH');
    assert.ok(a.querySelector('.chillavatar-status-online'));
    assert.match(a.getAttribute('aria-label'), /online/);
});

test('avatar badge caps and auto colour is deterministic', () => {
    const { lib } = load('chillavatar');
    assert.equal(lib.create({ name: 'A', badge: 120 }).querySelector('.chillavatar-badge').textContent, '99+');
    assert.equal(lib.create({ name: 'A', badge: 5 }).querySelector('.chillavatar-badge').textContent, '5');
    const c1 = lib.create({ name: 'Zed', color: 'auto' }).style.background;
    const c2 = lib.create({ name: 'Zed', color: 'auto' }).style.background;
    assert.ok(c1 && c1 === c2);
});

test('avatar group stacks with +N and aria', () => {
    const { lib, document } = load('chillavatar');
    const people = ['A', 'B', 'C', 'D', 'E'].map(name => ({ name }));
    const g = lib.createGroup(people, { max: 3 });
    document.body.appendChild(g);
    assert.equal(g.querySelectorAll('.chillavatar').length, 3);
    const more = g.querySelector('.chillavatar-group-count');
    assert.equal(more.textContent, '+2');
    assert.equal(more.getAttribute('aria-label'), '2 more people');
    assert.equal(g.getAttribute('role'), 'group');
    assert.equal(g.getAttribute('aria-label'), '5 people');
    assert.equal(lib.group, lib.createGroup);
    const none = lib.createGroup(people.slice(0, 2), { max: 3 });
    assert.equal(none.querySelector('.chillavatar-group-count'), null);
    const total = lib.createGroup(people.slice(0, 2), { max: 2, total: 12 });
    assert.equal(total.querySelector('.chillavatar-group-count').textContent, '+10');
});

test('avatar group +N becomes a button with onMoreClick; destroy cleans up', () => {
    const { lib, document } = load('chillavatar');
    let hidden = null;
    const g = lib.createGroup([{ name: 'A' }, { name: 'B' }, { name: 'C' }], { max: 1, onMoreClick: (e, h) => { hidden = h; } });
    document.body.appendChild(g);
    const btn = g.querySelector('button.chillavatar-group-count');
    assert.ok(btn);
    btn.click();
    assert.equal(hidden.length, 2);
    g.chillavatar.destroy();
    assert.equal(document.querySelector('.chillavatar-group'), null);
});

test('avatar css dark override', () => {
    const { lib, document } = load('chillavatar');
    lib.create({});
    const css = document.getElementById('chillavatar-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
});
