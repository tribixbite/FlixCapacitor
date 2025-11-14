/**
 * Playback Queue View
 * Phase 9A UI Integration: Queue status overlay and controls
 * Phase 11A: Enhanced with skip previous/next, repeat mode, clear queue, jump to
 */

import { View, type ViewOptions } from 'backbone.marionette';
import { PlaybackQueue } from '../lib/video-player';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface PlaybackQueueViewOptions extends ViewOptions<any> {
    queue: PlaybackQueue;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onRemove?: (index: number) => void;
    onShuffle?: () => void;
    onClose?: () => void;
    onSkipPrevious?: () => void; // Phase 11A
    onSkipNext?: () => void; // Phase 11A
    onRepeatMode?: (mode: 'off' | 'all' | 'one') => void; // Phase 11A
    onClearQueue?: () => void; // Phase 11A
    onJumpTo?: (index: number) => void; // Phase 11A
}

/**
 * Playback Queue Status Overlay
 * Shows current position, next file, and queue controls
 */
export class PlaybackQueueView extends View<any> {
    private queue: PlaybackQueue;
    private onReorder?: (fromIndex: number, toIndex: number) => void;
    private onRemove?: (index: number) => void;
    private onShuffle?: () => void;
    private onClose?: () => void;
    private onSkipPrevious?: () => void; // Phase 11A
    private onSkipNext?: () => void; // Phase 11A
    private onRepeatMode?: (mode: 'off' | 'all' | 'one') => void; // Phase 11A
    private onClearQueue?: () => void; // Phase 11A
    private onJumpTo?: (index: number) => void; // Phase 11A
    private draggedIndex: number | null = null;

    constructor(options: PlaybackQueueViewOptions) {
        super(options);

        this.queue = options.queue;
        this.onReorder = options.onReorder;
        this.onRemove = options.onRemove;
        this.onShuffle = options.onShuffle;
        this.onClose = options.onClose;
        this.onSkipPrevious = options.onSkipPrevious; // Phase 11A
        this.onSkipNext = options.onSkipNext; // Phase 11A
        this.onRepeatMode = options.onRepeatMode; // Phase 11A
        this.onClearQueue = options.onClearQueue; // Phase 11A
        this.onJumpTo = options.onJumpTo; // Phase 11A

        // Set up events
        (this as any).events = {
            'click .queue-shuffle': 'handleShuffle',
            'click .queue-close': 'handleClose',
            'click .queue-item-remove': 'handleRemove',
            'click .queue-skip-previous': 'handleSkipPrevious', // Phase 11A
            'click .queue-skip-next': 'handleSkipNext', // Phase 11A
            'click .queue-repeat': 'handleRepeatToggle', // Phase 11A
            'click .queue-clear': 'handleClearQueue', // Phase 11A
            'click .queue-item-jump': 'handleJumpTo', // Phase 11A
            'dragstart .queue-item': 'handleDragStart',
            'dragover .queue-item': 'handleDragOver',
            'drop .queue-item': 'handleDrop',
            'dragend .queue-item': 'handleDragEnd'
        };

        analytics.trackEvent('playback_queue_opened', {
            queueLength: this.queue.getTotalFiles()
        });
    }

