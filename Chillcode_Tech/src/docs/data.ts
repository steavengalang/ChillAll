import { useEffect, useState } from 'react';
import type { DocEntry, Guide } from './types';
import { loaders as entryLoaders } from './content/loaders';
import { loaders as guideLoaders } from './guides/loaders';

/** Each component page / guide is its own chunk: opening one page never downloads the other 87. */
function useLoaded<T>(id: string, table: Record<string, () => Promise<{ default: T }>>): { data: T | null; missing: boolean } {
    const [state, setState] = useState<{ id: string; data: T | null; missing: boolean }>({ id, data: null, missing: false });
    useEffect(() => {
        let alive = true;
        const load = table[id];
        if (!load) { setState({ id, data: null, missing: true }); return; }
        setState((s) => (s.id === id ? s : { id, data: null, missing: false }));
        load().then((m) => alive && setState({ id, data: m.default, missing: false }), () => alive && setState({ id, data: null, missing: true }));
        return () => { alive = false; };
    }, [id, table]);
    return state.id === id ? { data: state.data, missing: state.missing } : { data: null, missing: false };
}

export const useEntry = (id: string) => useLoaded<DocEntry>(id, entryLoaders);
export const useGuide = (id: string) => useLoaded<Guide>(id, guideLoaders);

export function useDocTitle(title: string) {
    useEffect(() => {
        const prev = document.title;
        document.title = `${title} · ChillAll`;
        return () => { document.title = prev; };
    }, [title]);
}
