/**
 * CollectionFormView - Modal form for creating/editing collections
 * Phase 13: Torrent Collections Feature
 */

import { View, type ViewOptions } from 'backbone.marionette';
import type { Collection } from '../lib/collections-service';
import { analytics } from '../lib/analytics';

/**
 * Form data interface for collection creation/editing
 */
export interface CollectionFormData {
  name: string;
  description?: string;
  cover_image_url?: string;
}

interface CollectionFormViewOptions extends ViewOptions<any> {
  mode: 'create' | 'edit';
  existingCollection?: Collection;
  onSave?: (data: CollectionFormData) => void;
  onCancel?: () => void;
}

/**
 * Modal form view for creating and editing collections
 * Provides validation and callbacks for save/cancel actions
 */
export class CollectionFormView extends View<any> {
  private mode: 'create' | 'edit';
  private existingCollection?: Collection;
  private formData: CollectionFormData;
  private onSaveCallback?: (data: CollectionFormData) => void;
  private onCancelCallback?: () => void;
  private errors: Record<string, string> = {};

  /**
   * Create a new collection form modal
   * @param options.mode - 'create' for new collection, 'edit' for existing
   * @param options.existingCollection - Existing collection data (edit mode only)
   * @param options.onSave - Callback when form is saved successfully
   * @param options.onCancel - Callback when form is cancelled
   */
  constructor(options: CollectionFormViewOptions) {
    super({ el: document.body } as any);

    this.mode = options.mode;
    this.existingCollection = options.existingCollection;
    this.onSaveCallback = options.onSave;
    this.onCancelCallback = options.onCancel;

    // Initialize form data from existing collection or empty
    this.formData = {
      name: options.existingCollection?.name || '',
      description: options.existingCollection?.description || '',
      cover_image_url: options.existingCollection?.cover_image_url || ''
    };

    this.render();
    this.attachEventListeners();

    // Focus on name input after render
    setTimeout(() => {
      const nameInput = (this as any).el?.querySelector('#collection-name-input') as HTMLInputElement;
      if (nameInput) nameInput.focus();
    }, 100);

    analytics.trackEvent('collection_form_opened', { mode: this.mode });
  }

