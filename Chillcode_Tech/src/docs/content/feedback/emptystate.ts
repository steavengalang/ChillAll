import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'emptystate',
    global: 'ChillEmptyState',
    category: 'feedback',
    title: 'Empty State',
    summary: 'Friendly placeholders for empty lists, no results, errors and offline states, with icons and actions.',
    style: 'create',
    description:
        'ChillEmptyState tells users why a screen is empty and what to do next. Pick one of eight presets (`empty`, `noResults`, `noData`, `error`, `offline`, `noPermission`, `inbox`, `folder`) for ready-made icon and copy, ' +
        'then override any part and add action buttons.\n\n' +
        '`ChillEmptyState.create(options)` returns an element you insert yourself; `ChillEmptyState.mount(target, options)` renders into a container and returns a handle with `update()`. ' +
        'All text is inserted as **text**; use `html: true` or the explicit `titleHtml` / `descriptionHtml` / `iconHtml` options for trusted markup.',
    features: [
        '8 presets with matching built-in icons and inline illustrations',
        'Custom icon (text, DOM node or SVG), illustration image or built-in illustration',
        'Action buttons and links with four variants, icons and disabled state',
        '`mount()` handle with `update()` to swap states without rebuilding your layout',
        'Safe by default: hrefs and image URLs are checked, text is never parsed as HTML',
    ],
    examples: [
        {
            id: 'presets',
            title: 'Presets',
            description: 'A preset provides an icon, title and description. Anything you pass yourself wins over the preset.',
            height: 320,
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
['noResults', 'inbox', 'offline', 'noPermission'].forEach((preset) => {
  const el = ChillEmptyState.create({ preset, size: 'sm' });
  root.append(el);
  cleanup(() => el.destroy());
});`,
        },
        {
            id: 'actions',
            title: 'With actions',
            description: 'Actions render as buttons, or as links when `href` is set. The first is primary by default, the others secondary.',
            height: 300,
            code: `const msg = document.createElement('p');
msg.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
const el = ChillEmptyState.create({
  iconType: 'folder', iconWrapper: true,
  title: 'No projects yet',
  description: 'Projects keep your files, tasks and teammates in one place.',
  actions: [
    { label: 'Create project', icon: '+', onClick: () => { msg.textContent = 'Create clicked'; } },
    { label: 'Read the guide', href: 'https://example.com/guide', target: '_blank' },
  ],
});
root.append(el, msg);
cleanup(() => el.destroy());`,
        },
        {
            id: 'illustration',
            title: 'Illustrations and sizes',
            description: '`illustrationType` selects a built-in inline illustration (`empty`, `search`, `error`, `offline`). Use `illustration` for your own image URL.',
            height: 380,
            code: `const el = ChillEmptyState.create({
  illustrationType: 'search', size: 'lg', bordered: false,
  title: 'We found nothing for "blue sneakers"',
  description: 'Check the spelling or try a broader term.',
  actions: [{ label: 'Clear filters', variant: 'secondary' }],
});
root.append(el);
cleanup(() => el.destroy());`,
        },
        {
            id: 'error-retry',
            title: 'Error with retry',
            description: 'Use `role: "alert"` for failures so screen readers announce them immediately. A disabled action shows a pending state.',
            height: 320,
            code: `const el = ChillEmptyState.create({
  preset: 'error', role: 'alert', iconWrapper: true,
  title: 'Could not load your invoices',
  description: 'The server did not respond. Your data is safe.',
  actions: [
    { label: 'Try again', onClick: () => alert('Retrying...') },
    { label: 'Contact support', href: 'mailto:support@example.com', variant: 'ghost' },
    { label: 'Export (unavailable)', disabled: true },
  ],
});
root.append(el);
cleanup(() => el.destroy());`,
        },
        {
            id: 'mount-update',
            title: 'Mount and update',
            description: '`mount()` renders into a host and returns a handle. `update()` re-renders with merged options, so you can switch from loading to empty to error.',
            height: 320,
            code: `const host = document.createElement('div');
root.append(host);
const handle = ChillEmptyState.mount(host, { preset: 'noData', size: 'sm' });
const timer = setTimeout(() => handle.update({
  preset: 'noResults', title: 'No matching reports',
  actions: [{ label: 'Reset filters' }],
}), 1800);
cleanup(() => { clearTimeout(timer); handle.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'create vs mount',
            body:
                '- **`create(options)`** returns a `<div>` with a `destroy()` method. You decide where it goes and when to remove it.\n' +
                '- **`mount(target, options)`** appends a state to a selector or element and returns `{ element, update(opts), destroy() }`. `update()` merges the new options over the previous ones and replaces the element.\n\n' +
                'The built-in assets are exposed for reuse: `ChillEmptyState.icons`, `ChillEmptyState.illustrations` and `ChillEmptyState.presets`.',
        },
        {
            title: 'Writing good empty states',
            body:
                'Say what is missing, why, and what the user can do. Use a single primary action, keep copy short, and pick `role: "alert"` only for errors; the default `status` is announced politely.\n\n' +
                'Safety notes: an action `href` must be http(s), `mailto:`, `tel:`, a relative path or `#`. Anything else (for example `javascript:`) falls back to a plain button. ' +
                'The `illustration` URL must be http(s), relative, `blob:` or `data:image/*`; unsafe schemes are ignored.',
        },
        {
            title: 'Theming',
            body:
                'Style with CSS variables. Dark mode follows the OS or `data-theme="dark"` / `.dark`.\n\n' +
                '```css\n:root {\n  --chillemptystate-primary: #7c3aed;\n  --chillemptystate-bg: #faf5ff;\n}\n```',
        },
    ],
    options: [
        { name: 'preset', type: "'empty' | 'noResults' | 'noData' | 'error' | 'offline' | 'noPermission' | 'inbox' | 'folder'", default: "''", description: 'Fills `iconType`, `title` and `description`. Your own options override it.' },
        { name: 'title', type: 'string', default: "''", description: 'Heading text.' },
        { name: 'titleHtml', type: 'string', default: 'undefined', description: 'Heading markup (trusted only).' },
        { name: 'description', type: 'string', default: "''", description: 'Supporting text.' },
        { name: 'descriptionHtml', type: 'string', default: 'undefined', description: 'Description markup (trusted only).' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert title, description and icon strings as HTML (trusted only).' },
        { name: 'icon', type: 'string | Node', default: 'undefined', description: 'Text, emoji or DOM node shown as the icon.' },
        { name: 'iconHtml', type: 'string', default: 'undefined', description: 'Icon markup such as your own `<svg>` (trusted only).' },
        { name: 'iconType', type: "'empty' | 'search' | 'error' | 'noData' | 'folder' | 'inbox' | 'lock' | 'offline' | 'bell' | 'users' | 'cart' | 'image'", default: 'undefined', description: 'Built-in icon.' },
        { name: 'iconWrapper', type: 'boolean', default: 'false', description: 'Draw a circle behind the icon.' },
        { name: 'illustration', type: 'string', default: 'undefined', description: 'Image URL (http(s), relative, `blob:`, `data:image/*`). Takes priority over `illustrationType`.' },
        { name: 'illustrationAlt', type: 'string', default: "''", description: 'Alt text of the image (decorative when empty).' },
        { name: 'illustrationType', type: "'empty' | 'search' | 'error' | 'offline'", default: 'undefined', description: 'Built-in inline illustration, shown instead of the icon.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and type scale.' },
        { name: 'bordered', type: 'boolean', default: 'true', description: 'Dashed border and background.' },
        { name: 'role', type: 'string', default: "'status'", description: 'ARIA role of the container (`status` also sets `aria-live="polite"`).' },
        { name: 'headingLevel', type: 'number', default: '3', description: 'Heading level (1-6) of the title.' },
        { name: 'actions', type: 'Array<Action>', default: '[]', description: 'Buttons and links shown under the text.' },
        { name: 'actions[].label', type: 'string', default: "''", description: 'Button text (always plain text).' },
        { name: 'actions[].variant', type: "'primary' | 'secondary' | 'danger' | 'ghost'", default: "'primary' (first), 'secondary' (others)", description: 'Visual style.' },
        { name: 'actions[].href', type: 'string', default: 'undefined', description: 'Render an `<a>`. Unsafe schemes fall back to a `<button>`. Also accepts `target`.' },
        { name: 'actions[].onClick', type: '(event: MouseEvent) => void', default: 'undefined', description: 'Click handler. Not called when the action is disabled.' },
        { name: 'actions[].icon / iconHtml', type: 'string | Node / string', default: 'undefined', description: 'Icon before the label (text or node; `iconHtml` for trusted markup).' },
        { name: 'actions[].disabled', type: 'boolean', default: 'false', description: 'Disable the action.' },
    ],
    methods: [
        { signature: 'ChillEmptyState.create(options?)', on: 'static', description: 'Build an empty state element.' },
        { signature: 'ChillEmptyState.mount(target, options?)', on: 'static', description: 'Render into a selector or element; returns `{ element, update(opts), destroy() }`.' },
        { signature: 'ChillEmptyState.icons / illustrations / presets', description: 'Properties (not functions): objects containing the built-in icon SVG strings, illustration SVG strings and preset definitions.' },
        { signature: 'ChillEmptyState.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'el.destroy()', description: 'Remove the element and its action listeners.' },
        { signature: 'handle.update(options)', description: '`mount()` handle: re-render with options merged over the previous ones.' },
        { signature: 'handle.element', description: '`mount()` handle: the current element.' },
        { signature: 'handle.destroy()', description: '`mount()` handle: remove the rendered state.' },
    ],
    cssVars: [
        { name: '--chillemptystate-bg', description: 'Background of the bordered container.' },
        { name: '--chillemptystate-text / --chillemptystate-text-muted', description: 'Title and description colours.' },
        { name: '--chillemptystate-border', description: 'Dashed border colour.' },
        { name: '--chillemptystate-icon', description: 'Icon and illustration colour.' },
        { name: '--chillemptystate-primary', description: 'Primary action background.' },
        { name: '--chillemptystate-danger', description: 'Danger action background.' },
    ],
    a11y: [
        'The container has `role="status"` with `aria-live="polite"` by default; use `role: "alert"` for errors.',
        'Icons and built-in illustrations are `aria-hidden`; give custom images meaning with `illustrationAlt`.',
        'The title is an `<h3>` (or a `role="heading"` element with `aria-level` for other `headingLevel` values).',
        'Actions are native `<button>`/`<a>` elements; disabled links get `aria-disabled` and `tabindex="-1"`. Visible focus rings are provided.',
    ],
    tips: [
        'Rendering a `status` container with content already inside means the text is not announced on first paint; use `role: "alert"` when the message is urgent.',
        'Use `size: "sm"` and `bordered: false` for empty states inside cards, table bodies or sidebars.',
        'In React, mount with `mount()` in an effect and return `() => handle.destroy()`.',
        'The module is safe to import on the server; create elements in the browser only.',
    ],
    related: ['skeleton', 'alert', 'button', 'card'],
    keywords: ['no results', 'zero state', 'blank slate', 'placeholder', 'error state', 'offline', '404'],
};

export default doc;
