/**
 * ChillToolkit - Zero-dependency helper functions
 *
 * @example
 *   const { debounce, formatBytes, slugify } = ChillToolkit;
 *   input.addEventListener('input', debounce(search, 250));
 *   formatBytes(1536);          // "1.5 KB"
 *   slugify('Héllo Wörld!');    // "hello-world"
 *
 * Everything is pure / lazy: nothing touches window or document at load time.
 *
 * API: debounce(fn, wait, {leading, trailing}) (fn.cancel/flush), throttle(fn, wait, {leading, trailing}),
 *      rafThrottle(fn), uid(prefix), clamp(n, min, max), formatBytes(bytes, {decimals, binary, locale}),
 *      formatNumber(n, {locale, ...Intl.NumberFormatOptions, compact}), slugify(str, {separator, lower}),
 *      escapeHtml(str), unescapeHtml(str), deepMerge(target, ...sources), deepClone(v), sleep(ms),
 *      once(fn), isBrowser(), isPlainObject(v), noop()
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';

    function noop() {}

    function isBrowser() {
        return typeof window !== 'undefined' && typeof document !== 'undefined' && !!window.document;
    }

    function isPlainObject(v) {
        if (v === null || typeof v !== 'object') return false;
        const proto = Object.getPrototypeOf(v);
        return proto === null || Object.getPrototypeOf(proto) === null; // works across realms (iframes)
    }

    /**
     * Debounce. Returned function has .cancel() and .flush().
     * @param {Function} fn
     * @param {number} [wait=0]
     * @param {{leading?:boolean, trailing?:boolean}} [opts]  trailing defaults to true
     */
    function debounce(fn, wait, opts) {
        wait = Math.max(0, Number(wait) || 0);
        const leading = !!(opts && opts.leading);
        const trailing = !(opts && opts.trailing === false);
        let timer = null, lastArgs = null, lastThis = null, result;

        function invoke() {
            const args = lastArgs, ctx = lastThis;
            lastArgs = lastThis = null;
            result = fn.apply(ctx, args);
            return result;
        }
        function debounced() {
            lastArgs = arguments; lastThis = this;
            const callNow = leading && timer === null;
            if (timer !== null) clearTimeout(timer);
            timer = setTimeout(function () {
                timer = null;
                if (trailing && lastArgs) invoke();
                else lastArgs = lastThis = null;
            }, wait);
            if (callNow) invoke();
            return result;
        }
        debounced.cancel = function () {
            if (timer !== null) clearTimeout(timer);
            timer = null; lastArgs = lastThis = null;
        };
        debounced.flush = function () {
            if (timer !== null) {
                clearTimeout(timer); timer = null;
                if (lastArgs) return invoke();
            }
            return result;
        };
        debounced.pending = function () { return timer !== null; };
        return debounced;
    }

    /**
     * Throttle. Returned function has .cancel().
     * @param {Function} fn
     * @param {number} [wait=0]
     * @param {{leading?:boolean, trailing?:boolean}} [opts]  both default to true
     */
    function throttle(fn, wait, opts) {
        wait = Math.max(0, Number(wait) || 0);
        const leading = !(opts && opts.leading === false);
        const trailing = !(opts && opts.trailing === false);
        let timer = null, lastCall = 0, lastArgs = null, lastThis = null, result;

        function trailingEdge() {
            timer = null;
            lastCall = leading ? Date.now() : 0;
            if (trailing && lastArgs) {
                const a = lastArgs, c = lastThis;
                lastArgs = lastThis = null;
                result = fn.apply(c, a);
            } else lastArgs = lastThis = null;
        }
        function throttled() {
            const now = Date.now();
            if (!lastCall && !leading) lastCall = now;
            const remaining = wait - (now - lastCall);
            lastArgs = arguments; lastThis = this;
            if (remaining <= 0 || remaining > wait) {
                if (timer !== null) { clearTimeout(timer); timer = null; }
                lastCall = now;
                const a = lastArgs, c = lastThis;
                lastArgs = lastThis = null;
                result = fn.apply(c, a);
            } else if (timer === null && trailing) {
                timer = setTimeout(trailingEdge, remaining);
            }
            return result;
        }
        throttled.cancel = function () {
            if (timer !== null) clearTimeout(timer);
            timer = null; lastCall = 0; lastArgs = lastThis = null;
        };
        return throttled;
    }

    /** Coalesce calls into one per animation frame (last arguments win). Falls back to setTimeout(16). */
    function rafThrottle(fn) {
        let id = null, lastArgs = null, lastThis = null;
        const hasRaf = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function';
        const schedule = hasRaf ? function (cb) { return window.requestAnimationFrame(cb); } : function (cb) { return setTimeout(cb, 16); };
        const cancelFn = hasRaf ? function (i) { window.cancelAnimationFrame(i); } : clearTimeout;
        function run() {
            id = null;
            const a = lastArgs, c = lastThis;
            lastArgs = lastThis = null;
            fn.apply(c, a);
        }
        function throttled() {
            lastArgs = arguments; lastThis = this;
            if (id === null) id = schedule(run);
        }
        throttled.cancel = function () {
            if (id !== null) cancelFn(id);
            id = null; lastArgs = lastThis = null;
        };
        return throttled;
    }

    let uidCounter = 0;
    /** Unique id: prefix + base36 time + random + counter. Not cryptographically secure. */
    function uid(prefix) {
        uidCounter = (uidCounter + 1) % 1679616;
        let rnd = '';
        try {
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                const a = new Uint32Array(1); crypto.getRandomValues(a); rnd = a[0].toString(36);
            }
        } catch (e) { /* ignore */ }
        if (!rnd) rnd = Math.floor(Math.random() * 0xffffffff).toString(36);
        return (prefix == null ? 'chill-' : String(prefix)) + Date.now().toString(36) + rnd + uidCounter.toString(36);
    }

    function clamp(n, min, max) {
        n = Number(n);
        if (min > max) { const t = min; min = max; max = t; }
        if (Number.isNaN(n)) return min;
        return Math.min(Math.max(n, min), max);
    }

    /**
     * Human readable byte size.
     * @param {number} bytes
     * @param {{decimals?:number, binary?:boolean, locale?:string}} [opts] binary=true uses 1024 (KB), false uses 1000 (kB) – default 1024 with KB/MB labels
     */
    function formatBytes(bytes, opts) {
        opts = opts || {};
        const decimals = opts.decimals == null ? 1 : Math.max(0, opts.decimals);
        const base = opts.binary === false ? 1000 : 1024;
        const units = opts.binary === false ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        bytes = Number(bytes);
        if (!isFinite(bytes)) return '0 B';
        const sign = bytes < 0 ? '-' : '';
        bytes = Math.abs(bytes);
        if (bytes < base) return sign + bytes + ' B';
        const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(base)));
        const value = bytes / Math.pow(base, i);
        let text;
        try {
            text = new Intl.NumberFormat(opts.locale, { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(value);
        } catch (e) { text = String(parseFloat(value.toFixed(decimals))); }
        return sign + text + ' ' + units[i];
    }

    /**
     * Locale-aware number formatting via Intl.NumberFormat.
     * @param {number} n
     * @param {object} [opts] {locale, compact:true, ...any Intl.NumberFormat option}
     */
    function formatNumber(n, opts) {
        opts = opts || {};
        const locale = opts.locale;
        const o = {};
        Object.keys(opts).forEach(function (k) { if (k !== 'locale' && k !== 'compact') o[k] = opts[k]; });
        if (opts.compact) o.notation = 'compact';
        try { return new Intl.NumberFormat(locale, o).format(Number(n)); }
        catch (e) { return String(n); }
    }

    /** URL-safe slug. Strips diacritics. */
    function slugify(str, opts) {
        opts = opts || {};
        const sep = opts.separator == null ? '-' : String(opts.separator);
        let s = String(str == null ? '' : str);
        if (s.normalize) s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
        if (opts.lower !== false) s = s.toLowerCase();
        s = s.replace(/&/g, ' and ').replace(/[^a-zA-Z0-9]+/g, sep);
        if (sep) {
            const esc = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            s = s.replace(new RegExp('^(?:' + esc + ')+|(?:' + esc + ')+$', 'g'), '');
        }
        return s;
    }

    const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"'`]/g, function (c) { return ESC_MAP[c]; });
    }
    function unescapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'").replace(/&#96;/g, '`').replace(/&amp;/g, '&');
    }

    function deepClone(v) {
        if (Array.isArray(v)) return v.map(deepClone);
        if (v instanceof Date) return new Date(v.getTime());
        if (isPlainObject(v)) {
            const out = {};
            Object.keys(v).forEach(function (k) { if (k !== '__proto__') out[k] = deepClone(v[k]); });
            return out;
        }
        return v;
    }

    /**
     * Recursive merge of plain objects into a NEW object (inputs are not mutated).
     * Arrays and non-plain values are replaced, not merged. Prototype-pollution safe.
     */
    function deepMerge() {
        const out = {};
        for (let i = 0; i < arguments.length; i++) {
            const src = arguments[i];
            if (!isPlainObject(src)) continue;
            Object.keys(src).forEach(function (key) {
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
                const val = src[key];
                if (isPlainObject(val)) out[key] = deepMerge(isPlainObject(out[key]) ? out[key] : {}, val);
                else out[key] = deepClone(val);
            });
        }
        return out;
    }

    function sleep(ms, signal) {
        return new Promise(function (resolve, reject) {
            if (signal && signal.aborted) { reject(abortError()); return; }
            const t = setTimeout(function () {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve();
            }, Math.max(0, Number(ms) || 0));
            function onAbort() { clearTimeout(t); reject(abortError()); }
            if (signal) signal.addEventListener('abort', onAbort, { once: true });
        });
    }
    function abortError() {
        const e = new Error('Aborted'); e.name = 'AbortError'; return e;
    }

    /** Call fn only the first time; later calls return the first result. */
    function once(fn) {
        let called = false, result;
        return function () {
            if (!called) { called = true; result = fn.apply(this, arguments); fn = null; }
            return result;
        };
    }

    const ChillToolkit = {
        version: VERSION,
        noop, isBrowser, isPlainObject,
        debounce, throttle, rafThrottle, uid, clamp,
        formatBytes, formatNumber, slugify, escapeHtml, unescapeHtml,
        deepMerge, deepClone, sleep, once
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillToolkit; }
    else { window.ChillToolkit = ChillToolkit; }
})(typeof window !== 'undefined' ? window : this);
