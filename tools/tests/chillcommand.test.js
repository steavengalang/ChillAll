const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const CMDS = () => [
    { id: 'new', label: 'New file', group: 'File', shortcut: 'mod+n', keywords: ['create'] },
    { id: 'open', label: 'Open folder', group: 'File' },
    { id: 'theme', label: 'Toggle theme', icon: '\u{1F313}', keywords: 'dark light' },
    { id: 'disabled', label: 'Disabled thing', disabled: true },
    { id: 'git', label: 'Git: Fetch all remotes', group: 'Git' }
];
function setup(opts, platform) {
    const ctx = load('chillcommand');
    if (platform) Object.defineProperty(ctx.window.navigator, 'platform', { value: platform, configurable: true });
    const pal = ctx.lib.init(Object.assign({ commands: CMDS() }, opts));
    return Object.assign(ctx, { pal });
}
const key = (win, k, init, target) => { const e = new win.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, init)); (target || win.document.body).dispatchEvent(e); return e; };
const type = (win, pal, text) => { pal.input.value = text; pal.input.dispatchEvent(new win.Event('input', { bubbles: true })); };
const labels = pal => Array.from(pal.list.querySelectorAll('.chillcmd-item-text')).map(e => e.textContent);

test('SSR import safe; fuzzy usable in plain node', () => {
    const lib = loadSSR('chillcommand');
    assert.ok(lib.fuzzy('nf', 'New file'));
});

test('fuzzy: subsequence, word-start preference, null on miss, indices', () => {
    const { lib } = load('chillcommand');
    assert.equal(lib.fuzzy('xyz', 'New file'), null);
    assert.equal(lib.fuzzy('', 'abc').score, 0);
    const r = lib.fuzzy('nf', 'New file');
    assert.equal(r.indices.join(), '0,4');
    assert.ok(lib.fuzzy('file', 'New file').score > lib.fuzzy('file', 'Profile settings x').score); // prefix/word-start beats middle of word
    assert.ok(lib.fuzzy('tt', 'Toggle theme').score > lib.fuzzy('tt', 'Bottle').score);
    assert.equal(lib.fuzzy('ab cd', 'abcd').indices.length, 4); // spaces in query ignored
    assert.equal(lib.fuzzy('ABC', 'a-b-c').indices.join(), '0,2,4'); // case-insensitive
});

test('renders closed dialog with ARIA: combobox, listbox, options, groups, live region', () => {
    const { pal, document } = setup();
    const dlg = document.querySelector('.chillcmd');
    assert.equal(dlg.getAttribute('role'), 'dialog');
    assert.equal(dlg.getAttribute('aria-modal'), 'true');
    assert.equal(dlg.getAttribute('aria-hidden'), 'true');
    assert.equal(pal.input.getAttribute('role'), 'combobox');
    assert.equal(pal.input.getAttribute('aria-controls'), pal.list.id);
    assert.equal(pal.list.getAttribute('role'), 'listbox');
    const opts = pal.list.querySelectorAll('[role="option"]');
    assert.equal(opts.length, 5);
    assert.equal(opts[0].getAttribute('aria-selected'), 'true');
    assert.equal(pal.input.getAttribute('aria-activedescendant'), opts[0].id);
    assert.equal(pal.list.querySelectorAll('[role="group"]').length, 3);
    assert.equal(opts[3].getAttribute('aria-disabled'), 'true');
    assert.equal(document.querySelector('[role="status"]').textContent, '5 results');
    pal.destroy();
});

test('open focuses input, close restores previous focus, aria-hidden toggles, callbacks fire', () => {
    const log = [];
    const { pal, document } = setup({ onOpen: () => log.push('open'), onClose: () => log.push('close') });
    const btn = document.createElement('button'); document.body.appendChild(btn); btn.focus();
    pal.open();
    assert.equal(document.activeElement, pal.input);
    assert.equal(pal.isOpen, true);
    assert.equal(pal.container.getAttribute('aria-hidden'), 'false');
    assert.ok(pal.container.classList.contains('open'));
    pal.close();
    assert.equal(document.activeElement, btn);
    assert.equal(pal.container.getAttribute('aria-hidden'), 'true');
    assert.equal(log.join(), 'open,close');
    pal.destroy();
});

