/**
 * ChillLightbox - Zero-dependency image gallery lightbox
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const lb = ChillLightbox.create({ items: [{ src: 'a.jpg', thumb: 'a-s.jpg', caption: 'Sunset' }, 'b.jpg'] });
 *   lb.open(0);   // lb.next(); lb.prev(); lb.close(); lb.destroy();
 *
 *   // Enhance existing links: <a href="big.jpg" data-chill-lightbox="trip" data-caption="Beach"><img src="small.jpg"></a>
 *   ChillLightbox.init('a[data-chill-lightbox]');       // links with the same attribute value form one gallery
 *
 * Options
 *   items           array of string | { src, thumb, caption, alt, srcset }
 *   startIndex      initial index                                    default 0
 *   loop            wrap around at the ends                          default true
 *   zoom            wheel / dbl-click / pinch / +/- zoom             default true
 *   maxZoom         maximum scale                                    default 4
 *   thumbnails      show thumbnail strip (when > 1 item)             default true
 *   captions        show captions                                    default true
 *   counter         show "2 / 5"                                     default true
 *   swipe           touch swipe left/right = prev/next, down = close default true
 *   preload         neighbours to preload on each side               default 1
 *   closeOnBackdrop click on empty area closes                       default true
 *   lockScroll      lock page scroll while open                      default true
 *   returnFocus     restore focus on close                           default true
 *   destroyOnClose  remove the instance after closing (used by ChillLightbox.open)   default false
 *   onOpen, onClose, onChange(index, item)
 *
 * Instance: { open(i), close(), next(), prev(), goTo(i), zoomIn(), zoomOut(), resetZoom(), setItems(items),
 *             index, isOpen, scale, element, on(evt, fn), off(evt, fn), destroy() }
 * Events: 'open', 'close', 'change'
 * Keyboard: Esc, Left/Right, Home/End, + / - / 0, Tab is trapped inside the dialog.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilllightbox-styles';
    const Z = 10001;
    const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
    let scrollLocks = 0;
    let savedOverflow = '';
    let uid = 0;
    const openStack = [];

    const DARK_VARS = `
        --chilllightbox-backdrop: rgba(0, 0, 0, 0.92);
        --chilllightbox-ui: rgba(255, 255, 255, 0.1);`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chilllightbox-backdrop: rgba(10, 10, 12, 0.88);
        --chilllightbox-ui: rgba(255, 255, 255, 0.12);
        --chilllightbox-ui-hover: rgba(255, 255, 255, 0.24);
        --chilllightbox-text: #ffffff;
        --chilllightbox-primary: #3b82f6;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chilllightbox {
        position: fixed; inset: 0; z-index: ${Z};
        display: flex; flex-direction: column;
        color: var(--chilllightbox-text);
        font-family: inherit; font-size: 14px;
        opacity: 0; transition: opacity 0.2s ease;
      }
      .chilllightbox-open { opacity: 1; }
      .chilllightbox-backdrop { position: absolute; inset: 0; background: var(--chilllightbox-backdrop); }
      .chilllightbox-toolbar {
        position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 12px 16px; flex-shrink: 0;
      }
      .chilllightbox-counter { margin-right: auto; font-variant-numeric: tabular-nums; opacity: 0.85; }
      .chilllightbox-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%;
        background: var(--chilllightbox-ui); color: var(--chilllightbox-text);
        font-size: 20px; line-height: 1; cursor: pointer; font-family: inherit;
        transition: background 0.15s ease;
      }
      .chilllightbox-btn:hover:not(:disabled) { background: var(--chilllightbox-ui-hover); }
      .chilllightbox-btn:focus-visible, .chilllightbox-thumb:focus-visible { outline: 2px solid var(--chilllightbox-primary); outline-offset: 2px; }
      .chilllightbox-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .chilllightbox-stage {
        position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center;
        overflow: hidden; touch-action: none;
      }
      .chilllightbox-img {
        max-width: 100%; max-height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none;
        transform-origin: center center; transition: transform 0.15s ease, opacity 0.2s ease; opacity: 0; will-change: transform;
        cursor: zoom-in;
      }
      .chilllightbox-img.chilllightbox-loaded { opacity: 1; }
      .chilllightbox-img.chilllightbox-zoomed { cursor: grab; }
      .chilllightbox-img.chilllightbox-panning { transition: none; cursor: grabbing; }
      .chilllightbox-loader {
        position: absolute; width: 36px; height: 36px; border-radius: 50%;
        border: 3px solid rgba(255,255,255,0.25); border-top-color: #fff; animation: chilllightbox-spin 0.8s linear infinite;
      }
      .chilllightbox-loader[hidden] { display: none; }
      .chilllightbox-error { position: absolute; padding: 16px; text-align: center; opacity: 0.85; }
      .chilllightbox-error[hidden] { display: none; }
      .chilllightbox-nav { position: absolute; top: 50%; z-index: 3; margin-top: -20px; }
      .chilllightbox-prev { left: 12px; }
      .chilllightbox-next { right: 12px; }
      .chilllightbox-caption {
        position: relative; z-index: 2; flex-shrink: 0; padding: 10px 24px; text-align: center; min-height: 20px; max-height: 20vh; overflow: auto;
      }
      .chilllightbox-caption:empty { display: none; }
      .chilllightbox-thumbs {
        position: relative; z-index: 2; display: flex; gap: 8px; padding: 10px 16px 16px; overflow-x: auto; justify-content: safe center; flex-shrink: 0;
      }
      .chilllightbox-thumbs[hidden] { display: none; }
      .chilllightbox-thumb {
        flex: 0 0 auto; width: 64px; height: 48px; padding: 0; border: 2px solid transparent; border-radius: 6px; overflow: hidden;
        background: var(--chilllightbox-ui); cursor: pointer; opacity: 0.55; transition: opacity 0.15s ease, border-color 0.15s ease;
      }
      .chilllightbox-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .chilllightbox-thumb:hover { opacity: 0.9; }
      .chilllightbox-thumb[aria-current="true"] { opacity: 1; border-color: var(--chilllightbox-primary); }
      .chilllightbox-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; padding: 0; }
      @keyframes chilllightbox-spin { to { transform: rotate(360deg); } }
      @media (max-width: 600px) {
        .chilllightbox-prev { left: 4px; } .chilllightbox-next { right: 4px; }
        .chilllightbox-thumb { width: 52px; height: 40px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chilllightbox, .chilllightbox-img, .chilllightbox-btn, .chilllightbox-thumb { transition: none; }
        .chilllightbox-loader { animation-duration: 2.4s; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function lockScroll() {
        if (scrollLocks++ > 0) return;
        savedOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    function unlockScroll() {
        if (scrollLocks > 0 && --scrollLocks === 0) document.body.style.overflow = savedOverflow;
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function normalise(items) {
        return (items || []).map(it => typeof it === 'string' ? { src: it } : Object.assign({}, it)).filter(it => it && it.src);
    }

    function btn(cls, label, text) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chilllightbox-btn ' + cls;
        b.setAttribute('aria-label', label);
        b.textContent = text;
        return b;
    }

    class ChillLightboxInstance {
        constructor(options) {
            injectCSS();
            this.options = Object.assign({
                items: [], startIndex: 0, loop: true, zoom: true, maxZoom: 4, thumbnails: true, captions: true, counter: true,
                swipe: true, preload: 1, closeOnBackdrop: true, lockScroll: true, returnFocus: true,
                destroyOnClose: false, onOpen: null, onClose: null, onChange: null
            }, options || {});
            this.items = normalise(this.options.items);
            this.index = 0;
            this.isOpen = false;
            this.destroyed = false;
            this.scale = 1; this.tx = 0; this.ty = 0;
            this._listeners = {};
            this._cleanups = [];
            this._timers = [];
            this._preloaded = [];
            this._id = 'chilllightbox-' + (++uid);
            this.element = null;
        }

        // ---- DOM ------------------------------------------------------------------------------
        _build() {
            const o = this.options;
            const root = this.element = document.createElement('div');
            root.className = 'chilllightbox';
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.setAttribute('aria-label', 'Image viewer');
            root.tabIndex = -1;

            const backdrop = document.createElement('div');
            backdrop.className = 'chilllightbox-backdrop';
            root.appendChild(backdrop);

            const toolbar = document.createElement('div');
            toolbar.className = 'chilllightbox-toolbar';
            this.counterEl = document.createElement('div');
            this.counterEl.className = 'chilllightbox-counter';
            this.counterEl.setAttribute('aria-hidden', 'true');
            toolbar.appendChild(this.counterEl);
            if (o.zoom) {
                this.zoomOutBtn = btn('chilllightbox-zoom-out', 'Zoom out', '−');
                this.zoomInBtn = btn('chilllightbox-zoom-in', 'Zoom in', '+');
                this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
                this.zoomInBtn.addEventListener('click', () => this.zoomIn());
                toolbar.appendChild(this.zoomOutBtn);
                toolbar.appendChild(this.zoomInBtn);
            }
            this.closeBtn = btn('chilllightbox-close', 'Close', '×');
            this.closeBtn.addEventListener('click', () => this.close());
            toolbar.appendChild(this.closeBtn);
            root.appendChild(toolbar);

            const stage = this.stage = document.createElement('div');
            stage.className = 'chilllightbox-stage';
            this.img = document.createElement('img');
            this.img.className = 'chilllightbox-img';
            this.img.draggable = false;
            this.loader = document.createElement('div');
            this.loader.className = 'chilllightbox-loader';
            this.loader.setAttribute('aria-hidden', 'true');
            this.errorEl = document.createElement('div');
            this.errorEl.className = 'chilllightbox-error';
            this.errorEl.hidden = true;
            this.errorEl.textContent = 'Image could not be loaded';
            stage.appendChild(this.img);
            stage.appendChild(this.loader);
            stage.appendChild(this.errorEl);

            this.prevBtn = btn('chilllightbox-nav chilllightbox-prev', 'Previous image', '‹');
            this.nextBtn = btn('chilllightbox-nav chilllightbox-next', 'Next image', '›');
            this.prevBtn.addEventListener('click', e => { e.stopPropagation(); this.prev(); });
            this.nextBtn.addEventListener('click', e => { e.stopPropagation(); this.next(); });
            stage.appendChild(this.prevBtn);
            stage.appendChild(this.nextBtn);
            root.appendChild(stage);

            this.captionEl = document.createElement('div');
            this.captionEl.className = 'chilllightbox-caption';
            root.appendChild(this.captionEl);

            this.thumbsEl = document.createElement('div');
            this.thumbsEl.className = 'chilllightbox-thumbs';
            this.thumbsEl.setAttribute('role', 'group');
            this.thumbsEl.setAttribute('aria-label', 'Thumbnails');
            root.appendChild(this.thumbsEl);

            this.live = document.createElement('div');
            this.live.className = 'chilllightbox-sr';
            this.live.setAttribute('aria-live', 'polite');
            root.appendChild(this.live);

            this._buildThumbs();
            this._bindStage(stage, backdrop);
        }

        _buildThumbs() {
            this.thumbsEl.textContent = '';
            this._thumbBtns = [];
            const show = this.options.thumbnails && this.items.length > 1;
            this.thumbsEl.hidden = !show;
            if (!show) return;
            this.items.forEach((it, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chilllightbox-thumb';
                b.setAttribute('aria-label', 'Image ' + (i + 1) + (it.caption ? ': ' + it.caption : ''));
                const im = document.createElement('img');
                im.src = it.thumb || it.src;
                im.alt = '';
                im.loading = 'lazy';
                b.appendChild(im);
                b.addEventListener('click', () => this.goTo(i));
                this.thumbsEl.appendChild(b);
                this._thumbBtns.push(b);
            });
        }

        _bindStage(stage, backdrop) {
            const o = this.options;
            const add = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); this._cleanups.push(() => target.removeEventListener(type, fn, opts)); };

            if (o.closeOnBackdrop) {
                add(stage, 'click', e => { if (e.target === stage) this.close(); });
                add(backdrop, 'click', () => this.close());
            }
            if (o.zoom) {
                add(this.img, 'dblclick', e => {
                    e.preventDefault();
                    if (this.scale > 1) this.resetZoom(); else this._setScale(Math.min(2.5, o.maxZoom));
                });
                add(stage, 'wheel', e => {
                    e.preventDefault();
                    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
                    this._setScale(this.scale * factor);
                }, { passive: false });
            }

            // mouse pan
            let drag = null;
            add(this.img, 'mousedown', e => {
                if (this.scale <= 1 || e.button !== 0) return;
                e.preventDefault();
                drag = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
                this.img.classList.add('chilllightbox-panning');
            });
            add(window, 'mousemove', e => {
                if (!drag) return;
                this.tx = drag.tx + (e.clientX - drag.x);
                this.ty = drag.ty + (e.clientY - drag.y);
                this._clampPan(); this._applyTransform();
            });
            add(window, 'mouseup', () => { if (drag) { drag = null; this.img.classList.remove('chilllightbox-panning'); } });

            // touch: swipe / pan / pinch
            let t0 = null, pinch = null;
            const dist = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
            add(stage, 'touchstart', e => {
                if (e.touches.length === 2 && o.zoom) {
                    pinch = { d: dist(e.touches), s: this.scale }; t0 = null; return;
                }
                if (e.touches.length === 1) t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: this.tx, ty: this.ty, t: Date.now() };
            }, { passive: true });
            add(stage, 'touchmove', e => {
                if (pinch && e.touches.length === 2) { this._setScale(pinch.s * dist(e.touches) / (pinch.d || 1)); return; }
                if (!t0 || e.touches.length !== 1) return;
                if (this.scale > 1) {
                    this.tx = t0.tx + (e.touches[0].clientX - t0.x);
                    this.ty = t0.ty + (e.touches[0].clientY - t0.y);
                    this._clampPan(); this._applyTransform();
                }
            }, { passive: true });
            add(stage, 'touchend', e => {
                if (pinch) { if (!e.touches || e.touches.length < 2) pinch = null; return; }
                if (!t0) return;
                const end = (e.changedTouches && e.changedTouches[0]) || null;
                const start = t0; t0 = null;
                if (!o.swipe || !end || this.scale > 1) return;
                const dx = end.clientX - start.x, dy = end.clientY - start.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? this.next() : this.prev(); }
                else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) this.close();
            });
            add(stage, 'touchcancel', () => { t0 = null; pinch = null; });

            add(this.img, 'load', () => this._onImageLoad(this.img));
            add(this.img, 'error', () => this._onImageError());
        }

        // ---- zoom / pan -------------------------------------------------------------------------
        _setScale(s) {
            if (!this.options.zoom) return this;
            this.scale = Math.min(this.options.maxZoom, Math.max(1, s));
            if (this.scale === 1) { this.tx = 0; this.ty = 0; }
            this._clampPan();
            this._applyTransform();
            return this;
        }
        zoomIn() { return this._setScale(this.scale * 1.4); }
        zoomOut() { return this._setScale(this.scale / 1.4); }
        resetZoom() { return this._setScale(1); }

        _clampPan() {
            if (!this.stage || !this.stage.clientWidth) return; // no layout (e.g. jsdom): do not clamp
            const maxX = Math.max(0, (this.img.offsetWidth * this.scale - this.stage.clientWidth) / 2);
            const maxY = Math.max(0, (this.img.offsetHeight * this.scale - this.stage.clientHeight) / 2);
            this.tx = Math.min(maxX, Math.max(-maxX, this.tx));
            this.ty = Math.min(maxY, Math.max(-maxY, this.ty));
        }

        _applyTransform() {
            if (!this.img) return;
            this.img.style.transform = this.scale === 1 && !this.tx && !this.ty ? '' : 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ')';
            this.img.classList.toggle('chilllightbox-zoomed', this.scale > 1);
            if (this.zoomInBtn) this.zoomInBtn.disabled = this.scale >= this.options.maxZoom;
            if (this.zoomOutBtn) this.zoomOutBtn.disabled = this.scale <= 1;
        }

        // ---- navigation -------------------------------------------------------------------------
        _show(i, silent) {
            const n = this.items.length;
            if (!n) return;
            this.index = i;
            const item = this.items[i];
            this.scale = 1; this.tx = 0; this.ty = 0;
            this._applyTransform();
            this.img.classList.remove('chilllightbox-loaded');
            this.errorEl.hidden = true;
            this.loader.hidden = false;
            this.img.alt = item.alt || item.caption || '';
            if (item.srcset) this.img.setAttribute('srcset', item.srcset); else this.img.removeAttribute('srcset');
            this.img.src = item.src;
            if (this.img.complete && this.img.naturalWidth) this._onImageLoad(this.img);

            this.counterEl.textContent = this.options.counter && n > 1 ? (i + 1) + ' / ' + n : '';
            this.captionEl.textContent = this.options.captions && item.caption ? item.caption : '';
            this.live.textContent = 'Image ' + (i + 1) + ' of ' + n + (item.caption ? ': ' + item.caption : '');
            const canLoop = this.options.loop && n > 1;
            this.prevBtn.hidden = this.nextBtn.hidden = n < 2;
            this.prevBtn.disabled = !canLoop && i === 0;
            this.nextBtn.disabled = !canLoop && i === n - 1;
            this._thumbBtns.forEach((b, k) => {
                if (k === i) { b.setAttribute('aria-current', 'true'); if (b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' }); }
                else b.removeAttribute('aria-current');
            });
            this._preload(i);
            if (!silent) {
                if (typeof this.options.onChange === 'function') this.options.onChange(i, item, this);
                this._emit('change', { index: i, item });
            }
        }

        _onImageLoad(img) {
            if (img !== this.img) return;
            this.loader.hidden = true;
            this.img.classList.add('chilllightbox-loaded');
        }
        _onImageError() {
            this.loader.hidden = true;
            this.errorEl.hidden = false;
        }

        _preload(i) {
            const n = this.items.length, p = this.options.preload;
            this._preloaded = [];
            if (!p || typeof window.Image !== 'function') return;
            for (let d = 1; d <= p; d++) {
                [i + d, i - d].forEach(k => {
                    const j = this.options.loop ? (k + n) % n : k;
                    if (j < 0 || j >= n || j === i) return;
                    const im = new window.Image();
                    im.src = this.items[j].src;
                    this._preloaded.push(im);
                });
            }
        }

        goTo(i) {
            const n = this.items.length;
            if (!this.isOpen || !n) return this;
            if (this.options.loop) i = ((i % n) + n) % n; else i = Math.min(n - 1, Math.max(0, i));
            if (i === this.index && this.img.getAttribute('src')) return this;
            this._show(i);
            return this;
        }
        next() { return this.goTo(this.index + 1); }
        prev() { return this.goTo(this.index - 1); }

        setItems(items) {
            this.items = normalise(items);
            if (this.isOpen) { this._buildThumbs(); this._show(Math.min(this.index, Math.max(0, this.items.length - 1)), true); }
            return this;
        }

        // ---- open / close -------------------------------------------------------------------------
        _onKeydown(e) {
            if (openStack[openStack.length - 1] !== this) return;
            switch (e.key) {
                case 'Escape': e.preventDefault(); e.stopPropagation(); this.close(); break;
                case 'ArrowLeft': e.preventDefault(); this.prev(); break;
                case 'ArrowRight': e.preventDefault(); this.next(); break;
                case 'Home': e.preventDefault(); this.goTo(0); break;
                case 'End': e.preventDefault(); this.goTo(this.items.length - 1); break;
                case '+': case '=': if (this.options.zoom) { e.preventDefault(); this.zoomIn(); } break;
                case '-': case '_': if (this.options.zoom) { e.preventDefault(); this.zoomOut(); } break;
                case '0': if (this.options.zoom) { e.preventDefault(); this.resetZoom(); } break;
                case 'Tab': {
                    const items = Array.prototype.filter.call(this.element.querySelectorAll(FOCUSABLE), el => !el.hidden && !el.disabled);
                    if (!items.length) { e.preventDefault(); this.element.focus(); break; }
                    const first = items[0], last = items[items.length - 1], a = document.activeElement;
                    if (e.shiftKey && (a === first || a === this.element || !this.element.contains(a))) { e.preventDefault(); last.focus(); }
                    else if (!e.shiftKey && (a === last || !this.element.contains(a))) { e.preventDefault(); first.focus(); }
                    break;
                }
                default:
            }
        }

        open(index) {
            if (this.destroyed || !this.items.length) return this;
            if (this.isOpen) { if (typeof index === 'number') this.goTo(index); return this; }
            if (!this.element) this._build();
            this._prevFocus = document.activeElement;
            document.body.appendChild(this.element);
            this.isOpen = true;
            openStack.push(this);
            this.element.style.zIndex = String(Z + openStack.length - 1);
            if (this.options.lockScroll) { lockScroll(); this._locked = true; }
            this._keyHandler = e => this._onKeydown(e);
            document.addEventListener('keydown', this._keyHandler, true);
            const start = typeof index === 'number' ? index : this.options.startIndex;
            this._show(Math.min(this.items.length - 1, Math.max(0, start || 0)), true);
            const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn => setTimeout(fn, 16));
            this._raf = raf(() => { this._raf = null; this.element.classList.add('chilllightbox-open'); });
            try { this.closeBtn.focus({ preventScroll: true }); } catch (e) { this.closeBtn.focus(); }
            if (typeof this.options.onOpen === 'function') this.options.onOpen(this);
            this._emit('open');
            if (typeof this.options.onChange === 'function') this.options.onChange(this.index, this.items[this.index], this);
            this._emit('change', { index: this.index, item: this.items[this.index] });
            return this;
        }

        _teardownOpen() {
            const i = openStack.indexOf(this);
            if (i >= 0) openStack.splice(i, 1);
            if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler, true); this._keyHandler = null; }
            if (this._raf && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(this._raf); } catch (e) { /* ignore */ } }
            this._raf = null;
            if (this._locked) { unlockScroll(); this._locked = false; }
            this._preloaded = [];
        }

        close() {
            if (!this.isOpen) return this;
            this.isOpen = false;
            this._teardownOpen();
            this.element.classList.remove('chilllightbox-open');
            const finish = () => { if (!this.isOpen && this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element); };
            if (reducedMotion()) finish(); else this._timers.push(setTimeout(finish, 210));
            const prev = this._prevFocus; this._prevFocus = null;
            if (this.options.returnFocus && prev && prev.focus && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
            if (typeof this.options.onClose === 'function') this.options.onClose(this);
            this._emit('close');
            if (this.options.destroyOnClose) this._timers.push(setTimeout(() => this.destroy(), 220));
            return this;
        }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._listeners[evt]) this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : []; return this; }
        _emit(evt, arg) { (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this)); }

        destroy() {
            if (this.destroyed) return;
            const wasOpen = this.isOpen;
            this.destroyed = true;
            this.isOpen = false;
            this._teardownOpen();
            this._timers.forEach(clearTimeout); this._timers = [];
            this._cleanups.forEach(fn => fn()); this._cleanups = [];
            if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
            if (wasOpen && this.options.returnFocus && this._prevFocus && this._prevFocus.focus && document.contains(this._prevFocus)) {
                try { this._prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            }
            this._listeners = {};
            if (this.img) { this.img.removeAttribute('src'); }
            this.element = null;
        }
    }

    function create(options) { return new ChillLightboxInstance(options); }

    /** Enhance links/images. Elements sharing the same data-chill-lightbox value are one gallery. */
    function init(selector, options) {
        injectCSS();
        const els = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []);
        const groups = {};
        els.forEach(el => {
            const key = el.getAttribute('data-chill-lightbox') || '__default';
            (groups[key] = groups[key] || []).push(el);
        });
        const handles = [];
        Object.keys(groups).forEach(key => {
            const list = groups[key];
            const items = list.map(el => {
                const img = el.tagName === 'IMG' ? el : el.querySelector('img');
                const src = el.getAttribute('data-src') || el.getAttribute('href') || (img && (img.getAttribute('data-src') || img.currentSrc || img.getAttribute('src'))) || '';
                return {
                    src,
                    thumb: img ? (img.getAttribute('src') || undefined) : undefined,
                    caption: el.getAttribute('data-caption') || el.getAttribute('title') || (img && img.getAttribute('alt')) || '',
                    alt: img ? img.getAttribute('alt') || '' : ''
                };
            });
            const lb = new ChillLightboxInstance(Object.assign({}, options, { items }));
            list.forEach((el, i) => {
                const onClick = e => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); lb.open(i); };
                el.addEventListener('click', onClick);
                handles.push(() => el.removeEventListener('click', onClick));
            });
            handles.push(() => lb.destroy());
            groups[key] = lb;
        });
        return {
            galleries: groups,
            destroy() { handles.forEach(fn => fn()); handles.length = 0; }
        };
    }

    const ChillLightbox = {
        version: VERSION,
        create,
        init,
        open(items, index, options) { return create(Object.assign({}, options, { items, destroyOnClose: true })).open(index || 0); },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillLightbox;
    } else {
        window.ChillLightbox = ChillLightbox;
    }

})(typeof window !== 'undefined' ? window : this);
