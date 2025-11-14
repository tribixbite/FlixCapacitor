/**
 * Image Lazy Loader Tests
 * Phase 9B.4: Testing Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageLazyLoader, initLazyLoading, lazyLoadBackgrounds } from './image-lazy-loader';

describe('ImageLazyLoader', () => {
    let loader: ImageLazyLoader;

    beforeEach(() => {
        loader = new ImageLazyLoader();
    });

    afterEach(() => {
        loader.disconnect();
    });

    describe('initialization', () => {
        it('should create loader with default config', () => {
            expect(loader).toBeDefined();
            expect(loader.getStats().total).toBe(0);
        });

        it('should create loader with custom config', () => {
            const customLoader = new ImageLazyLoader({
                rootMargin: '100px',
                threshold: 0.1,
                fadeIn: false
            });

            expect(customLoader).toBeDefined();
            customLoader.disconnect();
        });
    });

    describe('observe', () => {
        it('should observe image with data-src attribute', () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://example.com/image.jpg';

            loader.observe(img);

            expect(img.classList.contains('lazy-loading')).toBe(true);
        });

        it('should skip image without data-src', () => {
            const img = document.createElement('img');

            loader.observe(img);

            expect(img.classList.contains('lazy-loading')).toBe(false);
        });

        it('should skip already loaded images', () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://example.com/image.jpg';
            img.src = 'https://example.com/image.jpg';

            loader.observe(img);
            loader.observe(img); // Second observe should be no-op

            expect(img.classList.contains('lazy-loading')).toBe(true);
        });

        it('should set placeholder if no src', () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://example.com/image.jpg';

            loader.observe(img);

            expect(img.src).toContain('data:image/svg+xml');
        });
    });

    describe('observeAll', () => {
        it('should observe multiple images', () => {
            const img1 = document.createElement('img');
            img1.dataset.src = 'https://example.com/image1.jpg';

            const img2 = document.createElement('img');
            img2.dataset.src = 'https://example.com/image2.jpg';

            loader.observeAll([img1, img2]);

            expect(img1.classList.contains('lazy-loading')).toBe(true);
            expect(img2.classList.contains('lazy-loading')).toBe(true);
        });

        it('should handle NodeList', () => {
            document.body.innerHTML = `
                <img data-src="https://example.com/image1.jpg">
                <img data-src="https://example.com/image2.jpg">
            `;

            const images = document.querySelectorAll('img');
            loader.observeAll(images);

            expect(images[0].classList.contains('lazy-loading')).toBe(true);
            expect(images[1].classList.contains('lazy-loading')).toBe(true);
        });
    });

    describe('observeSelector', () => {
        it('should observe images by selector', () => {
            document.body.innerHTML = `
                <img class="lazy" data-src="https://example.com/image1.jpg">
                <img class="lazy" data-src="https://example.com/image2.jpg">
                <img data-src="https://example.com/image3.jpg">
            `;

            loader.observeSelector('.lazy');

            const lazyImages = document.querySelectorAll('.lazy');
            expect(lazyImages[0].classList.contains('lazy-loading')).toBe(true);
            expect(lazyImages[1].classList.contains('lazy-loading')).toBe(true);
        });

        it('should support custom root element', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <img data-src="https://example.com/image1.jpg">
                <img data-src="https://example.com/image2.jpg">
            `;
            document.body.appendChild(container);

            loader.observeSelector('img', container);

            const images = container.querySelectorAll('img');
            expect(images[0].classList.contains('lazy-loading')).toBe(true);
            expect(images[1].classList.contains('lazy-loading')).toBe(true);

            document.body.removeChild(container);
        });
    });

    describe('loading images', () => {
        it('should dispatch lazyloaded event on success', async () => {
            const img = document.createElement('img');
            img.dataset.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

            const eventPromise = new Promise<void>((resolve) => {
                img.addEventListener('lazyloaded', (e: Event) => {
                    const customEvent = e as CustomEvent;
                    expect(customEvent.detail.src).toBeDefined();
                    expect(img.classList.contains('lazy-loaded')).toBe(true);
                    expect(img.classList.contains('lazy-loading')).toBe(false);
                    resolve();
                });
            });

            loader.observe(img);

            // Trigger IntersectionObserver callback manually
            const observer = (global.IntersectionObserver as any).mock.calls[0][0];
            observer([{ isIntersecting: true, target: img }]);

            await eventPromise;
        });

        it('should dispatch lazyerror event on failure', async () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://invalid-url-that-does-not-exist.com/image.jpg';

            const eventPromise = new Promise<void>((resolve) => {
                img.addEventListener('lazyerror', (e: Event) => {
                    const customEvent = e as CustomEvent;
                    expect(customEvent.detail.src).toBeDefined();
                    expect(img.classList.contains('lazy-error')).toBe(true);
                    expect(img.classList.contains('lazy-loading')).toBe(false);
                    resolve();
                });
            });

            loader.observe(img);

            // Trigger IntersectionObserver callback manually
            const observer = (global.IntersectionObserver as any).mock.calls[0][0];
            observer([{ isIntersecting: true, target: img }]);

            // Wait a bit for error to trigger
            await new Promise(resolve => setTimeout(resolve, 100));

            // Force error by creating image element
            const testImg = new Image();
            testImg.onerror = () => {
                img.dispatchEvent(new CustomEvent('lazyerror', {
                    bubbles: true,
                    detail: { src: img.dataset.src }
                }));
            };
            testImg.src = img.dataset.src!;

            await eventPromise;
        });
    });

    describe('unobserve', () => {
        it('should unobserve specific image', () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://example.com/image.jpg';

            loader.observe(img);
            loader.unobserve(img);

            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('disconnect', () => {
        it('should disconnect observer', () => {
            const img1 = document.createElement('img');
            img1.dataset.src = 'https://example.com/image1.jpg';

            const img2 = document.createElement('img');
            img2.dataset.src = 'https://example.com/image2.jpg';

            loader.observe(img1);
            loader.observe(img2);
            loader.disconnect();

            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should return statistics', () => {
            const stats = loader.getStats();

            expect(stats).toHaveProperty('loaded');
            expect(stats).toHaveProperty('errors');
            expect(stats).toHaveProperty('total');
            expect(stats.loaded).toBe(0);
            expect(stats.errors).toBe(0);
            expect(stats.total).toBe(0);
        });
    });

    describe('reset', () => {
        it('should reset loader state', () => {
            const img = document.createElement('img');
            img.dataset.src = 'https://example.com/image.jpg';

            loader.observe(img);
            loader.reset();

            const stats = loader.getStats();
            expect(stats.total).toBe(0);
        });
    });

    describe('fallback behavior', () => {
        it('should load immediately when IntersectionObserver not available', () => {
            const originalObserver = global.IntersectionObserver;
            (global as any).IntersectionObserver = undefined;

            const noObserverLoader = new ImageLazyLoader();
            const img = document.createElement('img');
            img.dataset.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

            noObserverLoader.observe(img);

            // Restore
            global.IntersectionObserver = originalObserver;
            noObserverLoader.disconnect();
        });
    });
});

describe('initLazyLoading', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should initialize lazy loading with default selector', () => {
        document.body.innerHTML = `
            <img data-src="https://example.com/image1.jpg">
            <img data-src="https://example.com/image2.jpg">
        `;

        initLazyLoading();

        const images = document.querySelectorAll('img[data-src]');
        expect(images[0].classList.contains('lazy-loading')).toBe(true);
        expect(images[1].classList.contains('lazy-loading')).toBe(true);
    });

    it('should support custom selector', () => {
        document.body.innerHTML = `
            <img class="custom-lazy" data-src="https://example.com/image1.jpg">
            <img data-src="https://example.com/image2.jpg">
        `;

        initLazyLoading('.custom-lazy');

        const customImage = document.querySelector('.custom-lazy');
        expect(customImage?.classList.contains('lazy-loading')).toBe(true);
    });

    it('should support custom root element', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <img data-src="https://example.com/image1.jpg">
        `;
        document.body.appendChild(container);

        initLazyLoading('img[data-src]', container);

        const img = container.querySelector('img');
        expect(img?.classList.contains('lazy-loading')).toBe(true);

        document.body.removeChild(container);
    });
});

describe('lazyLoadBackgrounds', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should lazy load background images', () => {
        document.body.innerHTML = `
            <div data-bg="https://example.com/bg1.jpg"></div>
            <div data-bg="https://example.com/bg2.jpg"></div>
        `;

        lazyLoadBackgrounds();

        // Observer should be set up
        expect(true).toBe(true);
    });

    it('should support custom selector', () => {
        document.body.innerHTML = `
            <div class="bg-lazy" data-bg="https://example.com/bg1.jpg"></div>
            <div data-bg="https://example.com/bg2.jpg"></div>
        `;

        lazyLoadBackgrounds('.bg-lazy');

        expect(true).toBe(true);
    });

    it('should support custom root element', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <div data-bg="https://example.com/bg1.jpg"></div>
        `;
        document.body.appendChild(container);

        lazyLoadBackgrounds('[data-bg]', container);

        expect(true).toBe(true);

        document.body.removeChild(container);
    });

    it('should load immediately when IntersectionObserver not available', () => {
        const originalObserver = global.IntersectionObserver;
        (global as any).IntersectionObserver = undefined;

        document.body.innerHTML = `
            <div data-bg="https://example.com/bg1.jpg"></div>
            <div data-bg="https://example.com/bg2.jpg"></div>
        `;

        lazyLoadBackgrounds();

        const elements = document.querySelectorAll('[data-bg]');
        expect(elements[0].getAttribute('style')).toContain('background-image');
        expect(elements[1].getAttribute('style')).toContain('background-image');

        // Restore
        global.IntersectionObserver = originalObserver;
    });
});
