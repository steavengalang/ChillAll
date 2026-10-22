const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const key = (document, k, extra) => document.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, extra)));

function setup(opts) {
    const env = load('chilltour');
    env.document.body.innerHTML = '<button id="a">A</button><button id="b">B</button>';
    const calls = [];
    const tour = env.lib.create(Object.assign({
        steps: [
            { title: 'Welcome', content: 'Hello' },
            { target: '#a', title: 'First', content: 'Click here', onEnter: () => calls.push('enter1'), onExit: () => calls.push('exit1') },
            { target: '#b', title: 'Second', content: 'And here' }
        ],
        onFinish: c => calls.push('finish:' + c)
    }, opts));
    return Object.assign(env, { tour, calls });
}

test('chilltour is SSR safe', () => {
    assert.ok(loadSSR('chilltour').version);
});

test('chilltour start renders popover with ARIA, spotlight, progress and buttons', () => {
    const { tour, document } = setup();
    tour.start();
    const pop = document.querySelector('.chilltour-popover');
    assert.equal(pop.getAttribute('role'), 'dialog');
    assert.equal(document.getElementById(pop.getAttribute('aria-labelledby')).textContent, 'Welcome');
    assert.equal(document.getElementById(pop.getAttribute('aria-describedby')).textContent, 'Hello');
    assert.equal(pop.querySelector('.chilltour-progress span').textContent, 'Step 1 of 3');
    assert.equal(pop.querySelectorAll('.chilltour-dot').length, 3);
    assert.ok(document.querySelector('.chilltour-spotlight-none'), 'targetless step has no cut-out');
    assert.equal(pop.querySelector('.chilltour-btn-prev').style.display, 'none');
    assert.equal(pop.querySelector('.chilltour-btn-next').textContent, 'Next');
    assert.equal(document.activeElement, pop);
    tour.destroy();
    assert.equal(document.querySelector('.chilltour-popover'), null);
    assert.equal(document.querySelector('.chilltour-spotlight'), null);
    assert.equal(document.querySelector('.chilltour-blocker'), null);
});

test('chilltour next/prev/finish with callbacks, scrollIntoView and spotlight on target', () => {
    const { tour, document, window, calls } = setup();
    let scrolled = 0;
    window.Element.prototype.scrollIntoView = function () { scrolled++; };
    const rect = { top: 100, left: 50, right: 150, bottom: 140, width: 100, height: 40 };
    document.getElementById('a').getBoundingClientRect = () => rect;
    tour.start();
    tour.next();
    assert.equal(tour.index, 1);
    assert.equal(scrolled, 1);
    const spot = document.querySelector('.chilltour-spotlight');
    assert.equal(spot.style.top, '92px');
    assert.equal(spot.style.width, '116px');
    assert.deepEqual(calls, ['enter1']);
    tour.prev();
    assert.deepEqual(calls, ['enter1', 'exit1']);
    tour.goTo(2);
    assert.equal(document.querySelector('.chilltour-btn-next').textContent, 'Done');
    document.querySelector('.chilltour-btn-next').click();
    assert.equal(tour.isActive, false);
    assert.equal(calls[calls.length - 1], 'finish:true');
    assert.equal(document.querySelector('.chilltour-popover'), null);
});

test('chilltour Esc and Skip end tour with completed=false; keyboard arrows navigate', () => {
    const { tour, document, calls } = setup();
    tour.start();
    key(document, 'ArrowRight');
    assert.equal(tour.index, 1);
    key(document, 'ArrowLeft');
    assert.equal(tour.index, 0);
    key(document, 'Escape');
    assert.equal(tour.isActive, false);
    assert.deepEqual(calls.filter(c => c.startsWith('finish')), ['finish:false']);
    tour.start();
    document.querySelector('.chilltour-btn-skip').click();
    assert.equal(tour.isActive, false);
    // listeners removed after end
    key(document, 'ArrowRight');
    assert.equal(tour.index, -1);
});

test('chilltour returns focus and traps Tab within popover', () => {
    const { tour, document } = setup();
    const a = document.getElementById('a');
    a.focus();
    tour.start();
    const pop = document.querySelector('.chilltour-popover');
    const btns = Array.from(pop.querySelectorAll('button')).filter(b => b.style.display !== 'none');
    btns[btns.length - 1].focus();
    key(document, 'Tab');
    assert.equal(document.activeElement, btns[0]);
    tour.skip();
    assert.equal(document.activeElement, a);
});

test('chilltour text is escaped by default and missing targets fall back to centered', () => {
    const { lib, document } = load('chilltour');
    const bad = '<img src=x onerror=alert(1)>';
    const t = lib.create({ steps: [{ target: '#nope', title: bad, content: bad }] });
    t.start();
    assert.equal(document.querySelectorAll('.chilltour-popover img').length, 0);
    assert.equal(document.querySelector('.chilltour-popover').getAttribute('data-placement'), 'center');
    t.finish();
});

test('chilltour once persists completion and prevents restarting; destroy mid-tour cleans up', () => {
    const { lib, document, window } = load('chilltour');
    const mk = () => lib.create({ steps: [{ title: 'x' }], once: true, storageKey: 'k1' });
    const t = mk(); t.start(); t.finish();
    assert.equal(lib.hasSeen('k1'), true);
    const t2 = mk(); t2.start();
    assert.equal(t2.isActive, false);
    lib.reset('k1');
    assert.equal(lib.hasSeen('k1'), false);
    const t3 = mk(); t3.start(); assert.equal(t3.isActive, true);
    t3.destroy();
    assert.equal(document.querySelector('.chilltour-popover'), null);
    assert.equal(t3.isActive, false);
});

test('chilltour CSS has dark theme', () => {
    const { tour, document } = setup();
    tour.start();
    assert.match(document.getElementById('chilltour-styles').textContent, /:root\[data-theme="dark"\]/);
    tour.destroy();
});
