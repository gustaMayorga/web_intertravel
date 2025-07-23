'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';

export default function PagosPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/payments`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data || []);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando payments:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
              <p className="text-gray-600">Gestión de pagos</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Módulo Pagos
            </h3>
            <p className="text-gray-600 mb-4">
              Este módulo está listo para ser configurado.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>Estado:</strong> Conectado con API /api/admin/payments
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Registros encontrados: {data.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
