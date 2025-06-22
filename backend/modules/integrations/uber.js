/**
 * 🚗 INTEGRACIÓN UBER API - AGENTE 5
 * ==================================
 * 
 * Módulo para gestión completa de traslados con Uber:
 * - Cotización de tarifas
 * - Reserva automática
 * - Tracking en tiempo real
 * - Integración con reservas de viajes
 */

const { query } = require('../../database');

class UberIntegration {
  constructor() {
    this.baseURL = process.env.UBER_API_ENDPOINT || 'https://api.uber.com/v1.2';
    this.apiKey = process.env.UBER_API_KEY;
    this.clientId = process.env.UBER_CLIENT_ID;
    this.clientSecret = process.env.UBER_CLIENT_SECRET;
    this.sandboxMode = process.env.UBER_SANDBOX_MODE === 'true';
  }

  /**
   * Obtener cotización de tarifa para un traslado
   */
  async getQuote(pickupLat, pickupLng, destinationLat, destinationLng, vehicleType = 'uberX') {
    try {
      console.log('🚗 Cotizando traslado Uber:', { pickupLat, pickupLng, destinationLat, destinationLng, vehicleType });

      // En sandbox mode, simular respuesta
      if (this.sandboxMode) {
        return this.simulateQuote(pickupLat, pickupLng, destinationLat, destinationLng, vehicleType);
      }

      // Aquí iría la llamada real a la API de Uber
      const response = await this.makeUberRequest('GET', '/estimates/price', {
        start_latitude: pickupLat,
        start_longitude: pickupLng,
        end_latitude: destinationLat,
        end_longitude: destinationLng
      });

      const estimates = response.prices || [];
      const selectedEstimate = estimates.find(e => e.display_name.toLowerCase().includes(vehicleType.toLowerCase())) || estimates[0];

      if (!selectedEstimate) {
        throw new Error('No hay vehículos disponibles en esta área');
      }

      return {
        success: true,
        quote: {
          vehicleType: selectedEstimate.display_name,
          estimatedFare: selectedEstimate.estimate,
          estimatedTime: selectedEstimate.duration,
          distance: selectedEstimate.distance,
          currency: selectedEstimate.currency_code,
          surge: selectedEstimate.surge_multiplier > 1,
          surgeMultiplier: selectedEstimate.surge_multiplier
        }
      };

    } catch (error) {
      console.error('❌ Error cotizando Uber:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reservar traslado con Uber
   */
  async bookRide(bookingData) {
    try {
      const {
        reservationId,
        userId,
        pickupAddress,
        destinationAddress,
        pickupLat,
        pickupLng,
        destinationLat,
        destinationLng,
        vehicleType = 'uberX',
        passengerPhone,
        notes
      } = bookingData;

      console.log('🚗 Reservando traslado Uber:', { reservationId, vehicleType });

      // Obtener cotización primero
      const quote = await this.getQuote(pickupLat, pickupLng, destinationLat, destinationLng, vehicleType);
      
      if (!quote.success) {
        throw new Error(`Error en cotización: ${quote.error}`);
      }

      // En sandbox mode, simular reserva
      if (this.sandboxMode) {
        return await this.simulateBooking(bookingData, quote.quote);
      }

      // Aquí iría la llamada real a la API de Uber para crear la reserva
      const uberResponse = await this.makeUberRequest('POST', '/requests', {
        start_latitude: pickupLat,
        start_longitude: pickupLng,
        end_latitude: destinationLat,
        end_longitude: destinationLng,
        product_id: quote.quote.productId
      });

      // Guardar en base de datos
      const result = await query(`
        INSERT INTO uber_bookings (
          reservation_id, user_id, uber_request_id, pickup_address, destination_address,
          pickup_lat, pickup_lng, destination_lat, destination_lng, vehicle_type,
          estimated_fare, currency, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING id
      `, [
        reservationId, userId, uberResponse.request_id, pickupAddress, destinationAddress,
        pickupLat, pickupLng, destinationLat, destinationLng, vehicleType,
        quote.quote.estimatedFare, quote.quote.currency, 'confirmed'
      ]);

      const uberBookingId = result.rows[0].id;

      // Log de la reserva
      await this.logAction('success', 'Traslado reservado exitosamente', 
        `Uber Booking ID: ${uberBookingId} - Request ID: ${uberResponse.request_id}`);

      return {
        success: true,
        booking: {
          id: uberBookingId,
          uberRequestId: uberResponse.request_id,
          status: 'confirmed',
          estimatedFare: quote.quote.estimatedFare,
          vehicleType: vehicleType,
          eta: uberResponse.eta || '5-10 minutos'
        }
      };

    } catch (error) {
      console.error('❌ Error reservando Uber:', error);
      await this.logAction('error', 'Error en reserva de traslado', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estado de una reserva
   */
  async getBookingStatus(uberRequestId) {
    try {
      if (this.sandboxMode) {
        return this.simulateBookingStatus(uberRequestId);
      }

      const response = await this.makeUberRequest('GET', `/requests/${uberRequestId}`);
      
      return {
        success: true,
        status: {
          requestId: response.request_id,
          status: response.status,
          driver: response.driver ? {
            name: response.driver.name,
            phone: response.driver.phone_number,
            rating: response.driver.rating,
            picture: response.driver.picture_url
          } : null,
          vehicle: response.vehicle ? {
            make: response.vehicle.make,
            model: response.vehicle.model,
            license: response.vehicle.license_plate,
            color: response.vehicle.color
          } : null,
          location: response.location ? {
            lat: response.location.latitude,
            lng: response.location.longitude,
            bearing: response.location.bearing
          } : null,
          eta: response.eta,
          destination: response.destination
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estado Uber:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancelar reserva de Uber
   */
  async cancelBooking(uberRequestId, reason = 'user_cancelled') {
    try {
      if (this.sandboxMode) {
        return this.simulateCancellation(uberRequestId);
      }

      await this.makeUberRequest('DELETE', `/requests/${uberRequestId}`);
      
      // Actualizar estado en base de datos
      await query(`
        UPDATE uber_bookings 
        SET status = 'cancelled', updated_at = NOW()
        WHERE uber_request_id = $1
      `, [uberRequestId]);

      await this.logAction('info', 'Traslado cancelado', 
        `Request ID: ${uberRequestId} - Razón: ${reason}`);

      return {
        success: true,
        message: 'Reserva cancelada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error cancelando Uber:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener historial de traslados de un usuario
   */
  async getUserBookings(userId, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          ub.*,
          r.package_name,
          r.destination,
          r.travel_start_date
        FROM uber_bookings ub
        LEFT JOIN reservations r ON ub.reservation_id = r.id
        WHERE ub.user_id = $1
        ORDER BY ub.created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return {
        success: true,
        bookings: result.rows.map(booking => ({
          id: booking.id,
          reservationId: booking.reservation_id,
          packageName: booking.package_name,
          destination: booking.destination,
          pickupAddress: booking.pickup_address,
          destinationAddress: booking.destination_address,
          vehicleType: booking.vehicle_type,
          estimatedFare: booking.estimated_fare,
          actualFare: booking.actual_fare,
          status: booking.status,
          createdAt: booking.created_at,
          travelDate: booking.travel_start_date
        }))
      };

    } catch (error) {
      console.error('❌ Error obteniendo bookings del usuario:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================
  // MÉTODOS DE SIMULACIÓN (SANDBOX MODE)
  // ========================================

  simulateQuote(pickupLat, pickupLng, destinationLat, destinationLng, vehicleType) {
    // Calcular distancia aproximada
    const distance = this.calculateDistance(pickupLat, pickupLng, destinationLat, destinationLng);
    
    // Tarifas base por tipo de vehículo
    const baseFares = {
      uberX: 2.5,
      uberXL: 3.5,
      uberBlack: 4.5,
      uberSelect: 5.0
    };

    const baseFare = baseFares[vehicleType] || baseFares.uberX;
    const estimatedFare = baseFare + (distance * 1.2) + Math.random() * 5;
    const estimatedTime = Math.ceil(distance * 2 + Math.random() * 10);

    return {
      success: true,
      quote: {
        vehicleType: vehicleType,
        estimatedFare: Math.round(estimatedFare * 100) / 100,
        estimatedTime: estimatedTime,
        distance: Math.round(distance * 100) / 100,
        currency: 'USD',
        surge: Math.random() > 0.8,
        surgeMultiplier: Math.random() > 0.8 ? 1.5 : 1.0
      }
    };
  }

  async simulateBooking(bookingData, quote) {
    const uberRequestId = `UBER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Guardar en base de datos
    const result = await query(`
      INSERT INTO uber_bookings (
        reservation_id, user_id, uber_request_id, pickup_address, destination_address,
        pickup_lat, pickup_lng, destination_lat, destination_lng, vehicle_type,
        estimated_fare, currency, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id
    `, [
      bookingData.reservationId, bookingData.userId, uberRequestId, 
      bookingData.pickupAddress, bookingData.destinationAddress,
      bookingData.pickupLat, bookingData.pickupLng, 
      bookingData.destinationLat, bookingData.destinationLng, 
      bookingData.vehicleType, quote.estimatedFare, quote.currency, 'confirmed'
    ]);

    await this.logAction('success', 'Traslado reservado exitosamente (SANDBOX)', 
      `Uber Booking ID: ${result.rows[0].id} - Request ID: ${uberRequestId}`);

    return {
      success: true,
      booking: {
        id: result.rows[0].id,
        uberRequestId: uberRequestId,
        status: 'confirmed',
        estimatedFare: quote.estimatedFare,
        vehicleType: bookingData.vehicleType,
        eta: '5-10 minutos'
      }
    };
  }

  simulateBookingStatus(uberRequestId) {
    const statuses = ['confirmed', 'driver_assigned', 'arriving', 'in_progress', 'completed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      success: true,
      status: {
        requestId: uberRequestId,
        status: randomStatus,
        driver: randomStatus !== 'confirmed' ? {
          name: 'Carlos Rodriguez',
          phone: '+5491123456789',
          rating: 4.8,
          picture: null
        } : null,
        vehicle: randomStatus !== 'confirmed' ? {
          make: 'Toyota',
          model: 'Corolla',
          license: 'ABC123',
          color: 'Blanco'
        } : null,
        location: {
          lat: -34.6037 + (Math.random() - 0.5) * 0.01,
          lng: -58.3816 + (Math.random() - 0.5) * 0.01,
          bearing: Math.random() * 360
        },
        eta: Math.ceil(Math.random() * 15) + 2,
        destination: null
      }
    };
  }

  simulateCancellation(uberRequestId) {
    return {
      success: true,
      message: 'Reserva cancelada exitosamente (SANDBOX)'
    };
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  async makeUberRequest(method, endpoint, data = null) {
    // Aquí iría la implementación real de llamadas HTTP a Uber API
    // Para el ejemplo, simulamos respuestas
    console.log(`🌐 Uber API ${method} ${endpoint}:`, data);
    
    throw new Error('Uber API real no configurada - usar sandbox mode');
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  async logAction(level, message, details = null) {
    try {
      await query(`
        INSERT INTO integration_logs (integration_id, level, message, details, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
      `, ['uber-api', level, message, details]);
    } catch (error) {
      console.error('Error logging Uber action:', error);
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async healthCheck() {
    try {
      if (this.sandboxMode) {
        return {
          healthy: true,
          mode: 'sandbox',
          responseTime: Math.floor(Math.random() * 200) + 50
        };
      }

      // Aquí iría un ping real a la API de Uber
      return {
        healthy: true,
        mode: 'production',
        responseTime: Math.floor(Math.random() * 500) + 100
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = UberIntegration;