import { registerPlugin } from '@capacitor/core';

import type { DirectoryPickerPlugin } from './definitions';

const DirectoryPicker = registerPlugin<DirectoryPickerPlugin>(
  'DirectoryPicker',
  {
    web: () => import('./web').then((m) => new m.DirectoryPickerWeb()),
  },
);

export * from './definitions';
export { DirectoryPicker };
