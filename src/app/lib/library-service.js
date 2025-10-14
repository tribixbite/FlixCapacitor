/**
 * Library Service
 * Handles local media library scanning, metadata fetching, and management
 */

import sqliteService from './sqlite-service.js';
import filenameParser from './filename-parser.js';
import { Filesystem, Directory } from '@capacitor/filesystem';

class LibraryService {
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

        // TMDB/OMDB API keys - should be moved to config
        this.tmdbApiKey = null; // # TODO: Get from App.Config
        this.omdbApiKey = null; // # TODO: Get from App.Config
    }

    /**
     * Scan folders for media files
     * @param {Array<string>} folderPaths - Array of folder paths to scan
     * @param {Function} progressCallback - Progress callback (current, total, filename)
     * @returns {Promise<Object>} Scan results {found, matched, errors}
     */
    async scanFolders(folderPaths, progressCallback = null) {
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

        const results = {
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
                        } catch (error) {
                            console.error('Failed to add media file:', file.path, error);
                            results.errors.push({ file: file.path, error: error.message });
                        }
                    }
                } catch (error) {
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
     * @param {string} folderPath - Folder path to scan
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Array<Object>>} Array of file objects
     */
    async scanFolderRecursive(folderPath, progressCallback) {
        const files = [];

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
                    const ext = '.' + item.name.split('.').pop().toLowerCase();
                    if (this.videoExtensions.includes(ext)) {
                        const fileInfo = {
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
        } catch (error) {
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
     * @param {Object} file - File object {path, size, modified}
     * @returns {Promise<boolean>} True if added successfully
     */
    async addMediaFile(file) {
        const filename = file.path.split('/').pop();

        // Parse filename
        const parsed = this.parser.parse(filename);

        // Check if already exists
        const existing = await this.db.findOne('local_media', 'file_path = ?', [file.path]);
        if (existing) {
            console.log('File already in library:', file.path);
            return false;
        }

        // Fetch metadata if possible
        let metadata = null;
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
     * @param {Object} parsed - Parsed filename data
     * @returns {Promise<Object|null>} Metadata
     */
    async fetchMetadata(parsed) {
        if (!parsed || !parsed.title) {
            return null;
        }

        try {
            const metadata = {
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
            const tmdbClient = window.TMDBClient || window.App?.providers?.TMDB;
            if (!tmdbClient) {
                console.warn('TMDB client not available');
                return metadata;
            }

            console.log(`Fetching metadata for: ${parsed.title} (${parsed.year || 'unknown year'})`);

            // Search based on media type
            let searchResults;
            if (parsed.type === 'tvshow') {
                searchResults = await tmdbClient.searchTVShow(parsed.title, parsed.year);
            } else {
                searchResults = await tmdbClient.searchMovie(parsed.title, parsed.year);
            }

            if (searchResults && searchResults.results && searchResults.results.length > 0) {
                const result = searchResults.results[0];

                // Get detailed information
                let details;
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
                    metadata.genres = details.genres?.map(g => g.name).join(',') || null;
                    metadata.rating = details.vote_average || null;
                    metadata.synopsis = details.overview || null;
                    metadata.imdb_id = details.external_ids?.imdb_id || details.imdb_id || null;

                    console.log(`✓ TMDB metadata found for ${metadata.title}`);

                    // Optionally fetch OMDb ratings if we have IMDb ID
                    if (metadata.imdb_id) {
                        try {
                            const omdbClient = window.OMDbClient || window.App?.providers?.OMDb;
                            if (omdbClient) {
                                const omdbData = await omdbClient.getByIMDbId(metadata.imdb_id);
                                if (omdbData && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                                    metadata.rating = parseFloat(omdbData.imdbRating);
                                    console.log(`✓ OMDb rating: ${omdbData.imdbRating}`);
                                }
                            }
                        } catch (omdbError) {
                            console.warn('OMDb fetch failed:', omdbError.message);
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
     * @param {Object} filters - {type, genre, search, sort, limit, offset}
     * @returns {Promise<Array<Object>>} Library items
     */
    async getLibraryItems(filters = {}) {
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
        const params = [];

        // Normalize type value (display name -> internal value)
        if (type && type !== 'All') {
            const typeMap = {
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
        const sortMap = {
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
     * @param {string} mediaType - 'movie' or 'tvshow'
     * @returns {Promise<Array<string>>} Genre list
     */
    async getGenres(mediaType = null) {
        let sql = 'SELECT DISTINCT genres FROM local_media WHERE genres IS NOT NULL';
        const params = [];

        if (mediaType) {
            sql += ' AND media_type = ?';
            params.push(mediaType);
        }

        const rows = await this.db.query(sql, params);

        // Extract unique genres from JSON arrays
        const genreSet = new Set();
        rows.forEach(row => {
            try {
                const genres = JSON.parse(row.genres);
                genres.forEach(genre => genreSet.add(genre));
            } catch (e) {
                // Ignore parse errors
            }
        });

        return Array.from(genreSet).sort();
    }

    /**
     * Get library statistics
     * @returns {Promise<Object>} Stats {total, movies, tvshows, other}
     */
    async getStats() {
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
     * @param {number} limit - Number of scans to retrieve
     * @returns {Promise<Array<Object>>} Scan history
     */
    async getScanHistory(limit = 10) {
        const sql = 'SELECT * FROM scan_history ORDER BY start_time DESC LIMIT ?';
        return await this.db.query(sql, [limit]);
    }

    /**
     * Remove an item from library
     * @param {number} id - Media ID
     * @returns {Promise<boolean>} True if removed
     */
    async removeItem(id) {
        const result = await this.db.delete('local_media', 'id = ?', [id]);
        return result > 0;
    }

    /**
     * Update metadata for an item
     * @param {number} id - Media ID
     * @param {Object} metadata - Metadata to update
     * @returns {Promise<boolean>} True if updated
     */
    async updateMetadata(id, metadata) {
        const result = await this.db.update('local_media', metadata, 'id = ?', [id]);
        return result > 0;
    }

    /**
     * Refresh metadata for an item
     * @param {number} id - Media ID
     * @returns {Promise<boolean>} True if refreshed
     */
    async refreshMetadata(id) {
        const item = await this.db.findOne('local_media', 'id = ?', [id]);
        if (!item) return false;

        const filename = item.file_path.split('/').pop();
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
     * @returns {Promise<boolean>} True if cleared
     */
    async clearLibrary() {
        await this.db.run('DELETE FROM local_media');
        console.log('Library cleared');
        return true;
    }

    /**
     * Cancel ongoing scan
     */
    cancelScan() {
        this.scanCancelled = true;
        console.log('Scan cancellation requested');
    }

    /**
     * Check if scan is running
     * @returns {boolean} True if scanning
     */
    isScanning() {
        return this.currentScan !== null;
    }

    /**
     * Classify media type from file
     * @param {string} filePath - File path
     * @returns {string} Media type
     */
    classifyMediaType(filePath) {
        const filename = filePath.split('/').pop();
        return this.parser.classifyType(filename);
    }

    /**
     * Get media items - wrapper for getLibraryItems for collection compatibility
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Media items
     */
    async getMedia(filters = {}) {
        return this.getLibraryItems(filters);
    }

    /**
     * Get total media count
     * @returns {Promise<number>} Total count of media items
     */
    async getMediaCount() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM local_media');
        return result[0]?.count || 0;
    }
}

// Export as singleton
const libraryService = new LibraryService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = libraryService;
}

if (typeof window !== 'undefined') {
    window.LibraryService = libraryService;
}
