/**
 * ChillStat - Zero-dependency stat / KPI card
 *
 * @example
 *   const s = ChillStat.create({
 *     label: 'Revenue', value: 128450, prefix: '$', delta: 12.4,
 *     sparkline: [3, 5, 4, 8, 7, 11, 14], countUp: true,
 *     formatter: v => Math.round(v).toLocaleString()
 *   });
 *   document.body.appendChild(s.element);
 *   s.update({ value: 130000, delta: -2 });
 *
 * Options
 *   label        caption text                                            default ''
 *   value        number or string                                        default 0
 *   prefix / suffix  text around the formatted value                     default ''
 *   formatter    (number) => string                                      default Intl.NumberFormat (see `locale`, `decimals`)
 *   locale       BCP-47 locale for the default formatter                 default undefined (runtime default)
 *   decimals     fraction digits for the default formatter               default 0
 *   delta        number (percent change; sign decides direction)         default null
 *   deltaFormatter (number) => string                                    default v => Math.abs(v) + '%'
 *   deltaLabel   text after the delta, e.g. 'vs last month'               default ''
 *   invertDelta  treat a decrease as good (green) – e.g. churn, errors   default false
 *   sparkline    Array<number>                                           default null
 *   sparklineType 'line' | 'area' | 'bar'                                default 'area'
 *   color        accent colour for the sparkline (any CSS colour)        default theme blue
 *   icon         text/emoji/Node shown in a badge (aria-hidden)          default null
 *   countUp      animate from 0 (or previous value) to value; true | ms  default false
 *   size         'sm' | 'md' | 'lg'                                      default 'md'
 *   variant      'outlined' | 'filled' | 'flat'                          default 'outlined'
 *   loading      show skeleton                                           default false
 *   onClick      (event) => void – makes the card a focusable button      default null
 *
 * Methods: update(partial), setValue(v), setLoading(bool), on(evt, fn), off(evt, fn), destroy()
 * Events:  'update', 'click'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillstat-styles';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillstat-bg: #ffffff;
        --chillstat-text: #171717;
        --chillstat-muted: #6b7280;
        --chillstat-border: #e5e5e5;
        --chillstat-surface: #f3f4f6;
        --chillstat-primary: #3b82f6;
        --chillstat-up: #16a34a;
        --chillstat-down: #dc2626;
        --chillstat-up-bg: rgba(34,197,94,.14);
        --chillstat-down-bg: rgba(239,68,68,.14);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillstat-bg: #171717;
          --chillstat-text: #fafafa;
          --chillstat-muted: #a3a3a3;
          --chillstat-border: #404040;
          --chillstat-surface: #262626;
          --chillstat-up: #4ade80;
          --chillstat-down: #f87171;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillstat-bg: #171717;
        --chillstat-text: #fafafa;
        --chillstat-muted: #a3a3a3;
        --chillstat-border: #404040;
        --chillstat-surface: #262626;
        --chillstat-up: #4ade80;
        --chillstat-down: #f87171;
      }

      .chillstat { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 16px 20px; border-radius: 8px; background: var(--chillstat-bg); color: var(--chillstat-text); font-size: 14px; line-height: 1.3; font-family: inherit; box-sizing: border-box; min-width: 160px; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease; text-align: left; }
      .chillstat *, .chillstat *::before, .chillstat *::after { box-sizing: border-box; }
      .chillstat-outlined { border: 1px solid var(--chillstat-border); }
      .chillstat-filled { background: var(--chillstat-surface); border: 1px solid transparent; }
      .chillstat-flat { padding-left: 0; padding-right: 0; border: 0; background: transparent; }
      .chillstat-clickable { cursor: pointer; }
      .chillstat-clickable:hover { box-shadow: 0 4px 14px rgba(0,0,0,.1); transform: translateY(-1px); }
      .chillstat-clickable:focus-visible { outline: 2px solid var(--chillstat-primary); outline-offset: 2px; }
      .chillstat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .chillstat-label { color: var(--chillstat-muted); font-weight: 500; font-size: 13px; }
      .chillstat-icon { width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--chillstat-surface); font-size: 16px; flex-shrink: 0; }
      .chillstat-filled .chillstat-icon { background: var(--chillstat-bg); }
      .chillstat-value { font-size: 28px; font-weight: 700; letter-spacing: -.02em; font-variant-numeric: tabular-nums; line-height: 1.15; }
      .chillstat-sm .chillstat-value { font-size: 22px; }
      .chillstat-lg .chillstat-value { font-size: 36px; }
      .chillstat-sm { padding: 12px 14px; }
      .chillstat-lg { padding: 20px 24px; }
      .chillstat-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 22px; }
      .chillstat-delta { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--chillstat-muted); background: var(--chillstat-surface); }
      .chillstat-delta-good { color: var(--chillstat-up); background: var(--chillstat-up-bg); }
      .chillstat-delta-bad { color: var(--chillstat-down); background: var(--chillstat-down-bg); }
      .chillstat-delta-note { color: var(--chillstat-muted); font-size: 12px; }
      .chillstat-spark { display: block; width: 100%; height: 36px; margin-top: 4px; color: var(--chillstat-accent, var(--chillstat-primary)); overflow: visible; }
      .chillstat-spark-line { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .chillstat-spark-area { fill: currentColor; opacity: .14; stroke: none; }
      .chillstat-spark-bar { fill: currentColor; opacity: .75; }
      .chillstat-skeleton .chillstat-value, .chillstat-skeleton .chillstat-label, .chillstat-skeleton .chillstat-delta { color: transparent; background: linear-gradient(90deg, var(--chillstat-surface) 25%, var(--chillstat-border) 50%, var(--chillstat-surface) 75%); background-size: 200% 100%; animation: chillstat-shimmer 1.4s linear infinite; border-radius: 6px; user-select: none; }
      .chillstat-skeleton .chillstat-value { width: 60%; }
      .chillstat-skeleton .chillstat-label { width: 40%; }
      .chillstat-skeleton .chillstat-spark, .chillstat-skeleton .chillstat-icon { visibility: hidden; }
      @keyframes chillstat-shimmer { to { background-position: -200% 0; } }
      @media (prefers-reduced-motion: reduce) {
        .chillstat { transition: none; }
        .chillstat-skeleton .chillstat-value, .chillstat-skeleton .chillstat-label, .chillstat-skeleton .chillstat-delta { animation: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function svg(name, attrs) {
        const el = document.createElementNS(SVG_NS, name);
        Object.keys(attrs || {}).forEach(k => el.setAttribute(k, attrs[k]));
        return el;
    }

    class ChillStatInstance {
        constructor(options, host) {
            injectCSS();
            this.options = Object.assign({
                label: '', value: 0, prefix: '', suffix: '', formatter: null, locale: undefined, decimals: 0,
                delta: null, deltaFormatter: null, deltaLabel: '', invertDelta: false, sparkline: null, sparklineType: 'area',
                color: null, icon: null, countUp: false, size: 'md', variant: 'outlined', loading: false, onClick: null
            }, options || {});
            this._id = ++uid;
            this._handlers = {};
            this._listeners = [];
            this._raf = null;
            this._destroyed = false;
            this._shown = null;     // numeric value currently displayed
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this._build();
            this._renderAll(true);
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...a) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, a)); }

        _build() {
            const root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            const top = document.createElement('div'); top.className = 'chillstat-top';
            this._labelEl = document.createElement('span'); this._labelEl.className = 'chillstat-label';
            this._labelEl.id = 'chillstat-' + this._id + '-label';
            this._iconEl = document.createElement('span'); this._iconEl.className = 'chillstat-icon'; this._iconEl.setAttribute('aria-hidden', 'true');
            top.appendChild(this._labelEl); top.appendChild(this._iconEl);
            this._valueEl = document.createElement('div'); this._valueEl.className = 'chillstat-value';
            this._valueEl.id = 'chillstat-' + this._id + '-value';
            this._metaEl = document.createElement('div'); this._metaEl.className = 'chillstat-meta';
            this._sparkHost = document.createElement('div'); this._sparkHost.className = 'chillstat-spark-host';
            root.appendChild(top); root.appendChild(this._valueEl); root.appendChild(this._metaEl); root.appendChild(this._sparkHost);
            root.setAttribute('role', 'group');
            root.setAttribute('aria-labelledby', this._labelEl.id + ' ' + this._valueEl.id);

            if (typeof this.options.onClick === 'function') {
                root.tabIndex = 0;
                root.setAttribute('role', 'button');
                root.removeAttribute('aria-labelledby');
                const click = (e) => { this.options.onClick(e); this._emit('click', e); };
                const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(e); } };
                root.addEventListener('click', click); root.addEventListener('keydown', key);
                this._listeners.push(() => { root.removeEventListener('click', click); root.removeEventListener('keydown', key); });
            }
        }

        /* ---------- formatting ---------- */
        _format(n) {
            const o = this.options;
            if (typeof o.formatter === 'function') return String(o.formatter(n));
            if (typeof n !== 'number' || !isFinite(n)) return String(n);
            try {
                return new Intl.NumberFormat(o.locale, { minimumFractionDigits: o.decimals, maximumFractionDigits: o.decimals }).format(n);
            } catch (e) { return n.toFixed(o.decimals); }
        }

        _text(n) { return this.options.prefix + this._format(n) + this.options.suffix; }

        _renderAll(initial) {
            const o = this.options;
            const root = this.element;
            root.className = (this._prevClass + ' chillstat chillstat-' + o.size + ' chillstat-' + o.variant + (typeof o.onClick === 'function' ? ' chillstat-clickable' : '') + (o.loading ? ' chillstat-skeleton' : '')).trim();
            if (o.color) root.style.setProperty('--chillstat-accent', o.color); else root.style.removeProperty('--chillstat-accent');
            root.setAttribute('aria-busy', o.loading ? 'true' : 'false');
            this._labelEl.textContent = o.label == null ? '' : String(o.label);
            if (o.icon != null && o.icon !== '') {
                this._iconEl.textContent = '';
                if (typeof o.icon === 'object' && o.icon.nodeType) this._iconEl.appendChild(o.icon); else this._iconEl.textContent = String(o.icon);
                this._iconEl.style.display = '';
            } else this._iconEl.style.display = 'none';
            this._renderValue(initial);
            this._renderDelta();
            this._renderSpark();
            if (typeof o.onClick === 'function') root.setAttribute('aria-label', (o.label ? o.label + ': ' : '') + this._valueEl.textContent);
        }

        _renderValue(initial) {
            const o = this.options;
            cancelAnimationFrameSafe(this._raf); this._raf = null;
            const v = o.value;
            if (typeof v !== 'number' || !isFinite(v)) {
                this._valueEl.textContent = (o.prefix || '') + (v == null ? '' : String(v)) + (o.suffix || '');
                this._shown = null;
                return;
            }
            const dur = o.countUp === true ? 1000 : Number(o.countUp) || 0;
            const from = initial || this._shown == null ? 0 : this._shown;
            if (dur > 0 && !reducedMotion() && from !== v && !o.loading) {
                const start = nowMs();
                const step = () => {
                    if (this._destroyed) return;
                    const t = Math.min(1, (nowMs() - start) / dur);
                    const eased = 1 - Math.pow(1 - t, 3);
                    const cur = t >= 1 ? v : from + (v - from) * eased;
                    this._shown = cur;
                    this._valueEl.textContent = this._text(o.decimals ? cur : (t >= 1 ? v : Math.round(cur)));
                    if (t < 1) this._raf = requestFrame(step); else { this._raf = null; this._emit('countend', v); }
                };
                this._valueEl.textContent = this._text(from);
                this._raf = requestFrame(step);
            } else {
                this._shown = v;
                this._valueEl.textContent = this._text(v);
            }
        }

        _renderDelta() {
            const o = this.options;
            while (this._metaEl.firstChild) this._metaEl.removeChild(this._metaEl.firstChild);
            const d = o.delta;
            this._metaEl.hidden = !(typeof d === 'number' && isFinite(d)) && !o.deltaLabel;
            if (typeof d === 'number' && isFinite(d)) {
                const dir = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
                const good = dir === 'flat' ? null : (dir === 'up') !== !!o.invertDelta;
                const chip = document.createElement('span');
                chip.className = 'chillstat-delta chillstat-delta-' + dir + (good === true ? ' chillstat-delta-good' : good === false ? ' chillstat-delta-bad' : '');
                const arrow = document.createElement('span');
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '▬';
                const txt = document.createElement('span');
                const f = typeof o.deltaFormatter === 'function' ? o.deltaFormatter(d) : Math.abs(d) + '%';
                txt.textContent = f;
                const sr = document.createElement('span');
                sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
                sr.textContent = dir === 'up' ? 'Increased by ' : dir === 'down' ? 'Decreased by ' : 'No change ';
                chip.appendChild(arrow); chip.appendChild(sr); chip.appendChild(txt);
                this._metaEl.appendChild(chip);
            }
            if (o.deltaLabel) {
                const n = document.createElement('span');
                n.className = 'chillstat-delta-note';
                n.textContent = String(o.deltaLabel);
                this._metaEl.appendChild(n);
            }
        }

        _renderSpark() {
            const o = this.options;
            while (this._sparkHost.firstChild) this._sparkHost.removeChild(this._sparkHost.firstChild);
            const data = Array.isArray(o.sparkline) ? o.sparkline.filter(n => typeof n === 'number' && isFinite(n)) : [];
            if (data.length < 2) return;
            const W = 100, H = 32, pad = 2;
            const min = Math.min.apply(null, data), max = Math.max.apply(null, data);
            const span = max - min || 1;
            const x = i => (i / (data.length - 1)) * W;
            const y = v => H - pad - ((v - min) / span) * (H - pad * 2);
            const s = svg('svg', { class: 'chillstat-spark', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', role: 'img', focusable: 'false' });
            s.setAttribute('aria-label', 'Trend over ' + data.length + ' points, from ' + this._format(data[0]) + ' to ' + this._format(data[data.length - 1]));
            if (o.sparklineType === 'bar') {
                const bw = W / data.length;
                data.forEach((v, i) => {
                    const h = Math.max(1, H - pad - y(v) + pad);
                    s.appendChild(svg('rect', { class: 'chillstat-spark-bar', x: (i * bw + bw * 0.15).toFixed(2), y: (H - h).toFixed(2), width: (bw * 0.7).toFixed(2), height: h.toFixed(2), rx: '1' }));
                });
            } else {
                const pts = data.map((v, i) => x(i).toFixed(2) + ',' + y(v).toFixed(2));
                if (o.sparklineType !== 'line') s.appendChild(svg('polygon', { class: 'chillstat-spark-area', points: '0,' + H + ' ' + pts.join(' ') + ' ' + W + ',' + H }));
                s.appendChild(svg('polyline', { class: 'chillstat-spark-line', points: pts.join(' ') }));
            }
            this._sparkHost.appendChild(s);
        }

        update(partial) {
            if (this._destroyed) return this;
            Object.assign(this.options, partial || {});
            this._renderAll(false);
            this._emit('update', this.options.value);
            return this;
        }
        setValue(v) { return this.update({ value: v }); }
        setLoading(b) { return this.update({ loading: !!b }); }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            cancelAnimationFrameSafe(this._raf);
            this._listeners.forEach(fn => fn());
            this._listeners = [];
            this._handlers = {};
            const root = this.element;
            if (this._ownsElement) { if (root.parentNode) root.parentNode.removeChild(root); return; }
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = this._prevClass;
            ['role', 'aria-labelledby', 'aria-label', 'aria-busy', 'tabindex'].forEach(a => root.removeAttribute(a));
            root.style.removeProperty('--chillstat-accent');
        }
    }

    function nowMs() { return (window.performance && window.performance.now) ? window.performance.now() : Date.now(); }
    function requestFrame(fn) {
        if (window.requestAnimationFrame) return window.requestAnimationFrame(fn);
        return setTimeout(function () { fn(); }, 16);
    }
    function cancelAnimationFrameSafe(id) {
        if (id == null) return;
        if (window.cancelAnimationFrame) window.cancelAnimationFrame(id); else clearTimeout(id);
    }

    const ChillStat = {
        version: VERSION,
        create(options) { return new ChillStatInstance(options); },
        /** Enhance an element; data-label / data-value / data-delta attributes seed the options. */
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const opts = Object.assign({}, options);
            const num = k => { const v = host.getAttribute(k); return v == null || v === '' ? undefined : (isNaN(Number(v)) ? v : Number(v)); };
            if (opts.label == null && host.getAttribute('data-label') != null) opts.label = host.getAttribute('data-label');
            if (opts.value == null && num('data-value') !== undefined) opts.value = num('data-value');
            if (opts.delta == null && num('data-delta') !== undefined) opts.delta = Number(num('data-delta'));
            return new ChillStatInstance(opts, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillStat;
    } else {
        window.ChillStat = ChillStat;
    }

})(typeof window !== 'undefined' ? window : this);
