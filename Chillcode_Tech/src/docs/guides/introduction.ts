import type { Guide } from '../types';

// Fences are written as ~~~ and converted, so the body can live in a template literal.
const body = String.raw`
## What is ChillAll?

ChillAll is **one npm package with 88 UI components** - alerts, modals, tables, charts, forms, pickers, navigation, overlays, data tools and runtime utilities. Every component is plain JavaScript with **zero dependencies**, so it behaves the same in a static HTML page, React, Vue, Svelte or Next.js.

It was built around four promises:

- **Small.** Components are tree-shakeable. Importing one component ships roughly 4 KB gzipped, not the whole library.
- **Safe by default.** Text is rendered as text. HTML is always an explicit opt-in (see [Safe by default](/docs/guide/security)).
- **Accessible.** Roles, keyboard support, focus management and reduced-motion handling are built in (see [Accessibility](/docs/guide/accessibility)).
- **Themeable.** Dark mode follows the OS or your own toggle, and every colour is a CSS variable (see [Theming](/docs/guide/theming)).

## Try it right now

This is a real component running on this page. Edit the code and press **Ctrl/Cmd + Enter**.

~~~live
const save = ChillButton.create({ text: 'Save changes', variant: 'primary' });
save.addEventListener('click', async () => {
  save.setLoading(true, 'Saving...');
  await new Promise((r) => setTimeout(r, 1200));
  save.setLoading(false);
  ChillAlert.toast({ title: 'Saved!', icon: 'success' });
});
root.append(save);
cleanup(() => save.destroy());
~~~

Two components worked together there: a **button** with a built-in loading state and a **toast** from ChillAlert. No setup, no provider, no stylesheet import. Each component injects its own CSS the first time you use it.

## The mental model

Almost every component follows the same three ideas, so once you have used two you know the rest.

### 1. Create or enhance

- **create(options)** builds new DOM (or an instance that owns DOM) and returns it. Append it where you like.
- **init(target, options)** enhances elements that are already on the page and returns an instance.

Some older components only have one of the two (for example Accordion and Tabs are init-only). Each component page says which style it uses.

### 2. Options in, callbacks and events out

You describe what you want with an options object, and you hear about changes through callbacks such as onChange or through on(event, handler). The handler registration returns an unsubscribe function.

~~~live
const slider = ChillSlider.create({ value: 40, container: root, onChange: (v) => { out.textContent = 'Value: ' + v; } });
const out = document.createElement('p');
out.textContent = 'Value: 40';
out.style.margin = '12px 0 0';
root.append(out);
cleanup(() => slider.destroy());
~~~

### 3. Always clean up

Every instance has a destroy() method that removes its DOM, listeners, observers and timers. Call it when your view goes away. In a framework that means the cleanup function of an effect (see the [React](/docs/guide/react), [Vue](/docs/guide/vue) and [Next.js](/docs/guide/nextjs) guides).

> **Tip:** The live examples in these docs register their teardown with cleanup(fn), the sandbox equivalent of "call destroy when the component unmounts".

## What is in the box

- **Core** - Alert, Form validation, Table, Chart, Date picker, Modal, Notify.
- **Form controls** - Button, Input, Select, Checkbox, Radio, Switch, Slider, Rating, OTP, Colour picker, Time picker, Number input, Tag input, Autocomplete, Segmented control.
- **Navigation** - Navbar, Sidebar, Footer, Breadcrumb, Tabs, Layout, Stepper, ScrollSpy, Splitter.
- **Feedback and overlays** - Tooltip, Popover, Drawer, Context menu, Lightbox, Tour, Spinner, Skeleton, Callout, Progress and more.
- **Display** - Card, Timeline, Tree, Carousel, Stat, Calendar, Code, Marquee, Countdown and more.
- **Data** - Pagination, Search, Filter, Sort, Infinite scroll, Drag and drop, File upload, Virtual list (100k rows).
- **Utilities** - Theme, Command palette, Hotkeys, Storage, Events, Fetch, Toolkit, Animate and more.

Browse them all on the [components page](/docs), or press **Ctrl/Cmd + K** anywhere in the docs to search.

## Where to go next

1. [Install ChillAll](/docs/guide/installation) with npm or a script tag.
2. Follow the guide for your stack: [React](/docs/guide/react), [Vue](/docs/guide/vue), [Next.js](/docs/guide/nextjs) or [plain HTML](/docs/guide/vanilla).
3. Read [Theming](/docs/guide/theming) to match your brand.
4. Build something real with a recipe, such as the [login form](/docs/guide/recipe-login-form).
`.replace(/^~~~/gm, '```');

const guide: Guide = {
    id: 'introduction',
    title: 'Introduction',
    summary: 'What ChillAll is, the mental model shared by all 88 components, and your first live example.',
    group: 'Getting started',
    body,
};

export default guide;
