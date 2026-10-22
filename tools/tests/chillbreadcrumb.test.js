const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const ITEMS = () => [
    { label: 'Home', href: '/' }, { label: 'Library', href: '/lib' }, { label: 'Data', href: '/lib/data' },
    { label: 'Sets', href: '/lib/data/sets' }, { label: 'Book' }
];
function setup(opts) {
    const ctx = load('chillbreadcrumb');
    ctx.document.body.innerHTML = '<div id="c"></div><p id="out">x</p>';
    ctx.bc = ctx.lib.init('#c', Object.assign({ items: ITEMS() }, opts));
    return ctx;
}
const key = (win, el, k) => { const e = new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const click = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));

test('SSR import safe', () => { assert.ok(loadSSR('chillbreadcrumb').init); });

test('semantic markup: nav[aria-label] > ol > li; separators are not <li>; last item aria-current=page', () => {
    const c = setup();
    const nav = c.document.querySelector('nav.chillbreadcrumb');
    assert.equal(nav.getAttribute('aria-label'), 'Breadcrumb');
    const lis = nav.querySelectorAll('ol > li');
    assert.equal(lis.length, 5);
    assert.equal(nav.querySelectorAll('ol > li.chillbreadcrumb-separator').length, 0);
    assert.equal(nav.querySelectorAll('.chillbreadcrumb-separator[aria-hidden="true"]').length, 4);
    assert.equal(nav.querySelectorAll('.chillbreadcrumb .chillbreadcrumb').length, 0); // no nested duplicate container
    const last = lis[4].firstElementChild;
    assert.equal(last.getAttribute('aria-current'), 'page');
    assert.equal(last.tagName, 'SPAN');            // no href -> plain text, not a dead link
    assert.equal(nav.querySelectorAll('[aria-current]').length, 1);
    assert.equal(lis[0].querySelector('a').getAttribute('href'), '/');
    c.bc.destroy();
});

test('last item with an href stays a link with aria-current', () => {
    const c = setup({ items: [{ label: 'A', href: '/' }, { label: 'B', href: '/b' }] });
    const a = c.document.querySelectorAll('.chillbreadcrumb-link')[1];
    assert.equal(a.getAttribute('aria-current'), 'page');
    assert.ok(a.classList.contains('active'));
    c.bc.destroy();
});

test('separators: text presets, custom text, Element, html opt-in', () => {
    const c = setup({ separator: 'slash' });
    assert.equal(c.document.querySelector('.chillbreadcrumb-separator').textContent, '/');
    c.bc.destroy();
    const d = setup({ separator: '<b id="s">|</b>' });
    assert.equal(d.document.querySelector('#s'), null);
    assert.equal(d.document.querySelector('.chillbreadcrumb-separator').textContent, '<b id="s">|</b>');
    d.bc.destroy();
    const e = setup({ separator: '<b id="s2">|</b>', html: true });
    assert.ok(e.document.querySelector('#s2'));
    e.bc.destroy();
    const ctx = load('chillbreadcrumb');
    ctx.document.body.innerHTML = '<div id="c"></div>';
    const node = ctx.document.createElement('i'); node.className = 'sep';
    const f = ctx.lib.init('#c', { items: ITEMS(), separator: node });
    assert.equal(ctx.document.querySelectorAll('.chillbreadcrumb-separator .sep').length, 4);
    f.destroy();
});

test('XSS: labels, hrefs, icons, homeIcon are inert by default', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const c = setup({ items: [{ label: evil, href: 'javascript:alert(1)', icon: evil }, { label: evil, href: 'data:text/html,x' }, { label: evil }], homeIcon: evil });
    assert.equal(c.document.querySelector('.chillbreadcrumb img'), null);
    c.document.querySelectorAll('.chillbreadcrumb a').forEach(a => assert.ok(!/^(javascript|data):/i.test(a.getAttribute('href'))));
    c.bc.destroy();
    const h = setup({ items: [{ label: 'A', href: '/', icon: '<svg id="ico"></svg>' }, { label: 'B' }], html: true });
    assert.ok(h.document.querySelector('#ico'));
    h.bc.destroy();
});

test('maxItems collapses the middle into a menu button with proper ARIA; collapsed items are reachable', () => {
    const c = setup({ maxItems: 3 });
    const btn = c.document.querySelector('.chillbreadcrumb-collapsed');
    assert.equal(btn.getAttribute('aria-haspopup'), 'true');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    const menu = c.document.getElementById(btn.getAttribute('aria-controls'));
    assert.equal(menu.querySelectorAll('a').length, 2); // Library, Data
    assert.equal(c.document.querySelectorAll('ol > li').length, 4); // Home, ..., Sets, Book
    c.bc.destroy();
    const one = setup({ maxItems: 1 });
    assert.equal(one.document.querySelector('[aria-current="page"]').textContent, 'Book'); // current page never hidden
    one.bc.destroy();
    const none = setup({ maxItems: 10 });
    assert.equal(none.document.querySelector('.chillbreadcrumb-collapsed'), null);
    none.bc.destroy();
});

