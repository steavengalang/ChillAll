import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'radio',
    global: 'ChillRadio',
    category: 'formControls',
    title: 'Radio',
    summary: 'Styled native radio buttons and radio groups with descriptions, sizes and validation states.',
    style: 'create',
    description:
        'ChillRadio paints a custom circle over a real `<input type="radio">`, so grouping by `name`, arrow-key navigation and form submission are all native. ' +
        'Use `ChillRadio.createGroup()` for a labelled set of choices, `ChillRadio.create()` for a single radio, or `ChillRadio.init()` to upgrade existing inputs.\n\n' +
        'Labels and descriptions are always inserted as **text**.',
    features: [
        '`createGroup()` renders a `role="radiogroup"` with a single `onChange(value)` and `getValue()` / `setValue()`',
        'Per-option descriptions, disabled options and horizontal layout',
        'Native keyboard behaviour: arrow keys move within the group, Tab leaves it',
        'Three sizes plus error and success states (`error` sets `aria-invalid`)',
        '`init()` reuses an existing `<input type="radio">` and restores it on `destroy()`',
    ],
    examples: [
        {
            id: 'group',
            title: 'Radio group',
            description: 'Pass `items` and an initial `value`. `onChange` receives the value of the chosen item.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const group = ChillRadio.createGroup({
  label: 'Billing plan',
  name: 'plan',
  value: 'pro',
  items: [
    { value: 'free', label: 'Free', description: '1 project, community support' },
    { value: 'pro', label: 'Pro', description: 'Unlimited projects, email support' },
    { value: 'team', label: 'Team', description: 'Shared workspaces and SSO' },
  ],
  onChange: (v) => (out.textContent = 'Plan: ' + v),
});
out.textContent = 'Plan: ' + group.getValue();
root.append(group, out);
cleanup(() => group.destroy());`,
        },
        {
            id: 'horizontal',
            title: 'Horizontal layout and sizes',
            description: '`horizontal: true` lays the options out in a row. Each item can set its own `size` and `disabled`.',
            code: `const group = ChillRadio.createGroup({
  label: 'T-shirt size',
  horizontal: true,
  value: 'm',
  items: [
    { value: 's', label: 'S', size: 'sm' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L', size: 'lg' },
    { value: 'xl', label: 'XL (sold out)', disabled: true },
  ],
});
root.append(group);
cleanup(() => group.destroy());`,
        },
        {
            id: 'single',
            title: 'Single radios and states',
            description: 'Radios sharing a `name` behave as one group even when created separately. Use `state` to flag a missing choice.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const opts = [
  { label: 'Pay by card', name: 'pay', value: 'card', state: 'error' },
  { label: 'Pay by bank transfer', name: 'pay', value: 'bank', state: 'error' },
  { label: 'Pay on delivery', name: 'pay', value: 'cod', state: 'error' },
];
const radios = opts.map((o) => ChillRadio.create(o));
root.append(...radios);
const timer = setTimeout(() => radios.forEach((r) => r.instance.setState('default')), 1500);
cleanup(() => { clearTimeout(timer); radios.forEach((r) => r.destroy()); });`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade existing inputs',
            description: '`init()` moves a native radio into the styled wrapper while keeping its attributes and listeners.',
            code: `root.innerHTML = '<input type="radio" id="r-light" name="theme" value="light" checked>' +
  '<input type="radio" id="r-dark" name="theme" value="dark">';
const a = ChillRadio.init(root.querySelector('#r-light'), { label: 'Light theme' });
const b = ChillRadio.init(root.querySelector('#r-dark'), { label: 'Dark theme' });
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
b.input.addEventListener('change', () => console.log('dark selected'));
cleanup(() => { a.destroy(); b.destroy(); });`,
        },
        {
            id: 'programmatic',
            title: 'Set the value from code',
            description: '`setValue` on a group selects the matching item (strict comparison, no `onChange`); `getValue()` returns `null` when nothing is checked.',
            code: `const group = ChillRadio.createGroup({
  label: 'Delivery speed',
  name: 'speed',
  items: [
    { value: 'std', label: 'Standard (5 days)' },
    { value: 'exp', label: 'Express (2 days)' },
    { value: 'same', label: 'Same day' },
  ],
});
const btn = document.createElement('button');
btn.textContent = 'Pick Express';
btn.style.cssText = 'margin-top:12px;padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
btn.onclick = () => group.setValue('exp');
root.append(group, btn);
cleanup(() => group.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Groups vs single radios',
            body:
                '- **`createGroup(options)`** creates the `role="radiogroup"` element, assigns one shared `name` (yours, or a generated one) and returns an element with `getValue()`, `setValue(value)` and `destroy()`.\n' +
                '- **`create(options)`** returns a single `<label>` wrapper with `wrapper.input`, `wrapper.instance` and `wrapper.destroy()`. Use the same `name` on several to form a group.\n' +
                '- **`init(target, options)`** returns an instance (`isChecked`, `setChecked`, `setDisabled`, `setState`, `getValue`, `destroy`) for an existing `<input type="radio">`.\n\n' +
                'The group `onChange` receives the item value with its original type; a single radio\'s `onChange(value, event)` receives the input\'s string value.',
        },
        {
            title: 'Forms and keyboard',
            body:
                'Because the control is a native radio, the browser handles roving selection: arrow keys move and select within the same `name`, Tab enters and leaves the group once. Give items a `value` and the group posts like any other form field.\n\n' +
                '`setValue()` and `setChecked()` do not fire `onChange`.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillradio-checked: #f97316;\n  --chillradio-checked-hover: #ea580c;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Label text (text only). For groups it is the group heading.' },
        { name: 'description', type: 'string', default: "''", description: 'Secondary line under the label; linked via `aria-describedby`.' },
        { name: 'checked', type: 'boolean', default: 'false', description: 'Initial state (a reused input contributes its own `checked`).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the radio (for groups, disables items that do not set their own).' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Sets the native `required` attribute.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Radio size.' },
        { name: 'state', type: "'default' | 'error' | 'success'", default: "'default'", description: 'Validation state; `error` sets `aria-invalid`.' },
        { name: 'name', type: 'string', default: "''", description: 'Group name shared by related radios (generated for `createGroup` if omitted).' },
        { name: 'value', type: 'any', default: "''", description: 'Form value of a single radio.' },
        { name: 'onChange', type: '(value, event: Event) => void', default: 'null', description: 'Single radio: called with the input value. Group: called with the chosen item value.' },
        { name: 'items', type: 'Array<{ value, label, description?, disabled?, size?, state? }>', default: '[]', description: '`createGroup` only: the options.' },
        { name: 'value (group)', type: 'any', default: 'undefined', description: '`createGroup` only: the initially selected item value (strict equality).' },
        { name: 'horizontal', type: 'boolean', default: 'false', description: '`createGroup` only: row layout.' },
    ],
    methods: [
        { signature: 'ChillRadio.createGroup(options)', on: 'static', description: 'Build a labelled radio group element.' },
        { signature: 'ChillRadio.create(options)', on: 'static', description: 'Build one radio and return the `<label>` wrapper (with `.input`, `.instance`, `.destroy()`).' },
        { signature: 'ChillRadio.init(target, options)', on: 'static', description: 'Upgrade an input (or replace another element) and return an instance.' },
        { signature: 'ChillRadio.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'group.getValue()', description: 'Value of the checked item, or `null`.' },
        { signature: 'group.setValue(value)', description: 'Check the item whose value matches (strictly). No `onChange`.' },
        { signature: 'group.destroy()', description: 'Destroy all items and remove the group.' },
        { signature: 'instance.isChecked()', description: 'Whether this radio is checked.' },
        { signature: 'instance.setChecked(checked)', description: 'Set the state without firing `onChange`.' },
        { signature: 'instance.setDisabled(disabled) / setState(state)', description: 'Change disabled or validation state.' },
        { signature: 'instance.getValue()', description: 'The `value` option.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and wrapper; a reused input is restored.' },
    ],
    cssVars: [
        { name: '--chillradio-checked / --chillradio-checked-hover', description: 'Colour of the selected dot and ring.' },
        { name: '--chillradio-border / --chillradio-border-hover', description: 'Unselected ring colours.' },
        { name: '--chillradio-bg', description: 'Circle background.' },
        { name: '--chillradio-text / --chillradio-text-muted', description: 'Label and description colours.' },
        { name: '--chillradio-error / --chillradio-success', description: 'State colours.' },
        { name: '--chillradio-disabled / --chillradio-disabled-text', description: 'Disabled colours.' },
    ],
    a11y: [
        'Native `<input type="radio">` inside a `<label>`: arrow keys move and select within a group, Tab enters or leaves it.',
        'Groups are `role="radiogroup"` with `aria-labelledby` pointing at the group label.',
        'Descriptions use `aria-describedby`; `error` state sets `aria-invalid="true"`.',
        'The painted circle is `aria-hidden`; a visible focus ring is shown for keyboard users.',
    ],
    tips: [
        'For more than ~6 options, prefer [Select](/components/select); for two compact options consider [Segmented](/components/segmented) or [Switch](/components/switch).',
        'Group values are compared strictly (`===`): pass `1`, not `"1"`, if your item values are numbers.',
        'In React, build the group in an effect and append it to a ref, calling `destroy()` on cleanup.',
        'Safe to import on the server; build controls in the browser.',
    ],
    related: ['checkbox', 'switch', 'segmented', 'select'],
    keywords: ['radio button', 'option group', 'single choice', 'radiogroup'],
};

export default doc;
