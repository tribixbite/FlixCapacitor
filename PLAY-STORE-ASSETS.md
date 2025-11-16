# Play Store Assets Creation Guide

**Date:** 2025-11-16
**Phase:** 12E Day 3-4 - Play Store Assets & Listing
**Status:** Ready for Asset Creation

---

## Overview

This guide provides specifications and instructions for creating all required Google Play Store marketing assets for FlixCapacitor.

**Required Assets:**
1. ✅ App icon (512x512px)
2. ⏳ Feature graphic (1024x500px)
3. ⏳ Phone screenshots (2-8 images)
4. ⏳ Tablet screenshots (optional, 1-8 images)
5. ⏳ Promotional video (optional)

---

## 1. App Icon

### Specifications
- **Dimensions:** 512x512 pixels
- **Format:** 32-bit PNG (with alpha channel)
- **Color Space:** sRGB
- **Max File Size:** 1MB
- **Minimum Dimensions:** Must be at least 512x512 (no smaller)

### Design Requirements
**Current Icon:** ⚡ Lightning bolt emoji (placeholder)

**Production Icon Should:**
- Be simple and recognizable
- Work well at all sizes (48dp on device to 512px in store)
- Use brand colors (dark background, red/blue accents)
- No text (icon only)
- High contrast for visibility
- Unique and memorable

###Design Concept
```
Background: Dark gradient (#0a0a0a → #1f1f1f)
Primary: Lightning bolt symbol (⚡) in gradient
Accent: Red (#e50914) to Blue (#3b82f6) gradient
Style: Modern, flat design with subtle depth
Shape: Square with rounded corners (handled by Android)
```

### Creation Tools
**Option 1: Professional Design**
- Adobe Illustrator
- Figma
- Sketch
- Affinity Designer

**Option 2: Free Tools**
- GIMP (open source)
- Inkscape (vector)
- Canva (templates)
- Icon Kitchen (Android-specific)

**Option 3: AI Generation**
- DALL-E / Midjourney (with refinement)
- Stable Diffusion
- AI icon generators

### File Naming
```
app-icon-512.png          # Primary
app-icon-512-alt.png      # Alternative version (optional)
```

### Checklist
- [ ] 512x512 pixels exactly
- [ ] PNG format with alpha channel
- [ ] sRGB color space
- [ ] Under 1MB file size
- [ ] No text in icon
- [ ] High contrast
- [ ] Tested at multiple sizes (48dp, 96dp, 192dp, 512px)
- [ ] Looks good on light and dark backgrounds

---

## 2. Feature Graphic

### Specifications
- **Dimensions:** 1024x500 pixels
- **Format:** JPG or 24-bit PNG
- **Max File Size:** 1MB
- **Aspect Ratio:** 2.048:1

### Design Requirements
**Purpose:** Banner image shown at top of Play Store listing

**Must Include:**
- App name: "FlixCapacitor"
- Tagline: "Stream Instantly" or "Torrent Streaming Reimagined"
- Visual elements (lightning bolt, play button, phone mockup)
- Brand colors

**Must NOT Include:**
- No screenshots (should be original design)
- No busy backgrounds (keep it clean)
- No small text (illegible on mobile)
- No content rating logos
- No prices or promotions

### Design Concept
```
Layout:
┌────────────────────────────────────────────────┐
│  ⚡                                           │
│  FlixCapacitor                                │
│  Stream Instantly                             │
│                      [Phone mockup showing app]│
└────────────────────────────────────────────────┘

Colors: Dark background with gradient
Font: Bold, modern sans-serif
Visual: Lightning bolt + phone showing movie grid
Effect: Subtle glow around bolt
```

