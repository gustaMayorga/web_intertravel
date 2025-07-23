// ===============================================
// GA4 ENHANCED ECOMMERCE IMPLEMENTATION COMPLETA
// Events críticos para tracking de conversiones
// ===============================================

const fs = require('fs');

// ===============================================
// GA4 CONFIGURATION Y SETUP
// ===============================================

function generateGA4Config() {
  const ga4Config = `// ===============================================
// GA4 Enhanced Ecommerce Configuration
// ===============================================

// GA4 Measurement ID (reemplazar con el real)
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Configuración básica GA4
export const GA4_CONFIG = {
  page_title: document.title,
  page_location: window.location.href,
  content_group1: 'InterTravel',
  content_group2: 'Tour Operator',
  custom_map: {
    dimension1: 'user_type',
    dimension2: 'package_category', 
    dimension3: 'destination_country'
  }
};

// ===============================================
// ENHANCED ECOMMERCE EVENTS
// ===============================================

// Event: Ver lista de paquetes
export function trackViewItemList(packages, listName = 'Paquetes Destacados') {
  if (typeof gtag === 'undefined') return;
  
  const items = packages.map((pkg, index) => ({
    item_id: pkg.id.toString(),
    item_name: pkg.title,
    item_category: pkg.category || 'Paquetes',
    item_category2: pkg.country,
    item_brand: 'InterTravel',
    price: pkg.price.amount,
    currency: pkg.price.currency,
    index: index + 1,
    quantity: 1
  }));
  
  gtag('event', 'view_item_list', {
    item_list_id: listName.toLowerCase().replace(/\\s+/g, '_'),
    item_list_name: listName,
    items: items.slice(0, 10) // Máximo 10 items por event
  });
  
  console.log('📊 GA4: view_item_list tracked', { listName, itemCount: items.length });
}

// Event: Ver detalle de paquete
export function trackViewItem(packageData) {
  if (typeof gtag === 'undefined') return;
  
  const item = {
    item_id: packageData.id.toString(),
    item_name: packageData.title,
    item_category: packageData.category || 'Paquetes',
    item_category2: packageData.country,
    item_category3: packageData.destination,
    item_brand: 'InterTravel',
    price: packageData.price.amount,
    currency: packageData.price.currency,
    quantity: 1
  };
  
  gtag('event', 'view_item', {
    currency: packageData.price.currency,
    value: packageData.price.amount,
    items: [item]
  });
  
  console.log('📊 GA4: view_item tracked', packageData.title);
}

// Event: Búsqueda de paquetes
export function trackSearch(searchTerm, resultsCount = 0, filters = {}) {
  if (typeof gtag === 'undefined') return;
  
  gtag('event', 'search', {
    search_term: searchTerm,
    content_type: 'packages',
    results_count: resultsCount,
    ...filters
  });
  
  // Custom event para análisis detallado
  gtag('event', 'package_search', {
    search_term: searchTerm,
    results_count: resultsCount,
    search_filters: JSON.stringify(filters)
  });
  
  console.log('📊 GA4: search tracked', { searchTerm, resultsCount });
}

// Event: Contacto WhatsApp (conversión crítica)
export function trackWhatsAppContact(packageData, contactMethod = 'whatsapp') {
  if (typeof gtag === 'undefined') return;
  
  // Event de conversión principal
  gtag('event', 'conversion', {
    event_category: 'engagement',
    event_label: \`\${contactMethod}_\${packageData.id}\`,
    value: packageData.price.amount,
    currency: packageData.price.currency
  });
  
  // Custom event específico
  gtag('event', 'whatsapp_contact', {
    package_id: packageData.id.toString(),
    package_name: packageData.title,
    package_price: packageData.price.amount,
    contact_method: contactMethod,
    destination: packageData.destination
  });
  
  // Lead event para remarketing
  gtag('event', 'generate_lead', {
    currency: packageData.price.currency,
    value: packageData.price.amount * 0.1, // 10% del valor como lead value
    lead_type: 'whatsapp_contact',
    package_category: packageData.category
  });
  
  console.log('📊 GA4: whatsapp_contact tracked', packageData.title);
}

// Event: Interés en paquete (agregado a favoritos, etc)
export function trackAddToWishlist(packageData) {
  if (typeof gtag === 'undefined') return;
  
  const item = {
    item_id: packageData.id.toString(),
    item_name: packageData.title,
    item_category: packageData.category,
    price: packageData.price.amount,
    currency: packageData.price.currency,
    quantity: 1
  };
  
  gtag('event', 'add_to_wishlist', {
    currency: packageData.price.currency,
    value: packageData.price.amount,
    items: [item]
  });
  
  console.log('📊 GA4: add_to_wishlist tracked', packageData.title);
}

// Event: Reserva iniciada (simulación add_to_cart)
export function trackBookingStarted(packageData, travelers = 1) {
  if (typeof gtag === 'undefined') return;
  
  const item = {
    item_id: packageData.id.toString(),
    item_name: packageData.title,
    item_category: packageData.category,
    price: packageData.price.amount,
    currency: packageData.price.currency,
    quantity: travelers
  };
  
  gtag('event', 'add_to_cart', {
    currency: packageData.price.currency,
    value: packageData.price.amount * travelers,
    items: [item]
  });
  
  // Custom event
  gtag('event', 'booking_started', {
    package_id: packageData.id.toString(),
    travelers_count: travelers,
    total_value: packageData.price.amount * travelers
  });
  
  console.log('📊 GA4: booking_started tracked', packageData.title);
}

// Event: Reserva completada (conversión final)
export function trackPurchase(bookingData) {
  if (typeof gtag === 'undefined') return;
  
  const items = [{
    item_id: bookingData.package_id.toString(),
    item_name: bookingData.package_title,
    item_category: bookingData.package_category,
    price: bookingData.amount_per_person,
    currency: bookingData.currency,
    quantity: bookingData.travelers_count
  }];
  
  gtag('event', 'purchase', {
    transaction_id: bookingData.booking_reference,
    value: bookingData.total_amount,
    currency: bookingData.currency,
    items: items,
    booking_date: bookingData.travel_date,
    customer_type: 'direct'
  });
  
  console.log('📊 GA4: purchase tracked', bookingData.booking_reference);
}

// ===============================================
// USER ENGAGEMENT EVENTS
// ===============================================

// Event: Scroll depth
export function trackScrollDepth(percentage) {
  if (typeof gtag === 'undefined') return;
  
  gtag('event', 'scroll', {
    percent_scrolled: percentage,
    page_title: document.title
  });
}

// Event: Time on page
export function trackTimeOnPage(seconds) {
  if (typeof gtag === 'undefined') return;
  
  if (seconds >= 30) { // Solo tracking después de 30 segundos
    gtag('event', 'user_engagement', {
      engagement_time_msec: seconds * 1000,
      page_title: document.title
    });
  }
}

// Event: File download
export function trackFileDownload(fileName, fileType = 'pdf') {
  if (typeof gtag === 'undefined') return;
  
  gtag('event', 'file_download', {
    file_name: fileName,
    file_extension: fileType,
    link_url: window.location.href
  });
}

// ===============================================
// CUSTOM DIMENSIONS Y METRICS
// ===============================================

// Set user properties
export function setUserProperties(properties) {
  if (typeof gtag === 'undefined') return;
  
  gtag('config', GA4_MEASUREMENT_ID, {
    custom_map: {
      dimension1: 'user_type',
      dimension2: 'preferred_destination',
      dimension3: 'price_range_preference'
    }
  });
  
  gtag('event', 'login', properties);
}

// ===============================================
// REMARKETING AUDIENCES
// ===============================================

// Configurar audiencias para remarketing
export function setupRemarketingAudiences() {
  if (typeof gtag === 'undefined') return;
  
  // Audiencia: Visitantes paquetes Perú
  gtag('event', 'custom_audience', {
    audience_type: 'peru_interested',
    page_category: 'packages',
    destination_interest: 'peru'
  });
  
  // Audiencia: Visitantes high-value packages
  gtag('event', 'custom_audience', {
    audience_type: 'premium_interested', 
    price_range: 'high_value',
    package_category: 'premium'
  });
}

export default {
  trackViewItemList,
  trackViewItem,
  trackSearch,
  trackWhatsAppContact,
  trackAddToWishlist,
  trackBookingStarted,
  trackPurchase,
  trackScrollDepth,
  trackTimeOnPage,
  trackFileDownload,
  setUserProperties,
  setupRemarketingAudiences
};`;

  return ga4Config;
}

