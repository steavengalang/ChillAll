const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

const vals = document => Array.from(document.querySelectorAll('.chillcountdown-value')).map(e => e.textContent);
const wait = ms => new Promise(r => setTimeout(r, ms));

test('chillcountdown renders units, labels and timer role; destroy cleans up', () => {
    const { lib, document } = load('chillcountdown');
    let t = 0;
    const cd = lib.create({ target: 90061000, now: () => t });   // 1d 1h 1m 1s
    document.body.appendChild(cd.element);
    assert.equal(cd.element.getAttribute('role'), 'timer');
    assert.deepEqual(vals(document), ['01', '01', '01', '01']);
    assert.deepEqual(Array.from(document.querySelectorAll('.chillcountdown-label')).map(e => e.textContent), ['Days', 'Hours', 'Minutes', 'Seconds']);
    assert.match(cd.element.getAttribute('aria-label'), /1 day 1 hour 1 minute 1 second remaining/);
    cd.destroy();
    assert.equal(document.querySelector('.chillcountdown'), null);
});

test('chillcountdown counts down against an injected clock, fires onTick and onComplete once', () => {
    const { lib, document } = load('chillcountdown');
    let t = 1000;
    const ticks = [], done = [];
    const cd = lib.create({ target: 6000, now: () => t, onTick: (ms, p) => ticks.push(p.seconds), onComplete: () => done.push(1) });
    document.body.appendChild(cd.element);
    assert.deepEqual(vals(document), ['00', '00', '00', '05']);
    t = 3500; cd.tick();
    assert.deepEqual(vals(document), ['00', '00', '00', '03']);   // ceil
    t = 6000; cd.tick();
    assert.deepEqual(vals(document), ['00', '00', '00', '00']);
    assert.equal(done.length, 1);
    t = 9000; cd.tick();
    assert.equal(done.length, 1);
    assert.ok(cd.isComplete());
    assert.ok(cd.element.classList.contains('chillcountdown-complete'));
    assert.deepEqual(ticks.slice(0, 2), [3, 0]);
    cd.destroy();
});

test('chillcountdown units subset: largest unit absorbs the rest; inline variant', () => {
    const { lib, document } = load('chillcountdown');
    const cd = lib.create({ duration: 3725000, units: ['minutes', 'seconds'], variant: 'inline', autoStart: false, showLabels: false });
    document.body.appendChild(cd.element);
    assert.deepEqual(vals(document), ['62', '05']);
    assert.ok(cd.element.classList.contains('chillcountdown-inline'));
    assert.equal(document.querySelector('.chillcountdown-label'), null);
    cd.destroy();
});

test('chillcountdown duration mode: pause/resume really stop the clock; reset restores', () => {
    const { lib, document } = load('chillcountdown');
    let t = 0;
    const cd = lib.create({ duration: 10000, units: ['seconds'], now: () => t });
    document.body.appendChild(cd.element);
    assert.deepEqual(vals(document), ['10']);
    t = 3000; cd.tick();
    assert.deepEqual(vals(document), ['07']);
    cd.pause();
    assert.equal(cd.isRunning(), false);
    assert.ok(cd.element.classList.contains('chillcountdown-paused'));
    t = 8000; cd.tick();
    assert.deepEqual(vals(document), ['07']);
    cd.resume();
    t = 9000; cd.tick();
    assert.deepEqual(vals(document), ['06']);
    cd.reset();
    assert.deepEqual(vals(document), ['10']);
    assert.equal(cd.isRunning(), true);
    cd.destroy();
});

test('chillcountdown countUp stopwatch with limit', () => {
    const { lib, document } = load('chillcountdown');
    let t = 0, done = 0;
    const cd = lib.create({ countUp: true, duration: 5000, units: ['seconds'], now: () => t, onComplete: () => done++ });
    document.body.appendChild(cd.element);
    assert.deepEqual(vals(document), ['00']);
    t = 2400; cd.tick();
    assert.deepEqual(vals(document), ['02']);
    assert.match(cd.element.getAttribute('aria-label'), /^Timer:.*elapsed$/);
    t = 6000; cd.tick();
    assert.deepEqual(vals(document), ['05']);
    assert.equal(done, 1);
    cd.destroy();
});

test('chillcountdown setTarget / setDuration and events', () => {
    const { lib, document } = load('chillcountdown');
    let t = 0;
    const ev = [];
    const cd = lib.create({ target: 5000, units: ['seconds'], now: () => t });
    ['pause', 'resume', 'complete'].forEach(e => cd.on(e, () => ev.push(e)));
    cd.setTarget(20000);
    assert.deepEqual(vals(document.body.appendChild(cd.element) && document), ['20']);
    cd.pause(); cd.resume();
    cd.setDuration(1000);
    t = 1000; cd.tick();
    assert.deepEqual(ev, ['pause', 'resume', 'complete']);
    cd.destroy();
});

test('chillcountdown real timers tick and stop after destroy', async () => {
    const { lib, document } = load('chillcountdown');
    let ticks = 0;
    const cd = lib.create({ duration: 5000, interval: 20, units: ['seconds'], onTick: () => ticks++ });
    document.body.appendChild(cd.element);
    await wait(120);
    assert.ok(ticks >= 2, 'ticks ' + ticks);
    cd.destroy();
    const n = ticks;
    await wait(80);
    assert.equal(ticks, n);
});

test('chillcountdown init enhances element via data-duration', () => {
    const { lib, document } = load('chillcountdown');
    document.body.innerHTML = '<div id="c" class="mine" data-duration="61000"></div>';
    const cd = lib.init('#c', { autoStart: false, units: ['minutes', 'seconds'] });
    const el = document.getElementById('c');
    assert.deepEqual(vals(document), ['01', '01']);
    cd.destroy();
    assert.equal(el.className, 'mine');
    assert.equal(el.children.length, 0);
});
