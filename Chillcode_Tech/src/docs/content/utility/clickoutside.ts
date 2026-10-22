import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'clickoutside',
    global: 'ChillClickOutside',
    category: 'utility',
    title: 'Click Outside',
    summary: 'Run a callback when the user clicks, taps or presses Escape outside an element.',
    style: 'static',
    description:
        'ChillClickOutside is the building block for dropdowns, popovers, menus and inline editors that should close when the user interacts elsewhere. ' +
        'Register one or more elements (or selectors) with a callback, and it fires for every pointer interaction outside them.\n\n' +
        'It listens in the capture phase so it works even if children call `stopPropagation()`, uses a single `pointerdown` per tap (no double firing on touch), ' +
        'resolves selectors lazily so re-rendered markup keeps working, supports Shadow DOM, and ignores targets that the click itself removed from the page.',
    features: [
        'One document listener shared by all registrations, attached lazily and removed with the last one',
        '`ignore` list for toggle buttons and other "inside" elements, accepting elements or selectors',
        'Optional Escape key support, `once` mode and an enable / disable switch per registration',
        'Single `pointerdown` by default, configurable `events` and capture phase',
        'Safe on the server: registering is a no-op without a document',
    ],
    examples: [
        {
            id: 'dropdown',
            title: 'Close a dropdown on outside click',
            description: 'The button toggles the menu, so it is listed in `ignore`. Without that, the outside-click handler would close the menu just before the button reopens it. Escape works too.',
            height: 190,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:6px;align-items:flex-start';
const btn = ChillButton.create({ text: 'Account menu', variant: 'outline' });
const menu = document.createElement('div');
menu.setAttribute('role', 'menu');
menu.style.cssText = 'display:none;flex-direction:column;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);padding:4px;min-width:170px;color:var(--chill-text)';
['Profile', 'Billing', 'Sign out'].forEach((t) => {
  const item = document.createElement('div');
  item.setAttribute('role', 'menuitem');
  item.textContent = t;
  item.style.cssText = 'padding:6px 10px;border-radius:6px;cursor:pointer';
  menu.append(item);
});
root.append(btn, menu);

const setOpen = (open) => { menu.style.display = open ? 'flex' : 'none'; btn.setAttribute('aria-expanded', String(open)); };
btn.addEventListener('click', () => setOpen(menu.style.display === 'none'));
const off = ChillClickOutside.register(menu, () => setOpen(false), { ignore: [btn], escape: true });
cleanup(off);`,
        },
        {
            id: 'counter',
            title: 'Inside vs outside',
            description: 'Two zones are tracked together: the highlighted box and a second element passed through `ignore`. The log only grows for clicks anywhere else on the page.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const zone = document.createElement('div');
zone.textContent = 'Click inside: nothing happens';
zone.style.cssText = 'padding:20px;border:2px solid #3b82f6;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);text-align:center';
const safe = document.createElement('div');
safe.textContent = 'This is in the ignore list too';
safe.style.cssText = 'padding:10px;border:2px dashed var(--chill-border);border-radius:12px;color:var(--chill-text);text-align:center;font-size:13px';
const count = document.createElement('div');
count.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px';
let n = 0;
count.textContent = 'Outside events: 0';
root.append(zone, safe, count);

const off = ChillClickOutside.register(zone, (e) => { n++; count.textContent = 'Outside events: ' + n + ' (' + e.type + ')'; }, { ignore: safe });
cleanup(off);`,
            height: 200,
        },
        {
            id: 'once-enable',
            title: 'once and setEnabled',
            description: 'The returned function unregisters. It also carries `.id` and `.setEnabled(bool)`. A `once` registration removes itself after the first outside event.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const target = document.createElement('div');
target.textContent = 'Watched element';
target.style.cssText = 'padding:16px;border:2px solid #22c55e;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);text-align:center';
const log = document.createElement('div');
log.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.6';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(target, row, log);
const add = (t) => { log.textContent = t + '\\n' + ChillClickOutside.count() + ' registration(s) active'; };

const live = ChillClickOutside.register(target, () => add('live: outside event'), { ignore: row });
const single = ChillClickOutside.register(target, () => add('once: fired and removed itself'), { once: true, ignore: row });
row.append(
  ChillButton.create({ text: 'Disable live', size: 'sm', variant: 'outline', onClick: () => { live.setEnabled(false); add('live disabled (id ' + live.id + ')'); } }),
  ChillButton.create({ text: 'Enable live', size: 'sm', variant: 'outline', onClick: () => { live.setEnabled(true); add('live enabled'); } }),
);
add('Click anywhere outside the green box');
cleanup(() => { live(); single(); });`,
            height: 200,
        },
        {
            id: 'selectors',
            title: 'Selectors and several elements',
            description: 'Pass an array of elements and selectors. Selectors are resolved on every event, so the panel can be re-rendered without re-registering.',
            code: `root.innerHTML = '<div id="docs-co-wrap" style="display:flex;gap:12px;flex-wrap:wrap"></div><div id="docs-co-status" style="margin-top:10px;font-size:13px"></div>';
const wrap = root.querySelector('#docs-co-wrap');
const status = root.querySelector('#docs-co-status');
status.style.color = 'var(--chill-text)';
['Panel A', 'Panel B'].forEach((t) => {
  const p = document.createElement('div');
  p.className = 'docs-co-panel';
  p.textContent = t;
  p.style.cssText = 'padding:18px 24px;border:2px solid #a855f7;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text)';
  wrap.append(p);
});
status.textContent = 'Both panels count as inside. Click elsewhere.';
const off = ChillClickOutside.register(['.docs-co-panel'], () => { status.textContent = 'Clicked outside both panels'; });
cleanup(off);`,
            height: 140,
        },
    ],
    guides: [
        {
            title: 'The toggle button gotcha',
            body:
                'A button that opens a menu is *outside* the menu. Clicking it fires the outside handler (closing the menu) and then its own click handler (reopening it), so the menu seems stuck open or flickers. ' +
                'Pass the button in `ignore`:\n\n' +
                '```js\nconst off = ChillClickOutside.register(menuEl, closeMenu, { ignore: [\'#menu-button\'], escape: true });\n```\n\n' +
                'Register when the menu opens and call `off()` when it closes, or register once and flip `setEnabled()`.',
        },
        {
            title: 'Events, capture and removed targets',
            body:
                'The default event is `pointerdown` (or `mousedown` + `touchstart` where `PointerEvent` does not exist). Use `events: [\'click\']` if you need click semantics. ' +
                'Listeners run in the capture phase, so components that stop propagation cannot hide an outside interaction.\n\n' +
                'If the click itself removes its target from the document (for example a "delete" button inside a list), ChillClickOutside cannot tell where it was and ignores the event. ' +
                'Callbacks receive the original event; with `escape: true` they are also called with the `keydown` event, so check `e.type` if you need to tell them apart.',
        },
    ],
    options: [
        { name: 'elements', type: 'Element | selector | Array<Element | selector>', default: '-', description: 'First argument of register(): the "inside" elements. Selectors are resolved on each event.' },
        { name: 'callback', type: '(event: Event) => void', default: '-', description: 'Second argument: called for outside events. Errors are caught and logged.' },
        { name: 'events', type: 'string[]', default: "['pointerdown']", description: 'DOM events that count as a click. Falls back to `mousedown` + `touchstart` without PointerEvent.' },
        { name: 'ignore', type: 'Element | selector | Array', default: '[]', description: 'Extra elements treated as inside (toggle buttons, related popovers).' },
        { name: 'escape', type: 'boolean', default: 'false', description: 'Also call the callback with the keydown event when Escape is pressed.' },
        { name: 'enabled', type: 'boolean', default: 'true', description: 'Start enabled. Toggle later with `handle.setEnabled(bool)`.' },
        { name: 'once', type: 'boolean', default: 'false', description: 'Unregister automatically after the first outside event.' },
        { name: 'capture', type: 'boolean', default: 'true', description: 'Documented option; listeners are always attached in the capture phase in this version.' },
    ],
    methods: [
        { signature: 'ChillClickOutside.register(elements, callback, options?)', on: 'static', description: 'Start watching. Returns an unregister function with `.id` and `.setEnabled(bool)`. Throws if `callback` is not a function.' },
        { signature: 'ChillClickOutside.unregister(id)', on: 'static', description: 'Remove a registration by the id on the returned function.' },
        { signature: 'ChillClickOutside.unregisterAll()', on: 'static', description: 'Remove every registration and detach the document listeners.' },
        { signature: 'ChillClickOutside.count()', on: 'static', description: 'Number of active registrations.' },
        { signature: 'off()', description: 'The function returned by `register()`; unregisters that handler.' },
        { signature: 'off.setEnabled(enabled)', description: 'Pause or resume the handler without unregistering.' },
    ],
    a11y: [
        'Pointer-only by nature: always offer a keyboard way to dismiss (set `escape: true`, or provide a close button).',
        'Return focus to the trigger when you close a popup so keyboard users keep their place.',
        'Do not rely on outside clicks alone for modals; combine with FocusTrap and `aria-modal`.',
    ],
    tips: [
        'Unregister on unmount: in React or Vue call `off()` from the effect cleanup, otherwise stale callbacks keep firing.',
        'The `capture` option is read from the options object but the code always attaches capture listeners, so do not depend on `capture: false`.',
        'Only the events you pass are attached, and each document listener is removed when no registration needs it.',
        'On the server `register()` returns a no-op function (with `id: null`), so shared code is safe to run there.',
    ],
    related: ['portal', 'focustrap', 'popover', 'dropdown', 'hotkey'],
    keywords: ['outside click', 'dismiss', 'close on blur', 'popover', 'menu', 'pointerdown', 'escape'],
};

export default doc;
