'use client';

import { useState, useEffect } from 'react';

interface WhatsAppFloatingProps {
  phone?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showAnimation?: boolean;
  adminConfigurable?: boolean;
}

export default function WhatsAppFloating({
  phone = '5492611234567',
  message = '¡Hola! Me interesa conocer más sobre los paquetes de viaje 🌍',
  position = 'bottom-right',
  showAnimation = true,
  adminConfigurable = true
}: WhatsAppFloatingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [adminConfig, setAdminConfig] = useState({
    phone: phone,
    message: message,
    enabled: true,
    animation: showAnimation
  });

  // Cargar configuración desde admin (si está habilitado)
  useEffect(() => {
    if (adminConfigurable) {
      loadAdminConfig();
    }
    
    // Mostrar después de 3 segundos
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loadAdminConfig = async () => {
    try {
      // Cambiar puerto para hacer la llamada al backend correcto
      const response = await fetch('http://localhost:3002/api/admin/whatsapp-config');
      if (response.ok) {
        const config = await response.json();
        if (config.success) {
          setAdminConfig({
            phone: config.data.phone || phone,
            message: config.data.message || message,
            enabled: config.data.enabled !== false,
            animation: config.data.animation !== false
          });
        }
      }
    } catch (error) {
      // Silenciar error y usar configuración por defecto
      // console.log('Usando configuración por defecto de WhatsApp');
    }
  };

  const handleClick = () => {
    const whatsappUrl = `https://wa.me/${adminConfig.phone}?text=${encodeURIComponent(adminConfig.message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: 'floating_button',
        value: 1
      });
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-24 right-6';
      case 'top-left':
        return 'top-24 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  if (!adminConfig.enabled || !isVisible) return null;

  return (
    <>
      {/* Botón flotante de WhatsApp */}
      <div className={`fixed ${getPositionClasses()} z-50 group`}>
        
        {/* Tooltip con mensaje */}
        <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white text-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-xs border border-green-200">
            <div className="font-bold text-green-600 mb-1">💬 ¡Hablemos!</div>
            <div className="text-sm">
              Consulta sobre paquetes, precios y disponibilidad
            </div>
            
            {/* Flecha del tooltip */}
            <div className="absolute top-full right-4 border-4 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* Botón principal */}
        <button
          onClick={handleClick}
          className={`
            w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 
            rounded-full shadow-2xl hover:scale-110 active:scale-95 
            transition-all duration-300 flex items-center justify-center
            ${adminConfig.animation ? 'animate-bounce' : ''}
            hover:shadow-green-500/50 border-4 border-white
          `}
          style={{
            animation: adminConfig.animation ? 'whatsapp-pulse 2s infinite' : undefined
          }}
        >
          {/* Icono de WhatsApp */}
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="white"
            className="drop-shadow-sm"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
          </svg>
        </button>

        {/* Indicador de pulso */}
        {adminConfig.animation && (
          <>
            <div className="absolute inset-0 w-16 h-16 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-2 w-12 h-12 bg-green-400 rounded-full animate-ping opacity-50 animation-delay-300"></div>
          </>
        )}
      </div>

      {/* Estilos personalizados */}
      <style jsx>{`
        @keyframes whatsapp-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6);
          }
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        @keyframes slide-in-from-bottom-2 {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-2 {
          animation-name: slide-in-from-bottom-2;
        }
      `}</style>
    </>
  );
}

// Hook para configuración administrativa
export const useWhatsAppConfig = () => {
  const [config, setConfig] = useState({
    phone: '5492611234567',
    message: '¡Hola! Me interesa conocer más sobre los paquetes de viaje 🌍',
    enabled: true,
    animation: true,
    position: 'bottom-right' as const
  });

  const updateConfig = async (newConfig: Partial<typeof config>) => {
    try {
      const response = await fetch('/api/admin/whatsapp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        setConfig(prev => ({ ...prev, ...newConfig }));
        return { success: true };
      }
    } catch (error) {
      console.error('Error actualizando configuración WhatsApp:', error);
    }
    return { success: false };
  };

  return { config, updateConfig };
};
