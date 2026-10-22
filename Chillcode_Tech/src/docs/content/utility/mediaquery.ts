import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'mediaquery',
    global: 'ChillMediaQuery',
    category: 'utility',
    title: 'Media Query',
    summary: 'Named breakpoints, live media query watchers and device preference checks in plain JS.',
    style: 'static',
    description:
        'ChillMediaQuery wraps `window.matchMedia` with named breakpoints (`xs` to `xxl`), device helpers (`isMobile()`, `isTouch()`...) and preference checks (`isDark()`, `prefersReducedMotion()`). ' +
        'Use `watch()` to react whenever a query starts or stops matching, or `watchBreakpoint()` to be told only when the active breakpoint changes.\n\n' +
        'Anywhere you can pass a name you can also pass a raw media query string. Without `matchMedia` (server rendering, ancient browsers) `matches()` returns `false` (or your `fallback`) and watchers return harmless no-op disposers.',
    features: [
        'Named queries: `xs sm md lg xl xxl`, `mobile tablet desktop`, `dark light`, `portrait landscape`, `hover touch`, `reducedMotion`',
        '`watch(query, cb)` with immediate call and a stop function',
        '`watchBreakpoint(cb)` fires only when the current breakpoint changes',
        '`setBreakpoints()` overrides or adds your own named queries',
        'SSR-safe with an optional fallback, and supports old Safari `addListener`',
    ],
    examples: [
        {
            id: 'breakpoint-readout',
            title: 'Live breakpoint',
            description: 'Resize the window or the preview: `watchBreakpoint()` reports the current name and only fires when it changes. `isBreakpoint(name)` means "at least this wide".',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const big = document.createElement('div');
big.style.cssText = 'font-size:32px;font-weight:700;color:var(--chill-text)';
const info = document.createElement('div');
info.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.7';
root.append(big, info);
const stop = ChillMediaQuery.watchBreakpoint((bp) => {
  big.textContent = bp;
  info.textContent = 'ORDER: ' + ChillMediaQuery.ORDER.join(' < ') + '\\nisBreakpoint("md") -> ' + ChillMediaQuery.isBreakpoint('md') + '\\nisBreakpoint("xl") -> ' + ChillMediaQuery.isBreakpoint('xl');
});
cleanup(stop);`,
            height: 150,
        },
        {
            id: 'named-queries',
            title: 'Every named query at a glance',
            description: '`matches(name)` accepts any key of `BREAKPOINTS`. Green means the query currently matches on your device.',
            code: `root.style.cssText += ';display:flex;flex-wrap:wrap;gap:6px';
Object.keys(ChillMediaQuery.BREAKPOINTS).forEach((name) => {
  const on = ChillMediaQuery.matches(name);
  const chip = document.createElement('span');
  chip.title = ChillMediaQuery.BREAKPOINTS[name];
  chip.textContent = name + (on ? ' yes' : ' no');
  chip.style.cssText = 'padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid ' + (on ? '#16a34a' : 'var(--chill-border)') + ';background:' + (on ? 'rgba(34,197,94,.15)' : 'var(--chill-bg-secondary)') + ';color:var(--chill-text)';
  root.append(chip);
});`,
            height: 130,
        },
        {
            id: 'watch-custom',
            title: 'Watch a custom query',
            description: '`watch(query, callback)` calls back immediately (disable with `{ immediate: false }`) and on every change. The return value stops it, as does `unwatch(stop)`. Try resizing below or above 600px.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const card = document.createElement('div');
card.style.cssText = 'padding:16px;border-radius:12px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);transition:background .2s';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding-left:20px;color:var(--chill-text);font-size:12px;font-family:ui-monospace,Consolas,monospace;min-height:40px';
root.append(card, log);
const stopNarrow = ChillMediaQuery.watch('(max-width: 600px)', (narrow) => {
  card.textContent = narrow ? 'Narrow layout (<= 600px)' : 'Wide layout (> 600px)';
  const li = document.createElement('li');
  li.textContent = 'matches -> ' + narrow;
  log.prepend(li);
});
const stopMotion = ChillMediaQuery.watch('reducedMotion', (reduce) => {
  const li = document.createElement('li');
  li.textContent = 'prefers-reduced-motion: ' + reduce;
  log.append(li);
});
cleanup(() => { ChillMediaQuery.unwatch(stopNarrow); stopMotion(); });`,
            height: 170,
        },
        {
            id: 'custom-breakpoints',
            title: 'Custom breakpoints and helpers',
            description: '`setBreakpoints()` overrides or adds named queries globally. The original values are restored here when you leave, since the table is shared by the whole page.',
            code: `const original = { md: ChillMediaQuery.BREAKPOINTS.md };
ChillMediaQuery.setBreakpoints({ md: '(min-width: 800px)', ultrawide: '(min-width: 2000px)' });
const rows = [
  'BREAKPOINTS.md        -> ' + ChillMediaQuery.BREAKPOINTS.md,
  'matches("ultrawide")  -> ' + ChillMediaQuery.matches('ultrawide'),
  'isMobile()            -> ' + ChillMediaQuery.isMobile(),
  'isTablet()            -> ' + ChillMediaQuery.isTablet(),
  'isDesktop()           -> ' + ChillMediaQuery.isDesktop(),
  'isTouch()             -> ' + ChillMediaQuery.isTouch(),
  'isDark()              -> ' + ChillMediaQuery.isDark(),
  'prefersReducedMotion  -> ' + ChillMediaQuery.prefersReducedMotion(),
  'matches("(min-width: 1px)", {fallback:false}) -> ' + ChillMediaQuery.matches('(min-width: 1px)', { fallback: false }),
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
pre.textContent = rows.join('\\n');
root.append(pre);
cleanup(() => ChillMediaQuery.setBreakpoints(original));`,
            height: 230,
        },
    ],
    guides: [
        {
            title: 'Named queries',
            body:
                'The built-in table (`ChillMediaQuery.BREAKPOINTS`):\n\n' +
                '- **Width:** `xs` (max 575px), `sm` (min 576), `md` (min 768), `lg` (min 992), `xl` (min 1200), `xxl` (min 1400). Apart from `xs`, these are *min-width* queries, so `md` stays true on large screens.\n' +
                '- **Devices:** `mobile` (max 767), `tablet` (768-1023), `desktop` (min 1024).\n' +
                '- **Preferences:** `dark`, `light`, `motion` / `reducedMotion`, `hover`, `touch`, `portrait`, `landscape`.\n\n' +
                '`getCurrentBreakpoint()` returns the widest matching name from `ORDER`, and `isBreakpoint(\'lg\')` means "lg or wider".',
        },
        {
            title: 'Reacting to changes',
            body:
                '```js\nconst stop = ChillMediaQuery.watch(\'(max-width: 600px)\', (isNarrow, mql) => {\n  layout(isNarrow ? \'stacked\' : \'columns\');\n});\n// later\nstop();               // or ChillMediaQuery.unwatch(stop)\n```\n\n' +
                'Callbacks receive `(matches, event)`; the first immediate call receives the `MediaQueryList`. ' +
                '`unwatchAll()` removes every watcher created through this module. `watchBreakpoint()` is built from several watchers and returns one function that stops them all.',
        },
    ],
    options: [
        { name: 'fallback', type: 'boolean', default: 'false', description: 'matches() / watch() option: value used when `matchMedia` is unavailable (SSR).' },
        { name: 'immediate', type: 'boolean', default: 'true', description: 'watch() / watchBreakpoint() option: call the callback once right away.' },
        { name: 'query', type: 'string', default: '-', description: 'A key of `BREAKPOINTS` or any raw media query, for example `(min-width: 900px)`.' },
        { name: 'map', type: 'Record<string, string>', default: '-', description: 'setBreakpoints(): `{ name: mediaQuery }` pairs; non-string values are ignored.' },
    ],
    methods: [
        { signature: 'ChillMediaQuery.matches(query, { fallback? })', on: 'static', description: 'Does the named or raw query match right now?' },
        { signature: 'ChillMediaQuery.watch(query, callback, { immediate? })', on: 'static', description: 'Call `callback(matches, mql)` on change. Returns a stop function (with `.id`).' },
        { signature: 'ChillMediaQuery.unwatch(stopOrId)', on: 'static', description: 'Stop a watcher using the returned function or its id.' },
        { signature: 'ChillMediaQuery.unwatchAll()', on: 'static', description: 'Stop every watcher.' },
        { signature: 'ChillMediaQuery.watchBreakpoint(callback, { immediate? })', on: 'static', description: 'Call `callback(name)` with `xs` ... `xxl` only when the breakpoint changes. Returns a stop function.' },
        { signature: 'ChillMediaQuery.getCurrentBreakpoint()', on: 'static', description: 'The widest matching name from `ORDER`, or `xs`.' },
        { signature: 'ChillMediaQuery.isBreakpoint(name)', on: 'static', description: '`true` when the viewport is at least as wide as `name`. Non-ordered names fall back to `matches(name)`.' },
        { signature: 'ChillMediaQuery.isMobile() / isTablet() / isDesktop()', on: 'static', description: 'Shortcuts for the `mobile`, `tablet` and `desktop` queries.' },
        { signature: 'ChillMediaQuery.isDark() / isTouch() / prefersReducedMotion()', on: 'static', description: 'Shortcuts for `dark`, `touch` and `reducedMotion`.' },
        { signature: 'ChillMediaQuery.setBreakpoints(map)', on: 'static', description: 'Override or add named queries (global for the page).' },
        { signature: 'ChillMediaQuery.BREAKPOINTS / ORDER', description: 'The named query table and the ordered list `xs`...`xxl`.' },
    ],
    a11y: [
        'Honour `prefersReducedMotion()` by shortening or removing non-essential animation.',
        '`isDark()` reflects the OS preference; combine with ChillTheme so users can still override it.',
        'Do not hide essential content or controls behind a breakpoint without an alternative.',
    ],
    tips: [
        'Prefer CSS media queries for styling and use ChillMediaQuery when JavaScript must react (mount different components, change behaviour).',
        'On the server `matches()` returns the `fallback` (default `false`); pass a sensible default such as `{ fallback: true }` for `desktop` to avoid layout jumps.',
        'Always keep the stop function and call it on unmount; in React return it from `useEffect`.',
        '`isTouch()` checks `(hover: none) and (pointer: coarse)`, a good proxy for phones and tablets, not a guarantee of touch support.',
    ],
    related: ['theme', 'events', 'config'],
    keywords: ['responsive', 'breakpoint', 'matchMedia', 'viewport', 'dark mode', 'reduced motion', 'mobile'],
};

export default doc;
