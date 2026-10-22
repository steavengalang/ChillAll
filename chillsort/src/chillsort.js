/**
 * ChillSort - Zero-dependency Sort Component
 * 
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById('chillsort-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillsort-styles';
        style.textContent = `
      :root {
        --chillsort-bg: #ffffff;
        --chillsort-text: #171717;
        --chillsort-text-muted: #6b7280;
        --chillsort-border: #e5e5e5;
        --chillsort-hover: #f5f5f5;
        --chillsort-active: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillsort-bg: #262626;
          --chillsort-text: #fafafa;
          --chillsort-text-muted: #a3a3a3;
          --chillsort-border: #404040;
          --chillsort-hover: #374151;
        }
      }

      :root[data-theme="dark"], :root.dark {
          --chillsort-bg: #262626;
          --chillsort-text: #fafafa;
          --chillsort-text-muted: #a3a3a3;
          --chillsort-border: #404040;
          --chillsort-hover: #374151;
        }

      .chillsort {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .chillsort-label {
        font-size: 14px;
        color: var(--chillsort-text-muted);
        white-space: nowrap;
      }

      .chillsort-select {
        position: relative;
      }

      .chillsort-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        font-size: 14px;
        font-weight: 500;
        color: var(--chillsort-text);
        background: var(--chillsort-bg);
        border: 1px solid var(--chillsort-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }

      .chillsort-btn:hover {
        background: var(--chillsort-hover);
      }

      .chillsort-btn-icon {
        width: 16px;
        height: 16px;
        color: var(--chillsort-text-muted);
      }

      .chillsort-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 100;
        min-width: 180px;
        margin-top: 4px;
        padding: 4px;
        background: var(--chillsort-bg);
        border: 1px solid var(--chillsort-border);
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }

      .chillsort-select.open .chillsort-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .chillsort-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        font-size: 14px;
        color: var(--chillsort-text);
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .chillsort-option:hover {
        background: var(--chillsort-hover);
      }

      .chillsort-option.active {
        color: var(--chillsort-active);
      }

      .chillsort-option-check {
        width: 16px;
        height: 16px;
        opacity: 0;
      }

      .chillsort-option.active .chillsort-option-check {
        opacity: 1;
      }

      /* Direction Toggle */
      .chillsort-direction {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        background: var(--chillsort-bg);
        border: 1px solid var(--chillsort-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .chillsort-direction:hover {
        background: var(--chillsort-hover);
      }

      .chillsort-direction svg {
        width: 18px;
        height: 18px;
        color: var(--chillsort-text);
        transition: transform 0.2s ease;
      }

      .chillsort-direction.desc svg {
        transform: rotate(180deg);
      }

      /* Inline Style */
      .chillsort-inline {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        font-size: 13px;
        color: var(--chillsort-text-muted);
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .chillsort-inline:hover {
        background: var(--chillsort-hover);
        color: var(--chillsort-text);
      }

      .chillsort-inline.active {
        color: var(--chillsort-active);
      }

      .chillsort-inline svg {
        width: 14px;
        height: 14px;
      }

      .chillsort-btn:focus-visible, .chillsort-direction:focus-visible, .chillsort-inline:focus-visible { outline: 2px solid var(--chillsort-active); outline-offset: 2px; }
      .chillsort-option.focused { background: var(--chillsort-hover); outline: 2px solid var(--chillsort-active); outline-offset: -2px; }
      .chillsort-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      @media (prefers-reduced-motion: reduce) {
        .chillsort *, .chillsort-inline { transition: none !important; animation: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
    }

    const NS = 'http://www.w3.org/2000/svg';
    let uid = 0;

    function svgIcon(d, cls) {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('aria-hidden', 'true');
        if (cls) svg.setAttribute('class', cls);
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        svg.appendChild(p);
        return svg;
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = String(text);
        return e;
    }

    const ASC = 'M12 5v14M5 12l7-7 7 7';
    const DESC = 'M12 19V5M5 12l7 7 7-7';

    class ChillSortInstance {
        constructor(selector, options = {}) {
            this.element = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector || null;

            const o = options || {};
            this.options = Object.assign({
                options: [],
                value: null,
                direction: 'asc',
                showLabel: true,
                label: 'Sort by',
                showDirection: true,
                html: false,
                onChange: null
            }, o);
            if (!Array.isArray(this.options.options)) this.options.options = [];
            if (o.value === undefined) this.options.value = null;
            if (o.direction !== 'desc') this.options.direction = 'asc';
            if (o.showLabel === undefined) this.options.showLabel = true;
            if (o.showDirection === undefined) this.options.showDirection = true;
            if (!o.label) this.options.label = 'Sort by';
            this._id = ++uid;
            this._cleanups = [];
            this._destroyed = false;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _same(a, b) { return a === b || (a != null && b != null && String(a) === String(b)); }

        _text(node, value) {
            if (this.options.html) node.innerHTML = String(value == null ? '' : value);
            else node.textContent = String(value == null ? '' : value);
        }

        getCurrentOption() {
            return this.options.options.find(o => this._same(o.value, this.options.value));
        }

        render() {
            const first = !this.container;
            const container = this.container || el('div', 'chillsort');
            while (container.firstChild) container.removeChild(container.firstChild);
            const o = this.options;
            const current = this.getCurrentOption();
            const listId = 'chillsort-' + this._id + '-list';

            if (o.showLabel) {
                const lab = el('span', 'chillsort-label');
                lab.id = 'chillsort-' + this._id + '-label';
                this._text(lab, o.label);
                lab.appendChild(document.createTextNode(':'));
                container.appendChild(lab);
            }

            const select = el('div', 'chillsort-select');
            const btn = el('button', 'chillsort-btn');
            btn.type = 'button';
            btn.setAttribute('aria-haspopup', 'listbox');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', listId);
            if (o.showLabel) btn.setAttribute('aria-labelledby', 'chillsort-' + this._id + '-label chillsort-' + this._id + '-btn-text');
            const span = el('span');
            span.id = 'chillsort-' + this._id + '-btn-text';
            if (current) this._text(span, current.label); else span.textContent = 'Select';
            btn.appendChild(span);
            btn.appendChild(svgIcon('M6 9l6 6 6-6', 'chillsort-btn-icon'));
            select.appendChild(btn);

            const menu = el('div', 'chillsort-menu');
            menu.id = listId;
            menu.setAttribute('role', 'listbox');
            menu.setAttribute('aria-label', String(o.label));
            menu.tabIndex = -1;
            o.options.forEach((opt, i) => {
                const active = this._same(opt.value, o.value);
                const row = el('div', 'chillsort-option' + (active ? ' active' : ''));
                row.id = 'chillsort-' + this._id + '-opt-' + i;
                row.setAttribute('role', 'option');
                row.setAttribute('aria-selected', active ? 'true' : 'false');
                row.setAttribute('data-value', String(opt.value));
                row._opt = opt;
                const t = el('span');
                this._text(t, opt.label);
                row.appendChild(t);
                row.appendChild(svgIcon('M20 6L9 17l-5-5', 'chillsort-option-check'));
                menu.appendChild(row);
            });
            select.appendChild(menu);
            container.appendChild(select);

            if (o.showDirection) {
                const dir = el('button', 'chillsort-direction ' + o.direction);
                dir.type = 'button';
                dir.setAttribute('aria-label', 'Toggle direction');
                dir.setAttribute('aria-pressed', o.direction === 'desc' ? 'true' : 'false');
                dir.title = o.direction === 'asc' ? 'Ascending' : 'Descending';
                dir.appendChild(svgIcon(ASC));
                container.appendChild(dir);
            }

            const live = el('div', 'chillsort-sr');
            live.setAttribute('role', 'status');
            live.setAttribute('aria-live', 'polite');
            container.appendChild(live);

            if (first && this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(container, this.element);
            }

            this.container = container;
            this.select = select;
            this.btn = btn;
            this.menu = menu;
            this.liveEl = live;
            this._activeIdx = -1;
        }

        _rows() { return Array.prototype.slice.call(this.menu.querySelectorAll('.chillsort-option')); }

        _open(open, focusActive) {
            this.select.classList.toggle('open', !!open);
            this.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                const rows = this._rows();
                let i = rows.findIndex(r => r.classList.contains('active'));
                this._setActive(i < 0 ? 0 : i);
            } else {
                this.btn.removeAttribute('aria-activedescendant');
                this._rows().forEach(r => r.classList.remove('focused'));
                this._activeIdx = -1;
            }
        }

        _setActive(i) {
            const rows = this._rows();
            if (!rows.length) return;
            i = (i + rows.length) % rows.length;
            this._activeIdx = i;
            rows.forEach((r, k) => r.classList.toggle('focused', k === i));
            this.btn.setAttribute('aria-activedescendant', rows[i].id);
            if (rows[i].scrollIntoView) rows[i].scrollIntoView({ block: 'nearest' });
        }

        _choose(row) {
            const opt = row._opt;
            this.options.value = opt.value;
            this._text(this.btn.querySelector('span'), opt.label);
            this._rows().forEach(r => {
                const on = r === row;
                r.classList.toggle('active', on);
                r.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            this._open(false);
            this.emitChange();
        }

        bindEvents() {
            if (this._bound) return;
            this._bound = true;
            const on = (target, evt, fn) => {
                target.addEventListener(evt, fn);
                this._cleanups.push(() => target.removeEventListener(evt, fn));
            };

            on(this.container, 'click', (e) => {
                const t = e.target;
                if (t.closest('.chillsort-btn')) {
                    this._open(!this.select.classList.contains('open'));
                    return;
                }
                const row = t.closest('.chillsort-option');
                if (row && row._opt) { this._choose(row); this.btn.focus(); return; }
                const dir = t.closest('.chillsort-direction');
                if (dir) {
                    this.options.direction = this.options.direction === 'asc' ? 'desc' : 'asc';
                    dir.classList.toggle('desc', this.options.direction === 'desc');
                    dir.classList.toggle('asc', this.options.direction === 'asc');
                    dir.setAttribute('aria-pressed', this.options.direction === 'desc' ? 'true' : 'false');
                    dir.title = this.options.direction === 'asc' ? 'Ascending' : 'Descending';
                    this.emitChange();
                }
            });

            on(this.container, 'keydown', (e) => {
                const isOpen = this.select.classList.contains('open');
                if (e.target.closest && e.target.closest('.chillsort-btn')) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!isOpen) this._open(true); else this._setActive(this._activeIdx + (e.key === 'ArrowDown' ? 1 : -1));
                    } else if (e.key === 'Home' && isOpen) { e.preventDefault(); this._setActive(0); }
                    else if (e.key === 'End' && isOpen) { e.preventDefault(); this._setActive(this._rows().length - 1); }
                    else if ((e.key === 'Enter' || e.key === ' ') && isOpen) {
                        e.preventDefault();
                        const row = this._rows()[this._activeIdx];
                        if (row) this._choose(row); else this._open(false);
                    } else if (e.key === 'Escape' && isOpen) { e.preventDefault(); this._open(false); }
                    else if (e.key === 'Tab' && isOpen) this._open(false);
                } else if (e.key === 'Escape' && isOpen) {
                    this._open(false);
                    this.btn.focus();
                }
            });

            on(document, 'click', (e) => {
                if (this.select && !this.select.contains(e.target)) this._open(false);
            });
        }

        emitChange() {
            const v = this.getValue();
            const cur = this.getCurrentOption();
            if (this.liveEl) this.liveEl.textContent = 'Sorted by ' + (cur ? cur.label : '') + ', ' + (v.direction === 'asc' ? 'ascending' : 'descending');
            if (typeof this.options.onChange === 'function') this.options.onChange(v);
        }

        getValue() {
            return {
                value: this.options.value,
                direction: this.options.direction
            };
        }

        setValue(value, direction) {
            this.options.value = value;
            if (direction) this.options.direction = direction === 'desc' ? 'desc' : 'asc';
            this.render();
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            const c = this.container;
            if (!c || !c.parentNode) return;
            if (this.element) c.parentNode.replaceChild(this.element, c);
            else c.parentNode.removeChild(c);
        }
    }

    /** Inline sortable header button (toggle direction when active, activates exclusively within `options.group`). */
    function createInlineSort(options = {}) {
        injectCSS();

        const btn = document.createElement('button');
        btn.className = 'chillsort-inline' + (options.active ? ' active' : '');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', options.active ? 'true' : 'false');

        let direction = options.direction === 'desc' ? 'desc' : 'asc';

        const label = el('span');
        if (options.html) label.innerHTML = String(options.label == null ? '' : options.label);
        else label.textContent = options.label == null ? '' : String(options.label);
        btn.appendChild(label);
        const icon = svgIcon(direction === 'asc' ? ASC : DESC);
        btn.appendChild(icon);

        const sync = () => {
            icon.querySelector('path').setAttribute('d', direction === 'asc' ? ASC : DESC);
            btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
            btn.title = direction === 'asc' ? 'Ascending' : 'Descending';
        };
        sync();

        const onClick = () => {
            if (btn.classList.contains('active')) {
                direction = direction === 'asc' ? 'desc' : 'asc';
            } else {
                const scope = btn.parentNode || document;
                scope.querySelectorAll('.chillsort-inline.active').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
            }
            sync();
            if (typeof options.onClick === 'function') {
                options.onClick({ value: options.value, direction });
            }
        };
        btn.addEventListener('click', onClick);
        btn.chillsort = { getDirection: () => direction, destroy() { btn.removeEventListener('click', onClick); } };

        return btn;
    }

    const ChillSort = {
        version: VERSION,

        init(selector, options) {
            return new ChillSortInstance(selector, options);
        },

        /** Detached instance; append `instance.container` yourself. */
        create(options) {
            return new ChillSortInstance(null, options);
        },

        createInline: createInlineSort,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSort;
    } else {
        window.ChillSort = ChillSort;
    }

})(typeof window !== 'undefined' ? window : this);
