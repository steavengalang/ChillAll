import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'provider',
    global: 'ChillProvider',
    category: 'utility',
    title: 'Provider',
    summary: 'Named, observable configuration stores with deep merge, dotted paths and safe defaults.',
    style: 'static',
    description:
        'ChillProvider creates named configuration stores that any part of your app can look up by name. Set a value in one place, subscribe in another, ' +
        'and everything stays in sync without a framework context or global variables of your own.\n\n' +
        'Each store keeps a deep-cloned copy of its defaults so `reset()` always restores the original, supports dotted paths (`ui.density`) and deep `merge()`, ' +
        'and ignores `__proto__`, `constructor` and `prototype` keys everywhere. A listener that throws never prevents the others from running. ' +
        'For persistence across reloads see ChillConfig.',
    features: [
        'Global registry: `create(name, defaults)` once, `get(name)` from anywhere',
        'Dotted paths for `get()` and `set()`, plus deep `merge()` for partial updates',
        '`subscribe()` with the list of changed keys and an `immediate` option',
        'Defaults are deep-cloned so `reset()` really resets',
        'Prototype-pollution safe, and listener errors are isolated',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Create, read and set',
            description: '`create()` registers a named store. `get()` and `set()` accept dotted paths, and `has()` tells you if a path exists.',
            code: `const ui = ChillProvider.create('docs-ui', { density: 'comfortable', nested: { accent: 'blue', radius: 8 } });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px';
const show = () => {
  out.textContent = "get('density')        -> " + ui.get('density') + '\\n' +
    "get('nested.accent')  -> " + ui.get('nested.accent') + '\\n' +
    "has('nested.radius')  -> " + ui.has('nested.radius') + '\\n' +
    "has('missing.path')   -> " + ui.has('missing.path') + '\\n' +
    'get()                 -> ' + JSON.stringify(ui.get());
};
root.append(out, ChillButton.create({ text: 'Make it compact + red', size: 'sm', onClick: () => { ui.set('density', 'compact'); ui.set('nested.accent', 'red'); show(); } }));
show();
cleanup(() => ChillProvider.remove('docs-ui'));`,
            height: 220,
        },
        {
            id: 'subscribe',
            title: 'Subscribe to changes',
            description: 'Listeners get the full config and the changed keys (`null` means everything, e.g. after `reset()`). With `{ immediate: true }` the listener also runs once straight away.',
            code: `const store = ChillProvider.create('docs-subscribe', { volume: 40, muted: false });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const meter = document.createElement('div');
meter.style.cssText = 'height:14px;border-radius:7px;background:var(--chill-bg-secondary);border:1px solid var(--chill-border);overflow:hidden';
const bar = document.createElement('div');
bar.style.cssText = 'height:100%;background:#3b82f6;transition:width .15s';
meter.append(bar);
const log = document.createElement('div');
log.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(meter, row, log);

const off = store.subscribe((cfg, changed) => {
  bar.style.width = (cfg.muted ? 0 : cfg.volume) + '%';
  log.textContent = 'changed: ' + JSON.stringify(changed) + '  volume=' + cfg.volume + '  muted=' + cfg.muted;
}, { immediate: true });
row.append(
  ChillButton.create({ text: 'Louder', size: 'sm', onClick: () => store.set('volume', Math.min(100, store.get('volume') + 20)) }),
  ChillButton.create({ text: 'Mute', size: 'sm', variant: 'outline', onClick: () => store.set('muted', !store.get('muted')) }),
  ChillButton.create({ text: 'Reset', size: 'sm', variant: 'ghost', onClick: () => store.reset() }),
);
cleanup(() => { off(); ChillProvider.remove('docs-subscribe'); });`,
            height: 170,
        },
        {
            id: 'deep-merge',
            title: 'Deep merge and bulk set',
            description: '`merge()` updates nested values without wiping siblings, while `set({ ... })` replaces whole top-level keys. Compare the two results.',
            code: `const base = { editor: { font: 'Inter', size: 14, wrap: true }, lang: 'en' };
const a = ChillProvider.create('docs-merge-a', base);
const b = ChillProvider.create('docs-merge-b', base);
a.merge({ editor: { size: 18 } });
b.set({ editor: { size: 18 } });
root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
const card = (title, data) => {
  const el = document.createElement('div');
  el.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px';
  const h = document.createElement('strong');
  h.textContent = title;
  const pre = document.createElement('pre');
  pre.style.cssText = 'margin:8px 0 0;font-size:12px;white-space:pre-wrap';
  pre.textContent = JSON.stringify(data, null, 1);
  el.append(h, pre);
  return el;
};
root.append(card("merge({ editor: { size: 18 } })", a.get()), card("set({ editor: { size: 18 } })", b.get()));
cleanup(() => { ChillProvider.remove('docs-merge-a'); ChillProvider.remove('docs-merge-b'); });`,
            height: 200,
        },
        {
            id: 'registry',
            title: 'Look up stores by name',
            description: 'Stores live in a shared registry: share state between unrelated modules with `ChillProvider.get(name)`, list them with `names()` and drop one with `remove()`.',
            code: `const feature = ChillProvider.create('docs-flags', { betaSearch: false });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-size:14px';
const names = document.createElement('div');
names.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px';
// "another module" only knows the name:
const consumer = () => {
  const flags = ChillProvider.get('docs-flags');
  status.textContent = flags ? 'Beta search is ' + (flags.get('betaSearch') ? 'ON' : 'OFF') : 'No flags provider registered';
  names.textContent = 'names() -> ' + JSON.stringify(ChillProvider.names().filter((n) => n.startsWith('docs-')));
};
const off = feature.subscribe(consumer);
root.append(status, names, ChillButton.create({ text: 'Toggle beta search', size: 'sm', onClick: () => feature.set('betaSearch', !feature.get('betaSearch')) }));
consumer();
cleanup(() => { off(); ChillProvider.remove('docs-flags'); });`,
            height: 150,
        },
    ],
    guides: [
        {
            title: 'Provider or Config?',
            body:
                'Both give you observable key/value stores with dotted paths. Pick **ChillProvider** for in-memory app state that several modules share by name (feature flags, UI density, component defaults). ' +
                'Pick **ChillConfig** when the values must survive a reload: it persists to `localStorage` / `sessionStorage` and syncs across tabs.\n\n' +
                'Calling `ChillProvider.create(name, ...)` again with an existing name destroys the old instance and returns a fresh one, so create each store once at startup and use `get(name)` elsewhere.',
        },
        {
            title: 'What listeners receive',
            body:
                'Listeners are called as `fn(config, changedKeys)`:\n\n' +
                '- `set(key, value)` passes `[key]` (the path you wrote), `set({ ... })` passes the top-level keys.\n' +
                '- `merge(obj)` passes the top-level keys of `obj`.\n' +
                '- `reset()` passes `null`, meaning "assume everything changed".\n\n' +
                '`subscribe(fn, { immediate: true })` also calls `fn(config, null)` once. `destroy()` clears the listeners and silences the instance; `ChillProvider.remove(name)` destroys and unregisters it.',
        },
    ],
    options: [
        { name: 'name', type: 'string', default: '-', description: 'create(): registry name. Reusing a name replaces (and destroys) the previous store.' },
        { name: 'defaultConfig', type: 'object', default: '{}', description: 'create(): initial values. Deep-cloned and used by `reset()`.' },
        { name: 'immediate', type: 'boolean', default: 'false', description: 'subscribe() option: also call the listener once right away with `(config, null)`.' },
    ],
    methods: [
        { signature: 'ChillProvider.create(name, defaults?)', on: 'static', description: 'Create and register a store; returns the instance.' },
        { signature: 'ChillProvider.get(name)', on: 'static', description: 'The registered instance, or `undefined`.' },
        { signature: 'ChillProvider.has(name)', on: 'static', description: 'Is a store registered under this name?' },
        { signature: 'ChillProvider.remove(name)', on: 'static', description: 'Destroy and unregister a store.' },
        { signature: 'ChillProvider.names()', on: 'static', description: 'Array of registered names.' },
        { signature: 'store.get(key?)', description: 'Value at a key or dotted path; with no argument a shallow copy of the whole config. `undefined` if missing.' },
        { signature: 'store.has(key)', description: '`true` when the path resolves to a value other than `undefined`.' },
        { signature: 'store.set(keyOrObject, value?)', description: 'Set one (dotted) key or replace several top-level keys. Missing path segments are created. Chainable.' },
        { signature: 'store.merge(object)', description: 'Deep-merge plain objects into the config. Chainable.' },
        { signature: 'store.reset(defaults?)', description: 'Restore the defaults (optionally replacing them first) and notify with `null`.' },
        { signature: 'store.subscribe(fn, { immediate? })', description: 'Listen with `fn(config, changedKeys)`. Returns an unsubscribe function; throws if `fn` is not a function.' },
        { signature: 'store.destroy()', description: 'Drop all listeners and stop notifying.' },
    ],
    a11y: [
        'No UI. When you bind a provider to controls, expose changes to assistive technology (labels, `aria-live` for status messages).',
        'Respect user preferences (reduced motion, colour scheme) when choosing default values.',
    ],
    tips: [
        'Mutating the object returned by `get()` does not notify anyone: call `set()` or `merge()` instead.',
        'The registry is module-global (one per page), which is convenient for micro-frontends but means names should be unique.',
        'In React or Vue, subscribe in an effect and store a copy of the config in component state; return the unsubscribe function for cleanup.',
        '`__proto__`, `constructor` and `prototype` path segments are ignored, so untrusted keys cannot pollute `Object.prototype`.',
    ],
    related: ['config', 'storage', 'events', 'theme'],
    keywords: ['settings', 'context', 'store', 'state', 'registry', 'feature flags'],
};

export default doc;
