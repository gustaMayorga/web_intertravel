// ===============================================
// CONFIGURACIÓN API CENTRALIZADA
// ===============================================

export const API_CONFIG = {
  // URLs base
  BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3002/api' 
    : '/api',
  
  // Endpoints específicos
  ENDPOINTS: {
    // App cliente endpoints
    APP_LOGIN: '/app/auth/login',
    APP_REGISTER: '/app/auth/register',
    APP_REFRESH: '/app/auth/refresh',
    APP_LOGOUT: '/app/auth/logout',
    APP_PROFILE: '/app/user/profile',
    APP_BOOKINGS: '/app/user/bookings',
    APP_HEALTH: '/app/health',
    
    // Payment endpoints
    APP_CREATE_PAYMENT: '/app/payments/create-payment',
    APP_PAYMENT_HISTORY: '/app/payments/history',
    
    // Integration endpoints
    INTEGRATIONS_HEALTH: '/integrations/health',
    INTEGRATIONS_WHATSAPP_SEND: '/integrations/whatsapp/send-message',
    INTEGRATIONS_ANALYTICS_TRACK: '/integrations/analytics/track-event',
    
    // Admin endpoints (para futuro uso)
    ADMIN_LOGIN: '/admin/auth/login',
    ADMIN_STATS: '/admin/stats',
    ADMIN_BOOKINGS: '/admin/bookings',
    ADMIN_USERS: '/admin/users',
    
    // Public endpoints
    PACKAGES: '/packages',
    SEARCH: '/search',
    HEALTH: '/health'
  }
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Construye URL completa para un endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Configuración por defecto para fetch requests
 */
export const getDefaultHeaders = (includeAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Helper para hacer requests autenticados con auto-refresh
 */
export const authenticatedFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('authToken');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(url, {
    ...options,
    headers
  });
  
  // Si el token expiró, intentar renovarlo
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers
      });
    }
  }
  
  return response;
};

/**
 * Helper para hacer requests públicos
 */
export const publicFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const headers = {
    ...getDefaultHeaders(false),
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};

// ===============================================
// TIPOS PARA RESPUESTAS API
// ===============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  };
  message?: string;
  error?: string;
}

export interface RegisterResponse extends LoginResponse {}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  memberSince: string;
}

// ===============================================
// FUNCIONES DE AUTENTICACIÓN
// ===============================================

/**
 * Login del usuario
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await publicFetch(API_CONFIG.ENDPOINTS.APP_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  return await response.json();
};

/**
 * Registro del usuario
 */
export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<RegisterResponse> => {
  const response = await publicFetch(API_CONFIG.ENDPOINTS.APP_REGISTER, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  return await response.json();
};

/**
 * Obtener perfil del usuario
 */
export const getUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.APP_PROFILE);
  return await response.json();
};

/**
 * Obtener reservas del usuario
 */
export const getUserBookings = async (): Promise<ApiResponse<any[]>> => {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.APP_BOOKINGS);
  return await response.json();
};

/**
 * Logout del usuario (limpiar storage local)
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Intentar logout en el servidor
    await authenticatedFetch(API_CONFIG.ENDPOINTS.APP_LOGOUT, {
      method: 'POST'
    });
  } catch (error) {
    // Continuar con logout local incluso si falla el servidor
    console.warn('Error en logout del servidor:', error);
  } finally {
    // Limpiar storage local siempre
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};

/**
 * Renovar access token usando refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  
  try {
    const response = await publicFetch(API_CONFIG.ENDPOINTS.APP_REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data.accessToken;
    } else {
      // Refresh token inválido, hacer logout
      logoutUser();
      return null;
    }
  } catch (error) {
    console.error('Error renovando token:', error);
    logoutUser();
    return null;
  }
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Obtener usuario del localStorage
 */
export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// ===============================================
// HEALTH CHECK
// ===============================================

/**
 * Verificar estado de la API
 */
export const checkApiHealth = async (): Promise<ApiResponse> => {
  try {
    const response = await publicFetch(API_CONFIG.ENDPOINTS.APP_HEALTH);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: 'API no disponible'
    };
  }
};

// ===============================================
// FUNCIONES DE PAGOS
// ===============================================

/**
 * Crear pago para una reserva
 */
export const createPayment = async (paymentData: {
  bookingId: number;
  amount: number;
  paymentMethod?: string;
}): Promise<ApiResponse> => {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.APP_CREATE_PAYMENT, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
  return await response.json();
};

/**
 * Obtener historial de pagos del usuario
 */
export const getPaymentHistory = async (): Promise<ApiResponse> => {
  const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.APP_PAYMENT_HISTORY);
  return await response.json();
};

// ===============================================
// FUNCIONES DE ANALYTICS
// ===============================================

/**
 * Trackear evento de analytics
 */
export const trackEvent = async (event: string, properties: any = {}): Promise<void> => {
  try {
    await authenticatedFetch(API_CONFIG.ENDPOINTS.INTEGRATIONS_ANALYTICS_TRACK, {
      method: 'POST',
      body: JSON.stringify({ event, properties })
    });
  } catch (error) {
    // Analytics no debe interrumpir la UX
    console.warn('Error tracking event:', error);
  }
};

/**
 * Verificar estado de integraciones
 */
export const checkIntegrationsHealth = async (): Promise<ApiResponse> => {
  try {
    const response = await publicFetch(API_CONFIG.ENDPOINTS.INTEGRATIONS_HEALTH);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Integraciones no disponibles'
    };
  }
};

export default API_CONFIG;
