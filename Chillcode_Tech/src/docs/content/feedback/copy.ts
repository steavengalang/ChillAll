import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'copy',
    global: 'ChillCopy',
    category: 'feedback',
    title: 'Copy',
    summary: 'Copy-to-clipboard helper and button with success feedback, tooltip and a reliable fallback.',
    style: 'create',
    description:
        'ChillCopy puts text on the clipboard and tells the user it worked. Use `ChillCopy.copy(text)` for a plain promise-based helper, ' +
        '`ChillCopy.create()` for a ready-made copy button, or `ChillCopy.init()` to wire up buttons that are already in your HTML with `data-chill-copy` attributes.\n\n' +
        'It uses the async Clipboard API in secure contexts and falls back to a hidden textarea with `execCommand("copy")` elsewhere (older browsers, plain HTTP). `copy()` never rejects - it resolves `true` or `false`.',
    features: [
        '`ChillCopy.copy(text)` returns a promise of `true` / `false`, with automatic fallback',
        'Ready-made button with icon, label swap and a tooltip bubble, reverting after `duration`',
        'Declarative: `data-chill-copy="text"` or `data-chill-copy-target="#el"` (copies `value` or `textContent`)',
        'Success / error feedback via classes, callbacks and bubbling `chillcopy:copy` / `chillcopy:error` events',
        'Screen-reader announcement of the result through a polite live region',
    ],
    examples: [
        {
            id: 'button',
            title: 'Copy button',
            description: '`create()` returns an instance; append `instance.element` anywhere. The label and icon switch to the success state for `duration` ms.',
            code: `const btn = ChillCopy.create({ text: 'npm install chillall', label: 'Copy command' });
root.append(btn.element);
cleanup(() => btn.destroy());`,
        },
        {
            id: 'snippet',
            title: 'Code snippet with an icon button',
            description: 'A button without a label becomes an icon button. Pass `ariaLabel` so assistive tech knows what it does.',
            code: `const box = document.createElement('div');
box.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:monospace';
const code = document.createElement('span');
code.textContent = 'git clone https://github.com/chillall/chillall.git';
code.style.flex = '1';
const btn = ChillCopy.create({ text: () => code.textContent, label: '', ariaLabel: 'Copy clone command' });
box.append(code, btn.element);
root.append(box);
cleanup(() => btn.destroy());`,
            height: 100,
        },
        {
            id: 'init-attrs',
            title: 'Declarative with data attributes',
            description: '`init()` upgrades existing elements. `data-chill-copy` holds literal text; `data-chill-copy-target` points at an element or field whose value is copied.',
            code: `root.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;color:var(--chill-text)">' +
  '<div><button data-chill-copy="hello@chillall.dev">Copy email</button></div>' +
  '<div style="display:flex;gap:8px"><input id="copy-demo-link" readonly value="https://chillall.dev/invite/7Xk2" style="flex:1;padding:6px">' +
  '<button data-chill-copy-target="#copy-demo-link">Copy link</button></div></div>';
const inst = ChillCopy.init(root.querySelectorAll('[data-chill-copy], [data-chill-copy-target]'), { successLabel: 'Copied!', duration: 1500 });
cleanup(() => inst.destroy());`,
            height: 140,
        },
        {
            id: 'events',
            title: 'Callbacks and events',
            description: '`onCopy(text, el)` and `onError(error, el)` report the outcome. The same information bubbles as `chillcopy:copy` / `chillcopy:error` CustomEvents.',
            code: `const out = document.createElement('p');
out.style.color = 'var(--chill-text)';
out.textContent = 'Click the button to copy an API key.';
const btn = ChillCopy.create({
  text: 'ck_live_51Nx9f2eZvKYlo2C',
  label: 'Copy API key',
  successLabel: 'Key copied',
  errorLabel: 'Copy blocked',
  tooltip: false,
  onCopy: (text) => (out.textContent = 'Copied ' + text.length + ' characters'),
  onError: (err) => (out.textContent = 'Could not copy: ' + err.message),
});
root.addEventListener('chillcopy:copy', (e) => console.log('copied', e.detail.text));
root.append(btn.element, out);
cleanup(() => btn.destroy());`,
            height: 120,
        },
        {
            id: 'helper',
            title: 'The plain helper',
            description: '`ChillCopy.copy(text)` works from any handler, with no button needed. It resolves to a boolean you can use to show your own feedback.',
            code: `const status = document.createElement('span');
status.style.cssText = 'margin-left:10px;color:var(--chill-text)';
const btn = ChillButton.create({ text: 'Copy order id', variant: 'outline' });
btn.addEventListener('click', async () => {
  const ok = await ChillCopy.copy('ORD-2026-00418');
  status.textContent = ok ? 'Copied to clipboard' : 'Press Ctrl+C to copy manually';
});
root.append(btn, status);
cleanup(() => btn.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Three entry points',
            body:
                '- **`ChillCopy.copy(text)`** - a promise of `true` / `false`. Must be called from a user gesture (click, key press) for browsers to allow it.\n' +
                '- **`ChillCopy.create(options)`** - builds a `<button>`. Returns `{ element, copy(), reset(), destroy() }`; it is not attached for you.\n' +
                '- **`ChillCopy.init(target, options)`** - enhances existing elements (default selector `[data-chill-copy], [data-chill-copy-target]`). Returns `{ instances, destroy() }`.\n\n' +
                'The text source is resolved in this order: the `text` option (string or function), the `data-chill-copy` attribute, then `target` / `data-chill-copy-target` (the `value` of fields, otherwise `textContent`).',
        },
        {
            title: 'Existing buttons keep their content',
            body:
                'With `init()` a button that already has a text label gets a wrapped label that is swapped for `successLabel` and restored afterwards. ' +
                'An empty button gets `aria-label="Copy to clipboard"` and the icon-button class, unless it already has an `aria-label`. `destroy()` undoes these changes.\n\n' +
                '```html\n<button data-chill-copy-target="#snippet" aria-label="Copy code"></button>\n<pre id="snippet">npm i chillall</pre>\n```',
        },
        {
            title: 'Styling',
            body:
                'The button and tooltip are styled with CSS variables:\n\n' +
                '```css\n:root {\n  --chillcopy-bg: #fff;\n  --chillcopy-border: #d4d4d8;\n  --chillcopy-tip-bg: #18181b;\n  --chillcopy-tip-text: #fafafa;\n}\n```\n\n' +
                'While the success state is active the element has `.chillcopy-success` (or `.chillcopy-error`), so you can style it yourself.',
        },
    ],
    options: [
        { name: 'text', type: 'string | (el) => string', default: 'null', description: 'Text to copy, or a function evaluated on each click.' },
        { name: 'target', type: 'string | Element', default: 'null', description: 'Element or selector whose `value` (fields) or `textContent` is copied.' },
        { name: 'label', type: 'string', default: "'Copy'", description: '`create()` only: button label. An empty string makes an icon-only button.' },
        { name: 'ariaLabel', type: 'string', default: "'Copy to clipboard'", description: '`create()` only: accessible name for the icon-only button.' },
        { name: 'icon', type: 'boolean', default: 'true', description: '`create()` only: show the copy icon (it turns into a check on success).' },
        { name: 'successLabel', type: 'string', default: "'Copied!'", description: 'Text shown in the label, tooltip and live region on success.' },
        { name: 'errorLabel', type: 'string', default: "'Copy failed'", description: 'Text shown on failure.' },
        { name: 'duration', type: 'number', default: '1800', description: 'Milliseconds before the success / error state reverts.' },
        { name: 'tooltip', type: 'boolean', default: 'true', description: 'Show the floating tooltip bubble with the result.' },
        { name: 'onCopy', type: '(text, el) => void', default: 'null', description: 'Called after a successful copy.' },
        { name: 'onError', type: '(error, el) => void', default: 'null', description: 'Called when copying fails or there is nothing to copy.' },
    ],
    methods: [
        { signature: 'ChillCopy.copy(text)', on: 'static', description: 'Copy a string. Resolves `true` / `false`, never rejects.' },
        { signature: 'ChillCopy.create(options)', on: 'static', description: 'Build a copy button instance (`instance.element`).' },
        { signature: 'ChillCopy.init(target, options?)', on: 'static', description: 'Enhance existing elements. Returns `{ instances, destroy() }`.' },
        { signature: 'ChillCopy.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.copy()', description: 'Trigger a copy programmatically; resolves to a boolean.' },
        { signature: 'instance.reset()', description: 'Clear the success / error state immediately.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and tooltip (and the button itself when created by `create()`).' },
        { signature: 'instance.element', description: 'The button element.' },
    ],
    events: [
        { name: 'chillcopy:copy', payload: 'detail: { text }', description: 'CustomEvent dispatched on the element (and bubbling) after a successful copy.' },
        { name: 'chillcopy:error', payload: 'detail: { error }', description: 'CustomEvent dispatched when copying failed.' },
    ],
    cssVars: [
        { name: '--chillcopy-bg / --chillcopy-text', description: 'Button surface and text.' },
        { name: '--chillcopy-border / --chillcopy-hover', description: 'Button border and hover background.' },
        { name: '--chillcopy-tip-bg / --chillcopy-tip-text', description: 'Tooltip bubble colours.' },
    ],
    a11y: [
        'Buttons are native `<button type="button">`, so Enter and Space work.',
        'The result is announced through a polite `role="status"` live region; the visual tooltip is `aria-hidden`.',
        'Icon-only buttons need an accessible name: `init()` adds `aria-label="Copy to clipboard"` if missing, `create()` uses `ariaLabel`.',
        'Icons are `aria-hidden`.',
    ],
    tips: [
        'Browsers only allow clipboard writes during a user gesture; do not call `copy()` from a timer or on page load.',
        'The async Clipboard API needs HTTPS (or localhost). On plain HTTP ChillCopy transparently uses the `execCommand` fallback.',
        'In React, render a `<button data-chill-copy={value}>` and call `init()` in an effect, or use `ChillCopy.copy()` in your own onClick.',
        'Safe to import on the server: nothing touches `document` or `navigator` until you call a function.',
    ],
    related: ['button', 'tooltip', 'toast'],
    keywords: ['clipboard', 'copy to clipboard', 'copy button', 'snippet', 'share link'],
};

export default doc;
