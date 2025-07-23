'use client';

// Botón flotante directo a la app cliente
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AppButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link 
        href="/app"
        target="_blank"
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
      >
        <span className="text-2xl">📱</span>
        <span className="hidden sm:inline">Abrir App</span>
      </Link>
      
      {/* Tooltip para mobile */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Reservar paquetes
      </div>
    </div>
  );
}