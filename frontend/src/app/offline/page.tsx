'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16213e] via-[#1f2937] to-[#16213e] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">🌍</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            InterTravel Group
          </h1>
        </div>

        {/* Mensaje offline */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-6">
          <div className="text-6xl mb-4">📶</div>
          <h2 className="text-xl font-bold text-white mb-4">
            Sin Conexión a Internet
          </h2>
          <p className="text-white/80 mb-6">
            No hay conexión disponible. Algunas funciones pueden no estar disponibles hasta que se restablezca la conexión.
          </p>
          
          {/* Estado de conexión */}
          <div className="text-sm text-white/60 mb-6">
            Estado: <span className="text-red-400">● Desconectado</span>
          </div>

          {/* Botón de reintentar */}
          <button
            onClick={handleRetry}
            className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-all mb-4"
          >
            🔄 Reintentar Conexión
          </button>
        </div>

        {/* Funciones disponibles offline */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Disponible sin conexión:
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center text-white/80">
              <span className="text-green-400 mr-3">✓</span>
              Ver información básica
            </div>
            <div className="flex items-center text-white/80">
              <span className="text-green-400 mr-3">✓</span>
              Consultar paquetes guardados
            </div>
            <div className="flex items-center text-white/80">
              <span className="text-green-400 mr-3">✓</span>
              Datos de contacto
            </div>
            <div className="flex items-center text-white/40">
              <span className="text-red-400 mr-3">✗</span>
              Búsqueda en tiempo real
            </div>
            <div className="flex items-center text-white/40">
              <span className="text-red-400 mr-3">✗</span>
              Reservas online
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Contacto Directo:
          </h3>
          <div className="space-y-2 text-white/80">
            <div>📞 +54 261 4XX-XXXX</div>
            <div>📧 ventas@intertravel.com.ar</div>
            <div>📍 Luján de Cuyo, Mendoza</div>
          </div>
        </div>
      </div>
    </div>
  );
}
