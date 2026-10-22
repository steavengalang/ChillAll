/**
 * ChillMasonry - Responsive masonry / grid layout
 *
 * @example
 *   <div id="grid"><div class="card">...</div><div class="card">...</div></div>
 *   const m = ChillMasonry.init('#grid', { columns: { 0: 1, 560: 2, 900: 3, 1200: 4 }, gap: 16 });
 *   m.append(newEl);  m.prepend(otherEl);  m.remove(el);  m.layout();  m.destroy();
 *
 * Items are absolutely positioned (translate) into the shortest column, in DOM order, so reading / tab order stays logical.
 * The layout re-runs automatically when the container width changes, when an item's size changes (ResizeObserver) and when
 * images inside items finish loading. Falls back to window "resize" when ResizeObserver is missing.
 *
 * Options:
 *   columns       number | {minWidth: cols} | 'auto'   'auto'    object keys are minimum CONTAINER widths in px
 *   columnWidth   number (px)                          240       target width used when columns is 'auto'
 *   maxColumns    number                               12
 *   gap           number | [rowGap, colGap]            16        px
 *   itemSelector  string                               null      default: all element children
 *   animate       boolean                              true      transition item movement (disabled for reduced motion)
 *   observeImages boolean                              true      relayout when <img> inside items load
 *   onLayout(info, instance)   info = { columns, width, height, count }
 *
 * Instance: layout(), append(elOrArray), prepend(elOrArray), remove(el), getColumns(), getItems(), setOptions(partial), destroy().
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillmasonry_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillmasonry-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillmasonry-styles';
        style.textContent = `
      .chillmasonry { position: relative; width: 100%; box-sizing: border-box; }
      .chillmasonry-item { position: absolute; top: 0; left: 0; box-sizing: border-box; will-change: transform; }
      .chillmasonry-animate .chillmasonry-item { transition: transform 0.25s ease; }
      .chillmasonry-ready { }
      @media (prefers-reduced-motion: reduce) { .chillmasonry-animate .chillmasonry-item { transition: none; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    function schedule(fn) {
        if (typeof window.requestAnimationFrame === 'function') return { raf: window.requestAnimationFrame(fn) };
        return { t: setTimeout(fn, 16) };
    }
    function unschedule(h) {
        if (!h) return;
        if (h.raf !== undefined && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(h.raf);
        if (h.t !== undefined) clearTimeout(h.t);
    }

    function heightOf(el) {
        let h = 0;
        try { h = el.getBoundingClientRect().height; } catch (e) { /* ignore */ }
        return h || el.offsetHeight || 0;
    }

    class ChillMasonryInstance {
        constructor(container, options) {
            if (typeof container === 'string') container = document.querySelector(container);
            if (!container) throw new Error('ChillMasonry: container not found');
            options = options || {};
            this.container = container;
            this.o = {
                columns: options.columns !== undefined ? options.columns : 'auto',
                columnWidth: options.columnWidth > 0 ? Number(options.columnWidth) : 240,
                maxColumns: options.maxColumns > 0 ? Number(options.maxColumns) : 12,
                gap: options.gap !== undefined ? options.gap : 16,
                itemSelector: options.itemSelector || null,
                animate: options.animate !== false,
                observeImages: options.observeImages !== false,
                onLayout: options.onLayout || null
            };
            this._saved = { cls: container.getAttribute('class'), style: container.getAttribute('style') };
            this._items = new Map(); // el -> {style}
            this._destroyed = false;
            this._pending = null;
            this._lastWidth = -1;
            this._columns = 1;
            injectCSS();
            container.classList.add('chillmasonry');
            if (this.o.animate) container.classList.add('chillmasonry-animate');
            this._collect();
            const self = this;
            this._imgListener = function () { self._schedule(); };
            if (typeof window.ResizeObserver === 'function') {
                this._ro = new window.ResizeObserver(function (entries) {
                    let needs = false;
                    for (let i = 0; i < entries.length; i++) {
                        if (entries[i].target === self.container) {
                            const w = entries[i].contentRect ? entries[i].contentRect.width : self._width();
                            if (Math.round(w) !== Math.round(self._lastWidth)) needs = true;
                        } else needs = true;
                    }
                    if (needs) self._schedule();
                });
                this._ro.observe(container);
                this._items.forEach(function (_, el) { self._ro.observe(el); });
            } else {
                this._onWinResize = function () { self._schedule(); };
                window.addEventListener('resize', this._onWinResize);
            }
            this.layout();
        }

        _childItems() {
            const c = this.container;
            return this.o.itemSelector ? Array.prototype.slice.call(c.querySelectorAll(this.o.itemSelector))
                : Array.prototype.filter.call(c.children, function (n) { return n.nodeType === 1; });
        }

        _collect() {
            const self = this;
            this._childItems().forEach(function (el) { self._register(el); });
        }

        _register(el) {
            if (this._items.has(el)) return;
            this._items.set(el, { style: el.getAttribute('style'), cls: el.getAttribute('class') });
            el.classList.add('chillmasonry-item');
            if (this._ro) this._ro.observe(el);
            if (this.o.observeImages) {
                const imgs = el.querySelectorAll ? el.querySelectorAll('img') : [];
                for (let i = 0; i < imgs.length; i++) {
                    if (!imgs[i].complete) {
                        imgs[i].addEventListener('load', this._imgListener);
                        imgs[i].addEventListener('error', this._imgListener);
                    }
                }
            }
        }

        _unregister(el, restore) {
            const rec = this._items.get(el);
            if (!rec) return;
            if (this._ro) this._ro.unobserve(el);
            const imgs = el.querySelectorAll ? el.querySelectorAll('img') : [];
            for (let i = 0; i < imgs.length; i++) {
                imgs[i].removeEventListener('load', this._imgListener);
                imgs[i].removeEventListener('error', this._imgListener);
            }
            this._items.delete(el);
            if (restore) {
                if (rec.cls === null) el.removeAttribute('class'); else el.setAttribute('class', rec.cls);
                if (rec.style === null) el.removeAttribute('style'); else el.setAttribute('style', rec.style);
            }
        }

        _gaps() {
            const g = this.o.gap;
            return Array.isArray(g) ? [Number(g[0]) || 0, Number(g[1] != null ? g[1] : g[0]) || 0] : [Number(g) || 0, Number(g) || 0];
        }

        _width() {
            let w = 0;
            try { w = this.container.getBoundingClientRect().width; } catch (e) { /* ignore */ }
            return w || this.container.clientWidth || 0;
        }

        _schedule() {
            if (this._destroyed || this._pending) return;
            const self = this;
            this._pending = schedule(function () { self._pending = null; self.layout(); });
        }

        _columnsFor(width) {
            const gapX = this._gaps()[1];
            const cols = this.o.columns;
            let n;
            if (typeof cols === 'number') n = cols;
            else if (cols && typeof cols === 'object') {
                n = 1;
                Object.keys(cols).map(Number).sort(function (a, b) { return a - b; }).forEach(function (bp) { if (width >= bp) n = cols[bp]; });
            } else n = Math.floor((width + gapX) / (this.o.columnWidth + gapX));
            return Math.max(1, Math.min(this.o.maxColumns, Math.floor(n) || 1));
        }

        /** Re-measure and reposition every item. */
        layout() {
            if (this._destroyed) return this;
            // pick up items added to the DOM directly
            const live = this._childItems();
            const self = this;
            live.forEach(function (el) { self._register(el); });
            Array.from(this._items.keys()).forEach(function (el) { if (el.parentNode !== self.container && !self.container.contains(el)) self._unregister(el, false); });

            const width = this._width();
            this._lastWidth = width;
            const cols = this._columnsFor(width);
            this._columns = cols;
            const gaps = this._gaps(), rowGap = gaps[0], colGap = gaps[1];
            const colW = Math.max(0, (width - colGap * (cols - 1)) / cols);
            const items = live;
            // 1. set widths so heights reflow correctly
            items.forEach(function (el) { el.style.width = colW + 'px'; });
            // 2. read heights (single reflow)
            const heights = items.map(heightOf);
            // 3. place
            const colH = new Array(cols).fill(0);
            items.forEach(function (el, i) {
                let c = 0;
                for (let k = 1; k < cols; k++) if (colH[k] < colH[c] - 0.5) c = k;
                const x = c * (colW + colGap), y = colH[c];
                el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
                el.setAttribute('data-chillmasonry-col', String(c));
                colH[c] = y + heights[i] + rowGap;
            });
            const total = items.length ? Math.max.apply(null, colH) - rowGap : 0;
            this.container.style.height = Math.max(0, total) + 'px';
            this.container.classList.add('chillmasonry-ready');
            if (this.o.onLayout) {
                try { this.o.onLayout({ columns: cols, width: width, height: total, count: items.length }, this); } catch (e) { /* ignore */ }
            }
            return this;
        }

        _toEls(x) {
            const arr = x && x.nodeType ? [x] : Array.prototype.slice.call(x || []);
            return arr.filter(function (n) { return n && n.nodeType === 1; });
        }

        append(elements) {
            const els = this._toEls(elements), self = this;
            els.forEach(function (el) { if (el.parentNode !== self.container) self.container.appendChild(el); self._register(el); });
            return this.layout();
        }

        prepend(elements) {
            const els = this._toEls(elements), self = this;
            const first = this.container.firstChild;
            els.forEach(function (el) { self.container.insertBefore(el, first); self._register(el); });
            return this.layout();
        }

        /** Remove an item from the layout AND the DOM. */
        remove(element) {
            this._toEls(element).forEach(function (el) {
                this._unregister(el, true);
                if (el.parentNode) el.parentNode.removeChild(el);
            }, this);
            return this.layout();
        }

        getColumns() { return this._columns; }
        getItems() { return this._childItems(); }

        setOptions(partial) {
            Object.assign(this.o, partial || {});
            this.container.classList.toggle('chillmasonry-animate', this.o.animate !== false);
            return this.layout();
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            unschedule(this._pending); this._pending = null;
            if (this._ro) { this._ro.disconnect(); this._ro = null; }
            if (this._onWinResize) window.removeEventListener('resize', this._onWinResize);
            Array.from(this._items.keys()).forEach(function (el) {
                this._unregister(el, true);
                el.removeAttribute('data-chillmasonry-col');
            }, this);
            const s = this._saved, c = this.container;
            if (s.cls === null) c.removeAttribute('class'); else c.setAttribute('class', s.cls);
            if (s.style === null) c.removeAttribute('style'); else c.setAttribute('style', s.style);
        }
    }

    const ChillMasonry = {
        version: VERSION,
        Masonry: ChillMasonryInstance,
        init(container, options) { return new ChillMasonryInstance(container, options); },
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillMasonry; }
    else { window.ChillMasonry = ChillMasonry; }
})(typeof window !== 'undefined' ? window : this);
