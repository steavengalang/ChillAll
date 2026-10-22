import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'calendar',
    global: 'ChillCalendar',
    category: 'display',
    title: 'Calendar',
    summary: 'Month-grid calendar with single or range selection, events, min/max limits and keyboard navigation.',
    style: 'create',
    description:
        'ChillCalendar is a self-contained month grid. Use it inline as a date picker, a booking range selector, or a read-only schedule with event dots or chips. ' +
        'Month and weekday names come from `Intl` using the `locale` option, and `weekStart` sets the first column.\n\n' +
        'Dates can be passed as `Date` objects or `"YYYY-MM-DD"` strings and are handled in local time. `onSelect` receives a `Date` in single mode and `{ start, end }` in range mode. ' +
        'This is the inline calendar; for an input with a popup use the date picker component.',
    features: [
        'Single, range and display-only (`none`) modes',
        '`min`, `max` and an `isDisabled(date)` callback for blocked days',
        'Events as dots or labelled chips, with a click callback',
        'Locale-aware month and weekday names, configurable week start',
        'WAI-ARIA grid with full keyboard navigation and a Today button',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Single date',
            description: 'The default mode. Click a day or use the arrow keys and Enter; `onSelect` gets a `Date`.',
            height: 380,
            code: `const out = document.createElement('p');
out.style.cssText = 'color:var(--chill-text);margin-top:12px';
out.textContent = 'Pick a date';
const cal = ChillCalendar.create({
  onSelect: (d) => { out.textContent = 'Selected ' + d.toDateString(); },
});
root.append(cal.element, out);
cleanup(() => cal.destroy());`,
        },
        {
            id: 'range',
            title: 'Date range',
            description: 'Click a start day, then an end day. The range is highlighted while you hover, and Escape clears a half-picked range.',
            height: 400,
            code: `const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), 8);
const end = new Date(now.getFullYear(), now.getMonth(), 14);
const out = document.createElement('p');
out.style.cssText = 'color:var(--chill-text);margin-top:12px';
const cal = ChillCalendar.create({
  mode: 'range',
  value: { start, end },
  weekStart: 1,
  onSelect: ({ start, end }) => { out.textContent = end ? start.toDateString() + ' to ' + end.toDateString() : 'Pick an end date'; },
});
out.textContent = 'Trip: ' + start.toDateString() + ' to ' + end.toDateString();
root.append(cal.element, out);
cleanup(() => cal.destroy());`,
        },
        {
            id: 'limits',
            title: 'Min, max and disabled days',
            description: '`min` and `max` bound the selectable days; `isDisabled` blocks anything else, such as weekends.',
            height: 380,
            code: `const now = new Date();
const min = new Date(now.getFullYear(), now.getMonth(), 5);
const max = new Date(now.getFullYear(), now.getMonth(), 25);
const cal = ChillCalendar.create({
  min, max,
  isDisabled: (d) => d.getDay() === 0 || d.getDay() === 6,
  value: new Date(now.getFullYear(), now.getMonth(), 10),
});
root.append(cal.element);
cleanup(() => cal.destroy());`,
        },
        {
            id: 'events',
            title: 'Events as chips',
            description: 'Add `events` with a date, title and optional colour. `eventDisplay: "chips"` shows titles; the default shows dots.',
            height: 520,
            code: `const y = new Date().getFullYear(), m = new Date().getMonth();
const d = (n) => new Date(y, m, n);
const cal = ChillCalendar.create({
  mode: 'none',
  eventDisplay: 'chips',
  maxEvents: 2,
  events: [
    { date: d(4), title: 'Sprint planning', color: '#3b82f6' },
    { date: d(12), title: 'Launch', color: '#22c55e' },
    { date: d(12), title: 'Retro', color: '#f59e0b' },
    { date: d(12), title: 'Party', color: '#ec4899' },
    { date: d(20), title: 'Design review', color: '#8b5cf6' },
  ],
  onEventClick: (ev) => console.log('event', ev.title),
});
root.append(cal.element);
cleanup(() => cal.destroy());`,
        },
        {
            id: 'locale',
            title: 'Locale and navigation',
            description: '`locale` localises names. Drive the calendar from code with `nextMonth()`, `prevMonth()`, `setMonth()` and `goToToday()`.',
            height: 420,
            code: `const cal = ChillCalendar.create({ locale: 'fr-FR', weekStart: 1, labels: { today: "Aujourd'hui", prev: 'Mois precedent', next: 'Mois suivant' } });
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
[['Next', () => cal.nextMonth()], ['Prev', () => cal.prevMonth()], ['Jan 2030', () => cal.setMonth(2030, 0)]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(cal.element, bar);
cal.on('monthChange', (year, month) => console.log('month', year, month + 1));
cleanup(() => cal.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Values and months',
            body:
                'Single mode returns a `Date` (or `null`); range mode returns `{ start, end }` where `end` is `null` until the second click. `getValue()` returns the same shape and `setValue(v)` accepts a `Date`, an ISO string or `{ start, end }`. ' +
                'Months are zero-based in code (`setMonth(2030, 0)` is January), matching `Date`.\n\n' +
                'In range mode a second click before the start swaps the two ends. Clicking a day from an adjacent month (when `showOutsideDays` is on) selects it and navigates to that month.',
        },
        {
            title: 'Events',
            body:
                'Events are `{ id?, date, title, color? }`. Several events may share a day; at most `maxEvents` are drawn per cell. Add or replace them later with `addEvent()` / `setEvents()`. ' +
                'Use `onEventClick(event, domEvent)` to open a detail view. Dots are decorative (`aria-hidden`); the day cell label announces the event count using `labels.events`.\n\n' +
                '```js\ncal.addEvent({ date: "2026-12-24", title: "Team dinner", color: "#22c55e" });\n```',
        },
    ],
    options: [
        { name: 'value', type: 'Date | string | { start, end }', default: 'null', description: 'Initial selection.' },
        { name: 'mode', type: "'single' | 'range' | 'none'", default: "'single'", description: 'Selection behaviour. `none` is display only.' },
        { name: 'month', type: 'Date | string', default: 'selection start or today', description: 'Initial month shown.' },
        { name: 'locale', type: 'string', default: 'undefined', description: 'BCP-47 locale for month and weekday names.' },
        { name: 'weekStart', type: 'number', default: '0', description: 'First day of the week: 0 = Sunday ... 6 = Saturday.' },
        { name: 'min / max', type: 'Date | string', default: 'null', description: 'Earliest and latest selectable date.' },
        { name: 'isDisabled', type: '(date: Date) => boolean', default: 'null', description: 'Return true to block a day.' },
        { name: 'events', type: '{ id?, date, title, color? }[]', default: '[]', description: 'Events to display.' },
        { name: 'eventDisplay', type: "'dots' | 'chips'", default: "'dots'", description: 'Show events as dots or labelled chips.' },
        { name: 'maxEvents', type: 'number', default: '3', description: 'Maximum events rendered per day cell.' },
        { name: 'showOutsideDays', type: 'boolean', default: 'true', description: 'Render days of adjacent months.' },
        { name: 'todayButton', type: 'boolean', default: 'true', description: 'Show a "Today" button.' },
        { name: 'labels', type: '{ today, prev, next, events }', default: 'English', description: 'Translated UI strings.' },
        { name: 'ariaLabel', type: 'string', default: "'Calendar'", description: 'Accessible name of the grid.' },
        { name: 'onSelect', type: '(value) => void', default: 'null', description: '`Date` in single mode, `{ start, end }` in range mode.' },
        { name: 'onMonthChange', type: '(year, month0) => void', default: 'null', description: 'The visible month changed.' },
        { name: 'onEventClick', type: '(event, domEvent) => void', default: 'null', description: 'An event dot or chip was clicked.' },
    ],
    methods: [
        { signature: 'ChillCalendar.create(options)', on: 'static', description: 'Create a calendar; append `instance.element` yourself.' },
        { signature: 'ChillCalendar.init(target, options)', on: 'static', description: 'Render into an existing element (selector or element); returns an instance or `null`.' },
        { signature: 'ChillCalendar.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'calendar.element', description: 'The root element.' },
        { signature: 'calendar.getValue() / setValue(v)', description: 'Read or set the selection.' },
        { signature: 'calendar.clear()', description: 'Clear the selection.' },
        { signature: 'calendar.setMonth(year, month0)', description: 'Show a month (month is zero-based).' },
        { signature: 'calendar.nextMonth() / prevMonth() / goToToday()', description: 'Navigate.' },
        { signature: 'calendar.getMonth()', description: 'Returns `{ year, month }` for the visible month.' },
        { signature: 'calendar.setEvents(list) / addEvent(event)', description: 'Replace or append events.' },
        { signature: 'calendar.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'calendar.destroy()', description: 'Remove listeners and generated DOM.' },
    ],
    events: [
        { name: 'select', payload: '(value)', description: 'The selection changed.' },
        { name: 'monthChange', payload: '(year, month0)', description: 'The visible month changed.' },
        { name: 'eventClick', payload: '(event, domEvent)', description: 'An event was clicked.' },
    ],
    cssVars: [
        { name: '--chillcalendar-primary / --chillcalendar-primary-text', description: 'Selected day background and text.' },
        { name: '--chillcalendar-range', description: 'In-range day background.' },
        { name: '--chillcalendar-today', description: 'Today marker colour.' },
        { name: '--chillcalendar-bg / --chillcalendar-text / --chillcalendar-muted', description: 'Surface, text and outside-day colours.' },
        { name: '--chillcalendar-border / --chillcalendar-hover / --chillcalendar-disabled', description: 'Borders, hover background and disabled days.' },
    ],
    a11y: [
        'Rendered as `role="grid"` with rows, column headers and gridcells; the title is a polite live region.',
        'Arrow keys move by day/week; Home/End go to the start/end of the week; PageUp/PageDown change month; Shift+PageUp/PageDown change year.',
        'Enter or Space selects; Escape in range mode clears a half-picked range.',
        'Each day has an `aria-label`; today has `aria-current="date"`; blocked days have `aria-disabled`.',
    ],
    tips: [
        'Dates are local-time. Pass `"YYYY-MM-DD"` strings to avoid timezone shifts from `new Date(isoString)`.',
        'Use `mode: "none"` with `events` for a read-only schedule.',
        'The module is safe to import on the server; create the calendar in the browser and `destroy()` it on unmount.',
    ],
    related: ['datepicker', 'timeline', 'countdown', 'reltime'],
    keywords: ['date', 'month', 'schedule', 'booking', 'range picker', 'agenda', 'events'],
};

export default doc;
