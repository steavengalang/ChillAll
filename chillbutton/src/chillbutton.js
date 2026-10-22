/**
 * ChillButton - Zero-dependency Button Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const btn = ChillButton.create({ text: 'Save', variant: 'primary', onClick: save });
 *   document.body.appendChild(btn);
 *   btn.setLoading(true, 'Saving...');           // helpers attached to the element
 *   btn.destroy();                                // removes listeners
 *   const inst = ChillButton.init('.my-btn', { variant: 'outline', ripple: true });
 *   inst.setLoading(true); inst.destroy();
 *
 * create() options
 *   text          ''        label. Always inserted as TEXT (safe). Use `html: true` to opt in to markup (sanitised).
 *   html          false     treat `text` as HTML (scripts / on* handlers / javascript: URLs are stripped)
 *   icon          null      Node, or a string: plain text, or markup beginning with "<" (e.g. an <svg>) which is sanitised
 *   iconPosition  'left'    'left' | 'right'
 *   variant       'primary' primary | secondary | success | danger | warning | outline | ghost
 *   size          'md'      sm | md | lg
 *   type          'button'
 *   href          null      render an <a> (role link) instead of <button>; also `target`, `rel`
 *   fullWidth, iconOnly, disabled, loading   booleans
 *   loadingText   null      text shown next to the spinner while loading (default: content hidden under spinner)
 *   ripple        false     material-style ripple on press
 *   ariaLabel     null      aria-label (recommended for iconOnly)
 *   onClick       null
 * init(selector, options) accepts the same style options and decorates existing elements.
 * Element helpers (create): setLoading(bool, text?), setDisabled(bool), destroy()
 * Instance methods (init): setLoading(bool) | setLoading(el, bool), setVariant, setSize, setDisabled, destroy
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillbutton_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillbutton-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillbutton-styles';
        style.textContent = `
      :root {
        --chillbutton-primary: #3b82f6;
        --chillbutton-primary-hover: #2563eb;
        --chillbutton-secondary: #6b7280;
        --chillbutton-secondary-hover: #4b5563;
        --chillbutton-success: #22c55e;
        --chillbutton-success-hover: #16a34a;
        --chillbutton-danger: #ef4444;
        --chillbutton-danger-hover: #dc2626;
        --chillbutton-warning: #f59e0b;
        --chillbutton-warning-hover: #d97706;
        --chillbutton-bg: #ffffff;
        --chillbutton-text: #171717;
        --chillbutton-text-light: #ffffff;
        --chillbutton-border: #e5e5e5;
        --chillbutton-disabled-bg: #f3f4f6;
        --chillbutton-disabled-text: #9ca3af;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillbutton-bg: #171717;
          --chillbutton-text: #fafafa;
          --chillbutton-border: #404040;
          --chillbutton-disabled-bg: #374151;
          --chillbutton-disabled-text: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillbutton-bg: #171717;
        --chillbutton-text: #fafafa;
        --chillbutton-border: #404040;
        --chillbutton-disabled-bg: #374151;
        --chillbutton-disabled-text: #6b7280;
      }

      .chillbutton {
        position: relative;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        text-decoration: none;
        white-space: nowrap;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .chillbutton:focus {
        outline: none;
      }

      .chillbutton:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
      }

      .chillbutton:disabled,
      .chillbutton[aria-disabled="true"] {
        background: var(--chillbutton-disabled-bg) !important;
        color: var(--chillbutton-disabled-text) !important;
        cursor: not-allowed;
        border: none !important;
        pointer-events: auto;
      }

      /* Variants */
      .chillbutton-primary {
        background: var(--chillbutton-primary);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-primary:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-primary-hover);
      }

      .chillbutton-secondary {
        background: var(--chillbutton-secondary);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-secondary:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-secondary-hover);
      }

      .chillbutton-success {
        background: var(--chillbutton-success);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-success:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-success-hover);
      }

      .chillbutton-danger {
        background: var(--chillbutton-danger);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-danger:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-danger-hover);
      }

      .chillbutton-warning {
        background: var(--chillbutton-warning);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-warning:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-warning-hover);
      }

      .chillbutton-outline {
        background: transparent;
        color: var(--chillbutton-primary);
        border: 1px solid var(--chillbutton-primary);
      }

      .chillbutton-outline:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-primary);
        color: var(--chillbutton-text-light);
      }

      .chillbutton-ghost {
        background: transparent;
        color: var(--chillbutton-text);
      }

      .chillbutton-ghost:hover:not(:disabled):not([aria-disabled="true"]) {
        background: var(--chillbutton-border);
      }

      /* Sizes */
      .chillbutton-sm {
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 6px;
      }

      .chillbutton-md {
        padding: 10px 20px;
        font-size: 14px;
      }

      .chillbutton-lg {
        padding: 14px 28px;
        font-size: 16px;
        border-radius: 10px;
      }

      /* Loading State */
      .chillbutton-loading {
        pointer-events: none;
      }

      .chillbutton-loading .chillbutton-content {
        opacity: 0;
      }

      .chillbutton-spinner {
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: chillbutton-spin 0.6s linear infinite;
      }

      .chillbutton-loading-inline .chillbutton-content {
        display: none;
      }

      .chillbutton-loading-inline .chillbutton-spinner {
        position: static;
        flex-shrink: 0;
      }

      @keyframes chillbutton-spin {
        to { transform: rotate(360deg); }
      }

      /* Ripple */
      .chillbutton-ripple {
        position: absolute;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.25;
        transform: scale(0);
        pointer-events: none;
        animation: chillbutton-ripple 0.55s ease-out forwards;
      }

      @keyframes chillbutton-ripple {
        to { transform: scale(1); opacity: 0; }
      }

      /* Icon */
      .chillbutton-icon {
        display: inline-flex;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .chillbutton-icon > svg { width: 100%; height: 100%; }

      .chillbutton-lg .chillbutton-icon {
        width: 20px;
        height: 20px;
      }

      .chillbutton-sm .chillbutton-icon {
        width: 14px;
        height: 14px;
      }

      /* Full Width */
      .chillbutton-fullwidth {
        width: 100%;
      }

      /* Icon Only */
      .chillbutton-icon-only {
        padding: 10px;
      }

      .chillbutton-icon-only.chillbutton-sm {
        padding: 6px;
      }

      .chillbutton-icon-only.chillbutton-lg {
        padding: 14px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillbutton { transition: none; }
        .chillbutton-spinner { animation-duration: 1.6s; }
        .chillbutton-ripple { animation: none; display: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form'];

    /** Minimal HTML sanitiser: drops dangerous elements, on* attributes and javascript:/data: URLs. */
    function sanitizeHtml(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(html);
        const root = tpl.content;
        BLOCKED_TAGS.forEach(t => {
            root.querySelectorAll(t).forEach(n => n.parentNode && n.parentNode.removeChild(n));
        });
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

    function iconNode(icon) {
        const wrap = document.createElement('span');
        wrap.className = 'chillbutton-icon';
        wrap.setAttribute('aria-hidden', 'true');
        if (icon && icon.nodeType) wrap.appendChild(icon);
        else if (typeof icon === 'string' && icon.trim().charAt(0) === '<') wrap.appendChild(sanitizeHtml(icon));
        else wrap.textContent = String(icon);
        return wrap;
    }

    function isLink(el) {
        return el && el.tagName === 'A';
    }

    function applyDisabled(el, disabled) {
        if (isLink(el)) {
            if (disabled) {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('tabindex', '-1');
            } else {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('tabindex');
            }
        } else {
            el.disabled = !!disabled;
            if (el.tagName !== 'BUTTON') {
                if (disabled) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
            }
        }
    }

    // loading state: wrap existing child nodes (moved, never re-parsed) so event handlers on them survive
    function setLoadingState(el, loading, loadingText, restoreDisabled) {
        const isLoading = el.classList.contains('chillbutton-loading');
        if (loading) {
            if (isLoading) return;
            el.classList.add('chillbutton-loading');
            const content = document.createElement('span');
            content.className = 'chillbutton-content';
            while (el.firstChild) content.appendChild(el.firstChild);
            el.appendChild(content);
            if (loadingText) {
                el.classList.add('chillbutton-loading-inline');
                const lt = document.createElement('span');
                lt.className = 'chillbutton-loading-text';
                lt.textContent = String(loadingText);
                el.appendChild(lt);
                // spinner goes before the text
                const sp = document.createElement('span');
                sp.className = 'chillbutton-spinner';
                sp.setAttribute('aria-hidden', 'true');
                el.insertBefore(sp, lt);
            } else {
                const sp = document.createElement('span');
                sp.className = 'chillbutton-spinner';
                sp.setAttribute('aria-hidden', 'true');
                el.appendChild(sp);
            }
            el.setAttribute('aria-busy', 'true');
            applyDisabled(el, true);
        } else {
            if (!isLoading) return;
            el.classList.remove('chillbutton-loading', 'chillbutton-loading-inline');
            const content = el.querySelector(':scope > .chillbutton-content');
            if (content) {
                while (content.firstChild) el.insertBefore(content.firstChild, content);
            }
            ['.chillbutton-content', '.chillbutton-spinner', '.chillbutton-loading-text'].forEach(sel => {
                const n = el.querySelector(':scope > ' + sel);
                if (n) el.removeChild(n);
            });
            el.removeAttribute('aria-busy');
            applyDisabled(el, !!restoreDisabled);
        }
    }

    function addRipple(el, e) {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('chillbutton-loading')) return;
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2 || 40;
        const x = (typeof e.clientX === 'number' ? e.clientX - rect.left : rect.width / 2);
        const y = (typeof e.clientY === 'number' ? e.clientY - rect.top : rect.height / 2);
        const r = document.createElement('span');
        r.className = 'chillbutton-ripple';
        r.setAttribute('aria-hidden', 'true');
        r.style.width = r.style.height = size + 'px';
        r.style.left = (x - size / 2) + 'px';
        r.style.top = (y - size / 2) + 'px';
        el.appendChild(r);
        const remove = () => { if (r.parentNode) r.parentNode.removeChild(r); };
        r.addEventListener('animationend', remove);
        window.setTimeout(remove, 700);
    }

    function blockedLinkClick(e) {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }

    // ---- init(): decorate existing elements --------------------------------

    class ChillButtonInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.elements = []; this.options = options; return; }
            if (!selector) this.elements = [];
            else if (typeof selector === 'string') this.elements = Array.from(document.querySelectorAll(selector));
            else if (selector.nodeType === 1) this.elements = [selector];
            else this.elements = Array.from(selector);

            this.options = {
                variant: options.variant || 'primary',
                size: options.size || 'md',
                loading: options.loading || false,
                disabled: options.disabled || false,
                fullWidth: options.fullWidth || false,
                iconOnly: options.iconOnly || false,
                ripple: options.ripple || false,
                loadingText: options.loadingText || null,
                onClick: options.onClick || null
            };
            this._cleanup = [];

            this.init();
        }

        init() {
            injectCSS();
            this.elements.forEach(el => this.applyStyles(el));
        }

        applyStyles(element) {
            const o = this.options;
            element.classList.add('chillbutton');
            element.classList.add(`chillbutton-${o.variant}`);
            element.classList.add(`chillbutton-${o.size}`);

            if (o.fullWidth) element.classList.add('chillbutton-fullwidth');
            if (o.iconOnly) element.classList.add('chillbutton-icon-only');

            if (element.tagName !== 'BUTTON' && element.tagName !== 'A' && !element.hasAttribute('role')) {
                element.setAttribute('role', 'button');
                if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
                const key = e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); element.click(); }
                };
                element.addEventListener('keydown', key);
                this._cleanup.push(() => element.removeEventListener('keydown', key));
            }

            if (o.disabled) applyDisabled(element, true);
            if (o.loading) setLoadingState(element, true, o.loadingText, o.disabled);

            if (o.onClick) {
                element.addEventListener('click', o.onClick);
                this._cleanup.push(() => element.removeEventListener('click', o.onClick));
            }
            if (isLink(element)) {
                element.addEventListener('click', blockedLinkClick, true);
                this._cleanup.push(() => element.removeEventListener('click', blockedLinkClick, true));
            }
            if (o.ripple) {
                const rp = e => addRipple(element, e);
                element.addEventListener('pointerdown', rp);
                this._cleanup.push(() => element.removeEventListener('pointerdown', rp));
            }
        }

        /** setLoading(loading) for all elements, or the legacy setLoading(element, loading). */
        setLoading(a, b) {
            if (typeof a === 'boolean') {
                this.elements.forEach(el => setLoadingState(el, a, this.options.loadingText, this.options.disabled));
            } else if (a && a.nodeType === 1) {
                setLoadingState(a, !!b, this.options.loadingText, this.options.disabled);
            }
        }

        setVariant(variant) {
            this.elements.forEach(el => {
                el.classList.remove(`chillbutton-${this.options.variant}`);
                el.classList.add(`chillbutton-${variant}`);
            });
            this.options.variant = variant;
        }

        setSize(size) {
            this.elements.forEach(el => {
                el.classList.remove(`chillbutton-${this.options.size}`);
                el.classList.add(`chillbutton-${size}`);
            });
            this.options.size = size;
        }

        setDisabled(disabled) {
            this.elements.forEach(el => applyDisabled(el, disabled));
            this.options.disabled = disabled;
        }

        destroy() {
            this.elements.forEach(el => {
                setLoadingState(el, false, null, this.options.disabled);
                el.querySelectorAll(':scope > .chillbutton-ripple').forEach(r => r.parentNode && r.parentNode.removeChild(r));
                el.classList.remove(
                    'chillbutton',
                    `chillbutton-${this.options.variant}`,
                    `chillbutton-${this.options.size}`,
                    'chillbutton-fullwidth',
                    'chillbutton-icon-only',
                    'chillbutton-loading'
                );
            });
            (this._cleanup || []).forEach(fn => fn());
            this._cleanup = [];
        }
    }

    // ---- create(): build a new element -------------------------------------

    function createButton(options = {}) {
        injectCSS();

        const link = !!options.href;
        const button = document.createElement(link ? 'a' : 'button');
        if (link) {
            button.setAttribute('href', String(options.href));
            if (options.target) {
                button.setAttribute('target', String(options.target));
                button.setAttribute('rel', options.rel || (options.target === '_blank' ? 'noopener noreferrer' : ''));
                if (!button.getAttribute('rel')) button.removeAttribute('rel');
            } else if (options.rel) {
                button.setAttribute('rel', String(options.rel));
            }
        } else {
            button.type = options.type || 'button';
        }
        button.className = 'chillbutton';

        const variant = options.variant || 'primary';
        const size = options.size || 'md';

        button.classList.add(`chillbutton-${variant}`);
        button.classList.add(`chillbutton-${size}`);

        if (options.fullWidth) button.classList.add('chillbutton-fullwidth');
        if (options.iconOnly) button.classList.add('chillbutton-icon-only');
        if (options.ariaLabel) button.setAttribute('aria-label', String(options.ariaLabel));
        if (options.title) button.title = String(options.title);

        if (options.icon && options.iconPosition !== 'right') {
            button.appendChild(iconNode(options.icon));
        }

        if (options.text) {
            const span = document.createElement('span');
            if (options.html) span.appendChild(sanitizeHtml(options.text));
            else span.textContent = String(options.text);
            button.appendChild(span);
        }

        if (options.icon && options.iconPosition === 'right') {
            button.appendChild(iconNode(options.icon));
        }

        const cleanups = [];
        let disabledFlag = !!options.disabled;

        if (disabledFlag) applyDisabled(button, true);
        if (link) {
            button.addEventListener('click', blockedLinkClick, true);
            cleanups.push(() => button.removeEventListener('click', blockedLinkClick, true));
        }

        if (options.onClick) {
            button.addEventListener('click', options.onClick);
            cleanups.push(() => button.removeEventListener('click', options.onClick));
        }

        if (options.ripple) {
            const rp = e => addRipple(button, e);
            button.addEventListener('pointerdown', rp);
            cleanups.push(() => button.removeEventListener('pointerdown', rp));
        }

        if (options.loading) setLoadingState(button, true, options.loadingText, disabledFlag);

        // helpers on the element (additive; the return value is still the DOM element)
        button.setLoading = function (loading, text) {
            setLoadingState(button, !!loading, text || options.loadingText, disabledFlag);
            return button;
        };
        button.setDisabled = function (disabled) {
            disabledFlag = !!disabled;
            if (!button.classList.contains('chillbutton-loading')) applyDisabled(button, disabledFlag);
            return button;
        };
        button.destroy = function () {
            cleanups.forEach(fn => fn());
            cleanups.length = 0;
            if (button.parentNode) button.parentNode.removeChild(button);
        };

        return button;
    }

    const ChillButton = {
        version: VERSION,

        init(selector, options) {
            return new ChillButtonInstance(selector, options);
        },

        create(options) {
            return createButton(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillButton;
    } else {
        window.ChillButton = ChillButton;
    }

})(typeof window !== 'undefined' ? window : this);
