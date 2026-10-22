/**
 * ChillAvatar - Zero-dependency Avatar Component
 *
 * Usage:
 *   const a = ChillAvatar.create({ name: 'Ada Lovelace', src: '/ada.png', status: 'online' });
 *   const g = ChillAvatar.createGroup([{ name: 'A' }, { name: 'B' }, { name: 'C' }], { max: 2 }); // A B +1
 *
 * create(options):
 *   name       string  used for initials, alt text and accessible name
 *   src        string  image URL (falls back to initials/icon when it fails to load)
 *   alt        string  accessible name override
 *   size       xs|sm|md|lg|xl|2xl ('md')
 *   shape      circle|square|rounded ('circle')
 *   color      primary|secondary|success|warning|error | 'auto' (deterministic colour from name)
 *   icon       string  trusted icon markup (fallback when no name/src)
 *   status     online|offline|busy|away  (also exposed to assistive tech)
 *   badge      number|string  corner counter (numbers above `badgeMax` (99) show "99+")
 *   badgeMax   number  99
 *   title      string  native tooltip (defaults to name)
 * The element exposes avatar.chillavatar = { destroy }.
 *
 * createGroup(avatars, options)  alias: ChillAvatar.group
 *   max        number  5   visible avatars; the rest collapse into a "+N" chip
 *   total      number  total people when `avatars` only holds a page (adds to +N)
 *   size       shared size
 *   ariaLabel  string  accessible name of the group (default "N people")
 *   onMoreClick(event, hiddenAvatars)  makes the "+N" chip a keyboard operable button
 *   group.chillavatar = { destroy }
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillavatar_css_injected__';
    const AUTO_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chillavatar-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillavatar-styles';
        style.textContent = `
      :root {
        --chillavatar-bg: #e5e7eb;
        --chillavatar-text: #374151;
        --chillavatar-border: #ffffff;
        --chillavatar-online: #22c55e;
        --chillavatar-offline: #6b7280;
        --chillavatar-busy: #ef4444;
        --chillavatar-away: #f59e0b;
        --chillavatar-ring: #3b82f6;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillavatar-bg: #374151;
          --chillavatar-text: #e5e7eb;
          --chillavatar-border: #171717;
          --chillavatar-ring: #60a5fa;
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillavatar-bg: #374151;
        --chillavatar-text: #e5e7eb;
        --chillavatar-border: #171717;
        --chillavatar-ring: #60a5fa;
      }

      .chillavatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-sizing: border-box;
        border-radius: 50%;
        overflow: hidden;
        background: var(--chillavatar-bg);
        color: var(--chillavatar-text);
        font-weight: 600;
        user-select: none;
      }

      .chillavatar-xs { width: 24px; height: 24px; font-size: 10px; }
      .chillavatar-sm { width: 32px; height: 32px; font-size: 12px; }
      .chillavatar-md { width: 40px; height: 40px; font-size: 14px; }
      .chillavatar-lg { width: 48px; height: 48px; font-size: 16px; }
      .chillavatar-xl { width: 64px; height: 64px; font-size: 20px; }
      .chillavatar-2xl { width: 80px; height: 80px; font-size: 24px; }

      .chillavatar-square { border-radius: 8px; }
      .chillavatar-rounded { border-radius: 12px; }

      .chillavatar-img { width: 100%; height: 100%; object-fit: cover; }

      .chillavatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-transform: uppercase;
      }

      .chillavatar-icon { width: 60%; height: 60%; }

      /* status / badge sit outside the clipped image: avatar clips via inner wrapper */
      .chillavatar-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 25%;
        height: 25%;
        min-width: 8px;
        min-height: 8px;
        border-radius: 50%;
        border: 2px solid var(--chillavatar-border);
        box-sizing: border-box;
      }

      .chillavatar-status-online { background: var(--chillavatar-online); }
      .chillavatar-status-offline { background: var(--chillavatar-offline); }
      .chillavatar-status-busy { background: var(--chillavatar-busy); }
      .chillavatar-status-away { background: var(--chillavatar-away); }

      .chillavatar-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        box-sizing: border-box;
        font-size: 11px;
        font-weight: 600;
        color: white;
        background: #ef4444;
        border-radius: 9px;
        border: 2px solid var(--chillavatar-border);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Groups */
      .chillavatar-group { display: flex; align-items: center; }

      .chillavatar-group .chillavatar {
        margin-left: -8px;
        border: 2px solid var(--chillavatar-border);
      }

      .chillavatar-group > :first-child { margin-left: 0; }

      .chillavatar-group-count {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        margin-left: -8px;
        background: var(--chillavatar-bg);
        color: var(--chillavatar-text);
        border: 2px solid var(--chillavatar-border);
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        padding: 0;
        flex-shrink: 0;
      }
      button.chillavatar-group-count { cursor: pointer; }
      .chillavatar-group-count.chillavatar-xs { font-size: 10px; }

      button.chillavatar-group-count:focus-visible {
        outline: 2px solid var(--chillavatar-ring);
        outline-offset: 2px;
        position: relative;
        z-index: 1;
      }

      /* Colors */
      .chillavatar-primary { background: #3b82f6; color: white; }
      .chillavatar-secondary { background: #6b7280; color: white; }
      .chillavatar-success { background: #22c55e; color: white; }
      .chillavatar-warning { background: #f59e0b; color: white; }
      .chillavatar-error { background: #ef4444; color: white; }
      .chillavatar-auto { color: white; }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    function getInitials(name) {
        if (name == null) return '?';
        const parts = String(name).trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        const chars = function (s) { return Array.from(s); };
        if (parts.length === 1) return chars(parts[0]).slice(0, 2).join('').toUpperCase();
        return (chars(parts[0])[0] + chars(parts[parts.length - 1])[0]).toUpperCase();
    }

    function hashColor(name) {
        let h = 0;
        const s = String(name || '');
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return AUTO_COLORS[h % AUTO_COLORS.length];
    }

    function renderFallback(avatar, options) {
        const el = document.createElement('span');
        if (options.icon) {
            el.className = 'chillavatar-icon';
            el.setAttribute('aria-hidden', 'true');
            el.innerHTML = options.icon; // trusted, developer supplied icon markup
        } else {
            el.className = 'chillavatar-fallback';
            el.setAttribute('aria-hidden', 'true');
            el.textContent = getInitials(options.name);
        }
        avatar.insertBefore(el, avatar.firstChild);
    }

    function formatBadge(v, max) {
        const n = Number(v);
        if (typeof v === 'number' || (v !== '' && isFinite(n))) return n > max ? max + '+' : String(n);
        return String(v);
    }

    function create(options) {
        options = options || {};
        injectCSS();

        const avatar = document.createElement('div');
        avatar.className = 'chillavatar chillavatar-' + (options.size || 'md');

        if (options.shape === 'square') avatar.classList.add('chillavatar-square');
        if (options.shape === 'rounded') avatar.classList.add('chillavatar-rounded');
        if (options.color === 'auto') {
            avatar.classList.add('chillavatar-auto');
            avatar.style.background = hashColor(options.name);
        } else if (options.color) {
            avatar.classList.add('chillavatar-' + options.color);
        }

        const label = options.alt || options.name || '';
        avatar.setAttribute('role', 'img');
        if (label) avatar.setAttribute('aria-label', label);
        const tip = options.title != null ? options.title : options.name;
        if (tip) avatar.title = tip;

        let img = null;
        let onError = null;
        if (options.src) {
            img = document.createElement('img');
            img.className = 'chillavatar-img';
            img.alt = '';
            img.setAttribute('src', String(options.src));
            onError = function () {
                img.removeEventListener('error', onError);
                if (img.parentNode) img.parentNode.removeChild(img);
                renderFallback(avatar, options);
            };
            img.addEventListener('error', onError);
            avatar.appendChild(img);
        } else {
            renderFallback(avatar, options);
        }

        if (options.status) {
            const status = document.createElement('span');
            status.className = 'chillavatar-status chillavatar-status-' + options.status;
            status.setAttribute('aria-hidden', 'true');
            avatar.appendChild(status);
            if (label) avatar.setAttribute('aria-label', label + ', ' + options.status);
        }

        if (options.badge !== undefined && options.badge !== null) {
            const badge = document.createElement('span');
            badge.className = 'chillavatar-badge';
            badge.textContent = formatBadge(options.badge, options.badgeMax == null ? 99 : options.badgeMax);
            avatar.appendChild(badge);
        }

        avatar.chillavatar = {
            destroy: function () {
                if (img && onError) img.removeEventListener('error', onError);
                if (avatar.parentNode) avatar.parentNode.removeChild(avatar);
            }
        };

        return avatar;
    }

    function createGroup(avatars, options) {
        options = options || {};
        avatars = Array.isArray(avatars) ? avatars : [];
        injectCSS();

        const group = document.createElement('div');
        group.className = 'chillavatar-group';
        group.setAttribute('role', 'group');

        const max = options.max == null ? 5 : Math.max(0, options.max);
        const visible = avatars.slice(0, max);
        const hidden = avatars.slice(max);
        const total = options.total != null ? Math.max(options.total, avatars.length) : avatars.length;
        const remaining = total - visible.length;
        group.setAttribute('aria-label', options.ariaLabel || (total + (total === 1 ? ' person' : ' people')));

        const created = [];
        visible.forEach(function (avatarOptions) {
            const size = options.size || avatarOptions.size || 'md';
            const a = create(Object.assign({}, avatarOptions, { size: size }));
            created.push(a);
            group.appendChild(a);
        });

        let moreHandler = null;
        let more = null;
        if (remaining > 0) {
            const clickable = typeof options.onMoreClick === 'function';
            more = document.createElement(clickable ? 'button' : 'div');
            more.className = 'chillavatar-group-count chillavatar-' + (options.size || 'md');
            more.textContent = '+' + remaining;
            more.setAttribute('aria-label', remaining + ' more ' + (remaining === 1 ? 'person' : 'people'));
            if (clickable) {
                more.type = 'button';
                moreHandler = function (e) { options.onMoreClick(e, hidden); };
                more.addEventListener('click', moreHandler);
            } else {
                more.setAttribute('role', 'img');
            }
            group.appendChild(more);
        }

        group.chillavatar = {
            destroy: function () {
                if (more && moreHandler) more.removeEventListener('click', moreHandler);
                created.forEach(function (a) { a.chillavatar.destroy(); });
                if (group.parentNode) group.parentNode.removeChild(group);
            }
        };

        return group;
    }

    const ChillAvatar = {
        version: VERSION,

        create,
        createGroup,
        group: createGroup,
        getInitials,

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillAvatar;
    } else {
        window.ChillAvatar = ChillAvatar;
    }

})(typeof window !== 'undefined' ? window : this);
