/**
 * ChillColorPicker - Zero-dependency colour picker (swatches + HSV area + hue slider + hex input)
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const cp = ChillColorPicker.create({ value: '#3b82f6', onChange: hex => console.log(hex) });
 *   document.body.appendChild(cp.element);                         // inline panel
 *   const pop = ChillColorPicker.init('#host', { popover: true }); // trigger button + popover panel
 *   pop.getValue(); pop.setValue('#ff0000'); pop.destroy();
 *   ChillColorPicker.parse('rgb(255, 0, 0)') // -> '#ff0000'
 *
 * Options
 *   value        '#3b82f6'  initial colour (#rgb, #rrggbb or rgb()/hsl())
 *   swatches     [...]      array of colours shown as presets; false to hide
 *   showInput    true       show the hex text field
 *   format       'hex'      format of getValue()/callbacks: 'hex' | 'rgb' | 'hsl'
 *   popover      false      render a trigger button; the panel opens in a popover on <body>
 *   placement    'bottom-start'  'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
 *   disabled     false
 *   name         null       hidden input name (hex value)
 *   label        'Colour'   aria-label
 *   container    null       element / selector to append into
 *   onInput(value, inst)    while dragging / typing valid values
 *   onChange(value, inst)   when a colour is committed (drag end, swatch, keyboard, hex Enter/blur)
 *   onOpen(inst), onClose(inst)
 * Methods: getValue, getHex, getRgb, getHsv, setValue(c, silent), open, close, toggle, isOpen,
 *          setDisabled, on(evt, fn) -> off(), destroy()
 * Events: 'input', 'change', 'open', 'close'
 * Static: parse, toHex, hexToRgb, rgbToHsv, hsvToRgb, rgbToHsl
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const CSS_INJECTED_FLAG = '__chillcolorpicker_css_injected__';
    const DEFAULT_SWATCHES = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
        '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#171717', '#6b7280', '#d4d4d4', '#ffffff'];

    // ---- colour maths (pure) ----
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    function hsvToRgb(h, s, v) {
        h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); v = clamp(v, 0, 1);
        const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
    }
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d) {
            if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
            h *= 60; if (h < 0) h += 360;
        }
        return { h: h, s: max ? d / max : 0, v: max };
    }
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
        let h = 0, s = 0;
        if (d) {
            s = d / (1 - Math.abs(2 * l - 1));
            if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
            h *= 60; if (h < 0) h += 360;
        }
        return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const v = l + s * Math.min(l, 1 - l);
        return hsvToRgb(h, v ? 2 * (1 - l / v) : 0, v);
    }
    const hex2 = n => ('0' + clamp(Math.round(n), 0, 255).toString(16)).slice(-2);
    function toHex(rgb) { return '#' + hex2(rgb.r) + hex2(rgb.g) + hex2(rgb.b); }
    function hexToRgb(hex) {
        let m = /^#?([0-9a-f]{3})$/i.exec(String(hex).trim());
        if (m) { const s = m[1]; return { r: parseInt(s[0] + s[0], 16), g: parseInt(s[1] + s[1], 16), b: parseInt(s[2] + s[2], 16) }; }
        m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
        if (m) { const n = parseInt(m[1], 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
        return null;
    }
    /** Parse #rgb / #rrggbb / rgb(r,g,b) / hsl(h,s%,l%) -> rgb object or null */
    function parseRgb(str) {
        if (str && typeof str === 'object' && 'r' in str) return { r: clamp(+str.r, 0, 255), g: clamp(+str.g, 0, 255), b: clamp(+str.b, 0, 255) };
        const s = String(str == null ? '' : str).trim();
        const h = hexToRgb(s);
        if (h) return h;
        let m = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(s);
        if (m) return { r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255) };
        m = /^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%/i.exec(s);
        if (m) return hslToRgb(+m[1], clamp(+m[2], 0, 100), clamp(+m[3], 0, 100));
        return null;
    }
    function parse(str) { const r = parseRgb(str); return r ? toHex(r) : null; }

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG]) return;
        if (document.getElementById('chillcolorpicker-styles')) { window[CSS_INJECTED_FLAG] = true; return; }
        const style = document.createElement('style');
        style.id = 'chillcolorpicker-styles';
        style.textContent = `
      :root {
        --chillcolorpicker-bg: #ffffff;
        --chillcolorpicker-text: #171717;
        --chillcolorpicker-muted: #6b7280;
        --chillcolorpicker-border: #e5e5e5;
        --chillcolorpicker-input-bg: #ffffff;
        --chillcolorpicker-focus: #3b82f6;
        --chillcolorpicker-error: #ef4444;
        --chillcolorpicker-shadow: 0 10px 30px rgba(0,0,0,.18);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillcolorpicker-bg: #1f1f1f;
          --chillcolorpicker-text: #fafafa;
          --chillcolorpicker-muted: #9ca3af;
          --chillcolorpicker-border: #404040;
          --chillcolorpicker-input-bg: #171717;
          --chillcolorpicker-shadow: 0 10px 30px rgba(0,0,0,.6);
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillcolorpicker-bg: #1f1f1f;
        --chillcolorpicker-text: #fafafa;
        --chillcolorpicker-muted: #9ca3af;
        --chillcolorpicker-border: #404040;
        --chillcolorpicker-input-bg: #171717;
        --chillcolorpicker-shadow: 0 10px 30px rgba(0,0,0,.6);
      }
      .chillcolorpicker { display: inline-block; position: relative; font-size: 14px; color: var(--chillcolorpicker-text); }
      .chillcolorpicker-panel { box-sizing: border-box; width: 248px; padding: 12px; background: var(--chillcolorpicker-bg); color: var(--chillcolorpicker-text); border: 1px solid var(--chillcolorpicker-border); border-radius: 12px; display: flex; flex-direction: column; gap: 12px; }
      .chillcolorpicker-popover { position: fixed; z-index: 10001; box-shadow: var(--chillcolorpicker-shadow); animation: chillcolorpicker-in .15s ease; }
      @keyframes chillcolorpicker-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      .chillcolorpicker-area { position: relative; width: 100%; height: 150px; border-radius: 8px; cursor: crosshair; touch-action: none; outline: none; user-select: none; background-color: #f00; background-image: linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)); }
      .chillcolorpicker-area:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.5); }
      .chillcolorpicker-thumb { position: absolute; width: 16px; height: 16px; margin: -8px 0 0 -8px; box-sizing: border-box; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 1px 3px rgba(0,0,0,.4); pointer-events: none; }
      .chillcolorpicker-row { display: flex; align-items: center; gap: 10px; }
      .chillcolorpicker-preview { flex: none; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--chillcolorpicker-border); box-sizing: border-box; }
      .chillcolorpicker-hue { -webkit-appearance: none; appearance: none; flex: 1; min-width: 0; height: 12px; margin: 0; border-radius: 6px; outline: none; cursor: pointer; background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); }
      .chillcolorpicker-hue::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 1px 3px rgba(0,0,0,.4); }
      .chillcolorpicker-hue::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.4); }
      .chillcolorpicker-hue:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.5); }
      .chillcolorpicker-input { box-sizing: border-box; flex: 1; min-width: 0; height: 32px; padding: 0 10px; font: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--chillcolorpicker-text); background: var(--chillcolorpicker-input-bg); border: 1px solid var(--chillcolorpicker-border); border-radius: 8px; outline: none; text-transform: lowercase; transition: border-color .15s ease, box-shadow .15s ease; }
      .chillcolorpicker-input:focus-visible { border-color: var(--chillcolorpicker-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillcolorpicker-input[aria-invalid="true"] { border-color: var(--chillcolorpicker-error); }
      .chillcolorpicker-swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
      .chillcolorpicker-swatch { box-sizing: border-box; width: 100%; aspect-ratio: 1; min-width: 20px; padding: 0; border-radius: 6px; border: 1px solid rgba(0,0,0,.15); cursor: pointer; outline: none; transition: transform .12s ease, box-shadow .12s ease; }
      .chillcolorpicker-swatch:hover { transform: scale(1.12); }
      .chillcolorpicker-swatch:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.55); }
      .chillcolorpicker-swatch[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--chillcolorpicker-bg), 0 0 0 4px var(--chillcolorpicker-focus); }
      .chillcolorpicker-trigger { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 4px 12px 4px 6px; font: inherit; color: var(--chillcolorpicker-text); background: var(--chillcolorpicker-bg); border: 1px solid var(--chillcolorpicker-border); border-radius: 8px; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease; }
      .chillcolorpicker-trigger:hover { border-color: var(--chillcolorpicker-muted); }
      .chillcolorpicker-trigger:focus-visible { outline: none; border-color: var(--chillcolorpicker-focus); box-shadow: 0 0 0 3px rgba(59,130,246,.3); }
      .chillcolorpicker-trigger .chillcolorpicker-preview { width: 24px; height: 24px; border-radius: 6px; }
      .chillcolorpicker-trigger-text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
      .chillcolorpicker-disabled { opacity: .55; }
      .chillcolorpicker-disabled .chillcolorpicker-trigger { cursor: not-allowed; }
      @media (prefers-reduced-motion: reduce) {
        .chillcolorpicker-popover { animation: none; }
        .chillcolorpicker-swatch, .chillcolorpicker-input, .chillcolorpicker-trigger { transition: none; }
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

    function createPicker(options) {
        options = options || {};
        injectCSS();
        const id = 'chillcolorpicker-' + (++uid);
        const listeners = {};
        const popover = !!options.popover;
        let disabled = !!options.disabled;
        let destroyed = false;
        let open = false;
        let dragging = false;
        let dragStartHex = null;
        const initial = parseRgb(options.value) || { r: 59, g: 130, b: 246 };
        let hsv = rgbToHsv(initial.r, initial.g, initial.b);
        let lastCommitted = null;

        const getRgb = () => hsvToRgb(hsv.h, hsv.s, hsv.v);
        const getHex = () => toHex(getRgb());
        function getValue() {
            const f = options.format;
            const rgb = getRgb();
            if (f === 'rgb') return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
            if (f === 'hsl') { const l = rgbToHsl(rgb.r, rgb.g, rgb.b); return 'hsl(' + l.h + ', ' + l.s + '%, ' + l.l + '%)'; }
            return toHex(rgb);
        }

        function emit(evt, payload) {
            (listeners[evt] || []).slice().forEach(fn => { try { fn(payload, api); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
        }

        // ---- DOM ----
        const root = document.createElement('div');
        root.className = 'chillcolorpicker' + (options.className ? ' ' + options.className : '');

        const panel = document.createElement('div');
        panel.className = 'chillcolorpicker-panel';
        panel.id = id + '-panel';

        const area = document.createElement('div');
        area.className = 'chillcolorpicker-area';
        area.tabIndex = 0;
        area.setAttribute('role', 'slider');
        area.setAttribute('aria-label', 'Saturation and brightness');
        const thumb = document.createElement('div');
        thumb.className = 'chillcolorpicker-thumb';
        area.appendChild(thumb);
        panel.appendChild(area);

        const row = document.createElement('div');
        row.className = 'chillcolorpicker-row';
        const preview = document.createElement('div');
        preview.className = 'chillcolorpicker-preview';
        preview.setAttribute('aria-hidden', 'true');
        const hue = document.createElement('input');
        hue.type = 'range';
        hue.min = '0'; hue.max = '360'; hue.step = '1';
        hue.className = 'chillcolorpicker-hue';
        hue.setAttribute('aria-label', 'Hue');
        row.appendChild(preview);
        row.appendChild(hue);
        panel.appendChild(row);

        let input = null;
        if (options.showInput !== false) {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'chillcolorpicker-input';
            input.setAttribute('aria-label', 'Hex colour');
            input.spellcheck = false;
            input.maxLength = 32;
            input.autocomplete = 'off';
            panel.appendChild(input);
        }

        const swatchList = options.swatches === false ? [] : (Array.isArray(options.swatches) ? options.swatches : DEFAULT_SWATCHES);
        const swatchBtns = [];
        if (swatchList.length) {
            const sw = document.createElement('div');
            sw.className = 'chillcolorpicker-swatches';
            sw.setAttribute('role', 'group');
            sw.setAttribute('aria-label', 'Preset colours');
            swatchList.forEach(c => {
                const hex = parse(c);
                if (!hex) return;
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'chillcolorpicker-swatch';
                b.dataset.color = hex;
                b.style.backgroundColor = hex;
                b.setAttribute('aria-label', hex);
                b.title = hex;
                b.setAttribute('aria-pressed', 'false');
                sw.appendChild(b);
                swatchBtns.push(b);
            });
            panel.appendChild(sw);
        }

        let hidden = null;
        if (options.name) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = options.name;
            root.appendChild(hidden);
        }

        let trigger = null, triggerSwatch = null, triggerText = null;
        if (popover) {
            trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'chillcolorpicker-trigger';
            trigger.setAttribute('aria-haspopup', 'dialog');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', panel.id);
            trigger.setAttribute('aria-label', (options.label || 'Colour') + ': ' + getHex());
            triggerSwatch = document.createElement('span');
            triggerSwatch.className = 'chillcolorpicker-preview';
            triggerSwatch.setAttribute('aria-hidden', 'true');
            triggerText = document.createElement('span');
            triggerText.className = 'chillcolorpicker-trigger-text';
            trigger.appendChild(triggerSwatch);
            trigger.appendChild(triggerText);
            root.appendChild(trigger);
            panel.classList.add('chillcolorpicker-popover');
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', options.label || 'Colour picker');
            panel.hidden = true;
        } else {
            root.appendChild(panel);
            root.setAttribute('role', 'group');
            root.setAttribute('aria-label', options.label || 'Colour picker');
        }

        function render(skipInput) {
            const hex = getHex();
            const pure = hsvToRgb(hsv.h, 1, 1);
            area.style.backgroundColor = toHex(pure);
            thumb.style.left = (hsv.s * 100) + '%';
            thumb.style.top = ((1 - hsv.v) * 100) + '%';
            thumb.style.backgroundColor = hex;
            area.setAttribute('aria-valuemin', '0');
            area.setAttribute('aria-valuemax', '100');
            area.setAttribute('aria-valuenow', String(Math.round(hsv.s * 100)));
            area.setAttribute('aria-valuetext', 'Saturation ' + Math.round(hsv.s * 100) + '%, brightness ' + Math.round(hsv.v * 100) + '%');
            preview.style.backgroundColor = hex;
            hue.value = String(Math.round(hsv.h));
            hue.setAttribute('aria-valuetext', Math.round(hsv.h) + ' degrees');
            if (input && !skipInput) { input.value = hex; input.removeAttribute('aria-invalid'); }
            swatchBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.color === hex ? 'true' : 'false'));
            if (hidden) hidden.value = hex;
            if (trigger) {
                triggerSwatch.style.backgroundColor = hex;
                triggerText.textContent = hex;
                trigger.setAttribute('aria-label', (options.label || 'Colour') + ': ' + hex);
            }
        }

        function fireInput() {
            const v = getValue();
            if (typeof options.onInput === 'function') options.onInput(v, api);
            emit('input', v);
        }
        function commit() {
            const v = getValue();
            if (v === lastCommitted) return;
            lastCommitted = v;
            if (typeof options.onChange === 'function') options.onChange(v, api);
            emit('change', v);
        }

        // ---- interactions ----
        function fromPointer(e) {
            const r = area.getBoundingClientRect();
            const x = r.width ? clamp((e.clientX - r.left) / r.width, 0, 1) : 0;
            const y = r.height ? clamp((e.clientY - r.top) / r.height, 0, 1) : 0;
            hsv.s = x; hsv.v = 1 - y;
            render();
            fireInput();
        }
        function moveDoc(e) { if (dragging) fromPointer(e); }
        function upDoc() {
            if (!dragging) return;
            dragging = false;
            document.removeEventListener('pointermove', moveDoc);
            document.removeEventListener('pointerup', upDoc);
            document.removeEventListener('pointercancel', upDoc);
            commit();
        }
        const onAreaDown = e => {
            if (disabled || (e.button !== undefined && e.button > 0)) return;
            dragging = true;
            if (area.focus) area.focus({ preventScroll: true });
            fromPointer(e);
            document.addEventListener('pointermove', moveDoc);
            document.addEventListener('pointerup', upDoc);
            document.addEventListener('pointercancel', upDoc);
            if (e.cancelable && e.preventDefault) e.preventDefault();
        };
        const onAreaKey = e => {
            if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
            const d = e.shiftKey ? 0.1 : 0.01;
            switch (e.key) {
                case 'ArrowLeft': hsv.s = clamp(hsv.s - d, 0, 1); break;
                case 'ArrowRight': hsv.s = clamp(hsv.s + d, 0, 1); break;
                case 'ArrowUp': hsv.v = clamp(hsv.v + d, 0, 1); break;
                case 'ArrowDown': hsv.v = clamp(hsv.v - d, 0, 1); break;
                case 'Home': hsv.s = 0; break;
                case 'End': hsv.s = 1; break;
                case 'PageUp': hsv.v = 1; break;
                case 'PageDown': hsv.v = 0; break;
                default: return;
            }
            e.preventDefault();
            render(); fireInput(); commit();
        };
        const onHueInput = () => { hsv.h = clamp(+hue.value, 0, 360); render(); fireInput(); };
        const onHueChange = () => { commit(); };
        function applyInputText(final) {
            const rgb = parseRgb(input.value);
            if (!rgb) {
                if (final) { input.setAttribute('aria-invalid', 'true'); }
                else if (input.value.length >= 7) input.setAttribute('aria-invalid', 'true');
                return false;
            }
            input.removeAttribute('aria-invalid');
            const nh = rgbToHsv(rgb.r, rgb.g, rgb.b);
            // keep hue stable for greys
            if (nh.s === 0 || nh.v === 0) nh.h = hsv.h;
            hsv = nh;
            render(true);
            fireInput();
            if (final) { render(); commit(); }
            return true;
        }
        const onTextInput = () => { applyInputText(false); };
        const onTextKey = e => { if (e.key === 'Enter') { e.preventDefault(); applyInputText(true); } };
        const onTextBlur = () => { if (!applyInputText(true)) { /* keep invalid flag; restore on next valid */ } };
        const onSwatchClick = e => {
            if (disabled) return;
            const b = e.target.closest ? e.target.closest('.chillcolorpicker-swatch') : null;
            if (!b) return;
            const rgb = hexToRgb(b.dataset.color);
            const nh = rgbToHsv(rgb.r, rgb.g, rgb.b);
            if (nh.s === 0 || nh.v === 0) nh.h = hsv.h;
            hsv = nh;
            render(); fireInput(); commit();
        };

        area.addEventListener('pointerdown', onAreaDown);
        area.addEventListener('keydown', onAreaKey);
        hue.addEventListener('input', onHueInput);
        hue.addEventListener('change', onHueChange);
        if (input) {
            input.addEventListener('input', onTextInput);
            input.addEventListener('keydown', onTextKey);
            input.addEventListener('blur', onTextBlur);
        }
        panel.addEventListener('click', onSwatchClick);

        // ---- popover ----
        function position() {
            if (!trigger) return;
            const t = trigger.getBoundingClientRect();
            const p = panel.getBoundingClientRect();
            const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
            const pl = options.placement || 'bottom-start';
            let top = pl.indexOf('top') === 0 ? t.top - p.height - 6 : t.bottom + 6;
            let left = pl.indexOf('end') > -1 ? t.right - p.width : t.left;
            if (top + p.height > vh - 8 && t.top - p.height - 6 > 8) top = t.top - p.height - 6;
            if (top < 8) top = Math.min(8, vh - p.height);
            left = clamp(left, 8, Math.max(8, vw - p.width - 8));
            panel.style.top = Math.max(0, top) + 'px';
            panel.style.left = Math.max(0, left) + 'px';
        }
        const onDocDown = e => {
            if (!open) return;
            if (panel.contains(e.target) || (trigger && trigger.contains(e.target))) return;
            close();
        };
        const onDocKey = e => {
            if (open && e.key === 'Escape') { e.stopPropagation(); close(true); }
        };
        const onReposition = () => position();
        function openPanel() {
            if (!popover || open || disabled || destroyed) return api;
            open = true;
            panel.hidden = false;
            document.body.appendChild(panel);
            position();
            trigger.setAttribute('aria-expanded', 'true');
            document.addEventListener('pointerdown', onDocDown, true);
            document.addEventListener('keydown', onDocKey, true);
            window.addEventListener('resize', onReposition);
            window.addEventListener('scroll', onReposition, true);
            if (area.focus) area.focus({ preventScroll: true });
            if (typeof options.onOpen === 'function') options.onOpen(api);
            emit('open', getValue());
            return api;
        }
        function close(refocus) {
            if (!popover || !open) return api;
            open = false;
            panel.hidden = true;
            if (panel.parentNode) panel.parentNode.removeChild(panel);
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('pointerdown', onDocDown, true);
            document.removeEventListener('keydown', onDocKey, true);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
            if (refocus === true && trigger.focus) trigger.focus();
            if (typeof options.onClose === 'function') options.onClose(api);
            emit('close', getValue());
            return api;
        }
        const onTriggerClick = () => { if (open) close(); else openPanel(); };
        if (trigger) trigger.addEventListener('click', onTriggerClick);

        function setDisabled(b) {
            disabled = !!b;
            root.classList.toggle('chillcolorpicker-disabled', disabled);
            [hue, input, trigger].concat(swatchBtns).forEach(el => { if (el) el.disabled = disabled; });
            area.tabIndex = disabled ? -1 : 0;
            area.setAttribute('aria-disabled', disabled ? 'true' : 'false');
            if (disabled && open) close();
        }

        const api = {
            element: root,
            panel,
            trigger,
            getValue,
            getHex,
            getRgb,
            getHsv: () => ({ h: hsv.h, s: hsv.s, v: hsv.v }),
            setValue(c, silent) {
                if (destroyed) return api;
                const rgb = parseRgb(c);
                if (!rgb) return api;
                const nh = rgbToHsv(rgb.r, rgb.g, rgb.b);
                if ((nh.s === 0 || nh.v === 0)) nh.h = hsv.h;
                hsv = nh;
                render();
                if (silent) lastCommitted = getValue(); else commit();
                return api;
            },
            open: openPanel,
            close: () => close(false),
            toggle() { return open ? close() : openPanel(); },
            isOpen: () => open,
            setDisabled,
            on(evt, fn) {
                (listeners[evt] = listeners[evt] || []).push(fn);
                return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn); };
            },
            destroy() {
                if (destroyed) return;
                if (open) close();
                dragging = true; upDoc();
                destroyed = true;
                area.removeEventListener('pointerdown', onAreaDown);
                area.removeEventListener('keydown', onAreaKey);
                hue.removeEventListener('input', onHueInput);
                hue.removeEventListener('change', onHueChange);
                if (input) {
                    input.removeEventListener('input', onTextInput);
                    input.removeEventListener('keydown', onTextKey);
                    input.removeEventListener('blur', onTextBlur);
                }
                panel.removeEventListener('click', onSwatchClick);
                if (trigger) trigger.removeEventListener('click', onTriggerClick);
                Object.keys(listeners).forEach(k => delete listeners[k]);
                if (panel.parentNode) panel.parentNode.removeChild(panel);
                if (root.parentNode) root.parentNode.removeChild(root);
            }
        };

        render();
        lastCommitted = getValue();
        setDisabled(disabled);
        const host = resolveEl(options.container);
        if (host) host.appendChild(root);
        return api;
    }

    const ChillColorPicker = {
        version: VERSION,
        create: createPicker,
        init(target, options) {
            const host = resolveEl(target);
            if (!host) return null;
            return createPicker(Object.assign({}, options, { container: host }));
        },
        parse, toHex, hexToRgb, rgbToHsv, hsvToRgb, rgbToHsl,
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillColorPicker;
    } else {
        window.ChillColorPicker = ChillColorPicker;
    }

})(typeof window !== 'undefined' ? window : this);
