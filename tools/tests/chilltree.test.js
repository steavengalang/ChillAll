const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const nodes = () => [
    { id: 'src', label: 'src', children: [{ id: 'a', label: 'alpha.js' }, { id: 'b', label: 'beta.js' }] },
    { id: 'docs', label: 'docs', children: [{ id: 'r', label: 'readme' }] },
    { id: 'leaf', label: 'LICENSE' }
];
const key = (window, el, k, extra) => el.dispatchEvent(new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));
const tick = () => new Promise(r => setTimeout(r, 5));

test('chilltree ARIA roles, levels and escape', () => {
    const { lib, document } = load('chilltree');
    const t = lib.create({ nodes: [{ id: 'x', label: '<img src=x onerror=1>', children: [{ id: 'y', label: 'c' }] }] });
    document.body.appendChild(t.element);
    assert.equal(document.querySelector('[role=tree]').tagName, 'UL');
    const items = document.querySelectorAll('[role=treeitem]');
    assert.equal(items.length, 2);
    assert.equal(items[0].getAttribute('aria-expanded'), 'false');
    assert.equal(items[1].getAttribute('aria-level'), '2');
    assert.equal(items[1].hasAttribute('aria-expanded'), false);
    assert.equal(document.querySelector('.chilltree img'), null);
    assert.ok(document.querySelector('[role=group]'));
    t.destroy();
    assert.equal(document.querySelector('.chilltree'), null);
});

test('chilltree expand/collapse by click and keyboard (WAI-ARIA)', () => {
    const { lib, document, window } = load('chilltree');
    const t = lib.create({ nodes: nodes() });
    document.body.appendChild(t.element);
    const li = id => document.querySelector('[data-id="' + id + '"]');
    // roving tabindex
    assert.equal(li('src').tabIndex, 0);
    assert.equal(li('docs').tabIndex, -1);
    li('src').focus();
    key(window, li('src'), 'ArrowRight');
    assert.equal(li('src').getAttribute('aria-expanded'), 'true');
    key(window, li('src'), 'ArrowRight');           // moves to first child
    assert.equal(document.activeElement, li('a'));
    key(window, li('a'), 'ArrowDown');
    assert.equal(document.activeElement, li('b'));
    key(window, li('b'), 'ArrowLeft');              // leaf -> parent
    assert.equal(document.activeElement, li('src'));
    key(window, li('src'), 'End');
    assert.equal(document.activeElement, li('leaf'));
    key(window, li('leaf'), 'Home');
    assert.equal(document.activeElement, li('src'));
    key(window, li('src'), 'ArrowLeft');
    assert.equal(li('src').getAttribute('aria-expanded'), 'false');
    key(window, li('src'), 'ArrowDown');
    assert.equal(document.activeElement, li('docs'));  // collapsed children skipped
    key(window, li('docs'), 'l');                      // type-ahead
    assert.equal(document.activeElement, li('leaf'));
    li('docs').querySelector('.chilltree-toggle').click();
    assert.equal(li('docs').getAttribute('aria-expanded'), 'true');
    t.destroy();
});

test('chilltree tri-state checkboxes cascade', () => {
    const { lib, document } = load('chilltree');
    const checks = [];
    const t = lib.create({ nodes: nodes(), checkable: true, expandAll: true, onCheck: ids => checks.push(ids) });
    document.body.appendChild(t.element);
    const li = id => document.querySelector('[data-id="' + id + '"]');
    assert.equal(li('src').getAttribute('aria-checked'), 'false');
    li('a').querySelector('.chilltree-check').click();
    assert.equal(li('a').getAttribute('aria-checked'), 'true');
    assert.equal(li('src').getAttribute('aria-checked'), 'mixed');
    li('b').querySelector('.chilltree-check').click();
    assert.equal(li('src').getAttribute('aria-checked'), 'true');
    li('src').querySelector('.chilltree-check').click();   // uncheck parent -> all children
    assert.equal(li('a').getAttribute('aria-checked'), 'false');
    t.setChecked('docs', true);
    assert.equal(li('r').getAttribute('aria-checked'), 'true');
    assert.deepEqual(Array.from(t.getChecked()).sort(), ['docs', 'r']);
    assert.ok(checks.length >= 4);
    t.destroy();
});

test('chilltree lazy children loader', async () => {
    const { lib, document } = load('chilltree');
    let calls = 0; const loaded = [];
    const t = lib.create({
        nodes: [{ id: 'remote', label: 'Remote', hasChildren: true }],
        loadChildren: async () => { calls++; return [{ id: 'c1', label: 'one' }, { id: 'c2', label: 'two' }]; },
        onLoad: (n, ch) => loaded.push(ch.length)
    });
    document.body.appendChild(t.element);
    const li = document.querySelector('[data-id="remote"]');
    assert.equal(li.getAttribute('aria-expanded'), 'false');
    t.expand('remote');
    assert.equal(li.getAttribute('aria-busy'), 'true');
    await tick();
    assert.equal(calls, 1);
    assert.deepEqual(loaded, [2]);
    assert.equal(li.getAttribute('aria-expanded'), 'true');
    assert.equal(li.querySelectorAll('[role=treeitem]').length, 2);
    t.collapse('remote'); t.expand('remote');
    assert.equal(calls, 1);
    t.destroy();
});

test('chilltree lazy loader error is reported', async () => {
    const { lib } = load('chilltree');
    const errs = [];
    const t = lib.create({ nodes: [{ id: 'r', label: 'R', hasChildren: true }], loadChildren: () => Promise.reject(new Error('boom')), onError: (n, e) => errs.push(e.message) });
    t.expand('r');
    await tick();
    assert.deepEqual(errs, ['boom']);
    t.destroy();
});

test('chilltree filter shows matches with ancestors and highlights', () => {
    const { lib, document, window } = load('chilltree');
    const t = lib.create({ nodes: nodes(), searchable: true });
    document.body.appendChild(t.element);
    const input = document.querySelector('.chilltree-search');
    input.value = 'beta';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const li = id => document.querySelector('[data-id="' + id + '"]');
    assert.equal(li('b').hidden, false);
    assert.equal(li('a').hidden, true);
    assert.equal(li('src').hidden, false);            // ancestor kept
    assert.equal(li('docs').hidden, true);
    assert.equal(li('src').querySelector('.chilltree-group').hidden, false);
    assert.equal(document.querySelector('mark').textContent, 'beta');
    t.filter('zzz');
    assert.equal(document.querySelector('.chilltree-empty').hidden, false);
    t.filter('');
    assert.equal(li('a').hidden, false);
    assert.equal(document.querySelector('mark'), null);
    t.destroy();
});

test('chilltree select and init from nested list', () => {
    const { lib, document } = load('chilltree');
    document.body.innerHTML = '<ul id="t"><li>One<ul><li>Two</li></ul></li><li>Three</li></ul>';
    const sel = [];
    const t = lib.init('#t', { onSelect: n => sel.push(n.label), expandAll: true });
    const items = document.querySelectorAll('[role=treeitem]');
    assert.equal(items.length, 3);
    items[1].querySelector('.chilltree-row').click();
    assert.deepEqual(sel, ['Two']);
    assert.equal(items[1].getAttribute('aria-selected'), 'true');
    assert.equal(t.getSelected().length, 1);
    t.destroy();
});
