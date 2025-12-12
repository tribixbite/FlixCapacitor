# FlixCapacitor Migration TODO List

> 100+ fine-grained tasks with test requirements
> Status: [ ] Pending | [~] In Progress | [x] Complete | [!] Blocked

---

## Phase 0: Project Infrastructure (Tasks 1-15)

### 0.1 Project Setup
- [ ] **T001** Create new SvelteKit project with `npm create svelte@latest flixcapacitor-v2`
  - Test: Project builds without errors
- [ ] **T002** Configure TypeScript strict mode in `tsconfig.json`
  - Test: `npm run check` passes
- [ ] **T003** Install and configure Tailwind CSS 4
  - Test: Tailwind classes render correctly
- [ ] **T004** Install Konsta UI and configure for Svelte
  - Test: Konsta Button component renders
- [ ] **T005** Configure Vite for Capacitor static build
  - Test: `npm run build` creates `build/` directory

### 0.2 Capacitor Integration
- [ ] **T006** Copy `capacitor.config.ts` from legacy project
  - Test: `npx cap sync` completes
- [ ] **T007** Link existing native plugins to new project
  - Test: `TorrentStreamer` plugin accessible
- [ ] **T008** Configure Android project with custom AAPT2
  - Test: `./build-and-install.sh` succeeds
- [ ] **T009** Set up iOS project (if applicable)
  - Test: Xcode opens project without errors
