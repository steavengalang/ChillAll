import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'autocomplete',
    global: 'ChillAutocomplete',
    category: 'formControls',
    title: 'Autocomplete',
    summary: 'Accessible combobox that suggests results from an array or an async source as the user types.',
    style: 'create',
    description:
        'ChillAutocomplete is a text field with a results list (ARIA 1.2 combobox + listbox). Give it an array of strings or objects and it filters locally; give it a function and it calls it with the query, debounced, an `AbortSignal` for cancellation and a loading row while waiting.\n\n' +
        '`ChillAutocomplete.create()` returns an instance (the root is `instance.element`, the text field is `instance.input`); pass `container` to mount it, or use `ChillAutocomplete.init(target, options)` to mount into an existing element. Labels are inserted as **text**; `renderItem` may return a DOM node for rich rows.',
    features: [
        'Local filtering of arrays (strings or objects) or async sources with debounce, abort and stale-response protection',
        'Highlighted matches, loading and no-results rows, keyboard navigation and live-region announcements',
        'Object items via `labelKey`, custom rows via `renderItem`, custom matching via `filter`',
        '`allowFreeText: false` for strict selection, `openOnFocus`, `autoSelectFirst`, clear button',
        'Rich events: `input`, `select`, `change`, `open`, `close` and `error`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic autocomplete',
            description: 'A simple array source. Type to filter; Arrow keys and Enter (or click) select.',
            height: 280,
            code: `root.style.maxWidth = '380px';
const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const ac = ChillAutocomplete.create({
  source: ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Mango', 'Orange', 'Papaya', 'Pear'],
  placeholder: 'Search fruit...',
  label: 'Fruit',
  container: root,
  onSelect: (item) => (out.textContent = 'You picked ' + item),
});
root.append(out);
cleanup(() => ac.destroy());`,
        },
        {
            id: 'objects',
            title: 'Objects, custom rows and clear button',
            description: 'Object items show `labelKey` as text. `renderItem` can return a Node for richer rows; `clearable` adds an x button.',
            height: 300,
            code: `root.style.maxWidth = '420px';
const people = [
  { label: 'Ada Lovelace', role: 'Mathematician', id: 1 },
  { label: 'Alan Turing', role: 'Computer scientist', id: 2 },
  { label: 'Grace Hopper', role: 'Rear admiral', id: 3 },
  { label: 'Margaret Hamilton', role: 'Software engineer', id: 4 },
];
const ac = ChillAutocomplete.create({
  source: people,
  clearable: true,
  minChars: 0,
  openOnFocus: true,
  placeholder: 'Assign to...',
  label: 'Assignee',
  container: root,
  renderItem: (p) => {
    const row = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = p.label;
    const role = document.createElement('small');
    role.textContent = '  ' + p.role;
    role.style.opacity = '0.7';
    row.append(name, role);
    return row;
  },
  onSelect: (p) => console.log('assignee id', p.id),
});
cleanup(() => ac.destroy());`,
        },
        {
            id: 'async',
            title: 'Async source with loading state',
            description: 'A function source receives `(query, { signal })` and may return a Promise. Stale responses are ignored and the previous request is aborted.',
            height: 280,
            code: `root.style.maxWidth = '420px';
const db = ['Lisbon, Portugal', 'Porto, Portugal', 'Madrid, Spain', 'Barcelona, Spain', 'Paris, France', 'Berlin, Germany', 'Rome, Italy'];
const ac = ChillAutocomplete.create({
  source: async (query, { signal }) => {
    await new Promise((r) => setTimeout(r, 400));          // pretend network latency
    if (signal && signal.aborted) return [];
    return db.filter((c) => c.toLowerCase().includes(query.toLowerCase()));
  },
  debounce: 250,
  minChars: 2,
  maxResults: 5,
  loadingText: 'Searching cities...',
  noResultsText: 'No matching city',
  placeholder: 'Type at least 2 letters',
  label: 'City',
  container: root,
  onError: (err) => console.error('search failed', err),
});
cleanup(() => ac.destroy());`,
        },
        {
            id: 'strict',
            title: 'Strict selection',
            description: '`allowFreeText: false` reverts the text to the last selected item (or empty) on blur; `autoSelectFirst` activates the first result as soon as the list opens.',
            height: 260,
            code: `root.style.maxWidth = '380px';
const ac = ChillAutocomplete.create({
  source: ['Admin', 'Editor', 'Reviewer', 'Viewer'],
  allowFreeText: false,
  autoSelectFirst: true,
  minChars: 0,
  openOnFocus: true,
  placeholder: 'Choose a role',
  label: 'Role',
  container: root,
  onChange: (text, item) => console.log('change', text, item),
});
cleanup(() => ac.destroy());`,
        },
        {
            id: 'api',
            title: 'Events and programmatic control',
            description: 'Use `on(event, fn)` (handlers receive `(a, b, instance)`), `setSource` to swap data, `setValue(text, item?)` and `clear()`.',
            height: 300,
            code: `root.style.maxWidth = '420px';
const log = document.createElement('p');
log.style.cssText = 'margin:10px 0;font-size:13px;color:var(--chill-text)';
const ac = ChillAutocomplete.init(root.appendChild(document.createElement('div')), {
  source: ['red', 'green', 'blue'],
  placeholder: 'Pick a colour',
  label: 'Colour',
});
const offs = [
  ac.on('open', () => (log.textContent = 'list opened')),
  ac.on('select', (item) => (log.textContent = 'selected ' + item)),
  ac.on('change', (text) => (log.textContent = 'changed to "' + text + '"')),
];
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
[['Use warm colours', () => ac.setSource(['orange', 'amber', 'crimson'])], ['Set "teal"', () => ac.setValue('teal')], ['Clear', () => ac.clear()]].forEach(([t, fn]) => {
  const b = document.createElement('button');
  b.textContent = t;
  b.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.onclick = fn;
  bar.append(b);
});
root.append(log, bar);
cleanup(() => { offs.forEach((o) => o()); ac.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element` and the text field is `instance.input`.\n\n' +
                '- **`create(options)`** builds the control. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new control into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()` (the text), `getSelected()` (the item or `null`), `setValue(text, item?)`, `clear()`, `open()`, `close()`, `isOpen()`, `setSource(source)`, `focus()`, `setDisabled(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Sources',
            body:
                '**Arrays** are filtered synchronously on every keystroke with a case-insensitive "contains" match; override it with `filter(item, query, label)`. Items can be strings or objects (display text comes from `labelKey`, default `label`).\n\n' +
                '**Functions** are called as `source(query, { signal })` after `debounce` ms and may return an array or a Promise. A newer keystroke aborts the previous `AbortSignal` and discards late responses. Rejections (other than `AbortError`) close the list and call `onError` / emit `error`.\n\n' +
                '```js\nChillAutocomplete.create({\n  source: (q, { signal }) => fetch("/api/cities?q=" + encodeURIComponent(q), { signal }).then((r) => r.json()),\n  labelKey: "name",\n});\n```',
        },
        {
            title: 'Events and what they mean',
            body:
                '- `onInput(text)` fires on every keystroke.\n' +
                '- `onSelect(item)` fires when the user picks a result; `onChange(text, item)` fires right after, and also when free text is committed on blur (with `item` as `null`) or on `clear()`.\n' +
                '- `setValue()` updates silently, so use it to restore saved state.\n\n' +
                'With `allowFreeText: false` the text always snaps back to the selected item on blur, so read `getSelected()` for the chosen object.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillautocomplete-focus: #7c3aed;\n  --chillautocomplete-active: #ede9fe;\n  --chillautocomplete-shadow: 0 12px 28px rgba(0,0,0,.15);\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'source', type: 'Array<string | object> | (query, { signal }) => Array | Promise<Array>', default: '[]', description: 'Items to suggest, or a function that returns them.' },
        { name: 'labelKey', type: 'string', default: "'label'", description: 'Property used as display text for object items.' },
        { name: 'valueKey', type: 'string', default: "'value'", description: 'Accepted for API symmetry but not currently read by the component; read values from `getSelected()` yourself.' },
        { name: 'minChars', type: 'number', default: '1', description: 'Characters required before searching (0 also lets focus / arrow keys open the list).' },
        { name: 'debounce', type: 'number', default: '200', description: 'Debounce in ms for function sources. Arrays filter instantly.' },
        { name: 'maxResults', type: 'number', default: '10', description: 'Maximum rows shown.' },
        { name: 'highlight', type: 'boolean', default: 'true', description: 'Wrap the matched text in `<mark>`.' },
        { name: 'filter', type: '(item, query, label) => boolean', default: 'null', description: 'Custom matcher for array sources (default: case-insensitive contains).' },
        { name: 'renderItem', type: '(item, query) => string | Node', default: 'null', description: 'Custom row. Strings are inserted as text; return a Node for markup.' },
        { name: 'allowFreeText', type: 'boolean', default: 'true', description: '`false` reverts the text to the selected item (or empty) on blur.' },
        { name: 'openOnFocus', type: 'boolean', default: 'false', description: 'Open the list on focus (honours `minChars`).' },
        { name: 'autoSelectFirst', type: 'boolean', default: 'false', description: 'Make the first result active as soon as the list opens; Tab then selects it.' },
        { name: 'noResultsText', type: 'string | null', default: "'No results'", description: 'Shown when nothing matches; `null` shows nothing.' },
        { name: 'loadingText', type: 'string | null', default: "'Loading...'", description: 'Shown while an async source is pending; `null` hides it.' },
        { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear (x) button when there is text.' },
        { name: 'value', type: 'string', default: "''", description: 'Initial text.' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder text.' },
        { name: 'name', type: 'string', default: 'undefined', description: '`name` attribute of the text input.' },
        { name: 'label', type: 'string', default: 'undefined', description: '`aria-label` of the input and list.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the control.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'onInput', type: '(text: string, instance) => void', default: 'null', description: 'Every keystroke.' },
        { name: 'onSelect', type: '(item, instance) => void', default: 'null', description: 'A result was picked.' },
        { name: 'onChange', type: '(text: string, item, instance) => void', default: 'null', description: 'After a selection, a committed free-text edit, or `clear()`.' },
        { name: 'onError', type: '(error, instance) => void', default: 'null', description: 'An async source threw or rejected.' },
    ],
    methods: [
        { signature: 'ChillAutocomplete.create(options)', on: 'static', description: 'Build a control and return the instance (root at `.element`).' },
        { signature: 'ChillAutocomplete.init(target, options)', on: 'static', description: 'Mount a control into an element or selector; returns `null` if not found.' },
        { signature: 'ChillAutocomplete.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'The text currently in the field.' },
        { signature: 'instance.getSelected()', description: 'The selected item, or `null` (typing resets it).' },
        { signature: 'instance.setValue(text, item?)', description: 'Set the text (and selected item) silently.' },
        { signature: 'instance.clear()', description: 'Empty the field, close the list and fire `input` and `change`.' },
        { signature: 'instance.open() / close() / isOpen()', description: 'Run a search for the current text / close the list / query it.' },
        { signature: 'instance.setSource(source)', description: 'Replace the array or function source.' },
        { signature: 'instance.focus()', description: 'Focus the text field.' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the control.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to an event; returns an unsubscribe function. Handlers receive `(a, b, instance)`.' },
        { signature: 'instance.destroy()', description: 'Abort pending requests, remove listeners and the element.' },
        { signature: 'instance.element / input', description: 'The root element and the text `<input>`.' },
    ],
    events: [
        { name: 'input', payload: 'text', description: 'The text changed by typing, Escape or `clear()`.' },
        { name: 'select', payload: 'item', description: 'A result was picked.' },
        { name: 'change', payload: 'text, item', description: 'Selection or committed text changed.' },
        { name: 'open', description: 'The results list opened.' },
        { name: 'close', description: 'The results list closed.' },
        { name: 'error', payload: 'error', description: 'An async source failed.' },
    ],
    cssVars: [
        { name: '--chillautocomplete-bg / --chillautocomplete-text', description: 'Field and list background and text colour.' },
        { name: '--chillautocomplete-border / --chillautocomplete-focus', description: 'Border and focus colours.' },
        { name: '--chillautocomplete-hover / --chillautocomplete-active', description: 'Hovered and keyboard-active row backgrounds.' },
        { name: '--chillautocomplete-muted', description: 'Status rows and secondary text.' },
        { name: '--chillautocomplete-shadow', description: 'List shadow.' },
    ],
    a11y: [
        'The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` and `aria-busy` while loading; the list is a `listbox` of `option`s.',
        'Keys: ArrowDown/Up open and move, Enter selects the active row, Esc closes (or clears the text when closed), Tab closes (or selects the first result with `autoSelectFirst`).',
        'A polite live region announces "N results available" and the no-results text.',
        'Provide `label` so the combobox has an accessible name.',
    ],
    tips: [
        'Use `minChars` and `debounce` to protect your API; use `AbortSignal` in `fetch` to cancel superseded requests.',
        'Typing clears `getSelected()`; use `allowFreeText: false` if the form needs a real selection.',
        'For multiple values use [Tag Input](/components/taginput); for a fixed list without typing use [Select](/components/select).',
        'In React, create the control in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['select', 'taginput', 'input', 'search'],
    keywords: ['typeahead', 'search suggestions', 'combobox', 'lookup', 'async search', 'autosuggest'],
};

export default doc;
