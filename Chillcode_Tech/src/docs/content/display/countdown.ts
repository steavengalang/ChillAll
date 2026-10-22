import type { DocEntry } from '../../types';

const doc: DocEntry = {
    id: 'countdown',
    global: 'ChillCountdown',
    category: 'display',
    title: 'Countdown',
    summary: 'Countdown to a date, relative timer or stopwatch with box or inline display and pause/resume.',
    style: 'create',
    description:
        'ChillCountdown shows the time left until a moment (`target`), the time left in a relative timer (`duration`), or elapsed time (`countUp`, a stopwatch). ' +
        'Pick which units to display, the look (`boxes` or `inline`), and react with `onTick` and `onComplete`.\n\n' +
        'Pausing a `duration` timer really stops the clock; in `target` mode `pause()` only freezes the display, and `resume()` jumps back to the real remaining time. ' +
        'Inject `now` to drive the clock from server-synced time or in tests.',
    features: [
        'Absolute target (Date, timestamp or ISO string), relative duration or stopwatch mode',
        'Choose units: the largest shown unit absorbs the rest (for example only minutes and seconds)',
        'Boxes with captions or compact inline `01:30` display, three sizes, custom labels',
        'start, pause, resume and reset, plus `tick` and `complete` events',
        'Screen-reader friendly: announces once a minute instead of every second',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Countdown to a date',
            description: 'Pass a `target`. It counts days, hours, minutes and seconds down and fires `onComplete` at zero.',
            code: `const cd = ChillCountdown.create({
  target: Date.now() + 3 * 86400000 + 4 * 3600000 + 25 * 60000,   // 3 days from now
  onComplete: () => console.log('Launch!'),
});
root.append(cd.element);
cleanup(() => cd.destroy());`,
        },
        {
            id: 'timer',
            title: 'Relative timer with controls',
            description: '`duration` is in milliseconds. Show only minutes and seconds, and control it with `pause()`, `resume()` and `reset()`.',
            height: 190,
            code: `const cd = ChillCountdown.create({
  duration: 90 * 1000,
  units: ['minutes', 'seconds'],
  size: 'lg',
  labels: { minutes: 'Min', seconds: 'Sec' },
  onComplete: () => { status.textContent = 'Time is up!'; },
});
const status = document.createElement('p');
status.style.cssText = 'color:var(--chill-text);margin:8px 0';
status.textContent = 'Focus session';
cd.on('pause', () => { status.textContent = 'Paused'; });
cd.on('resume', () => { status.textContent = 'Focus session'; });
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px';
[['Pause', () => cd.pause()], ['Resume', () => cd.resume()], ['Reset', () => cd.reset()]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(cd.element, status, bar);
cleanup(() => cd.destroy());`,
        },
        {
            id: 'inline',
            title: 'Inline and compact',
            description: '`variant: "inline"` renders `00:45` style text that fits in a sentence, a button or a toast. `showLabels: false` hides captions.',
            code: `const p = document.createElement('p');
p.style.cssText = 'color:var(--chill-text);display:flex;align-items:center;gap:8px';
p.append('Your cart is reserved for ');
const cd = ChillCountdown.create({ duration: 10 * 60 * 1000, units: ['minutes', 'seconds'], variant: 'inline', size: 'sm' });
p.append(cd.element);
root.append(p);
cleanup(() => cd.destroy());`,
        },
        {
            id: 'stopwatch',
            title: 'Stopwatch',
            description: '`countUp: true` counts elapsed time. Give it `autoStart: false` and start it yourself.',
            height: 190,
            code: `const sw = ChillCountdown.create({
  countUp: true,
  duration: 3600 * 1000,                  // optional limit: stops after one hour
  units: ['hours', 'minutes', 'seconds'],
  autoStart: false,
  variant: 'inline',
  size: 'lg',
  ariaLabel: 'Stopwatch',
});
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;margin-top:12px';
[['Start', () => sw.start()], ['Pause', () => sw.pause()], ['Resume', () => sw.resume()], ['Reset', () => sw.reset()]].forEach(([t, fn]) => {
  const b = document.createElement('button'); b.textContent = t; b.onclick = fn; bar.append(b);
});
root.append(sw.element, bar);
cleanup(() => sw.destroy());`,
        },
        {
            id: 'tick',
            title: 'Reacting to ticks',
            description: '`onTick` receives the remaining milliseconds and the unit parts. Use it for progress bars or urgency styling.',
            height: 150,
            code: `const bar = document.createElement('div');
bar.style.cssText = 'height:8px;border-radius:4px;background:var(--chill-bg-secondary);margin-top:12px;overflow:hidden';
const fill = document.createElement('div');
fill.style.cssText = 'height:100%;width:100%;background:#3b82f6;transition:width .4s linear';
bar.append(fill);
const total = 20000;
const cd = ChillCountdown.create({
  duration: total,
  units: ['seconds'],
  size: 'lg',
  onTick: (ms, parts) => { fill.style.width = (ms / total * 100) + '%'; fill.style.background = ms < 5000 ? '#ef4444' : '#3b82f6'; },
});
root.append(cd.element, bar);
cleanup(() => cd.destroy());`,
        },
        {
            id: 'init-existing',
            title: 'Enhance existing markup',
            description: '`init()` reads `data-target` (a date) or `data-duration` (ms) from the element.',
            code: `root.innerHTML = '<div id="sale" data-duration="125000"></div>';
const cd = ChillCountdown.init('#sale', { units: ['minutes', 'seconds'], size: 'sm' });
cleanup(() => cd.destroy());`,
        },
    ],
    guides: [
        {
            title: 'Target, duration and countUp',
            body:
                '- **`target`** is an absolute moment. The countdown always follows the real clock, so it stays correct across tab sleeps.\n' +
                '- **`duration`** is a relative timer in ms. It really pauses and resumes.\n' +
                '- **`countUp`** with a `target` counts elapsed time since that moment; with no target it counts up from zero when started; `duration` acts as an upper limit.\n\n' +
                'Display units: the largest unit you list absorbs the rest, so `units: ["minutes", "seconds"]` shows 125 minutes for 2 hours 5 minutes. ' +
                '`setTarget(target)` and `setDuration(ms)` switch mode and restart; `reset()` rewinds to the initial value.',
        },
        {
            title: 'Server time and tests',
            body:
                'The user\'s device clock may be wrong. Fetch the server time once, compute the offset, and pass a `now` function:\n\n' +
                '```js\nconst offset = serverNow - Date.now();\nChillCountdown.create({ target: saleEnd, now: () => Date.now() + offset });\n```\n\n' +
                '`tick()` re-renders immediately, which is useful with a fake clock in tests.',
        },
    ],
    options: [
        { name: 'target', type: 'Date | number | string', default: 'null', description: 'Absolute moment to count to (or from, with `countUp`).' },
        { name: 'duration', type: 'number', default: 'null', description: 'Relative timer in ms; pause/resume stops the clock. With `countUp` it is the limit.' },
        { name: 'countUp', type: 'boolean', default: 'false', description: 'Count elapsed time up instead of down.' },
        { name: 'units', type: "('days' | 'hours' | 'minutes' | 'seconds')[]", default: "['days', 'hours', 'minutes', 'seconds']", description: 'Units to display; the largest shown unit absorbs the rest.' },
        { name: 'labels', type: '{ days, hours, minutes, seconds }', default: 'English', description: 'Captions for each unit.' },
        { name: 'showLabels', type: 'boolean', default: 'true', description: 'Show the captions.' },
        { name: 'variant', type: "'boxes' | 'inline'", default: "'boxes'", description: 'Visual layout; inline renders `01:02:03:04`.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Display size.' },
        { name: 'pad', type: 'number', default: '2', description: 'Zero-pad width for the numbers.' },
        { name: 'interval', type: 'number', default: '1000', description: 'Milliseconds between ticks.' },
        { name: 'autoStart', type: 'boolean', default: 'true', description: 'Start immediately.' },
        { name: 'now', type: '() => number', default: 'Date.now', description: 'Custom clock (server-synced time, tests).' },
        { name: 'ariaLabel', type: 'string', default: "'Countdown' ('Timer' with countUp)", description: 'Label prefix announced by screen readers.' },
        { name: 'onTick', type: '(valueMs, parts) => void', default: 'null', description: 'Each tick: remaining ms (or elapsed ms for `countUp`) and the displayed parts.' },
        { name: 'onComplete', type: '() => void', default: 'null', description: 'The countdown reached zero (or the count-up limit).' },
    ],
    methods: [
        { signature: 'ChillCountdown.create(options)', on: 'static', description: 'Create a countdown; append `instance.element` yourself.' },
        { signature: 'ChillCountdown.init(target, options)', on: 'static', description: 'Enhance an element (reads `data-target` and `data-duration`); returns an instance or `null`.' },
        { signature: 'ChillCountdown.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'countdown.element', description: 'The root element.' },
        { signature: 'countdown.start() / pause() / resume() / reset()', description: 'Control the clock.' },
        { signature: 'countdown.setTarget(target) / setDuration(ms)', description: 'Switch mode and restart.' },
        { signature: 'countdown.getRemaining() / getParts()', description: 'Remaining ms (or elapsed when `countUp`) and the unit parts.' },
        { signature: 'countdown.isRunning() / isComplete()', description: 'State queries.' },
        { signature: 'countdown.tick()', description: 'Re-render immediately.' },
        { signature: 'countdown.on(event, fn) / off(event, fn)', description: 'Subscribe to or remove an event listener.' },
        { signature: 'countdown.destroy()', description: 'Stop timers and remove generated DOM.' },
    ],
    events: [
        { name: 'tick', payload: '(valueMs, parts)', description: 'Every tick.' },
        { name: 'complete', description: 'Reached zero (or the limit).' },
        { name: 'start', description: '`start()` was called.' },
        { name: 'pause', description: 'Paused.' },
        { name: 'resume', description: 'Resumed.' },
    ],
    cssVars: [
        { name: '--chillcountdown-bg / --chillcountdown-text', description: 'Box background and number colour.' },
        { name: '--chillcountdown-muted', description: 'Caption colour.' },
        { name: '--chillcountdown-border', description: 'Box border colour.' },
        { name: '--chillcountdown-accent', description: 'Accent / focus colour.' },
        { name: '--chillcountdown-done', description: 'Colour when complete.' },
    ],
    a11y: [
        'The root is `role="timer"` with `aria-live="off"` and `tabindex="0"`; visual digits are `aria-hidden`.',
        'A separate polite status region announces the time, throttled to roughly once a minute, so screen readers are not flooded every second.',
        'Set `ariaLabel` to describe what is counting ("Sale ends in").',
    ],
    tips: [
        'Show only the units you need; a sale ending in hours reads better as hours, minutes and seconds than "00 days".',
        '`pause()` in `target` mode only freezes the display. For a timer that truly stops, use `duration`.',
        'The module is safe to import on the server; create countdowns in the browser and `destroy()` them on unmount.',
    ],
    related: ['reltime', 'stat', 'calendar', 'marquee'],
    keywords: ['timer', 'stopwatch', 'clock', 'deadline', 'sale', 'launch', 'pomodoro'],
};

export default doc;
