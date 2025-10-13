# TODO: Finalize Torrent Streaming Pipeline

This document outlines the steps required to complete the transition to a robust, server-based torrent streaming pipeline and to remove the legacy WebTorrent implementation.

## Phase 1: Solidify Server-Based Streaming

The current implementation relies on a mock server. This phase focuses on building out the client-side features to support a real streaming server.

- [ ] **Implement Streaming Server Configuration**
    - [ ] Add a new section in the settings page to allow users to configure the URL of their streaming server.
    - [ ] Store the streaming server URL in `Settings.js`.
    - [ ] The `StreamingService` should automatically use the configured URL.

- [ ] **Enhance Error Handling and Recovery**
    - [ ] Implement a "Retry" button on the player error screen that re-initiates the stream with the `StreamingService`.
    - [ ] Add more specific error messages for different failure scenarios (e.g., server not reachable, invalid magnet link, torrent not found).

- [ ] **Add Subtitle Support**
    - [ ] Modify the `StreamingService` to request subtitles from the server.
    - [ ] The streaming server should be responsible for fetching subtitles and providing them in a compatible format (e.g., VTT).
    - [ ] The player should load subtitles from the URL provided by the `StreamingService`.

## Phase 2: Complete Native Torrent Client Integration

The native torrent client offers a fallback for users who do not want to use a streaming server. This phase focuses on making it a first-class citizen in the app.

- [ ] **Implement Streaming Method Selection**
    - [ ] Add a setting to allow users to choose their preferred streaming method: "Server-based" or "Native Client".
    - [ ] The `handleTorrent` function in `app.js` should check this setting and use the appropriate streaming client.

- [ ] **Improve Native Client UI**
    - [ ] The loading screen should display the same level of detail for the native client as it does for the server-based streaming (e.g., download speed, peers, progress).
    - [ ] Ensure that all `SafeToast` notifications are correctly implemented for all events in the `NativeTorrentClient`.

## Phase 3: Full WebTorrent Removal and Cleanup

With the server-based and native clients fully functional, the legacy WebTorrent code can be safely removed.

- [ ] **Delete Legacy Files**
    - [ ] Delete `src/app/lib/streamer.js`.
    - [ ] Delete `src/app/lib/webtorrent-client.js`.

- [ ] **Remove Code References**
    - [ ] Search the entire codebase for any remaining references to `WebTorrent`, `WebTorrentStreamer`, or `parse-torrent` and remove them.
    - [ ] Remove the `<script>` tags for `streamer.js` and `webtorrent-client.js` from `index.html`.

- [ ] **Remove Dependencies**
    - [ ] Remove the `webtorrent` and `parse-torrent` packages from `package.json`.
    - [ ] Run `npm install` to update the `node_modules` directory.

## Phase 4: UI/UX and Final Polish

This phase focuses on improving the user experience of the streaming pipeline.

- [ ] **Refine Loading Screen**
    - [ ] The loading screen should clearly indicate which streaming method is being used ("Connecting to streaming server..." vs. "Connecting to peers...").
    - [ ] Add a "Cancel" button to the loading screen that cleanly stops the streaming process (both server-based and native).

- [ ] **Improve Player Controls**
    - [ ] Ensure that the player controls (play, pause, seek) work correctly with both the server-based and native streaming clients.

## Phase 5: Testing

Thorough testing is required to ensure the new streaming pipeline is robust and reliable.

- [ ] **Unit Tests**
    - [ ] Write unit tests for the `StreamingService` to mock server responses and test all possible states (e.g., success, error, progress).
    - [ ] Write unit tests for the `NativeTorrentClient` to mock native events and test the toast notifications.

- [ ] **End-to-End Tests**
    - [ ] Manually test the entire streaming pipeline with a real streaming server.
    - [ ] Manually test the native torrent client with a variety of torrents.
    - [ ] Test the fallback logic (e.g., if the streaming server is unavailable, does it correctly switch to the native client?).
    - [ ] Test the user settings for streaming method selection.
