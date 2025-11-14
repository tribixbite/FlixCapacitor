/**
 * UI Store
 * Phase 9B.1: Centralized state management for UI state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Modal types
 */
export type ModalType =
    | 'none'
    | 'movie-details'
    | 'file-picker'
    | 'queue-manager'
    | 'subtitle-settings'
    | 'playback-settings'
    | 'favorites'
    | 'search'
    | 'filters'
    | 'about';

/**
 * Toast message
 */
export interface ToastMessage {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number; // ms, null = persistent
    action?: {
        label: string;
        callback: () => void;
    };
}

/**
 * Loading state
 */
export interface LoadingState {
    isLoading: boolean;
    message: string | null;
    progress: number | null; // 0-100
    canCancel: boolean;
    onCancel?: () => void;
}

/**
 * UI state interface
 */
export interface UIState {
    // Modal state
    activeModal: ModalType;
    modalData: any;

    // Toast messages
    toasts: ToastMessage[];

    // Loading state
    loading: LoadingState;

    // Sidebar/menu state
    isSidebarOpen: boolean;
    isMenuOpen: boolean;

    // Player controls visibility
    areControlsVisible: boolean;
    controlsHideTimeout: number | null;

    // Fullscreen state
    isFullscreen: boolean;

    // Actions - Modal
    openModal: (modal: ModalType, data?: any) => void;
    closeModal: () => void;
    setModalData: (data: any) => void;

    // Actions - Toast
    showToast: (message: string, type?: ToastMessage['type'], duration?: number, action?: ToastMessage['action']) => void;
    hideToast: (id: string) => void;
    clearToasts: () => void;

    // Actions - Loading
    startLoading: (message?: string, canCancel?: boolean, onCancel?: () => void) => void;
    stopLoading: () => void;
    setLoadingProgress: (progress: number) => void;
    setLoadingMessage: (message: string) => void;

    // Actions - Sidebar/Menu
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
    openMenu: () => void;
    closeMenu: () => void;
    toggleMenu: () => void;

    // Actions - Player controls
    showControls: () => void;
    hideControls: () => void;
    setControlsHideTimeout: (timeout: number | null) => void;

    // Actions - Fullscreen
    setFullscreen: (fullscreen: boolean) => void;
    toggleFullscreen: () => void;
}

/**
 * Initial UI state
 */
const initialState = {
    activeModal: 'none' as const,
    modalData: null,

    toasts: [],

    loading: {
        isLoading: false,
        message: null,
        progress: null,
        canCancel: false,
        onCancel: undefined
    },

    isSidebarOpen: false,
    isMenuOpen: false,

    areControlsVisible: true,
    controlsHideTimeout: null,

    isFullscreen: false
};

/**
 * UI store
 */
export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // Modal actions
            openModal: (modal, data = null) => set({
                activeModal: modal,
                modalData: data
            }),

            closeModal: () => set({
                activeModal: 'none',
                modalData: null
            }),

            setModalData: (data) => set({ modalData: data }),

            // Toast actions
            showToast: (message, type = 'info', duration = 3000, action) => {
                const id = `toast-${Date.now()}-${Math.random()}`;
                const toast: ToastMessage = {
                    id,
                    message,
                    type,
                    duration,
                    action
                };

                set((state) => ({
                    toasts: [...state.toasts, toast]
                }));

                // Auto-hide toast after duration
                if (duration && duration > 0) {
                    setTimeout(() => {
                        get().hideToast(id);
                    }, duration);
                }
            },

            hideToast: (id) => set((state) => ({
                toasts: state.toasts.filter(t => t.id !== id)
            })),

            clearToasts: () => set({ toasts: [] }),

            // Loading actions
            startLoading: (message = 'Loading...', canCancel = false, onCancel) => set({
                loading: {
                    isLoading: true,
                    message,
                    progress: null,
                    canCancel,
                    onCancel
                }
            }),

            stopLoading: () => set({
                loading: {
                    isLoading: false,
                    message: null,
                    progress: null,
                    canCancel: false,
                    onCancel: undefined
                }
            }),

            setLoadingProgress: (progress) => set((state) => ({
                loading: {
                    ...state.loading,
                    progress: Math.max(0, Math.min(100, progress))
                }
            })),

            setLoadingMessage: (message) => set((state) => ({
                loading: {
                    ...state.loading,
                    message
                }
            })),

            // Sidebar/Menu actions
            openSidebar: () => set({ isSidebarOpen: true }),
            closeSidebar: () => set({ isSidebarOpen: false }),
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            openMenu: () => set({ isMenuOpen: true }),
            closeMenu: () => set({ isMenuOpen: false }),
            toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),

            // Player controls actions
            showControls: () => set({ areControlsVisible: true }),
            hideControls: () => set({ areControlsVisible: false }),
            setControlsHideTimeout: (timeout) => set({ controlsHideTimeout: timeout }),

            // Fullscreen actions
            setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
            toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen }))
        }),
        {
            name: 'UIStore',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

/**
 * Selectors for derived state
 */
export const uiSelectors = {
    // Has active modal
    hasActiveModal: (state: UIState) => state.activeModal !== 'none',

    // Has toasts
    hasToasts: (state: UIState) => state.toasts.length > 0,

    // Is loading
    isLoading: (state: UIState) => state.loading.isLoading,

    // Can cancel loading
    canCancelLoading: (state: UIState) => state.loading.canCancel,

    // Has loading progress
    hasLoadingProgress: (state: UIState) => state.loading.progress !== null
};
