/**
 * ChillProvider - Zero-dependency Configuration Provider Utility
 *
 * @example
 *   const theme = ChillProvider.create('ui', { density: 'comfortable', nested: { a: 1 } });
 *   theme.get('density');                      // 'comfortable'   (dotted paths work: theme.get('nested.a'))
 *   theme.set('density', 'compact');           // or theme.set({ density: 'compact' })
 *   theme.merge({ nested: { b: 2 } });         // deep merge
 *   const off = theme.subscribe((config, changedKeys) => {});    // off()
 *   ChillProvider.get('ui') === theme;  theme.destroy();  ChillProvider.remove('ui');
 *
 * Safe by design: __proto__ / constructor / prototype keys are ignored everywhere (no prototype pollution), listeners that
 * throw never break other listeners, defaults are deep-cloned so reset() really restores them.
 *
 * Instance: get(key?), has(key), set(keyOrObj, value), merge(obj), reset(defaults?), subscribe(fn, {immediate}) -> unsubscribe,
 *           destroy()
 * Static:   create(name, defaults), get(name), has(name), remove(name) (destroys the instance), names(), Provider (class)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const UNSAFE = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };

    function isObj(v) {
        if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
        const p = Object.getPrototypeOf(v);
        return p === null || Object.getPrototypeOf(p) === null; // plain object (also across realms)
    }

    function clone(v) {
        if (Array.isArray(v)) return v.map(clone);
        if (v instanceof Date) return new Date(v.getTime());
        if (isObj(v)) {
            const out = {};
            Object.keys(v).forEach(function (k) { if (!UNSAFE[k]) out[k] = clone(v[k]); });
            return out;
        }
        return v;
    }

    function deepMerge(target, source) {
        const output = Object.assign({}, target);
        Object.keys(source || {}).forEach(function (key) {
            if (UNSAFE[key]) return;
            const val = source[key];
            if (isObj(val)) output[key] = deepMerge(isObj(output[key]) ? output[key] : {}, val);
            else output[key] = clone(val);
        });
        return output;
    }

    function splitPath(key) {
        const parts = String(key).split('.');
        return parts.some(function (p) { return UNSAFE[p]; }) ? null : parts;
    }

    class ChillProviderInstance {
        constructor(defaultConfig) {
            this.defaults = clone(defaultConfig || {});
            this.config = clone(this.defaults);
            this.listeners = new Set();
            this._destroyed = false;
        }

        get(key) {
            if (key === undefined || key === null || key === '') return Object.assign({}, this.config);
            if (Object.prototype.hasOwnProperty.call(this.config, key)) return this.config[key];
            const parts = splitPath(key);
            if (!parts || parts.length === 1) return undefined;
            let val = this.config;
            for (let i = 0; i < parts.length; i++) {
                if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, parts[i])) val = val[parts[i]];
                else return undefined;
            }
            return val;
        }

        has(key) { return this.get(key) !== undefined; }

        set(keyOrObj, value) {
            const changed = [];
            if (isObj(keyOrObj)) {
                Object.keys(keyOrObj).forEach(function (k) {
                    if (UNSAFE[k]) return;
                    this.config[k] = keyOrObj[k]; changed.push(k);
                }, this);
            } else {
                const parts = splitPath(keyOrObj);
                if (!parts) return this;
                let obj = this.config;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!isObj(obj[parts[i]])) obj[parts[i]] = {};
                    obj = obj[parts[i]];
                }
                obj[parts[parts.length - 1]] = value;
                changed.push(String(keyOrObj));
            }
            this.notify(changed);
            return this;
        }

        merge(obj) {
            this.config = deepMerge(this.config, obj);
            this.notify(Object.keys(obj || {}).filter(function (k) { return !UNSAFE[k]; }));
            return this;
        }

        reset(defaultConfig) {
            if (defaultConfig) this.defaults = clone(defaultConfig);
            this.config = clone(this.defaults);
            this.notify(null);
            return this;
        }

        subscribe(fn, options) {
            if (typeof fn !== 'function') throw new TypeError('ChillProvider.subscribe: listener must be a function');
            this.listeners.add(fn);
            if (options && options.immediate) { try { fn(this.config, null); } catch (e) { /* ignore */ } }
            const self = this;
            return function unsubscribe() { self.listeners.delete(fn); };
        }

        /** @param {string[]|null} changed changed top-level keys / paths (null = everything) */
        notify(changed) {
            if (this._destroyed) return;
            Array.from(this.listeners).forEach(function (fn) {
                try { fn(this.config, changed); }
                catch (e) { if (typeof console !== 'undefined' && console.error) console.error('ChillProvider listener error', e); }
            }, this);
        }

        deepMerge(target, source) { return deepMerge(target, source); }

        destroy() {
            this._destroyed = true;
            this.listeners.clear();
        }
    }

    const providers = new Map();

    function create(name, defaultConfig) {
        const old = providers.get(name);
        if (old) old.destroy();
        const provider = new ChillProviderInstance(defaultConfig);
        providers.set(name, provider);
        return provider;
    }

    function get(name) { return providers.get(name); }
    function has(name) { return providers.has(name); }
    function remove(name) { const p = providers.get(name); if (p) p.destroy(); providers.delete(name); }
    function names() { return Array.from(providers.keys()); }

    const ChillProvider = {
        version: VERSION,
        create: create,
        get: get,
        has: has,
        remove: remove,
        names: names,
        Provider: ChillProviderInstance
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillProvider; }
    else { window.ChillProvider = ChillProvider; }
})(typeof window !== 'undefined' ? window : this);
