/**
 * Virtual Scroller
 * Phase 9B.3: Virtual scrolling for large lists (>100 items)
 */

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
    itemHeight: number;
    itemsPerRow?: number;
    overscan?: number; // Number of extra items to render outside viewport
    container: HTMLElement;
    totalItems: number;
    renderItem: (index: number) => HTMLElement | string;
    onScroll?: (scrollTop: number, visibleRange: { start: number; end: number }) => void;
}

/**
 * Virtual Scroller
 */
export class VirtualScroller {
    private config: VirtualScrollConfig;
    private container: HTMLElement;
    private viewport: HTMLElement;
    private spacer: HTMLElement;
    private itemsContainer: HTMLElement;
    private visibleRange = { start: 0, end: 0 };
    private scrollRAF: number | null = null;
    private itemCache = new Map<number, HTMLElement>();
    private isDestroyed = false;

    constructor(config: VirtualScrollConfig) {
        this.config = {
            itemsPerRow: 1,
            overscan: 3,
            ...config
        };

        this.container = config.container;

        // Create viewport structure
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.cssText = 'overflow-y: auto; height: 100%; position: relative;';

        this.spacer = document.createElement('div');
        this.spacer.className = 'virtual-scroll-spacer';
        this.spacer.style.cssText = 'width: 1px;';

        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'virtual-scroll-items';
        this.itemsContainer.style.cssText = 'position: absolute; top: 0; left: 0; right: 0;';

        this.viewport.appendChild(this.spacer);
        this.viewport.appendChild(this.itemsContainer);
        this.container.appendChild(this.viewport);

        // Initialize
        this.updateSpacerHeight();
        this.handleScroll = this.handleScroll.bind(this);
        this.viewport.addEventListener('scroll', this.handleScroll);

        // Initial render
        this.render();
    }

    /**
     * Update total height spacer
     */
    private updateSpacerHeight(): void {
        const totalRows = Math.ceil(this.config.totalItems / this.config.itemsPerRow!);
        const totalHeight = totalRows * this.config.itemHeight;
        this.spacer.style.height = `${totalHeight}px`;
    }

    /**
     * Handle scroll event
     */
    private handleScroll(): void {
        if (this.scrollRAF) {
            cancelAnimationFrame(this.scrollRAF);
        }

        this.scrollRAF = requestAnimationFrame(() => {
            this.render();

            if (this.config.onScroll) {
                this.config.onScroll(this.viewport.scrollTop, this.visibleRange);
            }
        });
    }

    /**
     * Calculate visible range
     */
    private calculateVisibleRange(): { start: number; end: number } {
        const scrollTop = this.viewport.scrollTop;
        const viewportHeight = this.viewport.clientHeight;

        const startRow = Math.floor(scrollTop / this.config.itemHeight);
        const endRow = Math.ceil((scrollTop + viewportHeight) / this.config.itemHeight);

        // Apply overscan
        const overscanRows = this.config.overscan!;
        const totalRows = Math.ceil(this.config.totalItems / this.config.itemsPerRow!);

        const start = Math.max(0, (startRow - overscanRows) * this.config.itemsPerRow!);
        const end = Math.min(
            this.config.totalItems,
            (endRow + overscanRows) * this.config.itemsPerRow!
        );

        return { start, end };
    }

    /**
     * Render visible items
     */
    private render(): void {
        if (this.isDestroyed) return;

        const newRange = this.calculateVisibleRange();

        // Check if range changed
        if (
            newRange.start === this.visibleRange.start &&
            newRange.end === this.visibleRange.end
        ) {
            return;
        }

        this.visibleRange = newRange;

        // Calculate offset for items container
        const startRow = Math.floor(newRange.start / this.config.itemsPerRow!);
        const offsetTop = startRow * this.config.itemHeight;
        this.itemsContainer.style.transform = `translateY(${offsetTop}px)`;

        // Clear current items
        this.itemsContainer.innerHTML = '';

        // Render visible items
        for (let i = newRange.start; i < newRange.end; i++) {
            const item = this.getOrCreateItem(i);
            this.itemsContainer.appendChild(item);
        }

        // Clean up cache for items far outside viewport
        const cacheThreshold = this.config.overscan! * 3;
        for (const [index] of this.itemCache) {
            if (index < newRange.start - cacheThreshold || index > newRange.end + cacheThreshold) {
                this.itemCache.delete(index);
            }
        }
    }

