# Database Schema Specification

**Document Version:** 1.0.0
**Last Updated:** 2025-11-13
**Status:** Production Ready

## Overview

FlixCapacitor Mobile uses SQLite for persistent data storage, managing favorites, library media files, and user preferences. The database is accessed through the @capacitor-community/sqlite plugin, providing type-safe TypeScript interfaces and native performance.

### Design Principles

1. **Simplicity** - Minimal tables, clear relationships, no over-normalization
2. **Performance** - Indexed columns for fast lookups
3. **Flexibility** - JSON columns for extensible metadata
4. **Type Safety** - TypeScript interfaces match SQL schema exactly
5. **Migration-Ready** - Schema versioning for future updates

## Database Configuration

### Technology Stack
- **Database Engine:** SQLite 3.x (via @capacitor-community/sqlite)
- **Location:** `/data/data/app.flixcapacitor.mobile/databases/flixcapacitor.db`
- **Access Pattern:** Single-connection, serialized writes
- **Encryption:** None (no sensitive data stored)

### Initialization
```typescript
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const db = await sqlite.createConnection('flixcapacitor', false, 'no-encryption', 1);
await db.open();
```

## Schema Overview

```
┌─────────────────────────────────────────────────────────┐
│                    favorites                            │
│  Stores user-favorited movies and TV shows             │
│                                                          │
│  PK: id (TEXT - IMDB ID or unique identifier)          │
│  Columns: title, year, poster, type, added_at          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               favorite_torrent_files                    │
│  Stores file-level favorites for multi-file torrents    │
│                                                          │
│  PK: id (TEXT - "torrent_hash:file_index")             │
│  Columns: torrent_hash, file_index, file_name,         │
│           movie_id, added_at                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    local_media                          │
│  Stores scanned media files from user's device folders │
│                                                          │
│  PK: id (INTEGER AUTOINCREMENT)                        │
│  Columns: title, original_filename, year, poster,      │
│           synopsis, rating, genres, runtime, file_uri,  │
│           folder_uri, folder_name, relative_path,       │
│           file_size, added_at                           │
└─────────────────────────────────────────────────────────┘
```

## Table Specifications

### 1. favorites

**Purpose:** Store user-favorited movies and TV shows

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,              -- IMDB ID (e.g., "tt1234567") or unique identifier
    title TEXT NOT NULL,              -- Movie/show title
    year TEXT,                        -- Release year (e.g., "2023")
    poster TEXT,                      -- Poster image URL
    type TEXT,                        -- Content type: "movie", "show", "anime"
    added_at INTEGER NOT NULL         -- Unix timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
```

**TypeScript Interface:**
```typescript
interface Favorite {
    id: string;                       // IMDB ID (e.g., "tt1234567")
    title: string;                    // "Inception"
    year?: string;                    // "2010"
    poster?: string;                  // "https://image.tmdb.org/..."
    type?: string;                    // "movie" | "show" | "anime"
    added_at: number;                 // Date.now()
}
```

**Example Data:**
```typescript
{
    id: "tt1375666",
    title: "Inception",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    type: "movie",
    added_at: 1699564800000
}
```

**Indexes:**
- **idx_favorites_added_at** - Fast retrieval of recently added favorites (DESC order)
- **idx_favorites_type** - Filter by content type (movies vs. shows vs. anime)

**Operations:**
```typescript
// Add favorite
await db.run(
    'INSERT OR REPLACE INTO favorites (id, title, year, poster, type, added_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, year, poster, type, Date.now()]
);

// Remove favorite
await db.run('DELETE FROM favorites WHERE id = ?', [id]);

// Check if favorite
const result = await db.query('SELECT id FROM favorites WHERE id = ?', [id]);
const isFavorite = result.values && result.values.length > 0;

