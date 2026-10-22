/**
 * ChillTour - Zero-dependency onboarding product tour (spotlight + step popover)
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const tour = ChillTour.create({
 *     steps: [
 *       { title: 'Welcome', content: 'Let us show you around.' },                      // no target = centred
 *       { target: '#search', title: 'Search', content: 'Find anything.', placement: 'bottom' },
 *       { target: '.avatar', title: 'Profile', content: 'Your account lives here.' }
 *     ],
 *     onFinish: (completed) => console.log(completed ? 'done' : 'skipped')
 *   });
 *   tour.start();   // tour.next(); tour.prev(); tour.goTo(2); tour.skip(); tour.finish(); tour.destroy();
 *
 * Tour options
 *   steps          array (see below)
 *   padding        spotlight padding around target (px)           default 8
 *   radius         spotlight corner radius (px)                   default 8
 *   showProgress   "2 of 5" + dots                                default true
 *   showSkip       show Skip button                               default true
 *   showClose      show x button                                  default true
 *   closeOnEsc     Esc skips the tour                             default true
 *   closeOnOverlay click on dimmed area skips                     default false
 *   keyboard       ArrowLeft/ArrowRight navigate                  default true
 *   once           don't start again once finished/skipped (uses storageKey)   default false
 *   storageKey     localStorage key for `once`                    default 'chilltour-seen'
 *   labels         { next, prev, skip, finish, close, step: 'Step {n} of {total}' }
 *   html           allow HTML in step title/content strings       default false (you must sanitize)
 *   onStart, onStep(index, step), onFinish(completed), onSkip
 * Step options
 *   target         selector | Element | function returning one; omit for a centred step
 *   title, content text (or Element for content)
 *   placement      'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center'     default 'auto'
 *   padding        override spotlight padding for this step
 *   interactive    let the user click through to the page while this step is shown   default false
 *   nextLabel, prevLabel
 *   onEnter(step, tour), onExit(step, tour)
 *
 * Instance: { start(i), next(), prev(), goTo(i), skip(), finish(), destroy(), isActive, index, steps, on(evt, fn), off(evt, fn) }
 * Events: 'start', 'step', 'finish', 'skip', 'end'
 * Static: ChillTour.create, ChillTour.start(steps, opts), ChillTour.hasSeen(key), ChillTour.reset(key)
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilltour-styles';
    const Z_SPOT = 10005;
    const Z_POP = 10006;
    const FOCUSABLE = 'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    let uid = 0;

    const DARK_VARS = `
        --chilltour-bg: #1f1f1f;
        --chilltour-text: #fafafa;
        --chilltour-muted: #a3a3a3;
        --chilltour-border: #333333;
        --chilltour-hover: #2d2d2d;
        --chilltour-dim: rgba(0, 0, 0, 0.72);
        --chilltour-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chilltour-bg: #ffffff;
        --chilltour-text: #171717;
        --chilltour-muted: #6b7280;
        --chilltour-border: #e5e5e5;
        --chilltour-hover: #f3f4f6;
        --chilltour-primary: #3b82f6;
        --chilltour-primary-hover: #2563eb;
        --chilltour-dim: rgba(15, 23, 42, 0.6);
        --chilltour-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chilltour-blocker { position: fixed; inset: 0; z-index: ${Z_SPOT - 1}; background: transparent; }
      .chilltour-spotlight {
        position: fixed; z-index: ${Z_SPOT}; pointer-events: none;
        box-shadow: 0 0 0 9999px var(--chilltour-dim);
        border-radius: 8px;
        transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease, opacity 0.2s ease;
      }
      .chilltour-spotlight-none { width: 0 !important; height: 0 !important; box-shadow: 0 0 0 9999px var(--chilltour-dim); }
      .chilltour-popover {
        position: fixed; z-index: ${Z_POP}; box-sizing: border-box;
        width: 340px; max-width: calc(100vw - 24px);
        background: var(--chilltour-bg); color: var(--chilltour-text);
        border: 1px solid var(--chilltour-border); border-radius: 12px; box-shadow: var(--chilltour-shadow);
        padding: 16px 18px 14px; font-family: inherit; font-size: 14px; line-height: 1.5; outline: none;
        transition: top 0.25s ease, left 0.25s ease, opacity 0.2s ease; opacity: 0;
      }
      .chilltour-popover.chilltour-visible { opacity: 1; }
      .chilltour-title { margin: 0 28px 6px 0; font-size: 16px; font-weight: 600; line-height: 1.35; }
      .chilltour-content { color: var(--chilltour-muted); margin: 0; word-wrap: break-word; }
      .chilltour-close {
        position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 8px;
        background: transparent; color: var(--chilltour-muted); font-size: 20px; line-height: 1; cursor: pointer; font-family: inherit;
      }
      .chilltour-close:hover { background: var(--chilltour-hover); color: var(--chilltour-text); }
      .chilltour-footer { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
      .chilltour-progress { margin-right: auto; font-size: 12px; color: var(--chilltour-muted); display: flex; align-items: center; gap: 8px; }
      .chilltour-dots { display: inline-flex; gap: 4px; }
      .chilltour-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--chilltour-border); transition: background 0.2s ease, transform 0.2s ease; }
      .chilltour-dot-active { background: var(--chilltour-primary); transform: scale(1.3); }
      .chilltour-btn {
        min-height: 32px; padding: 4px 14px; border-radius: 8px; border: 1px solid var(--chilltour-border);
        background: transparent; color: var(--chilltour-text); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
        transition: background 0.15s ease;
      }
      .chilltour-btn:hover:not(:disabled) { background: var(--chilltour-hover); }
      .chilltour-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .chilltour-btn-primary { background: var(--chilltour-primary); border-color: var(--chilltour-primary); color: #fff; }
      .chilltour-btn-primary:hover:not(:disabled) { background: var(--chilltour-primary-hover); border-color: var(--chilltour-primary-hover); }
      .chilltour-btn-skip { border-color: transparent; color: var(--chilltour-muted); padding-left: 6px; padding-right: 6px; }
      .chilltour-btn:focus-visible, .chilltour-close:focus-visible { outline: 2px solid var(--chilltour-primary); outline-offset: 2px; }
      .chilltour-arrow {
        position: absolute; width: 12px; height: 12px; background: var(--chilltour-bg);
        border: 1px solid var(--chilltour-border); transform: rotate(45deg);
      }
      .chilltour-arrow[data-side="top"] { bottom: -7px; border-top: 0; border-left: 0; }
      .chilltour-arrow[data-side="bottom"] { top: -7px; border-bottom: 0; border-right: 0; }
      .chilltour-arrow[data-side="left"] { right: -7px; border-bottom: 0; border-left: 0; }
      .chilltour-arrow[data-side="right"] { left: -7px; border-top: 0; border-right: 0; }
      .chilltour-arrow[data-side="center"] { display: none; }
      .chilltour-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; padding: 0; }
      @media (prefers-reduced-motion: reduce) {
        .chilltour-spotlight, .chilltour-popover, .chilltour-dot, .chilltour-btn { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function storageGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
    function storageSet(key, v) { try { window.localStorage.setItem(key, v); } catch (e) { /* ignore */ } }
    function storageDel(key) { try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } }

    function resolveTarget(t) {
        if (!t) return null;
        if (typeof t === 'function') t = t();
        if (typeof t === 'string') { try { return document.querySelector(t); } catch (e) { return null; } }
        return t && t.nodeType === 1 ? t : null;
    }

    function setContent(el, value, html) {
        el.textContent = '';
        if (value == null || value === '') return;
        if (value.nodeType) el.appendChild(value);
        else if (html) el.innerHTML = String(value);
        else el.textContent = String(value);
    }

    class ChillTourInstance {
        constructor(options) {
            injectCSS();
            const o = this.options = Object.assign({
                steps: [], padding: 8, radius: 8, showProgress: true, showSkip: true, showClose: true, closeOnEsc: true,
                closeOnOverlay: false, keyboard: true, once: false, storageKey: 'chilltour-seen', html: false,
                onStart: null, onStep: null, onFinish: null, onSkip: null
            }, options || {});
            o.labels = Object.assign({ next: 'Next', prev: 'Back', skip: 'Skip', finish: 'Done', close: 'Close tour', step: 'Step {n} of {total}' }, (options && options.labels) || {});
            this.steps = (o.steps || []).slice();
            this.index = -1;
            this.isActive = false;
            this.destroyed = false;
            this._listeners = {};
            this._timers = [];
            this._id = 'chilltour-' + (++uid);
        }

        // ---- DOM -----------------------------------------------------------------------------------
        _mount() {
            const o = this.options;
            this.blocker = document.createElement('div');
            this.blocker.className = 'chilltour-blocker';
            this.blocker.addEventListener('click', this._onBlockerClick = () => { if (o.closeOnOverlay) this.skip(); });

            this.spot = document.createElement('div');
            this.spot.className = 'chilltour-spotlight';
            this.spot.style.borderRadius = o.radius + 'px';

            const pop = this.pop = document.createElement('div');
            pop.className = 'chilltour-popover';
            pop.setAttribute('role', 'dialog');
            pop.setAttribute('aria-modal', 'false');
            pop.tabIndex = -1;

            this.arrow = document.createElement('div');
            this.arrow.className = 'chilltour-arrow';
            this.arrow.setAttribute('aria-hidden', 'true');
            pop.appendChild(this.arrow);

            this.titleEl = document.createElement('h2');
            this.titleEl.className = 'chilltour-title';
            this.titleEl.id = this._id + '-title';
            this.contentEl = document.createElement('div');
            this.contentEl.className = 'chilltour-content';
            this.contentEl.id = this._id + '-desc';
            pop.setAttribute('aria-labelledby', this.titleEl.id);
            pop.setAttribute('aria-describedby', this.contentEl.id);
            pop.appendChild(this.titleEl);
            pop.appendChild(this.contentEl);

            if (o.showClose) {
                this.closeBtn = document.createElement('button');
                this.closeBtn.type = 'button';
                this.closeBtn.className = 'chilltour-close';
                this.closeBtn.setAttribute('aria-label', o.labels.close);
                this.closeBtn.textContent = '×';
                this.closeBtn.addEventListener('click', () => this.skip());
                pop.appendChild(this.closeBtn);
            }

            const footer = document.createElement('div');
            footer.className = 'chilltour-footer';
            this.progressEl = document.createElement('div');
            this.progressEl.className = 'chilltour-progress';
            this.progressText = document.createElement('span');
            this.progressDots = document.createElement('span');
            this.progressDots.className = 'chilltour-dots';
            this.progressDots.setAttribute('aria-hidden', 'true');
            this.progressEl.appendChild(this.progressText);
            this.progressEl.appendChild(this.progressDots);
            footer.appendChild(this.progressEl);
            if (!o.showProgress) this.progressEl.style.display = 'none';

            if (o.showSkip) {
                this.skipBtn = document.createElement('button');
                this.skipBtn.type = 'button';
                this.skipBtn.className = 'chilltour-btn chilltour-btn-skip';
                this.skipBtn.textContent = o.labels.skip;
                this.skipBtn.addEventListener('click', () => this.skip());
                footer.appendChild(this.skipBtn);
            }
            this.prevBtn = document.createElement('button');
            this.prevBtn.type = 'button';
            this.prevBtn.className = 'chilltour-btn chilltour-btn-prev';
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn = document.createElement('button');
            this.nextBtn.type = 'button';
            this.nextBtn.className = 'chilltour-btn chilltour-btn-primary chilltour-btn-next';
            this.nextBtn.addEventListener('click', () => this.next());
            footer.appendChild(this.prevBtn);
            footer.appendChild(this.nextBtn);
            pop.appendChild(footer);

            this.live = document.createElement('div');
            this.live.className = 'chilltour-sr';
            this.live.setAttribute('aria-live', 'polite');
            pop.appendChild(this.live);

            document.body.appendChild(this.blocker);
            document.body.appendChild(this.spot);
            document.body.appendChild(pop);

            this._onKey = e => this._keydown(e);
            this._onReflow = () => this._scheduleReposition();
            document.addEventListener('keydown', this._onKey, true);
            window.addEventListener('resize', this._onReflow);
            window.addEventListener('scroll', this._onReflow, true);
        }

        _unmount() {
            if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
            if (this._onReflow) {
                window.removeEventListener('resize', this._onReflow);
                window.removeEventListener('scroll', this._onReflow, true);
            }
            this._onKey = this._onReflow = null;
            if (this._raf && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(this._raf); } catch (e) { /* ignore */ } }
            this._raf = null;
            [this.blocker, this.spot, this.pop].forEach(n => { if (n && n.parentNode) n.parentNode.removeChild(n); });
            this.blocker = this.spot = this.pop = null;
        }

        // ---- keyboard ------------------------------------------------------------------------------
        _keydown(e) {
            if (!this.isActive) return;
            const o = this.options;
            if (e.key === 'Escape' && o.closeOnEsc) { e.preventDefault(); e.stopPropagation(); this.skip(); return; }
            if (o.keyboard && !e.altKey && !e.ctrlKey && !e.metaKey) {
                const a = document.activeElement;
                const inField = a && a !== this.pop && !this.pop.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName || '');
                if (!inField) {
                    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); return; }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); return; }
                }
            }
            if (e.key === 'Tab') {
                const items = Array.prototype.filter.call(this.pop.querySelectorAll(FOCUSABLE), el => !el.disabled && el.offsetParent !== null || !el.disabled);
                if (!items.length) { e.preventDefault(); this.pop.focus(); return; }
                const first = items[0], last = items[items.length - 1], a = document.activeElement;
                if (e.shiftKey && (a === first || a === this.pop || !this.pop.contains(a))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (a === last || !this.pop.contains(a))) { e.preventDefault(); first.focus(); }
            }
        }

        // ---- flow ----------------------------------------------------------------------------------
        start(index) {
            if (this.destroyed || this.isActive || !this.steps.length) return this;
            const o = this.options;
            if (o.once && storageGet(o.storageKey)) return this;
            this._prevFocus = document.activeElement;
            this._mount();
            this.isActive = true;
            if (typeof o.onStart === 'function') o.onStart(this);
            this._emit('start');
            this.goTo(typeof index === 'number' ? index : 0);
            return this;
        }

        goTo(i) {
            if (!this.isActive) return this;
            if (i < 0 || i >= this.steps.length) return this;
            const o = this.options;
            const prev = this.steps[this.index];
            if (prev && typeof prev.onExit === 'function') prev.onExit(prev, this);
            this.index = i;
            const step = this.steps[i];
            this._render(step);
            if (typeof step.onEnter === 'function') step.onEnter(step, this);
            if (typeof o.onStep === 'function') o.onStep(i, step, this);
            this._emit('step', { index: i, step });
            return this;
        }

        next() {
            if (!this.isActive) return this;
            if (this.index >= this.steps.length - 1) return this.finish();
            return this.goTo(this.index + 1);
        }
        prev() { return this.isActive && this.index > 0 ? this.goTo(this.index - 1) : this; }

        _render(step) {
            const o = this.options, L = o.labels, n = this.steps.length, i = this.index;
            const pop = this.pop;
            pop.classList.remove('chilltour-visible');
            setContent(this.titleEl, step.title, o.html);
            this.titleEl.style.display = step.title ? '' : 'none';
            setContent(this.contentEl, step.content, o.html);
            this.progressText.textContent = L.step.replace('{n}', i + 1).replace('{total}', n);
            this.progressDots.textContent = '';
            if (n > 1 && n <= 12) for (let k = 0; k < n; k++) {
                const d = document.createElement('span'); d.className = 'chilltour-dot' + (k === i ? ' chilltour-dot-active' : ''); this.progressDots.appendChild(d);
            }
            const last = i === n - 1;
            this.prevBtn.textContent = step.prevLabel || L.prev;
            this.prevBtn.style.display = i === 0 ? 'none' : '';
            this.nextBtn.textContent = step.nextLabel || (last ? L.finish : L.next);
            if (this.skipBtn) this.skipBtn.style.display = last ? 'none' : '';
            this.live.textContent = L.step.replace('{n}', i + 1).replace('{total}', n) + (step.title ? ': ' + step.title : '');

            this.target = resolveTarget(step.target);
            const interactive = !!step.interactive && !!this.target;
            this.blocker.style.pointerEvents = interactive ? 'none' : '';
            if (this.target) {
                if (this.target.scrollIntoView) {
                    try { this.target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); }
                    catch (e) { this.target.scrollIntoView(); }
                }
            }
            this._reposition();
            // second pass after (smooth) scroll settles
            this._timers.forEach(clearTimeout); this._timers = [];
            this._timers.push(setTimeout(() => { if (this.isActive) this._reposition(); }, 320));
            const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn => setTimeout(fn, 16));
            raf(() => { if (this.pop) this.pop.classList.add('chilltour-visible'); });
            try { pop.focus({ preventScroll: true }); } catch (e) { pop.focus(); }
        }

        _scheduleReposition() {
            if (this._raf) return;
            const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn => setTimeout(fn, 16));
            this._raf = raf(() => { this._raf = null; if (this.isActive) this._reposition(); });
        }

        _reposition() {
            if (!this.pop) return;
            const step = this.steps[this.index];
            if (!step) return;
            const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
            const vh = window.innerHeight || document.documentElement.clientHeight || 768;
            const pw = this.pop.offsetWidth || 340, ph = this.pop.offsetHeight || 160;
            const margin = 12, gap = 14;
            const spot = this.spot, pop = this.pop;
            let side = 'center', left, top, arrowPos = null;

            if (this.target && this.target.isConnected !== false) {
                const pad = step.padding != null ? step.padding : this.options.padding;
                const r = this.target.getBoundingClientRect();
                spot.classList.remove('chilltour-spotlight-none');
                spot.style.top = (r.top - pad) + 'px';
                spot.style.left = (r.left - pad) + 'px';
                spot.style.width = (r.width + pad * 2) + 'px';
                spot.style.height = (r.height + pad * 2) + 'px';
                const space = { top: r.top - pad, bottom: vh - r.bottom - pad, left: r.left - pad, right: vw - r.right - pad };
                const need = { top: ph + gap, bottom: ph + gap, left: pw + gap, right: pw + gap };
                const pref = step.placement && step.placement !== 'auto' ? step.placement : null;
                const order = ['bottom', 'top', 'right', 'left'];
                const candidates = pref && pref !== 'center' ? [pref].concat(order.filter(s => s !== pref)) : order;
                if (pref !== 'center') side = candidates.find(s => space[s] >= need[s]) || candidates.slice().sort((a, b) => (space[b] - need[b]) - (space[a] - need[a]))[0];
                if (pref === 'center') side = 'center';
                if (side === 'bottom') { top = r.bottom + pad + gap; left = r.left + r.width / 2 - pw / 2; }
                else if (side === 'top') { top = r.top - pad - gap - ph; left = r.left + r.width / 2 - pw / 2; }
                else if (side === 'right') { left = r.right + pad + gap; top = r.top + r.height / 2 - ph / 2; }
                else if (side === 'left') { left = r.left - pad - gap - pw; top = r.top + r.height / 2 - ph / 2; }
                if (side !== 'center') {
                    left = Math.min(vw - pw - margin, Math.max(margin, left));
                    top = Math.min(vh - ph - margin, Math.max(margin, top));
                    if (side === 'top' || side === 'bottom') arrowPos = { left: Math.min(pw - 24, Math.max(12, r.left + r.width / 2 - left - 6)) };
                    else arrowPos = { top: Math.min(ph - 24, Math.max(12, r.top + r.height / 2 - top - 6)) };
                }
            } else {
                spot.classList.add('chilltour-spotlight-none');
                spot.style.top = '50%'; spot.style.left = '50%'; spot.style.width = '0'; spot.style.height = '0';
            }
            if (side === 'center') { left = (vw - pw) / 2; top = Math.max(margin, (vh - ph) / 2); }
            pop.style.left = Math.round(left) + 'px';
            pop.style.top = Math.round(top) + 'px';
            this.arrow.setAttribute('data-side', side);
            this.arrow.style.left = this.arrow.style.top = '';
            if (arrowPos) { if (arrowPos.left != null) this.arrow.style.left = arrowPos.left + 'px'; if (arrowPos.top != null) this.arrow.style.top = arrowPos.top + 'px'; }
            pop.setAttribute('data-placement', side);
        }

        _end(completed) {
            if (!this.isActive) return;
            const o = this.options;
            const step = this.steps[this.index];
            this.isActive = false;
            if (step && typeof step.onExit === 'function') step.onExit(step, this);
            this._timers.forEach(clearTimeout); this._timers = [];
            this._unmount();
            this.index = -1;
            if (o.once) storageSet(o.storageKey, '1');
            const prev = this._prevFocus; this._prevFocus = null;
            if (prev && prev.focus && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
            if (!completed && typeof o.onSkip === 'function') o.onSkip(this);
            if (typeof o.onFinish === 'function') o.onFinish(completed, this);
            this._emit(completed ? 'finish' : 'skip', completed);
            this._emit('end', completed);
        }

        finish() { this._end(true); return this; }
        skip() { this._end(false); return this; }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._listeners[evt]) this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : []; return this; }
        _emit(evt, arg) { (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this)); }

        destroy() {
            if (this.destroyed) return;
            if (this.isActive) {
                this.isActive = false;
                this._timers.forEach(clearTimeout); this._timers = [];
                this._unmount();
                const prev = this._prevFocus; this._prevFocus = null;
                if (prev && prev.focus && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
            }
            this.destroyed = true;
            this._listeners = {};
        }
    }

    function create(options) { return new ChillTourInstance(options); }

    const ChillTour = {
        version: VERSION,
        create,
        start(steps, options) { return create(Object.assign({}, options, { steps })).start(0); },
        hasSeen(key) { return !!storageGet(key || 'chilltour-seen'); },
        reset(key) { storageDel(key || 'chilltour-seen'); },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTour;
    } else {
        window.ChillTour = ChillTour;
    }

})(typeof window !== 'undefined' ? window : this);
