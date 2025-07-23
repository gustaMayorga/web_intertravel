'use client';

import './globals.css';
import Analytics from '@/components/Analytics';
import SchemaOrg from '@/components/SchemaOrg';
import ClientOptimizations from '@/components/ClientOptimizations';
import CookieConsent from '@/components/legal/CookieConsent';

import WhatsAppFloating from '@/components/WhatsAppFloating';
import WhapifyWebChat from '@/components/WhapifyWebChat';
import GoogleAnalytics from '@/lib/google-analytics';
import { AuthProvider } from '@/hooks/use-auth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Meta Tags Básicos */}
        <title>InterTravel Group | Tour Operador Premium Argentina | EVyT 15.566</title>
        <meta name="description" content="🌍 Tour Operador Mayorista con 23K+ horas cumpliendo sueños. Paquetes premium a Perú, Europa, Asia y más. ✈️ Agencia EVyT 15.566 en Mendoza, Argentina." />
        <meta name="keywords" content="tour operador argentina, viajes premium mendoza, paquetes turisticos, EVyT 15566, intertravel group" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#16213e" />
        
        {/* Favicons InterTravel - Desde FAVICON_INTER */}
        <link rel="icon" href="/FAVICON_INTER/Favicon%2032px.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/FAVICON_INTER/Favicon%2096px.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/FAVICON_INTER/Favicon%20152px.png" sizes="152x152" />
        <link rel="icon" href="/FAVICON_INTER/Favicon%20192px.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/FAVICON_INTER/Favicon%20512px.png" sizes="512x512" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        
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
        {/* 🔐 AuthProvider Wrapper - SOLUCIÓN AL ERROR CRÍTICO */}
        <AuthProvider>
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
        
        {/* WhatsApp Flotante */}
        <WhatsAppFloating 
          phone="5491134567890"
          message="Hola! Estoy interesado en los paquetes de viaje de InterTravel. ¿Pueden ayudarme?"
          position="bottom-right"
          showAnimation={true}
          adminConfigurable={true}
        />
        
        {/* Whapify WebChat - Fase 3 */}
        <WhapifyWebChat 
          botId={process.env.NEXT_PUBLIC_WHAPIFY_BOT_ID || ''}
          context="landing"
          enabled={true}
          showOnMobile={true}
          showOnDesktop={true}
          right="20px"
          bottom="80px"
        />
        
        {/* Sistema de gestión de cookies */}
        <CookieConsent />
        

        
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
        
        </AuthProvider>
        
        {/* Google Analytics 4 Integration */}
        <GoogleAnalytics />
        
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