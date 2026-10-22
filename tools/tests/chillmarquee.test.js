'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

/** Make jsdom report fake layout: group width = items * 100, viewport clientWidth = 450 (clientHeight = 300). */
function mockLayout(window) {
    const proto = window.HTMLElement.prototype;
    Object.defineProperty(proto, 'offsetWidth', { configurable: true, get() { return this.classList.contains('chillmarquee-group') ? this.children.length * 100 : 0; } });
    Object.defineProperty(proto, 'offsetHeight', { configurable: true, get() { return this.classList.contains('chillmarquee-group') ? this.children.length * 50 : 0; } });
    Object.defineProperty(proto, 'clientWidth', { configurable: true, get() { return this.classList.contains('chillmarquee') ? 450 : 0; } });
    Object.defineProperty(proto, 'clientHeight', { configurable: true, get() { return this.classList.contains('chillmarquee') ? 300 : 0; } });
}

function trackingResizeObserver(window) {
    const state = { observed: new Set(), disconnected: 0, cb: null };
    window.ResizeObserver = class {
        constructor(cb) { state.cb = cb; }
        observe(el) { state.observed.add(el); }
        unobserve(el) { state.observed.delete(el); }
        disconnect() { state.disconnected++; state.observed.clear(); }
    };
    return state;
}

test('chillmarquee creates DOM and destroys cleanly', () => {
    const { lib, document } = load('chillmarquee');
    const m = lib.create({ items: ['a', 'b', 'c'], parent: document.body });
    assert.ok(document.querySelector('.chillmarquee'));
    assert.ok(document.getElementById('chillmarquee-styles'));
    assert.equal(m.element.getAttribute('role'), 'region');
    assert.equal(m.element.getAttribute('aria-label'), 'Scrolling content');
    m.destroy();
    assert.equal(document.querySelector('.chillmarquee'), null);
    m.destroy(); // idempotent
});

test('chillmarquee renders original group + aria-hidden inert clones', () => {
    const { lib } = load('chillmarquee');
    const m = lib.create({ items: ['a', 'b'] });
    const groups = m.element.querySelectorAll('.chillmarquee-group');
    assert.ok(groups.length >= 2);
    assert.equal(groups[0].getAttribute('aria-hidden'), null);
    assert.equal(groups[0].getAttribute('role'), 'list');
    assert.equal(groups[0].children[0].getAttribute('role'), 'listitem');
    for (let i = 1; i < groups.length; i++) {
        assert.equal(groups[i].getAttribute('aria-hidden'), 'true');
        assert.ok(groups[i].hasAttribute('inert'));
        assert.ok(groups[i].classList.contains('chillmarquee-clone'));
        assert.equal(groups[i].textContent, 'ab');
    }
    assert.equal(m.element.querySelectorAll('[aria-hidden="true"]').length, groups.length - 1);
});

test('chillmarquee item content is escaped unless html:true, supports Nodes and renderItem', () => {
    const { lib, document } = load('chillmarquee');
    const a = lib.create({ items: ['<img src=x onerror=alert(1)>'] });
    assert.equal(a.element.querySelector('img'), null);
    assert.equal(a.element.querySelector('.chillmarquee-item').textContent, '<img src=x onerror=alert(1)>');
    const h = lib.create({ items: ['<b>x</b>'], html: true });
    assert.ok(h.element.querySelector('.chillmarquee-item b'));
    const node = document.createElement('span');
    node.className = 'logo';
    const n = lib.create({ items: [node] });
    const logos = n.element.querySelectorAll('.logo');
    assert.equal(logos.length, n.element.querySelectorAll('.chillmarquee-group').length); // original + clones
    assert.equal(n.element.querySelector('.chillmarquee-group .logo'), node);
    const r = lib.create({ items: [{ n: 1 }, { n: 2 }], renderItem: (it, i) => `#${it.n}@${i}<b>` });
    assert.equal(r.element.querySelector('.chillmarquee-group').textContent, '#1@0<b>#2@1<b>');
    assert.equal(r.element.querySelector('b'), null);
});

