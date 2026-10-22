/**
 * ChillAutocomplete - Zero-dependency accessible autocomplete (ARIA 1.2 combobox + listbox)
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const ac = ChillAutocomplete.create({
 *       source: ['Apple', 'Banana', 'Cherry'],                 // or async: (query, { signal }) => fetch(...).then(r => r.json())
 *       placeholder: 'Search fruit', onSelect: item => console.log(item)
 *   });
 *   document.body.appendChild(ac.element);
 *   ChillAutocomplete.init('#city', { source: q => api.searchCities(q), labelKey: 'name', debounce: 250 });
 *
 * Options
 *   source           []          array of strings / objects, or (query, {signal}) => array | Promise<array>
 *   labelKey         'label'     property used as display text for object items
 *   valueKey         'value'     property used as value for object items
 *   minChars         1           characters before searching (0 = also on focus/arrow)
 *   debounce         200         ms debounce for function sources (array sources filter instantly)
 *   maxResults       10
 *   highlight        true        wrap matched text in <mark>
 *   filter           null        (item, query, label) => bool for array sources (default: case-insensitive contains)
 *   renderItem       null        (item, query) => string | Node. Strings are inserted as TEXT; return a Node for markup.
 *   allowFreeText    true        false = text reverts to the selected item on blur
 *   openOnFocus      false       open the list when the field gets focus (honours minChars)
 *   autoSelectFirst  false       first result is active as soon as the list opens
 *   noResultsText    'No results' set null to show nothing
 *   loadingText      'Loading...'
 *   clearable        false       show a clear (x) button
 *   value            ''          initial text
 *   placeholder, name, label (aria-label), size 'md', disabled, className
 *   container        null        element / selector to append into
 *   onInput(text, inst), onSelect(item, inst), onChange(text, item, inst), onError(err, inst)
 * Methods: getValue (text), getSelected (item | null), setValue(text, item?), clear, open, close, isOpen,
 *          setSource(src), focus, setDisabled, on(evt, fn) -> off(), destroy()
 * Events: 'input', 'select', 'change', 'open', 'close', 'error'
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillautocomplete_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillautocomplete-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillautocomplete-styles';
        style.textContent = `
      :root {
        --chillautocomplete-bg: #ffffff;
        --chillautocomplete-text: #171717;
        --chillautocomplete-border: #d4d4d4;
        --chillautocomplete-focus: #3b82f6;
        --chillautocomplete-muted: #6b7280;
        --chillautocomplete-hover: #f3f4f6;
        --chillautocomplete-active: #eff6ff;
        --chillautocomplete-shadow: 0 10px 25px rgba(0,0,0,.15);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillautocomplete-bg: #171717;
          --chillautocomplete-text: #fafafa;
          --chillautocomplete-border: #404040;
          --chillautocomplete-muted: #9ca3af;
          --chillautocomplete-hover: #262626;
          --chillautocomplete-active: #1e3a5f;
          --chillautocomplete-shadow: 0 10px 25px rgba(0,0,0,.6);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillautocomplete-bg: #171717;
        --chillautocomplete-text: #fafafa;
        --chillautocomplete-border: #404040;
        --chillautocomplete-muted: #9ca3af;
        --chillautocomplete-hover: #262626;
        --chillautocomplete-active: #1e3a5f;
        --chillautocomplete-shadow: 0 10px 25px rgba(0,0,0,.6);
      }
      .chillautocomplete { position: relative; display: block; font-size: 14px; color: var(--chillautocomplete-text); }
      .chillautocomplete-input { box-sizing: border-box; width: 100%; height: 38px; padding: 0 36px 0 12px; margin: 0; font: inherit; color: inherit; background: var(--chillautocomplete-bg); border: 1px solid var(--chillautocomplete-border); border-radius: 8px; outline: none; transition: border-color .15s ease, box-shadow .15s ease; }
      .chillautocomplete-sm .chillautocomplete-input { height: 32px; font-size: 13px; }
      .chillautocomplete-lg .chillautocomplete-input { height: 46px; font-size: 16px; }
      .chillautocomplete-input::placeholder { color: var(--chillautocomplete-muted); }
      .chillautocomplete-input:focus-visible { border-color: var(--chillautocomplete-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillautocomplete-input:disabled { opacity: .6; cursor: not-allowed; }
      .chillautocomplete-clear { position: absolute; top: 50%; right: 6px; transform: translateY(-50%); width: 24px; height: 24px; padding: 0; font: inherit; font-size: 16px; line-height: 1; color: var(--chillautocomplete-muted); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
      .chillautocomplete-clear:hover { background: var(--chillautocomplete-hover); color: var(--chillautocomplete-text); }
      .chillautocomplete-clear:focus-visible { outline: 2px solid var(--chillautocomplete-focus); }
      .chillautocomplete-spinner { position: absolute; top: 50%; right: 10px; width: 14px; height: 14px; margin-top: -7px; box-sizing: border-box; border: 2px solid var(--chillautocomplete-border); border-top-color: var(--chillautocomplete-focus); border-radius: 50%; animation: chillautocomplete-spin .6s linear infinite; pointer-events: none; }
      @keyframes chillautocomplete-spin { to { transform: rotate(360deg); } }
      .chillautocomplete-menu { position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 10001; box-sizing: border-box; margin: 0; padding: 4px; list-style: none; max-height: 260px; overflow-y: auto; background: var(--chillautocomplete-bg); border: 1px solid var(--chillautocomplete-border); border-radius: 8px; box-shadow: var(--chillautocomplete-shadow); }
      .chillautocomplete-option { padding: 8px 10px; border-radius: 6px; cursor: pointer; }
      .chillautocomplete-option[aria-selected="true"] { background: var(--chillautocomplete-active); }
      .chillautocomplete-option mark { background: transparent; color: var(--chillautocomplete-focus); font-weight: 600; }
      .chillautocomplete-status { padding: 8px 10px; color: var(--chillautocomplete-muted); }
      .chillautocomplete-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      @media (prefers-reduced-motion: reduce) {
        .chillautocomplete-input { transition: none; }
        .chillautocomplete-spinner { animation-duration: 2s; }
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

    function createAutocomplete(options) {
        options = options || {};
        injectCSS();
        const id = 'chillautocomplete-' + (++uid);
        const listeners = {};
        const labelKey = options.labelKey || 'label';
        const valueKey = options.valueKey || 'value';
        const minChars = options.minChars === undefined ? 1 : Math.max(0, +options.minChars);
        const debounceMs = options.debounce === undefined ? 200 : Math.max(0, +options.debounce);
        const maxResults = options.maxResults > 0 ? options.maxResults : 10;
        let source = options.source || [];
        let disabled = !!options.disabled;
        let destroyed = false;
        let isOpen = false;
        let items = [];
        let active = -1;
        let selected = null;
        let seq = 0;
        let debTimer = null;
        let controller = null;
        let committedText = '';

        const labelOf = it => (it !== null && typeof it === 'object' ? String(it[labelKey] == null ? '' : it[labelKey]) : String(it));

        const root = document.createElement('div');
        root.className = 'chillautocomplete chillautocomplete-' + (options.size || 'md') + (options.className ? ' ' + options.className : '');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chillautocomplete-input';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-controls', id + '-list');
        if (options.label) input.setAttribute('aria-label', String(options.label));
        if (options.placeholder) input.placeholder = String(options.placeholder);
        if (options.name) input.name = options.name;
        input.disabled = disabled;
        const menu = document.createElement('ul');
        menu.className = 'chillautocomplete-menu';
        menu.id = id + '-list';
        menu.setAttribute('role', 'listbox');
        if (options.label) menu.setAttribute('aria-label', String(options.label));
        menu.hidden = true;
        const live = document.createElement('div');
        live.className = 'chillautocomplete-sr';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        root.appendChild(input);
        let clearBtn = null;
        if (options.clearable) {
            clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'chillautocomplete-clear';
            clearBtn.setAttribute('aria-label', 'Clear');
            clearBtn.textContent = '×';
            clearBtn.hidden = true;
            root.appendChild(clearBtn);
        }
        root.appendChild(menu);
        root.appendChild(live);
        let spinner = null;

        function emit(evt, a, b) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(a, b, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }
        const say = m => { live.textContent = ''; live.textContent = m; };
        function syncClear() { if (clearBtn) clearBtn.hidden = disabled || input.value === ''; }

        function setBusy(b) {
            input.setAttribute('aria-busy', b ? 'true' : 'false');
            if (b && !spinner) {
                spinner = document.createElement('span');
                spinner.className = 'chillautocomplete-spinner';
                spinner.setAttribute('aria-hidden', 'true');
                root.appendChild(spinner);
            } else if (!b && spinner) {
                spinner.parentNode && spinner.parentNode.removeChild(spinner);
                spinner = null;
            }
        }

        // ---- list ----
        function closeMenu() {
            if (!isOpen && menu.hidden) return;
            isOpen = false;
            active = -1;
            menu.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            emit('close');
        }
        function openMenu() {
            if (isOpen) return;
            isOpen = true;
            menu.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            emit('open');
        }
        function renderContent(q) {
            const frag = document.createDocumentFragment();
            const k = q.toLowerCase();
            items.forEach((it, i) => {
                const li = document.createElement('li');
                li.className = 'chillautocomplete-option';
                li.id = id + '-opt-' + i;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', 'false');
                li.dataset.index = String(i);
                const label = labelOf(it);
                if (typeof options.renderItem === 'function') {
                    const r = options.renderItem(it, q);
                    if (r && r.nodeType) li.appendChild(r); else li.textContent = r == null ? label : String(r);
                } else if (options.highlight !== false && q) {
                    const idx = label.toLowerCase().indexOf(k);
                    if (idx < 0) li.textContent = label;
                    else {
                        li.appendChild(document.createTextNode(label.slice(0, idx)));
                        const m = document.createElement('mark');
                        m.textContent = label.slice(idx, idx + q.length);
                        li.appendChild(m);
                        li.appendChild(document.createTextNode(label.slice(idx + q.length)));
                    }
                } else li.textContent = label;
                frag.appendChild(li);
            });
            menu.textContent = '';
            menu.appendChild(frag);
        }
        function showStatus(text) {
            menu.textContent = '';
            const li = document.createElement('li');
            li.className = 'chillautocomplete-status';
            li.setAttribute('role', 'presentation');
            li.textContent = text;
            menu.appendChild(li);
            items = [];
            active = -1;
            input.removeAttribute('aria-activedescendant');
            openMenu();
        }
        function showResults(list, q) {
            items = list.slice(0, maxResults);
            active = -1;
            input.removeAttribute('aria-activedescendant');
            if (!items.length) {
                if (options.noResultsText === null) { closeMenu(); return; }
                const t = options.noResultsText === undefined ? 'No results' : String(options.noResultsText);
                showStatus(t);
                say(t);
                return;
            }
            renderContent(q);
            openMenu();
            say(items.length + (items.length === 1 ? ' result' : ' results') + ' available');
            if (options.autoSelectFirst) setActive(0);
        }
        function setActive(i) {
            const opts = menu.querySelectorAll('[role="option"]');
            if (!opts.length) return;
            active = ((i % opts.length) + opts.length) % opts.length;
            opts.forEach((o, k) => o.setAttribute('aria-selected', k === active ? 'true' : 'false'));
            input.setAttribute('aria-activedescendant', opts[active].id);
            if (opts[active].scrollIntoView) opts[active].scrollIntoView({ block: 'nearest' });
        }

        // ---- search ----
        function defaultFilter(it, q, label) { return label.toLowerCase().indexOf(q.toLowerCase()) > -1; }
        function search() {
            if (disabled || destroyed) return;
            const q = input.value.trim();
            window.clearTimeout(debTimer);
            if (controller) { try { controller.abort(); } catch (e) { /* noop */ } controller = null; }
            const my = ++seq;
            if (q.length < minChars) { setBusy(false); closeMenu(); return; }
            if (Array.isArray(source)) {
                const f = typeof options.filter === 'function' ? options.filter : defaultFilter;
                const arr = source;
                showResults(arr.filter(it => f(it, q, labelOf(it))), q);
                return;
            }
            if (typeof source !== 'function') return;
            debTimer = window.setTimeout(() => {
                if (destroyed || my !== seq) return;
                controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
                setBusy(true);
                if (!isOpen && options.loadingText !== null) showStatus(options.loadingText === undefined ? 'Loading...' : String(options.loadingText));
                let r;
                try { r = source(q, { signal: controller ? controller.signal : undefined }); }
                catch (err) { fail(err, my); return; }
                Promise.resolve(r).then(list => {
                    if (destroyed || my !== seq) return;
                    setBusy(false);
                    showResults(Array.isArray(list) ? list : [], q);
                }, err => fail(err, my));
            }, debounceMs);
        }
        function fail(err, my) {
            if (destroyed || my !== seq) return;
            if (err && err.name === 'AbortError') return;
            setBusy(false);
            closeMenu();
            if (typeof options.onError === 'function') options.onError(err, api);
            emit('error', err);
        }

        function select(i) {
            const it = items[i];
            if (it === undefined) return;
            selected = it;
            input.value = labelOf(it);
            committedText = input.value;
            seq++;
            window.clearTimeout(debTimer);
            setBusy(false);
            closeMenu();
            syncClear();
            if (typeof options.onSelect === 'function') options.onSelect(it, api);
            emit('select', it);
            if (typeof options.onChange === 'function') options.onChange(input.value, it, api);
            emit('change', input.value, it);
        }

        // ---- events ----
        const onInput = () => {
            selected = null;
            syncClear();
            if (typeof options.onInput === 'function') options.onInput(input.value, api);
            emit('input', input.value);
            search();
        };
        const onKey = e => {
            if (disabled || e.isComposing) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) { search(); if (isOpen && active < 0) setActive(0); } else setActive(active + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) { search(); if (isOpen) setActive(items.length - 1); } else setActive(active < 0 ? items.length - 1 : active - 1);
                    break;
                case 'Enter':
                    if (isOpen && active >= 0) { e.preventDefault(); select(active); }
                    break;
                case 'Escape':
                    if (isOpen) { e.preventDefault(); e.stopPropagation(); closeMenu(); }
                    else if (input.value) { input.value = ''; selected = null; syncClear(); emit('input', ''); }
                    break;
                case 'Tab':
                    if (isOpen && active >= 0 && options.autoSelectFirst) select(active); else closeMenu();
                    break;
                default:
            }
        };
        const onFocus = () => { if (options.openOnFocus && !isOpen) search(); };
        const onBlur = () => {
            window.clearTimeout(debTimer);
            seq++;
            setBusy(false);
            closeMenu();
            if (options.allowFreeText === false) {
                input.value = selected ? labelOf(selected) : '';
                syncClear();
            } else if (input.value !== committedText) {
                committedText = input.value;
                if (typeof options.onChange === 'function') options.onChange(input.value, selected, api);
                emit('change', input.value, selected);
            }
        };
        const onMenuDown = e => { e.preventDefault(); };
        const onMenuClick = e => {
            const li = e.target.closest ? e.target.closest('[role="option"]') : null;
            if (li) { select(+li.dataset.index); if (input.focus) input.focus(); }
        };
        const onMenuMove = e => {
            const li = e.target.closest ? e.target.closest('[role="option"]') : null;
            if (li && +li.dataset.index !== active) setActive(+li.dataset.index);
        };
        const onClear = () => { api.clear(); input.focus(); };
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', onKey);
        input.addEventListener('focus', onFocus);
        input.addEventListener('blur', onBlur);
        menu.addEventListener('mousedown', onMenuDown);
        menu.addEventListener('click', onMenuClick);
        menu.addEventListener('mousemove', onMenuMove);
        if (clearBtn) clearBtn.addEventListener('click', onClear);

        const api = {
            element: root,
            input,
            getValue: () => input.value,
            getSelected: () => selected,
            setValue(text, item) {
                if (destroyed) return api;
                input.value = text == null ? '' : String(text);
                committedText = input.value;
                selected = item === undefined ? null : item;
                syncClear();
                return api;
            },
            clear() {
                input.value = ''; selected = null; committedText = '';
                seq++; window.clearTimeout(debTimer); setBusy(false); closeMenu(); syncClear();
                emit('input', '');
                if (typeof options.onChange === 'function') options.onChange('', null, api);
                emit('change', '', null);
                return api;
            },
            open() { search(); return api; },
            close() { closeMenu(); return api; },
            isOpen: () => isOpen,
            setSource(s) { source = s || []; return api; },
            focus() { input.focus(); return api; },
            setDisabled(b) {
                disabled = !!b;
                input.disabled = disabled;
                if (disabled) { seq++; closeMenu(); }
                syncClear();
                return api;
            },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                seq++;
                window.clearTimeout(debTimer);
                if (controller) { try { controller.abort(); } catch (e) { /* noop */ } controller = null; }
                input.removeEventListener('input', onInput);
                input.removeEventListener('keydown', onKey);
                input.removeEventListener('focus', onFocus);
                input.removeEventListener('blur', onBlur);
                menu.removeEventListener('mousedown', onMenuDown);
                menu.removeEventListener('click', onMenuClick);
                menu.removeEventListener('mousemove', onMenuMove);
                if (clearBtn) clearBtn.removeEventListener('click', onClear);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        if (options.value) { input.value = String(options.value); committedText = input.value; }
        syncClear();
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        void valueKey;
        return api;
    }

    const ChillAutocomplete = {
        version: VERSION,
        create: createAutocomplete,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createAutocomplete(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillAutocomplete;
    } else {
        window.ChillAutocomplete = ChillAutocomplete;
    }

})(typeof window !== 'undefined' ? window : this);
