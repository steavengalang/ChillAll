/**
 * ChillChart - Zero-dependency Chart Library (canvas)
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const c = ChillChart.create('#el', {
 *     type: 'line',                       // 'line' | 'bar' | 'pie' | 'doughnut'
 *     data: { labels: ['A', 'B'], datasets: [{ label: 'Sales', data: [3, 5], color: '#3b82f6' }] },
 *     options: { showLegend: true, tooltip: true }
 *   });
 *   c.update(newData);  c.destroy();
 *
 * options (all optional):
 *   padding 40, showGrid true, showLegend true, animation (reserved, charts draw instantly)
 *   tooltip true            hover/touch/keyboard (focus the chart, use arrows) tooltip; text is always escaped
 *   tooltipFormat           fn(info) -> string   info = { label, value, dataset, datasetIndex, index, percent? }
 *   legendToggle true       legend items are buttons that show/hide a dataset (or a pie slice)
 *   minHeight 200           used when the container has no height of its own
 *   background              CSS colour for the canvas background ('transparent' for none; default theme-aware)
 *   ariaLabel               accessible name of the chart (default is generated)
 *   onPointClick            fn(info)           onLegendToggle fn(index, visible)
 * Methods: update(data), render(), resize(), toggleDataset(index, visible?), getHidden(), on(evt, fn), destroy()
 * Events:  'click' (info), 'toggle' (index, visible)
 * Responsive: a ResizeObserver redraws when the container resizes (disconnected on destroy).
 * Theme: follows [data-theme] / .dark / .light on <html>, else prefers-color-scheme; redraws on change.
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;

    const defaultColors = [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
        '#a855f7', '#06b6d4', '#ec4899', '#84cc16'
    ];

    const FONT = '12px -apple-system, BlinkMacSystemFont, sans-serif';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chillchart-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillchart-styles';
        style.textContent = `
      :root {
        --chillchart-text: #171717;
        --chillchart-text-light: #737373;
        --chillchart-tooltip-bg: #171717;
        --chillchart-tooltip-text: #fafafa;
        --chillchart-focus: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillchart-text: #fafafa;
          --chillchart-text-light: #a3a3a3;
          --chillchart-tooltip-bg: #fafafa;
          --chillchart-tooltip-text: #171717;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillchart-text: #fafafa;
        --chillchart-text-light: #a3a3a3;
        --chillchart-tooltip-bg: #fafafa;
        --chillchart-tooltip-text: #171717;
      }

      .chillchart {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .chillchart-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }

      .chillchart-canvas:focus-visible {
        outline: 2px solid var(--chillchart-focus);
        outline-offset: 2px;
      }

      .chillchart-legend {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2px 6px;
        margin: 0;
        padding: 0;
        list-style: none;
        font: 12px -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--chillchart-text);
        pointer-events: none;
      }

      .chillchart-legend li { margin: 0; padding: 0; pointer-events: auto; }

      .chillchart-legend-item {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        min-height: 24px;
        border-radius: 6px;
        cursor: pointer;
        color: var(--chillchart-text);
        font: inherit;
      }

      .chillchart-legend-item:hover { background: rgba(127, 127, 127, 0.15); }

      .chillchart-legend-item:focus-visible {
        outline: 2px solid var(--chillchart-focus);
        outline-offset: 1px;
      }

      .chillchart-legend-item[aria-pressed="false"] { opacity: 0.45; text-decoration: line-through; }

      .chillchart-legend-static { cursor: default; }

      .chillchart-swatch {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        flex: none;
      }

      .chillchart-tooltip {
        position: absolute;
        z-index: 2;
        pointer-events: none;
        transform: translate(-50%, -100%);
        padding: 6px 10px;
        font: 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
        border-radius: 6px;
        background: var(--chillchart-tooltip-bg);
        color: var(--chillchart-tooltip-text);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        white-space: nowrap;
        transition: opacity 0.12s ease;
      }

      .chillchart-tooltip[hidden] { display: none; }

      .chillchart-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillchart-tooltip { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function isDarkTheme() {
        const root = typeof document !== 'undefined' ? document.documentElement : null;
        if (root) {
            const t = root.getAttribute('data-theme');
            if (t === 'dark' || root.classList.contains('dark')) return true;
            if (t === 'light' || root.classList.contains('light')) return false;
        }
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch (e) { return false; }
    }

    function getThemeColors() {
        const isDark = isDarkTheme();
        return {
            text: isDark ? '#fafafa' : '#171717',
            textLight: isDark ? '#a3a3a3' : '#737373',
            grid: isDark ? '#404040' : '#e5e5e5',
            bg: isDark ? '#171717' : '#ffffff'
        };
    }

    function num(v) {
        const n = Number(v);
        return isFinite(n) ? n : 0;
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    class ChillChartInstance {
        constructor(container, config = {}) {
            this.container = typeof container === 'string'
                ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
                : container;

            this.config = {
                type: config.type || 'line',
                data: config.data || { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    padding: 40,
                    showGrid: true,
                    showLegend: true,
                    animation: true,
                    tooltip: true,
                    legendToggle: true,
                    minHeight: 200,
                    ...config.options
                }
            };

            this.canvas = null;
            this.ctx = null;
            this.hits = [];
            this.hidden = new Set();
            this._handlers = {};
            this._cleanups = [];
            this._destroyed = false;
            this._raf = 0;
            this._active = -1;
            this.width = 0;
            this.height = 0;
            this.id = 'chillchart-' + (++uid);

            if (this.container) {
                this.init();
            }
        }

        init() {
            injectCSS();
            this.createCanvas();
            this.render();
            this.setupResize();
            this.setupTheme();
            this.setupInteraction();
        }

        // ---- events ---------------------------------------------------------
        on(event, fn) {
            (this._handlers[event] = this._handlers[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._handlers[event];
            if (l) this._handlers[event] = fn ? l.filter(f => f !== fn) : [];
            return this;
        }

        _emit(event, ...args) {
            (this._handlers[event] || []).slice().forEach(fn => { try { fn(...args); } catch (e) { /* ignore */ } });
        }

        _listen(target, type, fn, opts) {
            target.addEventListener(type, fn, opts);
            this._cleanups.push(() => target.removeEventListener(type, fn, opts));
        }

        // ---- setup ----------------------------------------------------------
        createCanvas() {
            this.container.textContent = '';
            const wrap = el('div', 'chillchart');
            wrap.style.minHeight = (num(this.config.options.minHeight) || 200) + 'px';
            this.wrap = wrap;

            this.canvas = el('canvas', 'chillchart-canvas');
            this.canvas.setAttribute('role', 'img');
            this.canvas.setAttribute('tabindex', '0');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            wrap.appendChild(this.canvas);

            this.table = el('table', 'chillchart-sr-only');
            wrap.appendChild(this.table);

            this.legend = el('ul', 'chillchart-legend');
            this.legend.setAttribute('aria-label', 'Chart legend');
            wrap.appendChild(this.legend);

            this.tooltip = el('div', 'chillchart-tooltip');
            this.tooltip.id = this.id + '-tip';
            this.tooltip.setAttribute('role', 'tooltip');
            this.tooltip.hidden = true;
            wrap.appendChild(this.tooltip);

            this.container.appendChild(wrap);
            try { this.ctx = this.canvas.getContext && this.canvas.getContext('2d'); } catch (e) { this.ctx = null; }
            this.resize();
        }

        resize() {
            if (!this.canvas || !this.wrap) return;
            const rect = this.wrap.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.width = rect.width;
            this.height = rect.height;
            this.canvas.width = Math.max(0, Math.round(rect.width * dpr));
            this.canvas.height = Math.max(0, Math.round(rect.height * dpr));
            if (this.ctx && this.ctx.setTransform) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            else if (this.ctx) this.ctx.scale(dpr, dpr);
        }

        setupResize() {
            if (typeof window.ResizeObserver !== 'function') return;
            this._ro = new window.ResizeObserver(() => {
                if (this._destroyed) return;
                if (this._raf && window.cancelAnimationFrame) window.cancelAnimationFrame(this._raf);
                const run = () => { this._raf = 0; if (this._destroyed) return; this.resize(); this.render(); };
                if (window.requestAnimationFrame) this._raf = window.requestAnimationFrame(run);
                else run();
            });
            this._ro.observe(this.wrap);
            this._cleanups.push(() => { this._ro.disconnect(); this._ro = null; });
        }

        setupTheme() {
            const redraw = () => { if (!this._destroyed) this.render(); };
            if (typeof window.MutationObserver === 'function' && document.documentElement) {
                const mo = new window.MutationObserver(redraw);
                mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
                this._cleanups.push(() => mo.disconnect());
            }
            try {
                const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                if (mq && mq.addEventListener) {
                    mq.addEventListener('change', redraw);
                    this._cleanups.push(() => mq.removeEventListener('change', redraw));
                }
            } catch (e) { /* matchMedia unavailable */ }
        }

        setupInteraction() {
            const c = this.canvas;
            this._listen(c, 'pointermove', e => { if (this.config.options.tooltip) this._hover(e); });
            this._listen(c, 'pointerdown', e => { if (this.config.options.tooltip) this._hover(e); });
            this._listen(c, 'pointerleave', () => this._hideTip());
            this._listen(c, 'click', e => {
                const hit = this._hitAt(e);
                if (hit) this._fireClick(hit.info);
            });
            this._listen(c, 'blur', () => { this._active = -1; this._hideTip(); });
            this._listen(c, 'keydown', e => this._onKey(e));
            this._listen(this.legend, 'click', e => {
                const b = e.target && e.target.closest && e.target.closest('.chillchart-legend-item');
                if (!b || !this.legend.contains(b) || b.dataset.index === undefined) return;
                this.toggleDataset(parseInt(b.dataset.index, 10));
            });
        }

        _fireClick(info) {
            const o = this.config.options;
            if (typeof o.onPointClick === 'function') o.onPointClick(info);
            this._emit('click', info);
        }

        _hitAt(e) {
            if (!this.canvas) return null;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            let best = null;
            let bestD = Infinity;
            for (const h of this.hits) {
                if (h.kind === 'pt') {
                    const d = Math.hypot(x - h.x, y - h.y);
                    if (d <= h.r && d < bestD) { best = h; bestD = d; }
                } else if (h.kind === 'rect') {
                    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { best = h; bestD = 0; }
                } else if (h.kind === 'arc') {
                    const dx = x - h.cx;
                    const dy = y - h.cy;
                    const d = Math.hypot(dx, dy);
                    if (d < h.r0 || d > h.r1) continue;
                    let a = Math.atan2(dy, dx);
                    while (a < -Math.PI / 2) a += Math.PI * 2;
                    if (a >= h.a0 && a < h.a1) { best = h; bestD = 0; }
                }
            }
            return best;
        }

        _hover(e) {
            const hit = this._hitAt(e);
            if (hit) this._showTip(hit); else this._hideTip();
        }

        _onKey(e) {
            if (!this.hits.length) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this._active = (this._active + 1) % this.hits.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this._active = this._active <= 0 ? this.hits.length - 1 : this._active - 1;
            } else if (e.key === 'Escape') {
                this._active = -1; this._hideTip(); return;
            } else if ((e.key === 'Enter' || e.key === ' ') && this._active >= 0) {
                e.preventDefault();
                this._fireClick(this.hits[this._active].info);
                return;
            } else return;
            e.preventDefault();
            if (this.config.options.tooltip) this._showTip(this.hits[this._active]);
        }

        _tipText(info) {
            const f = this.config.options.tooltipFormat;
            if (typeof f === 'function') {
                const out = f(info);
                return [out === null || out === undefined ? '' : String(out)];
            }
            if (info.percent !== undefined) return [info.label + ': ' + info.value + ' (' + info.percent + '%)'];
            return [String(info.label), (info.dataset.label || 'Dataset ' + (info.datasetIndex + 1)) + ': ' + info.value];
        }

        _showTip(hit) {
            const t = this.tooltip;
            if (!t) return;
            t.textContent = '';
            this._tipText(hit.info).forEach((line, i) => {
                const d = el('div', i === 0 && hit.info.percent === undefined && typeof this.config.options.tooltipFormat !== 'function' ? 'chillchart-tooltip-title' : null, line);
                if (d.className) d.style.fontWeight = '600';
                t.appendChild(d);
            });
            t.hidden = false;
            const ax = Math.max(0, Math.min(this.width, hit.ax));
            t.style.left = ax + 'px';
            t.style.top = Math.max(0, hit.ay - 8) + 'px';
            this.canvas.setAttribute('aria-describedby', t.id);
        }

        _hideTip() {
            if (this.tooltip) this.tooltip.hidden = true;
            if (this.canvas) this.canvas.removeAttribute('aria-describedby');
        }

        // ---- data helpers ---------------------------------------------------
        _labels() { return (this.config.data && this.config.data.labels) || []; }
        _datasets() { return (this.config.data && this.config.data.datasets) || []; }
        _isPie() { return this.config.type === 'pie' || this.config.type === 'doughnut'; }

        _color(dataset, di) {
            return dataset.color || defaultColors[di % defaultColors.length];
        }

        _sliceColor(i) {
            const ds = this._datasets()[0];
            return (ds && ds.colors && ds.colors[i]) || defaultColors[i % defaultColors.length];
        }

        toggleDataset(index, visible) {
            const shouldShow = visible === undefined ? this.hidden.has(index) : !!visible;
            if (shouldShow) this.hidden.delete(index); else this.hidden.add(index);
            this.render();
            const op = this.config.options;
            if (typeof op.onLegendToggle === 'function') op.onLegendToggle(index, shouldShow);
            this._emit('toggle', index, shouldShow);
            return this;
        }

        getHidden() { return [...this.hidden]; }

        // ---- render ---------------------------------------------------------
        render() {
            if (this._destroyed || !this.canvas) return;
            this.hits = [];
            this._active = -1;
            this._hideTip();
            this._syncAria();
            this._syncLegend();

            if (!this.ctx || !(this.width > 0) || !(this.height > 0)) return;
            this.clear();

            switch (this.config.type) {
                case 'line':
                    this.renderLineChart();
                    break;
                case 'bar':
                    this.renderBarChart();
                    break;
                case 'pie':
                case 'doughnut':
                    this.renderPieChart(this.config.type === 'doughnut');
                    break;
            }
        }

        _syncAria() {
            const { options } = this.config;
            const labels = this._labels();
            const datasets = this._datasets();
            const type = this.config.type;
            const label = options.ariaLabel ||
                (type + ' chart with ' + datasets.length + (datasets.length === 1 ? ' dataset' : ' datasets') +
                    ' and ' + labels.length + (labels.length === 1 ? ' label' : ' labels'));
            this.canvas.setAttribute('aria-label', label);

            // data table fallback for assistive tech (built with textContent only)
            const t = this.table;
            t.textContent = '';
            const cap = el('caption', null, label);
            t.appendChild(cap);
            const head = el('tr');
            head.appendChild(el('th', null, ''));
            if (this._isPie()) head.appendChild(el('th', null, (datasets[0] && datasets[0].label) || 'Value'));
            else datasets.forEach((d, i) => head.appendChild(el('th', null, d.label || 'Dataset ' + (i + 1))));
            t.appendChild(head);
            labels.forEach((l, i) => {
                const tr = el('tr');
                tr.appendChild(el('th', null, String(l)));
                const cols = this._isPie() ? [datasets[0]] : datasets;
                cols.forEach(d => tr.appendChild(el('td', null, String(d && d.data ? d.data[i] : ''))));
                t.appendChild(tr);
            });
        }

        _syncLegend() {
            const lg = this.legend;
            lg.textContent = '';
            lg.hidden = !this.config.options.showLegend;
            if (!this.config.options.showLegend) return;
            const toggle = this.config.options.legendToggle !== false;
            const items = this._isPie()
                ? this._labels().map((l, i) => ({ label: String(l), color: this._sliceColor(i), index: i }))
                : this._datasets().map((d, i) => ({ label: d.label || 'Dataset ' + (i + 1), color: this._color(d, i), index: i }));
            items.forEach(it => {
                const li = el('li');
                const b = el(toggle ? 'button' : 'span', 'chillchart-legend-item' + (toggle ? '' : ' chillchart-legend-static'));
                if (toggle) {
                    b.type = 'button';
                    b.dataset.index = String(it.index);
                    b.setAttribute('aria-pressed', this.hidden.has(it.index) ? 'false' : 'true');
                }
                const sw = el('span', 'chillchart-swatch');
                sw.style.background = it.color;
                sw.setAttribute('aria-hidden', 'true');
                b.appendChild(sw);
                b.appendChild(document.createTextNode(it.label));
                li.appendChild(b);
                lg.appendChild(li);
            });
        }

        clear() {
            const bg = this.config.options.background;
            if (bg === 'transparent') {
                this.ctx.clearRect(0, 0, this.width, this.height);
                return;
            }
            this.ctx.fillStyle = bg || getThemeColors().bg;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        _drawGrid(theme, padding, chartWidth, chartHeight) {
            if (!this.config.options.showGrid) return;
            this.ctx.strokeStyle = theme.grid;
            this.ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding + (chartHeight / 5) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(padding, y);
                this.ctx.lineTo(padding + chartWidth, y);
                this.ctx.stroke();
            }
        }

        _visible() {
            return this._datasets().map((d, i) => ({ d, i })).filter(o => !this.hidden.has(o.i));
        }

        renderLineChart() {
            const { options } = this.config;
            const labels = this._labels();
            const theme = getThemeColors();
            const padding = options.padding;
            const chartWidth = Math.max(0, this.width - padding * 2);
            const chartHeight = Math.max(0, this.height - padding * 2 - 30);
            const vis = this._visible();
            const n = labels.length;
            const xAt = i => padding + (n > 1 ? (chartWidth / (n - 1)) * i : chartWidth / 2);

            const allValues = vis.flatMap(o => o.d.data.map(num));
            const minVal = Math.min(0, ...allValues);
            const maxVal = allValues.length ? Math.max(...allValues) : 1;
            const range = maxVal - minVal || 1;

            this._drawGrid(theme, padding, chartWidth, chartHeight);

            // Labels
            this.ctx.fillStyle = theme.textLight;
            this.ctx.font = FONT;
            this.ctx.textAlign = 'center';
            const labelStep = Math.max(1, Math.ceil(n / 8));
            labels.forEach((label, i) => {
                if (i % labelStep === 0) this.ctx.fillText(String(label), xAt(i), this.height - padding + 20);
            });

            // Lines
            vis.forEach(({ d: dataset, i: di }) => {
                const color = this._color(dataset, di);
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();

                const pts = dataset.data.map((value, i) => ({
                    x: xAt(i),
                    y: padding + chartHeight - ((num(value) - minVal) / range) * chartHeight,
                    value: num(value)
                }));
                pts.forEach((p, i) => { if (i === 0) this.ctx.moveTo(p.x, p.y); else this.ctx.lineTo(p.x, p.y); });
                this.ctx.stroke();

                pts.forEach((p, i) => {
                    this.ctx.beginPath();
                    this.ctx.fillStyle = color;
                    this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.hits.push({
                        kind: 'pt', x: p.x, y: p.y, r: 16, ax: p.x, ay: p.y,
                        info: { label: labels[i] !== undefined ? labels[i] : i, value: p.value, dataset, datasetIndex: di, index: i }
                    });
                });
            });
        }

        renderBarChart() {
            const { options } = this.config;
            const labels = this._labels();
            const theme = getThemeColors();
            const padding = options.padding;
            const chartWidth = Math.max(0, this.width - padding * 2);
            const chartHeight = Math.max(0, this.height - padding * 2 - 30);
            const vis = this._visible();

            const allValues = vis.flatMap(o => o.d.data.map(num));
            const minVal = Math.min(0, ...allValues);
            const maxVal = Math.max(0, ...allValues);
            const range = maxVal - minVal || 1;
            const yOf = v => padding + chartHeight - ((v - minVal) / range) * chartHeight;
            const zeroY = yOf(0);

            this._drawGrid(theme, padding, chartWidth, chartHeight);

            const numDatasets = Math.max(1, vis.length);
            const numLabels = Math.max(1, labels.length);
            const groupWidth = chartWidth / numLabels;
            const barWidth = (groupWidth * 0.8) / numDatasets;
            const barGap = groupWidth * 0.1;

            this.ctx.fillStyle = theme.textLight;
            this.ctx.font = FONT;
            this.ctx.textAlign = 'center';
            labels.forEach((label, i) => {
                this.ctx.fillText(String(label), padding + groupWidth * i + groupWidth / 2, this.height - padding + 20);
            });

            vis.forEach(({ d: dataset, i: di }, slot) => {
                const color = this._color(dataset, di);
                dataset.data.forEach((raw, i) => {
                    const value = num(raw);
                    const vy = yOf(value);
                    const y = Math.min(vy, zeroY);
                    const h = Math.abs(zeroY - vy);
                    const x = padding + groupWidth * i + barGap + barWidth * slot;
                    const w = Math.max(1, barWidth - 4);
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, w, h);
                    this.hits.push({
                        kind: 'rect', x, y, w, h: Math.max(h, 4), ax: x + w / 2, ay: y,
                        info: { label: labels[i] !== undefined ? labels[i] : i, value, dataset, datasetIndex: di, index: i }
                    });
                });
            });
        }

        renderPieChart(isDoughnut = false) {
            const { options } = this.config;
            const labels = this._labels();
            const centerX = this.width / 2;
            const centerY = (this.height - 40) / 2;
            const radius = Math.max(0, Math.min(centerX, centerY) - options.padding);
            const innerRadius = isDoughnut ? radius * 0.6 : 0;

            const dataset = this._datasets()[0] || { data: [] };
            const values = dataset.data.map((v, i) => (this.hidden.has(i) ? 0 : Math.max(0, num(v))));
            const total = values.reduce((a, b) => a + b, 0);
            if (!(total > 0) || radius <= 0) return;

            let startAngle = -Math.PI / 2;
            values.forEach((value, i) => {
                if (value <= 0) return;
                const sliceAngle = (value / total) * Math.PI * 2;
                const end = startAngle + sliceAngle;
                this.ctx.beginPath();
                if (isDoughnut) {
                    this.ctx.arc(centerX, centerY, radius, startAngle, end);
                    this.ctx.arc(centerX, centerY, innerRadius, end, startAngle, true);
                } else {
                    this.ctx.moveTo(centerX, centerY);
                    this.ctx.arc(centerX, centerY, radius, startAngle, end);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = this._sliceColor(i);
                this.ctx.fill();

                const mid = (startAngle + end) / 2;
                const mr = (radius + innerRadius) / 2;
                this.hits.push({
                    kind: 'arc', cx: centerX, cy: centerY, r0: innerRadius, r1: radius, a0: startAngle, a1: end,
                    ax: centerX + Math.cos(mid) * mr, ay: centerY + Math.sin(mid) * mr,
                    info: {
                        label: labels[i] !== undefined ? labels[i] : i, value: num(dataset.data[i]), dataset, datasetIndex: 0, index: i,
                        percent: Math.round((value / total) * 1000) / 10
                    }
                });
                startAngle = end;
            });
        }

        update(data) {
            this.config.data = data || { labels: [], datasets: [] };
            // drop hidden indices that no longer exist
            const max = this._isPie() ? this._labels().length : this._datasets().length;
            [...this.hidden].forEach(i => { if (i >= max) this.hidden.delete(i); });
            this.render();
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            if (this._raf && window.cancelAnimationFrame) window.cancelAnimationFrame(this._raf);
            this._raf = 0;
            this._cleanups.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
            this._cleanups = [];
            if (this.wrap && this.wrap.parentNode) this.wrap.parentNode.removeChild(this.wrap);
            this._handlers = {};
            this.hits = [];
            this.canvas = this.ctx = this.wrap = this.legend = this.tooltip = this.table = null;
        }
    }

    const ChillChart = {
        version: VERSION,

        create(container, config) {
            return new ChillChartInstance(container, config);
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillChart;
    } else {
        window.ChillChart = ChillChart;
    }

})(typeof window !== 'undefined' ? window : this);
