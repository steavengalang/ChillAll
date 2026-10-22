/**
 * ChillRadio - Zero-dependency Radio Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const g = ChillRadio.createGroup({ label: 'Plan', name: 'plan', items: [{ value: 'a', label: 'Free' }, { value: 'b', label: 'Pro', description: 'Best' }],
 *                                       value: 'a', onChange: v => {} });
 *   document.body.appendChild(g);  g.getValue(); g.setValue('b'); g.destroy();
 *   const r = ChillRadio.create({ label: 'One', name: 'x', value: '1' });          // single radio element (r.input, r.instance, r.destroy())
 *   const inst = ChillRadio.init('#r1', { label: 'One' });   // an existing <input type="radio"> is MOVED into the wrapper and restored on destroy()
 *
 * Options: checked, disabled, required, label, description (TEXT only), size 'md' (sm|md|lg), state 'default' (default|error|success),
 *   name, value, onChange(value, event)
 * Instance: isChecked, setChecked, setDisabled, setState, getValue, destroy
 * Group: role="radiogroup" + aria-labelledby; arrow keys are native (same name); options label, items, value, horizontal, name, disabled, onChange(value)
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chillradio_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillradio-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillradio-styles';
        style.textContent = `
      :root {
        --chillradio-bg: #ffffff;
        --chillradio-border: #d1d5db;
        --chillradio-border-hover: #9ca3af;
        --chillradio-checked: #3b82f6;
        --chillradio-checked-hover: #2563eb;
        --chillradio-text: #171717;
        --chillradio-text-muted: #6b7280;
        --chillradio-disabled: #e5e7eb;
        --chillradio-disabled-text: #9ca3af;
        --chillradio-error: #ef4444;
        --chillradio-success: #22c55e;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillradio-bg: #262626;
          --chillradio-border: #525252;
          --chillradio-border-hover: #737373;
          --chillradio-text: #fafafa;
          --chillradio-text-muted: #a3a3a3;
          --chillradio-disabled: #404040;
          --chillradio-disabled-text: #6b7280;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillradio-bg: #262626;
        --chillradio-border: #525252;
        --chillradio-border-hover: #737373;
        --chillradio-text: #fafafa;
        --chillradio-text-muted: #a3a3a3;
        --chillradio-disabled: #404040;
        --chillradio-disabled-text: #6b7280;
      }

      .chillradio-wrapper {
        display: inline-flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        font-size: 14px;
        color: var(--chillradio-text);
        user-select: none;
      }

      .chillradio-wrapper.disabled {
        cursor: not-allowed;
        color: var(--chillradio-disabled-text);
      }

      .chillradio-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .chillradio-circle {
        position: relative;
        width: 20px;
        height: 20px;
        background: var(--chillradio-bg);
        border: 2px solid var(--chillradio-border);
        border-radius: 50%;
        flex-shrink: 0;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chillradio-wrapper:hover:not(.disabled) .chillradio-circle {
        border-color: var(--chillradio-border-hover);
      }

      .chillradio-input:focus-visible + .chillradio-circle {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .chillradio-input:checked + .chillradio-circle {
        border-color: var(--chillradio-checked);
      }

      .chillradio-wrapper:hover:not(.disabled) .chillradio-input:checked + .chillradio-circle {
        border-color: var(--chillradio-checked-hover);
      }

      .chillradio-input:disabled + .chillradio-circle {
        background: var(--chillradio-disabled);
        border-color: var(--chillradio-disabled);
        cursor: not-allowed;
      }

      .chillradio-dot {
        width: 10px;
        height: 10px;
        background: var(--chillradio-checked);
        border-radius: 50%;
        opacity: 0;
        transform: scale(0);
        transition: all 0.15s ease;
      }

      .chillradio-input:checked + .chillradio-circle .chillradio-dot {
        opacity: 1;
        transform: scale(1);
      }

      .chillradio-input:disabled + .chillradio-circle .chillradio-dot {
        background: var(--chillradio-disabled-text);
      }

      .chillradio-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 1px;
      }

      .chillradio-label {
        font-weight: 500;
        line-height: 1.4;
      }

      .chillradio-description {
        font-size: 13px;
        color: var(--chillradio-text-muted);
        line-height: 1.4;
      }

      /* Sizes */
      .chillradio-sm .chillradio-circle {
        width: 16px;
        height: 16px;
      }

      .chillradio-sm .chillradio-dot {
        width: 8px;
        height: 8px;
      }

      .chillradio-lg .chillradio-circle {
        width: 24px;
        height: 24px;
      }

      .chillradio-lg .chillradio-dot {
        width: 12px;
        height: 12px;
      }

      /* States */
      .chillradio-error .chillradio-circle {
        border-color: var(--chillradio-error);
      }

      .chillradio-error .chillradio-input:checked + .chillradio-circle {
        border-color: var(--chillradio-error);
      }

      .chillradio-error .chillradio-dot {
        background: var(--chillradio-error);
      }

      .chillradio-success .chillradio-input:checked + .chillradio-circle {
        border-color: var(--chillradio-success);
      }

      .chillradio-success .chillradio-dot {
        background: var(--chillradio-success);
      }

      /* Group */
      .chillradio-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chillradio-group-horizontal {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 16px;
      }

      .chillradio-group-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillradio-text);
        margin-bottom: 8px;
      }

      /* Card Style */
      .chillradio-card {
        padding: 16px;
        border: 1px solid var(--chillradio-border);
        border-radius: 8px;
        transition: all 0.15s ease;
      }

      .chillradio-card:hover:not(.disabled) {
        border-color: var(--chillradio-border-hover);
      }

      .chillradio-card .chillradio-input:checked ~ .chillradio-card-inner {
        border-color: var(--chillradio-checked);
      }

      .chillradio-card.selected {
        border-color: var(--chillradio-checked);
        background: rgba(59, 130, 246, 0.05);
      }

      @media (prefers-reduced-motion: reduce) {
        .chillradio-box, .chillradio-circle, .chillradio-track, .chillradio-thumb, .chillradio-checkmark, .chillradio-dot, .chillradio-indeterminate-mark, .chillradio-track-label, .chillradio-thumb-icon { transition: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const token = v => String(v).replace(/[^a-zA-Z0-9_-]/g, '');

    function textSpan(cls, text) {
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = String(text);
        return s;
    }

    // ---- Instance -----------------------------------------------------------

    class ChillRadioInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);
            const reuse = !!this.element && this.element.tagName === 'INPUT';
            const el = reuse ? this.element : null;

            this.options = {
                checked: options.checked !== undefined ? !!options.checked : (el ? el.checked : false),
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
            wrapper.className = `chillradio-wrapper chillradio-${o.size}`;
            if (o.disabled) wrapper.classList.add('disabled');
            if (o.state !== 'default') wrapper.classList.add(`chillradio-${token(o.state)}`);

            const input = this._reused ? this.element : document.createElement('input');
            input.type = 'radio';
            input.classList.add('chillradio-input');
            input.checked = !!o.checked;
            input.disabled = !!o.disabled;
            if (o.required) input.required = true;
            if (o.name) input.name = String(o.name);
            if (o.value !== '' && o.value !== undefined && o.value !== null) input.value = String(o.value);

            const circle = document.createElement('span');
            circle.className = 'chillradio-circle';
            circle.setAttribute('aria-hidden', 'true');
            const dot = document.createElement('span');
            dot.className = 'chillradio-dot';
            circle.appendChild(dot);

            if (this.element && this.element.parentNode) {
                this._marker = document.createComment('chillradio');
                this.element.parentNode.insertBefore(this._marker, this.element);
                this.element.parentNode.insertBefore(wrapper, this.element);
                if (!this._reused) this.element.parentNode.removeChild(this.element);
            }
            wrapper.appendChild(input);
            wrapper.appendChild(circle);

            this._prevDescribedBy = input.getAttribute('aria-describedby');
            if (o.label || o.description) {
                const content = document.createElement('span');
                content.className = 'chillradio-content';
                if (o.label) content.appendChild(textSpan('chillradio-label', o.label));
                if (o.description) {
                    const d = textSpan('chillradio-description', o.description);
                    d.id = 'chillradio-desc-' + (++uid);
                    content.appendChild(d);
                    input.setAttribute('aria-describedby', d.id);
                }
                wrapper.appendChild(content);
            }

            this.wrapper = wrapper;
            this.input = input;
            this._prevInvalid = input.getAttribute('aria-invalid');
            if (o.state === 'error') input.setAttribute('aria-invalid', 'true');
        }

        bindEvents() {
            const handler = (e) => {
                this.options.checked = e.target.checked;

                if (this.options.onChange) {
                    this.options.onChange(e.target.value, e);
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
        }

        setDisabled(disabled) {
            this.input.disabled = disabled;
            this.options.disabled = disabled;
            this.wrapper.classList.toggle('disabled', disabled);
        }

        setState(state) {
            this.wrapper.classList.remove(`chillradio-${token(this.options.state)}`);
            if (state !== 'default') {
                this.wrapper.classList.add(`chillradio-${token(state)}`);
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
                input.classList.remove('chillradio-input');
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

    function createRadio(options = {}) {
        const inst = new ChillRadioInstance(null, options);
        const wrapper = inst.wrapper;
        // additive helpers on the returned element
        wrapper.input = inst.input;
        wrapper.instance = inst;
        wrapper.destroy = function () { inst.destroy(); };
        return wrapper;
    }

    function createRadioGroup(options = {}) {
        injectCSS();

        const group = document.createElement('div');
        group.className = `chillradio-group ${options.horizontal ? 'chillradio-group-horizontal' : ''}`;
        group.setAttribute('role', 'radiogroup');

        if (options.label) {
            const label = document.createElement('div');
            label.className = 'chillradio-group-label';
            label.id = 'chillradio-group-label-' + (++uid);
            label.textContent = String(options.label);
            group.setAttribute('aria-labelledby', label.id);
            group.appendChild(label);
        }

        const instances = [];
        const name = options.name || `chillradio-${++uid}`;

        (options.items || []).forEach(item => {
            const instance = new ChillRadioInstance(null, {
                ...item,
                name: name,
                disabled: item.disabled !== undefined ? item.disabled : !!options.disabled,
                checked: options.value === item.value,
                onChange: (value) => {
                    instances.forEach(inst => {
                        if (String(inst.getValue()) !== String(value)) {
                            inst.setChecked(false);
                        }
                    });
                    if (options.onChange) {
                        options.onChange(item.value);
                    }
                }
            });
            instances.push(instance);
            group.appendChild(instance.wrapper);
        });

        group._instances = instances;
        group.getValue = () => {
            const checked = instances.find(i => i.isChecked());
            return checked ? checked.getValue() : null;
        };
        group.setValue = (val) => {
            instances.forEach(i => i.setChecked(i.getValue() === val));
        };
        group.destroy = () => {
            instances.forEach(i => i.destroy());
            instances.length = 0;
            if (group.parentNode) group.parentNode.removeChild(group);
        };

        return group;
    }

    const ChillRadio = {
        version: VERSION,

        init(selector, options) {
            return new ChillRadioInstance(selector, options);
        },

        create(options) {
            return createRadio(options);
        },

        createGroup(options) {
            return createRadioGroup(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillRadio;
    } else {
        window.ChillRadio = ChillRadio;
    }

})(typeof window !== 'undefined' ? window : this);
