'use client';

// ===============================================
// PÁGINA CMS - CONTROL DE WEB PÚBLICA
// Solución para administrar landing page desde admin
// ===============================================

import { useState, useEffect } from 'react';
import { AuthGuard, useAuthenticatedFetch } from '@/hooks/use-auth-secure';

interface CMSContent {
  id: number;
  content_key: string;
  content_type: string;
  title: string;
  content: string;
  metadata?: any;
  is_published: boolean;
  updated_at: string;
}

export default function CMSPage() {
  return (
    <AuthGuard requiredRoles={['admin', 'super_admin']}>
      <CMSManager />
    </AuthGuard>
  );
}

function CMSManager() {
  const [contents, setContents] = useState<CMSContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<CMSContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState({
    number: '',
    message: ''
  });
  const [featuredPackages, setFeaturedPackages] = useState<string[]>([]);

  const { authenticatedFetch } = useAuthenticatedFetch();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  // ===============================================
  // CARGAR CONTENIDO CMS
  // ===============================================

  const loadCMSContent = async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch(`${API_BASE}/api/admin/cms/content`);
      const data = await response.json();

      if (data.success) {
        setContents(data.data);
      }
    } catch (error) {
      console.error('Error loading CMS content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================================
  // CARGAR CONFIGURACIÓN WHATSAPP
  // ===============================================

  const loadWhatsAppConfig = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/admin/cms/whatsapp-config`);
      const data = await response.json();

      if (data.success) {
        setWhatsappConfig({
          number: data.data.whatsapp_number || '',
          message: data.data.whatsapp_message || ''
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  };

  // ===============================================
  // CARGAR PAQUETES DESTACADOS
  // ===============================================

  const loadFeaturedPackages = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/admin/cms/featured-packages`);
      const data = await response.json();

      if (data.success) {
        setFeaturedPackages(data.data.featured_packages || []);
      }
    } catch (error) {
      console.error('Error loading featured packages:', error);
    }
  };

  // ===============================================
  // GUARDAR CONTENIDO
  // ===============================================

  const saveContent = async (contentKey: string, updates: Partial<CMSContent>) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/admin/cms/content/${contentKey}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadCMSContent();
        setIsEditing(false);
        setSelectedContent(null);
        alert('✅ Contenido guardado exitosamente');
      } else {
        alert('❌ Error al guardar contenido: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('❌ Error al guardar contenido');
    }
  };

  // ===============================================
  // GUARDAR CONFIGURACIÓN WHATSAPP
  // ===============================================

  const saveWhatsAppConfig = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/admin/cms/whatsapp-config`,
        {
          method: 'PUT',
          body: JSON.stringify(whatsappConfig),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('✅ Configuración de WhatsApp guardada exitosamente');
      } else {
        alert('❌ Error al guardar configuración: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      alert('❌ Error al guardar configuración');
    }
  };

  // ===============================================
  // GUARDAR PAQUETES DESTACADOS
  // ===============================================

  const saveFeaturedPackages = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/admin/cms/featured-packages`,
        {
          method: 'PUT',
          body: JSON.stringify({ packages: featuredPackages }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('✅ Paquetes destacados actualizados exitosamente');
      } else {
        alert('❌ Error al actualizar paquetes: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving featured packages:', error);
      alert('❌ Error al actualizar paquetes');
    }
  };

  // ===============================================
  // EFECTOS DE CARGA
  // ===============================================

  useEffect(() => {
    loadCMSContent();
    loadWhatsAppConfig();
    loadFeaturedPackages();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contenido CMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🌐 Control de Web Pública
          </h1>
          <p className="mt-2 text-gray-600">
            Administra el contenido que ven los visitantes en la landing page
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel de Contenido CMS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  📝 Contenido de Páginas
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {contents.map((content) => (
                    <div 
                      key={content.content_key}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {content.title || content.content_key}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Tipo: {content.content_type} | 
                            Estado: {content.is_published ? 
                              <span className="text-green-600">✅ Publicado</span> : 
                              <span className="text-orange-600">⏳ Borrador</span>
                            }
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Actualizado: {new Date(content.updated_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContent(content);
                              setIsEditing(true);
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                      
                      {content.content && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <strong>Contenido actual:</strong>
                          <div className="mt-1 text-gray-700 truncate">
                            {content.content.length > 200 ? 
                              content.content.substring(0, 200) + '...' : 
                              content.content
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {contents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      📝 No hay contenido CMS disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Configuraciones */}
          <div className="space-y-6">
            
            {/* Configuración WhatsApp */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  💬 WhatsApp
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.number}
                    onChange={(e) => setWhatsappConfig({
                      ...whatsappConfig,
                      number: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="+5411987654321"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje por defecto
                  </label>
                  <textarea
                    value={whatsappConfig.message}
                    onChange={(e) => setWhatsappConfig({
                      ...whatsappConfig,
                      message: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Hola! Me interesa conocer más sobre..."
                  />
                </div>
                
                <button
                  onClick={saveWhatsAppConfig}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  💾 Guardar WhatsApp
                </button>
              </div>
            </div>

            {/* Paquetes Destacados */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  ⭐ Paquetes Destacados
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IDs de paquetes (uno por línea)
                  </label>
                  <textarea
                    value={featuredPackages.join('\n')}
                    onChange={(e) => setFeaturedPackages(
                      e.target.value.split('\n').filter(p => p.trim())
                    )}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="bariloche-2025&#10;cancun-verano&#10;europa-clasica"
                  />
                </div>
                
                <button
                  onClick={saveFeaturedPackages}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  ⭐ Actualizar Destacados
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 Estadísticas
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total contenidos:</span>
                  <span className="font-semibold">{contents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Publicados:</span>
                  <span className="font-semibold text-green-600">
                    {contents.filter(c => c.is_published).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Borradores:</span>
                  <span className="font-semibold text-orange-600">
                    {contents.filter(c => !c.is_published).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paquetes destacados:</span>
                  <span className="font-semibold">{featuredPackages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {isEditing && selectedContent && (
          <EditContentModal
            content={selectedContent}
            onSave={(updates) => saveContent(selectedContent.content_key, updates)}
            onCancel={() => {
              setIsEditing(false);
              setSelectedContent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ===============================================
// MODAL DE EDICIÓN DE CONTENIDO
// ===============================================

interface EditContentModalProps {
  content: CMSContent;
  onSave: (updates: Partial<CMSContent>) => void;
  onCancel: () => void;
}

function EditContentModal({ content, onSave, onCancel }: EditContentModalProps) {
  const [title, setTitle] = useState(content.title || '');
  const [contentText, setContentText] = useState(content.content || '');
  const [isPublished, setIsPublished] = useState(content.is_published);

  const handleSave = () => {
    onSave({
      title,
      content: contentText,
      is_published: isPublished
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            ✏️ Editar: {content.content_key}
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido
            </label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="published" className="text-sm text-gray-700">
              ✅ Publicar inmediatamente
            </label>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ❌ Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            💾 Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
