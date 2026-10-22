const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const frame = () => new Promise(r => setTimeout(r, 40));

function scrollWindow(window, top, max = 2000) {
    Object.defineProperty(window, 'pageYOffset', { value: top, configurable: true });
    Object.defineProperty(window.document.documentElement, 'scrollHeight', { value: max + 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    window.dispatchEvent(new window.Event('scroll'));
}

test('chillbacktotop is SSR safe', () => {
    assert.ok(loadSSR('chillbacktotop').version);
});

test('chillbacktotop appears past threshold, hides above it, with a11y state', async () => {
    const { lib, window, document } = load('chillbacktotop');
    const shows = [], hides = [];
    const b = lib.create({ threshold: 300, onShow: () => shows.push(1), onHide: () => hides.push(1) });
    const el = document.querySelector('.chillbacktotop');
    assert.equal(el.getAttribute('aria-label'), 'Back to top');
    assert.equal(el.getAttribute('aria-hidden'), 'true');
    assert.equal(el.tabIndex, -1);
    assert.equal(b.visible, false);
    scrollWindow(window, 500);
    await frame();
    assert.equal(b.visible, true);
    assert.ok(el.classList.contains('chillbacktotop-visible'));
    assert.equal(el.hasAttribute('aria-hidden'), false);
    assert.equal(el.tabIndex, 0);
    scrollWindow(window, 100);
    await frame();
    assert.equal(b.visible, false);
    assert.equal(shows.length, 1); assert.equal(hides.length, 1);
    b.destroy();
});

test('chillbacktotop progress ring reflects scroll fraction', async () => {
    const { lib, window } = load('chillbacktotop');
    const b = lib.create({});
    const circ = 2 * Math.PI * 20;
    scrollWindow(window, 1000, 2000);
    await frame();
    assert.ok(Math.abs(b.progressValue - 0.5) < 1e-6);
    assert.ok(Math.abs(Number(b.bar.getAttribute('stroke-dashoffset')) - circ / 2) < 0.1);
    scrollWindow(window, 2000, 2000);
    await frame();
    assert.equal(b.progressValue, 1);
    b.destroy();
    const n = lib.create({ progress: false });
    assert.equal(n.bar, undefined);
    n.destroy();
});

test('chillbacktotop click scrolls to top (smooth, or auto under reduced motion) and calls onClick', () => {
    const { lib, window } = load('chillbacktotop');
    const calls = [];
    window.scrollTo = o => calls.push(o);
    let clicked = 0;
    const b = lib.create({ onClick: () => clicked++ });
    b.element.click();
    assert.equal(clicked, 1);
    assert.equal(JSON.stringify(calls[0]), JSON.stringify({ top: 0, left: 0, behavior: 'smooth' }));
    window.matchMedia = q => ({ matches: /reduced-motion/.test(q), addEventListener() {}, removeEventListener() {} });
    b.element.click();
    assert.equal(calls[1].behavior, 'auto');
    b.destroy();
});

test('chillbacktotop works on a custom scroll container and positions via class', async () => {
    const { lib, window, document } = load('chillbacktotop');
    document.body.innerHTML = '<div id="box"></div>';
    const box = document.getElementById('box');
    Object.defineProperty(box, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 200, configurable: true });
    let scrolled = null;
    box.scrollTo = o => { scrolled = o; box.scrollTop = 0; };
    const b = lib.create({ target: '#box', position: 'bottom-left', threshold: 50 });
    assert.ok(b.element.classList.contains('chillbacktotop-left'));
    box.scrollTop = 400;
    box.dispatchEvent(new window.Event('scroll'));
    await frame();
    assert.equal(b.visible, true);
    assert.ok(Math.abs(b.progressValue - 0.5) < 1e-6);
    b.scrollToTop();
    assert.equal(scrolled.top, 0);
    b.destroy();
});

test('chillbacktotop destroy removes element and listeners', async () => {
    const { lib, window, document } = load('chillbacktotop');
    let shows = 0;
    const b = lib.create({ onShow: () => shows++ });
    b.destroy();
    assert.equal(document.querySelector('.chillbacktotop'), null);
    scrollWindow(window, 900);
    await frame();
    assert.equal(shows, 0);
});

test('chillbacktotop icon is text-only and CSS has dark theme + reduced motion', () => {
    const { lib, document } = load('chillbacktotop');
    const b = lib.create({ icon: '<img src=x onerror=alert(1)>' });
    assert.equal(document.querySelectorAll('img').length, 0);
    const css = document.getElementById('chillbacktotop-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /prefers-reduced-motion/);
    b.destroy();
});
