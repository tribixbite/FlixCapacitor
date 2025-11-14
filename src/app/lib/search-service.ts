/**
 * Search Service
 * Phase 9A.6: Advanced filters, search history, autocomplete, relevance sorting
 */

/**
 * Search filters
 */
export interface SearchFilters {
    genre?: string[];
    yearMin?: number;
    yearMax?: number;
    ratingMin?: number; // 0-10
    quality?: ('720p' | '1080p' | '2160p' | 'any')[];
    language?: string[];
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
    query: string;
    filters?: SearchFilters;
    timestamp: number;
    resultCount: number;
}

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
    title: string;
    year?: number;
    type: 'movie' | 'tv';
    popularity: number;
    tmdbId?: number;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
    id: string;
    title: string;
    year: number;
    rating: number;
    genre: string[];
    synopsis: string;
    relevanceScore: number; // 0-100
    matchedFields: string[]; // which fields matched the query
}

/**
 * Spelling suggestion
 */
export interface SpellingSuggestion {
    original: string;
    suggested: string;
    confidence: number; // 0-1
}

/**
 * Search Service
 */
export class SearchService {
    private readonly HISTORY_KEY = 'search_history';
    private readonly MAX_HISTORY = 20;
    private readonly TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // TODO: Replace with actual key
    private searchHistory: SearchHistoryEntry[] = [];

