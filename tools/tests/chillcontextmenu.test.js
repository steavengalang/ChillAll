const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function setup(opts) {
    const env = load('chillcontextmenu');
    const { document, window, lib } = env;
    document.body.innerHTML = '<div id="t" tabindex="0">target</div>';
    const clicks = [];
    const menu = lib.attach('#t', Object.assign({
        items: [
            { label: 'Copy', shortcut: 'Ctrl+C', icon: 'C', onClick: () => clicks.push('copy') },
            { type: 'separator' },
            { label: 'Disabled', disabled: true, onClick: () => clicks.push('dis') },
            { label: 'Share', items: [{ label: 'Email', onClick: () => clicks.push('email') }, { label: 'Link' }] },
            { label: 'Pinned', checked: true },
            { label: 'Delete', danger: true, onClick: () => clicks.push('del') }
        ]
    }, opts));
    const ctx = (x = 50, y = 60) => document.getElementById('t').dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    const key = (k, extra) => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));
    return Object.assign(env, { menu, clicks, ctx, key });
}

test('chillcontextmenu is SSR safe', () => {
    const lib = loadSSR('chillcontextmenu');
    assert.ok(lib.version);
});

test('right click opens role=menu with items, prevents default, closes on outside click and destroy', () => {
    const { document, window, menu, ctx } = setup();
    const ev = new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    document.getElementById('t').dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    const m = document.querySelector('[role="menu"]');
    assert.ok(m);
    assert.equal(m.querySelectorAll('[role="menuitem"]').length, 4);
    assert.equal(m.querySelectorAll('[role="menuitemcheckbox"][aria-checked="true"]').length, 1);
    assert.equal(m.querySelectorAll('[role="separator"]').length, 1);
    assert.equal(m.querySelector('[aria-disabled="true"]').textContent, 'Disabled');
    document.body.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    assert.equal(document.querySelector('[role="menu"]'), null);
    ctx();
    assert.ok(document.querySelector('[role="menu"]'));
    menu.destroy();
    assert.equal(document.querySelector('[role="menu"]'), null);
    // listeners removed: no more menu
    ctx();
    assert.equal(document.querySelector('[role="menu"]'), null);
});

test('chillcontextmenu clicking an item runs handler, onSelect and closes; disabled does nothing', () => {
    const selected = [];
    const { document, clicks, ctx } = setup({ onSelect: i => selected.push(i.label) });
    ctx();
    const items = document.querySelectorAll('.chillcontextmenu-item');
    items[1].click(); // disabled
    assert.deepEqual(clicks, []);
    assert.ok(document.querySelector('[role="menu"]'));
    items[0].click();
    assert.deepEqual(clicks, ['copy']);
    assert.deepEqual(selected, ['Copy']);
    assert.equal(document.querySelector('[role="menu"]'), null);
});

test('chillcontextmenu keyboard navigation, submenus and Escape', () => {
    const { document, clicks, ctx, key } = setup();
    ctx();
    assert.equal(document.activeElement.getAttribute('role'), 'menu');
    key('ArrowDown');
    assert.equal(document.activeElement.textContent.includes('Copy'), true);
    key('ArrowDown'); // skips disabled -> Share
    assert.equal(document.activeElement.textContent.includes('Share'), true);
    key('ArrowRight');
    assert.equal(document.querySelectorAll('[role="menu"]').length, 2);
    assert.equal(document.activeElement.textContent.includes('Email'), true);
    key('ArrowLeft');
    assert.equal(document.querySelectorAll('[role="menu"]').length, 1);
    assert.equal(document.activeElement.textContent.includes('Share'), true);
    key('ArrowRight');
    key('Enter');
    assert.deepEqual(clicks, ['email']);
    assert.equal(document.querySelector('[role="menu"]'), null);
    ctx();
    key('End');
    assert.equal(document.activeElement.textContent.includes('Delete'), true);
    key('ArrowDown'); // wraps
    assert.equal(document.activeElement.textContent.includes('Copy'), true);
    key('d'); // typeahead
    assert.equal(document.activeElement.textContent.includes('Delete'), true);
    key('Escape');
    assert.equal(document.querySelector('[role="menu"]'), null);
});

test('chillcontextmenu returns focus to previously focused element on close', () => {
    const { document, ctx, key } = setup();
    document.getElementById('t').focus();
    ctx();
    key('Escape');
    assert.equal(document.activeElement.id, 't');
});

test('chillcontextmenu labels are text, never HTML', () => {
    const bad = '<img src=x onerror=alert(1)>';
    const env = load('chillcontextmenu');
    env.document.body.innerHTML = '<div id="t"></div>';
    const m = env.lib.attach('#t', { items: [{ label: bad, shortcut: bad, icon: bad }] });
    env.document.getElementById('t').dispatchEvent(new env.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 }));
    assert.equal(env.document.querySelectorAll('img').length, 0);
    assert.ok(env.document.querySelector('.chillcontextmenu-label').textContent === bad);
    m.destroy();
});

test('chillcontextmenu long press opens menu, cancelled by move', async () => {
    const { document, window, menu } = setup({ longPressMs: 20 });
    const t = document.getElementById('t');
    const touch = (type, x, y) => { const e = new window.Event(type, { bubbles: true, cancelable: true }); e.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }]; t.dispatchEvent(e); };
    touch('touchstart', 5, 5);
    touch('touchmove', 100, 100);
    await new Promise(r => setTimeout(r, 40));
    assert.equal(document.querySelector('[role="menu"]'), null);
    touch('touchstart', 5, 5);
    await new Promise(r => setTimeout(r, 40));
    assert.ok(document.querySelector('[role="menu"]'));
    menu.destroy();
});

test('chillcontextmenu supports dynamic items function and programmatic open', () => {
    const env = load('chillcontextmenu');
    const m = env.lib.create({ items: () => [{ label: 'Dyn' }] });
    m.open(5, 5);
    assert.equal(env.document.querySelector('.chillcontextmenu-label').textContent, 'Dyn');
    m.close();
    assert.equal(env.document.querySelector('.chillcontextmenu'), null);
    m.destroy();
});

test('chillcontextmenu CSS has data-theme dark', () => {
    const { lib, document } = load('chillcontextmenu');
    lib.injectCSS();
    assert.match(document.getElementById('chillcontextmenu-styles').textContent, /:root\[data-theme="dark"\]/);
});
