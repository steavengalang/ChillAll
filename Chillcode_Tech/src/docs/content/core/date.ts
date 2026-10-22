import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'date',
    global: 'ChillDate',
    category: 'core',
    title: 'Date Picker',
    summary: 'Keyboard-friendly date picker that turns any text input into a calendar popup with min/max rules.',
    style: 'create',
    description:
        'ChillDate attaches a calendar popup to an `<input>`. The input becomes read-only, shows the chosen date in the format you choose, and a native `change` event is dispatched, so it works with form libraries and plain `<form>` submits.\n\n' +
        'Constrain choices with `minDate`, `maxDate` and a `disableDate(date)` callback, change the week start, and translate month and weekday names. The calendar is rendered with the DOM API (no HTML strings) and appended to `<body>`, so it is never clipped by an `overflow: hidden` parent.',
    features: [
        'Format tokens `YYYY YY MMMM MMM MM M DD D`, parsed back from existing input values',
        'Inclusive `minDate` / `maxDate` and a `disableDate` callback, in local time at day granularity',
        'Full keyboard support: arrows, PageUp/PageDown, Home/End, Enter, Escape',
        'Today and Clear buttons, configurable first day of week and localisable names',
        'Opens above the input when there is no room below; becomes a bottom sheet on small screens',
        'Cleans up completely on `destroy()`, restoring the input\'s original attributes',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic date field',
            description: 'Click the input (or press ArrowDown) to open the calendar. `getValue()` returns a `Date` or `null`.',
            height: 400,
            code: `root.innerHTML = '<label style="display:block;font-size:13px;margin-bottom:6px;color:var(--chill-text)">Start date</label>';
const input = document.createElement('input');
input.placeholder = 'Pick a date';
input.setAttribute('aria-label', 'Start date');
root.append(input);
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;color:var(--chill-text)';
root.append(out);
const dp = ChillDate.create(input, {
  onChange: (d) => { out.textContent = d ? 'Selected: ' + d.toDateString() : 'Cleared'; },
});
cleanup(() => dp.destroy());`,
        },
        {
            id: 'format-locale',
            title: 'Format and localisation',
            description: 'Use any combination of tokens, start weeks on Monday, and pass your own month and weekday names.',
            height: 400,
            code: `const input = document.createElement('input');
input.setAttribute('aria-label', 'Fecha de entrega');
input.placeholder = 'DD MMM YYYY';
root.append(input);
const dp = ChillDate.create(input, {
  format: 'DD MMM YYYY',
  firstDayOfWeek: 1,
  months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  weekdays: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  weekdaysLong: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
});
dp.setValue('2026-03-14');
cleanup(() => dp.destroy());`,
        },
        {
            id: 'min-max',
            title: 'Booking window',
            description: 'Allow only the next 30 days, and block weekends with `disableDate`. Disabled days are dimmed and cannot be selected.',
            height: 400,
            code: `const today = new Date();
const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
const input = document.createElement('input');
input.setAttribute('aria-label', 'Appointment date');
input.placeholder = 'Weekdays in the next 30 days';
input.style.minWidth = '240px';
root.append(input);
const dp = ChillDate.create(input, {
  minDate: today,
  maxDate: limit,
  disableDate: (d) => d.getDay() === 0 || d.getDay() === 6,
});
cleanup(() => dp.destroy());`,
        },
        {
            id: 'date-range',
            title: 'Linked start and end dates',
            description: 'Combine two pickers: when the start changes, update the end picker\'s `minDate` through its `config`.',
            height: 420,
            code: `root.style.cssText += ';display:flex;gap:12px;flex-wrap:wrap';
const mk = (label) => {
  const input = document.createElement('input');
  input.setAttribute('aria-label', label);
  input.placeholder = label;
  root.append(input);
  return input;
};
const startInput = mk('Check-in');
const endInput = mk('Check-out');
const end = ChillDate.create(endInput, { format: 'DD/MM/YYYY' });
const start = ChillDate.create(startInput, {
  format: 'DD/MM/YYYY',
  onChange: (d) => {
    end.config.minDate = d;
    const cur = end.getValue();
    if (d && cur && cur < d) end.clear();
  },
});
cleanup(() => { start.destroy(); end.destroy(); });`,
        },
        {
            id: 'events-form',
            title: 'Events and form integration',
            description: 'The picker emits `change`, `open` and `close` events, and also fires a native `change` on the input so forms and frameworks notice.',
            height: 400,
            code: `root.innerHTML = '<form style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input name="birthday" aria-label="Birthday" placeholder="YYYY-MM-DD"><button type="submit">Save</button></form><pre style="font-size:12px;color:var(--chill-text);margin:8px 0 0" id="log"></pre>';
const input = root.querySelector('input');
const log = root.querySelector('#log');
const say = (m) => { log.textContent = m + '\\n' + log.textContent; };
const dp = ChillDate.create(input, { format: 'YYYY-MM-DD', closeOnSelect: false, maxDate: new Date() });
dp.on('open', () => say('opened'));
dp.on('close', () => say('closed'));
dp.on('change', (d) => say('change -> ' + (d ? d.toISOString().slice(0, 10) : 'null')));
input.addEventListener('change', () => say('native change: "' + input.value + '"'));
root.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); say('submit: ' + new FormData(e.target).get('birthday')); });
cleanup(() => dp.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Attaching to an input',
            body:
                '`ChillDate.create(inputOrSelector, options)` returns an instance. It does not create the input: it adds a class, sets `readOnly`, `aria-haspopup="dialog"` and `aria-expanded`, and opens on click, ArrowDown, Enter or Space. ' +
                '`destroy()` restores the previous `readOnly` and ARIA values.\n\n' +
                'If the input already has a value, it is parsed with your `format` (falling back to ISO `YYYY-MM-DD`) and becomes the selected date. Because the field is read-only, users pick dates from the calendar rather than typing them.',
        },
        {
            title: 'Dates, formats and time zones',
            body:
                'Everything is local time at **day granularity**. `minDate` and `maxDate` accept a `Date`, a timestamp, or a `\'YYYY-MM-DD\'` string (parsed as a local date, not UTC), and both are inclusive.\n\n' +
                '`getValue()` returns a new `Date` at local midnight or `null`. To send a date to an API as a calendar day, format it yourself with local getters instead of `toISOString()`, which converts to UTC and can shift the day.\n\n' +
                'Format tokens: `YYYY` `YY` `MMMM` (full name) `MMM` (first three letters) `MM` `M` `DD` `D`. Other characters are kept as-is.',
        },
        {
            title: 'Keyboard',
            body:
                'With the calendar open, focus sits on a day button. Arrow keys move by day and week, **PageUp / PageDown** move by month (hold Shift for a year), **Home / End** jump to the start or end of the week, ' +
                '**Enter** or **Space** selects, and **Escape** closes and returns focus to the input. The header buttons change month and year; **Today** selects today (unless disabled) and **Clear** empties the field.',
        },
    ],
    options: [
        { name: 'format', type: 'string', default: "'YYYY-MM-DD'", description: 'Display and parse format. Tokens: `YYYY YY MMMM MMM MM M DD D`.' },
        { name: 'minDate', type: 'Date | string | number', default: 'null', description: 'Earliest selectable day (inclusive). Strings use `YYYY-MM-DD` in local time.' },
        { name: 'maxDate', type: 'Date | string | number', default: 'null', description: 'Latest selectable day (inclusive).' },
        { name: 'disableDate', type: '(date: Date) => boolean', default: 'null', description: 'Return `true` to disable that day.' },
        { name: 'firstDayOfWeek', type: 'number', default: '0', description: 'First weekday column: 0 = Sunday ... 6 = Saturday.' },
        { name: 'months', type: 'string[12]', default: 'English names', description: 'Month names, used in the title, the `MMMM` / `MMM` tokens and day labels.' },
        { name: 'weekdays', type: 'string[7]', default: "['Su', 'Mo', ...]", description: 'Two-letter column headings, Sunday first.' },
        { name: 'weekdaysLong', type: 'string[7]', default: "['Sunday', ...]", description: 'Full names for screen readers, Sunday first.' },
        { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Close the calendar after a day is chosen.' },
        { name: 'onChange', type: '(date: Date | null) => void', default: 'null', description: 'Called when the value changes or is cleared.' },
        { name: 'onOpen', type: '() => void', default: 'null', description: 'Called when the calendar opens.' },
        { name: 'onClose', type: '() => void', default: 'null', description: 'Called when the calendar closes.' },
    ],
    methods: [
        { signature: 'ChillDate.create(input, options)', on: 'static', description: '`input` is a selector or `<input>` element. Returns an instance.' },
        { signature: 'ChillDate.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.open() / close() / toggle()', description: 'Show, hide or toggle the calendar.' },
        { signature: 'instance.getValue()', description: 'Selected date as a new `Date` (local midnight), or `null`.' },
        { signature: 'instance.setValue(date)', description: 'Select a date (Date, timestamp or ISO string). A falsy value clears. Fires `change`.' },
        { signature: 'instance.clear()', description: 'Empty the field and fire `change` with `null`.' },
        { signature: 'instance.isDateDisabled(date)', description: 'True if `date` is outside min/max or rejected by `disableDate`.' },
        { signature: 'instance.formatDate(date) / parseDate(string)', description: 'Convert using the instance format; `parseDate` returns `null` for invalid input.' },
        { signature: 'instance.on(event, fn) / off(event, fn)', description: 'Subscribe to `change`, `open` or `close`. Both return the instance.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the popup; restore the input.' },
    ],
    events: [
        { name: 'change', payload: 'date: Date | null', description: 'A date was selected or cleared. The input also fires a native bubbling `change` event.' },
        { name: 'open', description: 'The calendar opened.' },
        { name: 'close', description: 'The calendar closed.' },
    ],
    cssVars: [
        { name: '--chilldate-bg / --chilldate-text / --chilldate-text-light', description: 'Input and popup surface and text colours.' },
        { name: '--chilldate-border', description: 'Input and popup border colour.' },
        { name: '--chilldate-primary', description: 'Selected day, today marker and focus colour.' },
        { name: '--chilldate-hover', description: 'Hover background for days and buttons.' },
        { name: '--chilldate-range', description: 'Highlight colour reserved for range styling.' },
    ],
    a11y: [
        'The input gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`; the popup is `role="dialog"` with the label "Choose date".',
        'The calendar is a `role="grid"` with column headers carrying full weekday names; each day button has a full-date `aria-label`.',
        'Selected days set `aria-selected` / `aria-pressed`, today sets `aria-current="date"`, disabled days set `aria-disabled`.',
        'Roving tabindex: only one day is tabbable. Arrows, PageUp/PageDown, Home/End, Enter, Space and Escape work as described above.',
        'The month title is a polite live region, and the popup animation respects `prefers-reduced-motion`.',
    ],
    tips: [
        'Give the input an `aria-label` or a `<label>`: the library does not add one.',
        '`setValue()` does not check `minDate`, `maxDate` or `disableDate`; validate the value yourself if it comes from outside.',
        'To change constraints after creation, update `instance.config.minDate` / `maxDate` (as in the linked-range example); the calendar reads them each time it renders.',
        'In React, create the picker in an effect on the input ref and `destroy()` in the cleanup. Listen to `onChange` rather than `input.value`, because the input is read-only.',
        'SSR-safe: nothing touches the DOM until `create()` is called with an input.',
    ],
    related: ['input', 'form', 'popover'],
    keywords: ['calendar', 'datepicker', 'day', 'time', 'schedule', 'booking'],
};

export default doc;
