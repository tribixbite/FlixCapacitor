/**
 * Accessibility Service
 * Phase 9D.2: Screen reader support, high contrast mode, font scaling, keyboard navigation
 * Ensures app is accessible to all users
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Font size presets
 */
export enum FontSize {
    EXTRA_SMALL = 'xs',
    SMALL = 'sm',
    NORMAL = 'md',
    LARGE = 'lg',
    EXTRA_LARGE = 'xl',
    EXTRA_EXTRA_LARGE = '2xl'
}

/**
 * Contrast mode
 */
export enum ContrastMode {
    NORMAL = 'normal',
    HIGH = 'high',
    EXTRA_HIGH = 'extra-high'
}

/**
 * Focus indicator style
 */
export enum FocusStyle {
    DEFAULT = 'default',
    THICK = 'thick',
    COLORFUL = 'colorful'
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
    fontSize: FontSize;
    contrastMode: ContrastMode;
    focusStyle: FocusStyle;
    reduceTransparency: boolean;
    underlineLinks: boolean;
    largeButtons: boolean;
    screenReaderAnnouncements: boolean;
}

/**
 * ARIA live region priority
 */
export enum AriaLivePriority {
    OFF = 'off',
    POLITE = 'polite',
    ASSERTIVE = 'assertive'
}

/**
 * Accessibility Service
 */
class AccessibilityService {
    private initialized = false;
    private config: AccessibilityConfig = {
        fontSize: FontSize.NORMAL,
        contrastMode: ContrastMode.NORMAL,
        focusStyle: FocusStyle.DEFAULT,
        reduceTransparency: false,
        underlineLinks: false,
        largeButtons: false,
        screenReaderAnnouncements: true
    };
    private liveRegion: HTMLElement | null = null;
    private focusTrap: HTMLElement | null = null;
    private focusableElements: HTMLElement[] = [];

