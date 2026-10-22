'use strict';
/**
 * Read-only: is every local package@version actually live on the npm registry?
 * Uses the per-version endpoint (not the cached packument), so it is accurate right after a publish.
 *   node tools/npm-live.js
 */
const fs = require('fs');
const path = require('path');
const { ROOT, libs } = require('./env');

const pk = [{ dir: 'chillall' }, ...libs().map(id => ({ dir: id === 'chillalert' ? '.' : id }))].map(t => {
    const p = JSON.parse(fs.readFileSync(path.join(ROOT, t.dir, 'package.json'), 'utf8'));
    return { name: p.name, version: p.version };
});

(async () => {
    const res = await Promise.all(pk.map(async p => {
        for (let i = 0; i < 3; i++) {
            try {
                const r = await fetch(`https://registry.npmjs.org/${p.name}/${p.version}?t=${Date.now()}`);
                return { ...p, ok: r.status === 200, status: r.status };
            } catch { await new Promise(r => setTimeout(r, 400)); }
        }
        return { ...p, ok: false, status: 'network' };
    }));
    const bad = res.filter(r => !r.ok);
    console.log(`${res.length - bad.length}/${res.length} live at the local version`);
    if (bad.length) console.log('not live: ' + bad.map(b => `${b.name}@${b.version}(${b.status})`).join(', '));
    process.exit(bad.length ? 1 : 0);
})();
