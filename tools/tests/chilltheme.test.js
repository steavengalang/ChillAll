const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function mm(initial) {
    const state = { matches: initial, handlers: new Set(), legacy: new Set() };
    const mql = {
        get matches() { return state.matches; }, media: '(prefers-color-scheme: dark)',
        addEventListener(t, h) { state.handlers.add(h); }, removeEventListener(t, h) { state.handlers.delete(h); }
    };
    state.mql = mql;
    state.set = v => { state.matches = v; state.handlers.forEach(h => h({ matches: v })); state.legacy.forEach(h => h({ matches: v })); };
    return state;
}
function setup(opts = {}) {
    const ctx = load('chilltheme');
    const { window } = ctx;
    const media = mm(!!opts.dark);
    if (!opts.noMatchMedia) window.matchMedia = () => media.mql;
    else window.matchMedia = undefined;
    if (opts.stored) window.localStorage.setItem(opts.key || 'chill-theme', opts.stored);
    ctx.media = media;
    return ctx;
}
const root = d => d.documentElement;

test('SSR import safe and API still callable without document', () => {
    const lib = loadSSR('chilltheme');
    assert.equal(lib.setTheme('dark'), true);
    assert.equal(lib.getResolvedTheme(), 'dark');
    assert.ok(lib.noFlashScript().includes('data-theme'));
});

test('auto-init is idempotent and applies data-theme + class on <html>', async () => {
    const { lib, document, window } = setup({ dark: true });
    await new Promise(r => setTimeout(r, 50)); // jsdom: readyState is 'loading' at eval -> DOMContentLoaded
    assert.equal(window.__chilltheme_auto_inited__, true);
    lib.init(); lib.init();
    assert.equal(root(document).getAttribute('data-theme'), 'dark');
    assert.ok(root(document).classList.contains('dark'));
    assert.ok(!root(document).classList.contains('light'));
});

test('does not stack matchMedia listeners when init is called repeatedly', () => {
    const { lib, media } = setup();
    lib.init(); lib.init(); lib.init();
    assert.equal(media.handlers.size, 1);
    lib.destroy();
    assert.equal(media.handlers.size, 0);
});

test('setTheme validates input, persists, notifies and returns boolean', () => {
    const { lib, document, window } = setup();
    lib.init();
    const calls = [];
    lib.onChange((resolved, setting) => calls.push([resolved, setting]));
    assert.equal(lib.setTheme('purple'), false);
    assert.equal(lib.setTheme(undefined), false);
    assert.equal(calls.length, 0);
    assert.equal(lib.setTheme('dark'), true);
    assert.equal(window.localStorage.getItem('chill-theme'), 'dark');
    assert.equal(root(document).getAttribute('data-theme'), 'dark');
    assert.equal(calls[0].join(), 'dark,dark');
    assert.equal(lib.setTheme('system'), true);
    assert.equal(calls[1].join(), 'light,system');
    assert.equal(lib.getTheme(), 'system');
});

test('persist:false does not write storage', () => {
    const { lib, window } = setup();
    lib.init();
    lib.setTheme('dark', { persist: false });
    assert.equal(window.localStorage.getItem('chill-theme'), null);
});

test('custom storageKey and defaultTheme; stored value wins', () => {
    const { lib, window, document } = setup({ stored: 'light', key: 'app-theme', dark: true });
    lib.init({ storageKey: 'app-theme', defaultTheme: 'dark' });
    assert.equal(lib.getTheme(), 'light');
    assert.equal(root(document).getAttribute('data-theme'), 'light');
    lib.setTheme('dark');
    assert.equal(window.localStorage.getItem('app-theme'), 'dark');
    assert.equal(window.localStorage.getItem('chill-theme'), null);
    // invalid stored value falls back to defaultTheme
    window.localStorage.setItem('app-theme', 'banana');
    lib.init({ storageKey: 'app-theme', defaultTheme: 'dark' });
    assert.equal(lib.getTheme(), 'dark');
});

test('system theme follows prefers-color-scheme changes, explicit theme ignores them', () => {
    const { lib, media, document } = setup({ dark: false });
    lib.init();
    const seen = [];
    lib.subscribe(r => seen.push(r));
    media.set(true);
    assert.equal(root(document).getAttribute('data-theme'), 'dark');
    lib.setTheme('light');
    media.set(false); media.set(true);
    assert.equal(root(document).getAttribute('data-theme'), 'light');
    assert.equal(seen.join(), 'dark,light');
});

