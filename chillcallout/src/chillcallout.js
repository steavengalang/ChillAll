/**
 * ChillCallout - Zero-dependency inline banner / callout
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const c = ChillCallout.create({ type: 'warning', title: 'Heads up', message: 'Your trial ends soon.',
 *     dismissible: true, actions: [{ label: 'Upgrade', variant: 'primary', onClick: () => {} }] });
 *   document.querySelector('#slot').appendChild(c.element);
 *   c.dismiss();  c.destroy();
 *
 *   ChillCallout.init('.notice', { type: 'info' });     // enhance existing elements (children become the message)
 *
 * Options
 *   type         'info' | 'success' | 'warning' | 'danger' | 'neutral'      default 'info'
 *   variant      'soft' | 'outline' | 'solid'                                default 'soft'
 *   title        string (text)
 *   message      string (text) | Element. `html: true` renders strings as HTML (you sanitize)
 *   html         boolean                                                     default false
 *   icon         true (type icon) | false | string (text/emoji)              default true
 *   dismissible  show close button                                           default false
 *   collapsible  title toggles the body                                      default false
 *   collapsed    initial collapsed state                                     default false
 *   actions      [{ label, onClick, href, variant: 'primary'|'ghost', disabled }]
 *   role         override ('alert' | 'status' | 'note'); default alert for warning/danger, status otherwise
 *   container    element to append to (optional)
 *   onDismiss, onToggle(collapsed), onAction(action)
 *
 * Instance: { element, dismiss(), expand(), collapse(), toggle(), update(partial), on(evt, fn), off(evt, fn), destroy() }
 * Events: 'dismiss', 'toggle', 'action'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcallout-styles';
    const TYPES = ['info', 'success', 'warning', 'danger', 'neutral'];
    const SVG_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
    const ICONS = {
        info: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        success: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9"/></svg>',
        warning: SVG_OPEN + '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        danger: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        neutral: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };
    let uid = 0;

    const DARK_VARS = `
        --chillcallout-info: #60a5fa; --chillcallout-info-bg: rgba(59, 130, 246, 0.14);
        --chillcallout-success: #4ade80; --chillcallout-success-bg: rgba(34, 197, 94, 0.14);
        --chillcallout-warning: #fbbf24; --chillcallout-warning-bg: rgba(245, 158, 11, 0.14);
        --chillcallout-danger: #f87171; --chillcallout-danger-bg: rgba(239, 68, 68, 0.14);
        --chillcallout-neutral: #a3a3a3; --chillcallout-neutral-bg: rgba(255, 255, 255, 0.06);
        --chillcallout-text: #fafafa;
        --chillcallout-muted: #d4d4d4;`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcallout-info: #2563eb; --chillcallout-info-bg: #eff6ff;
        --chillcallout-success: #16a34a; --chillcallout-success-bg: #f0fdf4;
        --chillcallout-warning: #b45309; --chillcallout-warning-bg: #fffbeb;
        --chillcallout-danger: #dc2626; --chillcallout-danger-bg: #fef2f2;
        --chillcallout-neutral: #525252; --chillcallout-neutral-bg: #f5f5f5;
        --chillcallout-text: #171717;
        --chillcallout-muted: #404040;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chillcallout {
        --chillcallout-accent: var(--chillcallout-info);
        --chillcallout-surface: var(--chillcallout-info-bg);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        box-sizing: border-box;
        width: 100%;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--chillcallout-accent) 30%, transparent);
        border-left: 4px solid var(--chillcallout-accent);
        background: var(--chillcallout-surface);
        color: var(--chillcallout-text);
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }
      .chillcallout-info { --chillcallout-accent: var(--chillcallout-info); --chillcallout-surface: var(--chillcallout-info-bg); }
      .chillcallout-success { --chillcallout-accent: var(--chillcallout-success); --chillcallout-surface: var(--chillcallout-success-bg); }
      .chillcallout-warning { --chillcallout-accent: var(--chillcallout-warning); --chillcallout-surface: var(--chillcallout-warning-bg); }
      .chillcallout-danger { --chillcallout-accent: var(--chillcallout-danger); --chillcallout-surface: var(--chillcallout-danger-bg); }
      .chillcallout-neutral { --chillcallout-accent: var(--chillcallout-neutral); --chillcallout-surface: var(--chillcallout-neutral-bg); }
      .chillcallout-outline { background: transparent; }
      .chillcallout-solid { background: var(--chillcallout-accent); border-color: var(--chillcallout-accent); color: #fff; }
      .chillcallout-solid .chillcallout-icon, .chillcallout-solid .chillcallout-title, .chillcallout-solid .chillcallout-close { color: #fff; }
      .chillcallout-leaving { opacity: 0; transform: translateY(-4px); }
      .chillcallout-icon { flex-shrink: 0; display: inline-flex; margin-top: 1px; color: var(--chillcallout-accent); font-size: 18px; line-height: 20px; }
      .chillcallout-main { flex: 1; min-width: 0; }
      .chillcallout-title { margin: 0; font-weight: 600; font-size: 14px; color: var(--chillcallout-text); }
      .chillcallout-toggle {
        display: flex; align-items: center; gap: 6px; width: 100%; padding: 0; margin: 0; border: 0; background: none;
        font: inherit; font-weight: 600; color: inherit; text-align: left; cursor: pointer; border-radius: 4px;
      }
      .chillcallout-toggle:focus-visible, .chillcallout-close:focus-visible, .chillcallout-action:focus-visible { outline: 2px solid var(--chillcallout-accent); outline-offset: 2px; }
      .chillcallout-chevron { margin-left: auto; transition: transform 0.18s ease; font-size: 12px; opacity: 0.7; }
      .chillcallout-collapsed .chillcallout-chevron { transform: rotate(-90deg); }
      .chillcallout-body { color: var(--chillcallout-muted); word-wrap: break-word; }
      .chillcallout-solid .chillcallout-body { color: rgba(255, 255, 255, 0.92); }
      .chillcallout-title + .chillcallout-body, .chillcallout-toggle + .chillcallout-body { margin-top: 2px; }
      .chillcallout-body[hidden] { display: none; }
      .chillcallout-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .chillcallout-actions[hidden] { display: none; }
      .chillcallout-action {
        display: inline-flex; align-items: center; justify-content: center; min-height: 32px; padding: 4px 12px;
        border-radius: 6px; border: 1px solid var(--chillcallout-accent); background: transparent; color: var(--chillcallout-accent);
        font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.15s ease, color 0.15s ease;
      }
      .chillcallout-action:hover:not(:disabled) { background: color-mix(in srgb, var(--chillcallout-accent) 14%, transparent); }
      .chillcallout-action-primary { background: var(--chillcallout-accent); color: #fff; }
      .chillcallout-action-primary:hover:not(:disabled) { background: var(--chillcallout-accent); filter: brightness(1.1); }
      .chillcallout-action-ghost { border-color: transparent; }
      .chillcallout-action:disabled { opacity: 0.5; cursor: not-allowed; }
      .chillcallout-solid .chillcallout-action { border-color: rgba(255,255,255,0.7); color: #fff; }
      .chillcallout-solid .chillcallout-action-primary { background: #fff; color: var(--chillcallout-accent); }
      .chillcallout-close {
        flex-shrink: 0; width: 32px; height: 32px; margin: -6px -8px -6px 0; padding: 0; border: 0; border-radius: 6px;
        background: transparent; color: var(--chillcallout-muted); font-size: 20px; line-height: 1; cursor: pointer; font-family: inherit;
      }
      .chillcallout-close:hover { background: color-mix(in srgb, var(--chillcallout-accent) 14%, transparent); }
      @media (prefers-reduced-motion: reduce) {
        .chillcallout, .chillcallout-chevron, .chillcallout-action { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function fill(target, value, html) {
        target.textContent = '';
        if (value == null || value === '') return;
        if (value.nodeType) target.appendChild(value);
        else if (html) target.innerHTML = String(value);
        else target.textContent = String(value);
    }

    class ChillCalloutInstance {
        constructor(options, existing) {
            injectCSS();
            this.options = Object.assign({
                type: 'info', variant: 'soft', title: '', message: '', html: false, icon: true, dismissible: false,
                collapsible: false, collapsed: false, actions: [], role: null, container: null,
                onDismiss: null, onToggle: null, onAction: null
            }, options || {});
            if (TYPES.indexOf(this.options.type) < 0) this.options.type = 'info';
            this.destroyed = false;
            this.dismissed = false;
            this._listeners = {};
            this._cleanups = [];
            this._timers = [];
            this._existing = existing || null;
            this._id = 'chillcallout-' + (++uid);
            this.collapsed = !!(this.options.collapsible && this.options.collapsed);
            this._build();
            if (this.options.container) this.options.container.appendChild(this.element);
        }

        _build() {
            const o = this.options;
            const el = this.element = this._existing || document.createElement('div');
            if (this._existing) {
                this._saved = { className: el.className, role: el.getAttribute('role'), nodes: Array.prototype.slice.call(el.childNodes) };
                if (o.message === '' || o.message == null) {
                    const holder = document.createElement('div');
                    this._saved.nodes.forEach(n => holder.appendChild(n));
                    o.message = holder;
                }
                el.textContent = '';
            }
            this._render();
        }

        _render() {
            const o = this.options;
            const el = this.element;
            // clear (keep existing element identity)
            while (el.firstChild) el.removeChild(el.firstChild);
            const base = 'chillcallout chillcallout-' + o.type + (o.variant !== 'soft' ? ' chillcallout-' + o.variant : '') + (this.collapsed ? ' chillcallout-collapsed' : '');
            el.className = (this._saved ? this._saved.className + ' ' : '') + base;
            el.setAttribute('role', o.role || ((o.type === 'danger' || o.type === 'warning') ? 'alert' : 'status'));

            if (o.icon) {
                const ic = document.createElement('span');
                ic.className = 'chillcallout-icon';
                ic.setAttribute('aria-hidden', 'true');
                if (typeof o.icon === 'string') ic.textContent = o.icon; else ic.innerHTML = ICONS[o.type];
                el.appendChild(ic);
            }

            const main = document.createElement('div');
            main.className = 'chillcallout-main';
            el.appendChild(main);

            const title = o.title || (o.collapsible ? o.type.charAt(0).toUpperCase() + o.type.slice(1) : '');
            const body = this.bodyEl = document.createElement('div');
            body.className = 'chillcallout-body';
            body.id = this._id + '-body';
            fill(body, o.message, o.html);

            if (title) {
                if (o.collapsible) {
                    const btn = this.toggleBtn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chillcallout-toggle';
                    btn.setAttribute('aria-expanded', String(!this.collapsed));
                    btn.setAttribute('aria-controls', body.id);
                    const t = document.createElement('span'); t.textContent = title; btn.appendChild(t);
                    const ch = document.createElement('span'); ch.className = 'chillcallout-chevron'; ch.setAttribute('aria-hidden', 'true'); ch.textContent = '▾'; btn.appendChild(ch);
                    btn.addEventListener('click', () => this.toggle());
                    main.appendChild(btn);
                } else {
                    const t = document.createElement('div');
                    t.className = 'chillcallout-title';
                    t.textContent = title;
                    main.appendChild(t);
                }
            }
            body.hidden = this.collapsed;
            main.appendChild(body);

            const actions = Array.isArray(o.actions) ? o.actions : [];
            if (actions.length) {
                const wrap = this.actionsEl = document.createElement('div');
                wrap.className = 'chillcallout-actions';
                wrap.hidden = this.collapsed;
                actions.forEach(a => {
                    const isLink = !!a.href;
                    const b = document.createElement(isLink ? 'a' : 'button');
                    if (isLink) { b.href = a.href; if (a.target) b.target = a.target; if (a.target === '_blank') b.rel = 'noopener noreferrer'; }
                    else { b.type = 'button'; if (a.disabled) b.disabled = true; }
                    b.className = 'chillcallout-action' + (a.variant ? ' chillcallout-action-' + a.variant : '');
                    b.textContent = a.label == null ? '' : String(a.label);
                    b.addEventListener('click', e => {
                        if (typeof a.onClick === 'function') a.onClick(e, a, this);
                        if (typeof o.onAction === 'function') o.onAction(a, this);
                        this._emit('action', a);
                    });
                    wrap.appendChild(b);
                });
                main.appendChild(wrap);
            }

            if (o.dismissible) {
                const x = this.closeBtn = document.createElement('button');
                x.type = 'button';
                x.className = 'chillcallout-close';
                x.setAttribute('aria-label', 'Dismiss');
                x.textContent = '×';
                x.addEventListener('click', () => this.dismiss());
                el.appendChild(x);
            }
        }

        _setCollapsed(c) {
            if (!this.options.collapsible || this.collapsed === c) return this;
            this.collapsed = c;
            this.element.classList.toggle('chillcallout-collapsed', c);
            this.bodyEl.hidden = c;
            if (this.actionsEl) this.actionsEl.hidden = c;
            if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', String(!c));
            if (typeof this.options.onToggle === 'function') this.options.onToggle(c, this);
            this._emit('toggle', c);
            return this;
        }
        collapse() { return this._setCollapsed(true); }
        expand() { return this._setCollapsed(false); }
        toggle() { return this._setCollapsed(!this.collapsed); }

        update(partial) {
            Object.assign(this.options, partial || {});
            if (TYPES.indexOf(this.options.type) < 0) this.options.type = 'info';
            if (partial && 'collapsed' in partial) this.collapsed = !!(this.options.collapsible && partial.collapsed);
            this._render();
            return this;
        }

        dismiss() {
            if (this.destroyed || this.dismissed) return this;
            this.dismissed = true;
            if (typeof this.options.onDismiss === 'function') this.options.onDismiss(this);
            this._emit('dismiss');
            const finish = () => { const el = this.element, enhanced = !!this._existing; this.destroy(); if (enhanced) el.hidden = true; };
            if (reducedMotion()) { finish(); return this; }
            this.element.classList.add('chillcallout-leaving');
            this._timers.push(setTimeout(finish, 190));
            return this;
        }

        on(evt, fn) { (this._listeners[evt] = this._listeners[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._listeners[evt]) this._listeners[evt] = fn ? this._listeners[evt].filter(f => f !== fn) : []; return this; }
        _emit(evt, arg) { (this._listeners[evt] || []).slice().forEach(fn => fn(arg, this)); }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this._timers.forEach(clearTimeout);
            this._timers = [];
            const el = this.element;
            if (this._existing) {
                // restore the enhanced element to its original state
                while (el.firstChild) el.removeChild(el.firstChild);
                this._saved.nodes.forEach(n => el.appendChild(n));
                el.className = this._saved.className;
                if (this._saved.role == null) el.removeAttribute('role'); else el.setAttribute('role', this._saved.role);
            } else if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            this._listeners = {};
        }
    }

    function create(options) { return new ChillCalloutInstance(options); }

    function init(selector, options) {
        injectCSS();
        const els = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []);
        const insts = els.map(el => {
            const opts = Object.assign({}, options || {});
            const type = el.getAttribute('data-type'); if (type) opts.type = type;
            const title = el.getAttribute('data-title'); if (title) opts.title = title;
            if (el.hasAttribute('data-dismissible')) opts.dismissible = el.getAttribute('data-dismissible') !== 'false';
            if (el.hasAttribute('data-collapsible')) opts.collapsible = el.getAttribute('data-collapsible') !== 'false';
            if (el.hasAttribute('data-collapsed')) opts.collapsed = el.getAttribute('data-collapsed') !== 'false';
            return new ChillCalloutInstance(opts, el);
        });
        return { callouts: insts, destroy() { insts.forEach(i => i.destroy()); } };
    }

    const ChillCallout = {
        version: VERSION,
        create,
        init,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCallout;
    } else {
        window.ChillCallout = ChillCallout;
    }

})(typeof window !== 'undefined' ? window : this);
