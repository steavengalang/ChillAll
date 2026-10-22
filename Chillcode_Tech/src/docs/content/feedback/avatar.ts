import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'avatar',
    global: 'ChillAvatar',
    category: 'feedback',
    title: 'Avatar',
    summary: 'User avatars with image, initials or icon fallback, status dots, badges and stacked groups.',
    style: 'create',
    description:
        'ChillAvatar renders a person or entity as an image, falling back to initials (or an icon) when there is no picture or it fails to load. ' +
        '`ChillAvatar.create(options)` returns one avatar element and `ChillAvatar.createGroup(avatars, options)` returns an overlapping stack with a "+N" overflow chip.\n\n' +
        'Initials are derived from `name`, and `color: "auto"` picks a stable colour from it, so the same person always looks the same. ' +
        'The `name`, `status` and counts feed the accessible name automatically.',
    features: [
        'Image with automatic fallback to initials or an icon when loading fails',
        'Six sizes, three shapes and named or deterministic "auto" colours',
        'Presence status (online, offline, busy, away) and a corner badge with `99+` capping',
        'Avatar groups with overflow chip and optional "+N" click handler',
        'Accessible: `role="img"` with a name that includes the status',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Initials, auto colours and shapes',
            description: 'Without `src`, initials come from the name. `color: "auto"` derives a consistent colour from it.',
            code: `root.style.cssText += ';display:flex;gap:12px;align-items:center;flex-wrap:wrap';
['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton'].forEach((name) => {
  root.append(ChillAvatar.create({ name, color: 'auto' }));
});
root.append(
  ChillAvatar.create({ name: 'Square Sam', shape: 'square', color: 'primary' }),
  ChillAvatar.create({ name: 'Rounded Rae', shape: 'rounded', color: 'success' }),
);`,
        },
        {
            id: 'sizes',
            title: 'Sizes',
            description: 'Six sizes from `xs` (24px) to `2xl` (80px).',
            code: `root.style.cssText += ';display:flex;gap:12px;align-items:center;flex-wrap:wrap';
['xs', 'sm', 'md', 'lg', 'xl', '2xl'].forEach((size) => {
  root.append(ChillAvatar.create({ name: 'Priya Nair', size, color: 'auto' }));
});`,
        },
        {
            id: 'status-badge',
            title: 'Status and badge',
            description: '`status` adds a presence dot, `badge` adds a corner counter. Numbers above `badgeMax` (default 99) show as "99+".',
            code: `root.style.cssText += ';display:flex;gap:20px;align-items:center;flex-wrap:wrap';
root.append(
  ChillAvatar.create({ name: 'Noah Kim', status: 'online', size: 'lg', color: 'auto' }),
  ChillAvatar.create({ name: 'Mia Costa', status: 'busy', size: 'lg', color: 'auto' }),
  ChillAvatar.create({ name: 'Leo Brandt', status: 'away', size: 'lg', color: 'auto' }),
  ChillAvatar.create({ name: 'Zoe Adams', status: 'offline', size: 'lg', color: 'auto' }),
  ChillAvatar.create({ name: 'Inbox', badge: 128, size: 'lg', color: 'secondary' }),
  ChillAvatar.create({ name: 'Alerts', badge: 3, badgeMax: 9, size: 'lg', color: 'error' }),
);`,
        },
        {
            id: 'images-fallback',
            title: 'Images and fallback',
            description: 'A working `src` shows the picture. A broken one falls back to the initials, and `icon` provides a fallback for anonymous users.',
            code: `const png = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#6366f1"/><circle cx="40" cy="32" r="14" fill="#fff"/><rect x="16" y="52" width="48" height="28" rx="14" fill="#fff"/></svg>');
const userIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>';
root.style.cssText += ';display:flex;gap:12px;align-items:center';
root.append(
  ChillAvatar.create({ name: 'With photo', src: png, size: 'xl' }),
  ChillAvatar.create({ name: 'Broken Link', src: 'https://invalid.invalid/missing.png', size: 'xl', color: 'auto' }),
  ChillAvatar.create({ icon: userIcon, alt: 'Guest', size: 'xl', color: 'secondary' }),
);`,
        },
        {
            id: 'group',
            title: 'Avatar group',
            description: '`createGroup()` stacks avatars and collapses the rest into a "+N" chip. With `onMoreClick` the chip becomes a real button.',
            code: `const people = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Tim Berners-Lee', 'Barbara Liskov']
  .map((name) => ({ name, color: 'auto' }));
const note = document.createElement('p');
note.style.cssText = 'font-size:13px;color:var(--chill-text);margin:12px 0 0';
note.textContent = 'Click the +N chip';
const group = ChillAvatar.createGroup(people, {
  max: 4, size: 'lg',
  onMoreClick: (e, hidden) => { note.textContent = 'Hidden: ' + hidden.map((p) => p.name).join(', '); },
});
root.append(group, note);
cleanup(() => group.chillavatar.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Fallback order',
            body:
                'When `src` is set an `<img>` is rendered; if it errors it is removed and the fallback appears. The fallback is the `icon` markup if you gave one, otherwise the initials of `name` (first letters of the first and last word, or the first two characters of a single word, or `?` without a name).\n\n' +
                '`ChillAvatar.getInitials(name)` is exported if you need the same logic elsewhere.',
        },
        {
            title: 'Groups and paged lists',
            body:
                'Pass the people you have loaded as the array and the real total as `total` so the chip shows the correct number:\n\n' +
                '```js\nChillAvatar.createGroup(firstPage, {\n  max: 5, total: 42,\n  onMoreClick(event, hiddenAvatars) { openMembersDialog(); },\n});\n```\n\n' +
                '`ChillAvatar.group` is an alias of `createGroup`. Each element has `el.chillavatar.destroy()`; destroying a group destroys its avatars.',
        },
        {
            title: 'Theming',
            body:
                'Surfaces and status colours are CSS variables:\n\n' +
                '```css\n:root {\n  --chillavatar-online: #16a34a;\n  --chillavatar-border: #ffffff;\n}\n```',
        },
    ],
    options: [
        { name: 'name', type: 'string', default: 'undefined', description: 'Used for initials, the accessible name and the default tooltip.' },
        { name: 'src', type: 'string', default: 'undefined', description: 'Image URL. Falls back to the icon or initials when it fails to load.' },
        { name: 'alt', type: 'string', default: 'undefined', description: 'Accessible name override (defaults to `name`).' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Diameter: 24, 32, 40, 48, 64 or 80 px.' },
        { name: 'shape', type: "'circle' | 'square' | 'rounded'", default: "'circle'", description: 'Outline shape.' },
        { name: 'color', type: "'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'auto'", default: 'undefined', description: 'Fallback background. `auto` derives a stable colour from `name`.' },
        { name: 'icon', type: 'string', default: 'undefined', description: 'Trusted icon markup (such as an SVG) used as the fallback instead of initials. Inserted as HTML, so never pass user input.' },
        { name: 'status', type: "'online' | 'offline' | 'busy' | 'away'", default: 'undefined', description: 'Presence dot, also appended to the accessible name.' },
        { name: 'badge', type: 'number | string', default: 'undefined', description: 'Corner counter. Numbers above `badgeMax` show as "max+".' },
        { name: 'badgeMax', type: 'number', default: '99', description: 'Cap for numeric badges.' },
        { name: 'title', type: 'string', default: 'name', description: 'Native tooltip text.' },
        { name: 'group: max', type: 'number', default: '5', description: '`createGroup`: visible avatars; the rest collapse into "+N".' },
        { name: 'group: total', type: 'number', default: 'avatars.length', description: '`createGroup`: total people when the array only holds a page.' },
        { name: 'group: size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: '`createGroup`: shared size (overrides each avatar\'s `size`).' },
        { name: 'group: ariaLabel', type: 'string', default: "'N people'", description: '`createGroup`: accessible name of the group.' },
        { name: 'group: onMoreClick', type: '(event: MouseEvent, hidden: AvatarOptions[]) => void', default: 'undefined', description: '`createGroup`: makes the "+N" chip a button and receives the hidden avatars.' },
    ],
    methods: [
        { signature: 'ChillAvatar.create(options?)', on: 'static', description: 'Build one avatar element.' },
        { signature: 'ChillAvatar.createGroup(avatars, options?)', on: 'static', description: 'Build a stacked group from an array of avatar options.' },
        { signature: 'ChillAvatar.group(avatars, options?)', on: 'static', description: 'Alias of `createGroup`.' },
        { signature: 'ChillAvatar.getInitials(name)', on: 'static', description: 'Returns the initials used for a name.' },
        { signature: 'ChillAvatar.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'el.chillavatar.destroy()', description: 'Remove the avatar (or group) from the DOM and detach listeners.' },
    ],
    cssVars: [
        { name: '--chillavatar-bg / --chillavatar-text', description: 'Default fallback surface and text colour.' },
        { name: '--chillavatar-border', description: 'Ring around grouped avatars and status dots.' },
        { name: '--chillavatar-ring', description: 'Focus ring of the "+N" button.' },
        { name: '--chillavatar-online / -offline / -busy / -away', description: 'Status dot colours.' },
    ],
    a11y: [
        'Each avatar has `role="img"` and `aria-label` from `alt` or `name`; a status is appended ("Ada Lovelace, online").',
        'Initials, icons and the status dot are `aria-hidden`; the inner image has an empty `alt` so the name is announced once.',
        'Groups have `role="group"` with an `aria-label` ("N people" by default). The "+N" chip is labelled "N more people".',
        'With `onMoreClick` the chip is a native `<button>`, so Enter and Space work and a focus ring is shown.',
    ],
    tips: [
        'Always pass `name`, even with an image: it supplies the accessible name and the fallback initials.',
        'Use `icon` only with markup you wrote; it is inserted as HTML.',
        'In React, create avatars in an effect and append them to a ref, or render the same classes in JSX.',
        'The module is safe to import on the server; create elements in the browser only.',
    ],
    related: ['badge', 'tag', 'tooltip', 'card'],
    keywords: ['profile picture', 'user', 'initials', 'presence', 'people', 'face pile'],
};

export default doc;
