'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const XSS = '<img src=x onerror="window.__pwned=1">';

test('chillnotify loads on the server and show() is a no-op returning an id', () => {
    const lib = loadSSR('chillnotify');
    assert.equal(lib.version, '1.1.0');
    assert.equal(typeof lib.success({ message: 'x' }), 'number');
    lib.closeAll();
    lib.destroy();
});

test('chillnotify css: data-theme dark, .dark, scheme query, reduced motion, focus ring, z-index 10002', () => {
    const { lib, document } = load('chillnotify');
    lib.injectCSS();
    lib.injectCSS();
    assert.equal(document.querySelectorAll('#chillnotify-styles').length, 1);
    const css = document.getElementById('chillnotify-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /z-index: 10002/);
});

test('chillnotify renders title/message/actions as text (no XSS); html is an explicit opt-in', () => {
    const { lib, document, window } = load('chillnotify');
    lib.show({ title: XSS, message: XSS, type: 'success"><img src=x>', position: 'x"><img src=x>', actions: [{ text: XSS }] });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillnotify-title').textContent, XSS);
    assert.equal(document.querySelector('.chillnotify-message').textContent, XSS);
    assert.equal(document.querySelector('.chillnotify-action').textContent, XSS);
    assert.ok(document.querySelector('.chillnotify-container.top-right'), 'invalid position falls back');
    lib.destroy();
    lib.show({ message: '<b id="b">bold</b>', html: true });
    assert.ok(document.getElementById('b'));
    assert.equal(window.__pwned, undefined);
    lib.destroy();
});

test('chillnotify positions create matching containers with aria-live', () => {
    const { lib, document } = load('chillnotify');
    lib.configure({ maxVisible: 10 });
    for (const p of ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center']) {
        lib.show({ message: p, position: p, duration: 0 });
        const c = document.querySelector('.chillnotify-container.' + p);
        assert.ok(c, p);
        assert.equal(c.getAttribute('aria-live'), 'polite');
    }
    lib.destroy();
});

test('chillnotify roles: error is alert, others are status; close button is labelled', () => {
    const { lib, document } = load('chillnotify');
    lib.error({ message: 'e', duration: 0 });
    lib.info({ message: 'i', duration: 0 });
    const [e, i] = document.querySelectorAll('.chillnotify');
    assert.equal(e.getAttribute('role'), 'alert');
    assert.equal(i.getAttribute('role'), 'status');
    assert.equal(e.querySelector('.chillnotify-close').getAttribute('aria-label'), 'Dismiss notification');
    assert.equal(e.querySelector('.chillnotify-close').type, 'button');
    lib.destroy();
});

test('chillnotify progress bar only for timed notifications with showProgress', () => {
    const { lib, document } = load('chillnotify');
    lib.show({ message: 'a', duration: 1000 });
    lib.show({ message: 'b', duration: 0 });
    lib.show({ message: 'c', duration: 1000, showProgress: false });
    const els = document.querySelectorAll('.chillnotify');
    assert.ok(els[0].querySelector('.chillnotify-progress-bar'));
    assert.equal(els[1].querySelector('.chillnotify-progress-bar'), null);
    assert.equal(els[2].querySelector('.chillnotify-progress-bar'), null);
    lib.destroy();
});

test('chillnotify auto closes after duration and removes empty container', async () => {
    const { lib, document } = load('chillnotify');
    let reason = null;
    lib.show({ message: 'x', duration: 60, onClose: (id, r) => { reason = r; } });
    assert.ok(document.querySelector('.chillnotify'));
    await sleep(350);
    assert.equal(reason, 'timeout');
    assert.equal(document.querySelector('.chillnotify'), null);
    assert.equal(document.querySelector('.chillnotify-container'), null);
});

test('chillnotify pauses on hover and on focus, resumes afterwards', async () => {
    const { lib, document, window } = load('chillnotify');
    lib.show({ message: 'x', duration: 150 });
    const el = document.querySelector('.chillnotify');
    el.dispatchEvent(new window.MouseEvent('mouseenter'));
    await sleep(400);
    assert.ok(el.isConnected, 'paused by hover');
    el.dispatchEvent(new window.MouseEvent('mouseleave'));
    await sleep(450);
    assert.equal(el.isConnected, false);

    lib.show({ message: 'y', duration: 150, actions: [{ text: 'go', close: false }] });
    const el2 = document.querySelector('.chillnotify');
    el2.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
    await sleep(400);
    assert.ok(el2.isConnected, 'paused by focus');
    el2.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true }));
    await sleep(450);
    assert.equal(el2.isConnected, false);
});

