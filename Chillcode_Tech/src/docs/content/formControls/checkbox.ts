import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'checkbox',
    global: 'ChillCheckbox',
    category: 'formControls',
    title: 'Checkbox',
    summary: 'Styled native checkbox with description text, indeterminate state, validation states and groups.',
    style: 'create',
    description:
        'ChillCheckbox keeps a real `<input type="checkbox">` underneath and paints a custom box on top, so forms, labels and keyboard behaviour work exactly like native. ' +
        'Use `ChillCheckbox.create()` for a single box, `ChillCheckbox.createGroup()` for a labelled set, or `ChillCheckbox.init()` to upgrade an existing input.\n\n' +
        'Labels and descriptions are always inserted as **text**.',
    features: [
        'Native input inside a `<label>`: the whole row is clickable and form submission just works',
        'Indeterminate state for "select all" parents, cleared automatically on the next click',
        'Optional description line wired up with `aria-describedby`',
        '`createGroup()` renders a `role="group"` with a collective `onChange(values[])`',
        'Three sizes plus error and success states (`error` sets `aria-invalid`)',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic checkbox',
            description: 'A label, an optional description and a change callback.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const cb = ChillCheckbox.create({
  label: 'Subscribe to the newsletter',
  description: 'One short email every Friday. Unsubscribe any time.',
  checked: true,
  onChange: (checked) => (out.textContent = checked ? 'Subscribed' : 'Not subscribed'),
});
root.append(cb, out);
cleanup(() => cb.destroy());`,
        },
        {
            id: 'sizes-states',
            title: 'Sizes and states',
            description: 'Small, medium and large boxes, plus disabled, error and success variants.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const items = [
  { label: 'Small', size: 'sm', checked: true },
  { label: 'Medium', size: 'md', checked: true },
  { label: 'Large', size: 'lg', checked: true },
  { label: 'Disabled', disabled: true, checked: true },
  { label: 'I accept the terms (required)', state: 'error', required: true },
  { label: 'Email verified', state: 'success', checked: true },
].map((o) => ChillCheckbox.create(o));
root.append(...items);
cleanup(() => items.forEach((c) => c.destroy()));`,
        },
        {
            id: 'indeterminate',
            title: 'Select all with indeterminate state',
            description: 'A parent checkbox reflects its children: checked, unchecked or indeterminate. Use `setIndeterminate` and `setChecked`.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:8px';
const parent = ChillCheckbox.init(root.appendChild(document.createElement('div')), { label: 'Select all' });
const kids = ['Invoices', 'Receipts', 'Contracts'].map((label) =>
  ChillCheckbox.create({ label, onChange: sync })
);
kids.forEach((k) => (k.style.marginLeft = '24px'));
function sync() {
  const n = kids.filter((k) => k.instance.isChecked()).length;
  parent.setChecked(n === kids.length);
  parent.setIndeterminate(n > 0 && n < kids.length);
}
parent.input.addEventListener('change', () => kids.forEach((k) => k.instance.setChecked(parent.isChecked())));
root.append(...kids);
kids[0].instance.setChecked(true);
sync();
cleanup(() => { parent.destroy(); kids.forEach((k) => k.destroy()); });`,
        },
        {
            id: 'group',
            title: 'Checkbox group',
            description: '`createGroup` renders labelled items and reports the full list of checked values on every change.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const group = ChillCheckbox.createGroup({
  label: 'Pizza toppings',
  name: 'toppings',
  value: ['cheese'],
  items: [
    { value: 'cheese', label: 'Extra cheese' },
    { value: 'olives', label: 'Olives' },
    { value: 'basil', label: 'Fresh basil', description: 'Added after baking' },
    { value: 'anchovies', label: 'Anchovies', disabled: true },
  ],
  onChange: (values) => (out.textContent = 'Selected: ' + (values.join(', ') || 'none')),
});
out.textContent = 'Selected: ' + group.getValues().join(', ');
root.append(group, out);
cleanup(() => group.destroy());`,
        },
        {
            id: 'horizontal-group',
            title: 'Horizontal group',
            description: 'Set `horizontal: true` for a row layout; `setValues` changes the selection programmatically.',
            code: `const group = ChillCheckbox.createGroup({
  label: 'Notify me by',
  horizontal: true,
  items: [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push' },
  ],
});
root.append(group);
const timer = setTimeout(() => group.setValues(['email', 'push']), 600);
cleanup(() => { clearTimeout(timer); group.destroy(); });`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade an existing checkbox',
            description: 'An existing `<input type="checkbox">` is moved into the styled wrapper; its `name`, `checked` state and listeners are kept.',
            code: `root.innerHTML = '<input type="checkbox" id="agree" name="agree" value="yes" checked>';
const el = root.querySelector('#agree');
el.addEventListener('change', () => console.log('native listener', el.checked));
const inst = ChillCheckbox.init(el, { label: 'Remember me on this device', size: 'lg' });
cleanup(() => inst.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create, createGroup and init',
            body:
                '- **`create(options)`** returns a `<label>` wrapper with `wrapper.input`, `wrapper.instance` and `wrapper.destroy()`.\n' +
                '- **`createGroup(options)`** returns a `role="group"` element with `getValues()`, `setValues(values)` and `destroy()`. Each item is a regular checkbox option (`value`, `label`, `description`, `disabled`, `size`, `state`).\n' +
                '- **`init(target, options)`** returns an instance (`isChecked`, `setChecked`, `setIndeterminate`, `toggle`, `setDisabled`, `setState`, `getValue`, `destroy`). An existing checkbox `<input>` is reused and restored on `destroy()`; its `checked`, `disabled`, `required`, `name` and `value` are used as defaults.',
        },
        {
            title: 'Indeterminate and forms',
            body:
                'The indeterminate flag is a visual-only state on the native input; it is cleared whenever the user toggles the box or you call `setChecked()`. Handy for tree-style "select all" controls.\n\n' +
                'Because the control is a native checkbox, give it a `name` (and `value`) and it posts with your `<form>` like any other. `setChecked()` and `setValues()` do not fire `onChange`.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillcheckbox-checked: #16a34a;\n  --chillcheckbox-checked-hover: #15803d;\n  --chillcheckbox-border: #a3a3a3;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Label text (text only).' },
        { name: 'description', type: 'string', default: "''", description: 'Secondary line under the label; linked via `aria-describedby`.' },
        { name: 'checked', type: 'boolean', default: 'false', description: 'Initial state (a reused input contributes its own `checked`).' },
        { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Start in the indeterminate state.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the checkbox.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Sets the native `required` attribute.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Box size.' },
        { name: 'state', type: "'default' | 'error' | 'success'", default: "'default'", description: 'Validation state; `error` sets `aria-invalid`.' },
        { name: 'name', type: 'string', default: "''", description: 'Form field name.' },
        { name: 'value', type: 'any', default: "''", description: 'Form value; also returned by `getValue()` (any type, including `0`).' },
        { name: 'onChange', type: '(checked: boolean, event: Event) => void', default: 'null', description: 'Called when the user toggles the box.' },
        { name: 'createGroup: label', type: 'string', default: "''", description: 'Group heading; becomes the `aria-labelledby` target.' },
        { name: 'createGroup: items', type: 'Array<CheckboxOptions & { value }>', default: '[]', description: 'Checkbox definitions (`value`, `label`, `description`, `disabled`, ...).' },
        { name: 'createGroup: value', type: 'any[]', default: '[]', description: 'Values that start checked.' },
        { name: 'createGroup: horizontal', type: 'boolean', default: 'false', description: 'Lay items out in a row.' },
        { name: 'createGroup: name', type: 'string', default: "''", description: 'Default `name` for every item.' },
        { name: 'createGroup: disabled', type: 'boolean', default: 'false', description: 'Disable every item that does not set its own `disabled`.' },
        { name: 'createGroup: onChange', type: '(values: any[]) => void', default: 'null', description: 'Called with all checked values after a user change.' },
    ],
    methods: [
        { signature: 'ChillCheckbox.create(options)', on: 'static', description: 'Build a checkbox and return the `<label>` wrapper (with `.input`, `.instance`, `.destroy()`).' },
        { signature: 'ChillCheckbox.createGroup(options)', on: 'static', description: 'Build a labelled group of checkboxes.' },
        { signature: 'ChillCheckbox.init(target, options)', on: 'static', description: 'Upgrade an input (or replace another element) and return an instance.' },
        { signature: 'ChillCheckbox.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.isChecked()', description: 'Current checked state.' },
        { signature: 'instance.setChecked(checked)', description: 'Set the state (also clears indeterminate). Does not fire `onChange`.' },
        { signature: 'instance.setIndeterminate(flag)', description: 'Toggle the indeterminate state.' },
        { signature: 'instance.toggle()', description: 'Flip the checked state.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable.' },
        { signature: 'instance.setState(state)', description: 'Switch between `default`, `error` and `success`.' },
        { signature: 'instance.getValue()', description: 'The `value` option.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and wrapper; a reused input is restored.' },
        { signature: 'group.getValues() / group.setValues(values)', description: 'Read or set the checked values of a group.' },
        { signature: 'group.destroy()', description: 'Destroy all items and remove the group.' },
    ],
    cssVars: [
        { name: '--chillcheckbox-checked / --chillcheckbox-checked-hover', description: 'Fill colour of a checked box.' },
        { name: '--chillcheckbox-border / --chillcheckbox-border-hover', description: 'Border of an unchecked box.' },
        { name: '--chillcheckbox-bg', description: 'Unchecked background.' },
        { name: '--chillcheckbox-text / --chillcheckbox-text-muted', description: 'Label and description colours.' },
        { name: '--chillcheckbox-error / --chillcheckbox-success', description: 'State colours.' },
        { name: '--chillcheckbox-disabled / --chillcheckbox-disabled-text', description: 'Disabled colours.' },
    ],
    a11y: [
        'Built on a real `<input type="checkbox">` inside a `<label>`: Space toggles, Tab moves focus, assistive tech reads the native state.',
        'The description is referenced with `aria-describedby`; `error` state sets `aria-invalid="true"`.',
        'Groups are `role="group"` with `aria-labelledby` pointing at the group label.',
        'The painted box is `aria-hidden`; a visible focus ring is shown for keyboard users.',
    ],
    tips: [
        'For a mutually exclusive choice use [Radio](/components/radio); for an on/off setting that applies instantly consider [Switch](/components/switch).',
        'Group `onChange` fires only on user input; after `setValues()` read `getValues()` yourself.',
        'In React, create the element in an effect and append it to a ref, or `init()` a ref to your own `<input type="checkbox">`.',
        'Safe to import on the server; build controls in the browser.',
    ],
    related: ['radio', 'switch', 'form', 'forms'],
    keywords: ['tick', 'check box', 'toggle', 'select all', 'multi choice'],
};

export default doc;
