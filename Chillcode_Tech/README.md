# ChillAll docs site

The documentation and landing site for **ChillAll** (88 zero-dependency UI components). Vite + React + TypeScript.

Every component page has **live, editable examples that run the real library** (the vendored `chillall` bundle), plus
options/methods tables, accessibility notes and tutorials. Press `Ctrl/Cmd + K` anywhere in the docs to search.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Deploy to Vercel

The site is self-contained (the library bundle is committed in `src/lib/vendor/`), so you can deploy this folder on its own.

1. Push this folder to a Git repo (or import the monorepo and set **Root Directory** to `Chillcode_Tech`).
2. In Vercel: **Add New -> Project**, pick the repo. Vercel detects Vite automatically.
   - Framework preset: **Vite** · Build command: `npm run build` · Output directory: `dist` (all pre-filled by `vercel.json`).
3. Deploy. `vercel.json` already contains the SPA rewrite (deep links like `/docs/slider` work on refresh) and long-term caching for `/assets/*`.

CLI alternative: `npx vercel` (preview) / `npx vercel --prod`.

## Project layout

```
src/
  pages/HomePage.tsx          landing page (Hero, live Showcase, Components, Features)
  components/                 landing sections
  docs/
    content/<category>/<id>.ts  one doc per component (data, not JSX)   <- edit these
    guides/<id>.ts              tutorials and recipes (markdown-lite)    <- edit these
    ComponentPage.tsx, GuidePage.tsx, DocsHome.tsx, Sidebar.tsx, SearchPalette.tsx, LiveExample.tsx, Markdown.tsx ...
    nav.generated.ts, content/loaders.ts, guides/loaders.ts   GENERATED indexes (see below)
  lib/vendor/chillall.esm.js  the vendored ChillAll bundle + types (updated by `npm run sync:chillall`)
scripts/
  sync-chillall.mjs   copy ../chillall/dist into src/lib/vendor
  gen-docs-index.mjs  regenerate the indexes after adding/removing a doc or guide
  verify-docs.mjs     run EVERY component example in jsdom against the bundle + structure checks
  verify-guides.mjs   same for the ```live blocks in guides
  AUTHORING.md / AUTHORING-GUIDES.md   how to write docs and guides
```

Each component page is its own code-split chunk (~10-15 KB); the 1 MB library bundle is loaded once, lazily, the first
time a live example needs it.

## Workflow: update the library, then the docs

```bash
# 1. in the monorepo root
node tools/build.js                     # rebuild chillall/dist
# 2. here
npm run sync:chillall                   # vendor the new bundle
npm run gen:docs                        # only if you added/removed docs or guides (needs ../tools/node_modules)
npm run verify:docs                     # runs all examples against the bundle - must print "docs OK" and "guides OK"
npm run build
```

`gen:docs`, `verify:docs` use `esbuild` and `jsdom` from `../tools/node_modules` (run `npm install` in `../tools` once).
They are development tools; the Vercel build does not need them because the generated files are committed.

## Writing docs

- A component doc is a typed object (`src/docs/types.ts`). Copy `content/formControls/button.ts` as the reference.
- Examples are plain browser JS with every component in scope plus `root` and `cleanup(fn)`.
  `verify:docs` fails the build of your PR if an example throws or documents a method that does not exist.
- Guides use "markdown-lite" and may contain ```` ```live ```` blocks, which render as runnable demos.

## Theming of the site

The site follows the same contract as the library: `<html data-theme="dark|light">` plus a `dark`/`light` class.
`index.html` applies the saved theme before first paint (no flash); the toggle lives in the sidebar and landing navbar.
