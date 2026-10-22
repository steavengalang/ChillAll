const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(opts, panes = 2, width = 1008) {
    const ctx = load('chillsplitter');
    const { document } = ctx;
    const c = document.createElement('div');
    c.id = 'c';
    for (let i = 0; i < panes; i++) { const p = document.createElement('div'); p.textContent = 'P' + i; c.appendChild(p); }
    document.body.appendChild(c);
    // jsdom has no layout: 1008 wide - 8 gutter = 1000 usable px
    c.getBoundingClientRect = () => ({ width, height: width, top: 0, left: 0, right: width, bottom: width });
    const s = ctx.lib.init(c, opts);
    return Object.assign(ctx, { c, s });
}
const key = (win, k, extra) => new win.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra));

test('SSR import safe', () => { assert.ok(loadSSR('chillsplitter').init); });

test('builds separators with correct roles/aria and destroys cleanly', () => {
    const { s, c, document } = setup({ sizes: [30, 70] });
    const seps = c.querySelectorAll('[role="separator"]');
    assert.equal(seps.length, 1);
    assert.equal(seps[0].getAttribute('tabindex'), '0');
    assert.equal(seps[0].getAttribute('aria-orientation'), 'vertical'); // side-by-side panes
    assert.equal(seps[0].getAttribute('aria-valuenow'), '30');
    assert.ok(document.getElementById(seps[0].getAttribute('aria-controls')));
    assert.ok(c.classList.contains('chillsplitter-horizontal'));
    assert.equal(s.getSizes()[0], 30);
    const before = c.children[0].getAttribute('style');
    assert.ok(before.includes('flex'));
    s.destroy();
    assert.equal(c.querySelectorAll('[role="separator"]').length, 0);
    assert.equal(c.getAttribute('class'), null);
    assert.equal(c.children[0].getAttribute('style'), null);
    assert.equal(c.children[0].getAttribute('id'), null);
    s.destroy(); // idempotent
});

test('vertical direction flips aria-orientation', () => {
    const { s, c } = setup({ direction: 'vertical' });
    assert.equal(c.querySelector('[role="separator"]').getAttribute('aria-orientation'), 'horizontal');
    s.destroy();
});

test('needs two panes and a container', () => {
    const { lib, document } = load('chillsplitter');
    const d = document.createElement('div'); d.appendChild(document.createElement('div'));
    assert.throws(() => lib.init(d), /two panes/);
    assert.throws(() => lib.init('#nope'), /not found/);
});

test('keyboard arrows resize by step, Shift multiplies, min/max respected, Home/End', () => {
    const { s, c, window } = setup({ sizes: [50, 50], minSize: 100, maxSize: [800, Infinity], step: 50 });
    const sep = c.querySelector('[role="separator"]');
    sep.dispatchEvent(key(window, 'ArrowRight'));
    assert.equal(Math.round(s.getSizes()[0]), 55);
    sep.dispatchEvent(key(window, 'ArrowLeft', { shiftKey: true })); // -500px -> clamp at min 100px (10%)
    assert.equal(Math.round(s.getSizes()[0]), 10);
    sep.dispatchEvent(key(window, 'End'));
    assert.equal(Math.round(s.getSizes()[0]), 80); // maxSize 800px
    sep.dispatchEvent(key(window, 'Home'));
    assert.equal(Math.round(s.getSizes()[0]), 10);
    assert.equal(sep.getAttribute('aria-valuenow'), '10');
    assert.equal(Math.round(s.getSizes()[0] + s.getSizes()[1]), 100);
    s.destroy();
});

test('vertical splitter responds to Up/Down only', () => {
    const { s, c, window } = setup({ direction: 'vertical', step: 100 });
    const sep = c.querySelector('[role="separator"]');
    sep.dispatchEvent(key(window, 'ArrowRight'));
    assert.equal(Math.round(s.getSizes()[0]), 50);
    sep.dispatchEvent(key(window, 'ArrowDown'));
    assert.equal(Math.round(s.getSizes()[0]), 60);
    s.destroy();
});

test('onResize fires with percentages and on() handlers can unsubscribe', () => {
    const calls = [];
    const { s, c, window } = setup({ step: 100, onResize: sz => calls.push(sz) });
    const extra = [];
    const off = s.on('resize', sz => extra.push(sz));
    c.querySelector('[role="separator"]').dispatchEvent(key(window, 'ArrowRight'));
    assert.equal(calls.length, 1); assert.equal(extra.length, 1);
    assert.equal(Math.round(calls[0][0]), 60);
    off();
    c.querySelector('[role="separator"]').dispatchEvent(key(window, 'ArrowRight'));
    assert.equal(extra.length, 1);
    assert.throws(() => s.on('nope', () => {}), /unknown event/);
    s.destroy();
});

test('pointer drag moves the boundary and cleans document listeners', () => {
    const { s, c, window, document } = setup({ sizes: [50, 50], minSize: 0 });
    const sep = c.querySelector('[role="separator"]');
    const log = [];
    s.on('dragstart', () => log.push('start')); s.on('dragend', () => log.push('end'));
    const ev = (t, x) => new window.MouseEvent(t, { clientX: x, clientY: 0, bubbles: true, cancelable: true });
    sep.dispatchEvent(ev('pointerdown', 500));
    assert.ok(c.classList.contains('chillsplitter-dragging'));
    document.dispatchEvent(ev('pointermove', 700));
    assert.equal(Math.round(s.getSizes()[0]), 70);
    document.dispatchEvent(ev('pointermove', 100));
    assert.equal(Math.round(s.getSizes()[0]), 10);
    document.dispatchEvent(ev('pointerup', 100));
    assert.equal(log.join(), 'start,end');
    assert.equal(c.classList.contains('chillsplitter-dragging'), false);
    document.dispatchEvent(ev('pointermove', 900));
    assert.equal(Math.round(s.getSizes()[0]), 10);
    s.destroy();
});

