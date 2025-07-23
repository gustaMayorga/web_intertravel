// ===============================================
// SEO Component con Meta Tags Dinámicos
// ===============================================

import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  structuredData?: string;
  noindex?: boolean;
}

export default function SEO({
  title = "InterTravel Group | Tour Operador Premium Argentina",
  description = "Tour Operador Mayorista con +15 años de experiencia. Paquetes premium a destinos únicos.",
  keywords = "tour operador argentina, viajes premium, paquetes turisticos",
  canonical,
  ogImage = "https://intertravel.com.ar/images/og-default.jpg",
  structuredData,
  noindex = false
}: SEOProps) {
  const fullTitle = title.includes('InterTravel') ? title : `${title} | InterTravel`;
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="InterTravel Group" />
      {canonical && <meta property="og:url" content={canonical} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      )}
      
      {/* Additional Meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta name="format-detection" content="telephone=yes" />
      
      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}

// Hook para generar meta tags dinámicos
export function usePackageSEO(packageData: any) {
  if (!packageData) return {};
  
  return {
    title: `${packageData.title} | ${packageData.duration.days} días desde USD ${packageData.price.amount}`,
    description: `✈️ ${packageData.title} - ${packageData.duration.days} días en ${packageData.destination}. Incluye vuelos, hoteles y excursiones. Desde USD ${packageData.price.amount}. Reservá ahora!`,
    keywords: `${packageData.destination.toLowerCase()}, viaje ${packageData.destination.toLowerCase()}, paquete ${packageData.destination.toLowerCase()}`,
    canonical: `https://intertravel.com.ar/paquetes/${packageData.id}`,
    ogImage: packageData.images.main,
    structuredData: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TourPackage",
      "name": packageData.title,
      "description": packageData.description.short,
      "offers": {
        "@type": "Offer",
        "price": packageData.price.amount,
        "priceCurrency": packageData.price.currency
      }
    })
  };
}