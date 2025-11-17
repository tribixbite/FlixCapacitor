/**
 * Favorite Files View
 * Displays and manages user's favorite torrent files
 */

import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import favoritesService from '../lib/favorites-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface FavoriteFile {
  id: string;
  torrentHash: string;
  fileIndex: number;
  fileName: string;
  movieId?: string;
  addedAt: number;
}

interface FavoriteFilesCallbacks {
  onPlay?: (file: FavoriteFile) => void;
  onRemove?: (file: FavoriteFile) => void;
  onClose?: () => void;
}

interface FavoriteFilesViewOptions {
  callbacks?: FavoriteFilesCallbacks;
}

/**
 * Favorite Files View Component
 * Grid layout with sort, search, and batch operations
 */
export class FavoriteFilesView extends Marionette.View<Backbone.Model> {
  private callbacks: FavoriteFilesCallbacks;
  private files: FavoriteFile[] = [];
  private filteredFiles: FavoriteFile[] = [];
  private sortBy: 'name' | 'added_at' = 'added_at';
  private sortOrder: 'ASC' | 'DESC' = 'DESC';
  private searchQuery = '';
  private selectedIds = new Set<string>();
  private isLoading = false;

  constructor(options: FavoriteFilesViewOptions = {}) {
    super(options as any);
    this.callbacks = options.callbacks || {};

    // Set up events
    (this as any).events = {
      'click #favorite-files-close-btn': 'handleClose',
      'click #favorite-files-sort-name': 'handleSortByName',
      'click #favorite-files-sort-date': 'handleSortByDate',
      'input #favorite-files-search': 'handleSearch',
      'click .favorite-file-play-btn': 'handlePlay',
      'click .favorite-file-remove-btn': 'handleRemoveSingle',
      'click .favorite-file-checkbox': 'handleCheckboxToggle',
      'click #favorite-files-select-all': 'handleSelectAll',
      'click #favorite-files-remove-selected': 'handleRemoveSelected',
      'click #favorite-files-export': 'handleExport',
      'click #favorite-files-import': 'handleImport',
      'change #favorite-files-import-input': 'handleImportFile'
    };
  }

