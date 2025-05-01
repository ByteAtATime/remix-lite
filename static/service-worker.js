// Cache names
const CACHE_NAME = 'remix-lite-cache-v1';
const RESOURCES_CACHE = 'remix-lite-resources-v1';

const PRECACHE_URLS = ['/', '/favicon.png', '/manifest.json'];

const RUNTIME_CACHE_PATTERNS = [
	// Monaco editor files
	/.*\/monaco-editor\/.*/,
	// Solidity compiler
	/.*soljson-v.*\.js$/
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	const currentCaches = [CACHE_NAME, RESOURCES_CACHE];
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
			})
			.then((cachesToDelete) => {
				return Promise.all(
					cachesToDelete.map((cacheToDelete) => {
						return caches.delete(cacheToDelete);
					})
				);
			})
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	console.log('fetch', event.request.url);
	const shouldCacheResource = RUNTIME_CACHE_PATTERNS.some((pattern) =>
		pattern.test(event.request.url)
	);

	if (event.request.method === 'GET' && shouldCacheResource) {
		event.respondWith(
			caches.open(RESOURCES_CACHE).then((cache) => {
				return cache.match(event.request).then((cachedResponse) => {
					if (cachedResponse) {
						// Return cached response
						return cachedResponse;
					}

					// Fetch, then cache
					return fetch(event.request).then((response) => {
						// Clone the response as it can only be consumed once
						const responseToCache = response.clone();

						// Only cache valid responses
						if (response.ok) {
							cache.put(event.request, responseToCache);
						}

						return response;
					});
				});
			})
		);
	}
});
