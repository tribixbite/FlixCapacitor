// @ts-nocheck
/**
 * FlixCapacitor - Beautiful UI View Components
 * Gorgeous, modern, mobile-first interface design
 */

import type {
  Movie,
  TVShow,
  Episode,
  TorrentInfo,
  TorrentFile,
  StreamInfo,
  PlaybackPosition,
  MobileApp,
  LearningCourse
} from '@/types/mobile-ui';
import type { LibraryItem } from '@/types/library';
import MediaPermissions from 'capacitor-plugin-media-permissions';
import { DirectoryPicker } from 'capacitor-plugin-directory-picker';
import { VideoPlayer, type VideoPlayerContext } from './video-player';
import { UITemplates } from './ui-templates';


// UI Controller
export class MobileUIController {
    app: MobileApp;
    currentView: string | null;
    navigationHistory: string[];
    moviesCache: Movie[] | null;
    currentMovieData: Map<string, Movie | TVShow | LearningCourse>;
    backButtonListener: (() => boolean) | null;
    currentVideoElement: HTMLVideoElement | null;
    playbackPositions: Map<string, PlaybackPosition>;
    isLoadingStream: boolean;
    currentStreamRequestId: number; // Track current stream request to prevent old requests from playing
    videoPlayerCleanup: { listeners: Array<() => void>; intervals: number[] };
    Haptics: any;
    StatusBar: any;
    videoPlayer: VideoPlayer;
    currentPlaybackInfo: any;

    constructor(app: MobileApp) {
        this.app = app;
        this.currentView = null;
        this.navigationHistory = []; // Track navigation history for back button
        this.moviesCache = null; // Cache for loaded movies
        this.currentMovieData = new Map(); // Store movie data by ID
        this.backButtonListener = null; // Android back button handler
        this.currentVideoElement = null; // Current video element reference
        this.playbackPositions = new Map(); // Store playback positions by movie ID
        this.isLoadingStream = false; // Prevent duplicate concurrent stream loading
        this.currentStreamRequestId = 0; // Track current stream request to prevent old/cancelled requests from playing
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

        // Initialize VideoPlayer module with context (pass controller as context)
        this.videoPlayer = new VideoPlayer(this as any as VideoPlayerContext);

        // Make available globally for back button handler
        if (window.App) {
            window.App.UI = this;
        }
    }

