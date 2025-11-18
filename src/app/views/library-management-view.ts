/**
 * Library Management View
 * Phase 11B: Folder management with statistics, rescan, and removal
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';
import sqliteService from '../lib/sqlite-service';

interface LibraryFolder {
    uri: string;
    displayName: string;
    addedAt: number;
    // Statistics (loaded from database)
    filesCount?: number;
    lastScanned?: number;
    totalSize?: number;
}

interface LibraryManagementViewOptions extends ViewOptions<any> {
    onRescan?: (folder: LibraryFolder) => void;
    onRemove?: (folder: LibraryFolder) => void;
    onClose?: () => void;
}

/**
 * Library Management View
 * Shows all added folders with statistics and management controls
 */
export class LibraryManagementView extends View<any> {
    private folders: LibraryFolder[] = [];
    private onRescan?: (folder: LibraryFolder) => void;
    private onRemove?: (folder: LibraryFolder) => void;
    private onClose?: () => void;
    private loading: boolean = true;

    constructor(options: LibraryManagementViewOptions) {
        super(options);

        this.onRescan = options.onRescan;
        this.onRemove = options.onRemove;
        this.onClose = options.onClose;

        // Set up events
        (this as any).events = {
            'click .library-close': 'handleClose',
            'click .folder-rescan': 'handleRescan',
            'click .folder-remove': 'handleRemove'
        };

        // Load folders on init
        this.loadFolders();

        analytics.trackEvent('library_management_opened');
    }

    /**
     * Load folders and their statistics
     */
    async loadFolders(): Promise<void> {
        try {
            // Get folders from settings
            const settings = (window as any).SettingsManager;
            const libraryFolders = settings.get('libraryFolders') || [];

            logger.info(`Loading ${libraryFolders.length} library folders`, undefined, 'library');

            // Load statistics for each folder
            this.folders = await Promise.all(
                libraryFolders.map(async (folder: LibraryFolder) => {
                    const stats = await this.getFolderStatistics(folder.uri);
                    return {
                        ...folder,
                        ...stats
                    };
                })
            );

            this.loading = false;
            this.render();

            logger.info('Library folders loaded with statistics', {
                folderCount: this.folders.length
            }, 'library');
        } catch (error: any) {
            logger.error('Failed to load library folders', error, undefined, 'library');
            this.loading = false;
            this.render();
        }
    }

    /**
     * Get statistics for a specific folder
     */
    private async getFolderStatistics(folderUri: string): Promise<{
        filesCount: number;
        lastScanned: number | null;
        totalSize: number;
    }> {
        try {
            // Count files from this folder in library
            const countResult = await sqliteService.get(
                'SELECT COUNT(*) as count, SUM(file_size) as total_size FROM library_items WHERE folder_uri = ?',
                [folderUri]
            );

            // Get last scan time from folder_scan_state
            const scanState = await sqliteService.get(
                'SELECT last_scan_time FROM folder_scan_state WHERE folder_path = ?',
                [folderUri]
            );

            return {
                filesCount: countResult?.count || 0,
                lastScanned: scanState?.last_scan_time || null,
                totalSize: countResult?.total_size || 0
            };
        } catch (error: any) {
            logger.warn(`Failed to get statistics for folder ${folderUri}`, { error: error.message }, 'library');
            return {
                filesCount: 0,
                lastScanned: null,
                totalSize: 0
            };
        }
    }

