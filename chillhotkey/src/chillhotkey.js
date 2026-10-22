/**
 * ChillHotkey - Zero-dependency Keyboard Shortcut Utility
 *
 * @example
 *   const off = ChillHotkey.register('mod+k', e => palette.open());      // Cmd+K on macOS, Ctrl+K elsewhere
 *   ChillHotkey.register('g i', () => goToInbox());                      // key sequence (press g, then i)
 *   ChillHotkey.register('shift+/', showHelp);                           // "?" – shift is ignored for symbol keys
 *   ChillHotkey.register('esc', close, { allowInInput: true });
 *   off();                                                               // unregister just this handler
 *   ChillHotkey.unregister('mod+k');                                     // all handlers of that shortcut
 *   const scoped = ChillHotkey.create({ target: panelEl });              // independent hub on one element
 *   scoped.register('ctrl+s', save); scoped.destroy();
 *
 * Shortcut syntax: modifiers + key joined by "+": ctrl, alt (option), shift, meta (cmd / command / win), mod.
 * `mod` = Cmd on Apple platforms, Ctrl elsewhere. Keys: letters, digits, f1-f12, esc, enter, space, tab, backspace,
 * delete, up/down/left/right, home, end, pageup, pagedown, plus, any single character. Space-separated tokens form a
 * sequence ("g i", "g shift+d"; plain / shift strokes only, max `sequenceTimeout` ms between presses).
 *
 * Behaviour: the document listener is attached lazily on first registration and removed when nothing is registered.
 * Shortcuts WITHOUT ctrl/meta are ignored while typing in input / textarea / select / contenteditable (so "?" or "g i"
 * never hijack typing) unless the registration passes { allowInInput: true }. Shortcuts with mod/ctrl/meta always fire.
 * IME composition and key auto-repeat are ignored unless { allowRepeat: true }.
 *
 * register options: preventDefault (true), stopPropagation (false), allowInInput (false), allowRepeat (false),
 *   enabled (true), description (string, shown by getAll(true)).
 * create options: target (document), sequenceTimeout (1000), platform ('auto' | 'mac' | 'other')
 * API: register, unregister, unregisterAll, getAll([withInfo]), isPressed(shortcut, event), parseShortcut(shortcut),
 *      pause(), resume(), isMac(), create(options), destroy()
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';

    const ALIASES = {
        cmd: 'meta', command: 'meta', win: 'meta', windows: 'meta', super: 'meta',
        control: 'ctrl', option: 'alt', opt: 'alt',
        escape: 'esc', return: 'enter', del: 'delete', spacebar: 'space', ' ': 'space',
        arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
        pgup: 'pageup', pgdn: 'pagedown', plus: '+'
    };
    const KEY_NAMES = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', esc: 'escape', space: ' ', del: 'delete' };

    function detectMac(platform) {
        if (platform === 'mac') return true;
        if (platform === 'other') return false;
        try {
            if (typeof navigator === 'undefined') return false;
            const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
            if (/mac|iphone|ipad|ipod/i.test(p)) return true;
            return !p && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent || '');
        } catch (e) { return false; }
    }

    function parseStroke(token, mac) {
        let t = String(token).trim().toLowerCase();
        const mods = { ctrl: false, alt: false, shift: false, meta: false };
        let key = '';
        if (t === '+') return { key: '+', mods };
        let parts;
        if (t.length > 1 && t.slice(-2) === '++') { parts = t.slice(0, -2).split('+'); parts.push('+'); }
        else parts = t.split('+');
        parts = parts.map(function (p) { return p.trim(); }).filter(Boolean);
        key = parts.pop() || '';
        parts.forEach(function (p) {
            if (ALIASES[p]) p = ALIASES[p];
            if (p === 'mod') { if (mac) mods.meta = true; else mods.ctrl = true; }
            else if (Object.prototype.hasOwnProperty.call(mods, p)) mods[p] = true;
        });
        if (ALIASES[key]) key = ALIASES[key];
        if (key === 'mod') { if (mac) mods.meta = true; else mods.ctrl = true; key = ''; }
        if (key === 'ctrl' || key === 'alt' || key === 'shift' || key === 'meta') key = ''; // a modifier alone is not a shortcut
        return { key: key, mods: mods };
    }

    /**
     * Parse "mod+shift+k" -> { key: 'k', mods: {ctrl,alt,shift,meta} }.
     * A sequence ("g i") returns { sequence: [stroke, ...], key, mods } where key/mods describe the last stroke.
     */
    function parseShortcut(shortcut, platform) {
        const mac = detectMac(platform);
        const s = String(shortcut == null ? '' : shortcut).trim();
        const tokens = s.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
            const seq = tokens.map(function (t) { return parseStroke(t, mac); });
            const last = seq[seq.length - 1];
            return { sequence: seq, key: last.key, mods: last.mods };
        }
        return parseStroke(s, mac);
    }

    function isSymbol(key) { return key.length === 1 && !/[a-z0-9]/.test(key); }

    function eventKey(e) { return typeof e.key === 'string' ? e.key.toLowerCase() : ''; }

    function keyMatches(e, key) {
        const ek = eventKey(e);
        const want = KEY_NAMES[key] || key;
        if (ek === want) return true;
        if (key === ' ' || key === 'space') return ek === ' ' || ek === 'spacebar';
        // Alt (Option) changes e.key on macOS ("alt+k" -> "˚"), fall back to the physical key
        if (e.code && key.length === 1) {
            if (/^[a-z]$/.test(key)) return e.code === 'Key' + key.toUpperCase();
            if (/^[0-9]$/.test(key)) return e.code === 'Digit' + key || e.code === 'Numpad' + key;
        }
        return false;
    }

    function matchEvent(e, parsed) {
        if (!parsed || !parsed.key) return false;
        if (!keyMatches(e, parsed.key)) return false;
        const m = parsed.mods;
        if (!!e.ctrlKey !== m.ctrl || !!e.altKey !== m.alt || !!e.metaKey !== m.meta) return false;
        // "?" needs shift on most layouts; don't make authors write shift+/ vs ? twice
        if (isSymbol(parsed.key) && !m.shift) return true;
        return !!e.shiftKey === m.shift;
    }

    function isEditable(target) {
        if (!target || target.nodeType !== 1) return false;
        const tag = target.tagName;
        if (tag === 'INPUT') {
            const t = (target.getAttribute('type') || 'text').toLowerCase();
            return ['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image'].indexOf(t) === -1;
        }
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (target.isContentEditable) return true;
        const ce = target.getAttribute && target.getAttribute('contenteditable');
        return ce === '' || ce === 'true' || ce === 'plaintext-only';
    }

    class Hub {
        constructor(options) {
            options = options || {};
            this.target = options.target || null;
            this.platform = options.platform || 'auto';
            this.sequenceTimeout = options.sequenceTimeout > 0 ? options.sequenceTimeout : 1000;
            this.handlers = [];          // {shortcut, parsed, callback, options}
            this.paused = false;
            this.attached = null;
            this.buffer = [];            // recent single strokes for sequences
            this.bufferTimer = null;
            this._destroyed = false;
            const self = this;
            this._onKeydown = function (e) { self._handle(e); };
        }

        _el() { return this.target || (typeof document !== 'undefined' ? document : null); }

        _attach() {
            if (this.attached) return;
            const el = this._el();
            if (!el) return;
            el.addEventListener('keydown', this._onKeydown);
            this.attached = el;
        }
        _detach() {
            if (this.attached) { this.attached.removeEventListener('keydown', this._onKeydown); this.attached = null; }
            this._resetBuffer();
        }
        _resetBuffer() {
            this.buffer = [];
            if (this.bufferTimer) { clearTimeout(this.bufferTimer); this.bufferTimer = null; }
        }

        _handle(e) {
            if (this.paused || this._destroyed) return;
            if (e.isComposing || e.keyCode === 229) return;
            const typing = isEditable(e.target);
            const modifierOnly = ['control', 'shift', 'alt', 'meta', 'os'].indexOf(eventKey(e)) > -1;
            if (modifierOnly) return;

            // sequences: track plain strokes (shift allowed)
            const plain = !e.ctrlKey && !e.altKey && !e.metaKey;
            let seqHit = false;
            if (this.handlers.some(function (h) { return h.parsed.sequence; })) {
                if (plain && !typing) {
                    this.buffer.push({ key: eventKey(e), shift: !!e.shiftKey });
                    if (this.buffer.length > 6) this.buffer.shift();
                    if (this.bufferTimer) clearTimeout(this.bufferTimer);
                    const self = this;
                    this.bufferTimer = setTimeout(function () { self._resetBuffer(); }, this.sequenceTimeout);
                } else if (!plain) {
                    this._resetBuffer();
                }
            }

            const list = this.handlers.slice();
            for (let i = 0; i < list.length; i++) {
                const h = list[i];
                if (h.options.enabled === false) continue;
                let hit = false;
                if (h.parsed.sequence) {
                    if (typing && !h.options.allowInInput) continue;
                    hit = this._seqMatch(h.parsed.sequence);
                    if (hit) seqHit = true;
                } else {
                    hit = matchEvent(e, h.parsed);
                    if (hit && typing && !h.options.allowInInput && !h.parsed.mods.ctrl && !h.parsed.mods.meta) hit = false;
                }
                if (!hit) continue;
                if (e.repeat && !h.options.allowRepeat) continue;
                if (h.options.preventDefault !== false) e.preventDefault();
                if (h.options.stopPropagation) e.stopPropagation();
                try { h.callback(e, h.shortcut); } catch (err) { if (typeof console !== 'undefined' && console.error) console.error('ChillHotkey handler error', err); }
            }
            if (seqHit) this._resetBuffer();
        }

        _seqMatch(seq) {
            const n = seq.length;
            if (this.buffer.length < n) return false;
            const tail = this.buffer.slice(-n);
            for (let i = 0; i < n; i++) {
                const want = KEY_NAMES[seq[i].key] || seq[i].key;
                if (tail[i].key !== want) return false;
                if (!isSymbol(seq[i].key) && tail[i].shift !== seq[i].mods.shift) return false;
            }
            return true;
        }

        register(shortcut, callback, options) {
            if (this._destroyed) return function () {};
            if (typeof callback !== 'function') throw new TypeError('ChillHotkey.register: callback must be a function');
            const parsed = parseShortcut(shortcut, this.platform);
            if (!parsed.key) throw new Error('ChillHotkey.register: invalid shortcut "' + shortcut + '"');
            const rec = { shortcut: shortcut, parsed: parsed, callback: callback, options: options || {} };
            this.handlers.push(rec);
            this._attach();
            const self = this;
            return function unregisterThis() {
                const i = self.handlers.indexOf(rec);
                if (i > -1) self.handlers.splice(i, 1);
                if (!self.handlers.length) self._detach();
            };
        }

        unregister(shortcut) {
            const key = JSON.stringify(parseShortcut(shortcut, this.platform));
            this.handlers = this.handlers.filter(function (h) { return JSON.stringify(h.parsed) !== key; });
            if (!this.handlers.length) this._detach();
        }

        unregisterAll() { this.handlers = []; this._detach(); }

        getAll(withInfo) {
            if (withInfo) return this.handlers.map(function (h) { return { shortcut: h.shortcut, description: h.options.description || '' }; });
            const seen = [];
            this.handlers.forEach(function (h) { if (seen.indexOf(h.shortcut) === -1) seen.push(h.shortcut); });
            return seen;
        }

        isPressed(shortcut, e) { return matchEvent(e, parseShortcut(shortcut, this.platform)); }
        pause() { this.paused = true; }
        resume() { this.paused = false; }
        destroy() { this.unregisterAll(); this._destroyed = true; }
    }

    const hub = new Hub();

    const ChillHotkey = {
        version: VERSION,
        register: function (s, cb, o) { return hub.register(s, cb, o); },
        unregister: function (s) { hub.unregister(s); },
        unregisterAll: function () { hub.unregisterAll(); },
        getAll: function (withInfo) { return hub.getAll(withInfo); },
        isPressed: function (s, e) { return hub.isPressed(s, e); },
        parseShortcut: parseShortcut,
        pause: function () { hub.pause(); },
        resume: function () { hub.resume(); },
        isMac: function () { return detectMac('auto'); },
        isEditable: isEditable,
        create: function (options) { return new Hub(options); },
        destroy: function () { hub.unregisterAll(); },
        Hub: Hub
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillHotkey; }
    else { window.ChillHotkey = ChillHotkey; }
})(typeof window !== 'undefined' ? window : this);
