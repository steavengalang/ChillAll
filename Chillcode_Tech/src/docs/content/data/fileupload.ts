import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'fileupload',
    global: 'ChillFileUpload',
    category: 'data',
    title: 'File Upload',
    summary: 'Drag-and-drop file picker with validation, image previews, progress bars and an upload hook.',
    style: 'create',
    description:
        'ChillFileUpload is a keyboard-accessible drop zone with a file list. It validates every file against `accept`, `maxSize` and `maxFiles` (rejections are reported, not silently dropped), shows image thumbnails and per-file progress, and lets users remove files before sending.\n\n' +
        'It does not know your backend: either read the chosen files with `getFiles()` / `onChange` and send them yourself, or provide an `upload(file, { onProgress, signal })` hook that returns a Promise and the component drives progress, status and errors. ' +
        'Use `ChillFileUpload.create(options)` for a detached instance (append `instance.container`) or `init(target, options)` to replace an element. Texts are escaped unless `html: true`.',
    features: [
        'Click, keyboard (Enter / Space) or drag-and-drop selection',
        '`accept` is enforced for extensions, `type/*` wildcards and exact MIME types, plus size and count limits',
        'Image thumbnails via object URLs that are revoked on remove, clear and destroy',
        'Optional `upload` hook with progress, status, abort signal, auto or manual start',
        'Accessible: alert region for rejections, status announcements and labelled remove buttons',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic drop zone',
            description: 'Limit file types and size. Rejected files are reported in an alert region and through `onReject(file, reason, message)`.',
            height: 260,
            code: `const up = ChillFileUpload.create({
  accept: 'image/*,.pdf',
  maxSize: 5 * 1024 * 1024,
  maxFiles: 4,
  hint: 'PNG, JPG or PDF, up to 5 MB each',
  onChange: (files) => { out.textContent = files.length + ' file(s) selected'; },
});
const out = document.createElement('p');
out.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text)';
out.textContent = '0 file(s) selected';
root.append(up.container, out);
cleanup(() => up.destroy());`,
        },
        {
            id: 'upload-hook',
            title: 'Upload hook with progress',
            description: 'Provide `upload(file, { onProgress, signal })`. With a hook, files upload automatically; `onUpload` and `onError` report the result. Here a demo file is added and a fake upload runs.',
            height: 300,
            code: `const up = ChillFileUpload.create({
  text: 'Drop your report here',
  upload: (file, { onProgress, signal }) => new Promise((resolve, reject) => {
    let pct = 0;
    const timer = setInterval(() => {
      pct += 20;
      onProgress(pct);                          // updates the progress bar
      if (pct >= 100) { clearInterval(timer); resolve({ url: '/files/' + file.name }); }
    }, 300);
    if (signal) signal.addEventListener('abort', () => { clearInterval(timer); reject(new Error('Cancelled')); });
  }),
  onUpload: (file, result) => { log.textContent = 'Uploaded ' + file.name + ' -> ' + result.url; },
});
const log = document.createElement('p');
log.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text)';
root.append(up.container, log);
up.addFiles([new window.File(['quarterly numbers'], 'report-q3.txt', { type: 'text/plain' })]);
cleanup(() => up.destroy());`,
        },
        {
            id: 'manual-upload',
            title: 'Manual upload and removal',
            description: 'Set `autoUpload: false` to let users review files first, then call `uploadAll()`. It uploads pending and failed files; removing a file cancels its request.',
            height: 340,
            code: `const up = ChillFileUpload.create({
  autoUpload: false,
  hint: 'Add files, then press Upload',
  upload: (file, { onProgress }) => new Promise((resolve, reject) => {
    let pct = 0;
    const t = setInterval(() => {
      pct += 25; onProgress(pct);
      if (pct >= 100) { clearInterval(t); file.name.includes('bad') ? reject(new Error('Server said no')) : resolve('ok'); }
    }, 250);
  }),
});
up.addFiles([new window.File(['a'], 'photo.txt'), new window.File(['b'], 'bad-file.txt')]);
const btn = ChillButton.create({ text: 'Upload all', size: 'sm' });
btn.style.marginTop = '12px';
btn.onclick = () => up.uploadAll();
root.append(up.container, btn);
cleanup(() => up.destroy());`,
        },
        {
            id: 'single',
            title: 'Single file and custom messages',
            description: '`multiple: false` keeps only the latest file. Override reject texts with `messages` (strings or functions) and rename the labels.',
            height: 260,
            code: `const up = ChillFileUpload.create({
  multiple: false,
  accept: '.csv',
  maxSize: 1024 * 1024,
  text: 'Drop a CSV file',
  browseText: 'choose one',
  removeLabel: 'Discard',
  messages: {
    type: (file) => file.name + ' is not a CSV file.',
    size: 'That file is larger than 1 MB.',
  },
});
root.append(up.container);
up.addFiles([new window.File(['id,name'], 'contacts.csv', { type: 'text/csv' })]);
cleanup(() => up.destroy());`,
        },
        {
            id: 'helpers',
            title: 'Validation helpers',
            description: '`ChillFileUpload.matchesAccept(file, accept)` and `formatSize(bytes)` are exposed for your own checks and labels.',
            code: `const f = new window.File(['x'.repeat(2048)], 'logo.PNG', { type: 'image/png' });
const rows = [
  ['matchesAccept(f, "image/*")', ChillFileUpload.matchesAccept(f, 'image/*')],
  ['matchesAccept(f, ".png")', ChillFileUpload.matchesAccept(f, '.png')],
  ['matchesAccept(f, ".pdf,.doc")', ChillFileUpload.matchesAccept(f, '.pdf,.doc')],
  ['formatSize(f.size)', ChillFileUpload.formatSize(f.size)],
  ['formatSize(5 * 1024 * 1024)', ChillFileUpload.formatSize(5 * 1024 * 1024)],
];
const pre = document.createElement('pre');
pre.style.cssText = 'margin:0;font-size:13px;color:var(--chill-text)';
pre.textContent = rows.map(([k, v]) => k + ' -> ' + v).join('\\n');
root.append(pre);`,
        },
    ],
    guides: [
        {
            title: 'Validation and rejections',
            body:
                'Each incoming file is checked in this order: `accept` (reason `"type"`), `maxSize` (`"size"`) and the running total against `maxFiles` (`"count"`). ' +
                'Accepted files are added; rejected ones trigger `onReject(file, reason, message)`, and all messages are shown together in an alert region under the drop zone (replacing the previous ones).\n\n' +
                '`accept` follows the HTML attribute: `.pdf` (extension, case-insensitive), `image/*` (wildcard) and `image/png` (exact). It is enforced for dropped files too, not only as a hint for the file dialog. ' +
                'Use `messages: { size, type, count }` with strings or `(file, options) => string` to localise the text.',
        },
        {
            title: 'Uploading',
            body:
                'The `upload(file, { onProgress, signal })` hook must return a Promise. While it runs the file shows "Uploading" and the progress bar follows `onProgress(percent)`; on resolve it shows "Done" and `onUpload(file, result)` fires, on reject the status shows the error message and `onError(file, error)` fires. ' +
                'With a hook, `autoUpload` is true by default; set it to `false` and call `uploadAll()` yourself. Removing a file aborts its `signal`.\n\n' +
                '```js\nChillFileUpload.init("#drop", {\n  upload: (file, { onProgress, signal }) => sendWithProgress(file, onProgress, signal),\n  onUpload: (file, res) => console.log(res),\n});\n```\n\n' +
                'Without a hook, collect files with `getFiles()` (an array of `File`) and post them in a `FormData` yourself. You can also drive the UI directly with `setProgress(fileOrId, pct)` and `setStatus(fileOrId, status, message)`.',
        },
        {
            title: 'Previews and cleanup',
            body:
                'Image files get a thumbnail created with `URL.createObjectURL`; the object URL is revoked when the file is removed, on `clear()` and on `destroy()`. Turn it off with `previews: false`. ' +
                'Selecting the same file twice works because the underlying `<input>` is reset after every selection.',
        },
    ],
    options: [
        { name: 'accept', type: 'string', default: "'*'", description: 'Comma-separated list: `.pdf`, `image/*`, `image/png`. Enforced on selection and drop.' },
        { name: 'multiple', type: 'boolean', default: 'true', description: 'Allow several files. When false, a new selection replaces the current file.' },
        { name: 'maxSize', type: 'number', default: '10485760', description: 'Maximum size per file in bytes (10 MB). `0` disables the check.' },
        { name: 'maxFiles', type: 'number', default: '10', description: 'Maximum number of files kept.' },
        { name: 'text', type: 'string', default: "'Drag and drop files here'", description: 'Main drop zone text (escaped unless `html`).' },
        { name: 'hint', type: 'string', default: "''", description: 'Secondary line, linked to the zone with `aria-describedby`.' },
        { name: 'browseText', type: 'string', default: "'browse'", description: 'Label of the clickable "browse" part.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat `text` and `hint` as HTML (trusted markup only).' },
        { name: 'previews', type: 'boolean', default: 'true', description: 'Show image thumbnails.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the drop zone.' },
        { name: 'removeLabel', type: 'string', default: "'Remove'", description: 'Prefix of the remove button `aria-label`.' },
        { name: 'messages', type: '{ size?, type?, count? }', default: 'undefined', description: 'Override rejection messages with strings or `(file, options) => string`.' },
        { name: 'upload', type: '(file: File, ctx: { onProgress(pct), signal }) => Promise', default: 'undefined', description: 'Upload hook; drives progress and status.' },
        { name: 'autoUpload', type: 'boolean', default: 'true when `upload` is set', description: 'Start uploading as soon as files are accepted.' },
        { name: 'onSelect', type: '(accepted: FileData[]) => void', default: 'undefined', description: 'Files were accepted.' },
        { name: 'onReject', type: "(file: File, reason: 'size' | 'type' | 'count', message: string) => void", default: 'undefined', description: 'A file was rejected.' },
        { name: 'onRemove', type: '(id: number, file: File) => void', default: 'undefined', description: 'A file was removed.' },
        { name: 'onChange', type: '(files: File[]) => void', default: 'undefined', description: 'The file list changed.' },
        { name: 'onProgress', type: '(file: File, pct: number) => void', default: 'undefined', description: 'Progress of an upload changed.' },
        { name: 'onUpload', type: '(file: File, result: any) => void', default: 'undefined', description: 'An upload finished successfully.' },
        { name: 'onError', type: '(file: File, error: Error) => void', default: 'undefined', description: 'An upload failed.' },
    ],
    methods: [
        { signature: 'ChillFileUpload.create(options)', on: 'static', description: 'Create a detached instance; append `instance.container`.' },
        { signature: 'ChillFileUpload.init(target, options)', on: 'static', description: 'Replace an element (selector or node) with the upload component.' },
        { signature: 'ChillFileUpload.matchesAccept(file, accept)', on: 'static', description: 'Check a `File` (name and type) against an accept string.' },
        { signature: 'ChillFileUpload.formatSize(bytes)', on: 'static', description: 'Human-readable size such as `"1.5 MB"`.' },
        { signature: 'ChillFileUpload.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.container / dropzone / input', description: 'The root element, the drop zone and the hidden file input.' },
        { signature: 'instance.getFiles()', description: 'Array of the accepted `File` objects.' },
        { signature: 'instance.addFiles(fileList)', description: 'Add files programmatically (same validation as user selection). Returns the accepted file records.' },
        { signature: 'instance.removeFile(idOrFile)', description: 'Remove a file; returns `true` if found.' },
        { signature: 'instance.clear()', description: 'Remove all files.' },
        { signature: 'instance.setProgress(fileOrId, pct)', description: 'Set a file\'s progress bar (0-100).' },
        { signature: 'instance.setStatus(fileOrId, status, message?)', description: 'Set a status label (class `pending`, `uploading`, `success`, `error`, ...).' },
        { signature: 'instance.uploadAll()', description: 'Upload every pending or failed file; returns a Promise.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `select`, `reject`, `remove`, `change`, `progress`, `upload` or `error`. Returns the instance.' },
        { signature: 'instance.destroy()', description: 'Revoke previews, remove listeners and the element.' },
    ],
    events: [
        { name: 'select', payload: '(accepted)', description: 'Files were accepted.' },
        { name: 'reject', payload: '(file, reason, message)', description: 'A file failed validation.' },
        { name: 'remove', payload: '(id, file)', description: 'A file was removed.' },
        { name: 'change', payload: '(files)', description: 'The list changed.' },
        { name: 'progress', payload: '(file, pct)', description: 'Upload progress changed.' },
        { name: 'upload', payload: '(file, result)', description: 'Upload succeeded.' },
        { name: 'error', payload: '(file, error)', description: 'Upload failed.' },
    ],
    cssVars: [
        { name: '--chillfileupload-active', description: 'Accent colour for drag-over, browse link and progress.' },
        { name: '--chillfileupload-border / --chillfileupload-bg', description: 'Drop zone border and surface.' },
        { name: '--chillfileupload-text / --chillfileupload-text-muted', description: 'Primary and hint text.' },
        { name: '--chillfileupload-error / --chillfileupload-success', description: 'Status colours.' },
        { name: '--chillfileupload-hover', description: 'Hover background.' },
    ],
    a11y: [
        'The drop zone is a focusable `role="button"` with an `aria-label` and `aria-describedby` for the hint; Enter and Space open the file dialog.',
        'Rejections appear in a `role="alert"` region; additions and removals are announced in a polite status region.',
        'Each file has a `role="progressbar"` and a remove button labelled "Remove <name>"; after removal focus returns to the drop zone.',
    ],
    tips: [
        '`accept` and `maxSize` are client-side checks only: always validate again on the server.',
        'Remove handlers receive the internal numeric `id`; use `getFiles()` when you only need the `File` objects.',
        'The file input is reset after every selection, so choosing the same file again fires a change.',
    ],
    related: ['dragdrop', 'progress', 'button'],
    keywords: ['upload', 'dropzone', 'files', 'attachment', 'image preview', 'input file'],
};

export default doc;
