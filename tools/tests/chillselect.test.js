'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const key = (w, el, k) => { const e = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const ITEMS = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', disabled: true }, { value: 'c', label: 'Gamma' }, { value: 'd', label: 'Delta' }];
const opts = d => [...d.querySelectorAll('.chillselect-option')];

test('chillselect.create no longer throws; builds ARIA combobox/listbox; destroy', () => {
    const { lib, document } = load('chillselect');
    const w = lib.create({ label: 'Pick', items: ITEMS, helper: 'help' });
    document.body.appendChild(w);
    const t = w.querySelector('.chillselect-trigger');
    assert.equal(t.getAttribute('role'), 'combobox');
    assert.equal(t.getAttribute('aria-expanded'), 'false');
    assert.equal(t.getAttribute('aria-haspopup'), 'listbox');
    const lb = w.querySelector('[role="listbox"]');
    assert.equal(t.getAttribute('aria-controls'), lb.id);
    assert.equal(t.getAttribute('aria-labelledby'), w.querySelector('label').id);
    assert.equal(t.getAttribute('aria-describedby'), w.querySelector('.chillselect-helper').id);
    assert.equal(opts(document).length, 4);
    assert.equal(opts(document)[1].getAttribute('aria-disabled'), 'true');
    assert.equal(t.textContent.trim(), 'Select an option');
    w.destroy();
    assert.equal(document.querySelector('.chillselect-wrapper'), null);
});

test('chillselect is XSS-safe for labels, items, placeholder, helper, values', () => {
    const { lib, document } = load('chillselect');
    const evil = '<img src=x onerror=alert(1)>';
    const w = lib.create({ label: evil, helper: evil, placeholder: evil, items: [{ value: '"><b>', label: evil }, { type: 'group', label: evil }], multiple: true, value: ['"><b>'] });
    document.body.appendChild(w);
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    assert.equal(w.querySelector('.chillselect-tag span').textContent, evil);
    w.destroy();
});

test('chillselect click selects, closes, fires onChange, updates display and selected state', () => {
    const { lib, document } = load('chillselect');
    const seen = [];
    const w = lib.create({ items: ITEMS, onChange: v => seen.push(v) });
    document.body.appendChild(w);
    const t = w.querySelector('.chillselect-trigger');
    t.click();
    assert.ok(w.classList.contains('open'));
    assert.equal(t.getAttribute('aria-expanded'), 'true');
    opts(document)[1].click();                       // disabled -> ignored
    assert.equal(seen.length, 0);
    opts(document)[2].click();
    eq(seen, ['c']);
    assert.ok(!w.classList.contains('open'));
    assert.equal(w.querySelector('.chillselect-value').textContent, 'Gamma');
    assert.equal(opts(document)[2].getAttribute('aria-selected'), 'true');
    assert.equal(w.instance.getValue(), 'c');
    w.destroy();
});

test('chillselect numeric values keep their type', () => {
    const { lib, document } = load('chillselect');
    const w = lib.create({ items: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }], value: 1 });
    document.body.appendChild(w);
    assert.equal(w.querySelector('.chillselect-value').textContent, 'One');
    w.instance.open();
    opts(document)[1].click();
    assert.strictEqual(w.instance.getValue(), 2);
    w.destroy();
});

test('chillselect keyboard: open, arrows skip disabled, Enter selects, Esc closes and refocuses', () => {
    const { lib, window, document } = load('chillselect');
    const w = lib.create({ items: ITEMS });
    document.body.appendChild(w);
    const inst = w.instance;
    const t = inst.trigger;
    t.focus();
    key(window, t, 'ArrowDown');
    assert.ok(inst.isOpen);
    const o = opts(document);
    assert.equal(t.getAttribute('aria-activedescendant'), o[0].id);
    key(window, t, 'ArrowDown');                      // skips disabled Beta
    assert.equal(t.getAttribute('aria-activedescendant'), o[2].id);
    key(window, t, 'End');
    assert.equal(t.getAttribute('aria-activedescendant'), o[3].id);
    key(window, t, 'ArrowDown');                      // wraps
    assert.equal(t.getAttribute('aria-activedescendant'), o[0].id);
    key(window, t, 'ArrowUp');
    assert.equal(t.getAttribute('aria-activedescendant'), o[3].id);
    key(window, t, 'Enter');
    assert.equal(inst.getValue(), 'd');
    assert.ok(!inst.isOpen);
    key(window, t, 'Enter');                          // open again: starts on selected
    assert.equal(t.getAttribute('aria-activedescendant'), opts(document)[3].id);
    key(window, t, 'Escape');
    assert.ok(!inst.isOpen);
    assert.equal(document.activeElement, t);
    assert.equal(t.getAttribute('aria-activedescendant'), null);
    w.destroy();
});

test('chillselect type-ahead on the closed trigger selects matching item', () => {
    const { lib, window, document } = load('chillselect');
    const w = lib.create({ items: ITEMS });
    document.body.appendChild(w);
    w.instance.trigger.focus();
    key(window, w.instance.trigger, 'g');
    assert.equal(w.instance.getValue(), 'c');
    w.destroy();
});

