/**
 * ChillSwitch - Zero-dependency Switch / Toggle Component
 *
 * @version 1.1.0
 * @license MIT
 *
 * Usage:
 *   const w = ChillSwitch.create({ label: 'Notifications', checked: true, onChange: on => {} });
 *   document.body.appendChild(w);               // w.input / w.instance / w.destroy()
 *   const inst = ChillSwitch.init('#toggle', { label: 'Dark mode' });   // existing <input type="checkbox"> is MOVED into the wrapper and restored on destroy()
 *
 * Options: checked, disabled, label, description (TEXT only), size 'md' (sm|md|lg), color 'primary' (any chillswitch-<color> class),
 *   labelPosition 'end' ('start'|'end'), showIcons false, trackLabels null ({ on, off } text), name, value, onChange(checked, event)
 * ARIA: input role="switch" with aria-checked; Space and Enter toggle.
 * Instance: isChecked, setChecked, toggle (fires onChange), setDisabled, setColor, getValue, destroy
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    let uid = 0;
    const CSS_INJECTED_FLAG = '__chillswitch_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillswitch-styles')) { window[CSS_INJECTED_FLAG] = true; return; }

        const style = document.createElement('style');
        style.id = 'chillswitch-styles';
        style.textContent = `
      :root {
        --chillswitch-bg-off: #e5e7eb;
        --chillswitch-bg-on: #3b82f6;
        --chillswitch-bg-on-hover: #2563eb;
        --chillswitch-thumb: #ffffff;
        --chillswitch-text: #171717;
        --chillswitch-text-muted: #6b7280;
        --chillswitch-disabled: #d1d5db;
        --chillswitch-disabled-thumb: #f3f4f6;
        --chillswitch-error: #ef4444;
        --chillswitch-success: #22c55e;
        --chillswitch-warning: #f59e0b;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillswitch-bg-off: #404040;
          --chillswitch-thumb: #fafafa;
          --chillswitch-text: #fafafa;
          --chillswitch-text-muted: #a3a3a3;
          --chillswitch-disabled: #525252;
          --chillswitch-disabled-thumb: #737373;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillswitch-bg-off: #404040;
        --chillswitch-thumb: #fafafa;
        --chillswitch-text: #fafafa;
        --chillswitch-text-muted: #a3a3a3;
        --chillswitch-disabled: #525252;
        --chillswitch-disabled-thumb: #737373;
      }

      .chillswitch-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
      }

      .chillswitch-wrapper.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .chillswitch-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .chillswitch-track {
        position: relative;
        width: 44px;
        height: 24px;
        background: var(--chillswitch-bg-off);
        border-radius: 12px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .chillswitch-wrapper:hover:not(.disabled) .chillswitch-track {
        filter: brightness(0.95);
      }

      .chillswitch-input:focus-visible + .chillswitch-track {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .chillswitch-input:checked + .chillswitch-track {
        background: var(--chillswitch-bg-on);
      }

      .chillswitch-wrapper:hover:not(.disabled) .chillswitch-input:checked + .chillswitch-track {
        background: var(--chillswitch-bg-on-hover);
      }

      .chillswitch-input:disabled + .chillswitch-track {
        background: var(--chillswitch-disabled);
        cursor: not-allowed;
      }

      .chillswitch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: var(--chillswitch-thumb);
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chillswitch-input:checked + .chillswitch-track .chillswitch-thumb {
        left: calc(100% - 22px);
      }

      .chillswitch-input:disabled + .chillswitch-track .chillswitch-thumb {
        background: var(--chillswitch-disabled-thumb);
        box-shadow: none;
      }

      .chillswitch-thumb-icon {
        width: 12px;
        height: 12px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .chillswitch-input:checked + .chillswitch-track .chillswitch-thumb-icon.on {
        opacity: 1;
        color: var(--chillswitch-bg-on);
      }

      .chillswitch-input:not(:checked) + .chillswitch-track .chillswitch-thumb-icon.off {
        opacity: 1;
        color: var(--chillswitch-text-muted);
      }

      .chillswitch-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .chillswitch-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--chillswitch-text);
      }

      .chillswitch-description {
        font-size: 13px;
        color: var(--chillswitch-text-muted);
        line-height: 1.4;
      }

      /* Sizes */
      .chillswitch-sm .chillswitch-track {
        width: 36px;
        height: 20px;
        border-radius: 10px;
      }

      .chillswitch-sm .chillswitch-thumb {
        width: 16px;
        height: 16px;
      }

      .chillswitch-sm .chillswitch-input:checked + .chillswitch-track .chillswitch-thumb {
        left: calc(100% - 18px);
      }

      .chillswitch-lg .chillswitch-track {
        width: 56px;
        height: 30px;
        border-radius: 15px;
      }

      .chillswitch-lg .chillswitch-thumb {
        width: 26px;
        height: 26px;
      }

      .chillswitch-lg .chillswitch-input:checked + .chillswitch-track .chillswitch-thumb {
        left: calc(100% - 28px);
      }

      /* Colors */
      .chillswitch-success .chillswitch-input:checked + .chillswitch-track {
        background: var(--chillswitch-success);
      }

      .chillswitch-error .chillswitch-input:checked + .chillswitch-track {
        background: var(--chillswitch-error);
      }

      .chillswitch-warning .chillswitch-input:checked + .chillswitch-track {
        background: var(--chillswitch-warning);
      }

      /* Label Position */
      .chillswitch-label-start {
        flex-direction: row-reverse;
      }

      /* With Labels on Track */
      .chillswitch-track-labels {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .chillswitch-track-label {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        transition: opacity 0.15s ease;
        color: white;
        padding: 0 6px;
      }

      .chillswitch-track-label-on {
        left: 6px;
      }

      .chillswitch-track-label-off {
        right: 6px;
        color: var(--chillswitch-text-muted);
      }

      .chillswitch-input:checked + .chillswitch-track .chillswitch-track-label-on {
        opacity: 1;
      }

      .chillswitch-input:not(:checked) + .chillswitch-track .chillswitch-track-label-off {
        opacity: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillswitch-box, .chillswitch-circle, .chillswitch-track, .chillswitch-thumb, .chillswitch-checkmark, .chillswitch-dot, .chillswitch-indeterminate-mark, .chillswitch-track-label, .chillswitch-thumb-icon { transition: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    // ---- helpers ----------------------------------------------------------

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const token = v => String(v).replace(/[^a-zA-Z0-9_-]/g, '');

    function thumbIcon(cls, d) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'chillswitch-thumb-icon ' + cls);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '3');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
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

    class ChillSwitchInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') { this.options = options; return; }
            this.element = !selector ? null : (typeof selector === 'string' ? document.querySelector(selector) : selector);
            const reuse = !!this.element && this.element.tagName === 'INPUT';
            const el = reuse ? this.element : null;

            this.options = {
                checked: options.checked !== undefined ? !!options.checked : (el ? el.checked : false),
                disabled: options.disabled !== undefined ? !!options.disabled : (el ? el.disabled : false),
                label: options.label || '',
                description: options.description || '',
                size: options.size || 'md',
                color: options.color || 'primary',
                labelPosition: options.labelPosition || 'end',
                showIcons: options.showIcons || false,
                trackLabels: options.trackLabels || null,
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
            wrapper.className = `chillswitch-wrapper chillswitch-${o.size}`;
            if (o.disabled) wrapper.classList.add('disabled');
            if (o.color !== 'primary') wrapper.classList.add(`chillswitch-${token(o.color)}`);
            if (o.labelPosition === 'start') wrapper.classList.add('chillswitch-label-start');

            const input = this._reused ? this.element : document.createElement('input');
            input.type = 'checkbox';
            this._origRole = input.getAttribute('role');
            input.setAttribute('role', 'switch');
            input.classList.add('chillswitch-input');
            input.checked = !!o.checked;
            input.disabled = !!o.disabled;
            if (o.name) input.name = String(o.name);
            if (o.value !== '' && o.value !== undefined && o.value !== null) input.value = String(o.value);
            input.setAttribute('aria-checked', input.checked ? 'true' : 'false');

            const track = document.createElement('span');
            track.className = 'chillswitch-track';
            track.setAttribute('aria-hidden', 'true');
            if (o.trackLabels) {
                wrapper.classList.add('chillswitch-track-labels');
                track.appendChild(textSpan('chillswitch-track-label chillswitch-track-label-on', o.trackLabels.on || 'ON'));
                track.appendChild(textSpan('chillswitch-track-label chillswitch-track-label-off', o.trackLabels.off || 'OFF'));
            }
            const thumb = document.createElement('span');
            thumb.className = 'chillswitch-thumb';
            if (o.showIcons) {
                thumb.appendChild(thumbIcon('on', 'M20 6L9 17l-5-5'));
                thumb.appendChild(thumbIcon('off', 'M18 6L6 18M6 6l12 12'));
            }
            track.appendChild(thumb);

            if (this.element && this.element.parentNode) {
                this._marker = document.createComment('chillswitch');
                this.element.parentNode.insertBefore(this._marker, this.element);
                this.element.parentNode.insertBefore(wrapper, this.element);
                if (!this._reused) this.element.parentNode.removeChild(this.element);
            }
            wrapper.appendChild(input);
            wrapper.appendChild(track);

            this._prevDescribedBy = input.getAttribute('aria-describedby');
            if (o.label || o.description) {
                const content = document.createElement('span');
                content.className = 'chillswitch-content';
                if (o.label) content.appendChild(textSpan('chillswitch-label', o.label));
                if (o.description) {
                    const d = textSpan('chillswitch-description', o.description);
                    d.id = 'chillswitch-desc-' + (++uid);
                    content.appendChild(d);
                    input.setAttribute('aria-describedby', d.id);
                }
                wrapper.appendChild(content);
            }

            this.wrapper = wrapper;
            this.input = input;
        }

        bindEvents() {
            const handler = (e) => {
                this.options.checked = e.target.checked;
                this.input.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');

                if (this.options.onChange) {
                    this.options.onChange(e.target.checked, e);
                }
            };
            // Enter also toggles a switch (Space is native)
            const keyHandler = (e) => {
                if (e.key === 'Enter' && !this.input.disabled) {
                    e.preventDefault();
                    this.input.click();
                }
            };
            this.input.addEventListener('change', handler);
            this.input.addEventListener('keydown', keyHandler);
            this._cleanup.push(() => {
                this.input.removeEventListener('change', handler);
                this.input.removeEventListener('keydown', keyHandler);
            });
        }

        isChecked() {
            return this.input.checked;
        }

        setChecked(checked) {
            this.input.checked = checked;
            this.options.checked = checked;
            this.input.setAttribute('aria-checked', checked ? 'true' : 'false');
        }

        toggle() {
            this.setChecked(!this.input.checked);
            if (this.options.onChange) {
                this.options.onChange(this.input.checked);
            }
        }

        setDisabled(disabled) {
            this.input.disabled = disabled;
            this.options.disabled = disabled;
            this.wrapper.classList.toggle('disabled', disabled);
        }

        setColor(color) {
            this.wrapper.classList.remove(`chillswitch-${token(this.options.color)}`);
            if (color !== 'primary') {
                this.wrapper.classList.add(`chillswitch-${token(color)}`);
            }
            this.options.color = color;
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
                input.classList.remove('chillswitch-input');
                if (this._origRole) input.setAttribute('role', this._origRole); else input.removeAttribute('role');
                input.removeAttribute('aria-checked');
                if (this._prevDescribedBy) input.setAttribute('aria-describedby', this._prevDescribedBy);
                else input.removeAttribute('aria-describedby');
                this.wrapper.parentNode.insertBefore(input, this.wrapper);
                this._marker.parentNode.removeChild(this._marker);
            }
            if (this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
            this.wrapper = null;
        }
    }

    function createSwitch(options = {}) {
        const instance = new ChillSwitchInstance(null, options);
        const wrapper = instance.wrapper;
        // additive helpers on the returned element
        wrapper.input = instance.input;
        wrapper.instance = instance;
        wrapper.destroy = function () { instance.destroy(); };
        return wrapper;
    }

    const ChillSwitch = {
        version: VERSION,

        init(selector, options) {
            return new ChillSwitchInstance(selector, options);
        },

        create(options) {
            return createSwitch(options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillSwitch;
    } else {
        window.ChillSwitch = ChillSwitch;
    }

})(typeof window !== 'undefined' ? window : this);
