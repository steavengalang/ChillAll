/**
 * ChillProgress - Zero-dependency Progress Bar / Ring / Steps Component
 *
 * Usage:
 *   const bar = ChillProgress.init('#upload', { value: 30, label: 'Uploading', color: 'success' });   // replaces #upload
 *   bar.setValue(60);
 *   const ring = ChillProgress.init('#ring', { variant: 'circle', value: 72, size: 'lg', color: '#8b5cf6', label: 'Storage' });
 *   const busy = ChillProgress.init('#x', { indeterminate: true, label: 'Loading' });
 *   document.body.appendChild(ChillProgress.createCircle({ value: 40, size: 64 }));   // standalone ring element
 *   document.body.appendChild(ChillProgress.createSteps({ steps: ['Cart', 'Pay', 'Done'], current: 1 }));
 *
 * Options for init(selectorOrElement, options):
 *   variant       string   'bar'      'bar' | 'circle'
 *   value         number   0
 *   min / max     number   0 / 100
 *   label         string   ''         Visible label (text). labelHtml: string -> markup (trusted only).
 *   ariaLabel     string   'Progress' Accessible name used when there is no label.
 *   showValue     boolean  true       Show "NN%" (bar: top right, ring: centred).
 *   valueFormat   function (value, percent) => string      Custom value text.
 *   size          bar: 'xs'|'sm'|'md'|'lg'|'xl' (default 'md')   ring: number px or 'xs'(32)|'sm'(48)|'md'(80)|'lg'(120)|'xl'(160)
 *   strokeWidth   number   ~size/10   Ring thickness.
 *   color         string   'primary'  'primary'|'success'|'warning'|'error' or any CSS colour ('#8b5cf6', 'rgb(...)', 'var(--x)').
 *   striped / animated / gradient      Bar only.
 *   indeterminate boolean  false      Unknown progress (aria-valuenow removed, animation stops under reduced motion).
 *   onChange(value, percent)  onComplete()
 *
 * Instance: setValue(v), getValue(), setMax(m), setLabel(text), setColor(c), setIndeterminate(bool), getPercent(), on(evt, fn), off(evt, fn), destroy()
 * Properties: container, fill, valueEl.  Events: 'change', 'complete'.
 * ARIA: role="progressbar" with aria-valuemin/max/now/valuetext (valuenow omitted when indeterminate).
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillprogress_css_injected__';
    const NAMED_COLORS = ['primary', 'success', 'warning', 'error'];
    const CIRCLE_SIZES = { xs: 32, sm: 48, md: 80, lg: 120, xl: 160 };
    const BAR_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
    const SVG_NS = 'http://www.w3.org/2000/svg';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chillprogress-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillprogress-styles';
        style.textContent = `
      :root {
        --chillprogress-bg: #e5e7eb;
        --chillprogress-fill: #3b82f6;
        --chillprogress-text: #171717;
        --chillprogress-success: #22c55e;
        --chillprogress-warning: #f59e0b;
        --chillprogress-error: #ef4444;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillprogress-bg: #374151;
          --chillprogress-text: #fafafa;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillprogress-bg: #374151;
        --chillprogress-text: #fafafa;
      }

      .chillprogress {
        width: 100%;
      }

      .chillprogress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .chillprogress-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillprogress-text);
      }

      .chillprogress-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillprogress-text);
        margin-left: auto;
      }

      .chillprogress-track {
        width: 100%;
        height: 8px;
        background: var(--chillprogress-bg);
        border-radius: 999px;
        overflow: hidden;
      }

      .chillprogress-fill {
        height: 100%;
        background: var(--chillprogress-fill);
        border-radius: 999px;
        transition: width 0.3s ease;
      }

      /* Sizes */
      .chillprogress-xs .chillprogress-track { height: 4px; }
      .chillprogress-sm .chillprogress-track { height: 6px; }
      .chillprogress-lg .chillprogress-track { height: 12px; }
      .chillprogress-xl .chillprogress-track { height: 16px; }

      /* Colors */
      .chillprogress-success .chillprogress-fill { background: var(--chillprogress-success); }
      .chillprogress-warning .chillprogress-fill { background: var(--chillprogress-warning); }
      .chillprogress-error .chillprogress-fill { background: var(--chillprogress-error); }

      /* Gradient */
      .chillprogress-gradient .chillprogress-fill {
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
      }

      /* Striped */
      .chillprogress-striped .chillprogress-fill {
        background-image: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.15) 25%,
          transparent 25%,
          transparent 50%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.15) 75%,
          transparent 75%,
          transparent
        );
        background-size: 1rem 1rem;
      }

      .chillprogress-animated .chillprogress-fill {
        animation: chillprogress-stripes 1s linear infinite;
      }

      @keyframes chillprogress-stripes {
        from { background-position: 1rem 0; }
        to { background-position: 0 0; }
      }

      /* Indeterminate (bar) */
      .chillprogress-indeterminate .chillprogress-fill {
        width: 30% !important;
        animation: chillprogress-indeterminate 1.5s ease-in-out infinite;
      }

      @keyframes chillprogress-indeterminate {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }

      /* Circular Progress */
      .chillprogress-circle-wrap {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .chillprogress-circle {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .chillprogress-circle-svg {
        transform: rotate(-90deg);
      }

      .chillprogress-circle-bg {
        fill: none;
        stroke: var(--chillprogress-bg);
      }

      .chillprogress-circle-fill {
        fill: none;
        stroke: var(--chillprogress-fill);
        stroke-linecap: round;
        transition: stroke-dashoffset 0.3s ease;
      }

      .chillprogress-circle-text {
        position: absolute;
        font-size: 14px;
        font-weight: 600;
        color: var(--chillprogress-text);
      }

      .chillprogress-circle.chillprogress-success .chillprogress-circle-fill { stroke: var(--chillprogress-success); }
      .chillprogress-circle.chillprogress-warning .chillprogress-circle-fill { stroke: var(--chillprogress-warning); }
      .chillprogress-circle.chillprogress-error .chillprogress-circle-fill { stroke: var(--chillprogress-error); }

      .chillprogress-circle.chillprogress-indeterminate .chillprogress-circle-svg {
        animation: chillprogress-spin 1.1s linear infinite;
      }

      @keyframes chillprogress-spin {
        from { transform: rotate(-90deg); }
        to { transform: rotate(270deg); }
      }

      /* Steps Progress */
      .chillprogress-steps {
        display: flex;
        align-items: center;
        gap: 0;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .chillprogress-steps-labeled { padding-bottom: 28px; }

      .chillprogress-step {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
      }

      .chillprogress-step:last-child { flex: 0 0 auto; }

      .chillprogress-step-dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--chillprogress-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--chillprogress-text);
        flex-shrink: 0;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .chillprogress-step.active .chillprogress-step-dot,
      .chillprogress-step.completed .chillprogress-step-dot {
        background: var(--chillprogress-fill);
        color: white;
      }

      .chillprogress-step-line {
        flex: 1;
        height: 2px;
        background: var(--chillprogress-bg);
        transition: background 0.2s ease;
      }

      .chillprogress-step.completed .chillprogress-step-line {
        background: var(--chillprogress-fill);
      }

      .chillprogress-step:last-child .chillprogress-step-line {
        display: none;
      }

      .chillprogress-step-label {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 8px;
        font-size: 12px;
        color: var(--chillprogress-text);
        white-space: nowrap;
      }

      .chillprogress-sr {
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
        .chillprogress-fill,
        .chillprogress-circle-fill,
        .chillprogress-step-dot,
        .chillprogress-step-line { transition: none !important; }
        .chillprogress-animated .chillprogress-fill { animation: none !important; }
        .chillprogress-indeterminate .chillprogress-fill {
          animation: none !important;
          transform: none !important;
          width: 100% !important;
          opacity: 0.5;
        }
        .chillprogress-circle.chillprogress-indeterminate .chillprogress-circle-svg { animation: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function num(v, d) {
        const n = typeof v === 'number' ? v : parseFloat(v);
        return isFinite(n) ? n : d;
    }

    function percentOf(value, min, max) {
        const span = max - min;
        if (!(span > 0)) return 0;
        return Math.min(100, Math.max(0, ((num(value, 0) - min) / span) * 100));
    }

    function applyColor(el, color) {
        // remove previous named color classes + custom property
        NAMED_COLORS.forEach(c => el.classList.remove(`chillprogress-${c}`));
        el.style.removeProperty('--chillprogress-fill');
        if (!color || color === 'primary') return;
        if (NAMED_COLORS.indexOf(color) >= 0) el.classList.add(`chillprogress-${color}`);
        else el.style.setProperty('--chillprogress-fill', String(color));
    }

    function defaultFormat(value, pct) {
        return `${Math.round(pct)}%`;
    }

    function fillText(target, text, html, htmlOverride) {
        if (htmlOverride != null) target.innerHTML = String(htmlOverride);
        else target.textContent = text == null ? '' : String(text);
    }

    /** Build the SVG ring. Returns { svg, bg, fill, circumference }. */
    function buildRing(size, strokeWidth) {
        const radius = Math.max(1, (size - strokeWidth) / 2);
        const circumference = radius * 2 * Math.PI;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'chillprogress-circle-svg');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const mk = (cls) => {
            const c = document.createElementNS(SVG_NS, 'circle');
            c.setAttribute('class', cls);
            c.setAttribute('cx', String(size / 2));
            c.setAttribute('cy', String(size / 2));
            c.setAttribute('r', String(radius));
            c.setAttribute('stroke-width', String(strokeWidth));
            return c;
        };
        const bg = mk('chillprogress-circle-bg');
        const fill = mk('chillprogress-circle-fill');
        fill.setAttribute('stroke-dasharray', String(circumference));
        svg.appendChild(bg);
        svg.appendChild(fill);
        return { svg, bg, fill, circumference };
    }

    function setAria(el, o, pct, text) {
        el.setAttribute('role', 'progressbar');
        el.setAttribute('aria-valuemin', String(o.min));
        el.setAttribute('aria-valuemax', String(o.max));
        if (o.indeterminate) {
            el.removeAttribute('aria-valuenow');
            el.removeAttribute('aria-valuetext');
            el.setAttribute('aria-busy', 'true');
        } else {
            el.setAttribute('aria-valuenow', String(Math.min(o.max, Math.max(o.min, num(o.value, 0)))));
            el.setAttribute('aria-valuetext', text);
            el.removeAttribute('aria-busy');
        }
    }

    class ChillProgressInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') throw new Error('ChillProgress requires a DOM');
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = {
                variant: 'bar',
                value: 0,
                min: 0,
                max: 100,
                label: '',
                ariaLabel: 'Progress',
                size: 'md',
                color: 'primary',
                striped: false,
                animated: false,
                indeterminate: false,
                gradient: false,
                valueFormat: defaultFormat,
                ...options
            };
            this.options.showValue = options.showValue !== false;
            this.options.value = num(options.value, 0);
            this.options.min = num(options.min, 0);
            this.options.max = num(options.max, 100);
            this.options.indeterminate = !!options.indeterminate;
            if (typeof this.options.valueFormat !== 'function') this.options.valueFormat = defaultFormat;
            if (this.options.variant !== 'circle') this.options.variant = 'bar';

            this.destroyed = false;
            this._handlers = {};
            this._complete = false;
            this._uid = ++uid;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this._complete = this.getPercent() >= 100 && !this.options.indeterminate;
        }

        getPercent() {
            return percentOf(this.options.value, this.options.min, this.options.max);
        }

        _text() {
            const pct = this.getPercent();
            return String(this.options.valueFormat(this.options.value, pct));
        }

        render() {
            const o = this.options;
            const isCircle = o.variant === 'circle';
            const pct = this.getPercent();
            const labelId = `chillprogress-${this._uid}-label`;
            let container;

            if (isCircle) {
                const px = typeof o.size === 'number' ? o.size : (CIRCLE_SIZES[o.size] || num(o.size, 80));
                const sw = num(o.strokeWidth, Math.min(14, Math.max(3, Math.round(px / 10))));
                const wrap = document.createElement('div');
                wrap.className = 'chillprogress-circle-wrap';

                const circle = document.createElement('div');
                circle.className = 'chillprogress-circle';
                circle.style.width = `${px}px`;
                circle.style.height = `${px}px`;
                const ring = buildRing(px, sw);
                circle.appendChild(ring.svg);
                this._ring = ring;

                if (o.showValue) {
                    const t = document.createElement('span');
                    t.className = 'chillprogress-circle-text';
                    t.style.fontSize = `${Math.max(10, Math.round(px * 0.18))}px`;
                    t.setAttribute('aria-hidden', 'true');
                    circle.appendChild(t);
                    this.valueEl = t;
                }
                wrap.appendChild(circle);

                if (o.label || o.labelHtml) {
                    const l = document.createElement('span');
                    l.className = 'chillprogress-label';
                    l.id = labelId;
                    fillText(l, o.label, false, o.labelHtml);
                    wrap.appendChild(l);
                    circle.setAttribute('aria-labelledby', labelId);
                } else {
                    circle.setAttribute('aria-label', o.ariaLabel || 'Progress');
                }

                this.fill = ring.fill;
                this.track = circle;
                this._bar = circle;
                this._colorTarget = circle;
                container = wrap;
            } else {
                container = document.createElement('div');
                container.className = `chillprogress chillprogress-${BAR_SIZES.indexOf(o.size) >= 0 ? o.size : 'md'}`;
                if (o.striped) container.classList.add('chillprogress-striped');
                if (o.animated) container.classList.add('chillprogress-animated');
                if (o.gradient) container.classList.add('chillprogress-gradient');

                if (o.label || o.labelHtml || o.showValue) {
                    const header = document.createElement('div');
                    header.className = 'chillprogress-header';
                    if (o.label || o.labelHtml) {
                        const l = document.createElement('span');
                        l.className = 'chillprogress-label';
                        l.id = labelId;
                        fillText(l, o.label, false, o.labelHtml);
                        header.appendChild(l);
                    }
                    if (o.showValue) {
                        const v = document.createElement('span');
                        v.className = 'chillprogress-value';
                        v.setAttribute('aria-hidden', 'true');
                        header.appendChild(v);
                        this.valueEl = v;
                    }
                    container.appendChild(header);
                }

                const track = document.createElement('div');
                track.className = 'chillprogress-track';
                const fill = document.createElement('div');
                fill.className = 'chillprogress-fill';
                track.appendChild(fill);
                container.appendChild(track);

                if (o.label || o.labelHtml) track.setAttribute('aria-labelledby', labelId);
                else track.setAttribute('aria-label', o.ariaLabel || 'Progress');

                this.fill = fill;
                this.track = track;
                this._bar = track;
                this._colorTarget = container;
            }

            this.container = container;
            applyColor(this._colorTarget, o.color);
            this._applyState();

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(container, this.element);
            }
            return pct;
        }

        _applyState() {
            const o = this.options;
            const pct = this.getPercent();
            const text = this._text();
            const isCircle = o.variant === 'circle';

            this.container.classList.toggle('chillprogress-indeterminate', !!o.indeterminate && !isCircle);
            if (isCircle) this._colorTarget.classList.toggle('chillprogress-indeterminate', !!o.indeterminate);

            if (isCircle) {
                const c = this._ring.circumference;
                const shown = o.indeterminate ? 25 : pct;
                this.fill.setAttribute('stroke-dashoffset', String(c - (shown / 100) * c));
            } else {
                this.fill.style.width = `${o.indeterminate ? 30 : pct}%`;
            }
            if (this.valueEl) this.valueEl.textContent = o.indeterminate ? '' : text;
            setAria(this._bar, o, pct, text);
        }

        setValue(value) {
            if (this.destroyed) return;
            const prevValue = this.options.value;
            this.options.value = value;
            this._applyState();
            const pct = this.getPercent();
            if (value !== prevValue) {
                if (typeof this.options.onChange === 'function') this.options.onChange(value, pct);
                this._emit('change', value, pct);
            }
            if (pct >= 100 && !this._complete && !this.options.indeterminate) {
                this._complete = true;
                if (typeof this.options.onComplete === 'function') this.options.onComplete();
                this._emit('complete');
            } else if (pct < 100) {
                this._complete = false;
            }
        }

        getValue() {
            return this.options.value;
        }

        setMax(max) {
            this.options.max = num(max, this.options.max);
            this._applyState();
        }

        setLabel(label, html) {
            this.options.label = label;
            const l = this.container.querySelector('.chillprogress-label');
            if (l) fillText(l, label, false, html === true ? label : null);
        }

        setColor(color) {
            this.options.color = color;
            applyColor(this._colorTarget, color);
        }

        setIndeterminate(flag) {
            this.options.indeterminate = !!flag;
            this._applyState();
        }

        on(evt, fn) {
            (this._handlers[evt] = this._handlers[evt] || []).push(fn);
            return this;
        }

        off(evt, fn) {
            if (!this._handlers[evt]) return this;
            this._handlers[evt] = fn ? this._handlers[evt].filter(f => f !== fn) : [];
            return this;
        }

        _emit(evt, ...args) {
            (this._handlers[evt] || []).slice().forEach(fn => fn(...args));
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this._handlers = {};
            const c = this.container;
            if (c && c.parentNode) {
                if (this.element && !this.element.parentNode) c.parentNode.replaceChild(this.element, c);
                else c.parentNode.removeChild(c);
            }
        }
    }

    /** Standalone ring element (kept for backwards compatibility). Has setValue(v) and destroy(). */
    function createCircle(options = {}) {
        if (typeof document === 'undefined') throw new Error('ChillProgress requires a DOM');
        injectCSS();

        const o = {
            size: 80, strokeWidth: 8, value: 0, min: 0, max: 100, color: 'primary', showValue: true,
            ariaLabel: 'Progress', valueFormat: defaultFormat, ...options
        };
        const px = typeof o.size === 'number' ? o.size : (CIRCLE_SIZES[o.size] || num(o.size, 80));
        o.min = num(o.min, 0);
        o.max = num(o.max, 100);
        o.value = num(o.value, 0);
        if (typeof o.valueFormat !== 'function') o.valueFormat = defaultFormat;
        o.indeterminate = !!o.indeterminate;

        const container = document.createElement('div');
        container.className = 'chillprogress-circle';
        container.style.width = `${px}px`;
        container.style.height = `${px}px`;
        applyColor(container, o.color);
        const ring = buildRing(px, num(o.strokeWidth, 8));
        container.appendChild(ring.svg);

        let textEl = null;
        if (o.showValue !== false) {
            textEl = document.createElement('span');
            textEl.className = 'chillprogress-circle-text';
            textEl.style.fontSize = `${Math.max(10, Math.round(px * 0.18))}px`;
            textEl.setAttribute('aria-hidden', 'true');
            container.appendChild(textEl);
        }
        container.setAttribute('aria-label', o.label || o.ariaLabel || 'Progress');

        function apply() {
            const pct = percentOf(o.value, o.min, o.max);
            const text = String(o.valueFormat(o.value, pct));
            const shown = o.indeterminate ? 25 : pct;
            ring.fill.setAttribute('stroke-dashoffset', String(ring.circumference - (shown / 100) * ring.circumference));
            container.classList.toggle('chillprogress-indeterminate', o.indeterminate);
            if (textEl) textEl.textContent = o.indeterminate ? '' : text;
            setAria(container, o, pct, text);
        }
        apply();

        container.setValue = function (v) { o.value = num(v, 0); apply(); };
        container.destroy = function () { if (container.parentNode) container.parentNode.removeChild(container); };
        return container;
    }

    /**
     * Step indicator. steps: array of strings or { label }. current: zero-based index of the active step.
     * Returned element has setCurrent(n) and destroy().
     */
    function createSteps(options = {}) {
        if (typeof document === 'undefined') throw new Error('ChillProgress requires a DOM');
        injectCSS();

        const container = document.createElement('div');
        container.className = 'chillprogress-steps';
        container.setAttribute('role', 'list');
        container.setAttribute('aria-label', options.ariaLabel || 'Progress');

        const steps = options.steps || [];
        const labelOf = (s) => (s && typeof s === 'object') ? s.label : s;
        if (steps.some(s => labelOf(s))) container.classList.add('chillprogress-steps-labeled');

        const els = steps.map((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = 'chillprogress-step';
            stepEl.setAttribute('role', 'listitem');

            const dot = document.createElement('div');
            dot.className = 'chillprogress-step-dot';
            const num_ = document.createElement('span');
            num_.setAttribute('aria-hidden', 'true');
            dot.appendChild(num_);
            const sr = document.createElement('span');
            sr.className = 'chillprogress-sr';
            dot.appendChild(sr);
            stepEl.appendChild(dot);

            const line = document.createElement('div');
            line.className = 'chillprogress-step-line';
            stepEl.appendChild(line);

            const text = labelOf(step);
            if (text) {
                const l = document.createElement('div');
                l.className = 'chillprogress-step-label';
                l.textContent = String(text);
                stepEl.appendChild(l);
            }
            container.appendChild(stepEl);
            return { stepEl, num: num_, sr, text };
        });

        function setCurrent(current) {
            current = num(current, 0);
            els.forEach((s, index) => {
                const done = index < current, active = index === current;
                s.stepEl.classList.toggle('completed', done);
                s.stepEl.classList.toggle('active', active);
                if (active) s.stepEl.setAttribute('aria-current', 'step');
                else s.stepEl.removeAttribute('aria-current');
                s.num.textContent = done ? '✓' : String(index + 1);
                s.sr.textContent = `${s.text ? s.text + ': ' : 'Step ' + (index + 1) + ': '}${done ? 'completed' : active ? 'current' : 'upcoming'}`;
            });
        }
        setCurrent(options.current || 0);

        container.setCurrent = setCurrent;
        container.destroy = function () { if (container.parentNode) container.parentNode.removeChild(container); };
        return container;
    }

    const ChillProgress = {
        version: VERSION,

        init(selector, options) {
            return new ChillProgressInstance(selector, options);
        },

        createCircle,
        createSteps,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillProgress;
    } else {
        window.ChillProgress = ChillProgress;
    }

})(typeof window !== 'undefined' ? window : this);
