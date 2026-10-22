import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'rating',
    global: 'ChillRating',
    category: 'formControls',
    title: 'Rating',
    summary: 'Star rating input with half stars, custom icons, read-only display mode and keyboard support.',
    style: 'create',
    description:
        'ChillRating renders a row of icons the user can click, hover or drive with the keyboard. It supports half-star precision, any number of icons, custom glyphs, a clear-on-reselect mode and a read-only display variant for showing averages.\n\n' +
        '`ChillRating.create()` returns an instance (the root node is `instance.element`); pass `container` to mount it immediately, or use `ChillRating.init(target, options)` to mount into an existing element. A custom `icon` is inserted as text; `iconHtml` is an explicit opt-in for raw markup and must never contain user input.',
    features: [
        'Whole or half-star values with partial fill for fractional display values like 3.7 shown as 3.5',
        'Interactive (`radiogroup`) or read-only (`img`) modes, switchable at runtime',
        'Custom icon count, glyph, colour and size, plus an optional "3.5 / 5" text',
        'Hover preview with `onHover`, and `allowClear` to reset by clicking the current value',
        'Keyboard control (arrows, Home/End, digit keys) and hidden input for forms',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic rating',
            description: 'Click a star. `onChange` receives the new value and the instance.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text)';
out.textContent = 'Rate your stay';
const r = ChillRating.create({
  value: 3,
  label: 'Stay rating',
  container: root,
  onChange: (v) => (out.textContent = 'You rated it ' + v + ' out of 5'),
});
root.append(out);
cleanup(() => r.destroy());`,
        },
        {
            id: 'half',
            title: 'Half stars and value text',
            description: 'With `half`, clicking the left half of a star gives `.5`. `showValue` appends "3.5 / 5".',
            code: `const r = ChillRating.create({
  half: true,
  value: 3.5,
  size: 'lg',
  showValue: true,
  color: '#f59e0b',
  container: root,
});
cleanup(() => r.destroy());`,
        },
        {
            id: 'readonly',
            title: 'Read-only averages',
            description: 'Use `readonly` to display scores. Values are rounded to the nearest step (half stars here).',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const rows = [['Cleanliness', 4.8], ['Location', 4.5], ['Value for money', 3.9]].map(([name, v]) => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:12px;color:var(--chill-text);font-size:14px';
  const label = document.createElement('span');
  label.textContent = name;
  label.style.minWidth = '130px';
  row.append(label);
  root.append(row);
  return ChillRating.create({ value: v, half: true, readonly: true, size: 'sm', showValue: true, container: row });
});
cleanup(() => rows.forEach((r) => r.destroy()));`,
        },
        {
            id: 'custom-icons',
            title: 'Custom icons and length',
            description: '`icon` takes a glyph (inserted as text), `max` changes how many icons are shown and `allowClear` lets users reset the rating.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:14px';
const hearts = ChillRating.create({ icon: '\\u2665', color: '#ef4444', max: 5, value: 4, allowClear: true, label: 'Favourite level', container: root });
const flames = ChillRating.create({ icon: '\\uD83D\\uDD25', max: 3, value: 2, label: 'Spiciness', itemLabel: (n, max) => 'Spice level ' + n + ' of ' + max, container: root });
const scale = ChillRating.create({ max: 10, value: 7, size: 'sm', showValue: true, container: root });
cleanup(() => { hearts.destroy(); flames.destroy(); scale.destroy(); });`,
        },
        {
            id: 'api',
            title: 'Events and programmatic control',
            description: '`onHover` / the `hover` event fire with the previewed value (or `null` on leave). `setValue(v, true)` updates silently.',
            code: `const hint = document.createElement('p');
hint.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text)';
const labels = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
const r = ChillRating.init(root.appendChild(document.createElement('div')), {
  name: 'quality',
  onHover: (v) => (hint.textContent = v ? labels[v] : labels[r.getValue()] || 'Hover to preview'),
});
const off = r.on('change', (v) => (hint.textContent = 'Saved: ' + labels[v]));
const reset = document.createElement('button');
reset.textContent = 'Reset';
reset.style.cssText = 'margin-top:10px;padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
reset.onclick = () => r.setValue(0, true);
hint.textContent = 'Hover to preview';
root.append(hint, reset);
cleanup(() => { off(); r.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root node is `instance.element`.\n\n' +
                '- **`create(options)`** builds the rating. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new rating into an existing element or selector and returns `null` when the target is missing.\n\n' +
                'Instance methods: `getValue()`, `setValue(value, silent?)`, `setReadonly(bool)`, `setDisabled(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Values and precision',
            body:
                'Values are clamped to `0..max` and rounded to the step (1, or 0.5 with `half`). `setValue(v)` fires `change` when the value actually changes; `setValue(v, true)` updates silently.\n\n' +
                'In read-only mode the root has `role="img"` and an `aria-label` such as "Rating: 4.5 / 5". Interactive mode uses `role="radiogroup"` with one `radio` per icon, and `itemLabel(n, max)` customises each icon\'s label.',
        },
        {
            title: 'Theming and icons',
            body:
                '```css\n:root {\n  --chillrating-color: #f59e0b;\n  --chillrating-empty: #d4d4d8;\n  --chillrating-size: 28px;\n}\n```\n\n' +
                'The default icon is an SVG star filled with `currentColor`. Use `icon: "\\u2665"` for a glyph or `iconHtml` for trusted SVG markup (it is inserted as raw HTML, so never build it from user input).',
        },
    ],
    options: [
        { name: 'max', type: 'number', default: '5', description: 'Number of icons.' },
        { name: 'value', type: 'number', default: '0', description: 'Current rating, clamped to `0..max`.' },
        { name: 'half', type: 'boolean', default: 'false', description: 'Allow half-step values.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Display only (`role="img"`), no interaction.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable interaction.' },
        { name: 'allowClear', type: 'boolean', default: 'false', description: 'Clicking the current value resets the rating to 0.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Icon size.' },
        { name: 'icon', type: 'string', default: 'null', description: 'Custom glyph, inserted as text. Default is an SVG star.' },
        { name: 'iconHtml', type: 'string', default: 'null', description: 'Custom icon markup inserted as raw HTML. Opt-in; never pass user input.' },
        { name: 'color', type: 'string', default: 'null', description: 'CSS colour for filled icons.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name so the value submits with forms.' },
        { name: 'label', type: 'string', default: "'Rating'", description: 'Accessible label of the group.' },
        { name: 'showValue', type: 'boolean', default: 'false', description: 'Append numeric text such as "3.5 / 5".' },
        { name: 'itemLabel', type: '(n: number, max: number) => string', default: 'null', description: 'Custom `aria-label` for each radio (default "1 star", "2 stars").' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append the rating to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onChange', type: '(value: number, instance) => void', default: 'null', description: 'Called when the value changes.' },
        { name: 'onHover', type: '(value: number | null, instance) => void', default: 'null', description: 'Called with the previewed value, or `null` when the pointer leaves.' },
    ],
    methods: [
        { signature: 'ChillRating.create(options)', on: 'static', description: 'Build a rating and return the instance (root at `.element`).' },
        { signature: 'ChillRating.init(target, options)', on: 'static', description: 'Mount a rating into an element or selector; returns `null` if not found.' },
        { signature: 'ChillRating.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current value.' },
        { signature: 'instance.setValue(value, silent?)', description: 'Set the value; fires `change` unless `silent` or unchanged.' },
        { signature: 'instance.setReadonly(readonly)', description: 'Switch between display-only and interactive.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable interaction.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `change` or `hover`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element', description: 'The root `<div>`.' },
    ],
    events: [
        { name: 'change', payload: 'value, instance', description: 'The rating value changed.' },
        { name: 'hover', payload: 'value | null, instance', description: 'The hover preview changed; `null` when the pointer leaves.' },
    ],
    cssVars: [
        { name: '--chillrating-color', description: 'Colour of filled icons.' },
        { name: '--chillrating-empty', description: 'Colour of empty icons.' },
        { name: '--chillrating-size', description: 'Icon size (overridden by the `size` option).' },
        { name: '--chillrating-text / --chillrating-muted', description: 'Value text colours.' },
    ],
    a11y: [
        'Interactive mode is `role="radiogroup"` with one `role="radio"` icon per step and a roving `tabindex`; `aria-valuetext` reports "3 / 5".',
        'Keys: Arrow keys change the value by one step, Home resets to 0, End jumps to max, digits 0-9 set that value, Space/Enter select the focused icon.',
        'Read-only mode switches to `role="img"` with an `aria-label` that includes the value.',
        'Disabled ratings set `aria-disabled="true"` and leave the tab order.',
    ],
    tips: [
        'Display averages with `readonly: true, half: true`; fractions are rounded to the nearest half star.',
        'Provide `label` so screen reader users know what is being rated.',
        'In React, create the rating in an effect with a ref as `container` and `destroy()` it on cleanup.',
        'Safe to import on the server; build the widget in the browser.',
    ],
    related: ['slider', 'feedback', 'progress'],
    keywords: ['stars', 'review', 'score', 'feedback', 'vote'],
};

export default doc;
