/**
 * Library Service
 * Handles local media library scanning, metadata fetching, and management
 */

import sqliteService from './sqlite-service';
import filenameParser from './filename-parser';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { SQLiteService } from './sqlite-service';
import ApiConfig from './config/api-config';

export interface FileInfo {
    path: string;
    name: string;
    size: number;
    modified: number;
}

export interface ScanResults {
    found: number;
    matched: number;
    errors: Array<{ file?: string; folder?: string; error: string }>;
}

export interface MediaMetadata {
    title: string;
    year?: number | null;
    imdb_id?: string | null;
    tmdb_id?: number | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    genres?: string | null;
    rating?: number | null;
    synopsis?: string | null;
    poster?: string | null;
    backdrop?: string | null;
}

export interface LibraryFilters {
    type?: string | null;
    genre?: string | null;
    search?: string | null;
    sorter?: string | null;
    sort?: string | null;
    limit?: number;
    offset?: number;
}

export interface LibraryStats {
    total: number;
    movies: number;
    tvshows: number;
    other: number;
}

export interface ScanHistory {
    scan_id: number;
    scan_type: string;
    folders_scanned: string;
    items_found: number;
    items_matched: number;
    start_time: number;
    end_time?: number;
    status: 'running' | 'completed' | 'cancelled' | 'error';
}

export interface MediaItem {
    id: number;
    file_path: string;
    file_size: number;
    media_type: 'movie' | 'tvshow' | 'other';
    title: string;
    year?: number | null;
    season?: number | null;
    episode?: number | null;
    imdb_id?: string | null;
    tmdb_id?: number | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    genres?: string | null;
    rating?: number | null;
    metadata_json?: string | null;
    last_modified: number;
    date_added: number;
    last_played?: number | null;
    play_count: number;
}

type ProgressCallback = (current: number, total: number | null, filename: string) => void;

class LibraryService {
    private db: SQLiteService;
    private parser: typeof filenameParser;
    private currentScan: { id: number } | null;
    private scanCancelled: boolean;
    private videoExtensions: string[];
    private tmdbApiKey: string | null;
    private omdbApiKey: string | null;

    constructor() {
        this.db = sqliteService;
        this.parser = filenameParser;
        this.currentScan = null;
        this.scanCancelled = false;

        // Supported video extensions
        this.videoExtensions = [
            '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
            '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ogv'
        ];

        // TMDB/OMDB API keys - loaded from ApiConfig (checks SettingsManager then env vars)
        this.tmdbApiKey = ApiConfig.tmdb.apiKey || null;
        this.omdbApiKey = ApiConfig.omdb.apiKey || null;
    }

    /**
     * Scan folders for media files
     */
    async scanFolders(folderPaths: string[], progressCallback: ProgressCallback | null = null): Promise<ScanResults> {
        if (!folderPaths || folderPaths.length === 0) {
            throw new Error('No folders specified for scanning');
        }

        console.log('Starting library scan for folders:', folderPaths);

        // Create scan history entry
        const scanId = await this.db.insert('scan_history', {
            scan_type: 'folder',
            folders_scanned: JSON.stringify(folderPaths),
            items_found: 0,
            items_matched: 0,
            start_time: Math.floor(Date.now() / 1000),
            status: 'running'
        });

        this.currentScan = { id: scanId };
        this.scanCancelled = false;

        const results: ScanResults = {
            found: 0,
            matched: 0,
            errors: []
        };

        try {
            // Scan each folder
            for (const folderPath of folderPaths) {
                if (this.scanCancelled) {
                    console.log('Scan cancelled by user');
                    break;
                }

                try {
                    const files = await this.scanFolderRecursive(folderPath, progressCallback);

                    // Process each file
                    for (const file of files) {
                        if (this.scanCancelled) break;

                        results.found++;

                        if (progressCallback) {
                            progressCallback(results.found, files.length, file.path);
                        }

                        try {
                            const added = await this.addMediaFile(file);
                            if (added) {
                                results.matched++;
                            }
                        } catch (error: any) {
                            console.error('Failed to add media file:', file.path, error);
                            results.errors.push({ file: file.path, error: error.message });
                        }
                    }
                } catch (error: any) {
                    console.error('Failed to scan folder:', folderPath, error);
                    results.errors.push({ folder: folderPath, error: error.message });
                }
            }

            // Update scan history
            await this.db.update('scan_history', {
                items_found: results.found,
                items_matched: results.matched,
                end_time: Math.floor(Date.now() / 1000),
                status: this.scanCancelled ? 'cancelled' : 'completed'
            }, 'scan_id = ?', [scanId]);

            console.log('Scan complete:', results);
            return results;

        } catch (error) {
            // Update scan history with error
            await this.db.update('scan_history', {
                end_time: Math.floor(Date.now() / 1000),
                status: 'error'
            }, 'scan_id = ?', [scanId]);

            throw error;
        } finally {
            this.currentScan = null;
        }
    }

