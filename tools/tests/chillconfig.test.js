const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

test('SSR import safe; works in memory without storage or console noise', () => {
    const lib = loadSSR('chillconfig');
    const c = lib.create({ storageKey: 'x', defaults: { a: 1 } });
    c.set('a', 2);
    assert.equal(c.get('a'), 2);
    c.destroy();
});

test('get/set with dotted paths, defaults, has, remove', () => {
    const { lib } = load('chillconfig');
    const c = lib.create({ persist: false, defaults: { ui: { theme: 'light' } } });
    assert.equal(c.get('ui.theme'), 'light');
    assert.equal(c.get('ui.nope', 'dflt'), 'dflt');
    c.set('a.b.c', 5);
    assert.equal(c.get('a.b.c'), 5);
    assert.equal(c.has('a.b'), true); assert.equal(c.has('zzz'), false);
    c.remove('a.b.c');
    assert.equal(c.get('a.b.c'), undefined);
    c.remove('does.not.exist');
    c.set({ x: 1, y: 2 });
    assert.equal(c.get('y'), 2);
    c.destroy();
});

test('prototype pollution via dotted path / merge is blocked', () => {
    const { lib } = load('chillconfig');
    const c = lib.create({ persist: false });
    c.set('__proto__.polluted', 1);
    c.set('a.__proto__.polluted', 1);
    c.set('constructor.prototype.polluted', 1);
    c.merge(JSON.parse('{"__proto__":{"polluted":true}}'));
    c.remove('__proto__.x');
    assert.equal({}.polluted, undefined);
    assert.equal(c.get('__proto__.polluted'), undefined);
    c.destroy();
});

test('reset restores nested defaults (they are cloned, not shared)', () => {
    const { lib } = load('chillconfig');
    const defaults = { ui: { theme: 'light', list: [1] } };
    const c = lib.create({ persist: false, defaults });
    c.set('ui.theme', 'dark');
    c.get('ui').theme = 'hacked'; // get() returns a copy
    assert.equal(c.get('ui.theme'), 'dark');
    c.reset();
    assert.equal(c.get('ui.theme'), 'light');
    assert.equal(defaults.ui.theme, 'light');
    c.destroy();
});

test('persists to localStorage under storageKey and reloads, deep-merging over defaults', () => {
    const { lib, window } = load('chillconfig');
    const c = lib.create({ storageKey: 'app', defaults: { ui: { a: 1, b: 2 } } });
    c.set('ui.a', 10);
    assert.equal(JSON.parse(window.localStorage.getItem('app')).ui.a, 10);
    const c2 = lib.create({ storageKey: 'app', defaults: { ui: { a: 1, b: 2, c: 3 } } });
    assert.equal(c2.get('ui.a'), 10);
    assert.equal(c2.get('ui.c'), 3); // new default key still present
    c.destroy(); c2.destroy();
});

test('corrupt storage falls back to defaults without throwing', () => {
    const { lib, window } = load('chillconfig');
    window.localStorage.setItem('bad', '{not json');
    const origWarn = console.warn; console.warn = () => {};
    try {
        const c = lib.create({ storageKey: 'bad', defaults: { a: 1 } });
        assert.equal(c.get('a'), 1);
        c.destroy();
    } finally { console.warn = origWarn; }
});

test('persist:false never touches storage; blocked storage uses memory', () => {
    const { lib, window } = load('chillconfig');
    const c = lib.create({ storageKey: 'np', persist: false });
    c.set('a', 1);
    assert.equal(window.localStorage.getItem('np'), null);
    const b = load('chillconfig');
    Object.defineProperty(b.window, 'localStorage', { get() { throw new Error('denied'); } });
    const c2 = b.lib.create({ storageKey: 'k', defaults: { v: 1 } });
    c2.set('v', 2);
    assert.equal(c2.get('v'), 2);
    c2.load();
    assert.equal(c2.get('v'), 2); // memory fallback survives load()
    c2.destroy();
});

test('quota error on save does not throw', () => {
    const { lib, window } = load('chillconfig');
    const c = lib.create({ storageKey: 'q' });
    window.Storage.prototype.setItem = function () { throw new Error('Quota'); };
    const w = console.warn; console.warn = () => {};
    try { assert.doesNotThrow(() => c.set('a', 1)); } finally { console.warn = w; }
    assert.equal(c.get('a'), 1);
});

test('subscribe gets (config, key); isolated errors; onChange option; unsubscribe', () => {
    const { lib } = load('chillconfig');
    const seen = [];
    const c = lib.create({ persist: false, onChange: (cfg, k) => seen.push('opt:' + k) });
    c.subscribe(() => { throw new Error('x'); });
    const off = c.subscribe((cfg, k) => seen.push(String(k)));
    const w = console.error; console.error = () => {};
    try { c.set('a.b', 1); c.reset(); } finally { console.error = w; }
    assert.equal(seen.join(), 'opt:a.b,a.b,opt:null,null');
    off();
    c.set('z', 1);
    assert.equal(seen.length, 4 + 1); // only the option handler fired
    assert.throws(() => c.subscribe(1), { name: 'TypeError' });
    c.destroy();
});

test('cross-tab storage event reloads config and notifies; destroy removes listener', () => {
    const { lib, window } = load('chillconfig');
    const c = lib.create({ storageKey: 'ct', defaults: { v: 1 } });
    const seen = [];
    c.subscribe(cfg => seen.push(cfg.v));
    window.localStorage.setItem('ct', JSON.stringify({ v: 42 }));
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'ct', newValue: '{"v":42}', storageArea: window.localStorage }));
    assert.equal(c.get('v'), 42);
    assert.equal(seen.join(), '42');
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'other', storageArea: window.localStorage }));
    assert.equal(seen.length, 1);
    c.destroy();
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'ct', newValue: '{"v":7}', storageArea: window.localStorage }));
    assert.equal(c.get('v'), 42);
});

test('sessionStorage type and sync:false', () => {
    const { lib, window } = load('chillconfig');
    const c = lib.create({ storageKey: 's', type: 'session', sync: false });
    c.set('a', 1);
    assert.ok(window.sessionStorage.getItem('s'));
    assert.equal(window.localStorage.getItem('s'), null);
    c.destroy();
});
