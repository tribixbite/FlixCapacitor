/**
 * Animation Service
 * Phase 9D.1: Screen transitions, loading states, gesture feedback, skeleton animations
 * Provides smooth animations throughout the app
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Animation timing functions
 */
export enum AnimationEasing {
    LINEAR = 'linear',
    EASE = 'ease',
    EASE_IN = 'ease-in',
    EASE_OUT = 'ease-out',
    EASE_IN_OUT = 'ease-in-out',
    EASE_IN_CUBIC = 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    EASE_OUT_CUBIC = 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    EASE_IN_OUT_CUBIC = 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    EASE_IN_QUART = 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    EASE_OUT_QUART = 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    EASE_IN_OUT_QUART = 'cubic-bezier(0.77, 0, 0.175, 1)',
    SPRING = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
}

/**
 * Animation duration presets (milliseconds)
 */
export enum AnimationDuration {
    INSTANT = 0,
    FAST = 150,
    NORMAL = 300,
    SLOW = 500,
    VERY_SLOW = 1000
}

/**
 * Screen transition types
 */
export enum TransitionType {
    FADE = 'fade',
    SLIDE_LEFT = 'slide-left',
    SLIDE_RIGHT = 'slide-right',
    SLIDE_UP = 'slide-up',
    SLIDE_DOWN = 'slide-down',
    SCALE = 'scale',
    FLIP = 'flip'
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
    duration: number;
    easing: AnimationEasing;
    delay?: number;
    fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

/**
 * Transition configuration
 */
export interface TransitionConfig extends AnimationConfig {
    type: TransitionType;
}

/**
 * Gesture feedback options
 */
export interface GestureFeedbackOptions {
    scale?: number;
    duration?: number;
    color?: string;
}

/**
 * Animation Service
 */
class AnimationService {
    private initialized = false;
    private reducedMotion = false;
    private animationSpeedMultiplier = 1.0;

    /**
     * Initialize animation service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Check user's reduced motion preference
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Listen for changes to reduced motion preference
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
                logger.debug('Reduced motion preference changed', { reducedMotion: this.reducedMotion }, 'animations');
            });

            // Inject animation CSS
            this.injectAnimationStyles();

            this.initialized = true;
            logger.info('AnimationService initialized', { reducedMotion: this.reducedMotion }, 'animations');
            analytics.trackEvent('animation_service_initialized', { reducedMotion: this.reducedMotion });
        } catch (error: any) {
            logger.error('Failed to initialize AnimationService', error, undefined, 'animations');
            throw error;
        }
    }

    /**
     * Set animation speed multiplier
     */
    setSpeedMultiplier(multiplier: number): void {
        this.animationSpeedMultiplier = Math.max(0.1, Math.min(10, multiplier));
        logger.debug('Animation speed multiplier changed', { multiplier: this.animationSpeedMultiplier }, 'animations');
    }

    /**
     * Get animation speed multiplier
     */
    getSpeedMultiplier(): number {
        return this.animationSpeedMultiplier;
    }

    /**
     * Check if reduced motion is enabled
     */
    isReducedMotion(): boolean {
        return this.reducedMotion;
    }

    /**
     * Get adjusted duration based on speed multiplier and reduced motion
     */
    private getAdjustedDuration(duration: number): number {
        if (this.reducedMotion) return 0;
        return duration / this.animationSpeedMultiplier;
    }