    /**
     * Scan a folder recursively for video files
     */
    private async scanFolderRecursive(folderPath: string, progressCallback: ProgressCallback | null): Promise<FileInfo[]> {
        const files: FileInfo[] = [];

        try {
            console.log('Scanning folder:', folderPath);

            // Read directory contents
            const result = await Filesystem.readdir({
                path: folderPath,
                directory: Directory.ExternalStorage
            });

            for (const item of result.files) {
                if (this.scanCancelled) {
                    console.log('Scan cancelled by user');
                    break;
                }

                const itemPath = `${folderPath}/${item.name}`;

                // Check if it's a directory
                if (item.type === 'directory') {
                    // Recursively scan subdirectory
                    const subFiles = await this.scanFolderRecursive(itemPath, progressCallback);
                    files.push(...subFiles);
                } else {
                    // Check if it's a video file
                    const ext = '.' + item.name.split('.').pop()!.toLowerCase();
                    if (this.videoExtensions.includes(ext)) {
                        const fileInfo: FileInfo = {
                            path: itemPath,
                            name: item.name,
                            size: item.size || 0,
                            modified: item.mtime || Math.floor(Date.now() / 1000)
                        };

                        files.push(fileInfo);

                        // Call progress callback
                        if (progressCallback) {
                            progressCallback(files.length, null, item.name);
                        }

                        console.log('Found video file:', item.name);
                    }
                }
            }

            return files;
        } catch (error: any) {
            console.error('Error scanning folder:', folderPath, error);

            // If permission denied, try alternative method
            if (error.message && error.message.includes('permission')) {
                console.warn('Permission denied for:', folderPath);
                console.warn('User may need to grant storage permissions');
            }

            return files;
        }
    }

    /**
     * Add a media file to the library
     */
    private async addMediaFile(file: FileInfo): Promise<boolean> {
        const filename = file.path.split('/').pop()!;

        // Parse filename
        const parsed = this.parser.parse(filename);

        // Check if already exists
        const existing = await this.db.findOne('local_media', 'file_path = ?', [file.path]);
        if (existing) {
            console.log('File already in library:', file.path);
            return false;
        }

        // Fetch metadata if possible
        let metadata: MediaMetadata | null = null;
        if (parsed.type !== 'other') {
            try {
                metadata = await this.fetchMetadata(parsed);
            } catch (error) {
                console.warn('Failed to fetch metadata for:', filename, error);
            }
        }

        // Insert into database
        await this.db.insert('local_media', {
            file_path: file.path,
            file_size: file.size || 0,
            media_type: parsed.type,
            title: metadata?.title || parsed.title,
            year: metadata?.year || parsed.year || null,
            season: parsed.season || null,
            episode: parsed.episode || null,
            imdb_id: metadata?.imdb_id || null,
            tmdb_id: metadata?.tmdb_id || null,
            poster_url: metadata?.poster || null,
            backdrop_url: metadata?.backdrop || null,
            genres: metadata?.genres ? JSON.stringify(metadata.genres) : null,
            rating: metadata?.rating || null,
            metadata_json: metadata ? JSON.stringify(metadata) : null,
            last_modified: file.modified || Math.floor(Date.now() / 1000)
        });

        console.log('Added to library:', filename, parsed.type);
        return true;
    }

