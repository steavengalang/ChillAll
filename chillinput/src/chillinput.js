/**
 * ChillInput - Zero-dependency Input Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const wrapper = ChillInput.create({ label: 'Email', type: 'email', helper: 'We never share it', clearable: true });
 *   document.body.appendChild(wrapper);        // wrapper.input is the <input>, wrapper.destroy() removes listeners
 *   const inst = ChillInput.init('#name', { label: 'Name', maxLength: 40, showCharCount: true, onChange: v => {} });
 *   inst.getValue(); inst.setState('error'); inst.setHelper('Required'); inst.destroy();
 *
 * Options (init + create)
 *   label          ''         label text (TEXT only, never HTML)
 *   placeholder    ''
 *   type           'text'
 *   size           'md'       sm | md | lg
 *   state          'default'  default | error | success | warning   (error also sets aria-invalid)
 *   helper         ''         helper / error text (TEXT only); linked with aria-describedby
 *   required, disabled, readonly   false
 *   maxLength      null       sets maxlength
 *   showCharCount  false      "12/40" counter (needs maxLength)
 *   clearable      false      clear button (shown when there is text; Escape also clears)
 *   prefix/suffix  null       icon slots: Node, plain text, or markup starting with "<" (sanitised: scripts, on* attrs,
 *                             javascript: URLs removed)
 *   name, id, autocomplete, value
 *   onChange(value, event)    fired on every input event
 *   onClear()
 * init(selector): when the target is an <input> it is MOVED into the wrapper (attributes/listeners preserved) and put
 *   back on destroy(); any other element is replaced by a new input.
 * Instance: getValue, setValue(v), clear, setState, setHelper(text), setDisabled, focus, blur, destroy
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillinput_css_injected__';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillinput-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillinput-styles';
        style.textContent = `
      :root {
        --chillinput-bg: #ffffff;
        --chillinput-text: #171717;
        --chillinput-placeholder: #9ca3af;
        --chillinput-border: #e5e5e5;
        --chillinput-border-focus: #3b82f6;
        --chillinput-border-error: #ef4444;
        --chillinput-border-success: #22c55e;
        --chillinput-border-warning: #f59e0b;
        --chillinput-label: #374151;
        --chillinput-helper: #6b7280;
        --chillinput-error: #ef4444;
        --chillinput-success: #22c55e;
        --chillinput-disabled-bg: #f3f4f6;
        --chillinput-disabled-text: #9ca3af;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillinput-bg: #262626;
          --chillinput-text: #fafafa;
          --chillinput-placeholder: #6b7280;
          --chillinput-border: #404040;
          --chillinput-label: #d1d5db;
          --chillinput-helper: #9ca3af;
          --chillinput-disabled-bg: #374151;
          --chillinput-disabled-text: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillinput-bg: #262626;
        --chillinput-text: #fafafa;
        --chillinput-placeholder: #6b7280;
        --chillinput-border: #404040;
        --chillinput-label: #d1d5db;
        --chillinput-helper: #9ca3af;
        --chillinput-disabled-bg: #374151;
        --chillinput-disabled-text: #6b7280;
      }

      .chillinput-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .chillinput-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillinput-label);
      }

      .chillinput-label-required::after {
        content: ' *';
        color: var(--chillinput-error);
      }

      .chillinput-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .chillinput {
        box-sizing: border-box;
        width: 100%;
        padding: 10px 14px;
        font-size: 14px;
        font-family: inherit;
        color: var(--chillinput-text);
        background: var(--chillinput-bg);
        border: 1px solid var(--chillinput-border);
        border-radius: 8px;
        outline: none;
        transition: all 0.2s ease;
      }

      .chillinput::placeholder {
        color: var(--chillinput-placeholder);
      }

      .chillinput:focus,
      .chillinput:focus-visible {
        border-color: var(--chillinput-border-focus);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }

      .chillinput:disabled {
        background: var(--chillinput-disabled-bg);
        color: var(--chillinput-disabled-text);
        cursor: not-allowed;
      }

      .chillinput:read-only:not(:disabled) {
        background: var(--chillinput-disabled-bg);
      }

      .chillinput-error .chillinput {
        border-color: var(--chillinput-border-error);
      }

      .chillinput-error .chillinput:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
      }

      .chillinput-success .chillinput {
        border-color: var(--chillinput-border-success);
      }

      .chillinput-success .chillinput:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
      }

      .chillinput-warning .chillinput {
        border-color: var(--chillinput-border-warning);
      }

      .chillinput-warning .chillinput:focus {
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
      }

      /* Sizes */
      .chillinput-sm .chillinput {
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 6px;
      }

      .chillinput-lg .chillinput {
        padding: 14px 18px;
        font-size: 16px;
        border-radius: 10px;
      }

      /* Icons */
      .chillinput-has-prefix .chillinput {
        padding-left: 40px;
      }

      .chillinput-has-suffix .chillinput {
        padding-right: 40px;
      }

      .chillinput-prefix,
      .chillinput-suffix {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 100%;
        color: var(--chillinput-placeholder);
        pointer-events: none;
      }

      .chillinput-prefix {
        left: 0;
      }

      .chillinput-suffix {
        right: 0;
      }

      .chillinput-prefix svg,
      .chillinput-suffix svg {
        width: 18px;
        height: 18px;
      }

      .chillinput-suffix-clickable {
        pointer-events: auto;
        cursor: pointer;
      }

      /* Helper Text */
      .chillinput-helper {
        font-size: 12px;
        color: var(--chillinput-helper);
      }

      .chillinput-error .chillinput-helper {
        color: var(--chillinput-error);
      }

      .chillinput-success .chillinput-helper {
        color: var(--chillinput-success);
      }

      /* Character Count */
      .chillinput-char-count {
        font-size: 12px;
        color: var(--chillinput-helper);
        text-align: right;
      }

      .chillinput-char-count-exceeded {
        color: var(--chillinput-error);
      }

      /* With Clear Button */
      .chillinput-clearable .chillinput {
        padding-right: 40px;
      }

      .chillinput-clear {
        position: absolute;
        right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        padding: 0;
        background: var(--chillinput-border);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .chillinput-has-value .chillinput-clear {
        opacity: 1;
        pointer-events: auto;
      }

      .chillinput-clear:focus-visible {
        outline: 2px solid var(--chillinput-border-focus);
        outline-offset: 1px;
      }

      .chillinput-clear svg {
        width: 12px;
        height: 12px;
        color: var(--chillinput-text);
      }

      @media (prefers-reduced-motion: reduce) {
        .chillinput, .chillinput-clear { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form'];

    function sanitizeHtml(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(html);
        const root = tpl.content;
        BLOCKED_TAGS.forEach(t => root.querySelectorAll(t).forEach(n => n.parentNode && n.parentNode.removeChild(n)));
        root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(a => {
                const name = a.name.toLowerCase();
                const val = a.value.replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
                if (name.indexOf('on') === 0 || name === 'srcdoc' ||
                    ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action' || name === 'formaction') &&
                        (val.indexOf('javascript:') === 0 || val.indexOf('vbscript:') === 0 || val.indexOf('data:text/html') === 0))) {
                    el.removeAttribute(a.name);
                }
            });
        });
        return root;
    }

    function fillSlot(el, value) {
        if (value && value.nodeType) el.appendChild(value);
        else if (typeof value === 'string' && value.trim().charAt(0) === '<') el.appendChild(sanitizeHtml(value));
        else el.textContent = String(value);
    }

    function clearIcon() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', 'M18 6L6 18M6 6l12 12');
        svg.appendChild(p);
        return svg;
    }

    // ---- Instance -----------------------------------------------------------

    class ChillInputInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);

            this.options = {
                label: options.label || '',
                placeholder: options.placeholder || '',
                type: options.type || 'text',
                size: options.size || 'md',
                state: options.state || 'default',
                helper: options.helper || '',
                required: options.required || false,
                disabled: options.disabled || false,
                readonly: options.readonly || false,
                maxLength: options.maxLength || null,
                showCharCount: options.showCharCount || false,
                clearable: options.clearable || false,
                prefix: options.prefix || null,
                suffix: options.suffix || null,
                onChange: options.onChange || null,
                onClear: options.onClear || null,
                name: options.name,
                id: options.id,
                autocomplete: options.autocomplete,
                value: options.value
            };
            this._cleanup = [];

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        render() {
            const o = this.options;
            const wrapper = document.createElement('div');
            wrapper.className = `chillinput-wrapper chillinput-${o.size}`;
            if (o.state !== 'default') wrapper.classList.add(`chillinput-${o.state}`);

            // reuse the existing <input> when enhancing one
            const reuse = this.element && this.element.tagName === 'INPUT';
            const input = reuse ? this.element : document.createElement('input');
            this._reused = !!reuse;
            this._addedAttrs = [];

            if (!reuse || o.type !== 'text') input.type = String(o.type);
            input.classList.add('chillinput');
            if (!input.id) { input.id = 'chillinput-' + (++uid); this._addedAttrs.push('id'); }
            if (o.id) input.id = String(o.id);
            if (o.placeholder) input.placeholder = String(o.placeholder);
            if (o.name) input.name = String(o.name);
            if (o.autocomplete) input.setAttribute('autocomplete', String(o.autocomplete));
            if (o.disabled) input.disabled = true;
            if (o.readonly) input.readOnly = true;
            if (o.required) { input.required = true; }
            if (o.maxLength) input.setAttribute('maxlength', String(o.maxLength));
            if (o.value !== undefined && o.value !== null) input.value = String(o.value);

            if (o.label) {
                const label = document.createElement('label');
                label.className = 'chillinput-label' + (o.required ? ' chillinput-label-required' : '');
                label.setAttribute('for', input.id);
                label.textContent = String(o.label);
                wrapper.appendChild(label);
            }

            const container = document.createElement('div');
            container.className = 'chillinput-container';
            if (o.prefix) container.classList.add('chillinput-has-prefix');
            if (o.suffix || o.clearable) container.classList.add('chillinput-has-suffix');
            if (o.clearable) container.classList.add('chillinput-clearable');

            if (o.prefix) {
                const p = document.createElement('span');
                p.className = 'chillinput-prefix';
                p.setAttribute('aria-hidden', 'true');
                fillSlot(p, o.prefix);
                container.appendChild(p);
            }

            // place wrapper where the original element was, then move the input inside
            if (this.element && this.element.parentNode) {
                this.element.parentNode.insertBefore(wrapper, this.element);
                this._placeholderNode = document.createComment('chillinput');
                wrapper.parentNode.insertBefore(this._placeholderNode, wrapper);
                if (!reuse) this.element.parentNode.removeChild(this.element);
            }
            container.appendChild(input);

            if (o.clearable) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chillinput-clear';
                btn.tabIndex = -1;
                btn.setAttribute('aria-label', 'Clear');
                btn.appendChild(clearIcon());
                container.appendChild(btn);
            }

            if (o.suffix) {
                const s = document.createElement('span');
                s.className = 'chillinput-suffix';
                s.setAttribute('aria-hidden', 'true');
                fillSlot(s, o.suffix);
                container.appendChild(s);
            }
            wrapper.appendChild(container);

            if (o.helper) {
                const h = document.createElement('span');
                h.className = 'chillinput-helper';
                h.id = input.id + '-helper';
                h.textContent = String(o.helper);
                wrapper.appendChild(h);
            }
            if (o.showCharCount && o.maxLength) {
                const c = document.createElement('span');
                c.className = 'chillinput-char-count';
                c.id = input.id + '-count';
                c.textContent = `${input.value.length}/${o.maxLength}`;
                wrapper.appendChild(c);
            }

            this.wrapper = wrapper;
            this.input = input;
            this._prevDescribedBy = input.getAttribute('aria-describedby');
            this._prevInvalid = input.getAttribute('aria-invalid');
            this._syncAria();
            this._syncHasValue();
        }

        _syncAria() {
            const ids = [];
            const h = this.wrapper.querySelector('.chillinput-helper');
            const c = this.wrapper.querySelector('.chillinput-char-count');
            if (h) ids.push(h.id);
            if (c) ids.push(c.id);
            if (ids.length) this.input.setAttribute('aria-describedby', ids.join(' '));
            else if (this._prevDescribedBy) this.input.setAttribute('aria-describedby', this._prevDescribedBy);
            else this.input.removeAttribute('aria-describedby');
            if (this.options.state === 'error') this.input.setAttribute('aria-invalid', 'true');
            else if (this._prevInvalid !== null) this.input.setAttribute('aria-invalid', this._prevInvalid);
            else this.input.removeAttribute('aria-invalid');
        }

        _syncHasValue() {
            const container = this.wrapper.querySelector('.chillinput-container');
            container.classList.toggle('chillinput-has-value', this.input.value !== '');
        }

        bindEvents() {
            const on = (target, type, fn) => {
                target.addEventListener(type, fn);
                this._cleanup.push(() => target.removeEventListener(type, fn));
            };

            on(this.input, 'input', (e) => {
                this.updateCharCount();
                this._syncHasValue();
                if (this.options.onChange) this.options.onChange(e.target.value, e);
            });

            if (this.options.clearable) {
                const clearBtn = this.wrapper.querySelector('.chillinput-clear');
                if (clearBtn) on(clearBtn, 'click', () => this.clear());
                on(this.input, 'keydown', (e) => {
                    if (e.key === 'Escape' && this.input.value !== '' && !this.input.disabled && !this.input.readOnly) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.clear();
                    }
                });
            }
        }

        updateCharCount() {
            const countEl = this.wrapper.querySelector('.chillinput-char-count');
            if (countEl && this.options.maxLength) {
                const length = this.input.value.length;
                countEl.textContent = `${length}/${this.options.maxLength}`;
                countEl.classList.toggle('chillinput-char-count-exceeded', length > this.options.maxLength);
            }
        }

        getValue() {
            return this.input.value;
        }

        setValue(value) {
            this.input.value = value;
            this.updateCharCount();
            this._syncHasValue();
        }

        clear() {
            this.input.value = '';
            this.updateCharCount();
            this._syncHasValue();
            // keep onChange consumers (and frameworks listening to "input") in sync
            this.input.dispatchEvent(new window.Event('input', { bubbles: true }));
            if (this.options.onClear) {
                this.options.onClear();
            }
            this.input.focus();
        }

        setState(state) {
            this.wrapper.classList.remove(`chillinput-${this.options.state}`);
            if (state !== 'default') {
                this.wrapper.classList.add(`chillinput-${state}`);
            }
            this.options.state = state;
            this._syncAria();
        }

        setHelper(text) {
            let helperEl = this.wrapper.querySelector('.chillinput-helper');
            if (!helperEl) {
                helperEl = document.createElement('span');
                helperEl.className = 'chillinput-helper';
                helperEl.id = this.input.id + '-helper';
                const count = this.wrapper.querySelector('.chillinput-char-count');
                this.wrapper.insertBefore(helperEl, count || null);
            }
            helperEl.textContent = text;
            this.options.helper = text;
            this._syncAria();
        }

        setDisabled(disabled) {
            this.input.disabled = disabled;
            this.options.disabled = disabled;
        }

        focus() {
            this.input.focus();
        }

        blur() {
            this.input.blur();
        }

        destroy() {
            if (!this.wrapper) return;
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            const input = this.input;
            const wrapper = this.wrapper;
            if (this.element && this._placeholderNode && this._placeholderNode.parentNode) {
                // put the input back where the wrapper was
                input.classList.remove('chillinput');
                if (this._reused) {
                    this._addedAttrs.forEach(a => {
                        if (a === 'id') input.removeAttribute('id');
                    });
                }
                if (this._prevDescribedBy) input.setAttribute('aria-describedby', this._prevDescribedBy);
                else input.removeAttribute('aria-describedby');
                if (this._prevInvalid !== null) input.setAttribute('aria-invalid', this._prevInvalid);
                else input.removeAttribute('aria-invalid');
                wrapper.parentNode.insertBefore(input, wrapper);
                this._placeholderNode.parentNode.removeChild(this._placeholderNode);
            }
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            this.wrapper = null;
        }
    }

    function createInput(options = {}) {
        const inst = new ChillInputInstance(null, options);
        const wrapper = inst.wrapper;
        // additive helpers on the returned element (return type is still the wrapper div)
        wrapper.input = inst.input;
        wrapper.instance = inst;
        wrapper.destroy = function () { inst.destroy(); };
        return wrapper;
    }

    const ChillInput = {
        version: VERSION,

        init(selector, options) {
            return new ChillInputInstance(selector, options);
        },

        create(options) {
            return createInput(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillInput;
    } else {
        window.ChillInput = ChillInput;
    }

})(typeof window !== 'undefined' ? window : this);
