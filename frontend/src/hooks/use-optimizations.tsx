'use client';

import { useEffect } from 'react';

// Web Vitals monitoring hook simplificado
export function useWebVitals() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Función simplificada para reportar métricas
    const reportMetric = (metric: any) => {
      // Send to Google Analytics 4 si está disponible
      try {
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
          });
        }
      } catch (error) {
        console.warn('Error reporting to GA:', error);
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Web Vital: ${metric.name}`, {
          value: metric.value,
          rating: metric.rating || 'unknown'
        });
      }
    };

    // Importar dinámicamente next/web-vitals si está disponible
    import('next/web-vitals').then(({ useReportWebVitals }) => {
      useReportWebVitals(reportMetric);
    }).catch(() => {
      // Si no está disponible, continúa sin métricas
      console.log('Web Vitals not available');
    });

  }, []);
}

// Performance optimization utilities
export const usePerformanceOptimizations = () => {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    try {
      // Preload critical resources
      const preloadCriticalResources = () => {
        // Preload key images
        const criticalImages = [
          '/logo-intertravel.svg',
          '/og-image.jpg'
        ];

        criticalImages.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          document.head.appendChild(link);
        });

        // Preload key fonts
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2';
        document.head.appendChild(link);
      };

      // Service Worker registration for caching
      const registerServiceWorker = () => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
              console.log('SW registration failed: ', registrationError);
            });
        }
      };

      // Execute optimizations
      preloadCriticalResources();
      registerServiceWorker();

      // Connection-aware loading
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        // Reduce quality for slow connections
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
        }

        // Preload less aggressively on limited data
        if (connection?.saveData) {
          document.documentElement.classList.add('save-data');
        }
      }

    } catch (error) {
      console.warn('Error in performance optimizations:', error);
    }
  }, []);

  // Performance measurement
  const measurePerformance = (name: string, fn: () => void) => {
    try {
      const startTime = performance.now();
      fn();
      const endTime = performance.now();
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: name,
          value: Math.round(endTime - startTime)
        });
      }
    } catch (error) {
      console.warn('Error measuring performance:', error);
      fn(); // Ejecutar la función de todos modos
    }
  };

  return { measurePerformance };
};

// SEO optimizations
export const useSEOOptimizations = () => {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    try {
      // Dynamic title updates based on page activity
      const updatePageTitle = () => {
        const originalTitle = document.title;
        let isVisible = true;

        document.addEventListener('visibilitychange', () => {
          if (document.hidden && isVisible) {
            document.title = '🌍 ¡Vuelve a InterTravel! - Ofertas esperándote';
            isVisible = false;
          } else if (!document.hidden && !isVisible) {
            document.title = originalTitle;
            isVisible = true;
          }
        });
      };

      // Enhance accessibility
      const enhanceAccessibility = () => {
        // Add skip links if not present
        if (!document.querySelector('.skip-link')) {
          const skipLink = document.createElement('a');
          skipLink.className = 'skip-link';
          skipLink.href = '#main-content';
          skipLink.textContent = 'Saltar al contenido principal';
          skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 1000;
            transition: top 0.2s;
          `;
          
          skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
          });
          
          skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
          });

          document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Ensure main content has ID
        if (!document.getElementById('main-content')) {
          const main = document.querySelector('main') || document.body;
          main.id = 'main-content';
        }
      };

      updatePageTitle();
      enhanceAccessibility();

    } catch (error) {
      console.warn('Error in SEO optimizations:', error);
    }
  }, []);
};

// Complete optimization hook - FUNCIÓN PRINCIPAL EXPORTADA
export function useOptimizations() {
  try {
    useWebVitals();
    const { measurePerformance } = usePerformanceOptimizations();
    useSEOOptimizations();

    return { measurePerformance };
  } catch (error) {
    console.warn('Error in useOptimizations:', error);
    // Retornar función de fallback
    return { 
      measurePerformance: (name: string, fn: () => void) => {
        try {
          fn();
        } catch (err) {
          console.warn('Error in measurePerformance fallback:', err);
        }
      }
    };
  }
}

// Exportación por defecto también para compatibilidad
export default useOptimizations;