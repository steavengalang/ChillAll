/**
 * ChillPortal - Zero-dependency Portal Utility
 *
 * Renders content into a shared root appended to <body> (or any target), escaping overflow / stacking contexts.
 *
 * @example
 *   const el = ChillPortal.create('tip', 'Hello <b>world</b>');         // string -> TEXT (safe)
 *   ChillPortal.create('rich', '<b>trusted</b>', { html: true });       // explicit HTML opt-in
 *   ChillPortal.create('node', someElement, { target: '#modals', className: 'my-layer' });
 *   ChillPortal.update('tip', 'New text'); ChillPortal.remove('tip'); ChillPortal.clear(); ChillPortal.destroy();
 *
 * create(id, content, options): content = string | Node. Re-using an id replaces (and cleans up) the old portal.
 * Options: html false (OPT-IN: string content is inserted with innerHTML - trusted markup only), target (Element | selector,
 *          default the shared root), className, attrs {name: value}, onRemove(container).
 * API: create, update(id, content, {html}), remove, get, has, clear, ids(), getRoot(), destroy() (clear + remove the root)
 *
 * The root (#chill-portal-root, z-index 10000, pointer-events: none so it never blocks the page) is created lazily, re-created
 * if something removed it from the document, and each portal container re-enables pointer events for itself.
 *
 * @version 1.1.0
 * @license MIT
 */
(function (window) {
    'use strict';
    const VERSION = '1.1.0';
    const portals = new Map();
    let portalRoot = null;

    function getRoot() {
        if (typeof document === 'undefined') return null;
        if (portalRoot && portalRoot.isConnected) return portalRoot;
        portalRoot = document.getElementById('chill-portal-root');
        if (!portalRoot) {
            portalRoot = document.createElement('div');
            portalRoot.id = 'chill-portal-root';
            portalRoot.style.cssText = 'position:fixed;top:0;left:0;z-index:10000;pointer-events:none;';
            document.body.appendChild(portalRoot);
        }
        return portalRoot;
    }

    function setContent(container, content, html) {
        while (container.firstChild) container.removeChild(container.firstChild);
        if (content === null || content === undefined) return;
        if (typeof content === 'string' || typeof content === 'number') {
            if (html) container.innerHTML = String(content); else container.textContent = String(content);
        } else if (content.nodeType) {
            container.appendChild(content);
        }
    }

    function resolveTarget(t) {
        if (!t) return getRoot();
        if (typeof t === 'string') return document.querySelector(t) || getRoot();
        return t.nodeType ? t : getRoot();
    }

    function create(id, content, options) {
        options = options || {};
        if (typeof document === 'undefined') return null;
        if (portals.has(id)) remove(id);
        const container = document.createElement('div');
        container.id = 'portal-' + id;
        container.setAttribute('data-chill-portal', String(id));
        container.style.pointerEvents = 'auto';
        if (options.className) container.className = String(options.className);
        if (options.attrs) Object.keys(options.attrs).forEach(function (k) { container.setAttribute(k, options.attrs[k]); });
        setContent(container, content, options.html === true);
        const target = resolveTarget(options.target);
        target.appendChild(container);
        portals.set(id, { container: container, target: target, onRemove: options.onRemove || null, html: options.html === true });
        return container;
    }

    function update(id, content, options) {
        const portal = portals.get(id);
        if (!portal) return null;
        setContent(portal.container, content, options && options.html !== undefined ? options.html === true : portal.html);
        return portal.container;
    }

    function remove(id) {
        const portal = portals.get(id);
        if (!portal) return;
        portals.delete(id);
        if (portal.container.parentNode) portal.container.parentNode.removeChild(portal.container);
        if (portal.onRemove) { try { portal.onRemove(portal.container); } catch (e) { /* ignore */ } }
    }

    function get(id) { const p = portals.get(id); return p ? p.container : null; }
    function has(id) { return portals.has(id); }
    function ids() { return Array.from(portals.keys()); }
    function clear() { Array.from(portals.keys()).forEach(remove); }

    /** Remove every portal and the shared root itself. */
    function destroy() {
        clear();
        if (portalRoot && portalRoot.parentNode) portalRoot.parentNode.removeChild(portalRoot);
        portalRoot = null;
    }

    const ChillPortal = {
        version: VERSION,
        create: create, update: update, remove: remove, get: get, has: has, ids: ids, clear: clear, getRoot: getRoot, destroy: destroy
    };

    if (typeof module !== 'undefined' && module.exports) { module.exports = ChillPortal; }
    else { window.ChillPortal = ChillPortal; }
})(typeof window !== 'undefined' ? window : this);