    /**
     * Inject animation CSS styles
     */
    private injectAnimationStyles(): void {
        const styleId = 'animation-service-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Fade animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            /* Slide animations */
            @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            @keyframes slideOutLeft {
                from { transform: translateX(0); }
                to { transform: translateX(-100%); }
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }
            @keyframes slideInUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            @keyframes slideOutUp {
                from { transform: translateY(0); }
                to { transform: translateY(-100%); }
            }
            @keyframes slideInDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            @keyframes slideOutDown {
                from { transform: translateY(0); }
                to { transform: translateY(100%); }
            }

            /* Scale animations */
            @keyframes scaleIn {
                from { transform: scale(0); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes scaleOut {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(0); opacity: 0; }
            }

            /* Flip animations */
            @keyframes flipIn {
                from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
                to { transform: perspective(400px) rotateY(0); opacity: 1; }
            }
            @keyframes flipOut {
                from { transform: perspective(400px) rotateY(0); opacity: 1; }
                to { transform: perspective(400px) rotateY(90deg); opacity: 0; }
            }

            /* Pulse animation */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Shimmer animation */
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            /* Spin animation */
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Bounce animation */
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            /* Ripple effect */
            @keyframes ripple {
                from {
                    opacity: 1;
                    transform: scale(0);
                }
                to {
                    opacity: 0;
                    transform: scale(2.5);
                }
            }

            /* Skeleton shimmer */
            .skeleton-shimmer {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.0) 0%,
                    rgba(255, 255, 255, 0.1) 50%,
                    rgba(255, 255, 255, 0.0) 100%
                );
                background-size: 1000px 100%;
                animation: shimmer 2s infinite;
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Animate element
     */
    async animate(
        element: HTMLElement,
        keyframes: Keyframe[],
        config: Partial<AnimationConfig> = {}
    ): Promise<void> {
        const duration = this.getAdjustedDuration(config.duration || AnimationDuration.NORMAL);
        const easing = config.easing || AnimationEasing.EASE_IN_OUT;
        const delay = config.delay || 0;
        const fill = config.fill || 'forwards';

        if (this.reducedMotion) {
            // Apply final state immediately
            const finalFrame = keyframes[keyframes.length - 1];
            Object.assign(element.style, finalFrame);
            return;
        }

        return new Promise((resolve) => {
            const animation = element.animate(keyframes, {
                duration,
                easing,
                delay,
                fill
            });

            animation.onfinish = () => resolve();
        });
    }

    /**
     * Fade in element
     */
    async fadeIn(element: HTMLElement, duration: number = AnimationDuration.NORMAL): Promise<void> {
        await this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    /**
     * Fade out element
     */
    async fadeOut(element: HTMLElement, duration: number = AnimationDuration.NORMAL): Promise<void> {
        await this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    /**
     * Slide in element
     */
    async slideIn(
        element: HTMLElement,
        direction: 'left' | 'right' | 'up' | 'down' = 'left',
        duration: number = AnimationDuration.NORMAL
    ): Promise<void> {
        const transforms: Record<string, string[]> = {
            left: ['translateX(-100%)', 'translateX(0)'],
            right: ['translateX(100%)', 'translateX(0)'],
            up: ['translateY(100%)', 'translateY(0)'],
            down: ['translateY(-100%)', 'translateY(0)']
        };

        const [from, to] = transforms[direction];

        await this.animate(element, [
            { transform: from },
            { transform: to }
        ], { duration });
    }

    /**
     * Slide out element
     */
    async slideOut(
        element: HTMLElement,
        direction: 'left' | 'right' | 'up' | 'down' = 'left',
        duration: number = AnimationDuration.NORMAL
    ): Promise<void> {
        const transforms: Record<string, string[]> = {
            left: ['translateX(0)', 'translateX(-100%)'],
            right: ['translateX(0)', 'translateX(100%)'],
            up: ['translateY(0)', 'translateY(-100%)'],
            down: ['translateY(0)', 'translateY(100%)']
        };

        const [from, to] = transforms[direction];

        await this.animate(element, [
            { transform: from },
            { transform: to }
        ], { duration });
    }

    /**
     * Scale in element
     */
    async scaleIn(element: HTMLElement, duration: number = AnimationDuration.NORMAL): Promise<void> {
        await this.animate(element, [
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ], { duration, easing: AnimationEasing.SPRING });
    }

    /**
     * Scale out element
     */
    async scaleOut(element: HTMLElement, duration: number = AnimationDuration.NORMAL): Promise<void> {
        await this.animate(element, [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0)', opacity: 0 }
        ], { duration, easing: AnimationEasing.EASE_IN_CUBIC });
    }

    /**
     * Perform screen transition
     */
    async transition(
        fromElement: HTMLElement | null,
        toElement: HTMLElement,
        config: Partial<TransitionConfig> = {}
    ): Promise<void> {
        const type = config.type || TransitionType.FADE;
        const duration = config.duration || AnimationDuration.NORMAL;

        analytics.trackEvent('screen_transition', { type });

        // Exit animation for previous screen
        if (fromElement) {
            await this.transitionOut(fromElement, type, duration);
        }

        // Enter animation for new screen
        await this.transitionIn(toElement, type, duration);
    }

    /**
     * Transition in
     */
    private async transitionIn(element: HTMLElement, type: TransitionType, duration: number): Promise<void> {
        element.style.display = 'block';

        switch (type) {
            case TransitionType.FADE:
                await this.fadeIn(element, duration);
                break;
            case TransitionType.SLIDE_LEFT:
                await this.slideIn(element, 'left', duration);
                break;
            case TransitionType.SLIDE_RIGHT:
                await this.slideIn(element, 'right', duration);
                break;
            case TransitionType.SLIDE_UP:
                await this.slideIn(element, 'up', duration);
                break;
            case TransitionType.SLIDE_DOWN:
                await this.slideIn(element, 'down', duration);
                break;
            case TransitionType.SCALE:
                await this.scaleIn(element, duration);
                break;
            case TransitionType.FLIP:
                await this.animate(element, [
                    { transform: 'perspective(400px) rotateY(90deg)', opacity: 0 },
                    { transform: 'perspective(400px) rotateY(0)', opacity: 1 }
                ], { duration });
                break;
        }
    }

    /**
     * Transition out
     */
    private async transitionOut(element: HTMLElement, type: TransitionType, duration: number): Promise<void> {
        switch (type) {
            case TransitionType.FADE:
                await this.fadeOut(element, duration);
                break;
            case TransitionType.SLIDE_LEFT:
                await this.slideOut(element, 'left', duration);
                break;
            case TransitionType.SLIDE_RIGHT:
                await this.slideOut(element, 'right', duration);
                break;
            case TransitionType.SLIDE_UP:
                await this.slideOut(element, 'up', duration);
                break;
            case TransitionType.SLIDE_DOWN:
                await this.slideOut(element, 'down', duration);
                break;
            case TransitionType.SCALE:
                await this.scaleOut(element, duration);
                break;
            case TransitionType.FLIP:
                await this.animate(element, [
                    { transform: 'perspective(400px) rotateY(0)', opacity: 1 },
                    { transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }
                ], { duration });
                break;
        }

        element.style.display = 'none';
    }

    /**
     * Gesture feedback (ripple effect)
     */
    ripple(element: HTMLElement, x: number, y: number, options: GestureFeedbackOptions = {}): void {
        if (this.reducedMotion) return;

        const scale = options.scale || 1.0;
        const duration = this.getAdjustedDuration(options.duration || AnimationDuration.FAST);
        const color = options.color || 'rgba(255, 255, 255, 0.3)';

        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = color;
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = `${x - 10}px`;
        ripple.style.top = `${y - 10}px`;
        ripple.style.pointerEvents = 'none';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        ripple.animate([
            { opacity: 1, transform: 'scale(0)' },
            { opacity: 0, transform: `scale(${scale})` }
        ], {
            duration,
            easing: AnimationEasing.EASE_OUT
        }).onfinish = () => {
            ripple.remove();
        };

        analytics.trackEvent('gesture_feedback', { type: 'ripple' });
    }

    /**
     * Button press feedback
     */
    async buttonPress(element: HTMLElement): Promise<void> {
        if (this.reducedMotion) return;

        await this.animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(0.95)' },
            { transform: 'scale(1)' }
        ], {
            duration: AnimationDuration.FAST,
            easing: AnimationEasing.EASE_IN_OUT
        });
    }

