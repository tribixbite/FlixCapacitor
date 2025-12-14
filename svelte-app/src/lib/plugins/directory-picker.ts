/**
 * Directory Picker Plugin Service
 * Wraps the native DirectoryPicker Capacitor plugin for folder selection and file listing
 */

import { registerPlugin } from '@capacitor/core';
import { platform } from './platform';

// Plugin type definitions
export interface DirectoryPickerPlugin {
  pickDirectory(): Promise<PickDirectoryResult>;
  listFiles(options: ListFilesOptions): Promise<ListFilesResult>;
  getPersistedDirectories(): Promise<PersistedDirectoriesResult>;
  releaseDirectory(options: ReleaseDirectoryOptions): Promise<void>;
  openFile(options: OpenFileOptions): Promise<void>;
}

export interface PickDirectoryResult {
  uri: string;
  displayName?: string;
}

export interface ListFilesOptions {
  uri: string;
  extensions?: string[];
  recursive?: boolean;
}

export interface FileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  relativePath: string;
}

export interface ListFilesResult {
  files: FileInfo[];
}

export interface PersistedDirectoriesResult {
  uris: string[];
}

export interface ReleaseDirectoryOptions {
  uri: string;
}

export interface OpenFileOptions {
  uri: string;
  mimeType?: string;
}

// Video file extensions to scan for
const VIDEO_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.m4v', '.mpeg', '.mpg', '.3gp', '.ts', '.m2ts'
];

// Register the native plugin
const DirectoryPicker = registerPlugin<DirectoryPickerPlugin>('DirectoryPicker', {
  web: () => Promise.resolve({
    // Web fallback implementation using File System Access API
    async pickDirectory(): Promise<PickDirectoryResult> {
      if ('showDirectoryPicker' in window) {
        try {
          const handle = await (window as any).showDirectoryPicker();
          return {
            uri: handle.name,
            displayName: handle.name
          };
        } catch (err) {
          console.error('Directory picker cancelled or failed:', err);
          throw new Error('Directory picker cancelled');
        }
      }
      throw new Error('Directory picker not supported on this platform');
    },
    async listFiles(): Promise<ListFilesResult> {
      // Web implementation would need to iterate FileSystemDirectoryHandle
      // For now, return empty list as web support is limited
      return { files: [] };
    },
    async getPersistedDirectories(): Promise<PersistedDirectoriesResult> {
      return { uris: [] };
    },
    async releaseDirectory(): Promise<void> {
      // No-op on web
    },
    async openFile(): Promise<void> {
      throw new Error('openFile not supported on web');
    }
  })
});

/**
 * Directory Picker Service
 * Provides methods for folder selection, file scanning, and permission management
 */
export const directoryPickerService = {
  /**
   * Open native directory picker and get selected folder URI
   */
  async pickFolder(): Promise<{ uri: string; name: string } | null> {
    try {
      const result = await DirectoryPicker.pickDirectory();
      return {
        uri: result.uri,
        name: result.displayName || extractFolderName(result.uri)
      };
    } catch (error) {
      console.error('Failed to pick directory:', error);
      return null;
    }
  },

  /**
   * Scan a folder for video files
   */
  async scanFolder(uri: string, recursive = true): Promise<FileInfo[]> {
    try {
      const result = await DirectoryPicker.listFiles({
        uri,
        extensions: VIDEO_EXTENSIONS,
        recursive
      });
      return result.files;
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  },

  /**
   * Get all folders with persisted permissions
   */
  async getPersistedFolders(): Promise<string[]> {
    try {
      const result = await DirectoryPicker.getPersistedDirectories();
      return result.uris;
    } catch (error) {
      console.error('Failed to get persisted directories:', error);
      return [];
    }
  },

  /**
   * Release permissions for a folder
   */
  async releaseFolder(uri: string): Promise<boolean> {
    try {
      await DirectoryPicker.releaseDirectory({ uri });
      return true;
    } catch (error) {
      console.error('Failed to release directory:', error);
      return false;
    }
  },

  /**
   * Open a file with external app via native intent
   */
  async openFile(uri: string, mimeType = 'video/*'): Promise<void> {
    await DirectoryPicker.openFile({ uri, mimeType });
  },

  /**
   * Check if directory picker is available
   */
  get isAvailable(): boolean {
    return platform.isNative || ('showDirectoryPicker' in window);
  }
};

/**
 * Extract folder name from URI
 */
function extractFolderName(uri: string): string {
  // Handle content:// URIs (Android)
  if (uri.startsWith('content://')) {
    const parts = uri.split('%2F');
    return decodeURIComponent(parts[parts.length - 1] || 'Folder');
  }
  // Handle file:// URIs
  if (uri.startsWith('file://')) {
    const path = uri.replace('file://', '');
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Folder';
  }
  // Fallback
  return uri.split('/').pop() || 'Folder';
}

/**
 * Parse filename to extract metadata
 */
export function parseFilename(filename: string): {
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  type: 'movie' | 'episode' | 'unknown';
} {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // Common patterns
  const tvShowPattern = /(.+?)[.\s_-]+[Ss](\d{1,2})[Ee](\d{1,3})/;
  const yearPattern = /(.+?)[.\s_(-]+(\d{4})[.\s_)-]/;

  // Try TV show pattern first
  const tvMatch = nameWithoutExt.match(tvShowPattern);
  if (tvMatch) {
    return {
      title: cleanTitle(tvMatch[1]),
      season: parseInt(tvMatch[2], 10),
      episode: parseInt(tvMatch[3], 10),
      type: 'episode'
    };
  }

  // Try movie with year pattern
  const yearMatch = nameWithoutExt.match(yearPattern);
  if (yearMatch) {
    return {
      title: cleanTitle(yearMatch[1]),
      year: parseInt(yearMatch[2], 10),
      type: 'movie'
    };
  }

  // Fallback: just clean the filename
  return {
    title: cleanTitle(nameWithoutExt),
    type: 'unknown'
  };
}

/**
 * Clean title by removing common release info
 */
function cleanTitle(title: string): string {
  return title
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(720p|1080p|2160p|4k|x264|x265|hevc|bluray|brrip|webrip|webdl|hdtv|dvdrip|proper|repack)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export { DirectoryPicker, VIDEO_EXTENSIONS };
