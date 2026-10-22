import type { DocEntry } from '../../types';

const BOX = `const box = document.createElement('div');
box.style.cssText = 'position:relative;height:200px;overflow:hidden;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary)';
const mount = document.createElement('div');
box.append(mount);
root.append(box);`;

const doc: DocEntry = {
    id: 'navbar',
    global: 'ChillNavbar',
    category: 'navigation',
    title: 'Navbar',
    summary: 'Responsive top navigation bar with dropdowns, search, actions and a keyboard-friendly mobile menu.',
    style: 'init',
    description:
        'ChillNavbar builds a complete site header from a plain options object: brand, links (with optional dropdowns), a search field and custom action slots. ' +
        'On screens up to 768px it collapses into a full-screen menu with a toggle button, focus return, Escape handling and scroll lock.\n\n' +
        '`ChillNavbar.init(target, options)` **replaces** the target element with the generated `<nav>` (it must already be in the DOM). `destroy()` puts the original element back. ' +
        'Labels, brand names and hrefs are inserted as text/attributes (`javascript:` URLs are neutralised); only `actions[].html` and `html: true` icons accept markup.',
    features: [
        'Brand, links, nested dropdowns, search box and custom action slots',
        'Mobile full-screen menu with Escape, focus return and page scroll lock',
        'Dropdowns are real buttons: Enter, Space and Arrow keys, Home/End, Esc',
        'Optional Ctrl/Cmd+K shortcut that focuses the search field',
        'Sticky by default, optional `fixed` and `transparent` modes',
        'Safe by default: URLs are sanitised and icons render as text',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic navbar',
            description: 'Brand plus three links. The bar is `position: sticky`, so it sticks to the top of its scroll container.',
            height: 220,
            code: `${BOX}
const nav = ChillNavbar.init(mount, {
  brand: { name: 'Acme', href: '#' },
  links: [
    { label: 'Home', href: '#home', active: true },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#changelog' },
  ],
  onLinkClick: (e) => e.preventDefault(),
});
cleanup(() => nav.destroy());`,
        },
        {
            id: 'dropdowns',
            title: 'Dropdowns and active link',
            description: 'A link with `children` becomes an accessible dropdown. `setActiveLink(href)` moves the highlight when the user picks something.',
            height: 260,
            code: `${BOX}
const nav = ChillNavbar.init(mount, {
  brand: { name: 'Acme' },
  links: [
    { label: 'Home', href: '#home', active: true },
    { label: 'Docs', children: [
      { label: 'Getting started', href: '#start' },
      { label: 'API reference', href: '#api' },
      { label: 'Examples', href: '#examples' },
    ] },
    { label: 'GitHub', href: 'https://github.com', target: '_blank' },
  ],
  onLinkClick: (e, link) => {
    e.preventDefault();
    if (link.getAttribute('target') !== '_blank') nav.setActiveLink(link.getAttribute('href'));
  },
});
cleanup(() => nav.destroy());`,
        },
        {
            id: 'search',
            title: 'Search with hotkey',
            description: 'Set `searchable` for a built-in search field. `searchHotkey` focuses it with Ctrl/Cmd+K, and `onSearch(value, submitted)` fires on input and on Enter.',
            height: 230,
            code: `${BOX}
const out = document.createElement('p');
out.style.cssText = 'padding:16px;margin:0;color:var(--chill-text);font-size:14px';
out.textContent = 'Type in the search box or press Ctrl/Cmd+K.';
box.append(out);
const nav = ChillNavbar.init(mount, {
  brand: { name: 'Acme' },
  links: [{ label: 'Products', href: '#products' }, { label: 'Support', href: '#support' }],
  searchable: true,
  searchHotkey: true,
  searchPlaceholder: 'Search products...',
  onSearch: (q, submitted) => { out.textContent = (submitted ? 'Submitted: ' : 'Typing: ') + q; },
  onLinkClick: (e) => e.preventDefault(),
});
cleanup(() => nav.destroy());`,
        },
        {
            id: 'actions',
            title: 'Actions, icons and transparent mode',
            description: 'Drop your own buttons into `actions` (as `element` or trusted `html`), use icons on links and flip transparency at runtime.',
            height: 230,
            code: `${BOX}
box.style.background = 'linear-gradient(135deg,#6366f1,#ec4899)';
const signIn = document.createElement('button');
signIn.textContent = 'Sign in';
signIn.style.cssText = 'padding:8px 14px;border-radius:8px;border:1px solid currentColor;background:none;color:inherit;cursor:pointer';
const nav = ChillNavbar.init(mount, {
  brand: { name: 'Aurora' },
  links: [{ label: 'Features', href: '#f', icon: '✨' }, { label: 'Pricing', href: '#p', icon: '💳' }],
  actions: [{ element: signIn }, { html: '<a href="#start" style="padding:8px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Get started</a>' }],
  transparent: true,
  onLinkClick: (e) => e.preventDefault(),
});
let transparent = true;
signIn.onclick = () => { transparent = !transparent; nav.setTransparent(transparent); };
cleanup(() => nav.destroy());`,
        },
        {
            id: 'events',
            title: 'Mobile menu events',
            description: 'The menu toggle is only visible on narrow screens, but you can drive it from code with `openMenu()` / `closeMenu()` and listen with `on("toggle")`.',
            height: 220,
            code: `${BOX}
const status = document.createElement('p');
status.style.cssText = 'padding:16px;margin:0;color:var(--chill-text);font-size:14px';
status.textContent = 'Menu closed';
box.append(status);
const nav = ChillNavbar.init(mount, {
  brand: { name: 'Acme' },
  links: [{ label: 'Home', href: '#h' }, { label: 'About', href: '#a' }],
  onLinkClick: (e) => e.preventDefault(),
});
const off = nav.on('toggle', (open) => { status.textContent = open ? 'Menu open (resize below 768px to see it)' : 'Menu closed'; });
const btn = ChillButton.create({ text: 'Toggle menu from code', size: 'sm', variant: 'outline' });
btn.onclick = () => nav.toggleMenu();
status.after(btn);
btn.style.margin = '0 16px';
cleanup(() => { off(); nav.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Init replaces the element',
            body:
                '`ChillNavbar.init(selector | element, options)` renders a `<nav class="chillnavbar">` and swaps it in for the element you pass. The element must be attached to the DOM, otherwise the navbar is built but not inserted (it is still available as `instance.navbar`).\n\n' +
                '```html\n<div id="nav"></div>\n<script>\n  const nav = ChillNavbar.init("#nav", { brand: { name: "Acme" }, links: [{ label: "Home", href: "/" }] });\n</script>\n```\n\n' +
                'Calling `destroy()` removes every listener, unlocks scrolling and restores your original element.',
        },
        {
            title: 'Page-level behaviour',
            body:
                'The bar is `position: sticky; top: 0` by default, so place it at the top of the page (or of any scroll container). `fixed: true` switches to `position: fixed; left: 0; right: 0`, which means you must add top padding to your content. ' +
                'The mobile menu is also `position: fixed`; if you render the navbar inside a demo box, give the box a `transform` to contain it.\n\n' +
                'Mobile mode starts at `max-width: 768px`: the links collapse behind a toggle, actions move to the bottom of the full-screen menu, and dropdowns open inline.',
        },
        {
            title: 'Theming',
            body:
                'Override the CSS variables on `:root` (or any ancestor):\n\n' +
                '```css\n:root {\n  --chillnavbar-bg: #0f172a;\n  --chillnavbar-text: #f8fafc;\n  --chillnavbar-active: #22d3ee;\n  --chillnavbar-height: 72px;\n}\n```\n\n' +
                'Dark mode follows the OS preference, `<html data-theme="dark">` or `<html class="dark">`.',
        },
    ],
    options: [
        { name: 'brand', type: '{ name?, logo?, href?, alt? }', default: 'null', description: 'Brand link. `href` defaults to `/`; `logo` is an image URL, `alt` its alt text (empty when a name is present).' },
        { name: 'links', type: 'Link[]', default: '[]', description: 'Menu entries. A link with `children` becomes a dropdown.' },
        { name: 'links[].label', type: 'string', default: "''", description: 'Link text (always inserted as text).' },
        { name: 'links[].href', type: 'string', default: "'#'", description: 'Destination. `javascript:`, `data:` and `vbscript:` URLs are replaced with `#`.' },
        { name: 'links[].icon', type: 'string | Element', default: 'undefined', description: 'Icon before the label. Strings are text unless `html: true`; elements are cloned.' },
        { name: 'links[].active', type: 'boolean', default: 'false', description: 'Marks the link active and sets `aria-current="page"`.' },
        { name: 'links[].target', type: 'string', default: 'undefined', description: 'Anchor target. `_blank` also adds `rel="noopener noreferrer"`.' },
        { name: 'links[].children', type: '{ label, href, target?, active? }[]', default: 'undefined', description: 'Dropdown items.' },
        { name: 'actions', type: '({ html: string } | { element: Node })[]', default: '[]', description: 'Right-hand slot. `html` is explicit trusted markup; `element` appends a node.' },
        { name: 'searchable', type: 'boolean', default: 'false', description: 'Show a search field with a Ctrl K / ⌘K hint chip.' },
        { name: 'searchPlaceholder', type: 'string', default: "'Search...'", description: 'Placeholder and accessible label of the search input.' },
        { name: 'searchHotkey', type: 'boolean', default: 'false', description: 'Focus the search field with Ctrl+K (⌘K on macOS).' },
        { name: 'fixed', type: 'boolean', default: 'false', description: 'Use `position: fixed` instead of sticky.' },
        { name: 'transparent', type: 'boolean', default: 'false', description: 'Transparent background without border or shadow.' },
        { name: 'ariaLabel', type: 'string', default: "'Main navigation'", description: 'Accessible name of the `<nav>` landmark.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string icons as HTML (trusted markup only).' },
        { name: 'onSearch', type: '(value: string, submitted?: boolean) => void', default: 'null', description: 'Called on every input, and with `submitted = true` on Enter.' },
        { name: 'onLinkClick', type: '(event: MouseEvent, linkEl: HTMLAnchorElement) => void', default: 'null', description: 'Called when a link or dropdown item is clicked. The mobile menu closes afterwards.' },
        { name: 'onToggle', type: '(isOpen: boolean, instance) => void', default: 'null', description: 'Called when the mobile menu opens or closes.' },
    ],
    methods: [
        { signature: 'ChillNavbar.init(target, options)', on: 'static', description: 'Render a navbar in place of `target` (selector or element) and return an instance.' },
        { signature: 'ChillNavbar.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.navbar', description: 'The generated `<nav>` element.' },
        { signature: 'instance.isOpen', description: 'Whether the mobile menu is open.' },
        { signature: 'instance.openMenu() / closeMenu() / toggleMenu()', description: 'Control the mobile menu.' },
        { signature: 'instance.closeDropdowns()', description: 'Close every open dropdown.' },
        { signature: 'instance.setActiveLink(href)', description: 'Highlight the link whose `href` attribute matches; clears the others.' },
        { signature: 'instance.setTransparent(bool)', description: 'Toggle the transparent look.' },
        { signature: 'instance.on("toggle", fn)', description: 'Subscribe to mobile-menu changes. Returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    events: [{ name: 'toggle', payload: '(isOpen: boolean, instance)', description: 'Mobile menu opened or closed (the only event accepted by `on()`).' }],
    cssVars: [
        { name: '--chillnavbar-bg / --chillnavbar-text', description: 'Bar background and text colour.' },
        { name: '--chillnavbar-text-muted', description: 'Inactive link colour.' },
        { name: '--chillnavbar-active', description: 'Active link colour.' },
        { name: '--chillnavbar-border / --chillnavbar-hover', description: 'Bottom border and hover background.' },
        { name: '--chillnavbar-height', description: 'Bar height (default 64px).' },
        { name: '--chillnavbar-ring', description: 'Focus ring colour.' },
    ],
    a11y: [
        'Renders a `<nav>` landmark labelled by `ariaLabel`; the active link gets `aria-current="page"`.',
        'The mobile toggle has `aria-expanded` and `aria-controls`; Escape closes the menu and returns focus to the toggle.',
        'Dropdown triggers are buttons with `aria-haspopup` / `aria-expanded`: Enter, Space and ArrowDown open, ArrowUp/ArrowDown/Home/End move, Esc closes and restores focus.',
        'Tabbing out of a dropdown or clicking outside closes it; animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Pass `onLinkClick` with `e.preventDefault()` in single-page apps that route on their own.',
        'For SSR frameworks create the navbar inside an effect after mount, and call `destroy()` on unmount.',
        'Only one dropdown is open at a time. While the mobile menu is open `document.body.style.overflow` is locked and restored on close.',
    ],
    related: ['sidebar', 'breadcrumb', 'tabs', 'layout'],
    keywords: ['header', 'menu', 'topbar', 'hamburger', 'nav'],
};

export default doc;