test('menu: click toggles aria-expanded, outside click closes, Esc closes and refocuses, arrows navigate', () => {
    const c = setup({ maxItems: 3 });
    const btn = c.document.querySelector('.chillbreadcrumb-collapsed');
    const dd = btn.closest('.chillbreadcrumb-dropdown');
    const items = dd.querySelectorAll('.chillbreadcrumb-dropdown-item');
    click(c.window, btn);
    assert.ok(dd.classList.contains('open')); assert.equal(btn.getAttribute('aria-expanded'), 'true');
    click(c.window, c.document.getElementById('out'));
    assert.equal(dd.classList.contains('open'), false); assert.equal(btn.getAttribute('aria-expanded'), 'false');
    btn.focus();
    key(c.window, btn, 'ArrowDown');
    assert.ok(dd.classList.contains('open')); assert.equal(c.document.activeElement, items[0]);
    key(c.window, items[0], 'ArrowDown'); assert.equal(c.document.activeElement, items[1]);
    key(c.window, items[1], 'ArrowDown'); assert.equal(c.document.activeElement, items[0]);
    key(c.window, items[0], 'End'); assert.equal(c.document.activeElement, items[1]);
    key(c.window, items[1], 'Home'); assert.equal(c.document.activeElement, items[0]);
    key(c.window, items[0], 'Escape');
    assert.equal(dd.classList.contains('open'), false);
    assert.equal(c.document.activeElement, btn);
    key(c.window, btn, 'ArrowUp');
    assert.equal(c.document.activeElement, items[1]);
    c.bc.destroy();
});

test('onItemClick for links and menu items; selecting a menu item closes the menu', () => {
    const seen = [];
    const c = setup({ maxItems: 3, onItemClick: (e, l) => { e.preventDefault(); seen.push(l.textContent.trim()); } });
    click(c.window, c.document.querySelector('.chillbreadcrumb-link'));
    const btn = c.document.querySelector('.chillbreadcrumb-collapsed');
    click(c.window, btn);
    click(c.window, c.document.querySelector('.chillbreadcrumb-dropdown-item'));
    assert.equal(seen.join(), 'Home,Library');
    assert.equal(c.document.querySelector('.chillbreadcrumb-dropdown.open'), null);
    c.bc.destroy();
});

test('setItems re-renders repeatedly (regression: used to throw after first render) and keeps handlers working', () => {
    const seen = [];
    const c = setup({ onItemClick: (e, l) => { e.preventDefault(); seen.push(l.textContent.trim()); } });
    c.bc.setItems([{ label: 'X', href: '/x' }, { label: 'Y' }]);
    c.bc.setItems([{ label: 'P', href: '/p' }, { label: 'Q', href: '/q' }, { label: 'R' }]);
    assert.equal(c.document.querySelectorAll('ol > li').length, 3);
    assert.equal(c.document.querySelectorAll('nav.chillbreadcrumb').length, 1);
    click(c.window, c.document.querySelector('.chillbreadcrumb-link'));
    assert.equal(seen.join(), 'P');
    assert.equal(c.bc.getItems().length, 3);
    c.bc.destroy();
});

test('options: size, contained, homeIcon, ariaLabel', () => {
    const c = setup({ size: 'lg', contained: true, homeIcon: 'H', ariaLabel: 'You are here' });
    const nav = c.document.querySelector('nav');
    assert.ok(nav.classList.contains('chillbreadcrumb-lg')); assert.ok(nav.classList.contains('chillbreadcrumb-contained'));
    assert.equal(nav.getAttribute('aria-label'), 'You are here');
    assert.equal(nav.querySelector('.chillbreadcrumb-icon').textContent, 'H');
    c.bc.destroy();
});

test('destroy removes document listener, restores the original element, safe twice and without target', () => {
    const ctx = load('chillbreadcrumb');
    const { document, window, lib } = ctx;
    const add = {}, rem = {};
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { add[t] = (add[t] || 0) + 1; return a(t, f, o); };
    document.removeEventListener = (t, f, o) => { rem[t] = (rem[t] || 0) + 1; return r(t, f, o); };
    document.body.innerHTML = '<div id="c"></div>';
    const bc = lib.init('#c', { items: ITEMS(), maxItems: 3 });
    bc.setItems(ITEMS()); bc.setItems(ITEMS());
    bc.destroy(); bc.destroy();
    assert.equal(add.click, 1); assert.equal(rem.click, 1);
    assert.ok(document.getElementById('c'));
    assert.equal(document.querySelector('nav'), null);
    const orphan = lib.init('#none', { items: ITEMS() });
    assert.ok(orphan.breadcrumb);
    orphan.destroy();
});

test('CSS: dark overrides, focus-visible, reduced motion', () => {
    const c = setup();
    const css = c.document.getElementById('chillbreadcrumb-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
    c.bc.destroy();
});
