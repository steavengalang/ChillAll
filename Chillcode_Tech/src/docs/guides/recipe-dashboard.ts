import type { Guide } from '../types';

const guide: Guide = {
    id: 'recipe-dashboard',
    title: 'Recipe: dashboard layout',
    summary: 'Compose ChillSidebar, ChillNavbar and ChillLayout, fill them with ChillStat cards and a ChillChart, and show ChillSkeleton while loading.',
    group: 'Recipes',
    body: `**Goal:** an admin dashboard skeleton: a collapsible sidebar, a top navbar, a row of KPI cards with sparklines, a revenue chart and a recent-activity list, all showing skeleton placeholders until the (fake) data arrives, with a Reload button to see it again.

**You will use:** [ChillSidebar](/docs/sidebar), [ChillNavbar](/docs/navbar), [ChillLayout](/docs/layout), [ChillStat](/docs/stat), [ChillChart](/docs/chart) and [ChillSkeleton](/docs/skeleton).

## How the pieces fit

- **ChillSidebar** is \`position: fixed\` to the left edge of the viewport (260px wide, \`--chillsidebar-width\`). Your page content needs a matching left margin. At 768px and below it becomes an off-canvas drawer, so apply the margin only above that width.
- **ChillLayout** gives the page structure: a sticky \`header\` slot, a centred \`content\` container, optional footer. Slots take DOM nodes, so the navbar goes in the header.
- **ChillNavbar** is the top bar with brand, links and an \`actions\` area for your own buttons.
- **ChillStat** is a KPI card with a value, delta, sparkline and a built-in \`loading\` skeleton.
- **ChillChart** draws canvas charts into any element and follows the page theme.
- **ChillSkeleton** gives placeholders that are announced as busy (\`role="status"\`, \`aria-busy\`).

## Step 1: the bordered frame

On a real page the shell fills the window. To demo it inside a page, put it in a fixed-height box. A CSS \`transform\` on the box makes the fixed sidebar position relative to the box instead of the window.

\`\`\`js
const box = document.createElement('div');
box.style.cssText = 'position:relative;transform:translateZ(0);height:560px;overflow:hidden;border:1px solid var(--chill-border);border-radius:12px';
\`\`\`

Inside it, one element for the sidebar and one scrolling \`main\` area with a left margin on wide screens. In your own app, drop the box and use \`min-height: 100vh\` with the same margin rule.

## Step 2: sidebar, then layout with the navbar in the header

\`\`\`js
const sb = ChillSidebar.init(sidebarMount, {
  brand: { name: 'Acme' },
  activeItem: 'overview',
  items: [
    { type: 'section', label: 'Main', items: [
      { id: 'overview', label: 'Overview', icon: '\\u{1F4CA}', href: '#overview' },
      { id: 'customers', label: 'Customers', icon: '\\u{1F465}', href: '#customers', badge: 3 }
    ] }
  ],
  onItemClick: (id, e) => { e.preventDefault(); sb.setActiveItem(id); }
});

const layout = ChillLayout.init(layoutMount, { header: navMount, content, containerSize: 'full' });
const nav = ChillNavbar.init(navMount, { brand: { name: 'Overview' }, actions: [{ element: reloadButton }] });
\`\`\`

Prevent the default on \`onItemClick\` when your app routes itself, then call \`setActiveItem()\` so \`aria-current="page"\` follows. \`ChillLayout.init()\` replaces the target element, which must already be in the DOM; the navbar is created into the header mount afterwards.

## Step 3: cards and chart with skeletons

Create each \`ChillStat\` with \`loading: true\`: it shows its own skeleton. For the chart and the list, render a skeleton preset next to the real container and toggle which one is visible:

\`\`\`js
const chartSkeleton = ChillSkeleton.preset('card', { image: true, imageHeight: 200, avatar: false, lines: 1 });
const listSkeleton = ChillSkeleton.preset('list', { count: 4 });
\`\`\`

When data arrives, call \`stat.update({ value, delta, sparkline })\` and \`stat.setLoading(false)\`, hide the skeletons, and create the chart (or \`chart.update(data)\` on later loads). Create the chart only once its container is visible so it can measure its size.

> **Tip:** \`ChillSkeleton.reveal(skeletonEl, realEl)\` swaps a skeleton for the real element and clears \`aria-busy\` in one call. Here we want to go back to the skeleton on Reload, so the demo toggles \`hidden\` instead.

## Step 4: the working dashboard

Wait a second for the first load, then press **Reload** in the navbar. Collapse the sidebar with its header button and try the charts' legend buttons, or hover the chart.

\`\`\`live
let alive = true;
let timer = null;

const box = document.createElement('div');
box.className = 'dash-demo';
box.style.cssText = 'position:relative;transform:translateZ(0);height:560px;overflow:hidden;border:1px solid var(--chill-border);border-radius:12px;background:var(--chill-bg-secondary)';
const css = document.createElement('style');
css.textContent = '.dash-main{height:100%;overflow:auto}@media (min-width:769px){.dash-main{margin-left:260px}}.dash-demo .chilllayout{min-height:100%}.dash-demo .chilllayout-header{top:0}.dash-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.dash-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:16px}';
const sidebarMount = document.createElement('div');
const main = document.createElement('div');
main.className = 'dash-main';
const layoutMount = document.createElement('div');
main.append(layoutMount);
box.append(css, sidebarMount, main);
root.append(box);

// --- content ---
const content = document.createElement('div');
content.style.cssText = 'padding:16px;color:var(--chill-text)';
const heading = document.createElement('h2');
heading.style.cssText = 'margin:0 0 12px;font-size:18px';
heading.textContent = 'Overview';

const grid = document.createElement('div');
grid.className = 'dash-grid';
const specs = [
  { label: 'Revenue', prefix: '$', icon: '\\u{1F4B0}' },
  { label: 'Active users', icon: '\\u{1F464}' },
  { label: 'Churn rate', suffix: '%', decimals: 1, invertDelta: true, icon: '\\u{1F4C9}' },
  { label: 'Open tickets', icon: '\\u{1F3AB}' }
];
const stats = specs.map((s) => { const st = ChillStat.create({ ...s, value: 0, loading: true, size: 'sm' }); grid.append(st.element); return st; });

const card = (title) => {
  const c = ChillLayout.createCard();
  const body = document.createElement('div');
  body.className = 'chilllayout-card-body';
  const h = document.createElement('h3');
  h.style.cssText = 'margin:0 0 10px;font-size:14px';
  h.textContent = title;
  body.append(h);
  c.append(body);
  return { c, body };
};
const chartCard = card('Revenue by month ($k)');
const listCard = card('Recent activity');

const chartSkeleton = ChillSkeleton.preset('card', { image: true, imageHeight: 180, avatar: false, lines: 1 });
const chartHost = document.createElement('div');
chartHost.style.height = '220px';
chartHost.hidden = true;
chartCard.body.append(chartSkeleton, chartHost);

const listSkeleton = ChillSkeleton.preset('list', { count: 4 });
const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:13px';
list.hidden = true;
listCard.body.append(listSkeleton, list);

const two = document.createElement('div');
two.className = 'dash-two';
two.append(chartCard.c, listCard.c);
content.append(heading, grid, two);

// --- shell ---
const reload = ChillButton.create({ text: 'Reload', size: 'sm', variant: 'outline', onClick: () => load() });
const navMount = document.createElement('div');
const sb = ChillSidebar.init(sidebarMount, {
  brand: { name: 'Acme' },
  activeItem: 'overview',
  items: [
    { type: 'section', label: 'Main', items: [
      { id: 'overview', label: 'Overview', icon: '\\u{1F4CA}', href: '#overview' },
      { id: 'customers', label: 'Customers', icon: '\\u{1F465}', href: '#customers', badge: 3 },
      { id: 'billing', label: 'Billing', icon: '\\u{1F4B3}', href: '#billing' }
    ] }
  ],
  onItemClick: (id, e) => { e.preventDefault(); sb.setActiveItem(id); heading.textContent = id.charAt(0).toUpperCase() + id.slice(1); }
});
const layout = ChillLayout.init(layoutMount, { header: navMount, content, containerSize: 'full' });
const nav = ChillNavbar.init(navMount, { brand: { name: 'Acme dashboard' }, actions: [{ element: reload }] });

// --- fake data ---
const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
const series = (n, base) => Array.from({ length: n }, (_, i) => base + i * 2 + rnd(-4, 6));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
let chart = null;

const load = () => {
  clearTimeout(timer);
  stats.forEach((s) => s.setLoading(true));
  chartSkeleton.hidden = false; chartHost.hidden = true;
  listSkeleton.hidden = false; list.hidden = true;
  ChillSkeleton.setBusy(content, true);
  timer = setTimeout(() => {
    if (!alive) return;
    const values = [rnd(90000, 140000), rnd(7000, 9000), rnd(15, 40) / 10, rnd(20, 60)];
    stats.forEach((s, i) => {
      s.update({ value: values[i], delta: +(rnd(-60, 120) / 10).toFixed(1), deltaLabel: 'vs last month', sparkline: series(8, 10), color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i] });
      s.setLoading(false);
    });
    chartSkeleton.hidden = true; chartHost.hidden = false;
    const data = { labels: months, datasets: [{ label: 'Revenue', data: series(8, 30), color: '#3b82f6' }, { label: 'Costs', data: series(8, 18), color: '#f59e0b' }] };
    if (chart) chart.update(data);
    else chart = ChillChart.create(chartHost, { type: 'line', data, options: { ariaLabel: 'Revenue and costs by month, in thousands of dollars' } });
    list.textContent = '';
    ['Ada upgraded to Pro', 'Invoice #1042 paid', 'New ticket from Globex', 'Grace invited 3 teammates'].forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      list.append(li);
    });
    listSkeleton.hidden = true; list.hidden = false;
    ChillSkeleton.setBusy(content, false);
  }, 900);
};
load();

cleanup(() => {
  alive = false;
  clearTimeout(timer);
  if (chart) chart.destroy();
  stats.forEach((s) => s.destroy());
  nav.destroy(); layout.destroy(); sb.destroy(); reload.destroy();
});
\`\`\`

## Step 5: the simplest loading pattern

For a one-off panel you do not need the toggling above. Put a skeleton where the content will go and let \`ChillSkeleton.reveal()\` swap it for the real element when the data is ready. It also clears \`aria-busy\`, so screen readers hear that loading finished. The stat starts in its own \`loading\` state and is released by \`setLoading(false)\`.

\`\`\`live
root.style.cssText += ';display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
let alive = true;

const skeleton = ChillSkeleton.preset('card', { image: true, imageHeight: 90, lines: 2, label: 'Loading profile' });
const stat = ChillStat.create({ label: 'Conversion rate', value: 3.8, suffix: '%', decimals: 1, delta: 0.4, deltaLabel: 'vs last week', loading: true, countUp: true });
root.append(skeleton, stat.element);

const timer = setTimeout(() => {
  if (!alive) return;
  const real = document.createElement('div');
  real.style.cssText = 'padding:14px;border:1px solid var(--chill-border);border-radius:12px;color:var(--chill-text);font-size:14px';
  real.textContent = 'Ada Lovelace, Engineering. Loaded from the server.';
  ChillSkeleton.reveal(skeleton, real);
  stat.setLoading(false);
}, 800);

cleanup(() => { alive = false; clearTimeout(timer); stat.destroy(); });
\`\`\`

## Step 6: make it production-ready

- **Real data.** Replace the fake \`load()\` with \`fetch()\` and call \`load()\` again on an interval or on filter changes. Guard against races, as with the \`alive\` flag above, and show an error state (see [ChillEmptyState](/docs/emptystate) with \`preset: 'error'\`) when the request fails.
- **Routing.** Use \`href\` plus \`setActiveItem()\` from your router, and \`ChillNavbar.setActiveLink(href)\` for top links.
- **Persistence.** Pass \`storageKey: 'sidebar-collapsed'\` to the sidebar to remember its collapsed state.
- **Mobile.** On narrow screens the sidebar is a drawer. Give it an opener with the \`mobileToggle\` option (a selector or element, e.g. a menu button in your navbar actions).
- **Accessibility.** Each region is a labelled landmark (\`aside > nav\`, \`header\`, \`main\`). Add a skip link with \`ChillLayout.init(..., { skipLink: true })\` and give the chart an \`ariaLabel\` that states its conclusion in one sentence.
- **Theme.** All of these follow dark mode automatically; see [Theming & dark mode](/docs/guide/theming).

## Result

A responsive shell where every region loads independently and announces its busy state, built from six small components and about 100 lines of glue.

## Next steps

- [Layout](/docs/layout), [Sidebar](/docs/sidebar) and [Navbar](/docs/navbar) for every slot and option
- [Stat](/docs/stat) for count-up animations and clickable tiles
- [Chart](/docs/chart) for bar, pie and doughnut types
- [Skeleton](/docs/skeleton) for the other presets (\`table\`, \`avatar\`, \`text\`)
`,
};

export default guide;
