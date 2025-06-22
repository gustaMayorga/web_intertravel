'use client';

/**
 * 🧠 PANEL DE FALLBACK INTELIGENTE - INTEGRADO CON ADMIN EXISTENTE
 * ================================================================
 * 
 * Sistema que captura datos reales de TC y los guarda como fallback
 * para asegurar que el mapa tenga coordenadas precisas siempre
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  MapPin, 
  Package, 
  Globe, 
  Activity,
  Settings,
  Trash2,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Zap,
  BarChart3
} from 'lucide-react';

interface FallbackStats {
  totalFiles: number;
  diskUsage: string;
  lastUpdate: string;
  autoSync: boolean;
  tcConnected: boolean;
}

interface DestinationData {
  success: boolean;
  destinations?: Array<{
    name: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  }>;
  error?: string;
}

export default function FallbackPanel() {
  const [stats, setStats] = useState<FallbackStats | null>(null);
  const [config, setConfig] = useState({
    autoSync: true,
    syncInterval: 30,
    syncDestinations: true,
    syncPackages: true,
    syncSearch: true
  });
  const [tcStatus, setTcStatus] = useState({ connected: false, message: '' });
  const [destinationsData, setDestinationsData] = useState<DestinationData | null>(null);
  const [packagesData, setPackagesData] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(updateStatus, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadConfig(),
        loadStats(),
        checkTCStatus(),
        checkDestinations(),
        checkPackages()
      ]);
    } catch (error) {
      log('❌ Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/fallback/config');
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...config, ...data });
        log('✅ Configuración cargada');
      }
    } catch (error) {
      log('⚠️ Error cargando configuración');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/fallback/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      log('⚠️ Error cargando estadísticas');
    }
  };

  const checkTCStatus = async () => {
    try {
      const response = await fetch('/api/tc-check');
      const data = await response.json();
      setTcStatus(data);
      
      if (data.connected) {
        log('🌍 Travel Compositor conectado');
      } else {
        log('⚠️ Travel Compositor desconectado');
      }
    } catch (error) {
      setTcStatus({ connected: false, message: 'Error de conexión' });
      log('❌ Error verificando TC');
    }
  };

  const checkDestinations = async () => {
    try {
      const response = await fetch('/api/travel-compositor/destinations');
      const data = await response.json();
      setDestinationsData(data);
      
      if (data.success) {
        const withCoords = data.destinations?.filter(d => d.coordinates) || [];
        log(`📍 Destinos: ${data.destinations?.length || 0} (${withCoords.length} con coordenadas)`);
      }
    } catch (error) {
      setDestinationsData({ success: false, error: error.message });
      log('❌ Error verificando destinos');
    }
  };

  const checkPackages = async () => {
    try {
      const response = await fetch('/api/packages/featured?limit=6');
      const data = await response.json();
      setPackagesData(data);
      
      if (data.success) {
        log(`📦 Paquetes: ${data.packages?.length || 0} cargados`);
      }
    } catch (error) {
      setPackagesData({ success: false, error: error.message });
      log('❌ Error verificando paquetes');
    }
  };

  const updateStatus = async () => {
    await Promise.all([
      checkTCStatus(),
      loadStats(),
      checkDestinations(),
      checkPackages()
    ]);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    log('🔄 Iniciando sincronización manual...');

    try {
      const response = await fetch('/api/admin/fallback/sync', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        log(`✅ Sincronización completada: ${result.syncedItems || 0} elementos`);
        showToast('Sincronización completada', 'success');
        await updateStatus();
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      log('❌ Error en sincronización: ' + error.message);
      showToast('Error en sincronización', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/admin/fallback/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        log('✅ Configuración guardada');
        showToast('Configuración guardada', 'success');
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      log('❌ Error guardando configuración: ' + error.message);
      showToast('Error guardando configuración', 'error');
    }
  };

  const handleClearFallback = async () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos fallback?')) {
      try {
        const response = await fetch('/api/admin/fallback/clear', {
          method: 'DELETE'
        });

        if (response.ok) {
          log('✅ Datos fallback eliminados');
          showToast('Datos eliminados', 'success');
          await updateStatus();
        } else {
          throw new Error('Error del servidor');
        }
      } catch (error) {
        log('❌ Error limpiando datos: ' + error.message);
        showToast('Error limpiando datos', 'error');
      }
    }
  };

  const handleTestDestinations = async () => {
    log('🧪 Probando carga de destinos...');
    try {
      const response = await fetch('/api/travel-compositor/destinations?test=true');
      const data = await response.json();
      
      if (data.success) {
        log(`✅ Test destinos OK: ${data.destinations?.length || 0} elementos`);
        showToast('Test de destinos exitoso', 'success');
      } else {
        log('❌ Test destinos falló: ' + data.error);
        showToast('Test de destinos falló', 'error');
      }
    } catch (error) {
      log('❌ Error en test destinos: ' + error.message);
      showToast('Error en test', 'error');
    }
  };

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setActivityLog(prev => [logEntry, ...prev.slice(0, 49)]);
    console.log(logEntry);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Implementación simple de toast (puedes mejorarlo con una librería)
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-8 w-8 text-blue-600" />
            Sistema de Fallback Inteligente
          </h1>
          <p className="text-gray-600 mt-1">
            Captura automática de datos TC con coordenadas precisas para el mapa
          </p>
        </div>
        
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* TC Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Travel Compositor</p>
              <p className={`text-2xl font-bold ${tcStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                {tcStatus.connected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <Globe className={`h-8 w-8 ${tcStatus.connected ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>

        {/* Auto Sync */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auto Sync</p>
              <p className={`text-2xl font-bold ${config.autoSync ? 'text-green-600' : 'text-gray-600'}`}>
                {config.autoSync ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <Zap className={`h-8 w-8 ${config.autoSync ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Archivos Fallback</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalFiles || 0}</p>
            </div>
            <HardDrive className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Coordinates */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coordenadas</p>
              <p className="text-2xl font-bold text-purple-600">
                {destinationsData?.destinations?.filter(d => d.coordinates).length || 0}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Configuración
          </h2>
          
          <div className="space-y-4">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Auto Sync</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({...config, autoSync: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Sync Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Sincronización
              </label>
              <select
                value={config.syncInterval}
                onChange={(e) => setConfig({...config, syncInterval: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
              </select>
            </div>

            {/* Data Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos a Sincronizar
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.syncDestinations}
                    onChange={(e) => setConfig({...config, syncDestinations: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm">🗺️ Destinos con coordenadas</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.syncPackages}
                    onChange={(e) => setConfig({...config, syncPackages: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm">📦 Paquetes destacados</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.syncSearch}
                    onChange={(e) => setConfig({...config, syncSearch: e.target.checked})}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm">🔍 Resultados de búsqueda</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleSaveConfig}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                💾 Guardar Configuración
              </button>
              <button
                onClick={handleClearFallback}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                🗑️ Limpiar Datos Fallback
              </button>
            </div>
          </div>
        </div>

        {/* Data Monitor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Monitor de Datos
          </h2>
          
          <div className="space-y-4">
            {/* Destinations */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  Destinos
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  destinationsData?.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {destinationsData?.success ? 'Activo' : 'Error'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Total: <span className="font-semibold">{destinationsData?.destinations?.length || 0}</span></div>
                <div>Con coordenadas: <span className="font-semibold">
                  {destinationsData?.destinations?.filter(d => d.coordinates).length || 0}
                </span></div>
              </div>
              <button
                onClick={handleTestDestinations}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <TestTube className="mr-1 h-3 w-3" />
                Probar carga
              </button>
            </div>

            {/* Packages */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Package className="mr-1 h-4 w-4" />
                  Paquetes
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  packagesData?.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {packagesData?.success ? 'Activo' : 'Error'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Destacados: <span className="font-semibold">{packagesData?.packages?.length || 0}</span></div>
                <div>Fuente: <span className="font-semibold">{packagesData?._source || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Log de Actividad
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 h-40 overflow-y-auto text-sm font-mono">
          {activityLog.length > 0 ? (
            activityLog.map((entry, index) => (
              <div key={index} className="text-gray-700 py-1">
                {entry}
              </div>
            ))
          ) : (
            <div className="text-gray-500">Iniciando monitor...</div>
          )}
        </div>
      </div>
    </div>
  );
}