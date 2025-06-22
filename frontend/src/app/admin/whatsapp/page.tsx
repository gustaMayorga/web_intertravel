'use client';

import React, { useState, useEffect } from 'react';
import { Save, MessageCircle, Settings, Phone, Clock, Wand2, Eye } from 'lucide-react';

export default function WhatsAppConfigPage() {
  const [config, setConfig] = useState({
    main: '+5492615555555',
    results: '+5492615555556', 
    detail: '+5492615555557',
    agency: '+5492615555558',
    prebooking: '+5492615555559'
  });

  const [messages, setMessages] = useState({
    main: 'Hola! Me interesa conocer más sobre sus paquetes',
    results: 'Me interesa obtener más información sobre los paquetes disponibles', 
    detail: 'Me interesa el paquete [PACKAGE_NAME] y me gustaría recibir más información',
    agency: 'Hola! Soy agencia de viajes y necesito información sobre su plataforma B2B',
    prebooking: 'Completé el formulario de prebooking y me gustaría finalizar mi reserva'
  });

  const [globalSettings, setGlobalSettings] = useState({
    hours: 'Lun-Vie 9:00-18:00, Sáb 9:00-13:00',
    welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué podemos ayudarte hoy?',
    offHoursMessage: 'Gracias por contactarnos. Nuestro horario de atención es Lun-Vie 9:00-18:00. Te responderemos a la brevedad. 🕒'
  });

  const [previewContext, setPreviewContext] = useState('main');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const landingPages = [
    { key: 'main', name: 'Landing Principal', icon: '🏠', description: 'Página principal del sitio' },
    { key: 'results', name: 'Resultados de Búsqueda', icon: '🔍', description: 'Página de resultados de paquetes' },
    { key: 'detail', name: 'Detalle de Paquete', icon: '📦', description: 'Página de detalles específicos' },
    { key: 'agency', name: 'Portal de Agencias', icon: '🏢', description: 'Portal B2B para agencias' },
    { key: 'prebooking', name: 'Prebooking', icon: '📋', description: 'Formulario de reserva previa' }
  ];

  // Cargar configuración al inicializar
  useEffect(() => {
    loadCurrentConfiguration();
  }, []);

  const loadCurrentConfiguration = async () => {
    try {
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config.whatsapp);
          setMessages(data.config.messages);
          setGlobalSettings(data.config.globalSettings);
        }
      }
    } catch (error) {
      console.log('Usando configuración por defecto');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (landing: string, value: string) => {
    setConfig(prev => ({ ...prev, [landing]: value }));
  };

  const handleMessageChange = (landing: string, value: string) => {
    setMessages(prev => ({ ...prev, [landing]: value }));
  };

  const handleGlobalSettingChange = (key: string, value: string) => {
    setGlobalSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateJavaScriptConfig = () => {
    return `
// Configuración de WhatsApp generada automáticamente
window.INTERTRAVEL_CONFIG = {
  whatsapp: {
    main: '${config.main}',
    results: '${config.results}',
    detail: '${config.detail}',
    agency: '${config.agency}',
    prebooking: '${config.prebooking}'
  },
  messages: {
    main: '${messages.main}',
    results: '${messages.results}',
    detail: '${messages.detail}',
    agency: '${messages.agency}',
    prebooking: '${messages.prebooking}'
  },
  globalSettings: {
    hours: '${globalSettings.hours}',
    welcomeMessage: '${globalSettings.welcomeMessage}',
    offHoursMessage: '${globalSettings.offHoursMessage}'
  },
  lastUpdated: '${new Date().toISOString()}'
};

// Función global para WhatsApp
function openWhatsAppWithConfig(context, packageName = '') {
  const config = window.INTERTRAVEL_CONFIG;
  let phoneNumber = config.whatsapp.main;
  let message = config.messages.main;
  
  // Seleccionar número y mensaje según contexto
  if (config.whatsapp[context] && config.messages[context]) {
    phoneNumber = config.whatsapp[context];
    message = config.messages[context];
    
    // Reemplazar variables en el mensaje
    if (packageName && message.includes('[PACKAGE_NAME]')) {
      message = message.replace('[PACKAGE_NAME]', packageName);
    }
  }
  
  const url = \`https://wa.me/\${phoneNumber}?text=\${encodeURIComponent(message)}\`;
  window.open(url, '_blank');
}
    `;
  };

  const testWhatsApp = (context: string) => {
    const phoneNumber = config[context as keyof typeof config];
    let message = messages[context as keyof typeof messages];
    
    if (context === 'detail' && message.includes('[PACKAGE_NAME]')) {
      message = message.replace('[PACKAGE_NAME]', 'Paquete de Prueba');
    }
    
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const saveConfiguration = async () => {
    setSaving(true);
    
    try {
      // Preparar configuración
      const configData = {
        whatsapp: config,
        messages: messages,
        globalSettings: globalSettings,
        lastUpdated: new Date().toISOString()
      };
      
      // Guardar en API
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: configData })
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Actualizar configuración global en el browser
        if (typeof window !== 'undefined') {
          (window as any).INTERTRAVEL_CONFIG = configData;
        }
        
        // Generar script de configuración para debug
        const configScript = generateJavaScriptConfig();
        console.log('📱 Configuración de WhatsApp guardada exitosamente:', configScript);
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewMessage = () => {
    let message = messages[previewContext as keyof typeof messages];
    if (previewContext === 'detail' && message.includes('[PACKAGE_NAME]')) {
      message = message.replace('[PACKAGE_NAME]', 'Camboriú Mágico');
    }
    return message;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-green-600" />
              Configuración de WhatsApp
            </h1>
            <p className="text-gray-600 mt-2">
              Configura números de WhatsApp y mensajes personalizados para cada landing page
            </p>
          </div>
          
          <button
            onClick={saveConfiguration}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
        
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            ✅ Configuración guardada exitosamente. Los cambios se aplicarán a todas las páginas.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuración por Landing */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración por Landing Page
              </h2>
              <p className="text-gray-600 mt-1">
                Configura números y mensajes específicos para cada página
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {landingPages.map((landing) => (
                  <div key={landing.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{landing.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{landing.name}</h3>
                        <p className="text-sm text-gray-600">{landing.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Número de WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={config[landing.key as keyof typeof config]}
                          onChange={(e) => handleConfigChange(landing.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="+54 9 261 XXX-XXXX"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MessageCircle className="h-4 w-4 inline mr-1" />
                          Mensaje Predeterminado
                        </label>
                        <textarea
                          value={messages[landing.key as keyof typeof messages]}
                          onChange={(e) => handleMessageChange(landing.key, e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Mensaje que se enviará por defecto..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => testWhatsApp(landing.key)}
                        className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Wand2 className="h-4 w-4" />
                        Probar WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Configuración Global */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuración Global
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Atención
                </label>
                <input
                  type="text"
                  value={globalSettings.hours}
                  onChange={(e) => handleGlobalSettingChange('hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje de Bienvenida
                </label>
                <textarea
                  value={globalSettings.welcomeMessage}
                  onChange={(e) => handleGlobalSettingChange('welcomeMessage', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje Fuera de Horario
                </label>
                <textarea
                  value={globalSettings.offHoursMessage}
                  onChange={(e) => handleGlobalSettingChange('offHoursMessage', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Vista Previa
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Landing
                </label>
                <select
                  value={previewContext}
                  onChange={(e) => setPreviewContext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {landingPages.map((landing) => (
                    <option key={landing.key} value={landing.key}>
                      {landing.icon} {landing.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* WhatsApp Preview */}
              <div className="bg-green-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">InterTravel Group</div>
                    <div className="text-xs opacity-90">{config[previewContext as keyof typeof config]}</div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="text-sm">{getPreviewMessage()}</div>
                </div>
              </div>
              
              <button
                onClick={() => testWhatsApp(previewContext)}
                className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Probar en WhatsApp
              </button>
            </div>
          </div>
          
          {/* Generated Config Preview */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 mt-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Configuración Generada</h3>
            </div>
            <div className="p-4">
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {generateJavaScriptConfig().substring(0, 300)}...
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Esta configuración se aplicará automáticamente a todas las páginas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}