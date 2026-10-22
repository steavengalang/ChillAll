/**
 * ChillFetch - Zero-dependency fetch wrapper
 *
 * @example
 *   const api = ChillFetch.create({ baseURL: 'https://api.example.com', timeout: 8000, retries: 2 });
 *   api.interceptors.request.use(cfg => { cfg.headers.authorization = 'Bearer ' + token; return cfg; });
 *   const users = await api.get('/users', { params: { page: 2 } });       // parsed JSON
 *   const made  = await api.post('/users', { name: 'Ada' });              // object body -> JSON
 *   try { await api.get('/missing'); } catch (e) { if (e instanceof ChillFetch.Error) console.log(e.status, e.data); }
 *
 * Options for create() (all can be overridden per request):
 *   baseURL        string   ''       prepended to relative URLs
 *   headers        object   {}       default headers (names are case-insensitive)
 *   timeout        number   10000    ms; 0 disables. Rejects with code 'TIMEOUT'
 *   retries        number   0        extra attempts for network errors, timeouts and retryOn statuses
 *   retryDelay     number   300      first backoff delay in ms, doubled each attempt (+ jitter); honours Retry-After
 *   retryFactor    number   2
 *   retryMaxDelay  number   10000
 *   retryOn        number[] [408,425,429,500,502,503,504]
 *   retryMethods   string[] ['GET','HEAD','OPTIONS','PUT','DELETE']  (POST/PATCH are NOT retried unless listed)
 *   shouldRetry    fn       null     (error, attempt) => boolean overrides the decision
 *   responseType   string   'auto'   'auto'|'json'|'text'|'blob'|'arrayBuffer'|'formData'|'response'
 *   params         object   null     query string params (arrays repeat the key, null/undefined skipped)
 *   signal         AbortSignal       abort from outside (error.code === 'ABORT')
 *   validateStatus fn       s => s >= 200 && s < 300
 *   json           any               shortcut: JSON-stringify as body and set content-type
 *   fullResponse   boolean  false    resolve { data, status, statusText, headers, response, config } instead of data
 *   fetch          function          custom fetch implementation (default: global fetch)
 *   ...any other fetch() init option (credentials, mode, cache, …)
 *
 * Client: request(url, opts), get/head/delete/options(url, opts), post/put/patch(url, body, opts),
 *   interceptors.request.use(fn) / .response.use(fn) / .error.use(fn) -> returns eject(), abortAll(), extend(opts), defaults.
 * Error interceptors receive the error; return nothing to rethrow it, return an Error to replace it, or return any
 *   other value to recover (the request then resolves with that value).
 * Errors: ChillFetch.Error { name, message, status, statusText, data, response, config, code, attempt }
 *   code is one of 'HTTP_ERROR' | 'TIMEOUT' | 'ABORT' | 'NETWORK' | 'PARSE'.
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';

    class ChillFetchError extends Error {
        constructor(message, props) {
            super(message);
            this.name = 'ChillFetchError';
            this.code = 'HTTP_ERROR';
            this.status = 0;
            this.statusText = '';
            this.data = null;
            this.response = null;
            this.config = null;
            this.attempt = 1;
            if (props) Object.assign(this, props);
        }
        get isTimeout() { return this.code === 'TIMEOUT'; }
        get isAbort() { return this.code === 'ABORT'; }
        get isNetwork() { return this.code === 'NETWORK'; }
    }

    const DEFAULTS = {
        baseURL: '',
        headers: {},
        timeout: 10000,
        retries: 0,
        retryDelay: 300,
        retryFactor: 2,
        retryMaxDelay: 10000,
        retryOn: [408, 425, 429, 500, 502, 503, 504],
        retryMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
        shouldRetry: null,
        responseType: 'auto',
        params: null,
        validateStatus: function (s) { return s >= 200 && s < 300; },
        fullResponse: false
    };

    function isPlainObj(v) {
        if (v === null || typeof v !== 'object') return false;
        const p = Object.getPrototypeOf(v);
        return p === null || Object.getPrototypeOf(p) === null;
    }

    function normHeaders(h) {
        const out = {};
        if (!h) return out;
        if (typeof h.forEach === 'function' && !Array.isArray(h)) { h.forEach(function (v, k) { out[String(k).toLowerCase()] = v; }); return out; }
        if (Array.isArray(h)) { h.forEach(function (p) { out[String(p[0]).toLowerCase()] = p[1]; }); return out; }
        Object.keys(h).forEach(function (k) { if (h[k] !== undefined && h[k] !== null) out[k.toLowerCase()] = h[k]; });
        return out;
    }

    function merge(a, b) {
        const out = Object.assign({}, a);
        Object.keys(b || {}).forEach(function (k) {
            if (b[k] === undefined) return;
            if (k === 'headers') out.headers = Object.assign({}, normHeaders(a.headers), normHeaders(b.headers));
            else out[k] = b[k];
        });
        if (!out.headers) out.headers = {};
        return out;
    }

    function buildQuery(params) {
        const parts = [];
        const add = function (k, v) {
            if (v === undefined || v === null) return;
            parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v instanceof Date ? v.toISOString() : String(v)));
        };
        Object.keys(params).forEach(function (k) {
            const v = params[k];
            if (Array.isArray(v)) v.forEach(function (x) { add(k, x); }); else add(k, v);
        });
        return parts.join('&');
    }

    function buildURL(base, url, params) {
        let full = String(url);
        if (base && !/^([a-z][a-z0-9+.-]*:)?\/\//i.test(full)) {
            full = base.replace(/\/+$/, '') + '/' + full.replace(/^\/+/, '');
        }
        if (params && isPlainObj(params)) {
            const q = buildQuery(params);
            if (q) {
                const hash = full.indexOf('#');
                const tail = hash > -1 ? full.slice(hash) : '';
                if (hash > -1) full = full.slice(0, hash);
                full += (full.indexOf('?') === -1 ? '?' : (/[?&]$/.test(full) ? '' : '&')) + q + tail;
            }
        }
        return full;
    }

    function sleep(ms, signal) {
        return new Promise(function (resolve, reject) {
            if (signal && signal.aborted) { reject(makeAbort()); return; }
            let onAbort = null;
            const t = setTimeout(function () {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve();
            }, ms);
            if (signal) {
                onAbort = function () { clearTimeout(t); reject(makeAbort()); };
                signal.addEventListener('abort', onAbort, { once: true });
            }
        });
    }
    function makeAbort() { const e = new Error('Aborted'); e.name = 'AbortError'; return e; }

    function getFetch(cfg) {
        if (typeof cfg.fetch === 'function') return cfg.fetch;
        if (typeof fetch === 'function') return fetch; // eslint-disable-line no-undef
        if (typeof window !== 'undefined' && typeof window.fetch === 'function') return window.fetch.bind(window);
        return null;
    }

    class InterceptorList {
        constructor() { this.list = []; }
        use(fn) {
            if (typeof fn !== 'function') throw new TypeError('ChillFetch: interceptor must be a function');
            this.list.push(fn);
            const self = this;
            return function eject() { const i = self.list.indexOf(fn); if (i > -1) self.list.splice(i, 1); };
        }
        clear() { this.list.length = 0; }
    }

    class ChillFetchClient {
        constructor(defaults) {
            this.defaults = merge(DEFAULTS, defaults || {});
            this.interceptors = { request: new InterceptorList(), response: new InterceptorList(), error: new InterceptorList() };
            this._controllers = new Set();
        }

        /** New client inheriting this one's defaults (and a copy of its interceptors). */
        extend(options) {
            const c = new ChillFetchClient(merge(this.defaults, options || {}));
            ['request', 'response', 'error'].forEach(function (k) { c.interceptors[k].list = this.interceptors[k].list.slice(); }, this);
            return c;
        }

        /** Abort every in-flight request made by this client. */
        abortAll() {
            this._controllers.forEach(function (c) { try { c.abort(); } catch (e) { /* ignore */ } });
            this._controllers.clear();
        }

        async request(url, options) {
            let cfg = merge(this.defaults, options || {});
            cfg.method = String(cfg.method || 'GET').toUpperCase();
            cfg.headers = normHeaders(cfg.headers);
            cfg.url = String(url);
            cfg.fullURL = buildURL(cfg.baseURL, cfg.url, cfg.params);

            // body serialisation
            if (cfg.json !== undefined) {
                cfg.body = JSON.stringify(cfg.json);
                if (!cfg.headers['content-type']) cfg.headers['content-type'] = 'application/json';
            } else if (cfg.body !== undefined && cfg.body !== null && (isPlainObj(cfg.body) || Array.isArray(cfg.body))) {
                cfg.body = JSON.stringify(cfg.body);
                if (!cfg.headers['content-type']) cfg.headers['content-type'] = 'application/json';
            }
            if (cfg.responseType === 'auto' || cfg.responseType === 'json') {
                if (!cfg.headers.accept) cfg.headers.accept = 'application/json, text/plain, */*';
            }

            try {
                for (let i = 0; i < this.interceptors.request.list.length; i++) {
                    const next = await this.interceptors.request.list[i](cfg);
                    if (next) cfg = next;
                }
                let result = await this._dispatch(cfg);
                for (let i = 0; i < this.interceptors.response.list.length; i++) {
                    const next = await this.interceptors.response.list[i](result);
                    if (next) result = next;
                }
                return cfg.fullResponse ? result : result.data;
            } catch (err) {
                let error = err instanceof ChillFetchError ? err : new ChillFetchError(err && err.message || String(err), { code: 'NETWORK', config: cfg });
                const handlers = this.interceptors.error.list;
                for (let i = 0; i < handlers.length; i++) {
                    try {
                        const recovered = await handlers[i](error);
                        if (recovered !== undefined && !(recovered instanceof Error)) return recovered; // recovered value
                        if (recovered instanceof Error) error = recovered;
                    } catch (thrown) { error = thrown; }
                }
                throw error;
            }
        }

        _shouldRetry(cfg, error, attempt) {
            if (attempt > cfg.retries) return false;
            if (error.code === 'ABORT') return false;
            if (typeof cfg.shouldRetry === 'function') return !!cfg.shouldRetry(error, attempt);
            if (cfg.retryMethods.indexOf(cfg.method) === -1) return false;
            if (error.code === 'NETWORK' || error.code === 'TIMEOUT') return true;
            return error.code === 'HTTP_ERROR' && cfg.retryOn.indexOf(error.status) > -1;
        }

        _delay(cfg, error, attempt) {
            let ms = Math.min(cfg.retryMaxDelay, cfg.retryDelay * Math.pow(cfg.retryFactor, attempt - 1));
            ms = ms * (0.75 + Math.random() * 0.5); // jitter
            const ra = error.response && error.response.headers && error.response.headers.get && error.response.headers.get('retry-after');
            if (ra) {
                const secs = Number(ra);
                const when = isNaN(secs) ? Date.parse(ra) - Date.now() : secs * 1000;
                if (when > 0) ms = Math.min(Math.max(ms, when), cfg.retryMaxDelay * 6);
            }
            return Math.round(ms);
        }

        async _dispatch(cfg) {
            const doFetch = getFetch(cfg);
            if (!doFetch) throw new ChillFetchError('ChillFetch: fetch is not available in this environment', { code: 'NETWORK', config: cfg });
            let attempt = 0;
            for (;;) {
                attempt++;
                try {
                    return await this._once(doFetch, cfg, attempt);
                } catch (err) {
                    err.attempt = attempt;
                    if (!this._shouldRetry(cfg, err, attempt)) throw err;
                    try { await sleep(this._delay(cfg, err, attempt), cfg.signal); }
                    catch (e) { throw new ChillFetchError('Request aborted', { code: 'ABORT', config: cfg, attempt: attempt }); }
                }
            }
        }

        async _once(doFetch, cfg, attempt) {
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null; // eslint-disable-line no-undef
            let timedOut = false, timer = null, userAborted = false;
            const outer = cfg.signal;
            const onOuterAbort = function () { userAborted = true; if (ctrl) ctrl.abort(); };
            if (outer) {
                if (outer.aborted) throw new ChillFetchError('Request aborted', { code: 'ABORT', config: cfg, attempt: attempt });
                outer.addEventListener('abort', onOuterAbort, { once: true });
            }
            if (ctrl) this._controllers.add(ctrl);
            let abortReject = null;
            const abortPromise = new Promise(function (_, rej) { abortReject = rej; });
            abortPromise.catch(function () {});
            if (cfg.timeout > 0) {
                timer = setTimeout(function () {
                    timedOut = true;
                    if (ctrl) ctrl.abort();
                    abortReject(new Error('timeout'));
                }, cfg.timeout);
            }
            if (ctrl) ctrl.signal.addEventListener('abort', function () { if (!timedOut) userAborted = true; abortReject(new Error('aborted')); }, { once: true });

            const init = {};
            Object.keys(cfg).forEach(function (k) {
                if (['baseURL', 'url', 'fullURL', 'params', 'timeout', 'retries', 'retryDelay', 'retryFactor', 'retryMaxDelay', 'retryOn', 'retryMethods', 'shouldRetry',
                    'responseType', 'validateStatus', 'fullResponse', 'fetch', 'json', 'signal', 'headers'].indexOf(k) === -1) init[k] = cfg[k];
            });
            init.headers = cfg.headers;
            if (ctrl) init.signal = ctrl.signal;
            else if (outer) init.signal = outer;

            const classify = function (e) {
                if (e instanceof ChillFetchError) return e;
                if (timedOut) return new ChillFetchError('Request timed out after ' + cfg.timeout + 'ms', { code: 'TIMEOUT', config: cfg, attempt: attempt });
                if (userAborted || (e && e.name === 'AbortError')) return new ChillFetchError('Request aborted', { code: 'ABORT', config: cfg, attempt: attempt });
                return new ChillFetchError((e && e.message) || 'Network error', { code: 'NETWORK', config: cfg, attempt: attempt });
            };

            try {
                const response = await Promise.race([doFetch(cfg.fullURL, init), abortPromise]);
                const data = await Promise.race([this._parse(response, cfg), abortPromise]);
                const result = {
                    data: data, status: response.status, statusText: response.statusText,
                    headers: response.headers, response: response, config: cfg
                };
                if (!cfg.validateStatus(response.status)) {
                    throw new ChillFetchError(
                        'Request failed with status ' + response.status + (response.statusText ? ' ' + response.statusText : ''),
                        { code: 'HTTP_ERROR', status: response.status, statusText: response.statusText, data: data, response: response, config: cfg, attempt: attempt }
                    );
                }
                return result;
            } catch (e) {
                throw classify(e);
            } finally {
                if (timer) clearTimeout(timer);
                if (outer) outer.removeEventListener('abort', onOuterAbort);
                if (ctrl) this._controllers.delete(ctrl);
            }
        }

        async _parse(response, cfg) {
            const type = cfg.responseType;
            if (type === 'response') return response;
            if (response.status === 204 || response.status === 205 || cfg.method === 'HEAD') return null;
            if (type === 'blob' || type === 'arrayBuffer' || type === 'formData') return response[type]();
            const text = await response.text();
            if (type === 'text') return text;
            const ct = (response.headers && response.headers.get && response.headers.get('content-type')) || '';
            if (type === 'json' || /json/i.test(ct)) {
                if (!text) return null;
                try { return JSON.parse(text); }
                catch (e) {
                    if (type === 'json' && response.ok !== false) {
                        throw new ChillFetchError('Invalid JSON in response', { code: 'PARSE', status: response.status, response: response, config: cfg });
                    }
                    return text;
                }
            }
            return text;
        }

        get(url, opts) { return this.request(url, merge(opts || {}, { method: 'GET' })); }
        head(url, opts) { return this.request(url, merge(opts || {}, { method: 'HEAD' })); }
        options(url, opts) { return this.request(url, merge(opts || {}, { method: 'OPTIONS' })); }
        delete(url, opts) { return this.request(url, merge(opts || {}, { method: 'DELETE' })); }
        post(url, body, opts) { return this.request(url, merge(opts || {}, { method: 'POST', body: body })); }
        put(url, body, opts) { return this.request(url, merge(opts || {}, { method: 'PUT', body: body })); }
        patch(url, body, opts) { return this.request(url, merge(opts || {}, { method: 'PATCH', body: body })); }
    }

    const ChillFetch = {
        version: VERSION,
        Error: ChillFetchError,
        Client: ChillFetchClient,
        create(options) { return new ChillFetchClient(options); },
        buildURL: buildURL,
        buildQuery: buildQuery,
        injectCSS() { /* no styles */ }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillFetch; }
    else { window.ChillFetch = ChillFetch; }
})(typeof window !== 'undefined' ? window : this);
