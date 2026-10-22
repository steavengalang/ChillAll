/**
 * ChillTimeline - Zero-dependency timeline component
 *
 * Vertical, horizontal or alternating timeline with icons, status colours and collapsible items.
 *
 * @example
 *   const tl = ChillTimeline.create({
 *     layout: 'alternate',
 *     items: [
 *       { title: 'Order placed', time: '09:00', description: 'We got it.', status: 'success' },
 *       { title: 'Packed', time: '11:30', content: 'Box #42', status: 'info', collapsible: true, open: false },
 *       { title: 'Shipped', status: 'pending' }
 *     ]
 *   });
 *   document.body.appendChild(tl.element);
 *   ChillTimeline.init('#existing-ul', { layout: 'vertical' });   // enhance <ul><li>…</li></ul>
 *
 * Options
 *   items        Array<{ title, time, description, content, icon, status, collapsible, open, id }>   default []
 *                `content` may be a string (text) or a DOM Node. `icon` is text/emoji (or Node).
 *   layout       'vertical' | 'horizontal' | 'alternate'   default 'vertical'
 *   size         'sm' | 'md' | 'lg'                        default 'md'
 *   collapsible  make every item collapsible               default false
 *   html         treat title/description/content/icon strings as HTML (UNSAFE with untrusted data)  default false
 *   ariaLabel    accessible name of the list               default 'Timeline'
 *   onToggle     (item, index, open) => void
 *   onItemClick  (item, index, event) => void
 * Status: default | success | warning | danger | info | pending
 *
 * Methods: setItems(items), add(item), remove(index), toggle(index, force), expandAll(), collapseAll(),
 *          setLayout(layout), on(event, fn), off(event, fn), destroy()
 * Events:  'toggle' (item, index, open), 'itemClick' (item, index, event)
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilltimeline-styles';
    const STATUSES = ['default', 'success', 'warning', 'danger', 'info', 'pending'];
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chilltimeline-text: #171717;
        --chilltimeline-muted: #6b7280;
        --chilltimeline-line: #e5e5e5;
        --chilltimeline-bg: #ffffff;
        --chilltimeline-surface: #f9fafb;
        --chilltimeline-primary: #3b82f6;
        --chilltimeline-success: #22c55e;
        --chilltimeline-warning: #f59e0b;
        --chilltimeline-danger: #ef4444;
        --chilltimeline-info: #0ea5e9;
        --chilltimeline-pending: #9ca3af;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltimeline-text: #fafafa;
          --chilltimeline-muted: #a3a3a3;
          --chilltimeline-line: #404040;
          --chilltimeline-bg: #171717;
          --chilltimeline-surface: #262626;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chilltimeline-text: #fafafa;
        --chilltimeline-muted: #a3a3a3;
        --chilltimeline-line: #404040;
        --chilltimeline-bg: #171717;
        --chilltimeline-surface: #262626;
      }

      .chilltimeline { list-style: none; margin: 0; padding: 0; color: var(--chilltimeline-text); font-size: 14px; line-height: 1.5; font-family: inherit; box-sizing: border-box; }
      .chilltimeline *, .chilltimeline *::before, .chilltimeline *::after { box-sizing: border-box; }
      .chilltimeline-item { --chilltimeline-color: var(--chilltimeline-primary); position: relative; display: grid; grid-template-columns: 32px 1fr; column-gap: 12px; padding-bottom: 20px; }
      .chilltimeline-item:last-child { padding-bottom: 0; }
      .chilltimeline-status-default { --chilltimeline-color: var(--chilltimeline-primary); }
      .chilltimeline-status-success { --chilltimeline-color: var(--chilltimeline-success); }
      .chilltimeline-status-warning { --chilltimeline-color: var(--chilltimeline-warning); }
      .chilltimeline-status-danger { --chilltimeline-color: var(--chilltimeline-danger); }
      .chilltimeline-status-info { --chilltimeline-color: var(--chilltimeline-info); }
      .chilltimeline-status-pending { --chilltimeline-color: var(--chilltimeline-pending); }

      .chilltimeline-rail { position: relative; display: flex; justify-content: center; }
      .chilltimeline-rail::after { content: ""; position: absolute; top: 32px; bottom: -20px; left: calc(50% - 1px); width: 2px; background: var(--chilltimeline-line); border-radius: 1px; }
      .chilltimeline-item:last-child .chilltimeline-rail::after { display: none; }
      .chilltimeline-marker { position: relative; z-index: 1; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; color: #fff; background: var(--chilltimeline-color); box-shadow: 0 0 0 4px var(--chilltimeline-bg); flex-shrink: 0; }
      .chilltimeline-status-pending .chilltimeline-marker { background: var(--chilltimeline-bg); color: var(--chilltimeline-pending); border: 2px dashed var(--chilltimeline-pending); }
      .chilltimeline-marker-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; }
      .chilltimeline-status-pending .chilltimeline-marker-dot { background: var(--chilltimeline-pending); }

      .chilltimeline-main { min-width: 0; padding-top: 4px; }
      .chilltimeline-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
      .chilltimeline-title { font-weight: 600; margin: 0; font-size: 1em; }
      .chilltimeline-time { color: var(--chilltimeline-muted); font-size: 12px; }
      .chilltimeline-desc { margin: 2px 0 0; color: var(--chilltimeline-muted); }
      .chilltimeline-body { margin-top: 8px; padding: 10px 12px; background: var(--chilltimeline-surface); border: 1px solid var(--chilltimeline-line); border-radius: 8px; }
      .chilltimeline-toggle { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 8px; min-height: 32px; cursor: pointer; border-radius: 8px; padding: 0 4px; margin: -4px 0 -4px -4px; max-width: 100%; }
      .chilltimeline-toggle:hover { background: var(--chilltimeline-surface); }
      .chilltimeline-toggle:focus-visible, .chilltimeline-item[tabindex]:focus-visible { outline: 2px solid var(--chilltimeline-primary); outline-offset: 2px; }
      .chilltimeline-chevron { width: 8px; height: 8px; border-right: 2px solid var(--chilltimeline-muted); border-bottom: 2px solid var(--chilltimeline-muted); transform: rotate(-45deg); transition: transform .18s ease; flex-shrink: 0; }
      .chilltimeline-open .chilltimeline-chevron { transform: rotate(45deg); }
      .chilltimeline-body[hidden] { display: none; }

      /* sizes */
      .chilltimeline-sm { font-size: 13px; }
      .chilltimeline-sm .chilltimeline-item { grid-template-columns: 24px 1fr; column-gap: 10px; }
      .chilltimeline-sm .chilltimeline-marker { width: 24px; height: 24px; font-size: 12px; }
      .chilltimeline-sm .chilltimeline-rail::after { top: 24px; }
      .chilltimeline-lg { font-size: 16px; }
      .chilltimeline-lg .chilltimeline-item { grid-template-columns: 40px 1fr; }
      .chilltimeline-lg .chilltimeline-marker { width: 40px; height: 40px; font-size: 18px; }
      .chilltimeline-lg .chilltimeline-rail::after { top: 40px; }

      /* horizontal */
      .chilltimeline-horizontal { display: flex; overflow-x: auto; padding-bottom: 8px; }
      .chilltimeline-horizontal .chilltimeline-item { display: flex; flex-direction: column; flex: 1 0 180px; padding: 0 16px 0 0; row-gap: 12px; }
      .chilltimeline-horizontal .chilltimeline-rail { justify-content: flex-start; }
      .chilltimeline-horizontal .chilltimeline-rail::after { top: calc(50% - 1px); bottom: auto; left: 40px; right: -16px; width: auto; height: 2px; }
      .chilltimeline-horizontal .chilltimeline-item:last-child .chilltimeline-rail::after { display: none; }
      .chilltimeline-horizontal .chilltimeline-main { padding-top: 0; }

      /* alternate */
      @media (min-width: 640px) {
        .chilltimeline-alternate .chilltimeline-item { grid-template-columns: 1fr 32px 1fr; column-gap: 16px; }
        .chilltimeline-alternate .chilltimeline-item .chilltimeline-rail { grid-column: 2; grid-row: 1; }
        .chilltimeline-alternate .chilltimeline-item .chilltimeline-main { grid-column: 3; grid-row: 1; }
        .chilltimeline-alternate .chilltimeline-item:nth-child(even) .chilltimeline-main { grid-column: 1; text-align: right; }
        .chilltimeline-alternate .chilltimeline-item:nth-child(even) .chilltimeline-head { justify-content: flex-end; }
        .chilltimeline-alternate .chilltimeline-item:nth-child(even) .chilltimeline-toggle { flex-direction: row-reverse; margin-left: auto; margin-right: -4px; }
        .chilltimeline-alternate .chilltimeline-item:nth-child(even) .chilltimeline-body { text-align: left; }
      }

      @media (prefers-reduced-motion: reduce) {
        .chilltimeline-chevron { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function setContent(el, value, html) {
        if (value == null) return;
        if (typeof value === 'object' && value.nodeType) el.appendChild(value);
        else if (html) el.innerHTML = String(value);
        else el.textContent = String(value);
    }

    class ChillTimelineInstance {
        constructor(options, host) {
            injectCSS();
            this.options = Object.assign({
                items: [], layout: 'vertical', size: 'md', collapsible: false, html: false,
                ariaLabel: 'Timeline', onToggle: null, onItemClick: null
            }, options || {});
            this._id = ++uid;
            this._handlers = {};
            this._cleanups = [];
            this.items = [];
            this.element = host || document.createElement('ul');
            this._ownsElement = !host;
            this._prev = host ? { cls: host.className, role: host.getAttribute('role'), label: host.getAttribute('aria-label') } : null;
            this.element.setAttribute('role', 'list');
            this.element.setAttribute('aria-label', this.options.ariaLabel);
            this._applyClasses();
            this.setItems(this.options.items);
        }

        _applyClasses() {
            const o = this.options;
            const keep = this._prev ? this._prev.cls : '';
            this.element.className = (keep + ' chilltimeline chilltimeline-' + o.layout + ' chilltimeline-' + o.size).trim();
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...args) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, args)); }

        setLayout(layout) { this.options.layout = layout; this._applyClasses(); return this; }

        setItems(items) {
            this._clear();
            this.items = (items || []).map(i => Object.assign({}, i));
            this.items.forEach((item, idx) => this.element.appendChild(this._buildItem(item, idx)));
            return this;
        }

        add(item) { this.items.push(Object.assign({}, item)); return this.setItems(this.items); }
        remove(index) { this.items.splice(index, 1); return this.setItems(this.items); }

        _clear() {
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
        }

        _buildItem(item, idx) {
            const o = this.options;
            const status = STATUSES.indexOf(item.status) >= 0 ? item.status : 'default';
            const li = document.createElement('li');
            li.className = 'chilltimeline-item chilltimeline-status-' + status;
            li.setAttribute('role', 'listitem');
            if (item.id != null) li.setAttribute('data-id', String(item.id));

            const rail = document.createElement('div');
            rail.className = 'chilltimeline-rail';
            const marker = document.createElement('span');
            marker.className = 'chilltimeline-marker';
            marker.setAttribute('aria-hidden', 'true');
            if (item.icon != null && item.icon !== '') setContent(marker, item.icon, o.html);
            else { const dot = document.createElement('span'); dot.className = 'chilltimeline-marker-dot'; marker.appendChild(dot); }
            rail.appendChild(marker);

            const main = document.createElement('div');
            main.className = 'chilltimeline-main';

            const collapsible = item.collapsible != null ? !!item.collapsible : !!o.collapsible;
            const hasBody = item.content != null && item.content !== '';
            const head = document.createElement('div');
            head.className = 'chilltimeline-head';
            const title = document.createElement(collapsible && hasBody ? 'span' : 'h3');
            title.className = 'chilltimeline-title';
            setContent(title, item.title, o.html);
            const time = document.createElement('time');
            time.className = 'chilltimeline-time';
            if (item.time != null) {
                setContent(time, item.time, o.html);
                if (item.datetime) time.setAttribute('datetime', String(item.datetime));
            }

            let body = null;
            if (collapsible && hasBody) {
                const open = !!item.open;
                body = document.createElement('div');
                body.className = 'chilltimeline-body';
                body.id = 'chilltimeline-' + this._id + '-body-' + idx;
                setContent(body, item.content, o.html);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chilltimeline-toggle';
                btn.setAttribute('aria-controls', body.id);
                const chev = document.createElement('span');
                chev.className = 'chilltimeline-chevron';
                chev.setAttribute('aria-hidden', 'true');
                btn.appendChild(chev);
                btn.appendChild(title);
                head.appendChild(btn);
                const set = (v, silent) => {
                    item.open = v;
                    li.classList.toggle('chilltimeline-open', v);
                    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
                    body.hidden = !v;
                    if (!silent) {
                        if (typeof o.onToggle === 'function') o.onToggle(item, idx, v);
                        this._emit('toggle', item, idx, v);
                    }
                };
                li._chillSet = set;
                set(open, true);
                const onClick = (e) => { set(!item.open); e.stopPropagation(); };
                btn.addEventListener('click', onClick);
                this._cleanups.push(() => btn.removeEventListener('click', onClick));
            } else {
                head.appendChild(title);
            }
            if (item.time != null) head.appendChild(time);
            main.appendChild(head);

            if (item.description != null && item.description !== '') {
                const p = document.createElement('p');
                p.className = 'chilltimeline-desc';
                setContent(p, item.description, o.html);
                main.appendChild(p);
            }
            if (body) main.appendChild(body);
            else if (hasBody) {
                const b = document.createElement('div');
                b.className = 'chilltimeline-body';
                setContent(b, item.content, o.html);
                main.appendChild(b);
            }

            li.appendChild(rail);
            li.appendChild(main);

            {
                const onItem = (e) => {
                    if (typeof o.onItemClick === 'function') o.onItemClick(item, idx, e);
                    this._emit('itemClick', item, idx, e);
                };
                li.addEventListener('click', onItem);
                this._cleanups.push(() => li.removeEventListener('click', onItem));
            }
            li.setAttribute('data-status', status);
            return li;
        }

        toggle(index, force) {
            const li = this.element.children[index];
            if (!li || !li._chillSet) return this;
            const item = this.items[index];
            li._chillSet(force == null ? !item.open : !!force);
            return this;
        }
        expandAll() { for (let i = 0; i < this.element.children.length; i++) this.toggle(i, true); return this; }
        collapseAll() { for (let i = 0; i < this.element.children.length; i++) this.toggle(i, false); return this; }

        destroy() {
            this._clear();
            this._handlers = {};
            if (this._ownsElement) { if (this.element.parentNode) this.element.parentNode.removeChild(this.element); }
            else {
                this.element.className = this._prev.cls;
                ['role', 'aria-label'].forEach(a => this.element.removeAttribute(a));
                if (this._prev.role) this.element.setAttribute('role', this._prev.role);
                if (this._prev.label) this.element.setAttribute('aria-label', this._prev.label);
            }
        }
    }

    const ChillTimeline = {
        version: VERSION,

        create(options) { return new ChillTimelineInstance(options); },

        /** Enhance an existing <ul>/<ol>; each <li> becomes an item (text → title). */
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const opts = Object.assign({}, options);
            if (!opts.items) {
                opts.items = Array.prototype.map.call(host.children, li => ({
                    title: li.getAttribute('data-title') || li.textContent.trim(),
                    time: li.getAttribute('data-time') || undefined,
                    status: li.getAttribute('data-status') || undefined,
                    icon: li.getAttribute('data-icon') || undefined,
                    description: li.getAttribute('data-description') || undefined
                }));
            }
            return new ChillTimelineInstance(opts, host);
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTimeline;
    } else {
        window.ChillTimeline = ChillTimeline;
    }

})(typeof window !== 'undefined' ? window : this);
