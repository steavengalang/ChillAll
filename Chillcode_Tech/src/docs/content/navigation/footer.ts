import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'footer',
    global: 'ChillFooter',
    category: 'navigation',
    title: 'Footer',
    summary: 'Site footer with brand, link columns, social icons, a newsletter form and legal links.',
    style: 'init',
    description:
        'ChillFooter assembles a complete, accessible `<footer>` from data: a brand block with social icons, any number of link columns, an optional newsletter signup and a bottom bar with copyright and legal links. ' +
        'Three variants (`default`, `minimal`, `centered`) cover most layouts.\n\n' +
        '`ChillFooter.init(target, options)` replaces the target element (which must be in the DOM). Every string is inserted as text and hrefs with `javascript:`/`data:` schemes are neutralised; use `copyrightHtml` only for trusted markup.',
    features: [
        'Brand with description, social links, link columns and legal links',
        'Newsletter form with async submit handling and a polite live status message',
        'Three layout variants: default, minimal, centered',
        'Responsive auto-fit grid, dark mode via CSS variables',
        'Safe by default: text only, sanitised hrefs, `rel="noopener noreferrer"` on external links',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Columns and legal links',
            description: 'A brand block, two link columns and the bottom bar.',
            height: 340,
            code: `const mount = document.createElement('div');
root.append(mount);
const f = ChillFooter.init(mount, {
  brand: { name: 'Acme', href: '#', description: 'Tools that make shipping calmer.' },
  columns: [
    { title: 'Product', links: [{ label: 'Features', href: '#f' }, { label: 'Pricing', href: '#p' }, { label: 'Changelog', href: '#c' }] },
    { title: 'Company', links: [{ label: 'About', href: '#a' }, { label: 'Blog', href: 'https://example.com/blog', external: true }, { label: 'Careers', href: '#j' }] },
  ],
  legal: [{ label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }],
  copyright: '© 2025 Acme, Inc.',
});
cleanup(() => f.destroy());`,
        },
        {
            id: 'newsletter',
            title: 'Newsletter signup',
            description: 'Return a Promise from `onNewsletterSubmit`: the button disables while it runs, then a success or error message is announced.',
            height: 380,
            code: `const mount = document.createElement('div');
root.append(mount);
const f = ChillFooter.init(mount, {
  brand: { name: 'Paper Planes', href: '#', description: 'A weekly letter about paper engineering.' },
  columns: [{ title: 'Read', links: [{ label: 'Archive', href: '#a' }, { label: 'RSS', href: '#r' }] }],
  newsletter: {
    title: 'Stay in touch',
    description: 'One email a week. No spam.',
    buttonText: 'Join',
    successMessage: 'Thanks, check your inbox!',
    errorMessage: 'Could not subscribe, try again.',
  },
  onNewsletterSubmit: (email) => new Promise((resolve) => setTimeout(resolve, 900)),
});
cleanup(() => f.destroy());`,
        },
        {
            id: 'social',
            title: 'Social icons',
            description: 'Social links need a `name` (used as `aria-label`) and an `icon` as text or a DOM element. They open in a new tab.',
            height: 280,
            code: `const mount = document.createElement('div');
root.append(mount);
const icon = (path) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '20'); s.setAttribute('height', '20');
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path); s.append(p);
  return s;
};
const f = ChillFooter.init(mount, {
  brand: { name: 'Orbit', description: 'Open-source UI for the curious.' },
  social: [
    { name: 'Email', href: 'mailto:hi@example.com', icon: icon('M4 6h16v12H4zM4 7l8 6 8-6') },
    { name: 'Website', href: 'https://example.com', icon: icon('M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18') },
    { name: 'Star', href: 'https://example.com/star', icon: '★' },
  ],
  columns: [],
  copyright: '© 2025 Orbit',
});
cleanup(() => f.destroy());`,
        },
        {
            id: 'variants',
            title: 'Minimal and centered variants',
            description: 'Use `variant` to switch the layout: `centered` stacks the bottom bar (copyright and legal links) in the middle, `minimal` hides the grid and keeps just that bar.',
            height: 460,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:16px';
const made = [];
['centered', 'minimal'].forEach((variant) => {
  const m = document.createElement('div');
  root.append(m);
  made.push(ChillFooter.init(m, {
    variant,
    brand: { name: 'Lumen', description: 'Light, fast, accessible.' },
    columns: [{ title: 'Links', links: [{ label: 'Docs', href: '#d' }, { label: 'Support', href: '#s' }] }],
    legal: [{ label: 'Privacy', href: '#p' }],
    copyright: '© 2025 Lumen (' + variant + ')',
  }));
});
cleanup(() => made.forEach((f) => f.destroy()));`,
        },
    ],
    guides: [
        {
            title: 'Newsletter flow',
            body:
                'The form is a real `<form>` with a required email input. Behaviour depends on what you provide:\n\n' +
                '- **`onNewsletterSubmit(email, event)` returns a Promise**: the button is disabled, then `successMessage` or `errorMessage` is announced (defaults: "Thanks for subscribing!" / "Something went wrong. Please try again."). The form resets on success.\n' +
                '- **Handler returns synchronously**: `successMessage` is shown if you set one. Throwing shows the error message.\n' +
                '- **No handler, with `newsletter.action`**: the browser submits the form normally (`method` defaults to `post`).\n' +
                '- **No handler and no action**: the submit is cancelled so the page never reloads.',
        },
        {
            title: 'Headings and landmarks',
            body:
                'Column titles render as headings. Set `headingLevel` (2 to 6, default 3) so the footer fits your document outline. Each column is a `<nav>` labelled by its heading, and `ariaLabel` names the `<footer>` landmark when you have more than one.',
        },
    ],
    options: [
        { name: 'brand', type: '{ name?, logo?, href?, description? }', default: 'null', description: 'Brand block. `href` defaults to `/`. Social links render inside this block, so they need a `brand`.' },
        { name: 'columns', type: '{ title: string, links: { label, href, external? }[] }[]', default: '[]', description: 'Link columns. `external: true` opens in a new tab with `rel="noopener noreferrer"`.' },
        { name: 'social', type: '{ name: string, href: string, icon?: string | Element }[]', default: '[]', description: 'Social links (always `target="_blank"`); `name` becomes the `aria-label`.' },
        { name: 'copyright', type: 'string', default: "''", description: 'Copyright text. Empty falls back to "© <current year> All rights reserved."' },
        { name: 'copyrightHtml', type: 'string', default: 'null', description: 'Explicit trusted HTML for the copyright line (overrides `copyright`).' },
        { name: 'legal', type: '{ label: string, href: string }[]', default: '[]', description: 'Legal links in the bottom bar.' },
        { name: 'newsletter', type: '{ title?, description?, placeholder?, buttonText?, label?, successMessage?, errorMessage?, action?, method? } | null', default: 'null', description: 'Show a newsletter form. Title defaults to "Subscribe", button to "Subscribe", placeholder to "Enter your email".' },
        { name: 'variant', type: "'default' | 'minimal' | 'centered'", default: "'default'", description: 'Layout variant. `minimal` hides brand, columns and newsletter and keeps only the copyright/legal bar; `centered` centres that bar.' },
        { name: 'headingLevel', type: 'number', default: '3', description: 'Heading level (clamped to 2-6) for column and newsletter titles.' },
        { name: 'ariaLabel', type: 'string', default: "''", description: 'Accessible name of the `<footer>` (omitted when empty).' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat string social icons as HTML (trusted markup only).' },
        { name: 'onNewsletterSubmit', type: '(email: string, event: SubmitEvent) => void | Promise', default: 'null', description: 'Handle the signup. A returned Promise drives the busy and result states.' },
    ],
    methods: [
        { signature: 'ChillFooter.init(target, options)', on: 'static', description: 'Render a footer in place of `target` (selector or element) and return an instance.' },
        { signature: 'ChillFooter.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.footer', description: 'The generated `<footer>` element.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and restore the original element.' },
    ],
    cssVars: [
        { name: '--chillfooter-bg', description: 'Footer background.' },
        { name: '--chillfooter-text', description: 'Main text colour.' },
        { name: '--chillfooter-text-muted', description: 'Links and secondary text.' },
        { name: '--chillfooter-border', description: 'Top border and dividers.' },
        { name: '--chillfooter-link-hover', description: 'Link hover colour.' },
    ],
    a11y: [
        'Uses the `<footer>` landmark; each link column is a `<nav>` labelled by its heading.',
        'Social links carry an `aria-label` from `name`; the newsletter input has an accessible name (`label` or placeholder).',
        'Newsletter results are announced via a polite `role="status"` live region; focus-visible rings on all controls.',
    ],
    tips: [
        'The footer has no JavaScript state besides the form, so it works fine to build once and never touch again.',
        'For SSR frameworks, call `init()` inside an effect after mount and `destroy()` on unmount.',
        'Pass elements (not strings) as social icons if you want full SVG control without `html: true`.',
    ],
    related: ['navbar', 'layout', 'sidebar'],
    keywords: ['bottom', 'newsletter', 'links', 'copyright', 'legal'],
};

export default doc;
