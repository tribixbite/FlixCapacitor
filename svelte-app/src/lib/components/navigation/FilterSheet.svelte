<script lang="ts">
  import { Sheet, BlockTitle, List, ListItem, Toggle, Chip, Button } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import type { Genre } from '$types';

  let {
    open = false,
    genres = [],
    selectedGenres = [],
    sortBy = 'popularity.desc',
    minRating = 0,
    yearFrom = 1900,
    yearTo = new Date().getFullYear(),
    onClose,
    onApply
  } = $props<{
    open?: boolean;
    genres?: Genre[];
    selectedGenres?: number[];
    sortBy?: string;
    minRating?: number;
    yearFrom?: number;
    yearTo?: number;
    onClose?: () => void;
    onApply?: (filters: FilterState) => void;
  }>();

  interface FilterState {
    genres: number[];
    sortBy: string;
    minRating: number;
    yearFrom: number;
    yearTo: number;
  }

  const { impact } = useHaptics();

  // Local filter state
  let localGenres = $state<number[]>([...selectedGenres]);
  let localSortBy = $state(sortBy);
  let localMinRating = $state(minRating);
  let localYearFrom = $state(yearFrom);
  let localYearTo = $state(yearTo);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'release_date.desc', label: 'Newest First' },
    { value: 'release_date.asc', label: 'Oldest First' },
    { value: 'title.asc', label: 'A-Z' }
  ];

  function toggleGenre(genreId: number) {
    impact(ImpactStyle.Light);
    if (localGenres.includes(genreId)) {
      localGenres = localGenres.filter(g => g !== genreId);
    } else {
      localGenres = [...localGenres, genreId];
    }
  }

  function handleApply() {
    impact(ImpactStyle.Medium);
    onApply?.({
      genres: localGenres,
      sortBy: localSortBy,
      minRating: localMinRating,
      yearFrom: localYearFrom,
      yearTo: localYearTo
    });
    onClose?.();
  }

  function handleReset() {
    impact(ImpactStyle.Light);
    localGenres = [];
    localSortBy = 'popularity.desc';
    localMinRating = 0;
    localYearFrom = 1900;
    localYearTo = new Date().getFullYear();
  }

  // Sync props to local state when sheet opens
  $effect(() => {
    if (open) {
      localGenres = [...selectedGenres];
      localSortBy = sortBy;
      localMinRating = minRating;
      localYearFrom = yearFrom;
      localYearTo = yearTo;
    }
  });
</script>

<Sheet
  opened={open}
  onBackdropClick={onClose}
  class="!bg-zinc-900 !max-h-[85vh]"
>
  <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
    <Button clear onClick={handleReset}>Reset</Button>
    <span class="font-semibold text-white">Filters</span>
    <Button onClick={handleApply}>Apply</Button>
  </div>

  <div class="overflow-y-auto pb-safe">
    <!-- Sort By -->
    <BlockTitle>Sort By</BlockTitle>
    <List strongIos inset>
      {#each sortOptions as option}
        <ListItem
          title={option.label}
          onClick={() => { localSortBy = option.value; impact(ImpactStyle.Light); }}
          after={localSortBy === option.value ? '✓' : ''}
        />
      {/each}
    </List>

    <!-- Genres -->
    {#if genres.length > 0}
      <BlockTitle>Genres</BlockTitle>
      <div class="px-4 pb-4 flex flex-wrap gap-2">
        {#each genres as genre}
          <Chip
            class={localGenres.includes(genre.id)
              ? '!bg-red-600 !text-white'
              : '!bg-zinc-800 !text-zinc-300'}
            onClick={() => toggleGenre(genre.id)}
          >
            {genre.name}
          </Chip>
        {/each}
      </div>
    {/if}

    <!-- Minimum Rating -->
    <BlockTitle>Minimum Rating</BlockTitle>
    <div class="px-4 pb-4">
      <input
        type="range"
        min="0"
        max="10"
        step="0.5"
        bind:value={localMinRating}
        class="w-full accent-red-600"
      />
      <div class="flex justify-between text-sm text-zinc-400 mt-1">
        <span>Any</span>
        <span>{localMinRating > 0 ? `${localMinRating}+` : 'Any'}</span>
        <span>10</span>
      </div>
    </div>

    <!-- Year Range -->
    <BlockTitle>Year Range</BlockTitle>
    <div class="px-4 pb-4 flex gap-4">
      <div class="flex-1">
        <label class="text-xs text-zinc-400">From</label>
        <input
          type="number"
          min="1900"
          max={localYearTo}
          bind:value={localYearFrom}
          class="w-full bg-zinc-800 rounded px-3 py-2 text-white"
        />
      </div>
      <div class="flex-1">
        <label class="text-xs text-zinc-400">To</label>
        <input
          type="number"
          min={localYearFrom}
          max={new Date().getFullYear()}
          bind:value={localYearTo}
          class="w-full bg-zinc-800 rounded px-3 py-2 text-white"
        />
      </div>
    </div>
  </div>
</Sheet>
