# chilltextarea

Zero-dependency textarea component with auto-resize

Part of **[ChillAll](https://github.com/steavengalang/ChillAll)**: 88 zero-dependency UI components (accessible, dark-mode ready, SSR-safe to import). chilltextarea is the standalone build of one of them; the `chillall` package contains all of them and is tree-shakeable.

## Install

```bash
npm install chilltextarea
```

## Use

```js
import ChillTextarea from 'chilltextarea';          // or: const ChillTextarea = require('chilltextarea');

// see the options and methods in the source header: src/chilltextarea.js
```

No bundler? Load the file and use the global:

```html
<script src="https://cdn.jsdelivr.net/npm/chilltextarea@1.1.0/dist/chilltextarea.js"></script>
<script>console.log(ChillTextarea.version);</script>
```

## Why ChillAll components

- Zero dependencies, nothing to import for styles (CSS is injected on first use)
- Accessible: ARIA roles, keyboard support, focus management, reduced-motion
- Dark mode via `<html data-theme="dark">` (see `chilltheme`) or the OS setting
- Safe by default: text is rendered as text, HTML is an explicit opt-in
- Every instance has `destroy()`

## License

MIT, see the [repository](https://github.com/steavengalang/ChillAll).
