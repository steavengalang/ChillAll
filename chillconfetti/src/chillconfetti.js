/**
 * ChillConfetti - Tiny zero-dependency canvas confetti burst
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   ChillConfetti.fire();                                              // default burst from the lower-middle of the screen
 *   ChillConfetti.fire({ origin: { x: 0.2, y: 0.7 }, count: 150, spread: 80, colors: ['#3b82f6', '#22c55e'] })
 *     .then(() => console.log('done'));
 *   ChillConfetti.fire({ origin: buttonElement });                      // burst from the centre of an element
 *   ChillConfetti.reset();                                              // stop everything and remove the canvas
 *
 * Options
 *   origin        { x, y } as fractions 0..1 of the viewport | Element | { px: x, py: y } in pixels   default { x: 0.5, y: 0.6 }
 *   count         number of particles                            default 100
 *   colors        array of CSS colours                           default a bright palette
 *   spread        cone width in degrees                          default 70
 *   angle         centre direction in degrees (90 = up)          default 90
 *   startVelocity initial speed (px/frame)                       default 45
 *   gravity       downward pull multiplier                       default 1
 *   decay         velocity decay per frame (0..1)                default 0.9
 *   drift         horizontal drift                               default 0
 *   ticks         lifetime in frames                             default 200
 *   scalar        particle size multiplier                       default 1
 *   shapes        array of 'square' | 'circle' | 'strip'         default ['square', 'circle', 'strip']
 *   zIndex        canvas z-index                                 default 10007
 *   disableForReducedMotion  skip when prefers-reduced-motion    default true
 *
 * fire() returns a Promise that resolves when that burst has finished (or immediately when skipped).
 * The single shared canvas is created lazily, is pointer-events:none / aria-hidden, and is removed automatically.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const DEFAULT_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
    const DEG = Math.PI / 180;

    let canvas = null;
    let ctx = null;
    let bursts = [];
    let raf = null;
    let dpr = 1;
    let resizeBound = false;

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function sizeCanvas() {
        if (!canvas) return;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = window.innerWidth || 800, h = window.innerHeight || 600;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }

    function ensureCanvas(zIndex) {
        if (canvas) { canvas.style.zIndex = String(zIndex); return !!ctx; }
        canvas = document.createElement('canvas');
        canvas.className = 'chillconfetti-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:' + zIndex + ';';
        sizeCanvas();
        try { ctx = canvas.getContext && canvas.getContext('2d'); } catch (e) { ctx = null; }
        document.body.appendChild(canvas);
        if (!resizeBound) { window.addEventListener('resize', sizeCanvas); resizeBound = true; }
        return !!ctx;
    }

    function teardown() {
        if (raf != null && window.cancelAnimationFrame) { try { window.cancelAnimationFrame(raf); } catch (e) { /* ignore */ } }
        raf = null;
        if (resizeBound) { window.removeEventListener('resize', sizeCanvas); resizeBound = false; }
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null; ctx = null;
    }

    function originPx(origin) {
        const w = window.innerWidth || 800, h = window.innerHeight || 600;
        if (origin && origin.nodeType === 1) {
            const r = origin.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        if (origin && typeof origin.px === 'number') return { x: origin.px, y: origin.py };
        const o = origin || {};
        return { x: (typeof o.x === 'number' ? o.x : 0.5) * w, y: (typeof o.y === 'number' ? o.y : 0.6) * h };
    }

    function makeParticles(o) {
        const p0 = originPx(o.origin);
        const out = [];
        for (let i = 0; i < o.count; i++) {
            const angle = (o.angle + (Math.random() - 0.5) * o.spread) * DEG; // 90deg = straight up
            const speed = o.startVelocity * (0.5 + Math.random() * 0.5);
            out.push({
                x: p0.x, y: p0.y,
                vx: Math.cos(angle) * speed,
                vy: -Math.sin(angle) * speed,
                color: o.colors[i % o.colors.length],
                shape: o.shapes[Math.floor(Math.random() * o.shapes.length)],
                size: (6 + Math.random() * 6) * o.scalar,
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 18,
                wobble: Math.random() * 10,
                wobbleSpeed: 0.05 + Math.random() * 0.1,
                tick: 0,
                total: Math.round(o.ticks * (0.75 + Math.random() * 0.25))
            });
        }
        return out;
    }

    function drawParticle(c, p) {
        const progress = p.tick / p.total;
        c.save();
        c.globalAlpha = Math.max(0, 1 - progress * progress);
        c.translate(p.x, p.y);
        c.rotate(p.rot * DEG);
        c.fillStyle = p.color;
        const w = p.size, tilt = 0.4 + Math.abs(Math.cos(p.wobble)) * 0.6;
        if (p.shape === 'circle') {
            c.beginPath();
            if (c.ellipse) c.ellipse(0, 0, w / 2, (w / 2) * tilt, 0, 0, 2 * Math.PI); else c.arc(0, 0, w / 2, 0, 2 * Math.PI);
            c.fill();
        } else if (p.shape === 'strip') {
            c.fillRect(-w / 2, -w / 6 * tilt, w * 1.4, w / 3 * tilt);
        } else {
            c.fillRect(-w / 2, -w / 2 * tilt, w, w * tilt);
        }
        c.restore();
    }

    function frame() {
        raf = null;
        if (!canvas || !ctx) return finishAll();
        const h = window.innerHeight || 600, w = window.innerWidth || 800;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        bursts = bursts.filter(b => {
            const o = b.opts;
            b.particles = b.particles.filter(p => {
                p.vx = p.vx * o.decay + o.drift;
                p.vy = p.vy * o.decay + o.gravity * 0.6;
                p.x += p.vx; p.y += p.vy;
                p.rot += p.rotSpeed; p.wobble += p.wobbleSpeed;
                p.tick++;
                if (p.tick >= p.total || p.y > h + 60) return false;
                drawParticle(ctx, p);
                return true;
            });
            if (!b.particles.length) { b.resolve(); return false; }
            return true;
        });
        if (bursts.length) raf = (window.requestAnimationFrame || (fn => setTimeout(fn, 16)))(frame);
        else teardown();
    }

    function finishAll() {
        const pending = bursts; bursts = [];
        pending.forEach(b => b.resolve());
        teardown();
    }

    /** Fire a confetti burst. Returns a Promise resolved when the burst is gone. */
    function fire(options) {
        if (typeof document === 'undefined' || !document.body) return Promise.resolve();
        const o = Object.assign({
            origin: { x: 0.5, y: 0.6 }, count: 100, colors: DEFAULT_COLORS, spread: 70, angle: 90, startVelocity: 45,
            gravity: 1, decay: 0.9, drift: 0, ticks: 200, scalar: 1, shapes: ['square', 'circle', 'strip'], zIndex: 10007,
            disableForReducedMotion: true
        }, options || {});
        if (o.disableForReducedMotion && reducedMotion()) return Promise.resolve();
        o.count = Math.max(0, Math.min(2000, Math.floor(o.count)));
        if (!o.colors || !o.colors.length) o.colors = DEFAULT_COLORS;
        if (!o.shapes || !o.shapes.length) o.shapes = ['square'];
        if (!o.count) return Promise.resolve();
        return new Promise(resolve => {
            if (!ensureCanvas(o.zIndex)) { teardown(); resolve(); return; }
            bursts.push({ opts: o, particles: makeParticles(o), resolve });
            if (raf == null) raf = (window.requestAnimationFrame || (fn => setTimeout(fn, 16)))(frame);
        });
    }

    /** Stop all bursts immediately and remove the canvas. */
    function reset() { finishAll(); }

    const ChillConfetti = {
        version: VERSION,
        fire,
        reset,
        /** true while particles are animating */
        get active() { return bursts.length > 0; }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillConfetti;
    } else {
        window.ChillConfetti = ChillConfetti;
    }

})(typeof window !== 'undefined' ? window : this);
