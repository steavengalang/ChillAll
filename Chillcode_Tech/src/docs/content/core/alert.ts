import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'alert',
    global: 'ChillAlert',
    category: 'core',
    title: 'Alert',
    summary: 'Promise-based alert, confirm and prompt dialogs, plus toasts and a blocking loading overlay.',
    style: 'static',
    description:
        'ChillAlert replaces `window.alert`, `confirm` and `prompt` with accessible, themed dialogs that return promises, so flows read top to bottom: ' +
        '`if (await ChillAlert.confirm({ ... })) { ... }`. It also ships non-blocking toasts and a loading overlay you close when your work is done.\n\n' +
        'Dialogs trap focus, restore it to the element that opened them, close on Escape or an outside click (both can be disabled) and stack correctly: only the top dialog reacts to the keyboard. ' +
        '`title`, `text` and toast text are always inserted as **text**. Pass `html` only for trusted, sanitised markup.\n\n' +
        'Nothing runs on import, so the module is safe on the server. Called without a DOM, `alert()` resolves `undefined`, `confirm()` resolves `false` and `prompt()` resolves `null`.',
    features: [
        'Promise API: `alert()`, `confirm()` -> boolean, `prompt()` -> trimmed string or `null`',
        'Six-position toasts with pause on hover and focus, and a persistent mode',
        '`loading()` overlay with `aria-busy` that cannot be dismissed by the user',
        'Focus trap, focus restore, Escape and outside-click control, stacked dialogs',
        'Dark mode via OS preference, `data-theme="dark"` or `.dark`; reduced-motion aware',
        'Safe by default: text is never parsed as HTML unless you opt in with `html`',
    ],
    examples: [
        {
            id: 'alert-icons',
            title: 'Alert',
            description: 'A one-button message. The icon (`success`, `error`, `warning`, `info`, `question`) also colours the button. The promise resolves when the dialog closes.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const cases = [
  { label: 'Success', icon: 'success', title: 'Profile saved', text: 'Your changes are live.' },
  { label: 'Error', icon: 'error', title: 'Upload failed', text: 'The file is larger than 10 MB.' },
  { label: 'Warning', icon: 'warning', title: 'Low storage', text: 'You have used 92% of your plan.' },
  { label: 'Info', icon: 'info', title: 'Maintenance tonight', text: 'Read-only mode from 02:00 to 02:30 UTC.' },
];
cases.forEach((c) => {
  const b = document.createElement('button');
  b.textContent = c.label;
  b.addEventListener('click', async () => {
    await ChillAlert.alert({ title: c.title, text: c.text, icon: c.icon });
    console.log('alert closed');
  });
  root.append(b);
});
cleanup(() => ChillAlert.closeAll());`,
        },
        {
            id: 'confirm',
            title: 'Confirm',
            description: '`confirm()` resolves `true` on confirm and `false` on cancel, Escape or an outside click. Use `confirmButtonClass: \'error\'` for destructive actions.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Delete project';
const status = document.createElement('p');
status.style.color = 'var(--chill-text)';
status.textContent = 'Project "Atlas" exists.';
btn.addEventListener('click', async () => {
  const ok = await ChillAlert.confirm({
    title: 'Delete "Atlas"?',
    text: 'This cannot be undone.',
    icon: 'warning',
    confirmText: 'Delete',
    cancelText: 'Keep it',
    confirmButtonClass: 'error',
  });
  status.textContent = ok ? 'Project deleted.' : 'Nothing was deleted.';
  if (ok) ChillAlert.toast({ text: 'Project deleted', type: 'success' });
});
root.append(btn, status);
cleanup(() => ChillAlert.closeAll());`,
        },
        {
            id: 'prompt',
            title: 'Prompt',
            description: '`prompt()` resolves the trimmed value, or `null` when cancelled or left empty. Enter submits; `inputType` supports text, password, email, number, url, tel and search.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Rename file';
const out = document.createElement('p');
out.style.color = 'var(--chill-text)';
out.textContent = 'Current name: report.pdf';
btn.addEventListener('click', async () => {
  const name = await ChillAlert.prompt({
    title: 'Rename file',
    text: 'Choose a new name.',
    placeholder: 'e.g. q3-report.pdf',
    defaultValue: 'report.pdf',
    confirmText: 'Rename',
  });
  out.textContent = name === null ? 'Cancelled.' : 'Current name: ' + name;
});
root.append(btn, out);
cleanup(() => ChillAlert.closeAll());`,
        },
        {
            id: 'toasts',
            title: 'Toasts',
            description: 'Non-blocking messages in any of six corners. They pause while hovered or focused; `duration: 0` keeps a toast until you remove it.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const add = (label, opts) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.addEventListener('click', () => ChillAlert.toast(opts));
  root.append(b);
};
add('Success', { text: 'Link copied to clipboard', type: 'success', position: 'bottom-center' });
add('Error', { text: 'Could not reach the server', type: 'error', position: 'top-right' });
add('Warning', { text: 'Unsaved changes', type: 'warning', position: 'top-left', duration: 5000 });
const sticky = document.createElement('button');
sticky.textContent = 'Persistent';
sticky.addEventListener('click', () => {
  const t = ChillAlert.toast({ text: 'Syncing... (click to dismiss)', type: 'info', duration: 0, position: 'bottom-right' });
  t.toast.addEventListener('click', () => t.remove());
});
root.append(sticky);
cleanup(() => ChillAlert.closeAll());`,
        },
        {
            id: 'loading',
            title: 'Loading overlay',
            description: '`loading()` blocks the page, ignores Escape and outside clicks, and returns `{ close() }`. Close it in a `finally` so errors never leave it stuck.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Export report';
btn.addEventListener('click', async () => {
  const l = ChillAlert.loading({ title: 'Exporting', text: 'Preparing your report...' });
  try {
    await new Promise((r) => setTimeout(r, 1800));   // pretend to call your API
    ChillAlert.toast({ text: 'Report ready', type: 'success' });
  } finally {
    await l.close();
  }
});
root.append(btn);
cleanup(() => ChillAlert.closeAll());`,
        },
        {
            id: 'chained',
            title: 'Chained flow with custom HTML',
            description: 'Dialogs compose naturally with `await`. `html` is an explicit opt-in for trusted markup; here the values are static.',
            manual: true,
            code: `const btn = document.createElement('button');
btn.textContent = 'Invite teammate';
btn.addEventListener('click', async () => {
  const email = await ChillAlert.prompt({
    title: 'Invite teammate',
    placeholder: 'name@company.com',
    inputType: 'email',
    confirmText: 'Continue',
  });
  if (!email) return;
  const ok = await ChillAlert.confirm({
    title: 'Send invitation?',
    html: 'We will email an invite to <strong>your teammate</strong> (static, trusted markup).',
    icon: 'question',
    confirmText: 'Send',
  });
  if (ok) ChillAlert.toast({ text: 'Invitation sent to ' + email, type: 'success', position: 'bottom-center' });
});
root.append(btn);
cleanup(() => ChillAlert.closeAll());`,
        },
    ],
    guides: [
        {
            title: 'Getting started',
            body:
                'There is nothing to instantiate: ChillAlert is a plain object of functions. Include the script (or import the module) and call them.\n\n' +
                '```js\nawait ChillAlert.alert({ title: \'Saved\', icon: \'success\' });\n' +
                'if (await ChillAlert.confirm({ title: \'Delete?\', icon: \'warning\', confirmButtonClass: \'error\' })) { /* ... */ }\n' +
                'const name = await ChillAlert.prompt({ title: \'Your name\', placeholder: \'Jane\' });\n' +
                'ChillAlert.toast({ text: \'Copied\', type: \'success\', position: \'bottom-center\' });\n' +
                'const l = ChillAlert.loading({ text: \'Working...\' });\nawait l.close();\n```\n\n' +
                'The stylesheet is injected automatically on first use; call `ChillAlert.injectCSS()` earlier if you want to avoid any flash.',
        },
        {
            title: 'Return values',
            body:
                '- **`alert()`** resolves `undefined` however the dialog closes.\n' +
                '- **`confirm()`** resolves `true` only for the confirm button (or Enter while focus is not on a button). Cancel, Escape and an outside click resolve `false`.\n' +
                '- **`prompt()`** resolves the **trimmed** input, or `null` when cancelled or when the trimmed value is empty. Treat `null` as "no answer".\n' +
                '- **`toast()`** returns `{ toast, remove() }` immediately: `toast` is the element, `remove()` dismisses it (idempotent).\n' +
                '- **`loading()`** returns `{ close() }`; `close()` returns a promise that resolves after the exit animation and is safe to call twice.\n\n' +
                '> Dialogs that close because of `ChillAlert.closeAll()` resolve as dismissed (`undefined`, `false`, `null`).',
        },
        {
            title: 'Toasts vs dialogs',
            body:
                'Use a **dialog** when you need an answer or must interrupt the user (destructive confirms, required input). Use a **toast** for confirmations that need no reply ("Saved", "Copied").\n\n' +
                'Toasts of the same position share one stacked container with `aria-live="polite"`. Error toasts get `role="alert"`, the rest `role="status"`. ' +
                'The timer pauses on hover and focus and resumes with the remaining time. An unknown `type` or `position` falls back to `info` / `top-right`.',
        },
        {
            title: 'Theming',
            body:
                'Colours are CSS custom properties on `:root`. Override them after the library loads:\n\n' +
                '```css\n:root {\n  --chillalert-info: #7c3aed;\n  --chillalert-bg: #fffdf8;\n  --chillalert-overlay: rgba(15, 23, 42, 0.55);\n}\n```\n\n' +
                'Dark values apply under `prefers-color-scheme: dark`, `<html data-theme="dark">` and `<html class="dark">`; add `data-theme="light"` or `class="light"` to force light mode against the OS.',
        },
    ],
    options: [
        { name: 'alert: title', type: 'string', default: "''", description: 'Heading, rendered as text.' },
        { name: 'alert: text', type: 'string', default: "''", description: 'Body copy, rendered as text.' },
        { name: 'alert: html', type: 'string', default: 'undefined', description: 'Trusted HTML shown instead of `text`. You must sanitise it.' },
        { name: 'alert: icon', type: "'success' | 'error' | 'warning' | 'info' | 'question' | 'loading'", default: "'info'", description: 'Icon above the title; unknown names fall back to `info`. Also picks the button colour.' },
        { name: 'alert: buttonText', type: 'string', default: "'OK'", description: 'Label of the single button.' },
        { name: 'alert: allowEscapeKey', type: 'boolean', default: 'true', description: 'Close on Escape.' },
        { name: 'alert: allowOutsideClick', type: 'boolean', default: 'true', description: 'Close when the overlay is clicked.' },
        { name: 'confirm: title / text / html', type: 'string', default: "''", description: 'Same as alert.' },
        { name: 'confirm: icon', type: 'string', default: "'question'", description: 'Same set of icons as alert.' },
        { name: 'confirm: confirmText', type: 'string', default: "'Confirm'", description: 'Confirm button label.' },
        { name: 'confirm: cancelText', type: 'string', default: "'Cancel'", description: 'Cancel button label.' },
        { name: 'confirm: confirmButtonClass', type: "'primary' | 'success' | 'error' | 'secondary'", default: "'primary'", description: 'Colour of the confirm button.' },
        { name: 'confirm: allowEscapeKey / allowOutsideClick', type: 'boolean', default: 'true', description: 'Same as alert.' },
        { name: 'prompt: title / text / html', type: 'string', default: "''", description: 'Same as alert.' },
        { name: 'prompt: placeholder', type: 'string', default: "''", description: 'Input placeholder, also used as its accessible name.' },
        { name: 'prompt: defaultValue', type: 'string', default: "''", description: 'Prefilled and selected value.' },
        { name: 'prompt: inputType', type: "'text' | 'password' | 'email' | 'number' | 'url' | 'tel' | 'search'", default: "'text'", description: 'Input type; anything else becomes `text`.' },
        { name: 'prompt: confirmText', type: 'string', default: "'Submit'", description: 'Submit button label.' },
        { name: 'prompt: cancelText', type: 'string', default: "'Cancel'", description: 'Cancel button label.' },
        { name: 'prompt: allowEscapeKey / allowOutsideClick', type: 'boolean', default: 'true', description: 'Same as alert.' },
        { name: 'toast: text', type: 'string', default: "''", description: 'Message, rendered as text.' },
        { name: 'toast: type', type: "'success' | 'error' | 'warning' | 'info'", default: "'info'", description: 'Accent colour and icon.' },
        { name: 'toast: position', type: "'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'", default: "'top-right'", description: 'Screen corner or edge.' },
        { name: 'toast: duration', type: 'number', default: '3000', description: 'Milliseconds before auto-dismiss; `0` keeps the toast until removed.' },
        { name: 'loading: title', type: 'string', default: "''", description: 'Optional heading.' },
        { name: 'loading: text', type: 'string', default: "'Loading...'", description: 'Message, also the accessible label.' },
    ],
    methods: [
        { signature: 'ChillAlert.alert(options)', on: 'static', description: 'Show an alert. Returns `Promise<void>`.' },
        { signature: 'ChillAlert.confirm(options)', on: 'static', description: 'Show a confirmation. Returns `Promise<boolean>`.' },
        { signature: 'ChillAlert.prompt(options)', on: 'static', description: 'Ask for text. Returns `Promise<string | null>`.' },
        { signature: 'ChillAlert.toast(options)', on: 'static', description: 'Show a toast. Returns `{ toast, remove() }`.' },
        { signature: 'ChillAlert.loading(options)', on: 'static', description: 'Show the loading overlay. Returns `{ close() }`.' },
        { signature: 'ChillAlert.closeAll()', on: 'static', description: 'Close every open dialog (promises resolve as dismissed) and every toast immediately.' },
        { signature: 'ChillAlert.injectCSS()', on: 'static', description: 'Inject the stylesheet now. Runs automatically on first use and is idempotent.' },
        { signature: 'ChillAlert.version', description: 'Version string of the library.' },
        { signature: 'toastHandle.remove()', description: 'Dismiss a toast with its exit animation. Safe to call repeatedly.' },
        { signature: 'loadingHandle.close()', description: 'Close the loading overlay. Returns a promise that resolves once it is gone.' },
    ],
    cssVars: [
        { name: '--chillalert-bg / --chillalert-text / --chillalert-text-light', description: 'Dialog and toast surface and text colours.' },
        { name: '--chillalert-border', description: 'Border colour of dialogs and toasts.' },
        { name: '--chillalert-overlay', description: 'Backdrop colour behind dialogs.' },
        { name: '--chillalert-success / -error / -warning / -info', description: 'Icon and toast accent colours.' },
        { name: '--chillalert-btn-bg / --chillalert-btn-text / --chillalert-btn-border', description: 'Neutral button and input colours.' },
    ],
    a11y: [
        'Alert and confirm use `role="alertdialog"`, prompt and loading use `role="dialog"`; all set `aria-modal="true"` and link `aria-labelledby` / `aria-describedby` to the title and text.',
        'Focus moves into the dialog, is trapped with Tab and Shift+Tab, and returns to the previous element on close. Confirm focuses its confirm button; prompt focuses the input.',
        'Escape closes the top dialog only (unless `allowEscapeKey: false`); Enter confirms, but never overrides a focused Cancel button.',
        'The loading overlay sets `aria-busy="true"` and ignores Escape and outside clicks.',
        'Toasts live in an `aria-live="polite"` region; error toasts use `role="alert"`. Animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'SSR-safe: importing never touches `window`. On the server `alert` resolves `undefined`, `confirm` resolves `false`, `prompt` resolves `null`.',
        'In React or Vue, call these from event handlers or effects: `onClick={async () => { if (await ChillAlert.confirm({ title: \'Delete?\' })) remove(); }}`.',
        'Always `await` the loading handle\'s `close()` inside `finally` so a failed request cannot leave the page blocked.',
        'Call `ChillAlert.closeAll()` on route changes or component unmount to avoid orphaned dialogs.',
        'For richer content (forms, tables) use ChillModal; ChillAlert is intentionally small and opinionated.',
    ],
    related: ['modal', 'notify', 'toast', 'spinner'],
    keywords: ['dialog', 'confirm', 'prompt', 'toast', 'sweetalert', 'loading', 'popup', 'snackbar'],
};

export default doc;
