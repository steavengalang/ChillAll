/**
 * ChillSidebar - Zero-dependency Collapsible Sidebar Component
 *
 * @example
 *   const sb = ChillSidebar.init('#sidebar', {
 *     brand: { name: 'Acme', logo: '/logo.svg', href: '/' },
 *     items: [
 *       { type: 'section', label: 'Main', items: [
 *         { id: 'home', label: 'Home', href: '/', icon: '🏠' },
 *         { id: 'reports', label: 'Reports', icon: '📊', children: [{ id: 'daily', label: 'Daily', href: '/daily' }] },
 *         { id: 'inbox', label: 'Inbox', href: '/inbox', badge: 4 }
 *       ] }
 *     ],
 *     activeItem: 'home', collapsed: false, storageKey: 'sidebar-collapsed',
 *     mobileToggle: '#menu-button',                 // optional external button that opens the drawer on small screens
 *     onItemClick: (id, event) => {}, onCollapse: collapsed => {}
 *   });
 *   sb.collapse(); sb.expand(); sb.toggleCollapse(); sb.openMobile(); sb.closeMobile(); sb.setActiveItem('daily'); sb.destroy();
 *
 * Mobile (<= 768px): the sidebar becomes an off-canvas drawer with a backdrop. While closed it is `visibility: hidden` (no
 * tab stops / screen reader noise); opening moves focus into it, Esc / backdrop click / choosing an item closes it, page
 * scrolling is locked and the previous focus + overflow are restored.
 * Accessibility: <aside><nav aria-label>, aria-current="page" on the active item, aria-expanded + aria-controls on groups and
 * on the collapse button, closed submenus are not focusable, ArrowUp/ArrowDown/Home/End move between items, collapsed items keep
 * their accessible name (label is visually hidden, plus a native `title` tooltip).
 *
 * Security: labels, brand name, badges, hrefs (javascript:/data:/vbscript: are neutralised) are text/attributes. `icon`
 * strings are text unless options.html === true; Element icons are always accepted. `footer` accepts text or a Node;
 * use `footerHtml` for explicit (trusted) HTML, or set html: true to treat `footer` strings as HTML (as in 1.0).
 *
 * Options: brand {name, logo, href}, items [], footer, footerHtml, collapsed false, collapsible true, activeItem null,
 *   storageKey null (persist collapsed state), mobileToggle null, ariaLabel 'Sidebar', html false,
 *   onItemClick(id, event), onCollapse(isCollapsed), onMobileToggle(isOpen)
 * Items: { id, label, href, icon, badge, onClick(event), children: [{ id, label, href }] } | { type: 'section', label, items }
 * Instance: sidebar, overlay, isCollapsed, isMobileOpen, collapse(), expand(), toggleCollapse(), openMobile(), closeMobile(),
 *   toggleMobile(), setActiveItem(id), on('collapse' | 'mobile', fn) -> off, destroy()
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillsidebar_css_injected__';
    const MOBILE_MAX = 768;
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chillsidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillsidebar-styles';
        style.textContent = `
      :root {
        --chillsidebar-bg: #ffffff;
        --chillsidebar-text: #171717;
        --chillsidebar-text-muted: #6b7280;
        --chillsidebar-border: #e5e5e5;
        --chillsidebar-hover: #f5f5f5;
        --chillsidebar-active: #eff6ff;
        --chillsidebar-active-text: #3b82f6;
        --chillsidebar-width: 260px;
        --chillsidebar-collapsed-width: 72px;
        --chillsidebar-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
        --chillsidebar-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillsidebar-bg: #171717;
          --chillsidebar-text: #fafafa;
          --chillsidebar-text-muted: #a3a3a3;
          --chillsidebar-border: #262626;
          --chillsidebar-hover: #262626;
          --chillsidebar-active: #1e3a5f;
          --chillsidebar-active-text: #60a5fa;
          --chillsidebar-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillsidebar-bg: #171717;
        --chillsidebar-text: #fafafa;
        --chillsidebar-text-muted: #a3a3a3;
        --chillsidebar-border: #262626;
        --chillsidebar-hover: #262626;
        --chillsidebar-active: #1e3a5f;
        --chillsidebar-active-text: #60a5fa;
        --chillsidebar-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
      }

      .chillsidebar {
        position: fixed; top: 0; left: 0; bottom: 0; width: var(--chillsidebar-width);
        background: var(--chillsidebar-bg); color: var(--chillsidebar-text);
        border-right: 1px solid var(--chillsidebar-border);
        display: flex; flex-direction: column; transition: width 0.3s ease; z-index: 100; overflow: hidden; box-sizing: border-box;
      }
      .chillsidebar.collapsed { width: var(--chillsidebar-collapsed-width); }

      .chillsidebar-header { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 16px; border-bottom: 1px solid var(--chillsidebar-border); flex-shrink: 0; }

      .chillsidebar-brand { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; color: var(--chillsidebar-text); text-decoration: none; white-space: nowrap; overflow: hidden; border-radius: 6px; }
      .chillsidebar-brand-logo { width: 32px; height: 32px; flex-shrink: 0; }
      .chillsidebar.collapsed .chillsidebar-brand span { display: none; }

      .chillsidebar a:focus, .chillsidebar button:focus { outline: none; }
      .chillsidebar a:focus-visible, .chillsidebar button:focus-visible { box-shadow: 0 0 0 3px var(--chillsidebar-ring); }

      .chillsidebar-toggle {
        display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; background: none; border: none;
        border-radius: 6px; cursor: pointer; color: var(--chillsidebar-text-muted); transition: background 0.15s ease, color 0.15s ease; flex-shrink: 0;
      }
      .chillsidebar-toggle:hover { background: var(--chillsidebar-hover); color: var(--chillsidebar-text); }
      .chillsidebar.collapsed .chillsidebar-toggle { transform: rotate(180deg); }

      .chillsidebar-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px; }
      .chillsidebar-section { margin-bottom: 16px; }
      .chillsidebar-section-title { padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--chillsidebar-text-muted); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; }
      .chillsidebar.collapsed .chillsidebar-section-title { text-align: center; padding: 8px 0; }
      .chillsidebar.collapsed .chillsidebar-section-title span { display: none; }

      .chillsidebar-item {
        display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 10px 12px; box-sizing: border-box;
        font: inherit; font-size: 14px; font-weight: 500; color: var(--chillsidebar-text); text-decoration: none;
        border-radius: 8px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; white-space: nowrap; overflow: hidden;
        border: none; background: none; width: 100%; text-align: left;
      }
      .chillsidebar-item:hover { background: var(--chillsidebar-hover); }
      .chillsidebar-item.active { background: var(--chillsidebar-active); color: var(--chillsidebar-active-text); }
      .chillsidebar-item-icon { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; }
      .chillsidebar-item-icon svg { width: 100%; height: 100%; }
      .chillsidebar.collapsed .chillsidebar-item { justify-content: center; padding: 12px; }
      /* visually hide (not display:none) so collapsed items keep their accessible name */
      .chillsidebar.collapsed .chillsidebar-item-label {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
      .chillsidebar-item-label { overflow: hidden; text-overflow: ellipsis; }

      .chillsidebar-item-badge { margin-left: auto; padding: 2px 8px; font-size: 11px; font-weight: 600; background: var(--chillsidebar-active-text); color: #fff; border-radius: 10px; }
      .chillsidebar.collapsed .chillsidebar-item-badge { display: none; }

      /* Submenu (closed submenus are hidden from keyboard and screen readers) */
      .chillsidebar-submenu { margin-left: 32px; padding-left: 12px; border-left: 1px solid var(--chillsidebar-border); overflow: hidden; max-height: 0; visibility: hidden; transition: max-height 0.3s ease, visibility 0s linear 0.3s; }
      .chillsidebar-submenu.open { max-height: 500px; visibility: visible; transition: max-height 0.3s ease, visibility 0s; }
      .chillsidebar.collapsed .chillsidebar-submenu { display: none; }

      .chillsidebar-submenu-item { display: block; padding: 8px 12px; min-height: 32px; box-sizing: border-box; font-size: 13px; color: var(--chillsidebar-text-muted); text-decoration: none; border-radius: 6px; transition: background 0.15s ease, color 0.15s ease; }
      .chillsidebar-submenu-item:hover { color: var(--chillsidebar-text); background: var(--chillsidebar-hover); }
      .chillsidebar-submenu-item.active { color: var(--chillsidebar-active-text); }

      .chillsidebar-item-arrow { width: 16px; height: 16px; margin-left: auto; transition: transform 0.2s ease; flex-shrink: 0; }
      .chillsidebar-item.expanded .chillsidebar-item-arrow { transform: rotate(90deg); }
      .chillsidebar.collapsed .chillsidebar-item-arrow { display: none; }

      .chillsidebar-footer { padding: 12px; border-top: 1px solid var(--chillsidebar-border); flex-shrink: 0; }
      .chillsidebar.collapsed .chillsidebar-footer { overflow: hidden; }

      /* Overlay for mobile */
      .chillsidebar-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s; z-index: 99; }
      .chillsidebar-overlay.visible { opacity: 1; visibility: visible; }

      /* Mobile: off-canvas drawer */
      @media (max-width: ${MOBILE_MAX}px) {
        .chillsidebar { transform: translateX(-100%); visibility: hidden; box-shadow: var(--chillsidebar-shadow); transition: transform 0.3s ease, visibility 0s linear 0.3s; max-width: 85vw; }
        .chillsidebar.open { transform: translateX(0); visibility: visible; transition: transform 0.3s ease, visibility 0s; }
        .chillsidebar.collapsed { width: var(--chillsidebar-width); }
        .chillsidebar.collapsed .chillsidebar-item-label { position: static; width: auto; height: auto; margin: 0; clip: auto; overflow: hidden; }
        .chillsidebar.collapsed .chillsidebar-brand span, .chillsidebar.collapsed .chillsidebar-section-title span { display: inline; }
        .chillsidebar.collapsed .chillsidebar-item { justify-content: flex-start; padding: 10px 12px; }
        .chillsidebar.collapsed .chillsidebar-item-badge, .chillsidebar.collapsed .chillsidebar-item-arrow { display: inline-block; }
        .chillsidebar.collapsed .chillsidebar-submenu { display: block; }
        .chillsidebar-toggle { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .chillsidebar, .chillsidebar-overlay, .chillsidebar-submenu, .chillsidebar-item, .chillsidebar-item-arrow, .chillsidebar-toggle { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function safeUrl(url, dflt) {
        const u = String(url == null ? '' : url).trim();
        if (!u) return dflt;
        const probe = u.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
        return /^(javascript|data|vbscript):/.test(probe) ? '#' : u;
    }

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    function svg(attrs, paths) {
        const NS = 'http://www.w3.org/2000/svg';
        const s = document.createElementNS(NS, 'svg');
        Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
        paths.forEach(function (d) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.appendChild(p); });
        return s;
    }

    function readStore(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
    function writeStore(key, v) { try { window.localStorage.setItem(key, v); } catch (e) { /* blocked */ } }

    class ChillSidebarInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = Object.assign({
                brand: null, items: [], footer: null, footerHtml: null, collapsed: false, collapsible: true, activeItem: null,
                storageKey: null, mobileToggle: null, ariaLabel: 'Sidebar', html: false,
                onItemClick: null, onCollapse: null, onMobileToggle: null
            }, options);
            this.options.collapsible = options.collapsible !== false;

            let collapsed = !!this.options.collapsed;
            if (this.options.storageKey) {
                const s = readStore(this.options.storageKey);
                if (s === 'true') collapsed = true; else if (s === 'false') collapsed = false;
            }
            this.isCollapsed = collapsed;
            this.isMobileOpen = false;
            this.id = 'chillsidebar-' + (++uid);
            this._handlers = { collapse: [], mobile: [] };
            this._listeners = [];
            this._prevOverflow = null;
            this._prevFocus = null;
            this._destroyed = false;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _on(target, type, fn, opts) {
            target.addEventListener(type, fn, opts);
            this._listeners.push([target, type, fn, opts]);
        }

        _icon(icon) {
            const span = el('span', 'chillsidebar-item-icon');
            span.setAttribute('aria-hidden', 'true');
            if (icon && icon.nodeType) span.appendChild(icon.cloneNode(true));
            else if (this.options.html === true) span.innerHTML = String(icon);
            else span.textContent = String(icon);
            return span;
        }

        render() {
            const o = this.options;
            const sidebar = document.createElement('aside');
            sidebar.className = 'chillsidebar';
            sidebar.id = this.id;
            if (this.isCollapsed) sidebar.classList.add('collapsed');

            // Header
            const header = el('div', 'chillsidebar-header');
            if (o.brand) {
                const a = el('a', 'chillsidebar-brand');
                a.setAttribute('href', safeUrl(o.brand.href, '/'));
                if (o.brand.logo) {
                    const img = el('img', 'chillsidebar-brand-logo');
                    img.setAttribute('src', safeUrl(o.brand.logo, ''));
                    img.setAttribute('alt', '');
                    a.appendChild(img);
                }
                if (o.brand.name) a.appendChild(el('span', '', String(o.brand.name)));
                header.appendChild(a);
            }
            if (o.collapsible) {
                const t = el('button', 'chillsidebar-toggle');
                t.type = 'button';
                t.setAttribute('aria-label', 'Collapse sidebar');
                t.setAttribute('aria-expanded', this.isCollapsed ? 'false' : 'true');
                t.setAttribute('aria-controls', this.id + '-content');
                t.appendChild(svg({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true', focusable: 'false' }, ['M11 17l-5-5 5-5M18 17l-5-5 5-5']));
                header.appendChild(t);
            }
            sidebar.appendChild(header);

            // Content (navigation landmark)
            const nav = el('nav', 'chillsidebar-content');
            nav.id = this.id + '-content';
            nav.setAttribute('aria-label', o.ariaLabel);
            this.renderItems(o.items, nav);
            sidebar.appendChild(nav);

            // Footer
            if (o.footer || o.footerHtml) {
                const f = el('div', 'chillsidebar-footer');
                if (o.footerHtml) f.innerHTML = String(o.footerHtml);                 // explicit HTML (trusted)
                else if (o.footer && o.footer.nodeType) f.appendChild(o.footer);
                else if (o.html === true) f.innerHTML = String(o.footer);
                else f.textContent = String(o.footer);
                sidebar.appendChild(f);
            }

            const overlay = el('div', 'chillsidebar-overlay');

            if (this.element && this.element.parentNode) {
                this.element.parentNode.insertBefore(overlay, this.element);
                this.element.parentNode.replaceChild(sidebar, this.element);
                this._replaced = true;
            }

            this.sidebar = sidebar;
            this.overlay = overlay;
            this.nav = nav;
            this.toggleBtn = sidebar.querySelector('.chillsidebar-toggle');
            this._syncToggleLabel();
        }

        _syncToggleLabel() {
            if (!this.toggleBtn) return;
            this.toggleBtn.setAttribute('aria-expanded', this.isCollapsed ? 'false' : 'true');
            this.toggleBtn.setAttribute('aria-label', this.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
        }

        renderItems(items, parent) {
            const o = this.options;
            (items || []).forEach(function (item, idx) {
                if (item.type === 'section') {
                    const sec = el('div', 'chillsidebar-section');
                    const title = el('div', 'chillsidebar-section-title');
                    title.appendChild(el('span', '', String(item.label == null ? '' : item.label)));
                    sec.appendChild(title);
                    this.renderItems(item.items || [], sec);
                    parent.appendChild(sec);
                    return;
                }
                const label = String(item.label == null ? '' : item.label);
                if (item.children) {
                    const hasActiveChild = item.children.some(function (c) { return o.activeItem !== null && o.activeItem === c.id; });
                    const isExpanded = o.activeItem === item.id || hasActiveChild;
                    const subId = this.id + '-sub-' + (item.id !== undefined ? String(item.id).replace(/[^\w-]/g, '_') : 'g' + (++uid));
                    const btn = el('button', 'chillsidebar-item' + (isExpanded ? ' expanded' : ''));
                    btn.type = 'button';
                    btn.setAttribute('data-id', item.id === undefined ? '' : String(item.id));
                    btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                    btn.setAttribute('aria-controls', subId);
                    btn.setAttribute('title', label);
                    if (item.icon) btn.appendChild(this._icon(item.icon));
                    btn.appendChild(el('span', 'chillsidebar-item-label', label));
                    btn.appendChild(svg({ 'class': 'chillsidebar-item-arrow', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true', focusable: 'false' }, ['M9 18l6-6-6-6']));
                    parent.appendChild(btn);
                    const sub = el('div', 'chillsidebar-submenu' + (isExpanded ? ' open' : ''));
                    sub.id = subId;
                    item.children.forEach(function (child) {
                        const a = el('a', 'chillsidebar-submenu-item' + (o.activeItem !== null && o.activeItem === child.id ? ' active' : ''), String(child.label == null ? '' : child.label));
                        a.setAttribute('href', safeUrl(child.href, '#'));
                        a.setAttribute('data-id', child.id === undefined ? '' : String(child.id));
                        if (o.activeItem !== null && o.activeItem === child.id) a.setAttribute('aria-current', 'page');
                        sub.appendChild(a);
                    });
                    parent.appendChild(sub);
                } else {
                    const isActive = o.activeItem !== null && o.activeItem === item.id;
                    const a = el('a', 'chillsidebar-item' + (isActive ? ' active' : ''));
                    a.setAttribute('href', safeUrl(item.href, '#'));
                    a.setAttribute('data-id', item.id === undefined ? '' : String(item.id));
                    a.setAttribute('title', label);
                    if (isActive) a.setAttribute('aria-current', 'page');
                    if (item.icon) a.appendChild(this._icon(item.icon));
                    a.appendChild(el('span', 'chillsidebar-item-label', label));
                    if (item.badge !== undefined && item.badge !== null && item.badge !== '' && item.badge !== false) {
                        a.appendChild(el('span', 'chillsidebar-item-badge', String(item.badge)));
                    }
                    if (typeof item.onClick === 'function') a._chillOnClick = item.onClick;
                    parent.appendChild(a);
                }
            }, this);
        }

        _focusables() {
            return Array.prototype.slice.call(this.nav.querySelectorAll('.chillsidebar-item, .chillsidebar-submenu.open .chillsidebar-submenu-item'));
        }

        bindEvents() {
            const self = this;

            if (this.toggleBtn) this._on(this.toggleBtn, 'click', function () { self.toggleCollapse(); });

            // Items and submenu links (event delegation)
            this._on(this.nav, 'click', function (e) {
                const item = e.target.closest ? e.target.closest('.chillsidebar-item, .chillsidebar-submenu-item') : null;
                if (!item || !self.nav.contains(item)) return;
                const submenu = item.nextElementSibling;
                if (item.classList.contains('chillsidebar-item') && submenu && submenu.classList.contains('chillsidebar-submenu')) {
                    e.preventDefault();
                    const open = !submenu.classList.contains('open');
                    item.classList.toggle('expanded', open);
                    submenu.classList.toggle('open', open);
                    item.setAttribute('aria-expanded', open ? 'true' : 'false');
                    return;
                }
                if (item._chillOnClick) item._chillOnClick(e);
                if (self.options.onItemClick) self.options.onItemClick(item.getAttribute('data-id'), e);
                if (self.isMobileOpen) self.closeMobile();
            });

            // Keyboard navigation between items
            this._on(this.nav, 'keydown', function (e) {
                if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(e.key) === -1) return;
                const list = self._focusables();
                const i = list.indexOf(document.activeElement);
                if (i === -1) return;
                let n = i;
                if (e.key === 'ArrowDown') n = (i + 1) % list.length;
                else if (e.key === 'ArrowUp') n = (i - 1 + list.length) % list.length;
                else if (e.key === 'Home') n = 0;
                else n = list.length - 1;
                e.preventDefault();
                list[n].focus();
            });

            // Mobile drawer
            this._on(this.overlay, 'click', function () { self.closeMobile(); });
            this._on(this.sidebar, 'keydown', function (e) {
                if (e.key === 'Escape' && self.isMobileOpen) { e.preventDefault(); self.closeMobile(); }
            });
            this._on(window, 'resize', function () {
                if (window.innerWidth > MOBILE_MAX && self.isMobileOpen) self.closeMobile();
            });

            // optional external opener
            const mt = this.options.mobileToggle;
            const btn = typeof mt === 'string' ? document.querySelector(mt) : mt;
            if (btn && btn.addEventListener) {
                btn.setAttribute('aria-controls', this.id);
                btn.setAttribute('aria-expanded', 'false');
                this._mobileBtn = btn;
                this._on(btn, 'click', function () { self.toggleMobile(); });
            }
        }

        _emit(type, value) {
            this._handlers[type].slice().forEach(function (fn) { try { fn(value, this); } catch (e) { /* ignore */ } }, this);
        }

        _setCollapsed(collapsed, silent) {
            if (this.isCollapsed === collapsed) return;
            this.isCollapsed = collapsed;
            this.sidebar.classList.toggle('collapsed', collapsed);
            this._syncToggleLabel();
            if (this.options.storageKey) writeStore(this.options.storageKey, String(collapsed));
            if (silent) return;
            if (this.options.onCollapse) { try { this.options.onCollapse(collapsed); } catch (e) { /* ignore */ } }
            this._emit('collapse', collapsed);
        }

        toggleCollapse() { this._setCollapsed(!this.isCollapsed); }
        collapse() { this._setCollapsed(true); }
        expand() { this._setCollapsed(false); }

        openMobile() {
            if (this.isMobileOpen) return;
            this.isMobileOpen = true;
            this._prevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
            this.sidebar.classList.add('open');
            this.overlay.classList.add('visible');
            this._prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            if (this._mobileBtn) this._mobileBtn.setAttribute('aria-expanded', 'true');
            const first = this.sidebar.querySelector('.chillsidebar-item, .chillsidebar-brand');
            if (first) { try { first.focus(); } catch (e) { /* ignore */ } }
            if (this.options.onMobileToggle) { try { this.options.onMobileToggle(true); } catch (e) { /* ignore */ } }
            this._emit('mobile', true);
        }

        closeMobile() {
            if (!this.isMobileOpen) return;
            this.isMobileOpen = false;
            this.sidebar.classList.remove('open');
            this.overlay.classList.remove('visible');
            document.body.style.overflow = this._prevOverflow !== null ? this._prevOverflow : '';
            this._prevOverflow = null;
            if (this._mobileBtn) this._mobileBtn.setAttribute('aria-expanded', 'false');
            const prev = this._prevFocus; this._prevFocus = null;
            if (prev && prev.focus && document.contains(prev)) { try { prev.focus(); } catch (e) { /* ignore */ } }
            if (this.options.onMobileToggle) { try { this.options.onMobileToggle(false); } catch (e) { /* ignore */ } }
            this._emit('mobile', false);
        }

        toggleMobile() { if (this.isMobileOpen) this.closeMobile(); else this.openMobile(); }

        setActiveItem(id) {
            this.nav.querySelectorAll('.chillsidebar-item, .chillsidebar-submenu-item').forEach(function (item) {
                const on = id !== null && item.getAttribute('data-id') === String(id);
                item.classList.toggle('active', on);
                if (on) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
            });
            this.options.activeItem = id;
        }

        on(type, fn) {
            if (!this._handlers[type]) throw new Error('ChillSidebar.on: unknown event "' + type + '"');
            this._handlers[type].push(fn);
            const self = this;
            return function off() { const i = self._handlers[type].indexOf(fn); if (i > -1) self._handlers[type].splice(i, 1); };
        }

        destroy() {
            if (this._destroyed) return;
            if (this.isMobileOpen) this.closeMobile();
            this._destroyed = true;
            this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
            this._listeners = [];
            if (this._mobileBtn) { this._mobileBtn.removeAttribute('aria-controls'); this._mobileBtn.removeAttribute('aria-expanded'); }
            this.overlay.remove();
            if (this.sidebar.parentNode) {
                if (this._replaced && this.element) this.sidebar.parentNode.replaceChild(this.element, this.sidebar);
                else this.sidebar.parentNode.removeChild(this.sidebar);
            }
            this._handlers = { collapse: [], mobile: [] };
        }
    }

    const ChillSidebar = {
        version: VERSION,

        init(selector, options) {
            return new ChillSidebarInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSidebar;
    } else {
        window.ChillSidebar = ChillSidebar;
    }

})(typeof window !== 'undefined' ? window : this);
