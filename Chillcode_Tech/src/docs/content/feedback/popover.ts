import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'popover',
    global: 'ChillPopover',
    category: 'feedback',
    title: 'Popover',
    summary: 'Anchored floating panels with title, footer, arrow, auto-flip, focus handling and a confirm helper.',
    style: 'init',
    description:
        'ChillPopover attaches a floating panel to any trigger element. Unlike a tooltip it can hold interactive content: forms, buttons, links. ' +
        'Create one with `ChillPopover.init(trigger, options)`, or use `ChillPopover.confirm(trigger, options)` for a ready-made "Are you sure?" bubble.\n\n' +
        'The panel lives in `document.body`, is positioned next to the trigger and flips to the opposite side when it does not fit. ' +
        'Strings are rendered as **text**; pass a DOM node, `html: true` or `contentHtml` for markup you trust.',
    features: [
        'Click (default), hover, focus or manual triggers with outside-click and Esc to close',
        'Title, body and footer slots that accept text, DOM nodes or trusted HTML',
        'Moves focus into the panel on open and returns it to the trigger on close',
        'Built-in `confirm()` helper with confirm and cancel callbacks',
        'Auto-flip, viewport clamping and an arrow that keeps pointing at the trigger',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Click popover',
            description: 'A title and body anchored below a button. Click the trigger again, click outside or press Esc to close it.',
            height: 220,
            code: `const btn = ChillButtonLike('Shipping info');
function ChillButtonLike(text) {
  const b = document.createElement('button');
  b.textContent = text;
  b.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  return b;
}
root.append(btn);
const pop = ChillPopover.init(btn, {
  title: 'Free shipping',
  content: 'Orders over $50 ship free and arrive in 3 to 5 business days.',
  position: 'bottom',
});
pop.show();
cleanup(() => pop.destroy());`,
        },
        {
            id: 'close-footer',
            title: 'Close button and footer',
            description: '`showClose` adds an X button; `footer` accepts a DOM node, so you can put real buttons in it and wire them yourself.',
            height: 260,
            code: `const trigger = document.createElement('button');
trigger.textContent = 'Invite teammate';
trigger.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(trigger);

const input = document.createElement('input');
input.type = 'email';
input.placeholder = 'name@company.com';
input.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid var(--chill-border);border-radius:6px';
const send = document.createElement('button');
send.className = 'chillpopover-btn chillpopover-btn-primary';
send.textContent = 'Send invite';

const pop = ChillPopover.init(trigger, {
  title: 'Invite by email', content: input, footer: send,
  showClose: true, position: 'bottom',
});
send.addEventListener('click', () => pop.hide(0, true));
pop.show();
cleanup(() => pop.destroy());`,
        },
        {
            id: 'hover',
            title: 'Hover and focus triggers',
            description: 'With `triggerOn: "hover"` the panel stays open while the pointer is over the trigger or the panel itself (150ms grace by default).',
            height: 240,
            code: `root.style.cssText += ';display:flex;gap:16px;justify-content:center;padding-top:16px';
const user = document.createElement('a');
user.href = '#';
user.textContent = '@maya';
user.style.cssText = 'color:var(--chill-text);font-weight:600';
user.addEventListener('click', (e) => e.preventDefault());
root.append(user);
const pop = ChillPopover.init(user, {
  triggerOn: 'hover',
  position: 'bottom',
  title: 'Maya Lindqvist',
  content: 'Product designer. 128 followers, 42 projects.',
});
cleanup(() => pop.destroy());`,
        },
        {
            id: 'confirm',
            title: 'Confirm helper',
            description: '`ChillPopover.confirm()` builds a popover with Cancel and Confirm buttons and calls `onConfirm` / `onCancel`.',
            height: 240,
            code: `const del = document.createElement('button');
del.textContent = 'Delete project';
del.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid #ef4444;background:transparent;color:#ef4444;cursor:pointer';
const msg = document.createElement('p');
msg.style.cssText = 'color:var(--chill-text);font-size:13px';
msg.textContent = 'Nothing deleted yet.';
root.append(del, msg);
const pop = ChillPopover.confirm(del, {
  title: 'Delete project?',
  content: 'This permanently removes all files and cannot be undone.',
  confirmText: 'Delete', cancelText: 'Keep it', position: 'bottom',
  onConfirm: () => { msg.textContent = 'Project deleted.'; },
  onCancel: () => { msg.textContent = 'Cancelled.'; },
});
cleanup(() => pop.destroy());`,
        },
        {
            id: 'events-manual',
            title: 'Manual control and events',
            description: 'Use `triggerOn: "manual"` to open and close from your own code, `setContent()` to update it, and `on()` to react to open/close.',
            height: 240,
            code: `const el = document.createElement('span');
el.textContent = 'Sync status';
el.style.cssText = 'display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px';
const log = document.createElement('div');
log.style.cssText = 'margin-top:8px;font-size:12px;color:var(--chill-text)';
root.append(el, log);
const pop = ChillPopover.init(el, { triggerOn: 'manual', position: 'bottom', title: 'Syncing', content: 'Uploading 3 files...', showClose: true });
pop.on('open', () => { log.textContent = 'open event'; }).on('close', () => { log.textContent = 'close event'; });
pop.show();
const t = setTimeout(() => pop.setContent('All 3 files uploaded.'), 1500);
cleanup(() => { clearTimeout(t); pop.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Popover vs tooltip',
            body:
                'Use a **tooltip** for a short, passive hint. Use a **popover** when the user can interact with the content, when it has a title or footer, or when it should stay open until dismissed.\n\n' +
                'A popover is a non-modal `role="dialog"`: the rest of the page stays usable and a click outside closes it (disable with `closeOnOutsideClick: false`; manual mode never listens for outside clicks).',
        },
        {
            title: 'Content slots and safety',
            body:
                '`title`, `content` and `footer` accept a string (inserted as text) or a DOM node (appended as is). ' +
                'To insert markup either set `html: true` for all three, or pass the explicit `titleHtml`, `contentHtml` and `footerHtml` strings. Only do this with markup you trust or have sanitised.\n\n' +
                '```js\nChillPopover.init(btn, {\n  title: \'Keyboard shortcuts\',\n  contentHtml: \'<kbd>Ctrl</kbd> + <kbd>K</kbd> opens search\',\n});\n```',
        },
        {
            title: 'Focus behaviour',
            body:
                'When opened by click or keyboard (not hover), focus moves to the first focusable element inside the panel (`focusOnOpen`). ' +
                'Esc, the close button, the confirm helper buttons and tabbing past the last control close the popover and return focus to the trigger (`returnFocus`). ' +
                'Calling `hide(delay, true)` yourself does the same.',
        },
    ],
    options: [
        { name: 'title', type: 'string | Node', default: "''", description: 'Header text. Header is omitted when empty.' },
        { name: 'content', type: 'string | Node', default: "''", description: 'Body. Strings are rendered as text unless `html` is true.' },
        { name: 'footer', type: 'string | Node', default: 'null', description: 'Footer slot, right-aligned flex row. Same rules as `content`.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert title, content and footer strings as HTML (sanitise first).' },
        { name: 'titleHtml', type: 'string', default: 'undefined', description: 'Trusted HTML for the title only.' },
        { name: 'contentHtml', type: 'string', default: 'undefined', description: 'Trusted HTML for the body only.' },
        { name: 'footerHtml', type: 'string', default: 'undefined', description: 'Trusted HTML for the footer only.' },
        { name: 'position', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Preferred side. Invalid values fall back to `top`.' },
        { name: 'flip', type: 'boolean', default: 'true', description: 'Flip to the opposite side when it does not fit in the viewport.' },
        { name: 'offset', type: 'number', default: '12', description: 'Gap in pixels between trigger and panel.' },
        { name: 'showArrow', type: 'boolean', default: 'true', description: 'Render the arrow.' },
        { name: 'showClose', type: 'boolean', default: 'false', description: 'Add a close (X) button.' },
        { name: 'closeLabel', type: 'string', default: "'Close'", description: 'Accessible label of the close button.' },
        { name: 'triggerOn', type: "'click' | 'hover' | 'focus' | 'manual'", default: "'click'", description: 'Which interaction opens the popover.' },
        { name: 'hideDelay', type: 'number', default: '0 (150 for hover)', description: 'Delay before hiding, used by hover/focus-out and `hide()`.' },
        { name: 'closeOnOutsideClick', type: 'boolean', default: 'true', description: 'Close when clicking outside (ignored for `manual`).' },
        { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Esc while open.' },
        { name: 'focusOnOpen', type: 'boolean', default: 'true', description: 'Move focus to the first focusable element when opened by click or keyboard.' },
        { name: 'returnFocus', type: 'boolean', default: 'true', description: 'Return focus to the trigger when closed with Esc, the close button or Tab-out.' },
        { name: 'ariaLabel', type: 'string', default: "''", description: 'Accessible name when there is no title.' },
        { name: 'id', type: 'string', default: "auto ('chillpopover-N')", description: 'id of the popover element (referenced by `aria-controls`).' },
        { name: 'onOpen', type: '(instance) => void', default: 'null', description: 'Called after the popover opens.' },
        { name: 'onClose', type: '(instance) => void', default: 'null', description: 'Called after the popover closes.' },
        { name: 'confirm: confirmText', type: 'string', default: "'Confirm'", description: '`confirm()` only: label of the confirm button.' },
        { name: 'confirm: cancelText', type: 'string', default: "'Cancel'", description: '`confirm()` only: label of the cancel button.' },
        { name: 'confirm: variant', type: "'danger' | 'primary' | 'secondary'", default: "'danger'", description: '`confirm()` only: style of the confirm button.' },
        { name: 'confirm: onConfirm / onCancel', type: '() => void', default: 'undefined', description: '`confirm()` only: callbacks fired after the popover closes.' },
    ],
    methods: [
        { signature: 'ChillPopover.init(trigger, options?)', on: 'static', description: 'Attach a popover to a selector or element; returns an instance.' },
        { signature: 'ChillPopover.confirm(trigger, options?)', on: 'static', description: 'Popover with Cancel/Confirm buttons and a close button; returns an instance.' },
        { signature: 'ChillPopover.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.show()', description: 'Open the popover (no-op if already open).' },
        { signature: 'instance.hide(delay?, restoreFocus?)', description: 'Close, optionally overriding the delay (ms) and forcing focus back to the trigger.' },
        { signature: 'instance.toggle()', description: 'Open if closed, close if open.' },
        { signature: 'instance.setContent(content, html?)', description: 'Replace the body content.' },
        { signature: 'instance.setTitle(title, html?)', description: 'Replace the title text (only if the popover was created with a title).' },
        { signature: 'instance.setPosition(position)', description: 'Change the preferred side.' },
        { signature: 'instance.on(event, fn) / off(event, fn?)', description: 'Subscribe to or remove event handlers. Both return the instance.' },
        { signature: 'instance.isOpen', description: 'Boolean property: true while the popover is open.' },
        { signature: 'instance.popoverEl / triggerEl', description: 'The panel element and the trigger element.' },
        { signature: 'instance.destroy()', description: 'Remove the panel, listeners and restore the trigger\'s ARIA attributes.' },
    ],
    events: [
        { name: 'open', payload: 'instance', description: 'Fired after the popover opens.' },
        { name: 'close', payload: 'instance', description: 'Fired after the popover closes.' },
    ],
    cssVars: [
        { name: '--chillpopover-bg', description: 'Panel and arrow background.' },
        { name: '--chillpopover-text', description: 'Text colour.' },
        { name: '--chillpopover-text-muted', description: 'Close button colour.' },
        { name: '--chillpopover-border', description: 'Border and divider colour.' },
        { name: '--chillpopover-shadow', description: 'Panel shadow.' },
        { name: '--chillpopover-focus', description: 'Focus ring colour of the built-in buttons.' },
    ],
    a11y: [
        'The panel has `role="dialog"` with `aria-modal="false"`, labelled by its title (`aria-labelledby`) or by `ariaLabel`.',
        'The trigger gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`; the original values are restored on `destroy()`.',
        'Esc closes the popover; Tab past the last (or Shift+Tab before the first) control closes it and returns focus to the trigger.',
        'Focus moves into the panel when opened by click, and is returned to the trigger on close.',
        'Transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'The panel is appended to `document.body`, so it is not clipped by `overflow: hidden` ancestors.',
        'Call `destroy()` when the trigger is removed to clean up the panel and global listeners.',
        'In React, call `init()` in an effect on a ref, and return `() => pop.destroy()`.',
        'The module is safe to import on the server; the constructor throws without a DOM, so create instances in the browser only.',
    ],
    related: ['tooltip', 'dropdown', 'modal', 'alert'],
    keywords: ['popup', 'bubble', 'floating panel', 'confirm', 'overlay', 'dialog'],
};

export default doc;
