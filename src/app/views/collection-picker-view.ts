/**
 * CollectionPickerView - Modal for selecting a collection to add a torrent to
 * Phase 13 Phase 2: Search Integration
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { collectionsService, type Collection } from '../lib/collections-service';
import type { TorrentCreateData } from '../lib/torrents-service';
import { analytics } from '../lib/analytics';
import { logger } from '../lib/logger';

interface CollectionPickerViewOptions extends ViewOptions<any> {
  torrentData: TorrentCreateData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Modal view for selecting a collection to add a torrent to
 * Shows list of existing collections with create new option
 */
export class CollectionPickerView extends View<any> {
  private torrentData: TorrentCreateData;
  private collections: Collection[] = [];
  private isLoading: boolean = true;
  private onSuccessCallback?: () => void;
  private onCancelCallback?: () => void;

  /**
   * Create a new collection picker modal
   * @param options.torrentData - Torrent data to add to selected collection
   * @param options.onSuccess - Callback when torrent is successfully added
   * @param options.onCancel - Callback when picker is cancelled
   */
  constructor(options: CollectionPickerViewOptions) {
    super({ el: document.body } as any);

    this.torrentData = options.torrentData;
    this.onSuccessCallback = options.onSuccess;
    this.onCancelCallback = options.onCancel;

    this.loadCollections();
  }

