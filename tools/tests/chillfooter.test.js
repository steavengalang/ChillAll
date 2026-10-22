const test = require('node:test');
const assert = require('node:assert/strict');
const { load, loadSSR } = require('../env');

const OPTS = () => ({
    brand: { name: 'Acme', href: '/', description: 'Making things.' },
    social: [{ name: 'GitHub', href: 'https://github.com/acme', icon: 'GH' }],
    columns: [{ title: 'Product', links: [{ label: 'Pricing', href: '/pricing' }, { label: 'Blog', href: 'https://x.dev', external: true }] }, { title: 'Company', links: [{ label: 'About', href: '/about' }] }],
    legal: [{ label: 'Privacy', href: '/privacy' }],
    newsletter: { title: 'Stay in touch', description: 'Monthly.', buttonText: 'Join' },
    copyright: '(c) Acme'
});
function setup(extra) {
    const ctx = load('chillfooter');
    ctx.document.body.innerHTML = '<div id="f"></div>';
    ctx.footer = ctx.lib.init('#f', Object.assign(OPTS(), extra));
    return ctx;
}
const flush = () => new Promise(r => setTimeout(r, 10));
const submit = (c) => c.document.querySelector('.chillfooter-newsletter-form').dispatchEvent(new c.window.Event('submit', { bubbles: true, cancelable: true }));

test('SSR import safe', () => { assert.ok(loadSSR('chillfooter').init); });