// ===============================================
// REACT HOOK PARA GA4 TRACKING
// ===============================================

function generateGA4Hook() {
  const ga4Hook = `// ===============================================
// useGA4 Hook para tracking automático
// ===============================================

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  trackViewItemList,
  trackViewItem,
  trackSearch,
  trackWhatsAppContact,
  trackScrollDepth,
  trackTimeOnPage
} from '../utils/ga4-tracking';

export function useGA4() {
  const router = useRouter();

  // Track page views automáticamente
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof gtag !== 'undefined') {
        gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Auto-track scroll depth
  useEffect(() => {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 90, 100];
    const trackedMilestones = new Set();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      milestones.forEach(milestone => {
        if (maxScroll >= milestone && !trackedMilestones.has(milestone)) {
          trackScrollDepth(milestone);
          trackedMilestones.add(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    const trackTimeBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackTimeOnPage(timeSpent);
    };

    window.addEventListener('beforeunload', trackTimeBeforeUnload);
    return () => window.removeEventListener('beforeunload', trackTimeBeforeUnload);
  }, []);

  return {
    trackPackageView: trackViewItem,
    trackPackagesList: trackViewItemList,
    trackSearch: trackSearch,
    trackWhatsAppContact: trackWhatsAppContact
  };
}

export default useGA4;`;

  return ga4Hook;
}

