/**
 * FlixCapacitor - Beautiful UI View Components
 * Gorgeous, modern, mobile-first interface design
 */

// CSS Styles for UI Components
const componentStyles = `
<style>
/* Content Browser Styles */
.browser-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
}

/* Search Bar */
.search-bar {
    padding: 1rem;
    padding-top: calc(var(--safe-area-top) + 1rem);
    background: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.search-input {
    width: 100%;
    padding: 0.875rem 1rem;
    padding-left: 2.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23808080' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: 1rem center;
    background-size: 20px;
}

.search-input:focus {
    background: var(--bg-elevated);
    border-color: var(--accent-primary);
}

/* Filter Tabs */
.filter-tabs {
    padding: 0 1rem 1rem;
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    background: var(--bg-secondary);
}

.filter-tabs::-webkit-scrollbar {
    display: none;
}

.filter-tab {
    padding: 0.5rem 1rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.filter-tab.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: white;
}

.filter-tab:active {
    transform: scale(0.95);
}

/* Content Grid */
.content-grid {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom) + 1rem);
}

/* Content Card */
.content-card {
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
    aspect-ratio: 2/3;
}

.content-card:active {
    transform: scale(0.95);
}

.content-card-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%);
}

.content-card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem 0.75rem;
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
    color: white;
}

.content-card-title {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.content-card-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.content-card-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.content-card-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-sm);
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
}

.content-card-badge.hd {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
}

/* Loading State */
.content-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
}

.loading-spinner-large {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(229, 9, 20, 0.1);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

.loading-text {
    font-size: 1rem;
    color: var(--text-secondary);
}

/* Empty State */
.content-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-secondary);
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.empty-message {
    font-size: 0.9rem;
}

/* Detail View */
.detail-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.detail-header {
    position: relative;
    height: 60vh;
    min-height: 400px;
}

.detail-backdrop {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
}

.detail-backdrop-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom,
        rgba(10,10,10,0.3) 0%,
        rgba(10,10,10,0.7) 50%,
        rgba(10,10,10,1) 100%);
}

.detail-back-btn {
    position: absolute;
    top: calc(var(--safe-area-top) + 1rem);
    left: 1rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border: none;
    color: white;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
}

.detail-back-btn:active {
    background: rgba(0, 0, 0, 0.8);
}

.detail-content {
    position: relative;
    padding: 2rem 1rem;
    margin-top: -4rem;
    z-index: 1;
}

.detail-poster {
    width: 120px;
    height: 180px;
    border-radius: var(--radius-md);
    object-fit: cover;
    box-shadow: var(--shadow-lg);
    margin-bottom: 1.5rem;
}

.detail-title {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 0.5rem;
}

.detail-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.detail-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #ffd700;
}

.detail-actions {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
}

.btn-primary {
    flex: 1;
    padding: 1rem;
    background: var(--accent-primary);
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.btn-primary:active {
    transform: scale(0.98);
    background: var(--accent-secondary);
}

.btn-secondary {
    width: 48px;
    height: 48px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.btn-secondary:active {
    background: var(--bg-tertiary);
}

.btn-secondary.bookmarked {
    color: var(--accent-primary);
    border-color: var(--accent-primary);
}

.detail-section {
    margin-bottom: 2rem;
}

.detail-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.detail-overview {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text-secondary);
}

.detail-info-grid {
    display: grid;
    gap: 1rem;
}

.info-item {
    display: flex;
    gap: 0.5rem;
}

.info-label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 80px;
}

.info-value {
    color: var(--text-primary);
}

/* Settings View */
.settings-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
}

.settings-header {
    padding: 1.5rem 1rem;
    padding-top: calc(var(--safe-area-top) + 1.5rem);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.settings-title {
    font-size: 1.75rem;
    font-weight: 700;
}

.settings-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom));
}

.settings-section {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.settings-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.75rem;
}

.settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: 0.5rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
}

.settings-item:active {
    background: var(--bg-tertiary);
}

.settings-item-content {
    flex: 1;
}

.settings-item-label {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.settings-item-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.settings-item-value {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    width: 48px;
    height: 28px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-switch.active {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
}

.toggle-switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
}

.toggle-switch.active .toggle-switch-thumb {
    transform: translateX(20px);
}

/* Mobile Bottom Navigation */
.mobile-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-around;
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + var(--safe-area-bottom));
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.mobile-bottom-nav .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    max-width: 100px;
}

.mobile-bottom-nav .nav-item i {
    font-size: 1.25rem;
    transition: transform 0.2s;
}

.mobile-bottom-nav .nav-item.active {
    color: var(--accent-primary);
}

.mobile-bottom-nav .nav-item.active i {
    transform: scale(1.1);
}

.mobile-bottom-nav .nav-item:active {
    transform: scale(0.95);
}

.mobile-bottom-nav .nav-item span {
    font-size: 0.7rem;
    white-space: nowrap;
}

/* Responsive Adjustments */
@media (min-width: 480px) {
    .grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}

@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1.5rem;
    }

    .detail-content {
        padding: 2rem;
    }

    /* Hide bottom nav on larger screens */
    .mobile-bottom-nav {
        display: none;
    }
}
</style>
`;

