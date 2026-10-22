'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('chilldivider creates DOM and destroys cleanly', () => {
    const { lib, document } = load('chilldivider');
    const d = lib.create({ parent: document.body });
    assert.ok(document.querySelector('.chilldivider'));
    assert.ok(document.getElementById('chilldivider-styles'));
    d.destroy();
    assert.equal(document.querySelector('.chilldivider'), null);
});

test('chilldivider has role=separator and aria-orientation', () => {
    const { lib } = load('chilldivider');
    const h = lib.create();
    assert.equal(h.element.getAttribute('role'), 'separator');
    assert.equal(h.element.getAttribute('aria-orientation'), 'horizontal');
    const v = lib.create({ orientation: 'vertical' });
    assert.equal(v.element.getAttribute('aria-orientation'), 'vertical');
    assert.ok(v.element.classList.contains('chilldivider-vertical'));
    const bad = lib.create({ orientation: 'diagonal' });
    assert.equal(bad.element.getAttribute('aria-orientation'), 'horizontal');
    const deco = lib.create({ decorative: true });
    assert.equal(deco.element.getAttribute('role'), 'none');
    assert.equal(deco.element.getAttribute('aria-orientation'), null);
});

test('chilldivider label uses textContent (no XSS) and alignment classes', () => {
    const { lib } = load('chilldivider');
    const d = lib.create({ label: '<img src=x onerror=alert(1)>', align: 'start' });
    assert.equal(d.element.querySelector('img'), null);
    assert.equal(d.labelEl.textContent, '<img src=x onerror=alert(1)>');
    assert.ok(d.element.classList.contains('chilldivider-has-label'));
    assert.ok(d.element.classList.contains('chilldivider-align-start'));
    d.setAlign('end');
    assert.ok(d.element.classList.contains('chilldivider-align-end'));
    assert.ok(!d.element.classList.contains('chilldivider-align-start'));
    d.setAlign('nope');
    assert.ok(d.element.classList.contains('chilldivider-align-end'));
    const h = lib.create({ labelHtml: '<b>x</b>' });
    assert.ok(h.element.querySelector('.chilldivider-label b'));
    const n = lib.create({ label: 'plain' });
    assert.equal(n.element.querySelectorAll('.chilldivider-label').length, 1);
    n.setLabel('');
    assert.equal(n.element.querySelector('.chilldivider-label'), null);
    assert.ok(!n.element.classList.contains('chilldivider-has-label'));
});

test('chilldivider line styles', () => {
    const { lib } = load('chilldivider');
    const d = lib.create({ lineStyle: 'dashed' });
    assert.ok(d.element.classList.contains('chilldivider-dashed'));
    d.setLineStyle('dotted');
    assert.ok(d.element.classList.contains('chilldivider-dotted'));
    assert.ok(!d.element.classList.contains('chilldivider-dashed'));
    d.setLineStyle('wavy');
    assert.ok(d.element.classList.contains('chilldivider-dotted'));
});

test('chilldivider gradient: default, colour list, unsafe values rejected', () => {
    const { lib } = load('chilldivider');
    const d = lib.create({ gradient: true });
    assert.ok(d.element.classList.contains('chilldivider-gradient'));
    assert.match(d.element.style.getPropertyValue('--chilldivider-gradient-full'), /linear-gradient\(to right, transparent/);
    const c = lib.create({ gradient: ['#3b82f6', '#ec4899'], orientation: 'vertical' });
    assert.match(c.element.style.getPropertyValue('--chilldivider-gradient-full'), /to bottom, #3b82f6, #ec4899/);
    const bad = lib.create({ gradient: ['url(http://evil)', 'red;}'], color: 'red;background:url(x)' });
    assert.match(bad.element.style.getPropertyValue('--chilldivider-gradient-full'), /transparent/);
    assert.equal(bad.element.style.getPropertyValue('--chilldivider-line'), '');
    d.setGradient(false);
    assert.ok(!d.element.classList.contains('chilldivider-gradient'));
    assert.equal(d.element.style.getPropertyValue('--chilldivider-gradient-full'), '');
});

test('chilldivider thickness, spacing, colour variables', () => {
    const { lib } = load('chilldivider');
    const d = lib.create({ thickness: 3, spacing: 'lg', color: '#ff0000' });
    assert.equal(d.element.style.getPropertyValue('--chilldivider-thickness'), '3px');
    assert.equal(d.element.style.getPropertyValue('--chilldivider-gap'), '24px');
    assert.equal(d.element.style.getPropertyValue('--chilldivider-line'), '#ff0000');
    const n = lib.create({ spacing: 5 });
    assert.equal(n.element.style.getPropertyValue('--chilldivider-gap'), '5px');
});

test('chilldivider change event + onChange + off', () => {
    const { lib } = load('chilldivider');
    const seen = [];
    const d = lib.create({ onChange: s => seen.push('cb:' + s.option) });
    const fn = e => seen.push('ev:' + e.option);
    d.on('change', fn);
    d.setOrientation('vertical');
    assert.deepEqual(seen, ['ev:orientation', 'cb:orientation']);
    assert.equal(d.element.getAttribute('aria-orientation'), 'vertical');
    d.off('change', fn);
    d.setLabel('x');
    assert.deepEqual(seen, ['ev:orientation', 'cb:orientation', 'cb:label']);
});

test('chilldivider init enhances <hr> and <div>, restores on destroy', () => {
    const { lib, document } = load('chilldivider');
    document.body.innerHTML = '<hr id="a" class="mine"><div id="b"></div>';
    const hr = document.getElementById('a');
    const hi = lib.init(hr, { lineStyle: 'dashed', label: 'ignored' });
    assert.ok(hr.classList.contains('chilldivider'));
    assert.equal(hr.querySelector('.chilldivider-label'), null);
    assert.equal(hr.getAttribute('role'), null); // native separator semantics
    assert.equal(hr.getAttribute('aria-orientation'), 'horizontal');
    hi.destroy();
    assert.equal(hr.getAttribute('class'), 'mine');
    assert.equal(hr.getAttribute('aria-orientation'), null);
    const div = document.getElementById('b');
    const di = lib.init(div, { label: 'Hi' });
    assert.equal(div.getAttribute('role'), 'separator');
    assert.equal(div.querySelector('.chilldivider-label').textContent, 'Hi');
    di.destroy();
    assert.equal(div.children.length, 0);
    assert.equal(div.getAttribute('role'), null);
    assert.ok(document.getElementById('b'));
    document.body.innerHTML = '<hr class="x"><hr class="x">';
    assert.equal(lib.init('.x').length, 2);
});
