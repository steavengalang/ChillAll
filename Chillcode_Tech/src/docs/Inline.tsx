import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const SAFE_URL = /^(https?:\/\/|mailto:|#|\/)/i;

export function inline(text: string, keyBase: string): ReactNode[] {
    const out: ReactNode[] = [];
    const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;
    let last = 0;
    let i = 0;
    for (const m of text.matchAll(re)) {
        const idx = m.index ?? 0;
        if (idx > last) out.push(text.slice(last, idx));
        const tok = m[0];
        const key = `${keyBase}-${i++}`;
        if (tok.startsWith('`')) out.push(<code key={key} className="dx-inline-code">{tok.slice(1, -1)}</code>);
        else if (tok.startsWith('**')) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
        else if (tok.startsWith('*')) out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
        else {
            const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
            const label = lm ? lm[1] : tok;
            const href = lm && SAFE_URL.test(lm[2]) ? lm[2] : null;
            if (!href) out.push(label);
            else if (href.startsWith('/')) out.push(<Link key={key} to={href} className="dx-link">{label}</Link>);
            else out.push(<a key={key} href={href} className="dx-link" target={href.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">{label}</a>);
        }
        last = idx + tok.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}


/** Inline-only markdown for short strings (summaries, option descriptions, example descriptions). */
export function Inline({ text }: { text: string }) {
    return <>{inline(text, 'i')}</>;
}
