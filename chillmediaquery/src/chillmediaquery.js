/**
 * ChillMediaQuery - Zero-dependency Media Query Utility
 *
 * @example
 *   ChillMediaQuery.matches('md');                       // named breakpoint or any raw media query
 *   const stop = ChillMediaQuery.watch('(max-width: 600px)', isNarrow => {});   // stop()
 *   ChillMediaQuery.watchBreakpoint(bp => console.log(bp));   // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' – only on change
 *   ChillMediaQuery.getCurrentBreakpoint(); ChillMediaQuery.isMobile(); ChillMediaQuery.prefersReducedMotion();
 *
 * Safe everywhere: without matchMedia (SSR, very old browsers) matches() returns false (or options.fallback) and watch()
 * returns a no-op disposer; old Safari (< 14) MediaQueryList.addListener is used when addEventListener is missing.
 *
 * API: matches(q, {fallback}), watch(q, cb(matches, mql), {immediate = true}) -> stop fn, unwatch(stopFn | id), unwatchAll(),
 *      watchBreakpoint(cb, {immediate = true}) -> stop fn, getCurrentBreakpoint(), isBreakpoint(name) (>= name), isMobile(),
 *      isTablet(), isDesktop(), isDark(), prefersReducedMotion(), isTouch(), setBreakpoints(map) (override / add named queries),
 *      BREAKPOINTS (named queries), ORDER (breakpoint order)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const queries = new Map();

    const BREAKPOINTS = {
        xs: '(max-width: 575px)',
        sm: '(min-width: 576px)',
        md: '(min-width: 768px)',
        lg: '(min-width: 992px)',
        xl: '(min-width: 1200px)',
        xxl: '(min-width: 1400px)',
        mobile: '(max-width: 767px)',
        tablet: '(min-width: 768px) and (max-width: 1023px)',
        desktop: '(min-width: 1024px)',
        portrait: '(orientation: portrait)',
        landscape: '(orientation: landscape)',
        dark: '(prefers-color-scheme: dark)',
        light: '(prefers-color-scheme: light)',
        motion: '(prefers-reduced-motion: reduce)',
        reducedMotion: '(prefers-reduced-motion: reduce)',
        hover: '(hover: hover)',
        touch: '(hover: none) and (pointer: coarse)'
    };
    const ORDER = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

    function getQuery(query) {
        return Object.prototype.hasOwnProperty.call(BREAKPOINTS, query) ? BREAKPOINTS[query] : query;
    }

    function mql(query) {
        try {
            return typeof window.matchMedia === 'function' ? window.matchMedia(getQuery(query)) : null;
        } catch (e) { return null; }
    }

    function matches(query, options) {
        const m = mql(query);
        return m ? !!m.matches : !!(options && options.fallback);
    }

    function listen(m, handler) {
        if (typeof m.addEventListener === 'function') m.addEventListener('change', handler);
        else if (typeof m.addListener === 'function') m.addListener(handler); // Safari < 14
    }
    function unlisten(m, handler) {
        if (typeof m.removeEventListener === 'function') m.removeEventListener('change', handler);
        else if (typeof m.removeListener === 'function') m.removeListener(handler);
    }

    let counter = 0;
    /** @returns {Function} stop function (also accepted by unwatch()) */
    function watch(query, callback, options) {
        options = options || {};
        const m = mql(query);
        const id = 'chillmq-' + (++counter);
        const stop = function () { unwatch(id); };
        stop.id = id;
        if (!m) {
            if (options.immediate !== false) { try { callback(!!options.fallback, null); } catch (e) { /* ignore */ } }
            return stop;
        }
        const handler = function (e) {
            try { callback(e && e.matches !== undefined ? e.matches : m.matches, e); }
            catch (err) { if (typeof console !== 'undefined' && console.error) console.error('ChillMediaQuery callback error', err); }
        };
        listen(m, handler);
        queries.set(id, { mq: m, handler: handler });
        if (options.immediate !== false) { try { callback(m.matches, m); } catch (e) { /* ignore */ } }
        return stop;
    }

    function unwatch(idOrStop) {
        const id = typeof idOrStop === 'function' ? idOrStop.id : idOrStop;
        const data = queries.get(id);
        if (data) { unlisten(data.mq, data.handler); queries.delete(id); }
    }

    function unwatchAll() {
        Array.from(queries.keys()).forEach(unwatch);
    }

    function getCurrentBreakpoint() {
        for (let i = ORDER.length - 1; i > 0; i--) if (matches(ORDER[i])) return ORDER[i];
        return 'xs';
    }

    /** true when the viewport is at least as wide as breakpoint `name` (xs is always true). */
    function isBreakpoint(name) {
        const i = ORDER.indexOf(name);
        if (i < 0) return matches(name);
        return ORDER.indexOf(getCurrentBreakpoint()) >= i;
    }

    /** Calls back with the breakpoint name, only when it changes. */
    function watchBreakpoint(callback, options) {
        options = options || {};
        let current = null;
        const stops = ORDER.slice(1).map(function (bp) {
            return watch(bp, function () {
                const next = getCurrentBreakpoint();
                if (next !== current) { current = next; callback(next); }
            }, { immediate: false });
        });
        current = getCurrentBreakpoint();
        if (options.immediate !== false) callback(current);
        return function stopAll() { stops.forEach(function (s) { s(); }); };
    }

    /** Override or add named queries, e.g. setBreakpoints({ md: '(min-width: 800px)', wide: '(min-width: 1800px)' }). */
    function setBreakpoints(map) {
        Object.keys(map || {}).forEach(function (k) { if (typeof map[k] === 'string') BREAKPOINTS[k] = map[k]; });
    }

    function isMobile() { return matches('mobile'); }
    function isTablet() { return matches('tablet'); }
    function isDesktop() { return matches('desktop'); }
    function isDark() { return matches('dark'); }
    function isTouch() { return matches('touch'); }
    function prefersReducedMotion() { return matches('motion'); }

    const ChillMediaQuery = {
        version: VERSION,
        BREAKPOINTS: BREAKPOINTS,
        ORDER: ORDER,
        matches: matches,
        watch: watch,
        unwatch: unwatch,
        unwatchAll: unwatchAll,
        watchBreakpoint: watchBreakpoint,
        setBreakpoints: setBreakpoints,
        getCurrentBreakpoint: getCurrentBreakpoint,
        isBreakpoint: isBreakpoint,
        isMobile: isMobile,
        isTablet: isTablet,
        isDesktop: isDesktop,
        isDark: isDark,
        isTouch: isTouch,
        prefersReducedMotion: prefersReducedMotion
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillMediaQuery; }
    else { window.ChillMediaQuery = ChillMediaQuery; }
})(typeof window !== 'undefined' ? window : this);
