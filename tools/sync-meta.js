'use strict';
/**
 * Keeps every publishable package consistent with its source:
 *   - package.json version = the `const VERSION` in the component source (chillalert / chillall handled explicitly)
 *   - creates a package.json for components that lack one
 *   - repository / bugs / homepage point at the monorepo (with `directory`)
 *   - writes a short README.md for each component package (npm page content)
 *
 *   node tools/sync-meta.js          # apply
 *   node tools/sync-meta.js --check  # report only, exit 1 if anything would change
 */
const fs = require('fs');
const path = require('path');
const { ROOT, libs, sourceFile, globalName } = require('./env');

const REPO = 'https://github.com/steavengalang/ChillAll';
const check = process.argv.includes('--check');
let changed = 0;

function writeIfChanged(file, content) {
    const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (old === content) return false;
    changed++;
    if (!check) fs.writeFileSync(file, content);
    return true;
}
const json = o => JSON.stringify(o, null, 4) + '\n';

function describe(src, id) {
    const m = src.match(/\/\*\*?\s*\n?\s*\*?\s*(Chill[A-Za-z]+)\s*[-–—:]\s*([^\n*]+)/);
    return m ? m[2].trim().replace(/\s+$/, '') : `Zero-dependency ${id} component`;
}

function readme(name, G, description, version) {
    return `# ${name}

${description}

Part of **[ChillAll](${REPO})**: 88 zero-dependency UI components (accessible, dark-mode ready, SSR-safe to import). ${name} is the standalone build of one of them; the \`chillall\` package contains all of them and is tree-shakeable.

## Install

\`\`\`bash
npm install ${name}
\`\`\`

## Use

\`\`\`js
import ${G} from '${name}';          // or: const ${G} = require('${name}');

// see the options and methods in the source header: src/${name}.js
\`\`\`

No bundler? Load the file and use the global:

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/${name}@${version}/dist/${name}.js"></script>
<script>console.log(${G}.version);</script>
\`\`\`

## Why ChillAll components

- Zero dependencies, nothing to import for styles (CSS is injected on first use)
- Accessible: ARIA roles, keyboard support, focus management, reduced-motion
- Dark mode via \`<html data-theme="dark">\` (see \`chilltheme\`) or the OS setting
- Safe by default: text is rendered as text, HTML is an explicit opt-in
- Every instance has \`destroy()\`

## License

MIT, see the [repository](${REPO}).
`;
}

for (const id of libs()) {
    const src = fs.readFileSync(sourceFile(id), 'utf8');
    const vm = src.match(/const VERSION\s*=\s*['"]([^'"]+)['"]/);
    const version = vm ? vm[1] : '1.0.0';

    if (id === 'chillalert') {
        const f = path.join(ROOT, 'package.json');
        const p = JSON.parse(fs.readFileSync(f, 'utf8'));
        p.version = version;
        if (p.dependencies) { delete p.dependencies.chillalert; if (!Object.keys(p.dependencies).length) delete p.dependencies; }
        p.repository = { type: 'git', url: `git+${REPO}.git` };
        p.bugs = { url: `${REPO}/issues` };
        p.homepage = `${REPO}#readme`;
        writeIfChanged(f, json(p));
        continue;
    }

    const dir = path.join(ROOT, id);
    const f = path.join(dir, 'package.json');
    let p;
    if (fs.existsSync(f)) p = JSON.parse(fs.readFileSync(f, 'utf8'));
    else {
        p = {
            name: id,
            version,
            description: describe(src, id.slice(5)),
            main: `dist/${id}.js`,
            module: `src/${id}.js`,
            files: ['dist', 'src', 'README.md'],
            keywords: [id.slice(5), 'ui', 'component', 'vanilla-js', 'zero-dependency', 'framework-agnostic'],
            author: 'ChillCode Tech',
            license: 'MIT'
        };
    }
    p.version = version;
    if (Array.isArray(p.files) && !p.files.includes('README.md')) p.files.push('README.md');
    if (Array.isArray(p.keywords) && !p.keywords.includes('chillall')) p.keywords.push('chillall');
    p.repository = { type: 'git', url: `git+${REPO}.git`, directory: id };
    p.bugs = { url: `${REPO}/issues` };
    p.homepage = `${REPO}/tree/main/${id}#readme`;
    // stable key order
    const order = ['name', 'version', 'description', 'main', 'module', 'files', 'keywords', 'author', 'license', 'repository', 'bugs', 'homepage'];
    const sorted = {};
    for (const k of order) if (k in p) sorted[k] = p[k];
    for (const k of Object.keys(p)) if (!(k in sorted)) sorted[k] = p[k];
    writeIfChanged(f, json(sorted));

    writeIfChanged(path.join(dir, 'README.md'), readme(id, globalName(src), sorted.description, version));
}

console.log(check ? (changed ? `${changed} file(s) would change` : 'package metadata is in sync') : `updated ${changed} file(s)`);
process.exit(check && changed ? 1 : 0);
