<script lang="ts">
  /**
   * SkeletonRow - Loading placeholder for content rows
   * Matches ContentRow layout with animated skeleton cards
   */
  let {
    title = '',
    variant = 'poster',
    count = 5
  } = $props<{
    title?: string;
    variant?: 'poster' | 'landscape';
    count?: number;
  }>();

  // Dimension classes based on variant
  const cardClasses = variant === 'poster'
    ? 'w-28 aspect-[2/3]'
    : 'w-40 aspect-video';
</script>

<section class="mb-6">
  <div class="flex items-center justify-between px-4 mb-3">
    {#if title}
      <h2 class="text-lg font-semibold text-white">{title}</h2>
    {:else}
      <!-- Title skeleton -->
      <div class="h-5 bg-zinc-800 rounded w-32 animate-pulse"></div>
    {/if}
  </div>

  <div class="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
    {#each Array(count) as _, i (i)}
      <div class="flex-shrink-0 w-28 animate-pulse">
        <!-- Card skeleton -->
        <div class="{cardClasses} bg-zinc-800 rounded-lg mb-2"></div>
        <!-- Title skeleton -->
        <div class="h-3 bg-zinc-800 rounded w-3/4 mb-1"></div>
        <!-- Subtitle skeleton -->
        <div class="h-2 bg-zinc-800 rounded w-1/2"></div>
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

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .animate-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }
</style>
