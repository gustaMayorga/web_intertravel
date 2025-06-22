'use client';

import React, { useState } from 'react';
import { Cookie, Settings, Shield, Info, AlertCircle, CheckCircle, X } from 'lucide-react';

const CookiePolicy: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const cookieCategories = [
    {
      id: 'necessary',
      name: 'Cookies Necesarias',
      icon: '🔒',
      color: 'green',
      required: true,
      description: 'Esenciales para el funcionamiento básico del sitio web',
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
    {
      id: 'analytics',
      name: 'Cookies de Análisis',
      icon: '📊',
      color: 'blue',
      required: false,
      description: 'Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio',
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
    {
      id: 'marketing',
      name: 'Cookies de Marketing',
      icon: '🎯',
      color: 'purple',
      required: false,
      description: 'Para mostrar anuncios relevantes y medir la efectividad',
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
    {
      id: 'personalization',
      name: 'Cookies de Personalización',
      icon: '🎨',
      color: 'orange',
      required: false,
      description: 'Para personalizar tu experiencia de navegación',
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
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const manageCookies = () => {
    // Aquí se podría abrir el banner de cookies nuevamente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intertravel-cookie-consent');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Cookie className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Política de Cookies</h1>
          </div>
          <p className="text-center text-xl text-orange-100 max-w-3xl mx-auto">
            Todo lo que necesitas saber sobre las cookies que utilizamos en InterTravel
          </p>
          <div className="text-center mt-4">
            <span className="bg-orange-500 px-4 py-2 rounded-full text-sm">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Gestión rápida */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">🎛️ Gestiona tus Cookies Ahora</h2>
            <p className="mb-6 text-blue-100">
              Controla qué cookies quieres permitir en tu navegador
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={manageCookies}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Configurar Cookies</span>
              </button>
              <a 
                href="/politica-privacidad"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Ver Política de Privacidad
              </a>
            </div>
          </div>

          {/* Categorías de cookies */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Tipos de Cookies que Utilizamos
            </h2>

            {cookieCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className={`p-6 cursor-pointer transition-all ${getColorClasses(category.color)} border-l-4`}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{category.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {category.name}
                          {category.required && (
                            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              REQUERIDA
                            </span>
                          )}
                        </h3>
                        <p className="text-sm opacity-80">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.required ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      )}
                      <div className={`transform transition-transform ${selectedCategory === category.id ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCategory === category.id && (
                  <div className="p-6 bg-gray-50 border-t">
                    <div className="grid gap-4">
                      {category.cookies.map((cookie, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border">
                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Nombre</h4>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{cookie.name}</code>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Propósito</h4>
                              <p className="text-sm text-gray-700">{cookie.purpose}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Duración</h4>
                              <p className="text-sm text-gray-700">{cookie.duration}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Tipo</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                cookie.type.includes('Primera') 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {cookie.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cómo controlar las cookies */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Cómo Controlar las Cookies</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">En nuestro sitio web:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>Banner de consentimiento:</strong> Al visitar nuestro sitio, puedes elegir qué cookies aceptar
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>Centro de preferencias:</strong> Modifica tus preferencias en cualquier momento
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">En tu navegador:</h3>
                <div className="space-y-2">
                  <a href="https://support.google.com/chrome/answer/95647" 
                     className="block text-blue-600 hover:underline text-sm">
                    • Google Chrome - Gestionar cookies
                  </a>
                  <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                     className="block text-blue-600 hover:underline text-sm">
                    • Mozilla Firefox - Configurar cookies
                  </a>
                  <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" 
                     className="block text-blue-600 hover:underline text-sm">
                    • Safari - Preferencias de privacidad
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;