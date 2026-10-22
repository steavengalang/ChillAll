'use strict';
/**
 * Finds `@media (prefers-color-scheme: dark)` blocks that are NOT guarded against an explicit light theme.
 * A guarded block only contains selectors that start with  :root:not([data-theme="light"]):not(.light)
 *   node tools/audit-theme.js
 */
const fs = require('fs');
const { libs, sourceFile } = require('./env');

const GUARD = ':root:not([data-theme="light"])';
let bad = 0;

for (const name of libs()) {
    const src = fs.readFileSync(sourceFile(name), 'utf8');
    const re = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g;
    let m;
    while ((m = re.exec(src))) {
        // find the matching close brace of the @media block
        let depth = 1, i = re.lastIndex;
        while (i < src.length && depth) { const ch = src[i++]; if (ch === '{') depth++; else if (ch === '}') depth--; }
        const body = src.slice(re.lastIndex, i - 1);
        // selectors = text before each "{" at depth 0 of the body
        const sels = [];
        let d = 0, start = 0;
        for (let k = 0; k < body.length; k++) {
            if (body[k] === '{') { if (d === 0) sels.push(body.slice(start, k).trim()); d++; }
            else if (body[k] === '}') { d--; if (d === 0) start = k + 1; }
        }
        const unguarded = sels.filter(s => s && !s.split(',').every(p => p.trim().startsWith(GUARD)));
        if (unguarded.length) {
            bad++;
            const line = src.slice(0, m.index).split('\n').length;
            console.log(`✗ ${name}:${line}  unguarded selectors: ${unguarded.slice(0, 3).map(s => s.replace(/\s+/g, ' ').slice(0, 60)).join(' | ')}${unguarded.length > 3 ? ' …+' + (unguarded.length - 3) : ''}`);
        }
    }
}
console.log(bad ? `\n${bad} unguarded dark-mode block(s)` : 'all prefers-color-scheme blocks are guarded');
process.exit(bad ? 1 : 0);
