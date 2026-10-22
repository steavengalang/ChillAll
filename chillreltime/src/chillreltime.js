/**
 * ChillRelTime - Relative time ("3 minutes ago") with auto-updating <time> elements
 *
 * @example
 *   <time datetime="2024-05-01T10:00:00Z"></time>
 *   <span data-chill-reltime="2024-05-01T10:00:00Z"></span>      (ISO string or epoch milliseconds)
 *   ChillRelTime.init();                                         // enhance every  time[datetime], [data-chill-reltime]
 *   ChillRelTime.format(Date.now() - 3 * 60000);                 // "3 minutes ago"
 *   ChillRelTime.format(Date.now() + 86400000, { locale: 'id' }); // "besok"
 *   const el = ChillRelTime.create(date, { locale: 'fr' });      // <time> element, auto-updating when appended after init()
 *
 * Uses Intl.RelativeTimeFormat (numeric: 'auto' => "yesterday", "tomorrow", "now"). The absolute date/time is exposed in
 * the `title` tooltip and the `datetime` attribute is always set. Elements update on a shared adaptive timer (every second
 * while something is under a minute old, then every 30s / minute), the timer pauses while the tab is hidden and the
 * display refreshes when the tab becomes visible again.
 *
 * Options (format / init / create):
 *   locale       string      element lang -> <html lang> -> browser default
 *   numeric      'auto'|'always'   'auto'
 *   style        'long'|'short'|'narrow'   'long'
 *   now          number|Date|() => number  current time (for tests / server clock offset)
 *   nowThreshold number (s)  5     |diff| below this renders as "now" (numeric:'auto' only)
 *   maxRelativeDays number   0     0 = always relative; otherwise older/further dates render as absolute dates
 *   tooltip      boolean     true  (init/create) set title to the absolute time
 *   absolute     object      { dateStyle: 'medium', timeStyle: 'short' }  Intl.DateTimeFormat options for tooltip / fallback
 *   update       boolean     true  (init/create) auto-update
 *   onUpdate(el, text)  (init)
 *
 * API: format(date, opts), absolute(date, opts), parse(value), init(selectorOrEl, opts) -> { refresh(), update(), destroy() },
 *      create(date, opts), diff(date, now) -> { value, unit }.  Invalid dates format as ''.
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';

    const UNITS = [
        ['year', 365.25 * 86400],
        ['month', 30.4375 * 86400],
        ['week', 7 * 86400],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1]
    ];

    function parse(value) {
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') { const d = new Date(value); return isNaN(d.getTime()) ? null : d; }
        const s = String(value).trim();
        if (/^-?\d{9,}$/.test(s)) { const d = new Date(Number(s)); return isNaN(d.getTime()) ? null : d; }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function nowMs(o) {
        const n = o && o.now;
        if (typeof n === 'function') return Number(n());
        if (n instanceof Date) return n.getTime();
        if (typeof n === 'number') return n;
        return Date.now();
    }

    function pageLocale(el) {
        let node = el;
        while (node && node.getAttribute) {
            const l = node.getAttribute('lang');
            if (l) return l;
            node = node.parentElement;
        }
        try {
            if (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) return document.documentElement.lang;
        } catch (e) { /* ignore */ }
        return undefined;
    }

    /** Choose unit and signed integer value (negative = past). */
    function diff(date, now) {
        const d = parse(date);
        if (!d) return null;
        const secs = (d.getTime() - (now == null ? Date.now() : now)) / 1000;
        const abs = Math.abs(secs);
        for (let i = 0; i < UNITS.length; i++) {
            if (abs >= UNITS[i][1] || i === UNITS.length - 1) {
                const raw = secs / UNITS[i][1];
                const value = raw < 0 ? Math.ceil(raw) : Math.floor(raw);
                return { value: value === 0 ? 0 : value, unit: UNITS[i][0], seconds: secs };
            }
        }
        return null;
    }

    function englishFallback(value, unit, numeric) {
        if (numeric !== 'always') {
            if (unit === 'second' && value === 0) return 'now';
            if (unit === 'day' && value === 1) return 'tomorrow';
            if (unit === 'day' && value === -1) return 'yesterday';
        }
        const n = Math.abs(value);
        const label = unit + (n === 1 ? '' : 's');
        return value < 0 ? n + ' ' + label + ' ago' : 'in ' + n + ' ' + label;
    }

    function absolute(date, opts) {
        const d = parse(date);
        if (!d) return '';
        opts = opts || {};
        const fmt = opts.absolute || { dateStyle: 'medium', timeStyle: 'short' };
        try { return new Intl.DateTimeFormat(opts.locale, fmt).format(d); }
        catch (e) { return d.toString(); }
    }

    function format(date, opts) {
        opts = opts || {};
        const d = parse(date);
        if (!d) return '';
        const now = nowMs(opts);
        const df = diff(d, now);
        const numeric = opts.numeric === 'always' ? 'always' : 'auto';
        if (opts.maxRelativeDays > 0 && Math.abs(d.getTime() - now) > opts.maxRelativeDays * 86400000) return absolute(d, opts);
        const threshold = opts.nowThreshold != null ? Number(opts.nowThreshold) : 5;
        let value = df.value, unit = df.unit;
        if (numeric === 'auto' && Math.abs(df.seconds) < threshold) { value = 0; unit = 'second'; }
        // never render "0 minutes ago": fall back to seconds resolution
        if (value === 0 && unit !== 'second') { unit = 'second'; }
        try {
            if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
                return new Intl.RelativeTimeFormat(opts.locale, { numeric: numeric, style: opts.style || 'long' }).format(value, unit);
            }
        } catch (e) { /* fall through */ }
        return englishFallback(value, unit, numeric);
    }

    // ---------- auto-updating elements ----------
    const registry = new Set();    // instances
    let timer = null;
    let visBound = false;

    function onVisibility() {
        if (typeof document !== 'undefined' && !document.hidden) { registry.forEach(function (i) { i.update(); }); schedule(); }
        else clearTimer();
    }
    function clearTimer() { if (timer !== null) { clearTimeout(timer); timer = null; } }

    function nextDelay() {
        let min = Infinity;
        registry.forEach(function (inst) {
            if (!inst._auto) return;
            inst._records.forEach(function (rec) {
                const age = Math.abs((rec.date.getTime() - nowMs(inst.o)) / 1000);
                const d = age < 60 ? 1000 : (age < 3600 ? 30000 : 60000);
                if (d < min) min = d;
            });
        });
        return min === Infinity ? null : min;
    }

    function schedule() {
        clearTimer();
        if (typeof document !== 'undefined' && document.hidden) return;
        const d = nextDelay();
        if (d === null) return;
        timer = setTimeout(function () {
            timer = null;
            registry.forEach(function (i) { i.update(); });
            schedule();
        }, d);
    }

    function register(inst) {
        registry.add(inst);
        if (!visBound && typeof document !== 'undefined') { document.addEventListener('visibilitychange', onVisibility); visBound = true; }
        schedule();
    }
    function unregister(inst) {
        registry.delete(inst);
        if (!registry.size) {
            clearTimer();
            if (visBound && typeof document !== 'undefined') { document.removeEventListener('visibilitychange', onVisibility); visBound = false; }
        } else schedule();
    }

    class ChillRelTimeInstance {
        constructor(selector, options) {
            options = options || {};
            this.selector = selector || 'time[datetime], [data-chill-reltime]';
            this.o = options;
            this._auto = options.update !== false;
            this._records = new Map();
            this._destroyed = false;
            this.refresh();
            register(this);
        }

        _targets() {
            const s = this.selector;
            if (typeof s === 'string') return Array.prototype.slice.call(document.querySelectorAll(s));
            if (s && s.nodeType) return [s];
            return Array.prototype.slice.call(s || []);
        }

        refresh() {
            if (this._destroyed) return this;
            const self = this;
            this._targets().forEach(function (el) {
                if (self._records.has(el)) return;
                const raw = el.getAttribute('data-chill-reltime') || el.getAttribute('datetime');
                const date = parse(raw);
                if (!date) return;
                self._records.set(el, {
                    date: date, text: el.textContent,
                    title: el.getAttribute('title'), datetime: el.getAttribute('datetime')
                });
                if (el.tagName === 'TIME' && !el.hasAttribute('datetime')) el.setAttribute('datetime', date.toISOString());
                self._render(el, self._records.get(el));
            });
            if (this._auto && registry.has(this)) schedule();
            return this;
        }

        _render(el, rec) {
            const opts = Object.assign({}, this.o, { locale: this.o.locale || pageLocale(el) });
            rec.seen = rec.seen || !!el.isConnected;
            const text = format(rec.date, opts);
            if (el.textContent !== text) el.textContent = text;
            if (this.o.tooltip !== false) el.setAttribute('title', absolute(rec.date, opts));
            if (this.o.onUpdate) { try { this.o.onUpdate(el, text); } catch (e) { /* ignore */ } }
        }

        /** Re-render every element now. */
        update() {
            const self = this;
            this._records.forEach(function (rec, el) {
                // drop elements that were removed from the document (never drop ones not yet appended)
                if (!el.isConnected && rec.seen) { self._records.delete(el); return; }
                self._render(el, rec);
            });
            return this;
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._records.forEach(function (rec, el) {
                el.textContent = rec.text;
                if (rec.title === null) el.removeAttribute('title'); else el.setAttribute('title', rec.title);
                if (rec.datetime === null) el.removeAttribute('datetime'); else el.setAttribute('datetime', rec.datetime);
            });
            this._records.clear();
            unregister(this);
        }
    }

    // a shared instance used by create() so the created <time> elements keep updating
    function create(date, options) {
        options = options || {};
        const d = parse(date);
        const el = document.createElement('time');
        if (!d) { el.textContent = ''; return el; }
        el.setAttribute('datetime', d.toISOString());
        el.textContent = format(d, options);
        if (options.tooltip !== false) el.setAttribute('title', absolute(d, options));
        if (options.update !== false) {
            // auto-update by enhancing this single element once it is in the document
            const inst = new ChillRelTimeInstance(el, options);
            const destroy = inst.destroy.bind(inst);
            el.chillRelTime = { update: inst.update.bind(inst), destroy: destroy };
        }
        return el;
    }

    const ChillRelTime = {
        version: VERSION,
        format: format,
        absolute: absolute,
        parse: parse,
        diff: function (date, now) { return diff(date, now == null ? Date.now() : (now instanceof Date ? now.getTime() : now)); },
        init: function (selector, options) { return new ChillRelTimeInstance(selector, options); },
        create: create,
        injectCSS: function () { /* no styles */ }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillRelTime; }
    else { window.ChillRelTime = ChillRelTime; }
})(typeof window !== 'undefined' ? window : this);
