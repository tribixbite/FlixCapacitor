/**
 * TV Shows Provider
 * Provides access to TV show content from various sources
 * Currently using demo data - ready for real API integration
 */

class TVShowsProvider {
    constructor() {
        this.name = 'TV Shows';
        this.type = 'tvshows';
        // TODO: Integrate with real TV show APIs (TMDB TV, TVMaze, etc.)
    }

    /**
     * Get popular TV shows
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} TV shows
     */
    async getPopular(filters = {}) {
        // TODO: Replace with real API calls
        return this.getDemoShows();
    }

    /**
     * Get trending TV shows
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} TV shows
     */
    async getTrending(filters = {}) {
        return this.getDemoShows();
    }

    /**
     * Get top rated TV shows
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} TV shows
     */
    async getTopRated(filters = {}) {
        return this.getDemoShows();
    }

    /**
     * Search TV shows
     * @param {string} query - Search query
     * @returns {Promise<Array>} TV shows
     */
    async search(query) {
        return this.getDemoShows().filter(show =>
            show.title.toLowerCase().includes(query.toLowerCase())
        );
    }

    /**
     * Get demo TV shows for initial implementation
     * TODO: Remove when real API is integrated
     */
    getDemoShows() {
        return [
            {
                tvdb_id: 'tt0944947',
                imdb_id: 'tt0944947',
                title: 'Game of Thrones',
                year: '2011',
                first_aired: '2011-04-17',
                num_seasons: 8,
                rating: { percentage: 92 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BN2IzYzBiOTQtNGZmMi00NDI5LTgxMzMtN2EzZjA1NjhlOGMxXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Game+of+Thrones'
                },
                genres: ['Drama', 'Fantasy', 'Adventure'],
                synopsis: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.'
            },
            {
                tvdb_id: 'tt0903747',
                imdb_id: 'tt0903747',
                title: 'Breaking Bad',
                year: '2008',
                first_aired: '2008-01-20',
                num_seasons: 5,
                rating: { percentage: 96 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Breaking+Bad'
                },
                genres: ['Crime', 'Drama', 'Thriller'],
                synopsis: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student.'
            },
            {
                tvdb_id: 'tt0773262',
                imdb_id: 'tt0773262',
                title: 'Dexter',
                year: '2006',
                first_aired: '2006-10-01',
                num_seasons: 8,
                rating: { percentage: 86 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BZjkzMmU5MjMtODllZS00OTA5LTk2ZTEtNmI0Nzc1YWQ0NGEyXkEyXkFqcGdeQXVyOTA3MTMyOTk@._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Dexter'
                },
                genres: ['Crime', 'Drama', 'Mystery'],
                synopsis: 'By day, mild-mannered Dexter is a blood-spatter analyst for the Miami police. But at night, he is a serial killer who only targets other murderers.'
            },
            {
                tvdb_id: 'tt1475582',
                imdb_id: 'tt1475582',
                title: 'Sherlock',
                year: '2010',
                first_aired: '2010-07-25',
                num_seasons: 4,
                rating: { percentage: 91 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BMWEzNTFlMTQtMzhjOS00MzQ1LWJjNjgtY2RhMjFhYjQwYjIzXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Sherlock'
                },
                genres: ['Crime', 'Drama', 'Mystery'],
                synopsis: 'A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London.'
            },
            {
                tvdb_id: 'tt0460649',
                imdb_id: 'tt0460649',
                title: 'How I Met Your Mother',
                year: '2005',
                first_aired: '2005-09-19',
                num_seasons: 9,
                rating: { percentage: 83 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BNjg1MDQ5MjQ2N15BMl5BanBnXkFtZTYwNjI5NjA3._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=How+I+Met+Your+Mother'
                },
                genres: ['Comedy', 'Romance'],
                synopsis: 'A father recounts to his children - through a series of flashbacks - the journey he and his four best friends took leading up to him meeting their mother.'
            },
            {
                tvdb_id: 'tt2861424',
                imdb_id: 'tt2861424',
                title: 'Rick and Morty',
                year: '2013',
                first_aired: '2013-12-02',
                num_seasons: 7,
                rating: { percentage: 91 },
                images: {
                    poster: 'https://m.media-amazon.com/images/M/MV5BZjRjOTFkOTktZWUzMi00YzMyLThkMmYtMjEwNmQyNzliYTNmXkEyXkFqcGdeQXVyNzQ1ODk3MTQ@._V1_SX300.jpg',
                    fanart: 'https://via.placeholder.com/1280x720/1f1f1f/e50914?text=Rick+and+Morty'
                },
                genres: ['Animation', 'Comedy', 'Sci-Fi'],
                synopsis: 'An animated series that follows the exploits of a super scientist and his not-so-bright grandson.'
            }
        ];
    }
}

// Create singleton instance
const tvShowsProvider = new TVShowsProvider();

// Export as global
window.TVShowsProvider = tvShowsProvider;

export { TVShowsProvider, tvShowsProvider };
export default tvShowsProvider;
