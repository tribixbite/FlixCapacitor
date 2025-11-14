/**
 * Download Manager Service
 * Phase 9C.3: Download torrents for offline viewing
 * Integrates with jlibtorrent for torrent downloads
 */

import { sqliteService } from './sqlite-service';
import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Download status
 */
export enum DownloadStatus {
    QUEUED = 'queued',
    DOWNLOADING = 'downloading',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

/**
 * Download priority
 */
export enum DownloadPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

/**
 * Download item
 */
export interface DownloadItem {
    id: number;
    magnetUri: string;
    title: string;
    size: number; // bytes
    downloaded: number; // bytes
    uploadedBytes: number;
    downloadSpeed: number; // bytes/sec
    uploadSpeed: number; // bytes/sec
    progress: number; // 0-100
    status: DownloadStatus;
    priority: DownloadPriority;
    savePath: string;
    createdAt: number; // Unix timestamp
    updatedAt: number;
    completedAt?: number;
    seeds: number;
    peers: number;
    ratio: number;
    eta: number; // seconds
    error?: string;
}

/**
 * Download create input
 */
export interface DownloadCreateInput {
    magnetUri: string;
    title: string;
    savePath?: string;
    priority?: DownloadPriority;
}

/**
 * Download statistics
 */
export interface DownloadStats {
    totalDownloads: number;
    activeDownloads: number;
    completedDownloads: number;
    totalDownloaded: number; // bytes
    totalUploaded: number; // bytes
    averageSpeed: number; // bytes/sec
    storageUsed: number; // bytes
}

/**
 * Download Manager configuration
 */
export interface DownloadConfig {
    maxConcurrentDownloads: number;
    maxDownloadSpeed: number; // bytes/sec (0 = unlimited)
    maxUploadSpeed: number; // bytes/sec (0 = unlimited)
    defaultSavePath: string;
    autoCleanupDays: number; // days (0 = never)
    seedRatioLimit: number; // 0 = unlimited
}

/**
 * Download Manager Service
 */
class DownloadManager {
    private downloads: Map<number, DownloadItem> = new Map();
    private initialized = false;
    private config: DownloadConfig = {
        maxConcurrentDownloads: 3,
        maxDownloadSpeed: 0, // unlimited
        maxUploadSpeed: 0, // unlimited
        defaultSavePath: '/storage/emulated/0/FlixCapacitor/Downloads',
        autoCleanupDays: 30,
        seedRatioLimit: 2.0
    };

