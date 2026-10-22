/**
 * ChillAlert - Minimal Alert Library
 *
 * A framework-agnostic alert system with clean, minimal design.
 * SSR-safe (importing on the server never touches window/document), dark-mode aware
 * (prefers-color-scheme, `data-theme="dark"` and `.dark` on <html>), keyboard accessible
 * (role=alertdialog, focus trap, focus returns to the previously focused element).
 *
 * @example
 *   await ChillAlert.alert({ title: 'Saved', icon: 'success' });
 *   if (await ChillAlert.confirm({ title: 'Delete?', icon: 'warning', confirmButtonClass: 'error' })) { ... }
 *   const name = await ChillAlert.prompt({ title: 'Your name', placeholder: 'Jane' });
 *   ChillAlert.toast({ text: 'Copied', type: 'success', position: 'bottom-center' });
 *   const l = ChillAlert.loading({ text: 'Working...' }); await l.close();
 *
 * Options (all optional):
 *   alert   { title, text, html, icon='info', buttonText='OK', allowEscapeKey=true, allowOutsideClick=true }
 *   confirm { title, text, html, icon='question', confirmText='Confirm', cancelText='Cancel',
 *             confirmButtonClass='primary'|'success'|'error', allowEscapeKey=true, allowOutsideClick=true }
 *   prompt  { title, text, html, placeholder, defaultValue, inputType='text', confirmText='Submit', cancelText='Cancel',
 *             allowEscapeKey=true, allowOutsideClick=true }
 *   toast   { text, type='info', position='top-right'|'top-left'|'top-center'|'bottom-right'|'bottom-left'|'bottom-center',
 *             duration=3000 (0 = persistent) }   -> { toast, remove() }  (pauses while hovered/focused)
 *   loading { title, text='Loading...' }          -> { close() }
 *   closeAll()                                    closes every open dialog (promises resolve as dismissed) and toast
 *
 * `text`/`title` are always rendered with textContent. `html` is an explicit opt-in: you are responsible for sanitising it.
 *
 * @version 1.2.0
 * @license MIT
 */

