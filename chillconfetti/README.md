# chillconfetti

Tiny zero-dependency canvas confetti burst

Part of **[ChillAll](https://github.com/steavengalang/ChillAll)**: 88 zero-dependency UI components (accessible, dark-mode ready, SSR-safe to import). chillconfetti is the standalone build of one of them; the `chillall` package contains all of them and is tree-shakeable.

## Install

```bash
npm install chillconfetti
```

## Use

```js
import ChillConfetti from 'chillconfetti';          // or: const ChillConfetti = require('chillconfetti');

// see the options and methods in the source header: src/chillconfetti.js
```

No bundler? Load the file and use the global:

```html
<script src="https://cdn.jsdelivr.net/npm/chillconfetti@1.0.0/dist/chillconfetti.js"></script>
<script>console.log(ChillConfetti.version);</script>
```

## Why ChillAll components

- Zero dependencies, nothing to import for styles (CSS is injected on first use)
- Accessible: ARIA roles, keyboard support, focus management, reduced-motion
- Dark mode via `<html data-theme="dark">` (see `chilltheme`) or the OS setting
- Safe by default: text is rendered as text, HTML is an explicit opt-in
- Every instance has `destroy()`

## License

MIT, see the [repository](https://github.com/steavengalang/ChillAll).
