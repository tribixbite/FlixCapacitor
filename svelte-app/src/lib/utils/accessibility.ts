/**
 * Accessibility utilities for handling user preferences and WCAG compliance
 */

import { writable, derived, type Readable } from 'svelte/store';

// Store for tracking reduced motion preference
function createReducedMotionStore() {
  const { subscribe, set } = writable(false);

  if (typeof window !== 'undefined') {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    set(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => set(e.matches));
  }

  return { subscribe };
}

export const prefersReducedMotion = createReducedMotionStore();

// Store for tracking high contrast preference
function createHighContrastStore() {
  const { subscribe, set } = writable(false);

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    set(mediaQuery.matches);
    mediaQuery.addEventListener('change', (e) => set(e.matches));
  }

  return { subscribe };
}

export const prefersHighContrast = createHighContrastStore();

// Store for tracking color scheme preference
function createColorSchemeStore() {
  const { subscribe, set } = writable<'light' | 'dark'>('dark');

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    set(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', (e) => set(e.matches ? 'dark' : 'light'));
  }

  return { subscribe };
}

export const prefersColorScheme = createColorSchemeStore();

/**
 * Announce a message to screen readers using live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;

  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Generate a unique ID for accessibility attributes
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if element is currently visible in viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get the first focusable element within a container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusableSelector = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';
  return container.querySelector(focusableSelector);
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * Calculate color contrast ratio between two colors
 * Returns ratio (e.g., 4.5 for WCAG AA compliance)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Simple hex to RGB conversion (supports #RGB and #RRGGBB)
    let r: number, g: number, b: number;

    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }

    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA requirements
 */
export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Create skip link functionality
 */
export function skipToContent(targetId: string = 'main-content'): void {
  const target = document.getElementById(targetId);
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus();
    // Reset tabindex after focus
    setTimeout(() => target.removeAttribute('tabindex'), 100);
  }
}
