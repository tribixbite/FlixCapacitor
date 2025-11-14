/**
 * Web implementation (stub)
 * Torrent downloading is not supported on web
 */

import { WebPlugin } from '@capacitor/core';

import type {
  TorrentDownloadPlugin,
  StartDownloadOptions,
  DownloadProgress,
  StorageInfo,
  StorageSpaceCheck,
  CleanupResult,
  FileIntegrityResult,
  FileHashResult,
  TotalSizeResult
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

  // Storage management methods (Phase 10A.2)
  async getStorageInfo(): Promise<StorageInfo> {
    throw this.unavailable('Storage management is not supported on web platform');
  }

  async checkStorageSpace(options: { requiredBytes: number }): Promise<StorageSpaceCheck> {
    throw this.unavailable('Storage management is not supported on web platform');
  }

  async cleanupIncompleteDownloads(): Promise<CleanupResult> {
    throw this.unavailable('Storage management is not supported on web platform');
  }

  async cleanupOldDownloads(options?: { maxAgeMillis?: number }): Promise<CleanupResult> {
    throw this.unavailable('Storage management is not supported on web platform');
  }

  async verifyFileIntegrity(options: { filePath: string; expectedHash: string }): Promise<FileIntegrityResult> {
    throw this.unavailable('File integrity verification is not supported on web platform');
  }

  async calculateFileHash(options: { filePath: string }): Promise<FileHashResult> {
    throw this.unavailable('File hash calculation is not supported on web platform');
  }

  async getTotalDownloadSize(): Promise<TotalSizeResult> {
    throw this.unavailable('Storage management is not supported on web platform');
  }
}
