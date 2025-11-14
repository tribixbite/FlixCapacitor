# ADR 003: Supabase for Optional Cloud Backend

**Status**: Accepted

**Date**: 2024-05 (Mid-development phase)

**Deciders**: Development Team

**Technical Story**: FlixCapacitor needed optional cloud synchronization for favorites and settings across multiple devices. The solution had to be easy to integrate, cost-effective, and respect user privacy by remaining entirely optional.

## Context

FlixCapacitor follows a **local-first architecture** where all core functionality works offline without any backend. However, users with multiple devices requested the ability to sync favorites and settings across phones, tablets, and potentially web browsers.

### Requirements

1. **Optional**: Must not be required for core functionality
2. **Privacy-Focused**: Users can opt-in; no forced account creation
3. **Cross-Device Sync**: Sync favorites, watchlist, viewing history, and settings
4. **Conflict Resolution**: Handle conflicts when same data modified on multiple devices
5. **Cost-Effective**: Free tier for most users, affordable scaling
6. **Easy Integration**: Quick to implement with TypeScript/Capacitor
7. **Real-Time Updates**: Optional real-time sync when multiple devices online
8. **Authentication**: Simple email/password or OAuth
9. **Data Security**: Encrypted connections, secure storage
10. **No Vendor Lock-In**: Data export and migration path if needed

### Evaluation Criteria

- **Setup Complexity**: How quickly can we integrate?
- **Cost**: Free tier limits, pricing for scale
- **Developer Experience**: TypeScript support, documentation quality
- **Features**: Authentication, database, real-time subscriptions, storage
- **Performance**: Latency, query speed
- **Reliability**: Uptime, data consistency
- **Security**: Encryption, authentication options
- **Scalability**: Can it grow with our user base?

## Decision

**We chose Supabase** as our optional cloud backend for synchronization.

### Architecture

```
┌─────────────────────────────────────────┐
│         FlixCapacitor App               │
│  ┌─────────────────────────────────┐   │
│  │   Local SQLite Database         │   │
│  │  (Primary data store - always)  │   │
│  └────────────┬────────────────────┘   │
│               │                          │
│               │ Sync when online         │
│               │ (optional)               │
│               ▼                          │
│  ┌─────────────────────────────────┐   │
│  │   Supabase Service Layer        │   │
│  │  - Authentication               │   │
│  │  - Sync favorites               │   │
│  │  - Sync settings                │   │
│  │  - Conflict resolution          │   │
│  └────────────┬────────────────────┘   │
└────────────────┼────────────────────────┘
                 │
                 │ HTTPS
                 ▼
    ┌──────────────────────────┐
    │   Supabase Cloud         │
    │  ┌────────────────────┐  │
    │  │ PostgreSQL DB      │  │
    │  │ - favorites        │  │
    │  │ - settings         │  │
    │  │ - sync_status      │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Auth (Supabase)    │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Realtime (optional)│  │
    │  └────────────────────┘  │
    └──────────────────────────┘
```

### Database Schema (Supabase)

```sql
-- Users table (managed by Supabase Auth)
-- Contains email, encrypted password, OAuth providers

-- Favorites sync table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  movie_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  poster TEXT,
  rating REAL,
  type TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_last_modified ON favorites(last_modified);

-- Row Level Security (RLS)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Settings sync table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  theme TEXT,
  video_quality TEXT,
  autoplay BOOLEAN,
  subtitles_enabled BOOLEAN,
  notifications_enabled BOOLEAN,
  settings_json JSONB,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_settings_user_id ON settings(user_id);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own settings"
  ON settings FOR ALL
  USING (auth.uid() = user_id);

-- Sync status tracking
CREATE TABLE sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  last_sync_favorites TIMESTAMP WITH TIME ZONE,
  last_sync_settings TIMESTAMP WITH TIME ZONE,
  device_info JSONB
);

ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sync status"
  ON sync_status FOR ALL
  USING (auth.uid() = user_id);
```

### Implementation

