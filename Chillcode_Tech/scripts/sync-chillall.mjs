// Copies the built ChillAll bundle (../chillall/dist) into the site so it can be deployed on its own (Vercel only
// uploads this folder). Run after `node ../tools/build.js`. Safe no-op when ../chillall is not next to the site.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', '..', 'chillall', 'dist');
const out = join(here, '..', 'src', 'lib', 'vendor');

if (!existsSync(join(dist, 'chillall.esm.js'))) {
    console.log('[sync:chillall] ../chillall/dist not found - using the committed copy in src/lib/vendor');
    process.exit(0);
}
mkdirSync(out, { recursive: true });
copyFileSync(join(dist, 'chillall.esm.js'), join(out, 'chillall.esm.js'));
// TypeScript resolves './chillall.esm.js' to './chillall.esm.d.ts'
copyFileSync(join(dist, 'chillall.d.ts'), join(out, 'chillall.esm.d.ts'));
console.log(`[sync:chillall] vendored chillall.esm.js (${(statSync(join(out, 'chillall.esm.js')).size / 1024).toFixed(0)} KB) + types`);
