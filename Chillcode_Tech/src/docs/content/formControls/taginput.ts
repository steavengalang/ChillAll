import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'taginput',
    global: 'ChillTagInput',
    category: 'formControls',
    title: 'Tag Input',
    summary: 'Chip input for tags and emails with suggestions, validation, limits, duplicates handling and paste.',
    style: 'create',
    description:
        'ChillTagInput turns free text into removable chips. Press Enter or a comma (configurable) to add a tag, Backspace to remove the last one, and paste a list to add many at once. Suggestions can come from an array or an async function.\n\n' +
        '`ChillTagInput.create()` returns an instance (the root is `instance.element`, the text field is `instance.input`); pass `container` to mount it, or use `ChillTagInput.init(target, options)` to mount into an existing element. Tag text is always rendered as **text**.',
    features: [
        'Add with Enter, comma or any custom delimiter; pending text is added on blur',
        'Validation pipeline: `transform`, `maxLength`, `max`, duplicates, `allowCustom` and a `validate` callback with messages',
        'Suggestions from a static list or a debounced async function, with highlighted matches',
        'Paste a comma- or line-separated list to add many tags; chips are keyboard navigable',
        'One hidden input per tag (`name`) for plain form submission',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic tags',
            description: 'Type and press Enter or comma. Click the cross, or press Backspace on an empty field, to remove.',
            code: `root.style.maxWidth = '460px';
const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const t = ChillTagInput.create({
  value: ['design', 'frontend'],
  placeholder: 'Add a tag...',
  label: 'Project tags',
  container: root,
  onChange: (tags) => (out.textContent = tags.length + ' tags: ' + tags.join(', ')),
});
out.textContent = t.getValue().length + ' tags: ' + t.getValue().join(', ');
root.append(out);
cleanup(() => t.destroy());`,
        },
        {
            id: 'suggestions',
            title: 'Suggestions',
            description: 'Pass an array to `suggestions`; matches are highlighted and already-used tags are hidden. Use Up/Down and Enter, or click.',
            height: 280,
            code: `root.style.maxWidth = '460px';
const t = ChillTagInput.create({
  suggestions: ['javascript', 'typescript', 'rust', 'go', 'python', 'java', 'kotlin', 'swift', 'ruby'],
  value: ['rust'],
  max: 5,
  placeholder: 'Languages you know (max 5)',
  label: 'Languages',
  container: root,
});
cleanup(() => t.destroy());`,
        },
        {
            id: 'validation',
            title: 'Email recipients with validation',
            description: '`validate` returns `true`, `false` or an error message; `onInvalid` receives the text and a reason such as `duplicate`, `max`, `length` or your message.',
            code: `root.style.maxWidth = '480px';
const msg = document.createElement('p');
msg.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text);min-height:1.2em';
const t = ChillTagInput.create({
  delimiters: ['Enter', ',', ';', ' '],
  transform: (v) => v.toLowerCase(),
  validate: (v) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v) || 'That does not look like an email address',
  onInvalid: (text, reason) => (msg.textContent = '"' + text + '": ' + reason),
  placeholder: 'name@company.com',
  label: 'Recipients',
  container: root,
  name: 'recipients',
});
t.setValue(['ada@example.com']);
t.add('not-an-email');
root.append(msg);
cleanup(() => t.destroy());`,
        },
        {
            id: 'async',
            title: 'Async suggestions',
            description: '`suggestions` can be a function returning an array or a Promise. Calls are debounced (`debounce`, default 150 ms) and stale responses are dropped. With `allowCustom: false` only listed values may be added (array sources only).',
            height: 260,
            code: `root.style.maxWidth = '460px';
const cities = ['Lisbon', 'Porto', 'Madrid', 'Barcelona', 'Paris', 'Berlin', 'Rome', 'Vienna', 'Prague'];
const fakeApi = async (q) => {
  await new Promise((r) => setTimeout(r, 250));
  return cities.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
};
const t = ChillTagInput.create({
  suggestions: fakeApi,
  debounce: 200,
  maxSuggestions: 5,
  placeholder: 'Search cities...',
  label: 'Cities to visit',
  container: root,
});
cleanup(() => t.destroy());`,
        },
        {
            id: 'states-api',
            title: 'Events, readonly and control from code',
            description: 'Subscribe with `on("add" | "remove" | "change" | "invalid")`. Handlers receive `(payload, extra, instance)` where `extra` is the reason for `invalid`.',
            code: `root.style.maxWidth = '460px';
const log = document.createElement('p');
log.style.cssText = 'margin:10px 0;font-size:13px;color:var(--chill-text)';
const t = ChillTagInput.create({ value: ['alpha', 'beta'], allowDuplicates: false, maxLength: 12, container: root, label: 'Labels' });
const offs = [
  t.on('add', (tag) => (log.textContent = 'added ' + tag)),
  t.on('remove', (tag) => (log.textContent = 'removed ' + tag)),
  t.on('invalid', (text, reason) => (log.textContent = 'rejected "' + text + '" (' + reason + ')')),
];
let ro = false;
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
[['Add gamma', () => t.add('gamma')], ['Add duplicate', () => t.add('alpha')], ['Remove first', () => t.remove(0)], ['Clear', () => t.clear()], ['Toggle readonly', () => { ro = !ro; t.setReadonly(ro); }]].forEach(([label, fn]) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.onclick = fn;
  bar.append(b);
});
root.append(log, bar);
cleanup(() => { offs.forEach((o) => o()); t.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element` and the text field is `instance.input`.\n\n' +
                '- **`create(options)`** builds the control. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new control into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `setValue(array, silent?)`, `add(text)` (returns whether it was added), `remove(tagOrIndex)`, `clear()`, `focus()`, `setDisabled(bool)`, `setReadonly(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'How a tag is accepted',
            body:
                'Each candidate goes through: trim, `transform`, empty check, `max` count, `maxLength`, duplicate check (case-insensitive unless `caseSensitive`), `allowCustom` (array suggestions only) and finally `validate(text, tags)`. The first failure calls `onInvalid(text, reason, instance)` with `reason` of `max`, `length`, `duplicate`, `notallowed`, or `invalid` / your own message string from `validate`; the field also flashes an invalid state for 1.5 seconds and a live region announces the problem.\n\n' +
                'Delimiters can be keys (`"Enter"`, `"Tab"`) or single characters (`","`, `";"`, `" "`). Single characters also split pasted text, as do newlines and tabs.',
        },
        {
            title: 'Suggestions',
            body:
                'An array source is filtered locally. A function source receives the trimmed query and may return an array or a Promise; it is debounced, and out-of-order responses are ignored. `suggestionsMinChars` sets how many characters are needed (use `0` to show on focus) and `maxSuggestions` caps the list.\n\n' +
                'Pressing Enter picks the highlighted suggestion if one is active; otherwise the typed text is added.',
        },
        {
            title: 'Theming and forms',
            body:
                '```css\n:root {\n  --chilltaginput-chip-bg: #ede9fe;\n  --chilltaginput-chip-text: #5b21b6;\n  --chilltaginput-focus: #7c3aed;\n}\n```\n\n' +
                'Set `name` to render one hidden `<input name="...">` per tag so the field submits as a multi-value form entry.',
        },
    ],
    options: [
        { name: 'value', type: 'string[]', default: '[]', description: 'Initial tags.' },
        { name: 'delimiters', type: 'string[]', default: "['Enter', ',']", description: 'Keys (multi-character names) or single characters that add the current text.' },
        { name: 'addOnBlur', type: 'boolean', default: 'true', description: 'Add pending text when the field loses focus.' },
        { name: 'max', type: 'number', default: 'Infinity', description: 'Maximum number of tags.' },
        { name: 'maxLength', type: 'number', default: '0', description: 'Maximum characters per tag (0 = unlimited).' },
        { name: 'allowDuplicates', type: 'boolean', default: 'false', description: 'Allow the same tag more than once.' },
        { name: 'caseSensitive', type: 'boolean', default: 'false', description: 'Case-sensitive duplicate detection and suggestion filtering.' },
        { name: 'transform', type: '(text: string) => string', default: 'null', description: 'Normalise text before validation, e.g. lower-casing.' },
        { name: 'validate', type: '(text: string, tags: string[]) => true | false | string', default: 'null', description: 'Return `true` to accept, `false` or a message to reject.' },
        { name: 'suggestions', type: 'string[] | (query) => string[] | Promise<string[]>', default: 'null', description: 'Suggestion source.' },
        { name: 'suggestionsMinChars', type: 'number', default: '1', description: 'Characters required before suggestions show (0 = on focus).' },
        { name: 'maxSuggestions', type: 'number', default: '8', description: 'Maximum suggestions shown.' },
        { name: 'debounce', type: 'number', default: '150', description: 'Debounce in ms for function sources.' },
        { name: 'allowCustom', type: 'boolean', default: 'true', description: '`false` restricts tags to the suggestions (array sources only).' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder; hidden once `max` tags are reached.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the control.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Show tags without allowing edits (no remove buttons).' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name; one per tag.' },
        { name: 'label', type: 'string', default: "'Tags'", description: '`aria-label` of the text field.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onChange', type: '(tags: string[], instance) => void', default: 'null', description: 'After any add, remove, clear or non-silent `setValue`.' },
        { name: 'onAdd', type: '(tag: string, instance) => void', default: 'null', description: 'A tag was added.' },
        { name: 'onRemove', type: '(tag: string, instance) => void', default: 'null', description: 'A tag was removed.' },
        { name: 'onInvalid', type: '(text: string, reason: string, instance) => void', default: 'null', description: 'A tag was rejected (`empty` is never reported; blank text is ignored silently).' },
    ],
    methods: [
        { signature: 'ChillTagInput.create(options)', on: 'static', description: 'Build a control and return the instance (root at `.element`).' },
        { signature: 'ChillTagInput.init(target, options)', on: 'static', description: 'Mount a control into an element or selector; returns `null` if not found.' },
        { signature: 'ChillTagInput.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'A copy of the tags array.' },
        { signature: 'instance.setValue(tags, silent?)', description: 'Replace all tags (trimmed, de-duplicated, capped by `max`). Fires `change` unless `silent`.' },
        { signature: 'instance.add(text)', description: 'Run the full validation pipeline; returns true if the tag was added.' },
        { signature: 'instance.remove(tagOrIndex)', description: 'Remove by text or index; returns true if removed.' },
        { signature: 'instance.clear()', description: 'Remove every tag.' },
        { signature: 'instance.focus()', description: 'Focus the text field.' },
        { signature: 'instance.setDisabled(disabled) / setReadonly(readonly)', description: 'Change the interaction state.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `change`, `add`, `remove` or `invalid`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element / input', description: 'The root element and the text `<input>`.' },
    ],
    events: [
        { name: 'change', payload: 'tags, undefined, instance', description: 'The tag list changed.' },
        { name: 'add', payload: 'tag, undefined, instance', description: 'A tag was added.' },
        { name: 'remove', payload: 'tag, undefined, instance', description: 'A tag was removed.' },
        { name: 'invalid', payload: 'text, reason, instance', description: 'A tag was rejected; `reason` is `max`, `duplicate`, `length`, `notallowed`, `invalid` or your message.' },
    ],
    cssVars: [
        { name: '--chilltaginput-bg / --chilltaginput-text', description: 'Field background and text colour.' },
        { name: '--chilltaginput-border / --chilltaginput-focus', description: 'Border and focus colours.' },
        { name: '--chilltaginput-chip-bg / --chilltaginput-chip-text', description: 'Chip colours (and `-chip-hover`).' },
        { name: '--chilltaginput-menu-bg / --chilltaginput-menu-hover', description: 'Suggestion menu colours.' },
        { name: '--chilltaginput-error', description: 'Invalid state colour.' },
        { name: '--chilltaginput-shadow', description: 'Suggestion menu shadow.' },
    ],
    a11y: [
        'With suggestions the field is a `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the menu is a `listbox`.',
        'Keys: Enter / comma add, Backspace on an empty field removes the last tag, ArrowLeft from the start moves to the chips; on a chip, Left/Right move and Delete/Backspace remove.',
        'Suggestions: Up/Down move, Enter picks, Esc closes.',
        'A polite live region announces "added", "removed" and rejection reasons; the field gets `aria-invalid` briefly on rejection.',
    ],
    tips: [
        '`on()` handlers are called as `(payload, extra, instance)`, unlike the `onX` options which receive `(payload, instance)`.',
        'Use `transform` to normalise (lower-case, strip `#`) before duplicate checks run.',
        'Validate again on the server; `allowCustom: false` and `validate` only guard the UI.',
        'In React, create the control in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['autocomplete', 'select', 'input', 'tag'],
    keywords: ['chips', 'labels', 'keywords', 'email list', 'token input', 'multi value'],
};

export default doc;
