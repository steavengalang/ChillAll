import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'segmented',
    global: 'ChillSegmented',
    category: 'formControls',
    title: 'Segmented Control',
    summary: 'Segmented control for switching views or toggling options, in single or multiple selection mode.',
    style: 'create',
    description:
        'ChillSegmented is a compact group of buttons where one (or several) can be active, like the Day / Week / Month switcher in a calendar. In the default single mode it behaves as a radio group; with `multiple: true` it becomes a group of toggle buttons (think Bold / Italic / Underline).\n\n' +
        '`ChillSegmented.create()` returns an instance (the root is `instance.element`); pass `container` to mount it, or use `ChillSegmented.init(target, options)` to mount into an existing element. Labels, icons and titles are always inserted as **text**.',
    features: [
        'Single selection (`radiogroup`, arrows move and select) or multiple (`group` with `aria-pressed`)',
        'Items as plain strings or `{ value, label, icon, title, disabled }` objects',
        '`allowEmpty` to let users deselect in single mode; three sizes and `fullWidth`',
        'Per-item and whole-control disabling at runtime',
        'Hidden inputs via `name` for form submission',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic switcher',
            description: 'Plain strings become items. The first item is selected by default unless you pass `value`.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
const seg = ChillSegmented.create({
  items: ['Day', 'Week', 'Month', 'Year'],
  value: 'Week',
  label: 'Calendar range',
  container: root,
  onChange: (v) => (out.textContent = 'Showing ' + v.toLowerCase() + ' view'),
});
out.textContent = 'Showing ' + seg.getValue().toLowerCase() + ' view';
root.append(out);
cleanup(() => seg.destroy());`,
        },
        {
            id: 'icons-sizes',
            title: 'Icons, sizes and full width',
            description: 'Item objects can carry an `icon` (text) and a `title` tooltip. `fullWidth` stretches the control with equal segments.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:14px;max-width:460px';
const items = [
  { value: 'list', label: 'List', icon: '\\u2630', title: 'List view' },
  { value: 'grid', label: 'Grid', icon: '\\u25A6', title: 'Grid view' },
  { value: 'map', label: 'Map', icon: '\\u25CE', title: 'Map view' },
];
const a = ChillSegmented.create({ items, size: 'sm', container: root });
const b = ChillSegmented.create({ items, value: 'grid', size: 'lg', container: root });
const c = ChillSegmented.create({ items, fullWidth: true, container: root });
cleanup(() => { a.destroy(); b.destroy(); c.destroy(); });`,
        },
        {
            id: 'multiple',
            title: 'Toggle group (multiple)',
            description: 'With `multiple: true` each segment toggles on its own and the value is an array.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
const seg = ChillSegmented.create({
  multiple: true,
  items: [
    { value: 'bold', label: 'Bold', icon: 'B' },
    { value: 'italic', label: 'Italic', icon: 'I' },
    { value: 'underline', label: 'Underline', icon: 'U' },
  ],
  value: ['bold'],
  label: 'Text style',
  container: root,
  onChange: (v) => (out.textContent = 'Active: ' + (v.join(', ') || 'none')),
});
out.textContent = 'Active: ' + seg.getValue().join(', ');
root.append(out);
cleanup(() => seg.destroy());`,
        },
        {
            id: 'allow-empty',
            title: 'Optional filter with allowEmpty',
            description: 'In single mode `allowEmpty` lets a click on the active segment clear the selection (`null`). Items can also be disabled individually.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
const seg = ChillSegmented.create({
  items: [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'archived', label: 'Archived', disabled: true },
  ],
  allowEmpty: true,
  value: null,
  name: 'status',
  label: 'Ticket status filter',
  container: root,
  onChange: (v) => (out.textContent = 'Filter: ' + (v === null ? 'all tickets' : v)),
});
out.textContent = 'Filter: all tickets';
root.append(out);
cleanup(() => seg.destroy());`,
        },
        {
            id: 'api',
            title: 'Programmatic control',
            description: '`setValue(v, silent)`, `setDisabled(bool)` and `setItemDisabled(value, bool)` change state from code; `on("change", fn)` returns an unsubscribe function.',
            code: `const log = document.createElement('p');
log.style.cssText = 'margin:12px 0;font-size:13px;color:var(--chill-text)';
const seg = ChillSegmented.init(root.appendChild(document.createElement('div')), {
  items: ['Free', 'Pro', 'Team', 'Enterprise'],
  value: 'Pro',
});
const off = seg.on('change', (v) => (log.textContent = 'Plan changed to ' + v));
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
[['Select Team', () => seg.setValue('Team')], ['Lock Enterprise', () => seg.setItemDisabled('Enterprise', true)], ['Disable all', () => seg.setDisabled(true)], ['Enable all', () => seg.setDisabled(false)]].forEach(([t, fn]) => {
  const b = document.createElement('button');
  b.textContent = t;
  b.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.onclick = fn;
  bar.append(b);
});
root.append(log, bar);
cleanup(() => { off(); seg.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element`.\n\n' +
                '- **`create(options)`** builds the control. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new control into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `setValue(value, silent?)`, `setDisabled(bool)`, `setItemDisabled(value, bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Single vs multiple',
            body:
                '**Single** (default): the root is `role="radiogroup"`, the active item is `aria-checked`, only it is in the tab order, and Arrow keys move *and* select (Home/End jump). The value is one item `value`, or `null` when `allowEmpty` is on and nothing is chosen. By default the first enabled item is selected.\n\n' +
                '**Multiple**: the root is `role="group"` and each item is a toggle button with `aria-pressed`. Arrow keys move focus only; Space or Enter toggles. The value is an array in item order.\n\n' +
                'Values are compared strictly (`===`), and `setValue` ignores values that are not among the items.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillsegmented-bg: #f1f5f9;\n  --chillsegmented-active-bg: #ffffff;\n  --chillsegmented-active-text: #7c3aed;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'items', type: 'Array<string | { value, label?, icon?, title?, disabled? }>', default: '[]', description: 'Segments. Label, icon and title are text. `label` defaults to `String(value)`.' },
        { name: 'items[].value', type: 'any', default: '-', description: 'Value reported by `getValue()` and `onChange`.' },
        { name: 'items[].label', type: 'string', default: 'String(value)', description: 'Visible text.' },
        { name: 'items[].icon', type: 'string', default: 'undefined', description: 'Leading icon, inserted as text (an emoji or glyph).' },
        { name: 'items[].title', type: 'string', default: 'undefined', description: 'Native tooltip.' },
        { name: 'items[].disabled', type: 'boolean', default: 'false', description: 'Disable the segment.' },
        { name: 'value', type: 'any | any[]', default: 'first enabled item', description: 'Single: a value (or `null`). Multiple: an array of values.' },
        { name: 'multiple', type: 'boolean', default: 'false', description: 'Toggle-button group instead of a radio group.' },
        { name: 'allowEmpty', type: 'boolean', default: 'false', description: 'Single mode: clicking the active item deselects it and nothing is selected by default.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container with equal-width segments.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the whole control.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name(s); one per selected value.' },
        { name: 'label', type: 'string', default: 'null', description: '`aria-label` of the group.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onChange', type: '(value, instance) => void', default: 'null', description: 'Called when the selection changes (array copy in multiple mode).' },
    ],
    methods: [
        { signature: 'ChillSegmented.create(options)', on: 'static', description: 'Build a control and return the instance (root at `.element`).' },
        { signature: 'ChillSegmented.init(target, options)', on: 'static', description: 'Mount a control into an element or selector; returns `null` if not found.' },
        { signature: 'ChillSegmented.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Selected value, `null`, or an array copy in multiple mode.' },
        { signature: 'instance.setValue(value, silent?)', description: 'Set the selection (unknown values are ignored). Fires `change` if it changed, unless `silent`.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Disable or enable the whole control.' },
        { signature: 'instance.setItemDisabled(value, disabled)', description: 'Disable or enable one segment.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `change`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element', description: 'The root `<div>`.' },
    ],
    events: [
        { name: 'change', payload: 'value, instance', description: 'The selection changed.' },
    ],
    cssVars: [
        { name: '--chillsegmented-bg', description: 'Track background.' },
        { name: '--chillsegmented-text', description: 'Inactive segment text colour.' },
        { name: '--chillsegmented-active-bg / --chillsegmented-active-text', description: 'Selected segment colours.' },
        { name: '--chillsegmented-hover', description: 'Hovered segment background.' },
        { name: '--chillsegmented-focus', description: 'Focus ring colour.' },
        { name: '--chillsegmented-shadow / --chillsegmented-disabled', description: 'Selected shadow and disabled colour.' },
    ],
    a11y: [
        'Single mode is `role="radiogroup"` with `role="radio"` buttons and `aria-checked`; only the active segment is in the tab order.',
        'Single keys: Arrow keys move and select (wrapping, skipping disabled items), Home/End jump to the first or last enabled segment.',
        'Multiple mode is `role="group"` with toggle buttons (`aria-pressed`); Arrow keys move focus, Space/Enter toggle.',
        'Provide `label` to name the group; icons are `aria-hidden` so always give each segment a text label.',
    ],
    tips: [
        'Use it for 2 to 5 short options; for longer lists choose [Select](/components/select) or [Radio](/components/radio).',
        'In single mode the first enabled item is selected automatically, so `onChange` is not called for the initial value.',
        'In React, create the control in an effect with a ref as `container` and call `destroy()` on cleanup.',
        'Safe to import on the server; build the control in the browser.',
    ],
    related: ['radio', 'switch', 'tabs', 'select'],
    keywords: ['toggle group', 'button group', 'view switcher', 'pill tabs', 'radio buttons', 'filter chips'],
};

export default doc;
