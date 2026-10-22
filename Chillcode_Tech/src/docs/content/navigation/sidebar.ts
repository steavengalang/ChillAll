import type { DocEntry } from '../../types';

// The sidebar is position:fixed; a transform on the box makes it (and its backdrop) fixed relative to the box.
const BOX = `const box = document.createElement('div');
box.style.cssText = 'position:relative;transform:translateZ(0);height:340px;overflow:hidden;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary)';
const mount = document.createElement('div');
const page = document.createElement('div');
page.style.cssText = 'margin-left:260px;padding:20px;color:var(--chill-text);font-size:14px';
box.append(mount, page);
root.append(box);`;

const doc: DocEntry = {
    id: 'sidebar',
    global: 'ChillSidebar',
    category: 'navigation',
    title: 'Sidebar',
    summary: 'Collapsible app sidebar with sections, submenus, badges and an off-canvas drawer on mobile.',
    style: 'init',
    description:
        'ChillSidebar is the left-hand navigation for dashboards and docs. Describe sections, items and nested submenus as data; it renders an `<aside>` with a collapse button, keyboard navigation and a remembered collapsed state.\n\n' +
        'On screens up to 768px it turns into an off-canvas drawer with a backdrop, scroll lock and focus restore. `ChillSidebar.init(target, options)` replaces the target element, which must be in the DOM. ' +
        'The sidebar is `position: fixed` to the left edge of the viewport, so give your page content a matching left margin (`--chillsidebar-width`, 260px by default).',
    features: [
        'Sections, items with icons and badges, and expandable submenus',
        'Collapse to an icon rail (72px) with optional persistence in `localStorage`',
        'Off-canvas drawer on mobile with backdrop, Esc to close and focus restore',
        'Arrow / Home / End keyboard navigation and correct ARIA state',
        'Text-only rendering by default; icons accept text or DOM nodes',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Sections and badges',
            description: 'Group items into sections, show an unread badge and track the active item with `setActiveItem`.',
            height: 360,
            code: `${BOX}
page.textContent = 'Select an item in the sidebar.';
const sb = ChillSidebar.init(mount, {
  brand: { name: 'Acme' },
  activeItem: 'home',
  items: [
    { type: 'section', label: 'Main', items: [
      { id: 'home', label: 'Home', icon: '🏠', href: '#home' },
      { id: 'inbox', label: 'Inbox', icon: '📥', href: '#inbox', badge: 4 },
      { id: 'tasks', label: 'Tasks', icon: '✅', href: '#tasks' },
    ] },
    { type: 'section', label: 'Account', items: [
      { id: 'settings', label: 'Settings', icon: '⚙️', href: '#settings' },
    ] },
  ],
  onItemClick: (id, e) => { e.preventDefault(); sb.setActiveItem(id); page.textContent = 'Opened: ' + id; },
});
cleanup(() => sb.destroy());`,
        },
        {
            id: 'submenus',
            title: 'Submenus and footer',
            description: 'An item with `children` becomes an expandable group (`aria-expanded`). A group opens automatically if it contains the active item. `footer` takes text or a node.',
            height: 380,
            code: `${BOX}
page.textContent = 'Groups toggle on click; children are regular links.';
const sb = ChillSidebar.init(mount, {
  brand: { name: 'Dash' },
  activeItem: 'daily',
  items: [
    { id: 'overview', label: 'Overview', icon: '📊', href: '#overview' },
    { id: 'reports', label: 'Reports', icon: '📈', children: [
      { id: 'daily', label: 'Daily', href: '#daily' },
      { id: 'weekly', label: 'Weekly', href: '#weekly' },
      { id: 'monthly', label: 'Monthly', href: '#monthly' },
    ] },
    { id: 'team', label: 'Team', icon: '👥', href: '#team' },
  ],
  footer: 'Signed in as alex@example.com',
  onItemClick: (id, e) => { e.preventDefault(); sb.setActiveItem(id); page.textContent = 'Opened: ' + id; },
});
cleanup(() => sb.destroy());`,
        },
        {
            id: 'collapse',
            title: 'Collapse and expand',
            description: 'The header button collapses the sidebar to an icon rail. Control it from code with `collapse()`, `expand()` and `toggleCollapse()`, and react with `on("collapse")`.',
            height: 340,
            code: `${BOX}
const status = document.createElement('p');
status.textContent = 'Expanded';
const toggle = ChillButton.create({ text: 'Toggle from code', size: 'sm', variant: 'outline' });
page.append(status, toggle);
const sb = ChillSidebar.init(mount, {
  brand: { name: 'Acme' },
  collapsed: false,
  items: [
    { id: 'home', label: 'Home', icon: '🏠', href: '#h' },
    { id: 'files', label: 'Files', icon: '📁', href: '#f', badge: 12 },
    { id: 'chat', label: 'Chat', icon: '💬', href: '#c' },
  ],
  onItemClick: (id, e) => e.preventDefault(),
});
const off = sb.on('collapse', (isCollapsed) => {
  status.textContent = isCollapsed ? 'Collapsed' : 'Expanded';
  page.style.marginLeft = isCollapsed ? '72px' : '260px';
});
toggle.onclick = () => sb.toggleCollapse();
cleanup(() => { off(); sb.destroy(); });`,
        },
        {
            id: 'item-click',
            title: 'Per-item handlers',
            description: 'Items accept their own `onClick`, handy for actions such as "Log out" that do not navigate anywhere.',
            height: 340,
            code: `${BOX}
page.textContent = 'Click "Log out" in the sidebar.';
const sb = ChillSidebar.init(mount, {
  brand: { name: 'Studio' },
  items: [
    { id: 'projects', label: 'Projects', icon: '🗂️', href: '#projects' },
    { id: 'billing', label: 'Billing', icon: '💳', href: '#billing' },
    { id: 'logout', label: 'Log out', icon: '🚪', onClick: (e) => { e.preventDefault(); page.textContent = 'Logged out (demo).'; } },
  ],
  onItemClick: (id, e) => e.preventDefault(),
});
cleanup(() => sb.destroy());`,
        },
        {
            id: 'mobile',
            title: 'Mobile drawer API',
            description: 'Below 768px the sidebar slides in as a drawer. `mobileToggle` wires an external button to it, and `openMobile()` / `closeMobile()` give you manual control. Resize the window to see it.',
            height: 340,
            code: `${BOX}
const menuBtn = ChillButton.create({ text: '☰ Menu', size: 'sm', variant: 'outline' });
const status = document.createElement('p');
status.textContent = 'Drawer closed';
page.append(menuBtn, status);
const sb = ChillSidebar.init(mount, {
  brand: { name: 'Acme' },
  mobileToggle: menuBtn,
  items: [{ id: 'a', label: 'Dashboard', icon: '📊', href: '#a' }, { id: 'b', label: 'Orders', icon: '📦', href: '#b' }],
  onItemClick: (id, e) => e.preventDefault(),
  onMobileToggle: (open) => { status.textContent = open ? 'Drawer open' : 'Drawer closed'; },
});
cleanup(() => sb.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Layout and positioning',
            body:
                'The sidebar is `position: fixed; top: 0; left: 0; bottom: 0` with `z-index: 100`. Add `margin-left: var(--chillsidebar-width)` to your main content (or `--chillsidebar-collapsed-width` when collapsed; react with `onCollapse`). ' +
                '`ChillLayout` can do this wiring for you. To contain the sidebar inside a card or preview, give the wrapper `position: relative` **and** a `transform`, which makes fixed descendants relative to it.\n\n' +
                'The target element must already be in the DOM: the sidebar (and a backdrop element) are inserted around it and `destroy()` restores it.',
        },
        {
            title: 'Persisting collapsed state',
            body:
                'Pass a `storageKey` and the collapsed flag is read on init and written on every change to `localStorage` (blocked storage is ignored silently). A stored value overrides the `collapsed` option.\n\n' +
                '```js\nChillSidebar.init("#sidebar", { items, storageKey: "app-sidebar" });\n```',
        },
        {
            title: 'Mobile behaviour',
            body:
                'At `max-width: 768px` the sidebar is hidden (`visibility: hidden`, so it has no tab stops) until `openMobile()` runs. Opening moves focus inside, locks page scroll and shows a backdrop; Esc, a backdrop click or choosing an item closes it and restores the previous focus. ' +
                'Resizing past 768px closes it automatically.',
        },
    ],
    options: [
        { name: 'brand', type: '{ name?: string, logo?: string, href?: string }', default: 'null', description: 'Brand link in the header. `href` defaults to `/`.' },
        { name: 'items', type: 'Item[]', default: '[]', description: 'Items or `{ type: "section", label, items }` groups.' },
        { name: 'items[].id', type: 'string', default: 'undefined', description: 'Identifier passed to `onItemClick` and used by `activeItem` / `setActiveItem`.' },
        { name: 'items[].label', type: 'string', default: "''", description: 'Item text (also the native tooltip and the name when collapsed).' },
        { name: 'items[].href', type: 'string', default: "'#'", description: 'Link destination (dangerous schemes are neutralised).' },
        { name: 'items[].icon', type: 'string | Element', default: 'undefined', description: 'Icon: text unless `html: true`; elements are cloned.' },
        { name: 'items[].badge', type: 'string | number', default: 'undefined', description: 'Small pill at the right; `0` is shown, `""`, `null` and `false` are hidden.' },
        { name: 'items[].onClick', type: '(event: MouseEvent) => void', default: 'undefined', description: 'Per-item click handler, called before `onItemClick`.' },
        { name: 'items[].children', type: '{ id, label, href }[]', default: 'undefined', description: 'Submenu entries; turns the item into an expandable group.' },
        { name: 'activeItem', type: 'string | null', default: 'null', description: 'Id of the active item (adds `aria-current="page"`; its parent group starts open).' },
        { name: 'footer', type: 'string | Node', default: 'null', description: 'Footer content: text, or a DOM node.' },
        { name: 'footerHtml', type: 'string', default: 'null', description: 'Explicit trusted HTML for the footer.' },
        { name: 'collapsed', type: 'boolean', default: 'false', description: 'Start collapsed to the icon rail.' },
        { name: 'collapsible', type: 'boolean', default: 'true', description: 'Show the collapse button.' },
        { name: 'storageKey', type: 'string | null', default: 'null', description: '`localStorage` key to persist the collapsed state.' },
        { name: 'mobileToggle', type: 'string | Element', default: 'null', description: 'External button that toggles the mobile drawer.' },
        { name: 'ariaLabel', type: 'string', default: "'Sidebar'", description: 'Accessible name of the inner `<nav>`.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string icons (and a string `footer`) as HTML. Trusted markup only.' },
        { name: 'onItemClick', type: '(id: string, event: MouseEvent) => void', default: 'null', description: 'Called for non-group items and submenu links.' },
        { name: 'onCollapse', type: '(collapsed: boolean) => void', default: 'null', description: 'Called when the collapsed state changes.' },
        { name: 'onMobileToggle', type: '(open: boolean) => void', default: 'null', description: 'Called when the mobile drawer opens or closes.' },
    ],
    methods: [
        { signature: 'ChillSidebar.init(target, options)', on: 'static', description: 'Render a sidebar in place of `target` and return an instance.' },
        { signature: 'ChillSidebar.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.sidebar / instance.overlay', description: 'The `<aside>` element and the mobile backdrop element.' },
        { signature: 'instance.isCollapsed / instance.isMobileOpen', description: 'Current state flags.' },
        { signature: 'instance.collapse() / expand() / toggleCollapse()', description: 'Change the collapsed state.' },
        { signature: 'instance.openMobile() / closeMobile() / toggleMobile()', description: 'Control the mobile drawer.' },
        { signature: 'instance.setActiveItem(id)', description: 'Mark the item (or submenu link) with this id active; pass `null` to clear.' },
        { signature: 'instance.on("collapse" | "mobile", fn)', description: 'Subscribe to changes with `fn(value, instance)`. Returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and backdrop and restore the original element.' },
    ],
    events: [
        { name: 'collapse', payload: '(isCollapsed: boolean, instance)', description: 'Collapsed state changed.' },
        { name: 'mobile', payload: '(isOpen: boolean, instance)', description: 'Mobile drawer opened or closed.' },
    ],
    cssVars: [
        { name: '--chillsidebar-bg / --chillsidebar-text', description: 'Sidebar surface and text colours.' },
        { name: '--chillsidebar-active / --chillsidebar-active-text', description: 'Background and text of the active item.' },
        { name: '--chillsidebar-hover', description: 'Hover background.' },
        { name: '--chillsidebar-width', description: 'Expanded width (default 260px).' },
        { name: '--chillsidebar-collapsed-width', description: 'Collapsed width (default 72px).' },
        { name: '--chillsidebar-border', description: 'Right border colour.' },
    ],
    a11y: [
        'Renders `<aside>` containing `<nav aria-label>`; the active item has `aria-current="page"`.',
        'The collapse button has `aria-expanded` / `aria-controls`; groups expose `aria-expanded` and `aria-controls`, and closed submenus are not focusable.',
        'ArrowUp / ArrowDown / Home / End move between items; collapsed items keep their name through a `title` tooltip.',
        'Mobile drawer: focus moves in on open, Esc / backdrop click / item choice closes and restores focus; closed state is `visibility: hidden`.',
    ],
    tips: [
        'Keep `id` values unique: they identify items for `activeItem`, `setActiveItem` and `onItemClick`.',
        'Call `setActiveItem()` from your router so the highlight follows navigation, including back/forward.',
        'In React/Vue, init in an effect against a placeholder element and call `destroy()` on unmount.',
    ],
    related: ['navbar', 'layout', 'tabs', 'breadcrumb'],
    keywords: ['drawer', 'side menu', 'dashboard', 'rail', 'collapsible'],
};

export default doc;
