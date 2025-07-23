'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';

interface EditableDestination {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  enabled: boolean;
}

interface EditableDestinationsProps {
  onDestinationClick?: (destination: EditableDestination) => void;
  adminMode?: boolean;
}

export default function EditableDestinations({ 
  onDestinationClick, 
  adminMode = false 
}: EditableDestinationsProps) {
  const [destinations, setDestinations] = useState<EditableDestination[]>([
    { 
      id: 'europe', 
      name: 'Europa Clásica', 
      description: 'París, Roma, Londres', 
      price: 2299, 
      duration: '12 días',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop',
      enabled: true
    },
    { 
      id: 'asia', 
      name: 'Circuito Asiático', 
      description: 'Tokio, Bangkok, Singapur', 
      price: 2899, 
      duration: '15 días',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
      enabled: true
    },
    { 
      id: 'america', 
      name: 'Maravillas Americanas', 
      description: 'Cusco, Cancún, New York', 
      price: 2199, 
      duration: '10 días',
      image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop',
      enabled: true
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableDestination | null>(null);

  // Cargar datos desde localStorage (simulando backend)
  useEffect(() => {
    const saved = localStorage.getItem('intertravel_destinations');
    if (saved) {
      try {
        setDestinations(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading destinations:', e);
      }
    }
  }, []);

  // Guardar datos en localStorage (simulando backend)
  const saveDestinations = (newDestinations: EditableDestination[]) => {
    setDestinations(newDestinations);
    localStorage.setItem('intertravel_destinations', JSON.stringify(newDestinations));
  };

  const startEdit = (destination: EditableDestination) => {
    setEditingId(destination.id);
    setEditForm({ ...destination });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    
    const newDestinations = destinations.map(dest => 
      dest.id === editForm.id ? editForm : dest
    );
    saveDestinations(newDestinations);
    setEditingId(null);
    setEditForm(null);
  };

  const toggleEnabled = (id: string) => {
    const newDestinations = destinations.map(dest => 
      dest.id === id ? { ...dest, enabled: !dest.enabled } : dest
    );
    saveDestinations(newDestinations);
  };

  const deleteDestination = (id: string) => {
    if (destinations.length <= 1) {
      alert('Debe haber al menos un destino');
      return;
    }
    const newDestinations = destinations.filter(dest => dest.id !== id);
    saveDestinations(newDestinations);
  };

  const addDestination = () => {
    const newDest: EditableDestination = {
      id: `dest_${Date.now()}`,
      name: 'Nuevo Destino',
      description: 'Descripción del destino',
      price: 2000,
      duration: '7 días',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
      enabled: true
    };
    saveDestinations([...destinations, newDest]);
  };

  const enabledDestinations = destinations.filter(dest => dest.enabled);

  if (adminMode) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Gestionar Destinos Destacados
          </h3>
          <Button onClick={addDestination} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Destino
          </Button>
        </div>

        <div className="space-y-4">
          {destinations.map((destination) => (
            <Card key={destination.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === destination.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={editForm?.name || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nombre del destino"
                        />
                        <Input
                          value={editForm?.duration || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, duration: e.target.value } : null)}
                          placeholder="Duración"
                        />
                      </div>
                      <Textarea
                        value={editForm?.description || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Descripción"
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          value={editForm?.price || 0}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                          placeholder="Precio"
                        />
                        <Input
                          value={editForm?.image || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, image: e.target.value } : null)}
                          placeholder="URL de imagen"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="flex items-center gap-1">
                          <Save className="w-4 h-4" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm" className="flex items-center gap-1">
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="text-lg font-semibold">{destination.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          destination.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {destination.enabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{destination.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {destination.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          USD ${destination.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {editingId !== destination.id && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => toggleEnabled(destination.id)}
                      size="sm"
                      variant={destination.enabled ? "default" : "outline"}
                    >
                      {destination.enabled ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button onClick={() => startEdit(destination)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => deleteDestination(destination.id)} 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Vista pública
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Destinos Más Solicitados
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Circuitos cuidadosamente diseñados para brindar experiencias auténticas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {enabledDestinations.slice(0, 3).map((destination) => (
            <div
              key={destination.id}
              onClick={() => onDestinationClick?.(destination)}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    {destination.duration}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {destination.name}
                </h3>
                <p className="text-gray-600 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {destination.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-blue-600">
                    USD ${destination.price.toLocaleString()}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                    Ver Detalles
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/paquetes"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-lg gap-2"
          >
            Ver Todos los Destinos
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
