/**
 * Verify movie years by scraping publicdomaintorrents.info pages
 */
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const OMDB_KEY = process.env.VITE_OMDB_API_KEY;

// Load our current high-rated movies
const movies = JSON.parse(readFileSync('high-rated-complete.json', 'utf8'));

console.log(`Verifying ${movies.length} movies...\n`);

async function scrapeMoviePage(title) {
    const filename = title
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

    // Try to find the movie page - we'll search the catalog
    const catalogUrl = `https://www.publicdomaintorrents.info/nshowcat.html?category=ALL`;

    try {
        const response = await fetch(catalogUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Find link containing the movie title
        let movieLink = null;
        $('a').each((i, el) => {
            const linkText = $(el).text().trim();
            const href = $(el).attr('href');

            if (linkText.toLowerCase().includes(title.toLowerCase().substring(0, 10)) &&
                href && href.includes('nshowmovie.html')) {
                movieLink = href;
                return false; // break
            }
        });

        if (!movieLink) {
            console.log(`   ❌ Could not find page link for: ${title}`);
            return null;
        }

        // Now fetch the movie page
        const fullUrl = movieLink.startsWith('http') ? movieLink : `https://www.publicdomaintorrents.info/${movieLink}`;
        const movieResponse = await fetch(fullUrl);
        const movieHtml = await movieResponse.text();
        const $movie = cheerio.load(movieHtml);

        // Find IMDB link
        const imdbLink = $movie('a[href*="imdb.com"]').attr('href');
        if (!imdbLink) {
            console.log(`   ❌ No IMDB link found for: ${title}`);
            return null;
        }

        // Extract IMDB ID
        const imdbMatch = imdbLink.match(/tt\d+/);
        if (!imdbMatch) {
            console.log(`   ❌ Could not extract IMDB ID for: ${title}`);
            return null;
        }

        const imdbId = imdbMatch[0];
        return imdbId;

    } catch (error) {
        console.log(`   ❌ Error scraping ${title}: ${error.message}`);
        return null;
    }
}

async function getOMDbInfo(imdbId) {
    const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True') {
            return {
                year: parseInt(data.Year),
                title: data.Title,
                rating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
                plot: data.Plot !== 'N/A' ? data.Plot : null
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

const results = [];

for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    console.log(`[${i + 1}/${movies.length}] ${movie.title}`);
    console.log(`   Current: ${movie.metadata.year}`);

    await new Promise(resolve => setTimeout(resolve, 500));

    const imdbId = await scrapeMoviePage(movie.title);

    if (!imdbId) {
        results.push({
            title: movie.title,
            currentYear: movie.metadata.year,
            actualYear: null,
            imdbId: null,
            status: 'no_page_found'
        });
        continue;
    }

    console.log(`   IMDB: ${imdbId}`);

    await new Promise(resolve => setTimeout(resolve, 300));

    const omdbInfo = await getOMDbInfo(imdbId);

    if (!omdbInfo) {
        results.push({
            title: movie.title,
            currentYear: movie.metadata.year,
            actualYear: null,
            imdbId: imdbId,
            status: 'no_omdb_data'
        });
        console.log(`   ❌ No OMDb data\n`);
        continue;
    }

    const yearMatch = movie.metadata.year === omdbInfo.year;
    const status = yearMatch ? '✅' : '⚠️  WRONG';

    console.log(`   Actual: ${omdbInfo.year} - ${status}`);

    if (!yearMatch) {
        console.log(`   Title from OMDb: "${omdbInfo.title}"`);
    }

    results.push({
        title: movie.title,
        currentYear: movie.metadata.year,
        actualYear: omdbInfo.year,
        actualTitle: omdbInfo.title,
        imdbId: imdbId,
        rating: omdbInfo.rating,
        plot: omdbInfo.plot,
        status: yearMatch ? 'correct' : 'wrong_year'
    });

    console.log('');
}

writeFileSync('year-verification.json', JSON.stringify(results, null, 2));

const wrongYears = results.filter(r => r.status === 'wrong_year');
console.log(`\n📊 SUMMARY:`);
console.log(`Correct: ${results.filter(r => r.status === 'correct').length}`);
console.log(`Wrong Year: ${wrongYears.length}`);
console.log(`No Data: ${results.filter(r => r.status === 'no_page_found' || r.status === 'no_omdb_data').length}`);

if (wrongYears.length > 0) {
    console.log(`\n⚠️  WRONG YEARS:`);
    wrongYears.forEach(m => {
        console.log(`   ${m.title}: ${m.currentYear} → ${m.actualYear}`);
    });
}
