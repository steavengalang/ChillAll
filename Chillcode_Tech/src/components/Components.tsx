import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { componentNav } from '../docs/nav.generated';
import { categories, NEW_IDS } from '../docs/meta';
import './Landing.css';

const GRADIENTS: Record<string, string> = {
    core: 'linear-gradient(135deg, #22c55e, #16a34a)',
    formControls: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    navigation: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    feedback: 'linear-gradient(135deg, #f59e0b, #d97706)',
    display: 'linear-gradient(135deg, #ec4899, #be185d)',
    data: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    utility: 'linear-gradient(135deg, #64748b, #475569)',
};

export function Components() {
    const [cat, setCat] = useState<string>('all');
    const list = useMemo(() => componentNav.filter((c) => cat === 'all' || c.category === cat), [cat]);
    const shown = cat === 'all' ? list.filter((c) => NEW_IDS.has(c.id)).slice(0, 12).concat(list.filter((c) => !NEW_IDS.has(c.id)).slice(0, 12)) : list;

    return (
        <section className="components" id="components" aria-labelledby="components-title">
            <div className="landing-container">
                <div className="landing-head">
                    <span className="landing-badge">{componentNav.length} components</span>
                    <h2 id="components-title">A complete UI toolkit, not a starter kit.</h2>
                    <p>From a humble button to a 100,000-row virtual list. Every component shares the same API shape, theming and accessibility rules.</p>
                </div>

                <div className="cmp-tabs" role="tablist" aria-label="Component categories">
                    <button type="button" role="tab" aria-selected={cat === 'all'} className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>Highlights</button>
                    {categories.map((c) => (
                        <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
                            {c.title}<small>{componentNav.filter((n) => n.category === c.id).length}</small>
                        </button>
                    ))}
                </div>

                <div className="cmp-grid">
                    {shown.map((c) => (
                        <Link key={c.id} to={`/docs/${c.id}`} className="cmp-card">
                            <span className="cmp-icon" style={{ background: GRADIENTS[c.category] }} aria-hidden="true">{c.title.charAt(0)}</span>
                            <span className="cmp-body">
                                <strong>{c.title}{NEW_IDS.has(c.id) && <em>New</em>}</strong>
                                <span>{c.summary}</span>
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="landing-cta">
                    <Link to="/docs" className="landing-btn landing-btn-primary">Browse all {componentNav.length} components →</Link>
                </div>
            </div>
        </section>
    );
}
