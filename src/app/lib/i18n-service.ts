/**
 * Internationalization (i18n) Service
 * Phase 9D.3: Multi-language support, RTL, pluralization, string interpolation
 * Supports seamless language switching throughout the app
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Supported languages
 */
export enum Language {
    ENGLISH = 'en',
    SPANISH = 'es',
    FRENCH = 'fr',
    GERMAN = 'de',
    ITALIAN = 'it',
    PORTUGUESE = 'pt',
    RUSSIAN = 'ru',
    JAPANESE = 'ja',
    KOREAN = 'ko',
    CHINESE_SIMPLIFIED = 'zh-CN',
    CHINESE_TRADITIONAL = 'zh-TW',
    ARABIC = 'ar',
    HEBREW = 'he',
    HINDI = 'hi'
}

/**
 * Text direction
 */
export enum TextDirection {
    LTR = 'ltr',
    RTL = 'rtl'
}

/**
 * Plural forms
 */
export enum PluralForm {
    ZERO = 'zero',
    ONE = 'one',
    TWO = 'two',
    FEW = 'few',
    MANY = 'many',
    OTHER = 'other'
}

/**
 * Translation object with plural forms
 */
export interface Translation {
    [key: string]: string | Translation | PluralTranslation;
}

/**
 * Plural translation
 */
export interface PluralTranslation {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
}

/**
 * Language metadata
 */
export interface LanguageMetadata {
    code: Language;
    name: string;
    nativeName: string;
    direction: TextDirection;
    pluralRules: (count: number) => PluralForm;
}

/**
 * Interpolation parameters
 */
export interface InterpolationParams {
    [key: string]: string | number;
}

/**
 * i18n Service
 */
class I18nService {
    private initialized = false;
    private currentLanguage: Language = Language.ENGLISH;
    private fallbackLanguage: Language = Language.ENGLISH;
    private translations: Map<Language, Translation> = new Map();
    private listeners: Array<(language: Language) => void> = [];

    // Language metadata
    private readonly languageMetadata: Map<Language, LanguageMetadata> = new Map([
        [Language.ENGLISH, {
            code: Language.ENGLISH,
            name: 'English',
            nativeName: 'English',
            direction: TextDirection.LTR,
            pluralRules: this.englishPluralRules
        }],
        [Language.SPANISH, {
            code: Language.SPANISH,
            name: 'Spanish',
            nativeName: 'Español',
            direction: TextDirection.LTR,
            pluralRules: this.englishPluralRules // Same as English
        }],
        [Language.FRENCH, {
            code: Language.FRENCH,
            name: 'French',
            nativeName: 'Français',
            direction: TextDirection.LTR,
            pluralRules: this.frenchPluralRules
        }],
        [Language.GERMAN, {
            code: Language.GERMAN,
            name: 'German',
            nativeName: 'Deutsch',
            direction: TextDirection.LTR,
            pluralRules: this.englishPluralRules
        }],
        [Language.ARABIC, {
            code: Language.ARABIC,
            name: 'Arabic',
            nativeName: 'العربية',
            direction: TextDirection.RTL,
            pluralRules: this.arabicPluralRules
        }],
        [Language.HEBREW, {
            code: Language.HEBREW,
            name: 'Hebrew',
            nativeName: 'עברית',
            direction: TextDirection.RTL,
            pluralRules: this.hebrewPluralRules
        }]
    ]);

    /**
     * Initialize i18n service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load saved language preference
            const saved = localStorage.getItem('i18n-language');
            if (saved && Object.values(Language).includes(saved as Language)) {
                this.currentLanguage = saved as Language;
            } else {
                // Detect browser language
                this.currentLanguage = this.detectBrowserLanguage();
            }

            // Load translations for current language
            await this.loadTranslations(this.currentLanguage);

            // Load fallback language if different
            if (this.currentLanguage !== this.fallbackLanguage) {
                await this.loadTranslations(this.fallbackLanguage);
            }

            // Apply language direction
            this.applyTextDirection();

            this.initialized = true;
            logger.info('I18nService initialized', { language: this.currentLanguage }, 'i18n');
            analytics.trackEvent('i18n_initialized', { language: this.currentLanguage });
        } catch (error: any) {
            logger.error('Failed to initialize I18nService', error, undefined, 'i18n');
            throw error;
        }
    }

    /**
     * Detect browser language
     */
    private detectBrowserLanguage(): Language {
        const browserLang = navigator.language || (navigator as any).userLanguage;
        const langCode = browserLang.split('-')[0];

        // Try exact match first
        for (const lang of Object.values(Language)) {
            if (lang === browserLang) {
                return lang;
            }
        }

        // Try partial match (e.g., 'en' matches 'en-US')
        for (const lang of Object.values(Language)) {
            if (lang.startsWith(langCode)) {
                return lang;
            }
        }

        return Language.ENGLISH; // Default fallback
    }

