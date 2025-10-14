/**
 * Generate provider code from high-rated-complete.json
 */
import { readFileSync, writeFileSync } from 'fs';

const movies = JSON.parse(readFileSync('high-rated-complete.json', 'utf8'));

console.log(`Generating code for ${movies.length} movies...\n`);

const genreMap = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

function mapGenres(genreIds) {
    if (!genreIds || genreIds.length === 0) return ['Drama'];
    return genreIds.map(id => genreMap[id] || 'Drama').slice(0, 3);
}

function formatFileSize(bytes) {
    const mb = Math.round(bytes / 1024 / 1024);
    return `${mb} MB`;
}

const movieObjects = movies.map(movie => {
    const genres = mapGenres(movie.metadata.genres);
    const year = movie.metadata.year || 1960;
    const rating = Math.round(movie.metadata.rating * 10);
    const votes = movie.metadata.votes || 100;

    // Generate a proper IMDb ID format (note: these are synthetic for public domain)
    const imdbId = movie.metadata.tmdbId ? `tt${String(movie.metadata.tmdbId).padStart(7, '0')}` : `pd_${movie.title.replace(/[^a-z0-9]/gi, '_')}`;

    return {
        imdb_id: imdbId,
        title: movie.title,
        year: year,
        synopsis: movie.metadata.plot || `A classic public domain film from ${year}.`,
        runtime: 90,
        rating: {
            percentage: rating,
            watching: 0,
            votes: votes,
            loved: 100,
            hated: 100
        },
        images: {
            poster: movie.metadata.poster || `https://placehold.co/300x450/1f1f1f/e50914/white?text=${encodeURIComponent(movie.title)}`,
            fanart: movie.metadata.backdrop || movie.metadata.poster || `https://placehold.co/1920x1080/1f1f1f/e50914/white?text=${encodeURIComponent(movie.title)}`,
            banner: movie.metadata.backdrop || movie.metadata.poster || `https://placehold.co/1920x500/1f1f1f/e50914/white?text=${encodeURIComponent(movie.title)}`
        },
        genres: genres,
        torrents: {
            '720p': {
                url: `magnet:?xt=urn:btih:${movie.infoHash}&dn=${encodeURIComponent(movie.title)}&tr=http%3A%2F%2Ffiles.publicdomaintorrents.com%2Fbt%2Fannounce.php`,
                seed: 99,
                peer: 15,
                size: movie.fileSize,
                filesize: formatFileSize(movie.fileSize),
                provider: 'PublicDomainTorrents'
            }
        }
    };
});

// Generate the JavaScript code
const code = `    getWebMovies() {
        return ${JSON.stringify(movieObjects, null, 8).replace(/"([^"]+)":/g, '$1:')};
    }`;

writeFileSync('provider-code.js', code);

console.log(`✅ Generated provider code for ${movieObjects.length} movies`);
console.log(`📝 Written to: provider-code.js\n`);

// Show sample
console.log('Sample (first movie):');
console.log(JSON.stringify(movieObjects[0], null, 2));
