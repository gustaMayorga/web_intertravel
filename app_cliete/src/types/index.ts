// ===============================================
// TIPOS EXTENDIDOS - INTERTRAVEL APP CLIENTE
// ===============================================

import { User as BaseUser } from '@/services/api-client';

// Extender el tipo User base con propiedades adicionales
export interface ExtendedUser extends BaseUser {
  photoURL?: string;
  displayName?: string;
  // Propiedades adicionales para compatibilidad
  signOut?: () => void;
}

// Alias para mantener compatibilidad
export type User = ExtendedUser;

// Tipos para autenticación extendida
export interface AuthContextType {
  currentUser: ExtendedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  // Aliases para compatibilidad
  signOut: () => void;
  refreshUser: () => Promise<boolean>;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: ExtendedUser;
  error?: string;
  token?: string;
}

// Tipos para componentes UI
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Tipos para manejo de errores
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}

// Tipos para navegación
export interface NavItem {
  title: string;
  href: string;
  icon?: any;
  disabled?: boolean;
}

// Tipos para paquetes de viaje
export interface TravelPackage {
  id: string;
  title: string;
  description: string;
  destination: string;
  country: string;
  price: number;
  currency: string;
  duration: number;
  images: string[];
  features: string[];
  available: boolean;
}

// Tipos para reservas
export interface BookingFormData {
  packageId: string;
  travelDate: string;
  returnDate: string;
  travelersCount: number;
  specialRequests?: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// Exportar todo como módulo
export default {
  ExtendedUser,
  AuthContextType,
  AuthResult,
  ToastOptions,
  AppError,
  LoginForm,
  RegisterForm,
  NavItem,
  TravelPackage,
  BookingFormData,
  Notification
};