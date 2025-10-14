/**
 * Filename Parser Service
 * Extracts metadata (title, year, season, episode) from media filenames
 */

class FilenameParser {
    constructor() {
        // Movie patterns
        this.moviePatterns = [
            // Movie.Name.(2020).[1080p].mkv
            /^(.+?)[\s._]*\((\d{4})\)/,
            // Movie.Name.2020.BluRay.mkv
            /^(.+?)[\s._]*(\d{4})[\s._]/,
            // [Group] Movie Name (2020)
            /^\[.+?\][\s._]*(.+?)[\s._]*\((\d{4})\)/,
            // Movie Name 2020
            /^(.+?)[\s._]*(\d{4})$/,
            // Fallback: just the title without year
            /^(.+?)[\s._]*$/
        ];

        // TV Show patterns
        this.tvShowPatterns = [
            // Show.Name.S01E05.mkv or S01E05
            /^(.+?)[\s._]*[Ss](\d{1,2})[Ee](\d{1,2})/,
            // ShowName (2020) - S01E05.mp4
            /^(.+?)[\s._]*\((\d{4})\)[\s._-]*[Ss](\d{1,2})[Ee](\d{1,2})/,
            // Show Name 1x05.mkv
            /^(.+?)[\s._]*(\d{1,2})[xX](\d{1,2})/,
            // Show Name Season 1 Episode 5
            /^(.+?)[\s._]*[Ss]eason[\s._]*(\d{1,2})[\s._]*[Ee]pisode[\s._]*(\d{1,2})/i,
            // Show Name 105 (season 1 episode 5)
            /^(.+?)[\s._]*(\d)(\d{2})/
        ];

        // Quality indicators to remove
        this.qualityIndicators = [
            '1080p', '720p', '480p', '2160p', '4K',
            'BluRay', 'BRRip', 'DVDRip', 'WEBRip', 'WEB-DL',
            'x264', 'x265', 'HEVC', 'h264', 'h265',
            'AAC', 'AC3', 'DTS',
            'PROPER', 'REPACK', 'EXTENDED', 'UNRATED'
        ];

        // Group tags to remove
        this.groupTagPattern = /^\[.+?\]/;
    }

    /**
     * Parse a filename to extract metadata
     * @param {string} filename - The filename to parse
     * @returns {Object} Parsed metadata {title, year, season, episode, type}
     */
    parse(filename) {
        if (!filename) {
            return { title: 'Unknown', type: 'other' };
        }

        // Remove file extension
        let baseName = filename.replace(/\.[^.]+$/, '');

        // Remove group tags
        baseName = baseName.replace(this.groupTagPattern, '').trim();

        // Try TV show patterns first
        const tvResult = this.parseTVShow(baseName);
        if (tvResult) {
            return { ...tvResult, type: 'tvshow', originalFilename: filename };
        }

        // Try movie patterns
        const movieResult = this.parseMovie(baseName);
        if (movieResult) {
            return { ...movieResult, type: 'movie', originalFilename: filename };
        }

        // Fallback
        return {
            title: this.cleanTitle(baseName),
            type: 'other',
            originalFilename: filename
        };
    }

    /**
     * Parse TV show filename
     * @param {string} baseName - Filename without extension
     * @returns {Object|null} Parsed TV show data or null
     */
    parseTVShow(baseName) {
        for (const pattern of this.tvShowPatterns) {
            const match = baseName.match(pattern);
            if (match) {
                const result = {
                    title: this.cleanTitle(match[1]),
                    season: null,
                    episode: null
                };

                // Handle different capture group arrangements
                if (pattern.source.includes('\\(\\d{4}\\)')) {
                    // Pattern with year
                    result.year = parseInt(match[2]);
                    result.season = parseInt(match[3]);
                    result.episode = parseInt(match[4]);
                } else {
                    // Pattern without year
                    result.season = parseInt(match[2]);
                    result.episode = parseInt(match[3]);
                }

                // Validate season/episode numbers
                if (result.season >= 1 && result.season <= 99 &&
                    result.episode >= 1 && result.episode <= 999) {
                    return result;
                }
            }
        }
        return null;
    }

    /**
     * Parse movie filename
     * @param {string} baseName - Filename without extension
     * @returns {Object|null} Parsed movie data or null
     */
    parseMovie(baseName) {
        for (const pattern of this.moviePatterns) {
            const match = baseName.match(pattern);
            if (match) {
                const result = {
                    title: this.cleanTitle(match[1])
                };

                if (match[2]) {
                    const year = parseInt(match[2]);
                    // Validate year range
                    if (year >= 1900 && year <= new Date().getFullYear() + 2) {
                        result.year = year;
                    }
                }

                return result;
            }
        }
        return null;
    }

    /**
     * Clean up title text
     * @param {string} title - Raw title
     * @returns {string} Cleaned title
     */
    cleanTitle(title) {
        if (!title) return 'Unknown';

        // Replace dots and underscores with spaces
        let cleaned = title.replace(/[._]/g, ' ');

        // Remove quality indicators
        const qualityPattern = new RegExp(
            '\\b(' + this.qualityIndicators.join('|') + ')\\b',
            'gi'
        );
        cleaned = cleaned.replace(qualityPattern, '');

        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Trim and capitalize each word
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());

        return cleaned || 'Unknown';
    }

    /**
     * Classify media type based on filename
     * @param {string} filename - The filename to classify
     * @returns {string} 'movie', 'tvshow', or 'other'
     */
    classifyType(filename) {
        const parsed = this.parse(filename);
        return parsed.type;
    }

    /**
     * Check if filename matches TV show patterns
     * @param {string} filename - The filename to check
     * @returns {boolean} True if likely a TV show
     */
    isTVShow(filename) {
        if (!filename) return false;
        const baseName = filename.replace(/\.[^.]+$/, '');
        return this.tvShowPatterns.some(pattern => pattern.test(baseName));
    }

    /**
     * Check if filename has a year indicator
     * @param {string} filename - The filename to check
     * @returns {boolean} True if year found
     */
    hasYear(filename) {
        if (!filename) return false;
        const yearPattern = /\(?\d{4}\)?/;
        return yearPattern.test(filename);
    }
}

// Export as singleton
const filenameParser = new FilenameParser();

// ES6 export
export default filenameParser;

// Node.js/CommonJS export for backend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = filenameParser;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.FilenameParser = filenameParser;
}
