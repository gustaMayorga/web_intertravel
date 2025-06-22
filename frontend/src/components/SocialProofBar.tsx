'use client';
import { useState, useEffect } from 'react';

export default function SocialProofBar() {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "🌍 15 especialistas online ahora",
    "📞 WhatsApp +54 261 123-4567",
    "⚡ Respuesta en menos de 1 minuto",
    "🔥 3 personas reservando ahora",
    "✈️ 97% satisfacción garantizada"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="glass-morphism-dark px-6 py-3 rounded-full border border-white/20 hover:scale-105 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white font-medium text-sm">
            {messages[currentMessage]}
          </span>
        </div>
      </div>
    </div>
  );
}