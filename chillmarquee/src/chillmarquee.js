/**
 * ChillMarquee - Zero-dependency Infinite Ticker Component
 *
 * Seamless, GPU-friendly marquee (CSS transform animation) with cloned groups, pause on hover/focus,
 * four directions, live item updates, play()/pause() and reduced-motion support
 * (falls back to a static, scrollable list).
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const m = ChillMarquee.create({
 *     items: ['Alpha', 'Beta', document.createElement('img')],
 *     speed: 80, direction: 'left', pauseOnHover: true, gap: 32, parent: document.body
 *   });
 *   m.pause(); m.play(); m.setItems(['New', 'Items']); m.append('More'); m.destroy();
 *
 *   ChillMarquee.init('.logos', { speed: 40 });   // turns the element's children into marquee items
 *
 * Options
 * | option          | default     | description                                                             |
 * |-----------------|-------------|-------------------------------------------------------------------------|
 * | items           | []          | strings (textContent), Nodes, or any value if renderItem is given       |
 * | renderItem      | null        | (item, index) => Node | string(text)                                    |
 * | html            | false       | treat string items as HTML (trusted content only)                       |
 * | speed           | 60          | pixels per second                                                       |
 * | direction       | 'left'      | 'left' | 'right' | 'up' | 'down'                                        |
 * | pauseOnHover    | true        | pause while hovered or focused within                                   |
 * | gap             | 24          | px between items (also the seam between loops)                          |
 * | height          | null        | vertical mode viewport height (px number or CSS length), default 240px  |
 * | fade            | false       | soft fade-out at both edges                                             |
 * | autoplay        | true        | start animating immediately                                             |
 * | reducedMotion   | 'auto'      | 'auto' (follow prefers-reduced-motion) | 'static' (always) | 'ignore'   |
 * | controls        | false       | render a visible pause/play button (WCAG 2.2.2)                         |
 * | ariaLabel       | 'Scrolling content' | accessible name of the region                                   |
 * | className       | ''          | extra class names                                                       |
 * | parent          | null        | element/selector to append to                                           |
 * | onPlay / onPause| null        | () => void                                                              |
 *
 * Instance: element, trackEl, setItems(items), append(items), setSpeed(n), setDirection(d), setGap(n),
 *           setPauseOnHover(b), play(), pause(), toggle(), isPlaying(), isStatic(), refresh(), on/off, destroy()
 * Events: 'play', 'pause', 'update' ({ items }), 'static' ({ static }), 'destroy'
 * Clones are aria-hidden + inert, so screen readers and Tab order only see the first copy of each item.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillmarquee-styles';
    const DIRECTIONS = ['left', 'right', 'up', 'down'];
    const DEFAULTS = {
        items: [], renderItem: null, html: false, speed: 60, direction: 'left', pauseOnHover: true, gap: 24,
        height: null, fade: false, autoplay: true, reducedMotion: 'auto', controls: false,
        ariaLabel: 'Scrolling content', className: '', parent: null, onPlay: null, onPause: null
    };
    const MAX_COPIES = 40;

    const CSS = `
:root {
  --chillmarquee-primary: #3b82f6;
  --chillmarquee-bg: transparent;
  --chillmarquee-text: inherit;
  --chillmarquee-border: #e5e5e5;
  --chillmarquee-btn-bg: #ffffff;
  --chillmarquee-btn-text: #171717;
  --chillmarquee-fade: #000;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) {
    --chillmarquee-border: #404040;
    --chillmarquee-btn-bg: #262626;
    --chillmarquee-btn-text: #fafafa;
  }
}
:root[data-theme="dark"], :root.dark {
  --chillmarquee-border: #404040;
  --chillmarquee-btn-bg: #262626;
  --chillmarquee-btn-text: #fafafa;
}

.chillmarquee {
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
  background: var(--chillmarquee-bg);
  color: var(--chillmarquee-text);
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  border-radius: 8px;
}
.chillmarquee *, .chillmarquee *::before, .chillmarquee *::after { box-sizing: border-box; }
.chillmarquee:focus-visible { outline: 2px solid var(--chillmarquee-primary); outline-offset: 2px; }
.chillmarquee-vertical { height: var(--chillmarquee-height, 240px); }

.chillmarquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: chillmarquee-scroll var(--chillmarquee-duration, 20s) linear infinite;
  animation-play-state: running;
}
.chillmarquee-vertical .chillmarquee-track { flex-direction: column; width: 100%; height: max-content; }
.chillmarquee-reverse .chillmarquee-track { animation-direction: reverse; }
.chillmarquee-paused .chillmarquee-track { animation-play-state: paused; }
.chillmarquee-hover-pause:hover .chillmarquee-track,
.chillmarquee-hover-pause:focus-within .chillmarquee-track { animation-play-state: paused; }

@keyframes chillmarquee-scroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--chillmarquee-x, 0), var(--chillmarquee-y, 0), 0); }
}

.chillmarquee-group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--chillmarquee-gap, 24px);
  padding-right: var(--chillmarquee-gap, 24px);
}
.chillmarquee-vertical .chillmarquee-group { flex-direction: column; align-items: stretch; padding-right: 0; padding-bottom: var(--chillmarquee-gap, 24px); }
.chillmarquee-item { flex: 0 0 auto; white-space: nowrap; }
.chillmarquee-vertical .chillmarquee-item { white-space: normal; }

.chillmarquee-fade { -webkit-mask-image: linear-gradient(to right, transparent, var(--chillmarquee-fade) 8%, var(--chillmarquee-fade) 92%, transparent); mask-image: linear-gradient(to right, transparent, var(--chillmarquee-fade) 8%, var(--chillmarquee-fade) 92%, transparent); }
.chillmarquee-fade.chillmarquee-vertical { -webkit-mask-image: linear-gradient(to bottom, transparent, var(--chillmarquee-fade) 12%, var(--chillmarquee-fade) 88%, transparent); mask-image: linear-gradient(to bottom, transparent, var(--chillmarquee-fade) 12%, var(--chillmarquee-fade) 88%, transparent); }

/* static (reduced motion): no animation, no clones, scrollable */
.chillmarquee-static { overflow: auto; }
.chillmarquee-static .chillmarquee-track { animation: none; transform: none; }
.chillmarquee-static .chillmarquee-clone { display: none; }

