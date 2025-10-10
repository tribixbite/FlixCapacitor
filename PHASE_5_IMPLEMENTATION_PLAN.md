# Phase 5: UI/UX Mobile Conversion - Implementation Plan

## Overview

This document provides a detailed, step-by-step implementation plan for Phase 5, converting the desktop UI to a mobile-native experience.

**Estimated Effort:** 40-60 hours
**Complexity:** High
**Dependencies:** Phases 1-4 must be complete ✅

---

## Goals

1. Integrate streaming service with existing UI
2. Create mobile-responsive layouts
3. Implement touch-friendly controls
4. Configure HLS video playback
5. Convert all modals to mobile patterns
6. Remove desktop-only dependencies

---

## Phase 5A: Streaming Integration (Priority 1)

### Task 5A.1: Update handleTorrent Function
**File:** `src/app/lib/mobile-ui.js`
**Estimated Time:** 2 hours

**Current State:**
```javascript
function handleTorrent(torrent) {
    console.log('Handling torrent:', torrent);
    if (window.App.Config) {
        window.App.Config.getProviderForType('torrentCache').resolve(torrent);
    }
}
```

**Required Changes:**
```javascript
async function handleTorrent(torrent) {
    console.log('Handling torrent:', torrent);

    try {
        // Show loading UI
        showStreamingLoadingUI();

        // Start stream
        const stream = await window.App.StreamingService.startStream(torrent, {
            quality: window.Settings.quality || '720p'
        });

        // Poll for status and update UI
        await window.App.StreamingService.waitForReady(
            stream.streamId,
            (status) => updateStreamingProgress(status)
        );

        // When ready, trigger playback
        // This will be implemented in 5A.3

    } catch (error) {
        console.error('Streaming failed:', error);
        showStreamingError(error.message);
    }
}
```

**Test:**
- Add magnet link via FAB
- Verify mock server receives request
- Confirm progress updates appear

---

### Task 5A.2: Create Streaming Progress UI Component
**File:** `src/app/lib/streaming-progress-ui.js` (NEW)
**Estimated Time:** 3 hours

**Component Structure:**
```javascript
/**
 * Streaming Progress UI Component
 * Shows download/conversion progress for server-side streaming
 */

class StreamingProgressUI {
    constructor() {
        this.overlay = null;
        this.currentStreamId = null;
    }

    show(streamId) {
        // Create overlay with progress indicator
        // Show status messages
        // Update progress bar
    }

    updateProgress(status) {
        // Update based on status.progress (0-100)
        // Show status.message
        // Display ETA, speed, peers
    }

    hide() {
        // Remove overlay
        // Clean up
    }

    showError(message) {
        // Show error state
        // Provide retry button
    }
}
```

**UI Design:**
```
┌─────────────────────────────┐
│                             │
│         🍿                  │
│                             │
│   Preparing Your Stream     │
│                             │
│   ████████░░░░░░░░  45%     │
│                             │
│   Downloading: 2.3 MB/s     │
│   ETA: 60 seconds           │
│   Peers: 42                 │
│                             │
│   [Cancel Stream]           │
│                             │
└─────────────────────────────┘
```

**CSS (to add to styles):**
```css
.streaming-progress-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.streaming-progress-content {
    background: #1a1a1a;
    border-radius: 16px;
    padding: 40px;
    max-width: 400px;
    width: 90%;
    text-align: center;
}

.streaming-progress-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.streaming-progress-bar {
    width: 100%;
    height: 8px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
    margin: 20px 0;
}

.streaming-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #e74c3c, #c0392b);
    transition: width 0.3s ease;
}

.streaming-progress-stats {
    color: #888;
    font-size: 0.9rem;
    margin-top: 15px;
}

.streaming-cancel-button {
    margin-top: 20px;
    padding: 12px 24px;
    background: #333;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}
```

**Test:**
- Mock different progress states (0%, 50%, 100%)
- Test status messages
- Verify cancel button works

---

### Task 5A.3: Configure Video.js for HLS
**File:** `src/app/lib/video-player-mobile.js` (NEW)
**Estimated Time:** 4 hours

**Install Dependencies:**
```bash
npm install video.js videojs-contrib-hls
```

