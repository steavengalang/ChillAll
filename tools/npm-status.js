'use strict';
/**
 * Read-only: compares every local package with the public npm registry.
 *   node tools/npm-status.js
 * Needs no npm login (uses the public registry API). Prints, per package: local version, published version,
 * maintainers, and what a publish would do (NEW / UPDATE / SAME / NAME TAKEN by someone else).
 */
const fs = require('fs');
const path = require('path');
const { ROOT, libs } = require('./env');

const ME = process.env.NPM_USER || 'chillcode';

function localPackages() {
    const out = [];
    const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    out.push({ dir: '.', name: rootPkg.name, version: rootPkg.version });
    for (const n of ['chillall', ...libs().filter(n => n !== 'chillalert')]) {
        const f = path.join(ROOT, n, 'package.json');
        if (!fs.existsSync(f)) { out.push({ dir: n, name: n, version: null, missingPackageJson: true }); continue; }
        const p = JSON.parse(fs.readFileSync(f, 'utf8'));
        out.push({ dir: n, name: p.name, version: p.version });
    }
    return out;
}

async function remote(name) {
    const r = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name));
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
    const j = await r.json();
    return { latest: j['dist-tags'] && j['dist-tags'].latest, maintainers: (j.maintainers || []).map(m => m.name) };
}

(async () => {
    const pkgs = localPackages();
    const rows = await Promise.all(pkgs.map(async p => ({ ...p, remote: await remote(p.name).catch(e => ({ error: e.message })) })));
    const tally = { NEW: 0, UPDATE: 0, SAME: 0, TAKEN: 0, ERROR: 0 };
    for (const r of rows) {
        let action;
        if (r.remote && r.remote.error) action = 'ERROR';
        else if (!r.remote) action = 'NEW';
        else if (!r.remote.maintainers.includes(ME)) action = 'TAKEN';
        else if (r.remote.latest === r.version) action = 'SAME';
        else action = 'UPDATE';
        r.action = action; tally[action]++;
        console.log(`${action.padEnd(7)} ${r.name.padEnd(22)} local ${String(r.version).padEnd(8)} npm ${String(r.remote ? r.remote.latest || r.remote.error : '-').padEnd(8)} ${r.remote && r.remote.maintainers ? '[' + r.remote.maintainers.join(',') + ']' : ''}${r.missingPackageJson ? '  (no package.json!)' : ''}`);
    }
    console.log('\n' + Object.entries(tally).map(([k, v]) => `${k}=${v}`).join('  '));
    if (process.argv.includes('--json')) fs.writeFileSync(path.join(__dirname, 'npm-status.json'), JSON.stringify(rows, null, 2));
})();
