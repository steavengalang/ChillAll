import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'marquee',
    global: 'ChillMarquee',
    category: 'display',
    title: 'Marquee',
    summary: 'Seamless infinite ticker in four directions with pause on hover, controls and reduced-motion fallback.',
    style: 'create',
    description:
        'ChillMarquee scrolls a row (or column) of items forever, for logo walls, news tickers and announcement bars. ' +
        'It clones the item group as many times as needed to fill the viewport, animates with a GPU-friendly CSS transform and keeps the loop seamless at any speed.\n\n' +
        'Items may be strings (inserted as **text**), DOM nodes, or any value rendered through `renderItem`. Clones are `aria-hidden` and inert, so assistive tech and Tab order only see one copy. ' +
        'With `prefers-reduced-motion` the marquee becomes a static, scrollable list.',
    features: [
        'Left, right, up and down directions with speed in pixels per second',
        'Pause on hover and focus, a visible play/pause button (WCAG 2.2.2) and an edge `fade`',
        'Items as text, nodes or a `renderItem` function; live updates with `setItems()` and `append()`',
        'Automatic cloning keeps the seam invisible; recalculates when the container resizes',
        'Reduced-motion aware: falls back to a static scrollable list',
    ],
    examples: [
        {
            id: 'basic',
            title: 'News ticker',
            description: 'Strings become text items. Hover to pause.',
            code: `const m = ChillMarquee.create({
  items: ['Version 2.0 is out', 'Free shipping over $50', 'New: dark mode everywhere', 'Join 12,000 happy users'],
  speed: 70,
  gap: 48,
  ariaLabel: 'Latest news',
  parent: root,
});
cleanup(() => m.destroy());`,
        },
        {
            id: 'logos',
            title: 'Logo wall with fade',
            description: '`renderItem` builds each item; `fade` softens the edges. Use `direction: "right"` to scroll the other way.',
            height: 140,
            code: `const brands = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne'];
const m = ChillMarquee.create({
  items: brands,
  renderItem: (name, i) => {
    const el = document.createElement('div');
    el.textContent = name;
    el.style.cssText = 'padding:10px 22px;border:1px solid var(--chill-border);border-radius:999px;font-weight:600;color:var(--chill-text)';
    return el;
  },
  direction: 'right',
  fade: true,
  speed: 50,
  parent: root,
});
cleanup(() => m.destroy());`,
        },
        {
            id: 'vertical',
            title: 'Vertical marquee',
            description: '`up` and `down` scroll a column inside a viewport whose `height` you choose.',
            height: 220,
            code: `const m = ChillMarquee.create({
  items: ['Deploy finished', 'Backup complete', 'New comment on #482', 'Invoice paid', 'Cache cleared'],
  direction: 'up',
  height: 160,
  gap: 12,
  speed: 30,
  parent: root,
});
cleanup(() => m.destroy());`,
        },
        {
            id: 'controls',
            title: 'Controls and live API',
            description: '`controls: true` renders a pause/play button. The instance can also change speed and items at runtime.',
            height: 190,
            code: `const m = ChillMarquee.create({ items: ['Alpha', 'Beta', 'Gamma'], controls: true, gap: 40, parent: root });
m.on('pause', () => console.log('paused'));
m.on('play', () => console.log('playing'));
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
[['Faster', () => m.setSpeed(160)], ['Slower', () => m.setSpeed(30)], ['Add item', () => m.append('Delta')]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(bar);
cleanup(() => m.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` turns the children of an element into marquee items and returns an instance.',
            height: 120,
            code: `root.innerHTML = '<div id="tags"><span>#design</span><span>#frontend</span><span>#opensource</span><span>#a11y</span></div>';
const m = ChillMarquee.init(root.querySelector('#tags'), { speed: 40, gap: 28 });
cleanup(() => m.destroy());`,
        },
    ],
    guides: [
        {
            title: 'How the loop works',
            body:
                'The marquee measures one group of items, then renders enough copies to cover the viewport plus one extra, and animates by exactly one group width. ' +
                '`gap` is both the space between items and the seam between loops, so spacing stays even. Call `refresh()` after changing the container size from outside (for example when it was hidden at creation).\n\n' +
                '`speed` is in pixels per second, so a longer list does not scroll faster.',
        },
        {
            title: 'Reduced motion and controls',
            body:
                '`reducedMotion: "auto"` follows the OS setting and shows a static, scrollable list when reduced motion is requested. ' +
                'Use `"static"` to always disable animation, or `"ignore"` to always animate. `isStatic()` tells you which mode is active.\n\n' +
                'Moving content that lasts more than five seconds should be pausable. Hover and focus pause it automatically; set `controls: true` for a visible button as well.',
        },
    ],
    options: [
        { name: 'items', type: 'any[]', default: '[]', description: 'Strings (text), Nodes, or any value when `renderItem` is given.' },
        { name: 'renderItem', type: '(item, index) => Node | string', default: 'null', description: 'Build the element for an item. Returned strings are inserted as text.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string items as HTML (trusted content only).' },
        { name: 'speed', type: 'number', default: '60', description: 'Pixels per second.' },
        { name: 'direction', type: "'left' | 'right' | 'up' | 'down'", default: "'left'", description: 'Scroll direction.' },
        { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Pause while hovered or focused within.' },
        { name: 'gap', type: 'number', default: '24', description: 'Pixels between items (and at the loop seam).' },
        { name: 'height', type: 'number | string', default: 'null', description: 'Viewport height in vertical mode (px number or CSS length); falls back to 240px.' },
        { name: 'fade', type: 'boolean', default: 'false', description: 'Soft fade-out at both edges.' },
        { name: 'autoplay', type: 'boolean', default: 'true', description: 'Start animating immediately.' },
        { name: 'reducedMotion', type: "'auto' | 'static' | 'ignore'", default: "'auto'", description: 'Follow `prefers-reduced-motion`, always show static, or always animate.' },
        { name: 'controls', type: 'boolean', default: 'false', description: 'Render a visible pause/play button.' },
        { name: 'ariaLabel', type: 'string', default: "'Scrolling content'", description: 'Accessible name of the region.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class names.' },
        { name: 'parent', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'onPlay / onPause', type: '() => void', default: 'null', description: 'Playback callbacks.' },
    ],
    methods: [
        { signature: 'ChillMarquee.create(options)', on: 'static', description: 'Create a marquee; returns an instance.' },
        { signature: 'ChillMarquee.init(target, options)', on: 'static', description: 'Turn an element\'s children into items; element returns an instance, selector or list an array.' },
        { signature: 'ChillMarquee.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'marquee.element / trackEl', description: 'The root and the animated track.' },
        { signature: 'marquee.setItems(items) / append(items) / getItems()', description: 'Replace, add or read the items.' },
        { signature: 'marquee.setSpeed(n) / setDirection(d) / setGap(n)', description: 'Change playback and layout live.' },
        { signature: 'marquee.setPauseOnHover(bool)', description: 'Enable or disable pause on hover.' },
        { signature: 'marquee.play() / pause() / toggle()', description: 'Control playback.' },
        { signature: 'marquee.isPlaying() / isStatic()', description: 'Whether it is animating, or in the static reduced-motion mode.' },
        { signature: 'marquee.refresh()', description: 'Re-measure after the container size changed.' },
        { signature: 'marquee.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'marquee.destroy()', description: 'Stop the animation and remove generated DOM (restores `init()` children).' },
    ],
    events: [
        { name: 'play', description: 'Playback started.' },
        { name: 'pause', description: 'Playback paused.' },
        { name: 'update', payload: '{ items }', description: 'Items changed.' },
        { name: 'static', payload: '{ static }', description: 'Entered or left the static reduced-motion mode.' },
        { name: 'destroy', description: 'The instance was destroyed.' },
    ],
    cssVars: [
        { name: '--chillmarquee-primary', description: 'Focus ring and button accent.' },
        { name: '--chillmarquee-bg / --chillmarquee-text', description: 'Background (transparent by default) and text colour (inherit).' },
        { name: '--chillmarquee-border', description: 'Border colour of controls.' },
        { name: '--chillmarquee-btn-bg / --chillmarquee-btn-text', description: 'Pause/play button colours.' },
        { name: '--chillmarquee-fade', description: 'Edge fade colour.' },
    ],
    a11y: [
        'The region has an `aria-label` (set `ariaLabel`); cloned copies are `aria-hidden` and inert, so only one copy is read and focusable.',
        'Pauses on hover and keyboard focus within; `controls: true` adds a labelled pause/play button for WCAG 2.2.2.',
        'With `prefers-reduced-motion` the content is static and scrollable instead of animated.',
    ],
    tips: [
        'Interactive items (links, buttons) are focusable in the first copy only; keep them few so keyboard users are not slowed down.',
        'Give images explicit width and height so measuring is correct before they load, or call `refresh()` once they have.',
        'The module is safe to import on the server; create marquees in the browser and `destroy()` them on unmount.',
    ],
    related: ['carousel', 'countdown', 'reveal'],
    keywords: ['ticker', 'scroll', 'infinite', 'logos', 'news', 'banner', 'announcement'],
};

export default doc;
