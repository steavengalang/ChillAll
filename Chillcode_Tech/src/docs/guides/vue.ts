import type { Guide } from '../types';

const body = String.raw`
## The idea

In Vue you give a component an empty element through a template ref, create it in onMounted, and destroy it in onBeforeUnmount. Everything else is normal reactive code.

~~~live
// Same lifecycle as a Vue component, written with plain functions so it runs here.
const host = document.createElement('div');
root.append(host);
let inst;
// onMounted
inst = ChillSegmented.create({ items: ['List', 'Grid', 'Board'], value: 'Grid', container: host });
// onBeforeUnmount
cleanup(() => inst.destroy());
~~~

## A component wrapper (script setup)

~~~vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChillSlider } from 'chillall';

const props = defineProps<{ modelValue: number; min?: number; max?: number }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const host = ref<HTMLElement | null>(null);
let slider: any = null;

onMounted(() => {
  slider = ChillSlider.create({
    min: props.min ?? 0,
    max: props.max ?? 100,
    value: props.modelValue,
    container: host.value!,
    onChange: (v: number) => emit('update:modelValue', v),
  });
});

// keep the component in sync with v-model (silent = true: do not re-emit)
watch(() => props.modelValue, (v) => slider?.setValue(v, true));

onBeforeUnmount(() => slider?.destroy());
</script>

<template>
  <div ref="host" />
</template>
~~~

Usage:

~~~vue
<Slider v-model="volume" />
~~~

## A composable for any component

Most components share the same lifecycle, so one composable covers them:

~~~ts
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export function useChill<T extends { destroy(): void }>(host: Ref<HTMLElement | null>, create: (el: HTMLElement) => T) {
  let instance: T | null = null;
  onMounted(() => { instance = create(host.value!); });
  onBeforeUnmount(() => instance?.destroy());
  return () => instance;
}
~~~

~~~vue
<script setup lang="ts">
import { ref } from 'vue';
import { ChillCalendar } from 'chillall';
import { useChill } from './useChill';

const host = ref<HTMLElement | null>(null);
useChill(host, (el) => ChillCalendar.create({ mode: 'range', container: el }));
</script>
<template><div ref="host" /></template>
~~~

## Imperative helpers

~~~vue
<script setup lang="ts">
import { ChillAlert } from 'chillall';

async function save() {
  await api.save();
  ChillAlert.toast({ title: 'Saved', icon: 'success' });
}
</script>
<template><button @click="save">Save</button></template>
~~~

## Nuxt

Importing chillall is safe during server rendering, but components need a DOM. Create them in onMounted (which only runs in the browser), or wrap the component in the built-in client-only component:

~~~vue
<template>
  <ClientOnly>
    <ChillCalendarWrapper />
  </ClientOnly>
</template>
~~~

To use the helpers everywhere, expose them from a client plugin (plugins/chillall.client.ts):

~~~ts
import { ChillAlert, ChillNotify } from 'chillall';

export default defineNuxtPlugin(() => ({ provide: { alert: ChillAlert, notify: ChillNotify } }));
~~~

## Things to know

- **Do not render Vue children inside the element ChillAll controls.** Give it an empty ref.
- **Use methods instead of re-creating.** setValue(v, true), setItems(...) and similar keep state in sync without flicker.
- **Theme:** ChillTheme sets <html data-theme> and a light or dark class, which is what every component follows. See [Theming](/docs/guide/theming).

## Next steps

- [Theming](/docs/guide/theming), [Accessibility](/docs/guide/accessibility).
- [Login form recipe](/docs/guide/recipe-login-form).
`.replace(/^~~~/gm, '```');

const guide: Guide = {
    id: 'vue',
    title: 'Vue & Nuxt',
    summary: 'Use ChillAll in Vue 3 and Nuxt: template refs, onMounted, v-model wrappers and a reusable composable.',
    group: 'Getting started',
    body,
};

export default guide;
