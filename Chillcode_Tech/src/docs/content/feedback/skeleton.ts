import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'skeleton',
    global: 'ChillSkeleton',
    category: 'feedback',
    title: 'Skeleton',
    summary: 'Loading placeholders: single blocks and ready-made card, list, table and text presets with shimmer or pulse.',
    style: 'create',
    description:
        'ChillSkeleton renders grey placeholder shapes while real content loads, which avoids layout shift and feels faster than a spinner. ' +
        'Build a single block with `ChillSkeleton.create()`, or use `ChillSkeleton.preset(name, options)` for common layouts such as a card, a list or a table.\n\n' +
        'Grouped skeletons expose `role="status"` and `aria-busy="true"` so assistive tech announces the loading state, and `ChillSkeleton.reveal(skeleton, content)` swaps in the real content when it arrives.',
    features: [
        'Single blocks (text, title, circle, rounded, square) with custom width and height',
        'Presets for avatar, text, title, card, list, table and table-row',
        'Shimmer (default) or pulse animation, both off under `prefers-reduced-motion`',
        '`reveal()` swaps in real content and clears `aria-busy`',
        'Accessible: groups are live regions, individual pieces are `aria-hidden`',
    ],
    examples: [
        {
            id: 'blocks',
            title: 'Building blocks',
            description: 'Single skeleton pieces: a circle, a title, text lines and a rounded rectangle. Use `animation: "pulse"` for a softer effect.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px;max-width:360px';
root.append(
  ChillSkeleton.circle(48),
  ChillSkeleton.title({ width: '50%' }),
  ChillSkeleton.text(),
  ChillSkeleton.text({ width: '80%' }),
  ChillSkeleton.rectangle('100%', 80),
  ChillSkeleton.create({ variant: 'rounded', width: 120, height: 32, animation: 'pulse' }),
);`,
        },
        {
            id: 'card',
            title: 'Card preset',
            description: 'Image, avatar row and text lines in one call. Turn parts off with `image`, `avatar` or `lines: 0`.',
            height: 340,
            code: `root.style.cssText += ';display:flex;gap:16px;flex-wrap:wrap';
const a = ChillSkeleton.preset('card', { lines: 2 });
const b = ChillSkeleton.preset('card', { image: false, avatarSize: 56, lines: 3, animation: 'pulse' });
[a, b].forEach((el) => { el.style.width = '260px'; root.append(el); });`,
        },
        {
            id: 'list-table',
            title: 'List, table and text',
            description: 'Presets for the usual data layouts. Each accepts a `label` used as the accessible name.',
            height: 400,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:24px;max-width:480px';
root.append(
  ChillSkeleton.preset('text', { lines: 4, lastWidth: '40%' }),
  ChillSkeleton.preset('list', { count: 3, avatarSize: 40, label: 'Loading contacts' }),
  ChillSkeleton.preset('table', { rows: 4, cols: 3, label: 'Loading orders' }),
);`,
        },
        {
            id: 'reveal',
            title: 'Reveal real content',
            description: 'Show a skeleton while data loads, then call `reveal(skeleton, element)` to replace it in place.',
            height: 200,
            code: `const skeleton = ChillSkeleton.preset('avatar', { size: 56, lines: 2, label: 'Loading profile' });
root.append(skeleton);

const profile = document.createElement('div');
profile.style.cssText = 'display:flex;align-items:center;gap:12px;color:var(--chill-text)';
profile.innerHTML = '<div style="width:56px;height:56px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600">AK</div>' +
  '<div><strong>Amara Kowalski</strong><div style="opacity:.7;font-size:13px">Staff engineer</div></div>';

const timer = setTimeout(() => ChillSkeleton.reveal(skeleton, profile), 2000); // pretend the API answered
cleanup(() => { clearTimeout(timer); ChillSkeleton.remove(skeleton); });`,
        },
    ],
    guides: [
        {
            title: 'Match the layout',
            body:
                'The best skeleton looks like the content it replaces: same width, similar number of lines, same avatar size. ' +
                'Use `preset()` when one fits and compose single blocks otherwise. Every factory returns a plain `<div>`, so you can style and place it freely.\n\n' +
                '```js\nconst row = document.createElement(\'div\');\nrow.style.cssText = \'display:flex;gap:12px\';\nrow.append(ChillSkeleton.circle(32), ChillSkeleton.text({ width: 200 }));\n```',
        },
        {
            title: 'Accessibility of loading states',
            body:
                'Groups (`card`, `list`, `table`, `table-row`, `avatar`, `text` and `title` presets) get `role="status"`, `aria-busy="true"`, `aria-live="polite"` and an `aria-label` (default "Loading", change it with `label`). ' +
                'Single pieces made with `create()`, `text()`, `circle()` and friends are `aria-hidden`, so wrap them yourself in a labelled container if they stand alone.\n\n' +
                '`reveal()` sets `aria-busy="false"` before replacing the node. Use `setBusy(el, bool)` to toggle the flag manually.',
        },
        {
            title: 'Theming',
            body:
                'Two CSS variables control the colours and adapt automatically in dark mode:\n\n' +
                '```css\n:root {\n  --chillskeleton-base: #e2e8f0;\n  --chillskeleton-shine: #f8fafc;\n}\n```',
        },
    ],
    options: [
        { name: 'variant', type: "'text' | 'title' | 'circle' | 'rounded' | 'square'", default: 'undefined', description: '`create()`: shape. Text is 16px high, title 24px; circle is round, rounded has 8px radius, square none.' },
        { name: 'width', type: 'number | string', default: 'undefined', description: '`create()`: width. Numbers are pixels.' },
        { name: 'height', type: 'number | string', default: 'undefined', description: '`create()`: height. Numbers are pixels.' },
        { name: 'animate', type: 'boolean', default: 'true', description: 'Set `false` to disable the animation.' },
        { name: 'animation', type: "'shimmer' | 'pulse'", default: "'shimmer'", description: 'Animation style when `animate` is not false.' },
        { name: 'className', type: 'string', default: 'undefined', description: '`create()`: extra space-separated classes.' },
        { name: 'preset', type: "'avatar' | 'text' | 'title' | 'card' | 'list' | 'table' | 'table-row'", default: 'undefined', description: '`create({ preset })` is the same as `preset(name, options)`.' },
        { name: 'label', type: 'string', default: "'Loading'", description: 'Presets: accessible name of the group.' },
        { name: 'avatar preset: size / lines', type: 'number', default: '40 / 2', description: 'Circle diameter and number of text lines (`lines: 0` renders a bare circle).' },
        { name: 'text preset: lines / lastWidth', type: 'number / string', default: "3 / '70%'", description: 'Line count and width of the last line.' },
        { name: 'title preset: width', type: 'number | string', default: "'60%'", description: 'Width of the title bar. Defaults to 60%, the same as `ChillSkeleton.title()`.' },
        { name: 'card preset: image / imageHeight', type: 'boolean / number', default: 'true / 150', description: 'Show a cover image placeholder and its height.' },
        { name: 'card preset: avatar / avatarSize', type: 'boolean / number', default: 'true / 40', description: 'Show an avatar row and its size.' },
        { name: 'card preset: lines', type: 'number', default: '3', description: 'Text lines under the card header; `0` removes them.' },
        { name: 'list preset: count / avatar / avatarSize', type: 'number / boolean / number', default: '5 / true / 48', description: 'Number of rows, whether rows have an avatar, and its size.' },
        { name: 'table preset: rows / cols', type: 'number', default: '5 / 4', description: 'Grid size. `table-row` takes `cols` only.' },
    ],
    methods: [
        { signature: 'ChillSkeleton.create(options)', on: 'static', description: 'Create one skeleton block (or a preset when `options.preset` is set).' },
        { signature: 'ChillSkeleton.preset(name, options?)', on: 'static', description: 'Create a preset group. Throws for an unknown name.' },
        { signature: 'ChillSkeleton.text(options?) / title(options?)', on: 'static', description: 'Single text line (default width 100%) or title bar (default width 60%).' },
        { signature: 'ChillSkeleton.circle(size?, options?)', on: 'static', description: 'Circle of `size` pixels (default 40).' },
        { signature: 'ChillSkeleton.rectangle(width, height, options?)', on: 'static', description: 'Rounded rectangle.' },
        { signature: 'ChillSkeleton.card(options?)', on: 'static', description: 'Card group, same as `preset("card")`.' },
        { signature: 'ChillSkeleton.list(count?, options?)', on: 'static', description: 'List group, same as `preset("list")`.' },
        { signature: 'ChillSkeleton.table(rows?, cols?, options?)', on: 'static', description: 'Table group, same as `preset("table")`.' },
        { signature: 'ChillSkeleton.reveal(skeleton, content?)', on: 'static', description: 'Replace the skeleton with `content`, or just remove it. Sets `aria-busy="false"`; returns the content.' },
        { signature: 'ChillSkeleton.setBusy(el, busy?)', on: 'static', description: 'Set `aria-busy` on an element (true by default).' },
        { signature: 'ChillSkeleton.remove(el) / destroy(el)', on: 'static', description: 'Detach a skeleton from the DOM.' },
        { signature: 'ChillSkeleton.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
    ],
    cssVars: [
        { name: '--chillskeleton-base', description: 'Placeholder colour (and card border).' },
        { name: '--chillskeleton-shine', description: 'Highlight colour of the shimmer sweep.' },
    ],
    a11y: [
        'Group presets (and `card`, `list`, `table`) carry `role="status"`, `aria-busy="true"`, `aria-live="polite"` and an `aria-label`.',
        'Single pieces are `aria-hidden="true"` so screen readers ignore decorative blocks.',
        '`reveal()` marks the region as no longer busy before swapping in the content.',
        'Shimmer and pulse animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Reserve the same space as the final content to prevent layout shift; give blocks explicit widths and heights.',
        'Avoid showing a skeleton for very fast requests: delay it by ~200ms to prevent flicker.',
        'Skeletons are plain DOM elements, so in React create them in an effect or render an equivalent element with the `chillskeleton` classes.',
        'The module is safe to import on the server; build skeletons in the browser.',
    ],
    related: ['spinner', 'progress', 'emptystate', 'card'],
    keywords: ['loading', 'placeholder', 'shimmer', 'ghost', 'content loader'],
};

export default doc;
