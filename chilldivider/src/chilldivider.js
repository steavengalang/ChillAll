/**
 * ChillDivider - Zero-dependency Divider Component
 *
 * Horizontal / vertical separator with optional label, solid | dashed | dotted
 * line styles and gradient fades. Renders role="separator" with aria-orientation.
 *
 * @version 1.0.0
 * @license MIT
 *
 * Usage:
 *   const d = ChillDivider.create({ label: 'OR', align: 'center', parent: form });
 *   ChillDivider.create({ orientation: 'vertical' });                // between inline items
 *   ChillDivider.create({ lineStyle: 'dashed', gradient: true });
 *   ChillDivider.create({ gradient: ['#3b82f6', '#ec4899'], thickness: 2 });
 *   ChillDivider.init('hr.fancy', { lineStyle: 'dotted' });          // enhance existing elements
 *   d.setLabel('AND'); d.destroy();
 *
 * Options
 * | option       | default      | description                                                       |
 * |--------------|--------------|-------------------------------------------------------------------|
 * | orientation  | 'horizontal' | 'horizontal' | 'vertical'                                         |
 * | label        | ''           | label text (textContent) or a Node                                |
 * | labelHtml    | null         | explicit HTML label (trusted content only)                        |
 * | align        | 'center'     | 'start' | 'center' | 'end' - label position along the line         |
 * | lineStyle    | 'solid'      | 'solid' | 'dashed' | 'dotted'                                      |
 * | gradient     | false        | true (fade in/out) or array of CSS colors; overrides lineStyle    |
 * | thickness    | 1            | line thickness in px                                              |
 * | color        | null         | CSS colour override for the line                                  |
 * | spacing      | 'md'         | 'none' | 'sm' | 'md' | 'lg' | number (px) margin around the divider  |
 * | size         | 'md'         | 'sm' | 'md' | 'lg' - label font size                                |
 * | decorative   | false        | true -> role="none" (hidden from the accessibility tree)          |
 * | className    | ''           | extra class names                                                 |
 * | parent       | null         | element or selector to append to                                  |
 * | onChange     | null         | (state, divider) => void when a setter changes the divider        |
 *
 * Instance: element, setLabel(textOrNode, asHtml?), setOrientation(o), setAlign(a), setLineStyle(s),
 *           setGradient(g), on/off(event, fn), destroy()
 * Events: 'change' ({ option, value, divider }), 'destroy'
 * Note: with <hr> elements passed to init(), label options are ignored (hr cannot have children).
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chilldivider-styles';
    const ORIENTATIONS = ['horizontal', 'vertical'];
    const ALIGNS = ['start', 'center', 'end'];
    const LINE_STYLES = ['solid', 'dashed', 'dotted'];
    const SIZES = ['sm', 'md', 'lg'];
    const SPACING = { none: 0, sm: 8, md: 16, lg: 24 };
    const DEFAULTS = {
        orientation: 'horizontal', label: '', labelHtml: null, align: 'center', lineStyle: 'solid', gradient: false,
        thickness: 1, color: null, spacing: 'md', size: 'md', decorative: false, className: '', parent: null, onChange: null
    };

    const CSS = `
:root {
  --chilldivider-color: #e5e5e5;
  --chilldivider-text: #6b7280;
  --chilldivider-primary: #3b82f6;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) {
    --chilldivider-color: #404040;
    --chilldivider-text: #a3a3a3;
  }
}
:root[data-theme="dark"], :root.dark {
  --chilldivider-color: #404040;
  --chilldivider-text: #a3a3a3;
}

.chilldivider {
  --chilldivider-thickness: 1px;
  --chilldivider-style: solid;
  --chilldivider-gap: 16px;
  --chilldivider-offset: 24px;
  --chilldivider-line: var(--chilldivider-color);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  color: var(--chilldivider-text);
  font-size: 14px;
  line-height: 1.4;
  font-family: inherit;
  border: 0;
  padding: 0;
}
.chilldivider *, .chilldivider *::before, .chilldivider *::after { box-sizing: border-box; }
.chilldivider:focus-visible { outline: 2px solid var(--chilldivider-primary); outline-offset: 2px; }
.chilldivider-sm { font-size: 12px; }
.chilldivider-lg { font-size: 16px; }

/* horizontal ---------------------------------------------------------- */
.chilldivider-horizontal { flex-direction: row; width: 100%; margin: var(--chilldivider-gap) 0; }
/* no label: the element itself is the line */
.chilldivider-horizontal:not(.chilldivider-has-label) {
  height: 0;
  border-top: var(--chilldivider-thickness) var(--chilldivider-style) var(--chilldivider-line);
}
.chilldivider-horizontal.chilldivider-has-label::before,
.chilldivider-horizontal.chilldivider-has-label::after {
  content: "";
  flex: 1 1 auto;
  height: 0;
  border-top: var(--chilldivider-thickness) var(--chilldivider-style) var(--chilldivider-line);
}
.chilldivider-horizontal.chilldivider-align-start::before { flex: 0 0 var(--chilldivider-offset); }
.chilldivider-horizontal.chilldivider-align-end::after { flex: 0 0 var(--chilldivider-offset); }
.chilldivider-horizontal .chilldivider-label { padding: 0 12px; }

