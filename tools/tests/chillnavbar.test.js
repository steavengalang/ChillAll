const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const LINKS = () => [
    { label: 'Home', href: '/', active: true },
    { label: 'Docs', children: [{ label: 'Guide', href: '/guide' }, { label: 'API', href: '/api' }, { label: 'FAQ', href: '/faq' }] },
    { label: 'GitHub', href: 'https://github.com', target: '_blank' }
];
function setup(opts, platform) {
    const ctx = load('chillnavbar');
    if (platform) Object.defineProperty(ctx.window.navigator, 'platform', { value: platform, configurable: true });
    ctx.document.body.innerHTML = '<div id="page"><header id="nav"></header><main>content</main></div>';
    ctx.nav = ctx.lib.init('#nav', Object.assign({ brand: { name: 'Acme', href: '/' }, links: LINKS() }, opts));
    return ctx;
}
const key = (win, el, k, init) => { const e = new win.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, init)); el.dispatchEvent(e); return e; };
const click = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));

test('SSR import safe', () => { assert.ok(loadSSR('chillnavbar').init); });

test('renders nav landmark with label, brand, links, active link has aria-current', () => {
    const { nav, document } = setup();
    const n = document.querySelector('nav.chillnavbar');
    assert.equal(n.getAttribute('aria-label'), 'Main navigation');
    assert.equal(n.querySelector('.chillnavbar-brand span').textContent, 'Acme');
    const links = n.querySelectorAll('.chillnavbar-menu > .chillnavbar-link');
    assert.equal(links.length, 2);
    assert.equal(links[0].getAttribute('aria-current'), 'page');
    assert.equal(links[1].getAttribute('rel'), 'noopener noreferrer');
    assert.equal(document.getElementById('nav'), null); // replaced
    nav.destroy();
});

test('XSS: label, brand, hrefs, logo, placeholder are inert; javascript: urls neutralised', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { nav, document } = setup({
        brand: { name: evil, logo: 'javascript:alert(1)', href: ' JaVa\nScRiPt:alert(1)' },
        links: [{ label: evil, href: 'javascript:alert(1)', icon: evil }, { label: evil, children: [{ label: evil, href: 'data:text/html,<script>x</script>' }] }],
        searchable: true, searchPlaceholder: evil
    });
    assert.equal(document.querySelector('.chillnavbar img[src="x"]'), null);
    assert.equal(document.querySelectorAll('.chillnavbar img').length, 1); // just the logo, not injected
    assert.equal(document.querySelector('.chillnavbar-brand').getAttribute('href'), '#');
    assert.equal(document.querySelector('.chillnavbar-brand-logo').getAttribute('src'), '#');
    document.querySelectorAll('.chillnavbar a').forEach(a => assert.ok(!/^javascript:|^data:/i.test(a.getAttribute('href').replace(/\s/g, ''))));
    assert.equal(document.querySelector('.chillnavbar-search-input').getAttribute('placeholder'), evil);
    nav.destroy();
});

test('icon strings are text unless html:true; Node icons accepted; actions html/element', () => {
    const ctx = load('chillnavbar');
    ctx.document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    const node = ctx.document.createElement('i'); node.className = 'ico';
    const a = ctx.lib.init('#a', { links: [{ label: 'x', href: '/', icon: '<b id="nope">i</b>' }, { label: 'y', href: '/', icon: node }], actions: [{ html: '<button id="signin">Sign in</button>' }, { element: ctx.document.createElement('span') }] });
    assert.equal(ctx.document.getElementById('nope'), null);
    assert.ok(ctx.document.querySelector('.chillnavbar-link-icon .ico'));
    assert.ok(ctx.document.querySelector('#signin'));
    a.destroy();
    const b = ctx.lib.init('#b', { html: true, links: [{ label: 'x', href: '/', icon: '<b id="yes">i</b>' }] });
    assert.ok(ctx.document.getElementById('yes'));
    b.destroy();
});

