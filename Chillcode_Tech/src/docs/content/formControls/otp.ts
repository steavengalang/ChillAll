import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'otp',
    global: 'ChillOtp',
    category: 'formControls',
    title: 'OTP Input',
    summary: 'One-time-code and PIN input with auto-advance, paste support, masking and completion events.',
    style: 'create',
    description:
        'ChillOtp renders a row of single-character boxes for verification codes and PINs. Typing advances focus, Backspace moves back, pasting fills every box and browser autofill (`one-time-code`) is supported.\n\n' +
        '`ChillOtp.create()` returns an instance (the root is `instance.element`); pass `container` to mount it immediately, or use `ChillOtp.init(target, options)` to mount into an existing element. Combine `onComplete` with `setError()` to build a complete verification flow in a few lines.',
    features: [
        'Auto-advance, Backspace/arrow/Home/End navigation and overwrite-on-type',
        'Paste or autofill a whole code; characters not allowed by `type` are filtered out',
        'Numeric, alpha, alphanumeric or any-character codes, optional upper-casing and masking',
        '`onChange` for every edit and `onComplete` once all boxes are filled',
        'Visual grouping (`123 456`), error state and a hidden input for form submission',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Six-digit code',
            description: 'The default: six numeric boxes. `onComplete` fires once when the last box is filled.',
            code: `const out = document.createElement('p');
out.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
out.textContent = 'Enter the 6-digit code we sent you';
const otp = ChillOtp.create({
  length: 6,
  autoFocus: true,
  container: root,
  onComplete: (code) => (out.textContent = 'Code entered: ' + code),
  onChange: (code) => { if (code.length < 6) out.textContent = 'Enter the 6-digit code we sent you'; },
});
root.append(out);
cleanup(() => otp.destroy());`,
        },
        {
            id: 'grouped',
            title: 'Grouped, spaced digits',
            description: '`groupSize` inserts a visual gap after every N boxes, which makes long codes easier to read.',
            code: `const otp = ChillOtp.create({
  length: 6,
  groupSize: 3,
  size: 'lg',
  value: '482',
  placeholder: '\\u2022',
  label: 'Authenticator code',
  container: root,
});
cleanup(() => otp.destroy());`,
        },
        {
            id: 'pin',
            title: 'Masked PIN',
            description: '`mask` switches the boxes to `type="password"`. A 4-character PIN is a common variant.',
            code: `const otp = ChillOtp.create({
  length: 4,
  mask: true,
  label: 'Card PIN',
  container: root,
  name: 'pin',
});
otp.setValue('1234', true);
cleanup(() => otp.destroy());`,
        },
        {
            id: 'types',
            title: 'Alphanumeric invite code',
            description: 'Use `type: "alphanumeric"` with `uppercase` for codes like coupon or invite keys. Disallowed characters are dropped as you type or paste.',
            code: `const otp = ChillOtp.create({
  length: 8,
  type: 'alphanumeric',
  uppercase: true,
  groupSize: 4,
  size: 'sm',
  label: 'Invite code',
  container: root,
});
otp.setValue('ab12-cd34');
cleanup(() => otp.destroy());`,
        },
        {
            id: 'verify-flow',
            title: 'Verification flow',
            description: 'Validate in `onComplete`, show `setError(true)` on failure and `clear()` to try again. The correct code in this demo is 123456.',
            code: `const status = document.createElement('p');
status.style.cssText = 'margin:12px 0 0;font-size:13px;color:var(--chill-text)';
status.textContent = 'Hint: the code is 123456';
const otp = ChillOtp.create({
  length: 6,
  container: root,
  async onComplete(code) {
    otp.setDisabled(true);
    status.textContent = 'Checking...';
    await new Promise((r) => setTimeout(r, 600));
    otp.setDisabled(false);
    if (code === '123456') { otp.setError(false); status.textContent = 'Verified!'; }
    else { otp.setError(true); status.textContent = 'Wrong code, try again.'; }
  },
});
otp.on('change', () => otp.setError(false));
root.append(status);
cleanup(() => otp.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Create vs init',
            body:
                'Both return an instance, not an element; the root node is `instance.element`.\n\n' +
                '- **`create(options)`** builds the control. Pass `container` (element or selector) to mount it, or append `instance.element` yourself.\n' +
                '- **`init(target, options)`** mounts a new control into an existing element or selector and returns `null` if it is missing.\n\n' +
                'Instance methods: `getValue()`, `setValue(str, silent?)`, `clear()`, `focus()`, `setError(bool)`, `setDisabled(bool)`, `isComplete()`, `on(event, fn)` and `destroy()`.',
        },
        {
            title: 'Events and completion',
            body:
                '`onChange(value, instance)` fires on every edit and the value may be partial. `onComplete(value, instance)` fires when the last empty box gets filled; if the user edits a digit and refills, it fires again.\n\n' +
                '`setValue(str)` fires the same events; pass `true` as the second argument to set the value silently (useful for restoring state). `clear()` empties every box, fires `change` and focuses the first box.',
        },
        {
            title: 'Forms and autofill',
            body:
                'Set `name` to add a hidden input holding the joined value. The first box has `autocomplete="one-time-code"`, so mobile browsers can offer SMS codes; multi-character autofill and pasted text are distributed across the boxes.\n\n' +
                'Numeric codes use `inputmode="numeric"` so phones show the number pad.',
        },
        {
            title: 'Theming',
            body:
                '```css\n:root {\n  --chillotp-focus: #7c3aed;\n  --chillotp-error: #dc2626;\n  --chillotp-w: 52px;\n}\n```\n\n' +
                'Dark mode follows `prefers-color-scheme`, `<html data-theme="dark">` or `class="dark"`.',
        },
    ],
    options: [
        { name: 'length', type: 'number', default: '6', description: 'Number of boxes (1 to 32).' },
        { name: 'type', type: "'numeric' | 'alpha' | 'alphanumeric' | 'any'", default: "'numeric'", description: 'Characters accepted. `any` accepts anything that is not whitespace.' },
        { name: 'mask', type: 'boolean', default: 'false', description: 'Show bullets (`type="password"`).' },
        { name: 'uppercase', type: 'boolean', default: 'false', description: 'Force upper-case letters.' },
        { name: 'value', type: 'string', default: "''", description: 'Initial value (filtered by `type`, silent).' },
        { name: 'groupSize', type: 'number', default: '0', description: 'Insert a visual gap after every N boxes.' },
        { name: 'autoFocus', type: 'boolean', default: 'false', description: 'Focus the first empty box once mounted.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all boxes.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Box size.' },
        { name: 'name', type: 'string', default: 'null', description: 'Hidden input name holding the joined value.' },
        { name: 'label', type: 'string', default: "'Verification code'", description: '`aria-label` of the group.' },
        { name: 'placeholder', type: 'string', default: "''", description: 'Placeholder character for empty boxes (first character only).' },
        { name: 'container', type: 'Element | string', default: 'null', description: 'Element or selector to append to.' },
        { name: 'className', type: 'string', default: "''", description: 'Extra class on the root element.' },
        { name: 'onChange', type: '(value: string, instance) => void', default: 'null', description: 'Called on every change; the value may be partial.' },
        { name: 'onComplete', type: '(value: string, instance) => void', default: 'null', description: 'Called when all boxes are filled.' },
    ],
    methods: [
        { signature: 'ChillOtp.create(options)', on: 'static', description: 'Build an OTP input and return the instance (root at `.element`).' },
        { signature: 'ChillOtp.init(target, options)', on: 'static', description: 'Mount an OTP input into an element or selector; returns `null` if not found.' },
        { signature: 'ChillOtp.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.getValue()', description: 'The joined value of all boxes (may be partial).' },
        { signature: 'instance.setValue(str, silent?)', description: 'Fill the boxes (filtered and truncated). Fires events unless `silent`.' },
        { signature: 'instance.clear()', description: 'Empty all boxes, fire `change` and focus the first box.' },
        { signature: 'instance.focus()', description: 'Focus the first empty box (or the last one when full).' },
        { signature: 'instance.isComplete()', description: 'True when every box is filled.' },
        { signature: 'instance.setError(flag)', description: 'Toggle the error styling and `aria-invalid` on each box.' },
        { signature: 'instance.setDisabled(flag)', description: 'Enable or disable all boxes.' },
        { signature: 'instance.on(event, fn)', description: 'Subscribe to `change` or `complete`; returns an unsubscribe function.' },
        { signature: 'instance.destroy()', description: 'Remove listeners and the element.' },
        { signature: 'instance.element', description: 'The root `<div role="group">`.' },
    ],
    events: [
        { name: 'change', payload: 'value, instance', description: 'The code changed (may be partial).' },
        { name: 'complete', payload: 'value, instance', description: 'All boxes are now filled.' },
    ],
    cssVars: [
        { name: '--chillotp-bg / --chillotp-text', description: 'Box background and text colour.' },
        { name: '--chillotp-border', description: 'Default box border.' },
        { name: '--chillotp-focus', description: 'Focus ring and border colour.' },
        { name: '--chillotp-error', description: 'Error border colour.' },
        { name: '--chillotp-filled-bg', description: 'Background of filled boxes.' },
        { name: '--chillotp-w', description: 'Box width.' },
    ],
    a11y: [
        'The root is `role="group"` with an `aria-label`; each box is labelled "Character N of M".',
        'Keys: typing advances, Backspace clears and moves back, Delete clears, ArrowLeft/Right/Home/End move between boxes.',
        'Boxes select their content on focus so typing replaces it; paste distributes characters across boxes.',
        '`setError(true)` sets `aria-invalid="true"` on every box; numeric codes request the numeric keypad via `inputmode`.',
    ],
    tips: [
        'Validate in `onComplete`, not `onChange`, to avoid hitting your API on partial codes.',
        '`onComplete` fires only on the transition from incomplete to complete, so reusing the same full value does not re-trigger it.',
        'Call `setError(false)` from `onChange` so the red state disappears as soon as the user edits.',
        'In React, create the control in an effect with a ref as `container` and `destroy()` it on cleanup.',
    ],
    related: ['input', 'numberinput', 'form'],
    keywords: ['pin', 'verification code', '2fa', 'sms code', 'passcode', 'one time password'],
};

export default doc;
