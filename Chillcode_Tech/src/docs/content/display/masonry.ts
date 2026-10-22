import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'masonry',
    global: 'ChillMasonry',
    category: 'display',
    title: 'Masonry',
    summary: 'Responsive masonry layout that packs variable-height items into the shortest column.',
    style: 'init',
    description:
        'ChillMasonry arranges the children of a container into columns, placing each item into the currently shortest column in DOM order, so reading and Tab order stay logical. ' +
        'Items are positioned with CSS transforms, and the layout re-runs automatically when the container width changes, when an item resizes, and when images inside items finish loading.\n\n' +
        'Call `ChillMasonry.init(container, options)` on an element that already holds the items. Choose a fixed number of columns, width-based breakpoints (`{ 0: 1, 560: 2, 900: 3 }`) or let it derive the count from a target `columnWidth`.',
    features: [
        'Automatic, breakpoint or fixed column counts, measured against the container width',
        'Relayout on container resize, item resize (ResizeObserver) and image load',
        'DOM order is preserved, so keyboard and screen-reader order stay logical',
        'Add, prepend and remove items dynamically with animated movement',
        'Respects `prefers-reduced-motion`; `destroy()` restores the container styles',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Automatic columns',
            description: 'With the default `columns: "auto"`, the column count follows the container width and the target `columnWidth`.',
            height: 420,
            code: `const heights = [120, 200, 90, 160, 240, 110, 180, 130, 220, 100];
const grid = document.createElement('div');
heights.forEach((h, i) => {
  const item = document.createElement('div');
  item.textContent = 'Item ' + (i + 1);
  item.style.cssText = 'height:' + h + 'px;border-radius:10px;color:#fff;font-weight:600;padding:12px;background:hsl(' + (i * 36) + ',65%,50%)';
  grid.append(item);
});
root.append(grid);
const m = ChillMasonry.init(grid, { columnWidth: 140, gap: 10 });
cleanup(() => m.destroy());`,
        },
        {
            id: 'breakpoints',
            title: 'Breakpoints and gaps',
            description: '`columns` can map minimum container widths to column counts. `gap` accepts one number or `[rowGap, colGap]`.',
            height: 460,
            code: `const grid = document.createElement('div');
const quotes = ['Short and sweet.', 'A longer card with a few more words so that it wraps over several lines inside the column.', 'Medium length text goes here, enough for two lines.', 'Tiny.', 'Another fairly long entry that makes this column taller than its neighbours by a good margin.', 'Okay.'];
quotes.forEach((q) => {
  const card = document.createElement('div');
  card.textContent = q;
  card.style.cssText = 'padding:14px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text)';
  grid.append(card);
});
root.append(grid);
const m = ChillMasonry.init(grid, {
  columns: { 0: 1, 360: 2, 640: 3 },
  gap: [12, 16],
  onLayout: (info) => console.log(info.columns + ' columns, height ' + info.height),
});
cleanup(() => m.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Add and remove items',
            description: '`append()`, `prepend()` and `remove()` take elements (or arrays of them) and relayout. Clicking a tile removes it.',
            height: 420,
            code: `const grid = document.createElement('div');
root.append(grid);
const m = ChillMasonry.init(grid, { columns: 3, gap: 10 });
let n = 0;
const make = () => {
  const t = document.createElement('div');
  t.textContent = 'Tile ' + (++n) + ' (click to remove)';
  t.style.cssText = 'cursor:pointer;color:#fff;font-weight:600;padding:12px;border-radius:10px;height:' + (70 + Math.floor(Math.random() * 110)) + 'px;background:hsl(' + (n * 47 % 360) + ',65%,48%)';
  t.onclick = () => m.remove(t);
  return t;
};
m.append([make(), make(), make(), make(), make()]);
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
[['Append', () => m.append(make())], ['Prepend', () => m.prepend(make())]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.prepend(bar);
cleanup(() => m.destroy());`,
        },
        {
            id: 'selector',
            title: 'Item selector and options',
            description: '`itemSelector` limits which children are laid out. `setOptions()` changes settings later and relayouts.',
            height: 380,
            code: `root.innerHTML = '<div id="gallery"><div class="tile" style="height:90px"></div><div class="tile" style="height:150px"></div><div class="tile" style="height:110px"></div><div class="tile" style="height:60px"></div><div class="tile" style="height:130px"></div><div class="tile" style="height:100px"></div></div>';
root.querySelectorAll('.tile').forEach((t, i) => { t.style.background = 'hsl(' + (i * 60) + ',60%,52%)'; t.style.borderRadius = '10px'; });
const m = ChillMasonry.init('#gallery', { itemSelector: '.tile', columns: 2, gap: 8 });
const t = setTimeout(() => m.setOptions({ columns: 3 }), 1500);
cleanup(() => { clearTimeout(t); m.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'How columns are chosen',
            body:
                '- **`columns: number`** uses exactly that many columns.\n' +
                '- **`columns: { minWidth: cols }`** picks the entry with the largest key not greater than the **container** width (not the viewport), for example `{ 0: 1, 560: 2, 900: 3 }`.\n' +
                '- **`columns: "auto"`** (default) fits as many columns of about `columnWidth` px as the container allows, up to `maxColumns`.\n\n' +
                '`getColumns()` returns the current count and `onLayout(info, instance)` receives `{ columns, width, height, count }` after every layout.',
        },
        {
            title: 'Images and lazy content',
            body:
                'Items are measured after layout, so give images a `width` / `height` (or `aspect-ratio`) to avoid jumps. When `observeImages` is on (default), images inside items trigger a relayout once they load, ' +
                'and a ResizeObserver handles items that grow, such as expanding cards. Call `layout()` manually after changes the observers cannot see, for example web fonts finishing late.\n\n' +
                'The container gets `position: relative` and a computed height; `destroy()` restores its original `class` and `style` and the items\' inline styles.',
        },
    ],
    options: [
        { name: 'columns', type: "number | { [minWidth: number]: number } | 'auto'", default: "'auto'", description: 'Column count; object keys are minimum container widths in px.' },
        { name: 'columnWidth', type: 'number', default: '240', description: 'Target column width in px when `columns` is `"auto"`.' },
        { name: 'maxColumns', type: 'number', default: '12', description: 'Upper limit for automatic columns.' },
        { name: 'gap', type: 'number | [number, number]', default: '16', description: 'Gap in px; an array is `[rowGap, colGap]`.' },
        { name: 'itemSelector', type: 'string', default: 'null', description: 'Which children to lay out (default: all element children).' },
        { name: 'animate', type: 'boolean', default: 'true', description: 'Animate item movement (off under reduced motion).' },
        { name: 'observeImages', type: 'boolean', default: 'true', description: 'Relayout when images inside items finish loading.' },
        { name: 'onLayout', type: '(info, instance) => void', default: 'null', description: 'Called after each layout; `info` is `{ columns, width, height, count }`.' },
    ],
    methods: [
        { signature: 'ChillMasonry.init(container, options?)', on: 'static', description: 'Apply masonry to a container element or selector; returns an instance. Throws if the container is not found.' },
        { signature: 'ChillMasonry.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'masonry.layout()', description: 'Recompute positions now.' },
        { signature: 'masonry.append(elementOrArray) / prepend(elementOrArray)', description: 'Add items (moving them into the container if needed) and relayout.' },
        { signature: 'masonry.remove(element)', description: 'Remove an item from the layout and the DOM.' },
        { signature: 'masonry.getColumns() / getItems()', description: 'Current column count; current item elements.' },
        { signature: 'masonry.setOptions(partial)', description: 'Change options and relayout.' },
        { signature: 'masonry.destroy()', description: 'Stop observing and restore the container and items.' },
    ],
    a11y: [
        'Items stay in DOM order, so Tab and screen-reader order match the source, not the visual column order.',
        'Item movement is animated only when `prefers-reduced-motion` is not set.',
        'The container gets no ARIA roles; add `role="list"` / `listitem` yourself if the content is a list.',
    ],
    tips: [
        'Visual order flows across columns (left to right, shortest column first) while DOM order is linear; keep that in mind for tab order and "first item" semantics.',
        'Give items stable widths via the layout (do not set `width` on items); the width is set by the column count.',
        'In React or Vue, call `init()` after the items have rendered and `destroy()` on unmount; use `append()` / `remove()` for items added later, or `layout()` after your framework updated the DOM.',
    ],
    related: ['carousel', 'card', 'reveal'],
    keywords: ['grid', 'pinterest', 'columns', 'gallery', 'waterfall', 'layout'],
};

export default doc;
