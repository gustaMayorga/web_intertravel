// ===============================================
// Google Tag Manager Setup - InterTravel
// ===============================================

// GTM Container ID
export const GTM_ID = 'GTM-XXXXXXX';

// Instalar GTM en Next.js
export function installGTM() {
  // GTM Script
  const gtmScript = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GTM_ID}');
  `;
  
  // GTM Noscript
  const gtmNoScript = `
    <noscript>
      <iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
              height="0" width="0" style="display:none;visibility:hidden">
      </iframe>
    </noscript>
  `;
  
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
};