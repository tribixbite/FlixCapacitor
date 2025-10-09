# Streaming Architecture Decision

## Problem Statement

The desktop version of Popcorn Time uses WebTorrent for client-side P2P streaming. This approach has critical limitations on mobile:

1. **App Store Policies:** Both Apple App Store and Google Play Store prohibit P2P file sharing apps
2. **Network Restrictions:** Mobile networks often block or throttle P2P traffic
3. **Battery Drain:** P2P protocols are energy-intensive
4. **Background Limitations:** iOS/Android restrict background network activity
5. **Legal Concerns:** Direct P2P streaming raises legal liability issues

## Architecture Decision

**We will pivot from client-side P2P to server-based streaming.**

### New Architecture Flow

```
┌─────────────┐
│   Mobile    │
│     App     │
└──────┬──────┘
       │ 1. Submit magnet link
       ▼
┌─────────────────────────┐
│  Streaming API Server   │
│  (Backend Service)      │
└──────┬──────────────────┘
       │ 2. Download via BitTorrent
       │ 3. Convert to HLS/DASH
       ▼
┌─────────────────────────┐
│   CDN / File Storage    │
└──────┬──────────────────┘
       │ 4. Stream HLS segments
       ▼
┌─────────────┐
│   Mobile    │
│   Player    │
└─────────────┘
```

### Components

1. **Mobile App (Client)**
   - Submits magnet links to API
   - Polls for download/conversion status
   - Plays HLS/DASH streams via Video.js

2. **Streaming API Server (Backend)**
   - Receives magnet links
   - Downloads torrents via BitTorrent client
   - Converts video to HLS/DASH format
   - Serves stream segments
   - Manages cleanup/expiration

3. **Storage/CDN (Optional)**
   - Stores temporary HLS segments
   - Delivers video content to clients
   - Can be local or cloud-based (S3, etc.)

## API Specification

### Endpoint 1: Start Stream

**Request:**
```http
POST /api/stream/start
Content-Type: application/json

{
  "magnetLink": "magnet:?xt=urn:btih:...",
  "quality": "720p",
  "fileIndex": 0
}
```

**Response:**
```json
{
  "streamId": "abc123",
  "status": "downloading",
  "progress": 0,
  "eta": 120,
  "message": "Preparing stream..."
}
```

### Endpoint 2: Get Stream Status

**Request:**
```http
GET /api/stream/status/{streamId}
```

**Response:**
```json
{
  "streamId": "abc123",
  "status": "ready",
  "progress": 100,
  "streamUrl": "https://cdn.example.com/streams/abc123/master.m3u8",
  "downloadSpeed": 5242880,
  "peers": 42,
  "duration": 7200
}
```

### Endpoint 3: Stop Stream

**Request:**
```http
DELETE /api/stream/{streamId}
```

**Response:**
```json
{
  "streamId": "abc123",
  "status": "stopped",
  "message": "Stream resources released"
}
```

### Status Values

- `downloading` - Torrent is being downloaded
- `converting` - Video is being converted to HLS
- `ready` - Stream is ready to play
- `error` - An error occurred
- `stopped` - Stream was manually stopped

## Implementation Plan

### Phase 4A: Client-Side (Mobile App)

1. **Create `StreamingService.js`**
   - HTTP client for streaming API
   - Status polling with exponential backoff
   - Error handling and retry logic

2. **Create Mock API Server**
   - Express.js server with mock endpoints
   - Returns realistic responses with delays
   - Serves sample HLS streams

3. **Refactor `streamer.js`**
   - Replace WebTorrent logic with StreamingService
   - Handle status updates
   - Pass HLS URL to player

4. **Update Player**
   - Ensure Video.js HLS support
   - Handle stream buffering
   - Show download progress UI

### Phase 4B: Backend Service (Future Work)

The backend streaming server is out of scope for this mobile conversion but would include:

1. **Technologies:**
   - Node.js + Express or Python + FastAPI
   - WebTorrent CLI or libtorrent for downloads
   - FFmpeg for HLS conversion
   - Redis for session management
   - S3/local storage for segments

2. **Features:**
   - Queue management for concurrent streams
   - Automatic cleanup after timeout
   - Rate limiting and authentication
   - Quality selection (720p, 1080p, etc.)
   - Subtitle extraction and conversion

3. **Deployment:**
   - Docker containerization
   - Kubernetes for scaling
   - CDN integration
   - Monitoring and logging

## Security Considerations

1. **Authentication:** API should require auth tokens
2. **Rate Limiting:** Prevent abuse of streaming service
3. **Content Validation:** Verify magnet links before processing
4. **Expiration:** Auto-delete streams after 24 hours
5. **HTTPS Only:** All communication must be encrypted
6. **User Isolation:** Each user's streams are isolated

## Legal Considerations

**IMPORTANT:** This architecture does NOT resolve legal issues around copyrighted content. The streaming server would still download copyrighted material via BitTorrent.

**Recommended Approach:**
- Users must host their own streaming server
- App should allow custom API endpoint configuration
- Include prominent legal disclaimers
- Consider requiring users to authenticate their own server

## Benefits of Server-Based Streaming

✅ **App Store Compliant:** No P2P on device
✅ **Better Performance:** Server has faster network
✅ **Battery Efficient:** Minimal mobile processing
✅ **Reliable Streaming:** Server handles seed availability
✅ **Quality Control:** Server can transcode to optimal quality
✅ **Background Support:** Server continues downloading when app is backgrounded

## Drawbacks

❌ **Infrastructure Cost:** Requires running backend servers
❌ **Single Point of Failure:** Server downtime = no streaming
❌ **Bandwidth Costs:** Server must handle upload traffic
❌ **Latency:** Adds time for server-side download before playback
❌ **Privacy:** User streaming data visible to server operator

## Mock Server for Development

For Phase 4 development, we'll create a mock server that:

1. Returns realistic JSON responses
2. Simulates download progress (0% → 100%)
3. Serves a sample HLS stream
4. Allows testing all UI states

**Sample Mock Response Timeline:**
- 0s: `{"status": "downloading", "progress": 0}`
- 5s: `{"status": "downloading", "progress": 25}`
- 10s: `{"status": "downloading", "progress": 50}`
- 15s: `{"status": "converting", "progress": 75}`
- 20s: `{"status": "ready", "streamUrl": "..."}`

## Alternative: Hybrid Approach

For future consideration, a hybrid model could:

1. Use server-based for initial buffering
2. Fall back to WebTorrent on desktop clients
3. Allow user to choose streaming method
4. Enable offline downloads on mobile via server

## Conclusion

Server-based streaming is the **only viable path** for mobile app store distribution. While it adds backend complexity, it's necessary for legal compliance and mobile platform requirements.

**Next Steps:**
1. Implement mock streaming API
2. Create StreamingService.js client
3. Integrate with existing UI
4. Test with sample HLS streams
5. Document server deployment guide
