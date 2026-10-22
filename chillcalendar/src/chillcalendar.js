/**
 * ChillCalendar - Zero-dependency month-grid calendar (self-contained)
 *
 * @example
 *   const cal = ChillCalendar.create({
 *     mode: 'range',                       // 'single' | 'range' | 'none'
 *     locale: 'en-GB', weekStart: 1,
 *     min: '2025-01-01', max: new Date(2030, 11, 31),
 *     events: [{ date: '2025-06-12', title: 'Launch', color: '#22c55e' }],
 *     onSelect: v => console.log(v),       // Date  |  { start: Date, end: Date|null }
 *     onEventClick: (ev, e) => {}
 *   });
 *   document.body.appendChild(cal.element);
 *
 * Options
 *   value          initial selection: Date | 'YYYY-MM-DD' | { start, end }       default null
 *   mode           'single' | 'range' | 'none'                                   default 'single'
 *   month          initial month shown (Date | 'YYYY-MM-DD')                     default selection start or today
 *   locale         BCP-47 locale for month / weekday names (Intl)                default undefined (runtime default)
 *   weekStart      0 = Sunday … 6 = Saturday                                     default 0
 *   min / max      earliest / latest selectable date (Date | 'YYYY-MM-DD')       default null
 *   isDisabled     (Date) => boolean                                             default null
 *   events         Array<{ id?, date: Date|'YYYY-MM-DD', title, color? }>        default []
 *   eventDisplay   'dots' | 'chips'                                              default 'dots'
 *   maxEvents      max events rendered per day cell                              default 3
 *   showOutsideDays  render days of adjacent months                              default true
 *   todayButton    show a "Today" button                                         default true
 *   labels         { today, prev, next, events }                                 default English
 *   ariaLabel      grid label                                                    default 'Calendar'
 *   onSelect(value) onMonthChange(year, month0) onEventClick(event, domEvent)
 *
 * Methods: getValue(), setValue(v), clear(), setMonth(year, month0), nextMonth(), prevMonth(), goToToday(),
 *          setEvents(list), addEvent(ev), getMonth(), on(evt, fn), off(evt, fn), destroy()
 * Events:  select, monthChange, eventClick
 *
 * Keyboard (on the grid): arrows move by day/week, Home/End = start/end of week, PageUp/PageDown = month,
 *          Shift+PageUp/PageDown = year, Enter/Space selects, Escape in range mode clears a half-picked range.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcalendar-styles';
    let uid = 0;

    /* ---------------- date helpers (local time, no mutation) ---------------- */
    function parse(v) {
        if (v == null || v === '') return null;
        if (isDate(v)) return isNaN(v.getTime()) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
        if (typeof v === 'number') return parse(new Date(v));
        if (typeof v === 'string') {
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
            if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return parse(new Date(v));
        }
        return null;
    }
    function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]'; }
    function iso(d) {
        const p = n => (n < 10 ? '0' : '') + n;
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function addMonths(d, n) {
        const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
        const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
        return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
    }
    function same(a, b) { return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function cmp(a, b) { return a.getTime() - b.getTime(); }

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcalendar-bg: #ffffff;
        --chillcalendar-text: #171717;
        --chillcalendar-muted: #9ca3af;
        --chillcalendar-border: #e5e5e5;
        --chillcalendar-hover: #f3f4f6;
        --chillcalendar-primary: #3b82f6;
        --chillcalendar-primary-text: #ffffff;
        --chillcalendar-range: rgba(59,130,246,.14);
        --chillcalendar-today: #3b82f6;
        --chillcalendar-disabled: #d1d5db;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillcalendar-bg: #171717;
          --chillcalendar-text: #fafafa;
          --chillcalendar-muted: #737373;
          --chillcalendar-border: #404040;
          --chillcalendar-hover: #262626;
          --chillcalendar-range: rgba(59,130,246,.28);
          --chillcalendar-disabled: #525252;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillcalendar-bg: #171717;
        --chillcalendar-text: #fafafa;
        --chillcalendar-muted: #737373;
        --chillcalendar-border: #404040;
        --chillcalendar-hover: #262626;
        --chillcalendar-range: rgba(59,130,246,.28);
        --chillcalendar-disabled: #525252;
      }

      .chillcalendar { display: inline-block; min-width: 280px; max-width: 100%; padding: 12px; background: var(--chillcalendar-bg); color: var(--chillcalendar-text); border: 1px solid var(--chillcalendar-border); border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; user-select: none; }
      .chillcalendar *, .chillcalendar *::before, .chillcalendar *::after { box-sizing: border-box; }
      .chillcalendar-header { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
      .chillcalendar-title { flex: 1; text-align: center; font-weight: 600; font-size: 15px; text-transform: capitalize; }
      .chillcalendar-nav, .chillcalendar-today { font: inherit; min-width: 32px; min-height: 32px; padding: 0 8px; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background .15s ease; }
      .chillcalendar-nav:hover:not(:disabled), .chillcalendar-today:hover { background: var(--chillcalendar-hover); }
      .chillcalendar-nav:disabled { opacity: .35; cursor: not-allowed; }
      .chillcalendar-today { font-size: 12px; font-weight: 500; border: 1px solid var(--chillcalendar-border); }
      .chillcalendar-nav::before { content: ""; width: 8px; height: 8px; border-left: 2px solid currentColor; border-bottom: 2px solid currentColor; }
      .chillcalendar-prev::before { transform: translateX(2px) rotate(45deg); }
      .chillcalendar-next::before { transform: translateX(-2px) rotate(-135deg); }
      .chillcalendar-nav:focus-visible, .chillcalendar-today:focus-visible, .chillcalendar-cell:focus-visible, .chillcalendar-event:focus-visible { outline: 2px solid var(--chillcalendar-primary); outline-offset: 1px; }
      .chillcalendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px 0; }
      .chillcalendar-row { display: contents; }
      .chillcalendar-dow { text-align: center; font-size: 12px; font-weight: 600; color: var(--chillcalendar-muted); padding: 6px 0; text-transform: uppercase; letter-spacing: .03em; }
      .chillcalendar-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; min-height: 40px; padding: 4px 2px; border-radius: 8px; cursor: pointer; font-variant-numeric: tabular-nums; transition: background .12s ease; outline-offset: -2px; }
      .chillcalendar-cell:hover:not([aria-disabled="true"]) { background: var(--chillcalendar-hover); }
      .chillcalendar-day { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; }
      .chillcalendar-outside { color: var(--chillcalendar-muted); }
      .chillcalendar-today-cell .chillcalendar-day { box-shadow: inset 0 0 0 2px var(--chillcalendar-today); }
      .chillcalendar-cell[aria-disabled="true"] { color: var(--chillcalendar-disabled); cursor: not-allowed; text-decoration: line-through; }
      .chillcalendar-cell[aria-selected="true"] .chillcalendar-day { background: var(--chillcalendar-primary); color: var(--chillcalendar-primary-text); box-shadow: none; font-weight: 600; }
      .chillcalendar-inrange { background: var(--chillcalendar-range); border-radius: 0; }
      .chillcalendar-range-start { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
      .chillcalendar-range-end { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
      .chillcalendar-dots { display: flex; gap: 2px; min-height: 5px; }
      .chillcalendar-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--chillcalendar-ev, var(--chillcalendar-primary)); }
      .chillcalendar-chips { display: flex; flex-direction: column; gap: 2px; width: 100%; }
      .chillcalendar-event { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 1px 4px; font-size: 11px; line-height: 1.3; border-radius: 4px; color: #fff; background: var(--chillcalendar-ev, var(--chillcalendar-primary)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      .chillcalendar-more { font-size: 10px; color: var(--chillcalendar-muted); }
      .chillcalendar-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .chillcalendar-hasChips .chillcalendar-cell { min-height: 76px; }
      @media (prefers-reduced-motion: reduce) {
        .chillcalendar-nav, .chillcalendar-cell, .chillcalendar-today { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    class ChillCalendarInstance {
        constructor(options, host) {
            injectCSS();
            const o = this.options = Object.assign({
                value: null, mode: 'single', month: null, locale: undefined, weekStart: 0, min: null, max: null, isDisabled: null,
                events: [], eventDisplay: 'dots', maxEvents: 3, showOutsideDays: true, todayButton: true,
                labels: {}, ariaLabel: 'Calendar', onSelect: null, onMonthChange: null, onEventClick: null
            }, options || {});
            o.labels = Object.assign({ today: 'Today', prev: 'Previous month', next: 'Next month', events: 'events' }, o.labels);
            this._id = ++uid;
            this._handlers = {};
            this._destroyed = false;
            this._hover = null;
            this._min = parse(o.min);
            this._max = parse(o.max);
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this._setEvents(o.events);
            this._initValue(o.value);
            const monthOpt = parse(o.month);
            const start = monthOpt || this._sel.start || new Date();
            this._view = new Date(start.getFullYear(), start.getMonth(), 1);
            this._focus = this._sel.start && sameMonth(this._sel.start, this._view) ? this._sel.start
                : monthOpt ? monthOpt : (sameMonth(new Date(), this._view) ? parse(new Date()) : new Date(this._view));
            this._build();
            this._render();
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...a) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, a)); }
        _cb(name, ...a) { const f = this.options[name]; if (typeof f === 'function') f.apply(this, a); }

        /* ---------------- state ---------------- */
        _initValue(v) {
            this._sel = { start: null, end: null };
            if (v && typeof v === 'object' && !isDate(v) && ('start' in v || 'end' in v)) {
                this._sel.start = parse(v.start); this._sel.end = parse(v.end);
            } else this._sel.start = parse(v);
            if (this.options.mode === 'single') this._sel.end = null;
            if (this._sel.start && this._sel.end && cmp(this._sel.start, this._sel.end) > 0) { const t = this._sel.start; this._sel.start = this._sel.end; this._sel.end = t; }
        }

        getValue() {
            if (this.options.mode === 'range') return { start: this._sel.start ? new Date(this._sel.start) : null, end: this._sel.end ? new Date(this._sel.end) : null };
            return this._sel.start ? new Date(this._sel.start) : null;
        }
        setValue(v) {
            this._initValue(v);
            if (this._sel.start) { this._view = new Date(this._sel.start.getFullYear(), this._sel.start.getMonth(), 1); this._focus = new Date(this._sel.start); }
            this._render();
            return this;
        }
        clear() { this._sel = { start: null, end: null }; this._hover = null; this._render(); this._fireSelect(); return this; }

        _setEvents(list) {
            this._events = new Map();
            (list || []).forEach(ev => this._addEv(ev));
        }
        _addEv(ev) {
            const d = parse(ev && ev.date);
            if (!d) return;
            const k = iso(d);
            if (!this._events.has(k)) this._events.set(k, []);
            this._events.get(k).push(ev);
        }
        setEvents(list) { this._setEvents(list); this._render(); return this; }
        addEvent(ev) { this._addEv(ev); this._render(); return this; }

        _disabled(d) {
            if (this._min && cmp(d, this._min) < 0) return true;
            if (this._max && cmp(d, this._max) > 0) return true;
            const f = this.options.isDisabled;
            return typeof f === 'function' ? !!f(new Date(d)) : false;
        }

        getMonth() { return { year: this._view.getFullYear(), month: this._view.getMonth() }; }
        setMonth(year, month) {
            this._view = new Date(year, month, 1);
            const last = new Date(year, month + 1, 0).getDate();
            this._focus = new Date(year, month, Math.min(this._focus.getDate(), last));
            this._render();
            this._monthChanged();
            return this;
        }
        nextMonth() { return this.setMonth(this._view.getFullYear(), this._view.getMonth() + 1); }
        prevMonth() { return this.setMonth(this._view.getFullYear(), this._view.getMonth() - 1); }
        goToToday() {
            const t = parse(new Date());
            this._focus = t;
            this._view = new Date(t.getFullYear(), t.getMonth(), 1);
            this._render(); this._monthChanged();
            return this;
        }
        _monthChanged() {
            const y = this._view.getFullYear(), m = this._view.getMonth();
            this._cb('onMonthChange', y, m); this._emit('monthChange', y, m);
        }

        /* ---------------- DOM ---------------- */
        _fmt(opts) { try { return new Intl.DateTimeFormat(this.options.locale, opts); } catch (e) { return new Intl.DateTimeFormat(undefined, opts); } }

        _build() {
            const o = this.options, root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = (this._prevClass + ' chillcalendar' + (o.eventDisplay === 'chips' ? ' chillcalendar-hasChips' : '')).trim();
            const head = document.createElement('div'); head.className = 'chillcalendar-header';
            this._prevBtn = document.createElement('button'); this._prevBtn.type = 'button';
            this._prevBtn.className = 'chillcalendar-nav chillcalendar-prev'; this._prevBtn.setAttribute('aria-label', o.labels.prev);
            this._nextBtn = document.createElement('button'); this._nextBtn.type = 'button';
            this._nextBtn.className = 'chillcalendar-nav chillcalendar-next'; this._nextBtn.setAttribute('aria-label', o.labels.next);
            this._title = document.createElement('div'); this._title.className = 'chillcalendar-title';
            this._title.id = 'chillcalendar-' + this._id + '-title';
            this._title.setAttribute('aria-live', 'polite');
            head.appendChild(this._prevBtn); head.appendChild(this._title);
            if (o.todayButton) {
                this._todayBtn = document.createElement('button'); this._todayBtn.type = 'button';
                this._todayBtn.className = 'chillcalendar-today'; this._todayBtn.textContent = o.labels.today;
                head.appendChild(this._todayBtn);
            }
            head.appendChild(this._nextBtn);
            this._grid = document.createElement('div'); this._grid.className = 'chillcalendar-grid';
            this._grid.setAttribute('role', 'grid');
            this._grid.setAttribute('aria-labelledby', this._title.id);
            this._grid.setAttribute('aria-label', o.ariaLabel);
            if (o.mode === 'range') this._grid.setAttribute('aria-multiselectable', 'true');
            root.appendChild(head); root.appendChild(this._grid);

            this._onPrev = () => this.prevMonth();
            this._onNext = () => this.nextMonth();
            this._onToday = () => this.goToToday();
            this._onClick = (e) => this._handleClick(e);
            this._onKey = (e) => this._handleKey(e);
            this._onOver = (e) => {
                if (o.mode !== 'range' || !this._sel.start || this._sel.end) return;
                const c = e.target.closest && e.target.closest('.chillcalendar-cell');
                if (c && c._date && !this._disabled(c._date)) { this._hover = c._date; this._paintRange(); }
            };
            this._onLeave = () => { if (this._hover) { this._hover = null; this._paintRange(); } };
            this._prevBtn.addEventListener('click', this._onPrev);
            this._nextBtn.addEventListener('click', this._onNext);
            if (this._todayBtn) this._todayBtn.addEventListener('click', this._onToday);
            this._grid.addEventListener('click', this._onClick);
            this._grid.addEventListener('keydown', this._onKey);
            this._grid.addEventListener('mouseover', this._onOver);
            this._grid.addEventListener('mouseleave', this._onLeave);
        }

        _firstOfGrid() {
            const first = this._view;
            const lead = (first.getDay() - this.options.weekStart + 7) % 7;
            return addDays(first, -lead);
        }

        _render(keepFocus) {
            const o = this.options;
            const hadFocus = keepFocus !== false && this._grid.contains(document.activeElement);
            const g = this._grid;
            while (g.firstChild) g.removeChild(g.firstChild);
            this._title.textContent = this._fmt({ month: 'long', year: 'numeric' }).format(this._view);

            // weekday header
            const hr = document.createElement('div'); hr.className = 'chillcalendar-row'; hr.setAttribute('role', 'row');
            const wd = this._fmt({ weekday: 'short' });
            const wdLong = this._fmt({ weekday: 'long' });
            for (let i = 0; i < 7; i++) {
                const d = new Date(2023, 0, 1 + ((o.weekStart + i) % 7)); // 2023-01-01 is a Sunday
                const h = document.createElement('div');
                h.className = 'chillcalendar-dow'; h.setAttribute('role', 'columnheader');
                h.setAttribute('abbr', wdLong.format(d));
                h.textContent = wd.format(d);
                hr.appendChild(h);
            }
            g.appendChild(hr);

            const start = this._firstOfGrid();
            const full = this._fmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const dayFmt = this._fmt({ day: 'numeric' });
            const today = parse(new Date());
            // focus must land on a visible, enabled cell
            let focus = this._focus;
            if (!sameMonth(focus, this._view)) focus = new Date(this._view);
            this._cells = [];
            for (let r = 0; r < 6; r++) {
                const row = document.createElement('div'); row.className = 'chillcalendar-row'; row.setAttribute('role', 'row');
                for (let c = 0; c < 7; c++) {
                    const d = addDays(start, r * 7 + c);
                    const outside = d.getMonth() !== this._view.getMonth();
                    const cell = document.createElement('div');
                    cell._date = d;
                    cell.className = 'chillcalendar-cell' + (outside ? ' chillcalendar-outside' : '') + (same(d, today) ? ' chillcalendar-today-cell' : '');
                    cell.setAttribute('role', 'gridcell');
                    cell.setAttribute('data-date', iso(d));
                    const evs = this._events.get(iso(d)) || [];
                    let label = full.format(d);
                    if (evs.length) label += ', ' + evs.length + ' ' + o.labels.events + ': ' + evs.map(e => e.title).join(', ');
                    if (outside && !o.showOutsideDays) {
                        cell.style.visibility = 'hidden'; cell.setAttribute('aria-hidden', 'true'); cell.tabIndex = -1;
                    } else {
                        cell.setAttribute('aria-label', label);
                        cell.tabIndex = same(d, focus) && !outside ? 0 : -1;
                        if (same(d, today)) cell.setAttribute('aria-current', 'date');
                        if (this._disabled(d)) cell.setAttribute('aria-disabled', 'true');
                        const day = document.createElement('span'); day.className = 'chillcalendar-day'; day.setAttribute('aria-hidden', 'true');
                        day.textContent = dayFmt.format(d);
                        cell.appendChild(day);
                        this._renderEvents(cell, evs);
                    }
                    row.appendChild(cell);
                    this._cells.push(cell);
                }
                g.appendChild(row);
            }
            this._paintSelection();
            // nav limits
            const prevLast = new Date(this._view.getFullYear(), this._view.getMonth(), 0);
            const nextFirst = new Date(this._view.getFullYear(), this._view.getMonth() + 1, 1);
            this._prevBtn.disabled = !!(this._min && cmp(prevLast, this._min) < 0);
            this._nextBtn.disabled = !!(this._max && cmp(nextFirst, this._max) > 0);
            if (hadFocus) { const t = this._cellFor(this._focus); if (t) t.focus(); }
        }

        _renderEvents(cell, evs) {
            const o = this.options;
            if (!evs.length) { if (o.eventDisplay !== 'chips') { const d = document.createElement('span'); d.className = 'chillcalendar-dots'; cell.appendChild(d); } return; }
            const shown = evs.slice(0, o.maxEvents);
            if (o.eventDisplay === 'chips') {
                const wrap = document.createElement('div'); wrap.className = 'chillcalendar-chips';
                shown.forEach(ev => {
                    const b = document.createElement('button'); b.type = 'button'; b.className = 'chillcalendar-event';
                    b.tabIndex = -1;
                    b.textContent = ev.title == null ? '' : String(ev.title);
                    if (ev.color) b.style.setProperty('--chillcalendar-ev', ev.color);
                    b._ev = ev;
                    wrap.appendChild(b);
                });
                if (evs.length > shown.length) { const m = document.createElement('span'); m.className = 'chillcalendar-more'; m.textContent = '+' + (evs.length - shown.length); wrap.appendChild(m); }
                cell.appendChild(wrap);
            } else {
                const dots = document.createElement('span'); dots.className = 'chillcalendar-dots'; dots.setAttribute('aria-hidden', 'true');
                shown.forEach(ev => { const d = document.createElement('span'); d.className = 'chillcalendar-dot'; if (ev.color) d.style.setProperty('--chillcalendar-ev', ev.color); dots.appendChild(d); });
                cell.appendChild(dots);
            }
        }

        _cellFor(d) { return this._cells.find(c => same(c._date, d) && c.getAttribute('aria-hidden') !== 'true' && (d.getMonth() === this._view.getMonth() ? c._date.getMonth() === this._view.getMonth() : true)); }

        _paintSelection() {
            const { start, end } = this._sel;
            const hover = this._hover;
            let lo = start, hi = end;
            if (this.options.mode === 'range' && start && !end && hover) { lo = cmp(hover, start) < 0 ? hover : start; hi = cmp(hover, start) < 0 ? start : hover; }
            this._cells.forEach(c => {
                const d = c._date;
                const sel = !!(start && same(d, start)) || !!(end && same(d, end));
                if (this.options.mode === 'none') c.removeAttribute('aria-selected'); else c.setAttribute('aria-selected', sel ? 'true' : 'false');
                const inRange = this.options.mode === 'range' && lo && hi && cmp(d, lo) >= 0 && cmp(d, hi) <= 0 && !same(lo, hi);
                c.classList.toggle('chillcalendar-inrange', !!inRange);
                c.classList.toggle('chillcalendar-range-start', !!(inRange && same(d, lo)));
                c.classList.toggle('chillcalendar-range-end', !!(inRange && same(d, hi)));
            });
        }
        _paintRange() { this._paintSelection(); }

        /* ---------------- interaction ---------------- */
        _handleClick(e) {
            const chip = e.target.closest && e.target.closest('.chillcalendar-event');
            if (chip && chip._ev) { this._cb('onEventClick', chip._ev, e); this._emit('eventClick', chip._ev, e); }
            const cell = e.target.closest && e.target.closest('.chillcalendar-cell');
            if (!cell || !cell._date || cell.getAttribute('aria-hidden') === 'true') return;
            this._pick(cell._date, true);
        }

        _pick(d, focusCell) {
            if (this._disabled(d)) return;
            const o = this.options;
            const outside = d.getMonth() !== this._view.getMonth();
            this._focus = d;
            if (outside) this._view = new Date(d.getFullYear(), d.getMonth(), 1);
            if (o.mode === 'single') {
                this._sel = { start: d, end: null };
            } else if (o.mode === 'range') {
                const s = this._sel;
                if (!s.start || (s.start && s.end)) this._sel = { start: d, end: null };
                else if (cmp(d, s.start) < 0) this._sel = { start: d, end: s.start };
                else this._sel = { start: s.start, end: d };
                this._hover = null;
            }
            this._render(focusCell !== false);
            if (outside) this._monthChanged();
            if (o.mode !== 'none') this._fireSelect();
        }

        _fireSelect() {
            const v = this.getValue();
            this._cb('onSelect', v); this._emit('select', v);
        }

        _handleKey(e) {
            const cell = e.target.closest && e.target.closest('.chillcalendar-cell');
            if (!cell || !cell._date || e.altKey || e.ctrlKey || e.metaKey) return;
            const d = cell._date;
            let n = null;
            switch (e.key) {
                case 'ArrowLeft': n = addDays(d, -1); break;
                case 'ArrowRight': n = addDays(d, 1); break;
                case 'ArrowUp': n = addDays(d, -7); break;
                case 'ArrowDown': n = addDays(d, 7); break;
                case 'Home': n = addDays(d, -((d.getDay() - this.options.weekStart + 7) % 7)); break;
                case 'End': n = addDays(d, 6 - ((d.getDay() - this.options.weekStart + 7) % 7)); break;
                case 'PageUp': n = addMonths(d, e.shiftKey ? -12 : -1); break;
                case 'PageDown': n = addMonths(d, e.shiftKey ? 12 : 1); break;
                case 'Enter': case ' ': e.preventDefault(); this._pick(d, true); return;
                case 'Escape':
                    if (this.options.mode === 'range' && this._sel.start && !this._sel.end) { this._sel = { start: null, end: null }; this._hover = null; this._render(); e.preventDefault(); }
                    return;
                default: return;
            }
            e.preventDefault();
            // respect min/max: clamp navigation target
            if (this._min && cmp(n, this._min) < 0) n = new Date(this._min);
            if (this._max && cmp(n, this._max) > 0) n = new Date(this._max);
            const monthChanged = n.getMonth() !== this._view.getMonth() || n.getFullYear() !== this._view.getFullYear();
            this._focus = n;
            if (monthChanged) this._view = new Date(n.getFullYear(), n.getMonth(), 1);
            this._render(true);
            if (monthChanged) this._monthChanged();
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._prevBtn.removeEventListener('click', this._onPrev);
            this._nextBtn.removeEventListener('click', this._onNext);
            if (this._todayBtn) this._todayBtn.removeEventListener('click', this._onToday);
            this._grid.removeEventListener('click', this._onClick);
            this._grid.removeEventListener('keydown', this._onKey);
            this._grid.removeEventListener('mouseover', this._onOver);
            this._grid.removeEventListener('mouseleave', this._onLeave);
            this._handlers = {};
            const root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            if (this._ownsElement) { if (root.parentNode) root.parentNode.removeChild(root); }
            else root.className = this._prevClass;
        }
    }

    function sameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }

    const ChillCalendar = {
        version: VERSION,
        create(options) { return new ChillCalendarInstance(options); },
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            return new ChillCalendarInstance(options, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCalendar;
    } else {
        window.ChillCalendar = ChillCalendar;
    }

})(typeof window !== 'undefined' ? window : this);
