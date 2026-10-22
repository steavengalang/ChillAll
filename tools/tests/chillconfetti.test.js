const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function fakeCtx() {
    const calls = { fillRect: 0, ellipse: 0, clearRect: 0, fills: [] };
    const noop = () => {};
    const ctx = new Proxy({}, {
        get(t, k) {
            if (k === 'fillRect') return () => { calls.fillRect++; };
            if (k === 'ellipse') return () => { calls.ellipse++; };
            if (k === 'clearRect') return () => { calls.clearRect++; };
            if (k === '__calls') return calls;
            return t[k] !== undefined ? t[k] : noop;
        },
        set(t, k, v) { t[k] = v; if (k === 'fillStyle') calls.fills.push(v); return true; }
    });
    return ctx;
}

function env() {
    const e = load('chillconfetti');
    const ctx = fakeCtx();
    e.window.HTMLCanvasElement.prototype.getContext = () => ctx;
    e.ctx = ctx;
    return e;
}

test('chillconfetti is SSR safe and fire() resolves without DOM', async () => {
    const lib = loadSSR('chillconfetti');
    assert.ok(lib.version);
    await lib.fire();
});

test('chillconfetti fire draws particles on a pointer-events:none aria-hidden canvas and cleans up', async () => {
    const { lib, document, ctx } = env();
    const p = lib.fire({ count: 20, ticks: 6, colors: ['#ff0000'] });
    const canvas = document.querySelector('canvas.chillconfetti-canvas');
    assert.ok(canvas);
    assert.equal(canvas.getAttribute('aria-hidden'), 'true');
    assert.match(canvas.style.cssText, /pointer-events:\s*none/);
    assert.equal(lib.active, true);
    await p;
    assert.ok(ctx.__calls.fillRect + ctx.__calls.ellipse > 0, 'particles drawn');
    assert.ok(ctx.__calls.fills.includes('#ff0000'), 'uses configured colours');
    assert.equal(document.querySelector('canvas'), null, 'canvas removed automatically');
    assert.equal(lib.active, false);
});

test('chillconfetti skips under prefers-reduced-motion unless disabled', async () => {
    const { lib, window, document } = env();
    window.matchMedia = q => ({ matches: /reduced-motion/.test(q), addEventListener() {}, removeEventListener() {} });
    await lib.fire({ count: 10 });
    assert.equal(document.querySelector('canvas'), null);
    assert.equal(lib.active, false);
    const p = lib.fire({ count: 5, ticks: 3, disableForReducedMotion: false });
    assert.ok(document.querySelector('canvas'));
    await p;
});

test('chillconfetti multiple bursts share one canvas; reset() stops them and resolves promises', async () => {
    const { lib, document } = env();
    const a = lib.fire({ count: 30, ticks: 500 });
    const b = lib.fire({ count: 30, ticks: 500, origin: { x: 0.1, y: 0.9 } });
    assert.equal(document.querySelectorAll('canvas').length, 1);
    lib.reset();
    await Promise.all([a, b]);
    assert.equal(document.querySelector('canvas'), null);
    assert.equal(lib.active, false);
});

test('chillconfetti handles element origin, zero count and missing 2d context', async () => {
    const { lib, window, document } = env();
    const el = document.createElement('button'); document.body.appendChild(el);
    el.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 40 });
    const p = lib.fire({ origin: el, count: 5, ticks: 3 });
    await p;
    await lib.fire({ count: 0 });
    assert.equal(document.querySelector('canvas'), null);
    window.HTMLCanvasElement.prototype.getContext = () => null;
    await lib.fire({ count: 10 });
    assert.equal(document.querySelector('canvas'), null, 'no ctx => cleanly aborts');
});
