import { registerPlugin, Capacitor } from '@capacitor/core';

export interface MediaPermissionsPlugin {
  checkPermissions(): Promise<MediaPermissionStatus>;
  requestPermissions(): Promise<MediaPermissionStatus>;
  openSettings(): Promise<{ opened: boolean }>;
}

export type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

export interface MediaPermissionStatus {
  readMediaVideo?: PermissionState;
  readMediaAudio?: PermissionState;
  readMediaVisualUserSelected?: PermissionState;
  storage?: PermissionState;
  granted: boolean;
}

const MediaPermissionsPluginInternal = registerPlugin<MediaPermissionsPlugin>('MediaPermissions', {
  web: {
    checkPermissions: async () => ({ granted: true }),
    requestPermissions: async () => ({ granted: true }),
    openSettings: async () => ({ opened: false })
  }
});

class MediaPermissionsManager {
  async ensurePermissions(): Promise<{ granted: boolean; permanentlyDenied: boolean }> {
    if (Capacitor.getPlatform() !== 'android') {
      return { granted: true, permanentlyDenied: false };
    }

    try {
      const status = await this.getStatus();
      console.log('[Permissions] Current status:', JSON.stringify(status));

      if (status.granted) {
        console.log('[Permissions] Media permissions already granted');
        return { granted: true, permanentlyDenied: false };
      }

      const canPrompt = this.canPrompt(status);
      console.log('[Permissions] Can prompt?', canPrompt);

      if (!canPrompt) {
        console.warn('[Permissions] Media permissions permanently denied');
        return { granted: false, permanentlyDenied: true };
      }

      console.log('[Permissions] Requesting media permissions via system dialog...');
      const requestStatus = await MediaPermissionsPluginInternal.requestPermissions();
      console.log('[Permissions] Request result:', JSON.stringify(requestStatus));

      if (requestStatus.granted) {
        console.log('[Permissions] Media permissions granted');
        return { granted: true, permanentlyDenied: false };
      }

      console.log('[Permissions] User denied media permissions');
      return { granted: false, permanentlyDenied: false };

    } catch (error) {
      console.error('[Permissions] Failed to check/request permissions:', error);
      return { granted: false, permanentlyDenied: false };
    }
  }

  async getStatus(): Promise<MediaPermissionStatus> {
    try {
      return await MediaPermissionsPluginInternal.checkPermissions();
    } catch (error) {
      console.error('[Permissions] Failed to check permissions:', error);
      return { granted: false };
    }
  }

  async requestPermissions(): Promise<MediaPermissionStatus> {
    try {
      return await MediaPermissionsPluginInternal.requestPermissions();
    } catch (error) {
      console.error('[Permissions] Failed to request permissions:', error);
      return { granted: false };
    }
  }

  async openSettings(): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'android') {
      return false;
    }

    try {
      const result = await MediaPermissionsPluginInternal.openSettings();
      return result.opened;
    } catch (error) {
      console.error('[Permissions] Failed to open settings:', error);
      return false;
    }
  }

  async isPermanentlyDenied(): Promise<boolean> {
    const status = await this.getStatus();

    if (status.granted) {
      return false;
    }

    return !this.canPrompt(status);
  }

  private canPrompt(status: MediaPermissionStatus): boolean {
    // For Android 14+
    if (status.readMediaVideo !== undefined || status.readMediaAudio !== undefined || status.readMediaVisualUserSelected !== undefined) {
      const videoState = status.readMediaVideo || 'denied';
      const audioState = status.readMediaAudio || 'denied';
      const visualSelectedState = status.readMediaVisualUserSelected || 'denied';

      console.log('[Permissions] Android 14+ - videoState:', videoState, 'audioState:', audioState, 'visualSelectedState:', visualSelectedState);

      const result = videoState === 'prompt' ||
             videoState === 'prompt-with-rationale' ||
             audioState === 'prompt' ||
             audioState === 'prompt-with-rationale' ||
             visualSelectedState === 'prompt' ||
             visualSelectedState === 'prompt-with-rationale';

      console.log('[Permissions] Android 14+ canPrompt result:', result);
      return result;
    }

    // For Android 12 and below
    if (status.storage !== undefined) {
      console.log('[Permissions] Android 12- - storage:', status.storage);
      const result = status.storage === 'prompt' || status.storage === 'prompt-with-rationale';
      console.log('[Permissions] Android 12- canPrompt result:', result);
      return result;
    }

    console.log('[Permissions] No permission status fields, returning false');
    return false;
  }
}

const MediaPermissions = new MediaPermissionsManager();

export default MediaPermissions;
