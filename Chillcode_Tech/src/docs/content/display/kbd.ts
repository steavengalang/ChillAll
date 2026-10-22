import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'kbd',
    global: 'ChillKbd',
    category: 'display',
    title: 'Kbd',
    summary: 'Keyboard-key chips that show OS-aware symbols, such as Cmd K on macOS and Ctrl+K elsewhere.',
    style: 'init',
    description:
        'ChillKbd turns shortcut strings like `mod+shift+p` into styled `<kbd>` chips. The special `mod` key is Cmd on macOS and Ctrl everywhere else, ' +
        'and keys such as Enter, Esc, Shift and the arrows get proper symbols per platform.\n\n' +
        'Use `ChillKbd.create(shortcut, options)` to get a new element, `ChillKbd.init(target, options)` to enhance `<kbd>` elements already in your HTML, ' +
        'and `ChillKbd.format(shortcut)` for plain text such as tooltips or `aria-keyshortcuts`. Every chip also contains a visually hidden full key name ("Command", "Shift"), so screen readers never read bare symbols.',
    features: [
        'Parses `ctrl+k`, `g i` (sequence) and `ctrl++`; case-insensitive aliases like `cmd`, `option`, `esc`',
        '`mod` resolves to Cmd or Ctrl by platform; force one with `platform: "mac" | "other"`',
        'Three sizes and three variants (default, outline, flat)',
        'Screen-reader names for symbol keys; separators are `aria-hidden`',
        'Enhancing is idempotent and `destroy()` restores the original content',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Create a shortcut',
            description: '`create()` returns a `<kbd>` element. `mod` becomes Cmd on macOS, Ctrl elsewhere.',
            code: `root.style.cssText += ';display:flex;gap:16px;flex-wrap:wrap;align-items:center;color:var(--chill-text)';
['mod+k', 'mod+shift+p', 'ctrl+alt+delete', 'esc', 'enter'].forEach((combo) => root.append(ChillKbd.create(combo)));`,
        },
        {
            id: 'platform',
            title: 'Force a platform',
            description: 'Show both styles side by side in docs with `platform`. `separator` overrides the default (empty on Mac, `+` elsewhere).',
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px;color:var(--chill-text)';
const row = (label, opts) => {
  const r = document.createElement('div');
  r.style.cssText = 'display:flex;align-items:center;gap:12px';
  const t = document.createElement('span'); t.textContent = label; t.style.width = '90px';
  r.append(t, ChillKbd.create('mod+shift+k', opts));
  root.append(r);
};
row('macOS', { platform: 'mac' });
row('Windows', { platform: 'other' });
row('Custom sep', { platform: 'other', separator: ' then ' });`,
        },
        {
            id: 'variants',
            title: 'Sizes and variants',
            description: '`sm`, `md` and `lg`, in the `default`, `outline` and `flat` looks.',
            code: `root.style.cssText += ';display:grid;grid-template-columns:repeat(3,auto);gap:14px;justify-content:start;align-items:center';
['sm', 'md', 'lg'].forEach((size) => {
  ['default', 'outline', 'flat'].forEach((variant) => root.append(ChillKbd.create('ctrl+s', { size, variant, platform: 'other' })));
});`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` upgrades `<kbd>` elements and anything with `data-chill-kbd`, reading the shortcut from the attribute or the text. Pass a NodeList to scope it.',
            code: `root.innerHTML = '<p style="color:var(--chill-text);line-height:2.2">Open the palette with <kbd data-chill-kbd="mod+k"></kbd>, search with <kbd>Ctrl+F</kbd> and jump with <kbd>g i</kbd>. Press <kbd>Esc</kbd> to close.</p>';
const inst = ChillKbd.init(root.querySelectorAll('kbd'), { size: 'sm' });
cleanup(() => inst.destroy());`,
        },
        {
            id: 'format',
            title: 'Plain text and tooltips',
            description: '`format()` returns text such as `Ctrl+K`, ideal for `title` or `aria-keyshortcuts`. `parse()` returns the normalised key list.',
            code: `const btn = document.createElement('button');
const shortcut = 'mod+k';
btn.textContent = 'Search';
btn.title = 'Search (' + ChillKbd.format(shortcut) + ')';
btn.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
const info = document.createElement('p');
info.style.cssText = 'color:var(--chill-text);font-size:13px';
info.textContent = 'Tooltip: ' + btn.title + ' | keys: ' + ChillKbd.parse('ctrl+shift+p').join(', ') + ' | mac: ' + ChillKbd.isMac();
root.append(btn, info);`,
        },
    ],
    guides: [
        {
            title: 'Shortcut syntax',
            body:
                'Join keys with `+` (`ctrl+k`) or whitespace (`g i`, a sequence). A trailing `++` means the plus key itself (`ctrl++`). ' +
                'Aliases: `mod`, `cmd` / `command` / `meta` / `win` / `super`, `ctrl` / `control`, `alt` / `option` / `opt`, `shift`, `enter` / `return`, `esc` / `escape`, `tab`, `space`, ' +
                '`backspace`, `delete` / `del`, `up` / `down` / `left` / `right`, `pageup` / `pagedown`, `home`, `end` and `capslock`. Single characters are upper-cased and `F1` to `F12` work.\n\n' +
                'Unknown tokens are shown as written, so `ChillKbd.create("Fn")` is fine.',
        },
        {
            title: 'init vs create',
            body:
                '- **`create(shortcut, options)`** returns a `<kbd>` element holding one chip per key.\n' +
                '- **`init(target, options)`** accepts a selector, an element, a NodeList, or only an options object. With no target it enhances every `kbd, [data-chill-kbd]` on the page, so scope it in apps that already use `<kbd>` elsewhere. ' +
                'It returns `{ elements, refresh(), destroy() }`.\n\n' +
                'Chips generated by ChillKbd are skipped when `init()` runs again, so calling it twice is safe.',
        },
    ],
    options: [
        { name: 'platform', type: "'auto' | 'mac' | 'other'", default: "'auto'", description: 'Force an OS style; `auto` detects the platform.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chip size.' },
        { name: 'variant', type: "'default' | 'outline' | 'flat'", default: "'default'", description: 'Visual style.' },
        { name: 'separator', type: 'string', default: "'' on Mac, '+' elsewhere", description: 'Text between chips (`aria-hidden`).' },
        { name: 'selector', type: 'string', default: "'kbd, [data-chill-kbd]'", description: '`init()` only: which elements to enhance when no target is given.' },
    ],
    methods: [
        { signature: 'ChillKbd.create(shortcut, options?)', on: 'static', description: 'Build a new `<kbd>` element for a shortcut.' },
        { signature: 'ChillKbd.init(target?, options?)', on: 'static', description: 'Enhance elements; returns `{ elements, refresh(), destroy() }`.' },
        { signature: 'ChillKbd.format(shortcut, options?)', on: 'static', description: 'Plain-text rendering such as `"Ctrl+K"` or `"⌘K"`.' },
        { signature: 'ChillKbd.parse(shortcut)', on: 'static', description: 'Normalised list of key tokens.' },
        { signature: 'ChillKbd.isMac()', on: 'static', description: 'Whether the detected platform is macOS.' },
        { signature: 'ChillKbd.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.refresh()', description: 'Re-render the enhanced elements.' },
        { signature: 'instance.destroy()', description: 'Restore the original text and classes.' },
    ],
    cssVars: [
        { name: '--chillkbd-bg', description: 'Key background.' },
        { name: '--chillkbd-color', description: 'Key text colour.' },
        { name: '--chillkbd-border', description: 'Key border colour.' },
        { name: '--chillkbd-shadow', description: 'Bottom edge shadow giving the key depth.' },
        { name: '--chillkbd-sep', description: 'Separator colour.' },
    ],
    a11y: [
        'Each key is a native `<kbd>` element; symbol keys include a visually hidden full name ("Command", "Shift") and the symbol is `aria-hidden`.',
        'Separators between keys are `aria-hidden`.',
        'Also set `aria-keyshortcuts` on the control that the shortcut triggers; `ChillKbd.format()` helps build tooltip text.',
    ],
    tips: [
        'ChillKbd only displays shortcuts; it does not register key handlers.',
        'Platform detection needs `navigator`; on the server use `platform: "other"` or `"mac"` so server and client HTML match, then call `refresh()`.',
        'Call `init()` with a scoped NodeList in apps where `<kbd>` is also used for other things.',
    ],
    related: ['code', 'tooltip', 'badge'],
    keywords: ['shortcut', 'hotkey', 'key', 'keyboard', 'command palette', 'cmd', 'ctrl'],
};

export default doc;
