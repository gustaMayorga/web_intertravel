// Configuración para PRODUCCIÓN - InterTravel App Cliente
export const backendConfig = {
  // URLs del backend
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.intertravel.com.ar' // Cambiar por tu dominio real
    : 'http://localhost:3002',
  
  // Endpoints principales
  endpoints: {
    auth: '/api/app/auth',
    user: '/api/app/user',
    bookings: '/api/app/user/bookings',
    stats: '/api/app/user/stats',
    health: '/api/app/health'
  },
  
  // Configuración de timeout
  timeout: 10000,
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // Configuración de producción
  production: {
    apiUrl: 'https://api.intertravel.com.ar',
    version: '1.0.0',
    enableAnalytics: true,
    enableErrorReporting: true
  }
};

// Helper para construir URLs completas
export const buildAPIUrl = (endpoint: string) => {
  return `${backendConfig.baseURL}${endpoint}`;
};

// Configuración de Firebase para notificaciones push (producción)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyExample",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "intertravel-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "intertravel-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "intertravel-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Configuración de la aplicación
export const appConfig = {
  name: 'InterTravel App',
  version: '1.0.0',
  description: 'Aplicación móvil para clientes InterTravel',
  supportEmail: 'support@intertravel.com.ar',
  supportPhone: '+54 11 1234-5678',
  
  // URLs importantes
  urls: {
    website: 'https://intertravel.com.ar',
    termsOfService: 'https://intertravel.com.ar/terms',
    privacyPolicy: 'https://intertravel.com.ar/privacy',
    support: 'https://intertravel.com.ar/support'
  }
};
