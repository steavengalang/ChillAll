/**
 * ChillNotify - Zero-dependency Notification Library
 *
 * Stackable toast notifications with six positions, a countdown progress bar that pauses on
 * hover/focus, a max-visible limit (extra notifications are queued), aria-live announcements,
 * and dark mode (prefers-color-scheme, data-theme="dark", .dark).
 *
 * @example
 *   ChillNotify.success({ title: 'Saved', message: 'Your changes are live.' });
 *   ChillNotify.error({ message: 'Upload failed', duration: 0, actions: [{ text: 'Retry', primary: true, onClick: retry }] });
 *   ChillNotify.configure({ maxVisible: 3 });   // the rest wait in a queue
 *
 * Options for show()/success()/error()/warning()/info():
 *   type          'info' (default) | 'success' | 'error' | 'warning'
 *   title         string (textContent)
 *   message       string (textContent unless `html: true`)
 *   html          boolean default false - render `message` as trusted HTML (you must sanitise it)
 *   duration      ms, default 5000, 0 = persistent
 *   position      'top-right' (default) | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'
 *   showProgress  boolean default true (only when duration > 0)
 *   closable      boolean default true
 *   pauseOnHover  boolean default true (hover AND keyboard focus pause the countdown)
 *   actions       [{ text, primary, close (default true), onClick() }]   (text is textContent)
 *   onClose(id, reason)  reason: 'timeout' | 'close' | 'action' | 'closeAll'
 *
 * Static: show, success, error, warning, info (return the numeric id), close(id), closeAll(),
 *         configure({ maxVisible = 5 }), destroy(), injectCSS(), version
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillnotify_css_injected__';
    const STYLE_ID = 'chillnotify-styles';
    const Z_INDEX = 10002; // above chillmodal (10000)
    const POSITIONS = ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'];
    const TYPES = ['info', 'success', 'error', 'warning'];
    const CLOSE_MS = 200;

    let notificationId = 0;
    let maxVisible = 5;
    const containers = {};
    const active = new Map();   // id -> record (visible, including those playing the closing animation)
    let queue = [];             // records waiting for a free slot

    const DARK_VARS = `
          --chillnotify-bg: #262626;
          --chillnotify-border: #404040;
          --chillnotify-text: #fafafa;
          --chillnotify-text-light: #a3a3a3;
    `;

    function hasDOM() {
        return typeof document !== 'undefined' && !!document.body;
    }

    function injectCSS() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById(STYLE_ID)) {
            window[CSS_INJECTED_FLAG] = true;
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillnotify-bg: #ffffff;
        --chillnotify-border: #e5e5e5;
        --chillnotify-text: #171717;
        --chillnotify-text-light: #737373;
        --chillnotify-success: #22c55e;
        --chillnotify-error: #ef4444;
        --chillnotify-warning: #f59e0b;
        --chillnotify-info: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          ${DARK_VARS}
        }
      }

      :root[data-theme="dark"], :root.dark {
        ${DARK_VARS}
      }

      .chillnotify-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: ${Z_INDEX};
        pointer-events: none;
        max-width: 380px;
        width: 100%;
      }

      .chillnotify-container.top-right {
        top: 16px;
        right: 16px;
      }

      .chillnotify-container.top-left {
        top: 16px;
        left: 16px;
      }

      .chillnotify-container.top-center {
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
      }

      .chillnotify-container.bottom-right {
        bottom: 16px;
        right: 16px;
      }

      .chillnotify-container.bottom-left {
        bottom: 16px;
        left: 16px;
      }

      .chillnotify-container.bottom-center {
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
      }

      .chillnotify {
        position: relative;
        overflow: hidden;
        background: var(--chillnotify-bg);
        border: 1px solid var(--chillnotify-border);
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: chillnotify-slideIn 0.3s ease-out;
      }

      .chillnotify.closing {
        animation: chillnotify-slideOut 0.2s ease-out forwards;
      }

      .chillnotify-container.top-left .chillnotify,
      .chillnotify-container.bottom-left .chillnotify {
        animation-name: chillnotify-slideInLeft;
      }

      .chillnotify-container.top-left .chillnotify.closing,
      .chillnotify-container.bottom-left .chillnotify.closing {
        animation-name: chillnotify-slideOutLeft;
      }

      .chillnotify-container.top-center .chillnotify,
      .chillnotify-container.bottom-center .chillnotify {
        animation-name: chillnotify-fadeIn;
      }

      .chillnotify-container.top-center .chillnotify.closing,
      .chillnotify-container.bottom-center .chillnotify.closing {
        animation-name: chillnotify-fadeOut;
      }

      @keyframes chillnotify-slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes chillnotify-slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      @keyframes chillnotify-slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes chillnotify-slideOutLeft {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
      }

      @keyframes chillnotify-fadeIn {
        from { transform: translateY(-8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes chillnotify-fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .chillnotify-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .chillnotify-icon svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .chillnotify-icon.success { color: var(--chillnotify-success); }
      .chillnotify-icon.error { color: var(--chillnotify-error); }
      .chillnotify-icon.warning { color: var(--chillnotify-warning); }
      .chillnotify-icon.info { color: var(--chillnotify-info); }

      .chillnotify-content {
        flex: 1;
        min-width: 0;
      }

      .chillnotify-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--chillnotify-text);
        margin: 0 0 2px 0;
      }

      .chillnotify-message {
        font-size: 13px;
        color: var(--chillnotify-text-light);
        margin: 0;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }

      .chillnotify-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .chillnotify-action {
        min-height: 28px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        font-family: inherit;
        border: 1px solid var(--chillnotify-border);
        border-radius: 4px;
        background: transparent;
        color: var(--chillnotify-text);
        cursor: pointer;
      }

      .chillnotify-action:hover {
        background: var(--chillnotify-border);
      }

      .chillnotify-action.primary {
        background: var(--chillnotify-info);
        color: white;
        border-color: var(--chillnotify-info);
      }

      .chillnotify-close {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--chillnotify-text-light);
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        line-height: 1;
        flex-shrink: 0;
      }

      .chillnotify-close:hover {
        color: var(--chillnotify-text);
      }

      .chillnotify-close:focus-visible,
      .chillnotify-action:focus-visible {
        outline: 2px solid var(--chillnotify-info);
        outline-offset: 1px;
      }

      .chillnotify-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--chillnotify-border);
        overflow: hidden;
      }

      .chillnotify-progress-bar {
        height: 100%;
        transition: width linear;
      }

      .chillnotify-progress-bar.success { background: var(--chillnotify-success); }
      .chillnotify-progress-bar.error { background: var(--chillnotify-error); }
      .chillnotify-progress-bar.warning { background: var(--chillnotify-warning); }
      .chillnotify-progress-bar.info { background: var(--chillnotify-info); }

      @media (prefers-reduced-motion: reduce) {
        .chillnotify,
        .chillnotify.closing,
        .chillnotify-container .chillnotify,
        .chillnotify-container .chillnotify.closing {
          animation: none !important;
        }
        .chillnotify-progress-bar {
          transition: none !important;
        }
      }

      @media (max-width: 640px) {
        .chillnotify-container {
          left: 8px !important;
          right: 8px !important;
          max-width: none;
          width: auto;
          transform: none !important;
        }

        .chillnotify {
          width: 100%;
        }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5 5.5-5.5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M12 2L2 20h20L12 2z"/><path d="M12 9v4M12 17h.01"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    function getContainer(position) {
        const existing = containers[position];
        if (existing && existing.isConnected) return existing;

        const container = document.createElement('div');
        container.className = `chillnotify-container ${position}`;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Notifications');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(container);
        containers[position] = container;
        return container;
    }

    function dropContainerIfEmpty(position) {
        const c = containers[position];
        if (c && c.children.length === 0) {
            c.remove();
            delete containers[position];
        }
    }

    // ---- countdown (timer + progress bar), pausable ----

    function startTimer(rec) {
        if (rec.duration <= 0 || rec.closing) return;
        rec.startedAt = Date.now();
        clearTimeout(rec.timer);
        rec.timer = setTimeout(() => close(rec.id, 'timeout'), Math.max(rec.remaining, 0));
        if (rec.bar) {
            rec.bar.style.transition = 'none';
            rec.bar.style.width = (rec.remaining / rec.duration * 100) + '%';
            void rec.bar.offsetWidth; // flush so the next transition runs from the current width
            rec.bar.style.transition = `width ${Math.max(rec.remaining, 0)}ms linear`;
            rec.bar.style.width = '0%';
        }
    }

    function pauseTimer(rec) {
        if (rec.timer === null || rec.closing) return;
        clearTimeout(rec.timer);
        rec.timer = null;
        rec.remaining -= Date.now() - rec.startedAt;
        if (rec.bar) {
            rec.bar.style.transition = 'none';
            rec.bar.style.width = (Math.max(rec.remaining, 0) / rec.duration * 100) + '%';
        }
    }

    function syncPause(rec) {
        if (rec.pauseOnHover && (rec.hover || rec.focus)) pauseTimer(rec);
        else if (rec.timer === null) startTimer(rec);
    }

    // ---- render / lifecycle ----

    function render(rec) {
        const options = rec.options;
        const container = getContainer(options.position);
        const el = document.createElement('div');
        el.className = 'chillnotify';
        el.dataset.id = String(rec.id);
        el.setAttribute('role', options.type === 'error' ? 'alert' : 'status');

        const icon = document.createElement('div');
        icon.className = `chillnotify-icon ${options.type}`;
        icon.innerHTML = ICONS[options.type]; // static, library-owned markup
        el.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'chillnotify-content';
        if (options.title) {
            const t = document.createElement('p');
            t.className = 'chillnotify-title';
            t.textContent = String(options.title);
            content.appendChild(t);
        }
        if (options.message) {
            const m = document.createElement('p');
            m.className = 'chillnotify-message';
            if (options.html === true) m.innerHTML = String(options.message); // explicit opt-in
            else m.textContent = String(options.message);
            content.appendChild(m);
        }
        if (options.actions.length) {
            const actions = document.createElement('div');
            actions.className = 'chillnotify-actions';
            options.actions.forEach((action) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillnotify-action' + (action.primary ? ' primary' : '');
                b.textContent = action.text == null ? '' : String(action.text);
                b.addEventListener('click', () => {
                    if (action.onClick) action.onClick();
                    if (action.close !== false) close(rec.id, 'action');
                });
                actions.appendChild(b);
            });
            content.appendChild(actions);
        }
        el.appendChild(content);

        if (options.closable) {
            const x = document.createElement('button');
            x.type = 'button';
            x.className = 'chillnotify-close';
            x.setAttribute('aria-label', 'Dismiss notification');
            x.textContent = '×';
            x.addEventListener('click', () => close(rec.id, 'close'));
            el.appendChild(x);
        }

        if (options.showProgress && options.duration > 0) {
            const wrap = document.createElement('div');
            wrap.className = 'chillnotify-progress';
            wrap.setAttribute('aria-hidden', 'true');
            const bar = document.createElement('div');
            bar.className = `chillnotify-progress-bar ${options.type}`;
            bar.style.width = '100%';
            wrap.appendChild(bar);
            el.appendChild(wrap);
            rec.bar = bar;
        }

        // Pause on hover / keyboard focus
        if (rec.pauseOnHover) {
            el.addEventListener('mouseenter', rec.onEnter = () => { rec.hover = true; syncPause(rec); });
            el.addEventListener('mouseleave', rec.onLeave = () => { rec.hover = false; syncPause(rec); });
            el.addEventListener('focusin', rec.onFocusIn = () => { rec.focus = true; syncPause(rec); });
            el.addEventListener('focusout', rec.onFocusOut = () => { rec.focus = false; syncPause(rec); });
        }

        container.appendChild(el);
        rec.el = el;
        active.set(rec.id, rec);
        startTimer(rec);
    }

    function visibleCount() {
        let n = 0;
        active.forEach(rec => { if (!rec.closing) n++; });
        return n;
    }

    function pump() {
        while (queue.length && visibleCount() < maxVisible && hasDOM()) {
            render(queue.shift());
        }
    }

    function finish(rec, immediate) {
        clearTimeout(rec.removeTimer);
        rec.removeTimer = null;
        if (rec.el) {
            if (rec.onEnter) {
                rec.el.removeEventListener('mouseenter', rec.onEnter);
                rec.el.removeEventListener('mouseleave', rec.onLeave);
                rec.el.removeEventListener('focusin', rec.onFocusIn);
                rec.el.removeEventListener('focusout', rec.onFocusOut);
            }
            rec.el.remove();
        }
        active.delete(rec.id);
        dropContainerIfEmpty(rec.options.position);
        void immediate;
    }

    function show(config = {}) {
        const id = ++notificationId;
        if (!hasDOM()) return id; // server: no-op, still returns an id

        injectCSS();

        const options = {
            type: 'info',
            title: '',
            message: '',
            duration: 5000,
            position: 'top-right',
            showProgress: true,
            closable: true,
            pauseOnHover: true,
            actions: [],
            ...config
        };
        if (TYPES.indexOf(options.type) === -1) options.type = 'info';
        if (POSITIONS.indexOf(options.position) === -1) options.position = 'top-right';
        options.duration = Number(options.duration);
        if (!isFinite(options.duration) || options.duration < 0) options.duration = 5000;
        if (!Array.isArray(options.actions)) options.actions = [];

        const rec = {
            id, options,
            duration: options.duration,
            remaining: options.duration,
            pauseOnHover: options.pauseOnHover !== false,
            timer: null, removeTimer: null, startedAt: 0,
            hover: false, focus: false, closing: false,
            el: null, bar: null
        };

        queue.push(rec);
        pump();
        return id;
    }

    function close(id, reason, immediate) {
        // Still waiting in the queue: just drop it
        const queued = queue.find(r => r.id === id);
        if (queued) {
            queue = queue.filter(r => r !== queued);
            if (queued.options.onClose) queued.options.onClose(id, reason || 'close');
            return;
        }

        const rec = active.get(id);
        if (!rec || rec.closing) return;
        rec.closing = true;
        clearTimeout(rec.timer);
        rec.timer = null;

        if (immediate) finish(rec, true);
        else {
            rec.el.classList.add('closing');
            rec.removeTimer = setTimeout(() => { finish(rec); pump(); }, CLOSE_MS);
        }
        if (rec.options.onClose) rec.options.onClose(id, reason || 'close');
        pump(); // a slot is free as soon as this one starts closing
    }

    function closeAll() {
        const waiting = queue;
        queue = [];
        waiting.forEach(r => { if (r.options.onClose) r.options.onClose(r.id, 'closeAll'); });
        Array.from(active.keys()).forEach(id => close(id, 'closeAll'));
    }

    function configure(opts = {}) {
        if (opts.maxVisible !== undefined) {
            const n = Math.floor(Number(opts.maxVisible));
            maxVisible = isFinite(n) && n > 0 ? n : Infinity;
            pump();
        }
        return { maxVisible };
    }

    /** Removes every notification, timer, listener and container immediately and empties the queue. */
    function destroy() {
        queue = [];
        Array.from(active.values()).forEach(rec => {
            clearTimeout(rec.timer);
            rec.closing = true;
            finish(rec, true);
        });
        Object.keys(containers).forEach(pos => {
            containers[pos].remove();
            delete containers[pos];
        });
    }

    const ChillNotify = {
        version: VERSION,
        show,
        close(id) { close(id, 'close'); },
        closeAll,
        configure,
        destroy,
        injectCSS,

        success(config) {
            return show({ ...config, type: 'success' });
        },

        error(config) {
            return show({ ...config, type: 'error' });
        },

        warning(config) {
            return show({ ...config, type: 'warning' });
        },

        info(config) {
            return show({ ...config, type: 'info' });
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillNotify;
    } else {
        window.ChillNotify = ChillNotify;
    }

})(typeof window !== 'undefined' ? window : this);
