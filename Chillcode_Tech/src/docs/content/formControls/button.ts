import type { DocEntry } from '../../types';

/**
 * REFERENCE ENTRY - copy this level of detail and tone for every component.
 * Rules of thumb: examples teach (simple -> real-world), descriptions say *why*, options come from the source JSDoc,
 * every claim is something the code really does (verify-docs executes the examples and checks static methods).
 */
const doc: DocEntry = {
    id: 'button',
    global: 'ChillButton',
    category: 'formControls',
    title: 'Button',
    summary: 'Buttons with variants, sizes, icons, loading states, link mode and an optional ripple.',
    style: 'create',
    description:
        'ChillButton gives you consistent, accessible buttons without a framework. Use `ChillButton.create()` to build a ready-to-insert element, ' +
        'or `ChillButton.init()` to upgrade buttons that already exist in your HTML.\n\n' +
        'Text is always inserted as **text**, so user-supplied labels can never inject markup. Pass `html: true` only for trusted, sanitised markup.',
    features: [
        '7 variants and 3 sizes, plus full-width and icon-only layouts',
        'Built-in loading state that keeps the width stable and blocks double clicks',
        'Renders a real `<a>` when you pass `href`, with correct disabled handling',
        'Optional material-style ripple',
        'Safe by default: label and icon strings are rendered as text',
    ],
    examples: [
        {
            id: 'variants',
            title: 'Variants',
            description: 'Seven built-in looks. `primary` is the default.',
            code: `['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'ghost'].forEach((variant) => {
  root.append(ChillButton.create({ text: variant, variant }));
});
root.style.display = 'flex';
root.style.flexWrap = 'wrap';
root.style.gap = '8px';`,
        },
        {
            id: 'sizes',
            title: 'Sizes and layouts',
            description: 'Three sizes, a full-width button and an icon-only button (give it an `ariaLabel`).',
            code: `root.style.display = 'flex';
root.style.flexDirection = 'column';
root.style.gap = '12px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
['sm', 'md', 'lg'].forEach((size) => row.append(ChillButton.create({ text: 'Size ' + size, size })));
row.append(ChillButton.create({ iconOnly: true, icon: '★', ariaLabel: 'Favourite', variant: 'outline' }));
root.append(row, ChillButton.create({ text: 'Full width', fullWidth: true, variant: 'success' }));`,
        },
        {
            id: 'icons',
            title: 'Icons',
            description: 'Icons can be text, a DOM node or an SVG string. Strings starting with `<` are sanitised.',
            code: `const svg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
root.append(
  ChillButton.create({ text: 'Add item', icon: svg }),
  ChillButton.create({ text: 'Next', icon: '→', iconPosition: 'right', variant: 'secondary' }),
);`,
        },
        {
            id: 'loading',
            title: 'Loading state',
            description: 'Call `setLoading(true, text?)` on the element. The button is disabled while loading, so double submits are impossible.',
            code: `const btn = ChillButton.create({ text: 'Save changes', variant: 'primary' });
btn.addEventListener('click', async () => {
  btn.setLoading(true, 'Saving...');
  await new Promise((r) => setTimeout(r, 1500));   // pretend to call your API
  btn.setLoading(false);
});
root.append(btn);
cleanup(() => btn.destroy());`,
        },
        {
            id: 'link-ripple',
            title: 'Link mode and ripple',
            description: 'With `href` the element is an `<a>`; add `ripple` for a press animation.',
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
root.append(
  ChillButton.create({ text: 'Read the docs', href: '/docs', variant: 'outline' }),
  ChillButton.create({ text: 'Open GitHub', href: 'https://github.com/', target: '_blank', variant: 'ghost' }),
  ChillButton.create({ text: 'Ripple', ripple: true, variant: 'success' }),
);`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade existing buttons',
            description: '`init()` decorates buttons that are already in the DOM and returns an instance for later changes.',
            code: `root.innerHTML = '<button class="a">One</button> <button class="a">Two</button> <button class="a">Three</button>';
const inst = ChillButton.init(root.querySelectorAll('.a'), { variant: 'secondary', size: 'sm' });
setTimeout(() => inst.setVariant('danger'), 800);
cleanup(() => inst.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns a new element. Append it wherever you like. The element has helper methods: `setLoading(bool, text?)`, `setDisabled(bool)` and `destroy()`.\n' +
                '- **`init(target, options)`** accepts a selector, an element or a NodeList and styles what is already there. It returns an instance with `setVariant`, `setSize`, `setDisabled`, `setLoading` and `destroy`.\n\n' +
                'Both inject the stylesheet once; call `ChillButton.injectCSS()` yourself if you want to avoid a flash of unstyled content.',
        },
        {
            title: 'Theming',
            body:
                'Colours are CSS custom properties on `:root`, so you can re-brand every button with a few lines:\n\n' +
                '```css\n:root {\n  --chillbutton-primary: #7c3aed;\n  --chillbutton-primary-hover: #6d28d9;\n}\n```\n\n' +
                'Dark mode follows the OS or `<html data-theme="dark">` / `class="dark"` (see ChillTheme).',
        },
    ],
    options: [
        { name: 'text', type: 'string', default: "''", description: 'Button label. Always inserted as text unless `html` is true.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat `text` as HTML. Scripts, `on*` handlers and `javascript:` URLs are stripped.' },
        { name: 'variant', type: "'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost'", default: "'primary'", description: 'Visual style.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
        { name: 'icon', type: 'string | Node', default: 'null', description: 'Plain text, a DOM node, or markup beginning with `<` (e.g. an inline SVG, sanitised).' },
        { name: 'iconPosition', type: "'left' | 'right'", default: "'left'", description: 'Which side the icon sits on.' },
        { name: 'href', type: 'string', default: 'null', description: 'Render an `<a>` instead of a `<button>`. Also accepts `target` and `rel`.' },
        { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container width.' },
        { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Square button for a single icon. Set `ariaLabel`.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Start in the loading state.' },
        { name: 'loadingText', type: 'string', default: 'null', description: 'Text shown beside the spinner while loading.' },
        { name: 'ripple', type: 'boolean', default: 'false', description: 'Material-style ripple on press.' },
        { name: 'ariaLabel', type: 'string', default: 'null', description: 'Accessible name (required for icon-only buttons).' },
        { name: 'onClick', type: '(event: MouseEvent) => void', default: 'null', description: 'Click handler.' },
    ],
    methods: [
        { signature: 'ChillButton.create(options)', on: 'static', description: 'Build a button element.' },
        { signature: 'ChillButton.init(target, options)', on: 'static', description: 'Upgrade existing buttons; returns an instance.' },
        { signature: 'ChillButton.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'el.setLoading(loading, text?)', description: 'Toggle the loading state on an element made by `create()`.' },
        { signature: 'el.setDisabled(disabled)', description: 'Enable or disable an element made by `create()`.' },
        { signature: 'el.destroy()', description: 'Remove listeners added by `create()`.' },
        { signature: 'instance.setVariant(variant) / setSize(size)', description: 'Change look after `init()`.' },
        { signature: 'instance.setLoading(loading) / setDisabled(disabled)', description: 'Change state after `init()`.' },
        { signature: 'instance.destroy()', description: 'Remove classes and listeners.' },
    ],
    cssVars: [
        { name: '--chillbutton-primary', description: 'Primary background (and -hover).' },
        { name: '--chillbutton-danger', description: 'Danger background (and -hover).' },
        { name: '--chillbutton-bg / --chillbutton-text', description: 'Outline and ghost surface colours.' },
        { name: '--chillbutton-border', description: 'Outline border colour.' },
    ],
    a11y: [
        'Renders native `<button>` (or `<a>` for `href`), so Enter and Space work without extra code.',
        'Loading sets `aria-busy` and disables the control; keep `ariaLabel` on icon-only buttons.',
        'Visible `:focus-visible` ring; animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'In React, create the element in an effect and append it to a ref, or simply use `init()` on your own `<button>` elements.',
        'The module is safe to import on the server; build the buttons in the browser (effects / event handlers).',
    ],
    related: ['input', 'dropdown', 'spinner'],
    keywords: ['cta', 'submit', 'action', 'link button'],
};

export default doc;