    // Common movie genres for filtering
    private readonly GENRES = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
        'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
        'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
        'TV Movie', 'Thriller', 'War', 'Western'
    ];

    // Common typos and their corrections
    private readonly COMMON_TYPOS: Record<string, string> = {
        'marval': 'marvel',
        'starwars': 'star wars',
        'lotr': 'lord of the rings',
        'hp': 'harry potter',
        'gotg': 'guardians of the galaxy',
        'avengars': 'avengers',
        'spiderman': 'spider-man',
        'superman': 'superman',
        'batman': 'batman'
    };

    constructor() {
        this.loadSearchHistory();
    }

    // ===== SEARCH HISTORY =====

    /**
     * Load search history from localStorage
     */
    private loadSearchHistory(): void {
        try {
            const stored = localStorage.getItem(this.HISTORY_KEY);
            if (stored) {
                this.searchHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
            this.searchHistory = [];
        }
    }

    /**
     * Save search history to localStorage
     */
    private saveSearchHistory(): void {
        try {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    }

    /**
     * Add search to history
     */
    addToHistory(query: string, filters?: SearchFilters, resultCount: number = 0): void {
        // Remove duplicates
        this.searchHistory = this.searchHistory.filter(
            entry => entry.query.toLowerCase() !== query.toLowerCase()
        );

        // Add new entry at the beginning
        this.searchHistory.unshift({
            query,
            filters,
            timestamp: Date.now(),
            resultCount
        });

        // Limit history size
        if (this.searchHistory.length > this.MAX_HISTORY) {
            this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY);
        }

        this.saveSearchHistory();
    }

    /**
     * Get search history
     */
    getHistory(): SearchHistoryEntry[] {
        return [...this.searchHistory];
    }

    /**
     * Clear search history
     */
    clearHistory(): void {
        this.searchHistory = [];
        localStorage.removeItem(this.HISTORY_KEY);
    }

    /**
     * Remove specific entry from history
     */
    removeFromHistory(query: string): void {
        this.searchHistory = this.searchHistory.filter(
            entry => entry.query !== query
        );
        this.saveSearchHistory();
    }

    // ===== AUTOCOMPLETE =====

    /**
     * Get autocomplete suggestions from TMDB
     */
    async getAutocompleteSuggestions(query: string, limit: number = 5): Promise<AutocompleteSuggestion[]> {
        if (query.length < 2) return [];

        try {
            // Check history first for instant suggestions
            const historyMatches = this.searchHistory
                .filter(entry => entry.query.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 3)
                .map(entry => ({
                    title: entry.query,
                    type: 'movie' as const,
                    popularity: 100 // History items get high priority
                }));

            // If we have enough history matches, return those
            if (historyMatches.length >= limit) {
                return historyMatches.slice(0, limit);
            }

            // Otherwise, fetch from TMDB
            const tmdbSuggestions = await this.fetchTMDBSuggestions(query, limit - historyMatches.length);

            // Combine and deduplicate
            const allSuggestions = [...historyMatches, ...tmdbSuggestions];
            const seen = new Set<string>();
            const unique = allSuggestions.filter(suggestion => {
                const key = suggestion.title.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            return unique.slice(0, limit);
        } catch (error) {
            console.error('Failed to get autocomplete suggestions:', error);
            return [];
        }
    }

    /**
     * Fetch suggestions from TMDB API
     */
    private async fetchTMDBSuggestions(query: string, limit: number): Promise<AutocompleteSuggestion[]> {
        try {
            const url = `https://api.themoviedb.org/3/search/multi?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();

            return data.results
                .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                .slice(0, limit)
                .map((item: any) => ({
                    title: item.title || item.name,
                    year: item.release_date ? parseInt(item.release_date.split('-')[0]) : undefined,
                    type: item.media_type === 'movie' ? 'movie' : 'tv',
                    popularity: item.popularity || 0,
                    tmdbId: item.id
                }));
        } catch (error) {
            console.error('Failed to fetch TMDB suggestions:', error);
            return [];
        }
    }

    // ===== SPELLING SUGGESTIONS =====

    /**
     * Get spelling suggestions for query
     */
    getSpellingSuggestions(query: string): SpellingSuggestion[] {
        const suggestions: SpellingSuggestion[] = [];
        const lowerQuery = query.toLowerCase();

        // Check common typos
        for (const [typo, correction] of Object.entries(this.COMMON_TYPOS)) {
            if (lowerQuery.includes(typo)) {
                const suggested = query.toLowerCase().replace(typo, correction);
                suggestions.push({
                    original: query,
                    suggested,
                    confidence: 0.9
                });
            }
        }

        // Check against search history using Levenshtein distance
        for (const entry of this.searchHistory) {
            const distance = this.levenshteinDistance(lowerQuery, entry.query.toLowerCase());
            const maxLength = Math.max(query.length, entry.query.length);
            const similarity = 1 - (distance / maxLength);

            // Suggest if similar but not exact match
            if (similarity > 0.7 && similarity < 0.95) {
                suggestions.push({
                    original: query,
                    suggested: entry.query,
                    confidence: similarity
                });
            }
        }

        // Sort by confidence and deduplicate
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .filter((suggestion, index, array) =>
                array.findIndex(s => s.suggested === suggestion.suggested) === index
            )
            .slice(0, 3); // Return top 3 suggestions
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // Calculate distances
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len1][len2];
    }

    // ===== RELEVANCE SCORING =====

    /**
     * Calculate relevance score for search result
     */
    calculateRelevance(result: any, query: string, filters?: SearchFilters): number {
        let score = 0;
        const matchedFields: string[] = [];
        const lowerQuery = query.toLowerCase();

        // Title match (highest weight)
        const lowerTitle = result.title.toLowerCase();
        if (lowerTitle === lowerQuery) {
            score += 100;
            matchedFields.push('title_exact');
        } else if (lowerTitle.includes(lowerQuery)) {
            score += 70;
            matchedFields.push('title_partial');
        } else if (this.fuzzyMatch(lowerTitle, lowerQuery)) {
            score += 40;
            matchedFields.push('title_fuzzy');
        }

        // Year match
        if (result.year && query.includes(result.year.toString())) {
            score += 20;
            matchedFields.push('year');
        }

        // Genre match
        if (result.genre && Array.isArray(result.genre)) {
            for (const genre of result.genre) {
                if (lowerQuery.includes(genre.toLowerCase())) {
                    score += 15;
                    matchedFields.push('genre');
                    break;
                }
            }
        }

        // Synopsis match
        if (result.synopsis) {
            const lowerSynopsis = result.synopsis.toLowerCase();
            const queryWords = lowerQuery.split(' ').filter(w => w.length > 3);
            let synopsisMatches = 0;
            for (const word of queryWords) {
                if (lowerSynopsis.includes(word)) {
                    synopsisMatches++;
                }
            }
            if (synopsisMatches > 0) {
                score += Math.min(synopsisMatches * 5, 20);
                matchedFields.push('synopsis');
            }
        }

        // Boost by rating
        if (result.rating) {
            score += result.rating * 2; // max +20 points for 10/10 rating
        }

        // Apply filters
        if (filters) {
            // Genre filter
            if (filters.genre && filters.genre.length > 0) {
                const hasMatchingGenre = result.genre?.some((g: string) =>
                    filters.genre!.includes(g)
                );
                if (!hasMatchingGenre) {
                    score *= 0.5; // Penalize if doesn't match genre filter
                }
            }

            // Year filter
            if (filters.yearMin && result.year < filters.yearMin) {
                score *= 0.5;
            }
            if (filters.yearMax && result.year > filters.yearMax) {
                score *= 0.5;
            }

            // Rating filter
            if (filters.ratingMin && result.rating < filters.ratingMin) {
                score *= 0.5;
            }
        }

        return Math.min(score, 100);
    }

    /**
     * Fuzzy match between two strings
     */
    private fuzzyMatch(str: string, query: string): boolean {
        const distance = this.levenshteinDistance(str, query);
        const maxLength = Math.max(str.length, query.length);
        const similarity = 1 - (distance / maxLength);
        return similarity > 0.6;
    }

    /**
     * Sort results by relevance
     */
    sortByRelevance(results: any[], query: string, filters?: SearchFilters): SearchResult[] {
        return results
            .map(result => {
                const relevanceScore = this.calculateRelevance(result, query, filters);
                const matchedFields = this.getMatchedFields(result, query);

                return {
                    ...result,
                    relevanceScore,
                    matchedFields
                };
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Get matched fields for a result
     */
    private getMatchedFields(result: any, query: string): string[] {
        const matchedFields: string[] = [];
        const lowerQuery = query.toLowerCase();

        if (result.title?.toLowerCase().includes(lowerQuery)) {
            matchedFields.push('title');
        }
        if (result.year && query.includes(result.year.toString())) {
            matchedFields.push('year');
        }
        if (result.genre?.some((g: string) => lowerQuery.includes(g.toLowerCase()))) {
            matchedFields.push('genre');
        }
        if (result.synopsis?.toLowerCase().includes(lowerQuery)) {
            matchedFields.push('synopsis');
        }

        return matchedFields;
    }

    // ===== FILTER UTILITIES =====

    /**
     * Get available genres
     */
    getAvailableGenres(): string[] {
        return [...this.GENRES];
    }

    /**
     * Apply filters to results
     */
    applyFilters(results: any[], filters: SearchFilters): any[] {
        return results.filter(result => {
            // Genre filter
            if (filters.genre && filters.genre.length > 0) {
                const hasMatchingGenre = result.genre?.some((g: string) =>
                    filters.genre!.includes(g)
                );
                if (!hasMatchingGenre) return false;
            }

            // Year range filter
            if (filters.yearMin && result.year < filters.yearMin) return false;
            if (filters.yearMax && result.year > filters.yearMax) return false;

            // Rating filter
            if (filters.ratingMin && result.rating < filters.ratingMin) return false;

            // Quality filter (if quality field exists)
            if (filters.quality && filters.quality.length > 0 && !filters.quality.includes('any')) {
                const hasMatchingQuality = result.quality && filters.quality.includes(result.quality);
                if (!hasMatchingQuality) return false;
            }

            // Language filter (if language field exists)
            if (filters.language && filters.language.length > 0) {
                const hasMatchingLanguage = result.language && filters.language.includes(result.language);
                if (!hasMatchingLanguage) return false;
            }

            return true;
        });
    }

    /**
     * Search within existing results
     */
    searchWithinResults(results: any[], query: string): any[] {
        if (!query || query.trim().length === 0) {
            return results;
        }

        const lowerQuery = query.toLowerCase();
        return results.filter(result => {
            const titleMatch = result.title?.toLowerCase().includes(lowerQuery);
            const synopsisMatch = result.synopsis?.toLowerCase().includes(lowerQuery);
            const genreMatch = result.genre?.some((g: string) =>
                g.toLowerCase().includes(lowerQuery)
            );
            const yearMatch = result.year && result.year.toString().includes(query);

            return titleMatch || synopsisMatch || genreMatch || yearMatch;
        });
    }

    // ===== VOICE SEARCH =====

    /**
     * Start voice search (requires Capacitor plugin)
     */
    async startVoiceSearch(): Promise<string> {
        try {
            // Check if browser supports Web Speech API
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Voice search not supported in this browser');
            }

            // Use Web Speech API
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            return new Promise((resolve, reject) => {
                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    resolve(transcript);
                };

                recognition.onerror = (event: any) => {
                    reject(new Error(`Voice recognition error: ${event.error}`));
                };

                recognition.start();
            });
        } catch (error) {
            console.error('Voice search failed:', error);
            throw error;
        }
    }

    // ===== STATISTICS =====

    /**
     * Get search statistics
     */
    getStatistics(): {
        totalSearches: number;
        uniqueQueries: number;
        averageResultCount: number;
        mostSearchedTerms: Array<{ query: string; count: number }>;
    } {
        const queryCount = new Map<string, number>();
        let totalResults = 0;

        for (const entry of this.searchHistory) {
            const lowerQuery = entry.query.toLowerCase();
            queryCount.set(lowerQuery, (queryCount.get(lowerQuery) || 0) + 1);
            totalResults += entry.resultCount;
        }

        const mostSearched = Array.from(queryCount.entries())
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalSearches: this.searchHistory.length,
            uniqueQueries: queryCount.size,
            averageResultCount: this.searchHistory.length > 0
                ? totalResults / this.searchHistory.length
                : 0,
            mostSearchedTerms: mostSearched
        };
    }
}

// Export singleton
export const searchService = new SearchService();
