import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { PlayerState, Subtitle, VideoQuality, PlayerError, PlaybackPosition } from '$types';

interface PlayerStore extends Writable<PlayerState> {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setQuality: (quality: VideoQuality) => void;
  setSubtitle: (subtitle: Subtitle | null) => void;
  setSubtitleDelay: (delay: number) => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
  setBuffering: (isBuffering: boolean) => void;
  setDuration: (duration: number) => void;
  updateTime: (currentTime: number) => void;
  setError: (error: PlayerError | null) => void;
  reset: () => void;
}

const initialState: PlayerState = {
  isPlaying: false,
  isPaused: true,
  isBuffering: false,
  isFullscreen: false,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  quality: null,
  subtitle: null,
  error: null
};

function createPlayerStore(): PlayerStore {
  const { subscribe, set, update } = writable<PlayerState>(initialState);

  return {
    subscribe,
    set,
    update,

    play: () => update(s => ({ ...s, isPlaying: true, isPaused: false, error: null })),
    pause: () => update(s => ({ ...s, isPlaying: false, isPaused: true })),
    togglePlay: () => update(s => ({
      ...s,
      isPlaying: !s.isPlaying,
      isPaused: s.isPlaying
    })),

    seek: (time: number) => update(s => ({
      ...s,
      currentTime: Math.max(0, Math.min(time, s.duration))
    })),

    setVolume: (volume: number) => update(s => ({
      ...s,
      volume: Math.max(0, Math.min(1, volume)),
      isMuted: volume === 0
    })),

    toggleMute: () => update(s => ({ ...s, isMuted: !s.isMuted })),

    setQuality: (quality: VideoQuality) => update(s => ({ ...s, quality })),

    setSubtitle: (subtitle: Subtitle | null) => update(s => ({ ...s, subtitle })),

    setSubtitleDelay: (delay: number) => update(s => ({
      ...s,
      subtitle: s.subtitle ? { ...s.subtitle, delay } : null
    })),

    enterFullscreen: () => update(s => ({ ...s, isFullscreen: true })),
    exitFullscreen: () => update(s => ({ ...s, isFullscreen: false })),
    toggleFullscreen: () => update(s => ({ ...s, isFullscreen: !s.isFullscreen })),

    setBuffering: (isBuffering: boolean) => update(s => ({ ...s, isBuffering })),
    setDuration: (duration: number) => update(s => ({ ...s, duration })),
    updateTime: (currentTime: number) => update(s => ({ ...s, currentTime })),
    setError: (error: PlayerError | null) => update(s => ({ ...s, error })),

    reset: () => set(initialState)
  };
}

export const playerStore = createPlayerStore();

// Derived stores for computed values
export const progress: Readable<number> = derived(
  playerStore,
  $player => $player.duration > 0
    ? ($player.currentTime / $player.duration) * 100
    : 0
);

export const timeRemaining: Readable<number> = derived(
  playerStore,
  $player => Math.max(0, $player.duration - $player.currentTime)
);

export const formattedCurrentTime: Readable<string> = derived(
  playerStore,
  $player => formatTime($player.currentTime)
);

export const formattedDuration: Readable<string> = derived(
  playerStore,
  $player => formatTime($player.duration)
);

export const formattedTimeRemaining: Readable<string> = derived(
  timeRemaining,
  $remaining => `-${formatTime($remaining)}`
);

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
