import type { Guide } from '../types';

const guide: Guide = {
    id: 'theming',
    title: 'Theming & dark mode',
    summary: 'Switch light, dark and system themes with ChillTheme, avoid the first-paint flash, and build a custom brand theme with CSS variables.',
    group: 'Guides',
    body: `Every ChillAll component ships light and dark styles and re-skins itself when the page theme changes. In this guide you will wire up a theme switcher, remove the flash of the wrong theme on page load, and override CSS variables to build your own brand look.

**What you need:** the \`chillall\` package (or the script tag build). \`ChillTheme\` is part of it and initialises itself on load.

## How components know which theme to use

\`ChillTheme\` keeps two values:

- the **setting**, what the visitor chose: \`'light'\`, \`'dark'\` or \`'system'\`
- the **resolved theme**, always \`'light'\` or \`'dark'\`. With \`system\` it follows the operating system live.

The resolved theme is written to the \`<html>\` element as an attribute and a class:

\`\`\`html
<html class="dark" data-theme="dark">
\`\`\`

Each component injects CSS with three layers, and you can rely on this contract for your own styles too:

\`\`\`css
:root { --chillbutton-bg: #ffffff; --chillbutton-text: #171717; }

/* 1. No ChillTheme needed: follow the OS unless the page forces light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) { --chillbutton-bg: #171717; --chillbutton-text: #fafafa; }
}

/* 2. Forced dark via attribute or class */
:root[data-theme="dark"], :root.dark { --chillbutton-bg: #171717; --chillbutton-text: #fafafa; }
\`\`\`

So even without any JavaScript the components respect the visitor's OS setting, and \`data-theme="light"\` or \`class="light"\` on \`<html>\` forces light mode against a dark OS. \`ChillTheme\` simply manages those hooks for you, adds persistence, and notifies listeners. \`ChillChart\` also listens for the change and redraws its canvas.

## Step 1: switch themes from code

\`\`\`js
import { ChillTheme } from 'chillall';

ChillTheme.setTheme('dark');            // 'light' | 'dark' | 'system'; returns false for anything else
ChillTheme.toggle();                    // light <-> dark, returns the new resolved theme
ChillTheme.cycle();                     // light -> dark -> system -> light, returns the new setting
ChillTheme.getTheme();                  // the setting, e.g. 'system'
ChillTheme.getResolvedTheme();          // 'light' or 'dark'
ChillTheme.isDark();

const off = ChillTheme.onChange((resolved, setting) => console.log(resolved, setting));
off();                                  // unsubscribe
\`\`\`

The setting is saved in \`localStorage\` under the key \`chill-theme\` and synced between browser tabs. Pass \`{ persist: false }\` as the second argument of \`setTheme()\` for a temporary change that must not overwrite the visitor's saved choice.

Try it. The demo below uses \`persist: false\` and restores your original theme when it is removed:

\`\`\`live
const prev = ChillTheme.getTheme();
root.style.cssText += ';display:flex;flex-direction:column;gap:12px';

const status = document.createElement('div');
status.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.7';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, status);

const buttons = {};
const render = () => {
  status.textContent = 'setting: ' + ChillTheme.getTheme() + '  |  resolved: ' + ChillTheme.getResolvedTheme();
  Object.keys(buttons).forEach((k) => buttons[k].setAttribute('aria-pressed', String(k === ChillTheme.getTheme())));
};

['light', 'dark', 'system'].forEach((t) => {
  const b = ChillButton.create({ text: t, variant: 'outline', size: 'sm', onClick: () => ChillTheme.setTheme(t, { persist: false }) });
  buttons[t] = b;
  row.append(b);
});
row.append(ChillButton.create({ text: 'toggle()', size: 'sm', onClick: () => ChillTheme.toggle() }));

render();
const off = ChillTheme.onChange(render);
cleanup(() => { off(); ChillTheme.setTheme(prev, { persist: false }); });
\`\`\`

> **Tip:** build your switcher from real \`<button>\` elements and reflect the active choice with \`aria-pressed\`, as above. Offer \`system\`: it honours an accessibility preference the visitor already set.

## Step 2: avoid the flash on first load

JavaScript runs after the first paint, so a dark-mode visitor can see a white flash. Fix it with a tiny synchronous script in \`<head>\`, placed before your stylesheets:

\`\`\`js
// build step or server template: print this into <head>
const html = ChillTheme.noFlashScript({ tag: true });
// or with your own storage key and default:
ChillTheme.noFlashScript({ storageKey: 'my-app-theme', defaultTheme: 'dark', tag: true });
\`\`\`

\`\`\`html
<head>
  <script>(function(){try{var d=document.documentElement,s=null,t;...})();</script>
  <link rel="stylesheet" href="/app.css">
</head>
\`\`\`

If you changed the storage key with \`ChillTheme.init({ storageKey: 'my-app-theme', defaultTheme: 'system' })\`, pass the same \`storageKey\` and \`defaultTheme\` to \`noFlashScript()\`, otherwise the script and the library read different values. On the server, importing \`chillall\` is safe (nothing touches \`window\` at load), so you can call \`noFlashScript()\` while rendering your HTML shell.

## Step 3: override CSS variables

Every component exposes variables named \`--chill<component>-<token>\`. A few you will use most:

- Button: \`--chillbutton-primary\`, \`--chillbutton-primary-hover\`, \`--chillbutton-danger\`, \`--chillbutton-bg\`, \`--chillbutton-text\`, \`--chillbutton-border\`
- Input: \`--chillinput-bg\`, \`--chillinput-text\`, \`--chillinput-border\`, \`--chillinput-border-focus\`, \`--chillinput-border-error\`
- Table \`--chilltable-primary\`, \`--chilltable-stripe\`; Modal \`--chillmodal-bg\`; Tabs \`--chilltabs-indicator\`

The authoritative list for each component is on its docs page (CSS variables section).

> **Warning:** component styles are injected into \`<head>\` the first time a component is used, so they come *after* your stylesheet. A plain \`:root { --chillbutton-primary: ... }\` at equal specificity can lose. Either scope the override to a container (always wins, because the value is inherited from the nearest ancestor), or raise specificity with \`html:root\`.

\`\`\`css
/* global brand colour */
html:root {
  --chillbutton-primary: #7c3aed;
  --chillbutton-primary-hover: #6d28d9;
  --chillinput-border-focus: #7c3aed;
}

/* dark-mode values need one more level of specificity than the library's own dark rule */
html:root[data-theme="dark"], html:root.dark {
  --chillbutton-primary: #a78bfa;
  --chillbutton-primary-hover: #8b5cf6;
}

/* or only inside one area of the page */
.checkout { --chillbutton-primary: #059669; --chillbutton-primary-hover: #047857; }
\`\`\`

## Step 4: a custom brand theme, live

Scoping variables to a container is the easiest way to preview a brand. This demo sets the variables on a wrapper element from a colour picker; the button and input inside it follow immediately. Toggle your page theme while it is open to see that the components keep their dark-mode surfaces while using your accent.

\`\`\`live
root.style.cssText += ';display:flex;flex-direction:column;gap:14px';

const brand = document.createElement('div');
brand.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--chill-border);border-radius:12px;background:var(--chill-bg-secondary)';

const picker = document.createElement('input');
picker.type = 'color';
picker.value = '#7c3aed';
picker.setAttribute('aria-label', 'Brand colour');

const pickerRow = document.createElement('label');
pickerRow.style.cssText = 'display:flex;align-items:center;gap:10px;color:var(--chill-text);font-size:14px';
pickerRow.append(picker, 'Brand colour');

const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amount));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('');
};
const apply = () => {
  brand.style.setProperty('--chillbutton-primary', picker.value);
  brand.style.setProperty('--chillbutton-primary-hover', shade(picker.value, -24));
  brand.style.setProperty('--chillinput-border-focus', picker.value);
};
picker.addEventListener('input', apply);
apply();

const email = ChillInput.create({ label: 'Email', type: 'email', placeholder: 'you@example.com', helper: 'Focus me: the ring uses the brand colour' });
const actions = document.createElement('div');
actions.style.cssText = 'display:flex;gap:8px';
actions.append(
  ChillButton.create({ text: 'Subscribe' }),
  ChillButton.create({ text: 'Outline', variant: 'outline' }),
  ChillButton.create({ text: 'Delete', variant: 'danger' })
);

brand.append(pickerRow, email, actions);
root.append(brand);
cleanup(() => { picker.removeEventListener('input', apply); email.destroy && email.destroy(); });
\`\`\`

Notice that \`variant: 'danger'\` keeps its own colour: variables are per token, so you only change what you name. To theme the whole library, collect your overrides in one block (like the global example in step 3) and load it once.

## Result and checklist

- \`ChillTheme.setTheme()\` / \`toggle()\` / \`cycle()\` switch the whole page; \`onChange()\` lets your own code react.
- \`noFlashScript()\` in \`<head>\` removes the first-paint flash (use the same storage key as \`init()\`).
- Brand colours come from \`--chill<component>-*\` variables, scoped to a container or raised with \`html:root\`.
- Always test both themes, and the \`system\` setting with your OS in each mode. Contrast is your responsibility for custom colours.

## Next steps

- [Theme component reference](/docs/theme) for every method and the \`init()\` options
- [Accessibility](/docs/guide/accessibility) for reduced motion, focus rings and keyboard behaviour
- [Button](/docs/button) and [Input](/docs/input) for their full variable lists
`,
};

export default guide;
