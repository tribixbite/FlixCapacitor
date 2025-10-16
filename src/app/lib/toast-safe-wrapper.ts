/**
 * Safe Toast Wrapper
 * Prevents crashes from toast manager calls with defensive checks
 */

export interface ToastUpdateData {
    progress?: number;
    message?: string;
    details?: string;
}

export interface StreamProgress {
    progress?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    numPeers?: number;
    [key: string]: any;
}

interface SafeToastType {
    show: (type: string, title: string, message: string, duration?: number) => string | null;
    success: (title: string, message: string, duration?: number) => string | null;
    error: (title: string, message: string, duration?: number) => string | null;
    warning: (title: string, message: string, duration?: number) => string | null;
    info: (title: string, message: string, duration?: number) => string | null;
    peer: (title: string, message: string, duration?: number) => string | null;
    loading: (title: string, message?: string) => string | null;
    update: (toastId: string, updates: ToastUpdateData) => void;
    close: (toastId: string) => void;
    updateProgress: (streamId: string, progress: StreamProgress) => void;
}

const SafeToast: SafeToastType = {
    /**
     * Safely show a toast notification
     */
    show(type: string, title: string, message: string, duration: number = 5000): string | null {
        try {
            const App = (window as any).App;
            if (App && App.ToastManager && typeof App.ToastManager[type] === 'function') {
                return App.ToastManager[type](title, message, duration);
            }
        } catch (e) {
            console.warn(`Failed to show ${type} toast:`, e);
        }
        return null;
    },

    success(title: string, message: string, duration?: number): string | null {
        return this.show('success', title, message, duration);
    },

    error(title: string, message: string, duration: number = 0): string | null {
        return this.show('error', title, message, duration);
    },

    warning(title: string, message: string, duration?: number): string | null {
        return this.show('warning', title, message, duration);
    },

    info(title: string, message: string, duration?: number): string | null {
        return this.show('info', title, message, duration);
    },

    peer(title: string, message: string, duration?: number): string | null {
        return this.show('peer', title, message, duration);
    },

    /**
     * Safely show a loading toast with progress bar
     */
    loading(title: string, message: string = ''): string | null {
        try {
            const App = (window as any).App;
            if (App && App.ToastManager && typeof App.ToastManager.loading === 'function') {
                return App.ToastManager.loading(title, message);
            }
        } catch (e) {
            console.warn('Failed to show loading toast:', e);
        }
        return null;
    },

    /**
     * Safely update a toast
     */
    update(toastId: string, updates: ToastUpdateData): void {
        try {
            const App = (window as any).App;
            if (toastId && App && App.ToastManager && typeof App.ToastManager.update === 'function') {
                App.ToastManager.update(toastId, updates);
            }
        } catch (e) {
            console.warn('Failed to update toast:', e);
        }
    },

    /**
     * Safely close a toast
     */
    close(toastId: string): void {
        try {
            const App = (window as any).App;
            if (toastId && App && App.ToastManager && typeof App.ToastManager.close === 'function') {
                App.ToastManager.close(toastId);
            }
        } catch (e) {
            console.warn('Failed to close toast:', e);
        }
    },

    /**
     * Safely update streaming progress
     */
    updateProgress(streamId: string, progress: StreamProgress): void {
        try {
            const App = (window as any).App;
            if (App && App.StreamingService && typeof App.StreamingService.updateProgress === 'function') {
                App.StreamingService.updateProgress(streamId, progress);
            }
        } catch (e) {
            // Silent fail - progress updates are non-critical
            console.debug('Progress update skipped:', (e as Error).message);
        }
    }
};

// Export for ES modules
export { SafeToast };
export default SafeToast;

// Export to window
if (typeof window !== 'undefined') {
    const App = (window as any).App || {};
    App.SafeToast = SafeToast;
    (window as any).App = App;
}