### Creation Steps
1. **Background:** Dark gradient (#0a0a0a → #141414)
2. **Title:** "FlixCapacitor" in large bold font (left side)
3. **Tagline:** "Stream Instantly" below title (smaller)
4. **Visual:** Phone mockup on right showing app interface
5. **Accent:** Lightning bolt icon with glow effect
6. **Polish:** Add subtle shadows, ensure readability

### Tools
- Canva (templates available)
- Figma (design tool)
- Adobe Photoshop
- GIMP (free alternative)

### File Naming
```
feature-graphic-1024x500.png
feature-graphic-1024x500.jpg
```

### Checklist
- [ ] 1024x500 pixels exactly
- [ ] Under 1MB file size
- [ ] App name clearly visible
- [ ] Tagline readable on mobile
- [ ] High quality (no compression artifacts)
- [ ] Brand colors consistent
- [ ] Looks good on all backgrounds
- [ ] No prohibited content (screenshots, prices, ratings)

---

## 3. Phone Screenshots

### Specifications
- **Quantity:** Minimum 2, Maximum 8, Recommended 6-8
- **Dimensions:**
  - Portrait: 1080x1920 pixels (9:16 ratio) **RECOMMENDED**
  - Landscape: 1920x1080 pixels (16:9 ratio)
- **Format:** JPG or 24-bit PNG
- **Max File Size:** 8MB per screenshot
- **Minimum:** At least 320px on shortest side
- **Maximum:** No more than 3840px on longest side

### Recommended Screenshots (8 total)

#### 1. Home Screen - Movies Grid
**Content:** Browse movies view with bottom navigation
**Show:**
- Movie grid (2 columns)
- Bottom navigation bar (Browse, Favorites, Library, Collections, Settings)
- Movie posters with ratings
- Dark theme

**Capture from:** Web dev server at `http://localhost:5173/#movies`

#### 2. Movie Detail - Torrent Options
**Content:** Movie detail page showing available torrents
**Show:**
- Movie title and metadata (rating, year, runtime)
- Synopsis
- Available torrents (1080p, 720p with seeders)
- "Add to Collection" button ✨ (NEW - Phase 13)
- Play button

**Capture from:** Click any movie from home screen

#### 3. Video Player - Full Screen
**Content:** Video playing in full screen mode
**Show:**
- Video content
- Player controls (play/pause, seek bar, time, fullscreen)
- Quality indicator
- Clean, minimal UI

**Capture from:** Click play on any torrent

#### 4. Collections - Grid View
**Content:** Torrent Collections list ✨ (NEW - Phase 13)
**Show:**
- Collections grid (2-3 columns)
- Collection cards with cover images
- Item count badges
- Create new collection button
- Blue theme (distinguishes from favorites)

**Capture from:** Web dev server at `http://localhost:5173/#collections`

#### 5. Collection Detail - Torrent List
**Content:** Inside a collection showing organized torrents ✨ (NEW - Phase 13)
**Show:**
- Collection name and description
- Torrent list with:
  - Order numbers (1, 2, 3...)
  - Torrent names
  - Quality badges
  - Seeder counts
  - Move up/down buttons
  - Remove buttons

**Capture from:** Click any collection from collections view

#### 6. Library - Local Files
**Content:** Personal library with local video files
**Show:**
- Video file list or grid
- File metadata (size, duration, format)
- Folder organization
- Manage library button
- Continue watching section

**Capture from:** Web dev server at `http://localhost:5173/#library`

#### 7. Favorites - Saved Content
**Content:** Favorites list with movies/shows
**Show:**
- Favorites grid or list
- Heart icons
- Quick access to favorite content
- Sort/filter options
- Cloud sync indicator (if enabled)

**Capture from:** Web dev server at `http://localhost:5173/#favorites`

#### 8. Settings - Features & Sync
**Content:** Settings screen highlighting key features
**Show:**
- Theme toggle
- Streaming settings
- Cloud sync settings (optional)
- Performance options
- About section

**Capture from:** Web dev server at `http://localhost:5173/#settings`

### Capture Methods

#### Method 1: Web Dev Server (Chrome DevTools)
```bash
# Start dev server
npm run dev

# Open in Chrome: http://localhost:5173
# Open DevTools (F12) → Device toolbar (Ctrl+Shift+M)
# Select device: Pixel 5 (1080x2340)
# Navigate to each view
# Screenshot: Ctrl+Shift+P → "Capture screenshot"
```

#### Method 2: Physical Device
```bash
# Build and install
./build-and-install.sh

# Connect device via USB
# Enable USB debugging
# Navigate through app
# Use ADB to capture:
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

#### Method 3: Android Emulator
```bash
# Start emulator
cd android
./gradlew installDebug

# In Android Studio: Run app on emulator
# Use emulator's screenshot button
# Or: Ctrl+S in emulator window
```

### Screenshot Editing
**Required Edits:**
- Resize to exactly 1080x1920 if needed
- Crop status bar (optional, but cleaner)
- Ensure dark mode theme
- Remove any personal/sensitive data
- Compress without losing quality (JPG 90% quality)

**Optional Enhancements:**
- Add device frame (makes it look more professional)
- Add subtle drop shadow
- Group related screenshots
- Add minimal text annotations (if helpful)

### File Naming Convention
```
01-home-movies-grid.png
02-movie-detail-torrents.png
03-video-player-fullscreen.png
04-collections-grid.png
05-collection-detail-list.png
06-library-local-files.png
07-favorites-saved-content.png
08-settings-features-sync.png
```

### Checklist
- [ ] 6-8 phone screenshots captured
- [ ] 1080x1920 resolution (portrait)
- [ ] Dark theme enabled
- [ ] Each under 8MB
- [ ] High quality (no compression artifacts)
- [ ] Show variety of features
- [ ] No personal data visible
- [ ] Properly named and ordered
- [ ] Highlight Phase 13 features (Collections, Add to Collection)

---

## 4. Tablet Screenshots (Optional)

### Specifications
- **Quantity:** Minimum 1, Maximum 8, Recommended 4
- **Dimensions:**
  - Portrait: 1536x2048 pixels
  - Landscape: 2048x1536 pixels **RECOMMENDED**
- **Format:** JPG or 24-bit PNG
- **Max File Size:** 8MB per screenshot

### Recommended Tablet Screenshots (4 total)

1. **Home - Landscape Grid**
   - Movie grid (3-4 columns, more spacious)
   - Bottom nav expanded with labels

2. **Movie Detail - Side-by-side**
   - Poster on left
   - Details + torrents on right
   - Optimized tablet layout

3. **Collections - Wide Grid**
   - Collections in 3-4 columns
   - More content visible

4. **Video Player - Landscape**
   - Full-width player
   - Tablet-optimized controls

### Capture Method
```bash
# Chrome DevTools
# Select device: Pixel Tablet (2560x1600) or iPad Pro
# Or emulator: Medium Tablet 10" (1920x1200)
```

### File Naming
```
tablet-01-home-landscape.png
tablet-02-detail-layout.png
tablet-03-collections-wide.png
tablet-04-player-landscape.png
```

### Checklist
- [ ] 4 tablet screenshots (optional but recommended)
- [ ] 2048x1536 resolution (landscape)
- [ ] Shows tablet-optimized layouts
- [ ] Each under 8MB

---

## 5. Promotional Video (Optional)

### Specifications
- **Platform:** YouTube only
- **Length:** 30 seconds to 2 minutes (recommended: 60-90 seconds)
- **Resolution:** 1080p minimum, 4K recommended
- **Format:** MP4, MOV, or AVI
- **Aspect Ratio:** 16:9

### Video Content Plan
```
00:00-00:05 - FlixCapacitor logo animation + "Stream Instantly" tagline
00:05-00:15 - Browse movies grid, show smooth scrolling
00:15-00:25 - Tap movie, show detail with torrents, tap "Add to Collection"
00:25-00:35 - Show Collections view, demonstrate organization
00:35-00:45 - Play video, show player controls, PiP mode
00:45-00:55 - Settings screen, highlight cloud sync toggle
00:55-01:00 - FlixCapacitor logo + "Download Now" CTA
```

### Production Tools
- **Screen Recording:** ADB screenrecord, OBS Studio
- **Editing:** DaVinci Resolve (free), Adobe Premiere
- **Music:** Royalty-free from YouTube Audio Library
- **Voiceover:** Optional, keep it concise

### Script Example
```
[0:00] (FlixCapacitor logo)
"FlixCapacitor - The future of torrent streaming"

[0:05] (Browse movies)
"Discover thousands of movies and TV shows"

[0:15] (Movie detail)
"Stream instantly with native torrent support"

[0:25] (Collections)
"Organize your favorites into collections"

[0:35] (Video playback)
"Enjoy seamless playback with subtitle support"

[0:45] (Cloud sync)
"Sync across all your devices"

[0:55] (Logo + CTA)
"FlixCapacitor - Stream Instantly
Download now on Google Play"
```

### Checklist
- [ ] 60-90 seconds length
- [ ] 1080p resolution minimum
- [ ] Smooth transitions
- [ ] Professional quality
- [ ] Clear audio (if voiceover)
- [ ] Royalty-free music
- [ ] Call-to-action at end
- [ ] Uploaded to YouTube
- [ ] YouTube URL ready for Play Console

---

## Asset Organization

### Directory Structure
```
play-store-assets/
├── icon/
│   ├── app-icon-512.png
│   └── app-icon-512-alt.png
├── feature-graphic/
│   └── feature-graphic-1024x500.png
├── screenshots/
│   ├── phone/
│   │   ├── 01-home-movies-grid.png
│   │   ├── 02-movie-detail-torrents.png
│   │   ├── 03-video-player-fullscreen.png
│   │   ├── 04-collections-grid.png
│   │   ├── 05-collection-detail-list.png
│   │   ├── 06-library-local-files.png
│   │   ├── 07-favorites-saved-content.png
│   │   └── 08-settings-features-sync.png
│   └── tablet/ (optional)
│       ├── tablet-01-home-landscape.png
│       ├── tablet-02-detail-layout.png
│       ├── tablet-03-collections-wide.png
│       └── tablet-04-player-landscape.png
└── video/
    └── promo-video-youtube-url.txt
```

### File Size Optimization

**For PNG files:**
```bash
# Install pngquant
# On Termux:
pkg install pngquant

# Optimize (lossless):
pngquant --quality=90-100 app-icon-512.png -o app-icon-512-optimized.png

# Or use ImageOptim, TinyPNG, or similar tools
```

**For JPG files:**
```bash
# Use ImageMagick or similar
convert screenshot.png -quality 90 screenshot.jpg
```

### Quality Checklist
Before uploading to Play Console:
- [ ] All images at correct dimensions
- [ ] All images under size limits
- [ ] sRGB color space for all files
- [ ] No compression artifacts visible
- [ ] Consistent branding and theme
- [ ] Dark mode screenshots (matches app)
- [ ] High quality renders
- [ ] Professional appearance

---

## Upload to Play Console

### Steps
1. **Navigate to:** Play Console → App Dashboard → Store Presence → Main Store Listing
2. **App Icon:** Upload 512x512 PNG
3. **Feature Graphic:** Upload 1024x500 PNG/JPG
4. **Phone Screenshots:**
   - Add 6-8 screenshots
   - Drag to reorder
   - First screenshot is most important
5. **Tablet Screenshots:** (Optional)
   - Add 4 screenshots
   - Separate section
6. **Promotional Video:** (Optional)
   - Paste YouTube URL
   - Video should be public or unlisted

### Preview
- Use "Preview" button to see how listing will appear
- Check on phone and tablet views
- Verify all images display correctly

### Save & Publish
- Click "Save" (saves as draft)
- When ready: "Submit for review"

---

## Timeline

### Day 3 (Today)
- [x] Write Play Store listing content (title, descriptions)
- [x] Document asset requirements (this file)
- [ ] Create app icon (512x512)
- [ ] Create feature graphic (1024x500)
- [ ] Capture phone screenshots (6-8)

### Day 4 (Next)
- [ ] Refine and optimize all images
- [ ] Create tablet screenshots (optional, 4)
- [ ] Record promotional video (optional)
- [ ] Upload all assets to Play Console
- [ ] Preview and finalize listing

---

## Resources

### Design Inspiration
- **Play Store:** Browse top video player apps for screenshot ideas
- **Dribbble:** Search "mobile app screenshots"
- **Behance:** Search "app store assets"

### Stock Images (if needed)
- Unsplash (free, high quality)
- Pexels (free stock photos)
- Pixabay (free images)

### Fonts (for graphics)
- Google Fonts (free)
- Font Squirrel (free commercial fonts)
- DaFont (free fonts)

### Color Palette
```
--bg-primary: #0a0a0a (dark background)
--bg-secondary: #141414 (cards)
--accent-primary: #e50914 (red - primary actions)
--accent-secondary: #3b82f6 (blue - collections)
--text-primary: #ffffff (white text)
--text-secondary: #b3b3b3 (gray text)
```

---

**Last Updated:** 2025-11-16
**Phase:** 12E Day 3-4
**Status:** ✅ Ready for Asset Creation
**Next:** Create visual assets and capture screenshots
