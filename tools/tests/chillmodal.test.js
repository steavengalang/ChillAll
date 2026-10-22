'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const key = (window, k, extra) => new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra));
const XSS = '<img src=x onerror="window.__pwned=1">';

test('chillmodal loads on the server without touching window/document', () => {
    const lib = loadSSR('chillmodal');
    assert.equal(lib.version, '1.1.0');
    const inst = lib.open({ title: 'x' }); // must not throw on the server
    assert.equal(inst.isOpen, false);
});

test('chillmodal css: data-theme dark, .dark, scheme query, reduced motion, focus ring, z-index 10000', () => {
    const { lib, document } = load('chillmodal');
    lib.injectCSS();
    const css = document.getElementById('chillmodal-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /z-index: 10000/);
    lib.injectCSS();
    assert.equal(document.querySelectorAll('#chillmodal-styles').length, 1);
});

test('chillmodal renders title, button text, text option and ariaLabel without XSS', () => {
    const { lib, document, window } = load('chillmodal');
    const m = lib.open({ title: XSS, text: XSS, buttons: [{ text: XSS, type: 'primary" onclick="x' }] });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillmodal-title').textContent, XSS);
    assert.equal(document.querySelector('.chillmodal-body').textContent, XSS);
    assert.equal(document.querySelector('.chillmodal-btn').textContent, XSS);
    assert.equal(document.querySelector('.chillmodal-btn').getAttribute('onclick'), null);
    m.setText(XSS);
    assert.equal(document.querySelector('img'), null);
    m.destroy();
    const m2 = lib.open({ content: XSS, html: false });
    assert.equal(document.querySelector('img'), null);
    m2.destroy();
    assert.equal(window.__pwned, undefined);
});

test('chillmodal content string stays HTML by default (back-compat) and Nodes are accepted', () => {
    const { lib, document } = load('chillmodal');
    const m = lib.open({ content: '<p id="p1">hi</p>' });
    assert.ok(document.getElementById('p1'));
    const el = document.createElement('span');
    el.id = 'node1';
    m.setContent(el);
    assert.ok(document.getElementById('node1'));
    assert.equal(document.getElementById('p1'), null);
    m.destroy();
});

test('chillmodal dialog semantics: role, aria-modal, labelledby, sizes, fullscreen', () => {
    const { lib, document } = load('chillmodal');
    const m = lib.open({ title: 'Hello', size: 'xl' });
    const dlg = document.querySelector('[role="dialog"]');
    assert.equal(dlg.getAttribute('aria-modal'), 'true');
    assert.equal(document.getElementById(dlg.getAttribute('aria-labelledby')).textContent, 'Hello');
    assert.ok(dlg.classList.contains('size-xl'));
    m.destroy();
    const m2 = lib.open({ size: 'bogus', fullscreen: true, ariaLabel: 'Gallery' });
    const d2 = document.querySelector('[role="dialog"]');
    assert.ok(d2.classList.contains('size-md'), 'invalid size falls back');
    assert.ok(d2.classList.contains('chillmodal-fullscreen'));
    assert.equal(d2.getAttribute('aria-label'), 'Gallery');
    m2.destroy();
    const m3 = lib.open({ title: 't', scrollable: false });
    assert.ok(document.querySelector('.chillmodal-overlay-scroll'));
    m3.destroy();
});

test('chillmodal moves focus in, traps Tab, and returns focus on close', async () => {
    const { lib, document, window } = load('chillmodal');
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const m = lib.open({
        title: 'Form', content: '<input id="a"><input id="b">',
        buttons: [{ text: 'OK', type: 'primary' }]
    });
    const a = document.getElementById('a'), b = document.getElementById('b');
    assert.equal(document.activeElement, a, 'first body field focused');
    const ok = document.querySelector('.chillmodal-btn');
    ok.focus();
    ok.dispatchEvent(key(window, 'Tab')); // last -> first (close button)
    assert.equal(document.activeElement, document.querySelector('.chillmodal-close'));
    document.activeElement.dispatchEvent(key(window, 'Tab', { shiftKey: true }));
    assert.equal(document.activeElement, ok);
    trigger.focus();                      // focus escaped
    trigger.dispatchEvent(key(window, 'Tab'));
    assert.ok(m.modal.contains(document.activeElement));
    void b;
    await m.close();
    assert.equal(document.activeElement, trigger);
    assert.equal(document.querySelector('.chillmodal-overlay'), null);
});

test('chillmodal initialFocus selector is honoured', () => {
    const { lib, document } = load('chillmodal');
    const m = lib.open({ title: 't', content: '<input id="a"><input id="b">', initialFocus: '#b' });
    assert.equal(document.activeElement, document.getElementById('b'));
    m.destroy();
});

test('chillmodal stacking: z-index increments, only top handles Esc, scroll lock is ref-counted', async () => {
    const { lib, document, window } = load('chillmodal');
    const closed = [];
    const m1 = lib.open({ title: 'one', onClose: () => closed.push(1) });
    const m2 = lib.open({ title: 'two', onClose: () => closed.push(2) });
    assert.equal(m1.overlay.style.zIndex, '10000');
    assert.ok(Number(m2.overlay.style.zIndex) > Number(m1.overlay.style.zIndex));
    assert.equal(document.body.style.overflow, 'hidden');

    document.dispatchEvent(key(window, 'Escape'));
    await sleep(200);
    assert.deepEqual(closed, [2]);
    assert.equal(m1.isOpen, true);
    assert.equal(document.body.style.overflow, 'hidden', 'still locked while one modal remains');

    document.dispatchEvent(key(window, 'Escape'));
    await sleep(200);
    assert.deepEqual(closed, [2, 1]);
    assert.equal(document.body.style.overflow, '');
});

test('chillmodal restores a pre-existing body overflow value', async () => {
    const { lib, document } = load('chillmodal');
    document.body.style.overflow = 'scroll';
    const m = lib.open({ title: 'x' });
    assert.equal(document.body.style.overflow, 'hidden');
    await m.close();
    assert.equal(document.body.style.overflow, 'scroll');
});

test('chillmodal closable:false ignores Esc, overlay and hides the close button; onBeforeClose can veto', async () => {
    const { lib, document, window } = load('chillmodal');
    const m = lib.open({ title: 'locked', closable: false });
    assert.equal(document.querySelector('.chillmodal-close'), null);
    document.dispatchEvent(key(window, 'Escape'));
    m.overlay.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    m.overlay.click();
    await sleep(200);
    assert.equal(m.isOpen, true);
    m.destroy();

    let veto = true;
    const v = lib.open({ title: 'v', onBeforeClose: () => !veto ? true : false });
    await v.close();
    assert.equal(v.isOpen, true);
    veto = false;
    await v.close();
    assert.equal(v.isOpen, false);
});

test('chillmodal overlay click closes only when the press started on the overlay', async () => {
    const { lib, window } = load('chillmodal');
    const m = lib.open({ title: 'x' });
    m.overlay.click(); // no mousedown on overlay (e.g. text-selection drag ended there)
    await sleep(200);
    assert.equal(m.isOpen, true);
    m.overlay.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    m.overlay.click();
    await sleep(200);
    assert.equal(m.isOpen, false);
});

test('chillmodal close is idempotent: onClose fires once, events work', async () => {
    const { lib } = load('chillmodal');
    let closes = 0, opens = 0, evClose = 0;
    const m = lib.open({ title: 'x', onClose: () => closes++, onOpen: () => opens++ });
    m.on('close', () => evClose++);
    await Promise.all([m.close(), m.close()]);
    await m.close();
    assert.equal(opens, 1);
    assert.equal(closes, 1);
    assert.equal(evClose, 1);
});

test('chillmodal destroy removes DOM, document listeners, timers and the scroll lock', async () => {
    const { lib, document, window } = load('chillmodal');
    let added = 0, removed = 0;
    const add = document.addEventListener.bind(document), rem = document.removeEventListener.bind(document);
    document.addEventListener = (...a) => { if (a[0] === 'keydown') added++; return add(...a); };
    document.removeEventListener = (...a) => { if (a[0] === 'keydown') removed++; return rem(...a); };
    const m = lib.open({ title: 'x', buttons: [{ text: 'a' }] });
    assert.equal(added, 1);
    m.destroy();
    assert.equal(removed, 1);
    assert.equal(document.querySelector('.chillmodal-overlay'), null);
    assert.equal(document.body.style.overflow, '');
    assert.equal(window.__chillmodal_scroll_lock__.count, 0);
    m.destroy(); // safe twice
    const m2 = lib.open({ title: 'y' });
    m2.close();
    m2.destroy(); // destroy during the closing animation
    assert.equal(document.querySelector('.chillmodal-overlay'), null);
    assert.equal(added, removed);
});

test('chillmodal buttons call onClick(modal); alert and confirm return promises', async () => {
    const { lib, document } = load('chillmodal');
    let got = null;
    const m = lib.open({ title: 'b', buttons: [{ text: 'Go', onClick: (inst) => { got = inst; inst.close(); } }] });
    document.querySelector('.chillmodal-btn').click();
    assert.equal(got, m);
    await sleep(200);

    const a = lib.alert({ title: 'Info', message: XSS, buttonText: 'Got it' });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillmodal-btn').textContent, 'Got it');
    document.querySelector('.chillmodal-btn').click();
    assert.equal(await a, undefined);

    await sleep(200);
    const c = lib.confirm({ title: 'Del?', type: 'danger', confirmText: 'Delete' });
    const btns = document.querySelectorAll('.chillmodal-btn');
    assert.ok(btns[1].classList.contains('danger'));
    assert.equal(document.activeElement, btns[1]);
    btns[1].click();
    assert.equal(await c, true);

    await sleep(200);
    const c2 = lib.confirm({ title: 'x' });
    document.querySelectorAll('.chillmodal-btn')[0].click();
    assert.equal(await c2, false);
});

test('chillmodal closeAll closes every modal', async () => {
    const { lib, document } = load('chillmodal');
    lib.open({ title: 'a' });
    lib.open({ title: 'b' });
    lib.closeAll();
    await sleep(200);
    assert.equal(document.querySelector('.chillmodal-overlay'), null);
    assert.equal(document.body.style.overflow, '');
});
