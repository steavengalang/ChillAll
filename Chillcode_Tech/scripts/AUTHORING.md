# Writing a component doc (read this first)

One file per component: `src/docs/content/<category>/<id>.ts`, `export default doc` of type `DocEntry`
(`src/docs/types.ts`). **Copy the structure, depth and tone of `src/docs/content/formControls/button.ts`.**

## Source of truth
- The component source: `../chill<id>/src/chill<id>.js` (the header JSDoc lists options/defaults; skim the code for
  anything the header omits - events, helpers, ARIA). Root `chillalert` lives at `../src/chillalert.js`.
- Test files `../tools/tests/chill<id>.test.js` show real working call patterns.
- Document ONLY what the code really does. Never invent options. Defaults must match the code.

## Required content (the verifier enforces most of it)
- `summary` <= 110 chars, `description` 1-3 paragraphs (markdown-lite: `code`, **bold**, *italic*, [links](url), `- ` lists, blank-line paragraphs)
- `features`: 3-6 bullets
- `examples`: **>= 3** (aim for 4-6), simple -> realistic. Each has `id` (lowercase-kebab), `title`, 1-2 sentence `description`, and `code`.
  - `code` is plain browser JS. In scope: every component by global name (`ChillButton`, `ChillModal`, ...), `ChillAll`, `root`
    (the preview div), `cleanup(fn)`, `window`, `document`. Top-level `await` is allowed. NO `import`/`export`/`require`/TypeScript.
  - Render into `root` (use `container: root` / `root.append(...)` / `Lib.init(el, opts)` on elements you add to `root`).
    Check the component's source for how it mounts (`create` returns an element or an instance with `.element`; some need `container`/`parent`).
  - Register teardown: `cleanup(() => inst.destroy())`. Examples run again on "Run" and when you leave the page.
  - Use `height` (px) when the demo needs room (dropdowns, calendars, popovers). Use `manual: true` for examples that only open global
    overlays (modal, alert, drawer, lightbox, tour, confetti...) - then include a button in `root` that triggers it so the reader can click.
  - Make examples visual and pleasant (real-looking labels/data, not "foo/bar"), and keep each under ~35 lines.
  - Examples must work in both light and dark themes: use `var(--chill-text)`, `var(--chill-border)`, `var(--chill-bg-secondary)` for any
    helper markup you add around the component (the docs site defines them). Avoid hard-coded colours for text/background.
- `guides`: >= 1 tutorial block (title + markdown-lite body). Explain concepts the reader needs: create vs init, async data, validation
  flow, styling with CSS variables, SSR/React usage, patterns. Fenced code blocks (```js) are allowed inside `body`.
- `options`: complete table (name, type, default, description), including per-item shapes like `items[].label` and callbacks.
- `methods`: static methods (`on: 'static'`, signature starts with the Global e.g. `ChillX.create(options)` - verified to exist!) and
  instance methods/properties. `events` if the component has `on(event, fn)`.
- `cssVars` if the source defines `--chill<id>-*` variables (list the main 3-6).
- `a11y`: keyboard map + ARIA roles, one line each.
- `tips`: SSR/React/Vue notes, gotchas, performance.
- `related`: ids of related components. `keywords`: search aliases.
- Mention security defaults where relevant (text vs `html: true`).

## Verify (run from the `Chillcode_Tech` folder)
```
node scripts/verify-docs.mjs <id> [<id> ...]
```
It compiles only the ids you pass, runs every example in jsdom against the real bundle and checks the structure. Fix everything it prints.
When you add or remove a doc file, regenerate the indexes with `node scripts/gen-docs-index.mjs` (needs `npm install` in `../tools`).

## Quality bar
Docs should read like Stripe/Radix docs: concise, concrete, no filler. Prefer showing over telling. English only.
Do not paste the whole option list into prose - tables are for that. The examples are the hero: they should make a visitor think
"I want to use this".
