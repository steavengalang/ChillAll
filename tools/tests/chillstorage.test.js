const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));

test('chillstorage SSR import does not throw and falls back to memory', () => {
    const lib = loadSSR('chillstorage');
    const s = lib.create({ namespace: 'x' });
    assert.equal(s.backend, 'memory');
    s.set('a', { b: 1 });
    assert.equal(s.get('a').b, 1);
});

test('typed JSON roundtrip with namespace on localStorage', () => {
    const { lib, window } = load('chillstorage');
    const s = lib.create({ namespace: 'app' });
    assert.equal(s.backend, 'local');
    s.set('n', 42); s.set('o', { a: [1, 2] }); s.set('b', false); s.set('z', null);
    assert.equal(s.get('n'), 42);
    assert.equal(s.get('o').a[1], 2);
    assert.equal(s.get('b'), false);
    assert.equal(s.get('z'), null);
    assert.equal(s.get('missing', 'dflt'), 'dflt');
    assert.ok(window.localStorage.getItem('app:n'));
    assert.equal(s.keys().sort().join(), 'b,n,o,z');
    // namespaces are isolated
    const other = lib.create({ namespace: 'other' });
    assert.equal(other.get('n'), null);
    s.clear();
    assert.equal(s.keys().length, 0);
    s.destroy();
});

test('sessionStorage + memory types', () => {
    const { lib, window } = load('chillstorage');
    const ss = lib.create({ type: 'session', namespace: 's' });
    ss.set('k', 1);
    assert.equal(ss.backend, 'session');
    assert.ok(window.sessionStorage.getItem('s:k'));
    assert.equal(window.localStorage.getItem('s:k'), null);
    const m = lib.create({ type: 'memory' });
    m.set('k', 2);
    assert.equal(m.backend, 'memory');
    assert.equal(window.localStorage.length, 0);
});

test('TTL expiry', async () => {
    const { lib } = load('chillstorage');
    const s = lib.create({ namespace: 't' });
    s.set('short', 'v', { ttl: 0.05 });
    s.set('long', 'v', { ttl: 100 });
    assert.equal(s.get('short'), 'v');
    assert.ok(s.ttl('long') > 90);
    await wait(80);
    assert.equal(s.get('short'), null);
    assert.equal(s.has('short'), false);
    assert.equal(s.get('long'), 'v');
    s.set('p', 1, { ttl: 0.02 });
    await wait(40);
    assert.equal(s.purgeExpired(), 1);
});

test('falls back to memory when storage throws (private mode)', () => {
    const { lib, window } = load('chillstorage');
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
    const s = lib.create({ namespace: 'p' });
    assert.equal(s.backend, 'memory');
    s.set('a', 1);
    assert.equal(s.get('a'), 1);
    assert.equal(lib.isSupported('local'), false);
});

test('quota error reports via onError and returns false', () => {
    const { lib, window } = load('chillstorage');
    const errs = [];
    const s = lib.create({ namespace: 'q', onError: (e, op) => errs.push(op) });
    window.Storage.prototype.setItem = function () { throw new Error('QuotaExceeded'); };
    assert.equal(s.set('a', 1), false);
    assert.equal(errs.join(), 'set');
});

test('circular value does not throw', () => {
    const { lib } = load('chillstorage');
    const s = lib.create({});
    const a = {}; a.self = a;
    assert.equal(s.set('c', a), false);
});

test('subscribe: same-tab changes and cross-tab storage events', () => {
    const { lib, window } = load('chillstorage');
    const s = lib.create({ namespace: 'sub' });
    const seen = [];
    const off = s.subscribe('theme', (v, old, k) => seen.push([k, v, old]));
    const all = [];
    s.subscribe((v, o, k) => all.push(k));
    s.set('theme', 'dark');
    s.set('other', 1);
    s.remove('theme');
    assert.equal(seen.length, 2);
    assert.equal(seen[0][1], 'dark'); assert.equal(seen[1][1], null); assert.equal(seen[1][2], 'dark');
    assert.equal(all.join(), 'theme,other,theme');
    // simulate another tab
    const ev = new window.StorageEvent('storage', {
        key: 'sub:theme', newValue: JSON.stringify({ __chill: 1, v: 'light' }), oldValue: null, storageArea: window.localStorage
    });
    window.dispatchEvent(ev);
    assert.equal(seen[2][1], 'light');
    // other namespace ignored
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'zzz:theme', newValue: '1', storageArea: window.localStorage }));
    assert.equal(seen.length, 3);
    off();
    s.set('theme', 'x');
    assert.equal(seen.length, 3);
    const before = all.length;
    s.destroy();
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'sub:theme', newValue: '"y"', storageArea: window.localStorage }));
    assert.equal(all.length, before);
});

test('foreign (non-chill) values are readable', () => {
    const { lib, window } = load('chillstorage');
    window.localStorage.setItem('raw', 'hello');
    window.localStorage.setItem('num', '5');
    const s = lib.create({});
    assert.equal(s.get('raw'), 'hello');
    assert.equal(s.get('num'), 5);
});

test('destroy removes the storage listener', () => {
    const { lib, window } = load('chillstorage');
    let added = 0, removed = 0;
    const a = window.addEventListener.bind(window), r = window.removeEventListener.bind(window);
    window.addEventListener = (t, f, o) => { if (t === 'storage') added++; return a(t, f, o); };
    window.removeEventListener = (t, f, o) => { if (t === 'storage') removed++; return r(t, f, o); };
    const s = lib.create({});
    s.destroy(); s.destroy();
    assert.equal(added, 1); assert.equal(removed, 1);
});
