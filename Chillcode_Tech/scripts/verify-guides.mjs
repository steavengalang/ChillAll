// Verifies the guides/tutorials: structure + every ```live fenced block runs against the real bundle.
//   node scripts/verify-guides.mjs [id ...]
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const require = createRequire(join(site, '..', 'tools', 'package.json'));
const esbuild = require('esbuild');
const { JSDOM } = require('jsdom');

const only = process.argv.slice(2);
const tmp = mkdtempSync(join(tmpdir(), 'chillguides-'));
const problems = [];
const bad = (id, msg) => problems.push(`${id}: ${msg}`);
const guidesDir = join(site, 'src/docs/guides');
const files = existsSync(guidesDir) ? readdirSync(guidesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'loaders.ts' && (!only.length || only.includes(f.replace(/\.ts$/, '')))) : [];

const idx = files.map((f, i) => `import g${i} from ${JSON.stringify(join(guidesDir, f).replace(/\\/g, '/'))};`).join('\n') + `\nexport const guides = [${files.map((_, i) => 'g' + i).join(',')}];`;
await esbuild.build({ stdin: { contents: idx, resolveDir: guidesDir, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: join(tmp, 'guides.mjs'), logLevel: 'error' });
await esbuild.build({
    stdin: { contents: `import * as m from './chillall.esm.js'; globalThis.__chillall = m; Object.assign(globalThis, Object.fromEntries(Object.entries(m).filter(([k]) => /^Chill/.test(k))));`, resolveDir: join(site, 'src/lib/vendor') },
    bundle: true, format: 'iife', outfile: join(tmp, 'bundle.js'), logLevel: 'error'
});
const { guides } = await import(pathToFileURL(join(tmp, 'guides.mjs')).href);
const bundleSrc = readFileSync(join(tmp, 'bundle.js'), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const wait = ms => new Promise(r => setTimeout(r, ms));
const GROUPS = ['Getting started', 'Guides', 'Recipes'];

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

let ran = 0;
for (const g of guides) {
    if (!/^[a-z0-9-]+$/.test(g.id || '')) bad(g.id, 'id must be lowercase-kebab');
    if (!g.title || !g.summary || g.summary.length > 140) bad(g.id, 'title and summary (<= 140 chars) required');
    if (!GROUPS.includes(g.group)) bad(g.id, 'group must be one of ' + GROUPS.join(' | '));
    if (!g.body || g.body.length < 600) bad(g.id, 'body too short (< 600 chars) - tutorials should be complete');
    const blocks = [...(g.body || '').matchAll(/```live\r?\n([\s\S]*?)```/g)].map(m => m[1]);
    blocks.forEach((code, i) => {
        if (/^\s*(import|export)\s/m.test(code)) bad(g.id, `live block #${i + 1} must not use import/export`);
    });
    for (let i = 0; i < blocks.length; i++) {
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
            const run = new AsyncFunction(...names, 'root', 'cleanup', 'window', 'document', blocks[i]);
            await Promise.race([run(...values, root, f => cleanups.push(f), w, w.document), wait(4000).then(() => { throw new Error('did not settle in 4s'); })]);
            await wait(60);
        } catch (err) { errors.push(err && err.message ? err.message : String(err)); }
        for (const f of cleanups) { try { f(); } catch (err) { errors.push('cleanup threw: ' + err.message); } }
        if (errors.length) bad(`${g.id}/live#${i + 1}`, errors[0]);
        ran++;
        w.close();
    }
}
console.log(`verified ${guides.length} guides, ran ${ran} live blocks`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); problems.forEach(p => console.log('  ✗ ' + p)); process.exit(1); }
console.log('guides OK');
process.exit(0);
