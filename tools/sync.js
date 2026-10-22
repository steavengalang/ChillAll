'use strict';
// node tools/sync.js [chillname ...]  -> copy chill<name>/src/chill<name>.js to chill<name>/dist/
const fs = require('fs');
const path = require('path');
const { libs, ROOT, sourceFile } = require('./env');
const names = process.argv.slice(2).length ? process.argv.slice(2) : libs();
for (const name of names) {
    if (name === 'chillalert') continue; // root package: dist/ is hand-maintained with the .d.ts
    const src = sourceFile(name);
    const dist = path.join(ROOT, name, 'dist', name + '.js');
    fs.mkdirSync(path.dirname(dist), { recursive: true });
    fs.copyFileSync(src, dist);
    console.log('synced', name);
}
