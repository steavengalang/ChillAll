/**
 * ChillVirtualList - Zero-dependency virtualised list (100k+ items, only the visible window is in the DOM)
 *
 * @example
 *   const list = ChillVirtualList.create({
 *     items: Array.from({ length: 100000 }, (_, i) => ({ id: i, name: 'Row ' + i })),
 *     height: 400,                       // viewport height (px or CSS string)
 *     itemHeight: 36,                    // fixed ...   or  (item, index) => px   or  'auto' (measured)
 *     renderItem: (item, i) => item.name // string (text) | Node
 *   });
 *   document.body.appendChild(list.element);
 *   list.scrollToIndex(5000, 'center');
 *
 * Options
 *   items         Array                                                              default []
 *   renderItem    (item, index) => Node | string (strings are TEXT unless html:true)  default String(item)
 *   itemHeight    number (fixed) | function(item, index) => number | 'auto' (measure rows; `estimatedHeight` until measured)   default 40
 *   estimatedHeight  initial guess for 'auto' rows                                    default 40
 *   height        viewport height: number (px) or CSS length                          default 400
 *   overscan      extra rows rendered above and below the viewport                    default 5
 *   html          treat string results of renderItem as HTML (UNSAFE with untrusted data)   default false
 *   keyboard      Home/End/PageUp/PageDown scroll the focused list                    default true
 *   emptyText     text shown when there are no items                                  default ''
 *   ariaLabel     accessible name of the list                                         default 'List'
 *   onRangeChange (startIndex, endIndex) called whenever the rendered window changes
 *   onScroll      (scrollTop, event)
 *
 * Methods: setItems(items), append(items), getItems(), scrollToIndex(index, align = 'start'|'center'|'end'|'auto'),
 *          scrollToTop(), refresh(), updateItem(index), getRange() -> {start,end}, getRenderedCount(),
 *          on(evt, fn), off(evt, fn), destroy()
 * Events:  'range' (start, end), 'scroll' (scrollTop)
 * ARIA: viewport is focusable; content has role=list; rows have role=listitem with aria-posinset / aria-setsize.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillvirtuallist-styles';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillvirtuallist-bg: #ffffff;
        --chillvirtuallist-text: #171717;
        --chillvirtuallist-muted: #6b7280;
        --chillvirtuallist-border: #e5e5e5;
        --chillvirtuallist-hover: #f5f5f5;
        --chillvirtuallist-focus: #3b82f6;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillvirtuallist-bg: #171717;
          --chillvirtuallist-text: #fafafa;
          --chillvirtuallist-muted: #a3a3a3;
          --chillvirtuallist-border: #404040;
          --chillvirtuallist-hover: #262626;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillvirtuallist-bg: #171717;
        --chillvirtuallist-text: #fafafa;
        --chillvirtuallist-muted: #a3a3a3;
        --chillvirtuallist-border: #404040;
        --chillvirtuallist-hover: #262626;
      }

      .chillvirtuallist { position: relative; overflow-y: auto; overflow-x: hidden; background: var(--chillvirtuallist-bg); color: var(--chillvirtuallist-text); border: 1px solid var(--chillvirtuallist-border); border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
      .chillvirtuallist *, .chillvirtuallist *::before, .chillvirtuallist *::after { box-sizing: border-box; }
      .chillvirtuallist:focus-visible { outline: 2px solid var(--chillvirtuallist-focus); outline-offset: 2px; }
      .chillvirtuallist-content { position: relative; width: 100%; }
      .chillvirtuallist-item { position: absolute; left: 0; right: 0; display: flex; align-items: center; padding: 0 12px; overflow: hidden; border-bottom: 1px solid var(--chillvirtuallist-border); }
      .chillvirtuallist-item > * { min-width: 0; }
      .chillvirtuallist-item:hover { background: var(--chillvirtuallist-hover); }
      .chillvirtuallist-auto .chillvirtuallist-item { overflow: visible; padding-top: 8px; padding-bottom: 8px; }
      .chillvirtuallist-empty { padding: 24px; text-align: center; color: var(--chillvirtuallist-muted); }
      .chillvirtuallist-empty[hidden] { display: none; }
      @media (prefers-reduced-motion: reduce) { .chillvirtuallist { scroll-behavior: auto; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    class ChillVirtualListInstance {
        constructor(options, host) {
            injectCSS();
            const o = this.options = Object.assign({
                items: [], renderItem: null, itemHeight: 40, estimatedHeight: 40, height: 400, overscan: 5, html: false,
                keyboard: true, emptyText: '', ariaLabel: 'List', onRangeChange: null, onScroll: null
            }, options || {});
            this._id = ++uid;
            this._handlers = {};
            this._destroyed = false;
            this._rows = new Map();
            this._range = { start: 0, end: -1 };
            this._cleanups = [];
            this.items = [];
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this._prevStyleHeight = host ? host.style.height : '';
            this._build();
            this.setItems(o.items);
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...a) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, a)); }

        _build() {
            const o = this.options, root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            this._auto = o.itemHeight === 'auto';
            root.className = (this._prevClass + ' chillvirtuallist' + (this._auto ? ' chillvirtuallist-auto' : '')).trim();
            root.style.height = typeof o.height === 'number' ? o.height + 'px' : String(o.height);
            if (!root.hasAttribute('tabindex')) { root.tabIndex = 0; this._setTab = true; }
            this._content = document.createElement('div');
            this._content.className = 'chillvirtuallist-content';
            this._content.setAttribute('role', 'list');
            this._content.setAttribute('aria-label', o.ariaLabel);
            this._empty = document.createElement('div');
            this._empty.className = 'chillvirtuallist-empty';
            this._empty.textContent = o.emptyText;
            this._empty.hidden = true;
            root.appendChild(this._content);
            root.appendChild(this._empty);

            this._onScroll = (e) => {
                this._render();
                if (typeof o.onScroll === 'function') o.onScroll(this._scrollTop(), e);
                this._emit('scroll', this._scrollTop());
            };
            root.addEventListener('scroll', this._onScroll, { passive: true });
            this._cleanups.push(() => root.removeEventListener('scroll', this._onScroll));

            if (o.keyboard) {
                this._onKey = (e) => {
                    if (e.target !== root || e.altKey || e.ctrlKey || e.metaKey) return;
                    const page = Math.max(this._viewportH() - (this._fixedH || 40), this._viewportH() * 0.8);
                    let t = null;
                    if (e.key === 'PageDown') t = this._scrollTop() + page;
                    else if (e.key === 'PageUp') t = this._scrollTop() - page;
                    else if (e.key === 'Home') t = 0;
                    else if (e.key === 'End') t = this._total();
                    if (t === null) return;
                    e.preventDefault();
                    this._setScrollTop(t);
                };
                root.addEventListener('keydown', this._onKey);
                this._cleanups.push(() => root.removeEventListener('keydown', this._onKey));
            }
            if (typeof window.ResizeObserver === 'function') {
                this._ro = new window.ResizeObserver(() => this._render());
                this._ro.observe(root);
            }
        }

        /* ---------- geometry ---------- */
        _viewportH() {
            const ch = this.element.clientHeight;
            if (ch > 0) return ch;
            const h = this.options.height;
            return typeof h === 'number' ? h : (parseFloat(h) || 400);
        }
        _scrollTop() { return Math.max(0, this.element.scrollTop || 0); }
        _setScrollTop(v) {
            const max = Math.max(0, this._total() - this._viewportH());
            this.element.scrollTop = Math.max(0, Math.min(v, max));
            this._render();
        }
        _total() { return this._offsets[this._offsets.length - 1] || 0; }

        _heightOf(i) {
            const h = this.options.itemHeight;
            if (typeof h === 'number') return h;
            if (typeof h === 'function') { const v = Number(h(this.items[i], i)); return v > 0 ? v : this.options.estimatedHeight; }
            return this._measured[i] || this.options.estimatedHeight;
        }

        _rebuildOffsets(from) {
            const n = this.items.length;
            const o = this._offsets;
            if (!o || from == null) { this._offsets = new Array(n + 1); this._offsets[0] = 0; from = 0; }
            this._offsets.length = n + 1;
            for (let i = from; i < n; i++) this._offsets[i + 1] = this._offsets[i] + this._heightOf(i);
        }

        /** index of the row containing pixel offset y */
        _indexAt(y) {
            const o = this._offsets;
            let lo = 0, hi = this.items.length - 1;
            if (hi < 0) return 0;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (o[mid] <= y) lo = mid; else hi = mid - 1;
            }
            return lo;
        }

        /* ---------- data ---------- */
        setItems(items) {
            this.items = Array.isArray(items) ? items : [];
            this._fixedH = typeof this.options.itemHeight === 'number' ? this.options.itemHeight : null;
            this._measured = [];
            this._clearRows();
            this._rebuildOffsets();
            this._empty.hidden = this.items.length > 0 || !this.options.emptyText;
            this._content.style.height = this._total() + 'px';
            this._render(true);
            return this;
        }

        append(items) {
            if (!items || !items.length) return this;
            const from = this.items.length;
            this.items = this.items.concat(items);
            this._rebuildOffsets(from);
            this._empty.hidden = true;
            this._content.style.height = this._total() + 'px';
            this._render();
            return this;
        }

        getItems() { return this.items; }

        _clearRows() {
            this._rows.forEach(r => r.parentNode && r.parentNode.removeChild(r));
            this._rows.clear();
            this._range = { start: 0, end: -1 };
        }

        refresh() { this._measured = []; this._clearRows(); this._rebuildOffsets(); this._content.style.height = this._total() + 'px'; this._render(true); return this; }

        updateItem(index) {
            const row = this._rows.get(index);
            if (!row) return this;
            this._rows.delete(index);
            row.parentNode && row.parentNode.removeChild(row);
            this._render(true);
            return this;
        }

        /* ---------- rendering ---------- */
        _compute() {
            const n = this.items.length;
            if (!n) return { start: 0, end: -1 };
            const st = this._scrollTop();
            const vh = this._viewportH();
            const ov = Math.max(0, this.options.overscan | 0);
            const first = this._indexAt(st);
            let last = this._indexAt(st + vh);
            return { start: Math.max(0, first - ov), end: Math.min(n - 1, last + ov) };
        }

        _makeRow(i) {
            const o = this.options;
            const row = document.createElement('div');
            row.className = 'chillvirtuallist-item';
            row.setAttribute('role', 'listitem');
            row.setAttribute('aria-posinset', String(i + 1));
            row.setAttribute('aria-setsize', String(this.items.length));
            row.setAttribute('data-index', String(i));
            if (!this._auto) row.style.height = this._heightOf(i) + 'px';
            let content;
            try { content = typeof o.renderItem === 'function' ? o.renderItem(this.items[i], i) : String(this.items[i]); } catch (e) { content = ''; }
            if (content && typeof content === 'object' && content.nodeType) row.appendChild(content);
            else if (o.html) row.innerHTML = content == null ? '' : String(content);
            else row.textContent = content == null ? '' : String(content);
            return row;
        }

        _render(force) {
            if (this._destroyed) return;
            const r = this._compute();
            if (!force && r.start === this._range.start && r.end === this._range.end) { this._measure(); return; }
            // drop rows out of range
            this._rows.forEach((row, i) => {
                if (i < r.start || i > r.end) { if (row.parentNode) row.parentNode.removeChild(row); this._rows.delete(i); }
            });
            const frag = document.createDocumentFragment();
            const added = [];
            for (let i = r.start; i <= r.end; i++) {
                if (this._rows.has(i)) continue;
                const row = this._makeRow(i);
                row.style.top = this._offsets[i] + 'px';
                this._rows.set(i, row);
                added.push(i);
                frag.appendChild(row);
            }
            if (added.length) this._insertOrdered(frag, added);
            const changed = r.start !== this._range.start || r.end !== this._range.end;
            this._range = r;
            this._measure();
            if (changed) {
                if (typeof this.options.onRangeChange === 'function') this.options.onRangeChange(r.start, r.end);
                this._emit('range', r.start, r.end);
            }
        }

        _insertOrdered(frag, added) {
            // keep DOM order == index order (screen readers / tab order)
            const c = this._content;
            const idx = n => Number(n.getAttribute('data-index'));
            const first = c.firstElementChild, last = c.lastElementChild;
            if (!first || added[0] > idx(last)) { c.appendChild(frag); return; }
            if (added[added.length - 1] < idx(first)) { c.insertBefore(frag, first); return; }
            c.appendChild(frag);
            Array.prototype.slice.call(c.children).sort((x, y) => idx(x) - idx(y)).forEach(r => c.appendChild(r));
        }

        _measure() {
            if (!this._auto) return;
            let minChanged = Infinity;
            this._rows.forEach((row, i) => {
                const h = row.offsetHeight;
                if (h > 0 && this._measured[i] !== h) { this._measured[i] = h; if (i < minChanged) minChanged = i; }
            });
            if (minChanged !== Infinity) {
                this._rebuildOffsets(minChanged);
                this._content.style.height = this._total() + 'px';
                this._rows.forEach((row, i) => { row.style.top = this._offsets[i] + 'px'; });
            }
        }

        scrollToIndex(index, align) {
            const n = this.items.length;
            if (!n) return this;
            index = Math.max(0, Math.min(n - 1, Math.floor(index)));
            const top = this._offsets[index];
            const h = this._offsets[index + 1] - top;
            const vh = this._viewportH();
            const st = this._scrollTop();
            let target;
            switch (align || 'start') {
                case 'center': target = top - (vh - h) / 2; break;
                case 'end': target = top + h - vh; break;
                case 'auto':
                    if (top < st) target = top;
                    else if (top + h > st + vh) target = top + h - vh;
                    else target = st;
                    break;
                default: target = top;
            }
            this._setScrollTop(target);
            return this;
        }

        scrollToTop() { this._setScrollTop(0); return this; }
        getRange() { return { start: this._range.start, end: this._range.end }; }
        getRenderedCount() { return this._rows.size; }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            if (this._ro) { this._ro.disconnect(); this._ro = null; }
            this._rows.clear();
            this._handlers = {};
            const root = this.element;
            if (this._ownsElement) { if (root.parentNode) root.parentNode.removeChild(root); return; }
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = this._prevClass;
            root.style.height = this._prevStyleHeight;
            if (this._setTab) root.removeAttribute('tabindex');
        }
    }

    const ChillVirtualList = {
        version: VERSION,
        create(options) { return new ChillVirtualListInstance(options); },
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            return new ChillVirtualListInstance(options, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillVirtualList;
    } else {
        window.ChillVirtualList = ChillVirtualList;
    }

})(typeof window !== 'undefined' ? window : this);
