/**
 * ChillBreadcrumb - Zero-dependency Breadcrumb Navigation Component
 *
 * @example
 *   const bc = ChillBreadcrumb.init('#crumbs', {
 *     items: [{ label: 'Home', href: '/' }, { label: 'Library', href: '/lib' }, { label: 'Data', href: '/lib/data' }, { label: 'Book' }],
 *     separator: 'chevron',          // 'chevron' | 'slash' | 'arrow' | 'dot' | any text | Element
 *     maxItems: 3,                   // collapse the middle into a "..." menu
 *     homeIcon: '🏠', size: 'md', contained: false,
 *     onItemClick: (event, linkEl) => {}
 *   });
 *   bc.setItems([...]); bc.destroy();
 *
 * Markup: <nav aria-label="Breadcrumb"><ol><li><a>...</a></li>...</ol></nav> – separators are drawn inside each <li> and hidden
 * from assistive technology (no stray <li> children). The last item is marked aria-current="page"; items without an href render
 * as plain text. The collapsed "..." button is a real menu button (aria-haspopup / aria-expanded, Esc closes and restores
 * focus, ArrowUp/Down move through the hidden crumbs, outside click / Tab away closes).
 *
 * Security: labels and hrefs are text/attributes (javascript:/data:/vbscript: neutralised). `icon`, `homeIcon` and custom text
 * separators are text unless options.html === true; Element values are always accepted.
 * Fixes: setItems() after the first render (used to throw), the document click listener leak and the duplicated nested
 * .chillbreadcrumb container.
 *
 * Options: items [{label, href, icon}], separator 'chevron', size 'sm'|'md'|'lg' ('md'), contained false, maxItems null,
 *   homeIcon null, ariaLabel 'Breadcrumb', html false, onItemClick(event, linkEl)
 * Instance: breadcrumb (<nav>), setItems(items), getItems(), destroy() (restores the original element)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillbreadcrumb_css_injected__';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chillbreadcrumb-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillbreadcrumb-styles';
        style.textContent = `
      :root {
        --chillbreadcrumb-text: #6b7280;
        --chillbreadcrumb-text-active: #171717;
        --chillbreadcrumb-hover: #2563eb;
        --chillbreadcrumb-separator: #9ca3af;
        --chillbreadcrumb-bg: transparent;
        --chillbreadcrumb-bg-contained: #f3f4f6;
        --chillbreadcrumb-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillbreadcrumb-text: #a3a3a3;
          --chillbreadcrumb-text-active: #fafafa;
          --chillbreadcrumb-hover: #60a5fa;
          --chillbreadcrumb-separator: #737373;
          --chillbreadcrumb-bg-contained: #262626;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillbreadcrumb-text: #a3a3a3;
        --chillbreadcrumb-text-active: #fafafa;
        --chillbreadcrumb-hover: #60a5fa;
        --chillbreadcrumb-separator: #737373;
        --chillbreadcrumb-bg-contained: #262626;
      }

      .chillbreadcrumb { font-size: 14px; background: var(--chillbreadcrumb-bg); }
      .chillbreadcrumb-list { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; list-style: none; margin: 0; padding: 0; }
      .chillbreadcrumb-contained { padding: 12px 16px; background: var(--chillbreadcrumb-bg-contained); border-radius: 8px; }

      .chillbreadcrumb-item { display: flex; align-items: center; gap: 8px; min-width: 0; }

      .chillbreadcrumb-link, .chillbreadcrumb-current {
        display: flex; align-items: center; gap: 6px; min-height: 28px; color: var(--chillbreadcrumb-text);
        text-decoration: none; border-radius: 4px; transition: color 0.15s ease;
      }
      .chillbreadcrumb-link:hover { color: var(--chillbreadcrumb-hover); }
      .chillbreadcrumb a:focus, .chillbreadcrumb button:focus { outline: none; }
      .chillbreadcrumb a:focus-visible, .chillbreadcrumb button:focus-visible { box-shadow: 0 0 0 3px var(--chillbreadcrumb-ring); }
      .chillbreadcrumb-link.active, .chillbreadcrumb-current { color: var(--chillbreadcrumb-text-active); font-weight: 500; }
      .chillbreadcrumb-link.active { cursor: default; }

      .chillbreadcrumb-icon { display: inline-flex; width: 16px; height: 16px; flex-shrink: 0; }
      .chillbreadcrumb-icon svg { width: 100%; height: 100%; }

      .chillbreadcrumb-separator { color: var(--chillbreadcrumb-separator); display: inline-flex; align-items: center; user-select: none; }
      .chillbreadcrumb-separator svg { width: 16px; height: 16px; }

      /* Sizes */
      .chillbreadcrumb-sm { font-size: 12px; }
      .chillbreadcrumb-sm .chillbreadcrumb-list { gap: 4px 6px; }
      .chillbreadcrumb-sm .chillbreadcrumb-icon { width: 14px; height: 14px; }
      .chillbreadcrumb-lg { font-size: 16px; }
      .chillbreadcrumb-lg .chillbreadcrumb-list { gap: 4px 10px; }
      .chillbreadcrumb-lg .chillbreadcrumb-icon { width: 18px; height: 18px; }

      /* Collapsed */
      .chillbreadcrumb-collapsed {
        display: flex; align-items: center; gap: 4px; min-height: 28px; min-width: 32px; justify-content: center; padding: 4px 8px;
        color: var(--chillbreadcrumb-text); background: var(--chillbreadcrumb-bg-contained); border: none; border-radius: 4px; cursor: pointer; font: inherit;
      }
      .chillbreadcrumb-collapsed:hover { color: var(--chillbreadcrumb-hover); }

      .chillbreadcrumb-dropdown { position: relative; }
      .chillbreadcrumb-dropdown-menu {
        position: absolute; top: 100%; left: 0; margin-top: 4px; padding: 4px; background: var(--chillbreadcrumb-bg-contained);
        border: 1px solid rgba(128, 128, 128, 0.2); border-radius: 8px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); min-width: 150px;
        opacity: 0; visibility: hidden; transform: translateY(-10px); transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s; z-index: 100;
      }
      .chillbreadcrumb-dropdown.open .chillbreadcrumb-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
      .chillbreadcrumb-dropdown-item {
        display: block; padding: 8px 12px; color: var(--chillbreadcrumb-text); text-decoration: none; border-radius: 4px; transition: background 0.15s ease, color 0.15s ease;
      }
      .chillbreadcrumb-dropdown-item:hover { color: var(--chillbreadcrumb-text-active); background: rgba(128, 128, 128, 0.15); }

      @media (prefers-reduced-motion: reduce) {
        .chillbreadcrumb-link, .chillbreadcrumb-dropdown-menu, .chillbreadcrumb-dropdown-item { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const TEXT_SEPARATORS = { slash: '/', arrow: '→', dot: '•' };

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

    function chevron() {
        const NS = 'http://www.w3.org/2000/svg';
        const s = document.createElementNS(NS, 'svg');
        s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
        s.setAttribute('stroke-width', '2'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M9 18l6-6-6-6');
        s.appendChild(p);
        return s;
    }

    class ChillBreadcrumbInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = Object.assign({
                items: [], separator: 'chevron', size: 'md', contained: false, maxItems: null, homeIcon: null,
                ariaLabel: 'Breadcrumb', html: false, onItemClick: null
            }, options);
            this.options.items = (this.options.items || []).slice();
            this.id = 'chillbreadcrumb-' + (++uid);
            this._docListener = null;
            this._destroyed = false;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _text(node, value) {
            if (value && value.nodeType) node.appendChild(value.cloneNode(true));
            else if (this.options.html === true) node.innerHTML = String(value);
            else node.textContent = String(value);
        }

        _separator() {
            const o = this.options, s = o.separator;
            const span = el('span', 'chillbreadcrumb-separator');
            span.setAttribute('aria-hidden', 'true');
            if (s && s.nodeType) span.appendChild(s.cloneNode(true));
            else if (s === 'chevron' || s === undefined || s === null || s === '') span.appendChild(chevron());
            else if (TEXT_SEPARATORS[s]) span.textContent = TEXT_SEPARATORS[s];
            else this._text(span, s);
            return span;
        }

        _build() {
            const o = this.options;
            let items = o.items.slice();
            if (o.maxItems && items.length > o.maxItems) {
                const keepEnd = Math.max(1, o.maxItems - 1);
                const collapsed = items.slice(1, items.length - keepEnd);
                if (collapsed.length) items = [items[0], { type: 'collapsed', items: collapsed }].concat(items.slice(items.length - keepEnd));
            }

            const ol = el('ol', 'chillbreadcrumb-list');
            items.forEach(function (item, index) {
                const li = el('li', 'chillbreadcrumb-item');
                if (item.type === 'collapsed') {
                    li.classList.add('chillbreadcrumb-dropdown');
                    const menuId = this.id + '-menu';
                    const btn = el('button', 'chillbreadcrumb-collapsed');
                    btn.type = 'button';
                    btn.setAttribute('aria-label', 'Show more');
                    btn.setAttribute('aria-haspopup', 'true');
                    btn.setAttribute('aria-expanded', 'false');
                    btn.setAttribute('aria-controls', menuId);
                    btn.appendChild(el('span', '', '…'));
                    const menu = el('div', 'chillbreadcrumb-dropdown-menu');
                    menu.id = menuId;
                    item.items.forEach(function (c) {
                        const a = el('a', 'chillbreadcrumb-dropdown-item', String(c.label == null ? '' : c.label));
                        a.setAttribute('href', safeUrl(c.href, '#'));
                        menu.appendChild(a);
                    });
                    li.appendChild(btn); li.appendChild(menu);
                } else {
                    const isLast = index === items.length - 1;
                    const hasHref = item.href !== undefined && item.href !== null && item.href !== '';
                    const node = hasHref || !isLast ? el('a', 'chillbreadcrumb-link' + (isLast ? ' active' : '')) : el('span', 'chillbreadcrumb-current');
                    if (node.tagName === 'A') node.setAttribute('href', safeUrl(item.href, '#'));
                    if (isLast) node.setAttribute('aria-current', 'page');
                    if (index === 0 && o.homeIcon) { const i = el('span', 'chillbreadcrumb-icon'); i.setAttribute('aria-hidden', 'true'); this._text(i, o.homeIcon); node.appendChild(i); }
                    if (item.icon) { const i = el('span', 'chillbreadcrumb-icon'); i.setAttribute('aria-hidden', 'true'); this._text(i, item.icon); node.appendChild(i); }
                    node.appendChild(el('span', '', String(item.label == null ? '' : item.label)));
                    li.appendChild(node);
                }
                if (index < items.length - 1) li.appendChild(this._separator());
                ol.appendChild(li);
            }, this);
            return ol;
        }

        render() {
            const o = this.options;
            const nav = document.createElement('nav');
            nav.className = 'chillbreadcrumb chillbreadcrumb-' + o.size + (o.contained ? ' chillbreadcrumb-contained' : '');
            nav.setAttribute('aria-label', o.ariaLabel);
            nav.appendChild(this._build());

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(nav, this.element);
                this._replaced = true;
            }
            this.breadcrumb = nav;
        }

        _closeMenu(focusTrigger) {
            const dd = this.breadcrumb.querySelector('.chillbreadcrumb-dropdown');
            if (!dd) return;
            dd.classList.remove('open');
            const t = dd.querySelector('.chillbreadcrumb-collapsed');
            if (t) { t.setAttribute('aria-expanded', 'false'); if (focusTrigger) t.focus(); }
        }

        bindEvents() {
            const self = this, nav = this.breadcrumb;

            // delegated handlers survive setItems() re-renders
            this._onClick = function (e) {
                const target = e.target;
                const btn = target.closest ? target.closest('.chillbreadcrumb-collapsed') : null;
                if (btn && nav.contains(btn)) {
                    const dd = btn.closest('.chillbreadcrumb-dropdown');
                    const open = !dd.classList.contains('open');
                    dd.classList.toggle('open', open);
                    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                    return;
                }
                const link = target.closest ? target.closest('.chillbreadcrumb-link, .chillbreadcrumb-dropdown-item') : null;
                if (link && nav.contains(link)) {
                    if (self.options.onItemClick) self.options.onItemClick(e, link);
                    self._closeMenu(false);
                }
            };
            nav.addEventListener('click', this._onClick);

            this._onKeydown = function (e) {
                const dd = nav.querySelector('.chillbreadcrumb-dropdown');
                if (!dd) return;
                const btn = dd.querySelector('.chillbreadcrumb-collapsed');
                const items = Array.prototype.slice.call(dd.querySelectorAll('.chillbreadcrumb-dropdown-item'));
                const isOpen = dd.classList.contains('open');
                if (e.key === 'Escape' && isOpen) { e.preventDefault(); self._closeMenu(true); return; }
                if (e.target === btn && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault();
                    dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
                    const t = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
                    if (t) t.focus();
                } else if (isOpen && items.indexOf(e.target) > -1) {
                    const i = items.indexOf(e.target);
                    let n = -1;
                    if (e.key === 'ArrowDown') n = (i + 1) % items.length;
                    else if (e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
                    else if (e.key === 'Home') n = 0;
                    else if (e.key === 'End') n = items.length - 1;
                    if (n > -1) { e.preventDefault(); items[n].focus(); }
                }
            };
            nav.addEventListener('keydown', this._onKeydown);

            this._onFocusOut = function (e) {
                const dd = nav.querySelector('.chillbreadcrumb-dropdown.open');
                if (dd && e.relatedTarget && !dd.contains(e.relatedTarget)) self._closeMenu(false);
            };
            nav.addEventListener('focusout', this._onFocusOut);

            // outside click closes the menu
            this._docListener = function (e) {
                const dd = nav.querySelector('.chillbreadcrumb-dropdown.open');
                if (dd && !dd.contains(e.target)) self._closeMenu(false);
            };
            document.addEventListener('click', this._docListener);
        }

        setItems(items) {
            this.options.items = (items || []).slice();
            const old = this.breadcrumb.querySelector('.chillbreadcrumb-list');
            const fresh = this._build();
            if (old) this.breadcrumb.replaceChild(fresh, old); else this.breadcrumb.appendChild(fresh);
            return this;
        }

        getItems() { return this.options.items.slice(); }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            if (this._docListener) document.removeEventListener('click', this._docListener);
            this._docListener = null;
            this.breadcrumb.removeEventListener('click', this._onClick);
            this.breadcrumb.removeEventListener('keydown', this._onKeydown);
            this.breadcrumb.removeEventListener('focusout', this._onFocusOut);
            if (this.breadcrumb.parentNode) {
                if (this._replaced && this.element) this.breadcrumb.parentNode.replaceChild(this.element, this.breadcrumb);
                else this.breadcrumb.parentNode.removeChild(this.breadcrumb);
            }
        }
    }

    const ChillBreadcrumb = {
        version: VERSION,

        init(selector, options) {
            return new ChillBreadcrumbInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillBreadcrumb;
    } else {
        window.ChillBreadcrumb = ChillBreadcrumb;
    }

})(typeof window !== 'undefined' ? window : this);
