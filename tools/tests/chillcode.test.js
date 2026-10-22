'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const plain = (x) => JSON.parse(JSON.stringify(x));

const SAMPLES = {
    js: 'const a = 1; // hi\nfunction foo(x) { return x / 2 + /re[gex]+/g.test("s\\"q") ? `t ${a}` : null; }\n/* multi\nline */ class Foo extends Bar {}\n',
    json: '{"a": [1, 2.5e3, true, null], "b": {"c": "d"}}',
    html: '<!DOCTYPE html>\n<div class="a" id=b data-x=\'1\'>Hi &amp; <b>bye</b><!-- c --><br/></div>\n<script>const x = 1;</script><style>a { color: red }</style>',
    css: '@media (max-width: 600px) { .a > b:hover, #id[x] { color: #fff; margin: 0 -1.5rem !important; background: url("x.png") } }\n/* c */\n:root { --x: calc(1px + 2px); }',
    bash: '#!/bin/bash\nFOO=bar sudo apt-get install -y "pkg" && echo $FOO | grep --color=auto x # comment\nif [ -f a ]; then ls -la; fi'
};

test('chillcode tokenizer is lossless for every language and never emits unknown types', () => {
    const { lib } = load('chillcode');
    for (const lang of Object.keys(SAMPLES)) {
        const toks = lib.tokenize(SAMPLES[lang], lang);
        assert.equal(toks.map(t => t.value).join(''), SAMPLES[lang], lang);
        assert.ok(toks.some(t => t.type), lang + ' has highlighted tokens');
    }
    assert.deepEqual(plain(lib.tokenize('plain <b>', 'text')), [{ type: null, value: 'plain <b>' }]);
    assert.deepEqual(plain(lib.tokenize('', 'js')), []);
    assert.equal(lib.tokenize('x', 'unknown-lang').length, 1);
});

test('chillcode tokenizer classifies js tokens', () => {
    const { lib } = load('chillcode');
    const t = lib.tokenize('const n = 42; // c\nfoo("s", true)', 'js');
    const by = (type) => t.filter(x => x.type === type).map(x => x.value);
    assert.deepEqual(plain(by('keyword')), ['const']);
    assert.deepEqual(plain(by('number')), ['42']);
    assert.deepEqual(plain(by('comment')), ['// c']);
    assert.deepEqual(plain(by('function')), ['foo']);
    assert.deepEqual(plain(by('string')), ['"s"']);
    assert.deepEqual(plain(by('literal')), ['true']);
    // division vs regex
    const d = lib.tokenize('a / b / c', 'js');
    assert.ok(!d.some(x => x.type === 'string'));
    const r = lib.tokenize('x = /ab+c/gi', 'js');
    assert.ok(r.some(x => x.type === 'string' && x.value === '/ab+c/gi'));
});

test('chillcode tokenizer: json keys, html tags/attrs, css props, bash cmds', () => {
    const { lib } = load('chillcode');
    const j = lib.tokenize('{"k": "v"}', 'json');
    assert.ok(j.some(x => x.type === 'property' && x.value === '"k"'));
    assert.ok(j.some(x => x.type === 'string' && x.value === '"v"'));
    const h = lib.tokenize('<a href="x">t</a>', 'html');
    assert.ok(h.some(x => x.type === 'tag' && x.value === 'a'));
    assert.ok(h.some(x => x.type === 'attr' && x.value === 'href'));
    assert.ok(h.some(x => x.type === 'string' && x.value === '"x"'));
    const c = lib.tokenize('.a { color: red; }', 'css');
    assert.ok(c.some(x => x.type === 'selector' && x.value === '.a'));
    assert.ok(c.some(x => x.type === 'property' && x.value === 'color'));
    assert.ok(c.some(x => x.type === 'literal' && x.value === 'red'));
    const b = lib.tokenize('ls -la | grep x', 'bash');
    assert.ok(b.some(x => x.type === 'function' && x.value === 'ls'));
    assert.ok(b.some(x => x.type === 'function' && x.value === 'grep'));
    assert.ok(b.some(x => x.type === 'attr' && x.value === '-la'));
});

