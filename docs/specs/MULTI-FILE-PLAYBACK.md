# Multi-File Playback Queue Specification

**Document Version:** 1.0.0
**Last Updated:** 2025-11-13
**Status:** Production Ready
**Commit:** 939a0a26

## Overview

Multi-file playback queue enables seamless sequential playback of multiple video files from a single torrent, solving the common use case of binge-watching TV show episodes or lecture series. Users select multiple files from the file picker, and the app automatically transitions between files without manual intervention.

### User Value Proposition

**Before:** Users had to manually select and play each episode/file individually
**After:** Select all desired episodes once, sit back and watch continuously

### Use Cases

1. **TV Show Marathons** - Select all episodes of a season, auto-play through them
2. **Educational Content** - Queue multiple lectures from a course torrent
3. **Movie Collections** - Play multiple short films or episodes in sequence
4. **Conference Videos** - Watch all talks from a conference torrent pack

## Requirements

### Functional Requirements

1. **FR-1:** File picker SHALL allow multiple file selection via checkboxes
2. **FR-2:** File picker SHALL display "Play N Files" button when N > 1 selected
3. **FR-3:** Video player SHALL create PlaybackQueue when multiple files selected
4. **FR-4:** Video player SHALL automatically start next file when current file ends
5. **FR-5:** Queue UI SHALL display current position (X of Y) and next file name
6. **FR-6:** Queue SHALL clear and hide UI after last file completes
7. **FR-7:** Users SHALL be able to skip to next file manually (optional, future)
8. **FR-8:** Queue SHALL persist if app is backgrounded (service keeps streaming)

### Non-Functional Requirements

1. **NFR-1:** Transition between files SHALL complete within 5 seconds
2. **NFR-2:** Queue UI SHALL not obstruct video content
3. **NFR-3:** Memory overhead SHALL be < 10 MB per queue item
4. **NFR-4:** Queue SHALL support up to 100 files without performance degradation
5. **NFR-5:** TypeScript strict mode SHALL have zero errors in queue implementation

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  VideoPlayer (video-player.ts)              │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PlaybackQueue Class                                   │ │
│  │                                                         │ │
│  │  private files: TorrentFile[]                          │ │
│  │  private currentIndex: number                          │ │
│  │  private movie: Movie                                  │ │
│  │  private torrent: Torrent                              │ │
│  │                                                         │ │
│  │  + hasNext(): boolean                                  │ │
│  │  + playNext(): void                                    │ │
│  │  + getCurrentFile(): TorrentFile                       │ │
│  │  + getNextFile(): TorrentFile | null                   │ │
│  │  + getTotalFiles(): number                             │ │
│  │  + getCurrentPosition(): number                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Video Element Event Handlers                          │ │
│  │                                                         │ │
│  │  video.on('loadedmetadata') → updateQueueStatusUI()   │ │
│  │  video.on('ended') → handleVideoEnded()               │ │
│  │  video.on('error') → handleVideoError()               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Queue Status UI Overlay                               │ │
│  │                                                         │ │
│  │  <div class="queue-status-overlay">                    │ │
│  │    <div>Playing: filename.mp4 (1/10)</div>            │ │
│  │    <div>Next: nextfile.mp4</div>                      │ │
│  │  </div>                                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Structures

#### PlaybackQueue Class

