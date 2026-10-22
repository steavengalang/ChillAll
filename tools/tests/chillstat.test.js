const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const wait = ms => new Promise(r => setTimeout(r, ms));

test('chillstat renders label/value/prefix and escapes text', () => {
    const { lib, document } = load('chillstat');
    const s = lib.create({ label: '<b>Rev</b>', value: 1234567, prefix: '$', suffix: 'k' });
    document.body.appendChild(s.element);
    assert.equal(document.querySelector('.chillstat b'), null);
    assert.equal(document.querySelector('.chillstat-label').textContent, '<b>Rev</b>');
    assert.match(document.querySelector('.chillstat-value').textContent, /^\$1.234.567k$/);
    assert.equal(s.element.getAttribute('role'), 'group');
    s.destroy();
    assert.equal(document.querySelector('.chillstat'), null);
});

test('chillstat delta direction, invertDelta and screen-reader text', () => {
    const { lib, document } = load('chillstat');
    const up = lib.create({ value: 1, delta: 12.5, deltaLabel: 'vs last month' });
    document.body.appendChild(up.element);
    assert.ok(up.element.querySelector('.chillstat-delta-up.chillstat-delta-good'));
    assert.match(up.element.querySelector('.chillstat-delta').textContent, /Increased by 12.5%/);
    assert.equal(up.element.querySelector('.chillstat-delta-note').textContent, 'vs last month');
    const down = lib.create({ value: 1, delta: -3 });
    assert.ok(down.element.querySelector('.chillstat-delta-down.chillstat-delta-bad'));
    const inv = lib.create({ value: 1, delta: -3, invertDelta: true });
    assert.ok(inv.element.querySelector('.chillstat-delta-down.chillstat-delta-good'));
    const none = lib.create({ value: 1 });
    assert.equal(none.element.querySelector('.chillstat-delta'), null);
    [up, down, inv, none].forEach(x => x.destroy());
});

test('chillstat custom formatter and update()', () => {
    const { lib, document } = load('chillstat');
    const s = lib.create({ value: 5, formatter: v => v + ' pts' });
    document.body.appendChild(s.element);
    assert.equal(s.element.querySelector('.chillstat-value').textContent, '5 pts');
    s.update({ value: 9, delta: 1 });
    assert.equal(s.element.querySelector('.chillstat-value').textContent, '9 pts');
    assert.ok(s.element.querySelector('.chillstat-delta'));
    s.destroy();
});

test('chillstat sparkline SVG (line, area, bar) with a11y label', () => {
    const { lib, document } = load('chillstat');
    const s = lib.create({ value: 1, sparkline: [1, 3, 2, 5] });
    document.body.appendChild(s.element);
    const svg = s.element.querySelector('svg');
    assert.equal(svg.getAttribute('role'), 'img');
    assert.match(svg.getAttribute('aria-label'), /4 points/);
    assert.ok(svg.querySelector('polyline'));
    assert.ok(svg.querySelector('polygon'));
    s.update({ sparklineType: 'line' });
    assert.equal(s.element.querySelector('polygon'), null);
    s.update({ sparklineType: 'bar' });
    assert.equal(s.element.querySelectorAll('rect').length, 4);
    s.update({ sparkline: [1] });
    assert.equal(s.element.querySelector('svg'), null);
    s.destroy();
});

test('chillstat count-up animates to the final value and stops on destroy', async () => {
    const { lib, document } = load('chillstat');
    const s = lib.create({ value: 1000, countUp: 60, locale: 'en-US' });
    document.body.appendChild(s.element);
    const el = s.element.querySelector('.chillstat-value');
    assert.equal(el.textContent, '0');
    await wait(150);
    assert.equal(el.textContent, '1,000');
    const s2 = lib.create({ value: 500, countUp: 5000 });
    document.body.appendChild(s2.element);
    await wait(30);
    s2.destroy();
    const dead = s2.element.textContent;
    await wait(50);
    assert.equal(s2.element.textContent, dead);
    s.destroy();
});

test('chillstat count-up is skipped for reduced motion; loading shows skeleton; click is keyboard accessible', async () => {
    const { lib, document, window } = load('chillstat');
    window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    const s = lib.create({ value: 42, countUp: true, loading: true, onClick: () => { clicks++; } });
    let clicks = 0;
    document.body.appendChild(s.element);
    assert.equal(s.element.querySelector('.chillstat-value').textContent, '42');
    assert.ok(s.element.classList.contains('chillstat-skeleton'));
    assert.equal(s.element.getAttribute('aria-busy'), 'true');
    s.setLoading(false);
    assert.equal(s.element.classList.contains('chillstat-skeleton'), false);
    assert.equal(s.element.getAttribute('role'), 'button');
    s.element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    s.element.click();
    assert.equal(clicks, 2);
    s.destroy();
});
