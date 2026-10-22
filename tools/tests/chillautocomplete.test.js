'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const key = (w, el, k) => {
    const e = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
};
const type = (w, input, text) => { input.value = text; input.dispatchEvent(new w.Event('input', { bubbles: true })); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const opts = d => [...d.querySelectorAll('.chillautocomplete-option')];

test('chillautocomplete ARIA combobox wiring and destroy', () => {
    const { lib, document } = load('chillautocomplete');
    const ac = lib.create({ source: ['a'], container: document.body, label: 'Fruit' });
    const i = ac.input;
    assert.equal(i.getAttribute('role'), 'combobox');
    assert.equal(i.getAttribute('aria-expanded'), 'false');
    assert.equal(i.getAttribute('aria-autocomplete'), 'list');
    assert.equal(i.getAttribute('aria-controls'), document.querySelector('[role="listbox"]').id);
    assert.equal(document.querySelector('[role="listbox"]').hidden, true);
    ac.destroy();
    assert.equal(document.querySelector('.chillautocomplete'), null);
});

test('chillautocomplete array source: filter, highlight, maxResults, minChars', () => {
    const { lib, window, document } = load('chillautocomplete');
    const ac = lib.create({ source: ['Apple', 'Apricot', 'Banana', 'Pineapple'], maxResults: 2, container: document.body });
    ac.input.focus();
    type(window, ac.input, '');
    assert.equal(ac.isOpen(), false);
    type(window, ac.input, 'ap');
    assert.ok(ac.isOpen());
    assert.equal(ac.input.getAttribute('aria-expanded'), 'true');
    const o = opts(document);
    assert.equal(o.length, 2);
    assert.equal(o[0].textContent, 'Apple');
    assert.equal(o[0].querySelector('mark').textContent, 'Ap');
    assert.equal(document.querySelector('.chillautocomplete-sr').textContent, '2 results available');
    type(window, ac.input, 'zzz');
    assert.equal(document.querySelector('.chillautocomplete-status').textContent, 'No results');
    assert.equal(opts(document).length, 0);
    ac.destroy();
});

test('chillautocomplete keyboard: Down/Up wrap, aria-activedescendant, Enter selects, Esc closes', () => {
    const { lib, window, document } = load('chillautocomplete');
    const sel = []; const changes = [];
    const ac = lib.create({ source: ['one', 'two', 'three'], container: document.body, onSelect: it => sel.push(it), onChange: (t) => changes.push(t) });
    ac.input.focus();
    type(window, ac.input, 'o');                       // one, two
    assert.equal(opts(document).length, 2);
    key(window, ac.input, 'ArrowDown');
    let o = opts(document);
    assert.equal(ac.input.getAttribute('aria-activedescendant'), o[0].id);
    assert.equal(o[0].getAttribute('aria-selected'), 'true');
    key(window, ac.input, 'ArrowDown');
    key(window, ac.input, 'ArrowDown');                // wraps to first
    assert.equal(ac.input.getAttribute('aria-activedescendant'), o[0].id);
    key(window, ac.input, 'ArrowUp');                  // wraps to last
    assert.equal(ac.input.getAttribute('aria-activedescendant'), o[1].id);
    assert.ok(key(window, ac.input, 'Enter').defaultPrevented);
    assert.equal(ac.getValue(), 'two');
    assert.equal(ac.getSelected(), 'two');
    assert.ok(!ac.isOpen());
    assert.equal(ac.input.getAttribute('aria-activedescendant'), null);
    eq(sel, ['two']);
    eq(changes, ['two']);
    // Down reopens, Esc closes without clearing
    key(window, ac.input, 'ArrowDown');
    assert.ok(ac.isOpen());
    key(window, ac.input, 'Escape');
    assert.ok(!ac.isOpen());
    assert.equal(ac.getValue(), 'two');
    ac.destroy();
});

test('chillautocomplete Enter with no active option does not select (free text)', () => {
    const { lib, window, document } = load('chillautocomplete');
    const sel = [];
    const ac = lib.create({ source: ['alpha'], container: document.body, onSelect: i => sel.push(i) });
    ac.input.focus();
    type(window, ac.input, 'al');
    const e = key(window, ac.input, 'Enter');
    assert.ok(!e.defaultPrevented);
    assert.equal(sel.length, 0);
    assert.equal(ac.getValue(), 'al');
    ac.destroy();
});

test('chillautocomplete click picks option; hover sets active', () => {
    const { lib, window, document } = load('chillautocomplete');
    const ac = lib.create({ source: ['red', 'rose'], container: document.body });
    ac.input.focus();
    type(window, ac.input, 'r');
    const o = opts(document);
    o[1].dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
    assert.equal(o[1].getAttribute('aria-selected'), 'true');
    o[1].click();
    assert.equal(ac.getValue(), 'rose');
    ac.destroy();
});

test('chillautocomplete object items: labelKey, selected item returned, XSS-safe, renderItem string as text', () => {
    const { lib, window, document } = load('chillautocomplete');
    const items = [{ name: '<img src=x onerror=alert(1)>', id: 1 }, { name: 'Safe', id: 2 }];
    const ac = lib.create({ source: items, labelKey: 'name', container: document.body, renderItem: it => '<b>' + it.name + '</b>' });
    ac.input.focus();
    type(window, ac.input, 'a');
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    opts(document)[1].click();
    assert.equal(ac.getSelected().id, 2);
    assert.equal(ac.getValue(), 'Safe');
    ac.destroy();
    const ac2 = lib.create({ source: ['x1'], container: document.body, renderItem: it => { const s = document.createElement('i'); s.textContent = it; return s; } });
    ac2.input.focus();
    type(window, ac2.input, 'x');
    assert.ok(document.querySelector('.chillautocomplete-option i'));
    ac2.destroy();
});

test('chillautocomplete async source: debounce, loading, results, stale ignored, abort signal', async () => {
    const { lib, window, document } = load('chillautocomplete');
    const calls = []; const signals = [];
    const ac = lib.create({ container: document.body, debounce: 10, source: (q, ctx) => {
        calls.push(q); signals.push(ctx.signal);
        return new Promise(res => setTimeout(() => res([q + '!']), q === 'ab' ? 70 : 5));
    } });
    ac.input.focus();
    type(window, ac.input, 'a');
    type(window, ac.input, 'ab');
    assert.equal(calls.length, 0, 'debounced');
    await sleep(25);
    eq(calls, ['ab']);
    assert.equal(ac.input.getAttribute('aria-busy'), 'true');
    assert.equal(document.querySelector('.chillautocomplete-status').textContent, 'Loading...');
    type(window, ac.input, 'abc');
    await sleep(40);
    assert.equal(signals[0] && signals[0].aborted, true, 'previous request aborted');
    await sleep(120);
    eq(calls, ['ab', 'abc']);
    assert.equal(opts(document).length, 1);
    assert.equal(opts(document)[0].textContent, 'abc!');
    assert.equal(ac.input.getAttribute('aria-busy'), 'false');
    ac.destroy();
});

test('chillautocomplete async rejection fires onError and closes', async () => {
    const { lib, window, document } = load('chillautocomplete');
    const errs = [];
    const ac = lib.create({ container: document.body, debounce: 0, source: () => Promise.reject(new Error('boom')), onError: e => errs.push(e.message) });
    ac.input.focus();
    type(window, ac.input, 'x');
    await sleep(30);
    eq(errs, ['boom']);
    assert.ok(!ac.isOpen());
    ac.destroy();
});

test('chillautocomplete destroy cancels pending async work', async () => {
    const { lib, window, document } = load('chillautocomplete');
    let called = 0;
    const ac = lib.create({ container: document.body, debounce: 20, source: () => { called++; return ['x']; } });
    ac.input.focus();
    type(window, ac.input, 'x');
    ac.destroy();
    await sleep(60);
    assert.equal(called, 0);
});

test('chillautocomplete allowFreeText:false reverts text on blur; clearable; openOnFocus; autoSelectFirst', () => {
    const { lib, window, document } = load('chillautocomplete');
    const ac = lib.create({ source: ['alpha', 'beta'], allowFreeText: false, clearable: true, container: document.body });
    const clear = document.querySelector('.chillautocomplete-clear');
    assert.equal(clear.hidden, true);
    ac.input.focus();
    type(window, ac.input, 'al');
    assert.equal(clear.hidden, false);
    ac.input.dispatchEvent(new window.Event('blur'));
    assert.equal(ac.getValue(), '');
    ac.input.focus();
    type(window, ac.input, 'be');
    key(window, ac.input, 'ArrowDown');
    key(window, ac.input, 'Enter');
    assert.equal(ac.getValue(), 'beta');
    ac.input.dispatchEvent(new window.Event('blur'));
    assert.equal(ac.getValue(), 'beta');
    clear.click();
    assert.equal(ac.getValue(), '');
    assert.equal(ac.getSelected(), null);
    ac.destroy();

    const b = lib.create({ source: ['x', 'y'], minChars: 0, openOnFocus: true, autoSelectFirst: true, container: document.body });
    b.input.dispatchEvent(new window.Event('focus'));
    assert.ok(b.isOpen());
    assert.equal(b.input.getAttribute('aria-activedescendant'), opts(document)[0].id);
    b.destroy();
});

test('chillautocomplete setValue/setDisabled/events/Escape clears when closed', () => {
    const { lib, window, document } = load('chillautocomplete');
    const ac = lib.create({ source: ['a'], container: document.body, value: 'init', name: 'q' });
    assert.equal(ac.getValue(), 'init');
    assert.equal(ac.input.name, 'q');
    const got = [];
    const off = ac.on('input', v => got.push(v));
    ac.input.focus();
    type(window, ac.input, 'a');
    off();
    key(window, ac.input, 'Escape'); // closes list
    key(window, ac.input, 'Escape'); // clears
    assert.equal(ac.getValue(), '');
    eq(got, ['a']);
    ac.setValue('x', { id: 1 });
    assert.equal(ac.getSelected().id, 1);
    ac.setDisabled(true);
    assert.ok(ac.input.disabled);
    ac.destroy();
});
