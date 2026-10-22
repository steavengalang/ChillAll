const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));

function setup(opts, html) {
    const ctx = load('chillscrollspy');
    const { window, document } = ctx;
    const ios = [];
    window.IntersectionObserver = class {
        constructor(cb, o) { this.cb = cb; this.o = o; this.targets = new Set(); this.disconnected = false; ios.push(this); }
        observe(t) { this.targets.add(t); } unobserve(t) { this.targets.delete(t); } disconnect() { this.disconnected = true; this.targets.clear(); }
        takeRecords() { return []; }
    };
    window.innerHeight = 800;
    document.body.innerHTML = html || `
      <div id="toc"></div>
      <article id="a">
        <h2>Getting Started</h2><p>x</p>
        <h3>Install now</h3><p>x</p>
        <h2>Getting Started</h2><p>dup</p>
        <h2 id="custom">Custom id</h2><p>x</p>
        <h2><img src=x onerror="window.__xss=1">Tricky &lt;b&gt;</h2>
      </article>`;
    const hs = Array.from(document.querySelectorAll('h2, h3'));
    hs.forEach((h, i) => { h.__top = 1000 + i * 500; h.getBoundingClientRect = () => ({ top: h.__top, height: 20 }); });
    const spy = ctx.lib.init(Object.assign({ content: '#a', container: '#toc' }, opts));
    return Object.assign(ctx, { spy, hs, ios });
}
const tops = (hs, arr) => hs.forEach((h, i) => { h.__top = arr[i]; });
const activeId = doc => { const a = doc.querySelector('.chillscrollspy-active'); return a && decodeURIComponent(a.getAttribute('href').slice(1)); };

test('SSR import safe', () => { assert.ok(loadSSR('chillscrollspy').init); });

test('builds nav from headings with ids, levels, aria and safe text', () => {
    const { spy, document, hs } = setup();
    const nav = document.querySelector('#toc nav.chillscrollspy');
    assert.equal(nav.getAttribute('aria-label'), 'Table of contents');
    const links = nav.querySelectorAll('a');
    assert.equal(links.length, 5);
    assert.equal(hs[0].id, 'getting-started');
    assert.equal(hs[2].id, 'getting-started-2');
    assert.equal(hs[3].id, 'custom');
    assert.equal(links[1].parentNode.className.includes('chillscrollspy-level-3'), true);
    assert.equal(links[0].getAttribute('href'), '#getting-started');
    assert.equal(document.querySelector('#toc img'), null); // no HTML injection from heading text
    spy.destroy();
    assert.equal(document.querySelector('nav.chillscrollspy'), null);
    assert.equal(hs[0].hasAttribute('id'), false);   // generated ids removed
    assert.equal(hs[3].id, 'custom');                // author ids kept
});

test('active link follows scroll position (IntersectionObserver trigger) with aria-current and onChange', async () => {
    const seen = [];
    const { spy, document, hs, ios, window } = setup({ offset: 80, onChange: id => seen.push(id) });
    assert.equal(ios.length, 1);
    assert.equal(ios[0].targets.size, 5);
    assert.ok(/^-80px 0px -719px 0px$/.test(ios[0].o.rootMargin));
    assert.equal(spy.getActive(), 'getting-started'); // activateFirst
    tops(hs, [-600, -100, 300, 600, 900]);              // first two passed the line (<= 82px)
    ios[0].cb([]);
    await wait(40);
    assert.equal(spy.getActive(), 'install-now');
    assert.equal(activeId(document), 'install-now');
    assert.equal(document.querySelector('[aria-current="location"]').getAttribute('href'), '#install-now');
    assert.equal(document.querySelectorAll('[aria-current]').length, 1);
    tops(hs, [-1600, -1100, -700, 50, 400]);
    window.dispatchEvent(new window.Event('scroll'));   // scroll listener also works
    await wait(40);
    assert.equal(spy.getActive(), 'custom');
    assert.equal(seen.join(), 'install-now,custom');
    const off = spy.on('change', () => seen.push('h'));
    tops(hs, [-2000, -1500, -1100, -500, 10]);
    ios[0].cb([]); await wait(40);
    assert.equal(seen[seen.length - 1], 'h');
    off();
    spy.destroy();
});

test('activateFirst:false leaves nothing active before the first heading', () => {
    const { spy, document } = setup({ activateFirst: false });
    assert.equal(spy.getActive(), null);
    assert.equal(document.querySelectorAll('.chillscrollspy-active').length, 0);
    spy.destroy();
});

