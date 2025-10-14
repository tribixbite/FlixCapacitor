# API Provider Integration Guide

Complete guide for integrating TMDB, OMDb, and OpenSubtitles API clients into FlixCapacitor.

## 🎯 Overview

The API clients are now **fully integrated** and available globally throughout the app via:
- `App.API.TMDB` - The Movie Database client
- `App.API.OMDb` - Open Movie Database client
- `App.API.OpenSubtitles` - OpenSubtitles REST API client

Or directly via:
- `window.TMDBClient`
- `window.OMDbClient`
- `window.OpenSubtitlesClient`

---

## ✅ What's Already Done

### 1. API Configuration ✅
- `.env` file configured with API keys
- Keys match existing `Settings.tmdb.api_key`
- Auto-validation on startup
- Configuration accessible via `App.API.Config`

### 2. Global Bridge ✅
- `api-bridge.js` created to expose ES modules to CommonJS code
- Initialized automatically in `main.js` on app startup
- Helper functions for common operations included

### 3. Clients Ready ✅
- **TMDB Client**: Movie/TV search, metadata, images
- **OMDb Client**: IMDb ratings, Rotten Tomatoes, Metacritic
- **OpenSubtitles Client**: Subtitle search and download

---

## 🔧 How to Use in Existing Code

### Example 1: Get Movie Metadata in Detail View

```javascript
// In src/app/lib/views/movie_detail.js

onRender: function() {
    const imdbId = this.model.get('imdb_id');

    if (imdbId && window.App.API) {
        // Get enhanced metadata from multiple sources
        this.loadEnhancedMetadata(imdbId);
    }
},

loadEnhancedMetadata: async function(imdbId) {
    try {
        // Use the bridge helper function
        const { getEnhancedMovieMetadata } = await import('../lib/api-bridge.js');
        const metadata = await getEnhancedMovieMetadata(imdbId);

        if (metadata) {
            // Update model with enhanced data
            this.model.set({
                tmdb_rating: metadata.ratings.tmdb,
                imdb_rating: metadata.ratings.imdb,
                rt_rating: metadata.ratings.rottenTomatoes,
                metacritic_rating: metadata.ratings.metacritic,
                backdrop_url: metadata.backdrop,
                cast: metadata.cast
            });

            // Re-render with new data
            this.render();
        }
    } catch (error) {
        console.warn('Failed to load enhanced metadata:', error);
        // Continue with existing data
    }
}
```

### Example 2: Search Movies with TMDB

```javascript
// In src/app/lib/views/browser/movie_browser.js

searchMovies: async function(query, year) {
    if (!window.App.API) {
        console.warn('API clients not available');
        return;
    }

    try {
        const results = await App.API.TMDB.searchMovie(query, year);

        // Convert TMDB results to app format
        const movies = results.results.map(movie => {
            return {
                title: movie.title,
                year: new Date(movie.release_date).getFullYear(),
                rating: Math.round(movie.vote_average * 10) / 10,
                poster: App.API.TMDB.getPosterUrl(movie.poster_path, 'medium'),
                backdrop: App.API.TMDB.getBackdropUrl(movie.backdrop_path, 'medium'),
                overview: movie.overview,
                tmdb_id: movie.id
            };
        });

        // Display results
        this.collection.reset(movies);

    } catch (error) {
        console.error('Movie search failed:', error);
    }
}
```

### Example 3: Get Subtitles for Current Movie

```javascript
// In src/app/lib/views/player/player.js

loadSubtitles: async function() {
    const imdbId = this.model.get('imdb_id');
    const language = Settings.subtitle_language || 'en';

    if (!imdbId || !window.App.API) {
        return;
    }

    try {
        // Search for subtitles
        const results = await App.API.OpenSubtitles.searchByIMDb(imdbId, language);

        // Get best subtitle
        const best = App.API.OpenSubtitles.getBestSubtitle(results, language);

        if (best) {
            console.log('Found subtitle:', best.fileName);

            // Get download link
            const downloadInfo = await App.API.OpenSubtitles.getDownloadInfo(best.fileId);

            if (downloadInfo.link) {
                // Download and apply subtitle
                const subtitleContent = await App.API.OpenSubtitles.downloadSubtitle(downloadInfo.link);

                // Convert to data URL for video.js
                const blob = new Blob([subtitleContent], { type: 'text/vtt' });
                const subtitleUrl = URL.createObjectURL(blob);

                // Add to video player
                this.player.addRemoteTextTrack({
                    kind: 'subtitles',
                    src: subtitleUrl,
                    srclang: best.language,
                    label: best.language.toUpperCase()
                });
            }
        }
    } catch (error) {
        console.warn('Failed to load subtitles:', error);
    }
}
```

### Example 4: Display Multiple Ratings

