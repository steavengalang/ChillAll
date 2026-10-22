import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'tabs',
    global: 'ChillTabs',
    category: 'navigation',
    title: 'Tabs',
    summary: 'Accessible tabs with three variants, vertical layout, badges, icons and dynamic add/remove.',
    style: 'init',
    description:
        'ChillTabs turns a list of `{ id, label, content }` objects into a WAI-ARIA tab interface: a `tablist`, one `tabpanel` per tab, roving tabindex and arrow-key navigation. ' +
        'Use it to split dense pages into panels without a page load.\n\n' +
        '`ChillTabs.init(target, options)` replaces the target element (which must be in the DOM). Panel `content` accepts text (safe by default), a DOM node, or HTML when you opt in with `html: true`. Labels and badges are always text.',
    features: [
        'Three variants (`default`, `pills`, `boxed`), three sizes, vertical, centered and full-width layouts',
        'Roving tabindex, Arrow / Home / End keys, automatic or manual activation',
        'Icons, count badges and disabled tabs',
        'Add, remove, reorder content and disable tabs at runtime',
        'Horizontal scroll on narrow screens; vertical tabs stack below 640px',
        'Text-only content by default; Element content and opt-in HTML',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic tabs',
            description: 'Plain strings are rendered as text. The first enabled tab is active unless you set `defaultTab`.',
            height: 200,
            code: `const mount = document.createElement('div');
root.append(mount);
const tabs = ChillTabs.init(mount, {
  ariaLabel: 'Account sections',
  tabs: [
    { id: 'profile', label: 'Profile', content: 'Update your name, avatar and bio.' },
    { id: 'security', label: 'Security', content: 'Change your password and enable two-factor authentication.' },
    { id: 'billing', label: 'Billing', content: 'Manage your plan, invoices and payment methods.' },
  ],
  defaultTab: 'security',
});
cleanup(() => tabs.destroy());`,
        },
        {
            id: 'variants',
            title: 'Variants and sizes',
            description: '`variant` is `default` (underline), `pills` or `boxed`. Combine with `size`, `centered` or `fullWidth`.',
            height: 340,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const made = [];
[['default', 'md', {}], ['pills', 'sm', { centered: true }], ['boxed', 'lg', { fullWidth: true }]].forEach(([variant, size, extra]) => {
  const m = document.createElement('div');
  root.append(m);
  made.push(ChillTabs.init(m, Object.assign({
    variant, size,
    tabs: [
      { id: 'a', label: variant + ' / ' + size, content: 'Panel A' },
      { id: 'b', label: 'Second', content: 'Panel B' },
      { id: 'c', label: 'Third', content: 'Panel C' },
    ],
  }, extra)));
});
cleanup(() => made.forEach((t) => t.destroy()));`,
        },
        {
            id: 'icons-badges',
            title: 'Icons, badges and disabled tabs',
            description: 'Add an `icon` (text or node), a `badge` count or `disabled: true`. Use `setDisabled(id, bool)` to toggle later.',
            height: 220,
            code: `const mount = document.createElement('div');
root.append(mount);
const tabs = ChillTabs.init(mount, {
  variant: 'pills',
  tabs: [
    { id: 'inbox', label: 'Inbox', icon: '📥', badge: 12, content: 'You have 12 unread messages.' },
    { id: 'sent', label: 'Sent', icon: '📤', content: 'Messages you sent.' },
    { id: 'archive', label: 'Archive', icon: '🗄️', disabled: true, content: 'Archived mail.' },
  ],
});
const enable = ChillButton.create({ text: 'Enable Archive', size: 'sm', variant: 'outline' });
enable.style.marginTop = '12px';
enable.onclick = () => tabs.setDisabled('archive', false);
root.append(enable);
cleanup(() => tabs.destroy());`,
        },
        {
            id: 'vertical',
            title: 'Vertical tabs',
            description: 'Set `vertical: true` for a side tab list. Arrow Up/Down move between tabs. Content may be a DOM element.',
            height: 240,
            code: `const mount = document.createElement('div');
root.append(mount);
const panel = (title, text) => {
  const d = document.createElement('div');
  const h = document.createElement('strong'); h.textContent = title;
  const p = document.createElement('p'); p.textContent = text; p.style.margin = '6px 0 0';
  d.append(h, p);
  return d;
};
const tabs = ChillTabs.init(mount, {
  vertical: true,
  tabs: [
    { id: 'general', label: 'General', content: panel('General', 'Workspace name and language.') },
    { id: 'members', label: 'Members', badge: 8, content: panel('Members', 'Invite teammates and set roles.') },
    { id: 'danger', label: 'Danger zone', content: panel('Danger zone', 'Delete the workspace permanently.') },
  ],
});
cleanup(() => tabs.destroy());`,
        },
        {
            id: 'dynamic',
            title: 'Dynamic tabs and events',
            description: 'Create tabs on the fly with `addTab()`, remove them with `removeTab()` and listen with `onChange` or `on("change")`.',
            height: 260,
            code: `const mount = document.createElement('div');
root.append(mount);
let n = 1;
const log = document.createElement('p');
log.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
const tabs = ChillTabs.init(mount, {
  tabs: [{ id: 't1', label: 'Tab 1', content: 'First document' }],
  onChange: (id) => { log.textContent = 'Active tab: ' + id; },
});
const add = ChillButton.create({ text: 'Add tab', size: 'sm' });
const del = ChillButton.create({ text: 'Remove active', size: 'sm', variant: 'outline' });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;margin-top:12px';
row.append(add, del);
add.onclick = () => { n++; tabs.addTab({ id: 't' + n, label: 'Tab ' + n, content: 'Document number ' + n }); tabs.setActiveTab('t' + n); };
del.onclick = () => { if (tabs.items.size > 1) tabs.removeTab(tabs.getActiveTab()); };
root.append(row, log);
cleanup(() => tabs.destroy());`,
        },
        {
            id: 'manual',
            title: 'Manual activation and updating content',
            description: 'With `activation: "manual"` arrow keys only move focus; Enter or Space selects. `setTabContent(id, content)` replaces a panel later.',
            height: 220,
            code: `const mount = document.createElement('div');
root.append(mount);
const tabs = ChillTabs.init(mount, {
  activation: 'manual',
  tabs: [
    { id: 'preview', label: 'Preview', content: 'Focus a tab and use the arrow keys, then press Enter.' },
    { id: 'logs', label: 'Logs', content: 'Waiting for logs...' },
  ],
});
const timer = setInterval(() => tabs.setTabContent('logs', 'Last refresh: ' + new Date().toLocaleTimeString()), 1000);
cleanup(() => { clearInterval(timer); tabs.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Content and safety',
            body:
                '`content` can be a string, a DOM node or an HTML string:\n\n' +
                '- **String** (default): inserted as text, so user input cannot inject markup.\n' +
                '- **Node**: appended as-is (a node can live in only one place at a time).\n' +
                '- **HTML**: set `html: true` globally or `html: true` on a single tab. Only use it with trusted, sanitised markup.\n\n' +
                '`label` and `badge` are always text. `icon` follows the same rules as `content`.',
        },
        {
            title: 'Keyboard and activation',
            body:
                'Only the active tab is in the tab order (roving tabindex); Tab then moves into its panel (which is focusable). Left/Right (Up/Down when `vertical`) move between enabled tabs with wrap-around, Home and End jump to the ends. ' +
                'By default moving focus also activates the tab (`activation: "auto"`); use `"manual"` for tabs with expensive panels so users confirm with Enter or Space.',
        },
        {
            title: 'Responsive behaviour',
            body:
                'On narrow screens the tab list scrolls horizontally and the active tab is scrolled into view. Vertical tabs stack above the panel below 640px.',
        },
    ],
    options: [
        { name: 'tabs', type: 'Tab[]', default: '[]', description: 'Tab definitions (see the rows below). Each `id` must be unique.' },
        { name: 'tabs[].id', type: 'string | number', default: '-', description: 'Unique identifier used by `setActiveTab`, `removeTab` and `onChange`.' },
        { name: 'tabs[].label', type: 'string', default: "''", description: 'Tab text (always inserted as text).' },
        { name: 'tabs[].content', type: 'string | Node', default: 'undefined', description: 'Panel content. Strings are text unless HTML is enabled.' },
        { name: 'tabs[].icon', type: 'string | Node', default: 'undefined', description: 'Icon shown before the label.' },
        { name: 'tabs[].badge', type: 'string | number', default: 'undefined', description: 'Small count shown after the label (`0` is shown; empty string, `null` and `false` are hidden).' },
        { name: 'tabs[].disabled', type: 'boolean', default: 'false', description: 'Disable the tab.' },
        { name: 'tabs[].html', type: 'boolean', default: 'false', description: 'Insert this tab\'s string `content` and `icon` as HTML.' },
        { name: 'defaultTab', type: 'string | number', default: 'first enabled tab', description: 'Initially active tab id (ignored if it is missing or disabled).' },
        { name: 'variant', type: "'default' | 'pills' | 'boxed'", default: "'default'", description: 'Visual style.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tab size.' },
        { name: 'vertical', type: 'boolean', default: 'false', description: 'Place the tab list beside the panel.' },
        { name: 'centered', type: 'boolean', default: 'false', description: 'Centre the tab list.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch the tabs to fill the width.' },
        { name: 'activation', type: "'auto' | 'manual'", default: "'auto'", description: '`auto` activates on arrow-key focus; `manual` requires Enter / Space.' },
        { name: 'ariaLabel', type: 'string', default: "''", description: 'Accessible name of the tablist.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat all string `content` and `icon` values as HTML (trusted markup only).' },
        { name: 'onChange', type: '(id: string | number, instance) => void', default: 'null', description: 'Called when the active tab changes.' },
    ],
    methods: [
        { signature: 'ChillTabs.init(target, options)', on: 'static', description: 'Render tabs in place of `target` (selector or element) and return an instance.' },
        { signature: 'ChillTabs.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.container', description: 'The root `.chilltabs` element.' },
        { signature: 'instance.setActiveTab(id)', description: 'Activate a tab (ignored for unknown or disabled ids). Returns the instance.' },
        { signature: 'instance.getActiveTab()', description: 'Id of the active tab.' },
        { signature: 'instance.next() / prev()', description: 'Activate the next/previous enabled tab, wrapping around.' },
        { signature: 'instance.setTabContent(id, content, { html? })', description: 'Replace a panel\'s content.' },
        { signature: 'instance.setDisabled(id, disabled)', description: 'Enable or disable a tab; if the active tab is disabled the first enabled tab takes over.' },
        { signature: 'instance.addTab(tab, index?)', description: 'Add a tab (ignored if the id already exists). The first enabled one becomes active when none was.' },
        { signature: 'instance.removeTab(id)', description: 'Remove a tab; the first remaining enabled tab activates if it was active.' },
        { signature: 'instance.on("change", fn)', description: 'Subscribe to changes with `fn(id, instance)`. Returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    events: [{ name: 'change', payload: '(id, instance)', description: 'The active tab changed (the only event accepted by `on()`).' }],
    cssVars: [
        { name: '--chilltabs-text / --chilltabs-text-active', description: 'Inactive and active tab text colours.' },
        { name: '--chilltabs-indicator', description: 'Underline and pill accent colour.' },
        { name: '--chilltabs-border', description: 'Tab list border.' },
        { name: '--chilltabs-hover', description: 'Hover background.' },
        { name: '--chilltabs-bg / --chilltabs-panel-bg', description: 'Tab list and panel backgrounds.' },
    ],
    a11y: [
        'Roles `tablist`, `tab` and `tabpanel` with `aria-selected`, `aria-controls` and `aria-labelledby`; `aria-orientation` follows `vertical`.',
        'Roving tabindex: only the active tab is tabbable. ArrowLeft/Right (ArrowUp/Down when vertical), Home and End move focus.',
        '`activation: "auto"` selects on focus; `"manual"` waits for Enter or Space. Panels are focusable (`tabindex="0"`).',
    ],
    tips: [
        'Panels are rendered up front and hidden with `hidden`, so heavy content is still created at init. Fill it lazily with `onChange` + `setTabContent`.',
        'If a tab contains a DOM node you reuse elsewhere, clone it: the same node cannot sit in two panels.',
        'For SSR frameworks, init in an effect after mount and call `destroy()` on unmount.',
    ],
    related: ['accordion', 'sidebar', 'breadcrumb', 'stepper'],
    keywords: ['tabbed', 'panels', 'segmented', 'tablist'],
};

export default doc;
