/**
 * ChillCarousel - Zero-dependency carousel / slider
 *
 * @example
 *   const c = ChillCarousel.create({
 *     slides: ['Slide one', someDomNode, document.querySelector('#hidden-slide')],
 *     loop: true, autoplay: 4000, dots: true, arrows: true,
 *     slidesPerView: 1, breakpoints: { 640: 2, 1024: 3 }, gap: 16
 *   });
 *   document.body.appendChild(c.element);
 *   ChillCarousel.init('#gallery', { dots: true });   // children of #gallery become slides
 *
 * Options
 *   slides         Array<string | Node>  (strings are rendered as text; use `html: true` for HTML)   default []
 *   html           treat string slides as HTML (UNSAFE with untrusted data)                          default false
 *   loop           wrap around at both ends                              default false
 *   autoplay       ms between slides, or false/0 to disable              default false
 *   pauseOnHover   pause autoplay on hover and keyboard focus            default true
 *   slidesPerView  number of slides visible at once                      default 1
 *   breakpoints    { minWidth(px): slidesPerView } (container width)      default null
 *   gap            gap between slides in px                              default 0
 *   dots / arrows  render pagination dots / prev-next buttons            default true / true
 *   swipe          pointer drag + touch swipe                            default true
 *   keyboard       Left/Right/Home/End when the carousel has focus       default true
 *   speed          transition duration ms                                default 350
 *   startIndex     initial page                                          default 0
 *   respectReducedMotion  disable autoplay + animation if the user prefers reduced motion   default true
 *   ariaLabel      label of the carousel region                          default 'Carousel'
 *   onChange(index, prevIndex)
 *
 * Methods: next(), prev(), goTo(index), play(), pause(), setSlides(slides), update(), getIndex(),
 *          getPerView(), on(evt, fn), off(evt, fn), destroy()
 * Events:  'change' (index, prev), 'play', 'pause'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcarousel-styles';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcarousel-bg: #ffffff;
        --chillcarousel-text: #171717;
        --chillcarousel-border: #e5e5e5;
        --chillcarousel-surface: #f3f4f6;
        --chillcarousel-primary: #3b82f6;
        --chillcarousel-control-bg: rgba(255,255,255,.92);
        --chillcarousel-control-fg: #171717;
        --chillcarousel-dot: #d4d4d4;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillcarousel-bg: #171717;
          --chillcarousel-text: #fafafa;
          --chillcarousel-border: #404040;
          --chillcarousel-surface: #262626;
          --chillcarousel-control-bg: rgba(38,38,38,.92);
          --chillcarousel-control-fg: #fafafa;
          --chillcarousel-dot: #525252;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillcarousel-bg: #171717;
        --chillcarousel-text: #fafafa;
        --chillcarousel-border: #404040;
        --chillcarousel-surface: #262626;
        --chillcarousel-control-bg: rgba(38,38,38,.92);
        --chillcarousel-control-fg: #fafafa;
        --chillcarousel-dot: #525252;
      }

      .chillcarousel { position: relative; color: var(--chillcarousel-text); font-size: 14px; font-family: inherit; box-sizing: border-box; }
      .chillcarousel *, .chillcarousel *::before, .chillcarousel *::after { box-sizing: border-box; }
      .chillcarousel:focus-visible { outline: 2px solid var(--chillcarousel-primary); outline-offset: 2px; border-radius: 8px; }
      .chillcarousel-viewport { overflow: hidden; border-radius: 8px; touch-action: pan-y; cursor: grab; }
      .chillcarousel-dragging .chillcarousel-viewport { cursor: grabbing; user-select: none; }
      .chillcarousel-track { display: flex; width: 100%; gap: var(--chillcarousel-gap, 0px); transform: translate3d(0,0,0); transition: transform var(--chillcarousel-speed, 350ms) cubic-bezier(.22,.61,.36,1); will-change: transform; }
      .chillcarousel-dragging .chillcarousel-track { transition: none; }
      .chillcarousel-slide { flex: 0 0 calc((100% - var(--chillcarousel-gap, 0px) * (var(--chillcarousel-per, 1) - 1)) / var(--chillcarousel-per, 1)); min-width: 0; overflow: hidden; border-radius: 8px; }
      .chillcarousel-slide > img { display: block; width: 100%; height: auto; -webkit-user-drag: none; }
      .chillcarousel-text { padding: 48px 24px; text-align: center; background: var(--chillcarousel-surface); border: 1px solid var(--chillcarousel-border); border-radius: 8px; font-size: 18px; }

      .chillcarousel-arrow { position: absolute; top: 50%; z-index: 2; width: 40px; height: 40px; margin-top: -20px; padding: 0; border: 1px solid var(--chillcarousel-border); border-radius: 50%; background: var(--chillcarousel-control-bg); color: var(--chillcarousel-control-fg); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.12); transition: opacity .18s ease, transform .18s ease; }
      .chillcarousel-arrow::before { content: ""; width: 9px; height: 9px; border-left: 2px solid currentColor; border-bottom: 2px solid currentColor; }
      .chillcarousel-prev { left: 8px; }
      .chillcarousel-prev::before { transform: translateX(2px) rotate(45deg); }
      .chillcarousel-next { right: 8px; }
      .chillcarousel-next::before { transform: translateX(-2px) rotate(-135deg); }
      .chillcarousel-arrow:hover:not(:disabled) { transform: scale(1.06); }
      .chillcarousel-arrow:disabled { opacity: .35; cursor: not-allowed; }
      .chillcarousel-arrow:focus-visible, .chillcarousel-dot:focus-visible, .chillcarousel-play:focus-visible { outline: 2px solid var(--chillcarousel-primary); outline-offset: 2px; }

      .chillcarousel-footer { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; }
      .chillcarousel-dots { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; justify-content: center; }
      .chillcarousel-dot { width: 32px; height: 32px; padding: 0; border: 0; background: transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; }
      .chillcarousel-dot::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--chillcarousel-dot); transition: width .18s ease, background .18s ease; }
      .chillcarousel-dot[aria-current="true"]::before { width: 20px; border-radius: 4px; background: var(--chillcarousel-primary); }
      .chillcarousel-play { width: 32px; height: 32px; padding: 0; border: 1px solid var(--chillcarousel-border); border-radius: 50%; background: var(--chillcarousel-bg); color: var(--chillcarousel-text); cursor: pointer; font-size: 11px; line-height: 1; }
      .chillcarousel-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

      @media (prefers-reduced-motion: reduce) {
        .chillcarousel-track, .chillcarousel-arrow, .chillcarousel-dot::before { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    class ChillCarouselInstance {
        constructor(options, host) {
            injectCSS();
            const o = this.options = Object.assign({
                slides: [], html: false, loop: false, autoplay: false, pauseOnHover: true, slidesPerView: 1, breakpoints: null,
                gap: 0, dots: true, arrows: true, swipe: true, keyboard: true, speed: 350, startIndex: 0,
                respectReducedMotion: true, ariaLabel: 'Carousel', onChange: null
            }, options || {});
            this._id = ++uid;
            this._handlers = {};
            this._listeners = [];
            this._timer = null;
            this._destroyed = false;
            this._userPaused = false;
            this._hover = false;
            this._focusIn = false;
            this._hidden = false;
            this._drag = null;
            this._playing = false;
            this.index = 0;
            this.perView = Math.max(1, Math.floor(o.slidesPerView) || 1);
            this._reduced = o.respectReducedMotion && reducedMotion();
            this.element = host || document.createElement('section');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this._origChildren = null;
            this._build();
            this.setSlides(o.slides, o.startIndex);
            this._observe();
            if (o.autoplay && !this._reduced) this.play(true);
        }

        /* ---------- plumbing ---------- */
        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...a) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, a)); }
        _listen(target, evt, fn, opts) { target.addEventListener(evt, fn, opts); this._listeners.push(() => target.removeEventListener(evt, fn, opts)); }

        _build() {
            const o = this.options;
            const root = this.element;
            root.className = (this._prevClass + ' chillcarousel').trim();
            root.setAttribute('role', 'region');
            root.setAttribute('aria-roledescription', 'carousel');
            root.setAttribute('aria-label', o.ariaLabel);
            if (o.keyboard && !root.hasAttribute('tabindex')) { root.tabIndex = 0; this._setTabindex = true; }
            root.style.setProperty('--chillcarousel-gap', (o.gap || 0) + 'px');
            root.style.setProperty('--chillcarousel-speed', (this._reduced ? 0 : o.speed) + 'ms');

            this._viewport = document.createElement('div');
            this._viewport.className = 'chillcarousel-viewport';
            this._track = document.createElement('div');
            this._track.className = 'chillcarousel-track';
            this._track.id = 'chillcarousel-' + this._id + '-track';
            this._track.setAttribute('aria-live', 'off');
            this._viewport.appendChild(this._track);
            root.appendChild(this._viewport);

            if (o.arrows) {
                this._prevBtn = this._arrow('prev', 'Previous slide');
                this._nextBtn = this._arrow('next', 'Next slide');
                root.appendChild(this._prevBtn);
                root.appendChild(this._nextBtn);
            }
            this._footer = document.createElement('div');
            this._footer.className = 'chillcarousel-footer';
            if (o.dots) {
                this._dotsEl = document.createElement('div');
                this._dotsEl.className = 'chillcarousel-dots';
                this._dotsEl.setAttribute('role', 'group');
                this._dotsEl.setAttribute('aria-label', 'Choose slide');
                this._footer.appendChild(this._dotsEl);
                this._listen(this._dotsEl, 'click', (e) => {
                    const b = e.target.closest && e.target.closest('.chillcarousel-dot');
                    if (b) { this._userInteract(); this.goTo(Number(b.getAttribute('data-index'))); }
                });
            }
            if (o.autoplay) {
                this._playBtn = document.createElement('button');
                this._playBtn.type = 'button';
                this._playBtn.className = 'chillcarousel-play';
                this._listen(this._playBtn, 'click', () => {
                    if (this._playing) { this._userPaused = true; this.pause(); } else { this._userPaused = false; this.play(); }
                });
                this._footer.appendChild(this._playBtn);
            }
            if (this._dotsEl || this._playBtn) root.appendChild(this._footer);

            this._live = document.createElement('div');
            this._live.className = 'chillcarousel-sr';
            this._live.setAttribute('aria-live', 'polite');
            this._live.setAttribute('aria-atomic', 'true');
            root.appendChild(this._live);

            if (this._prevBtn) {
                this._listen(this._prevBtn, 'click', () => { this._userInteract(); this.prev(); });
                this._listen(this._nextBtn, 'click', () => { this._userInteract(); this.next(); });
            }
            if (o.keyboard) {
                this._listen(root, 'keydown', (e) => {
                    const t = e.target;
                    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
                    if (e.key === 'ArrowLeft') { this._userInteract(); this.prev(); e.preventDefault(); }
                    else if (e.key === 'ArrowRight') { this._userInteract(); this.next(); e.preventDefault(); }
                    else if (e.key === 'Home') { this._userInteract(); this.goTo(0); e.preventDefault(); }
                    else if (e.key === 'End') { this._userInteract(); this.goTo(this.pageCount() - 1); e.preventDefault(); }
                });
            }
            if (o.pauseOnHover) {
                this._listen(root, 'mouseenter', () => { this._hover = true; this._schedule(); });
                this._listen(root, 'mouseleave', () => { this._hover = false; this._schedule(); });
                this._listen(root, 'focusin', () => { this._focusIn = true; this._schedule(); });
                this._listen(root, 'focusout', (e) => { if (!root.contains(e.relatedTarget)) { this._focusIn = false; this._schedule(); } });
            }
            if (typeof document !== 'undefined') {
                this._listen(document, 'visibilitychange', () => { this._hidden = document.hidden; this._schedule(); });
            }
            if (o.swipe) this._bindDrag();
        }

        _arrow(dir, label) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chillcarousel-arrow chillcarousel-' + dir;
            b.setAttribute('aria-label', label);
            b.setAttribute('aria-controls', 'chillcarousel-' + this._id + '-track');
            return b;
        }

        _bindDrag() {
            const vp = this._viewport;
            const THRESH = 40;
            this._listen(vp, 'pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
                if (e.target.closest && e.target.closest('a,button,input,select,textarea')) return;
                this._drag = { x: e.clientX, dx: 0, id: e.pointerId, moved: false };
                try { vp.setPointerCapture && vp.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            });
            this._listen(vp, 'pointermove', (e) => {
                const d = this._drag; if (!d) return;
                d.dx = e.clientX - d.x;
                if (!d.moved && Math.abs(d.dx) > 5) { d.moved = true; this.element.classList.add('chillcarousel-dragging'); this._userInteract(); }
                if (d.moved) this._applyTransform(d.dx);
            });
            const end = (e) => {
                const d = this._drag; if (!d) return;
                this._drag = null;
                this.element.classList.remove('chillcarousel-dragging');
                try { vp.releasePointerCapture && vp.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
                if (!d.moved) return;
                this._suppressClick = true;
                setTimeout(() => { this._suppressClick = false; }, 0);
                const w = vp.clientWidth || 300;
                if (d.dx <= -Math.min(THRESH, w / 5)) this.next();
                else if (d.dx >= Math.min(THRESH, w / 5)) this.prev();
                else this._applyTransform(0);
            };
            this._listen(vp, 'pointerup', end);
            this._listen(vp, 'pointercancel', end);
            this._listen(vp, 'click', (e) => { if (this._suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
            this._listen(vp, 'dragstart', (e) => e.preventDefault());
        }

        _observe() {
            const root = this.element;
            const recalc = () => this.update();
            if (typeof window.ResizeObserver === 'function') {
                this._ro = new window.ResizeObserver(recalc);
                this._ro.observe(root);
            } else if (window.addEventListener) {
                this._listen(window, 'resize', recalc);
            }
        }

        /* ---------- slides ---------- */
        setSlides(slides, startIndex) {
            const o = this.options;
            while (this._track.firstChild) this._track.removeChild(this._track.firstChild);
            this.slides = [];
            (slides || []).forEach((s) => {
                const wrap = document.createElement('div');
                wrap.className = 'chillcarousel-slide';
                wrap.setAttribute('role', 'group');
                wrap.setAttribute('aria-roledescription', 'slide');
                if (s && typeof s === 'object' && s.nodeType) wrap.appendChild(s);
                else if (o.html) wrap.innerHTML = String(s);
                else { const t = document.createElement('div'); t.className = 'chillcarousel-text'; t.textContent = String(s); wrap.appendChild(t); }
                this._track.appendChild(wrap);
                this.slides.push(wrap);
            });
            const n = this.slides.length;
            this.slides.forEach((w, i) => w.setAttribute('aria-label', (i + 1) + ' of ' + n));
            this._buildDots();
            this.index = 0;
            this.update(startIndex || 0, true);
            return this;
        }

        _computePerView() {
            const o = this.options;
            let per = Math.max(1, Math.floor(o.slidesPerView) || 1);
            if (o.breakpoints) {
                const w = this.element.clientWidth || (window.innerWidth || 0);
                Object.keys(o.breakpoints).map(Number).sort((a, b) => a - b).forEach(bp => { if (w >= bp) per = Math.max(1, Math.floor(o.breakpoints[bp]) || 1); });
            }
            return Math.min(per, Math.max(1, this.slides.length));
        }

        pageCount() { return Math.max(1, this.slides.length - this.perView + 1); }
        getIndex() { return this.index; }
        getPerView() { return this.perView; }

        _buildDots() {
            if (!this._dotsEl) return;
            while (this._dotsEl.firstChild) this._dotsEl.removeChild(this._dotsEl.firstChild);
            this._dots = [];
            const pages = this.pageCount();
            for (let i = 0; i < pages; i++) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillcarousel-dot';
                b.setAttribute('data-index', String(i));
                b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                this._dotsEl.appendChild(b);
                this._dots.push(b);
            }
            this._dotsEl.hidden = pages <= 1;
        }

        /** Recompute responsive layout and re-render state. */
        update(index, silent) {
            if (this._destroyed) return this;
            const per = this._computePerView();
            const changed = per !== this.perView;
            this.perView = per;
            this.element.style.setProperty('--chillcarousel-per', String(per));
            if (changed || !this._dots || this._dots.length !== this.pageCount()) this._buildDots();
            const target = index != null ? index : this.index;
            this.index = Math.max(0, Math.min(target, this.pageCount() - 1));
            this._render();
            if (!silent && changed) this._emit('resize', per);
            return this;
        }

        _applyTransform(dx) {
            const n = this.perView;
            const base = 'calc(' + this.index + ' * -1 * (100% + var(--chillcarousel-gap, 0px)) / ' + n + ')';
            this._track.style.transform = dx ? 'translate3d(calc(' + base + ' + ' + dx + 'px),0,0)' : 'translate3d(' + base + ',0,0)';
        }

        _render() {
            this._applyTransform(0);
            const lo = this.index, hi = this.index + this.perView - 1;
            this.slides.forEach((s, i) => {
                const vis = i >= lo && i <= hi;
                if (vis) { s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); }
                else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('inert', ''); }
                s.classList.toggle('chillcarousel-active', vis);
            });
            if (this._dots) this._dots.forEach((d, i) => { if (i === this.index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
            const last = this.pageCount() - 1;
            if (this._prevBtn) {
                this._prevBtn.disabled = !this.options.loop && this.index <= 0;
                this._nextBtn.disabled = !this.options.loop && this.index >= last;
                const hide = this.pageCount() <= 1;
                this._prevBtn.hidden = hide; this._nextBtn.hidden = hide;
            }
            this._syncPlayBtn();
        }

        _syncPlayBtn() {
            if (!this._playBtn) return;
            this._playBtn.textContent = this._playing ? '❚❚' : '▶';
            this._playBtn.setAttribute('aria-label', this._playing ? 'Pause automatic slide show' : 'Start automatic slide show');
            this._track.setAttribute('aria-live', this._playing ? 'off' : 'polite');
        }

        /* ---------- navigation ---------- */
        goTo(i) {
            if (this._destroyed || !this.slides.length) return this;
            const last = this.pageCount() - 1;
            let t = Math.floor(i);
            if (isNaN(t)) return this;
            if (this.options.loop) t = t > last ? 0 : t < 0 ? last : t;
            else t = Math.max(0, Math.min(t, last));
            if (t === this.index) { this._render(); return this; }
            const prev = this.index;
            this.index = t;
            this._render();
            this._live.textContent = 'Slide ' + (t + 1) + ' of ' + this.pageCount();
            if (typeof this.options.onChange === 'function') this.options.onChange(t, prev);
            this._emit('change', t, prev);
            this._schedule();
            return this;
        }
        next() { return this.goTo(this.index + 1); }
        prev() { return this.goTo(this.index - 1); }

        /* ---------- autoplay ---------- */
        _userInteract() { /* manual navigation keeps autoplay but restarts the timer */ }

        play(silent) {
            if (this._destroyed) return this;
            this._playing = true;
            this._syncPlayBtn();
            this._schedule();
            if (!silent) this._emit('play');
            return this;
        }
        pause() {
            this._playing = false;
            clearTimeout(this._timer); this._timer = null;
            this._syncPlayBtn();
            this._emit('pause');
            return this;
        }
        _schedule() {
            clearTimeout(this._timer); this._timer = null;
            if (this._destroyed || !this._playing || this._hover || this._focusIn || this._hidden) return;
            const ms = Number(this.options.autoplay) || 4000;
            this._timer = setTimeout(() => {
                this._timer = null;
                if (!this.options.loop && this.index >= this.pageCount() - 1) { this.goTo(0); } else this.next();
                this._schedule();
            }, ms);
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            clearTimeout(this._timer);
            this._listeners.forEach(fn => fn());
            this._listeners = [];
            if (this._ro) { this._ro.disconnect(); this._ro = null; }
            this._handlers = {};
            const root = this.element;
            if (this._ownsElement) { if (root.parentNode) root.parentNode.removeChild(root); return; }
            // restore original slides into the host
            while (root.firstChild) root.removeChild(root.firstChild);
            (this._origChildren || []).forEach(n => root.appendChild(n));
            root.className = this._prevClass;
            ['role', 'aria-roledescription', 'aria-label'].forEach(a => root.removeAttribute(a));
            root.style.removeProperty('--chillcarousel-gap');
            root.style.removeProperty('--chillcarousel-speed');
            root.style.removeProperty('--chillcarousel-per');
            if (this._setTabindex) root.removeAttribute('tabindex');
        }
    }

    const ChillCarousel = {
        version: VERSION,
        create(options) { return new ChillCarouselInstance(options); },
        /** Enhance an element: its children become slides (restored on destroy). */
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const kids = Array.prototype.slice.call(host.children);
            const opts = Object.assign({}, options);
            if (!opts.slides) opts.slides = kids;
            kids.forEach(k => host.removeChild(k));
            const inst = new ChillCarouselInstance(opts, host);
            inst._origChildren = kids;
            return inst;
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCarousel;
    } else {
        window.ChillCarousel = ChillCarousel;
    }

})(typeof window !== 'undefined' ? window : this);
