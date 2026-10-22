const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(platform) {
    const ctx = load('chillhotkey');
    if (platform) Object.defineProperty(ctx.window.navigator, 'platform', { value: platform, configurable: true });
    return ctx;
}
function press(window, target, key, init) {
    const e = new window.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, init));
    target.dispatchEvent(e);
    return e;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

test('SSR import safe; parse works without navigator', () => {
    const lib = loadSSR('chillhotkey');
    const p = lib.parseShortcut('mod+k');
    assert.equal(p.key, 'k'); assert.equal(p.mods.ctrl, true); assert.equal(p.mods.meta, false);
});

test('no document listener at load time; attached lazily and removed when empty', () => {
    const ctx = load('chillhotkey');
    const { window, document, lib } = ctx;
    let adds = 0, removes = 0;
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { if (t === 'keydown') adds++; return a(t, f, o); };
    document.removeEventListener = (t, f, o) => { if (t === 'keydown') removes++; return r(t, f, o); };
    assert.equal(adds, 0);
    const off1 = lib.register('a', () => {});
    const off2 = lib.register('b', () => {});
    assert.equal(adds, 1);
    off1(); assert.equal(removes, 0);
    off2(); assert.equal(removes, 1);
    lib.register('c', () => {}); lib.unregisterAll();
    assert.equal(removes, 2);
});

test('mod = Ctrl on non-Apple, Cmd on Mac', () => {
    const win = setup('Win32');
    let hit = 0;
    win.lib.register('mod+k', () => hit++);
    press(win.window, win.document.body, 'k', { metaKey: true });
    assert.equal(hit, 0);
    press(win.window, win.document.body, 'k', { ctrlKey: true });
    assert.equal(hit, 1);
    win.lib.unregisterAll();

    const mac = setup('MacIntel');
    assert.equal(mac.lib.isMac(), true);
    let hit2 = 0;
    mac.lib.register('mod+k', () => hit2++);
    press(mac.window, mac.document.body, 'k', { ctrlKey: true });
    assert.equal(hit2, 0);
    press(mac.window, mac.document.body, 'K', { metaKey: true }); // uppercase e.key (caps lock) still matches
    assert.equal(hit2, 1);
    mac.lib.unregisterAll();
});

test('modifiers must match exactly', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register('ctrl+s', () => n++);
    press(window, document.body, 's', { ctrlKey: true, shiftKey: true });
    press(window, document.body, 's', { ctrlKey: true, altKey: true });
    press(window, document.body, 's');
    assert.equal(n, 0);
    press(window, document.body, 's', { ctrlKey: true });
    assert.equal(n, 1);
    lib.unregisterAll();
});

test('aliases: esc, enter, arrows, space, cmd/option; symbol keys ignore shift', () => {
    const { lib, window, document } = setup();
    const got = [];
    lib.register('esc', () => got.push('esc'));
    lib.register('up', () => got.push('up'));
    lib.register('space', () => got.push('space'));
    lib.register('alt+enter', () => got.push('alt+enter'));
    lib.register('?', () => got.push('?'));
    lib.register('shift+/', () => got.push('slash'));
    press(window, document.body, 'Escape');
    press(window, document.body, 'ArrowUp');
    press(window, document.body, ' ');
    press(window, document.body, 'Enter', { altKey: true });
    press(window, document.body, '?', { shiftKey: true });
    assert.equal(got.join(), 'esc,up,space,alt+enter,?');
    lib.unregisterAll();
});

test('Mac Option+letter falls back to physical key code', () => {
    const { lib, window, document } = setup();
    let n = 0;
    lib.register('alt+k', () => n++);
    press(window, document.body, '˚', { altKey: true, code: 'KeyK' });
    assert.equal(n, 1);
    lib.unregisterAll();
});

test('input-field suppression: plain shortcuts ignored while typing, mod shortcuts and allowInInput fire', () => {
    const { lib, window, document } = setup('Win32');
    document.body.innerHTML = '<input id="i"><textarea id="t"></textarea><div id="c" contenteditable="true"></div><input id="cb" type="checkbox"><button id="b"></button>';
    const hits = [];
    lib.register('g', () => hits.push('g'));
    lib.register('mod+k', () => hits.push('mod+k'));
    lib.register('esc', () => hits.push('esc'), { allowInInput: true });
    const i = document.getElementById('i'), t = document.getElementById('t'), cb = document.getElementById('cb'), b = document.getElementById('b');
    const c = document.getElementById('c');
    Object.defineProperty(c, 'isContentEditable', { value: true }); // jsdom does not implement it
    press(window, i, 'g'); press(window, t, 'g'); press(window, c, 'g');
    assert.equal(hits.length, 0);
    press(window, i, 'k', { ctrlKey: true });
    press(window, i, 'Escape');
    assert.equal(hits.join(), 'mod+k,esc');
    press(window, cb, 'g'); press(window, b, 'g'); // non-text controls do not suppress
    assert.equal(hits.length, 4);
    lib.unregisterAll();
});

