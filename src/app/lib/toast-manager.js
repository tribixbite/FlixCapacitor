/**
 * Toast Notification Manager
 * Provides lightweight toast notifications for streaming events, errors, and general feedback
 */

(function (App) {
    'use strict';

    const ToastManager = {
        container: null,
        toasts: new Map(),
        nextId: 1,

        /**
         * Initialize the toast container
         */
        init() {
            if (this.container) return;

            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);

            // Add CSS styles if not already present
            if (!document.getElementById('toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    .toast-container {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 10000;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        max-width: 400px;
                        pointer-events: none;
                    }

                    .toast {
                        background: rgba(28, 28, 28, 0.95);
                        color: #fff;
                        padding: 16px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        min-width: 300px;
                        pointer-events: auto;
                        animation: toast-slide-in 0.3s ease-out;
                        border-left: 4px solid #2196F3;
                    }

                    .toast.toast-success {
                        border-left-color: #4CAF50;
                    }

                    .toast.toast-error {
                        border-left-color: #f44336;
                    }

                    .toast.toast-warning {
                        border-left-color: #FF9800;
                    }

                    .toast.toast-info {
                        border-left-color: #2196F3;
                    }

                    .toast.toast-peer {
                        border-left-color: #9C27B0;
                    }

                    .toast-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                    }

                    .toast-content {
                        flex: 1;
                    }

                    .toast-title {
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 4px;
                    }

                    .toast-message {
                        font-size: 13px;
                        opacity: 0.9;
                        line-height: 1.4;
                    }

                    .toast-progress {
                        margin-top: 8px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 2px;
                        overflow: hidden;
                    }

                    .toast-progress-bar {
                        height: 100%;
                        background: #2196F3;
                        transition: width 0.3s ease;
                        border-radius: 2px;
                    }

                    .toast-close {
                        cursor: pointer;
                        opacity: 0.6;
                        font-size: 18px;
                        padding: 4px;
                        line-height: 1;
                        transition: opacity 0.2s;
                    }

                    .toast-close:hover {
                        opacity: 1;
                    }

                    .toast-details {
                        font-size: 11px;
                        opacity: 0.7;
                        margin-top: 4px;
                        font-family: monospace;
                    }

                    @keyframes toast-slide-in {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes toast-slide-out {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                    }

                    .toast.toast-removing {
                        animation: toast-slide-out 0.3s ease-in forwards;
                    }
                `;
                document.head.appendChild(style);
            }
        },

        /**
         * Show a toast notification
         * @param {Object} options - Toast options
         * @param {string} options.type - Toast type (success, error, warning, info, peer)
         * @param {string} options.title - Toast title
         * @param {string} options.message - Toast message
         * @param {number} options.duration - Auto-close duration in ms (0 = no auto-close)
         * @param {boolean} options.showProgress - Show progress bar
         * @param {number} options.progress - Progress percentage (0-100)
         * @param {string} options.details - Additional details (small text)
         * @param {boolean} options.closable - Show close button
         * @returns {string} Toast ID
         */
        show(options = {}) {
            this.init();

            const {
                type = 'info',
                title = '',
                message = '',
                duration = 5000,
                showProgress = false,
                progress = 0,
                details = '',
                closable = true
            } = options;

            const id = 'toast-' + this.nextId++;

            // Create toast element
            const toast = document.createElement('div');
            toast.id = id;
            toast.className = `toast toast-${type}`;

            // Icon mapping
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ',
                peer: '⚡'
            };

            // Build toast content
            let html = `
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">
                    ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                    ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
                    ${showProgress ? `
                        <div class="toast-progress">
                            <div class="toast-progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                    ${details ? `<div class="toast-details">${this.escapeHtml(details)}</div>` : ''}
                </div>
            `;

            if (closable) {
                html += '<div class="toast-close" onclick="window.App.ToastManager.close(\'' + id + '\')">×</div>';
            }

            toast.innerHTML = html;

            // Add to container
            this.container.appendChild(toast);

            // Store toast reference
            this.toasts.set(id, {
                element: toast,
                options,
                timeout: null
            });

            // Auto-close if duration is set
            if (duration > 0) {
                const timeout = setTimeout(() => {
                    this.close(id);
                }, duration);
                this.toasts.get(id).timeout = timeout;
            }

            return id;
        },

        /**
         * Update an existing toast
         * @param {string} id - Toast ID
         * @param {Object} updates - Properties to update
         */
        update(id, updates = {}) {
            const toast = this.toasts.get(id);
            if (!toast) return;

            const { message, progress, details, title } = updates;
            const contentEl = toast.element.querySelector('.toast-content');

            if (title !== undefined) {
                const titleEl = contentEl.querySelector('.toast-title');
                if (titleEl) {
                    titleEl.textContent = title;
                }
            }

            if (message !== undefined) {
                const messageEl = contentEl.querySelector('.toast-message');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            }

            if (progress !== undefined) {
                const progressBar = contentEl.querySelector('.toast-progress-bar');
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
            }

            if (details !== undefined) {
                let detailsEl = contentEl.querySelector('.toast-details');
                if (!detailsEl && details) {
                    detailsEl = document.createElement('div');
                    detailsEl.className = 'toast-details';
                    contentEl.appendChild(detailsEl);
                }
                if (detailsEl) {
                    detailsEl.textContent = details;
                }
            }
        },

        /**
         * Close a toast
         * @param {string} id - Toast ID
         */
        close(id) {
            const toast = this.toasts.get(id);
            if (!toast) return;

            // Clear timeout if exists
            if (toast.timeout) {
                clearTimeout(toast.timeout);
            }

            // Animate out
            toast.element.classList.add('toast-removing');

            setTimeout(() => {
                if (toast.element.parentNode) {
                    toast.element.parentNode.removeChild(toast.element);
                }
                this.toasts.delete(id);
            }, 300);
        },

        /**
         * Close all toasts
         */
        closeAll() {
            const ids = Array.from(this.toasts.keys());
            ids.forEach(id => this.close(id));
        },

        /**
         * Convenience methods
         */
        success(title, message, duration = 5000) {
            return this.show({ type: 'success', title, message, duration });
        },

        error(title, message, duration = 0) {
            return this.show({ type: 'error', title, message, duration });
        },

        warning(title, message, duration = 7000) {
            return this.show({ type: 'warning', title, message, duration });
        },

        info(title, message, duration = 5000) {
            return this.show({ type: 'info', title, message, duration });
        },

        peer(title, message, duration = 3000) {
            return this.show({ type: 'peer', title, message, duration });
        },

        /**
         * Show a loading toast with progress
         * @param {string} title - Toast title
         * @param {string} message - Toast message
         * @returns {string} Toast ID
         */
        loading(title, message = '') {
            return this.show({
                type: 'info',
                title,
                message,
                duration: 0,
                showProgress: true,
                progress: 0,
                closable: false
            });
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Make available globally
    if (typeof window !== 'undefined') {
        window.App = window.App || {};
        window.App.ToastManager = ToastManager;
    }

    // Expose on App object
    if (App) {
        App.ToastManager = ToastManager;
    }

})(window.App);
