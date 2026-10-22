const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const mk = o => load('chillevents').lib.create(o);

test('on/emit/off returns unsubscribe', () => {
    const bus = mk(); const got = [];
    const off = bus.on('a', (p, e) => got.push([p, e]));
    assert.equal(bus.emit('a', 1), true);
    off();
    assert.equal(bus.emit('a', 2), false);
    assert.equal(got.length, 1);
    assert.equal(got[0][0], 1); assert.equal(got[0][1], 'a');
});

test('once fires once; off(event, fn) and off(event)', () => {
    const bus = mk(); let n = 0;
    bus.once('x', () => n++);
    bus.emit('x'); bus.emit('x');
    assert.equal(n, 1);
    const f = () => n++;
    bus.on('y', f); bus.on('y', () => n++);
    bus.off('y', f); bus.emit('y');
    assert.equal(n, 2);
    bus.off('y'); assert.equal(bus.has('y'), false);
});

test('wildcards: user:* and *', () => {
    const bus = mk(); const seen = [];
    bus.on('user:*', (p, e) => seen.push('u' + e));
    bus.on('*', (p, e) => seen.push('all' + e));
    bus.emit('user:login'); bus.emit('other'); bus.emit('user:a:b');
    assert.equal(seen.join('|'), 'uuser:login|alluser:login|allother|alluser:a:b');
});

test('throwing handler does not stop others and goes to onError', () => {
    const errs = []; const bus = mk({ onError: (e, ev) => errs.push(ev) });
    let ok = false;
    bus.on('e', () => { throw new Error('x'); });
    bus.on('e', () => { ok = true; });
    bus.emit('e');
    assert.ok(ok); assert.deepEqual(errs.slice(), ['e']);
});

test('handler removing itself during emit is safe', () => {
    const bus = mk(); let n = 0; let off;
    off = bus.on('e', () => { n++; off(); });
    bus.on('e', () => n++);
    bus.emit('e'); bus.emit('e');
    assert.equal(n, 3);
});

test('emitAsync awaits handlers sequentially and returns results', async () => {
    const bus = mk(); const order = [];
    bus.on('s', async () => { await new Promise(r => setTimeout(r, 20)); order.push(1); return 'a'; });
    bus.on('s', () => { order.push(2); return 'b'; });
    const res = await bus.emitAsync('s');
    assert.equal(order.join(), '1,2');
    assert.equal(res.join(), 'a,b');
});

test('validation, counts, clear, destroy', () => {
    const bus = mk();
    assert.throws(() => bus.on('', () => {}), { name: 'TypeError' });
    assert.throws(() => bus.on('a', 'nope'), { name: 'TypeError' });
    bus.on('a', () => {}); bus.on('b', () => {}); bus.on('c:*', () => {});
    assert.equal(bus.listenerCount(), 3);
    assert.equal(bus.eventNames().length, 3);
    bus.clear(); assert.equal(bus.listenerCount(), 0);
    bus.on('a', () => {}); bus.destroy();
    assert.equal(bus.emit('a'), false);
});

test('global bus is shared', () => {
    const { lib } = load('chillevents');
    assert.equal(lib.global, lib.global);
});
