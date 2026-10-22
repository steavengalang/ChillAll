'use strict';
/**
 * Minify CSS that lives inside plain template literals (no `${}` interpolation, no backslashes) of a JS source.
 * Only touches literals that look like stylesheets, and only collapses whitespace/comments -> always safe.
 */
function minCss(s) {
    return s
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
}

function looksLikeCss(t) {
    return /\{[^}]*\}/.test(t) &&
        /(\.chill|:root|@keyframes|@media)/.test(t) &&
        !/(^|[^\w])(function|return|const|let)\b/.test(t);
}

// A template literal without "${" and without a backslash escape.
const PLAIN_TEMPLATE = new RegExp('`([^`$' + '\\\\' + ']*)`', 'g');

function minifyCssInJs(src) {
    return src.replace(PLAIN_TEMPLATE, (full, t) => (looksLikeCss(t) ? '`' + minCss(t) + '`' : full));
}

module.exports = { minCss, looksLikeCss, minifyCssInJs };

if (require.main === module) {
    const fs = require('fs');
    const src = fs.readFileSync(process.argv[2], 'utf8');
    const out = minifyCssInJs(src);
    console.log('before', src.length, 'after', out.length, 'saved', src.length - out.length);
}
