import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/account/dashboard/',
          '/agency/dashboard/',
          '/_next/',
          '/private/',
          '/test/',
          '*.json',
          '*.xml'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/paquetes/',
          '/opiniones/',
          '/nosotros/',
          '/mis-15/',
          '/agencias/'
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/account/dashboard/',
          '/agency/dashboard/',
          '/private/',
          '/test/'
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/paquetes/',
          '/opiniones/',
          '/nosotros/',
          '/mis-15/',
          '/agencias/'
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/account/dashboard/',
          '/agency/dashboard/',
          '/private/',
          '/test/'
        ],
      }
    ],
    sitemap: 'https://intertravel.com.ar/sitemap.xml',
    host: 'https://intertravel.com.ar'
  }
}
