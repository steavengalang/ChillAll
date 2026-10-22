# Writing a guide / tutorial (read this first)

One file per guide: `src/docs/guides/<id>.ts`, `export default guide` of type `Guide` (`src/docs/types.ts`):

```ts
import type { Guide } from '../types';
const guide: Guide = { id: 'theming', title: 'Theming & dark mode', summary: '<= 140 chars', group: 'Guides', body: `...markdown-lite...` };
export default guide;
```
(Use a template literal for `body`; escape backticks inside it as \` and `${` as \${ - or avoid them. Triple-backtick fences inside a
template literal must be written as \`\`\` . Easiest: build the body from an array of strings joined with '\n' using normal quotes.)

## Markdown-lite (the site renderer supports exactly this)
- `# ` is NOT allowed (the page title is the h1). Use `## Section` and `### Subsection` headings (they feed the on-page table of contents).
- paragraphs separated by blank lines; `**bold**`, `*italic*`, `` `code` ``, `[text](https://url)` and `[text](/docs/button)` (internal links)
- lists: lines starting with `- ` (bullets) or `1. ` (numbered)
- callouts: lines starting with `> ` (tip/note box). Start with `> **Tip:**`, `> **Note:**` or `> **Warning:**`.
- code: ```` ```js ````, ```` ```ts ````, ```` ```tsx ````, ```` ```html ````, ```` ```css ````, ```` ```bash ```` fences (display only)
- **live examples**: a fence tagged ```` ```live ```` is shown as an editable, runnable demo. Same sandbox as component examples:
  every `ChillX` global + `ChillAll`, `root` (preview div), `cleanup(fn)`, `window`, `document`; top-level `await` allowed; no import/export.
  Use 1-4 live blocks per guide where they truly teach; the verifier runs them against the real bundle.

## Rules
- Only claim what the code does: read the component sources (`../chill<id>/src/chill<id>.js`), their tests in
  `../tools/tests/`, and the finished reference docs in `src/docs/content/**/*.ts`.
- A tutorial is complete: goal -> prerequisites -> step by step with code -> result -> where to go next (link to component docs).
- `body` >= 600 chars (real tutorials are 3-8k). English. Friendly, direct, no filler.
- Helper markup inside live blocks must work in light and dark: use `var(--chill-text)`, `var(--chill-border)`, `var(--chill-bg-secondary)`.

## Verify (from the `Chillcode_Tech` folder)
```
node scripts/verify-guides.mjs <id> [<id> ...]
```
Fix everything it prints. After adding or removing a guide run `node scripts/gen-docs-index.mjs`.
