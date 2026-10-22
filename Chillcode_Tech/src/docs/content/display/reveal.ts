import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'reveal',
    global: 'ChillReveal',
    category: 'display',
    title: 'Reveal',
    summary: 'Scroll-reveal animations (fade, slide, zoom) with stagger, per-element overrides and reduced-motion safety.',
    style: 'init',
    description:
        'ChillReveal animates elements into view as they enter the viewport, using IntersectionObserver and CSS transitions. ' +
        'Mark elements with `data-chill-reveal="slide-up"` (or pass your own selector) and call `ChillReveal.init()`. Each element can override animation, delay, duration, distance and `once` through data attributes.\n\n' +
        'Content stays fully visible without JavaScript: the hidden start state is only applied after ChillReveal runs. With `prefers-reduced-motion: reduce`, or in browsers without IntersectionObserver, elements are shown immediately with no movement.',
    features: [
        'Seven animations: fade, slide-up/down/left/right, zoom-in and zoom-out',
        'Stagger elements that enter together, plus per-element delay, duration and distance',
        '`once` (default) or repeat every time the element re-enters the viewport',
        'Progressive enhancement: visible without JS, instant under reduced motion',
        '`refresh()` for elements added later; `destroy()` restores original classes and styles',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Slide up on scroll',
            description: 'Scroll the box below. Elements outside the visible area wait until they enter it, then slide up. The default animation is `slide-up`.',
            height: 320,
            code: `const box = document.createElement('div');
box.style.cssText = 'height:260px;overflow:auto;border:1px solid var(--chill-border);border-radius:10px;padding:12px';
for (let i = 1; i <= 6; i++) {
  const card = document.createElement('div');
  card.setAttribute('data-chill-reveal', '');
  card.textContent = 'Section ' + i + ': scroll to reveal';
  card.style.cssText = 'height:90px;margin-bottom:14px;border-radius:10px;padding:14px;color:var(--chill-text);background:var(--chill-bg-secondary)';
  box.append(card);
}
root.append(box);
const r = ChillReveal.init(box.querySelectorAll('[data-chill-reveal]'));
cleanup(() => r.destroy());`,
        },
        {
            id: 'animations',
            title: 'Animation types',
            description: 'Pick an animation per element with the attribute value. `zoom`, `up`, `down`, `left` and `right` are accepted as aliases.',
            height: 340,
            code: `const box = document.createElement('div');
box.style.cssText = 'height:280px;overflow:auto;border:1px solid var(--chill-border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:16px';
const spacer = document.createElement('div');
spacer.style.cssText = 'height:200px;color:var(--chill-text);opacity:.6';
spacer.textContent = 'Scroll down...';
box.append(spacer);
['fade', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out'].forEach((type) => {
  const el = document.createElement('div');
  el.setAttribute('data-chill-reveal', type);
  el.textContent = type;
  el.style.cssText = 'padding:20px;border-radius:10px;color:#fff;font-weight:600;background:linear-gradient(135deg,#6366f1,#ec4899)';
  box.append(el);
});
root.append(box);
const r = ChillReveal.init(box.querySelectorAll('[data-chill-reveal]'), { duration: 700 });
cleanup(() => r.destroy());`,
        },
        {
            id: 'stagger',
            title: 'Stagger and per-element timing',
            description: '`stagger` adds extra delay for each element revealed in the same batch. `data-chill-reveal-delay` and `-duration` override individual elements.',
            height: 300,
            code: `const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:20px';
for (let i = 1; i <= 8; i++) {
  const tile = document.createElement('div');
  tile.setAttribute('data-chill-reveal', 'zoom-in');
  if (i === 8) tile.setAttribute('data-chill-reveal-delay', '600');
  tile.textContent = i;
  tile.style.cssText = 'height:70px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;background:hsl(' + (i * 40) + ',65%,50%)';
  grid.append(tile);
}
root.append(grid);
const r = ChillReveal.init(grid.querySelectorAll('[data-chill-reveal]'), { stagger: 90, threshold: 0.3 });
const btn = document.createElement('button');
btn.textContent = 'Replay';
btn.style.marginTop = '12px';
btn.onclick = () => { r.hide(); setTimeout(() => r.reveal(), 50); };
root.append(btn);
cleanup(() => r.destroy());`,
        },
        {
            id: 'repeat',
            title: 'Repeat on every entry',
            description: '`once: false` hides elements again when they leave the viewport, so they animate on each scroll in. `onReveal` and `onHide` report changes.',
            height: 320,
            code: `const log = document.createElement('p');
log.style.cssText = 'color:var(--chill-text);font-size:13px;margin:0 0 8px';
log.textContent = 'Scroll up and down inside the box';
const box = document.createElement('div');
box.style.cssText = 'height:200px;overflow:auto;border:1px solid var(--chill-border);border-radius:10px;padding:12px';
const spacer = document.createElement('div'); spacer.style.height = '220px';
const badge = document.createElement('div');
badge.setAttribute('data-chill-reveal', 'slide-right');
badge.textContent = 'I come back every time';
badge.style.cssText = 'padding:18px;border-radius:10px;color:#fff;font-weight:600;background:#10b981';
const tail = document.createElement('div'); tail.style.height = '220px';
box.append(spacer, badge, tail);
root.append(log, box);
const r = ChillReveal.init(box.querySelectorAll('[data-chill-reveal]'), {
  once: false,
  onReveal: () => { log.textContent = 'Revealed'; },
  onHide: () => { log.textContent = 'Hidden again'; },
});
cleanup(() => r.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Targeting elements',
            body:
                '`ChillReveal.init(selector, options)` accepts a CSS selector, an element, or a list of elements. With no first argument (or only an options object) it uses `[data-chill-reveal]`. ' +
                'The attribute value picks the animation; an empty value uses `options.animation`.\n\n' +
                'Per-element attributes: `data-chill-reveal-delay` (ms), `data-chill-reveal-duration` (ms), `data-chill-reveal-distance` (px, for slides) and `data-chill-reveal-once` (`"true"` / `"false"`). ' +
                'Once an element has been revealed with `once: true`, it is no longer observed.',
        },
        {
            title: 'Dynamic content and scroll containers',
            body:
                'Elements added after `init()` are ignored until you call `refresh()`, which picks up new matches without touching those already registered.\n\n' +
                'Visibility uses IntersectionObserver against the viewport, which respects `overflow` clipping, so elements inside a scrollable box reveal as they scroll into that box. ' +
                '`threshold` (visible fraction) and `rootMargin` (default `0px 0px -5% 0px`, triggering slightly before the bottom edge) tune the trigger point.\n\n' +
                '`reveal(el?)` shows one or all elements immediately; `hide(el?)` returns them to the hidden state to replay.',
        },
    ],
    options: [
        { name: 'animation', type: "'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out'", default: "'slide-up'", description: 'Default animation when the attribute is empty. Aliases: zoom, up, down, left, right.' },
        { name: 'duration', type: 'number', default: '600', description: 'Duration in ms.' },
        { name: 'delay', type: 'number', default: '0', description: 'Delay in ms.' },
        { name: 'distance', type: 'number', default: '24', description: 'Pixels travelled by slide animations.' },
        { name: 'easing', type: 'string', default: "'cubic-bezier(0.22, 1, 0.36, 1)'", description: 'CSS timing function.' },
        { name: 'stagger', type: 'number', default: '0', description: 'Extra ms of delay per element revealed in the same batch (document order).' },
        { name: 'threshold', type: 'number', default: '0.15', description: 'Visible fraction needed to trigger.' },
        { name: 'rootMargin', type: 'string', default: "'0px 0px -5% 0px'", description: 'IntersectionObserver root margin.' },
        { name: 'once', type: 'boolean', default: 'true', description: 'false hides elements again when they leave the viewport.' },
        { name: 'onReveal', type: '(el, instance) => void', default: 'null', description: 'Called when an element is revealed.' },
        { name: 'onHide', type: '(el, instance) => void', default: 'null', description: 'Called when an element is hidden again (`once: false` or `hide()`).' },
    ],
    methods: [
        { signature: 'ChillReveal.init(selector?, options?)', on: 'static', description: 'Register elements (selector, element or list; default `[data-chill-reveal]`); returns an instance.' },
        { signature: 'ChillReveal.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'reveal.elements', description: 'Array of registered elements.' },
        { signature: 'reveal.refresh()', description: 'Register elements added since `init()`.' },
        { signature: 'reveal.reveal(el?)', description: 'Show one element (or all) immediately.' },
        { signature: 'reveal.hide(el?)', description: 'Reset one element (or all) to hidden so it can animate again.' },
        { signature: 'reveal.destroy()', description: 'Stop observing and restore original classes and styles.' },
    ],
    a11y: [
        'No JavaScript means no hidden state: content is always visible until `init()` runs.',
        'With `prefers-reduced-motion: reduce` elements are shown immediately with no transform or transition.',
        'Animates only opacity and transform, so layout and reading order never change.',
        'Do not hide essential content behind long delays; keep `delay` and `stagger` short for keyboard users who Tab ahead.',
    ],
    tips: [
        'Elements already in view when `init()` runs are revealed on the first observer callback, so above-the-fold content animates once at load.',
        'Call `init()` after your framework has rendered the elements, and `destroy()` on unmount so inline styles are cleaned up.',
        'Avoid putting `data-chill-reveal` on elements that already use `transform` for layout; the animation controls the transform until the element is done.',
    ],
    related: ['marquee', 'masonry', 'backtotop'],
    keywords: ['scroll animation', 'aos', 'fade in', 'intersection observer', 'appear', 'stagger', 'on scroll'],
};

export default doc;
