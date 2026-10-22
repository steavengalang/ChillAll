/**
 * ChillDate - Zero-dependency Date Picker
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const dp = ChillDate.create('#date', { format: 'DD/MM/YYYY', minDate: '2026-01-01', onChange: d => {} });
 *   dp.getValue(); dp.setValue('2026-03-14'); dp.destroy();
 *
 * Options (all optional):
 *   format          'YYYY-MM-DD'   tokens: YYYY YY MMMM MMM MM M DD D
 *   minDate/maxDate Date | 'YYYY-MM-DD' | timestamp   (inclusive; day granularity, local time)
 *   disableDate     fn(date) -> true to disable that day
 *   firstDayOfWeek  0 (Sunday) .. 6
 *   months          12 month names;  weekdays: 7 two-letter headings (Sunday first);  weekdaysLong: 7 full names
 *   closeOnSelect   true
 *   onChange(date|null), onOpen(), onClose()
 * Methods: open, close, toggle, getValue, setValue, clear, destroy, on(event, fn)   Events: change, open, close
 * Keyboard (calendar open): arrows move by day/week, PageUp/PageDown by month (Shift = year),
 *   Home/End = start/end of week, Enter/Space selects, Escape closes and returns focus to the input.
 *   ArrowDown / Enter on the input opens the calendar. The input also fires a native `change` event.
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilldate_css_injected__';

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] || document.getElementById('chilldate-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilldate-styles';
        style.textContent = `
      :root {
        --chilldate-bg: #ffffff;
        --chilldate-border: #e5e5e5;
        --chilldate-text: #171717;
        --chilldate-text-light: #737373;
        --chilldate-primary: #3b82f6;
        --chilldate-hover: #f5f5f5;
        --chilldate-range: rgba(59, 130, 246, 0.2);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilldate-bg: #171717;
          --chilldate-border: #404040;
          --chilldate-text: #fafafa;
          --chilldate-text-light: #a3a3a3;
          --chilldate-hover: #262626;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilldate-bg: #171717;
        --chilldate-border: #404040;
        --chilldate-text: #fafafa;
        --chilldate-text-light: #a3a3a3;
        --chilldate-hover: #262626;
      }

      .chilldate-input {
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid var(--chilldate-border);
        border-radius: 6px;
        background: var(--chilldate-bg);
        color: var(--chilldate-text);
        cursor: pointer;
        outline: none;
        min-width: 150px;
      }

      .chilldate-input:focus {
        border-color: var(--chilldate-primary);
      }

      .chilldate-input:focus-visible,
      .chilldate-nav-btn:focus-visible,
      .chilldate-day:focus-visible,
      .chilldate-btn:focus-visible {
        outline: 2px solid var(--chilldate-primary);
        outline-offset: 2px;
      }

      .chilldate-popup {
        position: absolute;
        z-index: 99999;
        background: var(--chilldate-bg);
        border: 1px solid var(--chilldate-border);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 16px;
        min-width: 280px;
        color: var(--chilldate-text);
        animation: chilldate-fadeIn 0.15s ease-out;
      }

      @keyframes chilldate-fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .chilldate-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .chilldate-nav {
        display: flex;
        gap: 4px;
      }

      .chilldate-nav-btn {
        width: 32px;
        height: 32px;
        border: 1px solid var(--chilldate-border);
        border-radius: 4px;
        background: var(--chilldate-bg);
        color: var(--chilldate-text);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chilldate-nav-btn:hover {
        background: var(--chilldate-hover);
      }

      .chilldate-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--chilldate-text);
      }

      .chilldate-grid { display: block; }

      .chilldate-weekdays,
      .chilldate-week {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }

      .chilldate-weekdays { margin-bottom: 8px; }
      .chilldate-week { margin-bottom: 2px; }

      .chilldate-weekday {
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        color: var(--chilldate-text-light);
        padding: 4px;
      }

      .chilldate-cell { display: flex; justify-content: center; }

      .chilldate-day {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--chilldate-text);
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .chilldate-day:hover:not(.disabled):not(.selected) {
        background: var(--chilldate-hover);
      }

      .chilldate-day.other-month {
        color: var(--chilldate-text-light);
        opacity: 0.5;
      }

      .chilldate-day.today {
        border: 1px solid var(--chilldate-primary);
      }

      .chilldate-day.selected {
        background: var(--chilldate-primary);
        color: white;
        opacity: 1;
      }

      .chilldate-day.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .chilldate-day.in-range {
        background: var(--chilldate-range);
      }

      .chilldate-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--chilldate-border);
      }

      .chilldate-btn {
        padding: 6px 12px;
        min-height: 32px;
        font-size: 12px;
        border: 1px solid var(--chilldate-border);
        border-radius: 4px;
        background: var(--chilldate-bg);
        color: var(--chilldate-text);
        cursor: pointer;
      }

      .chilldate-btn:hover {
        background: var(--chilldate-hover);
      }

      .chilldate-btn.primary {
        background: var(--chilldate-primary);
        color: white;
        border-color: var(--chilldate-primary);
      }

      .chilldate-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (max-width: 640px) {
        .chilldate-popup {
          position: fixed;
          left: 16px !important;
          right: 16px !important;
          bottom: 16px !important;
          top: auto !important;
          width: auto;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .chilldate-popup { animation: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- date helpers (all local time, day granularity) ---------------------
    function startOfDay(d) {
        const r = new Date(d.getTime());
        r.setHours(0, 0, 0, 0);
        return r;
    }

    function sameDay(a, b) {
        return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function daysIn(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /** Date | timestamp | 'YYYY-MM-DD' (parsed as LOCAL, not UTC) | other string -> Date or null */
    function toDate(v) {
        if (v === null || v === undefined || v === '') return null;
        if (v instanceof Date) return isNaN(v.getTime()) ? null : startOfDay(v);
        if (typeof v === 'string') {
            const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v.trim());
            if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : startOfDay(d);
    }

    function addMonths(date, n) {
        const y = date.getFullYear();
        const m = date.getMonth() + n;
        const first = new Date(y, m, 1);
        return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), daysIn(first.getFullYear(), first.getMonth())));
    }

    function escapeRe(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    class ChillDateInstance {
        constructor(input, config = {}) {
            this.input = typeof input === 'string'
                ? (typeof document !== 'undefined' ? document.querySelector(input) : null)
                : input;

            this.config = {
                format: config.format || 'YYYY-MM-DD',
                minDate: config.minDate || null,
                maxDate: config.maxDate || null,
                onChange: config.onChange || null,
                firstDayOfWeek: 0,
                closeOnSelect: true,
                months: MONTHS,
                weekdays: DAYS,
                weekdaysLong: DAYS_LONG,
                ...config
            };
            this.config.firstDayOfWeek = ((parseInt(this.config.firstDayOfWeek, 10) || 0) % 7 + 7) % 7;

            this.selectedDate = null;
            this.viewDate = startOfDay(new Date());   // also the keyboard-focused day
            this.popup = null;
            this.isOpen = false;
            this._handlers = {};
            this._cleanups = [];
            this._openCleanups = [];
            this._destroyed = false;
            this.id = 'chilldate-' + (++uid);

            if (this.input) {
                this.init();
            }
        }

        init() {
            injectCSS();
            this._prev = {
                readOnly: this.input.readOnly,
                haspopup: this.input.getAttribute('aria-haspopup'),
                expanded: this.input.getAttribute('aria-expanded')
            };
            this.input.classList.add('chilldate-input');
            this.input.readOnly = true;
            this.input.setAttribute('aria-haspopup', 'dialog');
            this.input.setAttribute('aria-expanded', 'false');

            // pick up an existing value
            if (this.input.value) {
                const d = this.parseDate(this.input.value);
                if (d) { this.selectedDate = d; this.viewDate = new Date(d); }
            }
            this.bindEvents();
        }

        // ---- events ---------------------------------------------------------
        on(event, fn) {
            (this._handlers[event] = this._handlers[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._handlers[event];
            if (l) this._handlers[event] = fn ? l.filter(f => f !== fn) : [];
            return this;
        }

        _emit(event, ...args) {
            (this._handlers[event] || []).slice().forEach(fn => { try { fn(...args); } catch (e) { /* ignore */ } });
        }

        _bind(list, target, type, fn) {
            target.addEventListener(type, fn);
            list.push(() => target.removeEventListener(type, fn));
        }

        bindEvents() {
            this._bind(this._cleanups, this.input, 'click', () => this.toggle());
            this._bind(this._cleanups, this.input, 'keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.open();
                } else if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        toggle() {
            this.isOpen ? this.close() : this.open();
        }

        open() {
            if (this.isOpen || this._destroyed) return;
            this.isOpen = true;
            if (this.selectedDate) this.viewDate = new Date(this.selectedDate);
            this.createPopup();
            this.input.setAttribute('aria-expanded', 'true');

            // outside-click / Escape listeners only exist while open
            this._bind(this._openCleanups, document, 'pointerdown', (e) => {
                if (this.isOpen && !this.input.contains(e.target) && this.popup && !this.popup.contains(e.target)) {
                    this.close();
                }
            });
            this._bind(this._openCleanups, document, 'keydown', (e) => {
                if (this.isOpen && e.key === 'Escape') {
                    this.close(true);
                }
            });
            this._bind(this._openCleanups, window, 'resize', () => this.position());
            this.focusDay();
            if (typeof this.config.onOpen === 'function') this.config.onOpen();
            this._emit('open');
        }

        close(returnFocus) {
            if (!this.isOpen) return;
            this.isOpen = false;
            this._openCleanups.forEach(fn => fn());
            this._openCleanups = [];
            const hadFocus = this.popup && this.popup.contains(document.activeElement);
            if (this.popup) {
                this.popup.remove();
                this.popup = null;
            }
            if (this.input) {
                this.input.setAttribute('aria-expanded', 'false');
                if (returnFocus || hadFocus) this.input.focus();
            }
            if (typeof this.config.onClose === 'function') this.config.onClose();
            this._emit('close');
        }

        createPopup() {
            this.popup = document.createElement('div');
            this.popup.className = 'chilldate-popup';
            this.popup.id = this.id + '-popup';
            this.popup.setAttribute('role', 'dialog');
            this.popup.setAttribute('aria-label', 'Choose date');
            this.input.setAttribute('aria-controls', this.popup.id);

            this.popup.addEventListener('click', (e) => this._onPopupClick(e));
            this.popup.addEventListener('keydown', (e) => this._onPopupKey(e));
            this.render();
            document.body.appendChild(this.popup);
            this.position();
        }

        position() {
            if (!this.popup) return;
            const rect = this.input.getBoundingClientRect();
            const sx = window.scrollX || 0;
            const sy = window.scrollY || 0;
            let top = rect.bottom + sy + 4;
            const ph = this.popup.offsetHeight || 0;
            if (ph && rect.bottom + ph + 8 > window.innerHeight && rect.top - ph - 4 > 0) {
                top = rect.top + sy - ph - 4;
            }
            this.popup.style.top = `${top}px`;
            this.popup.style.left = `${rect.left + sx}px`;
        }

        // ---- rendering (DOM API only) --------------------------------------
        _el(tag, cls, text) {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            if (text !== undefined && text !== null) e.textContent = text;
            return e;
        }

        render() {
            if (!this.popup) return;

            const cfg = this.config;
            const year = this.viewDate.getFullYear();
            const month = this.viewDate.getMonth();
            const today = startOfDay(new Date());
            const first = cfg.firstDayOfWeek;

            const firstDay = new Date(year, month, 1);
            const lead = (firstDay.getDay() - first + 7) % 7;
            const gridStart = new Date(year, month, 1 - lead);

            const popup = this.popup;
            popup.textContent = '';

            // header
            const header = this._el('div', 'chilldate-header');
            const mkNav = (action, label, glyph) => {
                const b = this._el('button', 'chilldate-nav-btn', glyph);
                b.type = 'button';
                b.dataset.action = action;
                b.setAttribute('aria-label', label);
                return b;
            };
            const navL = this._el('div', 'chilldate-nav');
            navL.appendChild(mkNav('prev-year', 'Previous year', '«'));
            navL.appendChild(mkNav('prev-month', 'Previous month', '‹'));
            const title = this._el('span', 'chilldate-title', `${cfg.months[month]} ${year}`);
            title.id = this.id + '-title';
            title.setAttribute('aria-live', 'polite');
            const navR = this._el('div', 'chilldate-nav');
            navR.appendChild(mkNav('next-month', 'Next month', '›'));
            navR.appendChild(mkNav('next-year', 'Next year', '»'));
            header.appendChild(navL);
            header.appendChild(title);
            header.appendChild(navR);
            popup.appendChild(header);

            // grid
            const grid = this._el('div', 'chilldate-grid');
            grid.setAttribute('role', 'grid');
            grid.setAttribute('aria-labelledby', title.id);

            const wk = this._el('div', 'chilldate-weekdays');
            wk.setAttribute('role', 'row');
            for (let i = 0; i < 7; i++) {
                const idx = (first + i) % 7;
                const s = this._el('span', 'chilldate-weekday', cfg.weekdays[idx]);
                s.setAttribute('role', 'columnheader');
                s.setAttribute('aria-label', cfg.weekdaysLong[idx]);
                wk.appendChild(s);
            }
            grid.appendChild(wk);

            const focus = startOfDay(this.viewDate);
            for (let w = 0; w < 6; w++) {
                const row = this._el('div', 'chilldate-week');
                row.setAttribute('role', 'row');
                for (let d = 0; d < 7; d++) {
                    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + d);
                    const other = date.getMonth() !== month;
                    const disabled = this.isDateDisabled(date);
                    const selected = sameDay(date, this.selectedDate);

                    const cell = this._el('div', 'chilldate-cell');
                    cell.setAttribute('role', 'gridcell');
                    if (selected) cell.setAttribute('aria-selected', 'true');

                    let cls = 'chilldate-day';
                    if (other) cls += ' other-month';
                    if (sameDay(date, today)) cls += ' today';
                    if (selected) cls += ' selected';
                    if (disabled) cls += ' disabled';
                    const btn = this._el('button', cls, String(date.getDate()));
                    btn.type = 'button';
                    btn.dataset.date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                    btn.setAttribute('aria-label', `${cfg.weekdaysLong[date.getDay()]}, ${cfg.months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`);
                    if (sameDay(date, today)) btn.setAttribute('aria-current', 'date');
                    if (selected) btn.setAttribute('aria-pressed', 'true');
                    if (disabled) btn.setAttribute('aria-disabled', 'true');
                    btn.tabIndex = sameDay(date, focus) ? 0 : -1;
                    cell.appendChild(btn);
                    row.appendChild(cell);
                }
                grid.appendChild(row);
            }
            popup.appendChild(grid);

            // footer
            const footer = this._el('div', 'chilldate-footer');
            [['today', 'Today'], ['clear', 'Clear']].forEach(([a, l]) => {
                const b = this._el('button', 'chilldate-btn', l);
                b.type = 'button';
                b.dataset.action = a;
                footer.appendChild(b);
            });
            popup.appendChild(footer);
        }

        focusDay() {
            if (!this.popup) return;
            const b = this.popup.querySelector('.chilldate-day[tabindex="0"]');
            if (b && b.focus) b.focus();
        }

        _onPopupClick(e) {
            const t = e.target && e.target.closest ? e.target : null;
            if (!t) return;
            const act = t.closest('[data-action]');
            if (act && this.popup.contains(act)) {
                switch (act.dataset.action) {
                    case 'prev-year': this._moveView(addMonths(this.viewDate, -12), act); break;
                    case 'prev-month': this._moveView(addMonths(this.viewDate, -1), act); break;
                    case 'next-month': this._moveView(addMonths(this.viewDate, 1), act); break;
                    case 'next-year': this._moveView(addMonths(this.viewDate, 12), act); break;
                    case 'today': {
                        const d = startOfDay(new Date());
                        if (!this.isDateDisabled(d)) this.selectDate(d);
                        break;
                    }
                    case 'clear': this.clear(); break;
                }
                return;
            }
            const day = t.closest('.chilldate-day');
            if (day && this.popup.contains(day) && !day.classList.contains('disabled')) {
                const [y, m, d] = day.dataset.date.split('-').map(Number);
                this.selectDate(new Date(y, m - 1, d));
            }
        }

        _moveView(date, nav) {
            const action = nav && nav.dataset ? nav.dataset.action : null;
            this.viewDate = date;
            this.render();
            if (action) {
                const b = this.popup.querySelector('[data-action="' + action + '"]');
                if (b) b.focus();
            }
        }

        _onPopupKey(e) {
            const day = e.target && e.target.classList && e.target.classList.contains('chilldate-day') ? e.target : null;
            if (!day) return;
            const cur = startOfDay(this.viewDate);
            const first = this.config.firstDayOfWeek;
            let next = null;
            const shift = e.shiftKey;
            switch (e.key) {
                case 'ArrowLeft': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1); break;
                case 'ArrowRight': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1); break;
                case 'ArrowUp': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7); break;
                case 'ArrowDown': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7); break;
                case 'PageUp': next = addMonths(cur, shift ? -12 : -1); break;
                case 'PageDown': next = addMonths(cur, shift ? 12 : 1); break;
                case 'Home': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - ((cur.getDay() - first + 7) % 7)); break;
                case 'End': next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 6 - ((cur.getDay() - first + 7) % 7)); break;
                default: return;
            }
            e.preventDefault();
            this.viewDate = next;
            this.render();
            this.focusDay();
        }

        isDateDisabled(date) {
            const d = startOfDay(date);
            const min = toDate(this.config.minDate);
            const max = toDate(this.config.maxDate);
            if (min && d < min) return true;
            if (max && d > max) return true;
            if (typeof this.config.disableDate === 'function' && this.config.disableDate(new Date(d.getTime()))) return true;
            return false;
        }

        selectDate(date) {
            const d = toDate(date);
            if (!d) return;
            this.selectedDate = d;
            this.viewDate = new Date(d);
            this.input.value = this.formatDate(d);
            this._notify(new Date(d));
            if (this.config.closeOnSelect !== false) this.close(true);
            else { this.render(); this.focusDay(); }
        }

        _notify(value) {
            if (this.config.onChange) this.config.onChange(value);
            this._emit('change', value);
            if (this.input && typeof window.Event === 'function') {
                this.input.dispatchEvent(new window.Event('change', { bubbles: true }));
            }
        }

        formatDate(date) {
            const pad = n => n.toString().padStart(2, '0');
            const cfg = this.config;
            return cfg.format.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D/g, tok => {
                switch (tok) {
                    case 'YYYY': return String(date.getFullYear());
                    case 'YY': return String(date.getFullYear()).slice(-2);
                    case 'MMMM': return cfg.months[date.getMonth()];
                    case 'MMM': return cfg.months[date.getMonth()].slice(0, 3);
                    case 'MM': return pad(date.getMonth() + 1);
                    case 'M': return String(date.getMonth() + 1);
                    case 'DD': return pad(date.getDate());
                    default: return String(date.getDate());
                }
            });
        }

        /** Parse a string written with this.config.format back into a Date (or null). */
        parseDate(str) {
            if (typeof str !== 'string' || !str.trim()) return null;
            const cfg = this.config;
            const names = [];
            const re = cfg.format.split(/(YYYY|YY|MMMM|MMM|MM|M|DD|D)/).map(part => {
                switch (part) {
                    case 'YYYY': names.push('Y'); return '(\\d{4})';
                    case 'YY': names.push('y'); return '(\\d{2})';
                    case 'MMMM': names.push('N'); return '(' + cfg.months.map(escapeRe).join('|') + ')';
                    case 'MMM': names.push('n'); return '(' + cfg.months.map(m => escapeRe(m.slice(0, 3))).join('|') + ')';
                    case 'MM': case 'M': names.push('m'); return '(\\d{1,2})';
                    case 'DD': case 'D': names.push('d'); return '(\\d{1,2})';
                    default: return escapeRe(part);
                }
            }).join('');
            const m = new RegExp('^' + re + '$', 'i').exec(str.trim());
            if (!m) return toDate(str);
            let y = new Date().getFullYear(), mo = 0, d = 1;
            names.forEach((n, i) => {
                const v = m[i + 1];
                if (n === 'Y') y = +v;
                else if (n === 'y') y = 2000 + +v;
                else if (n === 'm') mo = +v - 1;
                else if (n === 'd') d = +v;
                else if (n === 'N') mo = cfg.months.findIndex(x => x.toLowerCase() === v.toLowerCase());
                else if (n === 'n') mo = cfg.months.findIndex(x => x.slice(0, 3).toLowerCase() === v.toLowerCase());
            });
            const date = new Date(y, mo, d);
            return date.getMonth() === mo && date.getDate() === d ? date : null;
        }

        clear() {
            this.selectedDate = null;
            this.input.value = '';
            this._notify(null);
            this.close(true);
        }

        getValue() {
            return this.selectedDate ? new Date(this.selectedDate) : null;
        }

        setValue(date) {
            if (date) {
                this.selectDate(date);
            } else {
                this.clear();
            }
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this.isOpen = false;
            this._openCleanups.forEach(fn => fn());
            this._openCleanups = [];
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            if (this.popup) { this.popup.remove(); this.popup = null; }
            if (this.input) {
                this.input.classList.remove('chilldate-input');
                this.input.readOnly = this._prev.readOnly;
                ['aria-haspopup', 'aria-expanded'].forEach((a, i) => {
                    const v = i === 0 ? this._prev.haspopup : this._prev.expanded;
                    if (v === null) this.input.removeAttribute(a); else this.input.setAttribute(a, v);
                });
                this.input.removeAttribute('aria-controls');
            }
            this._handlers = {};
        }
    }

    const ChillDate = {
        version: VERSION,

        create(input, config) {
            return new ChillDateInstance(input, config);
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillDate;
    } else {
        window.ChillDate = ChillDate;
    }

})(typeof window !== 'undefined' ? window : this);
