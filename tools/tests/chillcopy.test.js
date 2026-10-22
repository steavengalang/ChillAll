const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

function withClipboard(window, impl) {
    Object.defineProperty(window.navigator, 'clipboard', { value: impl, configurable: true });
}

test('chillcopy is SSR safe and copy() resolves false without DOM', async () => {
    const lib = loadSSR('chillcopy');
    assert.ok(lib.version);
    assert.equal(await lib.copy('x'), false);
});

test('chillcopy.copy uses Clipboard API when available', async () => {
    const { lib, window } = load('chillcopy');
    let written = null;
    withClipboard(window, { writeText: t => { written = t; return Promise.resolve(); } });
    assert.equal(await lib.copy('hello'), true);
    assert.equal(written, 'hello');
});

test('chillcopy.copy falls back to execCommand when clipboard rejects or is missing', async () => {
    const { lib, window, document } = load('chillcopy');
    let cmd = null, copied = null;
    document.execCommand = c => { cmd = c; copied = document.activeElement.value; return true; };
    withClipboard(window, { writeText: () => Promise.reject(new Error('denied')) });
    assert.equal(await lib.copy('fallback'), true);
    assert.equal(cmd, 'copy');
    assert.equal(copied, 'fallback');
    assert.equal(document.querySelector('textarea'), null, 'temp textarea removed');
    withClipboard(window, undefined);
    assert.equal(await lib.copy('again'), true);
    document.execCommand = () => false;
    assert.equal(await lib.copy('nope'), false);
});

test('chillcopy.copy fallback restores focus', async () => {
    const { lib, document } = load('chillcopy');
    document.execCommand = () => true;
    const b = document.createElement('button'); document.body.appendChild(b); b.focus();
    await lib.copy('x');
    assert.equal(document.activeElement, b);
});

test('chillcopy init: data attribute copy, success state, label swap, events, reset and destroy', async () => {
    const { lib, window, document } = load('chillcopy');
    let written = null; const copied = [];
    withClipboard(window, { writeText: t => { written = t; return Promise.resolve(); } });
    document.body.innerHTML = '<button id="b" data-chill-copy="npm i x">Copy</button>';
    const h = lib.init('[data-chill-copy]', { duration: 30, onCopy: t => copied.push(t) });
    const b = document.getElementById('b');
    let evText = null;
    b.addEventListener('chillcopy:copy', e => { evText = e.detail.text; });
    b.click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(written, 'npm i x');
    assert.deepEqual(copied, ['npm i x']);
    assert.equal(evText, 'npm i x');
    assert.ok(b.classList.contains('chillcopy-success'));
    assert.equal(b.querySelector('span').textContent, 'Copied!');
    assert.equal(document.querySelector('.chillcopy-sr').textContent, 'Copied!');
    assert.ok(b.querySelector('.chillcopy-tip-visible'));
    await new Promise(r => setTimeout(r, 60));
    assert.equal(b.classList.contains('chillcopy-success'), false);
    assert.equal(b.querySelector('span').textContent, 'Copy');
    h.destroy();
    assert.equal(b.classList.contains('chillcopy'), false);
    assert.equal(b.textContent, 'Copy');
    assert.equal(document.querySelector('.chillcopy-sr'), null);
    written = null;
    b.click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(written, null, 'click listener removed');
});

test('chillcopy init: copies value/textContent of target, icon-only gets aria-label, failure fires onError', async () => {
    const { lib, window, document } = load('chillcopy');
    let written = null;
    withClipboard(window, { writeText: t => { written = t; return Promise.resolve(); } });
    document.body.innerHTML = '<pre id="code">line1\nline2</pre><input id="inp" value="v1"><button id="a" data-chill-copy-target="#code"></button><button id="c" data-chill-copy-target="#inp">C</button>';
    const h = lib.init('[data-chill-copy-target]');
    assert.equal(document.getElementById('a').getAttribute('aria-label'), 'Copy to clipboard');
    document.getElementById('a').click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(written, 'line1\nline2');
    document.getElementById('c').click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(written, 'v1');
    h.destroy();
    // failure
    const errs = [];
    withClipboard(window, { writeText: () => Promise.reject(new Error('x')) });
    document.execCommand = () => false;
    document.body.innerHTML = '<button id="d" data-chill-copy="x">Copy</button>';
    const h2 = lib.init('#d', { onError: e => errs.push(e.message), duration: 5 });
    document.getElementById('d').click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(errs.length, 1);
    assert.ok(document.getElementById('d').classList.contains('chillcopy-error'));
    h2.destroy();
});

test('chillcopy.create builds a button with icon and text-only labels; destroy removes it', async () => {
    const { lib, window, document } = load('chillcopy');
    let written = null;
    withClipboard(window, { writeText: t => { written = t; return Promise.resolve(); } });
    const bad = '<img src=x onerror=alert(1)>';
    const c = lib.create({ text: () => 'dyn', label: bad, duration: 10 });
    document.body.appendChild(c.element);
    assert.equal(document.querySelectorAll('img').length, 0);
    assert.ok(c.element.querySelector('svg'));
    c.element.click();
    await new Promise(r => setTimeout(r, 5));
    assert.equal(written, 'dyn');
    c.destroy();
    assert.equal(document.querySelector('.chillcopy'), null);
});

test('chillcopy CSS has dark theme', () => {
    const { lib, document } = load('chillcopy');
    lib.injectCSS();
    assert.match(document.getElementById('chillcopy-styles').textContent, /:root\[data-theme="dark"\]/);
});
