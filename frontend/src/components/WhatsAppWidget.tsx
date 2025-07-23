// ===============================================
// WIDGET WHATSAPP SEGURO - INTERTRAVEL
// ===============================================

'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, AlertTriangle } from 'lucide-react';

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  fallbackMode?: boolean;
}

export default function WhatsAppWidget({
  phoneNumber = '+5411987654321',
  message = 'Hola! Estoy interesado en sus paquetes de viaje. ¿Podrían brindarme más información?',
  className = '',
  fallbackMode = false
}: WhatsAppWidgetProps) {
  const [whapifyLoaded, setWhapifyLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!fallbackMode);

  useEffect(() => {
    if (fallbackMode) {
      setLoading(false);
      return;
    }

    // Intentar cargar Whapify widget
    const loadWhapify = async () => {
      try {
        // Verificar si ya existe el script
        if (document.querySelector('script[src*="whapify"]')) {
          setWhapifyLoaded(true);
          setLoading(false);
          return;
        }

        // Crear script de Whapify
        const script = document.createElement('script');
        script.src = 'https://widget.whapify.com/widget.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ Whapify widget loaded successfully');
          setWhapifyLoaded(true);
          setLoading(false);
        };
        
        script.onerror = () => {
          console.warn('⚠️ Failed to load Whapify widget, using fallback');
          setError('Whapify no disponible');
          setLoading(false);
        };

        document.head.appendChild(script);

        // Timeout fallback
        setTimeout(() => {
          if (!whapifyLoaded) {
            setError('Timeout cargando Whapify');
            setLoading(false);
          }
        }, 5000);

      } catch (err) {
        console.error('❌ Error loading Whapify:', err);
        setError('Error cargando widget');
        setLoading(false);
      }
    };

    loadWhapify();

    // Cleanup
    return () => {
      // No remover script para evitar recargas innecesarias
    };
  }, [fallbackMode, whapifyLoaded]);

  // Generar enlace directo de WhatsApp
  const getWhatsAppUrl = () => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
  };

  // Modo loading
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse flex items-center">
          <MessageCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-600">Cargando WhatsApp...</span>
        </div>
      </div>
    );
  }

  // Modo fallback o error
  if (error || fallbackMode || !whapifyLoaded) {
    return (
      <div className={`space-y-2 ${className}`}>
        {error && (
          <div className="flex items-center text-yellow-600 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span>Widget avanzado no disponible</span>
          </div>
        )}
        
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Consultar por WhatsApp
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
        
        <p className="text-xs text-gray-500">
          Te conectaremos directamente con nuestro equipo
        </p>
      </div>
    );
  }

  // Modo Whapify cargado exitosamente
  return (
    <div className={`whapify-widget-container ${className}`}>
      <div id="whapify-widget" />
      
      {/* Fallback button siempre disponible */}
      <div className="mt-2">
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-600 hover:text-green-700 underline"
        >
          Abrir WhatsApp directamente
        </a>
      </div>
    </div>
  );
}

// Hook para usar WhatsApp de forma programática
export function useWhatsApp(phoneNumber?: string) {
  const sendMessage = (message: string) => {
    const phone = phoneNumber || '+5411987654321';
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  return { sendMessage };
}

// Componente flotante de WhatsApp
export function FloatingWhatsApp({
  phoneNumber = '+5411987654321',
  position = 'bottom-right'
}: {
  phoneNumber?: string;
  position?: 'bottom-right' | 'bottom-left';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const { sendMessage } = useWhatsApp(phoneNumber);

  useEffect(() => {
    // Mostrar después de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <button
        onClick={() => sendMessage('Hola! Me interesa obtener información sobre sus paquetes de viaje.')}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-bounce"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 right-0 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
        ¿Necesitas ayuda? ¡Escríbenos!
      </div>
    </div>
  );
}