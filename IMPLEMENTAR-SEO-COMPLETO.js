// ===============================================
// SEO IMPLEMENTATION COMPLETA - INTERTRAVEL
// Structured Data + Meta Tags Dinámicos + Sitemap
// ===============================================

const fs = require('fs');
const path = require('path');

// ===============================================
// STRUCTURED DATA PARA PAQUETES TURÍSTICOS
// ===============================================

function generatePackageStructuredData(packageData) {
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
}

// ===============================================
// META TAGS DINÁMICOS POR PÁGINA
// ===============================================

function generateDynamicMetaTags(pageType, data = {}) {
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
}

// ===============================================
// GENERADOR DE SITEMAP XML
// ===============================================

async function generateSitemap() {
  console.log('🗺️ Generando sitemap XML...');
  
  // URLs estáticas
  const staticUrls = [
    { url: 'https://intertravel.com.ar/', priority: '1.0', changefreq: 'daily' },
    { url: 'https://intertravel.com.ar/paquetes', priority: '0.9', changefreq: 'daily' },
    { url: 'https://intertravel.com.ar/nosotros', priority: '0.7', changefreq: 'monthly' },
    { url: 'https://intertravel.com.ar/contacto', priority: '0.8', changefreq: 'monthly' },
    { url: 'https://intertravel.com.ar/opiniones', priority: '0.6', changefreq: 'weekly' }
  ];
  
  // URLs dinámicas de paquetes (simulado - en producción vendría de BD)
  const packageUrls = [
    { id: 29346146, title: 'peru-imprescindible', lastmod: '2025-07-22' },
    { id: 29347667, title: 'peru-andes-ancestrales', lastmod: '2025-07-22' },
    { id: 29347739, title: 'peru-rastro-inca', lastmod: '2025-07-22' },
    { id: 27245549, title: 'charter-camboriu-mendoza', lastmod: '2025-07-22' },
    { id: 28537733, title: 'cancun-desde-mendoza', lastmod: '2025-07-22' }
  ].map(pkg => ({
    url: `https://intertravel.com.ar/paquetes/${pkg.id}/${pkg.title}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: pkg.lastmod
  }));
  
  // Combinar todas las URLs
  const allUrls = [...staticUrls, ...packageUrls];
  
  // Generar XML
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  allUrls.forEach(item => {
    sitemapXml += `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
  });
  
  sitemapXml += `
</urlset>`;
  
  // Guardar sitemap
  fs.writeFileSync('./frontend/public/sitemap.xml', sitemapXml);
  console.log('✅ Sitemap generado: ./frontend/public/sitemap.xml');
  
  return sitemapXml;
}

// ===============================================
// ROBOTS.TXT OPTIMIZADO
// ===============================================

function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Disallow temporary/test pages
Disallow: /test/
Disallow: /*?test=*

# Allow important directories
Allow: /paquetes/
Allow: /images/
Allow: /css/
Allow: /js/

# Sitemap location
Sitemap: https://intertravel.com.ar/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1`;

  fs.writeFileSync('./frontend/public/robots.txt', robotsTxt);
  console.log('✅ Robots.txt generado: ./frontend/public/robots.txt');
  
  return robotsTxt;
}

// ===============================================
// COMPONENT REACT PARA META TAGS DINÁMICOS
// ===============================================

function generateSEOComponent() {
  const seoComponent = `// ===============================================
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
  const fullTitle = title.includes('InterTravel') ? title : \`\${title} | InterTravel\`;
  
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
    title: \`\${packageData.title} | \${packageData.duration.days} días desde USD \${packageData.price.amount}\`,
    description: \`✈️ \${packageData.title} - \${packageData.duration.days} días en \${packageData.destination}. Incluye vuelos, hoteles y excursiones. Desde USD \${packageData.price.amount}. Reservá ahora!\`,
    keywords: \`\${packageData.destination.toLowerCase()}, viaje \${packageData.destination.toLowerCase()}, paquete \${packageData.destination.toLowerCase()}\`,
    canonical: \`https://intertravel.com.ar/paquetes/\${packageData.id}\`,
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
}`;

  fs.writeFileSync('./frontend/src/components/SEO.tsx', seoComponent);
  console.log('✅ SEO Component creado: ./frontend/src/components/SEO.tsx');
}

// ===============================================
// EJECUTAR IMPLEMENTACIÓN SEO COMPLETA
// ===============================================

async function implementCompleteSEO() {
  console.log('🚀 IMPLEMENTANDO SEO COMPLETO');
  console.log('=============================');
  
  try {
    // 1. Generar sitemap
    await generateSitemap();
    
    // 2. Generar robots.txt
    generateRobotsTxt();
    
    // 3. Crear componente SEO
    generateSEOComponent();
    
    // 4. Crear archivo de meta tags helpers
    const metaHelpers = `// Meta tags helpers
export const generateMetaTags = ${generateDynamicMetaTags.toString()};
export const generateStructuredData = ${generatePackageStructuredData.toString()};`;
    
    fs.writeFileSync('./frontend/src/utils/seo-helpers.ts', metaHelpers);
    
    console.log('\\n✅ SEO IMPLEMENTACIÓN COMPLETADA');
    console.log('================================');
    console.log('📁 Archivos creados:');
    console.log('   - frontend/public/sitemap.xml');
    console.log('   - frontend/public/robots.txt');
    console.log('   - frontend/src/components/SEO.tsx');
    console.log('   - frontend/src/utils/seo-helpers.ts');
    
    return {
      status: 'completed',
      files: [
        'frontend/public/sitemap.xml',
        'frontend/public/robots.txt', 
        'frontend/src/components/SEO.tsx',
        'frontend/src/utils/seo-helpers.ts'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error implementando SEO:', error);
    return { status: 'error', error: error.message };
  }
}

// Ejecutar implementación
if (require.main === module) {
  implementCompleteSEO();
}

module.exports = {
  implementCompleteSEO,
  generateDynamicMetaTags,
  generatePackageStructuredData,
  generateSitemap,
  generateRobotsTxt
};
