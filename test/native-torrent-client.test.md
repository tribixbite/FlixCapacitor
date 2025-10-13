# NativeTorrentClient Test Plan

## Overview
The NativeTorrentClient wraps the Capacitor TorrentStreamer plugin. Full unit testing requires mocking the Capacitor plugin, which is complex. This document outlines the test plan and manual testing procedures.

## Manual Testing Checklist

### Initialization
- [ ] Client initializes without errors
- [ ] Event listeners are properly set up
- [ ] initialized flag is set to true
- [ ] Repeated initialization is handled gracefully

### Stream Start
- [ ] startStream() properly initiates torrent
- [ ] Progress callback is called with updates
- [ ] Metadata event is received and logged
- [ ] Ready event is received with stream URL
- [ ] Error event is handled gracefully
- [ ] Toast notifications appear for each event

### Stream Progress
- [ ] Progress events update loading toast
- [ ] Progress percentage is calculated correctly
- [ ] Peer count is displayed
- [ ] Download speed is formatted correctly
- [ ] Toast updates are throttled appropriately

### Stream Stop
- [ ] stopStream() successfully stops torrent
- [ ] Stream state is cleaned up
- [ ] Loading toast is closed
- [ ] Stopped event is received

### Toast Notifications
- [ ] SafeToast.peer() called on metadata event
- [ ] SafeToast.success() called on ready event
- [ ] SafeToast.loading() creates progress toast
- [ ] SafeToast.update() updates progress
- [ ] SafeToast.error() called on errors
- [ ] SafeToast.info() called when stream stops
- [ ] SafeToast.close() properly closes toasts

### Error Handling
- [ ] Network errors show appropriate toast
- [ ] Invalid magnet links are handled
- [ ] Plugin unavailable errors are caught
- [ ] All errors are logged to console

### Utility Functions
- [ ] formatBytes() correctly formats sizes
- [ ] formatSpeed() correctly formats speeds
- [ ] estimateTimeRemaining() calculates time correctly

### Cleanup
- [ ] destroy() stops active stream
- [ ] destroy() removes all event listeners
- [ ] destroy() resets initialization state
- [ ] Resources are properly released

## Unit Test Implementation Plan

### Required Mocks
```javascript
// Mock Capacitor TorrentStreamer plugin
const mockTorrentStreamer = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getStatus: vi.fn(),
  addListener: vi.fn((event, handler) => ({
    remove: vi.fn()
  }))
};

// Mock window.App.SafeToast
const mockSafeToast = {
  peer: vi.fn(),
  success: vi.fn(),
  loading: vi.fn(),
  update: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  close: vi.fn()
};
```

### Test Cases to Implement

#### 1. Initialization Tests
```javascript
describe('NativeTorrentClient - Initialization', () => {
  it('should initialize successfully');
  it('should set up event listeners');
  it('should handle repeated initialization');
});
```

#### 2. Stream Management Tests
```javascript
describe('NativeTorrentClient - Stream Management', () => {
  it('should start stream with valid magnet URI');
  it('should handle stream start errors');
  it('should stop active stream');
  it('should handle stop errors gracefully');
});
```

#### 3. Event Handler Tests
```javascript
describe('NativeTorrentClient - Event Handlers', () => {
  it('should handle metadata event');
  it('should handle ready event');
  it('should handle progress events');
  it('should handle error events');
  it('should handle stopped event');
});
```

#### 4. Toast Notification Tests
```javascript
describe('NativeTorrentClient - Toast Notifications', () => {
  it('should show peer toast on metadata');
  it('should show success toast on ready');
  it('should create loading toast on progress');
  it('should update loading toast with progress');
  it('should show error toast on failure');
  it('should close loading toast when complete');
});
```

#### 5. Utility Function Tests
```javascript
describe('NativeTorrentClient - Utilities', () => {
  it('should format bytes correctly');
  it('should format speed correctly');
  it('should estimate time remaining correctly');
  it('should handle zero/invalid values gracefully');
});
```

#### 6. Cleanup Tests
```javascript
describe('NativeTorrentClient - Cleanup', () => {
  it('should destroy and stop active stream');
  it('should remove all event listeners');
  it('should reset initialization state');
  it('should handle destroy when not initialized');
});
```

## Integration Testing

### Test with Real Capacitor Plugin
1. Build and deploy to Android device
2. Test with various magnet links
3. Monitor console for proper event flow
4. Verify toast notifications appear
5. Test error scenarios (invalid links, network issues)
6. Verify cleanup on app background/close

### Test with handleTorrent()
1. Set streaming method to 'native' in settings
2. Attempt to stream various content
3. Verify progress is displayed
4. Test cancel functionality
5. Verify proper cleanup

## Known Limitations
- Full unit testing requires Capacitor plugin mocking
- Some events are hardware-dependent (peer connections)
- Time estimation accuracy depends on network conditions
- Toast notification timing may vary

## Future Improvements
- Implement comprehensive Capacitor plugin mocks
- Add performance benchmarking tests
- Add memory leak detection tests
- Implement automated E2E tests with real torrents
