/**
 * ChillSpinner - Zero-dependency spinners / loaders
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const s = ChillSpinner.create({ type: 'dots', size: 'lg', color: 'primary', label: 'Saving...' });
 *   container.appendChild(s.element);  s.destroy();
 *
 *   const o = ChillSpinner.overlay(document.querySelector('#card'), { label: 'Loading' });  // cover an element
 *   o.hide(); o.show(); o.destroy();
 *
 *   const f = ChillSpinner.fullscreen({ label: 'Please wait', delay: 200 });                // cover the page
 *   f.destroy();
 *
 *   ChillSpinner.init('[data-chill-spinner]');   // fills matching empty elements; data-type/data-size/data-color/data-label
 *
 * Options
 *   type       'ring' | 'dots' | 'bars' | 'pulse'                   default 'ring'
 *   size       'xs' | 'sm' | 'md' | 'lg' | 'xl' | number(px)         default 'md'
 *   color      'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'inherit' | any CSS colour   default 'primary'
 *   label      accessible text (visually hidden)                    default 'Loading'
 *   showLabel  also show label under the spinner                    default false  (overlay/fullscreen: false)
 *   thickness  ring thickness in px                                 default auto
 *   speed      animation duration multiplier (1 = default)          default 1
 * overlay()/fullscreen() extra: { blur: boolean=false, delay: ms=0, visible: boolean=true, container (fullscreen) }
 *
 * Honours prefers-reduced-motion by slowing (not removing) the animation so progress is still indicated.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillspinner-styles';
    const SIZES = { xs: 14, sm: 20, md: 32, lg: 48, xl: 72 };
    const COLORS = { primary: 'var(--chillspinner-primary)', success: 'var(--chillspinner-success)', warning: 'var(--chillspinner-warning)', danger: 'var(--chillspinner-danger)', neutral: 'var(--chillspinner-neutral)', inherit: 'currentColor' };
    const TYPES = ['ring', 'dots', 'bars', 'pulse'];
    const overlays = new WeakMap();

    const DARK_VARS = `
        --chillspinner-track: rgba(255, 255, 255, 0.15);
        --chillspinner-overlay: rgba(10, 10, 10, 0.6);
        --chillspinner-text: #fafafa;
        --chillspinner-neutral: #a3a3a3;`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillspinner-primary: #3b82f6;
        --chillspinner-success: #22c55e;
        --chillspinner-warning: #f59e0b;
        --chillspinner-danger: #ef4444;
        --chillspinner-neutral: #6b7280;
        --chillspinner-track: rgba(0, 0, 0, 0.1);
        --chillspinner-overlay: rgba(255, 255, 255, 0.72);
        --chillspinner-text: #171717;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chillspinner {
        --chillspinner-size: 32px;
        --chillspinner-color: var(--chillspinner-primary);
        --chillspinner-speed: 1;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        vertical-align: middle;
        color: var(--chillspinner-text);
        font-family: inherit;
        font-size: 13px;
      }
      .chillspinner-shape {
        position: relative;
        display: inline-block;
        width: var(--chillspinner-size);
        height: var(--chillspinner-size);
        color: var(--chillspinner-color);
        flex-shrink: 0;
      }
      .chillspinner-sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
        clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }
      .chillspinner-text { opacity: 0.8; }

      /* ring */
      .chillspinner-ring .chillspinner-shape {
        box-sizing: border-box;
        border-radius: 50%;
        border: var(--chillspinner-thickness, calc(var(--chillspinner-size) / 9)) solid var(--chillspinner-track);
        border-top-color: var(--chillspinner-color);
        animation: chillspinner-rotate calc(0.8s * var(--chillspinner-speed)) linear infinite;
      }
      /* dots */
      .chillspinner-dots .chillspinner-shape { display: inline-flex; align-items: center; justify-content: space-between; width: calc(var(--chillspinner-size) * 1.5); }
      .chillspinner-dots .chillspinner-shape i {
        width: calc(var(--chillspinner-size) / 4); height: calc(var(--chillspinner-size) / 4);
        border-radius: 50%; background: var(--chillspinner-color);
        animation: chillspinner-bounce calc(1.2s * var(--chillspinner-speed)) ease-in-out infinite both;
      }
      .chillspinner-dots .chillspinner-shape i:nth-child(1) { animation-delay: -0.32s; }
      .chillspinner-dots .chillspinner-shape i:nth-child(2) { animation-delay: -0.16s; }
      /* bars */
      .chillspinner-bars .chillspinner-shape { display: inline-flex; align-items: center; justify-content: space-between; width: calc(var(--chillspinner-size) * 0.9); }
      .chillspinner-bars .chillspinner-shape i {
        width: calc(var(--chillspinner-size) / 7); height: 100%;
        border-radius: 2px; background: var(--chillspinner-color);
        animation: chillspinner-stretch calc(1.1s * var(--chillspinner-speed)) ease-in-out infinite;
      }
      .chillspinner-bars .chillspinner-shape i:nth-child(2) { animation-delay: -1s; }
      .chillspinner-bars .chillspinner-shape i:nth-child(3) { animation-delay: -0.9s; }
      .chillspinner-bars .chillspinner-shape i:nth-child(4) { animation-delay: -0.8s; }
      /* pulse */
      .chillspinner-pulse .chillspinner-shape::before,
      .chillspinner-pulse .chillspinner-shape::after {
        content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--chillspinner-color);
        animation: chillspinner-pulse calc(1.4s * var(--chillspinner-speed)) ease-out infinite;
      }
      .chillspinner-pulse .chillspinner-shape::after { animation-delay: calc(-0.7s * var(--chillspinner-speed)); }

      @keyframes chillspinner-rotate { to { transform: rotate(360deg); } }
      @keyframes chillspinner-bounce { 0%, 80%, 100% { transform: scale(0.4); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      @keyframes chillspinner-stretch { 0%, 40%, 100% { transform: scaleY(0.4); } 20% { transform: scaleY(1); } }
      @keyframes chillspinner-pulse { 0% { transform: scale(0); opacity: 0.8; } 100% { transform: scale(1); opacity: 0; } }

      /* overlay-on-element + fullscreen */
      .chillspinner-overlay {
        position: absolute; inset: 0; z-index: 5;
        display: flex; align-items: center; justify-content: center;
        background: var(--chillspinner-overlay);
        border-radius: inherit;
        opacity: 0; transition: opacity 0.15s ease;
      }
      .chillspinner-overlay.chillspinner-blur { -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
      .chillspinner-overlay.chillspinner-shown { opacity: 1; }
      .chillspinner-overlay[hidden] { display: none; }
      .chillspinner-fullscreen { position: fixed; z-index: 10001; border-radius: 0; }

      /* reduced motion: slow down instead of stopping so activity is still conveyed */
      @media (prefers-reduced-motion: reduce) {
        .chillspinner { --chillspinner-speed: 2.5; }
        .chillspinner-overlay { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function px(size) {
        if (typeof size === 'number' && size > 0) return size;
        return SIZES[size] || SIZES.md;
    }

    function build(options) {
        const o = Object.assign({ type: 'ring', size: 'md', color: 'primary', label: 'Loading', showLabel: false, thickness: null, speed: 1 }, options || {});
        if (TYPES.indexOf(o.type) < 0) o.type = 'ring';
        const el = document.createElement('span');
        el.className = 'chillspinner chillspinner-' + o.type;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.style.setProperty('--chillspinner-size', px(o.size) + 'px');
        el.style.setProperty('--chillspinner-color', COLORS[o.color] || String(o.color || COLORS.primary));
        if (o.speed && o.speed !== 1) el.style.setProperty('--chillspinner-speed', String(o.speed));
        if (o.thickness) el.style.setProperty('--chillspinner-thickness', o.thickness + 'px');

        const shape = document.createElement('span');
        shape.className = 'chillspinner-shape';
        shape.setAttribute('aria-hidden', 'true');
        const n = o.type === 'dots' ? 3 : o.type === 'bars' ? 4 : 0;
        for (let i = 0; i < n; i++) shape.appendChild(document.createElement('i'));
        el.appendChild(shape);

        const sr = document.createElement('span');
        sr.className = 'chillspinner-sr';
        sr.textContent = o.label == null ? '' : String(o.label);
        el.appendChild(sr);
        let text = null;
        if (o.showLabel && o.label) {
            text = document.createElement('span');
            text.className = 'chillspinner-text';
            text.setAttribute('aria-hidden', 'true');
            text.textContent = String(o.label);
            el.appendChild(text);
        }
        return { el, sr, getText: () => text, options: o };
    }

    /** Standalone spinner. */
    function create(options) {
        injectCSS();
        const b = build(options);
        const inst = {
            element: b.el,
            options: b.options,
            setLabel(label) {
                b.sr.textContent = label == null ? '' : String(label);
                const t = b.getText(); if (t) t.textContent = b.sr.textContent;
                return inst;
            },
            destroy() { if (b.el.parentNode) b.el.parentNode.removeChild(b.el); }
        };
        return inst;
    }

    function makeOverlay(host, options, fullscreen) {
        injectCSS();
        const o = Object.assign({ blur: false, delay: 0, visible: true }, options || {});
        const wrap = document.createElement('div');
        wrap.className = 'chillspinner-overlay' + (fullscreen ? ' chillspinner-fullscreen' : '') + (o.blur ? ' chillspinner-blur' : '');
        const sp = create(Object.assign({ size: fullscreen ? 'lg' : 'md', showLabel: !!o.showLabel }, o));
        wrap.appendChild(sp.element);

        let restorePosition = null, timer = null, destroyed = false, shown = false, raf = null;
        const prevBusy = host.getAttribute('aria-busy');

        if (!fullscreen) {
            const pos = window.getComputedStyle(host).position;
            if (!pos || pos === 'static') { restorePosition = host.style.position; host.style.position = 'relative'; }
        }
        host.appendChild(wrap);

        const reveal = () => {
            timer = null; if (destroyed) return;
            shown = true; wrap.hidden = false; host.setAttribute('aria-busy', 'true');
            raf = (window.requestAnimationFrame || setTimeout)(() => { raf = null; wrap.classList.add('chillspinner-shown'); });
        };
        const inst = {
            element: wrap,
            spinner: sp,
            get visible() { return shown; },
            show() {
                if (destroyed) return inst;
                if (timer) clearTimeout(timer);
                if (shown) return inst;
                if (o.delay > 0) timer = setTimeout(reveal, o.delay); else reveal();
                return inst;
            },
            hide() {
                if (timer) { clearTimeout(timer); timer = null; }
                if (raf && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(raf); } catch (e) { /* ignore */ } }
                raf = null;
                shown = false;
                wrap.classList.remove('chillspinner-shown');
                wrap.hidden = true;
                if (prevBusy == null) host.removeAttribute('aria-busy'); else host.setAttribute('aria-busy', prevBusy);
                return inst;
            },
            setLabel(label) { sp.setLabel(label); return inst; },
            destroy() {
                if (destroyed) return;
                inst.hide();
                destroyed = true;
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
                if (restorePosition !== null) host.style.position = restorePosition;
                if (overlays.get(host) === inst) overlays.delete(host);
            }
        };
        wrap.hidden = true;
        if (o.visible) inst.show();
        return inst;
    }

    /** Cover an element with a spinner overlay (reuses the existing overlay if there is one). */
    function overlay(el, options) {
        if (typeof el === 'string') el = document.querySelector(el);
        if (!el) return null;
        const prev = overlays.get(el);
        if (prev) { prev.show(); return prev; }
        const inst = makeOverlay(el, options, false);
        overlays.set(el, inst);
        return inst;
    }

    /** Cover the whole viewport. */
    function fullscreen(options) {
        const host = (options && options.container) || document.body;
        const inst = makeOverlay(host, options, true);
        inst.element.setAttribute('aria-modal', 'false');
        return inst;
    }

    /** Fill matching elements with a spinner. */
    function init(selector, options) {
        injectCSS();
        const els = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []);
        const insts = els.map(el => {
            const opts = Object.assign({}, options || {});
            ['type', 'size', 'color', 'label'].forEach(k => { const v = el.getAttribute('data-' + k); if (v != null && v !== '') opts[k] = k === 'size' && !isNaN(v) ? Number(v) : v; });
            const s = create(opts);
            el.appendChild(s.element);
            return s;
        });
        return { spinners: insts, destroy() { insts.forEach(s => s.destroy()); } };
    }

    const ChillSpinner = {
        version: VERSION,
        create,
        overlay,
        fullscreen,
        init,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSpinner;
    } else {
        window.ChillSpinner = ChillSpinner;
    }

})(typeof window !== 'undefined' ? window : this);
