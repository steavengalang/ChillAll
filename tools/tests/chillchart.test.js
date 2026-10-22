const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(config, { dark } = {}) {
    const env = load('chillchart');
    const { window, document } = env;
    // jsdom has no canvas: record draw calls with a mock 2d context
    const calls = [];
    const ctx = new Proxy({}, {
        get: (t, k) => (k in t ? t[k] : (...a) => { calls.push([k, ...a]); return k === 'measureText' ? { width: 10 } : undefined; }),
        set: (t, k, v) => { t[k] = v; return true; }
    });
    window.HTMLCanvasElement.prototype.getContext = () => ctx;
    window.HTMLElement.prototype.getBoundingClientRect = function () {
        return { left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0 };
    };
    const observers = [];
    window.ResizeObserver = class { constructor(cb) { this.cb = cb; this.disconnected = false; observers.push(this); } observe() {} unobserve() {} disconnect() { this.disconnected = true; } };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const chart = env.lib.create(host, config);
    return Object.assign(env, { host, chart, calls, ctx, observers });
}

const data = () => ({ labels: ['A', 'B', 'C'], datasets: [{ label: 'S1', data: [1, 5, 3] }, { label: 'S2', data: [2, 2, 8] }] });
const mouse = (window, type, x, y) => new window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true });

test('creates canvas with role=img, aria-label and sr-only data table', () => {
    const { host, chart } = setup({ type: 'bar', data: data() });
    const canvas = host.querySelector('canvas');
    assert.equal(canvas.getAttribute('role'), 'img');
    assert.match(canvas.getAttribute('aria-label'), /bar chart/);
    assert.equal(host.querySelectorAll('table tr').length, 4); // header + 3 labels
    chart.destroy();
});

test('XSS: labels in legend, table and tooltip are text-only', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const { host, window, chart } = setup({
        type: 'bar',
        data: { labels: [evil, 'B'], datasets: [{ label: evil, data: [5, 5] }] }
    });
    assert.equal(host.querySelector('img'), null);
    assert.equal(host.querySelector('.chillchart-legend-item').textContent, evil);
    const canvas = host.querySelector('canvas');
    canvas.dispatchEvent(mouse(window, 'pointermove', chart.hits[0].ax, chart.hits[0].ay + 5));
    const tip = host.querySelector('.chillchart-tooltip');
    assert.equal(tip.hidden, false);
    assert.equal(tip.querySelector('img'), null);
    assert.ok(tip.textContent.includes(evil));
    assert.equal(window.__x, undefined);
});

test('tooltip shows on hover for line points and hides on leave', () => {
    const { host, window, chart } = setup({ type: 'line', data: data() });
    const p = chart.hits[1];
    host.querySelector('canvas').dispatchEvent(mouse(window, 'pointermove', p.x + 1, p.y + 1));
    const tip = host.querySelector('.chillchart-tooltip');
    assert.equal(tip.hidden, false);
    assert.ok(tip.textContent.includes('S1: 5'));
    host.querySelector('canvas').dispatchEvent(new window.Event('pointerleave'));
    assert.equal(tip.hidden, true);
});

test('pie tooltip includes percentage; keyboard navigation works', () => {
    const { host, window } = setup({ type: 'pie', data: { labels: ['X', 'Y'], datasets: [{ data: [1, 3] }] } });
    const canvas = host.querySelector('canvas');
    canvas.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const tip = host.querySelector('.chillchart-tooltip');
    assert.equal(tip.hidden, false);
    assert.ok(tip.textContent.includes('X: 1 (25%)'));
    canvas.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(tip.hidden, true);
});

test('legend toggle hides a dataset, sets aria-pressed and fires callback', () => {
    const toggles = [];
    const { host, chart } = setup({ type: 'line', data: data(), options: { onLegendToggle: (i, v) => toggles.push([i, v]) } });
    assert.equal(chart.hits.length, 6);
    const btn = host.querySelectorAll('.chillchart-legend-item')[0];
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    btn.click();
    assert.equal(chart.hits.length, 3);
    assert.equal(host.querySelectorAll('.chillchart-legend-item')[0].getAttribute('aria-pressed'), 'false');
    assert.deepEqual(toggles, [[0, false]]);
    chart.toggleDataset(0, true);
    assert.equal(chart.hits.length, 6);
});

test('does not produce NaN for degenerate data', () => {
    const { calls, chart } = setup({ type: 'line', data: { labels: ['only'], datasets: [{ data: [7] }] } });
    chart.update({ labels: [], datasets: [] });
    chart.update({ labels: ['a'], datasets: [{ data: [0] }] });
    for (const t of ['bar', 'pie', 'doughnut']) {
        chart.config.type = t; chart.update({ labels: ['a', 'b'], datasets: [{ data: [0, 0] }] });
    }
    for (const c of calls) for (const a of c.slice(1)) if (typeof a === 'number') assert.ok(isFinite(a), c.join(','));
});

test('responsive: ResizeObserver redraws and is disconnected on destroy', () => {
    const { chart, observers, host } = setup({ type: 'bar', data: data() });
    assert.equal(observers.length, 1);
    chart.destroy();
    assert.equal(observers[0].disconnected, true);
    assert.equal(host.querySelector('canvas'), null);
    chart.destroy();
});

test('theme: follows data-theme and redraws when it changes', async () => {
    const { document, window, ctx, chart, calls } = setup({ type: 'bar', data: data() });
    const bgs = () => calls.length;
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise(r => setTimeout(r, 20));
    assert.equal(ctx.fillStyle !== undefined, true);
    const before = calls.length;
    document.documentElement.setAttribute('data-theme', 'light');
    await new Promise(r => setTimeout(r, 20));
    assert.ok(calls.length > before);
    chart.destroy();
    const after = calls.length;
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise(r => setTimeout(r, 20));
    assert.equal(calls.length, after);
});

test('dark mode CSS covers data-theme and .dark', () => {
    const { document } = setup({ type: 'bar', data: data() });
    const css = document.getElementById('chillchart-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"], :root.dark'));
    assert.ok(css.includes(':root:not([data-theme="light"]):not(.light)'));
});
