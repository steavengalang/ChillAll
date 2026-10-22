'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const key = (window, k, extra) => new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra));
const XSS = '<img src=x onerror="window.__pwned=1">';

test('chillalert loads on the server and degrades gracefully', async () => {
    const lib = loadSSR('chillalert');
    assert.equal(typeof lib, 'object');
    assert.equal(lib.version, '1.2.0');
    assert.equal(await lib.alert({ title: 'x' }), undefined);
    assert.equal(await lib.confirm({ title: 'x' }), false);
    assert.equal(await lib.prompt({ title: 'x' }), null);
    assert.equal(typeof lib.toast({ text: 'x' }).remove, 'function');
    assert.equal(typeof lib.loading().close, 'function');
    lib.closeAll();
});

test('chillalert exposes window.ChillAlert in script mode and module.exports in cjs mode', () => {
    const g = load('chillalert', 'global');
    assert.equal(g.window.ChillAlert, g.lib);
    assert.equal(g.lib.version, '1.2.0');
    assert.equal(typeof load('chillalert').lib.alert, 'function');
});

test('chillalert css has data-theme dark, .dark, scheme media query and reduced motion', () => {
    const { lib, document } = load('chillalert');
    lib.injectCSS();
    const css = document.getElementById('chillalert-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /prefers-color-scheme: dark/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /top-center/);
    assert.equal(document.querySelectorAll('#chillalert-styles').length, 1);
});

test('chillalert renders title/text/placeholder as text (no XSS)', async () => {
    const { lib, document, window } = load('chillalert');
    lib.alert({ title: XSS, text: XSS });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillalert-title').textContent, XSS);
    assert.equal(document.querySelector('.chillalert-text').textContent, XSS);
    lib.closeAll();
    lib.prompt({ title: XSS, text: XSS, placeholder: XSS, defaultValue: XSS });
    assert.equal(document.querySelector('img'), null);
    lib.closeAll();
    lib.toast({ text: XSS, type: 'success"><img src=x>' });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillalert-toast-text').textContent, XSS);
    assert.equal(window.__pwned, undefined);
});

test('chillalert html option is an explicit opt-in', () => {
    const { lib, document } = load('chillalert');
    lib.alert({ html: '<b id="bold">hi</b>' });
    assert.ok(document.getElementById('bold'));
    lib.closeAll();
});

test('chillalert dialog has alertdialog semantics and an unbreakable icon name', () => {
    const { lib, document } = load('chillalert');
    lib.alert({ title: 'Title', text: 'Body', icon: 'bad icon name' }); // invalid icon must not throw
    const modal = document.querySelector('.chillalert-modal');
    assert.equal(modal.getAttribute('role'), 'alertdialog');
    assert.equal(modal.getAttribute('aria-modal'), 'true');
    assert.equal(document.getElementById(modal.getAttribute('aria-labelledby')).textContent, 'Title');
    assert.equal(document.getElementById(modal.getAttribute('aria-describedby')).textContent, 'Body');
    assert.ok(modal.querySelector('.chillalert-icon-info'));
    lib.closeAll();
});

test('chillalert confirm moves focus in, resolves true and returns focus', async () => {
    const { lib, document, window } = load('chillalert');
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const p = lib.confirm({ title: 'Sure?' });
    const modal = document.querySelector('.chillalert-modal');
    assert.ok(modal.contains(document.activeElement), 'focus moved into dialog');
    assert.equal(document.activeElement.textContent, 'Confirm');
    [...modal.querySelectorAll('button')].find(b => b.textContent === 'Confirm').click();
    assert.equal(await p, true);
    assert.equal(document.activeElement, trigger, 'focus returned to trigger');
    await sleep(220);
    assert.equal(document.querySelector('.chillalert-overlay'), null);
    void window;
});

test('chillalert Escape resolves alert and confirm(false); overlay click dismisses', async () => {
    const { lib, document, window } = load('chillalert');
    const a = lib.alert({ title: 'a' });
    document.dispatchEvent(key(window, 'Escape'));
    assert.equal(await a, undefined);

    const c = lib.confirm({ title: 'c' });
    document.dispatchEvent(key(window, 'Escape'));
    assert.equal(await c, false);

    const c2 = lib.confirm({ title: 'c2' });
    const overlay = document.querySelector('.chillalert-overlay:not(.chillalert-closing)');
    overlay.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    overlay.click();
    assert.equal(await c2, false);

    const locked = lib.alert({ title: 'locked', allowEscapeKey: false, allowOutsideClick: false });
    document.dispatchEvent(key(window, 'Escape'));
    const ov = document.querySelector('.chillalert-overlay:not(.chillalert-closing)');
    ov.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    ov.click();
    await sleep(220);
    assert.ok(document.querySelector('.chillalert-overlay'), 'still open');
    lib.closeAll();
    await locked;
});

test('chillalert traps Tab inside the dialog', () => {
    const { lib, document, window } = load('chillalert');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    lib.confirm({ title: 'trap' });
    const [cancel, confirm] = document.querySelectorAll('.chillalert-button');
    assert.equal(document.activeElement, confirm);
    document.activeElement.dispatchEvent(key(window, 'Tab'));          // last -> first
    assert.equal(document.activeElement, cancel);
    document.activeElement.dispatchEvent(key(window, 'Tab', { shiftKey: true })); // first -> last
    assert.equal(document.activeElement, confirm);
    outside.focus();                                                     // focus escaped
    outside.dispatchEvent(key(window, 'Tab'));
    assert.ok(document.querySelector('.chillalert-modal').contains(document.activeElement));
    lib.closeAll();
});

test('chillalert Enter on the focused Cancel button does not confirm', async () => {
    const { lib, document, window } = load('chillalert');
    let settled = null;
    lib.confirm({ title: 'x' }).then(v => { settled = v; });
    const cancel = document.querySelector('.chillalert-button-secondary');
    cancel.focus();
    cancel.dispatchEvent(key(window, 'Enter'));
    await sleep(10);
    assert.equal(settled, null);
    lib.closeAll();
    await sleep(10);
    assert.equal(settled, false);
});

test('chillalert stacked dialogs: only the top one handles Escape', async () => {
    const { lib, document, window } = load('chillalert');
    let first = 'open', second = 'open';
    lib.alert({ title: 'one' }).then(() => { first = 'closed'; });
    lib.alert({ title: 'two' }).then(() => { second = 'closed'; });
    const overlays = document.querySelectorAll('.chillalert-overlay');
    assert.ok(Number(overlays[1].style.zIndex) > Number(overlays[0].style.zIndex));
    document.dispatchEvent(key(window, 'Escape'));
    await sleep(10);
    assert.equal(second, 'closed');
    assert.equal(first, 'open');
    document.dispatchEvent(key(window, 'Escape'));
    await sleep(10);
    assert.equal(first, 'closed');
});

test('chillalert prompt trims, Enter submits, cancel gives null', async () => {
    const { lib, document, window } = load('chillalert');
    const p = lib.prompt({ title: 'Name', inputType: 'password' });
    const input = document.querySelector('.chillalert-input');
    assert.equal(document.activeElement, input);
    assert.equal(input.type, 'password');
    input.value = '  Jane  ';
    input.dispatchEvent(key(window, 'Enter'));
    assert.equal(await p, 'Jane');

    const p2 = lib.prompt({ title: 'Name' });
    document.dispatchEvent(key(window, 'Escape'));
    assert.equal(await p2, null);
});

test('chillalert leaves no document listeners or DOM behind', async () => {
    const { lib, document, window } = load('chillalert');
    let added = 0, removed = 0;
    const add = document.addEventListener.bind(document), rem = document.removeEventListener.bind(document);
    document.addEventListener = (...a) => { if (a[0] === 'keydown') added++; return add(...a); };
    document.removeEventListener = (...a) => { if (a[0] === 'keydown') removed++; return rem(...a); };
    await Promise.all([
        (async () => { const p = lib.alert({ title: 'a' }); document.querySelector('.chillalert-button').click(); await p; })(),
    ]);
    const p = lib.confirm({ title: 'b' });
    document.dispatchEvent(key(window, 'Escape'));
    await p;
    const l = lib.loading({ text: 'wait' });
    await l.close();
    await l.close(); // idempotent
    assert.ok(added >= 3);
    assert.equal(added, removed);
    await sleep(220);
    assert.equal(document.querySelector('.chillalert-overlay'), null);
});

test('chillalert loading cannot be dismissed with Escape and is announced busy', async () => {
    const { lib, document, window } = load('chillalert');
    const l = lib.loading({ text: 'Saving' });
    const modal = document.querySelector('.chillalert-modal');
    assert.equal(modal.getAttribute('aria-busy'), 'true');
    assert.equal(modal.getAttribute('aria-label'), 'Saving');
    assert.equal(document.activeElement, modal);
    document.dispatchEvent(key(window, 'Escape'));
    await sleep(220);
    assert.ok(document.querySelector('.chillalert-overlay'));
    await l.close();
    await sleep(220);
    assert.equal(document.querySelector('.chillalert-overlay'), null);
});

test('chillalert toast: positions, roles, pause on hover, closeAll', async () => {
    const { lib, document, window } = load('chillalert');
    const t = lib.toast({ text: 'hi', position: 'bottom-center', duration: 120 });
    const container = document.querySelector('.chillalert-toast-container');
    assert.ok(container.classList.contains('chillalert-bottom-center'));
    assert.equal(container.getAttribute('aria-live'), 'polite');
    assert.equal(t.toast.getAttribute('role'), 'status');
    assert.equal(lib.toast({ text: 'e', type: 'error', position: 'nonsense', duration: 0 }).toast.getAttribute('role'), 'alert');
    assert.ok(document.querySelector('.chillalert-toast-container.chillalert-top-right'), 'invalid position falls back');

    t.toast.dispatchEvent(new window.MouseEvent('mouseenter'));
    await sleep(300);
    assert.ok(t.toast.isConnected, 'paused while hovered');
    t.toast.dispatchEvent(new window.MouseEvent('mouseleave'));
    await sleep(400);
    assert.equal(t.toast.isConnected, false);
    assert.equal(document.querySelector('.chillalert-bottom-center'), null, 'empty container removed');

    lib.closeAll();
    await sleep(10);
    assert.equal(document.querySelector('.chillalert-toast'), null);
    assert.equal(document.querySelector('.chillalert-toast-container'), null);
});

test('chillalert manual toast remove is idempotent and clears its timer', async () => {
    const { lib, document } = load('chillalert');
    const t = lib.toast({ text: 'x', duration: 50 });
    t.remove();
    t.remove();
    await sleep(250);
    assert.equal(document.querySelector('.chillalert-toast'), null);
});
