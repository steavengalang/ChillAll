/**
 * ChillFooter - Zero-dependency Footer Component
 *
 * @example
 *   const footer = ChillFooter.init('#footer', {
 *     brand: { name: 'Acme', logo: '/logo.svg', href: '/', description: 'Making things.' },
 *     social: [{ name: 'GitHub', href: 'https://github.com/acme', icon: iconSvgElement }],
 *     columns: [{ title: 'Product', links: [{ label: 'Pricing', href: '/pricing' }, { label: 'Blog', href: 'https://x.dev', external: true }] }],
 *     newsletter: { title: 'Stay in touch', description: 'Monthly news.', buttonText: 'Join' },
 *     onNewsletterSubmit: email => api.subscribe(email),          // may return a Promise -> status message shown
 *     legal: [{ label: 'Privacy', href: '/privacy' }], copyright: '© 2025 Acme', variant: 'default'
 *   });
 *   footer.destroy();
 *
 * Accessibility: <footer> landmark, each link column is a <nav> labelled by its heading, social links have aria-labels,
 * newsletter input has an accessible name and results are announced through a polite live region, focus-visible rings.
 *
 * Security: every string (brand, titles, labels, copyright, descriptions, placeholders) is text; hrefs are neutralised when they
 * use javascript:/data:/vbscript:. Social `icon` strings are text unless options.html === true (trusted markup only);
 * Element icons are always accepted. Use `copyrightHtml` for explicit (trusted) HTML in the copyright line.
 *
 * Options: brand {name, logo, href, description}, columns [{title, links:[{label, href, external}]}], social [{name, href, icon}],
 *   copyright '' (default "© <year> All rights reserved."), copyrightHtml null, legal [{label, href}],
 *   newsletter {title, description, placeholder, buttonText, label, successMessage, errorMessage, action, method} | null,
 *   variant 'default' | 'minimal' | 'centered', headingLevel 3 (2-6), ariaLabel '', html false,
 *   onNewsletterSubmit(email, event) -> void | Promise
 * Instance: footer, destroy() (restores the original element and removes listeners)
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillfooter_css_injected__';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || window[CSS_INJECTED_FLAG] || document.getElementById('chillfooter-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillfooter-styles';
        style.textContent = `
      :root {
        --chillfooter-bg: #f9fafb;
        --chillfooter-text: #171717;
        --chillfooter-text-muted: #6b7280;
        --chillfooter-border: #e5e5e5;
        --chillfooter-link-hover: #3b82f6;
        --chillfooter-ring: rgba(59, 130, 246, 0.45);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillfooter-bg: #0a0a0a;
          --chillfooter-text: #fafafa;
          --chillfooter-text-muted: #a3a3a3;
          --chillfooter-border: #262626;
          --chillfooter-link-hover: #60a5fa;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillfooter-bg: #0a0a0a;
        --chillfooter-text: #fafafa;
        --chillfooter-text-muted: #a3a3a3;
        --chillfooter-border: #262626;
        --chillfooter-link-hover: #60a5fa;
      }

      .chillfooter { background: var(--chillfooter-bg); color: var(--chillfooter-text); border-top: 1px solid var(--chillfooter-border); padding: 48px 24px; box-sizing: border-box; }
      .chillfooter-container { max-width: 1280px; margin: 0 auto; }
      .chillfooter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px; }

      .chillfooter a:focus, .chillfooter button:focus { outline: none; }
      .chillfooter a:focus-visible, .chillfooter button:focus-visible { box-shadow: 0 0 0 3px var(--chillfooter-ring); border-radius: 6px; }

      .chillfooter-brand { display: flex; flex-direction: column; gap: 16px; }
      .chillfooter-brand-logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; color: var(--chillfooter-text); text-decoration: none; }
      .chillfooter-brand-logo img { height: 32px; width: auto; }
      .chillfooter-brand-description { font-size: 14px; color: var(--chillfooter-text-muted); line-height: 1.6; max-width: 300px; margin: 0; }

      .chillfooter-social { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
      .chillfooter-social-link {
        display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
        color: var(--chillfooter-text-muted); background: var(--chillfooter-border); border-radius: 8px; text-decoration: none; transition: background 0.15s ease, color 0.15s ease;
      }
      .chillfooter-social-link:hover { background: var(--chillfooter-link-hover); color: #fff; }
      .chillfooter-social-link svg { width: 18px; height: 18px; }

      .chillfooter-column { display: flex; flex-direction: column; gap: 16px; }
      .chillfooter-column-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--chillfooter-text); text-transform: uppercase; letter-spacing: 0.05em; }
      .chillfooter-links { display: flex; flex-direction: column; gap: 4px; }
      .chillfooter-link { display: inline-block; padding: 6px 0; font-size: 14px; color: var(--chillfooter-text-muted); text-decoration: none; transition: color 0.15s ease; }
      .chillfooter-link:hover { color: var(--chillfooter-link-hover); }

      .chillfooter-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--chillfooter-border); flex-wrap: wrap; gap: 16px; }
      .chillfooter-copyright { margin: 0; font-size: 14px; color: var(--chillfooter-text-muted); }
      .chillfooter-legal { display: flex; flex-wrap: wrap; gap: 8px 24px; }
      .chillfooter-legal-link { font-size: 14px; color: var(--chillfooter-text-muted); text-decoration: none; transition: color 0.15s ease; }
      .chillfooter-legal-link:hover { color: var(--chillfooter-link-hover); }

      /* Newsletter */
      .chillfooter-newsletter { display: flex; flex-direction: column; gap: 12px; }
      .chillfooter-newsletter-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--chillfooter-text); }
      .chillfooter-newsletter-description { margin: 0; font-size: 14px; color: var(--chillfooter-text-muted); }
      .chillfooter-newsletter-form { display: flex; gap: 8px; }
      .chillfooter-newsletter-input {
        flex: 1; min-width: 0; min-height: 40px; padding: 10px 14px; box-sizing: border-box; font: inherit; font-size: 14px;
        background: var(--chillfooter-bg); border: 1px solid var(--chillfooter-border); border-radius: 8px; color: var(--chillfooter-text); outline: none;
      }
      .chillfooter-newsletter-input:focus { border-color: var(--chillfooter-link-hover); }
      .chillfooter-newsletter-input:focus-visible { box-shadow: 0 0 0 3px var(--chillfooter-ring); }
      .chillfooter-newsletter-button {
        min-height: 40px; padding: 10px 20px; font: inherit; font-size: 14px; font-weight: 500; background: #2563eb; color: #fff; border: none; border-radius: 8px;
        cursor: pointer; transition: opacity 0.15s ease;
      }
      .chillfooter-newsletter-button:hover { opacity: 0.9; }
      .chillfooter-newsletter-button:disabled { opacity: 0.6; cursor: wait; }
      .chillfooter-newsletter-status { margin: 0; min-height: 1.2em; font-size: 13px; color: var(--chillfooter-text-muted); }
      .chillfooter-newsletter-status.error { color: #ef4444; }
      .chillfooter-newsletter-status.success { color: #16a34a; }

      /* Variants */
      .chillfooter-minimal { padding: 24px; }
      .chillfooter-minimal .chillfooter-grid { display: none; }
      .chillfooter-minimal .chillfooter-bottom { border-top: none; padding-top: 0; }
      .chillfooter-centered .chillfooter-bottom { flex-direction: column; text-align: center; }

      @media (max-width: 768px) {
        .chillfooter { padding: 32px 16px; }
        .chillfooter-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
        .chillfooter-brand, .chillfooter-newsletter { grid-column: 1 / -1; }
        .chillfooter-bottom { flex-direction: column; text-align: center; }
        .chillfooter-newsletter-form { flex-direction: column; }
        .chillfooter-legal { justify-content: center; }
      }

      @media (prefers-reduced-motion: reduce) {
        .chillfooter-social-link, .chillfooter-link, .chillfooter-legal-link, .chillfooter-newsletter-button { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function safeUrl(url, dflt) {
        const u = String(url == null ? '' : url).trim();
        if (!u) return dflt;
        const probe = u.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
        return /^(javascript|data|vbscript):/.test(probe) ? '#' : u;
    }

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined && text !== null) e.textContent = text;
        return e;
    }

    class ChillFooterInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string' ? document.querySelector(selector) : selector;

            this.options = Object.assign({
                brand: null, columns: [], social: [], copyright: '', copyrightHtml: null, legal: [], newsletter: null,
                variant: 'default', headingLevel: 3, ariaLabel: '', html: false, onNewsletterSubmit: null
            }, options);
            this.options.columns = this.options.columns || [];
            this.options.social = this.options.social || [];
            this.options.legal = this.options.legal || [];
            this.id = 'chillfooter-' + (++uid);
            this._listeners = [];
            this._destroyed = false;

            this.init();
        }

        init() {
            injectCSS();
            this.render();
            this.bindEvents();
        }

        _heading(className, text) {
            const lvl = Math.min(6, Math.max(2, parseInt(this.options.headingLevel, 10) || 3));
            return el('h' + lvl, className, text);
        }

        render() {
            const o = this.options;
            const footer = document.createElement('footer');
            footer.className = 'chillfooter chillfooter-' + o.variant;
            if (o.ariaLabel) footer.setAttribute('aria-label', o.ariaLabel);

            const container = el('div', 'chillfooter-container');
            const grid = el('div', 'chillfooter-grid');

            // Brand
            if (o.brand) {
                const brand = el('div', 'chillfooter-brand');
                const a = el('a', 'chillfooter-brand-logo');
                a.setAttribute('href', safeUrl(o.brand.href, '/'));
                if (o.brand.logo) {
                    const img = el('img');
                    img.setAttribute('src', safeUrl(o.brand.logo, ''));
                    img.setAttribute('alt', o.brand.name ? '' : 'Home');
                    a.appendChild(img);
                }
                if (o.brand.name) a.appendChild(el('span', '', String(o.brand.name)));
                brand.appendChild(a);
                if (o.brand.description) brand.appendChild(el('p', 'chillfooter-brand-description', String(o.brand.description)));

                if (o.social.length > 0) {
                    const social = el('div', 'chillfooter-social');
                    o.social.forEach(function (s) {
                        const link = el('a', 'chillfooter-social-link');
                        link.setAttribute('href', safeUrl(s.href, '#'));
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                        link.setAttribute('aria-label', String(s.name == null ? '' : s.name));
                        if (s.icon && s.icon.nodeType) link.appendChild(s.icon.cloneNode(true));
                        else if (s.icon) {
                            if (o.html === true) link.innerHTML = String(s.icon); else link.textContent = String(s.icon);
                        }
                        social.appendChild(link);
                    });
                    brand.appendChild(social);
                }
                grid.appendChild(brand);
            }

            // Columns
            o.columns.forEach(function (column, i) {
                const col = el('div', 'chillfooter-column');
                const hid = this.id + '-col-' + i;
                const h = this._heading('chillfooter-column-title', String(column.title == null ? '' : column.title));
                h.id = hid;
                col.appendChild(h);
                const nav = el('nav', 'chillfooter-links');
                nav.setAttribute('aria-labelledby', hid);
                (column.links || []).forEach(function (link) {
                    const a = el('a', 'chillfooter-link', String(link.label == null ? '' : link.label));
                    a.setAttribute('href', safeUrl(link.href, '#'));
                    if (link.external) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
                    nav.appendChild(a);
                });
                col.appendChild(nav);
                grid.appendChild(col);
            }, this);

            // Newsletter
            if (o.newsletter) {
                const n = o.newsletter;
                const box = el('div', 'chillfooter-newsletter');
                const title = this._heading('chillfooter-newsletter-title', String(n.title || 'Subscribe'));
                box.appendChild(title);
                if (n.description) box.appendChild(el('p', 'chillfooter-newsletter-description', String(n.description)));
                const form = el('form', 'chillfooter-newsletter-form');
                if (n.action) { form.setAttribute('action', safeUrl(n.action, '')); form.setAttribute('method', n.method || 'post'); }
                const input = el('input', 'chillfooter-newsletter-input');
                input.type = 'email'; input.name = 'email'; input.required = true;
                input.setAttribute('autocomplete', 'email');
                input.setAttribute('placeholder', n.placeholder || 'Enter your email');
                input.setAttribute('aria-label', n.label || n.placeholder || 'Email address');
                const btn = el('button', 'chillfooter-newsletter-button', String(n.buttonText || 'Subscribe'));
                btn.type = 'submit';
                form.appendChild(input); form.appendChild(btn);
                box.appendChild(form);
                const status = el('p', 'chillfooter-newsletter-status');
                status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
                box.appendChild(status);
                grid.appendChild(box);
            }
            container.appendChild(grid);

            // Bottom
            const bottom = el('div', 'chillfooter-bottom');
            const copy = el('p', 'chillfooter-copyright');
            if (o.copyrightHtml) copy.innerHTML = String(o.copyrightHtml);            // explicit HTML (trusted)
            else copy.textContent = o.copyright ? String(o.copyright) : '© ' + new Date().getFullYear() + ' All rights reserved.';
            bottom.appendChild(copy);
            if (o.legal.length > 0) {
                const legal = el('nav', 'chillfooter-legal');
                legal.setAttribute('aria-label', 'Legal');
                o.legal.forEach(function (link) {
                    const a = el('a', 'chillfooter-legal-link', String(link.label == null ? '' : link.label));
                    a.setAttribute('href', safeUrl(link.href, '#'));
                    legal.appendChild(a);
                });
                bottom.appendChild(legal);
            }
            container.appendChild(bottom);
            footer.appendChild(container);

            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(footer, this.element);
                this._replaced = true;
            }
            this.footer = footer;
        }

        bindEvents() {
            const form = this.footer.querySelector('.chillfooter-newsletter-form');
            if (!form) return;
            const self = this, o = this.options, n = o.newsletter;
            const input = form.querySelector('.chillfooter-newsletter-input');
            const btn = form.querySelector('.chillfooter-newsletter-button');
            const status = this.footer.querySelector('.chillfooter-newsletter-status');
            const setStatus = function (text, kind) { status.textContent = text || ''; status.className = 'chillfooter-newsletter-status' + (kind ? ' ' + kind : ''); };
            const onSubmit = function (e) {
                // without a handler and without an explicit form action, never fall back to a page reload
                if (!o.onNewsletterSubmit) { if (!n.action) e.preventDefault(); return; }
                e.preventDefault();
                let result;
                try { result = o.onNewsletterSubmit(input.value, e); }
                catch (err) { setStatus(n.errorMessage || 'Something went wrong. Please try again.', 'error'); return; }
                if (result && typeof result.then === 'function') {
                    btn.disabled = true;
                    result.then(function () {
                        if (self._destroyed) return;
                        btn.disabled = false; form.reset();
                        setStatus(n.successMessage || 'Thanks for subscribing!', 'success');
                    }, function () {
                        if (self._destroyed) return;
                        btn.disabled = false;
                        setStatus(n.errorMessage || 'Something went wrong. Please try again.', 'error');
                    });
                } else if (n.successMessage) setStatus(n.successMessage, 'success');
            };
            form.addEventListener('submit', onSubmit);
            this._listeners.push([form, 'submit', onSubmit]);
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2]); });
            this._listeners = [];
            if (this.footer.parentNode) {
                if (this._replaced && this.element) this.footer.parentNode.replaceChild(this.element, this.footer);
                else this.footer.parentNode.removeChild(this.footer);
            }
        }
    }

    const ChillFooter = {
        version: VERSION,

        init(selector, options) {
            return new ChillFooterInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillFooter;
    } else {
        window.ChillFooter = ChillFooter;
    }

})(typeof window !== 'undefined' ? window : this);
