'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';

interface WhapifyWebChatProps {
  // Configuración básica
  botId: string;
  type?: 'float' | 'window' | 'container';
  element?: string;
  
  // Personalización visual
  headerTitle?: string;
  color?: string;
  hideHeader?: boolean;
  template?: 'template1' | 'template2';
  icon?: string;
  showPersona?: boolean;
  hideComposer?: boolean;
  
  // Posicionamiento (solo para tipo 'float')
  right?: string;
  bottom?: string;
  
  // Configuración de flujo
  ref?: string;
  loadMessages?: boolean;
  
  // Configuración Intertravel específica
  context?: 'landing' | 'packages' | 'package-detail' | 'agency' | 'admin' | 'prebooking';
  packageName?: string;
  
  // Control de visibilidad
  enabled?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

interface InterTravelWhapifyConfig {
  whapify: {
    botId: string;
    authorizedDomains: string[];
    defaultSettings: {
      headerTitle: string;
      color: string;
      template: 'template1' | 'template2';
      showPersona: boolean;
      loadMessages: boolean;
    };
    contextConfigs: {
      [key: string]: {
        ref?: string;
        headerTitle?: string;
        color?: string;
        welcomeMessage?: string;
      };
    };
  };
  integrations: {
    whatsapp: {
      enabled: boolean;
      fallbackNumber: string;
    };
    email: {
      enabled: boolean;
      fallbackEmail: string;
    };
  };
}

const WhapifyWebChat: React.FC<WhapifyWebChatProps> = ({
  botId,
  type = 'float',
  element,
  headerTitle = 'InterTravel Group',
  color = '#16213e',
  hideHeader = false,
  template,
  icon,
  showPersona = true,
  hideComposer = false,
  right = '20px',
  bottom = '20px',
  ref,
  loadMessages = true,
  context = 'landing',
  packageName,
  enabled = true,
  showOnMobile = true,
  showOnDesktop = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [config, setConfig] = useState<InterTravelWhapifyConfig | null>(null);

  // Detectar tipo de dispositivo
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth <= 768;
      setDeviceType(isMobile ? 'mobile' : 'desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Cargar configuración desde variables de entorno o API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Intentar cargar desde API del backend
        const response = await fetch('/api/whapify/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          // Fallback a configuración por defecto
          setConfig(getDefaultConfig());
        }
      } catch (error) {
        console.warn('Error cargando configuración Whapify, usando defaults:', error);
        setConfig(getDefaultConfig());
      }
    };

    loadConfig();
  }, []);

  const getDefaultConfig = (): InterTravelWhapifyConfig => ({
    whapify: {
      botId: botId || process.env.NEXT_PUBLIC_WHAPIFY_BOT_ID || '',
      authorizedDomains: [
        'localhost:3005',
        'intertravel.com.ar',
        'www.intertravel.com.ar',
        'admin.intertravel.com.ar',
        'agencias.intertravel.com.ar'
      ],
      defaultSettings: {
        headerTitle: 'InterTravel Group',
        color: '#16213e',
        template: 'template1',
        showPersona: true,
        loadMessages: true
      },
      contextConfigs: {
        landing: {
          ref: 'landing-welcome',
          headerTitle: 'InterTravel - Bienvenido',
          color: '#16213e',
          welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué destino soñás viajar?'
        },
        packages: {
          ref: 'packages-browse',
          headerTitle: 'InterTravel - Paquetes',
          color: '#2563eb',
          welcomeMessage: '¿Te ayudo a encontrar el paquete perfecto para tu próximo viaje? ✈️'
        },
        'package-detail': {
          ref: 'package-inquiry',
          headerTitle: 'InterTravel - Consulta',
          color: '#16a34a',
          welcomeMessage: '¿Te interesa este paquete? ¡Te ayudo con toda la información! 🎒'
        },
        agency: {
          ref: 'agency-portal',
          headerTitle: 'InterTravel B2B',
          color: '#7c3aed',
          welcomeMessage: 'Portal para Agencias - ¿Necesitás información sobre comisiones y tarifas? 🏢'
        },
        admin: {
          ref: 'admin-support',
          headerTitle: 'InterTravel - Soporte',
          color: '#dc2626',
          welcomeMessage: 'Soporte técnico y administrativo disponible 🛠️'
        },
        prebooking: {
          ref: 'prebooking-completion',
          headerTitle: 'InterTravel - Reserva',
          color: '#ea580c',
          welcomeMessage: '¡Perfecto! Te ayudo a completar tu reserva 📋'
        }
      }
    },
    integrations: {
      whatsapp: {
        enabled: true,
        fallbackNumber: '+5492615555555'
      },
      email: {
        enabled: true,
        fallbackEmail: 'info@intertravel.com.ar'
      }
    }
  });

  // Determinar configuración específica del contexto
  const getContextConfig = () => {
    if (!config) return {};
    
    const contextConfig = config.whapify.contextConfigs[context] || {};
    const defaultSettings = config.whapify.defaultSettings;
    
    return {
      headerTitle: contextConfig.headerTitle || headerTitle || defaultSettings.headerTitle,
      color: contextConfig.color || color || defaultSettings.color,
      ref: contextConfig.ref || ref,
      template: template || defaultSettings.template,
      showPersona: showPersona !== undefined ? showPersona : defaultSettings.showPersona,
      loadMessages: loadMessages !== undefined ? loadMessages : defaultSettings.loadMessages
    };
  };

  // Determinar si mostrar el chat basado en el dispositivo
  const shouldShow = () => {
    if (!enabled || !config) return false;
    if (deviceType === 'mobile' && !showOnMobile) return false;
    if (deviceType === 'desktop' && !showOnDesktop) return false;
    return true;
  };

  // Inicializar Whapify cuando el script se carga
  const initializeWhapify = () => {
    if (!config || isLoaded) return;

    const contextConfig = getContextConfig();
    
    const whapifyConfig: any = {
      botId: config.whapify.botId,
      type,
      headerTitle: contextConfig.headerTitle,
      color: contextConfig.color,
      hideHeader,
      showPersona: contextConfig.showPersona,
      hideComposer,
      loadMessages: contextConfig.loadMessages
    };

    // Configuraciones específicas por tipo
    if (type === 'float') {
      whapifyConfig.right = right;
      whapifyConfig.bottom = bottom;
      if (icon) whapifyConfig.icon = icon;
    } else if (type === 'container' && element) {
      whapifyConfig.element = element;
    }

    // Configurar template si está especificado
    if (contextConfig.template) {
      whapifyConfig.template = contextConfig.template;
    }

    // Configurar ref si está especificado
    if (contextConfig.ref) {
      whapifyConfig.ref = contextConfig.ref;
    }

    try {
      // @ts-ignore - Whapify se carga dinámicamente
      if (window.Whapify) {
        window.Whapify.init(whapifyConfig);
        setIsLoaded(true);
        
        // Eventos personalizados para integración con InterTravel
        window.addEventListener('whapify:chat:open', (event) => {
          console.log('Chat Whapify abierto:', event);
          // Analytics tracking
          if (window.gtag) {
            window.gtag('event', 'chat_opened', {
              event_category: 'engagement',
              event_label: context,
              custom_parameter_context: context,
              custom_parameter_package: packageName || 'none'
            });
          }
        });

        window.addEventListener('whapify:message:sent', (event) => {
          console.log('Mensaje enviado en Whapify:', event);
          // Analytics tracking
          if (window.gtag) {
            window.gtag('event', 'chat_message_sent', {
              event_category: 'engagement',
              event_label: context
            });
          }
        });

        window.addEventListener('whapify:lead:captured', (event) => {
          console.log('Lead capturado en Whapify:', event);
          // Integración con sistema de leads de InterTravel
          if (window.gtag) {
            window.gtag('event', 'lead_captured', {
              event_category: 'conversion',
              event_label: context,
              value: 1
            });
          }
          
          // Notificar al backend de InterTravel
          fetch('/api/leads/whapify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'whapify',
              context,
              packageName,
              timestamp: new Date().toISOString(),
              leadData: event.detail
            })
          }).catch(err => console.error('Error enviando lead a backend:', err));
        });

      } else {
        console.error('Whapify no está disponible');
      }
    } catch (error) {
      console.error('Error inicializando Whapify:', error);
    }
  };

  // Effect para reinicializar cuando cambia el contexto
  useEffect(() => {
    if (config && isLoaded) {
      setIsLoaded(false);
      setTimeout(() => {
        initializeWhapify();
      }, 100);
    }
  }, [context, packageName, config]);

  if (!shouldShow()) {
    return null;
  }

  return (
    <>
      {/* Script de Whapify */}
      <Script
        id="whapify-webchat"
        src="https://widget.whapify.ai/widget.js"
        strategy="afterInteractive"
        onLoad={initializeWhapify}
        onError={(error) => {
          console.error('Error cargando script de Whapify:', error);
        }}
      />

      {/* Container para chat tipo 'container' */}
      {type === 'container' && element && (
        <div id={element} className="whapify-container">
          {!isLoaded && (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando chat...</span>
            </div>
          )}
        </div>
      )}

      {/* Estilos personalizados para integración visual con InterTravel */}
      <style jsx global>{`
        /* Personalización del widget Whapify para InterTravel */
        .whapify-widget {
          font-family: 'Montserrat', sans-serif !important;
          z-index: 999999 !important;
        }
        
        .whapify-widget .whapify-header {
          background: linear-gradient(135deg, ${color} 0%, ${color}ee 100%) !important;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .whapify-widget .whapify-chat-bubble {
          background: ${color} !important;
          box-shadow: 0 4px 20px rgba(22, 33, 62, 0.3) !important;
        }
        
        .whapify-widget .whapify-message-user {
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%) !important;
          border-radius: 18px 18px 4px 18px !important;
        }
        
        .whapify-widget .whapify-message-bot {
          background: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 18px 18px 18px 4px !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .whapify-widget {
            bottom: 10px !important;
            right: 10px !important;
            left: 10px !important;
            width: auto !important;
          }
          
          .whapify-widget .whapify-chat-window {
            height: 60vh !important;
            max-height: 500px !important;
          }
        }
        
        /* Ocultar durante impresión */
        @media print {
          .whapify-widget {
            display: none !important;
          }
        }
        
        /* Animaciones suaves */
        .whapify-widget * {
          transition: all 0.3s ease !important;
        }
        
        /* Compatibilidad con tema oscuro de InterTravel */
        .dark .whapify-widget .whapify-message-bot {
          background: #374151 !important;
          border-color: #4b5563 !important;
          color: #f9fafb !important;
        }
      `}</style>
    </>
  );
};

export default WhapifyWebChat;