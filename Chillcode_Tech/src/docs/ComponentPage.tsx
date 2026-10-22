import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { componentNav } from './nav.generated';
import { categories, NEW_IDS, slugify } from './meta';
import { useEntry, useDocTitle } from './data';
import { Inline, Markdown, extractHeadings } from './Markdown';
import { LiveExample } from './LiveExample';
import { CodeBlock } from './CodeBlock';
import { toModuleSnippet, useChillAll } from '../lib/chillall';
import { NotFound } from './NotFound';
import { Toc, type TocItem } from './Toc';
import type { DocEntry } from './types';

function ApiTable({ rows }: { rows: DocEntry['options'] }) {
    return (
        <div className="dx-table-wrap">
            <table className="dx-table">
                <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
                <tbody>
                    {rows.map((o) => (
                        <tr key={o.name}>
                            <td><code className="dx-prop">{o.name}</code></td>
                            <td><code className="dx-type">{o.type}</code></td>
                            <td><code className="dx-default">{o.default}</code></td>
                            <td><Inline text={o.description} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ComponentPage() {
    const { id = '' } = useParams();
    const { hash } = useLocation();
    const { data: entry } = useEntry(id);
    const mod = useChillAll();
    const nav = componentNav.find((n) => n.id === id);
    useDocTitle(nav?.title || entry?.title || 'Component');

    // deep links to examples (#variants) once the content has rendered
    useEffect(() => {
        if (!hash || !entry) return;
        const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60);
        return () => clearTimeout(t);
    }, [hash, entry]);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    const siblings = useMemo(() => componentNav.filter((n) => n.category === nav?.category), [nav?.category]);
    const idx = siblings.findIndex((n) => n.id === id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

    if (!nav) return <NotFound what={`component “${id}”`} />;
    if (!entry) return <div className="dx-page"><div className="dx-loading" aria-busy="true">Loading {nav.title}…</div></div>;

    const cat = categories.find((c) => c.id === entry.category);
    const version = (mod as unknown as Record<string, { version?: string } | undefined> | null)?.[entry.global]?.version;
    const hero = entry.examples[0];

    const toc: TocItem[] = [
        { id: 'overview', text: 'Overview', level: 2 },
        { id: 'examples', text: 'Examples', level: 2 },
        ...entry.examples.map((x) => ({ id: `ex-${x.id}`, text: x.title, level: 3 as const })),
        ...(entry.guides || []).map((g) => ({ id: `guide-${slugify(g.title)}`, text: g.title, level: 2 as const })),
        { id: 'options', text: 'Options', level: 2 },
        { id: 'methods', text: 'Methods', level: 2 },
        ...(entry.events?.length ? [{ id: 'events', text: 'Events', level: 2 as const }] : []),
        ...(entry.cssVars?.length ? [{ id: 'styling', text: 'Styling', level: 2 as const }] : []),
        { id: 'accessibility', text: 'Accessibility', level: 2 },
        ...(entry.tips?.length ? [{ id: 'tips', text: 'Tips', level: 2 as const }] : []),
    ];

    const importLine = `import { ${entry.global} } from 'chillall';`;
    const methodsStatic = entry.methods.filter((m) => m.on === 'static');
    const methodsInstance = entry.methods.filter((m) => m.on !== 'static');
    const relatedNav = (entry.related || []).map((r) => componentNav.find((n) => n.id === r)).filter(Boolean) as typeof componentNav;

    return (
        <div className="dx-page dx-page-with-toc">
            <article className="dx-article" key={entry.id}>
                <nav className="dx-crumbs" aria-label="Breadcrumb">
                    <Link to="/docs">Components</Link><span aria-hidden="true">/</span>
                    <span>{cat?.title}</span><span aria-hidden="true">/</span>
                    <span aria-current="page">{entry.title}</span>
                </nav>

                <header className="dx-title-row" id="overview">
                    <h1 className="dx-h1">{entry.title}</h1>
                    <div className="dx-badges">
                        <code className="dx-chip">{entry.global}</code>
                        {version && <span className="dx-chip dx-chip-muted">v{version}</span>}
                        {NEW_IDS.has(entry.id) && <span className="dx-chip dx-chip-new">New in 2.0</span>}
                    </div>
                </header>
                <p className="dx-lead"><Inline text={entry.summary} /></p>
                <Markdown source={entry.description} idPrefix="d-" />

                <ul className="dx-features">
                    {entry.features.map((f) => <li key={f}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg><span><Inline text={f} /></span></li>)}
                </ul>

                <div className="dx-install">
                    <div className="dx-install-title">Quick start</div>
                    <CodeBlock lang="bash" code="npm install chillall" filename="terminal" />
                    <CodeBlock lang="js" code={toModuleSnippet(hero.code)} filename="app.js" />
                    <p className="dx-muted">
                        Importing only <code className="dx-inline-code">{entry.global}</code> keeps the rest of the library out of your bundle (tree-shaking).
                        No bundler? Use the <Link to="/docs/guide/installation" className="dx-link">CDN build</Link> and call <code className="dx-inline-code">{entry.global}</code> as a global.
                    </p>
                    <span hidden>{importLine}</span>
                </div>

                <h2 className="dx-h2" id="examples"><a className="dx-anchor" href="#examples">Examples</a></h2>
                <p className="dx-muted">Every example below is running the real library. Edit the code, press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>, and watch it update.</p>
                {entry.examples.map((x) => (
                    <LiveExample key={`${entry.id}-${x.id}`} id={`ex-${x.id}`} title={x.title} description={x.description} code={x.code} height={x.height} manual={x.manual} />
                ))}

                {(entry.guides || []).map((g) => (
                    <section key={g.title} className="dx-guide-block">
                        <h2 className="dx-h2" id={`guide-${slugify(g.title)}`}><a className="dx-anchor" href={`#guide-${slugify(g.title)}`}>{g.title}</a></h2>
                        <Markdown source={g.body} idPrefix={`g-${slugify(g.title)}-`} />
                    </section>
                ))}

                <h2 className="dx-h2" id="options"><a className="dx-anchor" href="#options">Options</a></h2>
                <ApiTable rows={entry.options} />

                <h2 className="dx-h2" id="methods"><a className="dx-anchor" href="#methods">Methods</a></h2>
                {methodsStatic.length > 0 && <>
                    <h3 className="dx-h3">Static</h3>
                    <ul className="dx-methods">{methodsStatic.map((m) => <li key={m.signature}><code className="dx-sig">{m.signature}</code><span><Inline text={m.description} /></span></li>)}</ul>
                </>}
                {methodsInstance.length > 0 && <>
                    <h3 className="dx-h3">Instance</h3>
                    <ul className="dx-methods">{methodsInstance.map((m) => <li key={m.signature}><code className="dx-sig">{m.signature}</code><span><Inline text={m.description} /></span></li>)}</ul>
                </>}

                {entry.events && entry.events.length > 0 && <>
                    <h2 className="dx-h2" id="events"><a className="dx-anchor" href="#events">Events</a></h2>
                    <div className="dx-table-wrap">
                        <table className="dx-table">
                            <thead><tr><th>Event</th><th>Payload</th><th>Description</th></tr></thead>
                            <tbody>{entry.events.map((ev) => <tr key={ev.name}><td><code className="dx-prop">{ev.name}</code></td><td>{ev.payload ? <code className="dx-type">{ev.payload}</code> : '—'}</td><td><Inline text={ev.description} /></td></tr>)}</tbody>
                        </table>
                    </div>
                </>}

                {entry.cssVars && entry.cssVars.length > 0 && <>
                    <h2 className="dx-h2" id="styling"><a className="dx-anchor" href="#styling">Styling</a></h2>
                    <p>Override these CSS custom properties on <code className="dx-inline-code">:root</code> (or any ancestor) to re-brand the component. Dark mode follows the OS or <code className="dx-inline-code">&lt;html data-theme="dark"&gt;</code>.</p>
                    <ul className="dx-methods">{entry.cssVars.map((v) => <li key={v.name}><code className="dx-sig">{v.name}</code><span><Inline text={v.description} /></span></li>)}</ul>
                </>}

                <h2 className="dx-h2" id="accessibility"><a className="dx-anchor" href="#accessibility">Accessibility</a></h2>
                <ul className="dx-bullets">{entry.a11y.map((a) => <li key={a}><Inline text={a} /></li>)}</ul>

                {entry.tips && entry.tips.length > 0 && <>
                    <h2 className="dx-h2" id="tips"><a className="dx-anchor" href="#tips">Tips</a></h2>
                    <ul className="dx-bullets">{entry.tips.map((t) => <li key={t}><Inline text={t} /></li>)}</ul>
                </>}

                {relatedNav.length > 0 && (
                    <div className="dx-related">
                        <span>See also</span>
                        {relatedNav.map((r) => <Link key={r.id} to={`/docs/${r.id}`} className="dx-chip dx-chip-link">{r.title}</Link>)}
                    </div>
                )}

                <nav className="dx-pager" aria-label="Previous and next component">
                    {prev ? <Link to={`/docs/${prev.id}`} className="dx-pager-link"><small>← Previous</small><strong>{prev.title}</strong></Link> : <span />}
                    {next ? <Link to={`/docs/${next.id}`} className="dx-pager-link dx-pager-next"><small>Next →</small><strong>{next.title}</strong></Link> : <span />}
                </nav>
            </article>
            <Toc items={toc} />
        </div>
    );
}

export { extractHeadings };
