<script lang="ts">
  import { openSubtitlesService, type SubtitleResult } from '$services';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { uiStore } from '$stores/ui.store';

  let {
    imdbId = '',
    title = '',
    season,
    episode,
    currentSubtitle = '',
    onSelect,
    onClose
  } = $props<{
    imdbId?: string;
    title?: string;
    season?: number;
    episode?: number;
    currentSubtitle?: string;
    onSelect?: (subtitle: SubtitleResult | null) => void;
    onClose?: () => void;
  }>();

  const { impact } = useHaptics();

  let subtitles = $state<SubtitleResult[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let selectedLanguage = $state('en');

  // Common subtitle languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ];

  // Search subtitles when component mounts or language changes
  $effect(() => {
    searchSubtitles();
  });

  async function searchSubtitles() {
    isLoading = true;
    error = '';

    try {
      const results = await openSubtitlesService.searchSubtitles({
        imdbId,
        query: title,
        season,
        episode,
        language: selectedLanguage
      });

      subtitles = results;

      if (results.length === 0) {
        error = `No ${getLanguageName(selectedLanguage)} subtitles found`;
      }
    } catch (e) {
      console.error('Subtitle search error:', e);
      error = 'Failed to search subtitles';
    } finally {
      isLoading = false;
    }
  }

  function getLanguageName(code: string): string {
    return languages.find(l => l.code === code)?.name || code;
  }

  function handleSelect(subtitle: SubtitleResult) {
    impact(ImpactStyle.Light);
    onSelect?.(subtitle);
    onClose?.();
  }

  function handleDisable() {
    impact(ImpactStyle.Light);
    onSelect?.(null);
    onClose?.();
  }

  function handleLanguageChange(e: Event) {
    selectedLanguage = (e.target as HTMLSelectElement).value;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }

  function formatDownloads(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
  onclick={handleBackdropClick}
  onkeydown={() => {}}
  role="dialog"
  aria-modal="true"
  aria-label="Subtitle selector"
>
  <!-- Bottom Sheet -->
  <div class="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
    <!-- Handle -->
    <div class="flex justify-center py-3 flex-shrink-0">
      <div class="w-10 h-1 bg-white/20 rounded-full"></div>
    </div>

    <!-- Header -->
    <div class="px-4 pb-3 border-b border-white/10 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Subtitles</h2>
          <p class="text-sm text-white/60">Select subtitle track</p>
        </div>

        <!-- Language Selector -->
        <select
          class="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-red-500"
          value={selectedLanguage}
          onchange={handleLanguageChange}
        >
          {#each languages as lang}
            <option value={lang.code} class="bg-zinc-800">{lang.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Subtitle List -->
    <div class="flex-1 overflow-y-auto">
      {#if isLoading}
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full"></div>
        </div>
      {:else if error}
        <div class="px-4 py-8 text-center">
          <svg class="w-12 h-12 text-white/20 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-white/60">{error}</p>
          <button
            type="button"
            class="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
            onclick={searchSubtitles}
          >
            Try Again
          </button>
        </div>
      {:else}
        <!-- Disable Option -->
        <button
          type="button"
          class="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 {currentSubtitle === '' ? 'bg-white/10' : ''}"
          onclick={handleDisable}
        >
          <svg class="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          <span class="flex-1 text-left text-white">Off</span>
          {#if currentSubtitle === ''}
            <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          {/if}
        </button>

        <!-- Subtitle Options -->
        {#each subtitles as subtitle}
          {@const isSelected = subtitle.url === currentSubtitle}
          <button
            type="button"
            class="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors {isSelected ? 'bg-white/10' : ''}"
            onclick={() => handleSelect(subtitle)}
          >
            <svg class="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z"/>
            </svg>

            <div class="flex-1 min-w-0 text-left">
              <p class="text-white text-sm truncate">{subtitle.release || subtitle.filename}</p>
              <div class="flex items-center gap-2 mt-1 text-xs text-white/40">
                {#if subtitle.downloads}
                  <span>{formatDownloads(subtitle.downloads)} downloads</span>
                {/if}
                {#if subtitle.fps}
                  <span>{subtitle.fps} fps</span>
                {/if}
                {#if subtitle.hearingImpaired}
                  <span class="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">HI</span>
                {/if}
              </div>
            </div>

            {#if isSelected}
              <svg class="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            {/if}
          </button>
        {/each}
      {/if}
    </div>

    <!-- Cancel Button -->
    <div class="p-4 border-t border-white/10 flex-shrink-0">
      <button
        type="button"
        class="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
        onclick={onClose}
      >
        Cancel
      </button>
    </div>
  </div>
</div>

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
