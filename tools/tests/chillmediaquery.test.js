const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

// fake matchMedia driven by a viewport width
function setup(width = 1000, legacy = false) {
    const ctx = load('chillmediaquery');
    const state = { width, lists: [] };
    const evalQ = q => {
        if (q === '(prefers-color-scheme: dark)') return !!state.dark;
        if (q === '(prefers-reduced-motion: reduce)') return !!state.reduced;
        const min = /\(min-width:\s*(\d+)px\)/.exec(q), max = /\(max-width:\s*(\d+)px\)/.exec(q);
        return (!min || state.width >= +min[1]) && (!max || state.width <= +max[1]);
    };
    ctx.window.matchMedia = q => {
        const l = {
            media: q, handlers: new Set(), last: evalQ(q),
            get matches() { return evalQ(q); }
        };
        if (legacy) { l.addListener = h => l.handlers.add(h); l.removeListener = h => l.handlers.delete(h); }
        else { l.addEventListener = (t, h) => l.handlers.add(h); l.removeEventListener = (t, h) => l.handlers.delete(h); }
        state.lists.push(l);
        return l;
    };
    state.resize = w => {
        state.width = w;
        state.lists.forEach(l => { const now = evalQ(l.media); if (now !== l.last) { l.last = now; l.handlers.forEach(h => h({ matches: now, media: l.media })); } });
    };
    state.active = () => state.lists.reduce((n, l) => n + l.handlers.size, 0);
    return Object.assign(ctx, { state });
}

test('SSR import safe: matches false (or fallback), watch no-op, no throw', () => {
    const lib = loadSSR('chillmediaquery');
    assert.equal(lib.matches('md'), false);
    assert.equal(lib.matches('md', { fallback: true }), true);
    let got = null;
    const stop = lib.watch('md', v => { got = v; });
    assert.equal(got, false);
    stop();
    assert.equal(lib.getCurrentBreakpoint(), 'xs');
    assert.equal(lib.isMobile(), false);
    assert.equal(lib.prefersReducedMotion(), false);
});

test('named breakpoints, raw queries and current breakpoint', () => {
    const { lib, state } = setup(1000);
    assert.equal(lib.matches('md'), true);
    assert.equal(lib.matches('xl'), false);
    assert.equal(lib.matches('(min-width: 900px)'), true);
    assert.equal(lib.getCurrentBreakpoint(), 'lg');
    assert.equal(lib.isDesktop(), false); assert.equal(lib.isMobile(), false); assert.equal(lib.isTablet(), true);
    state.width = 500;
    assert.equal(lib.getCurrentBreakpoint(), 'xs'); assert.equal(lib.isMobile(), true);
    state.width = 1500; assert.equal(lib.getCurrentBreakpoint(), 'xxl');
    state.width = 1000;
    assert.equal(lib.isBreakpoint('md'), true); assert.equal(lib.isBreakpoint('xl'), false); assert.equal(lib.isBreakpoint('xs'), true);
});

test('watch: immediate call, change events, stop function and unwatch(id)', () => {
    const { lib, state } = setup(1000);
    const seen = [];
    const stop = lib.watch('mobile', v => seen.push(v));
    assert.equal(seen.join(), 'false');
    state.resize(500);
    state.resize(1000);
    assert.equal(seen.join(), 'false,true,false');
    stop();
    state.resize(500);
    assert.equal(seen.length, 3);
    assert.equal(state.active(), 0);
    const noImm = [];
    const s2 = lib.watch('mobile', v => noImm.push(v), { immediate: false });
    assert.equal(noImm.length, 0);
    lib.unwatch(s2.id);
    assert.equal(state.active(), 0);
});

test('legacy Safari addListener / removeListener fallback', () => {
    const { lib, state } = setup(1000, true);
    const seen = [];
    const stop = lib.watch('mobile', v => seen.push(v), { immediate: false });
    assert.equal(state.active(), 1);
    state.resize(300);
    assert.equal(seen.join(), 'true');
    stop();
    assert.equal(state.active(), 0);
});

test('matchMedia that throws or is missing does not throw', () => {
    const { lib, window } = setup();
    window.matchMedia = () => { throw new Error('boom'); };
    assert.equal(lib.matches('md'), false);
    window.matchMedia = undefined;
    assert.equal(lib.matches('md'), false);
    assert.equal(lib.isDark(), false);
});

test('watchBreakpoint reports only real breakpoint changes and cleans up', () => {
    const { lib, state } = setup(1000);
    const seen = [];
    const stop = lib.watchBreakpoint(bp => seen.push(bp));
    assert.equal(seen.join(), 'lg');
    state.resize(1100);                // still lg
    state.resize(1250);                // xl
    state.resize(800);                 // md  (crosses lg and xl thresholds in one step -> one report)
    assert.equal(seen.join(), 'lg,xl,md');
    stop();
    assert.equal(state.active(), 0);
    state.resize(300);
    assert.equal(seen.length, 3);
});

test('callback errors are contained; unwatchAll removes everything', () => {
    const { lib, state } = setup(1000);
    const w = console.error; console.error = () => {};
    try {
        lib.watch('mobile', () => { throw new Error('x'); }, { immediate: false });
        state.resize(300);
    } finally { console.error = w; }
    lib.watch('tablet', () => {}); lib.watch('dark', () => {});
    assert.ok(state.active() >= 3);
    lib.unwatchAll();
    assert.equal(state.active(), 0);
});

test('dark / reduced motion helpers and setBreakpoints override', () => {
    const { lib, state } = setup(1000);
    state.dark = true; state.reduced = true;
    assert.equal(lib.isDark(), true); assert.equal(lib.prefersReducedMotion(), true);
    assert.equal(lib.matches('reducedMotion'), true);
    lib.setBreakpoints({ md: '(min-width: 1200px)', wide: '(min-width: 1800px)' });
    assert.equal(lib.matches('md'), false);
    assert.equal(lib.matches('wide'), false);
    state.width = 1900;
    assert.equal(lib.matches('wide'), true);
});
