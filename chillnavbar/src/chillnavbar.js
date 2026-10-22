/**
 * ChillNavbar - Zero-dependency Responsive Navigation Bar Component
 *
 * @example
 *   const nav = ChillNavbar.init('#nav', {
 *     brand: { name: 'Acme', logo: '/logo.svg', href: '/' },
 *     links: [
 *       { label: 'Home', href: '/', active: true },
 *       { label: 'Docs', children: [{ label: 'Guide', href: '/guide' }, { label: 'API', href: '/api' }] },
 *       { label: 'GitHub', href: 'https://github.com', target: '_blank' }
 *     ],
 *     searchable: true, onSearch: (q, submitted) => {},
 *     actions: [{ html: '<button>Sign in</button>' }],       // or { element: node }
 *     fixed: false, ariaLabel: 'Main navigation'
 *   });
 *   nav.openMenu(); nav.closeMenu(); nav.setActiveLink('/docs'); nav.destroy();
 *
 * Mobile (<= 768px): a menu toggle (aria-expanded / aria-controls) opens a full-screen menu, Esc or choosing a link closes it
 * and returns focus to the toggle, page scrolling is locked while it is open and it closes automatically when the viewport
 * grows. Dropdowns are real buttons (aria-haspopup / aria-expanded): Enter / Space / ArrowDown open them, ArrowUp / ArrowDown /
 * Home / End move between items, Esc closes and restores focus, Tab out or an outside click closes them.
 *
 * Security: label, brand name, hrefs (javascript:/data:/vbscript: are neutralised to "#"), logo src and search placeholder are
 * set via textContent / setAttribute. `icon` strings are shown as text unless options.html === true (trusted markup only);
 * Element icons are always allowed. `actions[].html` is explicit HTML by name (trusted); `actions[].element` accepts a Node.
 *
 * Options:
 *   brand {name, logo, href='/', alt}   links [{ label, href, icon, active, target, children: [{label, href}] }]
 *   actions [{ html | element }]        fixed false      transparent false
 *   searchable false                    searchPlaceholder 'Search...'      searchHotkey false (focus the search with mod+k)
 *   ariaLabel 'Main navigation'         html false (icon strings as HTML)
 *   onSearch(value, submitted), onLinkClick(event, linkEl), onToggle(isOpen, instance)
 *
 * Instance: navbar (the <nav>), isOpen, openMenu(), closeMenu(), toggleMenu(), closeDropdowns(), setActiveLink(href),
 *   setTransparent(bool), on('toggle', fn) -> off, destroy() (removes every listener, restores the original element)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillnavbar_css_injected__';
    const MOBILE_MAX = 768;
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chillnavbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillnavbar-styles';
        style.textContent = `
      :root {
        --chillnavbar-bg: #ffffff;
        --chillnavbar-text: #171717;
        --chillnavbar-text-muted: #6b7280;
        --chillnavbar-border: #e5e5e5;
        --chillnavbar-hover: #f5f5f5;
        --chillnavbar-active: #3b82f6;
        --chillnavbar-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        --chillnavbar-height: 64px;
        --chillnavbar-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillnavbar-bg: #171717;
          --chillnavbar-text: #fafafa;
          --chillnavbar-text-muted: #a3a3a3;
          --chillnavbar-border: #262626;
          --chillnavbar-hover: #262626;
          --chillnavbar-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillnavbar-bg: #171717;
        --chillnavbar-text: #fafafa;
        --chillnavbar-text-muted: #a3a3a3;
        --chillnavbar-border: #262626;
        --chillnavbar-hover: #262626;
        --chillnavbar-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .chillnavbar {
        position: sticky; top: 0; z-index: 1000;
        display: flex; align-items: center; justify-content: space-between;
        height: var(--chillnavbar-height); padding: 0 24px; box-sizing: border-box;
        background: var(--chillnavbar-bg); color: var(--chillnavbar-text);
        border-bottom: 1px solid var(--chillnavbar-border); box-shadow: var(--chillnavbar-shadow);
      }
      .chillnavbar-transparent { background: transparent; border-bottom: none; box-shadow: none; }
      .chillnavbar-fixed { position: fixed; left: 0; right: 0; }

      .chillnavbar-container { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1280px; margin: 0 auto; }

      .chillnavbar-brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; color: var(--chillnavbar-text); text-decoration: none; border-radius: 6px; }
      .chillnavbar-brand:hover { color: var(--chillnavbar-text); }
      .chillnavbar-brand-logo { height: 32px; width: auto; }

      .chillnavbar-menu { display: flex; align-items: center; gap: 8px; }

      .chillnavbar-link {
        display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 8px 16px; box-sizing: border-box;
        font: inherit; font-size: 14px; font-weight: 500; color: var(--chillnavbar-text-muted); text-decoration: none;
        background: none; border: none; border-radius: 6px; cursor: pointer; transition: color 0.15s ease, background 0.15s ease;
      }
      .chillnavbar-link:hover { color: var(--chillnavbar-text); background: var(--chillnavbar-hover); }
      .chillnavbar-link.active, .chillnavbar-link[aria-current] { color: var(--chillnavbar-active); }
      .chillnavbar-link-icon { display: inline-flex; width: 18px; height: 18px; }
      .chillnavbar-link-icon svg { width: 100%; height: 100%; }

      .chillnavbar a:focus, .chillnavbar button:focus { outline: none; }
      .chillnavbar a:focus-visible, .chillnavbar button:focus-visible, .chillnavbar-search-input:focus-visible { box-shadow: 0 0 0 3px var(--chillnavbar-ring); }

      .chillnavbar-actions { display: flex; align-items: center; gap: 12px; }

      .chillnavbar-toggle {
        display: none; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
        background: none; border: none; border-radius: 8px; cursor: pointer; color: var(--chillnavbar-text);
      }
      .chillnavbar-toggle:hover { background: var(--chillnavbar-hover); }
      .chillnavbar-toggle-icon { width: 24px; height: 24px; }
      .chillnavbar-toggle-icon .toggle-close { display: none; }
      .chillnavbar.open .chillnavbar-toggle-icon .toggle-open { display: none; }
      .chillnavbar.open .chillnavbar-toggle-icon .toggle-close { display: block; }

      /* Mobile Menu */
      @media (max-width: ${MOBILE_MAX}px) {
        .chillnavbar { padding: 0 16px; }
        .chillnavbar-toggle { display: flex; }
        .chillnavbar-menu {
          position: fixed; top: var(--chillnavbar-height); left: 0; right: 0; bottom: 0;
          flex-direction: column; align-items: stretch; gap: 0; padding: 16px; box-sizing: border-box;
          background: var(--chillnavbar-bg); border-top: 1px solid var(--chillnavbar-border);
          transform: translateX(-100%); opacity: 0; visibility: hidden;
          transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s; overflow-y: auto;
        }
        .chillnavbar.open .chillnavbar-menu { transform: translateX(0); opacity: 1; visibility: visible; }
        .chillnavbar-link { padding: 14px 16px; font-size: 16px; border-radius: 8px; min-height: 48px; width: 100%; text-align: left; }
        .chillnavbar-actions { display: none; }
        .chillnavbar.open .chillnavbar-actions {
          display: flex; flex-direction: column; position: fixed; left: 0; right: 0; bottom: 0; padding: 16px; box-sizing: border-box;
          background: var(--chillnavbar-bg); border-top: 1px solid var(--chillnavbar-border); z-index: 1;
        }
        .chillnavbar-dropdown-menu { position: static; margin: 0 0 0 12px; box-shadow: none; border: none; transform: none; display: none; }
        .chillnavbar-dropdown.open .chillnavbar-dropdown-menu { display: block; }
      }

      /* Dropdown in Navbar */
      .chillnavbar-dropdown { position: relative; }
      .chillnavbar-dropdown-trigger { display: flex; align-items: center; gap: 4px; cursor: pointer; }
      .chillnavbar-dropdown-trigger::after {
        content: ''; width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent;
        border-top: 4px solid currentColor; transition: transform 0.2s ease;
      }
      .chillnavbar-dropdown.open .chillnavbar-dropdown-trigger::after { transform: rotate(180deg); }
      .chillnavbar-dropdown-menu {
        position: absolute; top: 100%; left: 0; min-width: 200px; margin-top: 8px; padding: 8px; box-sizing: border-box;
        background: var(--chillnavbar-bg); border: 1px solid var(--chillnavbar-border); border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); opacity: 0; visibility: hidden; transform: translateY(-10px);
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s; z-index: 1001;
      }
      .chillnavbar-dropdown.open .chillnavbar-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
      .chillnavbar-dropdown-item {
        display: block; padding: 10px 12px; font-size: 14px; color: var(--chillnavbar-text); text-decoration: none;
        border-radius: 6px; transition: background 0.15s ease;
      }
      .chillnavbar-dropdown-item:hover { background: var(--chillnavbar-hover); }

      /* Search in Navbar */
      .chillnavbar-search {
        display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--chillnavbar-hover);
        border: 1px solid var(--chillnavbar-border); border-radius: 8px; min-width: 200px; box-sizing: border-box;
      }
      .chillnavbar-search-icon { width: 18px; height: 18px; color: var(--chillnavbar-text-muted); flex-shrink: 0; }
      .chillnavbar-search-input { flex: 1; min-width: 0; border: none; background: none; font: inherit; font-size: 14px; color: var(--chillnavbar-text); outline: none; border-radius: 4px; }
      .chillnavbar-search-input::placeholder { color: var(--chillnavbar-text-muted); }
      .chillnavbar-search-shortcut {
        padding: 2px 6px; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--chillnavbar-text-muted); background: var(--chillnavbar-bg); border: 1px solid var(--chillnavbar-border); border-radius: 4px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillnavbar-menu, .chillnavbar-link, .chillnavbar-dropdown-menu, .chillnavbar-dropdown-trigger::after { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---------- helpers ----------
    function safeUrl(url, dflt) {
        const u = String(url == null ? '' : url).trim();
        if (!u) return dflt;
        // strip control chars / whitespace browsers ignore inside the scheme, then test the scheme
        const probe = u.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
        if (/^(javascript|data|vbscript):/.test(probe)) return '#';
        return u;
    }

    function isMac() {
        try {
            const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
            return /mac|iphone|ipad|ipod/i.test(p);
        } catch (e) { return false; }
    }

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    function svg(attrs, inner) {
        const NS = 'http://www.w3.org/2000/svg';
        const s = document.createElementNS(NS, 'svg');
        Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
        inner.forEach(function (n) {
            const p = document.createElementNS(NS, n.tag);
            Object.keys(n.attrs).forEach(function (k) { p.setAttribute(k, n.attrs[k]); });
            s.appendChild(p);
        });
        return s;
    }

    class ChillNavbarInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = Object.assign({
                brand: null, links: [], actions: [], fixed: false, transparent: false, searchable: false,
                searchPlaceholder: 'Search...', searchHotkey: false, ariaLabel: 'Main navigation', html: false,
                onSearch: null, onLinkClick: null, onToggle: null
            }, options);

            this.id = 'chillnavbar-' + (++uid);
            this.isOpen = false;
            this._handlers = [];
            this._listeners = [];   // [target, type, fn, opts] for guaranteed cleanup
            this._prevOverflow = null;
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

        _iconNode(icon) {
            const span = el('span', 'chillnavbar-link-icon');
            span.setAttribute('aria-hidden', 'true');
            if (icon && icon.nodeType) span.appendChild(icon.cloneNode(true));
            else if (this.options.html === true) span.innerHTML = String(icon);
            else span.textContent = String(icon);
            return span;
        }

        render() {
            const o = this.options;
            const nav = document.createElement('nav');
            nav.className = 'chillnavbar';
            nav.id = this.id;
            nav.setAttribute('aria-label', o.ariaLabel);
            if (o.fixed) nav.classList.add('chillnavbar-fixed');
            if (o.transparent) nav.classList.add('chillnavbar-transparent');

            const container = el('div', 'chillnavbar-container');

            // Brand
            if (o.brand) {
                const a = el('a', 'chillnavbar-brand');
                a.setAttribute('href', safeUrl(o.brand.href, '/'));
                if (o.brand.logo) {
                    const img = el('img', 'chillnavbar-brand-logo');
                    img.setAttribute('src', safeUrl(o.brand.logo, ''));
                    img.setAttribute('alt', o.brand.alt !== undefined ? String(o.brand.alt) : (o.brand.name ? '' : 'Home'));
                    a.appendChild(img);
                }
                if (o.brand.name) a.appendChild(el('span', '', String(o.brand.name)));
                container.appendChild(a);
            }

            // Mobile toggle
            const toggle = el('button', 'chillnavbar-toggle');
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Toggle menu');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-controls', this.id + '-menu');
            const icon = svg({ 'class': 'chillnavbar-toggle-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true', focusable: 'false' }, [
                { tag: 'path', attrs: { 'class': 'toggle-open', d: 'M4 6h16M4 12h16M4 18h16' } },
                { tag: 'path', attrs: { 'class': 'toggle-close', d: 'M18 6L6 18M6 6l12 12' } }
            ]);
            toggle.appendChild(icon);
            container.appendChild(toggle);

            // Menu
            const menu = el('div', 'chillnavbar-menu');
            menu.id = this.id + '-menu';
            o.links.forEach(function (link, i) {
                if (link.children) {
                    const dd = el('div', 'chillnavbar-dropdown');
                    const trigger = el('button', 'chillnavbar-link chillnavbar-dropdown-trigger');
                    trigger.type = 'button';
                    trigger.setAttribute('aria-haspopup', 'true');
                    trigger.setAttribute('aria-expanded', 'false');
                    const mid = this.id + '-dd-' + i;
                    trigger.setAttribute('aria-controls', mid);
                    if (link.icon) trigger.appendChild(this._iconNode(link.icon));
                    trigger.appendChild(document.createTextNode(String(link.label == null ? '' : link.label)));
                    const sub = el('div', 'chillnavbar-dropdown-menu');
                    sub.id = mid;
                    link.children.forEach(function (child) {
                        const a = el('a', 'chillnavbar-dropdown-item', String(child.label == null ? '' : child.label));
                        a.setAttribute('href', safeUrl(child.href, '#'));
                        if (child.target) { a.setAttribute('target', child.target); if (child.target === '_blank') a.setAttribute('rel', 'noopener noreferrer'); }
                        if (child.active) a.setAttribute('aria-current', 'page');
                        sub.appendChild(a);
                    });
                    dd.appendChild(trigger); dd.appendChild(sub);
                    menu.appendChild(dd);
                } else {
                    const a = el('a', 'chillnavbar-link');
                    a.setAttribute('href', safeUrl(link.href, '#'));
                    if (link.active) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
                    if (link.target) { a.setAttribute('target', link.target); if (link.target === '_blank') a.setAttribute('rel', 'noopener noreferrer'); }
                    if (link.icon) a.appendChild(this._iconNode(link.icon));
                    a.appendChild(document.createTextNode(String(link.label == null ? '' : link.label)));
                    menu.appendChild(a);
                }
            }, this);
            container.appendChild(menu);

            // Actions
            const actions = el('div', 'chillnavbar-actions');
            if (o.searchable) {
                const search = el('div', 'chillnavbar-search');
                search.setAttribute('role', 'search');
                search.appendChild(svg({ 'class': 'chillnavbar-search-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true', focusable: 'false' }, [
                    { tag: 'circle', attrs: { cx: '11', cy: '11', r: '8' } }, { tag: 'path', attrs: { d: 'm21 21-4.35-4.35' } }
                ]));
                const input = el('input', 'chillnavbar-search-input');
                input.type = 'search';
                input.setAttribute('placeholder', o.searchPlaceholder);
                input.setAttribute('aria-label', o.searchPlaceholder);
                search.appendChild(input);
                const chip = el('span', 'chillnavbar-search-shortcut', isMac() ? '⌘K' : 'Ctrl K');
                chip.setAttribute('aria-hidden', 'true');
                search.appendChild(chip);
                actions.appendChild(search);
            }
            o.actions.forEach(function (action) {
                if (!action) return;
                if (action.element && action.element.nodeType) actions.appendChild(action.element);
                else if (typeof action.html === 'string') {
                    const wrap = document.createElement('div');
                    wrap.innerHTML = action.html;   // explicit, documented HTML opt-in (trusted markup)
                    while (wrap.firstChild) actions.appendChild(wrap.firstChild);
                }
            });
            container.appendChild(actions);

            nav.appendChild(container);

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(nav, this.element);
                this._replaced = true;
            }
            this.navbar = nav;
            this.toggleBtn = toggle;
            this.menu = menu;
        }

        _dropdowns() { return Array.prototype.slice.call(this.navbar.querySelectorAll('.chillnavbar-dropdown')); }

        _setDropdown(dd, open, focusFirst) {
            const trigger = dd.querySelector('.chillnavbar-dropdown-trigger');
            dd.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open && focusFirst) {
                const first = dd.querySelector('.chillnavbar-dropdown-item');
                if (first) first.focus();
            }
        }

        closeDropdowns(exceptEl) {
            this._dropdowns().forEach(function (dd) {
                if (dd !== exceptEl && dd.classList.contains('open')) this._setDropdown(dd, false);
            }, this);
        }

        bindEvents() {
            const self = this;

            this._on(this.toggleBtn, 'click', function () { self.toggleMenu(); });

            // Dropdowns
            this._dropdowns().forEach(function (dd) {
                const trigger = dd.querySelector('.chillnavbar-dropdown-trigger');
                self._on(trigger, 'click', function (e) {
                    e.preventDefault();
                    const open = !dd.classList.contains('open');
                    self.closeDropdowns(dd);
                    self._setDropdown(dd, open);
                });
                self._on(dd, 'keydown', function (e) {
                    const items = Array.prototype.slice.call(dd.querySelectorAll('.chillnavbar-dropdown-item'));
                    const isOpen = dd.classList.contains('open');
                    const onTrigger = e.target === trigger;
                    if (e.key === 'Escape' && isOpen) {
                        e.preventDefault(); e.stopPropagation();
                        self._setDropdown(dd, false); trigger.focus();
                    } else if (onTrigger && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                        e.preventDefault();
                        self.closeDropdowns(dd);
                        self._setDropdown(dd, true);
                        const t = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
                        if (t) t.focus();
                    } else if (!onTrigger && isOpen && items.indexOf(e.target) > -1) {
                        const i = items.indexOf(e.target);
                        let next = -1;
                        if (e.key === 'ArrowDown') next = (i + 1) % items.length;
                        else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
                        else if (e.key === 'Home') next = 0;
                        else if (e.key === 'End') next = items.length - 1;
                        if (next > -1) { e.preventDefault(); items[next].focus(); }
                    }
                });
                // Tab / focus leaving the dropdown closes it
                self._on(dd, 'focusout', function (e) {
                    if (dd.classList.contains('open') && e.relatedTarget && !dd.contains(e.relatedTarget)) self._setDropdown(dd, false);
                });
            });

            // Close dropdowns on outside click
            this._on(document, 'click', function (e) {
                if (!self.navbar.contains(e.target)) self.closeDropdowns();
            });

            // Escape closes the mobile menu
            this._on(this.navbar, 'keydown', function (e) {
                if (e.key === 'Escape' && self.isOpen) { e.preventDefault(); self.closeMenu(); self.toggleBtn.focus(); }
            });

            // Search
            if (this.options.searchable) {
                const searchInput = this.navbar.querySelector('.chillnavbar-search-input');
                if (searchInput && this.options.onSearch) {
                    this._on(searchInput, 'input', function (e) { self.options.onSearch(e.target.value); });
                    this._on(searchInput, 'keydown', function (e) {
                        if (e.key === 'Enter') self.options.onSearch(e.target.value, true);
                    });
                }
                if (searchInput && this.options.searchHotkey) {
                    this._on(document, 'keydown', function (e) {
                        if ((isMac() ? e.metaKey : e.ctrlKey) && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === 'k') {
                            e.preventDefault(); searchInput.focus();
                        }
                    });
                }
            }

            // Link clicks (also closes the mobile menu after navigating)
            this.navbar.querySelectorAll('.chillnavbar-link:not(.chillnavbar-dropdown-trigger), .chillnavbar-dropdown-item').forEach(function (link) {
                self._on(link, 'click', function (e) {
                    if (self.options.onLinkClick) self.options.onLinkClick(e, link);
                    if (self.isOpen) self.closeMenu();
                    self.closeDropdowns();
                });
            });

            // Close menu when the viewport grows past the mobile breakpoint
            this._on(window, 'resize', function () {
                if (window.innerWidth > MOBILE_MAX && self.isOpen) self.closeMenu();
            });
        }

        toggleMenu() {
            if (this.isOpen) this.closeMenu(); else this.openMenu();
        }

        _setOpen(open) {
            if (this.isOpen === open) return;
            this.isOpen = open;
            this.navbar.classList.toggle('open', open);
            this.toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            this.toggleBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            // lock page scroll behind the full-screen mobile menu
            if (open) {
                this._prevOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
            } else if (this._prevOverflow !== null) {
                document.body.style.overflow = this._prevOverflow;
                this._prevOverflow = null;
            }
            if (this.options.onToggle) { try { this.options.onToggle(open, this); } catch (e) { /* ignore */ } }
            this._handlers.slice().forEach(function (fn) { try { fn(open, this); } catch (e) { /* ignore */ } }, this);
        }

        openMenu() { this._setOpen(true); }
        closeMenu() { this._setOpen(false); }

        setActiveLink(href) {
            this.navbar.querySelectorAll('.chillnavbar-link:not(.chillnavbar-dropdown-trigger), .chillnavbar-dropdown-item').forEach(function (link) {
                const on = link.getAttribute('href') === href;
                link.classList.toggle('active', on);
                if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
            });
        }

        setTransparent(transparent) {
            this.navbar.classList.toggle('chillnavbar-transparent', !!transparent);
        }

        on(type, fn) {
            if (type !== 'toggle') throw new Error('ChillNavbar.on: unknown event "' + type + '"');
            this._handlers.push(fn);
            const self = this;
            return function off() { const i = self._handlers.indexOf(fn); if (i > -1) self._handlers.splice(i, 1); };
        }

        destroy() {
            if (this._destroyed) return;
            if (this.isOpen) this._setOpen(false);
            this._destroyed = true;
            this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
            this._listeners = [];
            if (this.navbar.parentNode) {
                if (this._replaced && this.element) this.navbar.parentNode.replaceChild(this.element, this.navbar);
                else this.navbar.parentNode.removeChild(this.navbar);
            }
            this._handlers.length = 0;
        }
    }

    const ChillNavbar = {
        version: VERSION,

        init(selector, options) {
            return new ChillNavbarInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillNavbar;
    } else {
        window.ChillNavbar = ChillNavbar;
    }

})(typeof window !== 'undefined' ? window : this);
