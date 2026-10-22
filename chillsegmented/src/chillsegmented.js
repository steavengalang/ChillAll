/**
 * ChillSegmented - Zero-dependency segmented control / toggle button group
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const s = ChillSegmented.create({ items: ['Day', 'Week', 'Month'], value: 'Week', onChange: v => console.log(v) });
 *   document.body.appendChild(s.element);
 *   ChillSegmented.init('#view', { items: [{ value: 'b', label: 'Bold', icon: 'B' }, { value: 'i', label: 'Italic' }],
 *                                  multiple: true, value: ['b'] });
 *
 * Options
 *   items         []        strings or { value, label, icon, title, disabled }  (label/icon/title are text, never HTML)
 *   value         first     single: a value (default: first enabled item, unless allowEmpty);  multiple: array of values
 *   multiple      false     toggle-button group (role="group", aria-pressed) instead of radio group
 *   allowEmpty    false     single mode: clicking the active item deselects it (value becomes null)
 *   size          'md'      'sm' | 'md' | 'lg'
 *   fullWidth     false     stretch to container, equal-width segments
 *   disabled      false
 *   name          null      hidden input name(s) for forms
 *   label         null      aria-label of the group
 *   container     null      element / selector to append into
 *   onChange(value, inst)
 * Methods: getValue, setValue(v, silent), setDisabled(bool), setItemDisabled(value, bool), on(evt, fn) -> off(), destroy()
 * Events: 'change'
 * Keyboard (single): Arrow keys move + select, Home/End; (multiple): Arrow keys move focus, Space/Enter toggle.
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillsegmented_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillsegmented-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillsegmented-styles';
        style.textContent = `
      :root {
        --chillsegmented-bg: #f3f4f6;
        --chillsegmented-text: #4b5563;
        --chillsegmented-hover: #e5e7eb;
        --chillsegmented-active-bg: #ffffff;
        --chillsegmented-active-text: #171717;
        --chillsegmented-focus: #3b82f6;
        --chillsegmented-disabled: #9ca3af;
        --chillsegmented-shadow: 0 1px 3px rgba(0,0,0,.15);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillsegmented-bg: #262626;
          --chillsegmented-text: #a3a3a3;
          --chillsegmented-hover: #333333;
          --chillsegmented-active-bg: #404040;
          --chillsegmented-active-text: #fafafa;
          --chillsegmented-disabled: #6b7280;
          --chillsegmented-shadow: 0 1px 3px rgba(0,0,0,.5);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillsegmented-bg: #262626;
        --chillsegmented-text: #a3a3a3;
        --chillsegmented-hover: #333333;
        --chillsegmented-active-bg: #404040;
        --chillsegmented-active-text: #fafafa;
        --chillsegmented-disabled: #6b7280;
        --chillsegmented-shadow: 0 1px 3px rgba(0,0,0,.5);
      }
      .chillsegmented { display: inline-flex; box-sizing: border-box; padding: 3px; gap: 2px; background: var(--chillsegmented-bg); border-radius: 10px; font-size: 14px; max-width: 100%; }
      .chillsegmented-fullwidth { display: flex; width: 100%; }
      .chillsegmented-fullwidth .chillsegmented-item { flex: 1 1 0; }
      .chillsegmented-item { display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; min-height: 32px; padding: 0 14px; margin: 0; font: inherit; font-weight: 500; line-height: 1; color: var(--chillsegmented-text); background: transparent; border: 0; border-radius: 8px; cursor: pointer; white-space: nowrap; user-select: none; transition: background .15s ease, color .15s ease, box-shadow .15s ease; }
      .chillsegmented-sm .chillsegmented-item { min-height: 28px; padding: 0 10px; font-size: 12px; }
      .chillsegmented-lg .chillsegmented-item { min-height: 40px; padding: 0 18px; font-size: 16px; }
      .chillsegmented-item:hover:not(:disabled):not([aria-checked="true"]):not([aria-pressed="true"]) { background: var(--chillsegmented-hover); }
      .chillsegmented-item[aria-checked="true"], .chillsegmented-item[aria-pressed="true"] { background: var(--chillsegmented-active-bg); color: var(--chillsegmented-active-text); box-shadow: var(--chillsegmented-shadow); }
      .chillsegmented-item:focus-visible { outline: 2px solid var(--chillsegmented-focus); outline-offset: 1px; }
      .chillsegmented-item:disabled { color: var(--chillsegmented-disabled); cursor: not-allowed; }
      .chillsegmented-icon { display: inline-flex; flex: none; }
      .chillsegmented-disabled { opacity: .6; }
      @media (prefers-reduced-motion: reduce) {
        .chillsegmented-item { transition: none; }
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

    function createSegmented(options) {
        options = options || {};
        injectCSS();
        const multiple = !!options.multiple;
        const listeners = {};
        let disabled = !!options.disabled;
        let destroyed = false;

        const items = (Array.isArray(options.items) ? options.items : []).map(it => {
            if (it !== null && typeof it === 'object') {
                return { value: it.value, label: it.label === undefined ? String(it.value) : String(it.label), icon: it.icon, title: it.title, disabled: !!it.disabled };
            }
            return { value: it, label: String(it), disabled: false };
        });
        const isDisabled = it => disabled || it.disabled;
        const findIdx = v => items.findIndex(it => it.value === v);

        let selected; // single: value|null ; multiple: array
        if (multiple) {
            selected = (Array.isArray(options.value) ? options.value : (options.value !== undefined ? [options.value] : [])).filter(v => findIdx(v) > -1);
        } else if (options.value !== undefined && findIdx(options.value) > -1) {
            selected = options.value;
        } else if (options.value === null || options.allowEmpty) {
            selected = null;
        } else {
            const f = items.find(it => !it.disabled);
            selected = f ? f.value : null;
        }

        const root = document.createElement('div');
        root.className = 'chillsegmented chillsegmented-' + (options.size || 'md') + (options.fullWidth ? ' chillsegmented-fullwidth' : '') + (options.className ? ' ' + options.className : '');
        root.setAttribute('role', multiple ? 'group' : 'radiogroup');
        if (options.label) root.setAttribute('aria-label', String(options.label));

        const btns = items.map((it, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chillsegmented-item';
            b.dataset.index = String(i);
            if (it.title) b.title = String(it.title);
            if (!multiple) b.setAttribute('role', 'radio');
            if (it.icon) {
                const ic = document.createElement('span');
                ic.className = 'chillsegmented-icon';
                ic.setAttribute('aria-hidden', 'true');
                ic.textContent = String(it.icon);
                b.appendChild(ic);
            }
            const tx = document.createElement('span');
            tx.className = 'chillsegmented-label';
            tx.textContent = it.label;
            b.appendChild(tx);
            root.appendChild(b);
            return b;
        });

        let hiddenWrap = null;
        if (options.name) {
            hiddenWrap = document.createElement('span');
            hiddenWrap.hidden = true;
            root.appendChild(hiddenWrap);
        }

        const has = v => (multiple ? selected.indexOf(v) > -1 : selected === v);
        const out = () => (multiple ? selected.slice() : selected);

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }

        function render() {
            let tabIdx = -1;
            if (!multiple) {
                tabIdx = items.findIndex((it, i) => has(it.value) && !isDisabled(it));
                if (tabIdx < 0) tabIdx = items.findIndex(it => !isDisabled(it));
            }
            items.forEach((it, i) => {
                const b = btns[i];
                const on = has(it.value);
                b.disabled = isDisabled(it);
                if (multiple) b.setAttribute('aria-pressed', on ? 'true' : 'false');
                else {
                    b.setAttribute('aria-checked', on ? 'true' : 'false');
                    b.tabIndex = i === tabIdx ? 0 : -1;
                }
            });
            root.classList.toggle('chillsegmented-disabled', disabled);
            if (disabled) root.setAttribute('aria-disabled', 'true'); else root.removeAttribute('aria-disabled');
            if (hiddenWrap) {
                hiddenWrap.textContent = '';
                (multiple ? selected : (selected === null ? [] : [selected])).forEach(v => {
                    const h = document.createElement('input');
                    h.type = 'hidden';
                    h.name = options.name;
                    h.value = String(v);
                    hiddenWrap.appendChild(h);
                });
            }
        }

        function commit(next, silent) {
            const prev = JSON.stringify(selected);
            selected = next;
            render();
            if (!silent && JSON.stringify(selected) !== prev) {
                if (typeof options.onChange === 'function') options.onChange(out(), api);
                emit('change', out());
            }
        }

        function activate(i) {
            const it = items[i];
            if (!it || isDisabled(it)) return;
            if (multiple) {
                commit(has(it.value) ? selected.filter(v => v !== it.value) : items.filter(x => x === it || has(x.value)).map(x => x.value));
            } else if (has(it.value)) {
                if (options.allowEmpty) commit(null);
            } else commit(it.value);
        }

        const onClick = e => {
            if (disabled) return;
            const b = e.target.closest ? e.target.closest('.chillsegmented-item') : null;
            if (b) activate(+b.dataset.index);
        };
        const onKey = e => {
            if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
            const b = e.target.closest ? e.target.closest('.chillsegmented-item') : null;
            if (!b) return;
            const cur = +b.dataset.index;
            let dir = 0, edge = null;
            switch (e.key) {
                case 'ArrowRight': case 'ArrowDown': dir = 1; break;
                case 'ArrowLeft': case 'ArrowUp': dir = -1; break;
                case 'Home': edge = 'start'; break;
                case 'End': edge = 'end'; break;
                default: return;
            }
            e.preventDefault();
            let idx = -1;
            const n = items.length;
            if (edge === 'start') { for (let k = 0; k < n; k++) if (!isDisabled(items[k])) { idx = k; break; } }
            else if (edge === 'end') { for (let k = n - 1; k >= 0; k--) if (!isDisabled(items[k])) { idx = k; break; } }
            else {
                for (let s = 1; s <= n; s++) {
                    const k = ((cur + dir * s) % n + n) % n;
                    if (!isDisabled(items[k])) { idx = k; break; }
                }
            }
            if (idx < 0) return;
            if (btns[idx].focus) btns[idx].focus();
            if (!multiple) { if (!has(items[idx].value)) commit(items[idx].value); }
        };
        root.addEventListener('click', onClick);
        root.addEventListener('keydown', onKey);

        const api = {
            element: root,
            getValue: out,
            setValue(v, silent) {
                if (destroyed) return api;
                if (multiple) {
                    const arr = (Array.isArray(v) ? v : [v]).filter(x => findIdx(x) > -1);
                    commit(items.filter(it => arr.indexOf(it.value) > -1).map(it => it.value), !!silent);
                } else if (v === null && options.allowEmpty) commit(null, !!silent);
                else if (findIdx(v) > -1) commit(v, !!silent);
                return api;
            },
            setDisabled(b) { disabled = !!b; render(); return api; },
            setItemDisabled(value, b) {
                const i = findIdx(value);
                if (i > -1) { items[i].disabled = !!b; render(); }
                return api;
            },
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                root.removeEventListener('click', onClick);
                root.removeEventListener('keydown', onKey);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        render();
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillSegmented = {
        version: VERSION,
        create: createSegmented,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createSegmented(Object.assign({}, options, { container: host }));
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSegmented;
    } else {
        window.ChillSegmented = ChillSegmented;
    }

})(typeof window !== 'undefined' ? window : this);
