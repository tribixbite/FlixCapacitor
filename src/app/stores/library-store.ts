/**
 * Library Store
 * Phase 9B.1: Centralized state management for library and scanning
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

/**
 * Movie interface
 */
export interface Movie {
    id: string;
    title: string;
    year: number;
    imdbId?: string;
    rating?: number;
    synopsis?: string;
    genres?: string[];
    posterUrl?: string;
    backdropUrl?: string;
    runtime?: number;
    director?: string;
    cast?: string[];
    torrentUrl?: string;
    files?: Array<{
        index: number;
        name: string;
        size: number;
    }>;
    lastPlayed?: number;
    playbackPosition?: number;
    addedAt: number;
}

/**
 * Folder interface
 */
export interface LibraryFolder {
    id: string;
    path: string;
    name: string;
    movieCount: number;
    lastScanned: number | null;
    isScanning: boolean;
}

/**
 * Scan status interface
 */
export interface ScanStatus {
    isScanning: boolean;
    currentFolder: string | null;
    phase: 'discovery' | 'processing' | 'metadata' | 'complete' | null;
    filesFound: number;
    filesProcessed: number;
    filesTotal: number | null;
    progress: number; // 0-100
    estimatedRemainingMs: number | null;
    canCancel: boolean;
    error: string | null;
}

/**
 * Library state interface
 */
export interface LibraryState {
    // Movies
    movies: Movie[];
    moviesById: Record<string, Movie>;
    isLoadingMovies: boolean;

    // Folders
    folders: LibraryFolder[];
    foldersById: Record<string, LibraryFolder>;

    // Scan status
    scanStatus: ScanStatus;

    // Filters and sorting
    filterGenre: string | null;
    filterYear: { min: number | null; max: number | null };
    filterRating: number | null;
    sortBy: 'title' | 'year' | 'rating' | 'addedAt' | 'lastPlayed';
    sortOrder: 'asc' | 'desc';
    searchQuery: string;

    // Actions - Movies
    setMovies: (movies: Movie[]) => void;
    addMovie: (movie: Movie) => void;
    updateMovie: (id: string, updates: Partial<Movie>) => void;
    removeMovie: (id: string) => void;
    setIsLoadingMovies: (loading: boolean) => void;

    // Actions - Folders
    setFolders: (folders: LibraryFolder[]) => void;
    addFolder: (folder: LibraryFolder) => void;
    updateFolder: (id: string, updates: Partial<LibraryFolder>) => void;
    removeFolder: (id: string) => void;

    // Actions - Scan
    setScanStatus: (status: Partial<ScanStatus>) => void;
    startScan: (folderPath: string) => void;
    cancelScan: () => void;
    completeScan: () => void;
    setScanError: (error: string) => void;

    // Actions - Filters
    setFilterGenre: (genre: string | null) => void;
    setFilterYear: (min: number | null, max: number | null) => void;
    setFilterRating: (rating: number | null) => void;
    setSortBy: (sortBy: LibraryState['sortBy']) => void;
    setSortOrder: (order: LibraryState['sortOrder']) => void;
    setSearchQuery: (query: string) => void;
    clearFilters: () => void;

    // Helpers
    getMovieById: (id: string) => Movie | undefined;
    getFolderById: (id: string) => LibraryFolder | undefined;
}

/**
 * Initial library state
 */
const initialState = {
    movies: [],
    moviesById: {},
    isLoadingMovies: false,

    folders: [],
    foldersById: {},

    scanStatus: {
        isScanning: false,
        currentFolder: null,
        phase: null,
        filesFound: 0,
        filesProcessed: 0,
        filesTotal: null,
        progress: 0,
        estimatedRemainingMs: null,
        canCancel: false,
        error: null
    },

    filterGenre: null,
    filterYear: { min: null, max: null },
    filterRating: null,
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
    searchQuery: ''
};

/**
 * Library store
 */
