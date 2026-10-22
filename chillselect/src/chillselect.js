/**
 * ChillSelect - Zero-dependency Select Component (custom listbox, searchable, multi)
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const w = ChillSelect.create({ label: 'Country', items: [{ value: 'id', label: 'Indonesia' }, { value: 'us', label: 'USA' }],
 *                                  searchable: true, onChange: v => console.log(v) });
 *   document.body.appendChild(w);               // w.instance is the controller, w.destroy() cleans up
 *   const inst = ChillSelect.init('#country', { multiple: true });   // can enhance a native <select> (items/value/name read from it)
 *
 * Options
 *   items         []        [{ value, label, disabled }, { type: 'group', label }, { type: 'divider' }]  (labels are TEXT, never HTML)
 *   value         null      selected value (array when multiple)
 *   multiple      false     multi-select with removable tags (Backspace on the trigger removes the last)
 *   searchable    false     search box inside the list; searchPlaceholder 'Search...'
 *   placeholder   'Select an option', noResultsText 'No options found'
 *   label, helper (TEXT), size 'md' (sm|md|lg), state 'default' (default|error; error sets aria-invalid)
 *   required, disabled, name (hidden input(s) for forms)
 *   onChange(value)
 * Keyboard: ArrowUp/Down open + move, Home/End, Enter/Space select, Esc close, Tab close, type-ahead on the trigger.
 * ARIA: trigger role=combobox + aria-expanded/controls/activedescendant; list role=listbox; options role=option.
 * Instance: getValue, setValue(v, emit?), setItems, setState, setDisabled, open, close, toggle, focus, destroy
 *   (init on a native <select> restores that <select> with the current selection on destroy())
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chillselect_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillselect-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillselect-styles';
        style.textContent = `
      :root {
        --chillselect-bg: #ffffff;
        --chillselect-text: #171717;
        --chillselect-placeholder: #9ca3af;
        --chillselect-border: #e5e5e5;
        --chillselect-border-focus: #3b82f6;
        --chillselect-border-error: #ef4444;
        --chillselect-hover: #f5f5f5;
        --chillselect-selected: #eff6ff;
        --chillselect-label: #374151;
        --chillselect-helper: #6b7280;
        --chillselect-disabled-bg: #f3f4f6;
        --chillselect-disabled-text: #9ca3af;
        --chillselect-dropdown-bg: #ffffff;
        --chillselect-dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillselect-bg: #262626;
          --chillselect-text: #fafafa;
          --chillselect-placeholder: #6b7280;
          --chillselect-border: #404040;
          --chillselect-hover: #333333;
          --chillselect-selected: #1e3a5f;
          --chillselect-label: #d1d5db;
          --chillselect-helper: #9ca3af;
          --chillselect-disabled-bg: #374151;
          --chillselect-disabled-text: #6b7280;
          --chillselect-dropdown-bg: #262626;
          --chillselect-dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillselect-bg: #262626;
        --chillselect-text: #fafafa;
        --chillselect-placeholder: #6b7280;
        --chillselect-border: #404040;
        --chillselect-hover: #333333;
        --chillselect-selected: #1e3a5f;
        --chillselect-label: #d1d5db;
        --chillselect-helper: #9ca3af;
        --chillselect-disabled-bg: #374151;
        --chillselect-disabled-text: #6b7280;
        --chillselect-dropdown-bg: #262626;
        --chillselect-dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      }

      .chillselect-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        position: relative;
      }

      .chillselect-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillselect-label);
      }

      .chillselect-label-required::after {
        content: ' *';
        color: #ef4444;
      }

      .chillselect-trigger {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 14px;
        font-size: 14px;
        font-family: inherit;
        color: var(--chillselect-text);
        background: var(--chillselect-bg);
        border: 1px solid var(--chillselect-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
      }

      .chillselect-trigger:hover:not(:disabled) {
        border-color: var(--chillselect-border-focus);
      }

      .chillselect-trigger:focus {
        outline: none;
      }

      .chillselect-trigger:focus-visible {
        outline: none;
        border-color: var(--chillselect-border-focus);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }

      .chillselect-trigger:disabled {
        background: var(--chillselect-disabled-bg);
        color: var(--chillselect-disabled-text);
        cursor: not-allowed;
      }

      .chillselect-trigger-placeholder {
        color: var(--chillselect-placeholder);
      }

      .chillselect-arrow {
        width: 20px;
        height: 20px;
        color: var(--chillselect-placeholder);
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }

      .chillselect-wrapper.open .chillselect-arrow {
        transform: rotate(180deg);
      }

      .chillselect-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        padding: 4px;
        background: var(--chillselect-dropdown-bg);
        border: 1px solid var(--chillselect-border);
        border-radius: 8px;
        box-shadow: var(--chillselect-dropdown-shadow);
        z-index: 10001;
        max-height: 240px;
        overflow-y: auto;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }

      .chillselect-wrapper.open .chillselect-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .chillselect-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        font-size: 14px;
        color: var(--chillselect-text);
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s ease;
      }

      .chillselect-option:hover,
      .chillselect-option.active {
        background: var(--chillselect-hover);
      }

      .chillselect-option.selected {
        background: var(--chillselect-selected);
        color: var(--chillselect-border-focus);
        font-weight: 500;
      }

      .chillselect-option.disabled {
        color: var(--chillselect-disabled-text);
        cursor: not-allowed;
      }

      .chillselect-option.disabled:hover {
        background: transparent;
      }

      .chillselect-check {
        width: 16px;
        height: 16px;
        color: var(--chillselect-border-focus);
      }

      .chillselect-divider {
        height: 1px;
        background: var(--chillselect-border);
        margin: 4px 0;
      }

      .chillselect-group-label {
        padding: 8px 12px 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--chillselect-placeholder);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Sizes */
      .chillselect-sm .chillselect-trigger {
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 6px;
      }

      .chillselect-lg .chillselect-trigger {
        padding: 14px 18px;
        font-size: 16px;
        border-radius: 10px;
      }

      /* Error State */
      .chillselect-error .chillselect-trigger {
        border-color: var(--chillselect-border-error);
      }

      .chillselect-helper {
        font-size: 12px;
        color: var(--chillselect-helper);
      }

      .chillselect-error .chillselect-helper {
        color: #ef4444;
      }

      /* Searchable */
      .chillselect-search {
        padding: 8px 12px;
        margin-bottom: 4px;
      }

      .chillselect-search-input {
        width: 100%;
        padding: 8px 10px;
        font-size: 14px;
        font-family: inherit;
        color: var(--chillselect-text);
        background: var(--chillselect-bg);
        border: 1px solid var(--chillselect-border);
        border-radius: 6px;
        outline: none;
      }

      .chillselect-search-input:focus {
        border-color: var(--chillselect-border-focus);
      }

      .chillselect-search-input {
        box-sizing: border-box;
      }

      .chillselect-no-results {
        padding: 12px;
        text-align: center;
        color: var(--chillselect-placeholder);
        font-size: 14px;
      }

      /* Multi Select */
      .chillselect-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .chillselect-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        font-size: 12px;
        background: var(--chillselect-selected);
        color: var(--chillselect-border-focus);
        border-radius: 4px;
      }

      .chillselect-tag-remove {
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

      .chillselect-tag-remove:hover {
        opacity: 1;
      }

      .chillselect-wrapper:not(.open) .chillselect-dropdown {
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillselect-trigger, .chillselect-arrow, .chillselect-dropdown, .chillselect-option { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgIcon(cls, d, size) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        if (cls) svg.setAttribute('class', cls);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('aria-hidden', 'true');
        if (size) { svg.setAttribute('width', String(size)); svg.setAttribute('height', String(size)); }
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
        svg.appendChild(p);
        return svg;
    }

    function itemsFromSelect(select) {
        const items = [];
        const add = (opt) => items.push({ value: opt.value, label: opt.textContent, disabled: opt.disabled });
        Array.from(select.children).forEach(ch => {
            if (ch.tagName === 'OPTGROUP') {
                items.push({ type: 'group', label: ch.label });
                Array.from(ch.children).forEach(add);
            } else if (ch.tagName === 'OPTION') add(ch);
        });
        return items;
    }

    const isOption = it => it && it.type !== 'divider' && it.type !== 'group';
    const same = (a, b) => a === b || (a !== null && b !== null && typeof a !== 'object' && typeof b !== 'object' && String(a) === String(b));

    // ---- Instance -----------------------------------------------------------

    class ChillSelectInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);

            const fromSelect = this.element && this.element.tagName === 'SELECT';
            const multiple = options.multiple !== undefined ? !!options.multiple : !!(fromSelect && this.element.multiple);
            const items = options.items || (fromSelect ? itemsFromSelect(this.element) : []);
            let value = options.value;
            if (value === undefined || value === null) {
                if (fromSelect) {
                    const sel = Array.from(this.element.selectedOptions || []).filter(o => o.value !== '' || multiple).map(o => o.value);
                    value = multiple ? sel : (sel.length ? sel[0] : null);
                } else value = multiple ? [] : null;
            }
            if (multiple && !Array.isArray(value)) value = value === null || value === undefined ? [] : [value];

            this.options = {
                label: options.label || '',
                placeholder: options.placeholder || 'Select an option',
                size: options.size || 'md',
                state: options.state || 'default',
                helper: options.helper || '',
                required: options.required || (fromSelect && this.element.required) || false,
                disabled: options.disabled || (fromSelect && this.element.disabled) || false,
                searchable: options.searchable || false,
                searchPlaceholder: options.searchPlaceholder || 'Search...',
                noResultsText: options.noResultsText || 'No options found',
                multiple: multiple,
                items: items,
                value: multiple ? value.slice() : value,
                name: options.name || (fromSelect ? this.element.name : '') || '',
                onChange: options.onChange || null
            };

            this._fromSelect = !!fromSelect;
            this._cleanup = [];
            this.isOpen = false;
            this.searchQuery = '';
            this.activeIndex = -1;
            this._visible = [];
            this._typeahead = '';
            this._typeaheadTimer = null;
            this._uid = ++uid;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        render() {
            const o = this.options;
            const id = 'chillselect-' + this._uid;
            const wrapper = document.createElement('div');
            wrapper.className = `chillselect-wrapper chillselect-${o.size}`;
            if (o.state !== 'default') wrapper.classList.add(`chillselect-${o.state}`);

            if (o.label) {
                const label = document.createElement('label');
                label.className = 'chillselect-label' + (o.required ? ' chillselect-label-required' : '');
                label.id = id + '-label';
                label.textContent = String(o.label);
                label.addEventListener('click', () => this.trigger && this.trigger.focus());
                wrapper.appendChild(label);
                this.labelEl = label;
            }

            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'chillselect-trigger';
            trigger.disabled = !!o.disabled;
            trigger.setAttribute('role', 'combobox');
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', id + '-listbox');
            if (o.label) trigger.setAttribute('aria-labelledby', id + '-label');
            if (o.required) trigger.setAttribute('aria-required', 'true');
            const valueEl = document.createElement('span');
            valueEl.className = 'chillselect-value';
            trigger.appendChild(valueEl);
            trigger.appendChild(svgIcon('chillselect-arrow', 'M6 9l6 6 6-6'));
            wrapper.appendChild(trigger);

            const dropdown = document.createElement('div');
            dropdown.className = 'chillselect-dropdown';
            if (o.searchable) {
                const sw = document.createElement('div');
                sw.className = 'chillselect-search';
                const si = document.createElement('input');
                si.type = 'text';
                si.className = 'chillselect-search-input';
                si.placeholder = String(o.searchPlaceholder);
                si.setAttribute('aria-label', String(o.searchPlaceholder));
                si.setAttribute('aria-controls', id + '-listbox');
                si.autocomplete = 'off';
                sw.appendChild(si);
                dropdown.appendChild(sw);
                this.searchInput = si;
            }
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'chillselect-options';
            optionsContainer.id = id + '-listbox';
            optionsContainer.setAttribute('role', 'listbox');
            if (o.multiple) optionsContainer.setAttribute('aria-multiselectable', 'true');
            if (o.label) optionsContainer.setAttribute('aria-labelledby', id + '-label');
            dropdown.appendChild(optionsContainer);
            wrapper.appendChild(dropdown);

            if (o.helper) {
                const h = document.createElement('span');
                h.className = 'chillselect-helper';
                h.id = id + '-helper';
                h.textContent = String(o.helper);
                wrapper.appendChild(h);
                trigger.setAttribute('aria-describedby', h.id);
            }

            this.hiddenWrap = document.createElement('span');
            this.hiddenWrap.hidden = true;
            wrapper.appendChild(this.hiddenWrap);

            // mount: replace the original element (kept for destroy()), or leave detached for create()
            if (this.element && this.element.parentNode) {
                this._marker = document.createComment('chillselect');
                this.element.parentNode.insertBefore(this._marker, this.element);
                this.element.parentNode.replaceChild(wrapper, this.element);
            }

            this.id = id;
            this.wrapper = wrapper;
            this.trigger = trigger;
            this.dropdown = dropdown;
            this.valueEl = valueEl;
            this.optionsContainer = optionsContainer;
            this.renderValue();
            this.renderOptions();
            this.syncHidden();
            this._syncAria();
        }

        _syncAria() {
            if (this.options.state === 'error') this.trigger.setAttribute('aria-invalid', 'true');
            else this.trigger.removeAttribute('aria-invalid');
        }

        // ---- rendering (DOM nodes only, never innerHTML) ----

        getFilteredItems() {
            if (!this.searchQuery) return this.options.items;
            const query = this.searchQuery.toLowerCase();
            return this.options.items.filter(item => isOption(item) && String(item.label).toLowerCase().includes(query));
        }

        isSelected(item) {
            return this.options.multiple
                ? this.options.value.some(v => same(v, item.value))
                : same(this.options.value, item.value) && this.options.value !== null;
        }

        renderOptions() {
            const items = this.getFilteredItems();
            const c = this.optionsContainer;
            c.textContent = '';
            this._visible = [];
            if (!items.some(isOption)) {
                const nr = document.createElement('div');
                nr.className = 'chillselect-no-results';
                nr.setAttribute('role', 'presentation');
                nr.textContent = String(this.options.noResultsText);
                c.appendChild(nr);
                this.activeIndex = -1;
                this._syncActive();
                return;
            }
            items.forEach(item => {
                if (item.type === 'divider') {
                    const d = document.createElement('div');
                    d.className = 'chillselect-divider';
                    d.setAttribute('role', 'separator');
                    c.appendChild(d);
                    return;
                }
                if (item.type === 'group') {
                    const g = document.createElement('div');
                    g.className = 'chillselect-group-label';
                    g.setAttribute('role', 'presentation');
                    g.textContent = String(item.label);
                    c.appendChild(g);
                    return;
                }
                const selected = this.isSelected(item);
                const idx = this._visible.length;
                const el = document.createElement('div');
                el.className = 'chillselect-option' + (selected ? ' selected' : '') + (item.disabled ? ' disabled' : '');
                el.id = this.id + '-opt-' + idx;
                el.setAttribute('role', 'option');
                el.setAttribute('aria-selected', selected ? 'true' : 'false');
                if (item.disabled) el.setAttribute('aria-disabled', 'true');
                el.dataset.index = String(idx);
                const label = document.createElement('span');
                label.textContent = String(item.label);
                el.appendChild(label);
                if (selected) el.appendChild(svgIcon('chillselect-check', 'M20 6L9 17l-5-5'));
                c.appendChild(el);
                this._visible.push({ item, el });
            });
            if (this.activeIndex >= this._visible.length) this.activeIndex = this._visible.length - 1;
            this._syncActive();
        }

        renderValue() {
            const o = this.options;
            const v = this.valueEl;
            v.textContent = '';
            const placeholder = () => {
                const s = document.createElement('span');
                s.className = 'chillselect-trigger-placeholder';
                s.textContent = String(o.placeholder);
                v.appendChild(s);
            };
            if (o.multiple) {
                if (!o.value.length) { placeholder(); return; }
                const tags = document.createElement('div');
                tags.className = 'chillselect-tags';
                o.value.forEach(val => {
                    const item = o.items.find(i => isOption(i) && same(i.value, val));
                    const tag = document.createElement('span');
                    tag.className = 'chillselect-tag';
                    const t = document.createElement('span');
                    t.textContent = item ? String(item.label) : String(val);
                    tag.appendChild(t);
                    const rm = document.createElement('span');
                    rm.className = 'chillselect-tag-remove';
                    rm.setAttribute('role', 'button');
                    rm.setAttribute('aria-label', 'Remove ' + t.textContent);
                    rm.appendChild(svgIcon('', 'M18 6L6 18M6 6l12 12', 14));
                    rm._chillValue = val;
                    tag.appendChild(rm);
                    tags.appendChild(tag);
                });
                v.appendChild(tags);
                return;
            }
            const selected = o.items.find(i => isOption(i) && o.value !== null && same(i.value, o.value));
            if (selected) v.textContent = String(selected.label);
            else placeholder();
        }

        syncHidden() {
            const h = this.hiddenWrap;
            h.textContent = '';
            if (!this.options.name) return;
            const vals = this.options.multiple ? this.options.value : (this.options.value === null ? [] : [this.options.value]);
            vals.forEach(val => {
                const i = document.createElement('input');
                i.type = 'hidden';
                i.name = this.options.name;
                i.value = String(val);
                h.appendChild(i);
            });
        }

        _syncActive() {
            const focusEl = this.options.searchable ? this.searchInput : this.trigger;
            this._visible.forEach((v, i) => v.el.classList.toggle('active', i === this.activeIndex));
            if (this.isOpen && this.activeIndex >= 0 && this._visible[this.activeIndex]) {
                const el = this._visible[this.activeIndex].el;
                focusEl.setAttribute('aria-activedescendant', el.id);
                if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
            } else {
                this.trigger.removeAttribute('aria-activedescendant');
                if (this.searchInput) this.searchInput.removeAttribute('aria-activedescendant');
            }
        }

        // ---- events ----

        bindEvents() {
            const on = (target, type, fn, opts) => {
                target.addEventListener(type, fn, opts);
                this._cleanup.push(() => target.removeEventListener(type, fn, opts));
            };

            on(this.trigger, 'click', (e) => {
                if (e.target.closest && e.target.closest('.chillselect-tag-remove')) return;
                this.toggle();
            });

            on(this.valueEl, 'click', (e) => {
                const rm = e.target.closest ? e.target.closest('.chillselect-tag-remove') : null;
                if (rm) {
                    e.stopPropagation();
                    this.removeValue(rm._chillValue);
                }
            });

            on(this.optionsContainer, 'click', (e) => {
                const el = e.target.closest ? e.target.closest('.chillselect-option') : null;
                if (!el) return;
                const entry = this._visible[+el.dataset.index];
                if (entry && !entry.item.disabled) {
                    this.selectValue(entry.item.value);
                    if (!this.options.multiple && this.trigger.focus) this.trigger.focus();
                }
            });

            on(this.optionsContainer, 'mousemove', (e) => {
                const el = e.target.closest ? e.target.closest('.chillselect-option') : null;
                if (el && +el.dataset.index !== this.activeIndex && !el.classList.contains('disabled')) {
                    this.activeIndex = +el.dataset.index;
                    this._syncActive();
                }
            });

            if (this.searchInput) {
                on(this.searchInput, 'input', (e) => {
                    this.searchQuery = e.target.value;
                    this.activeIndex = -1;
                    this.renderOptions();
                    this.moveActive(1, true);
                });
            }

            on(this.wrapper, 'keydown', (e) => this.onKeyDown(e));
        }

        onDocClick(e) {
            // composedPath: the clicked node may already have been re-rendered (detached) by an option handler
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            if (!this.wrapper.contains(e.target) && path.indexOf(this.wrapper) < 0) this.close();
        }

        moveActive(dir, fromStart) {
            const n = this._visible.length;
            if (!n) return;
            let i = fromStart ? (dir > 0 ? -1 : n) : this.activeIndex;
            for (let s = 0; s < n; s++) {
                i += dir;
                if (i < 0 || i >= n) { if (fromStart) break; i = dir > 0 ? 0 : n - 1; }
                if (!this._visible[i].item.disabled) { this.activeIndex = i; this._syncActive(); return; }
            }
        }

        onKeyDown(e) {
            if (this.options.disabled || e.altKey || e.ctrlKey || e.metaKey) return;
            const inSearch = e.target === this.searchInput;
            const key = e.key;
            if (!this.isOpen) {
                if (e.target !== this.trigger) return;
                if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    this.open();
                } else if (this.options.multiple && (key === 'Backspace' || key === 'Delete') && this.options.value.length) {
                    e.preventDefault();
                    this.removeValue(this.options.value[this.options.value.length - 1]);
                } else if (key.length === 1) {
                    this.typeahead(key, false);
                }
                return;
            }
            switch (key) {
                case 'ArrowDown': e.preventDefault(); this.moveActive(1); break;
                case 'ArrowUp': e.preventDefault(); this.moveActive(-1); break;
                case 'Home': if (!inSearch) { e.preventDefault(); this.moveActive(1, true); } break;
                case 'End': if (!inSearch) { e.preventDefault(); this.moveActive(-1, true); } break;
                case 'Enter':
                    e.preventDefault();
                    if (this.activeIndex >= 0 && this._visible[this.activeIndex]) {
                        this.selectValue(this._visible[this.activeIndex].item.value);
                    }
                    break;
                case ' ':
                    if (!inSearch) {
                        e.preventDefault();
                        if (this.activeIndex >= 0 && this._visible[this.activeIndex]) this.selectValue(this._visible[this.activeIndex].item.value);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                    this.trigger.focus();
                    break;
                case 'Tab':
                    this.close();
                    break;
                default:
                    if (!inSearch && key.length === 1) this.typeahead(key, true);
            }
        }

        typeahead(ch, open) {
            window.clearTimeout(this._typeaheadTimer);
            this._typeahead += ch.toLowerCase();
            this._typeaheadTimer = window.setTimeout(() => { this._typeahead = ''; }, 600);
            const list = open ? this._visible.map(v => v.item) : this.options.items.filter(isOption);
            const start = open ? this.activeIndex + (this._typeahead.length === 1 ? 1 : 0) : 0;
            const n = list.length;
            for (let s = 0; s < n; s++) {
                const i = (Math.max(start, 0) + s) % n;
                const it = list[i];
                if (!it.disabled && String(it.label).toLowerCase().indexOf(this._typeahead) === 0) {
                    if (open) { this.activeIndex = i; this._syncActive(); }
                    else if (!this.options.multiple) this.setValue(it.value, true);
                    return;
                }
            }
        }

        toggle() {
            if (this.isOpen) this.close(); else this.open();
        }

        open() {
            if (this.options.disabled || this.isOpen) return;
            this.isOpen = true;
            this.wrapper.classList.add('open');
            this.trigger.setAttribute('aria-expanded', 'true');
            this._docHandler = (e) => this.onDocClick(e);
            document.addEventListener('click', this._docHandler);

            // start on the selected option (or the first enabled one)
            let idx = this._visible.findIndex(v => this.isSelected(v.item) && !v.item.disabled);
            if (idx < 0) idx = this._visible.findIndex(v => !v.item.disabled);
            this.activeIndex = idx;
            this._syncActive();

            if (this.searchInput) {
                this._focusTimer = window.setTimeout(() => this.searchInput && this.searchInput.focus(), 0);
            }
        }

        close() {
            window.clearTimeout(this._focusTimer);
            if (this._docHandler) {
                document.removeEventListener('click', this._docHandler);
                this._docHandler = null;
            }
            if (!this.isOpen) return;
            this.isOpen = false;
            this.wrapper.classList.remove('open');
            this.trigger.setAttribute('aria-expanded', 'false');
            this.activeIndex = -1;
            this.searchQuery = '';

            if (this.searchInput) {
                this.searchInput.value = '';
                this.renderOptions();
            } else this._syncActive();
            this._syncActive();
        }

        _emitChange() {
            if (this.options.onChange) {
                this.options.onChange(this.options.multiple ? this.options.value.slice() : this.options.value);
            }
        }

        _refresh() {
            this.renderValue();
            this.renderOptions();
            this.syncHidden();
        }

        selectValue(value) {
            if (this.options.multiple) {
                const index = this.options.value.findIndex(v => same(v, value));
                if (index > -1) this.options.value.splice(index, 1);
                else this.options.value.push(value);
            } else {
                this.options.value = value;
                this.close();
            }
            this._refresh();
            this._emitChange();
        }

        removeValue(value) {
            const index = this.options.value.findIndex(v => same(v, value));
            if (index > -1) {
                this.options.value.splice(index, 1);
                this._refresh();
                this._emitChange();
            }
        }

        getValue() {
            return this.options.multiple ? this.options.value.slice() : this.options.value;
        }

        setValue(value, emit) {
            if (this.options.multiple) this.options.value = Array.isArray(value) ? value.slice() : (value === null || value === undefined ? [] : [value]);
            else this.options.value = value === undefined ? null : value;
            this._refresh();
            if (emit) this._emitChange();
        }

        setItems(items) {
            this.options.items = items;
            this._refresh();
        }

        setState(state) {
            this.wrapper.classList.remove(`chillselect-${this.options.state}`);
            if (state !== 'default') this.wrapper.classList.add(`chillselect-${state}`);
            this.options.state = state;
            this._syncAria();
        }

        setDisabled(disabled) {
            this.options.disabled = disabled;
            this.trigger.disabled = disabled;
            if (disabled) this.close();
        }

        focus() {
            this.trigger.focus();
        }

        destroy() {
            if (!this.wrapper) return;
            this.close();
            window.clearTimeout(this._typeaheadTimer);
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            const wrapper = this.wrapper;
            if (this.element && this._marker && this._marker.parentNode) {
                let select = this.element;
                if (!this._fromSelect) {
                    select = document.createElement('select');
                    this.options.items.forEach(item => {
                        if (isOption(item)) {
                            const option = document.createElement('option');
                            option.value = item.value;
                            option.textContent = item.label;
                            select.appendChild(option);
                        }
                    });
                } else {
                    Array.from(select.options).forEach(opt => {
                        opt.selected = this.options.multiple
                            ? this.options.value.some(v => same(v, opt.value))
                            : (this.options.value !== null && same(this.options.value, opt.value));
                    });
                }
                wrapper.parentNode.insertBefore(select, wrapper);
                this._marker.parentNode.removeChild(this._marker);
            }
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            this.wrapper = null;
        }
    }

    function createSelect(options = {}) {
        const instance = new ChillSelectInstance(null, options);
        const wrapper = instance.wrapper;
        // additive helpers on the returned element (return type is still the wrapper div)
        wrapper.instance = instance;
        wrapper.destroy = function () { instance.destroy(); };
        return wrapper;
    }

    const ChillSelect = {
        version: VERSION,

        init(selector, options) {
            return new ChillSelectInstance(selector, options);
        },

        create(options) {
            return createSelect(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSelect;
    } else {
        window.ChillSelect = ChillSelect;
    }

})(typeof window !== 'undefined' ? window : this);
