import type { DocEntry } from '../../types';

// Shared demo scaffold: a scrollable article on the left and a slot for the table of contents on the right.
const SCAFFOLD = `root.style.cssText += ';display:flex;gap:20px;align-items:flex-start';
const article = document.createElement('div');
article.style.cssText = 'flex:1;min-width:0;height:260px;overflow:auto;position:relative;border:1px solid var(--chill-border);border-radius:10px;padding:0 16px;color:var(--chill-text);font-size:14px;line-height:1.6';
const aside = document.createElement('div');
aside.style.cssText = 'width:180px;flex-shrink:0';
root.append(article, aside);
const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(3);
const addSection = (title, tag = 'h2', id) => {
  const h = document.createElement(tag);
  h.textContent = title;
  if (id) h.id = id;
  const p = document.createElement('p');
  p.textContent = lorem;
  article.append(h, p);
  return h;
};`;

const doc: DocEntry = {
    id: 'scrollspy',
    global: 'ChillScrollSpy',
    category: 'navigation',
    title: 'Scroll Spy',
    summary: 'Table of contents that highlights the section you are reading, built from headings or existing links.',
    style: 'static',
    description:
        'ChillScrollSpy keeps a table of contents in sync with the scroll position. Point it at an article and it builds a nested `<nav>` from the headings (adding slug ids where missing), or hand it your own anchor links. ' +
        'The active item is the last heading whose top has passed the `offset` line, detected with IntersectionObserver plus a throttled scroll fallback.\n\n' +
        'It works with the window or with any scrolling element via `scrollContainer`. Clicking a link scrolls smoothly (respecting reduced motion), moves focus to the heading and updates the URL hash unless you disable it with `updateHash: false`.',
    features: [
        'Auto-builds a table of contents from `h2, h3` (or any selector), with level-based indentation',
        'Or enhances existing anchor links with the `links` option',
        'Works with the window or a custom scroll container; `offset` accounts for sticky headers',
        'Smooth scrolling, focus management and `aria-current="location"` on the active link',
        '`refresh()` re-scans after DOM changes; `on("change")` and `onChange` report the active heading',
    ],
    examples: [
        {
            id: 'auto-toc',
            title: 'Auto-generated table of contents',
            description: 'Headings without an `id` get a unique slug id. Scroll the article, or click a link in the table of contents.',
            height: 300,
            code: `${SCAFFOLD}
['Introduction', 'Installation', 'Usage', 'Configuration', 'FAQ'].forEach((t) => addSection(t));
const spy = ChillScrollSpy.init({
  content: article,
  container: aside,
  scrollContainer: article,
  title: 'On this page',
  updateHash: false,
});
cleanup(() => spy.destroy());`,
        },
        {
            id: 'levels',
            title: 'Nested headings and change events',
            description: 'With `headings: "h2, h3"` sub-sections are indented. `onChange(id, headingEl, instance)` fires whenever the active section changes.',
            height: 320,
            code: `${SCAFFOLD}
addSection('Getting started', 'h2');
addSection('Install', 'h3');
addSection('First steps', 'h3');
addSection('Guides', 'h2');
addSection('Theming', 'h3');
addSection('Reference', 'h2');
const status = document.createElement('p');
status.style.cssText = 'font-size:13px;margin:12px 0 0;color:var(--chill-text)';
aside.append(status);
const spy = ChillScrollSpy.init({
  content: article, container: aside, scrollContainer: article, headings: 'h2, h3', updateHash: false,
  onChange: (id, el) => { status.textContent = 'Reading: ' + el.textContent; },
});
cleanup(() => spy.destroy());`,
        },
        {
            id: 'existing-links',
            title: 'Use your own navigation',
            description: 'Pass `links` to highlight existing anchors instead of building a list. The active link gets the `activeClass` (default `chillscrollspy-active`).',
            height: 300,
            code: `${SCAFFOLD}
const ids = [['Overview', 'ss-overview'], ['Pricing', 'ss-pricing'], ['Support', 'ss-support']];
ids.forEach(([t, id]) => addSection(t, 'h2', id));
const style = document.createElement('style');
style.textContent = '#ss-menu a{display:block;padding:6px 10px;border-radius:6px;text-decoration:none;color:var(--chill-text);opacity:.7} #ss-menu a.is-current{background:var(--chill-bg-secondary);opacity:1;font-weight:600}';
const nav = document.createElement('nav');
nav.id = 'ss-menu';
ids.forEach(([t, id]) => { const a = document.createElement('a'); a.href = '#' + id; a.textContent = t; nav.append(a); });
aside.append(style, nav);
const spy = ChillScrollSpy.init({ links: '#ss-menu a', scrollContainer: article, activeClass: 'is-current', updateHash: false });
cleanup(() => spy.destroy());`,
        },
        {
            id: 'api',
            title: 'Programmatic control and refresh',
            description: '`scrollTo(id)` scrolls to a section, `setActive(id)` forces the highlight, and `refresh()` rebuilds the list after you add content.',
            height: 340,
            code: `${SCAFFOLD}
['Alpha', 'Beta', 'Gamma'].forEach((t) => addSection(t, 'h2', 'ss-' + t.toLowerCase()));
const spy = ChillScrollSpy.init({ content: article, container: aside, scrollContainer: article, updateHash: false });
const row = document.createElement('div');
row.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:12px';
const add = ChillButton.create({ text: 'Add section', size: 'sm' });
const jump = ChillButton.create({ text: 'Scroll to Gamma', size: 'sm', variant: 'outline' });
let n = 0;
add.onclick = () => { n++; addSection('Extra ' + n, 'h2', 'ss-extra-' + n); spy.refresh(); };
jump.onclick = () => spy.scrollTo('ss-gamma');
row.append(add, jump);
aside.append(row);
cleanup(() => spy.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Offsets, containers and the URL hash',
            body:
                'Use `offset` (px) to compensate for a sticky header: a heading becomes active when its top passes that line, and `scrollTo` stops `offset` pixels above the heading. ' +
                'When the scrolling element is not the window, pass it as `scrollContainer` so scroll listening, the observer root and `scrollTo` all use it.\n\n' +
                'By default a click also calls `history.replaceState` with `#id`. Set `updateHash: false` in apps that use hash routing.',
        },
        {
            title: 'IDs and cleanup',
            body:
                'Built tables of contents need an id on every heading. Missing ids are generated from the text (`"Getting started"` becomes `getting-started`, with `-2`, `-3` for duplicates) and removed again on `destroy()`. ' +
                'Headings you gave an id keep it. The first item is highlighted before any heading has been passed unless `activateFirst: false`, and scrolling to the very bottom always highlights the last item.\n\n' +
                'Call `refresh()` after adding or removing headings; it rebuilds the list and listeners.',
        },
    ],
    options: [
        { name: 'content', type: 'string | Element', default: 'document.body', description: 'Where headings are searched.' },
        { name: 'headings', type: 'string', default: "'h2, h3'", description: 'Heading selector, relative to `content`. Empty headings are skipped.' },
        { name: 'container', type: 'string | Element', default: 'null', description: 'Where the generated `<nav>` is appended. Without it use `instance.element`.' },
        { name: 'links', type: 'string | Element | Element[]', default: 'null', description: 'Use existing anchors (with `#id` hrefs) instead of building a list.' },
        { name: 'scrollContainer', type: 'string | Element', default: 'window', description: 'The scrolling element.' },
        { name: 'offset', type: 'number', default: '0', description: 'Pixels from the top of the viewport (sticky header height).' },
        { name: 'smooth', type: 'boolean', default: 'true', description: 'Smooth scrolling on click (ignored under reduced motion).' },
        { name: 'updateHash', type: 'boolean', default: 'true', description: 'Update the URL hash with `history.replaceState` on click.' },
        { name: 'activateFirst', type: 'boolean', default: 'true', description: 'Highlight the first item before any heading has been passed.' },
        { name: 'title', type: 'string', default: "''", description: 'Optional visible title above the generated list.' },
        { name: 'ariaLabel', type: 'string', default: "'Table of contents'", description: 'Accessible name of the generated `<nav>`.' },
        { name: 'activeClass', type: 'string', default: "'chillscrollspy-active'", description: 'Class added to the active link.' },
        { name: 'onChange', type: '(id: string | null, heading: Element | null, instance) => void', default: 'null', description: 'Called when the active section changes.' },
    ],
    methods: [
        { signature: 'ChillScrollSpy.init(options)', on: 'static', description: 'Create a scroll spy and return an instance. Takes a single options object.' },
        { signature: 'ChillScrollSpy.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.element', description: 'The generated `<nav>` (null when `links` is used).' },
        { signature: 'instance.refresh()', description: 'Re-scan headings or links after DOM changes. Returns the instance.' },
        { signature: 'instance.getActive()', description: 'Id of the active heading, or `null`.' },
        { signature: 'instance.setActive(id)', description: 'Force the highlight to a known id (ignored for unknown ids).' },
        { signature: 'instance.scrollTo(id)', description: 'Scroll to a heading, focus it and update the hash (if enabled).' },
        { signature: 'instance.on("change", fn)', description: 'Subscribe with `fn(id, headingEl)`. Returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners, the generated nav and any generated ids.' },
    ],
    events: [{ name: 'change', payload: '(id, headingEl)', description: 'The active section changed (the only event accepted by `on()`).' }],
    cssVars: [
        { name: '--chillscrollspy-text', description: 'Inactive link colour.' },
        { name: '--chillscrollspy-text-hover', description: 'Hover colour.' },
        { name: '--chillscrollspy-active', description: 'Active link and indicator colour.' },
        { name: '--chillscrollspy-line', description: 'Vertical guide line.' },
        { name: '--chillscrollspy-ring', description: 'Focus ring colour.' },
    ],
    a11y: [
        'The generated list is a `<nav aria-label="Table of contents">` of real links; the active link gets `aria-current="location"`.',
        'Clicking a link moves focus to the target heading (it temporarily gets `tabindex="-1"`), so keyboard and screen-reader users land on the section.',
        'Smooth scrolling is skipped when `prefers-reduced-motion` is set. Modifier-clicks (Ctrl, Cmd, Shift) keep the browser default.',
    ],
    tips: [
        'Make the TOC `position: sticky` in your layout so it stays visible while the article scrolls.',
        'Give headings explicit ids when other scripts or deep links rely on them; generated ids can change with the text.',
        'In SPAs call `destroy()` when the page unmounts and `refresh()` after rendering new content.',
    ],
    related: ['sidebar', 'breadcrumb', 'backtotop'],
    keywords: ['toc', 'table of contents', 'on this page', 'anchor', 'active heading'],
};

export default doc;
