const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));
const NOW = Date.UTC(2024, 5, 15, 12, 0, 0);
const f = (lib, offsetSec, o) => lib.format(NOW + offsetSec * 1000, Object.assign({ locale: 'en', now: NOW }, o));

test('SSR import safe and format works', () => {
    const lib = loadSSR('chillreltime');
    assert.equal(lib.format(Date.now() - 180000, { locale: 'en' }), '3 minutes ago');
});

test('past / future across units (en)', () => {
    const { lib } = load('chillreltime');
    assert.equal(f(lib, -3), 'now');
    assert.equal(f(lib, -30), '30 seconds ago');
    assert.equal(f(lib, -185), '3 minutes ago');
    assert.equal(f(lib, 185), 'in 3 minutes');
    assert.equal(f(lib, -2 * 3600 - 5), '2 hours ago');
    assert.equal(f(lib, -86400), 'yesterday');
    assert.equal(f(lib, 86400), 'tomorrow');
    assert.equal(f(lib, -3 * 86400), '3 days ago');
    assert.equal(f(lib, -14 * 86400), '2 weeks ago');
    assert.equal(f(lib, -45 * 86400), 'last month');
    assert.equal(f(lib, 90 * 86400), 'in 2 months');
    assert.equal(f(lib, -400 * 86400), 'last year');
    assert.equal(f(lib, 800 * 86400), 'in 2 years');
});

test('options: numeric always, style short, nowThreshold, locale', () => {
    const { lib } = load('chillreltime');
    assert.equal(f(lib, -86400, { numeric: 'always' }), '1 day ago');
    assert.equal(f(lib, -3, { numeric: 'always' }), '3 seconds ago');
    assert.equal(f(lib, -185, { style: 'short' }), '3 min. ago');
    assert.equal(f(lib, -8, { nowThreshold: 10 }), 'now');
    assert.equal(f(lib, 86400, { locale: 'id' }), 'besok');
    assert.equal(f(lib, -86400, { locale: 'es' }), 'ayer');
});

test('invalid values give empty string; parse accepts ISO, epoch, Date', () => {
    const { lib } = load('chillreltime');
    assert.equal(lib.format('garbage'), '');
    assert.equal(lib.format(null), '');
    assert.equal(lib.absolute(undefined), '');
    assert.equal(lib.parse('2024-06-15T12:00:00Z').getTime(), NOW);
    assert.equal(lib.parse(String(NOW)).getTime(), NOW);
    assert.equal(lib.parse(new Date(NOW)).getTime(), NOW);
    assert.equal(lib.parse('nope'), null);
});

test('maxRelativeDays switches to absolute date', () => {
    const { lib } = load('chillreltime');
    const out = f(lib, -40 * 86400, { maxRelativeDays: 30, absolute: { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } });
    assert.equal(out, 'May 6, 2024');
    assert.equal(f(lib, -10 * 86400, { maxRelativeDays: 30 }), 'last week');
});

test('init enhances <time> and [data-chill-reltime]: text, title tooltip, datetime attr', () => {
    const { lib, document } = load('chillreltime');
    const iso = new Date(NOW - 5 * 60000).toISOString();
    document.body.innerHTML = `<time id="t" datetime="${iso}">orig</time><span id="s" data-chill-reltime="${NOW - 7200000}">x</span><time id="bad" datetime="nope">keep</time>`;
    const inst = lib.init(null, { locale: 'en', now: NOW, update: false });
    const t = document.getElementById('t'), s = document.getElementById('s');
    assert.equal(t.textContent, '5 minutes ago');
    assert.ok(t.getAttribute('title').length > 5);
    assert.equal(s.textContent, '2 hours ago');
    assert.equal(document.getElementById('bad').textContent, 'keep');
    assert.equal(document.getElementById('bad').hasAttribute('title'), false);
    inst.destroy();
    assert.equal(t.textContent, 'orig');
    assert.equal(t.getAttribute('title'), null);
    assert.equal(s.textContent, 'x');
});

test('tooltip:false and element lang attribute is used as locale', () => {
    const { lib, document } = load('chillreltime');
    document.body.innerHTML = `<div lang="id"><time id="t" datetime="${new Date(NOW + 86400000).toISOString()}"></time></div>`;
    const inst = lib.init('#t', { now: NOW, tooltip: false, update: false });
    assert.equal(document.getElementById('t').textContent, 'besok');
    assert.equal(document.getElementById('t').hasAttribute('title'), false);
    inst.destroy();
});

test('auto-update re-renders on timer and stops after destroy; onUpdate called', async () => {
    const { lib, document } = load('chillreltime');
    let clock = NOW;
    document.body.innerHTML = `<time id="t" datetime="${new Date(NOW).toISOString()}"></time>`;
    const seen = [];
    const inst = lib.init('#t', { locale: 'en', now: () => clock, onUpdate: (el, t) => seen.push(t) });
    const t = document.getElementById('t');
    assert.equal(t.textContent, 'now');
    clock = NOW + 31000;
    await wait(1200);   // age < 60s => 1s tick
    try { assert.equal(t.textContent, '31 seconds ago'); } finally { inst.destroy(); }
    const n = seen.length;
    clock = NOW + 3600000;
    await wait(1200);
    assert.equal(seen.length, n);
});

test('refresh picks up new elements; removed elements are dropped on update', () => {
    const { lib, document } = load('chillreltime');
    document.body.innerHTML = `<time id="a" datetime="${new Date(NOW - 60000).toISOString()}"></time>`;
    const inst = lib.init(null, { locale: 'en', now: NOW, update: false });
    const b = document.createElement('time'); b.setAttribute('datetime', new Date(NOW - 120000).toISOString());
    document.body.appendChild(b);
    inst.refresh();
    assert.equal(b.textContent, '2 minutes ago');
    b.remove();
    inst.update();
    assert.equal(inst._records.size, 1);
    inst.destroy();
});

test('create returns <time> with datetime, text, title', () => {
    const { lib } = load('chillreltime');
    const el = lib.create(NOW - 3 * 3600000, { locale: 'en', now: NOW, update: false });
    assert.equal(el.tagName, 'TIME');
    assert.equal(el.getAttribute('datetime'), new Date(NOW - 3 * 3600000).toISOString());
    assert.equal(el.textContent, '3 hours ago');
    assert.ok(el.getAttribute('title'));
    assert.equal(lib.create('bad').textContent, '');
});

test('create with auto-update exposes destroy and cleans the shared timer', () => {
    const { lib } = load('chillreltime');
    const el = lib.create(NOW, { locale: 'en', now: NOW });
    assert.equal(typeof el.chillRelTime.destroy, 'function');
    el.chillRelTime.destroy();
});

test('diff helper', () => {
    const { lib } = load('chillreltime');
    const d = lib.diff(NOW - 180000, NOW);
    assert.equal(d.unit, 'minute'); assert.equal(d.value, -3);
});
