<script lang="ts">
  /**
   * GenreChips - Horizontal scrollable genre quick-select
   * Provides quick genre filtering without opening the full filter sheet
   */
  import { Chip } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import type { Genre } from '$types';

  let {
    genres = [],
    selectedGenres = [],
    onSelect,
    showAll = true
  } = $props<{
    genres?: Genre[];
    selectedGenres?: number[];
    onSelect?: (genreIds: number[]) => void;
    showAll?: boolean;
  }>();

  const { impact } = useHaptics();

  function toggleGenre(genreId: number) {
    impact(ImpactStyle.Light);

    let newSelection: number[];
    if (selectedGenres.includes(genreId)) {
      newSelection = selectedGenres.filter(g => g !== genreId);
    } else {
      newSelection = [...selectedGenres, genreId];
    }

    onSelect?.(newSelection);
  }

  function clearAll() {
    impact(ImpactStyle.Light);
    onSelect?.([]);
  }

  // Show active count badge
  let activeCount = $derived(selectedGenres.length);
</script>

<div class="genre-chips-container overflow-x-auto scrollbar-hide">
  <div class="flex gap-2 px-4 py-2 min-w-max">
    <!-- All/Clear chip -->
    {#if showAll}
      <Chip
        class={activeCount === 0
          ? '!bg-red-600 !text-white whitespace-nowrap'
          : '!bg-zinc-800 !text-zinc-300 whitespace-nowrap'}
        onClick={clearAll}
      >
        All
      </Chip>
    {/if}

    <!-- Genre chips -->
    {#each genres as genre}
      <Chip
        class={selectedGenres.includes(genre.id)
          ? '!bg-red-600 !text-white whitespace-nowrap'
          : '!bg-zinc-800 !text-zinc-300 whitespace-nowrap'}
        onClick={() => toggleGenre(genre.id)}
      >
        {genre.name}
      </Chip>
    {/each}
  </div>
</div>

<style>
  .genre-chips-container {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .genre-chips-container::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
