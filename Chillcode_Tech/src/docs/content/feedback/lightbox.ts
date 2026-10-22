import type { DocEntry } from '../../types';

/** Shared snippet used by every example: builds a small inline SVG "photo" so the demos need no network. */
const PHOTO =
    `const photo = (c1, c2, label, w = 900, h = 600) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
  '<rect width="100%" height="100%" fill="url(#g)"/><circle cx="' + w * 0.72 + '" cy="' + h * 0.3 + '" r="' + h * 0.12 + '" fill="rgba(255,255,255,.55)"/>' +
  '<path d="M0 ' + h + ' L' + w * 0.35 + ' ' + h * 0.55 + ' L' + w * 0.55 + ' ' + h * 0.8 + ' L' + w * 0.75 + ' ' + h * 0.6 + ' L' + w + ' ' + h + ' Z" fill="rgba(0,0,0,.28)"/>' +
  '<text x="24" y="' + (h - 24) + '" font-family="sans-serif" font-size="28" fill="#fff">' + label + '</text></svg>');`;

const doc: DocEntry = {
    id: 'lightbox',
    global: 'ChillLightbox',
    category: 'feedback',
    title: 'Lightbox',
    summary: 'Full-screen image gallery with zoom, thumbnails, captions, swipe and keyboard navigation.',
    style: 'create',
    description:
        'ChillLightbox shows images in a focused, full-viewport viewer. Hand it an array of items and call `open(index)`, or let `init()` turn ordinary ' +
        '`<a href="big.jpg"><img src="small.jpg"></a>` links into galleries - links that share the same `data-chill-lightbox` value open together.\n\n' +
        'Captions are always rendered as **text**. The viewer traps focus, locks page scroll while open, and restores focus to the opener on close.',
    features: [
        'Wheel, double-click, pinch and `+` / `-` / `0` zoom with panning',
        'Thumbnail strip, counter and captions; neighbours are preloaded',
        'Arrow keys, Home/End, Esc, touch swipe (down to close) and optional looping',
        '`init()` builds galleries from existing links, with captions from `data-caption`',
        'One-shot `ChillLightbox.open(items, index)` for quick use',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Single image',
            description: 'Items can be plain URL strings. This demo uses an inline SVG data URI so it works offline.',
            manual: true,
            code: PHOTO + `
const src = photo('#6366f1', '#ec4899', 'Aurora');
const thumb = document.createElement('img');
thumb.src = src;
thumb.alt = 'Aurora preview';
thumb.style.cssText = 'width:200px;border-radius:10px;cursor:zoom-in';
const lb = ChillLightbox.create({ items: [src] });
thumb.addEventListener('click', () => lb.open(0));
root.append(thumb);
cleanup(() => lb.destroy());`,
        },
        {
            id: 'gallery',
            title: 'Gallery with captions and thumbnails',
            description: 'Items are objects with `src`, optional `thumb`, `caption` and `alt`. Click a tile to open at that index, then use the arrow keys.',
            manual: true,
            code: PHOTO + `
const shots = [['#0ea5e9', '#22c55e', 'Coastline at dawn'], ['#f59e0b', '#ef4444', 'Desert road'], ['#8b5cf6', '#06b6d4', 'Glacier lake'], ['#14b8a6', '#84cc16', 'Rice terraces']];
const items = shots.map(([a, b, caption]) => ({ src: photo(a, b, caption), thumb: photo(a, b, caption, 180, 120), caption, alt: caption }));
root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const lb = ChillLightbox.create({ items });
items.forEach((it, i) => {
  const img = document.createElement('img');
  img.src = it.thumb; img.alt = it.alt;
  img.style.cssText = 'width:120px;border-radius:8px;cursor:zoom-in';
  img.addEventListener('click', () => lb.open(i));
  root.append(img);
});
lb.on('change', ({ index }) => console.log('showing', index));
cleanup(() => lb.destroy());`,
        },
        {
            id: 'init-links',
            title: 'Enhance existing links',
            description: '`init()` groups elements by `data-chill-lightbox`. Each link\'s `href` is the full image and `data-caption` the caption; the inner `<img>` becomes the thumbnail.',
            manual: true,
            code: PHOTO + `
const pics = [['#f43f5e', '#fb923c', 'Sunset market'], ['#3b82f6', '#a855f7', 'Night harbour'], ['#10b981', '#facc15', 'Spring meadow']];
root.style.cssText += ';display:flex;gap:8px';
pics.forEach(([a, b, caption]) => {
  const link = document.createElement('a');
  link.href = photo(a, b, caption);
  link.dataset.chillLightbox = 'trip';
  link.dataset.caption = caption;
  link.innerHTML = '<img alt="' + caption + '" style="width:110px;border-radius:8px" src="' + photo(a, b, caption, 220, 140) + '">';
  root.append(link);
});
const inst = ChillLightbox.init(root.querySelectorAll('a[data-chill-lightbox]'));
cleanup(() => inst.destroy());`,
        },
        {
            id: 'options',
            title: 'No loop, no thumbnails, limited zoom',
            description: 'Tune the viewer: stop at the ends, hide the strip, cap zoom at 2x and start on the second image. The `onChange` callback gets the index and item.',
            manual: true,
            code: PHOTO + `
const items = [['#64748b', '#0f172a', 'Slide 1'], ['#7c3aed', '#2563eb', 'Slide 2'], ['#db2777', '#f97316', 'Slide 3']]
  .map(([a, b, caption]) => ({ src: photo(a, b, caption), caption }));
const status = document.createElement('p');
status.style.color = 'var(--chill-text)';
status.textContent = 'Not opened yet';
const lb = ChillLightbox.create({
  items, loop: false, thumbnails: false, maxZoom: 2, startIndex: 1,
  onChange: (index, item) => { status.textContent = 'Viewing ' + item.caption + ' (' + (index + 1) + '/' + items.length + ')'; },
});
const btn = ChillButton.create({ text: 'Open presentation', variant: 'secondary' });
btn.addEventListener('click', () => lb.open());
root.append(btn, status);
cleanup(() => { lb.destroy(); btn.destroy(); });`,
        },
        {
            id: 'one-shot',
            title: 'One-shot helper',
            description: '`ChillLightbox.open(items, index, options)` creates, opens and cleans up after itself, handy for a single "view full size" action.',
            manual: true,
            code: PHOTO + `
const full = photo('#0891b2', '#4f46e5', 'Full-size screenshot', 1400, 900);
const btn = ChillButton.create({ text: 'View full size', variant: 'outline' });
btn.addEventListener('click', () => ChillLightbox.open([{ src: full, caption: 'Dashboard overview' }], 0));
root.append(btn);
cleanup(() => btn.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Items and markup',
            body:
                'Each item is a URL string or `{ src, thumb, caption, alt, srcset }`. `thumb` is used in the strip (falling back to `src`). Items without a `src` are ignored.\n\n' +
                'For progressive enhancement write plain links and call `init()`:\n\n' +
                '```html\n<a href="/photos/beach-large.jpg" data-chill-lightbox="trip" data-caption="Beach">\n  <img src="/photos/beach-small.jpg" alt="Beach">\n</a>\n```\n\n' +
                '```js\nChillLightbox.init("a[data-chill-lightbox]", { loop: false });\n```\n\n' +
                'Modifier-clicks (Ctrl, Cmd, Shift) are left alone so users can still open the image in a new tab. Without JavaScript the links simply open the image.',
        },
        {
            title: 'Controlling an open lightbox',
            body:
                'Besides `open(i)`, an instance exposes `next()`, `prev()`, `goTo(i)`, `zoomIn()`, `zoomOut()`, `resetZoom()` and `setItems(items)` (e.g. after loading more photos). ' +
                'The `index`, `scale` and `isOpen` properties reflect the current state.\n\n' +
                '```js\nconst lb = ChillLightbox.create({ items });\nlb.on("open", () => analytics.track("lightbox_open"));\nlb.on("change", ({ index, item }) => history.replaceState(null, "", "#photo-" + index));\nlb.open(2);\n```',
        },
        {
            title: 'Styling',
            body:
                'The backdrop and control surfaces are CSS custom properties:\n\n' +
                '```css\n:root {\n  --chilllightbox-backdrop: rgba(0, 0, 0, 0.95);\n  --chilllightbox-ui: rgba(255, 255, 255, 0.16);\n}\n```',
        },
    ],
    options: [
        { name: 'items', type: 'Array<string | Item>', default: '[]', description: 'Images to show. Item: `{ src, thumb, caption, alt, srcset }`.' },
        { name: 'startIndex', type: 'number', default: '0', description: 'Index shown when `open()` is called without an argument.' },
        { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap around at the first and last item.' },
        { name: 'zoom', type: 'boolean', default: 'true', description: 'Enable wheel, double-click, pinch and keyboard zoom.' },
        { name: 'maxZoom', type: 'number', default: '4', description: 'Maximum scale factor.' },
        { name: 'thumbnails', type: 'boolean', default: 'true', description: 'Show the thumbnail strip (only with more than one item).' },
        { name: 'captions', type: 'boolean', default: 'true', description: 'Show item captions.' },
        { name: 'counter', type: 'boolean', default: 'true', description: 'Show the "2 / 5" counter.' },
        { name: 'swipe', type: 'boolean', default: 'true', description: 'Touch swipe left/right for prev/next, down to close.' },
        { name: 'preload', type: 'number', default: '1', description: 'Neighbouring images to preload on each side.' },
        { name: 'closeOnBackdrop', type: 'boolean', default: 'true', description: 'Click on the empty area closes the viewer.' },
        { name: 'lockScroll', type: 'boolean', default: 'true', description: 'Lock page scroll while open.' },
        { name: 'returnFocus', type: 'boolean', default: 'true', description: 'Restore focus to the opener on close.' },
        { name: 'destroyOnClose', type: 'boolean', default: 'false', description: 'Destroy the instance after closing (what `ChillLightbox.open()` sets).' },
        { name: 'onOpen', type: '(instance) => void', default: 'null', description: 'Called when the viewer opens.' },
        { name: 'onClose', type: '(instance) => void', default: 'null', description: 'Called when the viewer closes.' },
        { name: 'onChange', type: '(index, item, instance) => void', default: 'null', description: 'Called when the displayed item changes (including on open).' },
    ],
    methods: [
        { signature: 'ChillLightbox.create(options)', on: 'static', description: 'Create a lightbox instance (nothing is added to the DOM until `open()`).' },
        { signature: 'ChillLightbox.init(target, options)', on: 'static', description: 'Enhance links / images; same `data-chill-lightbox` value = one gallery. Returns `{ galleries, destroy() }`.' },
        { signature: 'ChillLightbox.open(items, index?, options?)', on: 'static', description: 'Create, open and auto-destroy a lightbox. Returns the instance.' },
        { signature: 'ChillLightbox.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'lightbox.open(index?) / close()', description: 'Show at an index (defaults to `startIndex`) or close.' },
        { signature: 'lightbox.next() / prev() / goTo(i)', description: 'Navigate while open; `loop` decides what happens at the ends.' },
        { signature: 'lightbox.zoomIn() / zoomOut() / resetZoom()', description: 'Change the zoom scale (multiplies by 1.4 per step, capped at `maxZoom`).' },
        { signature: 'lightbox.setItems(items)', description: 'Replace the item list; rebuilds thumbnails if open.' },
        { signature: 'lightbox.on(event, fn) / off(event, fn?)', description: 'Subscribe to `open`, `close` and `change`.' },
        { signature: 'lightbox.destroy()', description: 'Close and release everything.' },
        { signature: 'lightbox.index / scale / isOpen / element', description: 'Current index, zoom scale, open flag and root element (after the first open).' },
    ],
    events: [
        { name: 'open', description: 'Viewer opened.' },
        { name: 'close', description: 'Viewer closed.' },
        { name: 'change', payload: '{ index, item }', description: 'The displayed image changed; also fires once on open.' },
    ],
    cssVars: [
        { name: '--chilllightbox-backdrop', description: 'Backdrop colour.' },
        { name: '--chilllightbox-ui', description: 'Button and strip surface colour.' },
        { name: '--chilllightbox-ui-hover', description: 'Hovered control surface.' },
    ],
    a11y: [
        'Esc closes, Left/Right navigate, Home/End jump, `+` / `-` / `0` zoom; Tab is trapped inside the viewer.',
        'Controls are real buttons with `aria-label`s (Close, Zoom in, Previous, Next...).',
        'Focus moves to the close button on open and returns to the opener on close.',
        'Always give items an `alt` (or a caption, which `init()` reuses) so the image has a text alternative.',
        'Transitions respect `prefers-reduced-motion`.',
    ],
    tips: [
        'Provide a small `thumb` for every item; the strip then never downloads full-size images.',
        'Use `srcset` on items for retina / large screens instead of one huge file.',
        'In React, build the `items` array from your data and call `create()` in an effect; call `destroy()` on unmount.',
        'Safe to import on the server: the viewer DOM is only built on the first `open()`.',
    ],
    related: ['modal', 'drawer', 'carousel'],
    keywords: ['gallery', 'image viewer', 'photo', 'zoom', 'fullscreen', 'slideshow'],
};

export default doc;
