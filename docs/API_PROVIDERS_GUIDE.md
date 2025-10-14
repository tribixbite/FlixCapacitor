# API Providers Guide

Complete guide to using TMDB, OMDb, and OpenSubtitles API clients in FlixCapacitor.

## 📋 Table of Contents

- [Setup](#setup)
- [TMDB Client](#tmdb-client)
- [OMDb Client](#omdb-client)
- [OpenSubtitles Client](#opensubtitles-client)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Rate Limits](#rate-limits)

---

## Setup

### 1. Configure API Keys

All API keys are stored in `.env` file (already configured):

```env
VITE_TMDB_API_KEY=533c25bd144434c8c046a2069f65612e
VITE_OMDB_API_KEY=a25890ce
VITE_OPENSUB_API_KEY=H5eBv8EJzjuXHYZyfZuzXXCQmk3mKhWu
```

### 2. Import Clients

```javascript
import TMDBClient from './src/app/lib/providers/tmdb-client.js';
import OMDbClient from './src/app/lib/providers/omdb-client.js';
import OpenSubtitlesClient from './src/app/lib/providers/opensubtitles-client.js';
```

---

## TMDB Client

### Search Movies

```javascript
// Search by title
const results = await TMDBClient.searchMovie('Inception', 2010);
console.log(results.results[0]); // First result

// Get movie details
const movieId = results.results[0].id;
const details = await TMDBClient.getMovieDetails(movieId);

console.log({
    title: details.title,
    year: TMDBClient.getReleaseYear(details),
    rating: TMDBClient.getRating(details),
    runtime: TMDBClient.formatRuntime(details.runtime),
    imdbId: TMDBClient.getIMDbId(details),
    poster: TMDBClient.getBestPoster(details),
    backdrop: TMDBClient.getBestBackdrop(details)
});
```

### Search TV Shows

```javascript
// Search TV show
const results = await TMDBClient.searchTV('Breaking Bad', 2008);
const showId = results.results[0].id;

// Get show details
const details = await TMDBClient.getTVDetails(showId);

// Get season details
const season = await TMDBClient.getSeasonDetails(showId, 1);

// Get episode details
const episode = await TMDBClient.getEpisodeDetails(showId, 1, 1);
```

### Find by IMDb ID

```javascript
// Find movie/show by IMDb ID
const result = await TMDBClient.findByExternalId('tt1375666', 'imdb_id');

if (result.movie_results.length > 0) {
    const movie = result.movie_results[0];
    console.log('Found movie:', movie.title);
}
```

### Discover & Browse

```javascript
// Get popular movies
const popular = await TMDBClient.getPopularMovies();

// Get trending (week)
const trending = await TMDBClient.getTrending('movie', 'week');

// Get top rated
const topRated = await TMDBClient.getTopRatedMovies();

// Discover with filters
const filtered = await TMDBClient.discoverMovies({
    with_genres: '28', // Action
    'primary_release_year': 2024,
    'vote_average.gte': 7.0
});
```

### Get Images

```javascript
// Get poster URL
const posterSmall = TMDBClient.getPosterUrl('/abc123.jpg', 'small');   // w185
const posterMedium = TMDBClient.getPosterUrl('/abc123.jpg', 'medium'); // w342
const posterLarge = TMDBClient.getPosterUrl('/abc123.jpg', 'large');   // w500

// Get backdrop URL
const backdropMedium = TMDBClient.getBackdropUrl('/xyz789.jpg', 'medium'); // w780

// Or use direct method
const anyImage = TMDBClient.getImageUrl('/path.jpg', 'w500');
```

---

## OMDb Client

### Get by IMDb ID

```javascript
// Get movie details by IMDb ID
const movie = await OMDbClient.getByIMDbId('tt1375666');

console.log({
    title: movie.Title,
    year: movie.Year,
    imdbRating: OMDbClient.getIMDbRating(movie),
    rottenTomatoes: OMDbClient.getRottenTomatoesScore(movie),
    metacritic: OMDbClient.getMetacriticScore(movie),
    genres: OMDbClient.getGenres(movie),
    actors: OMDbClient.getActors(movie),
    directors: OMDbClient.getDirectors(movie)
});
```

### Get All Ratings

```javascript
const movie = await OMDbClient.getByIMDbId('tt1375666');
const ratings = OMDbClient.getAllRatings(movie);

console.log(ratings);
// {
//   imdb: 8.8,
//   rottenTomatoes: 87,
//   metacritic: 74,
//   raw: [...]
// }
```

### Search by Title

```javascript
// Search
const results = await OMDbClient.search('Inception', 'movie', 2010);

// Get by title
const movie = await OMDbClient.getByTitle('Inception', 'movie', 2010, 'full');
```

### TV Episodes

```javascript
// Get episode details
const episode = await OMDbClient.getEpisode('tt0903747', 5, 14);
console.log(episode.Title); // "Ozymandias"
```

---

## OpenSubtitles Client

### Search by IMDb ID

```javascript
// Search subtitles for a movie
const results = await OpenSubtitlesClient.searchByIMDb('tt1375666', 'en');

// Get best subtitle automatically
const best = OpenSubtitlesClient.getBestSubtitle(results, 'en');

console.log({
    language: best.language,
    fileName: best.fileName,
    downloads: best.downloadCount,
    rating: best.rating,
    hearingImpaired: best.hearingImpaired
});
```

### Search for TV Episode

```javascript
// Search subtitles for TV episode
const results = await OpenSubtitlesClient.searchByIMDb(
    'tt0903747',  // Breaking Bad
    'en',         // English
    5,            // Season 5
    14            // Episode 14
);

const best = OpenSubtitlesClient.getBestSubtitle(results);
```

### Download Subtitle

```javascript
// Complete workflow: Search and download
const subtitle = await OpenSubtitlesClient.getSubtitle('tt1375666', 'en');

if (subtitle) {
    console.log('Downloaded:', subtitle.metadata.fileName);
    console.log('Content:', subtitle.content); // SRT content
    console.log('Link:', subtitle.downloadLink);
}
```

### Search by File Hash

```javascript
// Most accurate method (if you have the video file)
const hash = 'abc123def456'; // OpenSubtitles hash
const results = await OpenSubtitlesClient.searchByHash(hash, 'en');
```

### Multi-Language Support

```javascript
// Get subtitles in multiple languages
const results = await OpenSubtitlesClient.searchByIMDb('tt1375666', 'en,es,fr');

// Group by language
const byLanguage = OpenSubtitlesClient.groupByLanguage(results);

console.log(byLanguage);
// {
//   en: [...],
//   es: [...],
//   fr: [...]
// }
```

---

## Complete Examples

### Example 1: Get Movie Metadata from Multiple Sources

```javascript
async function getCompleteMovieInfo(imdbId) {
    try {
        // 1. Get TMDB info by IMDb ID
        const tmdbResult = await TMDBClient.findByExternalId(imdbId, 'imdb_id');
        const tmdbMovie = tmdbResult.movie_results[0];
        const tmdbDetails = await TMDBClient.getMovieDetails(tmdbMovie.id);

        // 2. Get OMDb ratings
        const omdbMovie = await OMDbClient.getByIMDbId(imdbId);
        const ratings = OMDbClient.getAllRatings(omdbMovie);

        // 3. Combine data
        return {
            // Basic info from TMDB
            title: tmdbDetails.title,
            year: TMDBClient.getReleaseYear(tmdbDetails),
            runtime: TMDBClient.formatRuntime(tmdbDetails.runtime),
            overview: tmdbDetails.overview,
            genres: tmdbDetails.genres.map(g => g.name),

            // Images from TMDB
            poster: TMDBClient.getBestPoster(tmdbDetails),
            backdrop: TMDBClient.getBestBackdrop(tmdbDetails),

            // Ratings from multiple sources
            ratings: {
                tmdb: TMDBClient.getRating(tmdbDetails),
                imdb: ratings.imdb,
                rottenTomatoes: ratings.rottenTomatoes,
                metacritic: ratings.metacritic
            },

            // Cast
            cast: tmdbDetails.credits.cast.slice(0, 10),

            // Additional from OMDb
            actors: OMDbClient.getActors(omdbMovie),
            directors: OMDbClient.getDirectors(omdbMovie),
            rated: OMDbClient.getRating(omdbMovie)
        };
    } catch (error) {
        console.error('Failed to get movie info:', error);
        return null;
    }
}

// Usage
const movieInfo = await getCompleteMovieInfo('tt1375666');
console.log(movieInfo);
```

### Example 2: Search Movie and Get Subtitles

```javascript
async function searchAndGetSubtitles(title, year, language = 'en') {
    try {
        // 1. Search on TMDB
        const searchResults = await TMDBClient.searchMovie(title, year);

        if (searchResults.results.length === 0) {
            console.log('Movie not found');
            return null;
        }

        const movie = searchResults.results[0];

        // 2. Get full details
        const details = await TMDBClient.getMovieDetails(movie.id);
        const imdbId = TMDBClient.getIMDbId(details);

        // 3. Get subtitles
        const subtitle = await OpenSubtitlesClient.getSubtitle(imdbId, language);

        return {
            movie: {
                title: details.title,
                year: TMDBClient.getReleaseYear(details),
                poster: TMDBClient.getBestPoster(details)
            },
            subtitle: subtitle ? {
                fileName: subtitle.metadata.fileName,
                language: subtitle.metadata.language,
                content: subtitle.content
            } : null
        };
    } catch (error) {
        console.error('Search failed:', error);
        return null;
    }
}

// Usage
const result = await searchAndGetSubtitles('Inception', 2010, 'en');
console.log(result);
```

### Example 3: Mobile App Integration

```javascript
// In your mobile app's movie detail view
async function loadMovieDetail(imdbId) {
    // Show loading skeleton
    showLoadingSkeleton();

    try {
        // Load metadata in parallel
        const [tmdbData, omdbData] = await Promise.all([
            TMDBClient.findByExternalId(imdbId, 'imdb_id')
                .then(r => TMDBClient.getMovieDetails(r.movie_results[0].id)),
            OMDbClient.getByIMDbId(imdbId)
        ]);

        // Update UI with metadata
        updateMovieUI({
            title: tmdbData.title,
            poster: TMDBClient.getBestPoster(tmdbData),
            backdrop: TMDBClient.getBestBackdrop(tmdbData),
            overview: tmdbData.overview,
            ratings: {
                tmdb: TMDBClient.getRating(tmdbData),
                imdb: OMDbClient.getIMDbRating(omdbData),
                rottenTomatoes: OMDbClient.getRottenTomatoesScore(omdbData)
            }
        });

        // Load subtitles in background
        OpenSubtitlesClient.searchByIMDb(imdbId, 'en')
            .then(results => {
                const byLanguage = OpenSubtitlesClient.groupByLanguage(results);
                updateSubtitleUI(byLanguage);
            });

    } catch (error) {
        console.error('Failed to load movie:', error);
        showError('Failed to load movie information');
    }
}
```

---

## Best Practices

### 1. Error Handling

```javascript
try {
    const movie = await TMDBClient.getMovieDetails(12345);
} catch (error) {
    if (error.message.includes('404')) {
        console.log('Movie not found');
    } else if (error.message.includes('rate limit')) {
        console.log('Rate limit exceeded, using cache');
    } else {
        console.error('Unexpected error:', error);
    }
}
```

### 2. Caching

All clients implement automatic caching:
- **TMDB:** 1 hour in-memory cache
- **OMDb:** 24 hour in-memory cache
- **OpenSubtitles:** 1 hour in-memory cache

```javascript
// Force cache clear if needed
TMDBClient.clearCache();
OMDbClient.clearCache();
OpenSubtitlesClient.clearCache();
```

### 3. Rate Limit Management

```javascript
// Check remaining requests (OMDb)
const remaining = OMDbClient.getRemainingRequests();
console.log(`${remaining} requests remaining today`);

// Check remaining downloads (OpenSubtitles)
const downloads = OpenSubtitlesClient.getRemainingDownloads();
console.log(`${downloads} subtitle downloads remaining today`);
```

### 4. Fallback Strategy

```javascript
async function getMovieInfo(imdbId) {
    try {
        // Try TMDB first
        return await getTMDBInfo(imdbId);
    } catch (tmdbError) {
        console.warn('TMDB failed, trying OMDb:', tmdbError);
        try {
            // Fallback to OMDb
            return await getOMDbInfo(imdbId);
        } catch (omdbError) {
            console.error('All providers failed');
            // Return cached data if available
            return getCachedInfo(imdbId);
        }
    }
}
```

---

## Rate Limits

### TMDB
- **Limit:** 40 requests per 10 seconds
- **Daily:** Unlimited (free tier)
- **Caching:** 1 hour recommended

### OMDb
- **Limit:** 1,000 requests per day (free tier)
- **Paid:** Higher limits available
- **Caching:** 24 hours recommended

### OpenSubtitles
- **Limit:** 200 downloads per day (registered users)
- **Search:** Unlimited
- **Caching:** 1 hour for search results

---

## Troubleshooting

### Missing API Keys

```javascript
import ApiConfig from './src/app/lib/config/api-config.js';

// Check configuration
ApiConfig.validate();

// Check specific keys
const config = ApiConfig.isConfigured();
console.log(config);
// { tmdb: true, omdb: true, opensubtitles: true }

// Get missing keys
const missing = ApiConfig.getMissingKeys();
if (missing.length > 0) {
    console.error('Missing keys:', missing);
}
```

### API Errors

```javascript
// TMDB 404 - Movie not found
// Solution: Verify movie ID or search first

// OMDb "Movie not found!"
// Solution: Check IMDb ID format (should be 'tt1234567')

// OpenSubtitles 401 - Unauthorized
// Solution: Verify API key in .env file

// OpenSubtitles 406 - Too many downloads
// Solution: Wait until tomorrow or upgrade to VIP
```

---

## Next Steps

1. **Integrate with UI:** Connect these clients to movie/TV detail views
2. **Add Persistence:** Store metadata in SQLite for offline access
3. **Implement Search:** Use TMDB search in app's search functionality
4. **Subtitle Player:** Integrate OpenSubtitles with video player
5. **Background Sync:** Pre-fetch metadata for better performance

---

**For more information:**
- [TMDB API Docs](https://developers.themoviedb.org/3)
- [OMDb API Docs](https://www.omdbapi.com/)
- [OpenSubtitles API Docs](https://api.opensubtitles.com/)
