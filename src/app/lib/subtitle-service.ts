/**
 * Subtitle Service
 * Phase 9A.3: Comprehensive subtitle support with OpenSubtitles integration
 */

export interface SubtitleTrack {
    id: string;
    language: string;
    languageCode: string;
    format: 'srt' | 'vtt' | 'ass' | 'ssa';
    url?: string;
    content?: string;
    source: 'embedded' | 'external' | 'downloaded';
    rating?: number;
    downloadCount?: number;
}

export interface SubtitleSearchResult {
    id: string;
    language: string;
    languageCode: string;
    movieTitle: string;
    movieYear?: number;
    format: string;
    downloadUrl: string;
    rating: number;
    downloadCount: number;
    source: 'opensubtitles' | 'subscene' | 'yifysubtitles';
}

export interface SubtitleStyle {
    fontSize: number; // 12-32
    fontColor: string; // hex color
    backgroundColor: string; // hex color with alpha
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    outline: boolean;
    outlineColor: string;
}

export interface SubtitleSyncAdjustment {
    offsetMs: number; // positive = delay, negative = advance
}

export interface ParsedSubtitle {
    cues: SubtitleCue[];
    format: 'srt' | 'vtt' | 'ass' | 'ssa';
    language?: string;
}

export interface SubtitleCue {
    index: number;
    startTime: number; // milliseconds
    endTime: number; // milliseconds
    text: string;
    styles?: {
        color?: string;
        fontSize?: number;
        position?: string;
    };
}

export class SubtitleService {
    private openSubtitlesApiKey: string | null = null;
    private currentSubtitles: ParsedSubtitle | null = null;
    private syncOffset: number = 0; // milliseconds
    private defaultStyle: SubtitleStyle = {
        fontSize: 18,
        fontColor: '#FFFFFF',
        backgroundColor: '#00000080',
        position: 'bottom',
        alignment: 'center',
        fontFamily: 'Arial, sans-serif',
        bold: false,
        italic: false,
        outline: true,
        outlineColor: '#000000'
    };

    constructor() {
        // Load API key from environment or settings
        this.openSubtitlesApiKey = this.loadApiKey();

        // Load user's preferred subtitle style
        this.loadUserStyle();
    }

    // ===== OPENSUBTITLES API INTEGRATION =====

    /**
     * Search for subtitles on OpenSubtitles.org
     * @param query Movie/show title
     * @param year Release year (optional)
     * @param season TV show season (optional)
     * @param episode TV show episode (optional)
     * @param language Preferred language code (default: 'en')
     */
    async searchSubtitles(
        query: string,
        year?: number,
        season?: number,
        episode?: number,
        language: string = 'en'
    ): Promise<SubtitleSearchResult[]> {
        if (!this.openSubtitlesApiKey) {
            console.warn('OpenSubtitles API key not configured');
            return [];
        }

        try {
            const params = new URLSearchParams({
                query,
                languages: language,
                ...(year && { year: year.toString() }),
                ...(season && { season_number: season.toString() }),
                ...(episode && { episode_number: episode.toString() })
            });

            const response = await fetch(
                `https://api.opensubtitles.com/api/v1/subtitles?${params}`,
                {
                    headers: {
                        'Api-Key': this.openSubtitlesApiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'FlixCapacitor v1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`OpenSubtitles API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseOpenSubtitlesResponse(data);
        } catch (error) {
            console.error('Subtitle search failed:', error);
            return [];
        }
    }

    /**
     * Parse OpenSubtitles API response
     */
    private parseOpenSubtitlesResponse(data: any): SubtitleSearchResult[] {
        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }

        return data.data.map((item: any) => ({
            id: item.attributes.files[0]?.file_id || item.id,
            language: item.attributes.language,
            languageCode: item.attributes.language,
            movieTitle: item.attributes.feature_details?.movie_name || item.attributes.title,
            movieYear: item.attributes.feature_details?.year,
            format: item.attributes.files[0]?.file_name?.split('.').pop()?.toLowerCase() || 'srt',
            downloadUrl: item.attributes.files[0]?.file_id || '',
            rating: item.attributes.ratings || 0,
            downloadCount: item.attributes.download_count || 0,
            source: 'opensubtitles'
        }));
    }

    /**
     * Download subtitle from OpenSubtitles
     */
    async downloadSubtitle(fileId: string): Promise<string> {
        if (!this.openSubtitlesApiKey) {
            throw new Error('OpenSubtitles API key not configured');
        }

        try {
            // Request download link
            const response = await fetch(
                `https://api.opensubtitles.com/api/v1/download`,
                {
                    method: 'POST',
                    headers: {
                        'Api-Key': this.openSubtitlesApiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'FlixCapacitor v1.0'
                    },
                    body: JSON.stringify({ file_id: fileId })
                }
            );

            if (!response.ok) {
                throw new Error(`Download request failed: ${response.status}`);
            }

            const data = await response.json();
            const downloadUrl = data.link;

            // Download subtitle content
            const subtitleResponse = await fetch(downloadUrl);
            return await subtitleResponse.text();
        } catch (error) {
            console.error('Subtitle download failed:', error);
            throw error;
        }
    }

    // ===== SUBTITLE PARSING =====

    /**
     * Parse subtitle file content
     */
    parseSubtitle(content: string, format: 'srt' | 'vtt' | 'ass' | 'ssa'): ParsedSubtitle {
        switch (format) {
            case 'srt':
                return this.parseSRT(content);
            case 'vtt':
                return this.parseVTT(content);
            case 'ass':
            case 'ssa':
                return this.parseASS(content);
            default:
                throw new Error(`Unsupported subtitle format: ${format}`);
        }
    }

    /**
     * Parse SRT format
     */
    private parseSRT(content: string): ParsedSubtitle {
        const cues: SubtitleCue[] = [];
        const blocks = content.trim().split(/\n\s*\n/);

        for (const block of blocks) {
            const lines = block.split('\n');
            if (lines.length < 3) continue;

            const index = parseInt(lines[0]);
            const timeLine = lines[1];
            const text = lines.slice(2).join('\n');

            const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
            if (!timeMatch) continue;

            const startTime = this.parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
            const endTime = this.parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

            cues.push({ index, startTime, endTime, text });
        }

        return { cues, format: 'srt' };
    }

    /**
     * Parse VTT format
     */
    private parseVTT(content: string): ParsedSubtitle {
        const cues: SubtitleCue[] = [];
        const lines = content.split('\n');
        let index = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip WEBVTT header and empty lines
            if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
                continue;
            }

            // Check for timestamp line
            const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
            if (timeMatch) {
                const startTime = this.parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
                const endTime = this.parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

                // Collect text until next empty line
                const textLines: string[] = [];
                i++;
                while (i < lines.length && lines[i].trim()) {
                    textLines.push(lines[i]);
                    i++;
                }

                cues.push({
                    index: index++,
                    startTime,
                    endTime,
                    text: textLines.join('\n')
                });
            }
        }

        return { cues, format: 'vtt' };
    }

