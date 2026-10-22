import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'events',
    global: 'ChillEvents',
    category: 'utility',
    title: 'Events',
    summary: 'A tiny pub/sub event bus with wildcards, once, async emit and isolated handler errors.',
    style: 'create',
    description:
        'ChillEvents is a minimal event emitter for decoupling parts of your UI. Create a bus, `on()` to subscribe (it returns the unsubscribe function), and `emit()` to publish. ' +
        'Event names can be namespaced (`user:login`), and subscribers can use wildcards such as `user:*` or `*`.\n\n' +
        'A handler that throws never stops the others: errors go to `onError` (or `console.error`). `emitAsync()` awaits handlers in order and collects their results, ' +
        'which is handy for "before save" hooks. A lazily created shared bus is available as `ChillEvents.global`.',
    features: [
        '`on` / `once` / `off` / `emit` with an unsubscribe function as the return value',
        'Wildcards: `user:*` matches one segment, `**` matches anything, `*` matches every event',
        '`emitAsync()` runs handlers sequentially and resolves with their return values',
        'Throwing handlers are isolated and reported through `onError`',
        'Leak warning when more than `maxListeners` (100) handlers share one event',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Publish and subscribe',
            description: '`emit(event, payload)` calls every handler with `(payload, eventName)` and returns whether anyone listened. Each `on()` returns its own unsubscribe function.',
            code: `const bus = ChillEvents.create();
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding:10px 14px 10px 30px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px;min-height:70px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, log);
const add = (t) => log.prepend(Object.assign(document.createElement('li'), { textContent: t }));

let off = bus.on('cart:add', (item) => add('Added ' + item.name + ' x' + item.qty));
row.append(
  ChillButton.create({ text: 'Add coffee', size: 'sm', onClick: () => add('emit returned ' + bus.emit('cart:add', { name: 'Coffee', qty: 1 })) }),
  ChillButton.create({ text: 'Unsubscribe', size: 'sm', variant: 'outline', onClick: () => { off(); add('unsubscribed, listeners: ' + bus.listenerCount('cart:add')); } }),
);
cleanup(() => bus.destroy());`,
            height: 200,
        },
        {
            id: 'wildcards',
            title: 'Wildcards and once',
            description: '`user:*` catches `user:login` and `user:logout` but not `user:profile:update`. `once()` fires a single time. `*` sees every event, with the real name as the second argument.',
            code: `const bus = ChillEvents.create();
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const log = document.createElement('ul');
log.style.cssText = 'margin:0;padding:10px 14px 10px 30px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;font-family:ui-monospace,Consolas,monospace;min-height:110px';
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
root.append(row, log);
const add = (t) => log.prepend(Object.assign(document.createElement('li'), { textContent: t }));

bus.on('user:*', (data, name) => add('user:* got ' + name));
bus.on('**', (data, name) => add('** got ' + name));
bus.once('app:ready', () => add('app:ready (only the first time)'));
['user:login', 'user:logout', 'user:profile:update', 'app:ready'].forEach((name) => {
  row.append(ChillButton.create({ text: name, size: 'sm', variant: 'outline', onClick: () => bus.emit(name, {}) }));
});
cleanup(() => bus.destroy());`,
            height: 230,
        },
        {
            id: 'async-hooks',
            title: 'Async hooks with emitAsync',
            description: '`emitAsync()` awaits each handler in order and resolves to an array of their results, so listeners can veto or enrich an action. A failing handler yields `undefined` and is reported to `onError`.',
            code: `const errors = [];
const bus = ChillEvents.create({ onError: (err, event) => errors.push(event + ': ' + err.message) });
bus.on('doc:save', async (doc) => { await new Promise((r) => setTimeout(r, 20)); return 'validated "' + doc.title + '"'; });
bus.on('doc:save', () => { throw new Error('quota exceeded'); });
bus.on('doc:save', async (doc) => 'indexed ' + doc.title.length + ' chars');
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('pre');
out.style.cssText = 'margin:0;padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:12px;white-space:pre-wrap;min-height:80px';
out.textContent = 'Press Save';
const run = async () => {
  const results = await bus.emitAsync('doc:save', { title: 'Quarterly plan' });
  out.textContent = 'results -> ' + JSON.stringify(results) + '\\nonError -> ' + JSON.stringify(errors);
};
root.append(ChillButton.create({ text: 'Save document', size: 'sm', onClick: run }), out);
await run();
cleanup(() => bus.destroy());`,
            height: 170,
        },
        {
            id: 'global-bus',
            title: 'The shared global bus',
            description: '`ChillEvents.global` is one bus per page, handy for loosely coupled modules. Introspect with `eventNames()`, `has()` and `listenerCount()`, and use `off(event)` to drop all handlers of an event.',
            code: `const bus = ChillEvents.global;
root.style.cssText += ';display:flex;flex-direction:column;gap:10px';
const out = document.createElement('div');
out.style.cssText = 'color:var(--chill-text);font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.7';
const note = document.createElement('div');
note.style.cssText = 'padding:12px 16px;border:1px solid var(--chill-border);border-radius:10px;background:var(--chill-bg-secondary);color:var(--chill-text);font-size:13px';
note.textContent = 'No notification yet';
const refresh = () => {
  out.textContent = 'eventNames() -> ' + JSON.stringify(bus.eventNames().filter((n) => n.indexOf('docs:') === 0)) + '\\nhas("docs:notify") -> ' + bus.has('docs:notify') + '\\nlistenerCount("docs:notify") -> ' + bus.listenerCount('docs:notify');
};
const off = bus.on('docs:notify', (msg) => { note.textContent = 'Notification: ' + msg; });
root.append(
  note,
  ChillButton.create({ text: 'Publish from "another module"', size: 'sm', onClick: () => bus.emit('docs:notify', 'Build finished at ' + new Date().toLocaleTimeString()) }),
  out,
);
refresh();
cleanup(() => { off(); bus.off('docs:notify'); });`,
            height: 200,
        },
    ],
    guides: [
        {
            title: 'Naming and wildcards',
            body:
                'Use `:` or `.` to namespace event names: `user:login`, `cart.item.add`. Patterns containing `*` become wildcard subscriptions:\n\n' +
                '- `user:*`: any single segment after `user:` (`user:login`), but not `user:a:b`.\n' +
                '- `**`: matches anything, including several segments.\n' +
                '- `*`: matches every event name.\n\n' +
                'Handlers always receive `(payload, eventName)`, so a wildcard handler can see which event actually fired. ' +
                '`off(pattern)` with a wildcard pattern removes only subscriptions registered with that exact pattern.',
        },
        {
            title: 'Cleanup and errors',
            body:
                'Keep the function returned by `on()` and call it on unmount. `destroy()` clears every handler and turns the bus into a no-op, which is the right call when the owner of a private bus goes away.\n\n' +
                '```js\nconst bus = ChillEvents.create({ maxListeners: 50, onError: (err, event) => report(event, err) });\nconst off = bus.on(\'save\', handler);\n// ...\noff();\n```\n\n' +
                'Subscribing with a non-function or an empty event name throws a `TypeError`.',
        },
    ],
    options: [
        { name: 'onError', type: '(error: Error, event: string) => void', default: 'null', description: 'create(): receives errors thrown by handlers. Without it they are logged with `console.error`.' },
        { name: 'maxListeners', type: 'number', default: '100', description: 'create(): warn once per event when exceeded (`0` disables the warning).' },
    ],
    methods: [
        { signature: 'ChillEvents.create(options?)', on: 'static', description: 'Create a private bus.' },
        { signature: 'ChillEvents.global', description: 'Lazily created page-wide bus (a property, not a method).' },
        { signature: 'bus.on(event, handler)', description: 'Subscribe. Returns an unsubscribe function.' },
        { signature: 'bus.once(event, handler)', description: 'Subscribe for a single emission. Returns an unsubscribe function.' },
        { signature: 'bus.off(event, handler?)', description: 'Remove one handler, or all handlers of `event` when `handler` is omitted. Chainable.' },
        { signature: 'bus.emit(event, payload?)', description: 'Call handlers synchronously. Returns `true` if at least one ran.' },
        { signature: 'bus.emitAsync(event, payload?)', description: 'Await handlers in order; resolves to an array of results (`undefined` for failed handlers).' },
        { signature: 'bus.has(event) / listenerCount(event?)', description: 'Is anyone listening / how many handlers match (omit the argument for the total).' },
        { signature: 'bus.eventNames()', description: 'Exact event names with handlers plus wildcard patterns.' },
        { signature: 'bus.clear()', description: 'Remove all handlers. Chainable.' },
        { signature: 'bus.destroy()', description: 'Clear handlers and ignore future subscriptions and emits.' },
    ],
    a11y: [
        'No UI. When events drive visible updates (toasts, status text), make sure the updated region is announced (`aria-live`).',
        'Do not use events to replace native DOM events on interactive elements; keep real buttons and links keyboard accessible.',
    ],
    tips: [
        'Handlers run in subscription order; exact-name handlers run before wildcard handlers for the same emit.',
        '`emit()` ignores returned promises. Use `emitAsync()` when you need to wait for them.',
        'Use a private bus per feature and the global bus only for truly cross-cutting messages, so ownership stays clear.',
        'In React or Vue, subscribe in an effect and return the unsubscribe function for cleanup.',
    ],
    related: ['hotkey', 'provider', 'storage', 'config'],
    keywords: ['pubsub', 'emitter', 'event bus', 'observer', 'mitt', 'wildcard', 'signal'],
};

export default doc;
