// Service Worker para InterTravel
// Cache estratégico para máximo rendimiento

const CACHE_NAME = 'intertravel-v1.0.0';
const STATIC_CACHE = 'intertravel-static-v1';
const DYNAMIC_CACHE = 'intertravel-dynamic-v1';
const API_CACHE = 'intertravel-api-v1';

// Recursos críticos para cache inmediato
const STATIC_ASSETS = [
  '/',
  '/paquetes',
  '/opiniones',
  '/offline',
  '/favicon.ico',
  '/logo-intertravel.svg',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/js/app.js'
];

// Patrones de URLs para diferentes estrategias de cache
const CACHE_STRATEGIES = {
  // Cache First: Recursos estáticos
  CACHE_FIRST: [
    /\/_next\/static\//,
    /\/favicon\./,
    /\/logo-/,
    /\/android-chrome-/,
    /\/apple-touch-icon/,
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/
  ],
  
  // Network First: Contenido dinámico
  NETWORK_FIRST: [
    /\/api\/packages/,
    /\/api\/reviews/,
    /\/paquetes\//,
    /\/opiniones/
  ],
  
  // Stale While Revalidate: Balance entre velocidad y frescura
  STALE_WHILE_REVALIDATE: [
    /\/api\/config/,
    /\/api\/stats/,
    /\/$/ // Homepage
  ]
};

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Service Worker: Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completa');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Error en instalación', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Service Worker: Eliminando cache antiguo', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control inmediato
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker: Activación completa');
    })
  );
});

// Manejo de solicitudes fetch
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar requests del mismo origen o APIs conocidas
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('intertravel.com.ar')) {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

// Estrategia principal de manejo de requests
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // Determinar estrategia de cache
    if (shouldUseCacheFirst(path)) {
      return await cacheFirstStrategy(request);
    } else if (shouldUseNetworkFirst(path)) {
      return await networkFirstStrategy(request);
    } else {
      return await staleWhileRevalidateStrategy(request);
    }
  } catch (error) {
    console.error('❌ Service Worker: Error en fetch', error);
    return await handleOffline(request);
  }
}

// Cache First: Mejor para recursos estáticos
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Servir desde cache y actualizar en background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Si no está en cache, buscar en red y cachear
  const networkResponse = await fetch(request);
  await addToCache(STATIC_CACHE, request, networkResponse.clone());
  return networkResponse;
}

// Network First: Mejor para contenido dinámico
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request, {
      timeout: 3000 // 3 segundos timeout
    });
    
    // Cachear respuesta exitosa
    if (networkResponse.ok) {
      await addToCache(getDynamicCacheName(request), request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si falla la red, servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate: Balance perfecto
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Servir desde cache inmediatamente si existe
  if (cachedResponse) {
    // Actualizar cache en background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Si no hay cache, esperar respuesta de red
  const networkResponse = await fetch(request);
  await addToCache(getDynamicCacheName(request), request, networkResponse.clone());
  return networkResponse;
}

// Actualizar cache en background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await addToCache(getDynamicCacheName(request), request, networkResponse);
    }
  } catch (error) {
    // Silencioso: no importa si falla la actualización background
  }
}

// Agregar a cache de forma segura
async function addToCache(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    console.warn('⚠️ Service Worker: No se pudo cachear', request.url);
  }
}

// Determinar estrategia de cache
function shouldUseCacheFirst(path) {
  return CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pattern.test(path));
}

function shouldUseNetworkFirst(path) {
  return CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pattern.test(path));
}

// Obtener nombre de cache dinámico según el tipo de request
function getDynamicCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return API_CACHE;
  }
  
  return DYNAMIC_CACHE;
}

// Manejo de requests offline
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Para páginas HTML, mostrar página offline
  if (request.destination === 'document') {
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Para imágenes, mostrar imagen placeholder
  if (request.destination === 'image') {
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">Imagen no disponible</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // Para APIs, devolver respuesta de error estructurada
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Sin conexión a internet',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Fallback genérico
  return new Response('Sin conexión a internet', { 
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Limpiar caches periódicamente
setInterval(async () => {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Eliminar entradas antiguas (más de 7 días)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response.headers.get('date');
      
      if (dateHeader) {
        const responseDate = new Date(dateHeader);
        if (Date.now() - responseDate.getTime() > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}, 24 * 60 * 60 * 1000); // Limpiar cada 24 horas

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_PACKAGE':
      // Cachear paquete específico para uso offline
      if (payload.url) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.add(payload.url);
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      // Limpiar cache específico
      if (payload.cacheName) {
        caches.delete(payload.cacheName);
      }
      break;
  }
});

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'Ver detalles'
        },
        {
          action: 'dismiss',
          title: 'Cerrar'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' && event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

console.log('🔄 Service Worker: Cargado y listo');
