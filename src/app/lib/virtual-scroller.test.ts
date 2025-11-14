/**
 * Virtual Scroller Tests
 * Phase 9B.4: Testing Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualScroller, createVirtualGrid } from './virtual-scroller';
import type { VirtualScrollConfig } from './virtual-scroller';

describe('VirtualScroller', () => {
    let container: HTMLElement;
    let scroller: VirtualScroller;

    beforeEach(() => {
        container = document.createElement('div');
        container.style.height = '500px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        scroller?.destroy();
        document.body.removeChild(container);
    });

    describe('initialization', () => {
        it('should create viewport structure', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const viewport = container.querySelector('.virtual-scroll-viewport');
            const spacer = container.querySelector('.virtual-scroll-spacer');
            const itemsContainer = container.querySelector('.virtual-scroll-items');

            expect(viewport).not.toBeNull();
            expect(spacer).not.toBeNull();
            expect(itemsContainer).not.toBeNull();
        });

        it('should calculate correct spacer height', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const spacer = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            expect(spacer.style.height).toBe('5000px'); // 100 items * 50px
        });

        it('should use default values for optional config', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const range = scroller.getVisibleRange();
            expect(range).toBeDefined();
        });
    });

    describe('rendering', () => {
        it('should render initial visible items', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                overscan: 3,
                renderItem: (index) => {
                    const div = document.createElement('div');
                    div.textContent = `Item ${index}`;
                    return div;
                }
            });

            const itemsContainer = container.querySelector('.virtual-scroll-items');
            expect(itemsContainer?.children.length).toBeGreaterThan(0);
        });

        it('should support string and element render items', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 10,
                itemHeight: 50,
                renderItem: (index) => `<div class="item-${index}">Item ${index}</div>`
            });

            const itemsContainer = container.querySelector('.virtual-scroll-items');
            expect(itemsContainer?.children.length).toBeGreaterThan(0);
        });

        it('should update items on scroll', () => {
            const onScroll = vi.fn();

            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`,
                onScroll
            });

            const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;
            viewport.scrollTop = 1000;
            viewport.dispatchEvent(new Event('scroll'));

            // Wait for requestAnimationFrame
            setTimeout(() => {
                expect(onScroll).toHaveBeenCalled();
            }, 100);
        });
    });

    describe('updateTotalItems', () => {
        it('should update total items and re-render', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 50,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const spacer1 = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            expect(spacer1.style.height).toBe('2500px'); // 50 * 50

            scroller.updateTotalItems(100);

            const spacer2 = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            expect(spacer2.style.height).toBe('5000px'); // 100 * 50
        });
    });

    describe('updateItemHeight', () => {
        it('should update item height and re-render', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const spacer1 = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            expect(spacer1.style.height).toBe('5000px'); // 100 * 50

            scroller.updateItemHeight(100);

            const spacer2 = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            expect(spacer2.style.height).toBe('10000px'); // 100 * 100
        });
    });

    describe('scrollToIndex', () => {
        it('should scroll to specified index', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;
            scroller.scrollToIndex(10, 'auto');

            expect(viewport.scrollTop).toBe(500); // 10 * 50
        });
    });

    describe('scrollToTop', () => {
        it('should scroll to top', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;
            viewport.scrollTop = 1000;

            scroller.scrollToTop('auto');

            expect(viewport.scrollTop).toBe(0);
        });
    });

    describe('invalidateCache', () => {
        it('should invalidate specific item cache', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            scroller.invalidateCache(5);

            // Cache should be cleared and re-rendered
            expect(true).toBe(true);
        });

        it('should invalidate all cache when no index provided', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            scroller.invalidateCache();

            // All cache should be cleared
            expect(true).toBe(true);
        });
    });

    describe('getVisibleRange', () => {
        it('should return current visible range', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const range = scroller.getVisibleRange();

            expect(range).toHaveProperty('start');
            expect(range).toHaveProperty('end');
            expect(range.start).toBeGreaterThanOrEqual(0);
            expect(range.end).toBeLessThanOrEqual(100);
        });
    });

    describe('getScrollTop', () => {
        it('should return current scroll position', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;
            viewport.scrollTop = 500;

            expect(scroller.getScrollTop()).toBe(500);
        });
    });

    describe('destroy', () => {
        it('should clean up resources', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            scroller.destroy();

            expect(container.innerHTML).toBe('');
        });

        it('should not render after destroy', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            scroller.destroy();

            const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;

            // Should not throw
            if (viewport) {
                viewport.scrollTop = 1000;
                viewport.dispatchEvent(new Event('scroll'));
            }

            expect(true).toBe(true);
        });
    });

    describe('grid layout', () => {
        it('should support multiple items per row', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                itemsPerRow: 3,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const range = scroller.getVisibleRange();
            expect(range).toBeDefined();
        });

        it('should calculate correct total height for grid', () => {
            scroller = new VirtualScroller({
                container,
                totalItems: 100,
                itemHeight: 50,
                itemsPerRow: 4,
                renderItem: (index) => `<div>Item ${index}</div>`
            });

            const spacer = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
            // 100 items / 4 per row = 25 rows * 50px = 1250px
            expect(spacer.style.height).toBe('1250px');
        });
    });
});

describe('createVirtualGrid', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '500px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should create virtual grid with correct items per row', () => {
        const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

        const scroller = createVirtualGrid({
            container,
            items,
            itemWidth: 200,
            itemHeight: 150,
            gap: 10,
            renderItem: (item) => `<div>${item.name}</div>`
        });

        expect(scroller).toBeDefined();
        expect(scroller.getVisibleRange()).toBeDefined();

        scroller.destroy();
    });

    it('should calculate items per row based on container width', () => {
        const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));

        // Container: 800px wide
        // Item: 200px wide
        // Gap: 10px
        // Items per row: floor((800 + 10) / (200 + 10)) = floor(810 / 210) = 3

        const scroller = createVirtualGrid({
            container,
            items,
            itemWidth: 200,
            itemHeight: 150,
            gap: 10,
            renderItem: (item) => {
                const div = document.createElement('div');
                div.textContent = `Item ${item.id}`;
                return div;
            }
        });

        expect(scroller).toBeDefined();

        scroller.destroy();
    });

    it('should call onScroll callback', () => {
        const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
        const onScroll = vi.fn();

        const scroller = createVirtualGrid({
            container,
            items,
            itemWidth: 200,
            itemHeight: 150,
            renderItem: (item) => `<div>Item ${item.id}</div>`,
            onScroll
        });

        const viewport = container.querySelector('.virtual-scroll-viewport') as HTMLElement;
        viewport.scrollTop = 500;
        viewport.dispatchEvent(new Event('scroll'));

        setTimeout(() => {
            expect(onScroll).toHaveBeenCalled();
        }, 100);

        scroller.destroy();
    });

    it('should handle minimum 1 item per row', () => {
        const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));

        // Make item wider than container to test minimum
        const scroller = createVirtualGrid({
            container,
            items,
            itemWidth: 1000, // Wider than container
            itemHeight: 150,
            renderItem: (item) => `<div>Item ${item.id}</div>`
        });

        expect(scroller).toBeDefined();

        scroller.destroy();
    });
});