    /**
     * Fetch metadata from TMDB/OMDB
     */
    private async fetchMetadata(parsed: any): Promise<MediaMetadata | null> {
        if (!parsed || !parsed.title) {
            return null;
        }

        try {
            const metadata: MediaMetadata = {
                title: parsed.title,
                year: parsed.year,
                imdb_id: null,
                tmdb_id: null,
                poster_url: null,
                backdrop_url: null,
                genres: null,
                rating: null,
                synopsis: null
            };

            // Search TMDB by title and year
            const tmdbClient = (window as any).TMDBClient || (window as any).App?.providers?.TMDB;
            if (!tmdbClient) {
                console.warn('TMDB client not available');
                return metadata;
            }

            console.log(`Fetching metadata for: ${parsed.title} (${parsed.year || 'unknown year'})`);

            // Search based on media type
            let searchResults: any;
            if (parsed.type === 'tvshow') {
                searchResults = await tmdbClient.searchTVShow(parsed.title, parsed.year);
            } else {
                searchResults = await tmdbClient.searchMovie(parsed.title, parsed.year);
            }

            if (searchResults && searchResults.results && searchResults.results.length > 0) {
                const result = searchResults.results[0];

                // Get detailed information
                let details: any;
                if (parsed.type === 'tvshow') {
                    details = await tmdbClient.getTVShowDetails(result.id);
                } else {
                    details = await tmdbClient.getMovieDetails(result.id);
                }

                if (details) {
                    metadata.title = details.title || details.name || metadata.title;
                    metadata.tmdb_id = details.id;
                    metadata.year = metadata.year || (details.release_date ? parseInt(details.release_date.split('-')[0]) : null) ||
                                   (details.first_air_date ? parseInt(details.first_air_date.split('-')[0]) : null);
                    metadata.poster_url = tmdbClient.getBestPoster(details);
                    metadata.backdrop_url = tmdbClient.getBestBackdrop(details);
                    metadata.genres = details.genres?.map((g: any) => g.name).join(',') || null;
                    metadata.rating = details.vote_average || null;
                    metadata.synopsis = details.overview || null;
                    metadata.imdb_id = details.external_ids?.imdb_id || details.imdb_id || null;

                    console.log(`✓ TMDB metadata found for ${metadata.title}`);

                    // Optionally fetch OMDb ratings if we have IMDb ID
                    if (metadata.imdb_id) {
                        try {
                            const omdbClient = (window as any).OMDbClient || (window as any).App?.providers?.OMDb;
                            if (omdbClient) {
                                const omdbData = await omdbClient.getByIMDbId(metadata.imdb_id);
                                if (omdbData && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                                    metadata.rating = parseFloat(omdbData.imdbRating);
                                    console.log(`✓ OMDb rating: ${omdbData.imdbRating}`);
                                }
                            }
                        } catch (omdbError) {
                            console.warn('OMDb fetch failed:', (omdbError as any).message);
                        }
                    }
                }
            } else {
                console.log(`✗ No TMDB results for ${parsed.title}`);
            }

            return metadata;
        } catch (error) {
            console.error('Metadata fetch error:', error);
            return null;
        }
    }

    /**
     * Get library items with filters
     */
    async getLibraryItems(filters: LibraryFilters = {}): Promise<MediaItem[]> {
        const {
            type = null,
            genre = null,
            search = null,
            sorter = null,
            sort = null,
            limit = 50,
            offset = 0
        } = filters;

        // Use sorter if provided, otherwise use sort, default to 'date_added'
        const sortBy = sorter || sort || 'date_added';

        let sql = 'SELECT * FROM local_media WHERE 1=1';
        const params: any[] = [];

        // Normalize type value (display name -> internal value)
        if (type && type !== 'All') {
            const typeMap: Record<string, string> = {
                'Movies': 'movie',
                'TV Shows': 'tvshow',
                'Other': 'other'
            };
            const normalizedType = typeMap[type] || type.toLowerCase();
            sql += ' AND media_type = ?';
            params.push(normalizedType);
        }

        // Normalize genre value
        if (genre && genre !== 'All') {
            sql += ' AND genres LIKE ?';
            params.push(`%${genre}%`);
        }

        if (search) {
            sql += ' AND title LIKE ?';
            params.push(`%${search}%`);
        }

        // Sorting - handle both internal and display names
        const sortMap: Record<string, string> = {
            'date added': 'date_added DESC',
            'date_added': 'date_added DESC',
            'title': 'title ASC',
            'year': 'year DESC',
            'rating': 'rating DESC',
            'last played': 'last_played DESC',
            'last_played': 'last_played DESC',
            'play count': 'play_count DESC',
            'play_count': 'play_count DESC'
        };
        const sortColumn = sortMap[sortBy] || sortMap[sortBy?.toLowerCase()] || 'date_added DESC';

        sql += ` ORDER BY ${sortColumn}`;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.query(sql, params);
    }