  /**
   * Render the modal form template
   */
  template(): string {
    const title = this.mode === 'create' ? 'Create Collection' : 'Edit Collection';
    const submitText = this.mode === 'create' ? 'Create' : 'Save Changes';

    return `
      <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm collection-form-modal">
        <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-md w-full mx-4">

          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 class="text-2xl font-bold text-white">${this.escapeHtml(title)}</h2>
            <button
              class="text-gray-400 hover:text-white transition-colors collection-form-close"
              aria-label="Close"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form class="p-6 space-y-5 collection-form" id="collection-form">

            <!-- Name Field (Required) -->
            <div>
              <label for="collection-name-input" class="block text-sm font-medium text-gray-300 mb-2">
                Collection Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="collection-name-input"
                name="name"
                value="${this.escapeHtml(this.formData.name)}"
                placeholder="e.g., Marvel Movies, Breaking Bad Complete"
                class="w-full px-4 py-2.5 bg-gray-800 border ${this.errors.name ? 'border-red-500' : 'border-gray-600'}
                       rounded-lg text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
                required
                maxlength="100"
              />
              ${this.errors.name ? `
                <p class="mt-1.5 text-sm text-red-500">
                  ${this.escapeHtml(this.errors.name)}
                </p>
              ` : ''}
            </div>

            <!-- Description Field (Optional) -->
            <div>
              <label for="collection-description-input" class="block text-sm font-medium text-gray-300 mb-2">
                Description <span class="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                id="collection-description-input"
                name="description"
                rows="3"
                placeholder="Brief description of this collection..."
                class="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white
                       placeholder-gray-500 resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
                maxlength="500"
              >${this.escapeHtml(this.formData.description || '')}</textarea>
              <p class="mt-1.5 text-xs text-gray-500">
                ${(this.formData.description || '').length}/500 characters
              </p>
            </div>

            <!-- Cover Image URL Field (Optional) -->
            <div>
              <label for="collection-cover-input" class="block text-sm font-medium text-gray-300 mb-2">
                Cover Image URL <span class="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="url"
                id="collection-cover-input"
                name="cover_image_url"
                value="${this.escapeHtml(this.formData.cover_image_url || '')}"
                placeholder="https://example.com/image.jpg"
                class="w-full px-4 py-2.5 bg-gray-800 border ${this.errors.cover_image_url ? 'border-red-500' : 'border-gray-600'}
                       rounded-lg text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
              />
              ${this.errors.cover_image_url ? `
                <p class="mt-1.5 text-sm text-red-500">
                  ${this.escapeHtml(this.errors.cover_image_url)}
                </p>
              ` : ''}
              ${this.formData.cover_image_url ? `
                <div class="mt-3">
                  <p class="text-xs text-gray-500 mb-2">Preview:</p>
                  <img
                    src="${this.escapeHtml(this.formData.cover_image_url)}"
                    alt="Cover preview"
                    class="w-24 h-24 object-cover rounded border border-gray-600"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'%3E%3Cpath fill=\\'%23666\\' d=\\'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z\\'/%3E%3C/svg%3E'"
                  />
                </div>
              ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                class="px-5 py-2.5 text-gray-300 hover:text-white font-medium rounded-lg
                       border border-gray-600 hover:border-gray-500
                       transition-colors collection-form-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                       transition-colors shadow-lg shadow-blue-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ${this.escapeHtml(submitText)}
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for form interactions
   */
  private attachEventListeners(): void {
    const el = (this as any).el;

    // Form submission
    const form = el?.querySelector('#collection-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Cancel button
    const cancelBtn = el?.querySelector('.collection-form-cancel');
    cancelBtn?.addEventListener('click', () => this.handleCancel());

    // Close button
    const closeBtn = el?.querySelector('.collection-form-close');
    closeBtn?.addEventListener('click', () => this.handleCancel());

    // Backdrop click to close
    const modal = el?.querySelector('.collection-form-modal');
    modal?.addEventListener('click', (e: any) => {
      if (e.target === modal) {
        this.handleCancel();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', this.handleEscKey.bind(this));

    // Real-time character count update for description
    const descInput = el?.querySelector('#collection-description-input') as HTMLTextAreaElement;
    descInput?.addEventListener('input', () => {
      const charCount = descInput.value.length;
      const charCountEl = el?.querySelector('.text-xs.text-gray-500');
      if (charCountEl) {
        charCountEl.textContent = `${charCount}/500 characters`;
      }
    });

    // Real-time image preview update
    const coverInput = el?.querySelector('#collection-cover-input') as HTMLInputElement;
    coverInput?.addEventListener('input', () => {
      this.formData.cover_image_url = coverInput.value.trim();
      this.render();
    });
  }

  /**
   * Handle ESC key press to close modal
   */
  private handleEscKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.handleCancel();
    }
  }

  /**
   * Validate form data
   * @returns true if valid, false otherwise
   */
  private validate(): boolean {
    this.errors = {};

    // Name is required
    if (!this.formData.name.trim()) {
      this.errors.name = 'Collection name is required';
    }

    // Name max length
    if (this.formData.name.trim().length > 100) {
      this.errors.name = 'Collection name must be 100 characters or less';
    }

    // Description max length
    if (this.formData.description && this.formData.description.length > 500) {
      this.errors.description = 'Description must be 500 characters or less';
    }

    // Cover image URL validation (basic)
    if (this.formData.cover_image_url && this.formData.cover_image_url.trim()) {
      const urlPattern = /^https?:\/\/.+\..+/i;
      if (!urlPattern.test(this.formData.cover_image_url.trim())) {
        this.errors.cover_image_url = 'Please enter a valid URL (http:// or https://)';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    // Get form values
    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);

    this.formData = {
      name: (formData.get('name') as string).trim(),
      description: (formData.get('description') as string).trim() || undefined,
      cover_image_url: (formData.get('cover_image_url') as string).trim() || undefined
    };

    // Validate
    if (!this.validate()) {
      this.render();
      analytics.trackEvent('collection_form_validation_failed', { errors: Object.keys(this.errors) });
      return;
    }

    // Call onSave callback
    if (this.onSaveCallback) {
      this.onSaveCallback(this.formData);
    }

    analytics.trackEvent('collection_form_submitted', {
      mode: this.mode,
      has_description: !!this.formData.description,
      has_cover_image: !!this.formData.cover_image_url
    });

    // Close modal
    this.close();
  }

  /**
   * Handle cancel/close actions
   */
  private handleCancel(): void {
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }

    analytics.trackEvent('collection_form_cancelled', { mode: this.mode });
    this.close();
  }

  /**
   * Close and cleanup modal
   */
  private close(): void {
    // Remove ESC key listener
    document.removeEventListener('keydown', this.handleEscKey);

    // Remove from DOM
    const el = (this as any).el;
    const modal = el?.querySelector('.collection-form-modal');
    modal?.remove();

    (this as any).remove();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
