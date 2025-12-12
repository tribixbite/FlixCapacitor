<script lang="ts">
  import { Card, Button } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { uiStore } from '$lib/stores/ui.store';

  const { impact } = useHaptics();

  // Placeholder collections
  let collections = $state([
    { id: '1', name: 'Action Movies', count: 12, poster: null },
    { id: '2', name: 'Sci-Fi Favorites', count: 8, poster: null },
    { id: '3', name: 'Watch Later', count: 25, poster: null }
  ]);

  async function handleCreateCollection() {
    await impact(ImpactStyle.Medium);
    uiStore.openSheet('create-collection');
  }

  function handleCollectionTap(collectionId: string) {
    // Navigate to collection detail
    uiStore.showToast('Collection detail coming soon', 'info');
  }
</script>

<svelte:head>
  <title>Collections - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  {#if collections.length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
      <span class="text-6xl mb-4">📚</span>
      <p class="text-lg font-medium mb-2">No Collections</p>
      <p class="text-sm text-center px-8 mb-6">
        Create collections to organize your favorite content
      </p>
      <Button rounded onClick={handleCreateCollection}>
        Create Collection
      </Button>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-4 px-4 py-4">
      {#each collections as collection (collection.id)}
        <button
          class="text-left"
          onclick={() => handleCollectionTap(collection.id)}
        >
          <Card class="!bg-zinc-900">
            <div class="aspect-video bg-zinc-800 rounded-t-lg flex items-center justify-center">
              {#if collection.poster}
                <img
                  src={collection.poster}
                  alt={collection.name}
                  class="w-full h-full object-cover rounded-t-lg"
                />
              {:else}
                <span class="text-4xl">📚</span>
              {/if}
            </div>
            <div class="p-3">
              <h3 class="font-medium text-white text-sm truncate">
                {collection.name}
              </h3>
              <p class="text-xs text-zinc-500">
                {collection.count} items
              </p>
            </div>
          </Card>
        </button>
      {/each}

      <!-- Add New Collection Card -->
      <button
        class="text-left"
        onclick={handleCreateCollection}
      >
        <Card class="!bg-zinc-900 !border !border-dashed !border-zinc-700">
          <div class="aspect-video flex items-center justify-center">
            <span class="text-4xl text-zinc-600">+</span>
          </div>
          <div class="p-3">
            <h3 class="font-medium text-zinc-500 text-sm">
              New Collection
            </h3>
          </div>
        </Card>
      </button>
    </div>
  {/if}
</div>
