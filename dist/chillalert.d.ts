/**
 * ChillAlert - TypeScript Type Definitions
 * @version 1.2.0
 * @description A minimal, framework-agnostic alert library
 * 
 * Supports:
 * - React (JavaScript & TypeScript)
 * - Next.js (JavaScript & TypeScript)
 * - Vue (JavaScript & TypeScript)
 * - Nuxt (JavaScript & TypeScript)
 * - Vanilla JavaScript
 */

declare module 'chillalert' {
    export interface AlertOptions {
        /** Title of the alert dialog */
        title?: string;
        /** Text/description of the alert */
        text?: string;
        /** Icon type: 'success' | 'error' | 'warning' | 'info' | 'question' */
        icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
        /** Text for the confirm button */
        buttonText?: string;
        /** Trusted HTML shown instead of `text` (explicit opt-in, not sanitised) */
        html?: string;
        /** Close on Escape (default true) */
        allowEscapeKey?: boolean;
        /** Close when clicking the backdrop (default true) */
        allowOutsideClick?: boolean;
    }

    export interface ConfirmOptions {
        /** Title of the confirm dialog */
        title?: string;
        /** Text/description of the confirm dialog */
        text?: string;
        /** Icon type */
        icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
        /** Text for the confirm button */
        confirmText?: string;
        /** Text for the cancel button */
        cancelText?: string;
        /** CSS class for confirm button: 'success' | 'error' | 'primary' */
        confirmButtonClass?: 'success' | 'error' | 'primary';
        /** Trusted HTML shown instead of `text` (explicit opt-in, not sanitised) */
        html?: string;
        /** Close (resolves false) on Escape (default true) */
        allowEscapeKey?: boolean;
        /** Close (resolves false) when clicking the backdrop (default true) */
        allowOutsideClick?: boolean;
    }

    export interface PromptOptions {
        /** Title of the prompt dialog */
        title?: string;
        /** Text/description of the prompt dialog */
        text?: string;
        /** Placeholder text for the input field */
        placeholder?: string;
        /** Default value for the input field */
        defaultValue?: string;
        /** Text for the confirm button */
        confirmText?: string;
        /** Text for the cancel button */
        cancelText?: string;
        /** Trusted HTML shown instead of `text` (explicit opt-in, not sanitised) */
        html?: string;
        /** Input type (default 'text') */
        inputType?: 'text' | 'password' | 'email' | 'number' | 'url' | 'tel' | 'search';
        /** Close (resolves null) on Escape (default true) */
        allowEscapeKey?: boolean;
        /** Close (resolves null) when clicking the backdrop (default true) */
        allowOutsideClick?: boolean;
    }

    export interface ToastOptions {
        /** Text to display in the toast */
        text: string;
        /** Toast type: 'success' | 'error' | 'warning' | 'info' */
        type?: 'success' | 'error' | 'warning' | 'info';
        /** Toast position */
        position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
        /** Duration in milliseconds (0 for persistent) */
        duration?: number;
    }

    export interface LoadingOptions {
        /** Title for the loading dialog */
        title?: string;
        /** Text/description for the loading dialog */
        text?: string;
    }

    export interface ToastInstance {
        /** The toast DOM element (null when called on the server) */
        toast: HTMLElement | null;
        /** Dismiss the toast */
        remove: () => void | Promise<void>;
    }

    export interface LoadingInstance {
        /** Close the loading dialog */
        close: () => void | Promise<void>;
    }

    export interface ChillAlertStatic {
        /** Current library version */
        version: string;

        /**
         * Shows an alert dialog
         * @example
         * // JavaScript
         * await ChillAlert.alert({ title: 'Success!', icon: 'success' });
         * 
         * // TypeScript
         * await ChillAlert.alert({ title: 'Success!', icon: 'success' } as AlertOptions);
         */
        alert(options?: AlertOptions): Promise<void>;

        /**
         * Shows a confirm dialog
         * @returns true if confirmed, false if cancelled
         * @example
         * const result = await ChillAlert.confirm({ title: 'Delete?', confirmText: 'Yes' });
         * if (result) { // user clicked confirm }
         */
        confirm(options?: ConfirmOptions): Promise<boolean>;

        /**
         * Shows a prompt dialog with input
         * @returns input value if confirmed, null if cancelled
         * @example
         * const name = await ChillAlert.prompt({ title: 'Enter name' });
         * if (name !== null) { console.log(name); }
         */
        prompt(options?: PromptOptions): Promise<string | null>;

        /**
         * Shows a toast notification
         * @example
         * ChillAlert.toast({ text: 'Saved!', type: 'success' });
         */
        toast(options: ToastOptions): ToastInstance;

        /**
         * Shows a loading indicator
         * @returns object with close() method
         * @example
         * const loading = ChillAlert.loading({ title: 'Please wait...' });
         * // ... async operation
         * loading.close();
         */
        loading(options?: LoadingOptions): LoadingInstance;

        /**
         * Closes all active dialogs (their promises resolve as dismissed) and toasts
         */
        closeAll(): void;

        /** Injects the stylesheet now (done automatically on first use) */
        injectCSS(): void;
    }

    const ChillAlert: ChillAlertStatic;
    export default ChillAlert;
}

// Global type for CDN usage
declare global {
    interface Window {
        ChillAlert: import('chillalert').ChillAlertStatic;
    }
    const ChillAlert: import('chillalert').ChillAlertStatic;
}

export { };
