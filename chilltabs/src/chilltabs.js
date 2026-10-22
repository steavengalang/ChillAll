/**
 * ChillTabs - Zero-dependency Tabs Navigation Component
 *
 * @example
 *   const tabs = ChillTabs.init('#tabs', {
 *     tabs: [
 *       { id: 'overview', label: 'Overview', content: 'Plain text is safe by default' },
 *       { id: 'files', label: 'Files', badge: 3, content: document.querySelector('#files-template') },
 *       { id: 'rich', label: 'Rich', content: '<b>HTML</b>', html: true },
 *       { id: 'off', label: 'Disabled', disabled: true }
 *     ],
 *     defaultTab: 'overview', variant: 'pills', onChange: id => console.log(id)
 *   });
 *   tabs.setActiveTab('files'); tabs.addTab({ id: 'x', label: 'X' }); tabs.removeTab('x'); tabs.destroy();
 *
 * Accessibility: role=tablist / tab / tabpanel, aria-selected, aria-controls / aria-labelledby, roving tabindex (only the
 * active tab is in the tab order), Arrow keys (Left/Right, or Up/Down when vertical), Home / End, aria-orientation. By default
 * arrows also activate the tab ("automatic" activation); use activation: 'manual' to require Enter / Space.
 * Mobile: the tab list scrolls horizontally (the active tab is scrolled into view) and vertical tabs stack above the panel
 * below 640px.
 *
 * Options:
 *   tabs        array    []          { id, label, icon, badge, content, html, disabled }
 *   defaultTab  string   first tab   initially active id
 *   variant     'default' | 'pills' | 'boxed'      'default'
 *   size        'sm' | 'md' | 'lg'                  'md'
 *   vertical    boolean  false
 *   centered    boolean  false
 *   fullWidth   boolean  false
 *   activation  'auto' | 'manual'  'auto'
 *   ariaLabel   string   ''         accessible name of the tablist
 *   html        boolean  false      OPT-IN (global) – string `content` / `icon` are inserted as HTML. Per tab: tab.html = true.
 *                                   Without it strings are text; Element / Node values are always accepted. label & badge are
 *                                   always text.
 *   onChange(id, instance)
 *
 * Instance: setActiveTab(id), getActiveTab(), setTabContent(id, content, {html}), setDisabled(id, bool), next(), prev(),
 *   addTab(tab, index?), removeTab(id), on('change', fn) -> off, container, destroy() (restores the original element)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilltabs_css_injected__';
    let uidCounter = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chilltabs-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilltabs-styles';
        style.textContent = `
      :root {
        --chilltabs-bg: #ffffff;
        --chilltabs-text: #6b7280;
        --chilltabs-text-active: #171717;
        --chilltabs-border: #e5e5e5;
        --chilltabs-indicator: #3b82f6;
        --chilltabs-hover: #f5f5f5;
        --chilltabs-panel-bg: #ffffff;
        --chilltabs-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilltabs-bg: #171717;
          --chilltabs-text: #a3a3a3;
          --chilltabs-text-active: #fafafa;
          --chilltabs-border: #262626;
          --chilltabs-hover: #262626;
          --chilltabs-panel-bg: #171717;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilltabs-bg: #171717;
        --chilltabs-text: #a3a3a3;
        --chilltabs-text-active: #fafafa;
        --chilltabs-border: #262626;
        --chilltabs-hover: #262626;
        --chilltabs-panel-bg: #171717;
      }

      .chilltabs { display: flex; flex-direction: column; min-width: 0; }

      .chilltabs-list {
        display: flex;
        gap: 0;
        border-bottom: 1px solid var(--chilltabs-border);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        -webkit-overflow-scrolling: touch;
      }
      .chilltabs-list::-webkit-scrollbar { display: none; }

      .chilltabs-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        padding: 12px 16px;
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        color: var(--chilltabs-text);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        white-space: nowrap;
        margin-bottom: -1px;
        flex-shrink: 0;
      }
      .chilltabs-trigger:hover:not(:disabled) { color: var(--chilltabs-text-active); background: var(--chilltabs-hover); }
      .chilltabs-trigger:focus { outline: none; }
      .chilltabs-trigger:focus-visible { box-shadow: inset 0 0 0 2px var(--chilltabs-ring); border-radius: 6px; }
      .chilltabs-trigger.active { color: var(--chilltabs-text-active); border-bottom-color: var(--chilltabs-indicator); }
      .chilltabs-trigger:disabled { opacity: 0.5; cursor: not-allowed; }

      .chilltabs-trigger-icon { display: inline-flex; width: 18px; height: 18px; flex-shrink: 0; }
      .chilltabs-trigger-icon svg { width: 100%; height: 100%; }
      .chilltabs-trigger-badge {
        padding: 2px 6px; font-size: 11px; font-weight: 600; line-height: 1.2;
        background: var(--chilltabs-indicator); color: #fff; border-radius: 10px;
      }

      .chilltabs-panels { padding: 16px 0; min-width: 0; }
      .chilltabs-panel { display: none; }
      .chilltabs-panel:focus { outline: none; }
      .chilltabs-panel:focus-visible { box-shadow: 0 0 0 2px var(--chilltabs-ring); border-radius: 6px; }
      .chilltabs-panel.active { display: block; animation: chilltabs-fadein 0.2s ease; }

      @keyframes chilltabs-fadein {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Variants */
      .chilltabs-pills .chilltabs-list { gap: 8px; border-bottom: none; padding: 4px; background: var(--chilltabs-hover); border-radius: 8px; }
      .chilltabs-pills .chilltabs-trigger { border-bottom: none; border-radius: 6px; margin-bottom: 0; }
      .chilltabs-pills .chilltabs-trigger.active { background: var(--chilltabs-bg); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }

      .chilltabs-boxed .chilltabs-list { gap: 0; border-bottom: none; }
      .chilltabs-boxed .chilltabs-trigger { border: 1px solid var(--chilltabs-border); border-right: none; margin-bottom: 0; border-radius: 0; }
      .chilltabs-boxed .chilltabs-trigger:first-child { border-radius: 8px 0 0 8px; }
      .chilltabs-boxed .chilltabs-trigger:last-child { border-right: 1px solid var(--chilltabs-border); border-radius: 0 8px 8px 0; }
      .chilltabs-boxed .chilltabs-trigger.active { background: var(--chilltabs-indicator); border-color: var(--chilltabs-indicator); color: #fff; }

      .chilltabs-vertical { flex-direction: row; }
      .chilltabs-vertical .chilltabs-list { flex-direction: column; border-bottom: none; border-right: 1px solid var(--chilltabs-border); min-width: 200px; overflow-x: visible; overflow-y: auto; }
      .chilltabs-vertical .chilltabs-trigger { border-bottom: none; border-right: 2px solid transparent; margin-bottom: 0; margin-right: -1px; }
      .chilltabs-vertical .chilltabs-trigger.active { border-right-color: var(--chilltabs-indicator); }
      .chilltabs-vertical .chilltabs-panels { flex: 1; padding: 0 16px; }

      /* Sizes */
      .chilltabs-sm .chilltabs-trigger { padding: 8px 12px; font-size: 13px; min-height: 32px; }
      .chilltabs-lg .chilltabs-trigger { padding: 16px 24px; font-size: 16px; min-height: 48px; }

      .chilltabs-centered .chilltabs-list { justify-content: center; }
      .chilltabs-fullwidth .chilltabs-trigger { flex: 1; justify-content: center; }

      /* Mobile: vertical tabs become a scrollable row above the panel */
      @media (max-width: 640px) {
        .chilltabs-vertical { flex-direction: column; }
        .chilltabs-vertical .chilltabs-list { flex-direction: row; min-width: 0; border-right: none; border-bottom: 1px solid var(--chilltabs-border); overflow-x: auto; overflow-y: visible; }
        .chilltabs-vertical .chilltabs-trigger { border-right: none; margin-right: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .chilltabs-vertical .chilltabs-trigger.active { border-right-color: transparent; border-bottom-color: var(--chilltabs-indicator); }
        .chilltabs-vertical .chilltabs-panels { padding: 16px 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .chilltabs-trigger { transition: none; }
        .chilltabs-panel.active { animation: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function safe(id) { return String(id).replace(/[^\w-]/g, '_'); }

    function setContent(el, value, html) {
        while (el.firstChild) el.removeChild(el.firstChild);
        if (value === null || value === undefined || value === false) return;
        if (value && value.nodeType) { el.appendChild(value); return; }
        if (html) el.innerHTML = String(value); else el.textContent = String(value);
    }

    class ChillTabsInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;
            this.options = Object.assign({
                tabs: [], defaultTab: null, variant: 'default', size: 'md', vertical: false, centered: false,
                fullWidth: false, activation: 'auto', ariaLabel: '', html: false, onChange: null
            }, options);
            this.options.tabs = (options.tabs || []).slice();
            this.uid = 'chilltabs-' + (++uidCounter);
            this.items = new Map();   // id -> { tab, trigger, panel }
            this._handlers = [];
            this._destroyed = false;
            this.activeTab = null;
            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        render() {
            const o = this.options;
            const container = document.createElement('div');
            container.className = 'chilltabs chilltabs-' + o.size;
            if (o.variant !== 'default') container.classList.add('chilltabs-' + o.variant);
            if (o.vertical) container.classList.add('chilltabs-vertical');
            if (o.centered) container.classList.add('chilltabs-centered');
            if (o.fullWidth) container.classList.add('chilltabs-fullwidth');

            this.list = document.createElement('div');
            this.list.className = 'chilltabs-list';
            this.list.setAttribute('role', 'tablist');
            this.list.setAttribute('aria-orientation', o.vertical ? 'vertical' : 'horizontal');
            if (o.ariaLabel) this.list.setAttribute('aria-label', o.ariaLabel);
            this.panels = document.createElement('div');
            this.panels.className = 'chilltabs-panels';
            container.appendChild(this.list);
            container.appendChild(this.panels);

            o.tabs.forEach(function (tab) { this._createItem(tab); }, this);

            const first = o.tabs.filter(function (t) { return !t.disabled; })[0];
            const wanted = o.defaultTab !== null && this.items.has(o.defaultTab) && !this.items.get(o.defaultTab).tab.disabled ? o.defaultTab : (first ? first.id : null);
            this.activeTab = wanted;
            this._sync();

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(container, this.element);
                this._replaced = true;
            }
            this.container = container;
        }

        _createItem(tab, index) {
            const o = this.options, key = String(tab.id);
            const sid = this.uid + '-' + safe(tab.id);
            const html = o.html === true || tab.html === true;

            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'chilltabs-trigger';
            trigger.id = sid + '-tab';
            trigger.setAttribute('role', 'tab');
            trigger.setAttribute('data-tab', key);
            trigger.setAttribute('aria-selected', 'false');
            trigger.setAttribute('aria-controls', sid + '-panel');
            trigger.setAttribute('tabindex', '-1');
            if (tab.disabled) trigger.disabled = true;
            if (tab.icon) {
                const ic = document.createElement('span');
                ic.className = 'chilltabs-trigger-icon';
                ic.setAttribute('aria-hidden', 'true');
                setContent(ic, tab.icon && tab.icon.nodeType ? tab.icon.cloneNode(true) : tab.icon, html);
                trigger.appendChild(ic);
            }
            const label = document.createElement('span');
            label.textContent = tab.label == null ? '' : String(tab.label);
            trigger.appendChild(label);
            if (tab.badge !== undefined && tab.badge !== null && tab.badge !== '' && tab.badge !== false) {
                const b = document.createElement('span');
                b.className = 'chilltabs-trigger-badge';
                b.textContent = String(tab.badge);
                trigger.appendChild(b);
            }

            const panel = document.createElement('div');
            panel.className = 'chilltabs-panel';
            panel.id = sid + '-panel';
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', trigger.id);
            panel.setAttribute('tabindex', '0');
            panel.hidden = true;
            setContent(panel, tab.content, html);

            const triggers = this.list.children;
            if (index === undefined || index >= triggers.length) { this.list.appendChild(trigger); this.panels.appendChild(panel); }
            else { this.list.insertBefore(trigger, triggers[index]); this.panels.insertBefore(panel, this.panels.children[index]); }
            this.items.set(key, { tab: tab, trigger: trigger, panel: panel });
        }

        /** Push this.activeTab into aria / classes / roving tabindex. */
        _sync() {
            const active = this.activeTab === null ? null : String(this.activeTab);
            let anyTabbable = false;
            this.items.forEach(function (item, key) {
                const on = key === active;
                item.trigger.classList.toggle('active', on);
                item.trigger.setAttribute('aria-selected', on ? 'true' : 'false');
                item.trigger.setAttribute('tabindex', on ? '0' : '-1');
                if (on) anyTabbable = true;
                item.panel.classList.toggle('active', on);
                item.panel.hidden = !on;
            });
            if (!anyTabbable) {
                const first = Array.from(this.items.values()).filter(function (i) { return !i.trigger.disabled; })[0];
                if (first) first.trigger.setAttribute('tabindex', '0');
            }
        }

        _enabledTriggers() {
            return Array.from(this.list.querySelectorAll('.chilltabs-trigger')).filter(function (t) { return !t.disabled; });
        }

        bindEvents() {
            const self = this;
            this._onClick = function (e) {
                const trigger = e.target.closest ? e.target.closest('.chilltabs-trigger') : null;
                if (!trigger || !self.list.contains(trigger) || trigger.disabled) return;
                self.setActiveTab(trigger.getAttribute('data-tab'));
            };
            this.list.addEventListener('click', this._onClick);

            this._onKeydown = function (e) {
                const trigger = e.target.closest ? e.target.closest('.chilltabs-trigger') : null;
                if (!trigger) return;
                const triggers = self._enabledTriggers();
                if (!triggers.length) return;
                const current = triggers.indexOf(trigger);
                const vertical = self.options.vertical;
                const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft', nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
                let idx = current;
                if (e.key === nextKey) idx = (current + 1) % triggers.length;
                else if (e.key === prevKey) idx = (current - 1 + triggers.length) % triggers.length;
                else if (e.key === 'Home') idx = 0;
                else if (e.key === 'End') idx = triggers.length - 1;
                else return;
                e.preventDefault();
                const target = triggers[idx];
                // roving tabindex: the focused tab becomes the single tab stop
                triggers.forEach(function (t) { t.setAttribute('tabindex', t === target ? '0' : '-1'); });
                target.focus();
                if (self.options.activation !== 'manual') self.setActiveTab(target.getAttribute('data-tab'));
            };
            this.list.addEventListener('keydown', this._onKeydown);
        }

        setActiveTab(tabId) {
            const key = String(tabId);
            const item = this.items.get(key);
            if (!item || item.trigger.disabled) return this;
            if (this.activeTab !== null && String(this.activeTab) === key) return this;
            this.activeTab = item.tab.id;
            this._sync();
            if (item.trigger.scrollIntoView) { try { item.trigger.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* ignore */ } }
            if (this.options.onChange) { try { this.options.onChange(item.tab.id, this); } catch (e) { if (typeof console !== 'undefined') console.error('ChillTabs onChange error', e); } }
            this._handlers.slice().forEach(function (fn) { try { fn(item.tab.id, this); } catch (e) { /* ignore */ } }, this);
            return this;
        }

        getActiveTab() { return this.activeTab; }

        next() { return this._step(1); }
        prev() { return this._step(-1); }
        _step(d) {
            const triggers = this._enabledTriggers();
            if (!triggers.length) return this;
            const cur = triggers.findIndex(function (t) { return t.classList.contains('active'); });
            const t = triggers[(cur + d + triggers.length) % triggers.length];
            return this.setActiveTab(t.getAttribute('data-tab'));
        }

        setTabContent(tabId, content, opts) {
            const item = this.items.get(String(tabId));
            if (!item) return this;
            const html = (opts && opts.html !== undefined) ? opts.html === true : (this.options.html === true || item.tab.html === true);
            item.tab.content = content;
            setContent(item.panel, content, html);
            return this;
        }

        setDisabled(tabId, disabled) {
            const item = this.items.get(String(tabId));
            if (!item) return this;
            item.tab.disabled = !!disabled;
            item.trigger.disabled = !!disabled;
            if (disabled && String(this.activeTab) === String(tabId)) {
                const alt = this._enabledTriggers()[0];
                if (alt) this.setActiveTab(alt.getAttribute('data-tab'));
            } else this._sync();
            return this;
        }

        addTab(tab, index) {
            if (!tab || tab.id === undefined || this.items.has(String(tab.id))) return this;
            if (index === undefined || index >= this.options.tabs.length) this.options.tabs.push(tab); else this.options.tabs.splice(index, 0, tab);
            this._createItem(tab, index);
            if (this.activeTab === null && !tab.disabled) this.activeTab = tab.id;
            this._sync();
            return this;
        }

        removeTab(tabId) {
            const key = String(tabId), item = this.items.get(key);
            if (!item) return this;
            const wasActive = this.activeTab !== null && String(this.activeTab) === key;
            this.options.tabs = this.options.tabs.filter(function (t) { return String(t.id) !== key; });
            item.trigger.remove(); item.panel.remove();
            this.items.delete(key);
            if (wasActive) {
                const first = this.options.tabs.filter(function (t) { return !t.disabled; })[0];
                this.activeTab = null;
                if (first) this.setActiveTab(first.id); else this._sync();
            } else this._sync();
            return this;
        }

        on(type, fn) {
            if (type !== 'change') throw new Error('ChillTabs.on: unknown event "' + type + '"');
            this._handlers.push(fn);
            const self = this;
            return function off() { const i = self._handlers.indexOf(fn); if (i > -1) self._handlers.splice(i, 1); };
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this.list.removeEventListener('click', this._onClick);
            this.list.removeEventListener('keydown', this._onKeydown);
            if (this.container.parentNode) {
                if (this._replaced && this.element) this.container.parentNode.replaceChild(this.element, this.container);
                else this.container.parentNode.removeChild(this.container);
            }
            this._handlers.length = 0;
            this.items.clear();
        }
    }

    const ChillTabs = {
        version: VERSION,

        init(selector, options) {
            return new ChillTabsInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillTabs;
    } else {
        window.ChillTabs = ChillTabs;
    }

})(typeof window !== 'undefined' ? window : this);
