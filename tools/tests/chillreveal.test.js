const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const wait = ms => new Promise(r => setTimeout(r, ms));

function setup(html, opts, ctxOpts = {}) {
    const ctx = load('chillreveal');
    const { window, document } = ctx;
    const ios = [];
    if (!ctxOpts.noIO) {
        window.IntersectionObserver = class {
            constructor(cb, o) { this.cb = cb; this.o = o; this.targets = new Set(); this.disconnected = false; ios.push(this); }
            observe(t) { this.targets.add(t); } unobserve(t) { this.targets.delete(t); } disconnect() { this.disconnected = true; this.targets.clear(); }
        };
    } else window.IntersectionObserver = undefined;
    if (ctxOpts.reduced) window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    document.body.innerHTML = html || `
      <div id="a" data-chill-reveal="slide-left" data-chill-reveal-delay="100" data-chill-reveal-distance="40" class="keep"></div>
      <div id="b" data-chill-reveal></div>
      <div id="c" data-chill-reveal="zoom" data-chill-reveal-duration="900"></div>`;
    const r = ctx.lib.init('[data-chill-reveal]', opts);
    return Object.assign(ctx, { r, ios });
}
const enter = (io, els, on = true) => io.cb(els.map(t => ({ target: t, isIntersecting: on })));

test('SSR import safe', () => { assert.ok(loadSSR('chillreveal').init); });

test('applies hidden state classes/vars only after init, per-element overrides honoured', () => {
    const { r, document, ios } = setup();
    const a = document.getElementById('a'), b = document.getElementById('b'), c = document.getElementById('c');
    assert.ok(a.classList.contains('chillreveal') && a.classList.contains('chillreveal-slide-left'));
    assert.ok(b.classList.contains('chillreveal-slide-up')); // default
    assert.ok(c.classList.contains('chillreveal-zoom-in'));  // alias
    assert.equal(a.style.getPropertyValue('--chillreveal-distance'), '40px');
    assert.equal(c.style.getPropertyValue('--chillreveal-duration'), '900ms');
    assert.equal(ios[0].targets.size, 3);
    assert.equal(ios[0].o.threshold, 0.15);
    r.destroy();
});

test('reveals when intersecting, with delay, onReveal; once => unobserved', async () => {
    const seen = [];
    const { r, document, ios } = setup(null, { onReveal: el => seen.push(el.id), delay: 10 });
    const a = document.getElementById('a'), b = document.getElementById('b');
    enter(ios[0], [b]);
    assert.ok(b.classList.contains('chillreveal-visible'));
    assert.equal(b.style.getPropertyValue('--chillreveal-delay'), '10ms');
    assert.equal(b.getAttribute('data-chill-revealed'), 'true');
    assert.equal(ios[0].targets.has(b), false);
    enter(ios[0], [a]);
    assert.equal(a.style.getPropertyValue('--chillreveal-delay'), '100ms'); // attribute overrides option
    assert.equal(seen.join(), 'b,a');
    // intersecting again is a no-op
    enter(ios[0], [b]); assert.equal(seen.length, 2);
    await wait(10);
    r.destroy();
});

test('stagger applies in document order within one batch', () => {
    const html = '<p id="p1" data-chill-reveal="fade"></p><p id="p2" data-chill-reveal="fade"></p><p id="p3" data-chill-reveal="fade"></p>';
    const { r, document, ios } = setup(html, { stagger: 100 });
    const [p1, p2, p3] = ['p1', 'p2', 'p3'].map(i => document.getElementById(i));
    enter(ios[0], [p3, p1, p2]); // reversed on purpose
    assert.equal(p1.style.getPropertyValue('--chillreveal-delay'), '0ms');
    assert.equal(p2.style.getPropertyValue('--chillreveal-delay'), '100ms');
    assert.equal(p3.style.getPropertyValue('--chillreveal-delay'), '200ms');
    r.destroy();
});

test('once:false hides again on exit and animates again on re-entry; onHide fires', () => {
    const log = [];
    const { r, document, ios } = setup(null, { once: false, onHide: el => log.push('hide-' + el.id), onReveal: el => log.push('show-' + el.id) });
    const b = document.getElementById('b');
    enter(ios[0], [b]);
    assert.ok(ios[0].targets.has(b));
    enter(ios[0], [b], false);
    assert.equal(b.classList.contains('chillreveal-visible'), false);
    enter(ios[0], [b]);
    assert.equal(b.classList.contains('chillreveal-visible'), true);
    assert.equal(log.join(), 'show-b,hide-b,show-b');
    r.destroy();
});

test('per-element data-chill-reveal-once overrides global option', () => {
    const html = '<div id="x" data-chill-reveal="fade" data-chill-reveal-once="false"></div>';
    const { r, document, ios } = setup(html, { once: true });
    const x = document.getElementById('x');
    enter(ios[0], [x]); enter(ios[0], [x], false);
    assert.equal(x.classList.contains('chillreveal-visible'), false);
    r.destroy();
});

test('reveal() / hide() programmatic control and refresh() for new elements', () => {
    const { r, document, ios } = setup();
    const b = document.getElementById('b');
    r.reveal(b);
    assert.ok(b.classList.contains('chillreveal-visible'));
    r.hide(b);
    assert.equal(b.classList.contains('chillreveal-visible'), false);
    assert.ok(ios[0].targets.has(b));
    const n = document.createElement('div'); n.setAttribute('data-chill-reveal', 'fade'); document.body.appendChild(n);
    r.refresh();
    assert.equal(r.elements.length, 4);
    assert.ok(ios[0].targets.has(n));
    r.refresh(); assert.equal(r.elements.length, 4);
    r.destroy();
});

test('destroy restores original attributes, disconnects observer', () => {
    const { r, document, ios } = setup();
    const a = document.getElementById('a');
    enter(ios[0], [a]);
    r.destroy();
    assert.equal(ios[0].disconnected, true);
    assert.equal(a.getAttribute('class'), 'keep');
    assert.equal(a.getAttribute('style'), null);
    assert.equal(a.hasAttribute('data-chill-revealed'), false);
    r.destroy();
});

test('reduced motion: nothing hidden, onReveal called immediately, no observer', () => {
    const seen = [];
    const { r, document, ios } = setup(null, { onReveal: el => seen.push(el.id) }, { reduced: true });
    assert.equal(ios.length, 0);
    assert.equal(document.querySelectorAll('.chillreveal').length, 0);
    assert.equal(seen.length, 3);
    assert.equal(document.getElementById('b').getAttribute('data-chill-revealed'), 'true');
    r.destroy();
});

test('no IntersectionObserver: elements stay visible', () => {
    const { r, document } = setup(null, {}, { noIO: true });
    assert.equal(document.querySelectorAll('.chillreveal').length, 0);
    assert.equal(r.elements.length, 3);
    r.destroy();
});

test('CSS has reduced-motion rule, hidden state is not applied at load time', () => {
    const { document } = setup();
    const css = document.getElementById('chillreveal-styles').textContent;
    assert.ok(css.includes('prefers-reduced-motion'));
    const fresh = load('chillreveal');
    assert.equal(fresh.document.getElementById('chillreveal-styles'), null);
});
