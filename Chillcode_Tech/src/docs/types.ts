/**
 * Documentation data model. One `DocEntry` per ChillAll component, authored as
 * `src/docs/content/<category>/<name>.ts` (default export). The docs site renders everything from this data and the
 * verify script (`npm run verify:docs`) executes every example against the real bundle, so examples can never rot.
 */

export type CategoryId = 'core' | 'formControls' | 'navigation' | 'feedback' | 'display' | 'data' | 'utility';

/** A runnable, editable example. `code` is plain browser JavaScript (no imports, no TypeScript). */
export interface DocExample {
    /** url-safe id, unique within the component (used for #anchors) */
    id: string;
    title: string;
    /** one or two sentences: what it shows and why it matters */
    description?: string;
    /**
     * Runs in the browser with these variables in scope:
     *   - every component by its global name: ChillButton, ChillModal, ...  and `ChillAll`
     *   - `root`    the preview <div> to render into (position: relative; padding: 16px)
     *   - `cleanup(fn)`  register teardown (destroy instances, remove listeners). Called before re-run/unmount.
     * It may be async (top-level `await` is allowed). Do not use `import`, `export`, `require` or TypeScript.
     */
    code: string;
    /** preview min-height in px (default 120). Use larger values for popovers, calendars, trees... */
    height?: number;
    /** true for examples that only open global overlays (modals, toasts) - preview shows a "Run" hint instead of auto-running */
    manual?: boolean;
}

export interface DocOption {
    name: string;
    /** TypeScript-ish type, e.g. "'sm' | 'md' | 'lg'", "number", "(value) => void" */
    type: string;
    /** default as written in code ("'md'", "false", "-" when required / none) */
    default: string;
    description: string;
}

export interface DocMethod {
    /** e.g. "setValue(value, silent?)" */
    signature: string;
    description: string;
    /** where it lives: 'static' = ChillX.method(), 'instance' = returned object / element, default 'instance' */
    on?: 'static' | 'instance';
}

export interface DocEvent {
    name: string;
    payload?: string;
    description: string;
}

/** A tutorial-style prose block shown between the examples and the API tables (markdown-lite, see src/docs/markdown.tsx). */
export interface DocGuide {
    title: string;
    /** markdown-lite: paragraphs, `code`, **bold**, *italic*, [links](url), "- " lists, "1. " lists, ```js fences, > callouts */
    body: string;
}

export interface DocEntry {
    /** lowercase component name without "chill": 'button' | 'emptystate' ... Must match the folder chill<id> */
    id: string;
    /** global / export name: 'ChillButton' */
    global: string;
    category: CategoryId;
    /** human title: 'Button', 'Empty State', 'Date Picker' */
    title: string;
    /** <= 110 chars, shown on cards and in search */
    summary: string;
    /** 1-3 paragraphs, markdown-lite: what it is, when to use it, how it behaves */
    description: string;
    /** 3-6 short bullet points of headline features */
    features: string[];
    /** at least 3 examples, ordered simple -> advanced; the first one is the hero preview */
    examples: DocExample[];
    /** tutorial prose: 1-3 guides such as "Getting started", "Validation", "Server data", "Styling" */
    guides?: DocGuide[];
    /** options of create()/init() plus per-item option shapes, grouped by `group` if you pass it in the name like "items[].label" */
    options: DocOption[];
    methods: DocMethod[];
    events?: DocEvent[];
    /** CSS custom properties users can override, e.g. { name: '--chillbutton-primary', description: 'Primary colour' } */
    cssVars?: { name: string; description: string }[];
    /** keyboard map + ARIA facts, one line each */
    a11y: string[];
    /** gotchas, SSR notes, performance tips */
    tips?: string[];
    /** ids of related components for the "See also" row */
    related?: string[];
    /** extra search keywords */
    keywords?: string[];
    /** 'init' for libraries that only enhance existing DOM (Accordion, Tabs...). Controls the "Usage" header snippet. */
    style?: 'create' | 'init' | 'static';
}

export interface CategoryMeta {
    id: CategoryId;
    title: string;
    blurb: string;
}

export interface Guide {
    id: string;
    title: string;
    summary: string;
    group: 'Getting started' | 'Guides' | 'Recipes';
    /** markdown-lite body; may contain ```live blocks (runnable examples, same sandbox as DocExample) */
    body: string;
}