test('fuzzy filtering sorts by score, highlights with <mark>, searches keywords', () => {
    const { pal, window } = setup();
    pal.open();
    type(window, pal, 'nf');
    assert.equal(labels(pal)[0], 'New file');
    const marks = Array.from(pal.list.querySelector('.chillcmd-item').querySelectorAll('mark')).map(m => m.textContent);
    assert.equal(marks.join(''), 'Nf');
    type(window, pal, 'dark');          // matches keywords of "Toggle theme"
    assert.equal(labels(pal).join('|'), 'Toggle theme');
    type(window, pal, 'zzzz');
    assert.equal(pal.list.querySelector('.chillcmd-empty').textContent, 'No commands found');
    assert.equal(pal.input.hasAttribute('aria-activedescendant'), false);
    type(window, pal, '');
    assert.equal(labels(pal).length, 5);
    pal.destroy();
});

test('keyboard: arrows wrap, Home/End, Enter selects (closes first, runs action then onSelect), Esc closes', () => {
    const order = [];
    const cmds = CMDS(); cmds[1].action = c => order.push('action:' + c.id);
    const { pal, window, document } = setup({ commands: cmds, onSelect: c => order.push('select:' + c.id), onClose: () => order.push('closed') });
    pal.open();
    key(window, 'ArrowDown', {}, pal.input);
    assert.equal(pal.activeIndex, 1);
    key(window, 'ArrowUp', {}, pal.input); key(window, 'ArrowUp', {}, pal.input);
    assert.equal(pal.activeIndex, 4); // wrapped
    key(window, 'Home', {}, pal.input); assert.equal(pal.activeIndex, 0);
    key(window, 'End', {}, pal.input); assert.equal(pal.activeIndex, 4);
    key(window, 'Home', {}, pal.input); key(window, 'ArrowDown', {}, pal.input);
    assert.equal(pal.input.getAttribute('aria-activedescendant'), pal.itemEls[1].id);
    key(window, 'Enter', {}, pal.input);
    assert.equal(order.join(), 'closed,action:open,select:open');
    assert.equal(pal.isOpen, false);
    pal.open();
    const esc = key(window, 'Escape', {}, pal.input);
    assert.equal(esc.defaultPrevented, true);
    assert.equal(pal.isOpen, false);
    pal.destroy();
});

test('disabled commands cannot be selected; IME composition Enter ignored; empty list Enter is safe', () => {
    let sel = 0;
    const { pal, window } = setup({ onSelect: () => sel++ });
    pal.open();
    pal.activeIndex = 3; pal.updateActive();
    key(window, 'Enter', {}, pal.input);
    assert.equal(sel, 0); assert.equal(pal.isOpen, true);
    pal.activeIndex = 0;
    key(window, 'Enter', { isComposing: true }, pal.input);
    assert.equal(sel, 0);
    type(window, pal, 'zzzz');
    assert.doesNotThrow(() => key(window, 'Enter', {}, pal.input));
    pal.destroy();
});

test('Tab is trapped inside the dialog', () => {
    const { pal, window, document } = setup();
    pal.open();
    const e = key(window, 'Tab', {}, pal.input);
    assert.equal(e.defaultPrevented, true);
    assert.equal(document.activeElement, pal.input);
    // focus that escapes while open is pulled back
    const outside = document.createElement('button'); document.body.appendChild(outside);
    outside.focus();
    assert.equal(document.activeElement, pal.input);
    pal.destroy();
});

test('mouse: click selects, hover moves active item, overlay click closes', () => {
    let selected = null;
    const { pal, window } = setup({ onSelect: c => { selected = c.id; } });
    pal.open();
    const items = pal.list.querySelectorAll('.chillcmd-item');
    items[2].dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
    assert.equal(pal.activeIndex, 2);
    const down = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    items[2].dispatchEvent(down);
    assert.equal(down.defaultPrevented, true); // keeps focus in input
    items[2].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(selected, 'theme');
    pal.open();
    pal.overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(pal.isOpen, false);
    pal.destroy();
});

