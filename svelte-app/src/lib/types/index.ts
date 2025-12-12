/**
 * Type Definitions Index
 * Central export point for all application types
 */

// Re-export all types from individual modules
export * from './media.types';
export * from './torrent.types';
export * from './player.types';
export * from './library.types';
export * from './download.types';
export * from './settings.types';
export * from './api.types';

// Additional common types and utilities

// UI State types
export interface UIState {
  loading: boolean;
  error: string | null;
  currentView: ViewType;
  navigationHistory: string[];
  isOnline: boolean;
  isBackgroundMode: boolean;
}

export type ViewType =
  | 'home'
  | 'movies'
  | 'shows'
  | 'anime'
  | 'library'
  | 'favorites'
  | 'watchlist'
  | 'downloads'
  | 'settings'
  | 'search'
  | 'player'
  | 'details';

// Navigation types
export interface NavigationRoute {
  name: string;
  path: string;
  component?: any;
  params?: Record<string, any>;
  meta?: {
    title?: string;
    requiresAuth?: boolean;
    backButton?: boolean;
  };
}

export interface NavigationState {
  currentRoute: NavigationRoute | null;
  previousRoute: NavigationRoute | null;
  history: NavigationRoute[];
  canGoBack: boolean;
  canGoForward: boolean;
}

// Toast/Notification types
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

// Modal types
export interface Modal {
  id: string;
  type: ModalType;
  title?: string;
  content: any;
  props?: Record<string, any>;
  closeable?: boolean;
  onClose?: () => void;
}

export type ModalType =
  | 'confirm'
  | 'alert'
  | 'prompt'
  | 'custom'
  | 'file-picker'
  | 'quality-selector'
  | 'subtitle-selector';

// Search types
export interface SearchQuery {
  query: string;
  type?: 'movie' | 'tv' | 'anime' | 'all';
  filters?: SearchFilters;
  page?: number;
}

export interface SearchFilters {
  year?: number;
  genre?: number[];
  rating?: number;
  language?: string;
  sortBy?: SearchSortField;
  sortOrder?: 'asc' | 'desc';
}

export type SearchSortField =
  | 'popularity'
  | 'rating'
  | 'release_date'
  | 'title'
  | 'vote_count';

export interface SearchResult<T = any> {
  results: T[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset?: number;
  limit?: number;
}

// Cache types
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  size?: number;
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

// Event types
export interface AppEvent<T = any> {
  type: string;
  data?: T;
  timestamp: number;
}

export type EventHandler<T = any> = (event: AppEvent<T>) => void;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

// Component prop types
export interface BaseComponentProps {
  class?: string;
  style?: string;
  id?: string;
}

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Pick by value type
export type PickByValue<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? K : never }[keyof T]
>;

// Omit by value type
export type OmitByValue<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? never : K }[keyof T]
>;

// Required keys
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Optional keys
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Function that returns a value or promise
export type MaybeAsync<T> = T | Promise<T>;

// Extract promise type
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Database types
export interface DBQuery<T = any> {
  sql: string;
  params?: any[];
  result?: T[];
}

export interface DBTransaction {
  begin: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  execute: <T = any>(query: DBQuery<T>) => Promise<T[]>;
}

// Logger types
export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

// Service types
export interface Service {
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  isInitialized: boolean;
}

// Store types (for state management)
export interface Store<T> {
  subscribe: (subscriber: (value: T) => void) => () => void;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
}

export type Writable<T> = Store<T> & {
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
};

export type Readable<T> = Pick<Store<T>, 'subscribe'>;

// Validation types
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Form types
export interface FormField<T = any> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  rules?: ValidationRule<T>[];
}

export interface Form<T = Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  submitting: boolean;
  errors: Record<string, string>;
}
