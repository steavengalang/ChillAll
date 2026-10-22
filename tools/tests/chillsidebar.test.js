const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const ITEMS = () => [
    { type: 'section', label: 'Main', items: [
        { id: 'home', label: 'Home', href: '/', icon: 'H' },
        { id: 'reports', label: 'Reports', icon: 'R', children: [{ id: 'daily', label: 'Daily', href: '/daily' }, { id: 'weekly', label: 'Weekly', href: '/weekly' }] },
        { id: 'inbox', label: 'Inbox', href: '/inbox', badge: 4 }
    ] }
];
function setup(opts) {
    const ctx = load('chillsidebar');
    ctx.document.body.innerHTML = '<button id="menu">menu</button><div id="sb"></div><main id="main"></main>';
    ctx.sb = ctx.lib.init('#sb', Object.assign({ brand: { name: 'Acme' }, items: ITEMS(), activeItem: 'home' }, opts));
    return ctx;
}
const key = (win, el, k, init) => { const e = new win.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, init)); el.dispatchEvent(e); return e; };
const click = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
const item = (c, id) => c.document.querySelector(`[data-id="${id}"]`);

test('SSR import safe', () => { assert.ok(loadSSR('chillsidebar').init); });

test('renders aside + labelled nav, sections, active item with aria-current, badge', () => {
    const c = setup();
    assert.ok(c.document.querySelector('aside.chillsidebar nav[aria-label="Sidebar"]'));
    assert.equal(c.document.querySelectorAll('.chillsidebar-section-title').length, 1);
    assert.equal(item(c, 'home').getAttribute('aria-current'), 'page');
    assert.ok(item(c, 'home').classList.contains('active'));
    assert.equal(item(c, 'inbox').querySelector('.chillsidebar-item-badge').textContent, '4');
    assert.equal(c.document.getElementById('sb'), null);
    c.sb.destroy();
});

test('XSS: labels, brand, badge, hrefs, footer and icons are inert by default', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const c = setup({
        brand: { name: evil, logo: 'javascript:alert(1)', href: 'javascript:alert(1)' },
        items: [{ id: evil, label: evil, href: 'javascript:alert(1)', icon: evil, badge: evil }, { id: 'g', label: evil, children: [{ id: 'x', label: evil, href: 'data:text/html,x' }] }],
        footer: evil
    });
    assert.equal(c.document.querySelector('.chillsidebar img[src="x"]'), null);
    c.document.querySelectorAll('.chillsidebar a').forEach(a => assert.ok(!/^(javascript|data):/i.test(a.getAttribute('href'))));
    assert.equal(c.document.querySelector('.chillsidebar-footer').textContent, evil);
    assert.equal(c.document.querySelector('.chillsidebar-footer img'), null);
    c.sb.destroy();
});

test('footer: Node accepted, footerHtml and html:true are explicit HTML opt-ins; Element icons accepted', () => {
    const ctx = load('chillsidebar');
    ctx.document.body.innerHTML = '<div id="a"></div><div id="b"></div><div id="c"></div>';
    const node = ctx.document.createElement('em'); node.id = 'f';
    const icon = ctx.document.createElement('i'); icon.className = 'my';
    const a = ctx.lib.init('#a', { items: [{ id: 'x', label: 'x', icon }], footer: node });
    assert.ok(ctx.document.querySelector('.chillsidebar-footer #f'));
    assert.ok(ctx.document.querySelector('.chillsidebar-item-icon .my'));
    a.destroy();
    const b = ctx.lib.init('#b', { footerHtml: '<b id="fh">x</b>' });
    assert.ok(ctx.document.querySelector('#fh'));
    b.destroy();
    const c = ctx.lib.init('#c', { html: true, footer: '<b id="fh2">x</b>', items: [{ id: 'q', label: 'q', icon: '<svg id="svgi"></svg>' }] });
    assert.ok(ctx.document.querySelector('#fh2')); assert.ok(ctx.document.querySelector('#svgi'));
    c.destroy();
});