    /**
     * Load translations for a language
     */
    private async loadTranslations(language: Language): Promise<void> {
        // Check if already loaded
        if (this.translations.has(language)) return;

        try {
            // In production, these would be loaded from JSON files or API
            const translations = await this.fetchTranslations(language);
            this.translations.set(language, translations);

            logger.debug(`Translations loaded for ${language}`, undefined, 'i18n');
        } catch (error: any) {
            logger.error(`Failed to load translations for ${language}`, error, undefined, 'i18n');

            // Use empty translations as fallback
            this.translations.set(language, {});
        }
    }

    /**
     * Fetch translations (mock implementation)
     * TODO: Replace with actual API call or file loading
     */
    private async fetchTranslations(language: Language): Promise<Translation> {
        // Mock translations for demonstration
        const mockTranslations: Partial<Record<Language, Translation>> = {
            [Language.ENGLISH]: {
                common: {
                    search: 'Search',
                    cancel: 'Cancel',
                    save: 'Save',
                    delete: 'Delete',
                    close: 'Close',
                    back: 'Back',
                    next: 'Next',
                    loading: 'Loading...',
                    error: 'Error',
                    success: 'Success'
                },
                movie: {
                    title: 'Movies',
                    watchNow: 'Watch Now',
                    addToWatchlist: 'Add to Watchlist',
                    rating: 'Rating',
                    duration: 'Duration',
                    releaseDate: 'Release Date',
                    itemsCount: {
                        one: '{{count}} movie',
                        other: '{{count}} movies'
                    }
                },
                settings: {
                    title: 'Settings',
                    language: 'Language',
                    theme: 'Theme',
                    accessibility: 'Accessibility',
                    fontSize: 'Font Size',
                    contrastMode: 'Contrast Mode',
                    notifications: 'Notifications'
                }
            },
            [Language.SPANISH]: {
                common: {
                    search: 'Buscar',
                    cancel: 'Cancelar',
                    save: 'Guardar',
                    delete: 'Eliminar',
                    close: 'Cerrar',
                    back: 'Atrás',
                    next: 'Siguiente',
                    loading: 'Cargando...',
                    error: 'Error',
                    success: 'Éxito'
                },
                movie: {
                    title: 'Películas',
                    watchNow: 'Ver Ahora',
                    addToWatchlist: 'Añadir a Lista',
                    rating: 'Calificación',
                    duration: 'Duración',
                    releaseDate: 'Fecha de Estreno',
                    itemsCount: {
                        one: '{{count}} película',
                        other: '{{count}} películas'
                    }
                },
                settings: {
                    title: 'Configuración',
                    language: 'Idioma',
                    theme: 'Tema',
                    accessibility: 'Accesibilidad',
                    fontSize: 'Tamaño de Fuente',
                    contrastMode: 'Modo de Contraste',
                    notifications: 'Notificaciones'
                }
            },
            [Language.FRENCH]: {
                common: {
                    search: 'Rechercher',
                    cancel: 'Annuler',
                    save: 'Enregistrer',
                    delete: 'Supprimer',
                    close: 'Fermer',
                    back: 'Retour',
                    next: 'Suivant',
                    loading: 'Chargement...',
                    error: 'Erreur',
                    success: 'Succès'
                },
                movie: {
                    title: 'Films',
                    watchNow: 'Regarder Maintenant',
                    addToWatchlist: 'Ajouter à la Liste',
                    rating: 'Note',
                    duration: 'Durée',
                    releaseDate: 'Date de Sortie',
                    itemsCount: {
                        one: '{{count}} film',
                        other: '{{count}} films'
                    }
                },
                settings: {
                    title: 'Paramètres',
                    language: 'Langue',
                    theme: 'Thème',
                    accessibility: 'Accessibilité',
                    fontSize: 'Taille de Police',
                    contrastMode: 'Mode de Contraste',
                    notifications: 'Notifications'
                }
            },
            [Language.GERMAN]: {
                common: {
                    search: 'Suchen',
                    cancel: 'Abbrechen',
                    save: 'Speichern',
                    delete: 'Löschen',
                    close: 'Schließen',
                    back: 'Zurück',
                    next: 'Weiter',
                    loading: 'Laden...',
                    error: 'Fehler',
                    success: 'Erfolg'
                },
                movie: {
                    title: 'Filme',
                    watchNow: 'Jetzt Ansehen',
                    addToWatchlist: 'Zur Liste Hinzufügen',
                    rating: 'Bewertung',
                    duration: 'Dauer',
                    releaseDate: 'Veröffentlichungsdatum',
                    itemsCount: {
                        one: '{{count}} Film',
                        other: '{{count}} Filme'
                    }
                },
                settings: {
                    title: 'Einstellungen',
                    language: 'Sprache',
                    theme: 'Thema',
                    accessibility: 'Barrierefreiheit',
                    fontSize: 'Schriftgröße',
                    contrastMode: 'Kontrastmodus',
                    notifications: 'Benachrichtigungen'
                }
            },
            [Language.ARABIC]: {
                common: {
                    search: 'بحث',
                    cancel: 'إلغاء',
                    save: 'حفظ',
                    delete: 'حذف',
                    close: 'إغلاق',
                    back: 'رجوع',
                    next: 'التالي',
                    loading: 'جار التحميل...',
                    error: 'خطأ',
                    success: 'نجاح'
                },
                movie: {
                    title: 'أفلام',
                    watchNow: 'شاهد الآن',
                    addToWatchlist: 'إضافة إلى القائمة',
                    rating: 'التقييم',
                    duration: 'المدة',
                    releaseDate: 'تاريخ الإصدار',
                    itemsCount: {
                        one: 'فيلم واحد',
                        two: 'فيلمان',
                        few: '{{count}} أفلام',
                        many: '{{count}} فيلماً',
                        other: '{{count}} فيلم'
                    }
                },
                settings: {
                    title: 'الإعدادات',
                    language: 'اللغة',
                    theme: 'السمة',
                    accessibility: 'إمكانية الوصول',
                    fontSize: 'حجم الخط',
                    contrastMode: 'وضع التباين',
                    notifications: 'الإشعارات'
                }
            },
            [Language.HEBREW]: {
                common: {
                    search: 'חיפוש',
                    cancel: 'ביטול',
                    save: 'שמירה',
                    delete: 'מחיקה',
                    close: 'סגירה',
                    back: 'חזרה',
                    next: 'הבא',
                    loading: 'טוען...',
                    error: 'שגיאה',
                    success: 'הצלחה'
                },
                movie: {
                    title: 'סרטים',
                    watchNow: 'צפה עכשיו',
                    addToWatchlist: 'הוסף לרשימה',
                    rating: 'דירוג',
                    duration: 'משך',
                    releaseDate: 'תאריך יציאה',
                    itemsCount: {
                        one: 'סרט אחד',
                        two: 'שני סרטים',
                        other: '{{count}} סרטים'
                    }
                },
                settings: {
                    title: 'הגדרות',
                    language: 'שפה',
                    theme: 'ערכת נושא',
                    accessibility: 'נגישות',
                    fontSize: 'גודל גופן',
                    contrastMode: 'מצב ניגודיות',
                    notifications: 'התראות'
                }
            }
        };

        // Return mock translations or empty object
        return mockTranslations[language] || {};
    }

