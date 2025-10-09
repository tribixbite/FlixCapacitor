# NeDB Database Schema Analysis

Analysis of the existing NeDB databases for SQLite migration.

## Database Files

Located in `{data_path}/data/`:
- `bookmarks.db`
- `settings.db`
- `shows.db`
- `movies.db`
- `watched.db`

---

## 1. Bookmarks Database

**Purpose:** Store user bookmarks for movies and TV shows

**Schema:**
```javascript
{
  imdb_id: String,  // UNIQUE INDEX
  type: String      // 'movie' or 'show'
}
```

**Operations:**
- `addBookmark(imdb_id, type)` - Insert bookmark
- `deleteBookmark(imdb_id)` - Remove bookmark
- `deleteBookmarks()` - Clear all bookmarks
- `getBookmarks(data)` - Paginated query (50 per page)
- `getAllBookmarks()` - Get all bookmark IDs

**SQLite Equivalent:**
```sql
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imdb_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bookmarks_type ON bookmarks(type);
```

---

## 2. Settings Database

**Purpose:** Store application settings as key-value pairs

**Schema:**
```javascript
{
  key: String,    // UNIQUE INDEX
  value: Any      // Any JSON-serializable value
}
```

**Operations:**
- `getSetting(data)` - Get single setting by key
- `getSettings()` - Get all settings
- `writeSetting(data)` - Upsert setting (update or insert)
- `resetSettings()` - Clear all settings

**Notes:**
- Used for app configuration (language, API endpoints, UI state, etc.)
- Values are loaded into global `Settings` object on startup
- Already being migrated to Capacitor Preferences in Phase 2

**SQLite Equivalent:**
```sql
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Movies Database

**Purpose:** Cache movie metadata

**Schema:**
```javascript
{
  imdb_id: String,  // Initially had UNIQUE INDEX (later removed)
  // Plus all movie metadata fields from API
}
```

**Operations:**
- `addMovie(data)` - Insert movie
- `deleteMovie(imdb_id)` - Remove movie
- `getMovie(imdb_id)` - Find movie by IMDB ID

**Notes:**
- Indexes removed (line 56-57 in database.js)
- Used as cache, not critical data
- Can be regenerated from API

**SQLite Equivalent:**
```sql
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imdb_id TEXT NOT NULL,
    title TEXT,
    year INTEGER,
    rating REAL,
    runtime INTEGER,
    synopsis TEXT,
    poster TEXT,
    backdrop TEXT,
    genres TEXT,
    trailer TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_movies_imdb ON movies(imdb_id);
```

---

## 4. TV Shows Database

**Purpose:** Cache TV show metadata

**Schema:**
```javascript
{
  imdb_id: String,  // UNIQUE INDEX
  tvdb_id: String,  // UNIQUE INDEX
  // Plus all show metadata fields from API
}
```

**Operations:**
- `addTVShow(data)` - Insert show
- `updateTVShow(data)` - Update show by imdb_id
- `deleteTVShow(imdb_id)` - Remove show
- `getTVShow(data)` - Find by tvdb_id (deprecated)
- `getTVShowByImdb(imdb_id)` - Find by imdb_id

**SQLite Equivalent:**
```sql
CREATE TABLE IF NOT EXISTS tvshows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imdb_id TEXT NOT NULL UNIQUE,
    tvdb_id TEXT NOT NULL UNIQUE,
    title TEXT,
    year INTEGER,
    rating REAL,
    num_seasons INTEGER,
    synopsis TEXT,
    poster TEXT,
    backdrop TEXT,
    genres TEXT,
    status TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tvshows_imdb ON tvshows(imdb_id);