test('mobile toggle: aria-expanded/controls, class, scroll lock, Esc closes and refocuses toggle, onToggle + on()', () => {
    const events = [], ev2 = [];
    const { nav, document, window } = setup({ onToggle: o => events.push(o) });
    const off = nav.on('toggle', o => ev2.push(o));
    const btn = nav.navbar.querySelector('.chillnavbar-toggle');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(btn.getAttribute('aria-controls'), nav.navbar.querySelector('.chillnavbar-menu').id);
    document.body.style.overflow = 'auto';
    click(window, btn);
    assert.equal(nav.isOpen, true);
    assert.ok(nav.navbar.classList.contains('open'));
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.equal(document.body.style.overflow, 'hidden');
    key(window, nav.navbar.querySelector('.chillnavbar-link'), 'Escape');
    assert.equal(nav.isOpen, false);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(document.body.style.overflow, 'auto');
    assert.equal(document.activeElement, btn);
    assert.equal(events.join(), 'true,false'); assert.equal(ev2.join(), 'true,false');
    off(); nav.openMenu();
    assert.equal(ev2.length, 2);
    nav.destroy();
    assert.equal(document.body.style.overflow, 'auto'); // restored by destroy while open
});

test('choosing a link closes the mobile menu and calls onLinkClick; resize past breakpoint closes', () => {
    const clicked = [];
    const { nav, window } = setup({ onLinkClick: (e, l) => { e.preventDefault(); clicked.push(l.textContent); } });
    nav.openMenu();
    click(window, nav.navbar.querySelector('.chillnavbar-menu > .chillnavbar-link'));
    assert.equal(nav.isOpen, false);
    assert.equal(clicked.join(), 'Home');
    nav.openMenu();
    window.innerWidth = 1200;
    window.dispatchEvent(new window.Event('resize'));
    assert.equal(nav.isOpen, false);
    nav.destroy();
});

test('dropdown: button semantics, click toggles, one open at a time, outside click closes', () => {
    const { nav, document, window } = setup({ links: [{ label: 'A', children: [{ label: 'a1', href: '/a1' }] }, { label: 'B', children: [{ label: 'b1', href: '/b1' }] }] });
    const triggers = nav.navbar.querySelectorAll('.chillnavbar-dropdown-trigger');
    assert.equal(triggers[0].tagName, 'BUTTON');
    assert.equal(triggers[0].getAttribute('aria-haspopup'), 'true');
    assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
    click(window, triggers[0]);
    assert.equal(triggers[0].getAttribute('aria-expanded'), 'true');
    assert.ok(triggers[0].parentNode.classList.contains('open'));
    click(window, triggers[1]);
    assert.equal(triggers[0].getAttribute('aria-expanded'), 'false');
    assert.equal(triggers[1].getAttribute('aria-expanded'), 'true');
    click(window, document.querySelector('main'));
    assert.equal(nav.navbar.querySelectorAll('.chillnavbar-dropdown.open').length, 0);
    assert.equal(triggers[1].getAttribute('aria-expanded'), 'false');
    nav.destroy();
});

test('dropdown keyboard: ArrowDown opens + focuses first, arrows wrap, Home/End, Esc closes and refocuses trigger', () => {
    const { nav, document, window } = setup();
    const trigger = nav.navbar.querySelector('.chillnavbar-dropdown-trigger');
    const items = nav.navbar.querySelectorAll('.chillnavbar-dropdown-item');
    trigger.focus();
    key(window, trigger, 'ArrowDown');
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(document.activeElement, items[0]);
    key(window, items[0], 'ArrowDown'); assert.equal(document.activeElement, items[1]);
    key(window, items[1], 'End'); assert.equal(document.activeElement, items[2]);
    key(window, items[2], 'ArrowDown'); assert.equal(document.activeElement, items[0]);
    key(window, items[0], 'ArrowUp'); assert.equal(document.activeElement, items[2]);
    key(window, items[2], 'Home'); assert.equal(document.activeElement, items[0]);
    key(window, items[0], 'Escape');
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, trigger);
    key(window, trigger, 'ArrowUp');
    assert.equal(document.activeElement, items[2]);
    nav.destroy();
});

