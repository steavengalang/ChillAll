import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'modal',
    global: 'ChillModal',
    category: 'core',
    title: 'Modal',
    summary: 'Accessible modal dialogs with focus trap, stacking, sizes, buttons, veto-able close and promise helpers.',
    style: 'static',
    description:
        'ChillModal opens accessible dialogs over your page: content, footer buttons, five sizes, fullscreen, and a close button with Escape and outside-click dismissal. Focus is trapped inside, returns to the trigger on close, ' +
        'the page scroll is locked (reference counted across modals), and stacked modals behave: only the top one reacts to Escape.\n\n' +
        '`ChillModal.open(config)` returns an instance you can update and close. `ChillModal.alert()` and `ChillModal.confirm()` return promises for the common cases. ' +
        'A string `content` is rendered as **HTML** (for compatibility): pass `html: false`, use `text`, or pass a DOM node when the content is not fully trusted.',
    features: [
        'Sizes `sm`, `md`, `lg`, `xl`, `full` plus a true fullscreen mode',
        'Footer buttons with `primary` / `danger` styles and per-button `onClick(modal)`',
        '`onBeforeClose(modal, reason)` can veto closing, for unsaved-changes guards',
        'Stacked modals with correct z-index, Escape and Tab handling; reference-counted scroll lock',
        '`alert()` and `confirm()` promise helpers',
        'Focus trap, initial focus control and focus restoration; dark mode aware',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic modal',
            description: 'Title, text body and two buttons. `text` is rendered as plain text; each button receives the modal instance.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Open modal';
btn.addEventListener('click', () => {
  ChillModal.open({
    title: 'Publish article',
    text: 'Your article will be visible to everyone with the link.',
    buttons: [
      { text: 'Cancel', onClick: (m) => m.close() },
      { text: 'Publish', type: 'primary', onClick: (m) => { m.close(); ChillAlert.toast({ text: 'Published', type: 'success' }); } },
    ],
  });
});
root.append(btn);
cleanup(() => ChillModal.closeAll());`,
        },
        {
            id: 'form-content',
            title: 'Form in a modal',
            description: 'Pass a DOM node as `content` for full control and safe event wiring. `initialFocus` picks the field to focus; the Save button is disabled until the form is valid.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Edit profile';
btn.addEventListener('click', () => {
  const form = document.createElement('form');
  form.innerHTML = '<label style="display:block;font-size:13px;margin-bottom:6px">Display name</label>' +
    '<input name="name" style="width:100%;padding:8px;box-sizing:border-box" value="Ada Lovelace">';
  const input = form.querySelector('input');
  const m = ChillModal.open({
    title: 'Edit profile',
    size: 'sm',
    content: form,
    initialFocus: input,
    buttons: [
      { text: 'Cancel', onClick: (modal) => modal.close() },
      { text: 'Save', type: 'primary', onClick: (modal) => { console.log('saved', input.value); modal.close(); } },
    ],
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); m.close(); });
});
root.append(btn);
cleanup(() => ChillModal.closeAll());`,
        },
        {
            id: 'sizes',
            title: 'Sizes and fullscreen',
            description: 'Pick a `size`, or set `fullscreen: true` to cover the viewport. With `scrollable: false` the page overlay scrolls instead of the modal body.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const long = Array.from({ length: 12 }, (_, i) => 'Paragraph ' + (i + 1) + ': the quick brown fox jumps over the lazy dog.').join('\\n\\n');
['sm', 'md', 'lg', 'xl'].forEach((size) => {
  const b = document.createElement('button');
  b.textContent = size.toUpperCase();
  b.addEventListener('click', () => ChillModal.open({ title: 'Size ' + size, size, text: 'This is a ' + size + ' modal.' }));
  root.append(b);
});
const full = document.createElement('button');
full.textContent = 'Fullscreen';
full.addEventListener('click', () => ChillModal.open({ title: 'Terms of service', fullscreen: true, text: long, buttons: [{ text: 'I agree', type: 'primary', onClick: (m) => m.close() }] }));
root.append(full);
cleanup(() => ChillModal.closeAll());`,
        },
        {
            id: 'before-close',
            title: 'Guard against unsaved changes',
            description: '`onBeforeClose(modal, reason)` runs for the close button, Escape, the overlay and `close()`. Return `false` to keep the modal open. The reason tells you which one it was.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Write a note';
btn.addEventListener('click', () => {
  const area = document.createElement('textarea');
  area.rows = 4;
  area.style.cssText = 'width:100%;box-sizing:border-box;padding:8px';
  let dirty = false;
  area.addEventListener('input', () => { dirty = true; });
  ChillModal.open({
    title: 'New note',
    content: area,
    onBeforeClose: (m, reason) => {
      if (reason === 'api') return true;                 // our own Save/Discard buttons
      return !dirty || window.confirm('Discard your note?');
    },
    buttons: [
      { text: 'Discard', type: 'danger', onClick: (m) => m.close() },
      { text: 'Save', type: 'primary', onClick: (m) => { dirty = false; m.close(); } },
    ],
  });
});
root.append(btn);
cleanup(() => ChillModal.closeAll());`,
        },
        {
            id: 'stacked-promises',
            title: 'Confirm, alert and stacked modals',
            description: '`confirm()` resolves a boolean and `alert()` resolves when dismissed. A second modal opened from the first stacks on top, and only it reacts to Escape.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Delete workspace';
btn.addEventListener('click', async () => {
  const parent = ChillModal.open({
    title: 'Workspace settings',
    text: 'Manage "Acme Inc" here.',
    buttons: [
      { text: 'Close', onClick: (m) => m.close() },
      { text: 'Delete workspace', type: 'danger', onClick: async () => {
          const ok = await ChillModal.confirm({ title: 'Delete "Acme Inc"?', message: 'All projects will be removed.', confirmText: 'Delete', type: 'danger' });
          if (ok) { parent.close(); await ChillModal.alert({ title: 'Deleted', message: 'The workspace was removed.' }); }
      } },
    ],
  });
});
root.append(btn);
cleanup(() => ChillModal.closeAll());`,
        },
    ],
    guides: [
        {
            title: 'Opening and controlling a modal',
            body:
                '`ChillModal.open(config)` creates and shows a modal and returns its instance. Use the instance to update or close it:\n\n' +
                '```js\nconst m = ChillModal.open({ title: \'Uploading\', text: \'0%\', closable: false });\nm.setText(\'42%\');\nawait m.close();          // animated; resolves when removed\nm.destroy();             // immediate, no veto\n```\n\n' +
                '`close(reason)` returns a promise. If `onBeforeClose` returns `false` the modal stays open and the promise resolves immediately. Listen with `m.on(\'open\' | \'close\', fn)`, which returns an unsubscribe function, or with the `onOpen` / `onClose` options.',
        },
        {
            title: 'Content and security',
            body:
                '- **`text`** is always inserted as plain text.\n' +
                '- **`content`** as a **string** is rendered as HTML by default (`html: true`). Set `html: false` to render it as text instead.\n' +
                '- **`content`** as a **Node** is appended as-is. This is the safest way to build interactive bodies.\n' +
                '- `title` and button `text` are always text.\n\n' +
                '> Never pass user-provided strings as `content` without sanitising them or using `html: false`. `setContent(html)` follows the same HTML rule; `setText(text)` is always safe.',
        },
        {
            title: 'Dismissal, focus and scrolling',
            body:
                '`closable` (default `true`) controls the close button, Escape and an overlay click together. Override each with `closeOnEscape` and `closeOnOverlay`; for a modal the user must answer, use `closable: false` and provide buttons.\n\n' +
                'Initial focus goes to `initialFocus` (selector or element), then `[autofocus]`, then the first focusable element in the body, then the primary or danger footer button. ' +
                'Focus is trapped with Tab and returns to the previously focused element on close. Page scrolling is locked while any modal is open and restored when the last one closes. ' +
                'Modals sit at z-index 10000 and up (2 per stacked level), below ChillAlert and the toast layers.',
        },
    ],
    options: [
        { name: 'title', type: 'string', default: "''", description: 'Heading, rendered as text. Becomes the dialog\'s accessible name.' },
        { name: 'content', type: 'string | Node', default: "''", description: 'Body. Strings are HTML unless `html: false`; a Node is appended directly.' },
        { name: 'text', type: 'string', default: 'undefined', description: 'Plain text body used when `content` is empty.' },
        { name: 'html', type: 'boolean', default: 'true', description: 'Render a string `content` as HTML. `false` renders it as text.' },
        { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'md'", description: 'Maximum width: 360, 500, 720, 960 px or the full width.' },
        { name: 'fullscreen', type: 'boolean', default: 'false', description: 'Cover the whole viewport.' },
        { name: 'scrollable', type: 'boolean', default: 'true', description: 'Scroll the body inside the modal. `false` lets the page overlay scroll instead.' },
        { name: 'closable', type: 'boolean', default: 'true', description: 'Show the close button and allow Escape and overlay-click dismissal.' },
        { name: 'closeOnEscape', type: 'boolean', default: 'closable', description: 'Close on Escape.' },
        { name: 'closeOnOverlay', type: 'boolean', default: 'closable', description: 'Close when the backdrop is clicked.' },
        { name: 'ariaLabel', type: 'string', default: 'undefined', description: 'Accessible name when there is no `title`.' },
        { name: 'initialFocus', type: 'string | Element', default: 'auto', description: 'Selector or element to focus on open.' },
        { name: 'buttons', type: 'Button[]', default: '[]', description: 'Footer buttons.' },
        { name: 'buttons[].text', type: 'string', default: "''", description: 'Label, rendered as text.' },
        { name: 'buttons[].type', type: "'primary' | 'danger' | string", default: 'undefined', description: 'Style class: `primary` and `danger` are built in. Other names are added as plain class names.' },
        { name: 'buttons[].onClick', type: '(modal) => void', default: 'undefined', description: 'Click handler; receives the modal instance. The modal does not close automatically.' },
        { name: 'buttons[].disabled', type: 'boolean', default: 'false', description: 'Disable the button.' },
        { name: 'onOpen', type: '(modal) => void', default: 'null', description: 'Called after the modal opens.' },
        { name: 'onClose', type: '(modal) => void', default: 'null', description: 'Called after the modal is removed.' },
        { name: 'onBeforeClose', type: "(modal, reason: 'api' | 'escape' | 'overlay' | 'close-button') => boolean | void", default: 'null', description: 'Return `false` to veto closing.' },
    ],
    methods: [
        { signature: 'ChillModal.open(config)', on: 'static', description: 'Create and open a modal. Returns the instance.' },
        { signature: 'ChillModal.alert({ title, message, buttonText, size })', on: 'static', description: 'Info dialog. Returns a promise resolved when it closes. `message` is text.' },
        { signature: 'ChillModal.confirm({ title, message, confirmText, cancelText, type, size })', on: 'static', description: 'Returns `Promise<boolean>`: `true` only for the confirm button. `type: \'danger\'` makes it red.' },
        { signature: 'ChillModal.closeAll()', on: 'static', description: 'Close every open modal, top first.' },
        { signature: 'ChillModal.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.close(reason?)', description: 'Close with the exit animation. Returns a promise; honours `onBeforeClose`.' },
        { signature: 'instance.destroy()', description: 'Close immediately with no animation and no veto, and release all listeners.' },
        { signature: 'instance.setContent(htmlOrNode)', description: 'Replace the body. Strings are treated as HTML.' },
        { signature: 'instance.setText(text)', description: 'Replace the body with plain text.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `open` or `close`. Returns an unsubscribe function.' },
        { signature: 'instance.isOpen / element / modal', description: 'Properties: open state, the overlay element and the dialog element.' },
    ],
    events: [
        { name: 'open', payload: 'modal', description: 'The modal was opened.' },
        { name: 'close', payload: 'modal', description: 'The modal was closed and removed.' },
    ],
    cssVars: [
        { name: '--chillmodal-bg / --chillmodal-text / --chillmodal-text-light', description: 'Dialog surface and text colours.' },
        { name: '--chillmodal-border', description: 'Dialog, header and footer borders; hover colour for buttons.' },
        { name: '--chillmodal-overlay', description: 'Backdrop colour.' },
        { name: '--chillmodal-focus', description: 'Focus ring colour.' },
    ],
    a11y: [
        'The dialog has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title) and `aria-describedby` (body); with no title, set `ariaLabel`.',
        'Focus moves into the modal, is trapped with Tab and Shift+Tab, and returns to the previously focused element on close.',
        'Escape closes the top-most modal only (when `closeOnEscape`); the close button has `aria-label="Close"`.',
        'Page scroll is locked while open; stacked modals share a reference-counted lock.',
        'Animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'For confirmations and quick prompts, ChillAlert is lighter. Use ChillModal when you need arbitrary content, sizes or several buttons.',
        'Buttons never close the modal on their own: call `modal.close()` in `onClick` (after any async work).',
        'In React or Vue, build the body as a DOM node (or use `setContent`) and call `destroy()` when the component unmounts.',
        'The module is SSR-safe; `open()` does nothing without a DOM.',
        'Call `ChillModal.closeAll()` on route changes to avoid leaving dialogs behind.',
    ],
    related: ['alert', 'drawer', 'popover', 'notify'],
    keywords: ['dialog', 'popup', 'overlay', 'lightbox', 'confirm', 'window'],
};

export default doc;
