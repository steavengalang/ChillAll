'use strict';
/**
 * Reports bundle sizes and proves tree-shaking works for the ESM build:
 * importing one component must be a small fraction of importing ChillAll.
 *   node tools/treeshake.js          (run `node tools/build.js` first)
 * Exits non-zero if a single-component import is > 15% of the full bundle.
 */
const esbuild = require('esbuild');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const ESM = path.join(__dirname, '..', 'chillall', 'dist', 'chillall.esm.js').replace(/\\/g, '/');
const kb = n => (n / 1024).toFixed(1).padStart(8) + ' KB';

async function size(code) {
    const r = await esbuild.build({
        stdin: { contents: code, resolveDir: __dirname }, bundle: true, minify: true, format: 'esm', write: false, logLevel: 'error'
    });
    const out = r.outputFiles[0].contents;
    return { raw: out.length, gz: zlib.gzipSync(out).length };
}

(async () => {
    const cases = [
        ['ChillButton only', `import { ChillButton } from '${ESM}'; console.log(ChillButton.version);`],
        ['ChillButton + ChillModal', `import { ChillButton, ChillModal } from '${ESM}'; console.log(ChillButton.version, ChillModal.version);`],
        ['ChillAlert only', `import { ChillAlert } from '${ESM}'; console.log(ChillAlert.version);`],
        ['default ChillAll (everything)', `import ChillAll from '${ESM}'; console.log(ChillAll.version);`]
    ];
    const res = {};
    for (const [label, code] of cases) {
        res[label] = await size(code);
        console.log(label.padEnd(32), kb(res[label].raw), ' | gzip', kb(res[label].gz));
    }
    const min = fs.readFileSync(path.join(__dirname, '..', 'chillall', 'dist', 'chillall.min.js'));
    console.log('dist/chillall.min.js'.padEnd(32), kb(min.length), ' | gzip', kb(zlib.gzipSync(min).length), '| brotli', kb(zlib.brotliCompressSync(min).length));

    const ratio = res['ChillButton only'].raw / res['default ChillAll (everything)'].raw;
    console.log(`\nChillButton alone = ${(ratio * 100).toFixed(1)}% of the full bundle`);
    if (ratio > 0.15) { console.error('FAIL: tree-shaking is not effective'); process.exit(1); }
    console.log('tree-shaking OK');
})().catch(e => { console.error(e); process.exit(1); });
