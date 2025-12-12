import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network, type ConnectionStatus } from '@capacitor/network';

/**
 * Platform detection and native feature utilities
 */
export const platform = {
  isNative: Capacitor.isNativePlatform(),
  isAndroid: Capacitor.getPlatform() === 'android',
  isIOS: Capacitor.getPlatform() === 'ios',
  isWeb: Capacitor.getPlatform() === 'web',

  get canUseHaptics() {
    return this.isNative;
  },

  get canUseStatusBar() {
    return this.isNative;
  }
};

/**
 * Svelte 5 hook for status bar control
 */
export function useStatusBar() {
  async function setDark() {
    if (!platform.canUseStatusBar) return;
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
  }

  async function setLight() {
    if (!platform.canUseStatusBar) return;
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  }

  async function hide() {
    if (!platform.canUseStatusBar) return;
    await StatusBar.hide();
  }

  async function show() {
    if (!platform.canUseStatusBar) return;
    await StatusBar.show();
  }

  async function setColor(color: string) {
    if (!platform.canUseStatusBar) return;
    await StatusBar.setBackgroundColor({ color });
  }

  return { setDark, setLight, hide, show, setColor };
}

/**
 * Svelte 5 hook for haptic feedback
 */
export function useHaptics() {
  async function impact(style: ImpactStyle = ImpactStyle.Medium) {
    if (!platform.canUseHaptics) return;
    await Haptics.impact({ style });
  }

  async function notification(type: NotificationType = NotificationType.Success) {
    if (!platform.canUseHaptics) return;
    await Haptics.notification({ type });
  }

  async function vibrate(duration = 300) {
    if (!platform.canUseHaptics) return;
    await Haptics.vibrate({ duration });
  }

  async function selectionStart() {
    if (!platform.canUseHaptics) return;
    await Haptics.selectionStart();
  }

  async function selectionChanged() {
    if (!platform.canUseHaptics) return;
    await Haptics.selectionChanged();
  }

  async function selectionEnd() {
    if (!platform.canUseHaptics) return;
    await Haptics.selectionEnd();
  }

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    ImpactStyle,
    NotificationType
  };
}

/**
 * Svelte 5 hook for network status
 */
export function useNetwork() {
  let status = $state<ConnectionStatus | null>(null);
  let isOnline = $derived(status?.connected ?? true);
  let connectionType = $derived(status?.connectionType ?? 'unknown');
  let isWifi = $derived(connectionType === 'wifi');
  let isCellular = $derived(connectionType === 'cellular');

  $effect(() => {
    let listener: { remove: () => void } | null = null;

    async function init() {
      // Get initial status
      status = await Network.getStatus();

      // Listen for changes
      listener = await Network.addListener('networkStatusChange', (newStatus) => {
        status = newStatus;
      });
    }

    init();

    return () => {
      listener?.remove();
    };
  });

  return {
    get status() { return status; },
    get isOnline() { return isOnline; },
    get connectionType() { return connectionType; },
    get isWifi() { return isWifi; },
    get isCellular() { return isCellular; }
  };
}
