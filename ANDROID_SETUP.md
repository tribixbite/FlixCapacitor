# Android Setup Guide

## Streaming Server Configuration for Android Devices

When running the FlixCapacitor app as an APK on an Android device, `localhost` refers to the phone itself, not your development machine. To enable the Learning tab and Academic Torrents integration, configure the app to use your development machine's LAN IP address.

## Step 1: Start the Streaming Server

On your development machine (Termux):

```bash
npm run server
```

This starts the streaming server on port 3001, listening on all network interfaces (0.0.0.0).

## Step 2: Find Your Dev Machine's IP Address

Run one of these commands on your dev machine:

```bash
# On Android/Termux
ip addr show | grep "inet "

# Or check WiFi interface specifically
ip addr show wlan0 | grep "inet "
```

Look for an IP like `192.168.1.100` or `10.0.0.5` (your local network IP).

## Step 3: Configure the App

In the FlixCapacitor app:

1. Go to **Settings**
2. Find **Streaming Server URL**
3. Change from: `http://localhost:3001/api`
4. Change to: `http://YOUR_IP_ADDRESS:3001/api`

**Example**: If your IP is `192.168.1.100`, use:
```
http://192.168.1.100:3001/api
```

## Step 4: Test the Connection

1. Go to the **Learning** tab
2. Courses should now load from Academic Torrents (100+ courses)
3. Play button should work with real infohashes

## Troubleshooting

### Courses Still Not Loading

**Check server is running:**
```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok",...}`

**Check server is accessible from network:**
```bash
# From another device on same WiFi
curl http://YOUR_IP_ADDRESS:3001/api/health
```

### Connection Refused

**Firewall blocking port 3001:**
```bash
# Allow port 3001 (if using iptables)
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

**Server not binding to all interfaces:**
- Check `streaming-server.js` line 50 - should be `'0.0.0.0'` not `'localhost'`

### WiFi Network Issues

- Ensure both devices are on the **same WiFi network**
- Some networks block device-to-device communication (hotel/corporate WiFi)
- Try using a mobile hotspot if needed

## Production Deployment

For production, you would:
1. Deploy the streaming server to a cloud provider (Heroku, AWS, etc.)
2. Use a permanent URL like `https://your-app.com/api`
3. Update the default streaming server URL in the app settings

## Why This Server Exists

The streaming server acts as a **CORS proxy** for Academic Torrents:
- Academic Torrents API blocks direct browser requests (CORS policy)
- The proxy server fetches data server-side and forwards it to the app
- This allows the Learning tab to display 100+ real educational courses
- Without it, the app falls back to 6 demo courses with fake infohashes

## Default Settings

The app defaults to `http://localhost:3001/api` which works when:
- Running in development browser (not APK)
- Testing on the same machine running the server

For Android APK, you **must** change to your LAN IP address.
