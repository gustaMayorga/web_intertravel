// ===============================================
// ERROR BOUNDARY - INTERTRAVEL
// ===============================================

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error
    logger.error('React Error Boundary caught an error', error, {
      errorInfo,
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'InterTravelErrorBoundary'
    });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    logger.info('User clicked retry on error boundary', { errorId: this.state.errorId });
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    logger.info('User clicked go home on error boundary', { errorId: this.state.errorId });
    window.location.href = '/';
  };

  handleReportError = () => {
    logger.info('User clicked report error', { errorId: this.state.errorId });
    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Describe here]
    `);
    window.open(`mailto:soporte@intertravel.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-gray-600 mb-4">
                Se produjo un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 font-mono">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar nuevamente
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 flex items-center justify-center transition-colors duration-200"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reportar este error
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalles técnicos (solo en desarrollo)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono text-gray-600 overflow-auto max-h-32">
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar error boundary programáticamente
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    logger.error('Manual error capture', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Error Boundary específico para rutas
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('Route Error Boundary', error, {
          ...errorInfo,
          route: window.location.pathname
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error Boundary para componentes de API
export function ApiErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error de Conexión</h3>
          <p className="text-red-600 mb-4">
            No se pudo cargar este contenido. Verifica tu conexión a internet.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Recargar página
          </button>
        </div>
      }
      onError={(error, errorInfo) => {
        logger.error('API Error Boundary', error, {
          ...errorInfo,
          type: 'api_error'
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;