test('collapse / expand / toggle: classes, aria-expanded, labels, callbacks (also for API calls), on()', () => {
    const calls = [], ev = [];
    const c = setup({ onCollapse: v => calls.push(v) });
    c.sb.on('collapse', v => ev.push(v));
    const btn = c.sb.toggleBtn;
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    click(c.window, btn);
    assert.equal(c.sb.isCollapsed, true);
    assert.ok(c.sb.sidebar.classList.contains('collapsed'));
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(btn.getAttribute('aria-label'), 'Expand sidebar');
    c.sb.expand(); c.sb.collapse(); c.sb.collapse();
    assert.equal(calls.join(), 'true,false,true'); assert.equal(ev.join(), 'true,false,true');
    c.sb.destroy();
});

test('collapsed items keep an accessible name (label visually hidden, not display:none) and a title', () => {
    const c = setup();
    const label = item(c, 'home').querySelector('.chillsidebar-item-label');
    assert.equal(label.textContent, 'Home');
    assert.equal(item(c, 'home').getAttribute('title'), 'Home');
    const css = c.document.getElementById('chillsidebar-styles').textContent;
    assert.ok(/collapsed \.chillsidebar-item-label\s*\{[^}]*clip: rect/.test(css));
    assert.ok(!/collapsed \.chillsidebar-item span\s*\{\s*display: none/.test(css)); // old bug hid icons too
    c.sb.destroy();
});

test('persists collapsed state with storageKey (and tolerates blocked storage)', () => {
    const c = setup({ storageKey: 'sb-state' });
    c.sb.collapse();
    assert.equal(c.window.localStorage.getItem('sb-state'), 'true');
    c.sb.destroy();
    const d = load('chillsidebar');
    d.window.localStorage.setItem('sb-state', 'true');
    d.document.body.innerHTML = '<div id="sb"></div>';
    const s = d.lib.init('#sb', { storageKey: 'sb-state', items: [] });
    assert.equal(s.isCollapsed, true);
    s.destroy();
    const b = load('chillsidebar');
    Object.defineProperty(b.window, 'localStorage', { get() { throw new Error('denied'); } });
    b.document.body.innerHTML = '<div id="sb"></div>';
    const s2 = b.lib.init('#sb', { storageKey: 'k', items: [] });
    assert.doesNotThrow(() => s2.collapse());
    s2.destroy();
});

test('group item: aria-expanded/controls, toggles submenu, closed submenu links are hidden from keyboard via CSS class state', () => {
    const c = setup();
    const group = item(c, 'reports');
    const sub = c.document.getElementById(group.getAttribute('aria-controls'));
    assert.equal(group.tagName, 'BUTTON');
    assert.equal(group.getAttribute('aria-expanded'), 'false');
    assert.equal(sub.classList.contains('open'), false);
    click(c.window, group);
    assert.equal(group.getAttribute('aria-expanded'), 'true');
    assert.ok(sub.classList.contains('open')); assert.ok(group.classList.contains('expanded'));
    click(c.window, group);
    assert.equal(sub.classList.contains('open'), false);
    const css = c.document.getElementById('chillsidebar-styles').textContent;
    assert.ok(/chillsidebar-submenu\s*\{[^}]*visibility: hidden/.test(css));
    c.sb.destroy();
});

test('active child expands its group initially; setActiveItem moves aria-current', () => {
    const c = setup({ activeItem: 'weekly' });
    assert.equal(item(c, 'reports').getAttribute('aria-expanded'), 'true');
    assert.equal(item(c, 'weekly').getAttribute('aria-current'), 'page');
    c.sb.setActiveItem('inbox');
    assert.equal(c.document.querySelectorAll('[aria-current="page"]').length, 1);
    assert.equal(item(c, 'inbox').getAttribute('aria-current'), 'page');
    c.sb.setActiveItem(null);
    assert.equal(c.document.querySelectorAll('.active').length, 0);
    c.sb.destroy();
});

test('onItemClick(id, event) and item.onClick via delegation; group header does not fire onItemClick', () => {
    const ids = [], own = [];
    const c = setup({ items: [{ id: 'a', label: 'A', href: '#a', onClick: () => own.push('a') }, { id: 'g', label: 'G', children: [{ id: 'g1', label: 'G1', href: '#g1' }] }], onItemClick: id => ids.push(id) });
    click(c.window, item(c, 'a'));
    click(c.window, item(c, 'g'));
    click(c.window, item(c, 'g1'));
    assert.equal(ids.join(), 'a,g1'); assert.equal(own.join(), 'a');
    c.sb.destroy();
});

test('keyboard: ArrowUp/Down/Home/End move between visible items (closed submenu skipped)', () => {
    const c = setup();
    const items = ['home', 'reports', 'inbox'].map(id => item(c, id));
    items[0].focus();
    key(c.window, items[0], 'ArrowDown'); assert.equal(c.document.activeElement, items[1]);
    key(c.window, items[1], 'ArrowDown'); assert.equal(c.document.activeElement, items[2]); // submenu closed -> skipped
    key(c.window, items[2], 'ArrowDown'); assert.equal(c.document.activeElement, items[0]);
    key(c.window, items[0], 'End'); assert.equal(c.document.activeElement, items[2]);
    key(c.window, items[2], 'Home'); assert.equal(c.document.activeElement, items[0]);
    key(c.window, items[0], 'ArrowUp'); assert.equal(c.document.activeElement, items[2]);
    click(c.window, items[1]); // open group: its children join the sequence
    items[1].focus();
    key(c.window, items[1], 'ArrowDown'); assert.equal(c.document.activeElement, item(c, 'daily'));
    c.sb.destroy();
});

test('mobile drawer: open/close, overlay, scroll lock, focus in and restored, Esc, item click closes, callbacks, external toggle aria', () => {
    const states = [], ev = [];
    const c = setup({ mobileToggle: '#menu', onMobileToggle: v => states.push(v) });
    c.sb.on('mobile', v => ev.push(v));
    const opener = c.document.getElementById('menu');
    assert.equal(opener.getAttribute('aria-controls'), c.sb.sidebar.id);
    c.document.body.style.overflow = 'scroll';
    opener.focus();
    click(c.window, opener);
    assert.equal(c.sb.isMobileOpen, true);
    assert.ok(c.sb.sidebar.classList.contains('open')); assert.ok(c.sb.overlay.classList.contains('visible'));
    assert.equal(c.document.body.style.overflow, 'hidden');
    assert.equal(opener.getAttribute('aria-expanded'), 'true');
    assert.ok(c.sb.sidebar.contains(c.document.activeElement));
    key(c.window, c.document.activeElement, 'Escape');
    assert.equal(c.sb.isMobileOpen, false);
    assert.equal(c.document.body.style.overflow, 'scroll');
    assert.equal(c.document.activeElement, opener);
    c.sb.openMobile();
    click(c.window, item(c, 'inbox'));
    assert.equal(c.sb.isMobileOpen, false);
    c.sb.openMobile();
    click(c.window, c.sb.overlay);
    assert.equal(c.sb.isMobileOpen, false);
    c.sb.openMobile();
    c.window.innerWidth = 1200; c.window.dispatchEvent(new c.window.Event('resize'));
    assert.equal(c.sb.isMobileOpen, false);
    assert.equal(states.join(), 'true,false,true,false,true,false,true,false');
    assert.equal(ev.length, 8);
    c.sb.destroy();
    assert.equal(opener.hasAttribute('aria-controls'), false);
});

test('destroy: removes listeners (window + toggle), overlay, restores original element and body overflow; safe twice', () => {
    const ctx = load('chillsidebar');
    const { document, window, lib } = ctx;
    const wAdd = {}, wRem = {};
    const wa = window.addEventListener.bind(window), wr = window.removeEventListener.bind(window);
    window.addEventListener = (t, f, o) => { wAdd[t] = (wAdd[t] || 0) + 1; return wa(t, f, o); };
    window.removeEventListener = (t, f, o) => { wRem[t] = (wRem[t] || 0) + 1; return wr(t, f, o); };
    document.body.innerHTML = '<div id="sb"></div>';
    document.body.style.overflow = 'auto';
    const sb = lib.init('#sb', { items: ITEMS() });
    sb.openMobile();
    sb.destroy(); sb.destroy();
    assert.equal(wAdd.resize, wRem.resize);
    assert.ok(document.getElementById('sb'));
    assert.equal(document.querySelector('.chillsidebar'), null);
    assert.equal(document.querySelector('.chillsidebar-overlay'), null);
    assert.equal(document.body.style.overflow, 'auto');
});

test('works without a target element / items; CSS: dark overrides, focus-visible, reduced motion, mobile', () => {
    const ctx = load('chillsidebar');
    const sb = ctx.lib.init('#none', {});
    assert.ok(sb.sidebar);
    sb.destroy();
    const c = setup();
    const css = c.document.getElementById('chillsidebar-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('max-width: 768px'));
    c.sb.destroy();
});