    template(): string {
        const currentFile = this.queue.getCurrentFile();
        const nextFile = this.queue.getNextFile();
        const queueItems = this.queue.getQueue();
        const currentIndex = this.queue['currentIndex'];
        const isPaused = this.queue['isPaused'];
        const repeatMode = this.queue.getRepeatMode(); // Phase 11A
        const hasPrevious = this.queue.hasPrevious();
        const hasNext = this.queue.hasNext();

        // Phase 11A: Repeat mode icon and title
        const repeatIcon = repeatMode === 'one'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/><text x="12" y="15" fill="currentColor" font-size="8" text-anchor="middle">1</text>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>';
        const repeatColor = repeatMode === 'off' ? 'text-gray-400' : 'text-blue-400';
        const repeatTitle = repeatMode === 'off' ? 'Repeat: Off (click for Repeat All)'
            : repeatMode === 'all' ? 'Repeat: All (click for Repeat One)'
            : 'Repeat: One (click for Off)';

        return `
            <div class="fixed top-4 left-4 right-4 z-50 pointer-events-auto">
                <div class="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 max-w-md">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-700">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                            <span class="text-white font-semibold">Playback Queue</span>
                            <span class="text-gray-400 text-sm">(${currentIndex + 1}/${queueItems.length})</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <!-- Phase 11A: Repeat Mode Toggle -->
                            <button class="queue-repeat p-2 hover:bg-gray-800 rounded-lg transition-colors" title="${repeatTitle}">
                                <svg class="w-5 h-5 ${repeatColor} hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    ${repeatIcon}
                                </svg>
                            </button>
                            <button class="queue-shuffle p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Shuffle queue">
                                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                </svg>
                            </button>
                            <!-- Phase 11A: Clear Queue -->
                            <button class="queue-clear p-2 hover:bg-red-900/50 rounded-lg transition-colors" title="Clear queue">
                                <svg class="w-5 h-5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                            <button class="queue-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Phase 11A: Playback Controls -->
                    <div class="flex items-center justify-center gap-4 p-3 bg-gray-800/30 border-b border-gray-700">
                        <button
                            class="queue-skip-previous p-2 rounded-lg transition-colors ${hasPrevious ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'}"
                            ${!hasPrevious ? 'disabled' : ''}
                            title="Skip to previous"
                        >
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                            </svg>
                        </button>
                        <div class="text-gray-400 text-sm">
                            ${repeatMode === 'one' ? '🔂 Repeat One' : repeatMode === 'all' ? '🔁 Repeat All' : '▶️ Playing'}
                        </div>
                        <button
                            class="queue-skip-next p-2 rounded-lg transition-colors ${hasNext || repeatMode !== 'off' ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'}"
                            ${!hasNext && repeatMode === 'off' ? 'disabled' : ''}
                            title="Skip to next"
                        >
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Current File -->
                    <div class="p-4 border-b border-gray-700">
                        <div class="text-xs text-gray-400 mb-1">Now Playing</div>
                        <div class="text-white font-medium truncate">${this.escapeHtml(currentFile.name)}</div>
                        ${isPaused ? '<div class="text-yellow-400 text-xs mt-1">⏸ Queue Paused</div>' : ''}
                    </div>

                    <!-- Next File -->
                    ${nextFile ? `
                        <div class="p-4 border-b border-gray-700">
                            <div class="text-xs text-gray-400 mb-1">Up Next</div>
                            <div class="text-gray-300 truncate">${this.escapeHtml(nextFile.name)}</div>
                        </div>
                    ` : ''}

                    <!-- Queue List -->
                    <div class="max-h-64 overflow-y-auto">
                        ${queueItems.map((item: { index: number; name: string }, index: number) => this.renderQueueItem(item, index, currentIndex)).join('')}
                    </div>

                    <!-- Footer -->
                    <div class="p-3 bg-gray-800/50 text-xs text-gray-400 text-center">
                        Drag to reorder • Swipe to remove
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render individual queue item
     * Phase 11A: Made items clickable for jump-to functionality
     */
    private renderQueueItem(item: any, queueIndex: number, currentIndex: number): string {
        const isCurrent = queueIndex === currentIndex;
        const isPast = queueIndex < currentIndex;

        return `
            <div
                class="queue-item flex items-center gap-3 p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${isCurrent ? 'bg-blue-900/20 cursor-default' : 'cursor-pointer'} ${isPast ? 'opacity-50' : ''}"
                draggable="${!isCurrent}"
                data-index="${queueIndex}"
            >
                <!-- Drag Handle -->
                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                </svg>

                <!-- Position -->
                <div class="text-gray-500 text-sm font-mono w-8 flex-shrink-0">${queueIndex + 1}</div>

                <!-- Name (Phase 11A: Clickable for jump-to) -->
                <div class="flex-1 min-w-0 queue-item-jump ${!isCurrent ? 'cursor-pointer' : ''}" data-index="${queueIndex}">
                    <div class="text-sm ${isCurrent ? 'text-blue-400 font-medium' : 'text-gray-300'} truncate">
                        ${this.escapeHtml(item.name)}
                    </div>
                </div>

                <!-- Status Icon -->
                ${isCurrent ? `
                    <svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                ` : ''}

                <!-- Remove Button -->
                ${!isCurrent ? `
                    <button
                        class="queue-item-remove p-1 hover:bg-red-900/50 rounded transition-colors flex-shrink-0"
                        data-index="${queueIndex}"
                        title="Remove from queue"
                    >
                        <svg class="w-4 h-4 text-gray-500 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle shuffle button click
     */
    handleShuffle(e: Event): void {
        e.preventDefault();
        logger.info('Queue shuffle requested', undefined, 'playback');
        analytics.trackEvent('queue_shuffled');

        if (this.onShuffle) {
            this.onShuffle();
        }

        this.render();
    }

    /**
     * Handle close button click
     */
    handleClose(e: Event): void {
        e.preventDefault();
        logger.info('Queue overlay closed', undefined, 'playback');
        analytics.trackEvent('queue_closed');

        if (this.onClose) {
            this.onClose();
        }

        this.remove();
    }

    /**
     * Handle remove button click
     */
    handleRemove(e: Event): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);

        logger.info(`Removing queue item at index ${index}`, undefined, 'playback');
        analytics.trackEvent('queue_item_removed', { index });

        if (this.onRemove) {
            this.onRemove(index);
        }

        this.render();
    }

    /**
     * Handle drag start
     */
    handleDragStart(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        this.draggedIndex = parseInt(target.dataset.index || '0', 10);

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedIndex.toString());
        }

        target.classList.add('opacity-50');
        logger.debug(`Drag started from index ${this.draggedIndex}`, undefined, 'playback');
    }

    /**
     * Handle drag over
     */
    handleDragOver(e: DragEvent): void {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }

        const target = e.currentTarget as HTMLElement;
        target.classList.add('border-t-2', 'border-blue-400');
    }

    /**
     * Handle drop
     */
    handleDrop(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        target.classList.remove('border-t-2', 'border-blue-400');

        const toIndex = parseInt(target.dataset.index || '0', 10);

        if (this.draggedIndex !== null && this.draggedIndex !== toIndex) {
            logger.info(`Reordering queue: ${this.draggedIndex} → ${toIndex}`, undefined, 'playback');
            analytics.trackEvent('queue_reordered', {
                fromIndex: this.draggedIndex,
                toIndex
            });

            if (this.onReorder) {
                this.onReorder(this.draggedIndex, toIndex);
            }

            this.render();
        }

        this.draggedIndex = null;
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('opacity-50');

        // Remove drag-over styling from all items
        this.$('.queue-item').removeClass('border-t-2 border-blue-400');

        this.draggedIndex = null;
    }

    // ===== PHASE 11A: NEW QUEUE CONTROLS =====

    /**
     * Handle skip previous button click
     */
    handleSkipPrevious(e: Event): void {
        e.preventDefault();
        logger.info('Skip to previous file requested', undefined, 'playback');
        analytics.trackEvent('queue_skip_previous');

        if (this.onSkipPrevious) {
            this.onSkipPrevious();
        }

        this.render();
    }

    /**
     * Handle skip next button click
     */
    handleSkipNext(e: Event): void {
        e.preventDefault();
        logger.info('Skip to next file requested', undefined, 'playback');
        analytics.trackEvent('queue_skip_next');

        if (this.onSkipNext) {
            this.onSkipNext();
        }

        this.render();
    }

    /**
     * Handle repeat mode toggle
     */
    handleRepeatToggle(e: Event): void {
        e.preventDefault();
        const currentMode = this.queue.getRepeatMode();
        const nextMode = currentMode === 'off' ? 'all' : currentMode === 'all' ? 'one' : 'off';

        logger.info(`Repeat mode changed: ${currentMode} → ${nextMode}`, undefined, 'playback');
        analytics.trackEvent('queue_repeat_mode_changed', { mode: nextMode });

        if (this.onRepeatMode) {
            this.onRepeatMode(nextMode);
        }

        this.render();
    }

    /**
     * Handle clear queue button click
     */
    handleClearQueue(e: Event): void {
        e.preventDefault();

        // Phase 11A: Show confirmation dialog
        const confirmed = confirm(`Clear entire queue? This will remove all ${this.queue.getTotalFiles()} files from the queue and stop playback.`);

        if (!confirmed) {
            logger.info('Clear queue cancelled by user', undefined, 'playback');
            analytics.trackEvent('queue_clear_cancelled');
            return;
        }

        logger.info('Clear queue confirmed', undefined, 'playback');
        analytics.trackEvent('queue_cleared', {
            fileCount: this.queue.getTotalFiles()
        });

        if (this.onClearQueue) {
            this.onClearQueue();
        }

        // Close the queue view after clearing
        this.handleClose(e);
    }

    /**
     * Handle jump to file click
     */
    handleJumpTo(e: Event): void {
        e.preventDefault();
        e.stopPropagation(); // Prevent drag events

        const target = e.currentTarget as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);
        const currentIndex = this.queue['currentIndex'];

        // Don't jump to current file
        if (index === currentIndex) {
            return;
        }

        logger.info(`Jumping to file at index ${index}`, undefined, 'playback');
        analytics.trackEvent('queue_jump_to', { index });

        if (this.onJumpTo) {
            this.onJumpTo(index);
        }

        this.render();
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
     * Update queue display
     */
    updateQueue(): void {
        this.render();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('PlaybackQueueView destroyed', undefined, 'playback');
        analytics.trackEvent('queue_view_destroyed');
    }
}

/**
 * Create and show playback queue overlay
 */
export function showPlaybackQueue(
    queue: PlaybackQueue,
    container: HTMLElement,
    callbacks?: {
        onReorder?: (fromIndex: number, toIndex: number) => void;
        onRemove?: (index: number) => void;
        onShuffle?: () => void;
        onClose?: () => void;
        onSkipPrevious?: () => void; // Phase 11A
        onSkipNext?: () => void; // Phase 11A
        onRepeatMode?: (mode: 'off' | 'all' | 'one') => void; // Phase 11A
        onClearQueue?: () => void; // Phase 11A
        onJumpTo?: (index: number) => void; // Phase 11A
    }
): PlaybackQueueView {
    const view = new PlaybackQueueView({
        queue,
        ...callbacks
    });

    view.setElement(container);
    view.render();

    logger.info('Playback queue overlay displayed', {
        queueLength: queue.getTotalFiles()
    }, 'playback');

    return view;
}
