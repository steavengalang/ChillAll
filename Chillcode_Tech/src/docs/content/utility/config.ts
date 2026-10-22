import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'config',
    global: 'ChillConfig',
    category: 'utility',
    title: 'Config',
    summary: 'Persistent app settings with defaults, dotted paths, change events and cross-tab sync.',
    style: 'create',
    description:
        'ChillConfig is a small settings store that saves itself. Declare your defaults, read and write values by dotted path (`ui.density`), and the result is persisted to ' +
        '`localStorage` (or `sessionStorage`) automatically. Stored data is deep-merged over your defaults, so adding a new default in a later release never breaks existing users.\n\n' +
        'Storage failures (private mode, quota, SSR) fall back to an in-memory copy instead of throwing. Changes made in another tab are applied and announced to your subscribers. ' +
        'Objects and arrays are returned as copies, so `get()` can never mutate the store by accident.',
    features: [
        'Defaults + stored overrides, deep-merged on load',
        'Dotted paths for `get`, `set`, `has` and `remove`, with a fallback value for `get`',
        '`localStorage` or `sessionStorage`, or memory only with `persist: false`',
        'Cross-tab sync through the `storage` event',
        'Returns copies, ignores prototype-polluting keys and isolates listener errors',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Settings that persist',
            description: 'Change the density and reload the page (or re-run the example): the value is read back from `localStorage`. The demo key is removed when you leave.',
            code: `const cfg = ChillConfig.create({ storageKey: 'docs-demo-settings', defaults: { ui: { density: 'cozy', accent: 'blue' } } });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('div');
out.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.7';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(out, row);
const show = () => {
  out.textContent = 'ui.density -> ' + cfg.get('ui.density') + '  |  ui.accent -> ' + cfg.get('ui.accent') + '  |  saved: ' + (window.localStorage.getItem('docs-demo-settings') || 'nothing yet');
};
['cozy', 'compact', 'spacious'].forEach((d) => row.append(ChillButton.create({ text: d, size: 'sm', variant: 'outline', onClick: () => cfg.set('ui.density', d) })));
row.append(ChillButton.create({ text: 'Reset', size: 'sm', variant: 'ghost', onClick: () => cfg.reset() }));
const off = cfg.subscribe(show);
show();
cleanup(() => { off(); cfg.destroy(); try { window.localStorage.removeItem('docs-demo-settings'); } catch (e) {} });`,
            height: 170,
        },
        {
            id: 'subscribe',
            title: 'Subscribe and react',
            description: 'Listeners receive `(config, changedKey)`. `changedKey` is the path you set, or `null` for bulk changes such as `merge`, `reset` and cross-tab updates.',
            code: `const cfg = ChillConfig.create({ persist: false, defaults: { name: 'Ada', notifications: { email: true, push: false } } });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding:10px 14px 10px 30px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px;min-height:90px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, log);
const off = cfg.subscribe((config, key) => {
  const li = document.createElement('li');
  li.textContent = 'changed ' + JSON.stringify(key) + ' -> ' + JSON.stringify(config);
  log.prepend(li);
});
row.append(
  ChillButton.create({ text: 'set push on', size: 'sm', onClick: () => cfg.set('notifications.push', true) }),
  ChillButton.create({ text: 'merge', size: 'sm', variant: 'secondary', onClick: () => cfg.merge({ notifications: { email: false }, plan: 'pro' }) }),
  ChillButton.create({ text: 'remove plan', size: 'sm', variant: 'outline', onClick: () => cfg.remove('plan') }),
);
cleanup(() => { off(); cfg.destroy(); });`,
            height: 230,
        },
        {
            id: 'get-defaults',
            title: 'Fallbacks, copies and has()',
            description: '`get(key, fallback)` returns the fallback for missing paths. Objects come back as copies, so editing them changes nothing until you call `set()`.',
            code: `const cfg = ChillConfig.create({ persist: false, defaults: { theme: { mode: 'auto', palette: ['#3b82f6', '#22c55e'] } } });
const palette = cfg.get('theme.palette');
palette.push('#ef4444');                      // edits the copy only
const lines = [
  "get('theme.mode')              -> " + cfg.get('theme.mode'),
  "get('theme.radius', 6)         -> " + cfg.get('theme.radius', 6),
  "has('theme.palette')           -> " + cfg.has('theme.palette'),
  "has('theme.nope')              -> " + cfg.has('theme.nope'),
  'palette after local push       -> ' + JSON.stringify(cfg.get('theme.palette')),
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px';
pre.textContent = lines.join('\\n');
root.append(pre);
cleanup(() => cfg.destroy());`,
            height: 170,
        },
        {
            id: 'session-and-manual-save',
            title: 'Session storage and load()',
            description: 'Use `type: "session"` to scope settings to the tab. `load()` re-reads storage and `save()` writes explicitly; here a second instance with the same key picks up the first one\'s data.',
            code: `const opts = { storageKey: 'docs-demo-session', type: 'session', sync: false, defaults: { draft: '' } };
const writer = ChillConfig.create(opts);
const reader = ChillConfig.create(opts);
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Type a draft...';
input.setAttribute('aria-label', 'Draft text');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const out = document.createElement('div');
out.style.cssText = 'color:var(--chill-text);font-size:13px';
out.textContent = 'reader sees: (empty)';
root.append(input, ChillButton.create({ text: 'Save with writer, load with reader', size: 'sm', onClick: () => {
  writer.set('draft', input.value);
  out.textContent = 'reader sees: "' + reader.load().get('draft') + '"';
} }), out);
cleanup(() => { writer.destroy(); reader.destroy(); try { window.sessionStorage.removeItem('docs-demo-session'); } catch (e) {} });`,
            height: 180,
        },
    ],
    guides: [
        {
            title: 'Defaults and migrations',
            body:
                'On creation the store loads `defaults`, then deep-merges whatever is stored over them. A user who saved `{ ui: { density: "compact" } }` will therefore get your **new** defaults for any keys added since, while keeping their own choices.\n\n' +
                '```js\nconst settings = ChillConfig.create({\n  storageKey: \'my-app:settings\',\n  defaults: { ui: { density: \'cozy\', sidebar: true }, beta: false },\n  onChange: (config, key) => applySettings(config),\n});\n```\n\n' +
                '`reset()` restores the defaults and saves them. `remove(key)` deletes one path, so the next `get()` returns the fallback you pass in.',
        },
        {
            title: 'Persistence and tabs',
            body:
                'With `persist: true` (the default) every `set`, `merge`, `remove` and `reset` writes JSON to the chosen storage under `storageKey`. If storage is blocked or full, the data is kept in memory for the life of the instance and a warning is logged.\n\n' +
                'With `sync: true` (default) the instance listens to the `storage` event: when another tab changes the key, this instance reloads and notifies subscribers with `key = null`. Pass `sync: false` for single-tab behaviour, and always call `destroy()` to release the listener.',
        },
    ],
    options: [
        { name: 'storageKey', type: 'string', default: "'chill-config'", description: 'Key under which the JSON is stored.' },
        { name: 'defaults', type: 'object', default: '{}', description: 'Default values (deep-cloned). Stored data is merged over them.' },
        { name: 'persist', type: 'boolean', default: 'true', description: 'Save to storage. `false` keeps everything in memory.' },
        { name: 'type', type: "'local' | 'session'", default: "'local'", description: 'Which Web Storage area to use.' },
        { name: 'sync', type: 'boolean', default: 'true', description: 'Apply `storage` events from other tabs and notify subscribers.' },
        { name: 'onChange', type: '(config, changedKey | null) => void', default: 'null', description: 'Convenience subscriber registered at creation.' },
    ],
    methods: [
        { signature: 'ChillConfig.create(options)', on: 'static', description: 'Create a config instance.' },
        { signature: 'config.get(key?, defaultValue?)', description: 'Value at a dotted path (a copy for objects and arrays), or the whole config when `key` is omitted.' },
        { signature: 'config.has(key)', description: '`true` if the path exists and is not `undefined`.' },
        { signature: 'config.set(key, value) / set({ ... })', description: 'Set one dotted path (notifies with that key) or several top-level keys (notifies with `null`). Saves. Chainable.' },
        { signature: 'config.merge(object)', description: 'Deep-merge an object, save and notify with `null`. Chainable.' },
        { signature: 'config.remove(key)', description: 'Delete a path, save and notify with the key. Chainable.' },
        { signature: 'config.reset()', description: 'Restore defaults, save and notify with `null`. Chainable.' },
        { signature: 'config.save() / load()', description: 'Write the config to storage / re-read storage over the defaults. Both chainable.' },
        { signature: 'config.subscribe(fn)', description: 'Listen with `fn(config, changedKey | null)`. Returns an unsubscribe function.' },
        { signature: 'config.destroy()', description: 'Remove the cross-tab listener and all subscribers.' },
    ],
    a11y: [
        'No UI. Settings that change presentation (density, motion, theme) should still honour OS preferences when used as defaults.',
        'Announce visible changes caused by remote tab updates if they could surprise users (an `aria-live` status works well).',
    ],
    tips: [
        'Namespace the key per app and version (for example `my-app:settings:v2`) to avoid collisions on shared origins.',
        'Only JSON-serialisable values survive a reload; `Date` objects are cloned in memory but come back from storage as strings.',
        'SSR-safe: storage access is guarded, so the instance simply runs in memory on the server.',
        'Use `persist: false` for tests or ephemeral state, and ChillProvider when you need a shared named registry.',
    ],
    related: ['provider', 'storage', 'theme', 'events'],
    keywords: ['settings', 'preferences', 'localstorage', 'persist', 'options', 'defaults'],
};

export default doc;
