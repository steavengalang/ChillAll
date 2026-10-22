const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(html) {
    const ctx = load('chillclickoutside');
    if (!ctx.window.PointerEvent) ctx.window.PointerEvent = ctx.window.MouseEvent; // jsdom has no PointerEvent
    ctx.document.body.innerHTML = html || '<div id="menu"><button id="inner">in</button></div><button id="toggle">t</button><p id="out">out</p>';
    return ctx;
}
const fire = (win, el, type) => el.dispatchEvent(new win.MouseEvent(type || 'pointerdown', { bubbles: true, cancelable: true }));
const $ = (d, id) => d.getElementById(id);

test('SSR import safe; register is a harmless no-op on the server', () => {
    const lib = loadSSR('chillclickoutside');
    const off = lib.register({}, () => {});
    assert.equal(typeof off, 'function');
    off();
});

test('fires only for outside pointerdown, once per event; inside clicks ignored', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register($(document, 'menu'), () => n++);
    fire(window, $(document, 'inner'));
    fire(window, $(document, 'menu'));
    assert.equal(n, 0);
    fire(window, $(document, 'out'));
    assert.equal(n, 1);
    lib.unregisterAll();
});

test('touch devices do not fire twice (single default event, no touchstart+click pair)', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register($(document, 'menu'), () => n++);
    fire(window, $(document, 'out'), 'touchstart');
    fire(window, $(document, 'out'), 'click');
    assert.equal(n, 0);       // neither of the legacy events is used any more
    fire(window, $(document, 'out'), 'pointerdown');
    assert.equal(n, 1);
    lib.unregisterAll();
});

test('custom events option (click) and fallback events without PointerEvent', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register($(document, 'menu'), () => n++, { events: ['click'] });
    fire(window, $(document, 'out'), 'pointerdown'); assert.equal(n, 0);
    fire(window, $(document, 'out'), 'click'); assert.equal(n, 1);
    lib.unregisterAll();
    const c = load('chillclickoutside');
    delete c.window.PointerEvent;
    c.document.body.innerHTML = '<div id="m"></div><p id="o"></p>';
    let k = 0;
    c.lib.register(c.document.getElementById('m'), () => k++);
    c.document.getElementById('o').dispatchEvent(new c.window.MouseEvent('mousedown', { bubbles: true }));
    assert.equal(k, 1);
    c.lib.unregisterAll();
});

test('ignore (element or selector), multiple elements, selector strings resolved lazily', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register(['#menu', '#toggle'], () => n++);
    fire(window, $(document, 'toggle'));
    assert.equal(n, 0);
    lib.unregisterAll();
    lib.register($(document, 'menu'), () => n++, { ignore: ['#toggle', $(document, 'out')] });
    fire(window, $(document, 'toggle')); fire(window, $(document, 'out'));
    assert.equal(n, 0);
    // a re-rendered #menu (new node) is still recognised because selectors are resolved per event
    lib.unregisterAll();
    lib.register('#menu', () => n++);
    const fresh = document.createElement('div'); fresh.id = 'menu'; fresh.innerHTML = '<span id="deep"></span>';
    $(document, 'menu').replaceWith(fresh);
    fire(window, $(document, 'deep'));
    assert.equal(n, 0);
    lib.unregisterAll();
});

test('target removed from the DOM by the event itself is not treated as outside', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register($(document, 'menu'), () => n++);
    const btn = $(document, 'inner');
    // an earlier capture handler removes the clicked node, like a self-closing list item
    document.addEventListener('pointerdown', () => btn.remove(), true);
    // listeners registered before ours run first in capture, so register ours after to make the removal happen first
    lib.unregisterAll();
    lib.register($(document, 'menu'), () => n++);
    fire(window, btn);
    assert.equal(n, 0);
    lib.unregisterAll();
});

test('once, enabled/setEnabled, escape option, unregister by id', () => {
    const { lib, window, document } = setup();
    let once = 0, esc = [];
    lib.register($(document, 'menu'), () => once++, { once: true });
    fire(window, $(document, 'out')); fire(window, $(document, 'out'));
    assert.equal(once, 1);
    assert.equal(lib.count(), 0);

    let n = 0;
    const off = lib.register($(document, 'menu'), () => n++, { enabled: false });
    fire(window, $(document, 'out')); assert.equal(n, 0);
    off.setEnabled(true); fire(window, $(document, 'out')); assert.equal(n, 1);

    lib.register($(document, 'menu'), e => esc.push(e.type), { escape: true });
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    assert.equal(esc.join(), 'keydown');
    lib.unregister(off.id);
    fire(window, $(document, 'out'));
    assert.equal(n, 1);
    lib.unregisterAll();
});

test('callback errors do not break other registrations; validation', () => {
    const { lib, window, document } = setup();
    const w = console.error; console.error = () => {};
    let ok = 0;
    try {
        lib.register($(document, 'menu'), () => { throw new Error('x'); });
        lib.register($(document, 'menu'), () => ok++);
        fire(window, $(document, 'out'));
    } finally { console.error = w; }
    assert.equal(ok, 1);
    assert.throws(() => lib.register($(document, 'menu')), { name: 'TypeError' });
    lib.unregisterAll();
});

test('document listeners attached lazily and fully removed with the last registration', () => {
    const { lib, document } = setup();
    const added = {}, removed = {};
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { added[t] = (added[t] || 0) + 1; return a(t, f, o); };
    document.removeEventListener = (t, f, o) => { removed[t] = (removed[t] || 0) + 1; return r(t, f, o); };
    assert.equal(Object.keys(added).length, 0);
    const o1 = lib.register($(document, 'menu'), () => {}, { escape: true });
    const o2 = lib.register($(document, 'menu'), () => {});
    assert.equal(added.pointerdown, 1); assert.equal(added.keydown, 1);
    o1();
    assert.equal(removed.keydown, 1);
    assert.equal(removed.pointerdown, undefined);
    o2();
    assert.equal(removed.pointerdown, 1);
    assert.equal(lib.count(), 0);
});

test('shadow DOM: composedPath containing the element counts as inside', () => {
    const { lib, window, document } = setup();
    let n = 0;
    const menu = $(document, 'menu');
    lib.register(menu, () => n++);
    const out = $(document, 'out');
    const e = new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'composedPath', { value: () => [out, menu, document.body, document] });
    out.dispatchEvent(e);
    assert.equal(n, 0);
    lib.unregisterAll();
});
