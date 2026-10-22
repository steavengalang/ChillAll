import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'virtuallist',
    global: 'ChillVirtualList',
    category: 'data',
    title: 'Virtual List',
    summary: 'Render 100k+ rows smoothly: only the visible window is in the DOM, with fixed, variable or auto heights.',
    style: 'create',
    description:
        'ChillVirtualList keeps a scrollable list fast no matter how long it is. It computes which rows are visible, renders only those (plus a few `overscan` rows), and positions them absolutely inside a tall spacer so the scrollbar behaves as if every row existed.\n\n' +
        'Rows can have one fixed height, a per-item height function, or `"auto"` to be measured as they appear. `ChillVirtualList.create(options)` returns an instance whose `element` you append; `ChillVirtualList.init(el, options)` turns an existing element into the list. ' +
        'Strings from `renderItem` are inserted as **text**; return a DOM node for rich rows, or set `html: true` for trusted markup.',
    features: [
        '100k+ items with a few dozen DOM nodes: only the visible range is rendered',
        'Fixed, per-item function or auto-measured row heights',
        '`scrollToIndex(i, align)`, `append()`, `setItems()` and `updateItem()` for dynamic data',
        'Keyboard scrolling (Home, End, PageUp, PageDown) and proper list semantics (`aria-posinset`, `aria-setsize`)',
        'Range and scroll callbacks to drive lazy loading',
    ],
    examples: [
        {
            id: 'basic',
            title: '100,000 rows',
            description: 'Scroll as fast as you like: only the visible rows exist in the DOM. `getRenderedCount()` shows how many.',
            height: 340,
            code: `const items = Array.from({ length: 100000 }, (_, i) => 'Row #' + (i + 1));
const list = ChillVirtualList.create({ items, height: 240, itemHeight: 36, ariaLabel: 'Big list' });
const info = document.createElement('p');
info.style.cssText = 'font-size:13px;margin:10px 0 0;color:var(--chill-text)';
const update = () => { info.textContent = '100,000 items, ' + list.getRenderedCount() + ' rows in the DOM'; };
list.on('range', update);
root.append(list.element, info);
update();
cleanup(() => list.destroy());`,
        },
        {
            id: 'custom-rows',
            title: 'Custom rows',
            description: '`renderItem(item, index)` can return a DOM node for rich layouts. Remember to give the rows the same height as `itemHeight`.',
            height: 340,
            code: `const people = Array.from({ length: 5000 }, (_, i) => ({ name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@example.com', online: i % 3 === 0 }));
const list = ChillVirtualList.create({
  items: people, height: 260, itemHeight: 56,
  renderItem: (p) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:0 12px;height:100%';
    const dot = document.createElement('span');
    dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:' + (p.online ? '#22c55e' : '#9ca3af');
    const text = document.createElement('div');
    text.innerHTML = '<strong></strong><br><small></small>';
    text.querySelector('strong').textContent = p.name;
    text.querySelector('small').textContent = p.email;
    row.append(dot, text);
    return row;
  },
});
root.append(list.element);
cleanup(() => list.destroy());`,
        },
        {
            id: 'jump',
            title: 'Jump to a row',
            description: '`scrollToIndex(index, align)` supports `start`, `center`, `end` and `auto`. Rows keep their data, so you can highlight the target in `renderItem`.',
            height: 340,
            code: `const items = Array.from({ length: 20000 }, (_, i) => 'Log line ' + (i + 1));
const list = ChillVirtualList.create({ items, height: 220, itemHeight: 32 });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap';
[['Top', () => list.scrollToTop()], ['Row 5000 (center)', () => list.scrollToIndex(4999, 'center')], ['Last row', () => list.scrollToIndex(19999, 'end')]].forEach(([text, fn]) => {
  const b = ChillButton.create({ text, size: 'sm', variant: 'outline' });
  b.onclick = fn;
  row.append(b);
});
root.append(list.element, row);
cleanup(() => list.destroy());`,
        },
        {
            id: 'variable-height',
            title: 'Variable and auto heights',
            description: 'Pass a function for known per-item heights, or `itemHeight: "auto"` to measure rows as they render (`estimatedHeight` is used until then).',
            height: 360,
            code: `const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor'.split(' ');
const items = Array.from({ length: 2000 }, (_, i) => ({ id: i, text: words.slice(0, 2 + (i * 7) % 10).join(' ') }));
const list = ChillVirtualList.create({
  items, height: 240, itemHeight: 'auto', estimatedHeight: 48,
  renderItem: (it) => {
    const d = document.createElement('div');
    d.style.cssText = 'padding:12px';
    d.textContent = '#' + it.id + ': ' + it.text.repeat(1 + (it.id % 4));
    return d;
  },
});
root.append(list.element);
cleanup(() => list.destroy());`,
        },
        {
            id: 'append',
            title: 'Append data as you go',
            description: '`append(items)` adds rows without resetting the scroll position. Combine it with `onRangeChange` for endless loading.',
            height: 340,
            code: `let loaded = 100;
const list = ChillVirtualList.create({
  items: Array.from({ length: loaded }, (_, i) => 'Message ' + (i + 1)),
  height: 220, itemHeight: 36, emptyText: 'No messages',
  onRangeChange: (start, end) => {
    if (end >= loaded - 10 && loaded < 1000) {
      const next = Array.from({ length: 100 }, (_, i) => 'Message ' + (loaded + i + 1));
      loaded += 100;
      list.append(next);
    }
  },
});
const info = document.createElement('p');
info.style.cssText = 'font-size:13px;margin:10px 0 0;color:var(--chill-text)';
const tick = () => { info.textContent = 'Loaded ' + loaded + ' messages'; };
list.on('range', tick);
tick();
root.append(list.element, info);
cleanup(() => list.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Row heights',
            body:
                '- **number**: every row is the same height (fastest, most predictable).\n' +
                '- **function `(item, index) => px`**: heights you can compute up front.\n' +
                '- **`"auto"`**: rows are measured once rendered; until then `estimatedHeight` (default 40) is used, so the scrollbar may adjust slightly while scrolling.\n\n' +
                'With a fixed or function height the component sets each row\'s height; your row content should simply fill it (`height: 100%`). In `auto` mode rows size to their content.',
        },
        {
            title: 'Create vs init',
            body:
                '`ChillVirtualList.create(options)` makes the container element for you (`instance.element`). `ChillVirtualList.init(el, options)` converts an element that already exists (returns `null` if not found); ' +
                '`destroy()` restores its class and height. Either way the viewport gets `height` (px or any CSS length, default 400), becomes focusable and scrolls itself.\n\n' +
                'Change the data with `setItems(items)` (resets rows), `append(items)` (keeps the scroll position), `updateItem(index)` to re-render one row and `refresh()` to re-measure everything.',
        },
        {
            title: 'Accessibility and focus',
            body:
                'The scrolling viewport has `tabindex="0"` and the content is a `role="list"` of `role="listitem"` rows carrying `aria-posinset` and `aria-setsize`, so screen readers announce "item 4 of 100000" even though most rows are not rendered. ' +
                'Home, End, PageUp and PageDown scroll the list when the viewport itself has focus (disable with `keyboard: false`). Rows are created and destroyed while scrolling, so avoid keeping focus or state inside a row.',
        },
    ],
    options: [
        { name: 'items', type: 'any[]', default: '[]', description: 'The data. Only the visible range is rendered.' },
        { name: 'renderItem', type: '(item, index) => Node | string', default: 'String(item)', description: 'Row renderer. Strings are inserted as text unless `html` is true.' },
        { name: 'itemHeight', type: "number | ((item, index) => number) | 'auto'", default: '40', description: 'Fixed height, per-item height function, or `"auto"` to measure rows.' },
        { name: 'estimatedHeight', type: 'number', default: '40', description: 'Initial guess for unmeasured rows (also the fallback for invalid function results).' },
        { name: 'height', type: 'number | string', default: '400', description: 'Viewport height: px number or CSS length.' },
        { name: 'overscan', type: 'number', default: '5', description: 'Extra rows rendered above and below the viewport.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string results of `renderItem` as HTML (unsafe with untrusted data).' },
        { name: 'keyboard', type: 'boolean', default: 'true', description: 'Home / End / PageUp / PageDown scroll the focused viewport.' },
        { name: 'emptyText', type: 'string', default: "''", description: 'Message shown when there are no items.' },
        { name: 'ariaLabel', type: 'string', default: "'List'", description: 'Accessible name of the list.' },
        { name: 'onRangeChange', type: '(startIndex: number, endIndex: number) => void', default: 'null', description: 'Called when the rendered window changes.' },
        { name: 'onScroll', type: '(scrollTop: number, event: Event) => void', default: 'null', description: 'Called on every scroll event.' },
    ],
    methods: [
        { signature: 'ChillVirtualList.create(options)', on: 'static', description: 'Create an instance with its own element; append `instance.element`.' },
        { signature: 'ChillVirtualList.init(target, options)', on: 'static', description: 'Turn an existing element (selector or node) into a list. Returns `null` if it is not found.' },
        { signature: 'ChillVirtualList.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.element', description: 'The scrolling viewport element.' },
        { signature: 'instance.setItems(items)', description: 'Replace all data and re-render. Returns the instance.' },
        { signature: 'instance.append(items)', description: 'Add rows at the end without resetting the scroll position.' },
        { signature: 'instance.getItems()', description: 'The current items array.' },
        { signature: "instance.scrollToIndex(index, align?)", description: "Scroll to a row; `align` is 'start' (default), 'center', 'end' or 'auto'." },
        { signature: 'instance.scrollToTop()', description: 'Scroll to the first row.' },
        { signature: 'instance.updateItem(index)', description: 'Re-render a single visible row (after you changed its data).' },
        { signature: 'instance.refresh()', description: 'Clear measurements and re-render everything.' },
        { signature: 'instance.getRange() / getRenderedCount()', description: 'Rendered `{ start, end }` indexes and number of rows in the DOM.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe to `range` or `scroll`. Returns the instance.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element (or restore the host for `init`).' },
    ],
    events: [
        { name: 'range', payload: '(startIndex, endIndex)', description: 'The rendered window changed.' },
        { name: 'scroll', payload: '(scrollTop)', description: 'The viewport scrolled.' },
    ],
    cssVars: [
        { name: '--chillvirtuallist-bg / --chillvirtuallist-text', description: 'Viewport background and text colour.' },
        { name: '--chillvirtuallist-border', description: 'Viewport and row separator colour.' },
        { name: '--chillvirtuallist-hover', description: 'Row hover background.' },
        { name: '--chillvirtuallist-muted', description: 'Empty-state text colour.' },
        { name: '--chillvirtuallist-focus', description: 'Focus ring colour.' },
    ],
    a11y: [
        'The viewport is focusable (`tabindex="0"`); the content is `role="list"` with `aria-label`, rows are `role="listitem"` with `aria-posinset` / `aria-setsize`.',
        'Home, End, PageUp and PageDown scroll when the viewport has focus.',
        'Because off-screen rows are not in the DOM, browser find-in-page cannot see them; provide your own search for long lists.',
    ],
    tips: [
        'Prefer a fixed `itemHeight` when you can: it is the fastest and avoids scrollbar jumps.',
        'Pass `items` as one array reference and mutate it only through `setItems` / `append`.',
        'Keep `renderItem` cheap: it runs for every row that scrolls into view.',
    ],
    related: ['infinitescroll', 'pagination', 'table'],
    keywords: ['windowing', 'virtualization', 'large list', 'performance', 'scroller', 'long list'],
};

export default doc;
