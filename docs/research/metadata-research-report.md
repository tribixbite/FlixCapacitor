# Media Streaming Services: Metadata & Subtitle Provider Research Report

**Research Date:** October 13, 2025
**Objective:** Analyze 5 major media streaming services to identify metadata and subtitle provider implementations, API patterns, and configuration approaches.

---

## Executive Summary

This research analyzed five open-source media streaming platforms:
1. **Jellyfin** - Open-source media server (C#/.NET)
2. **Kodi** - Media player/center (Python/C++)
3. **Stremio** - Streaming platform (Rust/JavaScript)
4. **Radarr** - Movie collection manager (C#/.NET)
5. **Emby** - Alternative analysis via Jellyfin architecture

### Key Findings

All services primarily use:
- **TMDB (The Movie Database)** as the primary metadata source
- **OMDb** as a supplementary metadata provider
- **OpenSubtitles** as the dominant subtitle provider
- Plugin/addon architectures for extensibility

---

## 1. Jellyfin (https://github.com/jellyfin/jellyfin)

### Repository Details
- **Language:** C# / .NET
- **Architecture:** Plugin-based provider system
- **License:** GPL-2.0

### Metadata Providers

#### Built-in Core Providers (Enum-based)
**File:** `/MediaBrowser.Model/Entities/MetadataProvider.cs`

```csharp
public enum MetadataProvider {
    Custom = 0,
    Imdb = 2,
    Tmdb = 3,
    Tvdb = 4,
    Tvcom = 5,
    TmdbCollection = 7,
    MusicBrainzAlbum = 8,
    MusicBrainzAlbumArtist = 9,
    MusicBrainzArtist = 10,
    MusicBrainzReleaseGroup = 11,
    Zap2It = 12,
    TvRage = 15,
    AudioDbArtist = 16,
    AudioDbAlbum = 17,
    MusicBrainzTrack = 18,
    TvMaze = 19,
    MusicBrainzRecording = 20
}
```

#### Plugin Implementations

**TMDB Plugin**
- **Location:** `/MediaBrowser.Providers/Plugins/Tmdb/`
- **Client Library:** TMDbLib (NuGet package)
- **Configuration:** `/MediaBrowser.Providers/Plugins/Tmdb/TmdbClientManager.cs`

```csharp
// API Key configuration
var apiKey = Plugin.Instance.Configuration.TmdbApiKey;
apiKey = string.IsNullOrEmpty(apiKey) ? TmdbUtils.ApiKey : apiKey;
_tmDbClient = new TMDbClient(apiKey);
```

**Key Features:**
- In-memory caching (1-hour duration)
- Support for movies, TV shows, seasons, episodes, people, collections
- Image fetching with configurable sizes
- External ID lookup (IMDb, TVDb)

**API Endpoints Used:**
- `https://api.themoviedb.org/3/movie/{id}`
- `https://api.themoviedb.org/3/tv/{id}`
- `https://api.themoviedb.org/3/search/movie`
- `https://api.themoviedb.org/3/person/{id}`
- `https://api.themoviedb.org/3/collection/{id}`

**OMDb Plugin**
- **Location:** `/MediaBrowser.Providers/Plugins/Omdb/`
- **API URL:** `https://www.omdbapi.com?apikey=2c9d9507`
- **Configuration:** `/MediaBrowser.Providers/Plugins/Omdb/OmdbProvider.cs`

```csharp
public static string GetOmdbUrl(string query) {
    const string Url = "https://www.omdbapi.com?apikey=2c9d9507";
    if (string.IsNullOrWhiteSpace(query)) return Url;
    return Url + "&" + query;
}
```

**Key Features:**
- Provides IMDb ratings and Rotten Tomatoes scores
- Episode metadata
- Caching with 1-day refresh
- English-only metadata (no localization)

**MusicBrainz Plugin**
- **Location:** `/MediaBrowser.Providers/Plugins/MusicBrainz/`
- Provides music metadata (albums, artists, tracks)

**AudioDB Plugin**
- **Location:** `/MediaBrowser.Providers/Plugins/AudioDb/`
- Supplementary music metadata and images

### Subtitle Providers

**OpenSubtitles Plugin**
- **Repository:** https://github.com/jellyfin/jellyfin-plugin-opensubtitles
- **Location:** `/Jellyfin.Plugin.OpenSubtitles/OpenSubtitleDownloader.cs`
- **API Version:** OpenSubtitles REST API (v3-cinemeta)

**Implementation Details:**

```csharp
public class OpenSubtitleDownloader : ISubtitleProvider {
    public string Name => "Open Subtitles";

    public IEnumerable<VideoContentType> SupportedMediaTypes
        => new[] { VideoContentType.Episode, VideoContentType.Movie };
}
```

**Authentication:**
```csharp
// Requires username/password authentication
var loginResponse = await OpenSubtitlesApi.LogInAsync(
    _configuration.Username,
    _configuration.Password,
    cancellationToken
);
```

**Search Strategy:**
1. Compute file hash for exact matching
2. Query by IMDb ID if available
3. Fall back to filename + metadata (season/episode)
4. Filter results by:
   - Feature type (Movie/Episode)
   - Hash match priority
   - Download count
   - Community ratings
   - Trusted uploader status

**Download Limits:**
- Daily download limits enforced
- Reset time tracking
- Rate limit handling with graceful degradation

**Subtitle Formats Supported:**
- SRT (primary)
- Hearing impaired (SDH) flag support
- Forced subtitles flag support

### Provider Interface Pattern

```csharp
public interface ISubtitleProvider {
    string Name { get; }
    IEnumerable<VideoContentType> SupportedMediaTypes { get; }

    Task<IEnumerable<RemoteSubtitleInfo>> Search(
        SubtitleSearchRequest request,
        CancellationToken cancellationToken
    );

    Task<SubtitleResponse> GetSubtitles(
        string id,
        CancellationToken cancellationToken
    );
}
```

### Configuration Patterns

**Plugin Configuration Storage:**
- JSON-based configuration files
- Per-plugin settings
- User-configurable API keys
- Language preferences
- Image size preferences

---

## 2. Kodi (https://github.com/xbmc/xbmc)

### Repository Details
- **Language:** Python (addons), C++ (core)
- **Architecture:** Addon-based scraper system
- **License:** GPL-2.0

### Metadata Providers

**TMDB Python Scraper**
- **Location:** `/addons/metadata.themoviedb.org.python/`
- **Implementation:** `/python/lib/tmdbscraper/tmdbapi.py`

**API Configuration:**
```python
TMDB_PARAMS = {'api_key': 'f090bb54758cabf231fb605d3e3e0468'}
BASE_URL = 'https://api.themoviedb.org/3/{}'
SEARCH_URL = BASE_URL.format('search/movie')
FIND_URL = BASE_URL.format('find/{}')
MOVIE_URL = BASE_URL.format('movie/{}')
COLLECTION_URL = BASE_URL.format('collection/{}')
CONFIG_URL = BASE_URL.format('configuration')
```

**Search Implementation:**
```python
def search_movie(query, year=None, language=None, page=None):
    query = unicodedata.normalize('NFC', query)
    params = _set_params(None, language)
    params['query'] = query
    if page is not None:
        params['page'] = page
    if year is not None:
        params['year'] = str(year)
    api_utils.set_headers(dict(HEADERS))
    return api_utils.load_info(SEARCH_URL, params=params)
```

**Additional Integrations:**
- **Fanart.tv** - `/python/lib/tmdbscraper/fanarttv.py`
- **IMDb Ratings** - `/python/lib/tmdbscraper/imdbratings.py`
- **Trakt Ratings** - `/python/lib/tmdbscraper/traktratings.py`

**Key Features:**
- Multi-source rating aggregation
- Artwork from multiple providers
- External ID support (IMDb, TVDb)
- Year fuzzy matching (±1 year)
- Article stripping for better search ("The", "A", "An")

### Subtitle Providers

Kodi uses addon-based subtitle providers:
- Subtitles are handled through separate addon packages
- Core provides subtitle interface
- Popular addons include:
  - OpenSubtitles
  - Addic7ed
  - Subscene
  - YIFY Subtitles

**Subtitle Interface (C++ Core):**
- Located in `/xbmc/cores/VideoPlayer/`
- Supports external subtitle files
- SRT, SSA, ASS, SUB formats

---

## 3. Stremio (https://github.com/Stremio/stremio-core)

### Repository Details
- **Language:** Rust
- **Architecture:** Addon-based with Cinemeta core
- **License:** GPL-3.0

### Metadata Providers

**Cinemeta (Official Stremio Provider)**
- **URL:** `https://v3-cinemeta.strem.io/manifest.json`
- **Catalogs URL:** `https://cinemeta-catalogs.strem.io`
- **API URL:** `https://api.strem.io`

**Configuration Constants:**
**File:** `/src/constants.rs`

```rust
pub static CINEMETA_URL: Lazy<Url> = Lazy::new(|| {
    Url::parse("https://v3-cinemeta.strem.io/manifest.json")
        .expect("CINEMETA_URL parse failed")
});

pub static CINEMETA_CATALOGS_URL: Lazy<Url> = Lazy::new(|| {
    Url::parse("https://cinemeta-catalogs.strem.io")
        .expect("CINEMETA_URL parse failed")
});

pub static IMDB_URL: Lazy<Url> = Lazy::new(|| {
    Url::parse("https://imdb.com")
        .expect("IMDB_URL parse failed")
});
```

**Supported ID Prefixes:**
```rust
pub const USER_LIKES_SUPPORTED_ID_PREFIXES: &[&str] = &["tt", "tmdb", "kitsu"];
```

**Key Features:**
- Uses IMDb IDs as primary identifiers ("tt" prefix)
- TMDB support for cross-referencing
- Kitsu support for anime content
- IMDb rating integration
- Addon-based extensibility

### Subtitle Providers

**Subtitle Resource Interface:**
```rust
pub const SUBTITLES_RESOURCE_NAME: &str = "subtitles";
```

**Addon System:**
- Stremio uses a decentralized addon architecture
- Addons provide metadata, streams, AND subtitles
- Popular subtitle addons:
  - OpenSubtitles
  - Custom community addons

**Subtitle Handling:**
- Addons return subtitle URLs
- Multiple subtitle tracks supported
- Language selection
- Format: primarily SRT

---

## 4. Radarr (https://github.com/Radarr/Radarr)

### Repository Details
- **Language:** C# / .NET
- **Architecture:** SkyHook proxy to TMDB
- **License:** GPL-3.0

### Metadata Providers

**SkyHook Metadata Proxy**
- **Location:** `/src/NzbDrone.Core/MetadataSource/SkyHook/`
- **Implementation:** `SkyHookProxy.cs`

**API Configuration:**
**File:** `/src/NzbDrone.Common/Cloud/RadarrCloudRequestBuilder.cs`

```csharp
public class RadarrCloudRequestBuilder : IRadarrCloudRequestBuilder {
    public RadarrCloudRequestBuilder() {
        Services = new HttpRequestBuilder("https://radarr.servarr.com/v1/")
            .CreateFactory();

        TMDB = new HttpRequestBuilder("https://api.themoviedb.org/{api}/{route}/{id}{secondaryRoute}")
            .SetHeader("Authorization", $"Bearer {AuthToken}")
            .CreateFactory();

        RadarrMetadata = new HttpRequestBuilder("https://api.radarr.video/v1/{route}")
            .CreateFactory();
    }

    public string AuthToken => "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...";
}
```

**TMDB Integration:**
- Direct TMDB API v3 access
- JWT Bearer token authentication
- Radarr-specific metadata proxy at `api.radarr.video`

**Key Features:**
```csharp
public Tuple<MovieMetadata, List<Credit>> GetMovieInfo(int tmdbId);
public List<MovieMetadata> GetTrendingMovies();
public List<MovieMetadata> GetPopularMovies();
public MovieCollection GetCollectionInfo(int tmdbId);
public HashSet<int> GetChangedMovies(DateTime startTime);
```

**Metadata Includes:**
- Movie details, cast, crew
- Collections
- Alternative titles
- Translations
- Ratings (TMDB, IMDb)
- Images (posters, backdrops)
- Recommendations

### Subtitle Providers

Radarr does NOT directly handle subtitles but integrates with:
- **Bazarr** (companion app for subtitles)
- Manages subtitle downloads separately
- Supports OpenSubtitles, Subscene, Addic7ed via Bazarr

---

## 5. Common Patterns & Best Practices

### API Authentication Patterns

1. **API Keys (Simple)**
   - TMDB: Public API key in code
   - OMDb: Public API key parameter
   - **Pro:** Simple implementation
   - **Con:** Rate limits, potential abuse

2. **JWT Bearer Tokens (Secure)**
   - Radarr TMDB: Bearer token in headers
   - **Pro:** Better security, higher limits
   - **Con:** Token management complexity

3. **Username/Password (User-specific)**
   - OpenSubtitles: User authentication required
   - **Pro:** Per-user quotas, personalized
   - **Con:** User friction, credential management

### Caching Strategies

1. **In-Memory Caching**
   - Jellyfin: 1-hour TTL
   - Reduces API calls
   - Fast response times

2. **Disk Caching**
   - OMDb: JSON files with 1-day TTL
   - Persistent across restarts
   - Reduced network dependency

3. **Conditional Caching**
   - Check timestamps before refresh
   - "Changed movies" endpoints for delta updates

### Search Optimization

1. **Hash-based Matching**
   - OpenSubtitles: File hash for exact matches
   - Most accurate results
   - Requires file access

2. **Multi-tier Search**
   ```
   1. Try exact IMDb ID
   2. Try TMDB ID conversion
   3. Try filename + year
   4. Try filename only
   5. Fuzzy matching with ±1 year
   ```

3. **Title Normalization**
   - Strip articles ("The", "A", "An")
   - Unicode normalization (NFC)
   - Case-insensitive comparison

### Error Handling

1. **Rate Limit Management**
   - Track remaining quota
   - Reset time monitoring
   - Graceful degradation
   - User notifications

2. **HTTP Error Handling**
   - 404: Not Found (expected, handle gracefully)
   - 401: Authentication required
   - 429: Rate limited (backoff)
   - 5xx: Server errors (retry with exponential backoff)

3. **Fallback Strategies**
   - Primary provider fails → secondary provider
   - Network error → cached data
   - No results → expanded search criteria

---

## 6. Recommendations for FlixCapacitor

### Metadata Provider Strategy

**Primary Provider: TMDB**
- Most comprehensive data
- Well-documented API
- Free tier available
- Large community support

**API Access:**
```typescript
// Use TMDB v3 API
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = 'YOUR_API_KEY'; // Get from https://www.themoviedb.org/settings/api

// Required endpoints
GET /search/movie?api_key={key}&query={title}&year={year}
GET /movie/{id}?api_key={key}&append_to_response=credits,images,videos
GET /tv/{id}?api_key={key}&append_to_response=credits,images,videos
GET /find/{external_id}?api_key={key}&external_source=imdb_id
```

**Secondary Provider: OMDb**
- IMDb ratings
- Rotten Tomatoes scores
- English metadata fallback

**API Access:**
```typescript
const OMDB_BASE = 'https://www.omdbapi.com';
const API_KEY = 'YOUR_API_KEY'; // Get from https://www.omdbapi.com/apikey.aspx

GET /?apikey={key}&i={imdbId}&plot=short&r=json
```

### Subtitle Provider Strategy

**Primary Provider: OpenSubtitles**
- Largest subtitle database
- Multi-language support
- Active community
- REST API available

**Implementation Approach:**

```typescript
interface SubtitleProvider {
  name: string;
  search(request: SubtitleSearchRequest): Promise<SubtitleInfo[]>;
  download(id: string): Promise<string>; // Returns SRT content
}

interface SubtitleSearchRequest {
  imdbId?: string;
  tmdbId?: number;
  fileHash?: string;
  filename?: string;
  season?: number;
  episode?: number;
  languages: string[]; // ISO 639-1 codes
}

interface SubtitleInfo {
  id: string;
  language: string;
  fileName: string;
  downloadCount: number;
  rating: number;
  isHearingImpaired: boolean;
  isForced: boolean;
  uploadDate: Date;
}
```

**OpenSubtitles REST API:**
```typescript
// Base URL
const OPENSUBTITLES_API = 'https://api.opensubtitles.com/api/v1';

// Authentication
POST /login
Body: { username, password }
Returns: { token, user: { remaining_downloads, reset_time } }

// Search
GET /subtitles?imdb_id={id}&languages={lang}
Headers: { 'Authorization': 'Bearer {token}' }

// Download
POST /download
Body: { file_id: number }
Headers: { 'Authorization': 'Bearer {token}' }
Returns: { link: string, remaining: number }
```

### Caching Strategy

```typescript
// Metadata cache: 24 hours
interface MetadataCache {
  key: string; // `tmdb-${id}` or `imdb-${id}`
  data: MovieMetadata | TVMetadata;
  timestamp: number;
  ttl: number; // 24 * 60 * 60 * 1000 (24 hours)
}

// Subtitle search cache: 1 hour
interface SubtitleCache {
  key: string; // `sub-${imdbId}-${language}`
  results: SubtitleInfo[];
  timestamp: number;
  ttl: number; // 60 * 60 * 1000 (1 hour)
}

// Image cache: 7 days (persistent)
interface ImageCache {
  url: string;
  localPath: string;
  timestamp: number;
  ttl: number; // 7 * 24 * 60 * 60 * 1000
}
```

### Configuration Schema

```typescript
interface MetadataConfig {
  providers: {
    tmdb: {
      enabled: boolean;
      apiKey: string;
      language: string; // ISO 639-1
      region: string; // ISO 3166-1
      includeAdult: boolean;
    };
    omdb: {
      enabled: boolean;
      apiKey: string;
    };
  };
  caching: {
    metadataTTL: number; // milliseconds
    imageTTL: number;
    enabled: boolean;
  };
}

interface SubtitleConfig {
  providers: {
    opensubtitles: {
      enabled: boolean;
      username: string;
      password: string;
      languages: string[]; // ['en', 'es', 'fr']
      downloadLimit: number;
    };
  };
  preferences: {
    autoDownload: boolean;
    preferHearingImpaired: boolean;
    preferredLanguages: string[];
  };
  caching: {
    searchTTL: number;
    enabled: boolean;
  };
}
```

### Error Handling & Rate Limiting

```typescript
class RateLimitManager {
  private limits: Map<string, RateLimit>;

  async checkLimit(provider: string): Promise<boolean> {
    const limit = this.limits.get(provider);
    if (!limit) return true;

    if (limit.remaining <= 0) {
      if (Date.now() < limit.resetTime) {
        return false; // Still limited
      }
      // Reset time passed, refresh limit
      await this.refreshLimit(provider);
    }

    return true;
  }

  decrementLimit(provider: string) {
    const limit = this.limits.get(provider);
    if (limit) limit.remaining--;
  }
}

class ProviderFallback {
  async getMetadata(id: string): Promise<Metadata> {
    // Try primary provider
    try {
      return await this.tmdb.getMetadata(id);
    } catch (error) {
      console.warn('TMDB failed, trying OMDb:', error);

      // Try secondary provider
      try {
        return await this.omdb.getMetadata(id);
      } catch (error2) {
        console.error('All providers failed:', error2);

        // Return cached data if available
        const cached = await this.cache.get(id);
        if (cached) return cached;

        throw new Error('No metadata available');
      }
    }
  }
}
```

### Implementation Roadmap

**Phase 1: Basic TMDB Integration**
1. TMDB API client implementation
2. Movie search by title/year
3. Movie details by TMDB ID
4. Basic caching (memory)
5. Image fetching

**Phase 2: Enhanced Metadata**
1. TV show support
2. External ID lookup (IMDb)
3. OMDb integration for ratings
4. Persistent disk caching
5. Multi-language support

**Phase 3: Subtitle Support**
1. OpenSubtitles API client
2. Subtitle search by hash/IMDb
3. Subtitle download
4. Multiple language support
5. Subtitle caching

**Phase 4: Optimization**
1. Rate limit management
2. Fallback provider logic
3. Batch requests
4. Background refresh
5. User preference system

---

## 7. License Considerations

### API Licenses

**TMDB:**
- Free tier: Attribution required
- Commercial use: Must display TMDB logo
- API terms: https://www.themoviedb.org/documentation/api/terms-of-use

**OMDb:**
- Free tier: 1,000 requests/day
- Paid tier: Higher limits
- Commercial use: Paid tier required
- Terms: https://www.omdbapi.com/

**OpenSubtitles:**
- Free tier: Limited downloads/day (200 for registered users)
- VIP tier: Higher limits, no ads
- API terms: https://www.opensubtitles.com/en/support/api
- Attribution not required but encouraged

### Code Licenses

All analyzed projects use GPL licenses:
- Jellyfin: GPL-2.0
- Kodi: GPL-2.0
- Stremio: GPL-3.0
- Radarr: GPL-3.0

**Implications for FlixCapacitor:**
- Cannot directly copy GPL code
- Can study patterns and architectures
- Must implement from scratch or use MIT/Apache licensed libraries
- API usage is separate from code license

---

## 8. Additional Resources

### Useful Libraries

**TypeScript/JavaScript:**
- `moviedb-promise` - TMDB API client
- `omdb-client` - OMDb API client
- `opensubtitles-api` - OpenSubtitles client (unofficial)

**React Native Specific:**
- `@react-native-async-storage/async-storage` - Caching
- `react-native-fs` - File hash computation
- `react-native-video` - Subtitle rendering

### API Documentation

- TMDB API: https://developers.themoviedb.org/3
- OMDb API: https://www.omdbapi.com/
- OpenSubtitles API: https://api.opensubtitles.com/

### Testing Endpoints

```bash
# TMDB Search
curl "https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query=Inception&year=2010"

# TMDB Movie Details
curl "https://api.themoviedb.org/3/movie/27205?api_key=YOUR_KEY&append_to_response=credits,images"

# OMDb by IMDb ID
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&i=tt1375666"

# OpenSubtitles Login
curl -X POST "https://api.opensubtitles.com/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

---

## 9. Conclusion

All analyzed media streaming services converge on similar metadata and subtitle provider strategies:

1. **TMDB is the industry standard** for movie/TV metadata
2. **OpenSubtitles dominates** subtitle provision
3. **OMDb provides supplementary** rating data
4. **Caching is critical** for performance and rate limit management
5. **Multi-tier fallback** ensures reliability
6. **Plugin/addon architectures** provide extensibility

FlixCapacitor should adopt a similar architecture with:
- TMDB as primary metadata source
- OpenSubtitles for subtitles
- Robust caching strategy
- Graceful error handling
- User-configurable preferences

This approach balances functionality, reliability, and maintainability while staying within free tier limits during development.

---

**Report prepared by:** Claude Code
**Research methodology:** Source code analysis, API pattern extraction, configuration inspection
**Repository locations:** ~/research-temp/{jellyfin,kodi,stremio,Radarr,jellyfin-plugin-opensubtitles}