```typescript
/**
 * PlaybackQueue - Manages sequential playback of multiple torrent files
 *
 * Created when user selects multiple files from file picker.
 * Tracks current position and automatically advances to next file.
 */
class PlaybackQueue {
    private files: TorrentFile[];          // Array of selected files
    private currentIndex: number;           // Current playback position (0-based)
    private movie: Movie;                   // Movie/show metadata
    private torrent: Torrent;               // Torrent metadata

    constructor(files: TorrentFile[], movie: Movie, torrent: Torrent) {
        this.files = files;
        this.currentIndex = 0;
        this.movie = movie;
        this.torrent = torrent;
    }

    /**
     * Check if there are more files to play after current one
     * @returns true if more files exist, false if on last file
     */
    hasNext(): boolean {
        return this.currentIndex < this.files.length - 1;
    }

    /**
     * Advance to next file in queue
     * Throws error if called when hasNext() is false
     */
    playNext(): void {
        if (!this.hasNext()) {
            throw new Error('No more files in queue');
        }
        this.currentIndex++;
    }

    /**
     * Get currently playing file
     * @returns Current TorrentFile object
     */
    getCurrentFile(): TorrentFile {
        return this.files[this.currentIndex];
    }

    /**
     * Get next file that will play (if exists)
     * @returns Next TorrentFile or null if on last file
     */
    getNextFile(): TorrentFile | null {
        return this.hasNext() ? this.files[this.currentIndex + 1] : null;
    }

    /**
     * Get total number of files in queue
     * @returns Total file count
     */
    getTotalFiles(): number {
        return this.files.length;
    }

    /**
     * Get current 1-based position (for UI display)
     * @returns Current position (1 for first file, 2 for second, etc.)
     */
    getCurrentPosition(): number {
        return this.currentIndex + 1;
    }

    /**
     * Get movie metadata (for restarting stream with same movie)
     * @returns Movie object
     */
    getMovie(): Movie {
        return this.movie;
    }

    /**
     * Get torrent metadata (for restarting stream with same torrent)
     * @returns Torrent object
     */
    getTorrent(): Torrent {
        return this.torrent;
    }
}
```

#### TorrentFile Interface

```typescript
interface TorrentFile {
    index: number;           // File index in torrent (0-based)
    name: string;            // Filename (e.g., "Episode 01.mp4")
    size: number;            // Size in bytes
    path: string;            // Relative path within torrent
}
```

### UI Components

#### File Picker Modal (Updated)

**Location:** `video-player.ts:showFilePickerModal()`

**Changes:**
1. Added checkboxes for each file item
2. Added "Select All" / "Deselect All" buttons
3. Changed "Play" button text to "Play N Files" dynamically
4. Return value changed from `number | null` to `number[] | null`

**HTML Structure:**
```html
<div class="file-picker-modal">
  <div class="file-picker-header">
    <h3>Select Files to Play</h3>
    <button class="btn-select-all">Select All</button>
    <button class="btn-deselect-all">Deselect All</button>
  </div>

  <div class="file-picker-list">
    <div class="file-picker-item" data-index="0">
      <input type="checkbox" class="file-checkbox" id="file-0" />
      <label for="file-0">
        <span class="file-name">Episode 01.mp4</span>
        <span class="file-size">523 MB</span>
      </label>
      <button class="file-star" data-index="0">☆</button>
    </div>
    <!-- More file items... -->
  </div>

  <div class="file-picker-footer">
    <button class="btn-cancel">Cancel</button>
    <button class="btn-play">Play 3 Files</button>
  </div>
</div>
```

**Event Handlers:**
```typescript
// Update "Play N Files" button text
function updatePlayButtonText(): void {
    const selectedCount = getSelectedFileIndices().length;
    const playButton = modal.querySelector('.btn-play');

    if (selectedCount === 0) {
        playButton.disabled = true;
        playButton.textContent = 'Select Files';
    } else if (selectedCount === 1) {
        playButton.disabled = false;
        playButton.textContent = 'Play 1 File';
    } else {
        playButton.disabled = false;
        playButton.textContent = `Play ${selectedCount} Files`;
    }
}

// Collect selected file indices
function getSelectedFileIndices(): number[] {
    const checkboxes = modal.querySelectorAll<HTMLInputElement>('.file-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.id.replace('file-', '')));
}
```

#### Queue Status Overlay

**Location:** `video-player.ts:updateQueueStatusUI()`

**Position:** Top-left corner with backdrop blur effect

**HTML Structure:**
```html
<div class="queue-status-overlay">
  <div class="queue-status-current">
    Playing: <strong>Episode 01.mp4</strong> <span class="queue-status-position">(1/10)</span>
  </div>
  <div class="queue-status-next">
    Next: <strong>Episode 02.mp4</strong>
  </div>
</div>
```

**CSS Styling (Tailwind):**
```typescript
const queueOverlay = `
  <div class="
    queue-status-overlay
    fixed top-4 left-4
    bg-black/70 backdrop-blur-md
    text-white text-sm
    px-4 py-2 rounded-lg
    shadow-lg
    z-50
    max-w-sm
  ">
    <!-- Content -->
  </div>
