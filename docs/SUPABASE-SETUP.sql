-- ============================================================================
-- Supabase Database Setup for Torrent Collections
-- Phase 13: Torrent Collections Feature
-- ============================================================================
--
-- This script creates the necessary tables and Row-Level Security (RLS)
-- policies for the Torrent Collections feature in FlixCapacitor.
--
-- IMPORTANT: Run this script in the Supabase SQL Editor
--
-- Tables:
--   1. torrents - Persists torrent metadata
--   2. collections - Collection metadata with UUID-based sync
--   3. collection_torrents - Many-to-many join table with ordering
--
-- Security:
--   - Row-Level Security (RLS) enabled on all tables
--   - Users can only access their own data
--   - Foreign key constraints with CASCADE deletes
-- ============================================================================

-- ============================================================================
-- TABLE: torrents
-- Persists torrent metadata for collections
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.torrents (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_torrents_user_id ON public.torrents(user_id);
CREATE INDEX IF NOT EXISTS idx_torrents_imdb_id ON public.torrents(imdb_id);
CREATE INDEX IF NOT EXISTS idx_torrents_added_at ON public.torrents(added_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.torrents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own torrents
CREATE POLICY "Users can manage their own torrents"
ON public.torrents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: collections
-- Playlist-like feature to organize torrents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_uuid ON public.collections(uuid);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON public.collections(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_is_deleted ON public.collections(is_deleted);

-- Enable Row-Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own collections
CREATE POLICY "Users can manage their own collections"
ON public.collections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Public collections are readable by everyone
CREATE POLICY "Public collections are readable"
ON public.collections FOR SELECT
USING (is_public = TRUE AND is_deleted = FALSE);

-- ============================================================================
-- TABLE: collection_torrents
-- Many-to-many join table with explicit ordering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collection_torrents (
    id SERIAL PRIMARY KEY,
    collection_uuid UUID NOT NULL REFERENCES public.collections(uuid) ON DELETE CASCADE,
    torrent_info_hash TEXT NOT NULL REFERENCES public.torrents(info_hash) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_uuid, torrent_info_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_torrents_collection ON public.collection_torrents(collection_uuid);
CREATE INDEX IF NOT EXISTS idx_collection_torrents_torrent ON public.collection_torrents(torrent_info_hash);
CREATE INDEX IF NOT EXISTS idx_collection_torrents_sort_order ON public.collection_torrents(collection_uuid, sort_order);

-- Enable Row-Level Security
ALTER TABLE public.collection_torrents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage items in their own collections
CREATE POLICY "Users can manage items in their own collections"
ON public.collection_torrents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE public.collections.uuid = public.collection_torrents.collection_uuid
      AND public.collections.user_id = auth.uid()
  )
);

-- RLS Policy: Public collection items are readable
CREATE POLICY "Public collection items are readable"
ON public.collection_torrents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE public.collections.uuid = public.collection_torrents.collection_uuid
      AND public.collections.is_public = TRUE
      AND public.collections.is_deleted = FALSE
  )
);

-- ============================================================================
-- FUNCTION: update_updated_at_column
-- Automatically update updated_at timestamp on row modification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Auto-update updated_at for collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTION: update_collection_on_item_change
-- Update parent collection's updated_at when items are added/removed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_collection_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent collection's updated_at
    UPDATE public.collections
    SET updated_at = NOW()
    WHERE uuid = COALESCE(NEW.collection_uuid, OLD.collection_uuid);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger: Update collection when items are added/removed
DROP TRIGGER IF EXISTS update_collection_on_item_insert ON public.collection_torrents;
CREATE TRIGGER update_collection_on_item_insert
    AFTER INSERT ON public.collection_torrents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_collection_on_item_change();

DROP TRIGGER IF EXISTS update_collection_on_item_delete ON public.collection_torrents;
CREATE TRIGGER update_collection_on_item_delete
    AFTER DELETE ON public.collection_torrents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_collection_on_item_change();

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup
-- ============================================================================

-- Check table structures
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('torrents', 'collections', 'collection_torrents')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('torrents', 'collections', 'collection_torrents')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('torrents', 'collections', 'collection_torrents')
ORDER BY tablename, policyname;

-- Check foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('torrents', 'collections', 'collection_torrents')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Insert sample collection
/*
INSERT INTO public.collections (uuid, user_id, name, description, is_public)
VALUES (
    gen_random_uuid(),
    auth.uid(),
    'Marvel Cinematic Universe',
    'All MCU films in chronological order',
    FALSE
);
*/

-- Insert sample torrent
/*
INSERT INTO public.torrents (info_hash, user_id, name, magnet_link, size_bytes, quality)
VALUES (
    '3a5d2e1f4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
    auth.uid(),
    'Iron Man (2008) 1080p BluRay',
    'magnet:?xt=urn:btih:3a5d2e1f4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
    2345678900,
    '1080p'
);
*/

-- Add torrent to collection
/*
INSERT INTO public.collection_torrents (collection_uuid, torrent_info_hash, sort_order)
SELECT uuid, '3a5d2e1f4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e', 0
FROM public.collections
WHERE name = 'Marvel Cinematic Universe'
  AND user_id = auth.uid()
LIMIT 1;
*/

-- ============================================================================
-- CLEANUP (OPTIONAL - DANGER ZONE)
-- Uncomment and run only if you need to completely reset the schema
-- ============================================================================

/*
-- Drop triggers first
DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
DROP TRIGGER IF EXISTS update_collection_on_item_insert ON public.collection_torrents;
DROP TRIGGER IF EXISTS update_collection_on_item_delete ON public.collection_torrents;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_collection_on_item_change();

-- Drop tables (CASCADE will drop foreign key constraints)
DROP TABLE IF EXISTS public.collection_torrents CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.torrents CASCADE;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. UUID Generation:
--    - Collections use client-generated UUIDs (crypto.randomUUID() in app)
--    - This ensures stable references across devices before first sync
--
-- 2. Soft Deletes:
--    - Collections use is_deleted flag instead of hard deletes
--    - This allows deletion to propagate across devices during sync
--    - Hard deletes would cause "missing record" errors on other devices
--
-- 3. Last Write Wins (LWW):
--    - Conflict resolution uses updated_at timestamp
--    - Newer timestamp always wins during sync
--    - Simple and predictable for single-user multi-device scenario
--
-- 4. Triggers:
--    - Auto-update updated_at on collection modifications
--    - Cascade update to parent collection when items are added/removed
--    - This ensures sync triggers even for join table changes
--
-- 5. RLS Policies:
--    - Users can only access their own data (privacy)
--    - Public collections readable by everyone (Phase 2+ feature)
--    - Join table access controlled via parent collection ownership
--
-- 6. Performance:
--    - Indexes on user_id, uuid, updated_at for fast queries
--    - Composite index on (collection_uuid, sort_order) for ordering
--    - UNIQUE constraint on (collection_uuid, torrent_info_hash) prevents duplicates
--
-- 7. Foreign Keys:
--    - CASCADE delete ensures no orphaned records
--    - torrents.imdb_id → movies.imdb_id (optional, may not exist in Supabase)
--    - collections → auth.users (CASCADE on user deletion)
--    - collection_torrents → collections + torrents (CASCADE on both)
--
-- ============================================================================
