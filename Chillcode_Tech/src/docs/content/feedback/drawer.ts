import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'drawer',
    global: 'ChillDrawer',
    category: 'feedback',
    title: 'Drawer',
    summary: 'Slide-in side panels from any edge with focus trap, scroll lock, stacking and swipe-to-close.',
    style: 'create',
    description:
        'ChillDrawer is a modal sheet that slides in from the left, right, top or bottom. Use it for settings, filters, carts, ' +
        'detail views and mobile action sheets - anything that needs more room than a popover but should not leave the page.\n\n' +
        'Titles are always inserted as **text**. `content` and `footer` accept a string (text), a DOM node, or markup when you set `html: true` - ' +
        'only do that with trusted or sanitised strings. Drawers stack: Esc and Tab handling always apply to the top-most one.',
    features: [
        'Four edges and five sizes (`sm`, `md`, `lg`, `xl`, `full`) or any pixel / CSS length',
        'Focus trap, focus restore, Esc, backdrop click and optional touch swipe to close',
        '`onBeforeClose(reason)` can veto closing, e.g. for unsaved changes',
        'Stacks cleanly: nested drawers get rising z-indexes and a shared scroll lock',
        'One-shot `ChillDrawer.open()` and declarative `ChillDrawer.init()` for trigger buttons',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic drawer',
            description: 'Create an instance once, open it from any event. The drawer mounts into `document.body` on open.',
            manual: true,
            code: `const drawer = ChillDrawer.create({
  title: 'Notifications',
  content: 'You have 3 unread messages and 1 pending invitation.',
  footer: 'Updated just now',
});
const btn = ChillButton.create({ text: 'Open drawer' });
btn.addEventListener('click', () => drawer.open());
root.append(btn);
cleanup(() => { drawer.destroy(); btn.destroy(); });`,
        },
        {
            id: 'sides-sizes',
            title: 'Sides and sizes',
            description: '`side` picks the edge, `size` accepts a preset, a number of pixels or any CSS length such as `"40vw"`.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const drawers = [];
[['left', 'sm'], ['right', 'lg'], ['top', 280], ['bottom', '50vh']].forEach(([side, size]) => {
  const d = ChillDrawer.create({ side, size, title: side + ' / ' + size, content: 'This drawer slides in from the ' + side + ' edge.' });
  drawers.push(d);
  const b = document.createElement('button');
  b.textContent = side;
  b.style.cssText = 'padding:6px 14px;cursor:pointer';
  b.addEventListener('click', () => d.open());
  root.append(b);
});
cleanup(() => drawers.forEach((d) => d.destroy()));`,
        },
        {
            id: 'form-footer',
            title: 'Form with footer actions',
            description: 'Pass DOM nodes for rich content. The footer stays pinned while the body scrolls. Here the footer buttons close the drawer with a reason.',
            manual: true,
            code: `const form = document.createElement('div');
form.innerHTML = '<label style="display:block;margin-bottom:6px">Display name</label>' +
  '<input value="Ada Lovelace" style="width:100%;padding:8px;box-sizing:border-box;margin-bottom:14px">' +
  '<label style="display:block;margin-bottom:6px">Email</label>' +
  '<input value="ada@example.com" style="width:100%;padding:8px;box-sizing:border-box">';
const footer = document.createElement('div');
footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
const cancel = ChillButton.create({ text: 'Cancel', variant: 'outline' });
const save = ChillButton.create({ text: 'Save profile' });
footer.append(cancel, save);
const drawer = ChillDrawer.create({ title: 'Edit profile', content: form, footer, size: 'sm' });
cancel.addEventListener('click', () => drawer.close('cancel'));
save.addEventListener('click', () => drawer.close('save'));
const open = ChillButton.create({ text: 'Edit profile', variant: 'secondary' });
open.addEventListener('click', () => drawer.open());
root.append(open);
cleanup(() => drawer.destroy());`,
        },
        {
            id: 'confirm-close',
            title: 'Guard against data loss',
            description: '`onBeforeClose(reason, instance)` runs for every close path (the x button, Esc, the backdrop, or your own `close(reason)`). Return `false` to keep the drawer open. Try closing the drawer below with the x or Esc: it asks you to decide first.',
            manual: true,
            code: `const body = document.createElement('div');
const text = document.createElement('p');
text.textContent = 'You have unsaved changes in this draft.';
const hint = document.createElement('p');
hint.style.cssText = 'margin:12px 0 0;font-size:13px;color:#ef4444;min-height:1.4em';
body.append(text, hint);

const drawer = ChillDrawer.create({
  side: 'right',
  title: 'Unsaved draft',
  content: body,
  // only our own buttons may close it; the x, Esc and the backdrop are refused with a hint
  onBeforeClose: (reason) => {
    if (reason === 'save' || reason === 'discard') return true;
    hint.textContent = 'Please choose Save or Discard before closing.';
    return false;
  },
});

const footer = document.createElement('div');
footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
const discard = ChillButton.create({ text: 'Discard', variant: 'outline', size: 'sm' });
const save = ChillButton.create({ text: 'Save draft', variant: 'primary', size: 'sm' });
discard.addEventListener('click', () => drawer.close('discard'));
save.addEventListener('click', () => drawer.close('save'));
footer.append(discard, save);
drawer.setFooter(footer);

const open = ChillButton.create({ text: 'Open draft' });
open.addEventListener('click', () => { hint.textContent = ''; drawer.open(); });
root.append(open);
cleanup(() => drawer.destroy());`,
        },
        {
            id: 'init-triggers',
            title: 'Declarative triggers',
            description: '`init()` turns trigger elements into openers. `data-chill-drawer="#id"` points at an element that is moved into the drawer and restored on destroy.',
            manual: true,
            code: `root.innerHTML = '<button id="cart-trigger" data-chill-drawer="#cart-panel" data-side="right" data-title="Your cart" data-size="sm" style="padding:6px 14px;cursor:pointer">Open cart (2)</button>' +
  '<div id="cart-panel"><p>2 x Espresso beans - $24</p><p>1 x Pour-over kit - $38</p><strong>Total: $62</strong></div>';
const inst = ChillDrawer.init('#cart-trigger');
cleanup(() => inst.destroy());`,
        },
        {
            id: 'one-shot',
            title: 'One-shot drawer and events',
            description: '`ChillDrawer.open(options)` creates, opens and auto-destroys on close. Listen with `onClose` or `drawer.on()`.',
            manual: true,
            code: `const log = document.createElement('p');
log.style.color = 'var(--chill-text)';
log.textContent = 'Closed with: (nothing yet)';
const btn = ChillButton.create({ text: 'Quick view', variant: 'outline' });
btn.addEventListener('click', () => {
  ChillDrawer.open({
    side: 'bottom',
    size: 240,
    title: 'Order #1042',
    content: 'Shipped on 14 March, arriving Thursday.',
    swipeToClose: true,
    onClose: (reason) => { log.textContent = 'Closed with: ' + reason; },
  });
});
root.append(btn, log);
cleanup(() => { ChillDrawer.closeAll(); btn.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Instance lifecycle',
            body:
                '`create(options)` builds the drawer but does not attach it; `open()` appends it to `container` (default `document.body`) and `close()` removes it after the transition. ' +
                'Reuse one instance for a panel you open repeatedly, and call `destroy()` when you are done with it.\n\n' +
                '`ChillDrawer.open(options)` is the fire-and-forget version: it sets `destroyOnClose` for you.\n\n' +
                '```js\nconst d = ChillDrawer.create({ title: "Filters", content: form });\nd.on("close", (reason) => console.log(reason)); // "button" | "overlay" | "escape" | "swipe" | "toggle" | custom\nd.open();\n```\n\n' +
                'The `reason` string is whatever was passed to `close(reason)`, or one of the built-in ones: `button`, `overlay`, `escape`, `swipe`, `toggle`, `closeAll`.',
        },
        {
            title: 'Updating content',
            body:
                'Use `setTitle()`, `setContent()` and `setFooter()` at any time, including while the drawer is open. ' +
                'This is the way to show async data: open with a spinner node, then call `setContent(result)`.\n\n' +
                '> Strings are rendered as text unless you passed `html: true` to the constructor. With `html: true` you are responsible for sanitising.',
        },
        {
            title: 'Styling',
            body:
                'Colours and shadow are CSS custom properties, and dark mode follows the OS or `<html data-theme="dark">`:\n\n' +
                '```css\n:root {\n  --chilldrawer-bg: #fffdf8;\n  --chilldrawer-overlay: rgba(20, 16, 40, 0.55);\n}\n```\n\n' +
                'Add your own class through the `className` option to restyle one drawer, e.g. `.my-drawer .chilldrawer-panel { ... }`.',
        },
    ],
    options: [
        { name: 'side', type: "'left' | 'right' | 'top' | 'bottom'", default: "'right'", description: 'Edge the panel slides in from.' },
        { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full' | number | string", default: "'md'", description: 'Width (left/right) or height (top/bottom). Presets are 320, 420, 560, 720px and 100%; a number is pixels; a string is any CSS length.' },
        { name: 'title', type: 'string', default: 'undefined', description: 'Header title, inserted as text. Without a title and with `showClose: false` the header is hidden.' },
        { name: 'content', type: 'string | Node', default: 'undefined', description: 'Body. Strings are text unless `html` is true.' },
        { name: 'footer', type: 'string | Node', default: 'undefined', description: 'Footer area, hidden when empty.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Render string `content` / `footer` as HTML. You must sanitise.' },
        { name: 'overlay', type: 'boolean', default: 'true', description: 'Show the dimmed backdrop. Also sets `aria-modal`.' },
        { name: 'closeOnOverlay', type: 'boolean', default: 'true', description: 'Clicking the backdrop closes the drawer (reason `overlay`).' },
        { name: 'closeOnEsc', type: 'boolean', default: 'true', description: 'Escape closes the top-most drawer (reason `escape`).' },
        { name: 'showClose', type: 'boolean', default: 'true', description: 'Render the close button in the header.' },
        { name: 'trapFocus', type: 'boolean', default: 'true', description: 'Keep Tab / Shift+Tab inside the panel.' },
        { name: 'lockScroll', type: 'boolean', default: 'true', description: 'Lock page scrolling while open (reference counted across drawers).' },
        { name: 'returnFocus', type: 'boolean', default: 'true', description: 'Restore focus to the previously focused element on close.' },
        { name: 'swipeToClose', type: 'boolean', default: 'false', description: 'Touch swipe towards the edge closes the drawer (reason `swipe`).' },
        { name: 'open', type: 'boolean', default: 'false', description: 'Open immediately after creation.' },
        { name: 'destroyOnClose', type: 'boolean', default: 'false', description: 'Destroy the instance once the close transition has finished.' },
        { name: 'ariaLabel', type: 'string', default: 'undefined', description: 'Accessible name used when there is no title.' },
        { name: 'className', type: 'string', default: 'undefined', description: 'Extra class on the root element.' },
        { name: 'container', type: 'Element', default: 'document.body', description: 'Element the drawer is mounted into on open.' },
        { name: 'onOpen', type: '(undefined, instance) => void', default: 'null', description: 'Called when the drawer opens.' },
        { name: 'onClose', type: '(reason, instance) => void', default: 'null', description: 'Called after the drawer closes.' },
        { name: 'onBeforeClose', type: '(reason, instance) => boolean | void', default: 'null', description: 'Return `false` to cancel the close.' },
    ],
    methods: [
        { signature: 'ChillDrawer.create(options)', on: 'static', description: 'Build a drawer instance (not yet in the DOM).' },
        { signature: 'ChillDrawer.open(options)', on: 'static', description: 'Create and open a drawer that destroys itself on close. Returns the instance.' },
        { signature: 'ChillDrawer.init(target, options)', on: 'static', description: 'Make trigger elements open drawers. `target` is a selector, element or list. Reads `data-chill-drawer`, `data-side`, `data-size`, `data-title`. Returns `{ drawers, destroy() }`.' },
        { signature: 'ChillDrawer.closeAll()', on: 'static', description: 'Close every open drawer, top-most first.' },
        { signature: 'ChillDrawer.getStack()', on: 'static', description: 'Array of currently open drawer instances, last = top.' },
        { signature: 'ChillDrawer.injectCSS()', on: 'static', description: 'Inject the stylesheet ahead of time.' },
        { signature: 'drawer.open()', description: 'Mount and open. Returns the instance.' },
        { signature: 'drawer.close(reason?)', description: 'Close (runs `onBeforeClose`). `reason` is passed to the close callbacks.' },
        { signature: 'drawer.toggle()', description: 'Open or close.' },
        { signature: 'drawer.setTitle(title) / setContent(content) / setFooter(footer)', description: 'Update parts of the drawer; each returns the instance.' },
        { signature: 'drawer.on(event, fn) / off(event, fn?)', description: 'Subscribe to `open` and `close`.' },
        { signature: 'drawer.destroy()', description: 'Close, remove from the DOM and release all listeners.' },
        { signature: 'drawer.element / panel / body / isOpen', description: 'Root element, dialog panel, body container and the open flag.' },
    ],
    events: [
        { name: 'open', description: 'Fired right after the drawer is opened.' },
        { name: 'close', payload: 'reason: string', description: 'Fired when the drawer starts closing, with the close reason.' },
    ],
    cssVars: [
        { name: '--chilldrawer-bg', description: 'Panel background.' },
        { name: '--chilldrawer-text / --chilldrawer-muted', description: 'Text and secondary text colours.' },
        { name: '--chilldrawer-border', description: 'Header and footer dividers.' },
        { name: '--chilldrawer-overlay', description: 'Backdrop colour.' },
        { name: '--chilldrawer-shadow', description: 'Panel shadow.' },
        { name: '--chilldrawer-size', description: 'Set per panel from the `size` option.' },
    ],
    a11y: [
        'Panel has `role="dialog"`, `aria-modal` (true when an overlay is shown) and is labelled by its title, or by `ariaLabel`.',
        'Esc closes the top-most drawer; Tab and Shift+Tab are trapped inside while `trapFocus` is on.',
        'On open, focus moves to `[autofocus]`, the first focusable in the body, or the close button; it returns to the opener on close.',
        'Close button has `aria-label="Close"`. Trigger elements set up by `init()` get `aria-haspopup="dialog"`.',
        'Transitions are skipped under `prefers-reduced-motion`.',
    ],
    tips: [
        'Prefer a single reusable instance for panels you open often; `setContent()` is cheaper than rebuilding.',
        'In React or Vue, create the drawer in an effect, render into `drawer.body` (or pass a DOM node as `content`), and `destroy()` on unmount.',
        'Safe to import on the server: nothing touches `document` until you call `create()`.',
        'Use `container` to mount into a positioned element when you want a drawer scoped to a card or panel instead of the viewport.',
    ],
    related: ['modal', 'popover', 'lightbox'],
    keywords: ['sheet', 'sidebar', 'offcanvas', 'panel', 'slide-over', 'bottom sheet'],
};

export default doc;
