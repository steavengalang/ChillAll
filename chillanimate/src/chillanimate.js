/**
 * ChillAnimate - Web Animations API helpers
 *
 * @example
 *   await ChillAnimate.fadeIn(modalEl);
 *   await ChillAnimate.slideUp(panel, { duration: 300 });
 *   ChillAnimate.shake(inputEl);                    // validation error
 *   ChillAnimate.pulse(badge, { scale: 1.2 });
 *   const p = ChillAnimate.collapse(section, { trigger: btn }); p.cancel();
 *
 * Every helper returns a Promise<Element> (resolves when the animation finished OR was cancelled) that also has
 * `.cancel()`, `.finish()` and `.animation` (the underlying WAAPI Animation, when supported).
 * When `prefers-reduced-motion: reduce` is active (or WAAPI is unavailable) the end state is applied immediately
 * with no animation, so code that awaits the promise behaves identically.
 *
 * Common options: duration (250 ms), easing ('ease-out'), delay (0), respectReducedMotion (true).
 *   fadeIn(el, {display})           removes [hidden]; display defaults to the element's natural display (or 'block')
 *   fadeOut(el, {hide = true})      sets display:none when finished (hide:false keeps it, opacity restored to 1)
 *   slideDown(el) / slideUp(el)     height animation, toggles display:none
 *   expand(el, {trigger}) / collapse(el, {trigger})   height + padding + margin + opacity, toggles the [hidden] attribute and
 *                                   aria-expanded on `trigger`
 *   shake(el, {distance = 8, count = 4})   pulse(el, {scale = 1.08})
 *   animate(el, keyframes, options) generic wrapper;  stop(el) cancels the running ChillAnimate animation of an element.
 *
 * @version 1.0.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const running = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    function prefersReducedMotion() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (e) { return false; }
    }

    function resolveEl(el) {
        if (typeof el === 'string') return typeof document !== 'undefined' ? document.querySelector(el) : null;
        return el || null;
    }

    function opt(o, name, dflt) { return o && o[name] !== undefined ? o[name] : dflt; }

    /**
     * Core runner. `cleanup` runs always (finish or cancel) and must reset temporary inline styles.
     * `done` runs only when the animation (or instant path) completes normally.
     */
    function play(el, keyframes, o, done, cleanup) {
        el = resolveEl(el);
        let anim = null, settled = false, resolveFn;
        const promise = new Promise(function (r) { resolveFn = r; });
        const settle = function (finished) {
            if (settled) return;
            settled = true;
            if (running && el) { const rec = running.get(el); if (rec && rec.anim === anim) running.delete(el); }
            if (cleanup) cleanup();
            if (finished && done) done();
            resolveFn(el);
        };
        promise.cancel = function () { if (anim) anim.cancel(); else settle(false); };
        promise.finish = function () { if (anim) anim.finish(); else settle(true); };
        promise.animation = null;
        if (!el) { settled = true; resolveFn(null); return promise; }

        const reduced = opt(o, 'respectReducedMotion', true) && prefersReducedMotion();
        const duration = Number(opt(o, 'duration', 250));
        stop(el);

        if (reduced || !(duration > 0) || typeof el.animate !== 'function' || !keyframes) {
            settle(true);
            return promise;
        }
        try {
            anim = el.animate(keyframes, {
                duration: duration,
                easing: opt(o, 'easing', 'ease-out'),
                delay: Number(opt(o, 'delay', 0)),
                iterations: opt(o, 'iterations', 1),
                fill: 'none'
            });
        } catch (e) { anim = null; settle(true); return promise; }
        promise.animation = anim;
        if (running) running.set(el, { anim: anim, settle: settle });
        anim.onfinish = function () { settle(true); };
        anim.oncancel = function () { settle(false); };
        return promise;
    }

    function naturalDisplay(el) {
        const inline = el.style.display;
        if (inline && inline !== 'none') return inline;
        let d = '';
        try {
            el.style.display = '';
            d = window.getComputedStyle(el).display;
        } catch (e) { /* ignore */ }
        return !d || d === 'none' ? 'block' : '';
    }

    function show(el, display) {
        el.removeAttribute('hidden');
        el.style.display = display !== undefined ? display : naturalDisplay(el);
    }

    // ---- fade ----
    function fadeIn(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        show(el, opt(o, 'display', undefined));
        return play(el, [{ opacity: 0 }, { opacity: 1 }], o, null, function () { el.style.opacity = ''; });
    }

    function fadeOut(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        const hide = opt(o, 'hide', true);
        return play(el, [{ opacity: 1 }, { opacity: 0 }], o, function () {
            if (hide) el.style.display = 'none';
        }, function () { el.style.opacity = ''; });
    }

    // ---- height based ----
    function slideDown(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        show(el, opt(o, 'display', undefined));
        const target = el.scrollHeight;
        el.style.overflow = 'hidden';
        return play(el, target > 0 ? [{ height: '0px' }, { height: target + 'px' }] : null, o, null, function () { el.style.overflow = ''; el.style.height = ''; });
    }

    function slideUp(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        const start = el.offsetHeight || el.scrollHeight;
        el.style.overflow = 'hidden';
        return play(el, start > 0 ? [{ height: start + 'px' }, { height: '0px' }] : null, o, function () {
            el.style.display = 'none';
        }, function () { el.style.overflow = ''; el.style.height = ''; });
    }

    function setExpanded(trigger, value) {
        trigger = resolveEl(trigger);
        if (trigger && trigger.setAttribute) trigger.setAttribute('aria-expanded', value ? 'true' : 'false');
    }

    function expand(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        el.removeAttribute('hidden');
        el.style.display = opt(o, 'display', el.style.display === 'none' ? '' : el.style.display);
        setExpanded(opt(o, 'trigger', null), true);
        const h = el.scrollHeight;
        el.style.overflow = 'hidden';
        const frames = h > 0 ? [
            { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: '0px', opacity: 0 },
            { height: h + 'px', opacity: 1 }
        ] : null;
        return play(el, frames, o, null, function () { el.style.overflow = ''; el.style.height = ''; });
    }

    function collapse(el, o) {
        el = resolveEl(el); if (!el) return play(null);
        stop(el);
        setExpanded(opt(o, 'trigger', null), false);
        const h = el.offsetHeight || el.scrollHeight;
        el.style.overflow = 'hidden';
        const frames = h > 0 ? [
            { height: h + 'px', opacity: 1 },
            { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: '0px', opacity: 0 }
        ] : null;
        return play(el, frames, o, function () { el.setAttribute('hidden', ''); }, function () { el.style.overflow = ''; el.style.height = ''; });
    }

    // ---- attention seekers ----
    function shake(el, o) {
        const d = Number(opt(o, 'distance', 8));
        const count = Math.max(1, Number(opt(o, 'count', 4)));
        const frames = [{ transform: 'translateX(0)' }];
        for (let i = 0; i < count; i++) {
            const sign = i % 2 === 0 ? -1 : 1;
            const amp = d * (1 - i / (count + 1));
            frames.push({ transform: 'translateX(' + (sign * amp).toFixed(2) + 'px)' });
        }
        frames.push({ transform: 'translateX(0)' });
        return play(el, frames, Object.assign({ duration: 400, easing: 'ease-in-out' }, o));
    }

    function pulse(el, o) {
        const s = Number(opt(o, 'scale', 1.08));
        return play(el, [{ transform: 'scale(1)' }, { transform: 'scale(' + s + ')', offset: 0.5 }, { transform: 'scale(1)' }],
            Object.assign({ duration: 400, easing: 'ease-in-out' }, o));
    }

    /** Generic WAAPI wrapper with the same reduced-motion / fallback behaviour. */
    function animate(el, keyframes, o) { return play(el, keyframes, o); }

    /** Cancel the animation currently running on el (started by ChillAnimate). */
    function stop(el) {
        el = resolveEl(el);
        const rec = el && running && running.get(el);
        if (!rec) return false;
        try { rec.anim.cancel(); } catch (e) { /* ignore */ }
        rec.settle(false); // run cleanup synchronously so the next animation starts from a clean state
        return true;
    }

    const ChillAnimate = {
        version: VERSION,
        fadeIn: fadeIn, fadeOut: fadeOut,
        slideDown: slideDown, slideUp: slideUp,
        expand: expand, collapse: collapse,
        shake: shake, pulse: pulse,
        animate: animate, stop: stop,
        prefersReducedMotion: prefersReducedMotion,
        injectCSS: function () { /* no styles */ }
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillAnimate; }
    else { window.ChillAnimate = ChillAnimate; }
})(typeof window !== 'undefined' ? window : this);
