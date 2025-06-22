'use client';

import React, { useState, useEffect } from 'react';

const FloatingElements: React.FC = () => {
  const [stats, setStats] = useState({
    activeUsers: 147,
    bookingsToday: 8,
    satisfaction: 98.2,
  });

  useEffect(() => {
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      setStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        bookingsToday: prev.bookingsToday + (Math.random() > 0.9 ? 1 : 0),
        satisfaction: Math.min(100, prev.satisfaction + (Math.random() - 0.5) * 0.05),
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Elemento flotante - Usuarios activos */}
      <div className="absolute top-24 left-4 md:left-8 animate-float">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 pointer-events-auto hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <div className="text-white/60 text-xs">En línea</div>
              <div className="text-white font-bold text-sm">{stats.activeUsers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Elemento flotante - Reservas del día */}
      <div className="absolute top-40 right-4 md:right-8 animate-float-delayed">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 pointer-events-auto hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-2">
            <div className="text-lg">🎯</div>
            <div>
              <div className="text-white/60 text-xs">Reservas</div>
              <div className="text-white font-bold text-sm">{stats.bookingsToday}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Elemento flotante - Satisfacción */}
      <div className="absolute bottom-32 left-4 md:left-8 animate-float">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 pointer-events-auto hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-2">
            <div className="text-lg">⭐</div>
            <div>
              <div className="text-white/60 text-xs">Rating</div>
              <div className="text-white font-bold text-sm">{stats.satisfaction.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
};

export default FloatingElements;