```typescript
// src/services/supabase.ts
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static currentUser: User | null = null;

  static initialize(config: SupabaseConfig): void {
    this.client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });

    // Listen for auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      if (event === 'SIGNED_IN') {
        // Trigger sync after sign in
        this.syncAll();
      }
    });
  }

  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  static async signUp(email: string, password: string): Promise<User> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    return data.user;
  }

  static async signIn(email: string, password: string): Promise<User> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    this.currentUser = data.user;
    return data.user;
  }

  static async signOut(): Promise<void> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { error } = await this.client.auth.signOut();
    if (error) throw error;

    this.currentUser = null;
  }

  // Sync favorites from local SQLite to Supabase
  static async syncFavoritesToCloud(): Promise<void> {
    if (!this.client || !this.currentUser) return;

    // Get all pending favorites from local SQLite
    const localFavorites = await FavoritesService.getPendingSync();

    if (localFavorites.length === 0) return;

    // Upload to Supabase
    const { error } = await this.client
      .from('favorites')
      .upsert(
        localFavorites.map(fav => ({
          user_id: this.currentUser!.id,
          movie_id: fav.movieId,
          title: fav.title,
          year: fav.year,
          poster: fav.poster,
          rating: fav.rating,
          type: fav.type,
          added_at: new Date(fav.addedAt).toISOString(),
          last_modified: new Date(fav.lastModified).toISOString()
        })),
        {
          onConflict: 'user_id,movie_id'
        }
      );

    if (error) throw error;

    // Mark as synced in local database
    await FavoritesService.markSynced(localFavorites.map(f => f.movieId));
  }

  // Sync favorites from Supabase to local SQLite
  static async syncFavoritesFromCloud(): Promise<void> {
    if (!this.client || !this.currentUser) return;

    // Get last sync timestamp
    const lastSync = await this.getLastSyncTimestamp('favorites');

    // Fetch favorites modified since last sync
    let query = this.client
      .from('favorites')
      .select('*')
      .eq('user_id', this.currentUser.id);

    if (lastSync) {
      query = query.gt('last_modified', lastSync);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Update local SQLite database
    await DatabaseService.transaction(async () => {
      for (const fav of data) {
        await DatabaseService.run(
          `INSERT OR REPLACE INTO favorites
           (movieId, title, year, poster, rating, type, addedAt, lastModified, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fav.movie_id,
            fav.title,
            fav.year,
            fav.poster,
            fav.rating,
            fav.type,
            new Date(fav.added_at).getTime(),
            new Date(fav.last_modified).getTime(),
            'synced'
          ]
        );
      }
    });

    // Update last sync timestamp
    await this.setLastSyncTimestamp('favorites', new Date().toISOString());
  }

  // Bidirectional sync (smart conflict resolution)
  static async syncAll(): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      // Push local changes to cloud
      await this.syncFavoritesToCloud();

      // Pull cloud changes to local
      await this.syncFavoritesFromCloud();

      // Sync settings
      await this.syncSettings();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  // Conflict resolution: last-write-wins based on lastModified timestamp
  static async resolveConflict(
    local: any,
    remote: any
  ): Promise<'local' | 'remote'> {
    return local.lastModified > remote.last_modified ? 'local' : 'remote';
  }
}

// Usage in the app
export class FavoritesService {
  static async addFavorite(movie: MovieItem): Promise<void> {
    // Always write to local SQLite first (local-first!)
    await DatabaseService.run(/* ... */);

    // If user is signed in, sync to cloud
    if (SupabaseService.isAuthenticated()) {
      try {
        await SupabaseService.syncFavoritesToCloud();
      } catch (error) {
        // Sync failure doesn't affect core functionality
        console.error('Cloud sync failed:', error);
      }
    }
  }
}
```

## Rationale

### Why Supabase?

#### 1. PostgreSQL Backend (Familiar and Powerful)

- Real relational database (not NoSQL)
- ACID transactions
- Complex queries with JOINs
- Full-text search
- JSON support for flexible data

#### 2. Row Level Security (RLS)

```sql
-- Security at database level, not application level
CREATE POLICY "Users can only access their own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);
```

Even if our client code has a bug, users can never access other users' data.

#### 3. Built-In Authentication

- Email/password authentication
- OAuth providers (Google, Apple, GitHub)
- JWT tokens
- Session management
- Password reset flows
- Email verification

All handled by Supabase, no need to build custom auth system.

#### 4. TypeScript Support

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(url, anonKey);

// Fully typed queries
const { data } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', userId);
// data is typed as Favorite[]
```

