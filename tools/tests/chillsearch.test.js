const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(opts) {
    const env = load('chillsearch');
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const s = env.lib.init(host, Object.assign({ debounce: 0 }, opts));
    return Object.assign(env, { host, s });
}
const type = (window, input, v) => { input.value = v; input.dispatchEvent(new window.Event('input', { bubbles: true })); };
const key = (window, el, k, extra) => el.dispatchEvent(new window.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));
const tick = () => new Promise(r => setTimeout(r, 5));

test('combobox ARIA wiring', async () => {
    const { document, window, s } = setup({ suggestions: ['apple', 'apricot', 'banana'] });
    const input = document.querySelector('.chillsearch-input');
    assert.equal(input.getAttribute('role'), 'combobox');
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    assert.equal(input.getAttribute('aria-controls'), document.querySelector('[role=listbox]').id);
    assert.equal(document.querySelector('.chillsearch-clear').getAttribute('aria-label'), 'Clear search');
    type(window, input, 'ap');
    await tick();
    assert.equal(input.getAttribute('aria-expanded'), 'true');
    assert.equal(document.querySelectorAll('[role=option]').length, 2);
    key(window, input, 'ArrowDown');
    const opt = document.querySelector('[role=option][aria-selected="true"]');
    assert.equal(input.getAttribute('aria-activedescendant'), opt.id);
    assert.match(document.querySelector('[role=status]').textContent, /2 suggestions/);
    s.destroy();
});

test('keyboard: arrows wrap, Enter selects and fires onSelect/onChange, Escape closes', async () => {
    const sel = []; const chg = [];
    const { document, window } = setup({ suggestions: ['apple', 'apricot'], onSelect: s => sel.push(s), onChange: v => chg.push(v) });
    const input = document.querySelector('.chillsearch-input');
    type(window, input, 'ap');
    await tick();
    key(window, input, 'ArrowUp'); // wraps to last
    key(window, input, 'Enter');
    assert.deepEqual(sel, ['apricot']);
    assert.equal(input.value, 'apricot');
    assert.equal(chg.at(-1), 'apricot');
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    type(window, input, 'a');
    await tick();
    key(window, input, 'Escape');
    assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('XSS: suggestions, icons and query are never parsed as HTML', async () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { document, window } = setup({ suggestions: [evil + 'abc', { label: 'abc', icon: evil }], placeholder: '"><img src=x onerror="window.__x=2">' });
    const input = document.querySelector('.chillsearch-input');
    assert.equal(document.querySelector('img'), null);
    type(window, input, 'abc');
    await tick();
    assert.equal(document.querySelector('img'), null);
    assert.ok(document.querySelector('.chillsearch-suggestion').textContent.includes(evil));
    assert.equal(window.__x, undefined);
    assert.equal(document.querySelector('.chillsearch-highlight').textContent, 'abc');
});

test('iconHtml is the explicit HTML opt-in', async () => {
    const { document, window } = setup({ suggestions: [{ label: 'abc', iconHtml: '<i id="ic"></i>' }] });
    type(window, document.querySelector('.chillsearch-input'), 'a');
    await tick();
    assert.ok(document.querySelector('#ic'));
});

test('regex metacharacters in the query do not throw or mis-highlight', async () => {
    const { document, window } = setup({ suggestions: ['a(b)c', 'c++ guide'] });
    const input = document.querySelector('.chillsearch-input');
    type(window, input, '(b');
    await tick();
    assert.equal(document.querySelectorAll('.chillsearch-suggestion').length, 1);
    assert.equal(document.querySelector('.chillsearch-highlight').textContent, '(b');
    type(window, input, 'c++');
    await tick();
    assert.equal(document.querySelector('.chillsearch-highlight').textContent, 'c++');
});

test('stale async responses are ignored', async () => {
    const resolvers = [];
    const { document, window } = setup({ getSuggestions: q => new Promise(res => resolvers.push(() => res([q + '-result']))) });
    const input = document.querySelector('.chillsearch-input');
    type(window, input, 'a');
    type(window, input, 'ab');
    resolvers[1]();
    await tick();
    resolvers[0]();
    await tick();
    assert.deepEqual([...document.querySelectorAll('.chillsearch-suggestion')].map(e => e.textContent), ['ab-result']);
    assert.equal(document.querySelector('.chillsearch').classList.contains('loading'), false);
});

test('debounce timer is cancelled on destroy; debounce:0 means immediate', async () => {
    const calls = [];
    const env = load('chillsearch');
    const host = env.document.createElement('div');
    env.document.body.appendChild(host);
    const s = env.lib.init(host, { debounce: 20, getSuggestions: q => { calls.push(q); return []; } });
    type(env.window, env.document.querySelector('.chillsearch-input'), 'x');
    s.destroy();
    await new Promise(r => setTimeout(r, 40));
    assert.deepEqual(calls, []);
    const { document, window } = setup({ getSuggestions: q => { calls.push(q); return []; } }); // debounce 0
    type(window, document.querySelector('.chillsearch-input'), 'y');
    assert.deepEqual(calls, ['y']);
});

test('clear button resets, fires onChange and refocuses', () => {
    const chg = [];
    const { document, window, s } = setup({ suggestions: ['a'], onChange: v => chg.push(v) });
    const input = document.querySelector('.chillsearch-input');
    type(window, input, 'a');
    document.querySelector('.chillsearch-clear').click();
    assert.equal(s.getValue(), '');
    assert.equal(input.value, '');
    assert.equal(chg.at(-1), '');
    assert.equal(document.activeElement, input);
});

test('Enter without selection calls onSearch; Ctrl+K shortcut focuses', () => {
    const q = [];
    const { document, window } = setup({ onSearch: v => q.push(v), shortcut: 'Ctrl K' });
    const input = document.querySelector('.chillsearch-input');
    type(window, input, 'hello');
    key(window, input, 'Enter');
    assert.deepEqual(q, ['hello']);
    input.blur();
    key(window, document.body, 'K', { ctrlKey: true });
    assert.equal(document.activeElement, input);
});

test('destroy removes document listeners and restores the original element', async () => {
    const { document, window, host, s } = setup({ suggestions: ['a'], shortcut: 'Ctrl K' });
    const input = document.querySelector('.chillsearch-input');
    s.destroy();
    assert.equal(document.querySelector('.chillsearch'), null);
    assert.equal(document.getElementById('host'), host);
    key(window, document.body, 'k', { ctrlKey: true });
    assert.notEqual(document.activeElement, input);
    document.body.click(); // must not throw
    s.destroy();
});

test('dark mode CSS covers data-theme and .dark', () => {
    const { document } = setup({});
    const css = document.getElementById('chillsearch-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
});