// ===============================================
// GOOGLE TAG MANAGER SETUP
// ===============================================

function generateGTMSetup() {
  const gtmSetup = `// ===============================================
// Google Tag Manager Setup - InterTravel
// ===============================================

// GTM Container ID
export const GTM_ID = 'GTM-XXXXXXX';

// Instalar GTM en Next.js
export function installGTM() {
  // GTM Script
  const gtmScript = \`
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','\${GTM_ID}');
  \`;
  
  // GTM Noscript
  const gtmNoScript = \`
    <noscript>
      <iframe src="https://www.googletagmanager.com/ns.html?id=\${GTM_ID}"
              height="0" width="0" style="display:none;visibility:hidden">
      </iframe>
    </noscript>
  \`;
  
  return { gtmScript, gtmNoScript };
}

// DataLayer events para GTM
export function pushToDataLayer(event, data = {}) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Events específicos para InterTravel
export const GTMEvents = {
  packageView: (packageData) => pushToDataLayer('package_view', {
    package_id: packageData.id,
    package_name: packageData.title,
    destination: packageData.destination,
    price: packageData.price.amount,
    currency: packageData.price.currency
  }),
  
  whatsappClick: (packageData) => pushToDataLayer('whatsapp_click', {
    package_id: packageData.id,
    package_name: packageData.title,
    contact_method: 'whatsapp'
  }),
  
  searchPerformed: (query, results) => pushToDataLayer('search_performed', {
    search_term: query,
    results_count: results
  })
};`;

  return gtmSetup;
}

// ===============================================
// EJECUTAR IMPLEMENTACIÓN GA4 COMPLETA
// ===============================================

async function implementCompleteGA4() {
  console.log('📊 IMPLEMENTANDO GA4 ENHANCED ECOMMERCE COMPLETO');
  console.log('===============================================');
  
  try {
    // 1. Crear configuración GA4
    const ga4Config = generateGA4Config();
    fs.writeFileSync('./frontend/src/utils/ga4-tracking.ts', ga4Config);
    
    // 2. Crear hook React
    const ga4Hook = generateGA4Hook();
    fs.writeFileSync('./frontend/src/hooks/useGA4.ts', ga4Hook);
    
    // 3. Crear setup GTM
    const gtmSetup = generateGTMSetup();
    fs.writeFileSync('./frontend/src/utils/gtm-setup.ts', gtmSetup);
    
    // 4. Crear variables de entorno
    const envGA4 = `# GA4 Configuration
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA4_DEBUG=false`;
    
    fs.writeFileSync('./frontend/.env.ga4', envGA4);
    
    console.log('\\n✅ GA4 IMPLEMENTACIÓN COMPLETADA');
    console.log('===============================');
    console.log('📁 Archivos creados:');
    console.log('   - frontend/src/utils/ga4-tracking.ts');
    console.log('   - frontend/src/hooks/useGA4.ts');
    console.log('   - frontend/src/utils/gtm-setup.ts');
    console.log('   - frontend/.env.ga4');
    
    console.log('\\n📋 EVENTS GA4 IMPLEMENTADOS:');
    console.log('   ✅ view_item_list (lista paquetes)');
    console.log('   ✅ view_item (detalle paquete)');
    console.log('   ✅ search (búsqueda paquetes)');
    console.log('   ✅ generate_lead (contacto WhatsApp)');
    console.log('   ✅ add_to_cart (reserva iniciada)');
    console.log('   ✅ purchase (reserva completada)');
    console.log('   ✅ scroll depth tracking');
    console.log('   ✅ time on page tracking');
    
    return {
      status: 'completed',
      events: ['view_item_list', 'view_item', 'search', 'generate_lead', 'add_to_cart', 'purchase'],
      files: [
        'frontend/src/utils/ga4-tracking.ts',
        'frontend/src/hooks/useGA4.ts',
        'frontend/src/utils/gtm-setup.ts',
        'frontend/.env.ga4'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error implementando GA4:', error);
    return { status: 'error', error: error.message };
  }
}

// Ejecutar implementación
if (require.main === module) {
  implementCompleteGA4();
}

module.exports = {
  implementCompleteGA4,
  generateGA4Config,
  generateGA4Hook,
  generateGTMSetup
};
