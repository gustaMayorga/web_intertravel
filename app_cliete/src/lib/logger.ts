// ===============================================
// LOGGER OPTIMIZADO - INTERTRAVEL
// ===============================================

type LogLevel = 'error' | 'warn' | 'info' | 'success' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  userId?: string;
}

class InterTravelLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    return `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      success: '✅',
      debug: '🔍'
    };
    return emojis[level];
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  error(message: string, error?: any, context?: any): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context: error || context
    };

    console.error(this.formatMessage('error', message), error || context);
    this.addToHistory(entry);

    // En producción, enviar a servicio de monitoreo
    if (!this.isDevelopment) {
      this.sendToMonitoring(entry);
    }
  }

  warn(message: string, context?: any): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context
    };

    console.warn(this.formatMessage('warn', message), context);
    this.addToHistory(entry);
  }

  info(message: string, context?: any): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context
    };

    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message), context);
    }
    this.addToHistory(entry);
  }

  success(message: string, context?: any): void {
    const entry: LogEntry = {
      level: 'success',
      message,
      timestamp: new Date().toISOString(),
      context
    };

    console.log(this.formatMessage('success', message), context);
    this.addToHistory(entry);
  }

  debug(message: string, context?: any): void {
    if (!this.isDevelopment) return;

    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context
    };

    console.debug(this.formatMessage('debug', message), context);
    this.addToHistory(entry);
  }

  // Métodos especializados para InterTravel
  userAction(userId: string, action: string, details?: any): void {
    this.info(`User Action: ${action}`, { userId, ...details });
  }

  apiCall(method: string, endpoint: string, status: number, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API Call: ${method} ${endpoint} - ${status}`, { duration });
  }

  bookingEvent(bookingId: string, event: string, details?: any): void {
    this.info(`Booking Event: ${event}`, { bookingId, ...details });
  }

  paymentEvent(paymentId: string, event: string, amount?: number, details?: any): void {
    this.info(`Payment Event: ${event}`, { paymentId, amount, ...details });
  }

  private log(level: LogLevel, message: string, context?: any): void {
    switch (level) {
      case 'error':
        this.error(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'info':
        this.info(message, context);
        break;
      case 'success':
        this.success(message, context);
        break;
      case 'debug':
        this.debug(message, context);
        break;
    }
  }

  // Obtener historial de logs
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Limpiar historial
  clearHistory(): void {
    this.logs = [];
  }

  // Exportar logs para debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      // Aquí se integraría con servicio como Sentry, LogRocket, etc.
      // Por ahora solo almacenar en localStorage para debugging
      const existingLogs = localStorage.getItem('intertravel_logs') || '[]';
      const logs = JSON.parse(existingLogs);
      logs.push(entry);
      
      // Mantener solo los últimos 50 logs en localStorage
      const recentLogs = logs.slice(-50);
      localStorage.setItem('intertravel_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to send log to monitoring:', error);
    }
  }
}

// Instancia singleton
export const logger = new InterTravelLogger();

// Hooks de conveniencia para React
export const useLogger = () => {
  return {
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    info: logger.info.bind(logger),
    success: logger.success.bind(logger),
    debug: logger.debug.bind(logger),
    userAction: logger.userAction.bind(logger),
    apiCall: logger.apiCall.bind(logger),
    bookingEvent: logger.bookingEvent.bind(logger),
    paymentEvent: logger.paymentEvent.bind(logger)
  };
};

export default logger;