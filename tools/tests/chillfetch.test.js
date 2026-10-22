const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function res(status, body, headers) {
    const h = new Map(Object.entries(Object.assign({ 'content-type': typeof body === 'object' ? 'application/json' : 'text/plain' }, headers || {})));
    const text = body === undefined ? '' : (typeof body === 'object' ? JSON.stringify(body) : String(body));
    return { status, statusText: status === 200 ? 'OK' : 'ERR', ok: status >= 200 && status < 300, headers: h, text: async () => text };
}
function mockFetch(queue) {
    const calls = [];
    const f = async (url, init) => {
        calls.push({ url, init });
        const next = queue.length > 1 ? queue.shift() : queue[0];
        const r = typeof next === 'function' ? await next(url, init) : next;
        if (r instanceof Error) throw r;
        return r;
    };
    f.calls = calls;
    return f;
}
const mk = (opts) => load('chillfetch').lib.create(opts);

test('SSR safe import', () => { assert.ok(loadSSR('chillfetch').create); });

test('baseURL, params, JSON parse, headers', async () => {
    const f = mockFetch([res(200, { ok: 1 })]);
    const api = mk({ baseURL: 'https://api.test/v1/', fetch: f, headers: { 'X-Test': 'a' } });
    const data = await api.get('/users', { params: { page: 2, tag: ['a', 'b'], skip: undefined, q: 'x y' } });
    assert.equal(data.ok, 1);
    assert.equal(f.calls[0].url, 'https://api.test/v1/users?page=2&tag=a&tag=b&q=x%20y');
    assert.equal(f.calls[0].init.method, 'GET');
    assert.equal(f.calls[0].init.headers['x-test'], 'a');
});

test('absolute URL ignores baseURL; existing query string is extended', async () => {
    const { lib } = load('chillfetch');
    assert.equal(lib.buildURL('https://b.test', 'https://other.test/x?a=1', { b: 2 }), 'https://other.test/x?a=1&b=2');
    assert.equal(lib.buildURL('', '/p', { a: 1 }), '/p?a=1');
});

