/**
 * Web implementation (stub)
 * Chromecast is not supported on web platform
 */

import { WebPlugin } from '@capacitor/core';

import type {
  ChromecastPlugin,
  CastInitOptions,
  LoadMediaOptions,
  CastSessionState,
  CastMediaStatus,
  CastDevice
} from './definitions';

export class ChromecastWeb extends WebPlugin implements ChromecastPlugin {
  async initialize(options: CastInitOptions): Promise<void> {
    console.warn('Chromecast not available on web');
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async startDiscovery(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async stopDiscovery(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async connect(options: { deviceId: string }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async disconnect(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async loadMedia(options: LoadMediaOptions): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async play(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async pause(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async seek(options: { position: number }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async setVolume(options: { level: number }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async setMuted(options: { muted: boolean }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async stop(): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async getSessionState(): Promise<CastSessionState> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async getDevices(): Promise<{ devices: CastDevice[] }> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async getMediaStatus(): Promise<CastMediaStatus> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async setSubtitleTrack(options: { trackId: number }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }

  async setAudioTrack(options: { trackId: number }): Promise<void> {
    throw this.unavailable('Chromecast is not supported on web platform');
  }
}
