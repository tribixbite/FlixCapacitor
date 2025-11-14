/**
 * Service Worker
 * Phase 9B.3: Offline caching and performance optimization
 */

const CACHE_NAME = 'flixcapacitor-v1.2.0';
const RUNTIME_CACHE = 'flixcapacitor-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/main.css',
    '/main.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
    // Cache first, then network
    CACHE_FIRST: 'cache-first',
    // Network first, then cache
    NETWORK_FIRST: 'network-first',
    // Network only
    NETWORK_ONLY: 'network-only',
    // Cache only
    CACHE_ONLY: 'cache-only',
    // Stale while revalidate
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

/**
 * Install event - precache assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Service worker installed');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Precaching failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other schemes
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Determine cache strategy based on request type
    const strategy = getCacheStrategy(url, request);

    event.respondWith(
        handleRequest(request, strategy)
    );
});

/**
 * Determine cache strategy for request
 */
function getCacheStrategy(url, request) {
    // API requests: Network first
    if (url.pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // Images: Cache first
    if (request.destination === 'image') {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // Fonts: Cache first
    if (request.destination === 'font') {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // Scripts and styles: Stale while revalidate
    if (request.destination === 'script' || request.destination === 'style') {
        return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // Documents: Network first
    if (request.destination === 'document') {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // Default: Network first
    return CACHE_STRATEGIES.NETWORK_FIRST;
}

/**
 * Handle request with given strategy
 */
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);

        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);

        case CACHE_STRATEGIES.NETWORK_ONLY:
            return networkOnly(request);

        case CACHE_STRATEGIES.CACHE_ONLY:
            return cacheOnly(request);

        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);

        default:
            return networkFirst(request);
    }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        return new Response('Network error', { status: 503 });
    }
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] Serving from cache (network failed):', request.url);
            return cached;
        }

        console.error('[SW] Network first failed:', error);
        return new Response('Network error', { status: 503 });
    }
}

/**
 * Network only strategy
 */
async function networkOnly(request) {
    return fetch(request);
}

/**
 * Cache only strategy
 */
async function cacheOnly(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    return new Response('Not in cache', { status: 404 });
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    });

    // Return cached version immediately if available
    return cached || fetchPromise;
}

/**
 * Message handler
 */
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(names => {
                return Promise.all(names.map(name => caches.delete(name)));
            })
        );
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then(cache => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});
