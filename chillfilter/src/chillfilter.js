/**
 * ChillFilter - Zero-dependency Filter Component
 * 
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById('chillfilter-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillfilter-styles';
        style.textContent = `
      :root {
        --chillfilter-bg: #ffffff;
        --chillfilter-text: #171717;
        --chillfilter-text-muted: #6b7280;
        --chillfilter-border: #e5e5e5;
        --chillfilter-hover: #f5f5f5;
        --chillfilter-active: #3b82f6;
        --chillfilter-active-bg: #eff6ff;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillfilter-bg: #262626;
          --chillfilter-text: #fafafa;
          --chillfilter-text-muted: #a3a3a3;
          --chillfilter-border: #404040;
          --chillfilter-hover: #374151;
          --chillfilter-active-bg: #1e3a5f;
        }
      }

      :root[data-theme="dark"], :root.dark {
          --chillfilter-bg: #262626;
          --chillfilter-text: #fafafa;
          --chillfilter-text-muted: #a3a3a3;
          --chillfilter-border: #404040;
          --chillfilter-hover: #374151;
          --chillfilter-active-bg: #1e3a5f;
        }

      .chillfilter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .chillfilter-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 500;
        color: var(--chillfilter-text);
        background: var(--chillfilter-bg);
        border: 1px solid var(--chillfilter-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }

      .chillfilter-btn:hover {
        background: var(--chillfilter-hover);
      }

      .chillfilter-btn-icon {
        width: 16px;
        height: 16px;
      }

      .chillfilter-dropdown {
        position: relative;
      }

      .chillfilter-menu {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 100;
        min-width: 220px;
        margin-top: 4px;
        padding: 8px;
        background: var(--chillfilter-bg);
        border: 1px solid var(--chillfilter-border);
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }

      .chillfilter-dropdown.open .chillfilter-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .chillfilter-menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 8px 12px;
        border-bottom: 1px solid var(--chillfilter-border);
        margin-bottom: 8px;
      }

      .chillfilter-menu-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--chillfilter-text);
      }

      .chillfilter-menu-clear {
        font-size: 13px;
        color: var(--chillfilter-active);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
      }

      .chillfilter-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .chillfilter-option:hover {
        background: var(--chillfilter-hover);
      }

      .chillfilter-option input {
        display: none;
      }

      .chillfilter-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--chillfilter-border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .chillfilter-option input:checked + .chillfilter-checkbox {
        background: var(--chillfilter-active);
        border-color: var(--chillfilter-active);
      }

      .chillfilter-checkbox svg {
        width: 12px;
        height: 12px;
        color: white;
        opacity: 0;
      }

      .chillfilter-option input:checked + .chillfilter-checkbox svg {
        opacity: 1;
      }

      .chillfilter-option-label {
        font-size: 14px;
        color: var(--chillfilter-text);
      }

      .chillfilter-option-count {
        margin-left: auto;
        font-size: 12px;
        color: var(--chillfilter-text-muted);
      }

      /* Active Filters */
      .chillfilter-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-left: 8px;
      }

      .chillfilter-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 13px;
        color: var(--chillfilter-active);
        background: var(--chillfilter-active-bg);
        border-radius: 6px;
      }

      .chillfilter-tag-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
      }

      .chillfilter-tag-remove:hover {
        opacity: 1;
      }

      .chillfilter-tag-remove svg {
        width: 10px;
        height: 10px;
      }

      /* Badge */
      .chillfilter-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        font-size: 11px;
        font-weight: 600;
        color: white;
        background: var(--chillfilter-active);
        border-radius: 9px;
      }

      .chillfilter-btn:focus-visible, .chillfilter-menu-clear:focus-visible, .chillfilter-tag-remove:focus-visible, .chillfilter-option:focus-within { outline: 2px solid var(--chillfilter-active); outline-offset: 2px; }
      .chillfilter-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      @media (prefers-reduced-motion: reduce) {
        .chillfilter *, .chillfilter *::before { transition: none !important; animation: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
    }

    function svgIcon(d, strokeWidth, cls) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', String(strokeWidth || 2));
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

    let uid = 0;

    class ChillFilterInstance {
        constructor(selector, options = {}) {
            this.element = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector || null;

            const o = options || {};
            this.options = Object.assign({
                filters: [],
                values: {},
                showTags: true,
                html: false,
                ariaLabel: 'Filters',
                clearLabel: 'Clear',
                onChange: null
            }, o);
            if (!Array.isArray(this.options.filters)) this.options.filters = [];
            if (!this.options.values || typeof this.options.values !== 'object') this.options.values = {};
            if (o.showTags === undefined) this.options.showTags = true;
            this._id = ++uid;
            this._destroyed = false;
            this._cleanups = [];

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _text(node, value) {
            if (this.options.html) node.innerHTML = String(value == null ? '' : value);
            else node.textContent = String(value == null ? '' : value);
        }

        _valuesFor(key) {
            const v = this.options.values[key];
            return Array.isArray(v) ? v.map(String) : [];
        }

        _filterByKey(key) {
            return this.options.filters.find(f => String(f.key) === String(key));
        }

        render() {
            const first = !this.container;
            const container = this.container || el('div', 'chillfilter');
            while (container.firstChild) container.removeChild(container.firstChild);
            container.setAttribute('role', 'group');
            container.setAttribute('aria-label', this.options.ariaLabel);

            this.options.filters.forEach((filter, fi) => {
                const selected = this._valuesFor(filter.key);
                const dd = el('div', 'chillfilter-dropdown');
                dd.setAttribute('data-key', String(filter.key));
                const menuId = 'chillfilter-' + this._id + '-menu-' + fi;

                const btn = el('button', 'chillfilter-btn');
                btn.type = 'button';
                btn.setAttribute('aria-haspopup', 'true');
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute('aria-controls', menuId);
                if (filter.icon) {
                    const ic = el('span', 'chillfilter-btn-icon');
                    ic.setAttribute('aria-hidden', 'true');
                    if (this.options.html) ic.innerHTML = String(filter.icon); else ic.textContent = String(filter.icon);
                    btn.appendChild(ic);
                }
                const lab = el('span');
                this._text(lab, filter.label);
                btn.appendChild(lab);
                if (selected.length > 0) btn.appendChild(el('span', 'chillfilter-badge', selected.length));
                btn.appendChild(svgIcon('M6 9l6 6 6-6', 2, 'chillfilter-btn-icon'));
                dd.appendChild(btn);

                const menu = el('div', 'chillfilter-menu');
                menu.id = menuId;
                menu.setAttribute('role', 'group');
                menu.setAttribute('aria-label', String(filter.label));
                const head = el('div', 'chillfilter-menu-header');
                const title = el('span', 'chillfilter-menu-title');
                this._text(title, filter.label);
                head.appendChild(title);
                const clr = el('button', 'chillfilter-menu-clear', this.options.clearLabel);
                clr.type = 'button';
                head.appendChild(clr);
                menu.appendChild(head);

                (filter.options || []).forEach(opt => {
                    const label = el('label', 'chillfilter-option');
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.value = String(opt.value);
                    if (selected.indexOf(String(opt.value)) >= 0) input.checked = true;
                    label.appendChild(input);
                    const box = el('span', 'chillfilter-checkbox');
                    box.appendChild(svgIcon('M20 6L9 17l-5-5', 3));
                    label.appendChild(box);
                    const ol = el('span', 'chillfilter-option-label');
                    this._text(ol, opt.label);
                    label.appendChild(ol);
                    if (opt.count !== undefined) label.appendChild(el('span', 'chillfilter-option-count', opt.count));
                    menu.appendChild(label);
                });
                dd.appendChild(menu);
                container.appendChild(dd);
            });

            if (this.options.showTags) {
                const tags = el('div', 'chillfilter-tags');
                tags.setAttribute('role', 'list');
                tags.setAttribute('aria-label', 'Active filters');
                container.appendChild(tags);
            }
            const live = el('div', 'chillfilter-sr');
            live.setAttribute('role', 'status');
            live.setAttribute('aria-live', 'polite');
            container.appendChild(live);

            if (first && this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(container, this.element);
            }

            this.container = container;
            this.liveEl = live;
            this.updateTags();
        }

        bindEvents() {
            // Delegated listeners on the persistent container survive setValues()/clear() re-renders; only outside-click lives on document.
            if (this._bound) return;
            this._bound = true;
            const on = (target, evt, fn) => {
                target.addEventListener(evt, fn);
                this._cleanups.push(() => target.removeEventListener(evt, fn));
            };
            const closeAll = (except) => {
                this.container.querySelectorAll('.chillfilter-dropdown.open').forEach(d => {
                    if (d === except) return;
                    d.classList.remove('open');
                    const b = d.querySelector('.chillfilter-btn');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });
            };
            this._closeAll = closeAll;

            on(document, 'click', (e) => {
                if (!this.container.contains(e.target)) closeAll();
            });
            on(this.container, 'click', (e) => {
                const c = this.container;

                const btn = e.target.closest('.chillfilter-btn');
                if (btn && c.contains(btn)) {
                    const dd = btn.closest('.chillfilter-dropdown');
                    const wasOpen = dd.classList.contains('open');
                    closeAll();
                    dd.classList.toggle('open', !wasOpen);
                    btn.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
                    return;
                }
                const clr = e.target.closest('.chillfilter-menu-clear');
                if (clr && c.contains(clr)) {
                    const key = clr.closest('.chillfilter-dropdown').getAttribute('data-key');
                    this.options.values[key] = [];
                    clr.closest('.chillfilter-menu').querySelectorAll('input').forEach(i => { i.checked = false; });
                    this._afterChange();
                    return;
                }
                const rm = e.target.closest('.chillfilter-tag-remove');
                if (rm && c.contains(rm)) {
                    const tag = rm.closest('.chillfilter-tag');
                    const key = tag.getAttribute('data-key');
                    const value = tag.getAttribute('data-value');
                    this.options.values[key] = this._valuesFor(key).filter(v => v !== value);
                    this._syncCheckbox(key, value, false);
                    this._afterChange();
                }
            });

            on(this.container, 'change', (e) => {
                const input = e.target;
                if (!input || !input.closest || !input.closest('.chillfilter-option')) return;
                const key = input.closest('.chillfilter-dropdown').getAttribute('data-key');
                const value = String(input.value);
                const cur = this._valuesFor(key).filter(v => v !== value);
                if (input.checked) cur.push(value);
                this.options.values[key] = cur;
                this._afterChange();
            });

            on(this.container, 'keydown', (e) => {
                if (e.key !== 'Escape') return;
                const open = this.container.querySelector('.chillfilter-dropdown.open');
                if (open) {
                    closeAll();
                    const b = open.querySelector('.chillfilter-btn');
                    if (b) b.focus();
                }
            });
        }

        _syncCheckbox(key, value, checked) {
            this.container.querySelectorAll('.chillfilter-dropdown').forEach(dd => {
                if (dd.getAttribute('data-key') !== String(key)) return;
                dd.querySelectorAll('input').forEach(i => { if (i.value === String(value)) i.checked = checked; });
            });
        }

        _afterChange() {
            this.updateBadges();
            this.updateTags();
            this.emitChange();
        }

        updateBadges() {
            this.container.querySelectorAll('.chillfilter-dropdown').forEach(dropdown => {
                const key = dropdown.getAttribute('data-key');
                const count = this._valuesFor(key).length;
                const btn = dropdown.querySelector('.chillfilter-btn');
                let badge = btn.querySelector('.chillfilter-badge');

                if (count > 0) {
                    if (badge) {
                        badge.textContent = count;
                    } else {
                        const arrow = btn.lastElementChild;
                        badge = el('span', 'chillfilter-badge', count);
                        btn.insertBefore(badge, arrow);
                    }
                } else if (badge) {
                    badge.parentNode.removeChild(badge);
                }
            });
        }

        updateTags() {
            const tagsContainer = this.container.querySelector('.chillfilter-tags');
            if (!tagsContainer) return;
            while (tagsContainer.firstChild) tagsContainer.removeChild(tagsContainer.firstChild);

            Object.keys(this.options.values).forEach(key => {
                const filter = this._filterByKey(key);
                if (!filter) return;
                this._valuesFor(key).forEach(value => {
                    const opt = (filter.options || []).find(o => String(o.value) === value);
                    if (!opt) return;
                    const tag = el('span', 'chillfilter-tag');
                    tag.setAttribute('role', 'listitem');
                    tag.setAttribute('data-key', String(key));
                    tag.setAttribute('data-value', value);
                    const t = el('span');
                    this._text(t, opt.label);
                    tag.appendChild(t);
                    const rm = el('button', 'chillfilter-tag-remove');
                    rm.type = 'button';
                    rm.setAttribute('aria-label', 'Remove filter ' + String(opt.label));
                    rm.appendChild(svgIcon('M18 6L6 18M6 6l12 12', 2));
                    tag.appendChild(rm);
                    tagsContainer.appendChild(tag);
                });
            });
        }

        emitChange() {
            const total = Object.keys(this.options.values).reduce((n, k) => n + this._valuesFor(k).length, 0);
            if (this.liveEl) this.liveEl.textContent = total + (total === 1 ? ' filter active' : ' filters active');
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.options.values);
            }
        }

        getValues() {
            const out = {};
            Object.keys(this.options.values).forEach(k => { out[k] = this._valuesFor(k); });
            return out;
        }

        setValues(values) {
            this.options.values = values || {};
            this.render();
        }

        clear() {
            this.options.values = {};
            this.render();
            this.emitChange();
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

    const ChillFilter = {
        version: VERSION,

        init(selector, options) {
            return new ChillFilterInstance(selector, options);
        },

        /** Detached instance; append `instance.container` yourself. */
        create(options) {
            return new ChillFilterInstance(null, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillFilter;
    } else {
        window.ChillFilter = ChillFilter;
    }

})(typeof window !== 'undefined' ? window : this);
