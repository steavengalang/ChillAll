const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

test('SSR import safe; format works without navigator', () => {
    const lib = loadSSR('chillkbd');
    assert.equal(lib.format('mod+k'), 'Ctrl+K');
});

test('parse aliases and trailing plus', () => {
    const { lib } = load('chillkbd');
    assert.equal(lib.parse('Ctrl+Shift+p').join(), 'ctrl,shift,P');
    assert.equal(lib.parse('cmd + option + K').join(), 'meta,alt,K');
    assert.equal(lib.parse('ctrl++').join(), 'ctrl,plus');
    assert.equal(lib.parse('g i').join(), 'G,I');
    assert.equal(lib.parse('f5').join(), 'F5');
    assert.equal(lib.parse('').length, 0);
});

test('format per platform', () => {
    const { lib } = load('chillkbd');
    assert.equal(lib.format('mod+shift+k', { platform: 'mac' }), '⌘⇧K');
    assert.equal(lib.format('mod+shift+k', { platform: 'other' }), 'Ctrl+Shift+K');
    assert.equal(lib.format('alt+enter', { platform: 'mac' }), '⌥↵');
    assert.equal(lib.format('alt+enter', { platform: 'other' }), 'Alt+Enter');
});

test('platform auto-detection via navigator.platform', () => {
    const { lib, window } = load('chillkbd');
    Object.defineProperty(window.navigator, 'platform', { value: 'MacIntel', configurable: true });
    assert.equal(lib.isMac(), true);
    assert.equal(lib.format('mod+k'), '⌘K');
    Object.defineProperty(window.navigator, 'platform', { value: 'Win32', configurable: true });
    assert.equal(lib.isMac(), false);
});

test('init enhances kbd and [data-chill-kbd], idempotent, destroy restores', () => {
    const { lib, document } = load('chillkbd');
    document.body.innerHTML = '<kbd id="a" data-chill-kbd="mod+k"></kbd><kbd id="b">Ctrl+Shift+P</kbd><span id="c" data-chill-kbd="esc"></span>';
    const inst = lib.init(null, { platform: 'other', size: 'sm' });
    const a = document.getElementById('a');
    assert.ok(a.classList.contains('chillkbd')); assert.ok(a.classList.contains('chillkbd-sm'));
    assert.equal(a.querySelectorAll('.chillkbd-key').length, 2);
    assert.equal(a.querySelector('.chillkbd-sep').getAttribute('aria-hidden'), 'true');
    assert.equal(document.getElementById('b').querySelectorAll('.chillkbd-key').length, 3);
    assert.equal(document.getElementById('c').querySelectorAll('.chillkbd-key').length, 1);
    // chips themselves not re-enhanced; second init is a no-op
    const html = document.body.innerHTML;
    const inst2 = lib.init(null, { platform: 'other', size: 'sm' });
    assert.equal(document.body.innerHTML, html);
    assert.equal(inst2.elements.length, 0);
    inst.destroy();
    assert.equal(document.getElementById('b').textContent, 'Ctrl+Shift+P');
    assert.equal(document.getElementById('b').getAttribute('class'), null);
    assert.equal(document.getElementById('a').hasAttribute('data-chillkbd-enhanced'), false);
});

test('mac render uses symbols with screen-reader names and no separators', () => {
    const { lib } = load('chillkbd');
    const el = lib.create('mod+shift+p', { platform: 'mac' });
    assert.equal(el.querySelectorAll('.chillkbd-sep').length, 0);
    const keys = Array.from(el.querySelectorAll('.chillkbd-key'));
    assert.equal(keys[0].textContent, '⌘Command');
    assert.equal(keys[0].querySelector('[aria-hidden="true"]').textContent, '⌘');
    assert.equal(keys[0].querySelector('.chillkbd-sr').textContent, 'Command');
});

test('user text is never interpreted as HTML', () => {
    const { lib, document } = load('chillkbd');
    const el = lib.create('<img src=x onerror=alert(1)>', { platform: 'other' });
    document.body.appendChild(el);
    assert.equal(document.querySelector('img'), null);
});

test('refresh re-renders and CSS injected once with dark overrides', () => {
    const { lib, document } = load('chillkbd');
    document.body.innerHTML = '<kbd data-chill-kbd="mod+k"></kbd>';
    const inst = lib.init(null, { platform: 'other' });
    inst.refresh();
    assert.equal(document.querySelectorAll('style#chillkbd-styles').length, 1);
    const css = document.getElementById('chillkbd-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
});
