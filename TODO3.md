# TODO: Final Cleanup and Feature Completion for 100% Independent Streaming

This document outlines the remaining tasks to make the app fully independent for streaming and playing torrent videos, with no dependency on external servers or legacy code.

## Phase 1: Complete Code Cleanup

The previous cleanup was incomplete. The following files and code references must be removed or updated.

- [x] **`src/app/global.js`**:
    - [x] **Line 37**: Remove `WebTorrent = require('webtorrent')`.

- [x] **`src/app/updater.js`**:
    - [x] **Line 4**: Remove `var client = App.WebTorrent`.
    - [x] **Lines 87-95**: Remove the `if (App.settings.UpdateSeed)` block.
    - [x] **Lines 97-114**: Remove the `download` function.

- [x] **`src/app/settings.js`**:
    - [x] **Lines 123-134**: Remove the `Settings.trackers` section.
    - [x] **Line 231**: Remove `Settings.streamingMethod = 'server';`.

- [x] **`src/app/lib/views/torrent_collection.js`**:
    - [x] Delete the file `src/app/lib/views/torrent_collection.js`.

- [x] **`src/app/lib/views/show_detail.js`**:
    - [x] **Line 4**: Remove `var torrentHealth = require('webtorrent-health');`.
    - [x] **Lines 715-755**: Remove the `getTorrentHealth` function.

- [x] **`src/app/lib/views/movie_detail.js`**:
    - [x] **Lines 3-5**: Remove the `torrentHealth` variable and its related variables.
    - [x] **Lines 265-305**: Remove the `renderHealth` function.

- [x] **`src/app/lib/providers/public-domain-provider.js`**:
    - [x] **Lines 412-414**: Remove the `wss://` trackers from the `trackers` array in the `buildMagnetLink` function.

## Phase 2: Feature Implementation

The following features need to be fully implemented to make the app functional.

- [x] **Subtitle Support**:
    - [x] **Line 389**: Implement the `findSubtitles()` method in `src/app/lib/native-torrent-client.js` to find subtitle files within the torrent.
    - [x] **Line 401**: Implement the `downloadSubtitles()` method in `src/app/lib/native-torrent-client.js` to download subtitles from a provider like OpenSubtitles.

- [x] **Player Controls**:
    - [x] **Line 288**: Integrate the `pauseStream()` method in `src/app/lib/native-torrent-client.js` with the video player controls.
    - [x] **Line 302**: Integrate the `resumeStream()` method in `src/app/lib/native-torrent-client.js` with the video player controls.

- [ ] **Search**:
    - [ ] Implement a new, independent search mechanism to replace the `torrent_collection.js` view. This could involve a curated list of public domain torrents or a different approach that doesn't rely on external websites.

## Phase 3: Testing

- [ ] **Write new tests for `native-torrent-client.js`** to ensure that the new subtitle functionality is working correctly and that the client is still able to stream torrents.
- [ ] **End-to-End Tests**:
    - [ ] Manually test the entire streaming pipeline with the native torrent client on a variety of torrents and devices.
    - [ ] Test the player controls (play, pause, seek) with the native client.
    - [ ] Test subtitle support with the native client.

## Phase 4: Documentation Cleanup

- [x] **Review and update all markdown files** to remove references to WebTorrent, server-based streaming, and any other outdated information. The documentation should reflect the app's current state as a 100% independent torrent streaming client.