test('chillcode.highlight returns safe escaped HTML (XSS)', () => {
    const { lib, document } = load('chillcode');
    const evil = '<script>alert(1)</script><img src=x onerror="alert(2)">';
    for (const lang of ['js', 'json', 'html', 'css', 'bash', 'text']) {
        const html = lib.highlight(evil, lang);
        const box = document.createElement('div');
        box.innerHTML = html;
        assert.equal(box.querySelector('script'), null, lang);
        assert.equal(box.querySelector('img'), null, lang);
        assert.equal(box.textContent, evil, lang);
        // only our spans
        box.querySelectorAll('*').forEach(el => {
            assert.equal(el.tagName, 'SPAN');
            assert.match(el.className, /^chillcode-tok chillcode-tok-[a-z]+$/);
        });
    }
    assert.equal(lib.highlight('a & "b"', 'text'), 'a &amp; &quot;b&quot;');
    const frag = lib.highlightToFragment('const x = "<b>";', 'js');
    const box = document.createElement('div');
    box.appendChild(frag);
    assert.equal(box.querySelector('b'), null);
    assert.equal(box.textContent, 'const x = "<b>";');
});

test('chillcode creates DOM, renders lines and destroys cleanly', () => {
    const { lib, document } = load('chillcode');
    const b = lib.create({ code: 'a\nb\nc\n', language: 'js', parent: document.body });
    assert.ok(document.querySelector('.chillcode'));
    assert.ok(document.getElementById('chillcode-styles'));
    const lines = b.element.querySelectorAll('.chillcode-line');
    assert.equal(lines.length, 3);
    assert.equal(lines[2].getAttribute('data-line'), '3');
    assert.equal(b.codeEl.textContent, 'a\nb\nc'.replace(/$/, '') );
    assert.equal(b.getCode(), 'a\nb\nc\n');
    assert.equal(b.element.querySelector('.chillcode-lang').textContent, 'JavaScript');
    assert.equal(b.preEl.getAttribute('role'), 'region');
    assert.equal(b.preEl.tabIndex, 0);
    b.destroy();
    assert.equal(document.querySelector('.chillcode'), null);
});

test('chillcode never injects source as HTML', () => {
    const { lib, document } = load('chillcode');
    const b = lib.create({ code: '<img src=x onerror=alert(1)><script>x</script>', language: 'html', title: '<b>t</b>', parent: document.body });
    assert.equal(document.querySelector('.chillcode img'), null);
    assert.equal(document.querySelector('.chillcode script'), null);
    assert.equal(document.querySelector('.chillcode-title b'), null);
    assert.equal(b.codeEl.textContent, '<img src=x onerror=alert(1)><script>x</script>');
});

test('chillcode line numbers, startLine and highlightLines', () => {
    const { lib } = load('chillcode');
    const b = lib.create({ code: '1\n2\n3\n4\n5', lineNumbers: true, startLine: 10, highlightLines: [11, '13-14'] });
    assert.ok(b.element.classList.contains('chillcode-ln'));
    const hl = [...b.element.querySelectorAll('.chillcode-line-hl')].map(l => l.getAttribute('data-line'));
    assert.deepEqual(hl, ['11', '13', '14']);
    b.setHighlightLines('10, 12-12');
    const hl2 = [...b.element.querySelectorAll('.chillcode-line-hl')].map(l => l.getAttribute('data-line'));
    assert.deepEqual(hl2, ['10', '12']);
    b.setLineNumbers(false);
    assert.ok(!b.element.classList.contains('chillcode-ln'));
});

test('chillcode wrap toggle: aria-pressed, class, events', () => {
    const { lib } = load('chillcode');
    const seen = [];
    const b = lib.create({ code: 'x', wrapToggle: true, onWrapChange: w => seen.push('cb' + w) });
    b.on('wrap', e => seen.push('ev' + e.wrap));
    const btn = b.element.querySelector('.chillcode-wrap-btn');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    btn.click();
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    assert.ok(b.element.classList.contains('chillcode-wrap'));
    btn.click();
    assert.ok(!b.element.classList.contains('chillcode-wrap'));
    assert.deepEqual(seen, ['evtrue', 'cbtrue', 'evfalse', 'cbfalse']);
    assert.equal(lib.create({ code: 'x' }).element.querySelector('.chillcode-wrap-btn'), null);
});

