/**
 * ChillStepper - Zero-dependency wizard / stepper component
 *
 * @example
 *   const st = ChillStepper.create({
 *     steps: [
 *       { title: 'Account', description: 'Your details', content: 'Step 1 body' },
 *       { title: 'Plan', optional: true, content: document.createElement('div') },
 *       { title: 'Confirm' }
 *     ],
 *     linear: true,
 *     controls: true,
 *     validate: (from, to, step) => from < 0 || checkForm(from),   // sync, async or string (= error message)
 *     onChange: (index, prev) => {},
 *     onComplete: () => {}
 *   });
 *   document.body.appendChild(st.element);
 *
 * Options
 *   steps        Array<{ title, description, icon, content, optional, id }>   default []
 *   current      starting index                                  default 0
 *   orientation  'horizontal' | 'vertical'                       default 'horizontal'
 *   linear       forbid jumping ahead of the next step           default false
 *   clickable    steps are buttons that call goTo()              default true
 *   controls     render Back / Next(Finish) buttons + panel      default false
 *   labels       { back, next, finish }                          default 'Back' 'Next' 'Finish'
 *   size         'sm' | 'md' | 'lg'                              default 'md'
 *   validate     (fromIndex, toIndex, step) => boolean | string | Promise<boolean|string>.
 *                Called only when moving FORWARD (toIndex > fromIndex); falsy/string result blocks and marks the step as error.
 *   html         treat title/description/content strings as HTML (UNSAFE with untrusted data)   default false
 *   ariaLabel    default 'Progress'
 *   onChange(index, prevIndex), onComplete(), onError(index, message)
 *
 * Methods: next(), prev(), goTo(index) (all return Promise<boolean>), complete(), reset(), setError(index, msg|false),
 *          setSteps(steps), getState(), on(evt, fn), off(evt, fn), destroy()
 * Events:  'change' (index, prev), 'complete', 'error' (index, message), 'blocked' (from, to)
 * Step state classes: chillstepper-done | chillstepper-current | chillstepper-error | chillstepper-upcoming
 */
