const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const key = (document, k, extra) => document.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));

test('chilldrawer is SSR safe and has version', () => {
    const lib = loadSSR('chilldrawer');
    assert.ok(lib.version);
    assert.equal(typeof lib.create, 'function');
});

test('chilldrawer opens, sets ARIA, closes and destroys cleanly', async () => {
    const { lib, document } = load('chilldrawer');
    const d = lib.create({ side: 'left', title: 'Menu', content: 'Hi' });
    assert.equal(document.querySelector('.chilldrawer'), null);
    d.open();
    const root = document.querySelector('.chilldrawer');
    assert.ok(root.classList.contains('chilldrawer-left'));
    const panel = root.querySelector('.chilldrawer-panel');
    assert.equal(panel.getAttribute('role'), 'dialog');
    assert.equal(panel.getAttribute('aria-modal'), 'true');
    assert.equal(document.getElementById(panel.getAttribute('aria-labelledby')).textContent, 'Menu');
    assert.equal(document.body.style.overflow, 'hidden');
    d.close();
    assert.equal(d.isOpen, false);
    assert.equal(document.body.style.overflow, '');
    d.destroy();
    assert.equal(document.querySelector('.chilldrawer'), null);
});

test('chilldrawer does not execute HTML in title/content by default', () => {
    const { lib, document } = load('chilldrawer');
    const bad = '<img src=x onerror=alert(1)>';
    const d = lib.create({ title: bad, content: bad, footer: bad });
    d.open();
    assert.equal(document.querySelectorAll('.chilldrawer img').length, 0);
    assert.equal(document.querySelector('.chilldrawer-body').textContent, bad);
    d.destroy();
    const h = lib.create({ content: '<b id="x">b</b>', html: true });
    h.open();
    assert.ok(document.getElementById('x'));
    h.destroy();
});

test('chilldrawer Esc closes only the top-most drawer; overlay click closes; stacking z-index', () => {
    const { lib, document } = load('chilldrawer');
    const a = lib.create({ title: 'a' }).open();
    const b = lib.create({ title: 'b' }).open();
    assert.ok(Number(b.element.style.zIndex) > Number(a.element.style.zIndex));
    key(document, 'Escape');
    assert.equal(b.isOpen, false);
    assert.equal(a.isOpen, true);
    a.overlay.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    assert.equal(a.isOpen, false);
    assert.equal(lib.getStack().length, 0);
});

test('chilldrawer closeOnEsc/closeOnOverlay false are honoured and onBeforeClose can cancel', () => {
    const { lib, document } = load('chilldrawer');
    const d = lib.create({ closeOnEsc: false, closeOnOverlay: false }).open();
    key(document, 'Escape');
    d.overlay.click();
    assert.equal(d.isOpen, true);
    d.destroy();
    let reason = null;
    const e = lib.create({ onBeforeClose: r => { reason = r; return false; } }).open();
    e.close('button');
    assert.equal(reason, 'button');
    assert.equal(e.isOpen, true);
    e.destroy();
});

test('chilldrawer traps focus with Tab and returns focus on close', () => {
    const { lib, document } = load('chilldrawer');
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const content = document.createElement('div');
    content.innerHTML = '<input id="i1"><input id="i2">';
    const d = lib.create({ content }).open();
    const items = [d.closeBtn, document.getElementById('i1'), document.getElementById('i2')];
    assert.equal(document.activeElement, items[1]);
    // Tab from last wraps to first
    items[2].focus();
    key(document, 'Tab');
    assert.equal(document.activeElement, items[0]);
    // Shift+Tab from first wraps to last
    key(document, 'Tab', { shiftKey: true });
    assert.equal(document.activeElement, items[2]);
    d.close();
    assert.equal(document.activeElement, trigger);
    d.destroy();
});

test('chilldrawer scroll lock is reference counted across stacked drawers', () => {
    const { lib, document } = load('chilldrawer');
    const a = lib.create({}).open();
    const b = lib.create({}).open();
    a.close(); // not top, still allowed
    assert.equal(document.body.style.overflow, 'hidden');
    b.close();
    assert.equal(document.body.style.overflow, '');
});

test('chilldrawer swipe to close', () => {
    const { lib, document, window } = load('chilldrawer');
    const d = lib.create({ side: 'right', swipeToClose: true }).open();
    const touch = (type, x) => {
        const e = new window.Event(type, { bubbles: true });
        e.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: 0 }];
        e.changedTouches = [{ clientX: x, clientY: 0 }];
        d.panel.dispatchEvent(e);
    };
    touch('touchstart', 100);
    touch('touchmove', 400);
    touch('touchend', 400);
    assert.equal(d.isOpen, false);
    d.destroy();
});

test('chilldrawer init wires trigger and restores target on destroy', () => {
    const { lib, document } = load('chilldrawer');
    document.body.innerHTML = '<button id="t" data-chill-drawer="#p" data-side="bottom">open</button><div id="wrap"><div id="p">panel</div></div>';
    const h = lib.init('[data-chill-drawer]', { title: 'T' });
    document.getElementById('t').click();
    const root = document.querySelector('.chilldrawer');
    assert.ok(root.classList.contains('chilldrawer-bottom'));
    assert.ok(root.contains(document.getElementById('p')));
    h.destroy();
    assert.equal(document.querySelector('.chilldrawer'), null);
    assert.equal(document.getElementById('p').parentNode.id, 'wrap');
});

test('chilldrawer CSS supports data-theme dark and reduced motion', () => {
    const { lib, document } = load('chilldrawer');
    lib.injectCSS();
    const css = document.getElementById('chilldrawer-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /prefers-reduced-motion/);
    lib.injectCSS();
    assert.equal(document.querySelectorAll('#chilldrawer-styles').length, 1);
});

test('chilldrawer.open one-shot auto destroys', async () => {
    const { lib, document } = load('chilldrawer');
    const d = lib.open({ content: 'x' });
    assert.ok(document.querySelector('.chilldrawer'));
    d.close();
    await new Promise(r => setTimeout(r, 300));
    assert.equal(document.querySelector('.chilldrawer'), null);
    assert.equal(d.destroyed, true);
});
