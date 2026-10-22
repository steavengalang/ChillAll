/**
 * ChillInfiniteScroll - Zero-dependency Infinite Scroll Component
 *
 * Usage:
 *   const is = ChillInfiniteScroll.init('#feed', {
 *       onLoadMore: async () => { is.appendElement(...); return { hasMore: page < last }; },
 *       onError: err => console.warn(err)
 *   });
 *   is.destroy();
 *
 * Options:
 *   threshold    number     200      px before the end at which to trigger (IntersectionObserver rootMargin)
 *   root         Element    null     scroll container (default: viewport)
 *   loadingText, endText, errorText, retryText   strings (escaped, set via textContent)
 *   onLoadMore() -> Promise<void | false | { hasMore:false }>   resolving false / {hasMore:false} marks the end
 *   onError(error)     called when onLoadMore rejects/throws (error state with Retry button is shown)
 *   onComplete()       called when the end is reached
 * Instance: loadMore(), retry(), reset(), setComplete(), showError(message?), append(html) [trusted HTML],
 *   appendElement(el), appendElements(els), destroy()
 *   State: isLoading, hasMore, hasError. `aria-busy` is set on the host while loading;
 *   the loader is a polite live region and the error state is an alert.
 *
 * @version 1.1.0
 * @license MIT
 */

