import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SearchPalette } from './SearchPalette';
import { useTheme } from '../hooks/useTheme';
import './docs.css';
import './preview.css';

export function DocsLayout() {
    const { theme, toggleTheme } = useTheme();
    const [menu, setMenu] = useState(false);
    const [search, setSearch] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s); }
            else if (e.key === '/' && !(e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) && !(e.target as HTMLElement | null)?.isContentEditable) {
                e.preventDefault(); setSearch(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="dx-layout">
            <a href="#dx-main" className="dx-skip">Skip to content</a>
            <header className="dx-topbar">
                <button type="button" className="dx-icon-btn" onClick={() => setMenu((m) => !m)} aria-label="Toggle navigation" aria-expanded={menu}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{menu ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}</svg>
                </button>
                <span className="dx-topbar-title">ChillAll Docs</span>
                <button type="button" className="dx-icon-btn" onClick={() => setSearch(true)} aria-label="Search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                </button>
            </header>
            <Sidebar open={menu} onClose={() => setMenu(false)} onSearch={() => setSearch(true)} theme={theme} toggleTheme={toggleTheme} />
            <main className="dx-main" id="dx-main" tabIndex={-1}>
                <Outlet />
            </main>
            <SearchPalette open={search} onClose={() => setSearch(false)} />
        </div>
    );
}
