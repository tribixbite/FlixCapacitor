# FlixCapacitor Streaming Server

Simple Express server that provides CORS proxy for Academic Torrents and other streaming services.

## Quick Start

```bash
# Start the server
npm run server
```

The server will start on `http://localhost:3001`

## Endpoints

### Health Check
**GET** `/api/health`

Returns server status and version information.

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "service": "FlixCapacitor Streaming Server",
  "version": "1.0.0",
  "timestamp": "2025-10-14T08:10:40.143Z"
}
```

### Academic Torrents Proxy
**GET** `/api/proxy/academic-torrents`

Proxies requests to Academic Torrents video lectures CSV, bypassing CORS restrictions.

```bash
curl http://localhost:3001/api/proxy/academic-torrents
```

Returns: CSV data with educational courses from Academic Torrents

CSV Format:
- `TYPE` - Content type (usually "Course")
- `NAME` - Course title
- `INFOHASH` - 40-character torrent infohash
- `SIZEBYTES` - File size in bytes
- `MIRRORS` - Number of mirrors
- `DOWNLOADERS` - Current downloaders
- `TIMESCOMPLETED` - Total completed downloads
- `DATEADDED` - Unix timestamp when added
- `DATEMODIFIED` - Unix timestamp of last modification

### Generic Proxy
**GET** `/api/proxy?url=<target_url>`

Generic CORS proxy for any URL.

```bash
curl "http://localhost:3001/api/proxy?url=https://example.com"
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production)

```bash
# Run on custom port
PORT=8080 npm run server
```

## Usage with FlixCapacitor App

The mobile app automatically uses this server as a CORS proxy when configured in Settings:

1. Start the streaming server: `npm run server`
2. Open FlixCapacitor app
3. Go to Settings
4. Set "Streaming Server URL" to `http://localhost:3001/api`
5. Navigate to Learning tab
6. Courses will be fetched via the proxy

## Development

### Dependencies

- `express` - Web framework
- `cors` - CORS middleware

Both are already installed in package.json.

### Adding New Proxy Endpoints

Edit `streaming-server.js` and add new routes:

```javascript
app.get('/api/proxy/your-endpoint', async (req, res) => {
    try {
        const response = await fetch('https://your-api.com/data');
        const data = await response.json();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3002 npm run server
```

### CORS Errors

The server includes CORS middleware that allows all origins (`*`). If you need more restrictive CORS:

```javascript
app.use(cors({
    origin: 'http://localhost:5173', // Your app URL
    credentials: true
}));
```

### Module Import Errors

The project uses ES modules (`"type": "module"` in package.json). Make sure to use:
- `import` instead of `require`
- `.js` extension in imports
- ES6 syntax throughout

## Production Deployment

For production, consider:

1. **Environment-based configuration**
```javascript
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
```

2. **Rate limiting**
```bash
npm install express-rate-limit
```

3. **Caching**
```bash
npm install node-cache
```

4. **Process management**
```bash
npm install -g pm2
pm2 start streaming-server.js --name flixcapacitor-server
```

5. **Reverse proxy** (nginx, Caddy, etc.)

## License

Same as FlixCapacitor project.
