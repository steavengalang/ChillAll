import type { DocEntry } from '../../types';

// Builds a bordered, fixed-height container with N text panes (the splitter itself enhances `host`).
const HOST = `const pane = (text) => { const d = document.createElement('div'); d.style.cssText = 'padding:12px;font-size:14px;color:var(--chill-text)'; d.textContent = text; return d; };
const mkHost = (height, labels) => {
  const h = document.createElement('div');
  h.style.cssText = 'height:' + height + 'px;border:1px solid var(--chill-border);border-radius:10px;overflow:hidden';
  labels.forEach((l) => h.append(pane(l)));
  root.append(h);
  return h;
};`;

const doc: DocEntry = {
    id: 'splitter',
    global: 'ChillSplitter',
    category: 'navigation',
    title: 'Splitter',
    summary: 'Resizable split panes with draggable, keyboard-accessible separators, collapsing and persistence.',
    style: 'init',
    description:
        'ChillSplitter turns the direct children of a container into resizable panes, like the editor and preview panels of an IDE. Drag a separator, use the arrow keys, or call the API. ' +
        'Panes can be limited with `minSize` / `maxSize`, collapsed with a double-click or Enter, and their sizes can be remembered in `localStorage`.\n\n' +
        '`ChillSplitter.init(container, options)` enhances an element that already holds at least two child elements; the container needs a height (and width) from your CSS. ' +
        '`ChillSplitter.create({ panes: [...] })` builds the container for you and exposes it as `instance.element`. Splitters can be nested for complex layouts.',
    features: [
        'Horizontal (side by side) or vertical (stacked) splits with any number of panes',
        'Per-pane `minSize` and `maxSize` in pixels, sizes expressed in percent',
        'Collapsible panes (double-click or Enter on the separator) with `collapse()` / `expand()`',
        'Keyboard resizing: arrows, Shift for 10x, Home / End; separators use `role="separator"` with `aria-valuenow`',
        'Optional persistence of sizes via `storageKey`; events for resize, collapse and drag',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Two panes',
            description: 'Wrap two elements in a container with a height, call `init`, and drag the separator. `sizes` are percentages.',
            height: 200,
            code: `${HOST}
const host = mkHost(160, ['Editor: drag the divider to resize.', 'Preview']);
const s = ChillSplitter.init(host, { sizes: [60, 40], minSize: 80 });
cleanup(() => s.destroy());`,
        },
        {
            id: 'vertical',
            title: 'Vertical and nested splits',
            description: 'A `vertical` split stacks panes. Initialise a splitter inside a pane to build IDE-style layouts.',
            height: 300,
            code: `${HOST}
const outer = mkHost(260, ['Files', '']);
const inner = document.createElement('div');
inner.style.height = '100%';
inner.append(pane('Code'), pane('Terminal'));
outer.children[1].replaceWith(inner);
const a = ChillSplitter.init(outer, { sizes: [25, 75], minSize: 90 });
const b = ChillSplitter.init(inner, { direction: 'vertical', sizes: [70, 30], minSize: 40 });
cleanup(() => { b.destroy(); a.destroy(); });`,
        },
        {
            id: 'collapsible',
            title: 'Collapsible sidebar',
            description: 'Mark panes as `collapsible` and double-click the separator (or press Enter on it). `collapsedSize` leaves a thin strip instead of hiding the pane completely.',
            height: 220,
            code: `${HOST}
const host = mkHost(160, ['Sidebar (collapsible)', 'Main content']);
const s = ChillSplitter.init(host, { sizes: [30, 70], minSize: [100, 200], collapsible: [0] });
const btn = ChillButton.create({ text: 'Toggle sidebar', size: 'sm', variant: 'outline' });
btn.style.marginTop = '12px';
btn.onclick = () => s.toggle(0);
root.append(btn);
cleanup(() => s.destroy());`,
        },
        {
            id: 'three-panes',
            title: 'Three panes with limits',
            description: 'Use arrays for per-pane `minSize` / `maxSize` (px). The middle pane here can never grow beyond 320px.',
            height: 200,
            code: `${HOST}
const host = mkHost(150, ['Navigator', 'Canvas (max 320px)', 'Inspector']);
const s = ChillSplitter.init(host, {
  sizes: [25, 50, 25],
  minSize: [80, 120, 80],
  maxSize: [Infinity, 320, Infinity],
  gutterSize: 10,
});
cleanup(() => s.destroy());`,
        },
        {
            id: 'events',
            title: 'Events and persistence',
            description: '`onResize` receives the sizes in percent. With a `storageKey` the layout survives page reloads. `create()` builds the container for you.',
            height: 240,
            code: `const out = document.createElement('p');
out.style.cssText = 'font-size:13px;margin:0 0 10px;color:var(--chill-text)';
out.textContent = 'Drag the divider...';
const s = ChillSplitter.create({
  panes: ['Left pane', 'Right pane'],
  sizes: [50, 50],
  minSize: 60,
  storageKey: 'docs-splitter-demo',
  onResize: (sizes) => { out.textContent = 'Sizes: ' + sizes.map((n) => n.toFixed(1) + '%').join(' / '); },
});
s.element.style.cssText = 'height:140px;border:1px solid var(--chill-border);border-radius:10px;overflow:hidden;color:var(--chill-text)';
const reset = ChillButton.create({ text: 'Reset', size: 'sm', variant: 'outline' });
reset.style.marginTop = '10px';
reset.onclick = () => s.reset();
root.append(out, s.element, reset);
cleanup(() => s.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Container requirements',
            body:
                'Panes are the **direct element children** of the container (at least two, otherwise `init` throws). The splitter gives the container `display: flex; width: 100%; height: 100%`, so give it, or its parent, a real height. ' +
                'It inserts a separator after every pane except the last, and `destroy()` removes them and restores the original classes, styles and ids.\n\n' +
                '```html\n<div id="split" style="height: 400px">\n  <div>Left</div>\n  <div>Right</div>\n</div>\n<script>\n  ChillSplitter.init("#split", { sizes: [30, 70], minSize: 120 });\n</script>\n```',
        },
        {
            title: 'Sizes, limits and collapsing',
            body:
                '`sizes` are percentages, one per pane, normalised to 100 (default: equal). `minSize` and `maxSize` are pixels and accept a number (all panes) or an array. ' +
                'A collapsed pane shrinks to `collapsedSize` px (default 0) and is hidden from assistive technology; dragging or pressing an arrow key toward it re-opens it, and `expand(i)` restores its previous size. The last open pane can never be collapsed.\n\n' +
                'On a separator, Enter or a double-click collapses the neighbouring collapsible pane, or resets all sizes when neither side is collapsible.',
        },
        {
            title: 'Persistence',
            body:
                'Set `storageKey: "layout"` and sizes are saved to `localStorage` under `chillsplitter:layout` after every change and applied on the next `init`, as long as the pane count matches. Blocked storage is ignored silently.',
        },
    ],
    options: [
        { name: 'direction', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: '`horizontal` puts panes side by side; `vertical` stacks them.' },
        { name: 'sizes', type: 'number[]', default: 'equal split', description: 'Initial sizes in percent, one per pane (normalised to 100).' },
        { name: 'minSize', type: 'number | number[]', default: '50', description: 'Minimum pane size in px (single value or one per pane).' },
        { name: 'maxSize', type: 'number | number[]', default: 'Infinity', description: 'Maximum pane size in px.' },
        { name: 'gutterSize', type: 'number', default: '8', description: 'Separator thickness in px.' },
        { name: 'step', type: 'number', default: '10', description: 'Keyboard step in px (Shift multiplies by 10).' },
        { name: 'collapsible', type: 'boolean | number[]', default: 'false', description: '`true` allows every pane to collapse; an array lists the pane indexes that may.' },
        { name: 'collapsedSize', type: 'number', default: '0', description: 'Size in px of a collapsed pane.' },
        { name: 'animate', type: 'boolean', default: 'true', description: 'Animate size changes made through the API or keyboard (disabled while dragging).' },
        { name: 'storageKey', type: 'string', default: 'null', description: 'Persist sizes in `localStorage` (`chillsplitter:<key>`).' },
        { name: 'ariaLabel', type: 'string', default: "'Resize panels'", description: '`aria-label` of every separator.' },
        { name: 'panes', type: '(string | Element)[]', default: '[]', description: '`create()` only: the panes to build the container from. Strings become text divs.' },
        { name: 'onResize', type: '(sizes: number[], instance) => void', default: 'undefined', description: 'Called on every size change, with percentages.' },
        { name: 'onCollapse', type: '(index: number, collapsed: boolean, instance) => void', default: 'undefined', description: 'Called when a pane collapses or expands.' },
        { name: 'onDragStart', type: '(instance) => void', default: 'undefined', description: 'A drag began.' },
        { name: 'onDragEnd', type: '(sizes: number[], instance) => void', default: 'undefined', description: 'A drag ended.' },
    ],
    methods: [
        { signature: 'ChillSplitter.init(container, options)', on: 'static', description: 'Enhance a container (selector or element) and return an instance. Throws if it is missing or has fewer than two element children.' },
        { signature: 'ChillSplitter.create(options)', on: 'static', description: 'Build the container from `options.panes`; the element is available as `instance.element`.' },
        { signature: 'ChillSplitter.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getSizes()', description: 'Current sizes in percent.' },
        { signature: 'instance.setSizes(sizes)', description: 'Set sizes (one value per pane; limits are enforced). Expands collapsed panes. Throws on a wrong length.' },
        { signature: 'instance.collapse(i) / expand(i) / toggle(i)', description: 'Collapse or restore a pane. Return the instance.' },
        { signature: 'instance.isCollapsed(i)', description: 'Whether a pane is collapsed.' },
        { signature: 'instance.reset()', description: 'Return to the initial sizes.' },
        { signature: 'instance.refresh()', description: 'Re-apply the layout after the container size or visibility changed.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `resize`, `collapse`, `dragstart` or `dragend`. Returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove separators and listeners and restore the original DOM.' },
    ],
    events: [
        { name: 'resize', payload: '(sizes, instance)', description: 'Sizes changed (drag, keyboard or API).' },
        { name: 'collapse', payload: '(index, collapsed, instance)', description: 'A pane collapsed or expanded.' },
        { name: 'dragstart', payload: '(instance)', description: 'Pointer drag started.' },
        { name: 'dragend', payload: '(sizes, instance)', description: 'Pointer drag finished.' },
    ],
    cssVars: [
        { name: '--chillsplitter-gutter', description: 'Separator background.' },
        { name: '--chillsplitter-gutter-hover', description: 'Separator colour on hover, focus and drag.' },
        { name: '--chillsplitter-handle', description: 'Grip mark colour.' },
        { name: '--chillsplitter-ring', description: 'Focus ring colour.' },
    ],
    a11y: [
        'Separators have `role="separator"`, `tabindex="0"`, `aria-orientation`, `aria-controls`, `aria-label` and `aria-valuenow / min / max` in percent.',
        'Arrow keys along the split axis resize by `step` px (Shift = 10x); Home and End jump to the limits.',
        'Enter (or double-click) collapses a collapsible neighbour or resets sizes; collapsible separators expose `aria-expanded`, collapsed panes `aria-hidden`.',
    ],
    tips: [
        'Panes scroll on their own (`overflow: auto`), so avoid giving them fixed heights.',
        'Call `refresh()` after showing a previously hidden splitter, as sizes can only be measured when it is visible.',
        'Splitters initialised on elements in a framework should be destroyed on unmount to remove the window resize listener.',
    ],
    related: ['layout', 'sidebar', 'tabs'],
    keywords: ['resizable', 'panes', 'divider', 'gutter', 'resize', 'ide'],
};

export default doc;