  /**
   * Load favorite files from database
   */
  async loadFiles(): Promise<void> {
    this.isLoading = true;
    this.render();

    try {
      this.files = await favoritesService.getAllFavoriteTorrentFiles({
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
        limit: 500
      });

      this.applyFilter();
      this.render();

      analytics.trackEvent('favorite_files_loaded', {
        count: this.files.length,
        sortBy: this.sortBy
      });
    } catch (error: any) {
      logger.error('Failed to load favorite files', error, undefined, 'favorites');
      this.files = [];
      this.filteredFiles = [];
      this.render();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply search filter to files
   */
  private applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFiles = [...this.files];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredFiles = this.files.filter(file =>
      file.fileName.toLowerCase().includes(query)
    );
  }

  /**
   * Render the view
   */
  template(): string {
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    if (this.isLoading) {
      return `
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 modal-overlay-safe">
          <div class="bg-gray-900 rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-center py-20">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span class="ml-4 text-gray-300">Loading favorites...</span>
            </div>
          </div>
        </div>
      `;
    }

    const isEmpty = this.filteredFiles.length === 0 && !this.searchQuery;
    const noResults = this.filteredFiles.length === 0 && this.searchQuery;
    const hasSelection = this.selectedIds.size > 0;

    return `
      <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 modal-overlay-safe">
        <div class="bg-gray-900 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
              </svg>
              <h2 class="text-2xl font-bold text-white">Favorite Files</h2>
              <span class="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">${this.files.length}</span>
            </div>
            <button id="favorite-files-close-btn" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Controls -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <!-- Search -->
            <div class="flex-1">
              <input
                type="text"
                id="favorite-files-search"
                placeholder="Search files..."
                value="${escapeHtml(this.searchQuery)}"
                class="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Sort Buttons -->
            <div class="flex gap-2">
              <button
                id="favorite-files-sort-name"
                class="px-4 py-2 rounded-lg border transition-colors ${
                  this.sortBy === 'name'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                  </svg>
                  Name
                </span>
              </button>
              <button
                id="favorite-files-sort-date"
                class="px-4 py-2 rounded-lg border transition-colors ${
                  this.sortBy === 'added_at'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Date
                </span>
              </button>
            </div>
          </div>

          <!-- Batch Actions -->
          ${hasSelection ? `
            <div class="flex items-center gap-4 mb-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
              <span class="text-blue-300">${this.selectedIds.size} selected</span>
              <button
                id="favorite-files-remove-selected"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Remove Selected
              </button>
            </div>
          ` : ''}

          <!-- Export/Import Actions -->
          <div class="flex gap-2 mb-4">
            <button
              id="favorite-files-export"
              class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export JSON
            </button>
            <button
              id="favorite-files-import"
              class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import JSON
            </button>
            <input type="file" id="favorite-files-import-input" accept=".json" class="hidden" />
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            ${isEmpty ? this.renderEmptyState() : ''}
            ${noResults ? this.renderNoResults() : ''}
            ${!isEmpty && !noResults ? this.renderFileGrid() : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): string {
    return `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="w-20 h-20 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">No Favorite Files Yet</h3>
        <p class="text-gray-500 max-w-md">
          Start adding your favorite video files from torrents to see them here.
          Click the heart icon on any video file to add it to favorites.
        </p>
      </div>
    `;
  }

  /**
   * Render no results state
   */
  private renderNoResults(): string {
    return `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">No Results Found</h3>
        <p class="text-gray-500">
          No files match "${this.searchQuery}"
        </p>
      </div>
    `;
  }

  /**
   * Render file grid
   */
  private renderFileGrid(): string {
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp);
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      if (days < 365) return `${Math.floor(days / 30)} months ago`;
      return date.toLocaleDateString();
    };

    return `
      <!-- Select All -->
      <div class="flex items-center gap-2 mb-4 p-2 bg-gray-800 rounded-lg">
        <input
          type="checkbox"
          id="favorite-files-select-all"
          ${this.selectedIds.size === this.filteredFiles.length && this.filteredFiles.length > 0 ? 'checked' : ''}
          class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label for="favorite-files-select-all" class="text-sm text-gray-300 cursor-pointer">
          Select All
        </label>
      </div>

      <!-- File Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${this.filteredFiles.map(file => `
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
            <!-- Checkbox -->
            <div class="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                class="favorite-file-checkbox w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 mt-1"
                data-id="${escapeHtml(file.id)}"
                ${this.selectedIds.has(file.id) ? 'checked' : ''}
              />
              <div class="flex-1 min-w-0">
                <!-- File Name -->
                <h3 class="text-white font-medium mb-1 line-clamp-2 break-all">
                  ${escapeHtml(file.fileName)}
                </h3>
                <!-- Metadata -->
                <div class="flex flex-col gap-1 text-xs text-gray-400">
                  <span title="${escapeHtml(file.torrentHash)}">
                    Hash: ${escapeHtml(file.torrentHash.substring(0, 16))}...
                  </span>
                  <span>File #${file.fileIndex}</span>
                  <span>${formatDate(file.addedAt)}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                class="favorite-file-play-btn flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                data-id="${escapeHtml(file.id)}"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                Play
              </button>
              <button
                class="favorite-file-remove-btn px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                data-id="${escapeHtml(file.id)}"
                title="Remove from favorites"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Event Handlers

  handleClose(e: Event): void {
    e.preventDefault();
    analytics.trackEvent('favorite_files_closed', undefined, 'favorites');
    if (this.callbacks.onClose) {
      this.callbacks.onClose();
    }
  }

  async handleSortByName(e: Event): Promise<void> {
    e.preventDefault();
    this.sortBy = 'name';
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    analytics.trackEvent('favorite_files_sorted', { sortBy: 'name', sortOrder: this.sortOrder }, 'favorites');
    await this.loadFiles();
  }

  async handleSortByDate(e: Event): Promise<void> {
    e.preventDefault();
    this.sortBy = 'added_at';
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    analytics.trackEvent('favorite_files_sorted', { sortBy: 'date', sortOrder: this.sortOrder }, 'favorites');
    await this.loadFiles();
  }

  handleSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilter();
    this.render();
    analytics.trackEvent('favorite_files_searched', { query: this.searchQuery }, 'favorites');
  }

  handlePlay(e: Event): void {
    e.preventDefault();
    const btn = e.currentTarget as HTMLButtonElement;
    const id = btn.dataset.id;
    const file = this.filteredFiles.find(f => f.id === id);

    if (file && this.callbacks.onPlay) {
      analytics.trackEvent('favorite_file_played', { fileName: file.fileName }, 'favorites');
      this.callbacks.onPlay(file);
    }
  }

  async handleRemoveSingle(e: Event): Promise<void> {
    e.preventDefault();
    const btn = e.currentTarget as HTMLButtonElement;
    const id = btn.dataset.id;
    const file = this.filteredFiles.find(f => f.id === id);

    if (!file) return;

    const confirmed = confirm(`Remove "${file.fileName}" from favorites?`);
    if (!confirmed) return;

    try {
      const [hash, index] = file.id.split(':');
      await favoritesService.removeFavoriteTorrentFile(hash, parseInt(index));

      analytics.trackEvent('favorite_file_removed', { fileName: file.fileName }, 'favorites');

      if (this.callbacks.onRemove) {
        this.callbacks.onRemove(file);
      }

      await this.loadFiles();
    } catch (error: any) {
      logger.error('Failed to remove favorite file', error, undefined, 'favorites');
      alert('Failed to remove file from favorites');
    }
  }

  handleCheckboxToggle(e: Event): void {
    const checkbox = e.target as HTMLInputElement;
    const id = checkbox.dataset.id;

    if (!id) return;

    if (checkbox.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }

    this.render();
  }

  handleSelectAll(e: Event): void {
    const checkbox = e.target as HTMLInputElement;

    if (checkbox.checked) {
      this.filteredFiles.forEach(file => this.selectedIds.add(file.id));
    } else {
      this.selectedIds.clear();
    }

    this.render();
  }

  async handleRemoveSelected(e: Event): Promise<void> {
    e.preventDefault();

    if (this.selectedIds.size === 0) return;

    const confirmed = confirm(`Remove ${this.selectedIds.size} files from favorites?`);
    if (!confirmed) return;

    try {
      const idsToRemove = Array.from(this.selectedIds);
      await favoritesService.removeFavoriteTorrentFilesBatch(idsToRemove);

      analytics.trackEvent('favorite_files_batch_removed', { count: idsToRemove.length }, 'favorites');

      this.selectedIds.clear();
      await this.loadFiles();
    } catch (error: any) {
      logger.error('Failed to remove favorite files in batch', error, undefined, 'favorites');
      alert('Failed to remove files from favorites');
    }
  }

  async handleExport(e: Event): Promise<void> {
    e.preventDefault();

    try {
      const data = await favoritesService.exportFavorites();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `favorites-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);

      analytics.trackEvent('favorites_exported', {
        moviesCount: data.movies.length,
        filesCount: data.files.length
      }, 'favorites');

      alert('Favorites exported successfully');
    } catch (error: any) {
      logger.error('Failed to export favorites', error, undefined, 'favorites');
      alert('Failed to export favorites');
    }
  }

  handleImport(e: Event): void {
    e.preventDefault();
    const input = document.getElementById('favorite-files-import-input') as HTMLInputElement;
    input?.click();
  }

  async handleImportFile(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const result = await favoritesService.importFavorites(data);

      analytics.trackEvent('favorites_imported', {
        moviesImported: result.moviesImported,
        filesImported: result.filesImported
      }, 'favorites');

      alert(`Imported ${result.moviesImported} movies and ${result.filesImported} files`);

      await this.loadFiles();
    } catch (error: any) {
      logger.error('Failed to import favorites', error, undefined, 'favorites');
      alert('Failed to import favorites. Please check the file format.');
    } finally {
      // Reset input
      input.value = '';
    }
  }
}

/**
 * Show favorite files modal
 */
export function showFavoriteFiles(
  container: HTMLElement,
  callbacks?: FavoriteFilesCallbacks
): FavoriteFilesView {
  // Create view
  const view = new FavoriteFilesView({ callbacks });

  // Append to container
  container.innerHTML = '<div id="favorite-files-container"></div>';

  // Render and load
  view.setElement('#favorite-files-container');
  view.render();
  view.loadFiles();

  analytics.trackEvent('favorite_files_opened', undefined, 'favorites');
  logger.info('Favorite files view opened', undefined, 'favorites');

  return view;
}
