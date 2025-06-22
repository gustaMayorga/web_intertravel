// Configuración centralizada del sistema de cookies de InterTravel

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export const COOKIE_CONFIG = {
  // Nombres de las cookies
  CONSENT_KEY: 'intertravel-cookie-consent',
  CONSENT_DATE_KEY: 'intertravel-consent-date',
  
  // Duración de las cookies (en segundos)
  DURATIONS: {
    session: 0, // Se elimina al cerrar el navegador
    oneYear: 365 * 24 * 60 * 60,
    twoYears: 2 * 365 * 24 * 60 * 60,
    threeMonths: 90 * 24 * 60 * 60,
    sixMonths: 180 * 24 * 60 * 60,
  },

  // Configuración por defecto
  DEFAULT_PREFERENCES: {
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  } as CookiePreferences,

  // Información detallada de cada categoría
  CATEGORIES: {
    necessary: {
      name: 'Cookies Necesarias',
      description: 'Esenciales para el funcionamiento básico del sitio web',
      icon: '🔒',
      color: 'green',
      required: true,
      cookies: [
        {
          name: 'intertravel_session',
          purpose: 'Mantener tu sesión de usuario activa',
          duration: 'Sesión del navegador',
          type: 'Primera parte'
        },
        {
          name: 'intertravel_preferences',
          purpose: 'Recordar configuraciones de idioma y región',
          duration: '1 año',
          type: 'Primera parte'
        },
        {
          name: 'csrf_token',
          purpose: 'Protección contra ataques de falsificación',
          duration: 'Sesión del navegador',
          type: 'Primera parte'
        }
      ]
    },
    analytics: {
      name: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio',
      icon: '📊',
      color: 'blue',
      required: false,
      cookies: [
        {
          name: '_ga',
          purpose: 'Identificar usuarios únicos para Google Analytics',
          duration: '2 años',
          type: 'Terceros (Google)'
        },
        {
          name: '_ga_XXXXXXXXXX',
          purpose: 'Análisis de comportamiento específico del sitio',
          duration: '2 años',
          type: 'Terceros (Google)'
        },
        {
          name: 'intertravel_analytics',
          purpose: 'Análisis interno de uso del sitio',
          duration: '6 meses',
          type: 'Primera parte'
        }
      ]
    },
    marketing: {
      name: 'Cookies de Marketing',
      description: 'Para mostrar anuncios relevantes y medir la efectividad',
      icon: '🎯',
      color: 'purple',
      required: false,
      cookies: [
        {
          name: 'fbp',
          purpose: 'Facebook Pixel para seguimiento de conversiones',
          duration: '3 meses',
          type: 'Terceros (Facebook)'
        },
        {
          name: '_fbq',
          purpose: 'Identificador de Facebook para publicidad',
          duration: '2 años',
          type: 'Terceros (Facebook)'
        },
        {
          name: 'google_ads',
          purpose: 'Google Ads para remarketing',
          duration: '90 días',
          type: 'Terceros (Google)'
        }
      ]
    },
    personalization: {
      name: 'Cookies de Personalización',
      description: 'Para personalizar tu experiencia de navegación',
      icon: '🎨',
      color: 'orange',
      required: false,
      cookies: [
        {
          name: 'intertravel_theme',
          purpose: 'Recordar preferencias de tema y diseño',
          duration: '1 año',
          type: 'Primera parte'
        },
        {
          name: 'search_history',
          purpose: 'Guardar historial de búsquedas para sugerencias',
          duration: '6 meses',
          type: 'Primera parte'
        },
        {
          name: 'wishlist_items',
          purpose: 'Mantener lista de destinos favoritos',
          duration: '1 año',
          type: 'Primera parte'
        }
      ]
    }
  }
};

/**
 * Utilidades para gestión de cookies
 */
export class CookieManager {
  /**
   * Obtiene las preferencias de cookies guardadas
   */
  static getPreferences(): CookiePreferences {
    if (typeof window === 'undefined') {
      return COOKIE_CONFIG.DEFAULT_PREFERENCES;
    }

    const saved = localStorage.getItem(COOKIE_CONFIG.CONSENT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Error parsing cookie preferences:', error);
      }
    }
    
