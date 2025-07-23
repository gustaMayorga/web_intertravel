"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/auth-context";
import { bookingsService } from "@/services/bookings-service";
import type { BookingsResult } from "@/services/bookings-service";

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar reservas
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(' isAuthenticated:', isAuthenticated);
      console.log(' currentUser:', currentUser);
      
      if (!isAuthenticated) {
        setError('Usuario no autenticado');
        return;
      }

      console.log(' Cargando reservas...');
      const result: BookingsResult = await bookingsService.getUserBookings();
      
      if (result.success) {
        setBookings(result.bookings || []);
        console.log(' Reservas cargadas:', result.bookings?.length || 0);
      } else {
        setError(result.error || 'Error cargando reservas');
        console.error(' Error:', result.error);
      }
    } catch (error) {
      console.error(' Error de conexión:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Debes iniciar sesión para ver tu dashboard.</p>
          <a href="/login" className="text-blue-600 hover:underline">Ir a Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard - {currentUser?.firstName}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
          <button 
            onClick={loadBookings}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Tus Reservas</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No tienes reservas aún.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{booking.packageTitle}</h3>
                <p>Destino: {booking.destination}</p>
                <p>Fecha: {booking.travelDate}</p>
                <p>Estado: {booking.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
