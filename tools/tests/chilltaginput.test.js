'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const key = (w, el, k, extra) => {
    const e = new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra));
    el.dispatchEvent(e);
    return e;
};
const type = (w, input, text) => { input.value = text; input.dispatchEvent(new w.Event('input', { bubbles: true })); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chips = d => [...d.querySelectorAll('.chilltaginput-chip-text')].map(x => x.textContent);

test('chilltaginput renders initial chips, label, destroys', () => {
    const { lib, document } = load('chilltaginput');
    const t = lib.create({ value: ['a', 'b'], container: document.body, label: 'Skills' });
    eq(chips(document), ['a', 'b']);
    assert.equal(t.input.getAttribute('aria-label'), 'Skills');
    assert.equal(document.querySelector('.chilltaginput-remove').getAttribute('aria-label'), 'Remove a');
    t.destroy();
    assert.equal(document.querySelector('.chilltaginput'), null);
});

test('chilltaginput Enter and comma add tags; trims; empty ignored', () => {
    const { lib, window, document } = load('chilltaginput');
    const seen = [];
    const t = lib.create({ container: document.body, onChange: v => seen.push(v.join('|')) });
    type(window, t.input, '  hello ');
    assert.ok(key(window, t.input, 'Enter').defaultPrevented);
    eq(t.getValue(), ['hello']);
    assert.equal(t.input.value, '');
    key(window, t.input, 'Enter');
    assert.equal(t.getValue().length, 1);
    type(window, t.input, 'foo,bar,ba');
    eq(t.getValue(), ['hello', 'foo', 'bar']);
    assert.equal(t.input.value, 'ba');
    eq(seen, ['hello', 'hello|foo', 'hello|foo|bar']);
    t.destroy();
});

test('chilltaginput backspace on empty removes last; click x removes', () => {
    const { lib, window, document } = load('chilltaginput');
    const removed = [];
    const t = lib.create({ value: ['a', 'b', 'c'], container: document.body, onRemove: v => removed.push(v) });
    key(window, t.input, 'Backspace');
    eq(t.getValue(), ['a', 'b']);
    type(window, t.input, 'x');
    key(window, t.input, 'Backspace');
    eq(t.getValue(), ['a', 'b'], 'does not remove while text present');
    document.querySelectorAll('.chilltaginput-remove')[0].click();
    eq(t.getValue(), ['b']);
    eq(removed, ['c', 'a']);
    t.destroy();
});

test('chilltaginput duplicates, max, maxLength, validate, onInvalid reasons', () => {
    const { lib, document } = load('chilltaginput');
    const bad = [];
    const t = lib.create({ container: document.body, max: 3, maxLength: 5, validate: v => v !== 'no' || 'Not allowed word that is long',
        onInvalid: (txt, r) => bad.push(r) });
    assert.ok(t.add('One'));
    assert.ok(!t.add('one'));              // duplicate (case-insensitive)
    assert.ok(!t.add('toolong'));
    assert.ok(!t.add('no'));
    assert.ok(t.add('two'));
    assert.ok(t.add('three'));
    assert.ok(!t.add('four'));
    eq(bad, ['duplicate', 'length', 'Not allowed word that is long', 'max']);
    eq(t.getValue(), ['One', 'two', 'three']);
    assert.ok(document.querySelector('.chilltaginput-invalid'));
    t.destroy();
});

test('chilltaginput allowDuplicates and caseSensitive', () => {
    const { lib, document } = load('chilltaginput');
    const t = lib.create({ container: document.body, allowDuplicates: true });
    t.add('a'); t.add('a');
    eq(t.getValue(), ['a', 'a']);
    const u = lib.create({ container: document.body, caseSensitive: true });
    u.add('a'); u.add('A');
    eq(u.getValue(), ['a', 'A']);
    t.destroy(); u.destroy();
});

test('chilltaginput transform + paste splitting + addOnBlur', () => {
    const { lib, window, document } = load('chilltaginput');
    const t = lib.create({ container: document.body, transform: v => v.toUpperCase() });
    const ev = new window.Event('paste', { bubbles: true, cancelable: true });
    ev.clipboardData = { getData: () => 'a, b,c\nd' };
    t.input.dispatchEvent(ev);
    assert.ok(ev.defaultPrevented);
    eq(t.getValue(), ['A', 'B', 'C', 'D']);
    type(window, t.input, 'zed');
    t.input.dispatchEvent(new window.Event('blur'));
    eq(t.getValue(), ['A', 'B', 'C', 'D', 'ZED']);
    const n = lib.create({ container: document.body, addOnBlur: false });
    type(window, n.input, 'q');
    n.input.dispatchEvent(new window.Event('blur'));
    eq(n.getValue(), []);
    t.destroy(); n.destroy();
});

test('chilltaginput text is XSS-safe', () => {
    const { lib, document } = load('chilltaginput');
    const t = lib.create({ container: document.body });
    t.add('<img src=x onerror=alert(1)>');
    assert.equal(document.querySelector('img'), null);
    assert.equal(chips(document)[0], '<img src=x onerror=alert(1)>');
    t.destroy();
});

test('chilltaginput suggestions (array): filter, highlight, keyboard pick, ARIA, exclude added', () => {
    const { lib, window, document } = load('chilltaginput');
    const t = lib.create({ container: document.body, suggestions: ['javascript', 'java', 'rust', 'typescript'], value: ['java'] });
    t.input.focus();
    assert.equal(t.input.getAttribute('role'), 'combobox');
    assert.equal(t.input.getAttribute('aria-expanded'), 'false');
    type(window, t.input, 'jav');
    const menu = document.querySelector('.chilltaginput-menu');
    assert.equal(menu.hidden, false);
    const opts = menu.querySelectorAll('[role="option"]');
    assert.equal(opts.length, 1);          // 'java' already added
    assert.equal(opts[0].textContent, 'javascript');
    assert.equal(opts[0].querySelector('mark').textContent, 'jav');
    assert.equal(t.input.getAttribute('aria-expanded'), 'true');
    key(window, t.input, 'ArrowDown');
    assert.equal(t.input.getAttribute('aria-activedescendant'), opts[0].id);
    assert.equal(opts[0].getAttribute('aria-selected'), 'true');
    key(window, t.input, 'Enter');
    eq(t.getValue(), ['java', 'javascript']);
    assert.equal(menu.hidden, true);
    assert.equal(t.input.value, '');
    t.destroy();
});

test('chilltaginput suggestions: Escape closes, click picks, allowCustom:false rejects', () => {
    const { lib, window, document } = load('chilltaginput');
    const bad = [];
    const t = lib.create({ container: document.body, suggestions: ['red', 'green'], allowCustom: false, onInvalid: (x, r) => bad.push(r) });
    t.input.focus();
    type(window, t.input, 'r');
    key(window, t.input, 'Escape');
    assert.equal(document.querySelector('.chilltaginput-menu').hidden, true);
    type(window, t.input, 'gr');
    document.querySelector('.chilltaginput-option').click();
    eq(t.getValue(), ['green']);
    assert.ok(!t.add('blue'));
    eq(bad, ['notallowed']);
    t.destroy();
});

test('chilltaginput async suggestions: debounce and stale responses ignored', async () => {
    const { lib, window, document } = load('chilltaginput');
    const calls = [];
    const t = lib.create({ container: document.body, debounce: 10, suggestions: q => {
        calls.push(q);
        return new Promise(res => setTimeout(() => res([q + '-result']), q === 'ab' ? 60 : 5));
    } });
    t.input.focus();
    type(window, t.input, 'a');
    type(window, t.input, 'ab');           // debounced: 'a' never called
    await sleep(25);
    type(window, t.input, 'abc');          // 'ab' slow response becomes stale
    await sleep(120);
    eq(calls, ['ab', 'abc']);
    const opts = document.querySelectorAll('.chilltaginput-option');
    assert.equal(opts.length, 1);
    assert.equal(opts[0].textContent, 'abc-result');
    t.destroy();
});

test('chilltaginput chips keyboard: ArrowLeft from input, Delete removes', () => {
    const { lib, window, document } = load('chilltaginput');
    const t = lib.create({ container: document.body, value: ['a', 'b'] });
    t.input.focus();
    key(window, t.input, 'ArrowLeft');
    const cs = () => document.querySelectorAll('.chilltaginput-chip');
    assert.equal(document.activeElement, cs()[1]);
    key(window, document.activeElement, 'ArrowLeft');
    assert.equal(document.activeElement, cs()[0]);
    key(window, document.activeElement, 'Delete');
    eq(t.getValue(), ['b']);
    assert.equal(document.activeElement, cs()[0]);
    key(window, document.activeElement, 'ArrowRight');
    assert.equal(document.activeElement, t.input);
    t.destroy();
});

test('chilltaginput hidden inputs, readonly/disabled, setValue/clear, on()', () => {
    const { lib, window, document } = load('chilltaginput');
    const t = lib.create({ container: document.body, name: 'tags', value: ['x', 'y'] });
    eq([...document.querySelectorAll('input[name="tags"]')].map(i => i.value), ['x', 'y']);
    const got = [];
    const off = t.on('add', v => got.push(v));
    t.add('z'); off(); t.add('w');
    eq(got, ['z']);
    t.setValue(['p', 'p', 'q'], true);
    eq(t.getValue(), ['p', 'q']);
    t.setReadonly(true);
    assert.ok(!t.add('r'));
    assert.equal(document.querySelectorAll('.chilltaginput-remove').length, 0);
    t.setReadonly(false);
    t.clear();
    eq(t.getValue(), []);
    t.setDisabled(true);
    assert.ok(t.input.disabled);
    key(window, t.input, 'Enter');
    t.destroy();
});
