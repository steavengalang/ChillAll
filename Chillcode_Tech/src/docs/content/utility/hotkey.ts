import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'hotkey',
    global: 'ChillHotkey',
    category: 'utility',
    title: 'Hotkey',
    summary: 'Keyboard shortcuts with modifiers, key sequences, scoped hubs and smart handling of typing.',
    style: 'static',
    description:
        'ChillHotkey registers keyboard shortcuts such as `mod+k`, `shift+/` or the two-step sequence `g i`. `mod` means Cmd on Apple platforms and Ctrl everywhere else, ' +
        'so one string works on every OS.\n\n' +
        'It avoids the usual traps: shortcuts without Ctrl / Cmd are ignored while the user types in an input, textarea, select or contenteditable, IME composition and key auto-repeat are skipped, ' +
        'and the document listener is attached only while something is registered. Use `create({ target })` for an independent hub scoped to one element.',
    features: [
        'Cross-platform `mod`, plus `ctrl`, `alt`, `shift` and `meta` with friendly aliases (`cmd`, `esc`, `up`, ...)',
        'Key sequences like `g i` with a configurable timeout between presses',
        'Typing-safe: plain shortcuts never fire inside form fields unless `allowInInput` is set',
        'Scoped hubs for a panel, modal or widget, destroyed independently',
        'Introspection: `getAll(true)`, `isPressed()`, `parseShortcut()`, `pause()` / `resume()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Register a shortcut',
            description: 'Focus the box below and press `mod+s` or `shift+/`. `register()` returns a function that removes just that handler. The hub is scoped to the box so the docs page is not affected.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const panel = document.createElement('div');
panel.tabIndex = 0;
panel.textContent = 'Click here, then press Ctrl/Cmd+S or ?';
panel.style.cssText = 'padding:20px;border:1px dashed var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);outline-offset:2px';
const out = document.createElement('div');
out.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px';
out.textContent = 'Waiting for a shortcut...';
root.append(panel, out);

const hub = ChillHotkey.create({ target: panel });
hub.register('mod+s', (e, shortcut) => (out.textContent = 'Saved! (' + shortcut + ')'));
hub.register('shift+/', () => (out.textContent = 'Help requested (?)'));
cleanup(() => hub.destroy());`,
        },
        {
            id: 'sequences',
            title: 'Key sequences',
            description: 'Space-separated tokens form a sequence. Press `g` then `i` (or `g` then `d`) within the timeout, like in Gmail or GitHub.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const panel = document.createElement('div');
panel.tabIndex = 0;
panel.style.cssText = 'padding:20px;border:1px dashed var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text)';
panel.textContent = 'Focus me and type "g i" (inbox), "g d" (drafts) or "g shift+s" (settings)';
const where = document.createElement('div');
where.style.cssText = 'color:var(--chill-text);font-size:14px';
where.textContent = 'You are in: Home';
root.append(panel, where);

const hub = ChillHotkey.create({ target: panel, sequenceTimeout: 1200 });
hub.register('g i', () => (where.textContent = 'You are in: Inbox'));
hub.register('g d', () => (where.textContent = 'You are in: Drafts'));
hub.register('g shift+s', () => (where.textContent = 'You are in: Settings'));
cleanup(() => hub.destroy());`,
        },
        {
            id: 'inputs',
            title: 'Typing in inputs',
            description: 'A plain shortcut like `?` is ignored while typing, so it never steals characters. Add `allowInInput: true` for keys such as Escape. `mod` shortcuts always fire.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Type here: ? is ignored, Esc clears the field';
input.setAttribute('aria-label', 'Demo field');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding-left:20px;color:var(--chill-text);font-size:13px;min-height:50px';
wrap.append(input, log);
root.append(wrap);

const add = (t) => log.prepend(Object.assign(document.createElement('li'), { textContent: t }));
const hub = ChillHotkey.create({ target: wrap });
hub.register('?', () => add('"?" fired (not typing)'));
hub.register('esc', () => { input.value = ''; add('Esc cleared the field'); }, { allowInInput: true });
hub.register('mod+enter', () => add('mod+Enter fired while typing'));
cleanup(() => hub.destroy());`,
        },
        {
            id: 'global-registry',
            title: 'Global shortcuts and a help list',
            description: 'The shared `ChillHotkey` hub listens on the document. `getAll(true)` returns each registered shortcut with its `description`, ideal for a cheat sheet. `pause()` suspends everything.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const list = document.createElement('div');
list.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:14px;line-height:1.8';
const hit = document.createElement('div');
hit.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px';
hit.textContent = 'Press Alt+1, Alt+2 or Alt+3 anywhere on the page';
root.append(list, hit);

const offs = [
  ChillHotkey.register('alt+1', () => (hit.textContent = 'Went to Overview'), { description: 'Go to overview' }),
  ChillHotkey.register('alt+2', () => (hit.textContent = 'Went to Reports'), { description: 'Go to reports' }),
  ChillHotkey.register('alt+3', () => (hit.textContent = 'Went to Billing'), { description: 'Go to billing' }),
];
ChillHotkey.getAll(true).forEach((s) => {
  const row = document.createElement('div');
  const kbd = document.createElement('kbd');
  kbd.textContent = s.shortcut;
  kbd.style.cssText = 'border:1px solid var(--chill-border);border-radius:4px;padding:1px 6px;margin-right:8px;font-size:12px';
  row.append(kbd, s.description);
  list.append(row);
});
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px';
row.append(
  ChillButton.create({ text: 'Pause', size: 'sm', variant: 'outline', onClick: () => { ChillHotkey.pause(); hit.textContent = 'Paused'; } }),
  ChillButton.create({ text: 'Resume', size: 'sm', variant: 'outline', onClick: () => { ChillHotkey.resume(); hit.textContent = 'Resumed'; } }),
);
root.append(row);
cleanup(() => { ChillHotkey.resume(); offs.forEach((off) => off()); });`,
            height: 220,
        },
        {
            id: 'parse-and-match',
            title: 'Parse and test shortcuts',
            description: '`parseShortcut()` shows how a string is understood on this platform, and `isPressed(shortcut, event)` tests a keyboard event yourself. Press keys in the box.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Press a key combination here';
input.setAttribute('aria-label', 'Key tester');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
out.textContent = 'parseShortcut("mod+shift+k") ->\\n' + JSON.stringify(ChillHotkey.parseShortcut('mod+shift+k')) + '\\n\\nisMac() -> ' + ChillHotkey.isMac();
root.append(input, out);

const onKey = (e) => {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
  out.textContent = 'key: ' + e.key + '\\nisPressed("mod+shift+k") -> ' + ChillHotkey.isPressed('mod+shift+k', e) + '\\nisPressed("alt+x") -> ' + ChillHotkey.isPressed('alt+x', e);
};
input.addEventListener('keydown', onKey);
cleanup(() => input.removeEventListener('keydown', onKey));`,
            height: 200,
        },
    ],
    guides: [
        {
            title: 'Shortcut syntax',
            body:
                'A shortcut is modifiers plus one key joined with `+`: `ctrl+shift+p`, `alt+left`, `mod+enter`.\n\n' +
                '- **Modifiers:** `ctrl` (`control`), `alt` (`option`, `opt`), `shift`, `meta` (`cmd`, `command`, `win`, `super`) and `mod`.\n' +
                '- **Keys:** letters, digits, `f1`-`f12`, `esc`, `enter`, `space`, `tab`, `backspace`, `delete`, `up` / `down` / `left` / `right`, `home`, `end`, `pageup`, `pagedown`, `plus`, or any single character.\n' +
                '- **Symbol keys:** `?` and `shift+/` match the same press, because shift is ignored for symbol keys.\n' +
                '- **Sequences:** separate strokes with spaces (`g i`, `g shift+d`). Only plain or shift strokes are allowed in a sequence.\n\n' +
                'Registering a shortcut with no usable key (for example `"ctrl"`) throws, and so does a non-function callback.',
        },
        {
            title: 'Scoped hubs and cleanup',
            body:
                'The default `ChillHotkey` hub listens on the document. For a component with its own lifecycle, create a private hub:\n\n' +
                '```js\nconst hub = ChillHotkey.create({ target: panelEl, sequenceTimeout: 800 });\nhub.register(\'ctrl+s\', save);\n// later\nhub.destroy();\n```\n\n' +
                'A target hub only hears keys pressed while focus is inside that element, so give it a `tabindex` if it is not otherwise focusable. ' +
                'Always call the unregister function (or `destroy()`) on teardown. Handlers receive `(event, shortcut)` and `preventDefault()` is called for you unless you pass `preventDefault: false`.',
        },
    ],
    options: [
        { name: 'preventDefault', type: 'boolean', default: 'true', description: 'register(): call `event.preventDefault()` when the shortcut fires.' },
        { name: 'stopPropagation', type: 'boolean', default: 'false', description: 'register(): stop the event from bubbling.' },
        { name: 'allowInInput', type: 'boolean', default: 'false', description: 'register(): also fire while typing in an input / textarea / select / contenteditable. Shortcuts with ctrl or meta always fire.' },
        { name: 'allowRepeat', type: 'boolean', default: 'false', description: 'register(): fire again while the key is held down.' },
        { name: 'enabled', type: 'boolean', default: 'true', description: 'register(): set `false` to keep the registration but skip it.' },
        { name: 'description', type: 'string', default: "''", description: 'register(): text returned by `getAll(true)`.' },
        { name: 'target', type: 'EventTarget', default: 'document', description: 'create(): element the hub listens on.' },
        { name: 'sequenceTimeout', type: 'number', default: '1000', description: 'create(): maximum milliseconds between presses of a sequence.' },
        { name: 'platform', type: "'auto' | 'mac' | 'other'", default: "'auto'", description: 'create(): decides what `mod` means. Auto-detects from the browser.' },
    ],
    methods: [
        { signature: 'ChillHotkey.register(shortcut, callback, options?)', on: 'static', description: 'Register `callback(event, shortcut)`. Returns a function that unregisters this handler.' },
        { signature: 'ChillHotkey.unregister(shortcut)', on: 'static', description: 'Remove every handler registered for that shortcut.' },
        { signature: 'ChillHotkey.unregisterAll()', on: 'static', description: 'Remove all handlers and detach the document listener.' },
        { signature: 'ChillHotkey.getAll(withInfo?)', on: 'static', description: 'Registered shortcut strings, or `{ shortcut, description }` objects when `withInfo` is true.' },
        { signature: 'ChillHotkey.isPressed(shortcut, event)', on: 'static', description: 'Does this keyboard event match the shortcut?' },
        { signature: 'ChillHotkey.parseShortcut(shortcut)', on: 'static', description: 'Parse into `{ key, mods }` (sequences add `sequence: [...]`).' },
        { signature: 'ChillHotkey.pause() / resume()', on: 'static', description: 'Temporarily ignore or restore every shortcut on the shared hub.' },
        { signature: 'ChillHotkey.isMac()', on: 'static', description: '`true` on Apple platforms (where `mod` means Cmd).' },
        { signature: 'ChillHotkey.isEditable(element)', on: 'static', description: '`true` if the element accepts typed text.' },
        { signature: 'ChillHotkey.create(options)', on: 'static', description: 'Make an independent hub with the same API (`register`, `unregister`, `getAll`, `pause`, `destroy`...).' },
        { signature: 'ChillHotkey.destroy()', on: 'static', description: 'Unregister everything on the shared hub.' },
        { signature: 'hub.destroy()', description: 'Unregister all handlers and make the hub inert. Later `register()` calls do nothing.' },
    ],
    a11y: [
        'Single-key shortcuts can conflict with assistive technology: offer a way to turn them off, or use modifiers.',
        'Plain shortcuts are ignored while typing, so screen reader and dictation users keep normal text entry.',
        'Show shortcuts in the UI (tooltips, a help dialog fed by `getAll(true)`) so they can be discovered.',
        'IME composition is ignored, which protects users typing in languages that rely on input methods.',
    ],
    tips: [
        'Use `mod` instead of `ctrl` or `cmd` so one registration is correct on every platform.',
        'The shared hub is a module-level singleton: in single-page apps always call the returned unregister function on unmount.',
        'Event handlers run in registration order; a handler that throws is logged and does not stop the others.',
        'Browser-reserved combos (such as Ctrl+T or Ctrl+W) cannot be intercepted.',
    ],
    related: ['command', 'events', 'focustrap'],
    keywords: ['keyboard', 'shortcut', 'keybinding', 'accelerator', 'key sequence', 'keydown'],
};

export default doc;
