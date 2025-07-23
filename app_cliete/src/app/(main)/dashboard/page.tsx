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

  // Función para cargar reservas usando bookingsService corregido
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(' isAuthenticated:', isAuthenticated);
      console.log(' currentUser:', currentUser);
      console.log(' bookingsService:', bookingsService);
      console.log(' bookingsService.getUserBookings:', typeof bookingsService?.getUserBookings);
      
      if (!isAuthenticated) {
        setError('Usuario no autenticado');
        return;
      }

      console.log(' Cargando reservas con bookingsService...');
      const result: BookingsResult = await bookingsService.getUserBookings();
      
      console.log(' Result:', result);
      
      if (result.success) {
        setBookings(result.bookings || []);
        console.log(' Reservas cargadas:', result.bookings?.length || 0);
      } else {
        setError(result.error || 'Error cargando reservas');
        console.error(' Error:', result.error);
      }
    } catch (error) {
      console.error(' Error de conexión:', error);
      setError('Error de conexión: ' + error.message);
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
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <p>No tienes reservas aún. ¡Haz tu primera reserva!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="border p-4 rounded-lg bg-white shadow">
                <h3 className="font-semibold text-lg">{booking.packageTitle}</h3>
                <p><strong>Destino:</strong> {booking.destination}, {booking.country}</p>
                <p><strong>Fecha:</strong> {booking.travelDate}</p>
                <p><strong>Duración:</strong> {booking.durationDays} días</p>
                <p><strong>Estado:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmada' : 
                     booking.status === 'pending' ? 'Pendiente' : booking.status}
                  </span>
                </p>
                <p><strong>Precio:</strong> ${booking.totalAmount} {booking.currency}</p>
                <p><strong>Referencia:</strong> {booking.bookingReference}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-sm">
{`isAuthenticated: ${isAuthenticated}
currentUser: ${currentUser ? 'presente' : 'null'}
bookingsService: ${bookingsService ? 'presente' : 'undefined'}
getUserBookings: ${typeof bookingsService?.getUserBookings}`}
        </pre>
      </div>
    </div>
  );
}
