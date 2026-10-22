import type { Guide } from '../types';

const guide: Guide = {
    id: 'accessibility',
    title: 'Accessibility',
    summary: 'What ChillAll guarantees for keyboard and screen reader users, a keyboard cheat-sheet, and how to label and test your own UI.',
    group: 'Guides',
    body: `ChillAll components are built to the WAI-ARIA authoring patterns, so a lot of accessibility work is already done when you drop one in. This guide lists what you get for free, the keyboard shortcuts of the interactive components, and the few things that remain your job: names, labels and testing.

## What every component guarantees

- **Roles and states.** Dialogs are \`role="dialog"\` (alerts \`alertdialog\`) with \`aria-modal\` and a label, tabs use \`tablist\` / \`tab\` / \`tabpanel\` with \`aria-selected\`, selects are \`combobox\` + \`listbox\`, trees follow the treeview pattern, progress bars are \`role="progressbar"\` with \`aria-valuenow\` (omitted while indeterminate).
- **Keyboard.** Everything that works with a mouse works from the keyboard, using the conventional keys.
- **Visible focus.** Components draw a \`:focus-visible\` ring; you never need to hide \`outline\` on them.
- **Reduced motion.** Animations, shimmer, ripples and transitions are switched off under \`prefers-reduced-motion: reduce\`.
- **Focus management.** Modals, drawers, alerts, the command palette and the mobile sidebar move focus inside when they open, keep Tab cycling within them, close on Esc, and **return focus** to the element that opened them.
- **Live announcements.** Toasts, form errors, and pagination page changes use polite \`aria-live\` regions so screen readers hear updates without focus moving.
- **Text by default.** Labels, helper text and error messages are inserted as text, so assistive tech never reads injected markup.

## Keyboard cheat-sheet

- **Modal, Drawer, Alert**: \`Tab\` / \`Shift+Tab\` cycle inside, \`Esc\` closes (top-most only), focus returns on close
- **Tabs**: \`Left\` / \`Right\` (or \`Up\` / \`Down\` when vertical) move and activate, \`Home\` / \`End\`, \`Enter\` / \`Space\` with \`activation: 'manual'\`
- **Select**: \`Up\` / \`Down\` open and move, \`Home\` / \`End\`, \`Enter\` / \`Space\` choose, \`Esc\` closes, type to jump
- **Tree**: \`Up\` / \`Down\`, \`Right\` expand or enter, \`Left\` collapse or go to parent, \`Enter\` select, \`Space\` check, \`*\` expand siblings
- **Calendar**: arrows move by day/week, \`PageUp\` / \`PageDown\` change month, \`Shift\` + those change year, \`Enter\` selects, \`Esc\` clears a half-picked range
- **Command palette**: \`mod+k\` open, \`Up\` / \`Down\` / \`Home\` / \`End\` / \`PageUp\` / \`PageDown\`, \`Enter\` run, \`Esc\` close
- **Pagination**: \`Tab\` into the control, \`Left\` / \`Right\` / \`Home\` / \`End\` between page buttons
- **Sidebar, Navbar**: \`Up\` / \`Down\` / \`Home\` / \`End\` between items, \`Esc\` closes menus and returns focus
- **Chart**: focus the chart, then arrow keys step through points and show the tooltip

> **Tip:** the same list is on each component's docs page under *Accessibility*. When in doubt, try the component with only your keyboard.

## Step 1: try it with the keyboard

Click once inside the demo, then use only the keyboard: \`Tab\` to the tab list, press \`Right\` / \`Left\` and \`Home\` / \`End\`, \`Tab\` on to the select, open it with \`Down\`, move with the arrows and choose with \`Enter\`. The log shows each key press that reaches the demo.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:14px';

const tabsHost = document.createElement('div');
root.append(tabsHost);
const logBox = document.createElement('div');
logBox.setAttribute('aria-live', 'off');
logBox.style.cssText = 'min-height:24px;padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px';
logBox.textContent = 'Keys pressed: (none yet)';

const tabs = ChillTabs.init(tabsHost, {
  ariaLabel: 'Account sections',
  tabs: [
    { id: 'profile', label: 'Profile', content: 'Arrow keys move between tabs and activate them.' },
    { id: 'security', label: 'Security', content: 'Only the active tab is in the Tab order (roving tabindex).' },
    { id: 'billing', label: 'Billing', content: 'Home and End jump to the first and last tab.' },
    { id: 'legacy', label: 'Legacy', content: 'Disabled tabs are skipped.', disabled: true }
  ]
});

const select = ChillSelect.create({
  label: 'Plan',
  helper: 'Down opens the list, Enter chooses, Esc closes. Try typing "p".',
  items: [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' }
  ],
  value: 'free'
});

root.append(select, logBox);

const keys = [];
const onKey = (e) => {
  keys.unshift(e.key === ' ' ? 'Space' : e.key);
  logBox.textContent = 'Keys pressed: ' + keys.slice(0, 10).join('  ');
};
root.addEventListener('keydown', onKey);
cleanup(() => {
  root.removeEventListener('keydown', onKey);
  tabs.destroy();
  select.destroy();
});
\`\`\`

## Step 2: name every control

The one thing a component cannot guess is the accessible name of an icon-only control. Give it one with \`ariaLabel\`:

\`\`\`js
ChillButton.create({ icon: '✕', iconOnly: true, variant: 'ghost', ariaLabel: 'Close panel' });
\`\`\`

The icon itself is \`aria-hidden\`, so the label is what gets announced. The same rule applies everywhere:

- Inputs, selects and other form controls: pass \`label\` (visible) rather than relying on \`placeholder\`.
- Landmarks and widgets that appear more than once on a page: set \`ariaLabel\` (\`ChillNavbar\`, \`ChillSidebar\`, \`ChillPagination\`, \`ChillTabs\`, \`ChillTree\`, \`ChillCalendar\`, \`ChillTable\` caption or \`ariaLabel\`).
- Charts: pass \`options.ariaLabel\` with a one-sentence summary of what the data shows.
- Modals and drawers without a title: pass \`ariaLabel\`.

## Step 3: look at what is really rendered

Components expose their semantics in the DOM, so you can inspect or assert them. This demo lists every \`role\` and \`aria-*\` attribute that a button, an input and a progress bar produce.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';

const holder = document.createElement('div');
holder.style.cssText = 'display:flex;flex-direction:column;gap:10px';
const btn = ChillButton.create({ text: '✕', iconOnly: true, variant: 'outline', ariaLabel: 'Close panel' });
const input = ChillInput.create({ label: 'Email', type: 'email', state: 'error', helper: 'Enter a valid address' });
const bar = document.createElement('div');
holder.append(btn, input, bar);
root.append(holder);
const progress = ChillProgress.init(bar, { value: 40, label: 'Uploading', ariaLabel: 'Upload progress' });

const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
const lines = [];
holder.querySelectorAll('button, input, [role]').forEach((el) => {
  const attrs = [...el.attributes].filter((a) => a.name === 'role' || a.name.startsWith('aria-')).map((a) => a.name + '="' + a.value + '"');
  if (attrs.length) lines.push('<' + el.tagName.toLowerCase() + '> ' + attrs.join(' '));
});
out.textContent = lines.join('\\n') || 'No ARIA attributes found';
root.append(out);
cleanup(() => { progress.destroy(); input.destroy && input.destroy(); });
\`\`\`

## Step 4: test your own pages

- **Keyboard only.** Unplug the mouse for five minutes. Can you reach, operate and leave every control? Is the focus ring always visible?
- **Screen reader.** Try VoiceOver (macOS, \`Cmd+F5\`), NVDA (Windows) or TalkBack. Listen for names, states ("expanded", "selected") and announcements.
- **Reduced motion.** In browser devtools emulate \`prefers-reduced-motion: reduce\` and confirm nothing important depends on animation.
- **Automated.** Query by role in tests (\`getByRole('tab', { name: 'Billing' })\`) instead of CSS classes: if the query works, assistive tech can find it. Run axe or Lighthouse for contrast and missing names.
- **Both themes.** Check contrast in light and dark, especially with a custom brand colour.

> **Warning:** overriding colours with CSS variables is your responsibility for contrast. Aim for 4.5:1 for text and 3:1 for focus rings and control borders.

## Next steps

- [Theming & dark mode](/docs/guide/theming) for brand colours that stay readable
- [Modal](/docs/modal), [Tabs](/docs/tabs) and [Select](/docs/select) for per-component accessibility notes
- [Focus Trap](/docs/focustrap) if you build your own dialog-like widget
`,
};

export default guide;
