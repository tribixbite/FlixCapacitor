/**
 * Loading Skeleton Components
 * Provides shimmer loading placeholders for better perceived performance
 */

export const LoadingSkeletons = {
    /**
     * Create skeleton for content grid (movies/shows)
     */
    contentGrid(count = 12) {
        const skeletons = Array.from({ length: count }, () => `
            <div class="skeleton-card">
                <div class="skeleton-poster"></div>
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text skeleton-meta"></div>
            </div>
        `).join('');

        return `
            <div class="skeleton-grid">
                ${skeletons}
            </div>
        `;
    },

    /**
     * Create skeleton for detail view
     */
    detailView() {
        return `
            <div class="skeleton-detail">
                <div class="skeleton-backdrop"></div>
                <div class="skeleton-detail-content">
                    <div class="skeleton-poster-large"></div>
                    <div class="skeleton-text skeleton-title-large"></div>
                    <div class="skeleton-text skeleton-meta-large"></div>
                    <div class="skeleton-buttons">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button skeleton-button-small"></div>
                    </div>
                    <div class="skeleton-text skeleton-line"></div>
                    <div class="skeleton-text skeleton-line"></div>
                    <div class="skeleton-text skeleton-line skeleton-line-short"></div>
                </div>
            </div>
        `;
    },

    /**
     * Create skeleton for list items
     */
    listItems(count = 5) {
        const skeletons = Array.from({ length: count }, () => `
            <div class="skeleton-list-item">
                <div class="skeleton-list-icon"></div>
                <div class="skeleton-list-content">
                    <div class="skeleton-text skeleton-list-title"></div>
                    <div class="skeleton-text skeleton-list-subtitle"></div>
                </div>
            </div>
        `).join('');

        return `
            <div class="skeleton-list">
                ${skeletons}
            </div>
        `;
    }
};

/**
 * Initialize skeleton styles
 */
export function initSkeletonStyles() {
    if (document.getElementById('skeleton-styles')) {
        return; // Already initialized
    }

    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
        /* Skeleton Base Animation */
        @keyframes skeleton-shimmer {
            0% {
                background-position: -200px 0;
            }
            100% {
                background-position: calc(200px + 100%) 0;
            }
        }

        .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 1rem;
            padding: 1rem;
        }

        .skeleton-card {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .skeleton-poster {
            width: 100%;
            aspect-ratio: 2/3;
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: var(--radius-md);
        }

        .skeleton-text {
            height: 14px;
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: 4px;
        }

        .skeleton-title {
            width: 90%;
            height: 16px;
        }

        .skeleton-meta {
            width: 60%;
            height: 12px;
        }

        /* Detail View Skeleton */
        .skeleton-detail {
            display: flex;
            flex-direction: column;
        }

        .skeleton-backdrop {
            width: 100%;
            height: 40vh;
            min-height: 300px;
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }

        .skeleton-detail-content {
            padding: 2rem 1rem;
            margin-top: -4rem;
        }

        .skeleton-poster-large {
            width: 120px;
            height: 180px;
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: var(--radius-md);
            margin-bottom: 1.5rem;
        }

        .skeleton-title-large {
            width: 80%;
            height: 28px;
            margin-bottom: 0.75rem;
        }

        .skeleton-meta-large {
            width: 60%;
            height: 16px;
            margin-bottom: 1.5rem;
        }

        .skeleton-buttons {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 2rem;
        }

        .skeleton-button {
            flex: 1;
            height: 48px;
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            border-radius: var(--radius-md);
        }

        .skeleton-button-small {
            flex: 0;
            width: 48px;
        }

        .skeleton-line {
            width: 100%;
            height: 14px;
            margin-bottom: 0.75rem;
        }

        .skeleton-line-short {
            width: 70%;
        }

        /* List Item Skeleton */
        .skeleton-list {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .skeleton-list-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
        }

        .skeleton-list-icon {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-sm);
            background: linear-gradient(
                90deg,
                var(--bg-tertiary) 0px,
                var(--bg-elevated) 40px,
                var(--bg-tertiary) 80px
            );
            background-size: 200px 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }

        .skeleton-list-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .skeleton-list-title {
            width: 70%;
            height: 16px;
        }

        .skeleton-list-subtitle {
            width: 50%;
            height: 12px;
        }

        /* Responsive */
        @media (min-width: 480px) {
            .skeleton-grid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            }
        }

        @media (min-width: 768px) {
            .skeleton-grid {
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 1.5rem;
            }
        }
    `;

    document.head.appendChild(style);
}

// Auto-initialize styles
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkeletonStyles);
} else {
    initSkeletonStyles();
}
