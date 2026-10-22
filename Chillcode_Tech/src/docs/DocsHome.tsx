import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { componentNav, guideNav } from './nav.generated';
import { categories, NEW_IDS } from './meta';
import { useDocTitle } from './data';

const GROUP_ORDER = ['Getting started', 'Guides', 'Recipes'] as const;

export function DocsHome() {
    useDocTitle('Documentation');
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<string>('all');
    const [onlyNew, setOnlyNew] = useState(false);

    const items = useMemo(() => {
        const n = q.trim().toLowerCase();
        return componentNav.filter((c) =>
            (cat === 'all' || c.category === cat) &&
            (!onlyNew || NEW_IDS.has(c.id)) &&
            (!n || `${c.title} ${c.global} ${c.summary} ${c.keywords.join(' ')}`.toLowerCase().includes(n)));
    }, [q, cat, onlyNew]);

    return (
        <div className="dx-page">
            <header className="dx-home-hero">
                <span className="dx-eyebrow">ChillAll 2.0</span>
                <h1 className="dx-h1 dx-h1-xl">{componentNav.length} components. One install.<br />Zero dependencies.</h1>
                <p className="dx-lead">
                    Alerts, tables, forms, pickers, charts, navigation, overlays and utilities that work the same in plain HTML,
                    React, Vue and Next.js. Every page has live, editable examples running the real library.
                </p>
                <div className="dx-actions">
                    <Link to="/docs/guide/installation" className="dx-btn dx-btn-primary">Get started</Link>
                    <Link to="/docs/guide/introduction" className="dx-btn">Read the intro</Link>
                    <a className="dx-btn" href="https://github.com/steavengalang/chillalert" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
                <div className="dx-install-pill"><span>$</span> npm install chillall <span className="dx-pill-note">~3.8 KB gzip for a single component</span></div>
            </header>

            {GROUP_ORDER.map((g) => {
                const list = guideNav.filter((x) => x.group === g);
                if (!list.length) return null;
                return (
                    <section key={g} className="dx-section">
                        <h2 className="dx-h2 dx-h2-plain">{g}</h2>
                        <div className="dx-cards dx-cards-guides">
                            {list.map((x) => (
                                <Link key={x.id} to={`/docs/guide/${x.id}`} className="dx-card">
                                    <strong>{x.title}</strong>
                                    <span>{x.summary}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                );
            })}

            <section className="dx-section">
                <h2 className="dx-h2 dx-h2-plain">Components</h2>
                <div className="dx-filter">
                    <input
                        type="search" className="dx-search-input" value={q} onChange={(e) => setQ(e.target.value)}
                        placeholder={`Filter ${componentNav.length} components…`} aria-label="Filter components"
                    />
                    <div className="dx-pills" role="group" aria-label="Category">
                        <button type="button" className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>All</button>
                        {categories.map((c) => (
                            <button key={c.id} type="button" className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>{c.title}</button>
                        ))}
                        <button type="button" className={onlyNew ? 'on dx-pill-new' : 'dx-pill-new'} onClick={() => setOnlyNew((v) => !v)} aria-pressed={onlyNew}>New in 2.0</button>
                    </div>
                </div>
                {categories.filter((c) => items.some((i) => i.category === c.id)).map((c) => (
                    <div key={c.id} className="dx-cat">
                        <h3 className="dx-h3">{c.title} <small>{items.filter((i) => i.category === c.id).length}</small></h3>
                        <p className="dx-muted">{c.blurb}</p>
                        <div className="dx-cards">
                            {items.filter((i) => i.category === c.id).map((i) => (
                                <Link key={i.id} to={`/docs/${i.id}`} className="dx-card">
                                    <strong>{i.title}{NEW_IDS.has(i.id) && <em className="dx-new">New</em>}</strong>
                                    <span>{i.summary}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="dx-muted">No components match “{q}”.</p>}
            </section>
        </div>
    );
}