- [ ] **T010** Verify deep link handling (magnet://)
  - Test: Magnet link opens app

### 0.3 Testing Infrastructure
- [ ] **T011** Set up Vitest with svelte testing
  - Test: Sample test runs
- [ ] **T012** Configure @testing-library/svelte
  - Test: Component render test works
- [ ] **T013** Set up Playwright for E2E tests
  - Test: Browser launches and navigates
- [ ] **T014** Configure code coverage reporting
  - Test: Coverage report generates
- [ ] **T015** Set up CI pipeline (GitHub Actions)
  - Test: Pipeline runs on push

---

## Phase 1: Core Layout & Navigation (Tasks 16-30)

### 1.1 App Shell
- [ ] **T016** Create `+layout.svelte` with Konsta App wrapper
  - Test: Dark mode renders correctly
- [ ] **T017** Implement responsive viewport meta tags
  - Test: Viewport scales on mobile
- [ ] **T018** Set up CSS variables for theming
  - Test: Theme variables cascade
- [ ] **T019** Create safe area handling for notched devices
  - Test: Content not obscured by notch
- [ ] **T020** Implement status bar integration
  - Test: Status bar color matches theme

### 1.2 Bottom Navigation
- [x] **T021** Create `BottomNav.svelte` with Konsta Tabbar
  - Test: All 6 tabs render
- [x] **T022** Implement active state highlighting
  - Test: Current tab highlighted
- [x] **T023** Add haptic feedback on tab tap
  - Test: Vibration on tap (device)
- [ ] **T024** Create navigation store for route state
  - Test: Store updates on navigation
- [x] **T025** Implement tab icons (Browse, Favorites, Library, Downloads, Collections, Settings)
  - Test: Icons display correctly

### 1.3 Top Navigation
- [x] **T026** Create `TopNavbar.svelte` with dynamic title
  - Test: Title updates per route
- [x] **T027** Implement search button/icon
  - Test: Search button clickable
- [x] **T028** Add back navigation support
  - Test: Back button works
- [ ] **T029** Create scroll-aware navbar (hide on scroll down)
  - Test: Navbar hides on scroll
- [ ] **T030** Implement pull-to-refresh gesture
  - Test: Pull triggers refresh

---

## Phase 2: Core Services (Tasks 31-50)

### 2.1 API Services
- [ ] **T031** Create `tmdb.service.ts` with typed methods
  - Test: `getPopularMovies()` returns data
- [ ] **T032** Implement TMDB image URL helpers
  - Test: Poster URLs generate correctly
- [ ] **T033** Create `opensubtitles.service.ts`
  - Test: Subtitle search returns results
- [ ] **T034** Port API configuration from legacy
  - Test: API keys load from config
- [ ] **T035** Implement request caching layer
  - Test: Cached responses returned

### 2.2 Storage Services
- [ ] **T036** Create `preferences.service.ts` (Capacitor Preferences)
  - Test: Get/set values persist
- [ ] **T037** Create `sqlite.service.ts` wrapper
  - Test: Database creates tables
- [ ] **T038** Implement migrations system for SQLite
  - Test: Schema migrations run
- [ ] **T039** Create `filesystem.service.ts` for media files
  - Test: File read/write works
- [ ] **T040** Port library database schema
  - Test: Library tables exist

### 2.3 State Stores
- [ ] **T041** Create `settings.store.ts` with persistence
  - Test: Settings persist across restarts
- [ ] **T042** Create `player.store.ts` for playback state
  - Test: Play/pause updates state
- [ ] **T043** Create `library.store.ts` for local files
  - Test: Library items load
- [ ] **T044** Create `downloads.store.ts` for download queue
  - Test: Downloads track progress
- [ ] **T045** Create `favorites.store.ts`
  - Test: Favorites add/remove works

### 2.4 Capacitor Plugin Wrappers
- [ ] **T046** Create `useTorrentStreamer()` composable
  - Test: Start/stop streaming works
- [ ] **T047** Create `useTorrentDownloader()` composable
  - Test: Download starts and progresses
- [ ] **T048** Create `useNetwork()` composable
  - Test: Network status detected
- [ ] **T049** Create `useHaptics()` composable
  - Test: Haptic feedback triggers
- [ ] **T050** Create `useStatusBar()` composable
  - Test: Status bar color changes

---

## Phase 3: Content Discovery (Tasks 51-70)

### 3.1 Movie Browser
- [x] **T051** Create `MovieCard.svelte` component
  - Test: Poster, title, rating render
- [x] **T052** Create `ContentGrid.svelte` for responsive grid
  - Test: Grid columns adjust to width
- [x] **T053** Implement infinite scroll pagination
  - Test: More items load on scroll
- [x] **T054** Create movies route `/movies/+page.svelte`
  - Test: Page loads and displays movies
- [x] **T055** Implement category tabs (Popular, Trending, Top Rated)
  - Test: Tabs switch content

### 3.2 TV Show Browser
- [x] **T056** Create `ShowCard.svelte` component
  - Test: Show poster and info render
- [x] **T057** Create shows route `/shows/+page.svelte`
  - Test: Page loads TV shows
- [x] **T058** Implement show category tabs
  - Test: Categories filter correctly
- [ ] **T059** Add "Continue Watching" section
  - Test: In-progress shows display
- [ ] **T060** Implement "New Episodes" section
  - Test: Recent episodes listed

### 3.3 Anime Browser
- [ ] **T061** Create anime route `/anime/+page.svelte`
  - Test: Anime content loads
- [ ] **T062** Implement anime-specific filters (sub/dub)
  - Test: Filter toggles work
- [ ] **T063** Add seasonal anime sections
  - Test: Current season shows
- [ ] **T064** Integrate anime metadata source
  - Test: Anime info populates

### 3.4 Search & Filters
- [x] **T065** Create `SearchBar.svelte` with debounce
  - Test: Search triggers after typing stops
- [x] **T066** Create `FilterSheet.svelte` bottom sheet
  - Test: Sheet opens and closes
- [x] **T067** Implement genre filter chips
  - Test: Genre selection filters content
- [x] **T068** Implement year range filter
  - Test: Year filter works
- [x] **T069** Implement rating filter
  - Test: Rating filter works
- [ ] **T070** Create search results page
  - Test: Results display for query

---

## Phase 4: Content Details (Tasks 71-90)

### 4.1 Movie Detail Page
- [x] **T071** Create `/movies/[id]/+page.svelte` route
  - Test: Route params work
- [x] **T072** Create `DetailHero.svelte` with backdrop
  - Test: Backdrop image loads
- [x] **T073** Display movie metadata (year, runtime, rating, genres)
  - Test: All metadata displays
- [x] **T074** Create `CastList.svelte` horizontal scroll
  - Test: Cast members render
- [ ] **T075** Implement "Add to Favorites" button
  - Test: Favorite toggles
- [ ] **T076** Create `TorrentList.svelte` for available torrents
  - Test: Torrents list renders
- [ ] **T077** Implement torrent quality badges
  - Test: Quality tags display (720p, 1080p, 4K)
- [x] **T078** Create "Play" action button
  - Test: Play button triggers streaming

### 4.2 TV Show Detail Page
- [x] **T079** Create `/shows/[id]/+page.svelte` route
  - Test: Show details load
- [ ] **T080** Create `SeasonPicker.svelte` selector
  - Test: Season selection works
- [~] **T081** Create `EpisodeList.svelte` with episode cards
  - Test: Episodes render with thumbnails
- [ ] **T082** Implement episode watch status indicators
  - Test: Watched episodes marked
- [ ] **T083** Create episode detail expandable
  - Test: Episode info expands
- [ ] **T084** Implement "Next Episode" auto-select
  - Test: Next unwatched selected

### 4.3 Torrent Selection
- [ ] **T085** Create `TorrentSelector.svelte` action sheet
  - Test: Sheet opens with torrents
- [ ] **T086** Display torrent metadata (size, seeders, source)
  - Test: Metadata displays
- [ ] **T087** Implement quality preference sorting
  - Test: Preferred quality on top
- [ ] **T088** Create magnet link input option
  - Test: Manual magnet entry works
- [ ] **T089** Implement torrent health indicator
  - Test: Health color shows
- [ ] **T090** Add "Download Instead" option
  - Test: Download option triggers downloader

---

## Phase 5: Video Playback (Tasks 91-110)

### 5.1 Video Player Core
- [ ] **T091** Create `VideoPlayer.svelte` wrapper component
  - Test: Video element renders
- [ ] **T092** Integrate with TorrentStreamer plugin
  - Test: Stream URL plays
- [ ] **T093** Implement HLS.js for HLS streams
  - Test: HLS playback works
- [ ] **T094** Create fullscreen mode handling
  - Test: Fullscreen toggles
- [ ] **T095** Implement orientation lock (landscape)
  - Test: Screen locks landscape

### 5.2 Player Controls
- [ ] **T096** Create `PlayerControls.svelte` overlay
  - Test: Controls show on tap
- [ ] **T097** Implement play/pause button
  - Test: Playback toggles
- [ ] **T098** Create seek bar with preview
  - Test: Seek changes position
- [ ] **T099** Implement skip forward/back (10s/30s)
  - Test: Skip buttons work
- [ ] **T100** Create volume control slider
  - Test: Volume changes
- [ ] **T101** Implement double-tap to seek gesture
  - Test: Double-tap skips

### 5.3 Quality & Subtitles
- [ ] **T102** Create `QualitySelector.svelte` sheet
  - Test: Quality options display
- [ ] **T103** Implement quality switching
  - Test: Quality changes without restart
- [ ] **T104** Create `SubtitleSelector.svelte` sheet
  - Test: Subtitle list shows
- [ ] **T105** Implement subtitle search integration
  - Test: Search finds subtitles
- [ ] **T106** Create subtitle renderer overlay
  - Test: Subtitles display in sync
- [ ] **T107** Implement subtitle timing adjustment
  - Test: Delay adjustment works

### 5.4 Playback Features
- [ ] **T108** Implement resume from last position
  - Test: Position restores
- [ ] **T109** Create next episode auto-play
  - Test: Next episode plays automatically
- [ ] **T110** Implement picture-in-picture mode
  - Test: PiP window opens

---

## Phase 6: Library & Downloads (Tasks 111-130)

### 6.1 Local Library
- [ ] **T111** Create `/library/+page.svelte` route
  - Test: Library page loads
- [ ] **T112** Create `LibraryGrid.svelte` for local files
  - Test: Files display in grid
- [ ] **T113** Implement folder picker integration
  - Test: Folder selection works
- [ ] **T114** Create library scanner service
  - Test: Scanner finds video files
- [ ] **T115** Implement metadata enrichment
  - Test: TMDB data added to files
- [ ] **T116** Create `ScanProgress.svelte` indicator
  - Test: Progress updates
- [ ] **T117** Implement folder management UI
  - Test: Add/remove folders works

### 6.2 Downloads Manager
- [ ] **T118** Create `/downloads/+page.svelte` route
  - Test: Downloads page loads
- [ ] **T119** Create `DownloadCard.svelte` component
  - Test: Download progress shows
- [ ] **T120** Implement download progress tracking
  - Test: Progress updates in real-time
- [ ] **T121** Create pause/resume/cancel actions
  - Test: All actions work
- [ ] **T122** Implement download queue management
  - Test: Queue reorders
- [ ] **T123** Create completed downloads section
  - Test: Completed items show
- [ ] **T124** Implement storage usage display
  - Test: Storage info accurate
- [ ] **T125** Create "Clear Completed" action
  - Test: Clears completed items

### 6.3 File Management
- [ ] **T126** Implement file deletion with confirmation
  - Test: Delete removes file
- [ ] **T127** Create file info modal
  - Test: File metadata shows
- [ ] **T128** Implement move to library action
  - Test: File moves correctly
- [ ] **T129** Create share file action
  - Test: Share sheet opens
- [ ] **T130** Implement open with external player
  - Test: External player launches

---

## Phase 7: User Features (Tasks 131-150)

### 7.1 Favorites System
- [x] **T131** Create `/favorites/+page.svelte` route
  - Test: Favorites page loads
- [ ] **T132** Implement favorites persistence (SQLite)
  - Test: Favorites persist
- [x] **T133** Create favorites grid view
  - Test: Favorites display
- [x] **T134** Implement remove from favorites
  - Test: Remove works
- [x] **T135** Add favorites empty state
  - Test: Empty message shows

### 7.2 Collections System
- [ ] **T136** Create `/collections/+page.svelte` route
  - Test: Collections page loads
- [ ] **T137** Create `CollectionCard.svelte` component
  - Test: Collection info renders
- [ ] **T138** Implement create collection flow
  - Test: New collection creates
- [ ] **T139** Create collection detail page
  - Test: Collection items show
- [ ] **T140** Implement add/remove from collection
  - Test: Items add/remove
- [ ] **T141** Create collection edit/delete
  - Test: Edit and delete work

### 7.3 Settings Pages
- [ ] **T142** Create `/settings/+page.svelte` route
  - Test: Settings page loads
- [ ] **T143** Create settings sections (Playback, Downloads, Appearance, About)
  - Test: All sections render
- [ ] **T144** Implement video quality preference
  - Test: Quality saves
- [ ] **T145** Implement subtitle language preference
  - Test: Language saves
- [ ] **T146** Create storage location picker
  - Test: Path saves
- [ ] **T147** Implement theme toggle (Dark/Light)
  - Test: Theme switches
- [ ] **T148** Create language selector
  - Test: Language changes
- [ ] **T149** Implement clear cache action
  - Test: Cache clears
- [ ] **T150** Create about/version info section
  - Test: Version displays

---

## Phase 8: Polish & Integration (Tasks 151-165)

### 8.1 Error Handling
- [ ] **T151** Create `ErrorBoundary.svelte` component
  - Test: Errors caught and displayed
- [ ] **T152** Implement offline mode detection
  - Test: Offline banner shows
- [ ] **T153** Create retry mechanisms for failed requests
  - Test: Retry works
- [ ] **T154** Implement error reporting (Sentry)
  - Test: Errors sent to Sentry

### 8.2 Performance
- [ ] **T155** Implement virtual scrolling for long lists
  - Test: Performance with 1000+ items
- [ ] **T156** Add image lazy loading
  - Test: Images load on scroll
- [ ] **T157** Implement route preloading
  - Test: Next route preloads
- [ ] **T158** Optimize bundle splitting
  - Test: Initial bundle < 100KB

### 8.3 Accessibility
- [ ] **T159** Add ARIA labels to all interactive elements
  - Test: Screen reader compatible
- [ ] **T160** Implement focus management
  - Test: Focus moves logically
- [ ] **T161** Ensure color contrast compliance
  - Test: WCAG AA pass
- [ ] **T162** Add reduced motion support
  - Test: Animations respect preference

### 8.4 Final Cleanup
- [ ] **T163** Remove all legacy Backbone/Marionette code
  - Test: No legacy imports
- [ ] **T164** Delete unused files and dependencies
  - Test: No dead code
- [ ] **T165** Update all documentation
  - Test: Docs match implementation

---

## E2E Test Scenarios (Playwright)

### Critical User Flows
- [ ] **E001** Browse movies → Select movie → Play torrent
- [ ] **E002** Search for content → View details → Add to favorites
- [ ] **E003** Open magnet link → Stream video → Adjust quality
- [ ] **E004** Scan library folder → View local files → Play local video
- [ ] **E005** Start download → Monitor progress → Play completed file
- [ ] **E006** Create collection → Add items → View collection
- [ ] **E007** Change settings → Verify persistence → App restart

---

## Summary

| Phase | Tasks | Tests Required |
|-------|-------|----------------|
| Phase 0: Infrastructure | 15 | 15 |
| Phase 1: Layout & Navigation | 15 | 15 |
| Phase 2: Core Services | 20 | 20 |
| Phase 3: Content Discovery | 20 | 20 |
| Phase 4: Content Details | 20 | 20 |
| Phase 5: Video Playback | 20 | 20 |
| Phase 6: Library & Downloads | 20 | 20 |
| Phase 7: User Features | 20 | 20 |
| Phase 8: Polish | 15 | 15 |
| **TOTAL** | **165** | **165** |

---

## Tracking Progress

```
Progress: [███░░░░░░░░░░░░░░░░░] 27/165 (16.4%)

Phase 0: [░░░░░░░░░░] 0/15
Phase 1: [██████░░░░] 9/15
Phase 2: [░░░░░░░░░░] 0/20
Phase 3: [██████░░░░] 8/20
Phase 4: [█████░░░░░] 6/20
Phase 5: [░░░░░░░░░░] 0/20
Phase 6: [░░░░░░░░░░] 0/20
Phase 7: [████░░░░░░] 4/20
Phase 8: [░░░░░░░░░░] 0/15
```
