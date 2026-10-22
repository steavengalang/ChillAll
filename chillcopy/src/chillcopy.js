/**
 * ChillCopy - Zero-dependency copy-to-clipboard helper + button
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   ChillCopy.copy('hello').then(ok => console.log(ok));          // Clipboard API, falls back to execCommand
 *
 *   // <button data-chill-copy="npm i chillall">Copy</button>
 *   // <button data-chill-copy-target="#snippet" aria-label="Copy code"></button>   (copies textContent / value of target)
 *   const h = ChillCopy.init('[data-chill-copy], [data-chill-copy-target]', { successLabel: 'Copied!' });
 *   h.destroy();
 *
 *   const btn = ChillCopy.create({ text: 'abc', label: 'Copy', icon: true });   // returns { element, destroy, copy }
 *
 * Options (init / create)
 *   text          string or function returning string (create)
 *   target        selector | Element whose value/textContent is copied
 *   label         button text for create()                       default 'Copy'  (init keeps existing text)
 *   successLabel  text/tooltip on success                        default 'Copied!'
 *   errorLabel    text/tooltip on failure                        default 'Copy failed'
 *   icon          create(): show icon                            default true
 *   duration      how long the success state lasts (ms)          default 1800
 *   tooltip       show floating tooltip bubble                   default true
 *   onCopy(text, el), onError(error, el)
 *
 * Instance (init returns { instances, destroy }; create returns the instance):
 *   { element, copy(), destroy() }
 * Events (bubble from the button): CustomEvent 'chillcopy:copy' (detail.text) and 'chillcopy:error'.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcopy-styles';
    const ICON_COPY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"/></svg>';

    const DARK_VARS = `
        --chillcopy-bg: #262626;
        --chillcopy-text: #fafafa;
        --chillcopy-border: #404040;
        --chillcopy-hover: #333333;
        --chillcopy-tip-bg: #fafafa;
        --chillcopy-tip-text: #171717;`;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillcopy-bg: #ffffff;
        --chillcopy-text: #171717;
        --chillcopy-border: #e5e5e5;
        --chillcopy-hover: #f3f4f6;
        --chillcopy-primary: #3b82f6;
        --chillcopy-success: #16a34a;
        --chillcopy-danger: #dc2626;
        --chillcopy-tip-bg: #171717;
        --chillcopy-tip-text: #ffffff;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {${DARK_VARS}
        }
      }
      :root[data-theme="dark"], :root.dark {${DARK_VARS}
      }

      .chillcopy {
        position: relative;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        min-height: 32px; min-width: 32px; padding: 6px 12px; box-sizing: border-box;
        border: 1px solid var(--chillcopy-border); border-radius: 8px;
        background: var(--chillcopy-bg); color: var(--chillcopy-text);
        font-family: inherit; font-size: 14px; font-weight: 500; line-height: 1; cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .chillcopy:hover { background: var(--chillcopy-hover); }
      .chillcopy:focus-visible { outline: 2px solid var(--chillcopy-primary); outline-offset: 2px; }
      .chillcopy-iconbtn { padding: 6px; }
      .chillcopy-icon { display: inline-flex; flex-shrink: 0; }
      .chillcopy-success { color: var(--chillcopy-success); border-color: var(--chillcopy-success); }
      .chillcopy-error { color: var(--chillcopy-danger); border-color: var(--chillcopy-danger); }
      .chillcopy-tip {
        position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translate(-50%, 4px);
        padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none;
        background: var(--chillcopy-tip-bg); color: var(--chillcopy-tip-text);
        font-size: 12px; font-weight: 500; opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease; z-index: 10004;
      }
      .chillcopy-tip-visible { opacity: 1; transform: translate(-50%, 0); }
      .chillcopy-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; padding: 0; }
      @media (prefers-reduced-motion: reduce) {
        .chillcopy, .chillcopy-tip { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function fallbackCopy(text) {
        if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
        const active = document.activeElement;
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.setAttribute('aria-hidden', 'true');
        ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        let sel = null, range = null;
        try {
            const s = document.getSelection && document.getSelection();
            if (s && s.rangeCount > 0) range = s.getRangeAt(0);
            sel = s;
        } catch (e) { /* ignore */ }
        let ok = false;
        try {
            ta.focus({ preventScroll: true });
            ta.select();
            ta.setSelectionRange(0, text.length);
            ok = document.execCommand('copy');
        } catch (e) { ok = false; }
        document.body.removeChild(ta);
        try { if (sel && range) { sel.removeAllRanges(); sel.addRange(range); } } catch (e) { /* ignore */ }
        if (active && active.focus) { try { active.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
        return !!ok;
    }

    /** Copy text. Resolves true on success, false on failure (never rejects). */
    function copy(text) {
        text = text == null ? '' : String(text);
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        const secure = typeof window.isSecureContext === 'undefined' ? true : window.isSecureContext;
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function' && secure) {
            return nav.clipboard.writeText(text).then(() => true, () => fallbackCopy(text));
        }
        return Promise.resolve(fallbackCopy(text));
    }

    function readTarget(t) {
        const el = typeof t === 'string' ? document.querySelector(t) : t;
        if (!el) return null;
        if ('value' in el && el.tagName !== 'BUTTON' && el.tagName !== 'LI') return el.value;
        return el.textContent;
    }

    class ChillCopyInstance {
        constructor(el, options, live) {
            this.element = el;
            this.options = Object.assign({
                text: null, target: null, successLabel: 'Copied!', errorLabel: 'Copy failed', duration: 1800, tooltip: true,
                onCopy: null, onError: null
            }, options || {});
            this._live = live;
            this._timer = null;
            this._destroyed = false;
            this._label = null;
            this._labelOriginal = null;
            this._ownedClass = !el.classList.contains('chillcopy');
            el.classList.add('chillcopy');
            if (el.tagName === 'BUTTON' && !el.getAttribute('type')) el.setAttribute('type', 'button');
            this._onClick = e => { if (el.tagName === 'A') e.preventDefault(); this.copy(); };
            el.addEventListener('click', this._onClick);
            if (this.options.tooltip) {
                this.tip = document.createElement('span');
                this.tip.className = 'chillcopy-tip';
                this.tip.setAttribute('aria-hidden', 'true');
                el.appendChild(this.tip);
            }
        }

        _resolveText() {
            const o = this.options;
            if (typeof o.text === 'function') return o.text(this.element);
            if (o.text != null) return o.text;
            const attr = this.element.getAttribute('data-chill-copy');
            if (attr) return attr;
            const tgt = o.target || this.element.getAttribute('data-chill-copy-target');
            if (tgt) return readTarget(tgt);
            return null;
        }

        copy() {
            if (this._destroyed) return Promise.resolve(false);
            const text = this._resolveText();
            if (text == null) { this._finish(false, new Error('ChillCopy: nothing to copy')); return Promise.resolve(false); }
            return copy(text).then(ok => {
                if (this._destroyed) return ok;
                this._finish(ok, ok ? null : new Error('ChillCopy: copy was rejected by the browser'), text);
                return ok;
            });
        }

        _finish(ok, error, text) {
            const o = this.options, el = this.element;
            const msg = ok ? o.successLabel : o.errorLabel;
            clearTimeout(this._timer);
            el.classList.toggle('chillcopy-success', ok);
            el.classList.toggle('chillcopy-error', !ok);
            // swap visible label if the button has a text label
            if (this._label) {
                if (this._labelOriginal == null) this._labelOriginal = this._label.textContent;
                this._label.textContent = msg;
            }
            if (this._iconEl && ok) { this._iconEl.innerHTML = ICON_CHECK; }
            if (this.tip) { this.tip.textContent = msg; this.tip.classList.add('chillcopy-tip-visible'); }
            if (this._live) this._live.textContent = msg;
            this._timer = setTimeout(() => this.reset(), o.duration);
            const detail = ok ? { text } : { error };
            try { el.dispatchEvent(new window.CustomEvent(ok ? 'chillcopy:copy' : 'chillcopy:error', { bubbles: true, detail })); } catch (e) { /* ignore */ }
            if (ok && typeof o.onCopy === 'function') o.onCopy(text, el);
            if (!ok && typeof o.onError === 'function') o.onError(error, el);
        }

        reset() {
            clearTimeout(this._timer);
            this._timer = null;
            const el = this.element;
            el.classList.remove('chillcopy-success', 'chillcopy-error');
            if (this._label && this._labelOriginal != null) { this._label.textContent = this._labelOriginal; this._labelOriginal = null; }
            if (this._iconEl && this._iconOriginal != null) this._iconEl.innerHTML = this._iconOriginal;
            if (this.tip) this.tip.classList.remove('chillcopy-tip-visible');
            if (this._live) this._live.textContent = '';
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            clearTimeout(this._timer);
            this.element.removeEventListener('click', this._onClick);
            this.reset();
            if (this.tip && this.tip.parentNode) this.tip.parentNode.removeChild(this.tip);
            if (this._ownedClass) this.element.classList.remove('chillcopy');
            if (this._created && this.element.parentNode) this.element.parentNode.removeChild(this.element);
        }
    }

    function makeLive() {
        const live = document.createElement('span');
        live.className = 'chillcopy-sr';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        document.body.appendChild(live);
        return live;
    }

    /** Enhance existing elements. Existing text content (if any) is used as the swappable label. */
    function init(selector, options) {
        injectCSS();
        selector = selector || '[data-chill-copy], [data-chill-copy-target]';
        const els = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []);
        const live = makeLive();
        const instances = els.map(el => {
            const inst = new ChillCopyInstance(el, options, live);
            const hasText = el.textContent.trim().length > 0;
            if (hasText) {
                // wrap bare text in a span so we can swap it without touching icons
                const textNodes = Array.prototype.filter.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim());
                if (textNodes.length === 1 && el.children.length === (inst.tip ? 1 : 0)) {
                    const sp = document.createElement('span');
                    el.replaceChild(sp, textNodes[0]);
                    sp.textContent = textNodes[0].textContent;
                    inst._label = sp;
                    inst._wrapped = { sp, node: textNodes[0] };
                }
            } else if (!el.getAttribute('aria-label')) {
                el.setAttribute('aria-label', 'Copy to clipboard');
                inst._addedAria = true;
                el.classList.add('chillcopy-iconbtn');
            }
            const origDestroy = inst.destroy.bind(inst);
            inst.destroy = function () {
                if (inst._destroyed) return;
                origDestroy();
                if (inst._wrapped && inst._wrapped.sp.parentNode) inst._wrapped.sp.parentNode.replaceChild(inst._wrapped.node, inst._wrapped.sp);
                if (inst._addedAria) { el.removeAttribute('aria-label'); el.classList.remove('chillcopy-iconbtn'); }
            };
            return inst;
        });
        return {
            instances,
            destroy() { instances.forEach(i => i.destroy()); if (live.parentNode) live.parentNode.removeChild(live); }
        };
    }

    /** Build a ready-made copy button. */
    function create(options) {
        injectCSS();
        const o = Object.assign({ label: 'Copy', icon: true, ariaLabel: null }, options || {});
        const btn = document.createElement('button');
        btn.type = 'button';
        const live = makeLive();
        const inst = new ChillCopyInstance(btn, o, live);
        if (o.icon) {
            const ic = document.createElement('span');
            ic.className = 'chillcopy-icon';
            ic.innerHTML = ICON_COPY;
            btn.insertBefore(ic, btn.firstChild);
            inst._iconEl = ic;
            inst._iconOriginal = ICON_COPY;
        }
        if (o.label) {
            const sp = document.createElement('span');
            sp.textContent = String(o.label);
            btn.insertBefore(sp, inst.tip || null);
            inst._label = sp;
        } else {
            btn.classList.add('chillcopy-iconbtn');
            btn.setAttribute('aria-label', o.ariaLabel || 'Copy to clipboard');
        }
        inst._created = true;
        const origDestroy = inst.destroy.bind(inst);
        inst.destroy = function () { origDestroy(); if (live.parentNode) live.parentNode.removeChild(live); };
        return inst;
    }

    const ChillCopy = {
        version: VERSION,
        copy,
        init,
        create,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCopy;
    } else {
        window.ChillCopy = ChillCopy;
    }

})(typeof window !== 'undefined' ? window : this);
