/**
 * Torrent Download Plugin
 * Phase 10A.1: jlibtorrent Capacitor Plugin
 */

import { registerPlugin } from '@capacitor/core';

import type { TorrentDownloadPlugin } from './definitions';

const TorrentDownload = registerPlugin<TorrentDownloadPlugin>('TorrentDownload', {
  web: () => import('./web').then(m => new m.TorrentDownloadWeb()),
});

export * from './definitions';
export { TorrentDownload };
