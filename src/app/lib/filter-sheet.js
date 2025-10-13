/**
 * Filter Bottom Sheet Component
 * Mobile-native bottom sheet for filtering and sorting content
 */

(function () {
    'use strict';

    class FilterSheet {
        constructor(options = {}) {
            this.options = {
                genres: options.genres || [
                    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
                    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
                    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western'
                ],
                sortOptions: options.sortOptions || [
                    { value: 'popular', label: 'Popular' },
                    { value: 'trending', label: 'Trending' },
                    { value: 'rating', label: 'Top Rated' },
                    { value: 'recent', label: 'Recently Added' },
                    { value: 'title', label: 'Title (A-Z)' },
                    { value: 'year', label: 'Release Year' }
                ],
                qualityOptions: options.qualityOptions || [
                    '4K', '1080p', '720p', '480p'
                ],
                yearRange: options.yearRange || {
                    min: 1950,
                    max: new Date().getFullYear()
                },
                onApply: options.onApply || (() => {}),
                initialFilters: options.initialFilters || {
                    genres: [],
                    sort: 'popular',
                    quality: [],
                    yearMin: null,
                    yearMax: null
                }
            };

            this.filters = { ...this.options.initialFilters };
            this.overlay = null;
            this.sheet = null;
        }

        show() {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'filter-sheet-overlay';

            // Create sheet
            this.sheet = document.createElement('div');
            this.sheet.className = 'filter-sheet';

            this.sheet.innerHTML = `
                <div class="filter-sheet-handle"></div>

                <div class="filter-sheet-header">
                    <h2 class="filter-sheet-title">Filter & Sort</h2>
                    <button class="filter-sheet-close" id="filter-close">✕</button>
                </div>

                <div class="filter-sheet-content">
                    <!-- Sort Section -->
                    <div class="filter-section">
                        <h3 class="filter-section-title">Sort By</h3>
                        <div class="filter-options">
                            ${this.options.sortOptions.map(option => `
                                <button class="filter-option ${this.filters.sort === option.value ? 'active' : ''}"
                                        data-type="sort"
                                        data-value="${option.value}">
                                    ${option.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Genre Section -->
                    <div class="filter-section">
                        <h3 class="filter-section-title">Genres</h3>
                        <div class="filter-chips">
                            ${this.options.genres.map(genre => `
                                <button class="filter-chip ${this.filters.genres.includes(genre) ? 'active' : ''}"
                                        data-type="genre"
                                        data-value="${genre}">
                                    ${genre}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Quality Section -->
                    <div class="filter-section">
                        <h3 class="filter-section-title">Quality</h3>
                        <div class="filter-chips">
                            ${this.options.qualityOptions.map(quality => `
                                <button class="filter-chip ${this.filters.quality.includes(quality) ? 'active' : ''}"
                                        data-type="quality"
                                        data-value="${quality}">
                                    ${quality}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Year Range Section -->
                    <div class="filter-section">
                        <h3 class="filter-section-title">Release Year</h3>
                        <div class="filter-year-inputs">
                            <input type="number"
                                   class="filter-year-input"
                                   id="year-min"
                                   placeholder="From"
                                   min="${this.options.yearRange.min}"
                                   max="${this.options.yearRange.max}"
                                   value="${this.filters.yearMin || ''}">
                            <span class="filter-year-separator">to</span>
                            <input type="number"
                                   class="filter-year-input"
                                   id="year-max"
                                   placeholder="To"
                                   min="${this.options.yearRange.min}"
                                   max="${this.options.yearRange.max}"
                                   value="${this.filters.yearMax || ''}">
                        </div>
                    </div>
                </div>

                <div class="filter-sheet-footer">
                    <button class="filter-button filter-button-secondary" id="filter-reset">
                        Reset All
                    </button>
                    <button class="filter-button filter-button-primary" id="filter-apply">
                        Apply Filters
                    </button>
                </div>
            `;

            this.overlay.appendChild(this.sheet);
            document.body.appendChild(this.overlay);

            // Add styles
            this.addStyles();

            // Attach event listeners
            this.attachListeners();

            // Animate in
            requestAnimationFrame(() => {
                this.overlay.classList.add('visible');
                this.sheet.classList.add('visible');
            });
        }

        addStyles() {
            if (document.getElementById('filter-sheet-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'filter-sheet-styles';
            style.textContent = `
                .filter-sheet-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 3000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .filter-sheet-overlay.visible {
                    opacity: 1;
                }

                .filter-sheet {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    max-height: 85vh;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    padding-bottom: calc(var(--safe-area-bottom) + 1rem);
                }

                .filter-sheet.visible {
                    transform: translateY(0);
                }

                .filter-sheet-handle {
                    width: 40px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 2px;
                    margin: 12px auto 8px;
                }

                .filter-sheet-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .filter-sheet-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                }

                .filter-sheet-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 1.25rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .filter-sheet-close:active {
                    background: rgba(255, 255, 255, 0.1);
                }

                .filter-sheet-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    -webkit-overflow-scrolling: touch;
                }

                .filter-section {
                    margin-bottom: 2rem;
                }

                .filter-section-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.75rem;
                }

                .filter-options {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .filter-option {
                    padding: 0.875rem;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                }

                .filter-option:active {
                    transform: scale(0.98);
                }

                .filter-option.active {
                    background: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: white;
                }

                .filter-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .filter-chip {
                    padding: 0.5rem 1rem;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-chip:active {
                    transform: scale(0.95);
                }

                .filter-chip.active {
                    background: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: white;
                }

                .filter-year-inputs {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .filter-year-input {
                    flex: 1;
                    padding: 0.875rem;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .filter-year-input:focus {
                    border-color: var(--accent-primary);
                }

                .filter-year-separator {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .filter-sheet-footer {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem 0;
                    border-top: 1px solid var(--border-color);
                }

                .filter-button {
                    flex: 1;
                    padding: 1rem;
                    border: none;
                    border-radius: var(--radius-md);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-button:active {
                    transform: scale(0.98);
                }

                .filter-button-secondary {
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .filter-button-primary {
                    background: var(--accent-primary);
                    color: white;
                }
            `;

            document.head.appendChild(style);
        }

        attachListeners() {
            // Close button
            this.sheet.querySelector('#filter-close').addEventListener('click', () => {
                this.hide();
            });

            // Close on overlay click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });

            // Sort options
            this.sheet.querySelectorAll('[data-type="sort"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Deactivate all
                    this.sheet.querySelectorAll('[data-type="sort"]').forEach(b => b.classList.remove('active'));
                    // Activate clicked
                    btn.classList.add('active');
                    this.filters.sort = btn.dataset.value;
                });
            });

            // Genre chips
            this.sheet.querySelectorAll('[data-type="genre"]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const genre = chip.dataset.value;
                    if (this.filters.genres.includes(genre)) {
                        this.filters.genres = this.filters.genres.filter(g => g !== genre);
                        chip.classList.remove('active');
                    } else {
                        this.filters.genres.push(genre);
                        chip.classList.add('active');
                    }
                });
            });

            // Quality chips
            this.sheet.querySelectorAll('[data-type="quality"]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const quality = chip.dataset.value;
                    if (this.filters.quality.includes(quality)) {
                        this.filters.quality = this.filters.quality.filter(q => q !== quality);
                        chip.classList.remove('active');
                    } else {
                        this.filters.quality.push(quality);
                        chip.classList.add('active');
                    }
                });
            });

            // Year inputs
            const yearMin = this.sheet.querySelector('#year-min');
            const yearMax = this.sheet.querySelector('#year-max');

            yearMin.addEventListener('input', () => {
                this.filters.yearMin = yearMin.value ? parseInt(yearMin.value) : null;
            });

            yearMax.addEventListener('input', () => {
                this.filters.yearMax = yearMax.value ? parseInt(yearMax.value) : null;
            });

            // Reset button
            this.sheet.querySelector('#filter-reset').addEventListener('click', () => {
                this.resetFilters();
            });

            // Apply button
            this.sheet.querySelector('#filter-apply').addEventListener('click', () => {
                this.options.onApply(this.filters);
                this.hide();
            });

            // Swipe down to close
            let startY = 0;
            const handle = this.sheet.querySelector('.filter-sheet-handle');

            handle.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            }, { passive: true });

            handle.addEventListener('touchmove', (e) => {
                const deltaY = e.touches[0].clientY - startY;
                if (deltaY > 0) {
                    this.sheet.style.transform = `translateY(${deltaY}px)`;
                }
            }, { passive: true });

            handle.addEventListener('touchend', (e) => {
                const deltaY = e.changedTouches[0].clientY - startY;
                if (deltaY > 100) {
                    this.hide();
                } else {
                    this.sheet.style.transform = '';
                }
            });
        }

        resetFilters() {
            this.filters = {
                genres: [],
                sort: 'popular',
                quality: [],
                yearMin: null,
                yearMax: null
            };

            // Reset UI
            this.sheet.querySelectorAll('.filter-option').forEach(opt => {
                opt.classList.remove('active');
                if (opt.dataset.value === 'popular') {
                    opt.classList.add('active');
                }
            });

            this.sheet.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
            });

            this.sheet.querySelector('#year-min').value = '';
            this.sheet.querySelector('#year-max').value = '';
        }

        hide() {
            this.overlay.classList.remove('visible');
            this.sheet.classList.remove('visible');

            setTimeout(() => {
                this.overlay.remove();
            }, 300);
        }
    }

    // Export to global scope
    window.FilterSheet = FilterSheet;

})();
