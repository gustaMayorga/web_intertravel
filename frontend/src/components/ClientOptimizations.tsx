'use client';

import { useEffect } from 'react';

// Componente para aplicar optimizaciones del lado del cliente
export default function ClientOptimizations() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    try {
      // Preload critical resources con verificación
      const criticalImages = [
        { src: '/logo-intertravel.svg', fallback: '/logo-intertravel.png' },
        { src: '/og-image.svg', fallback: '/favicon.svg' }
      ];
      
      criticalImages.forEach(({ src, fallback }) => {
        // Crear un elemento de imagen para verificar si existe
        const img = new Image();
        img.onload = () => {
          // Si la imagen carga correctamente, crear el preload
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          document.head.appendChild(link);
        };
        img.onerror = () => {
          // Si falla, intentar con el fallback
          if (fallback) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = fallback;
            document.head.appendChild(link);
          }
        };
        img.src = src;
      });

      // Service Worker registration for production
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('SW registered: ', registration))
          .catch(error => console.log('SW registration failed: ', error));
      }

      // Basic Web Vitals tracking if gtag is available
      const reportMetric = (metric: any) => {
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
          });
        }
      };

      // Try to load and use web vitals
      import('next/web-vitals')
        .then(({ useReportWebVitals }) => {
          useReportWebVitals(reportMetric);
        })
        .catch(() => {
          console.log('Web Vitals not available');
        });

    } catch (error) {
      console.warn('Error in client optimizations:', error);
    }
  }, []);

  return null;
}
