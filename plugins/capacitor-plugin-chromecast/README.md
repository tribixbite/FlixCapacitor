# capacitor-plugin-chromecast

Capacitor plugin for Google Cast (Chromecast) integration.

## Features

- Cast video content to Chromecast devices
- Device discovery and connection management
- Playback controls (play, pause, seek, stop)
- Volume and mute control
- Subtitle and audio track selection
- Real-time media status updates
- Session state management
- Custom receiver applications support

## Installation

```bash
npm install capacitor-plugin-chromecast
npx cap sync
```

## Usage

```typescript
import { Chromecast } from 'capacitor-plugin-chromecast';

// Initialize Cast SDK
await Chromecast.initialize({
  receiverApplicationId: 'CC1AD845', // Default media receiver
  autoJoinPolicy: 'ORIGIN_SCOPED',
  resumeSavedSession: true
});

// Start device discovery
await Chromecast.startDiscovery();

// Listen for available devices
await Chromecast.addListener('deviceDiscovered', (device) => {
  console.log(`Found device: ${device.name}`);
});

// Connect to a device
await Chromecast.connect({ deviceId: device.id });

// Load media
await Chromecast.loadMedia({
  url: 'https://example.com/video.mp4',
  contentType: 'video/mp4',
  title: 'Movie Title',
  subtitle: 'Movie Description',
  posterUrl: 'https://example.com/poster.jpg',
  currentTime: 0,
  autoplay: true,
  subtitles: [
    {
      id: 1,
      url: 'https://example.com/subtitles_en.vtt',
      name: 'English',
      language: 'en',
      type: 'vtt',
      isDefault: true
    }
  ]
});

// Playback controls
await Chromecast.play();
await Chromecast.pause();
await Chromecast.seek({ position: 120 }); // Seek to 2 minutes
await Chromecast.setVolume({ level: 0.5 }); // 50% volume
await Chromecast.setMuted({ muted: true });

// Listen for media status changes
await Chromecast.addListener('mediaStatusChanged', (status) => {
  console.log(`Player state: ${status.playerState}`);
  console.log(`Current time: ${status.currentTime}`);
  console.log(`Duration: ${status.duration}`);
});

// Listen for session state changes
await Chromecast.addListener('sessionStateChanged', (state) => {
  console.log(`Session state: ${state.state}`);
  if (state.isConnected) {
    console.log(`Connected to: ${state.device?.name}`);
  }
});

// Get current status
const mediaStatus = await Chromecast.getMediaStatus();
const sessionState = await Chromecast.getSessionState();

// Disconnect
await Chromecast.disconnect();

// Stop discovery
await Chromecast.stopDiscovery();
```

## API

See [definitions.ts](src/definitions.ts) for full API documentation.

## Platform Support

- ✅ Android (API 21+)
- ❌ iOS (not supported)
- ❌ Web (not supported)

## Requirements

- Android minSdk 21 (Android 5.0+)
- Google Play Services Cast Framework 21.3.0+
- Chromecast device on same network

## Setup

### Android

Add the following to your `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <!-- Cast Framework metadata -->
    <meta-data
        android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
        android:value="com.flixcapacitor.chromecast.CastOptionsProvider" />
</application>
```

## License

MIT
