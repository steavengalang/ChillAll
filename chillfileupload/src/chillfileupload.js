/**
 * ChillFileUpload - Zero-dependency File Upload Component
 *
 * Usage:
 *   const up = ChillFileUpload.init('#drop', {
 *       accept: 'image/*,.pdf', maxSize: 5 * 1024 * 1024, maxFiles: 5,
 *       onReject: (file, reason, message) => console.warn(message),
 *       upload: (file, { onProgress, signal }) => fetch(...)   // optional hook, returns a Promise
 *   });
 *
 * Options:
 *   accept        string    '*'     comma separated list: '.pdf', 'image/*', 'image/png' (enforced, not just a hint)
 *   multiple      boolean   true
 *   maxSize       number    10 MB   bytes per file
 *   maxFiles      number    10      total files kept
 *   text, hint, browseText          strings (escaped; use `html: true` to treat text/hint as trusted HTML)
 *   html          boolean   false
 *   previews      boolean   true    image thumbnails via URL.createObjectURL (revoked on remove / clear / destroy)
 *   disabled      boolean   false
 *   upload        function(file, { onProgress(pct), signal }) -> Promise   upload hook
 *   autoUpload    boolean   true when `upload` is set
 *   onSelect(acceptedFiles)  onReject(file, reason 'size'|'type'|'count', message)  onRemove(id)
 *   onUpload(file, result)   onError(file, error)  onProgress(file, pct)  onChange(files)
 *   removeLabel   string    'Remove'
 *   messages      { size, type, count } functions/strings overriding reject messages
 * Instance: files, getFiles(), addFiles(list), removeFile(id|File), clear(), setProgress(fileOrId, pct),
 *   updateProgress (alias), setStatus(fileOrId, status, message), uploadAll(), on(event, fn), destroy().
 * Static: ChillFileUpload.init, .create(options) (detached; append instance.container), .matchesAccept, .formatSize
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillfileupload_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chillfileupload-styles')) return;
        const style = document.createElement('style');
        style.id = 'chillfileupload-styles';
        style.textContent = `
      :root {
        --chillfileupload-bg: #ffffff;
        --chillfileupload-text: #171717;
        --chillfileupload-text-muted: #6b7280;
        --chillfileupload-border: #e5e5e5;
        --chillfileupload-active: #3b82f6;
        --chillfileupload-hover: #f5f5f5;
        --chillfileupload-error: #ef4444;
        --chillfileupload-success: #22c55e;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillfileupload-bg: #262626;
          --chillfileupload-text: #fafafa;
          --chillfileupload-text-muted: #a3a3a3;
          --chillfileupload-border: #404040;
          --chillfileupload-hover: #374151;
          --chillfileupload-active: #60a5fa;
          --chillfileupload-error: #f87171;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillfileupload-bg: #262626;
        --chillfileupload-text: #fafafa;
        --chillfileupload-text-muted: #a3a3a3;
        --chillfileupload-border: #404040;
        --chillfileupload-hover: #374151;
        --chillfileupload-active: #60a5fa;
        --chillfileupload-error: #f87171;
      }
      .chillfileupload {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .chillfileupload-dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px 24px;
        background: var(--chillfileupload-bg);
        border: 2px dashed var(--chillfileupload-border);
        border-radius: 12px;
        cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease;
        text-align: center;
      }
      .chillfileupload-dropzone:hover, .chillfileupload-dropzone.dragover {
        border-color: var(--chillfileupload-active);
        background: var(--chillfileupload-hover);
      }
      .chillfileupload-dropzone:focus-visible,
      .chillfileupload-file-remove:focus-visible {
        outline: 2px solid var(--chillfileupload-active);
        outline-offset: 2px;
      }
      .chillfileupload-disabled .chillfileupload-dropzone { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
      .chillfileupload-icon { width: 48px; height: 48px; color: var(--chillfileupload-text-muted); }
      .chillfileupload-text { margin: 0; font-size: 14px; color: var(--chillfileupload-text); }
      .chillfileupload-hint { margin: 0; font-size: 13px; color: var(--chillfileupload-text-muted); }
      .chillfileupload-browse { color: var(--chillfileupload-active); font-weight: 500; cursor: pointer; }
      .chillfileupload-input { display: none; }
      .chillfileupload-errors { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--chillfileupload-error); }
      .chillfileupload-errors:empty { display: none; }
      .chillfileupload-sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
        clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }
      .chillfileupload-files { display: flex; flex-direction: column; gap: 8px; }
      .chillfileupload-file {
        display: flex; align-items: center; gap: 12px; padding: 12px 16px;
        background: var(--chillfileupload-bg); border: 1px solid var(--chillfileupload-border);
        border-radius: 8px;
      }
      .chillfileupload-file-icon { width: 32px; height: 32px; color: var(--chillfileupload-text-muted); flex-shrink: 0; }
      .chillfileupload-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
      .chillfileupload-file-info { flex: 1; min-width: 0; }
      .chillfileupload-file-name { font-size: 14px; color: var(--chillfileupload-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chillfileupload-file-size { font-size: 12px; color: var(--chillfileupload-text-muted); }
      .chillfileupload-file-progress { width: 100%; height: 4px; background: var(--chillfileupload-border); border-radius: 2px; margin-top: 6px; overflow: hidden; }
      .chillfileupload-file-progress-bar { height: 100%; background: var(--chillfileupload-active); transition: width 0.3s ease; }
      .chillfileupload-file-remove { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; min-height: 32px; padding: 6px; background: none; border: none; cursor: pointer; color: var(--chillfileupload-text-muted); border-radius: 4px; }
      .chillfileupload-file-remove:hover { background: var(--chillfileupload-hover); color: var(--chillfileupload-error); }
      .chillfileupload-file-remove svg { width: 16px; height: 16px; }
      .chillfileupload-file-status { font-size: 12px; }
      .chillfileupload-file-status.success { color: var(--chillfileupload-success); }
      .chillfileupload-file-status.error { color: var(--chillfileupload-error); }
      @media (prefers-reduced-motion: reduce) {
        .chillfileupload-dropzone, .chillfileupload-file-progress-bar { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function formatSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /** Does a File (name/type) satisfy an `accept` string such as 'image/*,.pdf'? */
    function matchesAccept(file, accept) {
        if (!accept || accept === '*' || accept === '*/*') return true;
        const name = String(file.name || '').toLowerCase();
        const type = String(file.type || '').toLowerCase();
        return String(accept).split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean).some(function (tok) {
            if (tok === '*' || tok === '*/*') return true;
            if (tok.charAt(0) === '.') return name.length >= tok.length && name.slice(-tok.length) === tok;
            if (tok.slice(-2) === '/*') return type.indexOf(tok.slice(0, -1)) === 0;
            return type === tok;
        });
    }

    let seq = 0;
    const ICON_UPLOAD = '<svg class="chillfileupload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>';
    const ICON_FILE = '<svg class="chillfileupload-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>';
    const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M18 6L6 18M6 6l12 12"/></svg>';

    function pick(options, key, dflt) { return options[key] === undefined || options[key] === null ? dflt : options[key]; }

    class ChillFileUploadInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;
            this.options = Object.assign({}, options, {
                accept: pick(options, 'accept', '*'),
                multiple: options.multiple !== false,
                maxSize: pick(options, 'maxSize', 10 * 1024 * 1024),
                maxFiles: pick(options, 'maxFiles', 10),
                text: pick(options, 'text', 'Drag and drop files here'),
                hint: pick(options, 'hint', ''),
                browseText: pick(options, 'browseText', 'browse'),
                previews: options.previews !== false,
                removeLabel: pick(options, 'removeLabel', 'Remove')
            });
            if (this.options.autoUpload === undefined) this.options.autoUpload = typeof this.options.upload === 'function';
            this.files = [];
            this._cleanups = [];
            this._listeners = {};
            this._destroyed = false;
            this.init();
        }
        _listen(el, ev, fn) { el.addEventListener(ev, fn); this._cleanups.push(() => el.removeEventListener(ev, fn)); }
        on(event, fn) { (this._listeners[event] = this._listeners[event] || []).push(fn); return this; }
        _emit(event, a, b, c) {
            const cb = this.options['on' + event.charAt(0).toUpperCase() + event.slice(1)];
            if (typeof cb === 'function') cb(a, b, c);
            (this._listeners[event] || []).slice().forEach(fn => fn(a, b, c));
        }
        init() { injectCSS(); this.render(); this.bindEvents(); }
        _setText(el, text, asHtml) { if (asHtml && this.options.html) el.innerHTML = text; else el.textContent = text; }
        render() {
            const o = this.options;
            const container = document.createElement('div');
            container.className = 'chillfileupload' + (o.disabled ? ' chillfileupload-disabled' : '');
            const dz = document.createElement('div');
            dz.className = 'chillfileupload-dropzone';
            dz.setAttribute('role', 'button');
            dz.tabIndex = o.disabled ? -1 : 0;
            if (o.disabled) dz.setAttribute('aria-disabled', 'true');
            dz.innerHTML = ICON_UPLOAD;
            const p = document.createElement('p');
            p.className = 'chillfileupload-text';
            const lead = document.createElement('span');
            this._setText(lead, o.text, true);
            const browse = document.createElement('span');
            browse.className = 'chillfileupload-browse';
            browse.textContent = o.browseText;
            p.appendChild(lead); p.appendChild(document.createTextNode(' or ')); p.appendChild(browse);
            dz.appendChild(p);
            if (o.hint) {
                const h = document.createElement('p');
                h.className = 'chillfileupload-hint';
                h.id = 'chillfileupload-hint-' + (++seq);
                this._setText(h, o.hint, true);
                dz.appendChild(h);
                dz.setAttribute('aria-describedby', h.id);
            }
            dz.setAttribute('aria-label', (lead.textContent + ' or ' + o.browseText).trim());
            const input = document.createElement('input');
            input.type = 'file';
            input.className = 'chillfileupload-input';
            input.tabIndex = -1;
            input.setAttribute('aria-hidden', 'true');
            if (o.multiple) input.multiple = true;
            if (o.accept && o.accept !== '*') input.setAttribute('accept', o.accept);
            dz.appendChild(input);
            const errors = document.createElement('div');
            errors.className = 'chillfileupload-errors';
            errors.setAttribute('role', 'alert');
            const status = document.createElement('div');
            status.className = 'chillfileupload-sr';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            const list = document.createElement('div');
            list.className = 'chillfileupload-files';
            list.setAttribute('role', 'list');
            container.appendChild(dz); container.appendChild(errors); container.appendChild(status); container.appendChild(list);
            if (this.element && this.element.parentNode) this.element.parentNode.replaceChild(container, this.element);
            this.container = container; this.dropzone = dz; this.input = input;
            this.errorsEl = errors; this.statusEl = status; this.filesContainer = list;
        }
        bindEvents() {
            const dz = this.dropzone;
            let depth = 0;
            this._listen(dz, 'click', () => { if (!this.options.disabled) this.input.click(); });
            this._listen(this.input, 'click', e => e.stopPropagation());
            this._listen(dz, 'keydown', e => {
                if (e.target !== dz || this.options.disabled) return;
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); this.input.click(); }
            });
            this._listen(dz, 'dragenter', e => { e.preventDefault(); depth++; dz.classList.add('dragover'); });
            this._listen(dz, 'dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
            this._listen(dz, 'dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) dz.classList.remove('dragover'); });
            this._listen(dz, 'drop', e => {
                e.preventDefault(); depth = 0; dz.classList.remove('dragover');
                if (!this.options.disabled && e.dataTransfer) this.handleFiles(e.dataTransfer.files);
            });
            this._listen(this.input, 'change', e => this.handleFiles(e.target.files));
        }
        _msg(reason, file) {
            const m = this.options.messages && this.options.messages[reason];
            if (typeof m === 'function') return m(file, this.options);
            if (typeof m === 'string') return m;
            if (reason === 'size') return file.name + ' is too large (max ' + formatSize(this.options.maxSize) + ')';
            if (reason === 'type') return file.name + ' is not an accepted file type';
            return 'Too many files (max ' + this.options.maxFiles + ')';
        }
        handleFiles(fileList) { return this.addFiles(fileList); }
        addFiles(fileList) {
            const o = this.options;
            let incoming = Array.from(fileList || []);
            const accepted = [];
            const messages = [];
            const reject = (file, reason) => {
                const message = this._msg(reason, file);
                messages.push(message);
                this._emit('reject', file, reason, message);
            };
            if (!o.multiple && incoming.length) {
                incoming = incoming.slice(0, 1);
                this.clear(true);
            }
            incoming.forEach(file => {
                if (!matchesAccept(file, o.accept)) return reject(file, 'type');
                if (o.maxSize && file.size > o.maxSize) return reject(file, 'size');
                if (this.files.length + accepted.length >= o.maxFiles) return reject(file, 'count');
                accepted.push(file);
            });
            this.errorsEl.textContent = '';
            messages.forEach(m => { const d = document.createElement('div'); d.textContent = m; this.errorsEl.appendChild(d); });
            const added = accepted.map(file => {
                const fd = { file, name: file.name, size: file.size, progress: 0, status: 'pending', id: ++seq };
                this.files.push(fd);
                this.renderFile(fd);
                return fd;
            });
            if (accepted.length) {
                this.statusEl.textContent = accepted.length + (accepted.length === 1 ? ' file added' : ' files added');
                this._emit('select', accepted);
                this._emit('change', this.getFiles());
            } else if (messages.length) {
                this.statusEl.textContent = messages.join('. ');
            }
            if (this.input) this.input.value = '';
            if (o.autoUpload && typeof o.upload === 'function') added.forEach(fd => this._upload(fd));
            return accepted;
        }
        renderFile(fd) {
            const el = document.createElement('div');
            el.className = 'chillfileupload-file';
            el.dataset.id = fd.id;
            el.setAttribute('role', 'listitem');
            let thumb = null;
            if (this.options.previews && fd.file && /^image\//.test(fd.file.type || '') && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
                try {
                    fd.previewUrl = URL.createObjectURL(fd.file);
                    thumb = document.createElement('img');
                    thumb.className = 'chillfileupload-thumb';
                    thumb.alt = '';
                    thumb.setAttribute('src', fd.previewUrl);
                } catch (e) { fd.previewUrl = null; thumb = null; }
            }
            if (thumb) el.appendChild(thumb); else el.insertAdjacentHTML('beforeend', ICON_FILE);
            const info = document.createElement('div'); info.className = 'chillfileupload-file-info';
            const nm = document.createElement('div'); nm.className = 'chillfileupload-file-name'; nm.textContent = fd.name; nm.title = fd.name;
            const sz = document.createElement('div'); sz.className = 'chillfileupload-file-size'; sz.textContent = formatSize(fd.size);
            const pr = document.createElement('div'); pr.className = 'chillfileupload-file-progress';
            pr.setAttribute('role', 'progressbar'); pr.setAttribute('aria-label', 'Upload progress for ' + fd.name);
            pr.setAttribute('aria-valuemin', '0'); pr.setAttribute('aria-valuemax', '100'); pr.setAttribute('aria-valuenow', String(fd.progress));
            const bar = document.createElement('div'); bar.className = 'chillfileupload-file-progress-bar'; bar.style.width = fd.progress + '%';
            pr.appendChild(bar);
            info.appendChild(nm); info.appendChild(sz); info.appendChild(pr);
            const st = document.createElement('span'); st.className = 'chillfileupload-file-status';
            const rm = document.createElement('button'); rm.className = 'chillfileupload-file-remove'; rm.type = 'button';
            rm.setAttribute('aria-label', this.options.removeLabel + ' ' + fd.name);
            rm.innerHTML = ICON_X;
            el.appendChild(info); el.appendChild(st); el.appendChild(rm);
            const onRm = () => { this.removeFile(fd.id); this.dropzone.focus && this.dropzone.focus(); };
            rm.addEventListener('click', onRm);
            fd.el = el; fd.barEl = bar; fd.progressEl = pr; fd.statusElement = st;
            fd.cleanup = () => rm.removeEventListener('click', onRm);
            this.filesContainer.appendChild(el);
        }
        _find(ref) {
            if (ref && typeof ref === 'object' && ref.file) return this.files.indexOf(ref) > -1 ? ref : null;
            return this.files.find(f => f.id === ref || f.file === ref) || null;
        }
        _release(fd) {
            if (fd.abort) { try { fd.abort.abort(); } catch (e) { /* ignore */ } }
            if (fd.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) { try { URL.revokeObjectURL(fd.previewUrl); } catch (e) { /* ignore */ } }
            fd.previewUrl = null;
            if (fd.cleanup) fd.cleanup();
            if (fd.el && fd.el.parentNode) fd.el.parentNode.removeChild(fd.el);
        }
        removeFile(ref) {
            const fd = this._find(ref);
            if (!fd) return false;
            this.files = this.files.filter(f => f !== fd);
            this._release(fd);
            this.statusEl.textContent = fd.name + ' removed';
            this._emit('remove', fd.id, fd.file);
            this._emit('change', this.getFiles());
            return true;
        }
        setProgress(ref, progress) {
            const fd = this._find(ref);
            if (!fd) return;
            const pct = Math.max(0, Math.min(100, Number(progress) || 0));
            fd.progress = pct;
            fd.barEl.style.width = pct + '%';
            fd.progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
            this._emit('progress', fd.file, pct);
        }
        updateProgress(id, progress) { this.setProgress(id, progress); }
        setStatus(ref, status, message) {
            const fd = this._find(ref);
            if (!fd) return;
            fd.status = status;
            fd.statusElement.className = 'chillfileupload-file-status ' + status;
            fd.statusElement.textContent = message || status;
        }
        _upload(fd) {
            const hook = this.options.upload;
            if (typeof hook !== 'function' || fd.status === 'uploading') return Promise.resolve();
            fd.abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
            this.setStatus(fd, 'uploading', 'Uploading');
            let p;
            try { p = Promise.resolve(hook(fd.file, { onProgress: pct => this.setProgress(fd, pct), signal: fd.abort && fd.abort.signal })); }
            catch (err) { p = Promise.reject(err); }
            return p.then(result => {
                if (this._destroyed || this.files.indexOf(fd) < 0) return;
                this.setProgress(fd, 100);
                this.setStatus(fd, 'success', 'Done');
                this._emit('upload', fd.file, result);
            }, err => {
                if (this._destroyed || this.files.indexOf(fd) < 0) return;
                this.setStatus(fd, 'error', (err && err.message) || 'Failed');
                this._emit('error', fd.file, err);
            });
        }
        uploadAll() { return Promise.all(this.files.filter(f => f.status === 'pending' || f.status === 'error').map(f => this._upload(f))); }
        getFiles() { return this.files.map(f => f.file); }
        clear(silent) {
            this.files.forEach(f => this._release(f));
            this.files = [];
            this.filesContainer.textContent = '';
            if (!silent) this._emit('change', []);
        }
        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this.clear(true);
            this._cleanups.forEach(fn => fn());
            this._cleanups = [];
            this._listeners = {};
            if (this.container && this.container.parentNode) {
                // restore the original host element when we replaced one, otherwise just remove
                if (this.element && !this.element.parentNode) this.container.parentNode.replaceChild(this.element, this.container);
                else this.container.parentNode.removeChild(this.container);
            }
        }
    }

    const ChillFileUpload = {
        version: VERSION,
        init(selector, options) { return new ChillFileUploadInstance(selector, options); },
        create(options) { return new ChillFileUploadInstance(null, options); },
        matchesAccept,
        formatSize,
        injectCSS() { injectCSS(); }
    };
    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillFileUpload; } else { window.ChillFileUpload = ChillFileUpload; }
})(typeof window !== 'undefined' ? window : this);
