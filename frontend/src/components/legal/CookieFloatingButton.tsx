'use client';

import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import CookieSettings from './CookieSettings';

const CookieFloatingButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Solo mostrar el botón si ya se ha dado consentimiento
    const consent = localStorage.getItem('intertravel-cookie-consent');
    setHasConsent(!!consent);
  }, []);

  // No mostrar el botón si no se ha dado consentimiento aún
  if (!hasConsent) return null;

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        title="Configurar Cookies"
      >
        <Cookie className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        
        {/* Tooltip */}
        <div className="absolute left-16 bottom-2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Configurar Cookies
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </button>

      <CookieSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};

export default CookieFloatingButton;