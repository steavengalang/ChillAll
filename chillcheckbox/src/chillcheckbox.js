/**
 * ChillCheckbox - Zero-dependency Checkbox Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const w = ChillCheckbox.create({ label: 'Accept terms', description: 'You must agree', onChange: c => {} });
 *   document.body.appendChild(w);               // w.input / w.instance / w.destroy()
 *   const inst = ChillCheckbox.init('#agree', { label: 'Agree' });   // an existing <input type="checkbox"> is MOVED into the
 *                                                                    // wrapper (attributes/listeners kept) and restored on destroy()
 *   const g = ChillCheckbox.createGroup({ label: 'Toppings', name: 'top', items: [{ value: 'a', label: 'A' }], value: ['a'], onChange: v => {} });
 *   g.getValues(); g.setValues(['a']); g.destroy();
 *
 * Options: checked, indeterminate, disabled, required, label, description (TEXT only, never HTML), size 'md' (sm|md|lg),
 *   state 'default' (default|error|success; error sets aria-invalid), name, value (any, incl. 0), onChange(checked, event)
 * Instance: isChecked, setChecked, setIndeterminate, toggle, setDisabled, setState, getValue, destroy
 * Group: role="group" + aria-labelledby; options label, items, value[], horizontal, name, disabled, onChange(values[])
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chillcheckbox_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillcheckbox-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillcheckbox-styles';
        style.textContent = `
      :root {
        --chillcheckbox-bg: #ffffff;
        --chillcheckbox-border: #d1d5db;
        --chillcheckbox-border-hover: #9ca3af;
        --chillcheckbox-checked: #3b82f6;
        --chillcheckbox-checked-hover: #2563eb;
        --chillcheckbox-text: #171717;
        --chillcheckbox-text-muted: #6b7280;
        --chillcheckbox-disabled: #e5e7eb;
        --chillcheckbox-disabled-text: #9ca3af;
        --chillcheckbox-error: #ef4444;
        --chillcheckbox-success: #22c55e;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillcheckbox-bg: #262626;
          --chillcheckbox-border: #525252;
          --chillcheckbox-border-hover: #737373;
          --chillcheckbox-text: #fafafa;
          --chillcheckbox-text-muted: #a3a3a3;
          --chillcheckbox-disabled: #404040;
          --chillcheckbox-disabled-text: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillcheckbox-bg: #262626;
        --chillcheckbox-border: #525252;
        --chillcheckbox-border-hover: #737373;
        --chillcheckbox-text: #fafafa;
        --chillcheckbox-text-muted: #a3a3a3;
        --chillcheckbox-disabled: #404040;
        --chillcheckbox-disabled-text: #6b7280;
      }

      .chillcheckbox-wrapper {
        display: inline-flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        font-size: 14px;
        color: var(--chillcheckbox-text);
        user-select: none;
      }

      .chillcheckbox-wrapper.disabled {
        cursor: not-allowed;
        color: var(--chillcheckbox-disabled-text);
      }

      .chillcheckbox-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .chillcheckbox-box {
        position: relative;
        width: 20px;
        height: 20px;
        background: var(--chillcheckbox-bg);
        border: 2px solid var(--chillcheckbox-border);
        border-radius: 4px;
        flex-shrink: 0;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chillcheckbox-wrapper:hover:not(.disabled) .chillcheckbox-box {
        border-color: var(--chillcheckbox-border-hover);
      }

      .chillcheckbox-input:focus-visible + .chillcheckbox-box {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .chillcheckbox-input:checked + .chillcheckbox-box {
        background: var(--chillcheckbox-checked);
        border-color: var(--chillcheckbox-checked);
      }

      .chillcheckbox-wrapper:hover:not(.disabled) .chillcheckbox-input:checked + .chillcheckbox-box {
        background: var(--chillcheckbox-checked-hover);
        border-color: var(--chillcheckbox-checked-hover);
      }

      .chillcheckbox-input:indeterminate + .chillcheckbox-box {
        background: var(--chillcheckbox-checked);
        border-color: var(--chillcheckbox-checked);
      }

      .chillcheckbox-input:disabled + .chillcheckbox-box {
        background: var(--chillcheckbox-disabled);
        border-color: var(--chillcheckbox-disabled);
        cursor: not-allowed;
      }

      .chillcheckbox-checkmark {
        width: 12px;
        height: 12px;
        color: white;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.15s ease;
      }

      .chillcheckbox-input:checked + .chillcheckbox-box .chillcheckbox-checkmark {
        opacity: 1;
        transform: scale(1);
      }

      .chillcheckbox-indeterminate-mark {
        width: 10px;
        height: 2px;
        background: white;
        border-radius: 1px;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.15s ease;
      }

      .chillcheckbox-input:indeterminate + .chillcheckbox-box .chillcheckbox-indeterminate-mark {
        opacity: 1;
        transform: scale(1);
      }

      .chillcheckbox-input:indeterminate + .chillcheckbox-box .chillcheckbox-checkmark {
        display: none;
      }

      .chillcheckbox-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 1px;
      }

      .chillcheckbox-label {
        font-weight: 500;
        line-height: 1.4;
      }

      .chillcheckbox-description {
        font-size: 13px;
        color: var(--chillcheckbox-text-muted);
        line-height: 1.4;
      }

      /* Sizes */
      .chillcheckbox-sm .chillcheckbox-box {
        width: 16px;
        height: 16px;
        border-radius: 3px;
      }

      .chillcheckbox-sm .chillcheckbox-checkmark {
        width: 10px;
        height: 10px;
      }

      .chillcheckbox-sm .chillcheckbox-indeterminate-mark {
        width: 8px;
      }

      .chillcheckbox-lg .chillcheckbox-box {
        width: 24px;
        height: 24px;
        border-radius: 5px;
      }

      .chillcheckbox-lg .chillcheckbox-checkmark {
        width: 14px;
        height: 14px;
      }

      .chillcheckbox-lg .chillcheckbox-indeterminate-mark {
        width: 12px;
        height: 3px;
      }

      /* States */
      .chillcheckbox-error .chillcheckbox-box {
        border-color: var(--chillcheckbox-error);
      }

      .chillcheckbox-error .chillcheckbox-input:checked + .chillcheckbox-box {
        background: var(--chillcheckbox-error);
        border-color: var(--chillcheckbox-error);
      }

      .chillcheckbox-success .chillcheckbox-input:checked + .chillcheckbox-box {
        background: var(--chillcheckbox-success);
        border-color: var(--chillcheckbox-success);
      }

      /* Group */
      .chillcheckbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chillcheckbox-group-horizontal {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 16px;
      }

      .chillcheckbox-group-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillcheckbox-text);
        margin-bottom: 8px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillcheckbox-box, .chillcheckbox-circle, .chillcheckbox-track, .chillcheckbox-thumb, .chillcheckbox-checkmark, .chillcheckbox-dot, .chillcheckbox-indeterminate-mark, .chillcheckbox-track-label, .chillcheckbox-thumb-icon { transition: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const token = v => String(v).replace(/[^a-zA-Z0-9_-]/g, '');

    function checkSvg() {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'chillcheckbox-checkmark');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '3');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', 'M20 6L9 17l-5-5');
        svg.appendChild(p);
        return svg;
    }

    function textSpan(cls, text) {
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = String(text);
        return s;
    }

    // ---- Instance -----------------------------------------------------------

    class ChillCheckboxInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);
            const reuse = !!this.element && this.element.tagName === 'INPUT';
            const el = reuse ? this.element : null;

            this.options = {
                checked: options.checked !== undefined ? !!options.checked : (el ? el.checked : false),
                indeterminate: options.indeterminate || false,
                disabled: options.disabled !== undefined ? !!options.disabled : (el ? el.disabled : false),
                required: options.required !== undefined ? !!options.required : (el ? el.required : false),
                label: options.label || '',
                description: options.description || '',
                size: options.size || 'md',
                state: options.state || 'default',
                name: options.name || (el ? el.name : '') || '',
                value: options.value !== undefined ? options.value : (el && el.hasAttribute('value') ? el.value : ''),
                onChange: options.onChange || null
            };
            this._reused = reuse;
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
            const wrapper = document.createElement('label');
            wrapper.className = `chillcheckbox-wrapper chillcheckbox-${o.size}`;
            if (o.disabled) wrapper.classList.add('disabled');
            if (o.state !== 'default') wrapper.classList.add(`chillcheckbox-${token(o.state)}`);

            const input = this._reused ? this.element : document.createElement('input');
            input.type = 'checkbox';
            input.classList.add('chillcheckbox-input');
            input.checked = !!o.checked;
            input.disabled = !!o.disabled;
            if (o.required) input.required = true;
            if (o.name) input.name = String(o.name);
            if (o.value !== '' && o.value !== undefined && o.value !== null) input.value = String(o.value);

            const box = document.createElement('span');
            box.className = 'chillcheckbox-box';
            box.setAttribute('aria-hidden', 'true');
            box.appendChild(checkSvg());
            const mark = document.createElement('span');
            mark.className = 'chillcheckbox-indeterminate-mark';
            box.appendChild(mark);

            // place the wrapper where the original element was
            if (this.element && this.element.parentNode) {
                this._marker = document.createComment('chillcheckbox');
                this.element.parentNode.insertBefore(this._marker, this.element);
                this.element.parentNode.insertBefore(wrapper, this.element);
                if (!this._reused) this.element.parentNode.removeChild(this.element);
            }
            wrapper.appendChild(input);
            wrapper.appendChild(box);

            this._prevDescribedBy = input.getAttribute('aria-describedby');
            if (o.label || o.description) {
                const content = document.createElement('span');
                content.className = 'chillcheckbox-content';
                if (o.label) content.appendChild(textSpan('chillcheckbox-label', o.label));
                if (o.description) {
                    const d = textSpan('chillcheckbox-description', o.description);
                    d.id = 'chillcheckbox-desc-' + (++uid);
                    content.appendChild(d);
                    input.setAttribute('aria-describedby', d.id);
                }
                wrapper.appendChild(content);
            }

            this.wrapper = wrapper;
            this.input = input;
            this._prevInvalid = input.getAttribute('aria-invalid');
            if (o.state === 'error') input.setAttribute('aria-invalid', 'true');
            if (o.indeterminate) input.indeterminate = true;
        }

        bindEvents() {
            const handler = (e) => {
                this.options.checked = e.target.checked;
                this.options.indeterminate = false;

                if (this.options.onChange) {
                    this.options.onChange(e.target.checked, e);
                }
            };
            this.input.addEventListener('change', handler);
            this._cleanup.push(() => this.input.removeEventListener('change', handler));
        }

        isChecked() {
            return this.input.checked;
        }

        setChecked(checked) {
            this.input.checked = checked;
            this.options.checked = checked;
            this.options.indeterminate = false;
            this.input.indeterminate = false;
        }

        setIndeterminate(indeterminate) {
            this.input.indeterminate = indeterminate;
            this.options.indeterminate = indeterminate;
        }

        toggle() {
            this.setChecked(!this.input.checked);
        }

        setDisabled(disabled) {
            this.input.disabled = disabled;
            this.options.disabled = disabled;
            this.wrapper.classList.toggle('disabled', disabled);
        }

        setState(state) {
            this.wrapper.classList.remove(`chillcheckbox-${token(this.options.state)}`);
            if (state !== 'default') {
                this.wrapper.classList.add(`chillcheckbox-${token(state)}`);
            }
            this.options.state = state;
            if (state === 'error') this.input.setAttribute('aria-invalid', 'true');
            else if (this._prevInvalid !== null) this.input.setAttribute('aria-invalid', this._prevInvalid);
            else this.input.removeAttribute('aria-invalid');
        }

        getValue() {
            return this.options.value;
        }

        destroy() {
            if (!this.wrapper) return;
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            const input = this.input;
            if (this.element && this._marker && this._marker.parentNode) {
                input.classList.remove('chillcheckbox-input');
                if (this._prevDescribedBy) input.setAttribute('aria-describedby', this._prevDescribedBy);
                else input.removeAttribute('aria-describedby');
                if (this._prevInvalid !== null) input.setAttribute('aria-invalid', this._prevInvalid);
                else input.removeAttribute('aria-invalid');
                this.wrapper.parentNode.insertBefore(input, this.wrapper);
                this._marker.parentNode.removeChild(this._marker);
            }
            if (this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
            this.wrapper = null;
        }
    }

    function createCheckbox(options = {}) {
        const inst = new ChillCheckboxInstance(null, options);
        const wrapper = inst.wrapper;
        // additive helpers on the returned element
        wrapper.input = inst.input;
        wrapper.instance = inst;
        wrapper.destroy = function () { inst.destroy(); };
        return wrapper;
    }

    function createCheckboxGroup(options = {}) {
        injectCSS();

        const group = document.createElement('div');
        group.className = `chillcheckbox-group ${options.horizontal ? 'chillcheckbox-group-horizontal' : ''}`;
        group.setAttribute('role', 'group');

        if (options.label) {
            const label = document.createElement('div');
            label.className = 'chillcheckbox-group-label';
            label.id = 'chillcheckbox-group-label-' + (++uid);
            label.textContent = String(options.label);
            group.setAttribute('aria-labelledby', label.id);
            group.appendChild(label);
        }

        const instances = [];
        const values = options.value || [];

        (options.items || []).forEach(item => {
            const instance = new ChillCheckboxInstance(null, {
                ...item,
                name: item.name || options.name || '',
                disabled: item.disabled !== undefined ? item.disabled : !!options.disabled,
                checked: values.includes(item.value),
                onChange: () => {
                    if (options.onChange) {
                        options.onChange(instances
                            .filter(inst => inst.isChecked())
                            .map(inst => inst.getValue()));
                    }
                }
            });
            instances.push(instance);
            group.appendChild(instance.wrapper);
        });

        group._instances = instances;
        group.getValues = () => instances.filter(i => i.isChecked()).map(i => i.getValue());
        group.setValues = (vals) => instances.forEach(i => i.setChecked(vals.includes(i.getValue())));
        group.destroy = () => {
            instances.forEach(i => i.destroy());
            instances.length = 0;
            if (group.parentNode) group.parentNode.removeChild(group);
        };

        return group;
    }

    const ChillCheckbox = {
        version: VERSION,

        init(selector, options) {
            return new ChillCheckboxInstance(selector, options);
        },

        create(options) {
            return createCheckbox(options);
        },

        createGroup(options) {
            return createCheckboxGroup(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillCheckbox;
    } else {
        window.ChillCheckbox = ChillCheckbox;
    }

})(typeof window !== 'undefined' ? window : this);
