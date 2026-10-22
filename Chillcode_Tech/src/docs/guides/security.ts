import type { Guide } from '../types';

const guide: Guide = {
    id: 'security',
    title: 'Safe by default (XSS)',
    summary: 'Strings are rendered as text unless you opt in to HTML. Learn the rules, the exceptions, the CSV guard and how to handle user content.',
    group: 'Guides',
    body: `Cross-site scripting (XSS) happens when untrusted text is inserted into a page as HTML. ChillAll is designed so the easy path is the safe one: **strings become text, HTML is always an explicit opt-in.** This guide shows the rules, the few places that behave differently, and what to do with user-generated content.

## The rule

Titles, labels, messages, cell values, tab and nav content, helper text and error messages are inserted with \`textContent\`. If a user's name is \`<img src=x onerror=steal()>\`, visitors see those characters, nothing runs.

HTML needs a deliberate switch, and the switch is always visible in your code:

- a boolean \`html: true\` on the component or on one item (\`ChillTabs\`, \`ChillTable\` columns, \`ChillNotify\`, \`ChillLayout\`, \`ChillDrawer\`, \`ChillSidebar\`, \`ChillTree\`, \`ChillCommand\` icons, \`ChillAlert\` has a separate \`html\` option next to \`text\`)
- an \`*Html\` option with the word in its name, such as \`iconHtml\`, \`prevHtml\`, \`nextHtml\`, \`labelHtml\`, \`footerHtml\`
- passing a DOM \`Node\` or \`Element\`. You built the node, so you own it.

> **Note:** \`ChillSidebar\`, \`ChillNavbar\`, \`ChillFooter\`, \`ChillBreadcrumb\` and \`ChillCard\` also neutralise dangerous link targets: an \`href\` starting with \`javascript:\`, \`data:\` or \`vbscript:\` is replaced with \`#\` (whitespace and control characters browsers ignore inside the scheme are stripped before the check).

## Step 1: see the same payload rendered safely

This demo feeds one hostile string into a button label, a tab panel and a table cell. Then it reports whether any element or event handler leaked out of it.

\`\`\`live
const payload = '<img src=x onerror="window.__chillXss=1"><b>bold</b> <a href="javascript:alert(1)">click</a>';
window.__chillXss = 0;
root.style.cssText += ';display:flex;flex-direction:column;gap:14px';

const btn = ChillButton.create({ text: payload, variant: 'outline' });

const tabsHost = document.createElement('div');
root.append(tabsHost);
const tabs = ChillTabs.init(tabsHost, { tabs: [{ id: 'a', label: 'Profile', content: payload }] });

const tableHost = document.createElement('div');
const table = ChillTable.create(tableHost, {
  columns: [{ key: 'name', label: 'Name' }],
  data: [{ name: payload }],
  searchable: false
});

root.append(btn, tableHost);

const report = document.createElement('pre');
report.style.cssText = 'margin:0;padding:12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
const spots = { 'button text': btn, 'tab panel': tabs.container.querySelector('[role="tabpanel"]'), 'table cell': tableHost.querySelector('td') };
report.textContent = Object.entries(spots).map(([name, el]) => {
  const injected = el ? el.querySelectorAll('img, b, a').length : 0;
  return name + ': ' + injected + ' injected elements';
}).join('\\n') + '\\nhandler ran: ' + (window.__chillXss ? 'YES' : 'no');
root.append(report);

cleanup(() => { tabs.destroy(); table.destroy(); delete window.__chillXss; });
\`\`\`

Everything shows up as literal characters, and the report counts zero injected elements.

## Step 2: opting in to HTML, and what that costs

When you really need markup (a bold word in a table cell, a link in a notification) turn it on for that one spot:

\`\`\`js
ChillNotify.info({ message: 'Read the <a href="/changelog">changelog</a>', html: true });
ChillTable.create(el, { columns: [{ key: 'status', label: 'Status', html: true, render: (v) => '<b>' + v + '</b>' }], data });
ChillTabs.init(el, { tabs: [{ id: 'rich', label: 'Rich', content: '<em>trusted</em>', html: true }] });
\`\`\`

How much protection the opt-in still gives depends on the component:

- \`ChillButton\` (\`html: true\`) and string icons starting with \`<\` (on \`ChillButton\`, \`ChillInput\`, \`ChillDropdown\`) go through a small sanitiser that drops \`script\`, \`iframe\`, \`object\`, \`embed\`, \`style\`, \`link\`, \`meta\`, \`base\` and \`form\` elements, all \`on*\` attributes, \`srcdoc\`, and \`javascript:\` / \`vbscript:\` / \`data:text/html\` URLs. It is a safety net, not a full HTML sanitiser.
- Most other \`html: true\` paths (\`ChillTable\` columns, \`ChillTabs\`, \`ChillNotify\`, \`ChillAlert\`, \`ChillDrawer\`, \`ChillTree\`) insert your string as is. **You** must make sure it is trusted or sanitised.

> **Warning:** never pass user-controlled data to an \`html: true\` option without sanitising it first. Concatenating even one field into the markup (\`'<b>' + user.name + '</b>'\`) re-opens the hole.

## The one backward-compatible exception: ChillModal

For compatibility with older code, \`ChillModal.open({ content: '<form>...</form>' })\` still renders a string \`content\` as HTML, and it is inserted unsanitised. Use these instead for data you do not control:

\`\`\`js
ChillModal.open({ title: 'Reply', text: userMessage });            // plain text, always safe
ChillModal.open({ title: 'Reply', content: userMessage, html: false });
ChillModal.open({ title: 'Reply', content: someDomNode });         // build the node yourself
\`\`\`

The \`title\` and button \`text\` of a modal are always text. \`ChillModal.alert()\` and \`ChillModal.confirm()\` take a \`message\` that is also text.

## Step 3: sanitise when you must allow HTML

If users can submit rich text, sanitise it with an allow-list before it reaches an \`html: true\` option. A maintained library such as DOMPurify is the best choice. This demo shows the idea with a tiny allow-list (only for illustration, prefer a real sanitiser in production) and passes the result to \`ChillTabs\` with \`html: true\`.

\`\`\`live
const ALLOWED = { B: [], I: [], EM: [], STRONG: [], A: ['href'] };
const SAFE_HREF = /^(https?:|mailto:|\\/|#)/i;

function sanitize(dirty) {
  const tpl = document.createElement('template');
  tpl.innerHTML = dirty;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        const allowed = ALLOWED[child.tagName];
        if (!allowed) { child.replaceWith(document.createTextNode(child.textContent)); return; }
        [...child.attributes].forEach((a) => {
          const ok = allowed.includes(a.name) && (a.name !== 'href' || SAFE_HREF.test(a.value.trim()));
          if (!ok) child.removeAttribute(a.name);
        });
        walk(child);
      }
    });
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

const dirty = '<b>Hello</b> <img src=x onerror="alert(1)"> <a href="javascript:alert(2)" onclick="x()">link</a> <a href="https://example.com">safe</a>';
const clean = sanitize(dirty);

const host = document.createElement('div');
root.append(host);
const tabs = ChillTabs.init(host, { tabs: [{ id: 'rich', label: 'Comment', content: clean, html: true }] });

const out = document.createElement('pre');
out.style.cssText = 'margin:12px 0 0;padding:12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
out.textContent = 'before: ' + dirty + '\\nafter:  ' + clean;
root.append(out);
cleanup(() => tabs.destroy());
\`\`\`

## CSV formula injection in table export

Spreadsheet programs run cells that start with \`=\`, \`+\`, \`-\` or \`@\` as formulas, so an exported name like \`=HYPERLINK("http://evil","x")\` can attack whoever opens the file. \`ChillTable.exportCSV()\` guards against this: text cells starting with \`=\`, \`+\`, \`@\`, a tab or a carriage return, and text starting with \`-\` that is not a number, get a leading apostrophe. Real numbers are left alone, and cells containing quotes, commas or line breaks are quoted.

\`\`\`live
const table = ChillTable.create(root, {
  columns: [{ key: 'name', label: 'Name' }, { key: 'amount', label: 'Amount', align: 'right' }],
  data: [
    { name: '=HYPERLINK("http://evil.example","Click me")', amount: 10 },
    { name: '+cmd|calc', amount: -5 },
    { name: '-1+1', amount: 7 },
    { name: 'Plain, with comma', amount: 3 }
  ],
  searchable: false
});
const pre = document.createElement('pre');
pre.style.cssText = 'margin:12px 0 0;padding:12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap';
pre.textContent = table.exportCSV();
root.append(pre);
cleanup(() => table.destroy());
\`\`\`

> **Tip:** use a column's \`exportValue(value, row)\` to control exactly what is exported. It runs through the same guard.

## What to do with user content: a checklist

1. Keep it as text. Pass strings straight to options; do not build markup from them.
2. Prefer \`Node\`s you create with \`textContent\` when you need structure around user data.
3. If rich text is a requirement, sanitise on the server (and again before display) and only then use an \`html: true\` option.
4. For \`ChillModal\`, use \`text\` or \`html: false\` for anything user-supplied.
5. Validate URLs you put in \`href\`/\`src\` yourself outside the components that already neutralise them.
6. Add a Content-Security-Policy as defence in depth.

## Next steps

- [Modal](/docs/modal) and [Table](/docs/table) for the options mentioned here
- [Upgrading to ChillAll 2.0](/docs/guide/migration) for the behaviour changes that made text the default
`,
};

export default guide;