/* vertical ------------------------------------------------------------ */
.chilldivider-vertical {
  flex-direction: column;
  display: inline-flex;
  align-self: stretch;
  vertical-align: middle;
  min-height: 1.2em;
  height: auto;
  margin: 0 var(--chilldivider-gap);
}
.chilldivider-vertical:not(.chilldivider-has-label) {
  width: 0;
  border-left: var(--chilldivider-thickness) var(--chilldivider-style) var(--chilldivider-line);
}
.chilldivider-vertical.chilldivider-has-label { min-height: 4em; }
.chilldivider-vertical.chilldivider-has-label::before,
.chilldivider-vertical.chilldivider-has-label::after {
  content: "";
  flex: 1 1 auto;
  width: 0;
  border-left: var(--chilldivider-thickness) var(--chilldivider-style) var(--chilldivider-line);
}
.chilldivider-vertical.chilldivider-align-start::before { flex: 0 0 var(--chilldivider-offset); }
.chilldivider-vertical.chilldivider-align-end::after { flex: 0 0 var(--chilldivider-offset); }
.chilldivider-vertical .chilldivider-label { padding: 12px 0; writing-mode: horizontal-tb; }

.chilldivider-label { flex: 0 0 auto; white-space: nowrap; font-weight: 500; }

/* line styles --------------------------------------------------------- */
.chilldivider-dashed { --chilldivider-style: dashed; }
.chilldivider-dotted { --chilldivider-style: dotted; }

/* gradient (replaces the border with a background gradient) ----------- */
.chilldivider-gradient.chilldivider-horizontal:not(.chilldivider-has-label) {
  border: 0; height: var(--chilldivider-thickness);
  background: var(--chilldivider-gradient-full);
}
.chilldivider-gradient.chilldivider-vertical:not(.chilldivider-has-label) {
  border: 0; width: var(--chilldivider-thickness);
  background: var(--chilldivider-gradient-full);
}
.chilldivider-gradient.chilldivider-horizontal.chilldivider-has-label::before { border: 0; height: var(--chilldivider-thickness); background: var(--chilldivider-gradient-before); }
.chilldivider-gradient.chilldivider-horizontal.chilldivider-has-label::after { border: 0; height: var(--chilldivider-thickness); background: var(--chilldivider-gradient-after); }
.chilldivider-gradient.chilldivider-vertical.chilldivider-has-label::before { border: 0; width: var(--chilldivider-thickness); background: var(--chilldivider-gradient-before); }
.chilldivider-gradient.chilldivider-vertical.chilldivider-has-label::after { border: 0; width: var(--chilldivider-thickness); background: var(--chilldivider-gradient-after); }

/* <hr> enhancement */
hr.chilldivider { overflow: visible; }