    template(): string {
        // Defensive check: ensure 'this' is properly initialized
        if (!this || this.loading === undefined) {
            console.warn('[LibraryManagement] Template called before initialization');
            return this.renderLoading();
        }

        if (this.loading) {
            return this.renderLoading();
        }

        if (this.folders.length === 0) {
            return this.renderEmpty();
        }

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
                            </svg>
                            <div>
                                <h2 class="text-white font-semibold text-lg">Library Folders</h2>
                                <p class="text-gray-400 text-sm">${this.folders.length} folder${this.folders.length !== 1 ? 's' : ''} added</p>
                            </div>
                        </div>
                        <button class="library-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg class="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Folder List -->
                    <div class="flex-1 overflow-y-auto p-4 space-y-3">
                        ${this.folders.map((folder, index) => this.renderFolder(folder, index)).join('')}
                    </div>

                    <!-- Footer -->
                    <div class="p-4 bg-gray-800/50 border-t border-gray-700">
                        <div class="flex items-center justify-between text-sm text-gray-400">
                            <div>
                                <span class="font-medium text-gray-300">${this.getTotalFiles()}</span> video files
                            </div>
                            <div>
                                <span class="font-medium text-gray-300">${this.formatBytes(this.getTotalSize())}</span> total
                            </div>
                        </div>
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
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-8">
                    <div class="flex flex-col items-center gap-4">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                        <p class="text-gray-300">Loading library folders...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    private renderEmpty(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md p-8">
                    <div class="flex flex-col items-center gap-4 text-center">
                        <svg class="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
                        </svg>
                        <h3 class="text-xl font-semibold text-white">No Folders Added</h3>
                        <p class="text-gray-400">Add a folder using the "Add Folder" button to get started</p>
                        <button class="library-close mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render individual folder card
     */
    private renderFolder(folder: LibraryFolder, index: number): string {
        const lastScanned = folder.lastScanned
            ? this.formatTimestamp(folder.lastScanned)
            : 'Never';

        const addedAt = this.formatTimestamp(folder.addedAt);

        return `
            <div class="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
                <!-- Folder Header -->
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <h3 class="text-white font-medium truncate">${this.escapeHtml(folder.displayName)}</h3>
                        </div>
                        <p class="text-gray-500 text-xs truncate">${this.escapeHtml(folder.uri)}</p>
                    </div>
                </div>

                <!-- Statistics -->
                <div class="grid grid-cols-3 gap-3 mb-3">
                    <div class="bg-gray-900/50 rounded p-2 text-center">
                        <div class="text-blue-400 text-lg font-semibold">${folder.filesCount || 0}</div>
                        <div class="text-gray-400 text-xs">Files</div>
                    </div>
                    <div class="bg-gray-900/50 rounded p-2 text-center">
                        <div class="text-green-400 text-lg font-semibold">${this.formatBytes(folder.totalSize || 0)}</div>
                        <div class="text-gray-400 text-xs">Size</div>
                    </div>
                    <div class="bg-gray-900/50 rounded p-2 text-center">
                        <div class="text-purple-400 text-sm font-semibold truncate">${lastScanned}</div>
                        <div class="text-gray-400 text-xs">Last Scan</div>
                    </div>
                </div>

                <!-- Metadata -->
                <div class="text-xs text-gray-500 mb-3">
                    Added ${addedAt}
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                    <button
                        class="folder-rescan flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        data-index="${index}"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Rescan
                    </button>
                    <button
                        class="folder-remove flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-sm rounded-lg transition-colors border border-red-600/50"
                        data-index="${index}"
                        title="Remove folder"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();
        logger.info('Library management closed', undefined, 'library');
        analytics.trackEvent('library_management_closed');

        if (this.onClose) {
            this.onClose();
        }

        this.remove();
    }

    /**
     * Handle rescan button click
     */
    handleRescan(e: Event): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);
        const folder = this.folders[index];

        logger.info(`Rescanning folder: ${folder.displayName}`, undefined, 'library');
        analytics.trackEvent('folder_rescan_requested', {
            folderName: folder.displayName
        });

        if (this.onRescan) {
            this.onRescan(folder);
        }
    }

    /**
     * Handle remove button click
     */
    handleRemove(e: Event): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);
        const folder = this.folders[index];

        // Show confirmation dialog
        const confirmed = confirm(
            `Remove "${folder.displayName}" from library?\n\n` +
            `This will remove ${folder.filesCount || 0} files from your library. ` +
            `The folder and its files will NOT be deleted from your device.`
        );

        if (!confirmed) {
            logger.info('Folder removal cancelled', undefined, 'library');
            analytics.trackEvent('folder_remove_cancelled');
            return;
        }

        logger.info(`Removing folder: ${folder.displayName}`, undefined, 'library');
        analytics.trackEvent('folder_removed', {
            folderName: folder.displayName,
            filesCount: folder.filesCount || 0
        });

        if (this.onRemove) {
            this.onRemove(folder);
        }

        // Remove from local state and re-render
        this.folders.splice(index, 1);
        this.render();
    }

    /**
     * Get total number of files across all folders
     */
    private getTotalFiles(): number {
        return this.folders.reduce((sum, folder) => sum + (folder.filesCount || 0), 0);
    }

    /**
     * Get total size across all folders
     */
    private getTotalSize(): number {
        return this.folders.reduce((sum, folder) => sum + (folder.totalSize || 0), 0);
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Format timestamp to relative time
     */
    private formatTimestamp(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }

        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Less than 1 week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }

        // Format as date
        const date = new Date(timestamp);
        return date.toLocaleDateString();
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
     * Refresh folder statistics
     */
    async refresh(): Promise<void> {
        this.loading = true;
        this.render();
        await this.loadFolders();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('LibraryManagementView destroyed', undefined, 'library');
        analytics.trackEvent('library_management_destroyed');
    }
}

/**
 * Create and show library management modal
 */
export function showLibraryManagement(
    container: HTMLElement,
    callbacks?: {
        onRescan?: (folder: LibraryFolder) => void;
        onRemove?: (folder: LibraryFolder) => void;
        onClose?: () => void;
    }
): LibraryManagementView {
    const view = new LibraryManagementView(callbacks || {});

    view.setElement(container);
    view.render();

    logger.info('Library management modal displayed', undefined, 'library');

    return view;
}
