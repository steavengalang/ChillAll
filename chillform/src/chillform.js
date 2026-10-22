/**
 * ChillForm - Zero-dependency Form Validation Library
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const f = ChillForm.create('#signup', {
 *       rules: {
 *           email: { required: true, email: true },
 *           password: { required: true, minLength: 8, message: { minLength: 'Too short' } },
 *           confirm: { match: 'password' },
 *           age: { min: 18, custom: (value, data) => value % 2 === 0 || 'Must be even' }
 *       },
 *       onSubmit: async data => api.post(data),     // called only when valid
 *       onInvalid: errors => {},                    // called with { field: [messages] } when submit is blocked
 *       onError: err => {}                          // onSubmit threw / rejected (default: console.error)
 *   });
 *   f.setErrors({ email: 'Already taken' });        // server-side errors
 *   f.destroy();                                    // removes listeners, ARIA and UI classes
 *
 * Config
 *   rules        {}          field name -> { required, email, minLength, maxLength, min, max, pattern, match, custom, message: {rule: text} }
 *                            custom(value, formData) => true | false | 'error message'
 *   messages     {}          override default messages ("{min}" / "{max}" placeholders)
 *   validateOn   'blur'      'blur' (re-validates on input once touched) | 'input' (validate while typing) | 'submit'
 *   focusFirstError true     focus the first invalid field when submit is blocked
 *   onSubmit(data, form), onInvalid(errors), onError(err)
 * Instance: validate, validateField(name), isValid, getErrors, setErrors(map), clearErrors, getFormData, reset, handleSubmit, destroy
 * Statics: ChillForm.create / init, ChillForm.validators, ChillForm.addValidator(name, fn(value, ruleValue, formData))
 * Accessibility: the form gets novalidate; invalid fields get aria-invalid and aria-describedby -> an aria-live message
 *   (messages are TEXT only). Delegated listeners, so fields added later are validated too.
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillform_css_injected__';
    let uid = 0;

    // Validation rules
    const validators = {
        required: (value) => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined;
        },

        email: (value) => {
            if (!value) return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },

        minLength: (value, min) => {
            if (!value) return true;
            return String(value).length >= min;
        },

        maxLength: (value, max) => {
            if (!value) return true;
            return String(value).length <= max;
        },

        min: (value, min) => {
            if (!value && value !== 0) return true;
            return Number(value) >= min;
        },

        max: (value, max) => {
            if (!value && value !== 0) return true;
            return Number(value) <= max;
        },

        pattern: (value, regex) => {
            if (!value) return true;
            const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
            return pattern.test(value);
        },

        match: (value, fieldName, formData) => {
            return value === formData[fieldName];
        }
    };

    const defaultMessages = {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        minLength: 'Must be at least {min} characters',
        maxLength: 'Must be no more than {max} characters',
        min: 'Must be at least {min}',
        max: 'Must be no more than {max}',
        pattern: 'Invalid format',
        match: 'Fields do not match',
        custom: 'Invalid value'
    };

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillform-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillform-styles';
        style.textContent = `
      :root {
        --chillform-error: #ef4444;
        --chillform-success: #22c55e;
        --chillform-border: #e5e5e5;
        --chillform-text: #171717;
        --chillform-text-light: #737373;
        --chillform-bg: #ffffff;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillform-border: #404040;
          --chillform-text: #fafafa;
          --chillform-text-light: #a3a3a3;
          --chillform-bg: #171717;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillform-border: #404040;
        --chillform-text: #fafafa;
        --chillform-text-light: #a3a3a3;
        --chillform-bg: #171717;
      }

      .chillform-field {
        margin-bottom: 16px;
      }

      .chillform-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--chillform-text);
        margin-bottom: 6px;
      }

      .chillform-input {
        box-sizing: border-box;
        width: 100%;
        padding: 10px 12px;
        font-size: 14px;
        border: 1px solid var(--chillform-border);
        border-radius: 6px;
        background: var(--chillform-bg);
        color: var(--chillform-text);
        transition: border-color 0.15s, box-shadow 0.15s;
        outline: none;
      }

      .chillform-input:focus,
      .chillform-input:focus-visible {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }

      .chillform-input.chillform-error,
      .chillform-error[aria-invalid="true"] {
        border-color: var(--chillform-error);
      }

      .chillform-input.chillform-valid {
        border-color: var(--chillform-success);
      }

      .chillform-message {
        font-size: 12px;
        margin-top: 4px;
        min-height: 18px;
      }

      .chillform-message.error {
        color: var(--chillform-error);
      }

      .chillform-message.success {
        color: var(--chillform-success);
      }

      .chillform-submit {
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        transition: background 0.15s;
      }

      .chillform-submit:hover:not(:disabled) {
        background: #2563eb;
      }

      .chillform-submit:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
      }

      .chillform-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .chillform-submit {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .chillform-input, .chillform-submit { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    const esc = (name) => String(name).replace(/["\\]/g, '\\$&');

    class ChillFormInstance {
        constructor(formElement, config = {}) {
            this.form = typeof document === 'undefined' ? null : (typeof formElement === 'string'
                ? document.querySelector(formElement)
                : formElement);

            this.config = config;
            this.rules = config.rules || {};
            this.messages = { ...defaultMessages, ...config.messages };
            this.errors = {};
            this.touched = {};
            this.isSubmitting = false;
            this._cleanup = [];
            this._serverErrors = {};
            this._marked = new Set();

            if (this.form) {
                this.init();
            }
        }

        init() {
            injectCSS();
            this.bindEvents();
        }

        bindEvents() {
            const on = (type, fn) => {
                this.form.addEventListener(type, fn);
                this._cleanup.push(() => this.form.removeEventListener(type, fn));
            };
            const mode = this.config.validateOn || 'blur';

            // novalidate: we render our own messages instead of the browser bubbles
            this._hadNoValidate = this.form.hasAttribute('novalidate');
            this.form.setAttribute('novalidate', '');
            this._cleanup.push(() => { if (!this._hadNoValidate) this.form.removeAttribute('novalidate'); });

            // delegated listeners: fields added later are covered as well
            on('focusout', (e) => {
                const name = e.target && e.target.name;
                if (!name || mode === 'submit' || !this.rules[name]) return;
                this.touched[name] = true;
                this.validateField(name);
            });

            const onInput = (e) => {
                const name = e.target && e.target.name;
                if (!name) return;
                if (this._serverErrors[name]) {
                    delete this._serverErrors[name];
                    if (!this.rules[name]) { this.errors[name] = []; this.updateFieldUI(name, []); return; }
                }
                if (!this.rules[name] || mode === 'submit') return;
                if (mode === 'input') this.touched[name] = true;
                if (this.touched[name]) this.validateField(name);
            };
            on('input', onInput);
            on('change', onInput);

            on('submit', (e) => {
                e.preventDefault();
                return this.handleSubmit();
            });
            on('reset', () => { this._clearUI(); });
        }

        getFormData() {
            const formData = new FormData(this.form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    // repeated names (checkbox groups, multi-select) become arrays
                    data[key] = Array.isArray(data[key]) ? data[key].concat([value]) : [data[key], value];
                } else {
                    data[key] = value;
                }
            }
            return data;
        }

        _runRules(fieldName, formData) {
            const fieldRules = this.rules[fieldName];
            if (!fieldRules) return [];
            const value = formData[fieldName];
            const errors = [];

            for (const [rule, ruleValue] of Object.entries(fieldRules)) {
                if (rule === 'message') continue;

                const validator = rule === 'custom' ? null : validators[rule];
                if (!validator && rule !== 'custom') continue;

                let isValid;
                let customMessage = null;
                if (rule === 'custom') {
                    if (typeof ruleValue !== 'function') continue;
                    const r = ruleValue(value, formData);
                    isValid = r === true || r === undefined;
                    if (typeof r === 'string') customMessage = r;
                } else if (rule === 'match') {
                    isValid = validator(value, ruleValue, formData);
                } else if (typeof ruleValue === 'boolean') {
                    isValid = ruleValue ? validator(value) : true;
                } else {
                    isValid = validator(value, ruleValue, formData);
                }

                if (!isValid) {
                    let message = customMessage || (fieldRules.message && fieldRules.message[rule]) || this.messages[rule] || this.messages.custom;
                    message = String(message).replace('{min}', ruleValue).replace('{max}', ruleValue);
                    errors.push(message);
                }
            }
            return errors;
        }

        validateField(fieldName) {
            if (!this.rules[fieldName]) return true;
            const errors = this._runRules(fieldName, this.getFormData());
            this.errors[fieldName] = errors;
            this.updateFieldUI(fieldName, errors);
            return errors.length === 0;
        }

        _findInput(fieldName) {
            return this.form.querySelector(`[name="${esc(fieldName)}"]`);
        }

        updateFieldUI(fieldName, errors) {
            const input = this._findInput(fieldName);
            if (!input) return;

            const field = input.closest('.chillform-field') || input.parentElement;
            let messageEl = field.querySelector(`.chillform-message[data-for="${esc(fieldName)}"]`) || field.querySelector('.chillform-message');

            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.className = 'chillform-message';
                input.parentNode.insertBefore(messageEl, input.nextSibling);
            }
            if (!messageEl.id) messageEl.id = 'chillform-msg-' + (++uid);
            messageEl.setAttribute('data-for', fieldName);
            messageEl.setAttribute('aria-live', 'polite');

            const group = this.form.querySelectorAll(`[name="${esc(fieldName)}"]`);
            this._marked.add(fieldName);
            input.classList.remove('chillform-error', 'chillform-valid');
            messageEl.classList.remove('error', 'success');

            const describe = (on) => {
                group.forEach(el => {
                    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).filter(x => x !== messageEl.id);
                    if (on) ids.push(messageEl.id);
                    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
                });
            };

            if (errors.length > 0) {
                input.classList.add('chillform-error');
                messageEl.classList.add('error');
                messageEl.textContent = errors[0];
                group.forEach(el => el.setAttribute('aria-invalid', 'true'));
                describe(true);
            } else {
                group.forEach(el => el.removeAttribute('aria-invalid'));
                describe(false);
                messageEl.textContent = '';
                if (this.touched[fieldName]) input.classList.add('chillform-valid');
            }
        }

        validate() {
            const fieldNames = Object.keys(this.rules);
            let isValid = true;

            fieldNames.forEach(name => {
                this.touched[name] = true;
                if (!this.validateField(name)) {
                    isValid = false;
                }
            });
            Object.keys(this._serverErrors).forEach(name => {
                if (!this.rules[name]) isValid = false;
            });

            return isValid;
        }

        /** True when every rule passes (does not touch the UI). */
        isValid() {
            const data = this.getFormData();
            return Object.keys(this.rules).every(name => this._runRules(name, data).length === 0) &&
                !Object.keys(this._serverErrors).length;
        }

        getErrors() {
            const out = {};
            Object.keys(this.errors).forEach(k => { if (this.errors[k] && this.errors[k].length) out[k] = this.errors[k].slice(); });
            return out;
        }

        /** Show server-side / external errors: { field: 'message' | ['messages'] } */
        setErrors(map) {
            Object.keys(map || {}).forEach(name => {
                const list = [].concat(map[name]).filter(m => m !== null && m !== undefined && m !== '').map(String);
                this._serverErrors[name] = list.length ? list : undefined;
                if (!list.length) delete this._serverErrors[name];
                this.touched[name] = true;
                this.errors[name] = list;
                this.updateFieldUI(name, list);
            });
        }

        clearErrors() {
            this._serverErrors = {};
            this.errors = {};
            this._clearUI();
        }

        focusFirstError() {
            const name = Object.keys(this.errors).find(n => this.errors[n] && this.errors[n].length);
            const el = name ? this._findInput(name) : null;
            if (el && el.focus) el.focus();
            return el;
        }

        async handleSubmit() {
            if (this.isSubmitting) return;

            const isValid = this.validate();
            if (!isValid) {
                if (this.config.onInvalid) this.config.onInvalid(this.getErrors());
                if (this.config.focusFirstError !== false) this.focusFirstError();
                return;
            }

            this.isSubmitting = true;
            const submitBtn = this.form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                if (this.config.onSubmit) {
                    await this.config.onSubmit(this.getFormData(), this);
                }
            } catch (err) {
                if (this.config.onError) this.config.onError(err);
                else if (typeof console !== 'undefined') console.error(err);
            } finally {
                this.isSubmitting = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        }

        _clearUI() {
            this.form.querySelectorAll('.chillform-error, .chillform-valid').forEach(el => {
                el.classList.remove('chillform-error', 'chillform-valid');
            });
            this._marked.forEach(name => {
                this.form.querySelectorAll(`[name="${esc(name)}"]`).forEach(el => {
                    el.removeAttribute('aria-invalid');
                    const msg = this.form.querySelector(`.chillform-message[data-for="${esc(name)}"]`);
                    if (msg && msg.id) {
                        const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(x => x && x !== msg.id);
                        if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
                    }
                });
            });
            this._marked.clear();
            this.form.querySelectorAll('.chillform-message').forEach(el => {
                el.textContent = '';
                el.classList.remove('error', 'success');
            });
        }

        reset() {
            this.form.reset();
            this.errors = {};
            this.touched = {};
            this._serverErrors = {};
            this._clearUI();
        }

        destroy() {
            if (!this.form) return;
            this._clearUI();
            this._cleanup.forEach(fn => fn());
            this._cleanup = [];
            this.errors = {};
            this.touched = {};
            this.form = null;
        }
    }

    // Public API
    const ChillForm = {
        version: VERSION,

        create(formElement, config) {
            return new ChillFormInstance(formElement, config);
        },

        init(formElement, config) {
            return new ChillFormInstance(formElement, config);
        },

        validators,

        addValidator(name, fn) {
            validators[name] = fn;
        },

        injectCSS
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillForm;
    } else {
        window.ChillForm = ChillForm;
    }

})(typeof window !== 'undefined' ? window : this);