**Implementation:**
```javascript
import videojs from 'video.js';
import 'videojs-contrib-hls';

class MobileVideoPlayer {
    constructor(videoElement) {
        this.player = videojs(videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            responsive: true,
            html5: {
                vhs: {
                    enableLowInitialPlaylist: true,
                    smoothQualityChange: true,
                    overrideNative: true
                }
            }
        });

        this.setupMobileControls();
    }

    loadHLS(streamUrl) {
        this.player.src({
            src: streamUrl,
            type: 'application/x-mpegURL'
        });
    }

    setupMobileControls() {
        // Larger tap targets
        // Gesture controls (see 5B.2)
    }
}
```

**Test:**
- Load mock HLS stream
- Verify playback starts
- Test quality switching
- Check mobile controls

---

### Task 5A.4: Integrate Streaming with Player
**File:** `src/app/lib/mobile-ui.js` (UPDATE)
**Estimated Time:** 2 hours

**Update handleTorrent completion:**
```javascript
// When stream is ready
const streamUrl = status.streamUrl;

// Create player if not exists
if (!window.MobileVideoPlayer) {
    const videoEl = document.getElementById('video-player');
    window.MobileVideoPlayer = new MobileVideoPlayer(videoEl);
}

// Load and play
window.MobileVideoPlayer.loadHLS(streamUrl);
window.MobileVideoPlayer.player.play();

// Hide progress UI
hideStreamingProgressUI();

// Navigate to player view
window.App.vent.trigger('player:show');
```

**Test:**
- End-to-end: FAB → Magnet → Progress → Player
- Verify HLS playback
- Test error handling

---

## Phase 5B: Touch-Optimized Player (Priority 1)

### Task 5B.1: Create Mobile Player Layout
**File:** `src/app/templates/player-mobile.html` (NEW)
**Estimated Time:** 3 hours

**Template Structure:**
```html
<div class="mobile-player-container">
    <video id="video-player" class="video-js vjs-default-skin"></video>

    <div class="mobile-player-overlay">
        <!-- Top bar -->
        <div class="mobile-player-top-bar">
            <button class="back-button">←</button>
            <div class="player-title">Movie Title</div>
            <button class="more-button">⋮</button>
        </div>

        <!-- Center play/pause -->
        <div class="mobile-player-center-controls">
            <button class="play-pause-button">▶️</button>
        </div>

        <!-- Bottom controls -->
        <div class="mobile-player-bottom-bar">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="player-controls">
                <span class="current-time">0:00</span>
                <button class="rewind-button">⏪</button>
                <button class="forward-button">⏩</button>
                <span class="duration">1:45:00</span>
                <button class="fullscreen-button">⛶</button>
            </div>
        </div>
    </div>
</div>
```

**CSS:**
```css
.mobile-player-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: black;
    z-index: 2000;
}

.mobile-player-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s;
}

.mobile-player-overlay.visible {
    opacity: 1;
}

.mobile-player-top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    display: flex;
    align-items: center;
    padding: 0 15px;
}

.mobile-player-bottom-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.back-button,
.more-button,
.play-pause-button,
.rewind-button,
.forward-button,
.fullscreen-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    padding: 10px;
    min-width: 44px;
    min-height: 44px;
}
```

---

### Task 5B.2: Implement Touch Gestures for Player
**File:** `src/app/lib/player-gestures.js` (NEW)
**Estimated Time:** 4 hours

**Gestures to Implement:**
- **Single tap:** Show/hide controls
- **Double tap left:** Rewind 10 seconds
- **Double tap right:** Forward 10 seconds
- **Vertical swipe left:** Adjust brightness
- **Vertical swipe right:** Adjust volume
- **Horizontal swipe:** Seek in video
- **Pinch:** Zoom (for video cropping)

