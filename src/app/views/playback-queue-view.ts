/**
 * Playback Queue View
 * Phase 9A UI Integration: Queue status overlay and controls
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
    private draggedIndex: number | null = null;

    constructor(options: PlaybackQueueViewOptions) {
        super(options);

        this.queue = options.queue;
        this.onReorder = options.onReorder;
        this.onRemove = options.onRemove;
        this.onShuffle = options.onShuffle;
        this.onClose = options.onClose;

        // Set up events
        (this as any).events = {
            'click .queue-shuffle': 'handleShuffle',
            'click .queue-close': 'handleClose',
            'click .queue-item-remove': 'handleRemove',
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
                        <div class="flex items-center gap-2">
                            <button class="queue-shuffle p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Shuffle queue">
                                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                </svg>
                            </button>
                            <button class="queue-close p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
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
     */
    private renderQueueItem(item: any, queueIndex: number, currentIndex: number): string {
        const isCurrent = queueIndex === currentIndex;
        const isPast = queueIndex < currentIndex;

        return `
            <div
                class="queue-item flex items-center gap-3 p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-move ${isCurrent ? 'bg-blue-900/20' : ''} ${isPast ? 'opacity-50' : ''}"
                draggable="true"
                data-index="${queueIndex}"
            >
                <!-- Drag Handle -->
                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                </svg>

                <!-- Position -->
                <div class="text-gray-500 text-sm font-mono w-8 flex-shrink-0">${queueIndex + 1}</div>

                <!-- Name -->
                <div class="flex-1 min-w-0">
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