(function (window) {
    'use strict';

    const VERSION = '1.0.0';
    const STYLE_ID = 'chillstepper-styles';
    let uid = 0;

    function injectCSS() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      :root {
        --chillstepper-text: #171717;
        --chillstepper-muted: #6b7280;
        --chillstepper-line: #e5e5e5;
        --chillstepper-bg: #ffffff;
        --chillstepper-primary: #3b82f6;
        --chillstepper-done: #22c55e;
        --chillstepper-error: #ef4444;
        --chillstepper-surface: #f3f4f6;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]):not(.light) {
          --chillstepper-text: #fafafa;
          --chillstepper-muted: #a3a3a3;
          --chillstepper-line: #404040;
          --chillstepper-bg: #171717;
          --chillstepper-surface: #262626;
        }
      }
      :root[data-theme="dark"], :root.dark {
        --chillstepper-text: #fafafa;
        --chillstepper-muted: #a3a3a3;
        --chillstepper-line: #404040;
        --chillstepper-bg: #171717;
        --chillstepper-surface: #262626;
      }

      .chillstepper { color: var(--chillstepper-text); font-size: 14px; line-height: 1.4; font-family: inherit; box-sizing: border-box; }
      .chillstepper *, .chillstepper *::before, .chillstepper *::after { box-sizing: border-box; }
      .chillstepper-list { list-style: none; margin: 0; padding: 0; display: flex; }
      .chillstepper-step { position: relative; flex: 1 1 0; min-width: 0; display: flex; align-items: flex-start; }
      .chillstepper-btn { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; min-height: 32px; padding: 4px; border-radius: 8px; cursor: default; max-width: 100%; }
      .chillstepper-clickable .chillstepper-btn { cursor: pointer; }
      .chillstepper-clickable .chillstepper-btn:hover { background: var(--chillstepper-surface); }
      .chillstepper-btn:focus-visible { outline: 2px solid var(--chillstepper-primary); outline-offset: 2px; }
      .chillstepper-btn[aria-disabled="true"] { opacity: .55; cursor: not-allowed; }
      .chillstepper-marker { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; background: var(--chillstepper-bg); color: var(--chillstepper-muted); border: 2px solid var(--chillstepper-line); transition: background .18s ease, border-color .18s ease, color .18s ease; }
      .chillstepper-current .chillstepper-marker { border-color: var(--chillstepper-primary); color: var(--chillstepper-primary); box-shadow: 0 0 0 4px rgba(59,130,246,.18); }
      .chillstepper-done .chillstepper-marker { background: var(--chillstepper-done); border-color: var(--chillstepper-done); color: #fff; }
      .chillstepper-error .chillstepper-marker { background: var(--chillstepper-error); border-color: var(--chillstepper-error); color: #fff; }
      .chillstepper-text { min-width: 0; display: flex; flex-direction: column; }
      .chillstepper-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chillstepper-upcoming .chillstepper-title { color: var(--chillstepper-muted); font-weight: 500; }
      .chillstepper-desc, .chillstepper-optional { font-size: 12px; color: var(--chillstepper-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chillstepper-error .chillstepper-desc { color: var(--chillstepper-error); }
      .chillstepper-connector { flex: 1 1 auto; align-self: center; height: 2px; min-width: 16px; margin: 0 8px; background: var(--chillstepper-line); border-radius: 1px; transition: background .18s ease; }
      .chillstepper-step:last-child .chillstepper-connector { display: none; }
      .chillstepper-done .chillstepper-connector { background: var(--chillstepper-done); }

      .chillstepper-vertical .chillstepper-list { flex-direction: column; }
      .chillstepper-vertical .chillstepper-step { flex: none; flex-direction: column; padding-bottom: 8px; }
      .chillstepper-vertical .chillstepper-connector { width: 2px; height: 20px; min-width: 0; margin: 2px 0 0 19px; align-self: flex-start; }

      .chillstepper-sm .chillstepper-marker { width: 24px; height: 24px; font-size: 12px; }
      .chillstepper-sm.chillstepper-vertical .chillstepper-connector { margin-left: 15px; }
      .chillstepper-lg { font-size: 16px; }
      .chillstepper-lg .chillstepper-marker { width: 40px; height: 40px; font-size: 15px; }
      .chillstepper-lg.chillstepper-vertical .chillstepper-connector { margin-left: 23px; }

      .chillstepper-panel { margin-top: 16px; padding: 16px; border: 1px solid var(--chillstepper-line); border-radius: 8px; background: var(--chillstepper-bg); }
      .chillstepper-panel[hidden] { display: none; }
      .chillstepper-error-msg { margin-top: 8px; color: var(--chillstepper-error); font-size: 13px; }
      .chillstepper-error-msg:empty { display: none; }
      .chillstepper-controls { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
      .chillstepper-action { font: inherit; font-weight: 500; min-height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--chillstepper-line); background: var(--chillstepper-bg); color: var(--chillstepper-text); cursor: pointer; transition: background .18s ease; }
      .chillstepper-action:hover:not(:disabled) { background: var(--chillstepper-surface); }
      .chillstepper-action-primary { background: var(--chillstepper-primary); border-color: var(--chillstepper-primary); color: #fff; }
      .chillstepper-action-primary:hover:not(:disabled) { background: #2563eb; }
      .chillstepper-action:disabled { opacity: .5; cursor: not-allowed; }
      .chillstepper-action:focus-visible { outline: 2px solid var(--chillstepper-primary); outline-offset: 2px; }
      .chillstepper-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

      @media (max-width: 480px) {
        .chillstepper-horizontal .chillstepper-text { display: none; }
        .chillstepper-horizontal .chillstepper-current .chillstepper-text { display: flex; }
        .chillstepper-horizontal .chillstepper-step.chillstepper-current { flex: 3 1 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chillstepper-marker, .chillstepper-connector, .chillstepper-action { transition: none; }
      }
    `;
        document.head.insertBefore(style, document.head.firstChild);
    }

    function setContent(el, value, html) {
        if (value == null) return;
        if (typeof value === 'object' && value.nodeType) el.appendChild(value);
        else if (html) el.innerHTML = String(value);
        else el.textContent = String(value);
    }

    class ChillStepperInstance {
        constructor(options, host) {
            injectCSS();
            this.options = Object.assign({
                steps: [], current: 0, orientation: 'horizontal', linear: false, clickable: true, controls: false,
                labels: {}, size: 'md', validate: null, html: false, ariaLabel: 'Progress',
                onChange: null, onComplete: null, onError: null
            }, options || {});
            this.options.labels = Object.assign({ back: 'Back', next: 'Next', finish: 'Finish' }, this.options.labels);
            this._id = ++uid;
            this._handlers = {};
            this._cleanups = [];
            this._completed = false;
            this._busy = false;
            this._destroyed = false;
            this.steps = [];
            this.current = 0;
            this.element = host || document.createElement('div');
            this._ownsElement = !host;
            this._prevClass = host ? host.className : '';
            this.setSteps(this.options.steps, this.options.current);
        }

        on(evt, fn) { (this._handlers[evt] = this._handlers[evt] || []).push(fn); return this; }
        off(evt, fn) { if (this._handlers[evt]) this._handlers[evt] = this._handlers[evt].filter(f => f !== fn); return this; }
        _emit(evt, ...args) { (this._handlers[evt] || []).slice().forEach(fn => fn.apply(this, args)); }

        setSteps(steps, current) {
            this.steps = (steps || []).map(s => Object.assign({ state: null, error: null }, s));
            this.current = Math.max(0, Math.min(current == null ? 0 : current, Math.max(0, this.steps.length - 1)));
            this._completed = false;
            this._visited = this.steps.map((_, i) => i < this.current);
            this._render();
            return this;
        }

        getState() {
            return { current: this.current, completed: this._completed, steps: this.steps.map((s, i) => ({ index: i, state: this._stateOf(i), error: s.error })) };
        }

        _stateOf(i) {
            const s = this.steps[i];
            if (s.error) return 'error';
            if (this._completed || i < this.current || (this._visited[i] && i !== this.current && s.state === 'done')) return 'done';
            if (i === this.current) return 'current';
            return 'upcoming';
        }

        _cleanup() { this._cleanups.forEach(fn => fn()); this._cleanups = []; }

        _listen(el, evt, fn) { el.addEventListener(evt, fn); this._cleanups.push(() => el.removeEventListener(evt, fn)); }

        _render() {
            this._cleanup();
            const o = this.options;
            const root = this.element;
            while (root.firstChild) root.removeChild(root.firstChild);
            root.className = (this._prevClass + ' chillstepper chillstepper-' + o.orientation + ' chillstepper-' + o.size + (o.clickable ? ' chillstepper-clickable' : '')).trim();

            const list = document.createElement('ol');
            list.className = 'chillstepper-list';
            list.setAttribute('role', 'list');
            list.setAttribute('aria-label', o.ariaLabel);
            this._items = [];
            this.steps.forEach((step, i) => {
                const li = document.createElement('li');
                li.setAttribute('role', 'listitem');
                if (step.id != null) li.setAttribute('data-id', String(step.id));
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chillstepper-btn';
                const marker = document.createElement('span');
                marker.className = 'chillstepper-marker';
                marker.setAttribute('aria-hidden', 'true');
                const text = document.createElement('span');
                text.className = 'chillstepper-text';
                const title = document.createElement('span');
                title.className = 'chillstepper-title';
                setContent(title, step.title, o.html);
                text.appendChild(title);
                const desc = document.createElement('span');
                desc.className = 'chillstepper-desc';
                setContent(desc, step.description, o.html);
                if (step.description != null) text.appendChild(desc);
                let opt = null;
                if (step.optional) {
                    opt = document.createElement('span');
                    opt.className = 'chillstepper-optional';
                    opt.textContent = 'Optional';
                    text.appendChild(opt);
                }
                const sr = document.createElement('span');
                sr.className = 'chillstepper-sr';
                btn.appendChild(marker);
                btn.appendChild(text);
                btn.appendChild(sr);
                li.appendChild(btn);
                const conn = document.createElement('span');
                conn.className = 'chillstepper-connector';
                conn.setAttribute('aria-hidden', 'true');
                li.appendChild(conn);
                list.appendChild(li);
                this._items.push({ li, btn, marker, desc, sr, step });
                this._listen(btn, 'click', () => { if (o.clickable) this.goTo(i); });
            });
            root.appendChild(list);

            this._panel = null;
            if (o.controls) {
                const panel = document.createElement('div');
                panel.className = 'chillstepper-panel';
                panel.setAttribute('role', 'region');
                panel.id = 'chillstepper-' + this._id + '-panel';
                this._panel = panel;
                const content = document.createElement('div');
                content.className = 'chillstepper-content';
                const err = document.createElement('div');
                err.className = 'chillstepper-error-msg';
                err.setAttribute('role', 'alert');
                panel.appendChild(content);
                panel.appendChild(err);
                root.appendChild(panel);
                this._content = content;
                this._errEl = err;
                const ctr = document.createElement('div');
                ctr.className = 'chillstepper-controls';
                const back = document.createElement('button');
                back.type = 'button';
                back.className = 'chillstepper-action';
                back.textContent = o.labels.back;
                const next = document.createElement('button');
                next.type = 'button';
                next.className = 'chillstepper-action chillstepper-action-primary';
                ctr.appendChild(back);
                ctr.appendChild(next);
                root.appendChild(ctr);
                this._back = back; this._next = next;
                this._listen(back, 'click', () => this.prev());
                this._listen(next, 'click', () => this.next());
            }
            this._update();
        }

        _update() {
            const o = this.options;
            const last = this.steps.length - 1;
            this._items.forEach((it, i) => {
                const st = this._stateOf(i);
                it.li.className = 'chillstepper-step chillstepper-' + st;
                if (i === this.current && !this._completed) it.btn.setAttribute('aria-current', 'step');
                else it.btn.removeAttribute('aria-current');
                const glyph = st === 'done' ? '✓' : st === 'error' ? '!' : String(i + 1);
                it.marker.textContent = it.step.icon && st !== 'done' && st !== 'error' ? '' : glyph;
                if (it.step.icon && st !== 'done' && st !== 'error') setContent(it.marker, it.step.icon, o.html);
                if (it.step.error && typeof it.step.error === 'string') {
                    it.desc.textContent = it.step.error;
                    if (!it.desc.parentNode) it.btn.querySelector('.chillstepper-text').appendChild(it.desc);
                } else if (it.step.description != null) {
                    it.desc.textContent = '';
                    setContent(it.desc, it.step.description, o.html);
                } else if (it.desc.parentNode) it.desc.parentNode.removeChild(it.desc);
                it.sr.textContent = ' (' + (st === 'done' ? 'completed' : st === 'error' ? 'error' : st === 'current' ? 'current step' : 'upcoming') + ')';
                const blocked = o.linear && i > this.current + 1 && !this._visited[i];
                if (blocked) it.btn.setAttribute('aria-disabled', 'true'); else it.btn.removeAttribute('aria-disabled');
            });
            if (this._panel) {
                const step = this.steps[this.current];
                while (this._content.firstChild) this._content.removeChild(this._content.firstChild);
                if (step && step.content != null) {
                    const c = step.content;
                    if (typeof c === 'object' && c.nodeType) this._content.appendChild(c);
                    else if (o.html) this._content.innerHTML = String(c);
                    else this._content.textContent = String(c);
                }
                this._panel.hidden = this._completed || !step;
                this._back.disabled = this.current === 0 || this._completed;
                this._next.disabled = this._completed || !step;
                this._next.textContent = this.current === last ? o.labels.finish : o.labels.next;
                const err = step && typeof step.error === 'string' ? step.error : '';
                this._errEl.textContent = err;
            }
        }

        async _canLeave(from, to) {
            const v = this.options.validate;
            if (typeof v !== 'function' || to <= from) return true;
            let res;
            try { res = await v(from, to, this.steps[from]); } catch (e) { res = (e && e.message) || false; }
            if (res === true || res === undefined) return true;
            const msg = typeof res === 'string' ? res : true;
            this.setError(from, msg);
            this._emit('blocked', from, to);
            return false;
        }

        async goTo(index) {
            if (this._destroyed || this._busy) return false;
            index = Math.floor(index);
            if (isNaN(index) || index < 0 || index >= this.steps.length) return false;
            const from = this.current;
            if (index === from && !this._completed) return true;
            if (this.options.linear && index > from + 1 && !this._visited[index]) return false;
            this._busy = true;
            try {
                // validate every step crossed when jumping forward
                for (let s = from; s < index; s++) {
                    if (!(await this._canLeave(s, s + 1))) {
                        if (s !== from) { this.current = s; this._update(); }
                        return false;
                    }
                    this.steps[s].error = null;
                    this._visited[s] = true;
                    this.steps[s].state = 'done';
                    if (this._destroyed) return false;
                }
            } finally { this._busy = false; }
            this._completed = false;
            this.current = index;
            this._visited[index] = true;
            this._update();
            if (typeof this.options.onChange === 'function') this.options.onChange(index, from);
            this._emit('change', index, from);
            return true;
        }

        next() {
            if (this.current >= this.steps.length - 1) return this.complete();
            return this.goTo(this.current + 1);
        }

        prev() { return this.current > 0 ? this.goTo(this.current - 1) : Promise.resolve(false); }

        async complete() {
            if (this._destroyed || this._busy || !this.steps.length) return false;
            const last = this.steps.length - 1;
            this._busy = true;
            let ok;
            try { ok = await this._canLeave(last, last + 1); } finally { this._busy = false; }
            if (!ok) return false;
            this.steps.forEach(s => { s.error = null; s.state = 'done'; });
            this._completed = true;
            this._update();
            if (typeof this.options.onComplete === 'function') this.options.onComplete();
            this._emit('complete');
            return true;
        }

        reset() {
            this.steps.forEach(s => { s.error = null; s.state = null; });
            this._completed = false;
            this.current = 0;
            this._visited = this.steps.map(() => false);
            this._visited[0] = true;
            this._update();
            return this;
        }

        setError(index, msg) {
            const s = this.steps[index];
            if (!s) return this;
            s.error = msg === false || msg == null ? null : msg;
            this._update();
            if (s.error) {
                if (typeof this.options.onError === 'function') this.options.onError(index, typeof msg === 'string' ? msg : '');
                this._emit('error', index, typeof msg === 'string' ? msg : '');
            }
            return this;
        }

        destroy() {
            if (this._destroyed) return;
            this._destroyed = true;
            this._cleanup();
            this._handlers = {};
            while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
            if (this._ownsElement) { if (this.element.parentNode) this.element.parentNode.removeChild(this.element); }
            else this.element.className = this._prevClass;
        }
    }

    const ChillStepper = {
        version: VERSION,
        create(options) { return new ChillStepperInstance(options); },
        /** Enhance an existing element; its children's text become step titles unless `steps` is given. */
        init(selectorOrElement, options) {
            const host = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
            if (!host) return null;
            const opts = Object.assign({}, options);
            if (!opts.steps) opts.steps = Array.prototype.map.call(host.children, c => ({ title: c.textContent.trim() }));
            return new ChillStepperInstance(opts, host);
        },
        injectCSS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ChillStepper;
    } else {
        window.ChillStepper = ChillStepper;
    }

})(typeof window !== 'undefined' ? window : this);
