# ChillAll

**Every ChillLib component in one package.** 88 zero-dependency, framework-agnostic UI components: alerts, modals,
toasts, tables, charts, forms, date/time/colour pickers, navigation, drawers, carousels, trees, calendars, virtual
lists, data tools and runtime utilities. Works in plain HTML, React, Vue, Next.js (SSR-safe), Nuxt and anything else.

- **One install, one file** - no more 46 separate packages (`chillall` has zero dependencies).
- **Tree-shakeable** - `import { ChillButton }` ships ~14 KB (3.8 KB gzip), not the whole library.
- **Dark mode that follows you** - OS preference, or `<html data-theme="dark">` / `class="dark"` (see `ChillTheme`).
- **Accessible** - roles/ARIA, keyboard support, focus management, `prefers-reduced-motion`.
- **Safe by default** - text is rendered as text; HTML is always an explicit opt-in.
- **Typed** - generated `.d.ts` included.

Full list: [COMPONENTS.md](./COMPONENTS.md) · live gallery: `demo/index.html` (`node tools/serve.js`).

## Install

```bash
npm install chillall
```

## Use

### ES modules (bundlers: Vite, webpack, Next.js, ...)

```js
import { ChillAlert, ChillButton, ChillModal } from 'chillall';   // tree-shaken - only these ship

ChillAlert.toast({ title: 'Saved!', icon: 'success' });
document.body.append(ChillButton.create({ text: 'Click me', variant: 'primary' }));
```

```js
import ChillAll from 'chillall';                // everything, namespaced
ChillAll.Slider.create({ range: true, value: [20, 70], container: el });
ChillAll.get('calendar');                       // lookup by key / name / global
ChillAll.injectCSS();                           // optional: pre-inject all CSS (no flash of unstyled content)
```

### `<script>` tag (CDN)

```html
<script src="https://unpkg.com/chillall"></script>   <!-- dist/chillall.min.js -->
<script>
  ChillAll.Notify.show({ message: 'Hello', type: 'success' });
  // every component is also available as a global: ChillNotify, ChillTable, ...
</script>
```

### CommonJS

```js
const { ChillAll, ChillAlert } = require('chillall');
```

### Next.js / SSR

Importing is always safe on the server (no `window`/`document` access at load time). Call components from effects or event handlers:

```tsx
'use client';
import { ChillAlert } from 'chillall';
export default function Save() {
  return <button onClick={() => ChillAlert.toast({ title: 'Saved', icon: 'success' })}>Save</button>;
}
```

On the server, dialog helpers resolve to harmless defaults instead of throwing.

## Theming

Use `ChillTheme` to switch and persist the theme; every component follows `<html data-theme>` and the OS setting.

```js
ChillTheme.setTheme('dark');     // 'light' | 'dark' | 'system'
ChillTheme.toggle();
ChillTheme.onChange(t => console.log(t));
```

Avoid a flash on first paint: put `ChillTheme.noFlashScript()` output in `<head>`.
Each component exposes CSS variables (`--chillbutton-primary`, `--chillinput-bg`, ...) you can override on `:root`.

## What is in the box

| Category | Count | Highlights |
|---|---|---|
| Core | 7 | Alert, Form validation, Table, Chart, Date picker, Modal, Notify |
| Form controls | 17 | Button, Input, Select, Dropdown, Checkbox/Radio/Switch, **Slider, Rating, OTP, ColorPicker, TimePicker, NumberInput, TagInput, Autocomplete, Segmented** |
| Navigation | 9 | Navbar, Sidebar, Footer, Breadcrumb, Tabs, Layout, **Stepper, ScrollSpy, Splitter** |
| Feedback & overlays | 18 | Tooltip, Popover, Accordion, Skeleton, EmptyState, Progress, Avatar, Badge, Tag, **Drawer, ContextMenu, Spinner, Callout, Lightbox, Tour, Copy, BackToTop, Confetti** |
| Display | 14 | **Card, Divider, Timeline, Tree, Carousel, Stat, Calendar, Code, Marquee, Countdown, Kbd, Masonry, Reveal, RelTime** |
| Data | 8 | Pagination, Search, Filter, Sort, InfiniteScroll, DragDrop, FileUpload, **VirtualList (100k rows)** |
| Utilities | 15 | Theme, Command palette, Hotkey, Provider, Config, Portal, FocusTrap, ClickOutside, MediaQuery, **Storage, Events, Fetch, Toolkit, Animate, Fullscreen** |

Components share one shape wherever it makes sense: `create(options)` builds DOM, `init(target, options)` enhances existing
DOM, instances expose `on()/off()`, `destroy()` and option callbacks (`onChange`, ...).

## Upgrading from the separate packages / 1.x

Behaviour changes that came with the quality pass:

- **HTML is opt-in.** Strings in titles, content, labels, tab/nav/sidebar/footer content, table cells, chart labels, icons are
  rendered as **text**. Pass `html: true` (or the `*Html` option, e.g. `iconHtml`) to render markup; Element/Node values always work.
  *Exception:* `ChillModal` string `content` stays HTML for backward compatibility - use `text` / `html: false` for untrusted data.
- `ChillClickOutside` listens to `pointerdown` (plus `touchstart`); pass `events: ['click']` for the old behaviour.
- `ChillHotkey`: registering the same shortcut twice keeps both handlers; key repeat is ignored unless `allowRepeat: true`;
  plain-key shortcuts don't fire while typing in inputs unless `allowInInput: true`.
- `ChillCommand`: `mod+k` = Cmd on macOS, Ctrl elsewhere (`shortcut: 'k'` still works). `ChillFooter` column headings are `<h3>`.
- `ChillAlert` 1.2: SSR-safe, accessible dialogs (focus trap, Esc/overlay resolve the promise), `closeAll()` now exists.
- `ChillDropdown` `onSelect(value, el, itemData)` receives a third argument.
- Stacking order: modal 10000 · drawer 10000+ · lightbox 10001 · toast 10002 · popover/context menu 10003 · tooltip 10004 · tour 10005-6 · confetti 10007 · alert 99999.

The old per-component packages (`chillbutton`, `chilltable`, ...) keep working on their own; `chillall` no longer depends on them.

## Develop

```bash
cd tools && npm install
node build.js          # bundle -> chillall/dist (esm, cjs, iife, min, d.ts)
node docs.js           # regenerate COMPONENTS.md
node treeshake.js      # verify tree-shaking + print bundle sizes
node smoke.js --all    # every component loads: SSR, CommonJS, <script>
node audit-theme.js    # dark-mode CSS guard check
node --test --test-force-exit tests/*.test.js
node serve.js          # demo on http://localhost:5188/chillall/demo/
```

Contributing a component: follow [tools/CONVENTIONS.md](../tools/CONVENTIONS.md), add it to `tools/manifest.js`, add a test in `tools/tests/`.

## License

MIT © ChillCode Tech
