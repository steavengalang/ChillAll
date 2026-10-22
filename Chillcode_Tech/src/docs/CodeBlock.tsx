import { useMemo, useState } from 'react';
import { useChillAll } from '../lib/chillall';

const LANG_ALIASES: Record<string, string> = {
    js: 'js', javascript: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
    ts: 'ts', typescript: 'ts', tsx: 'ts',
    json: 'json', html: 'html', vue: 'html', xml: 'xml', svg: 'xml',
    css: 'css', scss: 'css', bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', text: 'text', txt: 'text',
};
export const normalizeLang = (lang?: string) => LANG_ALIASES[(lang || 'js').toLowerCase()] || 'text';

/** Syntax-highlighted HTML (already escaped by ChillCode.highlight) or null while the bundle loads. */
export function useHighlight(code: string, lang?: string): string | null {
    const mod = useChillAll();
    return useMemo(() => {
        if (!mod) return null;
        try { return String(mod.ChillCode.highlight(code, normalizeLang(lang))); } catch { return null; }
    }, [mod, code, lang]);
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
    const copy = async () => {
        try { await navigator.clipboard.writeText(text); setState('ok'); } catch { setState('err'); }
        setTimeout(() => setState('idle'), 1800);
    };
    return (
        <button type="button" className="dx-copy" onClick={copy} aria-live="polite">
            {state === 'ok' ? (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>Copied</>
            ) : state === 'err' ? 'Failed' : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>{label}</>
            )}
        </button>
    );
}

interface CodeBlockProps {
    code: string;
    lang?: string;
    filename?: string;
    className?: string;
}

export function CodeBlock({ code, lang = 'js', filename, className = '' }: CodeBlockProps) {
    const html = useHighlight(code, lang);
    return (
        <div className={`dx-code ${className}`}>
            <div className="dx-code-head">
                <span className="dx-code-file">{filename || normalizeLang(lang)}</span>
                <CopyButton text={code} />
            </div>
            <pre className="dx-pre" tabIndex={0}>
                {html !== null
                    ? <code dangerouslySetInnerHTML={{ __html: html }} />
                    : <code>{code}</code>}
            </pre>
        </div>
    );
}