  /**
   * Load all collections from database
   */
  async loadCollections(): Promise<void> {
    this.isLoading = true;
    this.render();

    try {
      this.collections = await collectionsService.getAllCollections();
      logger.info('CollectionPickerView', { message: `Loaded ${this.collections.length} collections` });
    } catch (error: any) {
      logger.error('CollectionPickerView', { message: 'Failed to load collections', error });
      this.collections = [];
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  /**
   * Render the modal
   */
  template(): string {
    const torrentName = this.escapeHtml(this.torrentData.name);
    const torrentQuality = this.escapeHtml(this.torrentData.quality || 'Unknown');

    return `
      <!-- Collection Picker Modal Overlay -->
      <div class="collection-picker-overlay"
           style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
                  z-index: 10000; display: flex; align-items: center; justify-content: center;
                  padding: 1rem; animation: fadeIn 0.2s ease;">

        <!-- Modal Container -->
        <div class="collection-picker-modal"
             style="background: var(--bg-secondary); border-radius: var(--radius-lg);
                    max-width: 500px; width: 100%; max-height: 80vh;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: var(--shadow-lg); animation: slideUp 0.3s ease;">

          <!-- Header -->
          <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
              Add to Collection
            </h2>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              <div style="font-weight: 500; margin-bottom: 0.25rem;">${torrentName}</div>
              <div style="color: var(--text-tertiary);">${torrentQuality}</div>
            </div>
          </div>

          <!-- Content -->
          <div style="flex: 1; overflow-y: auto; padding: 1rem;">
            ${this.isLoading ? this.renderLoading() : this.renderCollectionList()}
          </div>

          <!-- Footer -->
          <div style="padding: 1rem; border-top: 1px solid var(--border-color);
                      display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="collection-picker-cancel btn-secondary"
                    style="padding: 0.75rem 1.5rem; border-radius: var(--radius-sm);
                           border: 1px solid var(--border-color); background: transparent;
                           color: var(--text-primary); font-weight: 500; cursor: pointer;
                           transition: background 0.2s;">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .collection-picker-item {
          padding: 1rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .collection-picker-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateX(4px);
        }
        .collection-picker-item:active {
          transform: scale(0.98);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .btn-secondary:active {
          transform: scale(0.95);
        }
      </style>
    `;
  }

  /**
   * Render loading state
   */
  private renderLoading(): string {
    return `
      <div style="display: flex; flex-direction: column; align-items: center;
                  justify-content: center; padding: 3rem 1rem; color: var(--text-secondary);">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(59, 130, 246, 0.2);
                    border-top-color: rgb(59, 130, 246); border-radius: 50%;
                    animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
        <div>Loading collections...</div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Render collection list
   */
  private renderCollectionList(): string {
    if (this.collections.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
          <div style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem;">
            No collections yet
          </div>
          <div style="font-size: 0.875rem; color: var(--text-tertiary);">
            Create your first collection to organize torrents
          </div>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${this.collections.map(collection => this.renderCollectionItem(collection)).join('')}
      </div>
    `;
  }

  /**
   * Render individual collection item
   */
  private renderCollectionItem(collection: Collection): string {
    const name = this.escapeHtml(collection.name);
    const description = collection.description
      ? this.escapeHtml(collection.description)
      : 'No description';
    const itemCount = collection.item_count || 0;

    return `
      <div class="collection-picker-item" data-collection-uuid="${collection.uuid}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">
              ${name}
            </div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${description}
            </div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.2); color: rgb(59, 130, 246);
                      padding: 0.25rem 0.75rem; border-radius: 999px;
                      font-size: 0.75rem; font-weight: 600; margin-left: 0.75rem;">
            ${itemCount}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  override onRender(): void {
    // Collection item clicks
    const items = this.el.querySelectorAll('.collection-picker-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => this.handleCollectionClick(e));
    });

    // Cancel button
    const cancelBtn = this.el.querySelector('.collection-picker-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // Close on overlay click (but not on modal click)
    const overlay = this.el.querySelector('.collection-picker-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.handleCancel();
        }
      });
    }
  }

  /**
   * Handle collection selection
   */
  async handleCollectionClick(e: Event): Promise<void> {
    const item = (e.currentTarget as HTMLElement).closest('.collection-picker-item') as HTMLElement;
    if (!item) return;

    const collectionUuid = item.dataset.collectionUuid;
    if (!collectionUuid) return;

    try {
      logger.info('CollectionPickerView', { message: `Adding torrent to collection ${collectionUuid}` });

      // Add torrent to collection
      await collectionsService.addTorrentToCollection(collectionUuid, this.torrentData);

      // Analytics
      analytics.trackEvent('torrent_added_to_collection', {
        collection_uuid: collectionUuid,
        info_hash: this.torrentData.info_hash,
        quality: this.torrentData.quality
      });

      logger.info('CollectionPickerView', { message: 'Torrent added successfully' });

      // Show success message (simple approach - could be enhanced with toast)
      this.showSuccessMessage();

      // Callback
      if (this.onSuccessCallback) {
        this.onSuccessCallback();
      }

      // Close modal
      this.remove();
    } catch (error: any) {
      logger.error('CollectionPickerView', { message: 'Failed to add torrent', error });
      alert(`Failed to add torrent: ${error.message}`);
    }
  }

  /**
   * Handle cancel
   */
  handleCancel(): void {
    analytics.trackEvent('collection_picker_cancelled', {
      info_hash: this.torrentData.info_hash
    });

    if (this.onCancelCallback) {
      this.onCancelCallback();
    }

    this.remove();
  }

  /**
   * Show success message
   */
  private showSuccessMessage(): void {
    // Simple success indicator (could be enhanced with a proper toast system)
    const message = document.createElement('div');
    message.textContent = '✓ Added to collection';
    message.style.cssText = `
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgb(34, 197, 94);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      font-weight: 500;
      z-index: 10001;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      message.style.transition = 'opacity 0.3s ease';
      message.style.opacity = '0';
      setTimeout(() => message.remove(), 300);
    }, 2000);
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
   * Remove the modal
   */
  override remove(): any {
    const overlay = this.el.querySelector('.collection-picker-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
    return super.remove();
  }
}

/**
 * Helper function to show collection picker from anywhere in the app
 * @param torrentData - Torrent data to add to collection
 * @returns Promise that resolves when picker is closed
 */
export async function showCollectionPicker(torrentData: TorrentCreateData): Promise<void> {
  return new Promise((resolve) => {
    new CollectionPickerView({
      torrentData,
      onSuccess: () => resolve(),
      onCancel: () => resolve()
    });
  });
}
