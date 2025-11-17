/**
 * Collections View
 * Phase 9C.1: Watchlist & Collections UI
 * Manages user collections with grid view and smart collections
 */

import { View, type ViewOptions } from 'backbone.marionette';
import {
    type Collection,
    type CollectionItem,
    CollectionType,
    type CollectionInput,
    collectionService
} from '../lib/collection-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface CollectionsViewOptions extends ViewOptions<any> {
    onItemClick?: (item: CollectionItem) => void;
    onClose?: () => void;
}

/**
 * Collections View
 * Grid view of all collections with create/manage functionality
 */
export class CollectionsView extends View<any> {
    private collections: Collection[] = [];
    private activeTab: 'watchlist' | 'custom' | 'smart' = 'watchlist';
    private isLoading: boolean = false;
    private onItemClickCallback?: (item: CollectionItem) => void;
    private onCloseCallback?: () => void;

    constructor(options: CollectionsViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.onItemClickCallback = options.onItemClick;
        this.onCloseCallback = options.onClose;

        (this as any).events = {
            'click .collections-close': 'handleClose',
            'click .tab-watchlist': 'handleWatchlistTab',
            'click .tab-custom': 'handleCustomTab',
            'click .tab-smart': 'handleSmartTab',
            'click .collection-card': 'handleCollectionClick',
            'click .collection-create': 'handleCreateCollection',
            'click .collection-share': 'handleShareCollection',
            'click .collection-export': 'handleExportCollection',
            'click .collection-delete': 'handleDeleteCollection'
        };

        analytics.trackEvent('collections_opened');
        this.loadCollections();
    }

