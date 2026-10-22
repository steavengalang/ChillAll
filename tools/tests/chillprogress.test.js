'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load, loadSSR, sourceFile } = require('../env');

const EVIL = '<img src=x onerror=alert(1)>';

function setup(opts) {
    const env = load('chillprogress');
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const p = env.lib.init('#host', opts);
    return { ...env, host, p };
}

test('SSR load does not throw', () => {
    assert.ok(loadSSR('chillprogress').version);
});

test('label is text (no XSS); labelHtml opt-in works', () => {
    const a = setup({ label: EVIL, value: 10 });
    assert.equal(a.document.querySelector('.chillprogress img'), null);
    assert.equal(a.document.querySelector('.chillprogress-label').textContent, EVIL);
    a.p.setLabel(EVIL);
    assert.equal(a.document.querySelector('.chillprogress img'), null);
    const b = setup({ labelHtml: '<b id="lb">x</b>' });
    assert.ok(b.document.querySelector('#lb'));
    const steps = load('chillprogress').lib.createSteps({ steps: [EVIL, 'b'], current: 0 });
    assert.equal(steps.querySelector('img'), null);
});

test('bar: ARIA progressbar attributes track the value', () => {
    const { p, document } = setup({ value: 25, label: 'Upload' });
    const bar = document.querySelector('[role="progressbar"]');
    assert.ok(bar);
    assert.equal(bar.getAttribute('aria-valuemin'), '0');
    assert.equal(bar.getAttribute('aria-valuemax'), '100');
    assert.equal(bar.getAttribute('aria-valuenow'), '25');
    assert.equal(bar.getAttribute('aria-valuetext'), '25%');
    assert.equal(bar.getAttribute('aria-labelledby'), document.querySelector('.chillprogress-label').id);
    p.setValue(80);
    assert.equal(bar.getAttribute('aria-valuenow'), '80');
    assert.equal(document.querySelector('.chillprogress-fill').style.width, '80%');
    assert.equal(document.querySelector('.chillprogress-value').textContent, '80%');
});

test('bar: unlabeled has aria-label; custom min/max, clamping, valueFormat', () => {
    const { p, document } = setup({ value: 5, min: 0, max: 20, valueFormat: (v) => `${v} of 20` });
    const bar = document.querySelector('[role="progressbar"]');
    assert.equal(bar.getAttribute('aria-label'), 'Progress');
    assert.equal(bar.getAttribute('aria-valuemax'), '20');
    assert.equal(bar.getAttribute('aria-valuetext'), '5 of 20');
    assert.equal(document.querySelector('.chillprogress-fill').style.width, '25%');
    p.setValue(500);
    assert.equal(document.querySelector('.chillprogress-fill').style.width, '100%');
    assert.equal(bar.getAttribute('aria-valuenow'), '20');
    p.setValue(-5);
    assert.equal(document.querySelector('.chillprogress-fill').style.width, '0%');
    assert.equal(p.getValue(), -5);
});

test('indeterminate: no aria-valuenow, class toggles back and forth', () => {
    const { p, document } = setup({ indeterminate: true, label: 'Loading' });
    const bar = document.querySelector('[role="progressbar"]');
    assert.equal(bar.hasAttribute('aria-valuenow'), false);
    assert.equal(bar.getAttribute('aria-busy'), 'true');
    assert.ok(p.container.classList.contains('chillprogress-indeterminate'));
    assert.equal(document.querySelector('.chillprogress-value').textContent, '');
    p.setIndeterminate(false);
    p.setValue(40);
    assert.equal(bar.getAttribute('aria-valuenow'), '40');
    assert.ok(!p.container.classList.contains('chillprogress-indeterminate'));
});

test('colors: named classes, custom CSS colour, switching', () => {
    const { p } = setup({ value: 1, color: 'success' });
    assert.ok(p.container.classList.contains('chillprogress-success'));
    p.setColor('#8b5cf6');
    assert.ok(!p.container.classList.contains('chillprogress-success'));
    assert.equal(p.container.style.getPropertyValue('--chillprogress-fill'), '#8b5cf6');
    p.setColor('primary');
    assert.equal(p.container.style.getPropertyValue('--chillprogress-fill'), '');
});

