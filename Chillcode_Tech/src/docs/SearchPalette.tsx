import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { componentNav, guideNav } from './nav.generated';
import { categories, NEW_IDS } from './meta';

interface Hit { key: string; to: string; title: string; sub: string; kind: string; isNew?: boolean }

const catTitle = (id: string) => categories.find((c) => c.id === id)?.title || id;

function search(q: string): Hit[] {
    const all: Array<Hit & { hay: string }> = [
        ...guideNav.map((g) => ({ key: 'g-' + g.id, to: `/docs/guide/${g.id}`, title: g.title, sub: g.summary, kind: g.group, hay: `${g.title} ${g.summary}` })),
        ...componentNav.map((c) => ({ key: 'c-' + c.id, to: `/docs/${c.id}`, title: c.title, sub: c.summary, kind: catTitle(c.category), isNew: NEW_IDS.has(c.id), hay: `${c.title} ${c.global} ${c.summary} ${c.keywords.join(' ')}` })),
    ];
    const n = q.trim().toLowerCase();
    if (!n) return all.filter((h) => h.key.startsWith('g-')).slice(0, 4).concat(all.filter((h) => h.isNew).slice(0, 6));
    return all
        .map((h) => {
            const t = h.title.toLowerCase();
            const score = t === n ? 100 : t.startsWith(n) ? 80 : t.includes(n) ? 60 : h.hay.toLowerCase().includes(n) ? 30 : 0;
            return { h, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((x) => x.h);
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [q, setQ] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);
    const navigate = useNavigate();
    const hits = useMemo(() => search(q), [q]);

    useEffect(() => {
        if (open) { setQ(''); setActive(0); requestAnimationFrame(() => inputRef.current?.focus()); }
    }, [open]);
    useEffect(() => { setActive(0); }, [q]);
    useEffect(() => {
        listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    if (!open) return null;

    const go = (h: Hit | undefined) => { if (h) { navigate(h.to); onClose(); } };
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); go(hits[active]); }
        else if (e.key === 'Tab') { e.preventDefault(); }
    };

    return (
        <div className="dx-palette-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="dx-palette" role="dialog" aria-modal="true" aria-label="Search the docs" onKeyDown={onKey}>
                <div className="dx-palette-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input
                        ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                        placeholder="Search components and guides…" role="combobox" aria-expanded="true" aria-controls="dx-palette-list"
                        aria-activedescendant={hits[active] ? `dx-hit-${hits[active].key}` : undefined} autoComplete="off" spellCheck={false}
                    />
                    <kbd>Esc</kbd>
                </div>
                <ul className="dx-palette-list" id="dx-palette-list" role="listbox" ref={listRef}>
                    {hits.map((h, i) => (
                        <li key={h.key} id={`dx-hit-${h.key}`} role="option" aria-selected={i === active}
                            className={i === active ? 'on' : ''} onMouseMove={() => setActive(i)} onClick={() => go(h)}>
                            <div className="dx-hit-main"><strong>{h.title}</strong>{h.isNew && <em className="dx-new">New</em>}<span className="dx-hit-kind">{h.kind}</span></div>
                            <div className="dx-hit-sub">{h.sub}</div>
                        </li>
                    ))}
                    {hits.length === 0 && <li className="dx-palette-empty" role="presentation">Nothing found for “{q}”.</li>}
                </ul>
                <div className="dx-palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
            </div>
        </div>
    );
}
