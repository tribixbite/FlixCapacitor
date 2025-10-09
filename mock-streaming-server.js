/**
 * Mock Streaming API Server
 * Simulates a backend streaming service for development/testing
 *
 * Usage: node mock-streaming-server.js
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory stream storage
const streams = new Map();

// Stream status simulation
const SIMULATION_STEPS = [
    { status: 'downloading', progress: 0, eta: 120, delay: 0 },
    { status: 'downloading', progress: 15, eta: 100, delay: 3000 },
    { status: 'downloading', progress: 35, eta: 80, delay: 6000 },
    { status: 'downloading', progress: 55, eta: 60, delay: 9000 },
    { status: 'downloading', progress: 75, eta: 40, delay: 12000 },
    { status: 'converting', progress: 85, eta: 20, delay: 15000 },
    { status: 'converting', progress: 95, eta: 10, delay: 18000 },
    { status: 'ready', progress: 100, eta: 0, delay: 20000 }
];

/**
 * Generate a random stream ID
 */
function generateStreamId() {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Get stream status based on elapsed time
 */
function getStreamStatus(stream) {
    const elapsed = Date.now() - stream.createdAt;

    // Find appropriate simulation step
    for (let i = SIMULATION_STEPS.length - 1; i >= 0; i--) {
        if (elapsed >= SIMULATION_STEPS[i].delay) {
            const step = SIMULATION_STEPS[i];

            const response = {
                streamId: stream.id,
                status: step.status,
                progress: step.progress,
                eta: step.eta,
                message: getStatusMessage(step.status, step.progress)
            };

            // Add stream URL when ready
            if (step.status === 'ready') {
                response.streamUrl = `http://localhost:${PORT}/streams/${stream.id}/master.m3u8`;
                response.duration = 7200; // 2 hours
                response.downloadSpeed = 5242880; // 5 MB/s
                response.peers = 42;
            } else if (step.status === 'downloading') {
                response.downloadSpeed = Math.floor(Math.random() * 10000000);
                response.peers = Math.floor(Math.random() * 100) + 10;
            }

            return response;
        }
    }

    // Default initial state
    return {
        streamId: stream.id,
        status: 'downloading',
        progress: 0,
        eta: 120,
        message: 'Initializing stream...'
    };
}

/**
 * Get status message
 */
function getStatusMessage(status, progress) {
    switch (status) {
        case 'downloading':
            return `Downloading to server: ${progress}%`;
        case 'converting':
            return `Converting to HLS format: ${progress}%`;
        case 'ready':
            return 'Stream ready to play';
        case 'error':
            return 'Stream error occurred';
        case 'stopped':
            return 'Stream stopped';
        default:
            return 'Processing...';
    }
}

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Start a new stream
app.post('/api/stream/start', (req, res) => {
    const { magnetLink, quality = '720p', fileIndex = 0 } = req.body;

    if (!magnetLink) {
        return res.status(400).json({
            error: 'Missing magnetLink parameter'
        });
    }

    // Validate magnet link format
    if (!magnetLink.startsWith('magnet:')) {
        return res.status(400).json({
            error: 'Invalid magnet link format'
        });
    }

    // Create new stream
    const streamId = generateStreamId();
    const stream = {
        id: streamId,
        magnetLink,
        quality,
        fileIndex,
        createdAt: Date.now(),
        status: 'downloading'
    };

    streams.set(streamId, stream);

    console.log(`[${new Date().toISOString()}] New stream created: ${streamId}`);
    console.log(`  Magnet: ${magnetLink.substring(0, 60)}...`);
    console.log(`  Quality: ${quality}`);

    // Return initial status
    res.status(201).json(getStreamStatus(stream));
});

// Get stream status
app.get('/api/stream/status/:streamId', (req, res) => {
    const { streamId } = req.params;

    const stream = streams.get(streamId);
    if (!stream) {
        return res.status(404).json({
            error: 'Stream not found',
            streamId
        });
    }

    res.json(getStreamStatus(stream));
});

// Stop a stream
app.delete('/api/stream/:streamId', (req, res) => {
    const { streamId } = req.params;

    const stream = streams.get(streamId);
    if (!stream) {
        return res.status(404).json({
            error: 'Stream not found',
            streamId
        });
    }

    streams.delete(streamId);

    console.log(`[${new Date().toISOString()}] Stream stopped: ${streamId}`);

    res.json({
        streamId,
        status: 'stopped',
        message: 'Stream resources released'
    });
});

// List all active streams (debug endpoint)
app.get('/api/streams', (req, res) => {
    const streamList = Array.from(streams.values()).map(stream => ({
        id: stream.id,
        status: getStreamStatus(stream).status,
        createdAt: new Date(stream.createdAt).toISOString(),
        quality: stream.quality
    }));

    res.json({
        count: streamList.length,
        streams: streamList
    });
});

// Serve sample HLS manifest (mock)
app.get('/streams/:streamId/master.m3u8', (req, res) => {
    const { streamId } = req.params;

    const stream = streams.get(streamId);
    if (!stream) {
        return res.status(404).send('Stream not found');
    }

    // Return a basic HLS manifest pointing to Big Buck Bunny (demo video)
    const manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
`;

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(manifest);
});

// Cleanup old streams (run every minute)
setInterval(() => {
    const now = Date.now();
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes

    for (const [streamId, stream] of streams.entries()) {
        if (now - stream.createdAt > MAX_AGE) {
            console.log(`[${new Date().toISOString()}] Cleaning up old stream: ${streamId}`);
            streams.delete(streamId);
        }
    }
}, 60000);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('┌─────────────────────────────────────────┐');
    console.log('│   Mock Streaming API Server Running    │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`\nServer: http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`Streams: http://localhost:${PORT}/api/streams`);
    console.log('\nAPI Endpoints:');
    console.log('  POST   /api/stream/start');
    console.log('  GET    /api/stream/status/:streamId');
    console.log('  DELETE /api/stream/:streamId');
    console.log('\nPress Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
