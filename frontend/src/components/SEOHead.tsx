import React from 'react';
import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  additionalMetaTags?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
  noIndex?: boolean;
  structuredData?: any;
}

export default function SEOHead({
  title = "InterTravel Group | Tour Operador Mayorista EVyT 15.566",
  description = "Tour Operador Mayorista con más de 15 años de experiencia. Paquetes de viaje premium, asesoría para agencias y experiencias únicas. Mendoza, Argentina.",
  keywords = [
    'tour operador argentina',
    'agencia de viajes mendoza', 
    'paquetes turisticos argentina',
    'viajes premium latinoamerica',
    'tour operador mayorista',
    'EVyT 15566',
    'viajes cusco machu picchu',
    'turismo premium argentina',
    'agencia viajes lujan cuyo',
    'experiencias viaje unicas'
  ],
  canonical,
  openGraph,
  twitter,
  additionalMetaTags = [],
  noIndex = false,
  structuredData
}: SEOProps) {
  
  const defaultOpenGraph = {
    title: title,
    description: description,
    image: "https://intertravel.com.ar/og-image.jpg",
    url: canonical || "https://intertravel.com.ar",
    type: "website"
  };

  const defaultTwitter = {
    card: "summary_large_image",
    title: title,
    description: description,
    image: "https://intertravel.com.ar/og-image.jpg"
  };

  const finalOpenGraph = { ...defaultOpenGraph, ...openGraph };
  const finalTwitter = { ...defaultTwitter, ...twitter };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="InterTravel Group" />
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={finalOpenGraph.type} />
      <meta property="og:title" content={finalOpenGraph.title} />
      <meta property="og:description" content={finalOpenGraph.description} />
      <meta property="og:image" content={finalOpenGraph.image} />
      <meta property="og:url" content={finalOpenGraph.url} />
      <meta property="og:site_name" content="InterTravel Group" />
      <meta property="og:locale" content="es_AR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={finalTwitter.card} />
      <meta name="twitter:title" content={finalTwitter.title} />
      <meta name="twitter:description" content={finalTwitter.description} />
      <meta name="twitter:image" content={finalTwitter.image} />
      <meta name="twitter:site" content="@intertravelgroup" />
      
      {/* Additional Meta Tags for Travel Industry */}
      <meta name="geo.region" content="AR-M" />
      <meta name="geo.placename" content="Mendoza, Argentina" />
      <meta name="geo.position" content="-33.0371735;-68.8894689" />
      <meta name="ICBM" content="-33.0371735, -68.8894689" />
      
      {/* Business Information */}
      <meta name="business:contact_data:street_address" content="Chacras Park, Edificio Ceibo" />
      <meta name="business:contact_data:locality" content="Luján de Cuyo" />
      <meta name="business:contact_data:region" content="Mendoza" />
      <meta name="business:contact_data:postal_code" content="5507" />
      <meta name="business:contact_data:country_name" content="Argentina" />
      <meta name="business:contact_data:phone_number" content="+54 261 4XX-XXXX" />
      <meta name="business:contact_data:email" content="ventas@intertravel.com.ar" />
      
      {/* Travel Specific */}
      <meta name="travel:destination" content="Latinoamérica" />
      <meta name="travel:type" content="Tour Packages" />
      <meta name="travel:duration" content="Variable" />
      <meta name="travel:price_range" content="Premium" />
      
      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta
          key={index}
          {...(tag.name ? { name: tag.name } : { property: tag.property })}
          content={tag.content}
        />
      ))}
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#16213e" />
      <meta name="msapplication-TileColor" content="#16213e" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://connect.facebook.net" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      
      {/* Performance optimizations */}
      <link rel="prefetch" href="/paquetes" />
      <link rel="prefetch" href="/opiniones" />
      
      {/* Security */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    </Head>
  );
}

// Utility function to generate SEO props for different pages
export const generateSEOProps = {
  homepage: () => ({
    title: "InterTravel Group | Tour Operador Premium Argentina | EVyT 15.566",
    description: "🌍 Tour Operador Mayorista con +15 años de experiencia. Paquetes premium a Perú, Europa, Asia y más. ✈️ Agencia EVyT 15.566 en Mendoza, Argentina.",
    keywords: [
      'tour operador argentina',
      'viajes premium mendoza',
      'paquetes turisticos latinoamerica',
      'agencia viajes EVyT',
      'cusco machu picchu',
      'europa tour operador',
      'asia viajes premium',
      'turismo responsable argentina'
    ],
    canonical: "https://intertravel.com.ar",
    openGraph: {
      title: "InterTravel Group - Experiencias Premium de Viaje",
      description: "Descubre destinos únicos con el tour operador más confiable de Argentina. +5000 viajeros satisfechos.",
      image: "https://intertravel.com.ar/og-home.jpg"
    }
  }),

  packages: (packageData?: any) => ({
    title: packageData ? 
      `${packageData.title} | InterTravel Group` : 
      "Paquetes de Viaje Premium | InterTravel Group",
    description: packageData ?
      `${packageData.description?.short || packageData.description?.full} Desde $${packageData.price?.amount} USD. ✈️ Todo incluido con InterTravel.` :
      "Explora nuestros paquetes de viaje premium a destinos únicos. Perú, Europa, Asia y más. Todo incluido con la mejor atención.",
    keywords: packageData ? [
      `viaje ${packageData.destination}`,
      `tour ${packageData.country}`,
      `paquete ${packageData.category}`,
      'tour operador argentina',
      'viajes premium'
    ] : [
      'paquetes viaje premium',
      'tours latinoamerica',
      'viajes europa asia',
      'tour operador mayorista'
    ]
  }),

  reviews: () => ({
    title: "Opiniones y Testimonios | InterTravel Group",
    description: "Lee las experiencias reales de más de 5,000 viajeros que eligieron InterTravel. Rating 4.9/5 ⭐ Testimonios verificados.",
    keywords: [
      'opiniones intertravel',
      'testimonios viajes argentina',
      'reviews tour operador',
      'experiencias clientes turismo',
      'calificaciones agencia viajes'
    ],
    canonical: "https://intertravel.com.ar/opiniones"
  }),

  contact: () => ({
    title: "Contacto | InterTravel Group Mendoza",
    description: "📞 +54 261 4XX-XXXX ✉️ ventas@intertravel.com.ar 📍 Chacras Park, Luján de Cuyo, Mendoza. Tu próxima aventura comienza aquí.",
    keywords: [
      'contacto intertravel',
      'agencia viajes mendoza',
      'tour operador lujan cuyo',
      'telefono agencia viajes',
      'oficina turismo mendoza'
    ]
  })
};
