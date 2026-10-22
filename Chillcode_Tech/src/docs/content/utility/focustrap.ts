import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'focustrap',
    global: 'ChillFocusTrap',
    category: 'utility',
    title: 'Focus Trap',
    summary: 'Keep Tab and Shift+Tab inside a dialog, with Escape to leave and focus restored afterwards.',
    style: 'create',
    description:
        'ChillFocusTrap confines keyboard focus to a container, which is what makes modal dialogs, drawers and menus accessible. ' +
        'While active, Tab cycles through the container\'s tabbable elements, focus that escapes (programmatically or by clicking outside) is pulled back, and Escape can close the trap.\n\n' +
        'It handles real-world markup: `position: fixed` dialogs, hidden, disabled, `inert` and `tabindex="-1"` elements are skipped, ' +
        'and traps stack, so opening a second trap pauses the first and resumes it when the second ends.',
    features: [
        'Tab / Shift+Tab wrap around inside the container',
        'Focus moves in on `activate()` and returns to the previously focused element on `deactivate()`',
        'Escape deactivates (configurable); optional deactivate-on-outside-click',
        'Skips hidden, disabled, `inert` and `tabindex="-1"` elements; works with fixed dialogs',
        'Nested traps stack automatically; `pause()` / `resume()` for manual control',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Trap focus in a panel',
            description: 'Activate the trap, then press Tab repeatedly: focus never leaves the panel. Escape or the Close button releases it and focus returns to the opener. Clicks outside the panel are blocked while it is active.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px;align-items:flex-start';
const panel = document.createElement('div');
panel.style.cssText = 'display:none;flex-direction:column;gap:8px;padding:16px;border:2px solid #3b82f6;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text);min-width:260px';
panel.innerHTML = '<strong>Invite a teammate</strong>';
const email = Object.assign(document.createElement('input'), { type: 'email', placeholder: 'name@company.com' });
email.setAttribute('aria-label', 'Email');
email.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg);color:var(--chill-text);font:inherit';
const role = document.createElement('select');
role.setAttribute('aria-label', 'Role');
['Viewer', 'Editor', 'Admin'].forEach((r) => role.add(new window.Option(r)));
const close = ChillButton.create({ text: 'Close', size: 'sm', variant: 'outline' });
panel.append(email, role, close);
const opener = ChillButton.create({ text: 'Open invite panel' });
const state = document.createElement('div');
state.style.cssText = 'color:var(--chill-text);font-size:13px';
state.textContent = 'Trap: inactive';
root.append(opener, panel, state);