    /**
     * Parse ASS/SSA format (simplified)
     */
    private parseASS(content: string): ParsedSubtitle {
        const cues: SubtitleCue[] = [];
        const lines = content.split('\n');
        let index = 0;

        for (const line of lines) {
            if (line.startsWith('Dialogue:')) {
                // ASS format: Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
                const parts = line.substring(9).split(',');
                if (parts.length < 10) continue;

                const startTime = this.parseASSTime(parts[1]);
                const endTime = this.parseASSTime(parts[2]);
                const text = parts.slice(9).join(',').replace(/\\N/g, '\n');

                cues.push({ index: index++, startTime, endTime, text });
            }
        }

        return { cues, format: 'ass' };
    }

    /**
     * Parse time to milliseconds
     */
    private parseTime(hours: string, minutes: string, seconds: string, milliseconds: string): number {
        return (
            parseInt(hours) * 3600000 +
            parseInt(minutes) * 60000 +
            parseInt(seconds) * 1000 +
            parseInt(milliseconds)
        );
    }

    /**
     * Parse ASS time format (0:00:00.00)
     */
    private parseASSTime(timeStr: string): number {
        const match = timeStr.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
        if (!match) return 0;

        return (
            parseInt(match[1]) * 3600000 +
            parseInt(match[2]) * 60000 +
            parseInt(match[3]) * 1000 +
            parseInt(match[4]) * 10
        );
    }

    // ===== FORMAT CONVERSION =====

    /**
     * Convert subtitle to different format
     */
    convertFormat(subtitle: ParsedSubtitle, targetFormat: 'srt' | 'vtt'): string {
        switch (targetFormat) {
            case 'srt':
                return this.convertToSRT(subtitle);
            case 'vtt':
                return this.convertToVTT(subtitle);
            default:
                throw new Error(`Unsupported target format: ${targetFormat}`);
        }
    }

    /**
     * Convert to SRT format
     */
    private convertToSRT(subtitle: ParsedSubtitle): string {
        let srt = '';

        for (const cue of subtitle.cues) {
            const start = this.formatSRTTime(cue.startTime);
            const end = this.formatSRTTime(cue.endTime);

            srt += `${cue.index + 1}\n`;
            srt += `${start} --> ${end}\n`;
            srt += `${cue.text}\n\n`;
        }

        return srt;
    }

    /**
     * Convert to VTT format
     */
    private convertToVTT(subtitle: ParsedSubtitle): string {
        let vtt = 'WEBVTT\n\n';

        for (const cue of subtitle.cues) {
            const start = this.formatVTTTime(cue.startTime);
            const end = this.formatVTTTime(cue.endTime);

            vtt += `${start} --> ${end}\n`;
            vtt += `${cue.text}\n\n`;
        }

        return vtt;
    }