.chillmarquee-btn {
  position: absolute; top: 6px; right: 6px; z-index: 1;
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 32px; min-height: 32px; padding: 0 10px;
  font: inherit; font-size: 13px; font-weight: 500; line-height: 1;
  color: var(--chillmarquee-btn-text); background: var(--chillmarquee-btn-bg);
  border: 1px solid var(--chillmarquee-border); border-radius: 8px; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.chillmarquee-btn:hover { border-color: var(--chillmarquee-primary); }
.chillmarquee-btn:focus-visible { outline: 2px solid var(--chillmarquee-primary); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .chillmarquee:not(.chillmarquee-ignore-motion) { overflow: auto; }
  .chillmarquee:not(.chillmarquee-ignore-motion) .chillmarquee-track { animation: none; transform: none; }
  .chillmarquee:not(.chillmarquee-ignore-motion) .chillmarquee-clone { display: none; }
  .chillmarquee-btn { transition: none; }
}
`;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function isNode(v) { return !!v && typeof v === 'object' && typeof v.nodeType === 'number'; }
    function num(v, fallback, min) {
        v = Number(v);
        if (!isFinite(v)) return fallback;
        return min != null ? Math.max(min, v) : v;
    }

    class ChillMarqueeInstance {
        constructor(options, source) {
            const o = this.options = Object.assign({}, DEFAULTS, options || {});
            o.items = Array.isArray(o.items) ? o.items.slice() : [];
            if (DIRECTIONS.indexOf(o.direction) < 0) o.direction = 'left';
            o.speed = num(o.speed, 60, 1);
            o.gap = num(o.gap, 24, 0);
            this._listeners = {};
            this._destroyed = false;
            this._playing = !!o.autoplay;
            this._copies = 2;
            this._source = source || null;
            this._reducedQuery = null;
            this._reducedHandler = null;
            this._ro = null;
            this._sourceNodes = null;
            injectCSS();
            this._build();
        }

        _isVertical() { return this.options.direction === 'up' || this.options.direction === 'down'; }

        _build() {
            const o = this.options;
            const root = document.createElement('div');
            this.element = root;
            root.setAttribute('role', 'region');
            root.setAttribute('aria-label', String(o.ariaLabel));
            root.setAttribute('aria-roledescription', 'marquee');
            const track = document.createElement('div');
            track.className = 'chillmarquee-track';
            this.trackEl = track;
            root.appendChild(track);

            if (this._source) {
                // adopt children of an existing element as items
                this._sourceNodes = Array.prototype.slice.call(this._source.childNodes);
                if (!o.items.length) {
                    o.items = this._sourceNodes.filter(n => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())).map(n => (n.nodeType === 1 ? n : n.textContent.trim()));
                }
            }

            this._setupReducedMotion();
            this._renderGroups();
            this._applyState();

            if (o.controls) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillmarquee-btn';
                b.addEventListener('click', this._onBtn = () => this.toggle());
                root.appendChild(b);
                this._btn = b;
                this._updateButton();
            }

            if (this._source && this._source.parentNode) {
                this._sourceParent = this._source.parentNode;
                this._sourceParent.insertBefore(root, this._source);
                this._sourceParent.removeChild(this._source);
            } else if (o.parent) {
                const p = typeof o.parent === 'string' ? document.querySelector(o.parent) : o.parent;
                if (p) p.appendChild(root);
            }

            if (typeof window.ResizeObserver === 'function') {
                this._ro = new window.ResizeObserver(() => { if (!this._destroyed) this._layout(); });
                this._ro.observe(root);
                if (this._group) this._ro.observe(this._group);
            }
            this._layout();
        }

        _setupReducedMotion() {
            const mode = this.options.reducedMotion;
            this._reduced = false;
            if (mode === 'static') { this._reduced = true; return; }
            if (mode === 'ignore') return;
            if (typeof window.matchMedia === 'function') {
                try {
                    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
                    this._reducedQuery = q;
                    this._reduced = !!q.matches;
                    this._reducedHandler = (e) => {
                        if (this._destroyed) return;
                        const next = !!(e && typeof e.matches === 'boolean' ? e.matches : q.matches);
                        if (next === this._reduced) return;
                        this._reduced = next;
                        this._renderGroups();
                        this._applyState();
                        this._layout();
                        this._emit('static', { static: next, marquee: this });
                    };
                    if (typeof q.addEventListener === 'function') q.addEventListener('change', this._reducedHandler);
                    else if (typeof q.addListener === 'function') q.addListener(this._reducedHandler);
                } catch (e) { /* ignore */ }
            }
        }

        _makeItem(item, index, clone) {
            const o = this.options;
            const el = document.createElement('div');
            el.className = 'chillmarquee-item';
            let content = item;
            if (typeof o.renderItem === 'function') content = o.renderItem(item, index);
            if (isNode(content)) el.appendChild(clone ? content.cloneNode(true) : content);
            else if (content != null) {
                if (o.html && typeof item === 'string' && typeof o.renderItem !== 'function') el.innerHTML = String(content);
                else el.textContent = String(content);
            }
            return el;
        }

        _buildGroup(clone) {
            const g = document.createElement('div');
            g.className = 'chillmarquee-group' + (clone ? ' chillmarquee-clone' : '');
            if (clone) { g.setAttribute('aria-hidden', 'true'); g.setAttribute('inert', ''); }
            else g.setAttribute('role', 'list');
            this.options.items.forEach((item, i) => {
                const el = this._makeItem(item, i, clone);
                if (!clone) el.setAttribute('role', 'listitem');
                g.appendChild(el);
            });
            return g;
        }

        _renderGroups() {
            const track = this.trackEl;
            if (this._ro && this._group) { try { this._ro.unobserve(this._group); } catch (e) { /* ignore */ } }
            while (track.firstChild) track.removeChild(track.firstChild);
            this._group = this._buildGroup(false);
            track.appendChild(this._group);
            this._clones = [];
            if (!this._reduced) this._setCopies(this._copies);
            if (this._ro && this._group) { try { this._ro.observe(this._group); } catch (e) { /* ignore */ } }
        }

        _setCopies(total) {
            // total = number of groups incl. original
            total = Math.max(2, Math.min(MAX_COPIES, total));
            this._copies = total;
            while (this._clones.length < total - 1) {
                const c = this._buildGroup(true);
                this.trackEl.appendChild(c);
                this._clones.push(c);
            }
            while (this._clones.length > total - 1) {
                const c = this._clones.pop();
                if (c.parentNode) c.parentNode.removeChild(c);
            }
        }

        _applyState() {
            const o = this.options;
            const root = this.element;
            const vertical = this._isVertical();
            const cls = ['chillmarquee', vertical ? 'chillmarquee-vertical' : 'chillmarquee-horizontal'];
            if (o.direction === 'right' || o.direction === 'down') cls.push('chillmarquee-reverse');
            if (o.fade) cls.push('chillmarquee-fade');
            if (o.pauseOnHover) cls.push('chillmarquee-hover-pause');
            if (!this._playing) cls.push('chillmarquee-paused');
            if (this._reduced) cls.push('chillmarquee-static');
            if (o.reducedMotion === 'ignore') cls.push('chillmarquee-ignore-motion');
            if (o.className) String(o.className).split(/\s+/).filter(Boolean).forEach(c => cls.push(c));
            root.className = cls.join(' ');
            root.style.setProperty('--chillmarquee-gap', o.gap + 'px');
            if (vertical) {
                const h = o.height;
                if (h != null && h !== '') root.style.setProperty('--chillmarquee-height', typeof h === 'number' ? h + 'px' : String(h).replace(/[^\w.%() +\-*\/]/g, ''));
                else root.style.removeProperty('--chillmarquee-height');
            } else {
                root.style.removeProperty('--chillmarquee-height');
            }
            if (this._reduced) root.setAttribute('tabindex', '0'); else root.removeAttribute('tabindex');
        }

        _measure() {
            const g = this._group;
            const root = this.element;
            const v = this._isVertical();
            const size = g ? (v ? g.offsetHeight : g.offsetWidth) : 0;
            const view = v ? root.clientHeight : root.clientWidth;
            return { size: size || 0, view: view || 0 };
        }

        _layout() {
            if (this._destroyed) return;
            const o = this.options;
            if (this._reduced) { this._updateButton(); return; }
            const m = this._measure();
            let total = 2;
            if (m.size > 0 && m.view > 0) total = Math.ceil(m.view / m.size) + 1;
            if (!o.items.length) total = 2;
            if (total !== this._copies || this._clones.length !== this._copies - 1) this._setCopies(total);
            const pct = (100 / this._copies).toFixed(5) + '%';
            const st = this.element.style;
            if (this._isVertical()) { st.setProperty('--chillmarquee-y', '-' + pct); st.removeProperty('--chillmarquee-x'); }
            else { st.setProperty('--chillmarquee-x', '-' + pct); st.removeProperty('--chillmarquee-y'); }
            // one group (of size px) must scroll per cycle: duration = size / speed
            const size = m.size > 0 ? m.size : (o.items.length || 1) * (100 + o.gap); // estimate when unmeasurable (no layout)
            const seconds = size / o.speed;
            st.setProperty('--chillmarquee-duration', Math.max(0.5, seconds).toFixed(3) + 's');
            this._updateButton();
        }

        _updateButton() {
            if (!this._btn) return;
            this._btn.hidden = this._reduced;
            this._btn.textContent = this._playing ? 'Pause' : 'Play';
            this._btn.setAttribute('aria-pressed', this._playing ? 'false' : 'true');
            this._btn.setAttribute('aria-label', this._playing ? 'Pause scrolling' : 'Resume scrolling');
        }

        setItems(items) {
            if (this._destroyed) return this;
            this.options.items = Array.isArray(items) ? items.slice() : [];
            this._renderGroups();
            this._layout();
            this._emit('update', { items: this.options.items.slice(), marquee: this });
            return this;
        }

        append(items) {
            const add = Array.isArray(items) ? items : [items];
            return this.setItems(this.options.items.concat(add));
        }

        getItems() { return this.options.items.slice(); }

        setSpeed(speed) { this.options.speed = num(speed, this.options.speed, 1); this._layout(); return this; }

        setDirection(direction) {
            if (DIRECTIONS.indexOf(direction) < 0) return this;
            this.options.direction = direction;
            this._renderGroups();
            this._applyState();
            this._layout();
            return this;
        }

        setGap(gap) { this.options.gap = num(gap, this.options.gap, 0); this._applyState(); this._layout(); return this; }

        setPauseOnHover(on) { this.options.pauseOnHover = !!on; this._applyState(); return this; }

        play() {
            if (this._destroyed || this._playing) return this;
            this._playing = true;
            this._applyState();
            this._updateButton();
            this._emit('play', { marquee: this });
            if (typeof this.options.onPlay === 'function') this.options.onPlay();
            return this;
        }

        pause() {
            if (this._destroyed || !this._playing) return this;
            this._playing = false;
            this._applyState();
            this._updateButton();
            this._emit('pause', { marquee: this });
            if (typeof this.options.onPause === 'function') this.options.onPause();
            return this;
        }

        toggle() { return this._playing ? this.pause() : this.play(); }
        isPlaying() { return this._playing && !this._reduced; }
        isStatic() { return this._reduced; }
        refresh() { this._layout(); return this; }

        on(event, fn) {
            if (typeof fn !== 'function') return this;
            (this._listeners[event] = this._listeners[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._listeners[event];
            if (!l) return this;
            if (!fn) delete this._listeners[event]; else this._listeners[event] = l.filter(f => f !== fn);
            return this;
        }

        _emit(event, detail) {
            (this._listeners[event] || []).slice().forEach(fn => {
                try { fn(detail); } catch (err) { if (typeof console !== 'undefined') console.error(err); }
            });
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._emit('destroy', { marquee: this });
            if (this._ro) { this._ro.disconnect(); this._ro = null; }
            if (this._reducedQuery && this._reducedHandler) {
                if (typeof this._reducedQuery.removeEventListener === 'function') this._reducedQuery.removeEventListener('change', this._reducedHandler);
                else if (typeof this._reducedQuery.removeListener === 'function') this._reducedQuery.removeListener(this._reducedHandler);
            }
            if (this._btn && this._onBtn) this._btn.removeEventListener('click', this._onBtn);
            const el = this.element;
            if (this._source && this._sourceParent) {
                // hand the original children back to the source element
                while (this._source.firstChild) this._source.removeChild(this._source.firstChild);
                (this._sourceNodes || []).forEach(n => this._source.appendChild(n));
                this._sourceParent.insertBefore(this._source, el);
            }
            if (el.parentNode) el.parentNode.removeChild(el);
            this._listeners = {};
        }
    }

    const ChillMarquee = {
        version: VERSION,

        create(options) {
            return new ChillMarqueeInstance(options);
        },

        /** Element -> single instance; selector/list -> array. The element's children become the items. */
        init(selectorOrElement, options) {
            if (typeof document === 'undefined') return null;
            if (isNode(selectorOrElement)) return new ChillMarqueeInstance(options, selectorOrElement);
            let list = [];
            if (typeof selectorOrElement === 'string') list = Array.prototype.slice.call(document.querySelectorAll(selectorOrElement));
            else if (selectorOrElement && typeof selectorOrElement.length === 'number') list = Array.prototype.slice.call(selectorOrElement);
            return list.map(el => new ChillMarqueeInstance(options, el));
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillMarquee;
    } else {
        window.ChillMarquee = ChillMarquee;
    }

})(typeof window !== 'undefined' ? window : this);
