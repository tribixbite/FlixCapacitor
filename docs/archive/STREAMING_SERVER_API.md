# Streaming Server API Requirements

## Academic Torrents Proxy Endpoint

The mobile app now routes Academic Torrents requests through the streaming server to bypass CORS restrictions.

### Endpoint

**GET** `/proxy/academic-torrents`

### Purpose

Acts as a CORS proxy to fetch the Academic Torrents video lectures CSV file.

### Implementation

The endpoint should:

1. Fetch data from: `https://academictorrents.com/collection/video-lectures.csv`
2. Return the CSV data as-is with appropriate headers
3. Handle errors gracefully

### Example Implementation (Node.js/Express)

```javascript
app.get('/proxy/academic-torrents', async (req, res) => {
    try {
        const response = await fetch('https://academictorrents.com/collection/video-lectures.csv');

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Failed to fetch from Academic Torrents',
                status: response.status
            });
        }

        const csvData = await response.text();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(csvData);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});
```

### CSV Format

The CSV contains the following columns:
- `TYPE` - Content type (usually "video")
- `NAME` - Course title
- `INFOHASH` - Torrent infohash (40 character SHA-1)
- `SIZEBYTES` - File size in bytes
- `MIRRORS` - Number of mirrors
- `DOWNLOADERS` - Current downloaders
- `TIMESCOMPLETED` - Total completed downloads
- `DATEADDED` - Unix timestamp when added
- `DATEMODIFIED` - Unix timestamp of last modification

### Fallback Behavior

If the proxy endpoint is not available or fails:
1. App attempts direct fetch (will fail due to CORS in browser)
2. Falls back to 6 demo courses with fake infohashes for UI testing

### Benefits

- Bypasses browser CORS restrictions
- Server-to-server communication works reliably
- Can add caching, rate limiting, or filtering on server side
- Consistent with existing streaming architecture
