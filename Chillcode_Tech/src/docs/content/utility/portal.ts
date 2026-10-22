import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'portal',
    global: 'ChillPortal',
    category: 'utility',
    title: 'Portal',
    summary: 'Render tooltips, menus and layers into a shared body-level root to escape overflow and stacking.',
    style: 'static',
    description:
        'ChillPortal mounts content into a shared root appended to `<body>` (or any target you choose). Anything inside a container with `overflow: hidden`, ' +
        '`transform` or a low `z-index` can be rendered above everything else without changing your markup.\n\n' +
        'The shared root (`#chill-portal-root`, `position: fixed`, `z-index: 10000`) has `pointer-events: none` so it never blocks the page; every portal container re-enables pointer events for itself. ' +
        'String content is inserted as **text**; pass `html: true` only for trusted markup.',
    features: [
        'Escape clipping and stacking contexts by mounting into a body-level root',
        'Identified by id: re-creating an id replaces and cleans up the old portal',
        'Content is a string (text by default) or a DOM node; `html: true` is an explicit opt-in',
        'Custom `target`, `className`, `attrs` and an `onRemove` callback',
        'The root is created lazily and re-created if something removes it',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Escape a clipped container',
            description: 'The tooltip inside the box is cut off by `overflow: hidden`; the portaled one is mounted on `<body>` and floats freely above it.',
            code: `root.style.cssText += ';display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;padding-top:40px';
const box = document.createElement('div');
box.style.cssText = 'width:200px;height:56px;overflow:hidden;position:relative;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);display:flex;align-items:center;justify-content:center';
const clipped = document.createElement('span');
clipped.textContent = 'Clipped tooltip';
clipped.style.cssText = 'position:absolute;top:-30px;background:#111;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px';
box.append('Hover me too', clipped);
const btn = ChillButton.create({ text: 'Show portal tooltip', variant: 'outline' });
root.append(box, btn);

const show = () => {
  const r = btn.getBoundingClientRect();
  const tip = ChillPortal.create('docs-tip', 'I escape every overflow!', { attrs: { role: 'tooltip' } });
  tip.style.cssText += ';position:fixed;left:' + r.left + 'px;top:' + (r.top - 36) + 'px;background:#111;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;white-space:nowrap';
};
btn.addEventListener('mouseenter', show);
btn.addEventListener('focus', show);
btn.addEventListener('mouseleave', () => ChillPortal.remove('docs-tip'));
btn.addEventListener('blur', () => ChillPortal.remove('docs-tip'));
cleanup(() => ChillPortal.remove('docs-tip'));`,
            height: 150,
        },
        {
            id: 'update-remove',
            title: 'Update and remove by id',
            description: '`update(id, content)` swaps the content, `has()` and `ids()` inspect the registry and `remove(id)` takes it away. This status pill lives on `<body>`, not in the preview.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const info = document.createElement('div');
info.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, info);
let n = 0;
const refresh = () => { info.textContent = "has('docs-pill') -> " + ChillPortal.has('docs-pill') + '   ids() -> ' + JSON.stringify(ChillPortal.ids().filter((i) => i.startsWith('docs-'))); };
const place = (el) => { el.style.cssText += ';position:fixed;right:24px;bottom:24px;background:#16a34a;color:#fff;padding:8px 14px;border-radius:999px;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.25)'; };
row.append(
  ChillButton.create({ text: 'Create', size: 'sm', onClick: () => { place(ChillPortal.create('docs-pill', 'Synced at step ' + n)); refresh(); } }),
  ChillButton.create({ text: 'Update', size: 'sm', variant: 'secondary', onClick: () => { n++; ChillPortal.update('docs-pill', 'Synced at step ' + n); refresh(); } }),
  ChillButton.create({ text: 'Remove', size: 'sm', variant: 'outline', onClick: () => { ChillPortal.remove('docs-pill'); refresh(); } }),
);
refresh();
cleanup(() => ChillPortal.remove('docs-pill'));`,
            height: 130,
        },
        {
            id: 'nodes-and-target',
            title: 'DOM nodes, custom target and onRemove',
            description: 'Pass an element instead of a string, mount into your own `target`, and get notified with `onRemove` when the portal is removed (also when its id is reused).',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const layer = document.createElement('div');
layer.style.cssText = 'min-height:56px;padding:10px;border:1px dashed var(--chill-border);border-radius:10px;color:var(--chill-text);font-size:13px';
layer.textContent = '#my-layer (custom target)';
layer.id = 'docs-layer';
const log = document.createElement('div');
log.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px;min-height:18px';
root.append(layer, log);

let count = 0;
const mount = () => {
  const card = document.createElement('div');
  card.style.cssText = 'margin-top:6px;padding:6px 10px;border-radius:8px;background:#3b82f6;color:#fff;font-size:13px';
  card.textContent = 'Card #' + (++count);
  ChillPortal.create('docs-card', card, { target: '#docs-layer', className: 'my-card', onRemove: (el) => (log.textContent = 'onRemove: ' + el.textContent) });
};
root.append(
  ChillButton.create({ text: 'Mount (replaces previous)', size: 'sm', onClick: mount }),
  ChillButton.create({ text: 'Remove', size: 'sm', variant: 'outline', onClick: () => ChillPortal.remove('docs-card') }),
);
mount();
cleanup(() => ChillPortal.remove('docs-card'));`,
            height: 200,
        },
    ],
    guides: [
        {
            title: 'When you need a portal',
            body:
                'Absolutely positioned popups are clipped by any ancestor with `overflow: hidden`, and they cannot rise above a sibling that sits in a higher stacking context. ' +
                'A portal moves the popup out of the problem subtree, to the end of `<body>`, while your code keeps a reference to it.\n\n' +
                'ChillPortal only handles the mounting. **You** position the layer, typically with `position: fixed` and coordinates from `getBoundingClientRect()`:\n\n' +
                '```js\nconst r = trigger.getBoundingClientRect();\nconst el = ChillPortal.create(\'menu\', menuNode);\nObject.assign(el.style, { position: \'fixed\', left: r.left + \'px\', top: r.bottom + \'px\' });\n```\n\n' +
                'Re-position on scroll and resize if the layer should follow its trigger.',
        },
        {
            title: 'Lifecycle',
            body:
                'Each portal is identified by an `id`. Creating a portal with an existing id removes the previous one first (and calls its `onRemove`). ' +
                '`remove(id)` detaches the container, `clear()` removes all portals, and `destroy()` clears everything **and** removes the shared root element. ' +
                'The container gets `id="portal-<id>"` and `data-chill-portal="<id>"`, handy for tests and CSS.',
        },
    ],
    options: [
        { name: 'id', type: 'string', default: '-', description: 'create(): unique portal id. Re-using an id replaces the existing portal.' },
        { name: 'content', type: 'string | number | Node', default: '-', description: 'create() / update(): text (default) or a DOM node. `null` empties the portal.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert string content with `innerHTML`. Trusted markup only. `update()` keeps the creation setting unless you pass `html`.' },
        { name: 'target', type: 'Element | string', default: 'shared root', description: 'Where to mount. A selector that matches nothing falls back to the shared root.' },
        { name: 'className', type: 'string', default: 'null', description: 'Class name(s) for the portal container.' },
        { name: 'attrs', type: 'Record<string, string>', default: 'null', description: 'Attributes set on the container (for example `role`).' },
        { name: 'onRemove', type: '(container: HTMLElement) => void', default: 'null', description: 'Called after the portal is removed.' },
    ],
    methods: [
        { signature: 'ChillPortal.create(id, content, options?)', on: 'static', description: 'Mount content; returns the container element (`null` on the server).' },
        { signature: 'ChillPortal.update(id, content, { html? })', on: 'static', description: 'Replace the content of an existing portal; returns the container or `null` if the id is unknown.' },
        { signature: 'ChillPortal.remove(id)', on: 'static', description: 'Remove one portal and call its `onRemove`.' },
        { signature: 'ChillPortal.get(id)', on: 'static', description: 'The container element or `null`.' },
        { signature: 'ChillPortal.has(id)', on: 'static', description: 'Does a portal with this id exist?' },
        { signature: 'ChillPortal.ids()', on: 'static', description: 'Array of current portal ids.' },
        { signature: 'ChillPortal.clear()', on: 'static', description: 'Remove every portal but keep the root.' },
        { signature: 'ChillPortal.getRoot()', on: 'static', description: 'The shared root element, created lazily.' },
        { signature: 'ChillPortal.destroy()', on: 'static', description: 'Remove all portals and the shared root.' },
    ],
    a11y: [
        'A portal changes where the DOM node lives, not its meaning: add `role`, labels and `aria-describedby` yourself (use `attrs`).',
        'Content moved to the end of `<body>` comes last in reading and Tab order; manage focus explicitly for dialogs (see FocusTrap).',
        'Keep `aria-describedby` / `aria-controls` ids stable, since the trigger and its layer are no longer siblings.',
    ],
    tips: [
        'SSR: `create()` returns `null` when there is no `document`, so call it from effects or event handlers.',
        'Remove portals on unmount (`remove(id)`) so layers do not outlive their owner.',
        'The root has `pointer-events: none`; custom `target` elements are not affected by that.',
        'Do not insert user-supplied strings with `html: true`; sanitise first.',
    ],
    related: ['focustrap', 'clickoutside', 'modal', 'popover'],
    keywords: ['teleport', 'overlay', 'layer', 'z-index', 'body', 'tooltip', 'render outside'],
};

export default doc;
