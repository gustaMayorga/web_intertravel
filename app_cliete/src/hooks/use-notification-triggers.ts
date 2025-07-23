import { useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useAuth } from '@/contexts/auth-context';
import { bookingsService } from '@/services/bookings-service';

export function useNotificationTriggers() {
  const { addNotification } = useNotifications();
  const { currentUser, isAuthenticated } = useAuth();

  // Simulador de notificaciones basadas en eventos
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    let timeouts: NodeJS.Timeout[] = [];

    // Simular notificaciones de recordatorios de viaje
    const scheduleNotifications = () => {
      // Notificación de bienvenida (después de 3 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: `¡Hola, ${currentUser.firstName}! `,
          message: 'Te damos la bienvenida a tu centro de viajes. Aquí encontrarás toda la información de tus reservas.',
          type: 'info',
          priority: 'medium'
        });
      }, 3000));

      // Notificación de documentación (después de 10 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: ' Recordatorio importante',
          message: 'Revisa que tus documentos de viaje estén vigentes. Es importante verificar pasaporte y visas.',
          type: 'warning',
          priority: 'high',
          actionUrl: '/checklist',
          actionText: 'Ver Checklist'
        });
      }, 10000));

      // Notificación de promoción (después de 20 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: ' ¡Oferta especial!',
          message: 'Descubre nuestros nuevos paquetes a Europa con 20% de descuento. ¡Cupos limitados!',
          type: 'success',
          priority: 'medium',
          actionUrl: '/packages',
          actionText: 'Ver Ofertas',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        });
      }, 20000));

      // Notificación de pago pendiente (después de 30 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: ' Pago pendiente',
          message: 'Tienes un saldo pendiente en tu reserva a Camboriú. Completa el pago para asegurar tu lugar.',
          type: 'payment',
          priority: 'high',
          bookingId: 'booking-1',
          actionUrl: '/reservas/booking-1',
          actionText: 'Pagar Ahora'
        });
      }, 30000));

      // Notificación de clima (después de 45 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: '️ Clima de tu destino',
          message: 'El clima en Camboriú estará perfecto durante tu viaje: 24degC y soleado. ¡Ideal para la playa!',
          type: 'travel',
          priority: 'low',
          actionUrl: '/details',
          actionText: 'Ver Más'
        });
      }, 45000));

      // Notificación urgente de último momento (después de 60 segundos)
      timeouts.push(setTimeout(() => {
        addNotification({
          title: ' Actualización de vuelo',
          message: 'IMPORTANTE: Tu vuelo IB6840 del 15/08 ha cambiado la hora de salida a las 14:30hs. Verifica tu itinerario.',
          type: 'error',
          priority: 'urgent',
          bookingId: 'booking-1',
          actionUrl: '/flights',
          actionText: 'Ver Vuelos'
        });
      }, 60000));
    };

    scheduleNotifications();

    // Cleanup
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isAuthenticated, currentUser, addNotification]);

  // Notificaciones basadas en acciones del usuario
  const triggerBookingNotification = (bookingId: string, action: 'confirmed' | 'payment' | 'cancelled') => {
    const notifications = {
      confirmed: {
        title: ' Reserva confirmada',
        message: 'Tu reserva ha sido confirmada exitosamente. ¡Prepárate para una experiencia increíble!',
        type: 'success' as const,
        priority: 'high' as const
      },
      payment: {
        title: ' Pago procesado',
        message: 'Tu pago ha sido procesado correctamente. Recibirás un email con la confirmación.',
        type: 'payment' as const,
        priority: 'medium' as const
      },
      cancelled: {
        title: ' Reserva cancelada',
        message: 'Tu reserva ha sido cancelada. Si necesitas ayuda, contacta con nuestro equipo de soporte.',
        type: 'error' as const,
        priority: 'high' as const
      }
    };

    const notification = notifications[action];
    addNotification({
      ...notification,
      bookingId,
      actionUrl: `/reservas/${bookingId}`,
      actionText: 'Ver Detalles'
    });
  };

  const triggerTravelReminder = (daysUntilTravel: number, destination: string, bookingId: string) => {
    if (daysUntilTravel <= 7 && daysUntilTravel > 0) {
      const message = daysUntilTravel === 1 
        ? `¡Mañana es el gran día! Tu viaje a ${destination} comienza. Revisa tu checklist final.`
        : `¡Solo faltan ${daysUntilTravel} días para tu viaje a ${destination}! Asegúrate de tener todo listo.`;

      addNotification({
        title: '️ Recordatorio de viaje',
        message,
        type: 'travel',
        priority: daysUntilTravel <= 3 ? 'urgent' : 'high',
        bookingId,
        actionUrl: '/checklist',
        actionText: 'Ver Checklist'
      });
    }
  };

  const triggerWeatherAlert = (destination: string, weather: string) => {
    addNotification({
      title: '️ Alerta climática',
      message: `Condiciones climáticas especiales en ${destination}: ${weather}. Ajusta tu equipaje según corresponda.`,
      type: 'warning',
      priority: 'medium',
      actionUrl: '/checklist',
      actionText: 'Actualizar Equipaje'
    });
  };

  const triggerSystemMaintenance = () => {
    addNotification({
      title: ' Mantenimiento programado',
      message: 'El sistema estará en mantenimiento el domingo de 02:00 a 04:00 AM. Durante ese tiempo no podrás acceder.',
      type: 'info',
      priority: 'low',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    });
  };

  return {
    triggerBookingNotification,
    triggerTravelReminder,
    triggerWeatherAlert,
    triggerSystemMaintenance
  };
}
