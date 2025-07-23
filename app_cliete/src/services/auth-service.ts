// auth-service.ts - CORREGIDO SSR + localStorage
import { apiClient } from './api-client';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone?: string;
    role: string;
  };
  token: string;
  message: string;
}

class AuthService {
  private readonly API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.intertravel.com.ar/api/app/auth' 
    : 'http://localhost:3002/api/app/auth';
  private readonly TOKEN_KEY = 'intertravel_token';
  private readonly USER_KEY = 'intertravel_user';

  // ==========================================
  // SOLUCIÓN SSR: Verificar si estamos en el browser
  // ==========================================
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Guarda el token JWT en localStorage (solo en browser)
   */
  private setToken(token: string): void {
    if (!this.isBrowser()) {
      console.log('️ SSR: No se puede guardar token en servidor');
      return;
    }
    
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      apiClient.setToken(token);
      console.log(' Token guardado exitosamente');
    } catch (error) {
      console.error(' Error al guardar token:', error);
    }
  }

  /**
   * Obtiene el token JWT desde localStorage
   */
  public getToken(): string | null {
    if (!this.isBrowser()) {
      console.log('️ SSR: No hay localStorage en servidor');
      return null;
    }
    
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token) {
        console.log(' Token recuperado desde localStorage');
        return token;
      }
      return null;
    } catch (error) {
      console.error(' Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Guarda usuario en localStorage (solo en browser)
   */
  private setUser(user: any): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      console.log(' Usuario guardado exitosamente');
    } catch (error) {
      console.error(' Error al guardar usuario:', error);
    }
  }

  /**
   * Obtiene usuario desde localStorage
   */
  public getUser(): any | null {
    if (!this.isBrowser()) {
      console.log('️ SSR: No hay localStorage en servidor');
      return null;
    }
    
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log(' Usuario recuperado desde localStorage');
        return user;
      }
      return null;
    } catch (error) {
      console.error(' Error al obtener usuario:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    
    const isAuth = !!(token && user);
    console.log(' Verificando estado de autenticación...');
    console.log('Token presente:', !!token);
    console.log('Usuario presente:', !!user);
    console.log('Estado autenticación:', isAuth);
    
    return isAuth;
  }

  /**
   * Login del usuario
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log(' Iniciando proceso de login...');
      console.log(' Email:', email);

      const response = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(' Error en login:', data.message || 'Error desconocido');
        throw new Error(data.message || 'Error en el login');
      }

      console.log(' Login exitoso:', data.message);
      console.log(' Usuario:', data.user.fullName);

      // CRÍTICO: Guardar token y usuario
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error(' Error en login:', error);
      throw error;
    }
  }

  /**
   * Logout del usuario
   */
  public logout(): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      apiClient.removeToken();
      console.log(' Logout exitoso - Datos eliminados');
    } catch (error) {
      console.error(' Error en logout:', error);
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dni: string;
  }): Promise<any> {
    try {
      console.log(' Iniciando proceso de registro...');
      console.log(' Email:', userData.email);
      console.log(' Nombre:', userData.firstName, userData.lastName);

      const response = await fetch(`${this.API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(' Error en registro:', data.message || 'Error desconocido');
        throw new Error(data.message || 'Error en el registro');
      }

      console.log(' Registro exitoso:', data.message);
      return data;
    } catch (error) {
      console.error(' Error en registro:', error);
      throw error;
    }
  }

  /**
   * Verificar DNI existente
   */
  async checkDNI(dni: string): Promise<{ exists: boolean; user?: any }> {
    try {
      console.log(' Verificando DNI:', dni);

      const response = await fetch(`${this.API_URL}/check-dni/${dni}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(' Error verificando DNI:', data.message);
        throw new Error(data.message || 'Error verificando DNI');
      }

      console.log(' Verificación DNI exitosa:', data.exists ? 'Existe' : 'No existe');
      return data;
    } catch (error) {
      console.error(' Error verificando DNI:', error);
      throw error;
    }
  }

  /**
   * Inicializar estado de autenticación (solo en browser)
   */
  public initializeAuth(): void {
    if (!this.isBrowser()) {
      console.log('️ SSR: Saltando inicialización de auth en servidor');
      return;
    }

    console.log(' Verificando estado de autenticación al cargar...');
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      apiClient.setToken(token);
      console.log(' Autenticación restaurada desde localStorage');
    } else {
      console.log('ℹ️ No hay autenticación previa');
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();

// Inicializar solo en browser
if (typeof window !== 'undefined') {
  authService.initializeAuth();
}

export default authService;