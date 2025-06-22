'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Cookie, Shield, X } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieSettings: React.FC<CookieSettingsProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    if (isOpen) {
      // Cargar preferencias actuales
      const saved = localStorage.getItem('intertravel-cookie-consent');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('intertravel-cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('intertravel-consent-date', new Date().toISOString());
    
    // Aplicar las preferencias (mismo código del CookieConsent)
    applyCookiePreferences(preferences);
    onClose();
  };

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Google Analytics
    if (prefs.analytics && typeof window !== 'undefined') {
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Marketing cookies
    if (prefs.marketing && typeof window !== 'undefined') {
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
    if (prefs.personalization) {
      document.cookie = `intertravel_personalization=true; max-age=${365 * 24 * 60 * 60}; path=/; secure; samesite=strict`;
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return;
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-xl font-bold">Configuración de Cookies</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Gestiona tus preferencias de cookies. Puedes activar o desactivar diferentes 
            tipos de cookies según tus necesidades.
          </p>

          <div className="space-y-4">
            {/* Cookies necesarias */}
            <div className="bg-gray-50 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Cookies Necesarias
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
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
            <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      📊
                    </div>
                    Cookies de Análisis
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Nos ayudan a entender cómo interactúas con nuestro sitio web.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('analytics')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.analytics ? 'bg-blue-500' : 'bg-gray-300'
                    } flex items-center ${preferences.analytics ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Cookies de marketing */}
            <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                      🎯
                    </div>
                    Cookies de Marketing
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Para mostrar anuncios relevantes y medir la efectividad.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('marketing')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.marketing ? 'bg-purple-500' : 'bg-gray-300'
                    } flex items-center ${preferences.marketing ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Cookies de personalización */}
            <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                      🎨
                    </div>
                    Cookies de Personalización
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Para recordar tus preferencias y personalizar tu experiencia.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('personalization')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.personalization ? 'bg-orange-500' : 'bg-gray-300'
                    } flex items-center ${preferences.personalization ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              Guardar Configuración
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Puedes cambiar estas configuraciones en cualquier momento desde el pie de página.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;