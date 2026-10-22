import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'tag',
    global: 'ChillTag',
    category: 'feedback',
    title: 'Tag',
    summary: 'Tags and chips: coloured, clickable or removable labels, plus a type-and-press-Enter tag input.',
    style: 'create',
    description:
        'ChillTag renders compact labels for categories, filters and selections. `ChillTag.create(options)` returns a tag element that can be coloured, made clickable (a keyboard-operable toggle button) or removable. ' +
        '`ChillTag.createInput(options)` builds a complete tag field: type, press Enter or comma, and a removable tag appears.\n\n' +
        'Tag text is always inserted as **text**. `html: true` opts in to trusted markup, and `icon` is inserted as HTML, so it must be markup you wrote.',
    features: [
        'Nine preset colours plus primary, success, warning and error variants, in soft or solid style',
        'Three sizes, pill shape, leading icon or avatar image',
        'Clickable tags (Enter and Space) with `selected` state for filter chips',
        'Removable tags with `onRemove` and automatic DOM removal',
        'Tag input with `maxTags`, duplicate protection, Backspace to delete and screen-reader announcements',
    ],
    examples: [
        {
            id: 'colors',
            title: 'Colours, solid and pill',
            description: 'Nine preset colours. `solid` fills the tag and `pill` rounds it fully.',
            height: 140,
            code: `root.style.cssText += ';display:flex;flex-direction:column;gap:12px';
const rows = [{}, { solid: true }, { pill: true }];
rows.forEach((style) => {
  const row = document.createElement('div');
  row.className = 'chilltag-group';
  ChillTag.colors.forEach((color) => row.append(ChillTag.create({ text: color, color, ...style })));
  root.append(row);
});`,
        },
        {
            id: 'sizes-icons',
            title: 'Sizes, icons and avatars',
            description: 'Sizes `sm`, `md` and `lg`. Add a trusted SVG `icon`, or an `avatar` image URL (set through the DOM, never parsed as HTML).',
            code: `const avatar = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#8b5cf6"/><circle cx="20" cy="16" r="7" fill="#fff"/><rect x="8" y="27" width="24" height="14" rx="7" fill="#fff"/></svg>');
const star = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/></svg>';
root.style.cssText += ';display:flex;gap:8px;align-items:center;flex-wrap:wrap';
root.append(
  ChillTag.create({ text: 'Small', size: 'sm', color: 'blue' }),
  ChillTag.create({ text: 'Large', size: 'lg', color: 'blue' }),
  ChillTag.create({ text: 'Featured', icon: star, color: 'amber', pill: true }),
  ChillTag.create({ text: 'Maya Lindqvist', avatar, color: 'purple', pill: true }),
);`,
        },
        {
            id: 'selectable',
            title: 'Selectable filter chips',
            description: '`onClick` turns a tag into a focusable button with `aria-pressed`. Toggle `selected` yourself and re-render, or swap the element.',
            height: 160,
            code: `const options = ['Open', 'In review', 'Blocked', 'Done'];
const active = new Set(['Open']);
const row = document.createElement('div');
row.className = 'chilltag-group';
root.append(row);
function render() {
  row.querySelectorAll('.chilltag').forEach((t) => t.destroy());
  options.forEach((text) => {
    row.append(ChillTag.create({
      text, pill: true, selected: active.has(text),
      onClick: () => { active.has(text) ? active.delete(text) : active.add(text); render(); },
    }));
  });
}
render();
cleanup(() => row.querySelectorAll('.chilltag').forEach((t) => t.destroy()));`,
        },
        {
            id: 'removable',
            title: 'Removable tags',
            description: '`removable` adds an accessible X button. By default the element is removed after `onRemove`; set `autoRemove: false` to control it yourself.',
            height: 160,
            code: `const log = document.createElement('p');
log.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
log.textContent = 'Remove a tag...';
const row = document.createElement('div');
row.className = 'chilltag-group';
['JavaScript', 'TypeScript', 'CSS', 'Accessibility'].forEach((text, i) => {
  row.append(ChillTag.create({
    text, removable: true, color: ChillTag.colors[i],
    onRemove: (tag) => { log.textContent = 'Removed ' + text; },
  }));
});
root.append(row, log);
cleanup(() => row.querySelectorAll('.chilltag').forEach((t) => t.destroy()));`,
        },
        {
            id: 'input',
            title: 'Tag input',
            description: 'Type and press Enter or comma to add; Backspace on an empty field removes the last tag. `maxTags` caps the list and duplicates are ignored.',
            height: 180,
            code: `const out = document.createElement('p');
out.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
const field = ChillTag.createInput({
  placeholder: 'Add a skill...', color: 'teal', maxTags: 5,
  onChange: (tags) => { out.textContent = tags.length + ' of 5: ' + tags.join(', '); },
});
root.append(field, out);
field.setTags(['Design', 'Research']);
cleanup(() => field.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Tag vs Badge',
            body:
                'Use a **badge** for passive status or counts and a **tag** for items users can pick, filter by or remove. Tags support interaction (`onClick`, `removable`, the input field); badges do not.',
        },
        {
            title: 'Keyboard and removal behaviour',
            body:
                '- A tag with `onClick` gets `tabindex="0"` and `role="button"`; Enter and Space activate it. If `selected` is set it also exposes `aria-pressed`.\n' +
                '- A removable tag that is also clickable (so focusable) can be removed with Delete or Backspace when the tag itself is focused.\n' +
                '- The X button is always a native button labelled "Remove &lt;text&gt;" (override with `removeLabel`).\n' +
                '- `onRemove(tag)` runs first; unless `autoRemove: false` the element is then destroyed.\n\n' +
                '`tag.destroy()` and `tag.chilltag.destroy()` remove the element and its listeners; `tag.chilltag.setText(text)` updates the label.',
        },
        {
            title: 'Using the tag input',
            body:
                '`createInput()` returns a wrapper element with `getTags()`, `setTags(list)`, `addTag(text)`, `removeTag(text)` and `destroy()`. ' +
                'It trims whitespace, rejects empty and duplicate values, honours `maxTags`, and announces additions and removals in a polite live region.\n\n' +
                '```js\nconst field = ChillTag.createInput({ onChange: (tags) => save(tags) });\nform.append(field);\nfield.setTags(savedTags);\n```\n\n' +
                '`setTags()` replaces the list and fires `onChange` once.',
        },
    ],
    options: [
        { name: 'text / label', type: 'string', default: "''", description: 'Tag text (escaped). `text` wins over `label`.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Treat the text as HTML (caller must sanitise).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tag size.' },
        { name: 'variant', type: "'primary' | 'success' | 'warning' | 'error'", default: 'undefined', description: 'Semantic colour.' },
        { name: 'color', type: "'blue' | 'green' | 'red' | 'amber' | 'orange' | 'purple' | 'pink' | 'teal' | 'gray'", default: 'undefined', description: 'Preset colour. Unknown values are ignored.' },
        { name: 'solid', type: 'boolean', default: 'false', description: 'Filled style (with `color`).' },
        { name: 'pill', type: 'boolean', default: 'false', description: 'Fully rounded corners.' },
        { name: 'selected', type: 'boolean', default: 'false', description: 'Selected look; with `onClick` also sets `aria-pressed`.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed, not focusable, ignores removal. Sets `aria-disabled`.' },
        { name: 'avatar', type: 'string', default: 'undefined', description: 'Image URL shown before the text (set via the DOM).' },
        { name: 'icon', type: 'string', default: 'undefined', description: 'Trusted icon markup such as an SVG. Inserted as HTML.' },
        { name: 'onClick', type: '(tag: HTMLElement, event: Event) => void', default: 'undefined', description: 'Makes the tag a keyboard-operable button (Enter and Space).' },
        { name: 'removable', type: 'boolean', default: 'false', description: 'Add a remove button.' },
        { name: 'onRemove', type: '(tag: HTMLElement) => void', default: 'undefined', description: 'Called when the tag is removed.' },
        { name: 'autoRemove', type: 'boolean', default: 'true', description: 'Remove the element from the DOM after `onRemove`.' },
        { name: 'removeLabel', type: 'string', default: "'Remove <text>'", description: 'Accessible name of the remove button.' },
        { name: 'input: placeholder', type: 'string', default: "'Add a tag...'", description: '`createInput`: placeholder text.' },
        { name: 'input: ariaLabel', type: 'string', default: 'placeholder', description: '`createInput`: accessible name of the text field.' },
        { name: 'input: maxTags', type: 'number', default: 'undefined', description: '`createInput`: maximum number of tags.' },
        { name: 'input: size / variant / color', type: 'string', default: 'undefined', description: '`createInput`: appearance of the created tags.' },
        { name: 'input: onChange', type: '(tags: string[]) => void', default: 'undefined', description: '`createInput`: called with a copy of the list after every change.' },
    ],
    methods: [
        { signature: 'ChillTag.create(options?)', on: 'static', description: 'Build a tag element.' },
        { signature: 'ChillTag.createInput(options?)', on: 'static', description: 'Build a tag input field.' },
        { signature: 'ChillTag.colors', description: 'Property (not a function): array of the nine preset colour names.' },
        { signature: 'ChillTag.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'tag.destroy() / tag.chilltag.destroy()', description: 'Remove the tag and its listeners.' },
        { signature: 'tag.chilltag.setText(text)', description: 'Change the label.' },
        { signature: 'input.getTags()', description: 'Returns a copy of the current tag list.' },
        { signature: 'input.setTags(tags)', description: 'Replace all tags; fires `onChange` once.' },
        { signature: 'input.addTag(text) / removeTag(text)', description: 'Add or remove one tag; return whether the list changed.' },
        { signature: 'input.destroy()', description: 'Remove the field, its tags and listeners.' },
    ],
    cssVars: [
        { name: '--chilltag-bg / --chilltag-text', description: 'Default tag and input surface and text colours.' },
        { name: '--chilltag-border', description: 'Border colour.' },
        { name: '--chilltag-primary', description: 'Primary and selected colour (also -success, -warning, -error).' },
        { name: '--chilltag-hover', description: 'Hover background of clickable tags.' },
        { name: '--chilltag-<color>-fg / --chilltag-<color>-rgb', description: 'Text colour and RGB triplet of each preset colour (for example `--chilltag-teal-rgb`).' },
    ],
    a11y: [
        'Clickable tags use `role="button"` with `tabindex="0"`, activate on Enter and Space, and set `aria-pressed` when `selected` is defined.',
        'The remove button is a native `<button>` labelled "Remove <text>"; focusable clickable tags also accept Delete and Backspace.',
        'Disabled tags carry `aria-disabled="true"` and cannot be focused or removed.',
        'The tag input has a labelled text field, `role="group"`, and a visually hidden live region announcing "Added x" and "Removed x".',
        'Transitions are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'Wrap tags in an element with the `chilltag-group` class for a wrapping row with consistent gaps.',
        'To toggle `selected`, rebuild the tag (or swap it); the option is read only at creation time.',
        'Keep your own array as the source of truth and use `onChange` / `onRemove` to sync it.',
        'The module also exports `ChillChip` as an alias on `window`, so `ChillChip.create()` works the same way.',
    ],
    related: ['badge', 'avatar', 'input', 'select'],
    keywords: ['chip', 'label', 'filter', 'token', 'tags input', 'multi select', 'pill'],
};

export default doc;
