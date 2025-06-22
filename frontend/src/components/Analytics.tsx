// ==============================================
// 🔧 SOLUCIÓN PARA ERRORES DE ANALYTICS
// ==============================================

'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface AnalyticsProps {
  GA_MEASUREMENT_ID?: string;
  META_PIXEL_ID?: string;
  GOOGLE_ADS_ID?: string;
  HOTJAR_ID?: string;
  CLARITY_ID?: string;
  TIKTOK_PIXEL_ID?: string;
  LINKEDIN_PARTNER_ID?: string;
}

export default function Analytics({ 
  GA_MEASUREMENT_ID,
  META_PIXEL_ID,
  GOOGLE_ADS_ID,
  HOTJAR_ID,
  CLARITY_ID,
  TIKTOK_PIXEL_ID,
  LINKEDIN_PARTNER_ID
}: AnalyticsProps) {

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics 4 solo si tenemos ID válido
    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    // Initialize Meta Pixel solo si tenemos ID válido
    if (META_PIXEL_ID && META_PIXEL_ID !== '000000000000000' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [GA_MEASUREMENT_ID, META_PIXEL_ID]);

  // Función para verificar si un ID es válido
  const isValidId = (id?: string) => {
    return id && 
           id !== 'G-XXXXXXXXXX' && 
           id !== '000000000000000' && 
           id !== 'AW-XXXXXXXXX' &&
           id !== 'HOTJAR_ID_REPLACE' &&
           id !== 'CLARITY_ID_REPLACE' &&
           id !== 'TT_PIXEL_ID_REPLACE' &&
           id !== 'LINKEDIN_PARTNER_ID_REPLACE' &&
           id !== 'null' &&
           id !== 'undefined';
  };

  return (
    <>
      {/* Google Analytics 4 - solo si ID válido */}
      {isValidId(GA_MEASUREMENT_ID) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true,
                custom_map: {
                  'custom_parameter_1': 'intertravel_user_type',
                  'custom_parameter_2': 'package_category'
                }
              });
            `}
          </Script>
        </>
      )}

      {/* Google Ads - solo si ID válido */}
      {isValidId(GOOGLE_ADS_ID) && (
        <Script id="google-ads" strategy="afterInteractive">
          {`
            if (typeof gtag !== 'undefined') {
              gtag('config', '${GOOGLE_ADS_ID}');
            }
          `}
        </Script>
      )}

      {/* Meta Pixel (Facebook) - solo si ID válido */}
      {isValidId(META_PIXEL_ID) && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* TikTok Pixel - solo si ID válido */}
      {isValidId(TIKTOK_PIXEL_ID) && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${TIKTOK_PIXEL_ID}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* LinkedIn Insight Tag - solo si ID válido */}
      {isValidId(LINKEDIN_PARTNER_ID) && (
        <>
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`
              _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            `}
          </Script>
          <Script strategy="afterInteractive">
            {`
              (function(l) {
                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q=[]}
                var s = document.getElementsByTagName("script")[0];
                var b = document.createElement("script");
                b.type = "text/javascript";b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);})(window.lintrk);
            `}
          </Script>
        </>
      )}

      {/* Hotjar - solo si ID válido */}
      {isValidId(HOTJAR_ID) && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${HOTJAR_ID},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* Microsoft Clarity - solo si ID válido */}
      {isValidId(CLARITY_ID) && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}

      {/* Fallback Analytics para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <Script id="dev-analytics" strategy="afterInteractive">
          {`
            // Mock analytics para desarrollo
            window.gtag = window.gtag || function() {
              console.log('[Dev Analytics] GA4:', arguments);
            };
            window.fbq = window.fbq || function() {
              console.log('[Dev Analytics] Meta Pixel:', arguments);
            };
            window.ttq = window.ttq || {
              track: function() {
                console.log('[Dev Analytics] TikTok Pixel:', arguments);
              },
              page: function() {
                console.log('[Dev Analytics] TikTok Page View');
              }
            };
            window.clarity = window.clarity || function() {
              console.log('[Dev Analytics] Clarity:', arguments);
            };
            window.hj = window.hj || function() {
              console.log('[Dev Analytics] Hotjar:', arguments);
            };
            
            console.log('📊 Analytics en modo desarrollo - usando mocks');
          `}
        </Script>
      )}
    </>
  );
}

// Hook para tracking de eventos - mejorado con validaciones
export const useAnalytics = () => {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'intertravel_interaction',
          event_label: parameters?.label || eventName,
          value: parameters?.value || 1,
          ...parameters
        });
      }

      // Meta Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, parameters);
      }

      // TikTok Pixel
      if (typeof window !== 'undefined' && window.ttq && window.ttq.track) {
        window.ttq.track(eventName, parameters);
      }
    } catch (error) {
      console.warn('Error tracking event:', error);
    }
  };

  const trackPurchase = (value: number, currency: string = 'USD', orderId?: string) => {
    try {
      const purchaseData = {
        value,
        currency,
        transaction_id: orderId,
        items: [{
          item_id: orderId,
          item_name: 'Travel Package',
          item_category: 'Travel',
          item_brand: 'InterTravel',
          quantity: 1,
          price: value
        }]
      };

      // Google Analytics 4 Enhanced Ecommerce
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'purchase', purchaseData);
      }

      // Meta Pixel Purchase
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          value,
          currency,
          content_ids: [orderId],
          content_type: 'product'
        });
      }
    } catch (error) {
      console.warn('Error tracking purchase:', error);
    }
  };

  const trackLead = (leadType: string = 'contact_form') => {
    try {
      const leadData = {
        event_category: 'lead_generation',
        event_label: leadType,
        value: 1
      };

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'generate_lead', leadData);
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', { content_category: leadType });
      }
    } catch (error) {
      console.warn('Error tracking lead:', error);
    }
  };

  const trackPageView = (pageName: string, pageCategory?: string) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: pageName,
          page_location: window.location.href,
          page_category: pageCategory || 'general'
        });
      }
    } catch (error) {
      console.warn('Error tracking page view:', error);
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackLead,
    trackPageView
  };
};

// Declaraciones TypeScript para window
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    ttq: any;
    lintrk: (...args: any[]) => void;
    hj: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
  }
}