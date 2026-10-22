import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'colorpicker',
    global: 'ChillColorPicker',
    category: 'formControls',
    title: 'Color Picker',
    summary: 'Colour picker with a saturation/brightness area, hue slider, hex input, swatches and popover mode.',
    style: 'create',
    description:
        'ChillColorPicker combines a saturation/brightness area, a hue slider, a hex field and preset swatches in one compact panel. Use it inline, or with `popover: true` to get a trigger button that opens the panel above the page.\n\n' +
        '`ChillColorPicker.create()` returns an instance (the root is `instance.element`); pass `container` to mount it, or use `ChillColorPicker.init(target, options)` to mount into an existing element. It accepts `#rgb`, `#rrggbb`, `rgb()` and `hsl()` input, and reports values as hex, rgb or hsl strings.',
    features: [
        'Inline panel or popover with a trigger button and four placements',
        'Accepts hex, `rgb()` and `hsl()` values; reports `format: "hex" | "rgb" | "hsl"`',
        'Customisable preset swatches (or none), optional hex input with validation',
        'Pointer drag and full keyboard control of the colour area; native range for hue',
        'Static colour utilities: `parse`, `toHex`, `hexToRgb`, `rgbToHsv`, `hsvToRgb`, `rgbToHsl`',
    ],
    examples: [
        {
            id: 'inline',
            title: 'Inline picker',
            description: 'An always-visible panel. `onInput` fires continuously while dragging; `onChange` when a colour is committed.',
            height: 330,
            code: `root.style.maxWidth = '280px';
const chip = document.createElement('div');
chip.style.cssText = 'margin-top:12px;padding:10px 14px;border-radius:8px;font:600 13px system-ui;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4)';
const paint = (hex) => { chip.style.background = hex; chip.textContent = 'Brand colour ' + hex; };
const cp = ChillColorPicker.create({
  value: '#7c3aed',
  container: root,
  onInput: paint,
});
paint(cp.getValue());
root.append(chip);
cleanup(() => cp.destroy());`,
        },
        {
            id: 'popover',
            title: 'Popover with trigger button',
            description: 'With `popover: true` a swatch button is rendered and the panel opens on `<body>`. `placement` picks the side.',
            height: 80,
            code: `const cp = ChillColorPicker.create({
  value: '#10b981',
  popover: true,
  placement: 'bottom-start',
  label: 'Accent colour',
  container: root,
  onChange: (hex) => console.log('accent', hex),
});
cleanup(() => cp.destroy());`,
        },
        {
            id: 'formats',
            title: 'Output formats',
            description: '`format` controls the string passed to callbacks and returned by `getValue()`. `getHex()`, `getRgb()` and `getHsv()` are always available.',
            height: 340,
            code: `root.style.maxWidth = '280px';
const out = document.createElement('code');
out.style.cssText = 'display:block;margin-top:10px;font-size:13px;color:var(--chill-text)';
const cp = ChillColorPicker.create({
  value: 'hsl(200, 90%, 50%)',
  format: 'rgb',
  swatches: false,
  container: root,
  onInput: (v) => (out.textContent = v),
});
out.textContent = cp.getValue();
root.append(out);
cleanup(() => cp.destroy());`,
        },
        {
            id: 'custom-swatches',
            title: 'Custom palette, no text field',
            description: 'Pass your own `swatches` (any parsable colour) and hide the hex field with `showInput: false` for a tighter palette picker.',
            height: 280,
            code: `root.style.maxWidth = '260px';
const cp = ChillColorPicker.create({
  value: '#0ea5e9',
  showInput: false,
  swatches: ['#0f172a', '#0ea5e9', '#22c55e', '#facc15', 'rgb(244, 63, 94)', 'hsl(280, 80%, 60%)', '#f8fafc'],
  name: 'theme_color',
  container: root,
});
cleanup(() => cp.destroy());`,
        },
        {
            id: 'utilities',
            title: 'Static utilities and programmatic control',
            description: 'The colour helpers work without creating a picker. `setValue(colour, silent)` accepts anything `parse` understands.',
            height: 340,
            code: `root.style.maxWidth = '280px';
const info = document.createElement('p');
info.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text);line-height:1.6';
const cp = ChillColorPicker.create({ value: '#ef4444', container: root, swatches: false });
const show = () => {
  const rgb = cp.getRgb();
  const hsl = ChillColorPicker.rgbToHsl(rgb.r, rgb.g, rgb.b);
  info.textContent = ChillColorPicker.toHex(rgb) + '  |  rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')  |  hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)';
};
cp.on('input', show);
show();
const btn = document.createElement('button');
btn.textContent = 'Use rgb(34, 197, 94)';
btn.style.cssText = 'margin-top:8px;padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
btn.onclick = () => { cp.setValue(ChillColorPicker.parse('rgb(34, 197, 94)')); show(); };
root.append(info, btn);
cleanup(() => cp.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element` (and the panel is `instance.panel`).\n\n' +
                '- **`create(options)`** builds the picker. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new picker into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `getHex()`, `getRgb()`, `getHsv()`, `setValue(colour, silent?)`, `open()`, `close()`, `toggle()`, `isOpen()`, `setDisabled(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Input vs change',
            body:
                '`onInput` (and the `input` event) fires continuously: while dragging in the colour area, moving the hue slider, or typing a valid colour in the field. `onChange` fires when a colour is *committed*: pointer release, keyboard step, picking a swatch, or pressing Enter / blurring the hex field. It only fires when the value actually differs from the last committed one.\n\n' +
                '`setValue(colour, true)` updates without emitting `change`. Invalid colours passed to `setValue` are ignored.',
        },
        {
            title: 'Popover mode',
            body:
                'In popover mode the panel is moved to `document.body` while open, positioned relative to the trigger and kept in the viewport, and it closes on outside press or Esc (focus returns to the trigger). `onOpen` / `onClose` and the `open` / `close` events let you react. The panel is removed on `destroy()`, so always call it when you tear the page down.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillcolorpicker-bg: #ffffff;\n  --chillcolorpicker-focus: #7c3aed;\n  --chillcolorpicker-shadow: 0 12px 32px rgba(0,0,0,.2);\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'value', type: 'string', default: "'#3b82f6'", description: 'Initial colour: `#rgb`, `#rrggbb`, `rgb()` or `hsl()`.' },
        { name: 'swatches', type: 'string[] | false', default: '16 preset colours', description: 'Preset colours shown as buttons; `false` hides them.' },
        { name: 'showInput', type: 'boolean', default: 'true', description: 'Show the hex text field.' },
        { name: 'format', type: "'hex' | 'rgb' | 'hsl'", default: "'hex'", description: 'Format of `getValue()` and callback arguments.' },
        { name: 'popover', type: 'boolean', default: 'false', description: 'Render a trigger button and open the panel in a popover.' },
        { name: 'placement', type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'", description: 'Popover placement relative to the trigger.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the picker.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name; it always holds the hex value.' },
        { name: 'label', type: 'string', default: "'Colour'", description: 'Accessible label of the picker or trigger.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onInput', type: '(value: string, instance) => void', default: 'null', description: 'While dragging or typing a valid colour.' },
        { name: 'onChange', type: '(value: string, instance) => void', default: 'null', description: 'When a colour is committed.' },
        { name: 'onOpen', type: '(instance) => void', default: 'null', description: 'Popover opened.' },
        { name: 'onClose', type: '(instance) => void', default: 'null', description: 'Popover closed.' },
    ],
    methods: [
        { signature: 'ChillColorPicker.create(options)', on: 'static', description: 'Build a picker and return the instance (root at `.element`).' },
        { signature: 'ChillColorPicker.init(target, options)', on: 'static', description: 'Mount a picker into an element or selector; returns `null` if not found.' },
        { signature: 'ChillColorPicker.parse(colour)', on: 'static', description: 'Parse `#rgb`, `#rrggbb`, `rgb()` or `hsl()` to a `#rrggbb` string, or `null`.' },
        { signature: 'ChillColorPicker.toHex(rgb)', on: 'static', description: 'Convert `{ r, g, b }` to a hex string.' },
        { signature: 'ChillColorPicker.hexToRgb(hex)', on: 'static', description: 'Convert a hex string to `{ r, g, b }` (or `null`).' },
        { signature: 'ChillColorPicker.rgbToHsv(r, g, b)', on: 'static', description: 'Convert RGB (0-255) to `{ h, s, v }` with s and v in 0..1.' },
        { signature: 'ChillColorPicker.hsvToRgb(h, s, v)', on: 'static', description: 'Convert HSV to `{ r, g, b }`.' },
        { signature: 'ChillColorPicker.rgbToHsl(r, g, b)', on: 'static', description: 'Convert RGB to `{ h, s, l }` (degrees and percentages).' },
        { signature: 'ChillColorPicker.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'Current colour in the configured `format`.' },
        { signature: 'instance.getHex() / getRgb() / getHsv()', description: 'Current colour as hex, `{ r, g, b }` or `{ h, s, v }`.' },
        { signature: 'instance.setValue(colour, silent?)', description: 'Set the colour; ignores unparsable input. Fires `change` unless `silent`.' },
        { signature: 'instance.open() / close() / toggle() / isOpen()', description: 'Control and query the popover (no-ops when `popover` is false).' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the picker.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `input`, `change`, `open` or `close`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners, the panel and the element.' },
        { signature: 'instance.element / panel / trigger', description: 'Root element, the panel, and the trigger button (`null` unless popover).' },
    ],
    events: [
        { name: 'input', payload: 'value, instance', description: 'Colour is changing (drag, hue, typing).' },
        { name: 'change', payload: 'value, instance', description: 'A colour was committed.' },
        { name: 'open', payload: 'value, instance', description: 'The popover opened.' },
        { name: 'close', payload: 'value, instance', description: 'The popover closed.' },
    ],
    cssVars: [
        { name: '--chillcolorpicker-bg / --chillcolorpicker-text', description: 'Panel background and text colour.' },
        { name: '--chillcolorpicker-border', description: 'Panel and control borders.' },
        { name: '--chillcolorpicker-input-bg', description: 'Hex field background.' },
        { name: '--chillcolorpicker-focus', description: 'Focus ring colour.' },
        { name: '--chillcolorpicker-error', description: 'Invalid hex field colour.' },
        { name: '--chillcolorpicker-shadow', description: 'Popover shadow.' },
    ],
    a11y: [
        'The colour area is a focusable `role="slider"`: Arrow keys change saturation/brightness (hold Shift for bigger steps), Home/End set saturation, PageUp/PageDown set brightness.',
        'Hue is a native range input; swatches are buttons with `aria-pressed` and the hex as their label.',
        'The hex field sets `aria-invalid` on unparsable input; Enter or blur commits it.',
        'Popover mode: trigger has `aria-haspopup="dialog"` and `aria-expanded`; Esc closes and refocuses the trigger.',
    ],
    tips: [
        'The popover panel is appended to `document.body`, so it is not clipped by `overflow: hidden` ancestors, but you must `destroy()` the picker on teardown.',
        'The hidden `name` input always carries hex, regardless of `format`.',
        'Greys keep the previous hue when you type or pick them, so the hue slider does not jump to 0.',
        'In React, create the picker in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['input', 'slider', 'popover'],
    keywords: ['colour', 'color', 'hex', 'swatch', 'palette', 'eyedropper', 'hsl'],
};

export default doc;
