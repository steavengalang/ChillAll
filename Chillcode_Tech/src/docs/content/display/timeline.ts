import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'timeline',
    global: 'ChillTimeline',
    category: 'display',
    title: 'Timeline',
    summary: 'Vertical, horizontal or alternating timelines with status colours, icons and collapsible details.',
    style: 'create',
    description:
        'ChillTimeline renders a list of events along a line: order tracking, release notes, audit logs, onboarding steps. ' +
        'Each item has a title, optional time, description, icon and a status colour. Items with `content` can collapse and expand.\n\n' +
        '`ChillTimeline.create()` returns an instance whose `element` is a `<ul>` you append yourself; `ChillTimeline.init()` turns an existing `<ul>` / `<ol>` into a timeline. ' +
        'Strings are inserted as **text**; `html: true` switches every string to HTML and must only be used with trusted data.',
    features: [
        'Vertical, horizontal and alternate layouts, three sizes',
        'Six status colours: default, success, warning, danger, info, pending',
        'Collapsible items with `aria-expanded`, `toggle()`, `expandAll()` and `collapseAll()`',
        'Text or node icons and content; safe by default',
        'Dynamic updates with `add()`, `remove()` and `setItems()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Order tracking',
            description: 'A vertical timeline with status colours. `description` is a short line under the title.',
            height: 320,
            code: `const tl = ChillTimeline.create({
  items: [
    { title: 'Order placed', time: '09:00', description: 'We received your order #4821.', status: 'success' },
    { title: 'Payment confirmed', time: '09:02', description: 'Visa ending in 4242.', status: 'success' },
    { title: 'Packed', time: '11:30', description: 'Box #42 left the warehouse.', status: 'info' },
    { title: 'Out for delivery', time: 'Tomorrow', status: 'pending' },
  ],
});
root.append(tl.element);
cleanup(() => tl.destroy());`,
        },
        {
            id: 'icons',
            title: 'Icons and sizes',
            description: 'Use `icon` for emoji or text in the marker, and `size` to scale the whole timeline.',
            height: 320,
            code: `const tl = ChillTimeline.create({
  size: 'lg',
  items: [
    { title: 'Repository created', time: 'Mon', icon: '+', status: 'success' },
    { title: 'Build failed', time: 'Tue', icon: '!', status: 'danger', description: 'Missing environment variable.' },
    { title: 'Hotfix merged', time: 'Wed', icon: '✓', status: 'success' },
    { title: 'Release scheduled', time: 'Fri', icon: '•', status: 'warning' },
  ],
});
root.append(tl.element);
cleanup(() => tl.destroy());`,
        },
        {
            id: 'alternate',
            title: 'Alternating layout',
            description: '`layout: "alternate"` places items on both sides of a centre line, good for roadmaps on wide screens.',
            height: 420,
            code: `const tl = ChillTimeline.create({
  layout: 'alternate',
  items: [
    { title: 'Alpha', time: 'Jan', description: 'Internal testing', status: 'success' },
    { title: 'Beta', time: 'Mar', description: 'Invite-only users', status: 'info' },
    { title: 'Launch', time: 'Jun', description: 'Public release', status: 'warning' },
    { title: 'Scale', time: 'Q4', description: 'Multi-region', status: 'pending' },
  ],
});
root.append(tl.element);
cleanup(() => tl.destroy());`,
        },
        {
            id: 'horizontal',
            title: 'Horizontal layout',
            description: 'Items run left to right. Switch layouts at any time with `setLayout()`.',
            height: 220,
            code: `const tl = ChillTimeline.create({
  layout: 'horizontal',
  size: 'sm',
  items: [
    { title: 'Cart', status: 'success' },
    { title: 'Shipping', status: 'success' },
    { title: 'Payment', status: 'info' },
    { title: 'Review', status: 'pending' },
  ],
});
root.append(tl.element);
const t = setTimeout(() => tl.setLayout('vertical'), 2000);
cleanup(() => { clearTimeout(t); tl.destroy(); });`,
        },
        {
            id: 'collapsible',
            title: 'Collapsible details',
            description: 'Items with `content` and `collapsible: true` get a toggle button. `content` can be text or a DOM node.',
            height: 380,
            code: `const log = document.createElement('pre');
log.textContent = 'ERROR  timeout after 30s\\nretrying (2/3)...';
log.style.cssText = 'margin:0;font-size:12px;color:var(--chill-text)';
const tl = ChillTimeline.create({
  items: [
    { title: 'Deploy started', time: '14:02', content: 'Commit 9f3c1ab by Dana', collapsible: true, open: true, status: 'info' },
    { title: 'Health check', time: '14:05', content: log, collapsible: true, status: 'danger' },
    { title: 'Rolled back', time: '14:06', status: 'warning' },
  ],
  onToggle: (item, index, open) => console.log(item.title, open ? 'opened' : 'closed'),
});
root.append(tl.element);
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
[['Expand all', () => tl.expandAll()], ['Collapse all', () => tl.collapseAll()]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(bar);
cleanup(() => tl.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Live feed',
            description: '`add()` appends an item and rebuilds the list; `itemClick` fires when any item is clicked.',
            height: 340,
            code: `const tl = ChillTimeline.create({ items: [{ title: 'Server started', time: '10:00', status: 'success' }] });
root.append(tl.element);
tl.on('itemClick', (item) => console.log('clicked', item.title));
let n = 0;
const t = setInterval(() => {
  n++;
  tl.add({ title: 'Request #' + n, time: '10:0' + n, status: n % 3 === 0 ? 'danger' : 'info' });
  if (n >= 3) clearInterval(t);
}, 900);
cleanup(() => { clearInterval(t); tl.destroy(); });`,
        },
        {
            id: 'init-list',
            title: 'Enhance an existing list',
            description: '`init()` reads each `<li>` (text becomes the title) plus `data-time`, `data-status`, `data-icon` and `data-description` attributes.',
            height: 260,
            code: `root.innerHTML = '<ul id="changelog">' +
  '<li data-time="v2.1" data-status="success">Dark mode</li>' +
  '<li data-time="v2.2" data-status="info" data-description="Faster startup">Performance pass</li>' +
  '<li data-time="v3.0" data-status="pending">Plugin API</li>' +
  '</ul>';
const tl = ChillTimeline.init(root.querySelector('#changelog'), { size: 'sm' });
cleanup(() => tl.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Item shape',
            body:
                'Each entry in `items` supports `title`, `time`, `description`, `content`, `icon`, `status`, `collapsible`, `open` and `id`. ' +
                'Set `datetime` on an item to give the `<time>` element a machine-readable `datetime` attribute.\n\n' +
                '`description` is always visible; `content` is the detail block that can be collapsed. Collapsing only applies to items that actually have `content`, ' +
                'either per item (`collapsible`) or for all items (`collapsible: true` in options).',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** builds a `<ul>` in `timeline.element`. Append it where you need it.\n' +
                '- **`init(target, options)`** takes a selector or element and builds items from its children unless you pass `items`. ' +
                'It returns `null` when the target is not found.\n\n' +
                'Calling `destroy()` on an enhanced list clears the generated items and restores the original classes and ARIA attributes; the original `<li>` markup is not restored.',
        },
    ],
    options: [
        { name: 'items', type: 'TimelineItem[]', default: '[]', description: 'Events to render.' },
        { name: 'items[].title', type: 'string', default: '-', description: 'Item heading.' },
        { name: 'items[].time', type: 'string', default: '-', description: 'Time label shown beside the title.' },
        { name: 'items[].datetime', type: 'string', default: '-', description: 'Machine-readable value for the `<time datetime>` attribute.' },
        { name: 'items[].description', type: 'string', default: '-', description: 'Short text under the title.' },
        { name: 'items[].content', type: 'string | Node', default: '-', description: 'Detail block; collapsible when enabled.' },
        { name: 'items[].icon', type: 'string | Node', default: '-', description: 'Marker content (text, emoji or node). Defaults to a dot.' },
        { name: 'items[].status', type: "'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending'", default: "'default'", description: 'Marker colour.' },
        { name: 'items[].collapsible', type: 'boolean', default: 'options.collapsible', description: 'Make this item collapsible (needs `content`).' },
        { name: 'items[].open', type: 'boolean', default: 'false', description: 'Initial open state of a collapsible item.' },
        { name: 'items[].id', type: 'string | number', default: '-', description: 'Stored as `data-id` on the `<li>`.' },
        { name: 'layout', type: "'vertical' | 'horizontal' | 'alternate'", default: "'vertical'", description: 'Orientation of the timeline.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Type and marker scale.' },
        { name: 'collapsible', type: 'boolean', default: 'false', description: 'Make every item with `content` collapsible.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat title, time, description, content and icon strings as HTML (unsafe with untrusted data).' },
        { name: 'ariaLabel', type: 'string', default: "'Timeline'", description: 'Accessible name of the list.' },
        { name: 'onToggle', type: '(item, index, open) => void', default: 'null', description: 'Called when an item is expanded or collapsed by the user or `toggle()`.' },
        { name: 'onItemClick', type: '(item, index, event) => void', default: 'null', description: 'Called when an item is clicked.' },
    ],
    methods: [
        { signature: 'ChillTimeline.create(options)', on: 'static', description: 'Create a timeline instance; append `instance.element` yourself.' },
        { signature: 'ChillTimeline.init(target, options)', on: 'static', description: 'Enhance a `<ul>` / `<ol>` (selector or element); returns an instance or `null`.' },
        { signature: 'ChillTimeline.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'timeline.element', description: 'The list element.' },
        { signature: 'timeline.setItems(items)', description: 'Replace all items.' },
        { signature: 'timeline.add(item) / remove(index)', description: 'Append an item or remove one by index.' },
        { signature: 'timeline.toggle(index, force?)', description: 'Toggle (or force open / closed) a collapsible item.' },
        { signature: 'timeline.expandAll() / collapseAll()', description: 'Open or close every collapsible item.' },
        { signature: 'timeline.setLayout(layout)', description: 'Switch between vertical, horizontal and alternate.' },
        { signature: 'timeline.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'timeline.destroy()', description: 'Remove generated content and listeners.' },
    ],
    events: [
        { name: 'toggle', payload: '(item, index, open)', description: 'A collapsible item opened or closed.' },
        { name: 'itemClick', payload: '(item, index, event)', description: 'An item was clicked.' },
    ],
    cssVars: [
        { name: '--chilltimeline-text / --chilltimeline-muted', description: 'Primary and secondary text colours.' },
        { name: '--chilltimeline-line', description: 'Colour of the connecting line.' },
        { name: '--chilltimeline-primary', description: 'Default marker and focus colour.' },
        { name: '--chilltimeline-success / -warning / -danger / -info / -pending', description: 'Status marker colours.' },
        { name: '--chilltimeline-bg / --chilltimeline-surface', description: 'Marker background and detail surface.' },
    ],
    a11y: [
        'The list has `role="list"` and an `aria-label` (set `ariaLabel` to something specific).',
        'Collapsible items use a real `<button>` with `aria-expanded` and `aria-controls`; Enter and Space toggle.',
        'Markers are `aria-hidden`; the title is a heading (`h3`) for non-collapsible items.',
        'The time is rendered in a `<time>` element.',
    ],
    tips: [
        '`add()` and `remove()` rebuild the DOM, so collapsed or expanded state is kept in the items array and survives.',
        'Use `html: true` only with sanitised markup; otherwise keep strings as text.',
        'The module is safe to import on the server; create the timeline in the browser.',
    ],
    related: ['stepper', 'tree', 'card', 'reltime'],
    keywords: ['history', 'activity', 'changelog', 'steps', 'roadmap', 'feed'],
};

export default doc;
