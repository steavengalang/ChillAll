/**
 * ChillPagination - Zero-dependency Pagination Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const p = ChillPagination.init('#pager', { total: 250, pageSize: 10, onChange: (page, size) => {} });
 *   p.goToPage(3); p.setTotal(300); p.destroy();   // destroy() puts the original element back
 *
 * Options:
 *   total 0, pageSize 10, current 1, maxButtons 7, size 'sm'|'md'|'lg', shape 'default'|'rounded'|'square',
 *   simple false, showInfo false, showSizeChanger false, pageSizeOptions [10,20,50,100], showJumper false,
 *   prevText / nextText   plain text for the Prev/Next buttons (escaped)
 *   prevHtml / nextHtml   opt-in HTML for those buttons (you must trust it)
 *   ariaLabel 'Pagination'   label for the <nav>
 *   onChange(page, pageSize), onPageSizeChange(pageSize)
 * Methods: goToPage(page, {silent}), next(), prev(), setTotal, setPageSize, getCurrentPage, getPageSize,
 *          getTotalPages, on(event, fn) ('change', 'pagesize'), destroy()
 * Keyboard: Tab to the buttons; ArrowLeft/ArrowRight/Home/End move between page buttons. The current page
 *   has aria-current="page"; page changes are announced through a polite live region.
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillpagination_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] || document.getElementById('chillpagination-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillpagination-styles';
        style.textContent = `
      :root {
        --chillpagination-bg: #ffffff;
        --chillpagination-text: #374151;
        --chillpagination-text-muted: #9ca3af;
        --chillpagination-border: #e5e7eb;
        --chillpagination-hover: #f3f4f6;
        --chillpagination-active: #3b82f6;
        --chillpagination-active-text: #ffffff;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillpagination-bg: #1f2937;
          --chillpagination-text: #e5e7eb;
          --chillpagination-text-muted: #6b7280;
          --chillpagination-border: #374151;
          --chillpagination-hover: #374151;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillpagination-bg: #1f2937;
        --chillpagination-text: #e5e7eb;
        --chillpagination-text-muted: #6b7280;
        --chillpagination-border: #374151;
        --chillpagination-hover: #374151;
      }

      .chillpagination {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        font-size: 14px;
        color: var(--chillpagination-text);
      }

      .chillpagination-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        padding: 0 12px;
        background: var(--chillpagination-bg);
        color: var(--chillpagination-text);
        border: 1px solid var(--chillpagination-border);
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
      }

      .chillpagination-btn:hover:not(:disabled) {
        background: var(--chillpagination-hover);
      }

      .chillpagination-btn:focus-visible,
      .chillpagination-select:focus-visible,
      .chillpagination-jump-input:focus-visible {
        outline: 2px solid var(--chillpagination-active);
        outline-offset: 2px;
      }

      .chillpagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chillpagination-btn.active {
        background: var(--chillpagination-active);
        color: var(--chillpagination-active-text);
        border-color: var(--chillpagination-active);
      }

      .chillpagination-btn-icon {
        width: 16px;
        height: 16px;
      }

      .chillpagination-ellipsis {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        color: var(--chillpagination-text-muted);
      }

      /* Sizes */
      .chillpagination-sm .chillpagination-btn {
        min-width: 32px;
        height: 32px;
        padding: 0 8px;
        font-size: 12px;
        border-radius: 6px;
      }

      .chillpagination-lg .chillpagination-btn {
        min-width: 44px;
        height: 44px;
        padding: 0 16px;
        font-size: 16px;
        border-radius: 10px;
      }

      /* Shapes */
      .chillpagination-rounded .chillpagination-btn {
        border-radius: 9999px;
      }

      .chillpagination-square .chillpagination-btn {
        border-radius: 0;
      }

      /* Simple Style */
      .chillpagination-simple {
        gap: 12px;
      }

      .chillpagination-simple .chillpagination-info {
        font-size: 14px;
        color: var(--chillpagination-text);
      }

      /* With Info */
      .chillpagination-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        color: var(--chillpagination-text-muted);
        font-size: 13px;
      }

      .chillpagination-select {
        padding: 6px 28px 6px 12px;
        min-height: 32px;
        background: var(--chillpagination-bg);
        border: 1px solid var(--chillpagination-border);
        border-radius: 6px;
        font-size: 13px;
        color: var(--chillpagination-text);
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
      }

      /* Jumper */
      .chillpagination-jump {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 12px;
      }

      .chillpagination-jump-input {
        width: 60px;
        min-height: 32px;
        box-sizing: border-box;
        padding: 6px 12px;
        background: var(--chillpagination-bg);
        border: 1px solid var(--chillpagination-border);
        border-radius: 6px;
        font-size: 13px;
        color: var(--chillpagination-text);
        text-align: center;
      }

      .chillpagination-jump-input:focus {
        outline: none;
        border-color: var(--chillpagination-active);
      }

      .chillpagination-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillpagination-btn { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const ICON_PREV = '<svg class="chillpagination-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M15 18l-6-6 6-6"/></svg>';
    const ICON_NEXT = '<svg class="chillpagination-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M9 18l6-6-6-6"/></svg>';

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    class ChillPaginationInstance {
        constructor(selector, options = {}) {
            this.element = typeof selector === 'string'
                ? (typeof document !== 'undefined' ? document.querySelector(selector) : null)
                : selector;

            this.options = {
                total: options.total || 0,
                pageSize: options.pageSize || 10,
                current: options.current || 1,
                maxButtons: Math.max(5, options.maxButtons || 7),
                size: options.size || 'md',
                shape: options.shape || 'default',
                simple: options.simple || false,
                showInfo: options.showInfo || false,
                showSizeChanger: options.showSizeChanger || false,
                pageSizeOptions: options.pageSizeOptions || [10, 20, 50, 100],
                showJumper: options.showJumper || false,
                prevText: options.prevText || null,
                nextText: options.nextText || null,
                ariaLabel: options.ariaLabel || 'Pagination',
                onChange: options.onChange || null,
                onPageSizeChange: options.onPageSizeChange || null,
                ...options
            };
            this.options.maxButtons = Math.max(5, this.options.maxButtons || 7);
            this._handlers = {};
            this._cleanups = [];
            this._destroyed = false;
            this._original = null;
            this.container = null;

            if (this.element) this.init();
        }

        init() {
            injectCSS();
            const nav = document.createElement('nav');
            this.container = nav;
            // The target element is swapped for the <nav> (original behaviour); destroy() swaps it back.
            if (this.element.parentNode) {
                this._original = this.element;
                this.element.parentNode.replaceChild(nav, this.element);
            } else {
                this.element.appendChild(nav);
            }
            this._clamp();
            this.render();
            this.bindEvents();
        }

        get totalPages() {
            return Math.max(1, Math.ceil(this.options.total / this.options.pageSize));
        }

        _clamp() {
            const o = this.options;
            o.pageSize = Math.max(1, parseInt(o.pageSize, 10) || 10);
            o.total = Math.max(0, parseInt(o.total, 10) || 0);
            o.current = Math.min(this.totalPages, Math.max(1, parseInt(o.current, 10) || 1));
        }

        // ---- events ---------------------------------------------------------
        on(event, fn) {
            (this._handlers[event] = this._handlers[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._handlers[event];
            if (l) this._handlers[event] = fn ? l.filter(f => f !== fn) : [];
            return this;
        }

        _emit(event, ...args) {
            (this._handlers[event] || []).slice().forEach(fn => { try { fn(...args); } catch (e) { /* ignore */ } });
        }

        _listen(target, type, fn) {
            target.addEventListener(type, fn);
            this._cleanups.push(() => target.removeEventListener(type, fn));
        }

        // ---- rendering ------------------------------------------------------
        _icon(svg) {
            const s = el('span');
            s.setAttribute('aria-hidden', 'true');
            s.style.display = 'inline-flex';
            s.innerHTML = svg; // constant markup, no user data
            return s;
        }

        _navBtn(action, disabled, text, html, icon, label) {
            const b = el('button', 'chillpagination-btn');
            b.type = 'button';
            b.dataset.action = action;
            b.setAttribute('aria-label', label);
            if (disabled) b.disabled = true;
            if (html) b.innerHTML = html;                 // explicit opt-in (prevHtml / nextHtml)
            else if (text) b.textContent = text;
            else b.appendChild(this._icon(icon));
            return b;
        }

        render() {
            if (this._destroyed || !this.container) return;
            const o = this.options;
            const nav = this.container;

            // remember focus across the rebuild
            const active = document.activeElement;
            let refocus = null;
            if (active && nav.contains(active)) {
                if (active.dataset && active.dataset.page) refocus = '[data-page="' + active.dataset.page + '"]';
                else if (active.dataset && active.dataset.action) refocus = '[data-action="' + active.dataset.action + '"]';
                else if (active.classList.contains('chillpagination-jump-input')) refocus = '.chillpagination-jump-input';
                else if (active.classList.contains('chillpagination-select')) refocus = '.chillpagination-select';
            }

            nav.className = `chillpagination chillpagination-${o.size}`;
            if (o.shape !== 'default') nav.classList.add(`chillpagination-${o.shape}`);
            if (o.simple) nav.classList.add('chillpagination-simple');
            nav.setAttribute('aria-label', o.ariaLabel);
            nav.textContent = '';

            if (o.simple) this.renderSimple(nav); else this.renderFull(nav);

            // polite live region announcing the current page
            const live = el('span', 'chillpagination-sr-only', 'Page ' + o.current + ' of ' + this.totalPages);
            live.setAttribute('role', 'status');
            live.setAttribute('aria-live', 'polite');
            nav.appendChild(live);

            if (refocus) {
                const t = nav.querySelector(refocus + ':not(:disabled)') || nav.querySelector('.chillpagination-btn.active');
                if (t && t.focus) t.focus();
            }
        }

        renderSimple(nav) {
            const o = this.options;
            nav.appendChild(this._navBtn('prev', o.current <= 1, null, null, ICON_PREV, 'Previous page'));
            nav.appendChild(el('span', 'chillpagination-info', o.current + ' / ' + this.totalPages));
            nav.appendChild(this._navBtn('next', o.current >= this.totalPages, null, null, ICON_NEXT, 'Next page'));
        }

        renderFull(nav) {
            const o = this.options;

            nav.appendChild(this._navBtn('prev', o.current <= 1, o.prevText, o.prevHtml, ICON_PREV, 'Previous page'));

            this.getPageNumbers().forEach(page => {
                if (page === '...') {
                    const e = el('span', 'chillpagination-ellipsis', '...');
                    e.setAttribute('aria-hidden', 'true');
                    nav.appendChild(e);
                } else {
                    const b = el('button', 'chillpagination-btn' + (page === o.current ? ' active' : ''), String(page));
                    b.type = 'button';
                    b.dataset.page = String(page);
                    b.setAttribute('aria-label', 'Page ' + page);
                    if (page === o.current) b.setAttribute('aria-current', 'page');
                    nav.appendChild(b);
                }
            });

            nav.appendChild(this._navBtn('next', o.current >= this.totalPages, o.nextText, o.nextHtml, ICON_NEXT, 'Next page'));

            if (o.showInfo || o.showSizeChanger) {
                const info = el('div', 'chillpagination-info');
                if (o.showSizeChanger) {
                    const select = el('select', 'chillpagination-select');
                    select.setAttribute('aria-label', 'Page size');
                    const sizes = o.pageSizeOptions.slice();
                    if (sizes.indexOf(o.pageSize) === -1) { sizes.push(o.pageSize); sizes.sort((a, b) => a - b); }
                    sizes.forEach(size => {
                        const opt = el('option', null, size + ' / page');
                        opt.value = String(size);
                        if (size === o.pageSize) opt.selected = true;
                        select.appendChild(opt);
                    });
                    info.appendChild(select);
                }
                if (o.showInfo) {
                    const start = o.total === 0 ? 0 : (o.current - 1) * o.pageSize + 1;
                    const end = Math.min(o.current * o.pageSize, o.total);
                    info.appendChild(el('span', null, (o.total === 0 ? '0' : start + '-' + end) + ' of ' + o.total));
                }
                nav.appendChild(info);
            }

            if (o.showJumper) {
                const jump = el('div', 'chillpagination-jump');
                const label = el('span', null, 'Go to');
                const input = el('input', 'chillpagination-jump-input');
                input.type = 'number';
                input.min = '1';
                input.max = String(this.totalPages);
                input.value = String(o.current);
                input.setAttribute('aria-label', 'Go to page');
                jump.appendChild(label);
                jump.appendChild(input);
                nav.appendChild(jump);
            }
        }

        getPageNumbers() {
            const total = this.totalPages;
            const current = this.options.current;
            const max = this.options.maxButtons;

            if (total <= max) {
                return Array.from({ length: total }, (_, i) => i + 1);
            }

            const pages = [];
            const sideWidth = Math.floor((max - 3) / 2);

            if (current <= sideWidth + 2) {
                for (let i = 1; i <= max - 2; i++) pages.push(i);
                pages.push('...', total);
            } else if (current >= total - sideWidth - 1) {
                pages.push(1, '...');
                for (let i = total - max + 3; i <= total; i++) pages.push(i);
            } else {
                pages.push(1, '...');
                for (let i = current - sideWidth; i <= current + sideWidth; i++) pages.push(i);
                pages.push('...', total);
            }

            return pages;
        }

        getPrevIcon() { return ICON_PREV; }
        getNextIcon() { return ICON_NEXT; }

        // ---- interaction (delegated, bound once) ------------------------------
        bindEvents() {
            if (this._bound) return;
            this._bound = true;
            const nav = this.container;

            this._listen(nav, 'click', (e) => {
                const btn = e.target.closest && e.target.closest('.chillpagination-btn');
                if (!btn || btn.disabled || !nav.contains(btn)) return;

                if (btn.dataset.action === 'prev') this.goToPage(this.options.current - 1);
                else if (btn.dataset.action === 'next') this.goToPage(this.options.current + 1);
                else if (btn.dataset.page) this.goToPage(parseInt(btn.dataset.page, 10));
            });

            this._listen(nav, 'change', (e) => {
                const t = e.target;
                if (t && t.classList && t.classList.contains('chillpagination-select')) {
                    this.setPageSize(parseInt(t.value, 10));
                }
            });

            this._listen(nav, 'keydown', (e) => {
                const t = e.target;
                if (t && t.classList && t.classList.contains('chillpagination-jump-input')) {
                    if (e.key === 'Enter') {
                        const page = parseInt(t.value, 10);
                        if (!isNaN(page)) this.goToPage(page);
                    }
                    return;
                }
                if (!t || !t.classList || !t.classList.contains('chillpagination-btn')) return;
                const btns = Array.from(nav.querySelectorAll('.chillpagination-btn:not(:disabled)'));
                const i = btns.indexOf(t);
                let n = -1;
                if (e.key === 'ArrowRight') n = Math.min(btns.length - 1, i + 1);
                else if (e.key === 'ArrowLeft') n = Math.max(0, i - 1);
                else if (e.key === 'Home') n = 0;
                else if (e.key === 'End') n = btns.length - 1;
                if (n >= 0) { e.preventDefault(); btns[n].focus(); }
            });
        }

        // ---- public API ------------------------------------------------------
        goToPage(page, opts) {
            const p = Math.min(this.totalPages, Math.max(1, parseInt(page, 10) || 1));
            const changed = p !== this.options.current;
            this.options.current = p;
            this.render();
            if (changed && !(opts && opts.silent)) {
                if (this.options.onChange) this.options.onChange(p, this.options.pageSize);
                this._emit('change', p, this.options.pageSize);
            }
            return this;
        }

        next() { return this.goToPage(this.options.current + 1); }
        prev() { return this.goToPage(this.options.current - 1); }

        setTotal(total) {
            this.options.total = total;
            this._clamp();
            this.render();
            return this;
        }

        setPageSize(size) {
            this.options.pageSize = size;
            this.options.current = 1;
            this._clamp();
            this.render();
            if (this.options.onPageSizeChange) this.options.onPageSizeChange(this.options.pageSize);
            this._emit('pagesize', this.options.pageSize);
            return this;
        }

        getCurrentPage() {
            return this.options.current;
        }

        getPageSize() {
            return this.options.pageSize;
        }

        getTotalPages() {
            return this.totalPages;
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            const nav = this.container;
            if (nav && nav.parentNode) {
                if (this._original) nav.parentNode.replaceChild(this._original, nav);
                else nav.parentNode.removeChild(nav);
            }
            this.container = null;
            this._handlers = {};
        }
    }

    const ChillPagination = {
        version: VERSION,

        init(selector, options) {
            return new ChillPaginationInstance(selector, options);
        },

        create(selector, options) {
            return new ChillPaginationInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillPagination;
    } else {
        window.ChillPagination = ChillPagination;
    }

})(typeof window !== 'undefined' ? window : this);
