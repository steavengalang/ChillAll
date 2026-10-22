import type { DocEntry } from '../../types';

/** Builds a wrapper (acts as the containing block for the fixed button) with a scrollable article inside. */
const BOX =
    `const wrap = document.createElement('div');
wrap.style.cssText = 'position:relative;transform:translateZ(0);overflow:hidden;border:1px solid var(--chill-border);border-radius:10px';
const box = document.createElement('div');
box.style.cssText = 'height:220px;overflow:auto;padding:14px;color:var(--chill-text)';
box.innerHTML = '<h4 id="top-title" style="margin:0 0 8px">Release notes</h4>' + Array.from({ length: 16 }, (_, i) => '<p style="margin:0 0 10px">Version 2.' + i + ' - performance improvements, accessibility fixes and a handful of small polish items.</p>').join('');
wrap.append(box);
root.append(wrap);`;

const doc: DocEntry = {
    id: 'backtotop',
    global: 'ChillBackToTop',
    category: 'feedback',
    title: 'Back To Top',
    summary: 'Floating back-to-top button that appears on scroll, with a progress ring, for the page or any container.',
    style: 'create',
    description:
        'ChillBackToTop adds the familiar floating arrow that scrolls the page (or any scrollable container) back to the start. It stays hidden until the user has scrolled ' +
        'past a `threshold`, and an optional ring around it fills as they read down the page.\n\n' +
        'The button is `position: fixed`, so by default it sits in a corner of the viewport. Scroll position is read passively and updates are throttled with `requestAnimationFrame`. ' +
        'Users who prefer reduced motion always get an instant jump instead of smooth scrolling.',
    features: [
        'Shows after a configurable scroll threshold, hides again at the top',
        'Optional progress ring that tracks how far the user has scrolled',
        'Works for the window or any scrollable element via `target`',
        'Three corner positions, three sizes (or pixels), custom icon text and label',
        '`focusTarget` moves keyboard focus to a landmark after scrolling',
    ],
    examples: [
        {
            id: 'scroll-box',
            title: 'Scrollable container',
            description: 'Point `target` at a scrolling element and the button follows that element\'s scroll position instead of the page\'s. Scroll the box below.',
            height: 260,
            code: BOX + `
const btt = ChillBackToTop.create({ target: box, container: wrap, threshold: 80, offset: 12, size: 'sm' });
cleanup(() => btt.destroy());`,
        },
        {
            id: 'style',
            title: 'Position, size and icon',
            description: 'Bottom-left, large, a text icon, no progress ring and instant (`auto`) scrolling.',
            height: 260,
            code: BOX + `
const btt = ChillBackToTop.create({
  target: box, container: wrap, threshold: 80, offset: 12,
  position: 'bottom-left', size: 'lg', progress: false, icon: '↑', label: 'Jump to start', behavior: 'auto',
});
cleanup(() => btt.destroy());`,
        },
        {
            id: 'events',
            title: 'Events and focus management',
            description: '`onShow` / `onHide` / `onClick` report what happens; `focusTarget` sends keyboard focus to the heading after scrolling so screen-reader users land at the top.',
            height: 300,
            code: BOX + `
const log = document.createElement('p');
log.style.color = 'var(--chill-text)';
log.textContent = 'Button hidden';
root.append(log);
const btt = ChillBackToTop.create({
  target: box, container: wrap, threshold: 100, offset: 12, size: 'sm',
  focusTarget: box.querySelector('#top-title'),
  onShow: () => (log.textContent = 'Button visible'),
  onHide: () => (log.textContent = 'Button hidden'),
});
btt.on('click', () => console.log('back to top clicked'));
cleanup(() => btt.destroy());`,
        },
        {
            id: 'page',
            title: 'Whole page',
            description: 'With no `target` the button watches the window. It appears in the bottom-right corner of this docs page once you scroll down 300px. It is removed when you leave the example.',
            code: `const btt = ChillBackToTop.create({ threshold: 300, position: 'bottom-right', progress: true });
const note = document.createElement('p');
note.style.color = 'var(--chill-text)';
note.textContent = 'Scroll this page down to reveal the floating button.';
root.append(note);
cleanup(() => btt.destroy());`,
            height: 100,
        },
    ],
    guides: [
        {
            title: 'Page vs container',
            body:
                '`ChillBackToTop.create()` (alias `init`) with no `target` observes `window` and scrolls it to `top: 0`. ' +
                'Give `target` a selector or element to observe a scrollable box (a chat log, a modal body, a code panel) instead. The button is still mounted in `container` (default `document.body`).\n\n' +
                '```js\nChillBackToTop.create({ target: "#messages", threshold: 200, position: "bottom-center" });\n```',
        },
        {
            title: 'Scoping the button to a panel',
            body:
                'Because the button uses `position: fixed`, it is placed relative to the viewport. To pin it inside a panel, mount it in a `container` that is a containing block for fixed elements, ' +
                'for example one with `transform: translateZ(0)` (the examples above do this):\n\n' +
                '```js\npanel.style.position = "relative";\npanel.style.transform = "translateZ(0)";\nChillBackToTop.create({ target: scroller, container: panel, offset: 12 });\n```',
        },
        {
            title: 'Styling',
            body:
                'Colours and shadow come from CSS variables, set size and offset through the options:\n\n' +
                '```css\n:root {\n  --chillbacktotop-bg: #111827;\n  --chillbacktotop-text: #f9fafb;\n  --chillbacktotop-primary: #f59e0b;\n}\n```\n\n' +
                'Add your own class with `className` to override the rest.',
        },
    ],
    options: [
        { name: 'threshold', type: 'number', default: '300', description: 'Scroll distance in px after which the button appears.' },
        { name: 'position', type: "'bottom-right' | 'bottom-left' | 'bottom-center'", default: "'bottom-right'", description: 'Which bottom corner (or centre) the button sits in.' },
        { name: 'offset', type: 'number', default: '24', description: 'Distance from the viewport (or containing block) edge in px.' },
        { name: 'size', type: "'sm' | 'md' | 'lg' | number", default: "'md'", description: 'Diameter: 36, 44, 56px or a number of pixels.' },
        { name: 'progress', type: 'boolean', default: 'true', description: 'Show the ring that fills with scroll progress.' },
        { name: 'target', type: 'Window | string | Element', default: 'window', description: 'Scroller to observe and scroll. Falls back to the window if a selector matches nothing.' },
        { name: 'label', type: 'string', default: "'Back to top'", description: 'Accessible name (`aria-label`).' },
        { name: 'icon', type: 'string', default: 'null', description: 'Text or emoji replacing the default arrow (inserted as text).' },
        { name: 'behavior', type: "'smooth' | 'auto'", default: "'smooth'", description: 'Scroll behaviour; reduced-motion users always get `auto`.' },
        { name: 'focusTarget', type: 'string | Element', default: 'null', description: 'Element to focus after scrolling. Gets `tabindex="-1"` if it is not natively focusable. Without it the button is blurred.' },
        { name: 'container', type: 'Element', default: 'document.body', description: 'Element the button is appended to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the button.' },
        { name: 'onClick', type: '(event, instance) => void', default: 'null', description: 'Called before scrolling when the button is clicked.' },
        { name: 'onShow', type: '(instance) => void', default: 'null', description: 'Called when the button becomes visible.' },
        { name: 'onHide', type: '(instance) => void', default: 'null', description: 'Called when the button hides.' },
    ],
    methods: [
        { signature: 'ChillBackToTop.create(options)', on: 'static', description: 'Create and mount the button. Returns the instance.' },
        { signature: 'ChillBackToTop.init(options)', on: 'static', description: 'Alias of `create`.' },
        { signature: 'ChillBackToTop.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'btt.scrollToTop()', description: 'Scroll the target to the top programmatically (and apply `focusTarget`).' },
        { signature: 'btt.show() / hide()', description: 'Force the visible state (it is recomputed on the next scroll).' },
        { signature: 'btt.update()', description: 'Re-read the scroll position, e.g. after content height changes.' },
        { signature: 'btt.on(event, fn) / off(event, fn?)', description: 'Subscribe to `show`, `hide` and `click`.' },
        { signature: 'btt.destroy()', description: 'Remove the button and all listeners.' },
        { signature: 'btt.element / visible', description: 'The button element and its visibility flag.' },
    ],
    events: [
        { name: 'show', description: 'Button became visible.' },
        { name: 'hide', description: 'Button was hidden.' },
        { name: 'click', payload: 'MouseEvent', description: 'Button was clicked (fired before scrolling).' },
    ],
    cssVars: [
        { name: '--chillbacktotop-bg / --chillbacktotop-text', description: 'Button surface and icon colour.' },
        { name: '--chillbacktotop-primary', description: 'Progress ring colour and focus outline.' },
        { name: '--chillbacktotop-track', description: 'Progress ring track.' },
        { name: '--chillbacktotop-shadow', description: 'Drop shadow.' },
        { name: '--chillbacktotop-size / --chillbacktotop-offset', description: 'Set per button from the options.' },
    ],
    a11y: [
        'A real `<button>` with `aria-label` (default "Back to top"); Enter and Space activate it.',
        'While hidden it has `aria-hidden="true"` and `tabindex="-1"`, so it is skipped by keyboard and screen readers; both are removed when visible.',
        'Use `focusTarget` so focus follows the scroll instead of staying at the bottom of the page.',
        'Smooth scrolling and transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'If page content grows after load (lazy lists), call `btt.update()` so the progress ring stays accurate.',
        'Avoid placing the button on top of a cookie banner or chat widget: change `position` or `offset`.',
        'In React, create in an effect and `destroy()` in cleanup. In single-page apps remember to destroy on route changes.',
        'Safe to import on the server; the button is created in the browser when you call `create()`.',
    ],
    related: ['button', 'progress', 'scrollspy'],
    keywords: ['scroll to top', 'floating action button', 'scroll progress', 'jump to top'],
};

export default doc;
