/**
 * ChillContextMenu - Zero-dependency right-click / long-press context menu
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const menu = ChillContextMenu.attach('#card', {
 *     items: [
 *       { label: 'Copy', icon: '⧉', shortcut: 'Ctrl+C', onClick: () => copy() },
 *       { label: 'Share', items: [{ label: 'Email' }, { label: 'Link', onClick: () => {} }] },
 *       { type: 'separator' },
 *       { label: 'Delete', danger: true, shortcut: 'Del', onClick: remove }
 *     ],
 *     onSelect: (item, event) => console.log(item.label)
 *   });
 *   menu.open(120, 80);   // programmatic
 *   menu.destroy();
 *   ChillContextMenu.init('[data-chill-contextmenu]', { items });   // alias of attach for many elements
 *
 * Options
 *   items        array | function(event, target) => array. Item: { label, icon, iconHtml, shortcut, disabled, danger,
 *                checked (boolean -> menuitemcheckbox), id, value, items (submenu), onClick(item, event), type: 'separator' | 'header' }
 *                label/icon/shortcut are always inserted as text (no HTML) -- iconHtml is an explicit HTML opt-in.
 *   trigger      'contextmenu' | 'longpress' | 'both'                default 'both'
 *   longPressMs  long-press duration                                  default 500
 *   onSelect     (item, event) fired for any leaf selection
 *   onOpen, onClose
 *   className    extra class for each menu panel
 *   ariaLabel    accessible name                                      default 'Context menu'
 *
 * Instance: { open(x, y, event?), close(), destroy(), setItems(items), isOpen, element, on(evt, fn), off(evt, fn) }
 * Keyboard: ArrowUp/Down, Home/End, Enter/Space, ArrowRight (open submenu), ArrowLeft/Esc (close submenu / menu),
 *           type-ahead, Tab closes.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcontextmenu-styles';
    const Z = 10003;
    let uid = 0;

    const DARK_VARS = `
        --chillcontextmenu-bg: #1f1f1f;
        --chillcontextmenu-text: #fafafa;
        --chillcontextmenu-muted: #a3a3a3;
        --chillcontextmenu-border: #333333;
        --chillcontextmenu-hover: #2d2d2d;
        --chillcontextmenu-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcontextmenu-bg: #ffffff;
        --chillcontextmenu-text: #171717;
        --chillcontextmenu-muted: #6b7280;
        --chillcontextmenu-border: #e5e5e5;
        --chillcontextmenu-hover: #f3f4f6;
        --chillcontextmenu-primary: #3b82f6;
        --chillcontextmenu-danger: #ef4444;
        --chillcontextmenu-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chillcontextmenu {
        position: fixed;
        z-index: ${Z};
        min-width: 180px;
        max-width: 320px;
        max-height: calc(100vh - 16px);
        overflow-y: auto;
        box-sizing: border-box;
        padding: 6px;
        background: var(--chillcontextmenu-bg);
        color: var(--chillcontextmenu-text);
        border: 1px solid var(--chillcontextmenu-border);
        border-radius: 10px;
        box-shadow: var(--chillcontextmenu-shadow);
        font-family: inherit;
        font-size: 14px;
        outline: none;
        opacity: 0;
        transform: scale(0.97);
        transform-origin: top left;
        transition: opacity 0.12s ease, transform 0.12s ease;
        user-select: none;
      }
      .chillcontextmenu-visible { opacity: 1; transform: none; }
      .chillcontextmenu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 32px;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        outline: none;
        box-sizing: border-box;
        transition: background 0.1s ease;
      }
      .chillcontextmenu-item:hover:not([aria-disabled="true"]),
      .chillcontextmenu-item:focus-visible,
      .chillcontextmenu-item.chillcontextmenu-active { background: var(--chillcontextmenu-hover); }
      .chillcontextmenu-item:focus-visible { box-shadow: inset 0 0 0 2px var(--chillcontextmenu-primary); }
      .chillcontextmenu-item[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
      .chillcontextmenu-danger { color: var(--chillcontextmenu-danger); }
      .chillcontextmenu-icon { width: 18px; flex-shrink: 0; text-align: center; display: inline-flex; justify-content: center; align-items: center; }
      .chillcontextmenu-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chillcontextmenu-shortcut { color: var(--chillcontextmenu-muted); font-size: 12px; margin-left: 24px; }
      .chillcontextmenu-arrow { color: var(--chillcontextmenu-muted); font-size: 12px; margin-left: 12px; }
      .chillcontextmenu-check { width: 18px; text-align: center; color: var(--chillcontextmenu-primary); flex-shrink: 0; }
      .chillcontextmenu-separator { height: 1px; margin: 6px 4px; background: var(--chillcontextmenu-border); }
      .chillcontextmenu-header { padding: 6px 10px 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--chillcontextmenu-muted); }
      @media (prefers-reduced-motion: reduce) {
        .chillcontextmenu { transition: none; transform: none; }
        .chillcontextmenu-item { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function setText(el, text) { el.textContent = text == null ? '' : String(text); }

    class ChillContextMenuInstance {
        constructor(options) {
            injectCSS();
            this.options = Object.assign({
                items: [], trigger: 'both', longPressMs: 500, onSelect: null, onOpen: null, onClose: null,
                className: '', ariaLabel: 'Context menu', target: null
            }, options || {});
            this.isOpen = false;
            this.destroyed = false;
            this.element = null;       // root menu element when open
            this._menus = [];          // open menu chain: { el, items, parentItemEl }
            this._listeners = {};
            this._cleanups = [];
            this._timers = [];
            this._uid = ++uid;
            this._items = this.options.items;
            if (this.options.target) this._bindTarget(this.options.target);
        }

        // ---- binding -------------------------------------------------------------------------
        _resolveTargets(t) {
            if (typeof t === 'string') return Array.prototype.slice.call(document.querySelectorAll(t));
            if (t && t.nodeType) return [t];
            return t ? Array.prototype.slice.call(t) : [];
        }

        _bindTarget(target) {
            const trig = this.options.trigger;
            this._resolveTargets(target).forEach(el => {
                if (trig === 'contextmenu' || trig === 'both') {
                    const onCtx = e => {
                        e.preventDefault();
                        const kbd = e.clientX === 0 && e.clientY === 0;
                        let x = e.clientX, y = e.clientY;
                        if (kbd && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); x = r.left + 8; y = r.top + 8; }
                        this._target = el;
                        this.open(x, y, e);
                    };
                    el.addEventListener('contextmenu', onCtx);
                    this._cleanups.push(() => el.removeEventListener('contextmenu', onCtx));
                }
                if (trig === 'longpress' || trig === 'both') {
                    let timer = null, sx = 0, sy = 0, fired = false;
                    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
                    const onStart = e => {
                        const t = e.touches && e.touches[0]; if (!t) return;
                        sx = t.clientX; sy = t.clientY; fired = false; cancel();
                        timer = setTimeout(() => { timer = null; fired = true; this._target = el; this.open(sx, sy, e); }, this.options.longPressMs);
                    };
                    const onMove = e => {
                        const t = e.touches && e.touches[0]; if (!t) return;
                        if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) cancel();
                    };
                    const onEnd = e => { cancel(); if (fired && e.cancelable) e.preventDefault(); };
                    el.addEventListener('touchstart', onStart, { passive: true });
                    el.addEventListener('touchmove', onMove, { passive: true });
                    el.addEventListener('touchend', onEnd);
                    el.addEventListener('touchcancel', onEnd);
                    this._cleanups.push(() => {
                        cancel();
                        el.removeEventListener('touchstart', onStart);
                        el.removeEventListener('touchmove', onMove);
                        el.removeEventListener('touchend', onEnd);
                        el.removeEventListener('touchcancel', onEnd);
                    });
                }
            });
        }

        // ---- building ------------------------------------------------------------------------
        setItems(items) {
            this._items = items;
            if (this.isOpen) { const pos = this._pos || { x: 0, y: 0 }; this.close(true); this.open(pos.x, pos.y); }
            return this;
        }

        _buildMenu(items, level) {
            const menu = document.createElement('div');
            menu.className = 'chillcontextmenu' + (this.options.className ? ' ' + this.options.className : '');
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-orientation', 'vertical');
            menu.setAttribute('aria-label', this.options.ariaLabel);
            menu.tabIndex = -1;
            menu.dataset.level = String(level);
            items.forEach((item, idx) => {
                if (!item) return;
                if (item.type === 'separator') {
                    const sep = document.createElement('div');
                    sep.className = 'chillcontextmenu-separator';
                    sep.setAttribute('role', 'separator');
                    menu.appendChild(sep);
                    return;
                }
                if (item.type === 'header') {
                    const h = document.createElement('div');
                    h.className = 'chillcontextmenu-header';
                    h.setAttribute('role', 'presentation');
                    setText(h, item.label);
                    menu.appendChild(h);
                    return;
                }
                const hasSub = Array.isArray(item.items) && item.items.length > 0;
                const el = document.createElement('div');
                el.className = 'chillcontextmenu-item' + (item.danger ? ' chillcontextmenu-danger' : '');
                el.setAttribute('role', typeof item.checked === 'boolean' ? 'menuitemcheckbox' : 'menuitem');
                if (typeof item.checked === 'boolean') el.setAttribute('aria-checked', String(item.checked));
                el.tabIndex = -1;
                el._chillItem = item;
                el._chillIndex = idx;
                if (item.disabled) el.setAttribute('aria-disabled', 'true');
                if (hasSub) { el.setAttribute('aria-haspopup', 'menu'); el.setAttribute('aria-expanded', 'false'); }
                if (typeof item.checked === 'boolean') {
                    const c = document.createElement('span'); c.className = 'chillcontextmenu-check'; c.setAttribute('aria-hidden', 'true');
                    c.textContent = item.checked ? '✓' : ''; el.appendChild(c);
                } else if (item.icon || item.iconHtml) {
                    const ic = document.createElement('span'); ic.className = 'chillcontextmenu-icon'; ic.setAttribute('aria-hidden', 'true');
                    if (item.iconHtml) ic.innerHTML = item.iconHtml; else setText(ic, item.icon);
                    el.appendChild(ic);
                }
                const lb = document.createElement('span'); lb.className = 'chillcontextmenu-label'; setText(lb, item.label); el.appendChild(lb);
                if (item.shortcut) { const sc = document.createElement('span'); sc.className = 'chillcontextmenu-shortcut'; setText(sc, item.shortcut); el.appendChild(sc); }
                if (hasSub) { const ar = document.createElement('span'); ar.className = 'chillcontextmenu-arrow'; ar.setAttribute('aria-hidden', 'true'); ar.textContent = '▸'; el.appendChild(ar); }
                menu.appendChild(el);
            });
            this._bindMenu(menu, level);
            return menu;
        }

        _bindMenu(menu, level) {
            menu.addEventListener('mouseover', e => {
                const el = e.target.closest && e.target.closest('.chillcontextmenu-item');
                if (!el || !menu.contains(el) || el.getAttribute('aria-disabled') === 'true') return;
                this._focusItem(menu, el);
                this._clearTimers();
                const item = el._chillItem;
                if (item.items && item.items.length) {
                    this._timers.push(setTimeout(() => this._openSub(menu, el), 120));
                } else {
                    this._timers.push(setTimeout(() => this._closeFrom(level + 1), 120));
                }
            });
            menu.addEventListener('click', e => {
                const el = e.target.closest && e.target.closest('.chillcontextmenu-item');
                if (!el || !menu.contains(el)) return;
                e.stopPropagation();
                this._activate(menu, el, e);
            });
            menu.addEventListener('contextmenu', e => e.preventDefault());
        }

        _items_of(menu) {
            return Array.prototype.filter.call(menu.children, c => c.classList.contains('chillcontextmenu-item') && c.getAttribute('aria-disabled') !== 'true');
        }

        _focusItem(menu, el) {
            Array.prototype.forEach.call(menu.querySelectorAll('.chillcontextmenu-active'), n => n.classList.remove('chillcontextmenu-active'));
            if (el) { el.classList.add('chillcontextmenu-active'); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
        }

        _activate(menu, el, event) {
            const item = el._chillItem;
            if (!item || item.disabled) return;
            if (item.items && item.items.length) { this._openSub(menu, el, true); return; }
            const target = this._target;
            if (typeof item.onClick === 'function') item.onClick(item, event);
            if (typeof this.options.onSelect === 'function') this.options.onSelect(item, event);
            this._emit('select', item);
            this.close();
            if (target && target.focus && document.contains(target) && event && event.type === 'keydown') { try { target.focus(); } catch (e) { /* ignore */ } }
        }

        _openSub(menu, itemEl, focusFirst) {
            const level = Number(menu.dataset.level);
            const existing = this._menus[level + 1];
            if (existing && existing.parentItemEl === itemEl) {
                if (focusFirst) this._focusFirst(existing.el);
                return;
            }
            this._closeFrom(level + 1);
            const item = itemEl._chillItem;
            const sub = this._buildMenu(item.items, level + 1);
            document.body.appendChild(sub);
            this._menus[level + 1] = { el: sub, parentItemEl: itemEl };
            itemEl.setAttribute('aria-expanded', 'true');
            const r = itemEl.getBoundingClientRect();
            this._place(sub, r.right - 4, r.top - 6, { alt: r.left + 4 });
            requestAnimationFrameSafe(() => sub.classList.add('chillcontextmenu-visible'));
            if (focusFirst) this._focusFirst(sub);
        }

        _focusFirst(menu) {
            const items = this._items_of(menu);
            if (items.length) this._focusItem(menu, items[0]); else menu.focus();
        }

        _closeFrom(level) {
            for (let i = this._menus.length - 1; i >= level && i > 0; i--) {
                const m = this._menus[i];
                if (!m) continue;
                if (m.parentItemEl) m.parentItemEl.setAttribute('aria-expanded', 'false');
                if (m.el.parentNode) m.el.parentNode.removeChild(m.el);
                this._menus.length = i;
            }
        }

        _place(menu, x, y, opts) {
            const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
            menu.style.left = '0px'; menu.style.top = '0px';
            const w = menu.offsetWidth, h = menu.offsetHeight;
            let left = x, top = y;
            if (left + w > vw - 8) left = opts && opts.alt != null ? opts.alt - w : vw - w - 8;
            if (top + h > vh - 8) top = vh - h - 8;
            menu.style.left = Math.max(8, left) + 'px';
            menu.style.top = Math.max(8, top) + 'px';
            menu.style.transformOrigin = (left < x ? 'top right' : 'top left');
        }

        // ---- lifecycle -----------------------------------------------------------------------
        open(x, y, event) {
            if (this.destroyed) return this;
            if (this.isOpen) this.close(true);
            const items = typeof this._items === 'function' ? this._items(event, this._target) : this._items;
            if (!items || !items.length) return this;
            this._prevFocus = document.activeElement;
            this._pos = { x, y };
            const root = this._buildMenu(items, 0);
            root.id = 'chillcontextmenu-' + this._uid;
            document.body.appendChild(root);
            this.element = root;
            this._menus = [{ el: root, parentItemEl: null }];
            this._place(root, x || 0, y || 0);
            this.isOpen = true;
            requestAnimationFrameSafe(() => root.classList.add('chillcontextmenu-visible'));
            this._addGlobal();
            root.focus();
            if (event && (event.type === 'keydown' || (event.clientX === 0 && event.clientY === 0 && event.type === 'contextmenu'))) this._focusFirst(root);
            if (typeof this.options.onOpen === 'function') this.options.onOpen(this);
            this._emit('open');
            return this;
        }

        _addGlobal() {
            this._onDown = e => { if (!this._menus.some(m => m.el.contains(e.target))) this.close(); };
            this._onKey = e => this._keydown(e);
            this._onScroll = e => { if (!this._menus.some(m => m.el.contains(e.target))) this.close(); };
            this._onClose = () => this.close();
            document.addEventListener('mousedown', this._onDown, true);
            document.addEventListener('touchstart', this._onDown, true);
            document.addEventListener('keydown', this._onKey, true);
            window.addEventListener('scroll', this._onScroll, true);
            window.addEventListener('resize', this._onClose);
            window.addEventListener('blur', this._onClose);
        }

        _removeGlobal() {
            if (!this._onDown) return;
            document.removeEventListener('mousedown', this._onDown, true);
            document.removeEventListener('touchstart', this._onDown, true);
            document.removeEventListener('keydown', this._onKey, true);
            window.removeEventListener('scroll', this._onScroll, true);
            window.removeEventListener('resize', this._onClose);
            window.removeEventListener('blur', this._onClose);
            this._onDown = this._onKey = this._onScroll = this._onClose = null;
        }

        _currentMenu() {
            const active = document.activeElement;
            for (let i = this._menus.length - 1; i >= 0; i--) if (this._menus[i].el.contains(active)) return i;
            return this._menus.length - 1;
        }

        _keydown(e) {
            if (!this.isOpen) return;
            const lvl = this._currentMenu();
            const m = this._menus[lvl];
            if (!m) return;
            const menu = m.el;
            const items = this._items_of(menu);
            const cur = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('chillcontextmenu-item') && menu.contains(document.activeElement) ? document.activeElement : null;
            const idx = cur ? items.indexOf(cur) : -1;
            const stop = () => { e.preventDefault(); e.stopPropagation(); };
            switch (e.key) {
                case 'ArrowDown': stop(); if (items.length) this._focusItem(menu, items[(idx + 1) % items.length]); break;
                case 'ArrowUp': stop(); if (items.length) this._focusItem(menu, items[idx <= 0 ? items.length - 1 : idx - 1]); break;
                case 'Home': stop(); if (items.length) this._focusItem(menu, items[0]); break;
                case 'End': stop(); if (items.length) this._focusItem(menu, items[items.length - 1]); break;
                case 'ArrowRight':
                    if (cur && cur._chillItem.items && cur._chillItem.items.length) { stop(); this._openSub(menu, cur, true); }
                    else stop();
                    break;
                case 'ArrowLeft':
                    stop();
                    if (lvl > 0) { const parent = m.parentItemEl; this._closeFrom(lvl); if (parent) this._focusItem(this._menus[lvl - 1].el, parent); }
                    break;
                case 'Enter': case ' ':
                    stop();
                    if (cur) this._activate(menu, cur, e);
                    break;
                case 'Escape':
                    stop();
                    if (lvl > 0) { const parent = m.parentItemEl; this._closeFrom(lvl); if (parent) this._focusItem(this._menus[lvl - 1].el, parent); }
                    else this.close();
                    break;
                case 'Tab': this.close(); break;
                default:
                    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        const ch = e.key.toLowerCase();
                        const ordered = items.slice(idx + 1).concat(items.slice(0, idx + 1));
                        const hit = ordered.find(el => String(el._chillItem.label || '').toLowerCase().indexOf(ch) === 0);
                        if (hit) { stop(); this._focusItem(menu, hit); }
                    }
            }
        }

        close(silent) {
            if (!this.isOpen) return this;
            this.isOpen = false;
            this._clearTimers();
            this._removeGlobal();
            this._menus.forEach(m => { if (m.el.parentNode) m.el.parentNode.removeChild(m.el); });
            this._menus = [];
            this.element = null;
            const prev = this._prevFocus; this._prevFocus = null;
            if (silent !== true) {
                if (prev && prev.focus && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
                if (typeof this.options.onClose === 'function') this.options.onClose(this);
                this._emit('close');
            }
            return this;
        }

        _clearTimers() { this._timers.forEach(clearTimeout); this._timers = []; }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._listeners[evt]) this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : []; return this; }
        _emit(evt, arg) { (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this)); }

        destroy() {
            if (this.destroyed) return;
            this.close(true);
            this.destroyed = true;
            this._clearTimers();
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            this._listeners = {};
        }
    }

    function requestAnimationFrameSafe(fn) {
        if (window.requestAnimationFrame) window.requestAnimationFrame(fn); else setTimeout(fn, 16);
    }

    function create(options) { return new ChillContextMenuInstance(options); }

    /** Bind to element(s). Returns one instance managing all matched elements. */
    function attach(target, options) {
        return new ChillContextMenuInstance(Object.assign({}, options, { target }));
    }

    const ChillContextMenu = {
        version: VERSION,
        create,
        attach,
        init: attach,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillContextMenu;
    } else {
        window.ChillContextMenu = ChillContextMenu;
    }

})(typeof window !== 'undefined' ? window : this);
