import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'form',
    global: 'ChillForm',
    category: 'core',
    title: 'Form',
    summary: 'Declarative form validation with accessible inline messages, async submit and server-side errors.',
    style: 'init',
    description:
        'ChillForm adds validation to a form you already wrote. Describe rules per field name (`required`, `email`, `minLength`, `match`, `custom`...) and it validates on blur, on input or on submit, ' +
        'writes the message under the field, wires `aria-invalid` and `aria-describedby`, and only calls your `onSubmit` when everything is valid.\n\n' +
        'Listeners are delegated on the `<form>`, so fields you add later are validated too. The form gets `novalidate` so the library shows its own messages instead of browser bubbles. ' +
        'Messages are always inserted as **text**, so server-provided errors can never inject markup.',
    features: [
        'Built-in rules: required, email, minLength, maxLength, min, max, pattern, match, custom',
        'Validate on blur (default), while typing, or only on submit',
        'Async `onSubmit` with a disabled submit button while it runs, and `setErrors()` for server errors',
        'Per-field and global message overrides with `{min}` / `{max}` placeholders',
        'Register your own rules with `ChillForm.addValidator()`',
        'Accessible: `aria-live` messages, `aria-invalid`, focus moves to the first error',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Basic sign-up form',
            description: 'Rules are keyed by the input `name`. Leave a field and its message appears; submit is blocked until everything passes.',
            height: 320,
            code: `root.innerHTML = \`
<form id="signup" style="max-width:340px">
  <div class="chillform-field"><label class="chillform-label" for="su-email">Email</label>
    <input class="chillform-input" id="su-email" name="email" type="email" placeholder="you@company.com"></div>
  <div class="chillform-field"><label class="chillform-label" for="su-pass">Password</label>
    <input class="chillform-input" id="su-pass" name="password" type="password" placeholder="At least 8 characters"></div>
  <button class="chillform-submit" type="submit">Create account</button>
  <p id="su-out" style="color:var(--chill-text);font-size:13px"></p>
</form>\`;
const form = ChillForm.create(root.querySelector('#signup'), {
  rules: {
    email: { required: true, email: true },
    password: { required: true, minLength: 8 },
  },
  onSubmit: (data) => { root.querySelector('#su-out').textContent = 'Welcome, ' + data.email + '!'; },
});
cleanup(() => form.destroy());`,
        },
        {
            id: 'custom-messages',
            title: 'Messages, match and custom rules',
            description: 'Override messages per rule, compare fields with `match`, and write your own check with `custom(value, data)` returning `true`, `false` or an error string.',
            height: 400,
            code: `root.innerHTML = \`
<form id="reg" style="max-width:340px">
  <div class="chillform-field"><label class="chillform-label">Username</label>
    <input class="chillform-input" name="username" placeholder="letters and numbers"></div>
  <div class="chillform-field"><label class="chillform-label">Password</label>
    <input class="chillform-input" name="password" type="password"></div>
  <div class="chillform-field"><label class="chillform-label">Confirm password</label>
    <input class="chillform-input" name="confirm" type="password"></div>
  <div class="chillform-field"><label class="chillform-label">Age</label>
    <input class="chillform-input" name="age" type="number"></div>
  <button class="chillform-submit" type="submit">Register</button>
</form>\`;
const form = ChillForm.create(root.querySelector('#reg'), {
  rules: {
    username: { required: true, pattern: /^[a-z0-9]+$/i, message: { required: 'Pick a username', pattern: 'Letters and numbers only' } },
    password: { required: true, minLength: 8, message: { minLength: 'Too short: use {min}+ characters' } },
    confirm: { match: 'password', message: { match: 'Passwords do not match' } },
    age: { min: 18, custom: (v) => !v || Number(v) < 120 || 'Please enter a realistic age' },
  },
});
cleanup(() => form.destroy());`,
        },
        {
            id: 'validate-on-input',
            title: 'Validate while typing',
            description: 'Set `validateOn: \'input\'` for instant feedback, for example a live username check. Valid fields get a green border.',
            height: 200,
            code: `root.innerHTML = \`
<form id="live" style="max-width:340px">
  <div class="chillform-field"><label class="chillform-label">Promo code</label>
    <input class="chillform-input" name="code" placeholder="CHILL-1234" autocomplete="off"></div>
</form>\`;
const form = ChillForm.create(root.querySelector('#live'), {
  validateOn: 'input',
  rules: { code: { required: true, pattern: '^CHILL-\\\\d{4}$', message: { pattern: 'Format: CHILL-1234' } } },
});
cleanup(() => form.destroy());`,
        },
        {
            id: 'server-errors',
            title: 'Async submit and server errors',
            description: 'While `onSubmit` is pending the submit button is disabled. After the server answers, push its errors back with `setErrors()`; they clear as soon as the user edits the field.',
            height: 320,
            code: `root.innerHTML = \`
<form id="invite" style="max-width:340px">
  <div class="chillform-field"><label class="chillform-label">Team email</label>
    <input class="chillform-input" name="email" type="email" value="taken@company.com"></div>
  <button class="chillform-submit" type="submit">Send invite</button>
  <p id="inv-out" style="color:var(--chill-text);font-size:13px"></p>
</form>\`;
const out = root.querySelector('#inv-out');
const form = ChillForm.create(root.querySelector('#invite'), {
  rules: { email: { required: true, email: true } },
  onSubmit: async (data, f) => {
    out.textContent = 'Checking...';
    await new Promise((r) => setTimeout(r, 700));        // pretend API call
    if (data.email === 'taken@company.com') {
      out.textContent = '';
      f.setErrors({ email: 'That address already has an account' });
    } else {
      out.textContent = 'Invite sent to ' + data.email;
    }
  },
});
cleanup(() => form.destroy());`,
        },
        {
            id: 'custom-validator',
            title: 'Register a reusable rule',
            description: '`ChillForm.addValidator(name, fn)` adds a rule to every form. Add a default message through the `messages` option.',
            height: 240,
            code: `ChillForm.addValidator('noSpaces', (value) => !value || !/\\s/.test(value));
root.innerHTML = \`
<form id="slug" style="max-width:340px">
  <div class="chillform-field"><label class="chillform-label">URL slug</label>
    <input class="chillform-input" name="slug" value="my project"></div>
  <button class="chillform-submit" type="submit">Publish</button>
</form>\`;
const form = ChillForm.create(root.querySelector('#slug'), {
  rules: { slug: { required: true, noSpaces: true } },
  messages: { noSpaces: 'Spaces are not allowed in a slug' },
});
form.validate();
cleanup(() => { form.destroy(); delete ChillForm.validators.noSpaces; });`,
        },
    ],
    guides: [
        {
            title: 'How validation runs',
            body:
                'Call `ChillForm.create(formOrSelector, config)` once per form. `init` is an identical alias. It does not build any markup: your inputs keep their own HTML, and the library only adds listeners and ARIA.\n\n' +
                '- **`validateOn: \'blur\'`** (default): a field is validated when it loses focus; once touched it re-validates on every input.\n' +
                '- **`validateOn: \'input\'`**: validate while typing.\n' +
                '- **`validateOn: \'submit\'`**: nothing until the user submits.\n\n' +
                'On submit all rules run. If any fail, `onInvalid(errors)` receives `{ field: [messages] }` and the first invalid field is focused (turn that off with `focusFirstError: false`). ' +
                'If all pass, `onSubmit(data, form)` runs; the submit button is disabled until the returned promise settles. A throw goes to `onError(err)` (default `console.error`).',
        },
        {
            title: 'Markup and messages',
            body:
                'Wrap each input in `.chillform-field` and the library will place a `.chillform-message` right after the input. Provide your own `<div class="chillform-message">` in the wrapper to control where it appears.\n\n' +
                'Message lookup order: a string returned by `custom`, then `rules.field.message[rule]`, then the `messages` option, then the built-in default. `{min}` and `{max}` are replaced with the rule value. ' +
                'Only the first error of a field is shown, but `getErrors()` returns all of them.\n\n' +
                '> A rule set to `false` is skipped, and empty values pass every rule except `required`, so optional fields stay optional.',
        },
        {
            title: 'Custom rules',
            body:
                'There are two ways to add logic:\n\n' +
                '```js\n// one-off, per field: return true, false, or an error message\nrules: { age: { custom: (value, data) => value % 2 === 0 || \'Must be even\' } }\n\n' +
                '// reusable, global rule: fn(value, ruleValue, formData) => boolean\nChillForm.addValidator(\'startsWith\', (value, prefix) => !value || value.startsWith(prefix));\n' +
                'rules: { sku: { startsWith: \'SKU-\' } }\n```\n\n' +
                'When a rule is set to the boolean `true`, the validator is called with the value only. Pass a non-boolean (like the prefix above) to receive it as `ruleValue`. Add a default message with `messages: { startsWith: \'...\' }`.',
        },
        {
            title: 'Server-side errors and reuse',
            body:
                '`setErrors({ field: \'message\' | [\'messages\'] })` shows errors that only the server can know. They survive until the user edits that field, and while one is pending on a field with no rules, `validate()` still counts the form as invalid. ' +
                '`clearErrors()` removes all messages, `reset()` also resets the inputs, and `destroy()` removes listeners, ARIA attributes, classes and the `novalidate` flag it added.',
        },
    ],
    options: [
        { name: 'rules', type: '{ [field: string]: Rules }', default: '{}', description: 'Field name to rule object. Keys match the input `name` attribute.' },
        { name: 'rules[field].required', type: 'boolean', default: '-', description: 'Value must be non-empty (trimmed string, non-empty array, or not null/undefined).' },
        { name: 'rules[field].email', type: 'boolean', default: '-', description: 'Must look like an email address. Empty passes.' },
        { name: 'rules[field].minLength / maxLength', type: 'number', default: '-', description: 'String length bounds. Empty passes.' },
        { name: 'rules[field].min / max', type: 'number', default: '-', description: 'Numeric bounds, compared as numbers.' },
        { name: 'rules[field].pattern', type: 'RegExp | string', default: '-', description: 'Must match. Strings are compiled with `new RegExp()`.' },
        { name: 'rules[field].match', type: 'string', default: '-', description: 'Name of another field that must have the same value.' },
        { name: 'rules[field].custom', type: '(value, formData) => true | false | string', default: '-', description: 'Return `true` (or nothing) when valid, `false` for the default message, or a string to use as the message.' },
        { name: 'rules[field].message', type: '{ [rule: string]: string }', default: '-', description: 'Per-field message override by rule name.' },
        { name: 'messages', type: '{ [rule: string]: string }', default: 'built-in', description: 'Override default messages. `{min}` and `{max}` placeholders are replaced with the rule value.' },
        { name: 'validateOn', type: "'blur' | 'input' | 'submit'", default: "'blur'", description: 'When fields are validated.' },
        { name: 'focusFirstError', type: 'boolean', default: 'true', description: 'Focus the first invalid field when submit is blocked.' },
        { name: 'onSubmit', type: '(data, form) => void | Promise', default: 'null', description: 'Called only when the form is valid. `data` repeats names as arrays. The submit button is disabled while it runs.' },
        { name: 'onInvalid', type: '(errors: { [field]: string[] }) => void', default: 'null', description: 'Called when submit is blocked by validation.' },
        { name: 'onError', type: '(err) => void', default: 'console.error', description: 'Called when `onSubmit` throws or rejects.' },
    ],
    methods: [
        { signature: 'ChillForm.create(form, config)', on: 'static', description: '`form` is a selector or `<form>` element. Returns an instance.' },
        { signature: 'ChillForm.init(form, config)', on: 'static', description: 'Alias of `create()`.' },
        { signature: 'ChillForm.addValidator(name, fn)', on: 'static', description: 'Register a rule: `fn(value, ruleValue, formData) => boolean`.' },
        { signature: 'ChillForm.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'ChillForm.validators', description: 'Object holding the rule functions (static property).' },
        { signature: 'instance.validate()', description: 'Validate every field and update the UI. Returns a boolean.' },
        { signature: 'instance.validateField(name)', description: 'Validate one field and update its UI. Returns a boolean.' },
        { signature: 'instance.isValid()', description: 'True when all rules pass. Does not touch the UI.' },
        { signature: 'instance.getErrors()', description: 'Returns `{ field: [messages] }` for fields currently invalid.' },
        { signature: 'instance.setErrors(map)', description: 'Show external errors, e.g. `{ email: \'Already taken\' }`.' },
        { signature: 'instance.clearErrors()', description: 'Remove all errors and messages.' },
        { signature: 'instance.getFormData()', description: 'Values as a plain object; repeated names become arrays.' },
        { signature: 'instance.handleSubmit()', description: 'Run the same pipeline as a submit (validate, then `onSubmit`). Returns a promise.' },
        { signature: 'instance.focusFirstError()', description: 'Focus the first invalid field and return it.' },
        { signature: 'instance.reset()', description: 'Reset the native form and clear all state and messages.' },
        { signature: 'instance.destroy()', description: 'Remove listeners, ARIA attributes and classes; restores `novalidate`.' },
    ],
    cssVars: [
        { name: '--chillform-error', description: 'Error border and message colour.' },
        { name: '--chillform-success', description: 'Valid border colour.' },
        { name: '--chillform-border', description: 'Default input border.' },
        { name: '--chillform-bg / --chillform-text / --chillform-text-light', description: 'Input surface and text colours (dark mode aware).' },
    ],
    a11y: [
        'The form gets `novalidate`; messages are rendered in a `.chillform-message` with `aria-live="polite"`.',
        'Invalid fields get `aria-invalid="true"` and `aria-describedby` pointing at the message; both are removed when the field becomes valid.',
        'On a blocked submit focus moves to the first invalid field (`focusFirstError`).',
        'Keep a real `<label for>` on every input; the library does not create labels.',
        'The `.chillform-input` focus ring and the disabled submit state respect `prefers-reduced-motion`.',
    ],
    tips: [
        'Rules only apply to fields listed in `rules`; other inputs are left alone.',
        'The classes `chillform-field`, `chillform-label`, `chillform-input` and `chillform-submit` are optional styling hooks, the validation works without them.',
        'In React, create the instance in an effect on a `ref` and call `destroy()` in the cleanup. Use `setErrors` after your mutation fails.',
        'The module is SSR-safe: with no DOM, `create()` returns an inert instance.',
        'Checkbox groups and multi-selects arrive in `data` as arrays, which is what `required` expects for "pick at least one".',
    ],
    related: ['input', 'button', 'alert'],
    keywords: ['validation', 'validate', 'rules', 'submit', 'errors', 'inputs'],
};

export default doc;
