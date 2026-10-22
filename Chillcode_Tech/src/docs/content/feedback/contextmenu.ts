import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'contextmenu',
    global: 'ChillContextMenu',
    category: 'feedback',
    title: 'Context Menu',
    summary: 'Right-click and long-press menus with submenus, shortcuts, checkable items and full keyboard support.',
    style: 'create',
    description:
        'ChillContextMenu replaces the browser menu on the elements you choose. It opens on right-click (or the keyboard menu key) and on a touch long-press, ' +
        'positions itself inside the viewport, supports nested submenus and navigates like a native menu.\n\n' +
        '`label`, `icon` and `shortcut` are always inserted as **text**. Use `iconHtml` only for trusted markup such as an inline SVG you wrote yourself.',
    features: [
        'Triggers on `contextmenu`, touch long-press, or both, bound to any number of elements',
        'Items can be actions, separators, headers, disabled, danger-styled, checkable or hold a submenu',
        '`items` can be a function that builds a different menu per right-click',
        'Arrow keys, Home/End, type-ahead, Enter/Space, Left/Right for submenus, Esc to close',
        'Auto-flips to stay in the viewport; closes on scroll, resize, blur and outside click',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Right-click a card',
            description: 'Attach a menu to an element. Each item has an `onClick(item, event)` handler.',
            code: `const card = document.createElement('div');
card.style.cssText = 'padding:32px;border:2px dashed var(--chill-border);border-radius:10px;text-align:center;color:var(--chill-text);background:var(--chill-bg-secondary)';
card.textContent = 'Right-click (or long-press) anywhere in this box';
const status = document.createElement('p');
status.style.color = 'var(--chill-text)';
status.textContent = 'Last action: none';
root.append(card, status);

const menu = ChillContextMenu.attach(card, {
  items: [
    { label: 'Open', icon: '↗', onClick: () => (status.textContent = 'Last action: Open') },
    { label: 'Rename', icon: '✎', shortcut: 'F2', onClick: () => (status.textContent = 'Last action: Rename') },
    { label: 'Duplicate', icon: '⧉', shortcut: 'Ctrl+D', onClick: () => (status.textContent = 'Last action: Duplicate') },
    { type: 'separator' },
    { label: 'Delete', icon: '🗑', danger: true, shortcut: 'Del', onClick: () => (status.textContent = 'Last action: Delete') },
  ],
});
cleanup(() => menu.destroy());`,
            height: 200,
        },
        {
            id: 'submenu-checks',
            title: 'Submenus, headers and checkable items',
            description: 'Nest menus with `items`, group with `type: "header"`, and use a boolean `checked` for toggles. `setItems()` rebuilds the menu when state changes.',
            code: `const area = document.createElement('div');
area.style.cssText = 'padding:32px;border:1px solid var(--chill-border);border-radius:10px;text-align:center;color:var(--chill-text)';
area.textContent = 'Right-click for view options';
root.append(area);

const state = { grid: true, rulers: false };
const menu = ChillContextMenu.attach(area, { items: build() });
function build() {
  return [
    { type: 'header', label: 'View' },
    { label: 'Show grid', checked: state.grid, onClick: () => { state.grid = !state.grid; menu.setItems(build()); } },
    { label: 'Show rulers', checked: state.rulers, onClick: () => { state.rulers = !state.rulers; menu.setItems(build()); } },
    { type: 'separator' },
    { label: 'Export as', items: [
      { label: 'PNG', onClick: () => {} },
      { label: 'SVG', onClick: () => {} },
      { label: 'PDF', disabled: true },
    ] },
  ];
}
cleanup(() => menu.destroy());`,
            height: 180,
        },
        {
            id: 'dynamic-items',
            title: 'Per-target menus',
            description: 'One instance can serve many elements. Pass `items` as a function to receive the contextmenu event and the element that triggered it.',
            code: `const list = document.createElement('ul');
list.style.cssText = 'list-style:none;margin:0;padding:0;color:var(--chill-text)';
['Quarterly report.pdf', 'Team photo.png', 'Budget.xlsx'].forEach((name) => {
  const li = document.createElement('li');
  li.textContent = name;
  li.dataset.name = name;
  li.style.cssText = 'padding:10px 12px;border-bottom:1px solid var(--chill-border);cursor:context-menu';
  list.append(li);
});
root.append(list);

const menu = ChillContextMenu.attach(list.querySelectorAll('li'), {
  items: (event, target) => [
    { type: 'header', label: target.dataset.name },
    { label: 'Download', icon: '⬇' },
    { label: 'Share', icon: '↗', disabled: target.dataset.name.endsWith('.xlsx') },
    { label: 'Move to trash', danger: true },
  ],
  onSelect: (item) => console.log('selected', item.label),
});
cleanup(() => menu.destroy());`,
            height: 200,
        },
        {
            id: 'programmatic',
            title: 'Open from a button',
            description: '`open(x, y)` shows the menu at viewport coordinates, so you can use it for a "more actions" button. Use `trigger: "contextmenu"` to skip long-press handling.',
            code: `const btn = ChillButton.create({ text: 'More actions ▾', variant: 'outline' });
root.append(btn);
const menu = ChillContextMenu.create({
  ariaLabel: 'Project actions',
  items: [
    { label: 'Archive project', icon: '▣' },
    { label: 'Transfer ownership…' },
    { type: 'separator' },
    { label: 'Leave project', danger: true },
  ],
  onSelect: (item) => (btn.textContent = item.label + ' ✓'),
});
btn.addEventListener('click', (e) => {
  const r = btn.getBoundingClientRect();
  menu.open(r.left, r.bottom + 4, e);
});
cleanup(() => { menu.destroy(); btn.destroy(); });`,
            height: 120,
        },
    ],
    guides: [
        {
            title: 'attach vs create',
            body:
                '- **`ChillContextMenu.attach(target, options)`** (alias `init`) binds to a selector, element or NodeList and returns one instance that manages all matched elements. Call `destroy()` to unbind.\n' +
                '- **`ChillContextMenu.create(options)`** returns an unbound instance. Open it yourself with `open(x, y)`, for example from a toolbar button.\n\n' +
                'The menu element only exists while open; it is appended to `document.body` and removed on close.',
        },
        {
            title: 'Items',
            body:
                'Each entry is an object:\n\n' +
                '```js\n{ label: "Copy", icon: "⧉", shortcut: "Ctrl+C", onClick: (item, event) => {} }\n{ label: "Bold", checked: true }          // menuitemcheckbox\n{ label: "Share", items: [ ... ] }          // submenu\n{ type: "separator" }  { type: "header", label: "Section" }\n```\n\n' +
                'Both `item.onClick` and the global `onSelect` fire for leaf items. Items with `disabled: true` are skipped by keyboard navigation and cannot be activated. ' +
                'Checkable items do not toggle themselves: flip your own state and call `setItems()`.',
        },
        {
            title: 'Touch devices',
            body:
                'With `trigger: "both"` (the default) a 500 ms touch hold opens the menu, and moving more than 10px cancels it. ' +
                'Change `longPressMs` to tune it. Add `-webkit-touch-callout: none` to the target in CSS if iOS shows its own callout.',
        },
    ],
    options: [
        { name: 'items', type: 'Item[] | (event, target) => Item[]', default: '[]', description: 'Menu definition, or a function called on every open. An empty result means the menu does not open.' },
        { name: 'target', type: 'string | Element | NodeList', default: 'null', description: 'Elements to bind (set automatically by `attach()`).' },
        { name: 'trigger', type: "'contextmenu' | 'longpress' | 'both'", default: "'both'", description: 'Which gestures open the menu.' },
        { name: 'longPressMs', type: 'number', default: '500', description: 'Touch hold duration for long-press.' },
        { name: 'onSelect', type: '(item, event) => void', default: 'null', description: 'Called for every leaf item that is activated.' },
        { name: 'onOpen', type: '(instance) => void', default: 'null', description: 'Called after the menu opens.' },
        { name: 'onClose', type: '(instance) => void', default: 'null', description: 'Called after the menu closes.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class added to every menu panel (submenus too).' },
        { name: 'ariaLabel', type: 'string', default: "'Context menu'", description: 'Accessible name of the menu.' },
        { name: 'items[].label', type: 'string', default: '-', description: 'Item text (also the header text). Always plain text.' },
        { name: 'items[].icon', type: 'string', default: 'undefined', description: 'Leading text or emoji, inserted as text.' },
        { name: 'items[].iconHtml', type: 'string', default: 'undefined', description: 'Leading icon as HTML. Trusted markup only.' },
        { name: 'items[].shortcut', type: 'string', default: 'undefined', description: 'Right-aligned hint such as `Ctrl+C`. Display only, no key binding is created.' },
        { name: 'items[].disabled', type: 'boolean', default: 'false', description: 'Greys the item out and blocks activation.' },
        { name: 'items[].danger', type: 'boolean', default: 'false', description: 'Destructive styling.' },
        { name: 'items[].checked', type: 'boolean', default: 'undefined', description: 'Makes the item a checkbox; shows a tick when true.' },
        { name: 'items[].items', type: 'Item[]', default: 'undefined', description: 'Submenu entries.' },
        { name: 'items[].type', type: "'separator' | 'header'", default: 'undefined', description: 'Non-interactive divider or section title.' },
        { name: 'items[].onClick', type: '(item, event) => void', default: 'undefined', description: 'Called when the item is activated.' },
        { name: 'items[].id / value', type: 'any', default: 'undefined', description: 'Free-form data you can read back in `onSelect`.' },
    ],
    methods: [
        { signature: 'ChillContextMenu.create(options)', on: 'static', description: 'Create an unbound menu instance.' },
        { signature: 'ChillContextMenu.attach(target, options)', on: 'static', description: 'Bind a menu to elements. Returns one instance for all of them.' },
        { signature: 'ChillContextMenu.init(target, options)', on: 'static', description: 'Alias of `attach`.' },
        { signature: 'ChillContextMenu.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'menu.open(x, y, event?)', description: 'Open at viewport coordinates. Items that are a function receive `event`.' },
        { signature: 'menu.close()', description: 'Close the menu and any submenus; focus returns to the previous element.' },
        { signature: 'menu.setItems(items)', description: 'Replace the definition. If the menu is open it is rebuilt in place.' },
        { signature: 'menu.on(event, fn) / off(event, fn?)', description: 'Subscribe to `open`, `close` and `select`.' },
        { signature: 'menu.destroy()', description: 'Close and remove all listeners from the bound elements.' },
        { signature: 'menu.isOpen / menu.element', description: 'Open flag and the root menu element (null when closed).' },
    ],
    events: [
        { name: 'open', description: 'Menu opened.' },
        { name: 'close', description: 'Menu closed (not fired by `destroy()` or `setItems()`).' },
        { name: 'select', payload: 'item', description: 'A leaf item was activated.' },
    ],
    cssVars: [
        { name: '--chillcontextmenu-bg', description: 'Menu background.' },
        { name: '--chillcontextmenu-text / --chillcontextmenu-muted', description: 'Label and shortcut colours.' },
        { name: '--chillcontextmenu-hover', description: 'Highlighted item background.' },
        { name: '--chillcontextmenu-danger', description: 'Danger item colour.' },
        { name: '--chillcontextmenu-border / --chillcontextmenu-shadow', description: 'Border and drop shadow.' },
    ],
    a11y: [
        'Menus have `role="menu"`, items `menuitem` or `menuitemcheckbox` (with `aria-checked`), dividers `separator`.',
        'Submenu parents set `aria-haspopup="menu"` and `aria-expanded`; disabled items set `aria-disabled`.',
        'Up/Down move, Home/End jump, Enter/Space activate, Right opens a submenu, Left/Esc close it, Tab closes the menu, typing jumps to a matching label.',
        'A keyboard-generated `contextmenu` event (menu key / Shift+F10, which report 0,0 coordinates) opens the menu at the element and focuses the first item.',
        'Focus returns to the previously focused element when the menu closes.',
    ],
    tips: [
        'The menu replaces the native one only on bound elements; text inputs outside them keep the browser menu (and spell-check).',
        'Shortcuts are labels only. Wire up the real key handlers yourself.',
        'In React, create the instance in an effect with a ref as `target`, return `() => menu.destroy()`, and use `setItems()` when state changes.',
        'The menu closes on scroll and resize by design; reopen it with `open()` if needed.',
    ],
    related: ['dropdown', 'popover', 'tooltip'],
    keywords: ['right click', 'long press', 'context', 'menu', 'actions', 'submenu'],
};

export default doc;
