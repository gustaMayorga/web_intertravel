'use client';

import React from 'react';

interface DemoCredentialsProps {
  type: 'admin' | 'agency';
  className?: string;
}

/**
 * 🔐 COMPONENTE DE CREDENCIALES DEMO
 * =================================
 * 
 * Muestra credenciales de demo SOLO en desarrollo
 * Se oculta automáticamente en producción
 */

const DemoCredentials: React.FC<DemoCredentialsProps> = ({ type, className = "" }) => {
  // Solo mostrar en desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true';
  
  if (!isDevelopment) {
    return null;
  }
  
  const credentials = {
    admin: {
      title: '🔧 Credenciales de Desarrollo - Admin:',
      accounts: [
        { username: 'admin', password: 'admin123', role: 'Super Admin' },
        { username: 'intertravel', password: 'travel2024', role: 'Admin' },
        { username: 'supervisor', password: 'super2024', role: 'Supervisor' }
      ]
    },
    agency: {
      title: '🔧 Credenciales de Desarrollo - Agencias:',
      accounts: [
        { username: 'agencia_admin', password: 'agencia123', role: 'Admin Agencia' },
        { username: 'viajes_total', password: 'viajes2024', role: 'Agencia' },
        { username: 'demo_agency', password: 'demo123', role: 'Demo' }
      ]
    }
  };
  
  const config = credentials[type];
  
  return (
    <div className={`bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-bold text-yellow-900 mb-1">
          {config.title}
        </h4>
        <p className="text-xs text-yellow-800">
          ⚠️ Solo visible en desarrollo. Se oculta automáticamente en producción.
        </p>
      </div>
      
      <div className="space-y-2">
        {config.accounts.map((account, index) => (
          <div key={index} className="bg-yellow-100 rounded p-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold text-yellow-900">Usuario:</span>
                <code className="ml-1 bg-yellow-200 px-1 rounded text-yellow-900">
                  {account.username}
                </code>
              </div>
              <div>
                <span className="font-semibold text-yellow-900">Password:</span>
                <code className="ml-1 bg-yellow-200 px-1 rounded text-yellow-900">
                  {account.password}
                </code>
              </div>
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              <span className="font-medium">Rol:</span> {account.role}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-yellow-800">
        <p>
          💡 <strong>Tip:</strong> En producción configura las variables de entorno:
        </p>
        <code className="block mt-1 bg-yellow-200 p-1 rounded text-yellow-900">
          ADMIN_PASSWORD=tu-password-seguro<br />
          AGENCY_PASSWORD=password-agencia-seguro
        </code>
      </div>
    </div>
  );
};

export default DemoCredentials;