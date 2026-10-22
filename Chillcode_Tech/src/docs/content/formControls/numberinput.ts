import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'numberinput',
    global: 'ChillNumberInput',
    category: 'formControls',
    title: 'Number Input',
    summary: 'Numeric stepper with +/- buttons, limits, precision, prefix/suffix, separators and hold-to-repeat.',
    style: 'create',
    description:
        'ChillNumberInput is a text field that edits a number. It parses what the user types, clamps it to `min` / `max`, snaps it to the configured precision and re-formats it (for example `$1,250.00`) on commit, while `getValue()` always returns a real `number` or `null`.\n\n' +
        '`ChillNumberInput.create()` returns an instance (the root is `instance.element`, the text field is `instance.input`); pass `container` to mount it, or use `ChillNumberInput.init(target, options)` to mount into an existing element. Prefix and suffix are inserted as **text**.',
    features: [
        '+/- buttons with hold-to-repeat that accelerates, plus ArrowUp/Down, PageUp/PageDown and optional mouse wheel',
        '`min`, `max`, `step` and `precision` (inferred from step and min by default)',
        'Prefix, suffix, thousand/decimal separators, or fully custom `formatter` and `parser`',
        'Empty handling: commit `null` or restore the previous value with `allowEmpty: false`',
        'Exposes a real number via `getValue()` and a hidden input with the raw value for forms',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Quantity stepper',
            description: 'The classic +/- control with limits. The buttons disable themselves at `min` and `max`.',
            code: `root.style.maxWidth = '200px';
const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const n = ChillNumberInput.create({
  value: 2, min: 1, max: 10, step: 1,
  label: 'Quantity',
  container: root,
  onChange: (v) => (out.textContent = 'Quantity: ' + v),
});
out.textContent = 'Quantity: ' + n.getValue();
root.append(out);
cleanup(() => n.destroy());`,
        },
        {
            id: 'currency',
            title: 'Currency formatting',
            description: '`prefix`, `thousandSeparator` and `precision` format the display. Type "1250" and leave the field to see it become $1,250.00.',
            code: `root.style.maxWidth = '260px';
const n = ChillNumberInput.create({
  value: 1249.5,
  prefix: '$',
  thousandSeparator: ',',
  precision: 2,
  step: 0.5,
  min: 0,
  label: 'Budget',
  size: 'lg',
  container: root,
});
cleanup(() => n.destroy());`,
        },
        {
            id: 'european',
            title: 'European separators and suffix',
            description: 'Use `decimalSeparator: ","` with `thousandSeparator: "."`. The suffix is stripped automatically when parsing.',
            code: `root.style.maxWidth = '260px';
const n = ChillNumberInput.create({
  value: 72.5,
  step: 0.1,
  suffix: ' kg',
  decimalSeparator: ',',
  thousandSeparator: '.',
  min: 0,
  max: 500,
  label: 'Weight',
  container: root,
});
cleanup(() => n.destroy());`,
        },
        {
            id: 'input-only',
            title: 'Input only, wheel and large steps',
            description: '`controls: false` hides the buttons, `wheel` enables the mouse wheel while focused, and Shift+Arrow / PageUp / PageDown use `largeStep`.',
            code: `root.style.maxWidth = '200px';
const n = ChillNumberInput.create({
  value: 50,
  min: 0, max: 100, step: 1, largeStep: 25,
  controls: false,
  wheel: true,
  suffix: '%',
  size: 'sm',
  placeholder: 'Opacity',
  label: 'Opacity',
  container: root,
});
cleanup(() => n.destroy());`,
        },
        {
            id: 'api',
            title: 'Events, formatter and control from code',
            description: '`on("input")` fires while typing parsable values; `on("change")` fires on commit. `increment` / `decrement` and `setValue(v, silent)` drive it programmatically.',
            code: `root.style.maxWidth = '280px';
const log = document.createElement('p');
log.style.cssText = 'margin:10px 0;font-size:13px;color:var(--chill-text)';
const n = ChillNumberInput.init(root.appendChild(document.createElement('div')), {
  value: 90, min: 0, max: 240, step: 5,
  formatter: (v) => v + ' min',
  parser: (t) => { const m = /\\d+/.exec(t); return m ? +m[0] : null; },
  label: 'Duration',
  name: 'duration',
});
const offIn = n.on('input', (v) => (log.textContent = 'typing: ' + v));
const offCh = n.on('change', (v) => (log.textContent = 'committed: ' + v));
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px';
[['+30', () => n.increment(30)], ['-30', () => n.decrement(30)], ['Reset', () => n.setValue(90)]].forEach(([t, fn]) => {
  const b = document.createElement('button');
  b.textContent = t;
  b.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.onclick = fn;
  bar.append(b);
});
root.append(log, bar);
cleanup(() => { offIn(); offCh(); n.destroy(); });`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element` and the text field is `instance.input`.\n\n' +
                '- **`create(options)`** builds the control. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new control into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `setValue(v, silent?)`, `increment(n?)`, `decrement(n?)`, `focus()`, `setDisabled(bool)`, `setReadonly(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Parsing, formatting and commits',
            body:
                'While the user types, `onInput` fires with the clamped, rounded value of any parsable text. When the field blurs, Enter is pressed or an arrow key is used, the text is *committed*: parsed, clamped to `min`/`max`, rounded to `precision`, re-formatted and `onChange` fires if the number changed. Unparsable text reverts to the last good value.\n\n' +
                'An empty field commits `null` unless `allowEmpty: false`, which restores the previous value instead. When stepping from empty, the first press lands on `min` if it is greater than 0.\n\n' +
                'Provide `formatter(value)` and `parser(text)` together for fully custom display (units, locales); `parser` should return `null` for empty and `NaN` for invalid.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillnumberinput-focus: #7c3aed;\n  --chillnumberinput-btn-bg: #f5f3ff;\n  --chillnumberinput-h: 44px;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'value', type: 'number | null', default: 'null', description: 'Initial value (clamped and rounded).' },
        { name: 'min', type: 'number | null', default: 'null', description: 'Lower limit; the minus button disables at it.' },
        { name: 'max', type: 'number | null', default: 'null', description: 'Upper limit; the plus button disables at it.' },
        { name: 'step', type: 'number', default: '1', description: 'Increment for buttons, ArrowUp/Down and the wheel.' },
        { name: 'largeStep', type: 'number', default: 'step * 10', description: 'Increment for Shift+Arrow, PageUp and PageDown.' },
        { name: 'precision', type: 'number', default: 'auto', description: 'Decimal places; default is the larger of the decimals of `step` and `min`.' },
        { name: 'prefix', type: 'string', default: "''", description: 'Text shown before the number (text only).' },
        { name: 'suffix', type: 'string', default: "''", description: 'Text shown after the number (text only).' },
        { name: 'thousandSeparator', type: 'string', default: "''", description: 'Group separator such as `,`, `.` or a space.' },
        { name: 'decimalSeparator', type: 'string', default: "'.'", description: 'Decimal separator; use `,` for European style.' },
        { name: 'formatter', type: '(value: number) => string', default: 'null', description: 'Overrides the built-in formatting.' },
        { name: 'parser', type: '(text: string) => number | null', default: 'null', description: 'Overrides the built-in parsing (return `null` for empty, `NaN` for invalid).' },
        { name: 'holdToRepeat', type: 'boolean', default: 'true', description: 'Keep pressing +/- to repeat, accelerating over time.' },
        { name: 'holdDelay', type: 'number', default: '400', description: 'Milliseconds before repeating starts.' },
        { name: 'holdInterval', type: 'number', default: '70', description: 'Milliseconds between repeats (minimum 10, speeds up while held).' },
        { name: 'wheel', type: 'boolean', default: 'false', description: 'Change the value with the mouse wheel while focused.' },
        { name: 'allowEmpty', type: 'boolean', default: 'true', description: 'Empty text commits `null`; `false` restores the previous value.' },
        { name: 'controls', type: 'boolean', default: 'true', description: 'Show the +/- buttons.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the control.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Read-only: no typing or stepping.' },
        { name: 'name', type: 'string', default: 'null', description: 'Adds a hidden input holding the raw numeric value for forms.' },
        { name: 'label', type: 'string', default: 'null', description: '`aria-label` of the text field.' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder shown while empty.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onInput', type: '(value: number, instance) => void', default: 'null', description: 'While typing a parsable value.' },
        { name: 'onChange', type: '(value: number | null, instance) => void', default: 'null', description: 'When a value is committed.' },
    ],
    methods: [
        { signature: 'ChillNumberInput.create(options)', on: 'static', description: 'Build a control and return the instance (root at `.element`).' },
        { signature: 'ChillNumberInput.init(target, options)', on: 'static', description: 'Mount a control into an element or selector; returns `null` if not found.' },
        { signature: 'ChillNumberInput.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'The numeric value, or `null` when empty.' },
        { signature: 'instance.setValue(value, silent?)', description: 'Set the value (clamped, rounded). Fires `change` if it changed, unless `silent`.' },
        { signature: 'instance.increment(amount?) / decrement(amount?)', description: 'Step by `amount` (default `step`).' },
        { signature: 'instance.focus()', description: 'Focus the text field.' },
        { signature: 'instance.setDisabled(disabled) / setReadonly(readonly)', description: 'Change the interaction state.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `input` or `change`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element / input', description: 'The root element and the text `<input>`.' },
    ],
    events: [
        { name: 'input', payload: 'value, instance', description: 'The user typed a parsable value (not yet committed).' },
        { name: 'change', payload: 'value, instance', description: 'A new value was committed.' },
    ],
    cssVars: [
        { name: '--chillnumberinput-bg / --chillnumberinput-text', description: 'Field background and text colour.' },
        { name: '--chillnumberinput-border', description: 'Border colour.' },
        { name: '--chillnumberinput-focus', description: 'Focus border and ring colour.' },
        { name: '--chillnumberinput-btn-bg / --chillnumberinput-btn-hover', description: 'Stepper button colours.' },
        { name: '--chillnumberinput-disabled', description: 'Disabled colour.' },
        { name: '--chillnumberinput-h', description: 'Control height.' },
    ],
    a11y: [
        'The text field is `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (the formatted value).',
        'Keys: ArrowUp/Down step, Shift+Arrow and PageUp/PageDown use `largeStep`, Enter commits.',
        'Stepper buttons are `tabindex="-1"` with `aria-label` "Increase" / "Decrease"; keyboard users use the field itself.',
        '`inputmode` is `numeric` or `decimal` depending on precision and `min`, so touch keyboards match.',
    ],
    tips: [
        'Always read `getValue()` (a number or `null`) instead of parsing `input.value`, which contains prefixes and separators.',
        'Add a `label` so the spinbutton has an accessible name.',
        'Floating-point steps are rounded to `precision`, so `0.1 + 0.2` style drift does not appear.',
        'In React, create the control in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['slider', 'input', 'otp'],
    keywords: ['stepper', 'quantity', 'spinner', 'currency input', 'numeric', 'counter'],
};

export default doc;
