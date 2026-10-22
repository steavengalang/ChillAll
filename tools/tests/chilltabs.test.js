const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const TABS = () => [
    { id: 'a', label: 'Alpha', content: 'Panel A' },
    { id: 'b', label: 'Beta', content: 'Panel B', badge: 3 },
    { id: 'c', label: 'Gamma', content: 'Panel C', disabled: true },
    { id: 'd', label: 'Delta', content: 'Panel D' }
];
function setup(opts, html) {
    const ctx = load('chilltabs');
    ctx.document.body.innerHTML = html || '<section><div id="t"></div></section>';
    ctx.tabs = ctx.lib.init('#t', Object.assign({ tabs: TABS() }, opts));
    ctx.container = ctx.tabs.container;
    return ctx;
}
const key = (win, el, k, init) => { const e = new win.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, init)); el.dispatchEvent(e); return e; };
const trig = (c, id) => c.container.querySelector(`.chilltabs-trigger[data-tab="${id}"]`);
const panelOf = (c, id) => document_get(c, trig(c, id).getAttribute('aria-controls'));
const document_get = (c, id) => c.document.getElementById(id);

test('SSR import safe', () => { assert.ok(loadSSR('chilltabs').init); });

test('renders tablist / tab / tabpanel semantics with linked ids', () => {
    const c = setup();
    const list = c.container.querySelector('[role="tablist"]');
    assert.equal(list.getAttribute('aria-orientation'), 'horizontal');
    const tabs = c.container.querySelectorAll('[role="tab"]');
    assert.equal(tabs.length, 4);
    assert.equal(c.container.querySelectorAll('[role="tabpanel"]').length, 4);
    const a = trig(c, 'a');
    assert.equal(a.getAttribute('aria-selected'), 'true');
    assert.equal(trig(c, 'b').getAttribute('aria-selected'), 'false');
    const panel = panelOf(c, 'a');
    assert.equal(panel.getAttribute('aria-labelledby'), a.id);
    assert.equal(panel.hidden, false);
    assert.equal(panelOf(c, 'b').hidden, true);
    assert.equal(trig(c, 'c').disabled, true);
    assert.equal(trig(c, 'b').querySelector('.chilltabs-trigger-badge').textContent, '3');
    c.tabs.destroy();
});

test('roving tabindex: only the active tab is tabbable', () => {
    const c = setup();
    assert.equal(trig(c, 'a').getAttribute('tabindex'), '0');
    ['b', 'c', 'd'].forEach(id => assert.equal(trig(c, id).getAttribute('tabindex'), '-1'));
    c.tabs.setActiveTab('d');
    assert.equal(trig(c, 'd').getAttribute('tabindex'), '0');
    assert.equal(trig(c, 'a').getAttribute('tabindex'), '-1');
    c.tabs.destroy();
});

test('click activates tab, onChange / on("change") fire once, disabled and unknown ids ignored', () => {
    const seen = [], seen2 = [];
    const c = setup({ onChange: id => seen.push(id) });
    const off = c.tabs.on('change', id => seen2.push(id));
    trig(c, 'b').click();
    assert.equal(c.tabs.getActiveTab(), 'b');
    assert.equal(panelOf(c, 'b').hidden, false); assert.equal(panelOf(c, 'a').hidden, true);
    assert.equal(trig(c, 'b').getAttribute('aria-selected'), 'true');
    trig(c, 'b').click();            // already active
    trig(c, 'c').click();            // disabled
    c.tabs.setActiveTab('zzz');
    assert.equal(seen.join(), 'b'); assert.equal(seen2.join(), 'b');
    off();
    c.tabs.setActiveTab('d');
    assert.equal(seen2.length, 1);
    c.tabs.destroy();
});

