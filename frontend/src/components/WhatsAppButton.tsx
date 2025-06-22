'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Tipos para la configuración de WhatsApp
interface WhatsAppConfig {
  whatsapp: {
    main: string;
    results: string;
    detail: string;
    agency: string;
    prebooking: string;
  };
  messages: {
    main: string;
    results: string;
    detail: string;
    agency: string;
    prebooking: string;
  };
  globalSettings: {
    hours: string;
    welcomeMessage: string;
    offHoursMessage: string;
  };
}

// Configuración por defecto (fallback)
const DEFAULT_CONFIG: WhatsAppConfig = {
  whatsapp: {
    main: '+5492615555555',
    results: '+5492615555556',
    detail: '+5492615555557',
    agency: '+5492615555558',
    prebooking: '+5492615555559'
  },
  messages: {
    main: 'Hola! Me interesa conocer más sobre sus paquetes',
    results: 'Me interesa obtener más información sobre los paquetes disponibles',
    detail: 'Me interesa el paquete [PACKAGE_NAME] y me gustaría recibir más información',
    agency: 'Hola! Soy agencia de viajes y necesito información sobre su plataforma B2B',
    prebooking: 'Completé el formulario de prebooking y me gustaría finalizar mi reserva'
  },
  globalSettings: {
    hours: 'Lun-Vie 9:00-18:00, Sáb 9:00-13:00',
    welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué podemos ayudarte hoy?',
    offHoursMessage: 'Gracias por contactarnos. Nuestro horario de atención es Lun-Vie 9:00-18:00. Te responderemos a la brevedad. 🕒'
  }
};

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig>(DEFAULT_CONFIG);
  const pathname = usePathname();

  useEffect(() => {
    // Mostrar después de 2 segundos
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cargar configuración desde localStorage o API
    loadWhatsAppConfig();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      // Primero intentar cargar desde la configuración global del window
      if (typeof window !== 'undefined' && (window as any).INTERTRAVEL_CONFIG) {
        setConfig((window as any).INTERTRAVEL_CONFIG);
        return;
      }

      // Fallback: intentar cargar desde API
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.log('Usando configuración por defecto de WhatsApp');
      // Ya tenemos DEFAULT_CONFIG cargado
    }
  };

  const determineContext = (): keyof WhatsAppConfig['whatsapp'] => {
    if (pathname?.includes('/paquetes/')) return 'detail';
    if (pathname?.includes('/paquetes')) return 'results';
    if (pathname?.includes('/agency')) return 'agency';
    if (pathname?.includes('/checkout') || pathname?.includes('/book')) return 'prebooking';
    return 'main';
  };

  const handleClick = () => {
    const context = determineContext();
    const phone = config.whatsapp[context];
    let message = config.messages[context];

    // Si estamos en detalle de paquete, intentar obtener el nombre del paquete
    if (context === 'detail' && message.includes('[PACKAGE_NAME]')) {
      const packageName = extractPackageName();
      message = message.replace('[PACKAGE_NAME]', packageName || 'este paquete');
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Analytics opcional
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_click', {
        context: context,
        page: pathname,
        phone: phone
      });
    }
  };

  const extractPackageName = (): string | null => {
    try {
      // Intentar obtener el nombre del paquete desde el DOM o el título de la página
      const title = document.title;
      if (title && title !== 'InterTravel') {
        return title.split(' - ')[0] || title;
      }
      
      // Fallback: buscar en el DOM
      const h1 = document.querySelector('h1');
      if (h1?.textContent) {
        return h1.textContent;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulsos animados */}
      <div className="absolute inset-0 w-16 h-16 bg-green-400 rounded-full animate-ping opacity-75"></div>
      <div className="absolute inset-2 w-12 h-12 bg-green-400 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
      
      {/* Botón principal */}
      <button
        onClick={handleClick}
        className="relative w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title={`WhatsApp: ${config.whatsapp[determineContext()]}`}
      >
        {/* Icono WhatsApp */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
        </svg>

        {/* Tooltip dinámico */}
        <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block">
          <div className="bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap max-w-xs">
            <div className="font-bold">💬 {config.globalSettings.welcomeMessage.slice(0, 30)}...</div>
            <div className="text-xs opacity-80 mt-1">{config.globalSettings.hours}</div>
            <div className="absolute top-full right-3 border-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </button>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-full right-0 mb-20 hidden group-hover:block">
          <div className="bg-gray-800 text-white p-2 rounded text-xs">
            <div>Context: {determineContext()}</div>
            <div>Phone: {config.whatsapp[determineContext()]}</div>
          </div>
        </div>
      )}
    </div>
  );
}