    /**
     * Format time for SRT (00:00:00,000)
     */
    private formatSRTTime(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    /**
     * Format time for VTT (00:00:00.000)
     */
    private formatVTTTime(ms: number): string {
        return this.formatSRTTime(ms).replace(',', '.');
    }

    // ===== SUBTITLE SYNC ADJUSTMENT =====

    /**
     * Adjust subtitle timing (positive = delay, negative = advance)
     */
    adjustSync(offsetMs: number): void {
        this.syncOffset = offsetMs;
        console.log(`Subtitle sync adjusted: ${offsetMs}ms`);
    }

    /**
     * Get current subtitle at time (with sync offset applied)
     */
    getCurrentSubtitle(currentTimeMs: number): SubtitleCue | null {
        if (!this.currentSubtitles) return null;

        const adjustedTime = currentTimeMs - this.syncOffset;

        return this.currentSubtitles.cues.find(
            cue => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
        ) || null;
    }

    /**
     * Apply sync offset to parsed subtitle
     */
    applySyncOffset(subtitle: ParsedSubtitle, offsetMs: number): ParsedSubtitle {
        return {
            ...subtitle,
            cues: subtitle.cues.map(cue => ({
                ...cue,
                startTime: cue.startTime + offsetMs,
                endTime: cue.endTime + offsetMs
            }))
        };
    }

    // ===== SUBTITLE STYLING =====

    /**
     * Update subtitle style
     */
    setStyle(style: Partial<SubtitleStyle>): void {
        this.defaultStyle = { ...this.defaultStyle, ...style };
        this.saveUserStyle();
        console.log('Subtitle style updated:', this.defaultStyle);
    }

    /**
     * Get current style
     */
    getStyle(): SubtitleStyle {
        return { ...this.defaultStyle };
    }

    /**
     * Generate CSS for subtitle styling
     */
    getSubtitleCSS(): string {
        const style = this.defaultStyle;

        return `
            .subtitle-text {
                font-size: ${style.fontSize}px;
                color: ${style.fontColor};
                background-color: ${style.backgroundColor};
                font-family: ${style.fontFamily};
                font-weight: ${style.bold ? 'bold' : 'normal'};
                font-style: ${style.italic ? 'italic' : 'normal'};
                text-align: ${style.alignment};
                padding: 8px 16px;
                border-radius: 4px;
                ${style.outline ? `text-shadow: -1px -1px 0 ${style.outlineColor}, 1px -1px 0 ${style.outlineColor}, -1px 1px 0 ${style.outlineColor}, 1px 1px 0 ${style.outlineColor};` : ''}
                position: absolute;
                ${style.position === 'top' ? 'top: 10%;' : ''}
                ${style.position === 'center' ? 'top: 50%; transform: translateY(-50%);' : ''}
                ${style.position === 'bottom' ? 'bottom: 10%;' : ''}
                left: 50%;
                transform: translateX(-50%) ${style.position === 'center' ? 'translateY(-50%)' : ''};
                max-width: 90%;
                z-index: 1000;
            }
        `;
    }

    // ===== UTILITY METHODS =====

    /**
     * Detect subtitle format from content
     */
    detectFormat(content: string): 'srt' | 'vtt' | 'ass' | 'ssa' | null {
        if (content.includes('WEBVTT')) return 'vtt';
        if (content.includes('[Script Info]')) return 'ass';
        if (content.match(/^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}/m)) return 'srt';
        return null;
    }

    /**
     * Auto-detect subtitle language
     */
    detectLanguage(content: string): string | null {
        // Simple heuristic - check for common words in different languages
        const patterns: Record<string, RegExp[]> = {
            'en': [/\bthe\b/i, /\band\b/i, /\bwith\b/i, /\byou\b/i],
            'es': [/\bel\b/i, /\bla\b/i, /\bde\b/i, /\bque\b/i],
            'fr': [/\ble\b/i, /\bla\b/i, /\bde\b/i, /\bet\b/i],
            'de': [/\bder\b/i, /\bdie\b/i, /\bdas\b/i, /\bund\b/i]
        };

        for (const [lang, regexes] of Object.entries(patterns)) {
            const matches = regexes.filter(regex => regex.test(content)).length;
            if (matches >= 2) return lang;
        }

        return null;
    }

    /**
     * Load API key from settings
     */
    private loadApiKey(): string | null {
        // TODO: Load from SettingsManager or environment
        return null;
    }

    /**
     * Load user's subtitle style preferences
     */
    private loadUserStyle(): void {
        // TODO: Load from localStorage or preferences
        const saved = localStorage.getItem('subtitle_style');
        if (saved) {
            try {
                this.defaultStyle = { ...this.defaultStyle, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load subtitle style:', e);
            }
        }
    }

    /**
     * Save user's subtitle style preferences
     */
    private saveUserStyle(): void {
        try {
            localStorage.setItem('subtitle_style', JSON.stringify(this.defaultStyle));
        } catch (e) {
            console.warn('Failed to save subtitle style:', e);
        }
    }

    /**
     * Set current subtitles
     */
    setCurrentSubtitles(subtitles: ParsedSubtitle): void {
        this.currentSubtitles = subtitles;
    }

    /**
     * Clear current subtitles
     */
    clearSubtitles(): void {
        this.currentSubtitles = null;
        this.syncOffset = 0;
    }
}

// Export singleton
export const subtitleService = new SubtitleService();