    /**
     * Get current language
     */
    getCurrentLanguage(): Language {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): LanguageMetadata[] {
        return Array.from(this.languageMetadata.values());
    }

    /**
     * Get language metadata
     */
    getLanguageMetadata(language: Language): LanguageMetadata | undefined {
        return this.languageMetadata.get(language);
    }

    /**
     * Change language
     */
    async changeLanguage(language: Language): Promise<void> {
        if (this.currentLanguage === language) return;

        // Load translations if not already loaded
        await this.loadTranslations(language);

        this.currentLanguage = language;
        localStorage.setItem('i18n-language', language);

        // Apply text direction
        this.applyTextDirection();

        // Notify listeners
        this.notifyListeners(language);

        logger.info('Language changed', { language }, 'i18n');
        analytics.trackEvent('language_changed', { language });
    }

    /**
     * Apply text direction based on current language
     */
    private applyTextDirection(): void {
        const metadata = this.languageMetadata.get(this.currentLanguage);
        const direction = metadata?.direction || TextDirection.LTR;

        document.documentElement.setAttribute('dir', direction);
        document.documentElement.setAttribute('lang', this.currentLanguage);

        logger.debug('Text direction applied', { direction }, 'i18n');
    }

    /**
     * Translate a key
     */
    t(key: string, params?: InterpolationParams, count?: number): string {
        const translation = this.getTranslation(key, this.currentLanguage);

        if (typeof translation === 'object' && this.isPluralTranslation(translation)) {
            // Handle plural forms
            return this.handlePlural(translation, count || 0, params);
        }

        if (typeof translation === 'string') {
            // Handle interpolation
            return this.interpolate(translation, params);
        }

        // Fallback to key if translation not found
        logger.warn(`Translation not found for key: ${key}`, { language: this.currentLanguage }, 'i18n');
        return key;
    }

