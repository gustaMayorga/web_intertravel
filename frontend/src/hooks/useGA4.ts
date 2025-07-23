// ===============================================
// useGA4 Hook para tracking automático
// ===============================================

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  trackViewItemList,
  trackViewItem,
  trackSearch,
  trackWhatsAppContact,
  trackScrollDepth,
  trackTimeOnPage
} from '../utils/ga4-tracking';

export function useGA4() {
  const router = useRouter();

  // Track page views automáticamente
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof gtag !== 'undefined') {
        gtag('config', process.env.NEXT_PUBLIC_GA4_ID, {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Auto-track scroll depth
  useEffect(() => {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 90, 100];
    const trackedMilestones = new Set();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      milestones.forEach(milestone => {
        if (maxScroll >= milestone && !trackedMilestones.has(milestone)) {
          trackScrollDepth(milestone);
          trackedMilestones.add(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-track time on page
  useEffect(() => {
    const startTime = Date.now();
    
    const trackTimeBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackTimeOnPage(timeSpent);
    };

    window.addEventListener('beforeunload', trackTimeBeforeUnload);
    return () => window.removeEventListener('beforeunload', trackTimeBeforeUnload);
  }, []);

  return {
    trackPackageView: trackViewItem,
    trackPackagesList: trackViewItemList,
    trackSearch: trackSearch,
    trackWhatsAppContact: trackWhatsAppContact
  };
}

export default useGA4;