```javascript
// In template (e.g., movie detail template)

<div class="ratings">
    <% if (tmdb_rating) { %>
        <span class="rating tmdb">
            <span class="rating-icon">🎬</span>
            <span class="rating-value"><%= tmdb_rating %>/10</span>
            <span class="rating-source">TMDB</span>
        </span>
    <% } %>

    <% if (imdb_rating) { %>
        <span class="rating imdb">
            <span class="rating-icon">⭐</span>
            <span class="rating-value"><%= imdb_rating %>/10</span>
            <span class="rating-source">IMDb</span>
        </span>
    <% } %>

    <% if (rt_rating) { %>
        <span class="rating rt">
            <span class="rating-icon">🍅</span>
            <span class="rating-value"><%= rt_rating %>%</span>
            <span class="rating-source">RT</span>
        </span>
    <% } %>
</div>
```

---

## 🚀 Quick Integration Tasks

### Task 1: Add TMDB Images to Movie Cards (Easy)

**File**: `src/app/lib/views/browser/item.js`

```javascript
// Replace existing image loading with TMDB
onRender: function() {
    const posterPath = this.model.get('poster_path');

    if (posterPath && window.App.API) {
        const imageUrl = App.API.TMDB.getPosterUrl(posterPath, 'medium');
        this.$('.poster-image').attr('src', imageUrl);
    }
}
```

### Task 2: Show IMDb Rating on Movie Cards (Easy)

**File**: Same as above

```javascript
// Fetch and display IMDb rating
async loadRating() {
    const imdbId = this.model.get('imdb_id');

    if (imdbId && window.App.API) {
        try {
            const movie = await App.API.OMDb.getByIMDbId(imdbId);
            const rating = App.API.OMDb.getIMDbRating(movie);

            if (rating) {
                this.$('.rating-value').text(rating + '/10');
                this.$('.rating-container').show();
            }
        } catch (error) {
            // Silently fail - not critical
        }
    }
}
```

### Task 3: Replace Old OpenSubtitles Provider (Medium)

**File**: `src/app/lib/providers/opensubtitles.js`

Replace the old XML-RPC API with the new REST API:

```javascript
OpenSubtitles.prototype.fetch = async function (queryParams) {
    // Use new API client instead of old XML-RPC
    if (!window.App.API) {
        throw new Error('API clients not initialized');
    }

    try {
        let results;

        // Search by IMDb ID (preferred)
        if (queryParams.imdbid) {
            results = await App.API.OpenSubtitles.searchByIMDb(
                queryParams.imdbid,
                queryParams.sublanguageid || 'en',
                queryParams.season,
                queryParams.episode
            );
        }
        // Search by file hash (most accurate)
        else if (queryParams.fileHash) {
            results = await App.API.OpenSubtitles.searchByHash(
                queryParams.fileHash,
                queryParams.sublanguageid || 'en'
            );
        }
        // Search by title
        else if (queryParams.query) {
            results = await App.API.OpenSubtitles.searchByTitle(
                queryParams.query,
                queryParams.year,
                queryParams.sublanguageid || 'en'
            );
        }

        // Format results for compatibility with existing code
        const formatted = App.API.OpenSubtitles.formatResults(results);
        const subtitles = {};

        formatted.forEach(sub => {
            if (!subtitles[sub.language]) {
                subtitles[sub.language] = {
                    url: sub.url,
                    language: sub.language
                };
            }
        });

        return formatForButter(subtitles);

    } catch (error) {
        console.error('Subtitle search failed:', error);
        return {};
    }
};
```

---

## 📚 Helper Functions Available

The `api-bridge.js` module provides these helper functions:

### `getEnhancedMovieMetadata(imdbId)`
Returns comprehensive metadata from both TMDB and OMDb:
```javascript
const metadata = await getEnhancedMovieMetadata('tt1375666');
console.log(metadata);
// {
//   title, year, runtime, overview, genres,
//   ratings: { tmdb, imdb, rottenTomatoes, metacritic },
//   poster, backdrop, cast, directors, writers, ...
// }
```

### `getSubtitlesForMovie(imdbId, language)`
Returns subtitles with best match pre-selected:
```javascript
const subs = await getSubtitlesForMovie('tt1375666', 'en');
console.log(subs.best);        // Best subtitle
console.log(subs.all);         // All subtitles
console.log(subs.byLanguage);  // Grouped by language
```

---

## 🎨 CSS for Ratings Display

Add to your styles:

```css
.ratings {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
}

.rating {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 0.9rem;
}

.rating-icon {
    font-size: 1.2rem;
}

.rating-value {
    font-weight: bold;
}

.rating-source {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-left: 0.25rem;
}

.rating.tmdb .rating-value { color: #01d277; }
.rating.imdb .rating-value { color: #f5c518; }
.rating.rt .rating-value { color: #fa320a; }
