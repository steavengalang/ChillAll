import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'confetti',
    global: 'ChillConfetti',
    category: 'feedback',
    title: 'Confetti',
    summary: 'A tiny canvas confetti burst for celebrations - fire from anywhere, from an element or from a point.',
    style: 'static',
    description:
        'ChillConfetti celebrates a moment: a completed checkout, a finished onboarding, a milestone reached. One call, `ChillConfetti.fire()`, draws a burst of ' +
        'coloured squares, circles and strips on a single shared canvas that sits above the page without blocking clicks.\n\n' +
        'The canvas is created on demand, is `pointer-events: none` and `aria-hidden`, and removes itself when the last particle is gone. ' +
        'By default nothing is drawn for users who prefer reduced motion. There is no instance to manage; `fire()` returns a promise that resolves when its burst has finished.',
    features: [
        'Zero setup: one function, one shared self-cleaning canvas',
        'Origin can be viewport fractions, pixel coordinates, or any element',
        'Control count, colours, spread, direction, gravity, velocity, drift, size and shapes',
        'Several bursts can overlap; each `fire()` promise resolves independently',
        'Respects `prefers-reduced-motion` (opt out with `disableForReducedMotion: false`)',
    ],
    examples: [
        {
            id: 'basic',
            title: 'One-line burst',
            description: 'Call `fire()` with no arguments for a default burst from the lower middle of the viewport.',
            manual: true,
            code: `const btn = ChillButton.create({ text: 'Celebrate 🎉' });
btn.addEventListener('click', () => ChillConfetti.fire());
root.append(btn);
cleanup(() => { ChillConfetti.reset(); btn.destroy(); });`,
        },
        {
            id: 'from-element',
            title: 'Burst from an element',
            description: 'Pass an element as `origin` and the particles erupt from its centre. A bigger `count`, `spread` and custom `colors` make it feel branded.',
            manual: true,
            code: `const btn = ChillButton.create({ text: 'Complete order', variant: 'success', size: 'lg' });
btn.addEventListener('click', () => {
  ChillConfetti.fire({
    origin: btn,
    count: 160,
    spread: 100,
    colors: ['#22c55e', '#16a34a', '#fde047', '#ffffff'],
  });
});
root.append(btn);
cleanup(() => { ChillConfetti.reset(); btn.destroy(); });`,
        },
        {
            id: 'cannons',
            title: 'Two side cannons',
            description: '`angle` is the centre direction in degrees (90 is straight up), so mirrored angles with fractional origins make a classic party popper.',
            manual: true,
            code: `const btn = ChillButton.create({ text: 'Launch cannons', variant: 'secondary' });
btn.addEventListener('click', () => {
  const common = { count: 90, spread: 55, startVelocity: 55, shapes: ['square', 'circle'] };
  ChillConfetti.fire({ ...common, angle: 60, origin: { x: 0, y: 0.8 } });
  ChillConfetti.fire({ ...common, angle: 120, origin: { x: 1, y: 0.8 } });
});
root.append(btn);
cleanup(() => { ChillConfetti.reset(); btn.destroy(); });`,
        },
        {
            id: 'then',
            title: 'Chain actions with the promise',
            description: '`fire()` resolves when the burst is over, so you can follow up, for example by showing a message. Slow, floaty confetti uses low `gravity` and a higher `ticks`.',
            manual: true,
            code: `const msg = document.createElement('p');
msg.style.color = 'var(--chill-text)';
const btn = ChillButton.create({ text: 'Reach milestone', variant: 'outline' });
btn.addEventListener('click', async () => {
  msg.textContent = 'Fantastic - 1,000 users!';
  await ChillConfetti.fire({ origin: btn, count: 120, gravity: 0.5, ticks: 260, scalar: 1.3, shapes: ['circle', 'strip'] });
  msg.textContent = 'Milestone unlocked. Time for the next goal.';
});
root.append(btn, msg);
cleanup(() => { ChillConfetti.reset(); btn.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Origin and direction',
            body:
                '`origin` takes three forms:\n\n' +
                '- `{ x: 0.5, y: 0.6 }` - fractions of the viewport (0 to 1). This is the default.\n' +
                '- `{ px: 300, py: 120 }` - pixel coordinates in the viewport.\n' +
                '- an `Element` - the centre of its bounding box, measured at fire time.\n\n' +
                '`angle` rotates the whole cone (90 = up, 0 = right, 180 = left) and `spread` is how wide the cone is, in degrees. Velocity falls off by `decay` each frame while `gravity` pulls down, and `drift` pushes sideways.',
        },
        {
            title: 'Stopping and reduced motion',
            body:
                '`ChillConfetti.reset()` stops every running burst, resolves their promises and removes the canvas, which is useful when navigating away. `ChillConfetti.active` is true while particles are animating.\n\n' +
                'When the user has `prefers-reduced-motion: reduce`, `fire()` resolves immediately and draws nothing. Set `disableForReducedMotion: false` only if the animation is essential. A celebration should always be accompanied by a text confirmation as well.',
        },
        {
            title: 'Usage in apps',
            body:
                'Call it from event handlers, not during render:\n\n' +
                '```js\nform.addEventListener("submit", async (e) => {\n  e.preventDefault();\n  await save(new FormData(form));\n  ChillConfetti.fire({ origin: submitButton });\n});\n```\n\n' +
                'Keep `count` modest on low-end devices; it is clamped to 2000 particles per burst.',
        },
    ],
    options: [
        { name: 'origin', type: '{ x, y } | { px, py } | Element', default: '{ x: 0.5, y: 0.6 }', description: 'Where particles start: viewport fractions, viewport pixels, or the centre of an element.' },
        { name: 'count', type: 'number', default: '100', description: 'Number of particles (clamped to 0-2000).' },
        { name: 'colors', type: 'string[]', default: '7-colour bright palette', description: 'CSS colours, cycled across particles.' },
        { name: 'spread', type: 'number', default: '70', description: 'Cone width in degrees.' },
        { name: 'angle', type: 'number', default: '90', description: 'Centre direction in degrees (90 = up).' },
        { name: 'startVelocity', type: 'number', default: '45', description: 'Initial speed in px per frame (each particle gets 50-100% of it).' },
        { name: 'gravity', type: 'number', default: '1', description: 'Downward pull multiplier.' },
        { name: 'decay', type: 'number', default: '0.9', description: 'Velocity retained per frame (0 to 1).' },
        { name: 'drift', type: 'number', default: '0', description: 'Constant horizontal push per frame.' },
        { name: 'ticks', type: 'number', default: '200', description: 'Lifetime in frames (each particle lives 75-100% of it).' },
        { name: 'scalar', type: 'number', default: '1', description: 'Particle size multiplier.' },
        { name: 'shapes', type: "Array<'square' | 'circle' | 'strip'>", default: "['square', 'circle', 'strip']", description: 'Shapes to draw.' },
        { name: 'zIndex', type: 'number', default: '10007', description: 'z-index of the shared canvas.' },
        { name: 'disableForReducedMotion', type: 'boolean', default: 'true', description: 'Skip the effect for users who prefer reduced motion.' },
    ],
    methods: [
        { signature: 'ChillConfetti.fire(options?)', on: 'static', description: 'Launch a burst. Returns a promise that resolves when the burst has finished (or immediately if skipped).' },
        { signature: 'ChillConfetti.reset()', on: 'static', description: 'Stop all bursts, resolve their promises and remove the canvas.' },
        { signature: 'ChillConfetti.active', description: 'Read-only boolean, true while particles are animating (property of the global).' },
    ],
    a11y: [
        'The canvas is `aria-hidden` and `pointer-events: none`, so it never intercepts clicks or focus.',
        'Confetti is purely decorative: announce the achievement in text (toast, status message) too.',
        'Nothing is drawn under `prefers-reduced-motion: reduce` unless `disableForReducedMotion` is false.',
    ],
    tips: [
        'There is one shared canvas for the whole page; concurrent bursts reuse it and it is removed after the last one ends.',
        'Origin elements and fractions are measured against the viewport at fire time, so scrolling afterwards does not move running particles.',
        'In SSR frameworks, only call `fire()` in the browser (effects or handlers). Importing the module is safe on the server.',
        'Call `ChillConfetti.reset()` in your cleanup / route-change code so a pending animation never outlives its page.',
    ],
    related: ['toast', 'alert', 'spinner'],
    keywords: ['celebration', 'party', 'success', 'fireworks', 'canvas', 'particles'],
};

export default doc;
