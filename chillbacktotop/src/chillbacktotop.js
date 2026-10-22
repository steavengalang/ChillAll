/**
 * ChillBackToTop - Zero-dependency floating back-to-top button with progress ring
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const btt = ChillBackToTop.create({ threshold: 300, progress: true, position: 'bottom-right' });
 *   btt.scrollToTop();   // btt.show(); btt.hide(); btt.update(); btt.destroy();
 *
 *   ChillBackToTop.init({ target: '#scroll-container' });   // alias of create (scroll a container instead of the window)
 *
 * Options
 *   threshold    scroll distance (px) after which the button appears           default 300
 *   position     'bottom-right' | 'bottom-left' | 'bottom-center'              default 'bottom-right'
 *   offset       distance from the viewport edge (px)                          default 24
 *   size         'sm' | 'md' | 'lg' | number (px)                              default 'md'
 *   progress     show a ring that fills with scroll progress                   default true
 *   target       window (default) | selector | Element: the scroller to observe/scroll
 *   label        aria-label                                                    default 'Back to top'
 *   icon         text/emoji replacing the default arrow icon (text only)
 *   behavior     'smooth' | 'auto'  (reduced-motion users always get 'auto')   default 'smooth'
 *   focusTarget  selector/Element to focus after scrolling; default: blur the button
 *   container    element to mount into                                         default document.body
 *   className    extra class
 *   onClick(event), onShow(), onHide()
 *
 * Instance: { element, visible, show(), hide(), scrollToTop(), update(), on(evt, fn), off(evt, fn), destroy() }
 * Events: 'show', 'hide', 'click'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillbacktotop-styles';
    const SIZES = { sm: 36, md: 44, lg: 56 };
    const RING_R = 20;
    const RING_C = 2 * Math.PI * RING_R;

    const DARK_VARS = `
        --chillbacktotop-bg: #262626;
        --chillbacktotop-text: #fafafa;
        --chillbacktotop-track: #404040;
        --chillbacktotop-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillbacktotop-bg: #ffffff;
        --chillbacktotop-text: #171717;
        --chillbacktotop-track: #e5e5e5;
        --chillbacktotop-primary: #3b82f6;
        --chillbacktotop-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chillbacktotop {
        position: fixed;
        bottom: var(--chillbacktotop-offset, 24px);
        z-index: 10000;
        width: var(--chillbacktotop-size, 44px);
        height: var(--chillbacktotop-size, 44px);
        min-width: 32px; min-height: 32px;
        padding: 0; border: 0; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--chillbacktotop-bg); color: var(--chillbacktotop-text);
        box-shadow: var(--chillbacktotop-shadow);
        font-family: inherit; font-size: 18px; line-height: 1; cursor: pointer;
        opacity: 0; visibility: hidden; transform: translateY(12px) scale(0.9);
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s;
      }
      .chillbacktotop-right { right: var(--chillbacktotop-offset, 24px); }
      .chillbacktotop-left { left: var(--chillbacktotop-offset, 24px); }
      .chillbacktotop-center { left: 50%; margin-left: calc(var(--chillbacktotop-size, 44px) / -2); }
      .chillbacktotop-visible { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
      .chillbacktotop:hover { transform: translateY(-2px); }
      .chillbacktotop:not(.chillbacktotop-visible):hover { transform: translateY(12px) scale(0.9); }
      .chillbacktotop:focus-visible { outline: 2px solid var(--chillbacktotop-primary); outline-offset: 3px; }
      .chillbacktotop-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); pointer-events: none; }
      .chillbacktotop-ring circle { fill: none; stroke-width: 3; }
      .chillbacktotop-ring-track { stroke: var(--chillbacktotop-track); }
      .chillbacktotop-ring-bar { stroke: var(--chillbacktotop-primary); stroke-linecap: round; transition: stroke-dashoffset 0.1s linear; }
      .chillbacktotop-icon { position: relative; display: inline-flex; }
      @media (prefers-reduced-motion: reduce) {
        .chillbacktotop { transition: none; }
        .chillbacktotop-ring-bar { transition: none; }
        .chillbacktotop:hover { transform: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    const ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
    const SVG_NS = 'http://www.w3.org/2000/svg';

    class ChillBackToTopInstance {
        constructor(options) {
            injectCSS();
            const o = this.options = Object.assign({
                threshold: 300, position: 'bottom-right', offset: 24, size: 'md', progress: true, target: null,
                label: 'Back to top', icon: null, behavior: 'smooth', focusTarget: null, container: null, className: '',
                onClick: null, onShow: null, onHide: null
            }, options || {});
            this.visible = false;
            this.destroyed = false;
            this._listeners = {};
            this._raf = null;
            this._scroller = this._resolveScroller();
            this._build();
            this._onScroll = () => this._schedule();
            const t = this._scroller === window ? window : this._scroller;
            t.addEventListener('scroll', this._onScroll, { passive: true });
            window.addEventListener('resize', this._onScroll);
            this.update();
        }

        _resolveScroller() {
            const t = this.options.target;
            if (!t || t === window) return window;
            const el = typeof t === 'string' ? document.querySelector(t) : t;
            return el && el.nodeType === 1 ? el : window;
        }

        _build() {
            const o = this.options;
            const b = this.element = document.createElement('button');
            b.type = 'button';
            const pos = ['bottom-left', 'bottom-center'].indexOf(o.position) >= 0 ? o.position.replace('bottom-', '') : 'right';
            b.className = 'chillbacktotop chillbacktotop-' + pos + (o.className ? ' ' + o.className : '');
            b.setAttribute('aria-label', o.label);
            b.setAttribute('aria-hidden', 'true');
            b.tabIndex = -1;
            const size = typeof o.size === 'number' ? o.size : (SIZES[o.size] || SIZES.md);
            b.style.setProperty('--chillbacktotop-size', size + 'px');
            b.style.setProperty('--chillbacktotop-offset', o.offset + 'px');

            if (o.progress) {
                const svg = document.createElementNS(SVG_NS, 'svg');
                svg.setAttribute('class', 'chillbacktotop-ring');
                svg.setAttribute('viewBox', '0 0 48 48');
                svg.setAttribute('aria-hidden', 'true');
                const track = document.createElementNS(SVG_NS, 'circle');
                track.setAttribute('class', 'chillbacktotop-ring-track');
                track.setAttribute('cx', '24'); track.setAttribute('cy', '24'); track.setAttribute('r', String(RING_R));
                const bar = this.bar = document.createElementNS(SVG_NS, 'circle');
                bar.setAttribute('class', 'chillbacktotop-ring-bar');
                bar.setAttribute('cx', '24'); bar.setAttribute('cy', '24'); bar.setAttribute('r', String(RING_R));
                bar.setAttribute('stroke-dasharray', RING_C.toFixed(2));
                bar.setAttribute('stroke-dashoffset', RING_C.toFixed(2));
                svg.appendChild(track); svg.appendChild(bar);
                b.appendChild(svg);
            }
            const ic = document.createElement('span');
            ic.className = 'chillbacktotop-icon';
            ic.setAttribute('aria-hidden', 'true');
            if (o.icon) ic.textContent = String(o.icon); else ic.innerHTML = ARROW;
            b.appendChild(ic);

            this._onClick = e => {
                if (typeof o.onClick === 'function') o.onClick(e, this);
                this._emit('click', e);
                this.scrollToTop();
            };
            b.addEventListener('click', this._onClick);
            (o.container || document.body).appendChild(b);
        }

        _metrics() {
            const s = this._scroller;
            if (s === window) {
                const de = document.documentElement;
                const top = window.pageYOffset || de.scrollTop || (document.body && document.body.scrollTop) || 0;
                const max = Math.max(0, (de.scrollHeight || 0) - (window.innerHeight || de.clientHeight || 0));
                return { top, max };
            }
            return { top: s.scrollTop || 0, max: Math.max(0, (s.scrollHeight || 0) - (s.clientHeight || 0)) };
        }

        _schedule() {
            if (this._raf || this.destroyed) return;
            const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn => setTimeout(fn, 16));
            this._raf = raf(() => { this._raf = null; this.update(); });
        }

        /** Re-read scroll position and refresh visibility + progress. */
        update() {
            if (this.destroyed) return this;
            const m = this._metrics();
            if (this.bar) {
                const p = m.max > 0 ? Math.min(1, Math.max(0, m.top / m.max)) : 0;
                this.bar.setAttribute('stroke-dashoffset', (RING_C * (1 - p)).toFixed(2));
                this.progressValue = p;
            }
            if (m.top > this.options.threshold) this.show(); else this.hide();
            return this;
        }

        show() {
            if (this.destroyed || this.visible) return this;
            this.visible = true;
            this.element.classList.add('chillbacktotop-visible');
            this.element.removeAttribute('aria-hidden');
            this.element.tabIndex = 0;
            if (typeof this.options.onShow === 'function') this.options.onShow(this);
            this._emit('show');
            return this;
        }

        hide() {
            if (this.destroyed || !this.visible) return this;
            this.visible = false;
            this.element.classList.remove('chillbacktotop-visible');
            this.element.setAttribute('aria-hidden', 'true');
            this.element.tabIndex = -1;
            if (typeof this.options.onHide === 'function') this.options.onHide(this);
            this._emit('hide');
            return this;
        }

        scrollToTop() {
            const behavior = reducedMotion() ? 'auto' : this.options.behavior;
            const s = this._scroller;
            try {
                if (typeof s.scrollTo === 'function') s.scrollTo({ top: 0, left: 0, behavior });
                else s.scrollTop = 0;
            } catch (e) {
                try { s.scrollTo(0, 0); } catch (e2) { if (s !== window) s.scrollTop = 0; }
            }
            const ft = this.options.focusTarget;
            const el = typeof ft === 'string' ? document.querySelector(ft) : ft;
            if (el && el.focus) {
                if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
                try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
            } else if (document.activeElement === this.element) {
                this.element.blur();
            }
            return this;
        }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._listeners[evt]) this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : []; return this; }
        _emit(evt, arg) { (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this)); }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this._scroller.removeEventListener('scroll', this._onScroll);
            window.removeEventListener('resize', this._onScroll);
            if (this._raf && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(this._raf); } catch (e) { /* ignore */ } }
            this._raf = null;
            this.element.removeEventListener('click', this._onClick);
            if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
            this._listeners = {};
        }
    }

    function create(options) { return new ChillBackToTopInstance(options); }

    const ChillBackToTop = {
        version: VERSION,
        create,
        init: create,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillBackToTop;
    } else {
        window.ChillBackToTop = ChillBackToTop;
    }

})(typeof window !== 'undefined' ? window : this);
