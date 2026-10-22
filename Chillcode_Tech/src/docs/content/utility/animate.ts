import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'animate',
    global: 'ChillAnimate',
    category: 'utility',
    title: 'Animate',
    summary: 'Promise-based Web Animations helpers: fade, slide, expand, collapse, shake and pulse.',
    style: 'static',
    description:
        'ChillAnimate wraps the Web Animations API in a handful of ready-made effects: `fadeIn`, `fadeOut`, `slideDown`, `slideUp`, `expand`, `collapse`, `shake` and `pulse`, ' +
        'plus a generic `animate()` for your own keyframes. Every helper returns a Promise that resolves when the animation finishes **or is cancelled**, so `await` is always safe.\n\n' +
        'The returned promise also carries `.cancel()`, `.finish()` and `.animation` (the underlying `Animation`). Under `prefers-reduced-motion: reduce`, or when the Web Animations API is missing, the end state is applied immediately without animating, so awaiting code behaves identically.',
    features: [
        'Eight effects plus a generic `animate(el, keyframes, options)`',
        'Promises that resolve on finish or cancel, with `.cancel()`, `.finish()` and `.animation`',
        '`expand` / `collapse` toggle `[hidden]` and `aria-expanded` on a `trigger` for accessible disclosure widgets',
        'Honours `prefers-reduced-motion` automatically (opt out per call with `respectReducedMotion: false`)',
        'Starting a new animation on an element cancels the previous one cleanly; `stop(el)` does it explicitly',
    ],
    examples: [
        {
            id: 'fade',
            title: 'Fade in and out',
            description: '`fadeOut` finishes by setting `display: none`; `fadeOut(el, { hide: false })` keeps the element laid out. `fadeIn` removes `[hidden]` and restores the natural display.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px;align-items:flex-start';
const card = document.createElement('div');
card.textContent = 'Deployment succeeded. 3 services updated.';
card.style.cssText = 'padding:16px 20px;border-radius:12px;background:#16a34a;color:#fff;font-weight:600';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'fadeOut', size: 'sm', variant: 'outline', onClick: () => ChillAnimate.fadeOut(card, { duration: 400 }) }),
  ChillButton.create({ text: 'fadeIn', size: 'sm', onClick: () => ChillAnimate.fadeIn(card, { duration: 400 }) }),
);
root.append(row, card);
cleanup(() => ChillAnimate.stop(card));`,
            height: 140,
        },
        {
            id: 'slide',
            title: 'Slide up and down',
            description: '`slideUp` / `slideDown` animate the height and toggle `display: none`. The promise resolves with the element, so you can chain steps.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const panel = document.createElement('div');
panel.innerHTML = '<strong>Release notes</strong><p style="margin:8px 0 0">Faster startup, a redesigned settings page and 14 bug fixes. Upgrade is safe and takes under a minute.</p>';
panel.style.cssText = 'padding:14px 18px;border:1px solid var(--chill-border);border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text)';
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-size:13px';
const toggle = ChillButton.create({ text: 'Toggle notes', size: 'sm' });
let open = true;
toggle.addEventListener('click', async () => {
  open = !open;
  status.textContent = open ? 'Sliding down...' : 'Sliding up...';
  const el = await (open ? ChillAnimate.slideDown(panel, { duration: 350 }) : ChillAnimate.slideUp(panel, { duration: 350 }));
  status.textContent = 'Done: ' + (el === panel ? 'promise resolved with the element' : 'no element');
});
root.append(toggle, panel, status);
cleanup(() => ChillAnimate.stop(panel));`,
            height: 200,
        },
        {
            id: 'disclosure',
            title: 'Accessible expand and collapse',
            description: '`expand` / `collapse` also animate padding, margin and opacity, toggle the `hidden` attribute and keep `aria-expanded` in sync on the `trigger`.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:0;max-width:420px';
const trigger = document.createElement('button');
trigger.type = 'button';
trigger.textContent = 'What is included in the Pro plan?';
trigger.setAttribute('aria-expanded', 'false');
trigger.setAttribute('aria-controls', 'docs-anim-body');
trigger.style.cssText = 'text-align:left;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit;cursor:pointer';
const body = document.createElement('div');
body.id = 'docs-anim-body';
body.hidden = true;
body.textContent = 'Unlimited projects, priority support, audit logs and single sign-on. Cancel any time from the billing page.';
body.style.cssText = 'padding:12px 16px;margin-top:6px;border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:14px';
root.append(trigger, body);
trigger.addEventListener('click', () => {
  const isOpen = trigger.getAttribute('aria-expanded') === 'true';
  if (isOpen) ChillAnimate.collapse(body, { trigger });
  else ChillAnimate.expand(body, { trigger, duration: 300 });
});
cleanup(() => ChillAnimate.stop(body));`,
            height: 170,
        },
        {
            id: 'attention',
            title: 'Shake and pulse',
            description: '`shake` is made for validation errors (options `distance`, `count`); `pulse` draws attention to a badge or counter (option `scale`).',
            code: `root.style.cssText += ';display:flex;gap:16px;align-items:center;flex-wrap:wrap';
const input = document.createElement('input');
input.type = 'email';
input.placeholder = 'you@company.com';
input.setAttribute('aria-label', 'Email');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const badge = document.createElement('span');
badge.textContent = '3 new';
badge.style.cssText = 'padding:4px 12px;border-radius:999px;background:#3b82f6;color:#fff;font-size:13px;font-weight:600';
root.append(
  input,
  ChillButton.create({ text: 'Submit (invalid)', size: 'sm', variant: 'danger', onClick: () => { input.style.borderColor = '#dc2626'; ChillAnimate.shake(input, { distance: 10, count: 5 }); } }),
  badge,
  ChillButton.create({ text: 'Pulse badge', size: 'sm', variant: 'secondary', onClick: () => ChillAnimate.pulse(badge, { scale: 1.3 }) }),
);
cleanup(() => { ChillAnimate.stop(input); ChillAnimate.stop(badge); });`,
            height: 120,
        },
        {
            id: 'custom-control',
            title: 'Custom keyframes, finish and cancel',
            description: '`animate(el, keyframes, options)` runs your own keyframes (`duration`, `easing`, `delay`, `iterations`). Use the promise\'s `cancel()` / `finish()` or `ChillAnimate.stop(el)` to control it.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const box = document.createElement('div');
box.style.cssText = 'width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#a855f7)';
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px';
status.textContent = 'reduced motion: ' + ChillAnimate.prefersReducedMotion();
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
let current = null;
const run = () => {
  current = ChillAnimate.animate(box, [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(200px) rotate(360deg)' }], { duration: 1500, easing: 'ease-in-out' });
  current.then(() => (status.textContent = 'promise settled (finished or cancelled)'));
  status.textContent = 'running... has .animation: ' + !!current.animation;
};
row.append(
  ChillButton.create({ text: 'Run', size: 'sm', onClick: run }),
  ChillButton.create({ text: 'promise.finish()', size: 'sm', variant: 'outline', onClick: () => current && current.finish() }),
  ChillButton.create({ text: 'ChillAnimate.stop(box)', size: 'sm', variant: 'ghost', onClick: () => { status.textContent = 'stop() returned ' + ChillAnimate.stop(box); } }),
);
root.append(row, box, status);
cleanup(() => ChillAnimate.stop(box));`,
            height: 190,
        },
    ],
    guides: [
        {
            title: 'Promises, cancel and reduced motion',
            body:
                'All helpers return `Promise<Element>` that resolves with the element (or `null` if it was not found) when the animation ends **or is cancelled**. Temporary inline styles (`overflow`, `height`, `opacity`) are always cleaned up. ' +
                'The "end state" (`display: none`, `hidden`, ...) is applied only when the animation finishes normally.\n\n' +
                '```js\nawait ChillAnimate.fadeOut(toast);          // element is display:none afterwards\nconst p = ChillAnimate.collapse(section, { trigger: btn });\np.cancel();                                // settles immediately, no end state applied\n```\n\n' +
                'With `prefers-reduced-motion: reduce`, or without `element.animate`, or when `duration` is 0, the end state is applied instantly. Pass `respectReducedMotion: false` only for animations that carry meaning.',
        },
        {
            title: 'Slide vs expand',
            body:
                '`slideDown` / `slideUp` animate only the **height** and toggle `display`. They suit simple blocks without padding. ' +
                '`expand` / `collapse` additionally animate padding, margin and opacity, toggle the `hidden` attribute (so assistive tech ignores collapsed content) and update `aria-expanded` on the `trigger` option (an element or selector). Prefer them for accordions and disclosure panels.\n\n' +
                'The elements to animate can be passed as an element or a CSS selector string.',
        },
    ],
    options: [
        { name: 'duration', type: 'number', default: '250', description: 'Milliseconds. `shake` and `pulse` default to 400. `0` applies the end state immediately.' },
        { name: 'easing', type: 'string', default: "'ease-out'", description: 'Any CSS easing. `shake` and `pulse` default to `ease-in-out`.' },
        { name: 'delay', type: 'number', default: '0', description: 'Milliseconds before the animation starts.' },
        { name: 'iterations', type: 'number', default: '1', description: 'Repeat count (`Infinity` allowed).' },
        { name: 'respectReducedMotion', type: 'boolean', default: 'true', description: 'Skip the animation when the user prefers reduced motion.' },
        { name: 'display', type: 'string', default: 'natural display', description: 'fadeIn / slideDown / expand: CSS display value to set when showing.' },
        { name: 'hide', type: 'boolean', default: 'true', description: 'fadeOut: set `display: none` when finished. `false` keeps the element and restores opacity.' },
        { name: 'trigger', type: 'Element | selector', default: 'null', description: 'expand / collapse: element whose `aria-expanded` is updated.' },
        { name: 'distance', type: 'number', default: '8', description: 'shake: maximum horizontal travel in px.' },
        { name: 'count', type: 'number', default: '4', description: 'shake: number of oscillations.' },
        { name: 'scale', type: 'number', default: '1.08', description: 'pulse: peak scale factor.' },
    ],
    methods: [
        { signature: 'ChillAnimate.fadeIn(el, options?)', on: 'static', description: 'Show the element and fade opacity 0 to 1.' },
        { signature: 'ChillAnimate.fadeOut(el, options?)', on: 'static', description: 'Fade opacity 1 to 0, then hide (unless `hide: false`).' },
        { signature: 'ChillAnimate.slideDown(el, options?)', on: 'static', description: 'Animate height from 0 to its natural height.' },
        { signature: 'ChillAnimate.slideUp(el, options?)', on: 'static', description: 'Animate height to 0, then set `display: none`.' },
        { signature: 'ChillAnimate.expand(el, options?)', on: 'static', description: 'Reveal with height, padding, margin and opacity; removes `[hidden]` and sets `aria-expanded="true"` on `trigger`.' },
        { signature: 'ChillAnimate.collapse(el, options?)', on: 'static', description: 'Collapse the same way, then set `[hidden]` and `aria-expanded="false"` on `trigger`.' },
        { signature: 'ChillAnimate.shake(el, options?)', on: 'static', description: 'Horizontal shake for errors.' },
        { signature: 'ChillAnimate.pulse(el, options?)', on: 'static', description: 'Scale up and back to draw attention.' },
        { signature: 'ChillAnimate.animate(el, keyframes, options?)', on: 'static', description: 'Generic wrapper with the same promise, cancel and reduced-motion behaviour.' },
        { signature: 'ChillAnimate.stop(el)', on: 'static', description: 'Cancel the animation currently running on the element. Returns `true` if one was running.' },
        { signature: 'ChillAnimate.prefersReducedMotion()', on: 'static', description: '`true` when `prefers-reduced-motion: reduce` matches.' },
        { signature: 'promise.cancel() / promise.finish()', description: 'Cancel (no end state) or jump to the end (end state applied) of the running animation.' },
        { signature: 'promise.animation', description: 'The underlying `Animation` object, or `null` when the animation was skipped.' },
    ],
    a11y: [
        'Respects `prefers-reduced-motion` by default: the end state is applied instantly.',
        '`collapse` sets `[hidden]` so collapsed content leaves the accessibility tree; `expand` / `collapse` maintain `aria-expanded` on the trigger you pass.',
        'Give disclosure triggers real `<button>` elements with `aria-controls`, and keep focus on the trigger.',
        'Avoid animating critical error messages away; `shake` is a visual cue and must be paired with text.',
    ],
    tips: [
        'Starting a new animation on an element cancels the previous one first, so rapid clicks cannot stack animations.',
        'Elements already hidden by CSS (stylesheet `display: none`) are shown with `display: block`; pass `display` to choose another value.',
        'Zero-height content skips the animation and applies the end state immediately.',
        'SSR-safe to import. Call helpers from effects or event handlers where elements exist.',
    ],
    related: ['accordion', 'collapse', 'toolkit', 'mediaquery'],
    keywords: ['transition', 'waapi', 'web animations', 'fade', 'slide', 'accordion', 'shake', 'motion'],
};

export default doc;
