import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'code',
    global: 'ChillCode',
    category: 'display',
    title: 'Code',
    summary: 'Code blocks with syntax highlighting, copy button, line numbers, highlighted lines and wrap toggle.',
    style: 'create',
    description:
        'ChillCode renders source code in a themed block with a header (language label, optional title), a copy button, optional line numbers, emphasised lines and a soft-wrap toggle. ' +
        'A small built-in tokenizer highlights JavaScript / TypeScript, JSON, HTML / XML, CSS and Bash without any dependency.\n\n' +
        'Highlighting is built from DOM nodes using `textContent`, so source code is **never** injected as HTML. The static helpers `highlight`, `highlightToFragment` and `tokenize` let you reuse the tokenizer on its own.',
    features: [
        'Highlighting for js / ts, json, html / xml, css and bash, with common aliases',
        'Copy button using the async Clipboard API with a fallback, and a polite live status',
        'Line numbers with custom `startLine`, and highlighted lines such as `"2,4-6"`',
        'Wrap toggle, `maxHeight` scrolling and three font sizes',
        'Upgrades existing `<pre><code class="language-js">` with `init()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Highlighted snippet',
            description: 'Pass `code` and a `language`. The copy button and language label are on by default.',
            height: 200,
            code: `const block = ChillCode.create({
  language: 'js',
  code: "import { ChillButton } from 'chillall';\\n\\nconst btn = ChillButton.create({ text: 'Save', variant: 'primary' });\\ndocument.body.append(btn);\\n// ready\\n",
  parent: root,
});
cleanup(() => block.destroy());`,
        },
        {
            id: 'lines',
            title: 'Line numbers and highlighted lines',
            description: '`highlightLines` accepts an array, a string like `"2,4-6"`, or a mix. `startLine` shifts the numbering, handy for excerpts.',
            height: 260,
            code: `const block = ChillCode.create({
  title: 'server.js',
  language: 'js',
  lineNumbers: true,
  startLine: 10,
  highlightLines: [11, '13-14'],
  code: "app.get('/health', (req, res) => {\\n  const uptime = process.uptime();\\n  res.json({ ok: true });\\n  // log only in development\\n  if (DEBUG) console.log(uptime);\\n});",
  parent: root,
});
cleanup(() => block.destroy());`,
        },
        {
            id: 'languages',
            title: 'Other languages',
            description: 'JSON, HTML, CSS and Bash are tokenized too. Use `language: "text"` (or `highlight: false`) for plain output.',
            height: 420,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const samples = [
  ['json', '{\\n  "name": "chillall",\\n  "version": "1.0.0",\\n  "private": false,\\n  "keywords": ["ui", "zero-dependency"]\\n}'],
  ['html', '<button class="btn" disabled>\\n  Save <span id="count">3</span>\\n</button>'],
  ['css', '.card:hover {\\n  transform: translateY(-2px);\\n  color: #3b82f6;\\n}'],
  ['bash', 'npm install chillall --save\\nexport NODE_ENV=production'],
];
const blocks = samples.map(([language, code]) => ChillCode.create({ language, code, size: 'sm', parent: root }));
cleanup(() => blocks.forEach((b) => b.destroy()));`,
        },
        {
            id: 'wrap',
            title: 'Wrap and max height',
            description: '`wrapToggle` adds a toggle button; `maxHeight` makes a long block scroll instead of growing.',
            height: 240,
            code: `const long = Array.from({ length: 14 }, (_, i) => 'const value' + i + ' = computeSomethingVeryLongName(' + i + ', "a long string argument to force a horizontal scrollbar");').join('\\n');
const block = ChillCode.create({ language: 'js', code: long, lineNumbers: true, wrapToggle: true, maxHeight: 160, parent: root });
block.on('wrap', ({ wrap }) => console.log('wrap', wrap));
cleanup(() => block.destroy());`,
        },
        {
            id: 'copy',
            title: 'Copy handling',
            description: '`onCopy` reports success; `copy()` returns a promise. Labels are customisable for localisation.',
            height: 200,
            code: `const out = document.createElement('p');
out.style.cssText = 'color:var(--chill-text);font-size:13px;margin-top:8px';
const block = ChillCode.create({
  language: 'bash',
  code: 'git clone https://example.com/repo.git',
  copyLabel: 'Copiar',
  copiedLabel: 'Copiado',
  onCopy: ({ success }) => { out.textContent = success ? 'Copied to clipboard' : 'Clipboard unavailable'; },
  parent: root,
});
root.append(out);
cleanup(() => block.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Upgrade existing markup',
            description: '`init()` upgrades `<pre><code class="language-*">` blocks; the language is read from the class.',
            height: 180,
            code: `root.innerHTML = '<pre><code class="language-css">.badge { padding: 2px 8px; border-radius: 999px; }</code></pre>';
const block = ChillCode.init(root.querySelector('pre'), { lineNumbers: true });
cleanup(() => block.destroy());`,
        },
        {
            id: 'tokenize',
            title: 'Using the tokenizer directly',
            description: '`ChillCode.highlightToFragment(code, language)` builds highlighted nodes without any HTML parsing, for your own layouts.',
            height: 100,
            code: `const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;font:13px/1.5 ui-monospace,monospace;color:var(--chill-text)';
pre.append(ChillCode.highlightToFragment('const total = items.length * 2;', 'js'));
root.append(pre);
console.log(ChillCode.languages, ChillCode.tokenize('a { color: red }', 'css').length + ' tokens');`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                '- **`create(options)`** builds a block in `block.element`; `preEl` and `codeEl` expose the inner nodes. Use `parent` to mount it.\n' +
                '- **`init(target, options)`** upgrades an existing `<pre>` (or `<code>` inside a `<pre>`, or any element holding code). An element returns one instance; a selector or list returns an array. ' +
                'The language is detected from `language-*` classes and the source text is read from the element, with a leading and trailing newline trimmed.\n\n' +
                'Use `setCode(code, language?)` to swap the content later, for example in a tabbed install snippet.',
        },
        {
            title: 'Static helpers',
            body:
                '- `ChillCode.tokenize(code, language)` returns a lossless `[{ type, value }]` array.\n' +
                '- `ChillCode.highlight(code, language)` returns an escaped HTML string that is safe to assign to `innerHTML`.\n' +
                '- `ChillCode.highlightToFragment(code, language)` returns a `DocumentFragment` of text nodes and spans.\n' +
                '- `ChillCode.escapeHtml(text)` and `ChillCode.languages` (`js`, `json`, `html`, `css`, `bash`).\n\n' +
                'Token colours are CSS variables, so you can restyle the theme without touching the tokenizer.',
        },
    ],
    options: [
        { name: 'code', type: 'string', default: "''", description: 'Source text.' },
        { name: 'language', type: "'js' | 'ts' | 'json' | 'html' | 'xml' | 'css' | 'bash' | 'sh' | 'text' ...", default: "'text'", description: 'Language or alias (javascript, typescript, jsx, tsx, svg, scss, shell, zsh...). Unknown languages render as plain text.' },
        { name: 'highlight', type: 'boolean', default: 'true', description: 'false disables the tokenizer.' },
        { name: 'title', type: 'string', default: "''", description: 'Filename or caption in the header.' },
        { name: 'showLanguage', type: 'boolean', default: 'true', description: 'Show the language label.' },
        { name: 'languageLabel', type: 'string', default: 'null', description: 'Override the label text.' },
        { name: 'lineNumbers', type: 'boolean', default: 'false', description: 'Show line numbers.' },
        { name: 'startLine', type: 'number', default: '1', description: 'Number of the first line.' },
        { name: 'highlightLines', type: 'number[] | string', default: '[]', description: 'Lines to emphasise: `[2, 4]`, `"2,4-6"` or `[2, "4-6"]` (numbers follow `startLine`).' },
        { name: 'copy', type: 'boolean', default: 'true', description: 'Show the copy button.' },
        { name: 'copyLabel / copiedLabel / failedLabel', type: 'string', default: "'Copy' / 'Copied!' / 'Copy failed'", description: 'Button and status texts.' },
        { name: 'copiedDuration', type: 'number', default: '2000', description: 'Milliseconds before the copied state resets.' },
        { name: 'wrap', type: 'boolean', default: 'false', description: 'Soft-wrap long lines.' },
        { name: 'wrapToggle', type: 'boolean', default: 'false', description: 'Show a wrap toggle button (`aria-pressed`).' },
        { name: 'maxHeight', type: 'number | string', default: 'null', description: 'Number (px) or CSS length; the block scrolls vertically beyond it.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Code font size.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class names.' },
        { name: 'parent', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'onCopy', type: '({ code, success, block }) => void', default: 'null', description: 'Called after a copy attempt.' },
        { name: 'onWrapChange', type: '(wrap, block) => void', default: 'null', description: 'Called when wrapping toggles.' },
    ],
    methods: [
        { signature: 'ChillCode.create(options)', on: 'static', description: 'Create a block; returns an instance.' },
        { signature: 'ChillCode.init(target, options)', on: 'static', description: 'Upgrade `<pre><code>` blocks; element returns an instance, selector or list returns an array.' },
        { signature: 'ChillCode.highlight(code, language)', on: 'static', description: 'Return an escaped, highlighted HTML string.' },
        { signature: 'ChillCode.highlightToFragment(code, language)', on: 'static', description: 'Return a DocumentFragment built from text nodes.' },
        { signature: 'ChillCode.tokenize(code, language)', on: 'static', description: 'Return a lossless `[{ type, value }]` token array.' },
        { signature: 'ChillCode.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'block.element / preEl / codeEl', description: 'The root, `<pre>` and `<code>` elements.' },
        { signature: 'block.getCode() / setCode(code, language?)', description: 'Read or replace the source.' },
        { signature: 'block.setLanguage(language)', description: 'Change the language and re-highlight.' },
        { signature: 'block.setLineNumbers(on) / setHighlightLines(spec)', description: 'Toggle line numbers or change emphasised lines.' },
        { signature: 'block.setWrap(on) / toggleWrap()', description: 'Control soft wrapping.' },
        { signature: 'block.copy()', description: 'Copy the code; resolves to `true` on success.' },
        { signature: 'block.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'block.destroy()', description: 'Remove the block (restores the original element for `init()`).' },
    ],
    events: [
        { name: 'copy', payload: '{ code, success, block }', description: 'A copy attempt finished.' },
        { name: 'wrap', payload: '{ wrap }', description: 'Wrapping changed.' },
        { name: 'change', payload: '{ code, language }', description: '`setCode` or `setLanguage` changed the content.' },
        { name: 'destroy', description: 'The instance was destroyed.' },
    ],
    cssVars: [
        { name: '--chillcode-bg / --chillcode-header-bg', description: 'Block and header backgrounds.' },
        { name: '--chillcode-text / --chillcode-muted / --chillcode-border', description: 'Text, secondary text and border colours.' },
        { name: '--chillcode-line-bg / --chillcode-line-bar', description: 'Highlighted-line background and left bar.' },
        { name: '--chillcode-keyword / -string / -number / -function / -comment', description: 'Token colours (also -literal, -property, -tag, -attr).' },
        { name: '--chillcode-primary / --chillcode-success / --chillcode-danger', description: 'Focus ring, copied and failed states.' },
    ],
    a11y: [
        'The `<pre>` is focusable (`tabindex="0"`), has `role="region"` and an `aria-label` such as "JavaScript code: server.js", so keyboard users can scroll it.',
        'Copy and wrap buttons are native buttons with `aria-label`; the wrap toggle exposes `aria-pressed`.',
        'Copy results are announced through a polite `role="status"` live region.',
        'Token colours meet contrast in light and dark themes; line numbers are not selected when copying.',
    ],
    tips: [
        'Only js, json, html, css and bash are tokenized. For other languages use `language: "text"`, or plug in a heavier highlighter and pass `highlight: false`.',
        'When you build snippets from user input, pass them as `code`; it is always treated as text.',
        'The module is safe to import on the server; create blocks in the browser and `destroy()` them on unmount.',
    ],
    related: ['kbd', 'card', 'tabs'],
    keywords: ['snippet', 'syntax', 'highlight', 'pre', 'copy', 'source', 'pretty print'],
};

export default doc;
