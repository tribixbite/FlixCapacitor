/**
 * Authentication Modal View
 * Phase 12B: Backend Integration - Day 5
 *
 * Provides UI for user authentication:
 * - Sign in with email/password
 * - Sign up for new account
 * - Error handling and validation
 * - Loading states
 */

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import { getApiClient } from '../lib/api-client';

interface AuthModalViewOptions extends Backbone.ViewOptions<Backbone.Model> {
    mode?: 'signin' | 'signup';
    onSuccess?: (user: any) => void;
    onCancel?: () => void;
}

/**
 * Authentication Modal View
 * Handles user sign in and sign up flows
 */
export default class AuthModalView extends Marionette.View<Backbone.Model> {
    private mode: 'signin' | 'signup' = 'signin';
    private onSuccess?: (user: any) => void;
    private onCancel?: () => void;
    private isLoading: boolean = false;

    override className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4';

    template() {
        const title = this.mode === 'signin' ? 'Sign In' : 'Create Account';
        const submitText = this.mode === 'signin' ? 'Sign In' : 'Sign Up';
        const switchText = this.mode === 'signin'
            ? "Don't have an account?"
            : 'Already have an account?';
        const switchLinkText = this.mode === 'signin' ? 'Sign up' : 'Sign in';

        return `
            <div class="bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <!-- Close button -->
                <button
                    class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    data-action="close"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <!-- Title -->
                <h2 class="text-2xl font-bold text-white mb-6">${title}</h2>

                <!-- Error message -->
                <div class="error-message hidden mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-500 rounded text-red-200 text-sm"></div>

                <!-- Form -->
                <form data-form="auth" class="space-y-4">
                    <!-- Email field -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                            required
                            autocomplete="email"
                        />
                    </div>

                    <!-- Password field -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="${this.mode === 'signup' ? 'At least 6 characters' : '••••••••'}"
                            required
                            minlength="6"
                            autocomplete="${this.mode === 'signin' ? 'current-password' : 'new-password'}"
                        />
                    </div>

                    <!-- Submit button -->
                    <button
                        type="submit"
                        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        ${this.isLoading ? 'disabled' : ''}
                    >
                        ${this.isLoading ? `
                            <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ` : submitText}
                    </button>
                </form>

                <!-- Mode switcher -->
                <div class="mt-6 text-center text-sm">
                    <span class="text-gray-400">${switchText}</span>
                    <button
                        class="ml-2 text-blue-400 hover:text-blue-300 font-medium focus:outline-none"
                        data-action="switch-mode"
                    >
                        ${switchLinkText}
                    </button>
                </div>

                <!-- Additional info for signup -->
                ${this.mode === 'signup' ? `
                    <div class="mt-4 text-xs text-gray-500 text-center">
                        By signing up, you agree to our terms of service and privacy policy.
                    </div>
                ` : ''}
            </div>
        `;
    }

    override events = {
        'submit [data-form="auth"]': 'handleSubmit',
        'click [data-action="close"]': 'handleClose',
        'click [data-action="switch-mode"]': 'handleSwitchMode'
    };

    constructor(options: AuthModalViewOptions) {
        super(options as any);
        this.mode = options.mode || 'signin';
        this.onSuccess = options.onSuccess;
        this.onCancel = options.onCancel;
    }

    /**
     * Handle form submission (sign in or sign up)
     */
    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();

        const form = e.target as HTMLFormElement;
        const emailInput = form.querySelector('[name="email"]') as HTMLInputElement;
        const passwordInput = form.querySelector('[name="password"]') as HTMLInputElement;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            const apiClient = getApiClient();

            if (this.mode === 'signin') {
                // Sign in
                console.log('Signing in:', email);
                const { user, error } = await apiClient.signIn(email, password);

                if (error) {
                    this.showError(this.getErrorMessage(error));
                    this.setLoading(false);
                    return;
                }

                console.log('Sign in successful:', user?.id);
                this.onSuccess?.(user);
                this.remove();

            } else {
                // Sign up
                console.log('Signing up:', email);
                const { user, error } = await apiClient.signUp(email, password);

                if (error) {
                    this.showError(this.getErrorMessage(error));
                    this.setLoading(false);
                    return;
                }

                console.log('Sign up successful:', user?.id);
                this.showSuccess('Account created! Please check your email to verify your account.');

                // Auto sign in after signup
                setTimeout(() => {
                    this.onSuccess?.(user);
                    this.remove();
                }, 2000);
            }

        } catch (error) {
            console.error('Auth error:', error);
            this.showError('An unexpected error occurred. Please try again.');
            this.setLoading(false);
        }
    }

    /**
     * Handle close button click
     */
    private handleClose(e: Event): void {
        e.preventDefault();
        this.onCancel?.();
        this.remove();
    }

    /**
     * Handle mode switch (signin <-> signup)
     */
    private handleSwitchMode(e: Event): void {
        e.preventDefault();
        this.mode = this.mode === 'signin' ? 'signup' : 'signin';
        this.render();
    }

    /**
     * Show error message
     */
    private showError(message: string): void {
        const errorEl = this.el.querySelector('.error-message') as HTMLElement;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    private hideError(): void {
        const errorEl = this.el.querySelector('.error-message') as HTMLElement;
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    /**
     * Show success message
     */
    private showSuccess(message: string): void {
        const errorEl = this.el.querySelector('.error-message') as HTMLElement;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.className = 'error-message mb-4 p-3 bg-green-900 bg-opacity-30 border border-green-500 rounded text-green-200 text-sm';
        }
    }

    /**
     * Set loading state
     */
    private setLoading(loading: boolean): void {
        this.isLoading = loading;
        this.render();
    }

    /**
     * Get user-friendly error message
     */
    private getErrorMessage(error: any): string {
        const message = error.message || String(error);

        // Map common Supabase error messages to user-friendly text
        if (message.includes('Invalid login credentials')) {
            return 'Invalid email or password';
        }
        if (message.includes('User already registered')) {
            return 'An account with this email already exists';
        }
        if (message.includes('Email not confirmed')) {
            return 'Please verify your email address before signing in';
        }
        if (message.includes('Password should be at least')) {
            return 'Password must be at least 6 characters';
        }
        if (message.includes('Unable to validate email')) {
            return 'Please enter a valid email address';
        }
        if (message.includes('Network error') || message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection';
        }

        return message || 'Authentication failed. Please try again';
    }

    /**
     * Clean up when view is removed
     */
    override onDestroy(): void {
        // Clean up any event listeners
        this.isLoading = false;
    }
}
