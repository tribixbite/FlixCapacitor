/**
 * TMDB Service
 * Complete service layer for The Movie Database API
 * Handles all movie and TV show metadata operations
 */

import { apiConfig, imageSizes, type ImageType, type ImageSize } from '$lib/config/api';
import type {
  TMDBResponse,
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBSeasonDetails,
  TMDBEpisode,
  TMDBCredits,
  TMDBGenre,
  TMDBError
} from '$lib/types/api.types';
import type {
  Movie,
  TVShow,
  Season,
  Episode,
  Cast,
  Genre
} from '$lib/types/media.types';

/**
 * TMDB Service Class
 * Singleton service for all TMDB API operations
 */
class TMDBService {
  private baseUrl = apiConfig.tmdb.baseUrl;
  private apiKey = apiConfig.tmdb.apiKey;
  private imageBase = apiConfig.tmdb.imageBaseUrl;
  private language = apiConfig.tmdb.language;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 3600000; // 1 hour

  /**
   * Generic fetch method for TMDB API
   */
  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', this.language);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    // Check cache
    const cacheKey = url.toString();
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as T;
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as TMDBError;
      throw new Error(error.status_message || `TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);

    return data as T;
  }

  /**
   * Image URL Helpers
   */
  getImageUrl(path: string | null, type: ImageType = 'poster', size: ImageSize = 'medium'): string {
    if (!path) return `/placeholder-${type}.jpg`;
    const sizeValue = imageSizes[type][size];
    return `${this.imageBase}/${sizeValue}${path}`;
  }

  getPosterUrl(path: string | null, size: ImageSize = 'medium'): string {
    return this.getImageUrl(path, 'poster', size);
  }

  getBackdropUrl(path: string | null, size: ImageSize = 'medium'): string {
    return this.getImageUrl(path, 'backdrop', size);
  }

  getProfileUrl(path: string | null, size: ImageSize = 'medium'): string {
    return this.getImageUrl(path, 'profile', size);
  }

  getStillUrl(path: string | null, size: ImageSize = 'medium'): string {
    return this.getImageUrl(path, 'still', size);
  }

  /**
   * Transform TMDB response types to app types
   */
  private transformMovie(movie: TMDBMovie): Movie {
    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
      runtime: null,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      genres: [],
      genreIds: movie.genre_ids,
      popularity: movie.popularity,
      originalLanguage: movie.original_language,
      adult: movie.adult,
      video: movie.video
    };
  }

  private transformMovieDetails(movie: TMDBMovieDetails): Movie {
    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
      runtime: movie.runtime,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      genres: movie.genres.map(g => ({ id: g.id, name: g.name })),
      genreIds: movie.genres.map(g => g.id),
      popularity: movie.popularity,
      originalLanguage: movie.original_language,
      adult: movie.adult,
      video: movie.video,
      imdbId: movie.imdb_id,
      status: movie.status,
      tagline: movie.tagline,
      budget: movie.budget,
      revenue: movie.revenue,
      productionCompanies: movie.production_companies.map(c => ({
        id: c.id,
        name: c.name,
        logoPath: c.logo_path,
        originCountry: c.origin_country
      }))
    };
  }

  private transformTVShow(show: TMDBTVShow): TVShow {
    return {
      id: show.id,
      name: show.name,
      originalName: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      firstAirDate: show.first_air_date,
      lastAirDate: null,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      genres: [],
      genreIds: show.genre_ids,
      numberOfSeasons: 0,
      numberOfEpisodes: 0,
      status: 'Returning Series',
      episodeRunTime: [],
      originalLanguage: show.original_language,
      popularity: show.popularity
    };
  }

  private transformTVShowDetails(show: TMDBTVShowDetails): TVShow {
    return {
      id: show.id,
      name: show.name,
      originalName: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      firstAirDate: show.first_air_date,
      lastAirDate: show.last_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      genres: show.genres.map(g => ({ id: g.id, name: g.name })),
      genreIds: show.genres.map(g => g.id),
      numberOfSeasons: show.number_of_seasons,
      numberOfEpisodes: show.number_of_episodes,
      status: show.status as any,
      episodeRunTime: show.episode_run_time,
      originalLanguage: show.original_language,
      popularity: show.popularity,
      type: show.type,
      networks: show.networks.map(n => ({
        id: n.id,
        name: n.name,
        logoPath: n.logo_path,
        originCountry: n.origin_country
      })),
      seasons: show.seasons?.map(s => ({
        id: s.id,
        showId: show.id,
        seasonNumber: s.season_number,
        name: s.name,
        overview: s.overview,
        posterPath: s.poster_path,
        airDate: s.air_date,
        episodeCount: s.episode_count
      }))
    };
  }

  /**
   * Movies API
   */
  async getPopularMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/movie/popular', { page: String(page) });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages,
      totalResults: data.total_results
    };
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`, { page: String(page) });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages
    };
  }

  async getTopRatedMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/movie/top_rated', { page: String(page) });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages
    };
  }

  async getNowPlayingMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/movie/now_playing', { page: String(page) });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages
    };
  }

  async getUpcomingMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/movie/upcoming', { page: String(page) });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages
    };
  }

  async getMovieDetails(id: number): Promise<Movie> {
    const data = await this.fetch<TMDBMovieDetails>(`/movie/${id}`, {
      append_to_response: 'credits,videos,images,recommendations,external_ids'
    });
    return this.transformMovieDetails(data);
  }

  async getMovieCredits(id: number): Promise<{ cast: Cast[]; crew: any[] }> {
    const data = await this.fetch<TMDBCredits>(`/movie/${id}/credits`);
    return {
      cast: data.cast.slice(0, 20).map(c => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
        order: c.order,
        gender: c.gender ?? undefined,
        knownForDepartment: c.known_for_department
      })),
      crew: data.crew
    };
  }

  async searchMovies(query: string, page = 1): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/search/movie', {
      query,
      page: String(page),
      include_adult: 'false'
    });
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages,
      totalResults: data.total_results
    };
  }

  /**
   * TV Shows API
   */
  async getPopularShows(page = 1): Promise<{ shows: TVShow[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBTVShow>>('/tv/popular', { page: String(page) });
    return {
      shows: data.results.map(s => this.transformTVShow(s)),
      totalPages: data.total_pages
    };
  }

  async getTrendingShows(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ shows: TVShow[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBTVShow>>(`/trending/tv/${timeWindow}`, { page: String(page) });
    return {
      shows: data.results.map(s => this.transformTVShow(s)),
      totalPages: data.total_pages
    };
  }

  async getTopRatedShows(page = 1): Promise<{ shows: TVShow[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBTVShow>>('/tv/top_rated', { page: String(page) });
    return {
      shows: data.results.map(s => this.transformTVShow(s)),
      totalPages: data.total_pages
    };
  }

  async searchShows(query: string, page = 1): Promise<{ shows: TVShow[]; totalPages: number }> {
    const data = await this.fetch<TMDBResponse<TMDBTVShow>>('/search/tv', {
      query,
      page: String(page)
    });
    return {
      shows: data.results.map(s => this.transformTVShow(s)),
      totalPages: data.total_pages
    };
  }

  async getShowDetails(id: number): Promise<TVShow> {
    const data = await this.fetch<TMDBTVShowDetails>(`/tv/${id}`, {
      append_to_response: 'credits,videos,images,external_ids'
    });
    return this.transformTVShowDetails(data);
  }

  async getShowSeason(showId: number, seasonNumber: number): Promise<Season> {
    const data = await this.fetch<TMDBSeasonDetails>(`/tv/${showId}/season/${seasonNumber}`);
    return {
      id: data.id,
      showId,
      seasonNumber: data.season_number,
      name: data.name,
      overview: data.overview,
      posterPath: data.poster_path,
      airDate: data.air_date,
      episodeCount: data.episodes?.length || 0,
      episodes: data.episodes?.map((ep: TMDBEpisode) => ({
        id: ep.id,
        showId,
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        stillPath: ep.still_path,
        airDate: ep.air_date,
        runtime: ep.runtime,
        voteAverage: ep.vote_average,
        voteCount: ep.vote_count
      }))
    };
  }

  /**
   * Genres
   */
  async getMovieGenres(): Promise<Genre[]> {
    const data = await this.fetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
    return data.genres.map(g => ({ id: g.id, name: g.name }));
  }

  async getTVGenres(): Promise<Genre[]> {
    const data = await this.fetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
    return data.genres.map(g => ({ id: g.id, name: g.name }));
  }

  /**
   * Discover
   */
  async discoverMovies(options: {
    page?: number;
    sortBy?: string;
    genres?: number[];
    year?: number;
    minRating?: number;
  } = {}): Promise<{ movies: Movie[]; totalPages: number }> {
    const params: Record<string, string> = {
      page: String(options.page || 1),
      sort_by: options.sortBy || 'popularity.desc'
    };

    if (options.genres?.length) {
      params.with_genres = options.genres.join(',');
    }
    if (options.year) {
      params.primary_release_year = String(options.year);
    }
    if (options.minRating) {
      params['vote_average.gte'] = String(options.minRating);
    }

    const data = await this.fetch<TMDBResponse<TMDBMovie>>('/discover/movie', params);
    return {
      movies: data.results.map(m => this.transformMovie(m)),
      totalPages: data.total_pages
    };
  }

  async discoverShows(options: {
    page?: number;
    sortBy?: string;
    genres?: number[];
    year?: number;
    minRating?: number;
  } = {}): Promise<{ shows: TVShow[]; totalPages: number }> {
    const params: Record<string, string> = {
      page: String(options.page || 1),
      sort_by: options.sortBy || 'popularity.desc'
    };

    if (options.genres?.length) {
      params.with_genres = options.genres.join(',');
    }
    if (options.year) {
      params.first_air_date_year = String(options.year);
    }
    if (options.minRating) {
      params['vote_average.gte'] = String(options.minRating);
    }

    const data = await this.fetch<TMDBResponse<TMDBTVShow>>('/discover/tv', params);
    return {
      shows: data.results.map(s => this.transformTVShow(s)),
      totalPages: data.total_pages
    };
  }

  /**
   * Multi Search
   */
  async multiSearch(query: string, page = 1): Promise<{
    movies: Movie[];
    shows: TVShow[];
    totalResults: number;
  }> {
    const data = await this.fetch<TMDBResponse<TMDBMovie | TMDBTVShow>>('/search/multi', {
      query,
      page: String(page)
    });

    const movies: Movie[] = [];
    const shows: TVShow[] = [];

    for (const item of data.results) {
      if ('title' in item) {
        movies.push(this.transformMovie(item as TMDBMovie));
      } else if ('name' in item && !('known_for' in item)) {
        shows.push(this.transformTVShow(item as TMDBTVShow));
      }
    }

    return { movies, shows, totalResults: data.total_results };
  }

  /**
   * External ID Lookup
   */
  async findByIMDbId(imdbId: string): Promise<{ movies: Movie[]; shows: TVShow[] }> {
    const data = await this.fetch<{
      movie_results: TMDBMovie[];
      tv_results: TMDBTVShow[];
    }>(`/find/${imdbId}`, { external_source: 'imdb_id' });

    return {
      movies: data.movie_results?.map(m => this.transformMovie(m)) || [],
      shows: data.tv_results?.map(s => this.transformTVShow(s)) || []
    };
  }

  /**
   * Cache Management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size to 100 entries
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
export default tmdbService;
