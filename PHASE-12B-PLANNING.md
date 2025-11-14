# Phase 12B: Backend Integration - Planning

**Date:** 2025-11-14
**Status:** 📋 PLANNING
**Priority:** MEDIUM
**Estimated Effort:** 5-7 days

---

## Overview

Phase 12B will add cloud backend functionality using Supabase, enabling:
- User authentication (email/password, Google, Apple)
- Cloud-backed collection sharing
- Cross-device favorites sync
- Settings cloud backup
- Anonymous usage analytics

---

## Current Limitations (Without Backend)

- ❌ Collection sharing uses localStorage (not shareable across devices)
- ❌ No cloud backup for favorites or settings
- ❌ No user authentication
- ❌ No analytics or usage tracking
- ❌ Data loss on app uninstall

---

## Proposed Architecture

### Technology Stack

**Backend:** Supabase (PostgreSQL + Auth + Realtime)

**Why Supabase:**
- ✅ Built-in authentication (Google, Apple, Email)
- ✅ PostgreSQL database (relational, powerful)
- ✅ Realtime subscriptions (for cross-device sync)
- ✅ Row-level security (secure by default)
- ✅ Generous free tier (500MB database, 50K auth users)
- ✅ TypeScript SDK
- ✅ Self-hostable (optional future migration)

**Alternative Options:**
- Firebase (better iOS support, but vendor lock-in)
- Custom Node.js API (full control, more maintenance)
- PocketBase (self-hosted, simpler but less features)

---

## Database Schema

### Tables

**1. collections** - Shared movie/show collections
```sql
CREATE TABLE collections (
  id uuid PRIMARY KEY,
  share_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  title text,
  items jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  expires_at timestamp,
  view_count integer DEFAULT 0
);
```

**2. favorites_sync** - Cloud-synced favorites
```sql
CREATE TABLE favorites_sync (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  movie_id text NOT NULL,
  added_at timestamp DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
```

**3. settings_sync** - Cloud-synced settings
```sql
CREATE TABLE settings_sync (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  settings jsonb NOT NULL,
  updated_at timestamp DEFAULT now()
);
```

**4. analytics_events** - Usage analytics
```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp DEFAULT now()
);
```

---

## Implementation Plan

### Day 1-2: Supabase Setup ⏳
- [ ] Create Supabase project
- [ ] Set up database schema (run SQL migrations)
- [ ] Configure Row-Level Security (RLS) policies
- [ ] Test database operations in SQL editor
- [ ] Document API endpoints and schema

### Day 3-4: API Client Implementation ⏳
- [ ] Install @supabase/supabase-js dependency
- [ ] Create src/app/lib/api-client.ts
- [ ] Implement authentication methods
  - signUp(email, password)
  - signIn(email, password)
  - signOut()
  - getUser()
- [ ] Implement collection CRUD operations
  - createCollection(items)
  - getCollection(shareCode)
- [ ] Implement favorites sync
  - syncFavorites(favorites)
  - getFavorites()
- [ ] Implement settings sync
  - syncSettings(settings)
  - getSettings()
- [ ] Add analytics logging
  - logEvent(type, data)
- [ ] Add unit tests for API client

### Day 5-6: UI Integration ⏳
- [ ] Create auth modal (sign in/sign up)
  - Add to mobile-ui-views.ts
  - Design with Tailwind CSS
  - Add Google/Apple sign-in buttons (optional)
- [ ] Update collection sharing to use API
  - Replace localStorage with Supabase
  - Generate shareable links
- [ ] Add sync buttons to settings
  - "Sync Favorites to Cloud"
  - "Sync Settings to Cloud"
  - "Sign Out"
- [ ] Add user profile view
  - Show email, account created date
  - Sign out button
- [ ] Test authentication flow end-to-end

### Day 7: Testing & Polish ⏳
- [ ] Test collection sharing flow
  - Create collection → Share → Import on different device
- [ ] Test favorites sync
  - Add favorites on device A → Sign in on device B → Verify sync
- [ ] Test offline/online transitions
  - Add favorites offline → Go online → Auto-sync
- [ ] Handle auth errors gracefully
  - Invalid credentials
  - Network errors
  - Token expiration
- [ ] Add loading states to all async operations
- [ ] Add error toast notifications

---

## Dependencies

