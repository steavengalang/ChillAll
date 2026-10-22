import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'input',
    global: 'ChillInput',
    category: 'formControls',
    title: 'Input',
    summary: 'Text input with label, helper text, validation states, icons, clear button and a character counter.',
    style: 'create',
    description:
        'ChillInput wraps a native `<input>` with a label, helper text, optional prefix/suffix icons, a clear button and a live character counter. ' +
        'Use `ChillInput.create()` to build a ready-to-insert field, or `ChillInput.init()` to upgrade an input that already exists in your markup.\n\n' +
        'Labels and helper text are always inserted as **text**. Icons passed as strings beginning with `<` are sanitised (scripts, `on*` handlers and `javascript:` URLs are removed).',
    features: [
        'Label, helper text and error/success/warning states wired up with `aria-describedby` and `aria-invalid`',
        'Prefix and suffix icon slots accepting text, DOM nodes or sanitised SVG',
        'Clearable: a clear button appears when there is text, and Escape clears too',
        'Character counter driven by `maxLength`, highlighted when exceeded',
        '`init()` moves an existing `<input>` into the wrapper and puts it back on `destroy()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Label and helper text',
            description: 'The simplest field: a label, a placeholder and some helper copy linked to the input for screen readers.',
            code: `root.style.maxWidth = '360px';
const field = ChillInput.create({
  label: 'Email address',
  type: 'email',
  placeholder: 'you@example.com',
  helper: 'We never share your email.',
  required: true,
});
root.append(field);
cleanup(() => field.destroy());`,
        },
        {
            id: 'states-sizes',
            title: 'Sizes and validation states',
            description: 'Three sizes and four states. The `error` state also sets `aria-invalid` on the input.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:14px;max-width:360px';
const fields = [
  { label: 'Small', size: 'sm', placeholder: 'sm' },
  { label: 'Large', size: 'lg', placeholder: 'lg' },
  { label: 'Username', state: 'error', value: 'ab', helper: 'At least 3 characters.' },
  { label: 'Promo code', state: 'success', value: 'SPRING25', helper: 'Code applied.' },
  { label: 'Password', state: 'warning', type: 'password', value: 'hunter2', helper: 'Weak password.' },
].map((o) => ChillInput.create(o));
root.append(...fields);
cleanup(() => fields.forEach((f) => f.destroy()));`,
        },
        {
            id: 'icons-clear',
            title: 'Icons and clear button',
            description: 'A search-style field with a prefix icon. The clear button shows once there is text; `onClear` fires after the value is emptied.',
            code: `root.style.maxWidth = '360px';
const search = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const out = document.createElement('p');
out.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text)';
out.textContent = 'Type something...';
const field = ChillInput.create({
  placeholder: 'Search articles',
  prefix: search,
  clearable: true,
  value: 'chill',
  onChange: (v) => (out.textContent = 'Query: ' + v),
  onClear: () => (out.textContent = 'Cleared'),
});
root.append(field, out);
cleanup(() => field.destroy());`,
        },
        {
            id: 'char-count',
            title: 'Character counter',
            description: '`showCharCount` needs `maxLength`. The counter turns red if the length ever exceeds the limit (for example after a programmatic `setValue`).',
            code: `root.style.maxWidth = '360px';
const field = ChillInput.create({
  label: 'Display name',
  maxLength: 20,
  showCharCount: true,
  placeholder: 'How should we call you?',
  value: 'Ada',
});
root.append(field);
cleanup(() => field.destroy());`,
        },
        {
            id: 'validate',
            title: 'Live validation with the instance API',
            description: 'Use `init()` to get an instance, then drive `setState` and `setHelper` from your own validation logic.',
            code: `root.style.maxWidth = '360px';