    /**
     * Loading spinner
     */
    startLoadingSpinner(element: HTMLElement): void {
        element.style.animation = `spin ${this.getAdjustedDuration(1000)}ms linear infinite`;
    }

    /**
     * Stop loading spinner
     */
    stopLoadingSpinner(element: HTMLElement): void {
        element.style.animation = '';
    }

    /**
     * Pulse animation (for notifications, alerts)
     */
    pulse(element: HTMLElement, count: number = 3): void {
        if (this.reducedMotion) return;

        element.animate([
            { opacity: 1 },
            { opacity: 0.5 },
            { opacity: 1 }
        ], {
            duration: this.getAdjustedDuration(AnimationDuration.SLOW),
            easing: AnimationEasing.EASE_IN_OUT,
            iterations: count
        });
    }

    /**
     * Bounce animation
     */
    bounce(element: HTMLElement, count: number = 2): void {
        if (this.reducedMotion) return;

        element.animate([
            { transform: 'translateY(0)' },
            { transform: 'translateY(-10px)' },
            { transform: 'translateY(0)' }
        ], {
            duration: this.getAdjustedDuration(AnimationDuration.NORMAL),
            easing: AnimationEasing.EASE_IN_OUT,
            iterations: count
        });
    }

    /**
     * Shake animation (for errors)
     */
    shake(element: HTMLElement): void {
        if (this.reducedMotion) return;

        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: this.getAdjustedDuration(AnimationDuration.NORMAL),
            easing: AnimationEasing.EASE_IN_OUT
        });
    }

    /**
     * Apply skeleton shimmer effect
     */
    applySkeleton(element: HTMLElement): void {
        element.classList.add('skeleton-shimmer');
    }

    /**
     * Remove skeleton shimmer effect
     */
    removeSkeleton(element: HTMLElement): void {
        element.classList.remove('skeleton-shimmer');
    }

    /**
     * Stagger animations for lists
     */
    async stagger(
        elements: HTMLElement[],
        animationFn: (element: HTMLElement) => Promise<void>,
        delayBetween: number = 50
    ): Promise<void> {
        const adjustedDelay = this.getAdjustedDuration(delayBetween);

        for (let i = 0; i < elements.length; i++) {
            if (adjustedDelay > 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, adjustedDelay));
            }
            await animationFn(elements[i]);
        }
    }

    /**
     * Parallax scroll effect
     */
    parallax(element: HTMLElement, scrollY: number, speed: number = 0.5): void {
        if (this.reducedMotion) return;

        const offset = scrollY * speed;
        element.style.transform = `translateY(${offset}px)`;
    }

    /**
     * Smooth scroll to element
     */
    scrollTo(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
        element.scrollIntoView({
            behavior: this.reducedMotion ? 'auto' : behavior,
            block: 'start',
            inline: 'nearest'
        });
    }
}

/**
 * Export singleton instance
 */
export const animationService = new AnimationService();
