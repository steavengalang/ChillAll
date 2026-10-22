/**
 * ChillFocusTrap - Zero-dependency Focus Trap Utility
 *
 * @example
 *   const trap = ChillFocusTrap.create('#dialog', { initialFocus: '#name', returnFocus: true, onDeactivate: close });
 *   trap.activate();    // Tab / Shift+Tab now cycle inside #dialog, focus moves in
 *   trap.deactivate();  // focus returns to the element that had it before
 *   trap.destroy();
 *
 * Options:
 *   initialFocus      selector | Element | () => Element   first tabbable element (or the container)
 *   returnFocus       boolean  true   restore focus to the previously focused element on deactivate
 *   escapeDeactivates boolean  true   Escape deactivates the trap
 *   clickOutsideDeactivates boolean false   mousedown outside deactivates (otherwise focus is pulled back inside)
 *   onActivate(), onDeactivate()
 *
 * Fixes vs 1.0: works for position:fixed dialogs (the old `offsetParent` visibility test dropped them), skips hidden /
 * disabled / inert / tabindex="-1" / input[type=hidden] elements, includes contenteditable / summary / audio+video controls,
 * focus that escapes (programmatic focus or a click outside) is pulled back, no focus timers survive deactivate(), nested
 * traps stack (activating a second trap pauses the first and resuming happens automatically), destroy() added.
 *
 * Instance: activate(), deactivate({returnFocus}), pause(), resume(), destroy(), updateFocusables(), isActive (getter)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const FOCUSABLE = [
        'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'summary',
        'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', '[tabindex]'
    ].join(',');

    const stack = []; // active traps, last = top

    function isHiddenByStyle(el) {
        try {
            if (typeof el.checkVisibility === 'function') return !el.checkVisibility({ visibilityProperty: true });
        } catch (e) { /* fall through */ }
        let node = el;
        while (node && node.nodeType === 1) {
            if (node.hidden) return true;
            let cs = null;
            try { cs = window.getComputedStyle(node); } catch (e) { /* ignore */ }
            if (cs && (cs.display === 'none' || (node === el && cs.visibility === 'hidden'))) return true;
            node = node.parentElement;
        }
        return false;
    }

    function isTabbable(el) {
        if (el.disabled) return false;
        if (el.tagName === 'INPUT' && el.type === 'hidden') return false;
        const ti = el.getAttribute('tabindex');
        if (ti !== null && parseInt(ti, 10) < 0) return false;
        if (el.closest && el.closest('[inert]')) return false;
        if (el.tagName === 'A' || el.tagName === 'AREA') { /* href already matched by selector */ }
        return !isHiddenByStyle(el);
    }

    class FocusTrapInstance {
        constructor(element, options) {
            options = options || {};
            this.element = typeof element === 'string' ? document.querySelector(element) : element;
            if (!this.element) throw new Error('ChillFocusTrap: element not found');
            this.options = Object.assign({
                initialFocus: null, returnFocus: true, escapeDeactivates: true, clickOutsideDeactivates: false,
                onActivate: null, onDeactivate: null
            }, options);
            this.options.returnFocus = options.returnFocus !== false;
            this.options.escapeDeactivates = options.escapeDeactivates !== false;
            this.active = false;
            this.paused = false;
            this.previouslyFocused = null;
            this._listening = false;
            this._raf = null;
            this._destroyed = false;
            this.handleKeydown = this.handleKeydown.bind(this);
            this.handleFocusIn = this.handleFocusIn.bind(this);
            this.handleMouseDown = this.handleMouseDown.bind(this);
        }

        get isActive() { return this.active; }

        getFocusableElements() {
            return Array.prototype.filter.call(this.element.querySelectorAll(FOCUSABLE), isTabbable);
        }
        updateFocusables() { return this.getFocusableElements(); }

        _resolveInitial() {
            const i = this.options.initialFocus;
            let el = null;
            if (typeof i === 'function') el = i();
            else if (typeof i === 'string') el = this.element.querySelector(i);
            else if (i && i.nodeType) el = i;
            return el || this.getFocusableElements()[0] || null;
        }

        _focus(el) {
            if (!el || !el.focus) return;
            try { el.focus({ preventScroll: false }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } }
        }

        _focusInside() {
            const target = this._resolveInitial();
            if (target) { this._focus(target); return; }
            // nothing tabbable: make the container itself focusable so focus cannot leak
            if (!this.element.hasAttribute('tabindex')) { this.element.setAttribute('tabindex', '-1'); this._tmpTabindex = true; }
            this._focus(this.element);
        }

        _listen() {
            if (this._listening) return;
            document.addEventListener('keydown', this.handleKeydown, true);
            document.addEventListener('focusin', this.handleFocusIn, true);
            document.addEventListener('mousedown', this.handleMouseDown, true);
            this._listening = true;
        }
        _unlisten() {
            if (!this._listening) return;
            document.removeEventListener('keydown', this.handleKeydown, true);
            document.removeEventListener('focusin', this.handleFocusIn, true);
            document.removeEventListener('mousedown', this.handleMouseDown, true);
            this._listening = false;
        }

        activate() {
            if (this.active || this._destroyed) return this;
            this.active = true;
            this.paused = false;
            this.previouslyFocused = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
            const top = stack[stack.length - 1];
            if (top && top !== this) top._suspend();
            stack.push(this);
            this._listen();
            this._focusInside();
            // some browsers need a frame (element just became visible): retry once, cancelled on deactivate
            if (!this.element.contains(document.activeElement) && typeof window.requestAnimationFrame === 'function') {
                this._raf = window.requestAnimationFrame(() => { this._raf = null; if (this.active && !this.element.contains(document.activeElement)) this._focusInside(); });
            }
            if (this.options.onActivate) { try { this.options.onActivate(); } catch (e) { /* ignore */ } }
            return this;
        }

        deactivate(opts) {
            if (!this.active) return this;
            this.active = false;
            this._unlisten();
            if (this._raf !== null && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(this._raf);
            this._raf = null;
            const i = stack.indexOf(this);
            if (i > -1) stack.splice(i, 1);
            if (this._tmpTabindex) { this.element.removeAttribute('tabindex'); this._tmpTabindex = false; }
            const next = stack[stack.length - 1];
            if (next) next._resumeFromStack();
            const returnFocus = opts && opts.returnFocus !== undefined ? opts.returnFocus : this.options.returnFocus;
            const prev = this.previouslyFocused;
            this.previouslyFocused = null;
            if (returnFocus && prev && document.contains(prev) && prev.focus) { try { prev.focus(); } catch (e) { /* ignore */ } }
            if (this.options.onDeactivate) { try { this.options.onDeactivate(); } catch (e) { /* ignore */ } }
            return this;
        }

        _suspend() { this._unlisten(); }
        _resumeFromStack() { if (this.active && !this.paused) this._listen(); }

        handleKeydown(e) {
            if (!this.active || this.paused) return;
            if (e.key === 'Escape' && this.options.escapeDeactivates) { e.stopPropagation(); this.deactivate(); return; }
            if (e.key !== 'Tab') return;
            const elements = this.getFocusableElements();
            if (elements.length === 0) { e.preventDefault(); this._focusInside(); return; }
            const first = elements[0], last = elements[elements.length - 1];
            const activeEl = document.activeElement;
            if (!this.element.contains(activeEl)) { e.preventDefault(); this._focus(e.shiftKey ? last : first); return; }
            if (e.shiftKey && (activeEl === first || activeEl === this.element)) { e.preventDefault(); this._focus(last); }
            else if (!e.shiftKey && activeEl === last) { e.preventDefault(); this._focus(first); }
        }

        handleFocusIn(e) {
            if (!this.active || this.paused) return;
            if (this.element.contains(e.target)) return;
            // focus escaped (programmatic focus, screen reader navigation, ...): pull it back
            this._focusInside();
        }

        handleMouseDown(e) {
            if (!this.active || this.paused) return;
            if (this.element.contains(e.target)) return;
            if (this.options.clickOutsideDeactivates) this.deactivate({ returnFocus: false });
            else e.preventDefault(); // keep focus where it is
        }

        pause() { this.paused = true; return this; }
        resume() { this.paused = false; return this; }

        destroy() {
            if (this._destroyed) return;
            this.deactivate();
            this._destroyed = true;
        }
    }

    const ChillFocusTrap = {
        version: VERSION,
        create(element, options) { return new FocusTrapInstance(element, options); },
        FocusTrap: FocusTrapInstance,
        isTabbable: isTabbable
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillFocusTrap; }
    else { window.ChillFocusTrap = ChillFocusTrap; }
})(typeof window !== 'undefined' ? window : this);
