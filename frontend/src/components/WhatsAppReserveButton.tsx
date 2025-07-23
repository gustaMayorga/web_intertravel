'use client';

import { useState } from 'react';
import { MessageCircle, Plane } from 'lucide-react';

interface WhatsAppReserveButtonProps {
  packageData: {
    id: string;
    title: string;
    destination: string;
    price?: {
      amount: number;
      currency: string;
    };
    duration?: {
      days: number;
      nights: number;
    };
  };
  phone?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customMessage?: string;
  trackingSource?: string;
}

export default function WhatsAppReserveButton({
  packageData,
  phone = '5491134567890',
  variant = 'primary',
  size = 'md',
  showIcon = true,
  customMessage,
  trackingSource = 'package_list'
}: WhatsAppReserveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generateWhatsAppMessage = () => {
    if (customMessage) return customMessage;

    return `🎯 *CONSULTA PAQUETE - INTERTRAVEL*

📦 *Paquete:* ${packageData.title}
📍 *Destino:* ${packageData.destination}
💰 *Precio:* ${packageData.price ? `USD $${packageData.price.amount.toLocaleString()}` : 'Consultar'}
📅 *Duración:* ${packageData.duration ? `${packageData.duration.days} días / ${packageData.duration.nights} noches` : 'Consultar'}

Hola! Me interesa este paquete y me gustaría recibir más información sobre:
• Disponibilidad de fechas
• Itinerario detallado
• Formas de pago
• Promociones vigentes

¡Espero su respuesta! 😊`;
  };

  const handleWhatsAppClick = () => {
    setIsLoading(true);
    
    try {
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'whatsapp_reserve_click', {
          event_category: 'engagement',
          event_label: trackingSource,
          package_id: packageData.id,
          package_name: packageData.title,
          value: packageData.price?.amount || 0
        });
      }
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'outline':
        return 'border-2 border-green-500 text-green-600 hover:bg-green-50 bg-white';
      default:
        return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      disabled={isLoading}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-semibold rounded-lg transition-all duration-300
        shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Enviando...
        </>
      ) : (
        <>
          {showIcon && (
            variant === 'outline' ? 
            <MessageCircle className="w-4 h-4" /> : 
            <Plane className="w-4 h-4" />
          )}
          {variant === 'outline' ? 'Consultar' : 'Reservar'}
        </>
      )}
    </button>
  );
}

// Hook para manejar múltiples botones de reserva
export const useWhatsAppReserve = () => {
  const [activePackage, setActivePackage] = useState<string | null>(null);

  const reservePackage = (packageData: any, phone?: string, source?: string) => {
    setActivePackage(packageData.id);
    
    const message = `🎯 *CONSULTA PAQUETE - INTERTRAVEL*

📦 *Paquete:* ${packageData.title}
📍 *Destino:* ${packageData.destination}
💰 *Precio:* ${packageData.price ? `USD $${packageData.price.amount.toLocaleString()}` : 'Consultar'}

Hola! Me interesa este paquete y me gustaría recibir más información.

¡Gracias!`;

    const whatsappUrl = `https://wa.me/${phone || '5491134567890'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Limpiar estado después de un tiempo
    setTimeout(() => setActivePackage(null), 2000);
  };

  return { activePackage, reservePackage };
};
