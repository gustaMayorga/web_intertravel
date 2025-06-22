'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeySequence {
  keys: string[];
  currentIndex: number;
  timeout: NodeJS.Timeout | null;
  resetDelay: number;
}

export function useAdminAccess() {
  const router = useRouter();
  const [isSecretMode, setIsSecretMode] = useState(false);
  
  // Secuencia secreta: Ctrl + Shift + I + N + T + E + R (en ese orden)
  const SECRET_SEQUENCE = ['ControlLeft', 'ShiftLeft', 'KeyI', 'KeyN', 'KeyT', 'KeyE', 'KeyR'];
  
  const [keySequence, setKeySequence] = useState<KeySequence>({
    keys: [],
    currentIndex: 0,
    timeout: null,
    resetDelay: 3000 // 3 segundos para completar la secuencia
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.code;
      
      setKeySequence(prev => {
        // Limpiar timeout anterior
        if (prev.timeout) {
          clearTimeout(prev.timeout);
        }

        // Verificar si la tecla presionada es la siguiente en la secuencia
        const expectedKey = SECRET_SEQUENCE[prev.currentIndex];
        
        if (key === expectedKey) {
          const newIndex = prev.currentIndex + 1;
          const newKeys = [...prev.keys, key];
          
          // Si completamos la secuencia
          if (newIndex === SECRET_SEQUENCE.length) {
            console.log('🔓 Acceso secreto al admin desbloqueado!');
            setIsSecretMode(true);
            
            // Mostrar notificación visual temporal
            showSecretModeNotification();
            
            // Navegar al admin después de un breve delay
            setTimeout(() => {
              router.push('/admin/login');
            }, 1500);
            
            return {
              keys: [],
              currentIndex: 0,
              timeout: null,
              resetDelay: prev.resetDelay
            };
          }
          
          // Configurar timeout para resetear si no se completa
          const newTimeout = setTimeout(() => {
            setKeySequence(initialState => ({
              ...initialState,
              keys: [],
              currentIndex: 0,
              timeout: null
            }));
          }, prev.resetDelay);
          
          return {
            keys: newKeys,
            currentIndex: newIndex,
            timeout: newTimeout,
            resetDelay: prev.resetDelay
          };
        } else {
          // Tecla incorrecta, resetear secuencia
          return {
            keys: [],
            currentIndex: 0,
            timeout: null,
            resetDelay: prev.resetDelay
          };
        }
      });
    };

    // Solo agregar listener si no estamos ya en modo secreto
    if (!isSecretMode) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (keySequence.timeout) {
        clearTimeout(keySequence.timeout);
      }
    };
  }, [isSecretMode, router]);

  const showSecretModeNotification = () => {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 18px;
        font-weight: 600;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        z-index: 9999;
        text-align: center;
        animation: secretPulse 1.5s ease-in-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
      ">
        <div style="font-size: 24px; margin-bottom: 8px;">🔓</div>
        <div>Acceso Secreto Desbloqueado</div>
        <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">Redirigiendo al panel admin...</div>
      </div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes secretPulse {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remover después de 2 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2000);
  };

  return {
    isSecretMode,
    resetSecretMode: () => setIsSecretMode(false),
    currentProgress: keySequence.currentIndex,
    totalSteps: SECRET_SEQUENCE.length
  };
}

export default useAdminAccess;
