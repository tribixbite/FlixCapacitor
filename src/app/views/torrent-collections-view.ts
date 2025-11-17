/**
 * Torrent Collections View
 * Phase 13: Torrent Collections - List View
 * Displays all torrent collections in a grid layout
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { collectionsService, type Collection, type CollectionWithTorrents } from '../lib/collections-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';
import { CollectionFormView, type CollectionFormData } from './collection-form-view';
import { TorrentCollectionDetailView } from './torrent-collection-detail-view';

interface TorrentCollectionsViewOptions extends ViewOptions<any> {
    onCollectionClick?: (collection: Collection) => void;
    onClose?: () => void;
}

/**
 * Torrent Collections List View
 * Grid view of all torrent collections with create/manage functionality
 */
export class TorrentCollectionsView extends View<any> {
    private collections: Collection[] = [];
    private isLoading: boolean = false;
    private onCollectionClickCallback?: (collection: Collection) => void;
    private onCloseCallback?: () => void;

    constructor(options: TorrentCollectionsViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.onCollectionClickCallback = options.onCollectionClick;
        this.onCloseCallback = options.onClose;

        (this as any).events = {
            'click .torrent-collections-close': 'handleClose',
            'click .collection-card': 'handleCollectionClick',
            'click .collection-create': 'handleCreateCollection',
            'click .collection-edit': 'handleEditCollection',
            'click .collection-delete': 'handleDeleteCollection'
        };

        analytics.trackEvent('torrent_collections_opened');
        this.loadCollections();
    }

