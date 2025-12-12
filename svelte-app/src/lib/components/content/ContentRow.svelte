<script lang="ts" generics="T extends { id: number }">
  import type { Snippet } from 'svelte';

  let {
    title,
    items,
    onSeeAll,
    children
  } = $props<{
    title: string;
    items: T[];
    onSeeAll?: () => void;
    children: Snippet<[item: T, index: number]>;
  }>();
</script>

<section class="mb-6">
  <div class="flex items-center justify-between px-4 mb-3">
    <h2 class="text-lg font-semibold text-white">{title}</h2>
    {#if onSeeAll}
      <button
        class="text-sm text-red-500 font-medium"
        onclick={onSeeAll}
      >
        See All
      </button>
    {/if}
  </div>

  <div class="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
    {#each items as item, index (item.id)}
      <div class="flex-shrink-0 w-28">
        {@render children(item, index)}
      </div>
    {/each}
  </div>
</section>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
