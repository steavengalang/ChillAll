'use strict';
// Verifies the built single-file ChillAll package (run `node tools/build.js` first).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const { libs, load, globalName, sourceFile } = require('../env');

const DIST = path.join(__dirname, '..', '..', 'chillall', 'dist');
const read = f => fs.readFileSync(path.join(DIST, f), 'utf8');

test('every component on disk is in the bundle (via window globals + ChillAll)', () => {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
    const { window } = dom;
    window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    window.eval(read('chillall.js'));
    assert.ok(window.ChillAll, 'window.ChillAll');
    const missing = [];
    for (const name of libs()) {
        const g = globalName(fs.readFileSync(sourceFile(name), 'utf8'));
        const lib = window[g];
        if (!lib) { missing.push(g + ' (global)'); continue; }
        if (window.ChillAll[g.slice(5)] !== lib) missing.push(g + ' (ChillAll.' + g.slice(5) + ')');
        if (!lib.version) missing.push(g + ' (version)');
    }
    assert.deepEqual(missing, []);
    assert.equal(window.ChillAll.totalLibraries, libs().length);
});

test('CommonJS build loads in plain Node (no window/document) and exposes all components', () => {
    const module = { exports: {} };
    const ctx = vm.createContext({ module, exports: module.exports, console });
    vm.runInContext(read('chillall.cjs'), ctx);
    const api = module.exports;
    assert.equal(typeof api.ChillAll, 'object');
    assert.equal(api.ChillAll.totalLibraries, libs().length);
    for (const c of api.components) assert.ok(api.ChillAll[c.key], 'missing ' + c.key);
    assert.equal(api.ChillAll.get('button'), api.ChillButton);
    assert.equal(api.ChillAll.get('ChillAlert'), api.ChillAlert);
});

test('ESM build exports named components and a default', () => {
    const src = read('chillall.esm.js');
    assert.match(src, /export \{[^}]*ChillButton[^}]*\}/);
    assert.match(src, /export default|as default/);
    assert.ok(!/window\.ChillAll\s*=/.test(src), 'ESM build must not touch globals');
});

test('minified IIFE is smaller and still evaluates', () => {
    assert.ok(read('chillall.min.js').length < read('chillall.js').length);
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    dom.window.eval(read('chillall.min.js'));
    assert.ok(dom.window.ChillAll.Button);
});

test('d.ts mentions every component', () => {
    const d = read('chillall.d.ts');
    for (const name of libs()) {
        const g = globalName(fs.readFileSync(sourceFile(name), 'utf8'));
        assert.ok(d.includes(`export const ${g}:`), g);
    }
});

test('components can be created through the bundle (smoke)', () => {
    const dom = new JSDOM('<!doctype html><body><button id="b">Go</button></body>', { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    dom.window.eval(read('chillall.js'));
    const btn = dom.window.ChillAll.Button.create({ text: 'Hi' });
    assert.equal(btn.tagName, 'BUTTON');
    assert.ok(dom.window.document.getElementById('chillbutton-styles'));
});
