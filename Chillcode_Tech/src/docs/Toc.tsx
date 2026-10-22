import { useEffect, useState } from 'react';

export interface TocItem { id: string; text: string; level: 2 | 3 }

/** "On this page" - highlights the section in view. */
export function Toc({ items }: { items: TocItem[] }) {
    const [active, setActive] = useState<string>(items[0]?.id || '');

    useEffect(() => {
        const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
        if (!els.length || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver((entries) => {
            const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (vis[0]) setActive(vis[0].target.id);
        }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });
        els.forEach((e) => io.observe(e));
        return () => io.disconnect();
    }, [items]);

    return (
        <aside className="dx-toc" aria-label="On this page">
            <div className="dx-toc-title">On this page</div>
            <ul>
                {items.map((i) => (
                    <li key={i.id} className={`l${i.level}`}>
                        <a href={`#${i.id}`} className={active === i.id ? 'on' : ''} aria-current={active === i.id ? 'location' : undefined}>{i.text}</a>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
