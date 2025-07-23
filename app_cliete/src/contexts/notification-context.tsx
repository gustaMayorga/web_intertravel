"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'travel' | 'payment';
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  bookingId?: string;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  isEnabled: boolean;
  toggleNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);

  // Cargar configuración desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('intertravel_notifications');
      const savedEnabled = localStorage.getItem('intertravel_notifications_enabled');
      
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed);
        } catch (error) {
          console.error('Error cargando notificaciones:', error);
        }
      }
      
      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === 'true');
      }
    }
  }, []);

  // Guardar notificaciones en localStorage
  const saveNotifications = (newNotifications: Notification[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intertravel_notifications', JSON.stringify(newNotifications));
    }
  };

  // Agregar nueva notificación
  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Mantener máximo 50
      saveNotifications(updated);
      return updated;
    });

    // Mostrar toast si las notificaciones están habilitadas
    if (isEnabled) {
      const getPriorityDuration = (priority: Notification['priority']) => {
        switch (priority) {
          case 'urgent': return 10000;
          case 'high': return 7000;
          case 'medium': return 5000;
          default: return 3000;
        }
      };

      toast({
        title: newNotification.title,
        description: newNotification.message,
        duration: getPriorityDuration(newNotification.priority),
        variant: newNotification.type === 'error' ? 'destructive' : 'default',
      });
    }

    console.log(' Nueva notificación:', newNotification);
  };

  // Marcar como leída
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      saveNotifications(updated);
      return updated;
    });
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  // Remover notificación
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });
  };

  // Limpiar todas
  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  // Filtrar por tipo
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.filter(notif => notif.type === type);
  };

  // Toggle notificaciones
  const toggleNotifications = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('intertravel_notifications_enabled', newEnabled.toString());
    }
  };

  // Limpiar notificaciones expiradas
  useEffect(() => {
    const cleanupExpired = () => {
      const now = new Date().toISOString();
      setNotifications(prev => {
        const updated = prev.filter(notif => !notif.expiresAt || notif.expiresAt > now);
        if (updated.length !== prev.length) {
          saveNotifications(updated);
        }
        return updated;
      });
    };

    const interval = setInterval(cleanupExpired, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);

  // Simular notificaciones de prueba cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && currentUser && notifications.length === 0) {
      setTimeout(() => {
        addNotification({
          title: '¡Bienvenido de vuelta!',
          message: `Hola ${currentUser.firstName}, tienes 2 reservas confirmadas esperándote.`,
          type: 'success',
          priority: 'medium'
        });
      }, 2000);

      setTimeout(() => {
        addNotification({
          title: ' Recordatorio de viaje',
          message: 'Tu viaje a Camboriú está próximo. Revisa tu checklist de preparación.',
          type: 'travel',
          priority: 'high',
          bookingId: 'booking-1',
          actionUrl: '/checklist',
          actionText: 'Ver Checklist'
        });
      }, 5000);
    }
  }, [isAuthenticated, currentUser]);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByType,
    isEnabled,
    toggleNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
