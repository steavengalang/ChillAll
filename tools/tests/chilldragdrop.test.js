const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(options) {
    const env = load('chilldragdrop');
    const { document } = env;
    const ul = document.createElement('ul');
    ul.id = 'list';
    ['One', 'Two', 'Three'].forEach((t, i) => {
        const li = document.createElement('li');
        li.className = 'chilldragdrop-item';
        li.dataset.id = 'id' + i;
        li.textContent = t;
        ul.appendChild(li);
    });
    document.body.appendChild(ul);
    const events = { change: [], end: [] };
    const inst = env.lib.init('#list', Object.assign({
        onChange: o => events.change.push(Array.from(o.map(x => x.id))),
        onEnd: e => events.end.push([e.from, e.to])
    }, options));
    return Object.assign(env, { ul, inst, events });
}
const items = ul => Array.from(ul.children).map(c => c.textContent);
const key = (window, el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

test('items become focusable, draggable and announce instructions', () => {
    const { ul, inst } = setup();
    const li = ul.children[0];
    assert.equal(li.getAttribute('draggable'), 'true');
    assert.equal(li.tabIndex, 0);
    assert.equal(li.getAttribute('aria-roledescription'), 'sortable item');
    inst.destroy();
});

test('keyboard: space grabs, arrows move, space drops with announcements', () => {
    const { ul, inst, window, events, document } = setup();
    const first = ul.children[0];
    first.focus();
    key(window, first, ' ');
    const live = document.querySelector('.chilldragdrop-sr');
    assert.equal(live.getAttribute('aria-live'), 'assertive');
    assert.match(live.textContent, /One grabbed, position 1 of 3/);
    assert.equal(first.getAttribute('aria-pressed'), 'true');
    key(window, first, 'ArrowDown');
    assert.deepEqual(items(ul), ['Two', 'One', 'Three']);
    assert.match(live.textContent, /One moved to position 2 of 3/);
    key(window, first, 'ArrowDown');
    key(window, first, 'ArrowDown'); // already last
    assert.match(live.textContent, /already at position 3/);
    assert.deepEqual(items(ul), ['Two', 'Three', 'One']);
    key(window, first, ' ');
    assert.match(live.textContent, /One dropped at position 3 of 3/);
    assert.deepEqual(events.end, [[0, 2]]);
    assert.deepEqual(events.change, [['id1', 'id2', 'id0']]);
    assert.equal(first.getAttribute('aria-pressed'), null);
    inst.destroy();
});

test('keyboard: Escape restores original position and fires no change', () => {
    const { ul, inst, window, events } = setup();
    const second = ul.children[1];
    key(window, second, 'Enter');
    key(window, second, 'ArrowUp');
    assert.deepEqual(items(ul), ['Two', 'One', 'Three']);
    key(window, second, 'Escape');
    assert.deepEqual(items(ul), ['One', 'Two', 'Three']);
    assert.equal(events.change.length, 0);
    inst.destroy();
});

test('arrow keys do nothing when not grabbed', () => {
    const { ul, inst, window } = setup();
    key(window, ul.children[0], 'ArrowDown');
    assert.deepEqual(items(ul), ['One', 'Two', 'Three']);
    inst.destroy();
});

test('keyboard:false disables key reordering and tabindex', () => {
    const { ul, inst, window } = setup({ keyboard: false });
    assert.equal(ul.children[0].hasAttribute('tabindex'), false);
    key(window, ul.children[0], ' ');
    key(window, ul.children[0], 'ArrowDown');
    assert.deepEqual(items(ul), ['One', 'Two', 'Three']);
    inst.destroy();
});

test('pointer drag: no listener duplication across drags, onChange once per drag', () => {
    const { ul, inst, window, events } = setup();
    const drag = (el) => el.dispatchEvent(new window.Event('dragstart', { bubbles: true, cancelable: true }));
    for (let i = 0; i < 3; i++) {
        const el = ul.children[0];
        drag(el);
        assert.ok(window.document.querySelector('.chilldragdrop-ghost'));
        const target = ul.children[2];
        target.getBoundingClientRect = () => ({ top: 0, height: 10, left: 0, width: 10 });
        const ev = new window.Event('dragover', { bubbles: true, cancelable: true });
        ev.clientY = 100; ev.clientX = 0;
        target.dispatchEvent(ev);
        el.dispatchEvent(new window.Event('dragend', { bubbles: true }));
        assert.equal(window.document.querySelector('.chilldragdrop-ghost'), null);
    }
    assert.equal(events.end.length, 3);
    assert.equal(events.change.length, 3);
    assert.deepEqual(events.end[0], [0, 2]);
    inst.destroy();
});

test('handle option gates native drag', () => {
    const { lib, document, window } = load('chilldragdrop');
    const ul = document.createElement('ul'); ul.id = 'l'; document.body.appendChild(ul);
    for (let i = 0; i < 2; i++) {
        const li = document.createElement('li'); li.className = 'chilldragdrop-item';
        li.innerHTML = '<span class="grip">::</span><span class="body">x</span>'; ul.appendChild(li);
    }
    const inst = lib.init('#l', { handle: '.grip' });
    const li = ul.children[0];
    assert.equal(li.getAttribute('draggable'), 'false');
    li.querySelector('.body').dispatchEvent(new window.Event('mousedown', { bubbles: true }));
    assert.equal(li.getAttribute('draggable'), 'false');
    li.querySelector('.grip').dispatchEvent(new window.Event('mousedown', { bubbles: true }));
    assert.equal(li.getAttribute('draggable'), 'true');
    const ev = new window.Event('dragstart', { bubbles: true, cancelable: true });
    li.querySelector('.grip').dispatchEvent(ev);
    assert.equal(document.querySelectorAll('.chilldragdrop-ghost').length, 1);
    li.dispatchEvent(new window.Event('dragend', { bubbles: true }));
    assert.equal(li.getAttribute('draggable'), 'false');
    inst.destroy();
});

test('destroy removes attributes, live region, listeners and ghost', () => {
    const { ul, inst, window, document, events } = setup();
    ul.children[0].dispatchEvent(new window.Event('dragstart', { bubbles: true, cancelable: true }));
    inst.destroy();
    assert.equal(document.querySelector('.chilldragdrop-sr'), null);
    assert.equal(document.querySelector('.chilldragdrop-ghost'), null);
    assert.equal(ul.children[0].hasAttribute('draggable'), false);
    assert.equal(ul.children[0].hasAttribute('tabindex'), false);
    key(window, ul.children[0], ' ');
    key(window, ul.children[0], 'ArrowDown');
    assert.deepEqual(items(ul), ['One', 'Two', 'Three']);
    assert.equal(events.change.length, 0);
});

test('dynamically added items are picked up (MutationObserver) ', async () => {
    const { ul, inst, document } = setup();
    const li = document.createElement('li');
    li.className = 'chilldragdrop-item';
    li.textContent = 'Four';
    ul.appendChild(li);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(li.getAttribute('draggable'), 'true');
    inst.destroy();
});

test('dragdrop css dark override', () => {
    const { document, inst } = setup();
    const css = document.getElementById('chilldragdrop-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /prefers-reduced-motion/);
    inst.destroy();
});
