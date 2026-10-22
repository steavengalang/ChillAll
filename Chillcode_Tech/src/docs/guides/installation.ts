import type { Guide } from '../types';

const body = String.raw`
## Requirements

ChillAll runs in any modern browser and in any bundler. There is nothing else to install: **no runtime dependencies, no peer dependencies, no CSS file to import.** Components inject their own styles the first time you use them.

## Install with npm

~~~bash
npm install chillall
# or
pnpm add chillall
yarn add chillall
~~~

Then import only what you use:

~~~js
import { ChillAlert, ChillButton, ChillModal } from 'chillall';

ChillAlert.toast({ title: 'Hello from ChillAll', icon: 'success' });
document.body.append(ChillButton.create({ text: 'Click me' }));
~~~

Because every component is a separate export, bundlers such as Vite, webpack, Rollup and esbuild remove the ones you do not import. That is what keeps a single component small.

- **ChillButton only:** 14 KB minified, 3.8 KB gzipped
- **ChillAlert only:** 22 KB minified, 5.7 KB gzipped
- **ChillButton + ChillModal:** 28 KB minified, 7.0 KB gzipped
- **Everything (default export):** about 1 MB minified, about 235 KB gzipped

> **Tip:** Import named components for apps. Use the default export (the whole library) only for prototypes, playgrounds and documentation sites like this one.

## The namespace import

If you prefer one object, use the default export. It carries every component under a short key and a few helpers:

~~~js
import ChillAll from 'chillall';

ChillAll.Slider.create({ range: true, value: [20, 70], container: el });
ChillAll.get('calendar');   // look up by key, lowercase name or global name
ChillAll.injectCSS();       // optional: inject every stylesheet up front
~~~

## Use it from a CDN (no build step)

Add one script tag. Every component becomes a global, and everything is also on window.ChillAll.

~~~html
<script src="https://unpkg.com/chillall"></script>
<script>
  ChillNotify.show({ title: 'It works', message: 'No bundler needed', type: 'success' });
  // same thing: ChillAll.Notify.show(...)
</script>
~~~

The package serves the minified IIFE build by default. You can also pin a version, for example unpkg.com/chillall@2.0.0.

## CommonJS

~~~js
const { ChillAll, ChillAlert } = require('chillall');
~~~

## TypeScript

Type definitions are generated and included, so there is nothing extra to install. Component options are typed loosely (ChillOptions is a plain record) while the public methods are declared on every component. Window globals are declared too, so the CDN build autocompletes.

~~~ts
import { ChillSlider, type ChillOptions } from 'chillall';

const options: ChillOptions = { range: true, value: [20, 70] };
const slider = ChillSlider.create({ ...options, container: document.body });
~~~

## Server-side rendering

Importing chillall is **always safe on the server**: no file touches window or document while it loads. Create components in the browser, for example inside an effect or an event handler. The [Next.js guide](/docs/guide/nextjs) shows the patterns.

## Verify the install

Run this snippet. If you see a green toast and the version number, everything is wired up.

~~~live
const version = ChillAll.version;
ChillAlert.toast({ title: 'ChillAll ' + version + ' is running', icon: 'success' });
root.textContent = 'ChillAll v' + version + ' - ' + ChillAll.totalLibraries + ' components loaded';
~~~

## Next steps

- [React](/docs/guide/react), [Vue](/docs/guide/vue), [Next.js](/docs/guide/nextjs) and [plain HTML](/docs/guide/vanilla) guides.
- [Theming and dark mode](/docs/guide/theming).
- [Upgrading from the separate packages](/docs/guide/migration) if you used chillalert, chilltable and friends before.
`.replace(/^~~~/gm, '```');

const guide: Guide = {
    id: 'installation',
    title: 'Installation',
    summary: 'Install with npm or a script tag, import only what you need, and check bundle sizes and TypeScript support.',
    group: 'Getting started',
    body,
};

export default guide;
