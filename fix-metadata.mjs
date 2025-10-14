/**
 * Fix metadata with correct years and IMDB IDs from verification
 */
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const TMDB_KEY = process.env.VITE_TMDB_API_KEY;
const OMDB_KEY = process.env.VITE_OMDB_API_KEY;

const verification = JSON.parse(readFileSync('year-verification.json', 'utf8'));
const movies = JSON.parse(readFileSync('high-rated-complete.json', 'utf8'));

console.log('Fixing metadata with correct years and IMDB IDs...\n');

async function getTMDBByIMDB(imdbId) {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.movie_results && data.movie_results.length > 0) {
            return data.movie_results[0];
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function getOMDbInfo(imdbId) {
    const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True') {
            return data;
        }
        return null;
    } catch (error) {
        return null;
    }
}

const fixed = [];

for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const verified = verification.find(v => v.title === movie.title);

    if (!verified) {
        console.log(`⚠️  No verification data for: ${movie.title}`);
        fixed.push(movie);
        continue;
    }

    if (verified.status === 'correct') {
        console.log(`✅ ${movie.title} - year correct (${verified.actualYear})`);
        fixed.push(movie);
        continue;
    }

    if (verified.status === 'no_page_found' || verified.status === 'no_omdb_data') {
        console.log(`⚠️  ${movie.title} - no data found, keeping original`);
        fixed.push(movie);
        continue;
    }

    console.log(`🔧 Fixing: ${movie.title}`);
    console.log(`   Old: ${movie.metadata.year}`);
    console.log(`   New: ${verified.actualYear}`);
    console.log(`   IMDB: ${verified.imdbId}`);

    await new Promise(resolve => setTimeout(resolve, 300));

    // Get fresh TMDB data using the correct IMDB ID
    const tmdbData = await getTMDBByIMDB(verified.imdbId);

    await new Promise(resolve => setTimeout(resolve, 300));

    // Get OMDb data for additional info
    const omdbData = await getOMDbInfo(verified.imdbId);

    const updatedMovie = {
        ...movie,
        metadata: {
            tmdbId: tmdbData ? tmdbData.id : movie.metadata.tmdbId,
            year: verified.actualYear,
            rating: verified.rating || movie.metadata.rating,
            votes: tmdbData ? tmdbData.vote_count : movie.metadata.votes,
            plot: verified.plot || (tmdbData ? tmdbData.overview : movie.metadata.plot),
            poster: tmdbData && tmdbData.poster_path ?
                `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` :
                movie.metadata.poster,
            backdrop: tmdbData && tmdbData.backdrop_path ?
                `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` :
                movie.metadata.backdrop,
            genres: tmdbData ? tmdbData.genre_ids : movie.metadata.genres
        }
    };

    console.log(`   ✅ Updated\n`);
    fixed.push(updatedMovie);
}

writeFileSync('high-rated-complete-fixed.json', JSON.stringify(fixed, null, 2));

console.log(`\n✅ Fixed metadata saved to high-rated-complete-fixed.json`);
console.log(`Total movies: ${fixed.length}`);
