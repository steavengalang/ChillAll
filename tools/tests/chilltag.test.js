const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../env');

test('tag escapes text and avatar url, ChillChip alias kept', () => {
    const { lib, document } = load('chilltag');
    assert.equal(lib.ChillChip, lib);
    const t = lib.create({ text: '<img src=x onerror=1>', avatar: '"><script>x</script>' });
    document.body.appendChild(t);
    assert.equal(t.querySelectorAll('img').length, 1); // only the avatar img
    assert.equal(t.querySelector('script'), null);
    assert.equal(t.querySelector('.chilltag-text').textContent, '<img src=x onerror=1>');
});

test('tag colour presets and unknown colour ignored', () => {
    const { lib } = load('chilltag');
    assert.ok(lib.create({ color: 'purple' }).classList.contains('chilltag-c-purple'));
    assert.ok(![...lib.create({ color: 'nope' }).classList].some(c => c.startsWith('chilltag-c-')));
});

test('tag removable: accessible button, onRemove, auto-remove', () => {
    const { lib, document } = load('chilltag');
    let got = null;
    const t = lib.create({ text: 'Design', removable: true, onRemove: el => { got = el; } });
    document.body.appendChild(t);
    const btn = t.querySelector('button.chilltag-close');
    assert.equal(btn.getAttribute('aria-label'), 'Remove Design');
    btn.click();
    assert.equal(got, t);
    assert.equal(t.parentNode, null);
});

test('tag onRemove with autoRemove:false keeps element', () => {
    const { lib, document } = load('chilltag');
    const t = lib.create({ text: 'a', removable: true, autoRemove: false, onRemove() {} });
    document.body.appendChild(t);
    t.querySelector('.chilltag-close').click();
    assert.equal(t.parentNode, document.body);
    t.destroy();
    assert.equal(t.parentNode, null);
});

test('clickable tag is keyboard operable; remove click does not trigger onClick', () => {
    const { lib, document, window } = load('chilltag');
    let clicks = 0, removed = 0;
    const t = lib.create({ text: 'k', onClick: () => clicks++, removable: true, onRemove: () => removed++ });
    document.body.appendChild(t);
    assert.equal(t.getAttribute('role'), 'button');
    assert.equal(t.tabIndex, 0);
    t.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    t.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    assert.equal(clicks, 2);
    t.querySelector('.chilltag-close').click();
    assert.equal(clicks, 2);
    assert.equal(removed, 1);
});

test('createInput add/remove/maxTags/destroy and live region', () => {
    const { lib, document, window } = load('chilltag');
    const changes = [];
    const w = lib.createInput({ maxTags: 2, onChange: t => changes.push(t) });
    document.body.appendChild(w);
    const input = w.querySelector('input');
    const press = (key) => input.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    input.value = 'a'; press('Enter');
    input.value = 'b'; press(',');
    input.value = 'a'; press('Enter'); // duplicate
    input.value = 'c'; press('Enter'); // over max
    assert.deepEqual(Array.from(w.getTags()), ['a', 'b']);
    assert.equal(w.querySelectorAll('.chilltag').length, 2);
    assert.equal(w.querySelector('[role=status]').textContent, 'Added b');
    input.value = ''; press('Backspace');
    assert.deepEqual(Array.from(w.getTags()), ['a']);
    assert.equal(w.querySelectorAll('.chilltag').length, 1);
    w.querySelector('.chilltag-close').click();
    assert.deepEqual(Array.from(w.getTags()), []);
    assert.deepEqual(Array.from(changes[changes.length - 1]), []);
    w.setTags(['x', 'y']);
    assert.deepEqual(Array.from(w.getTags()), ['x', 'y']);
    w.destroy();
    assert.equal(document.querySelector('.chilltag-input-wrapper'), null);
});

test('tag css dark override', () => {
    const { lib, document } = load('chilltag');
    lib.create({});
    const css = document.getElementById('chilltag-styles').textContent;
    assert.match(css, /:root\[data-theme="dark"\], :root\.dark/);
    assert.match(css, /:root:not\(\[data-theme="light"\]\):not\(\.light\)/);
    assert.match(css, /focus-visible/);
});
