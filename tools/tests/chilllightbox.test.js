const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const items = [{ src: 'a.jpg', caption: 'Alpha', thumb: 'a-t.jpg' }, 'b.jpg', { src: 'c.jpg', caption: 'Gamma' }];
const key = (document, k, extra) => document.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));

test('chilllightbox is SSR safe', () => {
    assert.ok(loadSSR('chilllightbox').version);
});

test('chilllightbox opens dialog with image, caption, counter, thumbnails; closes and destroys', () => {
    const { lib, document } = load('chilllightbox');
    const lb = lib.create({ items });
    assert.equal(document.querySelector('.chilllightbox'), null);
    lb.open(0);
    const root = document.querySelector('.chilllightbox');
    assert.equal(root.getAttribute('role'), 'dialog');
    assert.equal(root.getAttribute('aria-modal'), 'true');
    assert.equal(root.querySelector('.chilllightbox-img').getAttribute('src'), 'a.jpg');
    assert.equal(root.querySelector('.chilllightbox-caption').textContent, 'Alpha');
    assert.equal(root.querySelector('.chilllightbox-counter').textContent, '1 / 3');
    assert.equal(root.querySelectorAll('.chilllightbox-thumb').length, 3);
    assert.equal(root.querySelector('.chilllightbox-thumb[aria-current="true"]').getAttribute('aria-label'), 'Image 1: Alpha');
    assert.equal(document.body.style.overflow, 'hidden');
    lb.close();
    assert.equal(document.body.style.overflow, '');
    lb.destroy();
    assert.equal(document.querySelector('.chilllightbox'), null);
});

test('chilllightbox keyboard navigation, loop and Esc', () => {
    const { lib, document } = load('chilllightbox');
    const changes = [];
    const lb = lib.create({ items, onChange: (i) => changes.push(i) });
    lb.open(0);
    key(document, 'ArrowRight'); assert.equal(lb.index, 1);
    key(document, 'ArrowLeft'); key(document, 'ArrowLeft'); assert.equal(lb.index, 2, 'loops backwards');
    key(document, 'Home'); assert.equal(lb.index, 0);
    key(document, 'End'); assert.equal(lb.index, 2);
    assert.deepEqual(changes, [0, 1, 0, 2, 0, 2]);
    key(document, 'Escape');
    assert.equal(lb.isOpen, false);
    lb.destroy();
});

test('chilllightbox loop:false disables prev/next at the ends', () => {
    const { lib, document } = load('chilllightbox');
    const lb = lib.create({ items, loop: false }).open(0);
    assert.equal(lb.prevBtn.disabled, true);
    key(document, 'ArrowLeft'); assert.equal(lb.index, 0);
    lb.goTo(2);
    assert.equal(lb.nextBtn.disabled, true);
    key(document, 'ArrowRight'); assert.equal(lb.index, 2);
    lb.destroy();
});

test('chilllightbox zoom via buttons, keys, wheel and double click; reset on navigation', () => {
    const { lib, document, window } = load('chilllightbox');
    const lb = lib.create({ items, maxZoom: 3 }).open(0);
    lb.zoomIn(); assert.ok(lb.scale > 1);
    assert.match(lb.img.style.transform, /scale\(/);
    lb.resetZoom(); assert.equal(lb.scale, 1); assert.equal(lb.img.style.transform, '');
    key(document, '+'); assert.ok(lb.scale > 1);
    key(document, '0'); assert.equal(lb.scale, 1);
    for (let i = 0; i < 20; i++) lb.zoomIn();
    assert.equal(lb.scale, 3);
    assert.equal(lb.zoomInBtn.disabled, true);
    key(document, '0');
    lb.stage.dispatchEvent(new window.WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    assert.ok(lb.scale > 1);
    lb.next();
    assert.equal(lb.scale, 1);
    lb.img.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    assert.ok(lb.scale > 1);
    lb.img.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    assert.equal(lb.scale, 1);
    lb.destroy();
});

test('chilllightbox swipe left/right navigates and swipe down closes', () => {
    const { lib, document, window } = load('chilllightbox');
    const lb = lib.create({ items }).open(0);
    const touch = (type, x, y) => {
        const e = new window.Event(type, { bubbles: true });
        e.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }];
        e.changedTouches = [{ clientX: x, clientY: y }];
        lb.stage.dispatchEvent(e);
    };
    touch('touchstart', 300, 100); touch('touchend', 100, 105);
    assert.equal(lb.index, 1);
    touch('touchstart', 100, 100); touch('touchend', 300, 100);
    assert.equal(lb.index, 0);
    touch('touchstart', 100, 100); touch('touchend', 105, 300);
    assert.equal(lb.isOpen, false);
    lb.destroy();
});

test('chilllightbox traps focus and returns focus to opener', () => {
    const { lib, document } = load('chilllightbox');
    const opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
    const lb = lib.create({ items }).open(0);
    assert.ok(lb.element.contains(document.activeElement));
    const all = Array.from(lb.element.querySelectorAll('button')).filter(b => !b.hidden && !b.disabled);
    all[all.length - 1].focus();
    key(document, 'Tab');
    assert.equal(document.activeElement, all[0]);
    key(document, 'Tab', { shiftKey: true });
    assert.equal(document.activeElement, all[all.length - 1]);
    lb.close();
    assert.equal(document.activeElement, opener);
    lb.destroy();
});

test('chilllightbox image error state and captions are text-only', () => {
    const { lib, document } = load('chilllightbox');
    const bad = '<img src=x onerror=alert(1)>';
    const lb = lib.create({ items: [{ src: 'a.jpg', caption: bad }] }).open(0);
    assert.equal(lb.element.querySelectorAll('.chilllightbox-caption img').length, 0);
    assert.equal(lb.captionEl.textContent, bad);
    assert.equal(lb.element.querySelector('.chilllightbox-prev').hidden, true, 'single image: no nav');
    lb.img.dispatchEvent(new document.defaultView.Event('error'));
    assert.equal(lb.errorEl.hidden, false);
    assert.equal(lb.loader.hidden, true);
    lb.destroy();
});

test('chilllightbox init groups links and opens on click', () => {
    const { lib, document } = load('chilllightbox');
    document.body.innerHTML = `
      <a id="l1" href="big1.jpg" data-chill-lightbox="g" data-caption="One"><img src="s1.jpg" alt="one"></a>
      <a id="l2" href="big2.jpg" data-chill-lightbox="g"><img src="s2.jpg" alt="two"></a>`;
    const h = lib.init('a[data-chill-lightbox]');
    document.getElementById('l2').click();
    const root = document.querySelector('.chilllightbox');
    assert.equal(root.querySelector('.chilllightbox-img').getAttribute('src'), 'big2.jpg');
    assert.equal(root.querySelector('.chilllightbox-counter').textContent, '2 / 2');
    assert.equal(root.querySelector('.chilllightbox-caption').textContent, 'two');
    h.destroy();
    assert.equal(document.querySelector('.chilllightbox'), null);
    document.getElementById('l1').addEventListener('click', e => e.preventDefault());
    document.getElementById('l1').click();
    assert.equal(document.querySelector('.chilllightbox'), null, 'listeners removed');
});

test('chilllightbox CSS has data-theme dark and reduced motion', () => {
    const { lib, document } = load('chilllightbox');
    lib.create({ items }).open(0).destroy();
    const css = document.getElementById('chilllightbox-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /prefers-reduced-motion/);
});