    template(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                            </svg>
                            <div>
                                <div class="text-white font-semibold">Torrent Collections</div>
                                <div class="text-gray-400 text-sm">Organize your torrents into playlists</div>
                            </div>
                        </div>
                        <button class="torrent-collections-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Toolbar -->
                    <div class="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
                        <div class="flex-1 text-gray-400 text-sm">
                            ${this.collections.length} collection${this.collections.length !== 1 ? 's' : ''}
                        </div>

                        <button class="collection-create px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
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
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="text-gray-400">Loading collections...</p>
                </div>
            </div>
        `;
    }

    /**
     * Render collections grid
     */
    private renderCollections(): string {
        if (this.collections.length === 0) {
            return this.renderEmpty();
        }

        return `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                ${this.collections.map(collection => this.renderCollectionCard(collection)).join('')}
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <p class="text-gray-400 text-lg mb-2">No collections yet</p>
                <p class="text-gray-500 text-sm mb-4">Create your first torrent collection to get started</p>
                <button class="collection-create px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Create Collection
                </button>
            </div>
        `;
    }

    /**
     * Render collection card
     */
    private renderCollectionCard(collection: Collection): string {
        const coverImage = collection.cover_image_url || '';
        const itemCount = collection.item_count || 0;

        return `
            <div class="collection-card group cursor-pointer" data-collection-uuid="${collection.uuid}">
                <div class="relative bg-gray-800 rounded-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                    <!-- Cover Art -->
                    <div class="aspect-[2/3] bg-gradient-to-br from-blue-900/20 to-purple-900/20 relative">
                        ${coverImage ? `
                            <img src="${this.escapeHtml(coverImage)}" alt="${this.escapeHtml(collection.name)}" class="w-full h-full object-cover" />
                        ` : `
                            <div class="w-full h-full flex items-center justify-center">
                                <svg class="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                        `}

                        <!-- Item Count Badge -->
                        <div class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                            ${itemCount} ${itemCount === 1 ? 'item' : 'items'}
                        </div>

                        <!-- Actions (on hover) -->
                        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button class="collection-edit p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" data-collection-uuid="${collection.uuid}" title="Edit">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </button>
                            <button class="collection-delete p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors" data-collection-uuid="${collection.uuid}" title="Delete">
                                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="p-3">
                        <h3 class="text-white font-medium truncate">${this.escapeHtml(collection.name)}</h3>
                        ${collection.description ? `
                            <p class="text-gray-400 text-sm line-clamp-2">${this.escapeHtml(collection.description)}</p>
                        ` : ''}
                        <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>${this.formatDate(collection.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load collections from database
     */
    async loadCollections(): Promise<void> {
        this.isLoading = true;
        this.render();

        try {
            this.collections = await collectionsService.getAllCollections();

            logger.info('Torrent collections loaded', { count: this.collections.length }, 'torrent-collection');
            analytics.trackEvent('torrent_collections_loaded', { count: this.collections.length });
        } catch (error: any) {
            logger.error('Failed to load torrent collections', error, undefined, 'torrent-collection');
            // Show error state (could add renderError() method)
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * Format date for display
     */
    private formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 7) return `${days} days ago`;
            if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
            if (days < 365) return `${Math.floor(days / 30)} months ago`;
            return date.toLocaleDateString();
        } catch {
            return dateString;
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
     * Handle collection card click
     */
    async handleCollectionClick(e: Event): Promise<void> {
        const card = (e.currentTarget as HTMLElement).closest('.collection-card') as HTMLElement;
        if (!card) return;

        // Don't trigger if clicking action buttons
        if ((e.target as HTMLElement).closest('button')) return;

        const collectionUuid = card.dataset.collectionUuid || '';
        const collection = this.collections.find(c => c.uuid === collectionUuid);

        if (!collection) return;

        logger.info(`Torrent collection clicked: ${collectionUuid}`, undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collection_opened', { collectionUuid });

        if (this.onCollectionClickCallback) {
            this.onCollectionClickCallback(collection);
        } else {
            // Open collection detail view
            this.openDetailView(collectionUuid);
        }
    }

    /**
     * Open collection detail view
     */
    private openDetailView(collectionUuid: string): void {
        // Hide list view
        const listContainer = (this as any).el?.querySelector('.fixed.inset-0') as HTMLElement;
        if (listContainer) {
            listContainer.style.display = 'none';
        }

        // Create detail view
        const detailView = new TorrentCollectionDetailView({
            collectionUuid,
            onBack: () => {
                // Reload collections in case items were removed/reordered
                this.loadCollections();

                // Show list view again
                if (listContainer) {
                    listContainer.style.display = 'flex';
                }
            }
        });

        // Mount detail view to same container
        detailView.setElement((this as any).el);
        detailView.render();
    }

    /**
     * Handle create collection button click
     */
    async handleCreateCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        logger.info('Create torrent collection initiated', undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collection_create_initiated');

        // Open create collection modal
        new CollectionFormView({
            mode: 'create',
            onSave: async (data: CollectionFormData) => {
                try {
                    const collection = await collectionsService.createCollection(data);

                    this.collections.push(collection);
                    this.render();

                    logger.info('Torrent collection created', { uuid: collection.uuid, name: data.name }, 'torrent-collection');
                    analytics.trackEvent('torrent_collection_created', { uuid: collection.uuid });
                } catch (error: any) {
                    logger.error('Failed to create torrent collection', error, undefined, 'torrent-collection');
                    alert('Failed to create collection: ' + error.message);
                }
            },
            onCancel: () => {
                logger.info('Create collection cancelled', undefined, 'torrent-collection');
            }
        });
    }

    /**
     * Handle edit collection button click
     */
    async handleEditCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const collectionUuid = button.dataset.collectionUuid || '';
        const collection = this.collections.find(c => c.uuid === collectionUuid);

        if (!collection) return;

        logger.info(`Editing torrent collection: ${collectionUuid}`, undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collection_edit_initiated', { collectionUuid });

        // Open edit collection modal
        new CollectionFormView({
            mode: 'edit',
            existingCollection: collection,
            onSave: async (data: CollectionFormData) => {
                try {
                    await collectionsService.updateCollection(collectionUuid, data);

                    // Update local array
                    const index = this.collections.findIndex(c => c.uuid === collectionUuid);
                    if (index !== -1) {
                        this.collections[index] = {
                            ...this.collections[index],
                            name: data.name,
                            description: data.description,
                            cover_image_url: data.cover_image_url
                        };
                    }

                    this.render();

                    logger.info('Torrent collection updated', { uuid: collectionUuid }, 'torrent-collection');
                    analytics.trackEvent('torrent_collection_updated', { collectionUuid });
                } catch (error: any) {
                    logger.error('Failed to update torrent collection', error, undefined, 'torrent-collection');
                    alert('Failed to update collection: ' + error.message);
                }
            },
            onCancel: () => {
                logger.info('Edit collection cancelled', undefined, 'torrent-collection');
            }
        });
    }

    /**
     * Handle delete collection button click
     */
    async handleDeleteCollection(e: Event): Promise<void> {
        e.preventDefault();
        e.stopPropagation();

        const button = e.currentTarget as HTMLElement;
        const collectionUuid = button.dataset.collectionUuid || '';
        const collection = this.collections.find(c => c.uuid === collectionUuid);

        if (!collection) return;

        const confirmed = confirm(`Delete "${collection.name}"?\n\nThis will remove the collection but keep the torrents. This action cannot be undone.`);

        if (!confirmed) return;

        try {
            await collectionsService.deleteCollection(collectionUuid);

            // Remove from local array
            this.collections = this.collections.filter(c => c.uuid !== collectionUuid);

            this.render();

            logger.info('Torrent collection deleted', { uuid: collectionUuid }, 'torrent-collection');
            analytics.trackEvent('torrent_collection_deleted', { collectionUuid });

            alert('Collection deleted successfully!');
        } catch (error: any) {
            logger.error('Failed to delete torrent collection', error, undefined, 'torrent-collection');
            alert('Failed to delete collection: ' + error.message);
        }
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();

        logger.info('Torrent collections view closed', undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collections_closed');

        if (this.onCloseCallback) {
            this.onCloseCallback();
        }

        this.remove();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('TorrentCollectionsView destroyed', undefined, 'torrent-collection');
        analytics.trackEvent('torrent_collections_destroyed');
    }
}

/**
 * Show torrent collections modal
 */
export function showTorrentCollections(
    container: HTMLElement,
    callbacks?: {
        onCollectionClick?: (collection: Collection) => void;
        onClose?: () => void;
    }
): TorrentCollectionsView {
    const view = new TorrentCollectionsView(callbacks || {});

    view.setElement(container);
    view.render();

    logger.info('Torrent collections view displayed', undefined, 'torrent-collection');

    return view;
}
