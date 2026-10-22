/**
 * ChillTooltip - Zero-dependency Tooltip Component
 *
 * Usage:
 *   const tip = ChillTooltip.init('#save', { content: 'Save your work', position: 'top', delay: 200 });
 *   ChillTooltip.initAll('[data-tooltip]');          // reads the text from data-tooltip
 *   tip.setContent('Saved!'); tip.destroy();
 *
 * Options (all optional):
 *   content      string   ''       Tooltip text (falls back to the trigger's data-tooltip). Rendered with textContent.
 *   html         boolean  false    Opt in to HTML: when true `content` is inserted as markup (YOU must sanitise it).
 *   position     string   'top'    'top' | 'bottom' | 'left' | 'right'
 *   flip         boolean  true     Flip to the opposite side when the tooltip does not fit the viewport.
 *   variant      string   'default' 'default' | 'light' | 'primary' | 'success' | 'warning' | 'error'
 *   offset       number   8        Gap (px) between trigger and tooltip.
 *   delay        number   0        Show delay in ms.
 *   hideDelay    number   0        Hide delay in ms.
 *   showArrow    boolean  true
 *   triggerOn    string   'hover'  'hover' (mouse + keyboard focus) | 'focus' | 'click' | 'manual'
 *   id           string   auto     id of the tooltip element (used for aria-describedby on the trigger).
 *   onShow / onHide  function      Callbacks.
 *
 * Instance: show(), hide(), toggle(), setContent(content, html?), setPosition(pos), isVisible(), on(evt, fn), off(evt, fn), destroy()
 * Events: 'show', 'hide'.   Esc dismisses a visible tooltip.   The trigger gets aria-describedby while the instance lives.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilltooltip_css_injected__';
    const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chilltooltip-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilltooltip-styles';
        style.textContent = `
      :root {
        --chilltooltip-bg: #171717;
        --chilltooltip-text: #ffffff;
        --chilltooltip-border: #e5e5e5;
        --chilltooltip-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltooltip-bg: #fafafa;
          --chilltooltip-text: #171717;
          --chilltooltip-border: #404040;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilltooltip-bg: #fafafa;
        --chilltooltip-text: #171717;
        --chilltooltip-border: #404040;
      }

      .chilltooltip {
        position: absolute;
        top: 0;
        left: 0;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--chilltooltip-text);
        background: var(--chilltooltip-bg);
        border-radius: 6px;
        box-shadow: var(--chilltooltip-shadow);
        z-index: 10004;
        max-width: 250px;
        width: max-content;
        box-sizing: border-box;
        text-align: center;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease;
        line-height: 1.4;
      }

      .chilltooltip.visible {
        opacity: 1;
        visibility: visible;
      }

      .chilltooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--chilltooltip-bg);
        transform: rotate(45deg);
      }

      /* Positions */
      .chilltooltip-top { transform: translateY(4px); }
      .chilltooltip-top.visible { transform: translateY(0); }
      .chilltooltip-top .chilltooltip-arrow { bottom: -4px; left: 50%; margin-left: -4px; }

      .chilltooltip-bottom { transform: translateY(-4px); }
      .chilltooltip-bottom.visible { transform: translateY(0); }
      .chilltooltip-bottom .chilltooltip-arrow { top: -4px; left: 50%; margin-left: -4px; }

      .chilltooltip-left { transform: translateX(4px); }
      .chilltooltip-left.visible { transform: translateX(0); }
      .chilltooltip-left .chilltooltip-arrow { right: -4px; top: 50%; margin-top: -4px; }

      .chilltooltip-right { transform: translateX(-4px); }
      .chilltooltip-right.visible { transform: translateX(0); }
      .chilltooltip-right .chilltooltip-arrow { left: -4px; top: 50%; margin-top: -4px; }

      /* Variants */
      .chilltooltip-light {
        --chilltooltip-bg: #ffffff;
        --chilltooltip-text: #171717;
        border: 1px solid var(--chilltooltip-border);
      }

      :root[data-theme="dark"] .chilltooltip-light, :root.dark .chilltooltip-light {
        --chilltooltip-bg: #262626;
        --chilltooltip-text: #fafafa;
      }

      .chilltooltip-primary { --chilltooltip-bg: #3b82f6; --chilltooltip-text: #ffffff; }
      .chilltooltip-success { --chilltooltip-bg: #16a34a; --chilltooltip-text: #ffffff; }
      .chilltooltip-warning { --chilltooltip-bg: #b45309; --chilltooltip-text: #ffffff; }
      .chilltooltip-error { --chilltooltip-bg: #dc2626; --chilltooltip-text: #ffffff; }

      @media (prefers-reduced-motion: reduce) {
        .chilltooltip, .chilltooltip-top, .chilltooltip-bottom, .chilltooltip-left, .chilltooltip-right {
          transition: none !important;
          transform: none !important;
        }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    class ChillTooltipInstance {
        constructor(trigger, options = {}) {
            if (typeof document === 'undefined') throw new Error('ChillTooltip requires a DOM');
            this.triggerEl = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
            if (!this.triggerEl) throw new Error('ChillTooltip: trigger element not found');

            this.options = {
                position: 'top',
                variant: 'default',
                offset: 8,
                delay: 0,
                hideDelay: 0,
                showArrow: true,
                triggerOn: 'hover',
                flip: true,
                html: false,
                ...options
            };
            if (this.options.content == null || this.options.content === '') {
                this.options.content = this.triggerEl.getAttribute('data-tooltip') || '';
            }
            this.options.showArrow = options.showArrow !== false;
            if (!OPPOSITE[this.options.position]) this.options.position = 'top';

            this.tooltipEl = null;
            this.showTimeout = null;
            this.hideTimeout = null;
            this.placement = this.options.position;
            this.destroyed = false;
            this._listeners = [];
            this._handlers = {};
            this._visible = false;
            this._prevDescribedBy = this.triggerEl.getAttribute('aria-describedby');

            this._onDocClick = (e) => {
                if (!this.triggerEl.contains(e.target) && !this.tooltipEl.contains(e.target)) this.hide();
            };
            this._onKeydown = (e) => {
                if (e.key === 'Escape' || e.key === 'Esc') this.hide(0);
            };
            this._onViewportChange = () => {
                if (this._visible) this.positionTooltip();
            };

            this.init();
        }

        init() {
            injectCSS();
            this.createTooltip();
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

        _setContentNode(content, html) {
            const node = this.tooltipEl.querySelector('.chilltooltip-content');
            if (html) node.innerHTML = content == null ? '' : String(content);
            else node.textContent = content == null ? '' : String(content);
        }

        createTooltip() {
            const el = document.createElement('div');
            el.className = `chilltooltip chilltooltip-${this.options.position}`;
            el.id = this.options.id || `chilltooltip-${++uid}`;
            el.setAttribute('role', 'tooltip');

            if (this.options.variant !== 'default') {
                el.classList.add(`chilltooltip-${this.options.variant}`);
            }

            const content = document.createElement('span');
            content.className = 'chilltooltip-content';
            el.appendChild(content);
            if (this.options.showArrow) {
                const arrow = document.createElement('span');
                arrow.className = 'chilltooltip-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                el.appendChild(arrow);
            }

            this.tooltipEl = el;
            this._setContentNode(this.options.content, this.options.html === true);
            document.body.appendChild(el);

            const ids = (this._prevDescribedBy ? this._prevDescribedBy + ' ' : '') + el.id;
            this.triggerEl.setAttribute('aria-describedby', ids);
        }

        bindEvents() {
            const mode = this.options.triggerOn;
            const t = this.triggerEl;
            if (mode === 'hover') {
                this._listen(t, 'mouseenter', () => this.show());
                this._listen(t, 'mouseleave', () => this.hide());
                this._listen(t, 'focus', () => this.show());
                this._listen(t, 'blur', () => this.hide());
            } else if (mode === 'focus') {
                this._listen(t, 'focus', () => this.show());
                this._listen(t, 'blur', () => this.hide());
            } else if (mode === 'click') {
                this._listen(t, 'click', () => this.toggle());
            }
        }

        _bindTransient() {
            this._listen(document, 'keydown', this._onKeydown);
            this._listen(window, 'scroll', this._onViewportChange, true);
            this._listen(window, 'resize', this._onViewportChange);
            if (this.options.triggerOn === 'click') this._listen(document, 'click', this._onDocClick);
        }

        _unbindTransient() {
            this._unlisten(document, 'keydown', this._onKeydown);
            this._unlisten(window, 'scroll', this._onViewportChange, true);
            this._unlisten(window, 'resize', this._onViewportChange);
            this._unlisten(document, 'click', this._onDocClick);
        }

        _fits(side, tr, tt, offset, margin) {
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            switch (side) {
                case 'top': return tr.top - tt.height - offset >= margin;
                case 'bottom': return tr.bottom + tt.height + offset <= vh - margin;
                case 'left': return tr.left - tt.width - offset >= margin;
                case 'right': return tr.right + tt.width + offset <= vw - margin;
            }
            return true;
        }

        positionTooltip() {
            if (this.destroyed) return;
            const triggerRect = this.triggerEl.getBoundingClientRect();
            const tooltipRect = this.tooltipEl.getBoundingClientRect();
            const offset = Number(this.options.offset) || 0;
            const margin = 10;
            const sx = window.scrollX || window.pageXOffset || 0;
            const sy = window.scrollY || window.pageYOffset || 0;

            let side = this.options.position;
            if (this.options.flip !== false && !this._fits(side, triggerRect, tooltipRect, offset, margin)
                && this._fits(OPPOSITE[side], triggerRect, tooltipRect, offset, margin)) {
                side = OPPOSITE[side];
            }
            if (side !== this.placement) {
                this.tooltipEl.classList.remove(`chilltooltip-${this.placement}`);
                this.tooltipEl.classList.add(`chilltooltip-${side}`);
                this.placement = side;
            }

            let top, left;
            switch (side) {
                case 'top':
                    top = triggerRect.top - tooltipRect.height - offset + sy;
                    left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2 + sx;
                    break;
                case 'bottom':
                    top = triggerRect.bottom + offset + sy;
                    left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2 + sx;
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2 + sy;
                    left = triggerRect.left - tooltipRect.width - offset + sx;
                    break;
                default:
                    top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2 + sy;
                    left = triggerRect.right + offset + sx;
            }

            // Keep inside viewport horizontally / vertically and re-aim the arrow at the trigger.
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (left < margin + sx) left = margin + sx;
            if (left + tooltipRect.width > vw + sx - margin) left = Math.max(margin + sx, vw + sx - tooltipRect.width - margin);
            if (top < margin + sy) top = margin + sy;
            if (top + tooltipRect.height > vh + sy - margin) top = Math.max(margin + sy, vh + sy - tooltipRect.height - margin);

            const arrow = this.tooltipEl.querySelector('.chilltooltip-arrow');
            if (arrow) {
                if (side === 'top' || side === 'bottom') {
                    const c = triggerRect.left + triggerRect.width / 2 + sx - left;
                    arrow.style.left = `${Math.min(Math.max(c, 8), Math.max(8, tooltipRect.width - 8))}px`;
                } else {
                    const c = triggerRect.top + triggerRect.height / 2 + sy - top;
                    arrow.style.top = `${Math.min(Math.max(c, 8), Math.max(8, tooltipRect.height - 8))}px`;
                }
            }

            this.tooltipEl.style.top = `${top}px`;
            this.tooltipEl.style.left = `${left}px`;
        }

        isVisible() {
            return this._visible;
        }

        show(delay) {
            if (this.destroyed) return;
            clearTimeout(this.hideTimeout);
            clearTimeout(this.showTimeout);
            const wait = delay == null ? (Number(this.options.delay) || 0) : delay;
            const run = () => {
                if (this.destroyed || this._visible) return;
                this.positionTooltip();
                this.tooltipEl.classList.add('visible');
                this._visible = true;
                this._bindTransient();
                this._emit('show');
            };
            if (wait > 0) this.showTimeout = setTimeout(run, wait);
            else run();
        }

        hide(delay) {
            if (this.destroyed) return;
            clearTimeout(this.showTimeout);
            clearTimeout(this.hideTimeout);
            const wait = delay == null ? (Number(this.options.hideDelay) || 0) : delay;
            const run = () => {
                if (this.destroyed || !this._visible) return;
                this.tooltipEl.classList.remove('visible');
                this._visible = false;
                this._unbindTransient();
                this._emit('hide');
            };
            if (wait > 0) this.hideTimeout = setTimeout(run, wait);
            else run();
        }

        toggle() {
            if (this._visible) this.hide();
            else this.show();
        }

        setContent(content, html) {
            this.options.content = content;
            this._setContentNode(content, html === undefined ? this.options.html === true : html === true);
            if (this._visible) this.positionTooltip();
        }

        setPosition(position) {
            if (!OPPOSITE[position]) return;
            this.tooltipEl.classList.remove(`chilltooltip-${this.placement}`);
            this.options.position = position;
            this.placement = position;
            this.tooltipEl.classList.add(`chilltooltip-${position}`);
            if (this._visible) this.positionTooltip();
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
            const cb = evt === 'show' ? this.options.onShow : this.options.onHide;
            if (typeof cb === 'function') cb(this);
            (this._handlers[evt] || []).slice().forEach(fn => fn(this));
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            clearTimeout(this.showTimeout);
            clearTimeout(this.hideTimeout);
            this._listeners.forEach(([t, e, f, o]) => t.removeEventListener(e, f, o));
            this._listeners = [];
            this._handlers = {};
            if (this._prevDescribedBy) this.triggerEl.setAttribute('aria-describedby', this._prevDescribedBy);
            else this.triggerEl.removeAttribute('aria-describedby');
            if (this.tooltipEl) this.tooltipEl.remove();
            this._visible = false;
        }
    }

    function initAll(selector = '[data-tooltip]', options = {}) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => new ChillTooltipInstance(el, options));
    }

    const ChillTooltip = {
        version: VERSION,

        init(trigger, options) {
            return new ChillTooltipInstance(trigger, options);
        },

        initAll,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTooltip;
    } else {
        window.ChillTooltip = ChillTooltip;
    }

})(typeof window !== 'undefined' ? window : this);
