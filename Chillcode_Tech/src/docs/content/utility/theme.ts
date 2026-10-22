import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'theme',
    global: 'ChillTheme',
    category: 'utility',
    title: 'Theme',
    summary: 'Light, dark and system theme management with persistence, cross-tab sync and a no-flash script.',
    style: 'static',
    description:
        'ChillTheme is the switch every other ChillAll component listens to. It resolves your preference (`light`, `dark` or `system`) into a concrete theme and writes it to ' +
        '`<html data-theme="...">` plus a `light` / `dark` class on `<html>`, so CSS variables and components re-skin together.\n\n' +
        'The choice is saved to `localStorage`, follows the operating system while set to `system`, and stays in sync across browser tabs. ' +
        'The module initialises itself once on load, and every storage / `matchMedia` access is guarded, so it is safe in private mode and on the server.',
    features: [
        'Three preferences: `light`, `dark` and `system` (follows `prefers-color-scheme` live)',
        'Resolved theme written to `data-theme` and an `<html>` class for any CSS strategy',
        'Persists to `localStorage` and syncs across tabs through the `storage` event',
        '`noFlashScript()` returns an inline script that applies the theme before first paint',
        'Subscribe with `onChange()`; invalid values are rejected instead of throwing',
    ],
    examples: [
        {
            id: 'live-readout',
            title: 'Live readout and controls',
            description: 'The preference (`getTheme`) and the resolved theme (`getResolvedTheme`) can differ: with `system` the resolved value follows your OS. This demo restores your theme when you leave.',
            code: `const prev = ChillTheme.getTheme();
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const readout = document.createElement('div');
readout.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.7';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(readout, row);

const render = () => {
  readout.textContent = '';
  [['getTheme()', ChillTheme.getTheme()], ['getResolvedTheme()', ChillTheme.getResolvedTheme()], ['isDark()', String(ChillTheme.isDark())]].forEach(([k, v]) => {
    const line = document.createElement('div');
    line.textContent = k + ' -> ' + v;
    readout.append(line);
  });
};
['light', 'dark', 'system'].forEach((t) => {
  row.append(ChillButton.create({ text: t, variant: 'outline', size: 'sm', onClick: () => ChillTheme.setTheme(t, { persist: false }) }));
});
render();
const off = ChillTheme.onChange(render);
cleanup(() => { off(); ChillTheme.setTheme(prev); });`,
        },
        {
            id: 'switcher',
            title: 'Toggle and cycle',
            description: '`toggle()` flips between light and dark and returns the new resolved theme. `cycle()` walks light, dark, system and returns the new preference.',
            code: `const prev = ChillTheme.getTheme();
root.style.cssText += ';display:flex;gap:12px;align-items:center;flex-wrap:wrap';
const out = document.createElement('span');
out.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px';
out.textContent = 'Press a button';
const toggle = ChillButton.create({ text: 'Toggle', onClick: () => { out.textContent = 'toggle() -> ' + ChillTheme.toggle(); } });
const cycle = ChillButton.create({ text: 'Cycle', variant: 'secondary', onClick: () => { out.textContent = 'cycle() -> ' + ChillTheme.cycle(); } });
const bad = ChillButton.create({ text: 'Invalid value', variant: 'ghost', onClick: () => { out.textContent = "setTheme('purple') -> " + ChillTheme.setTheme('purple'); } });
root.append(toggle, cycle, bad, out);
cleanup(() => ChillTheme.setTheme(prev));`,
        },
        {
            id: 'subscribe-log',
            title: 'React to theme changes',
            description: 'Listeners receive `(resolved, setting)` on every change - including OS changes while the setting is `system`. The return value unsubscribes.',
            code: `const prev = ChillTheme.getTheme();
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding:10px 14px 10px 30px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px;min-height:48px';
root.append(row, log);

const off = ChillTheme.subscribe((resolved, setting) => {
  const li = document.createElement('li');
  li.textContent = 'resolved: ' + resolved + '  |  setting: ' + setting;
  log.prepend(li);
});
['light', 'dark', 'system'].forEach((t) => row.append(ChillButton.create({ text: 'Set ' + t, size: 'sm', variant: 'outline', onClick: () => ChillTheme.setTheme(t, { persist: false }) })));
cleanup(() => { off(); ChillTheme.setTheme(prev); });`,
        },
        {
            id: 'no-flash',
            title: 'Avoid the flash of the wrong theme',
            description: '`noFlashScript()` returns a tiny synchronous script. Paste it in `<head>` before your CSS so the page never paints in the wrong theme.',
            code: `const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;word-break:break-all';
const label = document.createElement('div');
label.style.cssText = 'color:var(--chill-text);font-size:13px;margin:12px 0 6px';
label.textContent = 'With a custom key and default (wrapped in a script tag):';
const pre2 = pre.cloneNode();
pre.textContent = ChillTheme.noFlashScript();
pre2.textContent = ChillTheme.noFlashScript({ storageKey: 'my-app-theme', defaultTheme: 'dark', tag: true });
root.append(pre, label, pre2);`,
            height: 260,
        },
    ],
    guides: [
        {
            title: 'How the theme is applied',
            body:
                'ChillTheme keeps two values: the **setting** (`light`, `dark` or `system`, what the user chose) and the **resolved theme** (always `light` or `dark`). ' +
                'The resolved theme is what lands in the DOM:\n\n' +
                '```html\n<html class="dark" data-theme="dark">\n```\n\n' +
                'Style against either hook:\n\n' +
                '```css\n:root[data-theme="dark"] { --surface: #111; --ink: #fafafa; }\n.dark .card { border-color: #333; }\n```\n\n' +
                'All ChillAll components already follow this contract, so calling `setTheme()` re-skins them without further wiring.',
        },
        {
            title: 'Persistence and first paint',
            body:
                'By default the setting is stored under the `chill-theme` key. Change it (and the default for first-time visitors) with `init()`:\n\n' +
                '```js\nChillTheme.init({ storageKey: \'my-app-theme\', defaultTheme: \'system\', onChange: (resolved, setting) => console.log(resolved, setting) });\n```\n\n' +
                '`init()` is idempotent: calling it again re-binds listeners without duplicating them. ' +
                'JavaScript runs after first paint, so for server-rendered pages inline `ChillTheme.noFlashScript({ tag: true })` in `<head>` before your stylesheets, using the same `storageKey`.\n\n' +
                '> Pass `{ persist: false }` to `setTheme()` for a temporary change that should not overwrite the visitor\'s saved choice.',
        },
    ],
    options: [
        { name: 'storageKey', type: 'string', default: "'chill-theme'", description: 'init(): `localStorage` key used to persist the setting. Use the same value in `noFlashScript()`.' },
        { name: 'defaultTheme', type: "'light' | 'dark' | 'system'", default: "'system'", description: 'init(): setting used when nothing valid is stored.' },
        { name: 'onChange', type: '(resolved, setting) => void', default: 'null', description: 'init(): listener registered together with init; replaced if you call init() again.' },
        { name: 'persist', type: 'boolean', default: 'true', description: 'setTheme() option: set `false` to skip writing to storage.' },
        { name: 'tag', type: 'boolean', default: 'false', description: 'noFlashScript() option: wrap the code in `<script>...</script>`.' },
    ],
    methods: [
        { signature: 'ChillTheme.setTheme(theme, { persist? })', on: 'static', description: 'Apply `light`, `dark` or `system`. Returns `false` (and warns) for any other value.' },
        { signature: 'ChillTheme.getTheme()', on: 'static', description: 'The current setting: `light`, `dark` or `system`.' },
        { signature: 'ChillTheme.getResolvedTheme()', on: 'static', description: 'The theme actually applied: `light` or `dark`.' },
        { signature: 'ChillTheme.isDark()', on: 'static', description: '`true` when the resolved theme is dark.' },
        { signature: 'ChillTheme.toggle()', on: 'static', description: 'Switch between light and dark; returns the new resolved theme.' },
        { signature: 'ChillTheme.cycle()', on: 'static', description: 'Move light, dark, system, light...; returns the new setting.' },
        { signature: 'ChillTheme.subscribe(fn)', on: 'static', description: 'Call `fn(resolved, setting)` on every change. Returns an unsubscribe function.' },
        { signature: 'ChillTheme.onChange(fn)', on: 'static', description: 'Alias of `subscribe`.' },
        { signature: 'ChillTheme.noFlashScript({ storageKey?, defaultTheme?, tag? })', on: 'static', description: 'Returns the source of a synchronous script that sets the theme before first paint.' },
        { signature: 'ChillTheme.init(options)', on: 'static', description: 'Read storage, apply the theme and bind system and cross-tab listeners. Safe to call repeatedly; returns `ChillTheme`.' },
        { signature: 'ChillTheme.destroy()', on: 'static', description: 'Remove the `matchMedia` and `storage` listeners and clear all subscribers.' },
        { signature: 'ChillTheme.THEMES / ChillTheme.version', description: 'Constants `{ LIGHT, DARK, SYSTEM }` and the library version string.' },
    ],
    a11y: [
        'No UI of its own. Build your switcher from real buttons and reflect the choice with `aria-pressed` or a labelled `<select>`.',
        '`system` honours the visitor\'s OS-level `prefers-color-scheme`, a real accessibility preference - offer it.',
        'Colour contrast is your CSS\'s responsibility; check both `data-theme` values.',
    ],
    tips: [
        'Server rendering: the module is safe to import on the server (no DOM access at import); the theme is applied on the client, so add `noFlashScript()` to your HTML shell.',
        'In React or Vue, call `subscribe()` in an effect and return the unsubscribe function from the cleanup.',
        'Other tabs update automatically through the `storage` event, so no extra sync code is needed.',
        'Changes made with `{ persist: false }` are not written to storage; reloading the page returns to the saved setting.',
    ],
    related: ['mediaquery', 'storage', 'config', 'command'],
    keywords: ['dark mode', 'light mode', 'color scheme', 'prefers-color-scheme', 'data-theme', 'toggle'],
};

export default doc;
