const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(opts) {
    const ctx = load('chilllayout');
    const { document } = ctx;
    document.body.innerHTML = '<button id="menu">menu</button><div id="app"></div>';
    const mk = (tag, text, id) => { const e = document.createElement(tag); e.textContent = text; if (id) e.id = id; return e; };
    ctx.mk = mk;
    ctx.l = ctx.lib.init('#app', Object.assign({
        header: mk('div', 'Header'), sidebar: mk('nav', 'Side', 'sidenav'), sidebarRight: mk('div', 'Right'),
        content: mk('p', 'Hello', 'hello'), footer: mk('div', 'Footer')
    }, opts));
    return ctx;
}
const key = (win, el, k) => { const e = new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const click = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));

test('SSR import safe', () => { assert.ok(loadSSR('chilllayout').init); });

test('renders landmark structure with labels; Node slots are moved in', () => {
    const c = setup();
    const L = c.document.querySelector('.chilllayout');
    assert.ok(L.querySelector('header.chilllayout-header'));
    assert.ok(L.querySelector('footer.chilllayout-footer'));
    const main = L.querySelector('main.chilllayout-main');
    assert.equal(main.getAttribute('tabindex'), '-1');
    assert.ok(main.querySelector('#hello'));
    const asides = L.querySelectorAll('aside');
    assert.equal(asides.length, 2);
    assert.equal(asides[0].getAttribute('aria-label'), 'Sidebar');
    assert.equal(asides[1].getAttribute('aria-label'), 'Secondary sidebar');
    assert.ok(L.querySelector('#sidenav'));
    assert.equal(c.document.getElementById('app'), null);
    assert.equal(c.l.regions.header.textContent, 'Header');
    c.l.destroy();
});

test('string slots are TEXT by default (no XSS); html:true and per-call html opt-in', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const c = setup({ header: evil, sidebar: evil, sidebarRight: evil, content: evil, footer: evil });
    assert.equal(c.document.querySelector('.chilllayout img'), null);
    assert.equal(c.l.regions.content.textContent, evil);
    c.l.setContent(evil); c.l.setSidebar(evil); c.l.setSidebar(evil, 'right'); c.l.setHeader(evil); c.l.setFooter(evil);
    assert.equal(c.document.querySelector('.chilllayout img'), null);
    c.l.setContent('<b id="b1">x</b>', { html: true });
    assert.ok(c.document.querySelector('#b1'));
    c.l.destroy();
    const h = setup({ html: true, content: '<b id="b2">x</b>', header: '<i id="i2">h</i>' });
    assert.ok(h.document.querySelector('#b2') && h.document.querySelector('#i2'));
    h.l.setContent('<u id="u2">u</u>');
    assert.ok(h.document.querySelector('#u2'));
    h.l.destroy();
});

test('setContent / setSidebar(left,right) / setHeader / setFooter update slots; missing regions are ignored', () => {
    const c = setup();
    c.l.setContent(c.mk('p', 'New', 'n1'));
    assert.ok(c.l.regions.content.querySelector('#n1')); assert.equal(c.l.regions.content.querySelector('#hello'), null);
    c.l.setSidebar('L'); c.l.setSidebar('R', 'right');
    assert.equal(c.l.regions.sidebar.textContent, 'L'); assert.equal(c.l.regions.sidebarRight.textContent, 'R');
    c.l.setHeader('H2'); c.l.setFooter('F2');
    assert.equal(c.l.regions.header.textContent, 'H2'); assert.equal(c.l.regions.footer.textContent, 'F2');
    c.l.destroy();
    const m = setup({ header: null, sidebar: null, sidebarRight: null, footer: null });
    assert.doesNotThrow(() => { m.l.setSidebar('x'); m.l.setHeader('x'); m.l.setFooter('x'); m.l.openSidebar(); });
    assert.ok(m.l.layout.classList.contains('chilllayout-no-header'));
    m.l.destroy();
});

