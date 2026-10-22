'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const key = (w, el, k) => { const e = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const setup = (extra) => {
    const env = load('chilldropdown');
    env.document.body.innerHTML = '<button id="t">Menu</button>';
    const trigger = env.document.getElementById('t');
    const picks = [];
    const inst = env.lib.init('#t', Object.assign({
        items: [
            { label: 'Edit', value: 'edit' },
            { label: 'Dup', value: 'dup', disabled: true },
            { type: 'divider' },
            { type: 'header', label: 'Group' },
            { label: 'Delete', value: 'del', danger: true }
        ],
        onSelect: (v, el, item) => picks.push(v)
    }, extra));
    return Object.assign(env, { trigger, picks, inst });
};
const items = d => [...d.querySelectorAll('.chilldropdown-menu > .chilldropdown-item')];

test('chilldropdown wraps trigger, sets ARIA, destroy restores trigger and attributes', () => {
    const { document, trigger, inst } = setup();
    assert.ok(trigger.closest('.chilldropdown-container'));
    assert.equal(trigger.getAttribute('aria-haspopup'), 'menu');
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    const menu = document.querySelector('.chilldropdown-menu');
    assert.equal(menu.getAttribute('role'), 'menu');
    assert.equal(trigger.getAttribute('aria-controls'), menu.id);
    assert.equal(items(document)[0].getAttribute('role'), 'menuitem');
    inst.destroy();
    assert.equal(document.querySelector('.chilldropdown-container'), null);
    assert.equal(document.getElementById('t'), trigger);
    assert.equal(trigger.parentNode, document.body);
    assert.equal(trigger.getAttribute('aria-haspopup'), null);
    assert.equal(trigger.getAttribute('aria-expanded'), null);
    assert.equal(trigger.className, '');
});

test('chilldropdown is XSS-safe: labels/description/shortcut text; icon markup sanitised', () => {
    const env = load('chilldropdown');
    const { document, lib } = env;
    document.body.innerHTML = '<button id="t">x</button>';
    const evil = '<img src=x onerror=alert(1)>';
    lib.init('#t', { items: [
        { label: evil, description: evil, shortcut: evil, value: '"><b>', icon: '<svg onload="x()" viewBox="0 0 1 1"><script>1</script></svg>' },
        { type: 'header', label: evil },
        { type: 'submenu', label: evil, items: [{ label: evil }] }
    ] });
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('b'), null);
    assert.equal(document.querySelector('script'), null);
    assert.equal(document.querySelector('svg').getAttribute('onload'), null);
    assert.equal(document.querySelector('.chilldropdown-item-label').textContent, evil);
});

test('chilldropdown click opens, selects (value passed), closes; disabled ignored; outside click closes', () => {
    const { document, trigger, inst, picks } = setup();
    trigger.click();
    assert.ok(inst.isOpen);
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    items(document)[1].click();
    assert.equal(picks.length, 0);
    items(document)[2].click();            // "Delete" (index 2 among buttons)
    eq(picks, ['del']);
    assert.ok(!inst.isOpen);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    trigger.click();
    document.body.click();
    assert.ok(!inst.isOpen);
    inst.destroy();
});

test('chilldropdown document listener only exists while open and is removed on destroy', () => {
    const { document, trigger, inst } = setup();
    let adds = 0, removes = 0;
    const oa = document.addEventListener.bind(document), or = document.removeEventListener.bind(document);
    document.addEventListener = (...a) => { adds++; return oa(...a); };
    document.removeEventListener = (...a) => { removes++; return or(...a); };
    trigger.click();
    assert.equal(adds, 1);
    trigger.click();
    assert.equal(removes, 1);
    trigger.click();
    inst.destroy();
    assert.equal(removes, 2);
    document.addEventListener = oa; document.removeEventListener = or;
    // after destroy, trigger clicks do nothing
    trigger.click();
    assert.ok(!document.querySelector('.chilldropdown-container'));
});

test('chilldropdown keyboard: ArrowDown opens + focuses first, Up/Down/Home/End, Enter selects, Esc refocuses trigger', () => {
    const { window, document, trigger, inst, picks } = setup();
    trigger.focus();
    key(window, trigger, 'ArrowDown');
    assert.ok(inst.isOpen);
    const it = items(document);
    assert.equal(document.activeElement, it[0]);
    key(window, it[0], 'ArrowDown');       // skips disabled
    assert.equal(document.activeElement, it[2]);
    key(window, it[2], 'ArrowDown');       // wraps
    assert.equal(document.activeElement, it[0]);
    key(window, it[0], 'ArrowUp');
    assert.equal(document.activeElement, it[2]);
    key(window, it[2], 'Home');
    assert.equal(document.activeElement, it[0]);
    key(window, it[0], 'End');
    assert.equal(document.activeElement, it[2]);
    key(window, it[2], 'Escape');
    assert.ok(!inst.isOpen);
    assert.equal(document.activeElement, trigger);
    key(window, trigger, 'ArrowUp');
    assert.equal(document.activeElement, it[2], 'ArrowUp opens on last item');
    key(window, it[2], 'Enter');
    eq(picks, ['del']);
    assert.ok(!inst.isOpen);
    assert.equal(document.activeElement, trigger);
    inst.destroy();
});

