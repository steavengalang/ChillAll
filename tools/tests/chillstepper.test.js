const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const steps = () => [{ title: 'A', content: 'one' }, { title: 'B', optional: true }, { title: '<b>C</b>' }];

test('chillstepper semantics: role=list, aria-current=step, text escaped', () => {
    const { lib, document } = load('chillstepper');
    const st = lib.create({ steps: steps() });
    document.body.appendChild(st.element);
    assert.equal(document.querySelector('ol').getAttribute('role'), 'list');
    const cur = document.querySelectorAll('[aria-current="step"]');
    assert.equal(cur.length, 1);
    assert.match(cur[0].textContent, /A/);
    assert.equal(document.querySelector('.chillstepper b'), null);
    assert.equal(document.querySelectorAll('.chillstepper-upcoming').length, 2);
    st.destroy();
    assert.equal(document.querySelector('.chillstepper'), null);
});

test('chillstepper next/prev, done state and onChange', async () => {
    const { lib, document } = load('chillstepper');
    const changes = [];
    const st = lib.create({ steps: steps(), onChange: (i, p) => changes.push([i, p]) });
    document.body.appendChild(st.element);
    assert.equal(await st.next(), true);
    assert.equal(st.current, 1);
    assert.ok(document.querySelector('.chillstepper-done'));
    assert.equal(document.querySelector('[aria-current="step"]').closest('li').classList.contains('chillstepper-current'), true);
    await st.prev();
    assert.equal(st.current, 0);
    assert.deepEqual(changes, [[1, 0], [0, 1]]);
    st.destroy();
});

test('chillstepper linear mode blocks jumping ahead', async () => {
    const { lib } = load('chillstepper');
    const st = lib.create({ steps: steps(), linear: true });
    assert.equal(await st.goTo(2), false);
    assert.equal(st.current, 0);
    assert.equal(await st.goTo(1), true);
    assert.equal(await st.goTo(2), true);
    st.destroy();
});

test('chillstepper validation hook (async + string error) blocks and marks error', async () => {
    const { lib, document } = load('chillstepper');
    let ok = false;
    const st = lib.create({ steps: steps(), controls: true, validate: async (from) => ok ? true : 'Fill the form' });
    document.body.appendChild(st.element);
    const blocked = [];
    st.on('blocked', (f, t) => blocked.push([f, t]));
    assert.equal(await st.next(), false);
    assert.equal(st.current, 0);
    assert.ok(document.querySelector('.chillstepper-error'));
    assert.equal(document.querySelector('.chillstepper-error-msg').textContent, 'Fill the form');
    assert.deepEqual(blocked, [[0, 1]]);
    ok = true;
    assert.equal(await st.next(), true);
    assert.equal(document.querySelector('.chillstepper-error'), null);
    st.destroy();
});

test('chillstepper complete, reset, controls and clickable steps', async () => {
    const { lib, document } = load('chillstepper');
    let done = 0;
    const st = lib.create({ steps: steps(), controls: true, onComplete: () => done++ });
    document.body.appendChild(st.element);
    const btns = document.querySelectorAll('.chillstepper-btn');
    btns[2].click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(st.current, 2);
    assert.equal(document.querySelector('.chillstepper-action-primary').textContent, 'Finish');
    document.querySelector('.chillstepper-action-primary').click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(done, 1);
    assert.equal(document.querySelectorAll('.chillstepper-done').length, 3);
    st.reset();
    assert.equal(st.current, 0);
    assert.equal(document.querySelectorAll('.chillstepper-done').length, 0);
    st.destroy();
});
