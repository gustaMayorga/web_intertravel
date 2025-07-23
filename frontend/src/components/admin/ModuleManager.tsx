'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  Users, 
  BarChart3, 
  Calendar,
  Building,
  FileText,
  DollarSign,
  MapPin,
  Star,
  Shield,
  LayoutDashboard,
  UserCog,
  Zap,
  MessageCircle,
  Database,
  Bug,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Eye,
  Edit,
  Trash,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';

interface Module {
  id: number;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  isCore: boolean;
  isActive: boolean;
  sortOrder: number;
  permissions: string[];
}

interface UserModule {
  moduleId: number;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  isCore: boolean;
  permissions: Record<string, boolean>;
  isEnabled: boolean;
  isPinned: boolean;
  assignedAt: string;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleName: string;
}

interface ModuleManagerProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Package,
  Calendar,
  UserCog,
  BarChart3,
  Building,
  FileText,
  DollarSign,
  MapPin,
  Star,
  Settings,
  Shield,
  Zap,
  MessageCircle,
  Database,
  Bug,
  Users
};

const ModuleManager: React.FC<ModuleManagerProps> = ({ user, onClose, onUpdate }) => {
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');

  useEffect(() => {
    loadModules();
    loadUserModules();
  }, [user.id]);

  const loadModules = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/admin/modules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAllModules(data.modules || []);
      } else {
        console.error('Error cargando módulos:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadUserModules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUserModules(data.userModules || []);
      } else {
        console.error('Error cargando módulos del usuario:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignModule = async (moduleId: number, permissions: Record<string, boolean> = { view: true }) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleId,
          permissions,
          isEnabled: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadUserModules();
        onUpdate();
      } else {
        alert('Error asignando módulo: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveModule = async (moduleId: number) => {
    if (!confirm('¿Estás seguro de remover este módulo del usuario?')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        loadUserModules();
        onUpdate();
      } else {
        alert('Error removiendo módulo: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (moduleId: number, permission: string, currentValue: boolean) => {
    const userModule = userModules.find(um => um.moduleId === moduleId);
    if (!userModule) return;

    const newPermissions = {
      ...userModule.permissions,
      [permission]: !currentValue
    };

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleId,
          permissions: newPermissions,
          isEnabled: userModule.isEnabled
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadUserModules();
        onUpdate();
      } else {
        alert('Error actualizando permisos: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Settings;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      analytics: 'bg-purple-100 text-purple-800',
      financial: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800',
      settings: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableModules = () => {
    const assignedModuleIds = userModules.map(um => um.moduleId);
    return allModules.filter(m => !assignedModuleIds.includes(m.id));
  };

  const groupModulesByCategory = (modules: any[]) => {
    return modules.reduce((groups, module) => {
      const category = module.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(module);
      return groups;
    }, {} as Record<string, any[]>);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Gestión de Módulos - {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                @{user.username} • {user.roleName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userModules.length}</div>
              <div className="text-sm text-gray-600">Módulos Asignados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userModules.filter(um => um.isEnabled).length}
              </div>
              <div className="text-sm text-gray-600">Módulos Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {userModules.filter(um => um.isCore).length}
              </div>
              <div className="text-sm text-gray-600">Módulos Core</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getAvailableModules().length}
              </div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Módulos Asignados ({userModules.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Módulos Disponibles ({getAvailableModules().length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'assigned' && (
            <div className="space-y-6">
              {Object.entries(groupModulesByCategory(userModules)).map(([category, modules]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="space-y-3">
                    {modules.map((userModule) => (
                      <div
                        key={userModule.moduleId}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getIcon(userModule.icon)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900">
                                  {userModule.displayName}
                                </h5>
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(userModule.category)}`}>
                                  {userModule.category}
                                </span>
                                {userModule.isCore && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                    Core
                                  </span>
                                )}
                                {userModule.isPinned && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {userModule.description}
                              </p>
                              <div className="text-xs text-gray-500 mt-2">
                                Asignado el {formatDate(userModule.assignedAt)}
                              </div>
                              
                              {/* Permisos */}
                              <div className="mt-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">Permisos:</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(userModule.permissions).map(([permission, hasPermission]) => (
                                    <label
                                      key={permission}
                                      className="flex items-center gap-1 text-xs cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={hasPermission}
                                        onChange={() => handleTogglePermission(userModule.moduleId, permission, hasPermission)}
                                        disabled={saving || (userModule.isCore && permission === 'view')}
                                        className="rounded"
                                      />
                                      <span className={hasPermission ? 'text-green-700' : 'text-gray-500'}>
                                        {permission}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {userModule.isEnabled ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            
                            {!userModule.isCore && (
                              <button
                                onClick={() => handleRemoveModule(userModule.moduleId)}
                                disabled={saving}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Remover módulo"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {userModules.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay módulos asignados a este usuario</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Ver módulos disponibles
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <div className="space-y-6">
              {Object.entries(groupModulesByCategory(getAvailableModules())).map(([category, modules]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getIcon(module.icon)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900">
                                  {module.displayName}
                                </h5>
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(module.category)}`}>
                                  {module.category}
                                </span>
                                {module.isCore && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                    Core
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {module.description}
                              </p>
                              <div className="text-xs text-gray-500 mt-2">
                                Ruta: {module.route}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAssignModule(module.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            title="Asignar módulo"
                          >
                            <Plus className="w-3 h-3" />
                            Asignar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {getAvailableModules().length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">Todos los módulos disponibles ya están asignados</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              Los módulos <strong>Core</strong> no pueden ser removidos y el permiso <strong>view</strong> es obligatorio.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadUserModules}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;