test('preventDefault default true and can be disabled; stopPropagation option', () => {
    const { lib, window, document } = setup();
    lib.register('x', () => {});
    lib.register('y', () => {}, { preventDefault: false });
    assert.equal(press(window, document.body, 'x').defaultPrevented, true);
    assert.equal(press(window, document.body, 'y').defaultPrevented, false);
    let bubbled = 0;
    document.body.addEventListener('keydown', () => bubbled++);
    lib.register('z', () => {}, { stopPropagation: true });
    press(window, document.body, 'z');
    document.addEventListener('keydown', () => bubbled++);
    lib.unregisterAll();
});

test('multiple handlers per shortcut; unsubscribe removes only its own; unregister removes all', () => {
    const { lib, window, document } = setup();
    const log = [];
    const off = lib.register('m', () => log.push(1));
    lib.register('m', () => log.push(2));
    press(window, document.body, 'm');
    assert.equal(log.join(), '1,2');
    off();
    press(window, document.body, 'm');
    assert.equal(log.join(), '1,2,2');
    lib.unregister('m');
    press(window, document.body, 'm');
    assert.equal(log.length, 3);
    assert.equal(lib.getAll().length, 0);
});

test('auto-repeat ignored unless allowRepeat; IME composition ignored', () => {
    const { lib, window, document } = setup();
    let a = 0, b = 0;
    lib.register('r', () => a++);
    lib.register('s', () => b++, { allowRepeat: true });
    press(window, document.body, 'r', { repeat: true }); press(window, document.body, 's', { repeat: true });
    press(window, document.body, 'r', { isComposing: true });
    assert.equal(a, 0); assert.equal(b, 1);
    lib.unregisterAll();
});

test('key sequences with timeout', async () => {
    const { lib, window, document } = setup();
    const hub = lib.create({ sequenceTimeout: 60 });
    let n = 0;
    hub.register('g i', () => n++);
    press(window, document.body, 'g'); press(window, document.body, 'i');
    assert.equal(n, 1);
    press(window, document.body, 'i'); // buffer was reset
    assert.equal(n, 1);
    press(window, document.body, 'g'); await wait(100); press(window, document.body, 'i');
    assert.equal(n, 1);
    press(window, document.body, 'x'); press(window, document.body, 'g'); press(window, document.body, 'i');
    assert.equal(n, 2);
    hub.destroy();
    press(window, document.body, 'g'); press(window, document.body, 'i');
    assert.equal(n, 2);
});

test('scoped hub on an element, pause/resume, errors isolated, validation', () => {
    const { lib, window, document } = setup();
    document.body.innerHTML = '<div id="p"><span id="in"></span></div>';
    const p = document.getElementById('p');
    const hub = lib.create({ target: p });
    let n = 0;
    hub.register('a', () => { throw new Error('boom'); });
    hub.register('a', () => n++);
    press(window, document.getElementById('in'), 'a');
    assert.equal(n, 1);
    press(window, document.body, 'a');
    assert.equal(n, 1);
    hub.pause(); press(window, document.getElementById('in'), 'a'); assert.equal(n, 1);
    hub.resume(); press(window, document.getElementById('in'), 'a'); assert.equal(n, 2);
    assert.throws(() => hub.register('a', 'nope'), { name: 'TypeError' });
    assert.throws(() => hub.register('ctrl+', () => {}), /invalid/);
    hub.destroy();
});

test('isPressed, parseShortcut shapes, getAll(withInfo)', () => {
    const { lib, window, document } = setup('Win32');
    const e = press(window, document.body, 'k', { ctrlKey: true, shiftKey: true });
    assert.equal(lib.isPressed('ctrl+shift+k', e), true);
    assert.equal(lib.isPressed('mod+k', e), false);
    assert.equal(lib.parseShortcut('Cmd+Alt+P').mods.meta, true);
    assert.equal(lib.parseShortcut('ctrl++').key, '+');
    assert.equal(lib.parseShortcut('g i').sequence.length, 2);
    lib.register('mod+/', () => {}, { description: 'Help' });
    assert.equal(lib.getAll(true)[0].description, 'Help');
    lib.unregisterAll();
});
