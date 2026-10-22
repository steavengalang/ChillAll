import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'fetch',
    global: 'ChillFetch',
    category: 'utility',
    title: 'Fetch',
    summary: 'A fetch wrapper with base URL, JSON, timeouts, retries with backoff, interceptors and typed errors.',
    style: 'create',
    description:
        'ChillFetch wraps the native `fetch()` with the things every app ends up writing: a base URL, JSON in and out, query-string building, timeouts, abort support, ' +
        'automatic retries with exponential backoff, request / response / error interceptors and one error class with a stable `code`.\n\n' +
        '`create()` returns a client; `get`, `post`, `put`, `patch`, `delete`, `head` and `options` resolve with the parsed body (or a full response object with `fullResponse: true`). ' +
        'Pass your own `fetch` option to test without a network or to add a polyfill. Every example on this page uses a fake `fetch`, so nothing leaves your browser.',
    features: [
        'Base URL, default headers, `params` query building and automatic JSON bodies and parsing',
        'Timeout (default 10 s), external `signal` and `abortAll()`, with distinct `TIMEOUT` and `ABORT` codes',
        'Retries with exponential backoff, jitter and `Retry-After` support; POST and PATCH are not retried by default',
        'Request, response and error interceptors, including recovering from an error with a fallback value',
        'A single `ChillFetch.Error` with `status`, `data`, `code` and `attempt`; injectable `fetch` for tests',
    ],
    examples: [
        {
            id: 'basic',
            title: 'GET, POST and parsed JSON',
            description: 'Relative URLs are joined to `baseURL`, `params` becomes a query string (arrays repeat the key) and object bodies are sent as JSON. The fake `fetch` below stands in for a real API.',
            code: `const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const seen = [];
const fakeFetch = async (url, init) => {
  seen.push(init.method + ' ' + url + (init.body ? '  body=' + init.body : ''));
  if (init.method === 'POST') return json({ id: 3, ...JSON.parse(init.body) }, 201);
  return json([{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]);
};
const api = ChillFetch.create({ baseURL: 'https://api.example.com/v1', fetch: fakeFetch });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;word-break:break-all;min-height:90px';
out.textContent = 'Press a button';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
const show = (label, data) => { out.textContent = seen[seen.length - 1] + '\\n' + label + ' -> ' + JSON.stringify(data); };
row.append(
  ChillButton.create({ text: 'GET /users', size: 'sm', onClick: async () => show('data', await api.get('/users', { params: { page: 2, tag: ['a', 'b'], skip: null } })) }),
  ChillButton.create({ text: 'POST /users', size: 'sm', variant: 'secondary', onClick: async () => show('created', await api.post('/users', { name: 'Grace' })) }),
);
root.append(row, out);`,
            height: 200,
        },
        {
            id: 'interceptors',
            title: 'Interceptors',
            description: 'Request interceptors can edit the config (add an auth header), response interceptors can reshape the result, and error interceptors can recover by returning a fallback value.',
            code: `const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
let sentAuth = '';
const fakeFetch = async (url, init) => {
  sentAuth = init.headers.authorization;
  return url.includes('/broken') ? json({ message: 'boom' }, 500) : json({ data: { plan: 'pro' } });
};
const api = ChillFetch.create({ baseURL: 'https://api.example.com', fetch: fakeFetch });
api.interceptors.request.use((cfg) => { cfg.headers.authorization = 'Bearer demo-token'; return cfg; });
api.interceptors.response.use((res) => ({ ...res, data: res.data.data }));            // unwrap the envelope
api.interceptors.error.use((err) => (err.status === 500 ? { plan: 'free (fallback)' } : undefined));   // recover
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;min-height:60px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'GET /account', size: 'sm', onClick: async () => { const r = await api.get('/account'); out.textContent = 'result -> ' + JSON.stringify(r) + '\\nAuthorization sent -> ' + sentAuth; } }),
  ChillButton.create({ text: 'GET /broken', size: 'sm', variant: 'outline', onClick: async () => { const r = await api.get('/broken'); out.textContent = 'recovered from HTTP 500 -> ' + JSON.stringify(r); } }),
);
root.append(row, out);`,
            height: 180,
        },
        {
            id: 'retries-errors',
            title: 'Retries and typed errors',
            description: 'The flaky endpoint fails twice with 503, then succeeds: `retries: 2` hides it. A 404 is not retried and becomes a `ChillFetch.Error` carrying `status` and `data`.',
            code: `const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
let hits = 0;
const fakeFetch = async (url) => {
  if (url.includes('/flaky')) return ++hits < 3 ? json({ error: 'busy' }, 503) : json({ ok: true, attempts: hits });
  return json({ error: 'No such report' }, 404);
};
const api = ChillFetch.create({ baseURL: 'https://api.example.com', fetch: fakeFetch, retries: 2, retryDelay: 40 });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;min-height:70px';
out.textContent = 'Press a button';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'Flaky endpoint', size: 'sm', onClick: async () => { hits = 0; out.textContent = 'success after retries -> ' + JSON.stringify(await api.get('/flaky')); } }),
  ChillButton.create({ text: 'Missing report', size: 'sm', variant: 'danger', onClick: async () => {
    try { await api.get('/reports/42'); } catch (e) { out.textContent = (e instanceof ChillFetch.Error) + '  code=' + e.code + '  status=' + e.status + '  attempt=' + e.attempt + '\\ndata=' + JSON.stringify(e.data) + '\\nmessage: ' + e.message; }
  } }),
);
root.append(row, out);`,
            height: 190,
        },
        {
            id: 'timeout-abort',
            title: 'Timeouts and aborting',
            description: 'A request that never answers is cut off by `timeout` (code `TIMEOUT`). Your own `AbortController` signal, or `abortAll()`, produces code `ABORT`. Both reject quickly even if the underlying `fetch` ignores the signal.',
            code: `const hang = () => new Promise(() => {});              // a server that never responds
const api = ChillFetch.create({ fetch: hang, timeout: 150 });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;min-height:70px';
out.textContent = 'Press a button';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
const report = (e) => { out.textContent = 'code=' + e.code + '  isTimeout=' + e.isTimeout + '  isAbort=' + e.isAbort + '\\n' + e.message; };
row.append(
  ChillButton.create({ text: 'Request (150ms timeout)', size: 'sm', onClick: () => api.get('/slow').catch(report) }),
  ChillButton.create({ text: 'Request then abortAll()', size: 'sm', variant: 'outline', onClick: () => { const p = api.get('/slow', { timeout: 0 }).catch(report); setTimeout(() => api.abortAll(), 100); return p; } }),
  ChillButton.create({ text: 'External signal', size: 'sm', variant: 'ghost', onClick: () => { const ctl = new AbortController(); const p = api.get('/slow', { signal: ctl.signal, timeout: 0 }).catch(report); ctl.abort(); return p; } }),
);
root.append(row, out);
cleanup(() => api.abortAll());`,
            height: 190,
        },
        {
            id: 'full-response',
            title: 'Full responses and URL helpers',
            description: '`fullResponse: true` resolves `{ data, status, statusText, headers, response, config }`. `responseType` forces text, blob and others. `buildURL()` and `buildQuery()` are exposed for your own use.',
            code: `const fakeFetch = async () => new Response('plain text body', { status: 200, statusText: 'OK', headers: { 'content-type': 'text/plain', 'x-request-id': 'req-123' } });
const api = ChillFetch.create({ baseURL: 'https://api.example.com', fetch: fakeFetch });
const full = await api.get('/ping', { fullResponse: true });
const text = await api.get('/ping', { responseType: 'text' });
const lines = [
  'status         -> ' + full.status + ' ' + full.statusText,
  'x-request-id   -> ' + full.headers.get('x-request-id'),
  'data           -> ' + JSON.stringify(full.data),
  'responseType   -> ' + JSON.stringify(text),
  'buildQuery     -> ' + ChillFetch.buildQuery({ q: 'a b', tags: ['x', 'y'], page: 1, empty: undefined }),
  'buildURL       -> ' + ChillFetch.buildURL('https://api.example.com/v1/', '/items?sort=asc', { page: 2 }),
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;word-break:break-all';
pre.textContent = lines.join('\\n');
root.append(pre);`,
            height: 190,
        },
    ],
    guides: [
        {
            title: 'Clients, defaults and extend()',
            body:
                'Create one client per API and share it:\n\n' +
                '```js\nconst api = ChillFetch.create({ baseURL: \'https://api.example.com\', timeout: 8000, retries: 2, headers: { \'x-app\': \'docs\' } });\nconst users = await api.get(\'/users\', { params: { page: 2 } });\nconst made = await api.post(\'/users\', { name: \'Ada\' });\n```\n\n' +
                'Every option can be overridden per request. `api.extend({ ... })` returns a new client that inherits the defaults **and a copy of the interceptors**, which suits an admin API that shares the base configuration. Header names are case-insensitive and merged with the defaults.\n\n' +
                'Plain-object and array bodies are JSON-encoded and get `content-type: application/json`; `FormData`, `Blob` and strings are sent untouched. `json: value` is a shortcut that works on any method.',
        },
        {
            title: 'Retry rules and error handling',
            body:
                'A failed attempt is retried (up to `retries` times) when the method is in `retryMethods` (GET, HEAD, OPTIONS, PUT, DELETE by default) and the failure is a network error, a timeout, or an HTTP status in `retryOn`. ' +
                'Delay starts at `retryDelay`, multiplies by `retryFactor` each attempt, is capped by `retryMaxDelay`, has jitter, and honours a `Retry-After` header. Provide `shouldRetry(error, attempt)` to take over the decision; aborts are never retried.\n\n' +
                'Every failure is a `ChillFetch.Error` with `code` set to `HTTP_ERROR`, `TIMEOUT`, `ABORT`, `NETWORK` or `PARSE`:\n\n' +
                '```js\ntry { await api.get(\'/missing\'); }\ncatch (e) { if (e instanceof ChillFetch.Error) console.log(e.code, e.status, e.data); }\n```\n\n' +
                'Error interceptors run in order: return nothing to rethrow, an `Error` to replace it, or any other value to **recover** (the call then resolves with that value).',
        },
    ],
    options: [
        { name: 'baseURL', type: 'string', default: "''", description: 'Prepended to relative URLs (absolute URLs are left alone).' },
        { name: 'headers', type: 'object', default: '{}', description: 'Default headers. Names are case-insensitive; merged per request.' },
        { name: 'timeout', type: 'number', default: '10000', description: 'Milliseconds before rejecting with `TIMEOUT`. `0` disables.' },
        { name: 'retries', type: 'number', default: '0', description: 'Extra attempts for network errors, timeouts and `retryOn` statuses.' },
        { name: 'retryDelay', type: 'number', default: '300', description: 'First backoff delay in ms.' },
        { name: 'retryFactor', type: 'number', default: '2', description: 'Backoff multiplier per attempt.' },
        { name: 'retryMaxDelay', type: 'number', default: '10000', description: 'Upper bound for the backoff delay in ms.' },
        { name: 'retryOn', type: 'number[]', default: '[408, 425, 429, 500, 502, 503, 504]', description: 'HTTP statuses that may be retried.' },
        { name: 'retryMethods', type: 'string[]', default: "['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']", description: 'Methods allowed to retry. POST and PATCH only if you add them.' },
        { name: 'shouldRetry', type: '(error, attempt) => boolean', default: 'null', description: 'Overrides the retry decision (aborts still never retry).' },
        { name: 'responseType', type: "'auto' | 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'response'", default: "'auto'", description: '`auto` parses JSON when the content type says so, otherwise returns text.' },
        { name: 'params', type: 'object', default: 'null', description: 'Query string parameters. Arrays repeat the key; `null` / `undefined` values are skipped.' },
        { name: 'signal', type: 'AbortSignal', default: '-', description: 'Abort from outside; rejects with code `ABORT`.' },
        { name: 'validateStatus', type: '(status: number) => boolean', default: 's => s >= 200 && s < 300', description: 'Decides whether a status is a success.' },
        { name: 'json', type: 'any', default: '-', description: 'Shortcut: JSON-stringify as the body and set the content type.' },
        { name: 'fullResponse', type: 'boolean', default: 'false', description: 'Resolve `{ data, status, statusText, headers, response, config }` instead of only the data.' },
        { name: 'fetch', type: 'typeof fetch', default: 'global fetch', description: 'Custom fetch implementation (tests, polyfills, instrumentation).' },
        { name: 'method / body / credentials / mode / cache ...', type: 'RequestInit', default: '-', description: 'Any other `fetch()` init option is passed through.' },
    ],
    methods: [
        { signature: 'ChillFetch.create(options)', on: 'static', description: 'Create a client with these defaults.' },
        { signature: 'ChillFetch.buildURL(base, url, params?)', on: 'static', description: 'Join a base and a URL and append `params`.' },
        { signature: 'ChillFetch.buildQuery(params)', on: 'static', description: 'Encode an object as a query string (no leading `?`).' },
        { signature: 'ChillFetch.Error', description: 'Error class (a property): `name`, `message`, `status`, `statusText`, `data`, `response`, `config`, `code`, `attempt`, plus `isTimeout`, `isAbort`, `isNetwork`.' },
        { signature: 'client.request(url, options?)', description: 'Generic request; set `method` in options. Resolves with data (or the full result).' },
        { signature: 'client.get / head / delete / options(url, options?)', description: 'Shorthand for the matching HTTP method.' },
        { signature: 'client.post / put / patch(url, body, options?)', description: 'Shorthand with a body; plain objects and arrays are JSON-encoded.' },
        { signature: 'client.interceptors.request.use(fn)', description: 'Edit the config before sending (sync or async). Return the config, or nothing to keep it. Returns an eject function.' },
        { signature: 'client.interceptors.response.use(fn)', description: 'Transform the result `{ data, status, ... }`. Returns an eject function.' },
        { signature: 'client.interceptors.error.use(fn)', description: 'Handle errors: return nothing to rethrow, an Error to replace, any other value to recover. Returns an eject function.' },
        { signature: 'client.extend(options)', description: 'New client inheriting defaults and a copy of the interceptors.' },
        { signature: 'client.abortAll()', description: 'Abort every in-flight request of this client (code `ABORT`).' },
        { signature: 'client.defaults', description: 'The merged default configuration object.' },
    ],
    a11y: [
        'No UI. Reflect request state in your own interface: busy indicators with `aria-busy`, results and errors in an `aria-live` region.',
        'Turn `ChillFetch.Error` codes into friendly, actionable messages instead of showing raw status text.',
    ],
    tips: [
        'The module only needs a global `fetch`; on older runtimes pass one with the `fetch` option.',
        'Server rendering: safe to import; pass an absolute `baseURL` because relative URLs do not resolve on the server.',
        'Use `AbortController` on route changes (or `abortAll()`) to cancel requests whose results nobody will see.',
        'Do not retry non-idempotent POST requests unless the endpoint is idempotent; add `POST` to `retryMethods` deliberately.',
        'Tests: provide a fake `fetch` returning `new Response(...)`, exactly like the examples on this page.',
    ],
    related: ['events', 'toolkit', 'provider', 'storage'],
    keywords: ['http', 'ajax', 'xhr', 'axios', 'request', 'api client', 'retry', 'timeout', 'interceptors'],
};

export default doc;
