import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'stepper',
    global: 'ChillStepper',
    category: 'navigation',
    title: 'Stepper',
    summary: 'Wizard and progress stepper with validation, Back/Next controls, vertical layout and error states.',
    style: 'create',
    description:
        'ChillStepper shows progress through a multi-step flow such as checkout, onboarding or a setup wizard. Turn on `controls` and it also renders the step content with Back / Next / Finish buttons; keep it off and use the stepper as a pure progress indicator.\n\n' +
        'Moving forward can be guarded with a `validate(from, to, step)` callback that may be synchronous or async and returns `true`, `false` or an error message. Use `ChillStepper.create(options)` to build one (append `.element` yourself) or `ChillStepper.init(el, options)` to enhance an existing element. ' +
        'Text is inserted as text; `html: true` is an explicit opt-in for trusted markup.',
    features: [
        'Horizontal or vertical, three sizes, with titles, descriptions, icons and "Optional" labels',
        'Built-in Back / Next / Finish controls and a content panel',
        'Sync or async `validate` that blocks forward moves and marks the step with an error',
        '`linear` mode stops users from skipping ahead',
        'Events and promises: `change`, `complete`, `error`, `blocked`; `next()` / `goTo()` return Promise<boolean>',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Progress indicator',
            description: 'Without `controls` the stepper is a clickable progress bar. Steps before the current one are marked done.',
            code: `const st = ChillStepper.create({
  current: 1,
  steps: [
    { title: 'Cart', description: '3 items' },
    { title: 'Shipping', description: 'Address' },
    { title: 'Payment', description: 'Card details' },
    { title: 'Done' },
  ],
});
root.append(st.element);
cleanup(() => st.destroy());`,
        },
        {
            id: 'wizard',
            title: 'Wizard with controls',
            description: 'With `controls` each step shows its `content` above Back / Next buttons. The last step shows "Finish" and `onComplete` fires.',
            height: 260,
            code: `const done = document.createElement('p');
done.style.cssText = 'margin:12px 0 0;color:var(--chill-text);font-size:14px';
const st = ChillStepper.create({
  controls: true,
  steps: [
    { title: 'Account', description: 'Your details', content: 'Create your account: name, email and password.' },
    { title: 'Workspace', description: 'Name it', content: 'Choose a workspace name and invite teammates.' },
    { title: 'Plan', optional: true, content: 'Pick a plan, or skip and stay on Free.' },
    { title: 'Launch', content: 'Everything is ready. Press Finish to go live.' },
  ],
  labels: { next: 'Continue', finish: 'Launch' },
  onComplete: () => { done.textContent = 'Setup complete. Welcome aboard!'; },
});
root.append(st.element, done);
cleanup(() => st.destroy());`,
        },
        {
            id: 'validation',
            title: 'Validation',
            description: 'Return a string from `validate` to block the step and show it as the error message. Async validators work too; `validate` is only called when moving forward.',
            height: 300,
            code: `const input = document.createElement('input');
input.placeholder = 'you@example.com';
input.style.cssText = 'padding:8px 10px;border:1px solid var(--chill-border);border-radius:6px;background:transparent;color:var(--chill-text);width:240px';
const step1 = document.createElement('div');
step1.append('Enter your email to continue: ', document.createElement('br'), input);
const st = ChillStepper.create({
  controls: true,
  linear: true,
  steps: [
    { title: 'Email', description: 'Required', content: step1 },
    { title: 'Verify', content: 'We sent you a code (not really).' },
  ],
  validate: async (from) => {
    if (from !== 0) return true;
    await new Promise((r) => setTimeout(r, 400));          // pretend to call the server
    return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(input.value) ? true : 'Please enter a valid email address.';
  },
});
root.append(st.element);
cleanup(() => st.destroy());`,
        },
        {
            id: 'vertical',
            title: 'Vertical, icons and sizes',
            description: '`orientation: "vertical"` suits sidebars and timelines. Steps can carry an `icon`; done and error steps replace it with a check or "!".',
            height: 320,
            code: `const st = ChillStepper.create({
  orientation: 'vertical',
  size: 'lg',
  current: 1,
  steps: [
    { title: 'Order placed', description: 'Mon 09:12', icon: '🛒' },
    { title: 'Packed', description: 'Mon 14:40', icon: '📦' },
    { title: 'Shipped', description: 'Tue 08:05', icon: '🚚' },
    { title: 'Delivered', optional: true, icon: '🏠' },
  ],
});
root.append(st.element);
cleanup(() => st.destroy());`,
        },
        {
            id: 'api',
            title: 'Events and programmatic control',
            description: '`next()`, `prev()` and `goTo(i)` return Promises. Use `setError(i, message)` to flag a step, `reset()` to start over, and `on()` to listen.',
            height: 260,
            code: `const log = document.createElement('p');
log.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
const st = ChillStepper.create({
  steps: [{ title: 'Upload' }, { title: 'Process' }, { title: 'Publish' }],
});
st.on('change', (i, prev) => { log.textContent = 'Moved from step ' + (prev + 1) + ' to ' + (i + 1); });
st.on('complete', () => { log.textContent = 'Flow complete'; });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap';
const mk = (text, fn) => { const b = ChillButton.create({ text, size: 'sm', variant: 'outline' }); b.onclick = fn; row.append(b); };
mk('Next', () => st.next());
mk('Back', () => st.prev());
mk('Flag error', () => st.setError(st.current, 'Upload failed'));
mk('Clear error', () => st.setError(st.current, false));
mk('Reset', () => st.reset());
root.append(st.element, row, log);
cleanup(() => st.destroy());`,
        },
    ],
    guides: [
        {
            title: 'How validation works',
            body:
                '`validate(fromIndex, toIndex, step)` runs only for forward moves, once for every step crossed (so `goTo(3)` from step 0 checks steps 0, 1 and 2). Return:\n\n' +
                '- `true` (or nothing): the move continues; the step is marked done.\n' +
                '- `false`: the move is blocked and the step is marked with an error.\n' +
                '- a **string**: blocked, and the string is shown as the step error (and in the panel when `controls` is on).\n\n' +
                'A thrown error blocks the move with the error message. Pressing Finish on the last step also calls `validate(last, last + 1)`. A `blocked` event is emitted whenever a move is stopped.',
        },
        {
            title: 'Create vs init',
            body:
                '`ChillStepper.create(options)` returns an instance whose `.element` you append yourself. `ChillStepper.init(elementOrSelector, options)` enhances an element you already have (returns `null` if it is not found); ' +
                'if you omit `steps`, each child of that element becomes a step titled with its text. `destroy()` empties the host and restores its original class.\n\n' +
                'Call `setSteps(steps, current?)` to replace the steps later (it also clears the completed state).',
        },
        {
            title: 'Step content',
            body:
                'With `controls: true` the active step\'s `content` is shown in a panel. Strings are text (or HTML with `html: true`); a DOM node is moved into the panel, so keep a reference to it (for example form inputs) and read values in `validate`. ' +
                'Without `controls` the content is ignored, which makes the stepper a pure indicator you drive from your own UI.',
        },
    ],
    options: [
        { name: 'steps', type: '{ title, description?, icon?, content?, optional?, id? }[]', default: '[]', description: 'Step definitions. `title`/`description`/`icon` are text unless `html`; `content` may also be a DOM node.' },
        { name: 'current', type: 'number', default: '0', description: 'Starting step index (clamped to the valid range).' },
        { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout direction.' },
        { name: 'linear', type: 'boolean', default: 'false', description: 'Forbid jumping more than one step ahead of steps not yet visited.' },
        { name: 'clickable', type: 'boolean', default: 'true', description: 'Steps are buttons that call `goTo()`.' },
        { name: 'controls', type: 'boolean', default: 'false', description: 'Render the content panel with Back / Next (Finish on the last step) buttons.' },
        { name: 'labels', type: '{ back?, next?, finish? }', default: "{ back: 'Back', next: 'Next', finish: 'Finish' }", description: 'Button labels.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Marker and text size.' },
        { name: 'validate', type: '(from: number, to: number, step) => boolean | string | Promise<boolean | string>', default: 'null', description: 'Guard for forward moves. A falsy result or a string blocks the move and marks the step as an error.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat title, description and string content as HTML. Unsafe with untrusted data.' },
        { name: 'ariaLabel', type: 'string', default: "'Progress'", description: 'Accessible name of the step list.' },
        { name: 'onChange', type: '(index: number, prevIndex: number) => void', default: 'null', description: 'Called after the current step changes.' },
        { name: 'onComplete', type: '() => void', default: 'null', description: 'Called when the flow is completed.' },
        { name: 'onError', type: '(index: number, message: string) => void', default: 'null', description: 'Called when a step is flagged with an error.' },
    ],
    methods: [
        { signature: 'ChillStepper.create(options)', on: 'static', description: 'Create a stepper instance; append `instance.element` to the page.' },
        { signature: 'ChillStepper.init(target, options)', on: 'static', description: 'Enhance an existing element or selector; returns `null` if not found.' },
        { signature: 'ChillStepper.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.element', description: 'The root element.' },
        { signature: 'instance.next() / prev() / goTo(index)', description: 'Navigate. Return `Promise<boolean>` (false when blocked or out of range). `next()` on the last step calls `complete()`.' },
        { signature: 'instance.complete()', description: 'Validate the last step, mark everything done and emit `complete`. Returns `Promise<boolean>`.' },
        { signature: 'instance.reset()', description: 'Back to step 1 and clear errors and completion.' },
        { signature: 'instance.setError(index, message | false)', description: 'Flag a step with an error message (or `true`-like value), or clear it with `false`.' },
        { signature: 'instance.setSteps(steps, current?)', description: 'Replace all steps and re-render.' },
        { signature: 'instance.getState()', description: 'Returns `{ current, completed, steps: [{ index, state, error }] }`.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe or unsubscribe. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and DOM.' },
    ],
    events: [
        { name: 'change', payload: '(index, prevIndex)', description: 'The current step changed.' },
        { name: 'complete', description: 'The flow was completed.' },
        { name: 'error', payload: '(index, message)', description: 'A step was flagged via `setError` or a failed validation.' },
        { name: 'blocked', payload: '(from, to)', description: '`validate` stopped a forward move.' },
    ],
    cssVars: [
        { name: '--chillstepper-primary', description: 'Current-step accent colour.' },
        { name: '--chillstepper-done', description: 'Completed step colour.' },
        { name: '--chillstepper-error', description: 'Error step colour.' },
        { name: '--chillstepper-line', description: 'Connector lines and borders.' },
        { name: '--chillstepper-muted / --chillstepper-text', description: 'Secondary and primary text colours.' },
    ],
    a11y: [
        'Steps are an ordered list (`aria-label`) of real buttons; the current step has `aria-current="step"`.',
        'Each step button includes visually hidden status text (completed, current step, upcoming, error).',
        'Steps blocked by `linear` mode expose `aria-disabled="true"`; validation errors appear in a `role="alert"` region when `controls` is on.',
    ],
    tips: [
        'Keep references to input elements you pass as `content` so `validate` can read them.',
        'Await the promises: `await st.next()` resolves to `false` when validation blocked the move.',
        'In frameworks, `create()` in an effect and `destroy()` on unmount; the element is detached until you append it.',
    ],
    related: ['tabs', 'progress', 'breadcrumb'],
    keywords: ['wizard', 'steps', 'checkout', 'onboarding', 'timeline', 'progress'],
};

export default doc;
