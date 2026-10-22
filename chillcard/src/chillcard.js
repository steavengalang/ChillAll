/**
 * ChillCard - Zero-dependency Card Component
 *
 * Header / media / body / footer card with variants, hover lift, clickable
 * (link/button) semantics, horizontal layout and a skeleton loading state.
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const card = ChillCard.create({
 *     title: 'Hello', subtitle: 'World',
 *     media: { src: 'cover.jpg', alt: 'Cover', ratio: '16/9' },
 *     body: 'Plain text is inserted with textContent (safe).',
 *     footer: buttonNode,
 *     variant: 'elevated', hoverable: true,
 *     href: '/post/1',                    // or onClick: (e, card) => {}
 *     parent: document.body
 *   });
 *   card.setLoading(true);                // skeleton
 *   card.on('click', ({ event }) => {});
 *   card.destroy();
 *
 *   ChillCard.init('.card', { variant: 'outlined' });  // enhance existing DOM (returns array)
 *   ChillCard.init(element, opts);                     // returns a single instance
 *
 * Options
 * | option        | default      | description                                                    |
 * |---------------|--------------|----------------------------------------------------------------|
 * | title         | ''           | header title (text)                                            |
 * | subtitle      | ''           | header subtitle (text)                                         |
 * | header        | null         | Node or string, rendered in the header after title/subtitle    |
 * | media         | null         | URL string | Node | { src, alt, ratio }                         |
 * | mediaRatio    | '16 / 9'     | aspect ratio for image media                                   |
 * | body          | null         | Node or string                                                 |
 * | footer        | null         | Node or string                                                 |
 * | html          | false        | if true, string header/body/footer are treated as HTML         |
 * | headerHtml / bodyHtml / footerHtml | null | explicit HTML strings (trusted content only!)   |
 * | variant       | 'outlined'   | 'outlined' | 'elevated' | 'filled'                             |
 * | size          | 'md'         | 'sm' | 'md' | 'lg' (padding / type scale)                       |
 * | hoverable     | false        | lift/hover effect                                              |
 * | clickable     | false        | make whole card interactive (implied by href / onClick)        |
 * | href          | null         | makes card role="link"; javascript:/data: URLs are rejected    |
 * | target        | null         | window target for href ('_blank' adds noopener)                |
 * | horizontal    | false        | media on the left, content on the right                        |
 * | loading       | false        | skeleton state (aria-busy)                                     |
 * | disabled      | false        | non-interactive, aria-disabled                                 |
 * | ariaLabel     | null         | accessible name for clickable cards                            |
 * | className     | ''           | extra class names                                              |
 * | parent        | null         | element (or selector) to append the card to                    |
 * | onClick       | null         | (event, card) => void  (call event.preventDefault() to stop href) |
 * | onLoadingChange | null       | (loading, card) => void                                        |
 *
 * Instance: element, setLoading(bool), setVariant(v), setSize(s), setTitle(text), setSubtitle(text),
 *           setBody(content, asHtml?), setFooter(content, asHtml?), setMedia(media), setDisabled(bool),
 *           on/off(event, fn), destroy()
 * Events: 'click' ({event, card}), 'loading' ({loading, card}), 'destroy'
 * Slots (elements): .headerEl .mediaEl .bodyEl .footerEl (null when absent)
 *
 * Dark mode: CSS variables --chillcard-* switch with prefers-color-scheme, or
 * data-theme="dark" / .dark on <html>.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcard-styles';
    const SIZES = ['sm', 'md', 'lg'];
    const VARIANTS = ['outlined', 'elevated', 'filled'];
    const INTERACTIVE = 'a,button,input,select,textarea,summary,label,[contenteditable="true"],[data-chillcard-ignore]';
    const DEFAULTS = {
        title: '', subtitle: '', header: null, media: null, mediaRatio: '16 / 9', body: null, footer: null,
        html: false, headerHtml: null, bodyHtml: null, footerHtml: null,
        variant: 'outlined', size: 'md', hoverable: false, clickable: false, href: null, target: null,
        horizontal: false, loading: false, disabled: false, ariaLabel: null, className: '', parent: null,
        onClick: null, onLoadingChange: null
    };
    const MANAGED_ATTRS = ['role', 'tabindex', 'aria-disabled', 'aria-busy', 'aria-label'];

    const CSS = `
:root {
  --chillcard-primary: #3b82f6;
  --chillcard-bg: #ffffff;
  --chillcard-filled-bg: #f4f4f5;
  --chillcard-text: #171717;
  --chillcard-muted: #6b7280;
  --chillcard-border: #e5e5e5;
  --chillcard-divider: #eeeeee;
  --chillcard-skeleton: #e5e7eb;
  --chillcard-skeleton-shine: #f3f4f6;
  --chillcard-shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.08);
  --chillcard-shadow-hover: 0 4px 8px rgba(0,0,0,.08), 0 12px 28px rgba(0,0,0,.14);
  --chillcard-radius: 8px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) {
    --chillcard-bg: #171717;
    --chillcard-filled-bg: #262626;
    --chillcard-text: #fafafa;
    --chillcard-muted: #a3a3a3;
    --chillcard-border: #404040;
    --chillcard-divider: #2e2e2e;
    --chillcard-skeleton: #333333;
    --chillcard-skeleton-shine: #404040;
    --chillcard-shadow: 0 1px 2px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.4);
    --chillcard-shadow-hover: 0 4px 8px rgba(0,0,0,.5), 0 12px 28px rgba(0,0,0,.6);
  }
}
:root[data-theme="dark"], :root.dark {
  --chillcard-bg: #171717;
  --chillcard-filled-bg: #262626;
  --chillcard-text: #fafafa;
  --chillcard-muted: #a3a3a3;
  --chillcard-border: #404040;
  --chillcard-divider: #2e2e2e;
  --chillcard-skeleton: #333333;
  --chillcard-skeleton-shine: #404040;
  --chillcard-shadow: 0 1px 2px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.4);
  --chillcard-shadow-hover: 0 4px 8px rgba(0,0,0,.5), 0 12px 28px rgba(0,0,0,.6);
}

.chillcard {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  background: var(--chillcard-bg);
  color: var(--chillcard-text);
  border: 1px solid transparent;
  border-radius: var(--chillcard-radius);
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  text-align: left;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease;
}
.chillcard *, .chillcard *::before, .chillcard *::after { box-sizing: border-box; }
.chillcard-outlined { border-color: var(--chillcard-border); }
.chillcard-elevated { box-shadow: var(--chillcard-shadow); }
.chillcard-filled { background: var(--chillcard-filled-bg); }

.chillcard-hoverable:hover, .chillcard-clickable:hover:not(.chillcard-disabled) { border-color: var(--chillcard-primary); }
.chillcard-elevated.chillcard-hoverable:hover,
.chillcard-elevated.chillcard-clickable:hover:not(.chillcard-disabled) {
  box-shadow: var(--chillcard-shadow-hover);
  transform: translateY(-2px);
  border-color: transparent;
}
.chillcard-filled.chillcard-hoverable:hover,
.chillcard-filled.chillcard-clickable:hover:not(.chillcard-disabled) { border-color: transparent; transform: translateY(-1px); }
.chillcard-outlined.chillcard-hoverable:hover,
.chillcard-outlined.chillcard-clickable:hover:not(.chillcard-disabled) { transform: translateY(-1px); }

.chillcard-clickable { cursor: pointer; }
.chillcard:focus { outline: none; }
.chillcard:focus-visible { outline: 2px solid var(--chillcard-primary); outline-offset: 2px; }
.chillcard-disabled { opacity: .55; cursor: not-allowed; }

.chillcard-media {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  background: var(--chillcard-skeleton);
}
.chillcard-media > img, .chillcard-media > video, .chillcard-media > picture, .chillcard-media > svg {
  display: block; width: 100%; height: 100%; object-fit: cover;
}
.chillcard-media-ratio { aspect-ratio: var(--chillcard-ratio, 16 / 9); }
.chillcard-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }

.chillcard-header { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 2px; }
.chillcard-title { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.35; color: var(--chillcard-text); }
.chillcard-subtitle { margin: 0; font-size: 13px; color: var(--chillcard-muted); }
.chillcard-header-extra:not(:first-child) { margin-top: 6px; }
.chillcard-body { padding: 12px 16px; flex: 1 1 auto; color: var(--chillcard-text); }
.chillcard-main > .chillcard-body:first-child { padding-top: 16px; }
.chillcard-footer {
  padding: 12px 16px; border-top: 1px solid var(--chillcard-divider);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: var(--chillcard-muted);
}
.chillcard-filled .chillcard-footer { border-top-color: var(--chillcard-border); }

/* sizes */
.chillcard-sm { font-size: 13px; }
.chillcard-sm .chillcard-header { padding: 12px 12px 0; }
.chillcard-sm .chillcard-body { padding: 8px 12px; }
.chillcard-sm .chillcard-main > .chillcard-body:first-child { padding-top: 12px; }
.chillcard-sm .chillcard-footer { padding: 8px 12px; }
.chillcard-sm .chillcard-title { font-size: 14px; }
.chillcard-lg { font-size: 15px; }
.chillcard-lg .chillcard-header { padding: 24px 24px 0; }
.chillcard-lg .chillcard-body { padding: 16px 24px; }
.chillcard-lg .chillcard-main > .chillcard-body:first-child { padding-top: 24px; }
.chillcard-lg .chillcard-footer { padding: 16px 24px; }
.chillcard-lg .chillcard-title { font-size: 20px; }

