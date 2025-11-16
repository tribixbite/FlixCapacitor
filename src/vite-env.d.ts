/// <reference types="vite/client" />

/**
 * Vite environment variables type definitions
 *
 * This file provides type safety for import.meta.env usage throughout the app.
 * Environment variables must be prefixed with VITE_ to be exposed to the client.
 */

interface ImportMetaEnv {
  // Supabase configuration
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  // Sentry configuration
  readonly VITE_SENTRY_DSN?: string;

  // Vite built-in environment variables
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
