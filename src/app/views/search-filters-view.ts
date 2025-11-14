/**
 * Advanced Search Filters View
 * Phase 9A UI Integration: Search filters with voice search and autocomplete
 */

import { View, type ViewOptions } from 'backbone.marionette';
import {
    type SearchFilters,
    type SearchHistoryEntry,
    type AutocompleteSuggestion,
    searchService
} from '../lib/search-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface SearchFiltersViewOptions extends ViewOptions<any> {
    onSearch?: (query: string, filters: SearchFilters) => void;
    onClose?: () => void;
}

/**
 * Advanced Search Filters View
 * Comprehensive search UI with filters, history, voice search, and autocomplete
 */
export class SearchFiltersView extends View<any> {
    private onSearchCallback?: (query: string, filters: SearchFilters) => void;
    private onCloseCallback?: () => void;
    private filters: SearchFilters = {};
    private searchQuery: string = '';
    private isSearching: boolean = false;
    private showHistory: boolean = false;
    private autocompleteResults: AutocompleteSuggestion[] = [];
    private isVoiceSupported: boolean = false;
    private isListening: boolean = false;

    constructor(options: SearchFiltersViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.onSearchCallback = options.onSearch;
        this.onCloseCallback = options.onClose;

        // Check voice search support
        this.isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

        // Set up events
        (this as any).events = {
            'click .search-close': 'handleClose',
            'click .search-submit': 'handleSearch',
            'input .search-input': 'handleSearchInput',
            'click .search-voice': 'handleVoiceSearch',
            'click .history-item': 'handleHistoryClick',
            'click .autocomplete-item': 'handleAutocompleteClick',
            'click .filter-clear': 'handleClearFilters',
            'change .filter-genre': 'handleGenreChange',
            'change .filter-year-min': 'handleYearMinChange',
            'change .filter-year-max': 'handleYearMaxChange',
            'change .filter-rating': 'handleRatingChange',
            'change .filter-quality': 'handleQualityChange'
        };

        analytics.trackEvent('search_filters_opened');
    }

