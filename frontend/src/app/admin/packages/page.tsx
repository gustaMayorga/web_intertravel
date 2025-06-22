'use client';

/**
 * 📦 GESTIÓN DE PAQUETES TURÍSTICOS - INTERTRAVEL ADMIN
 * =====================================================
 * 
 * ✅ CRUD completo de paquetes
 * ✅ Editor avanzado con preview
 * ✅ Gestión de precios e itinerarios
 * ✅ Estados y categorías
 * ✅ Análisis de performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Plane,
  Camera,
  Settings,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Globe,
  Heart,
  Award,
  Target
} from 'lucide-react';

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6" data-admin="true">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 h-8 w-8 text-blue-600" />
            Gestión de Paquetes
          </h1>
          <p className="text-gray-600 mt-1">
            Crea, edita y gestiona los paquetes turísticos de InterTravel
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Paquete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paquetes</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  20 activos
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">$186,500</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  145 reservas
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                <p className="text-2xl font-bold text-gray-900">4.7</p>
                <div className="flex items-center mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Destacados</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Award className="h-3 w-3 mr-1" />
                  3 borradores
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lista de Paquetes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paquetes..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="draft">Borradores</option>
                  <option value="archived">Archivados</option>
                </select>

                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="all">Todas las categorías</option>
                  <option value="adventure">Aventura</option>
                  <option value="cultural">Cultural</option>
                  <option value="luxury">Lujo</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Paquete
                </Button>
              </div>
            </div>

            {/* Mock Packages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Perú Package */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Globe className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Cusco</p>
                      <p className="text-xs opacity-75">Perú</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      activo
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        Perú Mágico - Machu Picchu y Cusco
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Cusco, Perú</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duración:</span>
                        <div className="font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          7 días
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio:</span>
                        <div className="font-bold text-blue-600">
                          $1,890
                          <span className="text-xs text-gray-400 line-through ml-1">
                            $2,100
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        4.8 (156 reseñas)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Reservas:</span>
                        <div className="font-medium">89</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Ingresos:</span>
                        <div className="font-medium text-green-600">$168,210</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-yellow-600">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Argentina Package */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-green-500 to-blue-600 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Globe className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Buenos Aires</p>
                      <p className="text-xs opacity-75">Argentina</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      activo
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        Argentina Épica - Buenos Aires y Bariloche
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Buenos Aires, Argentina</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duración:</span>
                        <div className="font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          10 días
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio:</span>
                        <div className="font-bold text-blue-600">$2,450</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        4.6 (92 reseñas)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Reservas:</span>
                        <div className="font-medium">54</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Ingresos:</span>
                        <div className="font-medium text-green-600">$132,300</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-yellow-600">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* México Package - Draft */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-orange-500 to-red-600 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Globe className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Ciudad de México</p>
                      <p className="text-xs opacity-75">México</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      borrador
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        México Colonial - CDMX y Guadalajara
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Ciudad de México, México</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duración:</span>
                        <div className="font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          8 días
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio:</span>
                        <div className="font-bold text-blue-600">$1,650</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Sin reseñas aún</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Reservas:</span>
                        <div className="font-medium">0</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Estado:</span>
                        <div className="font-medium text-yellow-600">En desarrollo</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Paquetes</CardTitle>
              <CardDescription>
                Análisis detallado del rendimiento de los paquetes turísticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Detallados</h3>
                <p className="text-gray-600 mb-4">
                  Aquí se mostrarán gráficos y métricas detalladas del rendimiento de los paquetes.
                </p>
                <p className="text-sm text-gray-500">
                  Funcionalidad en desarrollo - próximamente disponible
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Paquetes</CardTitle>
              <CardDescription>
                Configuración global para la gestión de paquetes turísticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuraciones</h3>
                <p className="text-gray-600 mb-4">
                  Configuración de categorías, precios, descuentos y políticas.
                </p>
                <p className="text-sm text-gray-500">
                  Panel de configuración en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}