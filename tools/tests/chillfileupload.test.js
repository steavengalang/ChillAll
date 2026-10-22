const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

function setup(options, name = 'chillfileupload') {
    const env = load(name);
    const host = env.document.createElement('div');
    host.id = 'host';
    env.document.body.appendChild(host);
    const inst = env.lib.init('#host', options);
    return Object.assign(env, { inst, host });
}
const file = (window, name, size, type) => {
    const f = new window.File(['x'], name, { type: type || '' });
    if (size != null) Object.defineProperty(f, 'size', { value: size });
    return f;
};

test('fileupload escapes text, hint and file names (no XSS)', () => {
    const { inst, window, document } = setup({ text: '<img src=x onerror=1>', hint: '<b>bold</b>' });
    assert.equal(document.querySelector('.chillfileupload img'), null);
    assert.equal(document.querySelector('.chillfileupload b'), null);
    inst.addFiles([file(window, '<svg onload=1>.txt', 10, 'text/plain')]);
    assert.equal(document.querySelector('.chillfileupload-file-name svg'), null);
    assert.equal(document.querySelector('.chillfileupload-file-name').textContent, '<svg onload=1>.txt');
    inst.destroy();
});

test('fileupload html:true opts in to markup', () => {
    const { inst, document } = setup({ text: '<b>x</b>', html: true });
    assert.ok(document.querySelector('.chillfileupload b'));
    inst.destroy();
});

test('fileupload validates type, size, count and reports via onReject', () => {
    const rejects = [];
    const { inst, window, document } = setup({
        accept: 'image/*,.pdf', maxSize: 100, maxFiles: 2,
        onReject: (f, reason, msg) => rejects.push([f.name, reason, msg])
    });
    const accepted = inst.addFiles([
        file(window, 'a.png', 10, 'image/png'),
        file(window, 'b.exe', 10, 'application/x-msdownload'),
        file(window, 'c.PDF', 10, ''),
        file(window, 'big.png', 1000, 'image/png'),
        file(window, 'd.png', 10, 'image/png')
    ]);
    assert.deepEqual(Array.from(accepted.map(f => f.name)), ['a.png', 'c.PDF']);
    assert.deepEqual(rejects.map(r => r.slice(0, 2)), [['b.exe', 'type'], ['big.png', 'size'], ['d.png', 'count']]);
    assert.match(rejects[1][2], /too large/);
    assert.equal(document.querySelectorAll('.chillfileupload-errors > div').length, 3);
    assert.equal(inst.getFiles().length, 2);
    assert.equal(inst.input.getAttribute('accept'), 'image/*,.pdf');
    inst.destroy();
});

test('fileupload dropzone is keyboard operable', () => {
    const { inst, window } = setup({});
    const dz = inst.dropzone;
    assert.equal(dz.getAttribute('role'), 'button');
    assert.equal(dz.tabIndex, 0);
    let clicked = 0;
    inst.input.click = () => clicked++;
    dz.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    dz.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    assert.equal(clicked, 2);
    inst.destroy();
});

test('fileupload has aria-live status, announces adds and removes', () => {
    const { inst, window } = setup({});
    assert.equal(inst.statusEl.getAttribute('aria-live'), 'polite');
    inst.addFiles([file(window, 'a.txt', 1, 'text/plain')]);
    assert.equal(inst.statusEl.textContent, '1 file added');
    inst.container.querySelector('.chillfileupload-file-remove').click();
    assert.equal(inst.statusEl.textContent, 'a.txt removed');
    assert.equal(inst.files.length, 0);
    inst.destroy();
});

test('fileupload image previews use object URLs that are revoked', () => {
    const env = load('chillfileupload');
    const created = [], revoked = [];
    env.window.URL.createObjectURL = f => { const u = 'blob:' + created.length; created.push(u); return u; };
    env.window.URL.revokeObjectURL = u => revoked.push(u);
    const host = env.document.createElement('div'); host.id = 'h'; env.document.body.appendChild(host);
    const inst = env.lib.init('#h', {});
    inst.addFiles([file(env.window, 'a.png', 5, 'image/png'), file(env.window, 'b.png', 5, 'image/png'), file(env.window, 'c.txt', 5, 'text/plain')]);
    assert.equal(created.length, 2);
    assert.equal(env.document.querySelectorAll('.chillfileupload-thumb').length, 2);
    inst.removeFile(inst.files[0].id);
    assert.deepEqual(revoked, ['blob:0']);
    inst.destroy();
    assert.deepEqual(revoked.sort(), ['blob:0', 'blob:1']);
});

test('fileupload setProgress updates bar and aria; accepts File ref', () => {
    const { inst, window } = setup({});
    const f = file(window, 'a.txt', 1, 'text/plain');
    inst.addFiles([f]);
    inst.setProgress(f, 42);
    const pr = inst.container.querySelector('[role=progressbar]');
    assert.equal(pr.getAttribute('aria-valuenow'), '42');
    assert.equal(inst.container.querySelector('.chillfileupload-file-progress-bar').style.width, '42%');
    inst.updateProgress(inst.files[0].id, 500);
    assert.equal(pr.getAttribute('aria-valuenow'), '100');
    inst.destroy();
});

test('fileupload upload hook reports progress, success and errors', async () => {
    const results = [], errors = [];
    const { inst, window } = setup({
        upload: async (f, { onProgress }) => { onProgress(50); if (f.name === 'bad.txt') throw new Error('nope'); return 'ok-' + f.name; },
        onUpload: (f, r) => results.push(r),
        onError: (f, e) => errors.push(e.message)
    });
    inst.addFiles([file(window, 'good.txt', 1, 'text/plain'), file(window, 'bad.txt', 1, 'text/plain')]);
    await new Promise(r => setTimeout(r, 10));
    assert.deepEqual(results, ['ok-good.txt']);
    assert.deepEqual(errors, ['nope']);
    const statuses = inst.container.querySelectorAll('.chillfileupload-file-status');
    assert.equal(statuses[0].textContent, 'Done');
    assert.equal(statuses[1].textContent, 'nope');
    inst.destroy();
});

test('fileupload destroy removes listeners/DOM and restores host', () => {
    const { inst, document, host } = setup({});
    assert.equal(host.parentNode, null);
    inst.destroy();
    assert.equal(document.querySelector('.chillfileupload'), null);
    assert.equal(host.parentNode, document.body);
    inst.destroy(); // idempotent
});

test('fileupload single mode keeps only latest file; css dark override', () => {
    const { inst, window, document } = setup({ multiple: false });
    inst.addFiles([file(window, 'a.txt', 1, 'text/plain')]);
    inst.addFiles([file(window, 'b.txt', 1, 'text/plain')]);
    assert.deepEqual(Array.from(inst.files.map(f => f.name)), ['b.txt']);
    const css = document.getElementById('chillfileupload-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    inst.destroy();
});
