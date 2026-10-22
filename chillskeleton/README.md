# chillskeleton

Zero-dependency skeleton loading component

Part of **[ChillAll](https://github.com/steavengalang/ChillAll)**: 88 zero-dependency UI components (accessible, dark-mode ready, SSR-safe to import). chillskeleton is the standalone build of one of them; the `chillall` package contains all of them and is tree-shakeable.

## Install

```bash
npm install chillskeleton
```

## Use

```js
import ChillSkeleton from 'chillskeleton';          // or: const ChillSkeleton = require('chillskeleton');

// see the options and methods in the source header: src/chillskeleton.js
```

No bundler? Load the file and use the global:

```html
<script src="https://cdn.jsdelivr.net/npm/chillskeleton@1.1.0/dist/chillskeleton.js"></script>
<script>console.log(ChillSkeleton.version);</script>
```

## Why ChillAll components

- Zero dependencies, nothing to import for styles (CSS is injected on first use)
- Accessible: ARIA roles, keyboard support, focus management, reduced-motion
- Dark mode via `<html data-theme="dark">` (see `chilltheme`) or the OS setting
- Safe by default: text is rendered as text, HTML is an explicit opt-in
- Every instance has `destroy()`

## License

MIT, see the [repository](https://github.com/steavengalang/ChillAll).