test('containerSize is whitelisted; helper builders sanitise numbers and sizes', () => {
    const c = setup({ containerSize: 'lg' });
    assert.ok(c.l.regions.content.classList.contains('chilllayout-container-lg'));
    c.l.destroy();
    const d = setup({ containerSize: 'x" onclick="evil' });
    assert.ok(d.l.regions.content.classList.contains('chilllayout-container-xl'));
    assert.equal(d.l.regions.content.getAttribute('onclick'), null);
    d.l.destroy();
    const { lib } = d;
    assert.equal(lib.createGrid(3, 6).className, 'chilllayout-grid chilllayout-grid-3 chilllayout-gap-6');
    assert.equal(lib.createGrid('9', '99').className, 'chilllayout-grid chilllayout-grid-6 chilllayout-gap-12');
    assert.equal(lib.createGrid('evil').className, 'chilllayout-grid chilllayout-grid-1 chilllayout-gap-6');
    assert.equal(lib.createContainer('md').className, 'chilllayout-container chilllayout-container-md');
    assert.equal(lib.createContainer('zzz').className, 'chilllayout-container chilllayout-container-xl');
    assert.equal(lib.createStack(2).className, 'chilllayout-stack chilllayout-stack-2');
    assert.equal(lib.createCard().className, 'chilllayout-card');
});

test('skip link jumps to main and focuses it', () => {
    const c = setup({ skipLink: true, skipLinkText: 'Jump' });
    const skip = c.document.querySelector('.chilllayout-skip');
    assert.equal(skip.textContent, 'Jump');
    assert.equal(skip.getAttribute('href'), '#' + c.l.regions.main.id);
    click(c.window, skip);
    assert.equal(c.document.activeElement, c.l.regions.main);
    c.l.destroy();
    const n = setup();
    assert.equal(n.document.querySelector('.chilllayout-skip'), null);
    n.l.destroy();
});

test('mobile sidebar drawer: open/close, aria wiring via sidebarToggle, focus moves in and returns, Esc, backdrop, resize', () => {
    const c = setup({ sidebarToggle: '#menu' });
    const btn = c.document.getElementById('menu');
    assert.equal(btn.getAttribute('aria-controls'), c.l.regions.sidebar.id);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    btn.focus();
    click(c.window, btn);
    assert.equal(c.l.isSidebarOpen, true);
    assert.ok(c.l.layout.classList.contains('chilllayout-sidebar-open'));
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.ok(c.l.regions.sidebar.contains(c.document.activeElement) || c.document.activeElement === c.l.regions.sidebar);
    key(c.window, c.document.activeElement, 'Escape');
    assert.equal(c.l.isSidebarOpen, false);
    assert.equal(c.document.activeElement, btn);
    assert.equal(c.l.regions.sidebar.hasAttribute('tabindex'), false);
    c.l.openSidebar();
    click(c.window, c.l.backdrop);
    assert.equal(c.l.isSidebarOpen, false);
    c.l.toggleSidebar();
    c.window.innerWidth = 1200; c.window.dispatchEvent(new c.window.Event('resize'));
    assert.equal(c.l.isSidebarOpen, false);
    c.l.destroy();
    assert.equal(btn.hasAttribute('aria-controls'), false);
});

test('destroy removes window listeners, restores original element, safe twice and without target', () => {
    const ctx = load('chilllayout');
    const { document, window, lib } = ctx;
    const add = {}, rem = {};
    const a = window.addEventListener.bind(window), r = window.removeEventListener.bind(window);
    window.addEventListener = (t, f, o) => { add[t] = (add[t] || 0) + 1; return a(t, f, o); };
    window.removeEventListener = (t, f, o) => { rem[t] = (rem[t] || 0) + 1; return r(t, f, o); };
    document.body.innerHTML = '<div id="app"></div>';
    const l = lib.init('#app', { content: 'x', sidebar: 'side' });
    l.openSidebar();
    l.destroy(); l.destroy();
    assert.equal(add.resize, rem.resize);
    assert.ok(document.getElementById('app'));
    assert.equal(document.querySelector('.chilllayout'), null);
    const o = lib.init('#none', { content: 'x' });
    assert.ok(o.layout);
    o.destroy();
});

test('CSS: dark overrides, mobile drawer rules, reduced motion, skip link focus ring', () => {
    const c = setup();
    const css = c.document.getElementById('chilllayout-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(/max-width: 768px[\s\S]*chilllayout-sidebar-open/.test(css));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('.chilllayout-skip:focus'));
    c.l.destroy();
});
