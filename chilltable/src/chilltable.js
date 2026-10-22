/**
 * ChillTable - Zero-dependency Data Table Library
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const t = ChillTable.create('#el', {
 *     columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age', align: 'right' }],
 *     data: [{ name: 'Ada', age: 36 }],
 *     pageSize: 10, selectable: true, onSelect: rows => {}, stickyHeader: true
 *   });
 *   t.exportCSV();        // -> CSV string (all filtered rows)
 *   t.destroy();
 *
 * Options (all optional except columns/data):
 *   columns[]       { key, label, render(value,row) -> string | Node, html:false, sortable, align,
 *                     sortValue(value,row), exportValue(value,row) }
 *                   render() output is inserted as TEXT unless the column sets `html: true`
 *                   (opt-in, you are then responsible for sanitising) or render returns a DOM Node.
 *   data            array of row objects
 *   pageSize        10
 *   searchable      true            searchPlaceholder 'Search...'
 *   sortable        true            (per-column `sortable:false` also supported)
 *   striped         true
 *   selectable      false           checkbox column + select-all (current page)
 *   onSelect        fn(selectedRows)
 *   onSort          fn(key, direction)         onPageChange fn(page)       onSearch fn(query)
 *   emptyText       'No data available'
 *   caption         string -> <caption>;  captionHidden:false (true = visually hidden)
 *   ariaLabel       accessible name for the <table> when there is no caption
 *   stickyHeader    false           maxHeight '400px' (used with stickyHeader)
 *   exportButton    false           shows an "Export CSV" button;  exportFilename 'table.csv'
 *
 * Methods: setData, refresh, setPage, sortBy(key,dir), search(q), getSelected, selectAll, clearSelection,
 *          exportCSV({all=true, download=false, filename}), on(event, fn), destroy
 * Events:  'select', 'sort', 'page', 'search'
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilltable_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] || document.getElementById('chilltable-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilltable-styles';
        style.textContent = `
      :root {
        --chilltable-bg: #ffffff;
        --chilltable-border: #e5e5e5;
        --chilltable-text: #171717;
        --chilltable-text-light: #737373;
        --chilltable-hover: #f5f5f5;
        --chilltable-stripe: #fafafa;
        --chilltable-primary: #3b82f6;
        --chilltable-selected: rgba(59, 130, 246, 0.12);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltable-bg: #171717;
          --chilltable-border: #404040;
          --chilltable-text: #fafafa;
          --chilltable-text-light: #a3a3a3;
          --chilltable-hover: #262626;
          --chilltable-stripe: #1f1f1f;
          --chilltable-selected: rgba(59, 130, 246, 0.22);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilltable-bg: #171717;
        --chilltable-border: #404040;
        --chilltable-text: #fafafa;
        --chilltable-text-light: #a3a3a3;
        --chilltable-hover: #262626;
        --chilltable-stripe: #1f1f1f;
        --chilltable-selected: rgba(59, 130, 246, 0.22);
      }

      .chilltable-container {
        width: 100%;
        border: 1px solid var(--chilltable-border);
        border-radius: 8px;
        background: var(--chilltable-bg);
        color: var(--chilltable-text);
      }

      .chilltable-scroll {
        overflow-x: auto;
      }

      .chilltable-sticky .chilltable-scroll {
        overflow: auto;
        max-height: var(--chilltable-max-height, 400px);
      }

      .chilltable-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--chilltable-border);
        gap: 12px;
        flex-wrap: wrap;
      }

      .chilltable-toolbar-end {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chilltable-search {
        padding: 8px 12px;
        font-size: 14px;
        min-height: 32px;
        box-sizing: border-box;
        border: 1px solid var(--chilltable-border);
        border-radius: 6px;
        background: var(--chilltable-bg);
        color: var(--chilltable-text);
        min-width: 200px;
        outline: none;
      }

      .chilltable-search:focus {
        border-color: var(--chilltable-primary);
      }

      .chilltable-search:focus-visible,
      .chilltable-sort-btn:focus-visible,
      .chilltable-pagination-btn:focus-visible,
      .chilltable-export:focus-visible,
      .chilltable-checkbox:focus-visible {
        outline: 2px solid var(--chilltable-primary);
        outline-offset: 2px;
      }

      .chilltable-count {
        font-size: 14px;
        color: var(--chilltable-text-light);
      }

      .chilltable-export {
        padding: 6px 12px;
        min-height: 32px;
        font-size: 14px;
        border: 1px solid var(--chilltable-border);
        border-radius: 6px;
        background: var(--chilltable-bg);
        color: var(--chilltable-text);
        cursor: pointer;
      }

      .chilltable-export:hover {
        background: var(--chilltable-hover);
      }

      .chilltable {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .chilltable-caption {
        caption-side: top;
        text-align: left;
        padding: 12px 16px;
        font-weight: 600;
        color: var(--chilltable-text);
      }

      .chilltable-caption.chilltable-sr-only,
      .chilltable-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .chilltable th,
      .chilltable td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--chilltable-border);
      }

      .chilltable .chilltable-align-right { text-align: right; }
      .chilltable .chilltable-align-center { text-align: center; }

      .chilltable th {
        font-weight: 600;
        color: var(--chilltable-text);
        background: var(--chilltable-stripe);
        user-select: none;
        white-space: nowrap;
      }

      .chilltable-sticky .chilltable th {
        position: sticky;
        top: 0;
        z-index: 1;
        box-shadow: 0 1px 0 var(--chilltable-border);
      }

      .chilltable th.chilltable-sortable { cursor: pointer; }

      .chilltable th.chilltable-sortable:hover {
        background: var(--chilltable-hover);
      }

      .chilltable-sort-btn {
        all: unset;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 24px;
      }

      .chilltable-sort-btn:focus-visible {
        outline: 2px solid var(--chilltable-primary);
        outline-offset: 2px;
      }

      .chilltable th .sort-icon {
        margin-left: 4px;
        opacity: 0.4;
      }

      .chilltable th.sorted .sort-icon {
        opacity: 1;
      }

      .chilltable-checkbox {
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
        accent-color: var(--chilltable-primary);
      }

      .chilltable .chilltable-select-cell {
        width: 40px;
        text-align: center;
      }

      .chilltable td {
        color: var(--chilltable-text);
      }

      .chilltable tbody tr:hover {
        background: var(--chilltable-hover);
      }

      .chilltable-striped tbody tr:nth-child(even) {
        background: var(--chilltable-stripe);
      }

      .chilltable-striped tbody tr:nth-child(even):hover {
        background: var(--chilltable-hover);
      }

      .chilltable tbody tr.chilltable-row-selected,
      .chilltable-striped tbody tr.chilltable-row-selected:nth-child(even) {
        background: var(--chilltable-selected);
      }

      .chilltable-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--chilltable-border);
        gap: 12px;
        flex-wrap: wrap;
      }

      .chilltable-pagination-info {
        font-size: 14px;
        color: var(--chilltable-text-light);
      }

      .chilltable-pagination-controls {
        display: flex;
        gap: 4px;
      }

      .chilltable-pagination-btn {
        padding: 6px 12px;
        min-height: 32px;
        min-width: 32px;
        font-size: 14px;
        border: 1px solid var(--chilltable-border);
        border-radius: 4px;
        background: var(--chilltable-bg);
        color: var(--chilltable-text);
        cursor: pointer;
      }

      .chilltable-pagination-btn:hover:not(:disabled) {
        background: var(--chilltable-hover);
      }

      .chilltable-pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chilltable-pagination-btn.active {
        background: var(--chilltable-primary);
        color: white;
        border-color: var(--chilltable-primary);
      }

      .chilltable-empty {
        text-align: center;
        padding: 40px 16px;
        color: var(--chilltable-text-light);
      }

      @media (max-width: 640px) {
        .chilltable-toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .chilltable-search {
          width: 100%;
        }

        .chilltable th,
        .chilltable td {
          padding: 10px 12px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .chilltable-container * {
          transition: none !important;
          animation: none !important;
        }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    function isNil(v) { return v === null || v === undefined; }

    function compareValues(a, b) {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (a instanceof Date && b instanceof Date) return a - b;
        if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    }

    function csvCell(v) {
        if (isNil(v)) return '';
        let s = v instanceof Date ? v.toISOString() : String(v);
        // CSV/formula injection guard for text cells (numbers are left alone)
        if (typeof v === 'string' && /^[=+@\t\r]/.test(s)) s = "'" + s;
        else if (typeof v === 'string' && /^-/.test(s) && isNaN(Number(s))) s = "'" + s;
        if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
    }

    class ChillTableInstance {
        constructor(container, config = {}) {
            this.container = typeof container === 'string'
                ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
                : container;

            this.config = {
                columns: [],
                data: [],
                pageSize: 10,
                searchable: true,
                sortable: true,
                striped: true,
                selectable: false,
                emptyText: 'No data available',
                searchPlaceholder: 'Search...',
                stickyHeader: false,
                maxHeight: '400px',
                exportButton: false,
                exportFilename: 'table.csv',
                captionHidden: false,
                ...config
            };
            this.config.columns = config.columns || [];
            this.config.data = config.data || [];
            this.config.pageSize = Math.max(1, parseInt(config.pageSize, 10) || 10);
            this.config.searchable = config.searchable !== false;
            this.config.sortable = config.sortable !== false;
            this.config.striped = config.striped !== false;

            this.state = {
                data: [...this.config.data],
                filteredData: [...this.config.data],
                currentPage: 1,
                sortColumn: null,
                sortDirection: 'asc',
                searchQuery: ''
            };

            this.selected = new Set();
            this._handlers = {};
            this._destroyed = false;
            this._listeners = [];

            if (this.container) {
                this.init();
            }
        }

        init() {
            injectCSS();
            this._build();
            this.render();
        }

        // ---- events -------------------------------------------------------
        on(event, fn) {
            (this._handlers[event] = this._handlers[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const list = this._handlers[event];
            if (list) this._handlers[event] = fn ? list.filter(f => f !== fn) : [];
            return this;
        }

        _emit(event, ...args) {
            (this._handlers[event] || []).slice().forEach(fn => { try { fn(...args); } catch (e) { /* swallow */ } });
        }

        _listen(target, type, fn) {
            target.addEventListener(type, fn);
            this._listeners.push(() => target.removeEventListener(type, fn));
        }

        // ---- DOM ----------------------------------------------------------
        _build() {
            const cfg = this.config;
            this.container.textContent = '';

            const root = el('div', 'chilltable-container');
            if (cfg.stickyHeader) {
                root.classList.add('chilltable-sticky');
                root.style.setProperty('--chilltable-max-height', String(cfg.maxHeight));
            }
            this.root = root;

            if (cfg.searchable || cfg.exportButton) {
                const toolbar = el('div', 'chilltable-toolbar');
                if (cfg.searchable) {
                    const input = el('input', 'chilltable-search');
                    input.type = 'search';
                    input.placeholder = cfg.searchPlaceholder;
                    input.setAttribute('aria-label', cfg.searchPlaceholder.replace(/\.+$/, '') || 'Search');
                    input.value = this.state.searchQuery;
                    this.searchInput = input;
                    toolbar.appendChild(input);
                } else {
                    toolbar.appendChild(el('span'));
                }
                const end = el('div', 'chilltable-toolbar-end');
                this.countEl = el('span', 'chilltable-count');
                this.countEl.setAttribute('role', 'status');
                this.countEl.setAttribute('aria-live', 'polite');
                end.appendChild(this.countEl);
                if (cfg.exportButton) {
                    const b = el('button', 'chilltable-export', 'Export CSV');
                    b.type = 'button';
                    end.appendChild(b);
                }
                toolbar.appendChild(end);
                root.appendChild(toolbar);
            }

            const scroll = el('div', 'chilltable-scroll');
            const table = el('table', 'chilltable' + (cfg.striped ? ' chilltable-striped' : ''));
            if (cfg.caption) {
                table.appendChild(el('caption', 'chilltable-caption' + (cfg.captionHidden ? ' chilltable-sr-only' : ''), cfg.caption));
            } else if (cfg.ariaLabel) {
                table.setAttribute('aria-label', cfg.ariaLabel);
            }
            this.thead = el('thead');
            this.tbody = el('tbody');
            table.appendChild(this.thead);
            table.appendChild(this.tbody);
            scroll.appendChild(table);
            root.appendChild(scroll);

            this.pager = el('nav', 'chilltable-pagination');
            this.pager.setAttribute('aria-label', 'Table pagination');
            root.appendChild(this.pager);

            this.container.appendChild(root);
            this.table = table;

            // Delegated listeners (one set, removed on destroy)
            this._listen(root, 'click', e => this._onClick(e));
            this._listen(root, 'change', e => this._onChange(e));
            this._listen(root, 'input', e => {
                if (e.target === this.searchInput) this.search(e.target.value);
            });
        }

        _onClick(e) {
            const t = e.target;
            if (!t || !t.closest) return;
            const exp = t.closest('.chilltable-export');
            if (exp && this.root.contains(exp)) { this.exportCSV({ download: true }); return; }

            const pbtn = t.closest('.chilltable-pagination-btn');
            if (pbtn && this.root.contains(pbtn)) {
                if (pbtn.disabled) return;
                const page = pbtn.dataset.page;
                if (page === 'prev') this.setPage(this.state.currentPage - 1);
                else if (page === 'next') this.setPage(this.state.currentPage + 1);
                else this.setPage(parseInt(page, 10));
                return;
            }

            const th = t.closest('th[data-key]');
            if (th && this.root.contains(th) && th.classList.contains('chilltable-sortable')) {
                const key = th.dataset.key;
                const dir = this.state.sortColumn === key && this.state.sortDirection === 'asc' ? 'desc' : 'asc';
                this.sortBy(key, dir);
            }
        }

        _onChange(e) {
            const t = e.target;
            if (!t || !t.classList) return;
            if (t.classList.contains('chilltable-select-all')) {
                const rows = this._pageRows();
                rows.forEach(r => { if (t.checked) this.selected.add(r); else this.selected.delete(r); });
                this._afterSelection();
            } else if (t.classList.contains('chilltable-select-row')) {
                const idx = parseInt(t.dataset.index, 10);
                const row = this.state.filteredData[idx];
                if (row === undefined) return;
                if (t.checked) this.selected.add(row); else this.selected.delete(row);
                this._afterSelection();
            }
        }

        _afterSelection() {
            this._syncSelectionUI();
            const rows = this.getSelected();
            if (typeof this.config.onSelect === 'function') this.config.onSelect(rows);
            this._emit('select', rows);
        }

        _syncSelectionUI() {
            if (!this.config.selectable || !this.tbody) return;
            this.tbody.querySelectorAll('tr[data-row-index]').forEach(tr => {
                const row = this.state.filteredData[parseInt(tr.dataset.rowIndex, 10)];
                const on = this.selected.has(row);
                tr.classList.toggle('chilltable-row-selected', on);
                const cb = tr.querySelector('.chilltable-select-row');
                if (cb) cb.checked = on;
            });
            const all = this.thead.querySelector('.chilltable-select-all');
            if (all) {
                const rows = this._pageRows();
                const n = rows.filter(r => this.selected.has(r)).length;
                all.checked = rows.length > 0 && n === rows.length;
                all.indeterminate = n > 0 && n < rows.length;
            }
        }

        _pageRows() {
            const { filteredData, currentPage } = this.state;
            const ps = this.config.pageSize;
            return filteredData.slice((currentPage - 1) * ps, currentPage * ps);
        }

        _totalPages() {
            return Math.max(1, Math.ceil(this.state.filteredData.length / this.config.pageSize));
        }

        _fillCell(td, col, row) {
            const value = row[col.key];
            if (typeof col.render === 'function') {
                const out = col.render(value, row);
                if (out && typeof out === 'object' && out.nodeType) td.appendChild(out);
                else if (col.html === true) td.innerHTML = isNil(out) ? '' : String(out);
                else td.textContent = isNil(out) ? '' : String(out);
            } else if (col.html === true) {
                td.innerHTML = isNil(value) ? '' : String(value);
            } else {
                td.textContent = isNil(value) ? '' : String(value);
            }
        }

        _isSortable(col) {
            return this.config.sortable && col.sortable !== false;
        }

        render() {
            if (this._destroyed || !this.root) return;
            const { columns, selectable } = this.config;
            const { filteredData } = this.state;
            const pageSize = this.config.pageSize;
            const totalPages = this._totalPages();
            if (this.state.currentPage > totalPages) this.state.currentPage = totalPages;
            if (this.state.currentPage < 1) this.state.currentPage = 1;
            const currentPage = this.state.currentPage;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, filteredData.length);

            // remember focus so re-render does not drop keyboard users
            const active = document.activeElement;
            let refocus = null;
            if (active && this.root.contains(active)) {
                if (active.classList.contains('chilltable-sort-btn')) refocus = { type: 'sort', key: active.closest('th').dataset.key };
                else if (active.classList.contains('chilltable-pagination-btn')) refocus = { type: 'page', page: active.dataset.page };
            }

            // header
            this.thead.textContent = '';
            const hr = el('tr');
            if (selectable) {
                const th = el('th', 'chilltable-select-cell');
                th.setAttribute('scope', 'col');
                const cb = el('input', 'chilltable-checkbox chilltable-select-all');
                cb.type = 'checkbox';
                cb.setAttribute('aria-label', 'Select all rows on this page');
                th.appendChild(cb);
                hr.appendChild(th);
            }
            columns.forEach(col => {
                const th = el('th');
                th.setAttribute('scope', 'col');
                th.dataset.key = col.key;
                if (col.align === 'right' || col.align === 'center') th.classList.add('chilltable-align-' + col.align);
                const label = isNil(col.label) ? col.key : col.label;
                if (this._isSortable(col)) {
                    th.classList.add('chilltable-sortable');
                    const sorted = this.state.sortColumn === col.key;
                    if (sorted) th.classList.add('sorted');
                    th.setAttribute('aria-sort', sorted ? (this.state.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
                    const btn = el('button', 'chilltable-sort-btn');
                    btn.type = 'button';
                    btn.appendChild(document.createTextNode(String(label)));
                    const icon = el('span', 'sort-icon', this.getSortIcon(col.key));
                    icon.setAttribute('aria-hidden', 'true');
                    btn.appendChild(icon);
                    th.appendChild(btn);
                } else {
                    th.textContent = String(label);
                }
                hr.appendChild(th);
            });
            this.thead.appendChild(hr);

            // body
            this.tbody.textContent = '';
            const pageData = filteredData.slice(startIndex, endIndex);
            if (pageData.length === 0) {
                const tr = el('tr', 'chilltable-empty-row');
                const td = el('td', 'chilltable-empty', this.config.emptyText);
                td.setAttribute('colspan', String(columns.length + (selectable ? 1 : 0)));
                tr.appendChild(td);
                this.tbody.appendChild(tr);
            } else {
                pageData.forEach((row, i) => {
                    const gi = startIndex + i;
                    const tr = el('tr');
                    tr.dataset.rowIndex = String(gi);
                    if (selectable) {
                        const td = el('td', 'chilltable-select-cell');
                        const cb = el('input', 'chilltable-checkbox chilltable-select-row');
                        cb.type = 'checkbox';
                        cb.dataset.index = String(gi);
                        cb.setAttribute('aria-label', 'Select row ' + (gi + 1));
                        td.appendChild(cb);
                        tr.appendChild(td);
                    }
                    columns.forEach(col => {
                        const td = el('td');
                        if (col.align === 'right' || col.align === 'center') td.classList.add('chilltable-align-' + col.align);
                        this._fillCell(td, col, row);
                        tr.appendChild(td);
                    });
                    this.tbody.appendChild(tr);
                });
            }

            // count (toolbar, live)
            if (this.countEl) {
                const n = filteredData.length;
                this.countEl.textContent = n + (n === 1 ? ' item' : ' items');
            }

            // pagination
            this.pager.textContent = '';
            if (totalPages > 1) {
                this.pager.hidden = false;
                this.pager.appendChild(el('span', 'chilltable-pagination-info',
                    'Showing ' + (startIndex + 1) + '-' + endIndex + ' of ' + filteredData.length));
                const controls = el('div', 'chilltable-pagination-controls');
                const mk = (label, page, disabled, active) => {
                    const b = el('button', 'chilltable-pagination-btn' + (active ? ' active' : ''), label);
                    b.type = 'button';
                    b.dataset.page = String(page);
                    if (disabled) b.disabled = true;
                    if (active) b.setAttribute('aria-current', 'page');
                    if (typeof page === 'number' || /^\d+$/.test(String(page))) b.setAttribute('aria-label', 'Page ' + page);
                    else b.setAttribute('aria-label', page === 'prev' ? 'Previous page' : 'Next page');
                    return b;
                };
                controls.appendChild(mk('Prev', 'prev', currentPage === 1, false));
                this._pageNumbers(totalPages).forEach(i => controls.appendChild(mk(String(i), i, false, i === currentPage)));
                controls.appendChild(mk('Next', 'next', currentPage === totalPages, false));
                this.pager.appendChild(controls);
            } else {
                this.pager.hidden = true;
            }

            this._syncSelectionUI();

            if (refocus) {
                let target = null;
                if (refocus.type === 'sort') {
                    const th = this.thead.querySelector('th[data-key="' + String(refocus.key).replace(/"/g, '\\"') + '"] .chilltable-sort-btn');
                    target = th;
                } else {
                    target = this.pager.querySelector('.chilltable-pagination-btn[data-page="' + refocus.page + '"]:not(:disabled)')
                        || this.pager.querySelector('.chilltable-pagination-btn.active');
                }
                if (target && target.focus) target.focus();
            }
        }

        getSortIcon(key) {
            if (this.state.sortColumn !== key) return '↕';
            return this.state.sortDirection === 'asc' ? '↑' : '↓';
        }

        _pageNumbers(totalPages) {
            const { currentPage } = this.state;
            const maxButtons = 5;
            let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let end = Math.min(totalPages, start + maxButtons - 1);
            if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
            const out = [];
            for (let i = start; i <= end; i++) out.push(i);
            return out;
        }

        // kept for backward compatibility (returned an HTML string before)
        getPaginationButtons(totalPages) {
            return this._pageNumbers(totalPages).map(i =>
                '<button class="chilltable-pagination-btn' + (i === this.state.currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>'
            ).join('');
        }

        // ---- data ops -------------------------------------------------------
        setPage(page) {
            const total = this._totalPages();
            const p = Math.min(total, Math.max(1, parseInt(page, 10) || 1));
            if (p === this.state.currentPage) { return this; }
            this.state.currentPage = p;
            this.render();
            if (typeof this.config.onPageChange === 'function') this.config.onPageChange(p);
            this._emit('page', p);
            return this;
        }

        search(query) {
            this.state.searchQuery = isNil(query) ? '' : String(query);
            if (this.searchInput && this.searchInput.value !== this.state.searchQuery) this.searchInput.value = this.state.searchQuery;
            this.state.currentPage = 1;
            this.filter();
            if (typeof this.config.onSearch === 'function') this.config.onSearch(this.state.searchQuery);
            this._emit('search', this.state.searchQuery);
            return this;
        }

        sortBy(key, direction) {
            this.state.sortColumn = key;
            this.state.sortDirection = direction === 'desc' ? 'desc' : 'asc';
            this.sort();
            if (typeof this.config.onSort === 'function') this.config.onSort(key, this.state.sortDirection);
            this._emit('sort', key, this.state.sortDirection);
            return this;
        }

        filter() {
            const query = this.state.searchQuery.toLowerCase();
            this.state.filteredData = !query ? [...this.state.data] : this.state.data.filter(row =>
                this.config.columns.some(col => {
                    const value = String(isNil(row[col.key]) ? '' : row[col.key]).toLowerCase();
                    return value.includes(query);
                })
            );
            this.sort();
        }

        sort() {
            const { sortColumn, sortDirection, filteredData } = this.state;

            if (sortColumn) {
                const col = this.config.columns.find(c => c.key === sortColumn) || {};
                const val = row => typeof col.sortValue === 'function' ? col.sortValue(row[sortColumn], row) : row[sortColumn];
                filteredData.sort((a, b) => {
                    const aVal = val(a);
                    const bVal = val(b);
                    if (aVal === bVal) return 0;
                    if (isNil(aVal)) return 1;
                    if (isNil(bVal)) return -1;
                    const c = compareValues(aVal, bVal);
                    return sortDirection === 'asc' ? c : -c;
                });
            }

            this.render();
        }

        setData(data) {
            this.state.data = [...(data || [])];
            // prune selection of rows that vanished
            const present = new Set(this.state.data);
            this.selected.forEach(r => { if (!present.has(r)) this.selected.delete(r); });
            this.state.filteredData = [...this.state.data];
            this.state.currentPage = 1;
            if (this.state.searchQuery) {
                this.filter();
            } else if (this.state.sortColumn) {
                this.sort();
            } else {
                this.render();
            }
        }

        refresh() {
            this.render();
        }

        // ---- selection ------------------------------------------------------
        getSelected() {
            return this.state.data.filter(r => this.selected.has(r));
        }

        selectAll() {
            this.state.filteredData.forEach(r => this.selected.add(r));
            this._afterSelection();
            return this;
        }

        clearSelection() {
            this.selected.clear();
            this._afterSelection();
            return this;
        }

        // ---- export ---------------------------------------------------------
        exportCSV(opts = {}) {
            const all = opts.all !== false;
            const rows = all ? this.state.filteredData : this._pageRows();
            const cols = this.config.columns;
            const lines = [cols.map(c => csvCell(isNil(c.label) ? c.key : String(c.label))).join(',')];
            rows.forEach(row => {
                lines.push(cols.map(c => {
                    const v = row[c.key];
                    return csvCell(typeof c.exportValue === 'function' ? c.exportValue(v, row) : v);
                }).join(','));
            });
            const csv = lines.join('\r\n');
            if (opts.download) {
                try {
                    const blob = new window.Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = opts.filename || this.config.exportFilename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => window.URL.revokeObjectURL(url), 0);
                } catch (e) { /* download unsupported in this environment */ }
            }
            return csv;
        }

        // ---- lifecycle ------------------------------------------------------
        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._listeners.forEach(off => off());
            this._listeners = [];
            if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
            this._handlers = {};
            this.selected.clear();
            this.root = this.thead = this.tbody = this.pager = this.countEl = this.searchInput = this.table = null;
        }
    }

    const ChillTable = {
        version: VERSION,

        create(container, config) {
            return new ChillTableInstance(container, config);
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTable;
    } else {
        window.ChillTable = ChillTable;
    }

})(typeof window !== 'undefined' ? window : this);
