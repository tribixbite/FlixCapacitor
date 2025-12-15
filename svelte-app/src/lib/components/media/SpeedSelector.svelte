<script lang="ts">
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';

  let {
    currentSpeed = 1,
    onSelect,
    onClose
  } = $props<{
    currentSpeed?: number;
    onSelect?: (speed: number) => void;
    onClose?: () => void;
  }>();

  const { impact } = useHaptics();

  // Available playback speeds
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Speed display labels
  function getSpeedLabel(speed: number): string {
    if (speed === 1) return 'Normal';
    return `${speed}x`;
  }

  function handleSelect(speed: number) {
    impact(ImpactStyle.Light);
    onSelect?.(speed);
    onClose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
  onclick={handleBackdropClick}
  onkeydown={(e) => { if (e.key === 'Escape') onClose?.(); }}
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label="Playback speed selector"
>
  <!-- Bottom Sheet -->
  <div class="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl overflow-hidden animate-slide-up">
    <!-- Handle -->
    <div class="flex justify-center py-3">
      <div class="w-10 h-1 bg-white/20 rounded-full"></div>
    </div>

    <!-- Header -->
    <div class="px-4 pb-3 border-b border-white/10">
      <h2 class="text-lg font-semibold text-white">Playback Speed</h2>
      <p class="text-sm text-white/60">Adjust video playback rate</p>
    </div>

    <!-- Speed Options -->
    <div class="max-h-[50vh] overflow-y-auto py-2">
      {#each speeds as speed}
        {@const isSelected = speed === currentSpeed}
        {@const isNormal = speed === 1}
        <button
          type="button"
          class="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors {isSelected ? 'bg-white/10' : ''}"
          onclick={() => handleSelect(speed)}
        >
          <!-- Speed Badge -->
          <span class="{isNormal ? 'bg-green-500' : speed < 1 ? 'bg-blue-500' : 'bg-orange-500'} text-white text-xs font-bold px-2 py-1 rounded min-w-[50px] text-center">
            {speed}x
          </span>

          <!-- Label -->
          <span class="flex-1 text-left text-white">
            {getSpeedLabel(speed)}
            {#if speed < 1}
              <span class="text-white/40 text-sm ml-2">Slower</span>
            {:else if speed > 1}
              <span class="text-white/40 text-sm ml-2">Faster</span>
            {/if}
          </span>

          <!-- Selected Indicator -->
          {#if isSelected}
            <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Cancel Button -->
    <div class="p-4 border-t border-white/10">
      <button
        type="button"
        class="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
        onclick={onClose}
      >
        Cancel
      </button>
    </div>
  </div>
</div>

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
