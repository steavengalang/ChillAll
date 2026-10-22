'use strict';
/**
 * Smoke test: every component must
 *   1. load in plain Node without window/document (SSR safe)  -> module.exports
 *   2. load in jsdom as CommonJS and as a global <script>     -> object/function with `version`
 *   3. not throw/log uncaught errors while loading
 *
 *   node smoke.js chillbutton chillslider   # specific
 *   node smoke.js --all                     # everything
 */
const { libs, load, loadSSR, globalName, sourceFile } = require('./env');
const fs = require('fs');

const args = process.argv.slice(2);
const names = args.includes('--all') || !args.length ? libs() : args.filter(a => !a.startsWith('--'));
let failed = 0;

for (const name of names) {
    const problems = [];
    try {
        const ssr = loadSSR(name);
        if (!ssr || (typeof ssr !== 'object' && typeof ssr !== 'function')) problems.push('SSR load: module.exports empty');
    } catch (e) { problems.push('SSR load threw: ' + e.message); }

    for (const mode of ['cjs', 'global']) {
        try {
            const { lib, errors } = load(name, mode);
            if (!lib) problems.push(`${mode}: no export`);
            else if (!lib.version) problems.push(`${mode}: missing .version`);
            if (errors.length) problems.push(`${mode}: uncaught ${errors[0]}`);
        } catch (e) { problems.push(`${mode} threw: ${e.message}`); }
    }

    const src = fs.readFileSync(sourceFile(name), 'utf8');
    if (!globalName(src)) problems.push('no window.ChillXxx assignment found');
    const dist = sourceFile(name).replace(/[\/]src[\/]/, require('path').sep + 'dist' + require('path').sep);
    if (name !== 'chillalert' && fs.existsSync(dist) && fs.readFileSync(dist, 'utf8') !== src) problems.push('dist/ differs from src/ (run build)');

    if (problems.length) { failed++; console.log(`✗ ${name}\n   - ${problems.join('\n   - ')}`); }
    else console.log(`✓ ${name}`);
}
console.log(`\n${names.length - failed}/${names.length} passed`);
process.exit(failed ? 1 : 0);
