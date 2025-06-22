import React from 'react';

interface SchemaOrgProps {
  type: 'organization' | 'local_business' | 'travel_agency' | 'product' | 'review' | 'breadcrumb';
  data: any;
}

export default function SchemaOrg({ type, data }: SchemaOrgProps) {
  const getSchemaData = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "InterTravel Group",
          "alternateName": "InterTravel",
          "description": "Tour Operador Mayorista con más de 15 años de experiencia en Argentina. EVyT 15.566",
          "url": "https://intertravel.com.ar",
          "logo": "https://intertravel.com.ar/logo-intertravel.svg",
          "foundingDate": "2009",
          "founders": [{
            "@type": "Person",
            "name": "InterTravel Founders"
          }],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Chacras Park, Edificio Ceibo",
            "addressLocality": "Luján de Cuyo",
            "addressRegion": "Mendoza",
            "postalCode": "5507",
            "addressCountry": "AR"
          },
          "contactPoint": [{
            "@type": "ContactPoint",
            "telephone": "+54-261-4XX-XXXX",
            "contactType": "customer service",
            "availableLanguage": ["Spanish", "English"],
            "areaServed": ["AR", "CL", "PE", "BO", "UY", "PY"]
          }, {
            "@type": "ContactPoint",
            "email": "ventas@intertravel.com.ar",
            "contactType": "sales",
            "availableLanguage": ["Spanish"]
          }],
          "sameAs": [
            "https://www.facebook.com/InterTravelGroup",
            "https://www.instagram.com/intertravelgroup",
            "https://www.linkedin.com/company/intertravel-group"
          ],
          "hasCredential": {
            "@type": "EducationalOccupationalCredential",
            "credentialCategory": "EVyT 15.566",
            "recognizedBy": {
              "@type": "Organization",
              "name": "Ministerio de Turismo de Argentina"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "5000",
            "bestRating": "5",
            "worstRating": "1"
          },
          ...data
        };

      case 'local_business':
        return {
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "InterTravel Group",
          "image": "https://intertravel.com.ar/logo-intertravel.svg",
          "description": "Tour Operador Mayorista especializado en viajes premium por Latinoamérica",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Chacras Park, Edificio Ceibo",
            "addressLocality": "Luján de Cuyo",
            "addressRegion": "Mendoza",
            "postalCode": "5507",
            "addressCountry": "AR"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "-33.0371735",
            "longitude": "-68.8894689"
          },
          "url": "https://intertravel.com.ar",
          "telephone": "+54-261-4XX-XXXX",
          "email": "ventas@intertravel.com.ar",
          "priceRange": "$$$",
          "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "18:00"
          }, {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "09:00",
            "closes": "13:00"
          }],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "5000"
          },
          "hasMap": "https://maps.google.com/?q=Chacras+Park+Lujan+de+Cuyo+Mendoza",
          "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer", "MercadoPago"],
          "currenciesAccepted": "ARS, USD",
          "areaServed": {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": "-33.0371735",
              "longitude": "-68.8894689"
            },
            "geoRadius": "500000"
          },
          ...data
        };

      case 'travel_agency':
        return {
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "InterTravel Group",
          "description": "Especialistas en viajes premium por Latinoamérica y el mundo",
          "url": "https://intertravel.com.ar",
          "logo": "https://intertravel.com.ar/logo-intertravel.svg",
          "telephone": "+54-261-4XX-XXXX",
          "email": "ventas@intertravel.com.ar",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Chacras Park, Edificio Ceibo",
            "addressLocality": "Luján de Cuyo",
            "addressRegion": "Mendoza",
            "addressCountry": "AR"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Paquetes de Viaje InterTravel",
            "itemListElement": [{
              "@type": "Offer",
              "itemOffered": {
                "@type": "TouristTrip",
                "name": "Perú Mágico - Cusco y Machu Picchu",
                "description": "8 días explorando el corazón del imperio Inca",
                "touristType": "Cultural, Aventura",
                "itinerary": {
                  "@type": "ItemList",
                  "numberOfItems": 8
                }
              },
              "price": "1890",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }]
          },
          "serviceArea": {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": "-14.2350040",
              "longitude": "-51.9252800"
            },
            "geoRadius": "10000000"
          },
          "serviceType": [
            "Tour packages",
            "Flight booking",
            "Hotel reservation",
            "Travel insurance",
            "Visa assistance"
          ],
          ...data
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name || "Paquete de Viaje Premium",
          "description": data.description || "Experiencia de viaje única e inolvidable",
          "image": data.image || "https://intertravel.com.ar/default-package.jpg",
          "brand": {
            "@type": "Brand",
            "name": "InterTravel Group"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "InterTravel Group"
          },
          "category": "Travel Package",
          "offers": {
            "@type": "Offer",
            "url": data.url || "https://intertravel.com.ar/paquetes",
            "priceCurrency": data.currency || "USD",
            "price": data.price || "0",
            "priceValidUntil": data.priceValidUntil || "2025-12-31",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "InterTravel Group"
            },
            "hasMerchantReturnPolicy": {
              "@type": "MerchantReturnPolicy",
              "applicableCountry": "AR",
              "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
              "merchantReturnDays": 7
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": data.rating || "4.9",
            "reviewCount": data.reviewCount || "100"
          },
          "duration": data.duration || "P7D",
          "itinerary": {
            "@type": "ItemList",
            "name": "Itinerario del viaje",
            "numberOfItems": data.days || 7
          },
          ...data
        };

      case 'review':
        return {
          "@context": "https://schema.org",
          "@type": "Review",
          "itemReviewed": {
            "@type": "Organization",
            "name": "InterTravel Group"
          },
          "author": {
            "@type": "Person",
            "name": data.authorName || "Cliente Satisfecho"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": data.rating || "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": data.text || "Excelente servicio y atención personalizada",
          "datePublished": data.date || new Date().toISOString().split('T')[0],
          "publisher": {
            "@type": "Organization",
            "name": "InterTravel Group"
          },
          ...data
        };

      case 'breadcrumb':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.map((item: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };

      default:
        return data;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getSchemaData())
      }}
    />
  );
}

// Hook para generar Schema automático
export const useSchemaOrg = () => {
  const generateProductSchema = (product: any) => ({
    name: product.title,
    description: product.description?.short || product.description?.full,
    image: product.images?.main,
    price: product.price?.amount,
    currency: product.price?.currency || 'USD',
    rating: product.rating?.average,
    reviewCount: product.rating?.count,
    duration: `P${product.duration?.days}D`,
    days: product.duration?.days,
    url: `https://intertravel.com.ar/paquetes/${product.id}`
  });

  const generateReviewSchema = (review: any) => ({
    authorName: review.name,
    rating: review.rating,
    text: review.text,
    date: review.date
  });

  const generateBreadcrumbSchema = (breadcrumbs: Array<{name: string, url: string}>) => 
    breadcrumbs;

  return {
    generateProductSchema,
    generateReviewSchema,
    generateBreadcrumbSchema
  };
};
