/**
 * ChillClickOutside - Zero-dependency Click Outside Detection Utility
 *
 * @example
 *   const off = ChillClickOutside.register(menuEl, e => closeMenu(), { ignore: ['#menu-button'], escape: true });
 *   off();                                   // unregister (or ChillClickOutside.unregister(off.id))
 *   ChillClickOutside.register([a, '#b'], cb, { events: ['click'] });
 *
 * Options:
 *   events   string[]  ['pointerdown']   DOM events that count as "a click". Default is pointerdown (mousedown + touchstart
 *                      where PointerEvent is missing) – ONE event per tap, so touch devices no longer fire twice and
 *                      elements that remove themselves on click are still classified correctly.
 *   ignore   Element | selector | array   extra elements treated as "inside" (e.g. the toggle button)
 *   escape   boolean   false   also call the callback (with the keydown event) when Escape is pressed
 *   enabled  boolean   true    handle events (toggle with handle.setEnabled(false))
 *   once     boolean   false   unregister after the first outside event
 *   capture  boolean   true    listen in the capture phase (works even when children stopPropagation)
 *
 * Elements are resolved lazily on every event (selectors keep working after re-render). Shadow DOM is supported through
 * event.composedPath(). Targets that are no longer in the document (removed by the click itself) are NOT treated as outside.
 * The returned function has: .id, .setEnabled(bool). Document listeners are attached on the first registration and removed
 * with the last. Callback errors never break other registrations. Safe to import / call on the server (no-op).
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const listeners = new Map();   // id -> record
    const attached = new Map();    // event name -> handler (so we can remove exactly what we added)
    let escAttached = false;

    function docOk() { return typeof document !== 'undefined' && !!document.addEventListener; }

    function defaultEvents() {
        return typeof window.PointerEvent !== 'undefined' ? ['pointerdown'] : ['mousedown', 'touchstart'];
    }

    function resolveList(spec) {
        const arr = Array.isArray(spec) ? spec : (spec == null ? [] : [spec]);
        const out = [];
        arr.forEach(function (x) {
            if (typeof x === 'string') {
                try { Array.prototype.forEach.call(document.querySelectorAll(x), function (n) { out.push(n); }); } catch (e) { /* bad selector */ }
            } else if (x && x.nodeType) out.push(x);
        });
        return out;
    }

    function inside(e, rec) {
        const path = typeof e.composedPath === 'function' ? e.composedPath() : null;
        const els = resolveList(rec.elements).concat(resolveList(rec.options.ignore));
        for (let i = 0; i < els.length; i++) {
            const el = els[i];
            if (path && path.indexOf(el) > -1) return true;
            if (el.contains && e.target && el.contains(e.target)) return true;
        }
        return false;
    }

    function run(rec, e) {
        if (rec.options.once) unregister(rec.id);
        try { rec.callback(e); }
        catch (err) { if (typeof console !== 'undefined' && console.error) console.error('ChillClickOutside callback error', err); }
    }

    function makeHandler(eventName) {
        return function handler(e) {
            const t = e.target;
            // target removed from the DOM by an earlier handler: we cannot tell where it was, so do not close anything
            if (t && t.nodeType === 1 && t.isConnected === false) return;
            Array.from(listeners.values()).forEach(function (rec) {
                if (!rec.enabled || rec.events.indexOf(eventName) === -1) return;
                if (!inside(e, rec)) run(rec, e);
            });
        };
    }

    function onKeydown(e) {
        if (e.key !== 'Escape') return;
        Array.from(listeners.values()).forEach(function (rec) { if (rec.enabled && rec.options.escape) run(rec, e); });
    }

    function sync() {
        if (!docOk()) return;
        const needed = new Set();
        let needEsc = false;
        listeners.forEach(function (rec) {
            rec.events.forEach(function (ev) { needed.add(ev); });
            if (rec.options.escape) needEsc = true;
        });
        attached.forEach(function (h, ev) {
            if (!needed.has(ev)) { document.removeEventListener(ev, h, true); attached.delete(ev); }
        });
        needed.forEach(function (ev) {
            if (!attached.has(ev)) { const h = makeHandler(ev); document.addEventListener(ev, h, true); attached.set(ev, h); }
        });
        if (needEsc && !escAttached) { document.addEventListener('keydown', onKeydown, true); escAttached = true; }
        if (!needEsc && escAttached) { document.removeEventListener('keydown', onKeydown, true); escAttached = false; }
    }

    let counter = 0;
    function register(elements, callback, options) {
        options = options || {};
        if (!docOk()) { const noop = function () {}; noop.id = null; noop.setEnabled = noop; return noop; }
        if (typeof callback !== 'function') throw new TypeError('ChillClickOutside.register: callback must be a function');
        const id = 'chillco-' + (++counter);
        const events = Array.isArray(options.events) && options.events.length ? options.events.slice() : defaultEvents();
        const rec = {
            id: id, elements: Array.isArray(elements) ? elements : [elements], callback: callback, options: options,
            events: events, enabled: options.enabled !== false
        };
        listeners.set(id, rec);
        sync();
        const off = function () { unregister(id); };
        off.id = id;
        off.setEnabled = function (v) { rec.enabled = !!v; };
        return off;
    }

    function unregister(id) {
        if (listeners.delete(id)) sync();
    }

    function unregisterAll() {
        listeners.clear();
        sync();
    }

    const ChillClickOutside = {
        version: VERSION,
        register: register,
        unregister: unregister,
        unregisterAll: unregisterAll,
        count: function () { return listeners.size; }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillClickOutside; }
    else { window.ChillClickOutside = ChillClickOutside; }
})(typeof window !== 'undefined' ? window : this);
