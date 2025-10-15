import { WebPlugin } from '@capacitor/core';

import type {
  TorrentStreamerPlugin,
  StartOptions,
  StartResult,
  TorrentStatus,
  ExternalPlayerOptions,
  ExternalPlayerResult,
  VideoFileListResult,
  SelectFileOptions,
  SelectFileResult,
} from './definitions';

export class TorrentStreamerWeb
  extends WebPlugin
  implements TorrentStreamerPlugin
{
  async start(_options: StartOptions): Promise<StartResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async stop(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  async pause(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  async resume(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  async getStatus(): Promise<TorrentStatus> {
    throw this.unimplemented('Not implemented on web.');
  }

  async getVideoFileList(): Promise<VideoFileListResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async selectFile(_options: SelectFileOptions): Promise<SelectFileResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async openExternalPlayer(
    _options: ExternalPlayerOptions,
  ): Promise<ExternalPlayerResult> {
    throw this.unimplemented('Not implemented on web.');
  }
}
