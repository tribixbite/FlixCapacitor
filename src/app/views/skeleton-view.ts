/**
 * Skeleton View Components
 * Phase 9A.5: Skeleton screens for content grids
 */

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import type { View } from 'backbone.marionette';

/**
 * Skeleton configuration
 */
export interface SkeletonConfig {
    count?: number; // Number of skeleton items
    type: 'movie-card' | 'list-item' | 'detail-header' | 'search-result';
    animated?: boolean; // Enable shimmer animation
}

/**
 * Base Skeleton View
 */
export class SkeletonView extends Marionette.View<Backbone.Model> {
    private config: SkeletonConfig;

    constructor(options: any) {
        super(options);
        this.config = options.config || { type: 'movie-card', count: 12, animated: true };
    }

    template(): string {
        const items = Array.from({ length: this.config.count || 1 }, (_, i) => i);

        return `
            <div class="skeleton-container ${this.config.animated ? 'skeleton-animated' : ''}">
                ${items.map(() => this.getSkeletonHTML(this.config.type)).join('')}
            </div>
        `;
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
            <div class="skeleton-movie-card">
                <div class="skeleton-poster skeleton-box"></div>
                <div class="skeleton-title skeleton-text"></div>
                <div class="skeleton-year skeleton-text skeleton-text-short"></div>
            </div>
        `;
    }

    /**
     * List item skeleton (for queue, favorites)
     */
    private listItemSkeleton(): string {
        return `
            <div class="skeleton-list-item">
                <div class="skeleton-thumbnail skeleton-box"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title skeleton-text"></div>
                    <div class="skeleton-subtitle skeleton-text skeleton-text-short"></div>
                </div>
                <div class="skeleton-action skeleton-circle"></div>
            </div>
        `;
    }

    /**
     * Detail header skeleton (for movie details page)
     */
    private detailHeaderSkeleton(): string {
        return `
            <div class="skeleton-detail-header">
                <div class="skeleton-backdrop skeleton-box skeleton-wide"></div>
                <div class="skeleton-detail-content">
                    <div class="skeleton-poster-large skeleton-box"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title-large skeleton-text"></div>
                        <div class="skeleton-meta skeleton-text skeleton-text-short"></div>
                        <div class="skeleton-description">
                            <div class="skeleton-text"></div>
                            <div class="skeleton-text"></div>
                            <div class="skeleton-text skeleton-text-short"></div>
                        </div>
                        <div class="skeleton-actions">
                            <div class="skeleton-button skeleton-box"></div>
                            <div class="skeleton-button skeleton-box"></div>
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
            <div class="skeleton-search-result">
                <div class="skeleton-poster-small skeleton-box"></div>
                <div class="skeleton-result-content">
                    <div class="skeleton-title skeleton-text"></div>
                    <div class="skeleton-meta skeleton-text skeleton-text-short"></div>
                    <div class="skeleton-description skeleton-text"></div>
                </div>
            </div>
        `;
    }
}

/**
 * Collection view for multiple skeleton items
 */
export class SkeletonCollectionView extends Marionette.CollectionView<Backbone.Model, View<Backbone.Model>> {
    private config: SkeletonConfig;

    constructor(options: any) {
        super(options);
        this.config = options.config || { type: 'movie-card', count: 12, animated: true };

        // Set Marionette properties
        (this as any).childView = SkeletonView;
        (this as any).childViewOptions = {
            config: { ...this.config, count: 1 }
        };
        (this as any).className = `skeleton-collection ${this.config.animated ? 'skeleton-animated' : ''}`;

        // Create fake collection for skeleton items
        const items = Array.from({ length: this.config.count || 12 }, (_, i) => ({ id: i }));
        this.collection = new Backbone.Collection(items);
    }
}

/**
 * Generate skeleton CSS (to be added to main stylesheet)
 */
export function getSkeletonCSS(): string {
    return `
        /* Base skeleton styles */
        .skeleton-box,
        .skeleton-text,
        .skeleton-circle {
            background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
            background-size: 200% 100%;
            border-radius: 4px;
        }

        .skeleton-animated .skeleton-box,
        .skeleton-animated .skeleton-text,
        .skeleton-animated .skeleton-circle {
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-shimmer {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }

        .skeleton-circle {
            border-radius: 50%;
        }

        .skeleton-text {
            height: 16px;
            margin: 8px 0;
        }

        .skeleton-text-short {
            width: 60%;
        }

        /* Movie card skeleton */
        .skeleton-movie-card {
            width: 150px;
            margin: 8px;
            display: inline-block;
            vertical-align: top;
        }

        .skeleton-poster {
            width: 150px;
            height: 225px;
            margin-bottom: 8px;
        }

        /* List item skeleton */
        .skeleton-list-item {
            display: flex;
            align-items: center;
            padding: 12px;
            gap: 12px;
        }

        .skeleton-thumbnail {
            width: 60px;
            height: 90px;
            flex-shrink: 0;
        }

        .skeleton-content {
            flex: 1;
            min-width: 0;
        }

        .skeleton-action {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
        }

        /* Detail header skeleton */
        .skeleton-detail-header {
            position: relative;
        }

        .skeleton-backdrop {
            width: 100%;
            height: 200px;
            margin-bottom: 16px;
        }

        .skeleton-detail-content {
            display: flex;
            gap: 16px;
            padding: 16px;
        }

        .skeleton-poster-large {
            width: 200px;
            height: 300px;
            flex-shrink: 0;
        }

        .skeleton-info {
            flex: 1;
        }

        .skeleton-title-large {
            height: 32px;
            margin-bottom: 16px;
        }

        .skeleton-meta {
            height: 20px;
            width: 200px;
            margin-bottom: 16px;
        }

        .skeleton-description {
            margin-bottom: 24px;
        }

        .skeleton-actions {
            display: flex;
            gap: 12px;
        }

        .skeleton-button {
            width: 120px;
            height: 44px;
        }

        /* Search result skeleton */
        .skeleton-search-result {
            display: flex;
            gap: 12px;
            padding: 12px;
            border-bottom: 1px solid #333;
        }

        .skeleton-poster-small {
            width: 80px;
            height: 120px;
            flex-shrink: 0;
        }

        .skeleton-result-content {
            flex: 1;
        }

        /* Skeleton container */
        .skeleton-container {
            padding: 16px;
        }

        .skeleton-collection {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .skeleton-movie-card {
                width: calc(50% - 16px);
            }

            .skeleton-poster {
                width: 100%;
                height: auto;
                aspect-ratio: 2/3;
            }

            .skeleton-detail-content {
                flex-direction: column;
            }

            .skeleton-poster-large {
                width: 100%;
                height: auto;
                aspect-ratio: 2/3;
            }
        }

        @media (max-width: 480px) {
            .skeleton-movie-card {
                width: calc(33.333% - 16px);
            }
        }
    `;
}

/**
 * Factory function to create skeleton view
 */
export function createSkeletonView(config: SkeletonConfig): SkeletonView {
    return new SkeletonView({ config });
}

/**
 * Factory function to create skeleton collection view
 */
export function createSkeletonCollection(config: SkeletonConfig): SkeletonCollectionView {
    return new SkeletonCollectionView({ config });
}