test('post serialises objects as JSON; string bodies untouched', async () => {
    const f = mockFetch([res(200, { id: 1 })]);
    const api = mk({ fetch: f });
    await api.post('/x', { a: 1 });
    assert.equal(f.calls[0].init.body, '{"a":1}');
    assert.equal(f.calls[0].init.headers['content-type'], 'application/json');
    await api.post('/x', 'a=1', { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    assert.equal(f.calls[1].init.body, 'a=1');
    assert.equal(f.calls[1].init.headers['content-type'], 'application/x-www-form-urlencoded');
});

test('HTTP error throws ChillFetchError with status and data', async () => {
    const api = mk({ fetch: mockFetch([res(404, { message: 'nope' })]) });
    await assert.rejects(api.get('/x'), e => {
        assert.equal(e.name, 'ChillFetchError');
        assert.equal(e.status, 404); assert.equal(e.data.message, 'nope'); assert.equal(e.code, 'HTTP_ERROR');
        return true;
    });
});

test('204 resolves null; text responseType', async () => {
    const api = mk({ fetch: mockFetch([res(204, undefined)]) });
    assert.equal(await api.delete('/x'), null);
    const api2 = mk({ fetch: mockFetch([res(200, '{"a":1}', { 'content-type': 'application/json' })]) });
    assert.equal(await api2.get('/x', { responseType: 'text' }), '{"a":1}');
});

test('retries with backoff on 503 and network errors, not on 404 or POST', async () => {
    const f = mockFetch([res(503, 'x'), new TypeError('fail'), res(200, { done: true })]);
    const api = mk({ fetch: f, retries: 3, retryDelay: 1, timeout: 0 });
    const d = await api.get('/x');
    assert.equal(d.done, true); assert.equal(f.calls.length, 3);

    const f2 = mockFetch([res(404, 'x'), res(200, 'ok')]);
    await assert.rejects(mk({ fetch: f2, retries: 3, retryDelay: 1 }).get('/x'));
    assert.equal(f2.calls.length, 1);

    const f3 = mockFetch([res(500, 'x'), res(200, 'ok')]);
    await assert.rejects(mk({ fetch: f3, retries: 3, retryDelay: 1 }).post('/x', {}));
    assert.equal(f3.calls.length, 1);

    const f4 = mockFetch([res(500, 'x')]);
    await assert.rejects(mk({ fetch: f4, retries: 2, retryDelay: 1 }).get('/x'), e => e.status === 500 && e.attempt === 3);
    assert.equal(f4.calls.length, 3);
});

test('timeout rejects with TIMEOUT', async () => {
    const api = mk({ fetch: mockFetch([() => new Promise(() => {})]), timeout: 30 });
    await assert.rejects(api.get('/x'), e => e.code === 'TIMEOUT' && e.isTimeout);
});

test('timeout is retried', async () => {
    let n = 0;
    const f = mockFetch([() => (++n === 1 ? new Promise(() => {}) : res(200, { ok: 1 }))]);
    const api = mk({ fetch: f, timeout: 20, retries: 1, retryDelay: 1 });
    const d = await api.get('/x');
    assert.equal(d.ok, 1);
});

test('abort via signal', async () => {
    const { lib, window } = load('chillfetch');
    const api = lib.create({ fetch: mockFetch([() => new Promise(() => {})]), timeout: 0 });
    const ac = new window.AbortController();
    const p = api.get('/x', { signal: ac.signal });
    setTimeout(() => ac.abort(), 10);
    await assert.rejects(p, e => e.code === 'ABORT' && e.isAbort);
    await assert.rejects(api.get('/x', { signal: ac.signal }), e => e.code === 'ABORT');
});

test('abortAll aborts in-flight requests, abort is not retried', async () => {
    const f = mockFetch([() => new Promise(() => {})]);
    const api = mk({ fetch: f, timeout: 0, retries: 3, retryDelay: 1 });
    const p = api.get('/x');
    setTimeout(() => api.abortAll(), 10);
    await assert.rejects(p, e => e.code === 'ABORT');
    assert.equal(f.calls.length, 1);
});

test('interceptors: request mutate, response transform, error recover, eject', async () => {
    const f = mockFetch([res(200, { v: 1 }), res(500, 'boom')]);
    const api = mk({ fetch: f });
    const eject = api.interceptors.request.use(cfg => { cfg.headers.authorization = 'Bearer t'; return cfg; });
    api.interceptors.response.use(r => { r.data = { wrapped: r.data }; return r; });
    const d = await api.get('/a');
    assert.equal(d.wrapped.v, 1);
    assert.equal(f.calls[0].init.headers.authorization, 'Bearer t');
    eject();
    api.interceptors.error.use(e => (e.status === 500 ? { fallback: true } : undefined));
    const d2 = await api.get('/b');
    assert.equal(d2.fallback, true);
    assert.equal(f.calls[1].init.headers.authorization, undefined);
});

test('fullResponse and invalid JSON handling', async () => {
    const api = mk({ fetch: mockFetch([res(200, { a: 1 }, {})]) });
    const r = await api.get('/x', { fullResponse: true });
    assert.equal(r.status, 200); assert.equal(r.data.a, 1);
    const bad = mk({ fetch: mockFetch([res(200, '{oops', { 'content-type': 'application/json' })]) });
    await assert.rejects(bad.get('/x', { responseType: 'json' }), e => e.code === 'PARSE');
});

test('extend inherits defaults', async () => {
    const f = mockFetch([res(200, 'ok')]);
    const base = mk({ fetch: f, baseURL: 'https://a.test', headers: { a: '1' } });
    const child = base.extend({ headers: { b: '2' } });
    await child.get('/x');
    assert.equal(f.calls[0].init.headers.a, '1'); assert.equal(f.calls[0].init.headers.b, '2');
    assert.equal(f.calls[0].url, 'https://a.test/x');
});

test('no fetch available gives NETWORK error', async () => {
    const api = mk({});
    await assert.rejects(api.get('/x'), e => e.code === 'NETWORK');
});