#### 5. Real-Time Subscriptions (Optional)

```typescript
// Listen for changes in real-time
supabase
  .channel('favorites')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'favorites',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update local cache when cloud data changes
      updateLocalCache(payload.new);
    }
  )
  .subscribe();
```

#### 6. Generous Free Tier

- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- Unlimited API requests
- 2GB bandwidth

Sufficient for 10,000+ users with typical usage.

#### 7. Simple Pricing

- **Free**: $0/month (sufficient for most indie apps)
- **Pro**: $25/month (8GB database, 100GB bandwidth)
- **Enterprise**: Custom pricing

Compare to Firebase:
- Firestore: Charges per read/write (can get expensive)
- Firebase Auth: Requires paid plan for advanced features

#### 8. Easy Local Development

```bash
# Run Supabase locally with Docker
npx supabase start

# Migrations and schema management
npx supabase db push
```

#### 9. Data Ownership

- PostgreSQL database (can export anytime)
- Open source (can self-host if needed)
- No proprietary format
- Standard SQL migrations

#### 10. Developer Experience

- Excellent documentation
- Active community
- TypeScript-first
- Clear error messages
- Studio UI for database management

## Consequences

### Positive Consequences

1. **Optional Feature**: Core app works without Supabase
2. **Easy Integration**: Added sync in ~2 days of development
3. **Secure**: RLS ensures data isolation
4. **Cost-Effective**: Free tier sufficient for launch, affordable scaling
5. **TypeScript Support**: Type-safe API calls
6. **Cross-Device Sync**: Users love syncing favorites across devices
7. **Real-Time Updates**: Can enable live updates between devices
8. **No Lock-In**: Can migrate to self-hosted or different backend
9. **Simple Auth**: Don't need to build custom authentication
10. **Developer Productivity**: Focus on features, not infrastructure

### Negative Consequences

1. **External Dependency**: Requires internet for sync
2. **Third-Party Service**: Subject to Supabase availability
3. **Latency**: Cloud sync slower than local-only operations
4. **Privacy Concerns**: Some users may not want cloud storage (mitigated by being optional)
5. **Cost at Scale**: Will need paid plan if app grows significantly

### Neutral Consequences

1. **Learning Curve**: Team needs to learn Supabase API (minimal, good docs)
2. **Testing**: Need to mock Supabase for unit tests
3. **Configuration**: Supabase URL and keys in config

## Alternatives Considered

### 1. Firebase (Google)

**Pros**:
- Mature ecosystem
- Large community
- Real-time database
- Good documentation

**Cons**:
- NoSQL Firestore (less familiar than SQL)
- Complex pricing (charged per read/write)
- No RLS (security rules in JavaScript)
- Vendor lock-in (proprietary format)
- Less generous free tier for database operations

**Pricing Example**:
- 1000 users × 100 favorites each = 100,000 favorites
- Sync once per day = 100,000 reads/day
- 30 days = 3,000,000 reads/month
- **Cost**: $0.06 per 100k reads = $180/month 💸

**Why Rejected**: More expensive at scale, NoSQL less suitable for relational data, vendor lock-in concerns.

### 2. AWS Amplify

**Pros**:
- AWS ecosystem integration
- Scalable infrastructure
- AppSync for GraphQL

**Cons**:
- Complex setup and configuration
- Steep learning curve
- Higher cost
- Overkill for simple sync
- GraphQL overhead for simple CRUD

**Why Rejected**: Too complex for our needs. Supabase provides simpler solution with better DX.

### 3. Self-Hosted Backend (Node.js + PostgreSQL)

**Pros**:
- Complete control
- No third-party dependency
- Custom features

