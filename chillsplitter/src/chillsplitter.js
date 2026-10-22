/**
 * ChillSplitter - Resizable split panes with accessible, keyboard-resizable separators
 *
 * @example
 *   <div id="split" style="height:400px">
 *     <div>Left</div><div>Right</div>
 *   </div>
 *   const s = ChillSplitter.init('#split', { direction: 'horizontal', sizes: [30, 70], minSize: 120, collapsible: [0],
 *                                            storageKey: 'layout', onResize: sizes => {} });
 *   s.collapse(0); s.setSizes([50, 50]); s.destroy();
 *
 * Panes are the direct element children of the container. Separators (role="separator", tabindex 0) are inserted between
 * them. Keyboard (separator focused): Arrow keys along the split axis resize by `step` px (Shift = 10x), Home / End move to
 * the min / max, Enter (or double-click) toggles collapse for collapsible panes (or resets sizes otherwise).
 *
 * Options:
 *   direction    'horizontal' | 'vertical'  'horizontal'  horizontal = panes side by side, vertical = stacked
 *   sizes        number[] (percent)         equal split    must have one entry per pane (normalised to 100)
 *   minSize      number | number[] (px)     50
 *   maxSize      number | number[] (px)     Infinity
 *   gutterSize   number (px)                8
 *   step         number (px)                10            keyboard step
 *   collapsible  boolean | number[]         false         true = every pane; array = pane indexes allowed to collapse
 *   collapsedSize number (px)               0
 *   storageKey   string                     null          persist sizes in localStorage (safe when blocked)
 *   ariaLabel    string                     'Resize panels'
 *   onResize(sizes, instance), onCollapse(index, collapsed, instance), onDragStart(instance), onDragEnd(sizes, instance)
 *
 * Instance: getSizes() (percent), setSizes(arr), collapse(i), expand(i), toggle(i), isCollapsed(i), reset(), refresh(),
 *   on(event, fn) -> off  (events: resize, collapse, dragstart, dragend), destroy() (restores the original DOM).
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillsplitter_css_injected__';
    let uidCounter = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillsplitter-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillsplitter-styles';
        style.textContent = `
      :root {
        --chillsplitter-gutter: #e5e5e5;
        --chillsplitter-gutter-hover: #3b82f6;
        --chillsplitter-handle: #a3a3a3;
        --chillsplitter-ring: rgba(59, 130, 246, 0.45);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillsplitter-gutter: #333333; --chillsplitter-handle: #737373;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillsplitter-gutter: #333333; --chillsplitter-handle: #737373;
      }
      .chillsplitter { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; box-sizing: border-box; }
      .chillsplitter-horizontal { flex-direction: row; }
      .chillsplitter-vertical { flex-direction: column; }
      .chillsplitter-pane { overflow: auto; min-width: 0; min-height: 0; box-sizing: border-box; }
      .chillsplitter-pane-collapsed { overflow: hidden; visibility: hidden; }
      .chillsplitter-animate .chillsplitter-pane { transition: flex-basis 0.18s ease; }
      .chillsplitter-dragging, .chillsplitter-dragging * { user-select: none !important; }
      .chillsplitter-dragging .chillsplitter-pane { transition: none; }
      .chillsplitter-separator {
        position: relative; flex: 0 0 auto; background: var(--chillsplitter-gutter);
        touch-action: none; outline: none; transition: background 0.15s ease;
      }
      .chillsplitter-horizontal > .chillsplitter-separator { cursor: col-resize; }
      .chillsplitter-vertical > .chillsplitter-separator { cursor: row-resize; }
      .chillsplitter-separator::before {
        content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        border-radius: 2px; background: var(--chillsplitter-handle); opacity: 0.7;
      }
      .chillsplitter-horizontal > .chillsplitter-separator::before { width: 2px; height: 28px; }
      .chillsplitter-vertical > .chillsplitter-separator::before { width: 28px; height: 2px; }
      /* larger hit area without changing layout */
      .chillsplitter-separator::after { content: ""; position: absolute; inset: 0; }
      .chillsplitter-horizontal > .chillsplitter-separator::after { left: -4px; right: -4px; }
      .chillsplitter-vertical > .chillsplitter-separator::after { top: -4px; bottom: -4px; }
      .chillsplitter-separator:hover, .chillsplitter-separator.chillsplitter-active { background: var(--chillsplitter-gutter-hover); }
      .chillsplitter-separator:hover::before, .chillsplitter-separator.chillsplitter-active::before { background: #fff; opacity: 1; }
      .chillsplitter-separator:focus-visible { box-shadow: 0 0 0 3px var(--chillsplitter-ring); z-index: 1; background: var(--chillsplitter-gutter-hover); }
      @media (prefers-reduced-motion: reduce) {
        .chillsplitter-separator, .chillsplitter-animate .chillsplitter-pane { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    function toArr(v, n, dflt) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const x = Array.isArray(v) ? v[i] : v;
            out.push(x === undefined || x === null || isNaN(x) ? dflt : Number(x));
        }
        return out;
    }

    function readStore(key) {
        try { const raw = window.localStorage.getItem('chillsplitter:' + key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }
    function writeStore(key, value) {
        try { window.localStorage.setItem('chillsplitter:' + key, JSON.stringify(value)); } catch (e) { /* blocked */ }
    }

    class ChillSplitterInstance {
        constructor(container, options) {
            options = options || {};
            if (typeof container === 'string') container = document.querySelector(container);
            if (!container) throw new Error('ChillSplitter: container not found');
            this.container = container;
            this.panes = Array.prototype.filter.call(container.children, function (c) { return c.nodeType === 1; });
            if (this.panes.length < 2) throw new Error('ChillSplitter: need at least two panes');
            const n = this.panes.length;
            this.n = n;
            this.o = {
                direction: options.direction === 'vertical' ? 'vertical' : 'horizontal',
                minSize: toArr(options.minSize, n, 50),
                maxSize: toArr(options.maxSize, n, Infinity),
                gutterSize: options.gutterSize != null ? Math.max(1, Number(options.gutterSize)) : 8,
                step: options.step != null ? Math.max(1, Number(options.step)) : 10,
                collapsedSize: options.collapsedSize != null ? Math.max(0, Number(options.collapsedSize)) : 0,
                storageKey: options.storageKey || null,
                ariaLabel: options.ariaLabel || 'Resize panels',
                animate: options.animate !== false
            };
            const col = options.collapsible;
            this.collapsible = [];
            for (let i = 0; i < n; i++) this.collapsible.push(col === true || (Array.isArray(col) && col.indexOf(i) > -1));
            this.cb = {
                resize: options.onResize, collapse: options.onCollapse, dragstart: options.onDragStart, dragend: options.onDragEnd
            };
            this._handlers = { resize: [], collapse: [], dragstart: [], dragend: [] };
            this._collapsed = new Array(n).fill(false);
            this._restore = new Array(n).fill(null);
            this._drag = null;
            this._destroyed = false;
            this._saved = null;

            let sizes = null;
            if (this.o.storageKey) {
                const stored = readStore(this.o.storageKey);
                if (Array.isArray(stored) && stored.length === n && stored.every(function (x) { return typeof x === 'number' && x >= 0; })) sizes = stored;
            }
            if (!sizes) sizes = Array.isArray(options.sizes) && options.sizes.length === n ? options.sizes.slice() : new Array(n).fill(100 / n);
            this.sizes = this._normalise(sizes);
            this._initial = this.sizes.slice();

            injectCSS();
            this._build();
            this._apply();
        }

        // ---------- DOM ----------
        _build() {
            const c = this.container, o = this.o;
            this._saved = {
                cls: c.getAttribute('class'),
                panes: this.panes.map(function (p) { return { cls: p.getAttribute('class'), style: p.getAttribute('style'), id: p.getAttribute('id') }; })
            };
            c.classList.add('chillsplitter', 'chillsplitter-' + o.direction);
            if (o.animate) c.classList.add('chillsplitter-animate');
            this.separators = [];
            const self = this;
            this.panes.forEach(function (p, i) {
                p.classList.add('chillsplitter-pane');
                if (!p.id) p.id = 'chillsplitter-pane-' + (++uidCounter);
                if (i < self.n - 1) {
                    const sep = document.createElement('div');
                    sep.className = 'chillsplitter-separator';
                    sep.setAttribute('role', 'separator');
                    sep.setAttribute('tabindex', '0');
                    // a horizontal split (side by side) has a *vertical* separator line
                    sep.setAttribute('aria-orientation', o.direction === 'horizontal' ? 'vertical' : 'horizontal');
                    sep.setAttribute('aria-controls', p.id);
                    sep.setAttribute('aria-label', o.ariaLabel);
                    sep.style.flexBasis = o.gutterSize + 'px';
                    sep._chillIndex = i;
                    sep.addEventListener('pointerdown', self._onPointerDown = self._onPointerDown || self._pointerDownHandler());
                    sep.addEventListener('keydown', self._onKeyDown = self._onKeyDown || self._keyDownHandler());
                    sep.addEventListener('dblclick', self._onDblClick = self._onDblClick || self._dblClickHandler());
                    p.parentNode.insertBefore(sep, p.nextSibling);
                    self.separators.push(sep);
                }
            });
            this._onResizeWin = function () { self.refresh(); };
            if (typeof window.addEventListener === 'function') window.addEventListener('resize', this._onResizeWin);
        }

        _horizontal() { return this.o.direction === 'horizontal'; }

        _total() {
            let r;
            try { r = this.container.getBoundingClientRect(); } catch (e) { r = null; }
            let size = r ? (this._horizontal() ? r.width : r.height) : 0;
            if (!size) size = this._horizontal() ? this.container.clientWidth : this.container.clientHeight;
            return Math.max(0, (size || 0) - this.o.gutterSize * (this.n - 1));
        }

        _apply() {
            const g = this.o.gutterSize, n = this.n;
            const self = this;
            this.panes.forEach(function (p, i) {
                const pct = self.sizes[i];
                const gutterShare = (g * (n - 1) * pct / 100);
                p.style.flex = '0 0 calc(' + pct.toFixed(4) + '% - ' + gutterShare.toFixed(3) + 'px)';
                p.classList.toggle('chillsplitter-pane-collapsed', self._collapsed[i]);
                if (self._collapsed[i]) p.setAttribute('aria-hidden', 'true'); else p.removeAttribute('aria-hidden');
            });
            this._aria();
        }

        _limits(i) {
            // returns {min,max} in percent for pane i
            const total = this._total();
            if (!total) return { min: 0, max: 100 };
            const minPx = this._collapsed[i] ? this.o.collapsedSize : this.o.minSize[i];
            const maxPx = this._collapsed[i] ? this.o.collapsedSize : this.o.maxSize[i];
            return { min: Math.min(100, minPx / total * 100), max: Math.min(100, maxPx / total * 100) };
        }

        _aria() {
            const self = this;
            this.separators.forEach(function (sep, i) {
                const lim = self._limits(i);
                // value = size of the pane before the separator, bounded by what it can reach given its neighbour's limits
                const nb = self._limits(i + 1);
                const pairTotal = self.sizes[i] + self.sizes[i + 1];
                const lo = Math.max(lim.min, pairTotal - nb.max);
                const hi = Math.min(lim.max, pairTotal - nb.min);
                sep.setAttribute('aria-valuenow', String(Math.round(self.sizes[i])));
                sep.setAttribute('aria-valuemin', String(Math.round(Math.max(0, lo))));
                sep.setAttribute('aria-valuemax', String(Math.round(Math.min(100, Math.max(hi, lo)))));
                const canCollapse = self.collapsible[i] || self.collapsible[i + 1];
                if (canCollapse) sep.setAttribute('aria-expanded', self._collapsed[i] || self._collapsed[i + 1] ? 'false' : 'true');
                else sep.removeAttribute('aria-expanded');
            });
        }

        _normalise(arr) {
            let sum = 0;
            for (let i = 0; i < arr.length; i++) sum += Math.max(0, arr[i]);
            if (!sum) return new Array(arr.length).fill(100 / arr.length);
            return arr.map(function (x) { return Math.max(0, x) / sum * 100; });
        }

        // ---------- sizing logic ----------
        /** Move the boundary after pane i by deltaPct percent, honouring limits. Returns true if sizes changed. */
        _move(i, deltaPct, base) {
            const s = (base || this.sizes).slice();
            const a = this._limits(i), b = this._limits(i + 1);
            let d = deltaPct;
            // pane i: s[i] + d within [a.min, a.max]; pane i+1: s[i+1] - d within [b.min, b.max]
            d = Math.max(d, a.min - s[i], s[i + 1] - b.max);
            d = Math.min(d, a.max - s[i], s[i + 1] - b.min);
            if (!isFinite(d)) d = 0;
            if (Math.abs(d) < 1e-9 && !base) return false;
            s[i] += d; s[i + 1] -= d;
            const changed = Math.abs(s[i] - this.sizes[i]) > 1e-6;
            this.sizes = s;
            return changed;
        }

        _changed() {
            this._apply();
            if (this.o.storageKey) writeStore(this.o.storageKey, this.sizes);
            this._fire('resize', this.getSizes(), this);
        }

        _fire(type, a, b, c) {
            const handlers = this._handlers[type].slice();
            if (this.cb[type]) handlers.unshift(this.cb[type]);
            handlers.forEach(function (fn) { try { fn(a, b, c); } catch (e) { if (typeof console !== 'undefined') console.error('ChillSplitter handler error', e); } });
        }

        // ---------- events ----------
        _pointerDownHandler() {
            const self = this;
            return function (e) {
                if (e.button != null && e.button !== 0) return;
                const sep = e.currentTarget;
                self._startDrag(sep._chillIndex, sep, e);
            };
        }

        _startDrag(i, sep, e) {
            if (this._drag) this._endDrag();
            const horizontal = this._horizontal();
            this._drag = {
                i: i, sep: sep, start: horizontal ? e.clientX : e.clientY, base: this.sizes.slice(), total: this._total() || 1, pointerId: e.pointerId
            };
            sep.classList.add('chillsplitter-active');
            this.container.classList.add('chillsplitter-dragging');
            try { if (sep.setPointerCapture && e.pointerId != null) sep.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            const self = this;
            this._onMove = function (ev) {
                const d = self._drag;
                if (!d) return;
                const pos = self._horizontal() ? ev.clientX : ev.clientY;
                const deltaPct = (pos - d.start) / d.total * 100;
                self.sizes = d.base.slice();
                self._move(d.i, deltaPct);
                self._changed();
            };
            this._onUp = function () { self._endDrag(); };
            document.addEventListener('pointermove', this._onMove);
            document.addEventListener('pointerup', this._onUp);
            document.addEventListener('pointercancel', this._onUp);
            if (e.cancelable && e.preventDefault) e.preventDefault();
            sep.focus && sep.focus();
            this._fire('dragstart', this);
        }

        _endDrag() {
            if (!this._drag) return;
            const sep = this._drag.sep;
            sep.classList.remove('chillsplitter-active');
            this.container.classList.remove('chillsplitter-dragging');
            try { if (sep.releasePointerCapture && this._drag.pointerId != null) sep.releasePointerCapture(this._drag.pointerId); } catch (err) { /* ignore */ }
            this._drag = null;
            document.removeEventListener('pointermove', this._onMove);
            document.removeEventListener('pointerup', this._onUp);
            document.removeEventListener('pointercancel', this._onUp);
            this._fire('dragend', this.getSizes(), this);
        }

        _keyDownHandler() {
            const self = this;
            return function (e) {
                const sep = e.currentTarget, i = sep._chillIndex;
                const horizontal = self._horizontal();
                const prev = horizontal ? 'ArrowLeft' : 'ArrowUp', next = horizontal ? 'ArrowRight' : 'ArrowDown';
                const total = self._total();
                const unit = (e.shiftKey ? 10 : 1) * self.o.step;
                const pct = total ? unit / total * 100 : 1;
                let handled = true;
                if (e.key === prev) { self._userMove(i, -pct); }
                else if (e.key === next) { self._userMove(i, pct); }
                else if (e.key === 'Home') { self._userMove(i, -100); }
                else if (e.key === 'End') { self._userMove(i, 100); }
                else if (e.key === 'Enter') { self._toggleAt(i); }
                else handled = false;
                if (handled) e.preventDefault();
            };
        }

        _dblClickHandler() {
            const self = this;
            return function (e) { self._toggleAt(e.currentTarget._chillIndex); };
        }

        _toggleAt(i) {
            if (this.collapsible[i]) this.toggle(i);
            else if (this.collapsible[i + 1]) this.toggle(i + 1);
            else this.reset();
        }

        _userMove(i, deltaPct) {
            // moving a collapsed pane's handle re-opens it first
            if (this._collapsed[i] && deltaPct > 0) { this.expand(i); return; }
            if (this._collapsed[i + 1] && deltaPct < 0) { this.expand(i + 1); return; }
            if (this._move(i, deltaPct)) this._changed();
        }

        // ---------- public API ----------
        getSizes() { return this.sizes.slice(); }

        setSizes(arr) {
            if (!Array.isArray(arr) || arr.length !== this.n) throw new Error('ChillSplitter.setSizes: expected ' + this.n + ' values');
            this._collapsed.fill(false);
            this.sizes = this._normalise(arr);
            // enforce min/max by pushing the error to neighbours, pair by pair
            for (let i = 0; i < this.n - 1; i++) this._move(i, 0, this.sizes);
            this._changed();
            return this;
        }

        reset() { return this.setSizes(this._initial); }

        isCollapsed(i) { return !!this._collapsed[i]; }

        collapse(i) {
            if (i < 0 || i >= this.n || this._collapsed[i]) return this;
            const total = this._total();
            const target = total ? this.o.collapsedSize / total * 100 : 0;
            const neighbour = i < this.n - 1 && !this._collapsed[i + 1] ? i + 1 : (i > 0 && !this._collapsed[i - 1] ? i - 1 : -1);
            if (neighbour === -1) return this; // never collapse the last open pane
            this._restore[i] = { size: this.sizes[i], neighbour: neighbour, neighbourSize: this.sizes[neighbour] };
            const freed = this.sizes[i] - target;
            this.sizes[i] = target;
            this.sizes[neighbour] += freed;
            this._collapsed[i] = true;
            this._changed();
            this._fire('collapse', i, true, this);
            return this;
        }

        expand(i) {
            if (i < 0 || i >= this.n || !this._collapsed[i]) return this;
            const r = this._restore[i];
            this._collapsed[i] = false;
            let want = r ? r.size : this._initial[i];
            const neighbour = r && !this._collapsed[r.neighbour] ? r.neighbour : this.sizes.indexOf(Math.max.apply(null, this.sizes));
            want = Math.min(want, this.sizes[neighbour] + this.sizes[i]);
            const delta = want - this.sizes[i];
            this.sizes[i] += delta;
            this.sizes[neighbour] -= delta;
            this._restore[i] = null;
            this._changed();
            this._fire('collapse', i, false, this);
            return this;
        }

        toggle(i) { return this._collapsed[i] ? this.expand(i) : this.collapse(i); }

        /** Re-apply layout (call after the container resized or panes changed visibility). */
        refresh() {
            if (this._destroyed) return this;
            this._apply();
            return this;
        }

        on(type, fn) {
            if (!this._handlers[type]) throw new Error('ChillSplitter.on: unknown event "' + type + '"');
            this._handlers[type].push(fn);
            const self = this;
            return function off() { const k = self._handlers[type].indexOf(fn); if (k > -1) self._handlers[type].splice(k, 1); };
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._endDrag();
            if (typeof window.removeEventListener === 'function') window.removeEventListener('resize', this._onResizeWin);
            this.separators.forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); });
            this.separators = [];
            const saved = this._saved, c = this.container;
            if (saved.cls === null) c.removeAttribute('class'); else c.setAttribute('class', saved.cls);
            this.panes.forEach(function (p, i) {
                const s = saved.panes[i];
                if (s.cls === null) p.removeAttribute('class'); else p.setAttribute('class', s.cls);
                if (s.style === null) p.removeAttribute('style'); else p.setAttribute('style', s.style);
                if (s.id === null) p.removeAttribute('id'); else p.setAttribute('id', s.id);
                p.removeAttribute('aria-hidden');
            });
            Object.keys(this._handlers).forEach(function (k) { this._handlers[k].length = 0; }, this);
        }
    }

    const ChillSplitter = {
        version: VERSION,
        Splitter: ChillSplitterInstance,
        init(container, options) { return new ChillSplitterInstance(container, options); },
        create(options) {
            options = options || {};
            const root = document.createElement('div');
            (options.panes || []).forEach(function (p) {
                const el = typeof p === 'string' ? document.createElement('div') : p;
                if (typeof p === 'string') el.textContent = p;
                root.appendChild(el);
            });
            const inst = new ChillSplitterInstance(root, options);
            inst.element = root;
            return inst;
        },
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillSplitter; }
    else { window.ChillSplitter = ChillSplitter; }
})(typeof window !== 'undefined' ? window : this);