test('legacy Safari: falls back to addListener/removeListener', () => {
    const ctx = load('chilltheme');
    const { window, lib, document } = ctx;
    const handlers = new Set();
    window.matchMedia = () => ({ matches: false, addListener: h => handlers.add(h), removeListener: h => handlers.delete(h) });
    lib.init();
    assert.equal(handlers.size, 1);
    handlers.forEach(h => h({ matches: true }));
    lib.destroy();
    assert.equal(handlers.size, 0);
    assert.ok(root(document).getAttribute('data-theme'));
});

test('missing matchMedia and blocked localStorage do not throw', () => {
    const ctx = setup({ noMatchMedia: true });
    const { window, lib, document } = ctx;
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError'); } });
    assert.doesNotThrow(() => lib.init());
    assert.equal(lib.getResolvedTheme(), 'light');
    assert.equal(lib.setTheme('dark'), true);
    assert.equal(root(document).getAttribute('data-theme'), 'dark');
    assert.doesNotThrow(() => lib.toggle());
    assert.equal(root(document).getAttribute('data-theme'), 'light');
});

test('matchMedia that throws is tolerated', () => {
    const { window, lib } = load('chilltheme');
    window.matchMedia = () => { throw new Error('nope'); };
    assert.doesNotThrow(() => lib.init());
    assert.equal(lib.getResolvedTheme(), 'light');
});

test('toggle / cycle / isDark', () => {
    const { lib } = setup();
    lib.init();
    assert.equal(lib.toggle(), 'dark'); assert.equal(lib.isDark(), true);
    assert.equal(lib.toggle(), 'light');
    lib.setTheme('light');
    assert.equal(lib.cycle(), 'dark'); assert.equal(lib.cycle(), 'system'); assert.equal(lib.cycle(), 'light');
});

test('onChange option, unsubscribe, throwing listener does not break others', () => {
    const { lib } = setup();
    const a = [];
    lib.init({ onChange: r => a.push(r) });
    let b = 0;
    lib.subscribe(() => { throw new Error('boom'); });
    const off = lib.subscribe(() => b++);
    lib.setTheme('dark'); lib.setTheme('light');
    assert.equal(a.join(), 'light,dark,light'); // init() itself notifies once
    assert.equal(b, 2);
    off();
    lib.setTheme('dark');
    assert.equal(b, 2);
    // re-init replaces the onChange handler instead of stacking
    const c = [];
    lib.init({ onChange: r => c.push(r) });
    lib.setTheme('light');
    assert.equal(a.length, 4); // the replaced handler is not called after re-init
    assert.equal(c.length >= 1, true);
});

test('cross-tab: storage event updates theme without writing back', () => {
    const { lib, window, document } = setup();
    lib.init();
    const calls = [];
    lib.subscribe(r => calls.push(r));
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'chill-theme', newValue: 'dark', storageArea: window.localStorage }));
    assert.equal(root(document).getAttribute('data-theme'), 'dark');
    assert.equal(calls.join(), 'dark');
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'other', newValue: 'light' }));
    assert.equal(calls.length, 1);
});

test('noFlashScript produces runnable code that sets the theme before paint', () => {
    const { lib, window, document } = setup({ dark: true });
    window.localStorage.setItem('x-key', 'light');
    const code = lib.noFlashScript({ storageKey: 'x-key' });
    root(document).removeAttribute('data-theme');
    window.eval(code);
    assert.equal(root(document).getAttribute('data-theme'), 'light');
    window.localStorage.removeItem('x-key');
    window.eval(lib.noFlashScript({ storageKey: 'x-key', defaultTheme: 'system' }));
    assert.equal(root(document).getAttribute('data-theme'), 'dark'); // system -> dark via mocked matchMedia
    const tag = lib.noFlashScript({ tag: true });
    assert.ok(tag.startsWith('<script>') && tag.endsWith('</script>'));
    // key is escaped so it cannot break out of the script tag
    const evil = lib.noFlashScript({ storageKey: '</script><img src=x>', tag: true });
    assert.equal(evil.indexOf('</script>'), evil.length - 9);
});

test('noFlashScript tolerates blocked storage / missing matchMedia when executed', () => {
    const { lib, window, document } = setup();
    const code = lib.noFlashScript();
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('x'); } });
    window.matchMedia = undefined;
    assert.doesNotThrow(() => window.eval(code));
    assert.equal(root(document).getAttribute('data-theme'), 'light');
});