// Get all favorites (sorted by recent)
const result = await db.query('SELECT * FROM favorites ORDER BY added_at DESC');
return result.values as Favorite[];
```

**Size Estimates:**
- Average row size: ~300 bytes (text fields + URLs)
- 1000 favorites: ~300 KB
- 10,000 favorites: ~3 MB

---

### 2. favorite_torrent_files

**Purpose:** Store file-level favorites within multi-file torrents (e.g., specific episodes in a TV show torrent)

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS favorite_torrent_files (
    id TEXT PRIMARY KEY,              -- Composite: "torrent_hash:file_index" (e.g., "abc123:5")
    torrent_hash TEXT NOT NULL,       -- Torrent infohash (40-char hex from magnet link)
    file_index INTEGER NOT NULL,      -- File position in torrent (0-based)
    file_name TEXT NOT NULL,          -- Display name (e.g., "S01E05.mp4")
    movie_id TEXT,                    -- Optional IMDB ID if known
    added_at INTEGER NOT NULL         -- Unix timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_favorite_files_hash ON favorite_torrent_files(torrent_hash);
CREATE INDEX IF NOT EXISTS idx_favorite_files_movie ON favorite_torrent_files(movie_id);
```

**TypeScript Interface:**
```typescript
interface FavoriteTorrentFile {
    id: string;                       // "abc123:5"
    torrent_hash: string;             // "abc123..." (40-char infohash)
    file_index: number;               // 5 (6th file in torrent)
    file_name: string;                // "Breaking Bad S01E05.mp4"
    movie_id?: string;                // "tt0903747" (optional)
    added_at: number;                 // Date.now()
}
```

**Example Data:**
```typescript
{
    id: "2f3c8a1b9d4e6f0a7c5b8d1e3a4f6c9b2d5e7a0b:5",
    torrent_hash: "2f3c8a1b9d4e6f0a7c5b8d1e3a4f6c9b2d5e7a0b",
    file_index: 5,
    file_name: "Breaking Bad S01E05.mp4",
    movie_id: "tt0903747",
    added_at: 1699564800000
}
```

**Indexes:**
- **idx_favorite_files_hash** - Fast lookup of all favorites for a torrent
- **idx_favorite_files_movie** - Group favorites by movie/show

**Operations:**
```typescript
// Add file-level favorite
await db.run(
    'INSERT OR REPLACE INTO favorite_torrent_files (id, torrent_hash, file_index, file_name, movie_id, added_at) VALUES (?, ?, ?, ?, ?, ?)',
    [`${hash}:${index}`, hash, index, fileName, movieId, Date.now()]
);

// Remove file-level favorite
await db.run('DELETE FROM favorite_torrent_files WHERE id = ?', [`${hash}:${index}`]);

// Get all favorited files for a torrent
const result = await db.query(
    'SELECT * FROM favorite_torrent_files WHERE torrent_hash = ? ORDER BY file_index',
    [hash]
);
return result.values as FavoriteTorrentFile[];

// Get favorited file indices (for UI state)
const result = await db.query(
    'SELECT file_index FROM favorite_torrent_files WHERE torrent_hash = ?',
    [hash]
);
return result.values.map(row => row.file_index);
```

**Size Estimates:**
- Average row size: ~150 bytes (text + integers)
- 1000 favorite files: ~150 KB
- 10,000 favorite files: ~1.5 MB

---

### 3. local_media

**Purpose:** Store metadata for media files scanned from user's device folders via DirectoryPicker

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS local_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,              -- Extracted or user-provided title
    original_filename TEXT NOT NULL,  -- Original file name (for matching)
    year TEXT,                        -- Release year (from TMDB/OMDB)
    poster TEXT,                      -- Poster image URL (from TMDB/OMDB)
    synopsis TEXT,                    -- Movie/show description
    rating REAL,                      -- IMDB rating (0-10)
    genres TEXT,                      -- JSON array: ["Action", "Thriller"]
    runtime INTEGER,                  -- Duration in minutes
    file_uri TEXT NOT NULL,           -- content:// URI for playback
    folder_uri TEXT NOT NULL,         -- content:// URI of parent folder
    folder_name TEXT,                 -- Human-readable folder name
    relative_path TEXT,               -- Path within folder (e.g., "Movies/Action/file.mp4")
    file_size INTEGER,                -- Size in bytes
    added_at INTEGER NOT NULL         -- Unix timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_local_media_title ON local_media(title);