**Implementation:**
```javascript
class PlayerGestures {
    constructor(playerElement) {
        this.player = playerElement;
        this.setupGestures();
    }

    setupGestures() {
        let touchStartX, touchStartY, touchStartTime;

        this.player.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        });

        this.player.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Single tap (show/hide controls)
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchDuration < 200) {
                this.toggleControls();
            }

            // Horizontal swipe (seek)
            else if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
                const seekAmount = deltaX / this.player.offsetWidth * 30; // 30 seconds max
                this.seek(seekAmount);
            }
        });

        // Double tap handling
        let lastTap = 0;
        this.player.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                // Double tap detected
                const tapX = e.changedTouches[0].clientX;
                const screenWidth = window.innerWidth;

                if (tapX < screenWidth / 3) {
                    this.rewind(10);
                } else if (tapX > screenWidth * 2 / 3) {
                    this.forward(10);
                }
            }
            lastTap = currentTime;
        });
    }

    toggleControls() {
        document.querySelector('.mobile-player-overlay').classList.toggle('visible');
    }

    seek(seconds) {
        // Seek in video
    }

    rewind(seconds) {
        // Rewind
    }

    forward(seconds) {
        // Forward
    }
}
```

**Test:**
- Test all gestures on touch device
- Verify smooth animations
- Check gesture conflicts

---

## Phase 5C: Mobile-Responsive Layouts (Priority 2)

### Task 5C.1: Create Mobile Tab Navigation
**File:** `src/app/lib/views/mobile-tab-bar.js` (NEW)
**Estimated Time:** 3 hours

**Tab Bar Component:**
```html
<div class="mobile-tab-bar">
    <button class="tab-item active" data-tab="movies">
        <span class="tab-icon">🎬</span>
        <span class="tab-label">Movies</span>
    </button>
    <button class="tab-item" data-tab="shows">
        <span class="tab-icon">📺</span>
        <span class="tab-label">Shows</span>
    </button>
    <button class="tab-item" data-tab="anime">
        <span class="tab-icon">🎌</span>
        <span class="tab-label">Anime</span>
    </button>
    <button class="tab-item" data-tab="bookmarks">
        <span class="tab-icon">⭐</span>
        <span class="tab-label">Favorites</span>
    </button>
    <button class="tab-item" data-tab="settings">
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">Settings</span>
    </button>
</div>
```

**CSS:**
```css
.mobile-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: #1a1a1a;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid #333;
    z-index: 1000;
}

.tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #888;
    padding: 8px 0;
    transition: color 0.2s;
}

.tab-item.active {
    color: #e74c3c;
}

.tab-icon {
    font-size: 1.5rem;
    margin-bottom: 4px;
}

.tab-label {
    font-size: 0.7rem;
}
```

**Integration:**
- Wire up tab clicks to router
- Save active tab state
- Restore on app restart

---

### Task 5C.2: Make Content Browser Responsive
**File:** `src/app/lib/views/browser/generic_browser.js` (UPDATE)
**Estimated Time:** 4 hours

**Current Grid:** Fixed columns
**Target Grid:** Responsive 2-3 columns on mobile

**CSS Changes:**
```css
/* Mobile: 2 columns on portrait, 3 on landscape */
.movies-container-contain,
.shows-container-contain {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    padding: 15px;
    padding-bottom: 80px; /* Space for tab bar */
}

@media (min-width: 600px) {
    .movies-container-contain,
    .shows-container-contain {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 20px;
    }
}

@media (orientation: landscape) {
    .movies-container-contain,
    .shows-container-contain {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
}

.movie-item,
.show-item {
    aspect-ratio: 2/3;
    position: relative;
}

.movie-cover,
.show-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}
```

**Implement Infinite Scroll:**
```javascript
// Replace pagination with infinite scroll
setupInfiniteScroll() {
    const container = this.$('.movies-container-contain');
    let loading = false;

    container.on('scroll', () => {
        if (loading) return;

        const scrollTop = container.scrollTop();
        const scrollHeight = container[0].scrollHeight;
        const clientHeight = container.height();

        // Load more when 80% scrolled
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            loading = true;
            this.loadNextPage().then(() => {
                loading = false;
            });
        }
    });
}
```

---

### Task 5C.3: Redesign Detail Views for Mobile
**File:** `src/app/lib/views/movie_detail.js` (UPDATE)
**Estimated Time:** 5 hours

**Current Layout:** Two-column (poster | details)
**Target Layout:** Single column vertical scroll

