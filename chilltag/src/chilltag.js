/**
 * ChillTag / ChillChip - Zero-dependency Tag Component
 *
 * Usage:
 *   const tag = ChillTag.create({ text: 'Design', color: 'purple', removable: true, onRemove: t => {} });
 *   const input = ChillTag.createInput({ onChange: tags => {} });
 *
 * create(options):
 *   text|label   string   Tag text (escaped; `html: true` opts in to trusted HTML)
 *   html         boolean  false
 *   size         sm|md|lg ('md')
 *   variant      primary|success|warning|error
 *   color        preset: blue|green|red|amber|orange|purple|pink|teal|gray
 *   solid, pill, selected, disabled
 *   avatar       string   image URL (set via the DOM, never parsed as HTML)
 *   icon         string   trusted icon markup (e.g. svg)
 *   onClick(tag, event)   makes the tag a keyboard-operable button (Enter / Space)
 *   removable    boolean  adds an accessible remove button; Delete/Backspace on a focused tag also removes
 *   onRemove(tag)         called when removed; the tag is NOT removed automatically unless autoRemove !== false
 *   autoRemove   boolean  true   remove the element from the DOM after onRemove
 *   removeLabel  string   'Remove'  (accessible name; "Remove <text>" is used when omitted)
 * The element exposes tag.chilltag = { setText, destroy } and tag.destroy().
 *
 * createInput(options): placeholder, size, variant, color, maxTags, onChange(tags), ariaLabel,
 *   wrapper.getTags()/setTags()/addTag()/removeTag()/destroy(); announces add/remove in a live region.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilltag_css_injected__';
    const COLORS = { blue: [59, 130, 246, '#2563eb', '#93c5fd'], green: [34, 197, 94, '#15803d', '#86efac'],
        red: [239, 68, 68, '#b91c1c', '#fca5a5'], amber: [245, 158, 11, '#b45309', '#fcd34d'],
        orange: [249, 115, 22, '#c2410c', '#fdba74'], purple: [168, 85, 247, '#7e22ce', '#d8b4fe'],
        pink: [236, 72, 153, '#be185d', '#f9a8d4'], teal: [20, 184, 166, '#0f766e', '#5eead4'],
        gray: [107, 114, 128, '#374151', '#d1d5db'] };

    function colorCSS() {
        let light = '', dark = '', rules = '';
        Object.keys(COLORS).forEach(function (k) {
            const c = COLORS[k];
            light += '--chilltag-' + k + '-fg:' + c[3] + ';--chilltag-' + k + '-rgb:' + c[0] + ',' + c[1] + ',' + c[2] + ';';
            dark += '--chilltag-' + k + '-fg:' + c[4] + ';';
            rules += '.chilltag-c-' + k + '{background:rgba(var(--chilltag-' + k + '-rgb),0.12);color:var(--chilltag-' + k + '-fg);border-color:rgba(var(--chilltag-' + k + '-rgb),0.3);}'
                + '.chilltag-solid.chilltag-c-' + k + '{background:rgb(var(--chilltag-' + k + '-rgb));color:#fff;border-color:rgb(var(--chilltag-' + k + '-rgb));}';
        });
        return { light: light, dark: dark, rules: rules };
    }

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chilltag-styles')) return;
        const cc = colorCSS();

        const style = document.createElement('style');
        style.id = 'chilltag-styles';
        style.textContent = `
      :root {
        --chilltag-bg: #f3f4f6;
        --chilltag-text: #374151;
        --chilltag-border: #e5e7eb;
        --chilltag-hover: #e5e7eb;
        --chilltag-primary: #3b82f6;
        --chilltag-success: #22c55e;
        --chilltag-warning: #f59e0b;
        --chilltag-error: #ef4444;
        --chilltag-placeholder: #9ca3af;
        --chilltag-ring: #3b82f6;
        ${cc.light}
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltag-bg: #374151;
          --chilltag-text: #e5e7eb;
          --chilltag-border: #4b5563;
          --chilltag-hover: #4b5563;
          --chilltag-ring: #60a5fa;
          ${cc.dark}
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilltag-bg: #374151;
        --chilltag-text: #e5e7eb;
        --chilltag-border: #4b5563;
        --chilltag-hover: #4b5563;
        --chilltag-ring: #60a5fa;
        ${cc.dark}
      }

      .chilltag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--chilltag-text);
        background: var(--chilltag-bg);
        border: 1px solid var(--chilltag-border);
        border-radius: 6px;
        cursor: default;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
        user-select: none;
        box-sizing: border-box;
      }

      .chilltag:focus-visible,
      .chilltag-close:focus-visible {
        outline: 2px solid var(--chilltag-ring);
        outline-offset: 2px;
      }

      .chilltag-clickable { cursor: pointer; }
      .chilltag-clickable:hover { background: var(--chilltag-hover); }

      /* Variants */
      .chilltag-primary { background: rgba(59, 130, 246, 0.1); color: var(--chilltag-primary); border-color: rgba(59, 130, 246, 0.2); }
      .chilltag-success { background: rgba(34, 197, 94, 0.1); color: var(--chilltag-success); border-color: rgba(34, 197, 94, 0.2); }
      .chilltag-warning { background: rgba(245, 158, 11, 0.1); color: var(--chilltag-warning); border-color: rgba(245, 158, 11, 0.2); }
      .chilltag-error { background: rgba(239, 68, 68, 0.1); color: var(--chilltag-error); border-color: rgba(239, 68, 68, 0.2); }

      /* Colour presets */
      ${cc.rules}

      /* Solid */
      .chilltag-solid.chilltag-primary { background: var(--chilltag-primary); color: white; border-color: var(--chilltag-primary); }
      .chilltag-solid.chilltag-success { background: var(--chilltag-success); color: white; border-color: var(--chilltag-success); }
      .chilltag-solid.chilltag-warning { background: var(--chilltag-warning); color: white; border-color: var(--chilltag-warning); }
      .chilltag-solid.chilltag-error { background: var(--chilltag-error); color: white; border-color: var(--chilltag-error); }

      /* Sizes */
      .chilltag-sm { padding: 4px 8px; font-size: 11px; border-radius: 4px; }
      .chilltag-lg { padding: 8px 16px; font-size: 14px; border-radius: 8px; }

      /* Pill Shape */
      .chilltag-pill { border-radius: 9999px; }

      /* Icon */
      .chilltag-icon { width: 14px; height: 14px; flex-shrink: 0; }
      .chilltag-sm .chilltag-icon { width: 12px; height: 12px; }
      .chilltag-lg .chilltag-icon { width: 16px; height: 16px; }

      /* Avatar in Tag */
      .chilltag-avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; margin-left: -4px; }
      .chilltag-sm .chilltag-avatar { width: 16px; height: 16px; margin-left: -2px; }
      .chilltag-lg .chilltag-avatar { width: 24px; height: 24px; margin-left: -6px; }

      /* Close Button */
      .chilltag-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        padding: 0;
        margin-left: 2px;
        margin-right: -6px;
        background: none;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
        transition: opacity 0.15s ease, background 0.15s ease;
      }
      .chilltag-close:hover, .chilltag-close:focus-visible { opacity: 1; background: rgba(127, 127, 127, 0.25); }
      .chilltag-close svg { width: 10px; height: 10px; }

      /* Selected State */
      .chilltag-selected { background: var(--chilltag-primary); color: white; border-color: var(--chilltag-primary); }

      /* Disabled */
      .chilltag-disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

      /* Groups */
      .chilltag-group { display: flex; flex-wrap: wrap; gap: 8px; }

      /* Input for Adding Tags */
      .chilltag-input-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 12px;
        background: var(--chilltag-bg);
        border: 1px solid var(--chilltag-border);
        border-radius: 8px;
        min-height: 42px;
        align-items: center;
      }
      .chilltag-input-wrapper:focus-within { border-color: var(--chilltag-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
      .chilltag-input { flex: 1; min-width: 100px; padding: 4px 0; font-size: 14px; background: none; border: none; outline: none; color: var(--chilltag-text); }
      .chilltag-input::placeholder { color: var(--chilltag-placeholder); }

      .chilltag-sr {
        position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
        clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .chilltag, .chilltag-close { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function create(options) {
        options = options || {};
        injectCSS();

        const tag = document.createElement('span');
        tag.className = 'chilltag chilltag-' + (options.size || 'md');

        if (options.variant) tag.classList.add('chilltag-' + options.variant);
        if (options.color && COLORS[options.color]) tag.classList.add('chilltag-c-' + options.color);
        if (options.solid) tag.classList.add('chilltag-solid');
        if (options.pill) tag.classList.add('chilltag-pill');
        if (options.selected) tag.classList.add('chilltag-selected');
        if (options.disabled) { tag.classList.add('chilltag-disabled'); tag.setAttribute('aria-disabled', 'true'); }

        if (options.avatar) {
            const img = document.createElement('img');
            img.className = 'chilltag-avatar';
            img.alt = '';
            img.setAttribute('src', String(options.avatar));
            tag.appendChild(img);
        }

        if (options.icon) {
            const ic = document.createElement('span');
            ic.className = 'chilltag-icon';
            ic.setAttribute('aria-hidden', 'true');
            ic.innerHTML = options.icon; // trusted, developer supplied icon markup
            tag.appendChild(ic);
        }

        const textEl = document.createElement('span');
        textEl.className = 'chilltag-text';
        function setText(t) {
            if (options.html) textEl.innerHTML = t == null ? '' : String(t);
            else textEl.textContent = t == null ? '' : String(t);
        }
        setText(options.text != null ? options.text : (options.label != null ? options.label : ''));
        tag.appendChild(textEl);

        const cleanups = [];
        function listen(el, ev, fn) { el.addEventListener(ev, fn); cleanups.push(function () { el.removeEventListener(ev, fn); }); }

        let closeBtn = null;
        function doRemove() {
            if (options.disabled) return;
            if (options.onRemove) options.onRemove(tag);
            if (options.autoRemove !== false && tag.parentNode) { destroy(); }
        }

        if (options.onClick) {
            tag.classList.add('chilltag-clickable');
            if (!options.disabled) tag.tabIndex = 0;
            tag.setAttribute('role', 'button');
            if (options.selected != null && options.pressed !== false) tag.setAttribute('aria-pressed', options.selected ? 'true' : 'false');
            listen(tag, 'click', function (e) {
                if (e.target.closest && e.target.closest('.chilltag-close')) return;
                options.onClick(tag, e);
            });
            listen(tag, 'keydown', function (e) {
                if (e.target !== tag) return;
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    options.onClick(tag, e);
                }
            });
        }

        if (options.removable) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'chilltag-close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', options.removeLabel || ('Remove ' + (textEl.textContent || 'tag')));
            closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            tag.appendChild(closeBtn);
            listen(closeBtn, 'click', function (e) { e.stopPropagation(); doRemove(); });
            if (options.onClick) {
                listen(tag, 'keydown', function (e) {
                    if (e.target === tag && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); doRemove(); }
                });
            }
        }

        function destroy() {
            while (cleanups.length) cleanups.pop()();
            if (tag.parentNode) tag.parentNode.removeChild(tag);
        }

        tag.chilltag = { setText: setText, destroy: destroy };
        tag.destroy = destroy;

        return tag;
    }

    function createInput(options) {
        options = options || {};
        injectCSS();

        const wrapper = document.createElement('div');
        wrapper.className = 'chilltag-input-wrapper';
        wrapper.setAttribute('role', 'group');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chilltag-input';
        input.placeholder = options.placeholder || 'Add a tag...';
        input.setAttribute('aria-label', options.ariaLabel || options.placeholder || 'Add a tag');

        const live = document.createElement('span');
        live.className = 'chilltag-sr';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');

        wrapper.appendChild(input);
        wrapper.appendChild(live);

        const tags = [];
        const els = [];

        function announce(msg) { live.textContent = msg; }
        function emit() { if (options.onChange) options.onChange([].concat(tags)); }

        function removeTag(text, silent) {
            const i = tags.indexOf(text);
            if (i < 0) return false;
            tags.splice(i, 1);
            const el = els.splice(i, 1)[0];
            if (el) el.destroy();
            if (!silent) { announce('Removed ' + text); emit(); }
            return true;
        }

        function addTag(raw, silent) {
            const text = String(raw == null ? '' : raw).trim();
            if (!text) return false;
            if (options.maxTags && tags.length >= options.maxTags) return false;
            if (tags.indexOf(text) !== -1) return false;

            const el = create({
                text: text,
                size: options.size,
                variant: options.variant,
                color: options.color,
                removable: true,
                autoRemove: false,
                onRemove: function () { removeTag(text); input.focus(); }
            });

            wrapper.insertBefore(el, input);
            tags.push(text);
            els.push(el);
            input.value = '';
            if (!silent) { announce('Added ' + text); emit(); }
            return true;
        }

        function onKey(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(input.value);
            } else if (e.key === 'Backspace' && !input.value && tags.length > 0) {
                removeTag(tags[tags.length - 1]);
            }
        }
        input.addEventListener('keydown', onKey);

        wrapper.getTags = function () { return [].concat(tags); };
        wrapper.setTags = function (newTags) {
            while (tags.length) removeTag(tags[0], true);
            (newTags || []).forEach(function (t) { addTag(t, true); });
            emit();
        };
        wrapper.addTag = function (t) { return addTag(t); };
        wrapper.removeTag = function (t) { return removeTag(t); };
        wrapper.destroy = function () {
            input.removeEventListener('keydown', onKey);
            els.forEach(function (el) { el.destroy(); });
            els.length = 0; tags.length = 0;
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        };

        return wrapper;
    }

    const ChillTag = {
        version: VERSION,
        colors: Object.keys(COLORS),

        create,
        createInput,

        injectCSS() {
            injectCSS();
        }
    };

    // Also export as ChillChip for convenience
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTag;
        module.exports.ChillChip = ChillTag;
    } else {
        window.ChillTag = ChillTag;
        window.ChillChip = ChillTag;
    }

})(typeof window !== 'undefined' ? window : this);
