/**
 * ChillOtp - Zero-dependency OTP / PIN code input
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const otp = ChillOtp.create({ length: 6, onComplete: code => verify(code) });
 *   document.body.appendChild(otp.element);
 *   ChillOtp.init('#otp', { length: 4, mask: true, type: 'numeric' });
 *
 * Options
 *   length       6          number of boxes
 *   type         'numeric'  'numeric' | 'alpha' | 'alphanumeric' | 'any'
 *   mask         false      show bullets (type=password)
 *   uppercase    false      force upper-case letters
 *   value        ''         initial value
 *   groupSize    0          visual gap after every N boxes (e.g. 3 -> 123 456)
 *   autoFocus    false      focus first empty box on mount
 *   disabled     false
 *   size         'md'       'sm' | 'md' | 'lg'
 *   name         null       hidden input name (holds the joined value) for forms
 *   label        'Verification code'  group aria-label
 *   placeholder  ''         placeholder char for empty boxes
 *   container    null       element / selector to append into
 *   onChange(value, inst)   fired on every change (value may be partial)
 *   onComplete(value, inst) fired when all boxes are filled
 * Methods: getValue, setValue(str, silent), clear, focus, setError(bool), setDisabled(bool),
 *          isComplete, on(evt, fn) -> off(), destroy()
 * Events: 'change', 'complete'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillotp_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillotp-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillotp-styles';
        style.textContent = `
      :root {
        --chillotp-bg: #ffffff;
        --chillotp-text: #171717;
        --chillotp-border: #d4d4d4;
        --chillotp-focus: #3b82f6;
        --chillotp-error: #ef4444;
        --chillotp-filled-bg: #f9fafb;
        --chillotp-disabled-bg: #f3f4f6;
        --chillotp-placeholder: #9ca3af;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillotp-bg: #171717;
          --chillotp-text: #fafafa;
          --chillotp-border: #404040;
          --chillotp-filled-bg: #1f1f1f;
          --chillotp-disabled-bg: #262626;
          --chillotp-placeholder: #6b7280;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillotp-bg: #171717;
        --chillotp-text: #fafafa;
        --chillotp-border: #404040;
        --chillotp-filled-bg: #1f1f1f;
        --chillotp-disabled-bg: #262626;
        --chillotp-placeholder: #6b7280;
      }
      .chillotp { --chillotp-w: 44px; display: inline-flex; align-items: center; gap: 8px; }
      .chillotp-sm { --chillotp-w: 36px; }
      .chillotp-lg { --chillotp-w: 56px; }
      .chillotp-gap { width: 10px; flex: none; }
      .chillotp-input { box-sizing: border-box; width: var(--chillotp-w); height: calc(var(--chillotp-w) * 1.15); padding: 0; margin: 0; text-align: center; font: inherit; font-size: calc(var(--chillotp-w) * .45); font-weight: 600; color: var(--chillotp-text); background: var(--chillotp-bg); border: 1px solid var(--chillotp-border); border-radius: 8px; outline: none; transition: border-color .15s ease, box-shadow .15s ease, background .15s ease; caret-color: var(--chillotp-focus); -moz-appearance: textfield; }
      .chillotp-input::placeholder { color: var(--chillotp-placeholder); font-weight: 400; }
      .chillotp-input:focus { border-color: var(--chillotp-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillotp-input:focus-visible { border-color: var(--chillotp-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillotp-filled { background: var(--chillotp-filled-bg); }
      .chillotp-error .chillotp-input { border-color: var(--chillotp-error); }
      .chillotp-error .chillotp-input:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.3); }
      .chillotp-input:disabled { background: var(--chillotp-disabled-bg); cursor: not-allowed; opacity: .6; }
      @media (prefers-reduced-motion: reduce) {
        .chillotp-input { transition: none; }
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

    const PATTERNS = {
        numeric: /[0-9]/,
        alpha: /[A-Za-z]/,
        alphanumeric: /[A-Za-z0-9]/,
        any: /[^\s]/
    };

    function createOtp(options) {
        options = options || {};
        injectCSS();
        const length = Math.max(1, Math.min(32, Math.floor(+options.length) || 6));
        const type = PATTERNS[options.type] ? options.type : 'numeric';
        const re = PATTERNS[type];
        const listeners = {};
        let disabled = !!options.disabled;
        let destroyed = false;
        let lastComplete = false;

        const fixChar = c => (options.uppercase ? c.toUpperCase() : c);
        const clean = str => Array.from(String(str == null ? '' : str)).filter(c => re.test(c)).map(fixChar);

        const root = document.createElement('div');
        root.className = 'chillotp chillotp-' + (options.size || 'md') + (options.className ? ' ' + options.className : '');
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', options.label || 'Verification code');

        const inputs = [];
        for (let i = 0; i < length; i++) {
            if (options.groupSize > 0 && i > 0 && i % options.groupSize === 0) {
                const g = document.createElement('span');
                g.className = 'chillotp-gap';
                g.setAttribute('aria-hidden', 'true');
                root.appendChild(g);
            }
            const inp = document.createElement('input');
            inp.className = 'chillotp-input';
            inp.type = options.mask ? 'password' : 'text';
            inp.maxLength = 1;
            inp.disabled = disabled;
            inp.autocomplete = i === 0 ? 'one-time-code' : 'off';
            inp.setAttribute('inputmode', type === 'numeric' ? 'numeric' : 'text');
            inp.setAttribute('aria-label', 'Character ' + (i + 1) + ' of ' + length);
            inp.setAttribute('autocapitalize', options.uppercase ? 'characters' : 'off');
            inp.spellcheck = false;
            if (options.placeholder) inp.placeholder = String(options.placeholder).slice(0, 1);
            inp.dataset.index = String(i);
            root.appendChild(inp);
            inputs.push(inp);
        }
        let hidden = null;
        if (options.name) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = options.name;
            root.appendChild(hidden);
        }

        const getValue = () => inputs.map(i => i.value).join('');
        const isComplete = () => inputs.every(i => i.value !== '');
        const focusAt = i => {
            const t = inputs[Math.max(0, Math.min(length - 1, i))];
            if (t && t.focus) { t.focus(); if (t.select) t.select(); }
        };
        const firstEmpty = () => { const k = inputs.findIndex(i => i.value === ''); return k < 0 ? length - 1 : k; };

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }

        function sync(silent) {
            inputs.forEach(i => i.classList.toggle('chillotp-filled', i.value !== ''));
            const v = getValue();
            if (hidden) hidden.value = v;
            if (silent) { lastComplete = isComplete(); return; }
            if (typeof options.onChange === 'function') options.onChange(v, api);
            emit('change', v);
            const complete = isComplete();
            if (complete && !lastComplete) {
                if (typeof options.onComplete === 'function') options.onComplete(v, api);
                emit('complete', v);
            }
            lastComplete = complete;
        }

        // Fill starting at index with characters; returns index after last filled char
        function fillFrom(start, chars) {
            let i = start;
            for (const c of chars) {
                if (i >= length) break;
                inputs[i].value = c;
                i++;
            }
            return i;
        }

        const idxOf = e => inputs.indexOf(e.target);

        const onInput = e => {
            const i = idxOf(e);
            if (i < 0 || disabled) return;
            const inp = inputs[i];
            const chars = clean(inp.value);
            if (chars.length === 0) { inp.value = ''; sync(); return; }
            inp.value = chars[0];
            let next = i + 1;
            if (chars.length > 1) next = fillFrom(i, chars);   // browser autofill / IME multi-char
            sync();
            if (next < length) focusAt(next); else focusAt(length - 1);
        };

        const onKeyDown = e => {
            const i = idxOf(e);
            if (i < 0 || disabled) return;
            const inp = inputs[i];
            switch (e.key) {
                case 'Backspace':
                    e.preventDefault();
                    if (inp.value !== '') { inp.value = ''; sync(); }
                    else if (i > 0) { inputs[i - 1].value = ''; sync(); focusAt(i - 1); }
                    return;
                case 'Delete':
                    e.preventDefault();
                    if (inp.value !== '') { inp.value = ''; sync(); }
                    return;
                case 'ArrowLeft': e.preventDefault(); focusAt(i - 1); return;
                case 'ArrowRight': e.preventDefault(); focusAt(i + 1); return;
                case 'Home': e.preventDefault(); focusAt(0); return;
                case 'End': e.preventDefault(); focusAt(length - 1); return;
                default:
            }
            // Overwrite when the box is already full (maxlength would block typing)
            if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && inp.value !== '') {
                e.preventDefault();
                const c = clean(e.key);
                if (c.length) { inp.value = c[0]; sync(); focusAt(i + 1); }
            }
        };

        const onPaste = e => {
            const i = idxOf(e);
            if (i < 0 || disabled) return;
            const data = e.clipboardData || (window.clipboardData);
            const text = data && data.getData ? data.getData('text') : '';
            e.preventDefault();
            const chars = clean(text);
            if (!chars.length) return;
            const start = chars.length >= length ? 0 : i;
            const next = fillFrom(start, chars);
            sync();
            focusAt(next);
        };

        const onFocus = e => { if (e.target && e.target.select) e.target.select(); };

        root.addEventListener('input', onInput);
        root.addEventListener('keydown', onKeyDown);
        root.addEventListener('paste', onPaste);
        root.addEventListener('focusin', onFocus);

        const api = {
            element: root,
            getValue,
            isComplete,
            setValue(str, silent) {
                if (destroyed) return api;
                const chars = clean(str).slice(0, length);
                inputs.forEach((inp, i) => { inp.value = chars[i] || ''; });
                sync(!!silent);
                return api;
            },
            clear() { inputs.forEach(i => { i.value = ''; }); sync(); focusAt(0); return api; },
            focus() { focusAt(firstEmpty()); return api; },
            setError(b) { root.classList.toggle('chillotp-error', !!b); inputs.forEach(i => i.setAttribute('aria-invalid', b ? 'true' : 'false')); return api; },
            setDisabled(b) { disabled = !!b; inputs.forEach(i => { i.disabled = disabled; }); return api; },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                root.removeEventListener('input', onInput);
                root.removeEventListener('keydown', onKeyDown);
                root.removeEventListener('paste', onPaste);
                root.removeEventListener('focusin', onFocus);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        if (options.value) {
            clean(options.value).slice(0, length).forEach((c, i) => { inputs[i].value = c; });
        }
        sync(true);
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        if (options.autoFocus) focusAt(firstEmpty());
        return api;
    }

    const ChillOtp = {
        version: VERSION,
        create: createOtp,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createOtp(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillOtp;
    } else {
        window.ChillOtp = ChillOtp;
    }

})(typeof window !== 'undefined' ? window : this);
