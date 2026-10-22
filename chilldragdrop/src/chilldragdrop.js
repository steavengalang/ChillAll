/**
 * ChillDragDrop - Zero-dependency Drag and Drop (sortable list) Component
 *
 * Usage:
 *   const dd = ChillDragDrop.init('#list', { items: '.item', handle: '.grip', onChange: order => {} });
 *   dd.destroy();
 *
 * Options:
 *   items        string    '.chilldragdrop-item'  selector of sortable children
 *   handle       string    null   only start a pointer drag from this descendant selector
 *   axis         'y'|'x'   'y'    pointer axis used to decide before/after (use 'x' for horizontal rows/grids)
 *   keyboard     boolean   true   keyboard reordering: Space/Enter grabs, Arrow keys move, Space/Enter drops, Esc cancels
 *   label        function(item) -> string   accessible name used in announcements (default: item text)
 *   messages     { grab, move, drop, cancel }  functions (label, position, total) -> string for announcements
 *   ghostClass, placeholderClass, animation
 *   onStart({item,index}) onEnd({item,from,to}) onChange(order)
 * Instance: getItems(), getOrder(), refresh(), on(event, fn), destroy()   (events: start, end, change, announce)
 * Items are made focusable (tabindex=0) and announced via a polite aria-live region.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilldragdrop_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chilldragdrop-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilldragdrop-styles';
        style.textContent = `
      :root {
        --chilldragdrop-bg: #ffffff;
        --chilldragdrop-border: #e5e5e5;
        --chilldragdrop-hover: #f5f5f5;
        --chilldragdrop-active: #3b82f6;
        --chilldragdrop-placeholder: #f0f9ff;
        --chilldragdrop-placeholder-border: #3b82f6;
        --chilldragdrop-handle: #9ca3af;
        --chilldragdrop-handle-hover: #6b7280;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilldragdrop-bg: #262626;
          --chilldragdrop-border: #404040;
          --chilldragdrop-hover: #374151;
          --chilldragdrop-placeholder: #1e3a5f;
          --chilldragdrop-active: #60a5fa;
          --chilldragdrop-placeholder-border: #60a5fa;
          --chilldragdrop-handle: #9ca3af;
          --chilldragdrop-handle-hover: #d1d5db;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilldragdrop-bg: #262626;
        --chilldragdrop-border: #404040;
        --chilldragdrop-hover: #374151;
        --chilldragdrop-placeholder: #1e3a5f;
        --chilldragdrop-active: #60a5fa;
        --chilldragdrop-placeholder-border: #60a5fa;
        --chilldragdrop-handle: #9ca3af;
        --chilldragdrop-handle-hover: #d1d5db;
      }

      .chilldragdrop-item {
        cursor: grab;
        user-select: none;
        transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
      }

      .chilldragdrop-item:hover { background: var(--chilldragdrop-hover); }

      .chilldragdrop-item:focus-visible {
        outline: 2px solid var(--chilldragdrop-active);
        outline-offset: 2px;
      }

      .chilldragdrop-item.dragging { opacity: 0.5; cursor: grabbing; }

      .chilldragdrop-item.chilldragdrop-grabbed {
        box-shadow: 0 0 0 2px var(--chilldragdrop-active), 0 6px 18px rgba(0, 0, 0, 0.2);
        cursor: grabbing;
      }

      .chilldragdrop-ghost {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.9;
        transform: rotate(3deg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      }

      .chilldragdrop-placeholder {
        background: var(--chilldragdrop-placeholder);
        border: 2px dashed var(--chilldragdrop-placeholder-border);
        border-radius: 8px;
        transition: background 0.2s ease, border-color 0.2s ease;
      }

      .chilldragdrop-handle {
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--chilldragdrop-handle);
        flex-shrink: 0;
      }

      .chilldragdrop-handle:hover { color: var(--chilldragdrop-handle-hover); }
      .chilldragdrop-handle svg { width: 16px; height: 16px; }

      /* Zone styles */
      .chilldragdrop-zone {
        min-height: 100px;
        padding: 8px;
        border: 2px dashed transparent;
        border-radius: 12px;
        transition: border-color 0.2s ease, background 0.2s ease;
      }

      .chilldragdrop-zone.active,
      .chilldragdrop-zone.over {
        border-color: var(--chilldragdrop-active);
        background: var(--chilldragdrop-placeholder);
      }

      /* List style */
      .chilldragdrop-list { display: flex; flex-direction: column; gap: 8px; }

      .chilldragdrop-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--chilldragdrop-bg);
        border: 1px solid var(--chilldragdrop-border);
        border-radius: 8px;
      }

      /* Grid style */
      .chilldragdrop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }

      .chilldragdrop-sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
        clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .chilldragdrop-item, .chilldragdrop-placeholder, .chilldragdrop-zone { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const DEFAULT_MESSAGES = {
        grab: (l, p, t) => l + ' grabbed, position ' + p + ' of ' + t + '. Use arrow keys to move, Space to drop, Escape to cancel.',
        move: (l, p, t) => l + ' moved to position ' + p + ' of ' + t + '.',
        drop: (l, p, t) => l + ' dropped at position ' + p + ' of ' + t + '.',
        cancel: (l, p, t) => 'Reorder cancelled. ' + l + ' returned to position ' + p + ' of ' + t + '.'
    };

    class ChillDragDropInstance {
        constructor(selector, options) {
            options = options || {};
            this.container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            this.options = Object.assign({}, options, {
                items: options.items || '.chilldragdrop-item',
                handle: options.handle || null,
                group: options.group || null,
                axis: options.axis === 'x' ? 'x' : 'y',
                keyboard: options.keyboard !== false,
                ghostClass: options.ghostClass || 'chilldragdrop-ghost',
                placeholderClass: options.placeholderClass || 'chilldragdrop-placeholder',
                animation: options.animation !== false,
                onStart: options.onStart || null,
                onEnd: options.onEnd || null,
                onChange: options.onChange || null
            });
            this.messages = Object.assign({}, DEFAULT_MESSAGES, options.messages || {});

            this.draggedEl = null;
            this.ghostEl = null;
            this.placeholderEl = null;
            this.startIndex = -1;
            this.currentIndex = -1;
            this.grabbedEl = null;
            this._grabStart = -1;
            this._grabNext = null;
            this._grabParent = null;
            this._listeners = {};
            this._cleanups = [];
            this._destroyed = false;
            this._moveGhost = (e) => this.updateGhostPosition(e);

            this.init();
        }

        init() {
            if (!this.container) return;
            injectCSS();
            this._buildLive();
            this._bindDelegated();
            this.refresh();
            if (typeof MutationObserver !== 'undefined') {
                this._mo = new MutationObserver(() => this.refresh());
                this._mo.observe(this.container, { childList: true, subtree: true });
            }
        }

        on(event, fn) { (this._listeners[event] = this._listeners[event] || []).push(fn); return this; }
        _emit(event, payload) { (this._listeners[event] || []).slice().forEach(fn => fn(payload)); }

        _listen(el, ev, fn, opts) { el.addEventListener(ev, fn, opts); this._cleanups.push(() => el.removeEventListener(ev, fn, opts)); }

        _buildLive() {
            const live = document.createElement('div');
            live.className = 'chilldragdrop-sr';
            live.setAttribute('role', 'status');
            live.setAttribute('aria-live', 'assertive');
            live.setAttribute('aria-atomic', 'true');
            document.body.appendChild(live);
            this.liveEl = live;
            if (!this.container.id) { /* no id needed; instructions are in aria-description */ }
        }

        announce(text) {
            if (this.liveEl) this.liveEl.textContent = text;
            this._emit('announce', text);
        }

        getItems() {
            if (!this.container) return [];
            return Array.from(this.container.querySelectorAll(this.options.items));
        }

        _labelOf(item) {
            if (typeof this.options.label === 'function') return this.options.label(item);
            return (item.getAttribute('aria-label') || item.textContent || 'Item').replace(/\s+/g, ' ').trim();
        }

        /** (Re)apply attributes to the current items. Called automatically when children change. */
        refresh() {
            if (this._destroyed) return;
            const o = this.options;
            this.getItems().forEach((item, index) => {
                if (item === this.draggedEl) return;
                item.setAttribute('draggable', o.handle ? 'false' : 'true');
                item.dataset.index = index;
                if (o.keyboard) {
                    if (!item.hasAttribute('tabindex')) { item.setAttribute('tabindex', '0'); item.dataset.chilldragdropTab = '1'; }
                    item.setAttribute('aria-roledescription', 'sortable item');
                    item.setAttribute('aria-description', 'Press Space to grab, then use arrow keys to reorder.');
                }
            });
        }

        // kept for backward compatibility
        bindEvents() { this.refresh(); }

        _itemFrom(target) {
            if (!target || !target.closest) return null;
            const item = target.closest(this.options.items);
            return item && this.container.contains(item) ? item : null;
        }

        _bindDelegated() {
            const c = this.container;
            const o = this.options;

            // handle gating: only allow a native drag to start from the handle
            const arm = (e) => {
                if (!o.handle) return;
                const item = this._itemFrom(e.target);
                if (!item) return;
                item.setAttribute('draggable', e.target.closest && e.target.closest(o.handle) ? 'true' : 'false');
            };
            this._listen(c, 'mousedown', arm);
            this._listen(c, 'touchstart', arm, { passive: true });

            this._listen(c, 'dragstart', (e) => {
                const item = this._itemFrom(e.target);
                if (!item || item.parentNode === null) return;
                if (o.handle && item.getAttribute('draggable') !== 'true') { e.preventDefault(); return; }
                this.onDragStart(e, item, this.getItems().indexOf(item));
            });
            this._listen(c, 'dragend', (e) => this.onDragEnd(e));
            this._listen(c, 'dragover', (e) => {
                const item = this._itemFrom(e.target);
                if (!item) { if (this.draggedEl) e.preventDefault(); return; }
                this.onDragOver(e, item, this.getItems().indexOf(item));
            });
            this._listen(c, 'dragenter', (e) => { if (this.draggedEl) e.preventDefault(); });
            this._listen(c, 'drop', (e) => { if (this.draggedEl) e.preventDefault(); });

            if (o.keyboard) {
                this._listen(c, 'keydown', (e) => this.onKeyDown(e));
                this._listen(c, 'focusout', (e) => {
                    if (this.grabbedEl && e.target === this.grabbedEl && !(e.relatedTarget && this.grabbedEl.contains(e.relatedTarget))) {
                        // lost focus while grabbed: commit where it is
                        this._drop(false, true);
                    }
                });
            }
        }

        // ---------- keyboard ----------
        onKeyDown(e) {
            const item = this._itemFrom(e.target);
            if (!item || e.target !== item) return;
            const key = e.key;
            if (!this.grabbedEl) {
                if (key === ' ' || key === 'Enter' || key === 'Spacebar') {
                    e.preventDefault();
                    this._grab(item);
                }
                return;
            }
            if (item !== this.grabbedEl) return;
            if (key === ' ' || key === 'Enter' || key === 'Spacebar') { e.preventDefault(); this._drop(false); }
            else if (key === 'Escape' || key === 'Esc') { e.preventDefault(); this._drop(true); }
            else if (key === 'ArrowUp' || key === 'ArrowLeft') { e.preventDefault(); this._keyMove(-1); }
            else if (key === 'ArrowDown' || key === 'ArrowRight') { e.preventDefault(); this._keyMove(1); }
            else if (key === 'Home') { e.preventDefault(); this._keyMove(-Infinity); }
            else if (key === 'End') { e.preventDefault(); this._keyMove(Infinity); }
        }

        _grab(item) {
            const items = this.getItems();
            this.grabbedEl = item;
            this._grabStart = items.indexOf(item);
            this._grabParent = item.parentNode;
            this._grabNext = item.nextSibling;
            item.classList.add('chilldragdrop-grabbed');
            item.setAttribute('aria-pressed', 'true');
            if (this.options.onStart) this.options.onStart({ item, index: this._grabStart });
            this._emit('start', { item, index: this._grabStart });
            this.announce(this.messages.grab(this._labelOf(item), this._grabStart + 1, items.length));
        }

        _keyMove(dir) {
            const item = this.grabbedEl;
            const items = this.getItems();
            const idx = items.indexOf(item);
            let target = dir === -Infinity ? 0 : dir === Infinity ? items.length - 1 : idx + dir;
            target = Math.max(0, Math.min(items.length - 1, target));
            if (target === idx) {
                this.announce(this._labelOf(item) + ' is already at position ' + (idx + 1) + ' of ' + items.length + '.');
                return;
            }
            const ref = items[target];
            if (target > idx) ref.parentNode.insertBefore(item, ref.nextSibling);
            else ref.parentNode.insertBefore(item, ref);
            item.focus();
            this.refresh();
            this.announce(this.messages.move(this._labelOf(item), target + 1, items.length));
        }

        _drop(cancel, silent) {
            const item = this.grabbedEl;
            if (!item) return;
            const total = this.getItems().length;
            if (cancel && this._grabParent) {
                this._grabParent.insertBefore(item, this._grabNext && this._grabNext.parentNode === this._grabParent ? this._grabNext : null);
                item.focus();
            }
            this.refresh();
            const to = this.getItems().indexOf(item);
            const from = this._grabStart;
            item.classList.remove('chilldragdrop-grabbed');
            item.removeAttribute('aria-pressed');
            this.grabbedEl = null;
            this._grabParent = null;
            this._grabNext = null;
            if (!silent) this.announce(cancel ? this.messages.cancel(this._labelOf(item), to + 1, total) : this.messages.drop(this._labelOf(item), to + 1, total));
            this._finish(item, from, to);
        }

        _finish(item, from, to) {
            if (this.options.onEnd) this.options.onEnd({ item, from, to });
            this._emit('end', { item, from, to });
            if (from !== to) {
                const order = this.getOrder();
                if (this.options.onChange) this.options.onChange(order);
                this._emit('change', order);
            }
        }

        // ---------- pointer ----------
        onDragStart(e, item, index) {
            this.draggedEl = item;
            this.startIndex = index;
            this.currentIndex = index;

            item.classList.add('dragging');

            // Create ghost
            this.ghostEl = item.cloneNode(true);
            this.ghostEl.classList.add(this.options.ghostClass);
            this.ghostEl.classList.remove('dragging');
            this.ghostEl.removeAttribute('id');
            this.ghostEl.removeAttribute('tabindex');
            this.ghostEl.setAttribute('aria-hidden', 'true');
            this.ghostEl.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
            this.ghostEl.style.width = `${item.offsetWidth}px`;
            document.body.appendChild(this.ghostEl);

            // Create placeholder
            this.placeholderEl = document.createElement('div');
            this.placeholderEl.className = this.options.placeholderClass;
            this.placeholderEl.style.height = `${item.offsetHeight}px`;

            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', ''); } catch (err) { /* ignore */ }
                if (typeof Image !== 'undefined' && e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(new Image(), 0, 0);
            }

            if (this.options.onStart) {
                this.options.onStart({ item, index });
            }
            this._emit('start', { item, index });

            document.addEventListener('dragover', this._moveGhost);
        }

        updateGhostPosition(e) {
            if (this.ghostEl) {
                this.ghostEl.style.left = `${e.clientX + 10}px`;
                this.ghostEl.style.top = `${e.clientY + 10}px`;
            }
        }

        onDragOver(e, item, index) {
            e.preventDefault();

            if (!this.draggedEl || item === this.draggedEl || !this.placeholderEl) return;

            const rect = item.getBoundingClientRect();
            const before = this.options.axis === 'x'
                ? e.clientX < rect.left + rect.width / 2
                : e.clientY < rect.top + rect.height / 2;

            if (before) {
                if (item.previousElementSibling !== this.placeholderEl) {
                    item.parentNode.insertBefore(this.placeholderEl, item);
                    this.currentIndex = index;
                }
            } else {
                if (item.nextElementSibling !== this.placeholderEl) {
                    item.parentNode.insertBefore(this.placeholderEl, item.nextElementSibling);
                    this.currentIndex = index + 1;
                }
            }
        }

        onDragEnd() {
            const item = this.draggedEl;
            if (!item) return;
            item.classList.remove('dragging');
            if (this.options.handle) item.setAttribute('draggable', 'false');

            if (this.placeholderEl && this.placeholderEl.parentNode) {
                this.placeholderEl.parentNode.insertBefore(item, this.placeholderEl);
                this.placeholderEl.remove();
            }
            if (this.ghostEl) this.ghostEl.remove();
            document.removeEventListener('dragover', this._moveGhost);

            const from = this.startIndex;
            this.draggedEl = null;
            this.ghostEl = null;
            this.placeholderEl = null;
            this.startIndex = -1;
            this.currentIndex = -1;

            this.refresh();
            const to = this.getItems().indexOf(item);
            this.announce(this.messages.drop(this._labelOf(item), to + 1, this.getItems().length));
            this._finish(item, from, to);
        }

        getOrder() {
            return this.getItems().map((item, index) => ({
                element: item,
                index,
                id: item.dataset.id || index
            }));
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            if (this._mo) { this._mo.disconnect(); this._mo = null; }
            document.removeEventListener('dragover', this._moveGhost);
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            this.getItems().forEach(item => {
                item.removeAttribute('draggable');
                item.removeAttribute('aria-roledescription');
                item.removeAttribute('aria-description');
                item.removeAttribute('aria-pressed');
                if (item.dataset.chilldragdropTab) { item.removeAttribute('tabindex'); delete item.dataset.chilldragdropTab; }
                item.classList.remove('dragging', 'chilldragdrop-grabbed');
            });
            if (this.ghostEl) this.ghostEl.remove();
            if (this.placeholderEl) this.placeholderEl.remove();
            if (this.liveEl && this.liveEl.parentNode) this.liveEl.parentNode.removeChild(this.liveEl);
            this.ghostEl = this.placeholderEl = this.draggedEl = this.grabbedEl = this.liveEl = null;
            this._listeners = {};
        }
    }

    function createHandle() {
        const handle = document.createElement('span');
        handle.className = 'chilldragdrop-handle';
        handle.setAttribute('aria-hidden', 'true');
        handle.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <circle cx="9" cy="5" r="1.5"/>
            <circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/>
            <circle cx="15" cy="19" r="1.5"/>
        </svg>`;
        return handle;
    }

    const ChillDragDrop = {
        version: VERSION,

        init(selector, options) {
            return new ChillDragDropInstance(selector, options);
        },

        createHandle,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillDragDrop;
    } else {
        window.ChillDragDrop = ChillDragDrop;
    }

})(typeof window !== 'undefined' ? window : this);
