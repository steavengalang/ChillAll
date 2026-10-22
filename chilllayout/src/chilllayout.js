/**
 * ChillLayout - Zero-dependency Layout Component
 *
 * @example
 *   const layout = ChillLayout.init('#app', {
 *     header: headerElement,                 // Node | text | HTML (with html: true)
 *     sidebar: sidebarElement, sidebarRight: asideElement,
 *     content: '<h1>Hello</h1>', html: true,  // string slots are TEXT unless html: true
 *     footer: footerElement, containerSize: 'lg', skipLink: true,
 *     sidebarToggle: '#menu-btn'              // wires a button that opens the sidebar drawer on small screens
 *   });
 *   layout.setContent(node); layout.openSidebar(); layout.closeSidebar(); layout.destroy();
 *
 *   // helpers (class-name builders, unchanged API)
 *   ChillLayout.createGrid(3, 6); ChillLayout.createContainer('md'); ChillLayout.createStack(4); ChillLayout.createCard();
 *
 * Structure: <div.chilllayout><a skip-link/><header/><div.body><aside/><main#id tabindex=-1/><aside/></div><footer/></div>
 * Landmarks get labels, an optional skip link jumps to <main>, and on mobile (<= 768px) the left sidebar is an off-canvas drawer
 * instead of simply disappearing (backdrop, Esc / backdrop click closes, focus moves into the drawer and is restored).
 *
 * Security: slots take Nodes or TEXT. Strings are only parsed as HTML with `html: true` (trusted markup only) – or per call with
 * setContent(str, { html: true }).
 *
 * Options: header, sidebar, sidebarRight, content, footer (Node | string), html false, containerSize 'sm'|'md'|'lg'|'xl'|'full' ('xl'),
 *   skipLink false, skipLinkText 'Skip to content', sidebarLabel 'Sidebar', sidebarRightLabel 'Secondary sidebar',
 *   sidebarToggle null (selector | Element)
 * Instance: layout (root), regions {header, sidebar, sidebarRight, main, content, footer}, setContent(c, {html}),
 *   setSidebar(c, side = 'left', {html}), setHeader(c, {html}), setFooter(c, {html}), openSidebar(), closeSidebar(),
 *   toggleSidebar(), isSidebarOpen, destroy() (restores the original element)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chilllayout_css_injected__';
    const SIZES = ['sm', 'md', 'lg', 'xl', 'full'];
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chilllayout-styles')) return;

        const style = document.createElement('style');
        style.id = 'chilllayout-styles';
        style.textContent = `
      :root {
        --chilllayout-bg: #ffffff;
        --chilllayout-text: #171717;
        --chilllayout-border: #e5e5e5;
        --chilllayout-sidebar-width: 260px;
        --chilllayout-header-height: 64px;
        --chilllayout-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chilllayout-bg: #0a0a0a;
          --chilllayout-text: #fafafa;
          --chilllayout-border: #262626;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chilllayout-bg: #0a0a0a;
        --chilllayout-text: #fafafa;
        --chilllayout-border: #262626;
      }

      .chilllayout { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; background: var(--chilllayout-bg); color: var(--chilllayout-text); }

      .chilllayout-skip {
        position: absolute; left: 8px; top: -100px; z-index: 10001; padding: 10px 16px; background: var(--chilllayout-bg); color: var(--chilllayout-text);
        border: 2px solid var(--chilllayout-border); border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;
      }
      .chilllayout-skip:focus { top: 8px; outline: none; box-shadow: 0 0 0 3px var(--chilllayout-ring); }

      .chilllayout-header { height: var(--chilllayout-header-height); flex-shrink: 0; border-bottom: 1px solid var(--chilllayout-border); background: var(--chilllayout-bg); position: sticky; top: 0; z-index: 100; }

      .chilllayout-body { display: flex; flex: 1; min-height: 0; }

      .chilllayout-sidebar {
        width: var(--chilllayout-sidebar-width); flex-shrink: 0; border-right: 1px solid var(--chilllayout-border); background: var(--chilllayout-bg);
        overflow-y: auto; position: sticky; top: var(--chilllayout-header-height); height: calc(100vh - var(--chilllayout-header-height));
        height: calc(100dvh - var(--chilllayout-header-height)); box-sizing: border-box;
      }
      .chilllayout-no-header .chilllayout-sidebar { top: 0; height: 100vh; height: 100dvh; }
      .chilllayout-sidebar-right { border-right: none; border-left: 1px solid var(--chilllayout-border); }

      .chilllayout-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
      .chilllayout-main:focus { outline: none; }
      .chilllayout-content { flex: 1; padding: 24px; }
      .chilllayout-footer { flex-shrink: 0; border-top: 1px solid var(--chilllayout-border); background: var(--chilllayout-bg); }

      .chilllayout-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s; z-index: 199; }

      /* Container */
      .chilllayout-container { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
      .chilllayout-container-sm { max-width: 640px; }
      .chilllayout-container-md { max-width: 768px; }
      .chilllayout-container-lg { max-width: 1024px; }
      .chilllayout-container-xl { max-width: 1280px; }
      .chilllayout-container-full { max-width: none; }

      /* Grid System */
      .chilllayout-grid { display: grid; gap: 24px; }
      .chilllayout-grid-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .chilllayout-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .chilllayout-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .chilllayout-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .chilllayout-grid-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .chilllayout-grid-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }

      /* Flex Utilities */
      .chilllayout-flex { display: flex; }
      .chilllayout-flex-row { flex-direction: row; }
      .chilllayout-flex-col { flex-direction: column; }
      .chilllayout-flex-wrap { flex-wrap: wrap; }

      .chilllayout-items-start { align-items: flex-start; }
      .chilllayout-items-center { align-items: center; }
      .chilllayout-items-end { align-items: flex-end; }
      .chilllayout-items-stretch { align-items: stretch; }

      .chilllayout-justify-start { justify-content: flex-start; }
      .chilllayout-justify-center { justify-content: center; }
      .chilllayout-justify-end { justify-content: flex-end; }
      .chilllayout-justify-between { justify-content: space-between; }
      .chilllayout-justify-around { justify-content: space-around; }

      .chilllayout-gap-0 { gap: 0; }
      .chilllayout-gap-1 { gap: 4px; }
      .chilllayout-gap-2 { gap: 8px; }
      .chilllayout-gap-3 { gap: 12px; }
      .chilllayout-gap-4 { gap: 16px; }
      .chilllayout-gap-5 { gap: 20px; }
      .chilllayout-gap-6 { gap: 24px; }
      .chilllayout-gap-8 { gap: 32px; }
      .chilllayout-gap-10 { gap: 40px; }
      .chilllayout-gap-12 { gap: 48px; }

      /* Stack (Vertical Spacing) */
      .chilllayout-stack > * + * { margin-top: var(--stack-gap, 16px); }
      .chilllayout-stack-1 { --stack-gap: 4px; }
      .chilllayout-stack-2 { --stack-gap: 8px; }
      .chilllayout-stack-3 { --stack-gap: 12px; }
      .chilllayout-stack-4 { --stack-gap: 16px; }
      .chilllayout-stack-6 { --stack-gap: 24px; }
      .chilllayout-stack-8 { --stack-gap: 32px; }

      /* Section */
      .chilllayout-section { padding: 48px 0; }
      .chilllayout-section-sm { padding: 24px 0; }
      .chilllayout-section-lg { padding: 80px 0; }
      .chilllayout-section-xl { padding: 120px 0; }

      /* Card Layout */
      .chilllayout-card { background: var(--chilllayout-bg); border: 1px solid var(--chilllayout-border); border-radius: 12px; overflow: hidden; }
      .chilllayout-card-header { padding: 16px 20px; border-bottom: 1px solid var(--chilllayout-border); }
      .chilllayout-card-body { padding: 20px; }
      .chilllayout-card-footer { padding: 16px 20px; border-top: 1px solid var(--chilllayout-border); }

      /* Responsive */
      @media (max-width: 768px) {
        /* left sidebar becomes an off-canvas drawer (opened with openSidebar / the sidebarToggle button) */
        .chilllayout-sidebar:not(.chilllayout-sidebar-right) {
          position: fixed; top: 0; left: 0; bottom: 0; height: auto; z-index: 200; max-width: 85vw; transform: translateX(-100%); visibility: hidden;
          transition: transform 0.25s ease, visibility 0s linear 0.25s;
        }
        .chilllayout-sidebar-open .chilllayout-sidebar:not(.chilllayout-sidebar-right) { transform: translateX(0); visibility: visible; transition: transform 0.25s ease, visibility 0s; }
        .chilllayout-sidebar-open .chilllayout-backdrop { opacity: 1; visibility: visible; }
        .chilllayout-sidebar-right { display: none; }

        .chilllayout-grid-2, .chilllayout-grid-3, .chilllayout-grid-4, .chilllayout-grid-5, .chilllayout-grid-6 { grid-template-columns: minmax(0, 1fr); }
        .chilllayout-content { padding: 16px; }
        .chilllayout-container { padding: 0 16px; }
      }

      @media (min-width: 768px) and (max-width: 1024px) {
        .chilllayout-grid-4, .chilllayout-grid-5, .chilllayout-grid-6 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }

      /* Divider */
      .chilllayout-divider { height: 1px; background: var(--chilllayout-border); margin: 24px 0; }
      .chilllayout-divider-vertical { width: 1px; height: auto; margin: 0 24px; }

      /* Spacer */
      .chilllayout-spacer { flex: 1; }

      @media (prefers-reduced-motion: reduce) {
        .chilllayout-sidebar, .chilllayout-backdrop { transition: none !important; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function setSlot(node, content, html) {
        while (node.firstChild) node.removeChild(node.firstChild);
        if (content === null || content === undefined || content === false) return;
        if (content.nodeType) { node.appendChild(content); return; }
        if (html) node.innerHTML = String(content); else node.textContent = String(content);
    }

    function int(v, dflt, min, max) {
        const n = parseInt(v, 10);
        return isNaN(n) ? dflt : Math.min(max, Math.max(min, n));
    }

    class ChillLayoutInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = Object.assign({
                header: null, sidebar: null, sidebarRight: null, content: null, footer: null, containerSize: 'xl', html: false,
                skipLink: false, skipLinkText: 'Skip to content', sidebarLabel: 'Sidebar', sidebarRightLabel: 'Secondary sidebar', sidebarToggle: null
            }, options);
            if (SIZES.indexOf(this.options.containerSize) === -1) this.options.containerSize = 'xl';

            this.id = 'chilllayout-' + (++uid);
            this.isSidebarOpen = false;
            this._listeners = [];
            this._prevFocus = null;
            this._destroyed = false;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        render() {
            const o = this.options, html = o.html === true;
            const layout = document.createElement('div');
            layout.className = 'chilllayout';
            if (!o.header) layout.classList.add('chilllayout-no-header');

            const mainId = this.id + '-main';
            if (o.skipLink) {
                const skip = document.createElement('a');
                skip.className = 'chilllayout-skip';
                skip.setAttribute('href', '#' + mainId);
                skip.textContent = o.skipLinkText;
                layout.appendChild(skip);
                this._skip = skip;
            }

            const regions = {};
            if (o.header) {
                const h = document.createElement('header');
                h.className = 'chilllayout-header';
                setSlot(h, o.header, html);
                layout.appendChild(h);
                regions.header = h;
            }

            const body = document.createElement('div');
            body.className = 'chilllayout-body';

            if (o.sidebar) {
                const a = document.createElement('aside');
                a.className = 'chilllayout-sidebar';
                a.id = this.id + '-sidebar';
                a.setAttribute('aria-label', o.sidebarLabel);
                setSlot(a, o.sidebar, html);
                body.appendChild(a);
                regions.sidebar = a;
            }

            const main = document.createElement('main');
            main.className = 'chilllayout-main';
            main.id = mainId;
            main.setAttribute('tabindex', '-1');
            const content = document.createElement('div');
            content.className = 'chilllayout-content';
            const container = document.createElement('div');
            container.className = 'chilllayout-container chilllayout-container-' + o.containerSize;
            setSlot(container, o.content, html);
            content.appendChild(container);
            main.appendChild(content);
            body.appendChild(main);
            regions.main = main; regions.content = container;

            if (o.sidebarRight) {
                const a = document.createElement('aside');
                a.className = 'chilllayout-sidebar chilllayout-sidebar-right';
                a.setAttribute('aria-label', o.sidebarRightLabel);
                setSlot(a, o.sidebarRight, html);
                body.appendChild(a);
                regions.sidebarRight = a;
            }
            layout.appendChild(body);

            if (o.footer) {
                const f = document.createElement('footer');
                f.className = 'chilllayout-footer';
                setSlot(f, o.footer, html);
                layout.appendChild(f);
                regions.footer = f;
            }

            const backdrop = document.createElement('div');
            backdrop.className = 'chilllayout-backdrop';
            layout.appendChild(backdrop);
            this.backdrop = backdrop;

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(layout, this.element);
                this._replaced = true;
            }

            this.layout = layout;
            this.regions = regions;
        }

        _on(target, type, fn) {
            target.addEventListener(type, fn);
            this._listeners.push([target, type, fn]);
        }

        bindEvents() {
            const self = this;
            this._on(this.backdrop, 'click', function () { self.closeSidebar(); });
            this._on(this.layout, 'keydown', function (e) {
                if (e.key === 'Escape' && self.isSidebarOpen) { e.preventDefault(); self.closeSidebar(); }
            });
            this._on(window, 'resize', function () {
                if (window.innerWidth > 768 && self.isSidebarOpen) self.closeSidebar();
            });
            if (this._skip) {
                this._on(this._skip, 'click', function () {
                    // make sure keyboard focus really moves to <main> (anchor navigation does not always do it)
                    try { self.regions.main.focus(); } catch (e) { /* ignore */ }
                });
            }
            const t = this.options.sidebarToggle;
            const btn = typeof t === 'string' ? document.querySelector(t) : t;
            if (btn && btn.addEventListener && this.regions.sidebar) {
                btn.setAttribute('aria-controls', this.regions.sidebar.id);
                btn.setAttribute('aria-expanded', 'false');
                this._toggleBtn = btn;
                this._on(btn, 'click', function () { self.toggleSidebar(); });
            }
        }

        setContent(content, opts) {
            const html = opts && opts.html !== undefined ? opts.html === true : this.options.html === true;
            setSlot(this.regions.content, content, html);
            return this;
        }

        setSidebar(content, side, opts) {
            const node = side === 'right' ? this.regions.sidebarRight : this.regions.sidebar;
            if (!node) return this;
            // support the old signature setSidebar(content, 'right')
            const html = opts && opts.html !== undefined ? opts.html === true : this.options.html === true;
            setSlot(node, content, html);
            return this;
        }

        setHeader(content, opts) {
            if (!this.regions.header) return this;
            setSlot(this.regions.header, content, opts && opts.html !== undefined ? opts.html === true : this.options.html === true);
            return this;
        }

        setFooter(content, opts) {
            if (!this.regions.footer) return this;
            setSlot(this.regions.footer, content, opts && opts.html !== undefined ? opts.html === true : this.options.html === true);
            return this;
        }

        openSidebar() {
            if (this.isSidebarOpen || !this.regions.sidebar) return this;
            this.isSidebarOpen = true;
            this._prevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
            this.layout.classList.add('chilllayout-sidebar-open');
            if (this._toggleBtn) this._toggleBtn.setAttribute('aria-expanded', 'true');
            const focusable = this.regions.sidebar.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const target = focusable || this.regions.sidebar;
            if (target === this.regions.sidebar && !target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); this._tmpTab = true; }
            try { target.focus(); } catch (e) { /* ignore */ }
            return this;
        }

        closeSidebar() {
            if (!this.isSidebarOpen) return this;
            this.isSidebarOpen = false;
            this.layout.classList.remove('chilllayout-sidebar-open');
            if (this._toggleBtn) this._toggleBtn.setAttribute('aria-expanded', 'false');
            if (this._tmpTab && this.regions.sidebar) { this.regions.sidebar.removeAttribute('tabindex'); this._tmpTab = false; }
            const prev = this._prevFocus; this._prevFocus = null;
            if (prev && prev.focus && document.contains(prev)) { try { prev.focus(); } catch (e) { /* ignore */ } }
            return this;
        }

        toggleSidebar() { return this.isSidebarOpen ? this.closeSidebar() : this.openSidebar(); }

        destroy() {
            if (this._destroyed) return;
            if (this.isSidebarOpen) this.closeSidebar();
            this._destroyed = true;
            this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2]); });
            this._listeners = [];
            if (this._toggleBtn) { this._toggleBtn.removeAttribute('aria-controls'); this._toggleBtn.removeAttribute('aria-expanded'); }
            if (this.layout.parentNode) {
                if (this._replaced && this.element) this.layout.parentNode.replaceChild(this.element, this.layout);
                else this.layout.parentNode.removeChild(this.layout);
            }
        }
    }

    // Utility functions (class-name builders; values are sanitised so options can never inject classes)
    function createGrid(columns, gap) {
        injectCSS();
        const grid = document.createElement('div');
        grid.className = 'chilllayout-grid chilllayout-grid-' + int(columns, 1, 1, 6) + ' chilllayout-gap-' + int(gap, 6, 0, 12);
        return grid;
    }

    function createContainer(size) {
        injectCSS();
        const container = document.createElement('div');
        container.className = 'chilllayout-container chilllayout-container-' + (SIZES.indexOf(size) > -1 ? size : 'xl');
        return container;
    }

    function createStack(gap) {
        injectCSS();
        const stack = document.createElement('div');
        stack.className = 'chilllayout-stack chilllayout-stack-' + int(gap, 4, 1, 8);
        return stack;
    }

    function createCard() {
        injectCSS();
        const card = document.createElement('div');
        card.className = 'chilllayout-card';
        return card;
    }

    const ChillLayout = {
        version: VERSION,

        init(selector, options) {
            return new ChillLayoutInstance(selector, options);
        },

        createGrid: createGrid,
        createContainer: createContainer,
        createStack: createStack,
        createCard: createCard,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillLayout;
    } else {
        window.ChillLayout = ChillLayout;
    }

})(typeof window !== 'undefined' ? window : this);
