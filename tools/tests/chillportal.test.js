const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

test('SSR import safe; create/getRoot are no-ops without document', () => {
    const lib = loadSSR('chillportal');
    assert.equal(lib.create('a', 'x'), null);
    assert.equal(lib.getRoot(), null);
});

test('creates shared root lazily (not at load), z-index >= 10000, pointer-events none', () => {
    const { lib, document } = load('chillportal');
    assert.equal(document.getElementById('chill-portal-root'), null);
    const c = lib.create('a', 'hello');
    const root = document.getElementById('chill-portal-root');
    assert.ok(root);
    assert.ok(parseInt(root.style.zIndex, 10) >= 10000);
    assert.equal(root.style.pointerEvents, 'none');
    assert.equal(c.parentNode, root);
    assert.equal(c.style.pointerEvents, 'auto');
    assert.equal(c.getAttribute('data-chill-portal'), 'a');
    assert.equal(lib.get('a'), c); assert.equal(lib.has('a'), true);
    lib.destroy();
});

test('string content is text by default (no XSS); html:true is an explicit opt-in', () => {
    const { lib, document } = load('chillportal');
    const evil = '<img src=x onerror="window.__x=1"><b>b</b>';
    const c = lib.create('safe', evil);
    assert.equal(c.querySelector('img'), null);
    assert.equal(c.textContent, evil);
    const h = lib.create('rich', '<b id="bold">ok</b>', { html: true });
    assert.ok(h.querySelector('#bold'));
    // update keeps the creation mode unless overridden
    lib.update('rich', '<i id="it">x</i>');
    assert.ok(h.querySelector('#it'));
    lib.update('safe', '<u>u</u>');
    assert.equal(c.querySelector('u'), null);
    lib.update('safe', '<u id="uu">u</u>', { html: true });
    assert.ok(c.querySelector('#uu'));
    lib.destroy();
});

test('Node content works across realms (no global HTMLElement dependency); update moves node', () => {
    const { lib, document, window } = load('chillportal');
    delete window.HTMLElement; // would make `instanceof HTMLElement` throw
    const n = document.createElement('span'); n.id = 'n';
    const c = lib.create('node', n);
    assert.equal(c.firstChild, n);
    const n2 = document.createElement('em');
    lib.update('node', n2);
    assert.equal(c.firstChild, n2);
    assert.equal(n.parentNode, null);
    lib.destroy();
});

test('reusing an id replaces the old portal and fires onRemove', () => {
    const { lib, document } = load('chillportal');
    const removed = [];
    lib.create('x', 'one', { onRemove: el => removed.push(el.textContent) });
    lib.create('x', 'two');
    assert.equal(document.querySelectorAll('[data-chill-portal="x"]').length, 1);
    assert.equal(removed.join(), 'one');
    assert.equal(lib.get('x').textContent, 'two');
    assert.equal(lib.ids().join(), 'x');
    lib.remove('x'); lib.remove('x');
    assert.equal(lib.has('x'), false);
    lib.destroy();
});

test('custom target (element or selector), className and attrs', () => {
    const { lib, document } = load('chillportal');
    document.body.innerHTML = '<div id="modals"></div>';
    const a = lib.create('a', 'A', { target: '#modals', className: 'layer', attrs: { role: 'dialog' } });
    assert.equal(a.parentNode.id, 'modals');
    assert.equal(a.className, 'layer'); assert.equal(a.getAttribute('role'), 'dialog');
    const b = lib.create('b', 'B', { target: document.getElementById('modals') });
    assert.equal(b.parentNode.id, 'modals');
    const c = lib.create('c', 'C', { target: '#missing' }); // falls back to the root
    assert.equal(c.parentNode.id, 'chill-portal-root');
    lib.destroy();
});

test('root is re-created if it was removed from the document; clear and destroy clean up', () => {
    const { lib, document } = load('chillportal');
    lib.create('a', 'x');
    document.getElementById('chill-portal-root').remove();
    const c = lib.create('b', 'y');
    assert.ok(c.isConnected);
    assert.equal(document.querySelectorAll('#chill-portal-root').length, 1);
    lib.clear();
    assert.equal(lib.ids().length, 0);
    assert.equal(document.getElementById('chill-portal-root').children.length, 0);
    lib.destroy();
    assert.equal(document.getElementById('chill-portal-root'), null);
});
