'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

const q = (el, sel) => Array.from(el.querySelectorAll(sel));

test('SSR load does not throw', () => {
    assert.ok(loadSSR('chillskeleton').version);
});

test('single block: classes, sizes, aria-hidden; bad className/variant do not throw', () => {
    const { lib } = load('chillskeleton');
    const el = lib.create({ variant: 'circle', width: 40, height: '3rem', className: '  a   b ' });
    assert.ok(el.classList.contains('chillskeleton-circle'));
    assert.ok(el.classList.contains('chillskeleton-animate'));
    assert.ok(el.classList.contains('a') && el.classList.contains('b'));
    assert.equal(el.style.width, '40px');
    assert.equal(el.style.height, '3rem');
    assert.equal(el.getAttribute('aria-hidden'), 'true');
    assert.doesNotThrow(() => lib.create({ className: '', variant: 'x y"z' }));
    assert.ok(lib.create({ animation: 'pulse' }).classList.contains('chillskeleton-pulse'));
    assert.ok(!lib.create({ animate: false }).className.includes('animate'));
});

test('presets exist and have the expected structure', () => {
    const { lib } = load('chillskeleton');
    const avatar = lib.preset('avatar', { size: 56 });
    assert.equal(q(avatar, '.chillskeleton-circle').length, 1);
    assert.equal(q(avatar, '.chillskeleton-text').length, 2);
    assert.equal(avatar.querySelector('.chillskeleton-circle').style.width, '56px');
    assert.equal(q(lib.preset('avatar', { lines: 0 }), '.chillskeleton-text').length, 0);

    assert.equal(q(lib.preset('text', { lines: 4 }), '.chillskeleton-text').length, 4);
    const lines = q(lib.preset('text', { lines: 3 }), '.chillskeleton-text');
    assert.equal(lines[2].style.width, '70%');

    const card = lib.preset('card');
    assert.ok(card.classList.contains('chillskeleton-card'));
    assert.equal(q(card, '.chillskeleton-rounded').length, 1);

    assert.equal(q(lib.preset('list', { count: 3 }), '.chillskeleton-avatar-group').length, 3);
    const table = lib.preset('table', { rows: 2, cols: 3 });
    assert.equal(q(table, '.chillskeleton-row').length, 2);
    assert.equal(q(table, '.chillskeleton-text').length, 6);
    assert.equal(q(lib.preset('table-row', { cols: 5 }), '.chillskeleton-text').length, 5);
    assert.ok(lib.preset('title').querySelector('.chillskeleton-title'));
});

test('create({preset}) delegates to preset; unknown preset throws a helpful error', () => {
    const { lib } = load('chillskeleton');
    const el = lib.create({ preset: 'list', count: 2 });
    assert.equal(q(el, '.chillskeleton-avatar-group').length, 2);
    assert.throws(() => lib.preset('nope'), /unknown preset/);
});

test('groups are role=status + aria-busy + label; pieces inside stay hidden from AT', () => {
    const { lib } = load('chillskeleton');
    for (const name of ['avatar', 'text', 'card', 'list', 'table', 'table-row', 'title']) {
        const el = lib.preset(name, { label: 'Loading profile' });
        assert.equal(el.getAttribute('role'), 'status', name);
        assert.equal(el.getAttribute('aria-busy'), 'true', name);
        assert.equal(el.getAttribute('aria-label'), 'Loading profile', name);
        q(el, '.chillskeleton').forEach(p => assert.equal(p.getAttribute('aria-hidden'), 'true'));
    }
    assert.equal(lib.card().getAttribute('aria-label'), 'Loading');
});

test('animation options propagate to parts of a group', () => {
    const { lib } = load('chillskeleton');
    const still = lib.preset('card', { animate: false });
    assert.equal(q(still, '.chillskeleton-animate').length, 0);
    const pulse = lib.preset('list', { animation: 'pulse', count: 1 });
    assert.ok(q(pulse, '.chillskeleton-pulse').length > 0);
    assert.equal(q(pulse, '.chillskeleton-animate').length, 0);
});

test('reveal swaps in content and clears busy; setBusy/remove work', () => {
    const { lib, document } = load('chillskeleton');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sk = lib.preset('card');
    host.appendChild(sk);
    const real = document.createElement('p');
    real.id = 'real';
    lib.reveal(sk, real);
    assert.equal(host.querySelector('.chillskeleton-card'), null);
    assert.ok(host.querySelector('#real'));
    assert.equal(sk.getAttribute('aria-busy'), 'false');
    const sk2 = lib.preset('text');
    host.appendChild(sk2);
    lib.setBusy(sk2, false);
    assert.equal(sk2.getAttribute('aria-busy'), 'false');
    lib.remove(sk2);
    assert.equal(sk2.parentNode, null);
});

test('CSS: dark theme override, reduced motion disables shimmer and pulse, CSS injected once', () => {
    const { lib, document } = load('chillskeleton');
    lib.preset('card');
    lib.preset('card');
    assert.equal(document.querySelectorAll('#chillskeleton-styles').length, 1);
    const css = document.getElementById('chillskeleton-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    const rm = css.slice(css.indexOf('prefers-reduced-motion'));
    assert.match(rm, /chillskeleton-animate/);
    assert.match(rm, /chillskeleton-pulse/);
    assert.match(rm, /animation:\s*none/);
});

test('src declares window.ChillSkeleton', () => {
    assert.match(fs.readFileSync(sourceFile('chillskeleton'), 'utf8'), /window\.ChillSkeleton\s*=/);
});
