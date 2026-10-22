/**
 * ChillEmptyState - Zero-dependency Empty State Component
 *
 * Usage:
 *   const el = ChillEmptyState.create({
 *     preset: 'noResults',                       // optional ready-made icon + copy
 *     title: 'Nothing here yet', description: 'Create your first item.',
 *     actions: [{ label: 'Create', onClick() {} }, { label: 'Docs', href: 'https://example.com' }]
 *   });
 *   container.appendChild(el);                   // el.destroy() removes it and its listeners
 *   const h = ChillEmptyState.mount('#list', { preset: 'error' });   // { element, update(opts), destroy() }
 *
 * Options (all optional):
 *   preset        string   ''    'empty' | 'noResults' | 'noData' | 'error' | 'offline' | 'noPermission' | 'inbox' | 'folder'
 *                                (fills iconType/title/description defaults; your own options win).
 *   title         string   ''    Rendered as text.   titleHtml: string  -> markup (trusted only)
 *   description   string   ''    Rendered as text.   descriptionHtml: string -> markup (trusted only)
 *   html          boolean  false Opt in: title/description/icon strings are inserted as HTML (trusted only).
 *   icon          string|Node    Text/emoji or a DOM Node.  iconHtml: string -> markup (e.g. your own <svg>).
 *   iconType      string         Built-in icon: empty search error noData folder inbox lock offline bell users cart image
 *   iconWrapper   boolean  false Circle behind the icon.
 *   illustration  string         Image URL (http(s), relative, data:image/*, blob:). Unsafe schemes are ignored.
 *   illustrationAlt string ''    Alt text for the image (decorative by default).
 *   illustrationType string      Built-in inline illustration: empty | search | error | offline
 *   size          string   'md'  'sm' | 'md' | 'lg'
 *   bordered      boolean  true  Dashed border + background.
 *   role          string   'status' ARIA role of the container ('status' | 'alert' | 'region' ...).
 *   headingLevel  number   3     Heading level of the title (1-6).
 *   actions       array          { label, href?, target?, onClick?, variant?: 'primary'|'secondary'|'danger'|'ghost', icon? (Node/text), iconHtml?, disabled? }
 *                                label is text. href must be http(s)/mailto/tel/relative/# - others fall back to a <button>.
 *
 * Returned element has destroy(). ChillEmptyState.icons / .illustrations / .presets expose the built-ins.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillemptystate_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chillemptystate-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillemptystate-styles';
        style.textContent = `
      :root {
        --chillemptystate-bg: #f9fafb;
        --chillemptystate-text: #171717;
        --chillemptystate-text-muted: #6b7280;
        --chillemptystate-border: #e5e5e5;
        --chillemptystate-icon: #9ca3af;
        --chillemptystate-primary: #3b82f6;
        --chillemptystate-danger: #dc2626;
        --chillemptystate-focus: rgba(59, 130, 246, 0.55);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillemptystate-bg: #1f1f1f;
          --chillemptystate-text: #fafafa;
          --chillemptystate-text-muted: #a3a3a3;
          --chillemptystate-border: #262626;
          --chillemptystate-icon: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillemptystate-bg: #1f1f1f;
        --chillemptystate-text: #fafafa;
        --chillemptystate-text-muted: #a3a3a3;
        --chillemptystate-border: #262626;
        --chillemptystate-icon: #6b7280;
      }

      .chillemptystate {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        box-sizing: border-box;
      }

      .chillemptystate-bordered {
        border: 1px dashed var(--chillemptystate-border);
        border-radius: 12px;
        background: var(--chillemptystate-bg);
      }

      .chillemptystate-icon {
        display: inline-block;
        width: 64px;
        height: 64px;
        color: var(--chillemptystate-icon);
        margin-bottom: 16px;
        font-size: 48px;
        line-height: 64px;
      }

      .chillemptystate-icon svg { width: 100%; height: 100%; }

      .chillemptystate-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: var(--chillemptystate-bg);
        border-radius: 50%;
        margin-bottom: 20px;
      }

      .chillemptystate-icon-wrapper .chillemptystate-icon {
        margin-bottom: 0;
        width: 40px;
        height: 40px;
        font-size: 28px;
        line-height: 40px;
      }

      .chillemptystate-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--chillemptystate-text);
        margin: 0 0 8px;
      }

      .chillemptystate-description {
        font-size: 14px;
        color: var(--chillemptystate-text-muted);
        margin: 0 0 24px;
        max-width: 400px;
        line-height: 1.5;
      }

      .chillemptystate-title:last-child,
      .chillemptystate-description:last-child { margin-bottom: 0; }

      .chillemptystate-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .chillemptystate-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 36px;
        padding: 10px 20px;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.2;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
        text-decoration: none;
      }

      .chillemptystate-btn:focus { outline: none; }

      .chillemptystate-btn:focus-visible {
        outline: 2px solid var(--chillemptystate-focus);
        outline-offset: 2px;
      }

      .chillemptystate-btn:disabled,
      .chillemptystate-btn[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chillemptystate-btn-primary {
        background: var(--chillemptystate-primary);
        color: white;
        border: none;
      }

      .chillemptystate-btn-primary:hover { filter: brightness(0.9); }

      .chillemptystate-btn-danger {
        background: var(--chillemptystate-danger);
        color: white;
        border: none;
      }

      .chillemptystate-btn-danger:hover { filter: brightness(0.9); }

      .chillemptystate-btn-secondary {
        background: none;
        color: var(--chillemptystate-text);
        border: 1px solid var(--chillemptystate-border);
      }

      .chillemptystate-btn-secondary:hover { background: var(--chillemptystate-bg); }

      .chillemptystate-btn-ghost {
        background: none;
        color: var(--chillemptystate-text);
        border: none;
      }

      .chillemptystate-btn-ghost:hover { background: var(--chillemptystate-border); }

      .chillemptystate-btn-icon {
        display: inline-flex;
        width: 16px;
        height: 16px;
      }

      .chillemptystate-btn-icon svg { width: 100%; height: 100%; }

      /* Sizes */
      .chillemptystate-sm { padding: 32px 16px; }
      .chillemptystate-sm .chillemptystate-icon { width: 48px; height: 48px; line-height: 48px; font-size: 36px; }
      .chillemptystate-sm .chillemptystate-title { font-size: 16px; }
      .chillemptystate-sm .chillemptystate-description { font-size: 13px; }

      .chillemptystate-lg { padding: 64px 32px; }
      .chillemptystate-lg .chillemptystate-icon { width: 80px; height: 80px; line-height: 80px; font-size: 60px; }
      .chillemptystate-lg .chillemptystate-title { font-size: 24px; }

      /* Illustrations */
      .chillemptystate-illustration {
        width: 200px;
        max-width: 100%;
        height: auto;
        margin-bottom: 24px;
        color: var(--chillemptystate-icon);
      }

      @media (prefers-reduced-motion: reduce) {
        .chillemptystate-btn { transition: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const svg = (inner) => `<svg ${SVG_ATTRS}>${inner}</svg>`;

    const defaultIcons = {
        empty: svg('<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>'),
        search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'),
        error: svg('<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>'),
        noData: svg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/>'),
        folder: svg('<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>'),
        inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>'),
        lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'),
        offline: svg('<path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>'),
        bell: svg('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>'),
        users: svg('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>'),
        cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>'),
        image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>')
    };

    const ISVG = (inner) => `<svg viewBox="0 0 200 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
    const illustrations = {
        empty: ISVG('<ellipse cx="100" cy="122" rx="62" ry="8" opacity=".25" fill="currentColor" stroke="none"/><path d="M40 60l60-30 60 30v46l-60 24-60-24z"/><path d="M40 60l60 28 60-28M100 88v42"/><path d="M70 45l60 28" opacity=".5"/>'),
        search: ISVG('<ellipse cx="100" cy="124" rx="60" ry="7" opacity=".25" fill="currentColor" stroke="none"/><circle cx="90" cy="64" r="38"/><path d="M118 92l32 32"/><path d="M74 58h32M74 72h20" opacity=".5"/>'),
        error: ISVG('<ellipse cx="100" cy="124" rx="60" ry="7" opacity=".25" fill="currentColor" stroke="none"/><path d="M100 22l62 100H38z"/><path d="M100 60v32"/><circle cx="100" cy="106" r="2" fill="currentColor"/>'),
        offline: ISVG('<ellipse cx="100" cy="124" rx="60" ry="7" opacity=".25" fill="currentColor" stroke="none"/><path d="M40 62a84 84 0 0 1 120 0M62 84a52 52 0 0 1 76 0M82 104a22 22 0 0 1 36 0"/><circle cx="100" cy="116" r="2" fill="currentColor"/><path d="M50 30l100 90" opacity=".6"/>')
    };

    const presets = {
        empty: { iconType: 'empty', title: 'Nothing here yet', description: 'There is nothing to show right now.' },
        noResults: { iconType: 'search', title: 'No results found', description: 'Try adjusting your search or filters.' },
        noData: { iconType: 'noData', title: 'No data available', description: 'Data will appear here once it is available.' },
        error: { iconType: 'error', title: 'Something went wrong', description: 'Please try again in a moment.' },
        offline: { iconType: 'offline', title: 'You are offline', description: 'Check your connection and try again.' },
        noPermission: { iconType: 'lock', title: 'Access denied', description: 'You do not have permission to view this.' },
        inbox: { iconType: 'inbox', title: 'All caught up', description: 'You have no new messages.' },
        folder: { iconType: 'folder', title: 'This folder is empty', description: 'Add files to get started.' }
    };

    const ALLOWED_URL = /^(?:https?:|mailto:|tel:)/i;
    function safeHref(href) {
        if (typeof href !== 'string') return null;
        const h = href.trim();
        if (!h) return null;
        // relative paths without a scheme are OK; anything with a scheme must be allow-listed
        if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return ALLOWED_URL.test(h) ? h : null;
        return h;
    }
    function safeImgSrc(src) {
        if (typeof src !== 'string') return null;
        const s = src.trim();
        if (!s) return null;
        if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return /^(?:https?:|blob:|data:image\/)/i.test(s) ? s : null;
        return s;
    }

    function fill(target, value, html, htmlOverride) {
        if (htmlOverride != null) { target.innerHTML = String(htmlOverride); return true; }
        if (value == null || value === '') return false;
        if (typeof value === 'object' && value.nodeType) target.appendChild(value);
        else if (html) target.innerHTML = String(value);
        else target.textContent = String(value);
        return true;
    }

    function create(options = {}) {
        if (typeof document === 'undefined') throw new Error('ChillEmptyState requires a DOM');
        injectCSS();

        const preset = options.preset && presets[options.preset] ? presets[options.preset] : null;
        const o = { ...(preset || {}), ...options };
        const html = o.html === true;

        const container = document.createElement('div');
        container.className = `chillemptystate chillemptystate-${String(o.size || 'md').replace(/[^\w-]/g, '')}`;
        container.setAttribute('role', o.role || 'status');
        if ((o.role || 'status') === 'status') container.setAttribute('aria-live', 'polite');
        if (o.bordered !== false) container.classList.add('chillemptystate-bordered');

        const cleanups = [];

        // Illustration / icon
        const illSrc = o.illustration ? safeImgSrc(o.illustration) : null;
        if (illSrc) {
            const img = document.createElement('img');
            img.className = 'chillemptystate-illustration';
            img.setAttribute('src', illSrc);
            img.setAttribute('alt', o.illustrationAlt || '');
            container.appendChild(img);
        } else if (!o.illustration && o.illustrationType && illustrations[o.illustrationType]) {
            const wrap = document.createElement('div');
            wrap.className = 'chillemptystate-illustration';
            wrap.setAttribute('aria-hidden', 'true');
            wrap.innerHTML = illustrations[o.illustrationType];
            container.appendChild(wrap);
        } else if (o.icon || o.iconHtml || o.iconType) {
            const iconEl = document.createElement('span');
            iconEl.className = 'chillemptystate-icon';
            iconEl.setAttribute('aria-hidden', 'true');
            const has = fill(iconEl, o.icon, html, o.iconHtml);
            if (!has) iconEl.innerHTML = defaultIcons[o.iconType] || defaultIcons.empty;
            if (o.iconWrapper) {
                const wrapper = document.createElement('div');
                wrapper.className = 'chillemptystate-icon-wrapper';
                wrapper.appendChild(iconEl);
                container.appendChild(wrapper);
            } else {
                container.appendChild(iconEl);
            }
        }

        // Title
        if (o.title || o.titleHtml) {
            const level = Math.min(6, Math.max(1, parseInt(o.headingLevel, 10) || 3));
            const h = document.createElement(level === 3 ? 'h3' : 'div');
            if (level !== 3) { h.setAttribute('role', 'heading'); h.setAttribute('aria-level', String(level)); }
            h.className = 'chillemptystate-title';
            fill(h, o.title, html, o.titleHtml);
            container.appendChild(h);
        }

        // Description
        if (o.description || o.descriptionHtml) {
            const p = document.createElement('p');
            p.className = 'chillemptystate-description';
            fill(p, o.description, html, o.descriptionHtml);
            container.appendChild(p);
        }

        // Actions
        if (Array.isArray(o.actions) && o.actions.length > 0) {
            const bar = document.createElement('div');
            bar.className = 'chillemptystate-actions';
            o.actions.forEach((action, index) => {
                if (!action) return;
                const variant = String(action.variant || (index === 0 ? 'primary' : 'secondary')).replace(/[^\w-]/g, '');
                const href = action.href ? safeHref(action.href) : null;
                const el = document.createElement(href ? 'a' : 'button');
                el.className = `chillemptystate-btn chillemptystate-btn-${variant}`;
                if (href) {
                    el.setAttribute('href', href);
                    if (action.target) {
                        el.setAttribute('target', String(action.target));
                        if (String(action.target) === '_blank') el.setAttribute('rel', 'noopener noreferrer');
                    }
                    if (action.disabled) { el.setAttribute('aria-disabled', 'true'); el.setAttribute('tabindex', '-1'); }
                } else {
                    el.type = 'button';
                    if (action.disabled) el.disabled = true;
                }
                if (action.icon || action.iconHtml) {
                    const ic = document.createElement('span');
                    ic.className = 'chillemptystate-btn-icon';
                    ic.setAttribute('aria-hidden', 'true');
                    fill(ic, action.icon, false, action.iconHtml);
                    el.appendChild(ic);
                }
                const label = document.createElement('span');
                label.textContent = action.label == null ? '' : String(action.label);
                el.appendChild(label);

                if (typeof action.onClick === 'function') {
                    const handler = (e) => {
                        if (action.disabled) { e.preventDefault(); return; }
                        action.onClick(e);
                    };
                    el.addEventListener('click', handler);
                    cleanups.push(() => el.removeEventListener('click', handler));
                } else if (action.disabled && href) {
                    const stop = (e) => e.preventDefault();
                    el.addEventListener('click', stop);
                    cleanups.push(() => el.removeEventListener('click', stop));
                }
                bar.appendChild(el);
            });
            container.appendChild(bar);
        }

        container.destroy = function () {
            cleanups.splice(0).forEach(fn => fn());
            if (container.parentNode) container.parentNode.removeChild(container);
        };

        return container;
    }

    /** Render into a target and get an updatable handle. */
    function mount(target, options = {}) {
        const host = typeof target === 'string' ? document.querySelector(target) : target;
        if (!host) throw new Error('ChillEmptyState: target not found');
        let current = create(options);
        host.appendChild(current);
        const handle = {
            get element() { return current; },
            update(next) {
                const fresh = create({ ...options, ...next });
                current.destroy();
                host.appendChild(fresh);
                current = fresh;
                options = { ...options, ...next };
                return handle;
            },
            destroy() { current.destroy(); }
        };
        return handle;
    }

    const ChillEmptyState = {
        version: VERSION,

        create,
        mount,
        icons: defaultIcons,
        illustrations,
        presets,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillEmptyState;
    } else {
        window.ChillEmptyState = ChillEmptyState;
    }

})(typeof window !== 'undefined' ? window : this);