test('circle variant: SVG ring, dashoffset, value label, sizes, colours, ARIA', () => {
    const { p, document } = setup({ variant: 'circle', value: 25, size: 'lg', label: 'Disk', color: 'warning' });
    const ring = document.querySelector('.chillprogress-circle');
    assert.ok(ring);
    assert.equal(ring.style.width, '120px');
    assert.ok(ring.classList.contains('chillprogress-warning'));
    assert.equal(ring.getAttribute('role'), 'progressbar');
    assert.equal(ring.getAttribute('aria-valuenow'), '25');
    assert.equal(ring.getAttribute('aria-labelledby'), document.querySelector('.chillprogress-label').id);
    const fill = ring.querySelector('.chillprogress-circle-fill');
    const c = parseFloat(fill.getAttribute('stroke-dasharray'));
    assert.ok(Math.abs(parseFloat(fill.getAttribute('stroke-dashoffset')) - c * 0.75) < 0.01);
    assert.equal(ring.querySelector('.chillprogress-circle-text').textContent, '25%');
    assert.equal(ring.querySelector('svg').getAttribute('aria-hidden'), 'true');
    p.setValue(100);
    assert.ok(Math.abs(parseFloat(fill.getAttribute('stroke-dashoffset'))) < 0.01);
    assert.equal(ring.querySelector('.chillprogress-circle-text').textContent, '100%');
    const num = setup({ variant: 'circle', size: 64 });
    assert.equal(num.document.querySelector('.chillprogress-circle').style.width, '64px');
    const ind = setup({ variant: 'circle', indeterminate: true });
    assert.ok(ind.document.querySelector('.chillprogress-circle').classList.contains('chillprogress-indeterminate'));
    assert.equal(ind.document.querySelector('.chillprogress-circle').hasAttribute('aria-valuenow'), false);
});

test('createCircle (legacy) still works and has aria + setValue', () => {
    const { lib } = load('chillprogress');
    const el = lib.createCircle({ value: 50, size: 100 });
    assert.ok(el.classList.contains('chillprogress-circle'));
    assert.equal(el.getAttribute('role'), 'progressbar');
    assert.equal(el.getAttribute('aria-valuenow'), '50');
    assert.equal(el.querySelector('.chillprogress-circle-text').textContent, '50%');
    el.setValue(75);
    assert.equal(el.getAttribute('aria-valuenow'), '75');
    assert.equal(el.querySelector('.chillprogress-circle-text').textContent, '75%');
    assert.equal(lib.createCircle({ showValue: false }).querySelector('.chillprogress-circle-text'), null);
});

test('createSteps: list semantics, aria-current, completed text, setCurrent', () => {
    const { lib } = load('chillprogress');
    const el = lib.createSteps({ steps: ['Cart', 'Pay', 'Done'], current: 1 });
    assert.equal(el.getAttribute('role'), 'list');
    const items = Array.from(el.querySelectorAll('.chillprogress-step'));
    assert.equal(items.length, 3);
    assert.ok(items[0].classList.contains('completed'));
    assert.equal(items[1].getAttribute('aria-current'), 'step');
    assert.equal(items[2].getAttribute('aria-current'), null);
    assert.match(items[0].querySelector('.chillprogress-sr').textContent, /completed/);
    el.setCurrent(2);
    assert.equal(items[2].getAttribute('aria-current'), 'step');
    assert.equal(items[1].getAttribute('aria-current'), null);
    assert.ok(items[1].classList.contains('completed'));
});

test('onChange / onComplete / events fire once appropriately', () => {
    const log = [];
    const { p } = setup({ value: 0, onChange: (v, pct) => log.push(['c', v, pct]), onComplete: () => log.push(['done']) });
    let ev = 0;
    p.on('complete', () => ev++);
    p.setValue(50);
    p.setValue(100);
    p.setValue(100);
    p.setValue(30);
    p.setValue(100);
    assert.equal(JSON.stringify(log), JSON.stringify([['c', 50, 50], ['c', 100, 100], ['done'], ['c', 30, 30], ['c', 100, 100], ['done']]));
    assert.equal(ev, 2);
});

test('destroy removes DOM and restores the original element; setValue after destroy is a no-op', () => {
    const { p, document, host } = setup({ value: 10 });
    assert.equal(document.getElementById('host'), null);
    p.destroy();
    assert.equal(document.querySelector('.chillprogress'), null);
    assert.equal(document.getElementById('host'), host);
    p.setValue(50);
    p.destroy();
});

test('CSS: dark theme override, reduced motion covers all animations, injected once', () => {
    const { document, lib } = setup({ value: 1 });
    lib.createCircle({});
    assert.equal(document.querySelectorAll('#chillprogress-styles').length, 1);
    const css = document.getElementById('chillprogress-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    const rm = css.slice(css.indexOf('prefers-reduced-motion'));
    assert.match(rm, /chillprogress-animated/);
    assert.match(rm, /chillprogress-indeterminate/);
});

test('src declares window.ChillProgress', () => {
    assert.match(fs.readFileSync(sourceFile('chillprogress'), 'utf8'), /window\.ChillProgress\s*=/);
});
