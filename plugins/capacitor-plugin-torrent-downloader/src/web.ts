/**
 * Web implementation (stub)
 * Torrent downloading is not supported on web
 */

import { WebPlugin } from '@capacitor/core';

import type {
  TorrentDownloadPlugin,
  StartDownloadOptions,
  DownloadProgress
} from './definitions';

export class TorrentDownloadWeb extends WebPlugin implements TorrentDownloadPlugin {
  async startDownload(options: StartDownloadOptions): Promise<{ downloadId: number }> {
    console.warn('TorrentDownload not available on web');
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async pauseDownload(options: { downloadId: number }): Promise<void> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async resumeDownload(options: { downloadId: number }): Promise<void> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async cancelDownload(options: { downloadId: number }): Promise<void> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async deleteDownload(options: { downloadId: number }): Promise<void> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async getDownloadProgress(options: { downloadId: number }): Promise<DownloadProgress> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }

  async stopSeeding(options: { downloadId: number }): Promise<void> {
    throw this.unavailable('Torrent downloading is not supported on web platform');
  }
}
