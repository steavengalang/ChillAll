const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const P = () => load('chillprovider').lib;

test('SSR import safe', () => { assert.ok(loadSSR('chillprovider').create); });

test('get / set / dotted paths / has', () => {
    const lib = P();
    const p = lib.create('t', { a: 1, nested: { x: { y: 2 } } });
    assert.equal(p.get('a'), 1);
    assert.equal(p.get('nested.x.y'), 2);
    assert.equal(p.get('nope'), undefined);
    assert.equal(p.get('nested.nope.y'), undefined);
    assert.equal(p.has('a'), true); assert.equal(p.has('zzz'), false);
    p.set('nested.x.z', 3);
    assert.equal(p.get('nested.x.z'), 3);
    p.set({ a: 5, b: 6 });
    assert.equal(p.get('a'), 5); assert.equal(p.get('b'), 6);
    assert.equal(Object.keys(p.get()).sort().join(), 'a,b,nested');
});

test('prototype pollution is impossible via set, merge and dotted paths', () => {
    const lib = P();
    const p = lib.create('x', {});
    p.set('__proto__.polluted', 1);
    p.set('constructor.prototype.polluted', 1);
    p.merge(JSON.parse('{"__proto__":{"polluted":true},"a":{"__proto__":{"polluted":true}}}'));
    p.set(JSON.parse('{"__proto__":{"polluted":true}}'));
    assert.equal({}.polluted, undefined);
    assert.equal(Object.getPrototypeOf(p.config) === null || Object.getPrototypeOf(Object.getPrototypeOf(p.config)) === null, true);
    assert.equal(p.get('__proto__.polluted'), undefined);
});

test('defaults are deep-cloned so reset really restores nested values', () => {
    const lib = P();
    const defaults = { n: { v: 1 } };
    const p = lib.create('r', defaults);
    p.set('n.v', 99);
    assert.equal(defaults.n.v, 1);
    p.reset();
    assert.equal(p.get('n.v'), 1);
    p.reset({ other: true });
    assert.equal(p.get('other'), true);
});

test('merge is deep and subscribers get (config, changedKeys); throwing listener is isolated', () => {
    const lib = P();
    const p = lib.create('m', { a: { b: 1 }, list: [1] });
    const calls = [];
    p.subscribe(() => { throw new Error('x'); });
    const off = p.subscribe((c, changed) => calls.push([JSON.stringify(c.a), changed && changed.join()]));
    p.merge({ a: { c: 2 }, list: [2, 3] });
    assert.equal(p.get('a.b'), 1); assert.equal(p.get('a.c'), 2);
    assert.equal(p.get('list').length, 2);
    assert.equal(calls[0][1], 'a,list');
    p.set('a.b', 5);
    assert.equal(calls[1][1], 'a.b');
    off();
    p.set('a.b', 6);
    assert.equal(calls.length, 2);
    p.reset();
    assert.equal(calls.length, 2);
});

test('subscribe immediate and validation', () => {
    const lib = P();
    const p = lib.create('s', { a: 1 });
    let n = 0;
    p.subscribe(() => n++, { immediate: true });
    assert.equal(n, 1);
    assert.throws(() => p.subscribe('nope'), { name: 'TypeError' });
});

test('registry: create replaces + destroys old, get/has/names/remove', () => {
    const lib = P();
    const a = lib.create('same', { v: 1 });
    let notified = 0; a.subscribe(() => notified++);
    const b = lib.create('same', { v: 2 });
    assert.notEqual(a, b);
    assert.equal(lib.get('same'), b);
    a.set('v', 3);                       // destroyed: no notification
    assert.equal(notified, 0);
    assert.equal(lib.has('same'), true);
    assert.equal(lib.names().join(), 'same');
    lib.remove('same');
    assert.equal(lib.get('same'), undefined);
    assert.equal(lib.has('same'), false);
});
