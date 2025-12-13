<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PlayerControls from './PlayerControls.svelte';
  import BufferIndicator from './BufferIndicator.svelte';
  import QualitySelector from './QualitySelector.svelte';
  import SubtitleSelector from './SubtitleSelector.svelte';
  import SubtitleOverlay from './SubtitleOverlay.svelte';
  import { useTorrentStreamer } from '$lib/plugins/torrent-streamer';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { openSubtitlesService, type SubtitleResult } from '$services';
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
    onError
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
  let showControls = $state(true);
  let controlsTimeout: number | null = null;
  let isInitialized = $state(false);

  // Quality and subtitle state
  let showQualitySelector = $state(false);
  let showSubtitleSelector = $state(false);
  let availableQualities = $state<string[]>(['auto', '1080p', '720p', '480p']);
  let currentQuality = $state('auto');
  let currentSubtitleUrl = $state('');
  let subtitleText = $state('');
  let subtitleCues = $state<Array<{ start: number; end: number; text: string }>>([]);
  let subtitleOffset = $state(0); // Timing offset in seconds

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
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to initialize player';
      onError?.(errorMsg);
    }
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
  function handleQualitySelect(quality: string) {
    currentQuality = quality;
    // TODO: Implement actual quality switching when HLS is integrated
    console.log('Quality selected:', quality);
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

      // Download and parse subtitle file
      if (sub.url) {
        const content = await openSubtitlesService.downloadSubtitle(sub.url);
        subtitleCues = parseSubtitleFile(content, sub.format || 'srt');
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

        const [startStr, endStr] = timingLine.split('-->').map(s => s.trim());
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
        const [startStr, endStr] = timingLine.split('-->').map(s => s.trim().split(' ')[0]);
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
      const [hours, minutes, seconds] = parts;
      return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
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

  function handleVideoEnded() {
    isPlaying = false;
    isPaused = false;
    showControls = true;
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
    await streamer.stop();
    await unlockOrientation();
    await showStatusBar();
    onClose?.();
  }

  onMount(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
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
    oncanplay={() => { isPlaying = !videoElement?.paused; }}
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
      bufferedPercent={bufferedPercent}
      hasSubtitles={!!currentSubtitleUrl}
      onPlayPause={togglePlayPause}
      onSeek={seek}
      onSkipBack={() => seekRelative(-10)}
      onSkipForward={() => seekRelative(30)}
      onVolumeChange={setVolume}
      onMuteToggle={toggleMute}
      onFullscreenToggle={toggleFullscreen}
      onClose={handleClose}
      onQualitySelect={() => { showQualitySelector = true; }}
      onSubtitleSelect={() => { showSubtitleSelector = true; }}
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
</style>