`;
```

**Visibility Logic:**
- Show when PlaybackQueue exists AND has more than 1 file
- Hide when queue is null OR only 1 file
- Update on metadata load (file name available)
- Update after each file transition

### Implementation Details

#### Creating PlaybackQueue

**Trigger:** User clicks "Play N Files" button in file picker

```typescript
async showVideoPlayer(
    movie: Movie,
    torrent: Torrent,
    fileIndices?: number[]
): Promise<void> {
    // Show file picker if multiple files available
    const videoFiles = await this.getVideoFiles(torrent);

    if (videoFiles.length > 1 && !fileIndices) {
        const selectedIndices = await this.showFilePickerModal(videoFiles, movie);

        if (!selectedIndices || selectedIndices.length === 0) {
            return; // User cancelled
        }

        fileIndices = selectedIndices;
    }

    // Create PlaybackQueue if multiple files selected
    if (fileIndices && fileIndices.length > 1) {
        const selectedFiles = fileIndices.map(idx => videoFiles[idx]);
        this.playbackQueue = new PlaybackQueue(selectedFiles, movie, torrent);
    } else {
        this.playbackQueue = null; // Single file, no queue
    }

    // Start streaming first file
    const fileIndex = fileIndices ? fileIndices[0] : 0;
    await this.startStream(movie, torrent, fileIndex);
}
```

#### Auto-Play Next File

**Trigger:** Video 'ended' event fires

```typescript
private setupVideoEventHandlers(): void {
    const video = document.querySelector<HTMLVideoElement>('video');

    if (video) {
        // Handle video end event
        video.addEventListener('ended', () => this.handleVideoEnded());
    }
}

private async handleVideoEnded(): Promise<void> {
    console.log('[VideoPlayer] Video ended');

    if (!this.playbackQueue || !this.playbackQueue.hasNext()) {
        // No queue or last file - just clear and stop
        console.log('[VideoPlayer] Queue complete or no queue');
        this.playbackQueue = null;
        this.updateQueueStatusUI();
        return;
    }

    // Advance to next file
    console.log('[VideoPlayer] Playing next file in queue');
    this.playbackQueue.playNext();

    const nextFile = this.playbackQueue.getCurrentFile();
    const movie = this.playbackQueue.getMovie();
    const torrent = this.playbackQueue.getTorrent();

    // Show loading UI
    this.ctx.ui.showLoadingScreen('Loading next video...');

    try {
        // Stop current stream
        await window.NativeTorrentClient.stopStream();

        // Start stream for next file
        await this.startStream(movie, torrent, nextFile.index);

        // Queue UI will update automatically on 'loadedmetadata' event
    } catch (error) {
        console.error('[VideoPlayer] Failed to play next file:', error);
        this.ctx.ui.showError(`Failed to play next file: ${error.message}`);
        this.playbackQueue = null;
        this.updateQueueStatusUI();
    }
}
```

#### Queue Status UI Updates

**Trigger:** Video metadata loaded, queue created/updated

```typescript
private updateQueueStatusUI(): void {
    const container = document.querySelector('.video-player-container');
    if (!container) return;

    // Remove existing overlay
    const existingOverlay = container.querySelector('.queue-status-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Don't show for single file or no queue
    if (!this.playbackQueue || this.playbackQueue.getTotalFiles() <= 1) {
        return;
    }

    // Get current and next file info
    const currentFile = this.playbackQueue.getCurrentFile();
    const nextFile = this.playbackQueue.getNextFile();
    const position = this.playbackQueue.getCurrentPosition();
    const total = this.playbackQueue.getTotalFiles();

    // Create overlay HTML
    const overlay = document.createElement('div');
    overlay.className = 'queue-status-overlay fixed top-4 left-4 bg-black/70 backdrop-blur-md text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';

    overlay.innerHTML = `
        <div class="queue-status-current mb-1">
            Playing: <strong class="truncate">${this.escapeHtml(currentFile.name)}</strong>
            <span class="queue-status-position text-gray-300 ml-2">(${position}/${total})</span>
        </div>
        ${nextFile ? `
            <div class="queue-status-next text-gray-300">
                Next: <strong class="truncate">${this.escapeHtml(nextFile.name)}</strong>
            </div>
        ` : `
            <div class="queue-status-next text-gray-300">
                Last video in queue
            </div>
        `}
    `;

    container.appendChild(overlay);
}
```