    /**
     * Get or create item element
     */
    private getOrCreateItem(index: number): HTMLElement {
        // Check cache
        if (this.itemCache.has(index)) {
            return this.itemCache.get(index)!;
        }

        // Render item
        const itemContent = this.config.renderItem(index);
        let element: HTMLElement;

        if (typeof itemContent === 'string') {
            element = document.createElement('div');
            element.innerHTML = itemContent;
            element = element.firstElementChild as HTMLElement || element;
        } else {
            element = itemContent;
        }

        // Add to cache
        this.itemCache.set(index, element);

        return element;
    }

    /**
     * Scroll to index
     */
    scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
        const row = Math.floor(index / this.config.itemsPerRow!);
        const offsetTop = row * this.config.itemHeight;

        this.viewport.scrollTo({
            top: offsetTop,
            behavior
        });
    }

    /**
     * Scroll to top
     */
    scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
        this.viewport.scrollTo({
            top: 0,
            behavior
        });
    }

    /**
     * Update total items
     */
    updateTotalItems(totalItems: number): void {
        this.config.totalItems = totalItems;
        this.updateSpacerHeight();
        this.render();
    }

    /**
     * Update item height
     */
    updateItemHeight(itemHeight: number): void {
        this.config.itemHeight = itemHeight;
        this.updateSpacerHeight();
        this.render();
    }

    /**
     * Invalidate item cache
     */
    invalidateCache(index?: number): void {
        if (index !== undefined) {
            this.itemCache.delete(index);
        } else {
            this.itemCache.clear();
        }
        this.render();
    }

    /**
     * Get visible range
     */
    getVisibleRange(): { start: number; end: number } {
        return { ...this.visibleRange };
    }

    /**
     * Get scroll position
     */
    getScrollTop(): number {
        return this.viewport.scrollTop;
    }

    /**
     * Destroy virtual scroller
     */
    destroy(): void {
        this.isDestroyed = true;

        if (this.scrollRAF) {
            cancelAnimationFrame(this.scrollRAF);
        }

        this.viewport.removeEventListener('scroll', this.handleScroll);
        this.itemCache.clear();
        this.container.innerHTML = '';
    }
}

/**
 * Create a virtual scroller for a grid
 */
export function createVirtualGrid(config: {
    container: HTMLElement;
    items: any[];
    itemWidth: number;
    itemHeight: number;
    gap?: number;
    renderItem: (item: any, index: number) => HTMLElement | string;
    onScroll?: (scrollTop: number, visibleRange: { start: number; end: number }) => void;
}): VirtualScroller {
    // Calculate items per row based on container width
    const gap = config.gap || 0;
    const containerWidth = config.container.clientWidth;
    const itemsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (config.itemWidth + gap)));

    return new VirtualScroller({
        container: config.container,
        totalItems: config.items.length,
        itemHeight: config.itemHeight + gap,
        itemsPerRow,
        renderItem: (index) => {
            return config.renderItem(config.items[index], index);
        },
        onScroll: config.onScroll
    });
}

/**
 * Virtual scroll CSS
 */
export function getVirtualScrollCSS(): string {
    return `
        .virtual-scroll-viewport {
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
            position: relative;
            -webkit-overflow-scrolling: touch;
        }

        .virtual-scroll-spacer {
            width: 1px;
            pointer-events: none;
        }

        .virtual-scroll-items {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-wrap: wrap;
            gap: var(--grid-gap, 8px);
        }
    `;
}
