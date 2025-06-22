'use client';
import { useState, useEffect } from 'react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState({
    city: 'Mendoza',
    temp: 22,
    icon: '🌤️',
    condition: 'Parcialmente nublado'
  });

  useEffect(() => {
    // Simular cambios de clima cada 30 segundos
    const interval = setInterval(() => {
      const conditions = [
        { temp: 22, icon: '🌤️', condition: 'Parcialmente nublado' },
        { temp: 25, icon: '☀️', condition: 'Soleado' },
        { temp: 18, icon: '🌧️', condition: 'Lluvia ligera' },
        { temp: 20, icon: '⛅', condition: 'Nublado' }
      ];
      
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      setWeather(prev => ({ ...prev, ...randomCondition }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-24 left-6 z-50">
      <div className="glass-morphism p-4 rounded-2xl min-w-[160px] hover:scale-105 transition-all duration-300 border border-white/20">
        <div className="text-center">
          <div className="text-3xl mb-2">{weather.icon}</div>
          <div className="text-white font-semibold">{weather.city}</div>
          <div className="text-2xl font-bold text-intertravel-gold">{weather.temp}°C</div>
          <div className="text-xs text-white/70 mt-1">{weather.condition}</div>
        </div>
        
        {/* Indicador de estado */}
        <div className="flex items-center justify-center mt-3 gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/60">En vivo</span>
        </div>
      </div>
    </div>
  );
}