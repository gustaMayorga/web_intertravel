// ===============================================
// GOOGLE ANALYTICS 4 INTEGRATION
// ===============================================

import { useEffect } from 'react';
import { trackEvent } from '@/lib/api-config';

// Configuración de GA4
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ===============================================
// INICIALIZACIÓN DE GOOGLE ANALYTICS
// ===============================================

/**
 * Inicializar Google Analytics 4
 */
export const initGA = () => {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') return;

  // Evitar múltiples inicializaciones
  if (window.gtag) return;

  // Cargar script de Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Inicializar dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configurar GA4
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: 'InterTravel',
    page_location: window.location.href,
    send_page_view: true
  });

  console.log('📊 Google Analytics 4 initialized:', GA_MEASUREMENT_ID);
};

// ===============================================
// FUNCIONES DE TRACKING
// ===============================================

/**
 * Trackear página vista
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle,
  });

  // También trackear en nuestro backend
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    timestamp: new Date().toISOString()
  });

  console.log('📊 Page view tracked:', pagePath);
};

/**
 * Trackear evento personalizado
 */
export const trackCustomEvent = (
  eventName: string, 
  parameters: Record<string, any> = {}
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  // Trackear en Google Analytics
  window.gtag('event', eventName, {
    event_category: parameters.category || 'engagement',
    event_label: parameters.label,
    value: parameters.value,
    ...parameters
  });

  // También trackear en nuestro backend
  trackEvent(eventName, parameters);

  console.log('📊 Event tracked:', eventName, parameters);
};

/**
 * Trackear conversión de reserva
 */
export const trackBookingConversion = (bookingData: {
  bookingId: string;
  packageName: string;
  destination: string;
  amount: number;
  currency?: string;
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  // Evento de conversión en GA4
  window.gtag('event', 'purchase', {
    transaction_id: bookingData.bookingId,
    value: bookingData.amount,
    currency: bookingData.currency || 'ARS',
    items: [{
      item_id: bookingData.bookingId,
      item_name: bookingData.packageName,
      item_category: 'travel_package',
      item_variant: bookingData.destination,
      price: bookingData.amount,
      quantity: 1
    }]
  });

  // También trackear en nuestro backend
  trackEvent('booking_conversion', bookingData);

  console.log('🎯 Booking conversion tracked:', bookingData);
};

/**
 * Trackear inicio de proceso de pago
 */
export const trackPaymentStart = (paymentData: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
}) => {
  trackCustomEvent('begin_checkout', {
    category: 'ecommerce',
    booking_id: paymentData.bookingId,
    value: paymentData.amount,
    payment_method: paymentData.paymentMethod
  });
};

/**
 * Trackear pago completado
 */
export const trackPaymentComplete = (paymentData: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  status: string;
}) => {
  trackCustomEvent('payment_complete', {
    category: 'ecommerce',
    booking_id: paymentData.bookingId,
    value: paymentData.amount,
    payment_method: paymentData.paymentMethod,
    payment_status: paymentData.status
  });
};

/**
 * Trackear registro de usuario
 */
export const trackUserRegistration = (userData: {
  userId: string;
  email: string;
  registrationMethod?: string;
}) => {
  trackCustomEvent('sign_up', {
    category: 'user',
    user_id: userData.userId,
    method: userData.registrationMethod || 'email'
  });
};

/**
 * Trackear login de usuario
 */
export const trackUserLogin = (userData: {
  userId: string;
  email: string;
  loginMethod?: string;
}) => {
  trackCustomEvent('login', {
    category: 'user',
    user_id: userData.userId,
    method: userData.loginMethod || 'email'
  });
};

// ===============================================
// HOOK DE REACT PARA GOOGLE ANALYTICS
// ===============================================

/**
 * Hook para inicializar Google Analytics en componentes
 */
export const useGoogleAnalytics = () => {
  useEffect(() => {
    initGA();
  }, []);

  return {
    trackPageView,
    trackCustomEvent,
    trackBookingConversion,
    trackPaymentStart,
    trackPaymentComplete,
    trackUserRegistration,
    trackUserLogin
  };
};

// ===============================================
// COMPONENTE DE GOOGLE ANALYTICS
// ===============================================

/**
 * Componente para agregar Google Analytics a la app
 */
export const GoogleAnalytics = () => {
  useEffect(() => {
    initGA();
  }, []);

  return null; // Este componente no renderiza nada
};

export default GoogleAnalytics;