    /**
     * Initialize accessibility service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load saved configuration
            await this.loadConfig();

            // Create ARIA live region
            this.createLiveRegion();

            // Apply initial configuration
            this.applyConfig();

            // Set up keyboard navigation
            this.setupKeyboardNavigation();

            // Detect system preferences
            this.detectSystemPreferences();

            this.initialized = true;
            logger.info('AccessibilityService initialized', this.config, 'accessibility');
            analytics.trackEvent('accessibility_service_initialized', this.config);
        } catch (error: any) {
            logger.error('Failed to initialize AccessibilityService', error, undefined, 'accessibility');
            throw error;
        }
    }

    /**
     * Load configuration from localStorage
     */
    private async loadConfig(): Promise<void> {
        const saved = localStorage.getItem('accessibility-config');
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch (error: any) {
                logger.warn('Failed to parse accessibility config', { error: error.message }, 'accessibility');
            }
        }
    }

    /**
     * Save configuration to localStorage
     */
    private async saveConfig(): Promise<void> {
        localStorage.setItem('accessibility-config', JSON.stringify(this.config));
        logger.debug('Accessibility config saved', this.config, 'accessibility');
    }

    /**
     * Get current configuration
     */
    getConfig(): AccessibilityConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    async updateConfig(updates: Partial<AccessibilityConfig>): Promise<void> {
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
        this.applyConfig();

        logger.info('Accessibility config updated', updates, 'accessibility');
        analytics.trackEvent('accessibility_config_updated', updates);
    }

    /**
     * Apply configuration to DOM
     */
    private applyConfig(): void {
        const root = document.documentElement;

        // Font size
        root.setAttribute('data-font-size', this.config.fontSize);
        this.applyFontSize(this.config.fontSize);

        // Contrast mode
        root.setAttribute('data-contrast-mode', this.config.contrastMode);
        this.applyContrastMode(this.config.contrastMode);

        // Focus style
        root.setAttribute('data-focus-style', this.config.focusStyle);
        this.applyFocusStyle(this.config.focusStyle);

        // Reduce transparency
        if (this.config.reduceTransparency) {
            root.classList.add('reduce-transparency');
        } else {
            root.classList.remove('reduce-transparency');
        }

        // Underline links
        if (this.config.underlineLinks) {
            root.classList.add('underline-links');
        } else {
            root.classList.remove('underline-links');
        }

        // Large buttons
        if (this.config.largeButtons) {
            root.classList.add('large-buttons');
        } else {
            root.classList.remove('large-buttons');
        }
    }

    /**
     * Apply font size
     */
    private applyFontSize(size: FontSize): void {
        const root = document.documentElement;
        const sizeMap: Record<FontSize, string> = {
            [FontSize.EXTRA_SMALL]: '12px',
            [FontSize.SMALL]: '14px',
            [FontSize.NORMAL]: '16px',
            [FontSize.LARGE]: '18px',
            [FontSize.EXTRA_LARGE]: '20px',
            [FontSize.EXTRA_EXTRA_LARGE]: '24px'
        };

        root.style.fontSize = sizeMap[size];
    }

    /**
     * Apply contrast mode
     */
    private applyContrastMode(mode: ContrastMode): void {
        const root = document.documentElement;

        // Remove all contrast classes
        root.classList.remove('contrast-normal', 'contrast-high', 'contrast-extra-high');

        // Add new contrast class
        root.classList.add(`contrast-${mode}`);

        // Inject contrast styles if needed
        this.injectContrastStyles(mode);
    }

    /**
     * Apply focus style
     */
    private applyFocusStyle(style: FocusStyle): void {
        const root = document.documentElement;

        // Remove all focus classes
        root.classList.remove('focus-default', 'focus-thick', 'focus-colorful');

        // Add new focus class
        root.classList.add(`focus-${style}`);

        // Inject focus styles
        this.injectFocusStyles(style);
    }

    /**
     * Inject contrast styles
     */
    private injectContrastStyles(mode: ContrastMode): void {
        const styleId = 'accessibility-contrast-styles';
        let style = document.getElementById(styleId) as HTMLStyleElement;

        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        if (mode === ContrastMode.HIGH) {
            style.textContent = `
                .contrast-high {
                    --color-bg-primary: #000000;
                    --color-bg-secondary: #1a1a1a;
                    --color-text-primary: #ffffff;
                    --color-text-secondary: #e0e0e0;
                    --color-border: #666666;
                }
                .contrast-high a { color: #66b3ff; }
                .contrast-high button { border: 2px solid currentColor; }
            `;
        } else if (mode === ContrastMode.EXTRA_HIGH) {
            style.textContent = `
                .contrast-extra-high {
                    --color-bg-primary: #000000;
                    --color-bg-secondary: #000000;
                    --color-text-primary: #ffffff;
                    --color-text-secondary: #ffffff;
                    --color-border: #ffffff;
                }
                .contrast-extra-high a { color: #ffff00; text-decoration: underline; }
                .contrast-extra-high button {
                    border: 3px solid #ffffff;
                    background: #000000;
                    color: #ffffff;
                }
            `;
        } else {
            style.textContent = '';
        }
    }

    /**
     * Inject focus styles
     */
    private injectFocusStyles(focusStyle: FocusStyle): void {
        const styleId = 'accessibility-focus-styles';
        let style = document.getElementById(styleId) as HTMLStyleElement;

        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        if (focusStyle === FocusStyle.THICK) {
            style.textContent = `
                .focus-thick *:focus {
                    outline: 4px solid #4a9eff;
                    outline-offset: 2px;
                }
            `;
        } else if (focusStyle === FocusStyle.COLORFUL) {
            style.textContent = `
                .focus-colorful *:focus {
                    outline: 3px solid #ff6b6b;
                    outline-offset: 3px;
                    box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.2);
                }
            `;
        } else {
            style.textContent = `
                .focus-default *:focus {
                    outline: 2px solid #4a9eff;
                    outline-offset: 1px;
                }
            `;
        }

        // Additional accessibility styles
        style.textContent += `
            /* Reduce transparency */
            .reduce-transparency * {
                backdrop-filter: none !important;
                background-color: rgba(0, 0, 0, 1) !important;
            }

            /* Underline links */
            .underline-links a {
                text-decoration: underline;
            }

            /* Large buttons */
            .large-buttons button,
            .large-buttons .button {
                min-height: 48px;
                padding: 12px 24px;
                font-size: 1.1em;
            }

            /* Skip to content link */
            .skip-to-content {
                position: absolute;
                top: -100px;
                left: 0;
                background: #000;
                color: #fff;
                padding: 8px;
                z-index: 10000;
            }
            .skip-to-content:focus {
                top: 0;
            }
        `;
    }

    /**
     * Detect system accessibility preferences
     */
    private detectSystemPreferences(): void {
        // High contrast
        const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        if (highContrast && this.config.contrastMode === ContrastMode.NORMAL) {
            this.updateConfig({ contrastMode: ContrastMode.HIGH });
        }

        // Reduced transparency
        const reduceTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
        if (reduceTransparency) {
            this.updateConfig({ reduceTransparency: true });
        }

        logger.debug('System accessibility preferences detected', {
            highContrast,
            reduceTransparency
        }, 'accessibility');
    }

    /**
     * Create ARIA live region for announcements
     */
    private createLiveRegion(): void {
        if (this.liveRegion) return;

        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only'; // Visually hidden but accessible to screen readers
        this.liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;

        document.body.appendChild(this.liveRegion);
    }

    /**
     * Announce message to screen readers
     */
    announce(message: string, priority: AriaLivePriority = AriaLivePriority.POLITE): void {
        if (!this.config.screenReaderAnnouncements || !this.liveRegion) return;

        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            if (this.liveRegion) {
                this.liveRegion.textContent = '';
            }
        }, 1000);

        logger.debug('Screen reader announcement', { message, priority }, 'accessibility');
        analytics.trackEvent('screen_reader_announcement', { priority });
    }

    /**
     * Set ARIA label
     */
    setAriaLabel(element: HTMLElement, label: string): void {
        element.setAttribute('aria-label', label);
    }

    /**
     * Set ARIA described by
     */
    setAriaDescribedBy(element: HTMLElement, id: string): void {
        element.setAttribute('aria-describedby', id);
    }

    /**
     * Set ARIA role
     */
    setAriaRole(element: HTMLElement, role: string): void {
        element.setAttribute('role', role);
    }

    /**
     * Mark element as loading
     */
    setLoading(element: HTMLElement, loading: boolean): void {
        element.setAttribute('aria-busy', loading.toString());
    }

    /**
     * Mark element as expanded/collapsed
     */
    setExpanded(element: HTMLElement, expanded: boolean): void {
        element.setAttribute('aria-expanded', expanded.toString());
    }

    /**
     * Mark element as selected
     */
    setSelected(element: HTMLElement, selected: boolean): void {
        element.setAttribute('aria-selected', selected.toString());
    }

    /**
     * Set up keyboard navigation
     */
    private setupKeyboardNavigation(): void {
        // Add skip to content link
        this.addSkipToContentLink();

        // Handle keyboard navigation for modals/dialogs
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals
            if (e.key === 'Escape' && this.focusTrap) {
                this.releaseFocusTrap();
            }

            // Tab navigation within focus trap
            if (e.key === 'Tab' && this.focusTrap) {
                this.handleFocusTrapTab(e);
            }
        });

        logger.debug('Keyboard navigation initialized', undefined, 'accessibility');
    }

    /**
     * Add skip to content link
     */
    private addSkipToContentLink(): void {
        const skip = document.createElement('a');
        skip.href = '#main-content';
        skip.textContent = 'Skip to main content';
        skip.className = 'skip-to-content';
        skip.addEventListener('click', (e) => {
            e.preventDefault();
            const main = document.getElementById('main-content');
            if (main) {
                main.focus();
                main.scrollIntoView();
            }
        });

        document.body.insertBefore(skip, document.body.firstChild);
    }

    /**
     * Create focus trap for modals/dialogs
     */
    createFocusTrap(container: HTMLElement): void {
        this.focusTrap = container;

        // Get all focusable elements
        this.focusableElements = Array.from(
            container.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        );

        // Focus first element
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }

        logger.debug('Focus trap created', { elementCount: this.focusableElements.length }, 'accessibility');
        analytics.trackEvent('focus_trap_created');
    }

    /**
     * Release focus trap
     */
    releaseFocusTrap(): void {
        this.focusTrap = null;
        this.focusableElements = [];

        logger.debug('Focus trap released', undefined, 'accessibility');
        analytics.trackEvent('focus_trap_released');
    }

    /**
     * Handle tab navigation within focus trap
     */
    private handleFocusTrapTab(e: KeyboardEvent): void {
        if (this.focusableElements.length === 0) return;

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Focus first invalid form field
     */
    focusFirstInvalid(form: HTMLFormElement): void {
        const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"], :invalid');
        if (invalid) {
            invalid.focus();
            this.announce('Please correct the highlighted field', AriaLivePriority.ASSERTIVE);
        }
    }

    /**
     * Mark form field as invalid
     */
    setFieldInvalid(field: HTMLElement, errorMessage: string): void {
        field.setAttribute('aria-invalid', 'true');

        // Create or update error message element
        const errorId = `${field.id || 'field'}-error`;
        let errorElement = document.getElementById(errorId);

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'field-error';
            errorElement.setAttribute('role', 'alert');
            field.parentElement?.appendChild(errorElement);
        }

        errorElement.textContent = errorMessage;
        field.setAttribute('aria-describedby', errorId);
    }

    /**
     * Mark form field as valid
     */
    setFieldValid(field: HTMLElement): void {
        field.setAttribute('aria-invalid', 'false');

        const errorId = `${field.id || 'field'}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.remove();
        }

        field.removeAttribute('aria-describedby');
    }

    /**
     * Set page title (announces to screen readers)
     */
    setPageTitle(title: string): void {
        document.title = title;
        this.announce(`Navigated to ${title}`, AriaLivePriority.POLITE);
    }

    /**
     * Make element visible to screen readers only
     */
    makeScreenReaderOnly(element: HTMLElement): void {
        element.className = 'sr-only';
        element.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
    }
}

/**
 * Export singleton instance
 */
export const accessibilityService = new AccessibilityService();
