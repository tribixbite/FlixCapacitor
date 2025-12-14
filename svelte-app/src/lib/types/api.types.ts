/**
 * API Response Type Definitions
 * Types for external API responses (TMDB, OMDb, OpenSubtitles, etc.)
 */

// Generic TMDB response wrapper
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
  dates?: {
    minimum: string;
    maximum: string;
  };
}

// TMDB Movie types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  adult: boolean;
  video: boolean;
  media_type?: 'movie';
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number | null;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  spoken_languages: TMDBSpokenLanguage[];
  status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled';
  tagline: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  homepage: string | null;
  belongs_to_collection: TMDBCollection | null;
}

// TMDB TV Show types
export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  origin_country: string[];
  media_type?: 'tv';
}

export interface TMDBTVShowDetails extends TMDBTVShow {
  created_by: TMDBCreator[];
  episode_run_time: number[];
  genres: TMDBGenre[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: TMDBEpisode | null;
  next_episode_to_air: TMDBEpisode | null;
  networks: TMDBNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  seasons: TMDBSeason[];
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string;
  type: string;
  // External IDs from append_to_response
  external_ids?: {
    imdb_id: string | null;
    freebase_mid: string | null;
    freebase_id: string | null;
    tvdb_id: number | null;
    tvrage_id: number | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
}

export interface TMDBSeason {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

export interface TMDBSeasonDetails extends TMDBSeason {
  episodes: TMDBEpisode[];
  _id: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  crew: TMDBCrew[];
  guest_stars: TMDBCast[];
}

// TMDB Credits
export interface TMDBCredits {
  id: number;
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

export interface TMDBCast {
  id: number;
  name: string;
  original_name: string;
  character: string;
  credit_id: string;
  gender: number | null;
  known_for_department: string;
  order: number;
  popularity: number;
  profile_path: string | null;
  adult: boolean;
  cast_id?: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  original_name: string;
  credit_id: string;
  department: string;
  gender: number | null;
  job: string;
  known_for_department: string;
  popularity: number;
  profile_path: string | null;
  adult: boolean;
}

// TMDB Common types
export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBNetwork {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBCreator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

export interface TMDBCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

// TMDB Images
export interface TMDBImages {
  id: number;
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

// TMDB Videos
export interface TMDBVideos {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes' | 'Bloopers';
  official: boolean;
  published_at: string;
}

// TMDB Search
export interface TMDBSearchResult {
  page: number;
  results: Array<TMDBMovie | TMDBTVShow | TMDBPerson>;
  total_pages: number;
  total_results: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  known_for_department: string;
  known_for: Array<TMDBMovie | TMDBTVShow>;
  popularity: number;
  profile_path: string | null;
  adult: boolean;
  gender: number | null;
  media_type?: 'person';
}

// TMDB Configuration
export interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
  change_keys: string[];
}

// OMDb API types
export interface OMDbMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface OMDbRating {
  Source: string;
  Value: string;
}

// OpenSubtitles API types
export interface OpenSubtitlesSearchResult {
  id: string;
  type: string;
  attributes: {
    subtitle_id: string;
    language: string;
    download_count: number;
    new_download_count: number;
    hearing_impaired: boolean;
    hd: boolean;
    fps: number;
    votes: number;
    ratings: number;
    from_trusted: boolean;
    foreign_parts_only: boolean;
    upload_date: string;
    ai_translated: boolean;
    machine_translated: boolean;
    release: string;
    comments: string;
    legacy_subtitle_id: number;
    uploader: {
      uploader_id: number;
      name: string;
      rank: string;
    };
    feature_details: {
      feature_id: number;
      feature_type: string;
      year: number;
      title: string;
      movie_name: string;
      imdb_id: number;
      tmdb_id: number;
    };
    url: string;
    related_links: {
      label: string;
      url: string;
    }[];
    files: {
      file_id: number;
      cd_number: number;
      file_name: string;
    }[];
  };
}

export interface OpenSubtitlesResponse<T> {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: T[];
}

export interface OpenSubtitlesDownload {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
}

// API Error types
export interface APIError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface TMDBError {
  status_code: number;
  status_message: string;
  success: boolean;
}