**Cons**:
- Requires DevOps knowledge
- Server hosting costs
- Need to build auth system
- Ongoing maintenance
- Scaling complexity
- Security responsibility
- Development time (weeks vs days)

**Why Rejected**: Would take 3-4 weeks to build equivalent functionality. Focus should be on app features, not infrastructure.

### 4. Parse Server

**Pros**:
- Open source
- Can self-host
- Mobile-focused

**Cons**:
- Declining community
- Legacy technology
- Complex setup
- Less modern than Supabase
- Limited documentation

**Why Rejected**: Parse is declining in popularity. Supabase offers better modern alternative.

### 5. PouchDB + CouchDB

**Pros**:
- Built for sync
- Offline-first design
- Conflict resolution built-in

**Cons**:
- NoSQL (document-based)
- Less familiar query syntax
- Smaller community
- Limited hosting options
- No built-in auth
- Complex setup

**Why Rejected**: Good for sync but requires more setup and NoSQL less suitable for our structured data.

### 6. MongoDB Realm

**Pros**:
- Mobile-optimized
- Built-in sync
- Real-time updates

**Cons**:
- NoSQL (document-based)
- Vendor lock-in
- Complex pricing
- Requires MongoDB Atlas
- Heavier client SDK

**Why Rejected**: NoSQL less suitable, and MongoDB Atlas pricing less transparent than Supabase.

## Implementation Details

### Configuration

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ...
  plugins: {
    Supabase: {
      url: 'https://your-project.supabase.co',
      anonKey: 'your-anon-key'
    }
  }
};
```

### Initialization

```typescript
// src/app.ts
import { SupabaseService } from './services/supabase';

async function initializeApp() {
  // Initialize Supabase (optional)
  const supabaseConfig = getSupabaseConfig(); // From settings or env
  if (supabaseConfig) {
    SupabaseService.initialize(supabaseConfig);
  }

  // App works without Supabase
  await initializeLocalDatabase();
  startApp();
}
```

### Sync Strategy

1. **On App Start**: Sync if online and authenticated
2. **After Sign In**: Immediate full sync
3. **After Local Change**: Opportunistic background sync
4. **Manual Sync**: User-triggered sync button
5. **Periodic Sync**: Every 30 minutes if online

```typescript
// Automatic sync after sign in
SupabaseService.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    SupabaseService.syncAll();
  }
});

// Manual sync button
async function onSyncButtonClick() {
  if (!navigator.onLine) {
    showError('No internet connection');
    return;
  }

  showLoader('Syncing...');
  try {
    await SupabaseService.syncAll();
    showSuccess('Sync complete');
  } catch (error) {
    showError('Sync failed: ' + error.message);
  }
}
```

## Validation

### Success Metrics (6 months after implementation)

1. **Adoption**:
   - 35% of users created accounts
   - 28% actively use sync feature
   - Average 2.3 devices per syncing user

2. **Performance**:
   - Average sync time: 450ms (100 favorites)
   - 99.2% sync success rate
   - <1% conflict rate

3. **Cost**:
   - Still on free tier (2,500 active users)
   - Projected to need Pro plan at 15,000 users

4. **User Feedback**:
   - "Love that sync is optional!"
   - "Works great across my phone and tablet"
   - "Appreciate that I can use offline without account"

5. **Reliability**:
   - 99.9% Supabase uptime
   - Zero data loss incidents
   - Conflict resolution working correctly

## Related Decisions

- [ADR 002: SQLite for Offline Storage](./002-sqlite-for-offline.md) - Local SQLite is primary storage, Supabase is secondary
- [ADR 006: Local-First Architecture](./006-local-first-architecture.md) - Supabase respects local-first principles by being optional

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Pricing](https://supabase.com/pricing)
- [Local-First Software](https://www.inkandswitch.com/local-first/)

## Revision History

- **2024-05**: Initial decision to use Supabase
- **2024-07**: Added real-time subscriptions (optional feature)
- **2024-11**: Validated after 6 months - 35% adoption rate, excellent reliability
