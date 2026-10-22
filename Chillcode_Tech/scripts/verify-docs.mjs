// Verifies the documentation against the REAL ChillAll bundle:
//   - every component has a doc entry with the required parts
//   - every example runs without throwing (sync and async) in jsdom
//   - every documented static method really exists
//   node scripts/verify-docs.mjs [id ...]      (no ids = everything)
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const toolsDir = join(site, '..', 'tools');
const require = createRequire(join(toolsDir, 'package.json'));
let esbuild, JSDOM;
try { esbuild = require('esbuild'); ({ JSDOM } = require('jsdom')); }
catch { console.error('verify-docs needs ../tools/node_modules (esbuild, jsdom): run `npm install` in ../tools'); process.exit(2); }

const only = process.argv.slice(2);
const tmp = mkdtempSync(join(tmpdir(), 'chilldocs-'));
const problems = [];
const bad = (id, msg) => problems.push(`${id}: ${msg}`);

// 1. compile the doc content (TypeScript) + the vendored bundle (as IIFE exposing the module namespace)
// With ids, only those files are compiled (isolated from half-written files of other authors); without, everything.
const contentRoot = join(site, 'src/docs/content');
const contentFiles = [];
for (const cat of readdirSync(contentRoot)) {
    const dir = join(contentRoot, cat);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.ts') && (!only.length || only.includes(f.replace(/\.ts$/, '')))) contentFiles.push(join(dir, f));
}
const idx = contentFiles.map((f, i) => `import d${i} from ${JSON.stringify(f.replace(/\\/g, '/'))};`).join('\n') + `\nexport const entries = [${contentFiles.map((_, i) => 'd' + i).join(',')}];`;
await esbuild.build({ stdin: { contents: idx, resolveDir: contentRoot, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: join(tmp, 'content.mjs'), logLevel: 'error' });
await esbuild.build({
    stdin: { contents: `import * as m from './chillall.esm.js'; globalThis.__chillall = m; Object.assign(globalThis, Object.fromEntries(Object.entries(m).filter(([k]) => /^Chill/.test(k))));`, resolveDir: join(site, 'src/lib/vendor') },
    bundle: true, format: 'iife', outfile: join(tmp, 'bundle.js'), logLevel: 'error'
});
const { entries } = await import(pathToFileURL(join(tmp, 'content.mjs')).href);
const bundleSrc = readFileSync(join(tmp, 'bundle.js'), 'utf8');

const CATS = ['core', 'formControls', 'navigation', 'feedback', 'display', 'data', 'utility'];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const wait = ms => new Promise(r => setTimeout(r, ms));

function newWindow() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' });
    const w = dom.window;
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.ResizeObserver = w.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
    w.IntersectionObserver = w.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    w.Element.prototype.scrollIntoView = w.Element.prototype.scrollIntoView || function () {};
    w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ width: 0 })), set: () => true });
    w.eval(bundleSrc);
    return w;
}

// 2. structure checks
const probe = newWindow();
const all = probe.__chillall;
const known = all.components; // [{name,global,key,category}]
const byId = new Map(entries.map(e => [e.id, e]));
if (!only.length) for (const c of known) if (!byId.has(c.name)) bad(c.name, 'no doc entry (create src/docs/content/' + c.category + '/' + c.name + '.ts)');
for (const id of only) if (!byId.has(id)) bad(id, 'no doc file found: src/docs/content/<category>/' + id + '.ts');
const seen = new Set();
for (const e of entries) {
    if (seen.has(e.id)) bad(e.id, 'duplicate doc id'); seen.add(e.id);
    const c = known.find(k => k.name === e.id);
    if (!c) { bad(e.id, 'does not match any component in the bundle'); continue; }
    if (e.global !== c.global) bad(e.id, `global should be ${c.global}`);
    if (!CATS.includes(e.category)) bad(e.id, 'invalid category');
    else if (e.category !== c.category) bad(e.id, `category should be "${c.category}"`);
    if (!e.title) bad(e.id, 'missing title');
    if (!e.summary || e.summary.length > 110) bad(e.id, `summary required, <= 110 chars (is ${e.summary ? e.summary.length : 0})`);
    if (!e.description || e.description.length < 80) bad(e.id, 'description too short (<80 chars)');
    if (!e.features || e.features.length < 3 || e.features.length > 6) bad(e.id, 'features must have 3-6 items');
    if (!e.examples || e.examples.length < 3) bad(e.id, 'needs >= 3 examples');
    if (!e.options || e.options.length < 1) bad(e.id, 'options table is empty');
    if (!e.methods || e.methods.length < 1) bad(e.id, 'methods table is empty');
    if (!e.a11y || e.a11y.length < 1) bad(e.id, 'a11y notes missing');
    if (!e.guides || e.guides.length < 1) bad(e.id, 'needs at least one guide');
    const ids = new Set();
    for (const x of e.examples || []) {
        if (!/^[a-z0-9-]+$/.test(x.id || '')) bad(e.id, `example id "${x.id}" must be lowercase-kebab`);
        if (ids.has(x.id)) bad(e.id, `duplicate example id ${x.id}`); ids.add(x.id);
        if (!x.title || !x.code) bad(e.id, `example ${x.id} needs title and code`);
        if (/^\s*(import|export)\s/m.test(x.code || '')) bad(e.id, `example ${x.id} must not use import/export (names are in scope)`);
    }
    // documented static methods must exist
    const lib = all[e.global];
    for (const m of e.methods || []) {
        if (m.on !== 'static') continue;
        const name = m.signature.split('(')[0].trim().replace(new RegExp('^' + e.global + '\\.'), '');
        if (name && typeof lib?.[name] !== 'function') bad(e.id, `documented static method ${name}() does not exist on ${e.global}`);
    }
}

// 3. run every example
let ran = 0;
for (const e of entries) {
    if (only.length && !only.includes(e.id)) continue;
    for (const x of e.examples || []) {
        const w = newWindow();
        const errors = [];
        w.addEventListener('error', ev => errors.push(ev.error?.message || ev.message));
        w.addEventListener('unhandledrejection', ev => errors.push('unhandled rejection: ' + (ev.reason?.message || ev.reason)));
        const root = w.document.createElement('div');
        w.document.body.appendChild(root);
        const cleanups = [];
        const names = Object.keys(w.__chillall).filter(k => /^Chill/.test(k)).concat('ChillAll');
        const values = names.map(n => (n === 'ChillAll' ? w.__chillall.ChillAll : w.__chillall[n]));
        try {
            const run = new AsyncFunction(...names, 'root', 'cleanup', 'window', 'document', x.code);
            await Promise.race([
                run(...values, root, f => cleanups.push(f), w, w.document),
                wait(4000).then(() => { throw new Error('example did not settle in 4s (await something that never resolves?)'); })
            ]);
            await wait(60);
        } catch (err) { errors.push(err && err.message ? err.message : String(err)); }
        for (const f of cleanups) { try { f(); } catch (err) { errors.push('cleanup threw: ' + err.message); } }
        if (errors.length) bad(`${e.id}/${x.id}`, errors[0]);
        ran++;
        w.close();
    }
}

console.log(`verified ${entries.length}/${known.length} docs, ran ${ran} examples`);
if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems.slice(0, 200)) console.log('  ✗ ' + p);
    process.exit(1);
}
console.log('docs OK');
process.exit(0);
