import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'progress',
    global: 'ChillProgress',
    category: 'feedback',
    title: 'Progress',
    summary: 'Progress bars, rings and step indicators with colours, stripes, indeterminate mode and live updates.',
    style: 'init',
    description:
        'ChillProgress covers three progress patterns: a linear **bar**, a circular **ring** and a **step** indicator. ' +
        '`ChillProgress.init(target, options)` replaces a placeholder element with a bar or ring and returns an instance you update with `setValue()`; ' +
        '`createCircle()` and `createSteps()` return standalone elements.\n\n' +
        'Everything is exposed as `role="progressbar"` with correct `aria-valuenow`/`aria-valuetext`, switches to an indeterminate state when the amount is unknown, and fires `change` and `complete` events.',
    features: [
        'Bar and ring variants, five bar sizes and any pixel size for rings',
        'Named colours (primary, success, warning, error) or any CSS colour',
        'Striped, animated and gradient bars, plus an indeterminate loading state',
        'Custom value text with `valueFormat` and `min`/`max` ranges',
        'Step indicator for wizards and checkouts',
    ],
    examples: [
        {
            id: 'bar',
            title: 'Progress bar',
            description: 'A labelled bar that counts up. `setValue()` animates the fill and updates the percentage and ARIA values.',
            code: `const el = document.createElement('div');
root.append(el);
const bar = ChillProgress.init(el, { label: 'Uploading photos', value: 0, color: 'success' });
let v = 0;
const timer = setInterval(() => {
  v = Math.min(100, v + 10);
  bar.setValue(v);
  if (v >= 100) clearInterval(timer);
}, 300);
cleanup(() => { clearInterval(timer); bar.destroy(); });`,
        },
        {
            id: 'styles',
            title: 'Colours, sizes and effects',
            description: 'Named colours, custom CSS colours, `striped` with `animated`, and `gradient`. Sizes run from `xs` to `xl`.',
            height: 260,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const specs = [
  { label: 'Primary, small', value: 35, size: 'sm' },
  { label: 'Warning, striped', value: 60, color: 'warning', striped: true, animated: true },
  { label: 'Custom colour, large', value: 80, color: '#8b5cf6', size: 'lg' },
  { label: 'Gradient', value: 50, gradient: true },
];
const bars = specs.map((spec) => {
  const el = document.createElement('div');
  root.append(el);
  return ChillProgress.init(el, spec);
});
cleanup(() => bars.forEach((b) => b.destroy()));`,
        },
        {
            id: 'ring',
            title: 'Ring and custom value text',
            description: 'Set `variant: "circle"` for a ring. `valueFormat(value, percent)` customises the centre text, here a storage readout with a 0 to 256 range.',
            height: 200,
            code: `root.style.cssText += ';display:flex;gap:24px;align-items:center;flex-wrap:wrap';
const mk = (opts) => { const el = document.createElement('div'); root.append(el); return ChillProgress.init(el, opts); };
const rings = [
  mk({ variant: 'circle', value: 72, size: 'lg', label: 'CPU' }),
  mk({ variant: 'circle', value: 190, max: 256, size: 120, color: 'warning', label: 'Storage', valueFormat: (v) => v + ' GB' }),
  mk({ variant: 'circle', value: 100, size: 'sm', color: 'success', showValue: true, ariaLabel: 'Backup complete' }),
];
cleanup(() => rings.forEach((r) => r.destroy()));`,
        },
        {
            id: 'indeterminate-events',
            title: 'Indeterminate and events',
            description: 'Use `indeterminate: true` while the amount is unknown, then switch with `setIndeterminate(false)`. `onComplete` fires once when 100% is reached.',
            height: 180,
            code: `const el = document.createElement('div');
root.append(el);
const note = document.createElement('p');
note.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
note.textContent = 'Connecting...';
root.append(note);
const bar = ChillProgress.init(el, {
  label: 'Syncing', indeterminate: true,
  onComplete: () => { note.textContent = 'Sync complete'; },
});
const t1 = setTimeout(() => { bar.setIndeterminate(false); bar.setValue(40); note.textContent = 'Downloading...'; }, 1500);
const t2 = setTimeout(() => bar.setValue(100), 3000);
cleanup(() => { clearTimeout(t1); clearTimeout(t2); bar.destroy(); });`,
        },
        {
            id: 'steps',
            title: 'Step indicator',
            description: '`createSteps()` returns an element. `current` is the zero-based active step; call `setCurrent(n)` to advance.',
            height: 140,
            code: `const steps = ChillProgress.createSteps({ steps: ['Cart', 'Shipping', 'Payment', 'Done'], current: 0 });
root.append(steps);
let i = 0;
const timer = setInterval(() => { i = (i + 1) % 4; steps.setCurrent(i); }, 1200);
cleanup(() => { clearInterval(timer); steps.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'init, createCircle and createSteps',
            body:
                '- **`ChillProgress.init(target, options)`** replaces `target` (a selector or an element) with a bar or ring and returns an instance. `destroy()` puts the original element back.\n' +
                '- **`ChillProgress.createCircle(options)`** returns a standalone ring element with `setValue(v)` and `destroy()`. It accepts `size`, `strokeWidth`, `value`, `min`, `max`, `color`, `showValue`, `valueFormat`, `label`, `ariaLabel` and `indeterminate`.\n' +
                '- **`ChillProgress.createSteps({ steps, current })`** returns a step list with `setCurrent(n)` and `destroy()`. A step is a string or `{ label }`.\n\n' +
                'The instance exposes `container`, `fill` and `valueEl` for custom styling.',
        },
        {
            title: 'Values and ranges',
            body:
                'By default `value` runs from `min: 0` to `max: 100` and is shown as a percentage. For other units set `min`/`max` and use `valueFormat`:\n\n' +
                '```js\nChillProgress.init(\'#disk\', {\n  value: 42, max: 128,\n  valueFormat: (value, percent) => `${value} of 128 GB`,\n});\n```\n\n' +
                'Values outside the range are clamped for display. `change` fires when the value differs from the previous one; `complete` fires once when 100% is reached and re-arms if the value drops below 100.',
        },
        {
            title: 'Theming',
            body:
                'Override the variables on `:root` or any ancestor. Named colours use `--chillprogress-success`, `-warning` and `-error`; the default fill is `--chillprogress-fill`.\n\n' +
                '```css\n:root {\n  --chillprogress-fill: #0ea5e9;\n  --chillprogress-bg: #e0f2fe;\n}\n```',
        },
    ],
    options: [
        { name: 'variant', type: "'bar' | 'circle'", default: "'bar'", description: 'Linear bar or ring.' },
        { name: 'value', type: 'number', default: '0', description: 'Current value.' },
        { name: 'min', type: 'number', default: '0', description: 'Range start.' },
        { name: 'max', type: 'number', default: '100', description: 'Range end.' },
        { name: 'label', type: 'string', default: "''", description: 'Visible label (text).' },
        { name: 'labelHtml', type: 'string', default: 'undefined', description: 'Label markup (trusted only).' },
        { name: 'ariaLabel', type: 'string', default: "'Progress'", description: 'Accessible name when there is no label.' },
        { name: 'showValue', type: 'boolean', default: 'true', description: 'Show the value text (bar: top right, ring: centred).' },
        { name: 'valueFormat', type: '(value: number, percent: number) => string', default: 'percent rounded + "%"', description: 'Custom value text.' },
        { name: 'size', type: "bar: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; ring: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Bar thickness, or ring diameter (numbers are pixels; xs 32, sm 48, md 80, lg 120, xl 160).' },
        { name: 'strokeWidth', type: 'number', default: 'about size / 10', description: 'Ring thickness in pixels.' },
        { name: 'color', type: "'primary' | 'success' | 'warning' | 'error' | string", default: "'primary'", description: 'Named colour or any CSS colour (`#8b5cf6`, `rgb(...)`, `var(--x)`).' },
        { name: 'striped', type: 'boolean', default: 'false', description: 'Bar only: diagonal stripes.' },
        { name: 'animated', type: 'boolean', default: 'false', description: 'Bar only: animate the stripes.' },
        { name: 'gradient', type: 'boolean', default: 'false', description: 'Bar only: multi-colour gradient fill.' },
        { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Unknown progress: removes `aria-valuenow` and shows a looping animation.' },
        { name: 'onChange', type: '(value: number, percent: number) => void', default: 'undefined', description: 'Called when the value changes.' },
        { name: 'onComplete', type: '() => void', default: 'undefined', description: 'Called once when 100% is reached.' },
        { name: 'createSteps: steps', type: 'Array<string | { label: string }>', default: '[]', description: 'Step labels.' },
        { name: 'createSteps: current', type: 'number', default: '0', description: 'Zero-based index of the active step.' },
        { name: 'createSteps: ariaLabel', type: 'string', default: "'Progress'", description: 'Accessible name of the step list.' },
    ],
    methods: [
        { signature: 'ChillProgress.init(target, options?)', on: 'static', description: 'Replace `target` with a bar or ring; returns an instance.' },
        { signature: 'ChillProgress.createCircle(options?)', on: 'static', description: 'Standalone ring element with `setValue(v)` and `destroy()`.' },
        { signature: 'ChillProgress.createSteps(options?)', on: 'static', description: 'Step indicator element with `setCurrent(n)` and `destroy()`.' },
        { signature: 'ChillProgress.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.setValue(value)', description: 'Update the value; fires `change` and, at 100%, `complete`.' },
        { signature: 'instance.getValue() / getPercent()', description: 'Current raw value / percentage (0 to 100).' },
        { signature: 'instance.setMax(max)', description: 'Change the upper bound and re-render.' },
        { signature: 'instance.setLabel(label, html?)', description: 'Change the label text (markup when `html` is true).' },
        { signature: 'instance.setColor(color)', description: 'Change the colour.' },
        { signature: 'instance.setIndeterminate(flag)', description: 'Toggle the indeterminate state.' },
        { signature: 'instance.on(event, fn) / off(event, fn?)', description: 'Subscribe to or remove event handlers. Both return the instance.' },
        { signature: 'instance.container / fill / valueEl', description: 'Properties: root element, fill element (bar div or ring circle) and value text element.' },
        { signature: 'instance.destroy()', description: 'Remove the component and restore the original element.' },
    ],
    events: [
        { name: 'change', payload: '(value: number, percent: number)', description: 'Fired when `setValue()` receives a different value.' },
        { name: 'complete', description: 'Fired once when the value reaches 100%.' },
    ],
    cssVars: [
        { name: '--chillprogress-fill', description: 'Default fill colour (primary).' },
        { name: '--chillprogress-bg', description: 'Track colour.' },
        { name: '--chillprogress-text', description: 'Label and value colour.' },
        { name: '--chillprogress-success / -warning / -error', description: 'Named colour fills.' },
    ],
    a11y: [
        'The bar track (or ring) has `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext`.',
        'It is named by the visible label (`aria-labelledby`) or by `ariaLabel`.',
        'Indeterminate mode removes `aria-valuenow`/`aria-valuetext` and sets `aria-busy="true"`.',
        'The step list uses `role="list"` with `aria-current="step"` on the active step and hidden "completed / current / upcoming" text for screen readers.',
        'Animations are disabled under `prefers-reduced-motion`; the indeterminate bar becomes a static half-opaque bar.',
    ],
    tips: [
        'Throttle `setValue()` for rapid streams (for example upload progress events); one update per animation frame is plenty.',
        'Keep the instance and call `destroy()` when unmounting; it restores the placeholder you passed to `init()`.',
        'In React, render an empty `<div ref>`, call `init()` in an effect, and update with `setValue()` when props change.',
        '`setMax()` re-renders but does not fire `complete`; call `setValue()` afterwards if completion depends on it.',
    ],
    related: ['spinner', 'skeleton', 'badge', 'alert'],
    keywords: ['loading', 'upload', 'meter', 'gauge', 'stepper', 'wizard', 'percent'],
};

export default doc;
