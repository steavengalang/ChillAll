import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'spinner',
    global: 'ChillSpinner',
    category: 'feedback',
    title: 'Spinner',
    summary: 'Four loader styles, plus overlays that cover a card or the whole page while work is in progress.',
    style: 'create',
    description:
        'ChillSpinner shows that something is loading. Use `create()` for an inline spinner, `overlay(el)` to dim and block a single card, table or form while it refreshes, ' +
        'and `fullscreen()` for page-level waits. Overlays can wait a few hundred milliseconds before appearing, so fast requests never flash a loader.\n\n' +
        'Every spinner carries a visually hidden `label` announced to screen readers; add `showLabel` to display it as well. The label is always inserted as **text**.',
    features: [
        'Four types - `ring`, `dots`, `bars`, `pulse` - in five sizes or any pixel size',
        'Theme colours (`primary`, `success`, `warning`, `danger`, `neutral`), `inherit` for `currentColor`, or any CSS colour',
        '`overlay()` covers any element (reused if one exists) and sets `aria-busy` on it',
        '`delay` option avoids flicker on fast operations; `blur` softens the content behind',
        'Reduced-motion users get a slower animation instead of none, so progress stays visible',
    ],
    examples: [
        {
            id: 'types',
            title: 'Types',
            description: 'Four animation styles, all driven by the same `color` and `size` options.',
            code: `root.style.cssText += ';display:flex;gap:28px;align-items:center;flex-wrap:wrap';
['ring', 'dots', 'bars', 'pulse'].forEach((type) => {
  const s = ChillSpinner.create({ type, size: 'lg' });
  root.append(s.element);
  cleanup(() => s.destroy());
});`,
        },
        {
            id: 'sizes-colors',
            title: 'Sizes and colours',
            description: 'Presets from `xs` to `xl`, a numeric pixel size, semantic colours, and `inherit` to follow the surrounding text colour.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const sizes = document.createElement('div');
sizes.style.cssText = 'display:flex;gap:16px;align-items:center';
['xs', 'sm', 'md', 'lg', 'xl', 96].forEach((size) => sizes.append(ChillSpinner.create({ size }).element));
const colors = document.createElement('div');
colors.style.cssText = 'display:flex;gap:16px;align-items:center';
['primary', 'success', 'warning', 'danger', 'neutral', '#8b5cf6'].forEach((color) => colors.append(ChillSpinner.create({ color, type: 'dots' }).element));
const inherit = document.createElement('div');
inherit.style.cssText = 'display:flex;gap:8px;align-items:center;color:var(--chill-text)';
inherit.append(ChillSpinner.create({ color: 'inherit', size: 'sm' }).element, 'Inherits the text colour');
root.append(sizes, colors, inherit);`,
        },
        {
            id: 'label',
            title: 'Visible label',
            description: '`showLabel` renders the label under the spinner. `setLabel()` updates both the visible and the screen-reader text.',
            code: `const s = ChillSpinner.create({ type: 'ring', size: 'lg', label: 'Uploading photos...', showLabel: true });
root.append(s.element);
const steps = ['Uploading photos...', 'Resizing images...', 'Almost done...'];
let i = 0;
const timer = setInterval(() => s.setLabel(steps[++i % steps.length]), 1500);
cleanup(() => { clearInterval(timer); s.destroy(); });`,
        },
        {
            id: 'overlay',
            title: 'Overlay on a card',
            description: '`ChillSpinner.overlay(el)` covers an element and marks it busy. Call `hide()` when the data arrives. The host gets `position: relative` only if it needs it.',
            code: `const card = document.createElement('div');
card.style.cssText = 'padding:20px;border:1px solid var(--chill-border);border-radius:10px;color:var(--chill-text);background:var(--chill-bg-secondary);min-height:110px';
card.innerHTML = '<h4 style="margin:0 0 8px">Monthly revenue</h4><div style="font-size:28px;font-weight:600">$48,200</div><div>+12% vs last month</div>';
const refresh = ChillButton.create({ text: 'Refresh', size: 'sm', variant: 'outline' });
root.append(card, refresh);

const ov = ChillSpinner.overlay(card, { label: 'Refreshing revenue', blur: true, visible: false });
refresh.addEventListener('click', async () => {
  ov.show();
  await new Promise((r) => setTimeout(r, 1800));   // pretend to call your API
  ov.hide();
});
cleanup(() => { ov.destroy(); refresh.destroy(); });`,
            height: 200,
        },
        {
            id: 'delay',
            title: 'Delayed overlay (no flicker)',
            description: 'With `delay: 400` the overlay appears only if the work takes longer than 400 ms. Click both buttons to feel the difference.',
            code: `const panel = document.createElement('div');
panel.style.cssText = 'padding:20px;border:1px solid var(--chill-border);border-radius:10px;color:var(--chill-text);min-height:70px';
panel.textContent = 'Search results will appear here.';
const fast = ChillButton.create({ text: 'Fast request (150 ms)', size: 'sm', variant: 'outline' });
const slow = ChillButton.create({ text: 'Slow request (1.5 s)', size: 'sm' });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:10px';
row.append(fast, slow);
root.append(panel, row);

const ov = ChillSpinner.overlay(panel, { delay: 400, visible: false, label: 'Searching' });
const run = async (ms) => { ov.show(); await new Promise((r) => setTimeout(r, ms)); ov.hide(); };
fast.addEventListener('click', () => run(150));
slow.addEventListener('click', () => run(1500));
cleanup(() => { ov.destroy(); fast.destroy(); slow.destroy(); });`,
            height: 190,
        },
        {
            id: 'fullscreen',
            title: 'Full-screen and declarative',
            description: '`fullscreen()` blankets the viewport; destroy it when done. `init()` fills elements that carry `data-type`, `data-size`, `data-color` and `data-label`.',
            manual: true,
            code: `root.innerHTML = '<span data-chill-spinner data-type="bars" data-size="sm" data-color="success" data-label="Syncing"></span> ';
const declarative = ChillSpinner.init('[data-chill-spinner]');
const btn = ChillButton.create({ text: 'Show full-screen loader (2s)', variant: 'secondary' });
btn.addEventListener('click', () => {
  const f = ChillSpinner.fullscreen({ label: 'Please wait', showLabel: true, blur: true });
  setTimeout(() => f.destroy(), 2000);
});
root.append(btn);
cleanup(() => { declarative.destroy(); btn.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Three ways to use it',
            body:
                '- **`create(options)`** returns `{ element, setLabel, destroy }`. Append `element` wherever you need an inline loader, for example inside a button.\n' +
                '- **`overlay(el, options)`** appends a covering layer to `el` and returns `{ show, hide, setLabel, destroy, visible }`. Calling it again for the same element reuses the existing overlay.\n' +
                '- **`fullscreen(options)`** is an overlay for the whole viewport (or `container`). Always `destroy()` it when the work ends.\n\n' +
                'Overlay options: `blur` (soften the content behind, default false), `delay` (ms before it shows, default 0) and `visible` (show immediately, default true). ' +
                'All spinner options (`type`, `size`, `color`, `label`, `showLabel`, `thickness`, `speed`) also apply.',
        },
        {
            title: 'Wrapping an async task',
            body:
                '```js\nconst ov = ChillSpinner.overlay("#results", { delay: 300, label: "Searching" });\ntry {\n  const data = await fetch("/api/search").then(r => r.json());\n  render(data);\n} finally {\n  ov.hide();   // or ov.destroy() if you will not need it again\n}\n```\n\n' +
                'With `delay: 300` the overlay never appears for quick responses, and `hide()` cancels the pending show.',
        },
        {
            title: 'Styling',
            body:
                'Colours are custom properties, and `color` also accepts any CSS value:\n\n' +
                '```css\n:root {\n  --chillspinner-primary: #7c3aed;\n  --chillspinner-overlay: rgba(255, 255, 255, 0.8);\n}\n```\n\n' +
                'Set `thickness` (px) for a bolder ring and `speed` as a duration multiplier (`2` is twice as slow).',
        },
    ],
    options: [
        { name: 'type', type: "'ring' | 'dots' | 'bars' | 'pulse'", default: "'ring'", description: 'Animation style. Unknown values fall back to `ring`.' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", default: "'md'", description: 'Preset (14, 20, 32, 48, 72px) or pixel number. Fullscreen defaults to `lg`.' },
        { name: 'color', type: "'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'inherit' | string", default: "'primary'", description: '`inherit` uses `currentColor`; any other string is used as a CSS colour.' },
        { name: 'label', type: 'string', default: "'Loading'", description: 'Accessible text, visually hidden unless `showLabel` is true.' },
        { name: 'showLabel', type: 'boolean', default: 'false', description: 'Also display the label next to / under the spinner.' },
        { name: 'thickness', type: 'number', default: 'auto', description: 'Ring stroke width in px.' },
        { name: 'speed', type: 'number', default: '1', description: 'Animation duration multiplier (higher = slower).' },
        { name: 'blur', type: 'boolean', default: 'false', description: '`overlay` / `fullscreen` only: blur the covered content.' },
        { name: 'delay', type: 'number', default: '0', description: '`overlay` / `fullscreen` only: milliseconds to wait before showing.' },
        { name: 'visible', type: 'boolean', default: 'true', description: '`overlay` / `fullscreen` only: show right away. Use `false` and call `show()` later.' },
        { name: 'container', type: 'Element', default: 'document.body', description: '`fullscreen` only: element the overlay is appended to.' },
    ],
    methods: [
        { signature: 'ChillSpinner.create(options)', on: 'static', description: 'Standalone spinner. Returns `{ element, options, setLabel(label), destroy() }`.' },
        { signature: 'ChillSpinner.overlay(target, options)', on: 'static', description: 'Cover an element (selector or node). Returns an overlay instance, or `null` if the selector matches nothing.' },
        { signature: 'ChillSpinner.fullscreen(options)', on: 'static', description: 'Cover the viewport. Returns an overlay instance.' },
        { signature: 'ChillSpinner.init(target, options)', on: 'static', description: 'Append a spinner into each matching element, reading `data-type`, `data-size`, `data-color`, `data-label`. Returns `{ spinners, destroy() }`.' },
        { signature: 'ChillSpinner.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'overlay.show() / hide()', description: 'Reveal (respecting `delay`) or hide the overlay. `hide()` also cancels a pending delayed show.' },
        { signature: 'overlay.setLabel(label)', description: 'Change the announced (and visible) label.' },
        { signature: 'overlay.destroy()', description: 'Hide, remove the overlay and restore the host `position`.' },
        { signature: 'overlay.visible / overlay.element / overlay.spinner', description: 'Whether it is shown, the wrapper element and the inner spinner instance.' },
    ],
    cssVars: [
        { name: '--chillspinner-primary', description: 'Default spinner colour (also -success, -warning, -danger, -neutral).' },
        { name: '--chillspinner-track', description: 'Ring track colour.' },
        { name: '--chillspinner-overlay', description: 'Overlay background.' },
        { name: '--chillspinner-text', description: 'Visible label colour.' },
        { name: '--chillspinner-size / --chillspinner-color', description: 'Set per spinner from the options; override with CSS if needed.' },
    ],
    a11y: [
        'Each spinner is `role="status"` with `aria-live="polite"` and a visually hidden label.',
        'The animated shape is `aria-hidden`; with `showLabel` the visible copy is hidden from assistive tech to avoid double announcements.',
        'Overlays set `aria-busy="true"` on the covered element while visible and restore its previous value on hide.',
        '`prefers-reduced-motion` slows the animation rather than removing it, so loading remains visible.',
        'Overlays do not trap focus; disable controls yourself if the covered content must not be used.',
    ],
    tips: [
        'Use `delay` of 200-400 ms on overlays that wrap fast requests; sub-second flashes feel worse than no loader.',
        'For a button that is busy, `ChillButton`\'s built-in `setLoading()` is simpler than a separate spinner.',
        'In React, call `ChillSpinner.overlay(ref.current, ...)` in an effect and `destroy()` in cleanup; or render your own state and call `create()` once.',
        'Overlays stay in the DOM until `destroy()`. `hide()` only hides them, which is cheaper for repeated refreshes.',
    ],
    related: ['button', 'progress', 'skeleton'],
    keywords: ['loader', 'loading', 'busy', 'activity indicator', 'wait'],
};

export default doc;
