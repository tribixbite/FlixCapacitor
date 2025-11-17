/**
 * Subtitle Picker View
 * Phase 9A UI Integration: Subtitle picker with search, sync, and style customization
 */

import { View, type ViewOptions } from 'backbone.marionette';
import {
    type SubtitleTrack,
    type SubtitleSearchResult,
    type SubtitleStyle,
    subtitleService
} from '../lib/subtitle-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface SubtitlePickerViewOptions extends ViewOptions<any> {
    movieTitle?: string;
    movieYear?: number;
    currentLanguage?: string;
    onSelect?: (track: SubtitleTrack) => void;
    onClose?: () => void;
}

/**
 * Subtitle Picker Modal
 * Search, sync adjustment, and style customization for subtitles
 */
export class SubtitlePickerView extends View<any> {
    private movieTitle?: string;
    private movieYear?: number;
    private currentLanguage: string;
    private onSelectCallback?: (track: SubtitleTrack) => void;
    private onCloseCallback?: () => void;
    private searchResults: SubtitleSearchResult[] = [];
    private selectedTrack: SubtitleTrack | null = null;
    private syncOffset: number = 0;
    private activeTab: 'search' | 'sync' | 'style' = 'search';
    private isSearching: boolean = false;
    private currentStyle: SubtitleStyle = {
        fontSize: 18,
        fontColor: '#FFFFFF',
        backgroundColor: '#00000080',
        position: 'bottom',
        alignment: 'center',
        fontFamily: 'Arial, sans-serif',
        bold: false,
        italic: false,
        outline: true,
        outlineColor: '#000000'
    };

    constructor(options: SubtitlePickerViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.movieTitle = options.movieTitle;
        this.movieYear = options.movieYear;
        this.currentLanguage = options.currentLanguage || 'en';
        this.onSelectCallback = options.onSelect;
        this.onCloseCallback = options.onClose;

        // Set up events
        (this as any).events = {
            'click .subtitle-close': 'handleClose',
            'click .subtitle-apply': 'handleApply',
            'click .tab-button': 'handleTabChange',
            'click .search-button': 'handleSearch',
            'click .subtitle-result': 'handleResultClick',
            'click .sync-preset': 'handleSyncPreset',
            'input .sync-custom-input': 'handleSyncInput',
            'input .style-font-size': 'handleFontSizeChange',
            'input .style-font-color': 'handleFontColorChange',
            'input .style-bg-color': 'handleBgColorChange',
            'change .style-position': 'handlePositionChange',
            'change .style-outline': 'handleOutlineChange'
        };

        analytics.trackEvent('subtitle_picker_opened', {
            movieTitle: this.movieTitle,
            language: this.currentLanguage
        });
    }

