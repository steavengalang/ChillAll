/**
 * ChillPopover - Zero-dependency Popover Component
 *
 * Usage:
 *   const pop = ChillPopover.init('#btn', { title: 'Info', content: 'Plain text body', position: 'bottom' });
 *   ChillPopover.confirm('#del', { content: 'Delete item?', onConfirm() {} });
 *   pop.show(); pop.hide(); pop.destroy();
 *
 * Options (all optional):
 *   title      string|Node  ''      Header text (textContent).
 *   content    string|Node  ''      Body. Strings are rendered as TEXT. Pass a Node, use `html: true`, or `contentHtml`.
 *   footer     string|Node  null    Footer. Same rules as content (string = text, `html:true` / `footerHtml` = markup).
 *   html       boolean      false   Opt in: title/content/footer strings are inserted as HTML (YOU must sanitise).
 *   titleHtml / contentHtml / footerHtml  string  Explicit per-part HTML (trusted markup only).
 *   position   string       'top'   'top' | 'bottom' | 'left' | 'right'
 *   flip       boolean      true    Flip to the opposite side when it does not fit in the viewport.
 *   offset     number       12
 *   showArrow  boolean      true
 *   showClose  boolean      false   Adds a close button.
 *   triggerOn  string       'click' 'click' | 'hover' | 'focus' | 'manual'
 *   hideDelay  number       0 (150 for hover)  Delay before hiding in hover mode.
 *   closeOnOutsideClick boolean true
 *   closeOnEscape       boolean true
 *   focusOnOpen         boolean true  Move focus to the first focusable element in the popover when opened by click/keyboard.
 *   returnFocus         boolean true  Return focus to the trigger when closed with Esc / close button / Tab-out.
 *   ariaLabel  string       ''      Accessible name when there is no title.
 *   id         string       auto    id of the popover element (aria-controls on the trigger).
 *   onOpen / onClose  function      Callbacks.
 *
 * Instance: show(), hide(), toggle(), setContent(content, html?), setTitle(title), setPosition(pos), on(evt, fn), off(evt, fn), destroy()
 * Properties: isOpen, popoverEl, triggerEl.  Events: 'open', 'close'.
 * ChillPopover.confirm(trigger, { content, confirmText, cancelText, variant, onConfirm, onCancel, ...options })
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillpopover_css_injected__';
    const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chillpopover-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillpopover-styles';
        style.textContent = `
      :root {
        --chillpopover-bg: #ffffff;
        --chillpopover-text: #171717;
        --chillpopover-text-muted: #6b7280;
        --chillpopover-border: #e5e5e5;
        --chillpopover-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
        --chillpopover-focus: rgba(59, 130, 246, 0.55);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillpopover-bg: #262626;
          --chillpopover-text: #fafafa;
          --chillpopover-text-muted: #a3a3a3;
          --chillpopover-border: #404040;
          --chillpopover-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillpopover-bg: #262626;
        --chillpopover-text: #fafafa;
        --chillpopover-text-muted: #a3a3a3;
        --chillpopover-border: #404040;
        --chillpopover-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      }

      .chillpopover {
        position: absolute;
        top: 0;
        left: 0;
        min-width: 200px;
        max-width: 320px;
        box-sizing: border-box;
        background: var(--chillpopover-bg);
        border: 1px solid var(--chillpopover-border);
        border-radius: 12px;
        box-shadow: var(--chillpopover-shadow);
        z-index: 10003;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.95);
        transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
      }

      .chillpopover:focus { outline: none; }

      .chillpopover.visible {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
      }

      .chillpopover-arrow {
        position: absolute;
        width: 12px;
        height: 12px;
        background: var(--chillpopover-bg);
        border: 1px solid var(--chillpopover-border);
        transform: rotate(45deg);
      }

      .chillpopover-top .chillpopover-arrow { bottom: -7px; left: 50%; margin-left: -6px; border-top: none; border-left: none; }
      .chillpopover-bottom .chillpopover-arrow { top: -7px; left: 50%; margin-left: -6px; border-bottom: none; border-right: none; }
      .chillpopover-left .chillpopover-arrow { right: -7px; top: 50%; margin-top: -6px; border-bottom: none; border-left: none; }
      .chillpopover-right .chillpopover-arrow { left: -7px; top: 50%; margin-top: -6px; border-top: none; border-right: none; }

      .chillpopover-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--chillpopover-border);
      }

      .chillpopover-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--chillpopover-text);
        margin: 0;
        padding-right: 28px;
      }

      .chillpopover-close {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: var(--chillpopover-text-muted);
        transition: background 0.15s ease, color 0.15s ease;
        z-index: 1;
      }

      .chillpopover-close:hover {
        background: var(--chillpopover-border);
        color: var(--chillpopover-text);
      }

      .chillpopover-close svg { width: 16px; height: 16px; }

      .chillpopover-body {
        padding: 16px;
        font-size: 14px;
        color: var(--chillpopover-text);
        line-height: 1.5;
      }

      .chillpopover-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--chillpopover-border);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .chillpopover-btn {
        min-height: 32px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease, filter 0.15s ease;
      }

      .chillpopover-btn-secondary { background: var(--chillpopover-border); color: var(--chillpopover-text); }
      .chillpopover-btn-secondary:hover { filter: brightness(0.95); }
      .chillpopover-btn-primary { background: #3b82f6; color: white; }
      .chillpopover-btn-primary:hover { background: #2563eb; }
      .chillpopover-btn-danger { background: #ef4444; color: white; }
      .chillpopover-btn-danger:hover { background: #dc2626; }

      .chillpopover-close:focus-visible,
      .chillpopover-btn:focus-visible {
        outline: 2px solid var(--chillpopover-focus);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillpopover, .chillpopover-close, .chillpopover-btn { transition: none !important; }
        .chillpopover { transform: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function fill(target, value, html) {
        target.textContent = '';
        if (value == null || value === '') return;
        if (typeof value === 'object' && value.nodeType) target.appendChild(value);
        else if (html) target.innerHTML = String(value);
        else target.textContent = String(value);
    }

    class ChillPopoverInstance {
        constructor(trigger, options = {}) {
            if (typeof document === 'undefined') throw new Error('ChillPopover requires a DOM');
            this.triggerEl = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
            if (!this.triggerEl) throw new Error('ChillPopover: trigger element not found');

            this.options = {
                title: '',
                content: '',
                position: 'top',
                offset: 12,
                showClose: false,
                triggerOn: 'click',
                footer: null,
                onOpen: null,
                onClose: null,
                html: false,
                flip: true,
                closeOnEscape: true,
                focusOnOpen: true,
                returnFocus: true,
                ariaLabel: '',
                ...options
            };
            this.options.showArrow = options.showArrow !== false;
            this.options.closeOnOutsideClick = options.closeOnOutsideClick !== false;
            if (!OPPOSITE[this.options.position]) this.options.position = 'top';
            if (this.options.hideDelay == null) this.options.hideDelay = this.options.triggerOn === 'hover' ? 150 : 0;

            this.popoverEl = null;
            this.isOpen = false;
            this.placement = this.options.position;
            this.destroyed = false;
            this._listeners = [];
            this._handlers = {};
            this._hideTimer = null;
            this._prevControls = this.triggerEl.getAttribute('aria-controls');
            this._prevExpanded = this.triggerEl.getAttribute('aria-expanded');
            this._prevHaspopup = this.triggerEl.getAttribute('aria-haspopup');

            this._onDocClick = (e) => {
                if (!this.triggerEl.contains(e.target) && !this.popoverEl.contains(e.target)) this.hide();
            };
            this._onKeydown = (e) => {
                if (this.options.closeOnEscape && (e.key === 'Escape' || e.key === 'Esc')) {
                    e.stopPropagation();
                    this.hide(0, true);
                }
            };
            this._onViewportChange = () => { if (this.isOpen) this.positionPopover(); };

            this.init();
        }

        init() {
            injectCSS();
            this.createPopover();
            this.bindEvents();
        }

        _listen(target, evt, fn, opts) {
            target.addEventListener(evt, fn, opts);
            this._listeners.push([target, evt, fn, opts]);
        }

        _unlisten(target, evt, fn, opts) {
            target.removeEventListener(evt, fn, opts);
            this._listeners = this._listeners.filter(l => !(l[0] === target && l[1] === evt && l[2] === fn));
        }

        createPopover() {
            const o = this.options;
            const el = document.createElement('div');
            el.className = `chillpopover chillpopover-${o.position}`;
            el.id = o.id || `chillpopover-${++uid}`;
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-modal', 'false');
            el.setAttribute('tabindex', '-1');

            if (o.showArrow) {
                const arrow = document.createElement('span');
                arrow.className = 'chillpopover-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                el.appendChild(arrow);
            }

            if (o.showClose) {
                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'chillpopover-close';
                close.setAttribute('aria-label', o.closeLabel || 'Close');
                close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M18 6L6 18M6 6l12 12"/></svg>';
                el.appendChild(close);
            }

            const hasTitle = o.title || o.titleHtml;
            if (hasTitle) {
                const header = document.createElement('div');
                header.className = 'chillpopover-header';
                const h = document.createElement('h4');
                h.className = 'chillpopover-title';
                h.id = el.id + '-title';
                if (o.titleHtml != null) h.innerHTML = String(o.titleHtml);
                else fill(h, o.title, o.html === true);
                header.appendChild(h);
                el.appendChild(header);
                el.setAttribute('aria-labelledby', h.id);
            } else if (o.ariaLabel) {
                el.setAttribute('aria-label', o.ariaLabel);
            }

            const body = document.createElement('div');
            body.className = 'chillpopover-body';
            if (o.contentHtml != null) body.innerHTML = String(o.contentHtml);
            else fill(body, o.content, o.html === true);
            el.appendChild(body);

            if (o.footer || o.footerHtml) {
                const footer = document.createElement('div');
                footer.className = 'chillpopover-footer';
                if (o.footerHtml != null) footer.innerHTML = String(o.footerHtml);
                else fill(footer, o.footer, o.html === true);
                el.appendChild(footer);
            }

            this.popoverEl = el;
            document.body.appendChild(el);

            const t = this.triggerEl;
            t.setAttribute('aria-expanded', 'false');
            t.setAttribute('aria-controls', (this._prevControls ? this._prevControls + ' ' : '') + el.id);
            if (!this._prevHaspopup) t.setAttribute('aria-haspopup', 'dialog');
        }

        bindEvents() {
            const mode = this.options.triggerOn;
            const t = this.triggerEl;
            const p = this.popoverEl;
            if (mode === 'click') {
                this._listen(t, 'click', () => this.toggle());
            } else if (mode === 'hover') {
                this._listen(t, 'mouseenter', () => this.show(false));
                this._listen(t, 'mouseleave', () => this.hide());
                this._listen(p, 'mouseenter', () => this.show(false));
                this._listen(p, 'mouseleave', () => this.hide());
                this._listen(t, 'focus', () => this.show(false));
                this._listen(t, 'blur', (e) => { if (!p.contains(e.relatedTarget)) this.hide(); });
            } else if (mode === 'focus') {
                this._listen(t, 'focus', () => this.show(false));
                this._listen(t, 'blur', (e) => { if (!p.contains(e.relatedTarget)) this.hide(); });
            }

            const close = p.querySelector('.chillpopover-close');
            if (close) this._listen(close, 'click', () => this.hide(0, true));

            // Tab out of the popover: close and hand focus back to the trigger so tab order is not lost.
            this._listen(p, 'keydown', (e) => {
                if (e.key !== 'Tab') return;
                const items = this._focusables();
                if (!items.length) return;
                const first = items[0], last = items[items.length - 1];
                const active = document.activeElement;
                if ((!e.shiftKey && active === last) || (e.shiftKey && (active === first || active === p))) {
                    e.preventDefault();
                    this.hide(0, true);
                }
            });
        }

        _focusables() {
            return Array.prototype.slice.call(this.popoverEl.querySelectorAll(FOCUSABLE));
        }

        _bindTransient() {
            this._listen(document, 'keydown', this._onKeydown);
            this._listen(window, 'scroll', this._onViewportChange, true);
            this._listen(window, 'resize', this._onViewportChange);
            if (this.options.closeOnOutsideClick && this.options.triggerOn !== 'manual') {
                this._listen(document, 'click', this._onDocClick);
            }
        }

        _unbindTransient() {
            this._unlisten(document, 'keydown', this._onKeydown);
            this._unlisten(window, 'scroll', this._onViewportChange, true);
            this._unlisten(window, 'resize', this._onViewportChange);
            this._unlisten(document, 'click', this._onDocClick);
        }

        _fits(side, tr, pr, offset, margin) {
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            switch (side) {
                case 'top': return tr.top - pr.height - offset >= margin;
                case 'bottom': return tr.bottom + pr.height + offset <= vh - margin;
                case 'left': return tr.left - pr.width - offset >= margin;
                case 'right': return tr.right + pr.width + offset <= vw - margin;
            }
            return true;
        }

        positionPopover() {
            if (this.destroyed) return;
            const triggerRect = this.triggerEl.getBoundingClientRect();
            const popoverRect = this.popoverEl.getBoundingClientRect();
            const offset = Number(this.options.offset) || 0;
            const margin = 10;
            const sx = window.scrollX || window.pageXOffset || 0;
            const sy = window.scrollY || window.pageYOffset || 0;

            let side = this.options.position;
            if (this.options.flip !== false && !this._fits(side, triggerRect, popoverRect, offset, margin)
                && this._fits(OPPOSITE[side], triggerRect, popoverRect, offset, margin)) {
                side = OPPOSITE[side];
            }
            if (side !== this.placement) {
                this.popoverEl.classList.remove(`chillpopover-${this.placement}`);
                this.popoverEl.classList.add(`chillpopover-${side}`);
                this.placement = side;
            }

            let top, left;
            switch (side) {
                case 'top':
                    top = triggerRect.top - popoverRect.height - offset + sy;
                    left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2 + sx;
                    break;
                case 'bottom':
                    top = triggerRect.bottom + offset + sy;
                    left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2 + sx;
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2 + sy;
                    left = triggerRect.left - popoverRect.width - offset + sx;
                    break;
                default:
                    top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2 + sy;
                    left = triggerRect.right + offset + sx;
            }

            const vw = window.innerWidth || document.documentElement.clientWidth;
            const margin2 = margin;
            if (left < margin2 + sx) left = margin2 + sx;
            if (left + popoverRect.width > vw + sx - margin2) left = Math.max(margin2 + sx, vw + sx - popoverRect.width - margin2);
            if (top < margin2 + sy) top = margin2 + sy;

            const arrow = this.popoverEl.querySelector('.chillpopover-arrow');
            if (arrow) {
                if (side === 'top' || side === 'bottom') {
                    const c = triggerRect.left + triggerRect.width / 2 + sx - left;
                    arrow.style.left = `${Math.min(Math.max(c, 16), Math.max(16, popoverRect.width - 16))}px`;
                } else {
                    const c = triggerRect.top + triggerRect.height / 2 + sy - top;
                    arrow.style.top = `${Math.min(Math.max(c, 16), Math.max(16, popoverRect.height - 16))}px`;
                }
            }

            this.popoverEl.style.top = `${top}px`;
            this.popoverEl.style.left = `${left}px`;
        }

        /** @param {boolean} [focusInside=true] move focus into the popover (only when focusOnOpen is on) */
        show(focusInside) {
            if (this.destroyed) return;
            clearTimeout(this._hideTimer);
            if (this.isOpen) return;
            this.isOpen = true;
            this.positionPopover();
            this.popoverEl.classList.add('visible');
            this.triggerEl.setAttribute('aria-expanded', 'true');
            this._bindTransient();

            if (focusInside !== false && this.options.focusOnOpen && this.options.triggerOn !== 'hover') {
                const items = this._focusables();
                if (items.length) items[0].focus();
            }
            if (typeof this.options.onOpen === 'function') this.options.onOpen(this);
            this._emit('open');
        }

        /**
         * @param {number} [delay] override hideDelay
         * @param {boolean} [restoreFocus] return focus to the trigger (only if focus is inside the popover / lost)
         */
        hide(delay, restoreFocus) {
            if (this.destroyed) return;
            clearTimeout(this._hideTimer);
            if (!this.isOpen) return;
            const wait = delay == null ? (Number(this.options.hideDelay) || 0) : delay;
            const run = () => {
                if (this.destroyed || !this.isOpen) return;
                const active = document.activeElement;
                const hadFocus = active && this.popoverEl.contains(active);
                this.isOpen = false;
                this.popoverEl.classList.remove('visible');
                this.triggerEl.setAttribute('aria-expanded', 'false');
                this._unbindTransient();
                if (this.options.returnFocus !== false && (restoreFocus || hadFocus) && typeof this.triggerEl.focus === 'function') {
                    this.triggerEl.focus();
                }
                if (typeof this.options.onClose === 'function') this.options.onClose(this);
                this._emit('close');
            };
            if (wait > 0) this._hideTimer = setTimeout(run, wait);
            else run();
        }

        toggle() {
            if (this.isOpen) this.hide(0);
            else this.show();
        }

        setContent(content, html) {
            this.options.content = content;
            fill(this.popoverEl.querySelector('.chillpopover-body'), content, html === undefined ? this.options.html === true : html === true);
            if (this.isOpen) this.positionPopover();
        }

        setTitle(title, html) {
            this.options.title = title;
            const header = this.popoverEl.querySelector('.chillpopover-title');
            if (header) fill(header, title, html === true);
        }

        setPosition(position) {
            if (!OPPOSITE[position]) return;
            this.popoverEl.classList.remove(`chillpopover-${this.placement}`);
            this.options.position = position;
            this.placement = position;
            this.popoverEl.classList.add(`chillpopover-${position}`);
            if (this.isOpen) this.positionPopover();
        }

        on(evt, fn) {
            (this._handlers[evt] = this._handlers[evt] || []).push(fn);
            return this;
        }

        off(evt, fn) {
            if (!this._handlers[evt]) return this;
            this._handlers[evt] = fn ? this._handlers[evt].filter(f => f !== fn) : [];
            return this;
        }

        _emit(evt) {
            (this._handlers[evt] || []).slice().forEach(fn => fn(this));
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            clearTimeout(this._hideTimer);
            this._listeners.forEach(([t, e, f, o]) => t.removeEventListener(e, f, o));
            this._listeners = [];
            this._handlers = {};
            const t = this.triggerEl;
            [['aria-controls', this._prevControls], ['aria-expanded', this._prevExpanded], ['aria-haspopup', this._prevHaspopup]]
                .forEach(([a, v]) => (v == null ? t.removeAttribute(a) : t.setAttribute(a, v)));
            if (this.popoverEl) this.popoverEl.remove();
            this.isOpen = false;
        }
    }

    function button(text, variant, action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `chillpopover-btn chillpopover-btn-${variant}`;
        b.setAttribute('data-action', action);
        b.textContent = text;
        return b;
    }

    function confirm(trigger, options = {}) {
        const footer = document.createDocumentFragment();
        const holder = document.createElement('div');
        holder.style.display = 'contents';
        const cancelBtn = button(options.cancelText || 'Cancel', 'secondary', 'cancel');
        const okBtn = button(options.confirmText || 'Confirm', /^[a-z]+$/.test(options.variant || '') ? options.variant : 'danger', 'confirm');
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);
        holder.appendChild(footer);

        const popover = new ChillPopoverInstance(trigger, {
            ...options,
            showClose: true,
            footer: holder,
            footerHtml: undefined
        });

        cancelBtn.addEventListener('click', () => {
            popover.hide(0, true);
            if (options.onCancel) options.onCancel();
        });

        okBtn.addEventListener('click', () => {
            popover.hide(0, true);
            if (options.onConfirm) options.onConfirm();
        });

        return popover;
    }

    const ChillPopover = {
        version: VERSION,

        init(trigger, options) {
            return new ChillPopoverInstance(trigger, options);
        },

        confirm,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillPopover;
    } else {
        window.ChillPopover = ChillPopover;
    }

})(typeof window !== 'undefined' ? window : this);
