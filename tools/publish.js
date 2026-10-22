'use strict';
/**
 * Publishes every package (chillall + all components + chillalert) to the npm registry.
 *
 *   node tools/publish.js                      # DRY RUN of everything (default, publishes nothing)
 *   node tools/publish.js --yes                # really publish
 *   node tools/publish.js --yes --parallel=6   # N publishes at a time (default 4)
 *   node tools/publish.js --yes --only=chillall,chillbutton
 *
 * Safety: refuses to run when not logged in; skips versions already on the registry; each publish has a timeout;
 * failures never stop the others and are listed at the end (safe to re-run: published versions are skipped).
 * Auth comes from your own npm config, it is never read here.
 *
 * Network tip: if uploads fail with ECONNRESET, run with
 *   NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT, libs } = require('./env');

const args = process.argv.slice(2);
const REAL = args.includes('--yes');
const arg = name => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : null; };
const PARALLEL = Math.max(1, Number(arg('parallel')) || 4);
const ONLY = arg('only') ? new Set(arg('only').split(',')) : null;
const TIMEOUT_MS = 8 * 60 * 1000;
const isWin = process.platform === 'win32';
const scrub = s => String(s).replace(/npm_[A-Za-z0-9]+/g, 'npm_***').replace(/Bearer [A-Za-z0-9._-]+/g, 'Bearer ***');

function targets() {
    const list = [{ dir: path.join(ROOT, 'chillall'), label: 'chillall' }];
    for (const id of libs()) list.push({ dir: id === 'chillalert' ? ROOT : path.join(ROOT, id), label: id });
    return list.filter(t => !ONLY || ONLY.has(t.label));
}

async function onRegistry(name, version) {
    try {
        const r = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name) + '?t=' + Date.now(), { headers: { 'cache-control': 'no-cache' } });
        if (r.status === 404) return false;
        const j = await r.json();
        return !!(j.versions && j.versions[version]);
    } catch { return false; }
}

function publish(dir) {
    return new Promise(resolve => {
        const argv = ['publish', '--access', 'public', '--fetch-retries=2'];
        if (!REAL) argv.push('--dry-run');
        const child = spawn('npm', argv, { cwd: dir, shell: isWin, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        child.stdout.on('data', d => { out += d; });
        child.stderr.on('data', d => { out += d; });
        const timer = setTimeout(() => { out += '\nTIMEOUT'; if (isWin) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F']); else child.kill('SIGKILL'); }, TIMEOUT_MS);
        child.on('close', code => { clearTimeout(timer); resolve({ code, out }); });
    });
}

(async () => {
    const who = spawnSync('npm', ['whoami'], { cwd: ROOT, encoding: 'utf8', shell: isWin });
    const user = (who.stdout || '').trim();
    if (who.status !== 0 || !user) {
        console.error('Not logged in to npm (npm whoami failed). Set your token yourself first:\n  npm config set //registry.npmjs.org/:_authToken <your-token>');
        process.exit(2);
    }
    console.log(`npm user: ${user}   mode: ${REAL ? 'REAL PUBLISH' : 'dry run (add --yes to publish)'}   parallel: ${PARALLEL}\n`);

    const list = targets();
    const results = { published: [], skipped: [], failed: [] };
    let next = 0, done = 0;

    async function worker() {
        while (next < list.length) {
            const t = list[next++];
            const pkg = JSON.parse(fs.readFileSync(path.join(t.dir, 'package.json'), 'utf8'));
            let line;
            if (await onRegistry(pkg.name, pkg.version)) { results.skipped.push(pkg.name); line = 'already on npm, skipped'; }
            else {
                const r = await publish(t.dir);
                if (r.code === 0) { results.published.push(pkg.name); line = REAL ? 'PUBLISHED' : 'ok (dry run)'; }
                else {
                    results.failed.push(pkg.name);
                    const msg = r.out.split('\n').filter(l => /npm (error|ERR!)|TIMEOUT|ECONNRESET/.test(l)).slice(0, 3).join(' | ');
                    line = 'FAILED  ' + scrub(msg);
                }
            }
            done++;
            console.log(`[${String(done).padStart(2)}/${list.length}] ${pkg.name}@${pkg.version}  ${line}`);
        }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL, list.length) }, worker));

    console.log(`\n${REAL ? 'published' : 'would publish'}: ${results.published.length}   skipped: ${results.skipped.length}   failed: ${results.failed.length}`);
    if (results.failed.length) console.log('failed (re-run to retry): ' + results.failed.join(', '));
    process.exit(results.failed.length ? 1 : 0);
})();
