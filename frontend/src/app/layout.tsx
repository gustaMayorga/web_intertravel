import type { Metadata } from 'next';
import './globals.css';
import Analytics from '@/components/Analytics';
import SchemaOrg from '@/components/SchemaOrg';
import ClientOptimizations from '@/components/ClientOptimizations';
import CookieConsent from '@/components/legal/CookieConsent';
import CookieFloatingButton from '@/components/legal/CookieFloatingButton';

export const metadata: Metadata = {
  metadataBase: new URL('https://intertravel.com.ar'),
  title: {
    default: 'InterTravel Group | Tour Operador Premium Argentina | EVyT 15.566',
    template: '%s | InterTravel Group'
  },
  description: '🌍 Tour Operador Mayorista con +15 años de experiencia. Paquetes premium a Perú, Europa, Asia y más. ✈️ Agencia EVyT 15.566 en Mendoza, Argentina.',
  keywords: [
    'tour operador argentina',
    'viajes premium mendoza', 
    'paquetes turisticos latinoamerica',
    'agencia viajes EVyT',
    'cusco machu picchu',
    'europa tour operador',
    'asia viajes premium',
    'turismo responsable argentina',
    'EVyT 15566',
    'intertravel group',
    'lujan de cuyo turismo'
  ],
  authors: [{ name: 'InterTravel Group', url: 'https://intertravel.com.ar' }],
  creator: 'InterTravel Group',
  publisher: 'InterTravel Group',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://intertravel.com.ar',
    siteName: 'InterTravel Group',
    title: 'InterTravel Group - Experiencias Premium de Viaje',
    description: 'Descubre destinos únicos con el tour operador más confiable de Argentina. +5000 viajeros satisfechos.',
    images: [{
      url: 'https://intertravel.com.ar/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'InterTravel Group - Tour Operador Premium'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@intertravelgroup',
    creator: '@intertravelgroup',
    title: 'InterTravel Group - Tour Operador Premium Argentina',
    description: 'Experiencias de viaje únicas. EVyT 15.566. +15 años transformando sueños en aventuras.',
    images: ['https://intertravel.com.ar/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-16x16.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/site.webmanifest',
  other: {
    'google-site-verification': 'GOOGLE_VERIFICATION_CODE_REPLACE',
    'msvalidate.01': 'BING_VERIFICATION_CODE_REPLACE',
    'yandex-verification': 'YANDEX_VERIFICATION_CODE_REPLACE',
    'geo.region': 'AR-M',
    'geo.placename': 'Mendoza, Argentina',
    'geo.position': '-33.0371735;-68.8894689',
    'ICBM': '-33.0371735, -68.8894689',
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#16213e',
    maximumScale: 5,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Favicon and Icons - Corregidos */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.svg" sizes="16x16" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.svg" sizes="32x32" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Mobile App Configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=yes" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Prefetch important pages */}
        <link rel="prefetch" href="/paquetes" />
        <link rel="prefetch" href="/opiniones" />
        <link rel="prefetch" href="/nosotros" />
      </head>
      <body className="font-montserrat antialiased bg-white">
        {/* Schema.org Organization Data */}
        <SchemaOrg 
          type="organization" 
          data={{
            aggregateRating: {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "5000+",
              "bestRating": "5",
              "worstRating": "1"
            }
          }} 
        />
        
        {/* Schema.org Local Business Data */}
        <SchemaOrg 
          type="local_business" 
          data={{
            priceRange: "$$$",
            servesCuisine: "Travel Services",
            acceptsReservations: true
          }} 
        />
        
        {/* Main Content */}
        {children}
        
        {/* Sistema de gestión de cookies */}
        <CookieConsent />
        
        {/* Botón flotante de configuración de cookies */}
        <CookieFloatingButton />
        
        {/* Optimizaciones del lado del cliente */}
        <ClientOptimizations />
        
        {/* WhatsApp Configuration Script */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // Configuración de WhatsApp global por defecto
              window.INTERTRAVEL_CONFIG = {
                whatsapp: {
                  main: '+5492615555555',
                  results: '+5492615555556',
                  detail: '+5492615555557',
                  agency: '+5492615555558',
                  prebooking: '+5492615555559'
                },
                messages: {
                  main: 'Hola! Me interesa conocer más sobre sus paquetes',
                  results: 'Me interesa obtener más información sobre los paquetes disponibles',
                  detail: 'Me interesa el paquete [PACKAGE_NAME] y me gustaría recibir más información',
                  agency: 'Hola! Soy agencia de viajes y necesito información sobre su plataforma B2B',
                  prebooking: 'Completé el formulario de prebooking y me gustaría finalizar mi reserva'
                },
                globalSettings: {
                  hours: 'Lun-Vie 9:00-18:00, Sáb 9:00-13:00',
                  welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué podemos ayudarte hoy?',
                  offHoursMessage: 'Gracias por contactarnos. Nuestro horario de atención es Lun-Vie 9:00-18:00. Te responderemos a la brevedad. 🕒'
                },
                lastUpdated: new Date().toISOString()
              };
              
              // Función global para WhatsApp
              function openWhatsAppWithConfig(context, packageName = '') {
                const config = window.INTERTRAVEL_CONFIG;
                let phoneNumber = config.whatsapp.main;
                let message = config.messages.main;
                
                // Seleccionar número y mensaje según contexto
                if (config.whatsapp[context] && config.messages[context]) {
                  phoneNumber = config.whatsapp[context];
                  message = config.messages[context];
                  
                  // Reemplazar variables en el mensaje
                  if (packageName && message.includes('[PACKAGE_NAME]')) {
                    message = message.replace('[PACKAGE_NAME]', packageName);
                  }
                }
                
                const url = \`https://wa.me/\${phoneNumber}?text=\${encodeURIComponent(message)}\`;
                window.open(url, '_blank');
              }
            `
          }}
        />
        
        {/* Analytics and Tracking - Configuración completa */}
        <Analytics 
          GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          META_PIXEL_ID={process.env.NEXT_PUBLIC_META_PIXEL_ID}
          GOOGLE_ADS_ID={process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}
          HOTJAR_ID={process.env.NEXT_PUBLIC_HOTJAR_ID}
          CLARITY_ID={process.env.NEXT_PUBLIC_CLARITY_ID}
          TIKTOK_PIXEL_ID={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
          LINKEDIN_PARTNER_ID={process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID}
        />
      </body>
    </html>
  );
}
