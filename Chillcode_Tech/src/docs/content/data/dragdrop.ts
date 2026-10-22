import type { DocEntry } from '../../types';

// Builds a list container with N items using the built-in list styles.
const LIST = `const mkList = (labels, extra = '') => {
  const ul = document.createElement('div');
  ul.className = 'chilldragdrop-list' + extra;
  labels.forEach((text, i) => {
    const li = document.createElement('div');
    li.className = 'chilldragdrop-item chilldragdrop-list-item';
    li.dataset.id = 'item-' + i;
    li.style.color = 'var(--chill-text)';
    li.textContent = text;
    ul.append(li);
  });
  return ul;
};`;

const doc: DocEntry = {
    id: 'dragdrop',
    global: 'ChillDragDrop',
    category: 'data',
    title: 'Drag & Drop',
    summary: 'Sortable lists and grids with mouse, touch-friendly handles and full keyboard reordering.',
    style: 'init',
    description:
        'ChillDragDrop makes the children of a container reorderable. Drag them with the pointer (native HTML5 drag and drop with a ghost and a placeholder) or use the keyboard: focus an item, press Space to grab it, move it with the arrow keys and press Space again to drop (Escape cancels). ' +
        'Every step is announced to screen readers through a live region.\n\n' +
        '`ChillDragDrop.init(container, options)` enhances existing DOM, so you keep full control of the markup; items are found with the `items` selector (default `.chilldragdrop-item`). ' +
        'The component reorders the DOM only: read the result with `getOrder()` or `onChange(order)` and persist it yourself.',
    features: [
        'Reorders existing DOM elements in vertical lists, horizontal rows and grids (`axis`)',
        'Optional drag handle so the rest of the item stays interactive',
        'Keyboard reordering with Space/Enter, arrows, Home/End and Escape to cancel',
        'Screen-reader announcements with customisable messages',
        'Picks up items added or removed later automatically (MutationObserver)',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Sortable list',
            description: 'Drag a row to a new position, or focus one and press Space, then use the arrow keys. `onChange` fires with the new order after a real move.',
            height: 300,
            code: `${LIST}
const list = mkList(['Write the proposal', 'Review pull requests', 'Plan the sprint', 'Ship the release']);
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text)';
out.textContent = 'Drag to reorder...';
root.append(list, out);
const dd = ChillDragDrop.init(list, {
  onChange: (order) => { out.textContent = 'Order: ' + order.map((o) => o.element.textContent).join(' > '); },
});
cleanup(() => dd.destroy());`,
        },
        {
            id: 'handle',
            title: 'Drag handle',
            description: 'With `handle` set, pointer drags only start from that descendant, so buttons and links inside the item keep working. `createHandle()` returns a ready-made grip.',
            height: 280,
            code: `${LIST}
const list = mkList(['Inbox', 'Starred', 'Drafts', 'Archive']);
list.querySelectorAll('.chilldragdrop-item').forEach((item) => {
  item.prepend(ChillDragDrop.createHandle());
  const btn = ChillButton.create({ text: 'Open', size: 'sm', variant: 'outline' });
  btn.style.marginLeft = 'auto';
  item.append(btn);
});
root.append(list);
const dd = ChillDragDrop.init(list, { handle: '.chilldragdrop-handle' });
cleanup(() => dd.destroy());`,
        },
        {
            id: 'grid',
            title: 'Grid and horizontal axes',
            description: 'Use `axis: "x"` when items sit side by side. The built-in `chilldragdrop-grid` class gives a responsive grid.',
            height: 300,
            code: `${LIST}
const grid = mkList(['Photos', 'Music', 'Videos', 'Docs', 'Backups', 'Games'], '');
grid.className = 'chilldragdrop-grid';
grid.querySelectorAll('.chilldragdrop-item').forEach((i) => { i.style.cssText += ';justify-content:center;padding:28px 12px'; });
root.append(grid);
const dd = ChillDragDrop.init(grid, { axis: 'x' });
cleanup(() => dd.destroy());`,
        },
        {
            id: 'events',
            title: 'Events and custom announcements',
            description: 'Subscribe with `on("start" | "end" | "change" | "announce", fn)`. Override `messages` and `label` to localise what screen readers hear.',
            height: 320,
            code: `${LIST}
const list = mkList(['Alpha', 'Bravo', 'Charlie']);
const log = document.createElement('p');
log.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text);min-height:2.4em';
root.append(list, log);
const dd = ChillDragDrop.init(list, {
  label: (item) => 'Task ' + item.textContent,
  messages: {
    grab: (label, pos, total) => label + ' picked up (' + pos + '/' + total + ')',
    move: (label, pos) => label + ' now at ' + pos,
    drop: (label, pos) => label + ' placed at ' + pos,
  },
});
dd.on('announce', (text) => { log.textContent = text; });
dd.on('end', ({ from, to }) => { if (from === to) log.textContent += ' (unchanged)'; });
cleanup(() => dd.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Adding items later',
            description: 'New children are picked up automatically, no re-init needed. Call `refresh()` if you change attributes yourself.',
            height: 320,
            code: `${LIST}
const list = mkList(['First task']);
let n = 1;
const add = ChillButton.create({ text: 'Add task', size: 'sm' });
add.style.marginTop = '12px';
add.onclick = () => {
  n++;
  const li = document.createElement('div');
  li.className = 'chilldragdrop-item chilldragdrop-list-item';
  li.style.color = 'var(--chill-text)';
  li.textContent = 'Task #' + n;
  list.append(li);
};
root.append(list, add);
const dd = ChillDragDrop.init(list, {});
cleanup(() => dd.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Markup and selectors',
            body:
                'The container can hold any markup. Elements matching `items` (default `.chilldragdrop-item`) are sortable; everything else stays where it is. The library provides optional helper classes: `chilldragdrop-list` (vertical flex), `chilldragdrop-list-item` (card look) and `chilldragdrop-grid`.\n\n' +
                '```html\n<ul id="todo">\n  <li class="item" data-id="a">Write docs</li>\n  <li class="item" data-id="b">Ship it</li>\n</ul>\n<script>\n  ChillDragDrop.init("#todo", { items: ".item", onChange: (order) => save(order.map((o) => o.id)) });\n</script>\n```\n\n' +
                '`getOrder()` returns `[{ element, index, id }]`, where `id` comes from `data-id` (falling back to the index).',
        },
        {
            title: 'Keyboard and screen readers',
            body:
                'Items get `tabindex="0"` (unless they already have one), `aria-roledescription="sortable item"` and instructions in `aria-description`. Space or Enter grabs the focused item, ArrowUp/ArrowLeft and ArrowDown/ArrowRight move it, Home and End jump to the ends, ' +
                'Space or Enter drops it and Escape returns it to where it started. Losing focus while grabbed drops the item in place. Set `keyboard: false` to turn all of this off.\n\n' +
                'Announcements go to a polite-by-design `aria-live` status region appended to `document.body` and removed on `destroy()`.',
        },
        {
            title: 'Persisting the order',
            body:
                'The component moves DOM nodes only. In `onChange(order)` map the result to your data model and save it:\n\n' +
                '```js\nChillDragDrop.init(list, {\n  onChange: (order) => api.saveOrder(order.map((o) => o.id)),\n});\n```\n\n' +
                '`onChange` fires only when the position really changed, while `onEnd({ item, from, to })` fires after every drag or keyboard drop.',
        },
    ],
    options: [
        { name: 'items', type: 'string', default: "'.chilldragdrop-item'", description: 'Selector of the sortable elements inside the container.' },
        { name: 'handle', type: 'string', default: 'null', description: 'Only start a pointer drag from this descendant selector.' },
        { name: 'axis', type: "'y' | 'x'", default: "'y'", description: 'Pointer axis used to decide before/after: `y` for vertical lists, `x` for rows and grids.' },
        { name: 'keyboard', type: 'boolean', default: 'true', description: 'Enable keyboard reordering and make items focusable.' },
        { name: 'label', type: '(item: HTMLElement) => string', default: 'aria-label or text', description: 'Accessible name used in announcements.' },
        { name: 'messages', type: '{ grab?, move?, drop?, cancel? }', default: 'English sentences', description: 'Functions `(label, position, total) => string` that build the live-region messages.' },
        { name: 'ghostClass', type: 'string', default: "'chilldragdrop-ghost'", description: 'Class of the floating drag preview.' },
        { name: 'placeholderClass', type: 'string', default: "'chilldragdrop-placeholder'", description: 'Class of the drop-position placeholder.' },
        { name: 'onStart', type: '({ item, index }) => void', default: 'null', description: 'A drag or keyboard grab started.' },
        { name: 'onEnd', type: '({ item, from, to }) => void', default: 'null', description: 'A drag or keyboard drop finished (even when nothing moved).' },
        { name: 'onChange', type: '(order: { element, index, id }[]) => void', default: 'null', description: 'The order changed.' },
    ],
    methods: [
        { signature: 'ChillDragDrop.init(container, options)', on: 'static', description: 'Make a container sortable (selector or element) and return an instance.' },
        { signature: 'ChillDragDrop.createHandle()', on: 'static', description: 'Create a grip element (`.chilldragdrop-handle`) with an SVG icon to use as a drag handle.' },
        { signature: 'ChillDragDrop.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getItems()', description: 'The current sortable elements in DOM order.' },
        { signature: 'instance.getOrder()', description: 'Array of `{ element, index, id }` (id from `data-id`, else the index).' },
        { signature: 'instance.refresh()', description: 'Re-apply attributes to items (runs automatically on DOM changes).' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `start`, `end`, `change` or `announce`. Returns the instance.' },
        { signature: 'instance.announce(text)', description: 'Send a message to the live region.' },
        { signature: 'instance.destroy()', description: 'Remove listeners, attributes, the live region and any ghost or placeholder.' },
    ],
    events: [
        { name: 'start', payload: '{ item, index }', description: 'Drag or grab started.' },
        { name: 'end', payload: '{ item, from, to }', description: 'Drag or drop finished.' },
        { name: 'change', payload: 'order[]', description: 'Position changed; payload is `getOrder()`.' },
        { name: 'announce', payload: 'string', description: 'A screen-reader message was emitted.' },
    ],
    cssVars: [
        { name: '--chilldragdrop-bg / --chilldragdrop-border', description: 'Surface and border of `chilldragdrop-list-item`.' },
        { name: '--chilldragdrop-hover', description: 'Item hover background.' },
        { name: '--chilldragdrop-active', description: 'Focus and grabbed-item accent colour.' },
        { name: '--chilldragdrop-placeholder / --chilldragdrop-placeholder-border', description: 'Drop placeholder fill and dashed border.' },
        { name: '--chilldragdrop-handle / --chilldragdrop-handle-hover', description: 'Grip icon colours.' },
    ],
    a11y: [
        'Items are focusable with `aria-roledescription="sortable item"` and an `aria-description` explaining the keys; the grabbed item has `aria-pressed="true"`.',
        'Space/Enter grab and drop, arrows move, Home/End jump, Escape cancels; every step is announced in an `aria-live` region.',
        'Ghost previews are `aria-hidden` and never receive focus.',
    ],
    tips: [
        'Native HTML5 drag and drop is used for the pointer, so on touch screens rely on the keyboard path or a library-provided handle workflow in your app.',
        'Keep `data-id` on items when you need to map the DOM order back to data.',
        'Use `handle` for items that contain inputs or links, otherwise text selection and clicks compete with dragging.',
    ],
    related: ['fileupload', 'virtuallist', 'sort'],
    keywords: ['sortable', 'reorder', 'drag', 'drop', 'kanban', 'rearrange', 'handle'],
};

export default doc;
