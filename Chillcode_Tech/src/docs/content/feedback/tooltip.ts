import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'tooltip',
    global: 'ChillTooltip',
    category: 'feedback',
    title: 'Tooltip',
    summary: 'Lightweight tooltips with auto-flip, variants, delays and hover, focus, click or manual triggers.',
    style: 'init',
    description:
        'ChillTooltip attaches a small floating label to any element you already have. Call `ChillTooltip.init(trigger, options)` for one element, ' +
        'or `ChillTooltip.initAll(selector)` to wire up every `[data-tooltip]` on the page.\n\n' +
        'The tooltip is rendered in `document.body`, positioned next to the trigger and flipped to the opposite side when it would leave the viewport. ' +
        'Content is inserted as **text** by default; pass `html: true` only for markup you trust or have sanitised.',
    features: [
        'Four positions with automatic flip and viewport clamping, arrow re-aimed at the trigger',
        'Six variants: default, light, primary, success, warning, error',
        'Hover (mouse and keyboard focus), focus-only, click or fully manual triggers',
        'Show and hide delays, `show` / `hide` events and callbacks',
        'Wires `aria-describedby` on the trigger and dismisses on Esc',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Hover and focus',
            description: 'Initialise a trigger with `content`. The tooltip shows on mouse hover and on keyboard focus.',
            height: 140,
            code: `const btn = document.createElement('button');
btn.textContent = 'Save draft';
btn.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const tip = ChillTooltip.init(btn, { content: 'Saves a copy to your drafts folder' });
tip.show();                      // open once so the preview is not empty
setTimeout(() => tip.hide(), 1800);
cleanup(() => tip.destroy());`,
        },
        {
            id: 'positions',
            title: 'Positions and variants',
            description: 'Pick a side with `position` and a colour with `variant`. If a side does not fit, the tooltip flips automatically.',
            height: 200,
            code: `root.style.cssText += ';display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;padding-top:60px';
const combos = [
  ['top', 'default'], ['bottom', 'light'], ['left', 'primary'],
  ['right', 'success'], ['top', 'warning'], ['bottom', 'error'],
];
const tips = combos.map(([position, variant]) => {
  const b = document.createElement('button');
  b.textContent = position + ' / ' + variant;
  b.style.cssText = 'padding:6px 12px;border-radius:6px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  root.append(b);
  return ChillTooltip.init(b, { content: 'Tooltip on the ' + position, position, variant });
});
cleanup(() => tips.forEach((t) => t.destroy()));`,
        },
        {
            id: 'data-attribute',
            title: 'Declarative with data-tooltip',
            description: '`initAll` reads the text from each element\'s `data-tooltip` attribute, so server-rendered markup needs no JavaScript per element.',
            height: 120,
            code: `root.innerHTML =
  '<p style="color:var(--chill-text);line-height:2">' +
  'Press <kbd data-tooltip="Copy" style="padding:2px 6px;border:1px solid var(--chill-border);border-radius:4px">Ctrl+C</kbd>, ' +
  '<kbd data-tooltip="Paste" style="padding:2px 6px;border:1px solid var(--chill-border);border-radius:4px">Ctrl+V</kbd> or ' +
  '<kbd data-tooltip="Undo the last action" style="padding:2px 6px;border:1px solid var(--chill-border);border-radius:4px">Ctrl+Z</kbd>.</p>';
const tips = ChillTooltip.initAll('[data-tooltip]', { position: 'bottom', delay: 150 });
cleanup(() => tips.forEach((t) => t.destroy()));`,
        },
        {
            id: 'click-events',
            title: 'Click trigger and events',
            description: 'With `triggerOn: "click"` the tooltip toggles on click and closes when you click elsewhere. Listen with `on()` or the `onShow` / `onHide` callbacks.',
            height: 140,
            code: `const btn = document.createElement('button');
btn.textContent = 'What is this?';
btn.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
const status = document.createElement('span');
status.style.cssText = 'margin-left:12px;color:var(--chill-text);font-size:13px';
status.textContent = 'hidden';
root.append(btn, status);
const tip = ChillTooltip.init(btn, { content: 'Click anywhere else to dismiss me', triggerOn: 'click', position: 'right', variant: 'primary' });
tip.on('show', () => { status.textContent = 'visible'; });
tip.on('hide', () => { status.textContent = 'hidden'; });
cleanup(() => tip.destroy());`,
        },
        {
            id: 'rich-manual',
            title: 'Rich content, manual control',
            description: 'Use `triggerOn: "manual"` to drive the tooltip yourself, and `html: true` for markup. `setContent()` updates a visible tooltip in place.',
            height: 160,
            code: `const badge = document.createElement('span');
badge.textContent = 'Storage 82%';
badge.style.cssText = 'display:inline-block;padding:6px 12px;border-radius:999px;background:var(--chill-bg-secondary);border:1px solid var(--chill-border);color:var(--chill-text);font-size:13px';
root.append(badge);
const tip = ChillTooltip.init(badge, {
  triggerOn: 'manual', html: true, position: 'bottom', variant: 'warning', showArrow: true,
  content: '<strong>Almost full</strong><br>Free up space to keep syncing.',
});
tip.show();
const t = setTimeout(() => tip.setContent('<strong>Cleaned up</strong><br>18 GB freed.', true), 2000);
cleanup(() => { clearTimeout(t); tip.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'init vs initAll',
            body:
                '- **`ChillTooltip.init(trigger, options)`** takes a selector or an element and returns one instance.\n' +
                '- **`ChillTooltip.initAll(selector = "[data-tooltip]", options)`** creates one instance per match and returns an array. Shared options apply to all of them.\n\n' +
                'If `content` is empty the text falls back to the trigger\'s `data-tooltip` attribute. Keep the returned instance(s) and call `destroy()` when the trigger is removed: it removes the tooltip element, its listeners and the `aria-describedby` link.',
        },
        {
            title: 'Trigger modes',
            body:
                '- `hover` (default): mouse enter/leave **and** keyboard focus/blur, so keyboard users get the tip too.\n' +
                '- `focus`: only focus and blur, useful for form fields.\n' +
                '- `click`: toggles on click; a click outside closes it while it is open.\n' +
                '- `manual`: nothing is bound; call `show()`, `hide()` or `toggle()` yourself.\n\n' +
                '`show(delay?)` and `hide(delay?)` accept an override in milliseconds; otherwise `delay` and `hideDelay` apply. Pressing Esc hides a visible tooltip in every mode.',
        },
        {
            title: 'Theming',
            body:
                'Colours come from CSS custom properties and automatically invert in dark mode (`prefers-color-scheme`, `data-theme="dark"` or `.dark`):\n\n' +
                '```css\n:root {\n  --chilltooltip-bg: #1e293b;\n  --chilltooltip-text: #f8fafc;\n}\n```',
        },
    ],
    options: [
        { name: 'content', type: 'string', default: "''", description: "Tooltip text. Falls back to the trigger's `data-tooltip`. Inserted as text unless `html` is true." },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert `content` as HTML. You are responsible for sanitising it.' },
        { name: 'position', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Preferred side. Invalid values fall back to `top`.' },
        { name: 'flip', type: 'boolean', default: 'true', description: 'Flip to the opposite side when the tooltip does not fit in the viewport.' },
        { name: 'variant', type: "'default' | 'light' | 'primary' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Colour scheme.' },
        { name: 'offset', type: 'number', default: '8', description: 'Gap in pixels between trigger and tooltip.' },
        { name: 'delay', type: 'number', default: '0', description: 'Show delay in milliseconds.' },
        { name: 'hideDelay', type: 'number', default: '0', description: 'Hide delay in milliseconds.' },
        { name: 'showArrow', type: 'boolean', default: 'true', description: 'Render the arrow pointing at the trigger.' },
        { name: 'triggerOn', type: "'hover' | 'focus' | 'click' | 'manual'", default: "'hover'", description: 'Which interaction opens the tooltip. `hover` also reacts to keyboard focus.' },
        { name: 'id', type: 'string', default: "auto ('chilltooltip-N')", description: 'id of the tooltip element, referenced by `aria-describedby` on the trigger.' },
        { name: 'onShow', type: '(instance) => void', default: 'undefined', description: 'Called after the tooltip becomes visible.' },
        { name: 'onHide', type: '(instance) => void', default: 'undefined', description: 'Called after the tooltip is hidden.' },
    ],
    methods: [
        { signature: 'ChillTooltip.init(trigger, options?)', on: 'static', description: 'Attach a tooltip to a selector or element; returns an instance.' },
        { signature: 'ChillTooltip.initAll(selector?, options?)', on: 'static', description: 'Attach tooltips to every match (default `[data-tooltip]`); returns an array of instances.' },
        { signature: 'ChillTooltip.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.show(delay?)', description: 'Show the tooltip, optionally overriding the show delay (ms).' },
        { signature: 'instance.hide(delay?)', description: 'Hide the tooltip, optionally overriding the hide delay (ms).' },
        { signature: 'instance.toggle()', description: 'Show if hidden, hide if visible.' },
        { signature: 'instance.setContent(content, html?)', description: 'Replace the content. `html` defaults to the `html` option.' },
        { signature: 'instance.setPosition(position)', description: 'Change the preferred side; ignored for invalid values.' },
        { signature: 'instance.isVisible()', description: 'Returns true while the tooltip is shown.' },
        { signature: 'instance.on(event, fn) / off(event, fn?)', description: 'Subscribe to or remove event handlers. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Remove the tooltip element, listeners and `aria-describedby` link.' },
    ],
    events: [
        { name: 'show', payload: 'instance', description: 'Fired when the tooltip becomes visible.' },
        { name: 'hide', payload: 'instance', description: 'Fired when the tooltip is hidden.' },
    ],
    cssVars: [
        { name: '--chilltooltip-bg', description: 'Tooltip and arrow background.' },
        { name: '--chilltooltip-text', description: 'Text colour.' },
        { name: '--chilltooltip-border', description: 'Border colour of the `light` variant.' },
        { name: '--chilltooltip-shadow', description: 'Box shadow.' },
    ],
    a11y: [
        'The tooltip element has `role="tooltip"` and the trigger gets `aria-describedby` pointing to it while the instance lives (existing values are preserved).',
        'Hover mode also opens on keyboard focus and closes on blur; Esc dismisses a visible tooltip.',
        'The tooltip has `pointer-events: none`, so it never steals clicks. Do not put interactive content in it, use ChillPopover instead.',
        'Transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Tooltips are for short, non-essential hints. Anything the user must read or click belongs in a Popover.',
        'In React, call `init()` in an effect on a ref and return `() => tip.destroy()` from it.',
        'The module is safe to import on the server; create instances in the browser only (the constructor throws without a DOM).',
        'Tooltips follow the trigger on scroll and resize while visible.',
    ],
    related: ['popover', 'dropdown', 'badge'],
    keywords: ['hint', 'title', 'hover', 'balloon', 'help text'],
};

export default doc;