CREATE INDEX IF NOT EXISTS idx_local_media_folder ON local_media(folder_uri);
CREATE INDEX IF NOT EXISTS idx_local_media_added ON local_media(added_at DESC);
```

**TypeScript Interface:**
```typescript
interface LocalMedia {
    id: number;                       // Auto-increment primary key
    title: string;                    // "Inception"
    original_filename: string;        // "Inception.2010.1080p.mp4"
    year?: string;                    // "2010"
    poster?: string;                  // "https://image.tmdb.org/..."
    synopsis?: string;                // "A thief who steals corporate..."
    rating?: number;                  // 8.8
    genres?: string;                  // '["Action","Sci-Fi","Thriller"]'
    runtime?: number;                 // 148 (minutes)
    file_uri: string;                 // "content://com.android.externalstorage.documents/..."
    folder_uri: string;               // "content://com.android.externalstorage.documents/tree/..."
    folder_name?: string;             // "Movies"
    relative_path?: string;           // "Action/Inception.2010.1080p.mp4"
    file_size?: number;               // 2147483648 (2 GB)
    added_at: number;                 // Date.now()
}
```

**Example Data:**
```typescript
{
    id: 42,
    title: "Inception",
    original_filename: "Inception.2010.1080p.mp4",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    synopsis: "A thief who steals corporate secrets through dream-sharing technology...",
    rating: 8.8,
    genres: '["Action","Sci-Fi","Thriller"]',
    runtime: 148,
    file_uri: "content://com.android.externalstorage.documents/document/primary%3AMovies%2FInception.2010.1080p.mp4",
    folder_uri: "content://com.android.externalstorage.documents/tree/primary%3AMovies",
    folder_name: "Movies",
    relative_path: "Inception.2010.1080p.mp4",
    file_size: 2147483648,
    added_at: 1699564800000
}
```

**Indexes:**
- **idx_local_media_title** - Fast search by title
- **idx_local_media_folder** - Group files by folder
- **idx_local_media_added** - Sort by recently added

**Operations:**
```typescript
// Add local media file
await db.run(
    `INSERT INTO local_media (
        title, original_filename, year, poster, synopsis, rating, genres, runtime,
        file_uri, folder_uri, folder_name, relative_path, file_size, added_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, filename, year, poster, synopsis, rating, JSON.stringify(genres), runtime,
     fileUri, folderUri, folderName, relativePath, fileSize, Date.now()]
);

// Get all local media (sorted by recent)
const result = await db.query('SELECT * FROM local_media ORDER BY added_at DESC');
return result.values as LocalMedia[];

// Search local media by title
const result = await db.query(
    'SELECT * FROM local_media WHERE title LIKE ? ORDER BY title',
    [`%${searchQuery}%`]
);
return result.values as LocalMedia[];

// Get files in specific folder
const result = await db.query(
    'SELECT * FROM local_media WHERE folder_uri = ? ORDER BY relative_path',
    [folderUri]
);
return result.values as LocalMedia[];

// Delete file
await db.run('DELETE FROM local_media WHERE id = ?', [id]);
```

**Size Estimates:**
- Average row size: ~1 KB (includes poster URL, synopsis, JSON genres)
- 1000 media files: ~1 MB
- 10,000 media files: ~10 MB

## Database Services

### SQLiteService (sqlite-service.ts)

**Purpose:** Centralized database operations, connection management, schema initialization

**Key Methods:**

#### initDatabase()
```typescript
async initDatabase(): Promise<void> {
    const db = await this.getConnection();

    // Create tables if not exist
    await db.execute(`
        CREATE TABLE IF NOT EXISTS favorites (...);
        CREATE TABLE IF NOT EXISTS favorite_torrent_files (...);
        CREATE TABLE IF NOT EXISTS local_media (...);

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites(added_at DESC);
        CREATE INDEX IF NOT EXISTS idx_favorite_files_hash ON favorite_torrent_files(torrent_hash);
        CREATE INDEX IF NOT EXISTS idx_local_media_title ON local_media(title);
        ...
    `);

    console.log('[SQLiteService] Database initialized');
}
```

#### query()
```typescript
async query(sql: string, params: any[] = []): Promise<DBQueryResult> {
    const db = await this.getConnection();
    const result = await db.query(sql, params);

    return {
        values: result.values || [],
        rowsAffected: result.changes?.changes || 0
    };
}
```

#### run()
```typescript
async run(sql: string, params: any[] = []): Promise<number> {
    const db = await this.getConnection();
    const result = await db.run(sql, params);

    return result.changes?.changes || 0;
}
```

#### transaction()
```typescript
async transaction<T>(callback: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
    const db = await this.getConnection();

    await db.execute('BEGIN TRANSACTION');

    try {
        const result = await callback(db);
        await db.execute('COMMIT');
        return result;
    } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
    }
}
```

### FavoritesService (favorites-service.ts)

**Purpose:** High-level favorites management API

**Key Methods:**

```typescript
class FavoritesService {
    // Movie/show favorites
    async addFavorite(id: string, title: string, year?: string, poster?: string, type?: string): Promise<void>;
    async removeFavorite(id: string): Promise<void>;
    async isFavorite(id: string): Promise<boolean>;
    async getAllFavorites(): Promise<Favorite[]>;

    // File-level favorites
    async addFavoriteTorrentFile(hash: string, index: number, name: string, movieId?: string): Promise<void>;
    async removeFavoriteTorrentFile(hash: string, index: number): Promise<void>;
    async isFavoriteTorrentFile(hash: string, index: number): Promise<boolean>;
    async getFavoriteTorrentFiles(hash: string): Promise<number[]>; // Returns file indices
}
```

### LibraryService (library-service.ts)

**Purpose:** Local media file management API

**Key Methods:**

```typescript
class LibraryService {
    async addMediaFromUri(fileUri: string, metadata: Partial<LocalMedia>): Promise<number>;
    async getAllMedia(): Promise<LocalMedia[]>;
    async searchMedia(query: string): Promise<LocalMedia[]>;
    async getMediaByFolder(folderUri: string): Promise<LocalMedia[]>;
    async deleteMedia(id: number): Promise<void>;
    async updateMedia(id: number, updates: Partial<LocalMedia>): Promise<void>;
}
```

## Data Migration Strategy

### Version 1 (Current)
- Initial schema with 3 tables
- No migrations required (fresh install)

### Future Migrations

**Version 2 (Hypothetical):**
```typescript
if (currentVersion < 2) {
    await db.execute(`
        ALTER TABLE local_media ADD COLUMN last_played_at INTEGER;
        ALTER TABLE local_media ADD COLUMN play_count INTEGER DEFAULT 0;
    `);
}
```

**Version 3 (Hypothetical):**
```typescript
if (currentVersion < 3) {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS watch_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            watched_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_watch_history_media ON watch_history(media_id);
    `);
}
```

### Migration Process
1. Check current database version: `PRAGMA user_version;`
2. Compare with app version (from capacitor.config.json or constants)
3. Run migrations sequentially (version 1→2→3→...)
4. Update database version: `PRAGMA user_version = N;`
5. Log migration success/failure

## Performance Optimization

### Query Optimization
- **Use indexes** on frequently queried columns (title, added_at, folder_uri)
- **Limit result sets** with `LIMIT N` clauses for large tables
- **Use prepared statements** to avoid SQL injection and improve performance
- **Batch inserts** with transactions for multiple files

### Index Strategy
```sql
-- Covering index for favorites list (no table lookup needed)
CREATE INDEX idx_favorites_list ON favorites(added_at DESC, id, title, poster, type);