test('hotkey: mod+k is Ctrl on non-Mac, Cmd on Mac; custom shortcut; false disables', () => {
    const w = setup({}, 'Win32');
    key(w.window, 'k', { metaKey: true });
    assert.equal(w.pal.isOpen, false);
    const e = key(w.window, 'k', { ctrlKey: true });
    assert.equal(w.pal.isOpen, true); assert.equal(e.defaultPrevented, true);
    key(w.window, 'k', { ctrlKey: true }, w.pal.input); // toggles closed even from within the input
    assert.equal(w.pal.isOpen, false);
    w.pal.destroy();

    const m = setup({}, 'MacIntel');
    key(m.window, 'k', { ctrlKey: true });
    assert.equal(m.pal.isOpen, false);
    key(m.window, 'k', { metaKey: true });
    assert.equal(m.pal.isOpen, true);
    m.pal.destroy();

    const c = setup({ shortcut: 'mod+shift+p' }, 'Win32');
    key(c.window, 'k', { ctrlKey: true }); assert.equal(c.pal.isOpen, false);
    key(c.window, 'P', { ctrlKey: true, shiftKey: true }); assert.equal(c.pal.isOpen, true);
    c.pal.destroy();

    const off = setup({ shortcut: false }, 'Win32');
    key(off.window, 'k', { ctrlKey: true });
    assert.equal(off.pal.isOpen, false);
    off.pal.destroy();
});

test('XSS: label, group, shortcut and (default) icon strings are never parsed as HTML', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { pal, document } = setup({ commands: [{ id: 'e', label: evil, group: evil, icon: evil, shortcut: evil }] });
    pal.open();
    assert.equal(document.querySelector('.chillcmd img'), null);
    assert.ok(pal.list.textContent.includes('<img'));
    pal.destroy();
});

test('html:true opt-in renders trusted icon markup; Node icons are cloned', () => {
    const { pal, document } = setup({ html: true, commands: [{ id: 'a', label: 'A', icon: '<svg id="ico"></svg>' }] });
    assert.ok(document.querySelector('.chillcmd-item-icon svg#ico'));
    pal.destroy();
    const ctx = load('chillcommand');
    const node = ctx.document.createElement('i'); node.className = 'my-icon';
    const p2 = ctx.lib.init({ commands: [{ id: 'a', label: 'A', icon: node }] });
    assert.ok(p2.list.querySelector('.chillcmd-item-icon .my-icon'));
    p2.destroy();
});

test('shortcut display is OS aware; plain strings untouched', () => {
    const w = setup({}, 'Win32');
    assert.equal(w.pal.list.querySelector('.chillcmd-item-shortcut').textContent, 'Ctrl+N');
    w.pal.destroy();
    const m = setup({}, 'MacIntel');
    assert.equal(m.pal.list.querySelector('.chillcmd-item-shortcut').textContent, '⌘N');
    m.pal.destroy();
    const p = setup({ commands: [{ id: 'x', label: 'X', shortcut: 'G then I' }] });
    assert.equal(p.pal.list.querySelector('.chillcmd-item-shortcut').textContent, 'G then I');
    p.pal.destroy();
});

test('setCommands / getCommands / onQuery / open(query)', () => {
    const q = [];
    const { pal, window } = setup({ onQuery: s => q.push(s) });
    pal.setCommands([{ id: 'only', label: 'Only one' }]);
    assert.equal(labels(pal).join(), 'Only one');
    assert.equal(pal.getCommands().length, 1);
    pal.open('on');
    assert.equal(pal.input.value, 'on');
    type(window, pal, 'only');
    assert.equal(q.join(), 'only');
    pal.destroy();
});

test('destroy removes DOM and every document listener; safe twice; restores focus if open', () => {
    const ctx = load('chillcommand');
    const { window, document, lib } = ctx;
    const added = {}, removed = {};
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { added[t] = (added[t] || 0) + 1; return a(t, f, o); };
    document.removeEventListener = (t, f, o) => { removed[t] = (removed[t] || 0) + 1; return r(t, f, o); };
    const btn = document.createElement('button'); document.body.appendChild(btn); btn.focus();
    const pal = lib.init({ commands: CMDS() });
    pal.open();
    pal.destroy(); pal.destroy();
    assert.equal(document.querySelector('.chillcmd'), null);
    assert.equal(document.querySelector('.chillcmd-overlay'), null);
    assert.equal(document.activeElement, btn);
    assert.equal(added.keydown, removed.keydown);
    assert.equal(added.focusin, removed.focusin);
    // hotkey no longer opens anything
    key(window, 'k', { ctrlKey: true });
    assert.equal(document.querySelector('.chillcmd'), null);
});

test('CSS: dark overrides for data-theme and .dark, reduced-motion, z-index above modal', () => {
    const { document, pal } = setup();
    const css = document.getElementById('chillcommand-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes('prefers-reduced-motion'));
    assert.ok(css.includes('z-index: 10001'));
    pal.destroy();
});
