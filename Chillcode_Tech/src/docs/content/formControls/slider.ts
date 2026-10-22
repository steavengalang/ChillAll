import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'slider',
    global: 'ChillSlider',
    category: 'formControls',
    title: 'Slider',
    summary: 'Single or dual-handle range slider with marks, tooltips, vertical mode and full keyboard control.',
    style: 'create',
    description:
        'ChillSlider is a zero-dependency range control. Pass a number for a single handle or a `[low, high]` pair for a range, and add marks, tooltips, a value formatter and a form `name` as needed.\n\n' +
        '`ChillSlider.create()` returns an instance with an `.element`; give it a `container` to mount it right away. `ChillSlider.init(target, options)` is the same but mounts into an existing element.',
    features: [
        'Single value or dual-handle range with a `minGap` between handles',
        'Marks (every step, a list of values, or `{ value, label }` objects) that light up inside the range',
        'Tooltips on hover or always visible, with a custom `formatter` (also used for `aria-valuetext`)',
        'Horizontal or vertical, three sizes, and hidden inputs for form submission',
        'Pointer drag plus complete keyboard support (arrows, Page keys, Home/End)',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic slider',
            description: 'A single handle with a step of 5. `onInput` fires while dragging, `onChange` when the value is committed.',
            code: `root.style.maxWidth = '420px';
const out = document.createElement('p');
out.style.cssText = 'margin:18px 0 0;font-size:13px;color:var(--chill-text)';
out.textContent = 'Volume: 40';
const s = ChillSlider.create({
  min: 0, max: 100, step: 5, value: 40,
  label: 'Volume',
  container: root,
  onInput: (v) => (out.textContent = 'Volume: ' + v),
});
root.append(out);
cleanup(() => s.destroy());`,
            height: 140,
        },
        {
            id: 'range',
            title: 'Price range with formatter',
            description: 'An array value makes a dual-handle slider. `formatter` shapes the tooltip and `aria-valuetext`; `minGap` keeps the handles apart.',
            height: 140,
            code: `root.style.maxWidth = '460px';
const s = ChillSlider.create({
  min: 0, max: 1000, step: 10,
  value: [200, 650],
  minGap: 50,
  tooltip: 'always',
  label: ['Minimum price', 'Maximum price'],
  formatter: (v) => '$' + v,
  container: root,
});
root.style.paddingTop = '48px';
cleanup(() => s.destroy());`,
        },
        {
            id: 'marks',
            title: 'Marks and labels',
            description: 'Marks can be `true` (a tick per step), plain numbers or `{ value, label }` objects.',
            height: 150,
            code: `root.style.maxWidth = '460px';
const s = ChillSlider.create({
  min: 0, max: 100, step: 25, value: 50,
  marks: [
    { value: 0, label: 'Low' },
    { value: 25, label: '25' },
    { value: 50, label: 'Medium' },
    { value: 75, label: '75' },
    { value: 100, label: 'High' },
  ],
  container: root,
});
cleanup(() => s.destroy());`,
        },
        {
            id: 'vertical-sizes',
            title: 'Vertical and sizes',
            description: '`vertical: true` flips the orientation (give the container a height). Sizes are `sm`, `md` and `lg`.',
            height: 220,
            code: `root.style.cssText += ';display:flex;gap:40px;align-items:flex-start';
const make = (opts) => {
  const holder = document.createElement('div');
  holder.style.cssText = 'height:160px;padding:8px 0';
  root.append(holder);
  return ChillSlider.create({ ...opts, container: holder });
};
const sliders = [
  make({ vertical: true, value: 30, size: 'sm', tooltip: false }),
  make({ vertical: true, value: 60, size: 'md' }),
  make({ vertical: true, value: 90, size: 'lg', tooltip: 'always' }),
];
cleanup(() => sliders.forEach((s) => s.destroy()));`,
        },
        {
            id: 'api',
            title: 'Events and programmatic control',
            description: '`on(event, fn)` subscribes to `input` and `change` and returns an unsubscribe function. `setValue(v, silent)` moves the handle(s) from code.',
            height: 190,
            code: `root.style.maxWidth = '420px';
const log = document.createElement('p');
log.style.cssText = 'margin:18px 0 8px;font-size:13px;color:var(--chill-text)';
const s = ChillSlider.init(root.appendChild(document.createElement('div')), {
  min: 0, max: 24, step: 1, value: [9, 17],
  formatter: (v) => String(v).padStart(2, '0') + ':00',
  tooltip: 'always',
  name: 'hours',
});
const off = s.on('change', (v) => (log.textContent = 'Open from ' + v[0] + ' to ' + v[1]));
const btn = document.createElement('button');
btn.textContent = 'Night shift (22 - 6)';
btn.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
btn.onclick = () => s.setValue([6, 22]);
root.style.paddingTop = '40px';
root.append(log, btn);
cleanup(() => { off(); s.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance object (not an element). The root node is `instance.element`.\n\n' +
                '- **`create(options)`** builds a slider; pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts the new slider into an existing element or selector and returns `null` if the target is missing.\n\n' +
                'The instance exposes `getValue()`, `setValue(value, silent?)`, `setDisabled(bool)`, `isDisabled()`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Values, events and forms',
            body:
                'A number gives a single handle; an array (or `range: true`) gives two. `getValue()` returns a number or `[low, high]`. Values snap to `step` and are clamped to `min`/`max`.\n\n' +
                '- `onInput(value, inst)` fires continuously while dragging; `onChange(value, inst)` fires when a value is committed (pointer release, key press, or `setValue`).\n' +
                '- `setValue(value, true)` updates silently without firing `change`.\n' +
                '- Set `name` to render hidden inputs (`name`, or `name-min` / `name-max` for ranges) that stay in sync for form submission.',
        },
        {
            title: 'Keyboard',
            body:
                'Each handle is a focusable `role="slider"`. Arrow keys move by `step`, `PageUp`/`PageDown` by `largeStep` (default `step * 10`), `Home` and `End` jump to the extremes.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillslider-fill: #16a34a;\n  --chillslider-thumb-border: #16a34a;\n  --chillslider-track: #e2e8f0;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'min', type: 'number', default: '0', description: 'Minimum value.' },
        { name: 'max', type: 'number', default: '100', description: 'Maximum value (forced above `min`).' },
        { name: 'step', type: 'number', default: '1', description: 'Increment; values snap to it.' },
        { name: 'value', type: 'number | [number, number]', default: 'min', description: 'Initial value. An array enables the dual-handle range.' },
        { name: 'range', type: 'boolean', default: 'false', description: 'Force dual handles even with a number value (defaults to `[min, max]`).' },
        { name: 'minGap', type: 'number', default: '0', description: 'Minimum distance between the two handles.' },
        { name: 'largeStep', type: 'number', default: 'step * 10', description: 'PageUp / PageDown increment.' },
        { name: 'marks', type: 'boolean | number[] | { value, label }[]', default: 'false', description: '`true` ticks every step (up to 50), or pass values or `{ value, label }` objects.' },
        { name: 'tooltip', type: "'hover' | 'always' | false", default: "'hover'", description: 'When to show the value bubble.' },
        { name: 'vertical', type: 'boolean', default: 'false', description: 'Vertical orientation.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Track and thumb size.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable interaction.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name for forms (`name-min` / `name-max` for ranges).' },
        { name: 'label', type: 'string | [string, string]', default: 'null', description: '`aria-label` for the handle(s). Ranges default to "Minimum" / "Maximum".' },
        { name: 'formatter', type: '(value: number) => string', default: 'null', description: 'Formats the tooltip, mark labels and `aria-valuetext`.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector the slider is appended to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onInput', type: '(value, instance) => void', default: 'null', description: 'Fired continuously while dragging.' },
        { name: 'onChange', type: '(value, instance) => void', default: 'null', description: 'Fired when a value is committed.' },
    ],
    methods: [
        { signature: 'ChillSlider.create(options)', on: 'static', description: 'Build a slider and return the instance (root at `.element`).' },
        { signature: 'ChillSlider.init(target, options)', on: 'static', description: 'Mount a slider into an element or selector; returns `null` if it is not found.' },
        { signature: 'ChillSlider.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'A number, or `[low, high]` for ranges.' },
        { signature: 'instance.setValue(value, silent?)', description: 'Set the value; fires `change` unless `silent` is true or nothing changed.' },
        { signature: 'instance.setDisabled(disabled) / isDisabled()', description: 'Disable or enable; query the state.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `input` or `change`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element', description: 'The root `<div>`.' },
    ],
    events: [
        { name: 'input', payload: 'value, instance', description: 'Value is changing (dragging).' },
        { name: 'change', payload: 'value, instance', description: 'Value was committed by pointer release, keyboard or `setValue`.' },
    ],
    cssVars: [
        { name: '--chillslider-track', description: 'Unfilled track colour.' },
        { name: '--chillslider-fill', description: 'Filled portion and active marks.' },
        { name: '--chillslider-thumb / --chillslider-thumb-border', description: 'Thumb background and border.' },
        { name: '--chillslider-tooltip-bg / --chillslider-tooltip-text', description: 'Tooltip colours.' },
        { name: '--chillslider-text / --chillslider-muted', description: 'Mark label colours.' },
        { name: '--chillslider-disabled', description: 'Disabled colour.' },
    ],
    a11y: [
        'Each handle is `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` and `aria-orientation`.',
        'Keys: Arrow keys move by `step`, PageUp/PageDown by `largeStep`, Home/End jump to the limits.',
        'Dual sliders default their labels to "Minimum" and "Maximum"; pass `label` for something more specific.',
        'Disabled sliders get `aria-disabled="true"` and their handles leave the tab order.',
    ],
    tips: [
        'There is no visible label element: pair the slider with your own heading and set `label` for screen readers.',
        'Vertical sliders need a container with an explicit height.',
        'Use `onInput` for live previews and `onChange` for expensive work such as network calls.',
        'In React, create the slider in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['numberinput', 'rating', 'progress'],
    keywords: ['range', 'range slider', 'dual slider', 'scrubber', 'volume', 'price filter'],
};

export default doc;
