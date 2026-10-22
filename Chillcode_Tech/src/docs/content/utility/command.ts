import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'command',
    global: 'ChillCommand',
    category: 'utility',
    title: 'Command Palette',
    summary: 'Cmd/Ctrl+K command palette with fuzzy search, groups, shortcuts hints and full keyboard control.',
    style: 'create',
    description:
        'ChillCommand is a searchable command palette overlay in the style of Spotlight or VS Code. Give it a list of commands, and it handles the global hotkey, ' +
        'fuzzy matching with highlighted characters, grouping and keyboard navigation.\n\n' +
        'Labels, groups and shortcut hints are always rendered as **text**. String icons are text too unless you opt in with `html: true`; DOM node icons are always allowed. ' +
        'While open, focus is held inside the dialog and restored to the previously focused element on close.',
    features: [
        'Fuzzy subsequence search over label, keywords and group, with matched characters highlighted',
        'Grouped results, per-command icons, disabled items and platform-aware shortcut hints (`mod+n` shows as Cmd or Ctrl)',
        'Global hotkey (`mod+k` by default) or fully programmatic control with `open()` / `close()`',
        'Combobox + listbox ARIA with `aria-activedescendant`, focus trap and focus restore',
        'Exposes the matcher as `ChillCommand.fuzzy()` for your own lists',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Open a palette',
            description: 'Define commands and open the palette from a button. Type to filter, use Up/Down and Enter, Esc to close. The global hotkey is disabled here so it does not collide with the docs page.',
            manual: true,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px;align-items:flex-start';
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-size:13px';
status.textContent = 'Last command: none';
const palette = ChillCommand.init({
  shortcut: false,
  commands: [
    { id: 'new', label: 'New file', icon: '+', shortcut: 'mod+n', action: () => (status.textContent = 'Last command: New file') },
    { id: 'open', label: 'Open project', icon: 'O', shortcut: 'mod+o', action: () => (status.textContent = 'Last command: Open project') },
    { id: 'save', label: 'Save all', icon: 'S', shortcut: 'mod+shift+s', action: () => (status.textContent = 'Last command: Save all') },
    { id: 'close', label: 'Close window', icon: 'X', action: () => (status.textContent = 'Last command: Close window') },
  ],
});
root.append(ChillButton.create({ text: 'Open command palette', onClick: () => palette.open() }), status);
cleanup(() => palette.destroy());`,
        },
        {
            id: 'groups-keywords',
            title: 'Groups, keywords and disabled items',
            description: '`group` creates headings, `keywords` make a command findable by other words (try typing "dark" or "bin"), and `disabled` items are shown but cannot be run.',
            manual: true,
            code: `const out = document.createElement('div');
out.style.cssText = 'color:var(--chill-text);font-size:13px;margin-top:12px';
out.textContent = 'onSelect: waiting...';
const palette = ChillCommand.init({
  shortcut: false,
  placeholder: 'Search actions...',
  emptyText: 'Nothing matches that query',
  commands: [
    { id: 'theme', label: 'Switch appearance', group: 'View', keywords: ['dark', 'light', 'mode'], shortcut: 'mod+shift+l' },
    { id: 'zoom', label: 'Zoom in', group: 'View', shortcut: 'mod+=' },
    { id: 'trash', label: 'Empty trash', group: 'File', keywords: ['bin', 'delete'] },
    { id: 'export', label: 'Export as PDF', group: 'File', disabled: true },
    { id: 'help', label: 'Open help', group: 'Help', shortcut: 'F1' },
  ],
  onSelect: (cmd) => (out.textContent = 'onSelect: ' + cmd.id + ' (' + cmd.label + ')'),
});
root.append(ChillButton.create({ text: 'Open grouped palette', variant: 'secondary', onClick: () => palette.open() }), out);
cleanup(() => palette.destroy());`,
        },
        {
            id: 'fuzzy-helper',
            title: 'The fuzzy matcher on its own',
            description: '`ChillCommand.fuzzy(query, text)` returns `{ score, indices }` or `null`. Use it to highlight matches in any list. This one is inline, no overlay.',
            code: `const items = ['Create new project', 'Open recent files', 'Toggle sidebar', 'Go to line', 'Git: commit all', 'Format document'];
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const input = document.createElement('input');
input.type = 'text';
input.value = 'tgl';
input.placeholder = 'Type a few letters...';
input.setAttribute('aria-label', 'Fuzzy query');
input.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font:inherit';
const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;color:var(--chill-text);font-size:14px';
root.append(input, list);

const render = () => {
  list.textContent = '';
  const hits = items
    .map((text) => ({ text, hit: ChillCommand.fuzzy(input.value, text) }))
    .filter((r) => r.hit)
    .sort((a, b) => b.hit.score - a.hit.score);
  hits.forEach(({ text, hit }) => {
    const li = document.createElement('li');
    [...text].forEach((ch, i) => {
      const s = document.createElement(hit.indices.includes(i) ? 'strong' : 'span');
      s.textContent = ch;
      if (hit.indices.includes(i)) s.style.color = '#3b82f6';
      li.append(s);
    });
    const score = document.createElement('small');
    score.style.cssText = 'opacity:.6;margin-left:8px';
    score.textContent = 'score ' + hit.score.toFixed(1);
    li.append(score);
    list.append(li);
  });
  if (!hits.length) list.textContent = 'No match';
};
input.addEventListener('input', render);
render();`,
            height: 230,
        },
        {
            id: 'dynamic',
            title: 'Dynamic commands and callbacks',
            description: 'Use `setCommands()` to swap the list at any time and `onOpen` / `onClose` / `onQuery` to react. Here opening the palette loads fresh "recent documents".',
            manual: true,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:8px;align-items:flex-start';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding-left:20px;color:var(--chill-text);font-size:13px;min-height:60px';
const docs = ['Q3 report.docx', 'Roadmap.xlsx', 'Launch plan.pptx'];
let n = 0;
const palette = ChillCommand.init({
  shortcut: false,
  closeOnSelect: false,
  commands: [],
  onOpen: (p) => {
    n++;
    p.setCommands(docs.map((name, i) => ({ id: 'doc' + i, label: n + '. ' + name, group: 'Recent', action: () => log.prepend(Object.assign(document.createElement('li'), { textContent: 'opened ' + name })) })));
    log.prepend(Object.assign(document.createElement('li'), { textContent: 'onOpen -> ' + p.getCommands().length + ' commands' }));
  },
  onQuery: (q) => log.prepend(Object.assign(document.createElement('li'), { textContent: 'onQuery "' + q + '"' })),
  onClose: () => log.prepend(Object.assign(document.createElement('li'), { textContent: 'onClose' })),
});
root.append(ChillButton.create({ text: 'Open recent documents', onClick: () => palette.open() }), log);
cleanup(() => palette.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Wiring it up',
            body:
                '`ChillCommand.init(options)` builds the overlay once (appended to `document.body`) and returns an instance. Keep the instance around, and call `destroy()` when your view unmounts.\n\n' +
                '```js\nconst palette = ChillCommand.init({\n  commands: [\n    { id: \'theme\', label: \'Toggle theme\', icon: \'T\', action: () => ChillTheme.toggle() },\n  ],\n  shortcut: \'mod+k\',\n});\n```\n\n' +
                '`shortcut` accepts a combo such as `mod+k` or `mod+shift+p`, where `mod` is Cmd on Apple platforms and Ctrl elsewhere. A single letter like `k` is treated as `mod+k`. Pass `false` to disable the hotkey and open it yourself.',
        },
        {
            title: 'Command shape and selection',
            body:
                'Each command needs a `label`; `id`, `group`, `icon`, `shortcut`, `keywords` and `disabled` are optional. The `shortcut` on a command is only a **hint** shown to the user (formatted per platform), ' +
                'it does not register a hotkey. Pair it with `ChillHotkey.register()` if you want the combo to work globally.\n\n' +
                'On selection the palette closes (unless `closeOnSelect: false`), then runs `command.action(command)` and `onSelect(command, instance)`. Errors thrown inside them are caught and logged, so one bad command cannot break the palette.',
        },
    ],
    options: [
        { name: 'commands', type: 'Command[]', default: '[]', description: 'The searchable list.' },
        { name: 'commands[].id', type: 'string', default: '-', description: 'Identifier you can use in `onSelect`.' },
        { name: 'commands[].label', type: 'string', default: "''", description: 'Text that is searched and displayed (always text).' },
        { name: 'commands[].group', type: 'string', default: "'Commands'", description: 'Heading the command is listed under. Group names are also searchable.' },
        { name: 'commands[].icon', type: 'string | Node', default: 'null', description: 'Text, or a DOM node. Strings are inserted as HTML only when `html: true`.' },
        { name: 'commands[].shortcut', type: 'string', default: 'null', description: 'Hint shown on the right, e.g. `mod+shift+p` becomes Ctrl+Shift+P or the Cmd symbols.' },
        { name: 'commands[].keywords', type: 'string | string[]', default: '[]', description: 'Extra search terms (weighted below label matches).' },
        { name: 'commands[].disabled', type: 'boolean', default: 'false', description: 'Shown dimmed with `aria-disabled`; cannot be selected.' },
        { name: 'commands[].action', type: '(command) => void', default: 'null', description: 'Runs when the command is chosen.' },
        { name: 'placeholder', type: 'string', default: "'Type a command...'", description: 'Input placeholder.' },
        { name: 'shortcut', type: 'string | false', default: "'k'", description: 'Global toggle hotkey; `false` disables it. A lone key means `mod+<key>`.' },
        { name: 'emptyText', type: 'string', default: "'No commands found'", description: 'Message when nothing matches.' },
        { name: 'label', type: 'string', default: "'Command palette'", description: 'Accessible name of the dialog and input.' },
        { name: 'footer', type: 'boolean', default: 'true', description: 'Show the key hints bar.' },
        { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Close the palette after a command runs.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Insert string icons as HTML. Only enable for trusted markup.' },
        { name: 'onSelect', type: '(command, instance) => void', default: 'null', description: 'Called after a command is chosen.' },
        { name: 'onOpen / onClose', type: '(instance) => void', default: 'null', description: 'Called when the palette opens or closes.' },
        { name: 'onQuery', type: '(query, instance) => void', default: 'null', description: 'Called on every input change.' },
    ],
    methods: [
        { signature: 'ChillCommand.init(options)', on: 'static', description: 'Create a palette and return its instance.' },
        { signature: 'ChillCommand.fuzzy(query, text)', on: 'static', description: 'Fuzzy subsequence match. Returns `{ score, indices }` or `null` when `query` is not a subsequence of `text`.' },
        { signature: 'ChillCommand.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.open(query?)', description: 'Open the palette, optionally pre-filled with a query.' },
        { signature: 'instance.close()', description: 'Close it and restore focus to the previous element.' },
        { signature: 'instance.toggle()', description: 'Open when closed, close when open.' },
        { signature: 'instance.setCommands(list)', description: 'Replace the command list and re-render.' },
        { signature: 'instance.getCommands()', description: 'A copy of the current command array.' },
        { signature: 'instance.isOpen', description: 'Boolean property, `true` while open.' },
        { signature: 'instance.destroy()', description: 'Close, remove listeners (including the global hotkey) and remove the DOM.' },
    ],
    cssVars: [
        { name: '--chillcmd-bg / --chillcmd-text', description: 'Dialog surface and text colour.' },
        { name: '--chillcmd-border', description: 'Dialog and divider border colour.' },
        { name: '--chillcmd-active / --chillcmd-active-bg', description: 'Active row outline and background.' },
        { name: '--chillcmd-mark', description: 'Colour of highlighted matched characters.' },
        { name: '--chillcmd-overlay', description: 'Backdrop colour.' },
    ],
    a11y: [
        'Up / Down move the selection, Home / End jump to first / last, PageUp / PageDown move by 5, Enter runs, Esc closes.',
        'Dialog uses `role="dialog"` with `aria-modal`; the input is a `combobox` controlling a `listbox` of `option`s, tracked with `aria-activedescendant`.',
        'Results are announced through a polite live region ("3 results" / the empty text).',
        'Tab is kept inside the input (focus trap); the previously focused element regains focus on close.',
        'Transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Opening the palette must happen in the browser; `init()` touches `document.body`, so call it in an effect on SSR frameworks.',
        'Command `shortcut` values are display-only. Register the real hotkeys with ChillHotkey.',
        'If another element handles `Ctrl+K` and calls `preventDefault()`, the palette ignores that keypress.',
        'Call `setCommands()` instead of re-creating the palette when your list changes.',
    ],
    related: ['hotkey', 'modal', 'search', 'theme'],
    keywords: ['command palette', 'cmdk', 'spotlight', 'quick actions', 'fuzzy search', 'launcher'],
};

export default doc;
