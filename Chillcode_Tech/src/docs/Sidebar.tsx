import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { componentNav, guideNav } from './nav.generated';
import { categories, NEW_IDS } from './meta';
import logo from '../assets/logo.png';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    onSearch: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const GROUPS = ['Getting started', 'Guides', 'Recipes'] as const;

export function Sidebar({ open, onClose, onSearch, theme, toggleTheme }: SidebarProps) {
    const { pathname } = useLocation();
    const activeId = pathname.startsWith('/docs/') && !pathname.startsWith('/docs/guide/') ? pathname.split('/')[2] : '';
    const activeCat = componentNav.find((c) => c.id === activeId)?.category;
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        // keep the active category open
        if (activeCat) setCollapsed((c) => (c[activeCat] ? { ...c, [activeCat]: false } : c));
    }, [activeCat]);

    const byCat = useMemo(() => categories.map((c) => ({ ...c, items: componentNav.filter((n) => n.category === c.id) })).filter((c) => c.items.length), []);

    return (
        <>
            <aside className={`dx-side ${open ? 'open' : ''}`} aria-label="Documentation">
                <div className="dx-side-head">
                    <NavLink to="/" className="dx-brand" aria-label="ChillCode home">
                        <img src={logo} alt="" width={26} height={26} />
                        <span>Chill<b>All</b></span>
                    </NavLink>
                    <button type="button" className="dx-icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                        {theme === 'dark'
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" /></svg>}
                    </button>
                </div>

                <button type="button" className="dx-search-btn" onClick={onSearch}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <span>Search docs…</span>
                    <kbd>Ctrl K</kbd>
                </button>

                <nav className="dx-side-nav">
                    <NavLink to="/docs" end className={({ isActive }) => `dx-side-link dx-side-top ${isActive ? 'active' : ''}`}>
                        <span>All components</span><small>{componentNav.length}</small>
                    </NavLink>

                    {GROUPS.map((g) => {
                        const list = guideNav.filter((x) => x.group === g);
                        if (!list.length) return null;
                        return (
                            <div key={g} className="dx-side-group">
                                <h3>{g}</h3>
                                <ul>
                                    {list.map((x) => (
                                        <li key={x.id}>
                                            <NavLink to={`/docs/guide/${x.id}`} className={({ isActive }) => `dx-side-link ${isActive ? 'active' : ''}`}>{x.title}</NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                    {byCat.map((c) => {
                        const isCollapsed = collapsed[c.id] ?? (activeCat ? activeCat !== c.id : false);
                        return (
                            <div key={c.id} className="dx-side-group">
                                <h3>
                                    <button type="button" onClick={() => setCollapsed((s) => ({ ...s, [c.id]: !isCollapsed }))} aria-expanded={!isCollapsed}>
                                        <svg className={isCollapsed ? '' : 'open'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                                        {c.title}<small>{c.items.length}</small>
                                    </button>
                                </h3>
                                {!isCollapsed && (
                                    <ul>
                                        {c.items.map((x) => (
                                            <li key={x.id}>
                                                <NavLink to={`/docs/${x.id}`} className={({ isActive }) => `dx-side-link ${isActive ? 'active' : ''}`}>
                                                    {x.title}{NEW_IDS.has(x.id) && <em className="dx-new">New</em>}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="dx-side-foot">
                    <span>v2.0.0 · {componentNav.length} components</span>
                    <a href="https://github.com/steavengalang/chillalert" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.8-.26.8-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.7.8.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                    </a>
                </div>
            </aside>
            {open && <div className="dx-overlay" onClick={onClose} aria-hidden="true" />}
        </>
    );
}
