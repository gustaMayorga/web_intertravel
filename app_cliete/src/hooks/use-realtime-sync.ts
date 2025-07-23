import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';

interface SyncStatus {
  isActive: boolean;
  lastSync: string | null;
  hasChanges: boolean;
  error: string | null;
}

interface SyncHookOptions {
  intervalMs?: number;
  onSyncSuccess?: (data: any) => void;
  onSyncError?: (error: string) => void;
  onChangesDetected?: (changes: string[]) => void;
}

export function useRealTimeSync(options: SyncHookOptions = {}) {
  const {
    intervalMs = 30000,
    onSyncSuccess,
    onSyncError,
    onChangesDetected
  } = options;
  
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: null,
    hasChanges: false,
    error: null
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`http://localhost:3002/api/sync-user-data?userId=user123&timestamp=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          hasChanges: data.hasChanges || false,
          error: null
        }));

        if (data.hasChanges && onChangesDetected) {
          onChangesDetected(data.changes || []);
        }

        if (onSyncSuccess) {
          onSyncSuccess(data);
        }
      }
    } catch (error) {
      const errorMessage = 'Error de sincronización';
      setSyncStatus(prev => ({ ...prev, error: errorMessage }));
      
      if (onSyncError) {
        onSyncError(errorMessage);
      }
    }
  }, [isAuthenticated, onSyncSuccess, onSyncError, onChangesDetected]);

  // FIX: useEffect separado sin dependencias de funciones
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSyncStatus(prev => ({ ...prev, isActive: false }));
      return;
    }

    // Start sync
    setSyncStatus(prev => ({ ...prev, isActive: true }));
    performSync();
    
    intervalRef.current = setInterval(performSync, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, intervalMs]); // Solo deps primitivas

  const startSync = useCallback(() => {
    if (!isAuthenticated) return;
    performSync();
  }, [isAuthenticated, performSync]);

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSyncStatus(prev => ({ ...prev, isActive: false }));
  }, []);

  return {
    syncStatus,
    startSync,
    stopSync,
    performSync
  };
}

export function useDashboardSync() {
  const { addNotification } = useNotifications();
  
  return useRealTimeSync({
    intervalMs: 30000,
    onSyncSuccess: (data) => {
      if (data.hasChanges) {
        addNotification({
          type: 'booking',
          title: 'Datos actualizados',
          message: 'Se detectaron cambios en tus reservas',
          priority: 'medium'
        });
      }
    },
    onSyncError: (error) => {
      addNotification({
        type: 'system',
        title: 'Error de sincronización',
        message: error,
        priority: 'high'
      });
    },
    onChangesDetected: (changes) => {
      console.log('Cambios detectados:', changes);
    }
  });
}