test('chilldropdown type-ahead focuses matching item; Tab closes', () => {
    const { window, document, trigger, inst } = setup();
    inst.open();
    const it = items(document);
    it[0].focus();
    key(window, it[0], 'd');
    assert.equal(document.activeElement, it[2]);
    key(window, it[2], 'Tab');
    assert.ok(!inst.isOpen);
    inst.destroy();
});

test('chilldropdown checkbox and radio items toggle state with aria-checked', () => {
    const env = load('chilldropdown');
    const { document, lib } = env;
    document.body.innerHTML = '<button id="t">x</button>';
    const inst = lib.init('#t', { items: [
        { type: 'checkbox', label: 'Grid', value: 'grid', checked: false },
        { type: 'radio', label: 'S', value: 's', checked: true },
        { type: 'radio', label: 'L', value: 'l' }
    ] });
    inst.open();
    const [cb, r1, r2] = items(document);
    assert.equal(cb.getAttribute('role'), 'menuitemcheckbox');
    assert.equal(cb.getAttribute('aria-checked'), 'false');
    cb.click();
    inst.open();
    assert.equal(cb.getAttribute('aria-checked'), 'true');
    assert.ok(cb.querySelector('svg'));
    cb.click();
    assert.equal(cb.getAttribute('aria-checked'), 'false');
    assert.equal(cb.querySelector('svg'), null);
    inst.open();
    r2.click();
    assert.equal(r1.getAttribute('aria-checked'), 'false');
    assert.equal(r2.getAttribute('aria-checked'), 'true');
    assert.equal(r1.getAttribute('role'), 'menuitemradio');
    inst.destroy();
});

test('chilldropdown submenu: aria, keyboard Right/Left, Esc closes submenu only', () => {
    const env = load('chilldropdown');
    const { window, document, lib } = env;
    document.body.innerHTML = '<button id="t">x</button>';
    const picks = [];
    const inst = lib.init('#t', { onSelect: v => picks.push(v), items: [
        { label: 'A', value: 'a' },
        { type: 'submenu', label: 'More', items: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }] }
    ] });
    inst.open();
    const trig = document.querySelector('.chilldropdown-submenu-trigger');
    assert.equal(trig.getAttribute('aria-haspopup'), 'menu');
    assert.equal(trig.getAttribute('aria-expanded'), 'false');
    trig.focus();
    key(window, trig, 'ArrowRight');
    assert.equal(trig.getAttribute('aria-expanded'), 'true');
    const sub = document.querySelectorAll('.chilldropdown-submenu .chilldropdown-item');
    assert.equal(document.activeElement, sub[1]);
    key(window, sub[1], 'ArrowDown');
    assert.equal(document.activeElement, sub[2]);
    key(window, sub[2], 'Escape');
    assert.ok(inst.isOpen, 'main menu stays open');
    assert.equal(trig.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, trig);
    key(window, trig, 'ArrowRight');
    key(window, document.activeElement, 'ArrowLeft');
    assert.equal(document.activeElement, trig);
    key(window, trig, 'ArrowRight');
    key(window, document.activeElement, 'Enter');
    eq(picks, ['one']);
    assert.ok(!inst.isOpen);
    inst.destroy();
});

test('chilldropdown triggerOn hover opens/closes on mouseenter/leave; contextmenu opens', () => {
    const { window, document, trigger, inst } = setup({ triggerOn: 'hover' });
    const c = document.querySelector('.chilldropdown-container');
    c.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.ok(inst.isOpen);
    c.dispatchEvent(new window.MouseEvent('mouseleave'));
    assert.ok(!inst.isOpen);
    inst.destroy();
    const env = setup({ triggerOn: 'contextmenu' });
    const ev = new env.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    env.trigger.dispatchEvent(ev);
    assert.ok(ev.defaultPrevented);
    assert.ok(env.inst.isOpen);
    assert.equal(env.trigger.getAttribute('aria-haspopup'), null);
    env.inst.destroy();
});

test('chilldropdown setItems/setPosition/onOpen/onClose and closeOnSelect:false', () => {
    const calls = [];
    const { document, trigger, inst } = setup({ closeOnSelect: false, onOpen: () => calls.push('o'), onClose: () => calls.push('c') });
    inst.open(); inst.open();
    items(document)[0].click();
    assert.ok(inst.isOpen);
    inst.setItems([{ label: 'New', value: 'n' }]);
    assert.equal(items(document).length, 1);
    inst.setPosition('top-end');
    assert.ok(document.querySelector('.chilldropdown-menu-top-end'));
    inst.close(); inst.close();
    eq(calls, ['o', 'c']);
    inst.destroy();
});

test('chilldropdown CSS: data-theme dark, focus-visible, reduced motion, z-index', () => {
    const { document, inst } = setup();
    const css = document.getElementById('chilldropdown-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /\.chilldropdown-item:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /z-index: 10001/);
    inst.destroy();
});
