import type { Guide } from '../types';

const guide: Guide = {
    id: 'recipe-file-upload',
    title: 'Recipe: file upload with progress',
    summary: 'A ChillFileUpload drop zone with validation, previews and an upload callback with onProgress, plus ChillProgress and ChillNotify feedback.',
    group: 'Recipes',
    body: `**Goal:** a drag-and-drop uploader that only accepts images and PDFs under a size limit, shows thumbnails, uploads each file with a live progress bar, reports success and failure per file, lets users cancel by removing a file, and summarises the batch in a toast.

**You will use:** [ChillFileUpload](/docs/fileupload), [ChillProgress](/docs/progress) and [ChillNotify](/docs/notify).

## How the pieces fit

- \`ChillFileUpload.init(target, options)\` turns an element into a keyboard-operable drop zone with a file list. It validates every incoming file (by \`accept\`, \`maxSize\`, \`maxFiles\`), shows thumbnails, and runs your \`upload\` hook.
- Your \`upload(file, { onProgress, signal })\` function returns a Promise. Call \`onProgress(percent)\` as bytes go out. Resolve with the server result, or reject with an \`Error\` whose message is shown next to the file. Removing a file aborts its \`signal\`.
- Callbacks tell your page what happened: \`onSelect\`, \`onReject\`, \`onProgress\`, \`onUpload\`, \`onError\`, \`onChange\`.
- \`ChillProgress\` shows an overall bar or ring, and \`ChillNotify\` reports outcomes.

## Step 1: write the upload function

In production, use \`XMLHttpRequest\` because \`fetch\` cannot report upload progress yet:

\`\`\`js
function sendWithProgress(file, { onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload failed (' + xhr.status + ')')));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.onabort = () => reject(new Error('Cancelled'));
    signal.addEventListener('abort', () => xhr.abort());
    const body = new FormData();
    body.append('file', file);
    xhr.send(body);
  });
}
\`\`\`

The demos below use a fake uploader with the same shape: it counts up in steps, fails for files whose name contains \`fail\`, and stops when the signal aborts.

## Step 2: configure the drop zone

\`\`\`js
const uploader = ChillFileUpload.init(dropEl, {
  accept: 'image/*,.pdf',        // enforced for dropped files too, not just a hint
  maxSize: 2 * 1024 * 1024,      // bytes per file
  maxFiles: 5,
  hint: 'Images or PDF, up to 2 MB each',
  previews: true,                // image thumbnails (object URLs are revoked for you)
  upload: sendWithProgress,
  onReject: (file, reason, message) => ChillNotify.warning({ message }),
  onUpload: (file, result) => { /* save result.url */ },
  onError: (file, err) => { /* file stays in the list with the error text */ }
});
\`\`\`

\`reason\` is \`'type'\`, \`'size'\` or \`'count'\`. The built-in messages are shown under the drop zone; pass \`messages: { size, type, count }\` (strings or functions) to translate them. With an \`upload\` hook, files start uploading as soon as they are accepted (\`autoUpload\` is true by default).

## Step 3: automatic uploads with an overall progress bar

Click **Add sample files** (or drop your own files on the zone). Two valid files upload, \`fail-me.pdf\` fails at 60%, an \`.exe\` is rejected by type and a 5 MB PDF by size. Remove a file while it uploads to see the cancel path. When every file in the batch has finished, one toast summarises it.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:12px;max-width:520px';
let alive = true;
const timers = new Set();

// fake uploader: same contract as a real one
const fakeUpload = (file, { onProgress, signal }) => new Promise((resolve, reject) => {
  const failAt = /fail/i.test(file.name) ? 60 : Infinity;
  let pct = 0;
  const tick = setInterval(() => {
    pct += 8 + Math.random() * 14;
    if (pct >= failAt) { clearInterval(tick); timers.delete(tick); reject(new Error('Server rejected the file')); return; }
    if (pct >= 100) { clearInterval(tick); timers.delete(tick); onProgress(100); resolve({ url: '/files/' + encodeURIComponent(file.name) }); return; }
    onProgress(Math.round(pct));
  }, 160);
  timers.add(tick);
  if (signal) signal.addEventListener('abort', () => { clearInterval(tick); timers.delete(tick); reject(new Error('Cancelled')); });
});

const dropHost = document.createElement('div');
const overallHost = document.createElement('div');
const buttons = document.createElement('div');
buttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(dropHost, overallHost, buttons);

const overall = ChillProgress.init(overallHost, { value: 0, label: 'Overall progress', color: 'primary' });

// batch bookkeeping for the overall bar and the summary toast
let batch = new Map();   // file id/name -> percent
let finished = 0, failed = 0;
const refreshOverall = () => {
  const total = batch.size;
  const sum = [...batch.values()].reduce((a, b) => a + b, 0);
  overall.setValue(total ? Math.round(sum / total) : 0);
};
const settle = () => {
  finished++;
  if (batch.size && finished >= batch.size) {
    const ok = batch.size - failed;
    (failed ? ChillNotify.warning : ChillNotify.success)({ title: 'Upload finished', message: ok + ' uploaded, ' + failed + ' failed', duration: 4000 });
    batch = new Map(); finished = 0; failed = 0;
  }
};

const uploader = ChillFileUpload.init(dropHost, {
  accept: 'image/*,.pdf',
  maxSize: 2 * 1024 * 1024,
  maxFiles: 5,
  hint: 'Images or PDF, up to 2 MB each',
  upload: fakeUpload,
  onSelect: (files) => { files.forEach((f) => batch.set(f.name, 0)); refreshOverall(); },
  onProgress: (file, pct) => { batch.set(file.name, pct); refreshOverall(); },
  onUpload: (file, res) => { batch.set(file.name, 100); refreshOverall(); settle(); },
  onError: (file, err) => { failed++; batch.set(file.name, 100); refreshOverall(); settle(); ChillNotify.error({ title: file.name, message: err.message, duration: 4000 }); },
  onReject: (file, reason, message) => ChillNotify.warning({ message, duration: 3500 })
});

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#3b82f6"/><circle cx="60" cy="40" r="22" fill="#fff"/></svg>';
const sample = () => [
  new window.File([svg], 'logo.svg', { type: 'image/svg+xml' }),
  new window.File(['x'.repeat(300000)], 'report.pdf', { type: 'application/pdf' }),
  new window.File(['x'.repeat(100000)], 'fail-me.pdf', { type: 'application/pdf' }),
  new window.File(['MZ'], 'setup.exe', { type: 'application/x-msdownload' }),
  new window.File([new Uint8Array(5 * 1024 * 1024)], 'huge.pdf', { type: 'application/pdf' })
];
const addBtn = ChillButton.create({ text: 'Add sample files', onClick: () => uploader.addFiles(sample()) });
const clearBtn = ChillButton.create({ text: 'Clear list', variant: 'outline', onClick: () => { uploader.clear(); batch = new Map(); finished = 0; failed = 0; refreshOverall(); } });
buttons.append(addBtn, clearBtn);

cleanup(() => {
  alive = false;
  timers.forEach((t) => clearInterval(t));
  uploader.destroy(); overall.destroy(); addBtn.destroy(); clearBtn.destroy();
  ChillNotify.closeAll();
});
\`\`\`

Things worth noticing in the code:

- \`onSelect\` receives only **accepted** files, so rejected ones never enter the progress maths.
- Per-file bars are built in; the extra \`ChillProgress\` is an overall bar you drive with \`setValue()\`.
- A failed file stays in the list with its error message. The user can remove it and add it again.

## Step 4: review first, then upload

Sometimes users should confirm before anything is sent. Set \`autoUpload: false\`, enable your own button when the list is not empty (\`onChange\` receives the current files), and call \`uploadAll()\`. The ring shows the average progress.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:12px;max-width:520px';
const timers = new Set();
const fakeUpload = (file, { onProgress, signal }) => new Promise((resolve, reject) => {
  let pct = 0;
  const tick = setInterval(() => {
    pct += 12 + Math.random() * 12;
    if (pct >= 100) { clearInterval(tick); timers.delete(tick); onProgress(100); resolve({ ok: true }); return; }
    onProgress(Math.round(pct));
  }, 140);
  timers.add(tick);
  if (signal) signal.addEventListener('abort', () => { clearInterval(tick); timers.delete(tick); reject(new Error('Cancelled')); });
});

const dropHost = document.createElement('div');
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:12px;align-items:center';
const ringHost = document.createElement('div');
const send = ChillButton.create({ text: 'Upload files', disabled: true });
row.append(ringHost, send);
root.append(dropHost, row);

const ring = ChillProgress.init(ringHost, { variant: 'circle', value: 0, size: 'sm', ariaLabel: 'Upload progress' });
const percents = new Map();
const updateRing = () => {
  const vals = [...percents.values()];
  ring.setValue(vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0);
};

const uploader = ChillFileUpload.init(dropHost, {
  accept: '.csv,.xlsx',
  maxFiles: 3,
  hint: 'CSV or XLSX, up to 3 files',
  upload: fakeUpload,
  autoUpload: false,
  onChange: (files) => { send.setDisabled(files.length === 0); },
  onProgress: (file, pct) => { percents.set(file.name, pct); updateRing(); }
});

send.addEventListener('click', async () => {
  send.setLoading(true, 'Uploading...');
  await uploader.uploadAll();
  ChillNotify.success({ message: 'Upload finished', duration: 3000 });
  send.setLoading(false);
});

cleanup(() => { timers.forEach((t) => clearInterval(t)); uploader.destroy(); ring.destroy(); send.destroy(); ChillNotify.closeAll(); });
\`\`\`

Drop two or three \`.csv\` files on the zone (any file you have, renamed), then press **Upload files**.

> **Tip:** \`previews: false\` skips thumbnails (useful for large PDFs lists). Thumbnails use \`URL.createObjectURL\`, and the URLs are revoked on remove, \`clear()\` and \`destroy()\`, so there is nothing to clean up yourself.

## Server and security checklist

- **Re-validate on the server.** \`accept\` and \`maxSize\` improve the experience, they do not protect you. Check type, size and content again, and never trust the filename.
- **File names are text.** ChillFileUpload escapes names and messages, so a file called \`<img onerror=...>.png\` cannot inject markup. Keep it that way in your own list renderings (use \`textContent\`).
- **Large files.** Consider chunked or pre-signed uploads; the \`upload\` hook can implement either, because it only has to report progress.
- **Accessibility.** The drop zone is a focusable button (Enter or Space opens the file dialog), changes are announced through a polite live region, and each file row has a labelled remove button.

## Result

A validated, cancellable, accessible uploader with per-file and overall progress, and clear feedback for every outcome. The same wiring works with any backend: only the body of \`upload()\` changes.

## Next steps

- [File upload reference](/docs/fileupload) for \`messages\`, \`setStatus()\` and the full option list
- [Progress reference](/docs/progress) for bars, rings, steps and the indeterminate mode
- [Notify reference](/docs/notify) for stacking, actions and positions
`,
};

export default guide;
