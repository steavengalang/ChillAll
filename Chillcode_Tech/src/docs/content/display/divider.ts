import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'divider',
    global: 'ChillDivider',
    category: 'display',
    title: 'Divider',
    summary: 'Horizontal or vertical separators with optional label, dashed or dotted lines and gradient fades.',
    style: 'create',
    description:
        'ChillDivider draws a separator between sections of content. It can carry a label ("OR", "Today", a node), sit between inline items in vertical mode, ' +
        'and fade out with a gradient. It renders `role="separator"` with `aria-orientation`, or `role="none"` when purely decorative.\n\n' +
        'Labels are inserted as **text** unless you call `setLabel(html, true)` or pass `labelHtml` (trusted markup only). ' +
        'Colours passed through `color` and `gradient` are validated before they reach CSS.',
    features: [
        'Horizontal and vertical orientation, label aligned to start, center or end',
        'Solid, dashed and dotted lines, custom thickness and colour',
        'Gradient fade (automatic or your own colour stops)',
        'Spacing presets or an exact pixel margin',
        'Enhances existing `<hr>` or `<div>` elements with `init()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Plain and labelled',
            description: 'Without a label the divider is a single line; with a label the line splits around it.',
            code: `const p = (t) => { const e = document.createElement('p'); e.textContent = t; e.style.color = 'var(--chill-text)'; return e; };
root.append(p('Sign in with your work email'));
const a = ChillDivider.create({ label: 'OR', parent: root });
root.append(p('Continue with a single sign-on provider'));
const b = ChillDivider.create({ parent: root });
cleanup(() => { a.destroy(); b.destroy(); });`,
        },
        {
            id: 'align',
            title: 'Label alignment',
            description: '`align` moves the label to the `start`, `center` or `end` of the line.',
            code: `const items = ['start', 'center', 'end'].map((align) => ChillDivider.create({ label: 'align: ' + align, align, parent: root, spacing: 'sm' }));
cleanup(() => items.forEach((d) => d.destroy()));`,
        },
        {
            id: 'styles',
            title: 'Line styles and thickness',
            description: 'Solid, dashed and dotted lines; thickness is in pixels and `color` overrides the theme colour.',
            code: `const items = [
  ChillDivider.create({ lineStyle: 'solid', thickness: 2, parent: root, spacing: 'sm' }),
  ChillDivider.create({ lineStyle: 'dashed', color: '#3b82f6', parent: root, spacing: 'sm' }),
  ChillDivider.create({ lineStyle: 'dotted', thickness: 3, color: '#ec4899', label: 'Dotted', parent: root, spacing: 'sm' }),
];
cleanup(() => items.forEach((d) => d.destroy()));`,
        },
        {
            id: 'gradient',
            title: 'Gradient fades',
            description: '`gradient: true` fades the line in and out; pass an array of colours for a custom gradient (overrides `lineStyle`).',
            code: `const items = [
  ChillDivider.create({ gradient: true, parent: root, spacing: 'sm' }),
  ChillDivider.create({ gradient: ['#3b82f6', '#ec4899'], thickness: 3, parent: root, spacing: 'sm' }),
  ChillDivider.create({ gradient: true, label: 'Featured', parent: root, spacing: 'sm' }),
];
cleanup(() => items.forEach((d) => d.destroy()));`,
        },
        {
            id: 'vertical',
            title: 'Vertical divider',
            description: 'Between inline items in a flex row, for toolbars and breadcrumbs-style metadata.',
            code: `const row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;color:var(--chill-text)';
['Overview', 'Activity', 'Settings'].forEach((t, i) => {
  if (i) ChillDivider.create({ orientation: 'vertical', spacing: 12, parent: row });
  const s = document.createElement('span'); s.textContent = t; row.append(s);
});
root.append(row);
cleanup(() => row.remove());`,
        },
        {
            id: 'dynamic',
            title: 'Update and listen',
            description: 'Setters re-render the divider and emit `change`. `init()` upgrades an `<hr>` (labels are ignored for `<hr>`).',
            code: `const d = ChillDivider.create({ label: 'Step 1', parent: root });
const log = document.createElement('p');
log.style.cssText = 'color:var(--chill-text);font-size:13px';
root.append(log);
d.on('change', ({ option, value }) => { log.textContent = 'changed ' + option + ' -> ' + value; });
const t = setTimeout(() => d.setLabel('Step 2').setAlign('end').setLineStyle('dashed'), 900);
root.insertAdjacentHTML('beforeend', '<hr class="fancy">');
const hr = ChillDivider.init(root.querySelector('hr.fancy'), { lineStyle: 'dotted' });
cleanup(() => { clearTimeout(t); d.destroy(); hr.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Semantics',
            body:
                'By default a divider exposes `role="separator"` and `aria-orientation`, so assistive tech announces it as a break between sections. ' +
                'If the line is only decoration, pass `decorative: true`: the role becomes `none` and the divider disappears from the accessibility tree.\n\n' +
                'A real `<hr>` already has separator semantics, so `init()` keeps it as-is for horizontal dividers. Labels cannot be rendered inside an `<hr>`.',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** returns an instance with `.element`. Use `parent` to mount it, or append `.element` yourself.\n' +
                '- **`init(target, options)`** enhances an existing element: an element returns one instance, a selector or NodeList returns an array. `destroy()` restores the original attributes.\n\n' +
                '```js\nChillDivider.create({ label: "OR", align: "center", parent: form });\nChillDivider.init("hr.section", { lineStyle: "dashed" });\n```',
        },
    ],
    options: [
        { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Direction of the line.' },
        { name: 'label', type: 'string | Node', default: "''", description: 'Label text (inserted as text) or a node.' },
        { name: 'labelHtml', type: 'string', default: 'null', description: 'Explicit HTML label (trusted content only).' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Label position along the line.' },
        { name: 'lineStyle', type: "'solid' | 'dashed' | 'dotted'", default: "'solid'", description: 'Line pattern.' },
        { name: 'gradient', type: 'boolean | string[]', default: 'false', description: '`true` fades in and out; an array of CSS colours builds a custom gradient. Overrides `lineStyle`.' },
        { name: 'thickness', type: 'number', default: '1', description: 'Line thickness in px (capped at 32).' },
        { name: 'color', type: 'string', default: 'null', description: 'CSS colour override for the line.' },
        { name: 'spacing', type: "'none' | 'sm' | 'md' | 'lg' | number", default: "'md'", description: 'Margin around the divider (0, 8, 16, 24px) or an exact number of px.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Label font size.' },
        { name: 'decorative', type: 'boolean', default: 'false', description: 'Use `role="none"` instead of `role="separator"`.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class names.' },
        { name: 'parent', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'onChange', type: '(state, divider) => void', default: 'null', description: 'Called when a setter changes the divider. `state` is `{ option, value, divider }`.' },
    ],
    methods: [
        { signature: 'ChillDivider.create(options)', on: 'static', description: 'Create a divider; returns an instance.' },
        { signature: 'ChillDivider.init(target, options)', on: 'static', description: 'Enhance an element (one instance) or selector / list (array).' },
        { signature: 'ChillDivider.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'divider.element', description: 'The root element (`labelEl` holds the label span, or null).' },
        { signature: 'divider.setLabel(textOrNode, asHtml?)', description: 'Change the label; `asHtml` treats a string as trusted HTML.' },
        { signature: 'divider.setOrientation(o) / setAlign(a) / setLineStyle(s)', description: 'Change layout or line style. Invalid values are ignored.' },
        { signature: 'divider.setGradient(g)', description: 'Set `true`, `false` or an array of colours.' },
        { signature: 'divider.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'divider.destroy()', description: 'Remove the divider, or restore the element enhanced by `init()`.' },
    ],
    events: [
        { name: 'change', payload: '{ option, value, divider }', description: 'A setter changed the divider.' },
        { name: 'destroy', payload: '{ divider }', description: 'The instance was destroyed.' },
    ],
    cssVars: [
        { name: '--chilldivider-color', description: 'Default line colour.' },
        { name: '--chilldivider-text', description: 'Label colour.' },
        { name: '--chilldivider-primary', description: 'Focus ring colour.' },
    ],
    a11y: [
        'Renders `role="separator"` with `aria-orientation`; `decorative: true` switches to `role="none"`.',
        'Not focusable by default; a visible `:focus-visible` ring is provided if you add `tabindex`.',
        'High-contrast (forced-colors) mode draws the line in `CanvasText`.',
    ],
    tips: [
        'For a vertical divider, put it in a flex row with `align-items: center`, or give the parent a height; it stretches with `align-self: stretch`.',
        'The module is safe to import on the server; create dividers in the browser.',
        'In React, render a plain `<hr>` and call `ChillDivider.init(ref.current, opts)` in an effect.',
    ],
    related: ['card', 'timeline', 'tree'],
    keywords: ['separator', 'hr', 'rule', 'line', 'or'],
};

export default doc;
