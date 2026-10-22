'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

function setup(opts, confirm) {
    const env = load('chillpopover');
    const btn = env.document.createElement('button');
    btn.textContent = 'open';
    env.document.body.appendChild(btn);
    const pop = confirm ? env.lib.confirm(btn, opts) : env.lib.init(btn, opts);
    return { ...env, btn, pop };
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const esc = (w) => w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

test('SSR load does not throw', () => {
    assert.ok(loadSSR('chillpopover').version);
});

test('title/content/footer are text by default (no XSS)', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { document } = setup({ title: evil, content: evil, footer: evil, showClose: true });
    assert.equal(document.querySelector('.chillpopover img'), null);
    assert.equal(document.querySelector('.chillpopover-title').textContent, evil);
    assert.equal(document.querySelector('.chillpopover-body').textContent, evil);
    assert.equal(document.querySelector('.chillpopover-footer').textContent, evil);
});

test('explicit html options keep working', () => {
    const a = setup({ content: '<b id="x">x</b>', html: true });
    assert.ok(a.document.querySelector('.chillpopover-body b'));
    const b = setup({ contentHtml: '<i>y</i>', footerHtml: '<button id="fb">ok</button>', titleHtml: '<u>t</u>' });
    assert.ok(b.document.querySelector('.chillpopover-body i'));
    assert.ok(b.document.querySelector('#fb'));
    assert.ok(b.document.querySelector('.chillpopover-title u'));
    const c = setup({ content: 'hi' });
    c.pop.setContent('<img src=x>');
    assert.equal(c.document.querySelector('.chillpopover img'), null);
    c.pop.setContent('<em>e</em>', true);
    assert.ok(c.document.querySelector('.chillpopover em'));
});

test('Node content is accepted', () => {
    const env = load('chillpopover');
    const btn = env.document.createElement('button');
    env.document.body.appendChild(btn);
    const n = env.document.createElement('span');
    n.id = 'mine';
    const pop = env.lib.init(btn, { content: n });
    assert.ok(pop.popoverEl.querySelector('#mine'));
});

test('ARIA: role dialog, labelledby, expanded/controls/haspopup toggle and restore', () => {
    const { window, btn, pop } = setup({ title: 'T', content: 'c' });
    assert.equal(pop.popoverEl.getAttribute('role'), 'dialog');
    assert.equal(pop.popoverEl.getAttribute('aria-labelledby'), pop.popoverEl.querySelector('.chillpopover-title').id);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(btn.getAttribute('aria-controls'), pop.popoverEl.id);
    assert.equal(btn.getAttribute('aria-haspopup'), 'dialog');
    click(window, btn);
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.ok(pop.popoverEl.classList.contains('visible'));
    click(window, btn);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    pop.destroy();
    assert.equal(btn.getAttribute('aria-expanded'), null);
    assert.equal(btn.getAttribute('aria-controls'), null);
    assert.equal(window.document.querySelector('.chillpopover'), null);
});

test('close button has aria-label and closes', () => {
    const { window, btn, pop } = setup({ content: 'c', showClose: true });
    click(window, btn);
    const close = pop.popoverEl.querySelector('.chillpopover-close');
    assert.equal(close.getAttribute('aria-label'), 'Close');
    click(window, close);
    assert.equal(pop.isOpen, false);
});

test('Esc closes and returns focus to trigger', () => {
    const { window, btn, pop } = setup({ content: '<button id="inner">i</button>', html: true });
    click(window, btn);
    const inner = window.document.getElementById('inner');
    assert.equal(window.document.activeElement, inner, 'focus moves in on open');
    esc(window);
    assert.equal(pop.isOpen, false);
    assert.equal(window.document.activeElement, btn);
});

test('outside click closes; onClose only fires on real close', () => {
    let opens = 0, closes = 0;
    const { window, pop } = setup({ content: 'c', onOpen: () => opens++, onClose: () => closes++ });
    click(window, window.document.body); // not open -> nothing
    assert.equal(closes, 0);
    pop.show();
    assert.equal(opens, 1);
    click(window, pop.popoverEl); // inside: stays open
    assert.equal(pop.isOpen, true);
    click(window, window.document.body);
    assert.equal(pop.isOpen, false);
    assert.equal(closes, 1);
});

test('global listeners are removed on close and destroy', () => {
    const { window, pop } = setup({ content: 'c' });
    pop.show();
    const n = pop._listeners.length;
    assert.ok(n > 0);
    pop.hide(0);
    assert.ok(pop._listeners.length < n);
    pop.show();
    pop.destroy();
    assert.equal(pop._listeners.length, 0);
    // Esc after destroy must not throw
    esc(window);
});

test('flips when it does not fit', () => {
    const { btn, pop } = setup({ content: 'c', position: 'top' });
    btn.getBoundingClientRect = () => ({ top: 5, bottom: 25, left: 400, right: 440, width: 40, height: 20 });
    pop.popoverEl.getBoundingClientRect = () => ({ width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100 });
    pop.show();
    assert.ok(pop.popoverEl.classList.contains('chillpopover-bottom'));
    assert.ok(!pop.popoverEl.classList.contains('chillpopover-top'));
});

test('hover mode shows on mouseenter and hides after hideDelay', async () => {
    const { window, btn, pop } = setup({ content: 'c', triggerOn: 'hover', hideDelay: 20 });
    btn.dispatchEvent(new window.Event('mouseenter'));
    assert.equal(pop.isOpen, true);
    btn.dispatchEvent(new window.Event('mouseleave'));
    assert.equal(pop.isOpen, true);
    pop.popoverEl.dispatchEvent(new window.Event('mouseenter'));
    await new Promise(r => setTimeout(r, 50));
    assert.equal(pop.isOpen, true, 'entering popover cancels hide');
    pop.popoverEl.dispatchEvent(new window.Event('mouseleave'));
    await new Promise(r => setTimeout(r, 50));
    assert.equal(pop.isOpen, false);
});

test('confirm(): safe button text, callbacks, variant', () => {
    let ok = 0, cancel = 0;
    const evil = '<img src=x onerror=alert(1)>';
    const { window, btn, pop } = setup({ content: 'Sure?', confirmText: evil, cancelText: 'No', onConfirm: () => ok++, onCancel: () => cancel++ }, true);
    assert.equal(window.document.querySelector('.chillpopover img'), null);
    const okBtn = pop.popoverEl.querySelector('[data-action="confirm"]');
    assert.equal(okBtn.textContent, evil);
    assert.ok(okBtn.classList.contains('chillpopover-btn-danger'));
    click(window, btn);
    click(window, okBtn);
    assert.equal(ok, 1);
    assert.equal(pop.isOpen, false);
    click(window, btn);
    click(window, pop.popoverEl.querySelector('[data-action="cancel"]'));
    assert.equal(cancel, 1);
});

test('Tab past the last focusable closes and returns focus to trigger', () => {
    const { window, btn, pop } = setup({ content: '<button id="a">a</button>', html: true });
    click(window, btn);
    window.document.getElementById('a').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.equal(pop.isOpen, false);
    assert.equal(window.document.activeElement, btn);
});

test('CSS: dark theme override, reduced motion, focus-visible, z-index', () => {
    const { document } = setup({ content: 'c' });
    const css = document.getElementById('chillpopover-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes(':focus-visible'));
    assert.match(css, /z-index:\s*10003/);
});

test('src declares window.ChillPopover', () => {
    assert.match(fs.readFileSync(sourceFile('chillpopover'), 'utf8'), /window\.ChillPopover\s*=/);
});
