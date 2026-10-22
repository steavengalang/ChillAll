/**
 * ChillSlider - Zero-dependency single / dual-handle range slider
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const s = ChillSlider.create({ min: 0, max: 100, step: 5, value: 30, tooltip: 'hover', onChange: v => console.log(v) });
 *   document.body.appendChild(s.element);
 *   const r = ChillSlider.init('#price', { value: [20, 80], marks: [0, 50, 100] });   // mounts into #price
 *   r.getValue();    // [20, 80]
 *   r.setValue([10, 60]);
 *   r.destroy();
 *
 * Options
 *   min 0, max 100, step 1
 *   value        number (single) or [low, high] (dual). Default: min (single)
 *   range        false  force dual handle (value defaults to [min, max])
 *   minGap       0      minimum distance between dual handles
 *   largeStep    step*10  PageUp / PageDown increment
 *   marks        false  true (tick at each step) | number[] | {value, label}[]
 *   tooltip      'hover' 'hover' | 'always' | false
 *   vertical     false
 *   size         'md'   'sm' | 'md' | 'lg'
 *   disabled     false
 *   name         null   hidden <input> name for forms (dual: name-min / name-max)
 *   label        null   aria-label (string, or [low, high] strings for dual)
 *   formatter    null   (value) => string shown in tooltip / aria-valuetext
 *   container    null   element or selector the root is appended to
 *   className    ''
 *   onInput(value, inst)   fired continuously while dragging
 *   onChange(value, inst)  fired when value is committed
 * Methods: getValue, setValue(v, silent), setDisabled(b), on(evt, fn) -> off(), destroy()
 * Events: 'input', 'change'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillslider_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillslider-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillslider-styles';
        style.textContent = `
      :root {
        --chillslider-track: #e5e7eb;
        --chillslider-fill: #3b82f6;
        --chillslider-thumb: #ffffff;
        --chillslider-thumb-border: #3b82f6;
        --chillslider-text: #171717;
        --chillslider-muted: #6b7280;
        --chillslider-tooltip-bg: #171717;
        --chillslider-tooltip-text: #ffffff;
        --chillslider-disabled: #9ca3af;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillslider-track: #404040;
          --chillslider-thumb: #fafafa;
          --chillslider-text: #fafafa;
          --chillslider-muted: #9ca3af;
          --chillslider-tooltip-bg: #fafafa;
          --chillslider-tooltip-text: #171717;
          --chillslider-disabled: #6b7280;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillslider-track: #404040;
        --chillslider-thumb: #fafafa;
        --chillslider-text: #fafafa;
        --chillslider-muted: #9ca3af;
        --chillslider-tooltip-bg: #fafafa;
        --chillslider-tooltip-text: #171717;
        --chillslider-disabled: #6b7280;
      }
      .chillslider { --chillslider-h: 6px; --chillslider-t: 20px; position: relative; display: block; box-sizing: border-box; padding: 14px 10px; touch-action: none; user-select: none; font-size: 12px; color: var(--chillslider-text); }
      .chillslider-sm { --chillslider-h: 4px; --chillslider-t: 16px; }
      .chillslider-lg { --chillslider-h: 8px; --chillslider-t: 24px; }
      .chillslider-track { position: relative; height: var(--chillslider-h); background: var(--chillslider-track); border-radius: 999px; cursor: pointer; }
      .chillslider-fill { position: absolute; top: 0; bottom: 0; background: var(--chillslider-fill); border-radius: 999px; pointer-events: none; }
      .chillslider-thumb { position: absolute; top: 50%; width: var(--chillslider-t); height: var(--chillslider-t); margin: calc(var(--chillslider-t) / -2) 0 0 calc(var(--chillslider-t) / -2); box-sizing: border-box; background: var(--chillslider-thumb); border: 2px solid var(--chillslider-thumb-border); border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,.25); cursor: grab; outline: none; transition: transform .15s ease, box-shadow .15s ease; z-index: 2; }
      .chillslider-thumb:hover, .chillslider-dragging .chillslider-thumb-active { transform: scale(1.12); }
      .chillslider-dragging .chillslider-thumb-active { cursor: grabbing; }
      .chillslider-thumb:focus-visible { box-shadow: 0 0 0 4px rgba(59,130,246,.4); }
      .chillslider-thumb::before { content: ''; position: absolute; inset: -8px; }
      .chillslider-tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); padding: 3px 8px; background: var(--chillslider-tooltip-bg); color: var(--chillslider-tooltip-text); border-radius: 6px; font-size: 12px; line-height: 1.4; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
      .chillslider-thumb:hover .chillslider-tooltip, .chillslider-thumb:focus-visible .chillslider-tooltip, .chillslider-dragging .chillslider-thumb-active .chillslider-tooltip, .chillslider-tooltip-always .chillslider-tooltip { opacity: 1; }
      .chillslider-marks { position: relative; height: 24px; margin-top: 6px; }
      .chillslider-mark { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; color: var(--chillslider-muted); pointer-events: none; }
      .chillslider-mark::before { content: ''; width: 2px; height: 5px; background: var(--chillslider-track); margin-bottom: 3px; border-radius: 1px; }
      .chillslider-mark-active::before { background: var(--chillslider-fill); }
      .chillslider-mark-label { white-space: nowrap; }
      .chillslider-vertical { display: inline-block; height: 200px; padding: 10px 14px; }
      .chillslider-vertical .chillslider-track { width: var(--chillslider-h); height: 100%; }
      .chillslider-vertical .chillslider-fill { left: 0; right: 0; top: auto; bottom: auto; }
      .chillslider-vertical .chillslider-thumb { top: auto; left: 50%; margin: 0 0 calc(var(--chillslider-t) / -2) calc(var(--chillslider-t) / -2); }
      .chillslider-vertical .chillslider-tooltip { bottom: auto; left: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
      .chillslider-vertical .chillslider-marks { position: absolute; top: 10px; bottom: 10px; left: calc(14px + var(--chillslider-h) + 8px); height: auto; margin: 0; width: 60px; }
      .chillslider-vertical .chillslider-mark { top: auto; transform: translateY(50%); flex-direction: row; }
      .chillslider-vertical .chillslider-mark::before { width: 5px; height: 2px; margin: 0 4px 0 0; }
      .chillslider-disabled { opacity: .55; }
      .chillslider-disabled .chillslider-track, .chillslider-disabled .chillslider-thumb { cursor: not-allowed; }
      .chillslider-disabled .chillslider-fill { background: var(--chillslider-disabled); }
      @media (prefers-reduced-motion: reduce) {
        .chillslider-thumb, .chillslider-tooltip { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function decimals(n) {
        const s = String(n);
        if (s.indexOf('e-') > -1) return parseInt(s.split('e-')[1], 10);
        const i = s.indexOf('.');
        return i < 0 ? 0 : s.length - i - 1;
    }

    function resolveEl(t) {
        if (!t) return null;
        if (typeof t === 'string') return document.querySelector(t);
        return t.nodeType === 1 ? t : null;
    }

    function createSlider(options) {
        options = options || {};
        injectCSS();
        const min = Number.isFinite(+options.min) ? +options.min : 0;
        let max = Number.isFinite(+options.max) ? +options.max : 100;
        if (max <= min) max = min + 1;
        const step = +options.step > 0 ? +options.step : 1;
        const prec = Math.max(decimals(step), decimals(min));
        const dual = !!options.range || Array.isArray(options.value);
        const vertical = !!options.vertical;
        const minGap = Math.max(0, +options.minGap || 0);
        const tooltipMode = options.tooltip === undefined ? 'hover' : options.tooltip;
        const listeners = {};
        let destroyed = false;
        let disabled = !!options.disabled;
        let activeIdx = 0;
        let dragging = false;
        let startValues = null;

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
        const snap = v => {
            const n = Math.round((v - min) / step);
            return +clamp(min + n * step, min, max).toFixed(prec);
        };
        const fmt = v => (typeof options.formatter === 'function' ? String(options.formatter(v)) : String(v));
        const pct = v => ((v - min) / (max - min)) * 100;

        let values;
        if (dual) {
            const a = Array.isArray(options.value) ? options.value : [min, max];
            values = [snap(Number.isFinite(+a[0]) ? +a[0] : min), snap(Number.isFinite(+a[1]) ? +a[1] : max)];
            if (values[0] > values[1]) values.reverse();
        } else {
            values = [snap(options.value === undefined || !Number.isFinite(+options.value) ? min : +options.value)];
        }

        const root = document.createElement('div');
        root.className = 'chillslider chillslider-' + (options.size || 'md') + (vertical ? ' chillslider-vertical' : '') +
            (tooltipMode === 'always' ? ' chillslider-tooltip-always' : '') + (options.className ? ' ' + options.className : '');
        const track = document.createElement('div');
        track.className = 'chillslider-track';
        const fill = document.createElement('div');
        fill.className = 'chillslider-fill';
        track.appendChild(fill);
        root.appendChild(track);

        const thumbs = [];
        const hidden = [];
        const labels = Array.isArray(options.label) ? options.label : [options.label, options.label];
        values.forEach((v, i) => {
            const t = document.createElement('div');
            t.className = 'chillslider-thumb';
            t.tabIndex = disabled ? -1 : 0;
            t.setAttribute('role', 'slider');
            t.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
            t.setAttribute('aria-valuemin', String(min));
            t.setAttribute('aria-valuemax', String(max));
            if (labels[i]) t.setAttribute('aria-label', String(labels[i]));
            else if (dual) t.setAttribute('aria-label', i === 0 ? 'Minimum' : 'Maximum');
            if (tooltipMode) {
                const tip = document.createElement('span');
                tip.className = 'chillslider-tooltip';
                tip.setAttribute('aria-hidden', 'true');
                t.appendChild(tip);
            }
            t.addEventListener('focus', () => { activeIdx = i; });
            t.addEventListener('keydown', e => onKey(e, i));
            track.appendChild(t);
            thumbs.push(t);
            if (options.name) {
                const h = document.createElement('input');
                h.type = 'hidden';
                h.name = dual ? options.name + (i === 0 ? '-min' : '-max') : options.name;
                root.appendChild(h);
                hidden.push(h);
            }
        });

        // Marks
        let marks = [];
        if (options.marks === true) {
            const count = Math.floor((max - min) / step);
            if (count <= 50) for (let i = 0; i <= count; i++) marks.push({ value: +(min + i * step).toFixed(prec) });
            if (marks.length) {
                marks[0].label = fmt(marks[0].value);
                marks[marks.length - 1].label = fmt(marks[marks.length - 1].value);
            }
        } else if (Array.isArray(options.marks)) {
            marks = options.marks.map(m => (typeof m === 'object' && m !== null ? { value: +m.value, label: m.label } : { value: +m, label: fmt(+m) }))
                .filter(m => Number.isFinite(m.value) && m.value >= min && m.value <= max);
        }
        const markEls = [];
        if (marks.length) {
            const wrap = document.createElement('div');
            wrap.className = 'chillslider-marks';
            wrap.setAttribute('aria-hidden', 'true');
            marks.forEach(m => {
                const d = document.createElement('div');
                d.className = 'chillslider-mark';
                d.style[vertical ? 'bottom' : 'left'] = pct(m.value) + '%';
                if (m.label !== undefined && m.label !== null && m.label !== '') {
                    const l = document.createElement('span');
                    l.className = 'chillslider-mark-label';
                    l.textContent = String(m.label);
                    d.appendChild(l);
                }
                wrap.appendChild(d);
                markEls.push({ el: d, value: m.value });
            });
            root.appendChild(wrap);
        }

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }
        const out = () => (dual ? values.slice() : values[0]);

        function render() {
            const lo = dual ? pct(values[0]) : 0;
            const hi = pct(values[dual ? 1 : 0]);
            if (vertical) { fill.style.bottom = lo + '%'; fill.style.height = (hi - lo) + '%'; }
            else { fill.style.left = lo + '%'; fill.style.width = (hi - lo) + '%'; }
            thumbs.forEach((t, i) => {
                t.style[vertical ? 'bottom' : 'left'] = pct(values[i]) + '%';
                t.setAttribute('aria-valuenow', String(values[i]));
                t.setAttribute('aria-valuetext', fmt(values[i]));
                t.setAttribute('aria-disabled', disabled ? 'true' : 'false');
                if (dual) {
                    t.setAttribute('aria-valuemin', String(i === 0 ? min : values[0]));
                    t.setAttribute('aria-valuemax', String(i === 0 ? values[1] : max));
                }
                const tip = t.querySelector('.chillslider-tooltip');
                if (tip) tip.textContent = fmt(values[i]);
                if (hidden[i]) hidden[i].value = String(values[i]);
            });
            markEls.forEach(m => m.el.classList.toggle('chillslider-mark-active', m.value >= (dual ? values[0] : min) && m.value <= values[dual ? 1 : 0]));
        }

        // returns true if changed
        function setAt(i, v) {
            v = snap(v);
            if (dual) {
                if (i === 0) v = Math.min(v, values[1] - minGap);
                else v = Math.max(v, values[0] + minGap);
                v = clamp(v, min, max);
            }
            if (v === values[i]) return false;
            values[i] = v;
            render();
            return true;
        }

        function commit() {
            if (typeof options.onChange === 'function') options.onChange(out(), api);
            emit('change', out());
        }

        function fireInput() {
            emit('input', out());
            if (typeof options.onInput === 'function') options.onInput(out(), api);
        }

        function onKey(e, i) {
            if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
            const big = +options.largeStep > 0 ? +options.largeStep : step * 10;
            let v = values[i];
            switch (e.key) {
                case 'ArrowRight': case 'ArrowUp': v += step; break;
                case 'ArrowLeft': case 'ArrowDown': v -= step; break;
                case 'PageUp': v += big; break;
                case 'PageDown': v -= big; break;
                case 'Home': v = min; break;
                case 'End': v = max; break;
                default: return;
            }
            e.preventDefault();
            if (setAt(i, v)) { fireInput(); commit(); }
        }

        function valueFromEvent(e) {
            const r = track.getBoundingClientRect();
            let ratio = 0;
            if (vertical) ratio = r.height ? 1 - (e.clientY - r.top) / r.height : 0;
            else ratio = r.width ? (e.clientX - r.left) / r.width : 0;
            return min + clamp(ratio, 0, 1) * (max - min);
        }

        function move(e) {
            if (!dragging) return;
            if (setAt(activeIdx, valueFromEvent(e))) fireInput();
        }
        function up() {
            if (!dragging) return;
            dragging = false;
            root.classList.remove('chillslider-dragging');
            thumbs.forEach(t => t.classList.remove('chillslider-thumb-active'));
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', up);
            const changed = startValues && startValues.join() !== values.join();
            startValues = null;
            if (changed) commit();
        }
        function down(e) {
            if (disabled || (e.button !== undefined && e.button > 0)) return;
            const v = valueFromEvent(e);
            const th = thumbs.indexOf(e.target && e.target.closest ? e.target.closest('.chillslider-thumb') : null);
            if (th > -1) activeIdx = th;
            else if (dual) {
                const d0 = Math.abs(v - values[0]);
                const d1 = Math.abs(v - values[1]);
                activeIdx = d0 === d1 ? (v > values[1] ? 1 : 0) : (d0 < d1 ? 0 : 1);
            } else activeIdx = 0;
            startValues = values.slice();
            dragging = true;
            root.classList.add('chillslider-dragging');
            thumbs.forEach((t, i) => t.classList.toggle('chillslider-thumb-active', i === activeIdx));
            if (thumbs[activeIdx].focus) thumbs[activeIdx].focus({ preventScroll: true });
            if (setAt(activeIdx, v)) fireInput();
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
            if (e.cancelable && e.preventDefault) e.preventDefault();
        }
        track.addEventListener('pointerdown', down);

        function setDisabled(b) {
            disabled = !!b;
            root.classList.toggle('chillslider-disabled', disabled);
            thumbs.forEach(t => { t.tabIndex = disabled ? -1 : 0; });
            hidden.forEach(h => { h.disabled = disabled; });
            render();
        }

        const api = {
            element: root,
            getValue: out,
            setValue(v, silent) {
                if (destroyed) return api;
                const prev = values.join();
                if (dual) {
                    const a = Array.isArray(v) ? v : [v, values[1]];
                    const lo = snap(+a[0]);
                    const hi = snap(+a[1]);
                    values = lo <= hi ? [lo, hi] : [hi, lo];
                } else {
                    values = [snap(Array.isArray(v) ? +v[0] : +v)];
                }
                render();
                if (!silent && prev !== values.join()) commit();
                return api;
            },
            setDisabled,
            isDisabled: () => disabled,
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                dragging = true;
                up();
                destroyed = true;
                track.removeEventListener('pointerdown', down);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        root.classList.toggle('chillslider-disabled', disabled);
        render();
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillSlider = {
        version: VERSION,
        create: createSlider,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createSlider(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSlider;
    } else {
        window.ChillSlider = ChillSlider;
    }

})(typeof window !== 'undefined' ? window : this);
