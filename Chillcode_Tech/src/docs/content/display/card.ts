import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'card',
    global: 'ChillCard',
    category: 'display',
    title: 'Card',
    summary: 'Header, media, body and footer card with variants, hover lift, link semantics and a skeleton state.',
    style: 'create',
    description:
        'ChillCard is a content container with optional header (title + subtitle), media, body and footer slots. Build one with `ChillCard.create()` ' +
        'or enhance existing markup with `ChillCard.init()`.\n\n' +
        'Passing `href` or `onClick` makes the whole card interactive (`role="link"` / `role="button"`, keyboard activation included). ' +
        'String content is inserted as **text**; only use `html: true` or the `*Html` options for trusted markup.',
    features: [
        'Three variants (outlined, elevated, filled) and three sizes',
        'Media slot with aspect ratio, or a horizontal layout with media on the left',
        'Whole-card click or link behaviour with keyboard support, ignoring clicks on inner buttons and links',
        'Skeleton loading state with `aria-busy`, toggled at any time',
        'Safe by default: strings are text, `javascript:` and `data:` hrefs are rejected',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic card',
            description: 'Title, subtitle, body and a footer. Footer content can be any DOM node.',
            code: `const footer = document.createElement('span');
footer.textContent = 'Updated 2 hours ago';
const card = ChillCard.create({
  title: 'Q3 Planning',
  subtitle: 'Product team',
  body: 'Roadmap review, hiring plan and the launch checklist for the next release.',
  footer,
  parent: root,
});
cleanup(() => card.destroy());`,
        },
        {
            id: 'variants',
            title: 'Variants and sizes',
            description: '`outlined` (default), `elevated` and `filled`, each in the `sm`, `md` or `lg` scale.',
            height: 260,
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px';
const cards = [['outlined', 'sm'], ['elevated', 'md'], ['filled', 'lg']].map(([variant, size]) =>
  ChillCard.create({ title: variant, subtitle: 'size ' + size, body: 'A ' + variant + ' card.', variant, size, parent: root })
);
cleanup(() => cards.forEach((c) => c.destroy()));`,
        },
        {
            id: 'media',
            title: 'Media and hover lift',
            description: '`media` accepts a URL, a Node or `{ src, alt, ratio }`. `hoverable` adds the lift effect.',
            height: 300,
            code: `const art = document.createElement('div');
art.style.cssText = 'width:100%;height:100%;background:linear-gradient(135deg,#6366f1,#ec4899)';
const card = ChillCard.create({
  media: art,
  mediaRatio: '16 / 9',
  title: 'Sunset gradient',
  subtitle: 'Design tokens',
  body: 'Hover the card to see it lift.',
  variant: 'elevated',
  hoverable: true,
  parent: root,
});
root.style.maxWidth = '340px';
cleanup(() => card.destroy());`,
        },
        {
            id: 'horizontal',
            title: 'Horizontal layout',
            description: 'Media on the left, content on the right. Falls back to stacked below 480px.',
            height: 180,
            code: `const art = document.createElement('div');
art.style.cssText = 'width:100%;height:100%;min-height:120px;background:linear-gradient(135deg,#10b981,#3b82f6)';
const card = ChillCard.create({
  horizontal: true,
  media: art,
  title: 'Trail running guide',
  subtitle: '8 min read',
  body: 'Pick shoes, plan routes and pace yourself on the first long climb.',
  parent: root,
});
cleanup(() => card.destroy());`,
        },
        {
            id: 'clickable',
            title: 'Clickable card',
            description: '`onClick` (or `href`) makes the card a button. Clicks on nested buttons and links do not trigger it.',
            code: `const out = document.createElement('p');
out.style.color = 'var(--chill-text)';
out.textContent = 'Click the card or press Enter.';
const btn = document.createElement('button');
btn.textContent = 'Share';
const card = ChillCard.create({
  title: 'Invoice #1042',
  subtitle: 'Due Friday',
  body: '$1,280.00 - Acme Studio',
  footer: btn,
  variant: 'elevated',
  hoverable: true,
  ariaLabel: 'Open invoice 1042',
  onClick: () => { out.textContent = 'Card activated at ' + new Date().toLocaleTimeString(); },
  parent: root,
});
root.append(out);
cleanup(() => card.destroy());`,
        },
        {
            id: 'loading',
            title: 'Skeleton loading',
            description: '`setLoading(true)` swaps the content for an animated skeleton. Set the real content, then turn loading off.',
            code: `const card = ChillCard.create({ title: 'Weekly report', subtitle: 'Loading...', body: 'Fetching numbers', loading: true, parent: root });
card.on('loading', ({ loading }) => console.log('loading =', loading));
const t = setTimeout(() => {
  card.setSubtitle('Ready');
  card.setBody('Revenue is up 12% week over week.');
  card.setLoading(false);
}, 1800);
cleanup(() => { clearTimeout(t); card.destroy(); });`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` on an element wraps its children in the card structure and returns an instance; `destroy()` restores the original DOM.',
            code: `root.innerHTML = '<div class="note">Existing paragraph that becomes the card content.</div>';
const inst = ChillCard.init(root.querySelector('.note'), { variant: 'filled', hoverable: true });
cleanup(() => inst.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Interactive cards',
            body:
                'A card becomes interactive when you pass `href`, `onClick` or `clickable: true`. With `href` it gets `role="link"`, with the others `role="button"`; ' +
                'Enter and Space activate it. Clicks that originate inside a native control (`a`, `button`, `input`, `select`, `textarea`, `label`, `summary`) ' +
                'or inside an element marked `data-chillcard-ignore` are ignored, so you can nest actions in the footer.\n\n' +
                'Call `event.preventDefault()` in `onClick` to stop the `href` navigation. With `target: "_blank"` the card opens with `noopener`.',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns an instance. `card.element` is the root; `headerEl`, `mediaEl`, `bodyEl` and `footerEl` are the slots (null when absent). Use `parent` to mount it.\n' +
                '- **`init(target, options)`** enhances existing DOM. Pass an element to get one instance, or a selector / NodeList to get an array. Existing children become the body.\n\n' +
                'Setters (`setTitle`, `setBody`, `setFooter`, `setMedia`, ...) rebuild the affected slots, so you can update a card after data loads.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillcard-radius: 14px;\n  --chillcard-primary: #7c3aed;\n}\n```\n\n' +
                'Dark mode follows the OS or `<html data-theme="dark">` / `class="dark"`.',
        },
    ],
    options: [
        { name: 'title', type: 'string', default: "''", description: 'Header title (text).' },
        { name: 'subtitle', type: 'string', default: "''", description: 'Header subtitle (text).' },
        { name: 'header', type: 'string | Node', default: 'null', description: 'Extra header content rendered after the title and subtitle.' },
        { name: 'media', type: 'string | Node | { src, alt, ratio }', default: 'null', description: 'Media slot: image URL, a node (image, video, SVG) or an object.' },
        { name: 'mediaRatio', type: 'string', default: "'16 / 9'", description: 'Aspect ratio for image media.' },
        { name: 'body', type: 'string | Node', default: 'null', description: 'Body content.' },
        { name: 'footer', type: 'string | Node', default: 'null', description: 'Footer content.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string `header`, `body` and `footer` as HTML (trusted content only).' },
        { name: 'headerHtml / bodyHtml / footerHtml', type: 'string', default: 'null', description: 'Explicit HTML strings for one slot (trusted content only).' },
        { name: 'variant', type: "'outlined' | 'elevated' | 'filled'", default: "'outlined'", description: 'Visual style.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and type scale.' },
        { name: 'hoverable', type: 'boolean', default: 'false', description: 'Lift / border highlight on hover.' },
        { name: 'clickable', type: 'boolean', default: 'false', description: 'Make the whole card interactive (implied by `href` and `onClick`).' },
        { name: 'href', type: 'string', default: 'null', description: 'Navigates on click and sets `role="link"`. `javascript:` and `data:` URLs are rejected.' },
        { name: 'target', type: 'string', default: 'null', description: 'Window target for `href`; `_blank` adds `noopener`.' },
        { name: 'horizontal', type: 'boolean', default: 'false', description: 'Media on the left, content on the right.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Start in the skeleton state (`aria-busy`).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Non-interactive with `aria-disabled`.' },
        { name: 'ariaLabel', type: 'string', default: 'null', description: 'Accessible name for clickable cards.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class names on the root.' },
        { name: 'parent', type: 'Element | string', default: 'null', description: 'Element or selector to append the card to.' },
        { name: 'onClick', type: '(event, card) => void', default: 'null', description: 'Click handler. Call `event.preventDefault()` to cancel `href` navigation.' },
        { name: 'onLoadingChange', type: '(loading, card) => void', default: 'null', description: 'Called when the loading state changes.' },
    ],
    methods: [
        { signature: 'ChillCard.create(options)', on: 'static', description: 'Create a card; returns an instance.' },
        { signature: 'ChillCard.init(target, options)', on: 'static', description: 'Enhance an element (single instance) or a selector / list (array of instances).' },
        { signature: 'ChillCard.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'card.element', description: 'Root element. Slots: `headerEl`, `mediaEl`, `bodyEl`, `footerEl`.' },
        { signature: 'card.setLoading(loading)', description: 'Toggle the skeleton state.' },
        { signature: 'card.setVariant(variant) / setSize(size)', description: 'Change variant or size.' },
        { signature: 'card.setTitle(text) / setSubtitle(text)', description: 'Update header text.' },
        { signature: 'card.setBody(content, asHtml?) / setFooter(content, asHtml?)', description: 'Replace body or footer.' },
        { signature: 'card.setMedia(media)', description: 'Replace the media slot.' },
        { signature: 'card.setDisabled(disabled)', description: 'Enable or disable interaction.' },
        { signature: 'card.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'card.destroy()', description: 'Remove the card (or restore the original DOM when created by `init()`).' },
    ],
    events: [
        { name: 'click', payload: '{ event, card }', description: 'The card was activated.' },
        { name: 'loading', payload: '{ loading, card }', description: 'The loading state changed.' },
        { name: 'destroy', payload: '{ card }', description: 'The instance was destroyed.' },
    ],
    cssVars: [
        { name: '--chillcard-primary', description: 'Hover border and focus ring colour.' },
        { name: '--chillcard-bg / --chillcard-filled-bg', description: 'Card and filled-variant backgrounds.' },
        { name: '--chillcard-text / --chillcard-muted', description: 'Text and secondary text colours.' },
        { name: '--chillcard-border / --chillcard-divider', description: 'Outline and footer divider colours.' },
        { name: '--chillcard-shadow / --chillcard-shadow-hover', description: 'Elevated variant shadows.' },
        { name: '--chillcard-radius', description: 'Corner radius.' },
    ],
    a11y: [
        'Interactive cards get `role="link"` (with `href`) or `role="button"`, `tabindex="0"`, and activate with Enter or Space.',
        'Loading sets `aria-busy`; disabled sets `aria-disabled` and removes the card from the tab order.',
        'Give clickable cards an `ariaLabel` when the visible text is not a good accessible name.',
        'Visible `:focus-visible` ring; skeleton animation stops under `prefers-reduced-motion`.',
    ],
    tips: [
        'Prefer a small `footer` with real buttons for secondary actions; they will not trigger the card click.',
        'The module is safe to import on the server; create cards in the browser.',
        'In React, create the card in an effect with `parent: ref.current` and call `destroy()` in the cleanup.',
    ],
    related: ['badge', 'avatar', 'skeleton', 'stat'],
    keywords: ['panel', 'tile', 'container', 'media card', 'skeleton'],
};

export default doc;
