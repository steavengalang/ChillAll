const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(options) {
    const env = load('chillinfinitescroll');
    const observers = [];
    env.window.IntersectionObserver = class {
        constructor(cb, opts) { this.cb = cb; this.opts = opts; this.targets = new Set(); this.disconnected = false; this.observeCalls = 0; observers.push(this); }
        observe(t) { this.targets.add(t); this.observeCalls++; }
        unobserve(t) { this.targets.delete(t); }
        disconnect() { this.targets.clear(); this.disconnected = true; }
        takeRecords() { return []; }
        fire() { this.cb([{ isIntersecting: true, target: [...this.targets][0] }]); }
    };
    const host = env.document.createElement('div');
    host.id = 'feed';
    env.document.body.appendChild(host);
    const inst = env.lib.init('#feed', options);
    return Object.assign(env, { host, inst, observers });
}
const tick = () => new Promise(r => setTimeout(r, 5));

test('observer triggers loadMore, aria-busy toggles, loader hidden after', async () => {
    let calls = 0, busyDuring = null;
    const { inst, host, observers } = setup({
        threshold: 123,
        onLoadMore: async () => { calls++; busyDuring = host.getAttribute('aria-busy'); }
    });
    assert.equal(observers.length, 1);
    assert.equal(observers[0].opts.rootMargin, '123px');
    observers[0].fire();
    await tick();
    assert.equal(calls, 1);
    assert.equal(busyDuring, 'true');
    assert.equal(host.getAttribute('aria-busy'), null);
    assert.equal(inst.loaderEl.style.display, 'none');
    assert.equal(inst.isLoading, false);
    // sentinel re-observed so a still-visible sentinel can trigger again
    assert.equal(observers[0].observeCalls, 2);
    inst.destroy();
});

test('loader/text are escaped and loader is a live region', () => {
    const { inst, document } = setup({ loadingText: '<img src=x onerror=1>', errorText: '<b>e</b>', onLoadMore: () => {} });
    assert.equal(document.querySelector('#feed img'), null);
    assert.equal(document.querySelector('#feed b'), null);
    assert.equal(inst.loaderEl.getAttribute('role'), 'status');
    assert.equal(inst.errorEl.getAttribute('role'), 'alert');
    inst.destroy();
});

test('error state, onError, retry button, then success', async () => {
    let n = 0; const errs = [];
    const { inst, host, observers } = setup({
        onLoadMore: async () => { n++; if (n === 1) throw new Error('boom'); },
        onError: e => errs.push(e.message)
    });
    observers[0].fire();
    await tick();
    assert.equal(inst.hasError, true);
    assert.deepEqual(errs, ['boom']);
    assert.equal(inst.errorEl.style.display, 'flex');
    assert.equal(host.getAttribute('aria-busy'), null);
    // observer must not auto-load while in error
    observers[0].fire();
    await tick();
    assert.equal(n, 1);
    inst.retryBtn.click();
    await tick();
    assert.equal(n, 2);
    assert.equal(inst.hasError, false);
    assert.equal(inst.errorEl.style.display, 'none');
    inst.destroy();
});

test('setComplete via {hasMore:false} disconnects observer and shows end text', async () => {
    let done = 0;
    const { inst, observers } = setup({ onLoadMore: async () => ({ hasMore: false }), onComplete: () => done++ });
    observers[0].fire();
    await tick();
    assert.equal(inst.hasMore, false);
    assert.equal(inst.endEl.style.display, 'block');
    assert.equal(observers[0].disconnected, true);
    assert.equal(done, 1);
    inst.destroy();
});

test('reset does not leak observers', async () => {
    const { inst, observers } = setup({ onLoadMore: async () => false });
    observers[0].fire();
    await tick();
    inst.reset();
    inst.reset();
    const live = observers.filter(o => !o.disconnected);
    assert.equal(live.length, 1);
    assert.equal(inst.hasMore, true);
    inst.destroy();
    assert.equal(observers.filter(o => !o.disconnected).length, 0);
});

test('destroy during load: removes DOM, no late state changes, no error', async () => {
    let release;
    const { inst, host, document, observers } = setup({ onLoadMore: () => new Promise(r => { release = r; }) });
    observers[0].fire();
    await tick();
    assert.equal(host.getAttribute('aria-busy'), 'true');
    inst.destroy();
    assert.equal(host.getAttribute('aria-busy'), null);
    assert.equal(document.querySelector('.chillinfinitescroll-loader'), null);
    release({ hasMore: false });
    await tick();
    assert.equal(inst.hasMore, true);
    assert.equal(document.querySelector('.chillinfinitescroll-end'), null);
});

test('infinitescroll with missing host does not throw; css dark override', () => {
    const { lib, document } = load('chillinfinitescroll');
    const inst = lib.init('#nope', {});
    inst.destroy();
    const host = document.createElement('div'); document.body.appendChild(host);
    const i2 = lib.init(host, {});
    const css = document.getElementById('chillinfinitescroll-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    i2.destroy();
});
