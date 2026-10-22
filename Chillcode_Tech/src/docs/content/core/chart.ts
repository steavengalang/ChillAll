import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'chart',
    global: 'ChillChart',
    category: 'core',
    title: 'Chart',
    summary: 'Canvas line, bar, pie and doughnut charts with tooltips, toggleable legend and keyboard access.',
    style: 'create',
    description:
        'ChillChart draws line, bar, pie and doughnut charts on a `<canvas>` with no dependencies. Pass `labels` and `datasets`; it fits itself to the container, redraws on resize and theme changes, ' +
        'and gives you hover, touch and keyboard tooltips plus a legend that shows and hides series.\n\n' +
        'The chart fills its container, so give the container a height (or rely on the `minHeight` option, 200px by default). Tooltip and legend text is always escaped, and a hidden data table ' +
        'is generated for screen readers.',
    features: [
        'Line, bar (grouped) and pie / doughnut types with a theme-aware canvas',
        'Interactive legend: click an item to hide or show a dataset or slice',
        'Tooltips on hover, touch and keyboard (arrow keys), with `tooltipFormat` for custom text',
        'Responsive via ResizeObserver; follows `data-theme`, `.dark` and `prefers-color-scheme`',
        '`update(data)` to redraw with new data; `click` and `toggle` events',
        'Accessible: `role="img"`, generated label and a visually hidden data table',
    ],
    examples: [
        {
            id: 'line',
            title: 'Line chart',
            description: 'Two datasets over twelve months. Hover a point for a tooltip; click a legend item to hide a series.',
            height: 320,
            code: `const chart = ChillChart.create(root, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { label: 'Revenue', data: [12, 15, 14, 19, 24, 22, 28, 31, 29, 35, 38, 44], color: '#3b82f6' },
      { label: 'Costs', data: [9, 10, 11, 12, 14, 15, 16, 18, 18, 20, 21, 23], color: '#f59e0b' },
    ],
  },
  options: { ariaLabel: 'Revenue and costs by month, in thousands of dollars' },
});
cleanup(() => chart.destroy());`,
        },
        {
            id: 'bar',
            title: 'Grouped bar chart',
            description: 'Several datasets are drawn side by side per label. Negative values grow below the zero line.',
            height: 320,
            code: `const chart = ChillChart.create(root, {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      { label: '2024', data: [42, 51, 47, 63], color: '#6366f1' },
      { label: '2025', data: [55, 60, 52, 78], color: '#22c55e' },
      { label: 'Delta', data: [13, 9, 5, 15], color: '#ec4899' },
    ],
  },
  options: { showGrid: true, tooltipFormat: (i) => i.label + ' / ' + i.dataset.label + ': ' + i.value + 'k' },
});
cleanup(() => chart.destroy());`,
        },
        {
            id: 'doughnut',
            title: 'Doughnut and pie',
            description: 'Pie types use the first dataset; give it a `colors` array for one colour per slice. Tooltips include the percentage.',
            height: 320,
            code: `const chart = ChillChart.create(root, {
  type: 'doughnut',
  data: {
    labels: ['Organic', 'Paid', 'Referral', 'Email'],
    datasets: [{ label: 'Visits', data: [540, 230, 120, 90], colors: ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'] }],
  },
});
cleanup(() => chart.destroy());`,
        },
        {
            id: 'events-update',
            title: 'Live data and events',
            description: 'Call `update(data)` to redraw, and react to `click` and `toggle` events for drill-downs.',
            height: 400,
            code: `const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap';
const status = document.createElement('span');
status.style.cssText = 'font-size:13px;color:var(--chill-text)';
status.textContent = 'Click a bar';
const btn = document.createElement('button');
btn.textContent = 'Refresh data';
bar.append(btn, status);
const host = document.createElement('div');
host.style.height = '300px';
root.append(bar, host);
const make = () => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [{ label: 'Signups', data: Array.from({ length: 5 }, () => 10 + Math.round(Math.random() * 40)), color: '#0ea5e9' }],
});
const chart = ChillChart.create(host, { type: 'bar', data: make() });
chart.on('click', (info) => { status.textContent = info.label + ': ' + info.value + ' signups'; });
chart.on('toggle', (index, visible) => { status.textContent = 'Dataset ' + index + (visible ? ' shown' : ' hidden'); });
btn.onclick = () => chart.update(make());
cleanup(() => chart.destroy());`,
        },
        {
            id: 'sparkline',
            title: 'Compact sparkline-style chart',
            description: 'Turn off the legend and grid, shrink the padding and use a transparent background for a small inline trend.',
            height: 140,
            code: `const host = document.createElement('div');
host.style.cssText = 'height:100px;max-width:360px';
root.append(host);
const chart = ChillChart.create(host, {
  type: 'line',
  data: {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{ label: 'Latency (ms)', data: [120, 118, 130, 125, 110, 105, 112, 98, 101, 92], color: '#10b981' }],
  },
  options: { showLegend: false, showGrid: false, padding: 12, minHeight: 80, background: 'transparent' },
});
cleanup(() => chart.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Data shapes',
            body:
                '```js\n{\n  labels: [\'A\', \'B\', \'C\'],\n  datasets: [ { label: \'Sales\', data: [3, 5, 2], color: \'#3b82f6\' } ]\n}\n```\n\n' +
                '- **line / bar**: every dataset is one series. `color` falls back to a built-in 8-colour palette.\n' +
                '- **pie / doughnut**: only `datasets[0]` is used. `labels[i]` names slice `i` and `datasets[0].colors[i]` sets its colour. The legend lists slices, not datasets.\n\n' +
                'Non-numeric values are treated as `0`, and line charts always include `0` on the Y axis. Axis tick labels are not drawn: use tooltips, or render the numbers yourself.',
        },
        {
            title: 'Sizing, theme and redraws',
            body:
                'The canvas fills `.chillchart`, which is `width: 100%; height: 100%` of the container. Give the container an explicit height, or let `minHeight` (default 200) apply. ' +
                'A ResizeObserver redraws when the container changes size, so charts work in flex and grid layouts and in tabs that are shown later.\n\n' +
                'Drawing colours come from the page theme: `<html data-theme>`, `.dark` / `.light`, otherwise `prefers-color-scheme`. A MutationObserver redraws when you toggle it. ' +
                'Pass `background` to override the canvas fill, or `\'transparent\'` for none.',
        },
        {
            title: 'Interaction and events',
            body:
                'Tooltips follow the pointer on desktop and touch. Focus the canvas and use the arrow keys to move between points, Enter or Space to trigger a click, Escape to hide the tooltip.\n\n' +
                '`tooltipFormat(info)` returns a string, where `info` is `{ label, value, dataset, datasetIndex, index, percent? }` (`percent` exists for pie slices). ' +
                'Subscribe with `chart.on(\'click\', info => ...)` or the `onPointClick` option; `toggle` / `onLegendToggle` fire with `(index, visible)`. ' +
                '`chart.toggleDataset(index, visible?)` and `getHidden()` let you control and read the hidden state from your own UI.',
        },
    ],
    options: [
        { name: 'type', type: "'line' | 'bar' | 'pie' | 'doughnut'", default: "'line'", description: 'Chart type.' },
        { name: 'data.labels', type: 'string[]', default: '[]', description: 'X-axis labels (or slice names for pie types).' },
        { name: 'data.datasets', type: 'Dataset[]', default: '[]', description: 'Series to draw.' },
        { name: 'data.datasets[].label', type: 'string', default: "'Dataset N'", description: 'Legend and tooltip name.' },
        { name: 'data.datasets[].data', type: 'number[]', default: '-', description: 'Values, one per label.' },
        { name: 'data.datasets[].color', type: 'string', default: 'palette', description: 'CSS colour for the series (line / bar).' },
        { name: 'data.datasets[].colors', type: 'string[]', default: 'palette', description: 'Per-slice colours (pie / doughnut, first dataset).' },
        { name: 'options.padding', type: 'number', default: '40', description: 'Space around the plot area in px.' },
        { name: 'options.showGrid', type: 'boolean', default: 'true', description: 'Draw horizontal grid lines.' },
        { name: 'options.showLegend', type: 'boolean', default: 'true', description: 'Show the legend under the chart.' },
        { name: 'options.legendToggle', type: 'boolean', default: 'true', description: 'Legend items are buttons that hide or show a series or slice.' },
        { name: 'options.tooltip', type: 'boolean', default: 'true', description: 'Enable hover, touch and keyboard tooltips.' },
        { name: 'options.tooltipFormat', type: '(info) => string', default: 'null', description: 'Custom tooltip text. `info` is `{ label, value, dataset, datasetIndex, index, percent? }`. Output is escaped.' },
        { name: 'options.minHeight', type: 'number', default: '200', description: 'Minimum chart height in px when the container has none.' },
        { name: 'options.background', type: 'string', default: 'theme', description: "Canvas background colour, or 'transparent'." },
        { name: 'options.ariaLabel', type: 'string', default: 'generated', description: 'Accessible name of the chart.' },
        { name: 'options.animation', type: 'boolean', default: 'true', description: 'Reserved. Charts currently draw instantly.' },
        { name: 'options.onPointClick', type: '(info) => void', default: 'null', description: 'Called when a point, bar or slice is clicked or activated by keyboard.' },
        { name: 'options.onLegendToggle', type: '(index: number, visible: boolean) => void', default: 'null', description: 'Called when a legend item toggles.' },
    ],
    methods: [
        { signature: 'ChillChart.create(container, config)', on: 'static', description: '`container` is a selector or element (its content is replaced). Returns an instance.' },
        { signature: 'ChillChart.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.update(data)', description: 'Replace `{ labels, datasets }` and redraw. Hidden indices that no longer exist are dropped.' },
        { signature: 'instance.render()', description: 'Redraw with the current data and theme.' },
        { signature: 'instance.resize()', description: 'Re-measure the container (done automatically by the ResizeObserver).' },
        { signature: 'instance.toggleDataset(index, visible?)', description: 'Show or hide a dataset (or pie slice); toggles when `visible` is omitted.' },
        { signature: 'instance.getHidden()', description: 'Array of hidden indices.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event handler. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Disconnect observers, remove listeners and the DOM.' },
    ],
    events: [
        { name: 'click', payload: 'info: { label, value, dataset, datasetIndex, index, percent? }', description: 'A point, bar or slice was clicked or activated with Enter / Space.' },
        { name: 'toggle', payload: 'index: number, visible: boolean', description: 'A dataset or slice was shown or hidden.' },
    ],
    cssVars: [
        { name: '--chillchart-text / --chillchart-text-light', description: 'Legend text colours (canvas text follows the page theme).' },
        { name: '--chillchart-tooltip-bg / --chillchart-tooltip-text', description: 'Tooltip surface and text.' },
        { name: '--chillchart-focus', description: 'Focus ring colour of the canvas and legend buttons.' },
    ],
    a11y: [
        'The canvas has `role="img"`, `tabindex="0"` and an `aria-label` (your `ariaLabel` or a generated summary).',
        'A visually hidden `<table>` mirrors every label and value for screen readers.',
        'Arrow keys move through points, Enter or Space activates, Escape hides the tooltip; the tooltip is linked with `aria-describedby`.',
        'Legend entries are real buttons with `aria-pressed`. Tooltip text is escaped.',
        'Tooltip transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Always size the container: `<div style="height:320px">`. A zero-height container with no `minHeight` draws nothing.',
        '`create()` empties its container, so put other controls beside it, not inside it.',
        'Canvas is bitmap based: charts are crisp on high-DPI screens because the canvas is scaled by `devicePixelRatio`.',
        'In React, create the chart in an effect on a ref, call `update()` when data changes and `destroy()` in the cleanup.',
        'SSR-safe: nothing runs until `create()` receives a container in the browser.',
    ],
    related: ['table', 'progress', 'stat'],
    keywords: ['graph', 'plot', 'canvas', 'analytics', 'dashboard', 'visualization', 'sparkline', 'pie'],
};

export default doc;
