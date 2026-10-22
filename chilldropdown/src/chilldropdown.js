/**
 * ChillDropdown - Zero-dependency Dropdown Menu Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const dd = ChillDropdown.init('#menuBtn', {
 *       items: [
 *           { label: 'Edit', value: 'edit', icon: '<svg>...</svg>', shortcut: 'E' },
 *           { type: 'checkbox', label: 'Show grid', value: 'grid', checked: true },
 *           { type: 'radio', label: 'Small', value: 's', checked: true }, { type: 'radio', label: 'Large', value: 'l' },
 *           { type: 'divider' }, { type: 'header', label: 'More' },
 *           { type: 'submenu', label: 'Share', items: [{ label: 'Link', value: 'link' }] },
 *           { label: 'Delete', value: 'del', danger: true, disabled: false }
 *       ],
 *       onSelect: (value, el, item) => {}
 *   });
 *   dd.open(); dd.close(); dd.setItems([...]); dd.destroy();
 *
 * Options: items [], position 'bottom-start' (bottom-start|bottom-end|top-start|top-end|left|right),
 *   triggerOn 'click' (click|hover|contextmenu), closeOnSelect true, closeOnOutsideClick true, label '' (aria-label of the menu),
 *   onSelect(value, element, itemData), onOpen(), onClose()
 * Items: label / description / shortcut are TEXT; icon = Node, text, or markup starting with "<" (sanitised).
 *   checkbox / radio items toggle their own state (radio: per consecutive run, or item.group).
 * Keyboard: ArrowDown/Up on the trigger opens; Up/Down/Home/End move; Right opens a submenu, Left closes it;
 *   Enter/Space activate; Esc closes (and refocuses the trigger); Tab closes; type-ahead.
 * ARIA: trigger aria-haspopup/expanded/controls; role=menu, menuitem, menuitemcheckbox, menuitemradio, aria-checked.
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chilldropdown_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chilldropdown-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chilldropdown-styles';
        style.textContent = `
      :root {
        --chilldropdown-bg: #ffffff;
        --chilldropdown-text: #171717;
        --chilldropdown-text-muted: #6b7280;
        --chilldropdown-border: #e5e5e5;
        --chilldropdown-hover: #f5f5f5;
        --chilldropdown-active: #eff6ff;
        --chilldropdown-danger: #ef4444;
        --chilldropdown-danger-hover: #fef2f2;
        --chilldropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        --chilldropdown-divider: #e5e5e5;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilldropdown-bg: #262626;
          --chilldropdown-text: #fafafa;
          --chilldropdown-text-muted: #9ca3af;
          --chilldropdown-border: #404040;
          --chilldropdown-hover: #333333;
          --chilldropdown-active: #1e3a5f;
          --chilldropdown-danger-hover: #450a0a;
          --chilldropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          --chilldropdown-divider: #404040;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilldropdown-bg: #262626;
        --chilldropdown-text: #fafafa;
        --chilldropdown-text-muted: #9ca3af;
        --chilldropdown-border: #404040;
        --chilldropdown-hover: #333333;
        --chilldropdown-active: #1e3a5f;
        --chilldropdown-danger-hover: #450a0a;
        --chilldropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        --chilldropdown-divider: #404040;
      }

      .chilldropdown-container {
        position: relative;
        display: inline-block;
      }

      .chilldropdown-trigger {
        cursor: pointer;
      }

      .chilldropdown-menu {
        position: absolute;
        min-width: 180px;
        padding: 4px;
        background: var(--chilldropdown-bg);
        border: 1px solid var(--chilldropdown-border);
        border-radius: 8px;
        box-shadow: var(--chilldropdown-shadow);
        z-index: 10001;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px) scale(0.95);
        transition: all 0.15s ease;
      }

      .chilldropdown-container.open .chilldropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      /* Positions */
      .chilldropdown-menu-bottom-start {
        top: 100%;
        left: 0;
        margin-top: 4px;
      }

      .chilldropdown-menu-bottom-end {
        top: 100%;
        right: 0;
        margin-top: 4px;
      }

      .chilldropdown-menu-top-start {
        bottom: 100%;
        left: 0;
        margin-bottom: 4px;
      }

      .chilldropdown-menu-top-end {
        bottom: 100%;
        right: 0;
        margin-bottom: 4px;
      }

      .chilldropdown-menu-left {
        right: 100%;
        top: 0;
        margin-right: 4px;
      }

      .chilldropdown-menu-right {
        left: 100%;
        top: 0;
        margin-left: 4px;
      }

      .chilldropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        font-size: 14px;
        color: var(--chilldropdown-text);
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s ease;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
      }

      .chilldropdown-item:hover {
        background: var(--chilldropdown-hover);
      }

      .chilldropdown-item:focus {
        outline: none;
        background: var(--chilldropdown-hover);
      }

      .chilldropdown-item:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }

      .chilldropdown-item.active {
        background: var(--chilldropdown-active);
      }

      .chilldropdown-item.disabled {
        color: var(--chilldropdown-text-muted);
        cursor: not-allowed;
        opacity: 0.5;
      }

      .chilldropdown-item.disabled:hover {
        background: transparent;
      }

      .chilldropdown-item.danger {
        color: var(--chilldropdown-danger);
      }

      .chilldropdown-item.danger:hover {
        background: var(--chilldropdown-danger-hover);
      }

      .chilldropdown-item-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .chilldropdown-item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .chilldropdown-item-label {
        font-weight: 500;
      }

      .chilldropdown-item-description {
        font-size: 12px;
        color: var(--chilldropdown-text-muted);
      }

      .chilldropdown-item-shortcut {
        font-size: 12px;
        color: var(--chilldropdown-text-muted);
        padding: 2px 6px;
        background: var(--chilldropdown-hover);
        border-radius: 4px;
        font-family: monospace;
      }

      .chilldropdown-divider {
        height: 1px;
        background: var(--chilldropdown-divider);
        margin: 4px 0;
      }

      .chilldropdown-header {
        padding: 8px 12px 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--chilldropdown-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Submenu */
      .chilldropdown-submenu {
        position: relative;
      }

      .chilldropdown-submenu-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chilldropdown-submenu-trigger::after {
        content: '';
        width: 0;
        height: 0;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        border-left: 4px solid currentColor;
      }

      .chilldropdown-submenu .chilldropdown-menu {
        left: 100%;
        top: -4px;
        margin-left: 4px;
      }

      .chilldropdown-submenu.open > .chilldropdown-menu,
      .chilldropdown-submenu:hover > .chilldropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      /* Checkbox & Radio Items */
      .chilldropdown-item-check {
        width: 16px;
        height: 16px;
        border: 1px solid var(--chilldropdown-border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chilldropdown-item-check.checked {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }

      .chilldropdown-item-radio {
        width: 16px;
        height: 16px;
        border: 1px solid var(--chilldropdown-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chilldropdown-item-radio.checked {
        border-color: #3b82f6;
      }

      .chilldropdown-item-radio.checked::after {
        content: '';
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
      }

      .chilldropdown-header {
        display: block;
      }

      @media (prefers-reduced-motion: reduce) {
        .chilldropdown-menu, .chilldropdown-item { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form'];

    function sanitizeHtml(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(html);
        const root = tpl.content;
        BLOCKED_TAGS.forEach(t => root.querySelectorAll(t).forEach(n => n.parentNode && n.parentNode.removeChild(n)));
        root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(a => {
                const name = a.name.toLowerCase();
                const val = a.value.replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
                if (name.indexOf('on') === 0 || name === 'srcdoc' ||
                    ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action' || name === 'formaction') &&
                        (val.indexOf('javascript:') === 0 || val.indexOf('vbscript:') === 0 || val.indexOf('data:text/html') === 0))) {
                    el.removeAttribute(a.name);
                }
            });
        });
        return root;
    }

    function fillIcon(el, icon) {
        if (icon && icon.nodeType) el.appendChild(icon.cloneNode(true));
        else if (typeof icon === 'string' && icon.trim().charAt(0) === '<') el.appendChild(sanitizeHtml(icon));
        else el.textContent = String(icon);
    }

    function checkSvg() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '3');
        svg.setAttribute('width', '12');
        svg.setAttribute('height', '12');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', 'M20 6L9 17l-5-5');
        svg.appendChild(p);
        return svg;
    }

    function span(cls, text) {
        const s = document.createElement('span');
        s.className = cls;
        if (text !== undefined) s.textContent = String(text);
        return s;
    }

    // ---- Instance -----------------------------------------------------------

    class ChillDropdownInstance {
        constructor(trigger, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.triggerEl = typeof trigger === 'string'
                ? document.querySelector(trigger)
                : trigger;

            this.options = {
                items: options.items || [],
                position: options.position || 'bottom-start',
                triggerOn: options.triggerOn || 'click',
                closeOnSelect: options.closeOnSelect !== false,
                closeOnOutsideClick: options.closeOnOutsideClick !== false,
                onSelect: options.onSelect || null,
                onOpen: options.onOpen || null,
                onClose: options.onClose || null,
                label: options.label || ''
            };

            this.isOpen = false;
            this._cleanup = [];
            this._uid = ++uid;
            this._typeahead = '';

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        render() {
            const container = document.createElement('div');
            container.className = 'chilldropdown-container';

            const t = this.triggerEl;
            this._prevAttrs = {
                haspopup: t.getAttribute('aria-haspopup'),
                expanded: t.getAttribute('aria-expanded'),
                controls: t.getAttribute('aria-controls')
            };
            t.classList.add('chilldropdown-trigger');
            this._marker = document.createComment('chilldropdown');
            t.parentNode.insertBefore(this._marker, t);
            t.parentNode.insertBefore(container, t);
            container.appendChild(t);

            const menu = document.createElement('div');
            menu.className = `chilldropdown-menu chilldropdown-menu-${this.options.position}`;
            menu.id = 'chilldropdown-menu-' + this._uid;
            menu.setAttribute('role', 'menu');
            if (this.options.label) menu.setAttribute('aria-label', String(this.options.label));
            this.buildItems(this.options.items, menu);
            container.appendChild(menu);

            if (this.options.triggerOn !== 'contextmenu') {
                t.setAttribute('aria-haspopup', 'menu');
                t.setAttribute('aria-expanded', 'false');
                t.setAttribute('aria-controls', menu.id);
            }

            this.container = container;
            this.menu = menu;
        }

        // Build DOM (text only: labels/descriptions/shortcuts via textContent, icons sanitised)
        buildItems(items, menuEl) {
            menuEl.textContent = '';
            let radioGroupIdx = 0;
            items.forEach(item => {
                if (item.type === 'divider') {
                    const d = document.createElement('div');
                    d.className = 'chilldropdown-divider';
                    d.setAttribute('role', 'separator');
                    menuEl.appendChild(d);
                    return;
                }
                if (item.type === 'header') {
                    const h = span('chilldropdown-header', item.label);
                    h.setAttribute('role', 'presentation');
                    menuEl.appendChild(h);
                    return;
                }
                if (item.type === 'submenu') {
                    const wrap = document.createElement('div');
                    wrap.className = 'chilldropdown-submenu';
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chilldropdown-item chilldropdown-submenu-trigger';
                    btn.tabIndex = -1;
                    btn.setAttribute('role', 'menuitem');
                    btn.setAttribute('aria-haspopup', 'menu');
                    btn.setAttribute('aria-expanded', 'false');
                    if (item.icon) { const ic = span('chilldropdown-item-icon'); fillIcon(ic, item.icon); btn.appendChild(ic); }
                    btn.appendChild(span('chilldropdown-item-label', item.label));
                    const sub = document.createElement('div');
                    sub.className = 'chilldropdown-menu';
                    sub.setAttribute('role', 'menu');
                    sub.setAttribute('aria-label', String(item.label));
                    this.buildItems(item.items || [], sub);
                    wrap.appendChild(btn);
                    wrap.appendChild(sub);
                    menuEl.appendChild(wrap);
                    return;
                }

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.tabIndex = -1;
                btn.className = 'chilldropdown-item' + (item.disabled ? ' disabled' : '') + (item.danger ? ' danger' : '') + (item.active ? ' active' : '');
                btn.dataset.value = item.value === undefined || item.value === null ? '' : String(item.value);
                btn._chillItem = item;
                if (item.disabled) btn.disabled = true;

                if (item.type === 'checkbox') {
                    btn.setAttribute('role', 'menuitemcheckbox');
                    btn.setAttribute('aria-checked', item.checked ? 'true' : 'false');
                    btn.appendChild(span('chilldropdown-item-check' + (item.checked ? ' checked' : '')));
                    if (item.checked) btn.firstChild.appendChild(checkSvg());
                } else if (item.type === 'radio') {
                    btn.setAttribute('role', 'menuitemradio');
                    btn.setAttribute('aria-checked', item.checked ? 'true' : 'false');
                    btn.appendChild(span('chilldropdown-item-radio' + (item.checked ? ' checked' : '')));
                    btn._chillGroup = item.group === undefined ? 'g' + radioGroupIdx : item.group;
                } else {
                    btn.setAttribute('role', 'menuitem');
                    if (item.icon) { const ic = span('chilldropdown-item-icon'); fillIcon(ic, item.icon); btn.appendChild(ic); }
                }
                if (item.type !== 'radio') radioGroupIdx++;

                const content = span('chilldropdown-item-content');
                content.appendChild(span('chilldropdown-item-label', item.label));
                if (item.description) content.appendChild(span('chilldropdown-item-description', item.description));
                btn.appendChild(content);
                if (item.shortcut) btn.appendChild(span('chilldropdown-item-shortcut', item.shortcut));
                menuEl.appendChild(btn);
            });
        }

        // direct focusable entries of one menu element
        entriesOf(menuEl) {
            const out = [];
            Array.from(menuEl.children).forEach(ch => {
                if (ch.classList.contains('chilldropdown-item') && !ch.disabled) out.push(ch);
                else if (ch.classList.contains('chilldropdown-submenu')) out.push(ch.firstElementChild);
            });
            return out;
        }

        bindEvents() {
            const on = (target, type, fn, opts) => {
                target.addEventListener(type, fn, opts);
                this._cleanup.push(() => target.removeEventListener(type, fn, opts));
            };
            const mode = this.options.triggerOn;

            if (mode === 'click') {
                on(this.triggerEl, 'click', () => this.toggle());
            } else if (mode === 'hover') {
                on(this.container, 'mouseenter', () => this.open());
                on(this.container, 'mouseleave', () => this.close());
                on(this.triggerEl, 'click', () => this.toggle());
            } else if (mode === 'contextmenu') {
                on(this.triggerEl, 'contextmenu', (e) => {
                    e.preventDefault();
                    this.open();
                });
            }

            // submenus open on hover
            on(this.menu, 'mouseover', (e) => {
                const sm = e.target.closest ? e.target.closest('.chilldropdown-submenu') : null;
                if (sm) this.openSubmenu(sm);
            });
            on(this.menu, 'click', (e) => {
                const item = e.target.closest ? e.target.closest('.chilldropdown-item') : null;
                if (!item || item.disabled) return;
                if (item.classList.contains('chilldropdown-submenu-trigger')) {
                    this.openSubmenu(item.parentNode, true);
                    return;
                }
                this.activate(item);
            });
            on(this.container, 'keydown', (e) => this.onKeyDown(e));
        }

        activate(item) {
            const data = item._chillItem;
            if (data) {
                if (data.type === 'checkbox') {
                    data.checked = !data.checked;
                    this.syncChecked(item, data);
                } else if (data.type === 'radio') {
                    Array.from(item.parentNode.children).forEach(sib => {
                        if (sib._chillItem && sib._chillItem.type === 'radio' && sib._chillGroup === item._chillGroup) {
                            sib._chillItem.checked = sib === item;
                            this.syncChecked(sib, sib._chillItem);
                        }
                    });
                }
            }
            const value = item.dataset.value;
            if (this.options.onSelect) {
                this.options.onSelect(value, item, data);
            }
            if (this.options.closeOnSelect) {
                this.close();
                if (this.triggerEl.focus && this.container.contains(document.activeElement) && document.activeElement !== this.triggerEl) this.triggerEl.focus();
            }
        }

        syncChecked(btn, data) {
            btn.setAttribute('aria-checked', data.checked ? 'true' : 'false');
            const ind = btn.firstChild;
            ind.classList.toggle('checked', !!data.checked);
            if (data.type === 'checkbox') {
                ind.textContent = '';
                if (data.checked) ind.appendChild(checkSvg());
            }
        }

        openSubmenu(wrap, focusFirst) {
            Array.from(wrap.parentNode.children).forEach(sib => {
                if (sib !== wrap && sib.classList.contains('chilldropdown-submenu')) this.closeSubmenu(sib);
            });
            wrap.classList.add('open');
            wrap.firstElementChild.setAttribute('aria-expanded', 'true');
            if (focusFirst) {
                const first = this.entriesOf(wrap.lastElementChild)[0];
                if (first) first.focus();
            }
        }

        closeSubmenu(wrap) {
            wrap.classList.remove('open');
            wrap.firstElementChild.setAttribute('aria-expanded', 'false');
            wrap.querySelectorAll('.chilldropdown-submenu.open').forEach(n => {
                n.classList.remove('open');
                n.firstElementChild.setAttribute('aria-expanded', 'false');
            });
        }

        onKeyDown(e) {
            const key = e.key;
            const fromTrigger = e.target === this.triggerEl;
            this._wasKeyboard = true;
            if (!this.isOpen) {
                if (fromTrigger && this.options.triggerOn !== 'contextmenu' && (key === 'ArrowDown' || key === 'ArrowUp')) {
                    e.preventDefault();
                    this.open();
                    const entries = this.entriesOf(this.menu);
                    const t = key === 'ArrowUp' ? entries[entries.length - 1] : entries[0];
                    if (t) t.focus();
                } else if (fromTrigger && this.options.triggerOn === 'click' && (key === 'Enter' || key === ' ') && this.triggerEl.tagName !== 'BUTTON' && this.triggerEl.tagName !== 'A') {
                    e.preventDefault();
                    this.open();
                    const f = this.entriesOf(this.menu)[0];
                    if (f) f.focus();
                }
                return;
            }
            if (key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                const sub = e.target.closest ? e.target.closest('.chilldropdown-submenu .chilldropdown-menu') : null;
                if (sub) {
                    const wrap = sub.parentNode;
                    this.closeSubmenu(wrap);
                    wrap.firstElementChild.focus();
                    return;
                }
                this.close();
                this.triggerEl.focus();
                return;
            }
            if (key === 'Tab') { this.close(); return; }

            const item = e.target.closest ? e.target.closest('.chilldropdown-item') : null;
            if (fromTrigger) {
                if (key === 'ArrowDown') { e.preventDefault(); const f = this.entriesOf(this.menu)[0]; if (f) f.focus(); }
                else if (key === 'ArrowUp') { e.preventDefault(); const en = this.entriesOf(this.menu); if (en.length) en[en.length - 1].focus(); }
                return;
            }
            if (!item) return;
            const menuEl = item.closest('.chilldropdown-menu');
            const entries = this.entriesOf(menuEl);
            const idx = entries.indexOf(item);
            const focusAt = (i) => { if (entries[i]) entries[i].focus(); };
            switch (key) {
                case 'ArrowDown': e.preventDefault(); focusAt((idx + 1) % entries.length); break;
                case 'ArrowUp': e.preventDefault(); focusAt((idx - 1 + entries.length) % entries.length); break;
                case 'Home': e.preventDefault(); focusAt(0); break;
                case 'End': e.preventDefault(); focusAt(entries.length - 1); break;
                case 'ArrowRight':
                    if (item.classList.contains('chilldropdown-submenu-trigger')) { e.preventDefault(); this.openSubmenu(item.parentNode, true); }
                    break;
                case 'ArrowLeft': {
                    const wrap = menuEl.parentNode && menuEl.parentNode.classList && menuEl.parentNode.classList.contains('chilldropdown-submenu') ? menuEl.parentNode : null;
                    if (wrap) { e.preventDefault(); this.closeSubmenu(wrap); wrap.firstElementChild.focus(); }
                    break;
                }
                case 'Enter': case ' ':
                    e.preventDefault();
                    if (item.classList.contains('chilldropdown-submenu-trigger')) this.openSubmenu(item.parentNode, true);
                    else this.activate(item);
                    break;
                default:
                    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        window.clearTimeout(this._taTimer);
                        this._typeahead += key.toLowerCase();
                        this._taTimer = window.setTimeout(() => { this._typeahead = ''; }, 600);
                        const n = entries.length;
                        for (let s = 0; s < n; s++) {
                            const c = entries[(idx + (this._typeahead.length === 1 ? 1 : 0) + s) % n];
                            const lbl = c.querySelector('.chilldropdown-item-label');
                            if (lbl && lbl.textContent.toLowerCase().indexOf(this._typeahead) === 0) { c.focus(); break; }
                        }
                    }
            }
        }

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;
            this.container.classList.add('open');
            this.triggerEl.setAttribute('aria-expanded', 'true');

            if (this.options.closeOnOutsideClick) {
                this._docClick = (e) => {
                    // composedPath: the clicked node may have been re-rendered/detached by a handler
                    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
                    if (!this.container.contains(e.target) && path.indexOf(this.container) < 0) this.close();
                };
                document.addEventListener('click', this._docClick);
            }

            if (this.options.onOpen) {
                this.options.onOpen();
            }
        }

        close() {
            if (this._docClick) {
                document.removeEventListener('click', this._docClick);
                this._docClick = null;
            }
            if (!this.isOpen) return;
            this.isOpen = false;
            this._wasKeyboard = false;
            this.container.classList.remove('open');
            this.triggerEl.setAttribute('aria-expanded', 'false');
            this.menu.querySelectorAll('.chilldropdown-submenu.open').forEach(n => this.closeSubmenu(n));

            if (this.options.onClose) {
                this.options.onClose();
            }
        }

        setItems(items) {
            this.options.items = items;
            this.buildItems(items, this.menu);
        }

        setPosition(position) {
            this.menu.classList.remove(`chilldropdown-menu-${this.options.position}`);
            this.menu.classList.add(`chilldropdown-menu-${position}`);
            this.options.position = position;
        }

        destroy() {
            if (!this.container) return;
            this.close();
            window.clearTimeout(this._taTimer);
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            const t = this.triggerEl;
            t.classList.remove('chilldropdown-trigger');
            const restore = (name, v) => { if (v === null || v === undefined) t.removeAttribute(name); else t.setAttribute(name, v); };
            restore('aria-haspopup', this._prevAttrs.haspopup);
            restore('aria-expanded', this._prevAttrs.expanded);
            restore('aria-controls', this._prevAttrs.controls);
            this.container.parentNode.insertBefore(t, this.container);
            if (this._marker && this._marker.parentNode) this._marker.parentNode.removeChild(this._marker);
            this.container.remove();
            this.container = null;
        }
    }

    const ChillDropdown = {
        version: VERSION,

        init(trigger, options) {
            return new ChillDropdownInstance(trigger, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillDropdown;
    } else {
        window.ChillDropdown = ChillDropdown;
    }

})(typeof window !== 'undefined' ? window : this);
