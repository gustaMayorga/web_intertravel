export default function TripsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Mis Viajes</h1>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">París Romántico</h3>
            <span className="text-green-600 font-semibold">Completado</span>
          </div>
          <p className="text-gray-600 mb-2">Marzo 2024 • 7 días</p>
          <p className="text-blue-600 font-semibold">USD 2,299</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Tokio Futurista</h3>
            <span className="text-blue-600 font-semibold">Próximo</span>
          </div>
          <p className="text-gray-600 mb-2">Julio 2025 • 10 días</p>
          <p className="text-blue-600 font-semibold">USD 3,199</p>
        </div>
        
        <div className="text-center py-8">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold">
            Explorar Nuevos Destinos
          </button>
        </div>
      </div>
    </div>
  );
}