test('chillmarquee direction classes, speed -> duration and copies from measured sizes', () => {
    const { lib, window } = load('chillmarquee');
    mockLayout(window);
    const m = lib.create({ items: ['a', 'b', 'c'], speed: 100, gap: 10 }); // group = 300px, view = 450px
    assert.equal(m.element.querySelectorAll('.chillmarquee-group').length, Math.ceil(450 / 300) + 1);
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-duration'), '3.000s'); // 300 / 100
    assert.match(m.element.style.getPropertyValue('--chillmarquee-x'), /^-33\.3/);
    assert.ok(!m.element.classList.contains('chillmarquee-reverse'));
    m.setSpeed(50);
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-duration'), '6.000s');
    m.setDirection('right');
    assert.ok(m.element.classList.contains('chillmarquee-reverse'));
    assert.ok(m.element.classList.contains('chillmarquee-horizontal'));
    m.setDirection('up');
    assert.ok(m.element.classList.contains('chillmarquee-vertical'));
    assert.ok(!m.element.classList.contains('chillmarquee-reverse'));
    assert.ok(m.element.style.getPropertyValue('--chillmarquee-y').startsWith('-'));
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-x'), '');
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-duration'), '3.000s'); // 150px @ 50px/s
    m.setDirection('down');
    assert.ok(m.element.classList.contains('chillmarquee-reverse'));
    m.setDirection('sideways');
    assert.ok(m.element.classList.contains('chillmarquee-reverse')); // unchanged
    m.setGap(40);
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-gap'), '40px');
});

test('chillmarquee play/pause toggles state, classes, events and callbacks', () => {
    const { lib } = load('chillmarquee');
    const seen = [];
    const m = lib.create({ items: ['a'], onPause: () => seen.push('cbpause'), onPlay: () => seen.push('cbplay') });
    m.on('pause', () => seen.push('evpause')).on('play', () => seen.push('evplay'));
    assert.equal(m.isPlaying(), true);
    m.pause();
    assert.equal(m.isPlaying(), false);
    assert.ok(m.element.classList.contains('chillmarquee-paused'));
    m.pause(); // no duplicate event
    m.play();
    assert.ok(!m.element.classList.contains('chillmarquee-paused'));
    m.toggle();
    assert.equal(m.isPlaying(), false);
    assert.deepEqual(seen, ['evpause', 'cbpause', 'evplay', 'cbplay', 'evpause', 'cbpause']);
    const paused = lib.create({ items: ['a'], autoplay: false });
    assert.ok(paused.element.classList.contains('chillmarquee-paused'));
});

test('chillmarquee pauseOnHover class and controls button', () => {
    const { lib } = load('chillmarquee');
    const m = lib.create({ items: ['a'], pauseOnHover: true, controls: true });
    assert.ok(m.element.classList.contains('chillmarquee-hover-pause'));
    m.setPauseOnHover(false);
    assert.ok(!m.element.classList.contains('chillmarquee-hover-pause'));
    const btn = m.element.querySelector('.chillmarquee-btn');
    assert.equal(btn.textContent, 'Pause');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    btn.click();
    assert.equal(m.isPlaying(), false);
    assert.equal(btn.textContent, 'Play');
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    btn.click();
    assert.equal(m.isPlaying(), true);
});

test('chillmarquee setItems / append update the DOM and emit update', () => {
    const { lib } = load('chillmarquee');
    const m = lib.create({ items: ['a'] });
    const updates = [];
    m.on('update', e => updates.push(e.items.length));
    m.setItems(['x', 'y', 'z']);
    assert.equal(m.element.querySelector('.chillmarquee-group').textContent, 'xyz');
    m.append('w');
    assert.equal(m.element.querySelector('.chillmarquee-group').textContent, 'xyzw');
    m.append(['v', 'u']);
    assert.equal(m.getItems().length, 6);
    assert.deepEqual(updates, [3, 4, 6]);
    m.setItems([]);
    assert.equal(m.element.querySelector('.chillmarquee-group').children.length, 0);
});

