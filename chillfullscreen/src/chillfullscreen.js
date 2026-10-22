/**
 * ChillFullscreen - Fullscreen API wrapper with prefixed fallback and toggle-button helper
 *
 * @example
 *   if (ChillFullscreen.isSupported()) ChillFullscreen.toggle(videoEl);
 *   const off = ChillFullscreen.onChange(({ isFullscreen, element }) => {});
 *
 *   // ready-made accessible toggle button (icon swaps, aria-pressed/aria-label kept in sync)
 *   const btn = ChillFullscreen.createButton({ target: '#player', size: 'md' });
 *   toolbar.appendChild(btn.element);   // btn.destroy() when done
 *
 *   // enhance existing markup:  <button data-chill-fullscreen="#player">Fullscreen</button>
 *   ChillFullscreen.init('[data-chill-fullscreen]');
 *
 * Methods (all Promise based, never throw when unsupported - they resolve false):
 *   isSupported(), isFullscreen(), element(), request(el = <html>, {navigationUI}), exit(), toggle(el)
 *   onChange(fn) -> unsubscribe; fn({ isFullscreen, element }) fires on every fullscreenchange (incl. Esc)
 *   onError(fn)  -> unsubscribe
 *   createButton(options)  target (element|selector, default document.documentElement), size 'sm'|'md'|'lg' ('md'),
 *       variant 'ghost'|'solid' ('ghost'), enterLabel 'Enter fullscreen', exitLabel 'Exit fullscreen', className, onChange
 *       -> { element, update(), destroy() }; hidden automatically when the API is unsupported.
 *   init(selectorOrElement, { target, enterLabel, exitLabel }) -> { destroy() }   (target also via data-chill-fullscreen)
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_FLAG = '__chillfullscreen_css_injected__';
    const listeners = new Set();
    const errorListeners = new Set();
    let bound = false;

    const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    const ERROR_EVENTS = ['fullscreenerror', 'webkitfullscreenerror', 'mozfullscreenerror', 'MSFullscreenError'];

    function doc() { return typeof document !== 'undefined' ? document : null; }

    function pick(obj, names) {
        for (let i = 0; i < names.length; i++) if (obj && typeof obj[names[i]] === 'function') return names[i];
        return null;
    }
    function requestName(el) { return pick(el, ['requestFullscreen', 'webkitRequestFullscreen', 'webkitRequestFullScreen', 'mozRequestFullScreen', 'msRequestFullscreen']); }
    function exitName(d) { return pick(d, ['exitFullscreen', 'webkitExitFullscreen', 'webkitCancelFullScreen', 'mozCancelFullScreen', 'msExitFullscreen']); }

    function element() {
        const d = doc();
        if (!d) return null;
        return d.fullscreenElement || d.webkitFullscreenElement || d.webkitCurrentFullScreenElement || d.mozFullScreenElement || d.msFullscreenElement || null;
    }

    function isSupported() {
        const d = doc();
        if (!d || !d.documentElement) return false;
        if (d.fullscreenEnabled === false || d.webkitFullscreenEnabled === false || d.mozFullScreenEnabled === false || d.msFullscreenEnabled === false) return false;
        return !!requestName(d.documentElement);
    }

    function isFullscreen() { return !!element(); }

    function resolveEl(t) {
        const d = doc();
        if (!d) return null;
        if (!t) return d.documentElement;
        if (typeof t === 'string') return d.querySelector(t);
        return t;
    }

    function request(el, options) {
        const target = resolveEl(el);
        if (!target || !isSupported()) return Promise.resolve(false);
        const name = requestName(target);
        try {
            const r = options && options.navigationUI ? target[name]({ navigationUI: options.navigationUI }) : target[name]();
            return Promise.resolve(r).then(function () { return true; }, function (err) { emitError(err); return false; });
        } catch (err) { emitError(err); return Promise.resolve(false); }
    }

    function exit() {
        const d = doc();
        if (!d || !isFullscreen()) return Promise.resolve(false);
        const name = exitName(d);
        if (!name) return Promise.resolve(false);
        try {
            return Promise.resolve(d[name]()).then(function () { return true; }, function (err) { emitError(err); return false; });
        } catch (err) { emitError(err); return Promise.resolve(false); }
    }

    function toggle(el) {
        const target = resolveEl(el);
        if (isFullscreen()) {
            // A different, unrelated element is fullscreen: switch to the requested one, otherwise leave fullscreen.
            const cur = element();
            if (target && cur !== target && !(target.contains && target.contains(cur))) return request(target);
            return exit();
        }
        return request(target);
    }

    function emitChange() {
        const payload = { isFullscreen: isFullscreen(), element: element() };
        Array.from(listeners).forEach(function (fn) { try { fn(payload); } catch (e) { /* ignore */ } });
    }
    function emitError(err) {
        errorListeners.forEach(function (fn) { try { fn(err); } catch (e) { /* ignore */ } });
    }

    function bind() {
        const d = doc();
        if (bound || !d) return;
        bound = true;
        CHANGE_EVENTS.forEach(function (n) { d.addEventListener(n, emitChange); });
        ERROR_EVENTS.forEach(function (n) { d.addEventListener(n, emitError); });
    }
    function unbindIfIdle() {
        const d = doc();
        if (!bound || !d || listeners.size || errorListeners.size) return;
        bound = false;
        CHANGE_EVENTS.forEach(function (n) { d.removeEventListener(n, emitChange); });
        ERROR_EVENTS.forEach(function (n) { d.removeEventListener(n, emitError); });
    }

    function onChange(fn) {
        if (typeof fn !== 'function') throw new TypeError('ChillFullscreen.onChange: handler must be a function');
        listeners.add(fn);
        bind();
        return function off() { listeners.delete(fn); unbindIfIdle(); };
    }
    function onError(fn) {
        if (typeof fn !== 'function') throw new TypeError('ChillFullscreen.onError: handler must be a function');
        errorListeners.add(fn);
        bind();
        return function off() { errorListeners.delete(fn); unbindIfIdle(); };
    }

    // ---------- button helper ----------
    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_FLAG] || document.getElementById('chillfullscreen-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillfullscreen-styles';
        style.textContent = `
      :root {
        --chillfullscreen-color: #171717;
        --chillfullscreen-bg: transparent;
        --chillfullscreen-hover: #f3f4f6;
        --chillfullscreen-solid-bg: #3b82f6;
        --chillfullscreen-solid-hover: #2563eb;
        --chillfullscreen-solid-color: #ffffff;
        --chillfullscreen-ring: rgba(59, 130, 246, 0.45);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillfullscreen-color: #fafafa;
          --chillfullscreen-hover: #2a2a2a;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillfullscreen-color: #fafafa;
        --chillfullscreen-hover: #2a2a2a;
      }
      .chillfullscreen-btn {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 32px; min-height: 32px; padding: 6px;
        border: none; border-radius: 8px; cursor: pointer;
        background: var(--chillfullscreen-bg); color: var(--chillfullscreen-color);
        font: inherit; line-height: 1; transition: background 0.15s ease, box-shadow 0.15s ease;
      }
      .chillfullscreen-btn:hover { background: var(--chillfullscreen-hover); }
      .chillfullscreen-btn:focus { outline: none; }
      .chillfullscreen-btn:focus-visible { box-shadow: 0 0 0 3px var(--chillfullscreen-ring); }
      .chillfullscreen-btn-solid { background: var(--chillfullscreen-solid-bg); color: var(--chillfullscreen-solid-color); }
      .chillfullscreen-btn-solid:hover { background: var(--chillfullscreen-solid-hover); }
      .chillfullscreen-btn-sm { min-width: 32px; min-height: 32px; padding: 6px; }
      .chillfullscreen-btn-md { min-width: 36px; min-height: 36px; padding: 8px; }
      .chillfullscreen-btn-lg { min-width: 44px; min-height: 44px; padding: 10px; }
      .chillfullscreen-btn svg { width: 18px; height: 18px; display: block; }
      .chillfullscreen-btn-lg svg { width: 22px; height: 22px; }
      .chillfullscreen-btn .chillfullscreen-icon-exit { display: none; }
      .chillfullscreen-btn[aria-pressed="true"] .chillfullscreen-icon-enter { display: none; }
      .chillfullscreen-btn[aria-pressed="true"] .chillfullscreen-icon-exit { display: block; }
      .chillfullscreen-btn[hidden] { display: none; }
      @media (prefers-reduced-motion: reduce) { .chillfullscreen-btn { transition: none; } }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_FLAG] = true;
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';
    function icon(cls, paths) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('class', cls);
        paths.forEach(function (d) {
            const p = document.createElementNS(SVG_NS, 'path');
            p.setAttribute('d', d);
            svg.appendChild(p);
        });
        return svg;
    }

    function wire(btn, target, o) {
        const enterLabel = o.enterLabel || 'Enter fullscreen';
        const exitLabel = o.exitLabel || 'Exit fullscreen';
        function update() {
            const t = resolveEl(target);
            const active = isFullscreen() && (!t || element() === t || (t.contains && t.contains(element())));
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            if (!btn.hasAttribute('data-chill-fs-text')) btn.setAttribute('aria-label', active ? exitLabel : enterLabel);
            if (!isSupported()) btn.setAttribute('hidden', ''); else btn.removeAttribute('hidden');
            return active;
        }
        const onClick = function (e) { e.preventDefault(); toggle(resolveEl(target)); };
        btn.addEventListener('click', onClick);
        const off = onChange(function (state) { const a = update(); if (o.onChange) o.onChange(Object.assign({ active: a }, state)); });
        update();
        return { update: update, destroy: function () { btn.removeEventListener('click', onClick); off(); } };
    }

    function createButton(options) {
        options = options || {};
        injectCSS();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chillfullscreen-btn chillfullscreen-btn-' + (options.size || 'md') +
            (options.variant === 'solid' ? ' chillfullscreen-btn-solid' : '') + (options.className ? ' ' + options.className : '');
        btn.appendChild(icon('chillfullscreen-icon-enter', ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3']));
        btn.appendChild(icon('chillfullscreen-icon-exit', ['M8 3v3a2 2 0 0 1-2 2H3', 'M21 8h-3a2 2 0 0 1-2-2V3', 'M3 16h3a2 2 0 0 1 2 2v3', 'M16 21v-3a2 2 0 0 1 2-2h3']));
        const w = wire(btn, options.target, options);
        return {
            element: btn,
            update: w.update,
            destroy: function () { w.destroy(); if (btn.parentNode) btn.parentNode.removeChild(btn); }
        };
    }

    /** Enhance existing elements; target comes from options.target or the data-chill-fullscreen attribute. */
    function init(selector, options) {
        options = options || {};
        injectCSS();
        const nodes = typeof selector === 'string' ? Array.prototype.slice.call(document.querySelectorAll(selector))
            : (selector && selector.nodeType ? [selector] : Array.prototype.slice.call(selector || []));
        const parts = nodes.map(function (el) {
            const attr = el.getAttribute('data-chill-fullscreen');
            const target = options.target || (attr ? attr : null);
            el.classList.add('chillfullscreen-btn');
            if (!el.getAttribute('type') && el.tagName === 'BUTTON') el.setAttribute('type', 'button');
            if (el.textContent.trim()) el.setAttribute('data-chill-fs-text', '');
            const w = wire(el, target, options);
            return { el: el, w: w };
        });
        return {
            update: function () { parts.forEach(function (p) { p.w.update(); }); },
            destroy: function () {
                parts.forEach(function (p) {
                    p.w.destroy();
                    p.el.classList.remove('chillfullscreen-btn');
                    p.el.removeAttribute('aria-pressed');
                    p.el.removeAttribute('data-chill-fs-text');
                });
                parts.length = 0;
            }
        };
    }

    const ChillFullscreen = {
        version: VERSION,
        isSupported: isSupported,
        isFullscreen: isFullscreen,
        element: element,
        request: request,
        exit: exit,
        toggle: toggle,
        onChange: onChange,
        onError: onError,
        createButton: createButton,
        init: init,
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillFullscreen; }
    else { window.ChillFullscreen = ChillFullscreen; }
})(typeof window !== 'undefined' ? window : this);
