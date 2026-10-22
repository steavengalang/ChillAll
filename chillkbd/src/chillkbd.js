/**
 * ChillKbd - Styled keyboard-key chips with OS-aware symbols
 *
 * @example
 *   <kbd data-chill-kbd="mod+k"></kbd>      -> ⌘ K on macOS, Ctrl + K elsewhere
 *   <kbd>Ctrl+Shift+P</kbd>                  -> text is parsed too
 *   ChillKbd.init();                         // enhances every  kbd, [data-chill-kbd]
 *   ChillKbd.init('.hint', { size: 'sm' });
 *   const el = ChillKbd.create('mod+shift+p'); parent.appendChild(el);
 *   ChillKbd.format('mod+k');                // "⌘K" (mac) | "Ctrl+K" (others)  - handy for tooltips / aria-keyshortcuts
 *
 * Key aliases: mod (Cmd on Mac, Ctrl elsewhere), cmd/command/meta/win/super, ctrl/control, alt/option/opt, shift,
 *   enter/return, esc/escape, tab, space, backspace, delete/del, up/down/left/right, pageup/pagedown, home, end, capslock.
 *   Combine with "+" ("ctrl+k") or whitespace ("g i"); "ctrl++" is parsed as Ctrl and "+".
 *
 * Options (init / create):
 *   platform   'auto'|'mac'|'other'  'auto'   force an OS style (useful for docs / tests)
 *   size       'sm'|'md'|'lg'        'md'
 *   variant    'default'|'outline'|'flat'  'default'
 *   separator  string                mac: ''  others: '+'   shown between chips (aria-hidden)
 *   selector (init only)             'kbd, [data-chill-kbd]'
 *
 * Instance: { refresh(), destroy() } - destroy() restores the original content. Enhancing is idempotent.
 * Chips also include visually-hidden full key names ("Command", "Shift") so screen readers don't read bare symbols.
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillkbd_css_injected__';
    const ATTR = 'data-chillkbd-enhanced';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillkbd-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillkbd-styles';
        style.textContent = `
      :root {
        --chillkbd-bg: #f5f5f5;
        --chillkbd-color: #404040;
        --chillkbd-border: #d4d4d4;
        --chillkbd-shadow: #d4d4d4;
        --chillkbd-sep: #9ca3af;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillkbd-bg: #262626; --chillkbd-color: #e5e5e5; --chillkbd-border: #404040; --chillkbd-shadow: #171717; --chillkbd-sep: #737373;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillkbd-bg: #262626; --chillkbd-color: #e5e5e5; --chillkbd-border: #404040; --chillkbd-shadow: #171717; --chillkbd-sep: #737373;
      }
      .chillkbd {
        display: inline-flex; align-items: center; gap: 4px; vertical-align: baseline;
        background: none; border: 0; padding: 0; box-shadow: none; font-family: inherit; white-space: nowrap;
      }
      .chillkbd-key {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 1.75em; height: 1.75em; padding: 0 0.5em; box-sizing: border-box;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 0.8125em; font-weight: 500; line-height: 1;
        color: var(--chillkbd-color); background: var(--chillkbd-bg);
        border: 1px solid var(--chillkbd-border); border-radius: 6px;
        box-shadow: 0 1px 0 var(--chillkbd-shadow);
      }
      .chillkbd-outline .chillkbd-key { background: transparent; box-shadow: none; }
      .chillkbd-flat .chillkbd-key { border-color: transparent; box-shadow: none; }
      .chillkbd-sm { font-size: 12px; } .chillkbd-sm .chillkbd-key { border-radius: 5px; }
      .chillkbd-md { font-size: 14px; }
      .chillkbd-lg { font-size: 16px; } .chillkbd-lg .chillkbd-key { border-radius: 8px; }
      .chillkbd-sep { color: var(--chillkbd-sep); font-size: 0.8125em; user-select: none; }
      .chillkbd-sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
        clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    // ---- platform ----
    function isMac(platform) {
        if (platform === 'mac') return true;
        if (platform === 'other') return false;
        try {
            const n = typeof navigator !== 'undefined' ? navigator : null;
            if (!n) return false;
            const p = (n.userAgentData && n.userAgentData.platform) || n.platform || '';
            if (/mac|iphone|ipad|ipod/i.test(p)) return true;
            return !p && /Mac|iPhone|iPad|iPod/.test(n.userAgent || '');
        } catch (e) { return false; }
    }

    // canonical key -> { mac: [symbol, name], other: [label, name] }
    const KEYS = {
        mod:       { mac: ['⌘', 'Command'], other: ['Ctrl', 'Control'] },
        meta:      { mac: ['⌘', 'Command'], other: ['Win', 'Windows'] },
        ctrl:      { mac: ['⌃', 'Control'], other: ['Ctrl', 'Control'] },
        alt:       { mac: ['⌥', 'Option'],  other: ['Alt', 'Alt'] },
        shift:     { mac: ['⇧', 'Shift'],   other: ['Shift', 'Shift'] },
        enter:     { mac: ['↵', 'Return'],  other: ['Enter', 'Enter'] },
        esc:       { mac: ['Esc', 'Escape'],     other: ['Esc', 'Escape'] },
        tab:       { mac: ['⇥', 'Tab'],     other: ['Tab', 'Tab'] },
        space:     { mac: ['␣', 'Space'],   other: ['Space', 'Space'] },
        backspace: { mac: ['⌫', 'Backspace'], other: ['Backspace', 'Backspace'] },
        delete:    { mac: ['⌦', 'Delete'],  other: ['Del', 'Delete'] },
        up:        { mac: ['↑', 'Up arrow'],    other: ['↑', 'Up arrow'] },
        down:      { mac: ['↓', 'Down arrow'],  other: ['↓', 'Down arrow'] },
        left:      { mac: ['←', 'Left arrow'],  other: ['←', 'Left arrow'] },
        right:     { mac: ['→', 'Right arrow'], other: ['→', 'Right arrow'] },
        pageup:    { mac: ['⇞', 'Page up'],   other: ['PgUp', 'Page up'] },
        pagedown:  { mac: ['⇟', 'Page down'], other: ['PgDn', 'Page down'] },
        home:      { mac: ['↖', 'Home'], other: ['Home', 'Home'] },
        end:       { mac: ['↘', 'End'],  other: ['End', 'End'] },
        capslock:  { mac: ['⇪', 'Caps lock'], other: ['Caps', 'Caps lock'] },
        plus:      { mac: ['+', 'Plus'], other: ['+', 'Plus'] }
    };
    const ALIASES = {
        cmd: 'meta', command: 'meta', win: 'meta', windows: 'meta', super: 'meta', '⌘': 'meta',
        control: 'ctrl', '⌃': 'ctrl', option: 'alt', opt: 'alt', '⌥': 'alt', '⇧': 'shift',
        return: 'enter', '↵': 'enter', escape: 'esc', del: 'delete', ins: 'insert',
        arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
        pgup: 'pageup', pgdn: 'pagedown', ' ': 'space', spacebar: 'space', '↑': 'up', '↓': 'down', '←': 'left', '→': 'right',
        caps: 'capslock'
    };

    /** Parse "ctrl+shift+k" / "mod + k" / "g i" into canonical key tokens. */
    function parse(shortcut) {
        let s = String(shortcut == null ? '' : shortcut).trim();
        if (!s) return [];
        const out = [];
        // "ctrl++" -> trailing plus key
        let trailingPlus = false;
        if (/\+\s*\+$/.test(s)) { trailingPlus = true; s = s.replace(/\+\s*\+$/, ''); }
        else if (s === '+') { return ['plus']; }
        const parts = s.indexOf('+') > -1 ? s.split('+') : s.split(/\s+/);
        parts.forEach(function (p) {
            p = p.trim();
            if (!p) return;
            const lower = p.toLowerCase();
            out.push(ALIASES[lower] || (KEYS[lower] ? lower : (lower.length === 1 ? p.toUpperCase() : (/^f\d{1,2}$/i.test(p) ? p.toUpperCase() : p))));
        });
        if (trailingPlus) out.push('plus');
        return out;
    }

    function describe(token, mac) {
        const k = KEYS[token];
        if (k) { const v = mac ? k.mac : k.other; return { label: v[0], name: v[1] }; }
        return { label: token.length === 1 ? token.toUpperCase() : token, name: token };
    }

    /** Plain-text rendering, e.g. "⌘K" or "Ctrl+Shift+K". */
    function format(shortcut, options) {
        const mac = isMac(options && options.platform);
        const sep = options && options.separator != null ? options.separator : (mac ? '' : '+');
        return parse(shortcut).map(function (t) { return describe(t === 'mod' && mac ? 'mod' : t, mac).label; }).join(sep);
    }

    function build(shortcut, options, host) {
        options = options || {};
        const mac = isMac(options.platform);
        const sep = options.separator != null ? String(options.separator) : (mac ? '' : '+');
        const el = host || document.createElement('kbd');
        el.classList.add('chillkbd', 'chillkbd-' + (options.size || 'md'));
        if (options.variant && options.variant !== 'default') el.classList.add('chillkbd-' + options.variant);
        const tokens = parse(shortcut);
        const frag = document.createDocumentFragment();
        tokens.forEach(function (t, i) {
            if (i > 0 && sep) {
                const s = document.createElement('span');
                s.className = 'chillkbd-sep';
                s.setAttribute('aria-hidden', 'true');
                s.textContent = sep;
                frag.appendChild(s);
            }
            const d = describe(t, mac);
            const key = document.createElement('kbd');
            key.className = 'chillkbd-key';
            const visible = document.createElement('span');
            visible.setAttribute('aria-hidden', d.label === d.name ? 'false' : 'true');
            visible.textContent = d.label;
            key.appendChild(visible);
            if (d.label !== d.name) {
                const sr = document.createElement('span');
                sr.className = 'chillkbd-sr';
                sr.textContent = d.name;
                key.appendChild(sr);
            }
            frag.appendChild(key);
        });
        el.textContent = '';
        el.appendChild(frag);
        return el;
    }

    /** Build a new <kbd> chip group. */
    function create(shortcut, options) {
        injectCSS();
        return build(shortcut, options);
    }

    function init(selectorOrEl, options) {
        injectCSS();
        options = options || {};
        let nodes;
        if (selectorOrEl && typeof selectorOrEl === 'object' && !selectorOrEl.nodeType && !selectorOrEl.length && selectorOrEl.length !== 0) {
            options = selectorOrEl; selectorOrEl = null;
        }
        const sel = selectorOrEl || options.selector || 'kbd, [data-chill-kbd]';
        if (typeof sel === 'string') nodes = Array.prototype.slice.call(document.querySelectorAll(sel));
        else if (sel.nodeType) nodes = [sel];
        else nodes = Array.prototype.slice.call(sel);
        const records = [];

        function enhance(el) {
            if (el.hasAttribute(ATTR)) return;
            // skip chips we generated ourselves
            if (el.classList.contains('chillkbd-key')) return;
            const spec = el.getAttribute('data-chill-kbd') || el.textContent;
            if (!String(spec).trim()) return;
            records.push({
                el: el,
                text: el.textContent,
                cls: el.getAttribute('class'),
                spec: spec
            });
            el.setAttribute(ATTR, '');
            build(spec, options, el);
        }
        nodes.forEach(enhance);

        return {
            elements: records.map(function (r) { return r.el; }),
            refresh: function () {
                records.forEach(function (r) { build(r.spec, options, r.el); });
            },
            destroy: function () {
                records.forEach(function (r) {
                    r.el.removeAttribute(ATTR);
                    r.el.textContent = r.text;
                    if (r.cls === null) r.el.removeAttribute('class'); else r.el.setAttribute('class', r.cls);
                });
                records.length = 0;
            }
        };
    }

    const ChillKbd = {
        version: VERSION,
        init: init,
        create: create,
        parse: parse,
        format: format,
        isMac: function () { return isMac('auto'); },
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillKbd; }
    else { window.ChillKbd = ChillKbd; }
})(typeof window !== 'undefined' ? window : this);
