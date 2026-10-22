import type { Guide } from '../types';

const guide: Guide = {
    id: 'recipe-data-table',
    title: 'Recipe: searchable, sortable data table',
    summary: 'A ChillTable with search, sorting, row selection, CSV export and an empty state, then driven by a separate ChillPagination.',
    group: 'Recipes',
    body: `**Goal:** an orders table where users can search, sort by any column, select rows, delete them, export to CSV, and see a friendly message when nothing is left. Then you will take over paging with [ChillPagination](/docs/pagination) so the same table can show server-side pages.

**You will use:** [ChillTable](/docs/table), [ChillButton](/docs/button), [ChillEmptyState](/docs/emptystate) and [ChillPagination](/docs/pagination).

## Step 1: make some realistic data

Rows are plain objects. Keep real types: numbers as numbers, dates as ISO strings, so sorting works correctly.

\`\`\`js
const statuses = ['paid', 'pending', 'refunded'];
const orders = Array.from({ length: 64 }, (_, i) => ({
  id: 'A-' + (1000 + i),
  customer: customers[i % customers.length],
  status: statuses[i % 3],
  total: Math.round((20 + ((i * 7919) % 9800)) * 100) / 100,
  date: new Date(Date.UTC(2026, 0, 1 + ((i * 5) % 270))).toISOString().slice(0, 10)
}));
\`\`\`

## Step 2: define the columns

Each column has a \`key\` (the row property) and a \`label\`. Useful extras:

- \`align: 'right'\` for numbers;
- \`render(value, row)\` returns a string (shown as text) or a DOM node, so you can show a coloured status badge without enabling HTML;
- \`sortValue\` when the displayed text should sort differently from the stored value;
- \`exportValue\` to control what ends up in the CSV;
- \`sortable: false\` for columns that should not sort.

\`\`\`js
const columns = [
  { key: 'id', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status', render: (v) => badge(v) },
  { key: 'total', label: 'Total', align: 'right', render: (v) => '$' + v.toFixed(2) },
  { key: 'date', label: 'Date' }
];
\`\`\`

## Step 3: create the table

\`searchable\`, sorting and pagination are on by default. Add \`selectable: true\` for the checkbox column, \`exportButton: true\` for a built-in "Export CSV" button, \`caption\` (or \`ariaLabel\`) for an accessible name, and \`emptyText\` for the message shown when a search matches nothing.

\`\`\`js
const table = ChillTable.create(host, {
  columns, data: orders, pageSize: 8,
  selectable: true, exportButton: true, exportFilename: 'orders.csv',
  caption: 'Orders', emptyText: 'No orders match your search',
  onSelect: (rows) => updateToolbar(rows.length)
});
\`\`\`

Selection is tracked by row object, so it survives sorting, searching and paging. \`table.getSelected()\` returns the selected row objects.

## Step 4: the complete demo

Search for \`refunded\`, click the **Total** header twice, select a few rows and delete them. Delete everything (or search for something that does not exist) to see both kinds of empty state. The CSV button downloads in a browser; the demo also prints the first lines of the CSV.

\`\`\`live
const customers = ['Northwind', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Industries', 'Wayne Enterprises', 'Acme'];
const statuses = ['paid', 'pending', 'refunded'];
const makeOrders = () => Array.from({ length: 64 }, (_, i) => ({
  id: 'A-' + (1000 + i),
  customer: customers[i % customers.length],
  status: statuses[i % 3],
  total: Math.round((20 + ((i * 7919) % 9800)) * 100) / 100,
  date: new Date(Date.UTC(2026, 0, 1 + ((i * 5) % 270))).toISOString().slice(0, 10)
}));
let orders = makeOrders();

const colors = { paid: '#16a34a', pending: '#d97706', refunded: '#dc2626' };
const badge = (status) => {
  const el = document.createElement('span');
  el.textContent = status;
  el.style.cssText = 'padding:2px 8px;border-radius:999px;font-size:12px;color:#fff;background:' + colors[status];
  return el;
};

const toolbar = document.createElement('div');
toolbar.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;color:var(--chill-text);font-size:13px';
const info = document.createElement('span');
const del = ChillButton.create({ text: 'Delete selected', variant: 'danger', size: 'sm', disabled: true });
const csvBtn = ChillButton.create({ text: 'Download CSV', variant: 'outline', size: 'sm' });
toolbar.append(info, del, csvBtn);

const tableHost = document.createElement('div');
const emptyHost = document.createElement('div');
emptyHost.hidden = true;
root.append(toolbar, tableHost, emptyHost);

const table = ChillTable.create(tableHost, {
  columns: [
    { key: 'id', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', render: (v) => badge(v) },
    { key: 'total', label: 'Total', align: 'right', render: (v) => '$' + v.toFixed(2) },
    { key: 'date', label: 'Date' }
  ],
  data: orders,
  pageSize: 8,
  selectable: true,
  caption: 'Orders',
  emptyText: 'No orders match your search',
  onSelect: (rows) => sync(rows.length)
});

const sync = (n) => {
  info.textContent = orders.length + ' orders, ' + n + ' selected';
  del.setDisabled(n === 0);
};
sync(0);

let empty;
const showEmpty = (on) => {
  tableHost.hidden = on;
  emptyHost.hidden = !on;
  toolbar.hidden = on;
  if (on && !empty) {
    empty = ChillEmptyState.create({
      preset: 'noData',
      title: 'No orders left',
      description: 'You deleted every order in this demo.',
      actions: [{ label: 'Restore sample data', onClick: () => { orders = makeOrders(); table.setData(orders); sync(0); showEmpty(false); } }]
    });
    emptyHost.append(empty);
  }
};

del.addEventListener('click', () => {
  const gone = new Set(table.getSelected());
  orders = orders.filter((o) => !gone.has(o));
  table.setData(orders);
  sync(0);
  ChillNotify.info({ message: gone.size + ' order(s) deleted', duration: 2500 });
  if (!orders.length) showEmpty(true);
});

csvBtn.addEventListener('click', () => {
  table.exportCSV({ download: true, filename: 'orders.csv' });
});

const preview = document.createElement('pre');
preview.style.cssText = 'margin:12px 0 0;padding:10px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;overflow:auto';
preview.textContent = table.exportCSV().split('\\r\\n').slice(0, 4).join('\\n') + '\\n...';
root.append(preview);

cleanup(() => { table.destroy(); del.destroy(); csvBtn.destroy(); if (empty) empty.destroy(); ChillNotify.closeAll(); });
\`\`\`

\`exportCSV()\` returns every row that passes the current search (\`{ all: false }\` limits it to the visible page), sorted as on screen. Text cells starting with \`=\`, \`+\`, \`-\` (non-numbers) or \`@\` are prefixed with an apostrophe so spreadsheets do not run them as formulas.

## Step 5: take over paging with ChillPagination

ChillTable pages its own rows, which is perfect for a few hundred records. When your data comes from a server one page at a time, hand paging over to \`ChillPagination\`: give the table a page size larger than any page (so its own pager never appears), and call \`setData()\` with each page you fetch.

\`\`\`live
const TOTAL = 137;
const names = ['Ada', 'Grace', 'Alan', 'Katherine', 'Margaret', 'Linus', 'Barbara', 'Dennis'];
// pretend server: returns one page
const fetchPage = (page, size) => new Promise((resolve) => setTimeout(() => {
  const start = (page - 1) * size;
  resolve(Array.from({ length: Math.max(0, Math.min(size, TOTAL - start)) }, (_, i) => ({
    id: start + i + 1,
    name: names[(start + i) % names.length] + ' #' + (start + i + 1),
    score: ((start + i) * 37) % 100
  })));
}, 120));

const tableHost = document.createElement('div');
const pagerHost = document.createElement('div');
pagerHost.style.marginTop = '12px';
root.append(tableHost, pagerHost);

const table = ChillTable.create(tableHost, {
  columns: [
    { key: 'id', label: '#', align: 'right' },
    { key: 'name', label: 'Name' },
    { key: 'score', label: 'Score', align: 'right' }
  ],
  data: [],
  pageSize: 1000,
  searchable: false,
  caption: 'Leaderboard',
  emptyText: 'Loading...'
});

let alive = true;
const load = async (page, size) => {
  const rows = await fetchPage(page, size);
  if (alive) table.setData(rows);
};

const pager = ChillPagination.init(pagerHost, {
  total: TOTAL,
  pageSize: 10,
  showInfo: true,
  showSizeChanger: true,
  pageSizeOptions: [5, 10, 25],
  ariaLabel: 'Leaderboard pages',
  onChange: (page, size) => load(page, size)
});
load(1, 10);

cleanup(() => { alive = false; table.destroy(); pager.destroy(); });
\`\`\`

> **Note:** when paging is yours, the table's search and sorting only see the rows of the current page. For server-side search or sort, send the query and sort key to your API from your own inputs and call \`setData()\` with the result.

## Result and what to remember

- One \`ChillTable\` call gives search, multi-type sorting, selection, paging and CSV export, with an accessible caption and \`aria-sort\`.
- \`render()\` can return DOM nodes, so badges and buttons never need \`html: true\`.
- \`setData()\` keeps search and sort applied and drops selected rows that no longer exist.
- Use \`ChillPagination\` for server-driven pages; keep \`pageSize\` large on the table.

## Next steps

- [Table reference](/docs/table) for \`stickyHeader\`, events and CSS variables
- [Pagination reference](/docs/pagination) for shapes, simple mode and the jumper
- [Safe by default (XSS)](/docs/guide/security) for why cell text is never HTML unless you ask
`,
};

export default guide;
