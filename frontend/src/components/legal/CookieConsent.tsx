'use client';

import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings, Info } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Siempre activadas
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    // Verificar si ya se dió consentimiento
    const consent = localStorage.getItem('intertravel-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      // Aplicar las preferencias guardadas
      applyCookiePreferences(savedPreferences);
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Google Analytics
    if (prefs.analytics && typeof window !== 'undefined') {
      // Activar Google Analytics
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Marketing cookies (Facebook Pixel, etc.)
    if (prefs.marketing && typeof window !== 'undefined') {
      (window as any).gtag?.('consent', 'update', {
        ad_storage: 'granted'
      });
      // Activar Facebook Pixel si existe
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
    if (prefs.personalization) {
      // Activar cookies de personalización
      document.cookie = `intertravel_personalization=true; max-age=${365 * 24 * 60 * 60}; path=/; secure; samesite=strict`;
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('intertravel-cookie-consent', JSON.stringify(allAccepted));
    localStorage.setItem('intertravel-consent-date', new Date().toISOString());
    
    applyCookiePreferences(allAccepted);
    setIsVisible(false);
    
    // Enviar evento a Google Analytics si está disponible
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cookie_consent', {
        consent_type: 'accept_all'
      });
    }
  };

  const handleRejectOptional = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    
    setPreferences(minimalConsent);
    localStorage.setItem('intertravel-cookie-consent', JSON.stringify(minimalConsent));
    localStorage.setItem('intertravel-consent-date', new Date().toISOString());
    
    applyCookiePreferences(minimalConsent);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('intertravel-cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('intertravel-consent-date', new Date().toISOString());
    
    applyCookiePreferences(preferences);
    setIsVisible(false);
    
    // Enviar evento a Google Analytics si está disponible
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cookie_consent', {
        consent_type: 'custom',
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        personalization: preferences.personalization
      });
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return; // No se puede desactivar
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-t-3xl shadow-2xl border-t-4 border-blue-600 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cookie className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">🍪 Gestión de Cookies</h2>
                <p className="text-blue-100">Respetamos tu privacidad</p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-red-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showDetails ? (
            // Vista simple
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tu privacidad es importante para nosotros
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Utilizamos cookies para mejorar tu experiencia de navegación, 
                    analizar el tráfico del sitio y personalizar el contenido. 
                    Puedes gestionar tus preferencias de cookies a continuación.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>¿Qué son las cookies?</strong> Son pequeños archivos que 
                    almacenan información en tu navegador para mejorar tu experiencia 
                    en nuestro sitio web.
                  </p>
                </div>
              </div>

              {/* Botones principales */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  ✅ Aceptar todas
                </button>
                
                <button
                  onClick={handleRejectOptional}
                  className="flex-1 bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-700 transition-all duration-300"
                >
                  Solo necesarias
                </button>
                
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 border-2 border-blue-600 text-blue-600 font-semibold py-4 px-6 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Settings className="w-5 h-5" />
                  <span>Personalizar</span>
                </button>
              </div>

              {/* Enlaces legales */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-4 border-t">
                <a href="/politica-privacidad" className="hover:text-blue-600 underline">
                  Política de Privacidad
                </a>
                <a href="/politica-cookies" className="hover:text-blue-600 underline">
                  Política de Cookies
                </a>
                <a href="/terminos-condiciones" className="hover:text-blue-600 underline">
                  Términos y Condiciones
                </a>
              </div>
            </div>
          ) : (
            // Vista detallada
            <div className="space-y-6">
              <button
                onClick={() => setShowDetails(false)}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
              >
                <span>← Volver</span>
              </button>

              <h3 className="text-xl font-bold text-gray-900">
                Configura tus preferencias de cookies
              </h3>

              <div className="space-y-4">
                {/* Cookies necesarias */}
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Cookies Necesarias</h4>
                      <p className="text-sm text-gray-600">
                        Esenciales para el funcionamiento del sitio web. No se pueden desactivar.
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end pr-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookies de análisis */}
                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Cookies de Análisis</h4>
                      <p className="text-sm text-gray-600">
                        Nos ayudan a entender cómo interactúas con nuestro sitio web (Google Analytics).
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handlePreferenceChange('analytics')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.analytics ? 'bg-blue-500' : 'bg-gray-300'
                        } flex items-center ${preferences.analytics ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cookies de marketing */}
                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Cookies de Marketing</h4>
                      <p className="text-sm text-gray-600">
                        Para mostrar anuncios relevantes y medir la efectividad de nuestras campañas.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handlePreferenceChange('marketing')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.marketing ? 'bg-blue-500' : 'bg-gray-300'
                        } flex items-center ${preferences.marketing ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cookies de personalización */}
                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Cookies de Personalización</h4>
                      <p className="text-sm text-gray-600">
                        Para recordar tus preferencias y personalizar tu experiencia.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handlePreferenceChange('personalization')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.personalization ? 'bg-blue-500' : 'bg-gray-300'
                        } flex items-center ${preferences.personalization ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                >
                  Guardar Preferencias
                </button>
                
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300"
                >
                  Aceptar todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-600">
            Al continuar navegando, aceptas nuestro uso de cookies de acuerdo con nuestra 
            <a href="/politica-cookies" className="text-blue-600 hover:underline ml-1">
              Política de Cookies
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;