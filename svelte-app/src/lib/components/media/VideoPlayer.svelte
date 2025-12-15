<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PlayerControls from './PlayerControls.svelte';
  import BufferIndicator from './BufferIndicator.svelte';
  import QualitySelector from './QualitySelector.svelte';
  import SpeedSelector from './SpeedSelector.svelte';
  import SubtitleSelector from './SubtitleSelector.svelte';
  import SubtitleOverlay from './SubtitleOverlay.svelte';
  import VideoFilePicker from './VideoFilePicker.svelte';
  import { useTorrentStreamer, type VideoFile } from '$lib/plugins/torrent-streamer.svelte';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { openSubtitlesService, type SubtitleResult } from '$services';
  import { watchHistoryStore, generateContentId } from '$stores/watch-history.store';
  import { ScreenOrientation } from '@capacitor/screen-orientation';
  import { StatusBar, Style } from '@capacitor/status-bar';

  let {
    magnetUri = '',
    title = '',
    subtitle = '',
    posterUrl = '',
    imdbId = '',
    season,
    episode,
    onClose,
    onError,
    onNextEpisode
  } = $props<{
    magnetUri?: string;
    title?: string;
    subtitle?: string;
    posterUrl?: string;
    imdbId?: string;
    season?: number;
    episode?: number;
    onClose?: () => void;
    onError?: (error: string) => void;
    onNextEpisode?: () => void;
  }>();

  const streamer = useTorrentStreamer();
  const { impact } = useHaptics();

  let videoElement: HTMLVideoElement;
  let playerContainer: HTMLDivElement;
  let isPlaying = $state(false);
  let isPaused = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(1);
  let isMuted = $state(false);
  let isFullscreen = $state(false);
  let isPiP = $state(false);
  let showControls = $state(true);
  let controlsTimeout: number | null = null;
  let isInitialized = $state(false);
  let positionSaveInterval: number | null = null;
  let hasRestoredPosition = $state(false);

  // Check if Picture-in-Picture is supported
  const supportsPiP = $derived(
    typeof document !== 'undefined' &&
    'pictureInPictureEnabled' in document &&
    (document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled === true
  );

  // Generate unique content ID for watch history
  const contentId = $derived(generateContentId({ imdbId, magnetUri, season, episode }));

  // Video file picker state (for multi-file torrents)
  let showVideoFilePicker = $state(false);
  let videoFiles = $state<VideoFile[]>([]);
  let selectedFileIndex = $state(0);
  let hasCheckedForMultipleFiles = $state(false);


  // Quality and subtitle state
  let showQualitySelector = $state(false);
  let showSubtitleSelector = $state(false);
  let availableQualities = $state<string[]>(['auto', '1080p', '720p', '480p']);
  let currentQuality = $state('auto');
  let currentSubtitleUrl = $state('');
  let subtitleText = $state('');
  let subtitleCues = $state<Array<{ start: number; end: number; text: string }>>([]);
  let subtitleOffset = $state(0); // Timing offset in seconds

  // Playback speed state
  let showSpeedSelector = $state(false);
  let currentSpeed = $state(1);

  // Derived states
  let progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
  let bufferedPercent = $derived(streamer.progress);
  let isBuffering = $derived(streamer.isBuffering && isPlaying);

  // Initialize streaming when magnetUri changes
  $effect(() => {
    if (magnetUri && !isInitialized) {
      initializePlayer();
    }
  });

  // Check for multiple video files when metadata is received
  $effect(() => {
    const metadata = streamer.metadata;
    if (metadata && metadata.numFiles > 1 && !hasCheckedForMultipleFiles) {
      checkForMultipleVideoFiles();
    }
  });

  /**
   * Check if torrent has multiple video files and show picker if so
   */
  async function checkForMultipleVideoFiles() {
    hasCheckedForMultipleFiles = true;
    try {
      const files = await streamer.getVideoFiles();
      if (files.length > 1) {
        videoFiles = files;
        showVideoFilePicker = true;
        // Pause video while user selects
        if (videoElement && !videoElement.paused) {
          videoElement.pause();
        }
      }
    } catch (e) {
      console.warn('Failed to get video files:', e);
    }
  }

  /**
   * Handle video file selection from picker
   */
  async function handleVideoFileSelect(file: VideoFile) {
    try {
      selectedFileIndex = file.index;
      const success = await streamer.selectFile(file.index);
      if (success) {
        // Update video source with new stream URL
        if (streamer.streamUrl && videoElement) {
          videoElement.src = streamer.streamUrl;
          videoElement.load();
          videoElement.play();
        }
      }
    } catch (e) {
      console.error('Failed to select video file:', e);
      onError?.('Failed to select video file');
    }
    showVideoFilePicker = false;
  }

  async function initializePlayer() {
    try {
      isInitialized = true;

      // Lock to landscape and hide status bar
      await lockOrientation();
      await hideStatusBar();

      // Start streaming
      const url = await streamer.start(magnetUri);
      if (url && videoElement) {
        videoElement.src = url;
        videoElement.load();
      }

      // Start position save interval (every 5 seconds during playback)
      positionSaveInterval = window.setInterval(() => {
        if (isPlaying && duration > 0) {
          savePlaybackPosition();
        }
      }, 5000);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to initialize player';
      onError?.(errorMsg);
    }
  }

  // Save current playback position to watch history
  async function savePlaybackPosition() {
    if (!contentId || duration <= 0) return;

    await watchHistoryStore.savePosition({
      contentId,
      title,
      posterUrl,
      position: currentTime,
      duration,
      imdbId: imdbId || undefined,
      season,
      episode,
      mediaType: season !== undefined ? 'episode' : 'movie'
    });
  }

  // Restore position from watch history
  function restorePlaybackPosition() {
    if (hasRestoredPosition || !contentId) return;

    const entry = watchHistoryStore.getPosition(contentId);
    if (entry && entry.position > 0 && entry.progress < 90) {
      // Resume from last position (minus 5 seconds for context)
      const resumeTime = Math.max(0, entry.position - 5);
      if (videoElement) {
        videoElement.currentTime = resumeTime;
        console.log(`Resuming playback at ${Math.floor(resumeTime)}s`);
      }
    }
    hasRestoredPosition = true;
  }

  async function lockOrientation() {
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (e) {
      console.warn('Failed to lock orientation:', e);
    }
  }

  async function unlockOrientation() {
    try {
      await ScreenOrientation.unlock();
    } catch (e) {
      console.warn('Failed to unlock orientation:', e);
    }
  }

  async function hideStatusBar() {
    try {
      await StatusBar.hide();
    } catch (e) {
      console.warn('Failed to hide status bar:', e);
    }
  }

  async function showStatusBar() {
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      console.warn('Failed to show status bar:', e);
    }
  }

  function togglePlayPause() {
    if (!videoElement) return;
    impact(ImpactStyle.Light);

    if (videoElement.paused) {
      videoElement.play();
      isPlaying = true;
      isPaused = false;
    } else {
      videoElement.pause();
      isPlaying = false;
      isPaused = true;
    }
    resetControlsTimeout();
  }

  function seek(time: number) {
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, Math.min(time, duration));
    resetControlsTimeout();
  }

  function seekRelative(seconds: number) {
    if (!videoElement) return;
    impact(ImpactStyle.Light);
    seek(currentTime + seconds);
  }

  function setVolume(value: number) {
    if (!videoElement) return;
    volume = Math.max(0, Math.min(1, value));
    videoElement.volume = volume;
    isMuted = volume === 0;
  }

  function toggleMute() {
    if (!videoElement) return;
    impact(ImpactStyle.Light);
    isMuted = !isMuted;
    videoElement.muted = isMuted;
    resetControlsTimeout();
  }

  async function toggleFullscreen() {
    impact(ImpactStyle.Medium);
    try {
      if (!document.fullscreenElement) {
        await playerContainer?.requestFullscreen();
        isFullscreen = true;
      } else {
        await document.exitFullscreen();
        isFullscreen = false;
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
    resetControlsTimeout();
  }

  async function togglePiP() {
    if (!videoElement || !supportsPiP) return;
    impact(ImpactStyle.Medium);

    try {
      const doc = document as Document & { pictureInPictureElement?: Element };
      if (doc.pictureInPictureElement) {
        await document.exitPictureInPicture();
        isPiP = false;
      } else {
        await videoElement.requestPictureInPicture();
        isPiP = true;
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
    resetControlsTimeout();
  }

  function handleVideoTimeUpdate() {
    if (!videoElement) return;
    currentTime = videoElement.currentTime;
    updateSubtitleText();
  }

  // Update displayed subtitle based on current time
  function updateSubtitleText() {
    if (subtitleCues.length === 0) {
      subtitleText = '';
      return;
    }

    const adjustedTime = currentTime + subtitleOffset;
    const activeCue = subtitleCues.find(
      cue => adjustedTime >= cue.start && adjustedTime <= cue.end
    );

    subtitleText = activeCue?.text || '';
  }

  // Quality selector handlers
  // Note: For torrent streaming, quality is determined by the selected torrent file.
  // This selector shows the current quality but mid-stream switching requires
  // selecting a different torrent source (not HLS adaptive streaming).
  function handleQualitySelect(quality: string) {
    currentQuality = quality;
    // Quality switching for torrents would require stopping current stream
    // and starting a new torrent with different quality - this is handled
    // at the torrent selection stage, not during playback
    console.log('[VideoPlayer] Quality display updated:', quality);
  }

  // Playback speed handler - applies to video element playbackRate
  function handleSpeedSelect(speed: number) {
    currentSpeed = speed;
    if (videoElement) {
      videoElement.playbackRate = speed;
    }
    console.log('[VideoPlayer] Playback speed set to:', speed);
  }

  // Subtitle selector handlers
  async function handleSubtitleSelect(sub: SubtitleResult | null) {
    if (!sub) {
      // Disable subtitles
      currentSubtitleUrl = '';
      subtitleCues = [];
      subtitleText = '';
      return;
    }

    try {
      currentSubtitleUrl = sub.url || '';

      // Download and parse subtitle file using fileId
      if (sub.fileId) {
        const content = await openSubtitlesService.downloadSubtitle(sub.fileId);
        // Determine format from fileName extension or default to srt
        const format = sub.fileName?.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt';
        subtitleCues = parseSubtitleFile(content, format);
      }
    } catch (e) {
      console.error('Failed to load subtitles:', e);
      currentSubtitleUrl = '';
      subtitleCues = [];
    }
  }

  // Parse SRT/VTT subtitle content into cues
  function parseSubtitleFile(content: string, format: string): Array<{ start: number; end: number; text: string }> {
    const cues: Array<{ start: number; end: number; text: string }> = [];

    // Normalize line endings
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    if (format === 'vtt' || format === 'webvtt') {
      // WebVTT format
      const blocks = normalized.split('\n\n').filter(b => b.trim());

      for (const block of blocks) {
        if (block.startsWith('WEBVTT') || block.startsWith('NOTE')) continue;

        const lines = block.split('\n');
        const timingLine = lines.find(l => l.includes('-->'));
        if (!timingLine) continue;

        const timeParts = timingLine.split('-->').map(s => s.trim());
        const startStr = timeParts[0] ?? '';
        const endStr = timeParts[1] ?? '';
        const start = parseTimestamp(startStr);
        const end = parseTimestamp(endStr);
        const text = lines.slice(lines.indexOf(timingLine) + 1).join('\n').trim();

        if (!isNaN(start) && !isNaN(end) && text) {
          cues.push({ start, end, text });
        }
      }
    } else {
      // SRT format
      const blocks = normalized.split('\n\n').filter(b => b.trim());

      for (const block of blocks) {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length < 2) continue;

        // Find timing line (contains -->)
        const timingIndex = lines.findIndex(l => l.includes('-->'));
        if (timingIndex === -1) continue;

        const timingLine = lines[timingIndex];
        if (!timingLine) continue;
        const srtParts = timingLine.split('-->').map(s => s.trim().split(' ')[0] ?? '');
        const startStr = srtParts[0] ?? '';
        const endStr = srtParts[1] ?? '';
        const start = parseTimestamp(startStr);
        const end = parseTimestamp(endStr);
        const text = lines.slice(timingIndex + 1).join('\n').trim();

        if (!isNaN(start) && !isNaN(end) && text) {
          cues.push({ start, end, text });
        }
      }
    }

    return cues.sort((a, b) => a.start - b.start);
  }

  // Parse timestamp to seconds (00:00:00,000 or 00:00:00.000)
  function parseTimestamp(ts: string): number {
    const parts = ts.replace(',', '.').split(':');
    if (parts.length === 3) {
      const hours = parts[0] ?? '0';
      const minutes = parts[1] ?? '0';
      const seconds = parts[2] ?? '0';
      return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
    } else if (parts.length === 2) {
      const minutes = parts[0] ?? '0';
      const seconds = parts[1] ?? '0';
      return parseFloat(minutes) * 60 + parseFloat(seconds);
    }
    return parseFloat(ts) || 0;
  }

  // Adjust subtitle timing
  function adjustSubtitleOffset(delta: number) {
    subtitleOffset += delta;
  }

  function handleVideoDurationChange() {
    if (!videoElement) return;
    duration = videoElement.duration || 0;
  }

  async function handleVideoEnded() {
    isPlaying = false;
    isPaused = false;
    showControls = true;

    // Mark as completed in watch history
    if (contentId) {
      await watchHistoryStore.markCompleted(contentId);
    }

    // Trigger next episode callback if this is a TV episode
    if (season !== undefined && episode !== undefined && onNextEpisode) {
      // Small delay before triggering next episode
      setTimeout(() => {
        onNextEpisode();
      }, 2000);
    }
  }

  function handleVideoError(e: Event) {
    const error = videoElement?.error;
    const errorMsg = error?.message || 'Video playback error';
    onError?.(errorMsg);
  }

  function handleTap() {
    showControls = !showControls;
    if (showControls) {
      resetControlsTimeout();
    }
  }

  function handleDoubleTapLeft() {
    seekRelative(-10);
  }

  function handleDoubleTapRight() {
    seekRelative(10);
  }

  function resetControlsTimeout() {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    if (showControls && isPlaying) {
      controlsTimeout = window.setTimeout(() => {
        showControls = false;
      }, 4000);
    }
  }

  async function handleClose() {
    // Save final position before closing
    if (duration > 0) {
      await savePlaybackPosition();
    }

    // Cleanup
    if (positionSaveInterval) {
      clearInterval(positionSaveInterval);
      positionSaveInterval = null;
    }

    await streamer.stop();
    await unlockOrientation();
    await showStatusBar();
    onClose?.();
  }

  onMount(() => {
    return () => {
      // Cleanup on unmount
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      if (positionSaveInterval) {
        clearInterval(positionSaveInterval);
      }
      // Save position on unmount if we have valid duration
      if (duration > 0) {
        savePlaybackPosition();
      }
      streamer.stop();
      unlockOrientation();
      showStatusBar();
    };
  });
</script>

<div
  bind:this={playerContainer}
  class="video-player fixed inset-0 z-[9999] bg-black"
  role="application"
  aria-label="Video Player"
>
  <!-- Video Element -->
  <video
    bind:this={videoElement}
    class="w-full h-full object-contain"
    playsinline
    autoplay
    ontimeupdate={handleVideoTimeUpdate}
    ondurationchange={handleVideoDurationChange}
    onended={handleVideoEnded}
    onerror={handleVideoError}
    onwaiting={() => { /* handled by buffer indicator */ }}
    oncanplay={() => {
      isPlaying = !videoElement?.paused;
      // Restore saved position on first canplay
      restorePlaybackPosition();
    }}
  >
    <track kind="captions" />
  </video>

  <!-- Tap zones for double-tap seeking -->
  <div
    class="absolute inset-0 flex"
    role="presentation"
    onclick={handleTap}
    onkeydown={() => {}}
  >
    <button
      type="button"
      class="flex-1 h-full bg-transparent border-none"
      ondblclick={handleDoubleTapLeft}
      aria-label="Double tap to rewind 10 seconds"
    ></button>
    <button
      type="button"
      class="flex-1 h-full bg-transparent border-none"
      ondblclick={handleDoubleTapRight}
      aria-label="Double tap to skip 10 seconds"
    ></button>
  </div>

  <!-- Subtitle Overlay -->
  <SubtitleOverlay
    text={subtitleText}
    visible={!!subtitleText && !showControls}
    offset={subtitleOffset}
  />

  <!-- Buffer/Loading Indicator -->
  {#if streamer.isLoading || isBuffering}
    <BufferIndicator
      progress={streamer.bufferProgress}
      downloadSpeed={streamer.downloadSpeed}
      peers={streamer.numPeers}
      isLoading={streamer.isLoading}
    />
  {/if}

  <!-- Player Controls Overlay -->
  {#if showControls}
    <PlayerControls
      {title}
      {subtitle}
      {isPlaying}
      {isPaused}
      {currentTime}
      {duration}
      {volume}
      {isMuted}
      {isFullscreen}
      {isPiP}
      {supportsPiP}
      bufferedPercent={bufferedPercent}
      hasSubtitles={!!currentSubtitleUrl}
      currentFileIndex={selectedFileIndex}
      totalFiles={videoFiles.length > 0 ? videoFiles.length : 1}
      onPlayPause={togglePlayPause}
      onSeek={seek}
      onSkipBack={() => seekRelative(-10)}
      onSkipForward={() => seekRelative(30)}
      onVolumeChange={setVolume}
      onMuteToggle={toggleMute}
      onFullscreenToggle={toggleFullscreen}
      onPiPToggle={togglePiP}
      onClose={handleClose}
      onQualitySelect={() => { showQualitySelector = true; }}
      onSubtitleSelect={() => { showSubtitleSelector = true; }}
      onSpeedSelect={() => { showSpeedSelector = true; }}
      {currentSpeed}
      onShowFilePicker={() => {
        console.log('[VideoPlayer] Opening file picker, videoFiles:', videoFiles.length, 'showVideoFilePicker before:', showVideoFilePicker);
        showVideoFilePicker = true;
        console.log('[VideoPlayer] showVideoFilePicker after:', showVideoFilePicker);
      }}
    />
  {/if}

  <!-- Torrent Stats (debug, can be toggled) -->
  {#if streamer.isStreaming && showControls}
    <div class="absolute bottom-20 left-4 text-xs text-white/60 bg-black/40 px-2 py-1 rounded">
      <div>Peers: {streamer.numPeers} | DL: {formatSpeed(streamer.downloadSpeed)}</div>
      <div>Progress: {(streamer.progress * 100).toFixed(1)}%</div>
    </div>
  {/if}

  <!-- Quality Selector Modal -->
  {#if showQualitySelector}
    <QualitySelector
      qualities={availableQualities}
      {currentQuality}
      onSelect={handleQualitySelect}
      onClose={() => { showQualitySelector = false; }}
    />
  {/if}

  <!-- Speed Selector Modal -->
  {#if showSpeedSelector}
    <SpeedSelector
      {currentSpeed}
      onSelect={handleSpeedSelect}
      onClose={() => { showSpeedSelector = false; }}
    />
  {/if}

  <!-- Subtitle Selector Modal -->
  {#if showSubtitleSelector}
    <SubtitleSelector
      {imdbId}
      title={title}
      {season}
      {episode}
      currentSubtitle={currentSubtitleUrl}
      onSelect={handleSubtitleSelect}
      onClose={() => { showSubtitleSelector = false; }}
    />
  {/if}

</div>

<!-- Video File Picker (for multi-file torrents) - Inline implementation to avoid component mount issues -->
{#if showVideoFilePicker}
  {@const previewFiles = videoFiles.slice(0, 50)}
  <div
    class="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) showVideoFilePicker = false; }}
    onkeydown={(e) => { if (e.key === 'Escape') showVideoFilePicker = false; }}
    role="dialog"
    tabindex="-1"
  >
    <div class="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl max-h-[80vh] flex flex-col">
      <!-- Handle -->
      <div class="flex justify-center py-3">
        <div class="w-10 h-1 bg-white/20 rounded-full"></div>
      </div>

      <!-- Header -->
      <div class="px-4 pb-3 border-b border-white/10">
        <h2 class="text-lg font-semibold text-white">Select Video File</h2>
        <p class="text-sm text-white/60">{title} · {videoFiles.length.toLocaleString()} files</p>
      </div>

      <!-- File List Preview -->
      <div class="flex-1 overflow-y-auto py-2" style="max-height: 50vh;">
        {#each previewFiles as file (file.index)}
          {@const isSelected = file.index === selectedFileIndex}
          {@const fileName = file.name ?? `File ${file.index}`}
          {@const displayName = fileName.split('/').pop() || fileName}
          {@const extension = fileName.split('.').pop()?.toUpperCase() || 'VIDEO'}
          {@const fileSize = file.size ?? 0}
          <button
            type="button"
            class="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left {isSelected ? 'bg-white/10' : ''}"
            onclick={async () => {
              selectedFileIndex = file.index;
              await handleVideoFileSelect(file);
              showVideoFilePicker = false;
            }}
          >
            <span class="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded min-w-[40px] text-center mt-0.5">
              {extension}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm leading-tight truncate">{displayName}</p>
              <p class="text-white/50 text-xs mt-1">
                {fileSize < 1024*1024 ? (fileSize / 1024).toFixed(1) + ' KB' : (fileSize / 1024 / 1024).toFixed(1) + ' MB'}
              </p>
            </div>
            {#if isSelected}
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            {/if}
          </button>
        {/each}
        {#if videoFiles.length > 50}
          <div class="px-4 py-3 text-center text-white/40 text-sm">
            Showing first 50 of {videoFiles.length.toLocaleString()} files
          </div>
        {/if}
      </div>

      <!-- Cancel Button -->
      <div class="p-4 border-t border-white/10">
        <button
          type="button"
          class="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          onclick={() => { showVideoFilePicker = false; }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<script module lang="ts">
  function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
  }
</script>

<style>
  .video-player {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
  }

  video {
    background: #000;
  }

  video::-webkit-media-controls {
    display: none !important;
  }

  /* File picker slide-up animation */
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
