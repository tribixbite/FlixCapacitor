/**
 * Media Permissions Manager
 * Handles contextual permission requests for Android media access
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

// Type Definitions
export interface MediaPermissionsPlugin {
  checkPermissions(): Promise<MediaPermissionStatus>;
  requestPermissions(): Promise<MediaPermissionStatus>;
  openSettings(): Promise<{ opened: boolean }>;
}

export type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

export interface MediaPermissionStatus {
  readMediaVideo?: PermissionState;
  readMediaAudio?: PermissionState;
  storage?: PermissionState;
  granted: boolean;
}

// Plugin Registration
const MediaPermissionsPluginInternal = registerPlugin<MediaPermissionsPlugin>('MediaPermissions', {
  web: {
    checkPermissions: async () => ({ granted: true }),
    requestPermissions: async () => ({ granted: true }),
    openSettings: async () => ({ opened: false })
  }
});

// Permission Manager Class
class MediaPermissionsManager {

  /**
   * Ensures media permissions are granted, requesting if necessary.
   * This is the primary method for contextual "auto-prompting".
   *
   * @returns Object with granted status and whether permissions are permanently denied
   *
   * @example
   * const { granted, permanentlyDenied } = await MediaPermissions.ensurePermissions();
   * if (granted) {
   *   // Proceed with media access
   * } else if (permanentlyDenied) {
   *   // Show settings button
   * } else {
   *   // User denied but can be prompted again
   * }
   */
  async ensurePermissions(): Promise<{ granted: boolean; permanentlyDenied: boolean }> {
    if (Capacitor.getPlatform() !== 'android') {
      return { granted: true, permanentlyDenied: false };
    }

    try {
      const status = await this.getStatus();

      if (status.granted) {
        console.log('[Permissions] Media permissions already granted');
        return { granted: true, permanentlyDenied: false };
      }

      // Check if permanently denied (user clicked "Don't ask again")
      if (!this.canPrompt(status)) {
        console.warn('[Permissions] Media permissions permanently denied');
        return { granted: false, permanentlyDenied: true };
      }

      // Show system permission dialog (status is 'prompt' or 'prompt-with-rationale')
      console.log('[Permissions] Requesting media permissions via system dialog...');
      const requestStatus = await MediaPermissionsPluginInternal.requestPermissions();

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

  /**
   * Checks the current status of media permissions without prompting.
   */
  async getStatus(): Promise<MediaPermissionStatus> {
    if (Capacitor.getPlatform() !== 'android') {
      return { granted: true };
    }

    try {
      return await MediaPermissionsPluginInternal.checkPermissions();
    } catch (error) {
      console.error('[Permissions] Failed to check permissions:', error);
      return { granted: false };
    }
  }

  /**
   * Requests permissions explicitly (shows system dialog).
   * Use ensurePermissions() instead for most cases.
   */
  async requestPermissions(): Promise<MediaPermissionStatus> {
    if (Capacitor.getPlatform() !== 'android') {
      return { granted: true };
    }

    try {
      return await MediaPermissionsPluginInternal.requestPermissions();
    } catch (error) {
      console.error('[Permissions] Failed to request permissions:', error);
      return { granted: false };
    }
  }

  /**
   * Opens app settings where user can manually grant permissions.
   * Use this when permissions are permanently denied.
   */
  async openSettings(): Promise<boolean> {
    try {
      const result = await MediaPermissionsPluginInternal.openSettings();
      return result.opened;
    } catch (error) {
      console.error('[Permissions] Failed to open settings:', error);
      return false;
    }
  }

  /**
   * Determines if we can show a permission prompt to the user.
   */
  private canPrompt(status: MediaPermissionStatus): boolean {
    // For Android 13+
    if (status.readMediaVideo !== undefined || status.readMediaAudio !== undefined) {
      const videoState = status.readMediaVideo || 'denied';
      const audioState = status.readMediaAudio || 'denied';

      return videoState === 'prompt' ||
             videoState === 'prompt-with-rationale' ||
             audioState === 'prompt' ||
             audioState === 'prompt-with-rationale';
    }

    // For Android 12 and below
    if (status.storage !== undefined) {
      return status.storage === 'prompt' || status.storage === 'prompt-with-rationale';
    }

    return false;
  }

  /**
   * Checks if permissions are permanently denied (user must go to settings).
   */
  async isPermanentlyDenied(): Promise<boolean> {
    const status = await this.getStatus();

    if (status.granted) {
      return false;
    }

    return !this.canPrompt(status);
  }
}

// Export Singleton Instance
export const MediaPermissions = new MediaPermissionsManager();
