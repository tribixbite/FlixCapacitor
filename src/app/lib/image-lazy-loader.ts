/**
 * Image Lazy Loader
 * Phase 9B.3: Lazy loading images with IntersectionObserver
 */

/**
 * Lazy load configuration
 */
export interface LazyLoadConfig {
    rootMargin?: string;
    threshold?: number;
    placeholder?: string;
    errorPlaceholder?: string;
    fadeIn?: boolean;
    fadeInDuration?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LazyLoadConfig = {
    rootMargin: '50px',
    threshold: 0.01,
    placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23333" width="400" height="600"/%3E%3C/svg%3E',
    errorPlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23666" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23fff"%3EError%3C/text%3E%3C/svg%3E',
    fadeIn: true,
    fadeInDuration: 300
};

/**
 * Image Lazy Loader
 */
export class ImageLazyLoader {
    private observer: IntersectionObserver | null = null;
    private config: LazyLoadConfig;
    private loadedImages = new Set<HTMLImageElement>();
    private errorImages = new Set<HTMLImageElement>();

    constructor(config: Partial<LazyLoadConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeObserver();
    }

    /**
     * Initialize IntersectionObserver
     */
    private initializeObserver(): void {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to immediate loading');
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        this.loadImage(img);
                        this.observer?.unobserve(img);
                    }
                });
            },
            {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );
    }

    /**
     * Observe an image for lazy loading
     */
    observe(img: HTMLImageElement): void {
        // Skip if already loaded or error
        if (this.loadedImages.has(img) || this.errorImages.has(img)) {
            return;
        }

        // Set placeholder
        if (!img.src || img.src === '') {
            img.src = this.config.placeholder!;
        }

        // Store original src in data attribute
        const dataSrc = img.dataset.src;
        if (!dataSrc) {
            return;
        }

        // Add loading class
        img.classList.add('lazy-loading');

        // Observe with IntersectionObserver if available
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback: load immediately
            this.loadImage(img);
        }
    }

    /**
     * Observe multiple images
     */
    observeAll(images: HTMLImageElement[] | NodeListOf<HTMLImageElement>): void {
        Array.from(images).forEach(img => this.observe(img));
    }

    /**
     * Observe images by selector
     */
    observeSelector(selector: string, root: Element | Document = document): void {
        const images = root.querySelectorAll<HTMLImageElement>(selector);
        this.observeAll(images);
    }

    /**
     * Load an image
     */
    private loadImage(img: HTMLImageElement): void {
        const src = img.dataset.src;
        if (!src) {
            return;
        }

        // Create a new image to preload
        const loader = new Image();

        loader.onload = () => {
            // Set the actual image src
            img.src = src;

            // Remove data-src
            delete img.dataset.src;

            // Update classes
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');

            // Add to loaded set
            this.loadedImages.add(img);

            // Fade in if enabled
            if (this.config.fadeIn) {
                img.style.opacity = '0';
                img.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in`;
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            }

            // Dispatch custom event
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                bubbles: true,
                detail: { src }
            }));
        };

        loader.onerror = () => {
            // Set error placeholder
            img.src = this.config.errorPlaceholder!;

            // Update classes
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');

            // Add to error set
            this.errorImages.add(img);

            // Dispatch custom event
            img.dispatchEvent(new CustomEvent('lazyerror', {
                bubbles: true,
                detail: { src }
            }));
        };

        // Start loading
        loader.src = src;
    }

    /**
     * Unobserve an image
     */
    unobserve(img: HTMLImageElement): void {
        this.observer?.unobserve(img);
    }

    /**
     * Unobserve all images
     */
    disconnect(): void {
        this.observer?.disconnect();
    }

    /**
     * Force load all observed images
     */
    loadAll(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    /**
     * Get statistics
     */
    getStats(): {
        loaded: number;
        errors: number;
        total: number;
    } {
        return {
            loaded: this.loadedImages.size,
            errors: this.errorImages.size,
            total: this.loadedImages.size + this.errorImages.size
        };
    }

    /**
     * Reset
     */
    reset(): void {
        this.disconnect();
        this.loadedImages.clear();
        this.errorImages.clear();
        this.initializeObserver();
    }
}

/**
 * Global lazy loader instance
 */
export const imageLazyLoader = new ImageLazyLoader();

/**
 * Initialize lazy loading for images
 */
export function initLazyLoading(selector: string = 'img[data-src]', root?: Element): void {
    imageLazyLoader.observeSelector(selector, root);
}

/**
 * Lazy load background images
 */
export function lazyLoadBackgrounds(selector: string = '[data-bg]', root: Element | Document = document): void {
    const elements = root.querySelectorAll<HTMLElement>(selector);

    if (!('IntersectionObserver' in window)) {
        // Fallback: load immediately
        elements.forEach(el => {
            const bg = el.dataset.bg;
            if (bg) {
                el.style.backgroundImage = `url(${bg})`;
                delete el.dataset.bg;
            }
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const bg = el.dataset.bg;
                    if (bg) {
                        el.style.backgroundImage = `url(${bg})`;
                        delete el.dataset.bg;
                        el.classList.add('bg-loaded');
                    }
                    observer.unobserve(el);
                }
            });
        },
        {
            rootMargin: '50px',
            threshold: 0.01
        }
    );

    elements.forEach(el => observer.observe(el));
}

/**
 * Generate lazy loading CSS
 */
export function getLazyLoadingCSS(): string {
    return `
        img[data-src] {
            background: #333;
        }

        img.lazy-loading {
            opacity: 0.6;
            filter: blur(5px);
        }

        img.lazy-loaded {
            opacity: 1;
            filter: none;
        }

        img.lazy-error {
            opacity: 0.5;
        }

        [data-bg] {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .bg-loaded {
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
}