-- Composite index for torrent file lookups
CREATE INDEX idx_favorite_files_lookup ON favorite_torrent_files(torrent_hash, file_index);
```

### Transaction Batching
```typescript
// Bad: Multiple individual inserts
for (const file of files) {
    await db.run('INSERT INTO local_media (...) VALUES (...)', [...]);
}

// Good: Single transaction
await sqliteService.transaction(async (db) => {
    for (const file of files) {
        await db.run('INSERT INTO local_media (...) VALUES (...)', [...]);
    }
});
```

## Backup and Restore

### Manual Backup
```typescript
// Export database to JSON
async exportDatabase(): Promise<string> {
    const favorites = await favoritesService.getAllFavorites();
    const media = await libraryService.getAllMedia();

    const backup = {
        version: 1,
        timestamp: Date.now(),
        data: {
            favorites,
            favorite_files: await this.exportFavoriteFiles(),
            local_media: media
        }
    };

    return JSON.stringify(backup, null, 2);
}

// Import database from JSON
async importDatabase(jsonData: string): Promise<void> {
    const backup = JSON.parse(jsonData);

    await sqliteService.transaction(async (db) => {
        // Clear existing data
        await db.run('DELETE FROM favorites');
        await db.run('DELETE FROM favorite_torrent_files');
        await db.run('DELETE FROM local_media');

        // Import data
        for (const fav of backup.data.favorites) {
            await favoritesService.addFavorite(fav.id, fav.title, ...);
        }
        // ... import other tables
    });
}
```

### Auto-Backup (Future)
- Export to `/sdcard/Android/data/app.flixcapacitor.mobile/files/Backups/`
- Schedule daily backups (Android WorkManager)
- Keep last 7 backups, delete older
- Option to export to cloud storage (Google Drive, Dropbox)

## Security Considerations

### Data Sensitivity
- **No passwords** - Database contains no authentication credentials
- **No personal info** - Only movie titles, poster URLs, file paths
- **Public data** - IMDB IDs and metadata are public information
- **Local only** - Database never synced to external servers

### Access Control
- **App-private storage** - Database only accessible by FlixCapacitor app
- **No encryption** - Not needed (no sensitive data)
- **File permissions** - Android enforces app sandboxing automatically
- **SQLite injection** - Prevented by parameterized queries

### Privacy
- **User-local** - No telemetry or analytics on database contents
- **Offline-first** - Works without internet connection
- **Uninstall cleanup** - Database deleted on app uninstall (default behavior)

## Testing Strategy

### Unit Tests
```typescript
describe('FavoritesService', () => {
    test('addFavorite() inserts row', async () => {
        await favoritesService.addFavorite('tt1234567', 'Test Movie', '2023');
        const isFav = await favoritesService.isFavorite('tt1234567');
        expect(isFav).toBe(true);
    });

    test('removeFavorite() deletes row', async () => {
        await favoritesService.addFavorite('tt1234567', 'Test Movie');
        await favoritesService.removeFavorite('tt1234567');
        const isFav = await favoritesService.isFavorite('tt1234567');
        expect(isFav).toBe(false);
    });
});
```

### Integration Tests
- Add 1000 favorites → Query all → Verify performance (<100ms)
- Add 10,000 local media files → Search by title → Verify index usage
- Simulate app crash mid-transaction → Verify database integrity

### Manual Tests
- Add favorite → Restart app → Verify favorite persists
- Scan folder with 500 files → Verify all files added to database
- Delete media → Verify removed from library view
- Export database → Import on fresh install → Verify data restored

## References

### External Documentation
- **SQLite Documentation:** https://www.sqlite.org/docs.html
- **@capacitor-community/sqlite:** https://github.com/capacitor-community/sqlite
- **Android Storage:** https://developer.android.com/training/data-storage/sqlite

### Related Specifications
- [Architecture Overview](ARCHITECTURE.md)
- [Library Folder Picker](LIBRARY-FOLDER-PICKER.md)
- [File-Level Favorites](FILE-LEVEL-FAVORITES.md)

### Code References
- `src/app/lib/sqlite-service.ts` - Database connection and query execution
- `src/app/lib/favorites-service.ts` - Favorites management API
- `src/app/lib/library-service.ts` - Local media management API

---

*Document authored by Claude Code on 2025-11-13*
*Schema reflects production database structure of FlixCapacitor Mobile v1.0.0*
