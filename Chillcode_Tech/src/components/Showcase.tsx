import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadChillAll, runSnippet } from '../lib/chillall';
import './Landing.css';
import '../docs/preview.css';

interface Demo { title: string; hint: string; to: string; height?: number; wide?: boolean; code: string }

const DEMOS: Demo[] = [
    {
        title: 'Range slider', hint: 'Drag, or use the arrow keys', to: '/docs/slider', height: 110,
        code: `ChillSlider.create({ range: true, value: [20, 70], marks: true, tooltip: 'always', container: root });`,
    },
    {
        title: 'Rating & segmented control', hint: 'Half stars, keyboard friendly', to: '/docs/rating', height: 110,
        code: `root.style.cssText += ';display:grid;gap:16px;justify-items:start';
ChillRating.create({ value: 3.5, half: true, container: root });
ChillSegmented.create({ items: ['Day', 'Week', 'Month'], value: 'Week', container: root });`,
    },
    {
        title: 'Stat card', hint: 'Count-up, delta and sparkline', to: '/docs/stat', height: 150,
        code: `const stat = ChillStat.create({ label: 'Revenue', value: 12840, prefix: '$', delta: 12.5, sparkline: [3, 5, 4, 7, 6, 9, 12], countUp: true });
root.append(stat.element);
cleanup(() => stat.destroy());`,
    },
    {
        title: 'Tag input', hint: 'Type, press Enter, try “sv”', to: '/docs/taginput', height: 110,
        code: `const tags = ChillTagInput.create({ value: ['react', 'vue'], suggestions: ['svelte', 'solid', 'angular', 'next', 'nuxt'], container: root });
cleanup(() => tags.destroy());`,
    },
    {
        title: 'OTP input', hint: 'Paste a code or type it', to: '/docs/otp', height: 100,
        code: `const otp = ChillOtp.create({ length: 6, container: root,
  onComplete: (code) => ChillNotify.show({ title: 'Code accepted', message: code, type: 'success', duration: 2500 }) });
cleanup(() => otp.destroy());`,
    },
    {
        title: 'Calendar', hint: 'Pick a range with the mouse or keys', to: '/docs/calendar', height: 330,
        code: `const cal = ChillCalendar.create({ mode: 'range' });
root.append(cal.element);
cleanup(() => cal.destroy());`,
    },
    {
        title: 'Colour picker', hint: 'Swatches, HSV area and hex', to: '/docs/colorpicker', height: 360,
        code: `const picker = ChillColorPicker.create({ value: '#8b5cf6', popover: true, container: root });
cleanup(() => picker.destroy());`,
    },
    {
        title: 'Toasts & confetti', hint: 'Overlays that clean up after themselves', to: '/docs/alert', height: 110,
        code: `const mk = (label, fn) => { const b = ChillButton.create({ text: label, variant: 'outline', onClick: fn }); root.append(b); return b; };
root.style.cssText += ';display:flex;flex-wrap:wrap;gap:8px';
mk('Success toast', () => ChillAlert.toast({ title: 'Saved!', icon: 'success' }));
mk('Confirm', async () => { const ok = await ChillAlert.confirm({ title: 'Delete project?', text: 'This cannot be undone.' }); ChillAlert.toast({ title: ok ? 'Deleted' : 'Kept', icon: ok ? 'error' : 'info' }); });
mk('Confetti 🎉', (e) => ChillConfetti.fire({ origin: e.currentTarget, count: 140 }));`,
    },
];

function Card({ demo }: { demo: Demo }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
        const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setVisible(true); io.disconnect(); } }, { rootMargin: '250px' });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!visible || !ref.current) return;
        const root = ref.current;
        let dispose: (() => void) | null = null;
        let alive = true;
        loadChillAll()
            .then((mod) => runSnippet(demo.code, root, mod))
            .then((d) => { if (alive) dispose = d; else d(); })
            .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
        return () => { alive = false; dispose?.(); root.replaceChildren(); };
    }, [visible, demo.code]);

    return (
        <article className="sc-card">
            <header>
                <div>
                    <h3>{demo.title}</h3>
                    <p>{demo.hint}</p>
                </div>
                <Link to={demo.to} className="sc-link" aria-label={`${demo.title} docs`}>Docs →</Link>
            </header>
            <div className="sc-stage" ref={ref} style={{ minHeight: demo.height || 120 }} aria-busy={!visible} />
            {error && <div className="sc-error" role="alert">{error}</div>}
        </article>
    );
}

export function Showcase() {
    return (
        <section className="showcase" id="showcase" aria-labelledby="showcase-title">
            <div className="landing-container">
                <div className="landing-head">
                    <span className="landing-badge">Live demo</span>
                    <h2 id="showcase-title">Everything below is the real library.</h2>
                    <p>No screenshots, no mock-ups. Click, drag, type and tab around: these are the same components you install, running right here.</p>
                </div>
                <div className="sc-grid">
                    {DEMOS.map((d) => <Card key={d.title} demo={d} />)}
                </div>
                <div className="landing-cta">
                    <Link to="/docs" className="landing-btn landing-btn-primary">Explore all components</Link>
                    <Link to="/docs/guide/installation" className="landing-btn">Install in 30 seconds</Link>
                </div>
            </div>
        </section>
    );
}
