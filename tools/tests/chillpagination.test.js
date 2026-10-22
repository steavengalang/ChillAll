const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(opts) {
    const env = load('chillpagination');
    const host = env.document.createElement('div');
    host.id = 'pager';
    env.document.body.appendChild(host);
    const p = env.lib.init(host, opts);
    return Object.assign(env, { host, p });
}

test('renders nav with aria-label, aria-current and labelled buttons', () => {
    const { document, p } = setup({ total: 100, pageSize: 10 });
    const nav = document.querySelector('nav.chillpagination');
    assert.equal(nav.getAttribute('aria-label'), 'Pagination');
    assert.equal(nav.querySelector('[aria-current="page"]').textContent, '1');
    assert.equal(nav.querySelector('[data-action="prev"]').getAttribute('aria-label'), 'Previous page');
    assert.equal(nav.querySelector('[data-action="prev"]').disabled, true);
    assert.equal(nav.querySelector('[data-page="3"]').getAttribute('aria-label'), 'Page 3');
    assert.equal(nav.querySelector('[role=status]').textContent, 'Page 1 of 10');
    p.destroy();
});

test('multiple navigations work (re-render used to throw) and onChange fires', () => {
    const calls = [];
    const { document, p } = setup({ total: 100, pageSize: 10, onChange: (pg, sz) => calls.push([pg, sz]) });
    document.querySelector('[data-action="next"]').click();
    document.querySelector('[data-action="next"]').click();
    document.querySelector('[data-page="1"]').click();
    assert.deepEqual(calls, [[2, 10], [3, 10], [1, 10]]);
    assert.equal(p.getCurrentPage(), 1);
});

test('goToPage clamps and is silent on request; total=0 is safe', () => {
    const calls = [];
    const { p, document } = setup({ total: 25, pageSize: 10, onChange: pg => calls.push(pg) });
    p.goToPage(99);
    assert.equal(p.getCurrentPage(), 3);
    p.goToPage(1, { silent: true });
    assert.deepEqual(calls, [3]);
    p.setTotal(0);
    assert.equal(p.getTotalPages(), 1);
    assert.equal(document.querySelector('[aria-current="page"]').textContent, '1');
});

test('ellipsis is hidden from AT and page list is bounded', () => {
    const { document } = setup({ total: 1000, pageSize: 10, current: 50 });
    const dots = document.querySelectorAll('.chillpagination-ellipsis');
    assert.equal(dots.length, 2);
    assert.equal(dots[0].getAttribute('aria-hidden'), 'true');
    assert.ok(document.querySelectorAll('[data-page]').length <= 7);
});

test('XSS: prevText/nextText are text; prevHtml is opt-in', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { document, window } = setup({ total: 50, prevText: evil, nextText: evil });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('[data-action="prev"]').textContent, evil);
    assert.equal(window.__x, undefined);
    const { document: d2 } = setup({ total: 50, prevHtml: '<b id="ok">P</b>' });
    assert.ok(d2.querySelector('#ok'));
});

test('size changer, info, and jumper (clamped)', () => {
    const sizes = []; const pages = [];
    const { document, window, p } = setup({ total: 95, pageSize: 10, showInfo: true, showSizeChanger: true, showJumper: true, onPageSizeChange: s => sizes.push(s), onChange: pg => pages.push(pg) });
    assert.match(document.querySelector('.chillpagination-info').textContent, /1-10 of 95/);
    const sel = document.querySelector('.chillpagination-select');
    sel.value = '50';
    sel.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.deepEqual(sizes, [50]);
    assert.equal(p.getTotalPages(), 2);
    const j = document.querySelector('.chillpagination-jump-input');
    j.value = '99';
    j.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.equal(p.getCurrentPage(), 2);
});

test('arrow keys move focus between buttons and focus survives re-render', () => {
    const { document, window } = setup({ total: 100 });
    const b1 = document.querySelector('[data-page="1"]');
    b1.focus();
    b1.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    assert.equal(document.activeElement.dataset.page, '2');
    document.activeElement.click();
    assert.equal(document.activeElement.dataset.page, '2');
    assert.equal(document.activeElement.getAttribute('aria-current'), 'page');
});

test('destroy restores the original element and removes listeners', () => {
    const { document, host, p } = setup({ total: 50 });
    assert.equal(host.parentNode, null);
    const nav = document.querySelector('nav');
    p.destroy();
    assert.equal(document.querySelector('nav'), null);
    assert.equal(document.getElementById('pager'), host);
    nav.click(); // detached nav must not throw
    p.destroy();
});

test('dark mode CSS covers data-theme and .dark', () => {
    const { document } = setup({ total: 10 });
    const css = document.getElementById('chillpagination-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
});
