import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'toolkit',
    global: 'ChillToolkit',
    category: 'utility',
    title: 'Toolkit',
    summary: 'Small pure helpers: debounce, throttle, formatBytes, slugify, escapeHtml, deepMerge, uid and more.',
    style: 'static',
    description:
        'ChillToolkit is a collection of the little functions every UI project needs: rate limiting (`debounce`, `throttle`, `rafThrottle`), formatting (`formatBytes`, `formatNumber`, `slugify`), ' +
        'HTML escaping, safe `deepMerge` / `deepClone`, `uid`, `clamp`, `sleep` and `once`.\n\n' +
        'Everything is pure and lazy: nothing touches `window` or `document` at import time, so it is safe on the server. Destructure what you need: `const { debounce, formatBytes } = ChillToolkit;`.',
    features: [
        '`debounce` (with `leading` / `trailing`, `cancel`, `flush`, `pending`) and `throttle` with `cancel`',
        '`rafThrottle` coalesces calls to one per animation frame',
        '`formatBytes`, `formatNumber` (Intl, compact notation) and `slugify` that strips diacritics',
        '`escapeHtml` / `unescapeHtml` and a prototype-pollution-safe `deepMerge`',
        '`uid`, `clamp`, abortable `sleep`, `once`, `isPlainObject`, `isBrowser`, `noop`',
    ],
    examples: [
        {
            id: 'debounce-throttle',
            title: 'Debounce vs throttle',
            description: 'Type quickly in the box: the raw handler runs on every key, `throttle` at most every 300 ms, and `debounce` only after you pause for 300 ms. Debounced functions also expose `cancel()` and `flush()`.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Type fast here...';
input.setAttribute('aria-label', 'Typing area');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const table = document.createElement('div');
table.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px';
const counts = { raw: 0, throttled: 0, debounced: 0 };
const cells = {};
Object.keys(counts).forEach((k) => {
  const c = document.createElement('div');
  c.style.cssText = 'padding:10px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);text-align:center;font-size:13px';
  cells[k] = c; table.append(c);
});
const paint = () => Object.keys(counts).forEach((k) => (cells[k].textContent = k + ': ' + counts[k]));
const { debounce, throttle } = ChillToolkit;
const th = throttle(() => { counts.throttled++; paint(); }, 300);
const db = debounce(() => { counts.debounced++; paint(); }, 300);
const onInput = () => { counts.raw++; th(); db(); paint(); };
input.addEventListener('input', onInput);
root.append(input, table, ChillButton.create({ text: 'Flush pending debounce now', size: 'sm', variant: 'outline', onClick: () => db.flush() }));
paint();
cleanup(() => { input.removeEventListener('input', onInput); th.cancel(); db.cancel(); });`,
            height: 200,
        },
        {
            id: 'formatters',
            title: 'Format bytes, numbers and slugs',
            description: 'Edit the values and watch the output update. `formatBytes` defaults to 1024-based units (`binary: false` switches to 1000), `formatNumber` forwards any `Intl.NumberFormat` option, and `slugify` removes accents.',
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
const field = (label, value, format) => {
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;color:var(--chill-text);font-size:13px';
  const input = document.createElement('input');
  input.value = value;
  input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
  const out = document.createElement('code');
  out.style.cssText = 'padding:6px 8px;border-radius:6px;background:var(--chill-bg-secondary);border:1px solid var(--chill-border);min-height:20px';
  const update = () => (out.textContent = format(input.value));
  input.addEventListener('input', update);
  update();
  wrap.append(label, input, out);
  root.append(wrap);
};
const T = ChillToolkit;
field('formatBytes(bytes)', '1536000', (v) => T.formatBytes(Number(v)) + '  |  ' + T.formatBytes(Number(v), { binary: false, decimals: 2 }));
field('formatNumber(n, { compact })', '1234567.891', (v) => T.formatNumber(Number(v), { locale: 'en-US' }) + '  |  ' + T.formatNumber(Number(v), { locale: 'en-US', compact: true }));
field('slugify(text)', 'Crème Brûlée & Café au Lait!', (v) => T.slugify(v) + '  |  ' + T.slugify(v, { separator: '_' }));`,
            height: 200,
        },
        {
            id: 'escape-html',
            title: 'Escape HTML safely',
            description: '`escapeHtml` neutralises `& < > " \' \\`` so untrusted text can be placed in markup. `unescapeHtml` reverses it. The preview below renders the escaped string as markup, which shows the text literally.',
            code: `const dirty = '<img src=x onerror=alert(1)> Tom & "Jerry"';
const safe = ChillToolkit.escapeHtml(dirty);
root.style.cssText += ';display:flex;flex-direction:column;gap:8px';
const show = (label, value) => {
  const row = document.createElement('div');
  row.style.cssText = 'color:var(--chill-text);font-size:13px';
  const l = document.createElement('strong');
  l.textContent = label + ': ';
  const c = document.createElement('code');
  c.textContent = value;
  row.append(l, c);
  root.append(row);
};
show('input', dirty);
show('escapeHtml', safe);
show('unescapeHtml(escapeHtml(x)) === x', String(ChillToolkit.unescapeHtml(safe) === dirty));
const preview = document.createElement('div');
preview.style.cssText = 'padding:10px 14px;border:1px dashed var(--chill-border);border-radius:10px;color:var(--chill-text)';
preview.innerHTML = safe;       // safe: the markup was escaped
root.append(preview);`,
            height: 190,
        },
        {
            id: 'objects-ids',
            title: 'deepMerge, deepClone, uid, clamp, once',
            description: '`deepMerge` returns a new object (inputs untouched; arrays are replaced, not merged) and ignores `__proto__`. `deepClone` copies plain objects, arrays and dates. `once(fn)` runs its function a single time.',
            code: `const T = ChillToolkit;
const defaults = { theme: { mode: 'light', accent: 'blue' }, tags: ['a'], lang: 'en' };
const user = JSON.parse('{"theme":{"mode":"dark"},"tags":["x","y"],"__proto__":{"polluted":true}}');
const merged = T.deepMerge(defaults, user);
const copy = T.deepClone(defaults);
copy.theme.mode = 'changed';
const init = T.once(() => 'initialised at ' + new Date().toLocaleTimeString());
const lines = [
  'deepMerge        -> ' + JSON.stringify(merged),
  'polluted?        -> ' + ({}).polluted,
  'defaults intact  -> ' + defaults.theme.mode + ' (clone edited: ' + copy.theme.mode + ')',
  'uid("user-")     -> ' + T.uid('user-'),
  'clamp(15, 0, 10) -> ' + T.clamp(15, 0, 10) + ', clamp(-3, 0, 10) -> ' + T.clamp(-3, 0, 10),
  'once x2          -> ' + (init() === init()),
  'isPlainObject    -> ' + T.isPlainObject({}) + ' / ' + T.isPlainObject([]) + ' / ' + T.isPlainObject(new Date()),
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;word-break:break-all';
pre.textContent = lines.join('\\n');
root.append(pre);`,
            height: 230,
        },
        {
            id: 'sleep-raf',
            title: 'sleep() and rafThrottle()',
            description: '`sleep(ms, signal?)` is an abortable delay (rejects with an `AbortError`). `rafThrottle(fn)` runs at most once per frame with the latest arguments, ideal for pointer and scroll handlers. Move the pointer over the box.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const pad = document.createElement('div');
pad.style.cssText = 'height:90px;border:1px dashed var(--chill-border);border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);display:flex;align-items:center;justify-content:center;font-family:ui-monospace,Consolas,monospace;font-size:13px;touch-action:none';
pad.textContent = 'Move the pointer here';
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-size:13px';
let moves = 0, frames = 0;
const paint = ChillToolkit.rafThrottle((x, y) => { frames++; pad.textContent = 'x=' + x + ' y=' + y + '   events: ' + moves + '   handled: ' + frames; });
const onMove = (e) => { moves++; paint(Math.round(e.offsetX), Math.round(e.offsetY)); };
pad.addEventListener('pointermove', onMove);
const ctl = new AbortController();
const run = async () => {
  status.textContent = 'Waiting 500 ms...';
  const t0 = Date.now();
  try { await ChillToolkit.sleep(500, ctl.signal); status.textContent = 'sleep resolved after ' + (Date.now() - t0) + ' ms'; }
  catch (e) { status.textContent = 'sleep rejected: ' + e.name; }
};
root.append(pad, ChillButton.create({ text: 'await sleep(500)', size: 'sm', onClick: run }), status);
cleanup(() => { ctl.abort(); paint.cancel(); pad.removeEventListener('pointermove', onMove); });`,
            height: 220,
        },
    ],
    guides: [
        {
            title: 'Debounce, throttle and when to use which',
            body:
                '- **`debounce(fn, wait, { leading, trailing })`** waits until calls stop for `wait` ms (trailing edge by default). Use it for search-as-you-type and autosave. Set `leading: true` to also fire on the first call. `.cancel()` drops the pending call, `.flush()` runs it immediately and `.pending()` tells you if one is waiting.\n' +
                '- **`throttle(fn, wait, { leading, trailing })`** guarantees at most one call per `wait` ms and keeps the last call for the trailing edge. Use it for scroll, resize and drag handlers.\n' +
                '- **`rafThrottle(fn)`** schedules one call per animation frame with the latest arguments, falling back to a 16 ms timer without `requestAnimationFrame`.\n\n' +
                'Always `cancel()` pending calls on teardown so they do not run after your component is gone.',
        },
        {
            title: 'Formatting helpers',
            body:
                '`formatBytes(1536)` gives `"1.5 KB"`. Units are 1024-based with `KB` / `MB` labels by default; pass `{ binary: false }` for 1000-based `kB` / `MB`, `decimals` (default 1) and a `locale`. ' +
                '`formatNumber(n, options)` forwards every `Intl.NumberFormat` option (`style: \'currency\'`, `currency`, ...), plus `compact: true` as shorthand for compact notation and `locale`.\n\n' +
                '`slugify(\'Héllo Wörld!\')` gives `"hello-world"`: it strips accents, turns `&` into "and", collapses other symbols into the separator and trims it. Options: `separator` (default `-`) and `lower` (default `true`). ' +
                'Note that characters outside Latin letters and digits (for example Cyrillic or CJK) are dropped.',
        },
    ],
    options: [
        { name: 'debounce: leading', type: 'boolean', default: 'false', description: 'Also invoke on the first call of a burst.' },
        { name: 'debounce: trailing', type: 'boolean', default: 'true', description: 'Invoke after the wait with the latest arguments.' },
        { name: 'throttle: leading', type: 'boolean', default: 'true', description: 'Invoke immediately on the first call.' },
        { name: 'throttle: trailing', type: 'boolean', default: 'true', description: 'Invoke once more at the end of the window with the latest arguments.' },
        { name: 'formatBytes: decimals', type: 'number', default: '1', description: 'Maximum fraction digits.' },
        { name: 'formatBytes: binary', type: 'boolean', default: 'true', description: '`false` uses 1000-based units (`kB`, `MB`).' },
        { name: 'formatBytes / formatNumber: locale', type: 'string', default: 'browser locale', description: 'BCP 47 locale for number formatting.' },
        { name: 'formatNumber: compact', type: 'boolean', default: 'false', description: 'Use compact notation (1.2M). Any other Intl.NumberFormat option is also accepted.' },
        { name: 'slugify: separator', type: 'string', default: "'-'", description: 'Character(s) between words.' },
        { name: 'slugify: lower', type: 'boolean', default: 'true', description: 'Lower-case the result.' },
    ],
    methods: [
        { signature: 'ChillToolkit.debounce(fn, wait?, options?)', on: 'static', description: 'Returns a debounced function with `.cancel()`, `.flush()` and `.pending()`.' },
        { signature: 'ChillToolkit.throttle(fn, wait?, options?)', on: 'static', description: 'Returns a throttled function with `.cancel()`.' },
        { signature: 'ChillToolkit.rafThrottle(fn)', on: 'static', description: 'One call per animation frame, last arguments win. Has `.cancel()`.' },
        { signature: 'ChillToolkit.uid(prefix?)', on: 'static', description: 'Unique id (prefix defaults to `chill-`). Not cryptographically secure.' },
        { signature: 'ChillToolkit.clamp(n, min, max)', on: 'static', description: 'Restrict a number to a range (swaps reversed bounds; `NaN` returns `min`).' },
        { signature: 'ChillToolkit.formatBytes(bytes, options?)', on: 'static', description: 'Human-readable size such as `1.5 KB`.' },
        { signature: 'ChillToolkit.formatNumber(n, options?)', on: 'static', description: 'Locale-aware number formatting via `Intl.NumberFormat`.' },
        { signature: 'ChillToolkit.slugify(text, options?)', on: 'static', description: 'URL-safe slug that strips diacritics.' },
        { signature: 'ChillToolkit.escapeHtml(text) / unescapeHtml(text)', on: 'static', description: 'Escape or restore `& < > " \' \\``.' },
        { signature: 'ChillToolkit.deepMerge(...sources)', on: 'static', description: 'Merge plain objects into a new object. Arrays and non-plain values are replaced. Ignores `__proto__`, `constructor`, `prototype`.' },
        { signature: 'ChillToolkit.deepClone(value)', on: 'static', description: 'Clone plain objects, arrays and `Date`s.' },
        { signature: 'ChillToolkit.sleep(ms, signal?)', on: 'static', description: 'Promise delay; rejects with an `AbortError` if the signal aborts.' },
        { signature: 'ChillToolkit.once(fn)', on: 'static', description: 'Run `fn` only on the first call; later calls return the first result.' },
        { signature: 'ChillToolkit.isPlainObject(value)', on: 'static', description: '`true` for object literals and `Object.create(null)` objects.' },
        { signature: 'ChillToolkit.isBrowser()', on: 'static', description: '`true` when `window` and `document` exist.' },
        { signature: 'ChillToolkit.noop()', on: 'static', description: 'A function that does nothing.' },
    ],
    a11y: [
        'Debounce search-as-you-type results, but announce updates (`aria-live="polite"`) so screen reader users learn that the list changed.',
        'Throttling or debouncing keyboard handlers can feel laggy; keep waits short for anything the user types.',
        'Escaping is not a substitute for sanitising rich HTML; prefer `textContent` when you can.',
    ],
    tips: [
        'The module is SSR-safe: every function is pure and nothing touches the DOM at import time.',
        'Use `formatNumber` with `style: \'currency\'` for prices instead of hand-rolled formatting.',
        'Debounced and throttled functions keep the `this` and arguments of the latest call.',
        '`deepClone` leaves functions, Maps, Sets and class instances by reference.',
        '`uid()` is for DOM ids and keys, not security tokens: use `crypto.randomUUID()` for those.',
    ],
    related: ['fetch', 'events', 'animate', 'storage'],
    keywords: ['utils', 'helpers', 'lodash', 'debounce', 'throttle', 'slug', 'bytes', 'format', 'escape html', 'deep merge'],
};

export default doc;
