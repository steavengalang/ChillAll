/**
 * ChillTree - Zero-dependency tree view (WAI-ARIA treeview pattern)
 *
 * @example
 *   const tree = ChillTree.create({
 *     nodes: [
 *       { id: 'src', label: 'src', children: [{ id: 'a', label: 'a.js' }, { id: 'b', label: 'b.js' }] },
 *       { id: 'lazy', label: 'Remote', hasChildren: true }        // children loaded on first expand
 *     ],
 *     checkable: true,
 *     searchable: true,
 *     loadChildren: (node) => fetch('/api/' + node.id).then(r => r.json()),   // -> [{id,label,…}]
 *     onSelect: (node) => console.log('selected', node.id),
 *     onCheck: (checkedIds) => {}
 *   });
 *   document.body.appendChild(tree.element);
 *
 * Node: { id, label, icon?, children?, hasChildren? (lazy), expanded?, checked?, disabled?, data? }
 *
 * Options
 *   nodes         Array<Node>                                             default []
 *   checkable     show tri-state checkboxes (parents cascade to children) default false
 *   selectable    clicking / Enter selects a node                          default true
 *   multiple      allow several selected nodes (Ctrl/Cmd+click)            default false
 *   searchable    render a filter input above the tree                     default false
 *   placeholder   filter input placeholder                                 default 'Filter…'
 *   loadChildren  (node) => Promise<Node[]> | Node[]                       default null
 *   filterFn      (node, query) => boolean                                 default case-insensitive label match
 *   expandAll     expand all initially                                     default false
 *   html          treat labels/icons as HTML (UNSAFE with untrusted data)  default false
 *   ariaLabel     accessible name of the tree                              default 'Tree'
 *   onSelect(node) onCheck(checkedIds, node) onExpand(node) onCollapse(node) onLoad(node, children) onError(node, err)
 *
 * Methods: setNodes(nodes), getNode(id), expand(id), collapse(id), toggle(id), expandAll(), collapseAll(),
 *          select(id), getSelected(), setChecked(id, bool), getChecked(), filter(query), focus(id),
 *          on(evt, fn), off(evt, fn), destroy()
 * Events:  select, check, expand, collapse, load, error
 *
 * Keyboard: Up/Down move, Right expand / first child, Left collapse / parent, Home/End, Enter select,
 *           Space toggle checkbox (or select), '*' expand siblings, type-ahead by first letters.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilltree-styles';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chilltree-text: #171717;
        --chilltree-muted: #6b7280;
        --chilltree-bg: #ffffff;
        --chilltree-hover: #f3f4f6;
        --chilltree-border: #e5e5e5;
        --chilltree-primary: #3b82f6;
        --chilltree-selected-bg: rgba(59,130,246,.12);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltree-text: #fafafa;
          --chilltree-muted: #a3a3a3;
          --chilltree-bg: #171717;
          --chilltree-hover: #262626;
          --chilltree-border: #404040;
          --chilltree-selected-bg: rgba(59,130,246,.25);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chilltree-text: #fafafa;
        --chilltree-muted: #a3a3a3;
        --chilltree-bg: #171717;
        --chilltree-hover: #262626;
        --chilltree-border: #404040;
        --chilltree-selected-bg: rgba(59,130,246,.25);
      }

      .chilltree { color: var(--chilltree-text); font-size: 14px; line-height: 1.4; font-family: inherit; box-sizing: border-box; }
      .chilltree *, .chilltree *::before, .chilltree *::after { box-sizing: border-box; }
      .chilltree-search { width: 100%; min-height: 36px; margin-bottom: 8px; padding: 0 12px; font: inherit; color: inherit; background: var(--chilltree-bg); border: 1px solid var(--chilltree-border); border-radius: 8px; transition: border-color .18s ease, box-shadow .18s ease; }
      .chilltree-search:focus-visible { outline: none; border-color: var(--chilltree-primary); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chilltree-list, .chilltree-group { list-style: none; margin: 0; padding: 0; }
      .chilltree-group { }
      .chilltree-item { margin: 0; padding: 0; outline: none; }
      .chilltree-row { display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 8px 0 calc(var(--chilltree-level, 1) * 18px - 12px); border-radius: 8px; cursor: pointer; user-select: none; transition: background .15s ease; }
      .chilltree-row:hover { background: var(--chilltree-hover); }
      .chilltree-item:focus-visible > .chilltree-row { outline: 2px solid var(--chilltree-primary); outline-offset: -2px; }
      .chilltree-item[aria-selected="true"] > .chilltree-row { background: var(--chilltree-selected-bg); }
      .chilltree-item[aria-disabled="true"] > .chilltree-row { opacity: .5; cursor: not-allowed; }
      .chilltree-toggle { width: 20px; height: 20px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; }
      .chilltree-toggle::before { content: ""; width: 6px; height: 6px; border-right: 2px solid var(--chilltree-muted); border-bottom: 2px solid var(--chilltree-muted); transform: rotate(-45deg); transition: transform .15s ease; }
      .chilltree-item[aria-expanded="true"] > .chilltree-row > .chilltree-toggle::before { transform: rotate(45deg); }
      .chilltree-leaf > .chilltree-row > .chilltree-toggle::before { display: none; }
      .chilltree-loading > .chilltree-row > .chilltree-toggle::before { width: 12px; height: 12px; border: 2px solid var(--chilltree-border); border-top-color: var(--chilltree-primary); border-radius: 50%; transform: none; animation: chilltree-spin .7s linear infinite; }
      @keyframes chilltree-spin { to { transform: rotate(360deg); } }
      .chilltree-check { width: 16px; height: 16px; flex-shrink: 0; border: 2px solid var(--chilltree-muted); border-radius: 4px; position: relative; background: var(--chilltree-bg); transition: background .15s ease, border-color .15s ease; }
      .chilltree-item[aria-checked="true"] > .chilltree-row > .chilltree-check, .chilltree-item[aria-checked="mixed"] > .chilltree-row > .chilltree-check { background: var(--chilltree-primary); border-color: var(--chilltree-primary); }
      .chilltree-item[aria-checked="true"] > .chilltree-row > .chilltree-check::after { content: ""; position: absolute; left: 3px; top: 0; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
      .chilltree-item[aria-checked="mixed"] > .chilltree-row > .chilltree-check::after { content: ""; position: absolute; left: 2px; top: 5px; width: 8px; height: 2px; background: #fff; }
      .chilltree-icon { flex-shrink: 0; }
      .chilltree-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chilltree-mark { background: rgba(245,158,11,.35); color: inherit; border-radius: 2px; }
      .chilltree-group[hidden], .chilltree-item[hidden] { display: none; }
      .chilltree-empty { padding: 12px; color: var(--chilltree-muted); text-align: center; }
      .chilltree-empty[hidden] { display: none; }
      @media (prefers-reduced-motion: reduce) {
        .chilltree-row, .chilltree-toggle::before, .chilltree-check, .chilltree-search { transition: none; }
        .chilltree-loading > .chilltree-row > .chilltree-toggle::before { animation-duration: 2s; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    class ChillTreeInstance {
        constructor(options, host) {
            injectCSS();
            this.options = Object.assign({
                nodes: [], checkable: false, selectable: true, multiple: false, searchable: false, placeholder: 'Filter…',
                loadChildren: null, filterFn: null, expandAll: false, html: false, ariaLabel: 'Tree',
                onSelect: null, onCheck: null, onExpand: null, onCollapse: null, onLoad: null, onError: null
            }, options || {});
            this._id = ++uid;
            this._handlers = {};
            this._destroyed = false;
            this._map = new Map();
            this._query = '';
            this._typed = '';
            this._typedTimer = null;
            this._focused = null;
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this.element.className = (this._prevClass + ' chilltree').trim();

            if (this.options.searchable) {
                const input = document.createElement('input');
                input.type = 'search';
                input.className = 'chilltree-search';
                input.placeholder = this.options.placeholder;
                input.setAttribute('aria-label', 'Filter tree');
                input.setAttribute('aria-controls', 'chilltree-' + this._id);
                this._onInput = () => this.filter(input.value);
                input.addEventListener('input', this._onInput);
                this._search = input;
                this.element.appendChild(input);
            }
            this._list = document.createElement('ul');
            this._list.className = 'chilltree-list';
            this._list.id = 'chilltree-' + this._id;
            this._list.setAttribute('role', 'tree');
            this._list.setAttribute('aria-label', this.options.ariaLabel);
            if (this.options.multiple || this.options.checkable) this._list.setAttribute('aria-multiselectable', 'true');
            this.element.appendChild(this._list);
            this._empty = document.createElement('div');
            this._empty.className = 'chilltree-empty';
            this._empty.setAttribute('role', 'status');
            this._empty.textContent = 'No matches';
            this._empty.hidden = true;
            this.element.appendChild(this._empty);

            this._onClick = (e) => this._handleClick(e);
            this._onKey = (e) => this._handleKey(e);
            this._onFocusIn = (e) => { const li = e.target.closest && e.target.closest('.chilltree-item'); if (li && li._node) this._setFocus(li._node, false); };
            this._list.addEventListener('click', this._onClick);
            this._list.addEventListener('keydown', this._onKey);
            this._list.addEventListener('focusin', this._onFocusIn);

            this.setNodes(this.options.nodes);
        }

        /* ---------------- events ---------------- */
        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...args) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, args)); }
        _cb(name, ...args) { const f = this.options[name]; if (typeof f === 'function') f.apply(this, args); }

        /* ---------------- model ---------------- */
        _wrap(raw, parent) {
            const id = raw.id != null ? String(raw.id) : 'n' + (++uid);
            const n = {
                id, label: raw.label != null ? String(raw.label) : id, icon: raw.icon, data: raw.data, raw,
                parent, children: null, lazy: false, loaded: true, loading: false,
                expanded: !!raw.expanded || (this.options.expandAll && !!(raw.children || raw.hasChildren)),
                checked: !!raw.checked, mixed: false, disabled: !!raw.disabled, selected: false, matches: true, el: null
            };
            if (Array.isArray(raw.children)) n.children = raw.children.map(c => this._wrap(c, n));
            else if (raw.hasChildren) { n.lazy = true; n.loaded = false; n.children = []; }
            this._map.set(id, n);
            return n;
        }

        _isParent(n) { return !!(n.children && (n.children.length || n.lazy)); }

        setNodes(nodes) {
            this._map.clear();
            this._focused = null;
            this.roots = (nodes || []).map(n => this._wrap(n, null));
            if (this.options.checkable) this.roots.forEach(n => this._initChecks(n));
            this._renderAll();
            return this;
        }

        _initChecks(n) {
            if (n.children && n.children.length) {
                n.children.forEach(c => { if (n.checked && !c.disabled) c.checked = true; this._initChecks(c); });
                this._refreshFromChildren(n);
            }
        }

        _refreshFromChildren(n) {
            const ch = n.children.filter(c => !c.disabled || c.checked || c.mixed);
            if (!ch.length) return;
            const all = ch.every(c => c.checked && !c.mixed);
            const none = ch.every(c => !c.checked && !c.mixed);
            n.checked = all;
            n.mixed = !all && !none;
        }

        getNode(id) { const n = this._map.get(String(id)); return n ? this._public(n) : null; }
        _public(n) { return { id: n.id, label: n.label, data: n.data, checked: n.checked, mixed: n.mixed, expanded: n.expanded, selected: n.selected, disabled: n.disabled, raw: n.raw }; }

        /* ---------------- rendering ---------------- */
        _renderAll() {
            while (this._list.firstChild) this._list.removeChild(this._list.firstChild);
            this.roots.forEach((n, i) => this._list.appendChild(this._build(n, 1, i + 1, this.roots.length)));
            this._applyFilter();
            this._ensureFocusable();
        }

        _setText(el, value) {
            if (this.options.html) el.innerHTML = String(value); else el.textContent = String(value);
        }

        _build(n, level, pos, size) {
            const o = this.options;
            const li = document.createElement('li');
            li._node = n; n.el = li;
            li.className = 'chilltree-item';
            li.setAttribute('role', 'treeitem');
            li.setAttribute('aria-level', String(level));
            li.setAttribute('aria-setsize', String(size));
            li.setAttribute('aria-posinset', String(pos));
            li.setAttribute('data-id', n.id);
            li.tabIndex = -1;
            const row = document.createElement('div');
            row.className = 'chilltree-row';
            row.style.setProperty('--chilltree-level', String(level));
            const tog = document.createElement('span');
            tog.className = 'chilltree-toggle';
            tog.setAttribute('aria-hidden', 'true');
            row.appendChild(tog);
            if (o.checkable) {
                const c = document.createElement('span');
                c.className = 'chilltree-check';
                c.setAttribute('aria-hidden', 'true');
                row.appendChild(c);
            }
            if (n.icon != null && n.icon !== '') {
                const ic = document.createElement('span');
                ic.className = 'chilltree-icon';
                ic.setAttribute('aria-hidden', 'true');
                if (typeof n.icon === 'object' && n.icon.nodeType) ic.appendChild(n.icon); else this._setText(ic, n.icon);
                row.appendChild(ic);
            }
            const label = document.createElement('span');
            label.className = 'chilltree-label';
            label.id = 'chilltree-' + this._id + '-l-' + n.id.replace(/\s+/g, '_');
            this._setText(label, n.label);
            row.appendChild(label);
            li.setAttribute('aria-labelledby', label.id);
            li.appendChild(row);
            if (this._isParent(n)) {
                const g = document.createElement('ul');
                g.className = 'chilltree-group';
                g.setAttribute('role', 'group');
                n.groupEl = g;
                (n.children || []).forEach((c, i) => g.appendChild(this._build(c, level + 1, i + 1, n.children.length)));
                li.appendChild(g);
            }
            n.labelEl = label;
            this._sync(n);
            return li;
        }

        /** Push model state of one node into its DOM. */
        _sync(n) {
            const li = n.el; if (!li) return;
            const parent = this._isParent(n);
            li.classList.toggle('chilltree-leaf', !parent);
            li.classList.toggle('chilltree-loading', n.loading);
            if (parent) li.setAttribute('aria-expanded', n.expanded ? 'true' : 'false'); else li.removeAttribute('aria-expanded');
            if (n.groupEl) n.groupEl.hidden = !this._effExpanded(n);
            if (this.options.checkable) li.setAttribute('aria-checked', n.mixed ? 'mixed' : n.checked ? 'true' : 'false');
            if (this.options.selectable || this.options.multiple) li.setAttribute('aria-selected', n.selected ? 'true' : 'false');
            if (n.disabled) li.setAttribute('aria-disabled', 'true'); else li.removeAttribute('aria-disabled');
            li.tabIndex = n === this._focused ? 0 : -1;
            if (n.loading) li.setAttribute('aria-busy', 'true'); else li.removeAttribute('aria-busy');
        }

        _syncAll() { this._map.forEach(n => this._sync(n)); }

        _effExpanded(n) { return this._query ? (n.expanded || n.forceOpen) : n.expanded; }

        _visible() {
            const out = [];
            const walk = (list) => list.forEach(n => {
                if (!n.matches) return;
                out.push(n);
                if (n.children && n.children.length && this._effExpanded(n)) walk(n.children);
            });
            walk(this.roots);
            return out;
        }

        /* ---------------- focus ---------------- */
        _ensureFocusable() {
            if (this._focused && this._map.get(this._focused.id) === this._focused && this._focused.matches) { this._sync(this._focused); return; }
            const first = this._visible()[0] || null;
            this._focused = first;
            if (first) first.el.tabIndex = 0;
        }

        _setFocus(n, move) {
            if (!n) return;
            if (this._focused && this._focused !== n && this._focused.el) this._focused.el.tabIndex = -1;
            this._focused = n;
            n.el.tabIndex = 0;
            if (move !== false) n.el.focus();
        }

        focus(id) { const n = this._map.get(String(id)); if (n) this._setFocus(n, true); return this; }

        /* ---------------- interaction ---------------- */
        _handleClick(e) {
            const li = e.target.closest && e.target.closest('.chilltree-item');
            if (!li || !li._node || !this._list.contains(li)) return;
            const n = li._node;
            if (n.disabled) return;
            this._setFocus(n, true);
            if (e.target.closest('.chilltree-toggle')) { this.toggle(n.id); return; }
            if (this.options.checkable && e.target.closest('.chilltree-check')) { this._toggleCheck(n); return; }
            if (this.options.selectable) this._select(n, e.ctrlKey || e.metaKey);
            else if (this._isParent(n)) this.toggle(n.id);
        }

        _handleKey(e) {
            const li = e.target.closest && e.target.closest('.chilltree-item');
            if (!li || !li._node || e.altKey || e.ctrlKey || e.metaKey) return;
            const n = li._node;
            const vis = this._visible();
            const i = vis.indexOf(n);
            let handled = true;
            switch (e.key) {
                case 'ArrowDown': this._setFocus(vis[Math.min(vis.length - 1, i + 1)]); break;
                case 'ArrowUp': this._setFocus(vis[Math.max(0, i - 1)]); break;
                case 'Home': this._setFocus(vis[0]); break;
                case 'End': this._setFocus(vis[vis.length - 1]); break;
                case 'ArrowRight':
                    if (this._isParent(n)) {
                        if (!this._effExpanded(n)) this.expand(n.id);
                        else if (n.children.length) this._setFocus(n.children.find(c => c.matches) || n.children[0]);
                    }
                    break;
                case 'ArrowLeft':
                    if (this._isParent(n) && this._effExpanded(n)) { if (this._query) n.forceOpen = false; this.collapse(n.id); }
                    else if (n.parent) this._setFocus(n.parent);
                    break;
                case 'Enter':
                    if (n.disabled) break;
                    if (this.options.selectable) this._select(n, false);
                    else if (this._isParent(n)) this.toggle(n.id);
                    break;
                case ' ':
                    if (n.disabled) break;
                    if (this.options.checkable) this._toggleCheck(n);
                    else if (this.options.selectable) this._select(n, e.shiftKey || false);
                    break;
                case '*': {
                    const sibs = n.parent ? n.parent.children : this.roots;
                    sibs.forEach(s => { if (this._isParent(s)) this.expand(s.id); });
                    break;
                }
                default:
                    if (e.key.length === 1 && /\S/.test(e.key)) {
                        clearTimeout(this._typedTimer);
                        this._typed += e.key.toLowerCase();
                        this._typedTimer = setTimeout(() => { this._typed = ''; this._typedTimer = null; }, 600);
                        const order = vis.slice(i + 1).concat(vis.slice(0, i + 1));
                        const hit = order.find(c => c.label.toLowerCase().indexOf(this._typed) === 0);
                        if (hit) this._setFocus(hit);
                    } else handled = false;
            }
            if (handled) e.preventDefault();
        }

        _select(n, additive) {
            if (n.disabled) return;
            if (!(this.options.multiple && additive)) this._map.forEach(m => { if (m !== n) m.selected = false; });
            n.selected = this.options.multiple && additive ? !n.selected : true;
            this._syncAll();
            this._cb('onSelect', this._public(n));
            this._emit('select', this._public(n));
        }

        select(id) { const n = this._map.get(String(id)); if (n) this._select(n, false); return this; }
        getSelected() { const out = []; this._map.forEach(n => { if (n.selected) out.push(this._public(n)); }); return out; }

        _toggleCheck(n) { this.setChecked(n.id, !(n.checked && !n.mixed)); }

        setChecked(id, value) {
            const n = this._map.get(String(id));
            if (!n || n.disabled) return this;
            const v = !!value;
            const cascade = (m) => {
                m.checked = v; m.mixed = false;
                if (m.children) m.children.forEach(c => { if (!c.disabled) cascade(c); });
            };
            cascade(n);
            for (let p = n.parent; p; p = p.parent) this._refreshFromChildren(p);
            this._syncAll();
            const ids = this.getChecked();
            this._cb('onCheck', ids, this._public(n));
            this._emit('check', ids, this._public(n));
            return this;
        }

        /** Ids of fully checked nodes (a checked parent implies its children, which are listed too). */
        getChecked() { const out = []; this._map.forEach(n => { if (n.checked && !n.mixed) out.push(n.id); }); return out; }

        /* ---------------- expand / collapse / lazy ---------------- */
        expand(id) {
            const n = this._map.get(String(id));
            if (!n || !this._isParent(n) || n.disabled) return this;
            if (n.lazy && !n.loaded) { this._load(n); return this; }
            if (!n.expanded) {
                n.expanded = true;
                this._sync(n);
                this._cb('onExpand', this._public(n));
                this._emit('expand', this._public(n));
            } else if (this._query && !n.forceOpen) this._sync(n);
            return this;
        }

        collapse(id) {
            const n = this._map.get(String(id));
            if (!n || !this._isParent(n)) return this;
            if (this._focused && this._focused !== n) { for (let p = this._focused.parent; p; p = p.parent) if (p === n) { this._setFocus(n, true); break; } }
            if (n.expanded || n.forceOpen) {
                n.expanded = false; n.forceOpen = false;
                this._sync(n);
                this._cb('onCollapse', this._public(n));
                this._emit('collapse', this._public(n));
            }
            return this;
        }

        toggle(id) {
            const n = this._map.get(String(id));
            if (!n) return this;
            return this._effExpanded(n) ? this.collapse(id) : this.expand(id);
        }

        expandAll() { this._map.forEach(n => { if (this._isParent(n) && !(n.lazy && !n.loaded)) { n.expanded = true; this._sync(n); } }); return this; }
        collapseAll() { this._map.forEach(n => { n.expanded = false; n.forceOpen = false; this._sync(n); }); this._ensureFocusable(); return this; }

        _load(n) {
            if (n.loading) return;
            const fn = this.options.loadChildren;
            if (typeof fn !== 'function') { n.lazy = false; n.loaded = true; n.children = []; this._sync(n); return; }
            n.loading = true;
            this._sync(n);
            let p;
            try { p = Promise.resolve(fn(this._public(n))); } catch (e) { p = Promise.reject(e); }
            p.then(list => {
                if (this._destroyed || this._map.get(n.id) !== n) return;
                n.loading = false;
                n.loaded = true;
                n.lazy = false;
                n.children = (list || []).map(c => this._wrap(c, n));
                if (this.options.checkable && n.checked) n.children.forEach(c => { if (!c.disabled) { c.checked = true; this._initChecks(c); } });
                if (n.groupEl) while (n.groupEl.firstChild) n.groupEl.removeChild(n.groupEl.firstChild);
                else { n.groupEl = document.createElement('ul'); n.groupEl.className = 'chilltree-group'; n.groupEl.setAttribute('role', 'group'); n.el.appendChild(n.groupEl); }
                const level = Number(n.el.getAttribute('aria-level')) + 1;
                n.children.forEach((c, i) => n.groupEl.appendChild(this._build(c, level, i + 1, n.children.length)));
                n.expanded = n.children.length > 0;
                this._applyFilter();
                this._sync(n);
                this._cb('onLoad', this._public(n), n.children.map(c => this._public(c)));
                this._emit('load', this._public(n), n.children.map(c => this._public(c)));
                if (n.expanded) { this._cb('onExpand', this._public(n)); this._emit('expand', this._public(n)); }
            }).catch(err => {
                if (this._destroyed) return;
                n.loading = false;
                this._sync(n);
                this._cb('onError', this._public(n), err);
                this._emit('error', this._public(n), err);
            });
        }

        /* ---------------- filter ---------------- */
        filter(query) {
            this._query = String(query == null ? '' : query).trim();
            if (this._search && this._search.value !== query && query != null) this._search.value = query;
            this._applyFilter();
            this._ensureFocusable();
            return this;
        }

        _applyFilter() {
            const q = this._query;
            const fn = this.options.filterFn || ((n, s) => n.label.toLowerCase().indexOf(s.toLowerCase()) >= 0);
            const walk = (n) => {
                n.forceOpen = false;
                let childMatch = false;
                (n.children || []).forEach(c => { if (walk(c)) childMatch = true; });
                const self = !q || !!fn(this._public(n), q);
                n.matches = !q || self || childMatch;
                if (q && childMatch) n.forceOpen = true;
                return n.matches;
            };
            let any = false;
            this.roots.forEach(n => { if (walk(n)) any = true; });
            this._map.forEach(n => {
                if (!n.el) return;
                n.el.hidden = !n.matches;
                if (n.labelEl) this._markLabel(n, q);
                this._sync(n);
            });
            this._empty.hidden = any || !q;
        }

        _markLabel(n, q) {
            if (this.options.html) return;
            const el = n.labelEl;
            const text = n.label;
            const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
            el.textContent = '';
            if (idx < 0) { el.textContent = text; return; }
            el.appendChild(document.createTextNode(text.slice(0, idx)));
            const m = document.createElement('mark');
            m.className = 'chilltree-mark';
            m.textContent = text.slice(idx, idx + q.length);
            el.appendChild(m);
            el.appendChild(document.createTextNode(text.slice(idx + q.length)));
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            clearTimeout(this._typedTimer);
            this._list.removeEventListener('click', this._onClick);
            this._list.removeEventListener('keydown', this._onKey);
            this._list.removeEventListener('focusin', this._onFocusIn);
            if (this._search) this._search.removeEventListener('input', this._onInput);
            this._map.clear();
            this._handlers = {};
            while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
            if (this._ownsElement) { if (this.element.parentNode) this.element.parentNode.removeChild(this.element); }
            else this.element.className = this._prevClass;
        }
    }

    function fromList(ul) {
        return Array.prototype.map.call(ul.children, li => {
            const sub = Array.prototype.find.call(li.children, c => c.tagName === 'UL' || c.tagName === 'OL');
            const label = Array.prototype.filter.call(li.childNodes, n => n !== sub).map(n => n.textContent).join('').trim();
            const node = { id: li.getAttribute('data-id') || undefined, label };
            if (sub) node.children = fromList(sub);
            return node;
        });
    }

    const ChillTree = {
        version: VERSION,
        create(options) { return new ChillTreeInstance(options); },
        /** Enhance a nested <ul> (or an empty container when `nodes` is passed in options). */
        init(selectorOrElement, options) {
            let host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const opts = Object.assign({}, options);
            if (!opts.nodes) {
                const ul = host.tagName === 'UL' || host.tagName === 'OL' ? host : host.querySelector('ul,ol');
                opts.nodes = ul ? fromList(ul) : [];
            }
            if (host.tagName === 'UL' || host.tagName === 'OL') {
                // a list cannot host the tree widget: swap it for a wrapper <div> (removed again on destroy)
                const wrap = document.createElement('div');
                if (host.id) wrap.id = host.id;
                if (host.parentNode) host.parentNode.replaceChild(wrap, host);
                host = wrap;
            } else while (host.firstChild) host.removeChild(host.firstChild);
            return new ChillTreeInstance(opts, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTree;
    } else {
        window.ChillTree = ChillTree;
    }

})(typeof window !== 'undefined' ? window : this);
