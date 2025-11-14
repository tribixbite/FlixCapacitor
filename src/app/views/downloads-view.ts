/**
 * Downloads Manager View
 * Phase 9C UI Integration: Download queue, progress monitoring, controls
 */

import { View } from 'backbone.marionette';
import {
    downloadManager,
    DownloadItem,
    DownloadStatus,
    DownloadPriority,
    DownloadStats
} from '../lib/download-manager';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

/**
 * View options
 */
export interface DownloadsViewOptions {
    el?: HTMLElement;
}

/**
 * Active tab type
 */
type ActiveTab = 'active' | 'completed' | 'all';

/**
 * Downloads Manager View
 */
export class DownloadsView extends View<any> {
    private downloads: DownloadItem[] = [];
    private stats: DownloadStats | null = null;
    private activeTab: ActiveTab = 'active';
    private updateInterval: number | null = null;

    constructor(options: DownloadsViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        (this as any).events = {
            'click .tab-active': 'handleTabActive',
            'click .tab-completed': 'handleTabCompleted',
            'click .tab-all': 'handleTabAll',
            'click .download-pause': 'handlePause',
            'click .download-resume': 'handleResume',
            'click .download-cancel': 'handleCancel',
            'click .download-remove': 'handleRemove',
            'click .download-remove-with-files': 'handleRemoveWithFiles',
            'change .download-priority': 'handlePriorityChange',
            'click .cleanup-old': 'handleCleanupOld',
            'click .refresh-stats': 'handleRefreshStats'
        };

        logger.info('DownloadsView created', undefined, 'downloads');
        analytics.trackEvent('downloads_view_opened');
    }

    override render(): this {
        this.loadDownloads();
        this.$el.html(this.template());
        this.startAutoUpdate();
        return this;
    }

    /**
     * Load downloads and stats
     */
    private async loadDownloads(): Promise<void> {
        try {
            await downloadManager.initialize();
            this.downloads = downloadManager.getAllDownloads();
            this.stats = await downloadManager.getStats();

            logger.debug('Downloads loaded', {
                count: this.downloads.length,
                active: this.stats?.activeDownloads
            }, 'downloads');

        } catch (error: any) {
            logger.error('Failed to load downloads', error, undefined, 'downloads');
        }
    }

    /**
     * Start auto-update interval
     */
    private startAutoUpdate(): void {
        if (this.updateInterval) return;

        // Update every 1 second for active downloads
        this.updateInterval = window.setInterval(async () => {
            const hasActive = this.downloads.some(d =>
                d.status === DownloadStatus.DOWNLOADING || d.status === DownloadStatus.QUEUED
            );

            if (hasActive) {
                await this.loadDownloads();
                this.render();
            }
        }, 1000);
    }

    /**
     * Stop auto-update interval
     */
    private stopAutoUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Handle active tab
     */
    handleTabActive(e: Event): void {
        e.preventDefault();
        this.activeTab = 'active';
        this.render();
    }

    /**
     * Handle completed tab
     */
    handleTabCompleted(e: Event): void {
        e.preventDefault();
        this.activeTab = 'completed';
        this.render();
    }

    /**
     * Handle all tab
     */
    handleTabAll(e: Event): void {
        e.preventDefault();
        this.activeTab = 'all';
        this.render();
    }

    /**
     * Handle pause download
     */
    async handlePause(e: Event): Promise<void> {
        e.preventDefault();
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0', 10);

        try {
            await downloadManager.pauseDownload(id);
            await this.loadDownloads();
            this.render();

            logger.info('Download paused', { id }, 'downloads');

        } catch (error: any) {
            logger.error('Failed to pause download', error, { id }, 'downloads');
        }
    }

    /**
     * Handle resume download
     */
    async handleResume(e: Event): Promise<void> {
        e.preventDefault();
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0', 10);

        try {
            await downloadManager.resumeDownload(id);
            await this.loadDownloads();
            this.render();

            logger.info('Download resumed', { id }, 'downloads');

        } catch (error: any) {
            logger.error('Failed to resume download', error, { id }, 'downloads');
        }
    }

