'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

const ITEMS = [
    { id: 'a', title: 'A', content: 'Body A' },
    { id: 'b', title: 'B', content: 'Body B' },
    { id: 'c', title: 'C', content: 'Body C' }
];

function setup(opts) {
    const env = load('chillaccordion');
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const acc = env.lib.init('#host', { items: ITEMS, ...opts });
    const triggers = () => Array.from(env.document.querySelectorAll('.chillaccordion-trigger'));
    return { ...env, host, acc, triggers };
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

test('SSR load does not throw', () => {
    assert.ok(loadSSR('chillaccordion').version);
});

test('title/content/icon are text, not HTML (no XSS)', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { document } = setup({ items: [{ id: '"><img src=x>', title: evil, content: evil, icon: evil }] });
    assert.equal(document.querySelector('.chillaccordion img'), null);
    assert.equal(document.querySelector('.chillaccordion-title').textContent, evil);
    assert.equal(document.querySelector('.chillaccordion-body').textContent, evil);
});

test('explicit html options render markup', () => {
    const a = setup({ html: true, items: [{ title: '<b>T</b>', content: '<i>C</i>' }] });
    assert.ok(a.document.querySelector('.chillaccordion-title b'));
    assert.ok(a.document.querySelector('.chillaccordion-body i'));
    const b = setup({ items: [{ title: 'x', content: 'y', contentHtml: '<u>z</u>', iconHtml: '<svg id="ic"></svg>' }] });
    assert.ok(b.document.querySelector('.chillaccordion-body u'));
    assert.ok(b.document.querySelector('#ic'));
});

test('ARIA wiring: aria-expanded, aria-controls, region labelledby', () => {
    const { window, document, triggers } = setup({ defaultOpen: ['b'] });
    const t = triggers();
    assert.deepEqual(t.map(x => x.getAttribute('aria-expanded')), ['false', 'true', 'false']);
    t.forEach(x => {
        const panel = document.getElementById(x.getAttribute('aria-controls'));
        assert.ok(panel);
        assert.equal(panel.getAttribute('role'), 'region');
        assert.equal(panel.getAttribute('aria-labelledby'), x.id);
    });
    assert.equal(document.querySelector('.chillaccordion-heading').getAttribute('role'), 'heading');
    click(window, t[0]);
    assert.equal(t[0].getAttribute('aria-expanded'), 'true');
});

test('single mode closes others; multiple keeps them open', () => {
    const s = setup({});
    click(s.window, s.triggers()[0]);
    click(s.window, s.triggers()[1]);
    assert.deepEqual(s.triggers().map(x => x.getAttribute('aria-expanded')), ['false', 'true', 'false']);
    const m = setup({ mode: 'multiple' });
    click(m.window, m.triggers()[0]);
    click(m.window, m.triggers()[1]);
    assert.deepEqual(m.triggers().map(x => x.getAttribute('aria-expanded')), ['true', 'true', 'false']);
    const legacy = setup({ multiple: true });
    legacy.acc.openAll();
    assert.equal(legacy.acc.openItems.size, 3);
});

test('collapsible:false keeps one item open in single mode', () => {
    const { window, triggers, acc } = setup({ defaultOpen: [0], collapsible: false });
    click(window, triggers()[0]);
    assert.equal(acc.isOpen(0), true);
});

test('defaultOpen ids are normalised and closing works afterwards', () => {
    const { acc } = setup({ defaultOpen: ['c'] });
    assert.deepEqual(Array.from(acc.openItems), [2]);
    acc.close('c');
    assert.equal(acc.openItems.size, 0);
});

test('onChange / on(change) callbacks', () => {
    const calls = [];
    const ev = [];
    const { acc } = setup({ onChange: (open, i, isOpen) => calls.push([open, i, isOpen]) });
    acc.on('change', (open, i, isOpen) => ev.push([i, isOpen]));
    acc.open(1);
    acc.close(1);
    assert.equal(JSON.stringify(calls), JSON.stringify([[[1], 1, true], [[], 1, false]]));
    assert.deepEqual(ev, [[1, true], [1, false]]);
});

test('keyboard: arrows wrap, Home/End jump, disabled skipped', () => {
    const { window, document, triggers } = setup({
        items: [{ title: 'A', content: '' }, { title: 'B', content: '', disabled: true }, { title: 'C', content: '' }, { title: 'D', content: '' }]
    });
    const t = triggers();
    t[0].focus();
    key(window, t[0], 'ArrowDown');
    assert.equal(document.activeElement, t[2], 'skips disabled');
    key(window, t[2], 'End');
    assert.equal(document.activeElement, t[3]);
    key(window, t[3], 'ArrowDown');
    assert.equal(document.activeElement, t[0], 'wraps');
    key(window, t[0], 'ArrowUp');
    assert.equal(document.activeElement, t[3]);
    key(window, t[3], 'Home');
    assert.equal(document.activeElement, t[0]);
});

test('disabled items cannot be toggled', () => {
    const { window, acc, triggers } = setup({ items: [{ title: 'A', content: 'a', disabled: true }] });
    click(window, triggers()[0]);
    acc.open(0);
    assert.equal(acc.openItems.size, 0);
});

test('height is explicit (no clipped 1000px cap) and becomes auto after open animation', async () => {
    const { acc, document, window } = setup({});
    Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return 321; } });
    const panel = document.querySelector('.chillaccordion-content');
    assert.equal(panel.style.height, '0px');
    acc.open(0);
    assert.equal(panel.style.height, '321px');
    await new Promise(r => setTimeout(r, 350));
    assert.equal(panel.style.height, 'auto');
    const css = document.getElementById('chillaccordion-styles').textContent;
    assert.ok(!css.includes('max-height: 1000px'));
});

test('reduced motion: no animation, instant height', () => {
    const env = load('chillaccordion');
    env.window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    const host = env.document.createElement('div'); host.id = 'h'; env.document.body.appendChild(host);
    const acc = env.lib.init('#h', { items: ITEMS });
    acc.open(0);
    assert.equal(env.document.querySelector('.chillaccordion-content').style.height, 'auto');
    acc.close(0);
    assert.equal(env.document.querySelector('.chillaccordion-content').style.height, '0px');
});

test('destroy removes DOM, restores the original element, clears timers and listeners', () => {
    const { acc, document, host } = setup({});
    acc.open(0);
    acc.destroy();
    assert.equal(document.querySelector('.chillaccordion'), null);
    assert.equal(document.getElementById('host'), host);
    assert.equal(acc._listeners.length, 0);
    assert.equal(acc._timers.size, 0);
    acc.destroy(); // idempotent
});

test('CSS: dark theme override, reduced motion, focus-visible', () => {
    const { document } = setup({});
    const css = document.getElementById('chillaccordion-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes(':focus-visible'));
});

test('src declares window.ChillAccordion', () => {
    assert.match(fs.readFileSync(sourceFile('chillaccordion'), 'utf8'), /window\.ChillAccordion\s*=/);
});