test('chillmarquee reduced motion: static, scrollable, no clones; reacts to change', () => {
    const { lib, window } = load('chillmarquee');
    let handler = null;
    const q = { matches: true, media: '', addEventListener: (t, h) => { handler = h; }, removeEventListener: (t, h) => { if (handler === h) handler = null; } };
    window.matchMedia = () => q;
    const m = lib.create({ items: ['a', 'b'], controls: true });
    assert.equal(m.isStatic(), true);
    assert.equal(m.isPlaying(), false);
    assert.ok(m.element.classList.contains('chillmarquee-static'));
    assert.equal(m.element.getAttribute('tabindex'), '0');
    assert.equal(m.element.querySelectorAll('.chillmarquee-clone').length, 0);
    assert.equal(m.element.querySelector('.chillmarquee-btn').hidden, true);
    const events = [];
    m.on('static', e => events.push(e.static));
    q.matches = false;
    handler({ matches: false });
    assert.equal(m.isStatic(), false);
    assert.ok(m.element.querySelectorAll('.chillmarquee-clone').length >= 1);
    assert.equal(m.element.getAttribute('tabindex'), null);
    assert.deepEqual(events, [false]);
    m.destroy();
    assert.equal(handler, null); // listener removed
    // forced modes
    q.matches = false;
    assert.equal(lib.create({ items: ['a'], reducedMotion: 'static' }).isStatic(), true);
    q.matches = true;
    assert.equal(lib.create({ items: ['a'], reducedMotion: 'ignore' }).isStatic(), false);
});

test('chillmarquee observes size changes and disconnects ResizeObserver on destroy', () => {
    const { lib, window, document } = load('chillmarquee');
    const ro = trackingResizeObserver(window);
    mockLayout(window);
    const m = lib.create({ items: ['a', 'b', 'c'], parent: document.body });
    assert.ok(ro.observed.has(m.element));
    assert.equal(m.element.querySelectorAll('.chillmarquee-group').length, 3);
    // viewport grows -> more clones after observer fires
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return this.classList.contains('chillmarquee') ? 1000 : 0; } });
    ro.cb();
    assert.equal(m.element.querySelectorAll('.chillmarquee-group').length, Math.ceil(1000 / 300) + 1);
    m.destroy();
    assert.equal(ro.disconnected, 1);
    assert.equal(ro.observed.size, 0);
    ro.cb(); // late callback after destroy must be harmless
});

test('chillmarquee init adopts children and restores them on destroy', () => {
    const { lib, document } = load('chillmarquee');
    document.body.innerHTML = '<ul id="l"><li class="i">one</li><li class="i">two</li></ul>';
    const ul = document.getElementById('l');
    const first = ul.firstElementChild;
    const m = lib.init(ul, { speed: 30 });
    assert.equal(document.getElementById('l'), null);
    assert.equal(m.getItems().length, 2);
    assert.equal(m.element.querySelector('.chillmarquee-group .i'), first);
    m.destroy();
    assert.equal(document.getElementById('l'), ul);
    assert.equal(ul.children.length, 2);
    assert.equal(ul.firstElementChild, first);
    assert.equal(document.querySelector('.chillmarquee'), null);
});

test('chillmarquee vertical height + fade + sanitised options', () => {
    const { lib } = load('chillmarquee');
    const m = lib.create({ items: ['a'], direction: 'down', height: 180, fade: true });
    assert.equal(m.element.style.getPropertyValue('--chillmarquee-height'), '180px');
    assert.ok(m.element.classList.contains('chillmarquee-fade'));
    const bad = lib.create({ items: ['a'], direction: 'diagonal', speed: -5, gap: 'x' });
    assert.ok(bad.element.classList.contains('chillmarquee-horizontal'));
    assert.equal(bad.options.speed, 1);
    assert.equal(bad.options.gap, 24);
});
