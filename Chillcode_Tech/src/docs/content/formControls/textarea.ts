import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'textarea',
    global: 'ChillTextarea',
    category: 'formControls',
    title: 'Textarea',
    summary: 'Multi-line text field with auto-grow, character counter, helper text and validation states.',
    style: 'create',
    description:
        'ChillTextarea wraps a native `<textarea>` with a label, helper text, a live character counter and optional auto-resizing. ' +
        'Use `ChillTextarea.create()` to build a field, or `ChillTextarea.init()` to upgrade a textarea that already exists in your markup.\n\n' +
        'Label and helper text are always inserted as **text**, never HTML.',
    features: [
        'Auto-grow with an optional `maxRows` cap, after which the field scrolls',
        'Character counter driven by `maxLength`, highlighted when exceeded',
        'Error and success states with `aria-invalid` and `aria-describedby` wiring',
        'Three sizes, configurable `rows`, and an option to hide the resize handle',
        '`init()` moves an existing `<textarea>` into the wrapper and restores it on `destroy()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Label, placeholder and helper',
            description: 'A plain multi-line field with a label and helper copy.',
            code: `root.style.maxWidth = '420px';
const field = ChillTextarea.create({
  label: 'Message',
  placeholder: 'Tell us what you need help with...',
  helper: 'We usually reply within one business day.',
  rows: 4,
});
root.append(field);
cleanup(() => field.destroy());`,
        },
        {
            id: 'counter',
            title: 'Character counter',
            description: '`showCharCount` needs `maxLength`. The native `maxlength` attribute stops typing at the limit.',
            code: `root.style.maxWidth = '420px';
const field = ChillTextarea.create({
  label: 'Short bio',
  maxLength: 160,
  showCharCount: true,
  value: 'Designer and part-time baker. Currently building tiny tools for the web.',
  rows: 3,
});
root.append(field);
cleanup(() => field.destroy());`,
        },
        {
            id: 'autoresize',
            title: 'Auto-resize',
            description: 'The field grows with its content. With `maxRows` it stops growing at that many lines and scrolls instead.',
            code: `root.style.maxWidth = '420px';
const field = ChillTextarea.create({
  label: 'Notes',
  autoResize: true,
  maxRows: 6,
  rows: 2,
  noResize: true,
  placeholder: 'Start typing - the box grows with you',
  value: 'First line\\nSecond line\\nThird line',
});
root.append(field);
cleanup(() => field.destroy());`,
        },
        {
            id: 'states',
            title: 'Validation states',
            description: 'Use `setState` and `setHelper` from your own validation logic. Here the field validates a minimum length as you type.',
            code: `root.style.maxWidth = '420px';
const host = document.createElement('div');
root.append(host);
const MIN = 20;
const inst = ChillTextarea.init(host, {
  label: 'Describe the bug',
  helper: 'Minimum ' + MIN + ' characters.',
  required: true,
  onChange(v) {
    if (v.length >= MIN) { inst.setState('success'); inst.setHelper('Thanks, that is plenty of detail.'); }
    else { inst.setState('error'); inst.setHelper(MIN - v.length + ' more characters needed.'); }
  },
});
inst.setValue('It crashes');
inst.setState('error');
inst.setHelper(MIN - 10 + ' more characters needed.');
cleanup(() => inst.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade an existing textarea',
            description: 'When the target is a `<textarea>`, it is moved into the wrapper with its attributes and listeners intact.',
            code: `root.style.maxWidth = '420px';
root.innerHTML = '<textarea id="draft" name="draft">Existing draft text</textarea>';
const el = root.querySelector('#draft');
const inst = ChillTextarea.init(el, { label: 'Draft', size: 'sm', rows: 3, maxLength: 200, showCharCount: true });
const timer = setTimeout(() => inst.setDisabled(true), 1200);
cleanup(() => { clearTimeout(timer); inst.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns the wrapper `<div>`, which also exposes `wrapper.textarea`, `wrapper.instance` and `wrapper.destroy()`.\n' +
                '- **`init(target, options)`** takes a selector or element and returns an instance with `getValue`, `setValue`, `clear`, `setState`, `setHelper`, `setDisabled`, `focus`, `blur`, `autoResize` and `destroy`.\n\n' +
                'A `<textarea>` target is reused (its `id`, `name` and listeners are preserved); any other element is replaced by a new textarea. `destroy()` puts a reused textarea back where it was.',
        },
        {
            title: 'Auto-resize behaviour',
            body:
                'With `autoResize: true` the height is recalculated on every `input` event and after `setValue()`. Pass `maxRows` to cap the growth; once the cap is reached the field scrolls vertically.\n\n' +
                'If you change the width or font of the field after creation (for example when a hidden tab becomes visible), call `instance.autoResize()` to recompute the height.',
        },
        {
            title: 'Theming',
            body:
                'Colours are CSS custom properties on `:root`:\n\n' +
                '```css\n:root {\n  --chilltextarea-border-focus: #7c3aed;\n  --chilltextarea-bg: #fffaf0;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Label text (text only). A `*` is added when `required`.' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder text.' },
        { name: 'helper', type: 'string', default: "''", description: 'Helper or error text under the field (text only).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Field size.' },
        { name: 'state', type: "'default' | 'error' | 'success'", default: "'default'", description: 'Validation state. `error` also sets `aria-invalid`.' },
        { name: 'rows', type: 'number', default: '4', description: 'Visible rows.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Sets `required` and shows an asterisk on the label.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the field.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Make the field read-only.' },
        { name: 'maxLength', type: 'number', default: 'null', description: 'Sets the `maxlength` attribute.' },
        { name: 'showCharCount', type: 'boolean', default: 'false', description: 'Show a "12/200" counter. Requires `maxLength`.' },
        { name: 'autoResize', type: 'boolean', default: 'false', description: 'Grow the field with its content.' },
        { name: 'maxRows', type: 'number', default: 'null', description: 'With `autoResize`, stop growing after this many lines and scroll.' },
        { name: 'noResize', type: 'boolean', default: 'false', description: 'Hide the manual resize handle.' },
        { name: 'name', type: 'string', default: 'undefined', description: 'Sets the `name` attribute.' },
        { name: 'id', type: 'string', default: 'auto', description: 'Textarea id. Generated as `chilltextarea-N` when omitted.' },
        { name: 'value', type: 'string', default: 'undefined', description: 'Initial value.' },
        { name: 'onChange', type: '(value: string, event: Event) => void', default: 'null', description: 'Called on every `input` event.' },
    ],
    methods: [
        { signature: 'ChillTextarea.create(options)', on: 'static', description: 'Build a field and return the wrapper element (with `.textarea`, `.instance`, `.destroy()`).' },
        { signature: 'ChillTextarea.init(target, options)', on: 'static', description: 'Upgrade a `<textarea>` (or replace another element) and return an instance.' },
        { signature: 'ChillTextarea.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current value.' },
        { signature: 'instance.setValue(value)', description: 'Set the value; refreshes the counter and height. Does not fire `onChange`.' },
        { signature: 'instance.clear()', description: 'Same as `setValue("")`. Does not fire `onChange`.' },
        { signature: 'instance.setState(state)', description: 'Switch between `default`, `error` and `success`.' },
        { signature: 'instance.setHelper(text)', description: 'Update (or create) the helper text.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the field.' },
        { signature: 'instance.autoResize()', description: 'Recompute the height (useful after layout changes).' },
        { signature: 'instance.focus() / blur()', description: 'Focus or blur the textarea.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the wrapper; a reused `<textarea>` is restored.' },
        { signature: 'instance.textarea / instance.wrapper', description: 'The underlying `<textarea>` and wrapper `<div>`.' },
    ],
    cssVars: [
        { name: '--chilltextarea-bg / --chilltextarea-text', description: 'Field background and text colour.' },
        { name: '--chilltextarea-border', description: 'Default border colour.' },
        { name: '--chilltextarea-border-focus', description: 'Border colour while focused.' },
        { name: '--chilltextarea-border-error / -success', description: 'State border colours.' },
        { name: '--chilltextarea-label / --chilltextarea-helper', description: 'Label and helper text colours.' },
        { name: '--chilltextarea-disabled-bg / --chilltextarea-disabled-text', description: 'Disabled surface colours.' },
    ],
    a11y: [
        'The label is a real `<label for>` bound to the textarea id.',
        'Helper text and the counter are referenced by `aria-describedby`; `error` state sets `aria-invalid="true"`.',
        'Native textarea semantics and keyboard behaviour are preserved; visible `:focus-visible` ring.',
    ],
    tips: [
        '`setValue()` and `clear()` do not call `onChange`; update dependent UI yourself after calling them.',
        'The counter uses `maxLength` as both the native limit and the displayed limit; the exceeded style appears only if a script sets a longer value.',
        'In React, create the field in an effect and append it to a ref, or `init()` a ref to your own `<textarea>`.',
        'Safe to import on the server; build the field in the browser.',
    ],
    related: ['input', 'form', 'forms'],
    keywords: ['multiline', 'text area', 'comment box', 'auto grow', 'counter'],
};

export default doc;
