/**
 * ChillCode - Zero-dependency Code Block Component
 *
 * Code block with copy button (async clipboard + fallback), line numbers, language label,
 * highlighted lines, wrap toggle and a tiny built-in tokenizer for js / json / html / css / bash.
 * Highlighting is built from DOM nodes (textContent only) - source code is never injected as HTML.
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const block = ChillCode.create({
 *     code: 'const a = 1;\nconsole.log(a);',
 *     language: 'js', lineNumbers: true, highlightLines: [2], wrapToggle: true,
 *     parent: document.body
 *   });
 *   block.copy().then(ok => {});
 *   block.setCode('{"a": 1}', 'json');
 *   block.destroy();
 *
 *   ChillCode.init('pre > code');                 // upgrades <pre><code class="language-js"> blocks
 *   ChillCode.highlight('<b>x</b>', 'html');      // -> escaped HTML string (safe to assign to innerHTML)
 *   ChillCode.highlightToFragment(code, 'js');    // -> DocumentFragment built with textContent
 *   ChillCode.tokenize(code, 'css');              // -> [{ type, value }, ...]  (lossless)
 *
 * Options
 * | option          | default    | description                                                        |
 * |-----------------|------------|--------------------------------------------------------------------|
 * | code            | ''         | source text                                                        |
 * | language        | 'text'     | js|javascript|ts|json|html|xml|css|bash|sh|shell|text (aliases ok)  |
 * | highlight       | true       | false disables the tokenizer                                       |
 * | title           | ''         | optional filename / caption shown in the header                    |
 * | showLanguage    | true       | show the language label                                            |
 * | languageLabel   | null       | override the label text                                            |
 * | lineNumbers     | false      | show line numbers                                                  |
 * | startLine       | 1          | first line number                                                  |
 * | highlightLines  | []         | line numbers to emphasise: [2, 4], '2,4-6', or [2, '4-6']          |
 * | copy            | true       | show copy button                                                   |
 * | copyLabel / copiedLabel / failedLabel | 'Copy' / 'Copied!' / 'Copy failed' |                  |
 * | copiedDuration  | 2000       | ms before the copied state resets                                  |
 * | wrap            | false      | soft-wrap long lines                                               |
 * | wrapToggle      | false      | show wrap toggle button (aria-pressed)                             |
 * | maxHeight       | null       | number (px) or CSS length; block scrolls vertically                |
 * | size            | 'md'       | 'sm' | 'md' | 'lg' code font size                                  |
 * | className       | ''         | extra class names                                                  |
 * | parent          | null       | element/selector to append to                                      |
 * | onCopy          | null       | ({ code, success, block }) => void                                 |
 * | onWrapChange    | null       | (wrap, block) => void                                              |
 *
 * Instance: element, preEl, codeEl, getCode(), setCode(code, language?), setLanguage(l), setLineNumbers(b),
 *           setHighlightLines(spec), setWrap(b), toggleWrap(), copy() -> Promise<boolean>, on/off, destroy()
 * Events: 'copy' ({code, success}), 'wrap' ({wrap}), 'change' ({code, language}), 'destroy'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillcode-styles';
    const SIZES = ['sm', 'md', 'lg'];
    const TOKEN_TYPES = ['comment', 'keyword', 'string', 'number', 'literal', 'function', 'property', 'tag', 'attr', 'operator', 'punctuation', 'variable', 'type', 'selector'];
    const DEFAULTS = {
        code: '', language: 'text', highlight: true, title: '', showLanguage: true, languageLabel: null,
        lineNumbers: false, startLine: 1, highlightLines: [], copy: true,
        copyLabel: 'Copy', copiedLabel: 'Copied!', failedLabel: 'Copy failed', copiedDuration: 2000,
        wrap: false, wrapToggle: false, maxHeight: null, size: 'md', className: '', parent: null,
        onCopy: null, onWrapChange: null
    };

    // ------------------------------------------------------------------ tokenizer
    const LANG_ALIASES = {
        js: 'js', javascript: 'js', jsx: 'js', mjs: 'js', cjs: 'js', ts: 'js', tsx: 'js', typescript: 'js', node: 'js',
        json: 'json', jsonc: 'json', json5: 'json',
        html: 'html', htm: 'html', xml: 'html', svg: 'html', markup: 'html', vue: 'html',
        css: 'css', scss: 'css', less: 'css',
        bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', terminal: 'bash', shellscript: 'bash'
    };
    const LABELS = { js: 'JavaScript', json: 'JSON', html: 'HTML', css: 'CSS', bash: 'Bash' };

    function normLang(lang) {
        const k = String(lang == null ? '' : lang).toLowerCase().replace(/^language-|^lang-/, '').trim();
        return LANG_ALIASES[k] || null;
    }

    function set(str) { const o = Object.create(null); str.split(' ').forEach(w => { o[w] = true; }); return o; }

    const JS_KEYWORDS = set('as async await break case catch class const continue debugger default delete do else enum export extends finally for from function get if implements import in instanceof interface let new of package private protected public readonly return set static super switch this throw try type typeof var void while with yield abstract declare namespace keyof infer satisfies');
    const JS_LITERALS = set('true false null undefined NaN Infinity');
    const BASH_KEYWORDS = set('if then else elif fi for while until do done case esac in function select time return exit break continue local export unset readonly declare source alias');
    const BASH_BUILTIN_PREFIX = set('sudo time exec nohup env xargs command');

    function sticky(re) { return new RegExp(re.source, 'y'); }
    const RE_FUNC_NEXT = /\s*\(/y;
    const RE_COLON_NEXT = /\s*:/y;
    const RE_WORD = /[A-Za-z_$][\w$]*/y;

    function lookahead(re, code, pos) { re.lastIndex = pos; return re.test(code); }

    function pushTok(out, type, value) {
        if (!value) return;
        if (type && TOKEN_TYPES.indexOf(type) < 0) type = null;
        const last = out[out.length - 1];
        if (last && last.type === type) last.value += value;
        else out.push({ type: type || null, value: value });
    }

    /** Generic rule scanner. rule: { re (sticky), type: string|fn(text, code, end, ctx), guard?: fn(code, i, ctx), after?: fn(text, type, ctx) } */
    function scan(code, rules, ctx) {
        const out = [];
        const n = code.length;
        let i = 0;
        ctx = ctx || {};
        while (i < n) {
            let hit = false;
            for (let r = 0; r < rules.length; r++) {
                const rule = rules[r];
                if (rule.guard && !rule.guard(code, i, ctx)) continue;
                rule.re.lastIndex = i;
                const m = rule.re.exec(code);
                if (m && m[0].length > 0) {
                    const text = m[0];
                    const end = i + text.length;
                    const type = typeof rule.type === 'function' ? rule.type(text, code, end, ctx) : rule.type;
                    if (rule.after) rule.after(text, type, ctx);
                    pushTok(out, type, text);
                    if (type || /\S/.test(text)) { ctx.prevType = type; ctx.prevText = text; }
                    i = end;
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                pushTok(out, null, code[i]);
                if (/\S/.test(code[i])) { ctx.prevType = null; ctx.prevText = code[i]; }
                i++;
            }
        }
        return out;
    }

    const JS_RULES = [
        { re: sticky(/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/), type: 'comment' },
        { re: sticky(/"(?:[^"\\\n]|\\[\s\S])*"?|'(?:[^'\\\n]|\\[\s\S])*'?|`(?:[^`\\]|\\[\s\S])*`?/), type: 'string' },
        {
            // regex literal only where an expression may start
            re: sticky(/\/(?![*\/])(?:\\.|\[(?:\\.|[^\]\n\\])*\]|[^\/\n\\\[])+\/[a-z]*/),
            type: 'string',
            guard: (code, i, ctx) => {
                const pt = ctx.prevType, tx = ctx.prevText;
                if (tx === undefined) return true;
                if (pt === 'number' || pt === 'string' || pt === 'literal' || pt === 'function' || pt === 'type') return false;
                if (pt === null) return !/^[\w$]+$/.test(tx) ? !/^[)\]}]$/.test(tx) : false;
                if (pt === 'keyword') return !/^(this|super)$/.test(tx);
                if (pt === 'punctuation') return !/^[)\]}]$/.test(tx);
                return true;
            }
        },
        { re: sticky(/0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?n?/), type: 'number' },
        {
            re: RE_WORD,
            type: (text, code, end) => {
                if (JS_KEYWORDS[text]) return 'keyword';
                if (JS_LITERALS[text]) return 'literal';
                if (lookahead(RE_FUNC_NEXT, code, end)) return 'function';
                if (/^[A-Z]/.test(text)) return 'type';
                return null;
            }
        },
        { re: sticky(/=>|\.\.\.|[+\-*\/%=!<>&|^~?:]+/), type: 'operator' },
        { re: sticky(/[{}()[\];,.]/), type: 'punctuation' }
    ];

    const JSON_RULES = [
        { re: sticky(/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/), type: 'comment' },
        { re: sticky(/"(?:[^"\\\n]|\\[\s\S])*"?/), type: (t, code, end) => (lookahead(RE_COLON_NEXT, code, end) ? 'property' : 'string') },
        { re: sticky(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/), type: 'number' },
        { re: sticky(/\b(?:true|false|null)\b/), type: 'literal' },
        { re: sticky(/[{}[\],:]/), type: 'punctuation' }
    ];

    function tokenizeJs(code) { return scan(code, JS_RULES, {}); }
    function tokenizeJson(code) { return scan(code, JSON_RULES, {}); }

    const BASH_RULES = [
        { re: sticky(/#[^\n]*/), type: 'comment', guard: (code, i) => i === 0 || /[\s;&|(]/.test(code[i - 1]) },
        { re: sticky(/"(?:[^"\\]|\\[\s\S])*"?|'[^']*'?/), type: 'string', after: (t, ty, ctx) => { ctx.cmd = false; } },
        { re: sticky(/\$(?:\{[^}\n]*\}?|\([^)\n]*\)?|[A-Za-z_]\w*|[0-9@#?$!*-])/), type: 'variable', after: (t, ty, ctx) => { ctx.cmd = false; } },
        { re: sticky(/\s+/), type: null, after: (t, ty, ctx) => { if (t.indexOf('\n') >= 0) ctx.cmd = true; } },
        { re: sticky(/&&|\|\||[|&;]+/), type: 'operator', after: (t, ty, ctx) => { ctx.cmd = true; } },
        { re: sticky(/[<>=!]+/), type: 'operator' },
        { re: sticky(/[(){}[\]]/), type: 'punctuation', after: (t, ty, ctx) => { if (t === '(' || t === '{') ctx.cmd = true; } },
        { re: sticky(/--?[A-Za-z][\w-]*/), type: 'attr', guard: (code, i, ctx) => !ctx.cmd && (i === 0 || /\s/.test(code[i - 1])) },
        {
            re: sticky(/[\w.\/~@:+%,\-]+/),
            type: (text, code, end, ctx) => {
                if (BASH_KEYWORDS[text]) return 'keyword';
                if (/^\d+$/.test(text)) return 'number';
                if (code[end] === '=' && /^[A-Za-z_]\w*$/.test(text)) return 'variable';
                if (ctx.cmd) return 'function';
                return null;
            },
            after: (text, type, ctx) => {
                if (type === 'keyword') ctx.cmd = /^(then|else|elif|do|if|while|until|in|time)$/.test(text) ? text !== 'in' : false;
                else if (type === 'function') ctx.cmd = !!BASH_BUILTIN_PREFIX[text];
                else if (type === 'variable') ctx.cmd = true; // VAR=value cmd
                else ctx.cmd = false;
            }
        }
    ];
    function tokenizeBash(code) { return scan(code, BASH_RULES, { cmd: true }); }

    function tokenizeHtml(code) {
        const out = [];
        const n = code.length;
        let i = 0;
        const reTag = /<(\/?)([A-Za-z][\w:.-]*)/y;
        const reDoctype = /<![A-Za-z][^>]*>?/y;
        const reEntity = /&#?[A-Za-z0-9]+;/y;
        const reAttr = /[^\s"'=<>\/]+/y;
        const reVal = /"[^"]*"?|'[^']*'?|[^\s"'=<>`]+/y;
        const reClose = /\/?>/y;
        const reWs = /\s+/y;
        function at(re, pos) { re.lastIndex = pos; return re.exec(code); }
        while (i < n) {
            const c = code[i];
            if (c === '<') {
                if (code.startsWith('<!--', i)) {
                    const e = code.indexOf('-->', i + 4);
                    const end = e < 0 ? n : e + 3;
                    pushTok(out, 'comment', code.slice(i, end));
                    i = end;
                    continue;
                }
                let m = at(reDoctype, i);
                if (m) { pushTok(out, 'keyword', m[0]); i += m[0].length; continue; }
                m = at(reTag, i);
                if (m) {
                    pushTok(out, 'punctuation', '<' + m[1]);
                    pushTok(out, 'tag', m[2]);
                    i += m[0].length;
                    const tagName = m[2].toLowerCase();
                    const closing = m[1] === '/';
                    // attributes
                    while (i < n) {
                        let a = at(reWs, i);
                        if (a) { pushTok(out, null, a[0]); i += a[0].length; continue; }
                        a = at(reClose, i);
                        if (a) { pushTok(out, 'punctuation', a[0]); i += a[0].length; break; }
                        if (code[i] === '=') { pushTok(out, 'operator', '='); i++; a = at(reWs, i); if (a) { pushTok(out, null, a[0]); i += a[0].length; } a = at(reVal, i); if (a) { pushTok(out, 'string', a[0]); i += a[0].length; } continue; }
                        a = at(reAttr, i);
                        if (a) { pushTok(out, 'attr', a[0]); i += a[0].length; continue; }
                        if (code[i] === '/') { pushTok(out, 'punctuation', '/'); i++; continue; }
                        break; // stray '<' or quote: bail out of the tag
                    }
                    if (!closing && (tagName === 'script' || tagName === 'style')) {
                        const closeRe = new RegExp('</' + tagName + '\\b', 'i');
                        const rest = code.slice(i);
                        const cm = closeRe.exec(rest);
                        const len = cm ? cm.index : rest.length;
                        const inner = rest.slice(0, len);
                        const sub = tagName === 'script' ? tokenizeJs(inner) : tokenizeCss(inner);
                        sub.forEach(t => pushTok(out, t.type, t.value));
                        i += len;
                    }
                    continue;
                }
                pushTok(out, null, '<');
                i++;
                continue;
            }
            if (c === '&') {
                const m = at(reEntity, i);
                if (m) { pushTok(out, 'number', m[0]); i += m[0].length; continue; }
            }
            let j = i + 1;
            while (j < n && code[j] !== '<' && code[j] !== '&') j++;
            pushTok(out, null, code.slice(i, j));
            i = j;
        }
        return out;
    }

    function tokenizeCss(code) {
        const out = [];
        const n = code.length;
        const stack = []; // 'rules' | 'decl'
        let i = 0;
        let inValue = false;
        let prelude = '';
        const reComment = /\/\*[\s\S]*?(?:\*\/|$)/y;
        const reString = /"(?:[^"\\\n]|\\[\s\S])*"?|'(?:[^'\\\n]|\\[\s\S])*'?/y;
        const reAt = /@[\w-]+/y;
        const reNum = /[+-]?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/y;
        const reHex = /#[0-9a-fA-F]{3,8}\b/y;
        const reIdent = /-?-?[A-Za-z_][\w-]*/y;
        const reVar = /--[\w-]+/y;
        const reFn = /[A-Za-z_-][\w-]*(?=\()/y;
        const reImportant = /!\s*important/y;
        const reWs = /\s+/y;
        function at(re, pos) { re.lastIndex = pos; return re.exec(code); }
        function inDecl() { return stack.length > 0 && stack[stack.length - 1] === 'decl'; }
        while (i < n) {
            let m = at(reComment, i);
            if (m && code[i] === '/') { pushTok(out, 'comment', m[0]); i += m[0].length; continue; }
            m = at(reString, i);
            if (m) { pushTok(out, 'string', m[0]); i += m[0].length; if (!inDecl()) prelude += m[0]; continue; }
            m = at(reWs, i);
            if (m) { pushTok(out, null, m[0]); if (!inDecl()) prelude += m[0]; i += m[0].length; continue; }
            const c = code[i];
            if (c === '{') {
                const p = prelude.trim().toLowerCase();
                // conditional group at-rules contain nested rules; everything else holds declarations
                const isRules = !inDecl() && /^@(media|supports|layer|container|document|-moz-document|scope)\b/.test(p);
                stack.push(isRules ? 'rules' : 'decl');
                pushTok(out, 'punctuation', c); i++; prelude = ''; inValue = false; continue;
            }
            if (c === '}') {
                stack.pop();
                pushTok(out, 'punctuation', c); i++; prelude = ''; inValue = false; continue;
            }
            if (!inDecl()) {
                // selector / at-rule prelude area
                m = at(reAt, i);
                if (m) { pushTok(out, 'keyword', m[0]); prelude += m[0]; i += m[0].length; continue; }
                if (c === ';') { pushTok(out, 'punctuation', c); i++; prelude = ''; continue; }
                const atRule = /^\s*@/.test(prelude);
                if (atRule) {
                    m = at(reFn, i) || at(reIdent, i);
                    if (m && m[0].length) {
                        const isFn = code[i + m[0].length] === '(';
                        pushTok(out, isFn ? 'function' : (/^(and|or|not|only)$/i.test(m[0]) ? 'keyword' : 'property'), m[0]);
                        prelude += m[0]; i += m[0].length; continue;
                    }
                    m = at(reNum, i);
                    if (m && /\d/.test(m[0])) { pushTok(out, 'number', m[0]); prelude += m[0]; i += m[0].length; continue; }
                    pushTok(out, 'punctuation', c); prelude += c; i++; continue;
                }
                // selector token run
                m = /[.#]?[A-Za-z_*][\w-]*|::?[A-Za-z-]+(?:\([^)]*\))?|\[[^\]]*\]|\*/y;
                m.lastIndex = i;
                const sm = m.exec(code);
                if (sm && sm[0].length) { pushTok(out, 'selector', sm[0]); prelude += sm[0]; i += sm[0].length; continue; }
                pushTok(out, 'punctuation', c); prelude += c; i++; continue;
            }
            // declaration block
            if (!inValue) {
                m = at(reVar, i) || at(reIdent, i);
                if (m) {
                    // property only when followed by ':'
                    const after = /\s*:/y; after.lastIndex = i + m[0].length;
                    if (after.test(code)) { pushTok(out, 'property', m[0]); i += m[0].length; continue; }
                    // nested rule selector (CSS nesting) - highlight as selector
                    pushTok(out, 'selector', m[0]); i += m[0].length; continue;
                }
                if (c === ':') { pushTok(out, 'punctuation', c); inValue = true; i++; continue; }
                if (c === ';') { pushTok(out, 'punctuation', c); i++; continue; }
                pushTok(out, 'punctuation', c); i++; continue;
            }
            // value
            if (c === ';') { pushTok(out, 'punctuation', c); inValue = false; i++; continue; }
            m = at(reImportant, i);
            if (m) { pushTok(out, 'keyword', m[0]); i += m[0].length; continue; }
            m = at(reHex, i);
            if (m) { pushTok(out, 'number', m[0]); i += m[0].length; continue; }
            m = at(reFn, i);
            if (m) { pushTok(out, 'function', m[0]); i += m[0].length; continue; }
            m = at(reVar, i);
            if (m) { pushTok(out, 'variable', m[0]); i += m[0].length; continue; }
            m = at(reNum, i);
            if (m && /\d/.test(m[0])) { pushTok(out, 'number', m[0]); i += m[0].length; continue; }
            m = at(reIdent, i);
            if (m) { pushTok(out, 'literal', m[0]); i += m[0].length; continue; }
            pushTok(out, 'punctuation', c); i++;
        }
        return out;
    }

    /** Lossless tokenizer. Returns [{ type: string|null, value: string }, ...]. Unknown languages -> one plain token. */
    function tokenize(code, language) {
        code = code == null ? '' : String(code);
        const lang = normLang(language);
        let toks;
        try {
            if (lang === 'js') toks = tokenizeJs(code);
            else if (lang === 'json') toks = tokenizeJson(code);
            else if (lang === 'html') toks = tokenizeHtml(code);
            else if (lang === 'css') toks = tokenizeCss(code);
            else if (lang === 'bash') toks = tokenizeBash(code);
        } catch (e) { toks = null; }
        if (!toks || toks.map(t => t.value).join('') !== code) toks = code ? [{ type: null, value: code }] : [];
        return toks;
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /** Highlight to an escaped HTML string. Every value is escaped; only whitelisted class names are emitted. */
    function highlight(code, language) {
        return tokenize(code, language).map(t => {
            const v = escapeHtml(t.value);
            return t.type ? '<span class="chillcode-tok chillcode-tok-' + t.type + '">' + v + '</span>' : v;
        }).join('');
    }

    function tokenSpan(t) {
        const s = document.createElement('span');
        s.className = 'chillcode-tok chillcode-tok-' + t.type;
        s.textContent = t.value;
        return s;
    }

    /** Highlight to a DocumentFragment built purely from text nodes and spans. */
    function highlightToFragment(code, language) {
        const frag = document.createDocumentFragment();
        tokenize(code, language).forEach(t => frag.appendChild(t.type ? tokenSpan(t) : document.createTextNode(t.value)));
        return frag;
    }

    /** Parse highlightLines spec into a Set-like object of numbers. */
    function parseLines(spec) {
        const out = Object.create(null);
        const add = (a, b) => {
            a = parseInt(a, 10); b = b == null ? a : parseInt(b, 10);
            if (!isFinite(a) || !isFinite(b)) return;
            if (b < a) { const t = a; a = b; b = t; }
            if (b - a > 100000) b = a + 100000;
            for (let k = a; k <= b; k++) out[k] = true;
        };
        const one = (v) => {
            if (typeof v === 'number') add(v);
            else if (typeof v === 'string') v.split(',').forEach(part => {
                const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part);
                if (m) add(m[1], m[2]);
            });
        };
        if (Array.isArray(spec)) spec.forEach(one); else if (spec != null) one(spec);
        return out;
    }

    // ------------------------------------------------------------------ CSS
    const CSS = `
:root {
  --chillcode-primary: #3b82f6;
  --chillcode-bg: #f8fafc;
  --chillcode-header-bg: #f1f5f9;
  --chillcode-text: #1f2937;
  --chillcode-muted: #64748b;
  --chillcode-border: #e2e8f0;
  --chillcode-line-bg: rgba(59,130,246,.12);
  --chillcode-line-bar: #3b82f6;
  --chillcode-btn-hover: rgba(15,23,42,.07);
  --chillcode-success: #16a34a;
  --chillcode-danger: #dc2626;
  --chillcode-comment: #6a737d;
  --chillcode-keyword: #cf222e;
  --chillcode-string: #0a3069;
  --chillcode-number: #0550ae;
  --chillcode-literal: #0550ae;
  --chillcode-function: #8250df;
  --chillcode-property: #0550ae;
  --chillcode-tag: #116329;
  --chillcode-attr: #953800;
  --chillcode-operator: #cf222e;
  --chillcode-punctuation: #57606a;
  --chillcode-variable: #953800;
  --chillcode-type: #953800;
  --chillcode-selector: #116329;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) {
    --chillcode-bg: #0d1117;
    --chillcode-header-bg: #161b22;
    --chillcode-text: #e6edf3;
    --chillcode-muted: #8b949e;
    --chillcode-border: #30363d;
    --chillcode-line-bg: rgba(88,166,255,.15);
    --chillcode-line-bar: #58a6ff;
    --chillcode-btn-hover: rgba(240,246,252,.1);
    --chillcode-success: #3fb950;
    --chillcode-danger: #f85149;
    --chillcode-comment: #8b949e;
    --chillcode-keyword: #ff7b72;
    --chillcode-string: #a5d6ff;
    --chillcode-number: #79c0ff;
    --chillcode-literal: #79c0ff;
    --chillcode-function: #d2a8ff;
    --chillcode-property: #79c0ff;
    --chillcode-tag: #7ee787;
    --chillcode-attr: #ffa657;
    --chillcode-operator: #ff7b72;
    --chillcode-punctuation: #8b949e;
    --chillcode-variable: #ffa657;
    --chillcode-type: #ffa657;
    --chillcode-selector: #7ee787;
  }
}
:root[data-theme="dark"], :root.dark {
  --chillcode-bg: #0d1117;
  --chillcode-header-bg: #161b22;
  --chillcode-text: #e6edf3;
  --chillcode-muted: #8b949e;
  --chillcode-border: #30363d;
  --chillcode-line-bg: rgba(88,166,255,.15);
  --chillcode-line-bar: #58a6ff;
  --chillcode-btn-hover: rgba(240,246,252,.1);
  --chillcode-success: #3fb950;
  --chillcode-danger: #f85149;
  --chillcode-comment: #8b949e;
  --chillcode-keyword: #ff7b72;
  --chillcode-string: #a5d6ff;
  --chillcode-number: #79c0ff;
  --chillcode-literal: #79c0ff;
  --chillcode-function: #d2a8ff;
  --chillcode-property: #79c0ff;
  --chillcode-tag: #7ee787;
  --chillcode-attr: #ffa657;
  --chillcode-operator: #ff7b72;
  --chillcode-punctuation: #8b949e;
  --chillcode-variable: #ffa657;
  --chillcode-type: #ffa657;
  --chillcode-selector: #7ee787;
}

.chillcode {
  box-sizing: border-box;
  position: relative;
  margin: 0;
  background: var(--chillcode-bg);
  color: var(--chillcode-text);
  border: 1px solid var(--chillcode-border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  text-align: left;
}
.chillcode *, .chillcode *::before, .chillcode *::after { box-sizing: border-box; }
.chillcode-header {
  display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 8px 4px 14px;
  background: var(--chillcode-header-bg); border-bottom: 1px solid var(--chillcode-border);
}
.chillcode-title { font-size: 13px; font-weight: 500; color: var(--chillcode-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.chillcode-lang {
  font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--chillcode-muted);
  white-space: nowrap;
}
.chillcode-title + .chillcode-lang::before { content: "\\00b7"; margin-right: 8px; }
.chillcode-spacer { flex: 1 1 auto; }
.chillcode-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.chillcode-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 32px; min-width: 32px; padding: 0 10px;
  background: transparent; color: var(--chillcode-muted); border: 0; border-radius: 6px;
  font: inherit; font-size: 13px; font-weight: 500; line-height: 1; cursor: pointer;
  transition: background-color .15s ease, color .15s ease;
}
.chillcode-btn:hover { background: var(--chillcode-btn-hover); color: var(--chillcode-text); }
.chillcode-btn:focus-visible { outline: 2px solid var(--chillcode-primary); outline-offset: 1px; }
.chillcode-btn[aria-pressed="true"] { color: var(--chillcode-primary); background: var(--chillcode-line-bg); }
.chillcode-btn svg { width: 14px; height: 14px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.chillcode-copied { color: var(--chillcode-success); }
.chillcode-copy-failed { color: var(--chillcode-danger); }
.chillcode-status { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.chillcode-pre {
  margin: 0; padding: 12px 0; overflow: auto; background: transparent;
  tab-size: 4; -moz-tab-size: 4;
}
.chillcode-pre:focus { outline: none; }
.chillcode-pre:focus-visible { outline: 2px solid var(--chillcode-primary); outline-offset: -2px; }
.chillcode-code {
  display: block; min-width: max-content; padding: 0;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 13px; line-height: 1.6; color: var(--chillcode-text); white-space: pre; background: none; border: 0;
}
.chillcode-sm .chillcode-code { font-size: 12px; }
.chillcode-lg .chillcode-code { font-size: 14px; }
.chillcode-wrap .chillcode-code { min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal; }
.chillcode-line { display: inline-block; min-width: 100%; padding: 0 16px; border-left: 3px solid transparent; vertical-align: top; }
.chillcode-wrap .chillcode-line { display: block; min-width: 0; }
.chillcode-ln .chillcode-line { padding-left: 8px; }
.chillcode-ln .chillcode-line::before {
  content: attr(data-line);
  content: attr(data-line) / "";
  display: inline-block; width: 3.5ch; margin-right: 16px; text-align: right;
  color: var(--chillcode-muted); opacity: .75; user-select: none; -webkit-user-select: none;
}
.chillcode-line-hl { background: var(--chillcode-line-bg); border-left-color: var(--chillcode-line-bar); }
.chillcode-ln .chillcode-line-hl::before { opacity: 1; }

.chillcode-tok-comment { color: var(--chillcode-comment); font-style: italic; }
.chillcode-tok-keyword { color: var(--chillcode-keyword); }
.chillcode-tok-string { color: var(--chillcode-string); }
.chillcode-tok-number { color: var(--chillcode-number); }
.chillcode-tok-literal { color: var(--chillcode-literal); }
.chillcode-tok-function { color: var(--chillcode-function); }
.chillcode-tok-property { color: var(--chillcode-property); }
.chillcode-tok-tag { color: var(--chillcode-tag); }
.chillcode-tok-attr { color: var(--chillcode-attr); }
.chillcode-tok-operator { color: var(--chillcode-operator); }
.chillcode-tok-punctuation { color: var(--chillcode-punctuation); }
.chillcode-tok-variable { color: var(--chillcode-variable); }
.chillcode-tok-type { color: var(--chillcode-type); }
.chillcode-tok-selector { color: var(--chillcode-selector); }

@media (prefers-reduced-motion: reduce) {
  .chillcode-btn { transition: none; }
}
@media (forced-colors: active) {
  .chillcode-line-hl { border-left-color: Highlight; }
}
`;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    function icon(paths) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        paths.forEach(p => {
            const el = document.createElementNS(SVG_NS, p[0]);
            Object.keys(p[1]).forEach(k => el.setAttribute(k, p[1][k]));
            svg.appendChild(el);
        });
        return svg;
    }
    const ICON_COPY = () => icon([['rect', { x: 9, y: 9, width: 13, height: 13, rx: 2 }], ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]]);
    const ICON_CHECK = () => icon([['path', { d: 'M20 6 9 17l-5-5' }]]);
    const ICON_WRAP = () => icon([['path', { d: 'M3 6h18M3 12h15a3 3 0 1 1 0 6h-4' }], ['path', { d: 'm16 16-2 2 2 2' }], ['path', { d: 'M3 18h7' }]]);

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function isNode(v) { return !!v && typeof v === 'object' && typeof v.nodeType === 'number'; }

    function legacyCopy(text) {
        try {
            if (typeof document.execCommand !== 'function') return false;
            const active = document.activeElement;
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.setAttribute('aria-hidden', 'true');
            ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
            document.body.appendChild(ta);
            ta.select();
            try { ta.setSelectionRange(0, text.length); } catch (e) { /* ignore */ }
            let ok = false;
            try { ok = !!document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(ta);
            if (active && typeof active.focus === 'function') { try { active.focus(); } catch (e) { /* ignore */ } }
            return ok;
        } catch (e) { return false; }
    }

    function copyText(text) {
        const nav = window.navigator;
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function' && window.isSecureContext !== false) {
            return nav.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
        }
        return Promise.resolve(legacyCopy(text));
    }

    function detectLang(el) {
        const probes = [el, el.querySelector && el.querySelector('code')];
        for (let k = 0; k < probes.length; k++) {
            const p = probes[k];
            if (!p) continue;
            const ds = p.getAttribute && (p.getAttribute('data-lang') || p.getAttribute('data-language'));
            if (ds) return ds;
            const cls = (p.getAttribute && p.getAttribute('class')) || '';
            const m = /(?:^|\s)(?:language|lang)-([\w+-]+)/.exec(cls);
            if (m) return m[1];
        }
        return 'text';
    }

    class ChillCodeInstance {
        constructor(options, source) {
            this.options = Object.assign({}, DEFAULTS, options || {});
            const o = this.options;
            if (SIZES.indexOf(o.size) < 0) o.size = 'md';
            o.code = o.code == null ? '' : String(o.code);
            this._listeners = {};
            this._destroyed = false;
            this._timers = [];
            this._source = source || null;
            this._copyToken = 0;
            injectCSS();
            this._build();
        }

        _build() {
            const o = this.options;
            const root = document.createElement('div');
            this.element = root;
            this._header = null;

            const pre = document.createElement('pre');
            pre.className = 'chillcode-pre';
            pre.tabIndex = 0;
            pre.setAttribute('role', 'region');
            const code = document.createElement('code');
            code.className = 'chillcode-code';
            pre.appendChild(code);
            this.preEl = pre;
            this.codeEl = code;

            root.appendChild(pre);
            this._buildHeader();
            this._applyClasses();
            this._renderCode();

            if (this._source && this._source.parentNode) {
                this._source.parentNode.insertBefore(root, this._source);
                this._sourceParent = this._source.parentNode;
                this._sourceNext = this._source.nextSibling;
                this._sourceParent.removeChild(this._source);
            } else if (o.parent) {
                const p = typeof o.parent === 'string' ? document.querySelector(o.parent) : o.parent;
                if (p) p.appendChild(root);
            }
        }

        _langLabel() {
            const o = this.options;
            if (o.languageLabel != null && o.languageLabel !== '') return String(o.languageLabel);
            const l = normLang(o.language);
            if (l) return LABELS[l];
            const raw = String(o.language || '').trim();
            return !raw || /^(text|plain|plaintext|txt)$/i.test(raw) ? '' : raw;
        }

        _buildHeader() {
            const o = this.options;
            if (this._header && this._header.parentNode) this._header.parentNode.removeChild(this._header);
            this._header = null; this._copyBtn = null; this._wrapBtn = null; this._status = null; this._copyLabelEl = null;
            const label = o.showLanguage ? this._langLabel() : '';
            const hasTitle = o.title !== '' && o.title != null;
            if (!label && !hasTitle && !o.copy && !o.wrapToggle) return;

            const h = document.createElement('div');
            h.className = 'chillcode-header';
            if (hasTitle) {
                const t = document.createElement('span');
                t.className = 'chillcode-title';
                t.textContent = String(o.title);
                h.appendChild(t);
            }
            if (label) {
                const l = document.createElement('span');
                l.className = 'chillcode-lang';
                l.textContent = label;
                h.appendChild(l);
            }
            const actions = document.createElement('div');
            actions.className = 'chillcode-actions';
            if (o.wrapToggle) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillcode-btn chillcode-wrap-btn';
                b.setAttribute('aria-label', 'Toggle line wrap');
                b.setAttribute('aria-pressed', o.wrap ? 'true' : 'false');
                b.title = 'Toggle line wrap';
                b.appendChild(ICON_WRAP());
                b.addEventListener('click', this._onWrapClick = () => this.toggleWrap());
                actions.appendChild(b);
                this._wrapBtn = b;
            }
            if (o.copy) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillcode-btn chillcode-copy-btn';
                b.setAttribute('aria-label', 'Copy code');
                b.title = 'Copy code';
                b.appendChild(ICON_COPY());
                const span = document.createElement('span');
                span.className = 'chillcode-copy-label';
                span.textContent = String(o.copyLabel);
                b.appendChild(span);
                b.addEventListener('click', this._onCopyClick = () => { this.copy(); });
                actions.appendChild(b);
                this._copyBtn = b;
                this._copyLabelEl = span;
                const st = document.createElement('span');
                st.className = 'chillcode-status';
                st.setAttribute('role', 'status');
                st.setAttribute('aria-live', 'polite');
                st.setAttribute('aria-atomic', 'true');
                this._status = st;
            }
            h.appendChild(actions);
            if (this._status) h.appendChild(this._status);
            this._header = h;
            this.element.insertBefore(h, this.preEl);
        }

        _applyClasses() {
            const o = this.options;
            const el = this.element;
            const cls = ['chillcode', 'chillcode-' + o.size];
            if (o.lineNumbers) cls.push('chillcode-ln');
            if (o.wrap) cls.push('chillcode-wrap');
            if (this._copied) cls.push('chillcode-state-copied');
            el.className = cls.join(' ') + (o.className ? ' ' + String(o.className).split(/\s+/).filter(Boolean).join(' ') : '');
            const lang = normLang(o.language) || String(o.language || 'text').toLowerCase().replace(/[^\w+-]/g, '');
            el.setAttribute('data-lang', lang);
            const lbl = this._langLabel();
            this.preEl.setAttribute('aria-label', (lbl ? lbl + ' code' : 'Code') + (o.title ? ': ' + o.title : ''));
            if (o.maxHeight != null && o.maxHeight !== '') {
                this.preEl.style.maxHeight = typeof o.maxHeight === 'number' ? o.maxHeight + 'px' : String(o.maxHeight).replace(/[^\w.%() +\-*\/]/g, '');
            } else {
                this.preEl.style.maxHeight = '';
            }
        }

        _renderCode() {
            const o = this.options;
            const code = this.codeEl;
            while (code.firstChild) code.removeChild(code.firstChild);
            const lang = o.highlight === false ? null : o.language;
            const tokens = tokenize(o.code, lang);
            // split tokens into lines
            const lines = [[]];
            tokens.forEach(t => {
                const parts = t.value.split('\n');
                parts.forEach((p, idx) => {
                    if (idx > 0) lines.push([]);
                    if (p) lines[lines.length - 1].push({ type: t.type, value: p });
                });
            });
            if (lines.length > 1 && lines[lines.length - 1].length === 0 && /\n$/.test(o.code)) lines.pop();
            const hl = parseLines(o.highlightLines);
            const start = parseInt(o.startLine, 10);
            const first = isFinite(start) ? start : 1;
            const frag = document.createDocumentFragment();
            lines.forEach((parts, idx) => {
                const n = first + idx;
                const line = document.createElement('span');
                line.className = 'chillcode-line' + (hl[n] ? ' chillcode-line-hl' : '');
                line.setAttribute('data-line', String(n));
                parts.forEach(t => line.appendChild(t.type ? tokenSpan(t) : document.createTextNode(t.value)));
                frag.appendChild(line);
                if (idx < lines.length - 1) frag.appendChild(document.createTextNode('\n'));
            });
            code.appendChild(frag);
            this.lineCount = lines.length;
        }

        _rerender() {
            if (this._destroyed) return;
            this._applyClasses();
            this._renderCode();
        }

        getCode() { return this.options.code; }

        setCode(code, language) {
            this.options.code = code == null ? '' : String(code);
            if (language != null) {
                this.options.language = language;
                this._buildHeader();
            }
            this._rerender();
            this._emit('change', { code: this.options.code, language: this.options.language, block: this });
            return this;
        }

        setLanguage(language) {
            this.options.language = language;
            this._buildHeader();
            this._rerender();
            this._emit('change', { code: this.options.code, language: language, block: this });
            return this;
        }

        setLineNumbers(on) { this.options.lineNumbers = !!on; this._applyClasses(); return this; }

        setHighlightLines(spec) { this.options.highlightLines = spec || []; this._renderCode(); return this; }

        setWrap(wrap) {
            wrap = !!wrap;
            if (wrap === this.options.wrap) return this;
            this.options.wrap = wrap;
            this._applyClasses();
            if (this._wrapBtn) this._wrapBtn.setAttribute('aria-pressed', wrap ? 'true' : 'false');
            this._emit('wrap', { wrap: wrap, block: this });
            if (typeof this.options.onWrapChange === 'function') this.options.onWrapChange(wrap, this);
            return this;
        }

        toggleWrap() { return this.setWrap(!this.options.wrap); }

        _setCopyState(state) {
            // state: 'copied' | 'failed' | null
            const o = this.options;
            const btn = this._copyBtn;
            if (!btn) return;
            btn.classList.toggle('chillcode-copied', state === 'copied');
            btn.classList.toggle('chillcode-copy-failed', state === 'failed');
            const label = state === 'copied' ? o.copiedLabel : state === 'failed' ? o.failedLabel : o.copyLabel;
            if (this._copyLabelEl) this._copyLabelEl.textContent = String(label);
            const oldIcon = btn.querySelector('svg');
            if (oldIcon) btn.replaceChild(state === 'copied' ? ICON_CHECK() : ICON_COPY(), oldIcon);
            if (this._status) this._status.textContent = state ? String(label) : '';
        }

        /** Copies the raw source text. Resolves true on success. */
        copy() {
            if (this._destroyed) return Promise.resolve(false);
            const text = this.options.code;
            const token = ++this._copyToken;
            return copyText(text).then(ok => {
                if (this._destroyed || token !== this._copyToken) return ok;
                this._setCopyState(ok ? 'copied' : 'failed');
                this._timers.forEach(t => window.clearTimeout(t));
                this._timers = [];
                const ms = Number(this.options.copiedDuration);
                if (isFinite(ms) && ms >= 0) {
                    const t = window.setTimeout(() => {
                        this._timers = this._timers.filter(x => x !== t);
                        if (!this._destroyed) this._setCopyState(null);
                    }, ms);
                    this._timers.push(t);
                }
                const detail = { code: text, success: ok, block: this };
                this._emit('copy', detail);
                if (typeof this.options.onCopy === 'function') this.options.onCopy(detail);
                return ok;
            });
        }

        on(event, fn) {
            if (typeof fn !== 'function') return this;
            (this._listeners[event] = this._listeners[event] || []).push(fn);
            return this;
        }

        off(event, fn) {
            const l = this._listeners[event];
            if (!l) return this;
            if (!fn) delete this._listeners[event]; else this._listeners[event] = l.filter(f => f !== fn);
            return this;
        }

        _emit(event, detail) {
            (this._listeners[event] || []).slice().forEach(fn => {
                try { fn(detail); } catch (err) { if (typeof console !== 'undefined') console.error(err); }
            });
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._emit('destroy', { block: this });
            this._timers.forEach(t => window.clearTimeout(t));
            this._timers = [];
            if (this._copyBtn && this._onCopyClick) this._copyBtn.removeEventListener('click', this._onCopyClick);
            if (this._wrapBtn && this._onWrapClick) this._wrapBtn.removeEventListener('click', this._onWrapClick);
            const el = this.element;
            if (this._source && this._sourceParent) {
                if (el.parentNode === this._sourceParent) {
                    this._sourceParent.insertBefore(this._source, el);
                } else {
                    this._sourceParent.insertBefore(this._source, this._sourceNext && this._sourceNext.parentNode === this._sourceParent ? this._sourceNext : null);
                }
            }
            if (el.parentNode) el.parentNode.removeChild(el);
            this._listeners = {};
        }
    }

    function sourceText(el) {
        const codeEl = el.tagName === 'PRE' ? (el.querySelector('code') || el) : el;
        return codeEl.textContent || '';
    }

    const ChillCode = {
        version: VERSION,

        create(options) {
            return new ChillCodeInstance(options);
        },

        /** Upgrade existing <pre><code> (or any element holding code). Element -> instance; selector/list -> array. */
        init(selectorOrElement, options) {
            if (typeof document === 'undefined') return null;
            const make = (el) => {
                let target = el;
                if (el.tagName === 'CODE' && el.parentNode && el.parentNode.tagName === 'PRE') target = el.parentNode;
                const lang = detectLang(target);
                let code = sourceText(target);
                code = code.replace(/^\n/, '').replace(/\n\s*$/, '');
                return new ChillCodeInstance(Object.assign({ language: lang }, options || {}, { code: code }), target);
            };
            if (isNode(selectorOrElement)) return make(selectorOrElement);
            let list = [];
            if (typeof selectorOrElement === 'string') list = Array.prototype.slice.call(document.querySelectorAll(selectorOrElement));
            else if (selectorOrElement && typeof selectorOrElement.length === 'number') list = Array.prototype.slice.call(selectorOrElement);
            // dedupe when both <pre> and its <code> match
            const seen = [];
            list = list.filter(el => {
                const t = el.tagName === 'CODE' && el.parentNode && el.parentNode.tagName === 'PRE' ? el.parentNode : el;
                if (seen.indexOf(t) >= 0) return false;
                seen.push(t);
                return true;
            });
            return list.map(make);
        },

        tokenize: tokenize,
        highlight: highlight,
        highlightToFragment: highlightToFragment,
        escapeHtml: escapeHtml,
        languages: ['js', 'json', 'html', 'css', 'bash'],
        injectCSS: injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCode;
    } else {
        window.ChillCode = ChillCode;
    }

})(typeof window !== 'undefined' ? window : this);
