import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'fullscreen',
    global: 'ChillFullscreen',
    category: 'utility',
    title: 'Fullscreen',
    summary: 'Fullscreen API wrapper with vendor-prefix fallbacks, change events and a ready-made toggle button.',
    style: 'static',
    description:
        'ChillFullscreen smooths over the Fullscreen API: one promise-based interface (`request`, `exit`, `toggle`) that works with the prefixed variants, ' +
        'never throws when the API is unavailable (the promises resolve `false`) and reports every change, including the user pressing Esc, through `onChange`.\n\n' +
        '`createButton()` builds an accessible toggle button whose icon, `aria-pressed` and `aria-label` stay in sync (it hides itself when fullscreen is unsupported), and `init()` upgrades buttons already in your HTML via `data-chill-fullscreen`. ' +
        'Browsers only allow fullscreen from a user gesture such as a click.',
    features: [
        'Promise-based `request`, `exit` and `toggle` that resolve `false` instead of throwing',
        '`onChange` and `onError` subscriptions, including exits through Esc',
        '`createButton()` with sizes, variants, custom labels and automatic ARIA state',
        '`init()` enhances existing markup using `data-chill-fullscreen="#target"`',
        'Handles WebKit, Mozilla and MS prefixes; `isSupported()` for feature detection',
    ],
    examples: [
        {
            id: 'support-and-state',
            title: 'Support check and live state',
            description: '`isSupported()`, `isFullscreen()` and `element()` describe the current situation. Where the Fullscreen API is unavailable (some embedded browsers and iframes), a fallback message is shown instead.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('div');
out.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.7';
const note = document.createElement('div');
note.style.cssText = 'color:var(--chill-text);font-size:13px';
const paint = () => {
  out.textContent = 'isSupported() -> ' + ChillFullscreen.isSupported() + '\\nisFullscreen() -> ' + ChillFullscreen.isFullscreen() + '\\nelement() -> ' + (ChillFullscreen.element() ? ChillFullscreen.element().tagName.toLowerCase() : 'null');
};
paint();
root.append(out, note);
if (!ChillFullscreen.isSupported()) {
  note.textContent = 'The Fullscreen API is not available in this environment, so the controls below are disabled.';
}
const toggle = ChillButton.create({ text: 'Toggle page fullscreen', size: 'sm', disabled: !ChillFullscreen.isSupported(), onClick: async () => { const ok = await ChillFullscreen.toggle(); note.textContent = 'toggle() resolved ' + ok; paint(); } });
root.append(toggle);
const off = ChillFullscreen.onChange(paint);
cleanup(() => { off(); ChillFullscreen.exit(); });`,
            height: 190,
        },
        {
            id: 'element',
            title: 'Fullscreen a single element',
            description: 'Pass an element (or selector) to `request()` / `toggle()` to expand just that panel. `onChange` receives `{ isFullscreen, element }` for every change, including Esc.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const stage = document.createElement('div');
stage.style.cssText = 'padding:28px;border-radius:12px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff;text-align:center;font-weight:600;font-size:18px';
stage.textContent = 'Quarterly dashboard preview';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding-left:20px;color:var(--chill-text);font-size:13px;min-height:36px';
const supported = ChillFullscreen.isSupported();
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
row.append(
  ChillButton.create({ text: 'request(stage)', size: 'sm', disabled: !supported, onClick: () => ChillFullscreen.request(stage) }),
  ChillButton.create({ text: 'exit()', size: 'sm', variant: 'outline', disabled: !supported, onClick: () => ChillFullscreen.exit() }),
);
root.append(stage, row, log);
if (!supported) log.append(Object.assign(document.createElement('li'), { textContent: 'Fullscreen is not supported here; showing the static preview only.' }));
const off = ChillFullscreen.onChange(({ isFullscreen, element }) => {
  log.prepend(Object.assign(document.createElement('li'), { textContent: 'isFullscreen=' + isFullscreen + ' element=' + (element ? element.tagName.toLowerCase() : 'none') }));
});
const offErr = ChillFullscreen.onError(() => log.prepend(Object.assign(document.createElement('li'), { textContent: 'fullscreen error' })));
cleanup(() => { off(); offErr(); ChillFullscreen.exit(); });`,
            height: 230,
        },
        {
            id: 'create-button',
            title: 'Ready-made toggle button',
            description: '`createButton({ target })` returns `{ element, update(), destroy() }`. The icon swaps and `aria-pressed` / `aria-label` follow the state; when the API is unsupported the button is `hidden` automatically.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const player = document.createElement('div');
player.style.cssText = 'position:relative;height:120px;border-radius:12px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center';
player.textContent = 'Video player';
const bar = document.createElement('div');
bar.style.cssText = 'position:absolute;right:8px;bottom:8px;display:flex;gap:6px';
const sizes = ['sm', 'md', 'lg'].map((size, i) => ChillFullscreen.createButton({ target: player, size, variant: i === 2 ? 'solid' : 'ghost', enterLabel: 'Fullscreen player', exitLabel: 'Leave fullscreen' }));
sizes.forEach((b) => { b.element.style.color = '#fff'; bar.append(b.element); });
player.append(bar);
const note = document.createElement('div');
note.style.cssText = 'color:var(--chill-text);font-size:13px';
note.textContent = ChillFullscreen.isSupported() ? 'Click a button in the player corner.' : 'Fullscreen is not supported here, so the buttons are hidden automatically.';
root.append(player, note);
cleanup(() => { sizes.forEach((b) => b.destroy()); ChillFullscreen.exit(); });`,
            height: 230,
        },
        {
            id: 'init-markup',
            title: 'Enhance existing markup',
            description: '`init(selector)` wires buttons that already exist. The target comes from `data-chill-fullscreen` or `options.target`; a button with visible text keeps its label.',
            code: `root.innerHTML = '<div id="docs-fs-target" style="padding:20px;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);border:1px solid var(--chill-border)">Photo gallery</div>' +
  '<button id="docs-fs-btn" data-chill-fullscreen="#docs-fs-target" style="margin-top:10px;padding:8px 14px;border-radius:8px;border:1px solid var(--chill-border);background:var(--chill-bg-secondary);color:var(--chill-text);cursor:pointer">View gallery fullscreen</button>' +
  '<div id="docs-fs-note" style="margin-top:10px;font-size:13px;color:var(--chill-text)"></div>';
const inst = ChillFullscreen.init('#docs-fs-btn', { enterLabel: 'Enter fullscreen', exitLabel: 'Exit fullscreen' });
const btn = root.querySelector('#docs-fs-btn');
const note = root.querySelector('#docs-fs-note');
note.textContent = ChillFullscreen.isSupported() ? 'aria-pressed = ' + btn.getAttribute('aria-pressed') : 'Fullscreen is not supported here, so the enhanced button is hidden.';
const off = ChillFullscreen.onChange(() => { note.textContent = 'aria-pressed = ' + btn.getAttribute('aria-pressed'); });
cleanup(() => { off(); inst.destroy(); ChillFullscreen.exit(); });`,
            height: 150,
        },
    ],
    guides: [
        {
            title: 'User gesture and error handling',
            body:
                'Browsers reject `requestFullscreen()` unless it is called from a user gesture such as a click or key press, and iframes need `allow="fullscreen"`. ' +
                'ChillFullscreen turns those rejections into `false` results and forwards the error to `onError` subscribers:\n\n' +
                '```js\nconst off = ChillFullscreen.onError((err) => console.warn(\'Fullscreen blocked\', err));\nbutton.onclick = async () => {\n  const ok = await ChillFullscreen.toggle(videoEl);\n  if (!ok) showFallbackLayout();\n};\n```\n\n' +
                '`toggle(el)` exits fullscreen if that element (or one inside it) is the fullscreen element; if an unrelated element is fullscreen it switches to the requested one.',
        },
        {
            title: 'Buttons: createButton vs init',
            body:
                '`createButton(options)` makes the element for you (SVG icons, `aria-pressed`, `aria-label`) and returns `{ element, update(), destroy() }`. Options: `target`, `size` (`sm` / `md` / `lg`), `variant` (`ghost` / `solid`), `enterLabel`, `exitLabel`, `className` and `onChange({ active, isFullscreen, element })`.\n\n' +
                '`init(selectorOrElement, options)` upgrades existing elements and returns `{ update(), destroy() }`. Set the target with `data-chill-fullscreen="#id"` or `options.target`; with no target the whole page is used. ' +
                'Style with `--chillfullscreen-*` variables. Both helpers hide the button (`hidden`) when `isSupported()` is false.',
        },
    ],
    options: [
        { name: 'navigationUI', type: "'auto' | 'show' | 'hide'", default: 'undefined', description: 'request() option passed to the native API.' },
        { name: 'target', type: 'Element | selector', default: 'document.documentElement', description: 'createButton() / init(): element that goes fullscreen.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'createButton(): button size.' },
        { name: 'variant', type: "'ghost' | 'solid'", default: "'ghost'", description: 'createButton(): visual style.' },
        { name: 'enterLabel', type: 'string', default: "'Enter fullscreen'", description: 'Accessible label while not fullscreen (createButton / init).' },
        { name: 'exitLabel', type: 'string', default: "'Exit fullscreen'", description: 'Accessible label while fullscreen (createButton / init).' },
        { name: 'className', type: 'string', default: 'null', description: 'createButton(): extra class names.' },
        { name: 'onChange', type: '({ active, isFullscreen, element }) => void', default: 'null', description: 'createButton / init: called on every fullscreen change.' },
    ],
    methods: [
        { signature: 'ChillFullscreen.isSupported()', on: 'static', description: '`true` when the Fullscreen API (or a prefixed version) is available and enabled.' },
        { signature: 'ChillFullscreen.isFullscreen()', on: 'static', description: '`true` while any element is fullscreen.' },
        { signature: 'ChillFullscreen.element()', on: 'static', description: 'The current fullscreen element or `null`.' },
        { signature: 'ChillFullscreen.request(el?, { navigationUI? })', on: 'static', description: 'Enter fullscreen (default: the `<html>` element). Resolves `true` or `false`.' },
        { signature: 'ChillFullscreen.exit()', on: 'static', description: 'Leave fullscreen. Resolves `true` or `false` (also when not fullscreen).' },
        { signature: 'ChillFullscreen.toggle(el?)', on: 'static', description: 'Enter or exit depending on the current state. Resolves a boolean.' },
        { signature: 'ChillFullscreen.onChange(fn)', on: 'static', description: 'Listen with `fn({ isFullscreen, element })`. Returns an unsubscribe function.' },
        { signature: 'ChillFullscreen.onError(fn)', on: 'static', description: 'Listen for fullscreen errors. Returns an unsubscribe function.' },
        { signature: 'ChillFullscreen.createButton(options)', on: 'static', description: 'Build an accessible toggle button. Returns `{ element, update(), destroy() }`.' },
        { signature: 'ChillFullscreen.init(selectorOrElement, options?)', on: 'static', description: 'Upgrade existing buttons. Returns `{ update(), destroy() }`.' },
        { signature: 'ChillFullscreen.injectCSS()', on: 'static', description: 'Inject the button stylesheet immediately.' },
    ],
    cssVars: [
        { name: '--chillfullscreen-color / --chillfullscreen-bg', description: 'Ghost button text and background.' },
        { name: '--chillfullscreen-hover', description: 'Ghost hover background.' },
        { name: '--chillfullscreen-solid-bg / --chillfullscreen-solid-hover', description: 'Solid variant colours.' },
        { name: '--chillfullscreen-solid-color', description: 'Solid variant text colour.' },
        { name: '--chillfullscreen-ring', description: 'Focus ring colour.' },
    ],
    a11y: [
        'The toggle is a real `<button type="button">` (Enter and Space work) with `aria-pressed` reflecting the state.',
        '`aria-label` switches between `enterLabel` and `exitLabel` (kept as-is for buttons that show visible text).',
        'Icons are `aria-hidden`; the focus ring uses `:focus-visible`. Esc always exits fullscreen natively.',
    ],
    tips: [
        'Fullscreen requires a user gesture, and an iframe needs `allow="fullscreen"`. Failures resolve `false` and notify `onError`.',
        'iOS Safari supports fullscreen only for video elements; check `isSupported()` and provide a fallback layout.',
        'SSR-safe: every method guards for a missing `document`, and promises resolve `false`.',
        'Call `destroy()` on buttons and the `onChange` / `onError` unsubscribers on unmount; the document listeners are removed when idle.',
    ],
    related: ['lightbox', 'modal', 'hotkey', 'events'],
    keywords: ['full screen', 'requestFullscreen', 'video player', 'kiosk', 'presentation', 'maximize'],
};

export default doc;
