#!/usr/bin/env node

/**
 * FlixCapacitor Streaming Server
 * Provides CORS proxy for Academic Torrents and other streaming services
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'FlixCapacitor Streaming Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Academic Torrents CORS Proxy
app.get('/api/proxy/academic-torrents', async (req, res) => {
    try {
        console.log('Proxying request to Academic Torrents...');

        const response = await fetch('https://academictorrents.com/collection/video-lectures.csv');

        if (!response.ok) {
            console.error('Academic Torrents request failed:', response.status, response.statusText);
            return res.status(response.status).json({
                error: 'Failed to fetch from Academic Torrents',
                status: response.status,
                statusText: response.statusText
            });
        }

        const csvData = await response.text();
        console.log(`Successfully fetched CSV data: ${csvData.length} bytes`);

        // Set appropriate headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(csvData);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Generic proxy endpoint for future use
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            error: 'Missing URL parameter',
            usage: '/api/proxy?url=https://example.com'
        });
    }

    try {
        console.log('Proxying request to:', url);

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Proxied request failed',
                url,
                status: response.status
            });
        }

        const contentType = response.headers.get('content-type');
        const data = contentType?.includes('application/json')
            ? await response.json()
            : await response.text();

        res.setHeader('Content-Type', contentType || 'text/plain');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (typeof data === 'object') {
            res.json(data);
        } else {
            res.send(data);
        }

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('⚡ FlixCapacitor Streaming Server');
    console.log('================================');
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Health check:      http://localhost:${PORT}/api/health`);
    console.log(`Academic Torrents: http://localhost:${PORT}/api/proxy/academic-torrents`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