### NPM Packages
```json
{
  "@supabase/supabase-js": "^2.45.0"
}
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Files to Create/Modify

### New Files
- `src/app/lib/api-client.ts` - Supabase API client (~300 lines)
- `src/app/views/auth-modal-view.ts` - Authentication modal (~150 lines)
- `tests/api-client.test.ts` - Unit tests (~200 lines)
- `.env.example` - Environment variable template

### Modified Files
- `src/app/lib/mobile-ui-views.ts` - Add auth UI integration (~50 lines)
- `src/app/lib/favorites-service.ts` - Add cloud sync (~30 lines)
- `src/app/lib/settings-manager.ts` - Add cloud sync (~30 lines)
- `package.json` - Add Supabase dependency
- `README.md` - Update setup instructions

---

## User Stories

### 1. User Authentication
**As a user**, I want to create an account and sign in, so that my data is backed up to the cloud.

**Acceptance Criteria:**
- Can sign up with email and password
- Can sign in with existing credentials
- Can sign out
- Auth state persists across app restarts
- Error messages are clear and helpful

### 2. Collection Sharing
**As a user**, I want to share my movie collection with friends, so they can easily import it.

**Acceptance Criteria:**
- Can create a shareable collection from selected items
- Share link opens in browser and shows preview
- Can import collection with one tap
- Collection includes posters, titles, and years
- Share code is easy to read (e.g., "12345_abc")

### 3. Favorites Sync
**As a user**, I want my favorites to sync across devices, so I don't lose my list.

**Acceptance Criteria:**
- Adding favorite on device A syncs to device B
- Removing favorite on device A syncs to device B
- Offline changes sync when connection restored
- Conflict resolution (last-write-wins)
- Manual sync button available

### 4. Settings Sync
**As a user**, I want my settings to sync across devices, so I don't need to reconfigure.

**Acceptance Criteria:**
- Settings changes sync to cloud
- New device pulls latest settings
- Can reset to server settings
- Can force push local settings to server

---

## Security Considerations

### Row-Level Security (RLS)
- ✅ Collections readable by anyone (public sharing)
- ✅ Collections writable only by owner
- ✅ Favorites readable/writable only by owner
- ✅ Settings readable/writable only by owner
- ✅ Analytics events insert-only (no read/update/delete)

### Authentication
- ✅ Passwords hashed by Supabase Auth
- ✅ JWT tokens for session management
- ✅ Automatic token refresh
- ✅ Secure storage in Capacitor Preferences

### Data Privacy
- ⚠️ Anonymous analytics (no PII)
- ⚠️ Collection sharing is public (anyone with link can view)
- ⚠️ Favorites and settings are private (user-only)

---

## Risks & Mitigation

### Risk 1: Supabase Free Tier Limits
**Impact:** App breaks when limits exceeded
**Mitigation:**
- Monitor usage in Supabase dashboard
- Add usage limits client-side (max 50 favorites sync per hour)
- Upgrade to Pro plan if needed ($25/month)

### Risk 2: Network Errors
**Impact:** Sync failures frustrate users
**Mitigation:**
- Add retry logic with exponential backoff
- Queue failed operations for retry
- Show clear error messages
- Support offline mode gracefully

### Risk 3: Data Loss During Sync
**Impact:** Users lose favorites/settings
**Mitigation:**
- Implement conflict resolution (last-write-wins)
- Add "Export Backup" feature (JSON download)
- Test sync scenarios thoroughly

---

## Success Criteria

### Phase 12B Complete When:
- ✅ Supabase project set up and configured
- ✅ Database schema created with RLS policies
- ✅ API client implemented and tested
- ✅ Authentication UI integrated
- ✅ Collection sharing uses Supabase (not localStorage)
- ✅ Favorites sync to/from cloud
- ✅ Settings sync to/from cloud
- ✅ All features tested end-to-end
- ✅ Error handling and loading states added
- ✅ Documentation updated

---

## Next Steps

### Option 1: Proceed with Supabase Setup
1. Create Supabase account at https://supabase.com
2. Create new project: `flixcapacitor-backend`
3. Run database migrations (SQL schema)
4. Get API credentials (URL + anon key)
5. Add to `.env` file
6. Install `@supabase/supabase-js`
7. Implement API client

### Option 2: Defer Backend Integration
- Skip Phase 12B for now
- Proceed to Phase 12C (Testing & QA)
- Come back to backend later

### Option 3: Use Alternative Backend
- Consider Firebase, PocketBase, or custom API
- Would require different implementation

---

## Estimated Timeline

**Total: 5-7 days**
- Supabase Setup: 1-2 days
- API Client: 2 days
- UI Integration: 2 days
- Testing: 1 day

**Start Date:** TBD
**Target Completion:** TBD

---

**Status:** 📋 PLANNING - Awaiting user decision

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
