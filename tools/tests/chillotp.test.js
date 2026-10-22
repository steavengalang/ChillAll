'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function typeChar(w, inp, ch) {
    // simulate a browser: keydown, then (if not prevented) value set + input
    const kd = new w.KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true });
    inp.dispatchEvent(kd);
    if (kd.defaultPrevented) return;
    inp.value = ch;
    inp.dispatchEvent(new w.Event('input', { bubbles: true }));
}
function press(w, inp, key) {
    const kd = new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    inp.dispatchEvent(kd);
}
function paste(w, inp, text) {
    const ev = new w.Event('paste', { bubbles: true, cancelable: true });
    ev.clipboardData = { getData: () => text };
    inp.dispatchEvent(ev);
    return ev;
}

test('chillotp creates N inputs with ARIA and destroys', () => {
    const { lib, document } = load('chillotp');
    const o = lib.create({ length: 4, container: document.body });
    const ins = document.querySelectorAll('.chillotp-input');
    assert.equal(ins.length, 4);
    assert.equal(ins[0].getAttribute('autocomplete'), 'one-time-code');
    assert.equal(ins[0].getAttribute('inputmode'), 'numeric');
    assert.equal(document.querySelector('.chillotp').getAttribute('role'), 'group');
    assert.match(ins[2].getAttribute('aria-label'), /3 of 4/);
    o.destroy();
    assert.equal(document.querySelector('.chillotp'), null);
});

test('chillotp typing auto-advances, filters by type and fires onComplete once', () => {
    const { lib, window, document } = load('chillotp');
    const completes = []; const changes = [];
    const o = lib.create({ length: 3, container: document.body, onComplete: v => completes.push(v), onChange: v => changes.push(v) });
    const ins = document.querySelectorAll('.chillotp-input');
    ins[0].focus();
    typeChar(window, ins[0], 'a');                 // rejected
    assert.equal(ins[0].value, '');
    typeChar(window, ins[0], '1');
    assert.equal(document.activeElement, ins[1]);
    typeChar(window, ins[1], '2');
    assert.equal(document.activeElement, ins[2]);
    assert.equal(completes.length, 0);
    typeChar(window, ins[2], '3');
    assert.deepEqual(completes, ['123']);
    assert.equal(o.getValue(), '123');
    assert.ok(o.isComplete());
    // overwrite a filled box does not re-fire complete with same state change? it fires change; complete only on transition
    typeChar(window, ins[2], '9');
    assert.equal(o.getValue(), '129');
    assert.equal(completes.length, 1);
    assert.deepEqual(changes.filter(Boolean).slice(0, 3), ['1', '12', '123']);
    o.destroy();
});

test('chillotp backspace clears then moves back', () => {
    const { lib, window, document } = load('chillotp');
    const o = lib.create({ length: 4, value: '12', container: document.body });
    const ins = document.querySelectorAll('.chillotp-input');
    ins[2].focus();
    press(window, ins[2], 'Backspace');       // empty -> previous cleared and focused
    assert.equal(ins[1].value, '');
    assert.equal(document.activeElement, ins[1]);
    assert.equal(o.getValue(), '1');
    press(window, ins[0], 'Backspace');       // filled -> cleared in place
    assert.equal(ins[0].value, '');
    assert.equal(document.activeElement === ins[0] || document.activeElement === ins[1], true);
    o.destroy();
});

test('chillotp arrow/Home/End navigation', () => {
    const { lib, window, document } = load('chillotp');
    const o = lib.create({ length: 4, container: document.body });
    const ins = document.querySelectorAll('.chillotp-input');
    ins[1].focus();
    press(window, ins[1], 'ArrowRight');
    assert.equal(document.activeElement, ins[2]);
    press(window, ins[2], 'ArrowLeft');
    assert.equal(document.activeElement, ins[1]);
    press(window, ins[1], 'End');
    assert.equal(document.activeElement, ins[3]);
    press(window, ins[3], 'Home');
    assert.equal(document.activeElement, ins[0]);
    o.destroy();
});

test('chillotp paste distributes characters, sanitises, and completes', () => {
    const { lib, window, document } = load('chillotp');
    const completes = [];
    const o = lib.create({ length: 6, container: document.body, onComplete: v => completes.push(v) });
    const ins = document.querySelectorAll('.chillotp-input');
    const ev = paste(window, ins[0], ' 12-34 56 ');
    assert.ok(ev.defaultPrevented);
    assert.equal(o.getValue(), '123456');
    assert.deepEqual(completes, ['123456']);
    // partial paste from a later box
    o.clear();
    paste(window, ins[3], '78');
    assert.equal(o.getValue(), '78');
    assert.equal(ins[3].value, '7');
    assert.equal(ins[4].value, '8');
    o.destroy();
});

test('chillotp alphanumeric + uppercase + mask', () => {
    const { lib, document } = load('chillotp');
    const o = lib.create({ length: 4, type: 'alphanumeric', uppercase: true, mask: true, container: document.body });
    o.setValue('ab1!2z');
    assert.equal(o.getValue(), 'AB12');
    const ins = document.querySelectorAll('.chillotp-input');
    assert.equal(ins[0].type, 'password');
    assert.equal(ins[0].getAttribute('inputmode'), 'text');
    o.destroy();
});

test('chillotp setValue silent, clear, setError, setDisabled, hidden input, groups', () => {
    const { lib, window, document } = load('chillotp');
    let n = 0;
    const o = lib.create({ length: 4, name: 'code', groupSize: 2, container: document.body, onChange: () => n++ });
    assert.equal(document.querySelectorAll('.chillotp-gap').length, 1);
    o.setValue('1234', true);
    assert.equal(n, 0);
    assert.equal(document.querySelector('input[name="code"]').value, '1234');
    o.clear();
    assert.equal(o.getValue(), '');
    assert.equal(n, 1);
    o.setError(true);
    assert.ok(document.querySelector('.chillotp-error'));
    assert.equal(document.querySelector('.chillotp-input').getAttribute('aria-invalid'), 'true');
    o.setDisabled(true);
    assert.ok([...document.querySelectorAll('.chillotp-input')].every(i => i.disabled));
    const ins = document.querySelectorAll('.chillotp-input');
    paste(window, ins[0], '9999');
    assert.equal(o.getValue(), '');
    o.destroy();
});

test('chillotp.init mounts and on() subscribes', () => {
    const { lib, document } = load('chillotp');
    document.body.innerHTML = '<div id="h"></div>';
    const o = lib.init('#h', { length: 2 });
    const got = [];
    const off = o.on('complete', v => got.push(v));
    o.setValue('12');
    off();
    o.setValue('3');
    o.setValue('34');
    assert.deepEqual(got, ['12']);
    assert.equal(document.querySelectorAll('#h .chillotp').length, 1);
    o.destroy();
});
