'use strict';
/**
 * Publishes every package (chillall + all components + chillalert) to the npm registry, one by one.
 *
 *   node tools/publish.js                 # DRY RUN of everything (default, publishes nothing)
 *   node tools/publish.js --yes           # really publish
 *   node tools/publish.js --yes --only chillall,chillbutton
 *   node tools/publish.js --yes --continue   # keep going after a failure
 *
 * Safety: refuses to run when not logged in; skips versions that already exist on the registry;
 * stops at the first failure unless --continue. Auth comes from your own npm config (never read here).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT, libs } = require('./env');

const args = process.argv.slice(2);
const REAL = args.includes('--yes');
const KEEP_GOING = args.includes('--continue');
const onlyArg = args.find(a => a.startsWith('--only=')) || (args.includes('--only') ? '--only=' + args[args.indexOf('--only') + 1] : null);
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;
const isWin = process.platform === 'win32';

function npm(argv, cwd) {
    return spawnSync('npm', argv, { cwd, encoding: 'utf8', shell: isWin });
}

function targets() {
    const list = [{ dir: path.join(ROOT, 'chillall'), label: 'chillall' }];
    for (const id of libs()) list.push({ dir: id === 'chillalert' ? ROOT : path.join(ROOT, id), label: id });
    return list.filter(t => !ONLY || ONLY.has(t.label));
}

async function onRegistry(name, version) {
    try {
        const r = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name));
        if (r.status === 404) return false;
        const j = await r.json();
        return !!(j.versions && j.versions[version]);
    } catch { return false; }
}

(async () => {
    const who = npm(['whoami'], ROOT);
    const user = (who.stdout || '').trim();
    if (who.status !== 0 || !user) {
        console.error('Not logged in to npm (npm whoami failed). Set your token yourself first:\n  npm config set //registry.npmjs.org/:_authToken <your-token>');
        process.exit(2);
    }
    console.log(`npm user: ${user}   mode: ${REAL ? 'REAL PUBLISH' : 'dry run (add --yes to publish)'}\n`);

    const results = { published: [], skipped: [], failed: [] };
    const list = targets();
    let i = 0;
    for (const t of list) {
        i++;
        const pkg = JSON.parse(fs.readFileSync(path.join(t.dir, 'package.json'), 'utf8'));
        const tag = `[${String(i).padStart(2)}/${list.length}] ${pkg.name}@${pkg.version}`;
        if (await onRegistry(pkg.name, pkg.version)) { console.log(`${tag}  already on npm, skipped`); results.skipped.push(pkg.name); continue; }
        const argv = ['publish', '--access', 'public'];
        if (!REAL) argv.push('--dry-run');
        const r = npm(argv, t.dir);
        if (r.status === 0) { console.log(`${tag}  ${REAL ? 'PUBLISHED' : 'ok (dry run)'}`); results.published.push(pkg.name); }
        else {
            const msg = ((r.stderr || '') + (r.stdout || '')).split('\n').filter(l => /npm (error|ERR!)/.test(l) && !/A complete log/.test(l)).slice(0, 4).join(' | ');
            console.log(`${tag}  FAILED  ${msg.replace(/npm_[A-Za-z0-9]+/g, 'npm_***')}`);
            results.failed.push(pkg.name);
            if (!KEEP_GOING) break;
        }
        if (REAL) await new Promise(r => setTimeout(r, 1200));
    }
    console.log(`\n${REAL ? 'published' : 'would publish'}: ${results.published.length}   skipped: ${results.skipped.length}   failed: ${results.failed.length}`);
    if (results.failed.length) console.log('failed: ' + results.failed.join(', '));
    process.exit(results.failed.length ? 1 : 0);
})();
