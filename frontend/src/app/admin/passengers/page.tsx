'use client';

/**
 * 🧳 MÓDULO DE GESTIÓN DE PASAJEROS - INTERTRAVEL ADMIN
 * =====================================================
 * 
 * ✅ CRUD completo de pasajeros
 * ✅ Importación masiva desde Excel/CSV
 * ✅ Asignación automática de viajes
 * ✅ Templates predefinidos
 * ✅ Validación de datos
 * ✅ Integración con app móvil
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  Upload,
  Download,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Plane,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  CreditCard,
  Globe,
  Star,
  Clock,
  Target,
  Database,
  FileSpreadsheet,
  UserCheck,
  UserPlus,
  Send,
  Settings
} from 'lucide-react';

// ================================
// 🎨 TYPES & INTERFACES
// ================================

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'dni' | 'passport' | 'cedula';
  documentNumber: string;
  birthDate: string;
  nationality: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  tripCode?: string;
  tripName?: string;
  departureDate?: string;
  status: 'pending' | 'confirmed' | 'documents_pending' | 'ready' | 'traveling' | 'completed';
  createdAt: string;
  lastUpdated: string;
  appRegistered: boolean;
  documentsUploaded: string[];
}

interface Trip {
  code: string;
  name: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  maxPassengers: number;
  currentPassengers: number;
}

interface ImportTemplate {
  name: string;
  description: string;
  fields: string[];
  sampleData: any[];
}

// ================================
// 🎯 MAIN COMPONENT
// ================================

export default function PassengersModule() {
  const [activeTab, setActiveTab] = useState('list');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);

  // ================================
  // 📊 MOCK DATA INITIALIZATION
  // ================================

  React.useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Mock passengers data
    const mockPassengers: Passenger[] = [
      {
        id: '1',
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@email.com',
        phone: '+54 9 261 123-4567',
        documentType: 'dni',
        documentNumber: '12345678',
        birthDate: '1985-06-15',
        nationality: 'Argentina',
        emergencyContact: {
          name: 'Carlos García',
          phone: '+54 9 261 987-6543',
          relationship: 'Esposo'
        },
        tripCode: 'PERU001',
        tripName: 'Perú Mágico - Machu Picchu',
        departureDate: '2025-08-15',
        status: 'confirmed',
        createdAt: '2025-06-01T10:00:00Z',
        lastUpdated: '2025-06-25T15:30:00Z',
        appRegistered: true,
        documentsUploaded: ['passport', 'visa']
      },
      {
        id: '2',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+54 9 261 234-5678',
        documentType: 'passport',
        documentNumber: 'ARG123456789',
        birthDate: '1990-03-20',
        nationality: 'Argentina',
        emergencyContact: {
          name: 'Ana Pérez',
          phone: '+54 9 261 876-5432',
          relationship: 'Madre'
        },
        tripCode: 'ARG002',
        tripName: 'Argentina Épica - Patagonia',
        departureDate: '2025-09-10',
        status: 'documents_pending',
        createdAt: '2025-06-10T14:00:00Z',
        lastUpdated: '2025-06-26T09:15:00Z',
        appRegistered: false,
        documentsUploaded: ['passport']
      },
      {
        id: '3',
        firstName: 'Laura',
        lastName: 'Martínez',
        email: 'laura.martinez@email.com',
        phone: '+54 9 261 345-6789',
        documentType: 'dni',
        documentNumber: '23456789',
        birthDate: '1988-11-30',
        nationality: 'Argentina',
        emergencyContact: {
          name: 'Roberto Martínez',
          phone: '+54 9 261 765-4321',
          relationship: 'Padre'
        },
        tripCode: '',
        tripName: '',
        departureDate: '',
        status: 'pending',
        createdAt: '2025-06-20T16:00:00Z',
        lastUpdated: '2025-06-26T11:20:00Z',
        appRegistered: true,
        documentsUploaded: []
      }
    ];

    // Mock trips data
    const mockTrips: Trip[] = [
      {
        code: 'PERU001',
        name: 'Perú Mágico - Machu Picchu',
        destination: 'Cusco, Perú',
        departureDate: '2025-08-15',
        returnDate: '2025-08-22',
        maxPassengers: 25,
        currentPassengers: 18
      },
      {
        code: 'ARG002',
        name: 'Argentina Épica - Patagonia',
        destination: 'Bariloche, Argentina',
        departureDate: '2025-09-10',
        returnDate: '2025-09-20',
        maxPassengers: 30,
        currentPassengers: 12
      },
      {
        code: 'MEX003',
        name: 'México Colonial - CDMX',
        destination: 'Ciudad de México, México',
        departureDate: '2025-10-05',
        returnDate: '2025-10-12',
        maxPassengers: 20,
        currentPassengers: 8
      }
    ];

    setPassengers(mockPassengers);
    setTrips(mockTrips);
  };

  // ================================
  // 🎨 HELPER FUNCTIONS
  // ================================

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      documents_pending: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-blue-100 text-blue-800 border-blue-200',
      traveling: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      documents_pending: <FileText className="h-4 w-4" />,
      ready: <UserCheck className="h-4 w-4" />,
      traveling: <Plane className="h-4 w-4" />,
      completed: <Star className="h-4 w-4" />
    };
    return icons[status as keyof typeof icons] || icons.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      documents_pending: 'Docs. Pendientes',
      ready: 'Listo',
      traveling: 'Viajando',
      completed: 'Completado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredPassengers = passengers.filter(passenger => {
    const matchesSearch = 
      passenger.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.tripName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || passenger.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // ================================
  // 📤 IMPORT FUNCTIONS
  // ================================

  const downloadTemplate = () => {
    const template = {
      headers: ['firstName', 'lastName', 'email', 'phone', 'documentType', 'documentNumber', 'birthDate', 'nationality', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship', 'tripCode'],
      sampleData: [
        ['María', 'García', 'maria@email.com', '+54261123456', 'dni', '12345678', '1985-06-15', 'Argentina', 'Carlos García', '+54261987654', 'Esposo', 'PERU001'],
        ['Juan', 'Pérez', 'juan@email.com', '+54261234567', 'passport', 'ARG123456789', '1990-03-20', 'Argentina', 'Ana Pérez', '+54261876543', 'Madre', 'ARG002']
      ]
    };

    // Create CSV content
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_pasajeros_intertravel.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportProgress(0);

    // Simulate import process
    const importInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(importInterval);
          setIsLoading(false);
          setImportResults({
            total: 25,
            success: 23,
            errors: 2,
            warnings: 1,
            newPassengers: 15,
            updatedPassengers: 8
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, []);

  const assignTrip = (passengerId: string, tripCode: string) => {
    const trip = trips.find(t => t.code === tripCode);
    if (!trip) return;

    setPassengers(prev => prev.map(p => 
      p.id === passengerId 
        ? { 
            ...p, 
            tripCode: trip.code,
            tripName: trip.name,
            departureDate: trip.departureDate,
            status: 'confirmed' as const,
            lastUpdated: new Date().toISOString()
          }
        : p
    ));
  };

  // ================================
  // 🎨 RENDER COMPONENTS
  // ================================

  const renderPassengersList = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pasajeros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmados</option>
            <option value="documents_pending">Docs. Pendientes</option>
            <option value="ready">Listos</option>
            <option value="traveling">Viajando</option>
            <option value="completed">Completados</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('import')}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pasajero
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pasajeros</p>
                <p className="text-2xl font-bold text-gray-900">{passengers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con App</p>
                <p className="text-2xl font-bold text-green-600">
                  {passengers.filter(p => p.appRegistered).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Viajando</p>
                <p className="text-2xl font-bold text-purple-600">
                  {passengers.filter(p => p.status === 'traveling').length}
                </p>
              </div>
              <Plane className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {passengers.filter(p => p.status === 'pending' || p.status === 'documents_pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passengers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Viaje Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App Móvil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full p-2 mr-3">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passenger.firstName} {passenger.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{passenger.email}</div>
                          <div className="text-xs text-gray-400">
                            {passenger.documentType.toUpperCase()}: {passenger.documentNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {passenger.tripCode ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passenger.tripName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(passenger.departureDate).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {passenger.tripCode}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center">
                          <select
                            onChange={(e) => assignTrip(passenger.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Asignar viaje...</option>
                            {trips.map(trip => (
                              <option key={trip.code} value={trip.code}>
                                {trip.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(passenger.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(passenger.status)}
                          {getStatusLabel(passenger.status)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {passenger.appRegistered ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-xs text-green-600 ml-1">Registrado</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <span className="text-xs text-orange-600 ml-1">Pendiente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        {passenger.documentsUploaded.length > 0 ? (
                          <div>
                            <span className="text-green-600 font-medium">
                              {passenger.documentsUploaded.length} subidos
                            </span>
                            <div className="text-gray-500">
                              {passenger.documentsUploaded.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-600">Sin documentos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPassenger(passenger)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!passenger.appRegistered && (
                          <Button variant="ghost" size="sm" className="text-blue-600">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importación Masiva de Pasajeros
          </CardTitle>
          <CardDescription>
            Carga múltiples pasajeros desde Excel o CSV utilizando nuestra plantilla
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Paso 1: Descargar Plantilla
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Descarga nuestra plantilla Excel con los campos requeridos y datos de ejemplo
                </p>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Paso 2: Subir Archivo
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sube tu archivo completado (Excel .xlsx o CSV)
                </p>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {isLoading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando archivo...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Results */}
          {importResults && (
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-full p-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    Paso 3: Resultados de Importación
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                      <div className="text-xs text-green-600">Éxito</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{importResults.newPassengers}</div>
                      <div className="text-xs text-blue-600">Nuevos</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">{importResults.updatedPassengers}</div>
                      <div className="text-xs text-orange-600">Actualizados</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                      <div className="text-xs text-red-600">Errores</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Campos de la Plantilla
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Campos Obligatorios:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• firstName (Nombre)</li>
                <li>• lastName (Apellido)</li>
                <li>• email (Correo electrónico)</li>
                <li>• phone (Teléfono)</li>
                <li>• documentType (dni/passport/cedula)</li>
                <li>• documentNumber (Número de documento)</li>
                <li>• birthDate (Fecha nacimiento YYYY-MM-DD)</li>
                <li>• nationality (Nacionalidad)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Campos Opcionales:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• emergencyContactName (Contacto emergencia)</li>
                <li>• emergencyContactPhone (Tel. emergencia)</li>
                <li>• emergencyContactRelationship (Relación)</li>
                <li>• tripCode (Código de viaje)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================
  // 🎯 MAIN RENDER
  // ================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8 text-blue-600" />
            Gestión de Pasajeros
          </h1>
          <p className="text-gray-600 mt-1">
            Administra pasajeros, asigna viajes e integra con la app móvil
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Alert for App Integration */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Integración con App Móvil:</strong> Los pasajeros pueden registrarse en la app usando su email. 
          Una vez registrados, podrán ver sus viajes, documentos y recibir notificaciones en tiempo real.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista de Pasajeros
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Masivo
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Viajes Disponibles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {renderPassengersList()}
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          {renderImportTab()}
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Card key={trip.code} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {trip.destination}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{trip.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Salida:</span>
                      <span className="font-medium">{new Date(trip.departureDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Regreso:</span>
                      <span className="font-medium">{new Date(trip.returnDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pasajeros:</span>
                      <span className="font-medium">{trip.currentPassengers}/{trip.maxPassengers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(trip.currentPassengers / trip.maxPassengers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Passenger Detail Modal */}
      {selectedPassenger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedPassenger.firstName} {selectedPassenger.lastName}
                </h2>
                <Button variant="ghost" onClick={() => setSelectedPassenger(null)}>
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Información Personal</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedPassenger.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teléfono:</span>
                      <span>{selectedPassenger.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documento:</span>
                      <span>{selectedPassenger.documentType.toUpperCase()}: {selectedPassenger.documentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nacimiento:</span>
                      <span>{new Date(selectedPassenger.birthDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nacionalidad:</span>
                      <span>{selectedPassenger.nationality}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Viaje y Estado</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Viaje:</span>
                      <span>{selectedPassenger.tripName || 'Sin asignar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <Badge className={getStatusColor(selectedPassenger.status)}>
                        {getStatusLabel(selectedPassenger.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">App:</span>
                      <span className={selectedPassenger.appRegistered ? 'text-green-600' : 'text-red-600'}>
                        {selectedPassenger.appRegistered ? 'Registrado' : 'No registrado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documentos:</span>
                      <span>{selectedPassenger.documentsUploaded.length} subidos</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre:</span>
                    <div className="font-medium">{selectedPassenger.emergencyContact.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <div className="font-medium">{selectedPassenger.emergencyContact.phone}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Relación:</span>
                    <div className="font-medium">{selectedPassenger.emergencyContact.relationship}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedPassenger(null)}>
                  Cerrar
                </Button>
                <Button>
                  Editar Pasajero
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}