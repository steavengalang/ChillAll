/**
 * ChillAccordion - Zero-dependency Accordion Component
 *
 * Usage:
 *   const acc = ChillAccordion.init('#faq', {
 *     items: [{ title: 'What is it?', content: 'Plain text body' }, { id: 'b', title: 'More', content: 'Body', disabled: false }],
 *     mode: 'single', defaultOpen: [0], onChange(openIndexes, index, isOpen) {}
 *   });
 *   acc.open(1); acc.close(1); acc.toggle(1); acc.openAll(); acc.closeAll(); acc.destroy();
 *
 * `init(selectorOrElement, options)` REPLACES the target element with the accordion (destroy() puts it back).
 *
 * Options (all optional):
 *   items         array    []        { id?, title, content, icon?, disabled?, titleHtml?, contentHtml?, iconHtml? }
 *                                    title/content/icon are rendered as TEXT (icon/content may also be a DOM Node).
 *   html          boolean  false     Opt in: item title/content/icon STRINGS are inserted as HTML (trusted markup only).
 *   titleHtml / contentHtml / iconHtml  (per item)  explicit HTML for one part.
 *   mode          string   'single'  'single' | 'multiple'   (alias: multiple: true)
 *   multiple      boolean  false     Same as mode:'multiple'.
 *   collapsible   boolean  true      In single mode, allow closing the open item.
 *   defaultOpen   array    []        Indexes or item ids open at start (single mode: only the first is used).
 *   variant       string   'default' 'default' | 'flush' | 'separated'
 *   size          string   'md'      'sm' | 'md' | 'lg'
 *   headingLevel  number   3         aria-level of each trigger heading (1-6).
 *   onChange      function           (openIndexes[], index, isOpen)
 *
 * Instance: toggle(itemOrIndexOrId), open(i), close(i), openAll(), closeAll(), isOpen(i), on(evt, fn), off(evt, fn), destroy()
 * Properties: accordion (root element), openItems (Set of indexes).  Events: 'change'.
 * Keyboard: Enter/Space toggle, ArrowDown/ArrowUp move between headers (wraps), Home/End jump to first/last.
 * Height is animated; disabled automatically with prefers-reduced-motion.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillaccordion_css_injected__';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (window[CSS_INJECTED_FLAG] && document.getElementById('chillaccordion-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillaccordion-styles';
        style.textContent = `
      :root {
        --chillaccordion-bg: #ffffff;
        --chillaccordion-text: #171717;
        --chillaccordion-text-muted: #6b7280;
        --chillaccordion-border: #e5e5e5;
        --chillaccordion-hover: #f5f5f5;
        --chillaccordion-active: #2563eb;
        --chillaccordion-focus: rgba(59, 130, 246, 0.55);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillaccordion-bg: #171717;
          --chillaccordion-text: #fafafa;
          --chillaccordion-text-muted: #a3a3a3;
          --chillaccordion-border: #262626;
          --chillaccordion-hover: #262626;
          --chillaccordion-active: #60a5fa;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillaccordion-bg: #171717;
        --chillaccordion-text: #fafafa;
        --chillaccordion-text-muted: #a3a3a3;
        --chillaccordion-border: #262626;
        --chillaccordion-hover: #262626;
        --chillaccordion-active: #60a5fa;
      }

      .chillaccordion {
        border: 1px solid var(--chillaccordion-border);
        border-radius: 12px;
        overflow: hidden;
        background: var(--chillaccordion-bg);
      }

      .chillaccordion-item {
        border-bottom: 1px solid var(--chillaccordion-border);
      }

      .chillaccordion-item:last-child {
        border-bottom: none;
      }

      .chillaccordion-heading {
        margin: 0;
        font: inherit;
      }

      .chillaccordion-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 44px;
        padding: 16px 20px;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 15px;
        font-weight: 500;
        color: var(--chillaccordion-text);
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .chillaccordion-trigger:hover:not(:disabled) {
        background: var(--chillaccordion-hover);
      }

      .chillaccordion-trigger:focus { outline: none; }

      .chillaccordion-trigger:focus-visible {
        outline: 2px solid var(--chillaccordion-focus);
        outline-offset: -2px;
        background: var(--chillaccordion-hover);
      }

      .chillaccordion-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chillaccordion-trigger-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chillaccordion-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: var(--chillaccordion-text-muted);
      }

      .chillaccordion-arrow {
        width: 20px;
        height: 20px;
        color: var(--chillaccordion-text-muted);
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }

      .chillaccordion-item.open .chillaccordion-arrow {
        transform: rotate(180deg);
      }

      .chillaccordion-content {
        height: 0;
        overflow: hidden;
        visibility: hidden;
        transition: height 0.25s ease, visibility 0s linear 0.25s;
      }

      .chillaccordion-item.open .chillaccordion-content {
        visibility: visible;
        transition: height 0.25s ease, visibility 0s linear 0s;
      }

      .chillaccordion-body {
        padding: 0 20px 16px;
        font-size: 14px;
        color: var(--chillaccordion-text-muted);
        line-height: 1.6;
      }

      /* Variants */
      .chillaccordion-flush {
        border: none;
        border-radius: 0;
      }

      .chillaccordion-flush .chillaccordion-item {
        border: none;
        border-bottom: 1px solid var(--chillaccordion-border);
      }

      .chillaccordion-separated .chillaccordion-item {
        border: 1px solid var(--chillaccordion-border);
        border-radius: 8px;
        margin-bottom: 8px;
        overflow: hidden;
      }

      .chillaccordion-separated .chillaccordion-item:last-child {
        margin-bottom: 0;
      }

      .chillaccordion-separated {
        border: none;
        background: none;
        overflow: visible;
      }

      /* Sizes */
      .chillaccordion-sm .chillaccordion-trigger {
        padding: 12px 16px;
        font-size: 14px;
      }

      .chillaccordion-sm .chillaccordion-body {
        padding: 0 16px 12px;
        font-size: 13px;
      }

      .chillaccordion-lg .chillaccordion-trigger {
        padding: 20px 24px;
        font-size: 16px;
      }

      .chillaccordion-lg .chillaccordion-body {
        padding: 0 24px 20px;
        font-size: 15px;
      }

      /* Open state */
      .chillaccordion-item.open .chillaccordion-trigger {
        color: var(--chillaccordion-active);
      }

      .chillaccordion-item.open .chillaccordion-icon {
        color: var(--chillaccordion-active);
      }

      @media (prefers-reduced-motion: reduce) {
        .chillaccordion-content,
        .chillaccordion-item.open .chillaccordion-content,
        .chillaccordion-arrow,
        .chillaccordion-trigger {
          transition: none !important;
        }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function fill(target, value, html, htmlOverride) {
        if (htmlOverride != null) { target.innerHTML = String(htmlOverride); return; }
        if (value == null || value === '') return;
        if (typeof value === 'object' && value.nodeType) target.appendChild(value);
        else if (html) target.innerHTML = String(value);
        else target.textContent = String(value);
    }

    function prefersReducedMotion() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (e) { return false; }
    }

    class ChillAccordionInstance {
        constructor(selector, options = {}) {
            if (typeof document === 'undefined') throw new Error('ChillAccordion requires a DOM');
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = {
                items: [],
                multiple: false,
                defaultOpen: [],
                variant: 'default',
                size: 'md',
                onChange: null,
                collapsible: true,
                headingLevel: 3,
                html: false,
                ...options
            };
            if (this.options.mode === 'multiple') this.options.multiple = true;
            if (this.options.mode === 'single') this.options.multiple = false;
            this.options.mode = this.options.multiple ? 'multiple' : 'single';

            this.openItems = new Set();
            this.destroyed = false;
            this._listeners = [];
            this._handlers = {};
            this._timers = new Set();
            this._uid = ++uid;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _indexOf(ref) {
            if (ref && ref.nodeType) return parseInt(ref.getAttribute('data-index'), 10);
            if (typeof ref === 'number') return ref;
            const idx = this.options.items.findIndex(it => it && it.id !== undefined && String(it.id) === String(ref));
            if (idx >= 0) return idx;
            const n = parseInt(ref, 10);
            return isNaN(n) ? -1 : n;
        }

        _itemEl(index) {
            return this.accordion.querySelector(`.chillaccordion-item[data-index="${index}"]`);
        }

        render() {
            const o = this.options;
            const accordion = document.createElement('div');
            accordion.className = `chillaccordion chillaccordion-${o.size}`;
            if (o.variant !== 'default') accordion.classList.add(`chillaccordion-${o.variant}`);

            // Normalise defaultOpen (indexes or ids) into indexes
            const wanted = [].concat(o.defaultOpen == null ? [] : o.defaultOpen);
            wanted.forEach(ref => {
                const i = this._indexOf(ref);
                if (i >= 0 && i < o.items.length && !(o.items[i] && o.items[i].disabled)) this.openItems.add(i);
            });
            if (!o.multiple && this.openItems.size > 1) {
                const first = Array.from(this.openItems).sort((a, b) => a - b)[0];
                this.openItems = new Set([first]);
            }

            const level = Math.min(6, Math.max(1, parseInt(o.headingLevel, 10) || 3));
            o.items.forEach((item, index) => {
                item = item || {};
                const isOpen = this.openItems.has(index);
                const pid = `chillaccordion-${this._uid}`;
                const row = document.createElement('div');
                row.className = 'chillaccordion-item' + (isOpen ? ' open' : '');
                row.setAttribute('data-index', String(index));
                if (item.id !== undefined && item.id !== null) row.setAttribute('data-id', String(item.id));

                const heading = document.createElement('div');
                heading.className = 'chillaccordion-heading';
                heading.setAttribute('role', 'heading');
                heading.setAttribute('aria-level', String(level));

                const trigger = document.createElement('button');
                trigger.type = 'button';
                trigger.className = 'chillaccordion-trigger';
                trigger.id = `${pid}-trigger-${index}`;
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                trigger.setAttribute('aria-controls', `${pid}-panel-${index}`);
                if (item.disabled) trigger.disabled = true;

                const tc = document.createElement('span');
                tc.className = 'chillaccordion-trigger-content';
                if (item.icon || item.iconHtml) {
                    const ic = document.createElement('span');
                    ic.className = 'chillaccordion-icon';
                    ic.setAttribute('aria-hidden', 'true');
                    fill(ic, item.icon, o.html === true, item.iconHtml);
                    tc.appendChild(ic);
                }
                const title = document.createElement('span');
                title.className = 'chillaccordion-title';
                fill(title, item.title, o.html === true, item.titleHtml);
                tc.appendChild(title);
                trigger.appendChild(tc);

                const svgNS = 'http://www.w3.org/2000/svg';
                const arrow = document.createElementNS(svgNS, 'svg');
                arrow.setAttribute('class', 'chillaccordion-arrow');
                arrow.setAttribute('viewBox', '0 0 24 24');
                arrow.setAttribute('fill', 'none');
                arrow.setAttribute('stroke', 'currentColor');
                arrow.setAttribute('stroke-width', '2');
                arrow.setAttribute('aria-hidden', 'true');
                arrow.setAttribute('focusable', 'false');
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', 'M6 9l6 6 6-6');
                arrow.appendChild(path);
                trigger.appendChild(arrow);
                heading.appendChild(trigger);

                const panel = document.createElement('div');
                panel.className = 'chillaccordion-content';
                panel.id = `${pid}-panel-${index}`;
                panel.setAttribute('role', 'region');
                panel.setAttribute('aria-labelledby', trigger.id);
                panel.style.height = isOpen ? 'auto' : '0px';
                const body = document.createElement('div');
                body.className = 'chillaccordion-body';
                fill(body, item.content, o.html === true, item.contentHtml);
                panel.appendChild(body);

                row.appendChild(heading);
                row.appendChild(panel);
                accordion.appendChild(row);
            });

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(accordion, this.element);
            }
            this.accordion = accordion;
        }

        _listen(target, evt, fn) {
            target.addEventListener(evt, fn);
            this._listeners.push([target, evt, fn]);
        }

        _triggers() {
            return Array.prototype.slice.call(this.accordion.querySelectorAll('.chillaccordion-trigger'))
                .filter(t => !t.disabled);
        }

        bindEvents() {
            this._listen(this.accordion, 'click', (e) => {
                const trigger = e.target.closest && e.target.closest('.chillaccordion-trigger');
                if (!trigger || !this.accordion.contains(trigger) || trigger.disabled) return;
                this.toggle(trigger.closest('.chillaccordion-item'));
            });

            this._listen(this.accordion, 'keydown', (e) => {
                const trigger = e.target.closest && e.target.closest('.chillaccordion-trigger');
                if (!trigger) return;
                const list = this._triggers();
                const i = list.indexOf(trigger);
                if (i < 0) return;
                let next = null;
                switch (e.key) {
                    case 'ArrowDown': next = list[(i + 1) % list.length]; break;
                    case 'ArrowUp': next = list[(i - 1 + list.length) % list.length]; break;
                    case 'Home': next = list[0]; break;
                    case 'End': next = list[list.length - 1]; break;
                }
                if (next) {
                    e.preventDefault();
                    next.focus();
                }
            });
        }

        isOpen(ref) {
            return this.openItems.has(this._indexOf(ref));
        }

        _setOpen(item, open, animate) {
            const trigger = item.querySelector('.chillaccordion-trigger');
            const panel = item.querySelector('.chillaccordion-content');
            const index = parseInt(item.getAttribute('data-index'), 10);
            item.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) this.openItems.add(index); else this.openItems.delete(index);

            const animated = animate !== false && !prefersReducedMotion();
            if (panel._chillTimer) { clearTimeout(panel._chillTimer); this._timers.delete(panel._chillTimer); panel._chillTimer = null; }
            if (!animated) {
                panel.style.height = open ? 'auto' : '0px';
                return;
            }
            const finish = () => {
                if (panel._chillTimer) { this._timers.delete(panel._chillTimer); panel._chillTimer = null; }
                if (this.destroyed) return;
                if (item.classList.contains('open')) panel.style.height = 'auto';
            };
            if (open) {
                panel.style.height = panel.scrollHeight + 'px';
                panel._chillTimer = setTimeout(finish, 300);
            } else {
                panel.style.height = panel.scrollHeight + 'px';
                void panel.offsetHeight; // force reflow so the transition starts from the real height
                panel.style.height = '0px';
            }
            if (panel._chillTimer) this._timers.add(panel._chillTimer);
        }

        toggle(ref) {
            if (this.destroyed) return;
            const index = this._indexOf(ref);
            const item = this._itemEl(index);
            if (!item) return;
            const trigger = item.querySelector('.chillaccordion-trigger');
            if (trigger.disabled) return;
            const wasOpen = item.classList.contains('open');

            if (wasOpen && !this.options.multiple && this.options.collapsible === false) return;

            if (!this.options.multiple && !wasOpen) {
                this.accordion.querySelectorAll('.chillaccordion-item.open').forEach(openItem => {
                    if (openItem !== item) this._setOpen(openItem, false);
                });
            }
            this._setOpen(item, !wasOpen);

            if (typeof this.options.onChange === 'function') {
                this.options.onChange(Array.from(this.openItems), index, !wasOpen);
            }
            this._emit('change', Array.from(this.openItems), index, !wasOpen);
        }

        open(ref) {
            const item = this._itemEl(this._indexOf(ref));
            if (item && !item.classList.contains('open')) this.toggle(item);
        }

        close(ref) {
            const item = this._itemEl(this._indexOf(ref));
            if (item && item.classList.contains('open')) this.toggle(item);
        }

        openAll() {
            if (!this.options.multiple || this.destroyed) return;
            this.accordion.querySelectorAll('.chillaccordion-item').forEach(item => {
                const t = item.querySelector('.chillaccordion-trigger');
                if (!item.classList.contains('open') && !t.disabled) this._setOpen(item, true);
            });
        }

        closeAll() {
            if (this.destroyed) return;
            this.accordion.querySelectorAll('.chillaccordion-item.open').forEach(item => this._setOpen(item, false));
            this.openItems.clear();
        }

        on(evt, fn) {
            (this._handlers[evt] = this._handlers[evt] || []).push(fn);
            return this;
        }

        off(evt, fn) {
            if (!this._handlers[evt]) return this;
            this._handlers[evt] = fn ? this._handlers[evt].filter(f => f !== fn) : [];
            return this;
        }

        _emit(evt, ...args) {
            (this._handlers[evt] || []).slice().forEach(fn => fn(...args));
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this._timers.forEach(t => clearTimeout(t));
            this._timers.clear();
            this._listeners.forEach(([t, e, f]) => t.removeEventListener(e, f));
            this._listeners = [];
            this._handlers = {};
            if (this.accordion && this.accordion.parentNode) {
                if (this.element && !this.element.parentNode) this.accordion.parentNode.replaceChild(this.element, this.accordion);
                else this.accordion.parentNode.removeChild(this.accordion);
            }
        }
    }

    const ChillAccordion = {
        version: VERSION,

        init(selector, options) {
            return new ChillAccordionInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillAccordion;
    } else {
        window.ChillAccordion = ChillAccordion;
    }

})(typeof window !== 'undefined' ? window : this);
