'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

const AdminDestinationsTest: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          Test AdminDestinations Component
        </h2>
        <p className="text-gray-600 mt-2">
          Si puedes ver este mensaje, el componente se está cargando correctamente.
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✅ Componente funcionando correctamente</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDestinationsTest;
