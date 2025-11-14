/**
 * Skeleton View Components (Phase 9A Integration)
 * Updated with Tailwind CSS and Phase 9A loading state manager integration
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

/**
 * Skeleton configuration
 */
export interface SkeletonConfig {
    count?: number; // Number of skeleton items
    type: 'movie-card' | 'list-item' | 'detail-header' | 'search-result';
    animated?: boolean; // Enable shimmer animation (default: true)
    layout?: 'grid' | 'list'; // Layout type (default: grid)
}

/**
 * Base Skeleton View
 * Shows loading placeholders with shimmer animation
 */
export class SkeletonView extends View<any> {
    private config: SkeletonConfig;

    constructor(options: { config: SkeletonConfig } & ViewOptions<any> & { el?: any }) {
        super({ el: options.el } as any);

        this.config = {
            count: 12,
            animated: true,
            layout: 'grid',
            ...options.config
        };

        logger.debug(`Skeleton view created: ${this.config.type} (${this.config.count} items)`, undefined, 'ui');
        analytics.trackEvent('skeleton_view_shown', {
            type: this.config.type,
            count: this.config.count,
            animated: this.config.animated
        });
    }

    template(): string {
        const items = Array.from({ length: this.config.count || 1 }, (_, i) => i);

        return `
            <div class="${this.getContainerClass()}">
                ${items.map(() => this.getSkeletonHTML(this.config.type)).join('')}
            </div>
        `;
    }

    /**
     * Get container class based on layout
     */
    private getContainerClass(): string {
        if (this.config.layout === 'list') {
            return 'flex flex-col gap-4';
        }

        // Grid layout (responsive: 2→3→4→5→6 cols)
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }

    /**
     * Get skeleton HTML for type
     */
    private getSkeletonHTML(type: SkeletonConfig['type']): string {
        switch (type) {
            case 'movie-card':
                return this.movieCardSkeleton();
            case 'list-item':
                return this.listItemSkeleton();
            case 'detail-header':
                return this.detailHeaderSkeleton();
            case 'search-result':
                return this.searchResultSkeleton();
            default:
                return '';
        }
    }

    /**
     * Movie card skeleton (for home grid)
     */
    private movieCardSkeleton(): string {
        return `
            <div class="flex flex-col gap-2">
                <!-- Poster -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded-lg aspect-[2/3] w-full"></div>

                <!-- Title -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-3/4"></div>

                <!-- Year -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded h-3 w-1/2"></div>
            </div>
        `;
    }

    /**
     * List item skeleton (for queue, favorites)
     */
    private listItemSkeleton(): string {
        return `
            <div class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                <!-- Thumbnail -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded w-16 h-24 flex-shrink-0"></div>

                <!-- Content -->
                <div class="flex-1 min-w-0 space-y-2">
                    <!-- Title -->
                    <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-3/4"></div>

                    <!-- Subtitle -->
                    <div class="${this.getShimmerClass()} bg-gray-800 rounded h-3 w-1/2"></div>
                </div>

                <!-- Action Icon -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded-full w-8 h-8 flex-shrink-0"></div>
            </div>
        `;
    }

    /**
     * Detail header skeleton (for movie details page)
     */
    private detailHeaderSkeleton(): string {
        return `
            <div class="space-y-6">
                <!-- Backdrop -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded-lg w-full h-64 sm:h-80 md:h-96"></div>

                <!-- Content Section -->
                <div class="flex flex-col sm:flex-row gap-6">
                    <!-- Poster -->
                    <div class="${this.getShimmerClass()} bg-gray-800 rounded-lg w-48 aspect-[2/3] flex-shrink-0"></div>

                    <!-- Info -->
                    <div class="flex-1 space-y-4">
                        <!-- Title -->
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-8 w-2/3"></div>

                        <!-- Meta -->
                        <div class="flex items-center gap-4">
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-5 w-16"></div>
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-5 w-24"></div>
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-5 w-20"></div>
                        </div>

                        <!-- Description -->
                        <div class="space-y-2">
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-full"></div>
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-full"></div>
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-3/4"></div>
                        </div>

                        <!-- Buttons -->
                        <div class="flex items-center gap-3">
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded-lg h-10 w-32"></div>
                            <div class="${this.getShimmerClass()} bg-gray-800 rounded-lg h-10 w-32"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Search result skeleton
     */
    private searchResultSkeleton(): string {
        return `
            <div class="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg">
                <!-- Poster -->
                <div class="${this.getShimmerClass()} bg-gray-800 rounded w-20 aspect-[2/3] flex-shrink-0"></div>

                <!-- Content -->
                <div class="flex-1 min-w-0 space-y-3">
                    <!-- Title & Year -->
                    <div class="space-y-2">
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-5 w-3/4"></div>
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-1/4"></div>
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-3 w-full"></div>
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-3 w-full"></div>
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-3 w-2/3"></div>
                    </div>

                    <!-- Meta Info -->
                    <div class="flex items-center gap-3">
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-16"></div>
                        <div class="${this.getShimmerClass()} bg-gray-800 rounded h-4 w-20"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get shimmer animation class
     */
    private getShimmerClass(): string {
        if (!this.config.animated) {
            return '';
        }

        // Shimmer animation will be defined in Tailwind config or CSS
        return 'animate-pulse';
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('SkeletonView destroyed', undefined, 'ui');
        analytics.trackEvent('skeleton_view_destroyed');
    }
}

/**
 * Helper function to show skeleton loading
 */
export function showSkeleton(
    container: HTMLElement,
    config: SkeletonConfig
): SkeletonView {
    const view = new SkeletonView({ config });

    view.setElement(container);
    view.render();

    logger.debug(`Skeleton shown: ${config.type}`, {
        count: config.count,
        animated: config.animated
    }, 'ui');

    return view;
}

/**
 * Helper function to replace skeleton with content
 */
export function replaceSkeleton(
    skeleton: SkeletonView | null,
    contentView: View<any>
): void {
    if (!skeleton) return;

    const container = skeleton.el;

    // Remove skeleton
    skeleton.destroy();

    // Render content
    contentView.setElement(container);
    contentView.render();

    logger.debug('Skeleton replaced with content', undefined, 'ui');
    analytics.trackEvent('skeleton_replaced');
}

/**
 * Custom shimmer animation CSS (can be added to main.css)
 *
 * @keyframes shimmer {
 *   0% {
 *     background-position: -1000px 0;
 *   }
 *   100% {
 *     background-position: 1000px 0;
 *   }
 * }
 *
 * .skeleton-shimmer {
 *   animation: shimmer 2s infinite linear;
 *   background: linear-gradient(
 *     90deg,
 *     rgba(255, 255, 255, 0) 0%,
 *     rgba(255, 255, 255, 0.05) 50%,
 *     rgba(255, 255, 255, 0) 100%
 *   );
 *   background-size: 1000px 100%;
 * }
 */
