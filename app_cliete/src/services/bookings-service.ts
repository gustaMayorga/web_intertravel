// Fixed Bookings Service - Sin dependencias circulares
import { apiClient, Booking, UserStats } from './api-client';

export interface BookingsResult {
  success: boolean;
  bookings?: Booking[];
  total?: number;
  error?: string;
}

export interface BookingDetailsResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

export interface StatsResult {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

class BookingsService {
  // ======================================
  // OBTENER RESERVAS
  // ======================================

  async getUserBookings(): Promise<BookingsResult> {
    try {
      // Verificar autenticación usando apiClient directamente
      if (!apiClient.isAuthenticated()) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        };
      }

      console.log('📊 BookingsService: Obteniendo reservas del usuario');
      
      const response = await apiClient.getUserBookings();
      
      console.log('🔍 BookingsService: Full response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data && response.data.data) {
        const { bookings, total } = response.data.data;
        
        console.log(`✅ BookingsService: ${total} reservas obtenidas`);
        console.log('🔍 BookingsService: Bookings data:', bookings);
        
        return {
          success: true,
          bookings,
          total
        };
      } else {
        console.error('❌ BookingsService: Error obteniendo reservas', response.error);
        return {
          success: false,
          error: response.error || 'Error obteniendo reservas'
        };
      }
    } catch (error) {
      console.error('❌ BookingsService: Error de conexión', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet.'
      };
    }
  }

  async getBookingDetails(bookingId: string): Promise<BookingDetailsResult> {
    try {
      if (!apiClient.isAuthenticated()) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        };
      }

      console.log('📋 BookingsService: Obteniendo detalles de reserva', bookingId);
      
      const response = await apiClient.getBookingDetails(bookingId);
      
      if (response.success && response.data && response.data.data) {
        console.log('✅ BookingsService: Detalles de reserva obtenidos');
        
        return {
          success: true,
          booking: response.data.data.booking
        };
      } else {
        console.error('❌ BookingsService: Error obteniendo detalles', response.error);
        return {
          success: false,
          error: response.error || 'Error obteniendo detalles de la reserva'
        };
      }
    } catch (error) {
      console.error('❌ BookingsService: Error de conexión en detalles', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet.'
      };
    }
  }

  // ======================================
  // ESTADÍSTICAS
  // ======================================

  async getUserStats(): Promise<StatsResult> {
    try {
      if (!apiClient.isAuthenticated()) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        };
      }

      console.log('📈 BookingsService: Obteniendo estadísticas del usuario');
      
      const response = await apiClient.getUserStats();
      
      if (response.success && response.data && response.data.data) {
        console.log('✅ BookingsService: Estadísticas obtenidas');
        
        return {
          success: true,
          stats: response.data.data.stats
        };
      } else {
        console.error('❌ BookingsService: Error obteniendo estadísticas', response.error);
        return {
          success: false,
          error: response.error || 'Error obteniendo estadísticas'
        };
      }
    } catch (error) {
      console.error('❌ BookingsService: Error de conexión en estadísticas', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet.'
      };
    }
  }

  // ======================================
  // UTILIDADES
  // ======================================

  // Formatear moneda
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  // Formatear fecha
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Formatear fecha corta
  formatShortDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Obtener color del estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Obtener texto del estado
  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  }

  // Obtener color del estado de pago
  getPaymentStatusColor(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Obtener texto del estado de pago
  getPaymentStatusText(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'Pagado';
      case 'partial':
        return 'Pago Parcial';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      case 'refunded':
        return 'Reembolsado';
      default:
        return 'Desconocido';
    }
  }

  // Calcular días hasta el viaje
  getDaysUntilTravel(travelDate: string): number {
    try {
      const travel = new Date(travelDate);
      const now = new Date();
      const diffTime = travel.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  }

  // Verificar si la reserva está activa
  isActiveBooking(booking: Booking): boolean {
    return booking.status === 'confirmed' && this.getDaysUntilTravel(booking.travelDate) >= 0;
  }

  // Obtener imagen por defecto para destino
  getDestinationImage(destination: string): string {
    // Mapeo de destinos a imágenes locales
    const destinationImages: { [key: string]: string } = {
      'camboriu': '/camboriu.jfif',
      'camboriú': '/camboriu.jfif',
      'disney': '/disney.jfif',
      'peru': '/perú.jfif',
      'perú': '/perú.jfif',
    };

    const destinationKey = destination.toLowerCase();
    return destinationImages[destinationKey] || '/camboriu.jfif'; // Default
  }
}

// Instancia singleton del servicio de reservas
export const bookingsService = new BookingsService();

// Hook de conveniencia
export const useBookingsService = () => bookingsService;
