/**
 * Process ALL 890 movies with CORRECT API keys from .env
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import bencode from 'bencode';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const TMDB_KEY = process.env.VITE_TMDB_API_KEY;
const OMDB_KEY = process.env.VITE_OMDB_API_KEY;
const MIN_RATING = 7.0;

console.log(`🔑 Using TMDB key: ${TMDB_KEY?.substring(0, 8)}...`);
console.log(`🔑 Using OMDb key: ${OMDB_KEY?.substring(0, 8)}...\n`);

function titleToFilename(title) {
    return title
        .replace(/'/g, '')
        .replace(/ /g, '_')
        .replace(/,/g, '')
        .replace(/:/g, '')
        .replace(/\./g, '')
        .replace(/-/g, '_')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\?/g, '')
        .replace(/!/g, '')
        .replace(/&/g, '');
}

async function downloadTorrent(title) {
    const filename = titleToFilename(title);
    const url = `http://www.publicdomaintorrents.com/bt/btdownload.php?type=torrent&file=${filename}.avi.torrent`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        return null;
    }
}

function extractInfoHash(torrentBuffer) {
    try {
        const torrent = bencode.decode(torrentBuffer);
        const infoBuffer = bencode.encode(torrent.info);
        const hash = createHash('sha1');
        hash.update(infoBuffer);
        const announce = Buffer.from(torrent.announce).toString('utf8');

        return {
            infoHash: hash.digest('hex'),
            size: torrent.info.length || 0,
            name: Buffer.from(torrent.info.name).toString('utf8'),
            tracker: announce
        };
    } catch (error) {
        return null;
    }
}

async function searchTMDB(title) {
    const query = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results?.[0] || null;
    } catch (error) {
        return null;
    }
}

async function getOMDbRating(imdbId) {
    const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.Response === 'True' && data.imdbRating && data.imdbRating !== 'N/A') {
            return parseFloat(data.imdbRating);
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function processMovie(title, index, total) {
    console.log(`[${index + 1}/${total}] ${title}`);

    // Get TMDB data
    await new Promise(resolve => setTimeout(resolve, 300));
    const tmdbData = await searchTMDB(title);

    if (!tmdbData) {
        console.log(`   ❌ No TMDB match\n`);
        return { title, status: 'no_metadata' };
    }

    const tmdbRating = tmdbData.vote_average || 0;
    console.log(`   📊 TMDB: ${tmdbRating.toFixed(1)}/10 (${tmdbData.vote_count} votes)`);

    // Try to get OMDb/IMDb rating for more accurate filtering
    let finalRating = tmdbRating;
    const tmdbId = tmdbData.id;

    // For high-potential movies, check OMDb too
    if (tmdbRating >= 6.5) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const imdbRating = await getOMDbRating(`tt${tmdbId}`);
        if (imdbRating) {
            finalRating = imdbRating;
            console.log(`   ⭐ IMDb: ${imdbRating.toFixed(1)}/10`);
        }
    }

    if (finalRating < MIN_RATING) {
        console.log(`   ⏭️  Below 7.0 threshold\n`);
        return { title, status: 'rating_too_low', rating: finalRating, tmdbId };
    }

    console.log(`   ✨ HIGH RATED! Downloading torrent...`);

    // Download torrent
    const torrentBuffer = await downloadTorrent(title);
    if (!torrentBuffer) {
        console.log(`   ❌ Torrent not found\n`);
        return { title, status: 'no_torrent', rating: finalRating, tmdbId };
    }

    const torrentInfo = extractInfoHash(torrentBuffer);
    if (!torrentInfo) {
        console.log(`   ❌ Parse failed\n`);
        return { title, status: 'parse_failed', rating: finalRating, tmdbId };
    }

    const result = {
        title,
        infoHash: torrentInfo.infoHash,
        fileSize: torrentInfo.size,
        fileName: torrentInfo.name,
        tracker: torrentInfo.tracker,
        status: 'success',
        metadata: {
            tmdbId: tmdbData.id,
            year: tmdbData.release_date ? parseInt(tmdbData.release_date.split('-')[0]) : null,
            rating: finalRating,
            votes: tmdbData.vote_count || 0,
            plot: tmdbData.overview || '',
            poster: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
            backdrop: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : '',
            genres: tmdbData.genre_ids || []
        }
    };

    console.log(`   ✅ ${result.metadata.year} | ${Math.round(torrentInfo.size / 1024 / 1024)} MB | ${torrentInfo.tracker}\n`);

    return result;
}

async function main() {
    console.log('🎬 Processing ALL 890 Movies - Rating ≥7.0\n');

    const movies = readFileSync('full-movie-list.txt', 'utf8').trim().split('\n');
    console.log(`📚 Total: ${movies.length} movies\n`);

    let results = [];
    let startIndex = 0;

    if (existsSync('all-movies-final-progress.json')) {
        const progress = JSON.parse(readFileSync('all-movies-final-progress.json', 'utf8'));
        results = progress.results || [];
        startIndex = progress.lastIndex + 1 || 0;
        console.log(`📂 Resuming from #${startIndex + 1}\n`);
    }

    let successCount = results.filter(r => r.status === 'success').length;
    let lowRatingCount = results.filter(r => r.status === 'rating_too_low').length;
    let noMetadataCount = results.filter(r => r.status === 'no_metadata').length;

    for (let i = startIndex; i < movies.length; i++) {
        const result = await processMovie(movies[i], i, movies.length);
        results.push(result);

        if (result.status === 'success') successCount++;
        if (result.status === 'rating_too_low') lowRatingCount++;
        if (result.status === 'no_metadata') noMetadataCount++;

        if ((i + 1) % 10 === 0 || i === movies.length - 1) {
            writeFileSync('all-movies-final-progress.json', JSON.stringify({
                lastIndex: i,
                results: results,
                stats: {
                    processed: i + 1,
                    total: movies.length,
                    highRated: successCount,
                    lowRated: lowRatingCount,
                    noMetadata: noMetadataCount
                }
            }, null, 2));

            console.log(`💾 ${i + 1}/${movies.length} | ⭐ ${successCount} high | ⏭️  ${lowRatingCount} low | ❌ ${noMetadataCount} no match\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const highRated = results.filter(r => r.status === 'success');
    writeFileSync('high-rated-complete.json', JSON.stringify(highRated, null, 2));

    console.log(`\n✨ COMPLETE!`);
    console.log(`⭐ High-rated (≥7.0): ${highRated.length}`);
    console.log(`⏭️  Low-rated: ${lowRatingCount}`);
    console.log(`❌ No metadata: ${noMetadataCount}`);
}

main().catch(console.error);
