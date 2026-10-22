/**
 * ChillModal - Zero-dependency Modal Library
 *
 * Accessible modal dialogs: role=dialog + aria-modal/labelledby, focus trap, focus returns to the
 * previously focused element, stacked modals (only the top one reacts to Esc), reference-counted
 * body scroll lock, sizes, fullscreen, dark mode (prefers-color-scheme, data-theme="dark", .dark).
 *
 * @example
 *   const m = ChillModal.open({
 *     title: 'Edit profile', size: 'lg',
 *     content: '<form>...</form>',            // string = HTML (documented, back-compat), or pass a Node
 *     buttons: [
 *       { text: 'Cancel', onClick: (m) => m.close() },
 *       { text: 'Save', type: 'primary', onClick: (m) => { save(); m.close(); } }
 *     ]
 *   });
 *   if (await ChillModal.confirm({ title: 'Delete?', message: 'No undo.', type: 'danger' })) { ... }
 *
 * Options for open(config):
 *   title            string  (rendered with textContent)
 *   content          string | Node   string is rendered as HTML unless `html: false`
 *   text             string  plain text body (textContent, XSS-safe); used when `content` is empty
 *   html             boolean default true  - set false to render a string `content` as plain text
 *   size             'sm' | 'md' (default) | 'lg' | 'xl' | 'full'
 *   fullscreen       boolean default false - covers the whole viewport
 *   scrollable       boolean default true  - body scrolls inside the modal; false = the page overlay scrolls
 *   closable         boolean default true  - close button + Esc + overlay click
 *   closeOnEscape    boolean default = closable
 *   closeOnOverlay   boolean default = closable
 *   ariaLabel        string  accessible name when there is no title
 *   initialFocus     string selector | Element   default: [autofocus], first field/button in the body, first focusable
 *   buttons          [{ text, type: 'primary'|'danger'|..., onClick(modal), disabled }]  (text is textContent)
 *   onOpen(modal) / onClose(modal)
 *   onBeforeClose(modal, reason) -> return false to veto closing   (reason: 'api'|'escape'|'overlay'|'close-button')
 *
 * Instance: open(), close(reason) -> Promise, destroy(), setContent(html|Node), setText(text), isOpen,
 *           on(event 'open'|'close', fn) -> off(), element (overlay), modal (dialog element)
 * Static:   open(config), alert({title,message,buttonText}), confirm({title,message,confirmText,cancelText,type}),
 *           closeAll(), injectCSS(), version
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillmodal_css_injected__';
    const LOCK_KEY = '__chillmodal_scroll_lock__';
    const STYLE_ID = 'chillmodal-styles';
    const Z_BASE = 10000;      // modal layer; toast/notify sit at 10002
    const Z_STEP = 2;
    const SIZES = ['sm', 'md', 'lg', 'xl', 'full'];
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    let modalStack = [];
    let uid = 0;

    const DARK_VARS = `
          --chillmodal-bg: #171717;
          --chillmodal-border: #404040;
          --chillmodal-text: #fafafa;
          --chillmodal-text-light: #a3a3a3;
          --chillmodal-overlay: rgba(0, 0, 0, 0.7);
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
        --chillmodal-bg: #ffffff;
        --chillmodal-border: #e5e5e5;
        --chillmodal-text: #171717;
        --chillmodal-text-light: #737373;
        --chillmodal-overlay: rgba(0, 0, 0, 0.5);
        --chillmodal-focus: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          ${DARK_VARS}
        }
      }

      :root[data-theme="dark"], :root.dark {
        ${DARK_VARS}
      }

      .chillmodal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: ${Z_BASE};
        background: var(--chillmodal-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: chillmodal-fadeIn 0.2s ease-out;
      }

      .chillmodal-overlay.chillmodal-overlay-scroll {
        overflow-y: auto;
        align-items: flex-start;
      }

      .chillmodal-overlay.chillmodal-overlay-scroll .chillmodal {
        margin: auto;
        max-height: none;
      }

      .chillmodal-overlay.closing {
        animation: chillmodal-fadeOut 0.15s ease-out;
      }

      @keyframes chillmodal-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes chillmodal-fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .chillmodal {
        position: relative;
        background: var(--chillmodal-bg);
        color: var(--chillmodal-text);
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: chillmodal-slideIn 0.2s ease-out;
      }

      .chillmodal:focus {
        outline: none;
      }

      .chillmodal-overlay.closing .chillmodal {
        animation: chillmodal-slideOut 0.15s ease-out;
      }

      @keyframes chillmodal-slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes chillmodal-slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
      }

      .chillmodal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--chillmodal-border);
      }

      .chillmodal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--chillmodal-text);
        margin: 0;
      }

      .chillmodal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--chillmodal-text-light);
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-left: auto;
      }

      .chillmodal-close:hover {
        background: var(--chillmodal-border);
        color: var(--chillmodal-text);
      }

      .chillmodal-close-floating {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
      }

      .chillmodal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        color: var(--chillmodal-text);
        font-size: 14px;
        line-height: 1.6;
      }

      .chillmodal-overlay.chillmodal-overlay-scroll .chillmodal-body {
        overflow: visible;
      }

      .chillmodal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px 20px;
        border-top: 1px solid var(--chillmodal-border);
      }

      .chillmodal-btn {
        min-height: 36px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        border: 1px solid var(--chillmodal-border);
        border-radius: 6px;
        background: var(--chillmodal-bg);
        color: var(--chillmodal-text);
        cursor: pointer;
        transition: all 0.15s;
      }

      .chillmodal-btn:hover:not(:disabled) {
        background: var(--chillmodal-border);
      }

      .chillmodal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chillmodal-btn.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .chillmodal-btn.primary:hover:not(:disabled) {
        background: #2563eb;
      }

      .chillmodal-btn.danger {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
      }

      .chillmodal-btn.danger:hover:not(:disabled) {
        background: #dc2626;
      }

      .chillmodal-btn:focus-visible,
      .chillmodal-close:focus-visible {
        outline: 2px solid var(--chillmodal-focus);
        outline-offset: 2px;
      }

      .chillmodal.size-sm { max-width: 360px; }
      .chillmodal.size-md { max-width: 500px; }
      .chillmodal.size-lg { max-width: 720px; }
      .chillmodal.size-xl { max-width: 960px; }
      .chillmodal.size-full { max-width: 100%; }

      .chillmodal.chillmodal-fullscreen {
        max-width: none;
        width: 100%;
        height: 100%;
        max-height: none;
        border-radius: 0;
      }

      .chillmodal-overlay.chillmodal-overlay-fullscreen {
        padding: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillmodal-overlay,
        .chillmodal,
        .chillmodal-overlay.closing,
        .chillmodal-overlay.closing .chillmodal {
          animation: none !important;
        }
        .chillmodal-btn {
          transition: none !important;
        }
      }

      @media (max-width: 640px) {
        .chillmodal-overlay {
          padding: 0;
          align-items: flex-end;
        }

        .chillmodal {
          max-width: 100%;
          border-radius: 16px 16px 0 0;
          max-height: 85vh;
        }

        .chillmodal.chillmodal-fullscreen {
          border-radius: 0;
          max-height: none;
        }

        .chillmodal-footer {
          flex-direction: column;
        }

        .chillmodal-btn {
          width: 100%;
        }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- Body scroll lock (reference counted, shared across copies of the library) ----

    function lockScroll() {
        const lock = window[LOCK_KEY] || (window[LOCK_KEY] = { count: 0, overflow: '', paddingRight: '' });
        if (lock.count === 0) {
            const body = document.body;
            lock.overflow = body.style.overflow;
            lock.paddingRight = body.style.paddingRight;
            const scrollbar = (window.innerWidth || 0) - (document.documentElement.clientWidth || 0);
            if (scrollbar > 0) {
                const current = parseFloat((window.getComputedStyle && window.getComputedStyle(body).paddingRight) || '0') || 0;
                body.style.paddingRight = (current + scrollbar) + 'px';
            }
            body.style.overflow = 'hidden';
        }
        lock.count++;
    }

    function unlockScroll() {
        const lock = window[LOCK_KEY];
        if (!lock || lock.count === 0) return;
        lock.count--;
        if (lock.count === 0) {
            document.body.style.overflow = lock.overflow;
            document.body.style.paddingRight = lock.paddingRight;
        }
    }

    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.disabled && !el.hidden);
    }

    function cleanClass(value) {
        return String(value || '').split(/\s+/).filter(t => /^[A-Za-z0-9_-]+$/.test(t)).join(' ');
    }

    class ChillModalInstance {
        constructor(config = {}) {
            const closable = config.closable !== false;
            this.config = {
                title: config.title || '',
                content: config.content || '',
                size: config.size || 'md',
                closable,
                buttons: config.buttons || [],
                onOpen: config.onOpen || null,
                onClose: config.onClose || null,
                ...config
            };
            if (this.config.closeOnEscape === undefined) this.config.closeOnEscape = closable;
            if (this.config.closeOnOverlay === undefined) this.config.closeOnOverlay = closable;

            this.id = ++uid;
            this.overlay = null;
            this.modal = null;
            this.element = null;
            this.previousFocus = null;
            this.isOpen = false;
            this._closing = false;
            this._closeTimer = null;
            this._locked = false;
            this._handlers = {};
            this._cleanups = [];
        }

        on(event, fn) {
            (this._handlers[event] = this._handlers[event] || []).push(fn);
            return () => { this._handlers[event] = (this._handlers[event] || []).filter(f => f !== fn); };
        }

        _emit(event) {
            (this._handlers[event] || []).slice().forEach(fn => { try { fn(this); } catch (e) { /* listener errors must not break the modal */ } });
        }

        open() {
            if (this.isOpen || !hasDOM()) return this;
            injectCSS();
            this.previousFocus = document.activeElement;

            this.createModal();
            this.overlay.style.zIndex = String(Z_BASE + modalStack.length * Z_STEP);
            document.body.appendChild(this.overlay);

            lockScroll();
            this._locked = true;
            modalStack.push(this);
            this.isOpen = true;

            this.bindEvents();
            this._applyInitialFocus();

            if (this.config.onOpen) {
                this.config.onOpen(this);
            }
            this._emit('open');

            return this;
        }

        createModal() {
            const cfg = this.config;
            const overlay = document.createElement('div');
            overlay.className = 'chillmodal-overlay';
            if (cfg.scrollable === false) overlay.classList.add('chillmodal-overlay-scroll');
            if (cfg.fullscreen) overlay.classList.add('chillmodal-overlay-fullscreen');

            const size = SIZES.indexOf(cfg.size) !== -1 ? cfg.size : 'md';
            const modal = document.createElement('div');
            modal.className = 'chillmodal size-' + size;
            if (cfg.fullscreen) modal.classList.add('chillmodal-fullscreen');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('tabindex', '-1');

            if (cfg.title) {
                const header = document.createElement('div');
                header.className = 'chillmodal-header';
                const title = document.createElement('h2');
                title.className = 'chillmodal-title';
                title.id = 'chillmodal-title-' + this.id;
                title.textContent = String(cfg.title);
                header.appendChild(title);
                modal.setAttribute('aria-labelledby', title.id);
                if (cfg.closable) header.appendChild(this._closeButton());
                modal.appendChild(header);
            } else {
                if (cfg.ariaLabel) modal.setAttribute('aria-label', String(cfg.ariaLabel));
                if (cfg.closable) {
                    const x = this._closeButton();
                    x.classList.add('chillmodal-close-floating');
                    modal.appendChild(x);
                }
            }

            const body = document.createElement('div');
            body.className = 'chillmodal-body';
            body.id = 'chillmodal-body-' + this.id;
            this._fillBody(body, cfg.content || (cfg.text != null ? cfg.text : ''), !cfg.content && cfg.text != null);
            modal.appendChild(body);
            modal.setAttribute('aria-describedby', body.id);

            if (cfg.buttons.length) {
                const footer = document.createElement('div');
                footer.className = 'chillmodal-footer';
                cfg.buttons.forEach((btn, i) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = ('chillmodal-btn ' + cleanClass(btn.type)).trim();
                    b.textContent = btn.text == null ? '' : String(btn.text);
                    b.dataset.index = String(i);
                    if (btn.disabled) b.disabled = true;
                    footer.appendChild(b);
                });
                modal.appendChild(footer);
            }

            overlay.appendChild(modal);
            this.overlay = overlay;
            this.element = overlay;
            this.modal = modal;
        }

        _closeButton() {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chillmodal-close';
            b.setAttribute('aria-label', 'Close');
            b.textContent = '×';
            return b;
        }

        _fillBody(body, content, forceText) {
            body.textContent = '';
            if (content && typeof content === 'object' && content.nodeType) {
                body.appendChild(content);
            } else if (forceText || this.config.html === false) {
                body.textContent = content == null ? '' : String(content);
            } else {
                body.innerHTML = content == null ? '' : String(content);
            }
        }

        _listen(target, type, fn, capture) {
            target.addEventListener(type, fn, capture);
            this._cleanups.push(() => target.removeEventListener(type, fn, capture));
        }

        bindEvents() {
            // Close button
            const closeBtn = this.modal.querySelector('.chillmodal-close');
            if (closeBtn) {
                this._listen(closeBtn, 'click', () => this.close('close-button'));
            }

            // Overlay click (only when the press also started on the overlay)
            let downOnOverlay = false;
            this._listen(this.overlay, 'mousedown', (e) => { downOnOverlay = e.target === this.overlay; });
            this._listen(this.overlay, 'click', (e) => {
                if (e.target === this.overlay && downOnOverlay && this.config.closeOnOverlay) {
                    this.close('overlay');
                }
                downOnOverlay = false;
            });

            // Keyboard: Escape (top-most modal only) + focus trap
            this.handleEscape = (e) => {
                if (modalStack[modalStack.length - 1] !== this || this._closing) return;
                if (e.key === 'Escape') {
                    if (this.config.closeOnEscape) {
                        e.preventDefault();
                        this.close('escape');
                    }
                } else if (e.key === 'Tab') {
                    this._trapTab(e);
                }
            };
            this._listen(document, 'keydown', this.handleEscape);

            // Button clicks
            this.modal.querySelectorAll('[data-index]').forEach(btn => {
                this._listen(btn, 'click', () => {
                    const buttonConfig = this.config.buttons[parseInt(btn.dataset.index, 10)];
                    if (buttonConfig && buttonConfig.onClick) {
                        buttonConfig.onClick(this);
                    }
                });
            });
        }

        _trapTab(e) {
            const modal = this.modal;
            const focusable = getFocusableElements(modal);
            if (focusable.length === 0) {
                e.preventDefault();
                modal.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (!modal.contains(active)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            } else if (e.shiftKey && (active === first || active === modal)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        }

        _applyInitialFocus() {
            const modal = this.modal;
            const init = this.config.initialFocus;
            let target = null;
            if (init && typeof init === 'object' && init.nodeType) target = init;
            else if (typeof init === 'string') target = modal.querySelector(init);
            if (!target) target = modal.querySelector('[autofocus]');
            if (!target) {
                const body = modal.querySelector('.chillmodal-body');
                target = (body && getFocusableElements(body)[0]) ||
                    modal.querySelector('.chillmodal-footer .chillmodal-btn.primary:not(:disabled), .chillmodal-footer .chillmodal-btn.danger:not(:disabled)') ||
                    getFocusableElements(modal)[0] || modal;
            }
            target.focus();
        }

        /**
         * Closes the modal (animated). Returns a Promise resolved when it has been removed.
         * `onBeforeClose(modal, reason)` may return false to veto.
         */
        close(reason) {
            if (!this.isOpen || this._closing) return Promise.resolve();
            if (this.config.onBeforeClose && this.config.onBeforeClose(this, reason || 'api') === false) {
                return Promise.resolve();
            }
            this._closing = true;
            this.overlay.classList.add('closing');
            // Only the top-most modal reacts to keys; closing modal drops out of the stack immediately
            modalStack = modalStack.filter(m => m !== this);
            this._restoreFocus();

            return new Promise((resolve) => {
                this._closeTimer = setTimeout(() => {
                    this._finish();
                    resolve();
                }, 150);
            });
        }

        _restoreFocus() {
            const prev = this.previousFocus;
            if (prev && typeof prev.focus === 'function' && prev !== document.body && document.contains(prev)) {
                try { prev.focus(); } catch (e) { /* ignore */ }
            }
        }

        _finish() {
            clearTimeout(this._closeTimer);
            this._closeTimer = null;
            this._cleanups.splice(0).forEach(fn => fn());
            if (this.overlay) this.overlay.remove();
            modalStack = modalStack.filter(m => m !== this);
            if (this._locked) {
                this._locked = false;
                unlockScroll();
            }
            const wasOpen = this.isOpen;
            this.isOpen = false;
            this._closing = false;
            if (wasOpen) {
                if (this.config.onClose) this.config.onClose(this);
                this._emit('close');
            }
        }

        /** Closes immediately (no animation, no veto) and releases every listener / timer. */
        destroy() {
            if (!this.isOpen) return;
            if (!this._closing) {
                modalStack = modalStack.filter(m => m !== this);
                this._restoreFocus();
            }
            this._finish();
            this._handlers = {};
        }

        /** Replaces the body with HTML (string) or a Node. Use setText() for untrusted text. */
        setContent(html) {
            const body = this.modal && this.modal.querySelector('.chillmodal-body');
            if (body) {
                const keep = this.config.html;
                this.config.html = true;
                this._fillBody(body, html, false);
                this.config.html = keep;
            }
        }

        /** Replaces the body with plain text (XSS-safe). */
        setText(text) {
            const body = this.modal && this.modal.querySelector('.chillmodal-body');
            if (body) this._fillBody(body, text, true);
        }
    }

    const ChillModal = {
        version: VERSION,

        open(config) {
            return new ChillModalInstance(config).open();
        },

        /** Promise<void> info dialog. `message` is rendered as text. */
        alert(options = {}) {
            return new Promise((resolve) => {
                this.open({
                    title: options.title || '',
                    text: options.message != null ? options.message : options.text,
                    size: options.size || 'sm',
                    ariaLabel: options.title ? undefined : 'Alert',
                    buttons: [{ text: options.buttonText || 'OK', type: 'primary', onClick: (m) => m.close() }],
                    onClose: () => resolve()
                });
            });
        },

        /** Promise<boolean> confirmation dialog. `type: 'danger'` styles the confirm button red. */
        confirm(options = {}) {
            return new Promise((resolve) => {
                let result = false;
                const finish = (value) => (m) => { result = value; m.close(); };
                this.open({
                    title: options.title || '',
                    text: options.message != null ? options.message : options.text,
                    size: options.size || 'sm',
                    ariaLabel: options.title ? undefined : 'Confirm',
                    buttons: [
                        { text: options.cancelText || 'Cancel', onClick: finish(false) },
                        { text: options.confirmText || 'Confirm', type: options.type === 'danger' ? 'danger' : 'primary', onClick: finish(true) }
                    ],
                    onClose: () => resolve(result)
                });
            });
        },

        closeAll() {
            [...modalStack].reverse().forEach(modal => modal.close());
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillModal;
    } else {
        window.ChillModal = ChillModal;
    }

})(typeof window !== 'undefined' ? window : this);
