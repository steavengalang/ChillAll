import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { guideNav } from './nav.generated';
import { useGuide, useDocTitle } from './data';
import { Inline, Markdown, extractHeadings } from './Markdown';
import { Toc } from './Toc';
import { NotFound } from './NotFound';

export function GuidePage() {
    const { id = '' } = useParams();
    const { hash } = useLocation();
    const { data: guide } = useGuide(id);
    const nav = guideNav.find((g) => g.id === id);
    useDocTitle(nav?.title || 'Guide');

    const toc = useMemo(() => (guide ? extractHeadings(guide.body) : []), [guide]);
    const order = useMemo(() => guideNav, []);
    const idx = order.findIndex((g) => g.id === id);
    const prev = idx > 0 ? order[idx - 1] : null;
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

    useEffect(() => { window.scrollTo(0, 0); }, [id]);
    useEffect(() => {
        if (!hash || !guide) return;
        const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60);
        return () => clearTimeout(t);
    }, [hash, guide]);

    if (!nav) return <NotFound what={`guide “${id}”`} />;
    if (!guide) return <div className="dx-page"><div className="dx-loading" aria-busy="true">Loading…</div></div>;

    return (
        <div className="dx-page dx-page-with-toc">
            <article className="dx-article" key={guide.id}>
                <nav className="dx-crumbs" aria-label="Breadcrumb">
                    <Link to="/docs">Docs</Link><span aria-hidden="true">/</span>
                    <span>{guide.group}</span><span aria-hidden="true">/</span>
                    <span aria-current="page">{guide.title}</span>
                </nav>
                <h1 className="dx-h1">{guide.title}</h1>
                <p className="dx-lead"><Inline text={guide.summary} /></p>
                <Markdown source={guide.body} />
                <nav className="dx-pager" aria-label="Previous and next guide">
                    {prev ? <Link to={`/docs/guide/${prev.id}`} className="dx-pager-link"><small>← Previous</small><strong>{prev.title}</strong></Link> : <span />}
                    {next ? <Link to={`/docs/guide/${next.id}`} className="dx-pager-link dx-pager-next"><small>Next →</small><strong>{next.title}</strong></Link> : <span />}
                </nav>
            </article>
            {toc.length > 0 && <Toc items={toc} />}
        </div>
    );
}