    template(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                            </svg>
                            <div>
                                <div class="text-white font-semibold">My Collections</div>
                                <div class="text-gray-400 text-sm">Organize your movies and shows</div>
                            </div>
                        </div>
                        <button class="collections-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
                        <button class="tab-watchlist px-4 py-2 rounded-lg transition-colors ${this.activeTab === 'watchlist' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>Watchlists</span>
                            </div>
                        </button>
                        <button class="tab-custom px-4 py-2 rounded-lg transition-colors ${this.activeTab === 'custom' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                <span>Custom</span>
                            </div>
                        </button>
                        <button class="tab-smart px-4 py-2 rounded-lg transition-colors ${this.activeTab === 'smart' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                                <span>Smart</span>
                            </div>
                        </button>

                        <div class="flex-1"></div>

                        <button class="collection-create px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>New Collection</span>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        ${this.isLoading ? this.renderLoading() : this.renderCollections()}
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
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    <p class="text-gray-400">Loading collections...</p>
                </div>
            </div>
        `;
    }

    /**
     * Render collections grid
     */
    private renderCollections(): string {
        const filteredCollections = this.collections.filter(c => {
            if (this.activeTab === 'watchlist') return c.type === CollectionType.WATCHLIST;
            if (this.activeTab === 'custom') return c.type === CollectionType.CUSTOM;
            if (this.activeTab === 'smart') return c.type === CollectionType.SMART;
            return false;
        });

        if (filteredCollections.length === 0) {
            return this.renderEmpty();
        }

        return `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                ${filteredCollections.map(collection => this.renderCollectionCard(collection)).join('')}
            </div>
        `;
    }

    /**
     * Render empty state
     */
    private renderEmpty(): string {
        const messages = {
            watchlist: 'Your watchlists will appear here',
            custom: 'Create your first custom collection',
            smart: 'Set up smart collections with auto-rules'
        };

        return `
            <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <p class="text-gray-400 text-lg mb-2">${messages[this.activeTab]}</p>
                <p class="text-gray-500 text-sm mb-4">Start organizing your favorite content</p>
                <button class="collection-create px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Create Collection
                </button>
            </div>
        `;
    }

    /**
     * Render collection card
     */
    private renderCollectionCard(collection: Collection): string {
        const iconHtml = this.getCollectionIcon(collection.type);
        const coverArt = collection.coverArt || 'https://via.placeholder.com/300x450?text=Collection';

        return `
            <div class="collection-card group cursor-pointer" data-collection-id="${collection.id}">
                <div class="relative bg-gray-800 rounded-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                    <!-- Cover Art -->
                    <div class="aspect-[2/3] bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative">
                        ${collection.coverArt ? `
                            <img src="${this.escapeHtml(coverArt)}" alt="${this.escapeHtml(collection.name)}" class="w-full h-full object-cover" />
                        ` : `
                            <div class="w-full h-full flex items-center justify-center">
                                ${iconHtml}
                            </div>
                        `}

                        <!-- Item Count Badge -->
                        <div class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                            ${collection.itemCount} ${collection.itemCount === 1 ? 'item' : 'items'}
                        </div>

                        <!-- Actions (on hover) -->
                        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button class="collection-share p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" data-collection-id="${collection.id}" title="Share">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                </svg>
                            </button>
                            <button class="collection-export p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" data-collection-id="${collection.id}" title="Export">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                            </button>
                            ${collection.type !== CollectionType.WATCHLIST ? `
                                <button class="collection-delete p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors" data-collection-id="${collection.id}" title="Delete">
                                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="p-3">
                        <h3 class="text-white font-medium truncate">${this.escapeHtml(collection.name)}</h3>
                        ${collection.description ? `
                            <p class="text-gray-400 text-sm truncate">${this.escapeHtml(collection.description)}</p>
                        ` : ''}
                        ${collection.type === CollectionType.SMART && collection.rules ? `
                            <div class="mt-2 flex items-center gap-1 text-xs text-purple-400">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                                <span>${collection.rules.length} rule${collection.rules.length > 1 ? 's' : ''}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get collection icon by type
     */
    private getCollectionIcon(type: CollectionType): string {
        const icons = {
            [CollectionType.WATCHLIST]: `
                <svg class="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
            `,
            [CollectionType.CUSTOM]: `
                <svg class="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            `,
            [CollectionType.SMART]: `
                <svg class="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
            `
        };

        return icons[type] || icons[CollectionType.CUSTOM];
    }

    /**
     * Load collections from database
     */
    async loadCollections(): Promise<void> {
        this.isLoading = true;
        this.render();

        try {
            await collectionService.initialize();
            this.collections = await collectionService.getAllCollections();

            logger.info('Collections loaded', { count: this.collections.length }, 'collection');
            analytics.trackEvent('collections_loaded', { count: this.collections.length });
        } catch (error: any) {
            logger.error('Failed to load collections', error, undefined, 'collection');
        } finally {
            this.isLoading = false;
            this.render();
        }
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
     * Handle watchlist tab click
     */
    handleWatchlistTab(e: Event): void {
        e.preventDefault();
        this.activeTab = 'watchlist';
        analytics.trackEvent('collections_tab_changed', { tab: 'watchlist' });
        this.render();
    }

    /**
     * Handle custom tab click
     */
    handleCustomTab(e: Event): void {
        e.preventDefault();
        this.activeTab = 'custom';
        analytics.trackEvent('collections_tab_changed', { tab: 'custom' });
        this.render();
    }

    /**
     * Handle smart tab click
     */
    handleSmartTab(e: Event): void {
        e.preventDefault();
        this.activeTab = 'smart';
        analytics.trackEvent('collections_tab_changed', { tab: 'smart' });
        this.render();
    }

    /**
     * Handle collection card click
     */
    async handleCollectionClick(e: Event): Promise<void> {
        const card = (e.currentTarget as HTMLElement).closest('.collection-card') as HTMLElement;
        if (!card) return;

        // Don't trigger if clicking action buttons
        if ((e.target as HTMLElement).closest('button')) return;

        const collectionId = parseInt(card.dataset.collectionId || '0', 10);

        logger.info(`Collection clicked: ${collectionId}`, undefined, 'collection');
        analytics.trackEvent('collection_opened', { collectionId });

        // TODO: Open collection detail view
        alert(`Opening collection ${collectionId}. Collection detail view coming soon!`);
    }

    /**
     * Handle create collection button click
     */
    async handleCreateCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        logger.info('Create collection initiated', undefined, 'collection');
        analytics.trackEvent('collection_create_initiated', { tab: this.activeTab });

        // TODO: Open create collection modal
        alert('Create collection modal coming soon!');
    }

    /**
     * Handle share collection button click
     */
    async handleShareCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const collectionId = parseInt(button.dataset.collectionId || '0', 10);
        const collection = this.collections.find(c => c.id === collectionId);

        if (!collection) return;

        logger.info(`Sharing collection: ${collectionId}`, undefined, 'collection');
        analytics.trackEvent('collection_shared', { collectionId });

        // Copy share link to clipboard
        const shareLink = `flixcapacitor://collection/${collection.shareCode}`;

        try {
            await navigator.clipboard.writeText(shareLink);
            alert(`Share link copied to clipboard!\n${shareLink}`);
        } catch (error: any) {
            // Fallback for older browsers
            alert(`Share this link:\n${shareLink}`);
        }
    }

    /**
     * Handle export collection button click
     */
    async handleExportCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const collectionId = parseInt(button.dataset.collectionId || '0', 10);

        try {
            const jsonData = await collectionService.exportCollection(collectionId);

            // Download as file
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collection-${collectionId}.json`;
            a.click();
            URL.revokeObjectURL(url);

            logger.info(`Collection exported: ${collectionId}`, undefined, 'collection');
            analytics.trackEvent('collection_exported', { collectionId });

            alert('Collection exported successfully!');
        } catch (error: any) {
            logger.error('Failed to export collection', error, undefined, 'collection');
            alert('Failed to export collection: ' + error.message);
        }
    }

    /**
     * Handle delete collection button click
     */
    async handleDeleteCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const collectionId = parseInt(button.dataset.collectionId || '0', 10);
        const collection = this.collections.find(c => c.id === collectionId);

        if (!collection) return;

        const confirmed = confirm(`Delete "${collection.name}"?\n\nThis will remove the collection and all its items. This action cannot be undone.`);

        if (!confirmed) return;

        try {
            await collectionService.deleteCollection(collectionId);

            // Remove from local array
            this.collections = this.collections.filter(c => c.id !== collectionId);

            logger.info(`Collection deleted: ${collectionId}`, undefined, 'collection');
            analytics.trackEvent('collection_deleted', { collectionId });

            this.render();
            alert('Collection deleted successfully!');
        } catch (error: any) {
            logger.error('Failed to delete collection', error, undefined, 'collection');
            alert('Failed to delete collection: ' + error.message);
        }
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();

        logger.info('Collections view closed', undefined, 'collection');
        analytics.trackEvent('collections_closed');

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }

        this.remove();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('CollectionsView destroyed', undefined, 'collection');
        analytics.trackEvent('collections_destroyed');
    }
}

/**
 * Show collections modal
 */
export function showCollections(
    container: HTMLElement,
    callbacks?: {
        onItemClick?: (item: CollectionItem) => void;
        onClose?: () => void;
    }
): CollectionsView {
    const view = new CollectionsView(callbacks || {});

    view.setElement(container);
    view.render();

    logger.info('Collections view displayed', undefined, 'collection');

    return view;
}