test('renders footer landmark, brand, labelled column navs with headings, legal nav, copyright', () => {
    const c = setup();
    const f = c.document.querySelector('footer.chillfooter');
    assert.ok(f);
    assert.equal(f.querySelector('.chillfooter-brand-logo span').textContent, 'Acme');
    const navs = f.querySelectorAll('nav.chillfooter-links');
    assert.equal(navs.length, 2);
    navs.forEach(n => assert.equal(c.document.getElementById(n.getAttribute('aria-labelledby')).tagName, 'H3'));
    assert.equal(f.querySelector('.chillfooter-legal').getAttribute('aria-label'), 'Legal');
    assert.equal(f.querySelector('.chillfooter-copyright').textContent, '(c) Acme');
    const ext = f.querySelectorAll('.chillfooter-link')[1];
    assert.equal(ext.getAttribute('target'), '_blank'); assert.equal(ext.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(c.document.getElementById('f'), null);
    c.footer.destroy();
});

test('default copyright has the current year; headingLevel option', () => {
    const c = setup({ copyright: '', headingLevel: 2 });
    assert.ok(c.document.querySelector('.chillfooter-copyright').textContent.includes(String(new Date().getFullYear())));
    assert.equal(c.document.querySelector('.chillfooter-column-title').tagName, 'H2');
    c.footer.destroy();
});

test('XSS: all strings are text, hrefs neutralised; social icon strings are text by default', () => {
    const evil = '<img src=x onerror="window.__x=1">';
    const c = setup({
        brand: { name: evil, logo: 'javascript:alert(1)', href: 'javascript:alert(1)', description: evil },
        social: [{ name: evil, href: 'javascript:alert(1)', icon: evil }],
        columns: [{ title: evil, links: [{ label: evil, href: 'data:text/html,x' }] }],
        legal: [{ label: evil, href: ' java\tscript:alert(1)' }],
        newsletter: { title: evil, description: evil, placeholder: evil, buttonText: evil },
        copyright: evil
    });
    assert.equal(c.document.querySelector('.chillfooter img[src="x"]'), null);
    c.document.querySelectorAll('.chillfooter a').forEach(a => assert.ok(!/^(javascript|data):/i.test(a.getAttribute('href').replace(/\s/g, ''))));
    assert.equal(c.document.querySelector('.chillfooter-copyright').textContent, evil);
    assert.equal(c.document.querySelector('.chillfooter-social-link').textContent, evil);
    c.footer.destroy();
});

test('opt-ins: html:true for social icon strings, Element icons, copyrightHtml', () => {
    const ctx = load('chillfooter');
    ctx.document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    const icon = ctx.document.createElement('i'); icon.className = 'ic';
    const a = ctx.lib.init('#a', { brand: { name: 'x' }, social: [{ name: 'n', href: '/', icon }], copyrightHtml: '&copy; <b id="cb">Acme</b>' });
    assert.ok(ctx.document.querySelector('.chillfooter-social-link .ic'));
    assert.ok(ctx.document.querySelector('#cb'));
    a.destroy();
    const b = ctx.lib.init('#b', { html: true, brand: { name: 'x' }, social: [{ name: 'n', href: '/', icon: '<svg id="svgi"></svg>' }] });
    assert.ok(ctx.document.querySelector('#svgi'));
    b.destroy();
});

test('social links have aria-labels and open safely', () => {
    const c = setup();
    const s = c.document.querySelector('.chillfooter-social-link');
    assert.equal(s.getAttribute('aria-label'), 'GitHub');
    assert.equal(s.getAttribute('rel'), 'noopener noreferrer');
    c.footer.destroy();
});

test('newsletter: labelled email input, handler gets the value, default prevented, live region exists', () => {
    const got = [];
    const c = setup({ onNewsletterSubmit: v => got.push(v), newsletter: { buttonText: 'Join', successMessage: 'Thanks!' } });
    const input = c.document.querySelector('.chillfooter-newsletter-input');
    assert.equal(input.getAttribute('aria-label'), 'Email address');
    assert.equal(input.getAttribute('autocomplete'), 'email');
    assert.equal(c.document.querySelector('.chillfooter-newsletter-status').getAttribute('role'), 'status');
    input.value = 'a@b.co';
    const ev = new c.window.Event('submit', { bubbles: true, cancelable: true });
    c.document.querySelector('.chillfooter-newsletter-form').dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    assert.equal(got.join(), 'a@b.co');
    assert.equal(c.document.querySelector('.chillfooter-newsletter-status').textContent, 'Thanks!');
    c.footer.destroy();
});

test('newsletter without handler/action never reloads the page; with action it may submit natively', () => {
    const c = setup();
    const ev = new c.window.Event('submit', { bubbles: true, cancelable: true });
    c.document.querySelector('.chillfooter-newsletter-form').dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    c.footer.destroy();
    const d = setup({ newsletter: { action: '/subscribe' } });
    const e2 = new d.window.Event('submit', { bubbles: true, cancelable: true });
    d.document.querySelector('.chillfooter-newsletter-form').dispatchEvent(e2);
    assert.equal(e2.defaultPrevented, false);
    assert.equal(d.document.querySelector('.chillfooter-newsletter-form').getAttribute('action'), '/subscribe');
    d.footer.destroy();
});

test('newsletter promise: button disabled while pending, success resets form, failure shows error', async () => {
    let resolve, reject;
    const c = setup({ onNewsletterSubmit: () => new Promise((res, rej) => { resolve = res; reject = rej; }), newsletter: { buttonText: 'Join', errorMessage: 'Nope' } });
    const input = c.document.querySelector('.chillfooter-newsletter-input'), btn = c.document.querySelector('.chillfooter-newsletter-button');
    input.value = 'a@b.co';
    submit(c);
    assert.equal(btn.disabled, true);
    resolve(); await flush();
    assert.equal(btn.disabled, false);
    assert.equal(input.value, '');
    assert.ok(/subscribing/.test(c.document.querySelector('.chillfooter-newsletter-status').textContent));
    assert.ok(c.document.querySelector('.chillfooter-newsletter-status').classList.contains('success'));
    submit(c); reject(new Error('x')); await flush();
    assert.equal(c.document.querySelector('.chillfooter-newsletter-status').textContent, 'Nope');
    assert.ok(c.document.querySelector('.chillfooter-newsletter-status').classList.contains('error'));
    c.footer.destroy();
});

test('throwing handler is contained; destroyed footer ignores late promise results', async () => {
    const c = setup({ onNewsletterSubmit: () => { throw new Error('boom'); } });
    assert.doesNotThrow(() => submit(c));
    assert.ok(c.document.querySelector('.chillfooter-newsletter-status').classList.contains('error'));
    c.footer.destroy();
    let resolve;
    const d = setup({ onNewsletterSubmit: () => new Promise(r => { resolve = r; }) });
    const status = d.document.querySelector('.chillfooter-newsletter-status');
    submit(d);
    d.footer.destroy();
    resolve(); await flush();
    assert.equal(status.textContent, '');
});

test('variants, destroy restores the original element and listeners, safe twice, no newsletter ok', () => {
    const c = setup({ variant: 'minimal', newsletter: null });
    assert.ok(c.document.querySelector('.chillfooter-minimal'));
    assert.equal(c.document.querySelector('.chillfooter-newsletter'), null);
    c.footer.destroy(); c.footer.destroy();
    assert.ok(c.document.getElementById('f'));
    assert.equal(c.document.querySelector('footer'), null);
    const o = load('chillfooter').lib.init('#nope', {});
    assert.ok(o.footer);
    o.destroy();
});

test('CSS: dark overrides, focus-visible, reduced motion', () => {
    const c = setup();
    const css = c.document.getElementById('chillfooter-styles').textContent;
    assert.ok(css.includes(':root[data-theme="dark"]'));
    assert.ok(css.includes(':focus-visible'));
    assert.ok(css.includes('prefers-reduced-motion'));
    c.footer.destroy();
});
