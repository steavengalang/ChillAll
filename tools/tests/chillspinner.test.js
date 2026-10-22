const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

test('chillspinner is SSR safe', () => {
    assert.ok(loadSSR('chillspinner').version);
});

test('chillspinner creates each type with status role and accessible label', () => {
    const { lib, document } = load('chillspinner');
    for (const [type, kids] of [['ring', 0], ['dots', 3], ['bars', 4], ['pulse', 0]]) {
        const s = lib.create({ type, label: 'Saving', size: 'lg', color: 'success' });
        document.body.appendChild(s.element);
        assert.ok(s.element.classList.contains('chillspinner-' + type));
        assert.equal(s.element.getAttribute('role'), 'status');
        assert.equal(s.element.querySelectorAll('.chillspinner-shape i').length, kids);
        assert.equal(s.element.querySelector('.chillspinner-sr').textContent, 'Saving');
        assert.equal(s.element.style.getPropertyValue('--chillspinner-size'), '48px');
        s.destroy();
        assert.equal(document.querySelector('.chillspinner'), null);
    }
});

test('chillspinner label is text-only, custom size and colour', () => {
    const { lib, document } = load('chillspinner');
    const s = lib.create({ label: '<img src=x onerror=alert(1)>', showLabel: true, size: 40, color: '#ff00aa' });
    document.body.appendChild(s.element);
    assert.equal(document.querySelectorAll('img').length, 0);
    assert.equal(s.element.style.getPropertyValue('--chillspinner-size'), '40px');
    assert.equal(s.element.style.getPropertyValue('--chillspinner-color'), '#ff00aa');
    s.setLabel('Done');
    assert.equal(s.element.querySelector('.chillspinner-text').textContent, 'Done');
});

test('ChillSpinner.overlay covers element, sets aria-busy, restores position, destroys cleanly', () => {
    const { lib, document } = load('chillspinner');
    document.body.innerHTML = '<div id="card" style="height:100px">content</div>';
    const card = document.getElementById('card');
    const o = lib.overlay(card, { label: 'Loading card' });
    assert.equal(card.style.position, 'relative');
    assert.equal(card.getAttribute('aria-busy'), 'true');
    assert.ok(card.querySelector('.chillspinner-overlay'));
    assert.equal(lib.overlay('#card'), o, 'reuses existing overlay');
    o.hide();
    assert.equal(card.hasAttribute('aria-busy'), false);
    assert.equal(card.querySelector('.chillspinner-overlay').hidden, true);
    o.show();
    assert.equal(card.getAttribute('aria-busy'), 'true');
    o.destroy();
    assert.equal(card.querySelector('.chillspinner-overlay'), null);
    assert.equal(card.style.position, '');
    assert.equal(card.hasAttribute('aria-busy'), false);
});

test('ChillSpinner.overlay delay avoids flicker when hidden before delay elapses', async () => {
    const { lib, document } = load('chillspinner');
    document.body.innerHTML = '<div id="c"></div>';
    const c = document.getElementById('c');
    const o = lib.overlay(c, { delay: 30 });
    assert.equal(c.hasAttribute('aria-busy'), false);
    o.hide();
    await new Promise(r => setTimeout(r, 60));
    assert.equal(c.hasAttribute('aria-busy'), false);
    o.show();
    await new Promise(r => setTimeout(r, 60));
    assert.equal(c.getAttribute('aria-busy'), 'true');
    o.destroy();
});

test('ChillSpinner.fullscreen mounts on body and removes on destroy', () => {
    const { lib, document } = load('chillspinner');
    const f = lib.fullscreen({ label: 'Please wait' });
    assert.ok(document.querySelector('.chillspinner-fullscreen'));
    assert.equal(document.querySelector('.chillspinner-sr').textContent, 'Please wait');
    f.destroy();
    assert.equal(document.querySelector('.chillspinner-fullscreen'), null);
    assert.equal(document.body.hasAttribute('aria-busy'), false);
});

test('ChillSpinner.init fills elements using data attributes', () => {
    const { lib, document } = load('chillspinner');
    document.body.innerHTML = '<div data-chill-spinner data-type="bars" data-size="sm" data-label="Wait"></div>';
    const h = lib.init('[data-chill-spinner]');
    const s = document.querySelector('.chillspinner');
    assert.ok(s.classList.contains('chillspinner-bars'));
    assert.equal(s.style.getPropertyValue('--chillspinner-size'), '20px');
    h.destroy();
    assert.equal(document.querySelector('.chillspinner'), null);
});

test('chillspinner CSS has dark theme + reduced motion and injects once', () => {
    const { lib, document } = load('chillspinner');
    lib.create({}); lib.create({});
    assert.equal(document.querySelectorAll('#chillspinner-styles').length, 1);
    const css = document.getElementById('chillspinner-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /prefers-reduced-motion/);
});