const trap = ChillFocusTrap.create(panel, {
  onActivate: () => { panel.style.display = 'flex'; state.textContent = 'Trap: active (Tab cycles, Esc closes)'; },
  onDeactivate: () => { panel.style.display = 'none'; state.textContent = 'Trap: inactive'; },
});
opener.addEventListener('click', () => trap.activate());
close.addEventListener('click', () => trap.deactivate());
cleanup(() => trap.destroy());`,
            height: 230,
        },
        {
            id: 'initial-focus',
            title: 'Initial focus and no return',
            description: '`initialFocus` accepts a selector, element or function. Here the second field gets focus first, and `returnFocus: false` leaves focus where it ends up when the trap closes.',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:10px;align-items:flex-start';
const form = document.createElement('form');
form.style.cssText = 'display:none;flex-direction:column;gap:8px;padding:16px;border:2px solid #22c55e;border-radius:12px;background:var(--chill-bg-secondary);color:var(--chill-text)';
form.addEventListener('submit', (e) => e.preventDefault());
const first = Object.assign(document.createElement('input'), { placeholder: 'First name' });
const code = Object.assign(document.createElement('input'), { placeholder: 'Promo code (focused first)' });
code.id = 'docs-promo';
[first, code].forEach((i) => { i.setAttribute('aria-label', i.placeholder); i.style.cssText = 'padding:8px 12px;border:1px solid var(--chill-border);border-radius:8px;background:var(--chill-bg);color:var(--chill-text);font:inherit'; });
const done = ChillButton.create({ text: 'Done', size: 'sm', variant: 'success' });
form.append(first, code, done);
const opener = ChillButton.create({ text: 'Open checkout form', variant: 'secondary' });
root.append(opener, form);

const trap = ChillFocusTrap.create(form, {
  initialFocus: '#docs-promo',
  returnFocus: false,
  onActivate: () => (form.style.display = 'flex'),
  onDeactivate: () => (form.style.display = 'none'),
});
opener.addEventListener('click', () => trap.activate());
done.addEventListener('click', (e) => { e.preventDefault(); trap.deactivate(); });
cleanup(() => trap.destroy());`,
            height: 230,
        },
        {
            id: 'click-outside',
            title: 'Deactivate on outside click',
            description: 'With `clickOutsideDeactivates: true` a mousedown outside releases the trap (without stealing focus back), which suits popovers and menus rather than modals.',
            code: `root.style.cssText += ';display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap';
const menu = document.createElement('div');
menu.setAttribute('role', 'menu');
menu.style.cssText = 'display:none;flex-direction:column;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);padding:4px;min-width:160px';
['Rename', 'Duplicate', 'Move to...', 'Delete'].forEach((label) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'menuitem');
  b.textContent = label;
  b.style.cssText = 'text-align:left;padding:6px 10px;border:0;border-radius:6px;background:transparent;color:var(--chill-text);font:inherit;cursor:pointer';
  menu.append(b);
});
const opener = ChillButton.create({ text: 'Actions', variant: 'outline' });
const note = document.createElement('div');
note.style.cssText = 'color:var(--chill-text);font-size:13px;align-self:center';
note.textContent = 'Open the menu, then click anywhere else';
root.append(opener, menu, note);

const trap = ChillFocusTrap.create(menu, {
  clickOutsideDeactivates: true,
  onActivate: () => (menu.style.display = 'flex'),
  onDeactivate: () => { menu.style.display = 'none'; note.textContent = 'Trap released'; },
});
opener.addEventListener('click', (e) => { e.stopPropagation(); trap.activate(); });
cleanup(() => trap.destroy());`,
            height: 200,
        },
        {
            id: 'inspect',
            title: 'Tabbable detection',
            description: '`ChillFocusTrap.isTabbable(el)` and `trap.updateFocusables()` show exactly which elements the trap will cycle through. Disabled, hidden and `tabindex="-1"` items are skipped.',
            code: `root.innerHTML = '<div id="docs-inspect" style="display:flex;gap:8px;flex-wrap:wrap">' +
  '<button>Save</button><button disabled>Disabled</button><button tabindex="-1">Skipped</button>' +
  '<a href="#top">Link</a><span tabindex="0">Custom stop</span><input type="hidden" value="x"><button hidden>Hidden</button></div>';
const trap = ChillFocusTrap.create(root.querySelector('#docs-inspect'));
const list = trap.updateFocusables();
const out = document.createElement('div');
out.style.cssText = 'margin-top:12px;color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:13px';
out.textContent = 'Tabbable (' + list.length + '): ' + list.map((el) => el.tagName.toLowerCase() + (el.textContent ? '"' + el.textContent + '"' : '')).join(', ');
root.append(out);
cleanup(() => trap.destroy());`,
            height: 130,
        },
    ],
    guides: [
        {
            title: 'Using it with a dialog',
            body:
                'Create the trap once for the dialog element, activate it when the dialog opens and deactivate it when it closes:\n\n' +
                '```js\nconst trap = ChillFocusTrap.create(dialogEl, {\n  initialFocus: \'#name\',\n  onDeactivate: () => closeDialog(),   // runs for Escape too\n});\nopen.onclick = () => { showDialog(); trap.activate(); };\n```\n\n' +
                'If the container has nothing tabbable, the trap makes the container itself focusable (a temporary `tabindex="-1"`) so focus cannot leak. ' +
                'Call `trap.destroy()` when the dialog is disposed; it deactivates first.\n\n' +
                '> Activate the trap *after* the dialog is visible. Hidden elements are not tabbable, so a trap activated on a `display: none` container has nothing to focus (it retries once on the next frame).',
        },
        {
            title: 'Stacking and pausing',
            body:
                'Traps keep a global stack. Activating a second trap suspends the first; when the second one deactivates, the first resumes automatically, which makes nested dialogs work without bookkeeping. ' +
                'Use `pause()` / `resume()` to temporarily release a trap (for instance while a third-party widget needs focus).\n\n' +
                'Escape handling uses a capturing listener that calls `stopPropagation()`, so a trapped Escape does not also close other things underneath. Set `escapeDeactivates: false` if your dialog should handle Escape itself.',
        },
    ],
    options: [
        { name: 'initialFocus', type: 'string | Element | () => Element', default: 'null', description: 'What to focus on activate. Defaults to the first tabbable element, or the container.' },
        { name: 'returnFocus', type: 'boolean', default: 'true', description: 'Restore focus to the previously focused element on deactivate.' },
        { name: 'escapeDeactivates', type: 'boolean', default: 'true', description: 'Pressing Escape deactivates the trap.' },
        { name: 'clickOutsideDeactivates', type: 'boolean', default: 'false', description: 'A mousedown outside deactivates (without returning focus). When false, outside clicks are prevented and focus is pulled back.' },
        { name: 'onActivate', type: '() => void', default: 'null', description: 'Called after activation.' },
        { name: 'onDeactivate', type: '() => void', default: 'null', description: 'Called after deactivation (including via Escape or outside click).' },
    ],
    methods: [
        { signature: 'ChillFocusTrap.create(element, options?)', on: 'static', description: 'Create a trap for an element or selector. Throws if the element is not found.' },
        { signature: 'ChillFocusTrap.isTabbable(element)', on: 'static', description: 'Is this element reachable with Tab (not disabled, hidden, inert or `tabindex < 0`)?' },
        { signature: 'trap.activate()', description: 'Start trapping and move focus in. Chainable.' },
        { signature: 'trap.deactivate({ returnFocus? })', description: 'Stop trapping; optionally override `returnFocus`. Chainable.' },
        { signature: 'trap.pause() / resume()', description: 'Temporarily suspend or restore the trap while it stays active. Chainable.' },
        { signature: 'trap.updateFocusables()', description: 'Returns the current list of tabbable elements inside the container.' },
        { signature: 'trap.isActive', description: 'Getter, `true` while active.' },
        { signature: 'trap.destroy()', description: 'Deactivate and make the trap unusable.' },
    ],
    a11y: [
        'Tab and Shift+Tab wrap between the first and last tabbable element; Escape deactivates unless disabled.',
        'Pair it with `role="dialog"` and `aria-modal="true"` on the container, and give the dialog an accessible name.',
        'Focus is restored to the opener on close, which keeps keyboard and screen reader users oriented.',
        'Always provide a visible close control inside the trap, as outside clicks are blocked by default.',
    ],
    tips: [
        'While a trap is active, clicks outside are prevented, so keep every control the user needs inside the container.',
        'SSR-safe to import; `create()` needs the DOM, so call it in effects or handlers.',
        'Remember to `destroy()` (or `deactivate()`) on unmount; a leaked active trap blocks the page.',
        'Programmatic `focus()` calls outside the container are pulled back in, which can surprise third-party widgets: use `pause()`.',
    ],
    related: ['modal', 'drawer', 'portal', 'clickoutside', 'hotkey'],
    keywords: ['accessibility', 'modal', 'dialog', 'tab key', 'keyboard navigation', 'trap', 'a11y'],
};

export default doc;
