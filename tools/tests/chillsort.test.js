const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const opts = () => [{ value: 'name', label: 'Name' }, { value: 'price', label: 'Price' }, { value: 3, label: 'Rating' }];

function setup(o) {
    const env = load('chillsort');
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const s = env.lib.init(host, Object.assign({ options: opts(), value: 'name' }, o));
    return Object.assign(env, { host, s });
}
const key = (window, el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

test('chillsort listbox ARIA wiring and option selection', () => {
    const changes = [];
    const { document, s } = setup({ onChange: v => changes.push(v.value + ':' + v.direction) });
    const btn = document.querySelector('.chillsort-btn');
    assert.equal(btn.getAttribute('aria-haspopup'), 'listbox');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(document.querySelector('[role=listbox]').id, btn.getAttribute('aria-controls'));
    assert.equal(document.querySelectorAll('[role=option]').length, 3);
    assert.equal(document.querySelector('[role=option][aria-selected="true"]').textContent, 'Name');
    btn.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.ok(document.querySelector('.chillsort-select').classList.contains('open'));
    document.querySelectorAll('[role=option]')[1].click();
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(btn.textContent.trim(), 'Price');
    assert.deepEqual(changes, ['price:asc']);
    assert.equal(s.getValue().value, 'price');
});

test('chillsort keyboard: arrows open/move/wrap, Enter chooses, Escape closes', () => {
    const changes = [];
    const { document, window } = setup({ onChange: v => changes.push(v.value) });
    const btn = document.querySelector('.chillsort-btn');
    btn.focus();
    key(window, btn, 'ArrowDown');                         // opens on current (Name)
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    const rows = document.querySelectorAll('[role=option]');
    assert.equal(btn.getAttribute('aria-activedescendant'), rows[0].id);
    key(window, btn, 'ArrowUp');                           // wraps to last
    assert.equal(btn.getAttribute('aria-activedescendant'), rows[2].id);
    key(window, btn, 'Enter');
    assert.deepEqual(changes, [3]);                        // numeric values supported
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    key(window, btn, 'ArrowDown');
    key(window, btn, 'Escape');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
});

test('chillsort direction toggle: aria-pressed, class and onChange', () => {
    const changes = [];
    const { document } = setup({ onChange: v => changes.push(v.direction) });
    const dir = document.querySelector('.chillsort-direction');
    assert.equal(dir.getAttribute('aria-pressed'), 'false');
    dir.click();
    assert.equal(dir.getAttribute('aria-pressed'), 'true');
    assert.ok(dir.classList.contains('desc'));
    dir.click();
    assert.deepEqual(changes, ['desc', 'asc']);
    assert.match(document.querySelector('[role=status]').textContent, /ascending/);
});

test('chillsort XSS: labels and values are never parsed as HTML (html:true opts in)', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { document, window } = setup({ label: evil, options: [{ value: '"><b>', label: evil }], value: '"><b>' });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillsort b'), null);
    assert.equal(window.__x, undefined);
    assert.equal(document.querySelector('.chillsort-btn').textContent.trim(), evil);
    const inl = load('chillsort');
    const b = inl.lib.createInline({ label: evil });
    inl.document.body.appendChild(b);
    assert.equal(inl.document.querySelector('img'), null);
    const { document: d2 } = setup({ html: true, options: [{ value: 1, label: '<u id="u">x</u>' }], value: 1 });
    assert.ok(d2.querySelector('#u'));
});

test('chillsort setValue re-renders without stacking listeners; destroy restores the host', () => {
    const changes = [];
    const { document, host, s } = setup({ onChange: v => changes.push(v) });
    s.setValue('price', 'desc');
    s.setValue('name');
    assert.equal(changes.length, 0);
    document.querySelector('.chillsort-direction').click();
    assert.equal(changes.length, 1);
    document.querySelector('.chillsort-btn').click();
    assert.ok(document.querySelector('.chillsort-select').classList.contains('open'));
    s.destroy();
    assert.equal(document.querySelector('.chillsort'), null);
    assert.equal(document.getElementById('host'), host);
    document.body.click();
    s.destroy();
});

test('chillsort outside click closes the menu', () => {
    const { document } = setup();
    const btn = document.querySelector('.chillsort-btn');
    btn.click();
    document.body.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
});

test('chillsort inline: aria-pressed, direction toggle, exclusive within parent', () => {
    const { document, lib } = load('chillsort');
    const calls = [];
    const wrap = document.createElement('div');
    const a = lib.createInline({ label: 'A', value: 'a', onClick: v => calls.push(v.value + v.direction), active: true });
    const b = lib.createInline({ label: 'B', value: 'b', onClick: v => calls.push(v.value + v.direction) });
    wrap.appendChild(a); wrap.appendChild(b);
    document.body.appendChild(wrap);
    assert.equal(a.getAttribute('aria-pressed'), 'true');
    a.click();                                   // active -> toggles direction
    b.click();                                   // takes over
    assert.equal(a.getAttribute('aria-pressed'), 'false');
    assert.equal(b.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(calls, ['adesc', 'basc']);
    b.chillsort.destroy();
    b.click();
    assert.equal(calls.length, 2);
});

test('chillsort dark-mode CSS covers data-theme and .dark; create() is detached', () => {
    const { document, lib } = setup();
    const css = document.getElementById('chillsort-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    const s = lib.create({ options: opts() });
    document.body.appendChild(s.container);
    assert.equal(document.querySelectorAll('.chillsort').length, 2);
    s.destroy();
});
