# capacitor-plugin-torrent-downloader

Capacitor plugin for torrent downloading using jlibtorrent.

## Features

- Download torrents in the background
- Pause/resume downloads
- Progress tracking with real-time updates
- Foreground service for reliable background downloads
- Configurable download/upload speed limits
- Seeding control

## Installation

```bash
npm install capacitor-plugin-torrent-downloader
npx cap sync
```

## Usage

```typescript
import { TorrentDownload } from 'capacitor-plugin-torrent-downloader';

// Start a download
const { downloadId } = await TorrentDownload.startDownload({
  downloadId: 1,
  magnetUri: 'magnet:?xt=urn:btih:...',
  savePath: '/storage/emulated/0/Download/',
  maxDownloadSpeed: 0, // 0 = unlimited
  maxUploadSpeed: 0
});

// Listen for progress updates
await TorrentDownload.addListener('downloadProgress', (progress) => {
  console.log(`Progress: ${progress.progress}%`);
  console.log(`Speed: ${progress.downloadSpeed} bytes/sec`);
  console.log(`ETA: ${progress.eta} seconds`);
});

// Pause download
await TorrentDownload.pauseDownload({ downloadId });

// Resume download
await TorrentDownload.resumeDownload({ downloadId });

// Cancel and remove
await TorrentDownload.cancelDownload({ downloadId });

// Delete including files
await TorrentDownload.deleteDownload({ downloadId });
```

## API

See [definitions.ts](src/definitions.ts) for full API documentation.

## Platform Support

- ✅ Android (API 24+)
- ❌ iOS (not supported)
- ❌ Web (not supported)

## Requirements

- Android minSdk 24
- jlibtorrent 2.0.8-11
- ARM64 device (ARM32 not supported)

## License

MIT
