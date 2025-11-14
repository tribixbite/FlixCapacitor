# capacitor-plugin-torrent-downloader

Capacitor plugin for torrent downloading using jlibtorrent.

## Features

- Download torrents in the background
- Pause/resume downloads
- Progress tracking with real-time updates
- Foreground service for reliable background downloads
- Configurable download/upload speed limits
- Seeding control
- Storage management and disk space checking
- File integrity verification (SHA-256)
- Automatic cleanup of incomplete/old downloads

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

// Storage Management (Phase 10A.2)

// Check storage info
const storageInfo = await TorrentDownload.getStorageInfo();
console.log(`Free space: ${storageInfo.freeFormatted}`);
console.log(`Warning: ${storageInfo.needsWarning}`);

// Check if enough space before download
const spaceCheck = await TorrentDownload.checkStorageSpace({
  requiredBytes: 1024 * 1024 * 1024 // 1GB
});
if (!spaceCheck.hasEnoughSpace) {
  console.log(`Need to free up: ${spaceCheck.recommendedCleanupFormatted}`);
}

// Clean up incomplete downloads
const cleanup = await TorrentDownload.cleanupIncompleteDownloads();
console.log(`Freed: ${cleanup.bytesFreedFormatted}`);

// Clean up downloads older than 30 days
const oldCleanup = await TorrentDownload.cleanupOldDownloads({
  maxAgeMillis: 30 * 24 * 60 * 60 * 1000
});

// Verify file integrity
const integrity = await TorrentDownload.verifyFileIntegrity({
  filePath: '/path/to/file.mp4',
  expectedHash: 'abc123...'
});
console.log(`File valid: ${integrity.valid}`);

// Calculate file hash
const hash = await TorrentDownload.calculateFileHash({
  filePath: '/path/to/file.mp4'
});
console.log(`SHA-256: ${hash.hash}`);
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