    /**
     * Get translation from translations object
     */
    private getTranslation(key: string, language: Language): string | PluralTranslation | Translation | undefined {
        const translations = this.translations.get(language);
        if (!translations) return undefined;

        const keys = key.split('.');
        let current: any = translations;

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                // Try fallback language
                if (language !== this.fallbackLanguage) {
                    return this.getTranslation(key, this.fallbackLanguage);
                }
                return undefined;
            }
        }

        return current;
    }

    /**
     * Check if object is a plural translation
     */
    private isPluralTranslation(obj: any): obj is PluralTranslation {
        return obj && typeof obj === 'object' && ('other' in obj);
    }

    /**
     * Handle plural forms
     */
    private handlePlural(translation: PluralTranslation, count: number, params?: InterpolationParams): string {
        const metadata = this.languageMetadata.get(this.currentLanguage);
        const pluralForm = metadata?.pluralRules(count) || PluralForm.OTHER;

        let text = translation[pluralForm] || translation.other;

        // Add count to params
        const allParams = { ...params, count };

        return this.interpolate(text, allParams);
    }

    /**
     * Interpolate parameters into string
     */
    private interpolate(text: string, params?: InterpolationParams): string {
        if (!params) return text;

        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return key in params ? String(params[key]) : match;
        });
    }

    /**
     * English plural rules (also used for Spanish, German, etc.)
     */
    private englishPluralRules(count: number): PluralForm {
        return count === 1 ? PluralForm.ONE : PluralForm.OTHER;
    }

    /**
     * French plural rules
     */
    private frenchPluralRules(count: number): PluralForm {
        return count === 0 || count === 1 ? PluralForm.ONE : PluralForm.OTHER;
    }

    /**
     * Arabic plural rules
     */
    private arabicPluralRules(count: number): PluralForm {
        if (count === 0) return PluralForm.ZERO;
        if (count === 1) return PluralForm.ONE;
        if (count === 2) return PluralForm.TWO;
        if (count % 100 >= 3 && count % 100 <= 10) return PluralForm.FEW;
        if (count % 100 >= 11 && count % 100 <= 99) return PluralForm.MANY;
        return PluralForm.OTHER;
    }

    /**
     * Hebrew plural rules
     */
    private hebrewPluralRules(count: number): PluralForm {
        if (count === 1) return PluralForm.ONE;
        if (count === 2) return PluralForm.TWO;
        return PluralForm.OTHER;
    }

    /**
     * Add language change listener
     */
    addLanguageChangeListener(listener: (language: Language) => void): void {
        this.listeners.push(listener);
    }

    /**
     * Remove language change listener
     */
    removeLanguageChangeListener(listener: (language: Language) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of language change
     */
    private notifyListeners(language: Language): void {
        for (const listener of this.listeners) {
            try {
                listener(language);
            } catch (error: any) {
                logger.error('Error in language change listener', error, undefined, 'i18n');
            }
        }
    }

    /**
     * Format date based on current language
     */
    formatDate(date: Date, format: 'short' | 'long' | 'full' = 'short'): string {
        const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
            short: { year: 'numeric', month: 'numeric', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        };

        return new Intl.DateTimeFormat(this.currentLanguage, optionsMap[format]).format(date);
    }

    /**
     * Format number based on current language
     */
    formatNumber(value: number, decimals: number = 0): string {
        return new Intl.NumberFormat(this.currentLanguage, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    /**
     * Format currency based on current language
     */
    formatCurrency(value: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat(this.currentLanguage, {
            style: 'currency',
            currency
        }).format(value);
    }
}

/**
 * Export singleton instance
 */
export const i18n = new I18nService();

/**
 * Convenience function for translations
 */
export const t = (key: string, params?: InterpolationParams, count?: number): string => {
    return i18n.t(key, params, count);
};
