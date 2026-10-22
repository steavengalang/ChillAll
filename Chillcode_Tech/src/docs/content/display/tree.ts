import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'tree',
    global: 'ChillTree',
    category: 'display',
    title: 'Tree',
    summary: 'Accessible tree view with lazy loading, tri-state checkboxes, filtering and full keyboard navigation.',
    style: 'create',
    description:
        'ChillTree is a WAI-ARIA tree view for file browsers, category pickers and permission trees. Nodes can be nested to any depth, ' +
        'loaded lazily on first expand, selected (single or multiple) or checked with tri-state parent checkboxes that cascade to children.\n\n' +
        '`ChillTree.create()` returns an instance whose `element` you append yourself. Labels are inserted as **text**; `html: true` switches labels and icons to HTML and must only be used with trusted data.',
    features: [
        'Single and multiple selection, or tri-state checkboxes that cascade to children',
        'Lazy children via `loadChildren(node)`, sync or async, with error callback',
        'Built-in filter input that auto-opens matching branches and highlights hits',
        'Complete WAI-ARIA keyboard model with type-ahead',
        'Enhances nested `<ul>` markup with `init()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'File tree',
            description: 'Nested `children` arrays. Click a node to select it; click the chevron or press Right/Left to expand and collapse.',
            height: 280,
            code: `const tree = ChillTree.create({
  nodes: [
    { id: 'src', label: 'src', expanded: true, children: [
      { id: 'index', label: 'index.js' },
      { id: 'components', label: 'components', children: [{ id: 'button', label: 'Button.js' }, { id: 'card', label: 'Card.js' }] },
    ] },
    { id: 'docs', label: 'docs', children: [{ id: 'readme', label: 'README.md' }] },
    { id: 'pkg', label: 'package.json' },
  ],
  onSelect: (node) => console.log('selected', node.id),
});
root.append(tree.element);
cleanup(() => tree.destroy());`,
        },
        {
            id: 'checkable',
            title: 'Checkable tree',
            description: '`checkable: true` shows checkboxes. Checking a parent checks all its children; a partly checked parent shows the mixed state.',
            height: 300,
            code: `const out = document.createElement('p');
out.style.cssText = 'color:var(--chill-text);font-size:13px';
const tree = ChillTree.create({
  checkable: true,
  expandAll: true,
  nodes: [
    { id: 'read', label: 'Read access', children: [{ id: 'r-docs', label: 'Documents' }, { id: 'r-bill', label: 'Billing' }] },
    { id: 'write', label: 'Write access', children: [{ id: 'w-docs', label: 'Documents', checked: true }, { id: 'w-team', label: 'Team settings' }] },
  ],
  onCheck: (ids) => { out.textContent = 'Checked: ' + (ids.join(', ') || 'none'); },
});
root.append(tree.element, out);
tree.setChecked('read', true);
cleanup(() => tree.destroy());`,
        },
        {
            id: 'search',
            title: 'Searchable tree',
            description: '`searchable: true` adds a filter input. Matches expand their ancestors automatically; supply `filterFn` for custom matching.',
            height: 320,
            code: `const tree = ChillTree.create({
  searchable: true,
  placeholder: 'Filter countries...',
  nodes: [
    { id: 'eu', label: 'Europe', children: [{ id: 'fr', label: 'France' }, { id: 'de', label: 'Germany' }, { id: 'it', label: 'Italy' }] },
    { id: 'as', label: 'Asia', children: [{ id: 'jp', label: 'Japan' }, { id: 'in', label: 'India' }, { id: 'id', label: 'Indonesia' }] },
    { id: 'am', label: 'Americas', children: [{ id: 'br', label: 'Brazil' }, { id: 'ca', label: 'Canada' }] },
  ],
});
root.append(tree.element);
const t = setTimeout(() => tree.filter('ind'), 600);
cleanup(() => { clearTimeout(t); tree.destroy(); });`,
        },
        {
            id: 'lazy',
            title: 'Lazy-loaded children',
            description: 'Mark a node `hasChildren: true` and return its children from `loadChildren`. A loading state is shown until the promise resolves.',
            height: 260,
            code: `const tree = ChillTree.create({
  nodes: [
    { id: 'team', label: 'Teams', hasChildren: true },
    { id: 'archive', label: 'Archive', hasChildren: true },
  ],
  loadChildren: async (node) => {
    await new Promise((r) => setTimeout(r, 700));      // pretend network
    return [1, 2, 3].map((n) => ({ id: node.id + '-' + n, label: node.label + ' item ' + n }));
  },
  onLoad: (node, children) => console.log('loaded', node.id, children.length),
});
root.append(tree.element);
const t = setTimeout(() => tree.expand('team'), 500);
cleanup(() => { clearTimeout(t); tree.destroy(); });`,
        },
        {
            id: 'multiple',
            title: 'Multiple selection and API',
            description: '`multiple: true` lets users Ctrl/Cmd+click several nodes. Control the tree from code with `select()`, `getSelected()`, `expandAll()` and `collapseAll()`.',
            height: 300,
            code: `const tree = ChillTree.create({
  multiple: true,
  nodes: [
    { id: 'inbox', label: 'Inbox', icon: '✉' },
    { id: 'work', label: 'Work', icon: '💼', children: [{ id: 'proj-a', label: 'Project A' }, { id: 'proj-b', label: 'Project B' }] },
    { id: 'trash', label: 'Trash', icon: '🗑', disabled: true },
  ],
});
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap';
[['Expand all', () => tree.expandAll()], ['Collapse all', () => tree.collapseAll()], ['Select Inbox', () => tree.select('inbox')]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(tree.element, bar);
cleanup(() => tree.destroy());`,
        },
        {
            id: 'init-list',
            title: 'Enhance a nested list',
            description: '`init()` converts a nested `<ul>` (with optional `data-id` on each `<li>`) into a tree.',
            height: 240,
            code: `root.innerHTML = '<ul id="menu"><li data-id="a">Fruit<ul><li data-id="a1">Apple</li><li data-id="a2">Pear</li></ul></li><li data-id="b">Vegetables<ul><li>Carrot</li></ul></li></ul>';
const tree = ChillTree.init('#menu', { expandAll: true });
cleanup(() => tree.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Node shape',
            body:
                'A node is `{ id, label, icon?, children?, hasChildren?, expanded?, checked?, disabled?, data? }`. `id` is the key you use in `select(id)`, `expand(id)` and `setChecked(id, bool)`; ' +
                'keep ids unique across the whole tree. `data` carries your own payload and comes back on callbacks.\n\n' +
                'Callbacks receive a public snapshot `{ id, label, data, checked, mixed, expanded, selected, disabled, raw }`, where `raw` is the object you passed in.',
        },
        {
            title: 'Lazy loading',
            body:
                'Give a node `hasChildren: true` and no `children`. On first expand ChillTree calls `loadChildren(node)` and renders whatever array it resolves to. ' +
                'If it rejects, `onError(node, err)` fires and the node stays collapsed so the user can retry.\n\n' +
                '```js\nloadChildren: (node) => fetch("/api/children/" + node.id).then((r) => r.json())\n```\n\n' +
                'Checked parents pass their state to lazily loaded children.',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** builds a `<div>` in `tree.element`; append it yourself.\n' +
                '- **`init(target, options)`** accepts a selector or element. A nested `<ul>` / `<ol>` is replaced by a wrapper `<div>` (restored on `destroy()`); ' +
                'any other container is emptied and filled. Pass `nodes` to skip reading the markup. Returns `null` if the target is not found.',
        },
    ],
    options: [
        { name: 'nodes', type: 'TreeNode[]', default: '[]', description: 'Root nodes.' },
        { name: 'nodes[].id', type: 'string | number', default: '-', description: 'Unique id used by the API and callbacks.' },
        { name: 'nodes[].label', type: 'string', default: '-', description: 'Display text.' },
        { name: 'nodes[].icon', type: 'string | Node', default: '-', description: 'Icon before the label (text or node; HTML when `html` is true).' },
        { name: 'nodes[].children', type: 'TreeNode[]', default: '-', description: 'Child nodes.' },
        { name: 'nodes[].hasChildren', type: 'boolean', default: 'false', description: 'Node has children to load lazily via `loadChildren`.' },
        { name: 'nodes[].expanded', type: 'boolean', default: 'false', description: 'Start expanded.' },
        { name: 'nodes[].checked', type: 'boolean', default: 'false', description: 'Start checked (with `checkable`).' },
        { name: 'nodes[].disabled', type: 'boolean', default: 'false', description: 'Not selectable, checkable or expandable.' },
        { name: 'nodes[].data', type: 'any', default: '-', description: 'Your own payload, returned in callbacks.' },
        { name: 'checkable', type: 'boolean', default: 'false', description: 'Show tri-state checkboxes; parents cascade to children.' },
        { name: 'selectable', type: 'boolean', default: 'true', description: 'Click or Enter selects a node.' },
        { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow several selected nodes (Ctrl/Cmd+click).' },
        { name: 'searchable', type: 'boolean', default: 'false', description: 'Render a filter input above the tree.' },
        { name: 'placeholder', type: 'string', default: "'Filter…'", description: 'Placeholder of the filter input.' },
        { name: 'loadChildren', type: '(node) => Promise<TreeNode[]> | TreeNode[]', default: 'null', description: 'Loads children on first expand of a lazy node.' },
        { name: 'filterFn', type: '(node, query) => boolean', default: 'case-insensitive label match', description: 'Custom matcher for the filter.' },
        { name: 'expandAll', type: 'boolean', default: 'false', description: 'Expand every loaded branch initially.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat labels and icons as HTML (unsafe with untrusted data).' },
        { name: 'ariaLabel', type: 'string', default: "'Tree'", description: 'Accessible name of the tree.' },
        { name: 'onSelect', type: '(node) => void', default: 'null', description: 'A node was selected.' },
        { name: 'onCheck', type: '(checkedIds, node) => void', default: 'null', description: 'Checked state changed.' },
        { name: 'onExpand / onCollapse', type: '(node) => void', default: 'null', description: 'A branch opened or closed.' },
        { name: 'onLoad', type: '(node, children) => void', default: 'null', description: 'Lazy children finished loading.' },
        { name: 'onError', type: '(node, error) => void', default: 'null', description: '`loadChildren` threw or rejected.' },
    ],
    methods: [
        { signature: 'ChillTree.create(options)', on: 'static', description: 'Create a tree instance; append `instance.element` yourself.' },
        { signature: 'ChillTree.init(target, options)', on: 'static', description: 'Enhance a nested list or container; returns an instance or `null`.' },
        { signature: 'ChillTree.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'tree.element', description: 'The root `<div>`.' },
        { signature: 'tree.setNodes(nodes)', description: 'Replace the whole tree.' },
        { signature: 'tree.getNode(id)', description: 'Public snapshot of a node, or `null`.' },
        { signature: 'tree.expand(id) / collapse(id) / toggle(id)', description: 'Open, close or toggle a branch (a lazy node starts loading).' },
        { signature: 'tree.expandAll() / collapseAll()', description: 'Open or close every branch.' },
        { signature: 'tree.select(id) / getSelected()', description: 'Select a node; get all selected snapshots.' },
        { signature: 'tree.setChecked(id, bool) / getChecked()', description: 'Check or uncheck a node; get ids of fully checked nodes.' },
        { signature: 'tree.filter(query)', description: 'Filter by query (an empty string clears the filter).' },
        { signature: 'tree.focus(id)', description: 'Move keyboard focus to a node.' },
        { signature: 'tree.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'tree.destroy()', description: 'Remove listeners and generated DOM.' },
    ],
    events: [
        { name: 'select', payload: '(node)', description: 'A node was selected.' },
        { name: 'check', payload: '(checkedIds, node)', description: 'A checkbox changed.' },
        { name: 'expand', payload: '(node)', description: 'A branch expanded.' },
        { name: 'collapse', payload: '(node)', description: 'A branch collapsed.' },
        { name: 'load', payload: '(node, children)', description: 'Lazy children loaded.' },
        { name: 'error', payload: '(node, error)', description: 'Lazy loading failed.' },
    ],
    cssVars: [
        { name: '--chilltree-text / --chilltree-muted', description: 'Label and secondary colours.' },
        { name: '--chilltree-bg', description: 'Tree background.' },
        { name: '--chilltree-hover', description: 'Row hover background.' },
        { name: '--chilltree-selected-bg', description: 'Selected row background.' },
        { name: '--chilltree-primary', description: 'Focus ring and checkbox accent.' },
        { name: '--chilltree-border', description: 'Filter input border.' },
    ],
    a11y: [
        'Uses `role="tree"`, `role="treeitem"` and `role="group"` with `aria-level`, `aria-expanded` and `aria-selected` / `aria-checked`.',
        'Roving tabindex: one tab stop; Up/Down move, Right expands or moves to the first child, Left collapses or moves to the parent, Home/End jump.',
        'Enter selects; Space toggles the checkbox (or selects when not checkable); `*` expands siblings; typing letters jumps to a matching label.',
        'The filter input has an `aria-label` and a "No matches" status region.',
    ],
    tips: [
        'Keep ids unique across the whole tree; duplicate ids make `select(id)` ambiguous.',
        'For thousands of nodes, prefer lazy loading over rendering everything with `expandAll`.',
        'The module is safe to import on the server; create the tree in the browser, and call `destroy()` in the React effect cleanup.',
    ],
    related: ['accordion', 'timeline', 'checkbox', 'treeselect'],
    keywords: ['treeview', 'file explorer', 'hierarchy', 'nested', 'folder', 'outline'],
};

export default doc;
