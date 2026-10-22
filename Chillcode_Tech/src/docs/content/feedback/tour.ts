import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'tour',
    global: 'ChillTour',
    category: 'feedback',
    title: 'Tour',
    summary: 'Onboarding product tours: a spotlight on real elements with a step popover, progress and keyboard support.',
    style: 'create',
    description:
        'ChillTour walks users through your interface one step at a time. It dims the page, cuts a spotlight around the target element, ' +
        'and places a popover with a title, text and Back / Next / Skip controls next to it. Steps without a `target` are shown centred, which suits welcome and wrap-up screens.\n\n' +
        'Step text is rendered as **text**. Set `html: true` on the tour only when the strings are trusted. Use `once: true` to show a tour a single time per browser.',
    features: [
        'Spotlight with adjustable padding and radius, auto-scroll to the target and auto-placement of the popover',
        'Targets can be a selector, an element, or a function that finds the element lazily',
        'Progress text and dots, Back / Next / Skip / Done controls with customisable labels',
        '`once` + `storageKey` remembers completion in localStorage; `hasSeen()` / `reset()` helpers',
        'Per-step `onEnter` / `onExit`, `interactive` steps that let the user click the target',
    ],
    examples: [
        {
            id: 'basic',
            title: 'A three-step tour',
            description: 'Start with a centred welcome step, then point at elements. `target` accepts the element itself, so no ids are needed.',
            manual: true,
            code: `root.innerHTML = '<div style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--chill-border);border-radius:10px;color:var(--chill-text)">' +
  '<input class="t-search" placeholder="Search projects" style="padding:8px;flex:1">' +
  '<button class="t-new" style="padding:8px 14px;cursor:pointer">+ New project</button>' +
  '<span class="t-avatar" style="width:32px;height:32px;border-radius:50%;background:#6366f1;display:inline-block"></span></div>';
const tour = ChillTour.create({
  steps: [
    { title: 'Welcome aboard', content: 'Take a 30-second tour of your new workspace.' },
    { target: root.querySelector('.t-search'), title: 'Search', content: 'Jump to any project or teammate.', placement: 'bottom' },
    { target: root.querySelector('.t-new'), title: 'Create', content: 'Start a new project from a template.', placement: 'bottom' },
    { target: root.querySelector('.t-avatar'), title: 'Your profile', content: 'Settings and billing live here.', placement: 'left' },
  ],
});
const start = ChillButton.create({ text: 'Start tour' });
start.addEventListener('click', () => tour.start());
root.append(start);
cleanup(() => { tour.destroy(); start.destroy(); });`,
            height: 200,
        },
        {
            id: 'callbacks',
            title: 'Callbacks and result',
            description: '`onFinish(completed)` tells you whether the user reached the end or skipped. `onStep` and per-step `onEnter` let you react to progress.',
            manual: true,
            code: `const box = document.createElement('div');
box.className = 'target-box';
box.style.cssText = 'padding:18px;border:2px dashed var(--chill-border);border-radius:10px;color:var(--chill-text);margin-bottom:12px';
box.textContent = 'Revenue chart';
const result = document.createElement('p');
result.style.color = 'var(--chill-text)';
result.textContent = 'Result: -';
const tour = ChillTour.create({
  steps: [
    { target: box, title: 'Revenue', content: 'This chart updates every hour.', onEnter: () => (result.textContent = 'Result: viewing the chart...') },
    { title: 'That is it', content: 'You can reopen this tour from the help menu.' },
  ],
  onStep: (index, step) => console.log('step', index, step.title),
  onFinish: (completed) => { result.textContent = 'Result: ' + (completed ? 'completed' : 'skipped'); },
});
const start = ChillButton.create({ text: 'Start tour', variant: 'secondary' });
start.addEventListener('click', () => tour.start());
root.append(box, start, result);
cleanup(() => { tour.destroy(); start.destroy(); });`,
            height: 220,
        },
        {
            id: 'custom',
            title: 'Custom labels and spotlight',
            description: 'Change the button text, spotlight padding and radius, hide the progress, or override a step\'s `nextLabel`. Lazy targets use a function.',
            manual: true,
            code: `root.innerHTML = '<button class="t-save" style="padding:10px 18px;border-radius:999px;cursor:pointer">Save draft</button> ' +
  '<button class="t-publish" style="padding:10px 18px;border-radius:999px;cursor:pointer">Publish</button>';
const tour = ChillTour.create({
  padding: 14,
  radius: 999,
  showProgress: false,
  closeOnOverlay: true,
  labels: { next: 'Continue', prev: 'Previous', skip: 'Not now', finish: 'Got it' },
  steps: [
    { target: () => root.querySelector('.t-save'), title: 'Save often', content: 'Drafts are stored for 30 days.' },
    { target: () => root.querySelector('.t-publish'), title: 'Go live', content: 'Publishing notifies your subscribers.', nextLabel: 'Finish up' },
  ],
});
const start = ChillButton.create({ text: 'Show tips', variant: 'outline' });
start.addEventListener('click', () => tour.start());
root.append(document.createElement('br'), document.createElement('br'), start);
cleanup(() => { tour.destroy(); start.destroy(); });`,
            height: 200,
        },
        {
            id: 'once',
            title: 'Show only once',
            description: '`once: true` stores a flag in localStorage when the tour ends. `ChillTour.hasSeen(key)` and `ChillTour.reset(key)` let you inspect and clear it.',
            manual: true,
            code: `const KEY = 'docs-demo-tour';
const note = document.createElement('p');
note.style.color = 'var(--chill-text)';
const refresh = () => { note.textContent = 'Seen before: ' + ChillTour.hasSeen(KEY); };
const feature = document.createElement('div');
feature.style.cssText = 'padding:14px;border:1px solid var(--chill-border);border-radius:10px;color:var(--chill-text)';
feature.textContent = 'New: scheduled exports';
const tour = ChillTour.create({
  once: true,
  storageKey: KEY,
  steps: [{ target: feature, title: 'What is new', content: 'Schedule recurring exports to your inbox.' }],
  onFinish: refresh,
});
const start = ChillButton.create({ text: 'Start (ignored after first run)' });
const reset = ChillButton.create({ text: 'Reset', variant: 'ghost' });
start.addEventListener('click', () => tour.start());
reset.addEventListener('click', () => { ChillTour.reset(KEY); refresh(); });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:10px';
row.append(start, reset);
refresh();
root.append(feature, row, note);
cleanup(() => { tour.destroy(); start.destroy(); reset.destroy(); ChillTour.reset(KEY); });`,
            height: 220,
        },
    ],
    guides: [
        {
            title: 'Steps',
            body:
                'A step is `{ target, title, content, placement, padding, interactive, nextLabel, prevLabel, onEnter, onExit }`.\n\n' +
                '- Omit `target` (or let it resolve to nothing) for a centred step with no spotlight.\n' +
                '- `placement` is `auto` (default), `top`, `bottom`, `left`, `right` or `center`; the popover flips to stay in the viewport.\n' +
                '- `interactive: true` removes the click blocker so the user can operate the highlighted element, for example to type into a field before pressing Next.\n\n' +
                'Targets are resolved each time a step is shown, so elements rendered later (or by a framework) work as long as they exist at that moment.',
        },
        {
            title: 'Flow control',
            body:
                '`start(index?)`, `next()`, `prev()`, `goTo(i)`, `skip()` and `finish()` drive the tour programmatically. Pressing Esc, the close button, Skip, or (optionally) the dimmed area *skips*; reaching the last step and pressing the final button *finishes*.\n\n' +
                '```js\nconst tour = ChillTour.create({ steps, once: true });\ntour.on("skip", () => analytics.track("tour_skipped", { step: tour.index }));\ntour.on("finish", () => analytics.track("tour_done"));\ntour.on("end", (completed) => console.log(completed));\n```\n\n' +
                'For a quick launch without keeping the instance: `ChillTour.start(steps, options)`.',
        },
        {
            title: 'Styling',
            body:
                'The popover uses CSS custom properties, with dark mode following the OS or `<html data-theme="dark">`:\n\n' +
                '```css\n:root {\n  --chilltour-bg: #fff8e1;\n  --chilltour-text: #1c1917;\n}\n```',
        },
    ],
    options: [
        { name: 'steps', type: 'Step[]', default: '[]', description: 'Ordered list of steps (see the step options below).' },
        { name: 'padding', type: 'number', default: '8', description: 'Spotlight padding around the target in px.' },
        { name: 'radius', type: 'number', default: '8', description: 'Spotlight corner radius in px.' },
        { name: 'showProgress', type: 'boolean', default: 'true', description: 'Show "Step 2 of 5" text and dots (dots for 2-12 steps).' },
        { name: 'showSkip', type: 'boolean', default: 'true', description: 'Show the Skip button (hidden on the last step).' },
        { name: 'showClose', type: 'boolean', default: 'true', description: 'Show the x button.' },
        { name: 'closeOnEsc', type: 'boolean', default: 'true', description: 'Esc skips the tour.' },
        { name: 'closeOnOverlay', type: 'boolean', default: 'false', description: 'Clicking the dimmed area skips the tour.' },
        { name: 'keyboard', type: 'boolean', default: 'true', description: 'Left / Right arrows navigate.' },
        { name: 'once', type: 'boolean', default: 'false', description: 'Do not start again after the tour ended (finished or skipped), tracked in localStorage.' },
        { name: 'storageKey', type: 'string', default: "'chilltour-seen'", description: 'localStorage key used by `once`.' },
        { name: 'labels', type: '{ next, prev, skip, finish, close, step }', default: "{ next: 'Next', prev: 'Back', skip: 'Skip', finish: 'Done', close: 'Close tour', step: 'Step {n} of {total}' }", description: 'Override any UI text; `step` uses `{n}` and `{total}`.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Allow HTML in step title / content strings. You must sanitise.' },
        { name: 'onStart', type: '(tour) => void', default: 'null', description: 'Tour started.' },
        { name: 'onStep', type: '(index, step, tour) => void', default: 'null', description: 'A step was shown.' },
        { name: 'onFinish', type: '(completed, tour) => void', default: 'null', description: 'Tour ended; `completed` is false when skipped.' },
        { name: 'onSkip', type: '(tour) => void', default: 'null', description: 'Tour ended without completing.' },
        { name: 'steps[].target', type: 'string | Element | () => Element', default: 'undefined', description: 'Element to spotlight. Omit for a centred step.' },
        { name: 'steps[].title', type: 'string', default: 'undefined', description: 'Popover heading (text).' },
        { name: 'steps[].content', type: 'string | Element', default: 'undefined', description: 'Popover body (text or a DOM node).' },
        { name: 'steps[].placement', type: "'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center'", default: "'auto'", description: 'Preferred popover side.' },
        { name: 'steps[].padding', type: 'number', default: 'tour padding', description: 'Spotlight padding for this step.' },
        { name: 'steps[].interactive', type: 'boolean', default: 'false', description: 'Let the user click through to the target while this step is shown.' },
        { name: 'steps[].nextLabel / prevLabel', type: 'string', default: 'undefined', description: 'Override the button text for this step.' },
        { name: 'steps[].onEnter / onExit', type: '(step, tour) => void', default: 'undefined', description: 'Run when the step is shown or left.' },
    ],
    methods: [
        { signature: 'ChillTour.create(options)', on: 'static', description: 'Create a tour instance.' },
        { signature: 'ChillTour.start(steps, options?)', on: 'static', description: 'Create and start a tour in one call. Returns the instance.' },
        { signature: 'ChillTour.hasSeen(key?)', on: 'static', description: 'True if the `once` flag for the key (default `chilltour-seen`) is stored.' },
        { signature: 'ChillTour.reset(key?)', on: 'static', description: 'Clear the stored `once` flag.' },
        { signature: 'ChillTour.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'tour.start(index?)', description: 'Begin at a step (default 0). Does nothing if already active or if `once` applies.' },
        { signature: 'tour.next() / prev() / goTo(i)', description: 'Navigate. `next()` on the last step finishes the tour.' },
        { signature: 'tour.finish() / skip()', description: 'End the tour as completed or skipped.' },
        { signature: 'tour.on(event, fn) / off(event, fn?)', description: 'Subscribe to `start`, `step`, `finish`, `skip` and `end`.' },
        { signature: 'tour.destroy()', description: 'Tear everything down without firing finish / skip callbacks.' },
        { signature: 'tour.isActive / index / steps', description: 'Running flag, current step index (-1 when idle) and the steps array.' },
    ],
    events: [
        { name: 'start', description: 'Tour started.' },
        { name: 'step', payload: '{ index, step }', description: 'A step was shown.' },
        { name: 'finish', payload: 'true', description: 'Tour completed.' },
        { name: 'skip', payload: 'false', description: 'Tour skipped.' },
        { name: 'end', payload: 'completed: boolean', description: 'Always fired last, after finish or skip.' },
    ],
    cssVars: [
        { name: '--chilltour-bg', description: 'Popover background.' },
        { name: '--chilltour-text / --chilltour-muted', description: 'Popover text colours.' },
        { name: '--chilltour-border', description: 'Popover border.' },
    ],
    a11y: [
        'The popover receives focus on every step; Left / Right arrows navigate, Esc skips, Tab stays within the popover.',
        'A live region announces "Step n of total: title" on each step.',
        'All controls are native buttons with text or `aria-label`s (the close button uses `labels.close`).',
        'Targets are scrolled into view (smoothly, instantly under `prefers-reduced-motion`) before the spotlight is drawn.',
    ],
    tips: [
        'Keep steps short (title + one sentence) and under about six steps; use `interactive` sparingly.',
        'A selector that matches nothing quietly degrades to a centred step; check target selectors if a spotlight is missing.',
        'Tours are page-level. For multi-page flows store progress yourself and call `start(index)` on the next page.',
        'Safe to import on the server: DOM is only built in `start()`. Calling `destroy()` while active removes the overlay without firing callbacks.',
    ],
    related: ['popover', 'modal', 'drawer'],
    keywords: ['onboarding', 'walkthrough', 'product tour', 'spotlight', 'coach marks', 'intro'],
};

export default doc;
