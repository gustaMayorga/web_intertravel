'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ===== LOGIN COMPONENT SIN BYPASS - AUTENTICACIÓN REAL =====

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
}

export default function LoginFixed() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // ===== VERIFICAR SI YA ESTÁ AUTENTICADO =====
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      // VERIFICAR TOKEN CON EL BACKEND - NO CONFIAR SOLO EN LOCALSTORAGE
      const response = await fetch('http://localhost:3002/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Token válido, redirigiendo a dashboard');
        router.push('/admin/dashboard');
      } else {
        console.log('❌ Token inválido, limpiando localStorage');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    } catch (error) {
      console.log('❌ Error verificando token:', error);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for username:', username);
      
      const response = await fetch('http://localhost:3002/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password
        }),
      });

      const data: LoginResponse = await response.json();
      
      if (data.success && data.token) {
        console.log('✅ Login successful');
        
        // Guardar token y datos de usuario
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        
        // VERIFICAR INMEDIATAMENTE QUE EL TOKEN FUNCIONA
        const testResponse = await fetch('http://localhost:3002/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (testResponse.ok) {
          console.log('✅ Token verified, redirecting to dashboard');
          router.push('/admin/dashboard');
        } else {
          throw new Error('Token no funciona después del login');
        }
        
      } else {
        console.log('❌ Login failed:', data.message);
        setError(data.message || 'Credenciales inválidas');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Error de conexión. Verifique que el servidor esté funcionando.');
      
      // Limpiar cualquier dato de sesión en caso de error
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUsername('');
    setPassword('');
    setError('');
    console.log('🚪 Logout completed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            InterTravel Admin
          </h1>
          <p className="text-gray-600">Panel de Administración WEB-FINAL-UNIFICADA</p>
          <div className="w-20 h-1 bg-blue-500 mx-auto mt-4 rounded"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingrese su usuario"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingrese su contraseña"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              loading || !username || !password
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Debug Info (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center mb-2">Credenciales de prueba:</p>
            <div className="text-sm text-center space-y-1">
              <p><strong>Usuario:</strong> admin</p>
              <p><strong>Contraseña:</strong> admin123</p>
            </div>
            {localStorage.getItem('admin_token') && (
              <button
                onClick={handleLogout}
                className="w-full mt-3 py-2 px-4 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
              >
                Limpiar Sesión Local
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>InterTravel Admin WEB-FINAL-UNIFICADA</p>
          <p className="mt-1">🔒 Autenticación Segura - Sin Bypass</p>
        </div>
      </div>
    </div>
  );
}
