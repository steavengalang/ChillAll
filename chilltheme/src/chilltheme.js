/**
 * ChillTheme - Zero-dependency Theme Management Utility
 *
 * Contract (every ChillLib component relies on it): the RESOLVED theme ('light' | 'dark') is written to
 * <html data-theme="..."> and as a class (`light` / `dark`) on <html>.
 *
 * @example
 *   ChillTheme.setTheme('dark');                 // 'light' | 'dark' | 'system'  (returns false for invalid values)
 *   ChillTheme.toggle();
 *   const off = ChillTheme.onChange((resolved, setting) => console.log(resolved, setting));
 *   ChillTheme.init({ storageKey: 'my-app-theme', defaultTheme: 'system', onChange: fn });
 *
 *   // avoid the flash of the wrong theme: put this in <head> BEFORE your CSS
 *   //   <script>(function(){...})()</script>   <- ChillTheme.noFlashScript({ tag: true })
 *
 * Safe everywhere: storage and matchMedia are guarded (private mode, old Safari `addListener`, SSR). Auto-initialises
 * once on load (idempotent - calling init() again re-binds without duplicating listeners). Cross-tab sync via the
 * `storage` event.
 *
 * init(options): storageKey 'chill-theme', defaultTheme 'system', onChange fn(resolved, setting)
 * API: setTheme(theme, {persist = true}) -> boolean, getTheme(), getResolvedTheme(), isDark(), toggle(), cycle(),
 *      subscribe(fn) / onChange(fn) -> unsubscribe, noFlashScript({storageKey, defaultTheme, tag}) -> string, destroy(), THEMES.
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const DEFAULT_KEY = 'chill-theme';
    const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };
    const VALID = ['light', 'dark', 'system'];
    const AUTO_FLAG = '__chilltheme_auto_inited__';

    let storageKey = DEFAULT_KEY;
    let defaultTheme = THEMES.SYSTEM;
    let currentTheme = THEMES.SYSTEM;
    let resolvedTheme = THEMES.LIGHT;
    let listeners = [];
    let initOnChange = null;
    let mq = null, mqHandler = null, storageHandler = null;
    let bound = false;

    function hasDocument() { return typeof document !== 'undefined' && !!document.documentElement; }

    function readStorage(key) {
        try { return window.localStorage ? window.localStorage.getItem(key) : null; } catch (e) { return null; }
    }
    function writeStorage(key, value) {
        try { if (window.localStorage) window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    }

    function getMQ() {
        try {
            return typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        } catch (e) { return null; }
    }

    function getSystemTheme() {
        const m = getMQ();
        return m && m.matches ? THEMES.DARK : THEMES.LIGHT;
    }

    function isValid(theme) { return VALID.indexOf(theme) > -1; }

    function applyDom() {
        if (!hasDocument()) return;
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
        root.setAttribute('data-theme', resolvedTheme);
    }

    function notify() {
        listeners.slice().forEach(function (fn) {
            try { fn(resolvedTheme, currentTheme); } catch (e) { if (typeof console !== 'undefined' && console.error) console.error('ChillTheme listener error', e); }
        });
    }

    function update(silent) {
        const prevResolved = resolvedTheme;
        resolvedTheme = currentTheme === THEMES.SYSTEM ? getSystemTheme() : currentTheme;
        applyDom();
        if (!silent) notify();
        return prevResolved !== resolvedTheme;
    }

    /** @returns {boolean} true when applied, false when `theme` is not 'light' | 'dark' | 'system'. */
    function setTheme(theme, options) {
        if (!isValid(theme)) {
            if (typeof console !== 'undefined' && console.warn) console.warn('ChillTheme.setTheme: invalid theme "' + theme + '" (use light, dark or system)');
            return false;
        }
        currentTheme = theme;
        if (!options || options.persist !== false) writeStorage(storageKey, theme);
        update(false);
        return true;
    }

    function getTheme() { return currentTheme; }
    function getResolvedTheme() { return resolvedTheme; }
    function isDark() { return resolvedTheme === THEMES.DARK; }

    function toggle() {
        setTheme(resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
        return resolvedTheme;
    }

    /** light -> dark -> system -> light ... */
    function cycle() {
        const next = currentTheme === THEMES.LIGHT ? THEMES.DARK : (currentTheme === THEMES.DARK ? THEMES.SYSTEM : THEMES.LIGHT);
        setTheme(next);
        return next;
    }

    function subscribe(fn) {
        if (typeof fn !== 'function') return function () {};
        listeners.push(fn);
        return function unsubscribe() { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
    }

    function unbind() {
        if (mq && mqHandler) {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', mqHandler);
                else if (mq.removeListener) mq.removeListener(mqHandler);
            } catch (e) { /* ignore */ }
        }
        if (storageHandler && typeof window.removeEventListener === 'function') {
            try { window.removeEventListener('storage', storageHandler); } catch (e) { /* ignore */ }
        }
        mq = mqHandler = storageHandler = null;
        bound = false;
    }

    function bind() {
        unbind(); // idempotent
        mq = getMQ();
        if (mq) {
            mqHandler = function () { if (currentTheme === THEMES.SYSTEM) update(false); };
            try {
                if (mq.addEventListener) mq.addEventListener('change', mqHandler);
                else if (mq.addListener) mq.addListener(mqHandler); // Safari < 14
            } catch (e) { mqHandler = null; }
        }
        if (typeof window.addEventListener === 'function') {
            storageHandler = function (e) {
                if (e.key !== storageKey && e.key !== null) return;
                const v = e.key === null ? null : e.newValue;
                const next = isValid(v) ? v : defaultTheme;
                if (next !== currentTheme) { currentTheme = next; update(false); }
            };
            try { window.addEventListener('storage', storageHandler); } catch (e) { storageHandler = null; }
        }
        bound = true;
    }

    /**
     * (Re)initialise: reads the stored preference, applies the theme and binds system / cross-tab listeners.
     * Safe to call repeatedly.
     */
    function init(options) {
        options = options || {};
        if (options.storageKey) storageKey = String(options.storageKey);
        if (options.defaultTheme && isValid(options.defaultTheme)) defaultTheme = options.defaultTheme;
        if (initOnChange) { const i = listeners.indexOf(initOnChange); if (i > -1) listeners.splice(i, 1); initOnChange = null; }
        if (typeof options.onChange === 'function') { initOnChange = options.onChange; listeners.push(initOnChange); }
        const stored = readStorage(storageKey);
        currentTheme = isValid(stored) ? stored : defaultTheme;
        update(false);
        bind();
        return ChillTheme;
    }

    function destroy() {
        unbind();
        listeners = [];
        initOnChange = null;
    }

    /**
     * Returns the source of a tiny synchronous script that sets data-theme + class on <html> before first paint.
     * Put it in <head> before stylesheets. Pass { tag: true } to get it wrapped in <script> ... </script>.
     */
    function noFlashScript(options) {
        options = options || {};
        const key = JSON.stringify(String(options.storageKey || storageKey)).replace(/</g, '\\u003c');
        const dflt = JSON.stringify(isValid(options.defaultTheme) ? options.defaultTheme : defaultTheme);
        const code = '(function(){try{var d=document.documentElement,s=null,t;' +
            'try{s=localStorage.getItem(' + key + ');}catch(e){}' +
            'if(s!=="light"&&s!=="dark"&&s!=="system")s=' + dflt + ';' +
            't=s==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;' +
            'd.classList.remove("light","dark");d.classList.add(t);d.setAttribute("data-theme",t);}catch(e){}})();';
        return options.tag ? '<script>' + code + '</script>' : code;
    }

    // Auto-init (once per window, never throws). Skipped on the server.
    function autoInit() {
        try {
            if (!hasDocument() || window[AUTO_FLAG]) return;
            window[AUTO_FLAG] = true;
            init();
        } catch (e) { /* never break page load */ }
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
        else autoInit();
    }

    const ChillTheme = {
        version: VERSION,
        THEMES: THEMES,
        setTheme: setTheme,
        getTheme: getTheme,
        getResolvedTheme: getResolvedTheme,
        isDark: isDark,
        toggle: toggle,
        cycle: cycle,
        subscribe: subscribe,
        onChange: subscribe,
        noFlashScript: noFlashScript,
        init: init,
        destroy: destroy
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillTheme; }
    else { window.ChillTheme = ChillTheme; }
})(typeof window !== 'undefined' ? window : this);
