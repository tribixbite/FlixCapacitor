/**
 * Pull-to-Refresh Component for Mobile
 * Adds native-feeling pull-to-refresh to scrollable content areas
 */

(function () {
    'use strict';

    class PullToRefresh {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                threshold: 80, // pixels to pull before triggering
                maxPull: 120, // max pull distance
                onRefresh: options.onRefresh || (() => {}),
                indicatorColor: options.indicatorColor || 'var(--accent-primary)',
                ...options
            };

            this.state = {
                pulling: false,
                refreshing: false,
                startY: 0,
                currentY: 0,
                pullDistance: 0
            };

            this.indicator = null;
            this.setupIndicator();
            this.attachListeners();
        }

        setupIndicator() {
            // Create refresh indicator
            this.indicator = document.createElement('div');
            this.indicator.className = 'ptr-indicator';
            this.indicator.innerHTML = `
                <div class="ptr-spinner"></div>
                <div class="ptr-text">Pull to refresh</div>
            `;

            // Add styles if not already added
            if (!document.getElementById('ptr-styles')) {
                const style = document.createElement('style');
                style.id = 'ptr-styles';
                style.textContent = `
                    .ptr-indicator {
                        position: absolute;
                        top: -60px;
                        left: 0;
                        right: 0;
                        height: 60px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                        opacity: 0;
                        transition: opacity 0.2s;
                        z-index: 50;
                    }

                    .ptr-indicator.visible {
                        opacity: 1;
                    }

                    .ptr-spinner {
                        width: 24px;
                        height: 24px;
                        border: 3px solid rgba(255, 255, 255, 0.1);
                        border-top-color: ${this.options.indicatorColor};
                        border-radius: 50%;
                        margin-bottom: 8px;
                        transition: transform 0.2s;
                    }

                    .ptr-spinner.spin {
                        animation: ptr-spin 1s linear infinite;
                    }

                    .ptr-text {
                        font-weight: 500;
                    }

                    @keyframes ptr-spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            // Ensure element has position context
            const position = window.getComputedStyle(this.element).position;
            if (position === 'static') {
                this.element.style.position = 'relative';
            }

            this.element.appendChild(this.indicator);
        }

        attachListeners() {
            this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        }

        handleTouchStart(e) {
            // Only activate if scrolled to top
            if (this.element.scrollTop === 0 && !this.state.refreshing) {
                this.state.startY = e.touches[0].clientY;
                this.state.pulling = true;
            }
        }

        handleTouchMove(e) {
            if (!this.state.pulling || this.state.refreshing) return;

            this.state.currentY = e.touches[0].clientY;
            this.state.pullDistance = Math.min(
                this.state.currentY - this.state.startY,
                this.options.maxPull
            );

            // Only show indicator if pulling down
            if (this.state.pullDistance > 0) {
                // Prevent default scrolling while pulling
                if (this.state.pullDistance > 10) {
                    e.preventDefault();
                }

                // Show indicator
                this.indicator.classList.add('visible');

                // Rotate spinner based on pull distance
                const rotation = (this.state.pullDistance / this.options.threshold) * 360;
                this.indicator.querySelector('.ptr-spinner').style.transform = `rotate(${rotation}deg)`;

                // Update text
                const textEl = this.indicator.querySelector('.ptr-text');
                if (this.state.pullDistance >= this.options.threshold) {
                    textEl.textContent = 'Release to refresh';
                    textEl.style.color = this.options.indicatorColor;
                } else {
                    textEl.textContent = 'Pull to refresh';
                    textEl.style.color = 'var(--text-secondary)';
                }

                // Move indicator with pull (damped)
                const dampedPull = this.state.pullDistance * 0.6;
                this.indicator.style.transform = `translateY(${dampedPull}px)`;
            }
        }

        async handleTouchEnd() {
            if (!this.state.pulling) return;

            this.state.pulling = false;

            // Trigger refresh if pulled past threshold
            if (this.state.pullDistance >= this.options.threshold && !this.state.refreshing) {
                await this.triggerRefresh();
            } else {
                this.resetIndicator();
            }

            this.state.pullDistance = 0;
        }

        async triggerRefresh() {
            this.state.refreshing = true;

            // Animate indicator to fixed position
            this.indicator.style.transition = 'transform 0.2s ease';
            this.indicator.style.transform = 'translateY(0)';

            // Start spinning animation
            const spinner = this.indicator.querySelector('.ptr-spinner');
            spinner.classList.add('spin');
            spinner.style.transform = '';

            // Update text
            this.indicator.querySelector('.ptr-text').textContent = 'Refreshing...';

            try {
                // Call refresh callback
                await this.options.onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            }

            // Reset after refresh completes
            this.resetIndicator();
        }

        resetIndicator() {
            this.state.refreshing = false;

            // Stop spinning
            const spinner = this.indicator.querySelector('.ptr-spinner');
            spinner.classList.remove('spin');

            // Hide indicator
            this.indicator.style.transition = 'opacity 0.3s, transform 0.3s';
            this.indicator.style.opacity = '0';
            this.indicator.style.transform = 'translateY(-60px)';

            setTimeout(() => {
                this.indicator.classList.remove('visible');
                this.indicator.style.transition = '';
                this.indicator.style.opacity = '';
                this.indicator.style.transform = '';
            }, 300);
        }

        destroy() {
            if (this.indicator) {
                this.indicator.remove();
            }
        }
    }

    // Export to global scope
    window.PullToRefresh = PullToRefresh;

    /**
     * Helper to add pull-to-refresh to content browser views
     */
    window.addPullToRefresh = function (containerSelector, refreshCallback) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn('Pull-to-refresh: container not found', containerSelector);
            return null;
        }

        return new PullToRefresh(container, {
            onRefresh: refreshCallback
        });
    };

})();