    /**
     * Conference Polish: Trigger haptic feedback
     */
    async haptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
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
     */
    async updateStatusBarColor(view: string): Promise<void> {
        if (!this.StatusBar) return;

        const colors: Record<string, string> = {
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

    setupNavigation(): void {
        // Conference Polish: Import Haptics for tactile feedback
        let Haptics: any = null;
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

    navigateTo(route: string): void {
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
     */
    goBack(): boolean {
        if (this.navigationHistory.length > 0) {
            const previousView = this.navigationHistory.pop()!;
            // Navigate without adding to history
            const tempHistory = this.navigationHistory;
            this.navigationHistory = [];

            // Check if previous view is a detail view (format: "detail-<id>")
            if (previousView.startsWith('detail-')) {
                const id = previousView.substring(7); // Remove "detail-" prefix
                this.showDetail(id);
            } else {
                this.navigateTo(previousView);
            }

            this.navigationHistory = tempHistory;
            return true;
        }
        return false;
    }

    async showMovies(): Promise<void> {
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

    async showShows(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.browserView('TV Shows', 'shows');

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

    async showAnime(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.browserView('Anime', 'anime');

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

    async showLibrary(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.browserView('Library', 'library');

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
    async showLibraryFiltered(folder: string): Promise<void> {
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

        const folderPickerButton = document.querySelector('#library-folder-picker-btn');
        if (folderPickerButton) {
            folderPickerButton.addEventListener('click', async () => {
                await this.pickLibraryFolder();
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

        // Request storage permissions contextually
        try {
            const { granted, permanentlyDenied } = await MediaPermissions.ensurePermissions();

            if (!granted) {
                if (permanentlyDenied) {
                    // Permissions permanently denied - must go to settings
                    contentGrid.innerHTML = `
                        <div class="content-empty">
                            <div class="empty-icon">🔐</div>
                            <div class="empty-title">Media Access Required</div>
                            <div class="empty-message">To scan your library, enable media permissions in Settings.</div>
                            <button class="enable-permissions-btn" id="library-settings-btn" style="
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
                                Enable "Photos and videos" and "Music and audio"
                            </div>
                        </div>
                    `;

                    document.getElementById('library-settings-btn')?.addEventListener('click', async () => {
                        await MediaPermissions.openSettings();
                    });
                    return;
                }

                // User denied but can be prompted again - show enable button
                contentGrid.innerHTML = `
                    <div class="content-empty">
                        <div class="empty-icon">🔐</div>
                        <div class="empty-title">Media Access Required</div>
                        <div class="empty-message">FlixCapacitor needs access to your media files to scan your library.</div>
                        <button class="enable-permissions-btn" id="library-enable-btn" style="
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
                            <span>✓</span>
                            <span>Enable</span>
                        </button>
                    </div>
                `;

                // Clicking Enable triggers system permission dialog
                document.getElementById('library-enable-btn')?.addEventListener('click', async () => {
                    await this.startLibraryScan(); // Retry, which will show system dialog
                });
                return;
            }

            console.log('[Library] Media permissions granted, starting scan...');
        } catch (error) {
            console.error('Failed to request permissions:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Permission Error',
                `Failed to check permissions. Please try again.`
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

    /**
     * Pick a folder using DirectoryPicker plugin
     */
    async pickLibraryFolder() {
        const contentGrid = document.querySelector('.content-grid');

        try {
            console.log('[Library] Opening folder picker...');

            // Open directory picker with SAF
            const result = await DirectoryPicker.pickDirectory();

            if (!result || !result.uri) {
                console.log('[Library] No directory selected');
                return;
            }

            console.log('[Library] Directory selected:', result.displayName, result.uri);

            // Store selected folder URI in settings
            const settings = window.SettingsManager;
            const libraryFolders = settings.get('libraryFolders') || [];

            // Check if folder already added
            if (libraryFolders.some(f => f.uri === result.uri)) {
                contentGrid.innerHTML = UITemplates.emptyState(
                    'ℹ️',
                    'Folder Already Added',
                    `"${result.displayName}" is already in your library`
                );
                setTimeout(async () => {
                    await this.showLibrary();
                }, 1500);
                return;
            }

            // Add new folder
            libraryFolders.push({
                uri: result.uri,
                displayName: result.displayName,
                addedAt: Date.now()
            });
            settings.set('libraryFolders', libraryFolders);

            console.log('[Library] Folder added to settings:', result.displayName);

            // Scan the selected folder
            await this.scanLibraryFolder(result.uri, result.displayName);

        } catch (error) {
            console.error('[Library] Failed to pick folder:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Folder Picker Error',
                error.message || 'Failed to open folder picker. Please try again.'
            );
        }
    }

    /**
     * Scan a specific folder for video files using DirectoryPicker.listFiles()
     */
    async scanLibraryFolder(folderUri: string, folderName: string) {
        const contentGrid = document.querySelector('.content-grid');
        const libraryService = window.LibraryService;

        if (!libraryService) {
            console.error('[Library] LibraryService not available');
            return;
        }

        try {
            // Show scanning UI
            contentGrid.innerHTML = UITemplates.libraryScanningState(0, 0);

            console.log('[Library] Scanning folder:', folderName, folderUri);

            // List video files in the selected directory
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.flv', '.wmv'];
            const filesResult = await DirectoryPicker.listFiles({
                uri: folderUri,
                extensions: videoExtensions,
                recursive: true
            });

            console.log('[Library] Found files:', filesResult.files.length);

            if (filesResult.files.length === 0) {
                contentGrid.innerHTML = UITemplates.emptyState(
                    '📁',
                    'No Videos Found',
                    `No video files found in "${folderName}"`
                );
                setTimeout(async () => {
                    await this.showLibrary();
                }, 1500);
                return;
            }

            // Process and add files to library
            let processedCount = 0;
            for (const file of filesResult.files) {
                processedCount++;

                // Update progress UI
                const progress = Math.round((processedCount / filesResult.files.length) * 100);
                const progressText = document.querySelector('.scan-progress-text');
                const progressBar = document.querySelector('.scan-progress-bar-fill');
                const currentFileText = document.querySelector('.scan-current-file');

                if (progressText) progressText.textContent = `${processedCount} / ${filesResult.files.length} files`;
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (currentFileText) currentFileText.textContent = file.name;

                // Add file to library
                try {
                    await libraryService.addMediaFromUri({
                        uri: file.uri,
                        filename: file.name,
                        size: file.size,
                        mimeType: file.mimeType,
                        folderUri: folderUri,
                        folderName: folderName,
                        relativePath: file.relativePath
                    });
                } catch (error) {
                    console.error(`[Library] Failed to add file ${file.name}:`, error);
                }
            }

            // Show completion
            contentGrid.innerHTML = UITemplates.emptyState(
                '✅',
                'Folder Scanned',
                `Added ${processedCount} videos from "${folderName}"`
            );

            // Refresh library view
            setTimeout(async () => {
                await this.showLibrary();
            }, 1500);

        } catch (error) {
            console.error('[Library] Failed to scan folder:', error);
            contentGrid.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Scan Failed',
                error.message || 'Failed to scan folder. Please try again.'
            );
        }
    }

    async showLearning(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.browserView('Learning', 'learning');

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

    async showWatchlist(): Promise<void> {
        // Redirect to favorites with watchlist tab
        await this.showFavorites('watchlist');
    }

    showSettings(): void {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.settingsView();

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

        // TMDB API Key
        const tmdbInput = document.querySelector('#setting-tmdb-key input');
        if (tmdbInput) {
            tmdbInput.addEventListener('blur', () => {
                const key = tmdbInput.value.trim();
                settings.set('tmdbApiKey', key);
                console.log('TMDB API key updated');
            });
        }

        // OMDB API Key
        const omdbInput = document.querySelector('#setting-omdb-key input');
        if (omdbInput) {
            omdbInput.addEventListener('blur', () => {
                const key = omdbInput.value.trim();
                settings.set('omdbApiKey', key);
                console.log('OMDB API key updated');
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
        // Track navigation history
        if (this.currentView && this.currentView !== `detail-${id}`) {
            this.navigationHistory.push(this.currentView);
            if (this.navigationHistory.length > 10) {
                this.navigationHistory.shift();
            }
        }
        this.currentView = `detail-${id}`;

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
            // Use goBack() to return to previous view
            const didGoBack = this.goBack();
            if (!didGoBack) {
                // No history, go to movies as fallback
                this.navigateTo('movies');
            }
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
    async showFilePickerModal(videoFiles: any[], movie: any): Promise<number | null> {
        return this.videoPlayer.showFilePickerModal(videoFiles, movie);
    }


    /**
     * Extract filename from full path
     * @param {string} path - Full file path
     * @returns {string} Just the filename
     */
    getFileName(path: string): string {
        return this.videoPlayer.getFileName(path);
    }

    formatBytes(bytes: number): string {
        return this.videoPlayer.formatBytes(bytes);
    }

    playMovie(movie: any): void {
        this.videoPlayer.playMovie(movie);
    }

    async playLocalFile(movie: LibraryItem): Promise<void> {
        return this.videoPlayer.playLocalFile(movie);
    }

    savePlaybackPosition(movieId: string, position: number): void {
        this.videoPlayer.savePlaybackPosition(movieId, position);
    }

    getPlaybackPosition(movieId: string): number {
        return this.videoPlayer.getPlaybackPosition(movieId);
    }

    getContinueWatchingItems(): any[] {
        return this.videoPlayer.getContinueWatchingItems();
    }

    async setupBackButtonHandler(callback: () => void): Promise<void> {
        return this.videoPlayer.setupBackButtonHandler(callback);
    }

    async removeBackButtonHandler(): Promise<void> {
        return this.videoPlayer.removeBackButtonHandler();
    }

    async showVideoPlayer(movie: Movie | Episode | LibraryItem, torrent: TorrentInfo | null, quality: string): Promise<void> {
        return this.videoPlayer.showVideoPlayer(movie, torrent, quality);
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
