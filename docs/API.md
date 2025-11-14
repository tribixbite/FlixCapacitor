# FlixCapacitor API Reference

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Author:** FlixCapacitor Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Service Layer APIs](#service-layer-apis)
   - [FavoritesService](#favoritesservice)
   - [LibraryService](#libraryservice)
   - [WatchlistService](#watchlistservice)
   - [SettingsManager](#settingsmanager)
   - [SQLiteService](#sqliteservice)
   - [StreamingService](#streamingservice)
   - [NativeTorrentClient](#nativetorrentclient)
   - [BatteryService](#batteryservice)
   - [API Client (Supabase)](#api-client-supabase)
3. [View Layer APIs](#view-layer-apis)
   - [MovieListView](#movielistview)
   - [PlayerView](#playerview)
   - [SettingsView](#settingsview)
   - [AuthModalView](#authmodalview)
4. [Model & Collection APIs](#model--collection-apis)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

---

## Overview

FlixCapacitor's API is organized into three main layers:

1. **Service Layer**: Business logic and data operations
2. **View Layer**: UI components and user interactions (Marionette views)
3. **Data Layer**: Models and collections (Backbone)

All services are available globally via `window` object:
```typescript
window.FavoritesService
window.LibraryService
window.SettingsManager
window.SQLiteService
// ... etc
```

---

## Service Layer APIs

### FavoritesService

**Location:** `src/app/lib/favorites-service.ts`
**Purpose:** Manage user favorites with local SQLite storage and optional cloud sync

#### Methods

##### `async addFavorite(movie: MovieItem): Promise<void>`

Add a movie/show to favorites.

**Parameters:**
- `movie` (MovieItem): Movie or show object to add

**Returns:** `Promise<void>`

**Throws:** Error if database operation fails

**Example:**
```typescript
await FavoritesService.addFavorite({
  movieId: 'tt1234567',
  title: 'Inception',
  year: 2010,
  posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  movieType: 'movie'
});
```

##### `async removeFavorite(movieId: string): Promise<void>`

Remove a movie/show from favorites.

**Parameters:**
- `movieId` (string): IMDb ID or unique identifier

**Returns:** `Promise<void>`

**Example:**
```typescript
await FavoritesService.removeFavorite('tt1234567');
```

##### `async getFavorites(): Promise<MovieItem[]>`

Get all favorites.

**Returns:** `Promise<MovieItem[]>` - Array of favorite items

**Example:**
```typescript
const favorites = await FavoritesService.getFavorites();
console.log(`You have ${favorites.length} favorites`);
```

##### `async isFavorite(movieId: string): Promise<boolean>`

Check if a movie is in favorites.

**Parameters:**
- `movieId` (string): IMDb ID to check

**Returns:** `Promise<boolean>` - True if favorited, false otherwise

**Example:**
```typescript
const isFav = await FavoritesService.isFavorite('tt1234567');
if (isFav) {
  console.log('Already in favorites');
}
```

##### `async syncToCloud(): Promise<SyncResult>`

Push local favorites to cloud (Supabase).

**Returns:** `Promise<SyncResult>` - Success status and error message if failed

**Requires:** User must be authenticated

**Example:**
```typescript
const result = await FavoritesService.syncToCloud();
if (result.success) {
  console.log('Favorites synced to cloud');
} else {
  console.error('Sync failed:', result.error);
}
```

##### `async syncFromCloud(): Promise<SyncResult>`

Pull favorites from cloud and merge with local.

**Returns:** `Promise<SyncResult>` - Success status and error message if failed

**Requires:** User must be authenticated

**Example:**
```typescript
const result = await FavoritesService.syncFromCloud();
if (result.success) {
  console.log('Favorites synced from cloud');
}
```

##### `async autoSyncAdd(movie: MovieItem): Promise<void>`

Automatically sync to cloud after adding (non-blocking).

**Parameters:**
- `movie` (MovieItem): Movie that was added

**Returns:** `Promise<void>`

**Note:** Errors are logged but don't throw

**Example:**
```typescript
// Called automatically by addFavorite()
await FavoritesService.autoSyncAdd(movie);
```

##### `async autoSyncRemove(movieId: string): Promise<void>`

Automatically sync to cloud after removing (non-blocking).

**Parameters:**
- `movieId` (string): Movie ID that was removed

**Returns:** `Promise<void>`

**Example:**
```typescript
// Called automatically by removeFavorite()
await FavoritesService.autoSyncRemove('tt1234567');
```

---

### LibraryService

**Location:** `src/app/lib/library-service.ts`
**Purpose:** Manage personal library of local video files

#### Methods

##### `async initialize(): Promise<void>`

Initialize the library service and SQLite database.

**Returns:** `Promise<void>`

**Example:**
```typescript
await LibraryService.initialize();
```

##### `async addItem(item: LibraryItem): Promise<Result>`

Add a new item to the library.

**Parameters:**
- `item` (LibraryItem): Library item to add

**Returns:** `Promise<Result>` - Success status and inserted ID

**Example:**
```typescript
const result = await LibraryService.addItem({
  title: 'My Home Video',
  filePath: '/storage/emulated/0/Movies/video.mp4',
  fileSize: 1024000000,
  duration: 7200,
  addedAt: Date.now()
});

if (result.success) {
  console.log('Item added with ID:', result.data);
}
```

##### `async getItems(): Promise<LibraryItem[]>`

Get all library items.

**Returns:** `Promise<LibraryItem[]>` - Array of library items

**Example:**
```typescript
const items = await LibraryService.getItems();
items.forEach(item => {
  console.log(`${item.title} - ${item.duration}s`);
});
```

##### `async getItem(id: number): Promise<LibraryItem | null>`

Get a specific library item by ID.

**Parameters:**
- `id` (number): Library item ID

**Returns:** `Promise<LibraryItem | null>` - Item or null if not found

**Example:**
```typescript
const item = await LibraryService.getItem(42);
if (item) {
  console.log('Found:', item.title);
}
```

##### `async updateItem(id: number, updates: Partial<LibraryItem>): Promise<Result>`

Update a library item.

**Parameters:**
- `id` (number): Library item ID
- `updates` (Partial<LibraryItem>): Fields to update

**Returns:** `Promise<Result>` - Success status

**Example:**
```typescript
await LibraryService.updateItem(42, {
  title: 'Updated Title',
  thumbnailPath: '/path/to/thumbnail.jpg'
});
```

##### `async deleteItem(id: number): Promise<Result>`

Delete a library item.

**Parameters:**
- `id` (number): Library item ID

**Returns:** `Promise<Result>` - Success status

**Example:**
```typescript
const result = await LibraryService.deleteItem(42);
if (result.success) {
  console.log('Item deleted');
}
```

##### `async searchItems(query: string): Promise<LibraryItem[]>`

Search library items by title.

**Parameters:**
- `query` (string): Search query

**Returns:** `Promise<LibraryItem[]>` - Matching items

**Example:**
```typescript
const results = await LibraryService.searchItems('vacation');
console.log(`Found ${results.length} matching items`);
```

---

### WatchlistService

**Location:** `src/app/lib/watchlist-service.ts`
**Purpose:** Manage user watchlist (movies to watch later)

#### Methods

##### `async addToWatchlist(movie: MovieItem): Promise<void>`

Add a movie to watchlist.

**Parameters:**
- `movie` (MovieItem): Movie to add

**Returns:** `Promise<void>`

**Example:**
```typescript
await WatchlistService.addToWatchlist({
  movieId: 'tt9999999',
  title: 'The Matrix 4',
  year: 2021
});
```

##### `async removeFromWatchlist(movieId: string): Promise<void>`

Remove a movie from watchlist.

**Parameters:**
- `movieId` (string): Movie ID to remove

**Returns:** `Promise<void>`

**Example:**
```typescript
await WatchlistService.removeFromWatchlist('tt9999999');
```

##### `async getWatchlist(): Promise<MovieItem[]>`

Get all watchlist items.

**Returns:** `Promise<MovieItem[]>` - Array of watchlist items

**Example:**
```typescript
const watchlist = await WatchlistService.getWatchlist();
```

##### `async isInWatchlist(movieId: string): Promise<boolean>`

Check if a movie is in watchlist.

**Parameters:**
- `movieId` (string): Movie ID to check

**Returns:** `Promise<boolean>` - True if in watchlist

**Example:**
```typescript
const inWatchlist = await WatchlistService.isInWatchlist('tt9999999');
```

##### `async clearWatchlist(): Promise<void>`

Clear all watchlist items.

**Returns:** `Promise<void>`

**Example:**
```typescript
await WatchlistService.clearWatchlist();
```

---

### SettingsManager

**Location:** `src/app/lib/settings-manager.ts`
**Purpose:** Manage application settings with localStorage persistence

#### Properties

```typescript
interface AppSettings {
  streamingServerUrl: string;
  movieProvider: 'curated' | 'publicdomaintorrents';
  customApiEndpoints: CustomEndpoint[];
  quality: string;
  subtitlesLanguage: string;
  autoplayNext: boolean;
  tmdbApiKey: string;
  omdbApiKey: string;
}
```

#### Methods

##### `get<K extends SettingKey>(key: K): AppSettings[K]`

Get a setting value.

**Parameters:**
- `key` (SettingKey): Setting key

**Returns:** Setting value

**Example:**
```typescript
const quality = SettingsManager.get('quality');
console.log('Current quality:', quality); // '720p'
```

##### `set<K extends SettingKey>(key: K, value: AppSettings[K]): void`

Set a setting value (saves automatically).

**Parameters:**
- `key` (SettingKey): Setting key
- `value` (AppSettings[K]): New value

**Returns:** void

**Example:**
```typescript
SettingsManager.set('quality', '1080p');
SettingsManager.set('autoplayNext', false);
```

##### `load(): AppSettings`

Load settings from localStorage.

**Returns:** `AppSettings` - Loaded settings or defaults

**Example:**
```typescript
const settings = SettingsManager.load();
```

##### `save(): void`

Save current settings to localStorage.

**Returns:** void

**Example:**
```typescript
SettingsManager.save();
```

##### `reset(): void`

Reset all settings to defaults.

**Returns:** void

**Example:**
```typescript
SettingsManager.reset();
```

##### `initialize(): void`

Initialize settings and apply them.

**Returns:** void

**Example:**
```typescript
SettingsManager.initialize();
```

##### `async syncToCloud(): Promise<SyncResult>`

Sync settings to cloud (Supabase).

**Returns:** `Promise<SyncResult>` - Success status and error if failed

**Requires:** User must be authenticated

**Example:**
```typescript
const result = await SettingsManager.syncToCloud();
if (result.success) {
  console.log('Settings backed up to cloud');
}
```

##### `async syncFromCloud(): Promise<SyncResult>`

Sync settings from cloud and merge with local.

**Returns:** `Promise<SyncResult>` - Success status and error if failed

**Example:**
```typescript
const result = await SettingsManager.syncFromCloud();
if (result.success) {
  console.log('Settings restored from cloud');
}
```

##### `addCustomEndpoint(name: string, url: string): void`

Add a custom API endpoint.

**Parameters:**
- `name` (string): Endpoint name
- `url` (string): Endpoint URL

**Returns:** void

**Example:**
```typescript
SettingsManager.addCustomEndpoint('My Server', 'https://myserver.com/api');
```

##### `removeCustomEndpoint(id: string): void`

Remove a custom API endpoint.

**Parameters:**
- `id` (string): Endpoint ID

**Returns:** void

**Example:**
```typescript
SettingsManager.removeCustomEndpoint('1699999999999');
```

##### `toggleCustomEndpoint(id: string): void`

Toggle custom endpoint enabled state.

**Parameters:**
- `id` (string): Endpoint ID

**Returns:** void

**Example:**
```typescript
SettingsManager.toggleCustomEndpoint('1699999999999');
```

##### `getEnabledEndpoints(): CustomEndpoint[]`

Get all enabled custom endpoints.

**Returns:** `CustomEndpoint[]` - Array of enabled endpoints

**Example:**
```typescript
const endpoints = SettingsManager.getEnabledEndpoints();
endpoints.forEach(ep => console.log(ep.name, ep.url));
```

---

### SQLiteService

**Location:** `src/app/lib/sqlite-service.ts`
**Purpose:** SQLite database wrapper for structured data storage

#### Methods

##### `async initialize(): Promise<void>`

Initialize SQLite database and create tables.

**Returns:** `Promise<void>`

**Example:**
```typescript
await SQLiteService.initialize();
```

##### `async query(sql: string, params: any[]): Promise<any[]>`

Execute a SQL query.

**Parameters:**
- `sql` (string): SQL query
- `params` (any[]): Query parameters

**Returns:** `Promise<any[]>` - Query results

**Example:**
```typescript
const results = await SQLiteService.query(
  'SELECT * FROM favorites WHERE year > ?',
  [2020]
);
```

##### `async insert(table: string, data: object): Promise<number>`

Insert a record into a table.

**Parameters:**
- `table` (string): Table name
- `data` (object): Record data

**Returns:** `Promise<number>` - Inserted record ID

**Example:**
```typescript
const id = await SQLiteService.insert('favorites', {
  movieId: 'tt1234567',
  title: 'Inception',
  year: 2010
});
```

##### `async update(table: string, id: number, data: object): Promise<void>`

Update a record.

**Parameters:**
- `table` (string): Table name
- `id` (number): Record ID
- `data` (object): Updated fields

**Returns:** `Promise<void>`

**Example:**
```typescript
await SQLiteService.update('library_items', 42, {
  title: 'Updated Title',
  watchedAt: Date.now()
});
```

##### `async delete(table: string, id: number): Promise<void>`

Delete a record.

**Parameters:**
- `table` (string): Table name
- `id` (number): Record ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await SQLiteService.delete('playback_queue', 5);
```

##### `async findOne(table: string, conditions: object): Promise<any | null>`

Find a single record matching conditions.

**Parameters:**
- `table` (string): Table name
- `conditions` (object): WHERE conditions

**Returns:** `Promise<any | null>` - Record or null

**Example:**
```typescript
const favorite = await SQLiteService.findOne('favorites', {
  movieId: 'tt1234567'
});
```

##### `async findAll(table: string, conditions?: object): Promise<any[]>`

Find all records matching conditions.

**Parameters:**
- `table` (string): Table name
- `conditions` (object, optional): WHERE conditions

**Returns:** `Promise<any[]>` - Array of records

**Example:**
```typescript
const recentFavorites = await SQLiteService.findAll('favorites', {
  addedAt: { '>': Date.now() - 86400000 } // Last 24 hours
});
```

---

### StreamingService

**Location:** `src/app/lib/streaming-service.ts`
**Purpose:** Interact with streaming API for movie/show metadata

#### Methods

##### `async getMovies(page: number = 1): Promise<Movie[]>`

Get paginated list of movies.

**Parameters:**
- `page` (number, optional): Page number (default: 1)

**Returns:** `Promise<Movie[]>` - Array of movies

**Example:**
```typescript
const movies = await StreamingService.getMovies(1);
```

##### `async getMovie(id: string): Promise<Movie>`

Get detailed movie information.

**Parameters:**
- `id` (string): Movie ID

**Returns:** `Promise<Movie>` - Movie details

**Example:**
```typescript
const movie = await StreamingService.getMovie('tt1234567');
console.log(movie.title, movie.plot);
```

##### `async searchMovies(query: string): Promise<Movie[]>`

Search for movies.

**Parameters:**
- `query` (string): Search query

**Returns:** `Promise<Movie[]>` - Search results

**Example:**
```typescript
const results = await StreamingService.searchMovies('inception');
```

##### `async getTorrents(movieId: string): Promise<Torrent[]>`

Get available torrents for a movie.

**Parameters:**
- `movieId` (string): Movie ID

**Returns:** `Promise<Torrent[]>` - Array of torrent options

**Example:**
```typescript
const torrents = await StreamingService.getTorrents('tt1234567');
torrents.forEach(t => {
  console.log(`${t.quality} - ${t.size} - ${t.seeds} seeds`);
});
```

##### `configure(url: string): void`

Configure streaming server URL.

**Parameters:**
- `url` (string): New server URL

**Returns:** void

**Example:**
```typescript
StreamingService.configure('https://myserver.com/api');
```

---

### NativeTorrentClient

**Location:** `src/app/lib/torrent-client.ts`
**Purpose:** Interface with native Android torrent streaming plugin

#### Methods

##### `async startTorrent(magnetUri: string): Promise<TorrentResult>`

Start streaming a torrent.

**Parameters:**
- `magnetUri` (string): Magnet link

**Returns:** `Promise<TorrentResult>` - Torrent ID and stream URL

**Example:**
```typescript
const result = await NativeTorrentClient.startTorrent(
  'magnet:?xt=urn:btih:...'
);
console.log('Stream URL:', result.streamUrl);
```

##### `async stopTorrent(torrentId: string): Promise<void>`

Stop a torrent.

**Parameters:**
- `torrentId` (string): Torrent ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await NativeTorrentClient.stopTorrent('abc123');
```

##### `async getTorrentStatus(torrentId: string): Promise<TorrentStatus>`

Get torrent download status.

**Parameters:**
- `torrentId` (string): Torrent ID

**Returns:** `Promise<TorrentStatus>` - Progress, speed, peers

**Example:**
```typescript
const status = await NativeTorrentClient.getTorrentStatus('abc123');
console.log(`Progress: ${status.progress * 100}%`);
console.log(`Download: ${status.downloadSpeed / 1024} KB/s`);
console.log(`Peers: ${status.numPeers}`);
```

##### `async pauseTorrent(torrentId: string): Promise<void>`

Pause a torrent download.

**Parameters:**
- `torrentId` (string): Torrent ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await NativeTorrentClient.pauseTorrent('abc123');
```

##### `async resumeTorrent(torrentId: string): Promise<void>`

Resume a paused torrent.

**Parameters:**
- `torrentId` (string): Torrent ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await NativeTorrentClient.resumeTorrent('abc123');
```

---

### BatteryService

**Location:** `src/app/lib/battery-service.ts`
**Purpose:** Monitor battery status and apply power-saving settings

#### Methods

##### `async initialize(): Promise<void>`

Initialize battery monitoring.

**Returns:** `Promise<void>`

**Example:**
```typescript
await BatteryService.initialize();
```

##### `async getBatteryInfo(): Promise<BatteryInfo>`

Get current battery information.

**Returns:** `Promise<BatteryInfo>` - Battery level, charging status

**Example:**
```typescript
const info = await BatteryService.getBatteryInfo();
console.log(`Battery: ${info.level * 100}%`);
console.log(`Charging: ${info.isCharging}`);
```

##### `enablePowerSaving(): void`

Enable power-saving mode (reduces quality, pauses background sync).

**Returns:** void

**Example:**
```typescript
BatteryService.enablePowerSaving();
```

##### `disablePowerSaving(): void`

Disable power-saving mode.

**Returns:** void

**Example:**
```typescript
BatteryService.disablePowerSaving();
```

##### `onBatteryLow(callback: () => void): void`

Register callback for low battery event.

**Parameters:**
- `callback` (() => void): Callback function

**Returns:** void

**Example:**
```typescript
BatteryService.onBatteryLow(() => {
  console.log('Battery low! Enabling power saving...');
  BatteryService.enablePowerSaving();
});
```

---

### API Client (Supabase)

**Location:** `src/app/lib/api-client.ts`
**Purpose:** Cloud backend integration for authentication and data sync

#### Authentication Methods

##### `async signUp(email: string, password: string): Promise<AuthResult>`

Create a new user account.

**Parameters:**
- `email` (string): User email
- `password` (string): Password (min 6 characters)

**Returns:** `Promise<AuthResult>` - User, session, or error

**Example:**
```typescript
const result = await apiClient.signUp('user@example.com', 'password123');
if (result.user) {
  console.log('Account created:', result.user.email);
} else {
  console.error('Sign up failed:', result.error);
}
```

##### `async signIn(email: string, password: string): Promise<AuthResult>`

Sign in with email and password.

**Parameters:**
- `email` (string): User email
- `password` (string): Password

**Returns:** `Promise<AuthResult>` - User, session, or error

**Example:**
```typescript
const result = await apiClient.signIn('user@example.com', 'password123');
if (result.user) {
  console.log('Signed in:', result.user.email);
}
```

##### `async signOut(): Promise<{ error: Error | null }>`

Sign out current user.

**Returns:** `Promise<{ error: Error | null }>` - Error if failed

**Example:**
```typescript
const { error } = await apiClient.signOut();
if (!error) {
  console.log('Signed out successfully');
}
```

##### `async getUser(): Promise<UserResult>`

Get current authenticated user.

**Returns:** `Promise<UserResult>` - User or error

**Example:**
```typescript
const { user, error } = await apiClient.getUser();
if (user) {
  console.log('Current user:', user.email);
}
```

##### `async getSession(): Promise<SessionResult>`

Get current session.

**Returns:** `Promise<SessionResult>` - Session or error

**Example:**
```typescript
const { session, error } = await apiClient.getSession();
if (session) {
  console.log('Token expires at:', session.expires_at);
}
```

##### `onAuthStateChange(callback: (event: string, session: Session | null) => void): void`

Listen to auth state changes.

**Parameters:**
- `callback` ((event, session) => void): Auth change callback

**Returns:** void

**Example:**
```typescript
apiClient.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

#### Collection Methods

##### `async createCollection(items: MovieItem[], title: string, description?: string, expiresAt?: number): Promise<CollectionResult>`

Create a shareable collection.

**Parameters:**
- `items` (MovieItem[]): Movies/shows in collection
- `title` (string): Collection title
- `description` (string, optional): Collection description
- `expiresAt` (number, optional): Expiration timestamp

**Returns:** `Promise<CollectionResult>` - Share code or error

**Example:**
```typescript
const result = await apiClient.createCollection(
  [movie1, movie2, movie3],
  'My Favorite Sci-Fi',
  'Top 3 sci-fi movies of all time'
);
if (result.shareCode) {
  console.log('Share code:', result.shareCode); // e.g., 'ABC123'
}
```

##### `async getCollection(shareCode: string): Promise<CollectionResult>`

Get a collection by share code.

**Parameters:**
- `shareCode` (string): 6-character share code

**Returns:** `Promise<CollectionResult>` - Collection or error

**Example:**
```typescript
const result = await apiClient.getCollection('ABC123');
if (result.collection) {
  console.log('Title:', result.collection.title);
  console.log('Items:', result.collection.items.length);
}
```

##### `async updateCollection(shareCode: string, updates: Partial<Collection>): Promise<{ error: Error | null }>`

Update a collection (owner only).

**Parameters:**
- `shareCode` (string): Share code
- `updates` (Partial<Collection>): Fields to update

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
await apiClient.updateCollection('ABC123', {
  title: 'Updated Title',
  description: 'Updated description'
});
```

##### `async deleteCollection(shareCode: string): Promise<{ error: Error | null }>`

Delete a collection (owner only).

**Parameters:**
- `shareCode` (string): Share code

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
await apiClient.deleteCollection('ABC123');
```

##### `async listMyCollections(): Promise<CollectionsResult>`

List all collections created by current user.

**Returns:** `Promise<CollectionsResult>` - Collections or error

**Example:**
```typescript
const result = await apiClient.listMyCollections();
result.collections?.forEach(col => {
  console.log(`${col.title} (${col.shareCode})`);
});
```

#### Favorites Sync Methods

##### `async syncFavorites(favorites: MovieItem[]): Promise<{ error: Error | null }>`

Push favorites to cloud.

**Parameters:**
- `favorites` (MovieItem[]): Favorites to sync

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
const favorites = await FavoritesService.getFavorites();
await apiClient.syncFavorites(favorites);
```

##### `async getFavorites(): Promise<FavoritesResult>`

Get favorites from cloud.

**Returns:** `Promise<FavoritesResult>` - Favorites or error

**Example:**
```typescript
const result = await apiClient.getFavorites();
if (result.favorites) {
  console.log('Cloud favorites:', result.favorites.length);
}
```

##### `async addFavorite(movie: MovieItem): Promise<{ error: Error | null }>`

Add a single favorite to cloud.

**Parameters:**
- `movie` (MovieItem): Movie to add

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
await apiClient.addFavorite({
  movieId: 'tt1234567',
  title: 'Inception',
  year: 2010
});
```

##### `async removeFavorite(movieId: string): Promise<{ error: Error | null }>`

Remove a favorite from cloud.

**Parameters:**
- `movieId` (string): Movie ID to remove

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
await apiClient.removeFavorite('tt1234567');
```

#### Settings Sync Methods

##### `async syncSettings(settings: AppSettings): Promise<{ error: Error | null }>`

Push settings to cloud.

**Parameters:**
- `settings` (AppSettings): Settings to sync

**Returns:** `Promise<{ error: Error | null }>`

**Example:**
```typescript
const settings = SettingsManager.settings;
await apiClient.syncSettings(settings);
```

##### `async getSettings(): Promise<SettingsResult>`

Get settings from cloud.

**Returns:** `Promise<SettingsResult>` - Settings or error

**Example:**
```typescript
const result = await apiClient.getSettings();
if (result.settings) {
  console.log('Cloud settings:', result.settings);
}
```

#### Analytics Methods

##### `async logEvent(eventType: string, eventData?: object): Promise<void>`

Log an analytics event.

**Parameters:**
- `eventType` (string): Event type (e.g., 'app_open', 'movie_view')
- `eventData` (object, optional): Event-specific data

**Returns:** `Promise<void>`

**Example:**
```typescript
await apiClient.logEvent('movie_view', {
  movieId: 'tt1234567',
  title: 'Inception'
});

await apiClient.logEvent('play_video', {
  movieId: 'tt1234567',
  quality: '1080p',
  torrent: true
});
```

---

## View Layer APIs

### MovieListView

**Location:** `src/app/views/movie-list-view.ts`
**Type:** Marionette.CollectionView
**Purpose:** Display paginated grid of movie cards

#### Properties

```typescript
childView: MovieItemView
collection: Backbone.Collection<Movie>
```

#### Events

- `childview:movie:click` - Triggered when a movie card is clicked
- `childview:favorite:toggle` - Triggered when favorite button clicked

#### Methods

##### `render(): this`

Render the view.

**Returns:** `this` - View instance for chaining

**Example:**
```typescript
const movieListView = new MovieListView({
  collection: moviesCollection
});
movieListView.render();
```

##### `showLoadingState(): void`

Show loading spinner.

**Returns:** void

**Example:**
```typescript
movieListView.showLoadingState();
```

##### `showErrorState(message: string): void`

Show error message.

**Parameters:**
- `message` (string): Error message

**Returns:** void

**Example:**
```typescript
movieListView.showErrorState('Failed to load movies');
```

---

### PlayerView

**Location:** `src/app/views/player-view.ts`
**Type:** Marionette.View
**Purpose:** Video player with controls and queue

#### Properties

```typescript
model: Backbone.Model<Movie>
player: HTMLVideoElement
```

#### Events

- `video:play` - Triggered when playback starts
- `video:pause` - Triggered when playback pauses
- `video:ended` - Triggered when video ends
- `video:error` - Triggered on playback error

#### Methods

##### `play(): void`

Start or resume playback.

**Returns:** void

**Example:**
```typescript
playerView.play();
```

##### `pause(): void`

Pause playback.

**Returns:** void

**Example:**
```typescript
playerView.pause();
```

##### `seek(time: number): void`

Seek to a specific time.

**Parameters:**
- `time` (number): Time in seconds

**Returns:** void

**Example:**
```typescript
playerView.seek(120); // Seek to 2:00
```

##### `setVolume(level: number): void`

Set volume level.

**Parameters:**
- `level` (number): Volume (0-1)

**Returns:** void

**Example:**
```typescript
playerView.setVolume(0.5); // 50% volume
```

##### `toggleFullscreen(): void`

Toggle fullscreen mode.

**Returns:** void

**Example:**
```typescript
playerView.toggleFullscreen();
```

##### `loadSubtitles(url: string): void`

Load subtitle track.

**Parameters:**
- `url` (string): Subtitle file URL (.srt or .vtt)

**Returns:** void

**Example:**
```typescript
playerView.loadSubtitles('/subtitles/movie-en.srt');
```

---

### SettingsView

**Location:** `src/app/views/settings-view.ts`
**Type:** Marionette.View
**Purpose:** Settings UI with sections and controls

#### Events

- `setting:changed` - Triggered when a setting changes
- `cloud:signin` - Triggered when sign in button clicked
- `cloud:sync` - Triggered when sync button clicked

#### Methods

##### `render(): this`

Render the settings view.

**Returns:** `this` - View instance

**Example:**
```typescript
const settingsView = new SettingsView();
settingsView.render();
```

##### `showAuthModal(): void`

Show authentication modal.

**Returns:** void

**Example:**
```typescript
settingsView.showAuthModal();
```

##### `refreshSettings(): void`

Reload settings from SettingsManager.

**Returns:** void

**Example:**
```typescript
settingsView.refreshSettings();
```

---

### AuthModalView

**Location:** `src/app/views/auth-modal-view.ts`
**Type:** Marionette.View
**Purpose:** Authentication modal for sign in/sign up

#### Properties

```typescript
mode: 'signin' | 'signup'
```

#### Events

- `auth:success` - Triggered on successful authentication
- `auth:error` - Triggered on authentication error
- `modal:close` - Triggered when modal is closed

#### Methods

##### `switchMode(mode: 'signin' | 'signup'): void`

Switch between sign in and sign up modes.

**Parameters:**
- `mode` ('signin' | 'signup'): Mode to switch to

**Returns:** void

**Example:**
```typescript
authModalView.switchMode('signup');
```

##### `show(): void`

Show the modal.

**Returns:** void

**Example:**
```typescript
authModalView.show();
```

##### `hide(): void`

Hide the modal.

**Returns:** void

**Example:**
```typescript
authModalView.hide();
```

##### `showError(message: string): void`

Show error message in modal.

**Parameters:**
- `message` (string): Error message

**Returns:** void

**Example:**
```typescript
authModalView.showError('Invalid email or password');
```

---

## Model & Collection APIs

### Movie Model

**Type:** Backbone.Model

```typescript
interface MovieAttributes {
  movieId: string;
  title: string;
  year: number;
  rating: number;
  plot: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  runtime: number;
  director: string;
  cast: string[];
}
```

**Example:**
```typescript
const movie = new Movie({
  movieId: 'tt1234567',
  title: 'Inception',
  year: 2010,
  rating: 8.8
});

console.log(movie.get('title')); // 'Inception'
movie.set('rating', 9.0);
```

### Movies Collection

**Type:** Backbone.Collection<Movie>

```typescript
const movies = new Movies();
movies.fetch(); // Load from API

movies.on('add', (model) => {
  console.log('Movie added:', model.get('title'));
});

movies.on('reset', () => {
  console.log('Collection refreshed');
});
```

---

## Type Definitions

### MovieItem

```typescript
interface MovieItem {
  movieId: string;        // IMDb ID or unique identifier
  title: string;          // Movie title
  year: number;           // Release year
  posterUrl?: string;     // Poster image URL
  backdropUrl?: string;   // Backdrop image URL
  rating?: number;        // IMDb rating (0-10)
  plot?: string;          // Plot summary
  genres?: string[];      // Genre tags
  runtime?: number;       // Runtime in minutes
  movieType: 'movie' | 'show' | 'anime'; // Content type
}
```

### LibraryItem

```typescript
interface LibraryItem {
  id?: number;            // Auto-generated ID
  title: string;          // Item title
  filePath: string;       // Local file path
  fileSize: number;       // File size in bytes
  duration: number;       // Duration in seconds
  thumbnailPath?: string; // Thumbnail image path
  addedAt: number;        // Timestamp added
  lastPlayedAt?: number;  // Last played timestamp
  playbackPosition?: number; // Resume position in seconds
}
```

### CustomEndpoint

```typescript
interface CustomEndpoint {
  id: string;             // Unique identifier
  name: string;           // Display name
  url: string;            // API endpoint URL
  enabled: boolean;       // Whether endpoint is active
}
```

### Result

```typescript
interface Result {
  success: boolean;       // Operation success
  data?: any;             // Result data
  error?: string;         // Error message
}
```

### SyncResult

```typescript
interface SyncResult {
  success: boolean;       // Sync success
  error?: string;         // Error message if failed
}
```

### TorrentResult

```typescript
interface TorrentResult {
  torrentId: string;      // Torrent identifier
  streamUrl: string;      // HTTP stream URL
}
```

### TorrentStatus

```typescript
interface TorrentStatus {
  progress: number;       // Download progress (0-1)
  downloadSpeed: number;  // Download speed (bytes/s)
  uploadSpeed: number;    // Upload speed (bytes/s)
  numPeers: number;       // Number of connected peers
}
```

### BatteryInfo

```typescript
interface BatteryInfo {
  level: number;          // Battery level (0-1)
  isCharging: boolean;    // Whether device is charging
}
```

---

## Error Handling

All async service methods return promises that should be handled:

### Try-Catch Pattern

```typescript
try {
  await FavoritesService.addFavorite(movie);
  console.log('Favorite added successfully');
} catch (error) {
  console.error('Failed to add favorite:', error);
  // Show error to user
  showToast('Failed to add favorite. Please try again.');
}
```

### Result Pattern

Services returning `Result` type:

```typescript
const result = await LibraryService.addItem(item);
if (result.success) {
  console.log('Item added with ID:', result.data);
} else {
  console.error('Failed to add item:', result.error);
}
```

### SyncResult Pattern

Cloud sync methods:

```typescript
const syncResult = await FavoritesService.syncToCloud();
if (syncResult.success) {
  showToast('✓ Synced to cloud');
} else {
  if (syncResult.error === 'Not authenticated') {
    // Show sign in prompt
    showAuthModal();
  } else {
    showToast('✗ Sync failed: ' + syncResult.error);
  }
}
```

### Common Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `Not authenticated` | User not signed in | Show auth modal |
| `Cloud sync not configured` | Supabase not set up | Inform user cloud features unavailable |
| `Network error` | No internet connection | Retry or show offline message |
| `Invalid credentials` | Wrong email/password | Show error, allow retry |
| `Database error` | SQLite operation failed | Log error, show generic message |

---

## Usage Examples

### Complete Favorite Workflow

```typescript
// Check if movie is already favorited
const isFav = await FavoritesService.isFavorite('tt1234567');

if (!isFav) {
  // Add to favorites
  await FavoritesService.addFavorite({
    movieId: 'tt1234567',
    title: 'Inception',
    year: 2010,
    posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    movieType: 'movie'
  });

  console.log('Added to favorites');

  // Auto-sync to cloud (if authenticated)
  // This happens automatically in addFavorite()
}

// Get all favorites
const favorites = await FavoritesService.getFavorites();
console.log(`You have ${favorites.length} favorites`);

// Manual cloud sync
const syncResult = await FavoritesService.syncToCloud();
if (syncResult.success) {
  console.log('Favorites backed up to cloud');
}
```

### Authentication & Cloud Sync

```typescript
// Import API client
const { getApiClient } = await import('./lib/api-client');
const apiClient = getApiClient();

// Sign up
const signUpResult = await apiClient.signUp('user@example.com', 'password123');
if (signUpResult.user) {
  console.log('Account created!');

  // Sync favorites to cloud
  await FavoritesService.syncToCloud();

  // Sync settings to cloud
  await SettingsManager.syncToCloud();
}

// Or sign in
const signInResult = await apiClient.signIn('user@example.com', 'password123');
if (signInResult.user) {
  console.log('Signed in!');

  // Pull favorites from cloud
  await FavoritesService.syncFromCloud();

  // Pull settings from cloud
  await SettingsManager.syncFromCloud();
}

// Listen to auth changes
apiClient.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear sensitive data
  }
});
```

### Torrent Streaming

```typescript
// Get movie torrents
const torrents = await StreamingService.getTorrents('tt1234567');
console.log('Available torrents:', torrents.length);

// Choose best quality
const bestTorrent = torrents.find(t => t.quality === '1080p') || torrents[0];

// Start streaming
const result = await NativeTorrentClient.startTorrent(bestTorrent.magnetUri);
console.log('Stream URL:', result.streamUrl);

// Monitor progress
const statusInterval = setInterval(async () => {
  const status = await NativeTorrentClient.getTorrentStatus(result.torrentId);
  console.log(`Progress: ${(status.progress * 100).toFixed(1)}%`);
  console.log(`Speed: ${(status.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`);

  if (status.progress >= 0.05) {
    // Enough buffered, start playback
    playerView.loadVideo(result.streamUrl);
    clearInterval(statusInterval);
  }
}, 1000);
```

### Library Management

```typescript
// Add local video file to library
const result = await LibraryService.addItem({
  title: 'Vacation 2023',
  filePath: '/storage/emulated/0/DCIM/Camera/VID_20230801.mp4',
  fileSize: 1024000000, // 1GB
  duration: 3600, // 1 hour
  addedAt: Date.now()
});

if (result.success) {
  console.log('Added to library with ID:', result.data);
}

// Search library
const searchResults = await LibraryService.searchItems('vacation');
console.log('Found:', searchResults.length);

// Get all library items
const allItems = await LibraryService.getItems();
allItems.forEach(item => {
  console.log(`${item.title} (${(item.fileSize / 1024 / 1024).toFixed(0)} MB)`);
});
```

### Settings Management

```typescript
// Get current settings
const quality = SettingsManager.get('quality');
console.log('Current quality:', quality);

// Update setting
SettingsManager.set('quality', '1080p');
SettingsManager.set('autoplayNext', true);

// Add custom API endpoint
SettingsManager.addCustomEndpoint('My Server', 'https://myserver.com/api');

// Get enabled endpoints
const endpoints = SettingsManager.getEnabledEndpoints();
endpoints.forEach(ep => {
  console.log(`${ep.name}: ${ep.url}`);
});

// Reset to defaults
SettingsManager.reset();
```

---

## API Versioning

**Current Version:** 0.4.4

All APIs are considered stable unless marked as:
- `[EXPERIMENTAL]` - May change in future versions
- `[DEPRECATED]` - Will be removed in next major version
- `[INTERNAL]` - Not recommended for external use

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture overview
- [Development Guide](./DEVELOPMENT.md) - Setup and development workflow
- [Testing Guide](./TESTING.md) - Testing strategy and examples
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