test('chillcode copy uses navigator.clipboard and gives aria-live feedback', async () => {
    const { lib, window } = load('chillcode');
    const written = [];
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { written.push(t); return Promise.resolve(); } } });
    const events = [];
    const b = lib.create({ code: 'hello <world>', language: 'html', copiedDuration: 20, onCopy: d => events.push(d.success) });
    const btn = b.element.querySelector('.chillcode-copy-btn');
    const status = b.element.querySelector('.chillcode-status');
    assert.equal(status.getAttribute('aria-live'), 'polite');
    assert.equal(btn.getAttribute('aria-label'), 'Copy code');
    btn.click();
    await new Promise(r => setTimeout(r, 5));
    assert.deepEqual(written, ['hello <world>']);
    assert.equal(status.textContent, 'Copied!');
    assert.ok(btn.classList.contains('chillcode-copied'));
    assert.equal(btn.querySelector('.chillcode-copy-label').textContent, 'Copied!');
    await new Promise(r => setTimeout(r, 40));
    assert.equal(status.textContent, '');
    assert.ok(!btn.classList.contains('chillcode-copied'));
    assert.equal(btn.querySelector('.chillcode-copy-label').textContent, 'Copy');
    assert.deepEqual(events, [true]);
});

test('chillcode copy falls back to execCommand and reports failure', async () => {
    const { lib, window, document } = load('chillcode');
    let cmds = 0, selected = '';
    document.execCommand = (c) => { cmds++; const ta = document.querySelector('textarea'); selected = ta ? ta.value : ''; return c === 'copy'; };
    const b = lib.create({ code: 'fallback text', copiedDuration: 1000 });
    document.body.appendChild(b.element);
    assert.equal(await b.copy(), true);
    assert.equal(cmds, 1);
    assert.equal(selected, 'fallback text');
    assert.equal(document.querySelector('textarea'), null); // cleaned up
    assert.equal(b.element.querySelector('.chillcode-status').textContent, 'Copied!');
    // failing clipboard + failing fallback
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } });
    document.execCommand = () => false;
    assert.equal(await b.copy(), false);
    assert.equal(b.element.querySelector('.chillcode-status').textContent, 'Copy failed');
    assert.ok(b.element.querySelector('.chillcode-copy-btn').classList.contains('chillcode-copy-failed'));
    b.destroy();
});

test('chillcode destroy clears the copy timer and ignores late copies', async () => {
    const { lib, window } = load('chillcode');
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } });
    const b = lib.create({ code: 'x', copiedDuration: 10 });
    await b.copy();
    assert.equal(b._timers.length, 1);
    b.destroy();
    assert.equal(b._timers.length, 0);
    assert.equal(await b.copy(), false);
});

test('chillcode setCode/setLanguage re-render and header options', () => {
    const { lib } = load('chillcode');
    const b = lib.create({ code: 'x', language: 'text' });
    assert.equal(b.element.querySelector('.chillcode-lang'), null);
    const changes = [];
    b.on('change', e => changes.push(e.language));
    b.setCode('{"a":1}', 'json');
    assert.equal(b.element.querySelector('.chillcode-lang').textContent, 'JSON');
    assert.ok(b.element.querySelector('.chillcode-tok-property'));
    assert.deepEqual(changes, ['json']);
    b.setLanguage('bash');
    assert.equal(b.element.querySelector('.chillcode-lang').textContent, 'Bash');
    const nl = lib.create({ code: 'x', language: 'js', showLanguage: false, copy: false });
    assert.equal(nl.element.querySelector('.chillcode-header'), null);
    const hl = lib.create({ code: 'x', language: 'js', highlight: false });
    assert.equal(hl.element.querySelector('.chillcode-tok'), null);
});

test('chillcode init upgrades <pre><code class="language-x"> and restores on destroy', () => {
    const { lib, document } = load('chillcode');
    document.body.innerHTML = '<p>before</p><pre id="p"><code class="language-json">{"a": 1}</code></pre><p>after</p>';
    const pre = document.getElementById('p');
    const inst = lib.init('pre > code')[0];
    assert.equal(document.getElementById('p'), null);
    assert.equal(inst.getCode(), '{"a": 1}');
    assert.equal(inst.options.language, 'json');
    assert.ok(document.querySelector('.chillcode-tok-property'));
    assert.equal(document.body.children[1], inst.element);
    inst.destroy();
    assert.equal(document.getElementById('p'), pre);
    assert.equal(document.body.children[1], pre);
    assert.equal(document.querySelector('.chillcode'), null);
});

test('chillcode maxHeight and size classes', () => {
    const { lib } = load('chillcode');
    const b = lib.create({ code: 'x', maxHeight: 120, size: 'sm' });
    assert.equal(b.preEl.style.maxHeight, '120px');
    assert.ok(b.element.classList.contains('chillcode-sm'));
    assert.ok(lib.create({ code: 'x', size: 'huge' }).element.classList.contains('chillcode-md'));
});
