import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'sort',
    global: 'ChillSort',
    category: 'data',
    title: 'Sort',
    summary: 'Sort-by dropdown with an ascending/descending toggle, plus inline sortable column headers.',
    style: 'create',
    description:
        'ChillSort is the control you put above a list or table: a labelled "Sort by" dropdown (an accessible listbox) and a button that flips the direction. ' +
        'It reports `{ value, direction }` through `onChange`; sorting the data itself is up to you, which keeps it working with local arrays, tables and server queries alike.\n\n' +
        'For table headers use `ChillSort.createInline()`, which makes a single sortable button; buttons that share a parent behave like a radio group. ' +
        'Use `ChillSort.create(options)` for a detached instance or `ChillSort.init(target, options)` to replace an element in the DOM. Labels are text unless `html: true`.',
    features: [
        'Accessible listbox dropdown with arrow keys, Home / End, Enter and Escape',
        'Ascending / descending toggle button (`aria-pressed`) and a live-region announcement',
        'Optional visible label, or hide the label and the direction button',
        'Inline sortable header buttons for tables that sync their active state',
        '`getValue()` and `setValue()` for programmatic control',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Sort a list',
            description: 'Pick a field and flip the direction. `onChange` gives you `{ value, direction }` to re-sort your array.',
            height: 300,
            code: `const people = [
  { name: 'Maria', age: 34, city: 'Lisbon' }, { name: 'Ken', age: 27, city: 'Osaka' },
  { name: 'Aisha', age: 41, city: 'Cairo' }, { name: 'Tom', age: 22, city: 'Leeds' },
];
const list = document.createElement('ul');
list.style.cssText = 'margin:12px 0 0;padding-left:18px;color:var(--chill-text);font-size:14px';
const render = ({ value, direction }) => {
  const sorted = [...people].sort((a, b) => (a[value] > b[value] ? 1 : -1) * (direction === 'asc' ? 1 : -1));
  list.innerHTML = '';
  sorted.forEach((p) => { const li = document.createElement('li'); li.textContent = p.name + ', ' + p.age + ', ' + p.city; list.append(li); });
};
const s = ChillSort.create({
  options: [{ value: 'name', label: 'Name' }, { value: 'age', label: 'Age' }, { value: 'city', label: 'City' }],
  value: 'name',
  onChange: render,
});
render(s.getValue());
root.append(s.container, list);
cleanup(() => s.destroy());`,
        },
        {
            id: 'options',
            title: 'Label, direction and defaults',
            description: 'Start in `desc`, rename the label, or hide the label and direction button with `showLabel` / `showDirection`.',
            height: 260,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const shared = [{ value: 'new', label: 'Newest' }, { value: 'price', label: 'Price' }, { value: 'rating', label: 'Rating' }];
const a = ChillSort.create({ options: shared, value: 'price', direction: 'desc', label: 'Order by' });
const b = ChillSort.create({ options: shared, value: 'rating', showLabel: false, showDirection: false });
root.append(a.container, b.container);
cleanup(() => { a.destroy(); b.destroy(); });`,
        },
        {
            id: 'inline',
            title: 'Sortable table headers',
            description: '`createInline` returns a header button. Clicking an inactive one activates it and deactivates the others in the same parent; clicking the active one toggles the direction.',
            height: 280,
            code: `const rows = [['Atlas', 12, 4.8], ['Borealis', 7, 4.1], ['Cygnus', 31, 3.9], ['Draco', 18, 4.6]];
const head = document.createElement('div');
head.style.cssText = 'display:flex;gap:16px;margin-bottom:8px';
const body = document.createElement('ul');
body.style.cssText = 'margin:0;padding-left:18px;color:var(--chill-text);font-size:14px';
const cols = ['Name', 'Orders', 'Rating'];
const draw = (idx, dir) => {
  const sorted = [...rows].sort((a, b) => (a[idx] > b[idx] ? 1 : -1) * (dir === 'asc' ? 1 : -1));
  body.innerHTML = '';
  sorted.forEach((r) => { const li = document.createElement('li'); li.textContent = r.join(' | '); body.append(li); });
};
const buttons = cols.map((label, i) => ChillSort.createInline({ label, value: i, active: i === 0, onClick: ({ value, direction }) => draw(value, direction) }));
head.append(...buttons);
draw(0, 'asc');
root.append(head, body);
cleanup(() => buttons.forEach((b) => b.chillsort.destroy()));`,
        },
        {
            id: 'programmatic',
            title: 'Programmatic control',
            description: '`setValue(value, direction?)` updates the control without firing `onChange`, handy for restoring a saved preference.',
            height: 260,
            code: `const out = document.createElement('p');
out.style.cssText = 'font-size:13px;margin:12px 0;color:var(--chill-text)';
const show = (v) => { out.textContent = JSON.stringify(v); };
const s = ChillSort.create({
  options: [{ value: 'date', label: 'Date' }, { value: 'size', label: 'File size' }, { value: 'type', label: 'Type' }],
  value: 'date',
  onChange: show,
});
show(s.getValue());
const btn = ChillButton.create({ text: 'Biggest first', size: 'sm', variant: 'outline' });
btn.onclick = () => { s.setValue('size', 'desc'); show(s.getValue()); };
root.append(s.container, out, btn);
cleanup(() => s.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Dropdown vs inline',
            body:
                'The **dropdown** (`create` / `init`) is a standalone control with its own state: `getValue()` returns `{ value, direction }`.\n\n' +
                'The **inline** button (`createInline`) is meant for table headers. Options: `label`, `value` (echoed back in the callback), `direction` (`"asc"` default), `active`, `html` and `onClick({ value, direction })`. ' +
                'Deactivation of siblings happens within the button\'s parent element, so put all header buttons into the same container. The button has `button.chillsort.getDirection()` and `button.chillsort.destroy()`.',
        },
        {
            title: 'Sorting your data',
            body:
                'ChillSort never touches your data. A typical handler copies and sorts the array, or sends the pair to your API:\n\n' +
                '```js\nChillSort.create({\n  options: [{ value: "price", label: "Price" }],\n  onChange: ({ value, direction }) => load({ sort: value, order: direction }),\n});\n```\n\n' +
                'Option values are compared loosely by string, so `1` and `"1"` match when restoring the selected option.',
        },
    ],
    options: [
        { name: 'options', type: '{ value: string | number, label: string }[]', default: '[]', description: 'Sortable fields shown in the dropdown.' },
        { name: 'value', type: 'string | number', default: 'null', description: 'Initially selected option value. With `null` the button shows "Select".' },
        { name: 'direction', type: "'asc' | 'desc'", default: "'asc'", description: 'Initial direction.' },
        { name: 'label', type: 'string', default: "'Sort by'", description: 'Visible label (a colon is appended) and the listbox name.' },
        { name: 'showLabel', type: 'boolean', default: 'true', description: 'Show the visible label.' },
        { name: 'showDirection', type: 'boolean', default: 'true', description: 'Show the ascending / descending toggle.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat label and option labels as HTML (trusted markup only).' },
        { name: 'onChange', type: '(state: { value, direction }) => void', default: 'null', description: 'Called when the user picks an option or flips the direction.' },
    ],
    methods: [
        { signature: 'ChillSort.create(options)', on: 'static', description: 'Create a detached instance; append `instance.container`.' },
        { signature: 'ChillSort.init(target, options)', on: 'static', description: 'Replace an element (selector or node) with the sort control and return an instance.' },
        { signature: 'ChillSort.createInline(options)', on: 'static', description: 'Create a sortable header button `{ label, value, direction, active, html, onClick }`.' },
        { signature: 'ChillSort.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.container', description: 'The root element.' },
        { signature: 'instance.getValue()', description: 'Returns `{ value, direction }`.' },
        { signature: 'instance.setValue(value, direction?)', description: 'Set the selection (and direction) and re-render without calling `onChange`.' },
        { signature: 'instance.getCurrentOption()', description: 'The selected option object, if any.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element (restores the original for `init`).' },
    ],
    cssVars: [
        { name: '--chillsort-active', description: 'Selected option, focus and active inline header colour.' },
        { name: '--chillsort-bg / --chillsort-text', description: 'Button and menu surface and text.' },
        { name: '--chillsort-text-muted', description: 'Label colour.' },
        { name: '--chillsort-border / --chillsort-hover', description: 'Border and hover background.' },
    ],
    a11y: [
        'The trigger is a button with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`; options have `role="option"` and `aria-selected`.',
        'ArrowDown / ArrowUp open and move, Home / End jump, Enter or Space choose, Escape closes, Tab closes.',
        'The direction button has `aria-pressed` and a title; a polite live region announces "Sorted by ..., ascending/descending". Inline headers use `aria-pressed`.',
    ],
    tips: [
        'Use `setValue` to restore a saved preference, then sort your data once yourself, since it does not trigger `onChange`.',
        'Inline header buttons only deactivate siblings that share their parent element.',
        'Create inside effects in frameworks and call `destroy()` on cleanup to remove the document click listener.',
    ],
    related: ['filter', 'select', 'pagination', 'infinitescroll'],
    keywords: ['order', 'order by', 'ascending', 'descending', 'column header', 'sortable'],
};

export default doc;
