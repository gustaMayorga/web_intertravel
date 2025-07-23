// ===============================================
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
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
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
    event_label: `${contactMethod}_${packageData.id}`,
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
};