(function (window) {
    'use strict';

    const VERSION = '1.1.0';
    const CSS_INJECTED_FLAG = '__chillinfinitescroll_css_injected__';

    function injectCSS() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('chillinfinitescroll-styles')) return;

        const style = document.createElement('style');
        style.id = 'chillinfinitescroll-styles';
        style.textContent = `
      :root {
        --chillinfinitescroll-text: #6b7280;
        --chillinfinitescroll-spinner: #3b82f6;
        --chillinfinitescroll-track: rgba(59, 130, 246, 0.2);
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillinfinitescroll-text: #9ca3af;
          --chillinfinitescroll-spinner: #60a5fa;
          --chillinfinitescroll-track: rgba(96, 165, 250, 0.25);
        }
      }

      :root[data-theme="dark"], :root.dark {
        --chillinfinitescroll-text: #9ca3af;
        --chillinfinitescroll-spinner: #60a5fa;
        --chillinfinitescroll-track: rgba(96, 165, 250, 0.25);
      }

      .chillinfinitescroll-loader {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 12px;
      }

      .chillinfinitescroll-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid var(--chillinfinitescroll-track);
        border-top-color: var(--chillinfinitescroll-spinner);
        border-radius: 50%;
        animation: chillinfinitescroll-spin 0.8s linear infinite;
      }

      @keyframes chillinfinitescroll-spin {
        to { transform: rotate(360deg); }
      }

      .chillinfinitescroll-text {
        font-size: 14px;
        color: var(--chillinfinitescroll-text);
      }

      .chillinfinitescroll-end {
        text-align: center;
        padding: 24px;
        font-size: 14px;
        color: var(--chillinfinitescroll-text);
      }

      .chillinfinitescroll-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 24px;
        text-align: center;
      }

      .chillinfinitescroll-error-text {
        font-size: 14px;
        color: var(--chillinfinitescroll-text);
      }

      .chillinfinitescroll-retry {
        min-height: 32px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        background: #3b82f6;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }

      .chillinfinitescroll-retry:hover { opacity: 0.9; }

      .chillinfinitescroll-retry:focus-visible {
        outline: 2px solid var(--chillinfinitescroll-spinner);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .chillinfinitescroll-spinner { animation-duration: 2.4s; }
        .chillinfinitescroll-retry { transition: none; }
      }
    `;

        document.head.insertBefore(style, document.head.firstChild);
        window[CSS_INJECTED_FLAG] = true;
    }

    class ChillInfiniteScrollInstance {
        constructor(selector, options) {
            options = options || {};
            this.element = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            this.options = Object.assign({}, options, {
                threshold: options.threshold != null ? options.threshold : 200,
                root: options.root || null,
                loadingText: options.loadingText || 'Loading...',
                endText: options.endText || 'No more items',
                errorText: options.errorText || 'Failed to load',
                retryText: options.retryText || 'Retry',
                onLoadMore: options.onLoadMore || null,
                onError: options.onError || null,
                onComplete: options.onComplete || null
            });

            this.isLoading = false;
            this.hasMore = true;
            this.hasError = false;
            this.observer = null;
            this._destroyed = false;
            this._onRetryClick = () => this.retry();

            if (!this.element) return;
            this.init();
        }

        init() {
            injectCSS();
            this.createLoader();
            this.setupObserver();
        }

        createLoader() {
            const o = this.options;

            this.loaderEl = document.createElement('div');
            this.loaderEl.className = 'chillinfinitescroll-loader';
            this.loaderEl.setAttribute('role', 'status');
            this.loaderEl.setAttribute('aria-live', 'polite');
            const spinner = document.createElement('div');
            spinner.className = 'chillinfinitescroll-spinner';
            spinner.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.className = 'chillinfinitescroll-text';
            text.textContent = o.loadingText;
            this.loaderEl.appendChild(spinner);
            this.loaderEl.appendChild(text);
            this.loaderEl.style.display = 'none';
            this.element.appendChild(this.loaderEl);

            this.endEl = document.createElement('div');
            this.endEl.className = 'chillinfinitescroll-end';
            this.endEl.setAttribute('role', 'status');
            this.endEl.textContent = o.endText;
            this.endEl.style.display = 'none';
            this.element.appendChild(this.endEl);

            this.errorEl = document.createElement('div');
            this.errorEl.className = 'chillinfinitescroll-error';
            this.errorEl.setAttribute('role', 'alert');
            this.errorTextEl = document.createElement('span');
            this.errorTextEl.className = 'chillinfinitescroll-error-text';
            this.errorTextEl.textContent = o.errorText;
            this.retryBtn = document.createElement('button');
            this.retryBtn.type = 'button';
            this.retryBtn.className = 'chillinfinitescroll-retry';
            this.retryBtn.textContent = o.retryText;
            this.errorEl.appendChild(this.errorTextEl);
            this.errorEl.appendChild(this.retryBtn);
            this.errorEl.style.display = 'none';
            this.element.appendChild(this.errorEl);

            this.retryBtn.addEventListener('click', this._onRetryClick);

            // Sentinel for intersection observer
            this.sentinelEl = document.createElement('div');
            this.sentinelEl.style.height = '1px';
            this.sentinelEl.setAttribute('aria-hidden', 'true');
            this.element.appendChild(this.sentinelEl);
        }

        setupObserver() {
            this.teardownObserver();
            if (this._destroyed || typeof IntersectionObserver === 'undefined') return;
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !this.isLoading && this.hasMore && !this.hasError) {
                            this.loadMore();
                        }
                    });
                },
                {
                    root: this.options.root,
                    rootMargin: `${this.options.threshold}px`,
                    threshold: 0
                }
            );

            this.observer.observe(this.sentinelEl);
        }

        teardownObserver() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }

        _setBusy(busy) {
            if (!this.element) return;
            if (busy) this.element.setAttribute('aria-busy', 'true');
            else this.element.removeAttribute('aria-busy');
        }

        async loadMore() {
            if (this._destroyed || !this.options.onLoadMore || this.isLoading || !this.hasMore) return;

            this.isLoading = true;
            this.hasError = false;
            this.showLoader();

            let failed = false;
            try {
                const result = await this.options.onLoadMore();
                if (this._destroyed) return;

                if ((result && result.hasMore === false) || result === false) {
                    this.setComplete();
                }
            } catch (error) {
                if (this._destroyed) return;
                failed = true;
                this.showError();
                if (typeof this.options.onError === 'function') this.options.onError(error);
            } finally {
                if (!this._destroyed) {
                    this.isLoading = false;
                    if (!failed) {
                        if (this.hasMore) this.hideLoader();
                        this._setBusy(false);
                        // The sentinel may still be in view; re-observe so the next intersection callback fires.
                        if (this.hasMore && this.observer) {
                            this.observer.unobserve(this.sentinelEl);
                            this.observer.observe(this.sentinelEl);
                        }
                    } else {
                        this._setBusy(false);
                    }
                }
            }
        }

        showLoader() {
            this.loaderEl.style.display = 'flex';
            this.endEl.style.display = 'none';
            this.errorEl.style.display = 'none';
            this._setBusy(true);
        }

        hideLoader() {
            this.loaderEl.style.display = 'none';
        }

        showError(message) {
            this.hasError = true;
            if (message) this.errorTextEl.textContent = String(message);
            else this.errorTextEl.textContent = this.options.errorText;
            this.loaderEl.style.display = 'none';
            this.errorEl.style.display = 'flex';
            this._setBusy(false);
        }

        retry() {
            if (this._destroyed) return Promise.resolve();
            this.hasError = false;
            this.errorEl.style.display = 'none';
            return this.loadMore();
        }

        setComplete() {
            this.hasMore = false;
            this.hideLoader();
            this.endEl.style.display = 'block';
            this._setBusy(false);
            this.teardownObserver();
            if (typeof this.options.onComplete === 'function') this.options.onComplete();
        }

        reset() {
            if (this._destroyed) return;
            this.hasMore = true;
            this.hasError = false;
            this.isLoading = false;
            this.hideLoader();
            this.endEl.style.display = 'none';
            this.errorEl.style.display = 'none';
            this._setBusy(false);
            this.setupObserver();
        }

        /** Append trusted HTML (caller is responsible for sanitising). Prefer appendElement for untrusted data. */
        append(html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Insert before loader
            while (temp.firstChild) {
                this.element.insertBefore(temp.firstChild, this.loaderEl);
            }

            this.hideLoader();
        }

        appendElement(element) {
            this.element.insertBefore(element, this.loaderEl);
            this.hideLoader();
        }

        appendElements(elements) {
            elements.forEach(el => this.appendElement(el));
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this.teardownObserver();
            if (this.retryBtn) this.retryBtn.removeEventListener('click', this._onRetryClick);
            if (this.element) this.element.removeAttribute('aria-busy');
            [this.loaderEl, this.endEl, this.errorEl, this.sentinelEl].forEach(el => { if (el) el.remove(); });
        }
    }

    const ChillInfiniteScroll = {
        version: VERSION,

        init(selector, options) {
            return new ChillInfiniteScrollInstance(selector, options);
        },

        injectCSS() {
            injectCSS();
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillInfiniteScroll;
    } else {
        window.ChillInfiniteScroll = ChillInfiniteScroll;
    }

})(typeof window !== 'undefined' ? window : this);
