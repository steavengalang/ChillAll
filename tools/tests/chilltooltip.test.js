'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

function setup(opts) {
    const env = load('chilltooltip');
    const btn = env.document.createElement('button');
    btn.textContent = 'x';
    env.document.body.appendChild(btn);
    const tip = env.lib.init(btn, opts);
    return { ...env, btn, tip };
}

test('SSR load does not throw and exposes version', () => {
    const lib = loadSSR('chilltooltip');
    assert.ok(lib.version);
});

test('content is rendered as text (no XSS) unless html:true', () => {
    const { document, tip } = setup({ content: '<img src=x onerror=alert(1)>' });
    assert.equal(document.querySelector('.chilltooltip img'), null);
    assert.equal(document.querySelector('.chilltooltip-content').textContent, '<img src=x onerror=alert(1)>');
    tip.setContent('<img src=x onerror=alert(2)>');
    assert.equal(document.querySelector('.chilltooltip img'), null);
    tip.setContent('<b>bold</b>', true);
    assert.ok(document.querySelector('.chilltooltip b'));
    tip.destroy();
    const h = setup({ content: '<i>it</i>', html: true });
    assert.ok(h.document.querySelector('.chilltooltip i'));
});

test('data-tooltip attribute is used as text', () => {
    const env = load('chilltooltip');
    const b = env.document.createElement('button');
    b.setAttribute('data-tooltip', '<img src=x>');
    env.document.body.appendChild(b);
    const [t] = env.lib.initAll();
    assert.equal(env.document.querySelector('.chilltooltip img'), null);
    assert.equal(t.tooltipEl.textContent, '<img src=x>');
});

test('role=tooltip + aria-describedby wired and restored on destroy', () => {
    const env = load('chilltooltip');
    const b = env.document.createElement('button');
    b.setAttribute('aria-describedby', 'other');
    env.document.body.appendChild(b);
    const tip = env.lib.init(b, { content: 'hi' });
    assert.equal(tip.tooltipEl.getAttribute('role'), 'tooltip');
    const ids = b.getAttribute('aria-describedby').split(' ');
    assert.ok(ids.includes('other'));
    assert.ok(ids.includes(tip.tooltipEl.id));
    tip.destroy();
    assert.equal(b.getAttribute('aria-describedby'), 'other');
});

test('shows on focus, hides on blur, Esc dismisses', () => {
    const { window, btn, tip } = setup({ content: 'hi' });
    btn.dispatchEvent(new window.Event('focus'));
    assert.equal(tip.isVisible(), true);
    assert.ok(tip.tooltipEl.classList.contains('visible'));
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(tip.isVisible(), false);
    btn.dispatchEvent(new window.Event('focus'));
    btn.dispatchEvent(new window.Event('blur'));
    assert.equal(tip.isVisible(), false);
});

test('delay and hideDelay are honoured and timers cleared on destroy', async () => {
    const { window, btn, tip } = setup({ content: 'hi', delay: 40, hideDelay: 40 });
    btn.dispatchEvent(new window.Event('mouseenter'));
    assert.equal(tip.isVisible(), false);
    await new Promise(r => setTimeout(r, 80));
    assert.equal(tip.isVisible(), true);
    btn.dispatchEvent(new window.Event('mouseleave'));
    assert.equal(tip.isVisible(), true);
    await new Promise(r => setTimeout(r, 80));
    assert.equal(tip.isVisible(), false);
    btn.dispatchEvent(new window.Event('mouseenter'));
    tip.destroy();
    await new Promise(r => setTimeout(r, 80));
    assert.equal(tip.isVisible(), false);
    assert.equal(window.document.querySelector('.chilltooltip'), null);
});

test('flips to the opposite side when it does not fit', () => {
    const { btn, tip } = setup({ content: 'hi', position: 'top' });
    btn.getBoundingClientRect = () => ({ top: 2, bottom: 22, left: 400, right: 440, width: 40, height: 20 });
    tip.tooltipEl.getBoundingClientRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 80, height: 30 });
    tip.show();
    assert.ok(tip.tooltipEl.classList.contains('chilltooltip-bottom'));
    assert.ok(!tip.tooltipEl.classList.contains('chilltooltip-top'));
    tip.destroy();
    const n = setup({ content: 'hi', position: 'top', flip: false });
    n.btn.getBoundingClientRect = () => ({ top: 2, bottom: 22, left: 400, right: 440, width: 40, height: 20 });
    n.tip.tooltipEl.getBoundingClientRect = () => ({ width: 80, height: 30, top: 0, left: 0, right: 80, bottom: 30 });
    n.tip.show();
    assert.ok(n.tip.tooltipEl.classList.contains('chilltooltip-top'));
});

test('click mode toggles and outside click closes; listeners removed on hide/destroy', () => {
    const { window, btn, tip } = setup({ content: 'hi', triggerOn: 'click' });
    btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(tip.isVisible(), true);
    window.document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(tip.isVisible(), false);
    btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    tip.destroy();
    assert.equal(tip._listeners.length, 0);
});

test('events/callbacks fire', () => {
    let shown = 0, hidden = 0, ev = 0;
    const { tip } = setup({ content: 'hi', onShow: () => shown++, onHide: () => hidden++ });
    tip.on('show', () => ev++);
    tip.show(); tip.hide();
    assert.deepEqual([shown, hidden, ev], [1, 1, 1]);
});

test('CSS: theme overrides, z-index above modal/toast, reduced motion', () => {
    const { document } = setup({ content: 'hi' });
    const css = document.getElementById('chilltooltip-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.match(css, /z-index:\s*10004/);
});

test('src declares window.ChillTooltip', () => {
    assert.match(fs.readFileSync(sourceFile('chilltooltip'), 'utf8'), /window\.ChillTooltip\s*=/);
});
