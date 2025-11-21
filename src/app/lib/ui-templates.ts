/**
 * FlixCapacitor - UI Template Module
 *
 * Extracted from mobile-ui-views.ts
 * Contains all HTML template generation functions
 * Uses Tailwind CSS classes from main.css
 */

// Component styles now defined in src/app/css/main.css using Tailwind
// No inline styles needed - all classes are mobile-first responsive with:
// - Responsive grids (2 cols mobile -> 6 cols desktop)
// - Touch-friendly tap targets (44x44px minimum)
// - Safe area insets for notches/rounded corners

// UI Component Templates
export const UITemplates = {
    // Movies/Shows Browser
    browserView: (title: string, category = 'movies') => `
        
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
    contentCard: (item: any) => {
        // Get torrent health from best available quality
        const torrents = item.torrents || {};
        const qualities = ['1080p', '720p', '480p'];
        let torrentHealth: { seeds: number; peers: number } | null = null;

        for (const quality of qualities) {
            const torrent = torrents[quality];
            if (torrent) {
                torrentHealth = {
                    seeds: (torrent as any).seed || 0,
                    peers: (torrent as any).peer || 0
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
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
                ${item.quality ? `<div class="content-card-badge hd">${item.quality}</div>` : ''}
                ${torrentHealth ? `
                    <div class="content-card-health" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 3px 6px; border-radius: 4px; font-size: 0.65rem; display: flex; align-items: center; gap: 4px; z-index: 15;">
                        <span style="color: ${healthColor}; font-size: 0.5rem;">●</span>
                        <span style="color: #10b981;">↑${torrentHealth.seeds}</span>
                        <span style="color: #6b7280;">↓${torrentHealth.peers}</span>
                    </div>
                ` : ''}
                <div class="content-card-overlay">
                    <div class="content-card-title">${item.title}</div>
                    <div class="content-card-meta">
                        ${item.rating?.percentage ? `
                            <div class="content-card-rating">
                                <span style="font-size: 0.65rem;">⭐</span>
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
    contentGrid: (items: any[]) => `
        ${items.map((item: any) => UITemplates.contentCard(item)).join('')}
    `,

    // Loading State
    loadingState: (message = 'Loading...') => `
        <div class="content-loading">
            <div class="loading-spinner-large"></div>
            <div class="loading-text">${message}</div>
        </div>
    `,

    // Continue Watching Section
    continueWatchingSection: (items: any[]) => {
        if (!items || items.length === 0) return '';

        return `
            <div class="continue-watching-section" style="padding: 1rem; padding-top: 0.5rem;">
                <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">Continue Watching</h2>
                <div class="continue-watching-scroll" style="display: flex; gap: 1rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 1rem; scrollbar-width: none;">
                    ${items.map((item: any) => {
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
    emptyState: (icon: string, title: string, message: string) => `
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
            <div class="empty-message">Choose folders or scan your device for local media files</div>
            <div class="library-action-buttons">
                <button class="library-folder-picker-btn" id="library-folder-picker-btn">
                    <span>📂</span>
                    <span>Choose Folders</span>
                </button>
                <button class="library-scan-btn" id="library-scan-btn">
                    <span>🔍</span>
                    <span>Quick Scan</span>
                </button>
            </div>
        </div>
        <style>
        .library-action-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        .library-folder-picker-btn,
        .library-scan-btn {
            padding: 0.875rem 2rem;
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
        .library-folder-picker-btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }
        .library-scan-btn {
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        }
        .library-folder-picker-btn:active,
        .library-scan-btn:active {
            transform: scale(0.95);
        }
        </style>
    `,

    // Library Scanning State
    libraryScanningState: (current: number, total: number) => `
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
    detailView: (item: any) => `
        
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
                            ${Object.entries(item.torrents).map(([quality, torrent]: [string, any]) => {
                                const seedHealth = torrent.seed > 100 ? 'excellent' : torrent.seed > 50 ? 'good' : torrent.seed > 20 ? 'fair' : 'poor';
                                const healthColor = seedHealth === 'excellent' ? '#10b981' : seedHealth === 'good' ? '#22c55e' : seedHealth === 'fair' ? '#f59e0b' : '#ef4444';

                                return `
                                    <div class="torrent-option" style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1); min-height: 88px;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                            <div>
                                                <div style="font-weight: 600; font-size: 1.25rem; margin-bottom: 0.375rem;">${quality}</div>
                                                <div style="font-size: 1rem; color: rgba(255,255,255,0.7); font-weight: 500;">${torrent.size || 'Unknown size'}</div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 0.875rem; color: ${healthColor}; font-weight: 700; text-transform: uppercase; margin-bottom: 0.375rem;">${seedHealth}</div>
                                                <div style="font-size: 1rem; color: rgba(255,255,255,0.7); font-weight: 600;">
                                                    <span style="color: #10b981;">↑ ${torrent.seed || 0}</span> •
                                                    <span style="color: #3b82f6;">↓ ${torrent.peer || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button class="add-to-collection-btn tap-target"
                                                data-info-hash="${torrent.hash || ''}"
                                                data-torrent-name="${item.title || 'Unknown'}"
                                                data-quality="${quality}"
                                                data-size="${torrent.size || ''}"
                                                data-seeders="${torrent.seed || 0}"
                                                style="margin-top: 0.75rem; width: 100%; padding: 0.875rem 1.25rem; min-height: 48px;
                                                       background: rgba(59, 130, 246, 0.1); color: rgb(59, 130, 246);
                                                       border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-sm);
                                                       font-weight: 600; font-size: 1rem; cursor: pointer;
                                                       transition: all 0.2s;">
                                            📚 Add to Collection
                                        </button>
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
        const tmdbApiKey = settings.get('tmdbApiKey') || '';
        const omdbApiKey = settings.get('omdbApiKey') || '';

        // Get current theme
        const currentTheme = window.ThemeManager?.getCurrentTheme?.() || 'dark';

        return `

            <div class="settings-view">
                <div class="settings-header">
                    <h1 class="settings-title">Settings</h1>
                </div>
                <div class="settings-content">
                    <!-- Theme Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Appearance</div>
                        <div class="settings-item" id="setting-theme-toggle">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Theme</div>
                                <div class="settings-item-description">Choose light or dark mode</div>
                            </div>
                            <button id="theme-toggle-btn" class="btn-secondary tap-target">
                                ${currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                            </button>
                        </div>
                    </div>

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
                        <div class="settings-section-title">API Keys</div>
                        <div class="settings-item" id="setting-tmdb-key">
                            <div class="settings-item-content">
                                <div class="settings-item-label">TMDB API Key</div>
                                <div class="settings-item-description">For movie metadata and images</div>
                            </div>
                            <input type="text"
                                   class="settings-input"
                                   value="${tmdbApiKey}"
                                   placeholder="Enter TMDB API key..."
                                   style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                        </div>
                        <div class="settings-item" id="setting-omdb-key">
                            <div class="settings-item-content">
                                <div class="settings-item-label">OMDB API Key</div>
                                <div class="settings-item-description">For additional movie ratings and metadata</div>
                            </div>
                            <input type="text"
                                   class="settings-input"
                                   value="${omdbApiKey}"
                                   placeholder="Enter OMDB API key..."
                                   style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 8px; color: white; width: 100%; max-width: 300px; font-size: 0.9rem;">
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">Custom API Endpoints</div>
                        <div id="custom-endpoints-list" style="margin-bottom: 1rem;">
                            ${customEndpoints.map((ep: any) => `
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

                    <!-- Phase 11D: Battery Settings Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Battery & Power</div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">WiFi-Only Downloads</div>
                                <div class="settings-item-description">Pause downloads when not on WiFi</div>
                            </div>
                            <div class="toggle-switch" id="battery-wifi-only-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Pause on Low Battery</div>
                                <div class="settings-item-description">Stop downloads below 20% battery</div>
                            </div>
                            <div class="toggle-switch" id="battery-pause-low-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Throttle on Battery Saver</div>
                                <div class="settings-item-description">Reduce speeds when battery saver is active</div>
                            </div>
                            <div class="toggle-switch" id="battery-throttle-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Reduce Quality on Critical Battery</div>
                                <div class="settings-item-description">Use lower quality below 10% battery</div>
                            </div>
                            <div class="toggle-switch" id="battery-reduce-quality-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Current Battery Status</div>
                                <div class="settings-item-description" id="battery-status-text">Loading...</div>
                            </div>
                            <div class="settings-item-value" id="battery-level-value">--</div>
                        </div>
                    </div>

                    <!-- Phase 11D: Network Settings Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Network & Cache</div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Enable Request Cache</div>
                                <div class="settings-item-description">Cache API requests for faster loading</div>
                            </div>
                            <div class="toggle-switch active" id="network-cache-toggle">
                                <div class="toggle-switch-thumb"></div>
                            </div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Cache TTL (minutes)</div>
                                <div class="settings-item-description">How long to keep cached data</div>
                            </div>
                            <input type="range" id="network-cache-ttl-slider" min="1" max="60" value="5"
                                   style="width: 150px;" class="settings-slider">
                            <span id="network-cache-ttl-value" class="settings-item-value">5</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Retry Attempts</div>
                                <div class="settings-item-description">Number of retries for failed requests</div>
                            </div>
                            <input type="range" id="network-retry-slider" min="1" max="5" value="3"
                                   style="width: 150px;" class="settings-slider">
                            <span id="network-retry-value" class="settings-item-value">3</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Request Timeout (seconds)</div>
                                <div class="settings-item-description">Maximum wait time for requests</div>
                            </div>
                            <input type="range" id="network-timeout-slider" min="10" max="60" value="30"
                                   style="width: 150px;" class="settings-slider">
                            <span id="network-timeout-value" class="settings-item-value">30</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Cache Statistics</div>
                                <div class="settings-item-description" id="network-cache-stats">Loading...</div>
                            </div>
                            <button id="network-clear-cache-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                Clear Cache
                            </button>
                        </div>
                    </div>

                    <!-- Phase 11D: Memory Settings Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Memory & Storage</div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Image Cache Size (MB)</div>
                                <div class="settings-item-description">Memory cache for movie posters</div>
                            </div>
                            <input type="range" id="memory-image-cache-slider" min="10" max="200" value="50" step="10"
                                   style="width: 150px;" class="settings-slider">
                            <span id="memory-image-cache-value" class="settings-item-value">50</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Disk Cache Size (MB)</div>
                                <div class="settings-item-description">Storage cache for metadata</div>
                            </div>
                            <input type="range" id="memory-disk-cache-slider" min="50" max="500" value="100" step="50"
                                   style="width: 150px;" class="settings-slider">
                            <span id="memory-disk-cache-value" class="settings-item-value">100</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Memory Usage</div>
                                <div class="settings-item-description" id="memory-usage-text">Loading...</div>
                            </div>
                            <button id="memory-clear-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                Clear Caches
                            </button>
                        </div>
                    </div>

                    <!-- Phase 11D: Download Settings Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Downloads & Streaming</div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Concurrent Downloads</div>
                                <div class="settings-item-description">Number of simultaneous downloads</div>
                            </div>
                            <input type="range" id="download-concurrent-slider" min="1" max="5" value="3"
                                   style="width: 150px;" class="settings-slider">
                            <span id="download-concurrent-value" class="settings-item-value">3</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Download Speed Limit (KB/s)</div>
                                <div class="settings-item-description">0 = unlimited</div>
                            </div>
                            <input type="range" id="download-speed-slider" min="0" max="10000" value="0" step="500"
                                   style="width: 150px;" class="settings-slider">
                            <span id="download-speed-value" class="settings-item-value">Unlimited</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Upload Speed Limit (KB/s)</div>
                                <div class="settings-item-description">Seeding speed limit (0 = unlimited)</div>
                            </div>
                            <input type="range" id="upload-speed-slider" min="0" max="1000" value="100" step="50"
                                   style="width: 150px;" class="settings-slider">
                            <span id="upload-speed-value" class="settings-item-value">100</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Auto Cleanup (days)</div>
                                <div class="settings-item-description">Remove old downloads after N days</div>
                            </div>
                            <input type="range" id="download-cleanup-slider" min="1" max="30" value="7"
                                   style="width: 150px;" class="settings-slider">
                            <span id="download-cleanup-value" class="settings-item-value">7</span>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-label">Seed Ratio Limit</div>
                                <div class="settings-item-description">Stop seeding after ratio (0 = unlimited)</div>
                            </div>
                            <input type="range" id="download-seed-ratio-slider" min="0" max="5" value="2" step="0.5"
                                   style="width: 150px;" class="settings-slider">
                            <span id="download-seed-ratio-value" class="settings-item-value">2.0</span>
                        </div>
                    </div>

                    <!-- Phase 12B: Cloud Account & Sync Section -->
                    <div class="settings-section">
                        <div class="settings-section-title">Cloud Account & Sync</div>
                        <div id="cloud-account-section">
                            <!-- User info section (shown when signed in) -->
                            <div id="cloud-user-info" style="display: none;">
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">Account</div>
                                        <div class="settings-item-description" id="cloud-user-email">Loading...</div>
                                    </div>
                                    <button id="sign-out-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                        Sign Out
                                    </button>
                                </div>
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">Sync Favorites</div>
                                        <div class="settings-item-description">Backup favorites to cloud</div>
                                    </div>
                                    <button id="sync-favorites-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                        ☁️ Sync Now
                                    </button>
                                </div>
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">Sync Settings</div>
                                        <div class="settings-item-description">Backup settings to cloud</div>
                                    </div>
                                    <button id="sync-settings-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                        ☁️ Sync Now
                                    </button>
                                </div>
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">Restore from Cloud</div>
                                        <div class="settings-item-description">Pull favorites & settings from cloud</div>
                                    </div>
                                    <button id="restore-from-cloud-btn" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                                        📥 Restore
                                    </button>
                                </div>
                            </div>
                            <!-- Sign in button (shown when not signed in) -->
                            <div id="cloud-sign-in-section" style="display: block;">
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-label">Sign In</div>
                                        <div class="settings-item-description">Cloud backup for favorites & settings</div>
                                    </div>
                                    <button id="sign-in-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                        🔐 Sign In
                                    </button>
                                </div>
                                <div class="settings-item">
                                    <div class="settings-item-content">
                                        <div class="settings-item-description" style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">
                                            Sign in to enable cloud backup, cross-device sync, and collection sharing.
                                        </div>
                                    </div>
                                </div>
                            </div>
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
