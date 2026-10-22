const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));

test('chillcarousel ARIA roles, slide labels and escaping', () => {
    const { lib, document } = load('chillcarousel');
    const c = lib.create({ slides: ['<img src=x onerror=1>', 'two', 'three'] });
    document.body.appendChild(c.element);
    const root = document.querySelector('.chillcarousel');
    assert.equal(root.getAttribute('aria-roledescription'), 'carousel');
    assert.equal(root.getAttribute('role'), 'region');
    const slides = document.querySelectorAll('.chillcarousel-slide');
    assert.equal(slides.length, 3);
    assert.equal(slides[0].getAttribute('aria-roledescription'), 'slide');
    assert.equal(slides[1].getAttribute('aria-label'), '2 of 3');
    assert.equal(document.querySelector('.chillcarousel img'), null);
    assert.equal(slides[0].hasAttribute('aria-hidden'), false);
    assert.equal(slides[1].getAttribute('aria-hidden'), 'true');
    c.destroy();
    assert.equal(document.querySelector('.chillcarousel'), null);
});

test('chillcarousel navigation: arrows, dots, loop, bounds', () => {
    const { lib, document } = load('chillcarousel');
    const changes = [];
    const c = lib.create({ slides: ['a', 'b', 'c'], onChange: (i, p) => changes.push([i, p]) });
    document.body.appendChild(c.element);
    const prev = document.querySelector('.chillcarousel-prev');
    const next = document.querySelector('.chillcarousel-next');
    assert.equal(prev.disabled, true);
    next.click();
    assert.equal(c.getIndex(), 1);
    document.querySelectorAll('.chillcarousel-dot')[2].click();
    assert.equal(c.getIndex(), 2);
    assert.equal(next.disabled, true);
    assert.equal(document.querySelectorAll('.chillcarousel-dot')[2].getAttribute('aria-current'), 'true');
    c.next();
    assert.equal(c.getIndex(), 2);
    assert.equal(changes.length, 2);
    c.destroy();

    const l = lib.create({ slides: ['a', 'b', 'c'], loop: true });
    document.body.appendChild(l.element);
    l.prev();
    assert.equal(l.getIndex(), 2);
    l.next();
    assert.equal(l.getIndex(), 0);
    l.destroy();
});

test('chillcarousel keyboard navigation', () => {
    const { lib, document, window } = load('chillcarousel');
    const c = lib.create({ slides: ['a', 'b', 'c'] });
    document.body.appendChild(c.element);
    const k = key => c.element.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    k('ArrowRight'); assert.equal(c.getIndex(), 1);
    k('End'); assert.equal(c.getIndex(), 2);
    k('ArrowLeft'); assert.equal(c.getIndex(), 1);
    k('Home'); assert.equal(c.getIndex(), 0);
    c.destroy();
});

test('chillcarousel multiple slides per view reduces page count', () => {
    const { lib, document } = load('chillcarousel');
    const c = lib.create({ slides: ['1', '2', '3', '4', '5'], slidesPerView: 2, gap: 10 });
    document.body.appendChild(c.element);
    assert.equal(c.getPerView(), 2);
    assert.equal(document.querySelectorAll('.chillcarousel-dot').length, 4);
    assert.equal(document.querySelectorAll('.chillcarousel-slide:not([aria-hidden])').length, 2);
    c.goTo(3);
    assert.equal(c.getIndex(), 3);
    c.goTo(9);
    assert.equal(c.getIndex(), 3);
    c.destroy();
});

test('chillcarousel autoplay advances, pauses on hover, stops on destroy', async () => {
    const { lib, document, window } = load('chillcarousel');
    const c = lib.create({ slides: ['a', 'b', 'c'], autoplay: 25, loop: true });
    document.body.appendChild(c.element);
    assert.ok(document.querySelector('.chillcarousel-play'));
    await wait(70);
    assert.ok(c.getIndex() > 0);
    c.element.dispatchEvent(new window.MouseEvent('mouseenter'));
    const frozen = c.getIndex();
    await wait(80);
    assert.equal(c.getIndex(), frozen);
    c.element.dispatchEvent(new window.MouseEvent('mouseleave'));
    c.pause();
    const idx = c.getIndex();
    await wait(60);
    assert.equal(c.getIndex(), idx);
    c.play();
    c.destroy();
    await wait(60);
    assert.equal(c.getIndex(), idx);
});

test('chillcarousel autoplay disabled when reduced motion is preferred', async () => {
    const { lib, document, window } = load('chillcarousel');
    window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    const c = lib.create({ slides: ['a', 'b'], autoplay: 20, loop: true });
    document.body.appendChild(c.element);
    await wait(70);
    assert.equal(c.getIndex(), 0);
    c.destroy();
});

test('chillcarousel swipe/drag moves to next slide', () => {
    const { lib, document, window } = load('chillcarousel');
    const c = lib.create({ slides: ['a', 'b', 'c'] });
    document.body.appendChild(c.element);
    const vp = document.querySelector('.chillcarousel-viewport');
    const ev = (t, x) => vp.dispatchEvent(new window.MouseEvent(t, { clientX: x, bubbles: true }));
    ev('pointerdown', 200); ev('pointermove', 120); ev('pointerup', 120);
    assert.equal(c.getIndex(), 1);
    ev('pointerdown', 100); ev('pointermove', 190); ev('pointerup', 190);
    assert.equal(c.getIndex(), 0);
    ev('pointerdown', 100); ev('pointermove', 102); ev('pointerup', 102);   // tiny move: no change
    assert.equal(c.getIndex(), 0);
    c.destroy();
});

test('chillcarousel init uses children as slides and restores them', () => {
    const { lib, document } = load('chillcarousel');
    document.body.innerHTML = '<div id="g" class="mine"><p>one</p><p>two</p></div>';
    const c = lib.init('#g', { dots: false });
    const host = document.getElementById('g');
    assert.equal(host.querySelectorAll('.chillcarousel-slide').length, 2);
    assert.ok(host.classList.contains('chillcarousel'));
    c.destroy();
    assert.equal(host.className, 'mine');
    assert.equal(host.children.length, 2);
    assert.equal(host.children[0].tagName, 'P');
});
