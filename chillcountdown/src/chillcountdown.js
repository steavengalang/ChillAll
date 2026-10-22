/**
 * ChillCountdown - Zero-dependency countdown / timer / stopwatch
 *
 * @example
 *   const cd = ChillCountdown.create({
 *     target: '2030-01-01T00:00:00Z',            // Date | timestamp (ms) | ISO string   -> counts DOWN to it
 *     onTick: (remainingMs, parts) => {},
 *     onComplete: () => alert('Happy new year')
 *   });
 *   document.body.appendChild(cd.element);
 *   ChillCountdown.create({ duration: 90 * 1000, units: ['minutes', 'seconds'], variant: 'inline' });   // 01:30
 *   ChillCountdown.create({ countUp: true });                                                          // stopwatch
 *
 * Options
 *   target       Date | number | string - absolute moment to count to (or from, with countUp)   default null
 *   duration     ms - relative timer (pause/resume really stops the clock)                        default null
 *   countUp      count elapsed time up instead of down (target = start moment, duration = limit)   default false
 *   units        subset of ['days','hours','minutes','seconds'] (largest unit absorbs the rest)    default all four
 *   labels       { days, hours, minutes, seconds } captions                                       default English
 *   showLabels   show captions under the numbers                                                  default true
 *   variant      'boxes' | 'inline'  (inline renders 01:02:03:04)                                 default 'boxes'
 *   size         'sm' | 'md' | 'lg'                                                               default 'md'
 *   pad          zero-pad width                                                                   default 2
 *   interval     ms between ticks                                                                 default 1000
 *   autoStart    start immediately                                                                default true
 *   now          () => ms clock (inject for tests / server-synced time)                            default Date.now
 *   ariaLabel    label prefix of the timer                                                        default 'Countdown' ('Timer' for countUp)
 *   onTick(valueMs, parts)  onComplete()
 *
 * Methods: start(), pause(), resume(), reset(), setTarget(target), setDuration(ms), getRemaining() (ms, or elapsed when countUp),
 *          getParts(), isRunning(), isComplete(), tick(), on(evt, fn), off(evt, fn), destroy()
 * Events:  'tick' (valueMs, parts), 'complete', 'pause', 'resume', 'start'
 * Note: in `target` mode pause() only freezes the display/callbacks; on resume() the real clock is used again.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcountdown-styles';
    const ALL = ['days', 'hours', 'minutes', 'seconds'];
    const SIZES = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcountdown-bg: #f3f4f6;
        --chillcountdown-text: #171717;
        --chillcountdown-muted: #6b7280;
        --chillcountdown-border: #e5e5e5;
        --chillcountdown-accent: #3b82f6;
        --chillcountdown-done: #22c55e;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillcountdown-bg: #262626;
          --chillcountdown-text: #fafafa;
          --chillcountdown-muted: #a3a3a3;
          --chillcountdown-border: #404040;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillcountdown-bg: #262626;
        --chillcountdown-text: #fafafa;
        --chillcountdown-muted: #a3a3a3;
        --chillcountdown-border: #404040;
      }

      .chillcountdown { display: inline-flex; align-items: flex-start; gap: 8px; color: var(--chillcountdown-text); font-family: inherit; font-size: 14px; line-height: 1.2; box-sizing: border-box; }
      .chillcountdown *, .chillcountdown *::before, .chillcountdown *::after { box-sizing: border-box; }
      .chillcountdown:focus-visible { outline: 2px solid var(--chillcountdown-accent); outline-offset: 2px; border-radius: 8px; }
      .chillcountdown-unit { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 64px; padding: 10px 8px; background: var(--chillcountdown-bg); border: 1px solid var(--chillcountdown-border); border-radius: 8px; }
      .chillcountdown-value { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
      .chillcountdown-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; color: var(--chillcountdown-muted); }
      .chillcountdown-sm .chillcountdown-unit { min-width: 48px; padding: 6px 6px; }
      .chillcountdown-sm .chillcountdown-value { font-size: 20px; }
      .chillcountdown-lg .chillcountdown-unit { min-width: 84px; padding: 14px 10px; }
      .chillcountdown-lg .chillcountdown-value { font-size: 40px; }
      .chillcountdown-inline { gap: 0; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; align-items: baseline; }
      .chillcountdown-inline .chillcountdown-unit { min-width: 0; padding: 0; background: none; border: 0; flex-direction: row; gap: 2px; }
      .chillcountdown-inline .chillcountdown-unit + .chillcountdown-unit::before { content: ":"; margin: 0 2px; color: var(--chillcountdown-muted); }
      .chillcountdown-inline .chillcountdown-value { font-size: inherit; }
      .chillcountdown-inline .chillcountdown-label { font-size: 11px; text-transform: lowercase; letter-spacing: 0; }
      .chillcountdown-inline.chillcountdown-sm { font-size: 15px; }
      .chillcountdown-inline.chillcountdown-lg { font-size: 30px; }
      .chillcountdown-complete .chillcountdown-value { color: var(--chillcountdown-done); }
      .chillcountdown-paused .chillcountdown-value { opacity: .6; }
      .chillcountdown-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      @media (prefers-reduced-motion: reduce) { .chillcountdown * { transition: none; animation: none; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function toMs(v) {
        if (v == null || v === '') return null;
        if (typeof v === 'number') return isFinite(v) ? v : null;
        if (Object.prototype.toString.call(v) === '[object Date]') { const t = v.getTime(); return isNaN(t) ? null : t; }
        const t = new Date(v).getTime();
        return isNaN(t) ? null : t;
    }

    class ChillCountdownInstance {
        constructor(options, host) {
            injectCSS();
            const o = this.options = Object.assign({
                target: null, duration: null, countUp: false, units: ALL.slice(), labels: {}, showLabels: true,
                variant: 'boxes', size: 'md', pad: 2, interval: 1000, autoStart: true, now: null, ariaLabel: null,
                onTick: null, onComplete: null
            }, options || {});
            o.labels = Object.assign({ days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }, o.labels);
            const u = (Array.isArray(o.units) ? o.units : ALL).filter(x => SIZES[x]);
            o.units = ALL.filter(x => u.indexOf(x) >= 0);
            if (!o.units.length) o.units = ALL.slice();
            if (!(o.interval > 0)) o.interval = 1000;
            this._id = ++uid;
            this._handlers = {};
            this._timer = null;
            this._destroyed = false;
            this._running = false;
            this._complete = false;
            this._lastMinute = null;
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this._build();
            this._init();
            this.tick(true);
            if (o.autoStart) this.start(true);
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...a) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, a)); }
        _now() { const f = this.options.now; return typeof f === 'function' ? f() : Date.now(); }

        _init() {
            const o = this.options;
            this._target = toMs(o.target);
            this._duration = toMs(o.duration);
            this._remaining = this._duration;   // for duration (down) mode
            this._elapsed = 0;                  // for duration/none (up) mode
            this._startedAt = null;
            this._complete = false;
        }

        _build() {
            const o = this.options, root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = (this._prevClass + ' chillcountdown chillcountdown-' + o.variant + ' chillcountdown-' + o.size).trim();
            root.setAttribute('role', 'timer');
            root.setAttribute('aria-live', 'off');
            root.setAttribute('aria-atomic', 'true');
            if (!root.hasAttribute('tabindex')) { root.tabIndex = 0; this._setTab = true; }
            this._cells = {};
            o.units.forEach(name => {
                const unit = document.createElement('span');
                unit.className = 'chillcountdown-unit chillcountdown-' + name;
                const val = document.createElement('span');
                val.className = 'chillcountdown-value';
                val.setAttribute('aria-hidden', 'true');
                unit.appendChild(val);
                if (o.showLabels) {
                    const lab = document.createElement('span');
                    lab.className = 'chillcountdown-label';
                    lab.setAttribute('aria-hidden', 'true');
                    lab.textContent = String(o.labels[name]);
                    unit.appendChild(lab);
                }
                root.appendChild(unit);
                this._cells[name] = val;
            });
            this._sr = document.createElement('span');
            this._sr.className = 'chillcountdown-sr';
            this._sr.setAttribute('role', 'status');
            this._sr.setAttribute('aria-live', 'polite');
            root.appendChild(this._sr);
        }

        /* ---------- value ---------- */
        /** Remaining ms (down) or elapsed ms (up). */
        getRemaining() {
            const o = this.options;
            const now = this._now();
            const live = this._running && this._startedAt != null;
            if (!o.countUp) {
                if (this._duration != null) return Math.max(0, this._remaining - (live ? now - this._startedAt : 0));
                if (this._target != null) return Math.max(0, (this._frozen != null ? this._frozen : this._target - now));
                return 0;
            }
            let el;
            if (this._target != null && this._duration == null) el = this._frozen != null ? this._frozen : now - this._target;
            else el = this._elapsed + (live ? now - this._startedAt : 0);
            el = Math.max(0, el);
            return this._duration != null ? Math.min(el, this._duration) : el;
        }

        getParts(ms) {
            if (ms == null) ms = this.getRemaining();
            const up = this.options.countUp;
            let total = up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
            const parts = {};
            this.options.units.forEach(name => {
                const size = SIZES[name];
                parts[name] = Math.floor(total / size);
                total -= parts[name] * size;
            });
            return parts;
        }

        _pad(n) { return String(n).padStart(this.options.pad, '0'); }

        _render(parts, ms) {
            this.options.units.forEach(name => { this._cells[name].textContent = this._pad(parts[name]); });
            const desc = this.options.units.map(n => parts[n] + ' ' + (parts[n] === 1 ? this.options.labels[n].replace(/s$/i, '') : this.options.labels[n]).toLowerCase()).join(' ');
            const prefix = this.options.ariaLabel || (this.options.countUp ? 'Timer' : 'Countdown');
            this.element.setAttribute('aria-label', prefix + ': ' + desc + (this.options.countUp ? ' elapsed' : ' remaining'));
            // announce politely once per minute and when finished
            const minute = Math.floor(ms / 60000);
            if (this._lastMinute !== minute) {
                if (this._lastMinute !== null) this._sr.textContent = desc;
                this._lastMinute = minute;
            }
        }

        /** Re-evaluate the clock, repaint and fire callbacks. Called by the internal timer; safe to call manually. */
        tick(silent) {
            if (this._destroyed) return this;
            const ms = this.getRemaining();
            const parts = this.getParts(ms);
            this._render(parts, ms);
            const o = this.options;
            const done = o.countUp ? (this._duration != null && ms >= this._duration) : (this._duration != null || this._target != null) && ms <= 0;
            if (!silent && this._running) {
                if (typeof o.onTick === 'function') o.onTick(ms, parts);
                this._emit('tick', ms, parts);
            }
            if (done && !this._complete) {
                this._complete = true;
                this._running = false;
                this._startedAt = null;
                clearTimeout(this._timer); this._timer = null;
                this.element.classList.add('chillcountdown-complete');
                this.element.classList.remove('chillcountdown-paused');
                this._sr.textContent = 'Finished';
                if (typeof o.onComplete === 'function') o.onComplete();
                this._emit('complete');
            } else if (this._running) this._schedule(ms);
            return this;
        }

        _schedule(ms) {
            clearTimeout(this._timer);
            const iv = this.options.interval;
            const rem = this.options.countUp ? iv - (ms % iv) : (ms % iv || iv);
            this._timer = setTimeout(() => { this._timer = null; this.tick(); }, Math.max(10, Math.min(iv, rem)));
        }

        /* ---------- control ---------- */
        start(silent) {
            if (this._destroyed || this._running || this._complete) return this;
            this._running = true;
            this._startedAt = this._now();
            this._frozen = null;
            this.element.classList.remove('chillcountdown-paused');
            if (!silent) this._emit('start');
            this.tick(true);
            return this;
        }

        pause() {
            if (!this._running) return this;
            const ms = this.getRemaining();
            if (this._duration != null) {
                if (this.options.countUp) this._elapsed = ms; else this._remaining = ms;
            } else if (this._target != null) {
                this._frozen = ms; // display frozen at this value
            } else this._elapsed = ms;
            this._running = false;
            this._startedAt = null;
            clearTimeout(this._timer); this._timer = null;
            this.element.classList.add('chillcountdown-paused');
            this._emit('pause');
            return this;
        }

        resume() {
            if (this._running || this._complete || this._destroyed) return this;
            this._frozen = null;
            this._running = true;
            this._startedAt = this._now();
            this.element.classList.remove('chillcountdown-paused');
            this._emit('resume');
            this.tick(true);
            return this;
        }

        reset() {
            clearTimeout(this._timer); this._timer = null;
            const was = this._running;
            this._running = false;
            this._frozen = null;
            this._init();
            this._lastMinute = null;
            this.element.classList.remove('chillcountdown-complete', 'chillcountdown-paused');
            this.tick(true);
            if (was || this.options.autoStart) this.start(true);
            return this;
        }

        setTarget(target) {
            this.options.target = target; this.options.duration = null;
            return this.reset();
        }
        setDuration(ms) {
            this.options.duration = ms; this.options.target = null;
            return this.reset();
        }
        isRunning() { return this._running; }
        isComplete() { return this._complete; }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            clearTimeout(this._timer); this._timer = null;
            this._running = false;
            this._handlers = {};
            const root = this.element;
            if (this._ownsElement) { if (root.parentNode) root.parentNode.removeChild(root); return; }
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = this._prevClass;
            ['role', 'aria-live', 'aria-atomic', 'aria-label'].forEach(a => root.removeAttribute(a));
            if (this._setTab) root.removeAttribute('tabindex');
        }
    }

    const ChillCountdown = {
        version: VERSION,
        create(options) { return new ChillCountdownInstance(options); },
        /** Enhance an element; data-target (date) or data-duration (ms) seed the options. */
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const opts = Object.assign({}, options);
            if (opts.target == null && host.getAttribute('data-target')) opts.target = host.getAttribute('data-target');
            if (opts.duration == null && host.getAttribute('data-duration')) opts.duration = Number(host.getAttribute('data-duration'));
            return new ChillCountdownInstance(opts, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCountdown;
    } else {
        window.ChillCountdown = ChillCountdown;
    }

})(typeof window !== 'undefined' ? window : this);
