import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InterTravel Group - Tour Operador Premium',
    short_name: 'InterTravel',
    description: 'Tour Operador Mayorista con +15 años de experiencia. Paquetes premium a Perú, Europa, Asia y más.',
    start_url: '/',
    display: 'standalone',
    background_color: '#16213e',
    theme_color: '#16213e',
    orientation: 'portrait',
    scope: '/',
    lang: 'es',
    dir: 'ltr',
    categories: ['travel', 'tourism', 'business'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide'
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow'
      }
    ],
    shortcuts: [
      {
        name: 'Ver Paquetes',
        short_name: 'Paquetes',
        description: 'Explorar paquetes de viaje disponibles',
        url: '/paquetes',
        icons: [{ src: '/icon-packages.png', sizes: '96x96' }]
      },
      {
        name: 'Opiniones',
        short_name: 'Reviews',
        description: 'Leer experiencias de otros viajeros',
        url: '/opiniones',
        icons: [{ src: '/icon-reviews.png', sizes: '96x96' }]
      },
      {
        name: 'Contacto',
        short_name: 'Contacto',
        description: 'Contactar con InterTravel',
        url: '/nosotros',
        icons: [{ src: '/icon-contact.png', sizes: '96x96' }]
      }
    ]
  }
}