CREATE INDEX idx_tvshows_tvdb ON tvshows(tvdb_id);
```

---

## 5. Watched Database

**Purpose:** Track watched movies and episodes

**Schema for Movies:**
```javascript
{
  movie_id: String,  // IMDB ID
  date: Date,
  type: 'movie'
}
```

**Schema for Episodes:**
```javascript
{
  tvdb_id: String,
  imdb_id: String,
  season: String,
  episode: String,
  type: 'episode',
  date: Date
}
```

**Operations:**
- `markMovieAsWatched(data)` - Insert movie watch record
- `markMovieAsNotWatched(data)` - Remove movie watch record
- `getMoviesWatched()` - Get all watched movies
- `markEpisodeAsWatched(data)` - Insert episode watch record
- `markEpisodeAsNotWatched(data)` - Remove episode watch record
- `checkEpisodeWatched(data)` - Check if episode is watched
- `getEpisodesWatched(tvdb_id)` - Get watched episodes for show
- `getAllEpisodesWatched()` - Get all watched episodes
- `deleteWatched()` - Clear all watch history

**Notes:**
- Two different schemas in one collection (differentiated by `type` field)
- Episodes track season/episode numbers as strings
- Watch dates are stored for potential analytics

**SQLite Equivalent (Separate Tables):**
```sql
CREATE TABLE IF NOT EXISTS watched_movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id TEXT NOT NULL,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_watched_movies_id ON watched_movies(movie_id);

CREATE TABLE IF NOT EXISTS watched_episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tvdb_id TEXT NOT NULL,
    imdb_id TEXT NOT NULL,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_watched_episodes_tvdb ON watched_episodes(tvdb_id);
CREATE INDEX idx_watched_episodes_show ON watched_episodes(imdb_id);
CREATE UNIQUE INDEX idx_watched_episodes_unique ON watched_episodes(tvdb_id, season, episode);
```

---

## Global Arrays Maintained in Memory

These arrays are populated from database on startup:

```javascript
App.userBookmarks = []     // Array of IMDB IDs
App.watchedMovies = []     // Array of movie_id strings
App.watchedShows = []      // Array of IMDB IDs
```

**Usage:**
- Fast lookups without database queries
- Updated when items are added/removed
- Loaded via `Database.getUserInfo()` on app start

---

## Migration Strategy

### Phase 1: Install SQLite Plugin
```bash
npm install @capacitor-community/sqlite
```

### Phase 2: Create SQLite Service
- Wrapper for Capacitor SQLite plugin
- Promise-based API matching NeDB interface
- Connection pooling and error handling

### Phase 3: Schema Migration
- Create all tables on first launch
- Version management for schema updates
- Optional data import from NeDB (desktop → mobile)

### Phase 4: Database.js Refactor
- Replace NeDB operations with SQLite queries
- Maintain same public API for compatibility
- Update in-memory arrays on CRUD operations

### Phase 5: Testing
- Verify all CRUD operations
- Test watch status persistence
- Test bookmark persistence
- Test settings migration

---

## Data Volumes (Estimated)

- **Bookmarks:** ~100-500 items typical
- **Settings:** ~50 key-value pairs
- **Movies Cache:** ~1000-5000 items
- **TV Shows Cache:** ~500-2000 items
- **Watched Movies:** ~100-1000 items
- **Watched Episodes:** ~500-5000 items

**Total:** Light database load, SQLite will perform excellently.

---

## Critical Considerations

1. **Settings Already Migrated:** Phase 2 moved settings to Capacitor Preferences. Consider removing settings table from SQLite schema.

2. **Cache vs Critical Data:**
   - Movies/Shows databases are cache → can be cleared/regenerated
   - Watched items are critical user data → must be backed up
   - Bookmarks are critical user data → must be backed up

3. **String vs Integer:**
   - NeDB stores season/episode as strings
   - SQLite should store as integers for proper sorting
   - Migration must handle conversion

4. **Timezone:**
   - Desktop sets TZ to 'America/New_York' (line 8)
   - Mobile should use device timezone
   - Dates should be stored as UTC

5. **Sync Consideration:**
   - Future Trakt.tv sync can backup/restore watched items
   - Consider exporting watched data to Trakt on first mobile launch