    template(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                            </svg>
                            <div>
                                <div class="text-white font-semibold">Subtitle Picker</div>
                                ${this.movieTitle ? `<div class="text-gray-400 text-sm">${this.escapeHtml(this.movieTitle)}${this.movieYear ? ` (${this.movieYear})` : ''}</div>` : ''}
                            </div>
                        </div>
                        <button class="subtitle-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="flex border-b border-gray-700">
                        ${this.renderTab('search', 'Search', 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z')}
                        ${this.renderTab('sync', 'Sync', 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z')}
                        ${this.renderTab('style', 'Style', 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01')}
                    </div>

                    <!-- Tab Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        ${this.renderTabContent()}
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 p-4 bg-gray-800/30 border-t border-gray-700">
                        <button class="subtitle-close px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium">
                            Cancel
                        </button>
                        ${this.selectedTrack ? `
                            <button class="subtitle-apply px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                                Apply Subtitle
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render tab button
     */
    private renderTab(id: string, label: string, icon: string): string {
        const isActive = this.activeTab === id;
        return `
            <button class="tab-button flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors ${isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}" data-tab="${id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"/>
                </svg>
                <span class="text-sm font-medium">${label}</span>
            </button>
        `;
    }

    /**
     * Render active tab content
     */
    private renderTabContent(): string {
        switch (this.activeTab) {
            case 'search':
                return this.renderSearchTab();
            case 'sync':
                return this.renderSyncTab();
            case 'style':
                return this.renderStyleTab();
            default:
                return '';
        }
    }

    /**
     * Render search tab
     */
    private renderSearchTab(): string {
        return `
            <div class="space-y-4">
                <!-- Search Input -->
                <div class="flex gap-2">
                    <input
                        type="text"
                        class="search-input flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder="Search for subtitles..."
                        value="${this.movieTitle || ''}"
                    />
                    <button class="search-button px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${this.isSearching ? 'opacity-50 cursor-not-allowed' : ''}">
                        ${this.isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <!-- Language Filter -->
                <div class="flex items-center gap-2">
                    <label class="text-gray-400 text-sm">Language:</label>
                    <select class="language-select bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                        <option value="es" ${this.currentLanguage === 'es' ? 'selected' : ''}>Spanish</option>
                        <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>French</option>
                        <option value="de" ${this.currentLanguage === 'de' ? 'selected' : ''}>German</option>
                        <option value="it" ${this.currentLanguage === 'it' ? 'selected' : ''}>Italian</option>
                        <option value="pt" ${this.currentLanguage === 'pt' ? 'selected' : ''}>Portuguese</option>
                        <option value="zh" ${this.currentLanguage === 'zh' ? 'selected' : ''}>Chinese</option>
                        <option value="ja" ${this.currentLanguage === 'ja' ? 'selected' : ''}>Japanese</option>
                        <option value="ko" ${this.currentLanguage === 'ko' ? 'selected' : ''}>Korean</option>
                        <option value="ar" ${this.currentLanguage === 'ar' ? 'selected' : ''}>Arabic</option>
                    </select>
                </div>

                <!-- Search Results -->
                ${this.searchResults.length > 0 ? `
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${this.searchResults.map(result => this.renderSearchResult(result)).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12 text-gray-500">
                        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <p>Search for subtitles to get started</p>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render search result item
     */
    private renderSearchResult(result: SubtitleSearchResult): string {
        const isSelected = this.selectedTrack?.id === result.id;
        return `
            <div class="subtitle-result flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-blue-500' : ''}" data-id="${result.id}">
                <div class="flex-1 min-w-0">
                    <div class="text-white font-medium truncate">${this.escapeHtml(result.movieTitle)}</div>
                    <div class="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            ${result.rating.toFixed(1)}
                        </span>
                        <span>⬇ ${result.downloadCount.toLocaleString()}</span>
                        <span class="uppercase">${result.format}</span>
                        <span class="uppercase">${result.languageCode}</span>
                    </div>
                </div>
                ${isSelected ? `
                    <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render sync adjustment tab
     */
    private renderSyncTab(): string {
        return `
            <div class="space-y-6">
                <div class="text-gray-300">
                    <p class="mb-4">Adjust subtitle timing if they appear too early or too late.</p>
                    <p class="text-sm text-gray-500">Positive values delay subtitles, negative values advance them.</p>
                </div>

                <!-- Current Offset -->
                <div class="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div class="text-gray-400 text-sm mb-1">Current Offset</div>
                    <div class="text-2xl font-bold ${this.syncOffset === 0 ? 'text-gray-500' : this.syncOffset > 0 ? 'text-blue-400' : 'text-orange-400'}">
                        ${this.syncOffset > 0 ? '+' : ''}${this.syncOffset}ms
                    </div>
                </div>

                <!-- Preset Buttons -->
                <div class="space-y-2">
                    <div class="text-gray-400 text-sm mb-2">Quick Adjustments:</div>
                    <div class="grid grid-cols-2 gap-2">
                        ${this.renderSyncPreset(-1000, '−1s')}
                        ${this.renderSyncPreset(+1000, '+1s')}
                        ${this.renderSyncPreset(-500, '−500ms')}
                        ${this.renderSyncPreset(+500, '+500ms')}
                        ${this.renderSyncPreset(-100, '−100ms')}
                        ${this.renderSyncPreset(+100, '+100ms')}
                    </div>
                </div>

                <!-- Custom Input -->
                <div class="space-y-2">
                    <label class="text-gray-400 text-sm">Custom Offset (ms):</label>
                    <input
                        type="number"
                        class="sync-custom-input w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        value="${this.syncOffset}"
                        step="100"
                    />
                </div>

                <!-- Reset Button -->
                <button class="sync-preset w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm" data-offset="0">
                    Reset to 0ms
                </button>
            </div>
        `;
    }

    /**
     * Render sync preset button
     */
    private renderSyncPreset(offset: number, label: string): string {
        return `
            <button class="sync-preset px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium" data-offset="${offset}">
                ${label}
            </button>
        `;
    }

    /**
     * Render style customization tab
     */
    private renderStyleTab(): string {
        return `
            <div class="space-y-6">
                <!-- Font Size -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="text-gray-400 text-sm">Font Size</label>
                        <span class="text-white text-sm">${this.currentStyle.fontSize}px</span>
                    </div>
                    <input
                        type="range"
                        class="style-font-size w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        min="12"
                        max="32"
                        value="${this.currentStyle.fontSize}"
                    />
                </div>

                <!-- Font Color -->
                <div class="space-y-2">
                    <label class="text-gray-400 text-sm">Font Color</label>
                    <div class="flex gap-2">
                        <input
                            type="color"
                            class="style-font-color w-12 h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                            value="${this.currentStyle.fontColor}"
                        />
                        <input
                            type="text"
                            class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                            value="${this.currentStyle.fontColor}"
                            readonly
                        />
                    </div>
                </div>

                <!-- Background Color -->
                <div class="space-y-2">
                    <label class="text-gray-400 text-sm">Background Color</label>
                    <div class="flex gap-2">
                        <input
                            type="color"
                            class="style-bg-color w-12 h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                            value="${this.currentStyle.backgroundColor.substring(0, 7)}"
                        />
                        <input
                            type="text"
                            class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                            value="${this.currentStyle.backgroundColor}"
                            readonly
                        />
                    </div>
                </div>

                <!-- Position -->
                <div class="space-y-2">
                    <label class="text-gray-400 text-sm">Position</label>
                    <select class="style-position w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                        <option value="top" ${this.currentStyle.position === 'top' ? 'selected' : ''}>Top</option>
                        <option value="center" ${this.currentStyle.position === 'center' ? 'selected' : ''}>Center</option>
                        <option value="bottom" ${this.currentStyle.position === 'bottom' ? 'selected' : ''}>Bottom</option>
                    </select>
                </div>

                <!-- Outline -->
                <div class="flex items-center justify-between">
                    <label class="text-gray-400 text-sm">Text Outline</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="style-outline sr-only peer" ${this.currentStyle.outline ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <!-- Preview -->
                <div class="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div class="text-gray-400 text-xs mb-3">Preview</div>
                    <div
                        class="inline-block px-4 py-2 rounded"
                        style="
                            font-size: ${this.currentStyle.fontSize}px;
                            color: ${this.currentStyle.fontColor};
                            background-color: ${this.currentStyle.backgroundColor};
                            ${this.currentStyle.outline ? `text-shadow: -1px -1px 0 ${this.currentStyle.outlineColor}, 1px -1px 0 ${this.currentStyle.outlineColor}, -1px 1px 0 ${this.currentStyle.outlineColor}, 1px 1px 0 ${this.currentStyle.outlineColor};` : ''}
                        "
                    >
                        Sample subtitle text
                    </div>
                </div>
            </div>
        `;
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
     * Handle tab change
     */
    handleTabChange(e: Event): void {
        e.preventDefault();
        const button = e.currentTarget as HTMLElement;
        const tab = button.dataset.tab as 'search' | 'sync' | 'style';

        if (tab && tab !== this.activeTab) {
            this.activeTab = tab;
            logger.debug(`Subtitle tab changed to: ${tab}`, undefined, 'subtitle');
            analytics.trackEvent('subtitle_tab_changed', { tab });
            this.render();
        }
    }

    /**
     * Handle search button click
     */
    async handleSearch(e: Event): Promise<void> {
        e.preventDefault();

        if (this.isSearching) return;

        const searchInput = this.$('.search-input') as any;
        const query = searchInput.val();

        if (!query) return;

        this.isSearching = true;
        logger.info(`Searching subtitles for: ${query}`, undefined, 'subtitle');
        analytics.trackEvent('subtitle_search', {
            query,
            language: this.currentLanguage
        });

        this.render();

        try {
            this.searchResults = await subtitleService.searchSubtitles(
                query,
                this.movieYear,
                undefined,
                undefined,
                this.currentLanguage
            );

            logger.info(`Found ${this.searchResults.length} subtitle results`, undefined, 'subtitle');
            analytics.trackEvent('subtitle_search_results', {
                resultCount: this.searchResults.length
            });
        } catch (error: any) {
            logger.error('Subtitle search failed', error, undefined, 'subtitle');
            analytics.trackEvent('subtitle_search_error', {
                error: error.message
            });
        } finally {
            this.isSearching = false;
            this.render();
        }
    }

    /**
     * Handle search result click
     */
    async handleResultClick(e: Event): Promise<void> {
        e.preventDefault();
        const resultEl = (e.currentTarget as HTMLElement).closest('.subtitle-result') as HTMLElement;
        const resultId = resultEl?.dataset.id;

        if (!resultId) return;

        const result = this.searchResults.find(r => r.id === resultId);
        if (!result) return;

        logger.info(`Subtitle selected: ${result.movieTitle}`, undefined, 'subtitle');
        analytics.trackEvent('subtitle_selected', {
            id: result.id,
            language: result.languageCode,
            format: result.format
        });

        // Convert search result to subtitle track
        this.selectedTrack = {
            id: result.id,
            language: result.language,
            languageCode: result.languageCode,
            format: result.format as any,
            url: result.downloadUrl,
            source: 'downloaded',
            rating: result.rating,
            downloadCount: result.downloadCount
        };

        this.render();
    }

    /**
     * Handle sync preset button click
     */
    handleSyncPreset(e: Event): void {
        e.preventDefault();
        const button = e.currentTarget as HTMLElement;
        const offset = parseInt(button.dataset.offset || '0', 10);

        this.syncOffset += offset;
        logger.debug(`Sync offset adjusted: ${this.syncOffset}ms`, undefined, 'subtitle');
        analytics.trackEvent('subtitle_sync_adjusted', {
            offset: this.syncOffset,
            delta: offset
        });

        this.render();
    }

    /**
     * Handle custom sync input
     */
    handleSyncInput(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        this.syncOffset = parseInt(input.value, 10) || 0;
        logger.debug(`Sync offset set to: ${this.syncOffset}ms`, undefined, 'subtitle');
    }

    /**
     * Handle font size change
     */
    handleFontSizeChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        this.currentStyle.fontSize = parseInt(input.value, 10);
        this.render();
    }

    /**
     * Handle font color change
     */
    handleFontColorChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        this.currentStyle.fontColor = input.value;
        this.render();
    }

    /**
     * Handle background color change
     */
    handleBgColorChange(e: Event): void {
        const input = e.currentTarget as HTMLInputElement;
        // Preserve alpha channel
        const alpha = this.currentStyle.backgroundColor.substring(7) || '80';
        this.currentStyle.backgroundColor = input.value + alpha;
        this.render();
    }

    /**
     * Handle position change
     */
    handlePositionChange(e: Event): void {
        const select = e.currentTarget as HTMLSelectElement;
        this.currentStyle.position = select.value as 'top' | 'center' | 'bottom';
        this.render();
    }

    /**
     * Handle outline toggle
     */
    handleOutlineChange(e: Event): void {
        const checkbox = e.currentTarget as HTMLInputElement;
        this.currentStyle.outline = checkbox.checked;
        this.render();
    }

    /**
     * Handle apply button click
     */
    handleApply(e: Event): void {
        e.preventDefault();

        if (!this.selectedTrack) return;

        logger.info('Applying subtitle selection', {
            id: this.selectedTrack.id,
            syncOffset: this.syncOffset
        }, 'subtitle');

        analytics.trackEvent('subtitle_applied', {
            id: this.selectedTrack.id,
            language: this.selectedTrack.languageCode,
            syncOffset: this.syncOffset,
            styleCustomized: JSON.stringify(this.currentStyle) !== JSON.stringify(subtitleService['defaultStyle'])
        });

        // Apply sync offset and style
        subtitleService.adjustSync(this.syncOffset);
        subtitleService.setStyle(this.currentStyle);

        if (this.onSelectCallback) {
            this.onSelectCallback(this.selectedTrack);
        }

        this.remove();
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();
        logger.info('Subtitle picker closed', undefined, 'subtitle');
        analytics.trackEvent('subtitle_picker_closed');

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }

        this.remove();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('SubtitlePickerView destroyed', undefined, 'subtitle');
        analytics.trackEvent('subtitle_picker_destroyed');
    }
}

/**
 * Show subtitle picker modal
 */
export function showSubtitlePicker(
    container: HTMLElement,
    options?: {
        movieTitle?: string;
        movieYear?: number;
        currentLanguage?: string;
        onSelect?: (track: SubtitleTrack) => void;
        onClose?: () => void;
    }
): SubtitlePickerView {
    const view = new SubtitlePickerView(options || {});

    view.setElement(container);
    view.render();

    logger.info('Subtitle picker modal displayed', {
        movieTitle: options?.movieTitle,
        language: options?.currentLanguage
    }, 'subtitle');

    return view;
}