    /**
     * Initialize download manager
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.createTables();
            await this.loadConfig();
            await this.loadDownloads();

            this.initialized = true;
            logger.info('DownloadManager initialized', undefined, 'downloads');
            analytics.trackEvent('download_manager_initialized');
        } catch (error: any) {
            logger.error('Failed to initialize DownloadManager', error, undefined, 'downloads');
            throw error;
        }
    }

    /**
     * Create database tables
     */
    private async createTables(): Promise<void> {
        // Downloads table
        await sqliteService.run(`
            CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                magnet_uri TEXT NOT NULL,
                title TEXT NOT NULL,
                size INTEGER DEFAULT 0,
                downloaded INTEGER DEFAULT 0,
                uploaded_bytes INTEGER DEFAULT 0,
                download_speed INTEGER DEFAULT 0,
                upload_speed INTEGER DEFAULT 0,
                progress INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                priority INTEGER DEFAULT 1,
                save_path TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                completed_at INTEGER,
                seeds INTEGER DEFAULT 0,
                peers INTEGER DEFAULT 0,
                ratio REAL DEFAULT 0,
                eta INTEGER DEFAULT 0,
                error TEXT
            )
        `);

        // Index for faster queries
        await sqliteService.run(`
            CREATE INDEX IF NOT EXISTS idx_downloads_status
            ON downloads(status)
        `);

        // Download config table
        await sqliteService.run(`
            CREATE TABLE IF NOT EXISTS download_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);

        logger.debug('Download tables created', undefined, 'downloads');
    }

    /**
     * Load configuration from database
     */
    private async loadConfig(): Promise<void> {
        const rows = await sqliteService.all('SELECT * FROM download_config');

        for (const row of rows) {
            const key = row.key as keyof DownloadConfig;
            const value = JSON.parse(row.value);

            if (key in this.config) {
                (this.config as any)[key] = value;
            }
        }

        logger.debug('Download config loaded', this.config, 'downloads');
    }

    /**
     * Save configuration to database
     */
    async saveConfig(updates: Partial<DownloadConfig>): Promise<void> {
        for (const [key, value] of Object.entries(updates)) {
            if (key in this.config) {
                (this.config as any)[key] = value;

                // Upsert to database
                await sqliteService.run(
                    `INSERT OR REPLACE INTO download_config (key, value) VALUES (?, ?)`,
                    [key, JSON.stringify(value)]
                );
            }
        }

        logger.info('Download config saved', updates, 'downloads');
        analytics.trackEvent('download_config_updated');
    }

    /**
     * Get current configuration
     */
    getConfig(): DownloadConfig {
        return { ...this.config };
    }

    /**
     * Load downloads from database
     */
    private async loadDownloads(): Promise<void> {
        const rows = await sqliteService.all('SELECT * FROM downloads ORDER BY created_at DESC');

        this.downloads.clear();

        for (const row of rows) {
            const download = this.mapRowToDownload(row);
            this.downloads.set(download.id, download);
        }

        logger.info('Downloads loaded', { count: this.downloads.size }, 'downloads');
    }

    /**
     * Add new download
     */
    async addDownload(input: DownloadCreateInput): Promise<DownloadItem> {
        const now = Date.now();
        const savePath = input.savePath || this.config.defaultSavePath;
        const priority = input.priority || DownloadPriority.NORMAL;

        const id = await sqliteService.insert('downloads', {
            magnet_uri: input.magnetUri,
            title: input.title,
            size: 0,
            downloaded: 0,
            uploaded_bytes: 0,
            download_speed: 0,
            upload_speed: 0,
            progress: 0,
            status: DownloadStatus.QUEUED,
            priority,
            save_path: savePath,
            created_at: now,
            updated_at: now,
            seeds: 0,
            peers: 0,
            ratio: 0,
            eta: 0
        });

        const download: DownloadItem = {
            id,
            magnetUri: input.magnetUri,
            title: input.title,
            size: 0,
            downloaded: 0,
            uploadedBytes: 0,
            downloadSpeed: 0,
            uploadSpeed: 0,
            progress: 0,
            status: DownloadStatus.QUEUED,
            priority,
            savePath,
            createdAt: now,
            updatedAt: now,
            seeds: 0,
            peers: 0,
            ratio: 0,
            eta: 0
        };

        this.downloads.set(id, download);

        logger.info(`Download added: ${input.title}`, { id }, 'downloads');
        analytics.trackEvent('download_added', { priority });

        // Start download if under concurrent limit
        await this.processQueue();

        return download;
    }

    /**
     * Get download by ID
     */
    getDownload(id: number): DownloadItem | null {
        return this.downloads.get(id) || null;
    }

    /**
     * Get all downloads
     */
    getAllDownloads(): DownloadItem[] {
        return Array.from(this.downloads.values());
    }

    /**
     * Get downloads by status
     */
    getDownloadsByStatus(status: DownloadStatus): DownloadItem[] {
        return Array.from(this.downloads.values()).filter(d => d.status === status);
    }

    /**
     * Pause download
     */
    async pauseDownload(id: number): Promise<void> {
        const download = this.downloads.get(id);
        if (!download || download.status !== DownloadStatus.DOWNLOADING) {
            return;
        }

        download.status = DownloadStatus.PAUSED;
        download.updatedAt = Date.now();

        await this.updateDownloadInDb(download);

        logger.info(`Download paused: ${download.title}`, { id }, 'downloads');
        analytics.trackEvent('download_paused');

        // TODO: Call native plugin to pause torrent
        // await TorrentStreamerPlugin.pauseDownload({ id });
    }

    /**
     * Resume download
     */
    async resumeDownload(id: number): Promise<void> {
        const download = this.downloads.get(id);
        if (!download || download.status !== DownloadStatus.PAUSED) {
            return;
        }

        download.status = DownloadStatus.QUEUED;
        download.updatedAt = Date.now();

        await this.updateDownloadInDb(download);

        logger.info(`Download resumed: ${download.title}`, { id }, 'downloads');
        analytics.trackEvent('download_resumed');

        await this.processQueue();
    }

    /**
     * Cancel download
     */
    async cancelDownload(id: number): Promise<void> {
        const download = this.downloads.get(id);
        if (!download) return;

        download.status = DownloadStatus.CANCELLED;
        download.updatedAt = Date.now();

        await this.updateDownloadInDb(download);

        logger.info(`Download cancelled: ${download.title}`, { id }, 'downloads');
        analytics.trackEvent('download_cancelled');

        // TODO: Call native plugin to stop and remove torrent
        // await TorrentStreamerPlugin.cancelDownload({ id });

        await this.processQueue();
    }

    /**
     * Remove download (delete from database and disk)
     */
    async removeDownload(id: number, deleteFiles: boolean = false): Promise<void> {
        const download = this.downloads.get(id);
        if (!download) return;

        // Cancel if downloading
        if (download.status === DownloadStatus.DOWNLOADING) {
            await this.cancelDownload(id);
        }

        // Delete files if requested
        if (deleteFiles) {
            // TODO: Call native plugin to delete files
            // await TorrentStreamerPlugin.deleteDownload({ id });
        }

        // Remove from database
        await sqliteService.delete('downloads', 'id = ?', [id]);

        // Remove from memory
        this.downloads.delete(id);

        logger.info(`Download removed: ${download.title}`, { id, deleteFiles }, 'downloads');
        analytics.trackEvent('download_removed', { deleteFiles });
    }

    /**
     * Update download progress
     */
    async updateProgress(id: number, progress: Partial<DownloadItem>): Promise<void> {
        const download = this.downloads.get(id);
        if (!download) return;

        // Update fields
        Object.assign(download, progress);
        download.updatedAt = Date.now();

        // Calculate ratio
        if (download.downloaded > 0) {
            download.ratio = download.uploadedBytes / download.downloaded;
        }

        // Mark as completed if progress is 100%
        if (download.progress >= 100 && download.status === DownloadStatus.DOWNLOADING) {
            download.status = DownloadStatus.COMPLETED;
            download.completedAt = Date.now();

            logger.info(`Download completed: ${download.title}`, { id }, 'downloads');
            analytics.trackEvent('download_completed', {
                size: download.size,
                duration: download.completedAt - download.createdAt
            });

            // Check if should continue seeding based on ratio limit
            if (this.config.seedRatioLimit > 0 && download.ratio >= this.config.seedRatioLimit) {
                // Stop seeding
                // TODO: Call native plugin
                // await TorrentStreamerPlugin.stopSeeding({ id });
            }
        }

        await this.updateDownloadInDb(download);
    }

    /**
     * Set download priority
     */
    async setPriority(id: number, priority: DownloadPriority): Promise<void> {
        const download = this.downloads.get(id);
        if (!download) return;

        download.priority = priority;
        download.updatedAt = Date.now();

        await this.updateDownloadInDb(download);

        logger.info(`Download priority changed: ${download.title}`, { id, priority }, 'downloads');
        analytics.trackEvent('download_priority_changed', { priority });

        // Re-process queue to respect new priority
        await this.processQueue();
    }

    /**
     * Process download queue
     */
    private async processQueue(): Promise<void> {
        const activeDownloads = this.getDownloadsByStatus(DownloadStatus.DOWNLOADING);

        if (activeDownloads.length >= this.config.maxConcurrentDownloads) {
            return;
        }

        // Get queued downloads sorted by priority
        const queuedDownloads = this.getDownloadsByStatus(DownloadStatus.QUEUED)
            .sort((a, b) => b.priority - a.priority);

        const slotsAvailable = this.config.maxConcurrentDownloads - activeDownloads.length;
        const toStart = queuedDownloads.slice(0, slotsAvailable);

        for (const download of toStart) {
            await this.startDownload(download.id);
        }
    }

    /**
     * Start download
     */
    private async startDownload(id: number): Promise<void> {
        const download = this.downloads.get(id);
        if (!download) return;

        download.status = DownloadStatus.DOWNLOADING;
        download.updatedAt = Date.now();

        await this.updateDownloadInDb(download);

        logger.info(`Download started: ${download.title}`, { id }, 'downloads');
        analytics.trackEvent('download_started');

        // TODO: Call native plugin to start download
        // await TorrentStreamerPlugin.startDownload({
        //     id,
        //     magnetUri: download.magnetUri,
        //     savePath: download.savePath,
        //     maxDownloadSpeed: this.config.maxDownloadSpeed,
        //     maxUploadSpeed: this.config.maxUploadSpeed
        // });
    }

    /**
     * Get download statistics
     */
    async getStats(): Promise<DownloadStats> {
        const all = this.getAllDownloads();
        const active = this.getDownloadsByStatus(DownloadStatus.DOWNLOADING);
        const completed = this.getDownloadsByStatus(DownloadStatus.COMPLETED);

        const totalDownloaded = all.reduce((sum, d) => sum + d.downloaded, 0);
        const totalUploaded = all.reduce((sum, d) => sum + d.uploadedBytes, 0);
        const averageSpeed = active.reduce((sum, d) => sum + d.downloadSpeed, 0) / (active.length || 1);

        // Calculate storage used (completed downloads only)
        const storageUsed = completed.reduce((sum, d) => sum + d.size, 0);

        return {
            totalDownloads: all.length,
            activeDownloads: active.length,
            completedDownloads: completed.length,
            totalDownloaded,
            totalUploaded,
            averageSpeed,
            storageUsed
        };
    }

    /**
     * Auto cleanup old downloads
     */
    async cleanupOldDownloads(): Promise<number> {
        if (this.config.autoCleanupDays === 0) return 0;

        const cutoffDate = Date.now() - (this.config.autoCleanupDays * 24 * 60 * 60 * 1000);
        const completed = this.getDownloadsByStatus(DownloadStatus.COMPLETED);

        let cleanedCount = 0;

        for (const download of completed) {
            if (download.completedAt && download.completedAt < cutoffDate) {
                await this.removeDownload(download.id, true);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info('Old downloads cleaned up', { count: cleanedCount }, 'downloads');
            analytics.trackEvent('downloads_cleanup', { count: cleanedCount });
        }

        return cleanedCount;
    }

    /**
     * Update download in database
     */
    private async updateDownloadInDb(download: DownloadItem): Promise<void> {
        await sqliteService.update('downloads', {
            size: download.size,
            downloaded: download.downloaded,
            uploaded_bytes: download.uploadedBytes,
            download_speed: download.downloadSpeed,
            upload_speed: download.uploadSpeed,
            progress: download.progress,
            status: download.status,
            priority: download.priority,
            updated_at: download.updatedAt,
            completed_at: download.completedAt || null,
            seeds: download.seeds,
            peers: download.peers,
            ratio: download.ratio,
            eta: download.eta,
            error: download.error || null
        }, 'id = ?', [download.id]);
    }

    /**
     * Map database row to DownloadItem
     */
    private mapRowToDownload(row: any): DownloadItem {
        return {
            id: row.id,
            magnetUri: row.magnet_uri,
            title: row.title,
            size: row.size,
            downloaded: row.downloaded,
            uploadedBytes: row.uploaded_bytes,
            downloadSpeed: row.download_speed,
            uploadSpeed: row.upload_speed,
            progress: row.progress,
            status: row.status as DownloadStatus,
            priority: row.priority as DownloadPriority,
            savePath: row.save_path,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            completedAt: row.completed_at,
            seeds: row.seeds,
            peers: row.peers,
            ratio: row.ratio,
            eta: row.eta,
            error: row.error
        };
    }
}

/**
 * Export singleton instance
 */
export const downloadManager = new DownloadManager();
