import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'search',
    global: 'ChillSearch',
    category: 'data',
    title: 'Search',
    summary: 'Search input with live suggestions, async sources, match highlighting and a Ctrl/Cmd+K shortcut.',
    style: 'init',
    description:
        'ChillSearch is an ARIA combobox: a search field with a clear button, a debounced suggestion list that highlights the matching text, and full keyboard navigation. ' +
        'Feed it a static list of `suggestions`, or a `getSuggestions(query)` function (sync or async) for server-side search; stale responses are discarded automatically.\n\n' +
        'Everything is built with the DOM API: labels, icons and highlights are text, never parsed as HTML (`iconHtml` is the only opt-in). ' +
        '`init(target, options)` replaces the target element with the search box and `destroy()` restores it; `create(options)` builds a detached box you append yourself.',
    features: [
        'Debounced filtering with matched text highlighted inside each suggestion',
        'Async `getSuggestions(query)` with a loading spinner and stale-response protection',
        'Suggestions can be strings or `{ label, icon, value }` objects',
        'Optional Ctrl/Cmd+K shortcut that focuses the field',
        'ARIA combobox semantics: arrows, Enter, Escape, Home/End, live status announcements',
        'Three sizes, a clear button and a configurable "no results" message',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Static suggestions',
            description: 'Pass an array of strings. Typing filters it (case-insensitive substring), and the match is highlighted. `onSelect` receives the chosen suggestion.',
            height: 300,
            code: `const host = document.createElement('div');
host.style.maxWidth = '360px';
root.append(host);
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;color:var(--chill-text)';
root.append(out);
const search = ChillSearch.init(host, {
  placeholder: 'Search countries...',
  debounce: 100,
  suggestions: ['Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Denmark', 'Finland', 'France', 'Germany', 'Japan'],
  onSelect: (s) => { out.textContent = 'You picked: ' + s; },
});
cleanup(() => search.destroy());`,
        },
        {
            id: 'objects-icons',
            title: 'Rich suggestions with icons',
            description: 'Use `{ label, icon, value }` objects. The `icon` is plain text (an emoji or a letter); keep your own id in `value` and read it back in `onSelect`.',
            height: 300,
            code: `const host = document.createElement('div');
host.style.maxWidth = '380px';
root.append(host);
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;color:var(--chill-text)';
root.append(out);
const search = ChillSearch.init(host, {
  placeholder: 'Jump to...',
  size: 'lg',
  debounce: 0,
  suggestions: [
    { label: 'Dashboard', icon: '▦', value: '/dashboard' },
    { label: 'Billing settings', icon: '$', value: '/billing' },
    { label: 'Team members', icon: '☺', value: '/team' },
    { label: 'API keys', icon: '⚿', value: '/keys' },
    { label: 'Audit log', icon: '☰', value: '/audit' },
  ],
  onSelect: (s) => { out.textContent = 'Navigate to ' + s.value; },
});
cleanup(() => search.destroy());`,
        },
        {
            id: 'async',
            title: 'Async source with shortcut',
            description: '`getSuggestions` may return a promise. A spinner shows while it is pending, and older responses that arrive late are ignored. `shortcut: \'Ctrl K\'` also binds Ctrl/Cmd+K.',
            height: 320,
            code: `const catalog = ['React', 'Redux', 'Remix', 'Rollup', 'Rust', 'Svelte', 'SolidJS', 'Storybook', 'Tailwind', 'TypeScript', 'Vite', 'Vue'];
const host = document.createElement('div');
host.style.maxWidth = '380px';
root.append(host);
const search = ChillSearch.init(host, {
  placeholder: 'Search packages...',
  shortcut: 'Ctrl K',
  debounce: 200,
  noResultsText: 'No packages match your search',
  getSuggestions: async (q) => {
    await new Promise((r) => setTimeout(r, 400));          // pretend network latency
    return q ? catalog.filter((n) => n.toLowerCase().includes(q.toLowerCase())).map((n) => ({ label: n, value: n.toLowerCase() })) : [];
  },
  onSelect: (s) => console.log('selected', s.value),
});
cleanup(() => search.destroy());`,
        },
        {
            id: 'create-detached',
            title: 'Detached box and programmatic use',
            description: '`ChillSearch.create(options)` builds the box without replacing anything: append `instance.container` yourself. Press Enter with no suggestion highlighted to trigger `onSearch`.',
            height: 200,
            code: `const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;align-items:center;max-width:460px';
const search = ChillSearch.create({
  placeholder: 'Search the docs, press Enter',
  suggestions: ['Installation', 'Theming', 'Accessibility', 'Server-side rendering'],
  onSearch: (q) => { result.textContent = 'Full search for "' + q + '"'; },
  onChange: (v) => { if (!v) result.textContent = ''; },
});
search.container.style.flex = '1';
const fill = document.createElement('button');
fill.textContent = 'Fill "theme"';
fill.onclick = () => { search.setValue('theme'); search.focus(); };
const result = document.createElement('p');
result.style.cssText = 'font-size:13px;color:var(--chill-text)';
bar.append(search.container, fill);
root.append(bar, result);
cleanup(() => search.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Mounting: init vs create',
            body:
                '- **`ChillSearch.init(target, options)`** takes a selector or element and **replaces it** with the search box (destroy puts it back). Use a placeholder `<div>`.\n' +
                '- **`ChillSearch.create(options)`** builds a detached instance. Append `instance.container` wherever you want; `destroy()` removes it.\n\n' +
                'Both return an instance with `container` (the wrapper) and `input` (the `<input>`), so you can add classes, `name` attributes or extra listeners.',
        },
        {
            title: 'Suggestion sources',
            body:
                'A **static** list filters on every keystroke after the `debounce` delay (default 300 ms, `0` = immediate). Entries are strings or `{ label, icon?, iconHtml?, value? }`.\n\n' +
                'A **dynamic** source overrides the static list: `getSuggestions(query)` returns an array or a promise of one. The spinner shows while it is pending, a rejected promise yields an empty list, ' +
                'and only the latest request may update the UI. An empty query is passed through, so return `[]` for it if you do not want suggestions on focus.\n\n' +
                'Choosing a suggestion fills the input with its `label`, closes the list and calls `onSelect(suggestion)` with the original string or object.',
        },
        {
            title: 'Callbacks and keyboard',
            body:
                '`onChange(value)` fires on every input, selection and clear. `onSelect(suggestion)` fires when a suggestion is chosen. ' +
                '`onSearch(query)` fires when the user presses **Enter** without a highlighted suggestion; use it for "search for this text" behaviour.\n\n' +
                'ArrowDown / ArrowUp open the list and move the highlight (wrapping), Home / End jump to the first or last, Enter picks the highlighted item, and Escape closes the list. ' +
                'Clicking outside also closes it. With `shortcut` set, Ctrl or Cmd + K focuses the field from anywhere on the page.',
        },
    ],
    options: [
        { name: 'placeholder', type: 'string', default: "'Search...'", description: 'Input placeholder.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'debounce', type: 'number', default: '300', description: 'Milliseconds to wait after typing before filtering. `0` filters immediately.' },
        { name: 'suggestions', type: '(string | Suggestion)[]', default: '[]', description: 'Static list, filtered by case-insensitive substring match on the label.' },
        { name: 'suggestions[].label', type: 'string', default: '-', description: 'Text shown and written to the input on select.' },
        { name: 'suggestions[].icon', type: 'string', default: 'undefined', description: 'Plain-text icon shown before the label.' },
        { name: 'suggestions[].iconHtml', type: 'string', default: 'undefined', description: 'Trusted HTML icon (for example inline SVG). You must sanitise it. Takes precedence over `icon`.' },
        { name: 'suggestions[].value', type: 'any', default: 'undefined', description: 'Your own payload, handed back in `onSelect`.' },
        { name: 'getSuggestions', type: '(query: string) => Suggestion[] | Promise<Suggestion[]>', default: 'null', description: 'Dynamic source. Overrides `suggestions`; stale responses are discarded.' },
        { name: 'shortcut', type: 'string', default: 'null', description: 'Label shown in the field (for example `\'Ctrl K\'`). Setting it also binds Ctrl/Cmd+K to focus the input.' },
        { name: 'showClear', type: 'boolean', default: 'true', description: 'Show the clear button when there is text.' },
        { name: 'ariaLabel', type: 'string', default: "'Search'", description: 'Accessible name of the input; the listbox is named "<label> suggestions".' },
        { name: 'noResultsText', type: 'string', default: "'No results found'", description: 'Message when a query has no suggestions.' },
        { name: 'onSearch', type: '(query: string) => void', default: 'null', description: 'Called on Enter when no suggestion is highlighted.' },
        { name: 'onSelect', type: '(suggestion) => void', default: 'null', description: 'Called when a suggestion is chosen (the original string or object).' },
        { name: 'onChange', type: '(value: string) => void', default: 'null', description: 'Called when the text changes, a suggestion is chosen or the field is cleared.' },
    ],
    methods: [
        { signature: 'ChillSearch.init(target, options)', on: 'static', description: 'Replace `target` (selector or element) with a search box. Returns an instance.' },
        { signature: 'ChillSearch.create(options)', on: 'static', description: 'Build a detached search box; append `instance.container` yourself.' },
        { signature: 'ChillSearch.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current text.' },
        { signature: 'instance.setValue(value)', description: 'Set the text without triggering a search or callbacks.' },
        { signature: 'instance.clear()', description: 'Empty the field, close the list, focus the input and call `onChange(\'\')`.' },
        { signature: 'instance.focus()', description: 'Focus the input.' },
        { signature: 'instance.search()', description: 'Run the suggestion lookup now for the current text. Returns a promise.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element (or remove the box).' },
        { signature: 'instance.container / instance.input', description: 'Properties: the wrapper element and the `<input>`.' },
    ],
    cssVars: [
        { name: '--chillsearch-bg / --chillsearch-text', description: 'Field and list surface and text colours.' },
        { name: '--chillsearch-text-muted', description: 'Placeholder, icon and shortcut colour.' },
        { name: '--chillsearch-border', description: 'Field and list borders.' },
        { name: '--chillsearch-focus', description: 'Focus ring and highlighted-match colour.' },
        { name: '--chillsearch-hover', description: 'Hovered and active suggestion background.' },
    ],
    a11y: [
        'The input is a combobox (`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) controlling a `role="listbox"` of `role="option"` items.',
        'ArrowDown / ArrowUp move the highlight and wrap, Home / End jump, Enter selects, Escape closes; focus stays in the input while browsing options.',
        'A polite live region announces "N suggestions available" or the no-results text; the box sets `aria-busy` while loading.',
        'The clear button has `aria-label="Clear search"`; icons are `aria-hidden`. Set `ariaLabel` to describe what is being searched.',
        'Spinner and transitions are slowed or removed under `prefers-reduced-motion`.',
    ],
    tips: [
        'Use a placeholder element with `init`: it is replaced. If the selector matches nothing, or the element has no parent, the box is built but never attached to the page.',
        'The instance registers document-level listeners (outside click and, with `shortcut`, Ctrl/Cmd+K): always call `destroy()` when removing it.',
        'For large lists, prefer `getSuggestions` and slice the results yourself: every suggestion becomes a DOM row.',
        'The clear button closes the list without calling your source, but deleting the text by hand calls `getSuggestions(\'\')`: return `[]` for an empty query if you do not want a list then.',
        'In React, call `create()` in an effect and append `instance.container` to a ref; `destroy()` in the cleanup.',
    ],
    related: ['table', 'pagination', 'autocomplete', 'input'],
    keywords: ['autocomplete', 'typeahead', 'combobox', 'command palette', 'filter', 'suggestions', 'find'],
};

export default doc;
