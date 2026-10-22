import { useCallback, useEffect, useRef, useState } from 'react';
import { loadChillAll, runSnippet, toModuleSnippet, type ChillAllModule } from '../lib/chillall';
import { CopyButton, useHighlight } from './CodeBlock';
import { Inline } from './Inline';

interface LiveExampleProps {
    code: string;
    title?: string;
    description?: string;
    id?: string;
    /** preview min-height in px */
    height?: number;
    manual?: boolean;
}

/** Overlay libraries open elements outside the preview; close them when the example is re-run or unmounted. */
function closeGlobalOverlays(mod: ChillAllModule) {
    const libs = mod as unknown as Record<string, { closeAll?: () => void } | undefined>;
    for (const k of ['ChillModal', 'ChillAlert', 'ChillNotify', 'ChillDrawer', 'ChillLightbox', 'ChillTour']) {
        try { libs[k]?.closeAll?.(); } catch { /* ignore */ }
    }
}

export function LiveExample({ code: initial, title, description, id, height = 120, manual }: LiveExampleProps) {
    const [code, setCode] = useState(initial);
    const [error, setError] = useState<string | null>(null);
    const [showCode, setShowCode] = useState(true);
    const [tab, setTab] = useState<'live' | 'esm'>('live');
    const [visible, setVisible] = useState(false);
    const [running, setRunning] = useState(false);

    const wrapRef = useRef<HTMLElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const disposeRef = useRef<(() => void) | null>(null);
    const runId = useRef(0);
    const modRef = useRef<ChillAllModule | null>(null);

    const teardown = useCallback(() => {
        disposeRef.current?.();
        disposeRef.current = null;
        if (modRef.current) closeGlobalOverlays(modRef.current);
        rootRef.current?.replaceChildren();
    }, []);

    const run = useCallback(async (src: string) => {
        const root = rootRef.current;
        if (!root) return;
        const my = ++runId.current;
        setRunning(true);
        try {
            const mod = await loadChillAll();
            modRef.current = mod;
            if (my !== runId.current) return;
            teardown();
            const dispose = await runSnippet(src, root, mod);
            if (my !== runId.current) { dispose(); return; }
            disposeRef.current = dispose;
            setError(null);
        } catch (e) {
            if (my === runId.current) setError(e instanceof Error ? e.message : String(e));
        } finally {
            if (my === runId.current) setRunning(false);
        }
    }, [teardown]);

    // run only once the example scrolls into view (keeps long pages cheap)
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
        const io = new IntersectionObserver((entries) => {
            if (entries.some((en) => en.isIntersecting)) { setVisible(true); io.disconnect(); }
        }, { rootMargin: '200px' });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // initial run + debounced live re-run while editing
    const first = useRef(true);
    useEffect(() => {
        if (!visible) return;
        const delay = first.current ? 0 : 650;
        first.current = false;
        const t = setTimeout(() => { void run(code); }, delay);
        return () => clearTimeout(t);
    }, [visible, code, run]);

    useEffect(() => () => {
        runId.current++;
        teardown();
    }, [teardown]);

    const reset = () => { setCode(initial); };
    const edited = code !== initial;

    return (
        <section className="dx-example" id={id} ref={wrapRef}>
            {(title || description) && (
                <header className="dx-example-head">
                    {title && <h3 className="dx-example-title">{id ? <a href={`#${id}`} className="dx-anchor">{title}</a> : title}</h3>}
                    {description && <p className="dx-example-desc"><Inline text={description} /></p>}
                </header>
            )}

            <div className="dx-stage">
                <div className="dx-stage-bar">
                    <span className="dx-stage-label">{manual ? 'Preview · click to try' : 'Preview'}</span>
                    <div className="dx-stage-actions">
                        <button type="button" className="dx-mini" onClick={() => void run(code)} title="Run again (Ctrl/Cmd + Enter)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" /></svg>
                            {running ? 'Running…' : 'Run'}
                        </button>
                    </div>
                </div>
                <div className="dx-root" ref={rootRef} style={{ minHeight: height }} />
                {error && (
                    <div className="dx-error" role="alert">
                        <strong>Error:</strong> {error}
                        <span className="dx-error-hint"> — fix the code below and it re-runs automatically.</span>
                    </div>
                )}
            </div>

            <div className="dx-codewrap">
                <div className="dx-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'live'} className={tab === 'live' ? 'on' : ''} onClick={() => { setTab('live'); setShowCode(true); }}>Editable code</button>
                    <button type="button" role="tab" aria-selected={tab === 'esm'} className={tab === 'esm' ? 'on' : ''} onClick={() => { setTab('esm'); setShowCode(true); }}>Copy as module</button>
                    <span className="dx-tabs-sp" />
                    {edited && <button type="button" className="dx-mini" onClick={reset}>Reset</button>}
                    <CopyButton text={tab === 'esm' ? toModuleSnippet(code) : code} />
                    <button type="button" className="dx-mini" onClick={() => setShowCode((s) => !s)} aria-expanded={showCode}>{showCode ? 'Hide' : 'Show'} code</button>
                </div>
                {showCode && (tab === 'live'
                    ? <Editor value={code} onChange={setCode} onRun={() => void run(code)} />
                    : <ReadOnly code={toModuleSnippet(code)} />)}
            </div>
        </section>
    );
}

function ReadOnly({ code }: { code: string }) {
    const html = useHighlight(code, 'js');
    return (
        <pre className="dx-pre dx-pre-flat" tabIndex={0}>
            {html !== null ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
        </pre>
    );
}

/** A textarea laid over a highlighted <pre>: real editing, coloured tokens. */
function Editor({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) {
    const html = useHighlight(value, 'js');
    const leaveNextTab = useRef(false);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun(); return; }
        if (e.key === 'Escape') { leaveNextTab.current = true; return; } // accessibility escape hatch: Esc, then Tab leaves the field
        if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
            if (leaveNextTab.current || e.shiftKey) { leaveNextTab.current = false; return; }
            e.preventDefault();
            const { selectionStart: s, selectionEnd: en } = ta;
            onChange(value.slice(0, s) + '  ' + value.slice(en));
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
            return;
        }
        leaveNextTab.current = false;
    };

    return (
        <div className="dx-editor">
            <div className="dx-editor-inner">
                <pre className="dx-pre dx-editor-pre" aria-hidden="true">
                    {html !== null ? <code dangerouslySetInnerHTML={{ __html: html + '\n' }} /> : <code>{value + '\n'}</code>}
                </pre>
                <textarea
                    className="dx-editor-ta"
                    value={value}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    aria-label="Example code (editable). Press Ctrl or Cmd + Enter to run. Press Escape then Tab to leave the field."
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => { leaveNextTab.current = false; }}
                    wrap="off"
                />
            </div>
        </div>
    );
}
