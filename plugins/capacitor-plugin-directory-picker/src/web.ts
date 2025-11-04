import { WebPlugin } from '@capacitor/core';

import type {
  DirectoryPickerPlugin,
  PickDirectoryResult,
  ListFilesOptions,
  ListFilesResult,
  PersistedDirectoriesResult,
  ReleaseDirectoryOptions,
} from './definitions';

export class DirectoryPickerWeb
  extends WebPlugin
  implements DirectoryPickerPlugin
{
  async pickDirectory(): Promise<PickDirectoryResult> {
    throw this.unimplemented('Directory picker not implemented on web.');
  }

  async listFiles(_options: ListFilesOptions): Promise<ListFilesResult> {
    throw this.unimplemented('File listing not implemented on web.');
  }

  async getPersistedDirectories(): Promise<PersistedDirectoriesResult> {
    throw this.unimplemented('Persisted directories not implemented on web.');
  }

  async releaseDirectory(_options: ReleaseDirectoryOptions): Promise<void> {
    throw this.unimplemented('Release directory not implemented on web.');
  }
}
