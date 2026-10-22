import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'table',
    global: 'ChillTable',
    category: 'core',
    title: 'Table',
    summary: 'Data table with search, sorting, pagination, row selection, sticky header and CSV export.',
    style: 'create',
    description:
        'ChillTable renders an array of row objects into an accessible, client-side data table. Describe the `columns`, pass the `data`, and you get a search box, sortable headers, pagination, ' +
        'optional checkbox selection and CSV export, with no framework required.\n\n' +
        'Cell values are inserted as **text** by default, so untrusted data cannot inject markup. A column `render()` can return a string (still text), a DOM node, or HTML if you opt in with `html: true`. ' +
        'CSV export neutralises spreadsheet formula injection (`=`, `+`, `@` prefixes).',
    features: [
        'Client-side search across all columns, multi-type sorting (numbers, dates, text) and pagination',
        'Row selection with select-all for the current page and a `getSelected()` helper',
        'Custom cell rendering with DOM nodes, plus `sortValue` / `exportValue` per column',
        'Sticky header with a scrollable body, striped rows and a hidden or visible caption',
        'CSV export with an optional download button',
        'Accessible: real `<table>`, `scope="col"`, `aria-sort`, labelled controls and a live item count',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Search, sort and paginate',
            description: 'The minimum: columns and data. Click a header to sort, type in the box to filter. Pages appear once rows exceed `pageSize`.',
            height: 420,
            code: `const people = [
  ['Ada Lovelace', 'Engineering', 'London', 36], ['Grace Hopper', 'Engineering', 'New York', 45],
  ['Alan Turing', 'Research', 'Manchester', 41], ['Katherine Johnson', 'Research', 'Hampton', 38],
  ['Margaret Hamilton', 'Engineering', 'Boston', 33], ['Linus Torvalds', 'Open Source', 'Portland', 29],
  ['Barbara Liskov', 'Research', 'Cambridge', 52], ['Dennis Ritchie', 'Engineering', 'New Jersey', 47],
].map(([name, team, city, age]) => ({ name, team, city, age }));
const table = ChillTable.create(root, {
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'team', label: 'Team' },
    { key: 'city', label: 'City' },
    { key: 'age', label: 'Age', align: 'right' },
  ],
  data: people,
  pageSize: 5,
  caption: 'Team directory',
});
cleanup(() => table.destroy());`,
        },
        {
            id: 'custom-render',
            title: 'Custom cells',
            description: '`render(value, row)` may return text or a DOM node. Use `sortValue` so a formatted column still sorts by its raw value.',
            height: 340,
            code: `const orders = [
  { id: 'A-1042', customer: 'Northwind', total: 1280.5, status: 'paid' },
  { id: 'A-1043', customer: 'Globex', total: 349, status: 'pending' },
  { id: 'A-1044', customer: 'Initech', total: 9720.25, status: 'refunded' },
  { id: 'A-1045', customer: 'Umbrella', total: 58.9, status: 'paid' },
];
const colors = { paid: '#16a34a', pending: '#d97706', refunded: '#dc2626' };
const table = ChillTable.create(root, {
  columns: [
    { key: 'id', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', align: 'right',
      render: (v) => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      sortValue: (v) => v },
    { key: 'status', label: 'Status', render: (v) => {
        const badge = document.createElement('span');
        badge.textContent = v;
        badge.style.cssText = 'padding:2px 8px;border-radius:999px;font-size:12px;color:#fff;background:' + colors[v];
        return badge;
    } },
  ],
  data: orders,
  searchPlaceholder: 'Search orders...',
});
cleanup(() => table.destroy());`,
        },
        {
            id: 'selection',
            title: 'Row selection',
            description: 'Set `selectable: true` for a checkbox column. `onSelect` (or `table.on(\'select\', fn)`) receives the selected row objects across all pages.',
            height: 400,
            code: `const files = Array.from({ length: 12 }, (_, i) => ({
  name: 'invoice-' + String(i + 1).padStart(3, '0') + '.pdf',
  size: Math.round(40 + ((i * 37) % 200)),
  owner: ['Mia', 'Noah', 'Zoe'][i % 3],
}));
const info = document.createElement('p');
info.style.cssText = 'margin:8px 0 0;font-size:13px;color:var(--chill-text)';
info.textContent = 'Nothing selected';
const table = ChillTable.create(root, {
  columns: [
    { key: 'name', label: 'File' },
    { key: 'size', label: 'Size (KB)', align: 'right' },
    { key: 'owner', label: 'Owner' },
  ],
  data: files,
  pageSize: 5,
  selectable: true,
  onSelect: (rows) => {
    info.textContent = rows.length ? rows.length + ' selected: ' + rows.map((r) => r.name).join(', ') : 'Nothing selected';
  },
});
root.append(info);
cleanup(() => table.destroy());`,
        },
        {
            id: 'sticky-export',
            title: 'Sticky header and CSV export',
            description: '`stickyHeader` with `maxHeight` keeps the header visible while the body scrolls. `exportButton` adds a download button; `exportCSV()` returns the CSV string.',
            height: 380,
            code: `const rows = Array.from({ length: 30 }, (_, i) => ({
  sku: 'SKU-' + (1000 + i),
  product: ['Notebook', 'Desk lamp', 'Headphones', 'Monitor arm'][i % 4],
  stock: (i * 7) % 50,
}));
const table = ChillTable.create(root, {
  columns: [
    { key: 'sku', label: 'SKU' },
    { key: 'product', label: 'Product' },
    { key: 'stock', label: 'In stock', align: 'right' },
  ],
  data: rows,
  pageSize: 30,
  stickyHeader: true,
  maxHeight: '260px',
  exportButton: true,
  exportFilename: 'inventory.csv',
});
console.log(table.exportCSV().split('\\r\\n').slice(0, 3));
cleanup(() => table.destroy());`,
        },
        {
            id: 'live-data',
            title: 'Programmatic control and live data',
            description: 'Swap data with `setData()`, drive sorting and search from your own UI, and listen to events for analytics or URL sync.',
            height: 420,
            code: `const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap';
const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; bar.append(b); };
const host = document.createElement('div');
root.append(bar, host);
const make = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, city: ['Oslo', 'Lima', 'Kyoto', 'Cairo'][i % 4], temp: 10 + ((i * 13) % 25) }));
const table = ChillTable.create(host, {
  columns: [{ key: 'id', label: '#' }, { key: 'city', label: 'City' }, { key: 'temp', label: 'Temp (C)', align: 'right' }],
  data: make(8), pageSize: 4, emptyText: 'No readings yet',
});
table.on('sort', (key, dir) => console.log('sorted by', key, dir));
mk('Hottest first', () => table.sortBy('temp', 'desc'));
mk('Only Kyoto', () => table.search('Kyoto'));
mk('Reload 20 rows', () => table.setData(make(20)));
mk('Clear', () => { table.search(''); table.setData([]); });
cleanup(() => table.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Columns and rendering',
            body:
                'Each column needs a `key` (the property read from each row). Everything else is optional.\n\n' +
                '- **`render(value, row)`** returns a string (inserted as text), a DOM node (appended), or HTML when the column sets `html: true`. Only opt in to `html` for markup you control.\n' +
                '- **`sortValue(value, row)`** gives the value used for sorting. **`exportValue(value, row)`** gives the value written to CSV. Use them when `render` formats the cell.\n' +
                '- **`sortable: false`** removes sorting from one column; the top-level `sortable: false` removes it from all of them.\n' +
                '- **`align`** accepts `\'left\'` (default), `\'center\'` or `\'right\'`.\n\n' +
                'Sorting handles numbers, dates, booleans and strings (natural, case-insensitive order). `null` and `undefined` always sort last.',
        },
        {
            title: 'Search, pages and selection',
            body:
                'Search is a case-insensitive substring match over every column\'s raw value, and resets to page 1. Selection works on the **row objects** you passed in: `getSelected()` returns those same objects, ' +
                'so a selection survives sorting, searching and paging. The header checkbox selects or clears the rows on the **current page**; `selectAll()` selects every row that matches the current search.\n\n' +
                '`setData()` replaces the rows, returns to page 1, and drops selected rows that no longer exist. Use it for refreshes and server-side results (pagination itself is client-side).',
        },
        {
            title: 'Events and export',
            body:
                'Subscribe with `table.on(event, fn)` (and `off`) or pass the matching option: `select` (`onSelect`), `sort` (`onSort`), `page` (`onPageChange`) and `search` (`onSearch`).\n\n' +
                '```js\ntable.on(\'sort\', (key, direction) => history.replaceState(null, \'\', \'?sort=\' + key + \'.\' + direction));\n```\n\n' +
                '`exportCSV({ all, download, filename })` returns the CSV text. `all` (default `true`) exports every filtered row, `false` only the current page. With `download: true` a file is saved with a UTF-8 BOM so Excel opens it correctly.',
        },
    ],
    options: [
        { name: 'columns', type: 'Column[]', default: '[]', description: 'Column definitions, in display order.' },
        { name: 'columns[].key', type: 'string', default: '-', description: 'Row property to display, sort and export.' },
        { name: 'columns[].label', type: 'string', default: 'key', description: 'Header text.' },
        { name: 'columns[].render', type: '(value, row) => string | Node', default: 'null', description: 'Custom cell content. Strings are text unless `html: true`.' },
        { name: 'columns[].html', type: 'boolean', default: 'false', description: 'Insert the cell (or `render` string) as HTML. You must sanitise it.' },
        { name: 'columns[].sortable', type: 'boolean', default: 'true', description: 'Set `false` to disable sorting for this column.' },
        { name: 'columns[].align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Text alignment of header and cells.' },
        { name: 'columns[].sortValue', type: '(value, row) => any', default: 'null', description: 'Value to sort by instead of the raw cell value.' },
        { name: 'columns[].exportValue', type: '(value, row) => any', default: 'null', description: 'Value written to CSV instead of the raw cell value.' },
        { name: 'data', type: 'object[]', default: '[]', description: 'Row objects.' },
        { name: 'pageSize', type: 'number', default: '10', description: 'Rows per page (minimum 1).' },
        { name: 'searchable', type: 'boolean', default: 'true', description: 'Show the search box.' },
        { name: 'searchPlaceholder', type: 'string', default: "'Search...'", description: 'Placeholder, also the input\'s accessible name.' },
        { name: 'sortable', type: 'boolean', default: 'true', description: 'Enable sorting globally.' },
        { name: 'striped', type: 'boolean', default: 'true', description: 'Alternate row backgrounds.' },
        { name: 'selectable', type: 'boolean', default: 'false', description: 'Add a checkbox column with a select-all-on-page header.' },
        { name: 'emptyText', type: 'string', default: "'No data available'", description: 'Message when there are no rows (or no matches).' },
        { name: 'caption', type: 'string', default: 'null', description: 'Renders a `<caption>`.' },
        { name: 'captionHidden', type: 'boolean', default: 'false', description: 'Make the caption visually hidden but available to screen readers.' },
        { name: 'ariaLabel', type: 'string', default: 'null', description: 'Accessible name of the table when there is no caption.' },
        { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pin the header while the body scrolls.' },
        { name: 'maxHeight', type: 'string', default: "'400px'", description: 'Scroll area height when `stickyHeader` is on.' },
        { name: 'exportButton', type: 'boolean', default: 'false', description: 'Show an "Export CSV" button in the toolbar.' },
        { name: 'exportFilename', type: 'string', default: "'table.csv'", description: 'Default file name for downloads.' },
        { name: 'onSelect', type: '(rows: object[]) => void', default: 'null', description: 'Called when the selection changes.' },
        { name: 'onSort', type: '(key: string, direction: "asc" | "desc") => void', default: 'null', description: 'Called after sorting.' },
        { name: 'onPageChange', type: '(page: number) => void', default: 'null', description: 'Called when the page changes.' },
        { name: 'onSearch', type: '(query: string) => void', default: 'null', description: 'Called after a search.' },
    ],
    methods: [
        { signature: 'ChillTable.create(container, options)', on: 'static', description: '`container` is a selector or element (its content is replaced). Returns an instance.' },
        { signature: 'ChillTable.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.setData(rows)', description: 'Replace the data, go to page 1 and keep search and sort applied.' },
        { signature: 'instance.refresh()', description: 'Re-render, for example after mutating row objects in place.' },
        { signature: 'instance.setPage(page)', description: 'Go to a page (clamped to the valid range).' },
        { signature: 'instance.sortBy(key, direction)', description: 'Sort by a column; `direction` is `\'asc\'` or `\'desc\'`.' },
        { signature: 'instance.search(query)', description: 'Set the search query (also updates the input).' },
        { signature: 'instance.getSelected()', description: 'Array of selected row objects.' },
        { signature: 'instance.selectAll() / clearSelection()', description: 'Select every filtered row, or clear the selection.' },
        { signature: 'instance.exportCSV({ all, download, filename })', description: 'Return the CSV string; optionally trigger a file download.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event handler. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Remove the table and its listeners.' },
    ],
    events: [
        { name: 'select', payload: 'rows: object[]', description: 'The selection changed.' },
        { name: 'sort', payload: 'key: string, direction: "asc" | "desc"', description: 'A column was sorted.' },
        { name: 'page', payload: 'page: number', description: 'The current page changed.' },
        { name: 'search', payload: 'query: string', description: 'The search query changed.' },
    ],
    cssVars: [
        { name: '--chilltable-bg / --chilltable-text / --chilltable-text-light', description: 'Surface and text colours.' },
        { name: '--chilltable-border', description: 'Container, row and control borders.' },
        { name: '--chilltable-stripe / --chilltable-hover', description: 'Striped row, header and hover backgrounds.' },
        { name: '--chilltable-primary', description: 'Focus ring, checkbox and active page colour.' },
        { name: '--chilltable-selected', description: 'Background of selected rows.' },
    ],
    a11y: [
        'Renders a native `<table>` with `<th scope="col">`; sortable headers contain a real `<button>` and expose `aria-sort`.',
        'Search input, select-all (`Select all rows on this page`) and row checkboxes have accessible names; the item count is a polite live region.',
        'Pagination is a `<nav aria-label="Table pagination">` with `aria-current="page"` on the active page; focus stays on the control after a re-render.',
        'Provide a `caption` (optionally `captionHidden`) or an `ariaLabel` so the table has a name.',
        'Animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'The table is fully client-side. For very large or server-paged datasets, load a page and call `setData()` yourself.',
        'Selection and sorting are tied to row object identity: pass stable objects, and call `refresh()` after mutating a row in place.',
        'If you build cells with `render` and `html: true`, sanitise every interpolated value. Prefer returning a DOM node.',
        'In React, create the instance in an effect on a ref, call `setData()` when props change, and `destroy()` on cleanup.',
        'SSR-safe: nothing touches the DOM until `create()` is called with a container.',
    ],
    related: ['pagination', 'search', 'chart'],
    keywords: ['datagrid', 'grid', 'sort', 'filter', 'csv', 'rows', 'spreadsheet', 'data table'],
};

export default doc;
