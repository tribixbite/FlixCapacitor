<script lang="ts">
  /**
   * SkeletonCard - Placeholder skeleton for loading states
   * Shows animated pulse effect while content loads
   */
  let {
    variant = 'poster',
    count = 1
  } = $props<{
    variant?: 'poster' | 'landscape' | 'continue';
    count?: number;
  }>();

  // Dimension classes based on variant
  type VariantType = 'poster' | 'landscape' | 'continue';
  const variantClasses: Record<VariantType, string> = {
    poster: 'w-28 aspect-[2/3]',
    landscape: 'w-40 aspect-video',
    continue: 'w-40 aspect-video'
  };
</script>

{#each Array(count) as _, i (i)}
  <div class="flex-shrink-0 animate-pulse">
    <!-- Card skeleton -->
    <div class="{variantClasses[variant]} bg-zinc-800 rounded-lg mb-2"></div>

    {#if variant === 'poster' || variant === 'landscape'}
      <!-- Title skeleton -->
      <div class="h-3 bg-zinc-800 rounded w-3/4 mb-1"></div>
      <!-- Subtitle skeleton -->
      <div class="h-2 bg-zinc-800 rounded w-1/2"></div>
    {:else if variant === 'continue'}
      <!-- Progress bar skeleton -->
      <div class="h-1 bg-zinc-800 rounded-full w-full mt-1"></div>
      <!-- Title skeleton -->
      <div class="h-3 bg-zinc-800 rounded w-3/4 mt-2"></div>
    {/if}
  </div>
{/each}

<style>
  /* Smooth pulse animation */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }
</style>