test('click scrolls (offset aware), focuses heading, sets hash and active', () => {
    const { spy, document, hs, window } = setup({ offset: 100 });
    const calls = [];
    window.scrollTo = o => calls.push(o);
    window.pageYOffset = 200;
    hs[3].__top = 1500;
    const link = document.querySelector('a[href="#custom"]');
    const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].top, 200 + 1500 - 100);
    assert.equal(calls[0].behavior, 'smooth');
    assert.equal(window.location.hash, '#custom');
    assert.equal(hs[3].getAttribute('tabindex'), '-1');
    assert.equal(spy.getActive(), 'custom');
    // modified clicks are left to the browser
    const ev2 = new window.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    link.dispatchEvent(ev2);
    assert.equal(ev2.defaultPrevented, false);
    assert.equal(calls.length, 1);
    spy.destroy();
    assert.equal(hs[3].hasAttribute('tabindex'), false);
});

test('reduced motion uses instant scroll; smooth:false and updateHash:false respected', () => {
    const { spy, window } = setup({ updateHash: false, smooth: false });
    const calls = [];
    window.scrollTo = o => calls.push(o);
    window.location.hash = '';
    spy.scrollTo('custom');
    assert.equal(calls[0].behavior, 'auto');
    assert.equal(window.location.hash, '');
    spy.destroy();
    const r = setup({});
    r.window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    const c2 = []; r.window.scrollTo = o => c2.push(o);
    r.spy.scrollTo('custom');
    assert.equal(c2[0].behavior, 'auto');
    r.spy.destroy();
});

test('existing links mode: no DOM built, active class toggled, cleaned on destroy', async () => {
    const html = '<nav id="m"><a href="#s1">One</a><a href="#s2">Two</a><a href="#nope">Missing</a><a href="/x">Ext</a></nav><h2 id="s1">One</h2><h2 id="s2">Two</h2>';
    const { spy, document, ios } = setup({ links: '#m a', content: null, container: null }, html);
    assert.equal(spy.element, null);
    assert.equal(document.querySelectorAll('#m a.chillscrollspy-active').length, 1);
    const hs = document.querySelectorAll('h2');
    hs[0].getBoundingClientRect = () => ({ top: -500 }); hs[1].getBoundingClientRect = () => ({ top: 0 });
    ios[0].cb([]); await wait(40);
    assert.equal(spy.getActive(), 's2');
    spy.destroy();
    assert.equal(document.querySelectorAll('.chillscrollspy-active').length, 0);
    assert.equal(document.querySelectorAll('[aria-current]').length, 0);
    assert.equal(document.querySelectorAll('#m a').length, 4);
});

test('refresh picks up new headings; destroy disconnects observer and removes listeners', async () => {
    const { spy, document, ios, window, hs } = setup();
    const h = document.createElement('h2'); h.textContent = 'Late addition'; document.getElementById('a').appendChild(h);
    h.getBoundingClientRect = () => ({ top: 9999 });
    spy.refresh();
    assert.equal(document.querySelectorAll('#toc a').length, 6);
    assert.equal(ios[ios.length - 1].targets.size, 6);
    assert.equal(ios[0].disconnected, true);
    let changes = 0; spy.on('change', () => changes++);
    spy.destroy();
    assert.equal(ios[ios.length - 1].disconnected, true);
    tops(hs, [-1000, -1000, -1000, -1000, -1000]);
    window.dispatchEvent(new window.Event('scroll'));
    await wait(40);
    assert.equal(changes, 0);
    spy.destroy();
});

test('works without IntersectionObserver (scroll fallback) and with a custom scrollContainer', async () => {
    const ctx = load('chillscrollspy');
    const { window, document } = ctx;
    window.IntersectionObserver = undefined;
    document.body.innerHTML = '<div id="sc"><h2 id="a1">A</h2><h2 id="b1">B</h2></div>';
    const sc = document.getElementById('sc');
    sc.getBoundingClientRect = () => ({ top: 100 });
    const [a, b] = sc.querySelectorAll('h2');
    a.getBoundingClientRect = () => ({ top: 20 }); b.getBoundingClientRect = () => ({ top: 500 });
    const spy = ctx.lib.init({ content: sc, scrollContainer: sc, container: sc, offset: 10 });
    assert.equal(spy.getActive(), 'a1');
    b.getBoundingClientRect = () => ({ top: 105 }); // <= rootTop(100)+offset(10)+2
    sc.dispatchEvent(new window.Event('scroll'));
    await wait(40);
    assert.equal(spy.getActive(), 'b1');
    spy.destroy();
});
