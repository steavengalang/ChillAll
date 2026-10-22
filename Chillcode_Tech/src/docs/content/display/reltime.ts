import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'reltime',
    global: 'ChillRelTime',
    category: 'display',
    title: 'Relative Time',
    summary: 'Auto-updating relative times such as "3 minutes ago", localised with Intl and a tooltip with the exact date.',
    style: 'init',
    description:
        'ChillRelTime turns timestamps into human relative text ("3 minutes ago", "tomorrow", "in 2 days") using `Intl.RelativeTimeFormat`, and keeps the text fresh on a shared adaptive timer: ' +
        'every second while anything is under a minute old, then every 30 seconds or minute. The timer pauses while the tab is hidden and refreshes when it becomes visible.\n\n' +
        'Enhance `<time datetime="...">` and `[data-chill-reltime]` elements with `init()`, build elements with `create()`, or use the pure helpers `format()`, `absolute()`, `parse()` and `diff()` anywhere. ' +
        'The `datetime` attribute is always set and the exact date and time go into the `title` tooltip.',
    features: [
        'Localised via `Intl.RelativeTimeFormat`: long, short and narrow styles, `numeric: "auto"` gives "yesterday" and "tomorrow"',
        'One shared adaptive timer for all elements, paused in hidden tabs',
        'Switch to an absolute date past `maxRelativeDays`',
        'Pure helpers (`format`, `absolute`, `parse`, `diff`) usable on server and client',
        'Inject a `now` clock for server-synced time and tests; invalid dates render as empty text',
    ],
    examples: [
        {
            id: 'format',
            title: 'Format a timestamp',
            description: '`format(date, options)` returns the text. Dates may be a `Date`, an ISO string or epoch milliseconds.',
            code: `const now = Date.now();
const samples = [now - 3000, now - 3 * 60000, now - 5 * 3600000, now - 86400000, now + 2 * 86400000, now - 40 * 86400000];
root.style.color = 'var(--chill-text)';
samples.forEach((t) => {
  const p = document.createElement('div');
  p.textContent = ChillRelTime.format(t) + '  (' + ChillRelTime.absolute(t) + ')';
  root.append(p);
});`,
        },
        {
            id: 'init-existing',
            title: 'Live <time> elements',
            description: '`init()` renders and keeps `<time datetime>` and `data-chill-reltime` elements up to date. Hover for the exact time.',
            code: `const iso = (ms) => new Date(Date.now() - ms).toISOString();
root.style.color = 'var(--chill-text)';
root.innerHTML =
  '<p>Comment posted <time datetime="' + iso(8000) + '"></time></p>' +
  '<p>Build finished <time datetime="' + iso(7 * 60000) + '"></time></p>' +
  '<p>Last login <span data-chill-reltime="' + (Date.now() - 26 * 3600000) + '"></span></p>';
const inst = ChillRelTime.init(root.querySelectorAll('time, [data-chill-reltime]'));
cleanup(() => inst.destroy());`,
        },
        {
            id: 'locale',
            title: 'Locales and styles',
            description: '`locale` picks the language, `style` the verbosity, and `numeric: "always"` avoids phrases like "yesterday".',
            code: `const t = Date.now() - 86400000 * 1;
const rows = [
  ['en', {}], ['id', { locale: 'id' }], ['fr short', { locale: 'fr', style: 'short' }],
  ['ja', { locale: 'ja' }], ['en narrow', { style: 'narrow' }], ['numeric always', { numeric: 'always' }],
];
root.style.color = 'var(--chill-text)';
rows.forEach(([label, opts]) => {
  const p = document.createElement('div');
  p.textContent = label + ': ' + ChillRelTime.format(t, opts);
  root.append(p);
});`,
        },
        {
            id: 'create',
            title: 'Create elements',
            description: '`create(date, options)` returns a `<time>` element that updates itself once it is in the document. Its `chillRelTime.destroy()` stops updates.',
            code: `const started = Date.now() - 4000;
const el = ChillRelTime.create(started, { style: 'short' });
const p = document.createElement('p');
p.style.color = 'var(--chill-text)';
p.append('Uploaded ', el, ' (watch the seconds tick)');
root.append(p);
cleanup(() => el.chillRelTime && el.chillRelTime.destroy());`,
        },
        {
            id: 'absolute',
            title: 'Switch to absolute dates',
            description: '`maxRelativeDays` shows an absolute date for older or farther times. `onUpdate` lets you react to each render.',
            code: `const day = 86400000;
root.innerHTML = ['2 days ago', '45 days ago'].map((l, i) => '<p style="color:var(--chill-text)">' + l + ': <time datetime="' + new Date(Date.now() - [2, 45][i] * day).toISOString() + '"></time></p>').join('');
const inst = ChillRelTime.init(root.querySelectorAll('time'), {
  maxRelativeDays: 30,
  absolute: { dateStyle: 'long' },
  onUpdate: (el, text) => el.setAttribute('data-text', text),
});
cleanup(() => inst.destroy());`,
        },
        {
            id: 'now-clock',
            title: 'Custom clock',
            description: 'Pass `now` (a number, a `Date` or a function) to render relative to server time or a fixed moment, for example in tests or SSR.',
            code: `const fixedNow = new Date('2026-01-01T12:00:00Z');
const out = [
  ChillRelTime.format('2026-01-01T11:59:58Z', { now: fixedNow, locale: 'en' }),
  ChillRelTime.format('2026-01-01T09:00:00Z', { now: fixedNow, locale: 'en' }),
  ChillRelTime.format('2026-01-04T12:00:00Z', { now: fixedNow, locale: 'en' }),
];
root.style.color = 'var(--chill-text)';
root.textContent = out.join(' | ') + ' | diff: ' + JSON.stringify(ChillRelTime.diff('2026-01-01T09:00:00Z', fixedNow));`,
        },
    ],
    guides: [
        {
            title: 'Markup and enhancement',
            body:
                '`init(selector?, options?)` accepts a CSS selector, an element or a list; with no selector it enhances every `time[datetime], [data-chill-reltime]` on the page. ' +
                'The timestamp comes from `data-chill-reltime` (ISO string or epoch ms) or the `datetime` attribute. It returns `{ refresh(), update(), destroy() }`: ' +
                '`refresh()` picks up elements added later, `update()` re-renders now, and `destroy()` restores the original text, `title` and `datetime`.\n\n' +
                'The language falls back to the element\'s `lang`, then `<html lang>`, then the browser default. Elements removed from the document are dropped automatically.',
        },
        {
            title: 'How the text is chosen',
            body:
                'The largest sensible unit is used (years down to seconds). With `numeric: "auto"`, differences under `nowThreshold` seconds (default 5) read "now", and one day reads "yesterday" or "tomorrow". ' +
                'A value that would round to zero (for example 0 minutes) falls back to seconds, so you never see "0 minutes ago".\n\n' +
                '`diff(date, now?)` returns `{ value, unit, seconds }` if you want to build your own wording.',
        },
    ],
    options: [
        { name: 'locale', type: 'string', default: 'element lang, `<html lang>`, browser', description: 'BCP-47 locale for the text and the tooltip.' },
        { name: 'numeric', type: "'auto' | 'always'", default: "'auto'", description: '`auto` allows "yesterday", "tomorrow" and "now".' },
        { name: 'style', type: "'long' | 'short' | 'narrow'", default: "'long'", description: 'Verbosity of the text.' },
        { name: 'now', type: 'number | Date | () => number', default: 'Date.now()', description: 'The current time, for tests or server clock offsets.' },
        { name: 'nowThreshold', type: 'number', default: '5', description: 'Seconds below which the text reads "now" (`numeric: "auto"` only).' },
        { name: 'maxRelativeDays', type: 'number', default: '0', description: '0 = always relative; otherwise older or farther dates render as absolute dates.' },
        { name: 'tooltip', type: 'boolean', default: 'true', description: 'Set `title` to the absolute time (`init` / `create`).' },
        { name: 'absolute', type: 'Intl.DateTimeFormatOptions', default: "{ dateStyle: 'medium', timeStyle: 'short' }", description: 'Format for the tooltip and the absolute fallback.' },
        { name: 'update', type: 'boolean', default: 'true', description: 'Auto-update elements (`init` / `create`).' },
        { name: 'onUpdate', type: '(el, text) => void', default: 'null', description: 'Called after each render of an element (`init`).' },
    ],
    methods: [
        { signature: 'ChillRelTime.format(date, options?)', on: 'static', description: 'Relative text; invalid dates give an empty string.' },
        { signature: 'ChillRelTime.absolute(date, options?)', on: 'static', description: 'Absolute date text (tooltip format).' },
        { signature: 'ChillRelTime.parse(value)', on: 'static', description: 'Parse a Date, ISO string or epoch ms into a Date, or `null`.' },
        { signature: 'ChillRelTime.diff(date, now?)', on: 'static', description: 'Returns `{ value, unit, seconds }` for the difference to now.' },
        { signature: 'ChillRelTime.init(selector?, options?)', on: 'static', description: 'Enhance elements; returns `{ refresh(), update(), destroy() }`.' },
        { signature: 'ChillRelTime.create(date, options?)', on: 'static', description: 'Build an auto-updating `<time>` element (`el.chillRelTime.update()` / `destroy()`).' },
        { signature: 'instance.refresh() / update() / destroy()', description: 'Register new elements, re-render now, or restore the original DOM.' },
    ],
    a11y: [
        'Uses the semantic `<time>` element with a machine-readable `datetime` attribute.',
        'The exact date and time are exposed in the `title` tooltip (disable with `tooltip: false`).',
        'Updates only change text content and are not announced as live regions, so screen readers are not interrupted every second.',
    ],
    tips: [
        'For server rendering, render the absolute date in HTML and let `init()` swap in relative text on the client.',
        'A user\'s clock may be off. Pass `now: () => Date.now() + serverOffset` for important timestamps.',
        'In React, render `<time dateTime={iso} />` and call `init()` on the element ref in an effect; call `destroy()` in the cleanup.',
    ],
    related: ['countdown', 'timeline', 'calendar'],
    keywords: ['ago', 'time ago', 'timeago', 'fromnow', 'relative', 'timestamp', 'intl'],
};

export default doc;
