/**
 * ChillStorage - Safe typed storage wrapper (localStorage / sessionStorage / memory)
 *
 * @example
 *   const store = ChillStorage.create({ namespace: 'myapp', type: 'local', ttl: 3600 });
 *   store.set('user', { id: 1 });              // JSON-serialised automatically
 *   store.set('token', 'abc', { ttl: 60 });    // per-key TTL in SECONDS
 *   store.get('user');                          // { id: 1 }   (null / fallback when missing or expired)
 *   const off = store.subscribe('user', (value, oldValue, key) => {});  // also fires for other tabs
 *   store.remove('user'); store.clear(); store.destroy();
 *
 * Falls back to an in-memory store automatically when the requested storage is blocked
 * (private mode, quota, cookies disabled, SSR). `store.backend` tells you what is actually used.
 *
 * Options for create():
 *   namespace  string  ''        prefix for every key ("ns:key")
 *   type       string  'local'   'local' | 'session' | 'memory'
 *   ttl        number  0         default time-to-live in seconds (0 = never expires)
 *   onError    fn      null      called with (error, op) for quota / serialisation errors
 *
 * Methods: get(key, fallback), set(key, value, {ttl}), remove(key), has(key), keys(), entries(), clear(),
 *   ttl(key) -> remaining seconds | null, touch(key, ttlSeconds), purgeExpired(), subscribe([key], fn), destroy().
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';

    class MemoryArea {
        constructor() { this._m = new Map(); }
        get length() { return this._m.size; }
        key(i) { const k = Array.from(this._m.keys())[i]; return k === undefined ? null : k; }
        getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }
        setItem(k, v) { this._m.set(k, String(v)); }
        removeItem(k) { this._m.delete(k); }
        clear() { this._m.clear(); }
    }

    function nativeArea(type) {
        try {
            if (typeof window === 'undefined') return null;
            const area = type === 'session' ? window.sessionStorage : window.localStorage;
            if (!area) return null;
            const probe = '__chillstorage_probe__';
            area.setItem(probe, '1');
            area.removeItem(probe);
            return area;
        } catch (e) { return null; }
    }

    class ChillStorageInstance {
        constructor(options) {
            options = options || {};
            this.namespace = options.namespace ? String(options.namespace) : '';
            this.defaultTtl = Number(options.ttl) > 0 ? Number(options.ttl) : 0;
            this.onError = typeof options.onError === 'function' ? options.onError : null;
            const type = options.type === 'session' || options.type === 'memory' ? options.type : 'local';
            let area = type === 'memory' ? null : nativeArea(type);
            this.backend = area ? type : 'memory';
            this._area = area || new MemoryArea();
            this._listeners = []; // {key, fn}
            this._prefix = this.namespace ? this.namespace + ':' : '';
            this._destroyed = false;
            this._onStorage = null;
            this._bind();
        }

        _bind() {
            if (this.backend === 'memory' || typeof window === 'undefined' || !window.addEventListener) return;
            const self = this;
            this._onStorage = function (e) {
                if (e.storageArea && e.storageArea !== self._area) return;
                if (e.key === null) { // clear() in another tab
                    self._emit(null, null, null); return;
                }
                if (!self._owns(e.key)) return;
                const key = e.key.slice(self._prefix.length);
                self._emit(key, self._decode(e.newValue, null), self._decode(e.oldValue, null));
            };
            window.addEventListener('storage', this._onStorage);
        }

        _owns(fullKey) { return fullKey.indexOf(this._prefix) === 0; }
        _full(key) { return this._prefix + key; }

        _fail(err, op) {
            if (this.onError) { try { this.onError(err, op); } catch (e) { /* ignore */ } }
        }

        _decode(raw, fallback) {
            if (raw === null || raw === undefined) return fallback === undefined ? null : fallback;
            let env;
            try { env = JSON.parse(raw); } catch (e) { return raw; } // foreign raw string value
            if (env && typeof env === 'object' && env.__chill === 1) {
                if (env.e && Date.now() >= env.e) return fallback === undefined ? null : fallback;
                return env.v;
            }
            return env; // foreign JSON value
        }

        _readEnvelope(key) {
            let raw;
            try { raw = this._area.getItem(this._full(key)); } catch (e) { return null; }
            if (raw === null) return null;
            try {
                const env = JSON.parse(raw);
                if (env && typeof env === 'object' && env.__chill === 1) return env;
            } catch (e) { /* foreign */ }
            return { __chill: 1, v: undefined, foreign: raw };
        }

        get(key, fallback) {
            const fb = fallback === undefined ? null : fallback;
            const env = this._readEnvelope(key);
            if (!env) return fb;
            if (env.foreign !== undefined) {
                try { return JSON.parse(env.foreign); } catch (e) { return env.foreign; }
            }
            if (env.e && Date.now() >= env.e) {
                this._removeRaw(key);
                this._emit(key, null, env.v);
                return fb;
            }
            return env.v === undefined ? fb : env.v;
        }

        has(key) {
            const env = this._readEnvelope(key);
            if (!env) return false;
            if (env.e && Date.now() >= env.e) { this._removeRaw(key); return false; }
            return true;
        }

        /**
         * @param {string} key
         * @param {*} value anything JSON-serialisable (undefined removes the key)
         * @param {{ttl?:number}} [opts] ttl in seconds; 0 = never expires (overrides the instance default)
         * @returns {boolean} true when stored
         */
        set(key, value, opts) {
            if (value === undefined) { this.remove(key); return true; }
            const ttl = opts && opts.ttl != null ? Number(opts.ttl) : this.defaultTtl;
            const env = { __chill: 1, v: value };
            if (ttl > 0) env.e = Date.now() + ttl * 1000;
            let json;
            try { json = JSON.stringify(env); } catch (e) { this._fail(e, 'set'); return false; }
            const old = this.get(key, null);
            try { this._area.setItem(this._full(key), json); }
            catch (e) { this._fail(e, 'set'); return false; }
            this._emit(key, value, old);
            return true;
        }

        _removeRaw(key) { try { this._area.removeItem(this._full(key)); } catch (e) { /* ignore */ } }

        remove(key) {
            const old = this.get(key, null);
            this._removeRaw(key);
            this._emit(key, null, old);
        }

        _allFullKeys() {
            const out = [];
            try {
                for (let i = 0; i < this._area.length; i++) {
                    const k = this._area.key(i);
                    if (k !== null && k.indexOf(this._prefix) === 0) out.push(k);
                }
            } catch (e) { /* ignore */ }
            return out;
        }

        keys() {
            const self = this;
            return this._allFullKeys().map(function (k) { return k.slice(self._prefix.length); }).filter(function (k) { return self.has(k); });
        }

        entries() {
            const self = this;
            return this.keys().map(function (k) { return [k, self.get(k)]; });
        }

        clear() {
            const full = this._allFullKeys();
            for (let i = 0; i < full.length; i++) {
                try { this._area.removeItem(full[i]); } catch (e) { /* ignore */ }
            }
            this._emit(null, null, null);
        }

        /** Remaining lifetime in seconds, or null when the key does not expire / does not exist. */
        ttl(key) {
            const env = this._readEnvelope(key);
            if (!env || !env.e) return null;
            const left = (env.e - Date.now()) / 1000;
            return left > 0 ? left : null;
        }

        /** Re-set the expiry of an existing key. */
        touch(key, ttlSeconds) {
            if (!this.has(key)) return false;
            return this.set(key, this.get(key), { ttl: ttlSeconds == null ? this.defaultTtl : ttlSeconds });
        }

        /** Delete every expired entry of this namespace. Returns the number removed. */
        purgeExpired() {
            const full = this._allFullKeys();
            let n = 0;
            for (let i = 0; i < full.length; i++) {
                const key = full[i].slice(this._prefix.length);
                const env = this._readEnvelope(key);
                if (env && env.e && Date.now() >= env.e) { this._removeRaw(key); n++; }
            }
            return n;
        }

        /**
         * Subscribe to changes of one key, or of all keys of this namespace.
         *   subscribe(fn)           -> fn(value, oldValue, key)
         *   subscribe('theme', fn)  -> fn(value, oldValue, key)
         * Fires for changes made in this tab AND (for local/session storage) in other tabs.
         * Clearing everything calls fn(null, null, null). Returns an unsubscribe function.
         */
        subscribe(key, fn) {
            if (typeof key === 'function') { fn = key; key = null; }
            if (typeof fn !== 'function') throw new TypeError('ChillStorage.subscribe: handler must be a function');
            const rec = { key: key == null ? null : key, fn: fn };
            this._listeners.push(rec);
            const self = this;
            return function unsubscribe() {
                const i = self._listeners.indexOf(rec);
                if (i > -1) self._listeners.splice(i, 1);
            };
        }

        _emit(key, value, oldValue) {
            if (!this._listeners.length) return;
            const list = this._listeners.slice();
            for (let i = 0; i < list.length; i++) {
                const rec = list[i];
                if (rec.key !== null && key !== null && rec.key !== key) continue;
                try { rec.fn(value, oldValue, key); } catch (e) { this._fail(e, 'subscribe'); }
            }
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            if (this._onStorage && typeof window !== 'undefined' && window.removeEventListener) {
                window.removeEventListener('storage', this._onStorage);
            }
            this._onStorage = null;
            this._listeners.length = 0;
        }
    }

    const ChillStorage = {
        version: VERSION,
        Storage: ChillStorageInstance,
        create(options) { return new ChillStorageInstance(options); },
        /** True when the given storage ('local' | 'session') is usable in this environment. */
        isSupported(type) { return !!nativeArea(type === 'session' ? 'session' : 'local'); },
        injectCSS() { /* no styles */ }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillStorage; }
    else { window.ChillStorage = ChillStorage; }
})(typeof window !== 'undefined' ? window : this);
