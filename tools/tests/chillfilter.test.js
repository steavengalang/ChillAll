const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const filters = () => [
    { key: 'color', label: 'Color', options: [{ value: 'red', label: 'Red', count: 3 }, { value: 'blue', label: 'Blue' }] },
    { key: 'size', label: 'Size', options: [{ value: 1, label: 'S' }, { value: 2, label: 'M' }] }
];

function setup(opts) {
    const env = load('chillfilter');
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const f = env.lib.init(host, Object.assign({ filters: filters() }, opts));
    return Object.assign(env, { host, f });
}
const check = (window, input, v) => { input.checked = v; input.dispatchEvent(new window.Event('change', { bubbles: true })); };

test('chillfilter ARIA: group, aria-expanded toggles, Escape closes and refocuses', () => {
    const { document, window } = setup();
    assert.equal(document.querySelector('.chillfilter').getAttribute('role'), 'group');
    const btn = document.querySelector('.chillfilter-btn');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    btn.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.ok(btn.closest('.chillfilter-dropdown').classList.contains('open'));
    assert.equal(btn.getAttribute('aria-controls'), document.querySelector('.chillfilter-menu').id);
    document.querySelector('.chillfilter-option input').focus();
    document.querySelector('.chillfilter-option input').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, btn);
    btn.click();
    document.body.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
});

test('chillfilter XSS: labels, values and keys are never parsed as HTML', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { document, window } = setup({
        filters: [{ key: 'k"><b>', label: evil, icon: evil, options: [{ value: '"><i>', label: evil }] }],
        values: { 'k"><b>': ['"><i>'] }
    });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('.chillfilter b'), null);
    assert.equal(document.querySelector('.chillfilter i'), null);
    assert.equal(window.__x, undefined);
    assert.equal(document.querySelector('.chillfilter-tag').firstChild.textContent, evil);
    assert.equal(document.querySelectorAll('.chillfilter-tag').length, 1);
});

test('chillfilter html:true is the explicit opt-in for labels', () => {
    const { document } = setup({ html: true, filters: [{ key: 'a', label: '<em id="e">A</em>', options: [{ value: 1, label: '<u id="u">one</u>' }] }] });
    assert.ok(document.querySelector('#e'));
    assert.ok(document.querySelector('#u'));
});

test('chillfilter selection updates badge, tags, onChange (numeric values supported)', () => {
    const changes = [];
    const { document, window, f } = setup({ onChange: v => changes.push(JSON.stringify(v)) });
    const inputs = document.querySelectorAll('.chillfilter-option input');
    check(window, inputs[0], true);
    check(window, inputs[2], true);
    assert.equal(document.querySelectorAll('.chillfilter-badge').length, 2);
    assert.equal(document.querySelectorAll('.chillfilter-tag').length, 2);
    assert.equal(JSON.stringify(f.getValues()), JSON.stringify({ color: ['red'], size: ['1'] }));
    check(window, inputs[0], false);
    assert.equal(document.querySelectorAll('.chillfilter-badge').length, 1);
    assert.equal(changes.length, 3);
    assert.match(document.querySelector('[role=status]').textContent, /1 filter active/);
});

test('chillfilter tag remove button (accessible) unchecks the box; menu Clear resets', () => {
    const { document, window } = setup({ values: { color: ['red', 'blue'] } });
    assert.equal(document.querySelectorAll('.chillfilter-tag').length, 2);
    const rm = document.querySelector('.chillfilter-tag-remove');
    assert.equal(rm.getAttribute('aria-label'), 'Remove filter Red');
    rm.click();
    assert.equal(document.querySelectorAll('.chillfilter-tag').length, 1);
    assert.equal(document.querySelector('.chillfilter-option input[value="red"]').checked, false);
    document.querySelector('.chillfilter-menu-clear').click();
    assert.equal(document.querySelectorAll('.chillfilter-tag').length, 0);
    assert.equal(document.querySelector('.chillfilter-badge'), null);
});

test('chillfilter setValues/clear re-render without stacking listeners', () => {
    const changes = [];
    const { document, window, f } = setup({ onChange: v => changes.push(1) });
    f.setValues({ color: ['red'] });
    f.setValues({ color: ['blue'] });
    f.clear();
    assert.equal(changes.length, 1);
    changes.length = 0;
    check(window, document.querySelector('.chillfilter-option input'), true);
    assert.equal(changes.length, 1);    // exactly one onChange per user action
    document.querySelector('.chillfilter-btn').click();
    assert.ok(document.querySelector('.chillfilter-dropdown').classList.contains('open'));
});

test('chillfilter destroy removes listeners and restores the original element', () => {
    const { document, host, f } = setup();
    f.destroy();
    assert.equal(document.querySelector('.chillfilter'), null);
    assert.equal(document.getElementById('host'), host);
    document.body.click();
    f.destroy();
});

test('chillfilter dark-mode CSS covers data-theme and .dark; create() works detached', () => {
    const { document, lib } = setup();
    const css = document.getElementById('chillfilter-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
    const f = lib.create({ filters: filters() });
    document.body.appendChild(f.container);
    assert.equal(document.querySelectorAll('.chillfilter').length, 2);
    f.destroy();
    assert.equal(document.querySelectorAll('.chillfilter').length, 1);
});
