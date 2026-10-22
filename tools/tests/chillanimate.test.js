const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

// jsdom has no WAAPI: install a controllable fake.
function setup(opts = {}) {
    const ctx = load('chillanimate');
    const { window, document } = ctx;
    const calls = [];
    if (!opts.noWaapi) {
        window.HTMLElement.prototype.animate = function (keyframes, options) {
            const a = { keyframes, options, cancelled: false, finished: false,
                cancel() { this.cancelled = true; this.oncancel && this.oncancel(); },
                finish() { this.finished = true; this.onfinish && this.onfinish(); } };
            calls.push(a);
            return a;
        };
    }
    if (opts.reduced) window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    const el = document.createElement('div');
    document.body.appendChild(el);
    Object.defineProperty(el, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: 100, configurable: true });
    return Object.assign(ctx, { calls, el });
}

test('SSR import is safe', () => { assert.ok(loadSSR('chillanimate').fadeIn); });

test('fadeIn shows element and animates opacity, resolves on finish', async () => {
    const { lib, el, calls } = setup();
    el.style.display = 'none'; el.setAttribute('hidden', '');
    const p = lib.fadeIn(el, { duration: 100 });
    assert.equal(el.hasAttribute('hidden'), false);
    assert.notEqual(el.style.display, 'none');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].keyframes[0].opacity, 0);
    assert.equal(calls[0].options.duration, 100);
    calls[0].finish();
    assert.equal(await p, el);
});

test('fadeOut hides when finished, not before; hide:false keeps display', async () => {
    const { lib, el, calls } = setup();
    const p = lib.fadeOut(el);
    assert.notEqual(el.style.display, 'none');
    calls[0].finish(); await p;
    assert.equal(el.style.display, 'none');
    el.style.display = '';
    const p2 = lib.fadeOut(el, { hide: false });
    calls[1].finish(); await p2;
    assert.notEqual(el.style.display, 'none');
});

test('cancel resolves the promise but skips the end state', async () => {
    const { lib, el, calls } = setup();
    const p = lib.fadeOut(el);
    p.cancel();
    assert.equal(await p, el);
    assert.notEqual(el.style.display, 'none');
});

test('slideUp / slideDown animate height and clean inline styles', async () => {
    const { lib, el, calls } = setup();
    const up = lib.slideUp(el);
    assert.equal(calls[0].keyframes[0].height, '100px');
    assert.equal(calls[0].keyframes[1].height, '0px');
    assert.equal(el.style.overflow, 'hidden');
    calls[0].finish(); await up;
    assert.equal(el.style.display, 'none');
    assert.equal(el.style.overflow, '');
    const down = lib.slideDown(el);
    assert.equal(calls[1].keyframes[1].height, '100px');
    calls[1].finish(); await down;
    assert.notEqual(el.style.display, 'none');
    assert.equal(el.style.height, '');
});

test('collapse / expand toggle [hidden] and aria-expanded on trigger', async () => {
    const { lib, el, calls, document } = setup();
    const btn = document.createElement('button'); document.body.appendChild(btn);
    const c = lib.collapse(el, { trigger: btn });
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(el.hasAttribute('hidden'), false);
    calls[0].finish(); await c;
    assert.equal(el.hasAttribute('hidden'), true);
    const e = lib.expand(el, { trigger: btn });
    assert.equal(el.hasAttribute('hidden'), false);
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    calls[1].finish(); await e;
});

test('starting a new animation cancels the previous one cleanly', async () => {
    const { lib, el, calls } = setup();
    const a = lib.slideUp(el);
    const b = lib.slideDown(el);
    assert.equal(calls[0].cancelled, true);
    assert.equal(await a, el);
    // slideUp's end state (display:none) must NOT have been applied, slideDown's overflow must survive
    assert.notEqual(el.style.display, 'none');
    assert.equal(el.style.overflow, 'hidden');
    calls[1].finish(); await b;
    assert.equal(el.style.overflow, '');
});

test('shake and pulse produce transform keyframes', async () => {
    const { lib, el, calls } = setup();
    const s = lib.shake(el); calls[0].finish(); await s;
    assert.ok(calls[0].keyframes.length >= 4);
    assert.ok(/translateX/.test(calls[0].keyframes[1].transform));
    const p = lib.pulse(el, { scale: 1.5 }); calls[1].finish(); await p;
    assert.ok(calls[1].keyframes.some(k => k.transform === 'scale(1.5)'));
});

test('prefers-reduced-motion applies end state without animating', async () => {
    const { lib, el, calls } = setup({ reduced: true });
    await lib.fadeOut(el);
    assert.equal(calls.length, 0);
    assert.equal(el.style.display, 'none');
    await lib.collapse(el);
    assert.equal(el.hasAttribute('hidden'), true);
    // opt-out
    el.style.display = '';
    lib.fadeIn(el, { respectReducedMotion: false });
    assert.equal(calls.length, 1);
});

test('works without WAAPI (instant end state) and with missing elements', async () => {
    const { lib, el, document } = setup({ noWaapi: true });
    await lib.fadeOut(el);
    assert.equal(el.style.display, 'none');
    await lib.fadeIn(el);
    assert.notEqual(el.style.display, 'none');
    assert.equal(await lib.fadeIn(null), null);
    assert.equal(await lib.shake('#nope'), null);
});

test('selector strings are accepted and stop() cancels', async () => {
    const { lib, el, calls } = setup();
    el.id = 'x';
    const p = lib.pulse('#x');
    assert.equal(lib.stop('#x'), true);
    assert.equal(calls[0].cancelled, true);
    await p;
    assert.equal(lib.stop(el), false);
});
