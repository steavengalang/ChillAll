# chillnotify

Zero-dependency notification/toast library with progress bar and dark/light mode support. Framework-agnostic.

Part of **[ChillAll](https://github.com/steavengalang/ChillAll)**: 88 zero-dependency UI components (accessible, dark-mode ready, SSR-safe to import). chillnotify is the standalone build of one of them; the `chillall` package contains all of them and is tree-shakeable.

## Install

```bash
npm install chillnotify
```

## Use

```js
import ChillNotify from 'chillnotify';          // or: const ChillNotify = require('chillnotify');

// see the options and methods in the source header: src/chillnotify.js
```

No bundler? Load the file and use the global:

```html
<script src="https://cdn.jsdelivr.net/npm/chillnotify@1.1.0/dist/chillnotify.js"></script>
<script>console.log(ChillNotify.version);</script>
```

## Why ChillAll components

- Zero dependencies, nothing to import for styles (CSS is injected on first use)
- Accessible: ARIA roles, keyboard support, focus management, reduced-motion
- Dark mode via `<html data-theme="dark">` (see `chilltheme`) or the OS setting
- Safe by default: text is rendered as text, HTML is an explicit opt-in
- Every instance has `destroy()`

## License

MIT, see the [repository](https://github.com/steavengalang/ChillAll).