    return COOKIE_CONFIG.DEFAULT_PREFERENCES;
  }

  /**
   * Guarda las preferencias de cookies
   */
  static savePreferences(preferences: CookiePreferences): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(COOKIE_CONFIG.CONSENT_KEY, JSON.stringify(preferences));
    localStorage.setItem(COOKIE_CONFIG.CONSENT_DATE_KEY, new Date().toISOString());
    
    this.applyPreferences(preferences);
  }

  /**
   * Verifica si ya se ha dado consentimiento
   */
  static hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(COOKIE_CONFIG.CONSENT_KEY);
  }

  /**
   * Aplica las preferencias de cookies
   */
  static applyPreferences(preferences: CookiePreferences): void {
    if (typeof window === 'undefined') return;

    // Google Analytics
    if (preferences.analytics) {
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Marketing cookies (Facebook Pixel, Google Ads, etc.)
    if (preferences.marketing) {
      (window as any).gtag?.('consent', 'update', {
        ad_storage: 'granted'
      });
      
      if ((window as any).fbq) {
        (window as any).fbq('consent', 'grant');
      }
    } else {
      (window as any).gtag?.('consent', 'update', {
        ad_storage: 'denied'
      });
      
      if ((window as any).fbq) {
        (window as any).fbq('consent', 'revoke');
      }
    }

    // Personalización
    if (preferences.personalization) {
      document.cookie = `intertravel_personalization=true; max-age=${COOKIE_CONFIG.DURATIONS.oneYear}; path=/; secure; samesite=strict`;
    } else {
      // Eliminar cookie de personalización
      document.cookie = 'intertravel_personalization=; max-age=0; path=/; secure; samesite=strict';
    }

    // Enviar evento de tracking si analytics está habilitado
    if (preferences.analytics && (window as any).gtag) {
      (window as any).gtag('event', 'cookie_preferences_updated', {
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        personalization: preferences.personalization,
        consent_date: new Date().toISOString()
      });
    }
  }

  /**
   * Resetea todas las preferencias de cookies
   */
  static resetConsent(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(COOKIE_CONFIG.CONSENT_KEY);
    localStorage.removeItem(COOKIE_CONFIG.CONSENT_DATE_KEY);
    
    // Aplicar configuración por defecto
    this.applyPreferences(COOKIE_CONFIG.DEFAULT_PREFERENCES);
  }

  /**
   * Obtiene la fecha del último consentimiento
   */
  static getConsentDate(): Date | null {
    if (typeof window === 'undefined') return null;

    const dateStr = localStorage.getItem(COOKIE_CONFIG.CONSENT_DATE_KEY);
    if (dateStr) {
      try {
        return new Date(dateStr);
      } catch (error) {
        console.warn('Error parsing consent date:', error);
      }
    }
    
    return null;
  }

  /**
   * Verifica si el consentimiento necesita renovación (más de 1 año)
   */
  static needsConsentRenewal(): boolean {
    const consentDate = this.getConsentDate();
    if (!consentDate) return true;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return consentDate < oneYearAgo;
  }

  /**
   * Crea una cookie con las configuraciones correctas
   */
  static setCookie(name: string, value: string, maxAge: number = COOKIE_CONFIG.DURATIONS.oneYear): void {
    if (typeof document === 'undefined') return;

    const secure = window.location.protocol === 'https:';
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; ${secure ? 'secure;' : ''} samesite=strict`;
  }

  /**
   * Obtiene el valor de una cookie específica
   */
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue || null;
      }
    }
    
    return null;
  }

  /**
   * Elimina una cookie específica
   */
  static deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;

    const secure = window.location.protocol === 'https:';
    document.cookie = `${name}=; max-age=0; path=/; ${secure ? 'secure;' : ''} samesite=strict`;
  }
}

/**
 * Hook personalizado para gestionar cookies en React
 */
export function useCookiePreferences() {
  const [preferences, setPreferences] = React.useState<CookiePreferences>(COOKIE_CONFIG.DEFAULT_PREFERENCES);
  const [hasConsent, setHasConsent] = React.useState(false);

  React.useEffect(() => {
    const currentPreferences = CookieManager.getPreferences();
    const consent = CookieManager.hasConsent();
    
    setPreferences(currentPreferences);
    setHasConsent(consent);
  }, []);

  const updatePreferences = React.useCallback((newPreferences: CookiePreferences) => {
    CookieManager.savePreferences(newPreferences);
    setPreferences(newPreferences);
    setHasConsent(true);
  }, []);

  const resetConsent = React.useCallback(() => {
    CookieManager.resetConsent();
    setPreferences(COOKIE_CONFIG.DEFAULT_PREFERENCES);
    setHasConsent(false);
  }, []);

  return {
    preferences,
    hasConsent,
    updatePreferences,
    resetConsent,
    needsRenewal: CookieManager.needsConsentRenewal()
  };
}

// Exportar React para el hook
import React from 'react';

export default CookieManager;