import type { Guide } from '../types';

const body = String.raw`
## A complete page with no build step

Save this as index.html and open it. That is the whole setup.

~~~html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ChillAll quick start</title>
  <!-- optional: stop the flash of the wrong theme (see the Theming guide) -->
</head>
<body>
  <main style="max-width: 560px; margin: 48px auto; font-family: system-ui, sans-serif;">
    <h1>Hello ChillAll</h1>
    <div id="rating"></div>
    <p><button id="save">Save</button></p>
  </main>

  <script src="https://unpkg.com/chillall"></script>
  <script>
    ChillRating.create({ value: 4, container: document.getElementById('rating') });

    ChillButton.init('#save', { variant: 'primary' });
    document.getElementById('save').addEventListener('click', function () {
      ChillAlert.toast({ title: 'Saved!', icon: 'success' });
    });
  </script>
</body>
</html>
~~~

The script tag defines a global for every component (ChillRating, ChillButton, ChillAlert ...) and a window.ChillAll namespace. Each component injects its own styles on first use.

## Enhance HTML you already have

Components with init(target, options) upgrade existing markup. This is the fastest way to add behaviour to server-rendered pages (PHP, Rails, Django, WordPress):

~~~live
root.innerHTML =
  '<button class="demo-btn">Primary</button> ' +
  '<button class="demo-btn">Second</button> ' +
  '<button class="demo-btn">Third</button>';
const buttons = ChillButton.init(root.querySelectorAll('.demo-btn'), { variant: 'secondary', size: 'sm' });
cleanup(() => buttons.destroy());
~~~

## Build UI from JavaScript

create() returns a ready element or an instance. Append it wherever you like:

~~~live
const card = ChillCard.create({ title: 'Plain JavaScript', subtitle: 'No framework', body: 'This card was built entirely from a script.', hoverable: true });
root.append(card.element);
cleanup(() => card.destroy());
~~~

## Use data attributes where components support them

Several components wire themselves up from attributes, which keeps your HTML declarative:

~~~html
<button data-chill-copy="npm install chillall">Copy install command</button>
<span data-chill-kbd="mod+k"></span>

<script>
  ChillCopy.init('[data-chill-copy]');
  ChillKbd.init();
</script>
~~~

## Ship only what you use

The CDN bundle contains every component (about 235 KB gzipped). For production pages, prefer npm and import only what you need so a bundler can drop the rest. See [Installation](/docs/guide/installation).

## Next steps

- [Theming](/docs/guide/theming) - dark mode and brand colours.
- [Login form recipe](/docs/guide/recipe-login-form).
- The [component pages](/docs) have live, editable examples for everything.
`.replace(/^~~~/gm, '```');

const guide: Guide = {
    id: 'vanilla',
    title: 'Plain HTML / CDN',
    summary: 'Use ChillAll from a single script tag: enhance existing markup, build UI in JavaScript, no bundler.',
    group: 'Getting started',
    body,
};

export default guide;