@media (forced-colors: active) {
  .chilldivider { --chilldivider-line: CanvasText; }
  .chilldivider-gradient:not(.chilldivider-has-label) { background: CanvasText; }
}
`;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function isNode(v) { return !!v && typeof v === 'object' && typeof v.nodeType === 'number'; }
    function pick(v, list, fallback) { return list.indexOf(v) >= 0 ? v : fallback; }
    function safeColor(c) {
        if (typeof c !== 'string') return null;
        c = c.trim();
        if (!c || c.length > 80 || /url\(|expression|[;{}\\<>@]/i.test(c)) return null;
        return /^[#a-z0-9\s.,%()\-\/]+$/i.test(c) ? c : null;
    }

    class ChillDividerInstance {
        constructor(options, existing) {
            this.options = Object.assign({}, DEFAULTS, options || {});
            this._normalize();
            this._listeners = {};
            this._destroyed = false;
            this._owned = !existing;
            injectCSS();
            if (existing) {
                this.element = existing;
                this._attrs = { role: existing.getAttribute('role'), 'aria-orientation': existing.getAttribute('aria-orientation'), 'aria-hidden': existing.getAttribute('aria-hidden'), 'class': existing.getAttribute('class'), style: existing.getAttribute('style') };
                this._isHr = existing.tagName === 'HR';
            } else {
                this.element = document.createElement('div');
                this._isHr = false;
            }
            this._render();
            if (!existing && this.options.parent) {
                const p = typeof this.options.parent === 'string' ? document.querySelector(this.options.parent) : this.options.parent;
                if (p) p.appendChild(this.element);
            }
        }

        _normalize() {
            const o = this.options;
            o.orientation = pick(o.orientation, ORIENTATIONS, 'horizontal');
            o.align = pick(o.align, ALIGNS, 'center');
            o.lineStyle = pick(o.lineStyle, LINE_STYLES, 'solid');
            o.size = pick(o.size, SIZES, 'md');
        }

        _hasLabel() {
            const o = this.options;
            return !this._isHr && ((o.label !== '' && o.label != null && o.label !== false) || !!o.labelHtml);
        }

        _render() {
            const o = this.options;
            const el = this.element;
            const hasLabel = this._hasLabel();

            // classes
            const rm = [];
            el.classList.forEach(c => { if (/^chilldivider(-|$)/.test(c)) rm.push(c); });
            rm.forEach(c => el.classList.remove(c));
            const add = ['chilldivider', 'chilldivider-' + o.orientation, 'chilldivider-' + o.lineStyle, 'chilldivider-' + o.size, 'chilldivider-align-' + o.align];
            if (hasLabel) add.push('chilldivider-has-label');
            if (o.gradient) add.push('chilldivider-gradient');
            add.forEach(c => el.classList.add(c));
            if (o.className) String(o.className).split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));

            // semantics
            if (o.decorative) {
                el.setAttribute('role', 'none');
                el.removeAttribute('aria-orientation');
            } else {
                if (!this._isHr || o.orientation === 'vertical') el.setAttribute('role', 'separator');
                el.setAttribute('aria-orientation', o.orientation);
            }

            // custom properties
            const st = el.style;
            const thickness = Number(o.thickness);
            if (isFinite(thickness) && thickness > 0) st.setProperty('--chilldivider-thickness', Math.min(thickness, 32) + 'px');
            else st.removeProperty('--chilldivider-thickness');
            const color = safeColor(o.color);
            if (color) st.setProperty('--chilldivider-line', color); else st.removeProperty('--chilldivider-line');
            let gap = typeof o.spacing === 'number' ? o.spacing : SPACING[o.spacing];
            if (gap == null || !isFinite(gap)) gap = 16;
            st.setProperty('--chilldivider-gap', Math.max(0, gap) + 'px');
            this._applyGradient();

            // label
            const old = el.querySelector(':scope > .chilldivider-label');
            if (old) el.removeChild(old);
            if (hasLabel) {
                const span = document.createElement('span');
                span.className = 'chilldivider-label';
                if (o.labelHtml) span.innerHTML = String(o.labelHtml);
                else if (isNode(o.label)) span.appendChild(o.label);
                else span.textContent = String(o.label);
                el.appendChild(span);
                this.labelEl = span;
            } else {
                this.labelEl = null;
            }
        }

        _applyGradient() {
            const o = this.options;
            const st = this.element.style;
            const names = ['--chilldivider-gradient-full', '--chilldivider-gradient-before', '--chilldivider-gradient-after'];
            if (!o.gradient) { names.forEach(n => st.removeProperty(n)); return; }
            const dir = o.orientation === 'vertical' ? 'to bottom' : 'to right';
            let colors = null;
            if (Array.isArray(o.gradient)) {
                colors = o.gradient.map(safeColor).filter(Boolean);
                if (colors.length === 1) colors.push(colors[0]);
                if (colors.length < 2) colors = null;
            } else if (typeof o.gradient === 'string') {
                const c = o.gradient.split(',').map(safeColor).filter(Boolean);
                if (c.length >= 2) colors = c;
            }
            if (colors) {
                const g = 'linear-gradient(' + dir + ', ' + colors.join(', ') + ')';
                st.setProperty(names[0], g); st.setProperty(names[1], g); st.setProperty(names[2], g);
            } else {
                const base = safeColor(o.color) || 'var(--chilldivider-color)';
                st.setProperty(names[0], 'linear-gradient(' + dir + ', transparent, ' + base + ', transparent)');
                st.setProperty(names[1], 'linear-gradient(' + dir + ', transparent, ' + base + ')');
                st.setProperty(names[2], 'linear-gradient(' + dir + ', ' + base + ', transparent)');
            }
        }

        _change(option, value) {
            if (this._destroyed) return;
            this._render();
            const detail = { option: option, value: value, divider: this };
            this._emit('change', detail);
            if (typeof this.options.onChange === 'function') this.options.onChange(detail, this);
        }

        setLabel(label, asHtml) {
            if (asHtml) { this.options.labelHtml = label; this.options.label = ''; }
            else { this.options.label = label == null ? '' : label; this.options.labelHtml = null; }
            this._change('label', label);
            return this;
        }
        setOrientation(orientation) {
            if (ORIENTATIONS.indexOf(orientation) < 0) return this;
            this.options.orientation = orientation; this._change('orientation', orientation); return this;
        }
        setAlign(align) {
            if (ALIGNS.indexOf(align) < 0) return this;
            this.options.align = align; this._change('align', align); return this;
        }
        setLineStyle(lineStyle) {
            if (LINE_STYLES.indexOf(lineStyle) < 0) return this;
            this.options.lineStyle = lineStyle; this._change('lineStyle', lineStyle); return this;
        }
        setGradient(gradient) {
            this.options.gradient = gradient || false; this._change('gradient', gradient); return this;
        }

        on(event, fn) {
            if (typeof fn !== 'function') return this;
            (this._listeners[event] = this._listeners[event] || []).push(fn);
            return this;
        }
        off(event, fn) {
            const l = this._listeners[event];
            if (!l) return this;
            if (!fn) delete this._listeners[event]; else this._listeners[event] = l.filter(f => f !== fn);
            return this;
        }
        _emit(event, detail) {
            (this._listeners[event] || []).slice().forEach(fn => {
                try { fn(detail); } catch (err) { if (typeof console !== 'undefined') console.error(err); }
            });
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._emit('destroy', { divider: this });
            const el = this.element;
            if (this._owned) {
                if (el.parentNode) el.parentNode.removeChild(el);
            } else {
                if (this.labelEl && this.labelEl.parentNode === el) el.removeChild(this.labelEl);
                Object.keys(this._attrs).forEach(a => {
                    if (this._attrs[a] == null) el.removeAttribute(a); else el.setAttribute(a, this._attrs[a]);
                });
            }
            this._listeners = {};
        }
    }

    const ChillDivider = {
        version: VERSION,

        create(options) {
            return new ChillDividerInstance(options);
        },

        /** Element -> single instance; selector / list -> array of instances. */
        init(selectorOrElement, options) {
            if (typeof document === 'undefined') return null;
            if (isNode(selectorOrElement)) return new ChillDividerInstance(options, selectorOrElement);
            let list = [];
            if (typeof selectorOrElement === 'string') list = Array.prototype.slice.call(document.querySelectorAll(selectorOrElement));
            else if (selectorOrElement && typeof selectorOrElement.length === 'number') list = Array.prototype.slice.call(selectorOrElement);
            return list.map(el => new ChillDividerInstance(options, el));
        },

        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillDivider;
    } else {
        window.ChillDivider = ChillDivider;
    }

})(typeof window !== 'undefined' ? window : this);
