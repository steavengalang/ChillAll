import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'notify',
    global: 'ChillNotify',
    category: 'core',
    title: 'Notify',
    summary: 'Stackable toast notifications with actions, countdown bar, six positions and a visible-count queue.',
    style: 'static',
    description:
        'ChillNotify shows non-blocking notifications in any screen corner. Each one can carry a title, a message, action buttons and a countdown bar that pauses on hover and keyboard focus. ' +
        'Call `ChillNotify.success()`, `error()`, `warning()` or `info()` with an options object and keep the numeric id it returns to close it later.\n\n' +
        'At most `maxVisible` (default 5) notifications are shown at once; the rest wait in a queue and appear as slots free up. Titles and messages are inserted as **text**; use `html: true` only for trusted markup. ' +
        'It sits above ChillModal (z-index 10002) and is safe to import on the server, where every call is a no-op that still returns an id.',
    features: [
        'Four types and six positions, stacked per corner',
        'Countdown progress bar that pauses on hover and keyboard focus',
        'Action buttons (Undo, Retry...) with their own handlers',
        'Queue with a configurable `maxVisible` limit',
        '`onClose(id, reason)` tells you whether it timed out, was dismissed, acted on or cleared',
        'Accessible live regions: errors use `role="alert"`, the rest `role="status"`',
    ],
    examples: [
        {
            id: 'types',
            title: 'Types',
            description: 'Four helpers, one per type. Each returns the notification id.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const add = (label, fn) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.addEventListener('click', fn);
  root.append(b);
};
add('Success', () => ChillNotify.success({ title: 'Saved', message: 'Your changes are live.' }));
add('Error', () => ChillNotify.error({ title: 'Upload failed', message: 'The file exceeds 10 MB.' }));
add('Warning', () => ChillNotify.warning({ title: 'Low storage', message: '92% of your plan is used.' }));
add('Info', () => ChillNotify.info({ message: 'A new version is available.' }));
cleanup(() => ChillNotify.destroy());`,
        },
        {
            id: 'positions',
            title: 'Positions',
            description: 'Six positions. Notifications in the same position stack in one container; different positions never interfere.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].forEach((position) => {
  const b = document.createElement('button');
  b.textContent = position;
  b.addEventListener('click', () => ChillNotify.show({ type: 'info', message: 'Shown at ' + position, position, duration: 3000 }));
  root.append(b);
});
cleanup(() => ChillNotify.destroy());`,
        },
        {
            id: 'actions',
            title: 'Undo action with a persistent notice',
            description: 'Add `actions` for in-notification buttons. By default clicking one also closes the notification (set `close: false` to keep it). `duration: 0` makes a notice persistent.',
            manual: true,
            code: `const list = document.createElement('ul');
list.style.cssText = 'padding-left:18px;color:var(--chill-text)';
['Quarterly report.pdf', 'Team photo.jpg'].forEach((name) => {
  const li = document.createElement('li');
  li.textContent = name + ' ';
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.addEventListener('click', () => {
    li.hidden = true;
    ChillNotify.info({
      message: '"' + name + '" deleted',
      duration: 8000,
      position: 'bottom-left',
      actions: [{ text: 'Undo', primary: true, onClick: () => { li.hidden = false; } }],
    });
  });
  li.append(del);
  list.append(li);
});
const retry = document.createElement('button');
retry.textContent = 'Simulate failure';
retry.addEventListener('click', () => ChillNotify.error({
  title: 'Sync failed',
  message: 'We could not reach the server.',
  duration: 0,
  actions: [{ text: 'Retry', primary: true, onClick: () => ChillNotify.success({ message: 'Back online' }) }, { text: 'Dismiss' }],
}));
root.append(list, retry);
cleanup(() => ChillNotify.destroy());`,
        },
        {
            id: 'queue-control',
            title: 'Queue, ids and onClose',
            description: '`configure({ maxVisible })` limits how many show at once; extra ones queue. Use the returned id with `close(id)`, and `onClose` to learn why it ended.',
            manual: true,
            code: `ChillNotify.configure({ maxVisible: 3 });
const log = document.createElement('p');
log.style.cssText = 'font-size:13px;color:var(--chill-text)';
log.textContent = 'Click "Send 6": only 3 appear, the rest queue.';
const send = document.createElement('button');
send.textContent = 'Send 6';
send.addEventListener('click', () => {
  for (let i = 1; i <= 6; i++) {
    ChillNotify.info({
      title: 'Message ' + i,
      message: 'Dismiss one to reveal the next.',
      duration: 6000,
      onClose: (id, reason) => { log.textContent = 'Notification ' + id + ' closed: ' + reason; },
    });
  }
});
const clear = document.createElement('button');
clear.textContent = 'Close all';
clear.addEventListener('click', () => ChillNotify.closeAll());
root.append(send, ' ', clear, log);
cleanup(() => { ChillNotify.destroy(); ChillNotify.configure({ maxVisible: 5 }); });`,
        },
        {
            id: 'custom-options',
            title: 'Progress, hover and HTML',
            description: 'Turn off the progress bar or the close button, disable pause-on-hover, or render trusted HTML in the message.',
            manual: true,
            code: `root.style.cssText += ';display:flex;gap:8px;flex-wrap:wrap';
const add = (label, opts) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.addEventListener('click', () => ChillNotify.show(opts));
  root.append(b);
};
add('No progress bar', { type: 'success', message: 'Quiet and simple', showProgress: false, closable: false, duration: 3000 });
add('Does not pause', { type: 'warning', message: 'Hovering will not stop this timer', pauseOnHover: false, duration: 4000 });
add('Trusted HTML', { type: 'info', title: 'Release notes', html: true, message: 'Version <strong>2.0</strong> is out. <em>(static, trusted markup)</em>', duration: 6000 });
cleanup(() => ChillNotify.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Showing and closing notifications',
            body:
                '```js\nconst id = ChillNotify.success({ title: \'Saved\', message: \'Your changes are live.\' });\nChillNotify.close(id);      // dismiss one\nChillNotify.closeAll();     // dismiss everything, including queued ones\n```\n\n' +
                '`show(options)` takes a `type`; `success`, `error`, `warning` and `info` are shortcuts. All return a numeric id. Closing an id that is still queued simply drops it. ' +
                '`ChillNotify.destroy()` removes every notification, timer and container immediately without calling `onClose`: use it on teardown.',
        },
        {
            title: 'Durations, pausing and the queue',
            body:
                'The default `duration` is 5000 ms and `0` means persistent (no countdown, no progress bar). The countdown pauses while the pointer is over a notification **or** keyboard focus is inside it, and resumes with the remaining time. ' +
                'Disable that per notification with `pauseOnHover: false`.\n\n' +
                '`ChillNotify.configure({ maxVisible: 3 })` sets how many can be visible across all positions; a notification starts its timer only when it is actually shown. ' +
                'A value that is not a positive number removes the limit.',
        },
        {
            title: 'Close reasons',
            body:
                '`onClose(id, reason)` fires once per notification with one of:\n\n' +
                '- `\'timeout\'`: the countdown ended\n- `\'close\'`: the × button or `ChillNotify.close(id)`\n- `\'action\'`: an action button closed it\n- `\'closeAll\'`: `ChillNotify.closeAll()`\n\n' +
                'Use it to clean up state, for example to commit a deletion once the Undo window has passed without an action.',
        },
    ],
    options: [
        { name: 'type', type: "'info' | 'success' | 'error' | 'warning'", default: "'info'", description: 'Icon and accent colour. Unknown values fall back to `info`.' },
        { name: 'title', type: 'string', default: "''", description: 'Bold heading, rendered as text.' },
        { name: 'message', type: 'string', default: "''", description: 'Body, rendered as text unless `html` is true.' },
        { name: 'html', type: 'boolean', default: 'false', description: 'Render `message` as HTML. You must sanitise it.' },
        { name: 'duration', type: 'number', default: '5000', description: 'Milliseconds before auto-close; `0` keeps it open.' },
        { name: 'position', type: "'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'", default: "'top-right'", description: 'Where to show the notification.' },
        { name: 'showProgress', type: 'boolean', default: 'true', description: 'Show the countdown bar (only when `duration > 0`).' },
        { name: 'closable', type: 'boolean', default: 'true', description: 'Show the dismiss button.' },
        { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Pause the countdown on hover and on keyboard focus.' },
        { name: 'actions', type: 'Action[]', default: '[]', description: 'Buttons shown in the notification.' },
        { name: 'actions[].text', type: 'string', default: "''", description: 'Button label, rendered as text.' },
        { name: 'actions[].primary', type: 'boolean', default: 'false', description: 'Emphasised button style.' },
        { name: 'actions[].close', type: 'boolean', default: 'true', description: 'Close the notification after the click.' },
        { name: 'actions[].onClick', type: '() => void', default: 'undefined', description: 'Click handler.' },
        { name: 'onClose', type: "(id: number, reason: 'timeout' | 'close' | 'action' | 'closeAll') => void", default: 'undefined', description: 'Called once when the notification ends.' },
    ],
    methods: [
        { signature: 'ChillNotify.show(options)', on: 'static', description: 'Show a notification. Returns its numeric id.' },
        { signature: 'ChillNotify.success(options) / error / warning / info', on: 'static', description: 'Shortcuts that set `type`. `ChillNotify.success(options)` returns the id.' },
        { signature: 'ChillNotify.close(id)', on: 'static', description: 'Close a visible or queued notification.' },
        { signature: 'ChillNotify.closeAll()', on: 'static', description: 'Close everything and empty the queue (`onClose` reason `closeAll`).' },
        { signature: 'ChillNotify.configure({ maxVisible })', on: 'static', description: 'Set the maximum number of visible notifications (default 5). Returns the current settings.' },
        { signature: 'ChillNotify.destroy()', on: 'static', description: 'Remove all notifications, timers and containers immediately; clears the queue.' },
        { signature: 'ChillNotify.injectCSS()', on: 'static', description: 'Inject the stylesheet now (done automatically on first use).' },
        { signature: 'ChillNotify.version', description: 'Version string of the library.' },
    ],
    cssVars: [
        { name: '--chillnotify-bg / --chillnotify-text / --chillnotify-text-light', description: 'Surface and text colours.' },
        { name: '--chillnotify-border', description: 'Border and progress track colour.' },
        { name: '--chillnotify-success / -error / -warning / -info', description: 'Accent colour per type (icon, progress bar).' },
    ],
    a11y: [
        'Each position is a `role="region"` labelled "Notifications" with `aria-live="polite"`; new notifications are announced.',
        'Error notifications use `role="alert"`, the others `role="status"`.',
        'The dismiss button has `aria-label="Dismiss notification"`; action buttons are real buttons reachable with Tab.',
        'Keyboard focus inside a notification pauses its countdown, so keyboard users get time to act.',
        'The progress bar is `aria-hidden`; animations are disabled under `prefers-reduced-motion`.',
    ],
    tips: [
        'For a single short confirmation, `ChillAlert.toast()` is lighter. ChillNotify is for titles, actions and queues.',
        'Keep messages short. Put the next step in an action button rather than in a long message.',
        'On screens under 640px notifications stretch to the full width with an 8px margin.',
        'In React, call `ChillNotify` from handlers; call `ChillNotify.destroy()` only on full teardown, since it affects every notification on the page.',
        'SSR-safe: on the server `show()` does nothing and returns an id.',
    ],
    related: ['alert', 'modal', 'toast'],
    keywords: ['toast', 'snackbar', 'notification', 'message', 'banner', 'undo'],
};

export default doc;
