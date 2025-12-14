<script lang="ts" generics="T extends { id: number }">
  import { Preloader } from 'konsta/svelte';
  import type { Snippet } from 'svelte';

  let {
    items,
    loading = false,
    columns = 3,
    gap = 3,
    onLoadMore,
    hasMore = false,
    emptyMessage = 'No content found',
    children
  } = $props<{
    items: T[];
    loading?: boolean;
    columns?: 2 | 3 | 4;
    gap?: 2 | 3 | 4;
    onLoadMore?: () => void;
    hasMore?: boolean;
    emptyMessage?: string;
    children: Snippet<[item: T, index: number]>;
  }>();

  let container: HTMLDivElement | null = null;
  let observer: IntersectionObserver | null = null;
  let sentinel: HTMLDivElement | null = null;

  // Column classes based on prop
  const colsMap: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };
  let gridCols = $derived(colsMap[columns]);

  const gapMap: Record<2 | 3 | 4, string> = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4'
  };
  let gapClass = $derived(gapMap[gap]);

  // Set up infinite scroll
  $effect(() => {
    if (!sentinel || !onLoadMore || !hasMore) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinel);

    return () => {
      observer?.disconnect();
    };
  });
</script>

<div bind:this={container} class="px-4">
  {#if items.length === 0 && !loading}
    <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
      <span class="text-4xl mb-4">📭</span>
      <p>{emptyMessage}</p>
    </div>
  {:else}
    <div class="grid {gridCols} {gapClass}">
      {#each items as item, index (item.id)}
        {@render children(item, index)}
      {/each}
    </div>

    {#if hasMore}
      <div bind:this={sentinel} class="flex justify-center py-8">
        {#if loading}
          <Preloader />
        {/if}
      </div>
    {/if}
  {/if}

  {#if loading && items.length === 0}
    <div class="flex justify-center py-20">
      <Preloader />
    </div>
  {/if}
</div>