    /**
     * Get genres for a media type
     */
    async getGenres(mediaType: string | null = null): Promise<string[]> {
        let sql = 'SELECT DISTINCT genres FROM local_media WHERE genres IS NOT NULL';
        const params: any[] = [];

        if (mediaType) {
            sql += ' AND media_type = ?';
            params.push(mediaType);
        }

        const rows = await this.db.query(sql, params);

        // Extract unique genres from JSON arrays
        const genreSet = new Set<string>();
        rows.forEach((row: any) => {
            try {
                const genres = JSON.parse(row.genres);
                genres.forEach((genre: string) => genreSet.add(genre));
            } catch (e) {
                // Ignore parse errors
            }
        });

        return Array.from(genreSet).sort();
    }

    /**
     * Get library statistics
     */
    async getStats(): Promise<LibraryStats> {
        const sql = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN media_type = 'movie' THEN 1 ELSE 0 END) as movies,
                SUM(CASE WHEN media_type = 'tvshow' THEN 1 ELSE 0 END) as tvshows,
                SUM(CASE WHEN media_type = 'other' THEN 1 ELSE 0 END) as other
            FROM local_media
        `;

        const rows = await this.db.query(sql);
        return rows[0] || { total: 0, movies: 0, tvshows: 0, other: 0 };
    }

    /**
     * Get scan history
     */
    async getScanHistory(limit: number = 10): Promise<ScanHistory[]> {
        const sql = 'SELECT * FROM scan_history ORDER BY start_time DESC LIMIT ?';
        return await this.db.query(sql, [limit]);
    }

    /**
     * Remove an item from library
     */
    async removeItem(id: number): Promise<boolean> {
        const result = await this.db.delete('local_media', 'id = ?', [id]);
        return result > 0;
    }

    /**
     * Update metadata for an item
     */
    async updateMetadata(id: number, metadata: Partial<MediaItem>): Promise<boolean> {
        const result = await this.db.update('local_media', metadata, 'id = ?', [id]);
        return result > 0;
    }

    /**
     * Refresh metadata for an item
     */
    async refreshMetadata(id: number): Promise<boolean> {
        const item = await this.db.findOne('local_media', 'id = ?', [id]);
        if (!item) return false;

        const filename = item.file_path.split('/').pop()!;
        const parsed = this.parser.parse(filename);

        const metadata = await this.fetchMetadata(parsed);
        if (metadata) {
            return await this.updateMetadata(id, {
                title: metadata.title,
                year: metadata.year,
                imdb_id: metadata.imdb_id,
                tmdb_id: metadata.tmdb_id,
                poster_url: metadata.poster,
                backdrop_url: metadata.backdrop,
                genres: JSON.stringify(metadata.genres),
                rating: metadata.rating,
                metadata_json: JSON.stringify(metadata)
            });
        }

        return false;
    }

    /**
     * Clear entire library
     */
    async clearLibrary(): Promise<boolean> {
        await this.db.run('DELETE FROM local_media');
        console.log('Library cleared');
        return true;
    }

    /**
     * Cancel ongoing scan
     */
    cancelScan(): void {
        this.scanCancelled = true;
        console.log('Scan cancellation requested');
    }

    /**
     * Check if scan is running
     */
    isScanning(): boolean {
        return this.currentScan !== null;
    }

    /**
     * Classify media type from file
     */
    classifyMediaType(filePath: string): string {
        const filename = filePath.split('/').pop()!;
        return this.parser.classifyType(filename);
    }

    /**
     * Get media items - wrapper for getLibraryItems for collection compatibility
     */
    async getMedia(filters: LibraryFilters = {}): Promise<MediaItem[]> {
        return this.getLibraryItems(filters);
    }

    /**
     * Get total media count
     */
    async getMediaCount(): Promise<number> {
        const result = await this.db.query('SELECT COUNT(*) as count FROM local_media');
        return result[0]?.count || 0;
    }
}

// Export as singleton
const libraryService = new LibraryService();

// Export for ES modules
export { libraryService, LibraryService };
export default libraryService;

// Export for window
if (typeof window !== 'undefined') {
    window.LibraryService = libraryService;
}
