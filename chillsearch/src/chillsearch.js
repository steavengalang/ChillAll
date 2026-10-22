/**
 * ChillSearch - Zero-dependency Search Input Component (ARIA combobox)
 *
 * @example
 *   const s = ChillSearch.init('#search', {
 *     suggestions: ['apple', { label: 'banana', icon: 'B', value: 1 }],   // or getSuggestions: async q => [...]
 *     onSelect: s => {}, onSearch: q => {}, onChange: v => {}, shortcut: 'Ctrl K'
 *   });
 *   const d = ChillSearch.create({ suggestions: [...] });   // detached: append d.container
 *
 * Options
 *   placeholder    default 'Search...'
 *   size           'sm' | 'md' | 'lg'                          default 'md'
 *   debounce       ms before filtering (0 = immediate)         default 300
 *   suggestions    Array<string | { label, icon?, iconHtml?, value? }>   (icon is text; iconHtml is a trusted-HTML opt-in)
 *   getSuggestions (query) => Array | Promise<Array>           stale responses are discarded
 *   shortcut       label text, e.g. 'Ctrl K' - binds Ctrl/Cmd+K to focus   default null
 *   showClear      default true
 *   ariaLabel      default 'Search'
 *   noResultsText  default 'No results found'
 *   onSearch(query) onSelect(suggestion) onChange(value)
 *
 * Keyboard: ArrowDown/ArrowUp (wrap), Enter, Escape, Home/End inside the list.
 * Methods: getValue(), setValue(v), clear(), focus(), search(), destroy()
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const STYLE_ID = 'chillsearch-styles';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillsearch-bg: #ffffff;
        --chillsearch-text: #171717;
        --chillsearch-text-muted: #9ca3af;
        --chillsearch-border: #e5e7eb;
        --chillsearch-focus: #3b82f6;
        --chillsearch-hover: #f3f4f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillsearch-bg: #262626;
          --chillsearch-text: #fafafa;
          --chillsearch-text-muted: #6b7280;
          --chillsearch-border: #404040;
          --chillsearch-hover: #374151;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillsearch-bg: #262626;
        --chillsearch-text: #fafafa;
        --chillsearch-text-muted: #6b7280;
        --chillsearch-border: #404040;
        --chillsearch-hover: #374151;
      }

      .chillsearch {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      .chillsearch-input {
        width: 100%;
        padding: 10px 40px 10px 40px;
        font-size: 14px;
        color: var(--chillsearch-text);
        background: var(--chillsearch-bg);
        border: 1px solid var(--chillsearch-border);
        border-radius: 8px;
        outline: none;
        transition: all 0.15s ease;
      }

      .chillsearch-input:focus,
      .chillsearch-input:focus-visible {
        border-color: var(--chillsearch-focus);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .chillsearch-input::placeholder {
        color: var(--chillsearch-text-muted);
      }

      .chillsearch-icon {
        position: absolute;
        left: 12px;
        width: 18px;
        height: 18px;
        color: var(--chillsearch-text-muted);
        pointer-events: none;
      }

      .chillsearch-clear {
        position: absolute;
        right: 4px;
        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        background: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: var(--chillsearch-text-muted);
        transition: all 0.15s ease;
      }

      .chillsearch-clear:hover {
        background: var(--chillsearch-hover);
        color: var(--chillsearch-text);
      }

      .chillsearch-clear:focus-visible {
        outline: 2px solid var(--chillsearch-focus);
        outline-offset: 1px;
      }

      .chillsearch-clear svg {
        width: 14px;
        height: 14px;
      }

      .chillsearch.has-value .chillsearch-clear {
        display: flex;
      }

      .chillsearch.has-value .chillsearch-input {
        padding-right: 40px;
      }

      /* Loading */
      .chillsearch-loading {
        position: absolute;
        right: 12px;
        width: 16px;
        height: 16px;
        border: 2px solid var(--chillsearch-border);
        border-top-color: var(--chillsearch-focus);
        border-radius: 50%;
        animation: chillsearch-spin 0.6s linear infinite;
      }

      @keyframes chillsearch-spin {
        to { transform: rotate(360deg); }
      }

      .chillsearch.loading .chillsearch-clear {
        display: none !important;
      }

      /* Sizes */
      .chillsearch-sm .chillsearch-input {
        padding: 8px 36px 8px 36px;
        font-size: 13px;
        border-radius: 6px;
      }

      .chillsearch-sm .chillsearch-icon {
        left: 10px;
        width: 16px;
        height: 16px;
      }

      .chillsearch-lg .chillsearch-input {
        padding: 14px 48px 14px 48px;
        font-size: 16px;
        border-radius: 10px;
      }

      .chillsearch-lg .chillsearch-icon {
        left: 16px;
        width: 20px;
        height: 20px;
      }

      /* Suggestions */
      .chillsearch-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        padding: 4px;
        background: var(--chillsearch-bg);
        border: 1px solid var(--chillsearch-border);
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 100;
        display: none;
      }

      .chillsearch.open .chillsearch-suggestions {
        display: block;
      }

      .chillsearch-suggestion {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        font-size: 14px;
        color: var(--chillsearch-text);
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .chillsearch-suggestion:hover,
      .chillsearch-suggestion.active {
        background: var(--chillsearch-hover);
      }

      .chillsearch-suggestion.active {
        outline: 2px solid var(--chillsearch-focus);
        outline-offset: -2px;
      }

      .chillsearch-suggestion-icon {
        width: 16px;
        height: 16px;
        color: var(--chillsearch-text-muted);
        flex-shrink: 0;
      }

      .chillsearch-highlight {
        color: var(--chillsearch-focus);
        font-weight: 600;
      }

      .chillsearch-no-results {
        padding: 16px;
        text-align: center;
        color: var(--chillsearch-text-muted);
        font-size: 14px;
      }

      .chillsearch-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      /* Shortcut */
      .chillsearch-shortcut {
        position: absolute;
        right: 12px;
        padding: 4px 8px;
        font-size: 11px;
        font-family: monospace;
        color: var(--chillsearch-text-muted);
        background: var(--chillsearch-hover);
        border: 1px solid var(--chillsearch-border);
        border-radius: 4px;
      }

      .chillsearch.has-value .chillsearch-shortcut,
      .chillsearch.loading .chillsearch-shortcut {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillsearch-loading { animation-duration: 3s; }
        .chillsearch-input, .chillsearch-clear, .chillsearch-suggestion { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
    }

    function svgIcon(pathMarkup, cls) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('aria-hidden', 'true');
        if (cls) svg.setAttribute('class', cls);
        pathMarkup.forEach(p => {
            const el = document.createElementNS(NS, p[0]);
            Object.keys(p[1]).forEach(k => el.setAttribute(k, p[1][k]));
            svg.appendChild(el);
        });
        return svg;
    }

    class ChillSearchInstance {
        constructor(selector, options = {}) {
            this.element = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector || null;

            const o = options || {};
            this.options = Object.assign({
                placeholder: 'Search...',
                size: 'md',
                debounce: 300,
                suggestions: [],
                getSuggestions: null,
                shortcut: null,
                showClear: true,
                ariaLabel: 'Search',
                noResultsText: 'No results found',
                onSearch: null,
                onSelect: null,
                onChange: null
            }, o);
            ['placeholder', 'size', 'suggestions', 'ariaLabel', 'noResultsText'].forEach(k => {
                if (o[k] === undefined || o[k] === null) this.options[k] = ChillSearchInstance.defaults[k];
            });
            if (typeof this.options.debounce !== 'number' || this.options.debounce < 0) this.options.debounce = 300;

            this.value = '';
            this.isLoading = false;
            this.suggestions = [];
            this.activeIndex = -1;
            this.debounceTimer = null;
            this._reqId = 0;
            this._destroyed = false;
            this._cleanups = [];
            this._id = ++uid;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _listen(target, evt, fn) {
            target.addEventListener(evt, fn);
            this._cleanups.push(() => target.removeEventListener(evt, fn));
        }

        render() {
            const o = this.options;
            const container = document.createElement('div');
            container.className = `chillsearch chillsearch-${o.size}`;

            container.appendChild(svgIcon([['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.35-4.35' }]], 'chillsearch-icon'));

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'chillsearch-input';
            input.setAttribute('placeholder', String(o.placeholder));
            input.setAttribute('role', 'combobox');
            input.setAttribute('aria-autocomplete', 'list');
            input.setAttribute('aria-expanded', 'false');
            input.setAttribute('aria-label', String(o.ariaLabel));
            input.setAttribute('autocomplete', 'off');
            container.appendChild(input);

            if (o.showClear) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chillsearch-clear';
                btn.setAttribute('aria-label', 'Clear search');
                btn.appendChild(svgIcon([['path', { d: 'M18 6L6 18M6 6l12 12' }]]));
                container.appendChild(btn);
                this.clearBtn = btn;
            }

            const loading = document.createElement('div');
            loading.className = 'chillsearch-loading';
            loading.style.display = 'none';
            loading.setAttribute('aria-hidden', 'true');
            container.appendChild(loading);

            if (o.shortcut) {
                const sc = document.createElement('span');
                sc.className = 'chillsearch-shortcut';
                sc.textContent = String(o.shortcut);
                container.appendChild(sc);
            }

            const list = document.createElement('div');
            list.className = 'chillsearch-suggestions';
            list.id = 'chillsearch-' + this._id + '-list';
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', String(o.ariaLabel) + ' suggestions');
            container.appendChild(list);
            input.setAttribute('aria-controls', list.id);

            const status = document.createElement('div');
            status.className = 'chillsearch-sr';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            container.appendChild(status);

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(container, this.element);
            }

            this.container = container;
            this.input = input;
            this.loadingEl = loading;
            this.suggestionsEl = list;
            this.statusEl = status;
        }

        bindEvents() {
            this._listen(this.input, 'input', (e) => {
                this.value = e.target.value;
                this.container.classList.toggle('has-value', this.value.length > 0);
                this._emitChange(this.value);

                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
                if (this.options.debounce > 0) {
                    this.debounceTimer = setTimeout(() => { this.debounceTimer = null; this.search(); }, this.options.debounce);
                } else {
                    this.search();
                }
            });

            this._listen(this.input, 'focus', () => {
                if (this.suggestions.length > 0) this._setOpen(true);
            });

            this._listen(this.input, 'keydown', (e) => {
                const n = this.suggestions.length;
                const isOpen = this.container.classList.contains('open');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!n) return;
                    if (!isOpen) this._setOpen(true);
                    this.activeIndex = this.activeIndex + 1 >= n ? 0 : this.activeIndex + 1;
                    this.updateActiveSuggestion();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!n) return;
                    if (!isOpen) this._setOpen(true);
                    this.activeIndex = this.activeIndex <= 0 ? n - 1 : this.activeIndex - 1;
                    this.updateActiveSuggestion();
                } else if ((e.key === 'Home' || e.key === 'End') && isOpen && this.activeIndex >= 0) {
                    e.preventDefault();
                    this.activeIndex = e.key === 'Home' ? 0 : n - 1;
                    this.updateActiveSuggestion();
                } else if (e.key === 'Enter') {
                    if (isOpen && this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
                        e.preventDefault();
                        this.selectSuggestion(this.suggestions[this.activeIndex]);
                    } else if (this.options.onSearch) {
                        this.options.onSearch(this.value);
                    }
                } else if (e.key === 'Escape') {
                    this.closeSuggestions();
                }
            });

            if (this.clearBtn) {
                this._listen(this.clearBtn, 'click', () => this.clear());
            }

            // keep input focused when pressing on an option
            this._listen(this.suggestionsEl, 'mousedown', (e) => e.preventDefault());
            this._listen(this.suggestionsEl, 'click', (e) => {
                const el = e.target.closest && e.target.closest('.chillsearch-suggestion');
                if (!el) return;
                const s = this.suggestions[parseInt(el.getAttribute('data-index'), 10)];
                if (s !== undefined) this.selectSuggestion(s);
            });

            this._listen(document, 'click', (e) => {
                if (!this.container.contains(e.target)) this.closeSuggestions();
            });

            if (this.options.shortcut) {
                this._listen(document, 'keydown', (e) => {
                    if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
                        e.preventDefault();
                        this.input.focus();
                    }
                });
            }
        }

        _emitChange(v) {
            if (typeof this.options.onChange === 'function') this.options.onChange(v);
        }

        _setOpen(open) {
            this.container.classList.toggle('open', !!open);
            this.input.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (!open) this.input.removeAttribute('aria-activedescendant');
        }

        async search() {
            const id = ++this._reqId;
            const o = this.options;
            if (typeof o.getSuggestions === 'function') {
                this.setLoading(true);
                let result;
                try {
                    result = await o.getSuggestions(this.value);
                } catch (e) {
                    result = [];
                }
                if (this._destroyed || id !== this._reqId) return; // stale response
                this.suggestions = Array.isArray(result) ? result : [];
                this.setLoading(false);
            } else if (o.suggestions.length > 0) {
                const query = this.value.toLowerCase();
                this.suggestions = o.suggestions.filter(s =>
                    String(typeof s === 'string' ? s : s.label).toLowerCase().includes(query)
                );
            } else {
                this.suggestions = [];
            }

            this.renderSuggestions();
        }

        renderSuggestions() {
            const list = this.suggestionsEl;
            while (list.firstChild) list.removeChild(list.firstChild);
            this.activeIndex = -1;
            this.input.removeAttribute('aria-activedescendant');

            if (this.suggestions.length === 0) {
                if (this.value) {
                    const nr = document.createElement('div');
                    nr.className = 'chillsearch-no-results';
                    nr.textContent = this.options.noResultsText;
                    list.appendChild(nr);
                    this.statusEl.textContent = this.options.noResultsText;
                } else {
                    this.statusEl.textContent = '';
                }
                this._setOpen(!!this.value);
                return;
            }

            this.suggestions.forEach((s, i) => {
                const isObj = s !== null && typeof s === 'object';
                const label = String(isObj ? s.label : s);
                const row = document.createElement('div');
                row.className = 'chillsearch-suggestion';
                row.id = 'chillsearch-' + this._id + '-opt-' + i;
                row.setAttribute('role', 'option');
                row.setAttribute('aria-selected', 'false');
                row.setAttribute('data-index', String(i));
                if (isObj && (s.iconHtml || s.icon)) {
                    const ic = document.createElement('span');
                    ic.className = 'chillsearch-suggestion-icon';
                    ic.setAttribute('aria-hidden', 'true');
                    if (s.iconHtml) ic.innerHTML = String(s.iconHtml); // explicit trusted-HTML opt-in
                    else ic.textContent = String(s.icon);
                    row.appendChild(ic);
                }
                const text = document.createElement('span');
                this.highlightMatch(text, label, this.value);
                row.appendChild(text);
                list.appendChild(row);
            });
            const n = this.suggestions.length;
            this.statusEl.textContent = n + (n === 1 ? ' suggestion' : ' suggestions') + ' available';
            this._setOpen(true);
        }

        /** Appends text + <span.chillsearch-highlight> nodes to `target` (never parses HTML, regex-safe). */
        highlightMatch(target, text, query) {
            const idx = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
            if (idx < 0) { target.appendChild(document.createTextNode(text)); return target; }
            if (idx > 0) target.appendChild(document.createTextNode(text.slice(0, idx)));
            const hl = document.createElement('span');
            hl.className = 'chillsearch-highlight';
            hl.textContent = text.slice(idx, idx + query.length);
            target.appendChild(hl);
            if (idx + query.length < text.length) target.appendChild(document.createTextNode(text.slice(idx + query.length)));
            return target;
        }

        updateActiveSuggestion() {
            let active = null;
            this.suggestionsEl.querySelectorAll('.chillsearch-suggestion').forEach((el, i) => {
                const on = i === this.activeIndex;
                el.classList.toggle('active', on);
                el.setAttribute('aria-selected', on ? 'true' : 'false');
                if (on) active = el;
            });
            if (active) {
                this.input.setAttribute('aria-activedescendant', active.id);
                if (active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
            } else this.input.removeAttribute('aria-activedescendant');
        }

        selectSuggestion(suggestion) {
            const value = String(typeof suggestion === 'object' && suggestion !== null ? suggestion.label : suggestion);
            this.input.value = value;
            this.value = value;
            this.container.classList.add('has-value');
            this.closeSuggestions();
            this._emitChange(value);

            if (typeof this.options.onSelect === 'function') {
                this.options.onSelect(suggestion);
            }
        }

        closeSuggestions() {
            this._setOpen(false);
            this.activeIndex = -1;
            this.suggestionsEl.querySelectorAll('.chillsearch-suggestion.active').forEach(el => {
                el.classList.remove('active');
                el.setAttribute('aria-selected', 'false');
            });
        }

        setLoading(loading) {
            this.isLoading = loading;
            this.container.classList.toggle('loading', loading);
            this.container.setAttribute('aria-busy', loading ? 'true' : 'false');
            this.loadingEl.style.display = loading ? 'block' : 'none';
        }

        clear() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
            this._reqId++;
            this.input.value = '';
            this.value = '';
            this.container.classList.remove('has-value');
            this.suggestions = [];
            this.setLoading(false);
            this.renderSuggestions();
            this.closeSuggestions();
            this.input.focus();
            this._emitChange('');
        }

        getValue() {
            return this.value;
        }

        setValue(value) {
            value = value == null ? '' : String(value);
            this.input.value = value;
            this.value = value;
            this.container.classList.toggle('has-value', value.length > 0);
        }

        focus() {
            this.input.focus();
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            const c = this.container;
            if (!c || !c.parentNode) return;
            if (this.element) c.parentNode.replaceChild(this.element, c);
            else c.parentNode.removeChild(c);
        }
    }

    ChillSearchInstance.defaults = { placeholder: 'Search...', size: 'md', suggestions: [], ariaLabel: 'Search', noResultsText: 'No results found' };

    const ChillSearch = {
        version: VERSION,

        init(selector, options) {
            return new ChillSearchInstance(selector, options);
        },

        /** Build a detached search box; append `instance.container` yourself. */
        create(options) {
            return new ChillSearchInstance(null, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSearch;
    } else {
        window.ChillSearch = ChillSearch;
    }

})(typeof window !== 'undefined' ? window : this);
