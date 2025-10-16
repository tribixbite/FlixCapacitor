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

/* Favorite Button */
.content-card-favorite {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
}

.content-card-favorite:active {
    transform: scale(0.9);
}

.content-card-favorite .favorite-icon {
    font-size: 1.2rem;
    filter: grayscale(100%);
    opacity: 0.6;
    transition: all 0.2s;
}

.content-card-favorite.favorited .favorite-icon {
    filter: grayscale(0%);
    opacity: 1;
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
    padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom) + 12rem);
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
    margin-bottom: calc(var(--nav-height) + var(--safe-area-bottom) + 1rem);
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

    // Favorites/Watchlist Browser with Tabs
    favoritesView: (activeTab = 'favorites') => `
        ${componentStyles}
        <div class="browser-container">
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Search ${activeTab === 'favorites' ? 'favorites' : 'watchlist'}..." id="favorites-search-input">
            </div>
            <div class="filter-tabs" style="padding-top: 1rem;">
                <div class="filter-tab ${activeTab === 'favorites' ? 'active' : ''}" data-favorites-tab="favorites">❤️ Favorites</div>
                <div class="filter-tab ${activeTab === 'watchlist' ? 'active' : ''}" data-favorites-tab="watchlist">⭐ Watchlist</div>
            </div>
            <div class="filter-tabs" style="padding-top: 0.5rem;">
                <div class="filter-tab active" data-category="all">All</div>
                <div class="filter-tab" data-category="movies">Movies</div>
                <div class="filter-tab" data-category="shows">TV Shows</div>
                <div class="filter-tab" data-category="anime">Anime</div>
                <div class="filter-tab" data-category="courses">Courses</div>
            </div>
            <div class="content-grid">
                <div class="content-loading">
                    <div class="loading-spinner-large"></div>
                    <div class="loading-text">Loading...</div>
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
                <button class="content-card-favorite" data-id="${item.imdb_id || item.tvdb_id}" title="Add to Favorites">
                    <span class="favorite-icon">❤️</span>
                </button>
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

    // Library Empty State with Scan Button
    libraryEmptyState: () => `
        <div class="content-empty">
            <div class="empty-icon">📁</div>
            <div class="empty-title">Library is Empty</div>
            <div class="empty-message">Scan your device for local media files to build your library</div>
            <button class="library-scan-btn" id="library-scan-btn">
                <span>🔍</span>
                <span>Scan Library</span>
            </button>
        </div>
        <style>
        .library-scan-btn {
            margin-top: 1.5rem;
            padding: 0.875rem 2rem;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            border: none;
            border-radius: var(--radius-md);
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: var(--shadow-md);
        }
        .library-scan-btn:active {
            transform: scale(0.95);
        }
        </style>
    `,

    // Library Scanning State
    libraryScanningState: (current, total) => `
        <div class="content-empty">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">Scanning Library</div>
            <div class="scan-progress-text">${current} / ${total} files</div>
            <div class="scan-progress-bar">
                <div class="scan-progress-bar-fill" style="width: 0%;"></div>
            </div>
            <div class="scan-current-file">Scanning...</div>
        </div>
        <style>
        .scan-progress-text {
            font-size: 1rem;
            color: var(--text-secondary);
            margin: 1rem 0 0.5rem;
        }
        .scan-progress-bar {
            width: 80%;
            max-width: 400px;
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
            margin: 0 auto;
        }
        .scan-progress-bar-fill {
            height: 100%;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            transition: width 0.3s ease;
        }
        .scan-current-file {
            font-size: 0.875rem;
            color: var(--text-tertiary);
            margin-top: 1rem;
            max-width: 80%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        </style>
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
        this.navigationHistory = []; // Track navigation history for back button
        this.moviesCache = null; // Cache for loaded movies
        this.currentMovieData = new Map(); // Store movie data by ID
        this.backButtonListener = null; // Android back button handler
        this.currentVideoElement = null; // Current video element reference
        this.playbackPositions = new Map(); // Store playback positions by movie ID
        this.isLoadingStream = false; // Prevent duplicate concurrent stream loading
        this.videoPlayerCleanup = { listeners: [], intervals: [] }; // Track resources for cleanup
        this.Haptics = null; // Conference Polish: Haptics module for tactile feedback
        this.StatusBar = null; // Conference Polish: StatusBar module for dynamic colors

        // Conference Polish: Initialize Haptics
        import('@capacitor/haptics').then(module => {
            this.Haptics = module.Haptics;
        }).catch(() => {
            // Haptics not available on this platform
        });

        // Conference Polish: Initialize StatusBar
        import('@capacitor/status-bar').then(module => {
            this.StatusBar = module.StatusBar;
            // Set initial dark status bar
            this.StatusBar.setStyle({ style: 'DARK' }).catch(() => {});
            this.StatusBar.setBackgroundColor({ color: '#0a0a0a' }).catch(() => {});
        }).catch(() => {
            // StatusBar not available on this platform
        });

        this.setupNavigation();

        // Make available globally for back button handler
        if (window.App) {
            window.App.UI = this;
        }
    }

    /**
     * Conference Polish: Trigger haptic feedback
     * @param {string} style - 'light', 'medium', 'heavy'
     */
    async haptic(style = 'light') {
        if (this.Haptics) {
            try {
                await this.Haptics.impact({ style });
            } catch (err) {
                // Silently ignore
            }
        }
    }

    /**
     * Conference Polish: Update status bar color based on current view
     * @param {string} view - Current view name
     */
    async updateStatusBarColor(view) {
        if (!this.StatusBar) return;

        const colors = {
            'movies': '#0a0a0a',
            'shows': '#0a0a0a',
            'anime': '#0a0a0a',
            'favorites': '#0a0a0a',
            'library': '#0a0a0a',
            'learning': '#0a0a0a',
            'settings': '#141414'
        };

        const color = colors[view] || '#0a0a0a';

        try {
            await this.StatusBar.setBackgroundColor({ color });
        } catch (err) {
            // Silently ignore
        }
    }

    setupNavigation() {
        // Conference Polish: Import Haptics for tactile feedback
        let Haptics = null;
        import('@capacitor/haptics').then(module => {
            Haptics = module.Haptics;
        }).catch(() => {
            console.log('Haptics not available');
        });

        // Handle bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const nav = item.dataset.nav;

                // Conference Polish: Add haptic feedback on navigation
                if (Haptics) {
                    try {
                        await Haptics.impact({ style: 'light' });
                    } catch (err) {
                        // Silently ignore haptic errors
                    }
                }

                // Special handling for Browse dropdown
                if (nav === 'browse') {
                    e.preventDefault();
                    // Toggle dropdown
                    const isActive = item.classList.contains('active');
                    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                    item.classList.add('active');

                    // If already open, close it; if closed, open it
                    if (isActive && !e.target.closest('.browse-dropdown-item')) {
                        item.classList.remove('active');
                    }
                    return;
                }

                e.preventDefault();
                this.navigateTo(nav);

                // Update active state
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Handle Browse dropdown items
        document.querySelectorAll('.browse-dropdown-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Conference Polish: Add haptic feedback on dropdown selection
                if (Haptics) {
                    try {
                        await Haptics.impact({ style: 'light' });
                    } catch (err) {
                        // Silently ignore haptic errors
                    }
                }

                const nav = item.dataset.nav;
                this.navigateTo(nav);

                // Update dropdown active state
                document.querySelectorAll('.browse-dropdown-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Close the dropdown by removing active class from parent
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
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

        // Track navigation history (max 10 entries)
        if (this.currentView && this.currentView !== route) {
            this.navigationHistory.push(this.currentView);
            if (this.navigationHistory.length > 10) {
                this.navigationHistory.shift(); // Remove oldest
            }
        }

        // Track current view
        this.currentView = route;

        // Conference Polish: Update status bar color for current view
        this.updateStatusBarColor(route);

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
            case 'favorites':
                this.showFavorites();
                break;
            case 'library':
                this.showLibrary();
                break;
            case 'learning':
                this.showLearning();
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

    /**
     * Go back to previous view
     * @returns {boolean} True if navigated back, false if no history
     */
    goBack() {
        if (this.navigationHistory.length > 0) {
            const previousView = this.navigationHistory.pop();
            // Navigate without adding to history
            const tempHistory = this.navigationHistory;
            this.navigationHistory = [];
            this.navigateTo(previousView);
            this.navigationHistory = tempHistory;
            return true;
        }
        return false;
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

    async showShows() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('TV Shows', 'shows');

        const contentGrid = document.querySelector('.content-grid');

        try {
            const tvShowsProvider = window.TVShowsProvider;
            if (!tvShowsProvider) {
                console.error('TVShowsProvider not loaded');
                setTimeout(() => {
                    this.renderMockShows();
                }, 800);
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading TV shows...');

            // Fetch TV shows
            const shows = await tvShowsProvider.getPopular();

            // Store shows for detail view
            shows.forEach(show => {
                this.currentMovieData.set(show.tvdb_id || show.imdb_id, show);
            });

            // Render TV shows
            contentGrid.innerHTML = UITemplates.contentGrid(shows);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to load TV shows:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load TV Shows',
                error.message || 'Please try again'
            );
        }
    }

    async showAnime() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Anime', 'anime');

        const contentGrid = document.querySelector('.content-grid');

        try {
            const animeProvider = window.AnimeProvider;
            if (!animeProvider) {
                console.error('AnimeProvider not loaded');
                setTimeout(() => {
                    this.renderMockAnime();
                }, 800);
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading anime...');

            // Fetch anime
            const anime = await animeProvider.getPopular();

            // Store anime for detail view
            anime.forEach(item => {
                this.currentMovieData.set(item.tvdb_id || item.imdb_id, item);
            });

            // Render anime
            contentGrid.innerHTML = UITemplates.contentGrid(anime);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to load anime:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Anime',
                error.message || 'Please try again'
            );
        }
    }

    async showFavorites(tab = 'favorites') {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.favoritesView(tab);

        // Setup tab switching
        document.querySelectorAll('[data-favorites-tab]').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const selectedTab = tabBtn.dataset.favoritesTab;
                this.showFavorites(selectedTab);
            });
        });

        const contentGrid = document.querySelector('.content-grid');

        if (tab === 'favorites') {
            await this.renderFavoritesTab(contentGrid);
        } else {
            await this.renderWatchlistTab(contentGrid);
        }
    }

    async renderFavoritesTab(contentGrid) {
        try {
            const favoritesService = window.FavoritesService;
            if (!favoritesService) {
                console.error('FavoritesService not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Favorites service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading favorites...');

            // Fetch favorites
            const favorites = await favoritesService.getFavorites();

            if (favorites.length === 0) {
                contentGrid.innerHTML = UITemplates.emptyState(
                    '❤️',
                    'No Favorites Yet',
                    'Mark movies and shows as favorites to see them here'
                );
                return;
            }

            // Store favorites for detail view
            favorites.forEach(item => {
                this.currentMovieData.set(item.imdb_id || item.id, item);
            });

            // Render favorites grid
            contentGrid.innerHTML = UITemplates.contentGrid(favorites);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to load favorites:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Favorites',
                error.message || 'Please try again'
            );
        }
    }

    async renderWatchlistTab(contentGrid) {
        try {
            const watchlistService = window.WatchlistService;
            if (!watchlistService) {
                console.error('WatchlistService not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Watchlist service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading watchlist...');

            // Fetch watchlist items
            const watchlistItems = await watchlistService.getWatchlist();

            if (watchlistItems.length === 0) {
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⭐',
                    'Your Watchlist is Empty',
                    'Add movies and shows to keep track of what you want to watch'
                );
                return;
            }

            // Store items for detail view
            watchlistItems.forEach(item => {
                this.currentMovieData.set(item.imdb_id || item.id, item);
            });

            // Render watchlist items
            contentGrid.innerHTML = UITemplates.contentGrid(watchlistItems);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to load watchlist:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Watchlist',
                error.message || 'Please try again'
            );
        }
    }

    async showLibrary() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Library', 'library');

        // Replace filter tabs with folder-based filters
        const filterTabs = document.querySelector('.filter-tabs');
        if (filterTabs) {
            filterTabs.innerHTML = `
                <div class="filter-tab active" data-filter="all">All Folders</div>
                <div class="filter-tab" data-filter="movies">Movies</div>
                <div class="filter-tab" data-filter="downloads">Downloads</div>
                <div class="filter-tab" data-filter="videos">Videos</div>
            `;

            // Add click handlers for folder filters
            filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
                tab.addEventListener('click', async () => {
                    // Update active state
                    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Get filter value
                    const folder = tab.dataset.filter;

                    // Reload library with folder filter
                    await this.showLibraryFiltered(folder);
                });
            });
        }

        const contentGrid = document.querySelector('.content-grid');

        try {
            const libraryService = window.LibraryService;
            if (!libraryService) {
                console.error('LibraryService not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Library service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading library...');

            // Fetch library items
            const libraryItems = await libraryService.getMedia({ limit: 100 });

            if (libraryItems.length === 0) {
                // Show empty state with scan button
                contentGrid.innerHTML = UITemplates.libraryEmptyState();
                this.attachLibraryScanHandler();
                return;
            }

            // Transform library items to content card format
            const itemsFormatted = libraryItems.map(item => ({
                imdb_id: item.imdb_id || `local_${item.media_id}`,
                title: item.title,
                year: item.year || 'Unknown',
                rating: item.rating || 'N/A',
                images: {
                    poster: item.poster_url || '/img/video-placeholder.png',
                    fanart: item.backdrop_url || '/img/video-placeholder.png'
                },
                genres: item.genres ? JSON.parse(item.genres) : [],
                synopsis: item.synopsis || `Local media file: ${item.original_filename}`,
                file_path: item.file_path
            }));

            // Store items for detail view
            itemsFormatted.forEach(item => {
                this.currentMovieData.set(item.imdb_id, item);
            });

            // Render library items
            contentGrid.innerHTML = UITemplates.contentGrid(itemsFormatted);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to load library:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Library',
                error.message || 'Please try again'
            );
        }
    }

    /**
     * Show library with folder filter applied
     * @param {string} folder - Folder to filter by ('all', 'movies', 'downloads', 'dcim', 'videos')
     */
    async showLibraryFiltered(folder) {
        const contentGrid = document.querySelector('.content-grid');

        try {
            const libraryService = window.LibraryService;
            if (!libraryService) {
                console.error('LibraryService not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Library service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.loadingState('Loading library...');

            // Fetch all library items
            const allItems = await libraryService.getMedia({ limit: 1000 });

            // Filter by folder path if not 'all'
            let filteredItems = allItems;
            if (folder !== 'all') {
                // Map folder names to path patterns (DCIM skipped - camera photos)
                const folderPaths = {
                    'movies': '/Movies/',
                    'downloads': '/Download/',
                    'videos': '/Videos/'
                };

                const pathPattern = folderPaths[folder];
                if (pathPattern) {
                    filteredItems = allItems.filter(item =>
                        item.file_path && item.file_path.includes(pathPattern)
                    );
                }
            }

            if (filteredItems.length === 0) {
                contentGrid.innerHTML = UITemplates.emptyState(
                    '📁',
                    folder === 'all' ? 'No Library Items' : `No Items in ${folder.charAt(0).toUpperCase() + folder.slice(1)}`,
                    folder === 'all' ? 'Scan your device to add media to your library' : 'No media files found in this folder'
                );
                if (folder === 'all') {
                    this.attachLibraryScanHandler();
                }
                return;
            }

            // Transform library items to content card format
            const itemsFormatted = filteredItems.map(item => ({
                imdb_id: item.imdb_id || `local_${item.media_id}`,
                title: item.title,
                year: item.year || 'Unknown',
                rating: item.rating || 'N/A',
                images: {
                    poster: item.poster_url || '/img/video-placeholder.png',
                    fanart: item.backdrop_url || '/img/video-placeholder.png'
                },
                genres: item.genres ? JSON.parse(item.genres) : [],
                synopsis: item.synopsis || `Local media file: ${item.original_filename}`,
                file_path: item.file_path
            }));

            // Store items for detail view
            itemsFormatted.forEach(item => {
                this.currentMovieData.set(item.imdb_id, item);
            });

            // Render filtered library items
            contentGrid.innerHTML = UITemplates.contentGrid(itemsFormatted);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error) {
            console.error('Failed to filter library:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Library',
                error.message || 'Please try again'
            );
        }
    }

    /**
     * Attach handler for library scan button
     */
    attachLibraryScanHandler() {
        const scanButton = document.querySelector('#library-scan-btn');
        if (scanButton) {
            scanButton.addEventListener('click', async () => {
                await this.startLibraryScan();
            });
        }
    }

    /**
     * Start library scan process
     */
    async startLibraryScan() {
        const libraryService = window.LibraryService;
        if (!libraryService) {
            console.error('LibraryService not available');
            return;
        }

        const contentGrid = document.querySelector('.content-grid');

        // Request storage permissions first
        try {
            const { Capacitor } = await import('@capacitor/core');

            console.log('Checking media permissions...');

            // Try custom MediaPermissions plugin first (Android 13+ support)
            if (Capacitor.Plugins.MediaPermissions) {
                console.log('Using native MediaPermissions plugin');
                const checkResult = await Capacitor.Plugins.MediaPermissions.checkPermissions();
                console.log('Permission check result:', checkResult);

                if (!checkResult.granted) {
                    console.log('Requesting media permissions...');
                    const requestResult = await Capacitor.Plugins.MediaPermissions.requestPermissions();
                    console.log('Permission request result:', requestResult);

                    if (!requestResult.granted) {
                        contentGrid.innerHTML = UITemplates.emptyState(
                            '🔒',
                            'Permission Denied',
                            'Media access is required to scan your library. Please grant permission to access videos and audio files.'
                        );
                        return;
                    }
                }
            } else {
                // Fallback: Show button to open settings
                console.warn('MediaPermissions plugin not available, showing settings button');
                contentGrid.innerHTML = `
                    <div class="content-empty">
                        <div class="empty-icon">🔐</div>
                        <div class="empty-title">Grant Media Permissions</div>
                        <div class="empty-message">FlixCapacitor needs access to your media files to scan your library.</div>
                        <button class="open-settings-btn" id="open-settings-btn" style="
                            margin-top: 1.5rem;
                            padding: 0.875rem 2rem;
                            background: linear-gradient(135deg, #10b981, #059669);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                            transition: transform 0.2s;
                        ">
                            <span>⚙️</span>
                            <span>Open Settings</span>
                        </button>
                        <div class="empty-message" style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">
                            Grant "Photos and videos" and "Music and audio" permissions
                        </div>
                    </div>
                `;

                // Add click handler for settings button
                const settingsBtn = document.getElementById('open-settings-btn');
                if (settingsBtn) {
                    settingsBtn.addEventListener('click', async () => {
                        try {
                            // Try to open settings using Capacitor App plugin
                            const { App } = await import('@capacitor/app');
                            await App.openUrl({
                                url: 'app-settings:'
                            });
                        } catch (error) {
                            console.error('Failed to open settings:', error);
                            alert('Please open Settings → Apps → FlixCapacitor → Permissions manually.');
                        }
                    });
                }
                return;
            }

            console.log('Media permissions granted, starting scan...');
        } catch (error) {
            console.error('Failed to request permissions:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Permission Error',
                `Failed to request storage permissions: ${error}. Please grant permissions manually in Android Settings → Apps → FlixCapacitor → Permissions.`
            );
            return;
        }

        // TODO: Add folder picker to select directories
        // For now, scan common Android media directories (skip DCIM - camera photos)
        const commonPaths = [
            'Movies',
            'Download',
            'Videos'
        ];

        try {
            // Show scanning UI
            contentGrid.innerHTML = UITemplates.libraryScanningState(0, 0);

            let totalFiles = 0;
            let currentFile = 0;

            const results = await libraryService.scanFolders(commonPaths, (current, total, filename) => {
                currentFile = current;
                totalFiles = total || currentFile;

                // Update progress UI
                const progress = totalFiles > 0 ? Math.round((currentFile / totalFiles) * 100) : 0;
                const progressText = document.querySelector('.scan-progress-text');
                const progressBar = document.querySelector('.scan-progress-bar-fill');
                const currentFileText = document.querySelector('.scan-current-file');

                if (progressText) progressText.textContent = `${currentFile} / ${totalFiles} files`;
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (currentFileText) currentFileText.textContent = filename || 'Scanning...';
            });

            console.log('Scan complete:', results);

            // Show completion message briefly
            contentGrid.innerHTML = UITemplates.emptyState(
                '✅',
                'Scan Complete',
                `Found ${results?.itemsMatched || 0} media files`
            );

            // Wait a moment then refresh library view
            setTimeout(async () => {
                await this.showLibrary();
            }, 1500);

        } catch (error) {
            console.error('Library scan failed:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Scan Failed',
                error.message || 'Failed to scan media folders. Please check storage permissions.'
            );
        }
    }

    async showLearning() {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion.innerHTML = UITemplates.browserView('Learning', 'learning');

        // Replace filter tabs with provider-based filters
        const filterTabs = document.querySelector('.filter-tabs');
        if (filterTabs) {
            filterTabs.innerHTML = `
                <div class="filter-tab active" data-filter="all">All Providers</div>
                <div class="filter-tab" data-filter="MIT">MIT</div>
                <div class="filter-tab" data-filter="Stanford">Stanford</div>
                <div class="filter-tab" data-filter="Harvard">Harvard</div>
                <div class="filter-tab" data-filter="Khan Academy">Khan Academy</div>
                <div class="filter-tab" data-filter="Coursera">Coursera</div>
                <div class="filter-tab" data-filter="Udemy">Udemy</div>
            `;

            // Attach click handlers to filter tabs
            filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
                tab.addEventListener('click', async () => {
                    // Update active state
                    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Get filter value
                    const provider = tab.dataset.filter === 'all' ? null : tab.dataset.filter;

                    // Reload courses with filter
                    await this.renderRealCourses(provider);
                });
            });
        }

        // Load real courses from Academic Torrents
        await this.renderRealCourses();
    }

    async showWatchlist() {
        // Redirect to favorites with watchlist tab
        await this.showFavorites('watchlist');
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
            await this.updateFavoriteButtonStates();
        } catch (error) {
            console.error('Failed to load movies:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Movies',
                'Please check your connection and try again'
            );
        }
    }

    async renderRealCourses(providerFilter = null) {
        const contentGrid = document.querySelector('.content-grid');

        try {
            // Get learning service
            const learningService = window.LearningService;
            if (!learningService) {
                console.error('LearningService not loaded');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Learning service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid.innerHTML = UITemplates.emptyState(
                '⏳',
                'Loading Courses',
                'Fetching educational content from Academic Torrents...'
            );

            // Check if we have courses, if not sync them
            const courseCount = await learningService.getCachedCourseCount();
            if (courseCount === 0) {
                console.log('No courses in database, syncing from Academic Torrents...');
                contentGrid.innerHTML = UITemplates.emptyState(
                    '⏳',
                    'First Time Setup',
                    'Downloading course catalog from Academic Torrents... This may take a minute.'
                );
                await learningService.syncCourses();
            }

            // Fetch courses (increased limit to show all available)
            const courses = await learningService.getCourses({
                limit: 200,
                provider: providerFilter
            });
            console.log(`Loaded ${courses.length} courses`);

            // Provider logo mapping with colors
            const providerLogos = {
                'MIT': { color: '8a0000', text: 'MIT' },
                'Stanford': { color: '8c1515', text: 'Stanford' },
                'Harvard': { color: 'a51c30', text: 'Harvard' },
                'Khan Academy': { color: '14bf96', text: 'Khan' },
                'Coursera': { color: '0056d2', text: 'Coursera' },
                'Udemy': { color: 'a435f0', text: 'Udemy' },
                'Berkeley': { color: '003262', text: 'Berkeley' },
                'Yale': { color: '00356b', text: 'Yale' },
                'Princeton': { color: 'ff8f00', text: 'Princeton' },
                'Oxford': { color: '002147', text: 'Oxford' },
                'Cambridge': { color: 'a3c1ad', text: 'Cambridge' }
            };

            // Transform courses to match content card format
            const coursesFormatted = courses.map(course => {
                const providerInfo = providerLogos[course.provider] || { color: '1f1f1f', text: course.provider || 'Course' };
                const logoUrl = `https://placehold.co/300x450/${providerInfo.color}/ffffff?text=${encodeURIComponent(providerInfo.text)}`;

                return {
                    imdb_id: `course_${course.infohash}`,
                    title: course.title,
                    year: '',
                    rating: { percentage: 0 },
                    images: {
                        poster: logoUrl,
                        fanart: logoUrl
                    },
                    genres: [course.subject_area || 'Education'],
                    synopsis: `Educational course from ${course.provider}`,
                    provider: course.provider,
                    subject_area: course.subject_area,
                    // Add torrent data for playback
                    torrents: {
                        '1080p': {
                            url: course.magnet_link,
                            size: this.formatBytes(course.size_bytes),
                            seed: course.downloaders || 0,
                            peer: 0
                        }
                    },
                    magnet_link: course.magnet_link,
                    infohash: course.infohash
                };
            });

            // Store courses for detail view
            coursesFormatted.forEach(course => {
                this.currentMovieData.set(course.imdb_id, course);
            });

            // Render courses
            if (coursesFormatted.length > 0) {
                contentGrid.innerHTML = UITemplates.contentGrid(coursesFormatted);
                this.attachCardHandlers();
                await this.updateFavoriteButtonStates();
            } else {
                contentGrid.innerHTML = UITemplates.emptyState(
                    '📚',
                    'No Courses Available',
                    'Course database is being populated. Please try again later.'
                );
            }
        } catch (error) {
            console.error('Failed to load courses:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Courses',
                error.message || 'Please check your connection and try again'
            );
        }
    }

    async renderMockMovies() {
        // Fallback to mock data if needed
        const mockMovies = this.getMockMovies();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockMovies);

        // Add click handlers
        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    async renderMockShows() {
        const mockShows = this.getMockShows();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockShows);

        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    async renderMockAnime() {
        const mockAnime = this.getMockAnime();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid.innerHTML = UITemplates.contentGrid(mockAnime);

        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    attachCardHandlers() {
        // Handle content card clicks
        document.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open detail if clicking favorite button
                if (e.target.closest('.content-card-favorite')) {
                    return;
                }
                const id = card.dataset.id;
                this.showDetail(id);
            });
        });

        // Handle favorite button clicks
        this.setupFavoriteHandlers();
    }

    /**
     * Setup favorite button click handlers
     */
    setupFavoriteHandlers() {
        document.querySelectorAll('.content-card-favorite').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const id = button.dataset.id;
                const favoritesService = window.FavoritesService;

                if (!favoritesService) {
                    console.error('FavoritesService not available');
                    return;
                }

                try {
                    const isFavorited = await favoritesService.isFavorite(id);

                    if (isFavorited) {
                        // Remove from favorites
                        await favoritesService.removeFavorite(id);
                        button.classList.remove('favorited');
                        button.title = 'Add to Favorites';

                        // If we're on the favorites page, refresh the view
                        if (window.location.hash === '#favorites') {
                            this.showFavorites();
                        }
                    } else {
                        // Add to favorites
                        const item = this.currentMovieData.get(id);
                        if (item) {
                            await favoritesService.addFavorite(item);
                            button.classList.add('favorited');
                            button.title = 'Remove from Favorites';
                        }
                    }
                } catch (error) {
                    console.error('Failed to toggle favorite:', error);
                }
            });
        });
    }

    /**
     * Update favorite button states based on actual favorite status
     */
    async updateFavoriteButtonStates() {
        const favoritesService = window.FavoritesService;
        if (!favoritesService) return;

        const buttons = document.querySelectorAll('.content-card-favorite');
        for (const button of buttons) {
            const id = button.dataset.id;
            const isFavorited = await favoritesService.isFavorite(id);

            if (isFavorited) {
                button.classList.add('favorited');
                button.title = 'Remove from Favorites';
            } else {
                button.classList.remove('favorited');
                button.title = 'Add to Favorites';
            }
        }
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

        document.getElementById('play-btn')?.addEventListener('click', async () => {
            // Conference Polish: Haptic feedback on play
            await this.haptic('medium');
            this.playMovie(movie);
        });

        document.getElementById('bookmark-btn')?.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('bookmarked');
            e.currentTarget.querySelector('span').textContent =
                e.currentTarget.classList.contains('bookmarked') ? '★' : '☆';
        });
    }

    /**
     * Show file picker modal for multi-file torrents
     * Displays list of video files with checkbox selection and star/favorite support
     * @param {Array} videoFiles - Array of {index, name, size} objects
     * @param {Object} movie - Movie object for context
     * @returns {Promise<number|null>} Selected file index or null if cancelled
     */
    async showFilePickerModal(videoFiles, movie) {
        return new Promise((resolve) => {
            const mainRegion = document.querySelector('.main-window-region');
            const modal = document.createElement('div');
            modal.className = 'file-picker-modal';
            modal.innerHTML = `
                <div class="file-picker-overlay"></div>
                <div class="file-picker-content">
                    <div class="file-picker-header">
                        <h2>${movie.title || 'Select Video File'}</h2>
                        <p>${videoFiles.length} video files found</p>
                        <button class="file-picker-close">×</button>
                    </div>
                    <div class="file-picker-body">
                        ${videoFiles.map((file, idx) => `
                            <div class="file-picker-item" data-index="${file.index}">
                                <div class="file-picker-item-checkbox">
                                    <input type="checkbox" id="file-${file.index}" />
                                </div>
                                <div class="file-picker-item-info" data-index="${file.index}">
                                    <div class="file-picker-item-name">${this.getFileName(file.name)}</div>
                                    <div class="file-picker-item-size">${this.formatBytes(file.size)}</div>
                                </div>
                                <div class="file-picker-item-star" data-index="${file.index}">
                                    ☆
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="file-picker-footer">
                        <button class="file-picker-cancel">Cancel</button>
                        <button class="file-picker-play" disabled>Play Selected</button>
                    </div>
                </div>
                <style>
                    .file-picker-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .file-picker-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.85);
                    }
                    .file-picker-content {
                        position: relative;
                        background: #1a1a1a;
                        border-radius: 12px;
                        max-width: 90%;
                        max-height: 80vh;
                        width: 500px;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    }
                    .file-picker-header {
                        padding: 1.5rem;
                        border-bottom: 1px solid #333;
                        position: relative;
                    }
                    .file-picker-header h2 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1.25rem;
                        color: #fff;
                    }
                    .file-picker-header p {
                        margin: 0;
                        font-size: 0.875rem;
                        color: #999;
                    }
                    .file-picker-close {
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: none;
                        border: none;
                        color: #999;
                        font-size: 2rem;
                        cursor: pointer;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        line-height: 1;
                    }
                    .file-picker-close:hover {
                        color: #fff;
                    }
                    .file-picker-body {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1rem;
                    }
                    .file-picker-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem;
                        margin-bottom: 0.5rem;
                        background: #252525;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .file-picker-item:hover {
                        background: #2a2a2a;
                    }
                    .file-picker-item.selected {
                        background: #2d4a7c;
                    }
                    .file-picker-item-checkbox input {
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                    }
                    .file-picker-item-info {
                        flex: 1;
                        cursor: pointer;
                    }
                    .file-picker-item-name {
                        color: #fff;
                        font-size: 0.9rem;
                        margin-bottom: 0.25rem;
                    }
                    .file-picker-item-size {
                        color: #999;
                        font-size: 0.8rem;
                    }
                    .file-picker-item-star {
                        font-size: 1.5rem;
                        color: #999;
                        cursor: pointer;
                        user-select: none;
                    }
                    .file-picker-item-star.starred {
                        color: #f59e0b;
                    }
                    .file-picker-footer {
                        padding: 1rem 1.5rem;
                        border-top: 1px solid #333;
                        display: flex;
                        gap: 0.75rem;
                        justify-content: flex-end;
                    }
                    .file-picker-footer button {
                        padding: 0.6rem 1.5rem;
                        border-radius: 6px;
                        border: none;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .file-picker-cancel {
                        background: #333;
                        color: #fff;
                    }
                    .file-picker-cancel:hover {
                        background: #444;
                    }
                    .file-picker-play {
                        background: #3b82f6;
                        color: #fff;
                    }
                    .file-picker-play:hover:not(:disabled) {
                        background: #2563eb;
                    }
                    .file-picker-play:disabled {
                        background: #444;
                        color: #666;
                        cursor: not-allowed;
                    }
                </style>
            `;

            mainRegion.appendChild(modal);

            // Track selected files
            const selectedIndices = new Set();
            const playButton = modal.querySelector('.file-picker-play');

            // Update play button state
            const updatePlayButton = () => {
                playButton.disabled = selectedIndices.size === 0;
                playButton.textContent = selectedIndices.size > 1
                    ? `Play ${selectedIndices.size} Files`
                    : 'Play Selected';
            };

            // Handle checkbox changes
            modal.querySelectorAll('.file-picker-item-checkbox input').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const item = e.target.closest('.file-picker-item');
                    const index = parseInt(item.dataset.index);

                    if (e.target.checked) {
                        selectedIndices.add(index);
                        item.classList.add('selected');
                    } else {
                        selectedIndices.delete(index);
                        item.classList.remove('selected');
                    }
                    updatePlayButton();
                });
            });

            // Handle clicking on file info (toggle selection)
            modal.querySelectorAll('.file-picker-item-info').forEach(info => {
                info.addEventListener('click', (e) => {
                    const item = e.target.closest('.file-picker-item');
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });

            // Handle star/favorite
            modal.querySelectorAll('.file-picker-item-star').forEach(star => {
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    star.classList.toggle('starred');
                    star.textContent = star.classList.contains('starred') ? '★' : '☆';
                    // TODO: Save favorite to database
                });
            });

            // Handle close button
            modal.querySelector('.file-picker-close').addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });

            // Handle cancel button
            modal.querySelector('.file-picker-cancel').addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });

            // Handle play button
            playButton.addEventListener('click', () => {
                const indices = Array.from(selectedIndices);
                modal.remove();
                // For now, return first selected index
                // TODO: Support playing multiple files in sequence
                resolve(indices[0]);
            });

            // Handle overlay click
            modal.querySelector('.file-picker-overlay').addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
        });
    }

    /**
     * Extract filename from full path
     * @param {string} path - Full file path
     * @returns {string} Just the filename
     */
    getFileName(path) {
        return path.split('/').pop();
    }

    /**
     * Format bytes to human-readable size
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted size string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    playMovie(movie) {
        console.log('Playing movie:', movie.title);

        // Check if this is a library item with a local file path
        if (movie.file_path) {
            console.log('Playing local library file:', movie.file_path);
            this.playLocalFile(movie);
            return;
        }

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

        // Store movie and torrent info for multi-file detection
        this.currentPlaybackInfo = {
            movie,
            torrent: selectedTorrent,
            quality: selectedQuality
        };

        // Create a basic video player view
        this.showVideoPlayer(movie, selectedTorrent, selectedQuality);
    }

    async playLocalFile(movie) {
        console.log('Playing local file from library:', movie.file_path);

        const mainRegion = document.querySelector('.main-window-region');
        const displayTitle = movie.title.length > 50 ? movie.title.substring(0, 50) + '...' : movie.title;

        // Create simple video player for local files
        mainRegion.innerHTML = `
            <div class="video-player-container" style="background: #000; min-height: 100vh; display: flex; flex-direction: column; position: relative; padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0);">
                <div class="player-header" style="position: relative; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.9); z-index: 100; min-height: 56px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button id="player-back" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; flex-shrink: 0;">←</button>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayTitle}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">Local File${movie.year ? ' • ' + movie.year : ''}</div>
                    </div>
                </div>

                <div id="video-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
                    <video id="local-video"
                           controls
                           autoplay
                           playsinline
                           style="width: 100%; height: 100%; background: #000;">
                        Your browser doesn't support HTML5 video.
                    </video>
                </div>
            </div>
        `;

        // Get video element
        const videoElement = document.getElementById('local-video');

        // Set video source to local file path
        // Use Capacitor Filesystem to get file URI
        try {
            const { Filesystem } = await import('@capacitor/filesystem');
            const fileUri = await Filesystem.getUri({
                path: movie.file_path,
                directory: 'EXTERNAL_STORAGE'
            });

            console.log('File URI:', fileUri.uri);
            videoElement.src = fileUri.uri;
        } catch (error) {
            console.error('Failed to load local file:', error);
            alert('Failed to load video file. File may have been moved or deleted.');
            return;
        }

        // Back button handler
        const playerBackBtn = document.getElementById('player-back');
        playerBackBtn.addEventListener('click', () => {
            this.showLibrary();
        });

        // Android back button handler
        await this.setupBackButtonHandler(() => {
            this.showLibrary();
        });

        // Keep screen awake during playback
        try {
            const { KeepAwake } = await import('@capacitor-community/keep-awake');
            await KeepAwake.keepAwake();
            console.log('Screen will stay awake during playback');
        } catch (e) {
            console.warn('KeepAwake failed:', e.message);
        }
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

    // Show file picker modal for multi-file torrents
    async showFilePickerModal(videoFiles, movie) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background: #1a1a1a; border-radius: 12px; max-width: 600px; width: 100%; max-height: 80vh; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1);';

            const title = `${movie.title || 'Select Video File'}`;
            modal.innerHTML = `
                <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="margin: 0; font-size: 1.25rem; color: #fff;">Select Video File</h2>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #888;">${videoFiles.length} files found in "${title}"</p>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 1rem;">
                    ${videoFiles.map((file, index) => `
                        <div class="file-option" data-index="${index}" style="
                            padding: 1rem;
                            margin-bottom: 0.5rem;
                            background: #2a2a2a;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: background 0.2s, transform 0.1s;
                            border: 2px solid transparent;
                        ">
                            <div style="font-weight: 600; color: #fff; margin-bottom: 0.25rem;">${file.name}</div>
                            <div style="font-size: 0.8rem; color: #888;">
                                ${(file.size / 1024 / 1024).toFixed(1)} MB
                                ${index === 0 ? '<span style="color: #10b981; margin-left: 0.5rem;">• Largest</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button id="file-picker-cancel" style="padding: 0.75rem 1.5rem; background: #333; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">Cancel</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // File option click handlers
            modal.querySelectorAll('.file-option').forEach((option, index) => {
                option.addEventListener('click', () => {
                    overlay.remove();
                    resolve(index);
                });
                option.addEventListener('mouseenter', () => {
                    option.style.background = '#3a3a3a';
                    option.style.borderColor = 'var(--accent-primary)';
                });
                option.addEventListener('mouseleave', () => {
                    option.style.background = '#2a2a2a';
                    option.style.borderColor = 'transparent';
                });
            });

            // Cancel button
            modal.querySelector('#file-picker-cancel').addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(null);
                }
            });
        });
    }

    async showVideoPlayer(movie, torrent, quality) {
        // Prevent concurrent calls - if already loading a stream, ignore
        if (this.isLoadingStream) {
            console.warn('Stream already loading, ignoring duplicate call');
            return;
        }

        try {
            this.isLoadingStream = true; // Set flag to prevent concurrent calls

            // Check and request media permissions before playing video
            try {
                const { Capacitor } = await import('@capacitor/core');

                if (Capacitor.Plugins.MediaPermissions) {
                    console.log('Checking media permissions before video playback...');
                    const checkResult = await Capacitor.Plugins.MediaPermissions.checkPermissions();

                    if (!checkResult.granted) {
                        console.log('Permissions not granted, requesting...');
                        const requestResult = await Capacitor.Plugins.MediaPermissions.requestPermissions();

                        if (!requestResult.granted) {
                            // User denied permissions - show error instead of trying to play
                            this.isLoadingStream = false;
                            const mainRegion = document.querySelector('.main-window-region');
                            mainRegion.innerHTML = `
                                <div class="content-empty">
                                    <div class="empty-icon">🔒</div>
                                    <div class="empty-title">Permission Required</div>
                                    <div class="empty-message">FlixCapacitor needs access to your media files to play videos.</div>
                                    <button class="open-settings-btn" id="video-settings-btn" style="
                                        margin-top: 1.5rem;
                                        padding: 0.875rem 2rem;
                                        background: linear-gradient(135deg, #10b981, #059669);
                                        border: none;
                                        border-radius: 8px;
                                        color: white;
                                        font-size: 1rem;
                                        font-weight: 600;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.5rem;
                                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                                    ">
                                        <span>⚙️</span>
                                        <span>Open Settings</span>
                                    </button>
                                    <div class="empty-message" style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">
                                        Grant "Photos and videos" and "Music and audio" permissions, then try again
                                    </div>
                                </div>
                            `;

                            // Add settings button handler
                            const settingsBtn = document.getElementById('video-settings-btn');
                            if (settingsBtn) {
                                settingsBtn.addEventListener('click', async () => {
                                    try {
                                        await Capacitor.Plugins.MediaPermissions.openSettings();
                                    } catch (error) {
                                        console.error('Failed to open settings:', error);
                                        alert('Please open Settings → Apps → FlixCapacitor → Permissions manually.');
                                    }
                                });
                            }
                            return;
                        }
                    }
                    console.log('Media permissions granted, proceeding with video playback');
                }
            } catch (permError) {
                console.error('Permission check failed:', permError);
                // Continue anyway - might work without explicit permissions
            }

            const mainRegion = document.querySelector('.main-window-region');

            // Truncate title if too long for mobile
            const displayTitle = movie.title.length > 50 ? movie.title.substring(0, 50) + '...' : movie.title;

        // Create initial loading UI with clean, non-overlapping layout
        mainRegion.innerHTML = `
            <div class="video-player-container" style="background: #000; min-height: 100vh; display: flex; flex-direction: column; position: relative; padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0);">
                <!-- Compact header - only back button and truncated title -->
                <div class="player-header" style="position: relative; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.9); z-index: 100; min-height: 56px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button id="player-back" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; flex-shrink: 0;">←</button>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayTitle}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">${quality}${movie.year ? ' • ' + movie.year : ''}</div>
                    </div>
                </div>

                <!-- Video playback controls (hidden until video starts) -->
                <div id="playback-controls" style="display: none; position: absolute; top: 0.75rem; right: 1rem; z-index: 101; gap: 0.5rem;">
                    <button id="speed-btn" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">1x</button>
                    <button id="subtitle-btn" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">CC</button>
                </div>

                <!-- Subtitle selector overlay -->
                <div id="subtitle-selector" style="display: none; position: absolute; top: 3rem; right: 1rem; background: rgba(20,20,20,0.95); border-radius: 8px; padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); max-height: 300px; overflow-y: auto;"></div>

                <!-- Speed selector overlay -->
                <div id="speed-selector" style="display: none; position: absolute; top: 3rem; right: 3.5rem; background: rgba(20,20,20,0.95); border-radius: 8px; padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);">
                    <div class="speed-option" data-speed="0.5" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">0.5x</div>
                    <div class="speed-option" data-speed="0.75" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">0.75x</div>
                    <div class="speed-option active" data-speed="1" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; background: var(--accent-primary); font-size: 0.85rem;">1x</div>
                    <div class="speed-option" data-speed="1.25" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">1.25x</div>
                    <div class="speed-option" data-speed="1.5" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">1.5x</div>
                    <div class="speed-option" data-speed="2" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">2x</div>
                </div>

                <!-- Clean loading state with minimal info -->
                <div class="player-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem;">
                    <!-- Poster/logo if available -->
                    ${movie.images?.poster ? `
                        <div style="width: 120px; height: 180px; border-radius: 8px; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
                            <img src="${movie.images.poster}" alt="${movie.title}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    ` : ''}

                    <!-- Loading spinner -->
                    <div class="loading-spinner-large" style="width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;"></div>

                    <!-- Simple status messages -->
                    <div style="text-align: center; color: rgba(255,255,255,0.9); max-width: 400px;">
                        <h3 id="loading-title" style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 500;">Preparing Stream</h3>
                        <p id="loading-subtitle" style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 1.5rem;">Connecting to peers...</p>

                        <!-- Compact progress info (hidden until downloading) -->
                        <div id="torrent-status" style="display: none; background: rgba(255,255,255,0.05); padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.6; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: rgba(255,255,255,0.6);">Progress</span>
                                <span id="progress-text" style="color: #3b82f6; font-weight: 600;">0%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: rgba(255,255,255,0.6);">Speed</span>
                                <span id="speed-text" style="color: #10b981;">0 MB/s</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: rgba(255,255,255,0.6);">Peers</span>
                                <span id="peers-text" style="color: rgba(255,255,255,0.8);">${torrent.peer || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Video container (hidden until ready) -->
                <div id="video-container" style="display: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
                    <video id="torrent-video"
                           controls
                           autoplay
                           playsinline
                           crossorigin="anonymous"
                           style="width: 100%; height: 100%; background: #000;"
                           poster="${movie.images?.fanart || movie.images?.poster || ''}">
                        Your browser doesn't support HTML5 video.
                    </video>

                    <!-- Compact download progress indicator -->
                    <div id="download-overlay" style="display: none; position: absolute; bottom: 5rem; right: 1rem; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.7rem; z-index: 90; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="download-spinner" style="width: 10px; height: 10px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <div style="color: rgba(255,255,255,0.9);">
                                <span id="dl-progress" style="font-weight: 600;">0%</span>
                                <span style="color: rgba(255,255,255,0.5);"> • </span>
                                <span id="dl-speed" style="color: rgba(255,255,255,0.7);">0 MB/s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .speed-option:hover {
                    background: rgba(255,255,255,0.1);
                }
                #speed-btn:hover, #subtitle-btn:hover {
                    background: rgba(0,0,0,0.9);
                    transform: scale(1.05);
                }
            </style>
        `;

        // Helper function to exit video player
        const exitVideoPlayer = async () => {
            // Save current playback position
            if (this.currentVideoElement && !this.currentVideoElement.paused) {
                this.savePlaybackPosition(movie.imdb_id, this.currentVideoElement.currentTime);
            }

            // CRITICAL: Clean up all event listeners to prevent memory leaks
            console.log(`Cleaning up ${this.videoPlayerCleanup.listeners.length} event listeners`);
            for (const { element, event, handler } of this.videoPlayerCleanup.listeners) {
                if (element && handler) {
                    element.removeEventListener(event, handler);
                }
            }
            this.videoPlayerCleanup.listeners = [];

            // CRITICAL: Clear all intervals to prevent infinite loops
            console.log(`Clearing ${this.videoPlayerCleanup.intervals.length} intervals`);
            for (const intervalId of this.videoPlayerCleanup.intervals) {
                clearInterval(intervalId);
            }
            this.videoPlayerCleanup.intervals = [];

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

        // Helper to track event listeners for cleanup
        const addTrackedListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                this.videoPlayerCleanup.listeners.push({ element, event, handler });
            }
        };

        // Helper to track intervals for cleanup
        const addTrackedInterval = (callback, delay) => {
            const intervalId = setInterval(callback, delay);
            this.videoPlayerCleanup.intervals.push(intervalId);
            return intervalId;
        };

        // Back button handler (stops stream on exit)
        const playerBackBtn = document.getElementById('player-back');
        addTrackedListener(playerBackBtn, 'click', exitVideoPlayer);

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

            const loadingTitle = document.getElementById('loading-title');
            const loadingSubtitle = document.getElementById('loading-subtitle');
            const torrentStatus = document.getElementById('torrent-status');
            const progressText = document.getElementById('progress-text');
            const speedText = document.getElementById('speed-text');
            const peersText = document.getElementById('peers-text');

            // Update initial status
            if (loadingTitle) loadingTitle.textContent = 'Connecting to Torrent';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Finding peers...';

            // Start the native torrent stream with timeout
            let streamInfo;
            let hasVideoError = false; // Track if video player has errored
            let videoSourceSet = false; // Track if video.src has been set

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

                            // Update title based on status
                            if (loadingTitle && status.status === 'downloading') {
                                loadingTitle.textContent = 'Downloading';
                            } else if (loadingTitle && status.status === 'buffering') {
                                loadingTitle.textContent = 'Buffering';
                            }

                            // Update subtitle with peer count or message
                            if (loadingSubtitle && status.message) {
                                loadingSubtitle.textContent = status.message;
                            } else if (loadingSubtitle && status.numPeers !== undefined) {
                                loadingSubtitle.textContent = `${status.numPeers} peer${status.numPeers !== 1 ? 's' : ''} connected`;
                            }

                            // Show progress stats box once downloading starts
                            if (status.progress !== undefined && torrentStatus) {
                                torrentStatus.style.display = 'block';

                                // Update progress percentage
                                if (progressText) {
                                    progressText.textContent = `${Math.round(status.progress * 100)}%`;
                                }

                                // Update download overlay during playback
                                const dlProgress = document.getElementById('dl-progress');
                                if (dlProgress) dlProgress.textContent = `${Math.round(status.progress * 100)}%`;
                            }

                            // Update download speed
                            if (status.downloadSpeed !== undefined && speedText) {
                                const speedMB = (status.downloadSpeed / 1024 / 1024).toFixed(2);
                                speedText.textContent = `${speedMB} MB/s`;

                                // Update download overlay during playback
                                const dlSpeed = document.getElementById('dl-speed');
                                if (dlSpeed) dlSpeed.textContent = `${speedMB} MB/s`;
                            }

                            // Update peer count
                            if (status.numPeers !== undefined) {
                                if (peersText) peersText.textContent = status.numPeers.toString();

                                // Update download overlay during playback
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

                // Multi-file torrent support
                // Check if torrent has multiple video files (e.g., course lectures, TV series)
                const torrentInfo = window.NativeTorrentClient?.currentTorrentInfo;
                if (torrentInfo && torrentInfo.numFiles > 1) {
                    console.log(`⚠️ Multi-file torrent detected: ${torrentInfo.numFiles} files`);

                    // Get video file list
                    try {
                        const videoFiles = await window.NativeTorrentClient.getVideoFileList();
                        if (videoFiles && videoFiles.length > 1) {
                            console.log(`Found ${videoFiles.length} video files - showing file picker`);

                            // Show file picker modal
                            const selectedIndex = await this.showFilePickerModal(videoFiles, movie);
                            if (selectedIndex !== null) {
                                console.log(`User selected file index: ${selectedIndex}`);
                                // File selection will be used for playback
                                // Note: For now, file is already selected by native code
                                // Future: restart stream with selected file
                            } else {
                                console.log('User cancelled file selection, using default (largest file)');
                            }
                        }
                    } catch (error) {
                        console.error('Error getting video file list:', error);
                    }
                }
            } catch (error) {
                console.error('Error starting stream:', error);

                // Show error in UI
                if (loadingTitle) {
                    loadingTitle.textContent = 'Streaming Failed';
                }
                if (loadingSubtitle) {
                    loadingSubtitle.innerHTML = `
                        <strong style="color: #ef4444;">Error:</strong> ${error.message}<br>
                        <span style="font-size: 0.8rem; margin-top: 1rem; display: block; color: rgba(255,255,255,0.7);">
                            • Check if torrent has seeds/peers<br>
                            • Try WiFi instead of mobile data<br>
                            • Some networks block torrents
                        </span>
                    `;
                }
                // Hide spinner
                const spinner = document.querySelector('.loading-spinner-large');
                if (spinner) spinner.style.display = 'none';

                // Hide progress stats box if shown
                if (torrentStatus) torrentStatus.style.display = 'none';

                // Stop here - don't continue to video player
                return;
            }

            // Stream is ready - update loading UI to show buffering in progress
            const loadingContent = document.querySelector('.player-content');
            const videoContainer = document.getElementById('video-container');
            const videoElement = document.getElementById('torrent-video');

            // Update status to show stream is buffering
            if (loadingTitle) loadingTitle.textContent = 'Buffering Video';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Stream ready, loading video...';

            // Show video container (but keep loading UI visible until video loads)
            if (videoContainer) videoContainer.style.display = 'block';

            // CRITICAL FIX: Set video source immediately now that stream is ready
            // The progress callback can't access streamInfo because it runs before Promise resolves
            console.log('Stream URL ready:', streamInfo.streamUrl);
            console.log('Setting video source...');
            if (videoElement && streamInfo.streamUrl) {
                videoElement.src = streamInfo.streamUrl;
                videoSourceSet = true;
            }

            // Handle video errors
            if (videoElement) {
                const errorHandler = (e) => {
                    console.error('Video playback error event:', e.type, e);

                    // CRITICAL: Set error flag to prevent progress updates from overwriting this UI
                    hasVideoError = true;

                    let errorMsg = 'An unexpected error occurred.';
                    let errorCode = 'N/A';
                    if (videoElement.error) {
                        errorCode = videoElement.error.code;
                        switch (videoElement.error.code) {
                            case 1: errorMsg = 'Video loading was aborted.'; break;
                            case 2: errorMsg = 'A network error caused the video download to fail part-way.'; break;
                            case 3: errorMsg = 'Video playback aborted due to corruption or unsupported features (likely codec/format issue).'; break;
                            case 4: errorMsg = 'The video could not be loaded, either due to a server/network issue or an unsupported format.'; break;
                        }
                        if (videoElement.error.message) {
                            errorMsg += ` (${videoElement.error.message})`;
                        }
                    }

                    // Log comprehensive debug information to the console
                    console.error(`
                        --- VIDEO PLAYBACK ERROR ---
                        Error Code: ${errorCode}
                        Error Message: ${errorMsg}
                        Video Source: ${videoElement.currentSrc || (streamInfo ? streamInfo.streamUrl : 'N/A')}
                        Network State: ${videoElement.networkState} (0:EMPTY, 1:IDLE, 2:LOADING, 3:NO_SOURCE)
                        Ready State: ${videoElement.readyState} (0:HAVE_NOTHING, 1:HAVE_METADATA, 2:HAVE_CURRENT_DATA, 3:HAVE_FUTURE_DATA, 4:HAVE_ENOUGH_DATA)
                        --------------------------
                    `);

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
                                This may be due to an unsupported video format (codec) or a network issue.<br>
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
                };
                addTrackedListener(videoElement, 'error', errorHandler);

                // Store video element reference
                this.currentVideoElement = videoElement;

                // Handle video metadata
                const metadataHandler = () => {
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

                        // BUG-006 FIX: Track resume dialog button listeners
                        const resumeContinueBtn = document.getElementById('resume-continue');
                        const resumeStartOverBtn = document.getElementById('resume-start-over');

                        const resumeContinueHandler = () => {
                            videoElement.currentTime = savedPosition;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log(`Resuming from ${Math.floor(savedPosition)}s`);
                        };
                        addTrackedListener(resumeContinueBtn, 'click', resumeContinueHandler);

                        const resumeStartOverHandler = () => {
                            videoElement.currentTime = 0;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log('Starting from beginning');
                        };
                        addTrackedListener(resumeStartOverBtn, 'click', resumeStartOverHandler);

                        // BUG-010 FIX: Track auto-resume timeout
                        const autoResumeTimeout = setTimeout(() => {
                            if (document.getElementById('resume-dialog')) {
                                videoElement.currentTime = savedPosition;
                                videoElement.play();
                                resumeDialog.remove();
                                console.log('Auto-resumed after timeout');
                            }
                        }, 10000);
                        this.videoPlayerCleanup.intervals.push(autoResumeTimeout);
                    }

                    // Show fullscreen button
                    const fullscreenBtn = document.getElementById('fullscreen-btn');
                    if (fullscreenBtn && document.fullscreenEnabled) {
                        fullscreenBtn.style.display = 'flex';
                    }
                };
                addTrackedListener(videoElement, 'loadedmetadata', metadataHandler);

                // Handle video loaded - ONLY NOW hide loading UI
                const loadeddataHandler = () => {
                    console.log('Video loaded and ready to play');

                    // Fade out loading UI
                    if (loadingContent) {
                        loadingContent.style.transition = 'opacity 0.3s ease';
                        loadingContent.style.opacity = '0';
                        setTimeout(() => {
                            loadingContent.style.display = 'none';
                        }, 300);
                    }

                    // Show playback controls (speed and subtitle buttons)
                    const playbackControls = document.getElementById('playback-controls');
                    if (playbackControls) {
                        playbackControls.style.display = 'flex';
                    }

                    // Show download overlay during playback (hide when download complete)
                    const downloadOverlay = document.getElementById('download-overlay');
                    if (downloadOverlay) {
                        downloadOverlay.style.display = 'block';

                        // Hide overlay when download is complete (100%) - BUG-002 FIX: Track interval
                        addTrackedInterval(() => {
                            const dlProgress = document.getElementById('dl-progress');
                            if (dlProgress && dlProgress.textContent.includes('100%')) {
                                setTimeout(() => {
                                    downloadOverlay.style.transition = 'opacity 0.3s ease';
                                    downloadOverlay.style.opacity = '0';
                                    setTimeout(() => {
                                        downloadOverlay.style.display = 'none';
                                    }, 300);
                                }, 2000); // Keep visible for 2s after completion
                                // Note: Interval will be cleared when player exits via cleanup
                            }
                        }, 500);
                    }
                };
                addTrackedListener(videoElement, 'loadeddata', loadeddataHandler);

                // Save playback position periodically
                const timeupdateHandler = () => {
                    if (!videoElement.paused && videoElement.currentTime > 10) {
                        this.savePlaybackPosition(movie.imdb_id, videoElement.currentTime);
                    }
                };
                addTrackedListener(videoElement, 'timeupdate', timeupdateHandler);

                // BUG-007 FIX: Properly await and handle async pause/resume
                const pauseHandler = async () => {
                    if (window.NativeTorrentClient) {
                        try {
                            await window.NativeTorrentClient.pauseStream();
                        } catch (e) {
                            console.warn('Failed to pause torrent stream:', e);
                            // Non-critical - video pause still works
                        }
                    }
                };
                addTrackedListener(videoElement, 'pause', pauseHandler);

                const playHandler = async () => {
                    if (window.NativeTorrentClient) {
                        try {
                            await window.NativeTorrentClient.resumeStream();
                        } catch (e) {
                            console.warn('Failed to resume torrent stream:', e);
                            // Non-critical - video play still works
                        }
                    }
                };
                addTrackedListener(videoElement, 'play', playHandler);

                // Subtitle selection
                const subtitleBtn = document.getElementById('subtitle-btn');
                const subtitleSelector = document.getElementById('subtitle-selector');

                if (subtitleBtn && subtitleSelector) {
                    subtitleBtn.style.display = 'flex';

                    const subtitleBtnHandler = async () => {
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
                                    const optionClickHandler = () => {
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
                                        // BUG-005 FIX: Add safety check for textTracks
                                        if (videoElement.textTracks && videoElement.textTracks.length > 0) {
                                            videoElement.textTracks[0].mode = 'showing';
                                        }
                                        subtitleSelector.style.display = 'none';
                                    };
                                    addTrackedListener(option, 'click', optionClickHandler);
                                    subtitleSelector.appendChild(option);
                                }
                            } else {
                                subtitleSelector.innerHTML = '<div>No subtitles found</div>';
                            }
                        } else {
                            subtitleSelector.style.display = 'none';
                        }
                    };
                    addTrackedListener(subtitleBtn, 'click', subtitleBtnHandler);
                }
                const speedBtn = document.getElementById('speed-btn');
                const speedSelector = document.getElementById('speed-selector');
                if (speedBtn && speedSelector) {
                    speedBtn.style.display = 'flex';

                    const speedBtnHandler = () => {
                        speedSelector.style.display = speedSelector.style.display === 'none' ? 'block' : 'none';
                    };
                    addTrackedListener(speedBtn, 'click', speedBtnHandler);

                    document.querySelectorAll('.speed-option').forEach(option => {
                        const speedClickHandler = () => {
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
                        };
                        addTrackedListener(option, 'click', speedClickHandler);

                        // Hover effect
                        const mouseenterHandler = () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'rgba(255,255,255,0.1)';
                            }
                        };
                        addTrackedListener(option, 'mouseenter', mouseenterHandler);

                        const mouseleaveHandler = () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'transparent';
                            }
                        };
                        addTrackedListener(option, 'mouseleave', mouseleaveHandler);
                    });

                    // Close selector when clicking outside - CRITICAL: Document-level listener
                    const documentClickHandler = (e) => {
                        if (!speedBtn.contains(e.target) && !speedSelector.contains(e.target)) {
                            speedSelector.style.display = 'none';
                        }
                    };
                    addTrackedListener(document, 'click', documentClickHandler);
                }

                // Picture-in-Picture toggle
                const pipBtn = document.getElementById('pip-btn');
                if (pipBtn && document.pictureInPictureEnabled) {
                    pipBtn.style.display = 'flex';

                    const pipClickHandler = async () => {
                        try {
                            if (document.pictureInPictureElement) {
                                await document.exitPictureInPicture();
                            } else {
                                await videoElement.requestPictureInPicture();
                            }
                        } catch (e) {
                            console.warn('PiP not available:', e);
                        }
                    };
                    addTrackedListener(pipBtn, 'click', pipClickHandler);

                    // Update button when PiP state changes
                    const pipEnterHandler = () => {
                        pipBtn.style.background = 'var(--accent-primary)';
                    };
                    addTrackedListener(videoElement, 'enterpictureinpicture', pipEnterHandler);

                    const pipLeaveHandler = () => {
                        pipBtn.style.background = 'rgba(255,255,255,0.1)';
                    };
                    addTrackedListener(videoElement, 'leavepictureinpicture', pipLeaveHandler);
                }

                // Fullscreen toggle handler
                const fullscreenBtn = document.getElementById('fullscreen-btn');
                if (fullscreenBtn) {
                    const fullscreenClickHandler = async () => {
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
                    };
                    addTrackedListener(fullscreenBtn, 'click', fullscreenClickHandler);
                }

                // Touch gesture controls for volume and brightness
                let startY = 0;
                let startX = 0;
                let isVerticalGesture = false;
                let isLeftSide = false;

                const touchstartHandler = (e) => {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        startY = touch.clientY;
                        startX = touch.clientX;
                        isLeftSide = touch.clientX < window.innerWidth / 2;
                    }
                };
                addTrackedListener(videoElement, 'touchstart', touchstartHandler);

                const touchmoveHandler = (e) => {
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
                };
                addTrackedListener(videoElement, 'touchmove', touchmoveHandler);

                const touchendHandler = () => {
                    isVerticalGesture = false;
                };
                addTrackedListener(videoElement, 'touchend', touchendHandler);

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

                const videoClickHandler = (e) => {
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
                };
                addTrackedListener(videoElement, 'click', videoClickHandler);
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
    } catch (error) {
        console.error('Video player error:', error);

        // Show error in UI without triggering global handler
        const loadingTitle = document.getElementById('loading-title');
        const loadingSubtitle = document.getElementById('loading-subtitle');
        const spinner = document.querySelector('.loading-spinner-large');

        if (loadingTitle) loadingTitle.textContent = 'Playback Error';
        if (loadingSubtitle) {
            loadingSubtitle.innerHTML = `
                <strong style="color: #ef4444;">Error:</strong> ${error.message}<br>
                <span style="font-size: 0.8rem; margin-top: 1rem; display: block; color: rgba(255,255,255,0.7);">
                    • Try selecting a different quality or torrent<br>
                    • Check torrent health (seeds/peers)<br>
                    • Ensure your internet connection is stable
                </span>
            `;
        }
        if (spinner) spinner.style.display = 'none';
    } finally {
        this.isLoadingStream = false; // Always reset flag
    }
}

    // Helper: Format bytes to human readable
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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
