'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

test('chillrating renders radiogroup with N radios and destroys cleanly', () => {
    const { lib, document } = load('chillrating');
    const r = lib.create({ max: 5, value: 3, container: document.body });
    const g = document.querySelector('.chillrating');
    assert.equal(g.getAttribute('role'), 'radiogroup');
    const radios = g.querySelectorAll('[role="radio"]');
    assert.equal(radios.length, 5);
    assert.equal(radios[2].getAttribute('aria-checked'), 'true');
    assert.equal(radios[0].getAttribute('aria-checked'), 'false');
    assert.equal(radios[2].tabIndex, 0);
    assert.equal(radios[0].tabIndex, -1);
    r.destroy();
    assert.equal(document.querySelector('.chillrating'), null);
});

test('chillrating click sets value, fires onChange, fills stars', () => {
    const { lib, document } = load('chillrating');
    const seen = [];
    const r = lib.create({ container: document.body, onChange: v => seen.push(v) });
    const stars = document.querySelectorAll('.chillrating-star');
    stars[3].click();
    assert.equal(r.getValue(), 4);
    assert.deepEqual(seen, [4]);
    const fgs = document.querySelectorAll('.chillrating-fg');
    assert.equal(fgs[0].style.width, '100%');
    assert.equal(fgs[3].style.width, '100%');
    assert.equal(fgs[4].style.width, '0%');
    stars[3].click(); // same value, no allowClear -> unchanged
    assert.equal(r.getValue(), 4);
    assert.deepEqual(seen, [4]);
    r.destroy();
});

test('chillrating allowClear resets on same click', () => {
    const { lib, document } = load('chillrating');
    const r = lib.create({ value: 2, allowClear: true, container: document.body });
    document.querySelectorAll('.chillrating-star')[1].click();
    assert.equal(r.getValue(), 0);
    r.destroy();
});

test('chillrating half stars: partial fill, snapping, keyboard step 0.5, half click', () => {
    const { lib, window, document } = load('chillrating');
    const r = lib.create({ value: 2.3, half: true, container: document.body });
    assert.equal(r.getValue(), 2.5);
    const fgs = document.querySelectorAll('.chillrating-fg');
    assert.equal(fgs[2].style.width, '50%');
    const stars = document.querySelectorAll('.chillrating-star');
    key(window, stars[2], 'ArrowRight');
    assert.equal(r.getValue(), 3);
    key(window, stars[2], 'ArrowLeft');
    key(window, stars[2], 'ArrowLeft');
    assert.equal(r.getValue(), 2);
    // pointer on left half
    stars[0].getBoundingClientRect = () => ({ left: 0, width: 20, top: 0, height: 20 });
    stars[0].dispatchEvent(new window.MouseEvent('click', { clientX: 4, bubbles: true }));
    assert.equal(r.getValue(), 0.5);
    r.destroy();
});

test('chillrating keyboard: arrows clamp, Home/End, digits, roving tabindex', () => {
    const { lib, window, document } = load('chillrating');
    const r = lib.create({ value: 1, container: document.body });
    const stars = () => document.querySelectorAll('.chillrating-star');
    key(window, stars()[0], 'ArrowUp');
    assert.equal(r.getValue(), 2);
    assert.equal(stars()[1].tabIndex, 0);
    key(window, stars()[1], 'End');
    assert.equal(r.getValue(), 5);
    key(window, stars()[4], 'ArrowRight');
    assert.equal(r.getValue(), 5);
    key(window, stars()[4], 'Home');
    assert.equal(r.getValue(), 0);
    key(window, stars()[0], '4');
    assert.equal(r.getValue(), 4);
    r.destroy();
});

test('chillrating readonly is role=img and ignores interaction', () => {
    const { lib, window, document } = load('chillrating');
    const r = lib.create({ value: 4, readonly: true, container: document.body });
    const g = document.querySelector('.chillrating');
    assert.equal(g.getAttribute('role'), 'img');
    assert.match(g.getAttribute('aria-label'), /4 \/ 5/);
    document.querySelectorAll('.chillrating-star')[0].click();
    assert.equal(r.getValue(), 4);
    key(window, g, 'ArrowRight');
    assert.equal(r.getValue(), 4);
    r.setReadonly(false);
    assert.equal(g.getAttribute('role'), 'radiogroup');
    document.querySelectorAll('.chillrating-star')[0].click();
    assert.equal(r.getValue(), 1);
    r.setDisabled(true);
    document.querySelectorAll('.chillrating-star')[2].click();
    assert.equal(r.getValue(), 1);
    r.destroy();
});

test('chillrating custom icon is text-safe; iconHtml is opt-in; hover emits', () => {
    const { lib, document } = load('chillrating');
    const hovers = [];
    const r = lib.create({ max: 2, icon: '<img src=x onerror=alert(1)>', container: document.body, onHover: v => hovers.push(v) });
    assert.equal(document.querySelector('img'), null);
    assert.ok(document.querySelector('.chillrating-bg').textContent.includes('<img'));
    const star = document.querySelectorAll('.chillrating-star')[1];
    star.dispatchEvent(new (document.defaultView.MouseEvent)('mousemove', { bubbles: true }));
    assert.equal(document.querySelectorAll('.chillrating-fg')[1].style.width, '100%');
    document.querySelector('.chillrating').dispatchEvent(new (document.defaultView.MouseEvent)('mouseleave'));
    assert.deepEqual(hovers, [2, null]);
    r.destroy();
    const r2 = lib.create({ max: 1, iconHtml: '<b class="x">*</b>', container: document.body });
    assert.ok(document.querySelector('b.x'));
    r2.destroy();
});

test('chillrating hidden input + setValue silent', () => {
    const { lib, document } = load('chillrating');
    let n = 0;
    const r = lib.create({ name: 'score', container: document.body, onChange: () => n++, showValue: true });
    r.setValue(3, true);
    assert.equal(n, 0);
    r.setValue(4);
    assert.equal(n, 1);
    assert.equal(document.querySelector('input[name="score"]').value, '4');
    assert.equal(document.querySelector('.chillrating-value').textContent, '4 / 5');
    r.destroy();
});