## Operational Flows

### Flow 1: User Selects Multiple Files

```
1. User opens movie/show with multi-file torrent
   ↓
2. VideoPlayer detects > 1 video file
   ↓
3. Show file picker modal with checkboxes
   ↓
4. User checks files [0, 1, 2] (3 episodes)
   ↓
5. User clicks "Play 3 Files" button
   ↓
6. VideoPlayer.showVideoPlayer() creates PlaybackQueue
   ↓
7. PlaybackQueue initialized with files [0,1,2]
   ↓
8. Start stream for first file (index 0)
   ↓
9. Video plays, queue UI shows "Playing: Episode 01.mp4 (1/3)"
```

### Flow 2: Automatic Transition to Next File

```
1. Video playing file 1 of 3
   ↓
2. Video reaches end (currentTime === duration)
   ↓
3. 'ended' event fires
   ↓
4. handleVideoEnded() checks playbackQueue.hasNext()
   ↓
5. hasNext() returns true (files 2 and 3 remain)
   ↓
6. playbackQueue.playNext() increments currentIndex (0 → 1)
   ↓
7. Stop current torrent stream
   ↓
8. Show loading screen: "Loading next video..."
   ↓
9. Start stream for next file (index 1)
   ↓
10. Stream URL returned: http://127.0.0.1:8888/video
   ↓
11. Set video.src = streamUrl
   ↓
12. 'loadedmetadata' event fires
   ↓
13. updateQueueStatusUI() updates overlay
   ↓
14. Video plays, queue UI shows "Playing: Episode 02.mp4 (2/3)"
```

### Flow 3: Queue Completion

```
1. Video playing file 3 of 3 (last file)
   ↓
2. Video reaches end
   ↓
3. 'ended' event fires
   ↓
4. handleVideoEnded() checks playbackQueue.hasNext()
   ↓
5. hasNext() returns false (no more files)
   ↓
6. Set playbackQueue = null
   ↓
7. updateQueueStatusUI() removes overlay (queue is null)
   ↓
8. Video player remains open, user can close manually
```

## Performance Characteristics

### Memory Usage
- **PlaybackQueue object:** ~1 KB per instance
- **File metadata array:** ~100 bytes per file × N files
- **Total overhead:** ~1-10 KB for typical 10-file queue

### Transition Latency
- **Stop stream:** <100ms (native async)
- **Start stream:** 2-5 seconds (metadata + first pieces)
- **Total transition:** 2-5 seconds between files

### Edge Cases Handled
- User closes video player mid-queue → Queue cleared, no memory leak
- App backgrounded during transition → Service continues, resumes on foreground
- Network drops during transition → Error shown, queue cleared
- Torrent removed mid-queue → Error shown, queue cleared

## Testing Strategy

### Unit Tests

```typescript
describe('PlaybackQueue', () => {
    let queue: PlaybackQueue;
    const mockFiles = [
        { index: 0, name: 'file1.mp4', size: 1000, path: 'file1.mp4' },
        { index: 1, name: 'file2.mp4', size: 2000, path: 'file2.mp4' },
        { index: 2, name: 'file3.mp4', size: 3000, path: 'file3.mp4' }
    ];

    beforeEach(() => {
        queue = new PlaybackQueue(mockFiles, mockMovie, mockTorrent);
    });

    test('hasNext() returns true for first file', () => {
        expect(queue.hasNext()).toBe(true);
    });

    test('playNext() advances to second file', () => {
        queue.playNext();
        expect(queue.getCurrentFile()).toEqual(mockFiles[1]);
        expect(queue.getCurrentPosition()).toBe(2);
    });

    test('hasNext() returns false for last file', () => {
        queue.playNext(); // index 1
        queue.playNext(); // index 2
        expect(queue.hasNext()).toBe(false);
    });

    test('playNext() throws when called on last file', () => {
        queue.playNext(); // index 1
        queue.playNext(); // index 2
        expect(() => queue.playNext()).toThrow('No more files in queue');
    });

    test('getNextFile() returns null for last file', () => {
        queue.playNext(); // index 1
        queue.playNext(); // index 2
        expect(queue.getNextFile()).toBeNull();
    });
});
```