test('chillselect outside click closes; listeners removed on close and destroy', () => {
    const { lib, window, document } = load('chillselect');
    const w = lib.create({ items: ITEMS });
    document.body.appendChild(w);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const inst = w.instance;
    let adds = 0, removes = 0;
    const oa = document.addEventListener.bind(document), or = document.removeEventListener.bind(document);
    document.addEventListener = (...a) => { adds++; return oa(...a); };
    document.removeEventListener = (...a) => { removes++; return or(...a); };
    inst.open();
    assert.equal(adds, 1);
    outside.click();
    assert.ok(!inst.isOpen);
    assert.equal(removes, 1);
    inst.open();
    inst.destroy();
    assert.equal(removes, 2);
    document.addEventListener = oa; document.removeEventListener = or;
});

test('chillselect searchable filters, shows no-results, Enter picks first match, resets on close', () => {
    const { lib, window, document } = load('chillselect');
    const w = lib.create({ items: ITEMS, searchable: true });
    document.body.appendChild(w);
    const inst = w.instance;
    inst.open();
    const si = w.querySelector('.chillselect-search-input');
    si.value = 'ta';
    si.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.deepEqual(opts(document).map(x => x.textContent), ['Beta', 'Delta']);   // Beta is disabled: listed but skipped by keyboard
    key(window, si, 'Enter');
    assert.equal(inst.getValue(), 'd');
    inst.open();
    si.value = 'zzz';
    si.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(w.querySelector('.chillselect-no-results').textContent, 'No options found');
    key(window, si, 'Escape');
    assert.ok(!inst.isOpen);
    assert.equal(si.value, '');
    assert.equal(opts(document).length, 4);
    w.destroy();
});

test('chillselect multiple: toggle values, tags with remove, Backspace removes last, hidden inputs', () => {
    const { lib, window, document } = load('chillselect');
    const seen = [];
    const w = lib.create({ items: ITEMS, multiple: true, name: 'f', onChange: v => seen.push(v) });
    document.body.appendChild(w);
    const inst = w.instance;
    inst.open();
    opts(document)[0].click();
    assert.ok(inst.isOpen, 'stays open in multiple mode');
    opts(document)[2].click();
    opts(document)[3].click();
    eq(inst.getValue(), ['a', 'c', 'd']);
    assert.equal(w.querySelectorAll('.chillselect-tag').length, 3);
    assert.equal(w.querySelector('.chillselect-options').getAttribute('aria-multiselectable'), 'true');
    eq([...document.querySelectorAll('input[name="f"]')].map(i => i.value), ['a', 'c', 'd']);
    w.querySelectorAll('.chillselect-tag-remove')[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    eq(inst.getValue(), ['a', 'd']);
    inst.close();
    key(window, inst.trigger, 'Backspace');
    eq(inst.getValue(), ['a']);
    opts(document);
    eq(seen[seen.length - 1], ['a']);
    w.destroy();
});

test('chillselect.init enhances a native <select> and restores it with selection on destroy', () => {
    const { lib, document } = load('chillselect');
    document.body.innerHTML = '<form><select id="s" name="country"><option value="id">Indonesia</option><option value="us" selected>USA</option><optgroup label="Asia"><option value="jp">Japan</option></optgroup></select></form>';
    const el = document.getElementById('s');
    const inst = lib.init('#s', { searchable: true });
    assert.equal(document.getElementById('s'), null);
    assert.equal(inst.getValue(), 'us');
    assert.equal(document.querySelector('.chillselect-value').textContent, 'USA');
    assert.equal(document.querySelector('.chillselect-group-label').textContent, 'Asia');
    assert.equal(document.querySelector('input[name="country"]').value, 'us');
    inst.setValue('jp', true);
    inst.destroy();
    assert.equal(document.getElementById('s'), el);
    assert.equal(el.value, 'jp');
    assert.equal(document.querySelector('.chillselect-wrapper'), null);
});

test('chillselect setValue/setItems/setState/setDisabled', () => {
    const { lib, window, document } = load('chillselect');
    const w = lib.create({ items: ITEMS, value: 'a' });
    document.body.appendChild(w);
    const inst = w.instance;
    inst.setItems([{ value: 'x', label: 'X!' }]);
    assert.equal(opts(document).length, 1);
    inst.setValue('x');
    assert.equal(w.querySelector('.chillselect-value').textContent, 'X!');
    inst.setState('error');
    assert.equal(inst.trigger.getAttribute('aria-invalid'), 'true');
    inst.setDisabled(true);
    assert.ok(inst.trigger.disabled);
    inst.trigger.click();
    assert.ok(!inst.isOpen);
    key(window, inst.trigger, 'ArrowDown');
    assert.ok(!inst.isOpen);
    w.destroy();
});

test('chillselect CSS: data-theme dark override, focus-visible, reduced motion, overlay z-index', () => {
    const { lib, document } = load('chillselect');
    lib.create({}); lib.create({});
    const styles = document.querySelectorAll('#chillselect-styles');
    assert.equal(styles.length, 1);
    const css = styles[0].textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /\.chillselect-trigger:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /z-index: 10001/);
});
