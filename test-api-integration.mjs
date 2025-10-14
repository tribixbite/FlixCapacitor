/**
 * API Integration Test
 * Tests TMDB, OMDb, and OpenSubtitles clients to verify functionality
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

// Import API clients (api-config.js now supports process.env)
const TMDBClient = (await import('./src/app/lib/providers/tmdb-client.js')).default;
const OMDbClient = (await import('./src/app/lib/providers/omdb-client.js')).default;
const OpenSubtitlesClient = (await import('./src/app/lib/providers/opensubtitles-client.js')).default;
const { getEnhancedMovieMetadata } = await import('./src/app/lib/api-bridge.js');

console.log('🧪 API Integration Test Suite\n');

// Test 1: TMDB Search
console.log('📽️  Test 1: TMDB Movie Search');
try {
    const results = await TMDBClient.searchMovie('Inception', 2010);
    if (results.results && results.results.length > 0) {
        console.log('✅ TMDB search working');
        console.log(`   Found: "${results.results[0].title}" (${results.results[0].release_date?.split('-')[0]})`);
        console.log(`   Rating: ${results.results[0].vote_average}/10`);
    } else {
        console.log('❌ TMDB search returned no results');
    }
} catch (error) {
    console.log('❌ TMDB search failed:', error.message);
}

// Test 2: TMDB Movie Details
console.log('\n📋 Test 2: TMDB Movie Details');
try {
    // Inception's TMDB ID is 27205
    const details = await TMDBClient.getMovieDetails(27205);
    if (details && details.title) {
        console.log('✅ TMDB details working');
        console.log(`   Title: "${details.title}"`);
        console.log(`   Runtime: ${TMDBClient.formatRuntime(details.runtime)}`);
        console.log(`   Genres: ${details.genres?.map(g => g.name).join(', ')}`);
    } else {
        console.log('❌ TMDB details returned no data');
    }
} catch (error) {
    console.log('❌ TMDB details failed:', error.message);
}

// Test 3: TMDB Images
console.log('\n🖼️  Test 3: TMDB Image URLs');
try {
    const posterUrl = TMDBClient.getPosterUrl('/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', 'medium');
    const backdropUrl = TMDBClient.getBackdropUrl('/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', 'large');

    if (posterUrl && backdropUrl) {
        console.log('✅ TMDB image URLs working');
        console.log(`   Poster: ${posterUrl}`);
        console.log(`   Backdrop: ${backdropUrl}`);
    } else {
        console.log('❌ TMDB image URLs failed');
    }
} catch (error) {
    console.log('❌ TMDB images failed:', error.message);
}

// Test 4: OMDb by IMDb ID
console.log('\n⭐ Test 4: OMDb Ratings');
try {
    // Inception's IMDb ID
    const movie = await OMDbClient.getByIMDbId('tt1375666');
    if (movie && movie.Title) {
        console.log('✅ OMDb lookup working');
        console.log(`   Title: "${movie.Title}"`);

        const ratings = OMDbClient.getAllRatings(movie);
        console.log(`   IMDb: ${ratings.imdb || 'N/A'}`);
        console.log(`   Rotten Tomatoes: ${ratings.rottenTomatoes || 'N/A'}`);
        console.log(`   Metacritic: ${ratings.metacritic || 'N/A'}`);
    } else {
        console.log('❌ OMDb lookup returned no data');
    }
} catch (error) {
    console.log('❌ OMDb lookup failed:', error.message);
}

// Test 5: OpenSubtitles Search
console.log('\n💬 Test 5: OpenSubtitles Search');
try {
    const results = await OpenSubtitlesClient.searchByIMDb('tt1375666', 'en');
    if (results && results.data && results.data.length > 0) {
        console.log('✅ OpenSubtitles search working');
        console.log(`   Found ${results.data.length} subtitle(s)`);

        const best = OpenSubtitlesClient.getBestSubtitle(results, 'en');
        if (best) {
            console.log(`   Best: ${best.fileName}`);
            console.log(`   Language: ${best.language}`);
            console.log(`   Downloads: ${best.downloadCount}`);
        }
    } else {
        console.log('❌ OpenSubtitles search returned no results');
    }
} catch (error) {
    console.log('❌ OpenSubtitles search failed:', error.message);
    console.log('   Stack:', error.stack);
}

// Test 6: Enhanced Metadata (Combined)
console.log('\n🎬 Test 6: Enhanced Metadata (Bridge Helper)');
try {
    // Mock window.App for bridge function
    global.window = { App: {} };

    const metadata = await getEnhancedMovieMetadata('tt1375666');
    if (metadata && metadata.title) {
        console.log('✅ Enhanced metadata working');
        console.log(`   Title: "${metadata.title}" (${metadata.year})`);
        console.log(`   TMDB Rating: ${metadata.ratings.tmdb}`);
        console.log(`   IMDb Rating: ${metadata.ratings.imdb}`);
        console.log(`   RT Score: ${metadata.ratings.rottenTomatoes || 'N/A'}`);
        console.log(`   Genres: ${metadata.genres?.join(', ')}`);
        console.log(`   Cast: ${metadata.cast?.slice(0, 3).map(c => c.name).join(', ')}...`);
    } else {
        console.log('❌ Enhanced metadata returned no data');
    }
} catch (error) {
    console.log('❌ Enhanced metadata failed:', error.message);
}

console.log('\n✨ Test suite complete!\n');