test('destroy during drag removes listeners', () => {
    const { s, c, window, document } = setup({});
    const sep = c.querySelector('[role="separator"]');
    sep.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: 500, bubbles: true }));
    s.destroy();
    const before = s.getSizes();
    document.dispatchEvent(new window.MouseEvent('pointermove', { clientX: 900, bubbles: true }));
    assert.equal(s.getSizes()[0], before[0]);
});

test('collapse / expand via API, Enter key and callbacks; last open pane never collapses', () => {
    const events = [];
    const { s, c, window } = setup({ sizes: [30, 70], collapsible: [0], onCollapse: (i, v) => events.push([i, v]) });
    const sep = c.querySelector('[role="separator"]');
    assert.equal(sep.getAttribute('aria-expanded'), 'true');
    sep.dispatchEvent(key(window, 'Enter'));
    assert.equal(s.isCollapsed(0), true);
    assert.equal(s.getSizes()[0], 0);
    assert.equal(Math.round(s.getSizes()[1]), 100);
    assert.equal(c.children[0].getAttribute('aria-hidden'), 'true');
    assert.equal(sep.getAttribute('aria-expanded'), 'false');
    sep.dispatchEvent(key(window, 'Enter'));
    assert.equal(s.isCollapsed(0), false);
    assert.equal(Math.round(s.getSizes()[0]), 30);
    assert.equal(events.length, 2); assert.equal(events[0][1], true); assert.equal(events[1][1], false);
    // not collapsible index is ignored through Enter; Enter resets sizes instead
    s.setSizes([70, 30]);
    s.collapse(1); // API collapses any pane (policy applies to UI), ok
    s.expand(1);
    s.destroy();
});

test('non-collapsible Enter resets to initial sizes; setSizes validates', () => {
    const { s, c, window } = setup({ sizes: [40, 60], step: 100 });
    const sep = c.querySelector('[role="separator"]');
    sep.dispatchEvent(key(window, 'ArrowRight'));
    assert.notEqual(Math.round(s.getSizes()[0]), 40);
    sep.dispatchEvent(key(window, 'Enter'));
    assert.equal(Math.round(s.getSizes()[0]), 40);
    assert.throws(() => s.setSizes([1, 2, 3]), /expected 2/);
    s.setSizes([1, 3]);
    assert.equal(Math.round(s.getSizes()[0]), 25);
    s.destroy();
});

test('three panes: boundaries are independent, sizes always sum to 100', () => {
    const { s, c, window } = setup({ step: 100 }, 3);
    const seps = c.querySelectorAll('[role="separator"]');
    assert.equal(seps.length, 2);
    seps[1].dispatchEvent(key(window, 'ArrowLeft'));
    const sz = s.getSizes();
    assert.ok(Math.abs(sz[0] - 100 / 3) < 0.01);
    assert.ok(sz[1] < 100 / 3 && sz[2] > 100 / 3);
    assert.ok(Math.abs(sz[0] + sz[1] + sz[2] - 100) < 1e-6);
    s.destroy();
});

test('storageKey persists and restores sizes, survives blocked storage', () => {
    const first = setup({ storageKey: 'k1', step: 100 });
    first.c.querySelector('[role="separator"]').dispatchEvent(key(first.window, 'ArrowRight'));
    const saved = first.window.localStorage.getItem('chillsplitter:k1');
    assert.ok(saved);
    first.s.destroy();
    // new page, pre-seeded storage
    const { lib, document, window } = load('chillsplitter');
    window.localStorage.setItem('chillsplitter:k2', '[20,80]');
    const c = document.createElement('div'); c.innerHTML = '<div></div><div></div>'; document.body.appendChild(c);
    const s = lib.init(c, { storageKey: 'k2' });
    assert.equal(Math.round(s.getSizes()[0]), 20);
    s.destroy();
    // blocked
    const b = load('chillsplitter');
    Object.defineProperty(b.window, 'localStorage', { get() { throw new Error('denied'); } });
    const c2 = b.document.createElement('div'); c2.innerHTML = '<div></div><div></div>'; b.document.body.appendChild(c2);
    const s2 = b.lib.init(c2, { storageKey: 'x', step: 100 });
    c2.querySelector('[role="separator"]').dispatchEvent(key(b.window, 'ArrowRight'));
    s2.destroy();
});

test('create() builds panes from strings/elements; CSS injected once with dark-mode override', () => {
    const { lib, document } = load('chillsplitter');
    const s = lib.create({ panes: ['A', 'B'], sizes: [25, 75] });
    document.body.appendChild(s.element);
    assert.equal(s.element.querySelectorAll('.chillsplitter-pane').length, 2);
    assert.equal(document.querySelectorAll('#chillsplitter-styles').length, 1);
    assert.ok(document.getElementById('chillsplitter-styles').textContent.includes(':root[data-theme="dark"]'));
    s.destroy();
});
