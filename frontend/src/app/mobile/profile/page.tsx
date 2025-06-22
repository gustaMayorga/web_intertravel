export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            MG
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">María González</h2>
          <p className="text-gray-600">maria.gonzalez@email.com</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">2,847</div>
            <div className="text-sm text-gray-600">Puntos acumulados</div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">5</div>
            <div className="text-sm text-gray-600">Viajes realizados</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold">
            Editar Perfil
          </button>
          
          <button className="w-full border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold">
            Configuración
          </button>
          
          <button className="w-full border border-red-300 text-red-600 py-4 rounded-xl font-semibold">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}