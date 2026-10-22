const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('chilltimeline renders list semantics and escapes text', () => {
    const { lib, document } = load('chilltimeline');
    const tl = lib.create({ items: [{ title: '<img src=x onerror=alert(1)>', time: '9:00', status: 'success' }, { title: 'b' }] });
    document.body.appendChild(tl.element);
    assert.equal(tl.element.getAttribute('role'), 'list');
    assert.equal(document.querySelectorAll('.chilltimeline-item').length, 2);
    assert.equal(document.querySelector('img'), null);
    assert.ok(document.querySelector('.chilltimeline-status-success'));
    tl.destroy();
    assert.equal(document.querySelector('.chilltimeline'), null);
});

test('chilltimeline collapsible items toggle with aria-expanded', () => {
    const { lib, document } = load('chilltimeline');
    const calls = [];
    const tl = lib.create({ items: [{ title: 'a', content: 'body', collapsible: true }], onToggle: (i, idx, open) => calls.push(open) });
    document.body.appendChild(tl.element);
    const btn = document.querySelector('.chilltimeline-toggle');
    const body = document.querySelector('.chilltimeline-body');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(body.hidden, true);
    btn.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.equal(body.hidden, false);
    tl.toggle(0, false);
    assert.deepEqual(calls, [true, false]);
    tl.expandAll();
    assert.equal(body.hidden, false);
    tl.destroy();
});

test('chilltimeline layouts, events and init on existing list', () => {
    const { lib, document } = load('chilltimeline');
    document.body.innerHTML = '<ul id="x" class="mine"><li data-status="danger">One</li><li>Two</li></ul>';
    const tl = lib.init('#x', { layout: 'horizontal' });
    const ul = document.getElementById('x');
    assert.ok(ul.classList.contains('chilltimeline-horizontal'));
    assert.equal(ul.children.length, 2);
    assert.ok(ul.children[0].classList.contains('chilltimeline-status-danger'));
    tl.setLayout('alternate');
    assert.ok(ul.classList.contains('chilltimeline-alternate'));
    let clicked = null;
    tl.on('itemClick', (it, i) => { clicked = i; });
    ul.children[1].click();
    assert.equal(clicked, 1);
    tl.destroy();
    assert.equal(ul.className, 'mine');
    assert.equal(ul.children.length, 0);
});
