import { Fragment } from 'react';
import { CodeBlock } from './CodeBlock';
import { LiveExample } from './LiveExample';
import { slugify } from './meta';
import { inline, Inline } from './Inline';

/**
 * Markdown-lite renderer (no dangerouslySetInnerHTML, so docs content can never inject markup):
 * paragraphs, ## / ### headings, `code`, **bold**, *italic*, [links](url), "- " and "1. " lists, "> " callouts,
 * ```lang fences and ```live fences (runnable examples).
 */

type Block =
    | { t: 'h'; level: 2 | 3; text: string }
    | { t: 'p'; text: string }
    | { t: 'ul' | 'ol'; items: string[] }
    | { t: 'quote'; text: string }
    | { t: 'code'; lang: string; code: string }
    | { t: 'live'; code: string };

function parse(src: string): Block[] {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        const fence = /^```\s*([A-Za-z0-9_-]*)\s*$/.exec(line);
        if (fence) {
            const buf: string[] = [];
            i++;
            while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
            i++;
            const code = buf.join('\n');
            blocks.push(fence[1] === 'live' ? { t: 'live', code } : { t: 'code', lang: fence[1] || 'text', code });
            continue;
        }
        const h = /^(#{2,3})\s+(.*)$/.exec(line);
        if (h) { blocks.push({ t: 'h', level: h[1].length as 2 | 3, text: h[2].trim() }); i++; continue; }
        if (/^>\s?/.test(line)) {
            const buf: string[] = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
            blocks.push({ t: 'quote', text: buf.join(' ') });
            continue;
        }
        if (/^\s*[-*]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                let item = lines[i++].replace(/^\s*[-*]\s+/, '');
                while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
                items.push(item);
            }
            blocks.push({ t: 'ul', items });
            continue;
        }
        if (/^\s*\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                let item = lines[i++].replace(/^\s*\d+\.\s+/, '');
                while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
                items.push(item);
            }
            blocks.push({ t: 'ol', items });
            continue;
        }
        const buf: string[] = [];
        while (i < lines.length && lines[i].trim() && !/^(```|#{2,3}\s|>\s?|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) buf.push(lines[i++].trim());
        blocks.push({ t: 'p', text: buf.join(' ') });
    }
    return blocks;
}

export interface Heading { id: string; text: string; level: 2 | 3 }

export function extractHeadings(src: string): Heading[] {
    return parse(src).filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h').map((b) => ({ id: slugify(b.text), text: b.text, level: b.level }));
}

const CALLOUT = /^\*\*(Tip|Note|Warning|Important)[:.]?\*\*/i;

export function Markdown({ source, idPrefix = '' }: { source: string; idPrefix?: string }) {
    const blocks = parse(source);
    return (
        <div className="dx-md">
            {blocks.map((b, i) => {
                const key = `${idPrefix}b${i}`;
                switch (b.t) {
                    case 'h': {
                        const id = idPrefix + slugify(b.text);
                        const Tag = b.level === 2 ? 'h2' : 'h3';
                        return <Tag key={key} id={id} className={`dx-h${b.level}`}><a href={`#${id}`} className="dx-anchor">{inline(b.text, key)}</a></Tag>;
                    }
                    case 'p': return <p key={key}>{inline(b.text, key)}</p>;
                    case 'ul': return <ul key={key}>{b.items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}</ul>;
                    case 'ol': return <ol key={key}>{b.items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}</ol>;
                    case 'quote': {
                        const kind = (CALLOUT.exec(b.text)?.[1] || 'Note').toLowerCase();
                        return <aside key={key} className={`dx-callout dx-callout-${kind}`}>{inline(b.text, key)}</aside>;
                    }
                    case 'code': return <CodeBlock key={key} code={b.code} lang={b.lang} />;
                    case 'live': return <LiveExample key={key} code={b.code} height={140} />;
                    default: return <Fragment key={key} />;
                }
            })}
        </div>
    );
}

export { Inline };
