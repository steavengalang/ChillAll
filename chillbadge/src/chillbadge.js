/**
 * ChillBadge - Zero-dependency Badge Component
 *
 * Usage:
 *   const el = ChillBadge.create({ text: 'New', variant: 'primary' });
 *   const n  = ChillBadge.createNotification(120, { max: 99 });   // "99+"
 *   const d  = ChillBadge.createDot({ variant: 'success', pulse: true, label: 'Online' });
 *
 * create(options):
 *   text|label   string   Badge text (escaped; set `html: true` to treat as trusted HTML)
 *   html         boolean  false  Treat text as HTML (opt-in, caller must sanitise)
 *   icon         string   Trusted icon markup (e.g. an <svg>), developer supplied
 *   variant      default|primary|success|warning|error|info  ('default')
 *   size         sm|md|lg ('md')
 *   solid, outline, shape ('rounded'|'square')
 *   dot          boolean  leading status dot
 *   dotOnly      boolean  render as a bare dot (no text; use `label` for the accessible name)
 *   pulse        boolean  animated pulse on the dot (disabled with prefers-reduced-motion)
 *   count        number   numeric text; combined with `max` (default 99) -> "99+"
 *   max          number   99  upper bound for `count`
 *   removable, onRemove(badge), removeLabel ('Remove')
 *   ariaLabel    string   explicit accessible name
 * The returned element exposes `badge.chillbadge = { setText, setCount, destroy }`.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillbadge_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chillbadge-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillbadge-styles';
        style.textContent = `
      :root {
        --chillbadge-default-bg: #e5e7eb;
        --chillbadge-default-text: #374151;
        --chillbadge-primary-bg: #dbeafe;
        --chillbadge-primary-text: #1d4ed8;
        --chillbadge-success-bg: #dcfce7;
        --chillbadge-success-text: #15803d;
        --chillbadge-warning-bg: #fef3c7;
        --chillbadge-warning-text: #b45309;
        --chillbadge-error-bg: #fee2e2;
        --chillbadge-error-text: #b91c1c;
        --chillbadge-info-bg: #e0f2fe;
        --chillbadge-info-text: #0369a1;
        --chillbadge-ring: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillbadge-default-bg: #374151;
          --chillbadge-default-text: #e5e7eb;
          --chillbadge-primary-bg: #1e3a5f;
          --chillbadge-primary-text: #93c5fd;
          --chillbadge-success-bg: #14532d;
          --chillbadge-success-text: #86efac;
          --chillbadge-warning-bg: #78350f;
          --chillbadge-warning-text: #fcd34d;
          --chillbadge-error-bg: #7f1d1d;
          --chillbadge-error-text: #fca5a5;
          --chillbadge-info-bg: #0c4a6e;
          --chillbadge-info-text: #7dd3fc;
          --chillbadge-ring: #60a5fa;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillbadge-default-bg: #374151;
        --chillbadge-default-text: #e5e7eb;
        --chillbadge-primary-bg: #1e3a5f;
        --chillbadge-primary-text: #93c5fd;
        --chillbadge-success-bg: #14532d;
        --chillbadge-success-text: #86efac;
        --chillbadge-warning-bg: #78350f;
        --chillbadge-warning-text: #fcd34d;
        --chillbadge-error-bg: #7f1d1d;
        --chillbadge-error-text: #fca5a5;
        --chillbadge-info-bg: #0c4a6e;
        --chillbadge-info-text: #7dd3fc;
        --chillbadge-ring: #60a5fa;
      }

      .chillbadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        border-radius: 9999px;
        white-space: nowrap;
        box-sizing: border-box;
      }

      .chillbadge-default { background: var(--chillbadge-default-bg); color: var(--chillbadge-default-text); }
      .chillbadge-primary { background: var(--chillbadge-primary-bg); color: var(--chillbadge-primary-text); }
      .chillbadge-success { background: var(--chillbadge-success-bg); color: var(--chillbadge-success-text); }
      .chillbadge-warning { background: var(--chillbadge-warning-bg); color: var(--chillbadge-warning-text); }
      .chillbadge-error { background: var(--chillbadge-error-bg); color: var(--chillbadge-error-text); }
      .chillbadge-info { background: var(--chillbadge-info-bg); color: var(--chillbadge-info-text); }

      /* Solid Variants */
      .chillbadge-solid.chillbadge-primary { background: #3b82f6; color: white; }
      .chillbadge-solid.chillbadge-success { background: #22c55e; color: white; }
      .chillbadge-solid.chillbadge-warning { background: #f59e0b; color: white; }
      .chillbadge-solid.chillbadge-error { background: #ef4444; color: white; }
      .chillbadge-solid.chillbadge-info { background: #0ea5e9; color: white; }

      /* Outline Variants */
      .chillbadge-outline {
        background: transparent;
        border: 1px solid currentColor;
      }

      /* Sizes */
      .chillbadge-sm { padding: 2px 8px; font-size: 11px; }
      .chillbadge-lg { padding: 6px 14px; font-size: 14px; }

      /* Shapes */
      .chillbadge-rounded { border-radius: 6px; }
      .chillbadge-square { border-radius: 4px; }

      /* With Dot */
      .chillbadge-dot::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }

      /* Icon */
      .chillbadge-icon { width: 14px; height: 14px; flex-shrink: 0; }
      .chillbadge-sm .chillbadge-icon { width: 12px; height: 12px; }
      .chillbadge-lg .chillbadge-icon { width: 16px; height: 16px; }

      /* Removable */
      .chillbadge-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        margin-left: 2px;
        background: none;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.15s ease;
      }
      .chillbadge-close:hover { opacity: 1; }
      .chillbadge-close:focus-visible { outline: 2px solid var(--chillbadge-ring); outline-offset: 1px; opacity: 1; }
      .chillbadge-close svg { width: 10px; height: 10px; }

      /* Notification Badge */
      .chillbadge-notification {
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .chillbadge-dot-only {
        width: 8px;
        height: 8px;
        min-width: 0;
        padding: 0;
        border-radius: 50%;
        position: relative;
      }
      .chillbadge-dot-only.chillbadge-dot::before { display: none; }

      /* Pulse */
      .chillbadge-pulse { position: relative; }
      .chillbadge-pulse::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: inherit;
        opacity: 0.6;
        animation: chillbadge-pulse 1.6s ease-out infinite;
        pointer-events: none;
      }
      @keyframes chillbadge-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chillbadge-pulse::after { animation: none; display: none; }
        .chillbadge-close { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function formatCount(value, max) {
        const n = Number(value);
        if (!isFinite(n)) return String(value);
        const m = max == null ? 99 : Number(max);
        return n > m ? m + '+' : String(n);
    }

    function create(options) {
        options = options || {};
        injectCSS();

        const badge = document.createElement('span');
        badge.className = 'chillbadge chillbadge-' + (options.variant || 'default') + ' chillbadge-' + (options.size || 'md');

        if (options.solid) badge.classList.add('chillbadge-solid');
        if (options.outline) badge.classList.add('chillbadge-outline');
        if (options.dot || options.dotOnly) badge.classList.add('chillbadge-dot');
        if (options.dotOnly) badge.classList.add('chillbadge-dot-only', 'chillbadge-solid');
        if (options.pulse) badge.classList.add('chillbadge-pulse');
        if (options.shape) badge.classList.add('chillbadge-' + options.shape);

        let textEl = null;
        let closeBtn = null;
        let onCloseClick = null;

        if (options.icon && !options.dotOnly) {
            const iconEl = document.createElement('span');
            iconEl.className = 'chillbadge-icon';
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.innerHTML = options.icon; // trusted, developer supplied icon markup
            badge.appendChild(iconEl);
        }

        function setText(text) {
            if (!textEl) return;
            if (options.html) textEl.innerHTML = text == null ? '' : String(text);
            else textEl.textContent = text == null ? '' : String(text);
        }

        if (!options.dotOnly) {
            textEl = document.createElement('span');
            textEl.className = 'chillbadge-text';
            badge.appendChild(textEl);
            const initial = options.count != null ? formatCount(options.count, options.max)
                : (options.text != null ? options.text : (options.label != null ? options.label : ''));
            setText(initial);
        }

        const name = options.ariaLabel || (options.dotOnly ? options.label : null);
        if (name) badge.setAttribute('aria-label', name);
        if (options.dotOnly) badge.setAttribute('role', 'status');

        if (options.removable) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'chillbadge-close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', options.removeLabel || 'Remove');
            closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            badge.appendChild(closeBtn);
            if (options.onRemove) {
                onCloseClick = function () { options.onRemove(badge); };
                closeBtn.addEventListener('click', onCloseClick);
            }
        }

        badge.chillbadge = {
            setText: setText,
            setCount: function (value, max) { setText(formatCount(value, max != null ? max : options.max)); },
            destroy: function () {
                if (closeBtn && onCloseClick) closeBtn.removeEventListener('click', onCloseClick);
                if (badge.parentNode) badge.parentNode.removeChild(badge);
            }
        };

        return badge;
    }

    /**
     * Notification-style counter badge. options: variant ('error'), solid (true), max (99), pulse, label.
     * value true | '' | null -> bare dot.
     */
    function createNotification(value, options) {
        options = options || {};
        injectCSS();

        const badge = document.createElement('span');
        badge.className = 'chillbadge chillbadge-notification chillbadge-' + (options.variant || 'error');

        if (options.solid !== false) badge.classList.add('chillbadge-solid');
        if (options.pulse) badge.classList.add('chillbadge-pulse');

        function render(v, max) {
            const dotOnly = v === true || v === '' || v == null;
            badge.classList.toggle('chillbadge-dot-only', dotOnly);
            badge.textContent = dotOnly ? '' : formatCount(v, max);
            if (options.label) badge.setAttribute('aria-label', options.label);
            else if (dotOnly) badge.setAttribute('aria-label', 'New notifications');
            else badge.setAttribute('aria-label', badge.textContent + ' notifications');
        }
        render(value, options.max);
        badge.setAttribute('role', 'status');

        badge.chillbadge = {
            setCount: function (v, max) { render(v, max != null ? max : options.max); },
            setText: function (v) { badge.textContent = v == null ? '' : String(v); },
            destroy: function () { if (badge.parentNode) badge.parentNode.removeChild(badge); }
        };

        return badge;
    }

    /** Bare status dot. options: variant ('success'), pulse, size, label (accessible name). */
    function createDot(options) {
        options = options || {};
        return create({
            variant: options.variant || 'success',
            size: options.size,
            pulse: options.pulse,
            label: options.label,
            dotOnly: true
        });
    }

    const ChillBadge = {
        version: VERSION,

        create,
        createNotification,
        createDot,
        formatCount,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillBadge;
    } else {
        window.ChillBadge = ChillBadge;
    }

})(typeof window !== 'undefined' ? window : this);
