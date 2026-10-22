'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const HTML = `<form id="f">
  <div class="chillform-field"><input name="email" type="text"></div>
  <div class="chillform-field"><input name="password" type="password"></div>
  <div class="chillform-field"><input name="confirm" type="password"></div>
  <div class="chillform-field"><input type="checkbox" name="tags" value="a"><input type="checkbox" name="tags" value="b"></div>
  <input type="checkbox" name="agree">
  <button type="submit">Go</button>
</form>`;
const setup = (config) => {
    const env = load('chillform');
    env.document.body.innerHTML = HTML;
    const form = env.document.getElementById('f');
    const f = env.lib.create('#f', config);
    const field = n => form.querySelector('[name="' + n + '"]');
    const type = (n, v) => { const el = field(n); el.value = v; el.dispatchEvent(new env.window.Event('input', { bubbles: true })); };
    const blur = n => field(n).dispatchEvent(new env.window.FocusEvent('focusout', { bubbles: true }));
    const submit = () => form.dispatchEvent(new env.window.Event('submit', { bubbles: true, cancelable: true }));
    const msg = n => { const m = form.querySelector('.chillform-message[data-for="' + n + '"]'); return m ? m.textContent : null; };
    return Object.assign(env, { form, f, field, type, blur, submit, msg });
};
const tick = () => new Promise(r => setTimeout(r, 10));

test('chillform validates on blur, sets aria-invalid/aria-describedby, message is TEXT', () => {
    const t = setup({ rules: { email: { required: true, email: true } }, messages: { required: '<img src=x onerror=alert(1)>' } });
    t.blur('email');
    assert.equal(t.field('email').getAttribute('aria-invalid'), 'true');
    const m = t.form.querySelector('.chillform-message');
    assert.equal(t.field('email').getAttribute('aria-describedby'), m.id);
    assert.equal(m.getAttribute('aria-live'), 'polite');
    assert.equal(t.form.querySelector('img'), null);
    assert.equal(m.textContent, '<img src=x onerror=alert(1)>');
    t.type('email', 'a@b.co');
    assert.equal(t.field('email').getAttribute('aria-invalid'), null);
    assert.equal(t.field('email').getAttribute('aria-describedby'), null);
    assert.ok(t.field('email').classList.contains('chillform-valid'));
    assert.equal(m.textContent, '');
    t.f.destroy();
});

test('chillform: sets novalidate and does not validate before touched; validateOn submit/input', () => {
    const t = setup({ rules: { email: { required: true } } });
    assert.ok(t.form.hasAttribute('novalidate'));
    t.type('email', '');
    assert.equal(t.field('email').getAttribute('aria-invalid'), null, 'not touched yet');
    t.f.destroy();
    assert.ok(!t.form.hasAttribute('novalidate'));
    const i = setup({ rules: { email: { required: true } }, validateOn: 'input' });
    i.type('email', '');
    assert.equal(i.field('email').getAttribute('aria-invalid'), 'true');
    i.f.destroy();
    const s = setup({ rules: { email: { required: true } }, validateOn: 'submit' });
    s.blur('email');
    assert.equal(s.field('email').getAttribute('aria-invalid'), null);
    s.f.destroy();
});

test('chillform submit: blocked when invalid (onInvalid, focus first error); onSubmit receives data when valid', async () => {
    const calls = []; const invalid = [];
    const t = setup({ rules: { email: { required: true, email: true }, password: { required: true, minLength: 4 } },
        onSubmit: d => calls.push(d), onInvalid: e => invalid.push(e) });
    t.submit();
    await tick();
    assert.equal(calls.length, 0);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].email.length && invalid[0].password.length);
    assert.equal(t.document.activeElement, t.field('email'));
    t.field('email').value = 'x@y.zz';
    t.field('password').value = 'abcd';
    t.submit();
    await tick();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].email, 'x@y.zz');
    assert.ok(!t.form.querySelector('[type="submit"]').disabled, 'submit re-enabled');
    t.f.destroy();
});

test('chillform onSubmit rejection goes to onError, button re-enabled, can submit again', async () => {
    const errs = [];
    const t = setup({ rules: {}, onSubmit: async () => { throw new Error('boom'); }, onError: e => errs.push(e.message) });
    t.submit();
    await tick();
    eq(errs, ['boom']);
    assert.ok(!t.form.querySelector('[type="submit"]').disabled);
    t.submit();
    await tick();
    eq(errs, ['boom', 'boom']);
    t.f.destroy();
});

test('chillform match, min/max, pattern, custom (true/false/string), per-field messages', () => {
    const t = setup({ rules: {
        password: { minLength: 4 },
        confirm: { match: 'password', message: { match: 'Nope' } },
        email: { pattern: '^a', custom: (v, data) => v !== 'abad' || 'custom msg' }
    } });
    t.field('password').value = 'abcd';
    t.field('confirm').value = 'abce';
    assert.equal(t.f.validateField('confirm'), false);
    assert.equal(t.msg('confirm'), 'Nope');
    t.field('confirm').value = 'abcd';
    assert.equal(t.f.validateField('confirm'), true);
    t.field('email').value = 'abad';
    assert.equal(t.f.validateField('email'), false);
    assert.equal(t.msg('email'), 'custom msg');
    t.field('email').value = 'bbb';
    t.f.validateField('email');
    assert.equal(t.msg('email'), 'Invalid format');
    t.field('email').value = 'abc';
    assert.equal(t.f.validateField('email'), true);
    t.f.destroy();
});

test('chillform repeated names become arrays; required works for checkbox groups', () => {
    const t = setup({ rules: { tags: { required: true } } });
    eq(t.f.getFormData().tags, undefined);
    assert.equal(t.f.validateField('tags'), false);
    t.field('tags').checked = true;
    assert.equal(t.f.getFormData().tags, 'a');
    t.form.querySelectorAll('[name="tags"]')[1].checked = true;
    eq(t.f.getFormData().tags, ['a', 'b']);
    assert.equal(t.f.validateField('tags'), true);
    assert.equal(t.form.querySelectorAll('[name="tags"]')[0].getAttribute('aria-invalid'), null);
    t.f.destroy();
});

test('chillform setErrors shows server errors and blocks submit; typing clears them; getErrors/isValid/clearErrors', async () => {
    const calls = [];
    const t = setup({ rules: { email: { required: true } }, onSubmit: d => calls.push(d) });
    t.field('email').value = 'a@b.cc';
    assert.ok(t.f.isValid());
    t.f.setErrors({ email: 'Already taken', other: 'ignored (no field)' });
    assert.equal(t.msg('email'), 'Already taken');
    assert.equal(t.field('email').getAttribute('aria-invalid'), 'true');
    eq(t.f.getErrors().email, ['Already taken']);
    assert.ok(!t.f.isValid());
    t.type('email', 'new@b.cc');
    assert.equal(t.field('email').getAttribute('aria-invalid'), null);
    t.f.setErrors({ email: 'again' });
    t.f.clearErrors();
    assert.equal(t.field('email').getAttribute('aria-invalid'), null);
    eq(t.f.getErrors(), {});
    t.f.destroy();
});

test('chillform isValid does not render UI', () => {
    const t = setup({ rules: { email: { required: true } } });
    assert.equal(t.f.isValid(), false);
    assert.equal(t.form.querySelector('.chillform-message'), null);
    t.f.destroy();
});

test('chillform reset clears UI; native reset event clears UI', () => {
    const t = setup({ rules: { email: { required: true } } });
    t.blur('email');
    assert.equal(t.field('email').getAttribute('aria-invalid'), 'true');
    t.f.reset();
    assert.equal(t.field('email').getAttribute('aria-invalid'), null);
    assert.equal(t.msg('email'), '');
    t.blur('email');
    t.form.dispatchEvent(new t.window.Event('reset', { bubbles: true }));
    assert.equal(t.field('email').getAttribute('aria-invalid'), null);
    t.f.destroy();
});

test('chillform delegated listeners cover fields added after init; destroy removes everything', async () => {
    const calls = [];
    const t = setup({ rules: { late: { required: true } }, onSubmit: () => calls.push(1) });
    const input = t.document.createElement('input');
    input.name = 'late';
    t.form.insertBefore(input, t.form.firstChild);
    input.dispatchEvent(new t.window.FocusEvent('focusout', { bubbles: true }));
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    input.value = 'x';
    input.dispatchEvent(new t.window.Event('input', { bubbles: true }));
    assert.equal(input.getAttribute('aria-invalid'), null);
    t.f.destroy();
    const ev = new t.window.Event('submit', { bubbles: true, cancelable: true });
    t.form.dispatchEvent(ev);
    await tick();
    assert.ok(!ev.defaultPrevented, 'submit listener removed');
    assert.equal(calls.length, 0);
    input.value = '';
    input.dispatchEvent(new t.window.FocusEvent('focusout', { bubbles: true }));
    assert.equal(input.getAttribute('aria-invalid'), null);
});

test('chillform addValidator + selector with quotes; CSS dark/focus/motion', () => {
    const env = load('chillform');
    env.document.body.innerHTML = '<form id="f"><input name=\'we"ird\'></form>';
    env.lib.addValidator('even', (v) => !v || Number(v) % 2 === 0);
    const f = env.lib.create('#f', { rules: { 'we"ird': { even: true } } });
    env.document.querySelector('input').value = '3';
    assert.equal(f.validateField('we"ird'), false);
    f.destroy();
    const css = env.document.getElementById('chillform-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.equal(typeof env.lib.init, 'function');
});
