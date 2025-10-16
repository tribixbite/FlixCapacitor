/**
 * Filename Parser Type Definitions
 */

export interface ParsedFilename {
  title: string;
  year?: number;
  season?: number | null;
  episode?: number | null;
  type: 'movie' | 'tvshow' | 'other';
  originalFilename?: string;
}

export interface TVShowResult {
  title: string;
  year?: number;
  season: number | null;
  episode: number | null;
}

export interface MovieResult {
  title: string;
  year?: number;
}

export class FilenameParser {
  moviePatterns: RegExp[];
  tvShowPatterns: RegExp[];
  qualityIndicators: string[];
  groupTagPattern: RegExp;

  parse(filename: string): ParsedFilename;
  parseTVShow(baseName: string): TVShowResult | null;
  parseMovie(baseName: string): MovieResult | null;
  cleanTitle(title: string): string;
  classifyType(filename: string): 'movie' | 'tvshow' | 'other';
  isTVShow(filename: string): boolean;
  hasYear(filename: string): boolean;
}

declare const filenameParser: FilenameParser;
export default filenameParser;
