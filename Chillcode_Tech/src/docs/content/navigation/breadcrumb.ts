import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'breadcrumb',
    global: 'ChillBreadcrumb',
    category: 'navigation',
    title: 'Breadcrumb',
    summary: 'Accessible breadcrumb trail with separators, sizes, a home icon and a collapsing "..." menu.',
    style: 'init',
    description:
        'ChillBreadcrumb renders the path to the current page as a semantic `<nav><ol>` list. The last crumb is marked `aria-current="page"`, separators are hidden from screen readers, ' +
        'and long trails can collapse their middle into a keyboard-accessible "..." menu with `maxItems`.\n\n' +
        '`ChillBreadcrumb.init(target, options)` replaces the target element (which must be in the DOM). Labels and hrefs are inserted as text/attributes, so user data is safe.',
    features: [
        'Semantic `<nav aria-label>` + `<ol>`, last item marked `aria-current="page"`',
        'Built-in separators (chevron, slash, arrow, dot) or any text / element',
        'Collapse long trails into a "..." menu with `maxItems`',
        'Three sizes, optional contained pill background and home icon',
        '`setItems()` re-renders the trail when the route changes',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic trail',
            description: 'Items with an `href` are links; the last one is the current page.',
            code: `const mount = document.createElement('div');
root.append(mount);
const bc = ChillBreadcrumb.init(mount, {
  items: [
    { label: 'Home', href: '#' },
    { label: 'Library', href: '#library' },
    { label: 'Data', href: '#data' },
    { label: 'Annual report' },
  ],
  onItemClick: (e) => e.preventDefault(),
});
cleanup(() => bc.destroy());`,
        },
        {
            id: 'separators',
            title: 'Separators, sizes and contained',
            description: 'Pick a separator by name (`chevron`, `slash`, `arrow`, `dot`) or pass any text. `contained` adds a rounded background.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const items = [{ label: 'Shop', href: '#' }, { label: 'Shoes', href: '#s' }, { label: 'Trail runners' }];
const made = [];
[['slash', 'sm', false], ['arrow', 'md', false], ['dot', 'md', true], ['|', 'lg', true]].forEach(([separator, size, contained]) => {
  const m = document.createElement('div');
  root.append(m);
  made.push(ChillBreadcrumb.init(m, { items, separator, size, contained, onItemClick: (e) => e.preventDefault() }));
});
cleanup(() => made.forEach((b) => b.destroy()));`,
        },
        {
            id: 'collapsed',
            title: 'Collapsing long trails',
            description: 'With `maxItems: 3` the first and last crumbs stay visible and the middle ones move into a "..." menu (click it, or use the arrow keys).',
            height: 200,
            code: `const mount = document.createElement('div');
root.append(mount);
const bc = ChillBreadcrumb.init(mount, {
  homeIcon: '🏠',
  maxItems: 3,
  items: [
    { label: 'Home', href: '#' },
    { label: 'Documents', href: '#docs' },
    { label: 'Projects', href: '#projects' },
    { label: '2025', href: '#2025' },
    { label: 'Q3', href: '#q3' },
    { label: 'Budget.xlsx' },
  ],
  onItemClick: (e) => e.preventDefault(),
});
cleanup(() => bc.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Update on navigation',
            description: 'Call `setItems()` whenever the route changes; delegated listeners keep working after re-render.',
            code: `const mount = document.createElement('div');
root.append(mount);
const tree = { Home: [], Products: ['Home'], Laptops: ['Home', 'Products'], Phones: ['Home', 'Products'] };
const crumbs = (page) => [...tree[page].map((p) => ({ label: p, href: '#' + p })), { label: page }];
const bc = ChillBreadcrumb.init(mount, {
  items: crumbs('Laptops'),
  onItemClick: (e, link) => { e.preventDefault(); bc.setItems(crumbs(link.textContent)); },
});
const hint = document.createElement('p');
hint.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
hint.textContent = 'Click a crumb to navigate up.';
root.append(hint);
cleanup(() => bc.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Markup and behaviour',
            body:
                'The generated markup is `<nav aria-label="Breadcrumb"><ol><li>...</li></ol></nav>`. Separators live inside each `<li>` with `aria-hidden`, so assistive technology reads a clean list.\n\n' +
                '- The last item gets `aria-current="page"`. Without an `href` it renders as plain text instead of a link.\n' +
                '- With `maxItems`, the first crumb and the last `maxItems - 1` crumbs stay visible; the rest go into the "..." menu.\n' +
                '- `onItemClick(event, linkEl)` fires for visible links and for items in the collapsed menu.',
        },
        {
            title: 'Single-page apps',
            body:
                'Call `event.preventDefault()` in `onItemClick`, run your router, then call `bc.setItems(newTrail)`. You can read the current trail back with `bc.getItems()`.',
        },
    ],
    options: [
        { name: 'items', type: '{ label: string, href?: string, icon?: string | Element }[]', default: '[]', description: 'The trail, root first. The last item is the current page.' },
        { name: 'separator', type: "'chevron' | 'slash' | 'arrow' | 'dot' | string | Element", default: "'chevron'", description: 'Separator between crumbs. Other strings are used as text, elements are cloned.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Font and icon size.' },
        { name: 'contained', type: 'boolean', default: 'false', description: 'Wrap the trail in a rounded, filled container.' },
        { name: 'maxItems', type: 'number | null', default: 'null', description: 'Collapse the middle crumbs into a "..." menu when the trail is longer than this.' },
        { name: 'homeIcon', type: 'string | Element', default: 'null', description: 'Icon placed before the first crumb.' },
        { name: 'ariaLabel', type: 'string', default: "'Breadcrumb'", description: 'Accessible name of the `<nav>`.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string icons and custom separators as HTML (trusted markup only).' },
        { name: 'onItemClick', type: '(event: MouseEvent, linkEl: HTMLAnchorElement) => void', default: 'null', description: 'Called when a crumb or a collapsed-menu item is clicked.' },
    ],
    methods: [
        { signature: 'ChillBreadcrumb.init(target, options)', on: 'static', description: 'Render a breadcrumb in place of `target` (selector or element) and return an instance.' },
        { signature: 'ChillBreadcrumb.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.breadcrumb', description: 'The generated `<nav>` element.' },
        { signature: 'instance.setItems(items)', description: 'Replace the trail and re-render. Returns the instance.' },
        { signature: 'instance.getItems()', description: 'Return a copy of the current items.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    cssVars: [
        { name: '--chillbreadcrumb-text', description: 'Link colour.' },
        { name: '--chillbreadcrumb-text-active', description: 'Current page colour.' },
        { name: '--chillbreadcrumb-hover', description: 'Link hover colour.' },
        { name: '--chillbreadcrumb-separator', description: 'Separator colour.' },
        { name: '--chillbreadcrumb-bg-contained', description: 'Background when `contained` is true.' },
    ],
    a11y: [
        'Rendered as `<nav aria-label="Breadcrumb">` containing an ordered list; the current page has `aria-current="page"`.',
        'The "..." button is a menu button (`aria-haspopup`, `aria-expanded`, `aria-controls`).',
        'Enter opens it; ArrowUp/ArrowDown open and move through hidden crumbs, Home/End jump, Esc closes and restores focus; Tab away or an outside click closes it.',
    ],
    tips: [
        'Only one collapsed menu exists per breadcrumb, so keep `maxItems` at 3 or more.',
        'In React/Vue, init in an effect and call `destroy()` in cleanup, or re-run `setItems()` when the route changes.',
    ],
    related: ['navbar', 'tabs', 'sidebar'],
    keywords: ['path', 'trail', 'location', 'hierarchy'],
};

export default doc;
