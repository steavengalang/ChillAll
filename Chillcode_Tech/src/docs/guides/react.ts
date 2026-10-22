import type { Guide } from '../types';

const body = String.raw`
## The idea

ChillAll components are plain DOM. React owns the *page*; ChillAll owns the little piece of DOM inside a ref you hand it. The whole integration is three steps inside a useEffect:

1. create the component and mount it into a ref,
2. forward changes to React state through a callback,
3. return a cleanup function that calls destroy().

~~~live
// This is exactly what the React effect does, written without React so it can run here.
const out = document.createElement('p');
out.style.margin = '12px 0 0';
out.textContent = 'Rating: 3';
const rating = ChillRating.create({ value: 3, container: root, onChange: (v) => { out.textContent = 'Rating: ' + v; } });
root.append(out);
cleanup(() => rating.destroy());   // <- the cleanup function an effect would return
~~~

## A reusable wrapper

~~~tsx
import { useEffect, useRef } from 'react';
import { ChillSlider } from 'chillall';

type SliderProps = { value: number; onChange: (value: number) => void; min?: number; max?: number };

export function Slider({ value, onChange, min = 0, max = 100 }: SliderProps) {
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);

  // create once
  useEffect(() => {
    const slider = ChillSlider.create({ min, max, value, container: host.current!, onChange });
    inst.current = slider;
    return () => slider.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  // keep it in sync with React state (silent = true so we do not re-emit onChange)
  useEffect(() => { inst.current?.setValue(value, true); }, [value]);

  return <div ref={host} />;
}
~~~

Use it like any controlled component:

~~~tsx
const [volume, setVolume] = useState(40);
<Slider value={volume} onChange={setVolume} />
~~~

## Imperative helpers need no wrapper

Dialogs, toasts, notifications and similar helpers are just functions. Call them from event handlers:

~~~tsx
import { ChillAlert, ChillNotify } from 'chillall';

async function remove() {
  const ok = await ChillAlert.confirm({ title: 'Delete project?', text: 'This cannot be undone.' });
  if (!ok) return;
  await api.deleteProject();
  ChillNotify.show({ title: 'Deleted', type: 'success' });
}

<button onClick={remove}>Delete</button>
~~~

## Enhance elements React renders

Components with init(target, options) can upgrade elements you render yourself. Keep the instance in a ref and destroy it in the cleanup:

~~~tsx
import { useEffect, useRef } from 'react';
import { ChillTooltip } from 'chillall';

export function Hint({ text, children }: { text: string; children: React.ReactNode }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tip = ChillTooltip.init(el.current!, { content: text });
    return () => tip.destroy();
  }, [text]);
  return <span ref={el}>{children}</span>;
}
~~~

## Things to know

- **StrictMode runs effects twice in development.** That is fine as long as your cleanup calls destroy(), which every component supports.
- **Do not let React and ChillAll fight over the same children.** Give ChillAll an empty ref'd element and do not render React children inside it.
- **Prefer controlled updates through methods** such as setValue(value, silent) over re-creating the component on every render.
- **Server rendering:** importing chillall is safe, but create components inside effects or handlers. See the [Next.js guide](/docs/guide/nextjs).
- **Theme:** call ChillTheme.setTheme('dark') from a button, or set <html data-theme> yourself. All components follow it. See [Theming](/docs/guide/theming).

## Next steps

- [Next.js guide](/docs/guide/nextjs) for App Router specifics.
- [Login form recipe](/docs/guide/recipe-login-form) for validation and feedback.
- Browse the [components](/docs); each page lists its methods and options.
`.replace(/^~~~/gm, '```');

const guide: Guide = {
    id: 'react',
    title: 'React',
    summary: 'Use ChillAll in React: refs, effects, cleanup, controlled values and imperative helpers.',
    group: 'Getting started',
    body,
};

export default guide;