    /**
     * Handle cancel download
     */
    async handleCancel(e: Event): Promise<void> {
        e.preventDefault();
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0', 10);

        if (!confirm('Cancel this download?')) return;

        try {
            await downloadManager.cancelDownload(id);
            await this.loadDownloads();
            this.render();

            logger.info('Download cancelled', { id }, 'downloads');
            analytics.trackEvent('download_cancelled');

        } catch (error: any) {
            logger.error('Failed to cancel download', error, { id }, 'downloads');
        }
    }

    /**
     * Handle remove download
     */
    async handleRemove(e: Event): Promise<void> {
        e.preventDefault();
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0', 10);

        if (!confirm('Remove this download from the list? Files will not be deleted.')) return;

        try {
            await downloadManager.removeDownload(id, false);
            await this.loadDownloads();
            this.render();

            logger.info('Download removed', { id }, 'downloads');
            analytics.trackEvent('download_removed', { deleteFiles: false });

        } catch (error: any) {
            logger.error('Failed to remove download', error, { id }, 'downloads');
        }
    }

    /**
     * Handle remove download with files
     */
    async handleRemoveWithFiles(e: Event): Promise<void> {
        e.preventDefault();
        const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0', 10);

        if (!confirm('Remove this download and DELETE ALL FILES? This cannot be undone.')) return;

        try {
            await downloadManager.removeDownload(id, true);
            await this.loadDownloads();
            this.render();

            logger.info('Download and files removed', { id }, 'downloads');
            analytics.trackEvent('download_removed', { deleteFiles: true });

        } catch (error: any) {
            logger.error('Failed to remove download with files', error, { id }, 'downloads');
        }
    }

    /**
     * Handle priority change
     */
    async handlePriorityChange(e: Event): Promise<void> {
        const target = e.target as HTMLSelectElement;
        const id = parseInt(target.dataset.id || '0', 10);
        const priority = parseInt(target.value, 10) as DownloadPriority;

        try {
            await downloadManager.setPriority(id, priority);
            await this.loadDownloads();
            this.render();

            logger.info('Download priority changed', { id, priority }, 'downloads');
            analytics.trackEvent('download_priority_changed', { priority });

        } catch (error: any) {
            logger.error('Failed to change priority', error, { id }, 'downloads');
        }
    }

    /**
     * Handle cleanup old downloads
     */
    async handleCleanupOld(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Remove old completed downloads? (Based on cleanup settings)')) return;

        try {
            const count = await downloadManager.cleanupOldDownloads();
            await this.loadDownloads();
            this.render();

            logger.info('Old downloads cleaned up', { count }, 'downloads');
            analytics.trackEvent('downloads_cleanup', { count });

            alert(`Removed ${count} old download(s).`);

        } catch (error: any) {
            logger.error('Failed to cleanup downloads', error, undefined, 'downloads');
            alert('Cleanup failed. Please try again.');
        }
    }

    /**
     * Handle refresh stats
     */
    async handleRefreshStats(e: Event): Promise<void> {
        e.preventDefault();

        try {
            await this.loadDownloads();
            this.render();

            logger.info('Download stats refreshed', undefined, 'downloads');

        } catch (error: any) {
            logger.error('Failed to refresh stats', error, undefined, 'downloads');
        }
    }

    /**
     * Get filtered downloads based on active tab
     */
    private getFilteredDownloads(): DownloadItem[] {
        switch (this.activeTab) {
            case 'active':
                return this.downloads.filter(d =>
                    d.status === DownloadStatus.DOWNLOADING ||
                    d.status === DownloadStatus.QUEUED ||
                    d.status === DownloadStatus.PAUSED
                );
            case 'completed':
                return this.downloads.filter(d => d.status === DownloadStatus.COMPLETED);
            case 'all':
            default:
                return this.downloads;
        }
    }

    /**
     * Format bytes
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Format speed
     */
    private formatSpeed(bytesPerSec: number): string {
        return `${this.formatBytes(bytesPerSec)}/s`;
    }

