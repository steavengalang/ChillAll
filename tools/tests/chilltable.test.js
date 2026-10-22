const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const cols = [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age', align: 'right' }];
const rows = () => [{ name: 'Cleo', age: 30 }, { name: 'Ada', age: 5 }, { name: 'Bob', age: 100 }];
function mk(extra = {}) {
    const env = load('chilltable');
    const host = env.document.createElement('div');
    env.document.body.appendChild(host);
    const t = env.lib.create(host, Object.assign({ columns: cols, data: rows() }, extra));
    return Object.assign(env, { host, t });
}

test('renders table with scope, aria-sort, caption', () => {
    const { host, t } = mk({ caption: 'People' });
    assert.equal(host.querySelector('caption').textContent, 'People');
    const ths = host.querySelectorAll('th');
    assert.ok([...ths].every(th => th.getAttribute('scope') === 'col'));
    assert.equal(ths[0].getAttribute('aria-sort'), 'none');
    host.querySelector('th[data-key="age"] button').click();
    assert.equal(host.querySelector('th[data-key="age"]').getAttribute('aria-sort'), 'ascending');
    host.querySelector('th[data-key="age"] button').click();
    assert.equal(host.querySelector('th[data-key="age"]').getAttribute('aria-sort'), 'descending');
    assert.equal(host.querySelector('tbody tr td').textContent, 'Bob');
    t.destroy();
});

test('numeric sort is numeric, not lexical', () => {
    const { t, host } = mk();
    t.sortBy('age', 'asc');
    assert.deepEqual([...host.querySelectorAll('tbody tr')].map(r => r.children[1].textContent), ['5', '30', '100']);
});

test('XSS: cell values and labels are escaped by default; html opt-in works', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { host, window, t } = mk({
        columns: [{ key: 'a', label: evil }, { key: 'b', label: 'B', render: v => '<b>' + v + '</b>' }, { key: 'c', label: 'C', html: true }],
        data: [{ a: evil, b: evil, c: '<i id="ok">x</i>' }]
    });
    assert.equal(host.querySelector('img'), null);
    assert.equal(host.querySelector('#ok') !== null, true);
    assert.equal(host.querySelector('tbody td').textContent, evil);
    assert.equal(window.__x, undefined);
    t.destroy();
});

test('render may return a Node', () => {
    const env = load('chilltable');
    const host = env.document.createElement('div');
    env.document.body.appendChild(host);
    env.lib.create(host, {
        columns: [{ key: 'a', label: 'A', render: v => { const s = env.document.createElement('span'); s.className = 'n'; s.textContent = v; return s; } }],
        data: [{ a: 'hi' }]
    });
    assert.equal(host.querySelector('td .n').textContent, 'hi');
});

test('search keeps input focus/element (no full re-render) and finds 0 values', () => {
    const { host, t, window } = mk({ data: [{ name: 'Zero', age: 0 }, { name: 'Ada', age: 5 }] });
    const input = host.querySelector('.chilltable-search');
    input.value = '0';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(host.querySelector('.chilltable-search'), input);
    assert.equal(host.querySelectorAll('tbody tr').length, 1);
    assert.equal(host.querySelector('.chilltable-count').textContent, '1 item');
    t.search('zzz');
    assert.equal(host.querySelector('.chilltable-empty').textContent, 'No data available');
});

test('empty state is configurable', () => {
    const { host } = mk({ data: [], emptyText: 'Nothing here' });
    assert.equal(host.querySelector('.chilltable-empty').textContent, 'Nothing here');
});

test('pagination uses nav, aria-current and Prev/Next', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ name: 'n' + i, age: i }));
    const { host, t } = mk({ data, pageSize: 10 });
    const nav = host.querySelector('nav');
    assert.equal(nav.getAttribute('aria-label'), 'Table pagination');
    assert.equal(nav.querySelector('[aria-current="page"]').textContent, '1');
    nav.querySelector('[data-page="next"]').click();
    assert.equal(host.querySelector('[aria-current="page"]').textContent, '2');
    assert.equal(host.querySelectorAll('tbody tr').length, 10);
    t.setPage(99);
    assert.equal(host.querySelectorAll('tbody tr').length, 5);
});

test('row selection, select-all, onSelect', () => {
    let got = null;
    const { host, t, window } = mk({ selectable: true, onSelect: r => { got = r; } });
    const rowCbs = host.querySelectorAll('.chilltable-select-row');
    assert.equal(rowCbs.length, 3);
    rowCbs[1].checked = true;
    rowCbs[1].dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(got.length, 1);
    assert.equal(got[0].name, 'Ada');
    assert.equal(host.querySelector('.chilltable-select-all').indeterminate, true);
    assert.ok(host.querySelectorAll('tr.chilltable-row-selected').length === 1);
    const all = host.querySelector('.chilltable-select-all');
    all.checked = true;
    all.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(t.getSelected().length, 3);
    t.clearSelection();
    assert.equal(t.getSelected().length, 0);
    assert.equal(host.querySelectorAll('.chilltable-select-row:checked').length, 0);
});

test('exportCSV returns escaped CSV and guards formulas', () => {
    const { t } = mk({ data: [{ name: 'A,"q"', age: 1 }, { name: '=SUM(1)', age: 2 }] });
    const csv = t.exportCSV();
    const lines = csv.split('\r\n');
    assert.equal(lines[0], 'Name,Age');
    assert.equal(lines[1], '"A,""q""",1');
    assert.equal(lines[2], "'=SUM(1),2");
});

test('stickyHeader class and export button', () => {
    const { host } = mk({ stickyHeader: true, exportButton: true });
    assert.ok(host.querySelector('.chilltable-sticky'));
    assert.ok(host.querySelector('.chilltable-export'));
});

test('dark mode CSS covers data-theme and .dark', () => {
    const { document } = mk();
    const css = document.getElementById('chilltable-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
});

test('destroy removes DOM and stops responding', () => {
    const { host, t, document } = mk();
    const input = host.querySelector('.chilltable-search');
    t.destroy();
    assert.equal(document.querySelector('.chilltable-container'), null);
    t.destroy(); // idempotent
    input.dispatchEvent(new (document.defaultView.Event)('input', { bubbles: true }));
});
