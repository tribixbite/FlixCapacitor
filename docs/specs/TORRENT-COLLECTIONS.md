# Torrent Collections Feature Specification

**Version:** 1.0.0
**Status:** Design Complete - Ready for Implementation
**Created:** 2025-11-16
**Last Updated:** 2025-11-16
**Designed By:** Claude Code + Gemini 2.5 Pro

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Technical Design](#technical-design)
4. [Database Schema](#database-schema)
5. [Cloud Sync Strategy](#cloud-sync-strategy)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Service Layer](#service-layer)
8. [UI/UX Design](#uiux-design)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Testing Strategy](#testing-strategy)
11. [Known Limitations](#known-limitations)
12. [Future Enhancements](#future-enhancements)
13. [References](#references)

---

## Overview

### Purpose
Add **Torrent Collections** - a playlist-like feature that allows users to organize torrents into named collections (e.g., "Marvel Movies", "Breaking Bad Complete", "Study Materials") with cloud sync across devices.

### User Value
- **Organization:** Group related torrents for easier access
- **Discovery:** Create thematic collections ("Best Sci-Fi", "Weekend Binge")
- **Convenience:** Auto-play through collection items (binge mode)
- **Cloud Sync:** Collections sync automatically across all logged-in devices
- **Sharing:** Share collections with other users (Phase 2+)

### Complexity: Medium
- **Database:** 3 new tables (torrents, collections, collection_torrents)
- **Services:** 3 new service classes (TorrentsService, CollectionsService, CollectionSyncService)
- **UI:** 4 new views (Collections List, Collection Detail, Create/Edit Modal, Context Menu)
- **Sync:** Last Write Wins (LWW) conflict resolution with Supabase
- **Lines of Code:** ~1,200 estimated

### Key Design Decisions
1. **Torrent Persistence:** New `torrents` table to persist torrent metadata (currently torrents are ephemeral)
2. **UUID-based Sync:** Collections use client-generated UUIDs for stable cross-device references
3. **Soft Deletes:** Use `is_deleted` flag instead of hard deletes for sync propagation
4. **Last Write Wins:** Simple conflict resolution using `updated_at` timestamps
5. **MVP Reordering:** Move Up/Down buttons (drag-and-drop deferred to Phase 2)
6. **IMDB Integration:** Optional `imdb_id` column links torrents to movies/tvshows metadata

---

## Requirements

### Functional Requirements

**FR1:** Users shall create named collections with optional description and cover image
**FR2:** Users shall add/remove torrents to/from collections
**FR3:** Users shall reorder torrents within a collection (MVP: Move Up/Down buttons)
**FR4:** Users shall rename/edit/delete collections
**FR5:** Collections shall sync automatically across devices when logged in
**FR6:** Users shall view all collections in a grid layout
**FR7:** Users shall view collection details with all torrents in a vertical list
**FR8:** Users shall add torrents to collections from search results (context menu)
**FR9:** System shall persist torrent metadata (name, magnet, size, quality, seeders)
**FR10:** System shall optionally link torrents to IMDB metadata for rich display

### Non-Functional Requirements

**NFR1:** Collection sync latency < 5 seconds on fast network
**NFR2:** Offline-first: All operations work without network, sync when available
**NFR3:** Conflict resolution: Last Write Wins (LWW) using `updated_at` timestamps
**NFR4:** Data integrity: Foreign keys with CASCADE deletes prevent orphaned data
**NFR5:** Security: Supabase Row-Level Security (RLS) policies enforce user isolation
**NFR6:** Performance: Collections list shall render < 500ms for 100 collections
**NFR7:** Storage: Keep torrent metadata indefinitely (storage is cheap)

---

## Technical Design

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      UI Layer                              │
│  - CollectionsListView (grid)                             │
│  - CollectionDetailView (torrent list)                    │
│  - CreateCollectionModal (name, description, cover)       │
│  - AddToCollectionMenu (context menu)                     │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────┴──────────────────────────────────────────┐
│                   Service Layer                            │
│  - CollectionsService (CRUD, reorder)                     │
│  - TorrentsService (persist, fetch)                       │
│  - CollectionSyncService (push/pull)                      │
│  - SQLiteService (schema + migrations)                    │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────┴──────────────────────────────────────────┐
│                   Data Layer                               │
│  - Local SQLite (3 new tables)                            │
│  - Supabase PostgreSQL (3 mirrored tables + RLS)         │
│  - Sync: Last Write Wins (LWW) using updated_at          │
└───────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **User adds torrent to collection:**
   - UI calls `CollectionsService.addTorrentToCollection(uuid, infoHash)`
   - Service calls `TorrentsService.ensureTorrentExists(torrentData)` to persist torrent
   - Service inserts into `collection_torrents` with auto-incremented `sort_order`
   - Service updates `collections.updated_at` to trigger sync
   - UI re-renders collection detail view

2. **User creates collection:**
   - UI calls `CollectionsService.createCollection({ name, description, cover })`
   - Service generates UUID via `crypto.randomUUID()`
   - Service inserts into local `collections` table
   - Background sync pushes to Supabase (if logged in)

3. **App startup sync:**
   - App calls `CollectionSyncService.sync()` on launch and network-online events
   - Service fetches Supabase records modified after `last_synced_at`
   - Service applies LWW merge (newer `updated_at` wins)
   - Service pushes local changes to Supabase

### Data Flow Diagram

```
User Action → UI → CollectionsService → SQLiteService → Local DB
                         │                                  │
                         │                                  │
                         └────> CollectionSyncService ──────┘
                                         │
                                         ▼
                                  Supabase (cloud)
                                         │
                                         ▼
                             Other Devices (pull sync)
```

---

## Database Schema

### SQLite Local Schema

#### 1. `torrents` Table (NEW)
Persists torrent metadata (currently torrents are ephemeral and not stored).

```sql
CREATE TABLE torrents (
    info_hash TEXT PRIMARY KEY,           -- Torrent info hash (unique identifier)
    user_id TEXT,                          -- User who added (for Supabase sync)
    name TEXT NOT NULL,                    -- Torrent display name
    magnet_link TEXT NOT NULL UNIQUE,      -- Full magnet link
    size_bytes INTEGER,                    -- Total size in bytes
    quality TEXT,                          -- Video quality (e.g., "1080p", "720p")
    cached_seeders INTEGER,                -- Last known seeder count
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imdb_id TEXT,                          -- Optional IMDB link for metadata
    FOREIGN KEY(imdb_id) REFERENCES movies(imdb_id) ON DELETE SET NULL
);

CREATE INDEX idx_torrents_user_id ON torrents(user_id);
CREATE INDEX idx_torrents_imdb_id ON torrents(imdb_id);
```

**Rationale:**
- `info_hash` as PK ensures no duplicate torrents
- `magnet_link` UNIQUE constraint prevents duplicates via different info hashes
- `imdb_id` FK allows joining with `movies`/`tvshows` tables for rich UI (poster, title, rating)
- `user_id` enables Supabase RLS policies
- Keep torrents even when removed from all collections (storage is cheap, user might re-add later)

#### 2. `collections` Table (NEW)
Stores collection metadata.

```sql
CREATE TABLE collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Local DB ID
    uuid TEXT NOT NULL UNIQUE,             -- Client-generated UUID (sync key)
    user_id TEXT,                          -- User who created (for Supabase sync)
    name TEXT NOT NULL,                    -- Collection name (e.g., "Marvel Movies")
    description TEXT,                      -- Optional description
    cover_image_url TEXT,                  -- Optional cover image URL
    is_public BOOLEAN DEFAULT 0,           -- Public sharing (Phase 2+)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- LWW conflict resolution
    is_deleted BOOLEAN DEFAULT 0,          -- Soft delete for sync propagation
    last_synced_at TIMESTAMP               -- Last successful sync timestamp
);

CREATE INDEX idx_collections_uuid ON collections(uuid);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_updated_at ON collections(updated_at);
```

**Rationale:**
- `uuid` as sync key (not `id` which varies across devices)
- `updated_at` for Last Write Wins (LWW) conflict resolution
- `is_deleted` for soft deletes (hard deletes don't sync well)
- `last_synced_at` tracks last successful push to Supabase

#### 3. `collection_torrents` Table (NEW)
Many-to-many join table with explicit ordering.

```sql
CREATE TABLE collection_torrents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_uuid TEXT NOT NULL,         -- FK to collections(uuid)
    torrent_info_hash TEXT NOT NULL,       -- FK to torrents(info_hash)
    sort_order INTEGER NOT NULL,           -- Display order (0-indexed)
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(collection_uuid) REFERENCES collections(uuid) ON DELETE CASCADE,
    FOREIGN KEY(torrent_info_hash) REFERENCES torrents(info_hash) ON DELETE CASCADE,
    UNIQUE(collection_uuid, torrent_info_hash)  -- Prevent duplicates
);

CREATE INDEX idx_collection_torrents_collection ON collection_torrents(collection_uuid);
CREATE INDEX idx_collection_torrents_torrent ON collection_torrents(torrent_info_hash);
```

**Rationale:**
- CASCADE deletes: Deleting collection removes all items, deleting torrent removes from all collections
- UNIQUE constraint prevents adding same torrent twice to a collection
- `sort_order` enables explicit ordering (user-controlled via Move Up/Down)

### Supabase PostgreSQL Schema

Mirror the SQLite schema in Supabase with identical structure (replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`, `BOOLEAN` with `BOOLEAN`, `TIMESTAMP` with `TIMESTAMPTZ`).

```sql
-- Supabase mirrors SQLite structure
CREATE TABLE torrents (
    info_hash TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    magnet_link TEXT NOT NULL UNIQUE,
    size_bytes BIGINT,
    quality TEXT,
    cached_seeders INTEGER,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    imdb_id TEXT
);

CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ
);

CREATE TABLE collection_torrents (
    id SERIAL PRIMARY KEY,
    collection_uuid UUID NOT NULL REFERENCES collections(uuid) ON DELETE CASCADE,
    torrent_info_hash TEXT NOT NULL REFERENCES torrents(info_hash) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_uuid, torrent_info_hash)
);
```

### Supabase Row-Level Security (RLS) Policies

Enforce user isolation: Users can only access their own data.

```sql
-- Enable RLS on collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own collections"
ON collections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on torrents
ALTER TABLE torrents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own torrents"
ON torrents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on collection_torrents
ALTER TABLE collection_torrents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in their own collections"
ON collection_torrents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.uuid = collection_torrents.collection_uuid
      AND collections.user_id = auth.uid()
  )
);
```

---

## Cloud Sync Strategy

### Last Write Wins (LWW) Algorithm

**Conflict Resolution Rule:** Newer `updated_at` timestamp wins.

#### Sync Flow (on app startup / network-online event)

1. **Pull Phase (Supabase → Local):**
   - Fetch all Supabase collections where `updated_at > last_synced_at` OR locally missing
   - For each remote collection:
     - If local record missing: Insert locally
     - If local `updated_at < remote updated_at`: Overwrite local (LWW)
     - If local `updated_at >= remote updated_at`: Skip (local is newer)
   - Apply same logic for `torrents` and `collection_torrents`

2. **Push Phase (Local → Supabase):**
   - Fetch all local collections where `updated_at > last_synced_at` OR never synced
   - For each local collection:
     - Upsert to Supabase (INSERT ... ON CONFLICT UPDATE)
     - Update local `last_synced_at = NOW()`
   - Apply same logic for `torrents` and `collection_torrents`

#### Conflict Scenarios

| Scenario | Local `updated_at` | Remote `updated_at` | Resolution |
|----------|-------------------|---------------------|------------|
| Remote newer | 2025-11-16 10:00 | 2025-11-16 10:05 | Overwrite local |
| Local newer | 2025-11-16 10:10 | 2025-11-16 10:05 | Push to remote |
| Simultaneous edit (rare) | 2025-11-16 10:05:00 | 2025-11-16 10:05:01 | Remote wins (by 1 second) |

**Note:** LWW is simple and predictable. For multi-user collaborative collections (Phase 3), switch to Operational Transformation (OT) or CRDTs.

#### Implementation Pseudo-code

```typescript
async function syncCollections(supabase: SupabaseClient): Promise<SyncResult> {
  const result = { pulled: 0, pushed: 0, conflicts: 0 };

  // PULL: Remote → Local
  const remoteCollections = await supabase
    .from('collections')
    .select('*')
    .gt('updated_at', getLastSyncTimestamp())
    .eq('user_id', getCurrentUserId());

  for (const remote of remoteCollections.data) {
    const local = await db.getCollection(remote.uuid);

    if (!local) {
      await db.insertCollection(remote);
      result.pulled++;
    } else if (new Date(local.updated_at) < new Date(remote.updated_at)) {
      await db.updateCollection(remote.uuid, remote);
      result.pulled++;
      result.conflicts++;
    }
  }

  // PUSH: Local → Remote
  const localCollections = await db.getUnsyncedCollections();

  for (const local of localCollections) {
    await supabase.from('collections').upsert({
      uuid: local.uuid,
      user_id: local.user_id,
      name: local.name,
      description: local.description,
      cover_image_url: local.cover_image_url,
      is_public: local.is_public,
      created_at: local.created_at,
      updated_at: local.updated_at,
      is_deleted: local.is_deleted
    }, { onConflict: 'uuid' });

    await db.updateLastSyncedAt(local.uuid);
    result.pushed++;
  }

  return result;
}
```

---

## TypeScript Interfaces

### Core Data Models

```typescript
/**
 * Collection metadata
 */
export interface Collection {
  uuid: string;                  // Client-generated UUID (sync key)
  user_id: string;               // User ID (Supabase auth.uid())
  name: string;                  // Collection name (e.g., "Marvel Movies")
  description?: string;          // Optional description
  cover_image_url?: string;      // Optional cover image URL
  is_public: boolean;            // Public sharing (Phase 2+)
  is_deleted: boolean;           // Soft delete flag
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp (LWW key)
  last_synced_at?: string;       // Last successful sync timestamp
}

/**
 * Torrent metadata (persisted)
 */
export interface Torrent {
  info_hash: string;             // Torrent info hash (unique identifier)
  user_id: string;               // User who added
  name: string;                  // Torrent display name
  magnet_link: string;           // Full magnet link
  size_bytes?: number;           // Total size in bytes
  quality?: string;              // Video quality (e.g., "1080p")
  cached_seeders?: number;       // Last known seeder count
  added_at: string;              // ISO 8601 timestamp
  imdb_id?: string;              // Optional IMDB link
}

/**
 * Collection-torrent join record
 */
export interface CollectionTorrent {
  id?: number;                   // Local DB ID (auto-increment)
  collection_uuid: string;       // FK to collections(uuid)
  torrent_info_hash: string;     // FK to torrents(info_hash)
  sort_order: number;            // Display order (0-indexed)
  added_at: string;              // ISO 8601 timestamp
}

/**
 * Collection with embedded torrents (for UI display)
 */
export interface CollectionWithTorrents extends Collection {
  items: (Torrent & { sort_order: number })[];
}

/**
 * Sync result summary
 */
export interface SyncResult {
  pulled: number;                // Records pulled from Supabase
  pushed: number;                // Records pushed to Supabase
  conflicts: number;             // Conflicts resolved (LWW)
}
```

---

## Service Layer

### TorrentsService

Manages torrent persistence (torrents are currently ephemeral).

```typescript
export class TorrentsService {
  private db: SQLiteService;

  /**
   * Ensure torrent exists in database (upsert)
   * Called before adding torrent to collection
   */
  async ensureTorrentExists(torrentData: Omit<Torrent, 'user_id' | 'added_at'>): Promise<void> {
    const existing = await this.getTorrent(torrentData.info_hash);
    if (!existing) {
      await this.db.run(
        `INSERT INTO torrents (info_hash, user_id, name, magnet_link, size_bytes, quality, cached_seeders, imdb_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          torrentData.info_hash,
          await this.getUserId(),
          torrentData.name,
          torrentData.magnet_link,
          torrentData.size_bytes || null,
          torrentData.quality || null,
          torrentData.cached_seeders || null,
          torrentData.imdb_id || null
        ]
      );
    }
  }

  /**
   * Get torrent by info hash
   */
  async getTorrent(infoHash: string): Promise<Torrent | undefined> {
    const result = await this.db.query<Torrent>(
      'SELECT * FROM torrents WHERE info_hash = ?',
      [infoHash]
    );
    return result.values?.[0];
  }

  /**
   * Find IMDB ID for torrent (background task)
   * Parses torrent name → queries TMDB → stores imdb_id
   */
  async findImdbIdForTorrent(infoHash: string): Promise<string | null> {
    const torrent = await this.getTorrent(infoHash);
    if (!torrent) return null;

    // TODO: Implement TMDB search + name parsing
    // - Parse year from torrent name (regex: /\((\d{4})\)/)
    // - Extract title (remove year, quality tags)
    // - Query TMDB search API
    // - Store imdb_id in database

    return null;
  }

  private async getUserId(): Promise<string> {
    // Get current user ID from Supabase auth
    return 'user-id-placeholder';
  }
}
```

### CollectionsService

Manages collections CRUD operations.

```typescript
export class CollectionsService {
  private db: SQLiteService;
  private torrentsService: TorrentsService;

  /**
   * Get all collections (excluding soft-deleted)
   */
  async getAllCollections(): Promise<Collection[]> {
    const result = await this.db.query<Collection>(
      'SELECT * FROM collections WHERE is_deleted = 0 ORDER BY updated_at DESC'
    );
    return result.values || [];
  }

  /**
   * Get collection with all torrents (for detail view)
   */
  async getCollectionWithTorrents(uuid: string): Promise<CollectionWithTorrents | undefined> {
    const collection = await this.db.query<Collection>(
      'SELECT * FROM collections WHERE uuid = ? AND is_deleted = 0',
      [uuid]
    );

    if (!collection.values?.[0]) return undefined;

    const torrents = await this.db.query<Torrent & { sort_order: number }>(
      `SELECT t.*, ct.sort_order
       FROM torrents t
       JOIN collection_torrents ct ON t.info_hash = ct.torrent_info_hash
       WHERE ct.collection_uuid = ?
       ORDER BY ct.sort_order ASC`,
      [uuid]
    );

    return {
      ...collection.values[0],
      items: torrents.values || []
    };
  }

  /**
   * Create new collection
   */
  async createCollection(data: {
    name: string;
    description?: string;
    cover_image_url?: string;
  }): Promise<Collection> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO collections (uuid, user_id, name, description, cover_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        await this.getUserId(),
        data.name,
        data.description || null,
        data.cover_image_url || null,
        now,
        now
      ]
    );

    return {
      uuid,
      user_id: await this.getUserId(),
      name: data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      is_public: false,
      is_deleted: false,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Update collection metadata
   */
  async updateCollection(
    uuid: string,
    data: { name?: string; description?: string; cover_image_url?: string }
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.cover_image_url !== undefined) {
      updates.push('cover_image_url = ?');
      params.push(data.cover_image_url);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(uuid);

    await this.db.run(
      `UPDATE collections SET ${updates.join(', ')} WHERE uuid = ?`,
      params
    );
  }

  /**
   * Delete collection (soft delete)
   */
  async deleteCollection(uuid: string): Promise<void> {
    await this.db.run(
      'UPDATE collections SET is_deleted = 1, updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), uuid]
    );
  }

  /**
   * Add torrent to collection
   */
  async addTorrentToCollection(collectionUuid: string, torrentInfoHash: string): Promise<void> {
    // Ensure torrent exists in database
    // (torrentData should be passed from caller with magnet link, name, etc.)
    // await this.torrentsService.ensureTorrentExists(torrentData);

    // Get next sort_order
    const maxOrder = await this.db.query<{ max_order: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM collection_torrents WHERE collection_uuid = ?',
      [collectionUuid]
    );
    const nextOrder = (maxOrder.values?.[0]?.max_order ?? -1) + 1;

    // Insert join record
    await this.db.run(
      `INSERT INTO collection_torrents (collection_uuid, torrent_info_hash, sort_order)
       VALUES (?, ?, ?)`,
      [collectionUuid, torrentInfoHash, nextOrder]
    );

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );
  }

  /**
   * Remove torrent from collection
   */
  async removeTorrentFromCollection(collectionUuid: string, torrentInfoHash: string): Promise<void> {
    await this.db.run(
      'DELETE FROM collection_torrents WHERE collection_uuid = ? AND torrent_info_hash = ?',
      [collectionUuid, torrentInfoHash]
    );

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );
  }

  /**
   * Update torrent order within collection
   * @param orderedInfoHashes Array of info hashes in desired order
   */
  async updateTorrentOrder(collectionUuid: string, orderedInfoHashes: string[]): Promise<void> {
    // Update sort_order for each torrent
    for (let i = 0; i < orderedInfoHashes.length; i++) {
      await this.db.run(
        `UPDATE collection_torrents
         SET sort_order = ?
         WHERE collection_uuid = ? AND torrent_info_hash = ?`,
        [i, collectionUuid, orderedInfoHashes[i]]
      );
    }

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );
  }

  private async getUserId(): Promise<string> {
    return 'user-id-placeholder';
  }
}
```

### CollectionSyncService

Orchestrates cloud sync with Supabase.

```typescript
export class CollectionSyncService {
  private db: SQLiteService;
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.db = new SQLiteService();
  }

  /**
   * Full sync: Pull from Supabase → Push to Supabase
   * Called on app startup and network-online events
   */
  async sync(): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0 };

    // Sync collections
    const collectionsResult = await this.syncCollections();
    result.pulled += collectionsResult.pulled;
    result.pushed += collectionsResult.pushed;
    result.conflicts += collectionsResult.conflicts;

    // Sync torrents
    const torrentsResult = await this.syncTorrents();
    result.pulled += torrentsResult.pulled;
    result.pushed += torrentsResult.pushed;

    // Sync collection_torrents
    const itemsResult = await this.syncCollectionTorrents();
    result.pulled += itemsResult.pulled;
    result.pushed += itemsResult.pushed;

    return result;
  }

  private async syncCollections(): Promise<SyncResult> {
    // Implementation similar to pseudo-code above
    // See "Cloud Sync Strategy" section
    return { pulled: 0, pushed: 0, conflicts: 0 };
  }

  private async syncTorrents(): Promise<SyncResult> {
    // Similar to syncCollections but for torrents table
    return { pulled: 0, pushed: 0, conflicts: 0 };
  }

  private async syncCollectionTorrents(): Promise<SyncResult> {
    // Sync join table (no updated_at, just insert/delete)
    return { pulled: 0, pushed: 0, conflicts: 0 };
  }
}
```

---

## UI/UX Design

### 1. Collections List View (Grid)

**Location:** New "Collections" tab in main navigation

**Layout:**
- Grid layout (2 columns on phone, 3-4 on tablet)
- Each card shows: Cover image (or default), collection name, item count
- FAB (Floating Action Button) in bottom-right: "+" to create new collection

**Interactions:**
- Tap card → Navigate to Collection Detail View
- Long-press card → Show context menu (Edit, Delete, Share [Phase 2+])

**Wireframe:**
```
┌────────────────────────────────────┐
│  Collections               [+]     │
├────────────────────────────────────┤
│ ┌────────┐  ┌────────┐            │
│ │ Marvel │  │Breaking│            │
│ │ Movies │  │  Bad   │            │
│ │ 23 items│  │ 5 items│            │
│ └────────┘  └────────┘            │
│ ┌────────┐  ┌────────┐            │
│ │  Study │  │Workout │            │
│ │  Vids  │  │  Music │            │
│ │ 12 items│  │ 8 items│            │
│ └────────┘  └────────┘            │
└────────────────────────────────────┘
```

### 2. Collection Detail View (Vertical List)

**Location:** Navigated from Collections List View

**Layout:**
- Header: Collection name, description, item count, Edit button
- Vertical list of torrents with:
  * Movie poster (if imdb_id linked) or torrent icon
  * Torrent name, size, quality, seeders
  * Move Up/Down buttons (MVP) or drag handle (Phase 2)
  * Remove button (trash icon)
- Empty state: "No torrents yet. Add from search results."

**Interactions:**
- Tap torrent → Start streaming (same as regular torrent playback)
- Tap Move Up/Down → Reorder torrent
- Tap Remove → Remove from collection (with confirmation)
- Tap Edit (header) → Open edit modal

**Wireframe:**
```
┌────────────────────────────────────┐
│  ← Marvel Movies          [Edit]   │
│  23 items                          │
├────────────────────────────────────┤
│ ┌──┐ Iron Man (2008)               │
│ │🎬│ 1080p • 2.3 GB • 120 seeders │
│ └──┘ [↑][↓][🗑]                    │
├────────────────────────────────────┤
│ ┌──┐ The Avengers (2012)           │
│ │🎬│ 1080p • 3.1 GB • 85 seeders  │
│ └──┘ [↑][↓][🗑]                    │
├────────────────────────────────────┤
│ ...                                │
└────────────────────────────────────┘
```

### 3. Create/Edit Collection Modal

**Trigger:** FAB "+" button (create) or Edit button (edit)

**Fields:**
- Collection Name (required, text input)
- Description (optional, textarea)
- Cover Image URL (optional, text input) [Phase 2: Image picker]

**Buttons:**
- Save (primary)
- Cancel (secondary)

**Wireframe:**
```
┌────────────────────────────────────┐
│  Create Collection                 │
├────────────────────────────────────┤
│  Name: [Marvel Movies____________] │
│                                    │
│  Description:                      │
│  [All Marvel Cinematic Universe___]│
│  [movies in chronological order___]│
│                                    │
│  Cover Image URL:                  │
│  [https://example.com/cover.jpg___]│
│                                    │
│  [Cancel]              [Save]      │
└────────────────────────────────────┘
```

### 4. Add to Collection Context Menu

**Trigger:** Long-press torrent in search results

**Menu Items:**
- "Add to Collection" → Sub-menu with all collections
  * [Collection 1]
  * [Collection 2]
  * [+ Create New Collection]

**Behavior:**
- Select collection → Add torrent to collection + show toast "Added to {collection name}"
- Select "Create New Collection" → Open create modal, auto-add torrent after creation

---

## Implementation Roadmap

### Phase 1: MVP (Local Functionality + Cloud Sync) - 3-5 days

**Day 1: Database & Services**
- [ ] Write SQLite migration script for 3 new tables (torrents, collections, collection_torrents)
- [ ] Update SQLiteService schema to v2.0.0
- [ ] Implement TorrentsService (ensureTorrentExists, getTorrent)
- [ ] Implement CollectionsService (all CRUD methods)
- [ ] Write unit tests for services

**Day 2: Supabase Setup**
- [ ] Create Supabase tables (collections, torrents, collection_torrents)
- [ ] Apply RLS policies
- [ ] Test Supabase CRUD via SQL console
- [ ] Implement CollectionSyncService (sync orchestrator)
- [ ] Test sync with mock data

**Day 3: UI - Collections List**
- [ ] Create CollectionsListView (Backbone.Marionette view)
- [ ] Implement grid layout with Tailwind CSS
- [ ] Add FAB button for creating collections
- [ ] Add create/edit modal (CollectionFormView)
- [ ] Wire up CollectionsService to UI

**Day 4: UI - Collection Detail**
- [ ] Create CollectionDetailView
- [ ] Implement vertical torrent list
- [ ] Add Move Up/Down buttons for reordering
- [ ] Add remove torrent functionality
- [ ] Implement empty state

**Day 5: Integration & Testing**
- [ ] Add "Add to Collection" context menu to search results
- [ ] Hook sync to app startup (main.ts)
- [ ] Hook sync to network-online event
- [ ] Manual testing: Create, edit, delete, reorder
- [ ] Multi-device sync testing (2 devices)

**Deliverables:**
- ✅ Fully functional local collections
- ✅ Cloud sync with LWW conflict resolution
- ✅ Basic reordering (Move Up/Down buttons)
- ✅ Add torrents from search results

### Phase 2: Enhanced UX (2-3 days)

**Day 6: Drag-and-Drop Reordering**
- [ ] Replace Move Up/Down buttons with drag handles
- [ ] Implement touch drag-and-drop (HTML5 Drag API or library)
- [ ] Add visual feedback during drag
- [ ] Test on tablet and phone

**Day 7: Auto-Play / Binge Mode**
- [ ] Add "Play All" button to collection detail
- [ ] Integrate with existing PlaybackQueue service
- [ ] Auto-advance to next torrent in collection
- [ ] Show "Up Next" notification

**Day 8: Public Sharing**
- [ ] Add "Make Public" toggle to collection settings
- [ ] Generate shareable link (e.g., `/collections/{uuid}`)
- [ ] Implement read-only view for public collections
- [ ] Update RLS policies for public access

**Deliverables:**
- ✅ Improved reordering UX
- ✅ Binge-watching mode
- ✅ Public collection sharing

### Phase 3: Advanced Features (Future)

**Smart Collections:**
- Auto-populate collections based on rules (e.g., "All 1080p Marvel movies")
- Saved search queries as dynamic collections

**Collaborative Collections:**
- Multi-user editing with Operational Transformation (OT) or CRDTs
- Real-time updates via Supabase Realtime

**Import/Export:**
- Export collection as JSON or M3U playlist
- Import from other apps (Plex, Kodi)

**IMDB Metadata Background Task:**
- Auto-fetch IMDB IDs for all torrents
- Show rich metadata (poster, rating, cast) in collections

---

## Testing Strategy

### Unit Tests

**TorrentsService:**
- ✅ `ensureTorrentExists()` inserts new torrent
- ✅ `ensureTorrentExists()` skips existing torrent (idempotent)
- ✅ `getTorrent()` returns torrent by info_hash
- ✅ `getTorrent()` returns undefined for non-existent torrent

**CollectionsService:**
- ✅ `createCollection()` generates UUID and inserts record
- ✅ `updateCollection()` updates name/description and updated_at
- ✅ `deleteCollection()` sets is_deleted flag (soft delete)
- ✅ `addTorrentToCollection()` increments sort_order correctly
- ✅ `removeTorrentFromCollection()` deletes join record
- ✅ `updateTorrentOrder()` updates sort_order for all items

**CollectionSyncService:**
- ✅ `sync()` pulls newer remote records (LWW)
- ✅ `sync()` pushes unsynced local records
- ✅ `sync()` resolves conflicts (newer updated_at wins)
- ✅ `sync()` handles soft deletes (propagates is_deleted flag)

### Integration Tests

- ✅ Create collection → Add torrent → Reorder → Sync → Verify on second device
- ✅ Edit collection on Device A → Edit same collection on Device B → Sync → Verify LWW
- ✅ Delete collection on Device A → Sync → Verify soft delete on Device B
- ✅ Add torrent to collection → Remove from collection → Verify torrent still in database

### Manual Testing

**Single Device:**
1. Create 3 collections with different names
2. Add 5 torrents to first collection
3. Reorder torrents using Move Up/Down
4. Edit collection name and description
5. Remove 2 torrents from collection
6. Delete 1 collection
7. Verify all operations persist after app restart

**Multi-Device Sync:**
1. Create collection on Device A
2. Open app on Device B → Verify collection appears
3. Add torrent on Device B
4. Refresh Device A → Verify torrent appears
5. Edit collection name on both devices simultaneously
6. Sync → Verify LWW (newer edit wins)
7. Delete collection on Device A
8. Sync Device B → Verify collection is deleted (soft delete)

**Edge Cases:**
- Create collection with 100+ torrents (performance test)
- Sync with poor network (intermittent connectivity)
- Sync with large time difference between devices (clock skew)
- Add same torrent to multiple collections (verify no duplicates)
- Remove torrent from database while in collection (verify CASCADE delete)

---

## Known Limitations

### MVP Limitations (Phase 1)

1. **Reordering UX:** Move Up/Down buttons instead of drag-and-drop (deferred to Phase 2)
2. **Cover Images:** URL input only, no image picker/upload (Phase 2)
3. **IMDB Metadata:** Manual linking, no auto-fetch (background task in Phase 3)
4. **Conflict Resolution:** Last Write Wins (LWW) only, no granular field-level merging
5. **Public Sharing:** Not implemented in Phase 1 (Phase 2)
6. **Offline Queue:** Sync operations queued but not persisted across app restarts

### Technical Constraints

1. **Clock Skew:** LWW assumes synchronized device clocks (use NTP or server timestamps in future)
2. **Supabase Limits:** Free tier has 500 MB database limit (monitor usage)
3. **Torrent Persistence:** Torrents kept indefinitely (no auto-cleanup in MVP)
4. **Simultaneous Edits:** LWW may lose data in rare simultaneous edit scenarios (acceptable for single-user app)

### Future Enhancements Needed

1. **Operational Transformation (OT):** For multi-user collaborative collections
2. **Undo/Redo:** For accidental deletions
3. **Collection Templates:** Pre-made collections (e.g., "Top 100 Movies")
4. **Analytics:** Track most popular collections, torrents

---

## Future Enhancements

### Phase 2 Features (Prioritized)

1. **Drag-and-Drop Reordering:** Replace Move Up/Down with touch drag
2. **Auto-Play Mode:** "Play All" button for binge-watching
3. **Public Sharing:** Generate shareable links for collections
4. **Image Picker:** Native image picker for cover images (Capacitor plugin)
5. **Collection Search:** Search torrents within collection

### Phase 3 Features (Backlog)

1. **Smart Collections:** Rule-based auto-population (e.g., "All 1080p movies")
2. **Collaborative Collections:** Multi-user editing with real-time sync
3. **Import/Export:** JSON, M3U, Plex playlist formats
4. **IMDB Auto-Linking:** Background task to fetch metadata
5. **Collection Analytics:** Most-played torrents, watch time
6. **Collection Templates:** Pre-made collections for popular series
7. **Nested Collections:** Sub-collections (e.g., "Marvel > Phase 1")
8. **Collection Tags:** Tag collections for filtering (e.g., #sci-fi, #action)

---

## References

### Related Documentation
- **[Database Schema](DATABASE-SCHEMA.md)** - Existing SQLite schema (movies, tvshows, bookmarks)
- **[Cloud Sync Architecture](CLOUD-SYNC-ARCHITECTURE.md)** - Supabase integration patterns
- **[Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)** - Torrent playback architecture

### Code Files
- `src/app/lib/sqlite-service.ts` - SQLite wrapper (add new tables here)
- `src/app/lib/supabase-client.ts` - Supabase client initialization
- `src/app/models/` - Add Collection, Torrent, CollectionTorrent models
- `src/app/views/` - Add CollectionsListView, CollectionDetailView, CollectionFormView

### External Resources
- **[Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)** - Row-Level Security policies
- **[HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)** - For drag-and-drop reordering
- **[UUID Best Practices](https://www.postgresql.org/docs/current/datatype-uuid.html)** - UUID as primary keys
- **[Last Write Wins (LWW) Conflict Resolution](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type#LWW-Element-Set)** - CRDT theory

### Design Artifacts
- Gemini 2.5 Pro Consultation Logs (2025-11-16)
  * Query 1: Comprehensive feature design (data model, UX, cloud sync)
  * Query 2: Updated design with torrents table persistence
  * Query 3: UI/UX flows, RLS policies, TypeScript interfaces, implementation checklist

---

**End of Specification**

*This document represents the complete technical specification for the Torrent Collections feature, designed collaboratively by Claude Code and Gemini 2.5 Pro on 2025-11-16.*