/* horizontal */
.chillcard-horizontal { flex-direction: row; }
.chillcard-horizontal > .chillcard-media { width: 35%; min-width: 96px; max-width: 280px; align-self: stretch; }
.chillcard-horizontal > .chillcard-media.chillcard-media-ratio { aspect-ratio: auto; }
@media (max-width: 480px) {
  .chillcard-horizontal { flex-direction: column; }
  .chillcard-horizontal > .chillcard-media { width: 100%; max-width: none; }
  .chillcard-horizontal > .chillcard-media.chillcard-media-ratio { aspect-ratio: var(--chillcard-ratio, 16 / 9); }
}

/* skeleton */
.chillcard-skeleton { display: none; padding: 16px; flex-direction: column; gap: 10px; flex: 1 1 auto; }
.chillcard-loading > .chillcard-main { display: none; }
.chillcard-loading > .chillcard-skeleton { display: flex; }
.chillcard-loading > .chillcard-media > * { visibility: hidden; }
.chillcard-loading { pointer-events: none; }
.chillcard-skeleton-line, .chillcard-loading > .chillcard-media {
  background: linear-gradient(90deg, var(--chillcard-skeleton) 25%, var(--chillcard-skeleton-shine) 50%, var(--chillcard-skeleton) 75%);
  background-size: 200% 100%;
  animation: chillcard-shimmer 1.4s ease-in-out infinite;
}
.chillcard-skeleton-line { height: 12px; border-radius: 6px; }
.chillcard-skeleton-line.chillcard-skeleton-title { height: 18px; width: 55%; }
.chillcard-skeleton-line.chillcard-skeleton-short { width: 70%; }
@keyframes chillcard-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .chillcard { transition: none; }
  .chillcard-hoverable:hover, .chillcard-clickable:hover { transform: none !important; }
  .chillcard-skeleton-line, .chillcard-loading > .chillcard-media { animation: none; }
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

    function safeUrl(url) {
        if (typeof url !== 'string' || !url) return null;
        const clean = url.replace(/[\u0000- ]/g, '').toLowerCase();
        if (/^(javascript|data|vbscript):/.test(clean)) return null;
        return url;
    }

    /** Fill element with Node / text / (opt-in) html. */
    function fill(el, value, asHtml) {
        while (el.firstChild) el.removeChild(el.firstChild);
        if (value == null || value === false) return;
        if (isNode(value)) el.appendChild(value);
        else if (Array.isArray(value)) value.forEach(v => el.appendChild(isNode(v) ? v : document.createTextNode(String(v))));
        else if (asHtml) el.innerHTML = String(value);
        else el.textContent = String(value);
    }

    function hasContent(v) { return v != null && v !== false && v !== ''; }

    function makeSkeleton() {
        const sk = document.createElement('div');
        sk.className = 'chillcard-skeleton';
        sk.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 4; i++) {
            const l = document.createElement('div');
            l.className = 'chillcard-skeleton-line' + (i === 0 ? ' chillcard-skeleton-title' : i === 3 ? ' chillcard-skeleton-short' : '');
            sk.appendChild(l);
        }
        return sk;
    }

    class ChillCardInstance {
        constructor(options, existing) {
            this.options = Object.assign({}, DEFAULTS, options || {});
            if (VARIANTS.indexOf(this.options.variant) < 0) this.options.variant = 'outlined';
            if (SIZES.indexOf(this.options.size) < 0) this.options.size = 'md';
            this._listeners = {};
            this._destroyed = false;
            this._owned = !existing;
            injectCSS();
            if (existing) this._enhance(existing); else this._build();
        }

        _build() {
            const o = this.options;
            const el = document.createElement('div');
            this.element = el;
            this._buildContent();
            this._applyClasses();
            this._bind();
            if (o.parent) {
                const p = typeof o.parent === 'string' ? document.querySelector(o.parent) : o.parent;
                if (p) p.appendChild(el);
            }
        }

        _enhance(el) {
            this.element = el;
            this._attrs = {};
            MANAGED_ATTRS.forEach(a => { this._attrs[a] = el.getAttribute(a); });
            this._origClass = el.getAttribute('class');
            this.mediaEl = el.querySelector(':scope > .chillcard-media');
            this.headerEl = el.querySelector('.chillcard-header');
            this.bodyEl = el.querySelector('.chillcard-body');
            this.footerEl = el.querySelector('.chillcard-footer');
            this._titleEl = el.querySelector('.chillcard-title');
            this._subtitleEl = el.querySelector('.chillcard-subtitle');
            // wrap loose children so the skeleton toggle can hide them
            const main = document.createElement('div');
            main.className = 'chillcard-main';
            Array.prototype.slice.call(el.childNodes).filter(n => n !== this.mediaEl).forEach(n => main.appendChild(n));
            el.appendChild(main);
            this._main = main;
            this._skeleton = makeSkeleton();
            el.appendChild(this._skeleton);
            this._applyClasses();
            this._bind();
        }

        _buildContent() {
            const o = this.options;
            const el = this.element;
            while (el.firstChild) el.removeChild(el.firstChild);
            this.mediaEl = this.headerEl = this.bodyEl = this.footerEl = null;
            this._titleEl = this._subtitleEl = null;

            if (o.media) this._buildMedia();

            const main = document.createElement('div');
            main.className = 'chillcard-main';
            this._main = main;

            if (hasContent(o.title) || hasContent(o.subtitle) || hasContent(o.header) || hasContent(o.headerHtml)) {
                const h = document.createElement('div');
                h.className = 'chillcard-header';
                if (hasContent(o.title)) {
                    const t = document.createElement('h3');
                    t.className = 'chillcard-title';
                    t.textContent = String(o.title);
                    h.appendChild(t); this._titleEl = t;
                }
                if (hasContent(o.subtitle)) {
                    const s = document.createElement('p');
                    s.className = 'chillcard-subtitle';
                    s.textContent = String(o.subtitle);
                    h.appendChild(s); this._subtitleEl = s;
                }
                if (hasContent(o.header) || hasContent(o.headerHtml)) {
                    const x = document.createElement('div');
                    x.className = 'chillcard-header-extra';
                    if (hasContent(o.headerHtml)) fill(x, o.headerHtml, true); else fill(x, o.header, o.html);
                    h.appendChild(x);
                }
                main.appendChild(h);
                this.headerEl = h;
            }
            if (hasContent(o.body) || hasContent(o.bodyHtml)) {
                const b = document.createElement('div');
                b.className = 'chillcard-body';
                if (hasContent(o.bodyHtml)) fill(b, o.bodyHtml, true); else fill(b, o.body, o.html);
                main.appendChild(b);
                this.bodyEl = b;
            }
            if (hasContent(o.footer) || hasContent(o.footerHtml)) {
                const f = document.createElement('div');
                f.className = 'chillcard-footer';
                if (hasContent(o.footerHtml)) fill(f, o.footerHtml, true); else fill(f, o.footer, o.html);
                main.appendChild(f);
                this.footerEl = f;
            }
            el.appendChild(main);
            this._skeleton = makeSkeleton();
            el.appendChild(this._skeleton);
        }

        _buildMedia() {
            const o = this.options;
            const m = document.createElement('div');
            m.className = 'chillcard-media';
            let media = o.media;
            if (typeof media === 'string') media = { src: media };
            if (isNode(media)) {
                m.appendChild(media);
            } else if (media && typeof media === 'object') {
                const img = document.createElement('img');
                const src = safeUrl(media.src);
                if (src) img.setAttribute('src', src);
                img.setAttribute('alt', media.alt == null ? '' : String(media.alt));
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                m.appendChild(img);
                const ratio = media.ratio || o.mediaRatio;
                if (ratio) {
                    m.classList.add('chillcard-media-ratio');
                    m.style.setProperty('--chillcard-ratio', String(ratio).replace(/[^0-9./ ]/g, ''));
                }
            }
            this.element.appendChild(m);
            this.mediaEl = m;
        }

        _wantsClick() {
            const o = this.options;
            return !!(o.clickable || safeUrl(o.href) || typeof o.onClick === 'function');
        }

        _isInteractive() { return !this.options.disabled && this._wantsClick(); }

        _applyClasses() {
            const o = this.options;
            const el = this.element;
            const rm = [];
            el.classList.forEach(c => { if (/^chillcard(-|$)/.test(c)) rm.push(c); });
            rm.forEach(c => el.classList.remove(c));
            const add = ['chillcard', 'chillcard-' + o.variant, 'chillcard-' + o.size];
            if (o.horizontal) add.push('chillcard-horizontal');
            if (o.hoverable) add.push('chillcard-hoverable');
            if (o.disabled) add.push('chillcard-disabled');
            if (o.loading) add.push('chillcard-loading');
            const wantsClick = this._wantsClick();
            if (wantsClick) add.push('chillcard-clickable');
            add.forEach(c => el.classList.add(c));
            if (o.className) String(o.className).split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));

            if (wantsClick) {
                el.setAttribute('role', safeUrl(o.href) ? 'link' : 'button');
                if (o.disabled) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '0');
            } else {
                el.removeAttribute('tabindex');
                const r = el.getAttribute('role');
                if (r === 'link' || r === 'button') el.removeAttribute('role');
            }
            if (o.ariaLabel) el.setAttribute('aria-label', String(o.ariaLabel));
            if (o.disabled) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
            if (o.loading) el.setAttribute('aria-busy', 'true'); else el.removeAttribute('aria-busy');
        }

        _bind() {
            const el = this.element;
            this._onClickEl = (e) => {
                if (!this._isInteractive() || this.options.loading) return;
                const t = e.target;
                if (t && t !== el && t.closest) {
                    const inner = t.closest(INTERACTIVE);
                    if (inner && inner !== el && el.contains(inner)) return;
                }
                this._activate(e);
            };
            this._onKey = (e) => {
                if (e.target !== el || !this._isInteractive() || this.options.loading) return;
                const isLink = !!safeUrl(this.options.href);
                if (e.key === 'Enter' || (!isLink && (e.key === ' ' || e.key === 'Spacebar'))) {
                    e.preventDefault();
                    this._activate(e);
                }
            };
            el.addEventListener('click', this._onClickEl);
            el.addEventListener('keydown', this._onKey);
        }

        _activate(e) {
            const o = this.options;
            this._emit('click', { event: e, card: this });
            if (typeof o.onClick === 'function') o.onClick(e, this);
            const href = safeUrl(o.href);
            if (href && !e.defaultPrevented) {
                if (o.target && o.target !== '_self') window.open(href, o.target, 'noopener,noreferrer');
                else if (window.location && typeof window.location.assign === 'function') window.location.assign(href);
            }
        }

        setLoading(loading) {
            if (this._destroyed) return this;
            loading = !!loading;
            if (loading === this.options.loading) return this;
            this.options.loading = loading;
            this._applyClasses();
            this._emit('loading', { loading: loading, card: this });
            if (typeof this.options.onLoadingChange === 'function') this.options.onLoadingChange(loading, this);
            return this;
        }

        setVariant(variant) {
            if (VARIANTS.indexOf(variant) < 0) return this;
            this.options.variant = variant; this._applyClasses(); return this;
        }

        setSize(size) {
            if (SIZES.indexOf(size) < 0) return this;
            this.options.size = size; this._applyClasses(); return this;
        }

        setDisabled(disabled) {
            this.options.disabled = !!disabled; this._applyClasses(); return this;
        }

        _rebuild() {
            if (this._destroyed || !this._owned) return;
            this._buildContent();
            this._applyClasses();
        }

        setTitle(title) { this.options.title = title; this._rebuild(); return this; }
        setSubtitle(subtitle) { this.options.subtitle = subtitle; this._rebuild(); return this; }
        setBody(body, asHtml) {
            if (asHtml) { this.options.bodyHtml = body; this.options.body = null; }
            else { this.options.body = body; this.options.bodyHtml = null; }
            this._rebuild(); return this;
        }
        setFooter(footer, asHtml) {
            if (asHtml) { this.options.footerHtml = footer; this.options.footer = null; }
            else { this.options.footer = footer; this.options.footerHtml = null; }
            this._rebuild(); return this;
        }
        setMedia(media) { this.options.media = media; this._rebuild(); return this; }

        on(event, fn) {
            if (typeof fn !== 'function') return this;
            (this._listeners[event] = this._listeners[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._listeners[event];
            if (!l) return this;
            if (!fn) delete this._listeners[event];
            else this._listeners[event] = l.filter(f => f !== fn);
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
            this._emit('destroy', { card: this });
            const el = this.element;
            el.removeEventListener('click', this._onClickEl);
            el.removeEventListener('keydown', this._onKey);
            if (this._owned) {
                if (el.parentNode) el.parentNode.removeChild(el);
            } else {
                // undo enhancement: unwrap main, drop skeleton, restore attrs/classes
                if (this._skeleton && this._skeleton.parentNode) this._skeleton.parentNode.removeChild(this._skeleton);
                if (this._main && this._main.parentNode === el) {
                    while (this._main.firstChild) el.insertBefore(this._main.firstChild, this._main);
                    el.removeChild(this._main);
                }
                if (this._origClass == null) el.removeAttribute('class'); else el.setAttribute('class', this._origClass);
                MANAGED_ATTRS.forEach(a => {
                    if (this._attrs[a] == null) el.removeAttribute(a); else el.setAttribute(a, this._attrs[a]);
                });
            }
            this._listeners = {};
        }
    }

    const ChillCard = {
        version: VERSION,

        create(options) {
            return new ChillCardInstance(options);
        },

        /** Element -> single instance; selector / list -> array of instances. */
        init(selectorOrElement, options) {
            if (typeof document === 'undefined') return null;
            if (isNode(selectorOrElement)) return new ChillCardInstance(options, selectorOrElement);
            let list = [];
            if (typeof selectorOrElement === 'string') list = Array.prototype.slice.call(document.querySelectorAll(selectorOrElement));
            else if (selectorOrElement && typeof selectorOrElement.length === 'number') list = Array.prototype.slice.call(selectorOrElement);
            return list.map(el => new ChillCardInstance(options, el));
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCard;
    } else {
        window.ChillCard = ChillCard;
    }

})(typeof window !== 'undefined' ? window : this);
