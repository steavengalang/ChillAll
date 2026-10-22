const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const big = n => Array.from({ length: n }, (_, i) => ({ id: i, name: 'Row ' + i }));

/** jsdom has no layout: give the viewport a settable scrollTop and a fixed clientHeight. */
function mockViewport(window, el, clientHeight) {
    let top = 0;
    Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => top, set: v => { top = v; } });
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
    return v => { top = v; el.dispatchEvent(new window.Event('scroll')); };
}
const indexes = document => Array.from(document.querySelectorAll('.chillvirtuallist-item')).map(e => Number(e.getAttribute('data-index')));

test('chillvirtuallist renders only a small window for 100k items (fixed height)', () => {
    const { lib, document, window } = load('chillvirtuallist');
    const list = lib.create({ items: big(100000), itemHeight: 30, height: 300, overscan: 3, renderItem: it => it.name });
    document.body.appendChild(list.element);
    const scrollTo = mockViewport(window, list.element, 300);
    list.refresh();
    assert.equal(list.element.querySelector('.chillvirtuallist-content').style.height, '3000000px');
    assert.ok(document.querySelectorAll('.chillvirtuallist-item').length <= 20);
    assert.equal(document.querySelector('[data-index="0"]').textContent, 'Row 0');
    scrollTo(30 * 50000);
    const idx = indexes(document);
    assert.ok(idx.length <= 20 && idx.length >= 10);
    assert.ok(idx[0] >= 49990 && idx[0] <= 50000);
    assert.deepEqual(idx, idx.slice().sort((a, b) => a - b));            // DOM order == index order
    assert.equal(document.querySelector('[data-index="50000"]').style.top, '1500000px');
    assert.equal(document.querySelector('[data-index="0"]'), null);
    list.destroy();
    assert.equal(document.querySelector('.chillvirtuallist'), null);
});

test('chillvirtuallist ARIA: role=list, listitem, posinset/setsize, label', () => {
    const { lib, document } = load('chillvirtuallist');
    const list = lib.create({ items: big(500), ariaLabel: 'People' });
    document.body.appendChild(list.element);
    const c = document.querySelector('[role=list]');
    assert.equal(c.getAttribute('aria-label'), 'People');
    const it = document.querySelector('[role=listitem][data-index="2"]');
    assert.equal(it.getAttribute('aria-posinset'), '3');
    assert.equal(it.getAttribute('aria-setsize'), '500');
    assert.equal(list.element.tabIndex, 0);
    list.destroy();
});

test('chillvirtuallist variable heights via function; scrollToIndex alignments', () => {
    const { lib, document, window } = load('chillvirtuallist');
    const hf = (item, i) => (i % 2 ? 20 : 60);       // pairs sum to 80
    const list = lib.create({ items: big(1000), itemHeight: hf, height: 200, overscan: 0 });
    document.body.appendChild(list.element);
    mockViewport(window, list.element, 200);
    list.refresh();
    assert.equal(document.querySelector('.chillvirtuallist-content').style.height, '40000px');
    list.scrollToIndex(100);                           // offset of index 100 = 50 pairs * 80 = 4000
    assert.equal(list.element.scrollTop, 4000);
    assert.ok(document.querySelector('[data-index="100"]'));
    assert.equal(document.querySelector('[data-index="101"]').style.top, '4060px');
    list.scrollToIndex(100, 'center');                 // row height 60 -> 4000 - (200-60)/2
    assert.equal(list.element.scrollTop, 3930);
    list.scrollToIndex(100, 'end');                    // 4000 + 60 - 200
    assert.equal(list.element.scrollTop, 3860);
    list.scrollToIndex(100, 'auto');                   // already fully visible -> unchanged
    assert.equal(list.element.scrollTop, 3860);
    list.scrollToIndex(999999);                        // clamps to last item / max scroll
    assert.equal(list.element.scrollTop, 40000 - 200);
    assert.ok(document.querySelector('[data-index="999"]'));
    list.scrollToTop();
    assert.equal(list.element.scrollTop, 0);
    list.destroy();
});

