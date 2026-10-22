/**
 * ChillConfig - Zero-dependency Configuration Utility with Persistence
 *
 * @example
 *   const cfg = ChillConfig.create({ storageKey: 'my-app', defaults: { ui: { density: 'cozy' } }, persist: true });
 *   cfg.get('ui.density');             // 'cozy'
 *   cfg.set('ui.density', 'compact');  // saved to localStorage (memory fallback when blocked)
 *   const off = cfg.subscribe((config, key) => {});   // also fires for changes made in OTHER tabs
 *   cfg.reset(); cfg.destroy();
 *
 * Fixes vs 1.0: nested defaults are deep-cloned (reset() really resets), dotted paths cannot pollute Object.prototype,
 * storage access is guarded (private mode / SSR -> in-memory), stored data is deep-merged over defaults, listeners are
 * isolated, cross-tab `storage` events are applied, and destroy() releases the listener.
 *
 * Options: storageKey 'chill-config', persist true, defaults {}, sync true (apply storage events from other tabs),
 *          type 'local' | 'session' ('local'), onChange(config, key)
 * Methods: get(key?, default), has(key), set(key, value) | set({k: v}), merge(obj), remove(key), reset(), save(), load(),
 *          subscribe(fn) -> unsubscribe, destroy()   (fn receives (config, changedKey | null))
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const STORAGE_KEY = 'chill-config';
    const UNSAFE = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };

    function isObj(v) {
        if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
        const p = Object.getPrototypeOf(v);
        return p === null || Object.getPrototypeOf(p) === null;
    }
    function clone(v) {
        if (Array.isArray(v)) return v.map(clone);
        if (v instanceof Date) return new Date(v.getTime());
        if (isObj(v)) { const o = {}; Object.keys(v).forEach(function (k) { if (!UNSAFE[k]) o[k] = clone(v[k]); }); return o; }
        return v;
    }
    function deepMerge(target, source) {
        const out = clone(target);
        Object.keys(source || {}).forEach(function (k) {
            if (UNSAFE[k]) return;
            if (isObj(source[k])) out[k] = deepMerge(isObj(out[k]) ? out[k] : {}, source[k]);
            else out[k] = clone(source[k]);
        });
        return out;
    }
    function path(key) {
        const parts = String(key).split('.');
        return parts.some(function (p) { return !p || UNSAFE[p]; }) ? null : parts;
    }

    function area(type) {
        try {
            const a = type === 'session' ? window.sessionStorage : window.localStorage;
            if (!a) return null;
            const probe = '__chillconfig_probe__';
            a.setItem(probe, '1'); a.removeItem(probe);
            return a;
        } catch (e) { return null; }
    }

    class ChillConfigInstance {
        constructor(options) {
            options = options || {};
            this.storageKey = options.storageKey || STORAGE_KEY;
            this.persist = options.persist !== false;
            this.defaults = clone(options.defaults || {});
            this.config = clone(this.defaults);
            this.listeners = new Set();
            this._area = this.persist ? area(options.type) : null;
            this._memory = null; // fallback copy when storage is unavailable
            this._destroyed = false;
            if (typeof options.onChange === 'function') this.listeners.add(options.onChange);
            if (this.persist) this.load();
            if (this.persist && options.sync !== false && this._area && typeof window.addEventListener === 'function') {
                const self = this;
                this._onStorage = function (e) {
                    if (e.storageArea && e.storageArea !== self._area) return;
                    if (e.key !== null && e.key !== self.storageKey) return;
                    self.load();
                    self.notify(null);
                };
                window.addEventListener('storage', this._onStorage);
            }
        }

        load() {
            let raw = null;
            if (this._area) { try { raw = this._area.getItem(this.storageKey); } catch (e) { raw = null; } }
            else raw = this._memory;
            this.config = clone(this.defaults);
            if (!raw) return this;
            try {
                const parsed = JSON.parse(raw);
                if (isObj(parsed)) this.config = deepMerge(this.defaults, parsed);
            } catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn('ChillConfig: Failed to load', e); }
            return this;
        }

        save() {
            if (!this.persist) return this;
            let json;
            try { json = JSON.stringify(this.config); } catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn('ChillConfig: Failed to save', e); return this; }
            if (this._area) {
                try { this._area.setItem(this.storageKey, json); }
                catch (e) { this._memory = json; if (typeof console !== 'undefined' && console.warn) console.warn('ChillConfig: Failed to save', e); }
            } else this._memory = json;
            return this;
        }

        get(key, defaultValue) {
            if (key === undefined || key === null || key === '') return clone(this.config);
            const parts = path(key);
            if (!parts) return defaultValue;
            let val = this.config;
            for (let i = 0; i < parts.length; i++) {
                if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, parts[i])) val = val[parts[i]];
                else return defaultValue;
            }
            return val !== undefined ? clone(val) : defaultValue; // objects/arrays are returned as copies
        }

        has(key) { return this.get(key, undefined) !== undefined; }

        set(key, value) {
            if (isObj(key)) {
                Object.keys(key).forEach(function (k) { if (!UNSAFE[k]) this.config[k] = key[k]; }, this);
                this.save(); this.notify(null);
                return this;
            }
            const parts = path(key);
            if (!parts) return this;
            let obj = this.config;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!isObj(obj[parts[i]])) obj[parts[i]] = {};
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
            this.save();
            this.notify(String(key));
            return this;
        }

        merge(obj) {
            this.config = deepMerge(this.config, obj);
            this.save(); this.notify(null);
            return this;
        }

        remove(key) {
            const parts = path(key);
            if (!parts) return this;
            let obj = this.config;
            for (let i = 0; i < parts.length - 1; i++) {
                if (isObj(obj[parts[i]])) obj = obj[parts[i]]; else return this;
            }
            delete obj[parts[parts.length - 1]];
            this.save();
            this.notify(String(key));
            return this;
        }

        reset() { this.config = clone(this.defaults); this.save(); this.notify(null); return this; }

        subscribe(fn) {
            if (typeof fn !== 'function') throw new TypeError('ChillConfig.subscribe: listener must be a function');
            this.listeners.add(fn);
            const self = this;
            return function unsubscribe() { self.listeners.delete(fn); };
        }

        notify(changedKey) {
            if (this._destroyed) return;
            Array.from(this.listeners).forEach(function (fn) {
                try { fn(this.config, changedKey === undefined ? null : changedKey); }
                catch (e) { if (typeof console !== 'undefined' && console.error) console.error('ChillConfig listener error', e); }
            }, this);
        }

        destroy() {
            this._destroyed = true;
            if (this._onStorage && typeof window.removeEventListener === 'function') window.removeEventListener('storage', this._onStorage);
            this._onStorage = null;
            this.listeners.clear();
        }
    }

    const ChillConfig = {
        version: VERSION,
        create(options) { return new ChillConfigInstance(options); },
        Config: ChillConfigInstance
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillConfig; }
    else { window.ChillConfig = ChillConfig; }
})(typeof window !== 'undefined' ? window : this);
