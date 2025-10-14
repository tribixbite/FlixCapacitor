import { describe, it, expect } from 'vitest';

// Mock window
globalThis.window = {};

// Import the FilenameParser
const FilenameParserModule = await import('../src/app/lib/filename-parser.js');
const FilenameParser = FilenameParserModule.default || window.FilenameParser;

describe('FilenameParser - Production Tests', () => {
    describe('Core Functionality', () => {
        it('should parse movie with year in parentheses', () => {
            const result = FilenameParser.parse('The Matrix (1999).mkv');
            expect(result.title).toBeTruthy();
            expect(result.title).toContain('Matrix');
        });

        it('should parse TV show S01E05 format', () => {
            const result = FilenameParser.parse('Breaking Bad S01E05.mkv');
            expect(result.type).toBe('tvshow');
            expect(result.season).toBe(1);
            expect(result.episode).toBe(5);
        });

        it('should parse TV show 1x05 format', () => {
            const result = FilenameParser.parse('The Wire 1x05.mkv');
            expect(result.type).toBe('tvshow');
            expect(result.season).toBe(1);
            expect(result.episode).toBe(5);
        });

        it('should handle movies without year', () => {
            const result = FilenameParser.parse('Unknown Movie.mkv');
            expect(result.title).toBeTruthy();
            expect(result.type).toMatch(/movie|other/);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null input', () => {
            const result = FilenameParser.parse(null);
            expect(result).toBeDefined();
            expect(result.title).toBe('Unknown');
            expect(result.type).toBe('other');
        });

        it('should handle undefined input', () => {
            const result = FilenameParser.parse(undefined);
            expect(result).toBeDefined();
            expect(result.title).toBe('Unknown');
            expect(result.type).toBe('other');
        });

        it('should handle empty string', () => {
            const result = FilenameParser.parse('');
            expect(result).toBeDefined();
            expect(result.title).toBe('Unknown');
            expect(result.type).toBe('other');
        });
    });

    describe('Title Cleaning', () => {
        it('should convert dots to spaces', () => {
            const result = FilenameParser.parse('The.Matrix.Reloaded.2003.mkv');
            expect(result.title).toContain('Matrix');
            expect(result.title).not.toContain('.');
        });

        it('should remove quality indicators', () => {
            const result = FilenameParser.parse('Movie 1080p BluRay x264.mkv');
            expect(result.title).toBe('Movie');
        });

        it('should trim whitespace', () => {
            const result = FilenameParser.parse('  Movie Name  .mkv');
            expect(result.title).toBeTruthy();
            expect(result.title).not.toMatch(/^\s|\s$/);
        });
    });

    describe('Type Classification', () => {
        it('should prefer TV show patterns over movie', () => {
            const result = FilenameParser.parse('Movie S01E01 (2020).mkv');
            expect(result.type).toBe('tvshow');
            expect(result.season).toBe(1);
            expect(result.episode).toBe(1);
        });

        it('should classify isTVShow correctly', () => {
            expect(FilenameParser.isTVShow('Show S01E05.mkv')).toBe(true);
            expect(FilenameParser.isTVShow('Movie Name.mkv')).toBe(false);
        });

        it('should detect year with hasYear', () => {
            expect(FilenameParser.hasYear('Movie (2020).mkv')).toBe(true);
            expect(FilenameParser.hasYear('Movie Without Year.mkv')).toBe(false);
        });
    });
});
