/**
 * ChillDrawer - Zero-dependency side drawer / sheet
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const drawer = ChillDrawer.create({ side: 'right', title: 'Settings', content: 'Hello' });
 *   drawer.open();            // drawer.close(); drawer.toggle(); drawer.destroy();
 *   ChillDrawer.open({ title: 'Quick', content: someElement });   // one-shot, auto destroyed on close
 *   ChillDrawer.init('[data-chill-drawer="#panel"]');              // trigger buttons, target = element to show
 *
 * Options (all optional)
 *   side            'left' | 'right' | 'top' | 'bottom'          default 'right'
 *   size            'sm' | 'md' | 'lg' | 'xl' | 'full' | number(px) | CSS length   default 'md'
 *   title           string (textContent)
 *   content         string (textContent) | Element | Node. Use `html: true` to render a string as HTML (YOU sanitize!)
 *   html            boolean, render `content`/`footer` strings as HTML           default false
 *   footer          string | Element
 *   overlay         show backdrop                                  default true
 *   closeOnOverlay  click backdrop closes                          default true
 *   closeOnEsc      Esc closes (top-most drawer only)              default true
 *   showClose       render the close button                        default true
 *   trapFocus       keep Tab inside the drawer                     default true
 *   lockScroll      lock page scroll while open                    default true
 *   returnFocus     restore focus to previously focused element    default true
 *   swipeToClose    touch-swipe towards the edge closes it         default false
 *   open            open immediately                               default false
 *   destroyOnClose  remove the instance after closing              default false
 *   ariaLabel       accessible name when no title
 *   className       extra class on the root element
 *   container       element to mount into                          default document.body
 *   onOpen, onClose, onBeforeClose(reason, instance) (return false to cancel)
 *
 * Instance: { element, panel, body, isOpen, open(), close(reason), toggle(), setContent(), setTitle(), setFooter(),
 *             on(evt, fn), off(evt, fn), destroy() }
 * Events: 'open', 'close'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilldrawer-styles';
    const BASE_Z = 10000;
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

    const stack = [];       // open drawer instances, last = top
    let scrollLocks = 0;
    let savedOverflow = '';
    let savedPadding = '';
    let uid = 0;

    const DARK_VARS = `
        --chilldrawer-bg: #171717;
        --chilldrawer-text: #fafafa;
        --chilldrawer-muted: #a3a3a3;
        --chilldrawer-border: #2e2e2e;
        --chilldrawer-hover: #262626;
        --chilldrawer-overlay: rgba(0, 0, 0, 0.65);
        --chilldrawer-shadow: 0 0 40px rgba(0, 0, 0, 0.6);`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chilldrawer-bg: #ffffff;
        --chilldrawer-text: #171717;
        --chilldrawer-muted: #6b7280;
        --chilldrawer-border: #e5e5e5;
        --chilldrawer-hover: #f3f4f6;
        --chilldrawer-primary: #3b82f6;
        --chilldrawer-overlay: rgba(15, 23, 42, 0.45);
        --chilldrawer-shadow: 0 0 40px rgba(0, 0, 0, 0.18);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chilldrawer {
        position: fixed;
        inset: 0;
        display: flex;
        pointer-events: none;
        font-family: inherit;
        font-size: 14px;
        color: var(--chilldrawer-text);
      }
      .chilldrawer-overlay {
        position: absolute;
        inset: 0;
        background: var(--chilldrawer-overlay);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: auto;
      }
      .chilldrawer-open .chilldrawer-overlay { opacity: 1; }
      .chilldrawer-panel {
        position: absolute;
        display: flex;
        flex-direction: column;
        background: var(--chilldrawer-bg);
        box-shadow: var(--chilldrawer-shadow);
        pointer-events: auto;
        outline: none;
        box-sizing: border-box;
        max-width: 100vw;
        max-height: 100vh;
        transition: transform 0.2s ease;
        will-change: transform;
      }
      .chilldrawer-panel.chilldrawer-dragging { transition: none; }
      .chilldrawer-right .chilldrawer-panel { top: 0; right: 0; bottom: 0; width: var(--chilldrawer-size, 420px); transform: translateX(100%); border-radius: 12px 0 0 12px; }
      .chilldrawer-left .chilldrawer-panel { top: 0; left: 0; bottom: 0; width: var(--chilldrawer-size, 420px); transform: translateX(-100%); border-radius: 0 12px 12px 0; }
      .chilldrawer-top .chilldrawer-panel { top: 0; left: 0; right: 0; height: var(--chilldrawer-size, 420px); transform: translateY(-100%); border-radius: 0 0 12px 12px; }
      .chilldrawer-bottom .chilldrawer-panel { bottom: 0; left: 0; right: 0; height: var(--chilldrawer-size, 420px); transform: translateY(100%); border-radius: 12px 12px 0 0; }
      .chilldrawer-open .chilldrawer-panel { transform: none; }
      .chilldrawer-full .chilldrawer-panel { border-radius: 0 !important; }

      .chilldrawer-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--chilldrawer-border);
        flex-shrink: 0;
      }
      .chilldrawer-title { flex: 1; margin: 0; font-size: 16px; font-weight: 600; line-height: 1.4; }
      .chilldrawer-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--chilldrawer-muted);
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        font-family: inherit;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .chilldrawer-close:hover { background: var(--chilldrawer-hover); color: var(--chilldrawer-text); }
      .chilldrawer-close:focus-visible { outline: 2px solid var(--chilldrawer-primary); outline-offset: 2px; }
      .chilldrawer-body { flex: 1; overflow: auto; padding: 20px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
      .chilldrawer-footer {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding: 14px 20px;
        border-top: 1px solid var(--chilldrawer-border);
        flex-shrink: 0;
      }
      .chilldrawer-grip { display: none; }
      .chilldrawer-swipe.chilldrawer-bottom .chilldrawer-grip,
      .chilldrawer-swipe.chilldrawer-top .chilldrawer-grip {
        display: block; width: 36px; height: 4px; border-radius: 2px; background: var(--chilldrawer-border); margin: 8px auto 0; flex-shrink: 0;
      }
      .chilldrawer-nooverlay .chilldrawer-overlay { display: none; }

      @media (max-width: 480px) {
        .chilldrawer-left .chilldrawer-panel, .chilldrawer-right .chilldrawer-panel { max-width: 92vw; }
        .chilldrawer-full.chilldrawer-left .chilldrawer-panel, .chilldrawer-full.chilldrawer-right .chilldrawer-panel { max-width: 100vw; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chilldrawer-overlay, .chilldrawer-panel, .chilldrawer-close { transition: none !important; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function sizeValue(size) {
        if (typeof size === 'number') return size + 'px';
        const map = { sm: '320px', md: '420px', lg: '560px', xl: '720px', full: '100%' };
        if (map[size]) return map[size];
        return typeof size === 'string' && size ? size : map.md;
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function lockScroll() {
        if (scrollLocks++ > 0) return;
        const root = document.documentElement;
        const scrollbar = window.innerWidth - root.clientWidth;
        savedOverflow = document.body.style.overflow;
        savedPadding = document.body.style.paddingRight;
        document.body.style.overflow = 'hidden';
        if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
    }
    function unlockScroll() {
        if (scrollLocks === 0) return;
        if (--scrollLocks === 0) {
            document.body.style.overflow = savedOverflow;
            document.body.style.paddingRight = savedPadding;
        }
    }

    function getFocusable(root) {
        return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), el => !el.hidden && el.getAttribute('aria-hidden') !== 'true');
    }

    function fill(target, value, html) {
        target.textContent = '';
        if (value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            if (html) target.innerHTML = String(value); else target.textContent = String(value);
        } else if (value.nodeType) target.appendChild(value);
    }

    class ChillDrawerInstance {
        constructor(options) {
            injectCSS();
            const o = this.options = Object.assign({
                side: 'right', size: 'md', title: '', content: '', html: false, footer: null, overlay: true,
                closeOnOverlay: true, closeOnEsc: true, showClose: true, trapFocus: true, lockScroll: true,
                returnFocus: true, swipeToClose: false, open: false, destroyOnClose: false, ariaLabel: '',
                className: '', container: null, onOpen: null, onClose: null, onBeforeClose: null
            }, options || {});
            if (['left', 'right', 'top', 'bottom'].indexOf(o.side) < 0) o.side = 'right';
            this.isOpen = false;
            this.destroyed = false;
            this._listeners = {};
            this._timers = [];
            this._cleanups = [];
            this._id = 'chilldrawer-' + (++uid);
            this._build();
            if (o.open) this.open();
        }

        _build() {
            const o = this.options;
            const root = this.element = document.createElement('div');
            root.className = 'chilldrawer chilldrawer-' + o.side
                + (o.size === 'full' ? ' chilldrawer-full' : '')
                + (o.overlay ? '' : ' chilldrawer-nooverlay')
                + (o.swipeToClose ? ' chilldrawer-swipe' : '')
                + (o.className ? ' ' + o.className : '');

            const overlay = this.overlay = document.createElement('div');
            overlay.className = 'chilldrawer-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            root.appendChild(overlay);

            const panel = this.panel = document.createElement('div');
            panel.className = 'chilldrawer-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', o.overlay ? 'true' : 'false');
            panel.tabIndex = -1;
            panel.style.setProperty('--chilldrawer-size', sizeValue(o.size));
            root.appendChild(panel);

            const grip = document.createElement('div');
            grip.className = 'chilldrawer-grip';
            panel.appendChild(grip);

            this.header = document.createElement('div');
            this.header.className = 'chilldrawer-header';
            this.titleEl = document.createElement('h2');
            this.titleEl.className = 'chilldrawer-title';
            this.titleEl.id = this._id + '-title';
            this.header.appendChild(this.titleEl);
            if (o.showClose) {
                const close = this.closeBtn = document.createElement('button');
                close.type = 'button';
                close.className = 'chilldrawer-close';
                close.setAttribute('aria-label', 'Close');
                close.textContent = '×';
                close.addEventListener('click', () => this.close('button'));
                this.header.appendChild(close);
            }
            panel.appendChild(this.header);

            this.body = document.createElement('div');
            this.body.className = 'chilldrawer-body';
            panel.appendChild(this.body);

            this.footerEl = document.createElement('div');
            this.footerEl.className = 'chilldrawer-footer';
            panel.appendChild(this.footerEl);

            this.setTitle(o.title);
            this.setContent(o.content);
            this.setFooter(o.footer);

            if (o.closeOnOverlay) overlay.addEventListener('click', () => this.close('overlay'));
            if (o.swipeToClose) this._bindSwipe();
        }

        setTitle(title) {
            this.options.title = title;
            this.titleEl.textContent = title == null ? '' : String(title);
            this.header.style.display = (title || this.options.showClose) ? '' : 'none';
            if (title) { this.panel.setAttribute('aria-labelledby', this.titleEl.id); this.panel.removeAttribute('aria-label'); }
            else {
                this.panel.removeAttribute('aria-labelledby');
                if (this.options.ariaLabel) this.panel.setAttribute('aria-label', this.options.ariaLabel);
            }
            return this;
        }

        setContent(content) {
            this.options.content = content;
            fill(this.body, content, this.options.html);
            return this;
        }

        setFooter(footer) {
            this.options.footer = footer;
            fill(this.footerEl, footer, this.options.html);
            this.footerEl.style.display = footer ? '' : 'none';
            return this;
        }

        _bindSwipe() {
            const panel = this.panel;
            const side = this.options.side;
            const horizontal = side === 'left' || side === 'right';
            const sign = (side === 'right' || side === 'bottom') ? 1 : -1;
            let start = null, delta = 0, startT = 0;
            const point = e => (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
            const onStart = e => {
                const p = point(e); if (!p) return;
                start = horizontal ? p.clientX : p.clientY; delta = 0; startT = Date.now();
            };
            const onMove = e => {
                if (start == null) return;
                const p = point(e); if (!p) return;
                const d = ((horizontal ? p.clientX : p.clientY) - start) * sign;
                delta = Math.max(0, d);
                panel.classList.add('chilldrawer-dragging');
                panel.style.transform = horizontal ? `translateX(${delta * sign}px)` : `translateY(${delta * sign}px)`;
            };
            const onEnd = () => {
                if (start == null) return;
                const size = (horizontal ? panel.offsetWidth : panel.offsetHeight) || 300;
                const velocity = delta / Math.max(1, Date.now() - startT);
                const shouldClose = delta > size * 0.35 || (delta > 40 && velocity > 0.5);
                start = null;
                panel.classList.remove('chilldrawer-dragging');
                panel.style.transform = '';
                if (shouldClose) this.close('swipe');
            };
            panel.addEventListener('touchstart', onStart, { passive: true });
            panel.addEventListener('touchmove', onMove, { passive: true });
            panel.addEventListener('touchend', onEnd);
            panel.addEventListener('touchcancel', onEnd);
            this._cleanups.push(() => {
                panel.removeEventListener('touchstart', onStart);
                panel.removeEventListener('touchmove', onMove);
                panel.removeEventListener('touchend', onEnd);
                panel.removeEventListener('touchcancel', onEnd);
            });
        }

        _onKeydown(e) {
            if (stack[stack.length - 1] !== this) return;
            if (e.key === 'Escape' && this.options.closeOnEsc) {
                e.stopPropagation();
                this.close('escape');
                return;
            }
            if (e.key === 'Tab' && this.options.trapFocus) {
                const items = getFocusable(this.panel);
                if (!items.length) { e.preventDefault(); this.panel.focus(); return; }
                const first = items[0], last = items[items.length - 1];
                const active = document.activeElement;
                if (e.shiftKey && (active === first || active === this.panel || !this.panel.contains(active))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (active === last || !this.panel.contains(active))) { e.preventDefault(); first.focus(); }
            }
        }

        open() {
            if (this.destroyed || this.isOpen) return this;
            const o = this.options;
            this._clearTimers();
            this._prevFocus = document.activeElement;
            (o.container || document.body).appendChild(this.element);
            this.isOpen = true;
            stack.push(this);
            this.element.style.zIndex = String(BASE_Z + stack.length - 1);
            if (o.lockScroll) { lockScroll(); this._locked = true; }
            this._keyHandler = e => this._onKeydown(e);
            document.addEventListener('keydown', this._keyHandler, true);
            this._focusinHandler = e => {
                if (o.trapFocus && o.overlay && stack[stack.length - 1] === this && !this.panel.contains(e.target)
                    && !(e.target.closest && e.target.closest('.chilldrawer'))) {
                    const items = getFocusable(this.panel);
                    (items[0] || this.panel).focus();
                }
            };
            document.addEventListener('focusin', this._focusinHandler);

            const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn => setTimeout(fn, 16));
            this._raf = raf(() => {
                this._raf = null;
                this.element.classList.add('chilldrawer-open');
            });
            // Move focus right away so keyboard handling works before the first frame.
            const target = this.panel.querySelector('[autofocus]') || getFocusable(this.body)[0] || this.closeBtn || this.panel;
            try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
            this._emit('open');
            return this;
        }

        close(reason) {
            if (this.destroyed || !this.isOpen) return this;
            const o = this.options;
            if (typeof o.onBeforeClose === 'function' && o.onBeforeClose(reason, this) === false) return this;
            this.isOpen = false;
            const i = stack.indexOf(this);
            if (i >= 0) stack.splice(i, 1);
            this._teardownGlobal();
            this.element.classList.remove('chilldrawer-open');
            const finish = () => {
                if (this.destroyed || this.isOpen) return;
                if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
                if (o.destroyOnClose) this.destroy();
            };
            if (reducedMotion()) finish(); else this._timers.push(setTimeout(finish, 230));
            this._restoreFocus();
            this._emit('close', reason);
            return this;
        }

        _restoreFocus() {
            const el = this._prevFocus;
            this._prevFocus = null;
            if (this.options.returnFocus && el && typeof el.focus === 'function' && document.contains(el)) {
                try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            }
        }

        toggle() { return this.isOpen ? this.close('toggle') : this.open(); }

        _teardownGlobal() {
            if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler, true); this._keyHandler = null; }
            if (this._focusinHandler) { document.removeEventListener('focusin', this._focusinHandler); this._focusinHandler = null; }
            if (this._raf && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(this._raf); } catch (e) { /* ignore */ } }
            this._raf = null;
            if (this._locked) { unlockScroll(); this._locked = false; }
        }

        _clearTimers() { this._timers.forEach(clearTimeout); this._timers = []; }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) {
            if (!this._listeners[evt]) return this;
            this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : [];
            return this;
        }
        _emit(evt, arg) {
            const cb = evt === 'open' ? this.options.onOpen : this.options.onClose;
            if (typeof cb === 'function') cb(arg, this);
            (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this));
        }

        destroy() {
            if (this.destroyed) return;
            const wasOpen = this.isOpen;
            this.destroyed = true;
            const i = stack.indexOf(this);
            if (i >= 0) stack.splice(i, 1);
            this.isOpen = false;
            this._teardownGlobal();
            this._clearTimers();
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
            if (wasOpen) this._restoreFocus();
            this._listeners = {};
        }
    }

    function create(options) { return new ChillDrawerInstance(options); }

    function openOnce(options) {
        const d = new ChillDrawerInstance(Object.assign({}, options, { destroyOnClose: true, open: false }));
        d.open();
        return d;
    }

    /** Enhance trigger elements. data-chill-drawer="#id" (element shown inside the drawer) or options.content. */
    function init(selector, options) {
        injectCSS();
        const els = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []);
        const handles = els.map(el => {
            const attr = el.getAttribute('data-chill-drawer');
            const target = attr && attr.charAt(0) === '#' ? document.getElementById(attr.slice(1)) : null;
            const opts = Object.assign({}, options || {});
            const side = el.getAttribute('data-side'); if (side) opts.side = side;
            const size = el.getAttribute('data-size'); if (size) opts.size = isNaN(size) ? size : Number(size);
            const title = el.getAttribute('data-title'); if (title && !opts.title) opts.title = title;
            let placeholder = null;
            if (target && target.parentNode) {
                placeholder = document.createComment('chilldrawer');
                target.parentNode.insertBefore(placeholder, target);
                target.hidden = false;
            }
            const drawer = new ChillDrawerInstance(Object.assign({}, opts, { content: target || opts.content || '' }));
            el.setAttribute('aria-haspopup', 'dialog');
            const onClick = e => { e.preventDefault(); drawer.open(); };
            el.addEventListener('click', onClick);
            return {
                drawer,
                destroy() {
                    el.removeEventListener('click', onClick);
                    el.removeAttribute('aria-haspopup');
                    if (target && placeholder && placeholder.parentNode) { placeholder.parentNode.insertBefore(target, placeholder); placeholder.parentNode.removeChild(placeholder); }
                    drawer.destroy();
                }
            };
        });
        return {
            drawers: handles.map(h => h.drawer),
            destroy() { handles.forEach(h => h.destroy()); }
        };
    }

    function closeAll() { stack.slice().reverse().forEach(d => d.close('closeAll')); }

    const ChillDrawer = {
        version: VERSION,
        create,
        open: openOnce,
        init,
        closeAll,
        getStack() { return stack.slice(); },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillDrawer;
    } else {
        window.ChillDrawer = ChillDrawer;
    }

})(typeof window !== 'undefined' ? window : this);
