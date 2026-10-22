const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');
const T = () => load('chilltoolkit').lib;
const wait = ms => new Promise(r => setTimeout(r, ms));

test('chilltoolkit loads in SSR and reports isBrowser false', () => {
    const lib = loadSSR('chilltoolkit');
    assert.equal(lib.isBrowser(), false);
});
test('isBrowser true in jsdom', () => assert.equal(T().isBrowser(), true));

test('debounce trailing, cancel, flush, leading', async () => {
    const { debounce } = T();
    let n = 0;
    const d = debounce(() => n++, 20);
    d(); d(); d();
    assert.equal(n, 0);
    await wait(50);
    assert.equal(n, 1);
    d(); d.cancel(); await wait(40);
    assert.equal(n, 1);
    d(); d.flush();
    assert.equal(n, 2);
    const lead = debounce(() => n++, 20, { leading: true, trailing: false });
    lead(); lead(); lead();
    assert.equal(n, 3);
    await wait(40);
    assert.equal(n, 3);
});

test('throttle leading + trailing', async () => {
    const { throttle } = T();
    const calls = [];
    const t = throttle(x => calls.push(x), 40);
    t(1); t(2); t(3);
    assert.equal(calls.join(), '1');
    await wait(80);
    assert.equal(calls.join(), '1,3');
});

test('rafThrottle coalesces', async () => {
    const { rafThrottle } = T();
    const calls = [];
    const r = rafThrottle(x => calls.push(x));
    r(1); r(2); r(3);
    await wait(60);
    assert.equal(calls.join(), '3');
});

test('uid unique with prefix', () => {
    const { uid } = T();
    const s = new Set(); for (let i = 0; i < 500; i++) s.add(uid('x-'));
    assert.equal(s.size, 500);
    assert.ok(uid('abc-').startsWith('abc-'));
});

test('clamp', () => {
    const { clamp } = T();
    assert.equal(clamp(5, 0, 3), 3);
    assert.equal(clamp(-5, 0, 3), 0);
    assert.equal(clamp(2, 0, 3), 2);
    assert.equal(clamp(NaN, 1, 3), 1);
    assert.equal(clamp(9, 5, 0), 5);
});

test('formatBytes', () => {
    const { formatBytes } = T();
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1023), '1023 B');
    assert.equal(formatBytes(1536, { locale: 'en-US' }), '1.5 KB');
    assert.equal(formatBytes(1048576), '1 MB');
    assert.equal(formatBytes(1500, { binary: false, locale: 'en-US' }), '1.5 kB');
    assert.equal(formatBytes(-2048), '-2 KB');
});

test('formatNumber', () => {
    const { formatNumber } = T();
    assert.equal(formatNumber(1234567.891, { locale: 'en-US', maximumFractionDigits: 1 }), '1,234,567.9');
    assert.equal(formatNumber(1500, { locale: 'en-US', compact: true }), '1.5K');
    assert.equal(formatNumber(5, { locale: 'en-US', style: 'currency', currency: 'USD' }), '$5.00');
});

test('slugify', () => {
    const { slugify } = T();
    assert.equal(slugify('Héllo Wörld!'), 'hello-world');
    assert.equal(slugify('  Rock & Roll  '), 'rock-and-roll');
    assert.equal(slugify('A_B C', { separator: '_' }), 'a_b_c');
    assert.equal(slugify('Keep Case', { lower: false }), 'Keep-Case');
});

test('escapeHtml / unescapeHtml', () => {
    const { escapeHtml, unescapeHtml } = T();
    const s = `<img src=x onerror="a('b')">&`;
    const e = escapeHtml(s);
    assert.ok(!e.includes('<'));
    assert.equal(unescapeHtml(e), s);
    assert.equal(escapeHtml(null), '');
});

test('deepMerge does not mutate and blocks prototype pollution', () => {
    const { deepMerge } = T();
    const a = { x: { y: 1, z: [1] }, k: 1 };
    const b = JSON.parse('{"x":{"y":2},"__proto__":{"polluted":true},"n":[2]}');
    const m = deepMerge(a, b);
    assert.equal(JSON.stringify(m), JSON.stringify({ x: { y: 2, z: [1] }, k: 1, n: [2] }));
    assert.equal(a.x.y, 1);
    assert.equal({}.polluted, undefined);
    m.x.z.push(9);
    assert.equal(JSON.stringify(a.x.z), '[1]');
});

test('sleep resolves and can be aborted', async () => {
    const { sleep } = T();
    const t = Date.now(); await sleep(30); assert.ok(Date.now() - t >= 25);
    const ac = new AbortController();
    const p = sleep(1000, ac.signal); ac.abort();
    await assert.rejects(p, { name: 'AbortError' });
});

test('once', () => {
    const { once } = T();
    let n = 0; const f = once(() => ++n);
    assert.equal(f(), 1); assert.equal(f(), 1); assert.equal(n, 1);
});