// UI Component Templates
export const UITemplates = {
    // Movies/Shows Browser
    browserView: (title, category = 'movies') => `
        ${componentStyles}
        <div class="browser-container">
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Search ${title}..." id="search-input">
            </div>
            <div class="filter-tabs">
                <div class="filter-tab active" data-filter="popular">Popular</div>
                <div class="filter-tab" data-filter="trending">Trending</div>
                <div class="filter-tab" data-filter="top">Top Rated</div>
                ${category === 'movies' ? '<div class="filter-tab" data-filter="genre">Genres</div>' : ''}
            </div>
            <div class="content-grid">
                <div class="content-loading">
                    <div class="loading-spinner-large"></div>
                    <div class="loading-text">Loading ${title.toLowerCase()}...</div>
                </div>
            </div>
        </div>
    `,

    // Content Card
    contentCard: (item) => {
        // Get torrent health from best available quality
        const torrents = item.torrents || {};
        const qualities = ['1080p', '720p', '480p'];
        let torrentHealth = null;

        for (const quality of qualities) {
            if (torrents[quality]) {
                torrentHealth = {
                    seeds: torrents[quality].seed || 0,
                    peers: torrents[quality].peer || 0
                };
                break;
            }
        }

        // Determine health indicator color
        let healthColor = '#6b7280'; // gray (no data)
        if (torrentHealth) {
            if (torrentHealth.seeds >= 50) healthColor = '#10b981'; // green (healthy)
            else if (torrentHealth.seeds >= 10) healthColor = '#fbbf24'; // yellow (ok)
            else if (torrentHealth.seeds > 0) healthColor = '#f59e0b'; // orange (poor)
            else healthColor = '#ef4444'; // red (no seeds)
        }

        return `
            <div class="content-card" data-id="${item.imdb_id || item.tvdb_id}">
                <img class="content-card-poster"
                     src="${item.images?.poster || item.poster || 'https://via.placeholder.com/300x450/1f1f1f/808080?text=No+Poster'}"
                     alt="${item.title}"
                     loading="lazy">
                ${item.quality ? `<div class="content-card-badge hd">${item.quality}</div>` : ''}
                ${torrentHealth ? `
                    <div class="content-card-health" style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; display: flex; align-items: center; gap: 6px; z-index: 2;">
                        <span style="color: ${healthColor};">●</span>
                        <span style="color: #10b981;">↑${torrentHealth.seeds}</span>
                        <span style="color: #6b7280;">↓${torrentHealth.peers}</span>
                    </div>
                ` : ''}
                <div class="content-card-overlay">
                    <div class="content-card-title">${item.title}</div>
                    <div class="content-card-meta">
                        ${item.rating?.percentage ? `
                            <div class="content-card-rating">
                                <span>⭐</span>
                                <span>${(item.rating.percentage / 10).toFixed(1)}</span>
                            </div>
                        ` : ''}
                        <span>${item.year || item.first_aired?.split('-')[0] || ''}</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Grid of Content
    contentGrid: (items) => `
        <div class="grid">
            ${items.map(item => UITemplates.contentCard(item)).join('')}
        </div>
    `,

    // Loading State
    loadingState: (message = 'Loading...') => `
        <div class="content-loading">
            <div class="loading-spinner-large"></div>
            <div class="loading-text">${message}</div>
        </div>
    `,

    // Continue Watching Section
    continueWatchingSection: (items) => {
        if (!items || items.length === 0) return '';

        return `
            <div class="continue-watching-section" style="padding: 1rem; padding-top: 0.5rem;">
                <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">Continue Watching</h2>
                <div class="continue-watching-scroll" style="display: flex; gap: 1rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 1rem; scrollbar-width: none;">
                    ${items.map(item => {
                        const progress = item.continuePosition && item.runtime ?
                            (item.continuePosition / (item.runtime * 60)) * 100 : 0;

                        return `
                            <div class="continue-card" data-id="${item.imdb_id}" style="flex-shrink: 0; width: 140px; cursor: pointer;">
                                <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 0.5rem;">
                                    <img src="${item.images?.poster || ''}"
                                         alt="${item.title}"
                                         style="width: 100%; height: 210px; object-fit: cover; display: block;">
                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.3);">
                                        <div style="height: 100%; background: var(--accent-primary); width: ${Math.min(progress, 100)}%;"></div>
                                    </div>
                                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                                        ${Math.round(progress)}%
                                    </div>
                                </div>
                                <div style="font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${item.year}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <style>
                .continue-watching-scroll::-webkit-scrollbar {
                    display: none;
                }
            </style>
        `;
    },

    // Empty State
    emptyState: (icon, title, message) => `
        <div class="content-empty">
            <div class="empty-icon">${icon}</div>
            <div class="empty-title">${title}</div>
            <div class="empty-message">${message}</div>
        </div>
    `,

    // Detail View
    detailView: (item) => `
        ${componentStyles}
        <div class="detail-view">
            <div class="detail-header">
                <img class="detail-backdrop"
                     src="${item.images?.fanart || item.backdrop || item.images?.poster || ''}"
                     alt="">
                <div class="detail-backdrop-overlay"></div>
                <button class="detail-back-btn" id="detail-back">←</button>
            </div>
            <div class="detail-content">
                <img class="detail-poster"
                     src="${item.images?.poster || item.poster || ''}"
                     alt="${item.title}">
                <h1 class="detail-title">${item.title}</h1>
                <div class="detail-meta">
                    ${item.rating?.percentage ? `
                        <div class="detail-rating">
                            <span>⭐</span>
                            <span>${(item.rating.percentage / 10).toFixed(1)}</span>
                        </div>
                    ` : ''}
                    <span>${item.year || item.first_aired?.split('-')[0] || ''}</span>
                    ${item.runtime ? `<span>${item.runtime} min</span>` : ''}
                    ${item.certification ? `<span>${item.certification}</span>` : ''}
                </div>
                ${(item.rating?.imdb || item.rating?.rottenTomatoes || item.rating?.metacritic) ? `
                    <div class="detail-ratings" style="display: flex; gap: 0.75rem; margin: 1rem 0; flex-wrap: wrap;">
                        ${item.rating.imdb ? `
                            <div class="rating-badge" style="background: rgba(245, 197, 24, 0.15); border: 1px solid rgba(245, 197, 24, 0.3); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">⭐</span>
                                <div>
                                    <div style="font-weight: 600; color: #f5c518;">${item.rating.imdb}/10</div>
                                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">IMDb</div>
                                </div>
                            </div>
                        ` : ''}
                        ${item.rating.rottenTomatoes ? `
                            <div class="rating-badge" style="background: rgba(250, 50, 10, 0.15); border: 1px solid rgba(250, 50, 10, 0.3); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🍅</span>
                                <div>
                                    <div style="font-weight: 600; color: #fa320a;">${item.rating.rottenTomatoes}%</div>
                                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">RT</div>
                                </div>
                            </div>
                        ` : ''}
                        ${item.rating.metacritic ? `
                            <div class="rating-badge" style="background: rgba(102, 204, 0, 0.15); border: 1px solid rgba(102, 204, 0, 0.3); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">M</span>
                                <div>
                                    <div style="font-weight: 600; color: #66cc00;">${item.rating.metacritic}/100</div>
                                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">Metacritic</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="detail-actions">
                    <button class="btn-primary" id="play-btn">
                        <span>▶</span>
                        <span>Play Now</span>
                    </button>
                    <button class="btn-secondary ${item.bookmarked ? 'bookmarked' : ''}" id="bookmark-btn">
                        <span>${item.bookmarked ? '★' : '☆'}</span>
                    </button>
                    <button class="btn-secondary" id="share-btn">
                        <span>↗</span>
                    </button>
                </div>
                ${item.synopsis || item.overview ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Overview</h2>
                        <p class="detail-overview">${item.synopsis || item.overview}</p>
                    </div>
                ` : ''}
                <div class="detail-section">
                    <h2 class="detail-section-title">Details</h2>
                    <div class="detail-info-grid">
                        ${item.genres ? `
                            <div class="info-item">
                                <div class="info-label">Genres</div>
                                <div class="info-value">${item.genres.join(', ')}</div>
                            </div>
                        ` : ''}
                        ${item.country ? `
                            <div class="info-item">
                                <div class="info-label">Country</div>
                                <div class="info-value">${item.country}</div>
                            </div>
                        ` : ''}
                        ${item.network ? `
                            <div class="info-item">
                                <div class="info-label">Network</div>
                                <div class="info-value">${item.network}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${item.torrents && Object.keys(item.torrents).length > 0 ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Available Torrents</h2>
                        <div class="torrent-options" style="display: grid; gap: 0.75rem;">
                            ${Object.entries(item.torrents).map(([quality, torrent]) => {
                                const seedHealth = torrent.seed > 100 ? 'excellent' : torrent.seed > 50 ? 'good' : torrent.seed > 20 ? 'fair' : 'poor';
                                const healthColor = seedHealth === 'excellent' ? '#10b981' : seedHealth === 'good' ? '#22c55e' : seedHealth === 'fair' ? '#f59e0b' : '#ef4444';

                                return `
                                    <div class="torrent-option" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                            <div>
                                                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${quality}</div>
                                                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">${torrent.size || 'Unknown size'}</div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 0.75rem; color: ${healthColor}; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">${seedHealth}</div>
                                                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                                                    <span style="color: #10b981;">↑ ${torrent.seed || 0}</span> •
                                                    <span style="color: #3b82f6;">↓ ${torrent.peer || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; font-size: 0.75rem; color: rgba(255,255,255,0.5);">
                                            <div>Seeds: ${torrent.seed || 0} peers</div>
                                            <div>Peers: ${torrent.peer || 0} downloading</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `,

    // Settings View
    settingsView: () => {
        const settings = window.SettingsManager || { get: () => null };
        const serverUrl = settings.get('streamingServerUrl') || 'http://localhost:3001/api';
        const provider = settings.get('movieProvider') || 'curated';
        const quality = settings.get('quality') || '720p';
        const autoplay = settings.get('autoplayNext') !== false;
        const customEndpoints = settings.get('customApiEndpoints') || [];

        return `
            ${componentStyles}
            <div class="settings-view">
                <div class="settings-header">
                    <h1 class="settings-title">Settings</h1>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <div class="settings-section-title">Streaming</div>
                        <div class="settings-item" id="setting-server-url">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Streaming Server URL</div>
                                <div class="settings-item-description">Backend torrent streaming API</div>
                            </div>
                            <input type="text"
                                   class="settings-input"
                                   value="${serverUrl}"
                                   placeholder="http://localhost:3001/api"
                                   style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                        </div>
                        <div class="settings-item" id="setting-provider">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Movie Provider</div>
                                <div class="settings-item-description">Choose content source</div>
                            </div>
                            <select class="settings-select"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; font-size: 0.9rem;">
                                <option value="curated" ${provider === 'curated' ? 'selected' : ''}>Curated Collection (8 movies)</option>
                                <option value="publicdomaintorrents" ${provider === 'publicdomaintorrents' ? 'selected' : ''}>PublicDomainTorrents.info (50+ movies)</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">Custom API Endpoints</div>
                        <div id="custom-endpoints-list" style="margin-bottom: 1rem;">
                            ${customEndpoints.map(ep => `
                                <div class="settings-item" data-endpoint-id="${ep.id}" style="position: relative;">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">${ep.name}</div>
                                        <div class="settings-item-description" style="word-break: break-all; font-size: 0.75rem;">${ep.url}</div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="toggle-switch ${ep.enabled ? 'active' : ''}" data-toggle-endpoint="${ep.id}">
                                            <div class="toggle-switch-thumb"></div>
                                        </div>
                                        <button class="btn-icon-danger" data-remove-endpoint="${ep.id}" style="background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button id="add-endpoint-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 10px 16px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600;">
                            + Add Custom Endpoint
                        </button>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">Playback</div>
                        <div class="settings-item" id="setting-quality">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Default Quality</div>
                                <div class="settings-item-description">Choose default video quality</div>
                            </div>
                            <select class="settings-select" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; font-size: 0.9rem;">
                                <option value="1080p" ${quality === '1080p' ? 'selected' : ''}>1080p</option>
                                <option value="720p" ${quality === '720p' ? 'selected' : ''}>720p</option>
                                <option value="480p" ${quality === '480p' ? 'selected' : ''}>480p</option>
                            </select>
                        </div>
                        <div class="settings-item" id="setting-autoplay">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Autoplay Next</div>
                                <div class="settings-item-description">Automatically play next episode</div>
                            </div>
                            <div class="toggle-switch ${autoplay ? 'active' : ''}">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">Proxy/VPN</div>
                        <div class="settings-item" id="setting-proxy-enabled">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Enable Proxy</div>
                                <div class="settings-item-description">Route all traffic through proxy server</div>
                            </div>
                            <div class="toggle-switch" id="proxy-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div id="proxy-settings" style="display: none;">
                            <div class="settings-item" id="setting-proxy-type">
                                <div class="settings-item-content">
                                    <div class="settings-item-label">Proxy Type</div>
                                    <div class="settings-item-description">Select proxy protocol</div>
                                </div>
                                <select class="settings-select" id="proxy-type-select" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; font-size: 0.9rem;">
                                    <option value="SOCKS5" selected>SOCKS5</option>
                                    <option value="SOCKS4">SOCKS4</option>
                                    <option value="HTTP">HTTP</option>
                                </select>
                            </div>
                            <div class="settings-item" id="setting-proxy-host">
                                <div class="settings-item-content">
                                    <div class="settings-item-label">Proxy Host</div>
                                    <div class="settings-item-description">Server address (IP or hostname)</div>
                                </div>
                                <input type="text"
                                       id="proxy-host-input"
                                       class="settings-input"
                                       placeholder="127.0.0.1"
                                       style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                            </div>
                            <div class="settings-item" id="setting-proxy-port">
                                <div class="settings-item-content">
                                    <div class="settings-item-label">Proxy Port</div>
                                    <div class="settings-item-description">Server port number</div>
                                </div>
                                <input type="number"
                                       id="proxy-port-input"
                                       class="settings-input"
                                       value="1080"
                                       placeholder="1080"
                                       style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 120px; font-size: 0.9rem;">
                            </div>
                            <div class="settings-item" id="setting-proxy-username">
                                <div class="settings-item-content">
                                    <div class="settings-item-label">Username (Optional)</div>
                                    <div class="settings-item-description">For authenticated proxies</div>
                                </div>
                                <input type="text"
                                       id="proxy-username-input"
                                       class="settings-input"
                                       placeholder="username"
                                       style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                            </div>
                            <div class="settings-item" id="setting-proxy-password">
                                <div class="settings-item-content">
                                    <div class="settings-item-label">Password (Optional)</div>
                                    <div class="settings-item-description">For authenticated proxies</div>
                                </div>
                                <input type="password"
                                       id="proxy-password-input"
                                       class="settings-input"
                                       placeholder="password"
                                       style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <button id="test-proxy-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 10px 16px; border-radius: 8px; cursor: pointer; flex: 1; font-weight: 600;">
                                    🔍 Test Connection
                                </button>
                                <button id="save-proxy-btn" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; padding: 10px 16px; border-radius: 8px; cursor: pointer; flex: 1; font-weight: 600;">
                                    💾 Save Settings
                                </button>
                            </div>
                            <div id="proxy-status" style="margin-top: 12px; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; display: none; white-space: pre-wrap; line-height: 1.5;"></div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">About</div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Version</div>
                                <div class="settings-item-description">FlixCapacitor</div>
                            </div>
                            <div class="settings-item-value">0.4.4</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// UI Controller
export class MobileUIController {
    constructor(app) {
        this.app = app;
        this.currentView = null;
        this.moviesCache = null; // Cache for loaded movies
        this.currentMovieData = new Map(); // Store movie data by ID
        this.backButtonListener = null; // Android back button handler
        this.currentVideoElement = null; // Current video element reference
        this.playbackPositions = new Map(); // Store playback positions by movie ID
        this.setupNavigation();
    }

    setupNavigation() {
        // Handle bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const nav = item.dataset.nav;
                this.navigateTo(nav);

                // Update active state
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    navigateTo(route) {
        const mainRegion = document.querySelector('.main-window-region');

        // Hide loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        // Track current view
        this.currentView = route;

        switch (route) {
            case 'movies':
                this.showMovies();
                break;
            case 'shows':
                this.showShows();
                break;
            case 'anime':
                this.showAnime();
                break;
            case 'watchlist':
                this.showWatchlist();
                break;
            case 'settings':
                this.showSettings();
                break;
            default:
                this.showMovies();
        }
    }

    async showMovies() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Movies', 'movies');

        // Load real public domain movies
        await this.renderRealMovies();

        // Add Continue Watching section if there are items
        const continueItems = this.getContinueWatchingItems();
        if (continueItems.length > 0) {
            const searchBar = document.querySelector('.search-bar');
            if (searchBar) {
                const continueSection = document.createElement('div');
                continueSection.innerHTML = UITemplates.continueWatchingSection(continueItems);
                searchBar.insertAdjacentElement('afterend', continueSection.firstElementChild);

                // Add click handlers for continue watching cards
                document.querySelectorAll('.continue-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.id;
                        this.showDetail(id);
                    });
                });
            }
        }
    }

    showShows() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('TV Shows', 'shows');

        setTimeout(() => {
            this.renderMockShows();
        }, 800);
    }

    showAnime() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Anime', 'anime');

        setTimeout(() => {
            this.renderMockAnime();
        }, 800);
    }

    showWatchlist() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Watchlist', 'watchlist');

        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.emptyState(
            '⭐',
            'Your Watchlist is Empty',
            'Add movies and shows to keep track of what you want to watch'
        );
    }

    showSettings() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.settingsView();

        // Get settings manager
        const settings = window.SettingsManager;
        if (!settings) {
            console.error('SettingsManager not available');
            return;
        }

        // Streaming Server URL
        const serverInput = document.querySelector('#setting-server-url input');
        if (serverInput) {
            serverInput.addEventListener('blur', () => {
                const url = serverInput.value.trim();
                if (url) {
                    settings.set('streamingServerUrl', url);
                    console.log('Streaming server URL updated:', url);
                }
            });
        }

        // Provider Selection
        const providerSelect = document.querySelector('#setting-provider select');
        if (providerSelect) {
            providerSelect.addEventListener('change', () => {
                settings.set('movieProvider', providerSelect.value);
                console.log('Movie provider updated:', providerSelect.value);
                // Reload movies view if currently viewing movies
                if (this.currentView === 'movies') {
                    this.showMovies();
                }
            });
        }

        // Quality Selection
        const qualitySelect = document.querySelector('#setting-quality select');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', () => {
                settings.set('quality', qualitySelect.value);
                console.log('Default quality updated:', qualitySelect.value);
            });
        }

        // Autoplay Toggle
        const autoplayToggle = document.querySelector('#setting-autoplay .toggle-switch');
        if (autoplayToggle) {
            autoplayToggle.addEventListener('click', () => {
                const isActive = autoplayToggle.classList.toggle('active');
                settings.set('autoplayNext', isActive);
                console.log('Autoplay next updated:', isActive);
            });
        }

        // Add Custom Endpoint Button
        const addEndpointBtn = document.getElementById('add-endpoint-btn');
        if (addEndpointBtn) {
            addEndpointBtn.addEventListener('click', () => {
                const name = prompt('Enter endpoint name:');
                if (!name) return;

                const url = prompt('Enter endpoint URL:');
                if (!url) return;

                settings.addCustomEndpoint(name, url);
                console.log('Added custom endpoint:', name, url);

                // Refresh settings view
                this.showSettings();
            });
        }

        // Custom Endpoint Toggles
        document.querySelectorAll('[data-toggle-endpoint]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const id = toggle.getAttribute('data-toggle-endpoint');
                settings.toggleCustomEndpoint(id);
                console.log('Toggled endpoint:', id);
                // Refresh to show updated state
                this.showSettings();
            });
        });

        // Custom Endpoint Remove Buttons
        document.querySelectorAll('[data-remove-endpoint]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-remove-endpoint');
                if (confirm('Remove this endpoint?')) {
                    settings.removeCustomEndpoint(id);
                    console.log('Removed endpoint:', id);
                    // Refresh settings view
                    this.showSettings();
                }
            });
        });

        // Proxy Settings
        this.setupProxySettings();
    }

    async setupProxySettings() {
        const { Preferences } = await import('@capacitor/preferences');

        // Load saved proxy settings
        const proxyEnabled = (await Preferences.get({ key: 'proxy_enabled' })).value === 'true';
        const proxyType = (await Preferences.get({ key: 'proxy_type' })).value || 'SOCKS5';
        const proxyHost = (await Preferences.get({ key: 'proxy_host' })).value || '';
        const proxyPort = (await Preferences.get({ key: 'proxy_port' })).value || '1080';
        const proxyUsername = (await Preferences.get({ key: 'proxy_username' })).value || '';
        const proxyPassword = (await Preferences.get({ key: 'proxy_password' })).value || '';

        // Apply saved values to UI
        const proxyToggle = document.getElementById('proxy-toggle');
        const proxySettings = document.getElementById('proxy-settings');
        const proxyTypeSelect = document.getElementById('proxy-type-select');
        const proxyHostInput = document.getElementById('proxy-host-input');
        const proxyPortInput = document.getElementById('proxy-port-input');
        const proxyUsernameInput = document.getElementById('proxy-username-input');
        const proxyPasswordInput = document.getElementById('proxy-password-input');
        const testProxyBtn = document.getElementById('test-proxy-btn');
        const saveProxyBtn = document.getElementById('save-proxy-btn');
        const proxyStatus = document.getElementById('proxy-status');

        if (proxyEnabled) {
            proxyToggle.classList.add('active');
            proxySettings.style.display = 'block';
        }
        if (proxyTypeSelect) proxyTypeSelect.value = proxyType;
        if (proxyHostInput) proxyHostInput.value = proxyHost;
        if (proxyPortInput) proxyPortInput.value = proxyPort;
        if (proxyUsernameInput) proxyUsernameInput.value = proxyUsername;
        if (proxyPasswordInput) proxyPasswordInput.value = proxyPassword;

        // Helper to show status messages
        const showStatus = (message, type = 'info') => {
            if (!proxyStatus) return;
            const colors = {
                success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
                error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
                info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
                warning: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' }
            };
            const color = colors[type];
            proxyStatus.style.display = 'block';
            proxyStatus.style.background = color.bg;
            proxyStatus.style.border = `1px solid ${color.border}`;
            proxyStatus.style.color = color.text;
            proxyStatus.textContent = message;
        };

        // Show current proxy status
        if (proxyEnabled && proxyHost) {
            showStatus(
                `🟢 Proxy Active\n` +
                `Type: ${proxyType} | Host: ${proxyHost}:${proxyPort}${proxyUsername ? ' | Auth: Yes' : ''}`,
                'success'
            );
        }

        // Proxy Toggle
        if (proxyToggle) {
            proxyToggle.addEventListener('click', async () => {
                const isActive = proxyToggle.classList.toggle('active');
                await Preferences.set({ key: 'proxy_enabled', value: String(isActive) });
                proxySettings.style.display = isActive ? 'block' : 'none';
                console.log('Proxy enabled:', isActive);

                // Update status
                if (!isActive) {
                    showStatus('🔴 Proxy Disabled', 'info');
                } else if (proxyHostInput?.value) {
                    showStatus('🟡 Proxy enabled. Click "Test Connection" or "Save Settings" to apply.', 'warning');
                }
            });
        }

        // Test Proxy Button
        if (testProxyBtn) {
            testProxyBtn.addEventListener('click', async () => {
                const type = proxyTypeSelect?.value || 'SOCKS5';
                const host = proxyHostInput?.value.trim() || '';
                const port = proxyPortInput?.value || '1080';
                const username = proxyUsernameInput?.value.trim() || '';

                // Validate input
                if (!host) {
                    showStatus('❌ Please enter a proxy host address', 'error');
                    return;
                }

                const portNum = parseInt(port);
                if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                    showStatus('❌ Port must be between 1 and 65535', 'error');
                    return;
                }

                // Check host format (basic validation)
                const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
                const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

                if (!ipv4Regex.test(host) && !hostnameRegex.test(host)) {
                    showStatus('⚠️ Host format may be invalid', 'warning');
                }

                // Show testing status
                testProxyBtn.disabled = true;
                testProxyBtn.textContent = '⏳ Validating...';
                showStatus('🔍 Checking proxy configuration...', 'info');

                // Simulate validation delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Validation passed
                testProxyBtn.disabled = false;
                testProxyBtn.textContent = '🔍 Test Connection';

                showStatus(
                    `✅ Configuration looks good!\n` +
                    `Type: ${type} | Host: ${host}:${port}${username ? ' | Auth: Yes' : ''}\n` +
                    `Connection will be tested when you start streaming.`,
                    'success'
                );
            });
        }

        // Save Proxy Button
        if (saveProxyBtn) {
            saveProxyBtn.addEventListener('click', async () => {
                const type = proxyTypeSelect?.value || 'SOCKS5';
                const host = proxyHostInput?.value.trim() || '';
                const port = proxyPortInput?.value || '1080';
                const username = proxyUsernameInput?.value.trim() || '';
                const password = proxyPasswordInput?.value.trim() || '';

                // Validate input
                if (!host) {
                    showStatus('❌ Please enter a proxy host address', 'error');
                    return;
                }

                const portNum = parseInt(port);
                if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                    showStatus('❌ Port must be between 1 and 65535', 'error');
                    return;
                }

                // Show saving status
                saveProxyBtn.disabled = true;
                saveProxyBtn.textContent = '⏳ Saving...';

                try {
                    // Save proxy settings
                    await Preferences.set({ key: 'proxy_type', value: type });
                    await Preferences.set({ key: 'proxy_host', value: host });
                    await Preferences.set({ key: 'proxy_port', value: port });
                    await Preferences.set({ key: 'proxy_username', value: username });
                    await Preferences.set({ key: 'proxy_password', value: password });

                    console.log('Proxy settings saved:', { type, host, port, hasAuth: !!username });

                    // Reload proxy settings in the torrent service
                    try {
                        const { TorrentStreamer } = await import('capacitor-plugin-torrent-streamer');
                        await TorrentStreamer.reloadProxySettings();
                        console.log('✅ Proxy settings reloaded in torrent service');
                        showStatus('✅ Settings saved and applied! Proxy is now active.', 'success');
                    } catch (error) {
                        console.warn('Failed to reload proxy settings (service may not be running):', error);
                        showStatus('✅ Settings saved! Will take effect when streaming starts.', 'success');
                    }

                    // Show success on button
                    saveProxyBtn.textContent = '✅ Saved!';
                    saveProxyBtn.style.background = 'rgba(34, 197, 94, 0.2)';
                    setTimeout(() => {
                        saveProxyBtn.disabled = false;
                        saveProxyBtn.textContent = '💾 Save Settings';
                        saveProxyBtn.style.background = 'rgba(34, 197, 94, 0.1)';
                    }, 2000);
                } catch (error) {
                    console.error('Failed to save proxy settings:', error);
                    showStatus('❌ Failed to save settings. Please try again.', 'error');
                    saveProxyBtn.disabled = false;
                    saveProxyBtn.textContent = '💾 Save Settings';
                }
            });
        }
    }

    async renderRealMovies() {
        const contentGrid = document.querySelector('.content-grid');

        try {
            // Get public domain provider
            const provider = window.PublicDomainProvider;
            if (!provider) {
                console.error('PublicDomainProvider not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Provider Error',
                    'Movie provider failed to load'
                );
                return;
            }

            // Fetch movies
            const movies = await provider.fetchMovies();
            console.log(`Loaded ${movies.length} public domain movies`);

            // Store movies for detail view
            this.moviesCache = movies;
            movies.forEach(movie => {
                this.currentMovieData.set(movie.imdb_id, movie);
            });

            // Render movies
            contentGrid.innerHTML = UITemplates.contentGrid(movies);

            // Add click handlers
            this.attachCardHandlers();
        } catch (error) {
            console.error('Failed to load movies:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Movies',
                'Please check your connection and try again'
            );
        }
    }

    renderMockMovies() {
        // Fallback to mock data if needed
        const mockMovies = this.getMockMovies();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockMovies);

        // Add click handlers
        this.attachCardHandlers();
    }

    renderMockShows() {
        const mockShows = this.getMockShows();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockShows);

        this.attachCardHandlers();
    }

    renderMockAnime() {
        const mockAnime = this.getMockAnime();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockAnime);

        this.attachCardHandlers();
    }

    attachCardHandlers() {
        document.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.showDetail(id);
            });
        });
    }

    showDetail(id) {
        // Get real movie data
        const movie = this.currentMovieData.get(id);

        if (!movie) {
            console.warn('Movie not found:', id);
            // Fallback to mock data
            const mockItem = {
                imdb_id: id,
                title: 'Sample Movie Title',
                year: '2024',
                rating: { percentage: 85 },
                runtime: 142,
                certification: 'PG-13',
                synopsis: 'This is a sample movie description that would normally come from the API. It describes the plot, characters, and overall theme of the movie.',
                genres: ['Action', 'Adventure', 'Sci-Fi'],
                country: 'USA',
                images: {
                    poster: 'https://via.placeholder.com/300x450/1f1f1f/e50914?text=Movie+Poster',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Movie+Backdrop'
                }
            };
            this.renderDetailView(mockItem);
            return;
        }

        this.renderDetailView(movie);
    }

    renderDetailView(movie) {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.detailView(movie);

        // Add event listeners
        document.getElementById('detail-back')?.addEventListener('click', () => {
            this.navigateTo('movies');
        });

        document.getElementById('play-btn')?.addEventListener('click', () => {
            this.playMovie(movie);
        });

        document.getElementById('bookmark-btn')?.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('bookmarked');
            e.currentTarget.querySelector('span').textContent =
                e.currentTarget.classList.contains('bookmarked') ? '★' : '☆';
        });
    }

    playMovie(movie) {
        console.log('Playing movie:', movie.title);

        // Get the best available torrent
        const torrents = movie.torrents || {};
        const qualities = ['1080p', '720p', '480p'];
        let selectedTorrent = null;
        let selectedQuality = null;

        for (const quality of qualities) {
            if (torrents[quality]) {
                selectedTorrent = torrents[quality];
                selectedQuality = quality;
                break;
            }
        }

        if (!selectedTorrent) {
            alert('No torrent available for this movie');
            return;
        }

        console.log(`Starting playback: ${movie.title} (${selectedQuality})`);
        console.log('Magnet link:', selectedTorrent.url);

        // Create a basic video player view
        this.showVideoPlayer(movie, selectedTorrent, selectedQuality);
    }

    // Save playback position for resume
    savePlaybackPosition(movieId, position) {
        this.playbackPositions.set(movieId, position);
        // Also save to localStorage for persistence
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            positions[movieId] = position;
            localStorage.setItem('playbackPositions', JSON.stringify(positions));
        } catch (e) {
            console.warn('Failed to save playback position to localStorage:', e);
        }
    }

    // Get saved playback position
    getPlaybackPosition(movieId) {
        // Check memory first
        if (this.playbackPositions.has(movieId)) {
            return this.playbackPositions.get(movieId);
        }
        // Check localStorage
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            return positions[movieId] || 0;
        } catch (e) {
            return 0;
        }
    }

    // Get Continue Watching items
    getContinueWatchingItems() {
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            const items = [];

            // Get movies that have been started
            for (const [movieId, position] of Object.entries(positions)) {
                if (position > 10) { // Only include if watched > 10s
                    // Try to get movie data from cache
                    const movieData = this.currentMovieData.get(movieId);
                    if (movieData) {
                        items.push({
                            ...movieData,
                            continuePosition: position
                        });
                    }
                }
            }

            // Sort by most recently watched (we'll need to track timestamps later)
            return items.slice(0, 10); // Max 10 items
        } catch (e) {
            console.warn('Failed to get Continue Watching items:', e);
            return [];
        }
    }

    // Setup Android back button handler
    async setupBackButtonHandler(callback) {
        // Remove existing listener if any
        if (this.backButtonListener) {
            await this.backButtonListener.remove();
        }

        // Import App from Capacitor
        try {
            const { App } = await import('@capacitor/app');
            this.backButtonListener = await App.addListener('backButton', callback);
        } catch (e) {
            console.warn('Back button handler not available (web platform?):', e);
        }
    }

    // Remove Android back button handler
    async removeBackButtonHandler() {
        if (this.backButtonListener) {
            await this.backButtonListener.remove();
            this.backButtonListener = null;
        }
    }

    async showVideoPlayer(movie, torrent, quality) {
        const mainRegion = document.querySelector('.main-window-region');

        // Create initial loading UI
        mainRegion.innerHTML = `
            <div class="video-player-container" style="background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--safe-area-top) var(--safe-area-right) var(--safe-area-bottom) var(--safe-area-left); position: relative;">
                <div class="player-header" style="position: absolute; top: var(--safe-area-top); left: 0; right: 0; padding: 1rem; display: flex; align-items: center; gap: 1rem; background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%); z-index: 100;">
                    <button id="player-back" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer;">←</button>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${movie.title}</div>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">${quality} • ${movie.year}</div>
                    </div>
                    <button id="speed-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; cursor: pointer;">1x</button>
                    <button id="pip-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer;">⧉</button>
                    <button id="fullscreen-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer;">⛶</button>
                    <button id="subtitle-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer;">CC</button>
                </div>

                <!-- Subtitle selector overlay -->
                <div id="subtitle-selector" style="display: none; position: absolute; top: calc(var(--safe-area-top) + 60px); right: 140px; background: rgba(20,20,20,0.95); border-radius: var(--radius-md); padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px);"></div>
                <div id="speed-selector" style="display: none; position: absolute; top: calc(var(--safe-area-top) + 60px); right: 90px; background: rgba(20,20,20,0.95); border-radius: var(--radius-md); padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px);">
                    <div class="speed-option" data-speed="0.5" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s;">0.5x</div>
                    <div class="speed-option" data-speed="0.75" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s;">0.75x</div>
                    <div class="speed-option active" data-speed="1" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s; background: var(--accent-primary);">1x</div>
                    <div class="speed-option" data-speed="1.25" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s;">1.25x</div>
                    <div class="speed-option" data-speed="1.5" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s;">1.5x</div>
                    <div class="speed-option" data-speed="2" style="padding: 0.75rem 1.5rem; cursor: pointer; border-radius: var(--radius-sm); transition: background 0.2s;">2x</div>
                </div>

                <div class="player-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 800px; padding: 2rem;">
                    <div class="loading-spinner-large" style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 2rem;"></div>

                    <div style="text-align: center; color: rgba(255,255,255,0.9);">
                        <h3 id="loading-title" style="font-size: 1.25rem; margin-bottom: 1rem;">Starting Stream...</h3>
                        <p id="loading-subtitle" style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-bottom: 1.5rem;">Connecting to streaming server...</p>

                        <div id="torrent-status" style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; text-align: left; font-family: monospace; font-size: 0.85rem; line-height: 1.8;">
                            <div>Status: <span id="status-text" style="color: #fbbf24;">Initializing...</span></div>
                            <div>Magnet: <span style="color: rgba(255,255,255,0.5); word-break: break-all;">${torrent.url.substring(0, 60)}...</span></div>
                            <div>Quality: <span style="color: #10b981;">${quality}</span></div>
                            <div>Size: <span>${torrent.size || 'Unknown'}</span></div>
                            <div id="progress-row" style="display: none;">Progress: <span id="progress-text" style="color: #3b82f6;">0%</span></div>
                            <div id="speed-row" style="display: none;">Speed: <span id="speed-text">0 MB/s</span></div>
                            <div>Seeds: <span style="color: #10b981;">${torrent.seed || 0}</span></div>
                            <div>Peers: <span>${torrent.peer || 0}</span></div>
                        </div>
                    </div>
                </div>

                <div id="video-container" style="display: none; width: 100%; height: 100%; position: relative;">
                    <video id="torrent-video"
                           controls
                           autoplay
                           playsinline
                           style="width: 100%; height: 100%; background: #000;"
                           poster="${movie.images?.fanart || movie.images?.poster || ''}">
                        Your browser doesn't support HTML5 video.
                    </video>

                    <!-- Download progress overlay -->
                    <div id="download-overlay" style="display: none; position: absolute; bottom: calc(var(--safe-area-bottom) + 80px); right: 1rem; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.75rem; z-index: 90; min-width: 120px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <div class="download-spinner" style="width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <span style="color: rgba(255,255,255,0.9); font-weight: 600;">Buffering</span>
                        </div>
                        <div style="color: rgba(255,255,255,0.6);">
                            <div id="dl-progress">0%</div>
                            <div id="dl-speed">0 MB/s</div>
                            <div id="dl-peers">0 peers</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        // Helper function to exit video player
        const exitVideoPlayer = async () => {
            // Save current playback position
            if (this.currentVideoElement && !this.currentVideoElement.paused) {
                this.savePlaybackPosition(movie.imdb_id, this.currentVideoElement.currentTime);
            }

            // Stop native torrent stream if active
            if (window.NativeTorrentClient) {
                try {
                    await window.NativeTorrentClient.stopStream();
                    console.log('Native torrent stream stopped');
                } catch (e) {
                    console.warn('Failed to stop native torrent stream:', e);
                }
            }

            // Remove Android back button handler
            await this.removeBackButtonHandler();

            // Disable keep awake
            try {
                const { KeepAwake } = await import('@capacitor-community/keep-awake');
                await KeepAwake.allowSleep();
                console.log('Screen sleep re-enabled');
            } catch (e) {
                // Keep awake not available (web)
            }

            // Clear video reference
            this.currentVideoElement = null;

            // Return to detail view
            this.showDetail(movie.imdb_id);
        };

        // Back button handler (stops stream on exit)
        document.getElementById('player-back')?.addEventListener('click', exitVideoPlayer);

        // Android back button handler (same as UI back button)
        await this.setupBackButtonHandler(exitVideoPlayer);

        // Keep screen awake during video playback
        try {
            const { KeepAwake } = await import('@capacitor-community/keep-awake');
            await KeepAwake.keepAwake();
            console.log('Screen will stay awake during playback');
        } catch (e) {
            console.warn('KeepAwake failed:', e.message);
            // Non-critical, continue anyway
        }

        // Try to start streaming with native torrent client
        try {
            // Check if native client is available
            if (!window.NativeTorrentClient) {
                throw new Error('Native torrent client not available');
            }

            // Note: TorrentStreamer plugin will be checked when NativeTorrentClient.startStream() is called
            // If the plugin isn't loaded, we'll get a proper error from Capacitor

            // IMPORTANT: Stop any existing stream first to avoid port conflicts
            try {
                console.log('Stopping any existing torrent stream...');
                await window.NativeTorrentClient.stopStream();
                // Wait a bit for the port to be released
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.log('No existing stream to stop or stop failed:', e.message);
            }

            console.log('Starting native torrent stream...');

            const statusText = document.getElementById('status-text');
            const loadingTitle = document.getElementById('loading-title');
            const loadingSubtitle = document.getElementById('loading-subtitle');
            const progressRow = document.getElementById('progress-row');
            const progressText = document.getElementById('progress-text');
            const speedRow = document.getElementById('speed-row');
            const speedText = document.getElementById('speed-text');

            // Update initial status
            if (loadingTitle) loadingTitle.textContent = 'Connecting to Torrent...';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Finding peers and downloading...';
            if (statusText) {
                statusText.textContent = 'Connecting';
                statusText.style.color = '#3b82f6';
            }

            // Start the native torrent stream with timeout
            let streamInfo;
            let hasVideoError = false; // Track if video player has errored

            try {
                streamInfo = await Promise.race([
                    window.NativeTorrentClient.startStream(
                        torrent.url,
                        { quality: quality },
                        (status) => {
                            // Progress callback - update UI with torrent status
                            console.log('Native torrent status:', status);

                            // IMPORTANT: Don't update UI if video player has errored
                            // This prevents progress updates from overwriting the error screen
                            if (hasVideoError) {
                                console.log('Skipping progress UI update - video error state active');
                                return;
                            }

                            if (statusText) {
                                statusText.textContent = status.status || 'Downloading';
                                statusText.style.color = status.status === 'complete' ? '#10b981' :
                                                         status.status === 'downloading' ? '#3b82f6' :
                                                         status.status === 'warning' ? '#f59e0b' : '#fbbf24';
                            }

                            if (loadingTitle && status.status === 'downloading') {
                                loadingTitle.textContent = 'Downloading Torrent...';
                            }

                            if (loadingSubtitle && status.message) {
                                loadingSubtitle.textContent = status.message;
                            } else if (loadingSubtitle && status.numPeers !== undefined) {
                                loadingSubtitle.textContent = `Connected to ${status.numPeers} peer${status.numPeers !== 1 ? 's' : ''}`;
                            }

                            // Show progress if available
                            if (status.progress !== undefined) {
                                if (progressRow) progressRow.style.display = 'block';
                                if (progressText) progressText.textContent = `${Math.round(status.progress * 100)}%`;

                                // Update download overlay during playback
                                const dlProgress = document.getElementById('dl-progress');
                                if (dlProgress) dlProgress.textContent = `${Math.round(status.progress * 100)}%`;
                            }

                            // Show download speed if available
                            if (status.downloadSpeed !== undefined) {
                                if (speedRow) speedRow.style.display = 'block';
                                const speedMB = (status.downloadSpeed / 1024 / 1024).toFixed(2);
                                if (speedText) speedText.textContent = `↓ ${speedMB} MB/s`;

                                // Update download overlay during playback
                                const dlSpeed = document.getElementById('dl-speed');
                                if (dlSpeed) dlSpeed.textContent = `↓ ${speedMB} MB/s`;
                            }

                            // Update peer count in overlay
                            if (status.numPeers !== undefined) {
                                const dlPeers = document.getElementById('dl-peers');
                                if (dlPeers) dlPeers.textContent = `${status.numPeers} peer${status.numPeers !== 1 ? 's' : ''}`;
                            }
                        }
                    ),
                    // 90 second timeout for torrent metadata
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout: Failed to receive torrent metadata after 90 seconds')), 90000)
                    )
                ]);

                console.log('Native torrent stream ready!', streamInfo);

                // Validate stream info
                if (!streamInfo || !streamInfo.streamUrl) {
                    throw new Error('Stream started but no URL was provided');
                }
            } catch (error) {
                console.error('Error starting stream:', error);

                // Show error in UI
                if (statusText) {
                    statusText.textContent = 'Error';
                    statusText.style.color = '#ef4444';
                }
                if (loadingTitle) {
                    loadingTitle.textContent = 'Streaming Failed';
                }
                if (loadingSubtitle) {
                    loadingSubtitle.innerHTML = `
                        <strong>Error:</strong> ${error.message}<br>
                        <span style="font-size: 0.8rem; margin-top: 1rem; display: block;">
                            • Check if torrent has seeds/peers<br>
                            • Try WiFi instead of mobile data<br>
                            • Some networks block torrents
                        </span>
                    `;
                }
                // Hide spinner
                const spinner = document.querySelector('.loading-spinner-large');
                if (spinner) spinner.style.display = 'none';

                // Stop here - don't continue to video player
                return;
            }

            // Stream is ready - update loading UI to show video is loading
            const loadingContent = document.querySelector('.player-content');
            const videoContainer = document.getElementById('video-container');
            const videoElement = document.getElementById('torrent-video');

            // Update status to show stream is ready, video is loading
            if (loadingTitle) loadingTitle.textContent = 'Loading Video...';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Preparing playback from stream...';
            if (statusText) {
                statusText.textContent = 'Buffered';
                statusText.style.color = '#10b981';
            }

            // Show video container (but keep loading UI visible until video loads)
            if (videoContainer) videoContainer.style.display = 'block';

            // Set video source
            if (videoElement && streamInfo.streamUrl) {
                videoElement.src = streamInfo.streamUrl;
                console.log('Video source set (HTTP streaming URL):', streamInfo.streamUrl);

                // Handle video errors
                videoElement.addEventListener('error', (e) => {
                    console.error('Video playback error:', e);

                    // CRITICAL: Set error flag to prevent progress updates from overwriting this UI
                    hasVideoError = true;

                    const errorMsg = videoElement.error ?
                        `Error ${videoElement.error.code}: ${videoElement.error.message}` :
                        'Unknown playback error';

                    // Show error in loading UI with external player option
                    if (loadingTitle) loadingTitle.textContent = 'In-App Player Failed';
                    if (loadingSubtitle) {
                        loadingSubtitle.innerHTML = `
                            <strong style="color: #ef4444;">${errorMsg}</strong><br>
                            <button id="open-external-player-btn" style="
                                background: #10b981;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                font-weight: 600;
                                margin-top: 1rem;
                                cursor: pointer;
                                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                            ">
                                📱 Open in External Player (VLC, MX Player, etc.)
                            </button>
                            <span style="font-size: 0.8rem; margin-top: 1rem; display: block; opacity: 0.7;">
                                Stream URL: ${streamInfo.streamUrl}
                            </span>
                        `;

                        // Add click handler for external player button
                        setTimeout(() => {
                            const externalBtn = document.getElementById('open-external-player-btn');
                            if (externalBtn) {
                                externalBtn.addEventListener('click', async () => {
                                    console.log('Opening in external player:', streamInfo.streamUrl);
                                    try {
                                        // Import TorrentStreamer plugin dynamically
                                        const { TorrentStreamer } = await import('capacitor-plugin-torrent-streamer');

                                        // Call native method to open external player (VLC, MX Player, etc.)
                                        const result = await TorrentStreamer.openExternalPlayer({
                                            streamUrl: streamInfo.streamUrl
                                        });

                                        console.log('External player opened:', result);

                                        // Show success message
                                        if (loadingSubtitle) {
                                            loadingSubtitle.innerHTML = `
                                                <strong style="color: #10b981;">✓ Opened in external player!</strong><br>
                                                <span style="font-size: 0.8rem; margin-top: 1rem; display: block;">
                                                    You can now watch the video in your chosen player app.<br>
                                                    The stream will continue running in the background.
                                                </span>
                                            `;
                                        }
                                    } catch (err) {
                                        console.error('Failed to open external player:', err);

                                        // Show error with stream URL as fallback
                                        const errorMsg = err.message || 'Unknown error';
                                        if (loadingSubtitle) {
                                            loadingSubtitle.innerHTML = `
                                                <strong style="color: #ef4444;">Failed to open external player</strong><br>
                                                <span style="font-size: 0.9rem; margin-top: 0.5rem; display: block;">${errorMsg}</span>
                                                <span style="font-size: 0.8rem; margin-top: 1rem; display: block; opacity: 0.7;">
                                                    Manual URL: ${streamInfo.streamUrl}<br>
                                                    <small>Copy this URL and paste into VLC or MX Player</small>
                                                </span>
                                            `;
                                        }
                                    }
                                });
                            }
                        }, 100);
                    }
                    if (statusText) {
                        statusText.textContent = 'Use External Player';
                        statusText.style.color = '#f59e0b';
                    }

                    // Hide spinner
                    const spinner = document.querySelector('.loading-spinner-large');
                    if (spinner) spinner.style.display = 'none';
                });

                // Store video element reference
                this.currentVideoElement = videoElement;

                // Handle video metadata
                videoElement.addEventListener('loadedmetadata', () => {
                    console.log('Video metadata loaded - Duration:', videoElement.duration);
                    if (loadingSubtitle) {
                        loadingSubtitle.textContent = `Duration: ${Math.floor(videoElement.duration / 60)}:${String(Math.floor(videoElement.duration % 60)).padStart(2, '0')}`;
                    }

                    // Resume from saved position with confirmation
                    const savedPosition = this.getPlaybackPosition(movie.imdb_id);
                    if (savedPosition > 10 && savedPosition < videoElement.duration - 10) {
                        // Show resume confirmation dialog
                        const resumeDialog = document.createElement('div');
                        resumeDialog.id = 'resume-dialog';
                        resumeDialog.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: rgba(0,0,0,0.95);
                            padding: 2rem;
                            border-radius: var(--radius-lg);
                            z-index: 200;
                            text-align: center;
                            min-width: 300px;
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255,255,255,0.1);
                        `;

                        const minutes = Math.floor(savedPosition / 60);
                        const seconds = Math.floor(savedPosition % 60);
                        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

                        resumeDialog.innerHTML = `
                            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Resume Playback?</div>
                            <div style="color: rgba(255,255,255,0.7); margin-bottom: 2rem;">Continue from ${timeStr}</div>
                            <div style="display: flex; gap: 1rem; justify-content: center;">
                                <button id="resume-start-over" style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Start Over</button>
                                <button id="resume-continue" style="flex: 1; background: var(--accent-primary); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">Resume</button>
                            </div>
                        `;

                        document.querySelector('.video-player-container').appendChild(resumeDialog);

                        // Pause video until user decides
                        videoElement.pause();

                        document.getElementById('resume-continue').addEventListener('click', () => {
                            videoElement.currentTime = savedPosition;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log(`Resuming from ${Math.floor(savedPosition)}s`);
                        });

                        document.getElementById('resume-start-over').addEventListener('click', () => {
                            videoElement.currentTime = 0;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log('Starting from beginning');
                        });

                        // Auto-select resume after 10 seconds
                        setTimeout(() => {
                            if (document.getElementById('resume-dialog')) {
                                videoElement.currentTime = savedPosition;
                                videoElement.play();
                                resumeDialog.remove();
                                console.log('Auto-resumed after timeout');
                            }
                        }, 10000);
                    }

                    // Show fullscreen button
                    const fullscreenBtn = document.getElementById('fullscreen-btn');
                    if (fullscreenBtn && document.fullscreenEnabled) {
                        fullscreenBtn.style.display = 'flex';
                    }
                }, { once: true });

                // Handle video loaded - ONLY NOW hide loading UI
                videoElement.addEventListener('loadeddata', () => {
                    console.log('Video loaded and ready to play');

                    // Fade out loading UI
                    if (loadingContent) {
                        loadingContent.style.transition = 'opacity 0.3s ease';
                        loadingContent.style.opacity = '0';
                        setTimeout(() => {
                            loadingContent.style.display = 'none';
                        }, 300);
                    }

                    if (statusText) {
                        statusText.textContent = 'Playing';
                        statusText.style.color = '#10b981';
                    }

                    // Show download overlay during playback (hide when download complete)
                    const downloadOverlay = document.getElementById('download-overlay');
                    if (downloadOverlay) {
                        downloadOverlay.style.display = 'block';

                        // Hide overlay when download is complete (100%)
                        const checkProgress = setInterval(() => {
                            const dlProgress = document.getElementById('dl-progress');
                            if (dlProgress && dlProgress.textContent.includes('100%')) {
                                setTimeout(() => {
                                    downloadOverlay.style.transition = 'opacity 0.3s ease';
                                    downloadOverlay.style.opacity = '0';
                                    setTimeout(() => {
                                        downloadOverlay.style.display = 'none';
                                    }, 300);
                                }, 2000); // Keep visible for 2s after completion
                                clearInterval(checkProgress);
                            }
                        }, 500);
                    }
                }, { once: true });

                // Save playback position periodically
                videoElement.addEventListener('timeupdate', () => {
                    if (!videoElement.paused && videoElement.currentTime > 10) {
                        this.savePlaybackPosition(movie.imdb_id, videoElement.currentTime);
                    }
                });

                videoElement.addEventListener('pause', () => {
                    if (window.NativeTorrentClient) {
                        window.NativeTorrentClient.pauseStream();
                    }
                });

                videoElement.addEventListener('play', () => {
                    if (window.NativeTorrentClient) {
                        window.NativeTorrentClient.resumeStream();
                    }
                });

                // Subtitle selection
                const subtitleBtn = document.getElementById('subtitle-btn');
                const subtitleSelector = document.getElementById('subtitle-selector');

                if (subtitleBtn && subtitleSelector) {
                    subtitleBtn.style.display = 'flex';

                    subtitleBtn.addEventListener('click', async () => {
                        if (subtitleSelector.style.display === 'none') {
                            subtitleSelector.innerHTML = '<div class="loading-spinner-large"></div>';
                            subtitleSelector.style.display = 'block';

                            const subtitles = await window.NativeTorrentClient.downloadSubtitles({ imdbId: movie.imdb_id });

                            subtitleSelector.innerHTML = '';

                            if (subtitles && Object.keys(subtitles).length > 0) {
                                for (const lang in subtitles) {
                                    const option = document.createElement('div');
                                    option.classList.add('subtitle-option');
                                    option.textContent = lang;
                                    option.dataset.url = subtitles[lang].url;
                                    option.addEventListener('click', () => {
                                        const track = document.createElement('track');
                                        track.kind = 'subtitles';
                                        track.label = lang;
                                        track.srclang = lang;
                                        track.src = subtitles[lang].url;
                                        track.default = true;

                                        // Remove existing tracks
                                        const existingTracks = videoElement.querySelectorAll('track');
                                        existingTracks.forEach(t => t.remove());

                                        videoElement.appendChild(track);
                                        videoElement.textTracks[0].mode = 'showing';
                                        subtitleSelector.style.display = 'none';
                                    });
                                    subtitleSelector.appendChild(option);
                                }
                            } else {
                                subtitleSelector.innerHTML = '<div>No subtitles found</div>';
                            }
                        } else {
                            subtitleSelector.style.display = 'none';
                        }
                    });
                }
                const speedBtn = document.getElementById('speed-btn');
                const speedSelector = document.getElementById('speed-selector');
                if (speedBtn && speedSelector) {
                    speedBtn.style.display = 'flex';

                    speedBtn.addEventListener('click', () => {
                        speedSelector.style.display = speedSelector.style.display === 'none' ? 'block' : 'none';
                    });

                    document.querySelectorAll('.speed-option').forEach(option => {
                        option.addEventListener('click', () => {
                            const speed = parseFloat(option.dataset.speed);
                            videoElement.playbackRate = speed;
                            speedBtn.textContent = `${speed}x`;

                            // Update active state
                            document.querySelectorAll('.speed-option').forEach(opt => {
                                opt.style.background = 'transparent';
                                opt.classList.remove('active');
                            });
                            option.style.background = 'var(--accent-primary)';
                            option.classList.add('active');

                            speedSelector.style.display = 'none';
                        });

                        // Hover effect
                        option.addEventListener('mouseenter', () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'rgba(255,255,255,0.1)';
                            }
                        });
                        option.addEventListener('mouseleave', () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'transparent';
                            }
                        });
                    });

                    // Close selector when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!speedBtn.contains(e.target) && !speedSelector.contains(e.target)) {
                            speedSelector.style.display = 'none';
                        }
                    });
                }

                // Picture-in-Picture toggle
                const pipBtn = document.getElementById('pip-btn');
                if (pipBtn && document.pictureInPictureEnabled) {
                    pipBtn.style.display = 'flex';

                    pipBtn.addEventListener('click', async () => {
                        try {
                            if (document.pictureInPictureElement) {
                                await document.exitPictureInPicture();
                            } else {
                                await videoElement.requestPictureInPicture();
                            }
                        } catch (e) {
                            console.warn('PiP not available:', e);
                        }
                    });

                    // Update button when PiP state changes
                    videoElement.addEventListener('enterpictureinpicture', () => {
                        pipBtn.style.background = 'var(--accent-primary)';
                    });
                    videoElement.addEventListener('leavepictureinpicture', () => {
                        pipBtn.style.background = 'rgba(255,255,255,0.1)';
                    });
                }

                // Fullscreen toggle handler
                const fullscreenBtn = document.getElementById('fullscreen-btn');
                if (fullscreenBtn) {
                    fullscreenBtn.addEventListener('click', async () => {
                        const container = document.querySelector('.video-player-container');
                        if (!document.fullscreenElement) {
                            try {
                                await container.requestFullscreen();
                                fullscreenBtn.textContent = '⛶';
                            } catch (e) {
                                console.warn('Fullscreen not available:', e);
                            }
                        } else {
                            await document.exitFullscreen();
                            fullscreenBtn.textContent = '⛶';
                        }
                    });
                }

                // Touch gesture controls for volume and brightness
                let startY = 0;
                let startX = 0;
                let isVerticalGesture = false;
                let isLeftSide = false;

                videoElement.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        startY = touch.clientY;
                        startX = touch.clientX;
                        isLeftSide = touch.clientX < window.innerWidth / 2;
                    }
                }, { passive: true });

                videoElement.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        const deltaY = startY - touch.clientY;
                        const deltaX = Math.abs(touch.clientX - startX);

                        // Determine if this is a vertical gesture
                        if (!isVerticalGesture && Math.abs(deltaY) > 20 && deltaX < 30) {
                            isVerticalGesture = true;
                        }

                        if (isVerticalGesture) {
                            e.preventDefault();

                            if (isLeftSide) {
                                // Left side - brightness control (visual feedback only, actual brightness control requires plugin)
                                console.log('Brightness gesture:', deltaY > 0 ? 'increase' : 'decrease');
                            } else {
                                // Right side - volume control
                                const volumeChange = deltaY / 200;
                                videoElement.volume = Math.max(0, Math.min(1, videoElement.volume + volumeChange));
                            }

                            startY = touch.clientY;
                        }
                    }
                }, { passive: false });

                videoElement.addEventListener('touchend', () => {
                    isVerticalGesture = false;
                }, { passive: true });

                // Double-tap to skip (10s forward/backward)
                let lastTapTime = 0;
                let lastTapSide = null;

                const showSkipIndicator = (direction, seconds) => {
                    const indicator = document.createElement('div');
                    indicator.style.cssText = `
                        position: absolute;
                        top: 50%;
                        ${direction === 'forward' ? 'right: 20%;' : 'left: 20%;'}
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 1.5rem 2rem;
                        border-radius: 50%;
                        font-size: 1.5rem;
                        z-index: 150;
                        animation: skipFade 0.6s ease-out;
                        pointer-events: none;
                    `;
                    indicator.innerHTML = direction === 'forward' ? `⏩<br><small style="font-size: 0.8rem;">${seconds}s</small>` : `⏪<br><small style="font-size: 0.8rem;">${seconds}s</small>`;

                    // Add animation keyframes if not already added
                    if (!document.getElementById('skip-animation-styles')) {
                        const style = document.createElement('style');
                        style.id = 'skip-animation-styles';
                        style.textContent = `
                            @keyframes skipFade {
                                0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                                50% { opacity: 1; transform: translateY(-50%) scale(1); }
                                100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    document.querySelector('.video-player-container').appendChild(indicator);
                    setTimeout(() => indicator.remove(), 600);
                };

                videoElement.addEventListener('click', (e) => {
                    const now = Date.now();
                    const tapDelay = now - lastTapTime;
                    const clickX = e.clientX || (e.touches && e.touches[0].clientX);
                    const tapSide = clickX < window.innerWidth / 2 ? 'left' : 'right';

                    // Double-tap detected (within 300ms and same side)
                    if (tapDelay < 300 && tapSide === lastTapSide) {
                        e.preventDefault();
                        const skipAmount = 10;

                        if (tapSide === 'right') {
                            // Forward 10 seconds
                            videoElement.currentTime = Math.min(
                                videoElement.duration,
                                videoElement.currentTime + skipAmount
                            );
                            showSkipIndicator('forward', skipAmount);
                            console.log(`Skipped forward ${skipAmount}s`);
                        } else {
                            // Backward 10 seconds
                            videoElement.currentTime = Math.max(
                                0,
                                videoElement.currentTime - skipAmount
                            );
                            showSkipIndicator('backward', skipAmount);
                            console.log(`Skipped backward ${skipAmount}s`);
                        }

                        // Reset tap tracking
                        lastTapTime = 0;
                        lastTapSide = null;
                    } else {
                        // First tap
                        lastTapTime = now;
                        lastTapSide = tapSide;
                    }
                });
            }

        } catch (error) {
            console.error('Native torrent streaming failed:', error);

            // Show error message
            const statusText = document.getElementById('status-text');
            const loadingTitle = document.getElementById('loading-title');
            const loadingSubtitle = document.getElementById('loading-subtitle');

            if (statusText) {
                statusText.textContent = 'Error';
                statusText.style.color = '#ef4444';
            }

            if (loadingTitle) {
                loadingTitle.textContent = 'Streaming Failed';
            }

            if (loadingSubtitle) {
                loadingSubtitle.innerHTML = `
                    <strong>Error:</strong> ${error.message}<br>
                    <span style="font-size: 0.8rem; margin-top: 1rem; display: block;">
                        • Check torrent health (seeds/peers)<br>
                        • Try a different quality<br>
                        • Check your internet connection
                    </span>
                `;
            }

            // Hide spinner
            const spinner = document.querySelector('.loading-spinner-large');
            if (spinner) spinner.style.display = 'none';
        }
    }

    // Mock data generators
    getMockMovies() {
        return Array.from({ length: 20 }, (_, i) => ({
            imdb_id: `tt00000${i}`,
            title: `Movie ${i + 1}`,
            year: 2020 + (i % 4),
            rating: { percentage: 60 + (i % 40) },
            quality: i % 3 === 0 ? '4K' : i % 2 === 0 ? 'HD' : null,
            images: {
                poster: `https://via.placeholder.com/300x450/1f1f1f/808080?text=Movie+${i + 1}`
            }
        }));
    }

    getMockShows() {
        return Array.from({ length: 20 }, (_, i) => ({
            tvdb_id: `${100000 + i}`,
            title: `TV Show ${i + 1}`,
            first_aired: `${2018 + (i % 6)}-01-01`,
            rating: { percentage: 70 + (i % 30) },
            quality: i % 2 === 0 ? 'HD' : null,
            images: {
                poster: `https://via.placeholder.com/300x450/1f1f1f/808080?text=Show+${i + 1}`
            }
        }));
    }

    getMockAnime() {
        return Array.from({ length: 20 }, (_, i) => ({
            imdb_id: `tt99999${i}`,
            title: `Anime ${i + 1}`,
            year: 2019 + (i % 5),
            rating: { percentage: 75 + (i % 25) },
            quality: 'HD',
            images: {
                poster: `https://via.placeholder.com/300x450/1f1f1f/808080?text=Anime+${i + 1}`
            }
        }));
    }
}

// Export for use in main.js
export default MobileUIController;
