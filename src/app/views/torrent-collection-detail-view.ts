/**
 * Torrent Collection Detail View
 * Phase 13: Torrent Collections - Detail View
 * Displays torrents in a collection with reordering and removal functionality
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { collectionsService, type CollectionWithTorrents } from '../lib/collections-service';
import type { Torrent } from '../lib/torrents-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface TorrentCollectionDetailViewOptions extends ViewOptions<any> {
    collectionUuid: string;
    onBack?: () => void;
}

/**
 * Torrent Collection Detail View
 * Shows all torrents in a collection with metadata and management options
 */
export class TorrentCollectionDetailView extends View<any> {
    private collectionUuid: string;
    private collectionData?: CollectionWithTorrents;
    private isLoading: boolean = false;
    private onBackCallback?: () => void;

    constructor(options: TorrentCollectionDetailViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.collectionUuid = options.collectionUuid;
        this.onBackCallback = options.onBack;

        (this as any).events = {
            'click .collection-detail-back': 'handleBack',
            'click .torrent-remove': 'handleRemoveTorrent',
            'click .torrent-move-up': 'handleMoveTorrentUp',
            'click .torrent-move-down': 'handleMoveTorrentDown'
        };

        analytics.trackEvent('torrent_collection_detail_opened', { collectionUuid: this.collectionUuid });
        this.loadCollection();
    }

