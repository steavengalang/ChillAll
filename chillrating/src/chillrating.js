/**
 * ChillRating - Zero-dependency star rating
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const r = ChillRating.create({ max: 5, value: 3.5, half: true, onChange: v => console.log(v) });
 *   document.body.appendChild(r.element);
 *   ChillRating.init('#rating', { readonly: true, value: 4 });
 *
 * Options
 *   max          5       number of icons
 *   value        0       current rating (0..max)
 *   half         false   allow half-star ratings
 *   readonly     false   display only (role="img")
 *   disabled     false
 *   allowClear   false   clicking the current value resets to 0
 *   size         'md'    'sm' | 'md' | 'lg'
 *   icon         null    custom glyph text (textContent, e.g. a heart character). Default: SVG star
 *   iconHtml     null    custom icon markup (OPT-IN raw HTML, e.g. an <svg>); never pass user input
 *   color        null    CSS colour for filled icons
 *   name         null    hidden input name for forms
 *   label        'Rating'  accessible group label
 *   showValue    false   append a numeric "3.5 / 5" text
 *   itemLabel    null    (n, max) => string for each radio's aria-label
 *   container    null    element / selector to append into
 *   onChange(value, inst), onHover(value|null, inst)
 * Methods: getValue, setValue(v, silent), setReadonly(b), setDisabled(b), on(evt, fn) -> off(), destroy()
 * Events: 'change', 'hover'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillrating_css_injected__';
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillrating-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillrating-styles';
        style.textContent = `
      :root {
        --chillrating-color: #f59e0b;
        --chillrating-empty: #d1d5db;
        --chillrating-text: #171717;
        --chillrating-muted: #6b7280;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillrating-empty: #525252;
          --chillrating-text: #fafafa;
          --chillrating-muted: #9ca3af;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillrating-empty: #525252;
        --chillrating-text: #fafafa;
        --chillrating-muted: #9ca3af;
      }
      .chillrating { --chillrating-size: 24px; display: inline-flex; align-items: center; gap: 2px; font-size: 14px; color: var(--chillrating-text); vertical-align: middle; }
      .chillrating-sm { --chillrating-size: 18px; }
      .chillrating-lg { --chillrating-size: 32px; }
      .chillrating-star { position: relative; display: inline-block; width: var(--chillrating-size); height: var(--chillrating-size); font-size: var(--chillrating-size); line-height: 1; cursor: pointer; color: var(--chillrating-empty); border-radius: 4px; outline: none; transition: transform .15s ease; }
      .chillrating-star:hover { transform: scale(1.12); }
      .chillrating-star:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.45); }
      .chillrating-bg, .chillrating-fg { position: absolute; top: 0; left: 0; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
      .chillrating-fg { width: 0; overflow: hidden; color: var(--chillrating-color); transition: width .1s ease; }
      .chillrating-fg > * { flex: none; width: var(--chillrating-size); height: var(--chillrating-size); }
      .chillrating-star svg { width: 100%; height: 100%; fill: currentColor; display: block; }
      .chillrating-value { margin-left: 8px; color: var(--chillrating-muted); font-variant-numeric: tabular-nums; }
      .chillrating-readonly .chillrating-star, .chillrating-disabled .chillrating-star { cursor: default; }
      .chillrating-readonly .chillrating-star:hover, .chillrating-disabled .chillrating-star:hover { transform: none; }
      .chillrating-disabled { opacity: .5; }
      .chillrating-disabled .chillrating-star { cursor: not-allowed; }
      @media (prefers-reduced-motion: reduce) {
        .chillrating-star, .chillrating-fg { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function resolveEl(t) {
        if (!t) return null;
        if (typeof t === 'string') return document.querySelector(t);
        return t.nodeType === 1 ? t : null;
    }

    function starSvg() {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', 'M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z');
        svg.appendChild(p);
        return svg;
    }

    function createRating(options) {
        options = options || {};
        injectCSS();
        const max = Math.max(1, Math.floor(+options.max) || 5);
        const half = !!options.half;
        const stepSize = half ? 0.5 : 1;
        const listeners = {};
        let readonly = !!options.readonly;
        let disabled = !!options.disabled;
        let destroyed = false;
        let hover = null;

        const norm = v => {
            v = +v;
            if (!Number.isFinite(v)) v = 0;
            v = Math.min(max, Math.max(0, v));
            return Math.round(v / stepSize) * stepSize;
        };
        let value = norm(options.value);

        const root = document.createElement('div');
        root.className = 'chillrating chillrating-' + (options.size || 'md') + (options.className ? ' ' + options.className : '');
        root.setAttribute('aria-label', options.label || 'Rating');

        const makeIcon = () => {
            if (options.iconHtml) {
                const w = document.createElement('span');
                w.innerHTML = options.iconHtml; // explicit opt-in raw HTML
                return w.firstElementChild || w;
            }
            if (options.icon) {
                const s = document.createElement('span');
                s.textContent = String(options.icon);
                return s;
            }
            return starSvg();
        };

        const stars = [];
        for (let i = 0; i < max; i++) {
            const s = document.createElement('span');
            s.className = 'chillrating-star';
            s.dataset.index = String(i + 1);
            const bg = document.createElement('span');
            bg.className = 'chillrating-bg';
            bg.appendChild(makeIcon());
            const fg = document.createElement('span');
            fg.className = 'chillrating-fg';
            fg.appendChild(makeIcon());
            if (options.color) fg.style.color = options.color;
            s.appendChild(bg);
            s.appendChild(fg);
            root.appendChild(s);
            stars.push({ el: s, fg });
        }

        let valueEl = null;
        if (options.showValue) {
            valueEl = document.createElement('span');
            valueEl.className = 'chillrating-value';
            root.appendChild(valueEl);
        }
        let hidden = null;
        if (options.name) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = options.name;
            root.appendChild(hidden);
        }

        const itemLabel = (n) => (typeof options.itemLabel === 'function' ? options.itemLabel(n, max) : n + (n === 1 ? ' star' : ' stars'));
        const interactive = () => !readonly && !disabled;

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }

        function applyMode() {
            root.classList.toggle('chillrating-readonly', readonly);
            root.classList.toggle('chillrating-disabled', disabled);
            if (readonly) {
                root.setAttribute('role', 'img');
                root.removeAttribute('aria-disabled');
            } else {
                root.setAttribute('role', 'radiogroup');
                root.setAttribute('aria-disabled', disabled ? 'true' : 'false');
            }
            stars.forEach((s, i) => {
                if (readonly) {
                    s.el.removeAttribute('role');
                    s.el.removeAttribute('aria-checked');
                    s.el.removeAttribute('aria-label');
                    s.el.removeAttribute('tabindex');
                } else {
                    s.el.setAttribute('role', 'radio');
                    s.el.setAttribute('aria-label', itemLabel(i + 1));
                }
            });
        }

        function render() {
            const shown = hover !== null ? hover : value;
            const focusIdx = Math.max(0, Math.min(max - 1, Math.ceil(value) - 1));
            stars.forEach((s, i) => {
                const frac = Math.max(0, Math.min(1, shown - i));
                s.fg.style.width = (frac * 100) + '%';
                if (!readonly) {
                    s.el.setAttribute('aria-checked', Math.ceil(value) === i + 1 ? 'true' : 'false');
                    s.el.tabIndex = !disabled && i === focusIdx ? 0 : -1;
                }
            });
            const text = value + ' / ' + max;
            if (readonly) root.setAttribute('aria-label', (options.label || 'Rating') + ': ' + text);
            else root.setAttribute('aria-label', options.label || 'Rating');
            if (!readonly) root.setAttribute('aria-valuetext', text);
            if (valueEl) valueEl.textContent = text;
            if (hidden) hidden.value = String(value);
        }

        function commit(v) {
            v = norm(v);
            if (v === value) return;
            value = v;
            render();
            if (typeof options.onChange === 'function') options.onChange(value, api);
            emit('change', value);
        }

        function valueAt(starEl, e) {
            const idx = +starEl.dataset.index;
            if (!half) return idx;
            const r = starEl.getBoundingClientRect();
            if (r.width && e && typeof e.clientX === 'number' && e.clientX - r.left < r.width / 2) return idx - 0.5;
            return idx;
        }

        function setHover(v) {
            if (hover === v) return;
            hover = v;
            render();
            if (typeof options.onHover === 'function') options.onHover(v, api);
            emit('hover', v);
        }

        const starFrom = e => (e.target && e.target.closest ? e.target.closest('.chillrating-star') : null);
        const onMove = e => {
            if (!interactive()) return;
            const s = starFrom(e);
            if (s) setHover(valueAt(s, e));
        };
        const onLeave = () => { if (hover !== null) setHover(null); };
        const onClick = e => {
            if (!interactive()) return;
            const s = starFrom(e);
            if (!s) return;
            const v = valueAt(s, e);
            hover = null;
            if (options.allowClear && v === value) commit(0); else commit(v);
            render();
        };
        const onKey = e => {
            if (!interactive() || e.altKey || e.ctrlKey || e.metaKey) return;
            let v = value;
            switch (e.key) {
                case 'ArrowRight': case 'ArrowUp': v += stepSize; break;
                case 'ArrowLeft': case 'ArrowDown': v -= stepSize; break;
                case 'Home': v = 0; break;
                case 'End': v = max; break;
                case ' ': case 'Enter': {
                    const s = starFrom(e);
                    if (s) v = +s.dataset.index;
                    break;
                }
                default: {
                    if (/^[0-9]$/.test(e.key) && +e.key <= max) { v = +e.key; break; }
                    return;
                }
            }
            e.preventDefault();
            commit(v);
            const idx = Math.max(0, Math.min(max - 1, Math.ceil(value) - 1));
            if (stars[idx] && stars[idx].el.focus) stars[idx].el.focus();
        };
        root.addEventListener('mousemove', onMove);
        root.addEventListener('mouseleave', onLeave);
        root.addEventListener('click', onClick);
        root.addEventListener('keydown', onKey);

        const api = {
            element: root,
            getValue: () => value,
            setValue(v, silent) {
                if (destroyed) return api;
                if (silent) { value = norm(v); render(); } else commit(v);
                return api;
            },
            setReadonly(b) { readonly = !!b; applyMode(); render(); return api; },
            setDisabled(b) { disabled = !!b; applyMode(); render(); return api; },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                root.removeEventListener('mousemove', onMove);
                root.removeEventListener('mouseleave', onLeave);
                root.removeEventListener('click', onClick);
                root.removeEventListener('keydown', onKey);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        applyMode();
        render();
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillRating = {
        version: VERSION,
        create: createRating,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createRating(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillRating;
    } else {
        window.ChillRating = ChillRating;
    }

})(typeof window !== 'undefined' ? window : this);
