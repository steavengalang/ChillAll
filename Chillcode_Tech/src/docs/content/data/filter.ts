import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'filter',
    global: 'ChillFilter',
    category: 'data',
    title: 'Filter',
    summary: 'Multi-select filter bar with checkbox dropdowns, count badges, removable tags and clear actions.',
    style: 'create',
    description:
        'ChillFilter renders a row of dropdown buttons, one per filter group, each holding a list of checkbox options. Selected values show up as a badge on the button and as removable tags underneath, and `onChange` hands you the full selection every time it changes.\n\n' +
        'The component only manages the **UI and the selected values**; applying them to your data (a product list, a table, a server query) is up to you, usually inside `onChange`. ' +
        'Use `ChillFilter.create(options)` to get a detached instance (append `instance.container`) or `ChillFilter.init(target, options)` to replace an element already in the DOM. Labels are text unless you opt in with `html: true`.',
    features: [
        'Any number of filter groups, each a checkbox dropdown with optional option counts',
        'Badge with the number of selected values and removable tags for every active choice',
        'Per-group and global clearing with `onChange(values)` on every change',
        'Programmatic control with `setValues()`, `getValues()` and `clear()`',
        'Keyboard and screen-reader friendly: Escape closes, live region announces the active filter count',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic filter bar',
            description: 'Define groups with a `key`, a `label` and `options`. `onChange` receives an object mapping each key to its selected values (as strings).',
            height: 260,
            code: `const out = document.createElement('p');
out.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text)';
out.textContent = 'Nothing selected';
const f = ChillFilter.create({
  filters: [
    { key: 'color', label: 'Color', options: [{ value: 'red', label: 'Red' }, { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' }] },
    { key: 'size', label: 'Size', options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }, { value: 'l', label: 'Large' }] },
  ],
  onChange: (values) => { out.textContent = JSON.stringify(values); },
});
root.append(f.container, out);
cleanup(() => f.destroy());`,
        },
        {
            id: 'filter-list',
            title: 'Filtering real data',
            description: 'Use `onChange` to re-render your list. Empty groups mean "no restriction". Option `count` is a display-only hint.',
            height: 340,
            code: `const products = [
  { name: 'Trail Runner', brand: 'Nike', type: 'shoes' }, { name: 'Wool Beanie', brand: 'Patagonia', type: 'hats' },
  { name: 'Road Racer', brand: 'Adidas', type: 'shoes' }, { name: 'Sun Cap', brand: 'Nike', type: 'hats' },
  { name: 'Rain Shell', brand: 'Patagonia', type: 'jackets' }, { name: 'Windbreaker', brand: 'Adidas', type: 'jackets' },
];
const list = document.createElement('ul');
list.style.cssText = 'margin:12px 0 0;padding-left:18px;color:var(--chill-text);font-size:14px';
const render = (v) => {
  list.innerHTML = '';
  products
    .filter((p) => (!v.brand || !v.brand.length || v.brand.includes(p.brand)) && (!v.type || !v.type.length || v.type.includes(p.type)))
    .forEach((p) => { const li = document.createElement('li'); li.textContent = p.name + ' (' + p.brand + ')'; list.append(li); });
};
const opts = (key) => [...new Set(products.map((p) => p[key]))].map((v) => ({ value: v, label: v, count: products.filter((p) => p[key] === v).length }));
const f = ChillFilter.create({
  filters: [{ key: 'brand', label: 'Brand', options: opts('brand') }, { key: 'type', label: 'Type', options: opts('type') }],
  onChange: render,
});
render({});
root.append(f.container, list);
cleanup(() => f.destroy());`,
        },
        {
            id: 'presets',
            title: 'Preselected values and icons',
            description: 'Pass `values` to start with a selection and `icon` to decorate a group button. Call `setValues()` to replace the selection later (it does not fire `onChange`).',
            height: 280,
            code: `const f = ChillFilter.create({
  filters: [
    { key: 'status', label: 'Status', icon: '●', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'draft', label: 'Draft' }] },
    { key: 'owner', label: 'Owner', icon: '👤', options: [{ value: 'me', label: 'Me' }, { value: 'team', label: 'My team' }] },
  ],
  values: { status: ['open', 'draft'], owner: ['me'] },
});
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:12px';
const mine = ChillButton.create({ text: 'Only mine', size: 'sm', variant: 'outline' });
const all = ChillButton.create({ text: 'Clear all', size: 'sm', variant: 'ghost' });
mine.onclick = () => f.setValues({ owner: ['me'] });
all.onclick = () => f.clear();
row.append(mine, all);
root.append(f.container, row);
cleanup(() => f.destroy());`,
        },
        {
            id: 'no-tags',
            title: 'Compact mode and custom labels',
            description: 'Hide the tag row with `showTags: false`, rename the per-group clear button with `clearLabel` and give the group an `ariaLabel`.',
            height: 240,
            code: `const f = ChillFilter.create({
  showTags: false,
  clearLabel: 'Reset',
  ariaLabel: 'Event filters',
  filters: [
    { key: 'day', label: 'Day', options: [{ value: 'sat', label: 'Saturday' }, { value: 'sun', label: 'Sunday' }] },
    { key: 'cat', label: 'Category', options: [{ value: 'music', label: 'Music' }, { value: 'food', label: 'Food' }, { value: 'art', label: 'Art' }] },
  ],
});
root.append(f.container);
cleanup(() => f.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`ChillFilter.create(options)`** builds a detached instance. Append `instance.container` wherever you like.\n' +
                '- **`ChillFilter.init(target, options)`** takes a selector or element that is already in the DOM and replaces it with the filter bar; `destroy()` puts it back.\n\n' +
                'Both return an instance with `getValues()`, `setValues()`, `clear()` and `destroy()`.',
        },
        {
            title: 'Working with values',
            body:
                'Values are always an object of arrays of **strings**, even if your option values are numbers: `{ size: ["1", "2"] }`. Compare accordingly in your filtering code (`String(item.size)`). ' +
                '`onChange` fires for user interaction and for `clear()`, but not for `setValues()` or the initial `values`, so call your own filter function once after creating the component.\n\n' +
                'Keys that do not match a configured filter, and values that match no option, are ignored in the tag row.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillfilter-active: #7c3aed;\n  --chillfilter-active-bg: #f5f3ff;\n  --chillfilter-border: #d4d4d8;\n}\n```\n\nDark mode follows the OS preference, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'filters', type: 'Filter[]', default: '[]', description: 'The filter groups.' },
        { name: 'filters[].key', type: 'string', default: '-', description: 'Unique key of the group; used in `values` and `onChange`.' },
        { name: 'filters[].label', type: 'string', default: '-', description: 'Button and menu title (text unless `html`).' },
        { name: 'filters[].icon', type: 'string', default: 'undefined', description: 'Optional icon shown before the label (text unless `html`).' },
        { name: 'filters[].options', type: '{ value, label, count? }[]', default: '[]', description: 'Checkbox options. `count` is displayed next to the label.' },
        { name: 'values', type: 'Record<string, (string | number)[]>', default: '{}', description: 'Initial selection by group key.' },
        { name: 'showTags', type: 'boolean', default: 'true', description: 'Show removable tags for active selections.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat labels and icons as HTML (trusted markup only).' },
        { name: 'ariaLabel', type: 'string', default: "'Filters'", description: 'Accessible name of the filter group.' },
        { name: 'clearLabel', type: 'string', default: "'Clear'", description: 'Text of the per-group clear button.' },
        { name: 'onChange', type: '(values: Record<string, string[]>) => void', default: 'null', description: 'Called after every selection change with the current selection object.' },
    ],
    methods: [
        { signature: 'ChillFilter.create(options)', on: 'static', description: 'Create a detached instance; append `instance.container`.' },
        { signature: 'ChillFilter.init(target, options)', on: 'static', description: 'Replace an element (selector or node) with the filter bar and return an instance.' },
        { signature: 'ChillFilter.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.container', description: 'The root element.' },
        { signature: 'instance.getValues()', description: 'Current selection as `{ key: string[] }`.' },
        { signature: 'instance.setValues(values)', description: 'Replace the selection and re-render (does not call `onChange`).' },
        { signature: 'instance.clear()', description: 'Clear every selection, re-render and call `onChange`.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element (restores the original for `init`).' },
    ],
    cssVars: [
        { name: '--chillfilter-active / --chillfilter-active-bg', description: 'Accent colour of badges, checked boxes and tags.' },
        { name: '--chillfilter-bg / --chillfilter-text', description: 'Button and menu surface and text.' },
        { name: '--chillfilter-text-muted', description: 'Counts and secondary text.' },
        { name: '--chillfilter-border / --chillfilter-hover', description: 'Borders and hover background.' },
    ],
    a11y: [
        'The bar is a `role="group"` with `ariaLabel`; each button has `aria-haspopup`, `aria-expanded` and `aria-controls`.',
        'Options are real checkboxes in a labelled group, so Space toggles them; Escape closes the open menu and returns focus to its button.',
        'Tag remove buttons have `aria-label="Remove filter ..."`; a polite live region announces how many filters are active.',
    ],
    tips: [
        'Only one menu is open at a time; clicking outside closes it.',
        'For server-side filtering, debounce your request inside `onChange`.',
        'In React/Vue, create in an effect, append `container` to a ref and call `destroy()` on cleanup.',
    ],
    related: ['sort', 'autocomplete', 'select', 'infinitescroll'],
    keywords: ['facets', 'checkbox', 'multi-select', 'refine', 'search filters', 'tags'],
};

export default doc;
