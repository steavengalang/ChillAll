import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'pagination',
    global: 'ChillPagination',
    category: 'data',
    title: 'Pagination',
    summary: 'Page navigation with ellipsis, page-size selector, jump-to-page, simple mode and keyboard support.',
    style: 'init',
    description:
        'ChillPagination renders page controls for any list: previous and next buttons, numbered pages with smart ellipsis, an optional page-size selector, a "go to page" box and a compact "3 / 12" mode. ' +
        'It only manages the **page state**; you decide what to show. Handle `onChange(page, pageSize)` to slice local data or fetch a server page.\n\n' +
        '`init(target, options)` swaps the target element for a `<nav>` and `destroy()` puts the original element back. Prev and Next text is escaped; pass `prevHtml` / `nextHtml` only for trusted markup.',
    features: [
        'Smart page list with ellipsis, controlled by `maxButtons`',
        'Page-size selector, "Showing 1-10 of 250" info and a jump-to-page input',
        'Simple "Page / total" mode for tight spaces',
        'Three sizes and three shapes; custom Prev and Next text or HTML',
        'Arrow, Home and End key navigation and a polite live-region announcement',
        'Silent updates: `goToPage(n, { silent: true })` skips the callbacks',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic pagination',
            description: 'Give it a `total` and a `pageSize`. `onChange` receives the new page and the page size.',
            code: `const host = document.createElement('div');
root.append(host);
const label = document.createElement('p');
label.style.cssText = 'font-size:13px;color:var(--chill-text)';
label.textContent = 'Page 1';
root.append(label);
const pager = ChillPagination.init(host, {
  total: 250,
  pageSize: 10,
  onChange: (page, size) => { label.textContent = 'Page ' + page + ' (rows ' + ((page - 1) * size + 1) + '-' + page * size + ')'; },
});
cleanup(() => pager.destroy());`,
        },
        {
            id: 'full-controls',
            title: 'Info, page size and jumper',
            description: 'Show the range info, a page-size selector and a "Go to" box. Changing the page size returns to page 1 and calls `onPageSizeChange`.',
            height: 160,
            code: `const host = document.createElement('div');
root.append(host);
const pager = ChillPagination.init(host, {
  total: 1240,
  pageSize: 20,
  current: 5,
  maxButtons: 7,
  showInfo: true,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100],
  showJumper: true,
  onPageSizeChange: (size) => console.log('page size is now', size),
});
cleanup(() => pager.destroy());`,
        },
        {
            id: 'looks',
            title: 'Sizes, shapes and simple mode',
            description: 'Three `size` values, three `shape` values, custom Prev / Next text and a compact `simple` variant.',
            height: 260,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:14px';
const make = (opts) => {
  const host = document.createElement('div');
  root.append(host);
  return ChillPagination.init(host, { total: 90, pageSize: 10, ...opts });
};
const list = [
  make({ size: 'sm' }),
  make({ size: 'lg', shape: 'rounded' }),
  make({ shape: 'square', prevText: 'Previous', nextText: 'Next' }),
  make({ simple: true, current: 3 }),
];
cleanup(() => list.forEach((p) => p.destroy()));`,
        },
        {
            id: 'server-data',
            title: 'Server-side paging',
            description: 'Fetch a page whenever `onChange` fires, then call `setTotal()` with the count the server returns. This demo fakes the API.',
            height: 300,
            code: `const fakeApi = async (page, size) => {
  await new Promise((r) => setTimeout(r, 250));
  return { total: 137, items: Array.from({ length: size }, (_, i) => 'Customer #' + ((page - 1) * size + i + 1)).filter((_, i) => (page - 1) * size + i < 137) };
};
const list = document.createElement('ul');
list.style.cssText = 'color:var(--chill-text);font-size:14px;min-height:120px;padding-left:18px';
const host = document.createElement('div');
root.append(list, host);
const load = async (page, size) => {
  list.style.opacity = '0.5';
  const res = await fakeApi(page, size);
  list.textContent = '';
  res.items.slice(0, 5).forEach((t) => { const li = document.createElement('li'); li.textContent = t; list.append(li); });
  list.style.opacity = '1';
  pager.setTotal(res.total);
};
const pager = ChillPagination.init(host, { total: 0, pageSize: 10, showInfo: true, onChange: load });
await load(1, 10);
cleanup(() => pager.destroy());`,
        },
        {
            id: 'api-events',
            title: 'Programmatic control and events',
            description: 'Drive the pager from your own buttons with `next()`, `prev()` and `goToPage()`, and subscribe with `on(\'change\', fn)`.',
            height: 200,
            code: `const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap';
const host = document.createElement('div');
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;color:var(--chill-text)';
root.append(bar, host, out);
const pager = ChillPagination.init(host, { total: 120, pageSize: 10 });
pager.on('change', (page) => { out.textContent = 'change event -> page ' + page; });
[['Prev', () => pager.prev()], ['Next', () => pager.next()], ['Jump to 8', () => pager.goToPage(8)], ['Silent to 1', () => pager.goToPage(1, { silent: true })]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
cleanup(() => pager.destroy());`,
        },
    ],
    guides: [
        {
            title: 'How it mounts',
            body:
                '`ChillPagination.init(selectorOrElement, options)` (`create` is an alias) **replaces** the target element with a `<nav class="chillpagination">`. ' +
                'If the target has no parent it appends the `<nav>` inside it instead. `destroy()` removes listeners and puts the original element back.\n\n' +
                'Because of the swap, point it at a dedicated placeholder (`<div id="pager"></div>`) rather than at a container that holds other content.',
        },
        {
            title: 'Wiring it to data',
            body:
                'The component never touches your list. Compute the slice yourself, or request it from the server:\n\n' +
                '```js\nconst pager = ChillPagination.init(\'#pager\', {\n  total: items.length,\n  pageSize: 10,\n  onChange: (page, size) => render(items.slice((page - 1) * size, page * size)),\n});\n```\n\n' +
                '`onChange` fires only when the page actually changes. After a filter or a fetch, call `setTotal(n)`: the current page is clamped to the new range. ' +
                'To change the page without triggering your handler (for example when restoring from the URL) use `goToPage(n, { silent: true })`.',
        },
        {
            title: 'How the page list is built',
            body:
                '`maxButtons` (minimum 5, default 7) is the number of slots including the first page, the last page and the ellipses. With 7 slots and 20 pages you get `1 ... 9 10 11 ... 20` in the middle and `1 2 3 4 5 ... 20` near the start. ' +
                'Fewer pages than slots show every page.',
        },
    ],
    options: [
        { name: 'total', type: 'number', default: '0', description: 'Total number of items.' },
        { name: 'pageSize', type: 'number', default: '10', description: 'Items per page.' },
        { name: 'current', type: 'number', default: '1', description: 'Initial page (clamped to the valid range).' },
        { name: 'maxButtons', type: 'number', default: '7', description: 'Maximum page-list slots including first, last and ellipses (minimum 5).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
        { name: 'shape', type: "'default' | 'rounded' | 'square'", default: "'default'", description: 'Button shape.' },
        { name: 'simple', type: 'boolean', default: 'false', description: 'Compact mode: Prev, "3 / 12", Next.' },
        { name: 'showInfo', type: 'boolean', default: 'false', description: 'Show "1-10 of 250".' },
        { name: 'showSizeChanger', type: 'boolean', default: 'false', description: 'Show a page-size `<select>`.' },
        { name: 'pageSizeOptions', type: 'number[]', default: '[10, 20, 50, 100]', description: 'Choices for the size selector. The current size is added if missing.' },
        { name: 'showJumper', type: 'boolean', default: 'false', description: 'Show a "Go to" number input; Enter jumps.' },
        { name: 'prevText / nextText', type: 'string', default: 'null', description: 'Plain-text labels for the Prev and Next buttons (escaped). Default is an arrow icon.' },
        { name: 'prevHtml / nextHtml', type: 'string', default: 'undefined', description: 'Trusted HTML for the Prev and Next buttons. You must sanitise it.' },
        { name: 'ariaLabel', type: 'string', default: "'Pagination'", description: 'Accessible label of the `<nav>`.' },
        { name: 'onChange', type: '(page: number, pageSize: number) => void', default: 'null', description: 'Called when the page changes.' },
        { name: 'onPageSizeChange', type: '(pageSize: number) => void', default: 'null', description: 'Called when the page size changes.' },
    ],
    methods: [
        { signature: 'ChillPagination.init(target, options)', on: 'static', description: 'Replace `target` (selector or element) with the pagination `<nav>`. Returns an instance.' },
        { signature: 'ChillPagination.create(target, options)', on: 'static', description: 'Alias of `init()`.' },
        { signature: 'ChillPagination.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.goToPage(page, { silent }?)', description: 'Go to a page (clamped). With `silent: true` no callbacks or events fire.' },
        { signature: 'instance.next() / prev()', description: 'Go one page forward or back.' },
        { signature: 'instance.setTotal(total)', description: 'Update the item count; the current page is clamped.' },
        { signature: 'instance.setPageSize(size)', description: 'Change the page size, reset to page 1 and fire `pagesize`.' },
        { signature: 'instance.getCurrentPage() / getPageSize() / getTotalPages()', description: 'Read the current state.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe to `change` or `pagesize`. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    events: [
        { name: 'change', payload: 'page: number, pageSize: number', description: 'The page changed (not fired for silent updates).' },
        { name: 'pagesize', payload: 'pageSize: number', description: 'The page size changed.' },
    ],
    cssVars: [
        { name: '--chillpagination-bg / --chillpagination-text', description: 'Button surface and text colours.' },
        { name: '--chillpagination-border', description: 'Button and input borders.' },
        { name: '--chillpagination-hover', description: 'Hover background.' },
        { name: '--chillpagination-active / --chillpagination-active-text', description: 'Current page colours.' },
        { name: '--chillpagination-text-muted', description: 'Disabled button and ellipsis colour.' },
    ],
    a11y: [
        'Renders a `<nav>` with `aria-label` (default "Pagination"); every button has an `aria-label` such as "Page 3" or "Next page".',
        'The current page has `aria-current="page"`. Ellipses are `aria-hidden`.',
        'A polite live region announces "Page X of Y" after every change; focus is kept on the equivalent control after a re-render.',
        'Tab reaches the buttons; ArrowLeft / ArrowRight / Home / End move between enabled buttons; Enter in the jumper goes to that page.',
        'The size selector and jump input have accessible names ("Page size", "Go to page").',
    ],
    tips: [
        'Use a placeholder element as the target: it is replaced, not filled.',
        'Reset to page 1 yourself (`goToPage(1)`) when a search or filter changes the result set.',
        'When syncing with the URL, restore state with `current` or `goToPage(n, { silent: true })` to avoid a duplicate fetch.',
        'In React, `init` in an effect on a placeholder ref and `destroy()` in the cleanup; because the element is swapped, avoid rendering other children in that node.',
        'SSR-safe: nothing runs until `init()` receives an element in the browser.',
    ],
    related: ['table', 'search', 'tabs'],
    keywords: ['pager', 'pages', 'paging', 'next', 'previous', 'page size', 'jump'],
};

export default doc;
