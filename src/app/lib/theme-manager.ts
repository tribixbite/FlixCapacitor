/**
 * Theme Manager
 * Handles light/dark mode toggling with localStorage persistence
 */

export type Theme = 'light' | 'dark';

export class ThemeManager {
    private static readonly STORAGE_KEY = 'theme-preference';
    private static readonly META_THEME_COLOR_DARK = '#0a0a0a';
    private static readonly META_THEME_COLOR_LIGHT = '#ffffff';

    /**
     * Initialize theme on app load
     * Reads from localStorage or defaults to dark
     */
    static initialize(): void {
        const savedTheme = this.getStoredTheme();
        const systemPreference = this.getSystemPreference();
        const theme = savedTheme || systemPreference || 'dark';

        this.applyTheme(theme);

        // Listen for system theme changes
        this.watchSystemTheme();
    }

    /**
     * Get current theme
     */
    static getCurrentTheme(): Theme {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    /**
     * Toggle between light and dark modes
     */
    static toggle(): Theme {
        const currentTheme = this.getCurrentTheme();
        const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    /**
     * Set specific theme
     */
    static setTheme(theme: Theme): void {
        this.applyTheme(theme);
        this.storeTheme(theme);
    }

    /**
     * Apply theme to DOM
     */
    private static applyTheme(theme: Theme): void {
        const html = document.documentElement;

        if (theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
        } else {
            html.classList.add('light');
            html.classList.remove('dark');
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);

        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }

    /**
     * Update meta theme-color tag
     */
    private static updateMetaThemeColor(theme: Theme): void {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                theme === 'dark' ? this.META_THEME_COLOR_DARK : this.META_THEME_COLOR_LIGHT
            );
        }
    }

    /**
     * Get theme from localStorage
     */
    private static getStoredTheme(): Theme | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored === 'light' || stored === 'dark' ? stored : null;
        } catch (e) {
            console.warn('Failed to read theme from localStorage:', e);
            return null;
        }
    }

    /**
     * Store theme in localStorage
     */
    private static storeTheme(theme: Theme): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Failed to store theme in localStorage:', e);
        }
    }

    /**
     * Get system color scheme preference
     */
    private static getSystemPreference(): Theme | null {
        if (!window.matchMedia) {
            return null;
        }

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        return null;
    }

    /**
     * Watch for system theme changes
     */
    private static watchSystemTheme(): void {
        if (!window.matchMedia) {
            return;
        }

        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Only update if user hasn't set a preference
        darkModeQuery.addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Remove stored theme preference (revert to system default)
     */
    static clearPreference(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            const systemTheme = this.getSystemPreference() || 'dark';
            this.applyTheme(systemTheme);
        } catch (e) {
            console.warn('Failed to clear theme preference:', e);
        }
    }
}

// Export singleton instance for window access
if (typeof window !== 'undefined') {
    (window as any).ThemeManager = ThemeManager;
}

export default ThemeManager;
