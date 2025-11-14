/**
 * Chromecast Plugin
 * Phase 10B.1: Google Cast SDK Integration
 */

import { registerPlugin } from '@capacitor/core';

import type { ChromecastPlugin } from './definitions';

const Chromecast = registerPlugin<ChromecastPlugin>('Chromecast', {
  web: () => import('./web').then(m => new m.ChromecastWeb()),
});

export * from './definitions';
export { Chromecast };
