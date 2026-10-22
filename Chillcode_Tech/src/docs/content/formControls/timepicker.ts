import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'timepicker',
    global: 'ChillTimePicker',
    category: 'formControls',
    title: 'Time Picker',
    summary: 'Time picker with 12/24-hour clock, minute steps, min/max limits, popover mode and keyboard support.',
    style: 'create',
    description:
        'ChillTimePicker shows hours, minutes (and AM/PM) as scrollable columns. Use it inline, or with `popover: true` for a trigger button that opens the panel. Whatever the display format, the value you read and receive in callbacks is always a 24-hour `"HH:mm"` string, or `""` when nothing is selected.\n\n' +
        '`ChillTimePicker.create()` returns an instance (the root is `instance.element`); pass `container` to mount it, or use `ChillTimePicker.init(target, options)` to mount into an existing element.',
    features: [
        '12-hour (with AM/PM) or 24-hour clock and configurable `minuteStep`',
        '`min` / `max` limits disable out-of-range options',
        'Inline panel or popover with four placements and close-on-select',
        'Always reports `"HH:mm"`; accepts `"HH:mm"`, `"h:mm AM"` or a `Date` as input',
        'Keyboard navigation of the columns plus "Now" and "Clear" shortcuts',
    ],
    examples: [
        {
            id: 'inline',
            title: 'Inline 24-hour picker',
            description: 'Pick an hour and a minute. `onChange` receives the value as `"HH:mm"`.',
            height: 330,
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const tp = ChillTimePicker.create({
  value: '09:30',
  container: root,
  onChange: (v) => (out.textContent = v ? 'Selected ' + v : 'Cleared'),
});
out.textContent = 'Selected ' + tp.getValue();
root.append(out);
cleanup(() => tp.destroy());`,
        },
        {
            id: 'popover-12h',
            title: 'Popover with a 12-hour clock',
            description: 'A trigger button shows `getDisplay()` (for example "2:30 PM"); the panel closes after AM/PM is chosen.',
            height: 90,
            code: `const tp = ChillTimePicker.create({
  hour12: true,
  popover: true,
  minuteStep: 5,
  value: '14:30',
  placeholder: 'Pick a time',
  label: 'Reminder time',
  container: root,
  onChange: (v) => console.log('24h value:', v, '| display:', tp.getDisplay()),
});
cleanup(() => tp.destroy());`,
        },
        {
            id: 'business-hours',
            title: 'Business hours with step',
            description: '`min`, `max` and `minuteStep` limit what can be booked. Disabled options stay visible but cannot be selected.',
            height: 330,
            code: `const tp = ChillTimePicker.create({
  min: '09:00',
  max: '17:30',
  minuteStep: 15,
  value: '10:15',
  showNow: false,
  name: 'appointment',
  label: 'Appointment time',
  container: root,
});
cleanup(() => tp.destroy());`,
        },
        {
            id: 'api',
            title: 'Programmatic control',
            description: '`setValue` accepts the same formats as `value` (including a `Date`); `clear()` empties the selection. The static `parse` and `format` helpers work on their own.',
            height: 400,
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:10px 0 0;font-size:13px;color:var(--chill-text)';
const tp = ChillTimePicker.create({ hour12: true, container: root });
const show = () => (out.textContent = 'Value: ' + (tp.getValue() || '(none)') + '  |  Display: ' + (tp.getDisplay() || '-'));
tp.on('change', show);
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap';
[['08:05', '8:05 AM'], ['6:45 PM', '6:45 PM'], ['clear', 'Clear']].forEach(([v, label]) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'padding:6px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer';
  b.onclick = () => (v === 'clear' ? tp.clear() : tp.setValue(v));
  bar.append(b);
});
root.append(bar, out);
show();
console.log(ChillTimePicker.parse('7:5 PM'), ChillTimePicker.parse('7:05 PM'), ChillTimePicker.format('18:30', true));
cleanup(() => tp.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root is `instance.element` (the panel is `instance.panel`).\n\n' +
                '- **`create(options)`** builds the picker. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new picker into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `getDisplay()`, `setValue(value, silent?)`, `clear()`, `open()`, `close()`, `toggle()`, `isOpen()`, `setDisabled(bool)`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Values and formats',
            body:
                '`getValue()` is always `"HH:mm"` in 24-hour time (or `""`), even with `hour12: true`; `getDisplay()` returns the human string such as `"2:30 PM"`. Input values may be `"HH:mm"`, `"h:mm AM"` or a `Date`; minutes are snapped to `minuteStep`, and unparsable values passed to `setValue` are ignored.\n\n' +
                '`ChillTimePicker.parse(value)` normalises any accepted input to `"HH:mm"` (or `null`) and `ChillTimePicker.format(value, hour12)` renders it for display. `setValue(v, true)` updates without firing `change`.',
        },
        {
            title: 'Popover mode and keyboard',
            body:
                'In popover mode the panel is moved to `document.body` while open and removed when closed, so call `destroy()` when tearing down. With `closeOnSelect` (default) it closes after the last column (minutes, or AM/PM in 12-hour mode) is chosen; Esc closes and refocuses the trigger.\n\n' +
                'Inside the panel use Up/Down to change the focused column, Left/Right to switch columns, Home/End for the first or last option and Enter/Space to select. Arrow Up/Down on the trigger opens it.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chilltimepicker-primary: #7c3aed;\n  --chilltimepicker-primary-text: #ffffff;\n  --chilltimepicker-hover: #f3f4f6;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'value', type: 'string | Date', default: 'null', description: '`"HH:mm"`, `"h:mm AM"` or a `Date`. `null` means no selection.' },
        { name: 'hour12', type: 'boolean', default: 'false', description: '12-hour clock with an AM/PM column.' },
        { name: 'minuteStep', type: 'number', default: '1', description: 'Minute granularity (1 to 30). Values snap to it.' },
        { name: 'min', type: 'string', default: 'null', description: 'Earliest allowed time (`"HH:mm"`); earlier options are disabled.' },
        { name: 'max', type: 'string', default: 'null', description: 'Latest allowed time (`"HH:mm"`); later options are disabled.' },
        { name: 'popover', type: 'boolean', default: 'false', description: 'Render a trigger button and open the panel in a popover.' },
        { name: 'placement', type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'", description: 'Popover placement relative to the trigger.' },
        { name: 'placeholder', type: 'string', default: "'Select time'", description: 'Trigger text while empty.' },
        { name: 'showNow', type: 'boolean', default: 'true', description: 'Show the "Now" shortcut button.' },
        { name: 'nowText', type: 'string', default: "'Now'", description: 'Label of the "Now" button.' },
        { name: 'clearText', type: 'string', default: "'Clear'", description: 'Label of the "Clear" button.' },
        { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Popover: close once the last column is picked.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the picker.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name holding `"HH:mm"`.' },
        { name: 'label', type: 'string', default: "'Time'", description: 'Accessible label of the picker or trigger.' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onChange', type: '(value: string, instance) => void', default: 'null', description: 'Called when the selection changes (`""` when cleared).' },
        { name: 'onOpen', type: '(instance) => void', default: 'null', description: 'Popover opened.' },
        { name: 'onClose', type: '(instance) => void', default: 'null', description: 'Popover closed.' },
    ],
    methods: [
        { signature: 'ChillTimePicker.create(options)', on: 'static', description: 'Build a picker and return the instance (root at `.element`).' },
        { signature: 'ChillTimePicker.init(target, options)', on: 'static', description: 'Mount a picker into an element or selector; returns `null` if not found.' },
        { signature: 'ChillTimePicker.parse(value)', on: 'static', description: 'Normalise `"HH:mm"`, `"h:mm AM"` or a `Date` to `"HH:mm"`, or `null`.' },
        { signature: 'ChillTimePicker.format(value, hour12)', on: 'static', description: 'Format a time for display, e.g. `"2:30 PM"` or `"14:30"`.' },
        { signature: 'ChillTimePicker.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: '`"HH:mm"` (24h) or `""`.' },
        { signature: 'instance.getDisplay()', description: 'Formatted value in the configured clock style.' },
        { signature: 'instance.setValue(value, silent?)', description: 'Set the time (snapped to the step). Ignores unparsable input. Fires `change` unless `silent`.' },
        { signature: 'instance.clear()', description: 'Clear the selection.' },
        { signature: 'instance.open() / close() / toggle() / isOpen()', description: 'Control and query the popover (no-ops when `popover` is false).' },
        { signature: 'instance.setDisabled(disabled)', description: 'Enable or disable the picker.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `change`, `open` or `close`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners, the panel and the element.' },
        { signature: 'instance.element / panel / trigger', description: 'Root element, the panel, and the trigger button (`null` unless popover).' },
    ],
    events: [
        { name: 'change', payload: 'value, instance', description: 'The selected time changed.' },
        { name: 'open', payload: 'value, instance', description: 'The popover opened.' },
        { name: 'close', payload: 'value, instance', description: 'The popover closed.' },
    ],
    cssVars: [
        { name: '--chilltimepicker-bg / --chilltimepicker-text', description: 'Panel background and text colour.' },
        { name: '--chilltimepicker-border', description: 'Panel and trigger border.' },
        { name: '--chilltimepicker-primary / --chilltimepicker-primary-text', description: 'Selected option colours.' },
        { name: '--chilltimepicker-hover', description: 'Hovered option background.' },
        { name: '--chilltimepicker-muted', description: 'Placeholder and secondary text.' },
        { name: '--chilltimepicker-shadow', description: 'Popover shadow.' },
    ],
    a11y: [
        'Each column is a `role="listbox"` with `role="option"` items, `aria-selected` and `aria-disabled` for out-of-range values.',
        'Keys: Up/Down move within a column and select, Left/Right switch columns, Home/End jump, Enter/Space select, Esc closes the popover.',
        'Popover trigger has `aria-haspopup="dialog"`, `aria-expanded` and an `aria-label` that includes the current time.',
        'Inline mode is a `role="group"` with the `label` as its name.',
    ],
    tips: [
        'Store and send the `"HH:mm"` value; use `getDisplay()` only for presentation.',
        'The popover panel lives on `document.body` while open: always `destroy()` the picker when removing it.',
        'Choosing an hour that would fall outside `min`/`max` snaps the minutes to the first allowed one.',
        'In React, create the picker in an effect with a ref as `container` and call `destroy()` on cleanup.',
    ],
    related: ['date', 'calendar', 'select', 'input'],
    keywords: ['time', 'clock', 'hour', 'minute', 'am pm', 'schedule', 'appointment'],
};

export default doc;
