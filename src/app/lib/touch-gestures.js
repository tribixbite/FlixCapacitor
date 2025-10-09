/**
 * Touch Gesture System for Mobile
 * Replaces desktop keyboard shortcuts with touch gestures
 */

(function () {
    'use strict';

    // Gesture state tracking
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isLongPress = false;
    let longPressTimer = null;

    const SWIPE_THRESHOLD = 50; // pixels
    const LONG_PRESS_DURATION = 500; // ms
    const DOUBLE_TAP_DELAY = 300; // ms

    let lastTapTime = 0;
    let tapCount = 0;

    /**
     * Initialize touch gesture system
     */
    function init() {
        console.log('Touch gesture system initializing...');

        // Swipe gestures for navigation
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Prevent context menu on long press (conflicts with our gestures)
        document.addEventListener('contextmenu', (e) => {
            if (isLongPress) {
                e.preventDefault();
            }
        });

        console.log('Touch gesture system initialized');
    }

    /**
     * Handle touch start event
     */
    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isLongPress = false;

            // Start long press timer
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                handleLongPress(e);
            }, LONG_PRESS_DURATION);
        } else if (e.touches.length === 2) {
            // Two-finger gesture
            clearTimeout(longPressTimer);
            handleTwoFingerGesture(e);
        }
    }

    /**
     * Handle touch move event
     */
    function handleTouchMove(e) {
        // Cancel long press if finger moves
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    }

    /**
     * Handle touch end event
     */
    function handleTouchEnd(e) {
        clearTimeout(longPressTimer);

        if (e.changedTouches.length === 1 && !isLongPress) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

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
    function handleSwipe(deltaX, deltaY) {
        if (!window.App || !window.App.vent) return;

        // Horizontal swipe (left/right navigation)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                // Swipe right - go back
                console.log('Gesture: Swipe right (back)');
                if (window.App.ViewStack && window.App.ViewStack.length > 0) {
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
                const currentView = window.App.ViewStack[window.App.ViewStack.length - 1];
                if (currentView && currentView.refresh) {
                    currentView.refresh();
                }
            }
        }
    }

    /**
     * Handle tap gestures
     */
    function handleTap(e) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            // Double tap detected
            tapCount++;
            if (tapCount === 1) {
                // Triple tap (2nd double tap)
                handleTripleTap(e);
                tapCount = 0;
            }
        } else {
            tapCount = 0;
        }

        lastTapTime = now;
    }

    /**
     * Handle triple tap (Easter egg or special features)
     */
    function handleTripleTap(e) {
        console.log('Gesture: Triple tap');
        // Could toggle debug mode or show easter egg
    }

    /**
     * Handle long press
     */
    function handleLongPress(e) {
        console.log('Gesture: Long press');

        if (!window.App || !window.App.vent) return;

        // Long press could open context menu or show options
        const target = e.touches[0].target;

        // Check if long press is on a content item (movie/show poster)
        const contentItem = target.closest('.movie-item, .show-item, .anime-item');
        if (contentItem) {
            // Show options for this content item
            window.App.vent.trigger('content:longpress', {
                element: contentItem,
                x: touchStartX,
                y: touchStartY
            });
        }
    }

    /**
     * Handle two-finger gestures
     */
    function handleTwoFingerGesture(e) {
        console.log('Gesture: Two-finger gesture');

        if (!window.App || !window.App.vent) return;

        // Two-finger tap - toggle favorites or watchlist
        if (e.touches.length === 2) {
            // Could be used for quick add to watchlist
        }
    }

    /**
     * Programmatic gesture triggers for common actions
     */
    const GestureActions = {
        // Navigate back
        goBack: function () {
            if (window.App.ViewStack && window.App.ViewStack.length > 0) {
                window.history.back();
            }
        },

        // Show search
        showSearch: function () {
            if (window.App && window.App.vent) {
                window.App.vent.trigger('keyboard:togglesearch');
            }
        },

        // Toggle fullscreen
        toggleFullscreen: function () {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        },

        // Close player
        closePlayer: function () {
            if (window.App && window.App.PlayerView) {
                window.App.PlayerView.closePlayer();
            }
        },

        // Show settings
        showSettings: function () {
            if (window.App && window.App.vent) {
                window.App.vent.trigger('settings:show');
            }
        },

        // Show about
        showAbout: function () {
            if (window.App && window.App.vent) {
                window.App.vent.trigger('about:show');
            }
        }
    };

    // Export to global scope
    window.TouchGestures = {
        init: init,
        actions: GestureActions
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
