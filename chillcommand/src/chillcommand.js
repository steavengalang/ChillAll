/**
 * ChillCommand - Zero-dependency Command Palette Component
 *
 * @example
 *   const palette = ChillCommand.init({
 *     commands: [
 *       { id: 'new', label: 'New file', group: 'File', shortcut: 'mod+n', keywords: ['create', 'add'], action: () => newFile() },
 *       { id: 'theme', label: 'Toggle theme', icon: '🌓', action: () => ChillTheme.toggle() }
 *     ],
 *     shortcut: 'mod+k',          // Cmd+K on macOS, Ctrl+K elsewhere ('k' alone is treated as 'mod+k')
 *     onSelect: cmd => console.log(cmd.id)
 *   });
 *   palette.open(); palette.close(); palette.toggle(); palette.setCommands([...]); palette.destroy();
 *
 * Features: fuzzy matching with highlighted characters (label + keywords), grouped results, full keyboard support
 * (Up/Down/Home/End/PageUp/PageDown/Enter/Esc), combobox + listbox ARIA with aria-activedescendant, focus is moved into the
 * input on open, kept inside the dialog (Tab) and restored to the previously focused element on close.
 *
 * Options:
 *   commands      array   []                 { id, label, group = 'Commands', icon, shortcut, keywords (string | string[]),
 *                                              disabled, action(cmd) }
 *   placeholder   string  'Type a command...'
 *   shortcut      string | false  'k'        global hotkey; false disables it. "mod" = Cmd on Mac / Ctrl elsewhere
 *   emptyText     string  'No commands found'
 *   label         string  'Command palette'  accessible name of the dialog
 *   footer        boolean true               show the key hints
 *   closeOnSelect boolean true
 *   html          boolean false              OPT-IN: string `icon` values are inserted as HTML (trusted markup only). Otherwise
 *                                            strings are shown as text; Element/Node icons are always allowed. Labels, groups
 *                                            and shortcuts are always text.
 *   onSelect(cmd, instance), onOpen(instance), onClose(instance), onQuery(query, instance)
 *
 * Instance: open(query?), close(), toggle(), setCommands(list), getCommands(), isOpen, destroy()
 * Fuzzy helper: ChillCommand.fuzzy(query, text) -> { score, indices } | null
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillcommand_css_injected__';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chillcommand-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillcommand-styles';
        style.textContent = `
      :root { --chillcmd-bg: #ffffff; --chillcmd-text: #171717; --chillcmd-text-muted: #6b7280; --chillcmd-border: #e5e5e5; --chillcmd-hover: #f5f5f5; --chillcmd-active: #3b82f6; --chillcmd-active-bg: #eff6ff; --chillcmd-mark: #2563eb; --chillcmd-overlay: rgba(0,0,0,0.5); --chillcmd-ring: rgba(59,130,246,0.45); }
      @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not(.light) { --chillcmd-bg: #1f1f1f; --chillcmd-text: #fafafa; --chillcmd-text-muted: #a3a3a3; --chillcmd-border: #333; --chillcmd-hover: #2a2a2a; --chillcmd-active-bg: #1e293b; --chillcmd-mark: #60a5fa; } }
      :root[data-theme="dark"], :root.dark { --chillcmd-bg: #1f1f1f; --chillcmd-text: #fafafa; --chillcmd-text-muted: #a3a3a3; --chillcmd-border: #333; --chillcmd-hover: #2a2a2a; --chillcmd-active-bg: #1e293b; --chillcmd-mark: #60a5fa; }
      .chillcmd-overlay { position: fixed; inset: 0; background: var(--chillcmd-overlay); z-index: 10001; opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; }
      .chillcmd-overlay.open { opacity: 1; visibility: visible; }
      .chillcmd { position: fixed; top: 20%; left: 50%; transform: translateX(-50%) translateY(-20px); width: calc(100% - 32px); max-width: 600px; background: var(--chillcmd-bg); color: var(--chillcmd-text); border: 1px solid var(--chillcmd-border); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); z-index: 10001; opacity: 0; visibility: hidden; transition: opacity 0.2s, transform 0.2s, visibility 0.2s; overflow: hidden; font-size: 14px; box-sizing: border-box; }
      .chillcmd.open { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
      .chillcmd-input-wrap { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--chillcmd-border); }
      .chillcmd-icon { width: 20px; height: 20px; color: var(--chillcmd-text-muted); flex-shrink: 0; }
      .chillcmd-input { flex: 1; min-width: 0; font: inherit; font-size: 16px; background: none; border: none; outline: none; color: var(--chillcmd-text); }
      .chillcmd-input::placeholder { color: var(--chillcmd-text-muted); }
      .chillcmd-input-wrap:focus-within { box-shadow: inset 0 -2px 0 var(--chillcmd-active); }
      .chillcmd-list { max-height: min(400px, 60vh); overflow-y: auto; padding: 8px; }
      .chillcmd-group { margin-bottom: 8px; }
      .chillcmd-group:last-child { margin-bottom: 0; }
      .chillcmd-group-title { padding: 8px 12px; font-size: 12px; font-weight: 600; color: var(--chillcmd-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .chillcmd-item { display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 8px 16px; box-sizing: border-box; border-radius: 8px; cursor: pointer; transition: background 0.1s; }
      .chillcmd-item:hover { background: var(--chillcmd-hover); }
      .chillcmd-item.active { background: var(--chillcmd-active-bg); box-shadow: inset 0 0 0 1px var(--chillcmd-active); }
      .chillcmd-item[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
      .chillcmd-item-icon { display: inline-flex; width: 18px; height: 18px; color: var(--chillcmd-text-muted); flex-shrink: 0; align-items: center; justify-content: center; }
      .chillcmd-item-icon svg { width: 100%; height: 100%; }
      .chillcmd-item-text { flex: 1; min-width: 0; font-size: 14px; color: var(--chillcmd-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chillcmd-item-text mark { background: none; color: var(--chillcmd-mark); font-weight: 700; }
      .chillcmd-item-shortcut { font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--chillcmd-text-muted); white-space: nowrap; }
      .chillcmd-empty { padding: 24px; text-align: center; color: var(--chillcmd-text-muted); font-size: 14px; }
      .chillcmd-footer { display: flex; gap: 16px; padding: 12px 20px; border-top: 1px solid var(--chillcmd-border); font-size: 12px; color: var(--chillcmd-text-muted); }
      .chillcmd-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      @media (prefers-reduced-motion: reduce) { .chillcmd-overlay, .chillcmd, .chillcmd-item { transition: none; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---------- helpers ----------
    function isMac() {
        try {
            const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
            return /mac|iphone|ipad|ipod/i.test(p);
        } catch (e) { return false; }
    }

    const SYMBOLS_MAC = { mod: '⌘', cmd: '⌘', meta: '⌘', ctrl: '⌃', alt: '⌥', option: '⌥', shift: '⇧', enter: '↵', esc: 'Esc', backspace: '⌫' };
    const SYMBOLS_OTHER = { mod: 'Ctrl', cmd: 'Win', meta: 'Win', ctrl: 'Ctrl', alt: 'Alt', option: 'Alt', shift: 'Shift', enter: 'Enter', esc: 'Esc', backspace: 'Backspace' };

    /** "mod+shift+p" -> "⌘⇧P" (mac) / "Ctrl+Shift+P"; anything that is not a +-combo is returned untouched. */
    function formatShortcut(s) {
        s = String(s);
        if (!/^[A-Za-z0-9]+(\+[A-Za-z0-9\/\[\]\\.,;'`=-]+)+$/.test(s) || !/(^|\+)(mod|cmd|meta|ctrl|alt|option|shift)(\+|$)/i.test(s)) return s;
        const mac = isMac(), map = mac ? SYMBOLS_MAC : SYMBOLS_OTHER;
        const parts = s.split('+').map(function (p) {
            const l = p.toLowerCase();
            return map[l] || (p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1));
        });
        return parts.join(mac ? '' : '+');
    }

    function parseHotkey(spec) {
        const mac = isMac();
        const mods = { ctrl: false, alt: false, shift: false, meta: false };
        let parts = String(spec).toLowerCase().split('+').map(function (p) { return p.trim(); }).filter(Boolean);
        if (parts.length === 1) parts = ['mod', parts[0]]; // backward compat: 'k' => mod+k
        const key = parts.pop();
        parts.forEach(function (p) {
            if (p === 'mod') { if (mac) mods.meta = true; else mods.ctrl = true; }
            else if (p === 'cmd' || p === 'command' || p === 'win') mods.meta = true;
            else if (p === 'control') mods.ctrl = true;
            else if (p === 'option') mods.alt = true;
            else if (Object.prototype.hasOwnProperty.call(mods, p)) mods[p] = true;
        });
        return { key: key === 'esc' ? 'escape' : key, mods: mods };
    }

    function hotkeyMatches(e, hk) {
        const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        let keyOk = k === hk.key;
        if (!keyOk && e.code && /^[a-z]$/.test(hk.key)) keyOk = e.code === 'Key' + hk.key.toUpperCase();
        return keyOk && !!e.ctrlKey === hk.mods.ctrl && !!e.metaKey === hk.mods.meta && !!e.altKey === hk.mods.alt && !!e.shiftKey === hk.mods.shift;
    }

    const NEG = -1e9;
    function isBoundary(t, j) {
        if (j === 0) return true;
        const p = t.charAt(j - 1), c = t.charAt(j);
        if (!/[a-z0-9]/i.test(p)) return true;
        return p === p.toLowerCase() && c !== c.toLowerCase() && /[a-z]/i.test(c); // camelCase
    }

    /**
     * Fuzzy subsequence match with scoring (word starts, consecutive runs and prefixes score higher).
     * Returns null when `query` is not a subsequence of `text`.
     */
    function fuzzy(query, text) {
        const q = String(query == null ? '' : query).toLowerCase().replace(/\s+/g, '');
        const t = String(text == null ? '' : text);
        const tl = t.toLowerCase();
        const m = q.length, n = tl.length;
        if (!m) return { score: 0, indices: [] };
        if (m > n) return null;
        // quick reject
        let pos = 0;
        for (let i = 0; i < m; i++) { pos = tl.indexOf(q.charAt(i), pos); if (pos === -1) return null; pos++; }
        const M = [], P = [];
        for (let i = 0; i < m; i++) {
            M.push(new Array(n).fill(NEG));
            P.push(new Array(n).fill(-1));
        }
        for (let i = 0; i < m; i++) {
            let g = NEG, gArg = -1;
            for (let j = 0; j < n; j++) {
                if (i > 0) {
                    // best earlier match k <= j-2 with a gap penalty of 0.6 per skipped char
                    g -= 0.6;
                    if (j >= 2 && M[i - 1][j - 2] - 0.6 > g) { g = M[i - 1][j - 2] - 0.6; gArg = j - 2; }
                }
                if (tl.charAt(j) !== q.charAt(i)) continue;
                const bonus = 1 + (isBoundary(t, j) ? 8 : 0) + (t.charAt(j) === query.replace(/\s+/g, '').charAt(i) ? 0.5 : 0);
                if (i === 0) {
                    M[0][j] = bonus + (j === 0 ? 6 : 0) - Math.min(j, 12) * 0.3;
                } else {
                    let best = NEG, arg = -1;
                    if (j >= 1 && M[i - 1][j - 1] > NEG / 2) { best = M[i - 1][j - 1] + 6; arg = j - 1; }
                    if (g > best && gArg >= 0) { best = g; arg = gArg; }
                    if (arg >= 0 && best > NEG / 2) { M[i][j] = best + bonus; P[i][j] = arg; }
                }
            }
        }
        let bestJ = -1, bestS = NEG;
        for (let j = 0; j < n; j++) if (M[m - 1][j] > bestS) { bestS = M[m - 1][j]; bestJ = j; }
        if (bestJ < 0) return null;
        const indices = [];
        let j = bestJ;
        for (let i = m - 1; i >= 0; i--) { indices.unshift(j); j = P[i][j]; }
        if (tl.indexOf(q) === 0) bestS += 10;               // prefix
        else if (tl.indexOf(q) > -1) bestS += 4;            // contiguous substring
        return { score: bestS - n * 0.05, indices: indices };
    }

    class ChillCommandInstance {
        constructor(options) {
            options = options || {};
            this.options = Object.assign({
                commands: [], placeholder: 'Type a command...', shortcut: 'k', emptyText: 'No commands found',
                label: 'Command palette', footer: true, closeOnSelect: true, html: false,
                onSelect: null, onOpen: null, onClose: null, onQuery: null
            }, options);
            this.isOpen = false; this.activeIndex = 0; this.filtered = []; this.query = '';
            this._id = 'chillcmd-' + (++uid);
            this._prevFocus = null; this._destroyed = false;
            this.init();
        }
        init() { injectCSS(); this.render(); this.bindEvents(); }

        render() {
            const o = this.options, id = this._id;
            this.overlay = document.createElement('div'); this.overlay.className = 'chillcmd-overlay';
            this.container = document.createElement('div'); this.container.className = 'chillcmd';
            this.container.setAttribute('role', 'dialog'); this.container.setAttribute('aria-modal', 'true');
            this.container.setAttribute('aria-label', o.label);
            this.container.setAttribute('aria-hidden', 'true');

            const wrap = document.createElement('div'); wrap.className = 'chillcmd-input-wrap';
            const NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'chillcmd-icon'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2'); svg.setAttribute('aria-hidden', 'true');
            const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '11'); c.setAttribute('cy', '11'); c.setAttribute('r', '8');
            const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'm21 21-4.35-4.35');
            svg.appendChild(c); svg.appendChild(p);
            this.input = document.createElement('input');
            this.input.type = 'text'; this.input.className = 'chillcmd-input';
            this.input.setAttribute('placeholder', o.placeholder);
            this.input.setAttribute('role', 'combobox'); this.input.setAttribute('aria-expanded', 'true');
            this.input.setAttribute('aria-controls', id + '-list'); this.input.setAttribute('aria-autocomplete', 'list');
            this.input.setAttribute('aria-label', o.label);
            this.input.setAttribute('autocomplete', 'off'); this.input.setAttribute('autocapitalize', 'off');
            this.input.setAttribute('spellcheck', 'false');
            wrap.appendChild(svg); wrap.appendChild(this.input);

            this.list = document.createElement('div'); this.list.className = 'chillcmd-list';
            this.list.id = id + '-list'; this.list.setAttribute('role', 'listbox'); this.list.setAttribute('aria-label', o.label);

            this.status = document.createElement('div'); this.status.className = 'chillcmd-sr';
            this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');

            this.container.appendChild(wrap); this.container.appendChild(this.list); this.container.appendChild(this.status);
            if (o.footer) {
                const f = document.createElement('div'); f.className = 'chillcmd-footer'; f.setAttribute('aria-hidden', 'true');
                ['↑↓ Navigate', '↵ Select', 'Esc Close'].forEach(function (t) { const s = document.createElement('span'); s.textContent = t; f.appendChild(s); });
                this.container.appendChild(f);
            }
            document.body.appendChild(this.overlay); document.body.appendChild(this.container);
            this.filtered = this._filter('');
            this.renderList();
        }

        _filter(query) {
            const cmds = this.options.commands || [];
            const q = String(query || '').trim();
            if (!q) return cmds.map(function (cmd) { return { cmd: cmd, score: 0, indices: [] }; });
            const out = [];
            cmds.forEach(function (cmd) {
                const label = String(cmd.label == null ? '' : cmd.label);
                const hit = fuzzy(q, label);
                let best = hit ? { cmd: cmd, score: hit.score, indices: hit.indices } : null;
                const extra = [].concat(cmd.keywords || [], cmd.group ? [cmd.group] : []).join(' ');
                if (extra) {
                    const k = fuzzy(q, extra);
                    if (k && (!best || k.score * 0.6 > best.score)) best = { cmd: cmd, score: k.score * 0.6, indices: [] };
                }
                if (best) out.push(best);
            });
            out.sort(function (a, b) { return b.score - a.score; });
            return out;
        }

        _highlight(label, indices) {
            const span = document.createElement('span');
            span.className = 'chillcmd-item-text';
            if (!indices.length) { span.textContent = label; return span; }
            const set = {}; indices.forEach(function (i) { set[i] = true; });
            let buf = '', marked = false;
            const flush = function () {
                if (!buf) return;
                if (marked) { const mk = document.createElement('mark'); mk.textContent = buf; span.appendChild(mk); }
                else span.appendChild(document.createTextNode(buf));
                buf = '';
            };
            for (let i = 0; i < label.length; i++) {
                const m = !!set[i];
                if (m !== marked) { flush(); marked = m; }
                buf += label.charAt(i);
            }
            flush();
            return span;
        }

        renderList() {
            const o = this.options, self = this;
            while (this.list.firstChild) this.list.removeChild(this.list.firstChild);
            this.itemEls = [];
            if (!this.filtered.length) {
                const e = document.createElement('div'); e.className = 'chillcmd-empty'; e.textContent = o.emptyText;
                this.list.appendChild(e);
                this.input.removeAttribute('aria-activedescendant');
                this.status.textContent = o.emptyText;
                return;
            }
            const groups = [], byName = {};
            this.filtered.forEach(function (r) {
                const g = r.cmd.group || 'Commands';
                if (!byName[g]) { byName[g] = { name: g, items: [] }; groups.push(byName[g]); }
                byName[g].items.push(r);
            });
            // flat order = rendering order so keyboard index matches the screen
            const flat = [];
            groups.forEach(function (g, gi) {
                const gEl = document.createElement('div'); gEl.className = 'chillcmd-group'; gEl.setAttribute('role', 'group');
                const tid = self._id + '-g' + gi;
                const title = document.createElement('div'); title.className = 'chillcmd-group-title'; title.id = tid; title.textContent = g.name;
                gEl.setAttribute('aria-labelledby', tid);
                gEl.appendChild(title);
                g.items.forEach(function (r) {
                    const cmd = r.cmd, idx = flat.length; flat.push(r);
                    const el = document.createElement('div');
                    el.className = 'chillcmd-item'; el.id = self._id + '-opt-' + idx;
                    el.setAttribute('role', 'option'); el.setAttribute('aria-selected', 'false');
                    if (cmd.disabled) el.setAttribute('aria-disabled', 'true');
                    if (cmd.icon) {
                        const ic = document.createElement('span'); ic.className = 'chillcmd-item-icon'; ic.setAttribute('aria-hidden', 'true');
                        if (cmd.icon && cmd.icon.nodeType) ic.appendChild(cmd.icon.cloneNode(true));
                        else if (o.html) ic.innerHTML = String(cmd.icon);
                        else ic.textContent = String(cmd.icon);
                        el.appendChild(ic);
                    }
                    el.appendChild(self._highlight(String(cmd.label == null ? '' : cmd.label), r.indices));
                    if (cmd.shortcut) {
                        const sc = document.createElement('span'); sc.className = 'chillcmd-item-shortcut'; sc.textContent = formatShortcut(cmd.shortcut);
                        el.appendChild(sc);
                    }
                    el._idx = idx;
                    gEl.appendChild(el);
                    self.itemEls.push(el);
                });
                self.list.appendChild(gEl);
            });
            this.filtered = flat;
            if (this.activeIndex >= flat.length) this.activeIndex = 0;
            this.updateActive();
            this.status.textContent = flat.length + (flat.length === 1 ? ' result' : ' results');
        }

        updateActive(scroll) {
            const self = this;
            (this.itemEls || []).forEach(function (el, i) {
                const on = i === self.activeIndex;
                el.classList.toggle('active', on);
                el.setAttribute('aria-selected', on ? 'true' : 'false');
                if (on) {
                    self.input.setAttribute('aria-activedescendant', el.id);
                    if (scroll !== false && el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } }
                }
            });
            if (!(this.itemEls || []).length) this.input.removeAttribute('aria-activedescendant');
        }

        _move(delta, absolute) {
            const n = this.filtered.length;
            if (!n) return;
            if (absolute !== undefined) this.activeIndex = absolute < 0 ? n - 1 : 0;
            else this.activeIndex = (this.activeIndex + delta + n) % n;
            this.updateActive();
        }

        bindEvents() {
            const self = this, o = this.options;
            this._onOverlay = function () { self.close(); };
            this.overlay.addEventListener('click', this._onOverlay);
            this._onInput = function () {
                self.query = self.input.value;
                self.filtered = self._filter(self.query);
                self.activeIndex = 0;
                self.renderList();
                if (o.onQuery) { try { o.onQuery(self.query, self); } catch (e) { /* ignore */ } }
            };
            this.input.addEventListener('input', this._onInput);
            this._onKeydown = function (e) {
                if (e.isComposing || e.keyCode === 229) return;
                switch (e.key) {
                    case 'ArrowDown': e.preventDefault(); self._move(1); break;
                    case 'ArrowUp': e.preventDefault(); self._move(-1); break;
                    case 'PageDown': e.preventDefault(); self._move(5); break;
                    case 'PageUp': e.preventDefault(); self._move(-5); break;
                    case 'Home': if (self.filtered.length) { e.preventDefault(); self._move(0, 0); } break;
                    case 'End': if (self.filtered.length) { e.preventDefault(); self._move(0, -1); } break;
                    case 'Enter': e.preventDefault(); self.selectActive(); break;
                    case 'Escape': e.preventDefault(); e.stopPropagation(); self.close(); break;
                    case 'Tab': e.preventDefault(); self.input.focus(); break; // focus trap: the input is the only tab stop
                    default:
                }
            };
            this.container.addEventListener('keydown', this._onKeydown);
            // keep focus in the input while interacting with the list
            this._onListDown = function (e) { e.preventDefault(); };
            this.list.addEventListener('mousedown', this._onListDown);
            this._onListClick = function (e) {
                const item = e.target.closest ? e.target.closest('.chillcmd-item') : null;
                if (item && item._idx !== undefined) { self.activeIndex = item._idx; self.selectActive(); }
            };
            this.list.addEventListener('click', this._onListClick);
            this._onListMove = function (e) {
                const item = e.target.closest ? e.target.closest('.chillcmd-item') : null;
                if (item && item._idx !== undefined && item._idx !== self.activeIndex) { self.activeIndex = item._idx; self.updateActive(false); }
            };
            this.list.addEventListener('mousemove', this._onListMove);
            // focus escaped (e.g. click on dialog padding then Tab)
            this._onFocusIn = function (e) { if (self.isOpen && !self.container.contains(e.target)) self.input.focus(); };
            document.addEventListener('focusin', this._onFocusIn);

            if (o.shortcut !== false && o.shortcut !== null && o.shortcut !== '') {
                this._hotkey = parseHotkey(o.shortcut);
                this._onHotkey = function (e) {
                    if (e.isComposing || e.defaultPrevented) return;
                    if (hotkeyMatches(e, self._hotkey)) { e.preventDefault(); self.toggle(); }
                };
                document.addEventListener('keydown', this._onHotkey);
            }
        }

        selectActive() {
            const r = this.filtered[this.activeIndex];
            if (!r || r.cmd.disabled) return;
            const cmd = r.cmd;
            if (this.options.closeOnSelect) this.close();
            if (cmd.action) { try { cmd.action(cmd); } catch (e) { if (typeof console !== 'undefined') console.error('ChillCommand action error', e); } }
            if (this.options.onSelect) { try { this.options.onSelect(cmd, this); } catch (e) { if (typeof console !== 'undefined') console.error('ChillCommand onSelect error', e); } }
        }

        open(query) {
            if (this._destroyed || this.isOpen) return;
            this.isOpen = true;
            this._prevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
            this.overlay.classList.add('open'); this.container.classList.add('open');
            this.container.setAttribute('aria-hidden', 'false');
            this.input.value = query ? String(query) : '';
            this.query = this.input.value;
            this.filtered = this._filter(this.query); this.activeIndex = 0; this.renderList();
            this.input.focus();
            if (document.activeElement !== this.input && typeof window.requestAnimationFrame === 'function') {
                this._raf = window.requestAnimationFrame(function (self) { return function () { if (self.isOpen) self.input.focus(); }; }(this));
            }
            if (this.options.onOpen) { try { this.options.onOpen(this); } catch (e) { /* ignore */ } }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            if (this._raf && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(this._raf);
            this.overlay.classList.remove('open'); this.container.classList.remove('open');
            this.container.setAttribute('aria-hidden', 'true');
            const prev = this._prevFocus; this._prevFocus = null;
            if (prev && prev.focus && document.contains(prev)) { try { prev.focus(); } catch (e) { /* ignore */ } }
            if (this.options.onClose) { try { this.options.onClose(this); } catch (e) { /* ignore */ } }
        }

        toggle() { this.isOpen ? this.close() : this.open(); }

        setCommands(commands) {
            this.options.commands = commands || [];
            this.filtered = this._filter(this.input ? this.input.value : '');
            this.activeIndex = 0;
            this.renderList();
        }

        getCommands() { return (this.options.commands || []).slice(); }

        destroy() {
            if (this._destroyed) return;
            const wasOpen = this.isOpen;
            if (wasOpen) this.close();
            this._destroyed = true;
            if (this._onHotkey) document.removeEventListener('keydown', this._onHotkey);
            document.removeEventListener('focusin', this._onFocusIn);
            this.overlay.removeEventListener('click', this._onOverlay);
            this.input.removeEventListener('input', this._onInput);
            this.container.removeEventListener('keydown', this._onKeydown);
            this.list.removeEventListener('mousedown', this._onListDown);
            this.list.removeEventListener('click', this._onListClick);
            this.list.removeEventListener('mousemove', this._onListMove);
            this.overlay.remove(); this.container.remove();
        }
    }

    const ChillCommand = {
        version: VERSION,
        init(options) { return new ChillCommandInstance(options); },
        fuzzy: fuzzy,
        injectCSS() { injectCSS(); }
    };
    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillCommand; } else { window.ChillCommand = ChillCommand; }
})(typeof window !== 'undefined' ? window : this);