export const useLibraryStore = create<LibraryState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // Movie actions
                setMovies: (movies) => {
                    const moviesById: Record<string, Movie> = {};
                    for (const movie of movies) {
                        moviesById[movie.id] = movie;
                    }
                    set({ movies, moviesById });
                },

                addMovie: (movie) => set((state) => {
                    const movies = [...state.movies, movie];
                    const moviesById = { ...state.moviesById, [movie.id]: movie };
                    return { movies, moviesById };
                }),

                updateMovie: (id, updates) => set((state) => {
                    const movie = state.moviesById[id];
                    if (!movie) return state;

                    const updatedMovie = { ...movie, ...updates };
                    const moviesById = { ...state.moviesById, [id]: updatedMovie };
                    const movies = state.movies.map(m => m.id === id ? updatedMovie : m);
                    return { movies, moviesById };
                }),

                removeMovie: (id) => set((state) => {
                    const movies = state.movies.filter(m => m.id !== id);
                    const moviesById = { ...state.moviesById };
                    delete moviesById[id];
                    return { movies, moviesById };
                }),

                setIsLoadingMovies: (loading) => set({ isLoadingMovies: loading }),

                // Folder actions
                setFolders: (folders) => {
                    const foldersById: Record<string, LibraryFolder> = {};
                    for (const folder of folders) {
                        foldersById[folder.id] = folder;
                    }
                    set({ folders, foldersById });
                },

                addFolder: (folder) => set((state) => {
                    const folders = [...state.folders, folder];
                    const foldersById = { ...state.foldersById, [folder.id]: folder };
                    return { folders, foldersById };
                }),

                updateFolder: (id, updates) => set((state) => {
                    const folder = state.foldersById[id];
                    if (!folder) return state;

                    const updatedFolder = { ...folder, ...updates };
                    const foldersById = { ...state.foldersById, [id]: updatedFolder };
                    const folders = state.folders.map(f => f.id === id ? updatedFolder : f);
                    return { folders, foldersById };
                }),

                removeFolder: (id) => set((state) => {
                    const folders = state.folders.filter(f => f.id !== id);
                    const foldersById = { ...state.foldersById };
                    delete foldersById[id];
                    return { folders, foldersById };
                }),

                // Scan actions
                setScanStatus: (status) => set((state) => ({
                    scanStatus: { ...state.scanStatus, ...status }
                })),

                startScan: (folderPath) => set((state) => ({
                    scanStatus: {
                        ...initialState.scanStatus,
                        isScanning: true,
                        currentFolder: folderPath,
                        canCancel: true,
                        phase: 'discovery'
                    }
                })),

                cancelScan: () => set((state) => ({
                    scanStatus: {
                        ...initialState.scanStatus,
                        isScanning: false
                    }
                })),

                completeScan: () => set((state) => ({
                    scanStatus: {
                        ...state.scanStatus,
                        isScanning: false,
                        phase: 'complete',
                        progress: 100,
                        estimatedRemainingMs: 0,
                        canCancel: false
                    }
                })),

                setScanError: (error) => set((state) => ({
                    scanStatus: {
                        ...state.scanStatus,
                        isScanning: false,
                        error,
                        canCancel: false
                    }
                })),

                // Filter actions
                setFilterGenre: (genre) => set({ filterGenre: genre }),
                setFilterYear: (min, max) => set({ filterYear: { min, max } }),
                setFilterRating: (rating) => set({ filterRating: rating }),
                setSortBy: (sortBy) => set({ sortBy }),
                setSortOrder: (order) => set({ sortOrder: order }),
                setSearchQuery: (query) => set({ searchQuery: query }),
                clearFilters: () => set({
                    filterGenre: null,
                    filterYear: { min: null, max: null },
                    filterRating: null,
                    searchQuery: ''
                }),

                // Helpers
                getMovieById: (id) => get().moviesById[id],
                getFolderById: (id) => get().foldersById[id]
            }),
            {
                name: 'library-storage',
                storage: createJSONStorage(() => localStorage),
                // Persist movies and folders, but not transient state
                partialize: (state) => ({
                    movies: state.movies,
                    moviesById: state.moviesById,
                    folders: state.folders,
                    foldersById: state.foldersById,
                    sortBy: state.sortBy,
                    sortOrder: state.sortOrder
                })
            }
        ),
        {
            name: 'LibraryStore',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

/**
 * Selectors for derived state
 */
export const librarySelectors = {
    // Filtered and sorted movies
    filteredMovies: (state: LibraryState): Movie[] => {
        let movies = state.movies;

        // Apply search query
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            movies = movies.filter(m =>
                m.title.toLowerCase().includes(query) ||
                m.synopsis?.toLowerCase().includes(query) ||
                m.genres?.some(g => g.toLowerCase().includes(query))
            );
        }

        // Apply genre filter
        if (state.filterGenre) {
            movies = movies.filter(m =>
                m.genres?.includes(state.filterGenre!)
            );
        }

        // Apply year filter
        if (state.filterYear.min !== null) {
            movies = movies.filter(m => m.year >= state.filterYear.min!);
        }
        if (state.filterYear.max !== null) {
            movies = movies.filter(m => m.year <= state.filterYear.max!);
        }

        // Apply rating filter
        if (state.filterRating !== null) {
            movies = movies.filter(m => (m.rating || 0) >= state.filterRating!);
        }

        // Sort movies
        movies.sort((a, b) => {
            let comparison = 0;
            switch (state.sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'year':
                    comparison = a.year - b.year;
                    break;
                case 'rating':
                    comparison = (a.rating || 0) - (b.rating || 0);
                    break;
                case 'addedAt':
                    comparison = a.addedAt - b.addedAt;
                    break;
                case 'lastPlayed':
                    comparison = (a.lastPlayed || 0) - (b.lastPlayed || 0);
                    break;
            }
            return state.sortOrder === 'asc' ? comparison : -comparison;
        });

        return movies;
    },

    // Get unique genres from all movies
    availableGenres: (state: LibraryState): string[] => {
        const genresSet = new Set<string>();
        for (const movie of state.movies) {
            if (movie.genres) {
                for (const genre of movie.genres) {
                    genresSet.add(genre);
                }
            }
        }
        return Array.from(genresSet).sort();
    },

    // Get year range
    yearRange: (state: LibraryState): { min: number; max: number } => {
        if (state.movies.length === 0) return { min: 1900, max: new Date().getFullYear() };

        const years = state.movies.map(m => m.year);
        return {
            min: Math.min(...years),
            max: Math.max(...years)
        };
    },

    // Recently played movies
    recentlyPlayed: (state: LibraryState): Movie[] => {
        return state.movies
            .filter(m => m.lastPlayed)
            .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
            .slice(0, 10);
    },

    // In-progress movies (have playback position > 0 but < 90%)
    inProgress: (state: LibraryState): Movie[] => {
        return state.movies
            .filter(m => {
                if (!m.playbackPosition || !m.runtime) return false;
                const progress = m.playbackPosition / m.runtime;
                return progress > 0 && progress < 0.9;
            })
            .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
            .slice(0, 10);
    },

    // Has active filters
    hasActiveFilters: (state: LibraryState): boolean => {
        return !!(
            state.filterGenre ||
            state.filterYear.min !== null ||
            state.filterYear.max !== null ||
            state.filterRating !== null ||
            state.searchQuery
        );
    },

    // Scan progress message
    scanProgressMessage: (state: LibraryState): string => {
        const { scanStatus } = state;
        if (!scanStatus.isScanning) return '';

        const phase = scanStatus.phase;
        const progress = scanStatus.progress.toFixed(0);

        if (phase === 'discovery') {
            return `Discovering files... ${scanStatus.filesFound} found`;
        }
        if (phase === 'processing') {
            return `Processing... ${scanStatus.filesProcessed}/${scanStatus.filesTotal} (${progress}%)`;
        }
        if (phase === 'metadata') {
            return `Fetching metadata... ${progress}%`;
        }
        if (phase === 'complete') {
            return 'Scan complete!';
        }

        return `Scanning... ${progress}%`;
    },

    // Total library stats
    libraryStats: (state: LibraryState) => ({
        totalMovies: state.movies.length,
        totalFolders: state.folders.length,
        totalRuntime: state.movies.reduce((sum, m) => sum + (m.runtime || 0), 0),
        averageRating: state.movies.length > 0
            ? state.movies.reduce((sum, m) => sum + (m.rating || 0), 0) / state.movies.length
            : 0
    })
};
