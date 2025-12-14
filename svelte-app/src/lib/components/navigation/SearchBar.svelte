<script lang="ts">
  import { Searchbar } from 'konsta/svelte';
  import { uiStore, searchQuery, isSearchOpen } from '$stores/ui.store';
  import { createEventDispatcher } from 'svelte';

  let {
    placeholder = 'Search movies, shows, anime...',
    autofocus = false,
    initialValue = '',
    inline = false,
    onSearch
  } = $props<{
    placeholder?: string;
    autofocus?: boolean;
    initialValue?: string;
    inline?: boolean;
    onSearch?: (query: string) => void;
  }>();

  const dispatch = createEventDispatcher<{
    search: string;
    clear: void;
  }>();

  // Track input value - initialized via effect to handle both modes
  let inputValue = $state('');
  let debounceTimer: number | null = null;
  let initialized = $state(false);

  // Initialize value based on mode (only once)
  $effect(() => {
    if (!initialized) {
      inputValue = inline ? initialValue : $searchQuery;
      initialized = true;
    }
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;

    // Debounce search
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      if (!inline) {
        uiStore.setSearchQuery(inputValue);
      }
      onSearch?.(inputValue);
      dispatch('search', inputValue);
    }, 300);
  }

  function handleClear() {
    inputValue = '';
    if (!inline) {
      uiStore.setSearchQuery('');
    }
    onSearch?.('');
    dispatch('clear');
  }

  function handleCancel() {
    handleClear();
    if (!inline) {
      uiStore.toggleSearch();
    }
  }

  // Sync with store changes for overlay mode (after initialization)
  $effect(() => {
    if (initialized && !inline) {
      inputValue = $searchQuery;
    }
  });
</script>

{#if inline}
  <!-- Inline mode: always visible -->
  <Searchbar
    value={inputValue}
    {placeholder}
    disableButton={true}
    onInput={handleInput}
    onClear={handleClear}
    class="!bg-zinc-900"
  />
{:else if $isSearchOpen}
  <!-- Overlay mode: shown when search is open -->
  <div class="fixed inset-x-0 top-0 z-50 bg-black/95 backdrop-blur-xl safe-top px-4 py-2">
    <Searchbar
      value={inputValue}
      {placeholder}
      disableButton={true}
      onInput={handleInput}
      onClear={handleClear}
      onDisable={handleCancel}
      class="!bg-zinc-900"
    />
  </div>
{/if}

<style>
  :global(.k-searchbar) {
    --k-searchbar-bg-ios: #1a1a1a;
    --k-searchbar-bg-material: #1a1a1a;
  }

  :global(.k-searchbar input) {
    color: white;
  }

  :global(.k-searchbar input::placeholder) {
    color: #666;
  }
</style>