test('arrow keys move focus + activate (skipping disabled, wrapping); Home/End', () => {
    const c = setup();
    trig(c, 'a').focus();
    key(c.window, trig(c, 'a'), 'ArrowRight');
    assert.equal(c.tabs.getActiveTab(), 'b');
    assert.equal(c.document.activeElement, trig(c, 'b'));
    key(c.window, trig(c, 'b'), 'ArrowRight');              // c is disabled -> d
    assert.equal(c.tabs.getActiveTab(), 'd');
    key(c.window, trig(c, 'd'), 'ArrowRight');              // wraps
    assert.equal(c.tabs.getActiveTab(), 'a');
    key(c.window, trig(c, 'a'), 'ArrowLeft');               // wraps back
    assert.equal(c.tabs.getActiveTab(), 'd');
    key(c.window, trig(c, 'd'), 'Home'); assert.equal(c.tabs.getActiveTab(), 'a');
    key(c.window, trig(c, 'a'), 'End'); assert.equal(c.tabs.getActiveTab(), 'd');
    const ev = key(c.window, trig(c, 'd'), 'x');
    assert.equal(ev.defaultPrevented, false);
    c.tabs.destroy();
});

test('vertical tabs use Up/Down and expose aria-orientation=vertical', () => {
    const c = setup({ vertical: true });
    assert.equal(c.container.querySelector('[role="tablist"]').getAttribute('aria-orientation'), 'vertical');
    key(c.window, trig(c, 'a'), 'ArrowRight');
    assert.equal(c.tabs.getActiveTab(), 'a');
    key(c.window, trig(c, 'a'), 'ArrowDown');
    assert.equal(c.tabs.getActiveTab(), 'b');
    c.tabs.destroy();
});

test('manual activation: arrows only move focus (roving tabindex), Enter/click activates', () => {
    const c = setup({ activation: 'manual' });
    key(c.window, trig(c, 'a'), 'ArrowRight');
    assert.equal(c.tabs.getActiveTab(), 'a');
    assert.equal(c.document.activeElement, trig(c, 'b'));
    assert.equal(trig(c, 'b').getAttribute('tabindex'), '0');
    assert.equal(trig(c, 'a').getAttribute('tabindex'), '-1');
    trig(c, 'b').click();
    assert.equal(c.tabs.getActiveTab(), 'b');
    c.tabs.destroy();
});

test('XSS: label, badge, content, icon and ids are text/attribute safe by default', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const c = setup({ tabs: [{ id: 'x"><img src=x>', label: evil, badge: evil, icon: evil, content: evil }] });
    assert.equal(c.container.querySelector('img'), null);
    assert.ok(c.container.querySelector('.chilltabs-panel').textContent.includes('<img'));
    assert.equal(c.container.querySelector('.chilltabs-trigger').getAttribute('data-tab'), 'x"><img src=x>');
    c.tabs.destroy();
});

test('html:true (global or per tab) opts into HTML; Nodes are always accepted', () => {
    const ctx = load('chilltabs');
    ctx.document.body.innerHTML = '<div id="t"></div><div id="t2"></div>';
    const node = ctx.document.createElement('em'); node.id = 'nodeContent';
    const t = ctx.lib.init('#t', { tabs: [{ id: 'a', label: 'A', content: '<b id="bold">x</b>', html: true }, { id: 'b', label: 'B', content: node }, { id: 'c', label: 'C', content: '<i id="nope">x</i>' }] });
    assert.ok(ctx.document.querySelector('#bold'));
    assert.ok(ctx.document.querySelector('#nodeContent'));
    assert.equal(ctx.document.querySelector('#nope'), null);
    t.setTabContent('c', '<u id="u1">x</u>');
    assert.equal(ctx.document.querySelector('#u1'), null);
    t.setTabContent('c', '<u id="u2">x</u>', { html: true });
    assert.ok(ctx.document.querySelector('#u2'));
    t.destroy();
    const g = ctx.lib.init('#t2', { html: true, tabs: [{ id: 'a', label: 'A', content: '<b id="gbold">x</b>' }] });
    assert.ok(ctx.document.querySelector('#gbold'));
    g.destroy();
});

