/**
 * ChillNumberInput - Zero-dependency numeric stepper
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const n = ChillNumberInput.create({ value: 5, min: 0, max: 10, step: 1, onChange: v => console.log(v) });
 *   document.body.appendChild(n.element);
 *   ChillNumberInput.init('#qty', { value: 1, min: 1, suffix: ' pcs', thousandSeparator: ',' });
 *
 * Options
 *   value        null     number or null (empty)
 *   min / max    null     limits (clamped on commit, +/- disabled at the limit)
 *   step         1        increment for buttons / ArrowUp / ArrowDown / wheel
 *   largeStep    step*10  increment for Shift+Arrow / PageUp / PageDown
 *   precision    auto     decimal places (default: from step/min decimals)
 *   prefix       ''       text shown before the number (e.g. '$')   [text only, never HTML]
 *   suffix       ''       text shown after the number (e.g. ' kg')
 *   thousandSeparator ''  e.g. ',' | ' ' | '.'
 *   decimalSeparator  '.' use ',' for European style
 *   formatter    null     (value:number) => string  (overrides the built-in formatting)
 *   parser       null     (text:string) => number|null (overrides the built-in parsing)
 *   holdToRepeat true     keep pressing +/- to repeat (accelerates)
 *   holdDelay 400, holdInterval 70   timing in ms
 *   wheel        false    change value with the mouse wheel while focused
 *   allowEmpty   true     empty text commits null (false: restores the previous value)
 *   controls     true     show +/- buttons; false = input only
 *   size         'md'     'sm' | 'md' | 'lg'
 *   disabled / readonly   false
 *   name         null     name of the <input> (form submission, raw numeric value in a hidden input)
 *   label        null     aria-label for the input
 *   placeholder  ''
 *   container    null     element / selector to append into
 *   onInput(value, inst)  while typing a parsable value
 *   onChange(value, inst) when a value is committed
 * Methods: getValue, setValue(v, silent), increment(n?), decrement(n?), focus, setDisabled, setReadonly,
 *          on(evt, fn) -> off(), destroy()
 * Events: 'input', 'change'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillnumberinput_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillnumberinput-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillnumberinput-styles';
        style.textContent = `
      :root {
        --chillnumberinput-bg: #ffffff;
        --chillnumberinput-text: #171717;
        --chillnumberinput-border: #d4d4d4;
        --chillnumberinput-btn-bg: #f9fafb;
        --chillnumberinput-btn-hover: #e5e7eb;
        --chillnumberinput-focus: #3b82f6;
        --chillnumberinput-disabled: #9ca3af;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillnumberinput-bg: #171717;
          --chillnumberinput-text: #fafafa;
          --chillnumberinput-border: #404040;
          --chillnumberinput-btn-bg: #262626;
          --chillnumberinput-btn-hover: #404040;
          --chillnumberinput-disabled: #6b7280;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillnumberinput-bg: #171717;
        --chillnumberinput-text: #fafafa;
        --chillnumberinput-border: #404040;
        --chillnumberinput-btn-bg: #262626;
        --chillnumberinput-btn-hover: #404040;
        --chillnumberinput-disabled: #6b7280;
      }
      .chillnumberinput { --chillnumberinput-h: 36px; display: inline-flex; align-items: stretch; box-sizing: border-box; height: var(--chillnumberinput-h); font-size: 14px; color: var(--chillnumberinput-text); background: var(--chillnumberinput-bg); border: 1px solid var(--chillnumberinput-border); border-radius: 8px; overflow: hidden; transition: border-color .15s ease, box-shadow .15s ease; }
      .chillnumberinput-sm { --chillnumberinput-h: 32px; font-size: 13px; }
      .chillnumberinput-lg { --chillnumberinput-h: 44px; font-size: 16px; }
      .chillnumberinput:focus-within { border-color: var(--chillnumberinput-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillnumberinput-input { box-sizing: border-box; width: 90px; min-width: 0; padding: 0 8px; margin: 0; font: inherit; text-align: center; color: inherit; background: transparent; border: 0; outline: none; font-variant-numeric: tabular-nums; }
      .chillnumberinput-input::placeholder { color: var(--chillnumberinput-disabled); }
      .chillnumberinput-btn { flex: none; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; width: var(--chillnumberinput-h); min-width: 32px; margin: 0; padding: 0; font: inherit; font-size: 18px; line-height: 1; color: inherit; background: var(--chillnumberinput-btn-bg); border: 0; cursor: pointer; user-select: none; touch-action: manipulation; transition: background .12s ease; }
      .chillnumberinput-btn:first-child { border-right: 1px solid var(--chillnumberinput-border); }
      .chillnumberinput-btn:last-child { border-left: 1px solid var(--chillnumberinput-border); }
      .chillnumberinput-btn:hover:not(:disabled) { background: var(--chillnumberinput-btn-hover); }
      .chillnumberinput-btn:focus-visible { outline: 2px solid var(--chillnumberinput-focus); outline-offset: -2px; }
      .chillnumberinput-btn:disabled { color: var(--chillnumberinput-disabled); cursor: not-allowed; }
      .chillnumberinput-btn svg { width: 14px; height: 14px; pointer-events: none; }
      .chillnumberinput-disabled { opacity: .6; }
      .chillnumberinput-readonly .chillnumberinput-btn { display: none; }
      @media (prefers-reduced-motion: reduce) {
        .chillnumberinput, .chillnumberinput-btn { transition: none; }
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
    function decimals(n) {
        const s = String(n);
        if (s.indexOf('e-') > -1) return parseInt(s.split('e-')[1], 10);
        const i = s.indexOf('.');
        return i < 0 ? 0 : s.length - i - 1;
    }
    function icon(plus) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 14 14');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', plus ? 'M7 1.5v11M1.5 7h11' : 'M1.5 7h11');
        p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', '1.8');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('fill', 'none');
        svg.appendChild(p);
        return svg;
    }

    function createNumberInput(options) {
        options = options || {};
        injectCSS();
        const num = v => (v === null || v === undefined || v === '' ? null : (Number.isFinite(+v) ? +v : null));
        const min = num(options.min);
        const max = num(options.max);
        const step = +options.step > 0 ? +options.step : 1;
        const largeStep = +options.largeStep > 0 ? +options.largeStep : step * 10;
        const precision = Number.isInteger(options.precision) && options.precision >= 0
            ? options.precision
            : Math.max(decimals(step), decimals(min === null ? 0 : min));
        const prefix = options.prefix ? String(options.prefix) : '';
        const suffix = options.suffix ? String(options.suffix) : '';
        const thousand = options.thousandSeparator ? String(options.thousandSeparator) : '';
        const decSep = options.decimalSeparator ? String(options.decimalSeparator) : '.';
        const holdOn = options.holdToRepeat !== false;
        const holdDelay = Math.max(0, num(options.holdDelay) === null ? 400 : +options.holdDelay);
        const holdInterval = Math.max(10, num(options.holdInterval) === null ? 70 : +options.holdInterval);
        const listeners = {};
        let disabled = !!options.disabled;
        let readonly = !!options.readonly;
        let destroyed = false;
        let value = null;
        let holdTimer = null;
        let holdTick = 0;

        const clamp = v => {
            if (min !== null && v < min) v = min;
            if (max !== null && v > max) v = max;
            return v;
        };
        const round = v => +(+v).toFixed(precision);
        const normalize = v => { v = num(v); return v === null ? null : round(clamp(v)); };

        function defaultFormat(v) {
            let s = Math.abs(v).toFixed(precision);
            let parts = s.split('.');
            if (thousand) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
            s = parts.join(decSep);
            if (v < 0) s = '-' + s;
            return prefix + s + suffix;
        }
        const format = v => (typeof options.formatter === 'function' ? String(options.formatter(v)) : defaultFormat(v));
        function defaultParse(text) {
            let s = String(text).trim();
            if (prefix && s.indexOf(prefix) === 0) s = s.slice(prefix.length);
            if (suffix && s.slice(-suffix.length) === suffix) s = s.slice(0, -suffix.length);
            if (thousand) s = s.split(thousand).join('');
            s = s.replace(/[\s ]/g, '');
            if (decSep !== '.') s = s.split(decSep).join('.');
            if (s === '' || s === '-' || s === '.') return null;
            if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return NaN;
            return parseFloat(s);
        }
        const parse = text => (typeof options.parser === 'function' ? options.parser(text) : defaultParse(text));

        // ---- DOM ----
        const root = document.createElement('div');
        root.className = 'chillnumberinput chillnumberinput-' + (options.size || 'md') + (options.className ? ' ' + options.className : '');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chillnumberinput-input';
        input.setAttribute('role', 'spinbutton');
        input.setAttribute('inputmode', precision > 0 || (min !== null && min < 0) ? 'decimal' : 'numeric');
        input.autocomplete = 'off';
        input.spellcheck = false;
        if (options.label) input.setAttribute('aria-label', String(options.label));
        if (options.placeholder) input.placeholder = String(options.placeholder);
        if (min !== null) input.setAttribute('aria-valuemin', String(min));
        if (max !== null) input.setAttribute('aria-valuemax', String(max));

        let minus = null, plus = null;
        if (options.controls !== false) {
            minus = document.createElement('button');
            minus.type = 'button';
            minus.className = 'chillnumberinput-btn chillnumberinput-minus';
            minus.tabIndex = -1;
            minus.setAttribute('aria-label', 'Decrease');
            minus.appendChild(icon(false));
            plus = document.createElement('button');
            plus.type = 'button';
            plus.className = 'chillnumberinput-btn chillnumberinput-plus';
            plus.tabIndex = -1;
            plus.setAttribute('aria-label', 'Increase');
            plus.appendChild(icon(true));
            root.appendChild(minus);
        }
        root.appendChild(input);
        if (plus) root.appendChild(plus);
        let hidden = null;
        if (options.name) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = options.name;
            root.appendChild(hidden);
        }

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }

        function render() {
            input.value = value === null ? '' : format(value);
            if (value === null) { input.removeAttribute('aria-valuenow'); input.removeAttribute('aria-valuetext'); }
            else { input.setAttribute('aria-valuenow', String(value)); input.setAttribute('aria-valuetext', format(value)); }
            if (hidden) hidden.value = value === null ? '' : String(value);
            const inactive = disabled || readonly;
            input.disabled = disabled;
            input.readOnly = readonly;
            if (minus) {
                minus.disabled = inactive || (value !== null && min !== null && value <= min);
                plus.disabled = inactive || (value !== null && max !== null && value >= max);
            }
            root.classList.toggle('chillnumberinput-disabled', disabled);
            root.classList.toggle('chillnumberinput-readonly', readonly);
        }

        function commit(v, silent) {
            const next = normalize(v);
            const changed = next !== value;
            value = next;
            render();
            if (changed && !silent) {
                if (typeof options.onChange === 'function') options.onChange(value, api);
                emit('change', value);
            }
            return changed;
        }

        function stepBy(dir, amount) {
            if (disabled || readonly) return false;
            // from empty: first press lands on min (if min > 0) or steps away from 0
            const base = value !== null ? value : (min !== null && min > 0 ? min - dir * amount : (max !== null && max < 0 ? max - dir * amount : 0));
            const next = base + dir * amount;
            return commit(next);
        }
        const increment = n => stepBy(1, +n > 0 ? +n : step);
        const decrement = n => stepBy(-1, +n > 0 ? +n : step);

        // typing
        const onInput = () => {
            const p = parse(input.value);
            if (p !== null && p === p) {
                const v = normalize(p);
                if (typeof options.onInput === 'function') options.onInput(v, api);
                emit('input', v);
            }
        };
        function commitText() {
            const p = parse(input.value);
            if (p === null) {
                if (options.allowEmpty === false) { render(); return; }
                commit(null);
            } else if (p !== p) { render(); }     // NaN -> revert
            else commit(p);
            render();
        }
        const onBlur = () => commitText();
        const onKey = e => {
            if (disabled || readonly || e.altKey || e.ctrlKey || e.metaKey) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); commitText(); stepBy(1, e.shiftKey ? largeStep : step); break;
                case 'ArrowDown': e.preventDefault(); commitText(); stepBy(-1, e.shiftKey ? largeStep : step); break;
                case 'PageUp': e.preventDefault(); commitText(); stepBy(1, largeStep); break;
                case 'PageDown': e.preventDefault(); commitText(); stepBy(-1, largeStep); break;
                case 'Enter': commitText(); break;
                default:
            }
        };
        const onWheel = e => {
            if (!options.wheel || disabled || readonly || document.activeElement !== input) return;
            e.preventDefault();
            stepBy(e.deltaY < 0 ? 1 : -1, step);
        };

        // buttons + hold to repeat
        function stopHold() {
            if (holdTimer !== null) { window.clearTimeout(holdTimer); window.clearInterval(holdTimer); holdTimer = null; }
            holdTick = 0;
            document.removeEventListener('pointerup', stopHold);
            document.removeEventListener('pointercancel', stopHold);
        }
        function startHold(dir) {
            stopHold();
            if (!holdOn) return;
            document.addEventListener('pointerup', stopHold);
            document.addEventListener('pointercancel', stopHold);
            const tick = () => {
                holdTick++;
                const changed = stepBy(dir, step * (holdTick > 20 ? 5 : 1));
                if (!changed) { stopHold(); return; }
                holdTimer = window.setTimeout(tick, Math.max(25, holdInterval - Math.min(holdTick, 30) * 1.5));
            };
            holdTimer = window.setTimeout(tick, holdDelay);
        }
        const dirOf = e => {
            const b = e.target && e.target.closest ? e.target.closest('.chillnumberinput-btn') : null;
            return b === minus ? -1 : b === plus ? 1 : 0;
        };
        const onBtnDown = e => {
            const dir = dirOf(e);
            if (!dir || disabled || readonly || (e.button !== undefined && e.button > 0)) return;
            if (e.cancelable && e.preventDefault) e.preventDefault(); // keep focus/selection
            if (input.focus) input.focus();
            commitText();
            stepBy(dir, step);
            startHold(dir);
        };
        const onBtnClick = e => {
            const dir = dirOf(e);
            if (!dir || e.detail > 0) return;       // pointer clicks are handled by pointerdown
            stepBy(dir, step);
        };
        input.addEventListener('input', onInput);
        input.addEventListener('blur', onBlur);
        input.addEventListener('keydown', onKey);
        input.addEventListener('wheel', onWheel, { passive: false });
        root.addEventListener('pointerdown', onBtnDown);
        root.addEventListener('click', onBtnClick);

        const api = {
            element: root,
            input,
            getValue: () => value,
            setValue(v, silent) { if (!destroyed) commit(v, !!silent); return api; },
            increment(n) { increment(n); return api; },
            decrement(n) { decrement(n); return api; },
            focus() { input.focus(); return api; },
            setDisabled(b) { disabled = !!b; if (disabled) stopHold(); render(); return api; },
            setReadonly(b) { readonly = !!b; if (readonly) stopHold(); render(); return api; },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                stopHold();
                input.removeEventListener('input', onInput);
                input.removeEventListener('blur', onBlur);
                input.removeEventListener('keydown', onKey);
                input.removeEventListener('wheel', onWheel);
                root.removeEventListener('pointerdown', onBtnDown);
                root.removeEventListener('click', onBtnClick);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        value = normalize(options.value);
        render();
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillNumberInput = {
        version: VERSION,
        create: createNumberInput,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createNumberInput(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillNumberInput;
    } else {
        window.ChillNumberInput = ChillNumberInput;
    }

})(typeof window !== 'undefined' ? window : this);
