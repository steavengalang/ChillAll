/**
 * ChillEvents - Tiny event emitter / pub-sub bus
 *
 * @example
 *   const bus = ChillEvents.create();
 *   const off = bus.on('user:login', user => console.log(user));
 *   bus.on('user:*', (data, event) => {});     // wildcard (namespace segments split by ':' or '.')
 *   bus.on('*', (data, event) => {});          // everything
 *   bus.once('ready', init);
 *   bus.emit('user:login', { id: 1 });
 *   await bus.emitAsync('save', doc);          // awaits every handler (in order), collects results
 *   off();                                     // unsubscribe (or bus.off('user:login', fn))
 *   bus.destroy();
 *
 * Handlers receive (payload, eventName). A throwing handler never stops other handlers; errors are
 * reported to options.onError (default: console.error) .
 *
 * Options for create({ onError, maxListeners = 100 })  -> warns once per event when exceeded.
 * API: on, once, off, emit, emitAsync, clear, listenerCount, eventNames, has, destroy. A shared bus: ChillEvents.global.
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';

    function patternToRegExp(pattern) {
        // '*' matches within one segment ('user:*' matches 'user:login' but not 'user:a:b'); '**' matches anything.
        if (pattern === '*') return /^.*$/;
        const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '\u0000').replace(/\*/g, '[^:.]*').replace(/\u0000/g, '.*');
        return new RegExp('^' + esc + '$');
    }

    class Bus {
        constructor(options) {
            options = options || {};
            this._map = new Map();      // event -> [{fn, once}]
            this._wild = [];            // [{pattern, re, fn, once}]
            this._onError = typeof options.onError === 'function' ? options.onError : null;
            this._max = options.maxListeners == null ? 100 : options.maxListeners;
            this._warned = new Set();
            this._destroyed = false;
        }

        _report(err, event) {
            if (this._onError) { try { this._onError(err, event); } catch (e) { /* ignore */ } return; }
            if (typeof console !== 'undefined' && console.error) console.error('ChillEvents: handler for "' + event + '" threw', err);
        }

        _add(event, fn, once) {
            if (typeof fn !== 'function') throw new TypeError('ChillEvents: handler must be a function');
            if (typeof event !== 'string' || !event) throw new TypeError('ChillEvents: event name must be a non-empty string');
            if (this._destroyed) return function () {};
            const rec = { fn: fn, once: !!once };
            if (event.indexOf('*') !== -1) {
                rec.pattern = event; rec.re = patternToRegExp(event);
                this._wild.push(rec);
            } else {
                let list = this._map.get(event);
                if (!list) { list = []; this._map.set(event, list); }
                list.push(rec);
                if (this._max && list.length > this._max && !this._warned.has(event)) {
                    this._warned.add(event);
                    if (typeof console !== 'undefined' && console.warn) console.warn('ChillEvents: more than ' + this._max + ' listeners for "' + event + '" (possible leak)');
                }
            }
            const self = this;
            return function unsubscribe() { self._remove(rec); };
        }

        _remove(rec) {
            if (rec.pattern !== undefined) {
                const i = this._wild.indexOf(rec);
                if (i > -1) this._wild.splice(i, 1);
                return;
            }
            for (const [event, list] of this._map) {
                const i = list.indexOf(rec);
                if (i > -1) {
                    list.splice(i, 1);
                    if (!list.length) this._map.delete(event);
                    return;
                }
            }
        }

        /** Subscribe. Returns an unsubscribe function. */
        on(event, fn) { return this._add(event, fn, false); }
        /** Subscribe for a single emission. Returns an unsubscribe function. */
        once(event, fn) { return this._add(event, fn, true); }

        /** Remove one handler, or all handlers of an event when fn is omitted. */
        off(event, fn) {
            if (event.indexOf('*') !== -1) {
                this._wild = this._wild.filter(function (r) { return !(r.pattern === event && (!fn || r.fn === fn)); });
                return this;
            }
            const list = this._map.get(event);
            if (!list) return this;
            if (!fn) this._map.delete(event);
            else {
                const kept = list.filter(function (r) { return r.fn !== fn; });
                if (kept.length) this._map.set(event, kept); else this._map.delete(event);
            }
            return this;
        }

        _collect(event) {
            const recs = [];
            const exact = this._map.get(event);
            if (exact) recs.push.apply(recs, exact);
            for (let i = 0; i < this._wild.length; i++) if (this._wild[i].re.test(event)) recs.push(this._wild[i]);
            return recs;
        }

        /** Synchronously call handlers. Returns true when at least one handler ran. */
        emit(event, payload) {
            if (this._destroyed) return false;
            const recs = this._collect(event);
            for (let i = 0; i < recs.length; i++) {
                const rec = recs[i];
                if (rec.once) this._remove(rec);
                try { rec.fn(payload, event); } catch (err) { this._report(err, event); }
            }
            return recs.length > 0;
        }

        /** Await handlers one after another (so ordering is preserved). Resolves to an array of results. */
        async emitAsync(event, payload) {
            if (this._destroyed) return [];
            const recs = this._collect(event);
            const results = [];
            for (let i = 0; i < recs.length; i++) {
                const rec = recs[i];
                if (rec.once) this._remove(rec);
                try { results.push(await rec.fn(payload, event)); }
                catch (err) { this._report(err, event); results.push(undefined); }
            }
            return results;
        }

        has(event) { return this.listenerCount(event) > 0; }

        listenerCount(event) {
            if (event == null) {
                let n = this._wild.length;
                this._map.forEach(function (l) { n += l.length; });
                return n;
            }
            return this._collect(event).length;
        }

        eventNames() { return Array.from(this._map.keys()).concat(this._wild.map(function (r) { return r.pattern; })); }

        clear() { this._map.clear(); this._wild = []; return this; }

        destroy() { this.clear(); this._destroyed = true; }
    }

    let shared = null;

    const ChillEvents = {
        version: VERSION,
        Bus: Bus,
        create(options) { return new Bus(options); },
        /** Lazily created process-wide bus. */
        get global() { return shared || (shared = new Bus()); },
        injectCSS() { /* no styles */ }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillEvents; }
    else { window.ChillEvents = ChillEvents; }
})(typeof window !== 'undefined' ? window : this);
