/**
 * Library Scan Progress View
 * Phase 9A UI Integration: Progress bar with 4-phase tracking and cancellation
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { type ScanProgress, type IncrementalScanResult, enhancedScanner } from '../lib/library-scanner-enhanced';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface LibraryScanProgressViewOptions extends ViewOptions<any> {
    onComplete?: (result: IncrementalScanResult) => void;
    onCancel?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Library Scan Progress Overlay
 * Shows 4-phase progress tracking, ETA, file counts, and cancellation button
 */
export class LibraryScanProgressView extends View<any> {
    private onComplete?: (result: IncrementalScanResult) => void;
    private onCancel?: () => void;
    private onError?: (error: Error) => void;
    private currentProgress: ScanProgress | null = null;
    private scanActive: boolean = false;

    constructor(options: LibraryScanProgressViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.onComplete = options.onComplete;
        this.onCancel = options.onCancel;
        this.onError = options.onError;

        // Set up events
        (this as any).events = {
            'click .scan-cancel': 'handleCancel'
        };

        analytics.trackEvent('library_scan_progress_opened');
    }

    template(): string {
        if (!this.currentProgress) {
            return this.renderInitializing();
        }

        const percentage = this.calculatePercentage(this.currentProgress);
        const phaseLabel = this.getPhaseLabel(this.currentProgress.phase);
        const eta = this.formatETA(this.currentProgress.estimatedRemainingMs);
        const elapsed = this.formatDuration(this.currentProgress.elapsedMs);

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-lg w-full">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-6 h-6 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            <div>
                                <div class="text-white font-semibold">Scanning Library</div>
                                <div class="text-gray-400 text-sm">${phaseLabel}</div>
                            </div>
                        </div>
                        <div class="text-blue-400 font-mono text-lg">${percentage}%</div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="p-6 space-y-4">
                        <div class="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                            <div
                                class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out rounded-full"
                                style="width: ${percentage}%"
                            ></div>
                        </div>

                        <!-- Current File -->
                        ${this.currentProgress.currentFile ? `
                            <div class="text-sm">
                                <div class="text-gray-400 mb-1">Processing:</div>
                                <div class="text-white truncate font-mono text-xs">${this.escapeHtml(this.currentProgress.currentFile)}</div>
                            </div>
                        ` : ''}

                        <!-- Statistics Grid -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Files Found -->
                            <div class="bg-gray-800/50 rounded-lg p-3">
                                <div class="text-gray-400 text-xs mb-1">Files Found</div>
                                <div class="text-white font-semibold">${this.currentProgress.filesFound.toLocaleString()}</div>
                            </div>

                            <!-- Files Processed -->
                            <div class="bg-gray-800/50 rounded-lg p-3">
                                <div class="text-gray-400 text-xs mb-1">Processed</div>
                                <div class="text-white font-semibold">
                                    ${this.currentProgress.filesProcessed.toLocaleString()}${this.currentProgress.filesTotal ? `/${this.currentProgress.filesTotal.toLocaleString()}` : ''}
                                </div>
                            </div>

                            <!-- Folders Scanned -->
                            <div class="bg-gray-800/50 rounded-lg p-3">
                                <div class="text-gray-400 text-xs mb-1">Folders</div>
                                <div class="text-white font-semibold">${this.currentProgress.foldersScanned}/${this.currentProgress.foldersTotal}</div>
                            </div>

                            <!-- Data Processed -->
                            <div class="bg-gray-800/50 rounded-lg p-3">
                                <div class="text-gray-400 text-xs mb-1">Data Size</div>
                                <div class="text-white font-semibold">${this.formatBytes(this.currentProgress.bytesProcessed)}</div>
                            </div>
                        </div>

                        <!-- Time Information -->
                        <div class="flex items-center justify-between text-sm">
                            <div class="text-gray-400">
                                <span class="text-gray-500">Elapsed:</span> ${elapsed}
                            </div>
                            ${eta ? `
                                <div class="text-gray-400">
                                    <span class="text-gray-500">ETA:</span> ${eta}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-4 bg-gray-800/30 border-t border-gray-700">
                        <div class="text-xs text-gray-500">
                            ${this.getPhaseDescription(this.currentProgress.phase)}
                        </div>
                        ${this.currentProgress.canCancel ? `
                            <button class="scan-cancel px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                                Cancel Scan
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render initializing state
     */
    private renderInitializing(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto modal-overlay-safe">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-lg w-full p-8 text-center">
                    <svg class="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <div class="text-white font-semibold text-lg mb-2">Initializing Scan...</div>
                    <div class="text-gray-400 text-sm">Preparing to scan library folders</div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate progress percentage
     */
    private calculatePercentage(progress: ScanProgress): number {
        const phaseWeights = {
            discovery: 0.25,
            processing: 0.25,
            metadata: 0.45,
            complete: 1.0
        };

        if (progress.phase === 'complete') {
            return 100;
        }

        let baseProgress = 0;
        if (progress.phase === 'processing') baseProgress = 25;
        if (progress.phase === 'metadata') baseProgress = 50;

        let phaseProgress = 0;
        if (progress.phase === 'discovery') {
            // Use folders scanned for discovery phase
            if (progress.foldersTotal > 0) {
                phaseProgress = (progress.foldersScanned / progress.foldersTotal) * 25;
            }
        } else if (progress.filesTotal && progress.filesTotal > 0) {
            // Use files processed for processing/metadata phases
            const phasePercentage = (progress.filesProcessed / progress.filesTotal);
            if (progress.phase === 'processing') {
                phaseProgress = phasePercentage * 25;
            } else if (progress.phase === 'metadata') {
                phaseProgress = phasePercentage * 45;
            }
        }

        return Math.min(100, Math.round(baseProgress + phaseProgress));
    }

    /**
     * Get human-readable phase label
     */
    private getPhaseLabel(phase: ScanProgress['phase']): string {
        const labels = {
            discovery: 'Phase 1 of 4: Discovering Files',
            processing: 'Phase 2 of 4: Analyzing Changes',
            metadata: 'Phase 3 of 4: Updating Library',
            complete: 'Phase 4 of 4: Complete'
        };
        return labels[phase];
    }

    /**
     * Get phase description
     */
    private getPhaseDescription(phase: ScanProgress['phase']): string {
        const descriptions = {
            discovery: 'Scanning folders and discovering video files...',
            processing: 'Determining which files are new or modified...',
            metadata: 'Fetching metadata and updating database...',
            complete: 'Library scan complete!'
        };
        return descriptions[phase];
    }

    /**
     * Format ETA in human-readable form
     */
    private formatETA(ms: number | null): string {
        if (!ms || ms <= 0) return '';

        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    /**
     * Format duration in human-readable form
     */
    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    /**
     * Format bytes to human-readable size
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
     * Update progress and re-render
     */
    updateProgress(progress: ScanProgress): void {
        this.currentProgress = progress;
        this.render();

        // Track analytics for phase changes
        if (progress.phase === 'complete') {
            analytics.trackEvent('library_scan_completed', {
                filesFound: progress.filesFound,
                filesProcessed: progress.filesProcessed,
                elapsedMs: progress.elapsedMs,
                foldersScanned: progress.foldersScanned
            });
        }
    }

    /**
     * Start scan with provided folders
     */
    async startScan(folderPaths: string[], forceFullScan: boolean = false): Promise<void> {
        if (this.scanActive) {
            logger.warn('Scan already in progress', undefined, 'library');
            return;
        }

        this.scanActive = true;
        logger.info(`Starting library scan for ${folderPaths.length} folders`, {
            folderPaths,
            forceFullScan
        }, 'library');

        analytics.trackEvent('library_scan_started', {
            folderCount: folderPaths.length,
            forceFullScan
        });

        try {
            // Initialize scanner if needed
            await enhancedScanner.initialize();

            // Render initializing state
            this.render();

            // Start scan with progress callback
            const result = await enhancedScanner.incrementalScan(
                folderPaths,
                forceFullScan,
                (progress: ScanProgress) => this.updateProgress(progress)
            );

            // Mark as complete
            const completeProgress: ScanProgress = {
                ...(this.currentProgress || {} as ScanProgress),
                phase: 'complete',
                canCancel: false
            };
            this.updateProgress(completeProgress);

            logger.info('Library scan completed', {
                added: result.added,
                updated: result.updated,
                removed: result.removed,
                unchanged: result.unchanged,
                errors: result.errors.length
            }, 'library');

            analytics.trackEvent('library_scan_result', {
                added: result.added,
                updated: result.updated,
                removed: result.removed,
                unchanged: result.unchanged,
                errorCount: result.errors.length
            });

            // Call completion callback after brief delay to show 100%
            setTimeout(() => {
                if (this.onComplete) {
                    this.onComplete(result);
                }
                this.scanActive = false;
            }, 1500);

        } catch (error: any) {
            logger.error('Library scan failed', error, undefined, 'library');
            analytics.trackEvent('library_scan_error', {
                error: error.message
            });

            if (this.onError) {
                this.onError(error);
            }
            this.scanActive = false;
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel(e: Event): void {
        e.preventDefault();

        logger.info('Library scan cancellation requested', undefined, 'library');
        analytics.trackEvent('library_scan_cancelled', {
            phase: this.currentProgress?.phase,
            filesProcessed: this.currentProgress?.filesProcessed,
            elapsedMs: this.currentProgress?.elapsedMs
        });

        enhancedScanner.cancel();

        if (this.onCancel) {
            this.onCancel();
        }

        // Update UI to show cancelling state
        if (this.currentProgress) {
            this.currentProgress.canCancel = false;
            this.render();
        }
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('LibraryScanProgressView destroyed', undefined, 'library');
        analytics.trackEvent('library_scan_view_destroyed');
    }
}

/**
 * Show library scan progress overlay
 */
export function showLibraryScanProgress(
    container: HTMLElement,
    folderPaths: string[],
    forceFullScan: boolean = false,
    callbacks?: {
        onComplete?: (result: IncrementalScanResult) => void;
        onCancel?: () => void;
        onError?: (error: Error) => void;
    }
): LibraryScanProgressView {
    const view = new LibraryScanProgressView({
        ...callbacks
    });

    view.setElement(container);
    view.render();

    // Start the scan
    view.startScan(folderPaths, forceFullScan);

    logger.info('Library scan progress overlay displayed', {
        folderCount: folderPaths.length,
        forceFullScan
    }, 'library');

    return view;
}
