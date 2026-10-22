const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));
const pos = el => { const m = /translate3d\(([\d.-]+)px,([\d.-]+)px/.exec(el.style.transform); return m ? [Math.round(+m[1]), Math.round(+m[2])] : null; };

function setup(heights, opts, width = 1000) {
    const ctx = load('chillmasonry');
    const { window, document } = ctx;
    const observers = [];
    window.ResizeObserver = class {
        constructor(cb) { this.cb = cb; this.targets = new Set(); this.disconnected = false; observers.push(this); }
        observe(t) { this.targets.add(t); } unobserve(t) { this.targets.delete(t); } disconnect() { this.disconnected = true; this.targets.clear(); }
    };
    const c = document.createElement('div');
    const state = { width };
    c.getBoundingClientRect = () => ({ width: state.width, height: 0 });
    heights.forEach(h => { const d = document.createElement('div'); d.__h = h; d.getBoundingClientRect = () => ({ width: 0, height: d.__h }); c.appendChild(d); });
    document.body.appendChild(c);
    const m = ctx.lib.init(c, opts);
    return Object.assign(ctx, { c, m, observers, state });
}
const mkItem = (document, h) => { const d = document.createElement('div'); d.__h = h; d.getBoundingClientRect = () => ({ width: 0, height: h }); return d; };

test('SSR import safe', () => { assert.ok(loadSSR('chillmasonry').init); });

test('places items in the shortest column in DOM order', () => {
    const { m, c } = setup([100, 50, 80, 20, 60], { columns: 3, gap: 10 });
    const it = Array.from(c.children);
    // colW = (1000-20)/3
    assert.deepEqual(pos(it[0]), [0, 0]);          // col0
    assert.deepEqual(pos(it[1]), [337, 0]);        // col1
    assert.deepEqual(pos(it[2]), [673, 0]);        // col2
    assert.deepEqual(pos(it[3]), [337, 60]);       // col1 is shortest (50+10)
    assert.deepEqual(pos(it[4]), [337, 90]);       // columns are 110 / 90 / 90 -> leftmost shortest
    assert.equal(c.style.height, '150px');         // tallest column (160) minus trailing gap
    m.destroy();
});

test('responsive columns by container width, and auto from columnWidth', () => {
    const { m, state, c } = setup([10, 10, 10, 10], { columns: { 0: 1, 500: 2, 900: 4 }, gap: 0 }, 400);
    assert.equal(m.getColumns(), 1);
    state.width = 600; m.layout(); assert.equal(m.getColumns(), 2);
    state.width = 1000; m.layout(); assert.equal(m.getColumns(), 4);
    m.setOptions({ columns: 'auto', columnWidth: 300, gap: 0 });
    assert.equal(m.getColumns(), 3);
    m.setOptions({ maxColumns: 2 });
    assert.equal(m.getColumns(), 2);
    assert.equal(c.children[0].style.width, '500px');
    m.destroy();
});

test('append / prepend / remove relayout and keep DOM order', () => {
    const { m, c, document } = setup([100, 100], { columns: 2, gap: 0 });
    const a = mkItem(document, 30), p = mkItem(document, 70);
    m.append(a);
    assert.equal(c.lastChild, a);
    assert.deepEqual(pos(a), [0, 100]);
    m.prepend(p);
    assert.equal(c.firstChild, p);
    assert.deepEqual(pos(p), [0, 0]);
    assert.equal(m.getItems().length, 4);
    m.remove(p);
    assert.equal(p.parentNode, null);
    assert.equal(p.className, '');
    assert.equal(m.getItems().length, 3);
    m.append([mkItem(document, 5), mkItem(document, 5)]);
    assert.equal(m.getItems().length, 5);
    m.destroy();
});

test('picks up children added directly to the DOM on next layout', () => {
    const { m, c, document } = setup([10], { columns: 1, gap: 0 });
    const x = mkItem(document, 40); c.appendChild(x);
    m.layout();
    assert.deepEqual(pos(x), [0, 10]);
    m.destroy();
});

test('ResizeObserver: width change schedules relayout; unchanged width does not; onLayout fires', async () => {
    const infos = [];
    const { m, observers, state, c } = setup([10, 10], { columns: { 0: 1, 500: 2 }, gap: 0, onLayout: i => infos.push(i) }, 400);
    assert.equal(observers.length, 1);
    assert.ok(observers[0].targets.has(c));
    const n0 = infos.length;
    observers[0].cb([{ target: c, contentRect: { width: 400 } }]);
    await wait(50);
    assert.equal(infos.length, n0);
    state.width = 800;
    observers[0].cb([{ target: c, contentRect: { width: 800 } }]);
    await wait(50);
    assert.equal(infos.length, n0 + 1);
    assert.equal(infos[infos.length - 1].columns, 2);
    // item resize -> relayout, coalesced
    observers[0].cb([{ target: c.children[0] }, { target: c.children[1] }]);
    observers[0].cb([{ target: c.children[0] }]);
    await wait(50);
    assert.equal(infos.length, n0 + 2);
    m.destroy();
});

test('images relayout on load and listeners removed on destroy', async () => {
    const ctx = setup([10], { columns: 1, gap: 0 });
    const { m, c, document } = ctx;
    const holder = mkItem(document, 10);
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { value: false });
    holder.appendChild(img);
    let layouts = 0; m.setOptions({ onLayout: () => layouts++ });
    m.append(holder);
    const base = layouts;
    img.dispatchEvent(new ctx.window.Event('load'));
    await wait(50);
    assert.equal(layouts, base + 1);
    m.destroy();
    img.dispatchEvent(new ctx.window.Event('load'));
    await wait(50);
    assert.equal(layouts, base + 1);
});

test('destroy restores container and item attributes and disconnects observer', () => {
    const { m, c, observers } = setup([10, 10], { columns: 2 });
    c.children[0].setAttribute('style', 'color: red');
    m.layout(); // re-register not needed; style already captured earlier - restore returns original at register time
    m.destroy();
    assert.equal(observers[0].disconnected, true);
    assert.equal(c.getAttribute('class'), null);
    assert.equal(c.getAttribute('style'), null);
    assert.equal(c.children[0].hasAttribute('data-chillmasonry-col'), false);
    assert.equal(c.children[1].getAttribute('class'), null);
    m.destroy();
});

test('falls back to window resize without ResizeObserver and cleans up', async () => {
    const ctx = load('chillmasonry');
    const { window, document } = ctx;
    window.ResizeObserver = undefined;
    const c = document.createElement('div'); c.innerHTML = '<div></div>'; document.body.appendChild(c);
    let n = 0;
    const m = ctx.lib.init(c, { columns: 1, onLayout: () => n++ });
    const base = n;
    window.dispatchEvent(new window.Event('resize'));
    await wait(50);
    assert.equal(n, base + 1);
    m.destroy();
    window.dispatchEvent(new window.Event('resize'));
    await wait(50);
    assert.equal(n, base + 1);
});

test('itemSelector limits what is laid out; missing container throws; CSS has reduced-motion rule', () => {
    const ctx = load('chillmasonry');
    const { document, lib } = ctx;
    const c = document.createElement('div');
    c.innerHTML = '<div class="i"></div><p class="other"></p><div class="i"></div>';
    document.body.appendChild(c);
    const m = lib.init(c, { itemSelector: '.i', columns: 1 });
    assert.equal(m.getItems().length, 2);
    assert.equal(c.querySelector('.other').style.transform, '');
    assert.throws(() => lib.init('#none'), /not found/);
    assert.ok(document.getElementById('chillmasonry-styles').textContent.includes('prefers-reduced-motion'));
    m.destroy();
});
