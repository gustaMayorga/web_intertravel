// Meta tags helpers
export const generateMetaTags = function generateDynamicMetaTags(pageType, data = {}) {
  const metaTags = {
    homepage: {
      title: "InterTravel Group | Tour Operador Premium Argentina | EVyT 15.566",
      description: "🌍 Tour Operador Mayorista con +15 años de experiencia. Paquetes premium a Perú, Europa, Asia y más. ✈️ Agencia EVyT 15.566 en Mendoza, Argentina.",
      keywords: "tour operador argentina, viajes premium mendoza, paquetes turisticos, EVyT 15566, intertravel group",
      canonical: "https://intertravel.com.ar/",
      ogImage: "https://intertravel.com.ar/images/intertravel-og-home.jpg"
    },
    
    packageDetail: {
      title: `${data.title} | ${data.duration.days} días desde USD ${data.price.amount} | InterTravel`,
      description: `✈️ ${data.title} - ${data.duration.days} días en ${data.destination}. Incluye vuelos, hoteles y excursiones. Desde USD ${data.price.amount}. Reservá ahora!`,
      keywords: `${data.destination.toLowerCase()}, viaje ${data.destination.toLowerCase()}, paquete ${data.destination.toLowerCase()}, tour ${data.destination.toLowerCase()}, intertravel`,
      canonical: `https://intertravel.com.ar/paquetes/${data.id}`,
      ogImage: data.images.main,
      structuredData: generatePackageStructuredData(data)
    },
    
    packages: {
      title: "Paquetes Turísticos Premium | Viajes Internacionales | InterTravel",
      description: "🎯 Descubrí nuestros paquetes turísticos premium a destinos únicos. Perú, Europa, Asia y más. Todo incluido con la calidad de InterTravel Group.",
      keywords: "paquetes turisticos, viajes internacionales, tours premium, vacation packages, intertravel",
      canonical: "https://intertravel.com.ar/paquetes",
      ogImage: "https://intertravel.com.ar/images/packages-og.jpg"
    },
    
    search: {
      title: `Resultados búsqueda: ${data.query || ''} | Paquetes Turísticos | InterTravel`,
      description: `🔍 Encontrá el viaje perfecto para ${data.query || 'tu destino'} con InterTravel. Paquetes todo incluido con vuelos, hoteles y excursiones.`,
      keywords: `${data.query || ''}, búsqueda viajes, paquetes ${data.query || ''}, tours ${data.query || ''}`,
      canonical: `https://intertravel.com.ar/buscar?q=${encodeURIComponent(data.query || '')}`,
      noindex: data.results < 1 // No indexar si no hay resultados
    }
  };
  
  return metaTags[pageType] || metaTags.homepage;
};
export const generateStructuredData = function generatePackageStructuredData(packageData) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TourPackage",
    "name": packageData.title,
    "description": packageData.description.short,
    "provider": {
      "@type": "TravelAgency",
      "name": "InterTravel Group",
      "url": "https://intertravel.com.ar",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Mendoza",
        "addressCountry": "AR"
      },
      "telephone": "+54-261-123-4567",
      "email": "info@intertravel.com.ar"
    },
    "offers": {
      "@type": "Offer",
      "price": packageData.price.amount,
      "priceCurrency": packageData.price.currency,
      "availability": "https://schema.org/InStock",
      "url": `https://intertravel.com.ar/paquetes/${packageData.id}`,
      "validFrom": new Date().toISOString(),
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    "touristType": "https://schema.org/Tourist",
    "duration": `P${packageData.duration.days}D`,
    "startLocation": {
      "@type": "Place",
      "name": "Mendoza, Argentina",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Mendoza",
        "addressCountry": "AR"
      }
    },
    "endLocation": {
      "@type": "Place",
      "name": packageData.destination,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": packageData.destination,
        "addressCountry": packageData.country
      }
    },
    "image": packageData.images.main,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": packageData.rating.average,
      "reviewCount": packageData.rating.count,
      "bestRating": "5",
      "worstRating": "1"
    }
  };
  
  return JSON.stringify(structuredData, null, 2);
};