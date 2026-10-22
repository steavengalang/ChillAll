/**
 * ChillReveal - Scroll-reveal animations (fade / slide / zoom, stagger, once)
 *
 * @example
 *   <div data-chill-reveal="slide-up">...</div>
 *   <li data-chill-reveal="fade" data-chill-reveal-delay="200">...</li>
 *   const r = ChillReveal.init('[data-chill-reveal]', { stagger: 80, once: true, threshold: 0.2 });
 *   r.refresh();   // after adding more elements   r.destroy();
 *
 * Content stays fully visible without JavaScript: the hidden start state is only applied once ChillReveal runs. With
 * `prefers-reduced-motion: reduce` (or without IntersectionObserver) elements are shown immediately, no movement.
 *
 * Animations: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' (aliases: 'zoom', 'up', 'down')
 * Per-element attributes: data-chill-reveal="<animation>", data-chill-reveal-delay (ms), data-chill-reveal-duration (ms),
 *   data-chill-reveal-distance (px), data-chill-reveal-once ("true"/"false").
 *
 * Options:
 *   animation   string   'slide-up'   default animation when the attribute is empty
 *   duration    number   600          ms
 *   delay       number   0            ms
 *   distance    number   24           px travelled by slide animations
 *   easing      string   'cubic-bezier(0.22, 1, 0.36, 1)'
 *   stagger     number   0            extra ms per element revealed in the same batch (document order)
 *   threshold   number   0.15         visible fraction needed to trigger
 *   rootMargin  string   '0px 0px -5% 0px'
 *   once        boolean  true         false = hide again when scrolled out, animate again on re-entry
 *   onReveal(el, instance), onHide(el, instance)
 *
 * Instance: elements, reveal(el?), hide(el?), refresh(), destroy() (restores elements to their original state).
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillreveal_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillreveal-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillreveal-styles';
        style.textContent = `
      .chillreveal {
        opacity: 0;
        transform: var(--chillreveal-from, none);
        transition: opacity var(--chillreveal-duration, 600ms) var(--chillreveal-easing, ease) var(--chillreveal-delay, 0ms),
                    transform var(--chillreveal-duration, 600ms) var(--chillreveal-easing, ease) var(--chillreveal-delay, 0ms);
        will-change: opacity, transform;
      }
      .chillreveal.chillreveal-visible { opacity: 1; transform: none; }
      .chillreveal.chillreveal-done { will-change: auto; }
      .chillreveal-slide-up    { --chillreveal-from: translate3d(0, var(--chillreveal-distance, 24px), 0); }
      .chillreveal-slide-down  { --chillreveal-from: translate3d(0, calc(var(--chillreveal-distance, 24px) * -1), 0); }
      .chillreveal-slide-left  { --chillreveal-from: translate3d(var(--chillreveal-distance, 24px), 0, 0); }
      .chillreveal-slide-right { --chillreveal-from: translate3d(calc(var(--chillreveal-distance, 24px) * -1), 0, 0); }
      .chillreveal-zoom-in     { --chillreveal-from: scale(0.92); }
      .chillreveal-zoom-out    { --chillreveal-from: scale(1.08); }
      @media (prefers-reduced-motion: reduce) {
        .chillreveal, .chillreveal.chillreveal-visible { opacity: 1; transform: none; transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    const ALIASES = { zoom: 'zoom-in', up: 'slide-up', down: 'slide-down', left: 'slide-left', right: 'slide-right', 'fade-up': 'slide-up', 'fade-down': 'slide-down' };
    const KNOWN = ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out'];

    function normAnim(a, dflt) {
        a = String(a || '').trim().toLowerCase();
        if (ALIASES[a]) a = ALIASES[a];
        return KNOWN.indexOf(a) > -1 ? a : dflt;
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function num(v, dflt) { const n = parseFloat(v); return isNaN(n) ? dflt : n; }

    class ChillRevealInstance {
        constructor(selector, options) {
            options = options || {};
            if (selector && typeof selector === 'object' && !selector.nodeType && selector.length === undefined) { options = selector; selector = null; }
            this.selector = selector || '[data-chill-reveal]';
            this.o = {
                animation: normAnim(options.animation, 'slide-up'),
                duration: num(options.duration, 600),
                delay: num(options.delay, 0),
                distance: num(options.distance, 24),
                easing: options.easing || 'cubic-bezier(0.22, 1, 0.36, 1)',
                stagger: num(options.stagger, 0),
                threshold: options.threshold != null ? num(options.threshold, 0.15) : 0.15,
                rootMargin: options.rootMargin || '0px 0px -5% 0px',
                once: options.once !== false,
                onReveal: options.onReveal || null,
                onHide: options.onHide || null
            };
            this.elements = [];
            this._records = new Map();
            this._io = null;
            this._destroyed = false;
            injectCSS();
            this._instant = reducedMotion() || typeof window.IntersectionObserver !== 'function';
            if (!this._instant) {
                const self = this;
                this._io = new window.IntersectionObserver(function (entries) { self._onIntersect(entries); },
                    { threshold: this.o.threshold, rootMargin: this.o.rootMargin });
            }
            this.refresh();
        }

        _find() {
            const s = this.selector;
            if (typeof s === 'string') return Array.prototype.slice.call(document.querySelectorAll(s));
            if (s && s.nodeType) return [s];
            return Array.prototype.slice.call(s || []);
        }

        refresh() {
            if (this._destroyed) return this;
            const self = this;
            this._find().forEach(function (el) {
                if (self._records.has(el)) return;
                const attr = el.getAttribute('data-chill-reveal');
                const rec = {
                    cls: el.getAttribute('class'),
                    style: el.getAttribute('style'),
                    anim: normAnim(attr, self.o.animation),
                    once: el.hasAttribute('data-chill-reveal-once') ? el.getAttribute('data-chill-reveal-once') !== 'false' : self.o.once,
                    visible: false
                };
                self._records.set(el, rec);
                self.elements.push(el);
                if (self._instant) {
                    self._show(el, rec, 0, true);
                } else {
                    el.classList.add('chillreveal', 'chillreveal-' + rec.anim);
                    el.style.setProperty('--chillreveal-duration', num(el.getAttribute('data-chill-reveal-duration'), self.o.duration) + 'ms');
                    el.style.setProperty('--chillreveal-distance', num(el.getAttribute('data-chill-reveal-distance'), self.o.distance) + 'px');
                    el.style.setProperty('--chillreveal-easing', self.o.easing);
                    self._io.observe(el);
                }
            });
            return this;
        }

        _delayFor(el, index) {
            return num(el.getAttribute('data-chill-reveal-delay'), this.o.delay) + index * this.o.stagger;
        }

        _onIntersect(entries) {
            const self = this;
            const entering = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
            // document order for a natural stagger
            entering.sort(function (a, b) {
                if (a === b) return 0;
                const pos = a.compareDocumentPosition(b);
                return pos & 4 ? -1 : (pos & 2 ? 1 : 0); // 4 = b follows a
            });
            entering.forEach(function (el, i) {
                const rec = self._records.get(el);
                if (!rec || rec.visible) return;
                self._show(el, rec, self._delayFor(el, i), false);
            });
            entries.forEach(function (e) {
                if (e.isIntersecting) return;
                const rec = self._records.get(e.target);
                if (rec && rec.visible && !rec.once) self._hide(e.target, rec);
            });
        }

        _show(el, rec, delay, instant) {
            rec.visible = true;
            if (!instant) {
                el.style.setProperty('--chillreveal-delay', delay + 'ms');
                el.classList.add('chillreveal-visible');
            }
            el.setAttribute('data-chill-revealed', 'true');
            if (rec.once && this._io && !instant) {
                this._io.unobserve(el);
                const dur = num(el.getAttribute('data-chill-reveal-duration'), this.o.duration);
                rec.doneTimer = setTimeout(function () { rec.doneTimer = null; el.classList.add('chillreveal-done'); }, dur + delay + 50);
            }
            if (this.o.onReveal) { try { this.o.onReveal(el, this); } catch (e) { /* ignore */ } }
        }

        _hide(el, rec) {
            rec.visible = false;
            el.style.setProperty('--chillreveal-delay', '0ms');
            el.classList.remove('chillreveal-visible', 'chillreveal-done');
            el.removeAttribute('data-chill-revealed');
            if (this.o.onHide) { try { this.o.onHide(el, this); } catch (e) { /* ignore */ } }
        }

        /** Reveal one element (or all) immediately. */
        reveal(el) {
            const self = this;
            const list = el ? [el] : this.elements.slice();
            list.forEach(function (e, i) {
                const rec = self._records.get(e);
                if (rec && !rec.visible) self._show(e, rec, self.o.stagger * i, self._instant);
            });
            return this;
        }

        /** Reset one element (or all) to the hidden state so it can animate again. */
        hide(el) {
            const self = this;
            const list = el ? [el] : this.elements.slice();
            list.forEach(function (e) {
                const rec = self._records.get(e);
                if (!rec || self._instant) return;
                if (rec.doneTimer) { clearTimeout(rec.doneTimer); rec.doneTimer = null; }
                if (rec.visible) self._hide(e, rec);
                if (self._io) self._io.observe(e);
            });
            return this;
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            if (this._io) { this._io.disconnect(); this._io = null; }
            const self = this;
            this._records.forEach(function (rec, el) {
                if (rec.doneTimer) clearTimeout(rec.doneTimer);
                if (rec.cls === null) el.removeAttribute('class'); else el.setAttribute('class', rec.cls);
                if (rec.style === null) el.removeAttribute('style'); else el.setAttribute('style', rec.style);
                el.removeAttribute('data-chill-revealed');
            });
            this._records.clear();
            this.elements = [];
        }
    }

    const ChillReveal = {
        version: VERSION,
        Reveal: ChillRevealInstance,
        init(selector, options) { return new ChillRevealInstance(selector, options); },
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillReveal; }
    else { window.ChillReveal = ChillReveal; }
})(typeof window !== 'undefined' ? window : this);
