<script lang="ts">
  let {
    title = '',
    subtitle = '',
    isPlaying = false,
    isPaused = false,
    currentTime = 0,
    duration = 0,
    volume = 1,
    isMuted = false,
    isFullscreen = false,
    isPiP = false,
    supportsPiP = false,
    bufferedPercent = 0,
    hasSubtitles = false,
    onPlayPause,
    onSeek,
    onSkipBack,
    onSkipForward,
    onVolumeChange,
    onMuteToggle,
    onFullscreenToggle,
    onPiPToggle,
    onClose,
    onQualitySelect,
    onSubtitleSelect
  } = $props<{
    title?: string;
    subtitle?: string;
    isPlaying?: boolean;
    isPaused?: boolean;
    currentTime?: number;
    duration?: number;
    volume?: number;
    isMuted?: boolean;
    isFullscreen?: boolean;
    isPiP?: boolean;
    supportsPiP?: boolean;
    bufferedPercent?: number;
    hasSubtitles?: boolean;
    onPlayPause?: () => void;
    onSeek?: (time: number) => void;
    onSkipBack?: () => void;
    onSkipForward?: () => void;
    onVolumeChange?: (volume: number) => void;
    onMuteToggle?: () => void;
    onFullscreenToggle?: () => void;
    onPiPToggle?: () => void;
    onClose?: () => void;
    onQualitySelect?: () => void;
    onSubtitleSelect?: () => void;
  }>();

  let progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
  let isSeeking = $state(false);
  let seekPosition = $state(0);

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSeekStart(e: MouseEvent | TouchEvent) {
    isSeeking = true;
    updateSeekPosition(e);
  }

  function handleSeekMove(e: MouseEvent | TouchEvent) {
    if (!isSeeking) return;
    updateSeekPosition(e);
  }

  function handleSeekEnd() {
    if (isSeeking) {
      onSeek?.(seekPosition);
      isSeeking = false;
    }
  }

  function updateSeekPosition(e: MouseEvent | TouchEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekPosition = percent * duration;
  }

  function handleProgressClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek?.(percent * duration);
  }
</script>

<div class="player-controls absolute inset-0 flex flex-col justify-between pointer-events-none">
  <!-- Top Bar: Title and Close (with safe area inset for notched devices) -->
  <div class="top-bar bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem)">
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="p-2 rounded-full hover:bg-white/10 transition-colors"
        onclick={onClose}
        aria-label="Close player"
      >
        <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="flex-1 min-w-0">
        <h2 class="text-white font-medium truncate">{title}</h2>
        {#if subtitle}
          <p class="text-white/60 text-sm truncate">{subtitle}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Center Controls: Play/Pause and Skip -->
  <div class="center-controls flex items-center justify-center gap-8 pointer-events-auto">
    <!-- Skip Back -->
    <button
      type="button"
      class="p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
      onclick={onSkipBack}
      aria-label="Skip back 10 seconds"
    >
      <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12L12.5 14.5V19.5L10 22V17H6V15H10V12M14 12V15H18V17H14V22L11.5 19.5V14.5L14 12Z"/>
      </svg>
      <span class="sr-only">-10s</span>
    </button>

    <!-- Play/Pause -->
    <button
      type="button"
      class="p-5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      onclick={onPlayPause}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <svg class="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      {:else}
        <svg class="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>

    <!-- Skip Forward -->
    <button
      type="button"
      class="p-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
      onclick={onSkipForward}
      aria-label="Skip forward 30 seconds"
    >
      <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.5 3C6.85 3 2.92 6.03 1.53 10.22L3.9 11C4.95 7.81 7.96 5.5 11.5 5.5C13.46 5.5 15.23 6.22 16.62 7.38L14 10H21V3L18.4 5.6C16.55 4 14.15 3 11.5 3M14 12L11.5 14.5V19.5L14 22V17H18V15H14V12M10 12V15H6V17H10V22L12.5 19.5V14.5L10 12Z"/>
      </svg>
      <span class="sr-only">+30s</span>
    </button>
  </div>

  <!-- Bottom Bar: Progress and Controls -->
  <div class="bottom-bar bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
    <!-- Progress Bar -->
    <div
      class="progress-container relative h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
      onclick={handleProgressClick}
      onmousedown={handleSeekStart}
      onmousemove={handleSeekMove}
      onmouseup={handleSeekEnd}
      onmouseleave={handleSeekEnd}
      ontouchstart={handleSeekStart}
      ontouchmove={handleSeekMove}
      ontouchend={handleSeekEnd}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
    >
      <!-- Buffered -->
      <div
        class="absolute inset-y-0 left-0 bg-white/40 rounded-full"
        style="width: {bufferedPercent}%"
      />
      <!-- Progress -->
      <div
        class="absolute inset-y-0 left-0 bg-red-500 rounded-full"
        style="width: {isSeeking ? (seekPosition / duration * 100) : progressPercent}%"
      />
      <!-- Thumb -->
      <div
        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg"
        style="left: calc({isSeeking ? (seekPosition / duration * 100) : progressPercent}% - 6px)"
      />
    </div>

    <!-- Time and Controls Row -->
    <div class="flex items-center justify-between">
      <!-- Time Display -->
      <div class="text-white text-sm font-mono">
        <span>{formatTime(isSeeking ? seekPosition : currentTime)}</span>
        <span class="text-white/60"> / </span>
        <span class="text-white/60">{formatTime(duration)}</span>
      </div>

      <!-- Right Controls -->
      <div class="flex items-center gap-2">
        <!-- Subtitles -->
        <button
          type="button"
          class="p-2 rounded-full hover:bg-white/10 transition-colors"
          onclick={onSubtitleSelect}
          aria-label="Select subtitles"
        >
          <svg class="w-5 h-5 {hasSubtitles ? 'text-red-500' : 'text-white'}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z"/>
          </svg>
        </button>

        <!-- Quality -->
        <button
          type="button"
          class="p-2 rounded-full hover:bg-white/10 transition-colors"
          onclick={onQualitySelect}
          aria-label="Select quality"
        >
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z"/>
          </svg>
        </button>

        <!-- Volume -->
        <button
          type="button"
          class="p-2 rounded-full hover:bg-white/10 transition-colors"
          onclick={onMuteToggle}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {#if isMuted || volume === 0}
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          {/if}
        </button>

        <!-- Picture-in-Picture (only shown if supported) -->
        {#if supportsPiP}
          <button
            type="button"
            class="p-2 rounded-full hover:bg-white/10 transition-colors"
            onclick={onPiPToggle}
            aria-label={isPiP ? 'Exit picture-in-picture' : 'Enter picture-in-picture'}
          >
            <svg class="w-5 h-5 {isPiP ? 'text-red-500' : 'text-white'}" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
            </svg>
          </button>
        {/if}

        <!-- Fullscreen -->
        <button
          type="button"
          class="p-2 rounded-full hover:bg-white/10 transition-colors"
          onclick={onFullscreenToggle}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {#if isFullscreen}
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .player-controls {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .progress-container:hover {
    height: 6px;
  }

  .progress-container:hover .absolute {
    transition: height 0.1s ease;
  }
</style>