test('chillvirtuallist renderItem: Node, text-only strings, html opt-in', () => {
    const { lib, document } = load('chillvirtuallist');
    const evil = '<img src=x onerror="window.__x=1">';
    const a = lib.create({ items: [evil, 'b'], renderItem: it => it });
    document.body.appendChild(a.element);
    assert.equal(document.querySelector('img'), null);
    assert.equal(document.querySelector('[data-index="0"]').textContent, evil);
    a.destroy();
    const b = lib.create({ items: ['x'], renderItem: it => { const s = document.createElement('b'); s.id = 'n'; s.textContent = it; return s; } });
    document.body.appendChild(b.element);
    assert.equal(document.querySelector('[data-index="0"] #n').textContent, 'x');
    b.destroy();
    const c = lib.create({ items: ['x'], html: true, renderItem: it => '<u id="h">' + it + '</u>' });
    document.body.appendChild(c.element);
    assert.ok(document.querySelector('#h'));
    c.destroy();
});

test('chillvirtuallist setItems/append/updateItem/onRangeChange and empty text', () => {
    const { lib, document, window } = load('chillvirtuallist');
    const ranges = [];
    let label = 'a';
    const list = lib.create({ items: [], emptyText: 'Nothing here', itemHeight: 20, height: 100, overscan: 0, renderItem: () => label, onRangeChange: (s, e) => ranges.push([s, e]) });
    document.body.appendChild(list.element);
    const scrollTo = mockViewport(window, list.element, 100);
    assert.equal(document.querySelector('.chillvirtuallist-empty').hidden, false);
    list.setItems(big(1000));
    assert.equal(document.querySelector('.chillvirtuallist-empty').hidden, true);
    const n = document.querySelectorAll('.chillvirtuallist-item').length;
    assert.ok(n >= 5 && n <= 7);
    list.append(big(10));
    assert.equal(list.getItems().length, 1010);
    assert.equal(document.querySelector('.chillvirtuallist-content').style.height, (1010 * 20) + 'px');
    assert.equal(document.querySelector('[data-index="0"]').getAttribute('aria-setsize'), '1000');   // rendered earlier
    label = 'b';
    list.updateItem(0);
    assert.equal(document.querySelector('[data-index="0"]').textContent, 'b');
    assert.equal(document.querySelector('[data-index="0"]').getAttribute('aria-setsize'), '1010');
    scrollTo(2000);
    assert.ok(ranges.length >= 2);
    assert.equal(JSON.stringify(list.getRange()), JSON.stringify({ start: 100, end: 105 }));
    list.destroy();
});

test('chillvirtuallist keyboard: PageDown / End / Home', () => {
    const { lib, document, window } = load('chillvirtuallist');
    const list = lib.create({ items: big(1000), itemHeight: 20, height: 200 });
    document.body.appendChild(list.element);
    mockViewport(window, list.element, 200);
    list.refresh();
    const key = k => list.element.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('PageDown');
    assert.ok(list.element.scrollTop >= 160 && list.element.scrollTop <= 200);
    key('End');
    assert.equal(list.element.scrollTop, 20000 - 200);
    assert.ok(document.querySelector('[data-index="999"]'));
    key('Home');
    assert.equal(list.element.scrollTop, 0);
    list.destroy();
});

test('chillvirtuallist auto-height rows are measured and offsets updated', () => {
    const { lib, document, window } = load('chillvirtuallist');
    const list = lib.create({ items: big(100), itemHeight: 'auto', estimatedHeight: 40, height: 200, overscan: 0 });
    document.body.appendChild(list.element);
    mockViewport(window, list.element, 200);
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.classList.contains('chillvirtuallist-item') ? 100 : 0; } });
    list.refresh();
    assert.equal(document.querySelector('.chillvirtuallist-content').style.height, (6 * 100 + 94 * 40) + 'px');
    assert.equal(document.querySelector('[data-index="1"]').style.top, '100px');
    list.destroy();
});

test('chillvirtuallist destroy removes scroll listener and ResizeObserver; init restores host', () => {
    const { lib, document, window } = load('chillvirtuallist');
    let disconnected = 0;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() { disconnected++; } };
    document.body.innerHTML = '<div id="h" class="mine"></div>';
    const list = lib.init('#h', { items: big(50), height: 150 });
    const host = document.getElementById('h');
    assert.ok(host.classList.contains('chillvirtuallist'));
    assert.equal(host.style.height, '150px');
    let calls = 0;
    list.on('scroll', () => calls++);
    host.dispatchEvent(new window.Event('scroll'));
    assert.equal(calls, 1);
    list.destroy();
    assert.equal(disconnected, 1);
    host.dispatchEvent(new window.Event('scroll'));
    assert.equal(calls, 1);
    assert.equal(host.className, 'mine');
    assert.equal(host.children.length, 0);
    list.destroy();
});