test('addTab / removeTab keep DOM, state and listeners working (regression: addTab used to throw)', () => {
    const c = setup();
    c.tabs.addTab({ id: 'e', label: 'Eps', content: 'Panel E' });
    assert.equal(c.container.querySelectorAll('[role="tab"]').length, 5);
    trig(c, 'e').click();
    assert.equal(c.tabs.getActiveTab(), 'e');
    c.tabs.addTab({ id: 'first', label: 'First' }, 0);
    assert.equal(c.container.querySelector('[role="tab"]').getAttribute('data-tab'), 'first');
    c.tabs.addTab({ id: 'e', label: 'dup' });   // duplicates ignored
    assert.equal(c.container.querySelectorAll('[role="tab"]').length, 6);
    c.tabs.removeTab('e');                      // active tab removed -> first enabled becomes active
    assert.equal(c.container.querySelectorAll('[role="tab"]').length, 5);
    assert.equal(c.tabs.getActiveTab(), 'first');
    assert.equal(c.container.querySelectorAll('.chilltabs-panel.active').length, 1);
    c.tabs.removeTab('nope');
    c.tabs.destroy();
});

test('setDisabled moves selection away from a newly disabled active tab; next/prev', () => {
    const c = setup();
    c.tabs.setDisabled('a', true);
    assert.equal(c.tabs.getActiveTab(), 'b');
    assert.equal(trig(c, 'a').disabled, true);
    c.tabs.next(); assert.equal(c.tabs.getActiveTab(), 'd');
    c.tabs.next(); assert.equal(c.tabs.getActiveTab(), 'b');
    c.tabs.prev(); assert.equal(c.tabs.getActiveTab(), 'd');
    c.tabs.destroy();
});

test('unique ids across several instances on one page; defaultTab and variants/sizes classes', () => {
    const ctx = load('chilltabs');
    ctx.document.body.innerHTML = '<div id="x"></div><div id="y"></div>';
    const a = ctx.lib.init('#x', { tabs: TABS(), defaultTab: 'd', variant: 'pills', size: 'lg', centered: true, fullWidth: true });
    const b = ctx.lib.init('#y', { tabs: TABS() });
    const ids = Array.from(ctx.document.querySelectorAll('[id]')).map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(a.getActiveTab(), 'd');
    ['chilltabs-pills', 'chilltabs-lg', 'chilltabs-centered', 'chilltabs-fullwidth'].forEach(cl => assert.ok(a.container.classList.contains(cl), cl));
    a.destroy(); b.destroy();
});

test('destroy restores the original element and removes handlers; safe twice', () => {
    const c = setup();
    const container = c.container;
    assert.equal(c.document.getElementById('t'), null);
    c.tabs.destroy(); c.tabs.destroy();
    assert.ok(c.document.getElementById('t'));
    assert.equal(c.document.querySelector('.chilltabs'), null);
    // detached container no longer reacts
    let n = 0; const t2 = c.lib.init('#t', { tabs: TABS(), onChange: () => n++ });
    t2.destroy();
    container.querySelector('[data-tab="b"]').click();
    assert.equal(n, 0);
});

test('works with no tabs and with a missing element', () => {
    const ctx = load('chilltabs');
    ctx.document.body.innerHTML = '<div id="t"></div>';
    const empty = ctx.lib.init('#t', {});
    assert.equal(empty.getActiveTab(), null);
    empty.addTab({ id: 'only', label: 'Only' });
    assert.equal(empty.getActiveTab(), 'only');
    empty.destroy();
    const orphan = ctx.lib.init('#missing', { tabs: TABS() });
    assert.ok(orphan.container);
    orphan.destroy();
});

test('CSS: dark overrides, focus-visible, reduced-motion, mobile rules', () => {
    const c = setup();
    const css = c.document.getElementById('chilltabs-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('max-width: 640px'));
    c.tabs.destroy();
});
