import { registerPlugin } from '@capacitor/core';

import type { TorrentStreamerPlugin } from './definitions';

const TorrentStreamer = registerPlugin<TorrentStreamerPlugin>(
  'TorrentStreamer',
  {
    web: () => import('./web').then(m => new m.TorrentStreamerWeb()),
  },
);

export * from './definitions';
export { TorrentStreamer };
