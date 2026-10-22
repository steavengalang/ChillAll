/**
 * ChillTagInput - Zero-dependency tag / chip input with suggestions
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const t = ChillTagInput.create({ value: ['js'], suggestions: ['javascript', 'typescript', 'rust'], max: 5,
 *                                    onChange: tags => console.log(tags) });
 *   document.body.appendChild(t.element);
 *   ChillTagInput.init('#tags', { delimiters: ['Enter', ',', ';'], validate: v => /^[\w-]+$/.test(v) || 'Letters only' });
 *
 * Options
 *   value             []          initial tags (strings)
 *   delimiters        ['Enter', ','] keys (or typed/pasted characters) that add the current text
 *   addOnBlur         true        add pending text when the field loses focus
 *   max               Infinity    maximum number of tags
 *   maxLength         0           max characters per tag (0 = unlimited)
 *   allowDuplicates   false
 *   caseSensitive     false       duplicate detection / suggestion filtering
 *   transform         null        (text) => text (e.g. v => v.toLowerCase())
 *   validate          null        (text, tags) => true | false | 'error message'
 *   suggestions       null        string[] | (query) => string[] | Promise<string[]>
 *   suggestionsMinChars 1         chars needed before suggestions show (0 = on focus)
 *   maxSuggestions    8
 *   debounce          150         ms debounce for function suggestion sources
 *   allowCustom       true        false = only suggested values may be added (array sources only)
 *   placeholder       ''
 *   size              'md'        'sm' | 'md' | 'lg'
 *   disabled / readonly  false
 *   name              null        a hidden <input name> per tag (form submission)
 *   label             'Tags'      aria-label of the text field
 *   container         null        element / selector to append into
 *   onChange(tags, inst), onAdd(tag, inst), onRemove(tag, inst), onInvalid(text, reason, inst)
 *       reason: 'empty' | 'max' | 'duplicate' | 'invalid' | 'length' | 'notallowed'
 * Methods: getValue, setValue(arr, silent), add(text) -> bool, remove(tagOrIndex), clear, focus,
 *          setDisabled, setReadonly, on(evt, fn) -> off(), destroy()
 * Events: 'change', 'add', 'remove', 'invalid'
 * Keyboard: Enter/comma add; Backspace on empty removes last; ArrowLeft from empty input moves to chips;
 *           on a chip Left/Right move, Delete/Backspace removes; suggestions: Up/Down/Enter/Esc.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chilltaginput_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chilltaginput-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chilltaginput-styles';
        style.textContent = `
      :root {
        --chilltaginput-bg: #ffffff;
        --chilltaginput-text: #171717;
        --chilltaginput-border: #d4d4d4;
        --chilltaginput-focus: #3b82f6;
        --chilltaginput-chip-bg: #eff6ff;
        --chilltaginput-chip-text: #1d4ed8;
        --chilltaginput-chip-hover: #dbeafe;
        --chilltaginput-error: #ef4444;
        --chilltaginput-muted: #9ca3af;
        --chilltaginput-menu-bg: #ffffff;
        --chilltaginput-menu-hover: #f3f4f6;
        --chilltaginput-shadow: 0 10px 25px rgba(0,0,0,.15);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltaginput-bg: #171717;
          --chilltaginput-text: #fafafa;
          --chilltaginput-border: #404040;
          --chilltaginput-chip-bg: #1e3a5f;
          --chilltaginput-chip-text: #bfdbfe;
          --chilltaginput-chip-hover: #274b7a;
          --chilltaginput-menu-bg: #1f1f1f;
          --chilltaginput-menu-hover: #2a2a2a;
          --chilltaginput-shadow: 0 10px 25px rgba(0,0,0,.6);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chilltaginput-bg: #171717;
        --chilltaginput-text: #fafafa;
        --chilltaginput-border: #404040;
        --chilltaginput-chip-bg: #1e3a5f;
        --chilltaginput-chip-text: #bfdbfe;
        --chilltaginput-chip-hover: #274b7a;
        --chilltaginput-menu-bg: #1f1f1f;
        --chilltaginput-menu-hover: #2a2a2a;
        --chilltaginput-shadow: 0 10px 25px rgba(0,0,0,.6);
      }
      .chilltaginput { position: relative; display: block; font-size: 14px; color: var(--chilltaginput-text); }
      .chilltaginput-box { box-sizing: border-box; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 38px; padding: 4px 8px; background: var(--chilltaginput-bg); border: 1px solid var(--chilltaginput-border); border-radius: 8px; cursor: text; transition: border-color .15s ease, box-shadow .15s ease; }
      .chilltaginput-sm .chilltaginput-box { min-height: 32px; font-size: 13px; }
      .chilltaginput-lg .chilltaginput-box { min-height: 46px; font-size: 16px; }
      .chilltaginput-box:focus-within { border-color: var(--chilltaginput-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chilltaginput-invalid .chilltaginput-box { border-color: var(--chilltaginput-error); }
      .chilltaginput-chip { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; min-height: 26px; padding: 0 4px 0 10px; box-sizing: border-box; background: var(--chilltaginput-chip-bg); color: var(--chilltaginput-chip-text); border-radius: 999px; font-size: .93em; line-height: 1; outline: none; transition: background .12s ease, box-shadow .12s ease; }
      .chilltaginput-chip:focus-visible { box-shadow: 0 0 0 2px var(--chilltaginput-focus); }
      .chilltaginput-chip-flash { animation: chilltaginput-flash .4s ease; }
      @keyframes chilltaginput-flash { 50% { background: var(--chilltaginput-error); color: #fff; } }
      .chilltaginput-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chilltaginput-remove { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; min-width: 20px; padding: 0; margin: 0; font: inherit; font-size: 14px; line-height: 1; color: inherit; background: transparent; border: 0; border-radius: 50%; cursor: pointer; opacity: .75; }
      .chilltaginput-remove:hover { opacity: 1; background: var(--chilltaginput-chip-hover); }
      .chilltaginput-remove:focus-visible { outline: 2px solid var(--chilltaginput-focus); opacity: 1; }
      .chilltaginput-field { flex: 1 1 80px; min-width: 80px; box-sizing: border-box; height: 28px; padding: 0 2px; margin: 0; font: inherit; color: inherit; background: transparent; border: 0; outline: none; }
      .chilltaginput-field::placeholder { color: var(--chilltaginput-muted); }
      .chilltaginput-menu { position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 10001; box-sizing: border-box; margin: 0; padding: 4px; list-style: none; max-height: 220px; overflow-y: auto; background: var(--chilltaginput-menu-bg); border: 1px solid var(--chilltaginput-border); border-radius: 8px; box-shadow: var(--chilltaginput-shadow); }
      .chilltaginput-option { padding: 8px 10px; border-radius: 6px; cursor: pointer; }
      .chilltaginput-option[aria-selected="true"], .chilltaginput-option:hover { background: var(--chilltaginput-menu-hover); }
      .chilltaginput-option mark { background: transparent; color: var(--chilltaginput-focus); font-weight: 600; }
      .chilltaginput-empty { padding: 8px 10px; color: var(--chilltaginput-muted); }
      .chilltaginput-disabled { opacity: .6; }
      .chilltaginput-disabled .chilltaginput-box { cursor: not-allowed; }
      .chilltaginput-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      @media (prefers-reduced-motion: reduce) {
        .chilltaginput-box, .chilltaginput-chip { transition: none; }
        .chilltaginput-chip-flash { animation: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function resolveEl(t) {
        if (!t) return null;
        if (typeof t === 'string') return document.querySelector(t);
        return t.nodeType === 1 ? t : null;
    }

    let uid = 0;

    function createTagInput(options) {
        options = options || {};
        injectCSS();
        const id = 'chilltaginput-' + (++uid);
        const listeners = {};
        const delimiters = Array.isArray(options.delimiters) ? options.delimiters : ['Enter', ','];
        const typedDelims = delimiters.filter(d => d.length === 1);
        const max = options.max > 0 ? options.max : Infinity;
        const maxLength = options.maxLength > 0 ? options.maxLength : 0;
        const caseSensitive = !!options.caseSensitive;
        const minChars = options.suggestionsMinChars === undefined ? 1 : Math.max(0, +options.suggestionsMinChars);
        const maxSuggestions = options.maxSuggestions > 0 ? options.maxSuggestions : 8;
        const debounceMs = options.debounce === undefined ? 150 : Math.max(0, +options.debounce);
        const src = options.suggestions;
        let disabled = !!options.disabled;
        let readonly = !!options.readonly;
        let destroyed = false;
        let tags = [];
        let items = [];     // current suggestion strings
        let active = -1;
        let menuOpen = false;
        let seq = 0;
        let debTimer = null;
        let invalidTimer = null;

        const key = s => (caseSensitive ? s : s.toLowerCase());

        const root = document.createElement('div');
        root.className = 'chilltaginput chilltaginput-' + (options.size || 'md') + (options.className ? ' ' + options.className : '');
        const box = document.createElement('div');
        box.className = 'chilltaginput-box';
        const field = document.createElement('input');
        field.type = 'text';
        field.className = 'chilltaginput-field';
        field.autocomplete = 'off';
        field.spellcheck = false;
        field.setAttribute('aria-label', options.label || 'Tags');
        if (options.placeholder) field.placeholder = String(options.placeholder);
        box.appendChild(field);
        root.appendChild(box);

        const live = document.createElement('div');
        live.className = 'chilltaginput-sr';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        root.appendChild(live);

        let menu = null;
        if (src) {
            menu = document.createElement('ul');
            menu.className = 'chilltaginput-menu';
            menu.id = id + '-menu';
            menu.setAttribute('role', 'listbox');
            menu.setAttribute('aria-label', 'Suggestions');
            menu.hidden = true;
            root.appendChild(menu);
            field.setAttribute('role', 'combobox');
            field.setAttribute('aria-autocomplete', 'list');
            field.setAttribute('aria-expanded', 'false');
            field.setAttribute('aria-controls', menu.id);
            field.setAttribute('aria-haspopup', 'listbox');
        }
        const hiddenWrap = document.createElement('span');
        hiddenWrap.hidden = true;
        root.appendChild(hiddenWrap);

        function emit(evt, payload, extra) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, extra, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }
        const say = msg => { live.textContent = ''; live.textContent = msg; };

        // ---- chips ----
        const chipEls = [];
        function renderChips() {
            chipEls.forEach(c => c.parentNode && c.parentNode.removeChild(c));
            chipEls.length = 0;
            hiddenWrap.textContent = '';
            tags.forEach((t, i) => {
                const chip = document.createElement('span');
                chip.className = 'chilltaginput-chip';
                chip.tabIndex = -1;
                chip.setAttribute('role', 'group');
                chip.setAttribute('aria-label', t);
                chip.dataset.index = String(i);
                const tx = document.createElement('span');
                tx.className = 'chilltaginput-chip-text';
                tx.textContent = t;
                chip.appendChild(tx);
                if (!readonly && !disabled) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.tabIndex = -1;
                    b.className = 'chilltaginput-remove';
                    b.setAttribute('aria-label', 'Remove ' + t);
                    b.textContent = '×';
                    chip.appendChild(b);
                }
                box.insertBefore(chip, field);
                chipEls.push(chip);
                if (options.name) {
                    const h = document.createElement('input');
                    h.type = 'hidden';
                    h.name = options.name;
                    h.value = t;
                    hiddenWrap.appendChild(h);
                }
            });
            field.disabled = disabled;
            field.readOnly = readonly;
            root.classList.toggle('chilltaginput-disabled', disabled);
            if (tags.length >= max) field.placeholder = ''; else if (options.placeholder) field.placeholder = String(options.placeholder);
        }

        function invalid(text, reason) {
            root.classList.add('chilltaginput-invalid');
            field.setAttribute('aria-invalid', 'true');
            window.clearTimeout(invalidTimer);
            invalidTimer = window.setTimeout(() => {
                root.classList.remove('chilltaginput-invalid');
                field.removeAttribute('aria-invalid');
            }, 1500);
            const msg = typeof reason === 'string' && reason.length > 12 ? reason : '';
            say(msg || ('"' + text + '" not added: ' + reason));
            if (typeof options.onInvalid === 'function') options.onInvalid(text, reason, api);
            emit('invalid', text, reason);
        }

        function addTag(raw, silent) {
            if (disabled || readonly) return false;
            let text = String(raw == null ? '' : raw).trim();
            if (typeof options.transform === 'function') text = String(options.transform(text)).trim();
            if (!text) return false;
            if (tags.length >= max) { invalid(text, 'max'); return false; }
            if (maxLength && text.length > maxLength) { invalid(text, 'length'); return false; }
            if (!options.allowDuplicates) {
                const idx = tags.findIndex(t => key(t) === key(text));
                if (idx > -1) {
                    const chip = chipEls[idx];
                    if (chip) { chip.classList.remove('chilltaginput-chip-flash'); void chip.offsetWidth; chip.classList.add('chilltaginput-chip-flash'); }
                    invalid(text, 'duplicate');
                    return false;
                }
            }
            if (options.allowCustom === false && Array.isArray(src) && !src.some(s => key(String(s)) === key(text))) {
                invalid(text, 'notallowed');
                return false;
            }
            if (typeof options.validate === 'function') {
                const r = options.validate(text, tags.slice());
                if (r !== true && r !== undefined) { invalid(text, typeof r === 'string' ? r : 'invalid'); return false; }
            }
            tags.push(text);
            renderChips();
            if (!silent) {
                say(text + ' added');
                if (typeof options.onAdd === 'function') options.onAdd(text, api);
                emit('add', text);
                changed();
            }
            return true;
        }

        function removeAt(i, silent) {
            if (disabled || readonly || i < 0 || i >= tags.length) return false;
            const [t] = tags.splice(i, 1);
            renderChips();
            if (!silent) {
                say(t + ' removed');
                if (typeof options.onRemove === 'function') options.onRemove(t, api);
                emit('remove', t);
                changed();
            }
            return true;
        }
        function changed() {
            if (typeof options.onChange === 'function') options.onChange(tags.slice(), api);
            emit('change', tags.slice());
        }

        // ---- suggestions ----
        function closeMenu() {
            if (!menu) return;
            menuOpen = false;
            active = -1;
            menu.hidden = true;
            field.setAttribute('aria-expanded', 'false');
            field.removeAttribute('aria-activedescendant');
        }
        function highlight(li, text, q) {
            const idx = key(text).indexOf(key(q));
            if (!q || idx < 0) { li.textContent = text; return; }
            li.appendChild(document.createTextNode(text.slice(0, idx)));
            const m = document.createElement('mark');
            m.textContent = text.slice(idx, idx + q.length);
            li.appendChild(m);
            li.appendChild(document.createTextNode(text.slice(idx + q.length)));
        }
        function showMenu(list, q) {
            if (!menu) return;
            const taken = new Set(tags.map(key));
            items = list.map(String).filter(s => options.allowDuplicates || !taken.has(key(s))).slice(0, maxSuggestions);
            menu.textContent = '';
            if (!items.length || document.activeElement !== field && !field.matches(':focus')) { closeMenu(); return; }
            items.forEach((s, i) => {
                const li = document.createElement('li');
                li.className = 'chilltaginput-option';
                li.id = id + '-opt-' + i;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', 'false');
                li.dataset.index = String(i);
                highlight(li, s, q);
                menu.appendChild(li);
            });
            menu.hidden = false;
            menuOpen = true;
            active = -1;
            field.setAttribute('aria-expanded', 'true');
            field.removeAttribute('aria-activedescendant');
        }
        function setActive(i) {
            const opts = menu.children;
            if (!opts.length) return;
            active = (i + opts.length) % opts.length;
            Array.prototype.forEach.call(opts, (o, k) => o.setAttribute('aria-selected', k === active ? 'true' : 'false'));
            field.setAttribute('aria-activedescendant', opts[active].id);
            if (opts[active].scrollIntoView) opts[active].scrollIntoView({ block: 'nearest' });
        }
        function filterArray(q) {
            const k = key(q);
            return src.map(String).filter(s => !k || key(s).indexOf(k) > -1);
        }
        function updateSuggestions() {
            if (!menu || disabled || readonly) return;
            const q = field.value.trim();
            if (q.length < minChars) { closeMenu(); return; }
            const my = ++seq;
            window.clearTimeout(debTimer);
            if (Array.isArray(src)) { showMenu(filterArray(q), q); return; }
            if (typeof src !== 'function') return;
            debTimer = window.setTimeout(() => {
                let r;
                try { r = src(q); } catch (e) { closeMenu(); return; }
                Promise.resolve(r).then(list => {
                    if (destroyed || my !== seq) return;       // stale
                    showMenu(Array.isArray(list) ? list : [], q);
                }).catch(() => { if (!destroyed && my === seq) closeMenu(); });
            }, debounceMs);
        }
        function pickActive() {
            if (!menuOpen || active < 0) return false;
            const s = items[active];
            field.value = '';
            closeMenu();
            addTag(s);
            return true;
        }

        // ---- events ----
        const onInput = () => {
            if (typedDelims.length) {
                const v = field.value;
                if (typedDelims.some(d => v.indexOf(d) > -1)) {
                    const parts = v.split(new RegExp('[' + typedDelims.map(d => d.replace(/[\\\]^-]/g, '\\$&')).join('') + ']'));
                    const rest = parts.pop();
                    parts.forEach(p => addTag(p));
                    field.value = rest;
                }
            }
            updateSuggestions();
        };
        const onKeyDown = e => {
            if (disabled || readonly) return;
            if (e.isComposing) return;
            if (menuOpen) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active < 0 ? -1 : active - 1); return; }
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); return; }
                if (e.key === 'Enter' && pickActive()) { e.preventDefault(); return; }
            } else if (e.key === 'ArrowDown' && menu) { updateSuggestions(); }
            if (e.key === 'Enter' && delimiters.indexOf('Enter') < 0) return;
            if (delimiters.indexOf(e.key) > -1 && e.key.length > 1) {   // Enter, Tab, ...
                if (field.value.trim()) { e.preventDefault(); if (addTag(field.value)) field.value = ''; closeMenu(); }
                else if (e.key === 'Enter') e.preventDefault();
                return;
            }
            if (e.key === 'Backspace' && field.value === '' && tags.length) { e.preventDefault(); removeAt(tags.length - 1); return; }
            if (e.key === 'ArrowLeft' && field.selectionStart === 0 && field.selectionEnd === 0 && chipEls.length) {
                e.preventDefault();
                chipEls[chipEls.length - 1].focus();
            }
        };
        const onPaste = e => {
            if (disabled || readonly) return;
            const data = e.clipboardData || window.clipboardData;
            const text = data && data.getData ? data.getData('text') : '';
            if (!text) return;
            const re = new RegExp('[' + (typedDelims.concat(['\\n', '\\r', '\\t']).map(d => (d.length === 1 ? d.replace(/[\\\]^-]/g, '\\$&') : d)).join('')) + ']');
            if (!re.test(text)) return;
            e.preventDefault();
            text.split(re).forEach(p => addTag(p));
        };
        const onBlur = () => {
            if (options.addOnBlur !== false && field.value.trim() && !(menuOpen && active >= 0)) {
                if (addTag(field.value)) field.value = '';
            }
            window.setTimeout(() => { if (!destroyed && document.activeElement !== field) closeMenu(); }, 0);
        };
        const onFocus = () => { if (menu && minChars === 0) updateSuggestions(); };
        const onBoxClick = e => {
            if (disabled) return;
            const rm = e.target.closest ? e.target.closest('.chilltaginput-remove') : null;
            if (rm) {
                const chip = rm.parentNode;
                removeAt(+chip.dataset.index);
                field.focus();
                return;
            }
            if (e.target === box) field.focus();
        };
        const onChipKey = e => {
            const chip = e.target.closest ? e.target.closest('.chilltaginput-chip') : null;
            if (!chip || e.target !== chip || disabled || readonly) return;
            const i = +chip.dataset.index;
            if (e.key === 'ArrowLeft') { e.preventDefault(); if (i > 0) chipEls[i - 1].focus(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); if (i < chipEls.length - 1) chipEls[i + 1].focus(); else field.focus(); }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                removeAt(i);
                const next = chipEls[Math.min(i, chipEls.length - 1)];
                if (next) next.focus(); else field.focus();
            }
        };
        const onMenuDown = e => { e.preventDefault(); };   // keep focus in input
        const onMenuClick = e => {
            const li = e.target.closest ? e.target.closest('.chilltaginput-option') : null;
            if (!li) return;
            active = +li.dataset.index;
            pickActive();
            field.focus();
        };
        field.addEventListener('input', onInput);
        field.addEventListener('keydown', onKeyDown);
        field.addEventListener('paste', onPaste);
        field.addEventListener('blur', onBlur);
        field.addEventListener('focus', onFocus);
        box.addEventListener('click', onBoxClick);
        box.addEventListener('keydown', onChipKey);
        if (menu) {
            menu.addEventListener('mousedown', onMenuDown);
            menu.addEventListener('click', onMenuClick);
        }

        const api = {
            element: root,
            input: field,
            getValue: () => tags.slice(),
            setValue(arr, silent) {
                if (destroyed) return api;
                tags = [];
                (Array.isArray(arr) ? arr : []).forEach(t => {
                    const s = String(t).trim();
                    if (s && (options.allowDuplicates || !tags.some(x => key(x) === key(s))) && tags.length < max) tags.push(s);
                });
                renderChips();
                if (!silent) changed();
                return api;
            },
            add(text) { return addTag(text); },
            remove(t) {
                const i = typeof t === 'number' ? t : tags.findIndex(x => key(x) === key(String(t)));
                return removeAt(i);
            },
            clear() { if (tags.length && !disabled && !readonly) { tags = []; renderChips(); changed(); } return api; },
            focus() { field.focus(); return api; },
            setDisabled(b) { disabled = !!b; if (disabled) closeMenu(); renderChips(); return api; },
            setReadonly(b) { readonly = !!b; if (readonly) closeMenu(); renderChips(); return api; },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                window.clearTimeout(debTimer);
                window.clearTimeout(invalidTimer);
                field.removeEventListener('input', onInput);
                field.removeEventListener('keydown', onKeyDown);
                field.removeEventListener('paste', onPaste);
                field.removeEventListener('blur', onBlur);
                field.removeEventListener('focus', onFocus);
                box.removeEventListener('click', onBoxClick);
                box.removeEventListener('keydown', onChipKey);
                if (menu) {
                    menu.removeEventListener('mousedown', onMenuDown);
                    menu.removeEventListener('click', onMenuClick);
                }
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        api.setValue(options.value, true);
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillTagInput = {
        version: VERSION,
        create: createTagInput,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createTagInput(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTagInput;
    } else {
        window.ChillTagInput = ChillTagInput;
    }

})(typeof window !== 'undefined' ? window : this);
