# ChillLib conventions

Every component is a zero-dependency, framework-agnostic vanilla JS file. All of them end up inside the single
`chillall` bundle (built by `tools/build.js`), so they must coexist in one page.

## File layout (one folder per component, lowercase)

```
chill<name>/
  src/chill<name>.js        <- the only file you edit
  dist/chill<name>.js       <- byte-identical copy of src (generated, git-ignored: node tools/sync.js chill<name>)
  package.json              <- copy chillbutton/package.json, change name/description/keywords/repo
```

New components also need an entry in the right category of `tools/manifest.js`, so they are included in the `chillall` bundle and the generated catalog.

## Source template (follow `chillbutton/src/chillbutton.js` for style)

```js
(function (window) {
    'use strict';
    const VERSION = '1.0.0';
    // ... CSS string injected once into <style id="chill<name>-styles"> (lazy, inside injectCSS(), NOT at load time)
    const ChillXxx = { version: VERSION, init(...), create(...), destroy(...), injectCSS };
    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillXxx; }
    else { window.ChillXxx = ChillXxx; }
})(typeof window !== 'undefined' ? window : this);
```

Global name = `Chill` + PascalCase (ChillEmptyState, ChillInfiniteScroll …). The last line MUST contain
`window.ChillXxx =` literally (tools grep for it).

## Hard rules

1. **SSR/import safe** – touching `window`, `document`, `localStorage`, `matchMedia` at *load time* is forbidden
   (Next.js imports the file on the server). Only touch them inside functions called by the user.
   Test: `node tools/smoke.js chill<name>` must pass.
2. **No XSS by default** – user-supplied strings go through `textContent` / `setAttribute`. HTML is only
   accepted through an explicit `html: true` option or `*Html` option name, and documented in the JSDoc.
3. **Dark mode** – define colours as CSS variables on `:root` with prefix `--chill<name>-*`, then override for
   BOTH `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not(.light) {…} }` AND
   `:root[data-theme="dark"], :root.dark {…}` (ChillTheme sets `data-theme` + class on `<html>`; a toggle must work).
4. **Accessibility** – correct roles/ARIA, full keyboard support (Tab/Enter/Space/Esc/Arrows where idiomatic),
   visible `:focus-visible` ring, `@media (prefers-reduced-motion: reduce)` disables animation, hit targets ≥ 32px.
5. **Lifecycle** – every instance returns an object with `destroy()` that removes DOM, listeners, observers, timers.
   Support `init(selectorOrElement, options)` for enhancing existing DOM and/or `create(options)` for building DOM,
   whichever fits. Instances expose `on(event, fn)` / options callbacks (`onChange`, …) where state changes.
6. **Namespacing** – all CSS classes `chill<name>-…`; nothing leaks globally (no bare `button {}` selectors).
   `z-index` for overlays: use ≥ 10000 and pick a sensible stacking relative to chillmodal (modal 10000, toast 10002).
7. **Polish** – real design, not a skeleton: spacing/typography/shadows consistent with `chillbutton`
   (radius 8px, font-size 14px, blue #3b82f6 primary, neutral greys, system font stack inherited from the page),
   smooth 150–200ms transitions, sizes `sm|md|lg` and variants where it makes sense.
8. **No external requests, no dependencies, no build step for the source** – plain ES2018, runs unmodified in a browser.
9. Source should stay readable: JSDoc header with a short usage example, option table in comments.

## Tests (required for new components, encouraged for audited ones)

Put behavioural tests in `tools/tests/<name>.test.js`, using Node's built-in runner (`node --test`) and the helper:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
test('chillxxx creates DOM and destroys cleanly', () => {
    const { lib, document } = load('chillxxx');
    const inst = lib.create({ /* … */ });
    document.body.appendChild(inst.element);
    assert.ok(document.querySelector('.chillxxx'));
    inst.destroy();
    assert.equal(document.querySelector('.chillxxx'), null);
});
```

Run with `node --test tools/tests/<name>.test.js` and `node tools/smoke.js chill<name>`.
jsdom does not do layout – test logic/DOM/ARIA/events, not pixel positions.

## Checklist before opening a pull request

1. `cd tools && npm install` (esbuild and jsdom, dev tooling only).
2. `node smoke.js chill<name>` and `node --test tools/tests/chill<name>.test.js` pass.
3. `node audit-theme.js` passes (every `prefers-color-scheme: dark` block respects an explicit light theme).
4. `node build.js` succeeds and `node treeshake.js` still reports a small single-component import.
5. `node docs.js` regenerates `chillall/COMPONENTS.md`; commit the result.

Generated output (`chillall/dist`, `chillall/src`, each component's `dist/`) is git-ignored: never commit it.