**New Template Structure:**
```html
<div class="mobile-detail-view">
    <!-- Hero image with gradient -->
    <div class="detail-hero">
        <img src="backdrop.jpg" class="detail-backdrop">
        <div class="detail-hero-gradient"></div>
        <button class="detail-back-button">←</button>
    </div>

    <!-- Content -->
    <div class="detail-content">
        <!-- Poster + Basic Info -->
        <div class="detail-header">
            <img src="poster.jpg" class="detail-poster">
            <div class="detail-info">
                <h1 class="detail-title">Movie Title</h1>
                <div class="detail-meta">
                    <span class="year">2024</span>
                    <span class="rating">⭐ 8.5</span>
                    <span class="runtime">2h 15m</span>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="detail-actions">
            <button class="play-button primary">▶️ Play</button>
            <button class="bookmark-button">⭐ Bookmark</button>
            <button class="trailer-button">🎬 Trailer</button>
        </div>

        <!-- Synopsis -->
        <div class="detail-synopsis">
            <h3>Synopsis</h3>
            <p class="synopsis-text">...</p>
        </div>

        <!-- Cast & Crew (horizontal scroll) -->
        <div class="detail-cast">
            <h3>Cast</h3>
            <div class="cast-scroll">
                <!-- Cast items -->
            </div>
        </div>

        <!-- Related (horizontal scroll) -->
        <div class="detail-related">
            <h3>You May Also Like</h3>
            <div class="related-scroll">
                <!-- Related items -->
            </div>
        </div>
    </div>
</div>
```

**CSS:**
```css
.mobile-detail-view {
    overflow-y: auto;
    height: 100vh;
    background: #0a0a0a;
}

.detail-hero {
    position: relative;
    height: 40vh;
    overflow: hidden;
}

.detail-backdrop {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.detail-hero-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, transparent, #0a0a0a);
}

.detail-content {
    padding: 20px;
    margin-top: -80px;
    position: relative;
    z-index: 1;
}

.detail-header {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.detail-poster {
    width: 120px;
    height: 180px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.detail-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 30px;
}

.play-button {
    grid-column: 1 / -1;
    padding: 16px;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
}

.cast-scroll,
.related-scroll {
    display: flex;
    gap: 15px;
    overflow-x: auto;
    padding-bottom: 10px;
}
```

---

## Phase 5D: Convert Modals to Mobile Patterns (Priority 2)

### Task 5D.1: Settings Full-Screen View
**File:** `src/app/lib/views/settings-mobile.js` (NEW)
**Estimated Time:** 4 hours

**Convert modal → full-screen page with sections:**
```html
<div class="mobile-settings-view">
    <div class="settings-header">
        <button class="back-button">←</button>
        <h1>Settings</h1>
    </div>

    <div class="settings-content">
        <div class="settings-section">
            <h2>Playback</h2>
            <div class="setting-item">
                <label>Default Quality</label>
                <select>
                    <option>720p</option>
                    <option>1080p</option>
                </select>
            </div>
        </div>

        <div class="settings-section">
            <h2>Streaming</h2>
            <div class="setting-item">
                <label>Server URL</label>
                <input type="url" placeholder="http://localhost:3001/api">
            </div>
        </div>

        <div class="settings-section">
            <h2>Interface</h2>
            <div class="setting-item toggle">
                <label>Dark Mode</label>
                <input type="checkbox" checked>
            </div>
        </div>
    </div>
</div>
```

---

### Task 5D.2: Filter Sheet (Bottom Sheet Pattern)
**File:** `src/app/lib/views/filter-sheet.js` (NEW)
**Estimated Time:** 3 hours

**Slide-up sheet for filters:**
```javascript
class FilterSheet {
    show() {
        const sheet = `
            <div class="bottom-sheet-overlay">
                <div class="bottom-sheet">
                    <div class="sheet-handle"></div>
                    <h2>Filter & Sort</h2>

                    <div class="filter-group">
                        <h3>Genre</h3>
                        <div class="chip-group">
                            <button class="chip">Action</button>
                            <button class="chip">Comedy</button>
                            <button class="chip active">Drama</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <h3>Sort By</h3>
                        <select>
                            <option>Popular</option>
                            <option>Rating</option>
                            <option>Recent</option>
                        </select>
                    </div>

                    <button class="apply-button">Apply Filters</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', sheet);
    }
}
```

---

## Phase 5E: Performance & Polish (Priority 3)

### Task 5E.1: Add Pull-to-Refresh
**File:** Various browser views
**Estimated Time:** 2 hours

**Implementation:**
```javascript
setupPullToRefresh() {
    let startY = 0;
    let pulling = false;

    this.$el.on('touchstart', (e) => {
        if (this.$el.scrollTop() === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    });

    this.$el.on('touchmove', (e) => {
        if (pulling) {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 80) {
                this.showRefreshIndicator();
            }
        }
    });

    this.$el.on('touchend', () => {
        if (pulling) {
            this.refreshContent();
            pulling = false;
        }
    });
}
```

---

### Task 5E.2: Add Loading Skeletons
**Estimated Time:** 3 hours

**Replace spinners with skeleton screens:**
```html
<div class="skeleton-grid">
    <div class="skeleton-item">
        <div class="skeleton-poster"></div>
        <div class="skeleton-text"></div>
    </div>
    <!-- Repeat 6-9 times -->
