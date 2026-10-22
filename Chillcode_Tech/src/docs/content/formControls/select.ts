import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'select',
    global: 'ChillSelect',
    category: 'formControls',
    title: 'Select',
    summary: 'Accessible custom select with search, multi-select tags, groups, keyboard support and native form values.',
    style: 'create',
    description:
        'ChillSelect replaces the native `<select>` with a styled combobox and listbox that you can search, group and fully theme. ' +
        'Build one with `ChillSelect.create()`, or call `ChillSelect.init()` on an existing `<select>` to read its options, selection and name.\n\n' +
        'Option labels, group titles and the placeholder are always rendered as **text**. When a `name` is set, hidden inputs are kept in sync so the value still submits with a regular `<form>`.',
    features: [
        'Single and multiple selection; multi mode shows removable tags and Backspace removes the last one',
        'Optional search box, option groups, dividers and disabled options',
        'Full keyboard model with type-ahead on the trigger, plus combobox/listbox ARIA wiring',
        'Enhances a native `<select>` (options, selection, `name`, `required`) and restores it on `destroy()`',
        'Hidden inputs keep plain HTML form submission working',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic select',
            description: 'A label, a placeholder and a list of items. `onChange` receives the selected value.',
            height: 260,
            code: `root.style.maxWidth = '320px';
const out = document.createElement('p');
out.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text)';
const sel = ChillSelect.create({
  label: 'Country',
  placeholder: 'Choose a country',
  items: [
    { value: 'pt', label: 'Portugal' },
    { value: 'jp', label: 'Japan' },
    { value: 'br', label: 'Brazil' },
    { value: 'ca', label: 'Canada' },
  ],
  helper: 'Where should we ship your order?',
  onChange: (v) => (out.textContent = 'Selected: ' + v),
});
root.append(sel, out);
cleanup(() => sel.destroy());`,
        },
        {
            id: 'searchable',
            title: 'Searchable with groups',
            description: 'Add `searchable` to filter long lists. Groups and dividers use `type: "group"` / `type: "divider"` items.',
            height: 340,
            code: `root.style.maxWidth = '320px';
const sel = ChillSelect.create({
  label: 'Timezone',
  searchable: true,
  searchPlaceholder: 'Search timezones...',
  value: 'Europe/Lisbon',
  items: [
    { type: 'group', label: 'Europe' },
    { value: 'Europe/Lisbon', label: 'Lisbon (WET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Athens', label: 'Athens (EET)' },
    { type: 'divider' },
    { type: 'group', label: 'Americas' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', disabled: true },
  ],
});
root.append(sel);
cleanup(() => sel.destroy());`,
        },
        {
            id: 'multiple',
            title: 'Multi-select with tags',
            description: 'With `multiple` the value is an array and each choice becomes a removable tag.',
            height: 300,
            code: `root.style.maxWidth = '380px';
const sel = ChillSelect.create({
  label: 'Skills',
  multiple: true,
  placeholder: 'Pick your skills',
  value: ['js', 'css'],
  items: [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'css', label: 'CSS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'perf', label: 'Performance' },
  ],
  onChange: (v) => console.log('skills', v),
});
root.append(sel);
cleanup(() => sel.destroy());`,
        },
        {
            id: 'enhance-native',
            title: 'Enhance a native select',
            description: '`init()` reads options, optgroups, the selected value, `name` and `required` from an existing `<select>`.',
            height: 280,
            code: `root.style.maxWidth = '320px';
root.innerHTML = '<select id="plan" name="plan" required>' +
  '<optgroup label="Personal"><option value="free">Free</option><option value="pro" selected>Pro</option></optgroup>' +
  '<optgroup label="Teams"><option value="team">Team</option><option value="ent" disabled>Enterprise</option></optgroup>' +
  '</select>';
const inst = ChillSelect.init(root.querySelector('#plan'), { label: 'Plan', size: 'lg' });
cleanup(() => inst.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Dynamic items and validation',
            description: 'Use `setItems` to swap the list at runtime (here after a fake request) and `setState("error")` to flag problems.',
            height: 280,
            code: `root.style.maxWidth = '320px';
const host = document.createElement('div');
root.append(host);
const inst = ChillSelect.init(host, {
  label: 'City',
  placeholder: 'Loading cities...',
  disabled: true,
  helper: 'Please select a city.',
});
await new Promise((r) => setTimeout(r, 400));
inst.setItems([
  { value: 'lis', label: 'Lisbon' },
  { value: 'opo', label: 'Porto' },
  { value: 'far', label: 'Faro' },
]);
inst.setDisabled(false);
inst.setState('error');
cleanup(() => inst.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns the wrapper `<div>`; the controller is on `wrapper.instance` and `wrapper.destroy()` cleans up.\n' +
                '- **`init(target, options)`** takes a selector or element and returns the controller. The target is *replaced* by the select UI.\n\n' +
                'When the target is a native `<select>`, its options (including `<optgroup>`), selected value(s), `multiple`, `name`, `required` and `disabled` are used as defaults; anything in `options` wins. `destroy()` restores that `<select>` with the current selection (for any other target it inserts a plain `<select>` built from the items).',
        },
        {
            title: 'Values and form submission',
            body:
                'The value is a single item `value` (or `null`), or an array when `multiple` is true. Comparison is done on string equality, so `1` and `"1"` match.\n\n' +
                'Set `name` and one hidden `<input name="...">` is rendered per selected value, so the field posts with a normal form. `setValue(value, emit)` does not call `onChange` unless `emit` is true.',
        },
        {
            title: 'Keyboard and search',
            body:
                'On the trigger, `ArrowDown`, `ArrowUp`, `Enter` and `Space` open the list; typing letters while closed jumps to (and selects) a matching option. Once open, use the arrows, `Home`/`End`, `Enter`/`Space` to choose, `Esc` to close and return focus, and `Tab` to close.\n\n' +
                'With `searchable`, the search input receives focus when the list opens and filters labels case-insensitively. Group labels and dividers are hidden while a query is active.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillselect-border-focus: #7c3aed;\n  --chillselect-selected: #f3e8ff;\n  --chillselect-dropdown-shadow: 0 12px 32px rgba(0,0,0,.18);\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'items', type: 'Array<{ value, label, disabled? } | { type: "group", label } | { type: "divider" }>', default: '[]', description: 'Options, group headings and dividers. Labels are text.' },
        { name: 'items[].value', type: 'string | number', default: '-', description: 'Value returned by `getValue()` / `onChange`.' },
        { name: 'items[].label', type: 'string', default: '-', description: 'Visible label (text).' },
        { name: 'items[].disabled', type: 'boolean', default: 'false', description: 'Make the option unselectable.' },
        { name: 'value', type: 'string | number | Array', default: 'null', description: 'Selected value; an array (default `[]`) when `multiple`.' },
        { name: 'multiple', type: 'boolean', default: 'false', description: 'Multi-select with removable tags.' },
        { name: 'searchable', type: 'boolean', default: 'false', description: 'Show a search box inside the list.' },
        { name: 'searchPlaceholder', type: 'string', default: "'Search...'", description: 'Placeholder (and accessible name) of the search box.' },
        { name: 'placeholder', type: 'string', default: "'Select an option'", description: 'Shown when nothing is selected.' },
        { name: 'noResultsText', type: 'string', default: "'No options found'", description: 'Shown when the search matches nothing.' },
        { name: 'label', type: 'string', default: "''", description: 'Label text; a `*` is added when `required`.' },
        { name: 'helper', type: 'string', default: "''", description: 'Helper text under the control (text only).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'state', type: "'default' | 'error'", default: "'default'", description: 'Validation state; `error` sets `aria-invalid`.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Marks the trigger `aria-required` and adds the label asterisk.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the control.' },
        { name: 'name', type: 'string', default: "''", description: 'Render hidden input(s) with this name so the value submits with forms.' },
        { name: 'onChange', type: '(value) => void', default: 'null', description: 'Called when the selection changes through the UI or `setValue(v, true)`. Receives an array copy in multi mode.' },
    ],
    methods: [
        { signature: 'ChillSelect.create(options)', on: 'static', description: 'Build a select and return the wrapper element (with `.instance` and `.destroy()`).' },
        { signature: 'ChillSelect.init(target, options)', on: 'static', description: 'Replace an element (or native `<select>`) with a select and return the controller.' },
        { signature: 'ChillSelect.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current value (array copy when `multiple`).' },
        { signature: 'instance.setValue(value, emit?)', description: 'Set the value programmatically; pass `emit = true` to fire `onChange`.' },
        { signature: 'instance.setItems(items)', description: 'Replace the list of items.' },
        { signature: 'instance.setState(state)', description: 'Switch between `default` and `error`.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the control (closes it when disabling).' },
        { signature: 'instance.open() / close() / toggle()', description: 'Control the dropdown programmatically.' },
        { signature: 'instance.focus()', description: 'Focus the trigger.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the UI; restores a native `<select>` when one was enhanced.' },
        { signature: 'instance.isOpen', description: 'Boolean, true while the list is open.' },
    ],
    cssVars: [
        { name: '--chillselect-bg / --chillselect-text', description: 'Trigger background and text colour.' },
        { name: '--chillselect-border / --chillselect-border-focus', description: 'Default and focused border colours.' },
        { name: '--chillselect-hover / --chillselect-selected', description: 'Option hover and selected backgrounds.' },
        { name: '--chillselect-dropdown-bg', description: 'List background.' },
        { name: '--chillselect-dropdown-shadow', description: 'List shadow.' },
        { name: '--chillselect-disabled-bg / --chillselect-disabled-text', description: 'Disabled colours.' },
    ],
    a11y: [
        'The trigger is a `<button role="combobox">` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list is `role="listbox"` with `role="option"` items and `aria-selected`.',
        'Multi mode sets `aria-multiselectable`; tag remove buttons carry `aria-label="Remove ..."`.',
        'Keys: ArrowUp/Down open and move, Home/End jump, Enter/Space select, Esc closes and refocuses the trigger, Tab closes, letters type-ahead.',
        'The label is linked with `aria-labelledby` and clicking it focuses the trigger; `error` state sets `aria-invalid`.',
    ],
    tips: [
        'The list is positioned inside the component wrapper, so give the container enough room or `overflow: visible` near the bottom of a clipped parent.',
        '`onChange` is not called by a plain `setValue(v)`; pass `true` as the second argument when you want it.',
        'Items with `value: ""` are treated as normal options; when enhancing a native single `<select>`, an empty-value option is ignored as a selection so the placeholder shows.',
        'In React, create the select in an effect and append it to a ref, calling `destroy()` on cleanup.',
    ],
    related: ['dropdown', 'autocomplete', 'taginput', 'radio'],
    keywords: ['combobox', 'listbox', 'picker', 'multiselect', 'dropdown select', 'option list'],
};

export default doc;
