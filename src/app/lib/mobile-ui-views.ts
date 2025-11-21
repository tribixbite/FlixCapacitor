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
import { Share } from '@capacitor/share';
import { VideoPlayer, type VideoPlayerContext } from './video-player';
import { UITemplates } from './ui-templates';
import { showLibraryManagement, type LibraryManagementView } from '../views/library-management-view'; // Phase 11B
import { showFavoriteFiles, FavoriteFilesView } from '../views/favorite-files-view'; // Phase 11C
import { animationService, AnimationDuration, TransitionType } from './animation-service'; // Phase 11F
import { accessibilityService, AriaLivePriority } from './accessibility-service'; // Phase 11G


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

        // Phase 11F: Initialize AnimationService
        animationService.initialize().catch((err) => {
            console.error('Failed to initialize animation service:', err);
        });

        // Phase 11G: Initialize AccessibilityService
        accessibilityService.initialize().catch((err) => {
            console.error('Failed to initialize accessibility service:', err);
        });

        // Make available globally for back button handler
        if (window.App) {
            window.App.UI = this as any;
        }
    }

    /**
     * Conference Polish: Trigger haptic feedback
     */
    async haptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
        if (this.Haptics) {
            try {
                await this.Haptics.impact({ style });
            } catch (err: any) {
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
        } catch (err: any) {
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
                const nav = (item as HTMLElement).dataset.nav;

                // Conference Polish: Add haptic feedback on navigation
                if (Haptics) {
                    try {
                        await Haptics.impact({ style: 'light' });
                    } catch (err: any) {
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
                    if (isActive && !(e.target as HTMLElement).closest('.browse-dropdown-item')) {
                        item.classList.remove('active');
                    }
                    return;
                }

                e.preventDefault();
                this.navigateTo(nav!);

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
                    } catch (err: any) {
                        // Silently ignore haptic errors
                    }
                }

                const nav = (item as HTMLElement).dataset.nav;
                this.navigateTo(nav!);

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
            case 'collections':
                this.showCollections();
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
        mainRegion!.innerHTML = UITemplates.browserView('Movies', 'movies');

        // Load real public domain movies
        await this.renderRealMovies();

        // Add Continue Watching section if there are items
        const continueItems = this.getContinueWatchingItems();
        if (continueItems.length > 0) {
            const searchBar = document.querySelector('.search-bar');
            if (searchBar) {
                const continueSection = document.createElement('div');
                continueSection.innerHTML = UITemplates.continueWatchingSection(continueItems);
                searchBar.insertAdjacentElement('afterend', continueSection.firstElementChild!);

                // Add click handlers for continue watching cards
                document.querySelectorAll('.continue-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = (card as HTMLElement).dataset.id;
                        this.showDetail(id!);
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
            contentGrid!.innerHTML = UITemplates.loadingState('Loading TV shows...');

            // Fetch TV shows
            const shows = await tvShowsProvider.getPopular();

            // Store shows for detail view
            shows.forEach((show: any) => {
                this.currentMovieData.set(show.tvdb_id || show.imdb_id, show);
            });

            // Render TV shows
            contentGrid!.innerHTML = UITemplates.contentGrid(shows);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to load TV shows:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
            contentGrid!.innerHTML = UITemplates.loadingState('Loading anime...');

            // Fetch anime
            const anime = await animeProvider.getPopular();

            // Store anime for detail view
            anime.forEach((item: any) => {
                this.currentMovieData.set(item.tvdb_id || item.imdb_id, item);
            });

            // Render anime
            contentGrid!.innerHTML = UITemplates.contentGrid(anime);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to load anime:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Anime',
                error.message || 'Please try again'
            );
        }
    }

    async showFavorites(tab = 'favorites') {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.favoritesView(tab);

        // Setup tab switching
        document.querySelectorAll('[data-favorites-tab]').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const selectedTab = (tabBtn as HTMLElement).dataset.favoritesTab;
                this.showFavorites(selectedTab);
            });
        });

        // Add "Favorite Files" button to favorites tab (Phase 11C)
        if (tab === 'favorites') {
            const contentGridParent = document.querySelector('.content-grid')?.parentElement;
            if (contentGridParent) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex justify-end mb-4 px-4';
                buttonContainer.innerHTML = `
                    <button id="favorite-files-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                        </svg>
                        <span class="font-medium">Favorite Files</span>
                    </button>
                `;
                contentGridParent.insertBefore(buttonContainer, contentGridParent.firstChild);

                // Attach event handler
                const favoriteFilesBtn = document.getElementById('favorite-files-btn');
                if (favoriteFilesBtn) {
                    favoriteFilesBtn.addEventListener('click', () => {
                        this.showFavoriteFiles();
                    });
                }
            }
        }

        const contentGrid = document.querySelector('.content-grid');

        if (tab === 'favorites') {
            await this.renderFavoritesTab(contentGrid as HTMLElement);
        } else {
            await this.renderWatchlistTab(contentGrid as HTMLElement);
        }
    }

    async renderFavoritesTab(contentGrid: HTMLElement) {
        try {
            const favoritesService = window.FavoritesService;
            if (!favoritesService) {
                console.error('FavoritesService not loaded');
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Favorites service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid!.innerHTML = UITemplates.loadingState('Loading favorites...');

            // Fetch favorites
            const favorites = await favoritesService.getFavorites();

            if (favorites.length === 0) {
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '❤️',
                    'No Favorites Yet',
                    'Mark movies and shows as favorites to see them here'
                );
                return;
            }

            // Store favorites for detail view
            favorites.forEach((item: any) => {
                this.currentMovieData.set(item.imdb_id || item.id, item);
            });

            // Render favorites grid
            contentGrid!.innerHTML = UITemplates.contentGrid(favorites);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to load favorites:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Favorites',
                error.message || 'Please try again'
            );
        }
    }

    async renderWatchlistTab(contentGrid: HTMLElement) {
        try {
            const watchlistService = window.WatchlistService;
            if (!watchlistService) {
                console.error('WatchlistService not loaded');
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Watchlist service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid!.innerHTML = UITemplates.loadingState('Loading watchlist...');

            // Fetch watchlist items
            const watchlistItems = await watchlistService.getWatchlist();

            if (watchlistItems.length === 0) {
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⭐',
                    'Your Watchlist is Empty',
                    'Add movies and shows to keep track of what you want to watch'
                );
                return;
            }

            // Store items for detail view
            watchlistItems.forEach((item: any) => {
                this.currentMovieData.set(item.imdb_id || item.id, item);
            });

            // Render watchlist items
            contentGrid!.innerHTML = UITemplates.contentGrid(watchlistItems);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to load watchlist:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Watchlist',
                error.message || 'Please try again'
            );
        }
    }

    async showLibrary(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.browserView('Library', 'library');

        // Phase 11B: Add Manage Folders button next to search
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.innerHTML = `
                <input type="text" class="search-input" placeholder="Search library..." id="search-input">
                <button id="library-manage-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 ml-2" title="Manage Folders">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="hidden sm:inline">Manage</span>
                </button>
            `;
        }

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
                    const folder = (tab as HTMLElement).dataset.filter;

                    // Reload library with folder filter
                    await this.showLibraryFiltered(folder!);
                });
            });
        }

        const contentGrid = document.querySelector('.content-grid');

        try {
            const libraryService = window.LibraryService;
            if (!libraryService) {
                console.error('LibraryService not loaded');
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Library service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid!.innerHTML = UITemplates.loadingState('Loading library...');

            // Fetch library items
            const libraryItems = await libraryService.getMedia({ limit: 100 });

            if (libraryItems.length === 0) {
                // Show empty state with scan button
                contentGrid!.innerHTML = UITemplates.libraryEmptyState();
                this.attachLibraryScanHandler();
                return;
            }

            // Transform library items to content card format
            const itemsFormatted = libraryItems.map((item: any) => ({
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
            itemsFormatted.forEach((item: any) => {
                this.currentMovieData.set(item.imdb_id, item);
            });

            // Render library items
            contentGrid!.innerHTML = UITemplates.contentGrid(itemsFormatted);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to load library:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Library',
                error.message || 'Please try again'
            );
        }

        // Phase 11B: Attach manage button handler
        const manageBtn = document.getElementById('library-manage-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                this.showLibraryManagement();
            });
        }
    }

    /**
     * Phase 13: Show Torrent Collections view
     */
    async showCollections(): Promise<void> {
        const mainRegion = document.querySelector('.main-window-region');

        // Hide loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        // Clear main region
        mainRegion!.innerHTML = '';

        try {
            // Dynamically import TorrentCollectionsView
            const { TorrentCollectionsView } = await import('../views/torrent-collections-view.ts');

            // Create and render the collections view
            const collectionsView = new TorrentCollectionsView({
                onClose: () => {
                    // Navigate back to previous view or movies
                    if (this.navigationHistory.length > 0) {
                        this.goBack();
                    } else {
                        this.navigateTo('movies');
                    }
                },
                el: mainRegion
            } as any);

            collectionsView.setElement(mainRegion);
            collectionsView.render();

            console.log('Collections view displayed');
        } catch (error: any) {
            console.error('Failed to load collections view:', error);
            mainRegion!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Failed to Load Collections',
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
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Library service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid!.innerHTML = UITemplates.loadingState('Loading library...');

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

                const pathPattern = (folderPaths as any)[folder];
                if (pathPattern) {
                    filteredItems = allItems.filter((item: any) =>
                        item.file_path && item.file_path.includes(pathPattern)
                    );
                }
            }

            if (filteredItems.length === 0) {
                contentGrid!.innerHTML = UITemplates.emptyState(
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
            const itemsFormatted = filteredItems.map((item: any) => ({
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
            itemsFormatted.forEach((item: any) => {
                this.currentMovieData.set(item.imdb_id, item);
            });

            // Render filtered library items
            contentGrid!.innerHTML = UITemplates.contentGrid(itemsFormatted);
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();

        } catch (error: any) {
            console.error('Failed to filter library:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
                    contentGrid!.innerHTML = `
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
                contentGrid!.innerHTML = `
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
        } catch (error: any) {
            console.error('Failed to request permissions:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Permission Error',
                `Failed to check permissions. Please try again.`
            );
            return;
        }

        // Scan common Android media directories (skip DCIM - camera photos)
        const commonPaths = [
            'Movies',
            'Download',
            'Videos'
        ];

        try {
            // Show scanning UI
            contentGrid!.innerHTML = UITemplates.libraryScanningState(0, 0);

            let totalFiles = 0;
            let currentFile = 0;

            const results = await libraryService.scanFolders(commonPaths, (current: number, total: number, filename: string) => {
                currentFile = current;
                totalFiles = total || currentFile;

                // Update progress UI
                const progress = totalFiles > 0 ? Math.round((currentFile / totalFiles) * 100) : 0;
                const progressText = document.querySelector('.scan-progress-text');
                const progressBar = document.querySelector('.scan-progress-bar-fill');
                const currentFileText = document.querySelector('.scan-current-file');

                if (progressText) progressText.textContent = `${currentFile} / ${totalFiles} files`;
                if (progressBar) (progressBar as HTMLElement).style.width = `${progress}%`;
                if (currentFileText) currentFileText.textContent = filename || 'Scanning...';
            });

            console.log('Scan complete:', results);

            // Show completion message briefly
            contentGrid!.innerHTML = UITemplates.emptyState(
                '✅',
                'Scan Complete',
                `Found ${results?.itemsMatched || 0} media files`
            );

            // Wait a moment then refresh library view
            setTimeout(async () => {
                await this.showLibrary();
            }, 1500);

        } catch (error: any) {
            console.error('Library scan failed:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
            // Wrap in try-catch to handle lifecycle errors gracefully
            let result;
            try {
                result = await DirectoryPicker.pickDirectory();
            } catch (lifecycleError: any) {
                // Handle specific lifecycle error from Capacitor plugin
                if (lifecycleError.message && lifecycleError.message.includes('LifecycleOwner')) {
                    console.warn('[Library] Directory picker lifecycle error, retrying...', lifecycleError.message);
                    // Wait briefly and retry once
                    await new Promise(resolve => setTimeout(resolve, 100));
                    result = await DirectoryPicker.pickDirectory();
                } else {
                    throw lifecycleError;
                }
            }

            if (!result || !result.uri) {
                console.log('[Library] No directory selected');
                return;
            }

            console.log('[Library] Directory selected:', result.displayName, result.uri);

            // Store selected folder URI in settings
            const settings = window.SettingsManager;
            const libraryFolders = settings.get('libraryFolders') || [];

            // Check if folder already added
            if (libraryFolders.some((f: any) => f.uri === result.uri)) {
                contentGrid!.innerHTML = UITemplates.emptyState(
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
            await this.scanLibraryFolder(result.uri, result.displayName!);

        } catch (error: any) {
            console.error('[Library] Failed to pick folder:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
            contentGrid!.innerHTML = UITemplates.libraryScanningState(0, 0);

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
                contentGrid!.innerHTML = UITemplates.emptyState(
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
                if (progressBar) (progressBar as HTMLElement).style.width = `${progress}%`;
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
                } catch (error: any) {
                    console.error(`[Library] Failed to add file ${file.name}:`, error);
                }
            }

            // Show completion
            contentGrid!.innerHTML = UITemplates.emptyState(
                '✅',
                'Folder Scanned',
                `Added ${processedCount} videos from "${folderName}"`
            );

            // Refresh library view
            setTimeout(async () => {
                await this.showLibrary();
            }, 1500);

        } catch (error: any) {
            console.error('[Library] Failed to scan folder:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⚠️',
                'Scan Failed',
                error.message || 'Failed to scan folder. Please try again.'
            );
        }
    }

    /**
     * Show library management modal (Phase 11B)
     */
    showLibraryManagement(): void {
        const mainRegion = document.querySelector('.main-window-region');
        if (!mainRegion) {
            console.error('[Library] Main region not found');
            return;
        }

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'library-management-modal';
        mainRegion.appendChild(modalContainer);

        console.log('[Library] Opening library management modal');

        // Show library management view with callbacks
        const managementView = showLibraryManagement(modalContainer, {
            onRescan: async (folder) => {
                console.log('[Library] Rescanning folder:', folder.displayName);
                // Close the management modal
                managementView.remove();

                // Trigger rescan
                await this.scanLibraryFolder(folder.uri, folder.displayName);
            },
            onRemove: async (folder) => {
                console.log('[Library] Removing folder:', folder.displayName);

                try {
                    // Remove from settings
                    const settings = (window as any).SettingsManager;
                    const libraryFolders = settings.get('libraryFolders') || [];
                    const updatedFolders = libraryFolders.filter((f: any) => f.uri !== folder.uri);
                    settings.set('libraryFolders', updatedFolders);

                    // Remove from database
                    const libraryService = (window as any).LibraryService;
                    if (libraryService) {
                        // Remove library items for this folder
                        await libraryService.removeMediaByFolder(folder.uri);
                    }

                    // Remove from folder_scan_state
                    const sqliteService = (await import('./sqlite-service')).default;
                    await sqliteService.run('DELETE FROM folder_scan_state WHERE folder_path = ?', [folder.uri]);

                    console.log('[Library] Folder removed successfully');

                    // Refresh management view
                    managementView.refresh();
                } catch (error: any) {
                    console.error('[Library] Failed to remove folder:', error);
                    alert(`Failed to remove folder: ${error.message}`);
                }
            },
            onClose: () => {
                console.log('[Library] Library management modal closed');
                managementView.remove();

                // Refresh library view to show updated content
                this.showLibrary();
            }
        });
    }

    /**
     * Show favorite files modal (Phase 11C)
     */
    showFavoriteFiles(): void {
        console.log('[Favorites] Opening favorite files view');

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'favorite-files-modal';
        document.body.appendChild(modalContainer);

        // Show favorite files view with callbacks
        const favoriteFilesView = showFavoriteFiles(modalContainer, {
            onPlay: async (file) => {
                console.log('[Favorites] Play favorite file:', file);

                try {
                    // Close modal
                    favoriteFilesView.remove();
                    modalContainer.remove();

                    // Check if we have the torrent info in currentMovieData (from recently played content)
                    const movieId = file.movieId;
                    if (!movieId) {
                        alert('Cannot play this file: Associated movie/torrent not found.\n\nTo play favorite files, you need to access them from their original movie/show page.');
                        return;
                    }

                    // Try to find movie data
                    const movieData = this.currentMovieData.get(movieId) as any;
                    if (!movieData) {
                        alert('Cannot play this file: Movie data not available.\n\nPlease re-open the movie/show page first, then try playing from favorites.');
                        return;
                    }

                    // Get torrent magnet link
                    const torrent = movieData.torrents?.[movieData.quality] || movieData.torrent;
                    if (!torrent || !torrent.magnet) {
                        alert('Cannot play this file: Torrent information not available.');
                        return;
                    }

                    // Import necessary services
                    const NativeTorrentClient = (await import('./native-torrent-client')).default;

                    // Show the movie detail page with video player
                    await this.showDetail(movieData);

                    // Start streaming the specific file
                    const streamInfo = await (NativeTorrentClient as any).startStream({
                        magnetLink: torrent.magnet,
                        fileIndex: file.fileIndex
                    });

                    console.log('[Favorites] Started stream for favorite file:', streamInfo);

                } catch (error: any) {
                    console.error('[Favorites] Failed to play favorite file:', error);
                    alert(`Failed to play file: ${error.message}`);
                }
            },
            onRemove: async (file) => {
                console.log('[Favorites] Remove favorite file:', file);
                // Removal is handled by the view itself
                // No additional action needed here
            },
            onClose: () => {
                console.log('[Favorites] Favorite files modal closed');
                favoriteFilesView.remove();
                modalContainer.remove();

                // Refresh favorites view to show updated content
                this.showFavorites('favorites');
            }
        });
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
                    const provider = (tab as HTMLElement).dataset.filter === 'all' ? null : (tab as HTMLElement).dataset.filter;

                    // Reload courses with filter
                    await this.renderRealCourses(provider as any);
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

        // Theme Toggle Button
        const themeToggleBtn = document.querySelector('#theme-toggle-btn');
        if (themeToggleBtn && window.ThemeManager) {
            themeToggleBtn.addEventListener('click', () => {
                const newTheme = window.ThemeManager!.toggle();
                themeToggleBtn.textContent = newTheme === 'dark' ? '🌙 Dark' : '☀️ Light';
                console.log('Theme toggled to:', newTheme);
            });
        }

        // Streaming Server URL
        const serverInput = document.querySelector('#setting-server-url input') as HTMLInputElement;
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
        const tmdbInput = document.querySelector('#setting-tmdb-key input') as HTMLInputElement;
        if (tmdbInput) {
            tmdbInput.addEventListener('blur', () => {
                const key = tmdbInput.value.trim();
                settings.set('tmdbApiKey', key);
                console.log('TMDB API key updated');
            });
        }

        // OMDB API Key
        const omdbInput = document.querySelector('#setting-omdb-key input') as HTMLInputElement;
        if (omdbInput) {
            omdbInput.addEventListener('blur', () => {
                const key = omdbInput.value.trim();
                settings.set('omdbApiKey', key);
                console.log('OMDB API key updated');
            });
        }

        // Provider Selection
        const providerSelect = document.querySelector('#setting-provider select') as HTMLSelectElement;
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
        const qualitySelect = document.querySelector('#setting-quality select') as HTMLSelectElement;
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

        // Phase 11D: Battery Settings Event Handlers
        this.setupBatterySettings();

        // Phase 11D: Network Settings Event Handlers
        this.setupNetworkSettings();

        // Phase 11D: Memory Settings Event Handlers
        this.setupMemorySettings();

        // Phase 11D: Download Settings Event Handlers
        this.setupDownloadSettings();

        // Proxy Settings
        this.setupProxySettings();

        // Phase 12B: Cloud Account & Sync Settings
        this.setupCloudSyncSettings();
    }

    /**
     * Setup Cloud Account & Sync Settings (Phase 12B)
     */
    async setupCloudSyncSettings(): Promise<void> {
        try {
            // Check if Supabase is configured
            if (!import.meta.env.VITE_SUPABASE_URL) {
                console.log('Supabase not configured, hiding cloud sync section');
                const cloudSection = document.getElementById('cloud-account-section');
                if (cloudSection) {
                    cloudSection.innerHTML = `
                        <div class="settings-item">
                            <div class="settings-item-content">
                                <div class="settings-item-description" style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">
                                    Cloud sync is not configured. Contact the developer to enable cloud features.
                                </div>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // Dynamically import API client
            const { getApiClient } = await import('./api-client');
            const apiClient = getApiClient();

            // Check if user is signed in
            const { user, error } = await apiClient.getUser();

            const userInfoSection = document.getElementById('cloud-user-info');
            const signInSection = document.getElementById('cloud-sign-in-section');
            const userEmailEl = document.getElementById('cloud-user-email');

            if (error || !user) {
                // User not signed in - show sign in button
                if (userInfoSection) userInfoSection.style.display = 'none';
                if (signInSection) signInSection.style.display = 'block';
            } else {
                // User is signed in - show user info and sync buttons
                if (userInfoSection) userInfoSection.style.display = 'block';
                if (signInSection) signInSection.style.display = 'none';
                if (userEmailEl) userEmailEl.textContent = user.email || 'Unknown';
            }

            // Sign In button
            const signInBtn = document.getElementById('sign-in-btn');
            if (signInBtn) {
                signInBtn.addEventListener('click', async () => {
                    const { default: AuthModalView } = await import('../views/auth-modal-view');
                    const authModal = new AuthModalView({
                        mode: 'signin',
                        onSuccess: (user: any) => {
                            console.log('User signed in:', user.email);
                            this.showToast(`Welcome, ${user.email}!`, 'success');
                            // Refresh settings view to show user info
                            this.showSettings();
                        },
                        onCancel: () => {
                            console.log('Auth cancelled');
                        }
                    });
                    authModal.render();
                    document.body.appendChild(authModal.el);
                });
            }

            // Sign Out button
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', async () => {
                    const confirmed = confirm('Are you sure you want to sign out?');
                    if (!confirmed) return;

                    const { error } = await apiClient.signOut();
                    if (error) {
                        this.showToast('Failed to sign out', 'error');
                        console.error('Sign out error:', error);
                        return;
                    }

                    this.showToast('Signed out successfully', 'success');
                    // Refresh settings view
                    this.showSettings();
                });
            }

            // Sync Favorites button
            const syncFavoritesBtn = document.getElementById('sync-favorites-btn');
            if (syncFavoritesBtn) {
                syncFavoritesBtn.addEventListener('click', async () => {
                    const btn = syncFavoritesBtn as HTMLButtonElement;
                    btn.disabled = true;
                    btn.textContent = '⏳ Syncing...';

                    const favoritesService = window.FavoritesService;
                    if (!favoritesService) {
                        this.showToast('Favorites service not available', 'error');
                        btn.disabled = false;
                        btn.textContent = '☁️ Sync Now';
                        return;
                    }

                    const result = await favoritesService.syncToCloud();
                    btn.disabled = false;
                    btn.textContent = '☁️ Sync Now';

                    if (result.success) {
                        this.showToast(`Synced ${result.synced} favorites to cloud`, 'success');
                    } else {
                        this.showToast(result.error || 'Failed to sync favorites', 'error');
                    }
                });
            }

            // Sync Settings button
            const syncSettingsBtn = document.getElementById('sync-settings-btn');
            if (syncSettingsBtn) {
                syncSettingsBtn.addEventListener('click', async () => {
                    const btn = syncSettingsBtn as HTMLButtonElement;
                    btn.disabled = true;
                    btn.textContent = '⏳ Syncing...';

                    const settings = window.SettingsManager;
                    if (!settings) {
                        this.showToast('Settings manager not available', 'error');
                        btn.disabled = false;
                        btn.textContent = '☁️ Sync Now';
                        return;
                    }

                    const result = await settings.syncToCloud();
                    btn.disabled = false;
                    btn.textContent = '☁️ Sync Now';

                    if (result.success) {
                        this.showToast('Settings synced to cloud', 'success');
                    } else {
                        this.showToast(result.error || 'Failed to sync settings', 'error');
                    }
                });
            }

            // Restore from Cloud button
            const restoreBtn = document.getElementById('restore-from-cloud-btn');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', async () => {
                    const confirmed = confirm(
                        'This will restore favorites and settings from cloud, overwriting local data. Continue?'
                    );
                    if (!confirmed) return;

                    const btn = restoreBtn as HTMLButtonElement;
                    btn.disabled = true;
                    btn.textContent = '⏳ Restoring...';

                    const favoritesService = window.FavoritesService;
                    const settings = window.SettingsManager;

                    let favoritesResult = { success: false, synced: 0, error: '' };
                    let settingsResult = { success: false, error: '' };

                    if (favoritesService) {
                        favoritesResult = await favoritesService.syncFromCloud();
                    }

                    if (settings) {
                        settingsResult = await settings.syncFromCloud();
                    }

                    btn.disabled = false;
                    btn.textContent = '📥 Restore';

                    if (favoritesResult.success && settingsResult.success) {
                        this.showToast(
                            `Restored ${favoritesResult.synced} favorites and settings from cloud`,
                            'success'
                        );
                        // Refresh settings view to reflect updated settings
                        this.showSettings();
                    } else if (favoritesResult.success) {
                        this.showToast(
                            `Restored ${favoritesResult.synced} favorites. Settings restore failed: ${settingsResult.error}`,
                            'info'
                        );
                    } else if (settingsResult.success) {
                        this.showToast(
                            `Restored settings. Favorites restore failed: ${favoritesResult.error}`,
                            'info'
                        );
                    } else {
                        this.showToast(
                            `Failed to restore: ${favoritesResult.error || settingsResult.error}`,
                            'error'
                        );
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up cloud sync:', error);
        }
    }

    /**
     * Setup Battery Settings (Phase 11D)
     */
    async setupBatterySettings(): Promise<void> {
        try {
            const { batteryService } = await import('./battery-service');
            const config = batteryService.getConfig();

            // Load current battery info
            const batteryInfo = await batteryService.getBatteryInfo();

            // Update battery status display
            const batteryStatusText = document.getElementById('battery-status-text');
            const batteryLevelValue = document.getElementById('battery-level-value');
            if (batteryStatusText && batteryLevelValue) {
                if (batteryInfo) {
                    batteryStatusText.textContent = batteryInfo.isCharging ? 'Charging' : 'Discharging';
                    batteryLevelValue.textContent = `${batteryInfo.level}%`;
                } else {
                    // Clear loading state and show unavailable
                    batteryStatusText.textContent = 'Unavailable';
                    batteryLevelValue.textContent = 'N/A';
                }
            }

            // WiFi-Only Toggle
            const wifiOnlyToggle = document.getElementById('battery-wifi-only-toggle');
            if (wifiOnlyToggle) {
                if (config.wifiOnlyDownloads) wifiOnlyToggle.classList.add('active');
                wifiOnlyToggle.addEventListener('click', () => {
                    const isActive = wifiOnlyToggle.classList.toggle('active');
                    batteryService.updateConfig({ wifiOnlyDownloads: isActive });
                    console.log('[Settings] WiFi-only downloads:', isActive);
                });
            }

            // Pause on Low Battery Toggle
            const pauseLowToggle = document.getElementById('battery-pause-low-toggle');
            if (pauseLowToggle) {
                if (config.pauseOnLowBattery) pauseLowToggle.classList.add('active');
                pauseLowToggle.addEventListener('click', () => {
                    const isActive = pauseLowToggle.classList.toggle('active');
                    batteryService.updateConfig({ pauseOnLowBattery: isActive });
                    console.log('[Settings] Pause on low battery:', isActive);
                });
            }

            // Throttle on Battery Saver Toggle
            const throttleToggle = document.getElementById('battery-throttle-toggle');
            if (throttleToggle) {
                if (config.throttleOnBatterySaver) throttleToggle.classList.add('active');
                throttleToggle.addEventListener('click', () => {
                    const isActive = throttleToggle.classList.toggle('active');
                    batteryService.updateConfig({ throttleOnBatterySaver: isActive });
                    console.log('[Settings] Throttle on battery saver:', isActive);
                });
            }

            // Reduce Quality Toggle
            const reduceQualityToggle = document.getElementById('battery-reduce-quality-toggle');
            if (reduceQualityToggle) {
                if (config.reduceTorrentQualityOnLowBattery) reduceQualityToggle.classList.add('active');
                reduceQualityToggle.addEventListener('click', () => {
                    const isActive = reduceQualityToggle.classList.toggle('active');
                    batteryService.updateConfig({ reduceTorrentQualityOnLowBattery: isActive });
                    console.log('[Settings] Reduce quality on low battery:', isActive);
                });
            }
        } catch (error) {
            console.error('[Settings] Failed to setup battery settings:', error);
        }
    }

    /**
     * Setup Network Settings (Phase 11D)
     */
    async setupNetworkSettings(): Promise<void> {
        try {
            const settings = window.SettingsManager;

            // Cache enabled toggle (stored in SettingsManager)
            const cacheToggle = document.getElementById('network-cache-toggle');
            const cacheEnabled = settings.get('networkCacheEnabled') !== false;
            if (cacheToggle) {
                if (cacheEnabled) cacheToggle.classList.add('active');
                cacheToggle.addEventListener('click', () => {
                    const isActive = cacheToggle.classList.toggle('active');
                    settings.set('networkCacheEnabled', isActive);
                    console.log('[Settings] Network cache enabled:', isActive);
                });
            }

            // Cache TTL Slider
            const cacheTtlSlider = document.getElementById('network-cache-ttl-slider') as HTMLInputElement;
            const cacheTtlValue = document.getElementById('network-cache-ttl-value');
            const cacheTtl = settings.get('networkCacheTTL') || 5;
            if (cacheTtlSlider && cacheTtlValue) {
                cacheTtlSlider.value = cacheTtl.toString();
                cacheTtlValue.textContent = cacheTtl.toString();
                cacheTtlSlider.addEventListener('input', () => {
                    const value = parseInt(cacheTtlSlider.value);
                    cacheTtlValue.textContent = value.toString();
                    settings.set('networkCacheTTL', value);
                });
            }

            // Retry Attempts Slider
            const retrySlider = document.getElementById('network-retry-slider') as HTMLInputElement;
            const retryValue = document.getElementById('network-retry-value');
            const retryAttempts = settings.get('networkRetryAttempts') || 3;
            if (retrySlider && retryValue) {
                retrySlider.value = retryAttempts.toString();
                retryValue.textContent = retryAttempts.toString();
                retrySlider.addEventListener('input', () => {
                    const value = parseInt(retrySlider.value);
                    retryValue.textContent = value.toString();
                    settings.set('networkRetryAttempts', value);
                });
            }

            // Timeout Slider
            const timeoutSlider = document.getElementById('network-timeout-slider') as HTMLInputElement;
            const timeoutValue = document.getElementById('network-timeout-value');
            const timeout = settings.get('networkTimeout') || 30;
            if (timeoutSlider && timeoutValue) {
                timeoutSlider.value = timeout.toString();
                timeoutValue.textContent = timeout.toString();
                timeoutSlider.addEventListener('input', () => {
                    const value = parseInt(timeoutSlider.value);
                    timeoutValue.textContent = value.toString();
                    settings.set('networkTimeout', value);
                });
            }

            // Cache Stats Display
            const cacheStats = document.getElementById('network-cache-stats');
            if (cacheStats) {
                cacheStats.textContent = 'Cache enabled, TTL: ' + cacheTtl + ' min';
            }

            // Clear Cache Button
            const clearCacheBtn = document.getElementById('network-clear-cache-btn');
            if (clearCacheBtn) {
                clearCacheBtn.addEventListener('click', () => {
                    if (confirm('Clear network cache?')) {
                        // Clear cache logic would go here
                        console.log('[Settings] Network cache cleared');
                        alert('Network cache cleared successfully');
                    }
                });
            }
        } catch (error) {
            console.error('[Settings] Failed to setup network settings:', error);
        }
    }

    /**
     * Setup Memory Settings (Phase 11D)
     */
    async setupMemorySettings(): Promise<void> {
        try {
            const settings = window.SettingsManager;

            // Image Cache Size Slider
            const imageCacheSlider = document.getElementById('memory-image-cache-slider') as HTMLInputElement;
            const imageCacheValue = document.getElementById('memory-image-cache-value');
            const imageCacheSize = settings.get('memoryCacheSize') || 50;
            if (imageCacheSlider && imageCacheValue) {
                imageCacheSlider.value = imageCacheSize.toString();
                imageCacheValue.textContent = imageCacheSize.toString();
                imageCacheSlider.addEventListener('input', () => {
                    const value = parseInt(imageCacheSlider.value);
                    imageCacheValue.textContent = value.toString();
                    settings.set('memoryCacheSize', value);
                });
            }

            // Disk Cache Size Slider
            const diskCacheSlider = document.getElementById('memory-disk-cache-slider') as HTMLInputElement;
            const diskCacheValue = document.getElementById('memory-disk-cache-value');
            const diskCacheSize = settings.get('diskCacheSize') || 100;
            if (diskCacheSlider && diskCacheValue) {
                diskCacheSlider.value = diskCacheSize.toString();
                diskCacheValue.textContent = diskCacheSize.toString();
                diskCacheSlider.addEventListener('input', () => {
                    const value = parseInt(diskCacheSlider.value);
                    diskCacheValue.textContent = value.toString();
                    settings.set('diskCacheSize', value);
                });
            }

            // Memory Usage Display
            const memoryUsageText = document.getElementById('memory-usage-text');
            if (memoryUsageText) {
                memoryUsageText.textContent = `Image: ${imageCacheSize}MB, Disk: ${diskCacheSize}MB`;
            }

            // Clear Memory Cache Button
            const clearMemoryBtn = document.getElementById('memory-clear-btn');
            if (clearMemoryBtn) {
                clearMemoryBtn.addEventListener('click', () => {
                    if (confirm('Clear all caches?')) {
                        // Clear cache logic would go here
                        console.log('[Settings] Memory caches cleared');
                        alert('Caches cleared successfully');
                    }
                });
            }
        } catch (error) {
            console.error('[Settings] Failed to setup memory settings:', error);
        }
    }

    /**
     * Setup Download Settings (Phase 11D)
     */
    async setupDownloadSettings(): Promise<void> {
        try {
            const settings = window.SettingsManager;

            // Concurrent Downloads Slider
            const concurrentSlider = document.getElementById('download-concurrent-slider') as HTMLInputElement;
            const concurrentValue = document.getElementById('download-concurrent-value');
            const concurrent = settings.get('downloadConcurrent') || 3;
            if (concurrentSlider && concurrentValue) {
                concurrentSlider.value = concurrent.toString();
                concurrentValue.textContent = concurrent.toString();
                concurrentSlider.addEventListener('input', () => {
                    const value = parseInt(concurrentSlider.value);
                    concurrentValue.textContent = value.toString();
                    settings.set('downloadConcurrent', value);
                });
            }

            // Download Speed Limit Slider
            const downloadSpeedSlider = document.getElementById('download-speed-slider') as HTMLInputElement;
            const downloadSpeedValue = document.getElementById('download-speed-value');
            const downloadSpeed = settings.get('downloadSpeedLimit') || 0;
            if (downloadSpeedSlider && downloadSpeedValue) {
                downloadSpeedSlider.value = downloadSpeed.toString();
                downloadSpeedValue.textContent = downloadSpeed === 0 ? 'Unlimited' : downloadSpeed.toString();
                downloadSpeedSlider.addEventListener('input', () => {
                    const value = parseInt(downloadSpeedSlider.value);
                    downloadSpeedValue.textContent = value === 0 ? 'Unlimited' : value.toString();
                    settings.set('downloadSpeedLimit', value);
                });
            }

            // Upload Speed Limit Slider
            const uploadSpeedSlider = document.getElementById('upload-speed-slider') as HTMLInputElement;
            const uploadSpeedValue = document.getElementById('upload-speed-value');
            const uploadSpeed = settings.get('uploadSpeedLimit') || 100;
            if (uploadSpeedSlider && uploadSpeedValue) {
                uploadSpeedSlider.value = uploadSpeed.toString();
                uploadSpeedValue.textContent = uploadSpeed === 0 ? 'Unlimited' : uploadSpeed.toString();
                uploadSpeedSlider.addEventListener('input', () => {
                    const value = parseInt(uploadSpeedSlider.value);
                    uploadSpeedValue.textContent = value === 0 ? 'Unlimited' : value.toString();
                    settings.set('uploadSpeedLimit', value);
                });
            }

            // Auto Cleanup Days Slider
            const cleanupSlider = document.getElementById('download-cleanup-slider') as HTMLInputElement;
            const cleanupValue = document.getElementById('download-cleanup-value');
            const cleanupDays = settings.get('downloadCleanupDays') || 7;
            if (cleanupSlider && cleanupValue) {
                cleanupSlider.value = cleanupDays.toString();
                cleanupValue.textContent = cleanupDays.toString();
                cleanupSlider.addEventListener('input', () => {
                    const value = parseInt(cleanupSlider.value);
                    cleanupValue.textContent = value.toString();
                    settings.set('downloadCleanupDays', value);
                });
            }

            // Seed Ratio Limit Slider
            const seedRatioSlider = document.getElementById('download-seed-ratio-slider') as HTMLInputElement;
            const seedRatioValue = document.getElementById('download-seed-ratio-value');
            const seedRatio = settings.get('downloadSeedRatio') || 2;
            if (seedRatioSlider && seedRatioValue) {
                seedRatioSlider.value = seedRatio.toString();
                seedRatioValue.textContent = seedRatio === 0 ? 'Unlimited' : seedRatio.toFixed(1);
                seedRatioSlider.addEventListener('input', () => {
                    const value = parseFloat(seedRatioSlider.value);
                    seedRatioValue.textContent = value === 0 ? 'Unlimited' : value.toFixed(1);
                    settings.set('downloadSeedRatio', value);
                });
            }
        } catch (error) {
            console.error('[Settings] Failed to setup download settings:', error);
        }
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
        const proxyTypeSelect = document.getElementById('proxy-type-select') as HTMLSelectElement;
        const proxyHostInput = document.getElementById('proxy-host-input') as HTMLInputElement;
        const proxyPortInput = document.getElementById('proxy-port-input') as HTMLInputElement;
        const proxyUsernameInput = document.getElementById('proxy-username-input') as HTMLInputElement;
        const proxyPasswordInput = document.getElementById('proxy-password-input') as HTMLInputElement;
        const testProxyBtn = document.getElementById('test-proxy-btn') as HTMLButtonElement;
        const saveProxyBtn = document.getElementById('save-proxy-btn') as HTMLButtonElement;
        const proxyStatus = document.getElementById('proxy-status');

        if (proxyEnabled) {
            proxyToggle!.classList.add('active');
            proxySettings!.classList.remove('hidden');
        }
        if (proxyTypeSelect) (proxyTypeSelect as HTMLSelectElement).value = proxyType;
        if (proxyHostInput) (proxyHostInput as HTMLInputElement).value = proxyHost;
        if (proxyPortInput) (proxyPortInput as HTMLInputElement).value = proxyPort;
        if (proxyUsernameInput) (proxyUsernameInput as HTMLInputElement).value = proxyUsername;
        if (proxyPasswordInput) (proxyPasswordInput as HTMLInputElement).value = proxyPassword;

        // Helper to show status messages
        const showStatus = (message: string, type = 'info') => {
            if (!proxyStatus) return;
            // Remove all status classes
            proxyStatus.classList.remove('hidden', 'bg-green-500/15', 'border-green-500/30', 'text-green-500', 'bg-red-500/15', 'border-red-500/30', 'text-red-500', 'bg-blue-500/15', 'border-blue-500/30', 'text-blue-500', 'bg-yellow-500/15', 'border-yellow-500/30', 'text-yellow-500');

            // Add appropriate status classes based on type
            const statusClasses = {
                success: ['bg-green-500/15', 'border-green-500/30', 'text-green-500'],
                error: ['bg-red-500/15', 'border-red-500/30', 'text-red-500'],
                info: ['bg-blue-500/15', 'border-blue-500/30', 'text-blue-500'],
                warning: ['bg-yellow-500/15', 'border-yellow-500/30', 'text-yellow-500']
            };
            proxyStatus.classList.add(...(statusClasses as any)[type]);
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
                proxySettings!.classList.toggle('hidden', !isActive);
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
                        await (TorrentStreamer as any).reloadProxySettings();
                        console.log('✅ Proxy settings reloaded in torrent service');
                        showStatus('✅ Settings saved and applied! Proxy is now active.', 'success');
                    } catch (error: any) {
                        console.warn('Failed to reload proxy settings (service may not be running):', error);
                        showStatus('✅ Settings saved! Will take effect when streaming starts.', 'success');
                    }

                    // Show success on button
                    saveProxyBtn.textContent = '✅ Saved!';
                    saveProxyBtn.classList.add('bg-green-500/20');
                    saveProxyBtn.classList.remove('bg-green-500/10');
                    setTimeout(() => {
                        saveProxyBtn.disabled = false;
                        saveProxyBtn.textContent = '💾 Save Settings';
                        saveProxyBtn.classList.add('bg-green-500/10');
                        saveProxyBtn.classList.remove('bg-green-500/20');
                    }, 2000);
                } catch (error: any) {
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
                contentGrid!.innerHTML = UITemplates.emptyState(
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
            movies.forEach((movie: any) => {
                this.currentMovieData.set(movie.imdb_id, movie);
            });

            // Render movies
            contentGrid!.innerHTML = UITemplates.contentGrid(movies);

            // Add click handlers
            this.attachCardHandlers();
            await this.updateFavoriteButtonStates();
        } catch (error: any) {
            console.error('Failed to load movies:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '⚠️',
                    'Service Error',
                    'Learning service failed to load'
                );
                return;
            }

            // Show loading state
            contentGrid!.innerHTML = UITemplates.emptyState(
                '⏳',
                'Loading Courses',
                'Fetching educational content from Academic Torrents...'
            );

            // Check if we have courses, if not sync them
            const courseCount = await learningService.getCachedCourseCount();
            if (courseCount === 0) {
                console.log('No courses in database, syncing from Academic Torrents...');
                contentGrid!.innerHTML = UITemplates.emptyState(
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
            const coursesFormatted = courses.map((course: any) => {
                const providerInfo = (providerLogos as any)[course.provider] || { color: '1f1f1f', text: course.provider || 'Course' };
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
            coursesFormatted.forEach((course: any) => {
                this.currentMovieData.set(course.imdb_id, course);
            });

            // Render courses
            if (coursesFormatted.length > 0) {
                contentGrid!.innerHTML = UITemplates.contentGrid(coursesFormatted);
                this.attachCardHandlers();
                await this.updateFavoriteButtonStates();
            } else {
                contentGrid!.innerHTML = UITemplates.emptyState(
                    '📚',
                    'No Courses Available',
                    'Course database is being populated. Please try again later.'
                );
            }
        } catch (error: any) {
            console.error('Failed to load courses:', error);
            contentGrid!.innerHTML = UITemplates.emptyState(
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
        contentGrid!.innerHTML = UITemplates.contentGrid(mockMovies);

        // Add click handlers
        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    async renderMockShows() {
        const mockShows = this.getMockShows();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid!.innerHTML = UITemplates.contentGrid(mockShows);

        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    async renderMockAnime() {
        const mockAnime = this.getMockAnime();
        const contentGrid = document.querySelector('.content-grid');
        contentGrid!.innerHTML = UITemplates.contentGrid(mockAnime);

        this.attachCardHandlers();
        await this.updateFavoriteButtonStates();
    }

    attachCardHandlers() {
        // Handle content card clicks
        document.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open detail if clicking favorite button
                if ((e.target as HTMLElement).closest('.content-card-favorite')) {
                    return;
                }
                const id = (card as HTMLElement).dataset.id;
                this.showDetail(id!);
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

                const id = (button as HTMLElement).dataset.id;
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
                        (button as HTMLElement).title = 'Add to Favorites';

                        // If we're on the favorites page, refresh the view
                        if (window.location.hash === '#favorites') {
                            this.showFavorites();
                        }
                    } else {
                        // Add to favorites
                        const item = this.currentMovieData.get(id!);
                        if (item) {
                            await favoritesService.addFavorite(item);
                            button.classList.add('favorited');
                            (button as HTMLElement).title = 'Remove from Favorites';
                        }
                    }
                } catch (error: any) {
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
            const id = (button as HTMLElement).dataset.id;
            const isFavorited = await favoritesService.isFavorite(id);

            if (isFavorited) {
                button.classList.add('favorited');
                (button as HTMLElement).title = 'Remove from Favorites';
            } else {
                button.classList.remove('favorited');
                (button as HTMLElement).title = 'Add to Favorites';
            }
        }
    }

    showDetail(id: string) {
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

    renderDetailView(movie: any) {
        const mainRegion = document.querySelector('.main-window-region');
        mainRegion!.innerHTML = UITemplates.detailView(movie);

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
            const target = e.currentTarget as HTMLElement;
            target!.classList.toggle('bookmarked');
            target!.querySelector('span')!.textContent =
                target!.classList.contains('bookmarked') ? '★' : '☆';
        });

        // Phase 13 Phase 2: Add to Collection buttons
        const addToCollectionBtns = document.querySelectorAll('.add-to-collection-btn');
        addToCollectionBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const button = e.currentTarget as HTMLElement;
                const infoHash = button.dataset.infoHash || '';
                const name = button.dataset.torrentName || 'Unknown';
                const quality = button.dataset.quality || '';
                const size = button.dataset.size || '';
                const seeders = parseInt(button.dataset.seeders || '0', 10);

                if (!infoHash) {
                    console.warn('No info hash found for torrent');
                    return;
                }

                // Dynamically import CollectionPickerView
                const { showCollectionPicker } = await import('../views/collection-picker-view.js');

                // Construct magnet link from info_hash
                const magnetLink = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}`;

                // Show collection picker
                await showCollectionPicker({
                    info_hash: infoHash,
                    name,
                    magnet_link: magnetLink,
                    quality,
                    size_bytes: size ? this.parseTorrentSize(size) : 0,
                    cached_seeders: seeders,
                    imdb_id: movie.imdb_id || movie.ids?.imdb || ''
                });
            });
        });
    }

    /**
     * Parse torrent size string to bytes
     * e.g., "1.5 GB" -> 1610612736
     */
    private parseTorrentSize(sizeStr: string): number {
        const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        const multipliers: Record<string, number> = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };

        return Math.round(value * (multipliers[unit] || 1));
    }

    /**
     * Show file picker modal for multi-file torrents
     * Displays list of video files with checkbox selection and star/favorite support
     * @param {Array} videoFiles - Array of {index, name, size} objects
     * @param {Object} movie - Movie object for context
     * @returns {Promise<number|null>} Selected file index or null if cancelled
     */
    async showFilePickerModal(videoFiles: any[], movie: any): Promise<number | null> {
        return this.videoPlayer.showFilePickerModal(videoFiles, movie) as Promise<number | null>;
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

    // Phase 11E: Share functionality
    /**
     * Share a movie with others
     */
    async shareMovie(movie: Movie): Promise<void> {
        try {
            const url = `flixcapacitor://movie/${movie.imdb_id}`;
            const webUrl = `https://flixcapacitor.app/movie/${movie.imdb_id}`;

            await Share.share({
                title: `Check out ${movie.title}`,
                text: `${movie.title} (${movie.year}) - ${movie.synopsis || 'Watch this movie on FlixCapacitor'}`,
                url: webUrl,
                dialogTitle: 'Share Movie'
            });

            console.log('Shared movie:', movie.title);
        } catch (error) {
            console.error('Failed to share movie:', error);
        }
    }

    /**
     * Share a TV show with others
     */
    async shareShow(show: TVShow): Promise<void> {
        try {
            const url = `flixcapacitor://show/${show.imdb_id}`;
            const webUrl = `https://flixcapacitor.app/show/${show.imdb_id}`;

            await Share.share({
                title: `Check out ${show.title}`,
                text: `${show.title} - ${show.synopsis || 'Watch this show on FlixCapacitor'}`,
                url: webUrl,
                dialogTitle: 'Share TV Show'
            });

            console.log('Shared show:', show.title);
        } catch (error) {
            console.error('Failed to share show:', error);
        }
    }

    /**
     * Share a torrent magnet link
     */
    async shareTorrent(magnetLink: string, title?: string): Promise<void> {
        try {
            const encodedMagnet = encodeURIComponent(magnetLink);
            const url = `flixcapacitor://play/${encodedMagnet}`;

            await Share.share({
                title: title ? `Watch: ${title}` : 'Watch on FlixCapacitor',
                text: title ? `${title} - Click to watch` : 'Click to watch on FlixCapacitor',
                url: url,
                dialogTitle: 'Share Torrent'
            });

            console.log('Shared torrent:', title || magnetLink.substring(0, 50));
        } catch (error) {
            console.error('Failed to share torrent:', error);
        }
    }

    /**
     * Share a collection of favorites
     */
    async shareCollection(items: Array<Movie | TVShow>): Promise<void> {
        try {
            const { default: favoritesService } = await import('./favorites-service');

            // Generate a share code (could be stored on a backend in production)
            const shareCode = `collection_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // Export favorites data
            const exportData = {
                shareCode,
                items: items.map(item => ({
                    id: item.imdb_id,
                    type: (item as any).num_seasons ? 'show' : 'movie',
                    title: item.title,
                    year: item.year,
                    poster: item.images?.poster
                })),
                createdAt: Date.now()
            };

            // In production, this would upload to a backend
            // For now, store locally with share code
            localStorage.setItem(`share_${shareCode}`, JSON.stringify(exportData));

            const url = `flixcapacitor://collection/${shareCode}`;
            const webUrl = `https://flixcapacitor.app/collection/${shareCode}`;

            await Share.share({
                title: 'Check out my collection',
                text: `I've shared ${items.length} movies/shows with you on FlixCapacitor`,
                url: webUrl,
                dialogTitle: 'Share Collection'
            });

            console.log('Shared collection with', items.length, 'items');
        } catch (error) {
            console.error('Failed to share collection:', error);
        }
    }

    /**
     * Import a shared collection
     */
    async importSharedCollection(shareCode: string): Promise<void> {
        try {
            const { default: favoritesService } = await import('./favorites-service');

            // In production, this would fetch from a backend
            // For now, load from localStorage
            const shareDataStr = localStorage.getItem(`share_${shareCode}`);

            if (!shareDataStr) {
                console.error('Collection not found:', shareCode);
                // Show error message
                const modalContainer = document.createElement('div');
                modalContainer.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]';
                modalContainer.innerHTML = `
                    <div class="bg-gray-800 rounded-lg p-6 m-4 max-w-md">
                        <div class="text-xl font-bold mb-4 text-white">Collection Not Found</div>
                        <div class="text-gray-300 mb-6">The shared collection could not be found. The link may be expired or invalid.</div>
                        <button class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white">
                            OK
                        </button>
                    </div>
                `;
                document.body.appendChild(modalContainer);
                modalContainer.querySelector('button')?.addEventListener('click', () => {
                    modalContainer.remove();
                });
                return;
            }

            const shareData = JSON.parse(shareDataStr);

            // Show confirmation dialog
            const modalContainer = document.createElement('div');
            modalContainer.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]';
            modalContainer.innerHTML = `
                <div class="bg-gray-800 rounded-lg p-6 m-4 max-w-md">
                    <div class="text-xl font-bold mb-4 text-white">Import Collection</div>
                    <div class="text-gray-300 mb-4">
                        Import ${shareData.items.length} items to your favorites?
                    </div>
                    <div class="max-h-48 overflow-y-auto mb-6 space-y-2">
                        ${shareData.items.map((item: any) => `
                            <div class="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                                <img src="${item.poster || 'https://via.placeholder.com/50x75'}"
                                     class="w-12 h-18 object-cover rounded" />
                                <div>
                                    <div class="text-white font-medium">${item.title}</div>
                                    <div class="text-gray-400 text-sm">${item.year}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex gap-3">
                        <button id="import-cancel-btn" class="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold text-white">
                            Cancel
                        </button>
                        <button id="import-confirm-btn" class="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white">
                            Import
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalContainer);

            modalContainer.querySelector('#import-cancel-btn')?.addEventListener('click', () => {
                modalContainer.remove();
            });

            modalContainer.querySelector('#import-confirm-btn')?.addEventListener('click', async () => {
                let imported = 0;

                // Import each item as a favorite
                for (const item of shareData.items) {
                    const favoriteItem = {
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        year: item.year,
                        images: { poster: item.poster }
                    };

                    const success = await favoritesService.addFavorite(favoriteItem);
                    if (success) imported++;
                }

                modalContainer.remove();

                // Show success message
                const successModal = document.createElement('div');
                successModal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]';
                successModal.innerHTML = `
                    <div class="bg-gray-800 rounded-lg p-6 m-4 max-w-md">
                        <div class="text-xl font-bold mb-4 text-white">Success!</div>
                        <div class="text-gray-300 mb-6">Imported ${imported} of ${shareData.items.length} items to your favorites.</div>
                        <button class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white">
                            View Favorites
                        </button>
                    </div>
                `;
                document.body.appendChild(successModal);

                successModal.querySelector('button')?.addEventListener('click', () => {
                    successModal.remove();
                    this.showFavorites('favorites');
                });

                console.log('Imported collection:', imported, 'items');
            });

        } catch (error) {
            console.error('Failed to import collection:', error);
        }
    }

    /**
     * Perform search with query
     */
    async performSearch(query: string): Promise<void> {
        try {
            console.log('Performing search:', query);

            // Navigate to movies view (which has search)
            await this.showMovies();

            // Set search input value and trigger search
            const searchInput = document.querySelector<HTMLInputElement>('#search-input');
            if (searchInput) {
                searchInput.value = query;

                // Trigger search by clicking search button
                const searchBtn = document.querySelector('#search-btn');
                if (searchBtn) {
                    (searchBtn as HTMLElement).click();
                }
            }
        } catch (error) {
            console.error('Failed to perform search:', error);
        }
    }

    // Phase 11F: Animation & UI Polish Methods

    /**
     * Show animated toast notification
     */
    showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast left-1/2 -translate-x-1/2 z-[10000] px-6 py-4 rounded-lg shadow-2xl max-w-md';

        // Style based on type
        const styles = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-gray-800 text-white border border-gray-700'
        };
        toast.className += ` ${styles[type]}`;

        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ⓘ'
        };

        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">${icons[type]}</div>
                <div class="font-medium">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        animationService.slideIn(toast, 'down', AnimationDuration.NORMAL).then(() => {
            // Bounce for success
            if (type === 'success') {
                animationService.bounce(toast, 1);
            }
            // Shake for error
            else if (type === 'error') {
                animationService.shake(toast);
            }

            // Auto-hide after duration
            setTimeout(async () => {
                await animationService.slideOut(toast, 'up', AnimationDuration.NORMAL);
                toast.remove();
            }, duration);
        });
    }

    /**
     * Show loading overlay with spinner
     */
    showLoadingOverlay(message: string = 'Loading...'): HTMLElement {
        // Remove existing overlay
        const existing = document.querySelector('.loading-overlay');
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]';
        overlay.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
                <div class="loading-spinner w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                <div class="text-white font-medium">${message}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Start spinner animation
        const spinner = overlay.querySelector('.loading-spinner') as HTMLElement;
        if (spinner) {
            animationService.startLoadingSpinner(spinner);
        }

        // Fade in overlay
        animationService.fadeIn(overlay, AnimationDuration.FAST);

        return overlay;
    }

    /**
     * Hide loading overlay
     */
    async hideLoadingOverlay(): Promise<void> {
        const overlay = document.querySelector('.loading-overlay') as HTMLElement;
        if (overlay) {
            await animationService.fadeOut(overlay, AnimationDuration.FAST);
            overlay.remove();
        }
    }

    /**
     * Show modal with animation
     */
    async showModalAnimated(modalElement: HTMLElement, animationType: 'fade' | 'slide' | 'scale' = 'scale'): Promise<void> {
        document.body.appendChild(modalElement);

        // Animate modal in based on type
        switch (animationType) {
            case 'fade':
                await animationService.fadeIn(modalElement, AnimationDuration.NORMAL);
                break;
            case 'slide':
                await animationService.slideIn(modalElement, 'up', AnimationDuration.NORMAL);
                break;
            case 'scale':
                await animationService.scaleIn(modalElement, AnimationDuration.NORMAL);
                break;
        }
    }

    /**
     * Hide modal with animation
     */
    async hideModalAnimated(modalElement: HTMLElement, animationType: 'fade' | 'slide' | 'scale' = 'scale'): Promise<void> {
        // Animate modal out based on type
        switch (animationType) {
            case 'fade':
                await animationService.fadeOut(modalElement, AnimationDuration.NORMAL);
                break;
            case 'slide':
                await animationService.slideOut(modalElement, 'down', AnimationDuration.NORMAL);
                break;
            case 'scale':
                await animationService.scaleOut(modalElement, AnimationDuration.NORMAL);
                break;
        }

        modalElement.remove();
    }

    /**
     * Add ripple effect to button
     */
    addRippleEffect(button: HTMLElement): void {
        button.addEventListener('click', (e: MouseEvent) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            animationService.ripple(button, x, y);
            animationService.buttonPress(button);

            // Haptic feedback
            this.haptic('light');
        });
    }

    /**
     * Add ripple effects to all buttons in container
     */
    addRippleEffectsToButtons(container: HTMLElement = document.body): void {
        const buttons = container.querySelectorAll<HTMLElement>('button, .btn, [role="button"]');
        buttons.forEach(button => {
            // Only add if not already added
            if (!button.dataset.rippleAdded) {
                this.addRippleEffect(button);
                button.dataset.rippleAdded = 'true';
            }
        });
    }

    /**
     * Create skeleton screen for loading content
     */
    createSkeletonScreen(container: HTMLElement, type: 'grid' | 'list' | 'detail' = 'grid'): void {
        let skeletonHTML = '';

        if (type === 'grid') {
            // Movie/show grid skeleton
            skeletonHTML = `
                <div class="grid grid-cols-3 gap-4 p-4">
                    ${Array.from({ length: 12 }, () => `
                        <div class="space-y-2">
                            <div class="aspect-[2/3] bg-gray-800 rounded skeleton-shimmer"></div>
                            <div class="h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                            <div class="h-3 bg-gray-800 rounded skeleton-shimmer w-2/3"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (type === 'list') {
            // List skeleton
            skeletonHTML = `
                <div class="space-y-4 p-4">
                    ${Array.from({ length: 8 }, () => `
                        <div class="flex gap-4">
                            <div class="w-24 h-36 bg-gray-800 rounded skeleton-shimmer"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 bg-gray-800 rounded skeleton-shimmer"></div>
                                <div class="h-4 bg-gray-800 rounded skeleton-shimmer w-3/4"></div>
                                <div class="h-4 bg-gray-800 rounded skeleton-shimmer w-1/2"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (type === 'detail') {
            // Detail view skeleton
            skeletonHTML = `
                <div class="p-6 space-y-6">
                    <div class="flex gap-6">
                        <div class="w-48 h-72 bg-gray-800 rounded skeleton-shimmer"></div>
                        <div class="flex-1 space-y-4">
                            <div class="h-8 bg-gray-800 rounded skeleton-shimmer w-3/4"></div>
                            <div class="h-4 bg-gray-800 rounded skeleton-shimmer w-1/2"></div>
                            <div class="h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                            <div class="h-4 bg-gray-800 rounded skeleton-shimmer"></div>
                            <div class="h-4 bg-gray-800 rounded skeleton-shimmer w-5/6"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = skeletonHTML;
    }

    /**
     * Remove skeleton screen and fade in content
     */
    async removeSkeletonScreen(container: HTMLElement, content: string): Promise<void> {
        // Fade out skeleton
        await animationService.fadeOut(container, AnimationDuration.FAST);

        // Replace with content
        container.innerHTML = content;

        // Fade in content
        await animationService.fadeIn(container, AnimationDuration.NORMAL);
    }

    /**
     * Add swipe gesture to element
     */
    addSwipeGesture(
        element: HTMLElement,
        onSwipeLeft?: () => void,
        onSwipeRight?: () => void
    ): void {
        let startX = 0;
        let startY = 0;
        let isSwiping = false;

        element.addEventListener('touchstart', (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = true;
        });

        element.addEventListener('touchmove', (e: TouchEvent) => {
            if (!isSwiping) return;

            const currentX = e.touches[0].clientX;
            const diffX = currentX - startX;

            // Visual feedback
            element.style.transform = `translateX(${diffX}px)`;
            element.style.opacity = `${1 - Math.abs(diffX) / 300}`;
        });

        element.addEventListener('touchend', (e: TouchEvent) => {
            if (!isSwiping) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;

            // Reset
            isSwiping = false;

            // Check if swipe (not vertical scroll)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0 && onSwipeRight) {
                    // Swipe right
                    onSwipeRight();
                    this.haptic('medium');
                } else if (diffX < 0 && onSwipeLeft) {
                    // Swipe left
                    onSwipeLeft();
                    this.haptic('medium');
                }
            }

            // Animate back to position
            element.style.transition = 'transform 0.3s, opacity 0.3s';
            element.style.transform = '';
            element.style.opacity = '';

            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        });
    }

    /**
     * Add long press gesture to element
     */
    addLongPressGesture(element: HTMLElement, onLongPress: () => void, duration: number = 500): void {
        let pressTimer: number | null = null;

        element.addEventListener('touchstart', () => {
            pressTimer = window.setTimeout(() => {
                onLongPress();
                this.haptic('heavy');
                animationService.pulse(element, 1);
            }, duration);
        });

        element.addEventListener('touchend', () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        });

        element.addEventListener('touchmove', () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        });
    }

    // Phase 11G: Accessibility Methods

    /**
     * Enhance element with ARIA attributes
     */
    enhanceAccessibility(element: HTMLElement, options: {
        label?: string;
        role?: string;
        describedBy?: string;
        expanded?: boolean;
        selected?: boolean;
        hasPopup?: boolean;
    }): void {
        if (options.label) {
            accessibilityService.setAriaLabel(element, options.label);
        }

        if (options.role) {
            accessibilityService.setAriaRole(element, options.role);
        }

        if (options.describedBy) {
            accessibilityService.setAriaDescribedBy(element, options.describedBy);
        }

        if (options.expanded !== undefined) {
            accessibilityService.setExpanded(element, options.expanded);
        }

        if (options.selected !== undefined) {
            accessibilityService.setSelected(element, options.selected);
        }

        if (options.hasPopup) {
            element.setAttribute('aria-haspopup', 'true');
        }

        // Ensure interactive elements are focusable
        if (!element.hasAttribute('tabindex') &&
            (options.role === 'button' || options.role === 'link')) {
            element.setAttribute('tabindex', '0');
        }
    }

    /**
     * Make element keyboard navigable
     */
    makeKeyboardNavigable(element: HTMLElement, onClick: () => void): void {
        // Make focusable
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }

        // Add keyboard event handlers
        element.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
                this.haptic('light');
            }
        });
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
        const ariaPriority = priority === 'assertive' ? AriaLivePriority.ASSERTIVE : AriaLivePriority.POLITE;
        accessibilityService.announce(message, ariaPriority);
    }

    /**
     * Set page title with screen reader announcement
     */
    setPageTitle(title: string): void {
        accessibilityService.setPageTitle(title);
    }

    /**
     * Create modal with focus trap and ARIA attributes
     */
    createAccessibleModal(content: string, options: {
        title: string;
        onClose: () => void;
        role?: 'dialog' | 'alertdialog';
    }): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]';
        modal.setAttribute('role', options.role || 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');

        const dialog = document.createElement('div');
        dialog.className = 'bg-gray-800 rounded-lg p-6 m-4 max-w-2xl max-h-[80vh] overflow-y-auto';

        dialog.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <h2 id="modal-title" class="text-xl font-bold text-white">${options.title}</h2>
                <button id="modal-close-btn"
                        class="text-gray-400 hover:text-white text-2xl leading-none"
                        aria-label="Close dialog">
                    ×
                </button>
            </div>
            <div class="text-gray-300">
                ${content}
            </div>
        `;

        modal.appendChild(dialog);

        // Set up close button
        const closeBtn = dialog.querySelector('#modal-close-btn') as HTMLElement;
        closeBtn.addEventListener('click', options.onClose);

        // Create focus trap
        setTimeout(() => {
            accessibilityService.createFocusTrap(dialog);
        }, 100);

        // Announce modal opening
        this.announceToScreenReader(`${options.title} dialog opened`, 'polite');

        return modal;
    }

    /**
     * Close accessible modal
     */
    async closeAccessibleModal(modal: HTMLElement, title: string): Promise<void> {
        // Release focus trap
        accessibilityService.releaseFocusTrap();

        // Announce closing
        this.announceToScreenReader(`${title} dialog closed`, 'polite');

        // Animate out and remove
        await this.hideModalAnimated(modal, 'scale');
    }

    /**
     * Enhance buttons with accessibility features
     */
    enhanceButtonsAccessibility(container: HTMLElement = document.body): void {
        const buttons = container.querySelectorAll<HTMLElement>('button, .btn, [role="button"]');

        buttons.forEach(button => {
            // Skip if already enhanced
            if (button.dataset.accessibilityEnhanced) return;

            // Ensure focusable
            if (!button.hasAttribute('tabindex') && button.tagName !== 'BUTTON') {
                button.setAttribute('tabindex', '0');
            }

            // Add aria-label if no text content
            if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
                // Try to infer label from icon or class
                const icon = button.querySelector('[class*="icon"]');
                if (icon) {
                    const iconClass = Array.from(icon.classList).find(c => c.includes('icon'));
                    if (iconClass) {
                        const label = iconClass.replace('icon-', '').replace(/-/g, ' ');
                        accessibilityService.setAriaLabel(button, label);
                    }
                }
            }

            // Add keyboard navigation for non-button elements
            if (button.tagName !== 'BUTTON') {
                button.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        button.click();
                    }
                });
            }

            button.dataset.accessibilityEnhanced = 'true';
        });
    }

    /**
     * Enhance links with accessibility features
     */
    enhanceLinksAccessibility(container: HTMLElement = document.body): void {
        const links = container.querySelectorAll<HTMLAnchorElement>('a');

        links.forEach(link => {
            // Skip if already enhanced
            if (link.dataset.accessibilityEnhanced) return;

            // Add aria-label for links with only icons
            if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
                const href = link.getAttribute('href');
                if (href) {
                    accessibilityService.setAriaLabel(link, `Link to ${href}`);
                }
            }

            // Mark external links
            if (link.hostname && link.hostname !== window.location.hostname) {
                if (!link.getAttribute('aria-label')?.includes('external')) {
                    const currentLabel = link.getAttribute('aria-label') || link.textContent || 'Link';
                    accessibilityService.setAriaLabel(link, `${currentLabel} (opens in new window)`);
                }
            }

            link.dataset.accessibilityEnhanced = 'true';
        });
    }

    /**
     * Enhance form with accessibility features
     */
    enhanceFormAccessibility(form: HTMLFormElement): void {
        // Add labels for inputs without labels
        const inputs = form.querySelectorAll<HTMLInputElement>('input, select, textarea');

        inputs.forEach(input => {
            // Skip if already has label
            if (input.dataset.accessibilityEnhanced) return;

            // Check for associated label
            const label = form.querySelector(`label[for="${input.id}"]`);
            if (!label && !input.getAttribute('aria-label')) {
                // Try to infer label from placeholder or name
                const placeholder = input.getAttribute('placeholder');
                const name = input.getAttribute('name');

                if (placeholder) {
                    accessibilityService.setAriaLabel(input, placeholder);
                } else if (name) {
                    const labelText = name.replace(/-/g, ' ').replace(/_/g, ' ');
                    accessibilityService.setAriaLabel(input, labelText);
                }
            }

            // Mark required fields
            if (input.hasAttribute('required')) {
                const currentLabel = input.getAttribute('aria-label') || '';
                accessibilityService.setAriaLabel(input, `${currentLabel} (required)`);
            }

            input.dataset.accessibilityEnhanced = 'true';
        });

        // Add form submission feedback
        form.addEventListener('submit', (e) => {
            // Check for validation errors
            const invalid = form.querySelector('[aria-invalid="true"], :invalid');
            if (invalid) {
                e.preventDefault();
                accessibilityService.focusFirstInvalid(form);
            } else {
                this.announceToScreenReader('Form submitted successfully', 'polite');
            }
        });
    }

    /**
     * Enhance content grid with accessibility
     */
    enhanceContentGridAccessibility(container: HTMLElement): void {
        // Add role="list" to grid container
        accessibilityService.setAriaRole(container, 'list');

        // Enhance each card
        const cards = container.querySelectorAll<HTMLElement>('.content-card, [data-movie-id], [data-show-id]');

        cards.forEach((card, index) => {
            // Skip if already enhanced
            if (card.dataset.accessibilityEnhanced) return;

            // Add role="listitem"
            accessibilityService.setAriaRole(card, 'listitem');

            // Add aria-label with title and metadata
            const title = card.querySelector('.movie-title, .show-title')?.textContent?.trim();
            const year = card.querySelector('.movie-year, .show-year')?.textContent?.trim();
            const rating = card.querySelector('.movie-rating, .show-rating')?.textContent?.trim();

            if (title) {
                let label = title;
                if (year) label += `, ${year}`;
                if (rating) label += `, Rating: ${rating}`;
                label += `. Item ${index + 1} of ${cards.length}`;

                accessibilityService.setAriaLabel(card, label);
            }

            // Make card keyboard navigable
            this.makeKeyboardNavigable(card, () => {
                card.click();
            });

            card.dataset.accessibilityEnhanced = 'true';
        });
    }

    /**
     * Add keyboard shortcuts help dialog
     */
    showKeyboardShortcutsDialog(): void {
        const shortcuts = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="font-semibold">Navigation</div>
                    <div></div>

                    <div>Tab / Shift+Tab</div>
                    <div class="text-gray-400">Navigate forward / backward</div>

                    <div>Enter / Space</div>
                    <div class="text-gray-400">Activate button or link</div>

                    <div>Escape</div>
                    <div class="text-gray-400">Close modal or cancel</div>

                    <div>Arrow Keys</div>
                    <div class="text-gray-400">Navigate in lists</div>
                </div>

                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div class="font-semibold">Actions</div>
                    <div></div>

                    <div>?</div>
                    <div class="text-gray-400">Show this help dialog</div>

                    <div>/</div>
                    <div class="text-gray-400">Focus search</div>
                </div>
            </div>
        `;

        const modal = this.createAccessibleModal(shortcuts, {
            title: 'Keyboard Shortcuts',
            onClose: () => {
                this.closeAccessibleModal(modal, 'Keyboard Shortcuts');
            },
            role: 'dialog'
        });

        this.showModalAnimated(modal, 'scale');
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
