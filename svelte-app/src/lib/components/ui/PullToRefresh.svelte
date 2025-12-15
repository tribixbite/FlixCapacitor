<script lang="ts">
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';

  let {
    onRefresh,
    disabled = false,
    children
  } = $props<{
    onRefresh?: () => Promise<void>;
    disabled?: boolean;
    children: any;
  }>();

  const { impact } = useHaptics();

  // Pull state
  let containerEl: HTMLDivElement;
  let pullDistance = $state(0);
  let isRefreshing = $state(false);
  let isPulling = $state(false);
  let startY = 0;

  // Threshold to trigger refresh (in pixels)
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  // Only allow pull when scrolled to top
  function isAtTop(): boolean {
    if (!containerEl) return false;
    return containerEl.scrollTop <= 0;
  }

  function handleTouchStart(e: TouchEvent) {
    if (disabled || isRefreshing) return;
    if (!isAtTop()) return;

    startY = e.touches[0]?.clientY ?? 0;
    isPulling = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isPulling || disabled || isRefreshing) return;
    if (!isAtTop()) {
      pullDistance = 0;
      return;
    }

    const currentY = e.touches[0]?.clientY ?? 0;
    const diff = currentY - startY;

    if (diff > 0) {
      // Apply resistance as user pulls further
      pullDistance = Math.min(MAX_PULL, diff * 0.5);

      // Haptic feedback when crossing threshold
      if (pullDistance >= PULL_THRESHOLD && pullDistance - (diff * 0.5 - diff * 0.5) < PULL_THRESHOLD) {
        impact(ImpactStyle.Light);
      }
    }
  }

  async function handleTouchEnd() {
    if (!isPulling || disabled) return;
    isPulling = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      isRefreshing = true;
      pullDistance = 60; // Keep indicator visible during refresh
      impact(ImpactStyle.Medium);

      try {
        await onRefresh?.();
      } finally {
        isRefreshing = false;
        pullDistance = 0;
      }
    } else {
      pullDistance = 0;
    }
  }

  // Derived states for UI
  let pullProgress = $derived(Math.min(1, pullDistance / PULL_THRESHOLD));
  let showIndicator = $derived(pullDistance > 10 || isRefreshing);
</script>

<div
  bind:this={containerEl}
  class="pull-to-refresh-container relative overflow-y-auto h-full"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
>
  <!-- Pull indicator -->
  {#if showIndicator}
    <div
      class="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-transform"
      style="top: {Math.max(0, pullDistance - 50)}px; opacity: {pullProgress}"
    >
      <div
        class="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg"
      >
        {#if isRefreshing}
          <!-- Spinning loader -->
          <svg class="w-5 h-5 text-red-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          <!-- Arrow that rotates as user pulls -->
          <svg
            class="w-5 h-5 text-white transition-transform"
            style="transform: rotate({pullProgress * 180}deg)"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Content with pull offset -->
  <div
    class="transition-transform duration-150"
    style="transform: translateY({pullDistance}px)"
  >
    {@render children()}
  </div>
</div>

<style>
  .pull-to-refresh-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }
</style>
