import type { DocEntry } from '../../types';

// The layout is min-height:100vh with sticky header/sidebars. Inside the doc preview we contain it in a scroll box.
const BOX = `const demo = document.createElement('div');
demo.className = 'layout-demo';
demo.style.cssText = 'position:relative;transform:translateZ(0);height:300px;overflow:auto;border:1px solid var(--chill-border);border-radius:10px';
const css = document.createElement('style');
css.textContent = '.layout-demo .chilllayout{min-height:100%} .layout-demo .chilllayout-header{top:0} .layout-demo .chilllayout-sidebar{top:0;height:auto}';
const mount = document.createElement('div');
demo.append(css, mount);
root.append(demo);
const box = (text) => { const d = document.createElement('div'); d.style.cssText = 'padding:16px;font-size:14px'; d.textContent = text; return d; };`;

const doc: DocEntry = {
    id: 'layout',
    global: 'ChillLayout',
    category: 'navigation',
    title: 'Layout',
    summary: 'Page shell with header, sidebars, content and footer slots, plus grid, stack and container helpers.',
    style: 'init',
    description:
        'ChillLayout builds the classic application shell: a sticky header, a left and/or right sidebar, a centred content container and a footer. ' +
        'Each slot takes a DOM node or text, so you can drop ChillNavbar, ChillFooter or your own markup straight in. On screens up to 768px the left sidebar becomes an off-canvas drawer.\n\n' +
        '`ChillLayout.init(target, options)` replaces the target element (which must be in the DOM). Four helpers (`createGrid`, `createContainer`, `createStack`, `createCard`) return pre-classed elements for composing page content. ' +
        'String slots are **text** unless you pass `html: true` (trusted markup only).',
    features: [
        'Header, left and right sidebars, main content and footer slots',
        'Mobile off-canvas drawer with backdrop, Esc to close and focus restore',
        'Optional skip link and labelled landmarks for screen readers',
        'Content container sizes `sm` to `full`',
        'Helpers: `createGrid`, `createContainer`, `createStack`, `createCard`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Header, sidebar, content and footer',
            description: 'Pass nodes or text to each slot. The header is sticky and the sidebar scrolls on its own.',
            height: 340,
            code: `${BOX}
const layout = ChillLayout.init(mount, {
  header: box('Header: logo and navigation'),
  sidebar: box('Sidebar: filters or menu'),
  content: box('Main content goes here. Content is centred in a container.'),
  footer: box('Footer: © 2025 Acme'),
  containerSize: 'lg',
});
cleanup(() => layout.destroy());`,
        },
        {
            id: 'helpers',
            title: 'Grid, stack and card helpers',
            description: '`createGrid(columns, gap)` makes a responsive grid (collapsing to one column on mobile), `createCard()` a bordered surface and `createStack(gap)` evenly spaced children.',
            height: 340,
            code: `${BOX}
const stack = ChillLayout.createStack(4);
const title = document.createElement('h3');
title.textContent = 'Overview';
title.style.margin = '0';
const grid = ChillLayout.createGrid(3, 4);
['Revenue', 'Users', 'Churn'].forEach((label, i) => {
  const card = ChillLayout.createCard();
  const body = document.createElement('div');
  body.className = 'chilllayout-card-body';
  body.textContent = label + ': ' + [48200, 1294, 2.1][i];
  card.append(body);
  grid.append(card);
});
stack.append(title, grid);
const layout = ChillLayout.init(mount, { content: stack, containerSize: 'full' });
cleanup(() => layout.destroy());`,
        },
        {
            id: 'compose',
            title: 'Compose with other components',
            description: 'Slots accept any node, so you can init other components inside them. The navbar goes into `regions.header` after the layout is created.',
            height: 340,
            code: `${BOX}
const navMount = document.createElement('div');
const crumbMount = document.createElement('div');
const content = document.createElement('div');
content.append(crumbMount, box('Order #1042 details'));
const layout = ChillLayout.init(mount, { header: navMount, content, containerSize: 'lg' });
const nav = ChillNavbar.init(navMount, {
  brand: { name: 'Shopfront' },
  links: [{ label: 'Orders', href: '#orders', active: true }, { label: 'Customers', href: '#customers' }],
  onLinkClick: (e) => e.preventDefault(),
});
const crumbs = ChillBreadcrumb.init(crumbMount, {
  items: [{ label: 'Orders', href: '#orders' }, { label: '#1042' }],
  onItemClick: (e) => e.preventDefault(),
});
cleanup(() => { crumbs.destroy(); nav.destroy(); layout.destroy(); });`,
        },
        {
            id: 'dynamic',
            title: 'Right sidebar and updating slots',
            description: 'Add `sidebarRight` for an inspector panel, then change any slot with `setContent`, `setSidebar`, `setHeader` or `setFooter`.',
            height: 360,
            code: `${BOX}
const layout = ChillLayout.init(mount, {
  header: box('Header'),
  sidebar: box('Left sidebar'),
  sidebarRight: box('Inspector'),
  content: box('Click the button to swap the content.'),
  footer: box('Footer'),
  skipLink: true,
});
const btn = ChillButton.create({ text: 'Update slots', size: 'sm' });
let n = 0;
btn.onclick = () => {
  n++;
  layout.setContent(box('Content updated ' + n + ' times'));
  layout.setSidebar(box('Inspector item ' + n), 'right');
  layout.setFooter(box('Footer saw ' + n + ' updates'));
};
layout.regions.header.replaceChildren(btn);
cleanup(() => layout.destroy());`,
        },
        {
            id: 'drawer',
            title: 'Mobile sidebar drawer',
            description: 'Below 768px the left sidebar is hidden off-canvas. `sidebarToggle` wires a button to `toggleSidebar()`, which also works from code. Resize the window to try it.',
            height: 320,
            code: `${BOX}
const toggle = ChillButton.create({ text: '☰ Menu', size: 'sm', variant: 'outline' });
const header = document.createElement('div');
header.style.cssText = 'padding:12px 16px';
header.append(toggle);
const layout = ChillLayout.init(mount, {
  header,
  sidebar: box('Navigation drawer (visible inline on wide screens)'),
  content: box('Open the drawer with the Menu button on a narrow screen.'),
  sidebarToggle: toggle,
});
cleanup(() => layout.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Structure and slots',
            body:
                'The generated markup is `div.chilllayout > header, div.body > (aside, main, aside), footer`. Slots are optional; without `header` the sidebar sticks to the very top. ' +
                'The root has `min-height: 100vh`, the header and sidebars are sticky, so use the layout as the page shell (one per page).\n\n' +
                'After `init` you can reach every region through `layout.regions` (`header`, `sidebar`, `sidebarRight`, `main`, `content`, `footer`) to init other components inside them.',
        },
        {
            title: 'Text, nodes and HTML',
            body:
                'Slot values can be a DOM node (appended as-is), text, or HTML. Strings are inserted as **text** by default. Pass `html: true` to parse strings as markup, or do it per call:\n\n' +
                '```js\nlayout.setContent("<h1>Hello</h1>", { html: true });\n```\n\n' +
                'Only use HTML with trusted, sanitised content. Passing `false`, `null` or `undefined` clears a slot.',
        },
        {
            title: 'Helper classes',
            body:
                '`createGrid(columns 1-6, gap 0-12)`, `createStack(gap 1-8)`, `createContainer(size)` and `createCard()` return elements with the right classes and inject the stylesheet. Out-of-range values are clamped, so they can never produce arbitrary class names. ' +
                'Grids with 2+ columns collapse to a single column at 768px or less; 4 to 6 columns drop to 2 between 768px and 1024px.',
        },
    ],
    options: [
        { name: 'header', type: 'Node | string', default: 'null', description: 'Header slot (sticky, height `--chilllayout-header-height`). Omit for no header.' },
        { name: 'sidebar', type: 'Node | string', default: 'null', description: 'Left sidebar slot. Becomes an off-canvas drawer at 768px or less.' },
        { name: 'sidebarRight', type: 'Node | string', default: 'null', description: 'Right sidebar slot (hidden at 768px or less).' },
        { name: 'content', type: 'Node | string', default: 'null', description: 'Main content, rendered inside a centred container.' },
        { name: 'footer', type: 'Node | string', default: 'null', description: 'Footer slot.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Parse string slots as HTML (trusted markup only).' },
        { name: 'containerSize', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'xl'", description: 'Max width of the content container (640 / 768 / 1024 / 1280px / none). Invalid values fall back to `xl`.' },
        { name: 'skipLink', type: 'boolean', default: 'false', description: 'Add a "skip to content" link that focuses `<main>`.' },
        { name: 'skipLinkText', type: 'string', default: "'Skip to content'", description: 'Text of the skip link.' },
        { name: 'sidebarLabel', type: 'string', default: "'Sidebar'", description: '`aria-label` of the left sidebar.' },
        { name: 'sidebarRightLabel', type: 'string', default: "'Secondary sidebar'", description: '`aria-label` of the right sidebar.' },
        { name: 'sidebarToggle', type: 'string | Element', default: 'null', description: 'Button that toggles the mobile drawer (gets `aria-controls` / `aria-expanded`). Needs a left sidebar.' },
    ],
    methods: [
        { signature: 'ChillLayout.init(target, options)', on: 'static', description: 'Render the layout in place of `target` and return an instance.' },
        { signature: 'ChillLayout.createGrid(columns, gap)', on: 'static', description: 'Grid element (columns 1-6, default 1; gap 0-12, default 6 = 24px).' },
        { signature: 'ChillLayout.createContainer(size)', on: 'static', description: 'Centred container element of the given size (default `xl`).' },
        { signature: 'ChillLayout.createStack(gap)', on: 'static', description: 'Vertical stack with spacing between children (gap 1-8, default 4 = 16px).' },
        { signature: 'ChillLayout.createCard()', on: 'static', description: 'Bordered card surface. Add `chilllayout-card-header`, `-body` or `-footer` children.' },
        { signature: 'ChillLayout.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.layout / instance.regions', description: 'The root element and `{ header, sidebar, sidebarRight, main, content, footer }` (missing slots are undefined).' },
        { signature: 'instance.setContent(content, { html? })', description: 'Replace the main content.' },
        { signature: 'instance.setSidebar(content, side?, { html? })', description: 'Replace a sidebar; `side` is `"left"` (default) or `"right"`.' },
        { signature: 'instance.setHeader(content, { html? }) / setFooter(...)', description: 'Replace the header or footer (only if that slot was created).' },
        { signature: 'instance.openSidebar() / closeSidebar() / toggleSidebar()', description: 'Control the mobile drawer. Returns the instance.' },
        { signature: 'instance.isSidebarOpen', description: 'Whether the drawer is open.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    cssVars: [
        { name: '--chilllayout-bg / --chilllayout-text', description: 'Page background and text colour.' },
        { name: '--chilllayout-border', description: 'Dividers between regions.' },
        { name: '--chilllayout-sidebar-width', description: 'Sidebar width (default 260px).' },
        { name: '--chilllayout-header-height', description: 'Header height (default 64px).' },
        { name: '--chilllayout-ring', description: 'Focus ring colour (skip link).' },
    ],
    a11y: [
        'Uses landmarks: `<header>`, `<aside aria-label>`, `<main tabindex="-1">` and `<footer>`.',
        '`skipLink: true` adds a link that appears on focus and moves focus to `<main>`.',
        'Mobile drawer: focus moves into the sidebar on open, Esc or a backdrop click closes it and restores the previous focus; the closed drawer is `visibility: hidden`.',
    ],
    tips: [
        'The layout is meant as the page shell; for embedded previews contain it in a scrolling box and override `min-height` and the sticky offsets.',
        'Combine with `ChillNavbar` in the header slot (init it after the layout exists) and `ChillFooter` in the footer slot.',
        'The mobile breakpoint is fixed at 768px and the toggle button must live outside the sidebar (typically in the header).',
    ],
    related: ['navbar', 'sidebar', 'footer', 'splitter'],
    keywords: ['shell', 'page', 'grid', 'container', 'stack', 'app shell', 'drawer'],
};

export default doc;
