/**
 * ChillSkeleton - Zero-dependency Skeleton Loading Component
 *
 * Usage:
 *   container.appendChild(ChillSkeleton.preset('card'));                 // presets: avatar | text | card | list | table | table-row | title
 *   container.appendChild(ChillSkeleton.preset('text', { lines: 4 }));
 *   container.appendChild(ChillSkeleton.create({ preset: 'avatar', size: 56 }));
 *   container.appendChild(ChillSkeleton.create({ width: 120, height: 16 }));   // single block
 *   ChillSkeleton.reveal(skeletonEl, realContentEl);                           // swap in real content, clears aria-busy
 *
 * Single blocks:  create({ variant:'text|title|circle|rounded|square', width, height, animate:true, animation:'shimmer|pulse', className })
 * Factories:      text(opts) title(opts) circle(size, opts) rectangle(w, h, opts) card(opts) table(rows, cols, opts) list(count, opts)
 * Presets:        preset(name, opts) - opts common to all: label ('Loading'), animate, animation
 *   avatar     { size: 40, lines: 2 }            circle + text lines (lines: 0 = bare circle)
 *   text       { lines: 3, lastWidth: '70%' }    paragraph
 *   title      { width: '60%' }
 *   card       { image: true, imageHeight: 150, avatar: true, avatarSize: 40, lines: 3 }
 *   list       { count: 5, avatar: true, avatarSize: 48 }
 *   table      { rows: 5, cols: 4 }
 *   table-row  { cols: 4 }
 * A11y: groups (card/list/table/preset...) get role="status" aria-busy="true" aria-label; single pieces are aria-hidden.
 * Motion: shimmer/pulse are disabled under prefers-reduced-motion. Also: setBusy(el, bool), remove(el).
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillskeleton_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chillskeleton-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillskeleton-styles';
        style.textContent = `
      :root {
        --chillskeleton-base: #e5e7eb;
        --chillskeleton-shine: #f3f4f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillskeleton-base: #374151;
          --chillskeleton-shine: #4b5563;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillskeleton-base: #374151;
        --chillskeleton-shine: #4b5563;
      }

      .chillskeleton {
        background: var(--chillskeleton-base);
        border-radius: 4px;
        position: relative;
        overflow: hidden;
      }

      .chillskeleton-animate {
        background: linear-gradient(
          90deg,
          var(--chillskeleton-base) 0%,
          var(--chillskeleton-shine) 50%,
          var(--chillskeleton-base) 100%
        );
        background-size: 200% 100%;
        animation: chillskeleton-shimmer 1.5s ease-in-out infinite;
      }

      @keyframes chillskeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .chillskeleton-pulse {
        animation: chillskeleton-pulse 2s ease-in-out infinite;
      }

      @keyframes chillskeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @media (prefers-reduced-motion: reduce) {
        .chillskeleton-animate, .chillskeleton-pulse {
          animation: none !important;
        }
        .chillskeleton-animate {
          background: var(--chillskeleton-base);
        }
      }

      /* Shapes */
      .chillskeleton-text { height: 16px; border-radius: 4px; }
      .chillskeleton-title { height: 24px; border-radius: 4px; }
      .chillskeleton-circle { border-radius: 50%; flex-shrink: 0; }
      .chillskeleton-rounded { border-radius: 8px; }
      .chillskeleton-square { border-radius: 0; }

      /* Presets */
      .chillskeleton-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        border: 1px solid var(--chillskeleton-base);
        border-radius: 12px;
      }

      .chillskeleton-avatar-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chillskeleton-lines {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .chillskeleton-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chillskeleton-table {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .chillskeleton-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chillskeleton-flex-1 { flex: 1; }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function px(v) {
        return typeof v === 'number' ? `${v}px` : v;
    }

    function cls(s) {
        return String(s).replace(/[^\w-]/g, '');
    }

    function group(className, options) {
        injectCSS();
        const el = document.createElement('div');
        el.className = className;
        markGroup(el, options);
        return el;
    }

    function markGroup(el, options) {
        el.setAttribute('role', 'status');
        el.setAttribute('aria-busy', 'true');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', (options && options.label) || 'Loading');
        return el;
    }

    /** Parts nested in a group inherit animation settings from the group options. */
    function passthrough(options) {
        const o = {};
        if (options && options.animate === false) o.animate = false;
        if (options && options.animation) o.animation = options.animation;
        return o;
    }

    function createSkeleton(options = {}) {
        if (options.preset) {
            const { preset, ...rest } = options;
            return createPreset(preset, rest);
        }
        injectCSS();

        const skeleton = document.createElement('div');
        skeleton.className = 'chillskeleton';
        skeleton.setAttribute('aria-hidden', 'true');

        if (options.animate !== false) {
            skeleton.classList.add(options.animation === 'pulse' ? 'chillskeleton-pulse' : 'chillskeleton-animate');
        }

        if (options.variant) {
            skeleton.classList.add(`chillskeleton-${cls(options.variant)}`);
        }

        if (options.width) skeleton.style.width = px(options.width);
        if (options.height) skeleton.style.height = px(options.height);

        if (options.className) {
            const names = String(options.className).split(/\s+/).filter(Boolean);
            if (names.length) skeleton.classList.add(...names);
        }

        return skeleton;
    }

    function createText(options = {}) {
        return createSkeleton({ variant: 'text', width: options.width || '100%', ...options });
    }

    function createTitle(options = {}) {
        return createSkeleton({ variant: 'title', width: options.width || '60%', ...options });
    }

    function createCircle(size = 40, options = {}) {
        return createSkeleton({ variant: 'circle', width: size, height: size, ...options });
    }

    function createRectangle(width, height, options = {}) {
        return createSkeleton({ variant: 'rounded', width, height, ...options });
    }

    function textLines(count, options, lastWidth) {
        const o = passthrough(options);
        const wrap = document.createElement('div');
        wrap.className = 'chillskeleton-lines';
        const n = Math.max(0, parseInt(count, 10) || 0);
        for (let i = 0; i < n; i++) {
            wrap.appendChild(createText({ ...o, width: i === n - 1 && n > 1 ? lastWidth : '100%' }));
        }
        return wrap;
    }

    function createCard(options = {}) {
        const card = group('chillskeleton-card', options);
        const o = passthrough(options);

        if (options.image !== false) {
            card.appendChild(createRectangle('100%', options.imageHeight || 150, o));
        }

        if (options.avatar !== false) {
            const row = document.createElement('div');
            row.className = 'chillskeleton-avatar-group';
            row.appendChild(createCircle(options.avatarSize || 40, o));

            const lines = document.createElement('div');
            lines.className = 'chillskeleton-lines chillskeleton-flex-1';
            lines.appendChild(createText({ ...o, width: '60%' }));
            lines.appendChild(createText({ ...o, width: '40%' }));
            row.appendChild(lines);
            card.appendChild(row);
        }

        if (options.lines !== 0) {
            card.appendChild(textLines(options.lines || 3, options, '70%'));
        }

        return card;
    }

    function tableRow(cols, options) {
        const o = passthrough(options);
        const row = document.createElement('div');
        row.className = 'chillskeleton-row';
        for (let j = 0; j < cols; j++) {
            const cell = createText({ ...o, width: `${100 / cols}%` });
            cell.classList.add('chillskeleton-flex-1');
            row.appendChild(cell);
        }
        return row;
    }

    function createTable(rows = 5, cols = 4, options = {}) {
        const table = group('chillskeleton-table', options);
        for (let i = 0; i < rows; i++) table.appendChild(tableRow(cols, options));
        return table;
    }

    function createList(count = 5, options = {}) {
        const list = group('chillskeleton-list', options);
        const o = passthrough(options);

        for (let i = 0; i < count; i++) {
            const item = document.createElement('div');
            item.className = 'chillskeleton-avatar-group';

            if (options.avatar !== false) {
                item.appendChild(createCircle(options.avatarSize || 48, o));
            }

            const lines = document.createElement('div');
            lines.className = 'chillskeleton-lines chillskeleton-flex-1';
            lines.appendChild(createText({ ...o, width: '70%' }));
            lines.appendChild(createText({ ...o, width: '50%' }));
            item.appendChild(lines);
            list.appendChild(item);
        }

        return list;
    }

    const PRESETS = {
        avatar(opts) {
            const root = group('chillskeleton-avatar-group', opts);
            const o = passthrough(opts);
            root.appendChild(createCircle(opts.size || 40, o));
            const n = opts.lines == null ? 2 : opts.lines;
            if (n > 0) {
                const lines = textLines(n, opts, '60%');
                lines.classList.add('chillskeleton-flex-1');
                root.appendChild(lines);
            }
            return root;
        },
        text(opts) {
            const root = textLines(opts.lines == null ? 3 : opts.lines, opts, opts.lastWidth || '70%');
            return markGroup(root, opts);
        },
        title(opts) {
            const root = group('chillskeleton-lines', opts);
            root.appendChild(createTitle({ ...passthrough(opts), ...(opts.width != null ? { width: opts.width } : {}) }));
            return root;
        },
        card: (opts) => createCard(opts),
        list: (opts) => createList(opts.count == null ? 5 : opts.count, opts),
        table: (opts) => createTable(opts.rows == null ? 5 : opts.rows, opts.cols == null ? 4 : opts.cols, opts),
        'table-row'(opts) {
            return markGroup(tableRow(opts.cols == null ? 4 : opts.cols, opts), opts);
        }
    };

    function createPreset(name, options = {}) {
        injectCSS();
        const key = String(name || '').toLowerCase().replace(/_/g, '-');
        const fn = PRESETS[key] || PRESETS[key.replace(/-/g, '')];
        if (!fn) throw new Error(`ChillSkeleton: unknown preset "${name}". Use: ${Object.keys(PRESETS).join(', ')}`);
        return fn(options || {});
    }

    function setBusy(el, busy) {
        if (!el) return el;
        el.setAttribute('aria-busy', busy === false ? 'false' : 'true');
        return el;
    }

    /** Replace a skeleton with real content (element or node), marking the live region as done. */
    function reveal(skeleton, content) {
        if (!skeleton) return null;
        setBusy(skeleton, false);
        const parent = skeleton.parentNode;
        if (parent && content) {
            parent.replaceChild(content, skeleton);
            if (parent.getAttribute && parent.getAttribute('aria-busy') === 'true') parent.setAttribute('aria-busy', 'false');
        } else if (parent) {
            parent.removeChild(skeleton);
        }
        return content || null;
    }

    function remove(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    const ChillSkeleton = {
        version: VERSION,

        create: createSkeleton,
        preset: createPreset,
        text: createText,
        title: createTitle,
        circle: createCircle,
        rectangle: createRectangle,
        card: createCard,
        table: createTable,
        list: createList,
        setBusy,
        reveal,
        remove,
        destroy: remove,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSkeleton;
    } else {
        window.ChillSkeleton = ChillSkeleton;
    }

})(typeof window !== 'undefined' ? window : this);
