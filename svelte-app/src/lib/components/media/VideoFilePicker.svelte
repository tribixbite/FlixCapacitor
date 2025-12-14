<script lang="ts">
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import type { VideoFile } from '$lib/plugins';

  let {
    files = [],
    currentIndex = 0,
    torrentName = '',
    onSelect,
    onClose
  } = $props<{
    files?: VideoFile[];
    currentIndex?: number;
    torrentName?: string;
    onSelect?: (file: VideoFile) => void;
    onClose?: () => void;
  }>();

  const { impact } = useHaptics();

  /**
   * Format file size for display
   */
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Extract clean filename from path
   */
  function getDisplayName(name: string): string {
    // Remove common torrent path prefixes
    const parts = name.split('/');
    return parts[parts.length - 1] || name;
  }

  /**
   * Get file extension badge color
   */
  function getExtensionColor(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mkv': return 'bg-purple-500';
      case 'mp4': return 'bg-blue-500';
      case 'avi': return 'bg-green-500';
      case 'webm': return 'bg-orange-500';
      case 'mov': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  }

  /**
   * Get file extension for badge
   */
  function getExtension(name: string): string {
    const ext = name.split('.').pop()?.toUpperCase();
    return ext || 'VIDEO';
  }

  function handleSelect(file: VideoFile) {
    impact(ImpactStyle.Light);
    onSelect?.(file);
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
  class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
  onclick={handleBackdropClick}
  onkeydown={() => {}}
  role="dialog"
  aria-modal="true"
  aria-label="Video file selector"
>
  <!-- Bottom Sheet -->
  <div class="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
    <!-- Handle -->
    <div class="flex justify-center py-3">
      <div class="w-10 h-1 bg-white/20 rounded-full"></div>
    </div>

    <!-- Header -->
    <div class="px-4 pb-3 border-b border-white/10">
      <h2 class="text-lg font-semibold text-white">Select Video File</h2>
      {#if torrentName}
        <p class="text-sm text-white/60 truncate">{torrentName}</p>
      {:else}
        <p class="text-sm text-white/60">{files.length} video files found</p>
      {/if}
    </div>

    <!-- File List -->
    <div class="flex-1 overflow-y-auto py-2">
      {#each files as file, i}
        {@const isSelected = file.index === currentIndex}
        {@const displayName = getDisplayName(file.name)}
        <button
          type="button"
          class="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors {isSelected ? 'bg-white/10' : ''}"
          onclick={() => handleSelect(file)}
        >
          <!-- File Type Badge -->
          <span class="{getExtensionColor(file.name)} text-white text-[10px] font-bold px-2 py-1 rounded min-w-[40px] text-center mt-0.5">
            {getExtension(file.name)}
          </span>

          <!-- File Info -->
          <div class="flex-1 text-left min-w-0">
            <p class="text-white text-sm leading-tight break-words">
              {displayName}
            </p>
            <p class="text-white/50 text-xs mt-1">
              {formatSize(file.size)}
            </p>
          </div>

          <!-- Selected Indicator -->
          {#if isSelected}
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          {/if}
        </button>
      {/each}

      {#if files.length === 0}
        <div class="px-4 py-8 text-center">
          <p class="text-white/40">No video files found in torrent</p>
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
