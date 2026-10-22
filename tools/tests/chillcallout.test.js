const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

test('chillcallout is SSR safe', () => {
    assert.ok(loadSSR('chillcallout').version);
});

test('chillcallout roles by type and basic structure', () => {
    const { lib, document } = load('chillcallout');
    const roles = {};
    for (const type of ['info', 'success', 'warning', 'danger', 'neutral']) {
        const c = lib.create({ type, title: 'T', message: 'M', container: document.body });
        roles[type] = c.element.getAttribute('role');
        assert.ok(c.element.classList.contains('chillcallout-' + type));
        assert.equal(c.element.querySelector('.chillcallout-title').textContent, 'T');
        assert.equal(c.element.querySelector('.chillcallout-body').textContent, 'M');
        assert.ok(c.element.querySelector('.chillcallout-icon svg'));
        c.destroy();
    }
    assert.deepEqual(roles, { info: 'status', success: 'status', warning: 'alert', danger: 'alert', neutral: 'status' });
    assert.equal(document.querySelector('.chillcallout'), null);
});

test('chillcallout escapes text but allows explicit html', () => {
    const { lib, document } = load('chillcallout');
    const bad = '<img src=x onerror=alert(1)>';
    const c = lib.create({ title: bad, message: bad, container: document.body, actions: [{ label: bad }] });
    assert.equal(document.querySelectorAll('img').length, 0);
    c.destroy();
    const h = lib.create({ message: '<b id="b">x</b>', html: true, container: document.body });
    assert.ok(document.getElementById('b'));
    h.destroy();
});

test('chillcallout dismiss fires callback, event and removes element', async () => {
    const { lib, document } = load('chillcallout');
    let n = 0, ev = 0;
    const c = lib.create({ message: 'x', dismissible: true, container: document.body, onDismiss: () => n++ });
    c.on('dismiss', () => ev++);
    c.element.querySelector('.chillcallout-close').click();
    assert.equal(n, 1); assert.equal(ev, 1);
    await new Promise(r => setTimeout(r, 260));
    assert.equal(document.querySelector('.chillcallout'), null);
    assert.equal(c.destroyed, true);
});

test('chillcallout collapsible toggles aria-expanded and hides body', () => {
    const { lib, document } = load('chillcallout');
    const states = [];
    const c = lib.create({ title: 'More', message: 'Body', collapsible: true, collapsed: true, container: document.body, onToggle: s => states.push(s), actions: [{ label: 'Go' }] });
    const btn = c.element.querySelector('.chillcallout-toggle');
    const body = c.element.querySelector('.chillcallout-body');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(btn.getAttribute('aria-controls'), body.id);
    assert.equal(body.hidden, true);
    assert.equal(c.element.querySelector('.chillcallout-actions').hidden, true);
    btn.click();
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.equal(body.hidden, false);
    c.collapse();
    assert.deepEqual(states, [false, true]);
    c.destroy();
});

test('chillcallout actions: buttons call handlers, links are safe', () => {
    const { lib, document } = load('chillcallout');
    let clicked = 0;
    const c = lib.create({ message: 'm', container: document.body, actions: [{ label: 'Do', variant: 'primary', onClick: () => clicked++ }, { label: 'Docs', href: 'https://x.test', target: '_blank' }, { label: 'Off', disabled: true }] });
    const [a, b, d] = c.element.querySelectorAll('.chillcallout-action');
    a.click();
    assert.equal(clicked, 1);
    assert.equal(b.tagName, 'A');
    assert.equal(b.rel, 'noopener noreferrer');
    assert.equal(d.disabled, true);
    c.destroy();
});

test('chillcallout init enhances existing element and destroy restores it', () => {
    const { lib, document } = load('chillcallout');
    document.body.innerHTML = '<div id="n" class="mine" data-type="success" data-title="Saved">All good <b>bold</b></div>';
    const h = lib.init('#n');
    const el = document.getElementById('n');
    assert.ok(el.classList.contains('chillcallout-success'));
    assert.ok(el.classList.contains('mine'));
    assert.equal(el.querySelector('.chillcallout-title').textContent, 'Saved');
    assert.ok(el.querySelector('.chillcallout-body b'));
    h.destroy();
    assert.equal(el.className, 'mine');
    assert.equal(el.innerHTML, 'All good <b>bold</b>');
    assert.equal(el.hasAttribute('role'), false);
});

test('chillcallout update re-renders and CSS has dark theme', () => {
    const { lib, document } = load('chillcallout');
    const c = lib.create({ message: 'a', container: document.body });
    c.update({ type: 'danger', message: 'b' });
    assert.ok(c.element.classList.contains('chillcallout-danger'));
    assert.equal(c.element.getAttribute('role'), 'alert');
    assert.equal(c.element.querySelector('.chillcallout-body').textContent, 'b');
    assert.match(document.getElementById('chillcallout-styles').textContent, /:root\[data-theme="dark"\]/);
    c.destroy();
});
