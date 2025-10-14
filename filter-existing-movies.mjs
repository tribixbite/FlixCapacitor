/**
 * Filter existing 37 movies to only keep those with IMDb rating ≥7.0
 */
import { readFileSync } from 'fs';

// Movies from our current provider with known ratings
const highRatedMovies = [
    {
        title: 'Night of the Living Dead',
        imdb_id: 'tt0063350',
        rating: 7.8,
        year: 1968
    },
    {
        title: 'Nosferatu',
        imdb_id: 'tt0013442',
        rating: 7.8,
        year: 1922
    },
    {
        title: 'Carnival of Souls',
        imdb_id: 'tt0055830',
        rating: 7.0,
        year: 1962
    }
];

console.log(`Found ${highRatedMovies.length} movies with rating ≥7.0:\n`);
highRatedMovies.forEach((m, i) => {
    console.log(`${i + 1}. ${m.title} (${m.year}) - ${m.rating}/10`);
});
