const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const HTML = `
<button id="before">before</button>
<div id="dlg" style="position:fixed">
  <button id="b1">1</button>
  <a id="link" href="#x">link</a>
  <input id="in">
  <input id="hid" type="hidden">
  <button id="dis" disabled>dis</button>
  <button id="neg" tabindex="-1">neg</button>
  <div id="gone" style="display:none"><button id="inGone">x</button></div>
  <button id="hiddenAttr" hidden>h</button>
  <div id="ce" contenteditable="true">edit</div>
  <button id="b2">2</button>
</div>
<button id="after">after</button>`;

function setup(opts, html) {
    const ctx = load('chillfocustrap');
    ctx.document.body.innerHTML = html || HTML;
    ctx.trap = ctx.lib.create('#dlg', opts);
    return ctx;
}
const tab = (win, target, shift) => { const e = new win.KeyboardEvent('keydown', { key: 'Tab', shiftKey: !!shift, bubbles: true, cancelable: true }); target.dispatchEvent(e); return e; };
const $ = (d, id) => d.getElementById(id);

test('SSR import safe', () => { assert.ok(loadSSR('chillfocustrap').create); });

test('collects only truly tabbable elements (works for position:fixed containers)', () => {
    const { trap, document } = setup();
    const ids = trap.getFocusableElements().map(e => e.id);
    assert.equal(ids.join(), 'b1,link,in,ce,b2');
    trap.destroy();
});

test('activate focuses first tabbable synchronously; initialFocus selector/element/function; deactivate returns focus', () => {
    const { trap, document, lib } = setup();
    $(document, 'before').focus();
    trap.activate();
    assert.equal(document.activeElement, $(document, 'b1'));
    assert.equal(trap.isActive, true);
    trap.deactivate();
    assert.equal(document.activeElement, $(document, 'before'));
    assert.equal(trap.isActive, false);
    trap.destroy();
    for (const initialFocus of ['#in', $(document, 'in'), () => $(document, 'in')]) {
        const t = lib.create('#dlg', { initialFocus });
        t.activate();
        assert.equal(document.activeElement, $(document, 'in'));
        t.deactivate();
    }
});

test('returnFocus:false leaves focus; callbacks fire once', () => {
    const calls = [];
    const { trap, document } = setup({ returnFocus: false, onActivate: () => calls.push('a'), onDeactivate: () => calls.push('d') });
    $(document, 'before').focus();
    trap.activate(); trap.activate();
    trap.deactivate(); trap.deactivate();
    assert.equal(calls.join(), 'a,d');
    assert.notEqual(document.activeElement, $(document, 'before'));
});

test('Tab wraps last -> first and Shift+Tab first -> last', () => {
    const { trap, document, window } = setup();
    trap.activate();
    $(document, 'b2').focus();
    const e1 = tab(window, $(document, 'b2'));
    assert.equal(e1.defaultPrevented, true);
    assert.equal(document.activeElement, $(document, 'b1'));
    const e2 = tab(window, $(document, 'b1'), true);
    assert.equal(e2.defaultPrevented, true);
    assert.equal(document.activeElement, $(document, 'b2'));
    // middle elements: default browser behaviour is left alone
    $(document, 'in').focus();
    assert.equal(tab(window, $(document, 'in')).defaultPrevented, false);
    trap.deactivate();
});

test('Tab when focus is outside the container jumps inside', () => {
    const { trap, document, window } = setup({ clickOutsideDeactivates: false });
    trap.activate();
    // simulate focus outside without triggering focusin pull-back
    trap.pause();
    $(document, 'after').focus();
    trap.resume();
    const e = tab(window, $(document, 'after'));
    assert.equal(e.defaultPrevented, true);
    assert.equal(document.activeElement, $(document, 'b1'));
    trap.deactivate();
});

test('focus escaping (programmatic focus) is pulled back; click outside is blocked or deactivates', () => {
    const { trap, document, window } = setup();
    trap.activate();
    $(document, 'after').focus();
    assert.equal(trap.getFocusableElements().indexOf(document.activeElement) > -1, true);
    const md = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    $(document, 'before').dispatchEvent(md);
    assert.equal(md.defaultPrevented, true);
    assert.equal(trap.isActive, true);
    trap.deactivate();
    const t2 = setup({ clickOutsideDeactivates: true });
    t2.trap.activate();
    t2.document.getElementById('before').dispatchEvent(new t2.window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    assert.equal(t2.trap.isActive, false);
});

test('Escape deactivates (and can be disabled)', () => {
    const { trap, document, window } = setup();
    trap.activate();
    $(document, 'b1').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(trap.isActive, false);
    const t = setup({ escapeDeactivates: false });
    t.trap.activate();
    t.document.getElementById('b1').dispatchEvent(new t.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(t.trap.isActive, true);
    t.trap.destroy();
});

test('container without tabbable children becomes the focus target and Tab is contained', () => {
    const { trap, document, window } = setup({}, '<button id="o">o</button><div id="dlg"><p>nothing</p></div>');
    trap.activate();
    assert.equal(document.activeElement, $(document, 'dlg'));
    const e = tab(window, $(document, 'dlg'));
    assert.equal(e.defaultPrevented, true);
    trap.deactivate();
    assert.equal($(document, 'dlg').hasAttribute('tabindex'), false);
});

test('nested traps: inner pauses outer, outer resumes after inner deactivates', () => {
    const { trap, document, window, lib } = setup({}, '<div id="dlg"><button id="a">a</button><div id="inner"><button id="x">x</button></div></div>');
    const inner = lib.create('#inner');
    trap.activate();
    inner.activate();
    assert.equal(document.activeElement, $(document, 'x'));
    // outer's listeners are suspended: focusing inside outer but outside inner is pulled back by the inner trap only
    $(document, 'a').focus();
    assert.equal(document.activeElement, $(document, 'x'));
    inner.deactivate();
    assert.equal(trap.isActive, true);
    document.body.appendChild(Object.assign(document.createElement('button'), { id: 'z' }));
    $(document, 'z').focus();
    assert.equal(trap.getFocusableElements().indexOf(document.activeElement) > -1, true); // outer is enforcing again
    trap.deactivate();
});

test('pause/resume and destroy remove all document listeners; no stray timers after deactivate', async () => {
    const ctx = load('chillfocustrap');
    const { document, window, lib } = ctx;
    const added = {}, removed = {};
    const a = document.addEventListener.bind(document), r = document.removeEventListener.bind(document);
    document.addEventListener = (t, f, o) => { added[t] = (added[t] || 0) + 1; return a(t, f, o); };
    document.removeEventListener = (t, f, o) => { removed[t] = (removed[t] || 0) + 1; return r(t, f, o); };
    document.body.innerHTML = HTML;
    const trap = lib.create('#dlg');
    trap.activate();
    trap.pause();
    $(document, 'after').focus();   // paused: no pull-back
    assert.equal(document.activeElement, $(document, 'after'));
    trap.resume();
    trap.destroy(); trap.destroy();
    for (const t of ['keydown', 'focusin', 'mousedown']) assert.equal(added[t], removed[t], t);
    await new Promise(r => setTimeout(r, 30));
    $(document, 'before').focus();
    assert.equal(document.activeElement, $(document, 'before')); // nothing steals focus afterwards
    assert.throws(() => lib.create('#nope'), /not found/);
});
