const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(opts = {}) {
    const ctx = load('chillfullscreen');
    const { window, document } = ctx;
    let fsEl = null;
    if (!opts.unsupported) {
        Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
        Object.defineProperty(document, 'fullscreenElement', { get: () => fsEl, configurable: true });
        const setFs = el => { fsEl = el; document.dispatchEvent(new window.Event('fullscreenchange')); };
        window.HTMLElement.prototype.requestFullscreen = function () { setFs(this); return Promise.resolve(); };
        document.exitFullscreen = function () { setFs(null); return Promise.resolve(); };
        ctx.setFs = setFs;
    }
    return ctx;
}

test('SSR: isSupported false and methods resolve false', async () => {
    const lib = loadSSR('chillfullscreen');
    assert.equal(lib.isSupported(), false);
    assert.equal(await lib.request(), false);
    assert.equal(await lib.exit(), false);
    assert.equal(lib.isFullscreen(), false);
});

test('unsupported environment (jsdom default): no throw, resolves false, button hidden', async () => {
    const { lib, document } = setup({ unsupported: true });
    assert.equal(lib.isSupported(), false);
    assert.equal(await lib.toggle(), false);
    const btn = lib.createButton();
    document.body.appendChild(btn.element);
    assert.equal(btn.element.hasAttribute('hidden'), true);
    btn.destroy();
});

test('request / exit / toggle / onChange', async () => {
    const { lib, document } = setup();
    assert.equal(lib.isSupported(), true);
    const el = document.createElement('div'); document.body.appendChild(el);
    const events = [];
    const off = lib.onChange(s => events.push([s.isFullscreen, s.element]));
    assert.equal(await lib.request(el), true);
    assert.equal(lib.isFullscreen(), true);
    assert.equal(lib.element(), el);
    assert.equal(await lib.toggle(el), true);
    assert.equal(lib.isFullscreen(), false);
    await lib.toggle(el);
    assert.equal(lib.isFullscreen(), true);
    assert.equal(events.length, 3);
    assert.equal(events[0][0], true); assert.equal(events[1][0], false);
    off();
    await lib.exit();
    assert.equal(events.length, 3);
});

test('request failure resolves false and fires onError', async () => {
    const { lib, window, document } = setup();
    window.HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error('denied'));
    const errs = [];
    const off = lib.onError(e => errs.push(e.message));
    assert.equal(await lib.request(document.body), false);
    assert.equal(errs.join(), 'denied');
    off();
});

test('webkit-prefixed fallback', async () => {
    const ctx = load('chillfullscreen');
    const { window, document, lib } = ctx;
    let fsEl = null;
    Object.defineProperty(document, 'webkitFullscreenEnabled', { value: true, configurable: true });
    Object.defineProperty(document, 'webkitFullscreenElement', { get: () => fsEl, configurable: true });
    window.HTMLElement.prototype.webkitRequestFullscreen = function () { fsEl = this; document.dispatchEvent(new window.Event('webkitfullscreenchange')); };
    document.webkitExitFullscreen = function () { fsEl = null; document.dispatchEvent(new window.Event('webkitfullscreenchange')); };
    assert.equal(lib.isSupported(), true);
    const seen = []; lib.onChange(s => seen.push(s.isFullscreen));
    await lib.request(document.body);
    assert.equal(lib.isFullscreen(), true);
    await lib.exit();
    assert.equal(seen.join(), 'true,false');
});

test('createButton: aria sync, click toggles, destroy cleans up listeners', async () => {
    const { lib, document, window } = setup();
    const target = document.createElement('div'); target.id = 't'; document.body.appendChild(target);
    const btn = lib.createButton({ target: '#t', size: 'lg', variant: 'solid' });
    document.body.appendChild(btn.element);
    const b = btn.element;
    assert.ok(b.classList.contains('chillfullscreen-btn-lg'));
    assert.equal(b.getAttribute('aria-pressed'), 'false');
    assert.equal(b.getAttribute('aria-label'), 'Enter fullscreen');
    assert.equal(b.hasAttribute('hidden'), false);
    b.click(); await Promise.resolve(); await Promise.resolve();
    assert.equal(lib.element(), target);
    assert.equal(b.getAttribute('aria-pressed'), 'true');
    assert.equal(b.getAttribute('aria-label'), 'Exit fullscreen');
    // ESC / external exit updates the button
    document.exitFullscreen();
    assert.equal(b.getAttribute('aria-pressed'), 'false');
    btn.destroy();
    assert.equal(document.querySelector('.chillfullscreen-btn'), null);
    // no leaked listener: dispatching must not throw / update detached button
    b.setAttribute('aria-pressed', 'x');
    document.dispatchEvent(new window.Event('fullscreenchange'));
    assert.equal(b.getAttribute('aria-pressed'), 'x');
});

test('init enhances existing buttons using data-chill-fullscreen and destroy restores', async () => {
    const { lib, document } = setup();
    document.body.innerHTML = '<div id="player"></div><button data-chill-fullscreen="#player">Go</button>';
    const inst = lib.init('[data-chill-fullscreen]');
    const b = document.querySelector('button');
    assert.ok(b.classList.contains('chillfullscreen-btn'));
    b.click(); await Promise.resolve(); await Promise.resolve();
    assert.equal(lib.element(), document.getElementById('player'));
    inst.destroy();
    assert.equal(b.classList.contains('chillfullscreen-btn'), false);
});
