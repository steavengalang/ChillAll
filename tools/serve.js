'use strict';
/** Tiny zero-dependency static server for the demo: node tools/serve.js [port]  ->  http://localhost:5188/chillall/demo/ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 5188;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ts': 'text/plain; charset=utf-8' };

http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
    fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404).end('not found: ' + p); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(buf);
    });
}).listen(PORT, () => console.log('ChillAll demo: http://localhost:' + PORT + '/chillall/demo/'));
