/**
 * Enhanced Library Scanner
 * Phase 9A.2: Background scanning, incremental updates, detailed progress
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import sqliteService from './sqlite-service';

export interface ScanProgress {
    phase: 'discovery' | 'processing' | 'metadata' | 'complete';
    currentFile: string;
    filesFound: number;
    filesProcessed: number;
    filesTotal: number | null;
    foldersScanned: number;
    foldersTotal: number;
    bytesProcessed: number;
    bytesTotal: number;
    startTime: number;
    elapsedMs: number;
    estimatedRemainingMs: number | null;
    canCancel: boolean;
}

export interface IncrementalScanResult {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
    errors: Array<{ file?: string; folder?: string; error: string }>;
}

export interface FolderScanState {
    folder_path: string;
    last_scan_time: number;
    files_count: number;
    last_modified_max: number; // Track newest file modification time
}

type ProgressCallback = (progress: ScanProgress) => void;

export class EnhancedLibraryScanner {
    private cancelled: boolean = false;
    private scanStartTime: number = 0;
    private progressCallback: ProgressCallback | null = null;
    private currentScanId: number | null = null;

    /**
     * Initialize scanner database tables
     */
    async initialize(): Promise<void> {
        // Create folder_scan_state table for incremental scanning
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS folder_scan_state (
                folder_path TEXT PRIMARY KEY,
                last_scan_time INTEGER NOT NULL,
                files_count INTEGER NOT NULL,
                last_modified_max INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `;

        await sqliteService.run(createTableSQL);
        console.log('Enhanced library scanner initialized');
    }

    /**
     * Perform incremental scan (only process changed files)
     * @param folderPaths Folders to scan
     * @param forceFullScan Force full scan even if incremental possible
     * @param progressCallback Progress updates
     */
    async incrementalScan(
        folderPaths: string[],
        forceFullScan: boolean = false,
        progressCallback: ProgressCallback | null = null
    ): Promise<IncrementalScanResult> {
        this.cancelled = false;
        this.scanStartTime = Date.now();
        this.progressCallback = progressCallback;

        // Create scan history entry
        this.currentScanId = await sqliteService.insert('scan_history', {
            scan_type: forceFullScan ? 'full' : 'incremental',
            folders_scanned: JSON.stringify(folderPaths),
            items_found: 0,
            items_matched: 0,
            start_time: Math.floor(this.scanStartTime / 1000),
            status: 'running'
        });

        const result: IncrementalScanResult = {
            added: 0,
            updated: 0,
            removed: 0,
            unchanged: 0,
            errors: []
        };

        try {
            // Get previous scan state
            const previousStates = new Map<string, FolderScanState>();
            if (!forceFullScan) {
                for (const folderPath of folderPaths) {
                    const state = await this.getFolderScanState(folderPath);
                    if (state) {
                        previousStates.set(folderPath, state);
                    }
                }
            }

            const progress: ScanProgress = {
                phase: 'discovery',
                currentFile: '',
                filesFound: 0,
                filesProcessed: 0,
                filesTotal: null,
                foldersScanned: 0,
                foldersTotal: folderPaths.length,
                bytesProcessed: 0,
                bytesTotal: 0,
                startTime: this.scanStartTime,
                elapsedMs: 0,
                estimatedRemainingMs: null,
                canCancel: true
            };

            this.reportProgress(progress);

            // Phase 1: Discovery - find all files
            const allFiles = new Map<string, any>();
            const currentMaxModified = new Map<string, number>();

            for (const folderPath of folderPaths) {
                if (this.cancelled) break;

                progress.foldersScanned++;
                const previousState = previousStates.get(folderPath);

                // Check if we can skip this folder
                if (previousState && !forceFullScan) {
                    // Check if folder has been modified since last scan
                    const quickCheck = await this.quickFolderCheck(folderPath, previousState);
                    if (!quickCheck.hasChanges) {
                        console.log(`Skipping unchanged folder: ${folderPath}`);
                        result.unchanged += quickCheck.fileCount;
                        this.reportProgress(progress);
                        continue;
                    }
                }

                // Scan folder
                try {
                    const files = await this.discoverFiles(folderPath, progress);
                    files.forEach(file => {
                        allFiles.set(file.path, file);

                        // Track max modification time per folder
                        const folderKey = this.getFolderKey(file.path, folderPath);
                        const currentMax = currentMaxModified.get(folderKey) || 0;
                        if (file.modified > currentMax) {
                            currentMaxModified.set(folderKey, file.modified);
                        }
                    });

                    progress.filesTotal = allFiles.size;
                    this.reportProgress(progress);
                } catch (error: any) {
                    result.errors.push({ folder: folderPath, error: error.message });
                }
            }

            if (this.cancelled) {
                await this.finalizeScan('cancelled', result);
                return result;
            }

            // Phase 2: Processing - determine what changed
            progress.phase = 'processing';
            progress.filesTotal = allFiles.size;
            this.reportProgress(progress);

            // Get existing files from database
            const existingFiles = await sqliteService.query(
                'SELECT file_path, last_modified FROM local_media'
            );
            const existingMap = new Map<string, number>();
            existingFiles.forEach((f: any) => existingMap.set(f.file_path, f.last_modified));

            // Determine actions needed
            const toAdd: any[] = [];
            const toUpdate: any[] = [];
            const toRemove: string[] = [];

            // Check for new and updated files
            for (const [path, file] of allFiles.entries()) {
                if (this.cancelled) break;

                const existingModified = existingMap.get(path);
                if (existingModified === undefined) {
                    // New file
                    toAdd.push(file);
                } else if (file.modified > existingModified) {
                    // Updated file
                    toUpdate.push(file);
                } else {
                    // Unchanged file
                    result.unchanged++;
                }

                existingMap.delete(path); // Mark as seen
            }

            // Remaining files in existingMap were removed from filesystem
            toRemove.push(...existingMap.keys());

            if (this.cancelled) {
                await this.finalizeScan('cancelled', result);
                return result;
            }

            // Phase 3: Apply changes
            progress.phase = 'metadata';
            progress.filesTotal = toAdd.length + toUpdate.length + toRemove.length;
            this.reportProgress(progress);

            // Add new files
            for (const file of toAdd) {
                if (this.cancelled) break;

                progress.currentFile = file.name;
                progress.filesProcessed++;
                progress.bytesProcessed += file.size;

                try {
                    await this.addFileToLibrary(file);
                    result.added++;
                } catch (error: any) {
                    result.errors.push({ file: file.path, error: error.message });
                }

                this.reportProgress(progress);
            }

            // Update modified files
            for (const file of toUpdate) {
                if (this.cancelled) break;

                progress.currentFile = file.name;
                progress.filesProcessed++;
                progress.bytesProcessed += file.size;

                try {
                    await this.updateFileInLibrary(file);
                    result.updated++;
                } catch (error: any) {
                    result.errors.push({ file: file.path, error: error.message });
                }

                this.reportProgress(progress);
            }

            // Remove deleted files
            for (const filePath of toRemove) {
                if (this.cancelled) break;

                progress.filesProcessed++;

                try {
                    await sqliteService.delete('local_media', 'file_path = ?', [filePath]);
                    result.removed++;
                } catch (error: any) {
                    result.errors.push({ file: filePath, error: error.message });
                }

                this.reportProgress(progress);
            }

            // Update folder scan states
            for (const [folderPath, maxModified] of currentMaxModified.entries()) {
                await this.updateFolderScanState(folderPath, allFiles.size, maxModified);
            }

            // Phase 4: Complete
            progress.phase = 'complete';
            progress.filesProcessed = progress.filesTotal || 0;
            progress.canCancel = false;
            this.reportProgress(progress);

            await this.finalizeScan(this.cancelled ? 'cancelled' : 'completed', result);
            return result;

        } catch (error) {
            await this.finalizeScan('error', result);
            throw error;
        }
    }

    /**
     * Quick check if folder has changes since last scan
     */
    private async quickFolderCheck(
        folderPath: string,
        previousState: FolderScanState
    ): Promise<{ hasChanges: boolean; fileCount: number }> {
        try {
            // Count files and get newest modification time
            const stats = await this.getFolderStats(folderPath);

            // Check if file count changed or newest file is newer than last scan
            const hasChanges =
                stats.fileCount !== previousState.files_count ||
                stats.maxModified > previousState.last_modified_max;

            return { hasChanges, fileCount: stats.fileCount };
        } catch (error) {
            // If check fails, assume changes exist
            return { hasChanges: true, fileCount: 0 };
        }
    }

    /**
     * Get folder statistics for incremental scanning
     */
    private async getFolderStats(
        folderPath: string
    ): Promise<{ fileCount: number; maxModified: number }> {
        const videoExtensions = [
            '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
            '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ogv'
        ];

        let fileCount = 0;
        let maxModified = 0;

        const scanRecursive = async (path: string) => {
            const result = await Filesystem.readdir({
                path,
                directory: Directory.ExternalStorage
            });

            for (const item of result.files) {
                const itemPath = `${path}/${item.name}`;

                if (item.type === 'directory') {
                    await scanRecursive(itemPath);
                } else {
                    const ext = '.' + item.name.split('.').pop()!.toLowerCase();
                    if (videoExtensions.includes(ext)) {
                        fileCount++;
                        const modified = item.mtime || 0;
                        if (modified > maxModified) {
                            maxModified = modified;
                        }
                    }
                }
            }
        };

        await scanRecursive(folderPath);
        return { fileCount, maxModified };
    }

    /**
     * Discover all video files in folder
     */
    private async discoverFiles(
        folderPath: string,
        progress: ScanProgress
    ): Promise<any[]> {
        const files: any[] = [];
        const videoExtensions = [
            '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
            '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ogv'
        ];

        const scanRecursive = async (path: string) => {
            if (this.cancelled) return;

            try {
                const result = await Filesystem.readdir({
                    path,
                    directory: Directory.ExternalStorage
                });

                for (const item of result.files) {
                    if (this.cancelled) break;

                    const itemPath = `${path}/${item.name}`;

                    if (item.type === 'directory') {
                        await scanRecursive(itemPath);
                    } else {
                        const ext = '.' + item.name.split('.').pop()!.toLowerCase();
                        if (videoExtensions.includes(ext)) {
                            const file = {
                                path: itemPath,
                                name: item.name,
                                size: item.size || 0,
                                modified: item.mtime || Math.floor(Date.now() / 1000)
                            };

                            files.push(file);
                            progress.filesFound++;
                            progress.currentFile = item.name;
                            progress.bytesTotal += file.size;

                            this.reportProgress(progress);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error scanning:', path, error);
            }
        };

        await scanRecursive(folderPath);
        return files;
    }

    /**
     * Add file to library (placeholder - would use existing addMediaFile logic)
     */
    private async addFileToLibrary(file: any): Promise<void> {
        // TODO: Integrate with existing libraryService.addMediaFile()
        // For now, simple insert
        await sqliteService.insert('local_media', {
            file_path: file.path,
            file_size: file.size,
            media_type: 'other',
            title: file.name,
            last_modified: file.modified
        });
    }

    /**
     * Update file in library
     */
    private async updateFileInLibrary(file: any): Promise<void> {
        await sqliteService.update(
            'local_media',
            {
                file_size: file.size,
                last_modified: file.modified
            },
            'file_path = ?',
            [file.path]
        );
    }

    /**
     * Get folder scan state
     */
    private async getFolderScanState(folderPath: string): Promise<FolderScanState | null> {
        const state = await sqliteService.findOne(
            'folder_scan_state',
            'folder_path = ?',
            [folderPath]
        );
        return state as FolderScanState | null;
    }

    /**
     * Update folder scan state
     */
    private async updateFolderScanState(
        folderPath: string,
        filesCount: number,
        maxModified: number
    ): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        const existing = await this.getFolderScanState(folderPath);

        if (existing) {
            await sqliteService.update(
                'folder_scan_state',
                {
                    last_scan_time: now,
                    files_count: filesCount,
                    last_modified_max: maxModified,
                    updated_at: now
                },
                'folder_path = ?',
                [folderPath]
            );
        } else {
            await sqliteService.insert('folder_scan_state', {
                folder_path: folderPath,
                last_scan_time: now,
                files_count: filesCount,
                last_modified_max: maxModified,
                created_at: now,
                updated_at: now
            });
        }
    }

    /**
     * Get folder key for tracking
     */
    private getFolderKey(filePath: string, rootFolder: string): string {
        return rootFolder;
    }

    /**
     * Report progress to callback
     */
    private reportProgress(progress: ScanProgress): void {
        progress.elapsedMs = Date.now() - this.scanStartTime;

        // Calculate ETA if processing phase
        if (progress.phase === 'processing' || progress.phase === 'metadata') {
            if (progress.filesProcessed > 0 && progress.filesTotal) {
                const msPerFile = progress.elapsedMs / progress.filesProcessed;
                const remainingFiles = progress.filesTotal - progress.filesProcessed;
                progress.estimatedRemainingMs = Math.round(msPerFile * remainingFiles);
            }
        }

        if (this.progressCallback) {
            this.progressCallback(progress);
        }
    }

    /**
     * Finalize scan and update history
     */
    private async finalizeScan(
        status: 'running' | 'completed' | 'cancelled' | 'error',
        result: IncrementalScanResult
    ): Promise<void> {
        if (this.currentScanId !== null) {
            await sqliteService.update(
                'scan_history',
                {
                    items_found: result.added + result.updated + result.unchanged,
                    items_matched: result.added + result.updated,
                    end_time: Math.floor(Date.now() / 1000),
                    status
                },
                'scan_id = ?',
                [this.currentScanId]
            );
        }

        this.currentScanId = null;
    }

    /**
     * Cancel ongoing scan
     */
    cancel(): void {
        this.cancelled = true;
        console.log('Scan cancellation requested');
    }

    /**
     * Check if scan is cancelled
     */
    isCancelled(): boolean {
        return this.cancelled;
    }
}

// Export singleton
export const enhancedScanner = new EnhancedLibraryScanner();