</div>
```

```css
@keyframes skeleton-loading {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
}

.skeleton-poster {
    width: 100%;
    aspect-ratio: 2/3;
    background: linear-gradient(90deg, #1a1a1a 0px, #2a2a2a 40px, #1a1a1a 80px);
    background-size: 200px 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 8px;
}
```

---

## Testing Checklist

### Unit Tests
- [ ] StreamingService API calls
- [ ] Player gesture detection
- [ ] Tab navigation
- [ ] Filter logic
- [ ] Infinite scroll pagination

### Integration Tests
- [ ] End-to-end streaming flow
- [ ] Video playback with HLS
- [ ] Deep link → player flow
- [ ] Settings persistence
- [ ] Bookmark sync

### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPad (tablet layout)
- [ ] Android phone (various sizes)
- [ ] Android tablet
- [ ] Landscape orientation
- [ ] Dark mode
- [ ] Low battery mode
- [ ] Airplane mode → streaming error

### Performance Testing
- [ ] App launch time < 3s
- [ ] Streaming start < 5s (after server ready)
- [ ] Smooth 60fps scrolling
- [ ] Memory usage < 100MB
- [ ] Battery drain during streaming

---

## Estimated Timeline

| Phase | Tasks | Hours | Priority |
|-------|-------|-------|----------|
| 5A - Streaming Integration | 4 tasks | 11h | P1 |
| 5B - Touch Player | 2 tasks | 7h | P1 |
| 5C - Responsive Layouts | 3 tasks | 12h | P2 |
| 5D - Mobile Modals | 2 tasks | 7h | P2 |
| 5E - Polish | 2 tasks | 5h | P3 |
| **Total** | **13 tasks** | **42h** | |

**Suggested Schedule:**
- Week 1: Phase 5A + 5B (streaming + player)
- Week 2: Phase 5C (layouts)
- Week 3: Phase 5D + 5E (modals + polish)
- Week 4: Testing + bug fixes

---

## Success Criteria

Phase 5 is complete when:

✅ Users can add magnet links and start streaming
✅ Progress UI shows realistic download status
✅ Video player plays HLS streams smoothly
✅ Touch gestures work for player control
✅ All views are mobile-responsive
✅ Tab navigation works on all screens
✅ Settings are accessible and persist
✅ App passes manual testing on real devices
✅ Performance benchmarks are met

---

## Next Steps After Phase 5

1. **Beta Testing** - TestFlight (iOS) + Play Store Beta (Android)
2. **User Feedback** - Collect and prioritize improvements
3. **Phase 6** - Additional features (offline, widgets, etc.)
4. **App Store Submission** - Prepare listings, screenshots, metadata
5. **Production Backend** - Deploy real streaming server
6. **Monitoring** - Set up analytics and crash reporting

---

## Resources

### Documentation to Review
- Video.js HLS docs: https://github.com/videojs/http-streaming
- Capacitor Gestures: https://capacitorjs.com/docs/apis/motion
- Mobile Design Patterns: https://mobbin.com/browse/ios/apps

### Tools Needed
- Xcode (for iOS testing)
- Android Studio (for Android testing)
- Charles Proxy (for API debugging)
- Xcode Simulator / Android Emulator
- Real devices for testing

### Dependencies to Install
```bash
npm install video.js videojs-contrib-hls
npm install @capacitor/haptics  # For haptic feedback
npm install @capacitor/share    # For sharing functionality
```

---

**Good luck with Phase 5! The foundation is solid. Now make it beautiful! 🚀**
