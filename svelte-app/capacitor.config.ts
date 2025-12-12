import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.flixcapacitor.mobile',
  appName: 'FlixCapacitor',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a0a0a',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a'
    },
    Keyboard: {
      resize: 'native',
      style: 'dark'
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
