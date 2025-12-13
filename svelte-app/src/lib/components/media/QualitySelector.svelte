<script lang="ts">
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';

  let {
    qualities = [],
    currentQuality = '',
    onSelect,
    onClose
  } = $props<{
    qualities?: string[];
    currentQuality?: string;
    onSelect?: (quality: string) => void;
    onClose?: () => void;
  }>();

  const { impact } = useHaptics();

  // Quality display labels and icons
  const qualityInfo: Record<string, { label: string; badge: string; color: string }> = {
    '2160p': { label: '4K Ultra HD', badge: '4K', color: 'bg-purple-500' },
    '4K': { label: '4K Ultra HD', badge: '4K', color: 'bg-purple-500' },
    '1080p': { label: 'Full HD', badge: '1080p', color: 'bg-blue-500' },
    '720p': { label: 'HD', badge: '720p', color: 'bg-green-500' },
    '480p': { label: 'SD', badge: '480p', color: 'bg-yellow-500' },
    '360p': { label: 'Low', badge: '360p', color: 'bg-orange-500' },
    'auto': { label: 'Auto', badge: 'AUTO', color: 'bg-gray-500' }
  };

  function getQualityInfo(quality: string) {
    return qualityInfo[quality] || { label: quality, badge: quality, color: 'bg-gray-500' };
  }

  function handleSelect(quality: string) {
    impact(ImpactStyle.Light);
    onSelect?.(quality);
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
  onkeydown={() => {}}
  role="dialog"
  aria-modal="true"
  aria-label="Quality selector"
>
  <!-- Bottom Sheet -->
  <div class="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl overflow-hidden animate-slide-up">
    <!-- Handle -->
    <div class="flex justify-center py-3">
      <div class="w-10 h-1 bg-white/20 rounded-full"></div>
    </div>

    <!-- Header -->
    <div class="px-4 pb-3 border-b border-white/10">
      <h2 class="text-lg font-semibold text-white">Video Quality</h2>
      <p class="text-sm text-white/60">Select streaming quality</p>
    </div>

    <!-- Quality Options -->
    <div class="max-h-[50vh] overflow-y-auto py-2">
      {#each qualities as quality}
        {@const info = getQualityInfo(quality)}
        {@const isSelected = quality === currentQuality}
        <button
          type="button"
          class="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors {isSelected ? 'bg-white/10' : ''}"
          onclick={() => handleSelect(quality)}
        >
          <!-- Quality Badge -->
          <span class="{info.color} text-white text-xs font-bold px-2 py-1 rounded min-w-[50px] text-center">
            {info.badge}
          </span>

          <!-- Label -->
          <span class="flex-1 text-left text-white">
            {info.label}
          </span>

          <!-- Selected Indicator -->
          {#if isSelected}
            <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          {/if}
        </button>
      {/each}

      {#if qualities.length === 0}
        <div class="px-4 py-8 text-center">
          <p class="text-white/40">No quality options available</p>
        </div>
      {/if}
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