    template(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <button class="collection-detail-back p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
                                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                            </button>
                            <div class="flex-1 min-w-0">
                                <div class="text-white font-semibold truncate">${this.escapeHtml(this.collectionData?.name || 'Collection')}</div>
                                ${this.collectionData?.description ? `
                                    <div class="text-gray-400 text-sm truncate">${this.escapeHtml(this.collectionData.description)}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Toolbar -->
                    <div class="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
                        <div class="flex-1 text-gray-400 text-sm">
                            ${this.collectionData?.items.length || 0} torrent${(this.collectionData?.items.length || 0) !== 1 ? 's' : ''}
                        </div>
                        <!-- Future: Add Torrent button can go here -->
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        ${this.isLoading ? this.renderLoading() : this.renderTorrents()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    private renderLoading(): string {
        return `
            <div class="flex items-center justify-center py-20">
                <div class="flex flex-col items-center gap-4">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="text-gray-400">Loading torrents...</p>
                </div>
            </div>
        `;
    }

    /**
     * Render torrents list
     */
    private renderTorrents(): string {
        if (!this.collectionData || this.collectionData.items.length === 0) {
            return this.renderEmpty();
        }

        return `
            <div class="space-y-3">
                ${this.collectionData.items.map((item, index) => this.renderTorrentCard(item, index)).join('')}
            </div>
        `;
    }

    /**
     * Render empty state
     */
    private renderEmpty(): string {
        return `
            <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-gray-400 text-lg mb-2">No torrents yet</p>
                <p class="text-gray-500 text-sm">Add torrents from search results to build your collection</p>
            </div>
        `;
    }

    /**
     * Render torrent card
     */
    private renderTorrentCard(torrent: Torrent & { sort_order: number }, index: number): string {
        const size = this.formatBytes(torrent.size_bytes || 0);
        const quality = torrent.quality || 'Unknown';
        const seeders = torrent.cached_seeders || 0;
        const isFirst = index === 0;
        const isLast = index === (this.collectionData?.items.length || 0) - 1;

        return `
            <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors torrent-card" data-info-hash="${torrent.info_hash}">
                <div class="flex items-start gap-4">
                    <!-- Order Number -->
                    <div class="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium">
                        ${index + 1}
                    </div>

                    <!-- Torrent Info -->
                    <div class="flex-1 min-w-0">
                        <h3 class="text-white font-medium mb-2 break-words">${this.escapeHtml(torrent.name)}</h3>

                        <div class="flex flex-wrap items-center gap-3 text-sm">
                            <!-- Size -->
                            <div class="flex items-center gap-1.5 text-gray-400">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                <span>${size}</span>
                            </div>

                            <!-- Quality Badge -->
                            <div class="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                                ${this.escapeHtml(quality)}
                            </div>

                            <!-- Seeders -->
                            ${seeders > 0 ? `
                                <div class="flex items-center gap-1.5 text-green-400">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                    </svg>
                                    <span>${seeders}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex-shrink-0 flex flex-col gap-2">
                        <!-- Reorder Buttons -->
                        <div class="flex gap-1">
                            <button
                                class="torrent-move-up p-1.5 rounded ${isFirst ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'} transition-colors"
                                data-info-hash="${torrent.info_hash}"
                                title="Move up"
                                ${isFirst ? 'disabled' : ''}
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                                </svg>
                            </button>
                            <button
                                class="torrent-move-down p-1.5 rounded ${isLast ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'} transition-colors"
                                data-info-hash="${torrent.info_hash}"
                                title="Move down"
                                ${isLast ? 'disabled' : ''}
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>

                        <!-- Remove Button -->
                        <button
                            class="torrent-remove p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            data-info-hash="${torrent.info_hash}"
                            title="Remove from collection"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load collection with torrents
     */
    async loadCollection(): Promise<void> {
        this.isLoading = true;
        this.render();

        try {
            this.collectionData = await collectionsService.getCollectionWithTorrents(this.collectionUuid);

            logger.info('Torrent collection detail loaded', {
                uuid: this.collectionUuid,
                itemCount: this.collectionData?.items.length || 0
            }, 'torrent-collection');

            analytics.trackEvent('torrent_collection_detail_loaded', {
                collectionUuid: this.collectionUuid,
                itemCount: this.collectionData?.items.length || 0
            });
        } catch (error: any) {
            logger.error('Failed to load torrent collection detail', error, undefined, 'torrent-collection');
            // Show error state (could add renderError() method)
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * Format bytes to human-readable size
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
     * Handle back button click
     */
    handleBack(e: Event): void {
        e.preventDefault();

        logger.info('Torrent collection detail back', { uuid: this.collectionUuid }, 'torrent-collection');
        analytics.trackEvent('torrent_collection_detail_back', { collectionUuid: this.collectionUuid });

        if (this.onBackCallback) {
            this.onBackCallback();
        }

        this.remove();
    }

    /**
     * Handle remove torrent button click
     */
    async handleRemoveTorrent(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const infoHash = button.dataset.infoHash || '';

        if (!infoHash || !this.collectionData) return;

        const torrent = this.collectionData.items.find(t => t.info_hash === infoHash);
        if (!torrent) return;

        const confirmed = confirm(`Remove "${torrent.name}" from collection?\n\nThe torrent file will remain in your library.`);
        if (!confirmed) return;

        try {
            await collectionsService.removeTorrentFromCollection(this.collectionUuid, infoHash);

            // Update local state
            this.collectionData.items = this.collectionData.items.filter(t => t.info_hash !== infoHash);
            this.render();

            logger.info('Torrent removed from collection', {
                uuid: this.collectionUuid,
                infoHash
            }, 'torrent-collection');

            analytics.trackEvent('torrent_removed_from_collection', {
                collectionUuid: this.collectionUuid,
                infoHash
            });
        } catch (error: any) {
            logger.error('Failed to remove torrent from collection', error, undefined, 'torrent-collection');
            alert('Failed to remove torrent: ' + error.message);
        }
    }

    /**
     * Handle move torrent up button click
     */
    async handleMoveTorrentUp(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const infoHash = button.dataset.infoHash || '';

        if (!infoHash || !this.collectionData) return;

        const currentIndex = this.collectionData.items.findIndex(t => t.info_hash === infoHash);
        if (currentIndex <= 0) return; // Already at top or not found

        try {
            await collectionsService.moveTorrentUp(this.collectionUuid, infoHash);

            // Update local state (swap with previous)
            const items = [...this.collectionData.items];
            [items[currentIndex - 1], items[currentIndex]] = [items[currentIndex], items[currentIndex - 1]];
            this.collectionData.items = items;
            this.render();

            logger.info('Torrent moved up in collection', {
                uuid: this.collectionUuid,
                infoHash,
                newPosition: currentIndex - 1
            }, 'torrent-collection');

            analytics.trackEvent('torrent_reordered_in_collection', {
                collectionUuid: this.collectionUuid,
                direction: 'up'
            });
        } catch (error: any) {
            logger.error('Failed to move torrent up', error, undefined, 'torrent-collection');
            alert('Failed to reorder torrent: ' + error.message);
        }
    }

    /**
     * Handle move torrent down button click
     */
    async handleMoveTorrentDown(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const infoHash = button.dataset.infoHash || '';

        if (!infoHash || !this.collectionData) return;

        const currentIndex = this.collectionData.items.findIndex(t => t.info_hash === infoHash);
        if (currentIndex < 0 || currentIndex >= this.collectionData.items.length - 1) return; // Already at bottom or not found

        try {
            await collectionsService.moveTorrentDown(this.collectionUuid, infoHash);

            // Update local state (swap with next)
            const items = [...this.collectionData.items];
            [items[currentIndex], items[currentIndex + 1]] = [items[currentIndex + 1], items[currentIndex]];
            this.collectionData.items = items;
            this.render();

            logger.info('Torrent moved down in collection', {
                uuid: this.collectionUuid,
                infoHash,
                newPosition: currentIndex + 1
            }, 'torrent-collection');

            analytics.trackEvent('torrent_reordered_in_collection', {
                collectionUuid: this.collectionUuid,
                direction: 'down'
            });
        } catch (error: any) {
            logger.error('Failed to move torrent down', error, undefined, 'torrent-collection');
            alert('Failed to reorder torrent: ' + error.message);
        }
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('TorrentCollectionDetailView destroyed', undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collection_detail_destroyed', { collectionUuid: this.collectionUuid });
    }
}

/**
 * Show torrent collection detail modal
 */
export function showTorrentCollectionDetail(
    container: HTMLElement,
    collectionUuid: string,
    callbacks?: {
        onBack?: () => void;
    }
): TorrentCollectionDetailView {
    const view = new TorrentCollectionDetailView({
        collectionUuid,
        ...callbacks
    });

    view.setElement(container);
    view.render();

    logger.info('Torrent collection detail view displayed', { uuid: collectionUuid }, 'torrent-collection');

    return view;
}
