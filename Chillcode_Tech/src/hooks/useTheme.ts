import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const KEY = 'chill-theme';

function read(): Theme {
    try {
        const stored = localStorage.getItem(KEY) || localStorage.getItem('chillcode-theme');
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* storage blocked */ }
    return 'dark'; // brand default
}

/** Applies the theme using the same contract ChillAll components follow: <html data-theme> + .light/.dark class. */
function apply(theme: Theme) {
    const el = document.documentElement;
    el.setAttribute('data-theme', theme);
    el.classList.remove('light', 'dark');
    el.classList.add(theme);
    el.style.colorScheme = theme;
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(read);

    useEffect(() => {
        apply(theme);
        try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
    }, [theme]);

    // stay in sync across tabs
    useEffect(() => {
        const onStorage = (e: StorageEvent) => { if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) setTheme(e.newValue); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
    return { theme, toggleTheme };
}
