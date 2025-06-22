// Tipos globales para el proyecto InterTravel

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: {
        event_category?: string;
        event_label?: string;
        value?: number;
        non_interaction?: boolean;
        [key: string]: any;
      }
    ) => void;
    dataLayer?: any[];
    fbq?: (action: string, event: string, data?: any) => void;
    gtag_report_conversion?: (url?: string) => boolean;
    // Para conexión de red
    connection?: {
      effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
      saveData?: boolean;
      downlink?: number;
      rtt?: number;
    };
  }

  namespace Navigator {
    interface Navigator {
      connection?: {
        effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
        saveData?: boolean;
        downlink?: number;
        rtt?: number;
      };
    }
  }
}

export {};
