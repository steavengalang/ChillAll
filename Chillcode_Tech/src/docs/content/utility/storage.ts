import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'storage',
    global: 'ChillStorage',
    category: 'utility',
    title: 'Storage',
    summary: 'Typed localStorage / sessionStorage wrapper with JSON, namespaces, TTL, events and memory fallback.',
    style: 'create',
    description:
        'ChillStorage makes browser storage pleasant and safe. Values are stored as JSON, keys can be namespaced, entries can expire after a number of seconds, ' +
        'and subscribers are notified of changes made in this tab **and** other tabs.\n\n' +
        'If the requested storage is blocked (private mode, disabled cookies, quota, server rendering) it quietly falls back to an in-memory store; `store.backend` tells you what is actually in use. ' +
        'Values that were not written by ChillStorage (plain strings or raw JSON) are still readable.',
    features: [
        'JSON serialisation for objects, arrays, numbers and booleans',
        'Namespaces (`app:key`) keep libraries and apps from colliding',
        'Per-store and per-key TTL in seconds, with `ttl()`, `touch()` and `purgeExpired()`',
        '`subscribe()` to one key or all keys, including cross-tab updates',
        'Automatic fallback to memory when storage is unavailable, plus an `onError` hook',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Store and read objects',
            description: 'Objects are serialised for you. Reload the page and the profile is still there, because the demo namespace lives in `localStorage` until you leave.',
            code: `const store = ChillStorage.create({ namespace: 'docs-demo' });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const input = document.createElement('input');
input.type = 'text';
input.value = 'Ada Lovelace';
input.setAttribute('aria-label', 'Name');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
const show = () => {
  out.textContent = 'backend: ' + store.backend + '\\nget("profile") -> ' + JSON.stringify(store.get('profile')) + '\\nget("missing", "n/a") -> ' + store.get('missing', 'n/a') + '\\nkeys() -> ' + JSON.stringify(store.keys());
};
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'Save profile', size: 'sm', onClick: () => { store.set('profile', { name: input.value, visits: (store.get('profile', { visits: 0 }).visits) + 1 }); show(); } }),
  ChillButton.create({ text: 'Remove', size: 'sm', variant: 'outline', onClick: () => { store.remove('profile'); show(); } }),
);
root.append(input, row, out);
show();
cleanup(() => { store.clear(); store.destroy(); });`,
            height: 230,
        },
        {
            id: 'ttl',
            title: 'Expiring values',
            description: 'Set a TTL in seconds per key (or per store). `ttl(key)` reports the remaining time and `touch(key, seconds)` renews it. Expired values read as missing.',
            code: `const store = ChillStorage.create({ namespace: 'docs-ttl', type: 'memory' });
store.set('otp', '482913', { ttl: 8 });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('div');
out.style.cssText = 'padding:14px 18px;border:1px solid var(--chill-border);border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:14px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'New code (8s)', size: 'sm', onClick: () => store.set('otp', String(Math.floor(100000 + Math.random() * 900000)), { ttl: 8 }) }),
  ChillButton.create({ text: 'Touch +8s', size: 'sm', variant: 'outline', onClick: () => store.touch('otp', 8) }),
);
root.append(out, row);
const tick = () => {
  const left = store.ttl('otp');
  out.textContent = store.has('otp') ? 'otp = ' + store.get('otp') + '  (expires in ' + (left ? left.toFixed(1) : '?') + 's)' : 'otp expired, get() -> ' + store.get('otp', 'null');
};
tick();
const timer = setInterval(tick, 200);
cleanup(() => { clearInterval(timer); store.destroy(); });`,
            height: 150,
        },
        {
            id: 'subscribe',
            title: 'Subscribe to changes',
            description: 'Handlers receive `(value, oldValue, key)`. Subscribe to one key or to the whole namespace. In other tabs the same handler fires through the `storage` event.',
            code: `const store = ChillStorage.create({ namespace: 'docs-sub', type: 'session' });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding:10px 14px 10px 30px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;font-family:ui-monospace,Consolas,monospace;min-height:80px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, log);
const off = store.subscribe((value, old, key) => {
  const li = document.createElement('li');
  li.textContent = key === null ? 'cleared' : key + ': ' + JSON.stringify(old) + ' -> ' + JSON.stringify(value);
  log.prepend(li);
});
let n = 0;
row.append(
  ChillButton.create({ text: 'Increment', size: 'sm', onClick: () => store.set('counter', ++n) }),
  ChillButton.create({ text: 'Set theme', size: 'sm', variant: 'secondary', onClick: () => store.set('theme', n % 2 ? 'dark' : 'light') }),
  ChillButton.create({ text: 'Clear', size: 'sm', variant: 'outline', onClick: () => store.clear() }),
);
cleanup(() => { off(); store.clear(); store.destroy(); });`,
            height: 220,
        },
        {
            id: 'purge-entries',
            title: 'Entries, purge and fallback',
            description: '`entries()` lists live pairs, `purgeExpired()` physically deletes expired ones and returns how many. Asking for an unusable storage type falls back to memory, visible in `backend`.',
            code: `const store = ChillStorage.create({ namespace: 'docs-purge', type: 'memory', onError: (err, op) => console.warn(op, err) });
store.set('keep', { a: 1 });
store.set('short', 'gone soon', { ttl: 0.05 });
store.set('forever', [1, 2, 3]);
await new Promise((r) => setTimeout(r, 120));
const lines = [
  'backend -> ' + store.backend,
  'ChillStorage.isSupported("local") -> ' + ChillStorage.isSupported('local'),
  'has("short") -> ' + store.has('short'),
  'purgeExpired() removed -> ' + store.purgeExpired(),
  'entries() -> ' + JSON.stringify(store.entries()),
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
pre.textContent = lines.join('\\n');
root.append(pre);
cleanup(() => store.destroy());`,
            height: 170,
        },
    ],
    guides: [
        {
            title: 'Namespaces, types and TTL',
            body:
                '```js\nconst store = ChillStorage.create({ namespace: \'myapp\', type: \'local\', ttl: 3600 });\nstore.set(\'user\', { id: 1 });                 // expires in 1h (store default)\nstore.set(\'token\', \'abc\', { ttl: 60 });       // 60 seconds\nstore.set(\'pinned\', true, { ttl: 0 });        // never expires (overrides default)\n```\n\n' +
                'Keys are stored as `namespace:key`. `type` is `local`, `session` or `memory`. ' +
                'Expired entries are removed lazily on `get()` / `has()` / `keys()`; call `purgeExpired()` to sweep the whole namespace. ' +
                'Setting a value to `undefined` removes the key.',
        },
        {
            title: 'Errors and cross-tab events',
            body:
                '`set()` returns `true` when the value was written and `false` for quota or serialisation errors (for example a circular object); the error goes to `onError(error, op)` if provided. ' +
                'Handlers that throw are reported to `onError` with `op = "subscribe"` and never break other handlers.\n\n' +
                'Subscribers are called after local writes and also when another tab changes a key you own. `clear()` (here or in another tab) calls handlers with `(null, null, null)`. ' +
                'Call `destroy()` to remove the `storage` listener when you are done.',
        },
    ],
    options: [
        { name: 'namespace', type: 'string', default: "''", description: 'Prefix for every key (`namespace:key`).' },
        { name: 'type', type: "'local' | 'session' | 'memory'", default: "'local'", description: 'Which storage to use. Unavailable storage falls back to memory.' },
        { name: 'ttl', type: 'number', default: '0', description: 'Default time to live in seconds. `0` means never expires.' },
        { name: 'onError', type: '(error: Error, op: string) => void', default: 'null', description: 'Called for quota, serialisation and subscriber errors.' },
        { name: 'set(...) opts.ttl', type: 'number', default: 'store ttl', description: 'Per-key TTL in seconds; `0` disables expiry for that key.' },
    ],
    methods: [
        { signature: 'ChillStorage.create(options)', on: 'static', description: 'Create a store instance.' },
        { signature: 'ChillStorage.isSupported(type?)', on: 'static', description: '`true` when `local` (default) or `session` storage is usable.' },
        { signature: 'store.get(key, fallback?)', description: 'Value, or the fallback (default `null`) when missing or expired.' },
        { signature: 'store.set(key, value, { ttl? })', description: 'Store a JSON value. Returns `true` on success. `undefined` removes the key.' },
        { signature: 'store.has(key)', description: '`true` if the key exists and is not expired.' },
        { signature: 'store.remove(key)', description: 'Delete a key and notify subscribers.' },
        { signature: 'store.keys() / entries()', description: 'Live keys of this namespace / `[key, value]` pairs.' },
        { signature: 'store.clear()', description: 'Remove every key of this namespace (other namespaces are untouched).' },
        { signature: 'store.ttl(key)', description: 'Remaining seconds, or `null` when the key does not expire or does not exist.' },
        { signature: 'store.touch(key, ttlSeconds?)', description: 'Renew the expiry of an existing key. Returns `false` if the key is missing.' },
        { signature: 'store.purgeExpired()', description: 'Delete all expired entries; returns the count.' },
        { signature: 'store.subscribe([key], fn)', description: 'Listen with `fn(value, oldValue, key)`. Returns an unsubscribe function.' },
        { signature: 'store.backend', description: 'Property: `local`, `session` or `memory`, whichever is actually used.' },
        { signature: 'store.destroy()', description: 'Remove the cross-tab listener and all subscribers.' },
    ],
    a11y: [
        'No UI. Never store secrets or personal data in web storage: it is readable by any script on the page.',
        'Respect user privacy expectations: use `session` or short TTLs for sensitive-looking state.',
    ],
    tips: [
        'SSR-safe: on the server the store transparently uses memory, so the same code runs everywhere.',
        'Memory and private-mode fallbacks are lost on reload, so check `store.backend` if persistence matters.',
        'Use a unique `namespace` per app or feature to avoid colliding with other scripts on the same origin.',
        'For structured app settings with defaults, ChillConfig builds on the same idea with deep merge and dotted paths.',
    ],
    related: ['config', 'provider', 'theme', 'events'],
    keywords: ['localstorage', 'sessionstorage', 'persist', 'cache', 'ttl', 'expire', 'json', 'cross-tab'],
};

export default doc;
