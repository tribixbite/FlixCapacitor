<script lang="ts" generics="T">
  import { onMount } from 'svelte';

  let {
    items,
    itemHeight,
    overscan = 3,
    containerClass = '',
    onLoadMore,
    children
  } = $props<{
    /** Array of items to render */
    items: T[];
    /** Height of each item in pixels */
    itemHeight: number;
    /** Number of extra items to render above/below viewport */
    overscan?: number;
    /** Additional CSS classes for container */
    containerClass?: string;
    /** Callback when scrolled near bottom (for infinite scroll) */
    onLoadMore?: () => void;
    /** Render function for each item */
    children: import('svelte').Snippet<[{ item: T; index: number; style: string }]>;
  }>();

  let container: HTMLDivElement;
  let scrollTop = $state(0);
  let viewportHeight = $state(0);

  // Calculate total content height
  const totalHeight = $derived(items.length * itemHeight);

  // Calculate visible range with overscan
  const startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));
  const endIndex = $derived(
    Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan)
  );

  // Get visible items
  const visibleItems = $derived(
    items.slice(startIndex, endIndex).map((item: T, i: number) => ({
      item,
      index: startIndex + i,
      style: `position: absolute; top: ${(startIndex + i) * itemHeight}px; height: ${itemHeight}px; left: 0; right: 0;`
    }))
  );

  // Check if near bottom for infinite scroll
  $effect(() => {
    if (onLoadMore && scrollTop + viewportHeight >= totalHeight - viewportHeight) {
      onLoadMore();
    }
  });

  function handleScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    scrollTop = target.scrollTop;
  }

  onMount(() => {
    if (!container) return;

    viewportHeight = container.clientHeight;

    // Watch for resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        viewportHeight = entry.contentRect.height;
      }
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  });
</script>

<div
  bind:this={container}
  class="virtual-list-container overflow-auto {containerClass}"
  onscroll={handleScroll}
>
  <div
    class="virtual-list-content relative"
    style="height: {totalHeight}px;"
  >
    {#each visibleItems as { item, index, style } (index)}
      {@render children({ item, index, style })}
    {/each}
  </div>
</div>

<style>
  .virtual-list-container {
    will-change: transform;
    contain: strict;
  }

  .virtual-list-content {
    contain: layout size;
  }
</style>
