/**
 * Pull-to-Refresh Component for Mobile
 * Adds native-feeling pull-to-refresh to scrollable content areas
 */

interface PullToRefreshOptions {
    threshold?: number;
    maxPull?: number;
    onRefresh?: () => Promise<void> | void;
    indicatorColor?: string;
}

interface PullToRefreshState {
    pulling: boolean;
    refreshing: boolean;
    startY: number;
    currentY: number;
    pullDistance: number;
}

class PullToRefresh {
    private element: HTMLElement;
    private options: Required<PullToRefreshOptions>;
    private state: PullToRefreshState;
    private indicator: HTMLElement;

    constructor(element: HTMLElement, options: PullToRefreshOptions = {}) {
        this.element = element;
        this.options = {
            threshold: options.threshold || 80,
            maxPull: options.maxPull || 120,
            onRefresh: options.onRefresh || (async () => {}),
            indicatorColor: options.indicatorColor || 'var(--accent-primary)'
        };

        this.state = {
            pulling: false,
            refreshing: false,
            startY: 0,
            currentY: 0,
            pullDistance: 0
        };

        this.indicator = document.createElement('div');
        this.setupIndicator();
        this.attachListeners();
    }

    private setupIndicator(): void {
        // Create refresh indicator
        this.indicator.className = 'ptr-indicator';
        this.indicator.innerHTML = `
            <div class="ptr-spinner"></div>
            <div class="ptr-text">Pull to refresh</div>
        `;

        // Ensure element has position context
        const position = window.getComputedStyle(this.element).position;
        if (position === 'static') {
            this.element.classList.add('relative');
        }

        this.element.appendChild(this.indicator);
    }

    private attachListeners(): void {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), {
            passive: true
        });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), {
            passive: false
        });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    private handleTouchStart(e: TouchEvent): void {
        // Only activate if scrolled to top
        if (this.element.scrollTop === 0 && !this.state.refreshing) {
            this.state.startY = e.touches[0].clientY;
            this.state.pulling = true;
        }
    }

    private handleTouchMove(e: TouchEvent): void {
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
            const spinner = this.indicator.querySelector('.ptr-spinner') as HTMLElement;
            spinner.style.transform = `rotate(${rotation}deg)`;

            // Update text and color
            const textEl = this.indicator.querySelector('.ptr-text') as HTMLElement;
            if (this.state.pullDistance >= this.options.threshold) {
                textEl.textContent = 'Release to refresh';
                textEl.classList.add('text-primary');
                textEl.classList.remove('text-gray-400');
            } else {
                textEl.textContent = 'Pull to refresh';
                textEl.classList.add('text-gray-400');
                textEl.classList.remove('text-primary');
            }

            // Move indicator with pull (damped)
            const dampedPull = this.state.pullDistance * 0.6;
            this.indicator.style.transform = `translateY(${dampedPull}px)`;
        }
    }

    private async handleTouchEnd(): Promise<void> {
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

    private async triggerRefresh(): Promise<void> {
        this.state.refreshing = true;

        // Animate indicator to fixed position
        this.indicator.style.transition = 'transform 0.2s ease';
        this.indicator.style.transform = 'translateY(0)';

        // Start spinning animation
        const spinner = this.indicator.querySelector('.ptr-spinner') as HTMLElement;
        spinner.classList.add('spin');
        spinner.style.removeProperty('transform');

        // Update text
        const textEl = this.indicator.querySelector('.ptr-text') as HTMLElement;
        textEl.textContent = 'Refreshing...';

        try {
            // Call refresh callback
            await this.options.onRefresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        }

        // Reset after refresh completes
        this.resetIndicator();
    }

    private resetIndicator(): void {
        this.state.refreshing = false;

        // Stop spinning
        const spinner = this.indicator.querySelector('.ptr-spinner') as HTMLElement;
        spinner.classList.remove('spin');

        // Hide indicator with animation
        this.indicator.style.transition = 'opacity 0.3s, transform 0.3s';
        this.indicator.style.opacity = '0';
        this.indicator.style.transform = 'translateY(-60px)';

        setTimeout(() => {
            this.indicator.classList.remove('visible');
            this.indicator.style.removeProperty('transition');
            this.indicator.style.removeProperty('opacity');
            this.indicator.style.removeProperty('transform');
        }, 300);
    }

    destroy(): void {
        if (this.indicator) {
            this.indicator.remove();
        }
    }
}

// Export for ES modules
export { PullToRefresh };
export default PullToRefresh;

// Export to global scope
if (typeof window !== 'undefined') {
    (window as any).PullToRefresh = PullToRefresh;

    /**
     * Helper to add pull-to-refresh to content browser views
     */
    (window as any).addPullToRefresh = function (
        containerSelector: string,
        refreshCallback: () => Promise<void> | void
    ): PullToRefresh | null {
        const container = document.querySelector(containerSelector) as HTMLElement;
        if (!container) {
            console.warn('Pull-to-refresh: container not found', containerSelector);
            return null;
        }

        return new PullToRefresh(container, {
            onRefresh: refreshCallback
        });
    };
}