    template(): string {
        const genres = searchService['GENRES'];
        const history = searchService.getHistory();

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <div>
                                <div class="text-white font-semibold">Advanced Search</div>
                                <div class="text-gray-400 text-sm">Filter movies and TV shows</div>
                            </div>
                        </div>
                        <button class="search-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-6">
                        <!-- Search Bar -->
                        <div class="space-y-2">
                            <div class="flex gap-2">
                                <div class="flex-1 relative">
                                    <input
                                        type="text"
                                        class="search-input w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                        placeholder="Search movies, TV shows..."
                                        value="${this.escapeHtml(this.searchQuery)}"
                                    />
                                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                </div>

                                ${this.isVoiceSupported ? `
                                    <button class="search-voice px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 ${this.isListening ? 'ring-2 ring-red-500' : ''}">
                                        <svg class="w-5 h-5 ${this.isListening ? 'text-red-500 animate-pulse' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                                        </svg>
                                        ${this.isListening ? 'Listening...' : 'Voice'}
                                    </button>
                                ` : ''}

                                <button class="search-submit px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium ${this.isSearching ? 'opacity-50 cursor-not-allowed' : ''}">
                                    ${this.isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            <!-- Autocomplete & History -->
                            ${this.autocompleteResults.length > 0 ? this.renderAutocomplete() : (this.showHistory && history.length > 0 ? this.renderHistory() : '')}
                        </div>

                        <!-- Filters Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Genre Filter -->
                            <div class="space-y-2">
                                <label class="text-gray-400 text-sm font-medium">Genre</label>
                                <select
                                    class="filter-genre w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    multiple
                                    size="5"
                                >
                                    ${genres.map((genre: string) => `
                                        <option value="${genre}" ${this.filters.genre?.includes(genre) ? 'selected' : ''}>${genre}</option>
                                    `).join('')}
                                </select>
                                <p class="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                            </div>

                            <!-- Quality Filter -->
                            <div class="space-y-2">
                                <label class="text-gray-400 text-sm font-medium">Quality</label>
                                <div class="space-y-2">
                                    ${this.renderQualityCheckbox('any', 'Any Quality')}
                                    ${this.renderQualityCheckbox('720p', '720p HD')}
                                    ${this.renderQualityCheckbox('1080p', '1080p Full HD')}
                                    ${this.renderQualityCheckbox('2160p', '4K Ultra HD')}
                                </div>
                            </div>

                            <!-- Year Range Filter -->
                            <div class="space-y-2">
                                <label class="text-gray-400 text-sm font-medium">Year Range</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <input
                                            type="number"
                                            class="filter-year-min w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                            placeholder="From"
                                            min="1900"
                                            max="2030"
                                            value="${this.filters.yearMin || ''}"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            class="filter-year-max w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                            placeholder="To"
                                            min="1900"
                                            max="2030"
                                            value="${this.filters.yearMax || ''}"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Rating Filter -->
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <label class="text-gray-400 text-sm font-medium">Minimum Rating</label>
                                    <span class="text-white text-sm">${this.filters.ratingMin || 0}/10</span>
                                </div>
                                <input
                                    type="range"
                                    class="filter-rating w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value="${this.filters.ratingMin || 0}"
                                />
                                <div class="flex items-center justify-between text-xs text-gray-500">
                                    <span>0</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>
                        </div>

                        <!-- Active Filters Display -->
                        ${this.hasActiveFilters() ? `
                            <div class="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="text-blue-400 font-medium text-sm">Active Filters</div>
                                    <button class="filter-clear text-blue-400 hover:text-blue-300 text-xs transition-colors">
                                        Clear All
                                    </button>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    ${this.renderActiveFilterTags()}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-4 bg-gray-800/30 border-t border-gray-700">
                        <div class="text-sm text-gray-500">
                            ${history.length} searches in history
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="search-close px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                                Cancel
                            </button>
                            <button class="search-submit px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render quality checkbox
     */
    private renderQualityCheckbox(value: string, label: string): string {
        const isChecked = this.filters.quality?.includes(value as any) || false;
        return `
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    class="filter-quality w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                    value="${value}"
                    ${isChecked ? 'checked' : ''}
                />
                <span class="text-sm text-gray-300">${label}</span>
            </label>
        `;
    }

    /**
     * Render search history dropdown
     */
    private renderHistory(): string {
        const history = searchService.getHistory();

        return `
            <div class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                <div class="p-2 border-b border-gray-700 text-xs text-gray-400">Recent Searches</div>
                ${history.map((entry: SearchHistoryEntry) => `
                    <button class="history-item w-full flex items-center justify-between p-3 hover:bg-gray-700 transition-colors text-left" data-query="${this.escapeHtml(entry.query)}">
                        <div class="flex-1 min-w-0">
                            <div class="text-white truncate">${this.escapeHtml(entry.query)}</div>
                            <div class="text-xs text-gray-500">${entry.resultCount} results</div>
                        </div>
                        <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render autocomplete suggestions
     */
    private renderAutocomplete(): string {
        return `
            <div class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                <div class="p-2 border-b border-gray-700 text-xs text-gray-400">Suggestions</div>
                ${this.autocompleteResults.map(suggestion => `
                    <button class="autocomplete-item w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors text-left" data-title="${this.escapeHtml(suggestion.title)}">
                        <svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                        </svg>
                        <div class="flex-1 min-w-0">
                            <div class="text-white">${this.escapeHtml(suggestion.title)}</div>
                            <div class="text-xs text-gray-500">${suggestion.type.toUpperCase()}${suggestion.year ? ` • ${suggestion.year}` : ''}</div>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render active filter tags
     */
    private renderActiveFilterTags(): string {
        const tags: string[] = [];

        if (this.filters.genre && this.filters.genre.length > 0) {
            tags.push(...this.filters.genre.map(g => `<span class="px-2 py-1 bg-blue-800/50 text-blue-300 rounded text-xs">${g}</span>`));
        }

        if (this.filters.quality && this.filters.quality.length > 0) {
            tags.push(...this.filters.quality.map(q => `<span class="px-2 py-1 bg-green-800/50 text-green-300 rounded text-xs">${q}</span>`));
        }

        if (this.filters.yearMin || this.filters.yearMax) {
            const yearRange = `${this.filters.yearMin || '?'} - ${this.filters.yearMax || '?'}`;
            tags.push(`<span class="px-2 py-1 bg-purple-800/50 text-purple-300 rounded text-xs">${yearRange}</span>`);
        }

        if (this.filters.ratingMin) {
            tags.push(`<span class="px-2 py-1 bg-orange-800/50 text-orange-300 rounded text-xs">Rating ≥ ${this.filters.ratingMin}</span>`);
        }

        return tags.join('');
    }

    /**
     * Check if there are active filters
     */
    private hasActiveFilters(): boolean {
        return !!(
            (this.filters.genre && this.filters.genre.length > 0) ||
            (this.filters.quality && this.filters.quality.length > 0) ||
            this.filters.yearMin ||
            this.filters.yearMax ||
            this.filters.ratingMin
        );
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle search input
     */
    async handleSearchInput(e: Event): Promise<void> {
        const input = e.currentTarget as HTMLInputElement;
        this.searchQuery = input.value;

        // Show history if input is focused and empty
        if (!this.searchQuery) {
            this.showHistory = true;
            this.autocompleteResults = [];
            this.render();
            return;
        }

        // Fetch autocomplete suggestions
        try {
            this.autocompleteResults = await searchService.getAutocompleteSuggestions(this.searchQuery);
            this.showHistory = false;
            this.render();
        } catch (error: any) {
            logger.error('Autocomplete failed', error, undefined, 'search');
        }
    }

    /**
     * Handle voice search button click
     */
    handleVoiceSearch(e: Event): void {
        e.preventDefault();

        if (!this.isVoiceSupported || this.isListening) return;

        logger.info('Voice search started', undefined, 'search');
        analytics.trackEvent('voice_search_started');

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            this.isListening = true;
            this.render();
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            this.searchQuery = transcript;

            logger.info('Voice search result', { transcript }, 'search');
            analytics.trackEvent('voice_search_result', { transcript });

            this.isListening = false;
            this.render();
        };

        recognition.onerror = (event: any) => {
            logger.error('Voice search error', new Error(event.error), undefined, 'search');
            analytics.trackEvent('voice_search_error', { error: event.error });

            this.isListening = false;
            this.render();
        };

        recognition.onend = () => {
            this.isListening = false;
            this.render();
        };

        recognition.start();
    }

    /**
     * Handle history item click
     */
    handleHistoryClick(e: Event): void {
        e.preventDefault();
        const button = e.currentTarget as HTMLElement;
        const query = button.dataset.query;

        if (query) {
            this.searchQuery = query;
            this.showHistory = false;
            logger.debug(`History item selected: ${query}`, undefined, 'search');
            analytics.trackEvent('search_history_selected');
            this.render();
        }
    }

    /**
     * Handle autocomplete item click
     */
    handleAutocompleteClick(e: Event): void {
        e.preventDefault();
        const button = e.currentTarget as HTMLElement;
        const title = button.dataset.title;

        if (title) {
            this.searchQuery = title;
            this.autocompleteResults = [];
            logger.debug(`Autocomplete selected: ${title}`, undefined, 'search');
            analytics.trackEvent('autocomplete_selected');
            this.render();
        }
    }

    /**
     * Handle genre filter change
     */
    handleGenreChange(e: Event): void {
        const select = e.currentTarget as HTMLSelectElement;
        const selected = Array.from(select.selectedOptions).map(opt => opt.value);

        this.filters.genre = selected.length > 0 ? selected : undefined;
        logger.debug(`Genre filter changed: ${selected.join(', ')}`, undefined, 'search');
        this.render();
    }

    /**
     * Handle year min change
     */
    handleYearMinChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        const value = parseInt(input.value, 10);

        this.filters.yearMin = value || undefined;
        this.render();
    }

    /**
     * Handle year max change
     */
    handleYearMaxChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        const value = parseInt(input.value, 10);

        this.filters.yearMax = value || undefined;
        this.render();
    }

    /**
     * Handle rating filter change
     */
    handleRatingChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        const value = parseFloat(input.value);

        this.filters.ratingMin = value > 0 ? value : undefined;
        this.render();
    }

    /**
     * Handle quality filter change
     */
    handleQualityChange(e: Event): void {
        const checkboxes = this.$('.filter-quality:checked');
        const selected = checkboxes.toArray().map((cb: any) => cb.value);

        this.filters.quality = selected.length > 0 ? selected as any : undefined;
        this.render();
    }

    /**
     * Handle clear filters button click
     */
    handleClearFilters(e: Event): void {
        e.preventDefault();

        logger.info('Filters cleared', undefined, 'search');
        analytics.trackEvent('search_filters_cleared');

        this.filters = {};
        this.render();
    }

    /**
     * Handle search button click
     */
    async handleSearch(e: Event): Promise<void> {
        e.preventDefault();

        if (!this.searchQuery || this.isSearching) return;

        this.isSearching = true;
        logger.info('Search submitted', {
            query: this.searchQuery,
            filters: this.filters
        }, 'search');

        analytics.trackEvent('advanced_search', {
            query: this.searchQuery,
            hasFilters: this.hasActiveFilters(),
            filterCount: Object.keys(this.filters).length
        });

        this.render();

        if (this.onSearchCallback) {
            this.onSearchCallback(this.searchQuery, this.filters);
        }

        this.isSearching = false;
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();

        logger.info('Search filters closed', undefined, 'search');
        analytics.trackEvent('search_filters_closed');

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }

        this.remove();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('SearchFiltersView destroyed', undefined, 'search');
        analytics.trackEvent('search_filters_destroyed');
    }
}

/**
 * Show advanced search filters modal
 */
export function showSearchFilters(
    container: HTMLElement,
    callbacks?: {
        onSearch?: (query: string, filters: SearchFilters) => void;
        onClose?: () => void;
    }
): SearchFiltersView {
    const view = new SearchFiltersView(callbacks || {});

    view.setElement(container);
    view.render();

    logger.info('Advanced search filters displayed', undefined, 'search');

    return view;
}