test('Esc inside a dropdown does not also close the mobile menu', () => {
    const { nav, window } = setup();
    const trigger = nav.navbar.querySelector('.chillnavbar-dropdown-trigger');
    nav.openMenu();
    click(window, trigger);
    key(window, nav.navbar.querySelector('.chillnavbar-dropdown-item'), 'Escape');
    assert.equal(nav.isOpen, true);
    nav.destroy();
});

test('search: onSearch on input and Enter, OS-aware shortcut chip, searchHotkey focuses input', () => {
    const calls = [];
    const { nav, document, window } = setup({ searchable: true, searchHotkey: true, onSearch: (v, s) => calls.push([v, !!s]) }, 'Win32');
    const input = nav.navbar.querySelector('.chillnavbar-search-input');
    input.value = 'abc'; input.dispatchEvent(new window.Event('input', { bubbles: true }));
    key(window, input, 'Enter');
    assert.equal(JSON.stringify(calls), '[["abc",false],["abc",true]]');
    assert.equal(nav.navbar.querySelector('.chillnavbar-search').getAttribute('role'), 'search');
    assert.equal(nav.navbar.querySelector('.chillnavbar-search-shortcut').textContent, 'Ctrl K');
    input.blur();
    key(window, document.body, 'k', { ctrlKey: true });
    assert.equal(document.activeElement, input);
    nav.destroy();
    const m = setup({ searchable: true }, 'MacIntel');
    assert.equal(m.nav.navbar.querySelector('.chillnavbar-search-shortcut').textContent, '⌘K');
    m.nav.destroy();
});

test('setActiveLink / setTransparent / fixed + transparent classes', () => {
    const { nav } = setup({ fixed: true, transparent: true });
    assert.ok(nav.navbar.classList.contains('chillnavbar-fixed'));
    nav.setTransparent(false);
    assert.equal(nav.navbar.classList.contains('chillnavbar-transparent'), false);
    nav.setActiveLink('/api');
    const api = Array.from(nav.navbar.querySelectorAll('a')).find(a => a.getAttribute('href') === '/api');
    assert.equal(api.getAttribute('aria-current'), 'page');
    assert.equal(nav.navbar.querySelectorAll('[aria-current="page"]').length, 1);
    nav.destroy();
});

test('destroy removes ALL document/window listeners (no leaks), restores original element, safe twice', () => {
    const ctx = load('chillnavbar');
    const { document, window, lib } = ctx;
    const count = (obj, store) => (type) => store[type] = (store[type] || 0) + 1;
    const dAdd = {}, dRem = {}, wAdd = {}, wRem = {};
    const da = document.addEventListener.bind(document), dr = document.removeEventListener.bind(document);
    const wa = window.addEventListener.bind(window), wr = window.removeEventListener.bind(window);
    document.addEventListener = (t, f, o) => { dAdd[t] = (dAdd[t] || 0) + 1; return da(t, f, o); };
    document.removeEventListener = (t, f, o) => { dRem[t] = (dRem[t] || 0) + 1; return dr(t, f, o); };
    window.addEventListener = (t, f, o) => { wAdd[t] = (wAdd[t] || 0) + 1; return wa(t, f, o); };
    window.removeEventListener = (t, f, o) => { wRem[t] = (wRem[t] || 0) + 1; return wr(t, f, o); };
    document.body.innerHTML = '<div id="nav"></div>';
    const nav = lib.init('#nav', { links: LINKS(), searchable: true, searchHotkey: true });
    nav.destroy(); nav.destroy();
    assert.equal(dAdd.click, dRem.click); assert.equal(dAdd.keydown, dRem.keydown); assert.equal(wAdd.resize, wRem.resize);
    assert.ok(document.getElementById('nav'));
    assert.equal(document.querySelector('.chillnavbar'), null);
    // a stale click must not throw
    assert.doesNotThrow(() => document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
});

test('works without a target element and without brand/links', () => {
    const ctx = load('chillnavbar');
    const nav = ctx.lib.init('#none', {});
    assert.ok(nav.navbar);
    nav.openMenu(); nav.destroy();
});

test('CSS: dark overrides, focus-visible, reduced motion, mobile breakpoint', () => {
    const { nav, document } = setup();
    const css = document.getElementById('chillnavbar-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('max-width: 768px'));
    nav.destroy();
});
