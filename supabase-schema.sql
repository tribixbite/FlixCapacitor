-- FlixCapacitor Database Schema
-- Phase 12B: Backend Integration
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- COLLECTIONS TABLE
-- Stores shared movie/show collections
-- ============================================================================

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0 NOT NULL,
  is_public boolean DEFAULT true NOT NULL
);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Collections are publicly readable by share code (for sharing feature)
CREATE POLICY "Collections are publicly readable"
  ON collections FOR SELECT
  USING (is_public = true);

-- Users can create their own collections
CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can manage their own collections
CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_share_code ON collections(share_code);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- ============================================================================
-- FAVORITES SYNC TABLE
-- Stores user favorites for cross-device sync
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorites_sync (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id text NOT NULL,
  movie_type text NOT NULL, -- 'movie' or 'show'
  title text,
  year integer,
  poster_url text,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE favorites_sync ENABLE ROW LEVEL SECURITY;

-- Users can only access their own favorites
CREATE POLICY "Users can manage own favorites"
  ON favorites_sync FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites_sync(added_at DESC);

-- ============================================================================
-- SETTINGS SYNC TABLE
-- Stores user settings for cross-device sync
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings_sync (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE settings_sync ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can manage own settings"
  ON settings_sync FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- Anonymous usage analytics (no PII)
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_type text NOT NULL, -- 'app_open', 'movie_view', 'play_video', 'share', etc.
  event_data jsonb,
  device_info jsonb, -- {platform, os_version, app_version}
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (insert-only for everyone)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (for anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Only admins can read analytics (add admin check later if needed)
-- No public read policy by default

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for collections table
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for settings_sync table
DROP TRIGGER IF EXISTS update_settings_sync_updated_at ON settings_sync;
CREATE TRIGGER update_settings_sync_updated_at
  BEFORE UPDATE ON settings_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count for collections
CREATE OR REPLACE FUNCTION increment_view_count(share_code text)
RETURNS void AS $$
BEGIN
  UPDATE collections
  SET view_count = view_count + 1
  WHERE collections.share_code = increment_view_count.share_code;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data:
-- INSERT INTO collections (share_code, title, description, items, is_public) VALUES
-- ('test123', 'Sample Collection', 'A test collection', '[{"id": "tt1234567", "type": "movie", "title": "Test Movie", "year": 2024}]'::jsonb, true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- CLEANUP (if needed)
-- ============================================================================

-- Uncomment to drop all tables (WARNING: DESTRUCTIVE):
-- DROP TABLE IF EXISTS analytics_events CASCADE;
-- DROP TABLE IF EXISTS settings_sync CASCADE;
-- DROP TABLE IF EXISTS favorites_sync CASCADE;
-- DROP TABLE IF EXISTS collections CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

-- After running this schema:
-- 1. Verify all tables are created in the Supabase Table Editor
-- 2. Test RLS policies by trying to insert/read data
-- 3. Get your project URL and anon key from Settings > API
-- 4. Add them to your .env file
-- 5. Test the API client in your app

-- Security considerations:
-- - Collections are public for sharing (anyone with link can view)
-- - Favorites and settings are private (user-only access)
-- - Analytics events are write-only (insert-only policy)
-- - All user data is deleted when user account is deleted (CASCADE)

-- Performance considerations:
-- - Indexes on frequently queried columns (share_code, user_id, created_at)
-- - jsonb columns for flexible schema (items, settings, event_data)
-- - Automatic updated_at triggers for audit trail
