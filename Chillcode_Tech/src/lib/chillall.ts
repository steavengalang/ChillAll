import { useEffect, useState } from 'react';
import type * as Bundle from './vendor/chillall.esm.js';

export type ChillAllModule = typeof Bundle;

let loading: Promise<ChillAllModule> | null = null;

/** Lazy-loads the vendored ChillAll bundle (one chunk, shared by every docs page and live example). */
export function loadChillAll(): Promise<ChillAllModule> {
    loading ??= import('./vendor/chillall.esm.js') as Promise<ChillAllModule>;
    return loading;
}

/** React hook: `null` until the bundle has loaded. */
export function useChillAll(): ChillAllModule | null {
    const [mod, setMod] = useState<ChillAllModule | null>(null);
    useEffect(() => {
        let alive = true;
        loadChillAll().then((m) => alive && setMod(m));
        return () => { alive = false; };
    }, []);
    return mod;
}

const AsyncFunction = Object.getPrototypeOf(async function () { /* noop */ }).constructor as new (...args: string[]) => (...a: unknown[]) => Promise<unknown>;

/**
 * Runs example/guide code with every component in scope (ChillButton, ChillModal, ..., ChillAll),
 * plus `root` (preview element) and `cleanup(fn)`. Returns a disposer that runs the registered teardown.
 */
export async function runSnippet(code: string, root: HTMLElement, mod: ChillAllModule): Promise<() => void> {
    const cleanups: Array<() => void> = [];
    const dispose = () => {
        while (cleanups.length) {
            try { cleanups.pop()!(); } catch { /* ignore teardown errors */ }
        }
    };
    const names = Object.keys(mod).filter((k) => /^Chill[A-Z]/.test(k));
    const values = names.map((n) => (mod as unknown as Record<string, unknown>)[n]);
    try {
        const fn = new AsyncFunction(...names, 'root', 'cleanup', code);
        await fn(...values, root, (f: () => void) => cleanups.push(f));
    } catch (err) {
        dispose();
        throw err;
    }
    return dispose;
}

/** Component names used by a snippet, for the generated `import { ... } from 'chillall'` line. */
export function usedComponents(code: string): string[] {
    const found = new Set<string>();
    for (const m of code.matchAll(/\bChill[A-Z][A-Za-z]*\b/g)) found.add(m[0]);
    found.delete('ChillAll');
    return [...found].sort();
}

/** Turns a runnable snippet into a copy-paste ESM module. */
export function toModuleSnippet(code: string): string {
    const used = usedComponents(code);
    const head = used.length ? `import { ${used.join(', ')} } from 'chillall';\n\n` : '';
    const needsRoot = /\broot\b/.test(code);
    const body = needsRoot ? `const root = document.querySelector('#app');\n\n${code}` : code;
    return head + body.replace(/\n?\s*cleanup\([^;]*\);?/g, '');
}