const host = document.createElement('div');
root.append(host);
const inst = ChillInput.init(host, {
  label: 'Website',
  type: 'url',
  placeholder: 'https://example.com',
  helper: 'Include the protocol.',
  onChange(value) {
    if (!value) { inst.setState('default'); inst.setHelper('Include the protocol.'); }
    else if (/^https?:\\/\\/\\S+\\.\\S+/.test(value)) { inst.setState('success'); inst.setHelper('Looks good.'); }
    else { inst.setState('error'); inst.setHelper('Enter a full URL such as https://example.com'); }
  },
});
inst.setValue('example.com');
inst.setState('error');
inst.setHelper('Enter a full URL such as https://example.com');
cleanup(() => inst.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade an existing input',
            description: 'When the target is an `<input>`, it is moved into the wrapper with its attributes and listeners intact, and restored on `destroy()`.',
            code: `root.style.maxWidth = '360px';
root.innerHTML = '<input id="city" name="city" value="Lisbon">';
const el = root.querySelector('#city');
el.addEventListener('input', () => (el.title = 'edited'));
const inst = ChillInput.init(el, { label: 'City', clearable: true, suffix: '\\u{1F4CD}' });
cleanup(() => inst.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns the wrapper `<div>`. It carries `wrapper.input` (the `<input>`), `wrapper.instance` (the full instance) and `wrapper.destroy()`.\n' +
                '- **`init(target, options)`** takes a selector or element and returns an instance with `getValue`, `setValue`, `clear`, `setState`, `setHelper`, `setDisabled`, `focus`, `blur` and `destroy`.\n\n' +
                'If `target` is an `<input>` it is reused (moved into the wrapper, `id`, `name` and listeners preserved). Any other element is replaced by a freshly created input.',
        },
        {
            title: 'Validation flow',
            body:
                'ChillInput does not validate for you; it gives you the hooks. Listen with `onChange(value, event)` and call `setState("error" | "success" | "warning" | "default")` plus `setHelper(text)`:\n\n' +
                '```js\nconst email = ChillInput.init("#email", {\n  label: "Email",\n  onChange(v) {\n    const ok = /.+@.+\\..+/.test(v);\n    email.setState(ok ? "success" : "error");\n    email.setHelper(ok ? "" : "Enter a valid email");\n  },\n});\n```\n\n' +
                'The `error` state sets `aria-invalid="true"`; the helper element is referenced by `aria-describedby` so screen readers announce it with the field.',
        },
        {
            title: 'Theming',
            body:
                'Every colour is a CSS custom property on `:root`:\n\n' +
                '```css\n:root {\n  --chillinput-border-focus: #7c3aed;\n  --chillinput-bg: #fffaf0;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Label text (text only, never HTML). A `*` is added when `required`.' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder text.' },
        { name: 'type', type: 'string', default: "'text'", description: 'Native input type (`text`, `email`, `password`, `url`, ...). A reused `<input>` keeps its own type when this is left as `text`.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Field size.' },
        { name: 'state', type: "'default' | 'error' | 'success' | 'warning'", default: "'default'", description: 'Validation state. `error` also sets `aria-invalid`.' },
        { name: 'helper', type: 'string', default: "''", description: 'Helper or error text under the field (text only). Linked via `aria-describedby`.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Sets `required` and shows an asterisk on the label.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the input.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Make the input read-only.' },
        { name: 'maxLength', type: 'number', default: 'null', description: 'Sets the `maxlength` attribute.' },
        { name: 'showCharCount', type: 'boolean', default: 'false', description: 'Show a "12/40" counter. Requires `maxLength`.' },
        { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear button when there is text. Escape also clears.' },
        { name: 'prefix', type: 'string | Node', default: 'null', description: 'Leading icon slot: plain text, a DOM node, or markup beginning with `<` (sanitised).' },
        { name: 'suffix', type: 'string | Node', default: 'null', description: 'Trailing icon slot, same rules as `prefix`.' },
        { name: 'name', type: 'string', default: 'undefined', description: 'Sets the input `name`.' },
        { name: 'id', type: 'string', default: 'auto', description: 'Input id. Generated as `chillinput-N` when omitted.' },
        { name: 'autocomplete', type: 'string', default: 'undefined', description: 'Sets the `autocomplete` attribute.' },
        { name: 'value', type: 'string', default: 'undefined', description: 'Initial value.' },
        { name: 'onChange', type: '(value: string, event: Event) => void', default: 'null', description: 'Called on every `input` event (also after `clear()`).' },
        { name: 'onClear', type: '() => void', default: 'null', description: 'Called after the clear button or Escape empties the field.' },
    ],
    methods: [
        { signature: 'ChillInput.create(options)', on: 'static', description: 'Build a field and return the wrapper element (with `.input`, `.instance`, `.destroy()`).' },
        { signature: 'ChillInput.init(target, options)', on: 'static', description: 'Upgrade an `<input>` (or replace another element) and return an instance.' },
        { signature: 'ChillInput.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current value.' },
        { signature: 'instance.setValue(value)', description: 'Set the value and refresh the counter and clear button (does not fire `onChange`).' },
        { signature: 'instance.clear()', description: 'Empty the field, dispatch an `input` event, call `onClear` and focus the input.' },
        { signature: 'instance.setState(state)', description: 'Switch between `default`, `error`, `success` and `warning`.' },
        { signature: 'instance.setHelper(text)', description: 'Update (or create) the helper text.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the input.' },
        { signature: 'instance.focus() / blur()', description: 'Focus or blur the input.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the wrapper; a reused `<input>` is put back where it was.' },
        { signature: 'instance.input / instance.wrapper', description: 'The underlying `<input>` and the wrapper `<div>`.' },
    ],
    cssVars: [
        { name: '--chillinput-bg / --chillinput-text', description: 'Field background and text colour.' },
        { name: '--chillinput-border', description: 'Default border colour.' },
        { name: '--chillinput-border-focus', description: 'Border colour while focused.' },
        { name: '--chillinput-border-error / -success / -warning', description: 'State border colours.' },
        { name: '--chillinput-label / --chillinput-helper', description: 'Label and helper text colours.' },
        { name: '--chillinput-disabled-bg / --chillinput-disabled-text', description: 'Disabled and read-only surfaces.' },
    ],
    a11y: [
        'The label is a real `<label for>` bound to the input id.',
        'Helper text and the character counter are referenced by `aria-describedby`; `error` state sets `aria-invalid="true"`.',
        'Escape clears a clearable field; the clear button is `tabindex="-1"` with `aria-label="Clear"`.',
        'Prefix and suffix icons are `aria-hidden`; visible `:focus-visible` ring; transitions disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'The `onChange` callback fires for every keystroke; debounce it yourself if it triggers network calls.',
        '`setValue()` does not call `onChange`; `clear()` does (it dispatches an `input` event), which keeps frameworks in sync.',
        'In React, create the field in an effect and append it to a ref, or `init()` a ref to your own `<input>`.',
        'Safe to import on the server; build the field in the browser.',
    ],
    related: ['textarea', 'numberinput', 'autocomplete', 'select'],
    keywords: ['text field', 'form', 'textbox', 'validation', 'search box', 'clearable'],
};

export default doc;
