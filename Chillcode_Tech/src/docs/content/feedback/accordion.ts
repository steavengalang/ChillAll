import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'accordion',
    global: 'ChillAccordion',
    category: 'feedback',
    title: 'Accordion',
    summary: 'Collapsible sections with single or multiple mode, three variants, animated height and full keyboard support.',
    style: 'init',
    description:
        'ChillAccordion turns a list of `{ title, content }` items into an accessible, animated accordion. ' +
        'Add an empty placeholder element to your page and call `ChillAccordion.init(target, options)`: the placeholder is **replaced** by the accordion, and `destroy()` puts it back.\n\n' +
        'Titles and content are inserted as **text**. Pass a DOM node for rich content, or opt in to markup with `html: true` / per-item `titleHtml`, `contentHtml` and `iconHtml` (trusted markup only).',
    features: [
        'Single mode (one open at a time, optionally non-collapsible) or multiple mode',
        'Three variants (`default`, `flush`, `separated`) and three sizes',
        'Open by index or by item `id`, programmatically or via `defaultOpen`',
        'Animated height, WAI-ARIA button/region pattern, Arrow/Home/End navigation',
        'Disabled items, per-item icons and a `change` event',
    ],
    examples: [
        {
            id: 'faq',
            title: 'FAQ accordion',
            description: 'The classic single-open accordion. The first item starts open through `defaultOpen`.',
            height: 260,
            code: `const el = document.createElement('div');
root.append(el);
const acc = ChillAccordion.init(el, {
  defaultOpen: [0],
  items: [
    { title: 'How do I reset my password?', content: 'Open Settings, choose Security and press "Send reset link". The link is valid for 30 minutes.' },
    { title: 'Can I change my plan later?', content: 'Yes. Upgrades apply immediately and downgrades take effect at the end of the billing period.' },
    { title: 'Do you offer refunds?', content: 'We refund any annual plan within 14 days of purchase, no questions asked.' },
  ],
});
cleanup(() => acc.destroy());`,
        },
        {
            id: 'multiple',
            title: 'Multiple open and icons',
            description: '`mode: "multiple"` lets several panels stay open. Icons can be text/emoji, a DOM node, or HTML via `iconHtml`.',
            height: 300,
            code: `const el = document.createElement('div');
root.append(el);
const acc = ChillAccordion.init(el, {
  mode: 'multiple',
  defaultOpen: [0, 2],
  items: [
    { icon: '📦', title: 'Shipping', content: 'Standard delivery takes 3 to 5 business days.' },
    { icon: '↩️', title: 'Returns', content: 'Return unused items within 30 days for a full refund.' },
    { icon: '🔒', title: 'Privacy', content: 'We never sell your data and delete it on request.' },
  ],
});
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
['Open all', 'Close all'].forEach((label, i) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'padding:6px 12px;border-radius:6px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.addEventListener('click', () => (i ? acc.closeAll() : acc.openAll()));
  bar.append(b);
});
root.append(bar);
cleanup(() => acc.destroy());`,
        },
        {
            id: 'variants',
            title: 'Variants and sizes',
            description: '`flush` removes the outer border, `separated` renders each item as its own card. Combine with `size` of `sm`, `md` or `lg`.',
            height: 360,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const accs = [['flush', 'sm'], ['separated', 'md']].map(([variant, size]) => {
  const el = document.createElement('div');
  root.append(el);
  return ChillAccordion.init(el, {
    variant, size, defaultOpen: [0],
    items: [
      { title: variant + ' / ' + size + ': first', content: 'Content of the first section.' },
      { title: 'Second section', content: 'Content of the second section.' },
    ],
  });
});
cleanup(() => accs.forEach((a) => a.destroy()));`,
        },
        {
            id: 'control',
            title: 'Programmatic control and events',
            description: 'Use item `id`s with `open()`, `close()` and `toggle()`. `onChange` and the `change` event report the open indexes, the toggled index and its new state. Disabled items cannot be opened.',
            height: 320,
            code: `const el = document.createElement('div');
root.append(el);
const log = document.createElement('p');
log.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
log.textContent = 'Toggle a section...';
const acc = ChillAccordion.init(el, {
  collapsible: false,
  items: [
    { id: 'account', title: 'Account', content: 'Name, email and avatar.' },
    { id: 'billing', title: 'Billing', content: 'Invoices and payment methods.' },
    { id: 'beta', title: 'Beta features (locked)', content: 'Not available yet.', disabled: true },
  ],
  onChange: (open, index, isOpen) => {
    log.textContent = 'Item ' + index + (isOpen ? ' opened' : ' closed') + ', open: [' + open.join(', ') + ']';
  },
});
root.append(log);
setTimeout(() => acc.open('billing'), 600);
cleanup(() => acc.destroy());`,
        },
        {
            id: 'rich-content',
            title: 'DOM nodes as content',
            description: 'Item `content` can be a DOM node, so panels can hold forms, lists or other components.',
            height: 300,
            code: `const form = document.createElement('div');
form.style.cssText = 'display:flex;gap:8px;align-items:center';
form.innerHTML = '<input placeholder="Coupon code" style="flex:1;padding:6px 8px;border:1px solid var(--chill-border);border-radius:6px"><button style="padding:6px 12px;border-radius:6px;border:none;background:#3b82f6;color:#fff;cursor:pointer">Apply</button>';
const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding-left:20px';
['Pro plan x1  -  $12', 'Extra seat x2  -  $8'].forEach((t) => { const li = document.createElement('li'); li.textContent = t; list.append(li); });
const el = document.createElement('div');
root.append(el);
const acc = ChillAccordion.init(el, {
  mode: 'multiple', defaultOpen: ['summary'], headingLevel: 4,
  items: [
    { id: 'summary', title: 'Order summary', content: list },
    { id: 'coupon', title: 'Have a coupon?', content: form },
  ],
});
cleanup(() => acc.destroy());`,
        },
    ],
    guides: [
        {
            title: 'How init works',
            body:
                '`ChillAccordion.init(target, options)` accepts a selector or an element. The element is swapped out for the generated accordion root, which is available as `instance.accordion`. ' +
                'Calling `instance.destroy()` removes the accordion and restores the original placeholder, so mounting and unmounting is clean.\n\n' +
                'Items are described in JS rather than read from existing markup:\n\n' +
                '```js\nconst acc = ChillAccordion.init(\'#faq\', {\n  items: [{ id: \'a\', title: \'Question\', content: \'Answer\' }],\n  defaultOpen: [\'a\'],\n});\n```',
        },
        {
            title: 'Single, multiple and collapsible',
            body:
                '- **single** (default): opening one item closes the others. `defaultOpen` keeps only the first entry. With `collapsible: false` the open item cannot be closed by clicking it.\n' +
                '- **multiple**: any number of items can be open. Use `mode: "multiple"` or `multiple: true`. `openAll()` only works in this mode.\n\n' +
                'Refer to items by index or by `id` in `defaultOpen`, `open()`, `close()`, `toggle()` and `isOpen()`.',
        },
        {
            title: 'Theming',
            body:
                'Override the CSS variables on `:root` or on a parent. Dark mode follows the OS, `data-theme="dark"` or `.dark`.\n\n' +
                '```css\n:root {\n  --chillaccordion-border: #cbd5e1;\n  --chillaccordion-hover: #f1f5f9;\n}\n```',
        },
    ],
    options: [
        { name: 'items', type: 'Array<Item>', default: '[]', description: 'The sections to render.' },
        { name: 'items[].id', type: 'string | number', default: 'undefined', description: 'Stable identifier usable with `open()`, `close()`, `toggle()`, `isOpen()` and `defaultOpen`.' },
        { name: 'items[].title', type: 'string | Node', default: '-', description: 'Header text. Inserted as text unless `html` is true.' },
        { name: 'items[].content', type: 'string | Node', default: '-', description: 'Panel body. Text, or a DOM node for rich content.' },
        { name: 'items[].icon', type: 'string | Node', default: 'undefined', description: 'Icon shown before the title (text, emoji or node).' },
        { name: 'items[].disabled', type: 'boolean', default: 'false', description: 'Disable the header: it cannot be toggled and is skipped by arrow-key navigation.' },
        { name: 'items[].titleHtml / contentHtml / iconHtml', type: 'string', default: 'undefined', description: 'Explicit HTML for one part (trusted markup only).' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert item title, content and icon strings as HTML (sanitise first).' },
        { name: 'mode', type: "'single' | 'multiple'", default: "'single'", description: 'Whether several items may be open at once.' },
        { name: 'multiple', type: 'boolean', default: 'false', description: 'Alias for `mode: "multiple"`.' },
        { name: 'collapsible', type: 'boolean', default: 'true', description: 'In single mode, allow closing the open item.' },
        { name: 'defaultOpen', type: 'Array<number | string>', default: '[]', description: 'Indexes or ids open at start. Disabled items are ignored; single mode uses only the first.' },
        { name: 'variant', type: "'default' | 'flush' | 'separated'", default: "'default'", description: 'Visual style.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size.' },
        { name: 'headingLevel', type: 'number', default: '3', description: '`aria-level` (1-6) of each header heading.' },
        { name: 'onChange', type: '(openIndexes: number[], index: number, isOpen: boolean) => void', default: 'null', description: 'Called after a toggle.' },
    ],
    methods: [
        { signature: 'ChillAccordion.init(target, options)', on: 'static', description: 'Replace `target` (selector or element) with an accordion; returns an instance.' },
        { signature: 'ChillAccordion.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.toggle(ref)', description: 'Toggle an item by index, id or item element.' },
        { signature: 'instance.open(ref) / close(ref)', description: 'Open or close an item (no-op if already in that state).' },
        { signature: 'instance.openAll()', description: 'Open every enabled item. Only works in multiple mode.' },
        { signature: 'instance.closeAll()', description: 'Close every open item.' },
        { signature: 'instance.isOpen(ref)', description: 'Returns whether the item is open.' },
        { signature: 'instance.on(event, fn) / off(event, fn?)', description: 'Subscribe to or remove event handlers. Both return the instance.' },
        { signature: 'instance.accordion', description: 'Property: the accordion root element.' },
        { signature: 'instance.openItems', description: 'Property: `Set` of open item indexes.' },
        { signature: 'instance.destroy()', description: 'Remove the accordion, restore the original element and clear timers and listeners.' },
    ],
    events: [
        { name: 'change', payload: '(openIndexes: number[], index: number, isOpen: boolean)', description: 'Fired after an item is toggled through a click or `toggle()`/`open()`/`close()`.' },
    ],
    cssVars: [
        { name: '--chillaccordion-bg', description: 'Accordion background.' },
        { name: '--chillaccordion-text', description: 'Header and body text colour.' },
        { name: '--chillaccordion-text-muted', description: 'Icon and arrow colour.' },
        { name: '--chillaccordion-border', description: 'Border and divider colour.' },
        { name: '--chillaccordion-hover', description: 'Header hover and focus background.' },
        { name: '--chillaccordion-focus', description: 'Focus ring colour.' },
    ],
    a11y: [
        'Each header is a `<button>` inside an element with `role="heading"` and `aria-level` (see `headingLevel`), with `aria-expanded` and `aria-controls`.',
        'Each panel has `role="region"` labelled by its button.',
        'Enter and Space toggle the focused header; ArrowDown/ArrowUp move between headers (wrapping), Home/End jump to the first/last.',
        'Disabled items use the native `disabled` attribute and are skipped by keyboard navigation.',
        'Height animation is disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        '`closeAll()` and `openAll()` do not fire `onChange` or the `change` event; only individual toggles do.',
        'Keep the instance and call `destroy()` when unmounting; it restores the original placeholder element.',
        'In React, render an empty `<div ref>` and call `init()` in an effect, returning `() => acc.destroy()`.',
        'The module is safe to import on the server; create instances in the browser only.',
    ],
    related: ['tabs', 'card', 'divider'],
    keywords: ['collapse', 'faq', 'expandable', 'disclosure', 'toggle sections'],
};

export default doc;
