<script lang="ts">
  import { Searchbar } from 'konsta/svelte';
  import { uiStore, searchQuery, isSearchOpen } from '$stores/ui.store';
  import { createEventDispatcher } from 'svelte';

  let {
    placeholder = 'Search movies, shows, anime...',
    autofocus = false
  } = $props<{
    placeholder?: string;
    autofocus?: boolean;
  }>();

  const dispatch = createEventDispatcher<{
    search: string;
    clear: void;
  }>();

  let inputValue = $state($searchQuery);
  let debounceTimer: number | null = null;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;

    // Debounce search
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      uiStore.setSearchQuery(inputValue);
      dispatch('search', inputValue);
    }, 300);
  }

  function handleClear() {
    inputValue = '';
    uiStore.setSearchQuery('');
    dispatch('clear');
  }

  function handleCancel() {
    handleClear();
    uiStore.toggleSearch();
  }

  // Sync with store changes
  $effect(() => {
    inputValue = $searchQuery;
  });
</script>

{#if $isSearchOpen}
  <div class="fixed inset-x-0 top-0 z-50 bg-black/95 backdrop-blur-xl safe-top px-4 py-2">
    <Searchbar
      value={inputValue}
      placeholder={placeholder}
      disableButton={true}
      disableButtonText="Cancel"
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
