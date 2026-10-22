import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'callout',
    global: 'ChillCallout',
    category: 'feedback',
    title: 'Callout',
    summary: 'Inline banners for info, success, warning and danger, with actions, dismiss and collapsible bodies.',
    style: 'create',
    description:
        'ChillCallout is a static, in-flow message block: use it for notes in documentation, form-level errors, trial warnings and system notices that belong to the page ' +
        'rather than floating above it (use a toast for transient feedback). Build one with `create()`, or upgrade existing markup with `init()`.\n\n' +
        '`title` and `message` are inserted as **text**; set `html: true` only for trusted markup. Warning and danger callouts use `role="alert"`, the others `role="status"`.',
    features: [
        'Five types (`info`, `success`, `warning`, `danger`, `neutral`) in `soft`, `outline` and `solid` variants',
        'Built-in type icons, or your own text / emoji icon, or none',
        'Action buttons and links, a dismiss button, and an optional collapsible body',
        '`update()` re-renders in place, e.g. to turn a warning into a success',
        '`init()` enhances existing elements and restores them on `destroy()`',
    ],
    examples: [
        {
            id: 'types',
            title: 'Types',
            description: 'Five semantic types. Pass `container` to mount straight into the page, or append `callout.element` yourself.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const defs = [
  ['info', 'Heads up', 'A new version of the dashboard is available.'],
  ['success', 'Payment received', 'Invoice #2041 has been paid in full.'],
  ['warning', 'Trial ending soon', 'Your trial ends in 3 days. Add a payment method to keep your projects.'],
  ['danger', 'Deployment failed', 'The build exited with code 1. Check the logs for details.'],
  ['neutral', 'Maintenance window', 'Scheduled maintenance on Sunday, 02:00-03:00 UTC.'],
];
defs.forEach(([type, title, message]) => {
  const c = ChillCallout.create({ type, title, message, container: root });
  cleanup(() => c.destroy());
});`,
            height: 360,
        },
        {
            id: 'variants',
            title: 'Variants and icons',
            description: '`variant` switches between soft (default), outline and solid. `icon` can be `false` or any text.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const list = [
  { type: 'info', variant: 'outline', title: 'Outline', message: 'Border only, transparent background.' },
  { type: 'success', variant: 'solid', title: 'Solid', message: 'Strong background for high emphasis.' },
  { type: 'warning', icon: '⚡', title: 'Custom icon', message: 'Any text or emoji works as an icon.' },
  { type: 'neutral', icon: false, message: 'No icon and no title - just a note.' },
];
list.forEach((o) => {
  const c = ChillCallout.create(Object.assign({ container: root }, o));
  cleanup(() => c.destroy());
});`,
            height: 330,
        },
        {
            id: 'actions',
            title: 'Actions and dismiss',
            description: 'Buttons (or links with `href`) go in `actions`. Each runs its `onClick(event, action, callout)`; `dismissible` adds a close button.',
            code: `const c = ChillCallout.create({
  type: 'warning',
  title: 'Storage almost full',
  message: 'You have used 92% of your 10 GB plan.',
  dismissible: true,
  container: root,
  actions: [
    { label: 'Upgrade plan', variant: 'primary', onClick: (e, action, callout) => callout.update({ type: 'success', title: 'Thanks!', message: 'Your plan was upgraded to 100 GB.', actions: [], dismissible: true }) },
    { label: 'Manage files', href: '#files', variant: 'ghost' },
  ],
});
cleanup(() => c.destroy());`,
            height: 150,
        },
        {
            id: 'collapsible',
            title: 'Collapsible details',
            description: 'With `collapsible`, the title becomes a toggle button. Use `onToggle` or `callout.on("toggle")` to react.',
            code: `const c = ChillCallout.create({
  type: 'danger',
  variant: 'outline',
  title: 'Upload failed (2 files)',
  message: 'report-final.pdf - file exceeds 25 MB. holiday.mov - unsupported format.',
  collapsible: true,
  collapsed: true,
  container: root,
});
c.on('toggle', (collapsed) => console.log(collapsed ? 'collapsed' : 'expanded'));
cleanup(() => c.destroy());`,
            height: 120,
        },
        {
            id: 'init-existing',
            title: 'Upgrade existing markup',
            description: '`init()` wraps elements that are already in the page. Their children become the message, and options can come from `data-*` attributes.',
            code: `root.innerHTML = '<div class="notice" data-type="success" data-title="Saved" data-dismissible>Your changes were saved to the draft.</div>' +
  '<div class="notice" data-type="info" data-title="Keyboard shortcuts" data-collapsible data-collapsed style="margin-top:10px">Press <b>?</b> anywhere to see all shortcuts.</div>';
const inst = ChillCallout.init(root.querySelectorAll('.notice'));
cleanup(() => inst.destroy());`,
            height: 200,
        },
    ],
    guides: [
        {
            title: 'create vs init',
            body:
                '- **`create(options)`** returns an instance with `element`. It is not attached unless you pass `container`; otherwise append `callout.element` yourself.\n' +
                '- **`init(target, options)`** takes a selector, element or NodeList. The element\'s existing children become the message (unless you pass `message`), and `data-type`, `data-title`, `data-dismissible`, `data-collapsible` and `data-collapsed` are read. ' +
                'It returns `{ callouts, destroy() }`; `destroy()` restores the original content and classes.\n\n' +
                'When an enhanced callout is dismissed it is restored and hidden (`hidden` attribute); a created one is removed from the DOM.',
        },
        {
            title: 'Dismissing and persistence',
            body:
                'Dismiss plays a short leave animation (skipped under `prefers-reduced-motion`) and then removes the callout. ' +
                'Callouts have no memory of their own, so remember dismissal yourself:\n\n' +
                '```js\nif (!localStorage.getItem("trial-banner")) {\n  ChillCallout.create({ type: "info", message: "Welcome back!", dismissible: true, container: slot,\n    onDismiss: () => localStorage.setItem("trial-banner", "1") });\n}\n```',
        },
        {
            title: 'Theming',
            body:
                'Each type has a foreground and a background variable:\n\n' +
                '```css\n:root {\n  --chillcallout-info: #0369a1;\n  --chillcallout-info-bg: #e0f2fe;\n  --chillcallout-danger: #b91c1c;\n}\n```\n\n' +
                'Dark mode follows the OS or `<html data-theme="dark">`.',
        },
    ],
    options: [
        { name: 'type', type: "'info' | 'success' | 'warning' | 'danger' | 'neutral'", default: "'info'", description: 'Semantic type; unknown values fall back to `info`.' },
        { name: 'variant', type: "'soft' | 'outline' | 'solid'", default: "'soft'", description: 'Visual weight.' },
        { name: 'title', type: 'string', default: "''", description: 'Heading, inserted as text. Collapsible callouts without a title use the capitalised type name.' },
        { name: 'message', type: 'string | Element', default: "''", description: 'Body. Strings are text unless `html` is true.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Render a string `message` as HTML. You must sanitise.' },
        { name: 'icon', type: 'boolean | string', default: 'true', description: '`true` shows the type icon, `false` none, a string is used as text/emoji.' },
        { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show a close button.' },
        { name: 'collapsible', type: 'boolean', default: 'false', description: 'Turn the title into a toggle that shows / hides the body and actions.' },
        { name: 'collapsed', type: 'boolean', default: 'false', description: 'Initial collapsed state (needs `collapsible`).' },
        { name: 'actions', type: 'Action[]', default: '[]', description: 'Buttons or links shown under the message.' },
        { name: 'actions[].label', type: 'string', default: '-', description: 'Button text.' },
        { name: 'actions[].href', type: 'string', default: 'undefined', description: 'Render a link instead of a button. Also accepts `target`; `_blank` adds `rel="noopener noreferrer"`.' },
        { name: 'actions[].variant', type: "'primary' | 'ghost'", default: 'undefined', description: 'Action style.' },
        { name: 'actions[].disabled', type: 'boolean', default: 'false', description: 'Disable the button (not applied to links).' },
        { name: 'actions[].onClick', type: '(event, action, callout) => void', default: 'undefined', description: 'Click handler.' },
        { name: 'role', type: "'alert' | 'status' | 'note'", default: 'auto', description: 'Override the ARIA role. Default is `alert` for warning/danger, `status` otherwise.' },
        { name: 'container', type: 'Element', default: 'null', description: 'Append the callout to this element on creation.' },
        { name: 'onDismiss', type: '(callout) => void', default: 'null', description: 'Called when dismissal starts.' },
        { name: 'onToggle', type: '(collapsed, callout) => void', default: 'null', description: 'Called when the collapsed state changes.' },
        { name: 'onAction', type: '(action, callout) => void', default: 'null', description: 'Called after any action is clicked.' },
    ],
    methods: [
        { signature: 'ChillCallout.create(options)', on: 'static', description: 'Create a callout instance.' },
        { signature: 'ChillCallout.init(target, options)', on: 'static', description: 'Enhance existing elements. Returns `{ callouts, destroy() }`.' },
        { signature: 'ChillCallout.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'callout.update(partial)', description: 'Merge new options and re-render in place.' },
        { signature: 'callout.dismiss()', description: 'Fire dismiss callbacks, animate out and destroy.' },
        { signature: 'callout.expand() / collapse() / toggle()', description: 'Change the collapsed state (collapsible callouts only).' },
        { signature: 'callout.on(event, fn) / off(event, fn?)', description: 'Subscribe to `dismiss`, `toggle` and `action`.' },
        { signature: 'callout.destroy()', description: 'Remove the element (or restore an enhanced one) and drop listeners.' },
        { signature: 'callout.element / collapsed / dismissed', description: 'Root element and state flags.' },
    ],
    events: [
        { name: 'dismiss', description: 'Dismissal started.' },
        { name: 'toggle', payload: 'collapsed: boolean', description: 'Collapsed state changed.' },
        { name: 'action', payload: 'action', description: 'An action button or link was clicked.' },
    ],
    cssVars: [
        { name: '--chillcallout-info / --chillcallout-info-bg', description: 'Foreground and background for the info type (same pattern for success, warning, danger, neutral).' },
        { name: '--chillcallout-text', description: 'Body text colour.' },
        { name: '--chillcallout-muted', description: 'Secondary text colour.' },
    ],
    a11y: [
        'Root has `role="alert"` for warning and danger (announced immediately) and `role="status"` otherwise; override with `role`.',
        'Icons are `aria-hidden`; the dismiss button is labelled "Dismiss".',
        'Collapsible titles are real buttons with `aria-expanded` and `aria-controls` pointing at the body, so Enter and Space toggle them.',
        'Leave animation is skipped under `prefers-reduced-motion`.',
    ],
    tips: [
        'A `role="alert"` callout that exists at page load is not always announced; insert it dynamically when you want it read out.',
        'Use `update()` for state changes (retry succeeded, plan upgraded) instead of destroying and recreating.',
        'In React, create in an effect with a ref as `container`; or render your own markup and call `init()` on it.',
        'Safe to import on the server: DOM and styles are only touched when you call `create()` or `init()`.',
    ],
    related: ['alert', 'toast', 'badge'],
    keywords: ['banner', 'notice', 'admonition', 'message', 'note', 'warning box'],
};

export default doc;
