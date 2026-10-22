/**
 * ChillTimePicker - Zero-dependency time picker (12/24h, minute step, popover, keyboard)
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const tp = ChillTimePicker.create({ value: '14:30', hour12: true, minuteStep: 5, popover: true,
 *                                       onChange: v => console.log(v) });   // v is always "HH:mm" (24h) or ''
 *   document.body.appendChild(tp.element);
 *   ChillTimePicker.init('#host', { minuteStep: 15, min: '09:00', max: '17:30' });
 *   tp.getValue(); tp.setValue('08:05'); tp.destroy();
 *
 * Options
 *   value        null     "HH:mm" (24h), "h:mm AM", or Date; null = no selection
 *   hour12       false    12-hour clock with AM/PM column
 *   minuteStep   1        minute granularity (1,5,10,15,30...). Values are snapped to the step.
 *   min / max    null     "HH:mm" limits; out-of-range options are disabled
 *   popover      false    render a trigger button; the panel opens in a popover on <body>
 *   placement    'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
 *   placeholder  'Select time'   trigger text when empty
 *   showNow      true     "Now" shortcut button
 *   closeOnSelect true    (popover) close when a minute (or AM/PM in 12h) is chosen
 *   disabled     false
 *   name         null     hidden input name ("HH:mm")
 *   label        'Time'   aria-label
 *   container    null     element / selector to append into
 *   onChange(value, inst), onOpen(inst), onClose(inst)
 * Methods: getValue, getDisplay, setValue(v, silent), clear, open, close, toggle, isOpen, setDisabled,
 *          on(evt, fn) -> off(), destroy()
 * Events: 'change', 'open', 'close'
 * Static: parse(str) -> "HH:mm" | null, format(value, hour12)
 * Keyboard: Up/Down change the focused column, Left/Right switch columns, Home/End first/last,
 *           Enter/Space select, Esc closes the popover.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chilltimepicker_css_injected__';

    const pad = n => (n < 10 ? '0' : '') + n;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    /** Parse "HH:mm", "H:mm", "h:mm AM|PM", Date -> {h, m} or null */
    function parseTime(v) {
        if (v == null || v === '') return null;
        if (v instanceof Date || (typeof v === 'object' && typeof v.getHours === 'function')) {
            return isNaN(v.getTime()) ? null : { h: v.getHours(), m: v.getMinutes() };
        }
        const m = /^\s*(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?\s*([AaPp])?\.?[Mm]?\.?\s*$/.exec(String(v));
        if (!m) return null;
        let h = +m[1];
        const min = +m[2];
        if (min > 59) return null;
        if (m[3]) {
            if (h < 1 || h > 12) return null;
            const pm = m[3].toLowerCase() === 'p';
            h = (h % 12) + (pm ? 12 : 0);
        } else if (h > 23) return null;
        return { h: h, m: min };
    }
    function parse(v) { const t = parseTime(v); return t ? pad(t.h) + ':' + pad(t.m) : null; }
    function format(v, hour12) {
        const t = parseTime(v);
        if (!t) return '';
        if (!hour12) return pad(t.h) + ':' + pad(t.m);
        return ((t.h % 12) || 12) + ':' + pad(t.m) + ' ' + (t.h < 12 ? 'AM' : 'PM');
    }

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chilltimepicker-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chilltimepicker-styles';
        style.textContent = `
      :root {
        --chilltimepicker-bg: #ffffff;
        --chilltimepicker-text: #171717;
        --chilltimepicker-muted: #6b7280;
        --chilltimepicker-border: #e5e5e5;
        --chilltimepicker-hover: #f3f4f6;
        --chilltimepicker-primary: #3b82f6;
        --chilltimepicker-primary-text: #ffffff;
        --chilltimepicker-shadow: 0 10px 30px rgba(0,0,0,.18);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltimepicker-bg: #1f1f1f;
          --chilltimepicker-text: #fafafa;
          --chilltimepicker-muted: #9ca3af;
          --chilltimepicker-border: #404040;
          --chilltimepicker-hover: #2a2a2a;
          --chilltimepicker-shadow: 0 10px 30px rgba(0,0,0,.6);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chilltimepicker-bg: #1f1f1f;
        --chilltimepicker-text: #fafafa;
        --chilltimepicker-muted: #9ca3af;
        --chilltimepicker-border: #404040;
        --chilltimepicker-hover: #2a2a2a;
        --chilltimepicker-shadow: 0 10px 30px rgba(0,0,0,.6);
      }
      .chilltimepicker { display: inline-block; position: relative; font-size: 14px; color: var(--chilltimepicker-text); }
      .chilltimepicker-panel { box-sizing: border-box; padding: 8px; background: var(--chilltimepicker-bg); color: var(--chilltimepicker-text); border: 1px solid var(--chilltimepicker-border); border-radius: 12px; display: inline-flex; flex-direction: column; gap: 8px; }
      .chilltimepicker-popover { position: fixed; z-index: 10001; box-shadow: var(--chilltimepicker-shadow); animation: chilltimepicker-in .15s ease; }
      @keyframes chilltimepicker-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      .chilltimepicker-cols { display: flex; gap: 4px; }
      .chilltimepicker-col { box-sizing: border-box; list-style: none; margin: 0; padding: 2px; width: 64px; max-height: 208px; overflow-y: auto; border-radius: 8px; scrollbar-width: thin; }
      .chilltimepicker-col:not(:last-child) { border-right: 1px solid var(--chilltimepicker-border); padding-right: 6px; width: 68px; }
      .chilltimepicker-option { box-sizing: border-box; display: flex; align-items: center; justify-content: center; min-height: 32px; margin: 1px 0; border-radius: 6px; cursor: pointer; font-variant-numeric: tabular-nums; user-select: none; outline: none; transition: background .12s ease; }
      .chilltimepicker-option:hover { background: var(--chilltimepicker-hover); }
      .chilltimepicker-option[aria-selected="true"] { background: var(--chilltimepicker-primary); color: var(--chilltimepicker-primary-text); font-weight: 600; }
      .chilltimepicker-option:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.55); position: relative; }
      .chilltimepicker-option[aria-disabled="true"] { opacity: .35; cursor: not-allowed; }
      .chilltimepicker-option[aria-disabled="true"]:hover { background: transparent; }
      .chilltimepicker-footer { display: flex; justify-content: space-between; gap: 8px; }
      .chilltimepicker-action { font: inherit; font-size: 13px; min-height: 32px; padding: 0 10px; color: var(--chilltimepicker-primary); background: transparent; border: none; border-radius: 6px; cursor: pointer; }
      .chilltimepicker-action:hover { background: var(--chilltimepicker-hover); }
      .chilltimepicker-action:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.45); }
      .chilltimepicker-trigger { display: inline-flex; align-items: center; gap: 8px; min-width: 130px; min-height: 36px; padding: 6px 12px; font: inherit; color: var(--chilltimepicker-text); background: var(--chilltimepicker-bg); border: 1px solid var(--chilltimepicker-border); border-radius: 8px; cursor: pointer; text-align: left; transition: border-color .15s ease, box-shadow .15s ease; }
      .chilltimepicker-trigger:hover { border-color: var(--chilltimepicker-muted); }
      .chilltimepicker-trigger:focus-visible { outline: none; border-color: var(--chilltimepicker-primary); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chilltimepicker-trigger svg { flex: none; width: 16px; height: 16px; color: var(--chilltimepicker-muted); }
      .chilltimepicker-placeholder { color: var(--chilltimepicker-muted); }
      .chilltimepicker-disabled { opacity: .55; }
      .chilltimepicker-disabled .chilltimepicker-trigger { cursor: not-allowed; }
      @media (prefers-reduced-motion: reduce) {
        .chilltimepicker-popover { animation: none; }
        .chilltimepicker-option, .chilltimepicker-trigger { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function resolveEl(t) {
        if (!t) return null;
        if (typeof t === 'string') return document.querySelector(t);
        return t.nodeType === 1 ? t : null;
    }

    function clockIcon() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '9');
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', 'M12 7v5l3 2');
        svg.appendChild(c); svg.appendChild(p);
        return svg;
    }

    let uid = 0;

    function createTimePicker(options) {
        options = options || {};
        injectCSS();
        const id = 'chilltimepicker-' + (++uid);
        const hour12 = !!options.hour12;
        const step = clamp(Math.floor(+options.minuteStep) || 1, 1, 30);
        const popover = !!options.popover;
        const listeners = {};
        const minT = parseTime(options.min);
        const maxT = parseTime(options.max);
        const minMin = minT ? minT.h * 60 + minT.m : 0;
        const maxMin = maxT ? maxT.h * 60 + maxT.m : 24 * 60 - 1;
        let disabled = !!options.disabled;
        let destroyed = false;
        let open = false;
        let state = null; // {h, m} or null

        function normalize(t) {
            if (!t) return null;
            let m = Math.round(t.m / step) * step;
            let h = t.h;
            if (m >= 60) { m = 0; h = (h + 1) % 24; }
            return { h: h, m: m };
        }
        const allowed = (h, m) => { const x = h * 60 + m; return x >= minMin && x <= maxMin; };
        state = normalize(parseTime(options.value));

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }
        const getValue = () => (state ? pad(state.h) + ':' + pad(state.m) : '');
        const getDisplay = () => (state ? format(getValue(), hour12) : '');

        // ---- DOM ----
        const root = document.createElement('div');
        root.className = 'chilltimepicker' + (options.className ? ' ' + options.className : '');
        const panel = document.createElement('div');
        panel.className = 'chilltimepicker-panel';
        panel.id = id + '-panel';
        const cols = document.createElement('div');
        cols.className = 'chilltimepicker-cols';
        panel.appendChild(cols);

        const colDefs = [];
        function makeCol(kind, label, items) {
            const ul = document.createElement('ul');
            ul.className = 'chilltimepicker-col';
            ul.setAttribute('role', 'listbox');
            ul.setAttribute('aria-label', label);
            ul.dataset.kind = kind;
            const opts = items.map(it => {
                const li = document.createElement('li');
                li.className = 'chilltimepicker-option';
                li.setAttribute('role', 'option');
                li.id = id + '-' + kind + '-' + it.value;
                li.dataset.value = String(it.value);
                li.textContent = it.text;
                li.tabIndex = -1;
                ul.appendChild(li);
                return { el: li, value: it.value };
            });
            cols.appendChild(ul);
            const def = { kind, ul, opts };
            colDefs.push(def);
            return def;
        }
        const hours = [];
        if (hour12) for (let i = 1; i <= 12; i++) hours.push({ value: i, text: pad(i) });
        else for (let i = 0; i < 24; i++) hours.push({ value: i, text: pad(i) });
        const hourCol = makeCol('hour', 'Hours', hours);
        const mins = [];
        for (let i = 0; i < 60; i += step) mins.push({ value: i, text: pad(i) });
        const minCol = makeCol('minute', 'Minutes', mins);
        const ampmCol = hour12 ? makeCol('period', 'AM or PM', [{ value: 'AM', text: 'AM' }, { value: 'PM', text: 'PM' }]) : null;

        let footer = null, nowBtn = null, clearBtn = null;
        if (options.showNow !== false || popover) {
            footer = document.createElement('div');
            footer.className = 'chilltimepicker-footer';
            if (options.showNow !== false) {
                nowBtn = document.createElement('button');
                nowBtn.type = 'button';
                nowBtn.className = 'chilltimepicker-action';
                nowBtn.textContent = options.nowText || 'Now';
                footer.appendChild(nowBtn);
            }
            clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'chilltimepicker-action';
            clearBtn.textContent = options.clearText || 'Clear';
            footer.appendChild(clearBtn);
            panel.appendChild(footer);
        }

        let hidden = null;
        if (options.name) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = options.name;
            root.appendChild(hidden);
        }

        let trigger = null, triggerText = null;
        if (popover) {
            trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'chilltimepicker-trigger';
            trigger.setAttribute('aria-haspopup', 'dialog');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', panel.id);
            trigger.appendChild(clockIcon());
            triggerText = document.createElement('span');
            trigger.appendChild(triggerText);
            root.appendChild(trigger);
            panel.classList.add('chilltimepicker-popover');
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', options.label || 'Time');
            panel.hidden = true;
        } else {
            root.appendChild(panel);
            root.setAttribute('role', 'group');
            root.setAttribute('aria-label', options.label || 'Time');
        }

        function selectedOf(def) {
            if (!state) return null;
            if (def.kind === 'hour') return hour12 ? ((state.h % 12) || 12) : state.h;
            if (def.kind === 'minute') return state.m;
            return state.h < 12 ? 'AM' : 'PM';
        }
        function curH12Period() { return state ? (state.h < 12 ? 'AM' : 'PM') : 'AM'; }
        // Would choosing value `v` in column `kind` produce an allowed time?
        function optionAllowed(kind, v) {
            const cur = state || { h: hour12 ? 12 : 0, m: 0 };
            const period = curH12Period();
            const to24 = hh => (hour12 ? (hh % 12) + (period === 'PM' ? 12 : 0) : hh);
            if (kind === 'hour') {
                const hh = to24(v);
                for (let m = 0; m < 60; m += step) if (allowed(hh, m)) return true;
                return false;
            }
            if (kind === 'minute') return allowed(cur.h, v);
            const hh = (cur.h % 12) + (v === 'PM' ? 12 : 0);
            for (let m = 0; m < 60; m += step) if (allowed(hh, m)) return true;
            return false;
        }

        function render() {
            const value = getValue();
            colDefs.forEach(def => {
                const sel = selectedOf(def);
                let focusable = null;
                def.opts.forEach(o => {
                    const isSel = sel !== null && o.value === sel;
                    o.el.setAttribute('aria-selected', isSel ? 'true' : 'false');
                    const ok = optionAllowed(def.kind, o.value);
                    if (ok) o.el.removeAttribute('aria-disabled'); else o.el.setAttribute('aria-disabled', 'true');
                    o.el.tabIndex = -1;
                    if (isSel) focusable = o;
                });
                if (!focusable) focusable = def.opts.find(o => o.el.getAttribute('aria-disabled') !== 'true') || def.opts[0];
                focusable.el.tabIndex = disabled ? -1 : 0;
                def.ul.setAttribute('aria-activedescendant', sel !== null ? def.opts.find(o => o.value === sel).el.id : '');
                if (!sel && sel !== 0) def.ul.removeAttribute('aria-activedescendant');
            });
            if (hidden) hidden.value = value;
            if (trigger) {
                triggerText.textContent = state ? getDisplay() : (options.placeholder || 'Select time');
                triggerText.classList.toggle('chilltimepicker-placeholder', !state);
                trigger.setAttribute('aria-label', (options.label || 'Time') + ': ' + (state ? getDisplay() : (options.placeholder || 'Select time')));
            }
        }

        function reveal() {
            colDefs.forEach(def => {
                const sel = selectedOf(def);
                const o = def.opts.find(x => x.value === sel);
                if (o && o.el.scrollIntoView) o.el.scrollIntoView({ block: 'nearest' });
            });
        }

        function commit(next, silent) {
            const prev = getValue();
            state = next ? { h: next.h, m: next.m } : null;
            render();
            if (silent) return;
            if (getValue() !== prev) {
                if (typeof options.onChange === 'function') options.onChange(getValue(), api);
                emit('change', getValue());
            }
        }

        // pick a value in a column, returns true when applied
        function pick(kind, v) {
            const cur = state || { h: 0, m: 0 };
            let h = cur.h, m = cur.m;
            if (kind === 'hour') {
                h = hour12 ? (v % 12) + (curH12Period() === 'PM' ? 12 : 0) : v;
            } else if (kind === 'minute') {
                m = v;
            } else {
                h = (cur.h % 12) + (v === 'PM' ? 12 : 0);
            }
            if (!allowed(h, m)) {
                // try to fix up using the nearest allowed minute for this hour
                let found = null;
                for (let mm = 0; mm < 60; mm += step) if (allowed(h, mm)) { found = mm; break; }
                if (found === null) return false;
                m = (kind === 'minute') ? m : found;
                if (!allowed(h, m)) return false;
            }
            commit({ h, m });
            return true;
        }

        const optFrom = e => (e.target && e.target.closest ? e.target.closest('.chilltimepicker-option') : null);
        const onPanelClick = e => {
            if (disabled) return;
            const li = optFrom(e);
            if (li) {
                if (li.getAttribute('aria-disabled') === 'true') return;
                const kind = li.parentNode.dataset.kind;
                const raw = li.dataset.value;
                const v = kind === 'period' ? raw : +raw;
                if (pick(kind, v)) {
                    if (li.focus) li.focus();
                    maybeClose(kind);
                }
                return;
            }
            if (nowBtn && e.target === nowBtn) {
                const d = new Date();
                const t = normalize({ h: d.getHours(), m: d.getMinutes() });
                let hh = t.h, mm = t.m;
                if (!allowed(hh, mm)) return;
                commit({ h: hh, m: mm });
                reveal();
            } else if (clearBtn && e.target === clearBtn) {
                commit(null);
            }
        };
        function maybeClose(kind) {
            if (!popover || options.closeOnSelect === false) return;
            const last = hour12 ? 'period' : 'minute';
            if (kind === last) close(true);
        }
        const onPanelKey = e => {
            if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
            const li = optFrom(e);
            if (!li) return;
            const ul = li.parentNode;
            const def = colDefs.find(d => d.ul === ul);
            const idx = def.opts.findIndex(o => o.el === li);
            const move = (dir, from) => {
                let i = from;
                for (;;) {
                    i += dir;
                    if (i < 0 || i >= def.opts.length) return -1;
                    if (def.opts[i].el.getAttribute('aria-disabled') !== 'true') return i;
                }
            };
            let target = -1;
            switch (e.key) {
                case 'ArrowDown': target = move(1, idx); break;
                case 'ArrowUp': target = move(-1, idx); break;
                case 'Home': target = move(1, -1); break;
                case 'End': target = move(-1, def.opts.length); break;
                case 'ArrowRight': case 'ArrowLeft': {
                    e.preventDefault();
                    const ci = colDefs.indexOf(def) + (e.key === 'ArrowRight' ? 1 : -1);
                    const nd = colDefs[ci];
                    if (nd) {
                        const o = nd.opts.find(x => x.el.tabIndex === 0) || nd.opts[0];
                        if (o.el.focus) o.el.focus();
                    }
                    return;
                }
                case 'Enter': case ' ': {
                    e.preventDefault();
                    if (li.getAttribute('aria-disabled') === 'true') return;
                    const kind = def.kind;
                    const v = kind === 'period' ? li.dataset.value : +li.dataset.value;
                    if (pick(kind, v)) maybeClose(kind);
                    return;
                }
                default: return;
            }
            e.preventDefault();
            if (target < 0) return;
            const o = def.opts[target];
            const v = o.value;
            if (pick(def.kind, v)) {
                const fresh = def.opts[target].el;
                if (fresh.focus) fresh.focus();
                if (fresh.scrollIntoView) fresh.scrollIntoView({ block: 'nearest' });
            }
        };
        panel.addEventListener('click', onPanelClick);
        panel.addEventListener('keydown', onPanelKey);

        // ---- popover ----
        function position() {
            if (!trigger) return;
            const t = trigger.getBoundingClientRect();
            const p = panel.getBoundingClientRect();
            const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
            const pl = options.placement || 'bottom-start';
            let top = pl.indexOf('top') === 0 ? t.top - p.height - 6 : t.bottom + 6;
            let left = pl.indexOf('end') > -1 ? t.right - p.width : t.left;
            if (top + p.height > vh - 8 && t.top - p.height - 6 > 8) top = t.top - p.height - 6;
            left = clamp(left, 8, Math.max(8, vw - p.width - 8));
            panel.style.top = Math.max(0, top) + 'px';
            panel.style.left = Math.max(0, left) + 'px';
        }
        const onDocDown = e => {
            if (!open) return;
            if (panel.contains(e.target) || (trigger && trigger.contains(e.target))) return;
            close();
        };
        const onDocKey = e => { if (open && e.key === 'Escape') { e.stopPropagation(); close(true); } };
        const onReposition = () => position();
        function openPanel() {
            if (!popover || open || disabled || destroyed) return api;
            open = true;
            panel.hidden = false;
            document.body.appendChild(panel);
            position();
            trigger.setAttribute('aria-expanded', 'true');
            document.addEventListener('pointerdown', onDocDown, true);
            document.addEventListener('keydown', onDocKey, true);
            window.addEventListener('resize', onReposition);
            window.addEventListener('scroll', onReposition, true);
            reveal();
            const first = hourCol.opts.find(o => o.el.tabIndex === 0);
            if (first && first.el.focus) first.el.focus();
            if (typeof options.onOpen === 'function') options.onOpen(api);
            emit('open', getValue());
            return api;
        }
        function close(refocus) {
            if (!popover || !open) return api;
            open = false;
            panel.hidden = true;
            if (panel.parentNode) panel.parentNode.removeChild(panel);
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('pointerdown', onDocDown, true);
            document.removeEventListener('keydown', onDocKey, true);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
            if (refocus === true && trigger.focus) trigger.focus();
            if (typeof options.onClose === 'function') options.onClose(api);
            emit('close', getValue());
            return api;
        }
        const onTriggerClick = () => { if (open) close(); else openPanel(); };
        const onTriggerKey = e => {
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) { e.preventDefault(); openPanel(); }
        };
        if (trigger) {
            trigger.addEventListener('click', onTriggerClick);
            trigger.addEventListener('keydown', onTriggerKey);
        }

        function setDisabled(b) {
            disabled = !!b;
            root.classList.toggle('chilltimepicker-disabled', disabled);
            if (trigger) trigger.disabled = disabled;
            [nowBtn, clearBtn].forEach(x => { if (x) x.disabled = disabled; });
            if (disabled && open) close();
            render();
        }

        const api = {
            element: root,
            panel,
            trigger,
            getValue,
            getDisplay,
            setValue(v, silent) {
                if (destroyed) return api;
                const t = normalize(parseTime(v));
                if (v !== null && v !== '' && v !== undefined && !t) return api;
                commit(t, !!silent);
                return api;
            },
            clear() { commit(null); return api; },
            open: openPanel,
            close: () => close(false),
            toggle() { return open ? close() : openPanel(); },
            isOpen: () => open,
            setDisabled,
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                if (open) close();
                destroyed = true;
                panel.removeEventListener('click', onPanelClick);
                panel.removeEventListener('keydown', onPanelKey);
                if (trigger) {
                    trigger.removeEventListener('click', onTriggerClick);
                    trigger.removeEventListener('keydown', onTriggerKey);
                }
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (panel.parentNode) panel.parentNode.removeChild(panel);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        render();
        setDisabled(disabled);
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        if (!popover) reveal();
        return api;
    }

    const ChillTimePicker = {
        version: VERSION,
        create: createTimePicker,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createTimePicker(Object.assign({}, options, { container: host }));
        },
        parse,
        format,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTimePicker;
    } else {
        window.ChillTimePicker = ChillTimePicker;
    }

})(typeof window !== 'undefined' ? window : this);
