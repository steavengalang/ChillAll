import type { DocEntry } from '../../types';

// A fixed-height scroll box that acts as both the host and the scroll root of the component.
const FEED = `const feed = document.createElement('div');
feed.style.cssText = 'height:240px;overflow:auto;border:1px solid var(--chill-border);border-radius:10px;padding:8px;color:var(--chill-text);font-size:14px';
root.append(feed);
const row = (text) => { const d = document.createElement('div'); d.textContent = text; d.style.cssText = 'padding:12px;border-bottom:1px solid var(--chill-border)'; return d; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));`;

const doc: DocEntry = {
    id: 'infinitescroll',
    global: 'ChillInfiniteScroll',
    category: 'data',
    title: 'Infinite Scroll',
    summary: 'Load more content automatically as the reader nears the end, with loading, end and retry states.',
    style: 'init',
    description:
        'ChillInfiniteScroll watches a sentinel at the bottom of a container with an IntersectionObserver. When it comes within `threshold` pixels of view it calls your async `onLoadMore`, shows a spinner, and waits for you to append the new items.\n\n' +
        'You decide what a "page" is: append DOM nodes with `appendElement(s)` in the callback and return `{ hasMore: false }` (or `false`) when the data runs out. If the callback throws, the component shows an error message with a Retry button. ' +
        'Pass `root` when the host element is itself the scrolling container; omit it to scroll with the page.',
    features: [
        'IntersectionObserver based, so there is no scroll-event polling',
        'Built-in loading spinner, "no more items" message and error state with Retry',
        'Works with the page scroll or any scroll container via `root`',
        'Safe helpers `appendElement()` / `appendElements()`; `append(html)` for trusted markup',
        'Manual control with `loadMore()`, `retry()`, `reset()`, `setComplete()` and `showError()`',
    ],
    examples: [
        {
            id: 'basic',
            title: 'Endless feed',
            description: 'Scroll the box: each time you near the bottom `onLoadMore` appends 10 rows. After three pages it returns `{ hasMore: false }`.',
            height: 300,
            code: `${FEED}
let page = 0;
const is = ChillInfiniteScroll.init(feed, {
  root: feed,
  onLoadMore: async () => {
    await wait(600);                       // pretend to call your API
    page++;
    const items = Array.from({ length: 10 }, (_, i) => row('Post #' + ((page - 1) * 10 + i + 1)));
    is.appendElements(items);
    return { hasMore: page < 3 };
  },
});
cleanup(() => is.destroy());`,
        },
        {
            id: 'error-retry',
            title: 'Error handling and retry',
            description: 'When `onLoadMore` throws, the component shows `errorText` and a Retry button and stops loading until the user retries. `onError` receives the error.',
            height: 300,
            code: `${FEED}
let page = 0, failedOnce = false;
const note = document.createElement('p');
note.style.cssText = 'font-size:13px;margin:8px 0 0;color:var(--chill-text)';
root.append(note);
const is = ChillInfiniteScroll.init(feed, {
  root: feed,
  errorText: 'Could not load more posts.',
  retryText: 'Try again',
  onLoadMore: async () => {
    await wait(500);
    if (page === 1 && !failedOnce) { failedOnce = true; throw new Error('Network down'); }
    page++;
    is.appendElements(Array.from({ length: 8 }, (_, i) => row('Item ' + ((page - 1) * 8 + i + 1))));
    return { hasMore: page < 4 };
  },
  onError: (err) => { note.textContent = 'Error: ' + err.message; },
  onComplete: () => { note.textContent = 'All items loaded'; },
});
cleanup(() => is.destroy());`,
        },
        {
            id: 'custom',
            title: 'Custom texts, threshold and reset',
            description: 'Change the messages, start loading earlier with a bigger `threshold`, and use `reset()` to begin again (clear the old items yourself).',
            height: 340,
            code: `${FEED}
let page = 0;
const items = [];
const is = ChillInfiniteScroll.init(feed, {
  root: feed,
  threshold: 80,
  loadingText: 'Fetching more notes...',
  endText: 'You have reached the end',
  onLoadMore: async () => {
    await wait(400);
    page++;
    const batch = Array.from({ length: 6 }, (_, i) => row('Note ' + ((page - 1) * 6 + i + 1)));
    items.push(...batch);
    is.appendElements(batch);
    return page < 3 ? undefined : false;
  },
});
const btn = ChillButton.create({ text: 'Start over', size: 'sm', variant: 'outline' });
btn.style.marginTop = '12px';
btn.onclick = () => { items.forEach((n) => n.remove()); items.length = 0; page = 0; is.reset(); is.loadMore(); };
root.append(btn);
cleanup(() => is.destroy());`,
        },
        {
            id: 'manual',
            title: 'Load more button as a fallback',
            description: 'Call `loadMore()` yourself, for example from a button, and read `isLoading` / `hasMore` to drive your own UI.',
            height: 300,
            code: `${FEED}
let n = 0;
const is = ChillInfiniteScroll.init(feed, {
  root: feed,
  threshold: 0,
  onLoadMore: async () => {
    await wait(300);
    is.appendElements(Array.from({ length: 4 }, () => row('Entry ' + (++n))));
    return { hasMore: n < 24 };
  },
});
const btn = ChillButton.create({ text: 'Load more now', size: 'sm' });
btn.style.marginTop = '12px';
btn.onclick = () => { if (!is.isLoading && is.hasMore) is.loadMore(); };
root.append(btn);
cleanup(() => is.destroy());`,
        },
    ],
    guides: [
        {
            title: 'The host and the scroll root',
            body:
                '`ChillInfiniteScroll.init(target, options)` appends a loader, an end message, an error box and a 1px sentinel to the **end** of `target`, so `target` should hold your list items directly. Items you add with `appendElement()` are inserted before the loader.\n\n' +
                '- When `target` itself scrolls (fixed height, `overflow: auto`) pass `root: target`.\n' +
                '- When the page scrolls, leave `root` out: the viewport is used.\n\n' +
                'If the first page does not fill the container the sentinel stays visible and the next page loads straight away, until it does.',
        },
        {
            title: 'What onLoadMore returns',
            body:
                '`onLoadMore()` may be sync or async. Append your items inside it, then return:\n\n' +
                '- nothing / `undefined` / `true`: more data is available.\n' +
                '- `false` or `{ hasMore: false }`: the end is reached, the observer stops and `endText` shows (`onComplete` fires).\n' +
                '- a thrown error / rejected promise: the error state with Retry is shown and `onError(error)` runs.\n\n' +
                'Only one load runs at a time. While loading the host has `aria-busy="true"`.',
        },
        {
            title: 'Safe rendering',
            body:
                'The component texts (`loadingText`, `endText`, `errorText`, `retryText`) are set with `textContent`. Build your items as DOM elements (`appendElement`) when they contain user data. ' +
                '`append(html)` parses a string as HTML and must only receive trusted, sanitised markup.',
        },
    ],
    options: [
        { name: 'onLoadMore', type: '() => Promise<void | boolean | { hasMore: boolean }>', default: 'null', description: 'Called when the sentinel nears the viewport. Append items and return `false` / `{ hasMore: false }` at the end.' },
        { name: 'threshold', type: 'number', default: '200', description: 'Distance in px before the end at which loading starts (observer `rootMargin`).' },
        { name: 'root', type: 'Element', default: 'null', description: 'Scroll container. `null` uses the viewport.' },
        { name: 'loadingText', type: 'string', default: "'Loading...'", description: 'Text next to the spinner.' },
        { name: 'endText', type: 'string', default: "'No more items'", description: 'Message shown when everything is loaded.' },
        { name: 'errorText', type: 'string', default: "'Failed to load'", description: 'Message shown when loading fails.' },
        { name: 'retryText', type: 'string', default: "'Retry'", description: 'Retry button label.' },
        { name: 'onError', type: '(error: unknown) => void', default: 'null', description: 'Called when `onLoadMore` throws or rejects.' },
        { name: 'onComplete', type: '() => void', default: 'null', description: 'Called once the end is reached.' },
    ],
    methods: [
        { signature: 'ChillInfiniteScroll.init(target, options)', on: 'static', description: 'Attach to an element (selector or node) and return an instance. Does nothing if the element is missing.' },
        { signature: 'ChillInfiniteScroll.injectCSS()', on: 'static', description: 'Inject the stylesheet immediately.' },
        { signature: 'instance.loadMore()', description: 'Trigger a load manually (ignored while loading or after the end).' },
        { signature: 'instance.retry()', description: 'Clear the error state and load again.' },
        { signature: 'instance.reset()', description: 'Reset to the initial state (loading enabled again, observer restarted). Does not remove your items and does not load by itself.' },
        { signature: 'instance.setComplete()', description: 'Mark the end manually and show `endText`.' },
        { signature: 'instance.showError(message?)', description: 'Show the error state with an optional custom message.' },
        { signature: 'instance.appendElement(el) / appendElements(els)', description: 'Insert nodes before the loader.' },
        { signature: 'instance.append(html)', description: 'Insert trusted HTML before the loader.' },
        { signature: 'instance.isLoading / hasMore / hasError', description: 'Current state flags.' },
        { signature: 'instance.destroy()', description: 'Disconnect the observer and remove the loader elements.' },
    ],
    cssVars: [
        { name: '--chillinfinitescroll-text', description: 'Loader, end and error text colour.' },
        { name: '--chillinfinitescroll-spinner', description: 'Spinner accent colour.' },
        { name: '--chillinfinitescroll-track', description: 'Spinner track colour.' },
    ],
    a11y: [
        'The loader and end message are polite `role="status"` regions; the error box is a `role="alert"` with a real Retry button.',
        '`aria-busy="true"` is set on the host while a load is running.',
        'For keyboard users offer a visible "Load more" button as well, since infinite lists can make the footer unreachable.',
    ],
    tips: [
        'Without IntersectionObserver (very old browsers) nothing auto-loads; call `loadMore()` from your own control.',
        'Keep the DOM light: for thousands of rows combine it with `ChillVirtualList` or paginate.',
        'In frameworks, create the instance in an effect once the host is mounted and call `destroy()` on cleanup.',
    ],
    related: ['virtuallist', 'pagination', 'spinner', 'backtotop'],
    keywords: ['lazy load', 'endless', 'feed', 'load more', 'pagination', 'observer'],
};

export default doc;