test('chillnotify pauseOnHover:false ignores hover', async () => {
    const { lib, document, window } = load('chillnotify');
    lib.show({ message: 'x', duration: 80, pauseOnHover: false });
    const el = document.querySelector('.chillnotify');
    el.dispatchEvent(new window.MouseEvent('mouseenter'));
    await sleep(400);
    assert.equal(el.isConnected, false);
});

test('chillnotify maxVisible queues the rest and shows them as slots free up', async () => {
    const { lib, document } = load('chillnotify');
    lib.configure({ maxVisible: 2 });
    const ids = [1, 2, 3, 4].map(n => lib.show({ message: 'n' + n, duration: 0 }));
    const texts = () => [...document.querySelectorAll('.chillnotify-message')].map(e => e.textContent);
    assert.deepEqual(texts(), ['n1', 'n2']);
    lib.close(ids[0]);
    assert.deepEqual(texts().filter(t => t !== 'n1'), ['n2', 'n3'], 'next one promoted immediately');
    await sleep(300);
    assert.deepEqual(texts(), ['n2', 'n3']);
    lib.close(ids[3]); // still queued: dropped without ever showing
    lib.close(ids[1]);
    await sleep(300);
    assert.deepEqual(texts(), ['n3']);
    lib.destroy();
    assert.equal(document.querySelector('.chillnotify'), null);
});

test('chillnotify closeAll clears the queue too; close is idempotent; onClose fires once', async () => {
    const { lib, document } = load('chillnotify');
    lib.configure({ maxVisible: 1 });
    let closes = 0;
    const id = lib.show({ message: 'a', duration: 0, onClose: () => closes++ });
    lib.show({ message: 'queued', duration: 0 });
    lib.close(id);
    lib.close(id);
    assert.equal(closes, 1);
    lib.closeAll();
    await sleep(300);
    assert.equal(document.querySelector('.chillnotify'), null);
    assert.equal(document.querySelector('.chillnotify-container'), null);
});

test('chillnotify action and close buttons work', async () => {
    const { lib, document } = load('chillnotify');
    let clicked = 0, stay = 0;
    lib.show({ message: 'x', duration: 0, actions: [{ text: 'Do', primary: true, onClick: () => clicked++ }, { text: 'Stay', close: false, onClick: () => stay++ }] });
    const [doIt, stayBtn] = document.querySelectorAll('.chillnotify-action');
    assert.ok(doIt.classList.contains('primary'));
    stayBtn.click();
    assert.equal(stay, 1);
    await sleep(250);
    assert.ok(document.querySelector('.chillnotify'), 'close:false keeps it');
    doIt.click();
    assert.equal(clicked, 1);
    await sleep(250);
    assert.equal(document.querySelector('.chillnotify'), null);

    lib.show({ message: 'y', duration: 0 });
    document.querySelector('.chillnotify-close').click();
    await sleep(250);
    assert.equal(document.querySelector('.chillnotify'), null);
});

test('chillnotify destroy removes DOM, timers and containers immediately', async () => {
    const { lib, document } = load('chillnotify');
    let closed = 0;
    lib.show({ message: 'a', duration: 100, onClose: () => closed++ });
    lib.show({ message: 'b', duration: 100, position: 'bottom-left' });
    lib.destroy();
    assert.equal(document.querySelector('.chillnotify'), null);
    assert.equal(document.querySelector('.chillnotify-container'), null);
    await sleep(300);
    assert.equal(closed, 0, 'timers were cleared (no late callbacks)');
    // library keeps working after destroy
    lib.show({ message: 'again', duration: 0 });
    assert.equal(document.querySelectorAll('.chillnotify').length, 1);
    lib.destroy();
});
