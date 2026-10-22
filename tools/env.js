'use strict';
/**
 * Shared test helpers for ChillLib components.
 *
 *   const { load, loadSSR, libs } = require('./env');
 *   const { window, lib } = load('chillbutton');          // jsdom, CommonJS mode
 *   const { window, lib } = load('chillbutton', 'global'); // jsdom, <script> mode (window.ChillButton)
 *   loadSSR('chillbutton');                                // plain Node, no window/document – must not throw
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
// Wrapper / meta packages that are not real components.
const META = new Set(['chillall', 'chillcore', 'chilldata', 'chillforms', 'chillnav', 'chillfeedback', 'chillutils', 'Chillcode_Tech']);

function sourceFile(name) {
    if (name === 'chillalert') return path.join(ROOT, 'src', 'chillalert.js');
    return path.join(ROOT, name, 'src', name + '.js');
}

function libs() {
    const out = ['chillalert'];
    for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (!d.isDirectory() || META.has(d.name) || d.name === 'chillalert') continue;
        if (!/^chill[a-z0-9]+$/.test(d.name)) continue;
        if (fs.existsSync(sourceFile(d.name))) out.push(d.name);
    }
    return out.sort();
}

function globalName(src) {
    const m = src.match(/window\.(Chill[A-Za-z0-9]+)\s*=/);
    return m && m[1];
}

function newDom() {
    return new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only'
    });
}

/** Load a component into a fresh jsdom window. */
function load(name, mode = 'cjs') {
    const src = fs.readFileSync(sourceFile(name), 'utf8');
    const dom = newDom();
    const { window } = dom;
    // jsdom lacks a few APIs components commonly touch; stub them.
    if (!window.matchMedia) window.matchMedia = q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    if (!window.ResizeObserver) window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    if (!window.IntersectionObserver) window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    if (!window.Element.prototype.scrollIntoView) window.Element.prototype.scrollIntoView = function () {};
    const errors = [];
    window.addEventListener('error', e => errors.push(e.error || e.message));
    let lib;
    if (mode === 'cjs') {
        const module = { exports: {} };
        window.__chill_module = module;
        window.eval('(function(module, exports){' + src + '\n})(window.__chill_module, window.__chill_module.exports)');
        lib = module.exports;
    } else {
        window.eval(src);
        lib = window[globalName(src)];
    }
    return { dom, window, document: window.document, lib, errors };
}

/** Evaluate in a bare Node context (no window/document) to prove SSR/import safety. */
function loadSSR(name) {
    const src = fs.readFileSync(sourceFile(name), 'utf8');
    const module = { exports: {} };
    const ctx = vm.createContext({ module, exports: module.exports, console });
    vm.runInContext(src, ctx, { filename: sourceFile(name) });
    return module.exports;
}

module.exports = { ROOT, META, libs, load, loadSSR, sourceFile, globalName };
