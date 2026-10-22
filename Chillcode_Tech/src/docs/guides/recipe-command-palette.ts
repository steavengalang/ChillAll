import type { Guide } from '../types';

const guide: Guide = {
    id: 'recipe-command-palette',
    title: 'Recipe: command palette & shortcuts',
    summary: 'A Cmd/Ctrl+K command palette with ChillCommand, shortcuts and key sequences with ChillHotkey, ChillKbd hints and a theme command.',
    group: 'Recipes',
    body: `**Goal:** a keyboard-first app shell: press \`mod+k\` to open a searchable command palette, press \`g\` then \`i\` to jump to the inbox, press \`?\` for a shortcut cheat-sheet, and run "Toggle theme" from the palette.

**You will use:** [ChillCommand](/docs/command), [ChillHotkey](/docs/hotkey), [ChillKbd](/docs/kbd) and [ChillTheme](/docs/theme).

## How the pieces fit

- **ChillCommand** is the palette: fuzzy search over \`commands\`, grouped results, full keyboard support, focus moved into the dialog and restored on close.
- **ChillHotkey** is the shortcut registry. \`mod\` means Cmd on macOS and Ctrl elsewhere. Space-separated tokens are sequences (\`'g i'\`). Shortcuts without ctrl/meta are ignored while you type in an input, so \`?\` and \`g i\` never hijack typing.
- **ChillKbd** draws OS-aware key chips (\`⌘ K\` on a Mac, \`Ctrl + K\` elsewhere) so your hints always match the user's keyboard.

The trick is to describe each command once, with its keys, then derive everything else from that list.

## Step 1: describe the commands once

\`\`\`js
const commands = [
  { id: 'inbox',    label: 'Go to Inbox',     group: 'Navigate', keys: 'g i', action: () => go('Inbox') },
  { id: 'settings', label: 'Go to Settings',  group: 'Navigate', keys: 'g s', action: () => go('Settings') },
  { id: 'theme',    label: 'Toggle theme',    group: 'View',     keys: 'mod+shift+l', keywords: ['dark', 'light'], action: () => ChillTheme.toggle() },
  { id: 'help',     label: 'Show shortcuts',  group: 'Help',     keys: 'shift+/', action: showHelp }
];
\`\`\`

\`keywords\` make a command findable by words that are not in its label (type "dark" to find Toggle theme).

## Step 2: create the palette

\`\`\`js
const palette = ChillCommand.init({
  shortcut: false,                       // we register the opener ourselves, see step 3
  placeholder: 'Type a command...',
  commands: commands.map((c) => ({ ...c, shortcut: c.keys }))
});
\`\`\`

\`ChillCommand\` can listen for its own opener (\`shortcut: 'mod+k'\`, the default is \`'k'\` which means \`mod+k\`). Setting \`shortcut: false\` and using \`ChillHotkey\` instead lets all your shortcuts live in one registry. A command's \`shortcut\` is only a label shown on the right of its row. It does not register anything by itself.

## Step 3: register the shortcuts

\`ChillHotkey.register(keys, handler, options)\` returns a function that removes just that handler.

\`\`\`js
const offs = [
  ChillHotkey.register('mod+k', () => palette.toggle()),          // works even while typing (it has ctrl/meta)
  ...commands.map((c) => ChillHotkey.register(c.keys, () => c.action()))
];
// later: offs.forEach((off) => off());
\`\`\`

Notes from the shortcut rules:

- Shortcuts with \`mod\`, \`ctrl\` or \`meta\` always fire, including inside inputs. Plain ones (\`g i\`, \`?\`) do not, unless you pass \`{ allowInInput: true }\`.
- \`shift+/\` is the \`?\` key, and shift is ignored for symbol keys.
- Sequences wait at most one second between keys (\`sequenceTimeout\` on \`ChillHotkey.create()\`).
- Registering the same shortcut twice keeps both handlers.

> **Warning:** do not reuse shortcuts the browser owns (\`mod+t\`, \`mod+w\`, \`mod+l\`). On this docs site \`mod+k\` already opens the site search, so the demo below uses \`mod+/\` for the palette. In your own app use \`mod+k\`.

## Step 4: show hints with ChillKbd

\`ChillKbd.create('mod+shift+l')\` returns an element you can append anywhere. \`ChillKbd.format('mod+k')\` returns a string for tooltips and \`aria-keyshortcuts\`. Chips include visually hidden full key names so screen readers do not read bare symbols.

## Step 5: the working demo

Click into the preview area first, then try: \`mod+/\` (Ctrl or Cmd plus slash) to open the palette, \`g\` then \`i\`, \`g\` then \`s\`, \`shift+/\`. Pick "Toggle theme" in the palette. The demo restores your theme when it is removed.

\`\`\`live
const prevTheme = ChillTheme.getTheme();
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';

const screenEl = document.createElement('div');
screenEl.style.cssText = 'padding:14px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:14px';
const setScreen = (name) => { screenEl.textContent = 'Current page: ' + name; };
setScreen('Home');

const help = document.createElement('ul');
help.hidden = true;
help.style.cssText = 'margin:0;padding:12px 16px;list-style:none;border:1px solid var(--chill-border);border-radius:10px;color:var(--chill-text);font-size:13px;display:flex;flex-direction:column;gap:8px';

let palette;
const commands = [
  { id: 'inbox', label: 'Go to Inbox', group: 'Navigate', keys: 'g i', action: () => setScreen('Inbox') },
  { id: 'settings', label: 'Go to Settings', group: 'Navigate', keys: 'g s', action: () => setScreen('Settings') },
  { id: 'theme', label: 'Toggle theme', group: 'View', keys: 'mod+shift+l', keywords: ['dark', 'light', 'appearance'], action: () => ChillTheme.toggle() },
  { id: 'help', label: 'Show shortcuts', group: 'Help', keys: 'shift+/', action: () => { help.hidden = !help.hidden; } }
];

palette = ChillCommand.init({
  shortcut: false,
  placeholder: 'Type a command...',
  commands: commands.map((c) => ({ ...c, shortcut: c.keys }))
});

const offs = [
  ChillHotkey.register('mod+/', () => palette.toggle()),
  ...commands.map((c) => ChillHotkey.register(c.keys, () => c.action()))
];

// cheat-sheet rows with OS-aware key chips
[['mod+/', 'Open the palette']].concat(commands.map((c) => [c.keys, c.label])).forEach(([keys, label]) => {
  const li = document.createElement('li');
  li.style.cssText = 'display:flex;justify-content:space-between;gap:12px;align-items:center';
  const text = document.createElement('span');
  text.textContent = label;
  li.append(text, ChillKbd.create(keys, { size: 'sm' }));
  help.append(li);
});

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
const openBtn = ChillButton.create({ text: 'Open palette', onClick: () => palette.open() });
row.append(openBtn, 'or press', ChillKbd.create('mod+/'));

root.append(row, screenEl, help);
cleanup(() => {
  offs.forEach((off) => off());
  palette.destroy();
  openBtn.destroy();
  ChillTheme.setTheme(prevTheme, { persist: false });
});
\`\`\`

## Step 6: show shortcut hints on controls

A shortcut nobody can discover is a shortcut nobody uses. Put the keys next to the control, and expose them to assistive technology with \`aria-keyshortcuts\`. This demo forces the Mac and non-Mac rendering side by side with the \`platform\` option so you can see what each user would get.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const mk = (platform) => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:10px;align-items:center;color:var(--chill-text);font-size:13px';
  const btn = ChillButton.create({ text: 'Search', variant: 'outline', size: 'sm' });
  btn.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
  row.append(btn, ChillKbd.create('mod+k', { platform }), platform === 'mac' ? 'macOS' : 'Windows / Linux');
  return row;
};
const format = document.createElement('div');
format.style.cssText = 'color:var(--chill-text);font-size:13px';
format.textContent = 'ChillKbd.format("mod+shift+p") on this device: ' + ChillKbd.format('mod+shift+p');
root.append(mk('mac'), mk('other'), format);
\`\`\`

## Result and tips

- One \`commands\` list drives the palette rows, the shortcuts and the cheat-sheet, so they can never disagree.
- The palette is accessible out of the box (combobox + listbox, focus trap, Esc closes, focus returns).
- Always provide a clickable way to open the palette; keyboard shortcuts are an accelerator, not the only path.
- Remember to unregister hotkeys (\`off()\`) and \`palette.destroy()\` when the screen goes away.
- Mac users type \`⌘\`, everyone else \`Ctrl\`: always say \`mod\` in code and let ChillKbd show the right chip.

## Next steps

- [Command reference](/docs/command) for \`onQuery\`, \`setCommands()\` and the fuzzy helper
- [Hotkey reference](/docs/hotkey) for scoped hubs (\`ChillHotkey.create({ target })\`) and \`pause()\` / \`resume()\`
- [Accessibility](/docs/guide/accessibility) for the keyboard map of every component
`,
};

export default guide;
