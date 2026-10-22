/**
 * ChillScrollSpy - Scroll-spy / table of contents
 *
 * @example
 *   // 1. Auto-build a TOC from the headings of an article
 *   const toc = ChillScrollSpy.init({ content: '#article', headings: 'h2, h3', container: '#toc', offset: 72 });
 *   // 2. Or enhance an existing nav:  <nav id="menu"><a href="#intro">Intro</a> ...</nav>
 *   ChillScrollSpy.init({ links: '#menu a', offset: 64 });
 *   toc.scrollTo('install'); toc.getActive(); toc.destroy();
 *
 * Active heading = the last heading whose top has passed the `offset` line. Detection uses IntersectionObserver (a thin
 * band at the offset line) with a throttled scroll listener fallback. Active link gets class `chillscrollspy-active`
 * and aria-current="location". Headings without an id receive a unique slug id (removed again on destroy).
 *
 * Options:
 *   content          selector|Element  document.body   where headings are searched
 *   headings         string            'h2, h3'        heading selector (relative to content)
 *   container        selector|Element  null            where the built <nav> is appended; with none, use instance.element
 *   links            selector|Elements null            use existing anchors instead of building a TOC
 *   scrollContainer  selector|Element  window          scrolling element (default: the window)
 *   offset           number (px)       0               distance from the top of the viewport (sticky header height)
 *   smooth           boolean           true            smooth scrolling on click (ignored for reduced motion)
 *   updateHash       boolean           true            history.replaceState with #id on click
 *   activateFirst    boolean           true            highlight the first item before any heading was passed
 *   title            string            ''              optional visible title above the built list
 *   ariaLabel        string            'Table of contents'
 *   activeClass      string            'chillscrollspy-active'
 *   onChange(id, headingEl, instance)
 *
 * Instance: element, refresh() (re-scan after DOM changes), getActive(), setActive(id), scrollTo(id), on('change', fn), destroy().
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillscrollspy_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillscrollspy-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillscrollspy-styles';
        style.textContent = `
      :root {
        --chillscrollspy-text: #6b7280;
        --chillscrollspy-text-hover: #171717;
        --chillscrollspy-active: #3b82f6;
        --chillscrollspy-line: #e5e5e5;
        --chillscrollspy-ring: rgba(59, 130, 246, 0.45);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillscrollspy-text: #a3a3a3; --chillscrollspy-text-hover: #fafafa; --chillscrollspy-line: #333333; --chillscrollspy-active: #60a5fa;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillscrollspy-text: #a3a3a3; --chillscrollspy-text-hover: #fafafa; --chillscrollspy-line: #333333; --chillscrollspy-active: #60a5fa;
      }
      .chillscrollspy { font-size: 14px; line-height: 1.4; }
      .chillscrollspy-title { margin: 0 0 8px; padding-left: 14px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--chillscrollspy-text); }
      .chillscrollspy-list { list-style: none; margin: 0; padding: 0; border-left: 2px solid var(--chillscrollspy-line); }
      .chillscrollspy-item { margin: 0; padding: 0; }
      .chillscrollspy-link {
        display: block; padding: 6px 14px; margin-left: -2px; border-left: 2px solid transparent;
        color: var(--chillscrollspy-text); text-decoration: none; border-radius: 0 6px 6px 0;
        transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
      }
      .chillscrollspy-link:hover { color: var(--chillscrollspy-text-hover); }
      .chillscrollspy-link:focus { outline: none; }
      .chillscrollspy-link:focus-visible { box-shadow: 0 0 0 3px var(--chillscrollspy-ring); }
      .chillscrollspy-link.chillscrollspy-active, .chillscrollspy-active { color: var(--chillscrollspy-active); border-left-color: var(--chillscrollspy-active); font-weight: 500; }
      .chillscrollspy-level-3 > .chillscrollspy-link { padding-left: 28px; }
      .chillscrollspy-level-4 > .chillscrollspy-link { padding-left: 42px; }
      .chillscrollspy-level-5 > .chillscrollspy-link, .chillscrollspy-level-6 > .chillscrollspy-link { padding-left: 56px; }
      @media (prefers-reduced-motion: reduce) { .chillscrollspy-link { transition: none; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    function slugify(s) {
        let t = String(s || '');
        if (t.normalize) t = t.normalize('NFKD').replace(/[̀-ͯ]/g, '');
        return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function resolve(x, root) {
        if (!x) return null;
        if (typeof x === 'string') return (root || document).querySelector(x);
        return x.nodeType ? x : null;
    }

    class ChillScrollSpyInstance {
        constructor(options) {
            options = options || {};
            injectCSS();
            this.o = {
                content: options.content || null,
                headings: options.headings || 'h2, h3',
                container: options.container || null,
                links: options.links || null,
                scrollContainer: options.scrollContainer || null,
                offset: Number(options.offset) || 0,
                smooth: options.smooth !== false,
                updateHash: options.updateHash !== false,
                activateFirst: options.activateFirst !== false,
                title: options.title || '',
                ariaLabel: options.ariaLabel || 'Table of contents',
                activeClass: options.activeClass || 'chillscrollspy-active',
                onChange: options.onChange || null
            };
            this.element = null;
            this._handlers = [];
            this._entries = []; // {id, heading, link, li}
            this._generatedIds = [];
            this._active = null;
            this._destroyed = false;
            this._raf = null;
            this._io = null;
            this._scroller = resolve(this.o.scrollContainer) || null;
            const self = this;
            this._onScroll = function () { self._queue(); };
            this._onResize = function () { self._observe(); self._queue(); };
            const target = this._scroller || window;
            target.addEventListener('scroll', this._onScroll, { passive: true });
            window.addEventListener('resize', this._onResize);
            this.refresh();
        }

        // ---- build ----
        _ensureId(h) {
            if (h.id) return h.id;
            let base = slugify(h.textContent), id = base, n = 2;
            while (document.getElementById(id)) id = base + '-' + (n++);
            h.id = id;
            this._generatedIds.push(h);
            return id;
        }

        _teardownBuilt() {
            if (this._clickTargets) this._clickTargets.forEach(function (t) { t.el.removeEventListener('click', t.fn); });
            this._clickTargets = [];
            if (this.element && this._builtNav) { this.element.remove(); this.element = null; this._builtNav = false; }
            const cls = this.o.activeClass;
            this._entries.forEach(function (e) {
                if (e.link) { e.link.classList.remove(cls); e.link.removeAttribute('aria-current'); }
            });
        }

        refresh() {
            if (this._destroyed) return this;
            this._teardownBuilt();
            const o = this.o, self = this;
            const content = resolve(o.content) || document.body;
            let entries = [];
            if (o.links) {
                const links = typeof o.links === 'string' ? Array.prototype.slice.call(document.querySelectorAll(o.links)) : Array.prototype.slice.call(o.links.nodeType ? [o.links] : o.links);
                links.forEach(function (a) {
                    const href = a.getAttribute('href') || '';
                    const hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#') + 1) : '';
                    if (!hash) return;
                    let target = null;
                    try { target = document.getElementById(decodeURIComponent(hash)); } catch (e) { target = document.getElementById(hash); }
                    if (target) entries.push({ id: target.id, heading: target, link: a, li: a.parentNode });
                });
            } else {
                const hs = Array.prototype.slice.call(content.querySelectorAll(o.headings)).filter(function (h) { return h.textContent.trim(); });
                const nav = document.createElement('nav');
                nav.className = 'chillscrollspy';
                nav.setAttribute('aria-label', o.ariaLabel);
                if (o.title) {
                    const t = document.createElement('p');
                    t.className = 'chillscrollspy-title';
                    t.textContent = o.title;
                    nav.appendChild(t);
                }
                const ul = document.createElement('ul');
                ul.className = 'chillscrollspy-list';
                hs.forEach(function (h) {
                    const id = self._ensureId(h);
                    const li = document.createElement('li');
                    const level = /^H([1-6])$/i.test(h.tagName) ? h.tagName.slice(1) : '2';
                    li.className = 'chillscrollspy-item chillscrollspy-level-' + level;
                    const a = document.createElement('a');
                    a.className = 'chillscrollspy-link';
                    a.setAttribute('href', '#' + encodeURIComponent(id));
                    a.textContent = h.textContent.trim();
                    li.appendChild(a);
                    ul.appendChild(li);
                    entries.push({ id: id, heading: h, link: a, li: li });
                });
                nav.appendChild(ul);
                this.element = nav;
                this._builtNav = true;
                const host = resolve(o.container);
                if (host) host.appendChild(nav);
            }
            this._entries = entries;
            this._clickTargets = [];
            entries.forEach(function (e) {
                const fn = function (ev) {
                    if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || (ev.button != null && ev.button !== 0)) return;
                    ev.preventDefault();
                    self.scrollTo(e.id);
                };
                e.link.addEventListener('click', fn);
                self._clickTargets.push({ el: e.link, fn: fn });
            });
            this._active = null;
            this._observe();
            this._update(true);
            return this;
        }

        // ---- observation ----
        _rootTop() {
            if (this._scroller) { try { return this._scroller.getBoundingClientRect().top; } catch (e) { return 0; } }
            return 0;
        }

        _viewportHeight() {
            if (this._scroller) return this._scroller.clientHeight || window.innerHeight || 0;
            return window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
        }

        _observe() {
            if (this._io) { this._io.disconnect(); this._io = null; }
            if (typeof window.IntersectionObserver !== 'function' || !this._entries.length) return;
            const h = this._viewportHeight();
            const top = Math.max(0, this.o.offset);
            const bottom = Math.max(0, h - top - 1);
            const self = this;
            try {
                this._io = new window.IntersectionObserver(function () { self._queue(); }, {
                    root: this._scroller || null,
                    rootMargin: '-' + top + 'px 0px -' + bottom + 'px 0px',
                    threshold: [0, 1]
                });
                this._entries.forEach(function (e) { self._io.observe(e.heading); });
            } catch (err) { this._io = null; }
        }

        _queue() {
            if (this._destroyed || this._raf !== null) return;
            const self = this;
            const run = function () { self._raf = null; self._update(false); };
            if (typeof window.requestAnimationFrame === 'function') this._raf = window.requestAnimationFrame(run);
            else this._raf = setTimeout(run, 16);
        }

        _atBottom() {
            const s = this._scroller;
            if (s) return s.scrollHeight > s.clientHeight && s.scrollTop + s.clientHeight >= s.scrollHeight - 2;
            const de = document.documentElement;
            const sh = de.scrollHeight, ch = window.innerHeight || de.clientHeight;
            const st = window.pageYOffset || de.scrollTop || 0;
            return sh > ch && st + ch >= sh - 2;
        }

        _compute() {
            const line = this._rootTop() + this.o.offset + 2; // small tolerance for sub-pixel scroll
            let current = null;
            for (let i = 0; i < this._entries.length; i++) {
                const r = this._entries[i].heading.getBoundingClientRect();
                if (r.top <= line) current = this._entries[i]; else break;
            }
            if (!current && this._entries.length && this.o.activateFirst) current = this._entries[0];
            if (this._entries.length && this._atBottom()) current = this._entries[this._entries.length - 1];
            return current;
        }

        _update(silent) {
            if (this._destroyed) return;
            const cur = this._compute();
            this._apply(cur ? cur.id : null, silent);
        }

        _apply(id, silent) {
            if (id === this._active) return;
            const cls = this.o.activeClass;
            this._entries.forEach(function (e) {
                const on = e.id === id;
                e.link.classList.toggle(cls, on);
                if (on) e.link.setAttribute('aria-current', 'location'); else e.link.removeAttribute('aria-current');
            });
            this._active = id;
            if (silent) return;
            const entry = this._entries.filter(function (e) { return e.id === id; })[0];
            const heading = entry ? entry.heading : null;
            if (this.o.onChange) { try { this.o.onChange(id, heading, this); } catch (e) { /* ignore */ } }
            this._handlers.slice().forEach(function (fn) { try { fn(id, heading); } catch (e) { /* ignore */ } });
        }

        // ---- public ----
        getActive() { return this._active; }

        setActive(id) {
            if (id !== null && !this._entries.some(function (e) { return e.id === id; })) return this;
            this._apply(id, false);
            return this;
        }

        scrollTo(id) {
            const entry = this._entries.filter(function (e) { return e.id === id; })[0];
            if (!entry) return this;
            const el = entry.heading;
            const behavior = this.o.smooth && !reducedMotion() ? 'smooth' : 'auto';
            const rect = el.getBoundingClientRect();
            const s = this._scroller;
            if (s) {
                const top = s.scrollTop + rect.top - this._rootTop() - this.o.offset;
                if (typeof s.scrollTo === 'function') s.scrollTo({ top: Math.max(0, top), behavior: behavior }); else s.scrollTop = Math.max(0, top);
            } else {
                const top = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - this.o.offset;
                try { window.scrollTo({ top: Math.max(0, top), behavior: behavior }); } catch (e) { /* jsdom: not implemented */ }
            }
            // keyboard / screen-reader users land on the section
            if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); entry.tmpTabindex = true; }
            try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            if (this.o.updateHash && window.history && typeof window.history.replaceState === 'function') {
                try { window.history.replaceState(null, '', '#' + encodeURIComponent(id)); } catch (e) { /* ignore */ }
            }
            this._apply(id, false);
            return this;
        }

        on(type, fn) {
            if (type !== 'change') throw new Error('ChillScrollSpy.on: unknown event "' + type + '"');
            this._handlers.push(fn);
            const self = this;
            return function off() { const i = self._handlers.indexOf(fn); if (i > -1) self._handlers.splice(i, 1); };
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            const target = this._scroller || window;
            target.removeEventListener('scroll', this._onScroll);
            window.removeEventListener('resize', this._onResize);
            if (this._io) { this._io.disconnect(); this._io = null; }
            if (this._raf !== null) {
                if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(this._raf);
                clearTimeout(this._raf);
                this._raf = null;
            }
            this._teardownBuilt();
            this._generatedIds.forEach(function (h) { h.removeAttribute('id'); });
            this._entries.forEach(function (e) { if (e.tmpTabindex) e.heading.removeAttribute('tabindex'); });
            this._generatedIds = [];
            this._entries = [];
            this._handlers.length = 0;
        }
    }

    const ChillScrollSpy = {
        version: VERSION,
        ScrollSpy: ChillScrollSpyInstance,
        init(options) { return new ChillScrollSpyInstance(options); },
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillScrollSpy; }
    else { window.ChillScrollSpy = ChillScrollSpy; }
})(typeof window !== 'undefined' ? window : this);