### Integration Tests

**Test Case 1: Multi-File Playback**
```
1. Select 3 files from file picker
2. Verify PlaybackQueue created
3. Verify first file starts playing
4. Fast-forward to end of video
5. Verify 'ended' event triggers transition
6. Verify second file starts playing
7. Verify queue UI updates correctly
8. Fast-forward to end of second video
9. Verify third file starts playing
10. Fast-forward to end of third video
11. Verify queue clears and UI hides
```

**Test Case 2: User Cancels Picker**
```
1. Open multi-file torrent
2. File picker modal appears
3. Click "Cancel" button
4. Verify no PlaybackQueue created
5. Verify video player closed
```

**Test Case 3: Single File Selected**
```
1. Open multi-file torrent
2. Select only 1 file
3. Click "Play 1 File"
4. Verify no PlaybackQueue created (playbackQueue === null)
5. Verify single file plays normally
6. Verify no queue UI shown
```

### Manual Tests

1. **Binge Watch Test** - Select all episodes of a TV show, verify seamless playback through all
2. **Large Queue Test** - Select 50+ files, verify performance remains smooth
3. **Background Test** - Start multi-file playback, background app, verify continues on resume
4. **Network Drop Test** - Start multi-file, disable WiFi mid-transition, verify error handling
5. **Seek During Queue** - Play file 1, seek to end, verify file 2 starts correctly

## Known Limitations

### 1. No Manual Skip
**Issue:** Users cannot manually skip to next file in queue

**Workaround:** Let video play or close and restart

**Future:** Add "Skip to Next" button in queue UI overlay

### 2. No Queue Editing
**Issue:** Cannot add/remove files from queue after starting

**Workaround:** Stop playback and restart with new selection

**Future:** Show queue list with remove buttons

### 3. No Queue Persistence
**Issue:** Queue lost if app crashes or is force-closed

**Workaround:** Re-select files after restart

**Future:** Save queue state to SQLite, restore on app launch

### 4. No Position Memory
**Issue:** Restarting app doesn't resume from last position in queue

**Workaround:** Manually select remaining files

**Future:** Save current queue position and file timestamp

## Future Enhancements

### 1. Queue Management UI
- Show full queue list in sidebar/modal
- Allow drag-and-drop reordering
- Add "Remove from Queue" buttons
- Display download progress for each file

### 2. Playback Controls
- "Skip to Next" button
- "Previous File" button
- Jump to specific file in queue
- Shuffle queue order

### 3. Smart Queue Features
- Auto-detect related files (same show, sequential episodes)
- Suggest "Play All" for TV show torrents
- Remember partial queue progress (resume on app restart)
- Download next file in background while playing current

### 4. Advanced Options
- Loop queue (restart from beginning after last file)
- Shuffle playback order
- Auto-delete watched files
- Export queue as playlist file

## References

### Code Locations
- **PlaybackQueue class:** `src/app/lib/video-player.ts:15-107`
- **File picker modal:** `src/app/lib/video-player.ts:416-520`
- **handleVideoEnded:** `src/app/lib/video-player.ts:1559-1610`
- **updateQueueStatusUI:** `src/app/lib/video-player.ts:229-262`

### Related Specifications
- [Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)
- [Video Switching Bug Fix](VIDEO-SWITCHING-FIX.md)
- [Architecture Overview](ARCHITECTURE.md)

### Commit History
- **Initial Implementation:** `939a0a26` - feat: multi-file playback and automated testing infrastructure
- **Bug Fix:** `374fa26d` - fix: prevent old/cancelled stream requests from playing

---

*Document authored by Claude Code on 2025-11-13*
*Specification reflects production implementation of multi-file playback in FlixCapacitor Mobile v1.0.0*
