/**
 * ChillTextarea - Zero-dependency Textarea Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const w = ChillTextarea.create({ label: 'Bio', maxLength: 200, showCharCount: true, autoResize: true });
 *   document.body.appendChild(w);               // w.textarea is the <textarea>, w.destroy() cleans up
 *   const inst = ChillTextarea.init('#notes', { label: 'Notes', onChange: v => {} });
 *
 * Options (init + create)
 *   label, placeholder, helper   TEXT only (never HTML)
 *   size 'md' (sm|md|lg), state 'default' (default|error|success; error sets aria-invalid)
 *   rows 4, required, disabled, readonly
 *   maxLength null, showCharCount false   "12/200" counter
 *   autoResize false, maxRows null        grow with content (optionally capped at maxRows lines)
 *   noResize false                        hide the resize handle
 *   name, id, value
 *   onChange(value, event)
 * init(selector): an existing <textarea> is MOVED into the wrapper (attributes/listeners preserved) and restored on
 *   destroy(); any other element is replaced by a new textarea.
 * Instance: getValue, setValue(v), clear, setState, setHelper(text), setDisabled, focus, blur, autoResize, destroy
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chilltextarea_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chilltextarea-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chilltextarea-styles';
        style.textContent = `
      :root {
        --chilltextarea-bg: #ffffff;
        --chilltextarea-text: #171717;
        --chilltextarea-placeholder: #9ca3af;
        --chilltextarea-border: #e5e5e5;
        --chilltextarea-border-focus: #3b82f6;
        --chilltextarea-border-error: #ef4444;
        --chilltextarea-border-success: #22c55e;
        --chilltextarea-label: #374151;
        --chilltextarea-helper: #6b7280;
        --chilltextarea-error: #ef4444;
        --chilltextarea-disabled-bg: #f3f4f6;
        --chilltextarea-disabled-text: #9ca3af;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltextarea-bg: #262626;
          --chilltextarea-text: #fafafa;
          --chilltextarea-placeholder: #6b7280;
          --chilltextarea-border: #404040;
          --chilltextarea-label: #d1d5db;
          --chilltextarea-helper: #9ca3af;
          --chilltextarea-disabled-bg: #374151;
          --chilltextarea-disabled-text: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilltextarea-bg: #262626;
        --chilltextarea-text: #fafafa;
        --chilltextarea-placeholder: #6b7280;
        --chilltextarea-border: #404040;
        --chilltextarea-label: #d1d5db;
        --chilltextarea-helper: #9ca3af;
        --chilltextarea-disabled-bg: #374151;
        --chilltextarea-disabled-text: #6b7280;
      }

      .chilltextarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .chilltextarea-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chilltextarea-label);
      }

      .chilltextarea-label-required::after {
        content: ' *';
        color: var(--chilltextarea-error);
      }

      .chilltextarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 100px;
        padding: 12px 14px;
        font-size: 14px;
        font-family: inherit;
        color: var(--chilltextarea-text);
        background: var(--chilltextarea-bg);
        border: 1px solid var(--chilltextarea-border);
        border-radius: 8px;
        outline: none;
        resize: vertical;
        transition: all 0.2s ease;
        line-height: 1.5;
      }

      .chilltextarea::placeholder {
        color: var(--chilltextarea-placeholder);
      }

      .chilltextarea:focus,
      .chilltextarea:focus-visible {
        border-color: var(--chilltextarea-border-focus);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }

      .chilltextarea:disabled {
        background: var(--chilltextarea-disabled-bg);
        color: var(--chilltextarea-disabled-text);
        cursor: not-allowed;
        resize: none;
      }

      .chilltextarea-error .chilltextarea {
        border-color: var(--chilltextarea-border-error);
      }

      .chilltextarea-error .chilltextarea:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
      }

      .chilltextarea-success .chilltextarea {
        border-color: var(--chilltextarea-border-success);
      }

      .chilltextarea-success .chilltextarea:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
      }

      /* Sizes */
      .chilltextarea-sm .chilltextarea {
        min-height: 60px;
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 6px;
      }

      .chilltextarea-lg .chilltextarea {
        min-height: 150px;
        padding: 16px 18px;
        font-size: 16px;
        border-radius: 10px;
      }

      /* Auto Resize */
      .chilltextarea-autoresize .chilltextarea {
        resize: none;
        overflow: hidden;
      }

      /* No Resize */
      .chilltextarea-noresize .chilltextarea {
        resize: none;
      }

      /* Helper Text */
      .chilltextarea-helper {
        font-size: 12px;
        color: var(--chilltextarea-helper);
      }

      .chilltextarea-error .chilltextarea-helper {
        color: var(--chilltextarea-error);
      }

      /* Character Count */
      .chilltextarea-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chilltextarea-char-count {
        font-size: 12px;
        color: var(--chilltextarea-helper);
        margin-left: auto;
      }

      .chilltextarea-char-count-exceeded {
        color: var(--chilltextarea-error);
      }

      @media (prefers-reduced-motion: reduce) {
        .chilltextarea { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    class ChillTextareaInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);

            this.options = {
                label: options.label || '',
                placeholder: options.placeholder || '',
                size: options.size || 'md',
                state: options.state || 'default',
                helper: options.helper || '',
                required: options.required || false,
                disabled: options.disabled || false,
                readonly: options.readonly || false,
                maxLength: options.maxLength || null,
                showCharCount: options.showCharCount || false,
                autoResize: options.autoResize || false,
                maxRows: options.maxRows || null,
                noResize: options.noResize || false,
                rows: options.rows || 4,
                onChange: options.onChange || null,
                name: options.name,
                id: options.id,
                value: options.value
            };
            this._cleanup = [];

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
            if (this.options.autoResize) this.autoResize();
        }

        render() {
            const o = this.options;
            const wrapper = document.createElement('div');
            wrapper.className = `chilltextarea-wrapper chilltextarea-${o.size}`;
            if (o.state !== 'default') wrapper.classList.add(`chilltextarea-${o.state}`);
            if (o.autoResize) wrapper.classList.add('chilltextarea-autoresize');
            if (o.noResize) wrapper.classList.add('chilltextarea-noresize');

            const reuse = !!this.element && this.element.tagName === 'TEXTAREA';
            const textarea = reuse ? this.element : document.createElement('textarea');
            this._reused = reuse;
            textarea.classList.add('chilltextarea');
            this._generatedId = false;
            if (!textarea.id) { textarea.id = 'chilltextarea-' + (++uid); this._generatedId = true; }
            if (o.id) { textarea.id = String(o.id); this._generatedId = false; }
            if (o.placeholder) textarea.placeholder = String(o.placeholder);
            if (!reuse || o.rows !== 4) textarea.rows = o.rows;
            if (o.name) textarea.name = String(o.name);
            if (o.disabled) textarea.disabled = true;
            if (o.readonly) textarea.readOnly = true;
            if (o.required) textarea.required = true;
            if (o.maxLength) textarea.setAttribute('maxlength', String(o.maxLength));
            if (o.value !== undefined && o.value !== null) textarea.value = String(o.value);

            if (o.label) {
                const label = document.createElement('label');
                label.className = 'chilltextarea-label' + (o.required ? ' chilltextarea-label-required' : '');
                label.setAttribute('for', textarea.id);
                label.textContent = String(o.label);
                wrapper.appendChild(label);
            }

            if (this.element && this.element.parentNode) {
                this.element.parentNode.insertBefore(wrapper, this.element);
                this._marker = document.createComment('chilltextarea');
                wrapper.parentNode.insertBefore(this._marker, wrapper);
                if (!reuse) this.element.parentNode.removeChild(this.element);
            }
            wrapper.appendChild(textarea);

            if (o.helper || (o.showCharCount && o.maxLength)) {
                const footer = document.createElement('div');
                footer.className = 'chilltextarea-footer';
                if (o.helper) {
                    const h = document.createElement('span');
                    h.className = 'chilltextarea-helper';
                    h.id = textarea.id + '-helper';
                    h.textContent = String(o.helper);
                    footer.appendChild(h);
                }
                if (o.showCharCount && o.maxLength) {
                    const c = document.createElement('span');
                    c.className = 'chilltextarea-char-count';
                    c.id = textarea.id + '-count';
                    c.textContent = `${textarea.value.length}/${o.maxLength}`;
                    footer.appendChild(c);
                }
                wrapper.appendChild(footer);
            }

            this.wrapper = wrapper;
            this.textarea = textarea;
            this._prevDescribedBy = textarea.getAttribute('aria-describedby');
            this._prevInvalid = textarea.getAttribute('aria-invalid');
            this._syncAria();
        }

        _syncAria() {
            const ids = [];
            const h = this.wrapper.querySelector('.chilltextarea-helper');
            const c = this.wrapper.querySelector('.chilltextarea-char-count');
            if (h) ids.push(h.id);
            if (c) ids.push(c.id);
            if (ids.length) this.textarea.setAttribute('aria-describedby', ids.join(' '));
            else if (this._prevDescribedBy) this.textarea.setAttribute('aria-describedby', this._prevDescribedBy);
            else this.textarea.removeAttribute('aria-describedby');
            if (this.options.state === 'error') this.textarea.setAttribute('aria-invalid', 'true');
            else if (this._prevInvalid !== null) this.textarea.setAttribute('aria-invalid', this._prevInvalid);
            else this.textarea.removeAttribute('aria-invalid');
        }

        bindEvents() {
            const handler = (e) => {
                this.updateCharCount();
                if (this.options.autoResize) {
                    this.autoResize();
                }
                if (this.options.onChange) {
                    this.options.onChange(e.target.value, e);
                }
            };
            this.textarea.addEventListener('input', handler);
            this._cleanup.push(() => this.textarea.removeEventListener('input', handler));
        }

        autoResize() {
            const ta = this.textarea;
            ta.style.height = 'auto';
            let h = ta.scrollHeight;
            if (this.options.maxRows && typeof window.getComputedStyle === 'function') {
                const cs = window.getComputedStyle(ta);
                const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.5;
                const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
                const max = lh * this.options.maxRows + pad;
                if (h > max) { h = max; ta.style.overflowY = 'auto'; } else ta.style.overflowY = 'hidden';
            }
            ta.style.height = h + 'px';
        }

        updateCharCount() {
            const countEl = this.wrapper.querySelector('.chilltextarea-char-count');
            if (countEl && this.options.maxLength) {
                const length = this.textarea.value.length;
                countEl.textContent = `${length}/${this.options.maxLength}`;
                countEl.classList.toggle('chilltextarea-char-count-exceeded', length > this.options.maxLength);
            }
        }

        getValue() {
            return this.textarea.value;
        }

        setValue(value) {
            this.textarea.value = value;
            this.updateCharCount();
            if (this.options.autoResize) {
                this.autoResize();
            }
        }

        clear() {
            this.setValue('');
        }

        setState(state) {
            this.wrapper.classList.remove(`chilltextarea-${this.options.state}`);
            if (state !== 'default') {
                this.wrapper.classList.add(`chilltextarea-${state}`);
            }
            this.options.state = state;
            this._syncAria();
        }

        setHelper(text) {
            let helperEl = this.wrapper.querySelector('.chilltextarea-helper');
            if (!helperEl) {
                let footer = this.wrapper.querySelector('.chilltextarea-footer');
                if (!footer) {
                    footer = document.createElement('div');
                    footer.className = 'chilltextarea-footer';
                    this.wrapper.appendChild(footer);
                }
                helperEl = document.createElement('span');
                helperEl.className = 'chilltextarea-helper';
                helperEl.id = this.textarea.id + '-helper';
                footer.insertBefore(helperEl, footer.firstChild);
            }
            helperEl.textContent = text;
            this.options.helper = text;
            this._syncAria();
        }

        setDisabled(disabled) {
            this.textarea.disabled = disabled;
            this.options.disabled = disabled;
        }

        focus() {
            this.textarea.focus();
        }

        blur() {
            this.textarea.blur();
        }

        destroy() {
            if (!this.wrapper) return;
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            const ta = this.textarea;
            if (this.element && this._marker && this._marker.parentNode) {
                ta.classList.remove('chilltextarea');
                if (this._generatedId) ta.removeAttribute('id');
                ta.style.height = '';
                if (this._prevDescribedBy) ta.setAttribute('aria-describedby', this._prevDescribedBy);
                else ta.removeAttribute('aria-describedby');
                if (this._prevInvalid !== null) ta.setAttribute('aria-invalid', this._prevInvalid);
                else ta.removeAttribute('aria-invalid');
                this.wrapper.parentNode.insertBefore(ta, this.wrapper);
                this._marker.parentNode.removeChild(this._marker);
            }
            if (this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
            this.wrapper = null;
        }
    }

    function createTextarea(options = {}) {
        const inst = new ChillTextareaInstance(null, options);
        const wrapper = inst.wrapper;
        // additive helpers on the returned element (return type is still the wrapper div)
        wrapper.textarea = inst.textarea;
        wrapper.instance = inst;
        wrapper.destroy = function () { inst.destroy(); };
        return wrapper;
    }

    const ChillTextarea = {
        version: VERSION,

        init(selector, options) {
            return new ChillTextareaInstance(selector, options);
        },

        create(options) {
            return createTextarea(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTextarea;
    } else {
        window.ChillTextarea = ChillTextarea;
    }

})(typeof window !== 'undefined' ? window : this);
