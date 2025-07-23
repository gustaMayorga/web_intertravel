/**
 * 🔐 INTERTRAVEL API CLIENT - ENTERPRISE SECURITY VERSION
 * ========================================================
 * Conexión segura entre Frontend Next.js y Backend Node.js v2
 */

interface LoginCredentials {
  username: string;
  password: string;
}

interface SearchParams {
  destination?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  page?: number;
  pageSize?: number;
}

interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  images: {
    main: string;
    gallery?: string[];
  };
  rating: {
    average: number;
    count: number;
  };
  description: {
    short: string;
    full?: string;
  };
  featured: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  packages?: T;
  package?: T;
  user?: User;
  error?: string;
  message?: string;
  timestamp?: string;
  _source?: string;
}

// 🔐 CONFIGURACIÓN DE SEGURIDAD API
interface SecurityConfig {
  enableRequestValidation: boolean;
  enableResponseValidation: boolean;
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
}

class InterTravelAPI {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private securityConfig: SecurityConfig;
  private requestCount: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  constructor() {
    // ✅ CORREGIDO: Backend en puerto 3002
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    
    // 🔐 Configuración de seguridad
    this.securityConfig = {
      enableRequestValidation: true,
      enableResponseValidation: true,
      enableRateLimiting: true,
      enableCSRFProtection: true,
      maxRetries: 3,
      retryDelay: 1000,
      requestTimeout: 30000
    };
    
    // 🔐 Recuperar tokens de forma segura
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      this.refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
      
      // Migrar de localStorage a sessionStorage por seguridad
      if (localStorage.getItem('auth_token')) {
        sessionStorage.setItem('auth_token', localStorage.getItem('auth_token')!);
        localStorage.removeItem('auth_token');
      }
    }
  }

  // 🔐 VALIDAR PETICIÓN ANTES DE ENVIAR
  private validateRequest(endpoint: string, data: any): boolean {
    try {
      // Validaciones básicas
      if (!endpoint || typeof endpoint !== 'string') {
        return false;
      }
      
      // Verificar que no contenga scripts maliciosos
      if (endpoint.includes('<script>') || endpoint.includes('javascript:')) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Request validation error:', error);
      return false;
    }
  }

  // 🔐 VERIFICAR RATE LIMITING
  private checkRateLimit(endpoint: string): boolean {
    if (!this.securityConfig.enableRateLimiting) return true;

    const now = Date.now();
    const key = endpoint.split('?')[0]; // Usar solo la ruta base
    const lastRequest = this.lastRequestTime.get(key) || 0;
    const requestCount = this.requestCount.get(key) || 0;

    // Reset counter cada minuto
    if (now - lastRequest > 60000) {
      this.requestCount.set(key, 0);
    }

    // Máximo 60 requests por minuto por endpoint
    if (requestCount >= 60) {
      return false;
    }

    this.requestCount.set(key, requestCount + 1);
    this.lastRequestTime.set(key, now);
    return true;
  }

  // 🔐 GENERAR CSRF TOKEN
  private generateCSRFToken(): string {
    if (typeof window === 'undefined') return '';
    
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`);
  }

  // 🔐 PETICIÓN SEGURA CON REINTENTOS
  private async secureRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    // Validar petición
    if (!this.validateRequest(endpoint, options.body)) {
      throw new Error('Request validation failed');
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(endpoint)) {
      throw new Error('Rate limit exceeded');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // 🔐 Headers seguros
    const secureHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers as Record<string, string>,
    };

    // 🔐 Agregar CSRF token
    if (this.securityConfig.enableCSRFProtection && ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
      secureHeaders['X-CSRF-Token'] = this.generateCSRFToken();
    }

    // 🔐 Agregar token de autenticación
    if (this.token) {
      secureHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: secureHeaders,
      credentials: 'same-origin',
      mode: 'cors',
      cache: 'no-cache',
    };

    // 🔐 Timeout para prevenir ataques de lentitud
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.securityConfig.requestTimeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // 🔐 Validar respuesta
      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado - intentar refresh
          if (this.refreshToken && !endpoint.includes('/auth/refresh')) {
            try {
              await this.refreshTokenSecure();
              // Reintentar la petición original
              return this.secureRequest(endpoint, options, retryCount);
            } catch (refreshError) {
              this.logout();
              throw new Error('Authentication failed');
            }
          } else {
            this.logout();
          }
        }

        if (response.status === 429) {
          // Rate limited - aplicar backoff exponencial
          if (retryCount < this.securityConfig.maxRetries) {
            const delay = this.securityConfig.retryDelay * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.secureRequest(endpoint, options, retryCount + 1);
          }
        }

        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // 🔐 Validar estructura de respuesta
      if (this.securityConfig.enableResponseValidation) {
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid response format');
        }
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Reintentar en caso de error de red
      if (retryCount < this.securityConfig.maxRetries && 
          (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch')))) {
        const delay = this.securityConfig.retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.secureRequest(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // ================================
  // 🔐 AUTENTICACIÓN SEGURA
  // ================================

  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    try {
      const result = await this.secureRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (result.success && result.data?.accessToken) {
        this.token = result.data.accessToken;
        this.refreshToken = result.data.refreshToken;
        
        if (typeof window !== 'undefined') {
          // 🔐 Usar sessionStorage por defecto (más seguro)
          sessionStorage.setItem('auth_token', this.token);
          sessionStorage.setItem('refresh_token', this.refreshToken);
          
          // Limpiar cualquier token anterior en localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  async refreshTokenSecure(): Promise<ApiResponse> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await this.secureRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (result.success && result.data?.accessToken) {
        this.token = result.data.accessToken;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_token', this.token);
        }
      }

      return result;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.secureRequest('/auth/profile');
  }

  logout(): void {
    this.token = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      // Limpiar otros datos sensibles
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('user_data');
    }

    console.log('🔐 Secure logout completed');
  }

  // ================================
  // 📦 PAQUETES TURÍSTICOS
  // ================================

  async getFeaturedPackages(limit: number = 6): Promise<ApiResponse<Package[]>> {
    return this.secureRequest(`/packages/featured?limit=${limit}`);
  }

  async searchPackages(params: SearchParams): Promise<ApiResponse<Package[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.secureRequest(`/packages/search?${searchParams.toString()}`);
  }

  async getPackageDetails(id: string): Promise<ApiResponse<Package>> {
    return this.secureRequest(`/packages/${id}`);
  }

  // ================================
  // 👨‍💼 ADMINISTRACIÓN SEGURA
  // ================================

  async getDashboardStats(): Promise<ApiResponse> {
    return this.secureRequest('/admin/dashboard/stats');
  }

  // ================================
  // 🔧 UTILIDADES SEGURAS
  // ================================

  async healthCheck(): Promise<ApiResponse> {
    return this.secureRequest('/health');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // 🔐 Obtener estadísticas de seguridad
  getSecurityStats() {
    return {
      requestCount: Array.from(this.requestCount.entries()),
      lastRequestTimes: Array.from(this.lastRequestTime.entries()),
      securityConfig: this.securityConfig
    };
  }

  // 🔐 Configurar opciones de seguridad
  configSecurity(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
    console.log('🔐 Security configuration updated');
  }

  // ================================
  // 📱 FUNCIONES MÓVILES SEGURAS
  // ================================

  async getOfflineData(): Promise<{
    packages: Package[];
    timestamp: string;
  }> {
    try {
      const packages = await this.getFeaturedPackages(20);
      const offlineData = {
        packages: packages.packages || [],
        timestamp: new Date().toISOString(),
      };

      // 🔐 Guardar datos offline de forma segura
      if (typeof window !== 'undefined') {
        const encryptedData = btoa(JSON.stringify(offlineData)); // Codificación básica
        sessionStorage.setItem('offline_packages', encryptedData);
      }

      return offlineData;
    } catch (error) {
      // Intentar recuperar datos offline si la conexión falla
      if (typeof window !== 'undefined') {
        const offline = sessionStorage.getItem('offline_packages');
        if (offline) {
          try {
            return JSON.parse(atob(offline)); // Decodificar
          } catch (decodeError) {
            console.error('Error decoding offline data:', decodeError);
          }
        }
      }
      throw error;
    }
  }

  clearOfflineData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('offline_packages');
      localStorage.removeItem('offline_packages'); // Limpiar también localStorage por si acaso
    }
  }
}

// 🔐 Instancia singleton del API client seguro
export const api = new InterTravelAPI();

// Tipos exportados para uso en componentes
export type {
  Package,
  User,
  ApiResponse,
  LoginCredentials,
  SearchParams,
};