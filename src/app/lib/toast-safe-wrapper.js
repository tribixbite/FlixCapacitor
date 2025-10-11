/**
 * Safe Toast Wrapper
 * Prevents crashes from toast manager calls with defensive checks
 */

(function (App) {
    'use strict';

    const SafeToast = {
        /**
         * Safely show a toast notification
         * @param {string} type - Toast type
         * @param {string} title - Title
         * @param {string} message - Message
         * @param {number} duration - Duration in ms
         * @returns {string|null} Toast ID or null
         */
        show(type, title, message, duration = 5000) {
            try {
                if (window.App && window.App.ToastManager && typeof window.App.ToastManager[type] === 'function') {
                    return window.App.ToastManager[type](title, message, duration);
                }
            } catch (e) {
                console.warn(`Failed to show ${type} toast:`, e);
            }
            return null;
        },

        success(title, message, duration) {
            return this.show('success', title, message, duration);
        },

        error(title, message, duration = 0) {
            return this.show('error', title, message, duration);
        },

        warning(title, message, duration) {
            return this.show('warning', title, message, duration);
        },

        info(title, message, duration) {
            return this.show('info', title, message, duration);
        },

        peer(title, message, duration) {
            return this.show('peer', title, message, duration);
        },

        /**
         * Safely close a toast
         * @param {string} toastId - Toast ID
         */
        close(toastId) {
            try {
                if (toastId && window.App && window.App.ToastManager && typeof window.App.ToastManager.close === 'function') {
                    window.App.ToastManager.close(toastId);
                }
            } catch (e) {
                console.warn('Failed to close toast:', e);
            }
        },

        /**
         * Safely update streaming progress
         * @param {string} streamId - Stream ID
         * @param {Object} progress - Progress data
         */
        updateProgress(streamId, progress) {
            try {
                if (window.App && window.App.StreamingService && typeof window.App.StreamingService.updateProgress === 'function') {
                    window.App.StreamingService.updateProgress(streamId, progress);
                }
            } catch (e) {
                // Silent fail - progress updates are non-critical
                console.debug('Progress update skipped:', e.message);
            }
        }
    };

    // Export
    if (typeof window !== 'undefined') {
        window.App = window.App || {};
        window.App.SafeToast = SafeToast;
    }

})(window.App);