(function (window) {
  'use strict';

  // ============================================================
  // CONFIGURATION & STATE
  // ============================================================

  const VERSION = '1.2.0';
  const CSS_INJECTED_FLAG = '__chillalert_css_injected__';
  const STYLE_ID = 'chillalert-styles';
  const Z_INDEX_BASE = 99999;
  const POSITIONS = ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'];
  const INPUT_TYPES = ['text', 'password', 'email', 'number', 'url', 'tel', 'search'];
  const BUTTON_CLASSES = ['primary', 'success', 'error', 'secondary'];

  // State management
  const state = {
    activeModals: [],   // dialog records: { overlay, modal, close }
    activeToasts: [],   // toast records:  { toast, remove }
    uid: 0
  };

  function hasDOM() {
    return typeof document !== 'undefined' && !!document.body;
  }

  // ============================================================
  // INLINE SVG ICONS - Minimal Design
  // ============================================================

  const ICONS = {
    success: `
      <svg class="chillalert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    error: `
      <svg class="chillalert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    warning: `
      <svg class="chillalert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    info: `
      <svg class="chillalert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    question: `
      <svg class="chillalert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    loading: `
      <svg class="chillalert-icon chillalert-icon-loading chillalert-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `
  };

  function hasIcon(name) {
    return typeof name === 'string' && Object.prototype.hasOwnProperty.call(ICONS, name);
  }

  // ============================================================
  // CSS INJECTION - Minimal Design
  // ============================================================

  const DARK_VARS = `
          --chillalert-text: #fafafa;
          --chillalert-text-light: #a3a3a3;
          --chillalert-bg: #171717;
          --chillalert-border: #404040;
          --chillalert-overlay: rgba(0, 0, 0, 0.6);
          --chillalert-hover-bg: #262626;

          /* Button in dark mode - use light backgrounds */
          --chillalert-btn-bg: #262626;
          --chillalert-btn-text: #fafafa;
          --chillalert-btn-border: #404040;
  `;

  /**
   * Injects ChillAlert CSS into the document head
   * Only runs once per page load
   */
  function injectCSS() {
    if (typeof document === 'undefined' || !document.head) return;
    if (window[CSS_INJECTED_FLAG] && document.getElementById(STYLE_ID)) return;
    if (document.getElementById(STYLE_ID)) {
      window[CSS_INJECTED_FLAG] = true;
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* ChillAlert v${VERSION} - Minimal Design */

      /* CSS Variables - Neutral Palette */
      :root {
        --chillalert-gray-50: #fafafa;
        --chillalert-gray-100: #f5f5f5;
        --chillalert-gray-200: #e5e5e5;
        --chillalert-gray-300: #d4d4d4;
        --chillalert-gray-400: #a3a3a3;
        --chillalert-gray-500: #737373;
        --chillalert-gray-600: #525252;
        --chillalert-gray-700: #404040;
        --chillalert-gray-800: #262626;
        --chillalert-gray-900: #171717;

        --chillalert-success: #22c55e;
        --chillalert-error: #ef4444;
        --chillalert-warning: #f97316;
        --chillalert-info: #3b82f6;

        --chillalert-text: #171717;
        --chillalert-text-light: #737373;
        --chillalert-bg: #ffffff;
        --chillalert-overlay: rgba(0, 0, 0, 0.4);
        --chillalert-border: #e5e5e5;
        --chillalert-hover-bg: #f5f5f5;

        /* Button specific colors (always visible) */
        --chillalert-btn-bg: #ffffff;
        --chillalert-btn-text: #171717;
        --chillalert-btn-border: #e5e5e5;
      }

      /* Dark mode: OS preference (unless the page forces light) */
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          ${DARK_VARS}
        }
      }

      /* Dark mode: explicit toggle (ChillTheme sets data-theme + class on <html>) */
      :root[data-theme="dark"], :root.dark {
        ${DARK_VARS}
      }

      /* Reset */
      .chillalert-overlay,
      .chillalert-modal,
      .chillalert-toast-container,
      .chillalert-toast {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-sizing: border-box;
      }

      .chillalert-overlay *,
      .chillalert-modal *,
      .chillalert-toast * {
        box-sizing: border-box;
      }

      /* Overlay */
      .chillalert-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--chillalert-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${Z_INDEX_BASE};
        animation: chillalert-fadeIn 0.15s ease-out;
      }

      .chillalert-overlay.chillalert-closing {
        animation: chillalert-fadeOut 0.15s ease-out;
      }

      /* Modal - Minimal Design */
      .chillalert-modal {
        position: relative;
        background: var(--chillalert-bg);
        border-radius: 8px;
        padding: 24px;
        max-width: 380px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border: 1px solid var(--chillalert-border);
        animation: chillalert-scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chillalert-modal:focus {
        outline: none;
      }

      .chillalert-overlay.chillalert-closing .chillalert-modal {
        animation: chillalert-scaleOut 0.15s ease-out;
      }

      /* Icon */
      .chillalert-icon-container {
        display: flex;
        justify-content: center;
        margin-bottom: 16px;
      }

      .chillalert-icon {
        width: 48px;
        height: 48px;
      }

      .chillalert-icon-success { color: var(--chillalert-success); }
      .chillalert-icon-error { color: var(--chillalert-error); }
      .chillalert-icon-warning { color: var(--chillalert-warning); }
      .chillalert-icon-info { color: var(--chillalert-info); }
      .chillalert-icon-question { color: var(--chillalert-btn-text); }
      .chillalert-icon-loading { color: var(--chillalert-btn-text); }

      /* Text */
      .chillalert-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--chillalert-text);
        margin: 0 0 8px 0;
        text-align: center;
        line-height: 1.4;
      }

      .chillalert-text {
        display: block;
        font-size: 14px;
        color: var(--chillalert-text-light);
        margin: 0 0 20px 0;
        text-align: center;
        line-height: 1.5;
      }

      /* Input */
      .chillalert-input {
        display: block;
        width: 100%;
        padding: 10px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid var(--chillalert-btn-border);
        border-radius: 6px;
        background: var(--chillalert-btn-bg);
        color: var(--chillalert-btn-text);
        margin-bottom: 20px;
        outline: none;
        transition: border-color 0.15s;
      }

      .chillalert-input:focus {
        border-color: var(--chillalert-text);
      }

      .chillalert-input::placeholder {
        color: var(--chillalert-text-light);
      }

      /* Buttons - Minimal */
      .chillalert-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .chillalert-button {
        min-height: 36px;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        border: 1px solid var(--chillalert-btn-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        outline: none;
        font-family: inherit;
        background: var(--chillalert-btn-bg);
        color: var(--chillalert-btn-text);
      }

      .chillalert-button:hover {
        background: var(--chillalert-hover-bg);
        border-color: var(--chillalert-text);
      }

      .chillalert-button:active {
        transform: scale(0.98);
      }

      .chillalert-button-primary {
        background: #3b82f6;
        color: #ffffff;
        border-color: #3b82f6;
      }

      .chillalert-button-primary:hover {
        background: #2563eb;
        color: #ffffff;
        border-color: #2563eb;
      }

      .chillalert-button-success {
        background: #22c55e;
        color: #ffffff;
        border-color: #22c55e;
      }

      .chillalert-button-success:hover {
        background: #16a34a;
        color: #ffffff;
        border-color: #16a34a;
      }

      .chillalert-button-error {
        background: #ef4444;
        color: #ffffff;
        border-color: #ef4444;
      }

      .chillalert-button-error:hover {
        background: #dc2626;
        color: #ffffff;
        border-color: #dc2626;
      }

      .chillalert-button-secondary {
        background: transparent;
        color: var(--chillalert-btn-text);
        border-color: var(--chillalert-btn-border);
      }

      .chillalert-button-secondary:hover {
        background: var(--chillalert-hover-bg);
        color: var(--chillalert-btn-text);
        border-color: var(--chillalert-text);
      }

      /* Toast Container */
      .chillalert-toast-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: ${Z_INDEX_BASE + 100};
        pointer-events: none;
      }

      .chillalert-toast-container.chillalert-top-right {
        top: 16px;
        right: 16px;
      }

      .chillalert-toast-container.chillalert-top-left {
        top: 16px;
        left: 16px;
      }

      .chillalert-toast-container.chillalert-top-center {
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }

      .chillalert-toast-container.chillalert-bottom-right {
        bottom: 16px;
        right: 16px;
      }

      .chillalert-toast-container.chillalert-bottom-left {
        bottom: 16px;
        left: 16px;
      }

      .chillalert-toast-container.chillalert-bottom-center {
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }

      /* Toast - Minimal */
      .chillalert-toast {
        background: var(--chillalert-bg);
        border-radius: 6px;
        border: 1px solid var(--chillalert-border);
        padding: 12px 16px;
        min-width: 280px;
        max-width: 380px;
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
        animation: chillalert-slideIn 0.2s ease-out;
      }

      .chillalert-toast.chillalert-closing {
        animation: chillalert-slideOut 0.2s ease-out;
      }

      .chillalert-toast-success { border-left: 3px solid var(--chillalert-success); }
      .chillalert-toast-error { border-left: 3px solid var(--chillalert-error); }
      .chillalert-toast-warning { border-left: 3px solid var(--chillalert-warning); }
      .chillalert-toast-info { border-left: 3px solid var(--chillalert-info); }

      .chillalert-toast .chillalert-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .chillalert-toast-text {
        display: block;
        font-size: 14px;
        color: var(--chillalert-text);
        line-height: 1.4;
        margin: 0;
      }

      /* Animations - Subtle */
      @keyframes chillalert-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes chillalert-fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes chillalert-scaleIn {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes chillalert-scaleOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.96);
        }
      }

      @keyframes chillalert-slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes chillalert-slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }

      @keyframes chillalert-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .chillalert-spin {
        animation: chillalert-spin 1s linear infinite;
      }

      /* Accessibility */
      .chillalert-button:focus-visible,
      .chillalert-input:focus-visible {
        outline: 2px solid var(--chillalert-text);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillalert-overlay,
        .chillalert-modal,
        .chillalert-toast,
        .chillalert-overlay.chillalert-closing,
        .chillalert-overlay.chillalert-closing .chillalert-modal,
        .chillalert-toast.chillalert-closing {
          animation: none !important;
        }
        .chillalert-button,
        .chillalert-input {
          transition: none !important;
        }
        .chillalert-spin {
          animation-duration: 3s;
        }
      }

      /* Responsive */
      @media (max-width: 640px) {
        .chillalert-modal {
          padding: 20px;
          max-width: 95%;
        }

        .chillalert-toast {
          min-width: 260px;
          max-width: 90vw;
        }

        .chillalert-buttons {
          flex-direction: column;
        }

        .chillalert-button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
    window[CSS_INJECTED_FLAG] = true;
  }

  // ============================================================
  // DOM HELPERS
  // ============================================================

  /**
   * Creates a DOM element with attributes (`text` is applied with textContent)
   */
  function createElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'text') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }

  /**
   * Safely removes an element from DOM
   */
  function removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  // ============================================================
  // FOCUS TRAP
  // ============================================================

  const FOCUSABLE = [
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  /**
   * Gets all focusable elements within a container
   */
  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.hidden);
  }

  /**
   * Keeps Tab / Shift+Tab inside `modal` (also recaptures focus that escaped it).
   */
  function handleTab(e, modal) {
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) {
      e.preventDefault();
      modal.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!modal.contains(active)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && (active === first || active === modal)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ============================================================
  // ANIMATION HELPERS
  // ============================================================

  /**
   * Animates element removal
   */
  function animateOut(element, immediate) {
    return new Promise((resolve) => {
      if (immediate) {
        removeElement(element);
        resolve();
        return;
      }
      element.classList.add('chillalert-closing');
      setTimeout(() => {
        removeElement(element);
        resolve();
      }, 150);
    });
  }

  function topDialog() {
    return state.activeModals[state.activeModals.length - 1];
  }

  // ============================================================
  // MODAL CREATION
  // ============================================================

  /**
   * Creates a modal overlay with content, wires keyboard/focus handling and mounts it.
   *
   * @param {Object}   o
   * @param {string}   [o.icon]
   * @param {string}   [o.title]
   * @param {string}   [o.text]
   * @param {string}   [o.html]            trusted HTML shown instead of `text`
   * @param {Node|string} [o.content]
   * @param {Array}    [o.buttons]         [{ text, className, onClick }]
   * @param {Function} [o.onClose]         called once with the close reason
   * @param {string}   [o.role]            dialog | alertdialog
   * @param {boolean}  [o.dismissOnEscape] default true
   * @param {boolean}  [o.dismissOnOverlay] default true
   * @param {Function} [o.onEnter]         Enter key handler (only while this dialog is on top)
   * @param {Element}  [o.initialFocus]    element to focus on open
   * @param {string}   [o.label]           aria-label when there is no title
   * @param {boolean}  [o.busy]            sets aria-busy
   */
  function createModal(o) {
    o = o || {};
    const id = ++state.uid;
    const iconName = o.icon ? (hasIcon(o.icon) ? o.icon : 'info') : null;
    const overlay = createElement('div', 'chillalert-overlay');
    const modal = createElement('div', 'chillalert-modal', {
      role: o.role || 'dialog',
      'aria-modal': 'true',
      tabindex: '-1'
    });
    if (o.busy) modal.setAttribute('aria-busy', 'true');

    // Icon
    if (iconName) {
      const iconContainer = createElement('div', 'chillalert-icon-container');
      iconContainer.innerHTML = ICONS[iconName]; // static, library-owned markup
      const iconEl = iconContainer.querySelector('.chillalert-icon');
      if (iconEl) {
        iconEl.classList.add(`chillalert-icon-${iconName}`);
      }
      modal.appendChild(iconContainer);
    }

    // Title
    if (o.title) {
      const titleEl = createElement('h2', 'chillalert-title', { text: String(o.title), id: `chillalert-title-${id}` });
      modal.appendChild(titleEl);
      modal.setAttribute('aria-labelledby', titleEl.id);
    }

    // Text / html
    if (o.html) {
      const htmlEl = createElement('div', 'chillalert-text', { id: `chillalert-text-${id}` });
      htmlEl.innerHTML = String(o.html); // explicit opt-in
      modal.appendChild(htmlEl);
      modal.setAttribute('aria-describedby', htmlEl.id);
    } else if (o.text) {
      const textEl = createElement('p', 'chillalert-text', { text: String(o.text), id: `chillalert-text-${id}` });
      modal.appendChild(textEl);
      modal.setAttribute('aria-describedby', textEl.id);
    }
    if (!o.title && (o.label || o.text)) {
      modal.setAttribute('aria-label', String(o.label || o.text));
    }

    // Custom content
    if (o.content) {
      if (typeof o.content === 'string') {
        const contentEl = createElement('div', 'chillalert-content');
        contentEl.textContent = o.content;
        modal.appendChild(contentEl);
      } else {
        modal.appendChild(o.content);
      }
    }

    // Buttons
    if (o.buttons && o.buttons.length > 0) {
      const buttonsContainer = createElement('div', 'chillalert-buttons');
      o.buttons.forEach(btn => {
        const button = createElement('button', `chillalert-button ${btn.className || ''}`.trim(), {
          text: btn.text,
          type: 'button'
        });
        if (btn.onClick) button.addEventListener('click', btn.onClick);
        buttonsContainer.appendChild(button);
        btn.element = button;
      });
      modal.appendChild(buttonsContainer);
    }

    overlay.appendChild(modal);
    overlay.style.zIndex = String(Z_INDEX_BASE + state.activeModals.length);

    const previousFocus = document.activeElement;
    let closed = false;
    let closePromise = null;
    let downOnOverlay = false;

    const record = { overlay, modal, close: null };

    // Keyboard: Esc / Tab trap / Enter. Capture phase so a dialog stacked over
    // another modal library does not let Esc leak to it.
    const handleKeydown = (e) => {
      if (topDialog() !== record) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (o.dismissOnEscape !== false) close('escape');
      } else if (e.key === 'Tab') {
        handleTab(e, modal);
      } else if (e.key === 'Enter' && o.onEnter) {
        o.onEnter(e);
      }
    };
    document.addEventListener('keydown', handleKeydown, true);

    // Click overlay to close (only when the press started on the overlay too,
    // so dragging a text selection out of the input does not dismiss)
    const handleMouseDown = (e) => { downOnOverlay = e.target === overlay; };
    const handleClick = (e) => {
      if (e.target === overlay && downOnOverlay && o.dismissOnOverlay !== false) {
        close('overlay');
      }
      downOnOverlay = false;
    };
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('click', handleClick);

    function close(reason, immediate) {
      if (closed) return closePromise;
      closed = true;
      document.removeEventListener('keydown', handleKeydown, true);
      overlay.removeEventListener('mousedown', handleMouseDown);
      overlay.removeEventListener('click', handleClick);
      state.activeModals = state.activeModals.filter(m => m !== record);

      // Return focus right away (don't wait for the exit animation)
      if (previousFocus && typeof previousFocus.focus === 'function' &&
          previousFocus !== document.body && document.contains(previousFocus)) {
        try { previousFocus.focus(); } catch (err) { /* ignore */ }
      }

      closePromise = animateOut(overlay, immediate);
      if (o.onClose) o.onClose(reason || 'close');
      return closePromise;
    }
    record.close = close;

    document.body.appendChild(overlay);
    state.activeModals.push(record);

    // Initial focus
    const target = o.initialFocus || getFocusableElements(modal)[0] || modal;
    target.focus();

    return { overlay, modal, cleanup: close, close, buttons: o.buttons };
  }

  // ============================================================
  // TOAST MANAGEMENT
  // ============================================================

  /**
   * Gets or creates toast container for a position
   */
  function getToastContainer(position) {
    const className = `chillalert-toast-container chillalert-${position}`;
    let container = document.querySelector(`.${className.split(' ').join('.')}`);

    if (!container) {
      container = createElement('div', className, { 'aria-live': 'polite', 'aria-relevant': 'additions' });
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Creates and shows a toast notification
   */
  function createToast({ text, type = 'info', position = 'top-right', duration = 3000 }) {
    if (!hasIcon(type) || type === 'loading' || type === 'question') type = 'info';
    if (POSITIONS.indexOf(position) === -1) position = 'top-right';
    duration = Number(duration);
    if (!isFinite(duration) || duration < 0) duration = 3000;

    const container = getToastContainer(position);
    const toast = createElement('div', `chillalert-toast chillalert-toast-${type}`, {
      role: type === 'error' ? 'alert' : 'status'
    });

    // Icon (static, library-owned markup)
    const iconContainer = createElement('div');
    iconContainer.innerHTML = ICONS[type];
    const iconEl = iconContainer.querySelector('.chillalert-icon');
    if (iconEl) {
      iconEl.classList.add(`chillalert-icon-${type}`);
      toast.appendChild(iconEl);
    }

    // Text
    const textEl = createElement('p', 'chillalert-toast-text', { text: text == null ? '' : String(text) });
    toast.appendChild(textEl);

    // Add to container
    container.appendChild(toast);

    let timer = null;
    let removed = false;
    let remaining = duration;
    let startedAt = 0;

    const start = () => {
      if (duration <= 0 || removed) return;
      startedAt = Date.now();
      clearTimeout(timer);
      timer = setTimeout(removeToast, Math.max(remaining, 0));
    };
    const pause = () => {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      remaining -= Date.now() - startedAt;
    };

    const record = { toast, remove: null };

    function removeToast(immediate) {
      if (removed) return Promise.resolve();
      removed = true;
      clearTimeout(timer);
      timer = null;
      toast.removeEventListener('mouseenter', pause);
      toast.removeEventListener('mouseleave', start);
      toast.removeEventListener('focusin', pause);
      toast.removeEventListener('focusout', start);
      state.activeToasts = state.activeToasts.filter(t => t !== record);
      return animateOut(toast, immediate === true).then(() => {
        // Remove container if empty
        if (container.children.length === 0) {
          removeElement(container);
        }
      });
    }

    record.remove = removeToast;
    state.activeToasts.push(record);

    // Pause while hovered / focused, resume with the remaining time
    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('mouseleave', start);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('focusout', start);

    start();

    return { toast, remove: () => removeToast() };
  }

  // ============================================================
  // DIALOG HELPERS
  // ============================================================

  function buttonClassFor(name, fallback) {
    return `chillalert-button-${BUTTON_CLASSES.indexOf(name) !== -1 ? name : fallback}`;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  const ChillAlert = {
    version: VERSION,

    /**
     * Shows an alert dialog
     */
    alert({ title = '', text = '', html, icon = 'info', buttonText = 'OK', allowEscapeKey = true, allowOutsideClick = true } = {}) {
      if (!hasDOM()) return Promise.resolve();
      injectCSS();

      return new Promise((resolve) => {
        const dialog = createModal({
          role: 'alertdialog',
          icon,
          title,
          text,
          html,
          buttons: [
            {
              text: buttonText,
              className: buttonClassFor(hasIcon(icon) ? icon : 'info', 'secondary'),
              onClick: () => dialog.close('confirm')
            }
          ],
          dismissOnEscape: allowEscapeKey !== false,
          dismissOnOverlay: allowOutsideClick !== false,
          onEnter: (e) => { e.preventDefault(); dialog.close('confirm'); },
          onClose: () => resolve()
        });
      });
    },

    /**
     * Shows a confirmation dialog
     */
    confirm({ title = '', text = '', html, icon = 'question', confirmText = 'Confirm', cancelText = 'Cancel',
      confirmButtonClass = 'primary', allowEscapeKey = true, allowOutsideClick = true } = {}) {
      if (!hasDOM()) return Promise.resolve(false);
      injectCSS();

      return new Promise((resolve) => {
        let result = false;
        const finish = (value, reason) => { result = value; dialog.close(reason); };
        const cfg = {
          role: 'alertdialog',
          icon,
          title,
          text,
          html,
          buttons: [
            { text: cancelText, className: 'chillalert-button-secondary', onClick: () => finish(false, 'cancel') },
            { text: confirmText, className: buttonClassFor(confirmButtonClass, 'primary'), onClick: () => finish(true, 'confirm') }
          ],
          dismissOnEscape: allowEscapeKey !== false,
          dismissOnOverlay: allowOutsideClick !== false,
          onEnter: (e) => {
            // Enter on a focused button activates that button natively
            const a = document.activeElement;
            if (a && a.tagName === 'BUTTON') return;
            e.preventDefault();
            finish(true, 'confirm');
          },
          onClose: () => resolve(result)
        };
        const dialog = createModal(cfg);
        // Default focus: the confirm button (Enter confirms, Shift+Tab reaches Cancel)
        cfg.buttons[1].element.focus();
      });
    },

    /**
     * Shows a toast notification
     */
    toast({ text = '', type = 'info', position = 'top-right', duration = 3000 } = {}) {
      if (!hasDOM()) return { toast: null, remove() { return Promise.resolve(); } };
      injectCSS();
      return createToast({ text, type, position, duration });
    },

    /**
     * Shows a prompt dialog for user input
     */
    prompt({ title = '', text = '', html, placeholder = '', confirmText = 'Submit', cancelText = 'Cancel',
      defaultValue = '', inputType = 'text', allowEscapeKey = true, allowOutsideClick = true } = {}) {
      if (!hasDOM()) return Promise.resolve(null);
      injectCSS();

      return new Promise((resolve) => {
        const input = createElement('input', 'chillalert-input', {
          type: INPUT_TYPES.indexOf(inputType) !== -1 ? inputType : 'text',
          placeholder: placeholder,
          'aria-label': String(placeholder || title || text || 'Input')
        });
        if (defaultValue) {
          input.value = defaultValue;
        }

        let result = null;
        const submit = () => { result = input.value.trim() || null; dialog.close('confirm'); };
        const dialog = createModal({
          role: 'dialog',
          title,
          text,
          html,
          content: input,
          buttons: [
            { text: cancelText, className: 'chillalert-button-secondary', onClick: () => dialog.close('cancel') },
            { text: confirmText, className: 'chillalert-button-primary', onClick: submit }
          ],
          dismissOnEscape: allowEscapeKey !== false,
          dismissOnOverlay: allowOutsideClick !== false,
          initialFocus: input,
          onEnter: (e) => {
            if (document.activeElement === input) {
              e.preventDefault();
              submit();
            }
          },
          onClose: () => resolve(result)
        });
        if (defaultValue && typeof input.select === 'function') input.select();
      });
    },

    /**
     * Shows a loading indicator
     */
    loading({ title = '', text = 'Loading...' } = {}) {
      if (!hasDOM()) return { close() { return Promise.resolve(); } };
      injectCSS();

      const dialog = createModal({
        role: 'dialog',
        icon: 'loading',
        title,
        text,
        label: text || title || 'Loading',
        busy: true,
        dismissOnEscape: false,
        dismissOnOverlay: false
      });

      return {
        close: () => dialog.close('close')
      };
    },

    /**
     * Closes every open dialog (their promises resolve as dismissed) and every toast
     */
    closeAll() {
      if (!hasDOM()) return;
      state.activeModals.slice().reverse().forEach(d => d.close('closeAll', true));
      state.activeToasts.slice().forEach(t => t.remove(true));
    },

    /** Injects the stylesheet now (done automatically on first use) */
    injectCSS
  };

  // Expose: CommonJS / ESM-interop when available, otherwise the global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChillAlert;
  } else {
    window.ChillAlert = ChillAlert;
  }

  // Auto-inject CSS if DOM is ready (browser only)
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectCSS);
    } else {
      injectCSS();
    }
  }

})(typeof window !== 'undefined' ? window : this);
