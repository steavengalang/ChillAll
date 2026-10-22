import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'stat',
    global: 'ChillStat',
    category: 'display',
    title: 'Stat',
    summary: 'KPI cards with formatted values, trend delta, sparkline, count-up animation and a skeleton state.',
    style: 'create',
    description:
        'ChillStat is a dashboard KPI tile: a label, a big number, an optional trend chip ("+12.4% vs last month") and an inline sparkline. ' +
        'Values are formatted with `Intl.NumberFormat` (or your own `formatter`) and can animate from the previous value with `countUp`.\n\n' +
        '`ChillStat.create()` returns an instance whose `element` you append yourself; `ChillStat.init()` enhances an existing element and reads `data-label`, `data-value` and `data-delta`. ' +
        'All text is inserted as text, never as HTML.',
    features: [
        'Locale-aware number formatting with prefix, suffix, decimals or a custom formatter',
        'Trend chip with direction arrow; `invertDelta` for metrics where down is good',
        'Inline SVG sparkline as `line`, `area` or `bar`',
        '`countUp` animation and live updates via `update()` / `setValue()`',
        'Three sizes, three variants, skeleton loading and an optional clickable mode',
    ],
    examples: [
        {
            id: 'basic',
            title: 'A single KPI',
            description: 'Label, value, prefix and a trend delta. The sign of `delta` sets the arrow and colour.',
            code: `const s = ChillStat.create({
  label: 'Monthly revenue',
  value: 128450,
  prefix: '$',
  delta: 12.4,
  deltaLabel: 'vs last month',
});
root.append(s.element);
cleanup(() => s.destroy());`,
        },
        {
            id: 'dashboard',
            title: 'Dashboard row',
            description: 'Several stats in a grid. `invertDelta` marks a falling churn rate as good (green).',
            height: 200,
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px';
const stats = [
  { label: 'Active users', value: 8421, delta: 4.2, icon: '\\ud83d\\udc64' },
  { label: 'Churn rate', value: 2.1, suffix: '%', decimals: 1, delta: -0.6, invertDelta: true, icon: '\\ud83d\\udcc9' },
  { label: 'Open tickets', value: 37, delta: 0, deltaLabel: 'unchanged' },
].map((o) => { const s = ChillStat.create(o); root.append(s.element); return s; });
cleanup(() => stats.forEach((s) => s.destroy()));`,
        },
        {
            id: 'sparkline',
            title: 'Sparklines',
            description: '`sparkline` takes an array of numbers; `sparklineType` picks `area` (default), `line` or `bar`, and `color` sets the accent.',
            height: 220,
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px';
const data = [3, 5, 4, 8, 7, 11, 14, 12, 16];
const stats = [['area', '#3b82f6'], ['line', '#10b981'], ['bar', '#f59e0b']].map(([type, color]) => {
  const s = ChillStat.create({ label: 'Signups (' + type + ')', value: 1240, sparkline: data, sparklineType: type, color, delta: 8.1 });
  root.append(s.element);
  return s;
});
cleanup(() => stats.forEach((s) => s.destroy()));`,
        },
        {
            id: 'countup',
            title: 'Count-up and live updates',
            description: '`countUp: true` (or a duration in ms) animates to the value. `update()` animates from the current number to the next.',
            height: 160,
            code: `const s = ChillStat.create({
  label: 'Downloads today',
  value: 12500,
  countUp: 1200,
  delta: 3.5,
  formatter: (v) => Math.round(v).toLocaleString('en-US'),
});
root.append(s.element);
const t = setInterval(() => s.update({ value: s.options.value + Math.round(Math.random() * 400), delta: +(Math.random() * 10).toFixed(1) }), 2500);
cleanup(() => { clearInterval(t); s.destroy(); });`,
        },
        {
            id: 'states',
            title: 'Loading and clickable',
            description: '`loading` shows a skeleton. `onClick` turns the tile into a keyboard-accessible button, for drill-down.',
            height: 180,
            code: `const s = ChillStat.create({
  label: 'Conversion rate', value: 3.8, suffix: '%', decimals: 1, variant: 'filled', size: 'lg', loading: true,
  onClick: () => console.log('open report'),
});
root.append(s.element);
const t = setTimeout(() => s.setLoading(false), 1600);
cleanup(() => { clearTimeout(t); s.destroy(); });`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` reads `data-label`, `data-value` and `data-delta` from the element.',
            code: `root.innerHTML = '<div id="orders" data-label="Orders" data-value="932" data-delta="-1.8"></div>';
const s = ChillStat.init('#orders', { variant: 'flat' });
cleanup(() => s.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Formatting',
            body:
                'By default the number goes through `Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })`. ' +
                'Use `locale` for another region, or a `formatter(number)` to take over completely (compact numbers, currencies, durations). ' +
                '`prefix` and `suffix` are added around the formatted value.\n\n' +
                'Pass a string `value` to show it verbatim, such as "N/A". The delta defaults to `Math.abs(delta) + "%"`; use `deltaFormatter` to change it.',
        },
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** builds a `<div>` in `stat.element`; append it yourself.\n' +
                '- **`init(target, options)`** takes a selector or element, rebuilds its content and returns an instance or `null`. `destroy()` clears the content and restores the classes.\n\n' +
                '`update(partial)` merges new options and re-renders, so you can change the value, delta, sparkline or any other option in one call.',
        },
    ],
    options: [
        { name: 'label', type: 'string', default: "''", description: 'Caption above the value.' },
        { name: 'value', type: 'number | string', default: '0', description: 'The headline value.' },
        { name: 'prefix / suffix', type: 'string', default: "''", description: 'Text before and after the formatted value.' },
        { name: 'formatter', type: '(number) => string', default: 'Intl.NumberFormat', description: 'Custom number formatter.' },
        { name: 'locale', type: 'string', default: 'undefined', description: 'BCP-47 locale for the default formatter.' },
        { name: 'decimals', type: 'number', default: '0', description: 'Fraction digits for the default formatter.' },
        { name: 'delta', type: 'number', default: 'null', description: 'Percent change; the sign sets the direction.' },
        { name: 'deltaFormatter', type: '(number) => string', default: 'v => Math.abs(v) + "%"', description: 'Format the delta text.' },
        { name: 'deltaLabel', type: 'string', default: "''", description: 'Text after the delta chip, such as "vs last month".' },
        { name: 'invertDelta', type: 'boolean', default: 'false', description: 'Treat a decrease as good (green) and an increase as bad.' },
        { name: 'sparkline', type: 'number[]', default: 'null', description: 'Data points for the inline chart.' },
        { name: 'sparklineType', type: "'line' | 'area' | 'bar'", default: "'area'", description: 'Chart style.' },
        { name: 'color', type: 'string', default: 'null', description: 'Accent colour for the sparkline (any CSS colour); defaults to the theme blue.' },
        { name: 'icon', type: 'string | Node', default: 'null', description: 'Text, emoji or node shown in a badge (decorative, `aria-hidden`).' },
        { name: 'countUp', type: 'boolean | number', default: 'false', description: 'Animate to the value; a number sets the duration in ms.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tile size.' },
        { name: 'variant', type: "'outlined' | 'filled' | 'flat'", default: "'outlined'", description: 'Visual style.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Show the skeleton.' },
        { name: 'onClick', type: '(event) => void', default: 'null', description: 'Makes the tile a focusable button.' },
    ],
    methods: [
        { signature: 'ChillStat.create(options)', on: 'static', description: 'Create a stat; append `instance.element` yourself.' },
        { signature: 'ChillStat.init(target, options)', on: 'static', description: 'Enhance an element (reads `data-label`, `data-value`, `data-delta`); returns an instance or `null`.' },
        { signature: 'ChillStat.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'stat.element', description: 'The root element.' },
        { signature: 'stat.update(partial)', description: 'Merge options and re-render (animates when `countUp` is set).' },
        { signature: 'stat.setValue(value)', description: 'Shortcut for `update({ value })`.' },
        { signature: 'stat.setLoading(bool)', description: 'Toggle the skeleton.' },
        { signature: 'stat.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'stat.destroy()', description: 'Cancel animation, remove listeners and generated DOM.' },
    ],
    events: [
        { name: 'update', payload: '(value)', description: 'The stat re-rendered after `update()`.' },
        { name: 'countend', payload: '(value)', description: 'A count-up animation reached its final value.' },
        { name: 'click', payload: '(event)', description: 'The tile was clicked or activated by keyboard (only with `onClick`).' },
    ],
    cssVars: [
        { name: '--chillstat-primary', description: 'Default accent and focus colour.' },
        { name: '--chillstat-up / --chillstat-down', description: 'Good and bad trend colours.' },
        { name: '--chillstat-up-bg / --chillstat-down-bg', description: 'Trend chip backgrounds.' },
        { name: '--chillstat-bg / --chillstat-surface', description: 'Tile and filled-variant backgrounds.' },
        { name: '--chillstat-text / --chillstat-muted / --chillstat-border', description: 'Text and border colours.' },
    ],
    a11y: [
        'Default role is `group`, labelled by the label and value elements so a screen reader reads "Revenue $128,450".',
        'With `onClick` the tile becomes `role="button"` with `tabindex="0"` and an `aria-label` of "label: value"; Enter and Space activate it.',
        'The trend arrow is hidden from assistive tech and replaced by visually hidden "Increased by" / "Decreased by" text.',
        'Icons are `aria-hidden`. Count-up animation reduces to the final value for reduced-motion users.',
    ],
    tips: [
        'Colour is not the only trend signal: the arrow and hidden text carry direction. Use `invertDelta` so green always means good.',
        'Pass numbers, not preformatted strings, so countUp and the formatter can work.',
        'The module is safe to import on the server; create stats in the browser and `destroy()` them on unmount.',
    ],
    related: ['card', 'progress', 'badge', 'countdown'],
    keywords: ['kpi', 'metric', 'number', 'dashboard', 'trend', 'sparkline', 'counter'],
};

export default doc;
