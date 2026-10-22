import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'carousel',
    global: 'ChillCarousel',
    category: 'display',
    title: 'Carousel',
    summary: 'Swipeable carousel with dots, arrows, autoplay, looping and responsive slides-per-view.',
    style: 'create',
    description:
        'ChillCarousel is a lightweight slider for galleries, testimonials and product rails. Slides can be text, DOM nodes or the children of an existing element. ' +
        'It supports pointer and touch swiping, keyboard navigation, autoplay with a play/pause button, and a responsive `slidesPerView` based on the container width.\n\n' +
        'String slides are inserted as **text**; set `html: true` only for trusted markup. Autoplay pauses on hover and focus and is disabled for users who prefer reduced motion.',
    features: [
        'Dots, arrow buttons, swipe/drag and keyboard (Left, Right, Home, End)',
        'Autoplay with pause on hover/focus and an accessible play/pause toggle',
        '`loop`, `startIndex`, `gap` and a configurable transition `speed`',
        'Multiple slides per view with container-width `breakpoints`',
        'Respects `prefers-reduced-motion` and announces slide changes politely',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic carousel',
            description: 'Pass an array of slides. Plain strings are rendered as text; DOM nodes are used as is.',
            height: 260,
            code: `const slide = (title, bg) => {
  const d = document.createElement('div');
  d.style.cssText = 'height:200px;display:flex;align-items:center;justify-content:center;font:600 22px system-ui;color:#fff;background:' + bg;
  d.textContent = title;
  return d;
};
const c = ChillCarousel.create({
  slides: [slide('Plan', 'linear-gradient(135deg,#6366f1,#8b5cf6)'), slide('Build', 'linear-gradient(135deg,#0ea5e9,#10b981)'), slide('Ship', 'linear-gradient(135deg,#f59e0b,#ef4444)')],
  onChange: (index) => console.log('slide', index),
});
root.append(c.element);
cleanup(() => c.destroy());`,
        },
        {
            id: 'autoplay',
            title: 'Autoplay and loop',
            description: '`autoplay` is the delay in ms. With `loop` it wraps around forever; the play/pause button lets users stop it.',
            height: 220,
            code: `const quotes = ['"Setup took five minutes." - Priya', '"Our bundle got 40 KB lighter." - Marco', '"Accessible out of the box." - Lena'];
const c = ChillCarousel.create({
  slides: quotes,
  autoplay: 2500,
  loop: true,
  arrows: false,
  ariaLabel: 'Customer quotes',
});
c.element.style.textAlign = 'center';
c.element.style.padding = '32px 16px';
root.append(c.element);
cleanup(() => c.destroy());`,
        },
        {
            id: 'multi',
            title: 'Multiple slides per view',
            description: '`slidesPerView` sets the default and `breakpoints` (container width in px -> slides) adapts it. Use `gap` for spacing.',
            height: 200,
            code: `const cards = ['Design', 'Frontend', 'Backend', 'Data', 'Mobile', 'DevOps'].map((t, i) => {
  const d = document.createElement('div');
  d.style.cssText = 'height:120px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:600 16px system-ui;color:#fff;background:hsl(' + (i * 55) + ',65%,50%)';
  d.textContent = t;
  return d;
});
const c = ChillCarousel.create({ slides: cards, slidesPerView: 1, breakpoints: { 480: 2, 720: 3 }, gap: 12 });
root.append(c.element);
cleanup(() => c.destroy());`,
        },
        {
            id: 'api',
            title: 'Control from code',
            description: '`next()`, `prev()`, `goTo(i)` and the `change` event let you build custom controls or sync other UI.',
            height: 260,
            code: `const c = ChillCarousel.create({ slides: ['One', 'Two', 'Three', 'Four'], dots: false, arrows: false, loop: true });
c.element.style.cssText += ';text-align:center;font:600 28px system-ui;padding:40px 0';
const label = document.createElement('p');
label.style.cssText = 'text-align:center;color:var(--chill-text)';
c.on('change', (i) => { label.textContent = 'Now showing #' + (i + 1); });
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;justify-content:center';
[['Prev', () => c.prev()], ['Next', () => c.next()], ['Last', () => c.goTo(3)]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(c.element, label, bar);
cleanup(() => c.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` turns the children of an element into slides; `destroy()` puts them back.',
            height: 230,
            code: `root.innerHTML = '<div id="gallery"><div style="height:160px;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center">Alpine lake</div><div style="height:160px;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center">Pine forest</div><div style="height:160px;background:#f59e0b;color:#fff;display:flex;align-items:center;justify-content:center">Desert dunes</div></div>';
const c = ChillCarousel.init('#gallery', { loop: true });
cleanup(() => c.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Slides per view and pages',
            body:
                'The number of pages is `slides - slidesPerView + 1`, so with 6 slides and 3 per view you get 4 pages, and `goTo(i)` / `getIndex()` work in pages. ' +
                '`breakpoints` keys are minimum **container** widths (not the viewport), and the largest matching key wins. ' +
                'The carousel observes its container, so it adapts when a sidebar opens or the window resizes.',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** builds a `<section>` in `carousel.element`. Append it yourself.\n' +
                '- **`init(target, options)`** takes a selector or element, moves its children into slides (unless you pass `slides`) and returns an instance or `null`. ' +
                '`destroy()` restores the original children.\n\n' +
                'Slides need an intrinsic or explicit height; give your slide content a height or an aspect ratio.',
        },
    ],
    options: [
        { name: 'slides', type: '(string | Node)[]', default: '[]', description: 'Slide contents. Strings are text unless `html` is true.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string slides as HTML (unsafe with untrusted data).' },
        { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap around at both ends.' },
        { name: 'autoplay', type: 'number | false', default: 'false', description: 'Milliseconds between slides; false or 0 disables.' },
        { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Pause autoplay on hover and keyboard focus.' },
        { name: 'slidesPerView', type: 'number', default: '1', description: 'Slides visible at once.' },
        { name: 'breakpoints', type: '{ [minWidth: number]: number }', default: 'null', description: 'Container width (px) to slides-per-view map.' },
        { name: 'gap', type: 'number', default: '0', description: 'Gap between slides in px.' },
        { name: 'dots', type: 'boolean', default: 'true', description: 'Render pagination dots.' },
        { name: 'arrows', type: 'boolean', default: 'true', description: 'Render previous / next buttons.' },
        { name: 'swipe', type: 'boolean', default: 'true', description: 'Pointer drag and touch swipe.' },
        { name: 'keyboard', type: 'boolean', default: 'true', description: 'Left, Right, Home and End when the carousel has focus.' },
        { name: 'speed', type: 'number', default: '350', description: 'Transition duration in ms.' },
        { name: 'startIndex', type: 'number', default: '0', description: 'Initial page.' },
        { name: 'respectReducedMotion', type: 'boolean', default: 'true', description: 'Disable autoplay and animation when the user prefers reduced motion.' },
        { name: 'ariaLabel', type: 'string', default: "'Carousel'", description: 'Label of the carousel region.' },
        { name: 'onChange', type: '(index, prevIndex) => void', default: 'null', description: 'Called when the page changes.' },
    ],
    methods: [
        { signature: 'ChillCarousel.create(options)', on: 'static', description: 'Create a carousel; append `instance.element` yourself.' },
        { signature: 'ChillCarousel.init(target, options)', on: 'static', description: 'Turn an element\'s children into slides; returns an instance or `null`.' },
        { signature: 'ChillCarousel.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'carousel.element', description: 'The root element.' },
        { signature: 'carousel.next() / prev()', description: 'Go to the next or previous page (wraps when `loop` is on).' },
        { signature: 'carousel.goTo(index)', description: 'Go to a page; clamped, or wrapped with `loop`.' },
        { signature: 'carousel.play() / pause()', description: 'Start or stop autoplay.' },
        { signature: 'carousel.setSlides(slides, startIndex?)', description: 'Replace all slides.' },
        { signature: 'carousel.update()', description: 'Recompute layout after the container size changed.' },
        { signature: 'carousel.getIndex() / getPerView()', description: 'Current page and current slides-per-view.' },
        { signature: 'carousel.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'carousel.destroy()', description: 'Remove listeners and generated DOM; restores `init()` children.' },
    ],
    events: [
        { name: 'change', payload: '(index, prevIndex)', description: 'The page changed.' },
        { name: 'play', description: 'Autoplay started.' },
        { name: 'pause', description: 'Autoplay paused.' },
    ],
    cssVars: [
        { name: '--chillcarousel-primary', description: 'Active dot and focus ring colour.' },
        { name: '--chillcarousel-control-bg / --chillcarousel-control-fg', description: 'Arrow and play button colours.' },
        { name: '--chillcarousel-dot', description: 'Inactive dot colour.' },
        { name: '--chillcarousel-bg / --chillcarousel-text', description: 'Surface and text colours.' },
        { name: '--chillcarousel-border / --chillcarousel-surface', description: 'Border and control surface.' },
    ],
    a11y: [
        'The root is `role="region"` with `aria-roledescription="carousel"` and an `aria-label`.',
        'Arrows, dots and the play/pause button are real buttons; dots sit in a group labelled "Choose slide".',
        'A polite live region announces "Slide N of M" after navigation.',
        'Autoplay pauses on hover and focus, has a visible pause control, and is off under `prefers-reduced-motion`.',
    ],
    tips: [
        'Give each slide a defined height (or `aspect-ratio`) so the track does not collapse.',
        'Use `breakpoints` for responsive rails instead of media queries; they track the container width.',
        'The module is safe to import on the server; create carousels in the browser and `destroy()` them on unmount.',
    ],
    related: ['lightbox', 'card', 'marquee', 'masonry'],
    keywords: ['slider', 'gallery', 'slideshow', 'swiper', 'testimonials'],
};

export default doc;
