import React, { useState } from 'react';
import { Eye, EyeOff, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

const RegistroConDNI = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    document_type: 'DNI',
    document_number: '',
    phone: '',
    country: 'Argentina'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dniStatus, setDniStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar DNI mientras el usuario escribe
  const handleDNIChange = async (value) => {
    setFormData(prev => ({ ...prev, document_number: value }));
    
    if (value.length >= 7) {
      setChecking(true);
      try {
        const response = await fetch('/api/app/auth/check-dni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_number: value })
        });
        
        if (response.ok) {
          const data = await response.json();
          setDniStatus(data);
        }
      } catch (error) {
        console.error('Error verificando DNI:', error);
      }
      setChecking(false);
    } else {
      setDniStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!formData.document_number || formData.document_number.length < 7) {
      setError('DNI inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/app/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Guardar token si viene
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Mostrar mensaje de éxito con info de vinculación
        console.log('Registro exitoso:', data);
      } else {
        setError(data.error || 'Error en el registro');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border border-green-200">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
          
          {dniStatus?.has_bookings && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-left">
                  <p className="text-blue-800 font-medium">
                    ¡Genial! Encontramos {dniStatus.bookings_count} reserva(s) asociada(s) a tu DNI
                  </p>
                  <p className="text-blue-600 text-sm">
                    Ya puedes ver y gestionar tus viajes desde tu panel personal.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => window.location.href = '/app/dashboard'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir a Mi Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Crear Cuenta
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos Personales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* DNI con verificación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="12345678"
              value={formData.document_number}
              onChange={(e) => handleDNIChange(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            {checking && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Estado del DNI */}
          {dniStatus && !checking && (
            <div className="mt-2">
              {dniStatus.user_registered ? (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  DNI ya registrado. ¿Ya tienes cuenta? 
                  <button 
                    type="button"
                    onClick={() => window.location.href = '/app/login'}
                    className="ml-1 underline hover:text-red-800"
                  >
                    Inicia sesión
                  </button>
                </div>
              ) : dniStatus.has_bookings ? (
                <div className="flex items-center text-green-600 text-sm">
                  <UserCheck className="h-4 w-4 mr-1" />
                  ¡Genial! Encontramos {dniStatus.bookings_count} reserva(s) tuya(s)
                </div>
              ) : (
                <div className="flex items-center text-gray-500 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  DNI disponible
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={loading || (dniStatus?.user_registered)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Registrando...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </button>

        {/* Link a Login */}
        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => window.location.href = '/app/login'}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Inicia sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroConDNI;
