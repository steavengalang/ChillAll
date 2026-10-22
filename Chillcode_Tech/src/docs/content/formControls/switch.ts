import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'switch',
    global: 'ChillSwitch',
    category: 'formControls',
    title: 'Switch',
    summary: 'Accessible on/off toggle with colours, sizes, track labels, thumb icons and an optional description.',
    style: 'create',
    description:
        'ChillSwitch is a toggle for settings that take effect immediately. It is a native checkbox with `role="switch"`, so it works in forms and with assistive tech, and Space and Enter both toggle it.\n\n' +
        'Use `ChillSwitch.create()` to build one, or `ChillSwitch.init()` to upgrade an existing `<input type="checkbox">`. Labels and descriptions are always inserted as **text**.',
    features: [
        'Native checkbox with `role="switch"` and a synced `aria-checked`',
        'Four colours (`primary`, `success`, `warning`, `error`) and three sizes',
        'Optional ON/OFF track labels, check/cross thumb icons and label on either side',
        'Description line wired up with `aria-describedby`',
        '`init()` reuses an existing checkbox and restores it on `destroy()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic switch',
            description: 'A label, a description and a callback that receives the new state.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const sw = ChillSwitch.create({
  label: 'Email notifications',
  description: 'Get a summary of activity every morning.',
  checked: true,
  onChange: (on) => (out.textContent = 'Notifications ' + (on ? 'enabled' : 'disabled')),
});
root.append(sw, out);
cleanup(() => sw.destroy());`,
        },
        {
            id: 'colors-sizes',
            title: 'Colours and sizes',
            description: 'The `color` option accepts `primary` (default), `success`, `warning` and `error`.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const rows = [
  { label: 'Primary', checked: true },
  { label: 'Success', color: 'success', checked: true },
  { label: 'Warning', color: 'warning', checked: true },
  { label: 'Error', color: 'error', checked: true },
  { label: 'Small', size: 'sm', checked: true },
  { label: 'Large', size: 'lg', checked: true },
  { label: 'Disabled', disabled: true, checked: true },
].map((o) => ChillSwitch.create(o));
root.append(...rows);
cleanup(() => rows.forEach((s) => s.destroy()));`,
        },
        {
            id: 'decorated',
            title: 'Track labels and thumb icons',
            description: '`trackLabels` prints text inside the track, `showIcons` adds a check/cross to the thumb and `labelPosition: "start"` puts the label first.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:14px';
const a = ChillSwitch.create({ label: 'Auto-save', size: 'lg', trackLabels: { on: 'ON', off: 'OFF' }, checked: true });
const b = ChillSwitch.create({ label: 'Airplane mode', showIcons: true, color: 'success' });
const c = ChillSwitch.create({ label: 'Label on the left', labelPosition: 'start' });
root.append(a, b, c);
cleanup(() => { a.destroy(); b.destroy(); c.destroy(); });`,
        },
        {
            id: 'programmatic',
            title: 'Control it from code',
            description: '`setChecked` updates silently; `toggle` flips the state and fires `onChange`. Use `setDisabled` to lock a setting.',
            code: `const log = document.createElement('p');
log.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const sw = ChillSwitch.init(root.appendChild(document.createElement('div')), {
  label: 'Dark mode',
  onChange: (on) => (log.textContent = 'onChange: ' + on),
});
const btn = document.createElement('button');
btn.textContent = 'Toggle from code';
btn.style.cssText = 'margin-top:12px;padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
btn.onclick = () => sw.toggle();
root.append(btn, log);
cleanup(() => sw.destroy());`,
        },
        {
            id: 'settings-list',
            title: 'Settings panel',
            description: 'Several switches in a realistic list, each with a name so they post with a form.',
            code: `const form = document.createElement('form');
form.style.cssText = 'display:flex;flex-direction:column;gap:16px;max-width:380px';
const defs = [
  { name: 'marketing', label: 'Product updates', description: 'New features and improvements.', checked: true },
  { name: 'security', label: 'Security alerts', description: 'Sign-ins from new devices.', checked: true, color: 'success' },
  { name: 'beta', label: 'Join the beta', description: 'Try unfinished features early.', color: 'warning' },
];
const switches = defs.map((d) => ChillSwitch.create({ ...d, value: 'on' }));
form.append(...switches);
root.append(form);
cleanup(() => switches.forEach((s) => s.destroy()));`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns a `<label>` wrapper with `wrapper.input`, `wrapper.instance` and `wrapper.destroy()`.\n' +
                '- **`init(target, options)`** returns an instance with `isChecked`, `setChecked`, `toggle`, `setDisabled`, `setColor`, `getValue` and `destroy`. An existing `<input type="checkbox">` is reused: its `checked`, `disabled`, `name` and `value` become defaults, and it gets `role="switch"` until `destroy()` restores it.\n\n' +
                '`setChecked()` is silent. `toggle()` is the one method that also calls `onChange` (without an event argument).',
        },
        {
            title: 'When to use a switch',
            body:
                'Use a switch when flipping it applies the change right away (notifications, dark mode). When the choice is only committed on submit, a [Checkbox](/components/checkbox) is the better fit. A native checkbox underneath means a switch with a `name` and `value` posts like any other form control.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillswitch-bg-on: #7c3aed;\n  --chillswitch-bg-on-hover: #6d28d9;\n  --chillswitch-bg-off: #cbd5e1;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Label text (text only).' },
        { name: 'description', type: 'string', default: "''", description: 'Secondary line under the label; linked via `aria-describedby`.' },
        { name: 'checked', type: 'boolean', default: 'false', description: 'Initial state (a reused input contributes its own `checked`).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the switch.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Switch size.' },
        { name: 'color', type: "'primary' | 'success' | 'warning' | 'error'", default: "'primary'", description: 'On-state colour; applied as a `chillswitch-<color>` class.' },
        { name: 'labelPosition', type: "'start' | 'end'", default: "'end'", description: 'Place the label before or after the track.' },
        { name: 'showIcons', type: 'boolean', default: 'false', description: 'Show check/cross icons on the thumb.' },
        { name: 'trackLabels', type: '{ on?: string, off?: string }', default: 'null', description: 'Text inside the track; missing keys fall back to `ON` / `OFF`.' },
        { name: 'name', type: 'string', default: "''", description: 'Form field name.' },
        { name: 'value', type: 'any', default: "''", description: 'Form value; also returned by `getValue()`.' },
        { name: 'onChange', type: '(checked: boolean, event?: Event) => void', default: 'null', description: 'Called when the state changes through the UI or `toggle()`.' },
    ],
    methods: [
        { signature: 'ChillSwitch.create(options)', on: 'static', description: 'Build a switch and return the `<label>` wrapper (with `.input`, `.instance`, `.destroy()`).' },
        { signature: 'ChillSwitch.init(target, options)', on: 'static', description: 'Upgrade a checkbox (or replace another element) and return an instance.' },
        { signature: 'ChillSwitch.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.isChecked()', description: 'Current state.' },
        { signature: 'instance.setChecked(checked)', description: 'Set the state and `aria-checked` without calling `onChange`.' },
        { signature: 'instance.toggle()', description: 'Flip the state and call `onChange`.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable.' },
        { signature: 'instance.setColor(color)', description: 'Change the colour variant.' },
        { signature: 'instance.getValue()', description: 'The `value` option.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and wrapper; a reused input is restored.' },
    ],
    cssVars: [
        { name: '--chillswitch-bg-on / --chillswitch-bg-on-hover', description: 'Track colour when on.' },
        { name: '--chillswitch-bg-off', description: 'Track colour when off.' },
        { name: '--chillswitch-thumb', description: 'Thumb colour.' },
        { name: '--chillswitch-success / -warning / -error', description: 'Colours for the `color` variants.' },
        { name: '--chillswitch-text / --chillswitch-text-muted', description: 'Label and description colours.' },
        { name: '--chillswitch-disabled / --chillswitch-disabled-thumb', description: 'Disabled colours.' },
    ],
    a11y: [
        'Native `<input type="checkbox">` with `role="switch"` and `aria-checked` kept in sync with the state.',
        'Space (native) and Enter both toggle the switch; Tab moves focus.',
        'The description is referenced with `aria-describedby`; the painted track is `aria-hidden`.',
        'A visible focus ring is shown for keyboard users and transitions respect `prefers-reduced-motion`.',
    ],
    tips: [
        'Always provide a `label` so the switch has an accessible name; icons and track labels are decorative.',
        '`onChange` from `toggle()` receives only the boolean; from user input it also receives the DOM event.',
        'In React, create the element in an effect and append it to a ref, or `init()` a ref to your own checkbox.',
        'Safe to import on the server; build controls in the browser.',
    ],
    related: ['checkbox', 'radio', 'segmented'],
    keywords: ['toggle', 'on off', 'boolean setting', 'ios switch'],
};

export default doc;
