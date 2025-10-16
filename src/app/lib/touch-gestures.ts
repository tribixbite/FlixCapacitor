/**
 * Touch Gesture System for Mobile
 * Replaces desktop keyboard shortcuts with touch gestures
 */

interface GestureState {
    touchStartX: number;
    touchStartY: number;
    touchStartTime: number;
    isLongPress: boolean;
    longPressTimer: ReturnType<typeof setTimeout> | null;
    lastTapTime: number;
    tapCount: number;
}

interface GestureActions {
    goBack: () => void;
    showSearch: () => void;
    toggleFullscreen: () => void;
    closePlayer: () => void;
    showSettings: () => void;
    showAbout: () => void;
}

interface TouchGesturesAPI {
    init: () => void;
    actions: GestureActions;
}

(function () {
    'use strict';

    // Constants
    const SWIPE_THRESHOLD = 50; // pixels
    const LONG_PRESS_DURATION = 500; // ms
    const DOUBLE_TAP_DELAY = 300; // ms

    // Gesture state tracking
    const state: GestureState = {
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0,
        isLongPress: false,
        longPressTimer: null,
        lastTapTime: 0,
        tapCount: 0
    };

    /**
     * Initialize touch gesture system
     */
    function init(): void {
        console.log('Touch gesture system initializing...');

        // Swipe gestures for navigation
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Prevent context menu on long press (conflicts with our gestures)
        document.addEventListener('contextmenu', (e: Event) => {
            if (state.isLongPress) {
                e.preventDefault();
            }
        });

        console.log('Touch gesture system initialized');
    }

    /**
     * Handle touch start event
     */
    function handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            state.touchStartX = e.touches[0].clientX;
            state.touchStartY = e.touches[0].clientY;
            state.touchStartTime = Date.now();
            state.isLongPress = false;

            // Start long press timer
            state.longPressTimer = setTimeout(() => {
                state.isLongPress = true;
                handleLongPress(e);
            }, LONG_PRESS_DURATION);
        } else if (e.touches.length === 2) {
            // Two-finger gesture
            if (state.longPressTimer) {
                clearTimeout(state.longPressTimer);
            }
            handleTwoFingerGesture(e);
        }
    }

    /**
     * Handle touch move event
     */
    function handleTouchMove(e: TouchEvent): void {
        // Cancel long press if finger moves
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
        }
    }

    /**
     * Handle touch end event
     */
    function handleTouchEnd(e: TouchEvent): void {
        if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
        }

        if (e.changedTouches.length === 1 && !state.isLongPress) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - state.touchStartTime;

            const deltaX = touchEndX - state.touchStartX;
            const deltaY = touchEndY - state.touchStartY;

            // Detect swipe
            if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
                handleSwipe(deltaX, deltaY);
            }
            // Detect tap/double tap
            else if (touchDuration < 200) {
                handleTap(e);
            }
        }
    }

    /**
     * Handle swipe gestures
     */
    function handleSwipe(deltaX: number, deltaY: number): void {
        const App = (window as any).App;
        if (!App || !App.vent) return;

        // Horizontal swipe (left/right navigation)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                // Swipe right - go back
                console.log('Gesture: Swipe right (back)');
                if (App.ViewStack && App.ViewStack.length > 0) {
                    window.history.back();
                }
            } else {
                // Swipe left - go forward (if applicable)
                console.log('Gesture: Swipe left (forward)');
                // Could be used for navigation between tabs
            }
        }
        // Vertical swipe (scroll or refresh)
        else {
            if (deltaY > 0 && window.scrollY === 0) {
                // Swipe down from top - refresh
                console.log('Gesture: Swipe down (refresh)');
                const currentView = App.ViewStack[App.ViewStack.length - 1];
                if (currentView && currentView.refresh) {
                    currentView.refresh();
                }
            }
        }
    }

    /**
     * Handle tap gestures
     */
    function handleTap(e: TouchEvent): void {
        const now = Date.now();
        const timeSinceLastTap = now - state.lastTapTime;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            // Double tap detected
            state.tapCount++;
            if (state.tapCount === 1) {
                // Triple tap (2nd double tap)
                handleTripleTap(e);
                state.tapCount = 0;
            }
        } else {
            state.tapCount = 0;
        }

        state.lastTapTime = now;
    }

    /**
     * Handle triple tap (Easter egg or special features)
     */
    function handleTripleTap(e: TouchEvent): void {
        console.log('Gesture: Triple tap');
        // Could toggle debug mode or show easter egg
    }

    /**
     * Handle long press
     */
    function handleLongPress(e: TouchEvent): void {
        console.log('Gesture: Long press');

        const App = (window as any).App;
        if (!App || !App.vent) return;

        // Long press could open context menu or show options
        const target = e.touches[0].target as HTMLElement;

        // Check if long press is on a content item (movie/show poster)
        const contentItem = target.closest('.movie-item, .show-item, .anime-item');
        if (contentItem) {
            // Show options for this content item
            App.vent.trigger('content:longpress', {
                element: contentItem,
                x: state.touchStartX,
                y: state.touchStartY
            });
        }
    }

    /**
     * Handle two-finger gestures
     */
    function handleTwoFingerGesture(e: TouchEvent): void {
        console.log('Gesture: Two-finger gesture');

        const App = (window as any).App;
        if (!App || !App.vent) return;

        // Two-finger tap - toggle favorites or watchlist
        if (e.touches.length === 2) {
            // Could be used for quick add to watchlist
        }
    }

    /**
     * Programmatic gesture triggers for common actions
     */
    const GestureActions: GestureActions = {
        // Navigate back
        goBack(): void {
            const App = (window as any).App;
            if (App.ViewStack && App.ViewStack.length > 0) {
                window.history.back();
            }
        },

        // Show search
        showSearch(): void {
            const App = (window as any).App;
            if (App && App.vent) {
                App.vent.trigger('keyboard:togglesearch');
            }
        },

        // Toggle fullscreen
        toggleFullscreen(): void {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        },

        // Close player
        closePlayer(): void {
            const App = (window as any).App;
            if (App && App.PlayerView) {
                App.PlayerView.closePlayer();
            }
        },

        // Show settings
        showSettings(): void {
            const App = (window as any).App;
            if (App && App.vent) {
                App.vent.trigger('settings:show');
            }
        },

        // Show about
        showAbout(): void {
            const App = (window as any).App;
            if (App && App.vent) {
                App.vent.trigger('about:show');
            }
        }
    };

    // Export to global scope
    (window as any).TouchGestures = {
        init: init,
        actions: GestureActions
    } as TouchGesturesAPI;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Export for ES modules
export {};
