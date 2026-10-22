import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'dropdown',
    global: 'ChillDropdown',
    category: 'formControls',
    title: 'Dropdown Menu',
    summary: 'Action menus attached to any trigger: icons, shortcuts, checkbox and radio items, submenus and context menus.',
    style: 'init',
    description:
        'ChillDropdown turns any element into a menu trigger. Call `ChillDropdown.init(trigger, { items })` and the trigger is wrapped in a container with an accessible `role="menu"` popup that opens on click, hover or right click.\n\n' +
        'Labels, descriptions and shortcuts are rendered as **text**. Icons may be a DOM node, plain text or markup starting with `<`, which is sanitised (scripts, `on*` handlers and `javascript:` URLs removed). This is an *action menu*; for choosing a value in a form use [Select](/components/select).',
    features: [
        'Click, hover or context-menu (right click) triggers and six placement options',
        'Item types: action, checkbox, radio, header, divider and nested submenus',
        'Icons, descriptions, keyboard-shortcut hints, danger and disabled items',
        'Full keyboard navigation with type-ahead, plus proper menu/menuitem ARIA roles',
        'Closes on select, outside click, Esc and Tab; `destroy()` restores the original trigger',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic action menu',
            description: 'Attach a menu to a button. `onSelect` receives the clicked item value (as a string), the element and the item data.',
            height: 230,
            code: `const btn = document.createElement('button');
btn.textContent = 'Actions \\u25BE';
btn.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const out = document.createElement('p');
out.style.cssText = 'margin:150px 0 0;font-size:13px;color:var(--chill-text)';
root.append(out);
const dd = ChillDropdown.init(btn, {
  label: 'Document actions',
  items: [
    { label: 'Edit', value: 'edit', shortcut: 'E' },
    { label: 'Duplicate', value: 'dup', shortcut: 'D' },
    { label: 'Archive', value: 'archive', description: 'Hide from the main list' },
    { type: 'divider' },
    { label: 'Delete', value: 'delete', danger: true },
  ],
  onSelect: (value) => (out.textContent = 'You chose: ' + value),
});
dd.open();
cleanup(() => dd.destroy());`,
        },
        {
            id: 'icons-headers',
            title: 'Icons, headers and disabled items',
            description: 'Use `type: "header"` for section labels, `icon` for leading icons and `disabled` for unavailable actions. `position` controls where the menu opens.',
            height: 280,
            code: `const ico = (d) => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="' + d + '"/></svg>';
const btn = document.createElement('button');
btn.textContent = 'Account';
btn.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const dd = ChillDropdown.init(btn, {
  position: 'bottom-start',
  items: [
    { type: 'header', label: 'Signed in as ada@example.com' },
    { label: 'Profile', value: 'profile', icon: ico('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z') },
    { label: 'Settings', value: 'settings', icon: ico('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z') },
    { label: 'Billing', value: 'billing', icon: ico('M2 7h20v10H2z'), disabled: true },
    { type: 'divider' },
    { label: 'Sign out', value: 'out', icon: ico('M9 21H5V3h4M16 17l5-5-5-5M21 12H9'), danger: true },
  ],
});
dd.open();
cleanup(() => dd.destroy());`,
        },
        {
            id: 'checkbox-radio',
            title: 'Checkbox and radio items',
            description: 'Checkbox and radio items toggle themselves and stay open when `closeOnSelect` is false. Consecutive radio items form a group.',
            height: 300,
            code: `const btn = document.createElement('button');
btn.textContent = 'View options';
btn.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const dd = ChillDropdown.init(btn, {
  closeOnSelect: false,
  items: [
    { type: 'header', label: 'Show' },
    { type: 'checkbox', label: 'Grid lines', value: 'grid', checked: true },
    { type: 'checkbox', label: 'Rulers', value: 'rulers' },
    { type: 'divider' },
    { type: 'header', label: 'Density' },
    { type: 'radio', label: 'Compact', value: 'compact' },
    { type: 'radio', label: 'Comfortable', value: 'comfortable', checked: true },
    { type: 'radio', label: 'Spacious', value: 'spacious' },
  ],
  onSelect: (value, el, item) => console.log(value, item.checked),
});
dd.open();
cleanup(() => dd.destroy());`,
        },
        {
            id: 'submenu',
            title: 'Submenus',
            description: 'A `type: "submenu"` item opens a nested menu on hover or with the Right arrow key; Left or Esc closes it.',
            height: 260,
            code: `const btn = document.createElement('button');
btn.textContent = 'File';
btn.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const dd = ChillDropdown.init(btn, {
  items: [
    { label: 'New file', value: 'new', shortcut: 'N' },
    { type: 'submenu', label: 'Share', items: [
      { label: 'Copy link', value: 'link' },
      { label: 'Email', value: 'email' },
      { label: 'Slack', value: 'slack' },
    ] },
    { type: 'submenu', label: 'Export as', items: [
      { label: 'PDF', value: 'pdf' },
      { label: 'PNG', value: 'png' },
    ] },
    { type: 'divider' },
    { label: 'Close', value: 'close' },
  ],
});
dd.open();
cleanup(() => dd.destroy());`,
        },
        {
            id: 'contextmenu',
            title: 'Context menu and hover trigger',
            description: '`triggerOn: "contextmenu"` opens the menu on right click; `"hover"` opens it when the pointer enters the trigger area.',
            height: 220,
            code: `root.style.cssText += ';display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap';
const area = document.createElement('div');
area.textContent = 'Right-click this card';
area.style.cssText = 'padding:28px 24px;border:1px dashed var(--chill-border);border-radius:10px;color:var(--chill-text)';
const hover = document.createElement('button');
hover.textContent = 'Hover me';
hover.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(area, hover);
const ctx = ChillDropdown.init(area, {
  triggerOn: 'contextmenu',
  items: [{ label: 'Rename', value: 'rename' }, { label: 'Move to...', value: 'move' }, { label: 'Delete', value: 'delete', danger: true }],
});
const hov = ChillDropdown.init(hover, {
  triggerOn: 'hover',
  position: 'bottom-start',
  items: [{ label: 'Docs', value: 'docs' }, { label: 'Changelog', value: 'changelog' }],
});
cleanup(() => { ctx.destroy(); hov.destroy(); });`,
        },
        {
            id: 'dynamic',
            title: 'Update items at runtime',
            description: '`setItems()` rebuilds the menu, and `setPosition()` moves it. Handy for menus that depend on selection state.',
            height: 230,
            code: `const btn = document.createElement('button');
btn.textContent = 'Sort by \\u25BE';
btn.style.cssText = 'padding:8px 14px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
root.append(btn);
const sorts = ['Name', 'Date', 'Size'];
let current = 'Name';
const build = () => sorts.map((s) => ({ label: s, value: s, active: s === current }));
const dd = ChillDropdown.init(btn, {
  position: 'bottom-end',
  items: build(),
  onSelect(value) {
    current = value;
    btn.textContent = 'Sort by ' + value + ' \\u25BE';
    dd.setItems(build());
  },
});
dd.open();
cleanup(() => dd.destroy());`,
        },
    ],
    guides: [
        {
            title: 'How init works',
            body:
                '`ChillDropdown.init(trigger, options)` takes a selector or element. The trigger is moved inside a `.chilldropdown-container` wrapper (positioned relative) and a menu element is added next to it. The trigger receives `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; `destroy()` restores its original attributes and DOM position.\n\n' +
                'There is no `create()`: always start from an element that is already in the document.',
        },
        {
            title: 'Items',
            body:
                'Every entry is a plain object. Besides actions (`{ label, value }`) there are `type: "checkbox"`, `"radio"`, `"header"`, `"divider"` and `"submenu"` (with nested `items`). Common fields: `icon`, `description`, `shortcut`, `danger`, `disabled`, `active`.\n\n' +
                'Radio items are grouped per consecutive run, or explicitly with `group`. Checkbox and radio items update their own `checked` flag and `aria-checked`; read it from the `item` argument of `onSelect`. The `value` passed to `onSelect` is always a **string** (it is read from `data-value`).',
        },
        {
            title: 'Keyboard',
            body:
                'On a `<button>` trigger, Enter and Space click it; ArrowDown or ArrowUp opens the menu and focuses the first or last entry. Inside the menu use ArrowUp/Down, Home, End, type-ahead, Enter/Space to activate, Right to open a submenu, Left to close it, Esc to close and refocus the trigger and Tab to close.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chilldropdown-bg: #1f2937;\n  --chilldropdown-text: #f9fafb;\n  --chilldropdown-hover: #374151;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'items', type: 'DropdownItem[]', default: '[]', description: 'Menu entries (see item fields below).' },
        { name: 'position', type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right'", default: "'bottom-start'", description: 'Where the menu opens relative to the trigger.' },
        { name: 'triggerOn', type: "'click' | 'hover' | 'contextmenu'", default: "'click'", description: 'Event that opens the menu.' },
        { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Close after an item is activated.' },
        { name: 'closeOnOutsideClick', type: 'boolean', default: 'true', description: 'Close when clicking outside the container.' },
        { name: 'label', type: 'string', default: "''", description: '`aria-label` of the menu.' },
        { name: 'onSelect', type: '(value: string, element: HTMLElement, item: object) => void', default: 'null', description: 'Called when an item is activated.' },
        { name: 'onOpen', type: '() => void', default: 'null', description: 'Called after the menu opens.' },
        { name: 'onClose', type: '() => void', default: 'null', description: 'Called after the menu closes.' },
        { name: 'items[].label', type: 'string', default: '-', description: 'Item text (also the header text and submenu title).' },
        { name: 'items[].value', type: 'string | number', default: "''", description: 'Value passed to `onSelect` (stringified).' },
        { name: 'items[].type', type: "'checkbox' | 'radio' | 'header' | 'divider' | 'submenu'", default: 'action', description: 'Omit for a normal action item.' },
        { name: 'items[].icon', type: 'string | Node', default: 'undefined', description: 'Leading icon: text, node, or markup starting with `<` (sanitised).' },
        { name: 'items[].description', type: 'string', default: 'undefined', description: 'Secondary line under the label (text).' },
        { name: 'items[].shortcut', type: 'string', default: 'undefined', description: 'Shortcut hint shown on the right (display only).' },
        { name: 'items[].checked', type: 'boolean', default: 'false', description: 'Initial state of checkbox and radio items.' },
        { name: 'items[].group', type: 'string', default: 'run', description: 'Radio group id; by default consecutive radio items form a group.' },
        { name: 'items[].danger', type: 'boolean', default: 'false', description: 'Style as a destructive action.' },
        { name: 'items[].disabled', type: 'boolean', default: 'false', description: 'Disable the item (skipped by keyboard navigation).' },
        { name: 'items[].active', type: 'boolean', default: 'false', description: 'Highlight the item as current.' },
        { name: 'items[].items', type: 'DropdownItem[]', default: '[]', description: 'Children of a `submenu` item.' },
    ],
    methods: [
        { signature: 'ChillDropdown.init(trigger, options)', on: 'static', description: 'Attach a menu to a selector or element and return the instance.' },
        { signature: 'ChillDropdown.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.open() / close() / toggle()', description: 'Control the menu programmatically.' },
        { signature: 'instance.setItems(items)', description: 'Replace the menu entries.' },
        { signature: 'instance.setPosition(position)', description: 'Change the placement.' },
        { signature: 'instance.destroy()', description: 'Remove the menu and listeners and restore the trigger.' },
        { signature: 'instance.isOpen', description: 'Boolean, true while the menu is open.' },
        { signature: 'instance.menu / instance.container / instance.triggerEl', description: 'The menu element, the wrapper and the trigger.' },
    ],
    cssVars: [
        { name: '--chilldropdown-bg / --chilldropdown-border', description: 'Menu surface and border.' },
        { name: '--chilldropdown-text / --chilldropdown-text-muted', description: 'Item and secondary text colours.' },
        { name: '--chilldropdown-hover / --chilldropdown-active', description: 'Hovered and active item backgrounds.' },
        { name: '--chilldropdown-danger / --chilldropdown-danger-hover', description: 'Danger item colours.' },
        { name: '--chilldropdown-divider', description: 'Divider colour.' },
        { name: '--chilldropdown-shadow', description: 'Menu shadow.' },
    ],
    a11y: [
        'Trigger gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the popup is `role="menu"` with `menuitem`, `menuitemcheckbox` and `menuitemradio` entries (`aria-checked`).',
        'ArrowDown/Up on the trigger open the menu; Up/Down/Home/End move; letters type-ahead; Enter/Space activate.',
        'Right opens a submenu and Left closes it; Esc closes (and refocuses the trigger); Tab closes.',
        'Items are focusable buttons with `tabindex="-1"` (roving focus), disabled items are skipped.',
    ],
    tips: [
        'The container is `position: relative`; make sure ancestors do not clip overflow, or pick a `top-*` position near the bottom of the viewport.',
        'Context menus (`triggerOn: "contextmenu"`) do not set ARIA attributes on the trigger since there is no visible button.',
        '`onSelect` is also called for checkbox and radio items; inspect `item.checked` for the new state.',
        'In React, call `init()` in an effect with a ref to your trigger and `destroy()` on cleanup.',
    ],
    related: ['select', 'contextmenu', 'popover', 'button'],
    keywords: ['menu', 'popup menu', 'context menu', 'actions', 'kebab', 'overflow menu'],
};

export default doc;
