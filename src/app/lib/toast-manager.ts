/**
 * Toast Notification Manager
 * Provides lightweight toast notifications for streaming events, errors, and general feedback
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'peer';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
  showProgress?: boolean;
  progress?: number;
  details?: string;
  closable?: boolean;
}

export interface ToastUpdateOptions {
  title?: string;
  message?: string;
  progress?: number;
  details?: string;
}

interface ToastData {
  element: HTMLDivElement;
  options: ToastOptions;
  timeout: number | null;
}

class ToastManagerClass {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, ToastData> = new Map();
  private nextId: number = 1;

  /**
   * Initialize the toast container
   */
  init(): void {
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

        .toast.toast-success { border-left-color: #4CAF50; }
        .toast.toast-error { border-left-color: #f44336; }
        .toast.toast-warning { border-left-color: #FF9800; }
        .toast.toast-info { border-left-color: #2196F3; }
        .toast.toast-peer { border-left-color: #9C27B0; }

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
  }

  /**
   * Show a toast notification
   */
  show(options: ToastOptions = {}): string {
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
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      peer: '⚡'
    };

    // Build toast content
    let html = `
      <div class="toast-icon">${icons[type]}</div>
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
      html += `<div class="toast-close" onclick="window.App?.ToastManager?.close('${id}')">×</div>`;
    }

    toast.innerHTML = html;

    // Add to container
    this.container!.appendChild(toast);

    // Store toast reference
    this.toasts.set(id, {
      element: toast,
      options,
      timeout: null
    });

    // Auto-close if duration is set
    if (duration > 0) {
      const timeout = window.setTimeout(() => {
        this.close(id);
      }, duration);
      this.toasts.get(id)!.timeout = timeout;
    }

    return id;
  }

  /**
   * Update an existing toast
   */
  update(id: string, updates: ToastUpdateOptions = {}): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    const { message, progress, details, title } = updates;
    const contentEl = toast.element.querySelector('.toast-content');
    if (!contentEl) return;

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
      const progressBar = contentEl.querySelector<HTMLElement>('.toast-progress-bar');
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
  }

  /**
   * Close a toast
   */
  close(id: string): void {
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
  }

  /**
   * Close all toasts
   */
  closeAll(): void {
    const ids = Array.from(this.toasts.keys());
    ids.forEach(id => this.close(id));
  }

  /**
   * Convenience methods
   */
  success(title: string, message: string = '', duration: number = 5000): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string = '', duration: number = 0): string {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string = '', duration: number = 7000): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string = '', duration: number = 5000): string {
    return this.show({ type: 'info', title, message, duration });
  }

  peer(title: string, message: string = '', duration: number = 3000): string {
    return this.show({ type: 'peer', title, message, duration });
  }

  /**
   * Show a loading toast with progress
   */
  loading(title: string, message: string = ''): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration: 0,
      showProgress: true,
      progress: 0,
      closable: false
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const ToastManager = new ToastManagerClass();

// Make available globally
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.ToastManager = ToastManager;
}

export default ToastManager;
