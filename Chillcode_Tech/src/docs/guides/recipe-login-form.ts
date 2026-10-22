import type { Guide } from '../types';

const guide: Guide = {
    id: 'recipe-login-form',
    title: 'Recipe: login form with validation',
    summary: 'Build a sign-in form with ChillForm validation, ChillInput fields, a loading ChillButton and ChillNotify / ChillAlert feedback.',
    group: 'Recipes',
    body: `**Goal:** a sign-in form that validates as the user types, disables itself while the request is running, shows server errors under the right field, and tells the user what happened with a toast.

**You will use:** [ChillForm](/docs/form) for rules and messages, [ChillInput](/docs/input) for the fields, [ChillButton](/docs/button) for the loading submit button, [ChillNotify](/docs/notify) and [ChillAlert](/docs/alert) for feedback.

## How the pieces fit

- \`ChillForm.create(formElement, options)\` adds validation to a \`<form>\` you already have. It looks fields up by their \`name\`, so every input needs one.
- \`ChillInput.create({ name, label, ... })\` returns a wrapper element. Its \`name\` option is set on the real \`<input>\` inside, so ChillForm finds it.
- ChillForm writes an error message into the first \`.chillform-message\` it finds inside the field's \`.chillform-field\` container, and links it to the input with \`aria-describedby\` and \`aria-invalid\`. We place that element ourselves so the message sits below the ChillInput.
- \`onSubmit\` runs only when every rule passes. While it is pending ChillForm blocks double submits.

## Step 1: build the form

Create a small helper that makes one field: the \`ChillInput\` plus the message slot ChillForm will fill.

\`\`\`js
function field(name, options) {
  const wrap = document.createElement('div');
  wrap.className = 'chillform-field';
  const input = ChillInput.create({ name, ...options });
  const message = document.createElement('div');
  message.className = 'chillform-message';
  message.setAttribute('data-for', name);
  wrap.append(input, message);
  return wrap;
}
\`\`\`

Then assemble a form with an email field, a password field and a submit button made by \`ChillButton\` with \`type: 'submit'\`.

## Step 2: add the rules

\`\`\`js
const form = ChillForm.create(formEl, {
  validateOn: 'blur',          // re-validates on every keystroke once a field has been left
  rules: {
    email:    { required: true, email: true, message: { required: 'Enter your email' } },
    password: { required: true, minLength: 8, message: { minLength: 'Use at least {min} characters' } }
  },
  onSubmit: async (data, f) => { /* call your API */ }
});
\`\`\`

If a rule fails on submit, \`onSubmit\` is not called and focus moves to the first invalid field.

## Step 3: submit, then show feedback

Inside \`onSubmit\`:

1. turn the button into its loading state with \`button.setLoading(true, 'Signing in...')\`;
2. await your request (here a fake one that accepts \`ada@example.com\` / \`correct-horse\`);
3. on success show a toast with \`ChillNotify.success(...)\`;
4. on failure call \`f.setErrors({ password: '...' })\` to put the server message under the field and also raise a toast;
5. always turn loading off in a \`finally\`.

\`setErrors()\` messages disappear as soon as the user edits that field, and, like every ChillForm message, are inserted as text.

## Step 4: the working demo

Try a wrong password (the default), then change it to \`correct-horse\`. The "Forgot password?" button opens a \`ChillAlert.prompt\`, which resolves the trimmed answer or \`null\` when cancelled.

\`\`\`live
root.style.cssText += ';max-width:380px';
let alive = true;

// fake API: resolves for one known account, rejects otherwise
const fakeLogin = (email, password) => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (!alive) return resolve();
    if (email === 'ada@example.com' && password === 'correct-horse') resolve({ name: 'Ada' });
    else reject(new Error('Wrong email or password'));
  }, 900);
});

function field(name, options) {
  const wrap = document.createElement('div');
  wrap.className = 'chillform-field';
  const input = ChillInput.create({ name, ...options });
  const message = document.createElement('div');
  message.className = 'chillform-message';
  message.setAttribute('data-for', name);
  wrap.append(input, message);
  return wrap;
}

const formEl = document.createElement('form');
formEl.style.cssText = 'display:flex;flex-direction:column;gap:14px';
const submit = ChillButton.create({ text: 'Sign in', type: 'submit', fullWidth: true });
const forgot = ChillButton.create({ text: 'Forgot password?', variant: 'ghost', size: 'sm', onClick: async () => {
  const email = await ChillAlert.prompt({ title: 'Reset your password', text: 'We will email you a reset link.', placeholder: 'you@example.com', inputType: 'email', confirmText: 'Send link' });
  if (email) ChillNotify.info({ title: 'Check your inbox', message: 'If ' + email + ' has an account, a link is on its way.' });
} });

formEl.append(
  field('email', { label: 'Email', type: 'email', placeholder: 'ada@example.com', autocomplete: 'username', value: 'ada@example.com' }),
  field('password', { label: 'Password', type: 'password', placeholder: 'At least 8 characters', autocomplete: 'current-password', value: 'wrong-password' }),
  submit,
  forgot
);
root.append(formEl);

const form = ChillForm.create(formEl, {
  validateOn: 'blur',
  rules: {
    email: { required: true, email: true, message: { required: 'Enter your email' } },
    password: { required: true, minLength: 8, message: { minLength: 'Use at least {min} characters' } }
  },
  onSubmit: async (data, f) => {
    submit.setLoading(true, 'Signing in...');
    try {
      const user = await fakeLogin(data.email, data.password);
      if (alive) ChillNotify.success({ title: 'Welcome back, ' + user.name, message: 'You are signed in.' });
    } catch (err) {
      if (!alive) return;
      f.setErrors({ password: err.message });
      ChillNotify.error({ title: 'Sign in failed', message: err.message });
    } finally {
      submit.setLoading(false);
    }
  }
});

cleanup(() => { alive = false; form.destroy(); submit.destroy(); forgot.destroy(); ChillNotify.closeAll(); ChillAlert.closeAll(); });
\`\`\`

## Step 5: recover from network errors

A wrong password is a field problem. A dropped connection is not, so a toast with a **Retry** action fits better. Notify actions are plain buttons: \`onClick\` runs, and the toast closes unless you pass \`close: false\`. Use \`duration: 0\` to keep the toast until the user acts.

\`\`\`live
let online = false;
let alive = true;
const status = document.createElement('div');
status.style.cssText = 'color:var(--chill-text);font-size:14px;margin-bottom:10px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;align-items:center';
root.append(status, row);

const save = ChillButton.create({ text: 'Save profile' });
const toggle = ChillButton.create({ text: 'Go online', variant: 'outline' });
row.append(save, toggle);

const render = () => { status.textContent = 'Network: ' + (online ? 'online' : 'offline') + ' (use the second button to switch)'; };
render();

const attempt = async () => {
  save.setLoading(true, 'Saving...');
  await new Promise((r) => setTimeout(r, 600));
  if (!alive) return;
  save.setLoading(false);
  if (online) ChillNotify.success({ message: 'Profile saved.' });
  else ChillNotify.error({
    title: 'Could not reach the server',
    message: 'Your changes are not saved yet.',
    duration: 0,
    actions: [{ text: 'Retry', primary: true, onClick: attempt }]
  });
};
save.addEventListener('click', attempt);
toggle.addEventListener('click', () => { online = !online; render(); });

cleanup(() => { alive = false; save.destroy(); toggle.destroy(); ChillNotify.closeAll(); });
\`\`\`

> **Tip:** call \`ChillNotify.closeAll()\` and \`ChillAlert.closeAll()\` in your cleanup (route change, component unmount) so overlays never outlive the screen that opened them.

## Result and what to remember

- Rules live next to the form, messages are accessible and text-only.
- The button shows progress and cannot be double-submitted.
- Field problems (\`setErrors\`) and connection problems (toast with Retry) are handled differently.
- Add \`autocomplete\` values (\`username\`, \`current-password\`) so password managers work.

## Next steps

- [Form](/docs/form) for \`validateOn\`, custom validators and \`ChillForm.addValidator\`
- [Notify](/docs/notify) for positions, queueing and actions
- [Accessibility](/docs/guide/accessibility) for naming controls and testing keyboard flows
`,
};

export default guide;
