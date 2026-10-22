import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'badge',
    global: 'ChillBadge',
    category: 'feedback',
    title: 'Badge',
    summary: 'Status labels, counters and dots with six variants, outline and solid styles and removable badges.',
    style: 'create',
    description:
        'ChillBadge is a small inline label for statuses, categories and counts. ' +
        '`ChillBadge.create(options)` builds a general-purpose badge, `ChillBadge.createNotification(count)` a numeric counter that caps at "99+", and `ChillBadge.createDot()` a bare status dot.\n\n' +
        'Text is always escaped. Pass `html: true` for trusted markup, and note that `icon` is inserted as HTML so it must come from you, not from user input.',
    features: [
        'Six variants (default, primary, success, warning, error, info) in soft, solid or outline styles',
        'Three sizes, rounded or square shape, optional icon and leading dot',
        'Counter and notification badges with `max` capping ("99+")',
        'Bare status dots with an optional pulse animation',
        'Removable badges with an `onRemove` callback and a live `setText` / `setCount` API',
    ],
    examples: [
        {
            id: 'variants',
            title: 'Variants and styles',
            description: 'Soft by default. Add `solid` or `outline` for stronger or lighter looks.',
            height: 160,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'];
[{}, { solid: true }, { outline: true }].forEach((style) => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
  variants.forEach((variant) => row.append(ChillBadge.create({ text: variant, variant, ...style })));
  root.append(row);
});`,
        },
        {
            id: 'sizes-icons',
            title: 'Sizes, shapes, dots and icons',
            description: 'Sizes `sm`, `md`, `lg`; `shape: "square"`; `dot` adds a leading status dot; `icon` takes trusted SVG markup.',
            code: `const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>';
root.style.cssText += ';display:flex;gap:8px;align-items:center;flex-wrap:wrap';
root.append(
  ChillBadge.create({ text: 'Small', size: 'sm', variant: 'primary' }),
  ChillBadge.create({ text: 'Large', size: 'lg', variant: 'primary' }),
  ChillBadge.create({ text: 'Square', shape: 'square', variant: 'info' }),
  ChillBadge.create({ text: 'Active', dot: true, variant: 'success' }),
  ChillBadge.create({ text: 'Verified', icon: check, variant: 'success', solid: true }),
);`,
        },
        {
            id: 'counters',
            title: 'Counters and notification dots',
            description: '`createNotification(value)` caps at `max` (default 99). Passing `true` renders a bare dot. Update later with `setCount`.',
            code: `root.style.cssText += ';display:flex;gap:16px;align-items:center;flex-wrap:wrap';
const live = ChillBadge.createNotification(3, { max: 9 });
root.append(
  ChillBadge.createNotification(5),
  ChillBadge.createNotification(120),
  ChillBadge.createNotification(true, { label: 'New activity' }),
  live,
  ChillBadge.create({ text: 'Messages', count: 250, max: 99, variant: 'primary' }),
);
let n = 3;
const timer = setInterval(() => live.chillbadge.setCount(++n), 800);
cleanup(() => clearInterval(timer));`,
        },
        {
            id: 'status-dots',
            title: 'Status dots',
            description: '`createDot()` makes a bare dot; `label` is its accessible name. `pulse` adds a soft ring that is disabled under reduced motion.',
            code: `root.style.cssText += ';display:flex;gap:20px;align-items:center;color:var(--chill-text);font-size:14px';
[['Online', 'success', true], ['Degraded', 'warning', false], ['Down', 'error', true]].forEach(([label, variant, pulse]) => {
  const item = document.createElement('span');
  item.style.cssText = 'display:inline-flex;gap:8px;align-items:center';
  item.append(ChillBadge.createDot({ variant, pulse, label }), label);
  root.append(item);
});`,
        },
        {
            id: 'removable',
            title: 'Removable badges',
            description: '`removable` adds an X button. `onRemove(badge)` receives the element, so you can update your data and call `badge.chillbadge.destroy()`.',
            height: 120,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
['Design', 'Frontend', 'Accessibility', 'Performance'].forEach((text) => {
  root.append(ChillBadge.create({
    text, variant: 'primary', removable: true, removeLabel: 'Remove ' + text,
    onRemove: (badge) => badge.chillbadge.destroy(),
  }));
});`,
        },
    ],
    guides: [
        {
            title: 'Which factory to use',
            body:
                '- **`create(options)`**: general label. Supports text, icon, dot, count, removable and every style option.\n' +
                '- **`createNotification(value, options)`**: counter chip. Solid and `error` by default; `value` of `true`, `""` or `null` renders a dot. Options: `variant`, `solid`, `max`, `pulse`, `label`.\n' +
                '- **`createDot(options)`**: bare status dot (default `success`). Options: `variant`, `size`, `pulse`, `label`.\n\n' +
                'Every element exposes `el.chillbadge` with `setText(text)`, `setCount(value, max?)` and `destroy()`.',
        },
        {
            title: 'Positioning on other elements',
            body:
                'Badges are inline elements and do not position themselves. To pin a counter to a button or avatar, wrap both in a `position: relative` container and place the badge absolutely:\n\n' +
                '```css\n.has-badge { position: relative; display: inline-block; }\n.has-badge .chillbadge { position: absolute; top: -6px; right: -6px; }\n```',
        },
        {
            title: 'Theming',
            body:
                'Soft variants read their colours from CSS variables:\n\n' +
                '```css\n:root {\n  --chillbadge-primary-bg: #ede9fe;\n  --chillbadge-primary-text: #5b21b6;\n}\n```\n\n' +
                'Solid variants use fixed colours; override the `.chillbadge-solid.chillbadge-primary` rules if you need to change them.',
        },
    ],
    options: [
        { name: 'text / label', type: 'string', default: "''", description: 'Badge text (escaped). `text` wins over `label`. With `dotOnly`, `label` is the accessible name.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat the text as HTML (caller must sanitise).' },
        { name: 'icon', type: 'string', default: 'undefined', description: 'Trusted icon markup (e.g. an SVG). Inserted as HTML.' },
        { name: 'variant', type: "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'", default: "'default'", description: 'Colour.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and font size.' },
        { name: 'solid', type: 'boolean', default: 'false', description: 'Filled, high-contrast style.' },
        { name: 'outline', type: 'boolean', default: 'false', description: 'Transparent background with a border.' },
        { name: 'shape', type: "'rounded' | 'square'", default: 'undefined', description: 'Corner style.' },
        { name: 'dot', type: 'boolean', default: 'false', description: 'Add a leading status dot.' },
        { name: 'dotOnly', type: 'boolean', default: 'false', description: 'Render only a dot (solid, no text). Give it a `label`.' },
        { name: 'pulse', type: 'boolean', default: 'false', description: 'Animated pulse ring (disabled under `prefers-reduced-motion`).' },
        { name: 'count', type: 'number', default: 'undefined', description: 'Numeric text, capped by `max`.' },
        { name: 'max', type: 'number', default: '99', description: 'Upper bound of `count`; larger values show as "max+".' },
        { name: 'removable', type: 'boolean', default: 'false', description: 'Add a remove button.' },
        { name: 'onRemove', type: '(badge: HTMLElement) => void', default: 'undefined', description: 'Called when the remove button is clicked. It does not remove the badge by itself.' },
        { name: 'removeLabel', type: 'string', default: "'Remove'", description: 'Accessible label of the remove button.' },
        { name: 'ariaLabel', type: 'string', default: 'undefined', description: 'Explicit accessible name.' },
    ],
    methods: [
        { signature: 'ChillBadge.create(options?)', on: 'static', description: 'Build a badge element.' },
        { signature: 'ChillBadge.createNotification(value, options?)', on: 'static', description: 'Counter badge; `true`, `""` or `null` renders a dot.' },
        { signature: 'ChillBadge.createDot(options?)', on: 'static', description: 'Bare status dot.' },
        { signature: 'ChillBadge.formatCount(value, max?)', on: 'static', description: 'Returns the capped text, for example `formatCount(120, 99)` is "99+".' },
        { signature: 'ChillBadge.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'el.chillbadge.setText(text)', description: 'Replace the text (no effect on dot-only badges made with `create`).' },
        { signature: 'el.chillbadge.setCount(value, max?)', description: 'Set a capped number.' },
        { signature: 'el.chillbadge.destroy()', description: 'Remove the badge and its remove-button listener.' },
    ],
    cssVars: [
        { name: '--chillbadge-default-bg / -text', description: 'Soft default colours.' },
        { name: '--chillbadge-primary-bg / -text', description: 'Soft primary colours (also success, warning, error, info).' },
        { name: '--chillbadge-ring', description: 'Focus ring of the remove button.' },
    ],
    a11y: [
        'Notification and dot-only badges use `role="status"` and an `aria-label` ("5 notifications", or your `label`).',
        'Plain badges expose their text; provide `ariaLabel` when the text alone is ambiguous (for example just "3").',
        'The remove button is a native `<button>` with an `aria-label`, so it works with Enter and Space and shows a focus ring.',
        'The pulse animation is disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Do not rely on colour alone: pair variants with meaningful text or an icon.',
        '`onRemove` only notifies you; call `badge.chillbadge.destroy()` (and update your state) to remove the element.',
        'A `solid` badge with the `default` variant looks the same as the soft one; use a coloured variant for solid.',
        'In React, build the badge in an effect or render a `<span className="chillbadge chillbadge-primary chillbadge-md">` yourself.',
    ],
    related: ['tag', 'avatar', 'tooltip', 'button'],
    keywords: ['label', 'pill', 'status', 'counter', 'notification', 'chip', 'indicator'],
};

export default doc;
