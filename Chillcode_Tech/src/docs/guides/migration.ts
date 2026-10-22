import type { Guide } from '../types';

const guide: Guide = {
    id: 'migration',
    title: 'Upgrading to ChillAll 2.0',
    summary: 'Move from the separate ChillLib packages or 1.x to the single chillall bundle, with the breaking changes, before/after code and a checklist.',
    group: 'Guides',
    body: `ChillAll 2.0 puts every ChillLib component in one zero-dependency package, and a quality pass changed a handful of defaults to make things safer and more accessible. Most apps upgrade by changing imports and fixing a few places that relied on HTML strings.

**Who this is for:** projects using the separate packages (\`chillbutton\`, \`chilltable\`, \`chillalert\`, ...) or an older 1.x release.

## Step 1: switch to the single package

Replace the individual installs with one:

\`\`\`bash
npm uninstall chillalert chillbutton chilltable chillmodal   # whatever you had
npm install chillall
\`\`\`

Imports change from one package per component to named imports from \`chillall\`. Bundlers tree-shake, so importing \`ChillButton\` alone ships roughly 14 KB (3.8 KB gzip), not the whole library.

\`\`\`js
// before
import ChillButton from 'chillbutton';
import ChillTable from 'chilltable';

// after
import { ChillButton, ChillTable } from 'chillall';
// or everything, namespaced
import ChillAll from 'chillall';
ChillAll.get('calendar');   // lookup by key, name or global
\`\`\`

For a plain \`<script>\` page, load the bundle once. Every component is still a global:

\`\`\`html
<!-- before: one script per library -->
<script src="https://unpkg.com/chillbutton"></script>
<script src="https://unpkg.com/chilltable"></script>

<!-- after -->
<script src="https://unpkg.com/chillall"></script>
<script>
  ChillNotify.success({ message: 'Hello' });   // or ChillAll.Notify.success(...)
</script>
\`\`\`

The old per-component packages keep working on their own and \`chillall\` no longer depends on them. Do not load both for the same component on one page: pick one source per component.

## Step 2: HTML is opt-in

This is the change most likely to affect you. In 2.0, strings passed as titles, content, labels, tab / nav / sidebar / footer content, table cells, chart labels and icons are rendered as **text**. Markup now needs \`html: true\` (or an \`*Html\` option such as \`iconHtml\`, \`prevHtml\`, \`footerHtml\`). A DOM \`Node\` always works.

\`\`\`js
// before (1.x): the <b> was rendered as bold
ChillTabs.init('#tabs', { tabs: [{ id: 'a', label: 'A', content: '<b>Hello</b>' }] });

// after: opt in per tab, or globally with html: true
ChillTabs.init('#tabs', { tabs: [{ id: 'a', label: 'A', content: '<b>Hello</b>', html: true }] });

// after: or build the node yourself
const b = document.createElement('b');
b.textContent = 'Hello';
ChillTabs.init('#tabs', { tabs: [{ id: 'a', label: 'A', content: b }] });
\`\`\`

> **Warning:** the only exception is \`ChillModal\`: a string \`content\` is **still HTML** for backward compatibility. For data you do not control use \`text\`, or \`html: false\`. See [Safe by default (XSS)](/docs/guide/security).

The demo shows the same string with and without the opt-in:

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:14px';
const markup = 'Hello <b>bold</b>';

const a = document.createElement('div');
const b = document.createElement('div');
root.append(a, b);

const asText = ChillTabs.init(a, { tabs: [{ id: 't', label: 'Default (text)', content: markup }] });
const asHtml = ChillTabs.init(b, { tabs: [{ id: 'h', label: 'html: true', content: markup, html: true }] });

const note = document.createElement('div');
note.style.cssText = 'color:var(--chill-text);font-size:13px';
note.textContent = 'bold elements - text: ' + asText.container.querySelectorAll('b').length + ', html: true: ' + asHtml.container.querySelectorAll('b').length;
root.append(note);
cleanup(() => { asText.destroy(); asHtml.destroy(); });
\`\`\`

## Step 3: review the behaviour changes

Go through this list once and search your code for each component.

- **ChillClickOutside** listens to \`pointerdown\` (plus \`touchstart\` where needed) so one tap fires once. For the old behaviour pass \`events: ['click']\`.
- **ChillHotkey**
  - registering the same shortcut twice now keeps **both** handlers (use the unregister function that \`register()\` returns to remove one);
  - key auto-repeat is ignored unless \`allowRepeat: true\`;
  - shortcuts without ctrl / meta do not fire while the user types in an input, textarea, select or contenteditable, unless \`allowInInput: true\`.
- **ChillCommand**: \`mod+k\` means Cmd on macOS and Ctrl elsewhere. \`shortcut: 'k'\` is still treated as \`mod+k\`.
- **ChillFooter**: column headings are now \`<h3>\`. Update CSS or tests that targeted the old tag.
- **ChillAlert 1.2**: SSR-safe, accessible dialogs with a focus trap, Esc and overlay click resolve the promise, and \`closeAll()\` now exists. On the server, helpers resolve to harmless defaults instead of throwing.
- **ChillDropdown**: \`onSelect(value, el, itemData)\` now receives a third argument. Existing two-argument handlers keep working.
- **ChillSidebar**: string \`footer\` is text; use \`footerHtml\` (or \`html: true\`) for markup.

The demo shows two of these hotkey changes by sending key presses to the page:

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const input = document.createElement('input');
input.setAttribute('aria-label', 'Type here');
input.placeholder = 'Focus is in an input';
root.append(input);

let both = 0, typing = 0, forced = 0;
const offs = [
  ChillHotkey.register('j', () => both++),
  ChillHotkey.register('j', () => both++),
  ChillHotkey.register('k', () => typing++),
  ChillHotkey.register('l', () => forced++, { allowInInput: true })
];
const press = (target, key) => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));

press(document.body, 'j');   // two handlers registered for the same key: both run
press(input, 'k');           // plain key while typing: ignored
press(input, 'l');           // allowInInput: true: runs

const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px';
out.textContent = 'handlers run for "j" on the page: ' + both + '\\n"k" typed in an input: ' + typing + ' (ignored)\\n"l" with allowInInput: ' + forced;
root.append(out);
cleanup(() => offs.forEach((off) => off()));
\`\`\`

## Step 4: check your stacking order

Overlays now use a documented z-index scale. If you set your own \`z-index\` on top of ChillAll UI, compare it with this list:

- modal 10000, drawer 10000+, lightbox 10001
- toast 10002
- popover and context menu 10003
- tooltip 10004
- tour 10005-10006
- confetti 10007
- alert 99999

## Step 5: theming and SSR

- Dark mode follows \`<html data-theme>\`, \`class="dark"\` and the OS setting. Add \`ChillTheme.noFlashScript()\` to \`<head>\` to avoid a flash. See [Theming & dark mode](/docs/guide/theming).
- Importing \`chillall\` is safe on the server (Next.js, Nuxt). Call components from effects or event handlers, not at module top level.

\`\`\`tsx
'use client';
import { ChillAlert } from 'chillall';

export default function Save() {
  return <button onClick={() => ChillAlert.toast({ title: 'Saved', icon: 'success' })}>Save</button>;
}
\`\`\`

## Upgrade checklist

1. Replace per-component installs with \`chillall\`; update imports or the script tag.
2. Search for strings containing \`<\` passed to titles, content, labels, cells, icons: add \`html: true\`, use \`*Html\` options, or pass Nodes.
3. Check every \`ChillModal.open({ content: ... })\` that receives user data and switch it to \`text\` or \`html: false\`.
4. Review \`ChillClickOutside\` and \`ChillHotkey\` usage against the notes above.
5. Update selectors and tests that depend on the footer heading level.
6. Compare your own \`z-index\` values with the scale.
7. Test both themes and keyboard navigation; run your usual end-to-end suite.

## Next steps

- [Safe by default (XSS)](/docs/guide/security) explains the opt-in rules in depth
- [Accessibility](/docs/guide/accessibility) for what you get with the quality pass
- Component pages list every option, including the new ones: [Hotkey](/docs/hotkey), [Command](/docs/command), [Alert](/docs/alert)
`,
};

export default guide;