    /**
     * Format ETA
     */
    private formatEta(seconds: number): string {
        if (seconds === 0 || !isFinite(seconds)) return '--';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }

    /**
     * Format priority
     */
    private formatPriority(priority: DownloadPriority): string {
        const map: Record<DownloadPriority, string> = {
            [DownloadPriority.LOW]: 'Low',
            [DownloadPriority.NORMAL]: 'Normal',
            [DownloadPriority.HIGH]: 'High',
            [DownloadPriority.CRITICAL]: 'Critical'
        };
        return map[priority] || 'Normal';
    }

    /**
     * Get status color
     */
    private getStatusColor(status: DownloadStatus): string {
        const map: Record<DownloadStatus, string> = {
            [DownloadStatus.QUEUED]: 'text-yellow-500',
            [DownloadStatus.DOWNLOADING]: 'text-blue-500',
            [DownloadStatus.PAUSED]: 'text-gray-500',
            [DownloadStatus.COMPLETED]: 'text-green-500',
            [DownloadStatus.FAILED]: 'text-red-500',
            [DownloadStatus.CANCELLED]: 'text-gray-600'
        };
        return map[status] || 'text-gray-500';
    }

    /**
     * Escape HTML
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render download item
     */
    private renderDownloadItem(download: DownloadItem): string {
        const statusColor = this.getStatusColor(download.status);

        return `
            <div class="download-item bg-gray-800 rounded-lg p-4 mb-3">
                <!-- Header -->
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0 mr-4">
                        <h3 class="text-white font-medium truncate">${this.escapeHtml(download.title)}</h3>
                        <p class="text-sm ${statusColor} capitalize">${download.status}</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2">
                        ${download.status === DownloadStatus.DOWNLOADING ? `
                            <button class="download-pause text-yellow-500 hover:text-yellow-400" data-id="${download.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </button>
                        ` : ''}

                        ${download.status === DownloadStatus.PAUSED ? `
                            <button class="download-resume text-green-500 hover:text-green-400" data-id="${download.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </button>
                        ` : ''}

                        ${download.status === DownloadStatus.DOWNLOADING || download.status === DownloadStatus.QUEUED || download.status === DownloadStatus.PAUSED ? `
                            <button class="download-cancel text-red-500 hover:text-red-400" data-id="${download.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </button>
                        ` : ''}

                        ${download.status === DownloadStatus.COMPLETED || download.status === DownloadStatus.FAILED || download.status === DownloadStatus.CANCELLED ? `
                            <button class="download-remove text-gray-500 hover:text-gray-400" data-id="${download.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Progress bar -->
                ${download.status === DownloadStatus.DOWNLOADING || download.status === DownloadStatus.QUEUED || download.status === DownloadStatus.PAUSED ? `
                    <div class="mb-3">
                        <div class="flex items-center justify-between text-sm text-gray-400 mb-1">
                            <span>${download.progress.toFixed(1)}%</span>
                            <span>${this.formatBytes(download.downloaded)} / ${this.formatBytes(download.size)}</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${download.progress}%"></div>
                        </div>
                    </div>
                ` : ''}

                <!-- Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    ${download.status === DownloadStatus.DOWNLOADING ? `
                        <div>
                            <p class="text-gray-400">Download</p>
                            <p class="text-white">${this.formatSpeed(download.downloadSpeed)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">Upload</p>
                            <p class="text-white">${this.formatSpeed(download.uploadSpeed)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">ETA</p>
                            <p class="text-white">${this.formatEta(download.eta)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">Peers</p>
                            <p class="text-white">${download.seeds}/${download.peers}</p>
                        </div>
                    ` : download.status === DownloadStatus.COMPLETED ? `
                        <div>
                            <p class="text-gray-400">Size</p>
                            <p class="text-white">${this.formatBytes(download.size)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">Ratio</p>
                            <p class="text-white">${download.ratio.toFixed(2)}</p>
                        </div>
                        <div class="col-span-2">
                            <p class="text-gray-400">Path</p>
                            <p class="text-white text-xs truncate">${this.escapeHtml(download.savePath)}</p>
                        </div>
                    ` : `
                        <div class="col-span-2">
                            <p class="text-gray-400">Status</p>
                            <p class="text-white capitalize">${download.status}</p>
                        </div>
                    `}

                    <!-- Priority selector -->
                    ${download.status === DownloadStatus.DOWNLOADING || download.status === DownloadStatus.QUEUED || download.status === DownloadStatus.PAUSED ? `
                        <div class="col-span-2 sm:col-span-1">
                            <p class="text-gray-400 mb-1">Priority</p>
                            <select class="download-priority bg-gray-700 text-white text-xs px-2 py-1 rounded w-full" data-id="${download.id}">
                                <option value="${DownloadPriority.LOW}" ${download.priority === DownloadPriority.LOW ? 'selected' : ''}>Low</option>
                                <option value="${DownloadPriority.NORMAL}" ${download.priority === DownloadPriority.NORMAL ? 'selected' : ''}>Normal</option>
                                <option value="${DownloadPriority.HIGH}" ${download.priority === DownloadPriority.HIGH ? 'selected' : ''}>High</option>
                                <option value="${DownloadPriority.CRITICAL}" ${download.priority === DownloadPriority.CRITICAL ? 'selected' : ''}>Critical</option>
                            </select>
                        </div>
                    ` : ''}
                </div>

                ${download.error ? `
                    <div class="mt-3 bg-red-900/30 border border-red-600 rounded p-2 text-sm">
                        <p class="text-red-200">${this.escapeHtml(download.error)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Template
     */
    private template(): string {
        const filteredDownloads = this.getFilteredDownloads();
        const stats = this.stats;

        return `
            <div class="downloads-view p-6 bg-gray-900 min-h-screen text-white">
                <div class="max-w-6xl mx-auto">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-2xl font-bold">Downloads</h1>
                        <button class="refresh-stats text-gray-400 hover:text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Stats -->
                    ${stats ? `
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div class="bg-gray-800 rounded-lg p-4">
                                <p class="text-gray-400 text-sm">Total Downloads</p>
                                <p class="text-2xl font-bold text-white">${stats.totalDownloads}</p>
                            </div>
                            <div class="bg-gray-800 rounded-lg p-4">
                                <p class="text-gray-400 text-sm">Active</p>
                                <p class="text-2xl font-bold text-blue-500">${stats.activeDownloads}</p>
                            </div>
                            <div class="bg-gray-800 rounded-lg p-4">
                                <p class="text-gray-400 text-sm">Completed</p>
                                <p class="text-2xl font-bold text-green-500">${stats.completedDownloads}</p>
                            </div>
                            <div class="bg-gray-800 rounded-lg p-4">
                                <p class="text-gray-400 text-sm">Storage Used</p>
                                <p class="text-2xl font-bold text-purple-500">${this.formatBytes(stats.storageUsed)}</p>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Tabs -->
                    <div class="flex gap-2 mb-6 border-b border-gray-700">
                        <button class="tab-active px-4 py-2 ${this.activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}">
                            Active
                        </button>
                        <button class="tab-completed px-4 py-2 ${this.activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}">
                            Completed
                        </button>
                        <button class="tab-all px-4 py-2 ${this.activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-white'}">
                            All
                        </button>
                    </div>

                    <!-- Downloads list -->
                    ${filteredDownloads.length > 0 ? `
                        <div class="downloads-list mb-6">
                            ${filteredDownloads.map(d => this.renderDownloadItem(d)).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-12 text-gray-400">
                            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                            <p>No downloads ${this.activeTab !== 'all' ? `in ${this.activeTab}` : ''}</p>
                        </div>
                    `}

                    <!-- Actions -->
                    <div class="flex gap-3">
                        <button class="cleanup-old bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                            Cleanup Old Downloads
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    override onDestroy(): void {
        this.stopAutoUpdate();

        logger.debug('DownloadsView destroyed', undefined, 'downloads');
        analytics.trackEvent('downloads_view_closed');
    }
}
